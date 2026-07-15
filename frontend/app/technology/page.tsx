import Link from 'next/link';
import styles from '../page.module.css';
import Reveal from '../components/Reveal';

export const metadata = {
  title: 'Technology — SentientMarkets',
};

const NAV_LINKS: [string, string][] = [
  ['/', 'Markets'],
  ['/about', 'About'],
  ['/technology', 'Technology'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
];

export default function TechnologyPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 h-14 backdrop-blur-md border-b bg-white/95 border-[#dee1e6]">
        <Link href="/" className="text-lg font-semibold tracking-[-0.01em] text-[#0a0b0d]">
          SentientMarkets
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-[#5b616e] hover:text-[#0a0b0d] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <button className="bg-[#0052ff] hover:bg-[#003ecc] text-white px-5 h-10 rounded-full text-sm font-semibold transition-all active:scale-95">
          Get Pro
        </button>
      </nav>

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[1200px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the homepage hero */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              Technology
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              Built on <em className="not-italic text-[#0a0b0d]">real signals,</em><br />not black boxes.
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              Every number on SentientMarkets comes from a documented source. Here&apos;s exactly how the
              score is calculated, where the data comes from, and how we serve it fast.
            </p>
          </section>

          {/* DATA SOURCES */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Data sources</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[140px_1fr_140px] gap-4 px-5 py-3 bg-[#f7f7f7] border-b border-[#dee1e6] text-[11px] uppercase tracking-[0.05em] text-[#7c828a] font-semibold">
                  <span>Source</span>
                  <span>What we use it for</span>
                  <span>Signals</span>
                </div>
                {[
                  {
                    name: 'yfinance',
                    desc: 'Price data, fundamentals, analyst ratings, moving averages, 52-week range, insider transactions',
                    signals: ['Price', 'MAs', 'Analysts'],
                  },
                  {
                    name: 'Alpha Vantage',
                    desc: 'RSI (14-day), technical indicators, and news sentiment scoring',
                    signals: ['RSI', 'News'],
                  },
                  {
                    name: 'CNN Fear & Greed',
                    desc: 'Composite market fear index and 7 sub-indicators including momentum, safe haven demand, and put/call ratio',
                    signals: ['Macro', 'Fear'],
                  },
                  {
                    name: 'Finnhub',
                    desc: 'Insider sentiment via MSPR score, earnings surprise history',
                    signals: ['Insider', 'Earnings'],
                  },
                  {
                    name: 'ApeWisdom',
                    desc: 'Reddit mention counts, rank velocity, and trending ticker detection across finance subreddits',
                    signals: ['Reddit', 'Social'],
                  },
                  {
                    name: 'Google Trends',
                    desc: 'Search interest index for ticker symbols — proxy for retail attention and momentum',
                    signals: ['Search', 'Attention'],
                  },
                  {
                    name: 'NewsAPI',
                    desc: 'Macro headline aggregation for homepage market context',
                    signals: ['Headlines'],
                  },
                ].map(({ name, desc, signals }, i, arr) => (
                  <div
                    key={name}
                    className={`grid grid-cols-[140px_1fr_140px] gap-4 px-5 py-4 items-start ${i < arr.length - 1 ? 'border-b border-[#eef0f3]' : ''}`}
                  >
                    <div className="text-sm font-semibold text-[#0a0b0d]">{name}</div>
                    <div className="text-xs text-[#5b616e] leading-relaxed">{desc}</div>
                    <div className="flex flex-wrap gap-1">
                      {signals.map(s => (
                        <span key={s} className="text-[10px] font-mono bg-[#eef0f3] px-2 py-0.5 rounded-[5px] text-[#7c828a]">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* SCORE CALCULATION */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Score calculation</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#eef0f3]">
                  <div className="text-[11px] text-[#7c828a] uppercase tracking-[0.05em] font-semibold">MarketMood Score — weighted composition</div>
                </div>
                <div className="px-6 py-6 flex flex-col gap-4">
                  {[
                    { label: 'Technical', pct: 35 },
                    { label: 'Fundamental', pct: 25 },
                    { label: 'Sentiment', pct: 40 },
                  ].map(({ label, pct }) => (
                    <div key={label} className="flex items-center gap-4">
                      <div className="w-24 text-xs font-semibold text-[#0a0b0d]">{label}</div>
                      <div className="flex-1 h-1.5 bg-[#eef0f3] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0a0b0d] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-10 text-right text-xs font-mono font-medium tabular-nums text-[#0a0b0d]">{pct}%</div>
                    </div>
                  ))}
                  <div className="border-t border-[#eef0f3] pt-4 text-xs text-[#5b616e] leading-relaxed">
                    Each pillar is scored 0–100 independently before weighting. The final MarketMood Score is a
                    weighted average clamped to 0–100.{' '}
                    <strong className="text-[#0a0b0d]">Scores ≥65 = Bullish · 45–64 = Neutral · ≤44 = Bearish.</strong>{' '}
                    Weights are calibrated to reflect the relative predictive value of each signal category —
                    sentiment is weighted highest as it captures forward-looking crowd and institutional behaviour.
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* INFRASTRUCTURE */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Infrastructure</div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  name: 'Frontend',
                  tag: 'Vercel',
                  desc: "Built on Next.js 14 App Router with Tailwind CSS for styling. Chart.js powers all data visualisations. Deployed to Vercel's edge network for global low-latency delivery.",
                  pills: ['Next.js 14', 'App Router', 'Tailwind CSS', 'Chart.js', 'TypeScript'],
                },
                {
                  name: 'Backend',
                  tag: 'Railway',
                  desc: 'Python FastAPI handles all data aggregation, score computation, and API routing. Redis caches computed scores to keep response times fast even under concurrent load.',
                  pills: ['Python', 'FastAPI', 'Redis', 'yfinance', 'pytrends'],
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
          </section>

          {/* PERFORMANCE */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal delay={0.1}>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Performance</div>
              <div className="grid md:grid-cols-3 gap-px bg-[#dee1e6] border border-[#dee1e6] rounded-xl overflow-hidden">
                {[
                  { label: 'Cache TTL', val: '15m', desc: 'Score data is cached in Redis for 15 minutes. Subsequent requests for the same ticker are served instantly without hitting upstream APIs.' },
                  { label: 'Cached tickers', val: 'Top 20', desc: 'The 20 most-searched tickers are pre-warmed on startup so the first visitor never waits on a cold cache for high-traffic stocks.' },
                  { label: 'Data sources', val: '7', desc: 'All 7 sources are fetched in parallel and aggregated server-side. A single API call from the frontend returns the full scored dataset.' },
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

          {/* AI NARRATIVE LAYER */}
          <section className="py-16">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">AI narrative layer</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef0f3]">
                  <div className="text-[11px] text-[#7c828a] uppercase tracking-[0.05em] font-semibold">GPT-4o-mini · Pro feature</div>
                  <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2.5 py-0.5 rounded-full">Pro</span>
                </div>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-6 md:border-r border-[#eef0f3]">
                    <div className="text-base font-semibold text-[#0a0b0d] mb-3">From numbers to narrative</div>
                    <p className="text-xs text-[#5b616e] leading-relaxed mb-3">
                      Pro subscribers get an AI-generated analysis built on top of the scored data — not
                      generic commentary, but a structured read of the specific signals driving the current
                      score.
                    </p>
                    <p className="text-xs text-[#5b616e] leading-relaxed mb-4">
                      The model receives the full scored dataset as context and produces four structured
                      outputs, each grounded in the underlying data.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Summary', 'Bull case', 'Bear case', 'What to watch'].map(tab => (
                        <span key={tab} className="text-[10px] font-semibold bg-[#f7f7f7] border border-[#dee1e6] px-3 py-1 rounded-full text-[#5b616e]">{tab}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a] mb-3">Example output — Bear case</div>
                    <p className="text-xs text-[#5b616e] leading-relaxed">
                      RSI at <strong className="font-mono font-medium text-[#0a0b0d]">71.4</strong> suggests the stock is technically overbought — historically
                      a precursor to mean reversion when momentum stalls. The <strong className="text-[#0a0b0d]">put/call ratio</strong> has
                      quietly risen over the past week, indicating options traders are hedging against downside.
                      Meanwhile, insider MSPR at <strong className="font-mono font-medium text-[#0a0b0d]">0.18</strong> reflects net selling pressure from people
                      with the most information. None of these signals are individually decisive, but their
                      convergence warrants caution at current levels.
                    </p>
                  </div>
                </div>
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
          <Link href="/contact" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Contact</Link>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a]">© 2026 · Not financial advice.</div>
      </footer>
    </div>
  );
}
