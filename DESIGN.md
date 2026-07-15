# SentientMarkets — Homepage Design System (FINAL)

Source of truth for the light-canvas design, extracted from the **shipped homepage
implementation** on `homepage-redesign` (`frontend/app/page.tsx`, `page.module.css`,
`layout.tsx`, `globals.css`, `components/{MoodCard,MarketSnapshot,SocialFeed,Nav,Footer,TickerTape,HeartCanvas}.tsx`).
Where this document and the older `NEW_DESIGN.md` disagree, **this document wins** —
it reflects what actually shipped.

Voice: editorial research crossed with a quant terminal. White document canvas,
one blue action color used scarcely, Inter at calm weights, every number in
JetBrains Mono, sentiment green/red reserved strictly for data.

---

## 1. Color tokens (as shipped)

### Brand / action
| Token | Value | Use |
|---|---|---|
| `primary` | `#0052ff` | THE only action color: primary CTA pill, search Go button, inline accent links, hover-accent on interactive text. One or two blue moments per fold. |
| `primary-active` | `#003ecc` | Hover/active state of primary. |
| `focus-ring` | `box-shadow: 0 0 0 4px rgba(0,82,255,0.15)` + `border-color: #0052ff` | Search/input focus treatment. |
| `match-highlight` | `rgba(0,82,255,0.1)` | Substring-match `<mark>` background. |

### Ink & text
| Token | Value | Use |
|---|---|---|
| `ink` | `#0a0b0d` | Headlines (emphasis line), card titles, primary values, link hover. |
| `body` | `#5b616e` | Body paragraphs, de-emphasized headline line, nav links, score chips. |
| `muted` | `#7c828a` | Section labels, table headers, captions, neutral sentiment. |
| `muted-soft` | `#a8acb3` | Placeholder text, faintest labels, timestamps, disabled-ish text. |

### Surfaces & hairlines
| Token | Value | Use |
|---|---|---|
| `canvas` | `#ffffff` | Page background and card background. |
| `surface-soft` | `#f7f7f7` | Search pill resting bg, ticker-tape band, signal rows, row hover, table header band. |
| `surface-strong` | `#eef0f3` | Badge/chip backgrounds, skeleton shimmer blocks. |
| `hairline` | `#dee1e6` | Card and table outer borders, nav/footer/tape borders, off-state dots. |
| `hairline-soft` | `#eef0f3` | Internal dividers, row dividers, dropdown section separators. |

### Sentiment (DATA ONLY — never buttons, never decoration)
| Token | Value |
|---|---|
| `bullish` | `#05b169` (tint bg: `rgba(5,177,105,0.1)`) |
| `bearish` | `#cf202f` (tint bg: `rgba(207,32,47,0.1)`) |
| `neutral` | `#7c828a` (tint bg: `#eef0f3`) |

### Particle heart palette (HeartCanvas — final, do not retune)
- Greens: `[5,177,105] [62,207,142] [16,200,120] [88,220,160]`
- Reds: `[224,85,99] [236,64,79] [240,110,120] [220,50,66]`

---

## 2. Typography

### Faces & loading
- **Inter** — all text. Weights 400/500/600/700 via `next/font/google`, CSS var `--font-inter`.
- **JetBrains Mono** — every numerical value (scores, prices, timestamps, %, ranks) and code. Weights 400/500, CSS var `--font-jetbrains-mono`.
- Loaded once in `layout.tsx` as CSS variables only; routes **opt in** via a wrapper (see §7 Scoping). Non-opted routes keep Geist.
- Inside a light-canvas wrapper, Tailwind `font-mono` maps to JetBrains Mono and `font-serif` is neutralized to Inter (no serif anywhere on light routes).

### Scale (as shipped)
| Role | Spec |
|---|---|
| Hero H1 | `clamp(2.25rem, 6vw, 4rem)` (36→64px fluid), weight 400, line-height 1.05, tracking `-0.04em`. Two-tone: setup line `#5b616e`, payoff line `#0a0b0d`. |
| Card verdict / display word | 36px mobile → 44px desktop (`text-4xl md:text-[44px]`), weight 400, line-height 1, tracking `-1.5px`, colored by sentiment. |
| Section heading (page-level, e.g. static pages) | 32–44px, weight 400, tracking −0.4px to −1px. Display copy is NEVER bold. |
| Eyebrow | 12px (`text-xs`) semibold, uppercase, tracking `0.12em`, `muted`. |
| Section label | 12px semibold, uppercase, tracking `0.05em`–`0.06em`, `#7c828a`, 20–24px below-margin. Optionally preceded by a 6px live dot (sentiment-colored, may pulse). |
| Body | 16px (`text-base`), weight 400, line-height 1.55, `#5b616e`. |
| Body small | 14px (`text-sm`), weight 400–500. |
| Micro label | 11px (or 10px) semibold, uppercase, tracking `0.05em`. |
| Nav link | 14px (`text-sm`) medium, `#5b616e` → `#0a0b0d` on hover, no uppercase. |
| Button | 14px (`text-sm`) semibold. |
| Number display | `font-mono` weight 500 (`font-medium`), sized per context; `$`/units in `muted-soft`. |
| Timestamp / freshness | 11px `font-mono`, `#a8acb3`. |

---

## 3. Shape & elevation

- **Pills (`rounded-full`)**: every CTA, the search bar, badges, momentum/tag chips, historical chips, trending ticker buttons.
- **Cards (`rounded-xl`, 12px)**: all containers. `bg-white`, `border border-[#dee1e6]`, **no shadow**.
- **Small tags**: 5–6px radius (`rounded-[5px]`/`rounded-md`) — e.g. SIGNAL tag, score chip. The only sub-pill radii.
- **Signal/list rows**: 10px radius (`rounded-[10px]`), `bg-[#f7f7f7]`, `border-[#eef0f3]`.
- **Elevation**: flat. Depth comes from the 1px hairline only. No drop shadows (sole exception: the blue focus ring), no gradients (sole exception: the hero's white readability veil).

---

## 4. Spacing & layout rhythm

- **Section gutter**: `px-6 md:px-20`.
- **Column**: `mx-auto w-full max-w-[1200px]` — every section label and card edge aligns to this column exactly (no extra insets on labels).
- **Section bands**: `pt-20 md:pt-[88px] pb-20 md:pb-[88px]` (80/88px air between bands).
- **Card padding**: `p-7` (28px).
- **Nav height**: `h-14` (56px), sticky.
- **In-card rhythm**: headline row `pb-[22px] mb-[22px]` with hairline-soft divider; footer divider `mt-6 mb-5`; label→content gap 12px (`mb-3`).
- **Tables**: header band `bg-[#f7f7f7]` + 11px uppercase muted labels, rows divided by `#eef0f3`, row hover `bg-[#f7f7f7]`, generous `px-8 py-4`.

---

## 5. Core component patterns

### Light nav (shipped as `Nav variant="light"`; static pages use inline navs styled the same)
Sticky, `h-14`, `backdrop-blur-md`, `bg-white/80` (→ `bg-white/95` + `border-[#dee1e6]` after 30px scroll; resting border `#eef0f3`), logo 18px semibold tracking −0.01em ink ("SentientMarkets", no trailing dot on light), links 14px medium `#5b616e`→ink, **blue pill CTA** (`bg-[#0052ff] hover:bg-[#003ecc] text-white px-5 h-10 rounded-full text-sm font-semibold`) — the single blue moment of the fold.

### Footer (shared component — pass `variant="light"`, never edit the dark default)
`border-t border-[#dee1e6] bg-white py-8`, links 11px semibold uppercase tracking `0.08em` `#7c828a` → ink on hover.

### Hero (homepage)
Full viewport minus nav (`min-h-[calc(100dvh-3.5rem)]`), flex column; content block optically high (`pt-[6vh] pb-[14vh]`, centered); HeartCanvas behind (z-0) + white radial veil (z-1: `radial-gradient(ellipse 44% 32% at 50% 46%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 55%, transparent)`), content `z-[2]`, ticker tape pinned flush at the fold in `z-[1]`. Section has `overflow-hidden`.

### Search pill
Resting: `bg-#f7f7f7`, hairline border, `rounded-[100px]`. Focus: white bg, `#0052ff` border, 4px blue ring. Blue pill Go button inside. Dropdown: white flat card, hairline border, 12px radius, **`text-align: left` enforced** (never inherit centering), fixed-width left-aligned ticker column (56px) beside a `flex:1` ellipsized name column.

### Flat data card (MoodCard v2 is the reference)
- Meta row: badge pill right-aligned (`bg-[#eef0f3] text-[#7c828a] text-[11px] font-semibold px-[11px] py-[5px] rounded-full`, e.g. "✦ Claude").
- Headline row owns full width: display word left (sentiment-colored), score group right (9px dots, gap 5px, on = sentiment color, off = `#dee1e6`; mono chip `bg-[#eef0f3] px-[11px] py-1 rounded-md`); hairline-soft divider beneath.
- Body: two-column grid `1.15fr / 1fr` gap 36px (stacks below `md`); paragraph left, labeled stack of soft rows right.
- Footer: hairline divider, label + row of small values left, mono timestamp right.

### Badge / chip vocabulary
- Neutral badge: `bg-[#eef0f3] text-[#7c828a]` pill, 11px semibold.
- Sentiment chip: tint bg + sentiment text (see §1), pill, 11px semibold uppercase.
- Tag-in-row: white bg, hairline border, 10px bold uppercase `#7c828a`, 5px radius.

### Ticker tape
`bg-[#f7f7f7]`, 1px `#dee1e6` top/bottom borders, `py-3`; ticker symbol 12px semibold ink, change value mono colored bullish/bearish (neutral `#7c828a`); `·` separators in `#dee1e6`. 40s linear loop, paused under reduced motion.

---

## 6. Motion

- **Entrance**: framer-motion, `initial {opacity:0, y:30, filter:blur(10px)}` → `whileInView {opacity:1, y:0, filter:blur(0px)}`, `viewport {once:true, margin:'-100px'}`, `transition {duration:1.2, ease:[0.16,1,0.3,1]}`, staggered `delay` 0.2/0.4 per section.
- **Gotcha (learned the hard way)**: every property set in `initial` MUST be reset in `whileInView` — a leftover `scale: 0.98` shipped a permanently mis-sized card.
- Micro-stagger for repeated items: `delay: i * 0.04–0.08`.
- Hover transitions: `transition-colors`, 150–300ms. Active: `scale(0.95–0.97)`.
- `prefers-reduced-motion`: canvas renders static (no spin/beat/repulsion), tape stops scrolling.

---

## 7. Route scoping (critical)

The app's **global default stays dark** (`globals.css`: `#0A0A0B` html/body + grain overlay). Light routes opt in:

1. **Wrapper class** on the route's root div: the CSS-module theme wrapper (`.home` in `page.module.css`) remaps `--sans/--mono/--serif` to Inter/JetBrains, sets canvas/ink, and upgrades `font-mono`/`font-serif` utilities within its subtree.
2. **Marker class `home-light`** on the same div: an **additive** `:has()` block at the end of `globals.css` turns `html`/`body` white and suppresses the grain overlay *only while the marker is mounted* — this kills the dark overscroll/pre-hydration flash without touching the dark rules other routes rely on.
3. New light routes reuse this exact mechanism (share the wrapper + marker or extend the `:has()` selector list additively). **Never** edit the global dark body rule, and never leave a light nav/footer on a dark shell or vice versa — each screen must be internally consistent.

Dark-by-design surfaces (do not touch): all `/stock|etf|crypto|commodity|forex|index/[ticker]` asset pages and the homepage's in-page stock view (`Nav variant="dark"` + dark shell + default dark Footer).

---

## 8. Do / Don't

**Do**
- Keep `#0052ff` scarce — one or two blue moments per fold; it is the only action color.
- Render every number in JetBrains Mono at weight 500, units/$ in `muted-soft`.
- Keep display copy at weight 400 — editorial calm; emphasis via the ink-vs-body two-tone, never via bolding.
- Give every section the same column (`max-w-[1200px]`) and gutter (`px-6 md:px-20`); labels sit at the column edge with zero extra inset.
- Keep each screen internally consistent (all-light or all-dark), switching via variant props / scoped wrappers.

**Don't**
- Don't introduce a second brand color; green/red are data semantics only — never a button, border accent, or decoration.
- Don't add shadows (except the blue focus ring) or gradients (except the hero veil).
- Don't put numbers in Inter or text in mono (mono is for values, code, timestamps).
- Don't soften pills into rounded rects or sharpen cards below 12px (5–6px tags are the only exception).
- Don't edit shared globals/dark defaults to style a light route — scope with wrappers, variants, and additive `:has()` rules.
- Don't let `text-align: center` leak from marketing wrappers into data UI (dropdowns, tables) — left-align data surfaces explicitly.
