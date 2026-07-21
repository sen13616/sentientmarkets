"""Route tests for /api/v2/market/sp500 (upstream + cache monkeypatched).

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import market_v2
from app.services.sentiment_api import UpstreamUnavailable


OVERVIEW = {
    "timestamp": "2026-07-17T03:00:00Z",
    "universe_scored": 4,
    "breadth_above_50_pct": 75.0,
    "breadth_improving_pct": 50.0,
    "top_movers": [{"ticker": "AAA", "score": 70.0, "score_change_1d": 5.0}],
    "bottom_movers": [{"ticker": "DDD", "score": 45.0, "score_change_1d": -4.0}],
    "sectors": [
        {"sector": "Tech", "average_score": 66.0, "size": 2,
         "tickers": [{"ticker": "AAA", "score": 70.0, "rank": 1},
                     {"ticker": "BBB", "score": 62.0, "rank": 2}]},
        {"sector": "Energy", "average_score": 50.0, "size": 2,
         "tickers": [{"ticker": "CCC", "score": 55.0, "rank": 1},
                     {"ticker": "DDD", "score": 45.0, "rank": 2}]},
    ],
}
UNIVERSE = {
    "AAA": {"name": "Alpha Corp", "sector": "Tech"},
    "BBB": {"name": "Beta Inc", "sector": "Tech"},
    "CCC": {"name": "Gamma Co", "sector": "Energy"},
    "DDD": {"name": "Delta Ltd", "sector": "Energy"},
}
SENTIMENT = {"cache_age_seconds": 120, "market_hours": {"is_open": True}}
INDICES = {"sp500": {"symbol": "^GSPC", "price": 7500.0, "change": -10.0, "change_percent": -0.13}}


@pytest.fixture
def client(monkeypatch):
    """TestClient over a minimal app with all I/O stubbed to happy-path."""
    async def no_cache(key):
        return None

    async def no_set(key, value, ttl):
        no_set.calls.append((key, ttl))
    no_set.calls = []

    async def overview():
        return OVERVIEW

    async def universe():
        return UNIVERSE

    async def sentiment(ticker):
        return SENTIMENT

    async def indices():
        return INDICES

    monkeypatch.setattr(market_v2, "get_cached", no_cache)
    monkeypatch.setattr(market_v2, "set_cached", no_set)
    monkeypatch.setattr(market_v2.sentiment_api, "get_overview", overview)
    monkeypatch.setattr(market_v2.sentiment_api, "get_universe", universe)
    monkeypatch.setattr(market_v2.sentiment_api, "get_sentiment", sentiment)
    monkeypatch.setattr(market_v2, "get_market_indices", indices)

    app = FastAPI()
    app.include_router(market_v2.router)
    c = TestClient(app)
    c.set_calls = no_set.calls
    return c


def test_route_shape_and_derivations(client):
    r = client.get("/api/v2/market/sp500")
    assert r.status_code == 200
    d = r.json()
    assert sorted(d.keys()) == sorted([
        "timestamp", "universe_scored", "level", "breadth", "stats",
        "histogram", "sectors", "widest_sector_gap", "movers",
        "constituents", "freshness",
    ])
    # level from the /api/home mechanism
    assert d["level"] == {"value": 7500.0, "change": -10.0, "change_pct": -0.13}
    # above_50_count derived from pct × universe_scored, rounded
    assert d["breadth"]["above_50_count"] == 3  # 75.0% of 4
    # constituents flattened from sectors[].tickers[], name joined, sorted
    assert len(d["constituents"]) == 4
    assert d["constituents"][0] == {
        "ticker": "AAA", "name": "Alpha Corp", "sector": "Tech",
        "score": 70.0, "rank": 1, "sector_size": 2,
    }
    # histogram covers every score exactly once
    assert sum(b["count"] for b in d["histogram"]) == 4
    # stats buckets partition the universe
    s = d["stats"]
    neutral = 4 - s["bullish_count"] - s["bearish_count"]
    assert s["bullish_count"] + neutral + s["bearish_count"] == 4
    assert d["widest_sector_gap"] == {"value": 16.0, "top_sector": "Tech", "bottom_sector": "Energy"}
    assert d["movers"]["top"][0]["name"] == "Alpha Corp"
    assert d["movers"]["top"][0]["change_1d"] == 5.0
    assert d["freshness"]["market_hours"]["is_open"] is True
    # market-hours TTL branch
    assert client.set_calls and client.set_calls[0] == ("sapi:sp500", 900)


def test_route_503_on_upstream_failure(client, monkeypatch):
    async def boom():
        raise UpstreamUnavailable("down")

    monkeypatch.setattr(market_v2.sentiment_api, "get_overview", boom)
    r = client.get("/api/v2/market/sp500")
    assert r.status_code == 503
    assert r.json()["detail"]["error"] == "upstream_unavailable"


def test_route_503_when_overview_none(client, monkeypatch):
    async def none():
        return None

    monkeypatch.setattr(market_v2.sentiment_api, "get_overview", none)
    assert client.get("/api/v2/market/sp500").status_code == 503


def test_route_null_level_when_index_unavailable(client, monkeypatch):
    async def no_indices():
        return {}

    monkeypatch.setattr(market_v2, "get_market_indices", no_indices)
    r = client.get("/api/v2/market/sp500")
    assert r.status_code == 200
    assert r.json()["level"] is None  # null, never fabricated or zeroed


# ── cache-hit path ───────────────────────────────────────────────────────────

def test_cache_hit_heals_poisoned_nan_payload(client, monkeypatch):
    """A pre-sanitizer blob with NaN/Inf in Redis must be healed on read —
    FastAPI serializes with allow_nan=False, so an unhealed hit would 500."""
    poisoned = {
        "timestamp": "cached",
        "stats": {"mean": 55.0, "stdev": float("nan")},
        "level": {"value": float("inf"), "change": -10.0},
    }

    async def hit(key):
        return poisoned

    async def boom():
        raise AssertionError("upstream must not be called on a cache hit")

    monkeypatch.setattr(market_v2, "get_cached", hit)
    monkeypatch.setattr(market_v2.sentiment_api, "get_overview", boom)

    r = client.get("/api/v2/market/sp500")
    assert r.status_code == 200
    assert "NaN" not in r.text and "Infinity" not in r.text
    d = r.json()
    assert d["stats"] == {"mean": 55.0, "stdev": None}   # NaN -> null
    assert d["level"] == {"value": None, "change": -10.0}  # Inf -> null
    assert d["timestamp"] == "cached"


def test_cache_hit_short_circuits_without_upstream_or_rewrite(client, monkeypatch):
    cached_payload = {"timestamp": "cached", "universe_scored": 4, "level": None}

    async def hit(key):
        return cached_payload

    async def boom():
        raise AssertionError("upstream must not be called on a cache hit")

    monkeypatch.setattr(market_v2, "get_cached", hit)
    monkeypatch.setattr(market_v2.sentiment_api, "get_overview", boom)
    monkeypatch.setattr(market_v2.sentiment_api, "get_universe", boom)
    monkeypatch.setattr(market_v2.sentiment_api, "get_sentiment", boom)
    monkeypatch.setattr(market_v2, "get_market_indices", boom)

    r = client.get("/api/v2/market/sp500")
    assert r.status_code == 200
    assert r.json() == cached_payload
    assert client.set_calls == []  # a hit is never re-cached
