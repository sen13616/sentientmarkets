"""
Fetches company news, insider sentiment (MSPR), and earnings surprises from
the Finnhub REST API for a given ticker. All three requests are made
concurrently. Returns data mapped to the relevant sentiment schema sections.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone

import requests

from app.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://finnhub.io/api/v1"


def _get(endpoint: str, extra_params: dict) -> dict | list:
    params = {"token": settings.FINNHUB_API_KEY, **extra_params}
    response = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def _iso(ts) -> str | None:
    try:
        return datetime.utcfromtimestamp(ts).isoformat() + "Z"
    except Exception:
        return None


async def get_finnhub_data(ticker: str) -> dict:
    """Fetch company news, insider sentiment (MSPR), and earnings surprises
    from Finnhub for *ticker*. All three requests run concurrently.
    Each section fails independently — errors in one do not affect the others.
    """
    today     = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_ago  = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")

    news_task      = asyncio.to_thread(_get, "/company-news",             {"symbol": ticker, "from": week_ago, "to": today})
    insider_task   = asyncio.to_thread(_get, "/stock/insider-sentiment",  {"symbol": ticker, "from": "2025-01-01", "to": today})
    earnings_task  = asyncio.to_thread(_get, "/stock/earnings",           {"symbol": ticker})

    news_raw, insider_raw, earnings_raw = await asyncio.gather(
        news_task, insider_task, earnings_task,
        return_exceptions=True,
    )

    # ── Section 1: Company news ───────────────────────────────────────────────
    news = []
    try:
        if isinstance(news_raw, Exception):
            raise news_raw
        for article in (news_raw or [])[:10]:
            ts = article.get("datetime")
            news.append({
                "title":        article.get("headline"),
                "source":       article.get("source"),
                "published_at": _iso(ts) if ts is not None else None,
                "url":          article.get("url"),
                "summary":      article.get("summary"),
            })
    except Exception as exc:
        logger.error("finnhub news failed for %s: %s", ticker, exc)

    # ── Section 2: Insider sentiment (MSPR) ───────────────────────────────────
    insider_sentiment = {}
    try:
        if isinstance(insider_raw, Exception):
            raise insider_raw
        records = insider_raw.get("data") if isinstance(insider_raw, dict) else None
        if records:
            sorted_records = sorted(
                records,
                key=lambda r: (r.get("year", 0), r.get("month", 0)),
                reverse=True,
            )
            latest = sorted_records[0]
            latest_mspr   = latest.get("mspr")
            latest_year   = latest.get("year")
            latest_month  = latest.get("month")

            if latest_mspr is not None and latest_mspr > 0:
                signal = "Net Buying"
            elif latest_mspr is not None and latest_mspr < 0:
                signal = "Net Selling"
            else:
                signal = "Neutral"

            insider_sentiment = {
                "source":        "Finnhub",
                "latest_mspr":   latest_mspr,
                "latest_month":  f"{latest_year}-{latest_month:02d}" if latest_year and latest_month else None,
                "latest_change": latest.get("change"),
                "signal":        signal,
                "history": [
                    {
                        "year":   r.get("year"),
                        "month":  r.get("month"),
                        "mspr":   r.get("mspr"),
                        "change": r.get("change"),
                    }
                    for r in sorted_records
                ],
            }
    except Exception as exc:
        logger.error("finnhub insider sentiment failed for %s: %s", ticker, exc)

    # ── Section 3: Earnings surprises ─────────────────────────────────────────
    earnings_surprises = []
    try:
        if isinstance(earnings_raw, Exception):
            raise earnings_raw
        for record in (earnings_raw or [])[:4]:
            earnings_surprises.append({
                "period":           record.get("period"),
                "actual":           record.get("actual"),
                "estimate":         record.get("estimate"),
                "surprise_percent": record.get("surprisePercent"),
            })
    except Exception as exc:
        logger.error("finnhub earnings surprises failed for %s: %s", ticker, exc)

    return {
        "news":               news,
        "insider_sentiment":  insider_sentiment,
        "earnings_surprises": earnings_surprises,
    }
