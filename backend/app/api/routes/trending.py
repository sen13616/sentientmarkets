from fastapi import APIRouter, HTTPException
from app.services.sources.apewisdom import get_trending_tickers
from app.services.cache import get_cached, set_cached
import logging
from datetime import datetime, timezone

router = APIRouter()
logger = logging.getLogger(__name__)

CACHE_TTL = 1800  # 30 minutes


@router.get("/api/trending")
async def get_trending():
    try:
        logger.info("Fetching trending tickers")

        cached = await get_cached("trending")
        if cached is not None:
            return {"cached": True, **cached}

        tickers = await get_trending_tickers(20)

        payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "tickers": tickers,
        }
        await set_cached("trending", payload, CACHE_TTL)

        return payload

    except Exception as exc:
        logger.error("get_trending failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch trending tickers")
