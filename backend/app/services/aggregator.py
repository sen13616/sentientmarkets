"""
Collects signals from all data sources concurrently and assembles them into
a single signals dictionary that is passed to the scorer. Alpha Vantage runs
after the first group completes due to its strict per-second rate limit.
Sources are filtered based on asset type to avoid wasted API calls.
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


async def gather_signals(ticker: str) -> dict:
    """Collect signals from all relevant sources based on asset type."""
    logger.info("Gathering signals for %s", ticker)

    # Step 1 — always fetch yfinance first to detect asset type
    yfinance_data = await get_yfinance_data(ticker)
    asset_type = yfinance_data.get('asset_type', 'stock')
    asset_meta = yfinance_data.get('asset_meta', {})

    logger.info("Asset type for %s: %s", ticker, asset_type)

    # Step 2 — build list of coroutines based on asset type
    tasks = {}

    # Fear & Greed — stocks, ETFs, indices only
    if asset_meta.get('has_fear_greed', True):
        tasks['fear_greed'] = get_fear_greed_data()

    # Reddit — stocks, ETFs, crypto only
    if asset_meta.get('has_reddit', True):
        tasks['apewisdom'] = get_apewisdom_data(ticker)

    # Finnhub — stocks only (insider + earnings)
    if asset_meta.get('has_insider', False) or asset_meta.get('has_earnings', False):
        tasks['finnhub'] = get_finnhub_data(ticker)

    # NewsAPI — always (macro context useful for all)
    tasks['newsapi'] = get_newsapi_data()

    # Google Trends — everything except forex
    if asset_type != 'forex':
        tasks['google_trends'] = get_google_trends_data(ticker)

    # Step 3 — run all selected tasks concurrently
    if tasks:
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        task_results = {}
        for key, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                logger.warning("%s failed for %s: %s", key, ticker, result)
                task_results[key] = {}
            else:
                task_results[key] = result
    else:
        task_results = {}

    # Step 4 — Alpha Vantage always runs sequentially after (rate limit)
    try:
        alpha_vantage_data = await get_alpha_vantage_data(ticker)
    except Exception as exc:
        logger.warning("alpha_vantage failed for %s: %s", ticker, exc)
        alpha_vantage_data = {}

    logger.info("Signals gathered for %s", ticker)

    # Step 5 — assemble signals
    return {
        "ticker":        ticker,
        "asset_type":    asset_type,
        "asset_meta":    asset_meta,
        "yfinance":      yfinance_data,
        "fear_greed":    task_results.get('fear_greed', {}),
        "apewisdom":     task_results.get('apewisdom', {}),
        "finnhub":       task_results.get('finnhub', {}),
        "newsapi":       task_results.get('newsapi', {}),
        "google_trends": task_results.get('google_trends', {}),
        "alpha_vantage": alpha_vantage_data,
    }
