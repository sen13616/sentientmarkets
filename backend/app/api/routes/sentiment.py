import logging

from fastapi import APIRouter, Depends, HTTPException

from app.services.ratelimit import rate_limit
from app.services.sanitize import clean_json_floats
from app.services.sentiment_service import (
    SENTIMENT_TTL,
    TICKER_RE,
    InvalidTicker,
    build_sentiment,
    sentiment_key,
)
from app.services.singleflight import get_or_build

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/api/sentiment/{ticker}",
    dependencies=[Depends(rate_limit(20, 60, "sentiment"))],
)
async def get_sentiment(ticker: str):
    ticker = ticker.upper()
    not_found = HTTPException(
        status_code=404,
        detail={"error": "invalid_ticker", "message": f"Ticker {ticker} not found"},
    )
    if not TICKER_RE.fullmatch(ticker):
        raise not_found

    try:
        result = await get_or_build(
            sentiment_key(ticker), SENTIMENT_TTL, lambda: build_sentiment(ticker)
        )
        # Sanitize on read too — heals entries cached before the NaN fix
        # (json.dumps allowed NaN into Redis; the response encoder doesn't).
        return clean_json_floats(result)
    except InvalidTicker:
        raise not_found
    except HTTPException:
        raise
    except Exception:
        # Log the real error server-side; never leak internals to the client.
        logger.exception("get_sentiment failed for %s", ticker)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch sentiment for {ticker}"
        )
