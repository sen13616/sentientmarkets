import Link from 'next/link';

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
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 py-6 backdrop-blur-md border-b bg-[#0A0A0B]/95 border-white/10">
        <Link href="/" className="font-serif italic text-2xl font-bold tracking-tight text-white">
          SentientMarkets.
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide opacity-70 hover:opacity-100"
            >
              {label}
            </Link>
          ))}
        </div>
        <button className="bg-white hover:bg-[#E4E4E7] text-black px-6 py-2 rounded-md text-xs font-bold transition-all active:scale-95">
          Get Pro
        </button>
      </nav>

      <div className="max-w-[1080px] mx-auto px-6 md:px-8 pb-24">

        {/* HERO */}
        <section className="py-20 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] inline-block" />
            Technology
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Built on <em className="not-italic text-[var(--blue)]">real signals,</em><br />not black boxes.
          </h1>
          <p className="text-[#A1A1AA] text-base max-w-xl leading-relaxed">
            Every number on SentientMarkets comes from a documented source. Here&apos;s exactly how the
            score is calculated, where the data comes from, and how we serve it fast.
          </p>
        </section>

        {/* DATA SOURCES */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Data sources</div>
          <div className="border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[140px_1fr_140px] gap-4 px-5 py-3 bg-white/[0.03] border-b border-white/[0.07] text-[10px] uppercase tracking-[1.2px] text-[#71717A] font-bold">
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
                className={`grid grid-cols-[140px_1fr_140px] gap-4 px-5 py-4 items-start ${i < arr.length - 1 ? 'border-b border-white/[0.07]' : ''}`}
              >
                <div className="text-sm font-bold text-white">{name}</div>
                <div className="text-xs text-[#A1A1AA] leading-relaxed">{desc}</div>
                <div className="flex flex-wrap gap-1">
                  {signals.map(s => (
                    <span key={s} className="text-[10px] bg-white/5 border border-white/[0.07] px-2 py-0.5 rounded text-[#71717A]">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SCORE CALCULATION */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Score calculation</div>
          <div className="bg-[#111112] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.07]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
              <div className="text-xs text-[#A1A1AA] uppercase tracking-[1.2px] font-bold">MarketMood Score — weighted composition</div>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              {[
                { label: 'Technical', pct: 35, colorBar: 'bg-[var(--blue)]', colorText: 'text-[var(--blue)]' },
                { label: 'Fundamental', pct: 25, colorBar: 'bg-[var(--amber)]', colorText: 'text-[var(--amber)]' },
                { label: 'Sentiment', pct: 40, colorBar: 'bg-[var(--green)]', colorText: 'text-[var(--green)]' },
              ].map(({ label, pct, colorBar, colorText }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className={`w-24 text-xs font-bold ${colorText}`}>{label}</div>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full ${colorBar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`w-10 text-right text-xs font-bold tabular-nums ${colorText}`}>{pct}%</div>
                </div>
              ))}
              <div className="border-t border-white/[0.07] pt-4 text-xs text-[#A1A1AA] leading-relaxed">
                Each pillar is scored 0–100 independently before weighting. The final MarketMood Score is a
                weighted average clamped to 0–100.{' '}
                <strong className="text-white">Scores ≥65 = Bullish · 45–64 = Neutral · ≤44 = Bearish.</strong>{' '}
                Weights are calibrated to reflect the relative predictive value of each signal category —
                sentiment is weighted highest as it captures forward-looking crowd and institutional behaviour.
              </div>
            </div>
          </div>
        </section>

        {/* INFRASTRUCTURE */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Infrastructure</div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                pip: 'bg-[var(--blue)]',
                name: 'Frontend',
                tag: 'Vercel',
                tagColor: 'text-[var(--blue)] border-[var(--blue)]/20 bg-[var(--blue)]/5',
                desc: "Built on Next.js 14 App Router with Tailwind CSS for styling. Chart.js powers all data visualisations. Deployed to Vercel's edge network for global low-latency delivery.",
                pills: ['Next.js 14', 'App Router', 'Tailwind CSS', 'Chart.js', 'TypeScript'],
              },
              {
                pip: 'bg-[var(--green)]',
                name: 'Backend',
                tag: 'Railway',
                tagColor: 'text-[var(--green)] border-[var(--green)]/20 bg-[var(--green)]/5',
                desc: 'Python FastAPI handles all data aggregation, score computation, and API routing. Redis caches computed scores to keep response times fast even under concurrent load.',
                pills: ['Python', 'FastAPI', 'Redis', 'yfinance', 'pytrends'],
              },
            ].map(({ pip, name, tag, tagColor, desc, pills }) => (
              <div key={name} className="bg-[#111112] border border-white/[0.07] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pip}`} />
                    <div className="text-sm font-bold text-white">{name}</div>
                  </div>
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${tagColor}`}>{tag}</span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pills.map(p => (
                    <span key={p} className="text-[10px] bg-white/5 border border-white/[0.07] px-2 py-0.5 rounded text-[#71717A]">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PERFORMANCE */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Performance</div>
          <div className="grid md:grid-cols-3 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
            {[
              { label: 'Cache TTL', val: '15m', valColor: 'text-[var(--green)]', desc: 'Score data is cached in Redis for 15 minutes. Subsequent requests for the same ticker are served instantly without hitting upstream APIs.' },
              { label: 'Cached tickers', val: 'Top 20', valColor: 'text-[var(--blue)]', desc: 'The 20 most-searched tickers are pre-warmed on startup so the first visitor never waits on a cold cache for high-traffic stocks.' },
              { label: 'Data sources', val: '7', valColor: 'text-[var(--amber)]', desc: 'All 7 sources are fetched in parallel and aggregated server-side. A single API call from the frontend returns the full scored dataset.' },
            ].map(({ label, val, valColor, desc }) => (
              <div key={label} className="bg-[#0A0A0B] p-6 flex flex-col gap-3">
                <div className="text-[10px] uppercase tracking-[1.2px] text-[#A1A1AA]">{label}</div>
                <div className={`text-3xl font-bold ${valColor}`}>{val}</div>
                <div className="text-xs text-[#71717A] leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AI NARRATIVE LAYER */}
        <section className="py-16">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">AI narrative layer</div>
          <div className="bg-[#111112] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
                <div className="text-xs text-[#A1A1AA] uppercase tracking-[1.2px] font-bold">GPT-4o-mini · Pro feature</div>
              </div>
              <span className="text-[10px] font-bold text-[var(--amber)] border border-[var(--amber)]/20 bg-[var(--amber)]/5 px-2 py-0.5 rounded">Pro</span>
            </div>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-6 border-r border-white/[0.07]">
                <div className="text-base font-bold text-white mb-3">From numbers to narrative</div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                  Pro subscribers get an AI-generated analysis built on top of the scored data — not
                  generic commentary, but a structured read of the specific signals driving the current
                  score.
                </p>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                  The model receives the full scored dataset as context and produces four structured
                  outputs, each grounded in the underlying data.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Summary', 'Bull case', 'Bear case', 'What to watch'].map(tab => (
                    <span key={tab} className="text-[10px] border border-white/[0.07] bg-white/[0.03] px-3 py-1 rounded-md text-[#A1A1AA]">{tab}</span>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="text-[10px] uppercase tracking-[1.2px] text-[#A1A1AA] mb-3">Example output — Bear case</div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  RSI at <strong className="text-white">71.4</strong> suggests the stock is technically overbought — historically
                  a precursor to mean reversion when momentum stalls. The <strong className="text-white">put/call ratio</strong> has
                  quietly risen over the past week, indicating options traders are hedging against downside.
                  Meanwhile, insider MSPR at <strong className="text-white">0.18</strong> reflects net selling pressure from people
                  with the most information. None of these signals are individually decisive, but their
                  convergence warrants caution at current levels.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <footer className="border-t border-white/[0.07] py-8 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
        <div className="font-serif italic text-white font-bold text-lg">SentientMarkets.</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div>© 2026 · Not financial advice.</div>
      </footer>
    </>
  );
}
