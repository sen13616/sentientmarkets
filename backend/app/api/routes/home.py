import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.services.sources.fear_greed import get_fear_greed_data
from app.services.sources.apewisdom import get_trending_tickers
from app.services.sources.newsapi import get_newsapi_data
from app.services.sources.yfinance import get_market_indices
from app.services.cache import get_cached, set_cached

router = APIRouter()
logger = logging.getLogger(__name__)

CACHE_TTL = 900  # 15 minutes


@router.get("/api/home")
async def get_home():
    try:
        logger.info("Fetching home data")

        cached = await get_cached("home")
        if cached is not None:
            return {"cached": True, **cached}

        fear_greed, trending, news, indices = await asyncio.gather(
            get_fear_greed_data(),
            get_trending_tickers(20),
            get_newsapi_data(),
            get_market_indices(),
            return_exceptions=True,
        )

        if isinstance(fear_greed, Exception):
            logger.warning("fear_greed failed on /api/home: %s", fear_greed)
        if isinstance(trending, Exception):
            logger.warning("trending failed on /api/home: %s", trending)
        if isinstance(news, Exception):
            logger.warning("news failed on /api/home: %s", news)
        if isinstance(indices, Exception):
            logger.warning("indices failed on /api/home: %s", indices)

        result = {
            "generated_at":    datetime.now(timezone.utc).isoformat(),
            "fear_and_greed":  fear_greed  if not isinstance(fear_greed, Exception)  else {},
            "trending_tickers": trending   if not isinstance(trending, Exception)    else [],
            "macro_news":      news        if not isinstance(news, Exception)        else {},
            "market_indices":  indices     if not isinstance(indices, Exception)     else {},
        }

        await set_cached("home", result, CACHE_TTL)

        logger.info("Home data assembled successfully")
        return result

    except Exception as exc:
        logger.error("get_home failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch home data")
