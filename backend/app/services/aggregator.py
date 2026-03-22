"""
Collects signals from all data sources concurrently and assembles them into
a single signals dictionary that is passed to the scorer. Alpha Vantage runs
after the first group completes due to its strict per-second rate limit.
"""
import asyncio
import logging

from app.services.sources.yfinance import get_yfinance_data
from app.services.sources.fear_greed import get_fear_greed_data
from app.services.sources.apewisdom import get_apewisdom_data
from app.services.sources.finnhub import get_finnhub_data
from app.services.sources.alpha_vantage import get_alpha_vantage_data
from app.services.sources.newsapi import get_newsapi_data
from app.services.sources.google_trends import get_google_trends_data

logger = logging.getLogger(__name__)

_GROUP1_NAMES = ["yfinance", "fear_greed", "apewisdom", "finnhub", "newsapi", "google_trends"]


async def gather_signals(ticker: str) -> dict:
    """Fetch raw signals from all data sources for *ticker*.
    Group 1 sources run concurrently; Alpha Vantage runs sequentially after
    to respect its 1 request/second rate limit. Any single source failure is
    caught and replaced with an empty dict so the rest of the pipeline continues.
    """
    try:
        logger.info("Gathering signals for %s", ticker)

        # Group 1 — all sources except Alpha Vantage run concurrently
        group1_results = await asyncio.gather(
            get_yfinance_data(ticker),
            get_fear_greed_data(),
            get_apewisdom_data(ticker),
            get_finnhub_data(ticker),
            get_newsapi_data(),
            get_google_trends_data(ticker),
            return_exceptions=True,
        )

        sanitised = []
        for name, result in zip(_GROUP1_NAMES, group1_results):
            if isinstance(result, Exception):
                logger.warning("Source '%s' failed for %s: %s", name, ticker, result)
                sanitised.append({})
            else:
                sanitised.append(result)

        yfinance_data, fear_greed_data, apewisdom_data, finnhub_data, newsapi_data, google_trends_data = sanitised

        # Group 2 — Alpha Vantage runs alone after Group 1 finishes
        try:
            alpha_vantage_data = await get_alpha_vantage_data(ticker)
        except Exception as exc:
            logger.warning("Source 'alpha_vantage' failed for %s: %s", ticker, exc)
            alpha_vantage_data = {}

        logger.info("Signals gathered for %s", ticker)

        return {
            "ticker":         ticker,
            "yfinance":       yfinance_data,
            "fear_greed":     fear_greed_data,
            "apewisdom":      apewisdom_data,
            "finnhub":        finnhub_data,
            "newsapi":        newsapi_data,
            "google_trends":  google_trends_data,
            "alpha_vantage":  alpha_vantage_data,
        }

    except Exception as exc:
        logger.error("gather_signals failed for %s: %s", ticker, exc)
        return {"ticker": ticker}
