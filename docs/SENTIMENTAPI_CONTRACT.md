# SentimentAPI — Integration Contract

The contract for external consumers of the live SentimentAPI service. Everything in this document reflects the code as deployed; response examples are copied from the actual response models, not invented.

---

## Base URL

```
https://sentimentapi-p.up.railway.app
```

All endpoints are mounted under the `/v1` prefix except `/health`.

---

## Authentication

Every endpoint except `/health` and `/v1/status` requires a Bearer key:

```
Authorization: Bearer sk-sm-your-api-key
```

Keys are SHA-256 hashed server-side and resolve to a tier: `free` or `pro`. A missing, malformed, or unknown key returns **401** (shape below). To validate a key without spending quota, call `/health` with the key — it echoes the resolved tier.

---

## Rate limits (enforced, not aspirational)

<!-- Enforced live in api/rate_limit.py: tier limits at api/rate_limit.py:33-36
     (_LIMITS = {"free": 10, "pro": 120}); atomic Redis Lua INCR+EXPIRE at
     api/rate_limit.py:42-48 executed at :64 with a 60-second TTL; the 429 is
     raised at api/rate_limit.py:67-74. Routes are covered via the
     `rate_limited` dependency (api/rate_limit.py:77+), attached to
     sentiment, history, tickers, and market/overview. Verified against code
     2026-07-15 — these are live values, not documentation targets. -->

| Tier | Limit | Window |
| ---- | ----- | ------ |
| free | **10 requests** | fixed 60-second window per key |
| pro  | **120 requests** | fixed 60-second window per key |

Semantics consumers must know:

- The window is **fixed, not sliding**: the counter resets when the 60-second TTL expires. A client can therefore legally burst up to 2× its limit across a window boundary; conversely, after a 429 the worst-case wait is under 60 seconds.
- **429 responses carry no `Retry-After` header.** Back off for up to 60 seconds and retry.
- The limit is per key, shared across all endpoints (one bucket per key, not per route).
- `/health` and `/v1/status` are not rate-limited.

---

## Endpoints

### `GET /health` — public

Liveness probe; also validates keys. Never requires auth.

```json
{ "status": "ok" }
```

With a Bearer key attached, the resolved tier is included (`"tier": null` means the key is invalid):

```json
{ "status": "ok", "tier": "pro" }
```

---

### `GET /v1/tickers` — free & pro

The supported universe. No query parameters.

```bash
curl -H "Authorization: Bearer sk-sm-your-key" \
  https://sentimentapi-p.up.railway.app/v1/tickers
```

```json
{
  "universe_size": 502,
  "tickers": [
    { "ticker": "A",    "name": "Agilent Technologies Inc.", "sector": "Health Care" },
    { "ticker": "AAPL", "name": "Apple Inc.",                "sector": "Information Technology" }
  ]
}
```

- `sector` is the GICS sector; `name` and `sector` may be `null` for tickers whose metadata is not seeded.
- The universe is a fixed S&P 500 snapshot (502 symbols). A small number of symbols are delisted/renamed and will persistently report a missing `market` layer.

---

### `GET /v1/sentiment/{ticker}` — free & pro

Latest cached score. Requests are served from cache and **never trigger recomputation** — see *Data semantics* for the update cadence.

**Query parameters**

| Name | Default | Values |
| ---- | ------- | ------ |
| `detail` | `summary` | `summary` \| `full`. The pro payload is returned only when a **pro key** sends `detail=full`; otherwise the free shape is returned (a free key sending `detail=full` is silently downgraded). |

**Free-tier response** (also what pro keys get without `detail=full`):

```json
{
  "ticker": "AAPL",
  "score": 72,
  "score_change_1d": 3.25,
  "score_change_1d_pct": 4.73,
  "label": "Bullish",
  "confidence": 81,
  "timestamp": "2026-07-15T14:30:00+00:00",
  "cache_age_seconds": 480,
  "market_hours": {
    "is_open": true,
    "next_open": "2026-07-16T13:30:00+00:00",
    "last_close": "2026-07-14T20:00:00+00:00"
  }
}
```

**Pro-tier response** (`?detail=full` with a pro key):

```json
{
  "ticker": "AAPL",
  "score": 72,
  "score_raw": 74,
  "score_change_1d": 3.25,
  "score_change_1d_pct": 4.73,
  "universe_percentile": 87.3,
  "ema_obs_count": 1042,
  "label": "Bullish",
  "confidence": 81,
  "sub_indices": {
    "market": 78.0,
    "narrative": 69.0,
    "influencer": 80.0,
    "macro": 61.0
  },
  "missing_layers": [],
  "divergence": "aligned",
  "top_drivers": [
    {
      "signal": "Insider transaction",
      "description": "Insider purchased 12,000 shares",
      "direction": "bullish",
      "magnitude": 0.8,
      "source_layer": "influencer"
    }
  ],
  "explanation": "Sentiment is primarily driven by strong insider conviction.",
  "freshness": {
    "market_as_of":     "2026-07-15T14:30:00+00:00",
    "narrative_as_of":  "2026-07-15T14:00:00+00:00",
    "influencer_as_of": "2026-07-15T08:00:00+00:00",
    "macro_as_of":      "2026-07-15T02:00:00+00:00"
  },
  "confidence_flags": [],
  "timestamp": "2026-07-15T14:30:00+00:00",
  "cache_age_seconds": 480,
  "market_hours": {
    "is_open": true,
    "next_open": "2026-07-16T13:30:00+00:00",
    "last_close": "2026-07-14T20:00:00+00:00"
  }
}
```

**Field notes**

- `score_change_1d` / `score_change_1d_pct` — smoothed score minus the ticker's most recent score **aged 24–48 hours**. `null` when no such baseline exists (new ticker, or a data gap — the change is never computed across a gap). Both tiers.
- `universe_percentile` — the ticker's percentile (0–100) among all tickers scored in the **latest scoring tick**; `null` if the ticker was absent from that tick. Pro only.
- `score_raw` — the unsmoothed composite behind the EMA-smoothed `score`. Pro only.
- `ema_obs_count` — monotonic EMA update counter; low values mean the smoothing hasn't converged (cold start).
- `missing_layers` — layers with no data this tick; their composite weight was redistributed.
- `divergence` — `aligned` | `moderate_divergence` | `high_divergence`.

**Unknown ticker is NOT a 404 here.** `GET /v1/sentiment/{ticker}` returns **HTTP 200** with a `NoDataResponse` body:

```json
{
  "ticker": "XYZ",
  "status": "ticker_not_found",
  "message": "XYZ is not in the supported universe"
}
```

| `status` value | Meaning |
| --- | --- |
| `ticker_not_found` | Not in the supported universe |
| `insufficient_data` | Supported, but no scored data exists yet |
| `temporarily_unavailable` | Transient service issue |

Always branch on the presence of `status` before reading `score`.

---

### `GET /v1/sentiment/{ticker}/history` — pro only

Free keys receive **403**. Unknown tickers receive a real **404** on this endpoint.

**Query parameters**

| Name | Default | Constraints |
| ---- | ------- | ----------- |
| `days` | `30` | integer, `1`–`365` (values outside → 422) |
| `interval` | `raw` if `days=1`, else `daily` | `raw` \| `hourly` \| `daily` |

Maximum range is **365 days** (well beyond 90). Interval semantics: `raw` = every scoring tick; `hourly` / `daily` = the **latest tick** of each hour/day (not an average).

```bash
curl -H "Authorization: Bearer sk-sm-your-key" \
  "https://sentimentapi-p.up.railway.app/v1/sentiment/AAPL/history?days=30&interval=daily"
```

```json
{
  "ticker": "AAPL",
  "history": [
    {
      "timestamp": "2026-07-14T23:30:00+00:00",
      "score": 68,
      "score_raw": 71,
      "label": "Bullish",
      "confidence": 79,
      "sub_indices": {
        "market": 71.0,
        "narrative": 65.0,
        "influencer": 74.0,
        "macro": 58.0
      },
      "missing_layers": []
    }
  ]
}
```

Every entry carries the smoothed `score`, the unsmoothed `score_raw`, and per-entry `sub_indices` — enough to chart the composite and overlay layer trends from a single call.

---

### `GET /v1/market/overview` — pro only

Universe-level statistics for the **latest scoring tick**, served from a single per-tick cached blob (one cheap read; poll at the same cadence as sentiment). Free keys receive **403**. Before the first tick after a deployment, returns **503** `temporarily_unavailable`.

```bash
curl -H "Authorization: Bearer sk-sm-your-key" \
  https://sentimentapi-p.up.railway.app/v1/market/overview
```

```json
{
  "timestamp": "2026-07-15T14:30:00+00:00",
  "universe_scored": 502,
  "average_score": 55.2,
  "breadth_above_50_pct": 63.5,
  "breadth_improving_pct": 48.2,
  "top_movers": [
    { "ticker": "AAPL", "score": 72.0, "score_change_1d": 3.25, "score_change_1d_pct": 4.73 }
  ],
  "bottom_movers": [
    { "ticker": "MSFT", "score": 55.0, "score_change_1d": -1.5, "score_change_1d_pct": -2.65 }
  ],
  "sectors": [
    {
      "sector": "Information Technology",
      "average_score": 58.4,
      "size": 68,
      "tickers": [
        { "ticker": "NVDA", "score": 74.1, "rank": 1 },
        { "ticker": "AAPL", "score": 72.0, "rank": 2 }
      ]
    }
  ]
}
```

- `timestamp` — the scoring tick the blob was computed at (all figures are as-of this instant).
- `breadth_above_50_pct` — % of scored universe above 50; `breadth_improving_pct` — % with positive `score_change_1d`, among tickers that have a 1-day baseline; `null` when none do (e.g. first ticks after a data gap).
- `top_movers` / `bottom_movers` — up to 10 each, ranked by `score_change_1d`; tickers with a `null` change are excluded, so these lists can be empty after a gap.
- `sectors[].tickers[].rank` — within-sector rank by score, `1` = highest; combine with `size` to render "#4 of 68 in Information Technology". Every scored ticker with a known sector appears exactly once.

---

## Error shapes

FastAPI wraps `HTTPException` bodies under a `detail` key. The concrete shapes:

**401 — missing/invalid key** (any authenticated endpoint):
```json
{ "detail": { "error": "unauthorized", "message": "Invalid or missing API key" } }
```

**403 — tier gate** (free key on `/history` or `/market/overview`):
```json
{ "detail": { "error": "forbidden", "message": "History endpoint requires Pro tier" } }
```

**404 — unknown ticker on `/history` only** (the sentiment endpoint returns 200 + `NoDataResponse` instead):
```json
{ "detail": { "error": "ticker_not_found", "message": "Ticker 'XYZ' is not in the supported universe" } }
```

**422 — parameter validation** (e.g. `days=500`, `interval=foo`): FastAPI's standard validation body (`{"detail": [{"loc": …, "msg": …, "type": …}]}`).

**429 — rate limit:**
```json
{ "detail": { "error": "rate_limit_exceeded", "message": "Too many requests for your tier" } }
```
No `Retry-After` header is sent. The window is a fixed 60 seconds — back off up to 60s and retry.

**503 — overview not yet computed** (`/market/overview` before the first tick):
```json
{ "detail": { "error": "temporarily_unavailable", "message": "Market overview has not been computed yet — try again after the next scoring tick" } }
```

**5xx (other)** — treat any other 5xx as transient; retry with exponential backoff.

---

## Data semantics

Things a consumer must understand to interpret the numbers correctly:

- **Scale.** All scores and sub-indices are on **[0, 100] with 50 = neutral** (above 50 bullish, below bearish). Labels: 0–20 Strongly Bearish, 21–40 Bearish, 41–60 Neutral, 61–80 Bullish, 81–100 Strongly Bullish.
- **Smoothing.** `score` is a **4-hour-half-life EMA** of the composite (`α = 1 − 0.5^(Δt/4h)`); `score_raw` is the unsmoothed composite underneath. Expect `score` to lag fast moves by design.
- **Sub-indices.** `market`, `narrative`, `influencer`, `macro` — each on [0, 100]; the composite is their weighted average (market 0.35, narrative 0.30, influencer 0.25, macro 0.10, renormalized over present layers).
- **Update cadence.** One global scoring tick recomputes all tickers: **every 30 minutes off-hours (:00/:30 UTC), every 15 minutes during US market hours (weekdays ~14:30–21:00 UTC)**. Scores never update between ticks, and requests never trigger recomputation — polling faster than the cadence just re-reads the same value. Use `timestamp` (the tick) and `cache_age_seconds` to detect a fresh tick.
- **Known data gap.** There is **no data from 2026-06-23 ~14:46 UTC to 2026-07-03 ~05:30 UTC** (total service outage). History responses simply omit that span. **Consumers must skip gaps, never interpolate across them** — do not draw a connecting line across the gap in charts, and do not compute day-over-day deltas across it. The API follows the same rule internally: `score_change_1d` is `null` whenever the 24–48h baseline falls in a gap.
- **Freshness.** `timestamp` is the last scoring tick for the ticker; `cache_age_seconds` is seconds since then. Staleness is measured against the tick, not against source data — per-source data ages are in the pro `freshness` object (`*_as_of` per layer). Off-hours, a `cache_age_seconds` up to ~1800 is normal.
- **Cold starts.** Low `ema_obs_count` means the smoothed score hasn't converged; `universe_percentile`, `score_change_1d`, and `/market/overview` movers can all be `null`/empty in the first ticks after a deployment or gap. `null` always means "not computable" — never "zero".

---

## Changelog

<!-- Add an entry here for every revision of this contract: date, change, affected endpoints/fields. -->

- **2026-07-15** — Rewritten as a consumer contract. Added: `score_change_1d` + `score_change_1d_pct` (both tiers), `universe_percentile` (pro), `GET /v1/market/overview` (pro). Documented enforced rate limits (fixed 60s window, no `Retry-After`), exact error shapes, the 200-vs-404 unknown-ticker split, the 2026-06-23→07-03 data gap and the skip-don't-interpolate rule, and the adaptive 15/30-minute scoring cadence.
