# TheMarketMood.ai — Agent Pre-Completion Checklist

Before marking any feature done, verify every item below.

---

## Build & Type Safety
- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript errors (`tsc --noEmit` clean)
- [ ] No `any` types introduced without justification

## Responsiveness
- [ ] Tested at **375px** (mobile)
- [ ] Tested at **768px** (tablet)
- [ ] Tested at **1280px** (desktop)
- [ ] Layout does not overflow or collapse at any breakpoint

## State Handling
- [ ] **Loading state** implemented — pulsing skeleton with `--surface` background and `--line` shimmer (per `DESIGN_SYSTEM.md §9.1`), no spinners
- [ ] **Error / fallback state** implemented — displays "Unavailable" in `--tx3`, never blank space or raw error (per `DESIGN_SYSTEM.md §9.2`)
- [ ] **Empty state** implemented where applicable — contextual message, not blank

## Data Integrity
- [ ] No hardcoded dummy data in committed code
- [ ] No existing page content removed or hidden unless explicitly specified in the feature spec
- [ ] All numeric values sourced from the API, not static placeholders

## Backend & Caching (FastAPI + Redis)
- [ ] Every new API call has a Redis cache TTL explicitly set
- [ ] Every new FastAPI endpoint returns a structured fallback response if the upstream source (yfinance, Alpha Vantage, CNN F&G, Finnhub, ApeWisdom, Google Trends, NewsAPI, FMP) is unavailable
- [ ] Cache TTL is appropriate for the data freshness requirement (e.g. 60s for price data, 900s for home page aggregates)

## Design Conformance (`DESIGN_SYSTEM.md`)
- [ ] Colours use design tokens (`--green`, `--red`, `--amber`, `--blue`, `--tx1`/`--tx2`/`--tx3`, `--bg`, `--surface`) — no hardcoded hex values
- [ ] Surfaces follow token rules: `--bg` for page, `--surface` for cards, `--surface-2` for elevated elements
- [ ] Borders use `--line` (card edges) or `--line-soft` (row dividers within cards)
- [ ] Spacing follows the 4px base grid defined in `DESIGN_SYSTEM.md §4`
- [ ] Hover states use `--surface-hov` overlay on clickable cards
- [ ] Z-index values use tokens (`--z-base`, `--z-overlay`, `--z-nav`, `--z-modal`, `--z-toast`) — no hardcoded z-index numbers

## Typography
- [ ] **Numbers** (prices, percentages, scores, volumes) use `IBM Plex Mono` (`font-family: var(--mono-num)`)
- [ ] **Display headings** (hero, section titles) use `Instrument Serif` (`font-family: var(--serif)`)
- [ ] **UI text** (labels, descriptions, body) uses `Geist` (`font-family: var(--sans)`)
- [ ] **Code-style labels** (tags, badges, section headers) use `Geist Mono` (`font-family: var(--mono)`)
- [ ] Font sizes and weights match the type scale in `DESIGN_SYSTEM.md §2`

## MarketMood Score Display
- [ ] Score uses the correct classification label:
  - 0–20 → Bearish | 21–35 → Somewhat Bearish | 36–49 → Leaning Bearish
  - 50 → Neutral
  - 51–64 → Leaning Bullish | 65–79 → Somewhat Bullish | 80–100 → Bullish
- [ ] Score label colour matches the sentiment:
  - Bearish / Somewhat Bearish → `--red`
  - Leaning Bearish / Neutral → `--amber`
  - Leaning Bullish / Somewhat Bullish / Bullish → `--green`
- [ ] Score value rendered in `IBM Plex Mono` (`--mono-num`)

## Accessibility
- [ ] All interactive elements have `:focus-visible` outline (`1px solid var(--tx2)`, `outline-offset: 2px`) — not relying on browser defaults
- [ ] Buttons and cards have `:active` pressed state (`scale(0.97)` or `opacity: 0.8`)
- [ ] Colour is not the only way to convey sentiment — text labels accompany green/red/amber indicators
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have `aria-label` or associated `<label>`

## No Regressions
- [ ] No existing routes return 404 or throw a console error after this change
- [ ] Adjacent pages/components not modified by this feature still render correctly
- [ ] No new console warnings or errors in browser devtools

## Final Checks
- [ ] No `console.log` or debug statements left in committed code
- [ ] CSS Modules used for all new component styles — no inline styles, Tailwind, or global class leaks
- [ ] New components follow the co-located file pattern (`ComponentName.tsx` + `ComponentName.module.css`)
- [ ] Text inputs follow the base input pattern from `DESIGN_SYSTEM.md §6.1`
