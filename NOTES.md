# Pre-Launch Notes

Findings from the 2026-07-20 diagnostics + stress-test pass (local stack: FastAPI
backend :8080, Next dev :3000; ~1,500 requests, zero 5xx, clean recovery). None
of these block the beta, but all should be addressed before a real launch.
Ordered by priority.

## 1. Rate limiting on the public backend  ⚠️ do first

There is none today. Two concrete exposures:

- `/api/v2/stock/{ticker}/insight` triggers a **paid Claude call** on every
  cache miss — a hostile loop over all 502 tickers spends real Anthropic budget
  (one call per ticker per 15-min window).
- `/api/sentiment/{ticker}` (v1) runs ~17s of live computation per uncached
  ticker — a cheap DoS vector.

Fix: per-IP rate limit middleware (e.g. `slowapi`) with a tight budget on the
two expensive routes, generous elsewhere. The API-access product tier limits
(10/600 req/min) are enforced upstream by SentimentAPI and don't cover these.

## 2. The v1 sentiment cold path (~17s) blocks asset pages

`/api/sentiment/{ticker}` computes in-process on cache miss (measured 16.9s for
AAPL; `/etf/QQQ` SSR: 15.2s cold vs 0.09s warm, 1-hour TTL). The dark asset
pages (`/etf`, `/crypto`, `/forex`, `/commodity`) fetch it during SSR, so the
first visitor per ticker per hour eats the full wait. No request coalescing:
N concurrent misses on one ticker = N parallel 17s computations.

Options (any one helps, roughly in order of effort):
- In-flight lock so concurrent misses share one computation (coalescing).
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

## 4. Unknown-ticker semantics are inconsistent (v1 vs v2)

- v2 (`/api/v2/stock/ZZZZFAKE`) returns **HTTP 200** with a `ticker_not_found`
  body — which now also picks up a `public` Cache-Control header, so junk
  tickers get browser-cached like real ones.
- v1 returns a 404, but only after ~3.6s of live lookups.

Pick one convention (404 with JSON body recommended), and exclude error bodies
from the Cache-Control middleware in `backend/app/main.py`.

## 5. Stock-page SSR fetches are sequential

`/stock/[ticker]` renders at p50 1.2s / p95 2.7s under just 15 concurrent
users (dev server, but the shape carries to prod): the server component makes
several `no-store` backend calls one after another. Wrap them in
`Promise.all` for an easy win.

## 6. Smaller items

- **Screener payload**: ~0.5–1s per request even warm, ~15 req/s ceiling
  (502-row JSON blob). Consider trimming fields the table doesn't render, or
  gzip/brotli at the proxy.
- **Cache observability**: add a hit/miss log line in
  `backend/app/services/cache.py` so post-launch caching decisions are driven
  by real hit rates.
- **Memory soak**: backend RSS grew 12→38MB during the campaign — most likely
  pool warmup, but run a longer soak test before launch to rule out a leak.
- **Dead footer links**: `/privacy`, `/terms`, and "Legal Disclaimer" have no
  pages behind them. Write them or drop the links before launch.
- **Pro blur**: the site-wide `.pro-blur` treatment (globals.css) is a
  pre-launch tease — remove the class usages when Pro actually launches.
- **API-access email capture**: the "Get notified" CTA is a mailto stopgap;
  replace with a real email-capture endpoint/list before promoting the page.
- **Secrets hygiene**: `backend/.env` and `USABLEKEYS.md` are untracked but
  not gitignored — add them to `.gitignore`, and rotate any keys that were
  ever shared or screenshotted.
