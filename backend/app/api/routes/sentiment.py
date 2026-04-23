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

        # Validate the ticker actually exists
        yf_data = signals.get("yfinance", {})
        has_price = yf_data.get("price_data", {}).get("current_price") is not None
        has_name = bool(yf_data.get("company_name"))
        if not yf_data or (not has_price and not has_name):
            raise HTTPException(
                status_code=404,
                detail={"error": "invalid_ticker", "message": f"Ticker {ticker} not found"},
            )

        result = await score_sentiment(ticker, signals)

        price_history = await get_price_history(ticker)
        result["price_history"] = price_history

        await set_cached(cache_key, result, CACHE_TTL)
        return result

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sentiment for {ticker}: {exc}")
