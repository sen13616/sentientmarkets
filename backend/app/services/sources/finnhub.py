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
        return (
            datetime.fromtimestamp(ts, tz=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
    except Exception:
        return None


async def get_finnhub_data(ticker: str) -> dict:
    """Fetch company news, insider sentiment (MSPR), and earnings surprises
    from Finnhub for *ticker*. All three requests run concurrently.
    Each section fails independently — errors in one do not affect the others.
    """
    today       = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_ago    = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    # Rolling window: a fixed start date grew the payload (and the cached
    # sentiment blob) monotonically forever.
    six_months_ago = (datetime.now(timezone.utc) - timedelta(days=183)).strftime("%Y-%m-%d")

    news_task      = asyncio.to_thread(_get, "/company-news",             {"symbol": ticker, "from": week_ago, "to": today})
    insider_task   = asyncio.to_thread(_get, "/stock/insider-sentiment",  {"symbol": ticker, "from": six_months_ago, "to": today})
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
                    for r in sorted_records[:12]
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


def _map_news(raw: list) -> list[dict]:
    """Map Finnhub news articles to our display shape, dropping headline-less
    stubs. Field names match what the homepage and stock-page consumers
    already expect (title / source / published_at / description / url)."""
    articles = []
    for article in raw or []:
        headline = article.get("headline")
        if not headline:
            continue
        ts = article.get("datetime")
        articles.append({
            "title":        headline,
            "source":       article.get("source"),
            "published_at": _iso(ts) if ts is not None else None,
            "description":  article.get("summary"),
            "url":          article.get("url"),
        })
    return articles


async def get_market_news() -> dict:
    """Fetch general market headlines from Finnhub for the homepage macro feed.
    Returns the articles list wrapped in a small envelope. Returns an empty
    dict on any error (callers treat that as 'no news').
    """
    try:
        raw = await asyncio.to_thread(_get, "/news", {"category": "general"})
        articles = _map_news(raw if isinstance(raw, list) else [])[:10]
        return {
            "source":        "Finnhub",
            "total_results": len(articles),
            "articles":      articles,
        }
    except Exception as exc:
        logger.error("get_market_news failed: %s", exc)
        return {}


async def get_company_news(ticker: str) -> list[dict]:
    """Latest company news for *ticker* from Finnhub over a 7-day window,
    newest first, at most 9. Returns [] on any error — callers negative-cache
    empty results to shield the rate limit.
    """
    try:
        today    = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
        raw = await asyncio.to_thread(
            _get, "/company-news", {"symbol": ticker, "from": week_ago, "to": today}
        )
        raw = raw if isinstance(raw, list) else []
        raw.sort(key=lambda a: a.get("datetime") or 0, reverse=True)
        return _map_news(raw)[:9]
    except Exception as exc:
        logger.error("get_company_news failed for %s: %s", ticker, exc)
        return []
