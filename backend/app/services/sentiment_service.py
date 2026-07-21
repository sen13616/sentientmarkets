"""
Builds the full v1 sentiment payload for a ticker. Extracted from
routes/sentiment.py so the sentiment route and deep-analysis share one
builder (and one cache key, sentiment:{TICKER}).

Invalid tickers are rejected BEFORE the expensive signal fan-out (Reddit,
Trends, Alpha Vantage, …) and negative-cached so repeat requests for the same
junk ticker cost nothing — a dozen bad tickers used to exhaust the whole
Alpha Vantage daily quota.
"""
import asyncio
import logging
import re

from app.services.aggregator import gather_signals
from app.services.cache import get_cached, set_cached
from app.services.sanitize import clean_json_floats
from app.services.scorer import score_sentiment
from app.services.sources.yfinance import get_price_history, get_yfinance_data

logger = logging.getLogger(__name__)

SENTIMENT_TTL = 3600  # 1 hour
INVALID_TTL = 3600

# Covers stocks, indices (^GSPC), crypto (BTC-USD), forex (EURUSD=X),
# futures (GC=F). Anything else never reaches yfinance or the cache.
TICKER_RE = re.compile(r"^[A-Z0-9.^=-]{1,12}$")


class InvalidTicker(Exception):
    """Ticker does not resolve to any tradeable asset."""


def sentiment_key(ticker: str) -> str:
    return f"sentiment:{ticker}"


async def build_sentiment(ticker: str) -> dict:
    """Run the full pipeline for *ticker* (no caching of the result here —
    callers wrap this in singleflight.get_or_build). Raises InvalidTicker."""
    if await get_cached(f"sentiment:invalid:{ticker}") is not None:
        raise InvalidTicker(ticker)

    # Cheap existence check first: one yfinance info fetch, reused by the
    # aggregator below so nothing is fetched twice.
    yf_data = await get_yfinance_data(ticker)
    has_price = yf_data.get("price_data", {}).get("current_price") is not None
    has_name = bool(yf_data.get("company_name"))
    if not has_price and not has_name:
        if yf_data:
            # yfinance answered and knows nothing about it → genuinely invalid.
            # An empty dict means the fetch itself failed (possible outage), so
            # don't negative-cache a ticker we couldn't actually check.
            await set_cached(f"sentiment:invalid:{ticker}", {"invalid": True}, INVALID_TTL)
        raise InvalidTicker(ticker)

    signals = await gather_signals(ticker, yfinance_data=yf_data)

    # Price history is independent of scoring — overlap it with the scorer's
    # Claude round-trip instead of paying for both sequentially.
    result, price_history = await asyncio.gather(
        score_sentiment(ticker, signals),
        get_price_history(ticker),
    )
    result["price_history"] = price_history

    # Sanitize BEFORE caching so non-finite floats can neither 500 the
    # response nor poison the cache for the full TTL.
    return clean_json_floats(result)
