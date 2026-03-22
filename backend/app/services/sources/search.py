"""
Provides ticker symbol search using yfinance. Returns a ranked list of matching
equities and ETFs for a given query string (company name or ticker symbol).
"""
import asyncio
import logging

import yfinance as yf

logger = logging.getLogger(__name__)

_ALLOWED_TYPES = {"EQUITY", "ETF"}


async def search_tickers(query: str) -> list:
    """Search for ticker symbols and company names matching a query string.
    Returns up to 8 EQUITY or ETF results mapped to a minimal schema.
    Returns an empty list on any error.
    """
    try:
        quotes = await asyncio.to_thread(lambda: yf.Search(query).quotes)

        results = []
        for q in quotes:
            if not q.get("symbol"):
                continue
            if q.get("quoteType") not in _ALLOWED_TYPES:
                continue
            results.append({
                "ticker":   q.get("symbol"),
                "name":     q.get("longname") or q.get("shortname"),
                "type":     q.get("quoteType"),
                "exchange": q.get("exchange"),
            })
            if len(results) == 8:
                break

        return results

    except Exception as exc:
        logger.error("search_tickers failed for query=%s: %s", query, exc)
        return []
