# TheMarketMood.ai

A market-sentiment engine that scores any tradeable asset — stock, ETF, index, crypto, commodity, or forex pair — on a **0–100 mood scale** by aggregating signals from across the market, then wraps the number in an AI-written narrative.

The score is **fully deterministic**: it comes from a transparent, weighted formula over real market signals. A large language model is used **only** to explain the score in plain English — it never produces or adjusts the number.

## How it works

```
                 ┌─────────────────────────────────────────────┐
   ticker ──▶    │  aggregator.gather_signals()                │
                 │  yfinance → asset type, then concurrent:    │
                 │  Fear&Greed · Reddit · Finnhub · NewsAPI ·  │
                 │  Google Trends · (Alpha Vantage last)       │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                 ┌─────────────────────────────────────────────┐
                 │  scorer.score_sentiment()                   │
                 │  1. 7 sub-scores (each 0–100 or null)       │
                 │  2. redistribute weight from missing signals│
                 │  3. weighted sum                            │
                 │  4. Fear & Greed soft nudge (max ±4 pts)    │
                 │  5. label (5-tier) + confidence             │
                 │  6. Claude writes narrative — NOT the score │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                         JSON: score · label · sub-scores ·
                         AI insights · price/news/social data
```

### Scoring signals & weights

| Signal | Weight | Source |
|--------|-------:|--------|
| News sentiment | 25% | Alpha Vantage |
| Reddit momentum | 20% | ApeWisdom |
| Analyst consensus | 15% | yfinance |
| Price momentum (1-mo return) | 15% | yfinance |
| RSI-14 | 10% | Alpha Vantage |
| Google Trends interest | 10% | pytrends |
| Volume anomaly | 5% | yfinance |

Weight from any unavailable signal is redistributed proportionally across the rest, so a partial dataset still produces a meaningful score. CNN's Fear & Greed index is applied afterward as a soft ±4-point nudge. Sources are filtered by asset type (e.g. Fear & Greed and insider data only apply to equities) to avoid wasted API calls.

**Labels:** Bearish · Leaning Bearish · Neutral · Leaning Bullish · Bullish
**Confidence:** based on how many of the 7 signals were available (≥6 high · ≥4 medium · else low).

## Project layout

```
backend/                 FastAPI service (the scoring engine + API)
  app/
    main.py              app, CORS, routers, 15-min mood scheduler
    config.py            settings / env vars
    services/
      aggregator.py      concurrent signal collection
      scorer.py          deterministic scoring + Claude narrative
      mood.py            overall-market mood (refreshed every 15 min)
      sources/           one module per data provider
    api/routes/          health · sentiment · home · search ·
                         trending · mood · price_history · deep_analysis
frontend/                Next.js 14 (App Router, TypeScript, Tailwind)
  app/                   pages + components; per-asset routes
                         (stock/etf/index/crypto/commodity/forex)
                         all render through components/AssetPage.tsx
  lib/api.ts             typed client for the backend
  lib/data/              static Dow 30 / Nasdaq 100 constituents
data_validation/         standalone scripts to test each data source
agent/                   design-system, checklist & feature-spec docs
```

## API

Base path `/api`:

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/sentiment/{ticker}` | Full mood score + signals + narrative for a ticker |
| `GET`  | `/api/home` | Home-page payload |
| `GET`  | `/api/mood` | Overall market mood (cached, refreshed every 15 min) |
| `GET`  | `/api/trending` | Trending tickers |
| `GET`  | `/api/search?q=` | Ticker search |
| `GET`  | `/api/price-history/{ticker}` | Price history series |
| `POST` | `/api/deep-analysis` | Deeper on-demand analysis |

## Running locally

### Backend (Python 3.10)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env .env.local   # or create .env with the keys below
uvicorn app.main:app --reload --port 8080
```

Environment variables (`backend/.env`):

```
ALPHA_VANTAGE_API_KEY=
NEWSAPI_KEY=
FINNHUB_API_KEY=
ANTHROPIC_API_KEY=          # for the narrative (Claude Haiku)
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
CORS_ORIGINS=               # comma-separated; empty = localhost only
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Set the backend URL in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Deployment

- **Backend** — `Procfile` runs `uvicorn app.main:app` (Heroku-style; binds `$PORT`). Set `CORS_ORIGINS` to your production frontend domains.
- **Frontend** — deployed on Vercel; point `NEXT_PUBLIC_API_URL` at the deployed backend.

## Tech stack

**Backend:** FastAPI · APScheduler · Anthropic (Claude Haiku) · yfinance · pytrends · pandas/numpy · Redis
**Frontend:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Recharts / Chart.js · Framer Motion
