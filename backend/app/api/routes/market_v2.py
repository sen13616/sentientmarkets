"""
/api/v2/market/sp500 — one composed payload for the S&P 500 breadth page.

Assembled from three already-cached upstream reads (overview, universe,
one sentiment payload for freshness) plus the same yfinance index-level
mechanism /api/home uses. There is deliberately NO index-level sentiment
score in this payload — the page is built on breadth and dispersion of
constituents. The existing /api/v2/market/overview passthrough is untouched.
"""
import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.services import sentiment_api
from app.services.cache import get_cached, set_cached
from app.services.market_stats import distribution_stats, histogram, widest_sector_gap
from app.services.sanitize import clean_json_floats
from app.services.sentiment_api import UpstreamUnavailable
from app.services.sources.yfinance import get_market_indices

logger = logging.getLogger(__name__)
router = APIRouter()

CACHE_KEY = "sapi:sp500"
TTL_OPEN = 900      # one scoring tick during US market hours
TTL_CLOSED = 1800   # 30-minute tick off-hours
TTL_FLOOR = 60

# market_hours/cache_age_seconds exist only on per-ticker sentiment payloads
# (not on the overview) — read them from a liquid ticker's cached payload.
_FRESHNESS_TICKER = "AAPL"

_UNAVAILABLE = HTTPException(
    status_code=503,
    detail={
        "error": "upstream_unavailable",
        "message": "Sentiment service temporarily unavailable",
    },
)


def _mover(entry: dict, universe: dict) -> dict:
    meta = universe.get(entry.get("ticker")) or {}
    return {
        "ticker": entry.get("ticker"),
        "name": meta.get("name"),
        "score": entry.get("score"),
        "change_1d": entry.get("score_change_1d"),
    }


@router.get("/api/v2/market/sp500")
async def get_sp500():
    cached = await get_cached(CACHE_KEY)
    if cached is not None:
        # Heal any pre-sanitizer poisoned entries on read (sentiment.py lesson).
        return clean_json_floats(cached)

    # Overview is load-bearing; everything else degrades to nulls.
    try:
        overview = await sentiment_api.get_overview()
    except UpstreamUnavailable:
        raise _UNAVAILABLE
    if overview is None:  # upstream 503 before first tick, or route undeployed
        raise _UNAVAILABLE

    universe, freshness_sent, indices = await asyncio.gather(
        sentiment_api.get_universe(),
        sentiment_api.get_sentiment(_FRESHNESS_TICKER),
        get_market_indices(),
        return_exceptions=True,
    )
    if isinstance(universe, Exception):
        logger.warning("sp500: universe join unavailable: %s", universe)
        universe = {}
    if isinstance(freshness_sent, Exception):
        logger.warning("sp500: freshness read unavailable: %s", freshness_sent)
        freshness_sent = {}
    if isinstance(indices, Exception):
        logger.warning("sp500: index level unavailable: %s", indices)
        indices = {}

    # ── ^GSPC level (same mechanism as /api/home) — null when unavailable,
    # never fabricated. ──
    sp = (indices or {}).get("sp500") or {}
    level = None
    if sp.get("price") is not None:
        level = {
            "value": sp.get("price"),
            "change": sp.get("change"),
            "change_pct": sp.get("change_percent"),
        }

    # ── Flatten sectors[].tickers[] into the score list + constituents. ──
    sectors_raw = overview.get("sectors") or []
    scores: list[float] = []
    constituents: list[dict] = []
    for sec in sectors_raw:
        sec_name = sec.get("sector")
        sec_size = sec.get("size")
        for t in sec.get("tickers") or []:
            score = t.get("score")
            if score is not None:
                scores.append(score)
            meta = universe.get(t.get("ticker")) or {}
            constituents.append({
                "ticker": t.get("ticker"),
                "name": meta.get("name"),
                "sector": sec_name,
                "score": score,
                "rank": t.get("rank"),
                "sector_size": sec_size,
            })
    constituents.sort(key=lambda c: c["ticker"] or "")

    universe_scored = overview.get("universe_scored")
    above_50_pct = overview.get("breadth_above_50_pct")
    above_50_count = (
        round(above_50_pct / 100 * universe_scored)
        if above_50_pct is not None and universe_scored else None
    )

    sectors_out = [
        {"sector": s.get("sector"), "average_score": s.get("average_score"), "size": s.get("size")}
        for s in sectors_raw
    ]

    market_hours = freshness_sent.get("market_hours") if isinstance(freshness_sent, dict) else None

    payload = {
        "timestamp": overview.get("timestamp"),
        "universe_scored": universe_scored,
        "level": level,
        "breadth": {
            "above_50_pct": above_50_pct,
            "above_50_count": above_50_count,
            "improving_pct": overview.get("breadth_improving_pct"),
        },
        "stats": distribution_stats(scores),
        "histogram": histogram(scores),
        "sectors": sectors_out,
        "widest_sector_gap": widest_sector_gap(sectors_out),
        "movers": {
            "top": [_mover(m, universe) for m in overview.get("top_movers") or []],
            "bottom": [_mover(m, universe) for m in overview.get("bottom_movers") or []],
        },
        "constituents": constituents,
        "freshness": {
            "cache_age_seconds": freshness_sent.get("cache_age_seconds")
            if isinstance(freshness_sent, dict) else None,
            "market_hours": market_hours,
        },
    }

    # NaN/Inf from stats on degenerate inputs must never reach Redis or the
    # wire (this exact class of bug previously poisoned /api/sentiment).
    payload = clean_json_floats(payload)

    is_open = bool((market_hours or {}).get("is_open"))
    ttl = max(TTL_FLOOR, TTL_OPEN if is_open else TTL_CLOSED)
    await set_cached(CACHE_KEY, payload, ttl)
    return payload
