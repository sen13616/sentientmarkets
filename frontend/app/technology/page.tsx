import Link from 'next/link';
import styles from '../page.module.css';
import Nav from '../components/Nav';
import Reveal from '../components/Reveal';

export const metadata = {
  title: 'Technology — SentientMarkets',
};


const CHANNELS = [
  { label: 'Market', pct: 35, desc: 'What the price action itself is saying' },
  { label: 'Narrative', pct: 30, desc: 'What the financial press is saying' },
  { label: 'Influencer', pct: 25, desc: 'What insiders and analysts are doing' },
  { label: 'Macro', pct: 10, desc: 'What the broader economy is saying' },
];

const MARKET_COMPONENTS = [
  { name: 'Returns', weight: '30%', signal: '1-day, 5-day, and 20-day returns' },
  { name: 'Order flow', weight: '20%', signal: 'Intraday buying vs. selling pressure (close-location value)' },
  { name: 'Momentum', weight: '15%', signal: "RSI-14 (Wilder's)" },
  { name: 'Short volume', weight: '15%', signal: 'FINRA daily short-volume ratio' },
  { name: 'Liquidity', weight: '10%', signal: 'Bid–ask spread (wider spreads read bearish)' },
  { name: 'Volume', weight: '10%', signal: 'Volume relative to recent average' },
];

const INFLUENCER_SIGNALS = [
  { name: 'Insider net buying/selling', weight: '1.00', source: 'Regulatory insider-transaction filings' },
  { name: 'Analyst buy/hold/sell consensus', weight: '0.85', source: 'Analyst consensus data' },
  { name: 'Analyst price targets vs. current price', weight: '0.85', source: 'Analyst target data' },
  { name: 'Earnings estimate revisions', weight: '0.80', source: 'Forward EPS estimate changes' },
];

const HALF_LIVES = [
  { channel: 'Market', halfLife: '1 hour' },
  { channel: 'Narrative', halfLife: '12 hours' },
  { channel: 'Analyst signals', halfLife: '3 days' },
  { channel: 'Insider transactions', halfLife: '7 days' },
  { channel: 'Macro', halfLife: '14 days' },
];

const SCORE_BANDS = [
  { range: '0–20', label: 'Strongly Bearish' },
  { range: '21–40', label: 'Bearish' },
  { range: '41–60', label: 'Neutral' },
  { range: '61–80', label: 'Bullish' },
  { range: '81–100', label: 'Strongly Bullish' },
];

const DATA_SOURCES = [
  {
    name: 'Yahoo Finance / Polygon',
    desc: 'Price, volume, and order-flow data — primary plus fallback provider',
    signals: ['Price', 'Volume', 'Order flow'],
  },
  {
    name: 'Alpha Vantage',
    desc: 'Financial news — the primary narrative source',
    signals: ['News'],
  },
  {
    name: 'Finnhub',
    desc: 'News fallback, insider transactions, and analyst consensus',
    signals: ['News', 'Insider', 'Analysts'],
  },
  {
    name: 'FINRA',
    desc: 'Official daily short-volume files',
    signals: ['Short volume'],
  },
  {
    name: 'FRED (Federal Reserve)',
    desc: 'Treasury yields and the yield-curve spread',
    signals: ['Yields', 'Curve'],
  },
  {
    name: 'CBOE (via market data)',
    desc: 'VIX — the market’s fear gauge',
    signals: ['VIX'],
  },
];

export default function TechnologyPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[1200px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the homepage hero */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              Technology
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              One score. Four channels.<br /><em className="not-italic text-[#0a0b0d]">Every 30 minutes.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] mb-4 ${styles.heroFade2}`}>
              SentientMarkets distills thousands of market signals into a single 0–100 sentiment score
              for every stock in the S&amp;P 500 (502 tickers). A continuously running pipeline ingests
              price action, financial news, insider and analyst activity, and macroeconomic data — then
              normalizes, weighs, and blends them into one number you can act on, refreshed every
              30 minutes, around the clock.
            </p>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              The methodology is fully documented in our research paper,{' '}
              <em className="not-italic text-[#0a0b0d]">&ldquo;How to Quantify Stock Sentiment&rdquo;</em>, and this
              system is its reference implementation: every formula, weight, and threshold on this page
              exists in the code.
            </p>
          </section>

          {/* THE FOUR CHANNELS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">The four channels</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden mb-4">
                <div className="px-6 py-4 border-b border-[#eef0f3]">
                  <div className="text-[11px] text-[#7c828a] uppercase tracking-[0.05em] font-semibold">Composite score — weighted blend</div>
                </div>
                <div className="px-6 py-6 flex flex-col gap-4">
                  {CHANNELS.map(({ label, pct, desc }) => (
                    <div key={label} className="flex items-center gap-4">
                      <div className="w-24 text-xs font-semibold text-[#0a0b0d]">{label}</div>
                      <div className="flex-1 h-1.5 bg-[#eef0f3] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0a0b0d] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-10 text-right text-xs font-mono font-medium tabular-nums text-[#0a0b0d]">{pct}%</div>
                      <div className="hidden md:block w-64 text-xs text-[#5b616e]">{desc}</div>
                    </div>
                  ))}
                  <div className="border-t border-[#eef0f3] pt-4 text-xs text-[#5b616e] leading-relaxed">
                    Four independent sentiment channels blend into the composite. If a channel has no
                    fresh data for a ticker, its weight is redistributed proportionally across the
                    remaining channels — the score degrades gracefully rather than going stale.
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4">
              <Reveal className="h-full">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-[#0a0b0d]">Market</div>
                    <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2 py-0.5 rounded-[5px]">35%</span>
                  </div>
                  <p className="text-xs text-[#5b616e] leading-relaxed mb-4">
                    Six components of price-and-volume behavior, each mapped to a bullish–bearish scale
                    and weighted. Market data updates every 15 minutes during US trading hours, with a
                    definitive end-of-day close capture after the bell.
                  </p>
                  <div className="flex flex-col gap-2">
                    {MARKET_COMPONENTS.map(({ name, weight, signal }) => (
                      <div key={name} className="flex items-baseline gap-3 text-xs">
                        <span className="w-9 shrink-0 font-mono font-medium tabular-nums text-[#0a0b0d]">{weight}</span>
                        <span className="font-semibold text-[#0a0b0d] shrink-0">{name}</span>
                        <span className="text-[#7c828a]">{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.08} className="h-full">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-[#0a0b0d]">Narrative</div>
                    <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2 py-0.5 rounded-[5px]">30%</span>
                  </div>
                  <p className="text-xs text-[#5b616e] leading-relaxed mb-4">
                    Financial news, scored by a transformer model — not keyword counting. News for all
                    502 tickers is pulled every 30 minutes, 24/7, from two independent providers.
                  </p>
                  <ul className="flex flex-col gap-2 text-xs text-[#5b616e] leading-relaxed">
                    <li>
                      <strong className="text-[#0a0b0d]">Relevance filtering</strong> — articles must clear a
                      relevance threshold (score ≥ 0.60) to count toward a ticker at all; passing mentions
                      don&apos;t move the score.
                    </li>
                    <li>
                      <strong className="text-[#0a0b0d]">Event deduplication</strong> — when ten outlets cover
                      the same story, that&apos;s one event, not ten signals. Articles within a 4-hour window
                      with semantically near-identical titles (embedding cosine similarity &gt; 0.85) are
                      clustered, and only the most relevant article in each cluster is scored.
                    </li>
                    <li>
                      <strong className="text-[#0a0b0d]">FinBERT sentiment</strong> — each surviving article is
                      scored with FinBERT (ProsusAI/finbert), a BERT-family transformer fine-tuned on
                      financial text: positive-class probability minus negative-class probability, a
                      continuous value from −1 to +1.
                    </li>
                    <li>
                      <strong className="text-[#0a0b0d]">Model confidence</strong> — FinBERT&apos;s own uncertainty
                      down-weights ambiguous articles; a confidently bullish article counts more than a
                      hedged one.
                    </li>
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={0.16} className="h-full">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-[#0a0b0d]">Influencer</div>
                    <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2 py-0.5 rounded-[5px]">25%</span>
                  </div>
                  <p className="text-xs text-[#5b616e] leading-relaxed mb-4">
                    Not social media chatter — the people with real skin in the game. Insider
                    transactions get the highest weight and the longest memory (a 7-day half-life vs.
                    3 days for analyst signals): insiders trade on longer horizons than headlines.
                  </p>
                  <div className="flex flex-col gap-2">
                    {INFLUENCER_SIGNALS.map(({ name, weight, source }) => (
                      <div key={name} className="flex items-baseline gap-3 text-xs">
                        <span className="w-9 shrink-0 font-mono font-medium tabular-nums text-[#0a0b0d]">{weight}</span>
                        <span className="font-semibold text-[#0a0b0d] shrink-0">{name}</span>
                        <span className="text-[#7c828a] hidden lg:inline">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.24} className="h-full">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-[#0a0b0d]">Macro</div>
                    <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2 py-0.5 rounded-[5px]">10%</span>
                  </div>
                  <p className="text-xs text-[#5b616e] leading-relaxed mb-4">
                    Market-wide state variables that apply to every ticker.
                  </p>
                  <ul className="flex flex-col gap-2 text-xs text-[#5b616e] leading-relaxed">
                    <li>
                      <strong className="text-[#0a0b0d]">Sector momentum</strong> — each stock is mapped to its
                      GICS sector ETF (XLK for tech, XLV for healthcare, etc.), and the ETF&apos;s 20-day
                      return is the highest-weighted macro input. That makes the macro channel partially
                      per-ticker, not one-size-fits-all.
                    </li>
                    <li>
                      <strong className="text-[#0a0b0d]">VIX</strong> — the market&apos;s fear gauge (elevated VIX
                      reads bearish).
                    </li>
                    <li>
                      <strong className="text-[#0a0b0d]">Treasury yields</strong> — 10-year and 2-year yields
                      from the Federal Reserve&apos;s FRED database.
                    </li>
                    <li>
                      <strong className="text-[#0a0b0d]">Yield-curve slope</strong> — the 10y−2y spread, a
                      classic recession-watch indicator.
                    </li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </section>

          {/* SIGNAL WEIGHTING */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">How every signal is weighted</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-[#eef0f3] bg-[#f7f7f7]">
                  <code className="text-xs font-mono text-[#0a0b0d]">
                    weight = source credibility × relevance × model confidence × author credibility × time decay
                  </code>
                </div>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-6 md:border-r border-[#eef0f3]">
                    <p className="text-xs text-[#5b616e] leading-relaxed mb-4">
                      Every individual signal — a news article, an insider trade, an RSI reading, a VIX
                      print — enters the system with a weight built from five factors:
                    </p>
                    <ul className="flex flex-col gap-2 text-xs text-[#5b616e] leading-relaxed">
                      <li>
                        <strong className="text-[#0a0b0d]">Source credibility</strong> — every data provider
                        carries a fixed trust weight (e.g., exchange-derived price data at 0.90, news
                        providers at 0.65–0.75).
                      </li>
                      <li>
                        <strong className="text-[#0a0b0d]">Relevance</strong> — how directly a news article
                        concerns the ticker (narrative channel only; sub-threshold articles are dropped
                        entirely).
                      </li>
                      <li>
                        <strong className="text-[#0a0b0d]">Model confidence</strong> — FinBERT&apos;s certainty
                        about its own classification (narrative channel only).
                      </li>
                      <li>
                        <strong className="text-[#0a0b0d]">Author credibility</strong> — reserved for a planned
                        role-based hierarchy (CEO filings vs. director filings); currently neutral.
                      </li>
                      <li>
                        <strong className="text-[#0a0b0d]">Time decay</strong> — every signal fades
                        exponentially, with half-lives tuned per channel.
                      </li>
                    </ul>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a] mb-4">Half-life by channel</div>
                    <div className="flex flex-col">
                      {HALF_LIVES.map(({ channel, halfLife }, i) => (
                        <div
                          key={channel}
                          className={`flex items-center justify-between py-2.5 ${i < HALF_LIVES.length - 1 ? 'border-b border-[#eef0f3]' : ''}`}
                        >
                          <span className="text-xs font-semibold text-[#0a0b0d]">{channel}</span>
                          <span className="text-xs font-mono font-medium tabular-nums text-[#0a0b0d]">{halfLife}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* NORMALIZATION */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Normalization — making signals comparable</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-[#eef0f3] bg-[#f7f7f7]">
                  <code className="text-xs font-mono text-[#0a0b0d] block">
                    z = (value − rolling mean) / rolling std dev, clamped to ±3
                  </code>
                  <code className="text-xs font-mono text-[#0a0b0d] block mt-1">
                    score = 50 + 50 × (z / 3)
                  </code>
                </div>
                <div className="p-6">
                  <p className="text-xs text-[#5b616e] leading-relaxed mb-3">
                    An RSI reading, a short-volume ratio, and a Treasury yield live on completely
                    different scales. Before aggregation, every numeric signal is converted to a common
                    0–100 scale (50 = neutral) using a rolling z-score against that signal&apos;s own recent
                    history. The rolling window is 500 observations for intraday market signals and 90
                    for daily-cadence signals.
                  </p>
                  <p className="text-xs text-[#5b616e] leading-relaxed mb-3">
                    Signals where &ldquo;high&rdquo; means &ldquo;bearish&rdquo; (VIX, short volume, bid–ask spread, yields) are
                    sign-inverted so that above 50 always means bullish. When a signal doesn&apos;t yet have
                    enough history for a reliable z-score, a calibrated parametric fallback takes over
                    instead of producing a noisy score.
                  </p>
                  <p className="text-xs text-[#5b616e] leading-relaxed">
                    <strong className="text-[#0a0b0d]">Small-sample protection:</strong> when a ticker has fewer
                    than 5 signals in a channel, the channel&apos;s score is shrunk toward neutral (50) — one
                    lone article can&apos;t swing a stock to &ldquo;Strongly Bullish.&rdquo;
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* FROM SIGNALS TO SCORE */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">From signals to the score you see</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-6 md:border-r border-[#eef0f3]">
                    <ol className="flex flex-col gap-3 text-xs text-[#5b616e] leading-relaxed">
                      {[
                        ['Aggregate', "each channel's weighted signals combine into a 0–100 sub-index."],
                        ['Blend', 'the four sub-indices combine at 35/30/25/10 into the raw composite.'],
                        ['Smooth', 'an exponential moving average with a 4-hour half-life is applied, so the published score reflects sustained shifts in sentiment rather than tick-to-tick noise.'],
                        ['Label', 'the score maps to a plain-English label.'],
                      ].map(([step, desc], i) => (
                        <li key={step} className="flex gap-3">
                          <span className="w-5 h-5 shrink-0 rounded-full bg-[#eef0f3] text-[#0a0b0d] text-[10px] font-mono font-medium flex items-center justify-center">{i + 1}</span>
                          <span>
                            <strong className="text-[#0a0b0d]">{step}</strong> — {desc}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="text-xs text-[#5b616e] leading-relaxed mt-4 pt-4 border-t border-[#eef0f3]">
                      Every response also carries a <strong className="text-[#0a0b0d]">confidence</strong> value
                      (0–100): it starts at 100 and takes penalties for stale data, missing channels, or
                      channels that sharply disagree with each other. A score of 72 with confidence 90 and
                      a score of 72 with confidence 55 are different animals — and the system tells you
                      which one you&apos;re holding.
                    </p>
                    <p className="text-xs text-[#5b616e] leading-relaxed mt-3 pro-blur" aria-hidden="true">
                      Pro-tier responses additionally expose the full breakdown: per-channel sub-indices,
                      the top drivers behind the score, a generated explanation, divergence between
                      channels, and data-freshness metadata. (Pro-tier responses also include the
                      unsmoothed raw score.)
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a] mb-4">Score bands</div>
                    <div className="flex flex-col">
                      {SCORE_BANDS.map(({ range, label }, i) => (
                        <div
                          key={range}
                          className={`flex items-center justify-between py-2.5 ${i < SCORE_BANDS.length - 1 ? 'border-b border-[#eef0f3]' : ''}`}
                        >
                          <span className="text-xs font-mono font-medium tabular-nums text-[#0a0b0d]">{range}</span>
                          <span className="text-xs font-semibold text-[#0a0b0d]">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* DATA SOURCES */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Data sources</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr_160px] gap-4 px-5 py-3 bg-[#f7f7f7] border-b border-[#dee1e6] text-[11px] uppercase tracking-[0.05em] text-[#7c828a] font-semibold">
                  <span>Source</span>
                  <span>Provides</span>
                  <span className="hidden sm:block">Signals</span>
                </div>
                {DATA_SOURCES.map(({ name, desc, signals }, i, arr) => (
                  <div
                    key={name}
                    className={`grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr_160px] gap-4 px-5 py-4 items-start ${i < arr.length - 1 ? 'border-b border-[#eef0f3]' : ''}`}
                  >
                    <div className="text-sm font-semibold text-[#0a0b0d]">{name}</div>
                    <div className="text-xs text-[#5b616e] leading-relaxed">{desc}</div>
                    <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-1">
                      {signals.map(s => (
                        <span key={s} className="text-[10px] font-mono bg-[#eef0f3] px-2 py-0.5 rounded-[5px] text-[#7c828a]">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="px-5 py-4 border-t border-[#eef0f3] bg-[#f7f7f7] text-xs text-[#5b616e] leading-relaxed">
                  Redundant providers on the critical paths (price data, news) mean a single vendor
                  outage doesn&apos;t blind the system.
                </div>
              </div>
            </Reveal>
          </section>

          {/* ARCHITECTURE & FRESHNESS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Architecture &amp; freshness</div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {[
                {
                  name: 'The pipeline',
                  tag: 'Write side',
                  desc: 'Ingests raw data on per-source schedules — price data every 15 minutes during market hours, news every 30 minutes around the clock, insider and analyst data every 6 hours, macro daily — and recomputes all four channels for all 502 tickers every 30 minutes.',
                  pills: ['Ingestion', 'Normalize', 'Weigh', 'Aggregate', 'Smooth'],
                },
                {
                  name: 'The API',
                  tag: 'Read side',
                  desc: 'A read-only layer serving the latest scores from an in-memory cache, with full score history preserved in PostgreSQL — which powers the history endpoint and, over time, backtesting. Scoring never calls vendors per-request, so responses stay fast.',
                  pills: ['In-memory cache', 'PostgreSQL', 'Score history'],
                },
              ].map(({ name, tag, desc, pills }, i) => (
                <Reveal key={name} delay={i * 0.08} className="h-full">
                  <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-[#0a0b0d]">{name}</div>
                      <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2 py-0.5 rounded-[5px]">{tag}</span>
                    </div>
                    <p className="text-xs text-[#5b616e] leading-relaxed mb-4">{desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pills.map(p => (
                        <span key={p} className="text-[10px] font-mono bg-[#eef0f3] px-2 py-0.5 rounded-[5px] text-[#7c828a]">{p}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1}>
              <div className="grid md:grid-cols-3 gap-px bg-[#dee1e6] border border-[#dee1e6] rounded-xl overflow-hidden">
                {[
                  { label: 'Full recompute', val: '30m', desc: 'All four channels are recomputed for all 502 tickers every 30 minutes, around the clock.' },
                  { label: 'Coverage', val: '502', desc: 'Every stock in the S&P 500 gets a score — market, narrative, influencer, and macro channels each recomputed on every cycle.' },
                  { label: 'Freshness', val: 'cache_age', desc: 'Every response includes cache_age_seconds, so you always know exactly how fresh the score you’re holding is.' },
                ].map(({ label, val, desc }) => (
                  <div key={label} className="bg-white p-6 flex flex-col gap-3">
                    <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a]">{label}</div>
                    <div className="text-3xl font-mono font-medium text-[#0a0b0d]">{val}</div>
                    <div className="text-xs text-[#a8acb3] leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* HONEST LIMITATIONS */}
          <section className="py-16">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Honest limitations</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl p-6">
                <ul className="flex flex-col gap-3 text-xs text-[#5b616e] leading-relaxed">
                  <li>
                    <strong className="text-[#0a0b0d]">Coverage is the S&amp;P 500</strong> (502 tickers) — smaller
                    caps aren&apos;t scored yet.
                  </li>
                  <li>
                    <strong className="text-[#0a0b0d]">Sentiment is a measurement</strong> of current signal
                    alignment, not a price prediction.
                  </li>
                  <li>
                    <strong className="text-[#0a0b0d]">Scores update every 30 minutes</strong> — this is not a
                    tick-level feed.
                  </li>
                  <li>
                    <strong className="text-[#0a0b0d]">Social-media sentiment is not currently an input</strong> —
                    the influencer channel tracks insiders and analysts, whose actions are regulated and
                    verifiable, rather than anonymous posts.
                  </li>
                </ul>
              </div>
            </Reveal>
          </section>

        </div>
      </div>

      <footer className="border-t border-[#dee1e6] bg-white py-8 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-base font-semibold tracking-[-0.01em] text-[#0a0b0d]">SentientMarkets</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Terms</Link>
          <Link href="/faq" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">FAQ</Link>
          <Link href="/contact" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Contact</Link>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a]">© 2026 · Not financial advice.</div>
      </footer>
    </div>
  );
}
