"""
In-process request coalescing: N concurrent cache misses for the same key run
the underlying builder once and share its result (or its exception).

Uses a per-key asyncio.Task rather than a Lock so joiners attach to the
creator's Task directly — the build completes and populates Redis even if the
originating request disconnects, and a failed build propagates the same
exception to every waiter instead of re-running the builder sequentially.

Scope note: coalescing is per-process. The deploy runs a single worker; if it
ever scales out, the worst case is one duplicate build per process (identical
data, last write wins), which is acceptable — do not add a Redis lock for it.
"""
import asyncio
from typing import Awaitable, Callable, Optional, TypeVar

from app.services.cache import get_cached, set_cached

T = TypeVar("T")

_inflight: dict[str, asyncio.Task] = {}


async def coalesce(key: str, fn: Callable[[], Awaitable[T]]) -> T:
    """Run fn() once per key at a time; concurrent callers await the same Task.

    The check-then-insert below is atomic because nothing awaits between the
    lookup and the store (single-threaded event loop).
    """
    task = _inflight.get(key)
    if task is None:
        task = asyncio.create_task(fn())
        _inflight[key] = task
        task.add_done_callback(lambda _t: _inflight.pop(key, None))
    return await task


async def get_or_build(
    key: str,
    ttl: int,
    builder: Callable[[], Awaitable[dict]],
    *,
    cache_if: Optional[Callable[[dict], bool]] = None,
) -> dict:
    """get_cached(key), or coalesce one builder run and cache its result.

    cache_if lets negative results (e.g. {"insight": None}) pass through to
    the caller without being written to Redis.
    """
    cached = await get_cached(key)
    if cached is not None:
        return cached

    async def _miss() -> dict:
        # Double-check inside the coalesced section: a joiner may arrive after
        # the creator already wrote the cache but before the Task finished.
        again = await get_cached(key)
        if again is not None:
            return again
        value = await builder()
        if cache_if is None or cache_if(value):
            await set_cached(key, value, ttl)
        return value

    return await coalesce(key, _miss)
