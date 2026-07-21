"""Tests for refresh_screener()'s sweep guarantees (all I/O monkeypatched).

The key contract: the sapi:screener blob is only ever overwritten by a
sufficiently complete sweep — failures above MAX_FAILURE_RATIO abort and
keep the previous blob.

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
import asyncio

import pytest

from app.services import screener
from app.services.sentiment_api import UpstreamUnavailable

TICKERS = [f"T{i:02d}" for i in range(10)]
UNIVERSE = {t: {"name": f"Company {t}", "sector": "Tech"} for t in TICKERS}
OVERVIEW = {
    "universe_scored": 10,
    "sectors": [{
        "sector": "Tech",
        "size": 10,
        "tickers": [{"ticker": t, "rank": i + 1} for i, t in enumerate(TICKERS)],
    }],
}
GOOD_SENTIMENT = {
    "score": 61.2,
    "score_raw": 60.0,
    "score_change_1d": 4.2,
    "universe_percentile": 71.0,
    "confidence": 81,
    "ema_obs_count": 1042,
    "sub_indices": {"market": 55.0, "narrative": 68.0, "influencer": 62.0, "macro": 54.9},
    "missing_layers": [],
    "timestamp": "2026-07-18T12:00:00Z",
    "freshness": {
        "market_as_of": "2026-07-18T11:30:00Z",
        "narrative_as_of": "2026-07-18T11:00:00Z",
        "influencer_as_of": "2026-07-18T08:00:00Z",
        "macro_as_of": "2026-07-18T02:00:00Z",
    },
}


@pytest.fixture
def sweep(monkeypatch):
    """Stub the sweep's seams; returns a driver you configure per test."""
    state = {"failing": set(), "unscored": set(), "set_calls": []}

    async def universe():
        return UNIVERSE

    async def overview():
        return OVERVIEW

    async def get_sentiment(t):
        if t in state["failing"]:
            raise UpstreamUnavailable(f"{t} unavailable")
        if t in state["unscored"]:
            return {"status": "insufficient_data"}
        return dict(GOOD_SENTIMENT)

    async def spy_set(key, value, ttl):
        state["set_calls"].append((key, value, ttl))

    monkeypatch.setattr(screener.sentiment_api, "get_universe", universe)
    monkeypatch.setattr(screener.sentiment_api, "get_overview", overview)
    monkeypatch.setattr(screener.sentiment_api, "get_sentiment", get_sentiment)
    monkeypatch.setattr(screener, "set_cached", spy_set)
    return state


def _run():
    asyncio.run(screener.refresh_screener())


# ── abort path ───────────────────────────────────────────────────────────────

def test_failures_above_ratio_abort_without_writing_blob(sweep):
    # MAX_FAILURE_RATIO is 0.2 -> for 10 tickers, >2 failures must abort.
    assert screener.MAX_FAILURE_RATIO == 0.2
    sweep["failing"] = {"T01", "T04", "T07"}  # 3/10 > 2.0
    _run()
    assert sweep["set_calls"] == []  # previous blob preserved


def test_upstream_down_at_universe_fetch_skips_sweep(sweep, monkeypatch):
    async def boom():
        raise UpstreamUnavailable("down")

    monkeypatch.setattr(screener.sentiment_api, "get_universe", boom)
    _run()
    assert sweep["set_calls"] == []


def test_empty_universe_skips_sweep(sweep, monkeypatch):
    async def empty():
        return {}

    monkeypatch.setattr(screener.sentiment_api, "get_universe", empty)
    _run()
    assert sweep["set_calls"] == []


# ── successful sweep ─────────────────────────────────────────────────────────

def test_successful_sweep_writes_complete_blob(sweep):
    _run()
    assert len(sweep["set_calls"]) == 1
    key, blob, ttl = sweep["set_calls"][0]
    assert key == screener.CACHE_KEY
    assert ttl == screener.BLOB_TTL
    assert blob["universe_scored"] == 10
    assert blob["tick_timestamp"] == "2026-07-18T12:00:00Z"
    assert blob["generated_at"]
    assert len(blob["rows"]) == 10
    row = next(r for r in blob["rows"] if r["ticker"] == "T03")
    assert row["name"] == "Company T03"
    assert row["rank"] == 4 and row["sector_size"] == 10
    assert row["score"] == 61.2 and row["spread_class"] == "tight"


def test_partial_sweep_below_threshold_writes_only_complete_rows(sweep):
    sweep["failing"] = {"T02", "T05"}  # 2/10 == threshold, NOT > -> proceed
    _run()
    assert len(sweep["set_calls"]) == 1
    _, blob, _ = sweep["set_calls"][0]
    assert len(blob["rows"]) == 8
    assert {r["ticker"] for r in blob["rows"]} == set(TICKERS) - {"T02", "T05"}
    # every written row is complete — no placeholder/None rows for the failures
    assert all(r["score"] is not None for r in blob["rows"])


def test_unscored_payloads_are_skipped_but_not_counted_as_failures(sweep):
    # 4 unscored tickers would exceed the failure ratio if they counted as
    # failures; they must simply be omitted from the rows.
    sweep["unscored"] = {"T00", "T03", "T06", "T09"}
    _run()
    assert len(sweep["set_calls"]) == 1
    _, blob, _ = sweep["set_calls"][0]
    assert len(blob["rows"]) == 6
    assert {r["ticker"] for r in blob["rows"]} == set(TICKERS) - sweep["unscored"]


def test_overview_failure_degrades_ranks_but_still_writes(sweep, monkeypatch):
    async def boom():
        raise UpstreamUnavailable("overview down")

    monkeypatch.setattr(screener.sentiment_api, "get_overview", boom)
    _run()
    assert len(sweep["set_calls"]) == 1
    _, blob, _ = sweep["set_calls"][0]
    assert len(blob["rows"]) == 10
    assert blob["universe_scored"] == 10  # falls back to len(rows)
    assert all(r["rank"] is None and r["sector_size"] is None for r in blob["rows"])
