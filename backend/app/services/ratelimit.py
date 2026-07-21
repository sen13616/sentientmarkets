"""
Per-IP fixed-window rate limiting backed by the shared Redis client.

Usage — attach as a route dependency:

    @router.post("/api/deep-analysis",
                 dependencies=[Depends(rate_limit(10, 60, "deep"))])

Fails open when Redis is unavailable (same contract as services/cache.py:
a Redis outage degrades caching and limiting, never availability). Windows
are fixed (INCR + EXPIRE on a per-window key), which admits at most 2× burst
at a window boundary — acceptable for abuse control on an unauthenticated API.
"""
import logging
import time

from fastapi import HTTPException, Request

from app.services.cache import get_client

logger = logging.getLogger(__name__)


def _client_ip(request: Request) -> str:
    # Render/Railway terminate TLS at a proxy, so the peer address is the
    # proxy. Only the FIRST hop of X-Forwarded-For is trustworthy-ish; later
    # hops are client-controlled.
    xff = request.headers.get("x-forwarded-for", "")
    first = xff.split(",")[0].strip()
    if first:
        return first
    return request.client.host if request.client else "unknown"


def rate_limit(times: int, seconds: int, scope: str):
    """Dependency enforcing `times` requests per `seconds` per client IP."""

    async def dep(request: Request) -> None:
        ip = _client_ip(request)
        now = time.time()
        window = int(now // seconds)
        key = f"rl:{scope}:{ip}:{window}"
        try:
            pipe = get_client().pipeline()
            pipe.incr(key)
            pipe.expire(key, seconds)
            count, _ = await pipe.execute()
        except Exception as exc:
            logger.warning("rate limit check failed (failing open): %s", exc)
            return
        if count > times:
            retry_after = max(1, seconds - int(now % seconds))
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limited",
                    "message": "Too many requests — please slow down.",
                },
                headers={"Retry-After": str(retry_after)},
            )

    return dep
