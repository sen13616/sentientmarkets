"""
Pure derived statistics over the market-overview payload (mirrors the
sentiment_stats.py pattern). No I/O — every function takes already-fetched
values and returns plain data, so this module is unit-testable.

All functions guard empty/short inputs by returning nulls, never raising.
"""
import math
from statistics import mean, median, pstdev


def histogram(scores: list[float | None], bucket: int = 5) -> list[dict]:
    """5-point score buckets spanning floor(min/b)*b .. ceil(max/b)*b.

    The range is derived from the data, never hardcoded. Buckets are
    half-open [from, to) except the last, which is inclusive so a max
    sitting exactly on the top boundary is still counted.
    """
    vals = [s for s in scores if s is not None]
    if not vals:
        return []
    lo = math.floor(min(vals) / bucket) * bucket
    hi = math.ceil(max(vals) / bucket) * bucket
    if hi == lo:  # all values on a single boundary value
        hi = lo + bucket
    out = []
    for b in range(lo, hi, bucket):
        last = b + bucket >= hi
        count = sum(
            1 for s in vals
            if b <= s < b + bucket or (last and s == b + bucket)
        )
        out.append({"from": b, "to": b + bucket, "count": count})
    return out


def distribution_stats(scores: list[float | None]) -> dict:
    """Summary stats over the universe's scores. Population stdev.

    bullish: score >= 65; bearish: score < 50 (site-wide thresholds).
    Empty input -> all-null dict (page renders em-dashes).
    """
    vals = [s for s in scores if s is not None]
    if not vals:
        return {
            "mean": None, "median": None, "stdev": None,
            "min": None, "max": None,
            "bullish_count": None, "bullish_pct": None,
            "bearish_count": None, "bearish_pct": None,
        }
    n = len(vals)
    bullish = sum(1 for s in vals if s >= 65)
    bearish = sum(1 for s in vals if s < 50)
    return {
        "mean": round(mean(vals), 2),
        "median": round(median(vals), 2),
        "stdev": round(pstdev(vals), 2),
        "min": min(vals),
        "max": max(vals),
        "bullish_count": bullish,
        "bullish_pct": round(bullish / n * 100, 1),
        "bearish_count": bearish,
        "bearish_pct": round(bearish / n * 100, 1),
    }


def widest_sector_gap(sectors: list[dict]) -> dict:
    """Spread between the strongest and weakest sector averages.

    sectors: [{"sector": str, "average_score": float | None, ...}]
    Fewer than two scored sectors -> nulls.
    """
    scored = [
        (s.get("sector"), s["average_score"])
        for s in sectors
        if s.get("average_score") is not None and s.get("sector") is not None
    ]
    if len(scored) < 2:
        return {"value": None, "top_sector": None, "bottom_sector": None}
    top = max(scored, key=lambda x: x[1])
    bottom = min(scored, key=lambda x: x[1])
    return {
        "value": round(top[1] - bottom[1], 2),
        "top_sector": top[0],
        "bottom_sector": bottom[0],
    }
