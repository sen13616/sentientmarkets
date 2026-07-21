"""Unit tests for app/services/sentiment_stats.py (pure functions, no I/O).

Run from backend/: .venv/bin/python -m pytest tests/ -q
"""
from datetime import datetime, timedelta, timezone

from app.services.sentiment_stats import (
    GAP_HOURS,
    own_history_percentile,
    pressure_summary,
    segment,
    sigma_7d,
    sort_points,
)

BASE = datetime(2026, 7, 1, 12, 0, 0, tzinfo=timezone.utc)


def _iso(day: float, hour: float = 0.0) -> str:
    ts = BASE + timedelta(days=day, hours=hour)
    return ts.isoformat().replace("+00:00", "Z")


def _p(day: float, score=None, raw=None, hour: float = 0.0) -> dict:
    return {"timestamp": _iso(day, hour), "score": score, "score_raw": raw}


# ── sort_points ──────────────────────────────────────────────────────────────

def test_sort_points_orders_newest_first_input_oldest_first():
    newest_first = [_p(3, 53.0), _p(2, 52.0), _p(0, 50.0), _p(1, 51.0)]
    out = sort_points(newest_first)
    assert [p["score"] for p in out] == [50.0, 51.0, 52.0, 53.0]
    assert [p["timestamp"] for p in out] == [_iso(0), _iso(1), _iso(2), _iso(3)]


def test_sort_points_is_non_destructive_and_handles_empty():
    pts = [_p(1), _p(0)]
    out = sort_points(pts)
    assert out is not pts
    assert pts[0]["timestamp"] == _iso(1)  # input untouched
    assert sort_points([]) == []


def test_sort_points_sub_daily_resolution():
    pts = [_p(0, hour=9), _p(0, hour=1), _p(0, hour=17)]
    assert [p["timestamp"] for p in sort_points(pts)] == [
        _iso(0, 1), _iso(0, 9), _iso(0, 17)
    ]


# ── segment ──────────────────────────────────────────────────────────────────

def test_segment_empty():
    assert segment([], GAP_HOURS["daily"]) == ([], [])


def test_segment_single_point():
    assert segment([_p(0)], GAP_HOURS["daily"]) == ([[0, 0]], [])


def test_segment_contiguous_run_no_gaps():
    pts = [_p(0), _p(1), _p(2)]
    segments, gaps = segment(pts, GAP_HOURS["daily"])
    assert segments == [[0, 2]]
    assert gaps == []


def test_segment_splits_on_gap_with_correct_record():
    # days 0,1,2 then a jump to day 12 (240h) and a normal step to day 13.
    pts = [_p(0), _p(1), _p(2), _p(12), _p(13)]
    segments, gaps = segment(pts, GAP_HOURS["daily"])
    assert segments == [[0, 2], [3, 4]]
    assert gaps == [{"from": _iso(2), "to": _iso(12), "hours": 240.0}]


def test_segment_gap_equal_to_threshold_does_not_split():
    # Exactly 48h apart with a 48h threshold: strictly-greater rule keeps
    # the run intact; 48.1h splits it.
    pts = [_p(0), _p(2)]
    segments, gaps = segment(pts, 48.0)
    assert segments == [[0, 1]] and gaps == []

    pts2 = [_p(0), _p(2, hour=0.1)]
    segments2, gaps2 = segment(pts2, 48.0)
    assert segments2 == [[0, 0], [1, 1]]
    assert gaps2 == [{"from": _iso(0), "to": _iso(2, 0.1), "hours": 48.1}]


def test_segment_multiple_gaps_and_singleton_segments():
    pts = [_p(0), _p(10), _p(20), _p(21)]
    segments, gaps = segment(pts, GAP_HOURS["daily"])
    assert segments == [[0, 0], [1, 1], [2, 3]]
    assert gaps == [
        {"from": _iso(0), "to": _iso(10), "hours": 240.0},
        {"from": _iso(10), "to": _iso(20), "hours": 240.0},
    ]


def test_segment_hourly_threshold():
    pts = [_p(0, hour=0), _p(0, hour=1), _p(0, hour=8)]
    segments, gaps = segment(pts, GAP_HOURS["hourly"])
    assert segments == [[0, 1], [2, 2]]
    assert gaps == [{"from": _iso(0, 1), "to": _iso(0, 8), "hours": 7.0}]


def test_gap_hours_constants():
    assert GAP_HOURS == {"daily": 48.0, "hourly": 6.0, "raw": 6.0}


# ── sigma_7d ─────────────────────────────────────────────────────────────────

def test_sigma_7d_known_values():
    # scores 50,52,54,56: mean 53, squared devs 9+1+1+9=20, var 20/4=5,
    # pstdev sqrt(5)=2.236... -> 2.2 -> "Stable" (< 3).
    pts = [_p(0, 50.0), _p(1, 52.0), _p(2, 54.0), _p(3, 56.0)]
    assert sigma_7d(pts) == (2.2, "Stable")


def test_sigma_7d_choppy_boundary():
    # 50,56,50,56: mean 53, every dev 3, var 9, sigma 3.0 — 3.0 is NOT < 3,
    # so the label must be "Choppy".
    pts = [_p(0, 50.0), _p(1, 56.0), _p(2, 50.0), _p(3, 56.0)]
    assert sigma_7d(pts) == (3.0, "Choppy")


def test_sigma_7d_volatile_boundary():
    # 40,52,40,52: mean 46, dev 6, sigma 6.0 — 6.0 is NOT < 6 -> "Volatile".
    pts = [_p(0, 40.0), _p(1, 52.0), _p(2, 40.0), _p(3, 52.0)]
    assert sigma_7d(pts) == (6.0, "Volatile")


def test_sigma_7d_window_excludes_points_older_than_7_days():
    # Days 0-1 carry wild scores that would explode sigma if the 7-day
    # window (anchored on the LAST point) leaked.
    pts = [_p(0, 0.0), _p(1, 100.0)] + [_p(d, 50.0) for d in range(2, 10)]
    assert sigma_7d(pts) == (0.0, "Stable")


def test_sigma_7d_null_when_fewer_than_4_points():
    pts = [_p(0, 50.0), _p(1, 51.0), _p(2, 52.0)]
    assert sigma_7d(pts) == (None, None)
    assert sigma_7d([]) == (None, None)


def test_sigma_7d_ignores_null_scores():
    pts = [_p(0, 50.0), _p(1, None), _p(2, 52.0), _p(3, None), _p(4, 54.0)]
    assert sigma_7d(pts) == (None, None)  # only 3 usable scores


# ── pressure_summary ─────────────────────────────────────────────────────────

def test_pressure_stretched_above_trend():
    pts = [_p(0, 50.0, raw=55.0)]  # gap +5 > 3
    assert pressure_summary(pts) == {
        "current_gap": 5.0, "mean_7d": 5.0, "reads_as": "Stretched above trend"
    }


def test_pressure_building_not_stretched():
    pts = [_p(0, 50.0, raw=52.0), _p(1, 50.0, raw=52.0)]  # gaps [2, 2]
    out = pressure_summary(pts)
    assert out == {"current_gap": 2.0, "mean_7d": 2.0, "reads_as": "Building, not stretched"}


def test_pressure_boundary_gap_of_3_is_building_not_stretched():
    pts = [_p(0, 50.0, raw=53.0)]  # exactly 3: not > 3
    assert pressure_summary(pts)["reads_as"] == "Building, not stretched"


def test_pressure_rebounding_off_trend():
    # current +2 but the 7d mean is negative -> rebounding.
    pts = [_p(0, 58.0, raw=50.0), _p(1, 50.0, raw=52.0)]  # gaps [-8, 2], mean -3
    out = pressure_summary(pts)
    assert out == {"current_gap": 2.0, "mean_7d": -3.0, "reads_as": "Rebounding off trend"}


def test_pressure_cooling_hard():
    pts = [_p(0, 55.0, raw=50.0)]  # gap -5 < -3
    assert pressure_summary(pts)["reads_as"] == "Cooling hard"


def test_pressure_cooling_under_trend():
    pts = [_p(0, 52.0, raw=50.0)]  # gap -2
    assert pressure_summary(pts)["reads_as"] == "Cooling under trend"


def test_pressure_boundary_gap_of_minus_3_is_cooling_under_trend():
    pts = [_p(0, 53.0, raw=50.0)]  # exactly -3: not < -3, but < -1
    assert pressure_summary(pts)["reads_as"] == "Cooling under trend"


def test_pressure_tracking_trend():
    pts = [_p(0, 50.0, raw=50.5)]  # gap 0.5 in [-1, 1]
    assert pressure_summary(pts)["reads_as"] == "Tracking trend"


def test_pressure_empty_and_missing_fields_return_nulls():
    assert pressure_summary([]) == {"current_gap": None, "mean_7d": None, "reads_as": None}
    # points exist but never both score and score_raw
    pts = [_p(0, 50.0, raw=None), _p(1, None, raw=52.0)]
    assert pressure_summary(pts) == {"current_gap": None, "mean_7d": None, "reads_as": None}


def test_pressure_only_uses_last_7_days():
    # An ancient +10 gap outside the window must not drag the mean.
    pts = [_p(0, 40.0, raw=50.0)] + [_p(d, 50.0, raw=50.0) for d in range(3, 11)]
    out = pressure_summary(pts)
    assert out == {"current_gap": 0.0, "mean_7d": 0.0, "reads_as": "Tracking trend"}


# ── own_history_percentile ───────────────────────────────────────────────────

def test_percentile_null_on_empty_history():
    assert own_history_percentile(55.0, []) is None


def test_percentile_null_when_score_none():
    pts = [_p(d, 50.0) for d in range(20)]
    assert own_history_percentile(None, pts) is None


def test_percentile_null_below_10_points():
    pts = [_p(d, 50.0) for d in range(9)]
    assert own_history_percentile(55.0, pts) is None


def test_percentile_all_equal_scores():
    pts = [_p(d, 50.0) for d in range(10)]
    assert own_history_percentile(50.0, pts) == 100.0  # <= counts ties


def test_percentile_midpoint_and_extremes():
    pts = [_p(d, float(41 + d)) for d in range(10)]  # scores 41..50
    assert own_history_percentile(45.0, pts) == 50.0
    assert own_history_percentile(100.0, pts) == 100.0
    assert own_history_percentile(0.0, pts) == 0.0


def test_percentile_ignores_null_scores_in_history():
    pts = [_p(d, float(41 + d)) for d in range(10)]
    pts += [_p(20, None), _p(21, None)]
    assert own_history_percentile(45.0, pts) == 50.0
    # ...but nulls do not count toward the 10-point minimum
    thin = [_p(d, 50.0) for d in range(9)] + [_p(9, None)]
    assert own_history_percentile(55.0, thin) is None
