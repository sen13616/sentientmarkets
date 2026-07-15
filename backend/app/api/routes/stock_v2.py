"""
/api/v2/stock/* — proxy + composition over the external SentimentAPI for the
redesigned stock page. The browser never talks to the upstream directly (the
pro key stays server-side) and every upstream call is Redis-cached in
services/sentiment_api.py.

Fallback boundary (amendment 4): the dark AssetPage fallback is signalled
ONLY by {"in_universe": false} or a hard 503. A ticker that is in-universe
but has no score yet (upstream "insufficient_data") returns 200 with
sentiment=null, and every null-valued derived stat (percentiles, sigma,
sector context, overview) still renders the light page.
"""
import asyncio
import logging

from fastapi import APIRouter, HTTPException, Query

from app.services import sentiment_api
from app.services.sentiment_api import TickerNotFound, UpstreamUnavailable
from app.services.sentiment_stats import (
    GAP_HOURS,
    own_history_percentile,
    pressure_summary,
    segment,
    sigma_7d,
    sort_points,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# GICS sector -> SPDR sector ETF. Valid because /v1/tickers supplies the GICS
# sector for all 502 names (verified live 2026-07-15).
SECTOR_ETFS = {
    "Information Technology": "XLK",
    "Health Care": "XLV",
    "Financials": "XLF",
    "Consumer Discretionary": "XLY",
    "Consumer Staples": "XLP",
    "Energy": "XLE",
    "Industrials": "XLI",
    "Materials": "XLB",
    "Real Estate": "XLRE",
    "Utilities": "XLU",
    "Communication Services": "XLC",
}

_UNAVAILABLE = HTTPException(
    status_code=503,
    detail={
        "error": "upstream_unavailable",
        "message": "Sentiment service temporarily unavailable",
    },
)

# The three Phase-0 pro fields that the deployed upstream may not send yet.
# They must be explicitly null in our payload, never omitted.
_OPTIONAL_SENTIMENT_FIELDS = ("score_change_1d", "score_change_1d_pct", "universe_percentile")


def _chart_point(entry: dict) -> dict:
    return {
        "t": entry["timestamp"],
        "score": entry.get("score"),
        "score_raw": entry.get("score_raw"),
        "confidence": entry.get("confidence"),
        "sub": entry.get("sub_indices") or {},
        "missing_layers": entry.get("missing_layers") or [],
    }


def _sector_context(overview: dict | None, ticker: str, sector: str | None, score) -> dict:
    rank = size = average = delta = None
    if overview and sector:
        for sec in overview.get("sectors", []):
            if sec.get("sector") != sector:
                continue
            size = sec.get("size")
            average = sec.get("average_score")
            for entry in sec.get("tickers", []):
                if entry.get("ticker") == ticker:
                    rank = entry.get("rank")
                    break
            break
    if average is not None and score is not None:
        delta = round(score - average, 1)
    return {"rank": rank, "size": size, "average": average, "delta": delta}


@router.get("/api/v2/stock/{ticker}")
async def get_stock_composite(ticker: str):
    ticker = ticker.upper()
    try:
        universe = await sentiment_api.get_universe()
    except UpstreamUnavailable:
        raise _UNAVAILABLE

    meta = universe.get(ticker)
    if meta is None:
        return {"ticker": ticker, "in_universe": False}

    try:
        sentiment, history, overview = await asyncio.gather(
            sentiment_api.get_sentiment(ticker),
            sentiment_api.get_history(ticker, days=90, interval="daily"),
            sentiment_api.get_overview(),
            return_exceptions=True,
        )
    except Exception:  # pragma: no cover — gather(return_exceptions) shouldn't raise
        raise _UNAVAILABLE

    # The sentiment payload is load-bearing; history/overview degrade to null.
    if isinstance(sentiment, Exception):
        raise _UNAVAILABLE
    if isinstance(history, Exception):
        history = None
    if isinstance(overview, Exception):
        overview = None

    status = sentiment.get("status")
    if status == "ticker_not_found":
        return {"ticker": ticker, "in_universe": False}
    if status == "temporarily_unavailable":
        raise HTTPException(
            status_code=503,
            detail={"error": "temporarily_unavailable", "message": sentiment.get("message") or "Try again shortly"},
        )
    if status == "insufficient_data":
        # In universe, no scored data yet — the light page renders a pending state.
        sentiment = None

    sentiment_out = None
    score = None
    if sentiment is not None:
        sentiment_out = dict(sentiment)
        for field in _OPTIONAL_SENTIMENT_FIELDS:
            sentiment_out[field] = sentiment.get(field)
        score = sentiment.get("score")

    points = sort_points(history.get("history", [])) if history else []
    sector = meta.get("sector")
    sigma, sigma_label = sigma_7d(points)
    sector_ctx = _sector_context(overview, ticker, sector, score)

    return {
        "ticker": ticker,
        "in_universe": True,
        "meta": {
            "name": meta.get("name"),
            "sector": sector,
            "sector_etf": SECTOR_ETFS.get(sector) if sector else None,
        },
        "sentiment": sentiment_out,
        "context": {
            "universe_percentile": sentiment_out.get("universe_percentile") if sentiment_out else None,
            "universe_size": len(universe),
            "own_history_percentile": own_history_percentile(score, points),
            "sector_rank": sector_ctx["rank"],
            "sector_size": sector_ctx["size"],
            "sector_average": sector_ctx["average"],
            "sector_delta": sector_ctx["delta"],
        },
        # Amendment 5: sigma is computed over ~7 DAILY points from the 90-day
        # series — a daily-resolution stability measure, not intraday.
        "stability": {"sigma_7d": sigma, "label": sigma_label},
        "pressure": pressure_summary(points),
    }


@router.get("/api/v2/stock/{ticker}/history")
async def get_stock_history(ticker: str, days: int = Query(30)):
    if days not in (7, 30, 90):
        raise HTTPException(
            status_code=422,
            detail={"error": "invalid_days", "message": "days must be one of 7, 30, 90"},
        )
    ticker = ticker.upper()
    interval = "hourly" if days == 7 else "daily"
    try:
        history = await sentiment_api.get_history(ticker, days=days, interval=interval)
    except TickerNotFound:
        raise HTTPException(
            status_code=404,
            detail={"error": "ticker_not_found", "message": f"Ticker {ticker} is not in the supported universe"},
        )
    except UpstreamUnavailable:
        raise _UNAVAILABLE

    entries = sort_points(history.get("history", []))
    segments, gaps = segment(entries, GAP_HOURS[interval])
    points = [_chart_point(e) for e in entries]
    return {
        "ticker": ticker,
        "days": days,
        "interval": interval,
        "points": points,
        "segments": segments,
        "gaps": gaps,
    }


@router.get("/api/v2/market/overview")
async def get_market_overview():
    try:
        overview = await sentiment_api.get_overview()
    except UpstreamUnavailable:
        raise _UNAVAILABLE
    if overview is None:
        return {"available": False}
    return {"available": True, **overview}
