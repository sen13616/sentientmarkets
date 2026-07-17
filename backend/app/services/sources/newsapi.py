"""
NewsAPI fetchers: the homepage macro business-headlines feed and the
per-ticker company news for the stock page. Neither feeds sentiment scoring.
"""
import asyncio
import logging

import requests

from app.config import settings

logger = logging.getLogger(__name__)

URL = "https://newsapi.org/v2/top-headlines"
EVERYTHING_URL = "https://newsapi.org/v2/everything"


def _map_articles(raw_articles: list) -> list[dict]:
    """Map NewsAPI article objects to our shape, dropping [Removed] stubs."""
    articles = []
    for article in raw_articles:
        title = article.get("title")
        if not title or title == "[Removed]":
            continue
        articles.append({
            "title":        title,
            "source":       (article.get("source") or {}).get("name"),
            "published_at": article.get("publishedAt"),
            "description":  article.get("description"),
            "url":          article.get("url"),
        })
    return articles


def _fetch() -> dict:
    params = {
        "category": "business",
        "country":  "us",
        "pageSize": 10,
        "apiKey":   settings.NEWSAPI_KEY,
    }
    response = requests.get(URL, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


async def get_newsapi_data() -> dict:
    """Fetch the top US business headlines from NewsAPI and return them
    mapped to a simple articles list. Returns an empty dict on any error.
    """
    try:
        data = await asyncio.to_thread(_fetch)

        if data.get("status") != "ok":
            logger.warning("NewsAPI returned non-ok status: %s", data.get("status"))
            return {}

        return {
            "source":        "NewsAPI",
            "total_results": data.get("totalResults"),
            "articles":      _map_articles(data.get("articles") or []),
        }

    except Exception as exc:
        logger.error("get_newsapi_data failed: %s", exc)
        return {}


def _fetch_everything(query: str) -> dict:
    params = {
        "q":        query,
        "language": "en",
        "sortBy":   "publishedAt",
        "pageSize": 9,
        "apiKey":   settings.NEWSAPI_KEY,
    }
    response = requests.get(EVERYTHING_URL, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


async def get_company_news(query: str) -> list[dict]:
    """Latest English articles matching *query* (company name OR ticker),
    newest first, at most 9. Returns [] on any error — callers negative-cache
    empty results because the free tier is 100 requests/day.
    """
    try:
        data = await asyncio.to_thread(_fetch_everything, query)
        if data.get("status") != "ok":
            logger.warning("NewsAPI everything returned non-ok status: %s", data.get("status"))
            return []
        return _map_articles(data.get("articles") or [])
    except Exception as exc:
        logger.error("get_company_news failed for %r: %s", query, exc)
        return []
