"""
Screener blob builder. Upstream has NO bulk endpoint — per-ticker
/v1/sentiment/{t}?detail=full is the only source of sub-indices,
confidence, percentile, and freshness — so a scheduled sweep walks the
universe through the Redis-first client and caches ONE composed blob
(sapi:screener) that the /api/v2/market/screener route serves without
ever touching upstream per-request.

Row derivation lives in pure functions (market_stats pattern) so the
thresholds are unit-testable.
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta

from app.services import sentiment_api
from app.services.cache import get_cached, set_cached
from app.services.sanitize import clean_json_floats
from app.services.sentiment_api import UpstreamUnavailable

logger = logging.getLogger(__name__)

CACHE_KEY = "sapi:screener"
BLOB_TTL = 7200          # serve stale over 503; only complete sweeps overwrite

# Derivation thresholds — documented, adjustable.
SPREAD_TIGHT_LT = 15.0   # spread <15 → tight
SPREAD_WIDE_GT = 30.0    # spread >30 → wide; else moderate
COLD_START_OBS_LT = 12   # ema_obs_count below this → smoothing not converged
STALE_HOURS = 48.0       # any present layer older than this vs the tick → stale

# Sweep pacing: batches of concurrent Redis-first fetches. A batch that
# finishes near-instantly was all-cache (no sleep); a slow batch hit
# upstream, so pause to stay well under the pro 120 req / 60 s window
# (worst case 40 req / ~30 s ≈ 80/min).
BATCH_SIZE = 40
BATCH_BUDGET_S = 27.0
ALL_CACHE_FAST_S = 1.0
MAX_FAILURE_RATIO = 0.2  # abort (keep old blob) if more than this failed

CHANNELS = ("market", "narrative", "influencer", "macro")


def _parse_ts(iso: str | None) -> datetime | None:
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None


def spread_of(sub: dict | None) -> float | None:
    """max − min over PRESENT channel sub-indices; null when <2 present."""
    vals = [v for v in (sub or {}).values() if v is not None]
    if len(vals) < 2:
        return None
    return round(max(vals) - min(vals), 2)


def spread_class(spread: float | None) -> str | None:
    if spread is None:
        return None
    if spread < SPREAD_TIGHT_LT:
        return "tight"
    if spread > SPREAD_WIDE_GT:
        return "wide"
    return "moderate"


def is_cold_start(ema_obs_count) -> bool:
    return ema_obs_count is not None and ema_obs_count < COLD_START_OBS_LT


def is_stale(freshness: dict | None, missing_layers: list | None, tick_iso: str | None) -> bool:
    """True when any PRESENT layer's *_as_of is older than STALE_HOURS
    relative to the payload's scoring tick."""
    tick = _parse_ts(tick_iso)
    if not freshness or tick is None:
        return False
    missing = set(missing_layers or [])
    limit = timedelta(hours=STALE_HOURS)
    for ch in CHANNELS:
        if ch in missing:
            continue
        as_of = _parse_ts(freshness.get(f"{ch}_as_of"))
        if as_of is not None and tick - as_of > limit:
            return True
    return False


def build_row(ticker: str, meta: dict, sentiment: dict, rank_info: dict | None) -> dict | None:
    """One screener row, or None when the ticker has no scored data."""
    if sentiment.get("status") is not None or sentiment.get("score") is None:
        return None
    sub_raw = sentiment.get("sub_indices") or {}
    sub = {ch: sub_raw.get(ch) for ch in CHANNELS}
    spread = spread_of(sub)
    rank_info = rank_info or {}
    return {
        "ticker": ticker,
        "name": meta.get("name"),
        "sector": meta.get("sector"),
        "score": sentiment.get("score"),
        "change_1d": sentiment.get("score_change_1d"),
        "percentile": sentiment.get("universe_percentile"),
        "confidence": sentiment.get("confidence"),
        "sub": sub,
        "spread": spread,
        "spread_class": spread_class(spread),
        "rank": rank_info.get("rank"),
        "sector_size": rank_info.get("size"),
        "missing_layers": sentiment.get("missing_layers") or [],
        "cold_start": is_cold_start(sentiment.get("ema_obs_count")),
        "stale": is_stale(
            sentiment.get("freshness"),
            sentiment.get("missing_layers"),
            sentiment.get("timestamp"),
        ),
    }


def _rank_join(overview: dict | None) -> dict[str, dict]:
    """{ticker: {rank, size}} from the overview's sector groupings."""
    out: dict[str, dict] = {}
    for sec in (overview or {}).get("sectors") or []:
        size = sec.get("size")
        for t in sec.get("tickers") or []:
            tick = t.get("ticker")
            if tick:
                out[tick] = {"rank": t.get("rank"), "size": size}
    return out


async def refresh_screener() -> None:
    """Sweep the universe and write a complete sapi:screener blob.
    Failures keep the previous blob (never overwrite with a partial sweep)."""
    started = time.monotonic()
    try:
        universe = await sentiment_api.get_universe()
        try:
            overview = await sentiment_api.get_overview()
        except UpstreamUnavailable:
            overview = None
    except UpstreamUnavailable:
        logger.warning("screener sweep skipped — upstream unavailable at universe fetch")
        return
    if not universe:
        logger.warning("screener sweep skipped — empty universe")
        return

    ranks = _rank_join(overview)
    tickers = sorted(universe.keys())
    payloads: dict[str, dict] = {}
    failures = 0

    async def fetch(t: str):
        nonlocal failures
        try:
            payloads[t] = await sentiment_api.get_sentiment(t)
        except Exception:
            failures += 1

    for i in range(0, len(tickers), BATCH_SIZE):
        batch = tickers[i:i + BATCH_SIZE]
        t0 = time.monotonic()
        await asyncio.gather(*(fetch(t) for t in batch))
        elapsed = time.monotonic() - t0
        # All-cache batches fly; upstream batches pace out the rate window.
        if elapsed > ALL_CACHE_FAST_S and i + BATCH_SIZE < len(tickers):
            await asyncio.sleep(max(0.0, BATCH_BUDGET_S - elapsed))

    if failures > len(tickers) * MAX_FAILURE_RATIO:
        logger.warning(
            "screener sweep aborted — %d/%d fetches failed; keeping previous blob",
            failures, len(tickers),
        )
        return

    rows = []
    tick_timestamp = None
    for t in tickers:
        payload = payloads.get(t)
        if payload is None:
            continue
        row = build_row(t, universe.get(t) or {}, payload, ranks.get(t))
        if row is not None:
            rows.append(row)
            if tick_timestamp is None:
                tick_timestamp = payload.get("timestamp")

    blob = clean_json_floats({
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "tick_timestamp": tick_timestamp,
        "universe_scored": (overview or {}).get("universe_scored") or len(rows),
        "rows": rows,
    })
    await set_cached(CACHE_KEY, blob, BLOB_TTL)
    logger.info(
        "screener sweep complete: %d rows, %d failures, %.1fs",
        len(rows), failures, time.monotonic() - started,
    )


async def get_screener_blob() -> dict | None:
    cached = await get_cached(CACHE_KEY)
    if cached is None:
        return None
    return clean_json_floats(cached)
