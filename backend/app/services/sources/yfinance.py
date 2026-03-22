"""
Fetches all yfinance data for a given ticker and returns it as a dict
whose keys and field names match the Pydantic models in app/models/sentiment.py.
yfinance is synchronous, so the network call is offloaded via asyncio.to_thread
to avoid blocking the event loop.
"""
import asyncio
import logging

import yfinance as yf

logger = logging.getLogger(__name__)


def _safe_pct(numerator, denominator) -> float | None:
    """Return (numerator / denominator) * 100, or None on any error."""
    try:
        if denominator is None or denominator == 0 or numerator is None:
            return None
        return (numerator / denominator) * 100
    except Exception:
        return None


def _safe_sub(a, b) -> float | None:
    try:
        if a is None or b is None:
            return None
        return a - b
    except Exception:
        return None


async def get_yfinance_data(ticker: str) -> dict:
    """Fetch price, fundamentals, analyst, technical, and institutional data
    from yfinance for *ticker*.  Returns an empty dict on any unhandled error.
    """
    try:
        # Offload the blocking .info fetch to a thread
        t = yf.Ticker(ticker)
        info = await asyncio.to_thread(lambda: t.info)

        # ── price_data ────────────────────────────────────────────────────────
        current_price   = info.get("currentPrice")
        previous_close  = info.get("previousClose")
        day_low         = info.get("dayLow")
        day_high        = info.get("dayHigh")
        ftw_low         = info.get("fiftyTwoWeekLow")
        ftw_high        = info.get("fiftyTwoWeekHigh")

        price_data = {
            "current_price":              current_price,
            "open":                        info.get("open"),
            "high":                        day_high,
            "low":                         day_low,
            "previous_close":              previous_close,
            "change":                      _safe_sub(current_price, previous_close),
            "change_percent":              info.get("regularMarketChangePercent"),
            "volume":                      info.get("volume"),
            "average_volume":              info.get("averageVolume"),
            "pre_market_price":            info.get("preMarketPrice"),
            "post_market_price":           info.get("postMarketPrice"),
            "post_market_change_percent":  info.get("postMarketChangePercent"),
            "week_52_high":                ftw_high,
            "week_52_low":                 ftw_low,
            "day_range":                   f"{day_low} - {day_high}" if day_low is not None and day_high is not None else None,
            "week_52_range":               f"{ftw_low} - {ftw_high}" if ftw_low is not None and ftw_high is not None else None,
        }

        # ── fundamentals ──────────────────────────────────────────────────────
        fundamentals = {
            "market_cap":          info.get("marketCap"),
            "pe_ratio_trailing":   info.get("trailingPE"),
            "pe_ratio_forward":    info.get("forwardPE"),
            "eps_trailing":        info.get("trailingEps"),
            "eps_forward":         info.get("forwardEps"),
            "revenue_ttm":         info.get("totalRevenue"),
            "revenue_growth":      info.get("revenueGrowth"),
            "earnings_growth":     info.get("earningsGrowth"),
            "profit_margin":       info.get("profitMargins"),
            "operating_margin":    info.get("operatingMargins"),
            "gross_margin":        info.get("grossMargins"),
            "return_on_equity":    info.get("returnOnEquity"),
            "return_on_assets":    info.get("returnOnAssets"),
            "debt_to_equity":      info.get("debtToEquity"),
            "current_ratio":       info.get("currentRatio"),
            "free_cash_flow":      info.get("freeCashflow"),
            "dividend_yield":      info.get("dividendYield") / 100 if info.get("dividendYield") is not None else None,
            "beta":                info.get("beta"),
            "book_value":          info.get("bookValue"),
            "price_to_book":       info.get("priceToBook"),
            "price_to_sales":      info.get("priceToSalesTrailing12Months"),
        }

        # ── analyst_data ──────────────────────────────────────────────────────
        target_mean    = info.get("targetMeanPrice")
        recommendation = info.get("recommendationKey")

        # Earnings surprises from earnings_dates DataFrame
        earnings_surprises = []
        try:
            ed = await asyncio.to_thread(lambda: t.earnings_dates)
            if ed is not None and not ed.empty:
                ed = ed.dropna(subset=["EPS Estimate", "Reported EPS"]).head(4)
                for date, row in ed.iterrows():
                    actual   = row.get("Reported EPS")
                    estimate = row.get("EPS Estimate")
                    surprise_pct = _safe_pct(_safe_sub(actual, estimate), estimate)
                    earnings_surprises.append({
                        "period":           str(date.date()) if hasattr(date, "date") else str(date),
                        "actual":           float(actual)   if actual   is not None else None,
                        "estimate":         float(estimate) if estimate is not None else None,
                        "surprise_percent": float(surprise_pct) if surprise_pct is not None else None,
                    })
        except Exception as exc:
            logger.warning("earnings_dates unavailable for %s: %s", ticker, exc)

        analyst_data = {
            "consensus":             recommendation.capitalize() if recommendation else None,
            "mean_score":            info.get("recommendationMean"),
            "number_of_analysts":    info.get("numberOfAnalystOpinions"),
            # TODO: strong_buy / buy / hold / sell / strong_sell — needs analyst grades endpoint
            "strong_buy":            None,
            "buy":                   None,
            "hold":                  None,
            "sell":                  None,
            "strong_sell":           None,
            "price_target_mean":     target_mean,
            "price_target_high":     info.get("targetHighPrice"),
            "price_target_low":      info.get("targetLowPrice"),
            "price_target_median":   info.get("targetMedianPrice"),
            "upside_to_target_percent": _safe_pct(
                _safe_sub(target_mean, current_price), current_price
            ),
            "earnings_surprises":    earnings_surprises,
        }

        # ── technical_indicators ──────────────────────────────────────────────
        fifty_day_ma       = info.get("fiftyDayAverage")
        two_hundred_day_ma = info.get("twoHundredDayAverage")

        technical_indicators = {
            # TODO: rsi_14 / rsi_signal — sourced from Alpha Vantage
            "rsi_14":                 None,
            "rsi_signal":             None,
            "fifty_day_ma":           fifty_day_ma,
            "two_hundred_day_ma":     two_hundred_day_ma,
            "price_vs_50d_ma_percent":   _safe_pct(_safe_sub(current_price, fifty_day_ma), fifty_day_ma),
            "price_vs_200d_ma_percent":  _safe_pct(_safe_sub(current_price, two_hundred_day_ma), two_hundred_day_ma),
            # TODO: macd / macd_signal / macd_histogram — sourced from Alpha Vantage
            "macd":           None,
            "macd_signal":    None,
            "macd_histogram": None,
        }

        # ── institutional_data ────────────────────────────────────────────────
        shares_short             = info.get("sharesShort")
        shares_short_prior_month = info.get("sharesShortPriorMonth")

        top_holders = []
        try:
            ih = await asyncio.to_thread(lambda: t.institutional_holders)
            if ih is not None and not ih.empty:
                for _, row in ih.head(5).iterrows():
                    top_holders.append({
                        "holder":         row.get("Holder"),
                        "percent_held":   float(row["pctHeld"]) * 100 if row.get("pctHeld") is not None else None,
                        "shares":         int(row["Shares"])          if row.get("Shares")   is not None else None,
                        "change_percent": float(row["pctChange"]) * 100 if row.get("pctChange") is not None else None,
                    })
        except Exception as exc:
            logger.warning("institutional_holders unavailable for %s: %s", ticker, exc)

        pct_institutions = info.get("heldPercentInstitutions")
        pct_insiders     = info.get("heldPercentInsiders")
        short_pct_float  = info.get("shortPercentOfFloat") or info.get("sharesPercentSharesOut")

        institutional_data = {
            "source":                        "yfinance",
            "percent_held_by_institutions":  pct_institutions * 100 if pct_institutions is not None else None,
            "percent_held_by_insiders":      pct_insiders     * 100 if pct_insiders     is not None else None,
            "short_ratio":                   info.get("shortRatio"),
            "short_percent_of_float":        short_pct_float  * 100 if short_pct_float  is not None else None,
            "shares_short":                  shares_short,
            "shares_short_prior_month":      shares_short_prior_month,
            "short_interest_change_percent": _safe_pct(
                _safe_sub(shares_short, shares_short_prior_month), shares_short_prior_month
            ),
            "top_holders": top_holders,
        }

        return {
            "company_name":        info.get("longName"),
            "price_data":          price_data,
            "fundamentals":        fundamentals,
            "analyst_data":        analyst_data,
            "technical_indicators": technical_indicators,
            "institutional_data":  institutional_data,
        }

    except Exception as exc:
        logger.error("get_yfinance_data failed for %s: %s", ticker, exc)
        return {}


async def get_market_indices() -> dict:
    """Fetch current price and change data for major market indices."""
    _INDICES = {
        "sp500":  ("^GSPC", "S&P 500"),
        "nasdaq": ("^IXIC", "Nasdaq"),
        "dow":    ("^DJI",  "Dow Jones"),
        "vix":    ("^VIX",  "VIX"),
    }

    try:
        async def _fetch_info(symbol: str) -> dict:
            return await asyncio.to_thread(lambda: yf.Ticker(symbol).info)

        keys = list(_INDICES.keys())
        infos = await asyncio.gather(
            *[_fetch_info(sym) for sym, _ in _INDICES.values()],
            return_exceptions=True,
        )

        result = {}
        for key, info in zip(keys, infos):
            symbol, name = _INDICES[key]
            if isinstance(info, Exception):
                logger.warning("get_market_indices failed for %s: %s", symbol, info)
                result[key] = {"symbol": symbol, "name": name, "price": None, "change": None, "change_percent": None}
            else:
                result[key] = {
                    "symbol":         symbol,
                    "name":           name,
                    "price":          info.get("regularMarketPrice"),
                    "change":         info.get("regularMarketChange"),
                    "change_percent": info.get("regularMarketChangePercent"),
                }

        return result

    except Exception as exc:
        logger.error("get_market_indices failed: %s", exc)
        return {}
