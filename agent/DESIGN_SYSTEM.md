# TheMarketMood.ai — Design System

> **Version:** 1.0.0 · **Locked:** 2026-04-11
> **Source of truth** for all frontend styling. Do not deviate without updating this document.
> Reference mockups: `design/homepage-mockup.html`, `design/stock-detail-mockup.html`

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Typography](#2-typography)
3. [Color System](#3-color-system)
4. [Spacing & Layout](#4-spacing--layout)
5. [Breakpoints & Responsive Rules](#5-breakpoints--responsive-rules)
6. [Components](#6-components)
   - [Navigation](#61-navigation)
   - [Hero](#62-hero)
   - [Section Label](#63-section-label)
   - [Tags / Badges](#64-tags--badges)
   - [Index Cards](#65-index-cards)
   - [Fear & Greed Dashboard](#66-fear--greed-dashboard)
   - [Reddit Trending Table](#67-reddit-trending-table)
   - [News Grid](#68-news-grid)
   - [Mood Card](#69-mood-card)
   - [Stock Header](#610-stock-header)
   - [Gauge Pane](#611-gauge-pane)
   - [Price Chart Pane](#612-price-chart-pane)
   - [AI Insights Card](#613-ai-insights-card)
   - [Signal Pillar](#614-signal-pillar)
   - [Group Rows](#615-group-rows)
   - [Footer](#616-footer)
7. [Data Visualisations](#7-data-visualisations)
   - [Spectrum Track (slider)](#71-spectrum-track-slider)
   - [RSI Arc Gauge](#72-rsi-arc-gauge)
   - [Price Ladder](#73-price-ladder)
   - [52-Week Range Bar](#74-52-week-range-bar)
   - [Volume Bar](#75-volume-bar)
   - [Analyst Bar](#76-analyst-bar)
   - [Price Target Track](#77-price-target-track)
   - [News Sentiment Donut](#78-news-sentiment-donut)
   - [MSPR Track](#79-mspr-track)
   - [Sub-Indicator Bars](#710-sub-indicator-bars)
8. [Animation](#8-animation)
9. [State Patterns](#9-state-patterns)
   - [Loading / Skeleton](#91-loading--skeleton)
   - [Error / Fallback](#92-error--fallback)
10. [Texture & Surface Effects](#10-texture--surface-effects)
11. [Accessibility Rules](#11-accessibility-rules)
12. [Do / Don't](#12-do--dont)

---

## 1. Design Tokens

Declare all tokens in `:root` inside `globals.css`. Never hardcode any of these values elsewhere — always reference the variable.

```css
:root {
  /* ── Surfaces ─────────────────────────────────── */
  --bg:          #07090d;   /* page background — darkest layer */
  --surface:     #0e1119;   /* card / panel background */
  --surface-2:   #131825;   /* elevated surface (dropdowns, tooltips) */
  --surface-hov: rgba(255,255,255,0.025); /* hover overlay — use on any clickable card */

  /* ── Strokes ──────────────────────────────────── */
  --line:        rgba(255,255,255,0.08);  /* primary border / divider */
  --line-soft:   rgba(255,255,255,0.05);  /* secondary divider (within cards) */

  /* ── Text ─────────────────────────────────────── */
  --tx1: #f0f4ff;   /* primary text — headings, values, interactive labels */
  --tx2: #8c9ab5;   /* secondary text — descriptions, names, subtitles */
  --tx3: #5d6e88;   /* tertiary / muted — metadata, section labels, timestamps */
                    /* NOTE: minimum use size is 10px. Passes WCAG AA (~5.2:1 on --bg) */

  /* ── Semantic: Green (Bullish / Positive) ─────── */
  --green:    #1dcc9a;
  --green-bg: rgba(29,204,154,0.09);
  --green-br: rgba(29,204,154,0.22);

  /* ── Semantic: Red (Bearish / Negative) ──────── */
  --red:      #f06060;
  --red-bg:   rgba(240,96,96,0.09);
  --red-br:   rgba(240,96,96,0.22);

  /* ── Semantic: Amber (Neutral / Warning) ─────── */
  --amber:    #e0a030;
  --amber-bg: rgba(224,160,48,0.09);
  --amber-br: rgba(224,160,48,0.22);

  /* ── Semantic: Blue (AI / Pro / Info) ────────── */
  --blue:     #5a9cf8;
  --blue-bg:  rgba(90,156,248,0.08);
  --blue-br:  rgba(90,156,248,0.22);

  /* ── Typography ───────────────────────────────── */
  --serif:    'Instrument Serif', Georgia, serif;
  --sans:     'Geist', system-ui, sans-serif;
  --mono:     'Geist Mono', monospace;         /* UI labels, tags, section headers */
  --mono-num: 'IBM Plex Mono', monospace;      /* ALL numeric data — prices, %, scores */

  /* ── Z-Index Scale ──────────────────────────────── */
  --z-base:    1;    /* page content, above grain overlay */
  --z-overlay: 10;   /* dropdowns, autocomplete, tooltips */
  --z-nav:     50;   /* sticky nav */
  --z-modal:   100;  /* modals, dialogs */
  --z-toast:   1000; /* toast notifications, alerts */
}
```

### Token usage rules

| Token | Use for | Never use for |
|-------|---------|---------------|
| `--bg` | Page background only | Card fills |
| `--surface` | Card / panel background, nav background | Page background |
| `--surface-2` | Dropdowns, autocomplete, elevated modals | Base cards |
| `--surface-hov` | Hover state overlay on any clickable card | Default state |
| `--z-base` | Page content wrapper (above grain) | Nav, modals |
| `--z-overlay` | Dropdowns, autocomplete, tooltips | Page content |
| `--z-nav` | Sticky navigation bar | Modals |
| `--z-modal` | Modals, dialogs, confirmation overlays | Toast |
| `--z-toast` | Toast notifications, alerts | Anything lower-priority |
| `--line` | All borders between sections and card edges | Text |
| `--line-soft` | Row dividers within a card | Card outer borders |
| `--tx1` | Prices, scores, ticker symbols, headings | Metadata |
| `--tx2` | Company names, descriptions, subtitles | Dominant headings |
| `--tx3` | Section labels, timestamps, axis ticks | Body text |
| `--green` | Positive change, bullish signal, above MA | Decorative accents |
| `--red` | Negative change, bearish signal, below MA | Error UI chrome |
| `--amber` | Neutral zone, elevated warning, mixed signal | Success states |
| `--blue` | AI features, Pro badge, chart index line | Sentiment signals |

---

## 2. Typography

### Font loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

Geist and Geist Mono are loaded via `next/font` in `layout.tsx` and injected as CSS variables.

### Base body

```css
body {
  font-family: var(--sans);
  font-size: 15px;       /* desktop — NOT 14px */
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--tx1);
  background: var(--bg);
}

@media (max-width: 600px) {
  body { font-size: 16px; }  /* minimum for mobile readability */
}
```

### Type scale

| Role | Font | Size | Weight | Letter-spacing | Color |
|------|------|------|--------|---------------|-------|
| Hero h1 | `--serif` | `clamp(42px, 5.5vw, 68px)` | 400 | `-2.5px` | `--tx1` |
| Hero h1 `em` (italic accent) | `--serif` italic | inherited | 400 | inherited | `--green` |
| Stock ticker display | `--serif` | `54px` | 400 | `-2.5px` | `--tx1` |
| Large score number (F&G, mood) | `--serif` | `96px` | 400 | `-5px` | contextual |
| Gauge score (detail page) | `--serif` | `88px` | 400 | `-4px` | `--tx1` |
| RSI hero number | `--serif` | `52px` | 400 | `-2px` | contextual |
| 52W%, analyst verdict, rank | `--serif` | `52px` | 400 | `-2px` | contextual |
| Analyst verdict italic | `--serif` italic | `46px` | 400 | `-1.5px` | `--green` |
| Stock current price | `--serif` | `46px` | 400 | `-2px` | `--tx1` |
| Index card price | `--serif` | `30px` | 400 | `-1.2px` | `--tx1` |
| Stock company name | `--sans` | `16px` | 400 | `-0.2px` | `--tx2` |
| Hero subtitle | `--sans` | `16px` | 300 | none | `--tx2` |
| Body / description | `--sans` | `15px` | 400 | none | `--tx2` |
| AI insight body | `--sans` | `15px` | 400 | `-0.1px` | `--tx2` |
| AI insight `strong` | `--sans` | `15px` | 500 | `-0.1px` | `--tx1` |
| News card title | `--sans` | `13px` | 400 | none | `--tx1` |
| Table row name | `--sans` | `13px` | 400 | none | `--tx2` |
| Section label | `--mono` | `10px` | 400 | `1.6px` | `--tx3` |
| Tag / badge | `--mono` | `10px` | 400 | `0.5px` | contextual |
| Nav link | `--sans` | `13px` | 400 | `-0.1px` | `--tx3` → `--tx1` hover |
| Logo wordmark | `--sans` | `14px` | 500 | `-0.4px` | `--tx1` |
| Logo `.ai` TLD | `--mono` | `11px` | 400 | none | `--blue` |
| Eyebrow / overline | `--mono` | `10px` | 400 | `1.6px` | `--tx3` |
| Hint chip | `--mono` | `12px` | 400 | none | `--tx2` |
| Chart axis / range tab | `--mono` | `10–11px` | 400 | `0.5–1px` | `--tx3` |
| Pillar / AI header label | `--mono` | `11px` | 400 | `1.2px` | `--tx2` |
| **Prices, % changes** | `--mono-num` | `12–15px` | 400–500 | none | contextual |
| **Score values (bars, hist)** | `--mono-num` | `12–15px` | 500 | none | contextual |
| **Volume, mentions, counts** | `--mono-num` | `12–13px` | 400 | none | contextual |
| **Timestamps** | `--mono-num` | `10px` | 400 | none | `--tx3` |

> **Rule:** `--mono-num` (IBM Plex Mono) is for any measured quantity. `--mono` (Geist Mono) is for UI chrome labels. Never mix them for the same data type.

---

## 3. Color System

### Semantic color mapping

| Signal | Foreground | Background fill | Border |
|--------|-----------|----------------|--------|
| Bullish / Positive / Above / Buy | `--green` | `--green-bg` | `--green-br` |
| Bearish / Negative / Below / Sell | `--red` | `--red-bg` | `--red-br` |
| Neutral / Elevated / Mixed / Hold | `--amber` | `--amber-bg` | `--amber-br` |
| AI / Pro / Info / Index line | `--blue` | `--blue-bg` | `--blue-br` |

### Sentiment score → color mapping

```ts
function scoreColor(score: number): string {
  if (score >= 65) return 'var(--green)';
  if (score >= 45) return 'var(--amber)';
  return 'var(--red)';
}

// Sub-indicator bars (slightly different thresholds)
function subIndicatorColor(score: number): string {
  if (score >= 60) return 'var(--green)';
  if (score >= 40) return 'var(--amber)';
  return 'var(--red)';
}
```

### Fear & Greed label → color

```ts
function fgColor(score: number): string {
  if (score >= 65) return 'var(--green)';
  if (score >= 45) return 'var(--amber)';
  return 'var(--red)';
}

function fgLabel(score: number): string {
  if (score >= 75) return 'Extreme Greed';
  if (score >= 55) return 'Greed';
  if (score >= 45) return 'Neutral';
  if (score >= 25) return 'Fear';
  return 'Extreme Fear';
}
```

### VIX tag mapping

```ts
if (price < 15)      { label = 'Calm';     color = '--green'; }
else if (price < 25) { label = 'Elevated'; color = '--amber'; }
else                 { label = 'High';     color = '--red';   }
```

### Utility classes

```css
.pos { color: var(--green); }
.neg { color: var(--red);   }
.neu { color: var(--amber); }
```

---

## 4. Spacing & Layout

### Page wrapper

```css
.page {
  position: relative;
  z-index: 1;
  max-width: 1620px;
  margin: 0 auto;
}
```

### Section padding — standard

```css
.section {
  padding: 40px 32px;
  border-bottom: 1px solid var(--line);
}
.section-no-border { border-bottom: none; }
```

> **Rule:** Every section uses exactly `40px 32px`. Do not use other values on desktop. On mobile (`≤600px`) this collapses to `28px 20px` via the responsive override.

### Spacing scale

| Use | Value |
|-----|-------|
| Section vertical padding | `40px` |
| Section horizontal padding | `32px` |
| Mobile section vertical | `28px` |
| Mobile section horizontal | `20px` |
| Nav height | `56px` |
| Card border-radius (large) | `12px` |
| Card border-radius (standard) | `10px` |
| Tag border-radius | `4px` |
| Button border-radius | `6–7px` |
| Pillar gap | `14px` |
| Group row padding | `12px 20px` |
| Pillar cell padding | `24px 28px 28px` |
| AI insight body padding | `26px 26px 30px` |
| Pillar / AI header padding | `14px 24px` |
| Stock header padding | `24px 28px 20px` |
| Gauge pane padding | `28px 24px` |
| Chart pane padding | `20px 24px 16px` |
| Footer padding | `28px 32px` |
| Top-section card margin (detail page) | `20px 32px 16px` |

### Z-index scale

| Layer | Value |
|-------|-------|
| Page content | `1` |
| Sticky nav | `100` |
| Autocomplete dropdown | `100` |

---

## 5. Breakpoints & Responsive Rules

```css
/* ── Tablet landscape ── */
@media (max-width: 1100px) {
  /* sub-indicator label col shrinks */
  .sub-indicator { grid-template-columns: 160px 1fr 44px; }
  /* pillar body goes single column */
  .pillar-body { grid-template-columns: 1fr; }
}

/* ── Tablet portrait ── */
@media (max-width: 900px) {
  /* F&G dashboard stacks */
  .fg-dashboard { grid-template-columns: 1fr; }
  .fg-left { border-right: none; border-bottom: 1px solid var(--line); padding-right: 0; padding-bottom: 32px; }
  .fg-right { padding-left: 0; padding-top: 32px; }

  /* Indices go 2×2 */
  .indices-grid { grid-template-columns: repeat(2, 1fr); }

  /* Reddit table: hide Momentum column */
  .rt-head, .rt-row { grid-template-columns: 40px 80px 1fr 120px; }
  .rt-row > *:nth-child(5),
  .rt-head > *:nth-child(5) { display: none; }

  /* Mood card stacks */
  .mood-wrap { grid-template-columns: 1fr; }
  .mood-score-big { font-size: 72px; }

  /* Stock detail: gauge goes horizontal row above chart */
  .chart-gauge-grid { grid-template-columns: 1fr; }
  .gauge-pane {
    border-right: none; border-bottom: 1px solid var(--line);
    flex-direction: row; justify-content: flex-start; gap: 40px; padding: 20px 24px;
  }
  .gauge-spectrum { max-width: 240px; }

  /* Top-section card margins reduce */
  .top-section { margin: 16px 20px 14px; }

  /* News grid stacks */
  .news-grid { grid-template-columns: 1fr; }
  .news-card { border-right: none; }
}

/* ── Mobile ── */
@media (max-width: 600px) {
  body { font-size: 16px; }

  .nav-inner { padding: 0 20px; }

  /* Homepage hero */
  .hero { padding: 52px 20px 52px; }
  .hero h1 { font-size: clamp(36px, 9vw, 52px); letter-spacing: -2px; }
  .hero-sub { font-size: 15px; margin-bottom: 32px; }

  /* All sections */
  .section { padding: 28px 20px; }
  .fg-dashboard { padding: 28px 20px; }

  /* 1-col news everywhere */
  .indices-grid { grid-template-columns: 1fr 1fr; }
  .news-grid { grid-template-columns: 1fr; }
  .news-card { border-right: none; }

  /* Reddit table: 3 cols only */
  .rt-head, .rt-row { grid-template-columns: 36px 68px 1fr; }
  .rt-row > *:nth-child(4), .rt-row > *:nth-child(5),
  .rt-head > *:nth-child(4), .rt-head > *:nth-child(5) { display: none; }

  /* Footer stacks */
  .footer { flex-direction: column; gap: 16px; text-align: center; }

  /* Sub-indicators */
  .sub-indicator { grid-template-columns: 1fr 72px 40px; }

  /* Stock detail */
  .top-section { margin: 12px 16px; }
  .stock-header { padding: 20px 20px 16px; }
  .stock-ticker { font-size: 40px; letter-spacing: -2px; }
  .stock-price  { font-size: 34px; }
  .p-cell { padding: 20px; }
  .ri-grid { grid-template-columns: 1fr; }
}

/* ── Small phones ── */
@media (max-width: 375px) {
  .hero h1 { font-size: 34px; letter-spacing: -1.5px; }
  .idx-price { font-size: 22px; }
  .fg-score-num { font-size: 76px; }
}
```

---

## 6. Components

### 6.1 Navigation

Two nav variants exist. Both are `position: sticky; top: 0; z-index: var(--z-nav)`.

| Property | Value |
|----------|-------|
| Height | `56px` |
| Background | `rgba(7,9,13,0.96)` with `backdrop-filter: blur(24px)` |
| Border | `border-bottom: 1px solid var(--line)` |
| Max content width | `1620px`, centred with `margin: 0 auto` |
| Padding | `0 32px` (desktop), `0 16px` (mobile ≤600px) |
| Z-index | `var(--z-nav)` — above page content and overlays, below modals |

#### Homepage nav
Layout: `[Logo] [Nav links — left-aligned] [auto spacer] [Get Pro button]`

```css
.nav-outer {
  position: sticky; top: 0; z-index: 100;
  background: rgba(7,9,13,0.96);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--line);
  width: 100%;
}
.nav-inner {
  max-width: 1620px; margin: 0 auto;
  display: flex; align-items: center;
  padding: 0 32px; height: 56px;
}
.logo { display: flex; align-items: baseline; text-decoration: none; margin-right: 32px; flex-shrink: 0; }
.logo-word { font-size: 14px; font-weight: 500; color: var(--tx1); letter-spacing: -0.4px; }
.logo-tld  { font-family: var(--mono); font-size: 11px; color: var(--blue); }
.nav-links { display: flex; margin-right: auto; }
.nav-link {
  font-size: 13px; color: var(--tx3);
  text-decoration: none; letter-spacing: -0.1px;
  padding: 0 16px; height: 56px;
  display: flex; align-items: center;
  border-right: 1px solid var(--line);
  transition: color 0.15s;
}
.nav-link:first-child { border-left: 1px solid var(--line); }
.nav-link:hover, .nav-link.active { color: var(--tx1); }
```

#### Stock detail nav
Layout: `[Logo] [Search — centred flex] [Get Pro button]`

```css
.nav-inner { gap: 14px; } /* use gap instead of margin-right: auto on logo */
.nav-search-wrap { flex: 1; max-width: 380px; position: relative; margin: 0 auto; }
.nav-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.35; pointer-events: none; }
.nav-search {
  width: 100%; background: var(--surface); border: 1px solid var(--line);
  border-radius: 7px; padding: 7px 14px 7px 36px;
  font-size: 13px; color: var(--tx2); font-family: var(--sans); outline: none;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.nav-search::placeholder { color: var(--tx3); }
.nav-search:focus {
  border-color: rgba(255,255,255,0.18);
  background: var(--surface-2);
  color: var(--tx1);
}
```

#### Get Pro button (both navs)

```css
.btn-pro {
  background: var(--tx1); color: var(--bg);
  border: none; border-radius: 6px; flex-shrink: 0;
  padding: 7px 18px; font-size: 13px; font-weight: 600;
  font-family: var(--sans); cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  margin-left: 16px; /* homepage only — detail uses gap */
}
.btn-pro:hover  { opacity: 0.88; }
.btn-pro:active { transform: scale(0.97); }
.btn-pro:focus-visible { outline: 1px solid var(--tx2); outline-offset: 2px; }
```

> **Rule:** The white-fill Get Pro button is the primary CTA hierarchy anchor on every page. Do not change it to outlined or ghost.

#### Text input fields (generic pattern)

All text inputs (search, future forms) must follow this base pattern:

```css
.input-field {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 9px 14px;
  font-size: 14px;
  color: var(--tx1);
  font-family: var(--sans);
  outline: none;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.input-field::placeholder { color: var(--tx3); }
.input-field:focus {
  border-color: rgba(255,255,255,0.18);
  background: var(--surface-2);
  color: var(--tx1);
}
.input-field:focus-visible {
  outline: 1px solid var(--tx2);
  outline-offset: 2px;
}
.input-field:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

> **Rule:** Never use bare `<input>` without this styling. All form inputs inherit from this pattern; the nav search is a sized-down variant (`font-size: 13px; padding: 7px 14px 7px 36px`).

---

### 6.2 Hero

Homepage only. Full-width, no card wrapper.

```css
.hero {
  padding: 88px 32px 104px;
  border-bottom: 1px solid var(--line);
  position: relative; overflow: hidden;
  background: linear-gradient(160deg, rgba(90,156,248,0.05) 0%, transparent 55%);
}
/* Floating radial green blob (decorative) */
.hero::after {
  content: ''; position: absolute;
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(29,204,154,0.05) 0%, transparent 70%);
  top: -260px; right: -120px; pointer-events: none;
  animation: blobDrift 8s ease-in-out infinite alternate;
}
@keyframes blobDrift {
  from { transform: translate(0, 0); }
  to   { transform: translate(20px, -20px); }
}

/* Eyebrow */
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 1.6px; color: var(--tx3); margin-bottom: 32px;
}
/* Animated live pip */
.pip {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px var(--green);
  animation: pip 2.5s ease-in-out infinite; flex-shrink: 0; display: inline-block;
}
@keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* Headline */
.hero h1 {
  font-family: var(--serif);
  font-size: clamp(42px, 5.5vw, 68px);
  font-weight: 400; line-height: 1.06; letter-spacing: -2.5px;
  color: var(--tx1); max-width: 680px; margin-bottom: 22px;
}
.hero h1 em { font-style: italic; color: var(--green); }

/* Subheading */
.hero-sub {
  font-size: 16px; font-weight: 300; color: var(--tx2);
  line-height: 1.7; max-width: 460px; margin-bottom: 44px;
}

/* Search bar */
.search-outer { max-width: 540px; position: relative; margin-bottom: 24px; }
.search-bar {
  display: flex; align-items: center;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 10px; overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-bar:focus-within {
  border-color: rgba(255,255,255,0.18);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.04);
}
.search-icon { margin-left: 16px; flex-shrink: 0; opacity: 0.3; color: var(--tx2); }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  padding: 14px 14px 14px 10px;
  font-size: 15px; color: var(--tx1); font-family: var(--sans);
}
.search-input::placeholder { color: var(--tx3); }
.search-go {
  background: var(--tx1); color: var(--bg); border: none;
  padding: 10px 22px; margin: 4px; border-radius: 7px;
  font-size: 13px; font-weight: 600; font-family: var(--sans);
  cursor: pointer; transition: opacity 0.15s, transform 0.1s; flex-shrink: 0;
}
.search-go:hover  { opacity: 0.88; }
.search-go:active { transform: scale(0.97); }

/* CTA copy — always "Analyse →" */

/* Hint chips */
.hints { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hint-label { font-family: var(--mono); font-size: 11px; color: var(--tx3); }
.hint-chip {
  font-family: var(--mono); font-size: 12px; color: var(--tx2);
  border: 1px solid var(--line); border-radius: 6px;
  padding: 5px 13px; cursor: pointer; text-decoration: none; display: inline-block;
  transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s;
}
.hint-chip:hover {
  color: var(--tx1); border-color: rgba(255,255,255,0.22);
  background: var(--surface); transform: translateY(-1px);
}
```

#### Hero entry animation

```css
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
.hero-fade-0 { animation: heroFadeUp 0.5s ease both; }
.hero-fade-1 { animation: heroFadeUp 0.5s ease both; animation-delay: 80ms; }
.hero-fade-2 { animation: heroFadeUp 0.5s ease both; animation-delay: 160ms; }
.hero-fade-3 { animation: heroFadeUp 0.5s ease both; animation-delay: 240ms; }
.hero-fade-4 { animation: heroFadeUp 0.5s ease both; animation-delay: 320ms; }
/* Apply: eyebrow=0, h1=1, sub=2, search=3, hints=4 */
```

---

### 6.3 Section Label

Used at the top of every data section. Always the first child.

```css
.sec-label {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 1.6px; color: var(--tx3); margin-bottom: 22px;
  display: flex; align-items: center; gap: 10px;
}
/* Auto-extending rule after text */
.sec-label::after {
  content: ''; flex: 1; height: 1px; background: var(--line-soft);
  transform-origin: left;
  animation: lineExtend 0.6s ease 0.3s both;
}
@keyframes lineExtend {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

**Live pip** — prepend to any section showing real-time data:

```css
.live-pip {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px var(--green);
  animation: pip 2.5s ease-in-out infinite; flex-shrink: 0;
}
/* pip keyframe defined in Hero section above */
```

Usage: `<div class="sec-label"><span class="live-pip"></span> Market indices</div>`
Live pip is used on: Market mood, Market indices, Fear & Greed. Not used on static sections (news, headlines).

---

### 6.4 Tags / Badges

Fixed structure — always `font-family: --mono`, `10px`, uppercase.

```css
.tag {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.5px; padding: 4px 10px; border-radius: 4px;
  white-space: nowrap;
}

/* Colour variants */
.t-bull { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-br); }
.t-bear { background: var(--red-bg);   color: var(--red);   border: 1px solid var(--red-br);   }
.t-neu  { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-br); }
.t-blue { background: var(--blue-bg);  color: var(--blue);  border: 1px solid var(--blue-br);  }

/* Fixed-width variant — use inside signal pillar num-tables */
.t-fixed {
  min-width: 96px; max-width: 96px; width: 96px;
  text-overflow: ellipsis; overflow: hidden;
}
```

**Signal → tag class mapping:**

```ts
function tagClass(signal: string): string {
  const s = signal.toLowerCase();
  const bullish = ['bullish','rising','buy','strong','net buying','low','above','near highs','positive','calm','surging'];
  const bearish = ['bearish','falling','sell','net selling','high','below','near lows','negative','extreme fear','fear'];
  if (bullish.some(x => s.includes(x))) return 't-bull';
  if (bearish.some(x => s.includes(x))) return 't-bear';
  return 't-neu';
}
```

---

### 6.5 Index Cards

Four cards in a single bordered group. No gap between cards — borders separate them.

```css
.indices-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
}
.idx-card {
  padding: 24px 26px; border-right: 1px solid var(--line);
  transition: background 0.15s; cursor: default;
}
.idx-card:last-child { border-right: none; }
.idx-card:hover { background: var(--surface-hov); }
.idx-name  {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--tx3); margin-bottom: 14px;
}
.idx-price {
  font-family: var(--serif); font-size: 30px; font-weight: 400;
  letter-spacing: -1.2px; line-height: 1; margin-bottom: 8px; color: var(--tx1);
}
.idx-change {
  font-family: var(--mono-num); font-size: 12px; margin-bottom: 13px;
  display: flex; align-items: center; gap: 6px;
}
.idx-change-abs { color: var(--tx3); font-size: 11px; }
/* .tag follows */
```

---

### 6.6 Fear & Greed Dashboard

Two-column layout. Left: main score + track + historical. Right: sub-indicator bars.

```css
.fg-dashboard {
  padding: 40px 32px; border-bottom: 1px solid var(--line);
  display: grid; grid-template-columns: minmax(260px, 320px) 1fr;
}
.fg-left {
  padding-right: 44px; border-right: 1px solid var(--line);
  display: flex; flex-direction: column; gap: 28px;
}
.fg-top-label {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 1.6px; color: var(--tx3);
  display: flex; align-items: center; gap: 8px;
}
.fg-score-num {
  font-family: var(--serif); font-size: 96px; font-weight: 400;
  letter-spacing: -5px; line-height: 1; color: var(--tx1); margin-bottom: 6px;
}
.fg-score-label {
  font-family: var(--mono); font-size: 14px; text-transform: uppercase; letter-spacing: 1.2px;
  /* color: fgColor(score) */
}
/* Historical strip */
.fg-historical {
  display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden;
}
.fg-hist-item {
  flex: 1; padding: 12px 8px; text-align: center;
  border-right: 1px solid var(--line); transition: background 0.12s;
}
.fg-hist-item:last-child { border-right: none; }
.fg-hist-item:hover { background: var(--surface); }
.fg-hist-period {
  font-family: var(--mono); font-size: 9px; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--tx3); margin-bottom: 6px;
}
.fg-hist-val { font-family: var(--mono-num); font-size: 15px; font-weight: 500; }
/* Right column */
.fg-right { padding-left: 44px; display: flex; flex-direction: column; gap: 14px; justify-content: center; }
.fg-right-title {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 1.4px; color: var(--tx3); margin-bottom: 6px;
}
```

---

### 6.7 Reddit Trending Table

```css
.reddit-table { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
/* Column layout: rank | ticker | name | mentions | momentum */
.rt-head,
.rt-row { display: grid; grid-template-columns: 40px 80px 1fr 120px 120px; align-items: center; gap: 16px; }
.rt-head {
  padding: 10px 22px;
  background: var(--surface); border-bottom: 1px solid var(--line);
}
.rt-head span {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--tx3);
}
.rt-row {
  padding: 14px 22px; border-bottom: 1px solid var(--line-soft);
  cursor: pointer; transition: background 0.12s;
  text-decoration: none; color: inherit; display: grid;
}
.rt-row:last-child { border-bottom: none; }
.rt-row:hover { background: var(--surface-hov); }
.rt-rank     { font-family: var(--mono-num); font-size: 12px; color: var(--tx3); }
.rt-ticker   { font-family: var(--mono); font-size: 13px; font-weight: 500; color: var(--tx1); }
.rt-name     { font-size: 13px; color: var(--tx2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rt-mentions { font-family: var(--mono-num); font-size: 13px; color: var(--tx1); }
.rt-mentions-sub { font-family: var(--mono-num); font-size: 10px; color: var(--tx3); margin-top: 2px; }
```

---

### 6.8 News Grid

**Homepage:** 3-column × 3 rows (9 articles).
**Stock detail:** 2-column × 2 rows (4–8 articles).

```css
/* Homepage */
.news-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
}
/* Stock detail */
.news-grid-2col { grid-template-columns: repeat(2, 1fr); }

.news-card {
  padding: 20px 22px;
  border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
  cursor: pointer; transition: background 0.15s;
  text-decoration: none; display: flex; flex-direction: column; color: inherit;
}
/* Remove right border on last column */
/* 3-col: */ .news-grid .news-card:nth-child(3n) { border-right: none; }
/* 2-col: */ .news-grid-2col .news-card:nth-child(2n) { border-right: none; }
/* Remove bottom border on last row */
.news-card:nth-last-child(-n+3) { border-bottom: none; } /* 3-col */
.news-card:nth-last-child(-n+2) { border-bottom: none; } /* 2-col */

.news-card:hover { background: var(--surface-hov); }
.news-card:hover .news-read { color: var(--tx2); }

.news-source-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.news-source { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--tx3); }
.news-time   { font-family: var(--mono-num); font-size: 10px; color: var(--tx3); }
.news-title  { font-size: 13px; color: var(--tx1); line-height: 1.5; flex: 1; margin-bottom: 14px; }
.news-footer { display: flex; align-items: center; justify-content: flex-end; margin-top: auto; }
.news-read   { font-family: var(--mono); font-size: 10px; color: var(--tx3); transition: color 0.15s; letter-spacing: 0.3px; }
```

> **Rule:** `display: flex; flex-direction: column` on `.news-card` and `margin-top: auto` on `.news-footer` ensure "Read →" always pins to the card bottom regardless of title length.

---

### 6.9 Mood Card

Homepage section. Large serif score anchors left; label + description + track fills right.

```css
.mood-wrap {
  display: grid; grid-template-columns: auto 1fr; gap: 36px; align-items: center;
}
.mood-score-big {
  font-family: var(--serif); font-size: 96px; line-height: 1;
  letter-spacing: -5px; min-width: 168px;
  /* color: fgColor(score) */
}
.mood-label-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.mood-label {
  font-family: var(--mono); font-size: 15px; text-transform: uppercase; letter-spacing: 2px;
  /* color: fgColor(score) */
}
.mood-desc { font-size: 14px; color: var(--tx2); line-height: 1.6; max-width: 520px; margin-bottom: 22px; }
```

---

### 6.10 Stock Header

Top of the stock detail page, inside the top-section card.

```css
/* Card wrapper — gets side margins to breathe from viewport */
.top-section {
  border: 1px solid var(--line); border-radius: 12px;
  margin: 20px 32px 16px;
}
.stock-header { padding: 24px 28px 20px; }
.stock-top-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.stock-ticker  { font-family: var(--serif); font-size: 54px; font-weight: 400; letter-spacing: -2.5px; line-height: 1; color: var(--tx1); }
.stock-name    { font-size: 16px; color: var(--tx2); letter-spacing: -0.2px; align-self: flex-end; padding-bottom: 7px; margin-left: 4px; }
.stock-badges  { display: flex; gap: 6px; align-self: flex-end; padding-bottom: 9px; }
.stock-badge   {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--tx3); border: 1px solid var(--line); border-radius: 5px; padding: 3px 9px;
}
.stock-price-row    { display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
.stock-price        { font-family: var(--serif); font-size: 46px; font-weight: 400; letter-spacing: -2px; line-height: 1; color: var(--tx1); }
.stock-change-block { padding-bottom: 5px; }
.stock-change  { display: flex; align-items: center; gap: 8px; font-family: var(--mono-num); font-size: 14px; margin-bottom: 5px; }
.change-label  { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--tx3); }
.after-hours   { display: flex; align-items: center; gap: 8px; font-family: var(--mono-num); font-size: 11px; }
.ah-label      { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--tx3); }
```

---

### 6.11 Gauge Pane

Left pane of `chart-gauge-grid` on the stock detail page.

```css
.chart-gauge-grid {
  display: grid;
  grid-template-columns: 240px 1fr; /* fixed gauge width — not 1fr 2fr */
  border-top: 1px solid var(--line);
}
.gauge-pane {
  padding: 28px 24px; border-right: 1px solid var(--line);
  display: flex; flex-direction: column;
  justify-content: center; align-items: center; gap: 20px;
}
.gauge-pane-label {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 1.2px; color: var(--tx3);
}
.gauge-score-block { text-align: center; }
.gauge-score {
  font-family: var(--serif); font-size: 88px; letter-spacing: -4px; line-height: 1;
  color: var(--tx1); margin-bottom: 4px;
}
.gauge-word  { font-family: var(--mono); font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
.gauge-conf  { font-family: var(--mono); font-size: 11px; color: var(--tx3); }
.gauge-spectrum { width: 100%; max-width: 200px; }
```

---

### 6.12 Price Chart Pane

Right pane of `chart-gauge-grid`. Chart rendered via Chart.js / Lightweight Charts on a canvas.

```css
.chart-pane { padding: 20px 24px 16px; min-width: 0; overflow: hidden; }
.chart-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; flex-wrap: wrap; gap: 10px;
}
.chart-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--tx3); }
.range-tabs { display: flex; gap: 4px; }
.range-tab {
  font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 5px 12px; border-radius: 6px; cursor: pointer;
  color: var(--tx3); background: none; border: 1px solid transparent; transition: all 0.15s;
}
.range-tab:hover { color: var(--tx2); border-color: var(--line); }
.range-tab-active { color: var(--tx1); background: var(--surface-2); border-color: var(--line) !important; }
.chart-legend { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.legend-chip {
  display: flex; align-items: center; gap: 6px;
  font-family: var(--mono); font-size: 11px;
  border: 1px solid var(--line); border-radius: 5px; padding: 4px 10px; color: var(--tx2);
}
.legend-dot    { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.legend-dashed {
  width: 14px; height: 2px; flex-shrink: 0;
  background: repeating-linear-gradient(to right, var(--blue) 0, var(--blue) 4px, transparent 4px, transparent 7px);
}
/* Canvas wrapper — height controlled here only, never inline */
.chart-canvas-wrap { position: relative; height: 200px; width: 100%; }
.chart-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.chart-footer-meta { font-family: var(--mono); font-size: 10px; color: var(--tx3); }
```

**Chart colour tokens:**
- Stock line: `#1dcc9a` (solid, `strokeWidth: 2`)
- Stock area fill: gradient `rgba(29,204,154,0.18)` → `rgba(29,204,154,0)`
- Index line: `#5a9cf8` (dashed `6 4`, `opacity: 0.7`, `strokeWidth: 1.5`)
- Grid lines: `rgba(255,255,255,0.04)`

---

### 6.13 AI Insights Card

```css
.ai-card { border-bottom: 1px solid var(--line); }
.ai-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; border-bottom: 1px solid var(--line); background: var(--surface);
}
.ai-header-left { display: flex; align-items: center; gap: 8px; }
.ai-pip {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--blue); box-shadow: 0 0 6px var(--blue);
  animation: pip 2.5s ease-in-out infinite; flex-shrink: 0;
}
.ai-header-label {
  font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--tx2);
}
/* Right side: .tag.t-blue with text "Pro" */

.insight-tabs {
  display: flex; border-bottom: 1px solid var(--line); padding: 0 24px;
}
.insight-tab {
  font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 13px 16px; color: var(--tx3); cursor: pointer; transition: color 0.15s, border-color 0.15s;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  background: none; border-top: none; border-left: none; border-right: none; white-space: nowrap;
}
.insight-tab:hover:not(.active) { color: var(--tx2); }
.insight-tab.active { color: var(--tx1); border-bottom-color: var(--blue); }

.insight-body { padding: 26px 26px 30px; }
.insight-text {
  font-size: 15px; font-weight: 400; color: var(--tx2); line-height: 1.75; letter-spacing: -0.1px;
}
.insight-text strong { color: var(--tx1); font-weight: 500; }
```

**Tabs (in order):** Summary · Bull case · Bear case · What to watch

---

### 6.14 Signal Pillar

Three pillars: Technical (blue pip), Fundamental (amber pip), Sentiment (green pip).

```css
.pillars-wrap { display: flex; flex-direction: column; gap: 14px; }
.pillar { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.pillar-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 24px; border-bottom: 1px solid var(--line); background: var(--surface);
}
.pillar-pip {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  animation: pip 2.5s ease-in-out infinite;
  /* Technical:    background: var(--blue);  box-shadow: 0 0 6px var(--blue); */
  /* Fundamental:  background: var(--amber); box-shadow: 0 0 6px var(--amber); */
  /* Sentiment:    background: var(--green); box-shadow: 0 0 6px var(--green); */
}
.pillar-name { font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--tx2); margin-right: auto; }
/* .tag.t-fixed follows — shows overall pillar signal */

/* 2×2 cell grid */
.pillar-body { display: grid; grid-template-columns: 1fr 1fr; }
.p-cell {
  padding: 24px 28px 28px;
  border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
}
.p-cell:nth-child(2n)        { border-right: none; }
.p-cell:nth-last-child(-n+2) { border-bottom: none; }
.p-cell-label {
  font-family: var(--mono); font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.9px; color: var(--tx3); margin-bottom: 20px;
}
.cell-chart   { margin-bottom: 22px; }
.cell-divider { height: 1px; background: var(--line); margin-bottom: 18px; }
```

**Pillar definitions:**

| Pillar | Pip colour | Cells |
|--------|-----------|-------|
| Technical | Blue | RSI (14) · Moving averages · 52W range · Volume |
| Fundamental | Amber | Analyst ratings · Price target · Key metrics · Earnings |
| Sentiment | Green | News sentiment · Reddit + Insider · Fear & Greed · Institutional |

---

### 6.15 Group Rows

Generic reusable bordered list within any card cell.

```css
.group { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.group-row {
  display: grid; align-items: center; gap: 16px;
  padding: 12px 20px; border-bottom: 1px solid var(--line-soft);
  transition: background 0.12s;
}
.group-row:last-child { border-bottom: none; }
.group-row:hover { background: var(--surface-hov); }

/* Column presets */
.row3 { grid-template-columns: 1fr auto auto; } /* name | value | tag */
.row2 { grid-template-columns: 1fr auto; }       /* name | value */

.row-name { font-size: 13px; color: var(--tx2); }
.row-val  { font-family: var(--mono-num); font-size: 13px; font-weight: 500; color: var(--tx1); text-align: right; }
```

**Num-table** (used inside pillar cells — slightly smaller, no outer border):

```css
.num-table { width: 100%; }
.num-row {
  display: grid; grid-template-columns: 1fr auto auto;
  align-items: center; gap: 16px;
  padding: 9px 0; border-bottom: 1px solid var(--line-soft);
}
.num-row:last-child { border-bottom: none; }
.nr-name { font-size: 13px; color: var(--tx2); }
.nr-val  { font-family: var(--mono-num); font-size: 13px; font-weight: 500; color: var(--tx1); text-align: right; min-width: 56px; }
.nr-tag  { min-width: 88px; display: flex; justify-content: flex-end; }
```

---

### 6.16 Footer

```css
.footer {
  padding: 28px 32px; display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid var(--line);
}
.footer-logo { display: flex; align-items: baseline; }
.footer-logo-word { font-size: 13px; font-weight: 500; color: var(--tx2); }
.footer-logo-tld  { font-family: var(--mono); font-size: 11px; color: var(--blue); }
.footer-links { display: flex; gap: 22px; }
.footer-links a { font-size: 12px; color: var(--tx3); text-decoration: none; transition: color 0.15s; }
.footer-links a:hover { color: var(--tx2); }
.footer-copy { font-family: var(--mono); font-size: 11px; color: var(--tx3); }
```

Footer always shows: logo · links (Privacy / Terms / Contact) · copyright + disclaimer.
Disclaimer copy: `© 2026 · Not financial advice.`

---

## 7. Data Visualisations

### 7.1 Spectrum Track (slider)

Used in: Mood card, F&G score, Gauge pane. Always red→amber→green.

```css
.spec-track {
  height: 5–6px; width: 100%;
  background: linear-gradient(to right, var(--red) 0%, var(--amber) 50%, var(--green) 100%);
  border-radius: 3–4px; position: relative; margin-bottom: 8–10px;
}
.spec-thumb {
  width: 12–14px; height: 12–14px; background: var(--tx1); border-radius: 50%;
  position: absolute; top: -3.5px to -4px; transform: translateX(-50%);
  /* box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px <contextual-color>; */
}
.spec-labels {
  display: flex; justify-content: space-between;
  font-family: var(--mono); font-size: 10px; color: var(--tx3);
  text-transform: uppercase; letter-spacing: 0.5px;
}
/* Labels: "Extreme fear" | "Neutral" | "Extreme greed"  — F&G and Mood */
/* Labels: "Bearish" | "Neutral" | "Bullish"             — Gauge pane */
```

### 7.2 RSI Arc Gauge

SVG half-donut, 96×58 viewBox. Needle pivots from centre-bottom.

```svg
<svg width="96" height="58" viewBox="0 0 96 58">
  <defs>
    <linearGradient id="rsiG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#f06060"/>
      <stop offset="35%"  stop-color="#e0a030"/>
      <stop offset="100%" stop-color="#1dcc9a"/>
    </linearGradient>
  </defs>
  <!-- Background arc -->
  <path d="M 8 52 A 40 40 0 0 1 88 52" fill="none"
    stroke="rgba(255,255,255,0.06)" stroke-width="7" stroke-linecap="round"/>
  <!-- Value arc: dasharray=125.7, dashoffset=(1 - rsi/100)*125.7 -->
  <path d="M 8 52 A 40 40 0 0 1 88 52" fill="none"
    stroke="url(#rsiG)" stroke-width="7" stroke-linecap="round"
    stroke-dasharray="125.7" stroke-dashoffset="{offset}"/>
  <!-- Needle: angle = (rsi/100)*π, from (48,52) -->
  <line x1="48" y1="52" x2="{needleX}" y2="{needleY}"
    stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <circle cx="48" cy="52" r="4" fill="#131825" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
  <!-- Axis labels -->
  <text x="3" y="57" font-family="monospace" font-size="8" fill="#5d6e88">OS</text>
  <text x="77" y="57" font-family="monospace" font-size="8" fill="#5d6e88">OB</text>
</svg>
```

Needle calculation:
```ts
const angle = (rsi / 100) * Math.PI;
const needleX = 48 + 32 * Math.cos(Math.PI - angle);
const needleY = 52 - 32 * Math.sin(Math.PI - angle);
const offset  = 125.7 - (rsi / 100) * 125.7;
```

RSI hero number uses `.rsi-num` — `font-family: var(--serif); font-size: 52px; letter-spacing: -2px`.

### 7.3 Price Ladder

Horizontal track showing current price relative to MAs and price target.

```css
.ladder-track {
  position: relative; height: 6px;
  background: linear-gradient(to right, var(--red) 0%, var(--amber) 45%, var(--green) 100%);
  border-radius: 3px; margin: 36px 0 10px;
}
.lm { /* MA dot */
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg);
  /* background: var(--green) if price > MA, var(--red) if below */
}
.lm-top { /* label above dot */
  position: absolute; bottom: 14px; transform: translateX(-50%);
  font-family: var(--mono); font-size: 9px; color: var(--tx3);
  text-transform: uppercase; white-space: nowrap;
}
.lm-bot { /* value below dot */
  position: absolute; top: 14px; transform: translateX(-50%);
  font-family: var(--mono-num); font-size: 10px; font-weight: 500; white-space: nowrap;
}
.now-pin { /* current price pin */
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--tx1); border: 2px solid var(--bg);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
}
.now-chip { /* current price label */
  position: absolute; top: 14px; transform: translateX(-50%);
  font-family: var(--mono-num); font-size: 10px; color: var(--tx1);
  background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 4px; padding: 2px 7px; white-space: nowrap;
}
.ladder-axis {
  display: flex; justify-content: space-between;
  font-family: var(--mono-num); font-size: 10px; color: var(--tx3);
}
```

Position formula: `left: ((value - ladderMin) / (ladderMax - ladderMin)) * 100 + '%'`
where `ladderMin = Math.min(all MAs, current, target) * 0.97` and `ladderMax = Math.max(...) * 1.03`.

### 7.4 52-Week Range Bar

```css
.w52-prices { display: flex; justify-content: space-between; margin-bottom: 8px; }
.w52-price-val { font-family: var(--mono-num); font-size: 12px; color: var(--tx2); }
.w52-track { height: 6px; background: var(--line); border-radius: 3px; position: relative; margin-bottom: 6px; overflow: visible; }
.w52-fill  { height: 100%; border-radius: 3px; background: linear-gradient(to right, var(--red) 0%, var(--amber) 50%, var(--green) 100%); }
.w52-thumb {
  width: 14px; height: 14px; background: var(--tx1); border-radius: 50%;
  position: absolute; top: -4px; transform: translateX(-50%);
  border: 2px solid var(--bg); box-shadow: 0 0 0 2px var(--tx2);
}
/* width of fill = w52Pct%; left of thumb = w52Pct% */
/* w52Pct = ((current - low52) / (high52 - low52)) * 100 */
.w52-axis { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--tx3); margin-bottom: 18px; }
.w52-big  { font-family: var(--serif); font-size: 52px; letter-spacing: -2px; line-height: 1; }
.w52-sub  { font-size: 13px; color: var(--tx2); margin-top: 2px; margin-bottom: 12px; }
```

### 7.5 Volume Bar

```css
.vol-big  { font-family: var(--serif); font-size: 52px; letter-spacing: -2px; line-height: 1; margin-bottom: 3px; }
.vol-sub  { font-size: 13px; color: var(--tx2); margin-bottom: 18px; }
.vol-track { height: 5px; background: var(--line); border-radius: 3px; position: relative; margin-bottom: 8px; }
.vol-fill  { height: 100%; border-radius: 3px; }
/* vol-fill color: var(--green) if ratio ≤1.3, var(--amber) if ≤2, var(--red) if >2 */
/* vol-fill width: min(100, (volRatio/3)*100)% */
.vol-avg   { position: absolute; top: -4px; width: 1px; height: 13px; background: var(--tx3); }
/* vol-avg left: 33.33% (marks 1× average in a 0–3× scale) */
.vol-axis  { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--tx3); margin-bottom: 14px; }
```

### 7.6 Analyst Bar

```css
.analyst-bar { height: 8px; border-radius: 5px; overflow: hidden; display: flex; margin-bottom: 10px; }
.ab-buy  { background: var(--green); }  /* flex: buyCount  */
.ab-hold { background: var(--amber); margin: 0 2px; }  /* flex: holdCount */
.ab-sell { background: var(--red); }    /* flex: sellCount */
.analyst-legend { display: flex; gap: 14px; margin-bottom: 14px; }
.al-item { display: flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 11px; color: var(--tx2); }
.al-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.analyst-verdict { font-family: var(--serif); font-size: 46px; font-style: italic; letter-spacing: -1.5px; line-height: 1; margin-bottom: 4px; }
/* verdict color: var(--green) for Buy, var(--amber) for Hold, var(--red) for Sell */
.analyst-count { font-family: var(--mono); font-size: 12px; color: var(--tx3); margin-bottom: 14px; }
```

### 7.7 Price Target Track

```css
.pt-track { height: 5px; background: var(--line); border-radius: 3px; position: relative; margin: 32px 0 10px; }
/* Filled region between current price and mean target */
.pt-fill { position: absolute; height: 100%; border-radius: 3px; background: linear-gradient(to right, rgba(90,156,248,0.15), rgba(90,156,248,0.45)); }
/* Current price pin */
.pt-now  { position: absolute; top: 50%; transform: translate(-50%,-50%); width: 12px; height: 12px; border-radius: 50%; background: var(--tx1); border: 2px solid var(--bg); box-shadow: 0 0 0 2px var(--blue); }
/* Mean target line */
.pt-mean { position: absolute; top: -4px; width: 2px; height: 13px; background: var(--blue); transform: translateX(-50%); }
.pt-lbl  { position: absolute; bottom: 13px; transform: translateX(-50%); font-family: var(--mono); font-size: 9px; text-transform: uppercase; white-space: nowrap; color: var(--tx3); }
/* Value grid below track */
.pt-vals   { display: grid; grid-template-columns: repeat(4,1fr); margin-bottom: 14px; }
.pt-v-lbl  { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--tx3); margin-bottom: 3px; text-align: center; }
.pt-v-val  { font-family: var(--mono-num); font-size: 13px; font-weight: 500; text-align: center; }
/* Upside callout */
.pt-upside { padding: 10px 14px; border-radius: 7px; background: var(--green-bg); border: 1px solid var(--green-br); display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.pt-upside-lbl { font-size: 13px; color: var(--tx2); }
.pt-upside-val { font-family: var(--mono-num); font-size: 15px; font-weight: 500; color: var(--green); }
/* show red-bg/red-br + var(--red) if target < current */
```

Position formula: `left% = ((value - ptLow) / (ptHigh - ptLow)) * 100`

### 7.8 News Sentiment Donut

SVG circle-based. 80×80 viewBox.

```css
.news-sent-top { display: grid; grid-template-columns: auto 1fr; gap: 22px; align-items: center; margin-bottom: 12px; }
.donut-wrap    { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.donut-center  { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-score   { font-family: var(--mono-num); font-size: 14px; font-weight: 500; } /* color: leading segment color */
.donut-lbl     { font-family: var(--mono); font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--tx3); }
```

SVG layers (stacked `<circle>` with `stroke-dasharray`):
- r=32, stroke-width=10, cx=cy=40
- Background: `stroke="rgba(255,255,255,0.06)"`
- Positive (green): segment 1
- Neutral (amber): segment 2, offset after positive
- Negative (red): segment 3, offset after both

Circumference = 2π × 32 ≈ 201.06. Segment length = `pct/100 * 201.06`. Each segment's `stroke-dashoffset` = negative sum of all previous segment lengths.

```css
.sent-rows { display: flex; flex-direction: column; gap: 8px; }
.sent-row  { display: flex; align-items: center; gap: 8px; }
.sent-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sent-name { font-size: 12px; color: var(--tx3); min-width: 52px; }
.sent-bar-bg   { flex: 1; height: 3px; background: var(--line); border-radius: 2px; overflow: hidden; }
.sent-bar-fill { height: 100%; border-radius: 2px; }
.sent-num { font-family: var(--mono-num); font-size: 12px; color: var(--tx1); min-width: 22px; text-align: right; }
```

### 7.9 MSPR Track

Insider buying signal (Money Flow Smart Price Ratio). Simpler version of the spectrum track.

```css
.mspr-big   { font-family: var(--serif); font-size: 46px; letter-spacing: -2px; line-height: 1; margin-bottom: 8px; }
.mspr-track { height: 4px; background: linear-gradient(to right, var(--red), var(--green)); border-radius: 3px; position: relative; margin-bottom: 4px; }
.mspr-thumb {
  position: absolute; top: -4px; transform: translateX(-50%);
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--tx1); border: 2px solid var(--bg); box-shadow: 0 0 0 1.5px var(--green);
}
/* thumb left = mspr * 100% */
.mspr-axis  { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--tx3); margin-bottom: 8px; }
/* Labels: "0 Sell" | "1 Buy" */
```

### 7.10 Sub-Indicator Bars

Used in the F&G right column.

```css
.sub-indicator { display: grid; grid-template-columns: 184px 1fr 48px; align-items: center; gap: 16px; }
/* Tablet: 160px 1fr 44px */
/* Mobile: 1fr 72px 40px */
.si-name { font-size: 13px; color: var(--tx2); }
.si-bar-track { height: 4px; background: var(--line); border-radius: 3px; overflow: hidden; }
.si-bar-fill  { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
/* fill width = score%; fill color = subIndicatorColor(score) */
.si-val { font-family: var(--mono-num); font-size: 12px; color: var(--tx1); text-align: right; }
```

---

## 8. Animation

All animations use `transform` and `opacity` only — never `width`, `height`, or `top/left` for performance.

| Name | Keyframe | Duration | Use |
|------|----------|----------|-----|
| `pip` | `0%,100%{opacity:1} 50%{opacity:0.3}` | `2.5s ease-in-out infinite` | Live pip, pillar pip, AI pip |
| `heroFadeUp` | `from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none}` | `0.5s ease both` | Hero stagger (5 delays: 0/80/160/240/320ms) |
| `lineExtend` | `from{transform:scaleX(0)} to{transform:scaleX(1)}` | `0.6s ease 0.3s both` | Section label rule |
| `blobDrift` | `from{transform:translate(0,0)} to{transform:translate(20px,-20px)}` | `8s ease-in-out infinite alternate` | Hero background blob |
| `skel-pulse` | `0%,100%{opacity:0.45} 50%{opacity:0.9}` | `1.8s ease-in-out infinite` | Loading skeleton |
| Bar/track transitions | `transition: width 0.4s ease` | — | Sub-indicator bars, MA fills |
| Hover transitions | `transition: background 0.12–0.15s` | — | All clickable cards |
| Interactive transitions | `transition: color 0.15s, border-color 0.15s, opacity 0.15s` | — | Nav links, tags, buttons |

```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. State Patterns

### 9.1 Loading / Skeleton

Skeleton screens replace all data sections during load. Hero and nav always render immediately.

```css
@keyframes skel-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
.sk {
  background: var(--surface-2);
  border-radius: 4px;
  animation: skel-pulse 1.8s ease-in-out infinite;
}
.sk-h { height: 14px; } /* text line */
```

**Skeleton structure per section:**

| Section | Skeleton |
|---------|----------|
| Mood card | 96px×150px block (score) + 3 text lines + 6px bar |
| Index cards | 4 × 80px card-height blocks |
| F&G left | 96px×120px block + 6px bar + 3-col historical |
| F&G right | 7 × full-width 14px lines |
| Reddit table | Header preserved + 4 rows of 5 skeleton cells |
| News grid | Source (60px) + 3 text lines per card |
| AI insights | Header preserved + 3 text lines |
| Pillar body | Pillar header preserved + RSI circle + lines |
| Chart | 200px full-width block |
| Gauge score | 88px×100px block + spectrum bar |

> **Rule:** Never show a spinner alone. Always use skeleton screens that match the exact shape of the content they replace. Pulse animation only — no shimmer gradient.

### 9.2 Error / Fallback

Two error variants. Structure is always: icon → title → description → meta → CTA(s).

#### Homepage error

```html
<div class="err-wrap">
  <div class="err-icon">
    <!-- Alert circle SVG, stroke="var(--red)" -->
  </div>
  <div class="err-title">Market data unavailable</div>
  <p class="err-desc">We couldn't load live market data. Our data providers may be experiencing issues, or your connection may be interrupted.</p>
  <div class="err-meta">ERR_DATA_FETCH · Last known update: {N} min ago</div>
  <button class="btn-retry">↺  Retry</button>
</div>
```

#### Stock detail error

Same structure, plus a ticker pill and a second "Back to Markets" CTA:

```html
<div class="err-ticker-pill">
  <!-- small icon -->
  {TICKER}
</div>
<div class="err-title">Unable to load {TICKER}</div>
<p class="err-desc">...</p>
<div class="err-meta">ERR_TICKER_FETCH · {TICKER} · {HH:MM:SS UTC}</div>
<button class="btn-retry">↺  Retry</button>
<a href="/" class="btn-home">← Back to Markets</a>
```

```css
.err-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 340px;
  text-align: center; padding: 64px 32px;
}
.err-icon {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--red-bg); border: 1px solid var(--red-br);
  display: flex; align-items: center; justify-content: center; margin-bottom: 22px;
}
.err-title { font-family: var(--serif); font-size: 30px; letter-spacing: -1px; color: var(--tx1); margin-bottom: 10px; }
.err-ticker-pill {
  font-family: var(--mono); font-size: 12px; color: var(--tx3);
  border: 1px solid var(--line); border-radius: 6px; padding: 4px 12px;
  display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px;
}
.err-desc  { font-size: 15px; color: var(--tx2); line-height: 1.65; max-width: 400px; margin-bottom: 10px; }
.err-meta  { font-family: var(--mono); font-size: 11px; color: var(--tx3); margin-bottom: 28px; letter-spacing: 0.5px; }
.btn-retry {
  background: none; border: 1px solid var(--line); color: var(--tx2);
  padding: 9px 24px; border-radius: 7px; font-family: var(--mono); font-size: 11px;
  text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s; margin-right: 10px;
}
.btn-retry:hover { border-color: rgba(255,255,255,0.2); color: var(--tx1); }
.btn-home {
  background: none; border: 1px solid var(--line); color: var(--tx3);
  padding: 9px 24px; border-radius: 7px; font-family: var(--mono); font-size: 11px;
  text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
  transition: color 0.15s; text-decoration: none;
}
.btn-home:hover { color: var(--tx2); }
```

**Error copy rules:**
- `err-title`: Serif, 30px, describes *what* failed
- `err-desc`: Prose sentence explaining *why* and *what to do*
- `err-meta`: Monospace, includes error code + contextual timestamp
- Homepage shows: "Last known update: N min ago"
- Detail page shows: "ERR_TICKER_FETCH · SYMBOL · HH:MM:SS UTC"

---

## 10. Texture & Surface Effects

### Film grain overlay (body-level)

Applied to `body::before`. Runs at `opacity: 0.025`. Always `position: fixed; inset: 0; pointer-events: none; z-index: 0`.

```css
body::before {
  content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px;
}
```

### Page wrapper z-index

`z-index: 1` on `.page` ensures page content renders above the `z-index: 0` grain overlay.

### Nav backdrop blur

```css
background: rgba(7,9,13,0.96);
backdrop-filter: blur(24px);
```

### Hero ambient gradients

1. Linear: `linear-gradient(160deg, rgba(90,156,248,0.05) 0%, transparent 55%)` — static blue hint top-left
2. Radial blob via `::after` — green pulse, animated with `blobDrift`

---

## 11. Accessibility Rules

| Rule | Implementation |
|------|---------------|
| Colour contrast | `--tx3` (#5d6e88) on `--bg` (#07090d) = ~5.2:1 ✓ WCAG AA |
| Minimum text size | 10px for `--mono` labels. Never smaller. |
| Focus rings | All interactive elements must have `:focus-visible` with `outline: 1px solid var(--tx2); outline-offset: 2px;`. Do not rely on browser defaults. |
| Active / pressed | Buttons: `transform: scale(0.97)`. Cards/rows: `opacity: 0.8`. Applied via `:active` pseudo-class. |
| Touch targets | Minimum 44×44px for all buttons. Nav links are 56px tall. |
| Aria labels | `aria-label` on icon-only buttons and SVG charts. |
| Alt text | All `<img>` elements require descriptive `alt`. SVG charts use `role="img" aria-label`. |
| Form labels | Search inputs have `aria-label`. |
| Reduced motion | All CSS animations must be suppressed under `prefers-reduced-motion: reduce`. |
| Keyboard nav | Tab order matches visual order. Interactive elements are natively focusable (`<a>`, `<button>`, `<input>`). |
| Colour alone | Tags always have text label — colour is never the sole signal. |
| Chart alternatives | Every data chart must have a corresponding `num-table` or `group-row` list visible beneath it. |

---

## 12. Do / Don't

### Typography

| Do | Don't |
|----|-------|
| Use `--mono-num` (IBM Plex Mono) for prices, %, scores | Use `--mono` for numeric data |
| Use `--serif` for large focal numbers (RSI, score, price) | Use `--mono-num` for focal display numbers |
| `font-weight: 400` for AI insights body | `font-weight: 300` — too thin on non-Retina |
| `letter-spacing: 1.6px` on all section labels | Mix letter-spacing values on `.sec-label` |

### Color

| Do | Don't |
|----|-------|
| Use `--surface-hov` on card hover | Swap to `--surface` on hover (too abrupt) |
| Apply semantic green/red/amber only to signal data | Use green/red for decorative elements |
| Use `--blue` exclusively for AI, Pro, chart index lines | Use blue for sentiment signals |
| Map `--tx3` to all tertiary labels — timestamps, axis ticks, sec-labels | Use `--tx3` for body text |

### Layout

| Do | Don't |
|----|-------|
| `margin: 20px 32px 16px` on stock detail top-section | Full-bleed the top-section card |
| `240px 1fr` for chart-gauge grid | `1fr 2fr` — gauge becomes too wide |
| `minmax(260px, 320px) 1fr` for F&G columns | Fixed `300px` — breaks on tablet |
| `display: flex; flex-direction: column` on news cards | Block layout — "Read →" won't pin to bottom |
| Section padding exactly `40px 32px` | Mix `36px` and `40px` across sections |

### Components

| Do | Don't |
|----|-------|
| White-fill `.btn-pro` — always solid | Change to outlined or ghost variant |
| "Analyse →" for search CTA | Generic "Go" or "Search" |
| Two CTAs on stock detail error (Retry + Back) | Single CTA only on detail errors |
| Animated pip on all live-data headers and pillar pips | Static dot on live sections |
| Pulse skeleton (`skel-pulse`) during loading | Shimmer gradient or spinner alone |
| Show "last known update" timestamp in error meta | Generic "Something went wrong" only |

### Icons & assets

| Do | Don't |
|----|-------|
| SVG icons from a consistent set (Lucide / Heroicons) | Use emojis as UI icons |
| `cursor: pointer` on all clickable cards, rows, chips | Default cursor on interactive elements |
| `transition: 0.12–0.15s` for micro-interactions | Transitions >300ms for hover states |

### Styling

| Do | Don't |
|----|-------|
| Use CSS Modules for all component styles | Use Tailwind, inline styles, or global classnames |
| `:focus-visible` outline on all interactive elements | Rely on browser default focus rings or omit focus styles |
| `:active` state (scale or opacity) on buttons and cards | Leave buttons without pressed-state feedback |

---

*End of DESIGN_SYSTEM.md — v1.0.0*
