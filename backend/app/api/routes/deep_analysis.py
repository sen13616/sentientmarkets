"""
POST /api/deep-analysis — expanded per-tab narrative for the dark asset page.

The signals fed to Claude are rebuilt SERVER-SIDE from the same cached
sentiment payload the page renders (sentiment:{TICKER}). The client used to
send them in the request body — an unbounded prompt-injection channel into an
unmetered LLM call — and is now only trusted for (ticker, tab).
"""
import json
import logging
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.services.anthropic_client import get_anthropic
from app.services.cache import get_cached
from app.services.ratelimit import rate_limit
from app.services.sentiment_service import (
    SENTIMENT_TTL,
    InvalidTicker,
    build_sentiment,
    sentiment_key,
)
from app.services.singleflight import get_or_build

logger = logging.getLogger(__name__)

router = APIRouter()

# The generated text can only change when the underlying sentiment payload
# does, so the two TTLs match.
DEEP_TTL = SENTIMENT_TTL


class DeepAnalysisRequest(BaseModel):
    # extra="ignore", not "forbid": already-deployed frontends still send a
    # `signals` field until their bundle refreshes — drop it, don't 422.
    model_config = ConfigDict(extra="ignore")

    ticker: str = Field(pattern=r"^[A-Za-z0-9.^=-]{1,12}$")
    tab: Literal["summary", "bull", "bear", "watch"]


_PROMPTS = {
    "summary": (
        "Write a comprehensive 6-8 sentence market sentiment analysis for {ticker}. "
        "Cover: overall sentiment direction, signal strength and reliability, how macro "
        "conditions are affecting the stock, near-term momentum, and any contradictions "
        "between signals. Reference actual numbers from the signals."
    ),
    "bull": (
        "Write a detailed 6-8 sentence bull case for {ticker}. "
        "Cover: strongest technical signals supporting upside, analyst conviction and "
        "price target implications, positive news catalysts, institutional behaviour, "
        "and what needs to happen for this bull case to play out. Reference actual numbers."
    ),
    "bear": (
        "Write a detailed 6-8 sentence bear case for {ticker}. "
        "Cover: significant technical warning signs, negative sentiment signals, macro "
        "risks, concerning insider or institutional behaviour, and what would confirm "
        "the bear case. Reference actual numbers."
    ),
    "watch": (
        "Write a detailed 6-8 sentence watchlist for {ticker}. "
        "Cover: specific price levels to monitor, upcoming catalysts, which signals to "
        "watch for confirmation or reversal, and what a trader should set alerts for. "
        "Be specific and actionable."
    ),
}


async def _load_signals(ticker: str) -> dict:
    """The cached sentiment payload, trimmed the same way the client used to
    trim it (bulk arrays add tokens without analytical value)."""
    signals = await get_cached(sentiment_key(ticker))
    if signals is None:
        signals = await get_or_build(
            sentiment_key(ticker), SENTIMENT_TTL, lambda: build_sentiment(ticker)
        )
    signals = dict(signals)
    signals.pop("price_history", None)
    news = signals.get("news_sentiment")
    if isinstance(news, dict):
        news = dict(news)
        news.pop("articles", None)
        signals["news_sentiment"] = news
    return signals


async def _generate(ticker: str, tab: str) -> dict:
    """Raises on any failure so errors are returned uncached and retried."""
    signals = await _load_signals(ticker)
    prompt = (
        _PROMPTS[tab].format(ticker=ticker)
        + f"\n\nSIGNALS: {json.dumps(signals, default=str)}"
        + "\n\nReturn only the analysis text — no headers, no bullet points, no markdown."
    )
    message = await get_anthropic().messages.create(
        model="claude-haiku-4-5",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    content = next(b.text for b in message.content if b.type == "text").strip()
    return {"tab": tab, "content": content}


@router.post(
    "/api/deep-analysis",
    dependencies=[Depends(rate_limit(10, 60, "deep"))],
)
async def deep_analysis(req: DeepAnalysisRequest):
    ticker = req.ticker.upper()
    try:
        return await get_or_build(
            f"deep:{ticker}:{req.tab}", DEEP_TTL, lambda: _generate(ticker, req.tab)
        )
    except InvalidTicker:
        # Soft-fail: the client reads data.content unconditionally.
        return {"tab": req.tab, "content": "Deep analysis is unavailable for this ticker."}
    except Exception as exc:
        logger.error("deep_analysis failed for %s/%s: %s", ticker, req.tab, exc)
        return {"tab": req.tab, "content": "Deep analysis temporarily unavailable."}
