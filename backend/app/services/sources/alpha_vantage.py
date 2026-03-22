"""
Fetches news sentiment and RSI technical indicator from the Alpha Vantage API
for a given ticker. Both requests are made concurrently. Returns data mapped
to the news_sentiment and technical_indicators sections of the sentiment schema.
"""
import asyncio
import logging
from datetime import datetime

import requests

from app.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://www.alphavantage.co/query"


def _get(params: dict) -> dict:
    full_params = {"apikey": settings.ALPHA_VANTAGE_API_KEY, **params}
    response = requests.get(BASE_URL, params=full_params, timeout=15)
    response.raise_for_status()
    return response.json()


def _is_rate_limited(data: dict) -> bool:
    if "Note" in data:
        logger.warning("Alpha Vantage rate limit: %s", data["Note"])
        return True
    if "Information" in data:
        logger.warning("Alpha Vantage info: %s", data["Information"])
        return True
    return False


def _parse_time(ts: str) -> str | None:
    try:
        return datetime.strptime(ts, "%Y%m%dT%H%M%S").strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return None


def _sentiment_label(score: float) -> str:
    if score <= -0.35:
        return "Bearish"
    if score <= -0.15:
        return "Somewhat Bearish"
    if score < 0.15:
        return "Neutral"
    if score < 0.35:
        return "Somewhat Bullish"
    return "Bullish"


async def get_alpha_vantage_data(ticker: str) -> dict:
    """Fetch news sentiment (filtered to high-relevance articles) and the
    14-period daily RSI from Alpha Vantage for *ticker*. Both requests run
    concurrently. Each section fails independently.
    """
    try:
        news_raw = await asyncio.to_thread(_get, {
            "function": "NEWS_SENTIMENT",
            "tickers":  ticker,
            "limit":    50,
        })
    except Exception as exc:
        news_raw = exc

    await asyncio.sleep(1.2)

    try:
        rsi_raw = await asyncio.to_thread(_get, {
            "function":    "RSI",
            "symbol":      ticker,
            "interval":    "daily",
            "time_period": 14,
            "series_type": "close",
        })
    except Exception as exc:
        rsi_raw = exc

    # ── Section 1: News sentiment ─────────────────────────────────────────────
    news_sentiment = {}
    try:
        if isinstance(news_raw, Exception):
            raise news_raw
        if _is_rate_limited(news_raw):
            raise ValueError("rate limited")

        feed = news_raw.get("feed") or []
        ticker_upper = ticker.upper()

        filtered_articles = []
        for article in feed:
            ticker_sentiments = article.get("ticker_sentiment") or []
            match = next(
                (t for t in ticker_sentiments
                 if t.get("ticker", "").upper() == ticker_upper
                 and float(t.get("relevance_score", 0)) >= 0.75),
                None,
            )
            if match:
                filtered_articles.append((article, match))

        filtered_articles = filtered_articles[:10]

        mapped = []
        for article, match in filtered_articles:
            score = float(match.get("ticker_sentiment_score") or 0)
            mapped.append({
                "title":           article.get("title"),
                "source":          article.get("source"),
                "published_at":    _parse_time(article.get("time_published") or ""),
                "sentiment_score": score,
                "sentiment_label": match.get("ticker_sentiment_label"),
                "relevance_score": float(match.get("relevance_score") or 0),
                "url":             article.get("url"),
            })

        scores = [a["sentiment_score"] for a in mapped]
        avg_score = round(sum(scores) / len(scores), 4) if scores else None

        news_sentiment = {
            "source":                  "Alpha Vantage",
            "articles_analyzed":       len(mapped),
            "average_sentiment_score": avg_score,
            "average_sentiment_label": _sentiment_label(avg_score) if avg_score is not None else None,
            "bullish_count":           sum(1 for s in scores if s > 0.15),
            "neutral_count":           sum(1 for s in scores if -0.15 <= s <= 0.15),
            "bearish_count":           sum(1 for s in scores if s < -0.15),
            "articles":                mapped,
        }
    except Exception as exc:
        logger.error("alpha_vantage news sentiment failed for %s: %s", ticker, exc)

    # ── Section 2: RSI ────────────────────────────────────────────────────────
    technical_indicators = {}
    try:
        if isinstance(rsi_raw, Exception):
            raise rsi_raw
        if _is_rate_limited(rsi_raw):
            raise ValueError("rate limited")

        rsi_series = rsi_raw.get("Technical Analysis: RSI") or {}
        if not rsi_series:
            raise ValueError("empty RSI series")

        latest_date = sorted(rsi_series.keys(), reverse=True)[0]
        rsi_value   = float(rsi_series[latest_date]["RSI"])

        if rsi_value < 30:
            rsi_signal = "Oversold"
        elif rsi_value < 45:
            rsi_signal = "Approaching Oversold"
        elif rsi_value <= 55:
            rsi_signal = "Neutral"
        elif rsi_value <= 70:
            rsi_signal = "Approaching Overbought"
        else:
            rsi_signal = "Overbought"

        technical_indicators = {
            "rsi_14":     rsi_value,
            "rsi_signal": rsi_signal,
        }
    except Exception as exc:
        logger.error("alpha_vantage RSI failed for %s: %s", ticker, exc)

    return {
        "news_sentiment":       news_sentiment,
        "technical_indicators": technical_indicators,
    }
