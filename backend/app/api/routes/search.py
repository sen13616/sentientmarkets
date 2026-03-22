from fastapi import APIRouter, Query, HTTPException
from app.services.sources.search import search_tickers
from app.services.cache import get_cached, set_cached
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

CACHE_TTL = 86400  # 24 hours


@router.get("/api/search")
async def search(q: str = Query(..., min_length=1, max_length=50)):
    try:
        logger.info(f"Search query: {q}")

        cache_key = f"search:{q.lower().strip()}"
        cached = await get_cached(cache_key)
        if cached is not None:
            return {"cached": True, **cached}

        results = await search_tickers(q)

        payload = {"query": q, "results": results}
        await set_cached(cache_key, payload, CACHE_TTL)

        return payload

    except Exception as exc:
        logger.error("search failed for q=%s: %s", q, exc)
        raise HTTPException(status_code=500, detail="Search failed")
