"""
Fetches the top 10 US business headlines from NewsAPI.
Used for the homepage macro news feed only — not ticker-specific
and not used for sentiment scoring.
"""
import asyncio
import logging

import requests

from app.config import settings

logger = logging.getLogger(__name__)

URL = "https://newsapi.org/v2/top-headlines"


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

        raw_articles = data.get("articles") or []
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

        return {
            "source":        "NewsAPI",
            "total_results": data.get("totalResults"),
            "articles":      articles,
        }

    except Exception as exc:
        logger.error("get_newsapi_data failed: %s", exc)
        return {}
