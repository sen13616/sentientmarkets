"""
Fetches the CNN Fear & Greed Index from the unofficial CNN dataviz endpoint
and returns it mapped to the fear_and_greed section of the sentiment schema.
This is market-wide data with no ticker argument.
"""
import asyncio
import logging

import requests

logger = logging.getLogger(__name__)

URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Maps schema keys to the CNN response keys for each sub-indicator
_SUB_INDICATOR_KEYS = {
    "market_momentum":      "market_momentum_sp500",
    "stock_price_strength": "stock_price_strength",
    "stock_price_breadth":  "stock_price_breadth",
    "put_call_ratio":       "put_call_options",
    "market_volatility":    "market_volatility_vix",
    "junk_bond_demand":     "junk_bond_demand",
    "safe_haven_demand":    "safe_haven_demand",
}


def _fetch() -> dict:
    response = requests.get(URL, headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.json()


async def get_fear_greed_data() -> dict:
    """Fetch the CNN Fear & Greed Index and return it mapped to the
    fear_and_greed schema fields including score, label, historical
    comparison values, trend direction, and all seven sub-indicators.
    Returns an empty dict on any error.
    """
    try:
        data = await asyncio.to_thread(_fetch)

        fg = data.get("fear_and_greed", {})

        score          = fg.get("score")
        previous_close = fg.get("previous_close")
        rating         = fg.get("rating")

        # Determine trend direction from score vs previous close
        if score is not None and previous_close is not None:
            if score > previous_close:
                trend = "Rising"
            elif score < previous_close:
                trend = "Falling"
            else:
                trend = "Stable"
        else:
            trend = None

        # Build sub-indicators from the top-level response keys
        sub_indicators = {}
        for schema_key, cnn_key in _SUB_INDICATOR_KEYS.items():
            sub = data.get(cnn_key, {})
            sub_score  = sub.get("score")
            sub_rating = sub.get("rating")
            sub_indicators[schema_key] = {
                "score": sub_score,
                "label": sub_rating.title() if sub_rating else None,
            }

        return {
            "source":         "CNN",
            "score":          score,
            "label":          rating.title() if rating else None,
            "previous_close": previous_close,
            "one_week_ago":   fg.get("previous_1_week"),
            "one_month_ago":  fg.get("previous_1_month"),
            "one_year_ago":   fg.get("previous_1_year"),
            "trend":          trend,
            "sub_indicators": sub_indicators,
        }

    except Exception as exc:
        logger.error("get_fear_greed_data failed: %s", exc)
        return {}
