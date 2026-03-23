from fastapi import APIRouter, HTTPException
from app.services.cache import get_cached, set_cached
from app.services.aggregator import gather_signals
from app.services.scorer import score_sentiment
from app.services.sources.yfinance import get_price_history

router = APIRouter()

CACHE_TTL = 3600  # 1 hour


@router.get("/api/sentiment/{ticker}")
async def get_sentiment(ticker: str):
    ticker = ticker.upper()
    cache_key = f"sentiment:{ticker}"

    try:
        cached = await get_cached(cache_key)
        if cached is not None:
            cached["cached"] = True
            return cached

        signals = await gather_signals(ticker)
        result = await score_sentiment(ticker, signals)

        price_history = await get_price_history(ticker)
        result["price_history"] = price_history

        await set_cached(cache_key, result, CACHE_TTL)
        return result

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sentiment for {ticker}: {exc}")
