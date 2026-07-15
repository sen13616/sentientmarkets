"""
JSON-safety sanitizer. FastAPI serializes responses with allow_nan=False,
so a single NaN/Inf anywhere in a payload 500s the request — and because
routes cache before responding (json.dumps defaults to allow_nan=True),
poisoned payloads survive in Redis and 500 on every cache hit too.

clean_json_floats() is applied at route boundaries (before caching and
before returning, plus on cache reads to heal already-poisoned entries).
"""
import math
from typing import Any

try:
    import numpy as np
except ImportError:  # numpy is an indirect dep (via yfinance/pandas)
    np = None


def clean_json_floats(obj: Any) -> Any:
    """Recursively replace non-finite floats with None and coerce numpy
    scalars to native Python types."""
    if isinstance(obj, dict):
        return {k: clean_json_floats(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [clean_json_floats(v) for v in obj]
    if np is not None and isinstance(obj, np.integer):
        return int(obj)
    if np is not None and isinstance(obj, np.floating):
        obj = float(obj)
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj
