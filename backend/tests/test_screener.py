"""Unit tests for the screener's pure row-derivation helpers + route paths.

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import market_v2
from app.services.screener import (
    build_row,
    is_cold_start,
    is_stale,
    spread_class,
    spread_of,
)


# ── spread ───────────────────────────────────────────────────────────────────

def test_spread_over_present_channels():
    assert spread_of({"market": 70.0, "narrative": 55.0, "influencer": 60.0, "macro": 45.0}) == 25.0


def test_spread_ignores_missing_channels():
    assert spread_of({"market": 70.0, "narrative": None, "influencer": 60.0, "macro": None}) == 10.0


def test_spread_null_when_fewer_than_two_present():
    assert spread_of({"market": 70.0, "narrative": None, "influencer": None, "macro": None}) is None
    assert spread_of({}) is None
    assert spread_of(None) is None


def test_spread_class_boundaries():
    assert spread_class(14.99) == "tight"
    assert spread_class(15.0) == "moderate"   # tight is strictly <15
    assert spread_class(30.0) == "moderate"   # wide is strictly >30
    assert spread_class(30.01) == "wide"
    assert spread_class(None) is None


# ── cold start / stale ───────────────────────────────────────────────────────

def test_cold_start_threshold():
    assert is_cold_start(0) is True
    assert is_cold_start(11) is True
    assert is_cold_start(12) is False
    assert is_cold_start(1042) is False
    assert is_cold_start(None) is False  # unknown ≠ cold


def test_stale_layer_older_than_48h():
    tick = "2026-07-18T12:00:00Z"
    fresh = {
        "market_as_of": "2026-07-18T11:30:00Z",
        "narrative_as_of": "2026-07-16T11:00:00Z",  # 49h old
        "influencer_as_of": None,
        "macro_as_of": "2026-07-18T02:00:00Z",
    }
    assert is_stale(fresh, [], tick) is True


def test_stale_ignores_missing_layers_and_fresh_data():
    tick = "2026-07-18T12:00:00Z"
    fresh = {
        "market_as_of": "2026-07-18T11:30:00Z",
        "narrative_as_of": "2026-07-10T00:00:00Z",  # ancient, but layer is missing
        "influencer_as_of": "2026-07-18T08:00:00Z",
        "macro_as_of": "2026-07-18T02:00:00Z",
    }
    assert is_stale(fresh, ["narrative"], tick) is False
    assert is_stale(None, [], tick) is False
    assert is_stale(fresh, [], None) is False


# ── build_row ────────────────────────────────────────────────────────────────

SENTIMENT = {
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


def test_build_row_shape_and_derivations():
    row = build_row(
        "WBD",
        {"name": "Warner Bros. Discovery", "sector": "Communication Services"},
        SENTIMENT,
        {"rank": 4, "size": 23},
    )
    assert row == {
        "ticker": "WBD",
        "name": "Warner Bros. Discovery",
        "sector": "Communication Services",
        "score": 61.2,
        "change_1d": 4.2,
        "percentile": 71.0,
        "confidence": 81,
        "sub": {"market": 55.0, "narrative": 68.0, "influencer": 62.0, "macro": 54.9},
        "spread": 13.1,
        "spread_class": "tight",
        "rank": 4,
        "sector_size": 23,
        "missing_layers": [],
        "cold_start": False,
        "stale": False,
    }


def test_build_row_skips_unscored_and_status_payloads():
    assert build_row("XXX", {}, {"status": "insufficient_data"}, None) is None
    assert build_row("XXX", {}, {"score": None}, None) is None


def test_build_row_tolerates_missing_rank_info():
    row = build_row("WBD", {}, SENTIMENT, None)
    assert row is not None and row["rank"] is None and row["sector_size"] is None


# ── route ────────────────────────────────────────────────────────────────────

@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(market_v2.router)
    return TestClient(app)


def test_screener_route_serves_blob(client, monkeypatch):
    async def blob():
        return {"generated_at": "x", "tick_timestamp": "y", "universe_scored": 2, "rows": [{}, {}]}

    monkeypatch.setattr(market_v2, "get_screener_blob", blob)
    r = client.get("/api/v2/market/screener")
    assert r.status_code == 200
    assert r.json()["universe_scored"] == 2


def test_screener_route_503_while_building(client, monkeypatch):
    async def none():
        return None

    monkeypatch.setattr(market_v2, "get_screener_blob", none)
    r = client.get("/api/v2/market/screener")
    assert r.status_code == 503
    assert r.json()["detail"]["error"] == "screener_building"
