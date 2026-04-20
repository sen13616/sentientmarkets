# Feature Spec: [Feature Name]

## Intent
One sentence — what does this feature do and why does it exist for SentientMarkets users?

## User Story
As a retail investor using SentientMarkets, I want to [action] so that [outcome related to market sentiment or investment decisions].

## Wireframe Description

Describe each screen/state in plain English. This is the layout contract — implementation must match.

- **Above the fold:** What the user sees without scrolling (key content, hierarchy)
- **Layout direction:** Row/column, grid structure (e.g. `240px 1fr` gauge-chart grid)
- **Regions:** What occupies left/right/top/bottom areas within the component or page section
- **Interaction behaviour:** Hover effects, expand/collapse, modals, tab switching, click targets
- **Mobile adaptation:** How the layout reflows at ≤600px (stack columns, hide secondary elements, etc.)

## UI Components

List every new or modified component with its file path. Reference paths from the existing structure:

| Component | File Path | New / Modified |
|-----------|-----------|----------------|
| _Example: PriceChart_ | `frontend/app/stock/[ticker]/PriceChart.tsx` | Modified |
| _Example: MoodCard_ | `frontend/app/MoodCard.tsx` | Modified |

### Existing components to be aware of:
- **Home page:** `frontend/app/page.tsx`
- **Root layout:** `frontend/app/layout.tsx`
- **Hero search:** `frontend/app/HeroSearch.tsx` (client component)
- **Mood card:** `frontend/app/MoodCard.tsx`
- **Fade-in wrapper:** `frontend/app/FadeIn.tsx`
- **Shared asset page:** `frontend/app/components/AssetPage.tsx` (used by stock, crypto, ETF, forex, commodity, index routes)
- **Stock detail page:** `frontend/app/stock/[ticker]/page.tsx`
- **CountUp animation:** `frontend/app/stock/[ticker]/CountUp.tsx`
- **Insight tabs:** `frontend/app/stock/[ticker]/InsightTabs.tsx`
- **Nav search:** `frontend/app/stock/[ticker]/NavSearch.tsx`
- **Price chart:** `frontend/app/stock/[ticker]/PriceChart.tsx`
- **API layer:** `frontend/lib/api.ts` (`getSentiment`, `getHome`, `getHomeData`, `searchTickers`, `getMood`)

### Asset type routes (all reuse `AssetPage.tsx`):
- `/stock/[ticker]`, `/crypto/[ticker]`, `/etf/[ticker]`, `/forex/[ticker]`, `/commodity/[ticker]`, `/index/[ticker]`

### CSS Modules:
- `frontend/app/globals.css` — design tokens and global styles
- `frontend/app/page.module.css` — home page
- `frontend/app/MoodCard.module.css` — mood card
- `frontend/app/stock/[ticker]/page.module.css` — asset detail page
- `frontend/app/stock/[ticker]/loading.module.css` — loading skeleton
- `frontend/app/stock/[ticker]/PriceChart.module.css` — chart wrapper

## Data Sources

Specify which of SentientMarkets' data sources this feature requires:

| Source | What it provides | FastAPI endpoint |
|--------|-----------------|------------------|
| **yfinance** | Price data, fundamentals, 52-week range, volume | `/api/sentiment/{ticker}` |
| **Alpha Vantage** | Technical indicators (RSI, SMA, EMA) | `/api/sentiment/{ticker}` |
| **CNN Fear & Greed** | Market-wide fear/greed index | `/api/home` |
| **Finnhub** | Analyst ratings, MSPR, insider sentiment, news | `/api/sentiment/{ticker}` |
| **ApeWisdom** | Reddit trending tickers, mention counts | `/api/home` |
| **Google Trends** | Search interest over time for tickers | `/api/sentiment/{ticker}` |
| **NewsAPI** | Headline news, article sentiment | `/api/sentiment/{ticker}` |
| **FMP (Financial Modeling Prep)** | Company profiles, financial statements | `/api/sentiment/{ticker}` |

> Delete rows that don't apply. Add any new endpoints needed.

### New backend routes (if any):
- `POST /api/...` — description
- Redis cache TTL: `___` seconds

## States to Handle

Every component must account for all four states:

| State | Behaviour |
|-------|-----------|
| **Default** | Data loaded successfully; render normally using design tokens from `DESIGN_SYSTEM.md` |
| **Loading (skeleton)** | Show pulsing skeleton placeholder (`--surface` background, `--line` shimmer). No spinners. Follow `DESIGN_SYSTEM.md §9.1`. |
| **Error / Fallback** | Display "Unavailable" label in `--tx3` colour. Never show a blank space, raw error, or broken layout. Follow `DESIGN_SYSTEM.md §9.2`. |
| **Empty** | Data returned but set is empty (e.g. no news articles). Show contextual empty message (e.g. "No recent news for TICKER"). |

## SentientMarkets Score Display (if applicable)

If this feature displays a SentientMarkets Score, it must use the correct classification and colour:

| Score Range | Label | Colour Token |
|-------------|-------|--------------|
| 0–20 | Bearish | `--red` |
| 21–35 | Somewhat Bearish | `--red` |
| 36–49 | Leaning Bearish | `--amber` |
| 50 | Neutral | `--amber` |
| 51–64 | Leaning Bullish | `--green` |
| 65–79 | Somewhat Bullish | `--green` |
| 80–100 | Bullish | `--green` |

## Acceptance Criteria

1. Feature works at all three breakpoints: 375px (mobile), 768px (tablet), 1280px (desktop)
2. No existing page content is removed, hidden, or repositioned unless explicitly specified above
3. Loading skeleton appears within 100ms of navigation
4. Error/fallback state shows "Unavailable" — never a blank space or raw error
5. All new API calls go through a FastAPI endpoint with a defined Redis cache TTL
6. FastAPI endpoint returns a structured fallback response if the upstream source is unavailable
7. All numeric values rendered in `IBM Plex Mono` (`--mono-num`)
8. Display headings use `Instrument Serif` (`--serif`); UI text uses `Geist` / `Geist Mono` (`--sans` / `--mono`)
9. Colours, spacing, and component styles conform to `DESIGN_SYSTEM.md`
10. Sentiment indicators use both colour and text label — colour alone is insufficient
11. All interactive elements have `:focus-visible` and `:active` states
12. `npm run build` completes with zero errors
13. No TypeScript errors (`tsc --noEmit` passes)
14. No existing routes return 404 or throw console errors after this change
15. _(Add feature-specific criteria here)_

## Open Questions

List any ambiguities that need resolving before build starts:

1. ...
