"""
Fetches Reddit mention and momentum data from the ApeWisdom public API.
Searches the WallStreetBets feed first, falls back to the all-Reddit feed.
Returns data mapped to the social_sentiment.reddit section of the sentiment schema.
"""
import asyncio
import html
import logging

import requests

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

WSB_URL    = "https://apewisdom.io/api/v1.0/filter/wallstreetbets/page/1"
REDDIT_URL = "https://apewisdom.io/api/v1.0/filter/all-stocks/page/1"


def _fetch(url: str) -> list:
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.json().get("results", [])


def _find_ticker(results: list, ticker: str):
    ticker_upper = ticker.upper()
    for item in results:
        if item.get("ticker", "").upper() == ticker_upper:
            return item
    return None


async def get_apewisdom_data(ticker: str) -> dict:
    """Fetch Reddit mention and rank data for *ticker* from ApeWisdom.
    Checks WallStreetBets first, then falls back to the all-Reddit feed.
    Returns an empty dict if the ticker is not found in either feed or on error.
    """
    try:
        wsb_results, reddit_results = await asyncio.gather(
            asyncio.to_thread(_fetch, WSB_URL),
            asyncio.to_thread(_fetch, REDDIT_URL),
        )

        item = _find_ticker(wsb_results, ticker) or _find_ticker(reddit_results, ticker)

        if item is None:
            logger.info("get_apewisdom_data: %s not found in either feed", ticker)
            return {}

        # Decode any HTML entities in the name field (not used in output but kept clean)
        _ = html.unescape(item.get("name") or "")

        current_rank   = item.get("rank")
        rank_24h_ago   = item.get("rank_24h_ago")
        mentions       = item.get("mentions")
        mentions_ago   = item.get("mentions_24h_ago")

        # rank_change: positive means rank number went down (improved)
        if current_rank is not None and rank_24h_ago is not None:
            rank_change = rank_24h_ago - current_rank
        else:
            rank_change = None

        if rank_change is None:
            rank_change_direction = None
        elif rank_change > 0:
            rank_change_direction = "up"
        elif rank_change < 0:
            rank_change_direction = "down"
        else:
            rank_change_direction = "stable"

        try:
            if mentions is not None and mentions_ago and mentions_ago != 0:
                mention_change_percent = ((mentions - mentions_ago) / mentions_ago) * 100
            else:
                mention_change_percent = None
        except Exception:
            mention_change_percent = None

        if rank_change is None:
            momentum_signal = None
        elif rank_change > 5:
            momentum_signal = "Rising"
        elif rank_change < -5:
            momentum_signal = "Falling"
        else:
            momentum_signal = "Stable"

        return {
            "source":                 "ApeWisdom",
            "current_rank":           current_rank,
            "rank_24h_ago":           rank_24h_ago,
            "rank_change":            rank_change,
            "rank_change_direction":  rank_change_direction,
            "mentions_24h":           mentions,
            "mentions_24h_ago":       mentions_ago,
            "mention_change_percent": mention_change_percent,
            "upvotes_24h":            item.get("upvotes"),
            "momentum_signal":        momentum_signal,
        }

    except Exception as exc:
        logger.error("get_apewisdom_data failed for %s: %s", ticker, exc)
        return {}


async def get_trending_tickers(limit: int = 20) -> list:
    """Fetch top trending tickers across all Reddit boards."""
    try:
        results = await asyncio.to_thread(_fetch, REDDIT_URL)

        trending = []
        for item in results[:limit]:
            rank         = item.get("rank")
            rank_24h_ago = item.get("rank_24h_ago")
            mentions     = item.get("mentions")
            mentions_ago = item.get("mentions_24h_ago")

            if rank is not None and rank_24h_ago is not None:
                rank_change = rank_24h_ago - rank
            else:
                rank_change = None

            if rank_change is None:
                rank_change_direction = None
            elif rank_change > 0:
                rank_change_direction = "up"
            elif rank_change < 0:
                rank_change_direction = "down"
            else:
                rank_change_direction = "stable"

            try:
                if mentions is not None and mentions_ago and mentions_ago != 0:
                    mention_change_percent = ((mentions - mentions_ago) / mentions_ago) * 100
                else:
                    mention_change_percent = None
            except Exception:
                mention_change_percent = None

            if rank_change is None:
                momentum_signal = None
            elif rank_change > 5:
                momentum_signal = "Rising"
            elif rank_change < -5:
                momentum_signal = "Falling"
            else:
                momentum_signal = "Stable"

            trending.append({
                "rank":                   rank,
                "ticker":                 item.get("ticker"),
                "name":                   html.unescape(item.get("name") or ""),
                "mentions":               mentions,
                "upvotes":                item.get("upvotes"),
                "rank_24h_ago":           rank_24h_ago,
                "mentions_24h_ago":       mentions_ago,
                "rank_change":            rank_change,
                "rank_change_direction":  rank_change_direction,
                "mention_change_percent": mention_change_percent,
                "momentum_signal":        momentum_signal,
            })

        return trending

    except Exception as exc:
        logger.error("get_trending_tickers failed: %s", exc)
        return []
