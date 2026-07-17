"""Unit tests for app/services/market_stats.py (pure functions, no I/O).

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
import math
from statistics import pstdev

from app.services.market_stats import distribution_stats, histogram, widest_sector_gap


# ── histogram ────────────────────────────────────────────────────────────────

def test_histogram_dynamic_range_follows_data():
    scores = [28.5, 43.0, 55.0, 73.1]
    buckets = histogram(scores)
    assert buckets[0]["from"] == 25          # floor(28.5/5)*5
    assert buckets[-1]["to"] == 75           # ceil(73.1/5)*5
    assert [b["to"] - b["from"] for b in buckets] == [5] * len(buckets)
    assert sum(b["count"] for b in buckets) == len(scores)


def test_histogram_range_is_not_hardcoded():
    tight = histogram([51.0, 52.0, 53.9])
    assert tight[0]["from"] == 50 and tight[-1]["to"] == 55
    assert len(tight) == 1 and tight[0]["count"] == 3


def test_histogram_counts_per_bucket():
    scores = [50.0, 51.0, 54.9, 55.0, 59.9, 61.0]
    buckets = histogram(scores)
    by_from = {b["from"]: b["count"] for b in buckets}
    assert by_from[50] == 3
    assert by_from[55] == 2
    assert by_from[60] == 1


def test_histogram_max_on_boundary_is_counted():
    # ceil(70/5)*5 == 70: the max sits exactly on the top edge and must not
    # be silently dropped by half-open bucketing.
    scores = [61.0, 70.0]
    buckets = histogram(scores)
    assert buckets[-1]["to"] == 70
    assert sum(b["count"] for b in buckets) == 2


def test_histogram_single_value_and_empty():
    assert histogram([]) == []
    assert histogram([None, None]) == []
    single = histogram([55.0])
    assert single == [{"from": 55, "to": 60, "count": 1}]


def test_histogram_all_same_score():
    # Degenerate spread: every ticker on one value must yield one full bucket,
    # not an empty range or a divide-by-zero.
    buckets = histogram([57.3] * 10)
    assert buckets == [{"from": 55, "to": 60, "count": 10}]
    on_boundary = histogram([55.0] * 3)
    assert sum(b["count"] for b in on_boundary) == 3


def test_histogram_ignores_nones():
    buckets = histogram([None, 52.0, None, 57.0])
    assert sum(b["count"] for b in buckets) == 2


# ── distribution_stats ───────────────────────────────────────────────────────

def test_distribution_stats_values():
    scores = [40.0, 50.0, 60.0, 70.0]
    s = distribution_stats(scores)
    assert s["mean"] == 55.0
    assert s["median"] == 55.0
    assert s["min"] == 40.0 and s["max"] == 70.0
    assert s["stdev"] == round(pstdev(scores), 2)  # population, not sample
    assert s["bullish_count"] == 1 and s["bullish_pct"] == 25.0  # >= 65
    assert s["bearish_count"] == 1 and s["bearish_pct"] == 25.0  # < 50


def test_distribution_stats_thresholds_are_inclusive_exclusive():
    s = distribution_stats([65.0, 50.0, 49.9])
    assert s["bullish_count"] == 1   # 65.0 counts as bullish
    assert s["bearish_count"] == 1   # 50.0 is NOT bearish; 49.9 is


def test_distribution_stats_empty_returns_nulls_never_raises():
    s = distribution_stats([])
    assert all(v is None for v in s.values())
    s2 = distribution_stats([None, None])
    assert all(v is None for v in s2.values())


def test_distribution_stats_single_value():
    s = distribution_stats([55.0])
    assert s["mean"] == 55.0 and s["stdev"] == 0.0
    assert not any(isinstance(v, float) and math.isnan(v) for v in s.values() if v is not None)


# ── widest_sector_gap ────────────────────────────────────────────────────────

def test_widest_sector_gap():
    sectors = [
        {"sector": "Financials", "average_score": 59.59, "size": 61},
        {"sector": "Information Technology", "average_score": 51.44, "size": 82},
        {"sector": "Energy", "average_score": 55.62, "size": 25},
    ]
    g = widest_sector_gap(sectors)
    assert g == {"value": 8.15, "top_sector": "Financials", "bottom_sector": "Information Technology"}


def test_widest_sector_gap_skips_null_averages():
    sectors = [
        {"sector": "A", "average_score": 60.0},
        {"sector": "B", "average_score": None},
        {"sector": "C", "average_score": 50.0},
    ]
    g = widest_sector_gap(sectors)
    assert g["value"] == 10.0 and g["bottom_sector"] == "C"


def test_widest_sector_gap_short_inputs_return_nulls():
    assert widest_sector_gap([]) == {"value": None, "top_sector": None, "bottom_sector": None}
    assert widest_sector_gap([{"sector": "A", "average_score": 60.0}])["value"] is None
