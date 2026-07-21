# Pre-Launch Notes

Findings from the 2026-07-20 diagnostics + stress-test pass (local stack: FastAPI
backend :8080, Next dev :3000; ~1,500 requests, zero 5xx, clean recovery). None
of these block the beta, but all should be addressed before a real launch.
Ordered by priority.

**2026-07-21 remediation pass:** items 1, 2 (coalescing), 4, and 5 are done,
plus the smaller items marked ✅ below. Status noted inline.

## 1. Rate limiting on the public backend  ✅ done (2026-07-21)

Per-IP fixed-window limits via `app/services/ratelimit.py` (Redis INCR, fails
open): deep-analysis 10/min, v1 sentiment 20/min, v2 insight 20/min, search
60/min, all other cached GETs 120/min shared. Deep-analysis additionally no
longer trusts client-supplied signals (rebuilt server-side) and caches its
output per (ticker, tab).

## 2. The v1 sentiment cold path (~17s) blocks asset pages  ✅ mostly done

Coalescing shipped (`app/services/singleflight.py`): N concurrent misses share
one computation, and invalid tickers are rejected before the signal fan-out
and negative-cached. Price history now overlaps the Claude round-trip and the
independent yfinance reads run concurrently, shaving several seconds off the
cold path. Still open if needed later:
- Scheduled pre-warm for the most-visited asset tickers (the mood/screener
  APScheduler pattern already exists in `main.py`).
- Long-term: migrate asset pages to SentimentAPI (blocked on its coverage —
  S&P 500 equities only today; no ETF/crypto/forex).

## 3. Verify Redis co-location in production

Locally every cache hit pays a ~250ms round trip to Redis on Railway, which
also caps cached throughput at ~98 req/s. In production the backend and Redis
must be in the same Railway region/network — verify, or the whole caching
layer is 250ms slower than it should be. (FastAPI itself measured 3,800 req/s;
the app server is not the bottleneck.)

## 4. Unknown-ticker semantics  ✅ done (2026-07-21)

v2 not-covered bodies now set `Cache-Control: no-store` (as do null-insight
and fallback-mood responses), so the middleware never browser-caches them.
The v2 200-with-body convention is kept deliberately — the frontend's
fallback boundary keys on `in_universe: false`. v1's 404 is now fast: ticker
shape is validated up front and unknown tickers are negative-cached for 1h.

## 5. Stock-page SSR fetches are sequential  ✅ done (2026-07-21)

`/stock/[ticker]` now starts the composite and history fetches together.

## 6. Smaller items

- **Screener payload**: ~0.5–1s per request even warm, ~15 req/s ceiling
  (502-row JSON blob). Consider trimming fields the table doesn't render, or
  gzip/brotli at the proxy.
- **Cache observability** ✅ done (2026-07-21): `get_cached` logs hit/miss
  per key at info level.
- **Memory soak**: backend RSS grew 12→38MB during the campaign — most likely
  pool warmup, but run a longer soak test before launch to rule out a leak.
- **Dead footer links** ✅ done (2026-07-21): `/privacy` and `/terms` pages
  exist (entity details still placeholder — fill in before launch); "Legal
  Disclaimer" links to `/terms#disclaimer`.
- **Pro blur**: the site-wide `.pro-blur` treatment (globals.css) is a
  pre-launch tease — remove the class usages when Pro actually launches.
- **API-access email capture**: the "Get notified" CTA is a mailto stopgap;
  replace with a real email-capture endpoint/list before promoting the page.
- **Secrets hygiene** ✅ gitignore done (verified 2026-07-21: `.env` files
  ignored and never committed; `USABLEKEYS.md` no longer exists). Key
  rotation for anything previously shared/screenshotted is still on you.
