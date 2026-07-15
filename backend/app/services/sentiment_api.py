"""
Async client for the external SentimentAPI (docs/SENTIMENTAPI_CONTRACT.md).

Every call is Redis-cache-first (services/cache.py) — the pro tier allows
120 req / 60 s, so all traffic from the website must be absorbed by these
caches. The Bearer key never leaves this module and upstream bodies are
never logged.
"""
import logging

import httpx

from app.config import settings
from app.services.cache import get_cached, set_cached

logger = logging.getLogger(__name__)

TICKERS_TTL = 86400   # fixed S&P 500 snapshot
SENT_TTL = 900        # scoring tick is 15 min market-hours / 30 min off
HIST_TTL = 1800       # history changes only on ticks
OVERVIEW_TTL = 900
OVERVIEW_NEG_TTL = 300  # negative cache while the endpoint is undeployed


class UpstreamUnavailable(Exception):
    """SentimentAPI could not serve the request (config/auth/rate-limit/5xx/network)."""


class TickerNotFound(Exception):
    """Upstream 404 — ticker outside the supported universe."""


_client: httpx.AsyncClient | None = None
_key_error_logged = False


def _get_client() -> httpx.AsyncClient:
    global _client, _key_error_logged
    if not settings.PRO_API_KEY:
        # Amendment 3: a blank key must be loud, not a silent 401→503 cascade.
        if not _key_error_logged:
            logger.error(
                "PRO_API_KEY is not configured — refusing to call SentimentAPI. "
                "Set PRO_API_KEY in backend/.env."
            )
            _key_error_logged = True
        raise UpstreamUnavailable("SentimentAPI key not configured")
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=settings.SENTIMENT_API_BASE_URL,
            headers={"Authorization": f"Bearer {settings.PRO_API_KEY}"},
            timeout=10.0,
        )
    return _client


async def _get(path: str, params: dict | None = None) -> httpx.Response:
    client = _get_client()
    try:
        return await client.get(path, params=params)
    except httpx.HTTPError as exc:
        logger.warning("SentimentAPI network error on %s: %s", path, type(exc).__name__)
        raise UpstreamUnavailable("network error") from exc


def _raise_for_hard_failure(res: httpx.Response, path: str) -> None:
    if res.status_code in (401, 403, 429) or res.status_code >= 500:
        logger.warning("SentimentAPI HTTP %s on %s", res.status_code, path)
        raise UpstreamUnavailable(f"upstream {res.status_code}")


async def get_universe() -> dict[str, dict]:
    """{TICKER: {"name": ..., "sector": ...}} for the 502-name universe."""
    cached = await get_cached("sapi:tickers")
    if cached is not None:
        return cached
    res = await _get("/v1/tickers")
    _raise_for_hard_failure(res, "/v1/tickers")
    body = res.json()
    universe = {
        t["ticker"]: {"name": t.get("name"), "sector": t.get("sector")}
        for t in body.get("tickers", [])
    }
    if universe:
        await set_cached("sapi:tickers", universe, TICKERS_TTL)
    return universe


async def get_sentiment(ticker: str) -> dict:
    """Full pro payload. May be a NoDataResponse body (has a 'status' key)."""
    key = f"sapi:sent:{ticker}"
    cached = await get_cached(key)
    if cached is not None:
        return cached
    res = await _get(f"/v1/sentiment/{ticker}", params={"detail": "full"})
    _raise_for_hard_failure(res, "/v1/sentiment")
    body = res.json()
    # Cache NoDataResponse bodies too (ticker_not_found is stable for 900s).
    await set_cached(key, body, SENT_TTL)
    return body


async def get_history(ticker: str, days: int, interval: str) -> dict:
    key = f"sapi:hist:{ticker}:{days}:{interval}"
    cached = await get_cached(key)
    if cached is not None:
        return cached
    res = await _get(
        f"/v1/sentiment/{ticker}/history",
        params={"days": days, "interval": interval},
    )
    if res.status_code == 404:
        raise TickerNotFound(ticker)
    _raise_for_hard_failure(res, "/v1/sentiment/history")
    body = res.json()
    await set_cached(key, body, HIST_TTL)
    return body


async def get_overview() -> dict | None:
    """Market overview blob, or None while upstream hasn't shipped/computed it.

    Upstream 404 (route undeployed) and 503 (no tick yet) are both treated as
    "unavailable" and negative-cached so page loads don't re-probe constantly.
    """
    cached = await get_cached("sapi:overview")
    if cached is not None:
        return None if cached.get("_unavailable") else cached
    res = await _get("/v1/market/overview")
    if res.status_code in (404, 503):
        await set_cached("sapi:overview", {"_unavailable": True}, OVERVIEW_NEG_TTL)
        return None
    _raise_for_hard_failure(res, "/v1/market/overview")
    body = res.json()
    await set_cached("sapi:overview", body, OVERVIEW_TTL)
    return body
