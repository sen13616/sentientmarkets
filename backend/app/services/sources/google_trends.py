"""
Fetches Google Trends search interest data for a specific ticker using pytrends.
This is the most fragile data source — Google aggressively rate-limits the
unofficial Trends API. Any error returns an empty dict gracefully without raising.
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

from pytrends.request import TrendReq

logger = logging.getLogger(__name__)


def _fetch_trends(ticker: str) -> dict:
    """Synchronous inner function — runs inside asyncio.to_thread."""
    pytrends = TrendReq(hl="en-US", tz=360)

    # Step 1: Interest over time — last 90 days
    pytrends.build_payload([ticker], timeframe="today 3-m")
    df = pytrends.interest_over_time()

    if df is None or df.empty:
        return {}

    # Drop partial data points (the current incomplete period)
    if "isPartial" in df.columns:
        df = df[df["isPartial"] == False]  # noqa: E712

    if df.empty or ticker not in df.columns:
        return {}

    most_recent_date  = df.index[-1]
    current_interest  = int(df[ticker].iloc[-1])

    # Find the row closest to 7 days before the most recent date
    target_date = most_recent_date - timedelta(days=7)
    closest_idx = min(range(len(df.index)), key=lambda i: abs((df.index[i] - target_date).total_seconds()))
    interest_7d_ago = int(df[ticker].iloc[closest_idx])

    try:
        if interest_7d_ago == 0:
            raise ZeroDivisionError
        interest_change_percent = round(
            ((current_interest - interest_7d_ago) / interest_7d_ago) * 100, 1
        )
    except Exception:
        interest_change_percent = None

    if interest_change_percent is None:
        trend_direction = None
    elif interest_change_percent > 5:
        trend_direction = "Rising"
    elif interest_change_percent < -5:
        trend_direction = "Falling"
    else:
        trend_direction = "Stable"

    time.sleep(2)

    # Step 2: Rising related queries — last 30 days
    related_rising_queries = []
    try:
        pytrends.build_payload([ticker], timeframe="today 1-m")
        related = pytrends.related_queries()
        rising_df = (related.get(ticker) or {}).get("rising")
        if rising_df is not None and not rising_df.empty:
            related_rising_queries = rising_df["query"].head(5).tolist()
    except Exception as exc:
        logger.warning("google_trends related queries failed for %s: %s", ticker, exc)

    return {
        "source":                   "Google Trends",
        "current_interest":         current_interest,
        "interest_7d_ago":          interest_7d_ago,
        "interest_change_percent":  interest_change_percent,
        "trend_direction":          trend_direction,
        "related_rising_queries":   related_rising_queries,
    }


async def get_google_trends_data(ticker: str) -> dict:
    """Fetch Google Trends search interest and rising related queries for
    *ticker*. Runs the synchronous pytrends workflow in a thread to avoid
    blocking the event loop. Returns an empty dict on any error or rate limit.
    """
    try:
        return await asyncio.to_thread(_fetch_trends, ticker)
    except Exception as exc:
        logger.warning("get_google_trends_data failed for %s: %s", ticker, exc)
        return {}
