"""
Pure derived statistics over SentimentAPI history points. No I/O — every
function takes already-fetched history entries (newest-first, as upstream
serves them) and returns plain values, so this module is unit-testable.

A "point" is an upstream history entry:
  {"timestamp": iso8601, "score": float, "score_raw": float, ...}
"""
from datetime import datetime, timedelta
from statistics import pstdev

# Gap thresholds by interval. Daily entries are spaced ~24h (max observed
# jitter 25.5h; the Jun 23 → Jul 3 outage is 248.7h) so 48h separates outage
# from jitter with wide margin. Hourly spacing is ~1h, so a strict 2× rule
# would be ~2h — 6h will not false-positive but can hide a sub-6h outage
# inside a segment (accepted; amendment 8).
GAP_HOURS = {"daily": 48.0, "hourly": 6.0, "raw": 6.0}


def _ts(point: dict) -> datetime:
    return datetime.fromisoformat(point["timestamp"].replace("Z", "+00:00"))


def sort_points(points: list[dict]) -> list[dict]:
    """Upstream serves newest-first; charts want oldest-first."""
    return sorted(points, key=_ts)


def segment(points: list[dict], gap_hours: float) -> tuple[list[list[int]], list[dict]]:
    """Split oldest-first points into contiguous index runs at gaps.

    Returns (segments, gaps): segments as [start, end] inclusive index pairs,
    gaps as {"from": iso, "to": iso, "hours": float} between segments.
    Consumers must never draw or compute across a gap (contract rule).
    """
    if not points:
        return [], []
    segments: list[list[int]] = [[0, 0]]
    gaps: list[dict] = []
    for i in range(1, len(points)):
        delta_h = (_ts(points[i]) - _ts(points[i - 1])).total_seconds() / 3600
        if delta_h > gap_hours:
            gaps.append(
                {
                    "from": points[i - 1]["timestamp"],
                    "to": points[i]["timestamp"],
                    "hours": round(delta_h, 1),
                }
            )
            segments.append([i, i])
        else:
            segments[-1][1] = i
    return segments, gaps


def own_history_percentile(current_score: float | None, points: list[dict]) -> float | None:
    """Percentage of trailing daily smoothed scores <= current (0-100).

    Null when the current score is unknown or the history is too thin
    (< 10 points) to be meaningful.
    """
    if current_score is None:
        return None
    scores = [p["score"] for p in points if p.get("score") is not None]
    if len(scores) < 10:
        return None
    below_or_equal = sum(1 for s in scores if s <= current_score)
    return round(100.0 * below_or_equal / len(scores), 1)


def _last_7d(points: list[dict]) -> list[dict]:
    if not points:
        return []
    cutoff = _ts(points[-1]) - timedelta(days=7)
    return [p for p in points if _ts(p) >= cutoff]


def sigma_7d(points: list[dict]) -> tuple[float | None, str | None]:
    """(sigma, label) over the last 7 calendar days of DAILY points.

    Amendment 5: this is a daily-resolution sigma (~7 points from the 90-day
    daily series the composite endpoint already fetches), NOT an intraday
    measure — UI copy must say "7-day sigma", never "intraday stability".
    Thresholds are calibrated for daily sigma: < 3 Stable, < 6 Choppy,
    else Volatile. Null when fewer than 4 points exist in the window
    (cold start or the window overlapping a gap).
    """
    scores = [p["score"] for p in _last_7d(points) if p.get("score") is not None]
    if len(scores) < 4:
        return None, None
    sigma = round(pstdev(scores), 1)
    label = "Stable" if sigma < 3 else ("Choppy" if sigma < 6 else "Volatile")
    return sigma, label


def pressure_summary(points: list[dict]) -> dict:
    """Raw-minus-smoothed pressure stats over the last 7 days of points."""
    usable = [
        p for p in _last_7d(points)
        if p.get("score") is not None and p.get("score_raw") is not None
    ]
    if not usable:
        return {"current_gap": None, "mean_7d": None, "reads_as": None}
    gaps = [p["score_raw"] - p["score"] for p in usable]
    current = round(gaps[-1], 1)
    mean = round(sum(gaps) / len(gaps), 1)
    if current > 3:
        reads = "Stretched above trend"
    elif current > 1:
        reads = "Building, not stretched" if mean >= 0 else "Rebounding off trend"
    elif current < -3:
        reads = "Cooling hard"
    elif current < -1:
        reads = "Cooling under trend"
    else:
        reads = "Tracking trend"
    return {"current_gap": current, "mean_7d": mean, "reads_as": reads}
