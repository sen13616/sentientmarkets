# API Changes — 2026-07-20 Storage Overhaul

**Audience:** the website codebase (frontend that fetches sentiment data for graphs).
**TL;DR: No action required. Zero breaking changes.** Every endpoint URL, auth header, rate limit, and response schema is byte-for-byte identical to before. Everything that changed on 2026-07-20 was internal database storage.

---

## What changed (backend only — invisible over the API)

The production database was shrunk from 5.5 GB to 3.3 GB:

1. Duplicate raw signal rows were deleted (internal ingestion table; never served).
2. `price_snapshots` now only records prices during US market hours (internal research table; **no endpoint serves it** — the website has never been able to fetch it).
3. `sentiment_history.top_drivers` JSONB is re-encoded to a compact storage format for rows **older than 30 days** (a daily server job keeps this rolling). This is the only change that touches a table the API reads — see below for why it still doesn't affect responses.

## Why the driver change cannot affect the website

- `GET /v1/sentiment/{ticker}` builds `top_drivers` from the **most recent scoring tick only** (via Redis cache or the newest DB row). Rows newer than 30 days are always stored in the original format, so the response's `top_drivers` array is unchanged: objects with `signal`, `description`, `direction`, `magnitude`, `source_layer`.
- `GET /v1/sentiment/{ticker}/history` — the endpoint used for graphs — **has never included `top_drivers`** in its response. Its per-entry schema is unchanged (see reference below).
- Compact-format rows are never serialized into any API response.

## Endpoint-by-endpoint status

| Endpoint | Status |
|---|---|
| `GET /v1/sentiment/{ticker}` | Unchanged (schema + values) |
| `GET /v1/sentiment/{ticker}/history` | Unchanged (schema + values) |
| `GET /v1/market/overview` | Unchanged |
| `GET /v1/tickers` | Unchanged |
| `GET /v1/status` | Unchanged |
| `GET /health` | Unchanged |
| Auth (`Authorization: Bearer …`) & rate limits (free 10/min, pro 600/min) | Unchanged |

## Reference: history entry schema (for graphing)

Each element of `history[]` from `GET /v1/sentiment/{ticker}/history?days=N` (Pro tier, `interval=hour|day|tick`):

```json
{
  "timestamp": "2026-07-20T05:00:00Z",
  "score": 50,               // smoothed composite — plot this as the primary line
  "score_raw": 50,           // unsmoothed composite (nullable)
  "label": "neutral",
  "confidence": 55,
  "sub_indices": { "market": 48.2, "narrative": 50.2, "influencer": 57.5, "macro": 31.5 },
  "missing_layers": ["market"]
}
```

Notes that were already true and remain true:
- `sub_indices` values are nullable (a layer can be missing for a given tick; `missing_layers` names them). Handle gaps rather than treating null as 0.
- There is a data gap 2026-06-23 → 2026-07-03 (pipeline outage); graphs spanning that window will have no points there.
- Scores are on a 0–100 scale; 50 is neutral.

## One forward-looking constraint (only relevant for FUTURE features)

If the website ever wants to add a feature showing *historical* driver explanations (e.g. "what drove this score 3 months ago"), be aware: the API has never exposed that, and as of 2026-07-20 the backend no longer retains driver `description` strings for rows older than 30 days (they were archived offline). Historical drivers older than 30 days would be available only as `signal / direction / magnitude / confidence / source_layer` — without the human-readable sentence. Don't design around retrieving old descriptions.

---

*Backend contacts: sentiment_history is now 1.6 GB / 2.14M rows; compaction runs daily at 03:30 UTC as part of `retention_job`. Full details in the backend repo's `CHANGELOG.md` (Phase 6, Sprint P6.1) and `docs/DATA_DICTIONARY.md`.*
