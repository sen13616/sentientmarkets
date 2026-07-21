"""
GET /api/mood — returns the latest market mood from cache,
or generates a fresh one if the cache is empty.
"""
import logging

from fastapi import APIRouter, Response

from app.services.cache import get_cached
from app.services.mood import refresh_mood
from app.services.singleflight import coalesce

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/mood")
async def get_mood(response: Response):
    cached = await get_cached("mood:latest")
    if cached:
        history = await get_cached("mood:history") or []
        return {**cached, "history": history}

    # Generation recently failed — serve the fallback for its short TTL
    # instead of re-running the full pipeline per request, and keep browsers
    # from caching it (the middleware default is public,max-age=900).
    fallback = await get_cached("mood:fallback")
    if fallback:
        response.headers["Cache-Control"] = "no-store"
        history = await get_cached("mood:history") or []
        return {**fallback, "history": history}

    # Cache miss — generate fresh. Coalesced so N concurrent misses (and the
    # scheduler job) share one pipeline run and one Claude call.
    mood = await coalesce("mood:refresh", refresh_mood)
    history = await get_cached("mood:history") or []
    if not await get_cached("mood:latest"):
        # The refresh fell back and wasn't cached — don't browser-cache it.
        response.headers["Cache-Control"] = "no-store"
    return {**mood, "history": history}
