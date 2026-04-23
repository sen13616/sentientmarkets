"""
Deterministic weighted scoring pipeline.

Step 1 — compute a 0-100 sub-score for each of the 7 signals.
Step 2 — redistribute weight from null signals proportionally across available ones.
Step 3 — calculate raw weighted score.
Step 4 — apply CNN Fear & Greed as a soft nudge (max ±4 pts), clamp to 0-100.
Step 5 — label the score (5-tier scale).
Step 6 — call GPT-4o-mini for narrative text ONLY; the number is never touched by GPT.
"""
import json
import logging
from datetime import datetime, timezone

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

# ── Weights ───────────────────────────────────────────────────────────────────

BASE_WEIGHTS: dict[str, float] = {
    "news_sentiment":    0.25,
    "reddit_momentum":   0.20,
    "analyst_consensus": 0.15,
    "price_momentum":    0.15,
    "rsi":               0.10,
    "google_trends":     0.10,
    "volume_anomaly":    0.05,
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _label(score: float) -> str:
    if score >= 75: return "Bullish"
    if score >= 60: return "Leaning Bullish"
    if score >= 45: return "Neutral"
    if score >= 30: return "Leaning Bearish"
    return "Bearish"


def _confidence(n_available: int) -> str:
    if n_available >= 6: return "high"
    if n_available >= 4: return "medium"
    return "low"


# ── Per-signal sub-scorers (each returns 0-100 or None) ───────────────────────

def _score_news_sentiment(av: dict) -> float | None:
    """Alpha Vantage average_sentiment_score (-1..+1) → 0-100."""
    score = (av.get("news_sentiment") or {}).get("average_sentiment_score")
    if score is None:
        return None
    return _clamp((score + 1) / 2 * 100)


def _score_reddit_momentum(aw: dict) -> float | None:
    """Mention % change vs 24h ago → 0-100 (0% change = 50)."""
    if not aw:
        return None
    change = aw.get("mention_change_percent")
    if change is None:
        return None
    return _clamp(50 + change / 2)


def _score_analyst_consensus(yf: dict) -> float | None:
    """yfinance recommendationKey → Strong Buy=90, Buy=70, Hold=50, Sell=30, Strong Sell=10."""
    consensus = (yf.get("analyst_data") or {}).get("consensus")
    if not consensus:
        return None
    mapping = {
        "strongbuy":    90,
        "buy":          70,
        "hold":         50,
        "underperform": 35,
        "sell":         30,
        "strongsell":   10,
    }
    key = consensus.lower().replace(" ", "").replace("-", "").replace("_", "")
    return mapping.get(key)


def _score_price_momentum(yf: dict) -> float | None:
    """1-month return: -20% → 0, 0% → 50, +20% → 100."""
    ret = (yf.get("technical_indicators") or {}).get("one_month_return")
    if ret is None:
        return None
    return _clamp(50 + ret * 2.5)


def _score_rsi(av: dict) -> float | None:
    """RSI-14 is already 0-100; use directly."""
    rsi = (av.get("technical_indicators") or {}).get("rsi_14")
    if rsi is None:
        return None
    return _clamp(float(rsi))


def _score_google_trends(gt: dict) -> float | None:
    """7-day interest % change → 0-100 (0% change = 50)."""
    if not gt:
        return None
    change = gt.get("interest_change_percent")
    if change is None:
        return None
    return _clamp(50 + change / 2)


def _score_volume_anomaly(yf: dict) -> float | None:
    """Volume / avg_volume ratio: 0.5x → 0, 1x → 50, 2x → 100."""
    price   = yf.get("price_data") or {}
    volume  = price.get("volume")
    avg_vol = price.get("average_volume")
    if volume is None or avg_vol is None or avg_vol == 0:
        return None
    ratio = volume / avg_vol
    return _clamp((ratio - 0.5) / 1.5 * 100)


# ── Weighted formula ──────────────────────────────────────────────────────────

def _weighted_score(raw: dict[str, float | None]) -> tuple[float, dict[str, float]]:
    """
    Redistribute weight from null signals proportionally across available ones.
    Returns (raw_score, effective_normalized_weights).
    """
    available = {k: v for k, v in raw.items() if v is not None}
    if not available:
        return 50.0, {}
    total_w = sum(BASE_WEIGHTS[k] for k in available)
    norm_w  = {k: BASE_WEIGHTS[k] / total_w for k in available}
    score   = sum(norm_w[k] * available[k] for k in available)
    return score, norm_w


def _apply_fg(raw_score: float, fg: dict) -> float:
    """Fear & Greed nudge: max ±4 points, no hard caps."""
    fg_score = fg.get("score")
    if fg_score is None:
        return raw_score
    modifier = (float(fg_score) - 50) * 0.08
    return _clamp(raw_score + modifier)


def _build_sub_scores(
    raw: dict[str, float | None],
    norm_w: dict[str, float],
) -> dict:
    result = {}
    for key in BASE_WEIGHTS:
        v = raw.get(key)
        result[key] = {
            "score":     round(v, 1) if v is not None else None,
            "weight":    round(norm_w.get(key, 0.0), 4),
            "available": v is not None,
        }
    return result


# ── GPT narrative prompt ──────────────────────────────────────────────────────

_ASSET_CONTEXT = {
    "stock":     "You are analysing an individual equity (stock).",
    "etf":       "You are analysing an ETF (Exchange Traded Fund).",
    "index":     "You are analysing a market index.",
    "crypto":    "You are analysing a cryptocurrency.",
    "commodity": "You are analysing a commodity or futures contract.",
    "forex":     "You are analysing a currency pair.",
}

_FALLBACK_INSIGHTS = {
    "summary":      "Narrative temporarily unavailable.",
    "bull_case":    None,
    "bear_case":    None,
    "what_to_watch": None,
}


def _build_narrative_prompt(
    ticker: str,
    asset_type: str,
    final_score: float,
    label: str,
    sub_scores: dict,
    signals: dict,
) -> str:
    context_line = _ASSET_CONTEXT.get(asset_type, _ASSET_CONTEXT["stock"])
    av  = signals.get("alpha_vantage", {})
    fh  = signals.get("finnhub", {})
    fg  = signals.get("fear_greed", {})
    yf  = signals.get("yfinance", {})

    narrative_ctx = {
        "ticker":            ticker,
        "final_score":       round(final_score, 1),
        "label":             label,
        "sub_scores":        {k: v["score"] for k, v in sub_scores.items()},
        "signals_available": sum(1 for v in sub_scores.values() if v["available"]),
        "top_headlines":     [a.get("title") for a in ((av.get("news_sentiment") or {}).get("articles") or [])[:3]],
        "fear_greed_score":  fg.get("score"),
        "fear_greed_label":  fg.get("label"),
        "analyst_consensus": (yf.get("analyst_data") or {}).get("consensus"),
        "rsi_signal":        (av.get("technical_indicators") or {}).get("rsi_signal"),
        "insider_signal":    (fh.get("insider_sentiment") or {}).get("signal"),
        "insider_mspr":      (fh.get("insider_sentiment") or {}).get("latest_mspr"),
        "recent_earnings":   (fh.get("earnings_surprises") or [])[:3],
    }

    return f"""{context_line}

You are TheMarketMood.ai narrative writer. A quantitative model has already scored {ticker} at {round(final_score, 1)}/100 ({label}). Do not generate or adjust the score.

Your task is to write a concise, data-grounded narrative explaining why the score landed where it did.

COMPUTED SCORE AND SIGNAL DATA:
{json.dumps(narrative_ctx, indent=2, default=str)}

Write exactly:
- Summary: 2 sentences explaining the overall score and what is driving it most
- Bull case: 3 specific points on the strongest positive signals — reference actual values from the data above
- Bear case: 3 specific points on the strongest negative signals — reference actual values
- What to watch: 1 actionable insight on key upcoming catalysts, price levels, or signals to monitor

Return ONLY valid JSON with no markdown, no code blocks, no explanation:
{{
  "summary": "<2 sentences>",
  "bull_case": "<3 specific points as prose sentences>",
  "bear_case": "<3 specific points as prose sentences>",
  "what_to_watch": "<1 actionable insight>"
}}"""


# ── Main entry point ──────────────────────────────────────────────────────────

async def score_sentiment(ticker: str, signals: dict) -> dict:
    """
    Deterministic weighted score → GPT narrative → assemble full response.
    Never raises; falls back gracefully on any error.
    """
    try:
        logger.info("Scoring sentiment for %s (deterministic)", ticker)

        asset_type = signals.get("asset_type", "stock")
        yf  = signals.get("yfinance", {})
        fg  = signals.get("fear_greed", {})
        aw  = signals.get("apewisdom", {})
        fh  = signals.get("finnhub", {})
        av  = signals.get("alpha_vantage", {})
        gt  = signals.get("google_trends", {})

        # ── Step 1: raw sub-scores ────────────────────────────────────────────
        raw: dict[str, float | None] = {
            "news_sentiment":    _score_news_sentiment(av),
            "reddit_momentum":   _score_reddit_momentum(aw),
            "analyst_consensus": _score_analyst_consensus(yf),
            "price_momentum":    _score_price_momentum(yf),
            "rsi":               _score_rsi(av),
            "google_trends":     _score_google_trends(gt),
            "volume_anomaly":    _score_volume_anomaly(yf),
        }

        # ── Step 2-3: weighted score with null redistribution ─────────────────
        raw_score, norm_w = _weighted_score(raw)

        # ── Step 4: Fear & Greed soft modifier ────────────────────────────────
        final_score = _apply_fg(raw_score, fg)

        # ── Step 5: label + confidence ────────────────────────────────────────
        label      = _label(final_score)
        n_avail    = sum(1 for v in raw.values() if v is not None)
        confidence = _confidence(n_avail)

        # ── Step 6: sub_scores object ─────────────────────────────────────────
        sub_scores = _build_sub_scores(raw, norm_w)

        logger.info(
            "Score for %s: %.1f (%s) | %d/7 signals | raw=%.1f fg_adj=%.1f",
            ticker, final_score, label, n_avail, raw_score,
            final_score - raw_score,
        )

        # ── Step 7: GPT narrative (score is NOT modified) ─────────────────────
        ai_insights = _FALLBACK_INSIGHTS.copy()
        try:
            prompt  = _build_narrative_prompt(ticker, asset_type, final_score, label, sub_scores, signals)
            client  = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            message = await client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}],
            )
            raw_json    = message.choices[0].message.content.strip()
            ai_insights = json.loads(raw_json)
        except Exception as exc:
            logger.error("GPT narrative failed for %s: %s", ticker, exc)

        # ── Assemble response ─────────────────────────────────────────────────
        now = datetime.now(timezone.utc).isoformat()

        return {
            "asset_type":   asset_type,
            "asset_meta":   signals.get("asset_meta", {}),
            "ticker":       ticker,
            "company_name": yf.get("company_name"),
            "exchange":     (yf.get("price_data") or {}).get("exchange"),
            "generated_at": now,
            "data_freshness": {
                "price":      now,
                "news":       now,
                "social":     now,
                "insider":    now,
                "fear_greed": now,
            },
            # ── Score ──────────────────────────────────────────────────────────
            "market_mood_score":      round(final_score, 1),
            "market_mood_label":      label,
            "market_mood_confidence": confidence,
            "sub_scores":             sub_scores,
            "signals_available":      n_avail,
            "signals_total":          7,
            # ── Narrative ──────────────────────────────────────────────────────
            "ai_insights": ai_insights,
            # ── Data sections ──────────────────────────────────────────────────
            "price_data":   yf.get("price_data"),
            "fundamentals": yf.get("fundamentals"),
            "analyst_data": {
                **(yf.get("analyst_data") or {}),
                "earnings_surprises": fh.get("earnings_surprises", []),
            },
            "technical_indicators": {
                **(yf.get("technical_indicators") or {}),
                "rsi_14":     (av.get("technical_indicators") or {}).get("rsi_14"),
                "rsi_signal": (av.get("technical_indicators") or {}).get("rsi_signal"),
            },
            "news_sentiment": av.get("news_sentiment"),
            "social_sentiment": {
                "reddit": aw if aw else None,
                "search_trends": {
                    "source":                  "Google Trends",
                    "current_interest":        gt.get("current_interest"),
                    "interest_7d_ago":         gt.get("interest_7d_ago"),
                    "interest_change_percent": gt.get("interest_change_percent"),
                    "trend_direction":         gt.get("trend_direction"),
                    "related_rising_queries":  gt.get("related_rising_queries"),
                } if gt else None,
                "insider_sentiment": fh.get("insider_sentiment"),
            },
            "institutional_data": yf.get("institutional_data"),
            "fear_and_greed":     fg if fg else None,
        }

    except Exception as exc:
        logger.error("score_sentiment failed for %s: %s", ticker, exc)
        return {
            "ticker":                 ticker,
            "market_mood_score":      50,
            "market_mood_label":      "Neutral",
            "market_mood_confidence": "low",
            "sub_scores":             {},
            "signals_available":      0,
            "signals_total":          7,
            "ai_insights":            _FALLBACK_INSIGHTS.copy(),
        }
