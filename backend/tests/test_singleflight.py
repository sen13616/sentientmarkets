"""Tests for app/services/singleflight.py (coalescing + get_or_build).

Cache I/O is stubbed with an in-memory dict by patching get_cached/set_cached
*as imported into the singleflight module* — no Redis, no network.

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
import asyncio

import pytest

from app.services import singleflight


@pytest.fixture
def cache(monkeypatch):
    """In-memory replacement for the Redis cache; returns (store, set_calls)."""
    store: dict = {}
    set_calls: list = []

    async def fake_get(key):
        return store.get(key)

    async def fake_set(key, value, ttl):
        set_calls.append((key, ttl))
        store[key] = value

    monkeypatch.setattr(singleflight, "get_cached", fake_get)
    monkeypatch.setattr(singleflight, "set_cached", fake_set)
    singleflight._inflight.clear()
    yield store, set_calls
    singleflight._inflight.clear()


# ── coalesce ─────────────────────────────────────────────────────────────────

def test_coalesce_concurrent_callers_share_one_run(cache):
    calls = {"n": 0}

    async def fn():
        calls["n"] += 1
        await asyncio.sleep(0.01)
        return {"v": calls["n"]}

    async def main():
        return await asyncio.gather(*(singleflight.coalesce("co:key", fn) for _ in range(8)))

    results = asyncio.run(main())
    assert calls["n"] == 1
    assert results == [{"v": 1}] * 8


def test_coalesce_reruns_after_completion(cache):
    calls = {"n": 0}

    async def fn():
        calls["n"] += 1
        return calls["n"]

    async def main():
        first = await singleflight.coalesce("co:rerun", fn)
        await asyncio.sleep(0)  # let the done-callback clear _inflight
        second = await singleflight.coalesce("co:rerun", fn)
        return first, second

    assert asyncio.run(main()) == (1, 2)
    assert calls["n"] == 2


# ── get_or_build ─────────────────────────────────────────────────────────────

def test_concurrent_get_or_build_runs_builder_exactly_once(cache):
    store, set_calls = cache
    calls = {"n": 0}

    async def slow_builder():
        calls["n"] += 1
        await asyncio.sleep(0.02)  # long enough for every waiter to join
        return {"built": True}

    async def main():
        return await asyncio.gather(
            *(singleflight.get_or_build("sf:once", 60, slow_builder) for _ in range(6))
        )

    results = asyncio.run(main())
    assert calls["n"] == 1
    assert results == [{"built": True}] * 6
    assert store["sf:once"] == {"built": True}
    assert set_calls == [("sf:once", 60)]


def test_builder_exception_propagates_to_all_waiters_and_is_not_cached(cache):
    store, set_calls = cache
    calls = {"n": 0}

    async def failing_builder():
        calls["n"] += 1
        await asyncio.sleep(0.02)
        raise ValueError("boom")

    async def main():
        return await asyncio.gather(
            *(singleflight.get_or_build("sf:fail", 60, failing_builder) for _ in range(5)),
            return_exceptions=True,
        )

    results = asyncio.run(main())
    assert calls["n"] == 1  # one run served (failed) all five waiters
    assert len(results) == 5
    assert all(isinstance(r, ValueError) and str(r) == "boom" for r in results)
    assert "sf:fail" not in store
    assert set_calls == []


def test_failed_build_is_retried_on_next_call(cache):
    store, _ = cache
    calls = {"n": 0}

    async def flaky_builder():
        calls["n"] += 1
        if calls["n"] == 1:
            raise ValueError("first run fails")
        return {"ok": True}

    async def main():
        with pytest.raises(ValueError):
            await singleflight.get_or_build("sf:retry", 60, flaky_builder)
        await asyncio.sleep(0)  # drain the done-callback
        return await singleflight.get_or_build("sf:retry", 60, flaky_builder)

    assert asyncio.run(main()) == {"ok": True}
    assert calls["n"] == 2
    assert store["sf:retry"] == {"ok": True}


def test_cache_if_false_returns_result_but_does_not_cache(cache):
    store, set_calls = cache
    calls = {"n": 0}

    async def negative_builder():
        calls["n"] += 1
        return {"insight": None}

    async def main():
        first = await singleflight.get_or_build(
            "sf:neg", 60, negative_builder, cache_if=lambda v: v["insight"] is not None
        )
        await asyncio.sleep(0)
        second = await singleflight.get_or_build(
            "sf:neg", 60, negative_builder, cache_if=lambda v: v["insight"] is not None
        )
        return first, second

    first, second = asyncio.run(main())
    assert first == {"insight": None} and second == {"insight": None}
    assert calls["n"] == 2  # rejected results are rebuilt, never served stale
    assert "sf:neg" not in store
    assert set_calls == []


def test_cache_if_true_caches_normally(cache):
    store, set_calls = cache

    async def builder():
        return {"insight": "real"}

    async def main():
        return await singleflight.get_or_build(
            "sf:pos", 120, builder, cache_if=lambda v: v["insight"] is not None
        )

    assert asyncio.run(main()) == {"insight": "real"}
    assert store["sf:pos"] == {"insight": "real"}
    assert set_calls == [("sf:pos", 120)]


def test_second_call_after_completion_hits_cache(cache):
    store, set_calls = cache
    calls = {"n": 0}

    async def builder():
        calls["n"] += 1
        return {"v": 1}

    async def must_not_run():
        raise AssertionError("builder must not run on a cache hit")

    async def main():
        first = await singleflight.get_or_build("sf:hit", 60, builder)
        second = await singleflight.get_or_build("sf:hit", 60, must_not_run)
        return first, second

    first, second = asyncio.run(main())
    assert first == second == {"v": 1}
    assert calls["n"] == 1
    assert set_calls == [("sf:hit", 60)]


def test_prewarmed_cache_short_circuits_builder(cache):
    store, set_calls = cache
    store["sf:warm"] = {"cached": True}

    async def must_not_run():
        raise AssertionError("builder must not run when the key is cached")

    result = asyncio.run(singleflight.get_or_build("sf:warm", 60, must_not_run))
    assert result == {"cached": True}
    assert set_calls == []
