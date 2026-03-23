"""
Provides ticker symbol search using yfinance. Returns a ranked list of matching
assets for a given query string (company name or ticker symbol).
Supports stocks, ETFs, indices, crypto, commodities, and forex pairs.
"""
import asyncio
import logging

import yfinance as yf

logger = logging.getLogger(__name__)

_TYPE_TO_ASSET = {
    'EQUITY':       'stock',
    'ETF':          'etf',
    'INDEX':        'index',
    'CRYPTOCURRENCY': 'crypto',
    'FUTURE':       'commodity',
    'CURRENCY':     'forex',
    'MUTUALFUND':   'etf',
}


async def search_tickers(query: str) -> list:
    """Search for ticker symbols and asset names matching a query string.
    Returns up to 8 results across all supported asset types.
    Returns an empty list on any error.
    """
    try:
        quotes = await asyncio.to_thread(lambda: yf.Search(query).quotes)

        results = []
        for quote in quotes:
            qt = (quote.get('quoteType') or '').upper()
            if qt not in _TYPE_TO_ASSET:
                continue
            symbol = quote.get('symbol')
            if not symbol:
                continue

            asset_type = _TYPE_TO_ASSET[qt]

            display_ticker = symbol
            display_name = quote.get('longname') or quote.get('shortname') or symbol

            # Forex: EURUSD=X → EUR/USD
            if asset_type == 'forex':
                clean = symbol.replace('=X', '').replace('=', '')
                if len(clean) >= 6:
                    display_ticker = f"{clean[:3]}/{clean[3:6]}"
                    display_name = f"{clean[:3]} / {clean[3:6]}"
                else:
                    display_ticker = clean

            # Crypto: BTC-USD → BTC/USD
            if asset_type == 'crypto':
                display_ticker = symbol.replace('-', '/')

            results.append({
                'ticker':         symbol,
                'display_ticker': display_ticker,
                'name':           display_name,
                'type':           qt,
                'asset_type':     asset_type,
                'exchange':       quote.get('exchange'),
            })

            if len(results) >= 8:
                break

        return results

    except Exception as exc:
        logger.error("search_tickers failed for query=%s: %s", query, exc)
        return []
