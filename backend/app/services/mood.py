"""
Market Mood Service
Fetches macro signals every 60 minutes and uses Claude to generate
a single emotional state word describing the overall market mood.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone

from app.services.anthropic_client import get_anthropic

from app.config import settings
from app.services.cache import get_cached, set_cached
from app.services.sources.yfinance import get_yfinance_data
from app.services.sources.fear_greed import get_fear_greed_data
from app.services.sources.apewisdom import get_trending_tickers
from app.services.sources.finnhub import get_market_news
from app.services.sentiment_api import get_overview

logger = logging.getLogger(__name__)

_FALLBACK_MOOD = {
    "emotion": "Uncertain",
    "rationale": "Market mood analysis temporarily unavailable.",
    "intensity": 5,
    "key_signals": [],
    "accent_color": "gray",
    "timestamp": None,
}

# Emotion → accent color mapping. Derived server-side; the LLM no longer
# outputs accent_color. Keys double as the permitted emotion vocabulary.
_EMOTION_COLOR: dict[str, str] = {
    # Extreme fear
    "Panicked": "red", "Desperate": "red", "Paralysed": "red",
    # Nuanced fear
    "Anxious": "amber", "Nervous": "amber", "Uneasy": "amber", "Wary": "amber",
    # Caution / uncertainty
    "Cautious": "amber", "Uncertain": "amber", "Indecisive": "amber", "Hesitant": "amber",
    # Flat / disengaged
    "Numb": "gray", "Exhausted": "amber", "Complacent": "gray", "Denial": "gray",
    # Behavioural / impulsive
    "FOMO": "amber", "Impulsive": "amber", "Defiant": "gray",
    # Recovery / stabilisation
    "Relieved": "blue", "Recovering": "blue", "Stabilising": "blue", "Rebounding": "blue",
    # Positive / bullish
    "Hopeful": "green", "Optimistic": "green", "Confident": "green", "Buoyant": "green",
    # Extreme greed
    "Exuberant": "teal", "Euphoric": "teal",
}

_PERMITTED_EMOTIONS = list(_EMOTION_COLOR)

# Structured-outputs schema — guarantees valid JSON with a permitted emotion word.
_MOOD_SCHEMA = {
    "type": "object",
    "properties": {
        "emotion": {"type": "string", "enum": _PERMITTED_EMOTIONS},
        "rationale": {"type": "string"},
        "intensity": {"type": "integer"},
        "key_signals": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["emotion", "rationale", "intensity", "key_signals"],
    "additionalProperties": False,
}

_SYSTEM_PROMPT = """You are the market-mood engine for a sentiment-based trading application.

Traders use this application to factor overall market sentiment into their positioning and risk decisions. Your output is shown on a live dashboard as the single most prominent read of how the market "feels" right now, so it must be accurate, strictly grounded in the signals you are given, and free of hype — a misread directly affects how users trade.

You will be given a snapshot of macro market signals and must distil it into a single emotional word that best describes the current market mood, together with a short, evidence-based explanation.

Permitted emotion words (use ONLY these):

# Extreme fear
Panicked, Desperate, Paralysed

# Nuanced fear
Anxious, Nervous, Uneasy, Wary

# Caution / uncertainty
Cautious, Uncertain, Indecisive, Hesitant

# Flat / disengaged
Numb, Exhausted, Complacent, Denial

# Behavioural / impulsive
FOMO, Impulsive, Defiant

# Recovery / stabilisation
Relieved, Recovering, Stabilising, Rebounding

# Positive / bullish
Hopeful, Optimistic, Confident, Buoyant

# Extreme greed
Exuberant, Euphoric

Rules:
1. Choose the single most accurate emotion word from the permitted list only
2. Write a rationale of exactly 2 sentences explaining the market's emotional state, grounded in the specific signals provided
3. Rate intensity 1-10 (1=barely present, 10=extreme)
4. List 3-5 key signals that drove your choice as short strings
5. Base your read only on the signals given — never invent data, and do not issue direct buy/sell/hold instructions; you describe sentiment, the trader makes the call

Respond with JSON:
{
  "emotion": string,
  "rationale": string,
  "intensity": integer,
  "key_signals": array of 3-5 strings
}"""


async def fetch_mood_signals() -> dict:
    """Fetch all macro signals needed for mood generation."""
    try:
        spy_data, fear_greed, ape, news, ov = await asyncio.gather(
            get_yfinance_data('SPY'),
            get_fear_greed_data(),
            get_trending_tickers(10),
            get_market_news(),
            get_overview(),
            return_exceptions=True,
        )

        # Normalise exceptions to empty defaults
        spy  = spy_data  if isinstance(spy_data,  dict) else {}
        fg   = fear_greed if isinstance(fear_greed, dict) else {}
        ape  = ape        if isinstance(ape,        list) else []
        news = news       if isinstance(news,       dict) else {}
        overview = ov     if isinstance(ov,         dict) else {}

        sectors = sorted(
            (s for s in overview.get("sectors", []) if s.get("average_score") is not None),
            key=lambda s: s["average_score"],
            reverse=True,
        )

        def _fmt_movers(movers: list) -> list[str]:
            return [
                f"{m['ticker']} {m['score_change_1d']:+.1f}"
                for m in movers[:3]
                if m.get("ticker") and m.get("score_change_1d") is not None
            ]

        spy_price  = spy.get("price_data", {}).get("current_price")
        spy_vol    = spy.get("price_data", {}).get("volume")
        spy_avgvol = spy.get("price_data", {}).get("average_volume")
        spy_vol_ratio = (
            round(spy_vol / spy_avgvol, 2)
            if spy_vol and spy_avgvol and spy_avgvol > 0
            else None
        )

        snapshot = {
            "timestamp":            datetime.now(timezone.utc).isoformat(),
            "spy_price":            spy_price,
            "spy_change_percent":   spy.get("price_data", {}).get("change_percent"),
            "spy_vs_50d_ma":        spy.get("technical_indicators", {}).get("price_vs_50d_ma_percent"),
            "spy_vs_200d_ma":       spy.get("technical_indicators", {}).get("price_vs_200d_ma_percent"),
            "spy_volume_ratio":     spy_vol_ratio,
            "vix":                  None,   # filled below
            "vix_change_percent":   None,
            "fear_greed_score":     fg.get("score"),
            "fear_greed_label":     fg.get("label"),
            "fear_greed_trend":     fg.get("trend"),
            "fear_greed_1w_ago":    fg.get("one_week_ago"),
            "market_momentum":      (fg.get("sub_indicators") or {}).get("market_momentum", {}).get("score"),
            "stock_breadth":        (fg.get("sub_indicators") or {}).get("stock_price_breadth", {}).get("score"),
            "put_call_ratio":       (fg.get("sub_indicators") or {}).get("put_call_ratio", {}).get("score"),
            "junk_bond_demand":     (fg.get("sub_indicators") or {}).get("junk_bond_demand", {}).get("score"),
            "sp500_average_score":          overview.get("average_score"),
            "sp500_breadth_above_50_pct":   overview.get("breadth_above_50_pct"),
            "sp500_breadth_improving_pct":  overview.get("breadth_improving_pct"),
            "sp500_summary":                overview.get("summary") or None,
            "sp500_top_movers":             _fmt_movers(overview.get("top_movers") or []),
            "sp500_bottom_movers":          _fmt_movers(overview.get("bottom_movers") or []),
            "sp500_leading_sectors":        [f"{s['sector']} ({s['average_score']:.1f})" for s in sectors[:2]],
            "sp500_lagging_sectors":        [f"{s['sector']} ({s['average_score']:.1f})" for s in sectors[-1:] if len(sectors) > 2],
            "sp500_universe_scored":        overview.get("universe_scored"),
            "top_reddit_tickers":   [t.get("ticker") for t in ape[:5]],
            "reddit_momentum":      [t.get("momentum_signal") for t in ape[:5]],
            "news_sentiment_label": None,
            "top_headlines":        [a.get("title") for a in news.get("articles", [])[:3]],
        }

        # Fetch VIX separately (sequential, fast)
        try:
            vix_data = await get_yfinance_data('^VIX')
            snapshot["vix"]              = vix_data.get("price_data", {}).get("current_price")
            snapshot["vix_change_percent"] = vix_data.get("price_data", {}).get("change_percent")
        except Exception as exc:
            logger.warning("VIX fetch failed: %s", exc)

        return snapshot

    except Exception as exc:
        logger.error("fetch_mood_signals failed: %s", exc)
        return {}


async def generate_mood(snapshot: dict) -> dict:
    """Call Claude with the macro snapshot and return a structured mood object."""
    try:
        spy_change = snapshot.get('spy_change_percent') or 0
        spy_50d    = snapshot.get('spy_vs_50d_ma') or 0
        spy_200d   = snapshot.get('spy_vs_200d_ma') or 0
        vix_chg    = snapshot.get('vix_change_percent') or 0

        # S&P 500 universe block — omitted entirely when the overview endpoint
        # is unavailable; individual lines drop out after a data gap (null
        # improving breadth, empty movers).
        sp500_block = ""
        if snapshot.get('sp500_average_score') is not None:
            n = snapshot.get('sp500_universe_scored')
            breadth = f"  Breadth: {snapshot.get('sp500_breadth_above_50_pct')}% above neutral"
            if snapshot.get('sp500_breadth_improving_pct') is not None:
                breadth += f", {snapshot.get('sp500_breadth_improving_pct')}% improving vs 1d ago"
            lines = [
                f"S&P 500 SENTIMENT (in-house per-ticker universe, {n} names scored):",
                f"  Average score: {snapshot.get('sp500_average_score')}/100",
                breadth,
            ]
            if snapshot.get('sp500_summary'):
                lines.append(f"  Summary: {snapshot['sp500_summary']}")
            if snapshot.get('sp500_top_movers'):
                lines.append(f"  Top movers: {', '.join(snapshot['sp500_top_movers'])}")
            if snapshot.get('sp500_bottom_movers'):
                lines.append(f"  Bottom movers: {', '.join(snapshot['sp500_bottom_movers'])}")
            if snapshot.get('sp500_leading_sectors'):
                sector_line = f"  Leading sectors: {', '.join(snapshot['sp500_leading_sectors'])}"
                if snapshot.get('sp500_lagging_sectors'):
                    sector_line += f" | Lagging: {', '.join(snapshot['sp500_lagging_sectors'])}"
                lines.append(sector_line)
            sp500_block = "\n".join(lines) + "\n\n"

        user_prompt = f"""MARKET SNAPSHOT ({snapshot.get('timestamp', 'now')}):

PRICE ACTION (SPY):
  SPY: ${snapshot.get('spy_price')} ({spy_change:+.2f}% today)
  SPY vs 50d MA: {spy_50d:+.1f}%
  SPY vs 200d MA: {spy_200d:+.1f}%
  VIX: {snapshot.get('vix')} ({vix_chg:+.1f}% today)

FEAR & GREED (CNN):
  Score: {snapshot.get('fear_greed_score')}/100 — {snapshot.get('fear_greed_label')}
  Last week: {snapshot.get('fear_greed_1w_ago')} → Trend: {snapshot.get('fear_greed_trend')}
  Market momentum: {snapshot.get('market_momentum')}
  Stock breadth: {snapshot.get('stock_breadth')}
  Put/call ratio score: {snapshot.get('put_call_ratio')}
  Junk bond demand: {snapshot.get('junk_bond_demand')}

{sp500_block}RETAIL SENTIMENT (Reddit):
  Top tickers: {', '.join(t for t in snapshot.get('top_reddit_tickers', []) if t)}

TOP HEADLINES:
  {chr(10).join(f'- {h}' for h in snapshot.get('top_headlines', []) if h)}
"""

        response = await get_anthropic().messages.create(
            model="claude-haiku-4-5",
            max_tokens=400,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            output_config={"format": {"type": "json_schema", "schema": _MOOD_SCHEMA}},
        )

        raw  = next(b.text for b in response.content if b.type == "text").strip()
        mood = json.loads(raw)
        mood["accent_color"] = _EMOTION_COLOR.get(mood.get("emotion"), "gray")
        mood["timestamp"] = snapshot.get("timestamp")
        mood["snapshot"]  = snapshot
        return mood

    except Exception as exc:
        logger.error("generate_mood failed: %s", exc)
        fallback = _FALLBACK_MOOD.copy()
        fallback["timestamp"] = datetime.now(timezone.utc).isoformat()
        return fallback


async def refresh_mood() -> dict:
    """Fetch signals, generate mood, store in Redis, return result."""
    logger.info("Refreshing market mood...")
    snapshot = await fetch_mood_signals()
    if not snapshot:
        logger.warning("Empty snapshot — skipping mood generation")
        return {}

    mood = await generate_mood(snapshot)

    # Don't poison the cache with the fallback — keep the previous good mood
    # in mood:latest/mood:history and let the next cycle self-heal.
    if (
        mood.get("emotion") == _FALLBACK_MOOD["emotion"]
        and mood.get("rationale") == _FALLBACK_MOOD["rationale"]
    ):
        logger.warning("Mood generation fell back — not caching fallback mood")
        # Short-lived backoff so an Anthropic outage doesn't re-run the full
        # signal fan-out on every /api/mood request while mood:latest is empty.
        await set_cached("mood:fallback", mood, ttl=120)
        return mood

    # Store latest (65 min TTL — longer than the 60 min refresh interval)
    await set_cached("mood:latest", mood, ttl=3900)

    # Append to history (keep last 5 entries). Writers are serialized through
    # coalesce("mood:refresh", ...) — route misses and the scheduler share the
    # same key — so this read-modify-write cannot interleave; the timestamp
    # guard additionally makes a back-to-back double refresh idempotent.
    history_raw = await get_cached("mood:history")
    history = history_raw if isinstance(history_raw, list) else []
    if history and history[-1].get("timestamp") == mood.get("timestamp"):
        logger.info("Mood history already has this tick — skipping append")
        return mood
    history.append({
        "emotion":      mood.get("emotion"),
        "accent_color": mood.get("accent_color"),
        "timestamp":    mood.get("timestamp"),
        "intensity":    mood.get("intensity"),
    })
    history = history[-5:]
    await set_cached("mood:history", history, ttl=86400)

    logger.info("Market mood: %s (intensity: %s)", mood.get("emotion"), mood.get("intensity"))
    return mood
