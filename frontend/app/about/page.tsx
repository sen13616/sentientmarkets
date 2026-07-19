import Link from 'next/link';
import styles from '../page.module.css';
import Nav from '../components/Nav';
import Reveal from '../components/Reveal';

export const metadata = {
  title: 'About — SentientMarkets',
};

export default function AboutPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[1200px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the homepage hero */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              About
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              Not another system.<br />An edge for <em className="not-italic text-[#0a0b0d]">yours.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              SentientMarkets isn&apos;t here to replace your charts, your screener, or your strategy.
              It&apos;s one clean sentiment read — four channels distilled into a single number, refreshed
              every 30 minutes — that you layer on top of the system you already trust.
            </p>
          </section>

          {/* MISSION */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Why we built it</div>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="text-2xl md:text-3xl font-normal text-[#5b616e] leading-snug tracking-[-0.4px]">
                  The best tool is the one that fits the <em className="not-italic text-[#0a0b0d]">process you already have.</em>
                </div>
                <div className="text-[#5b616e] text-sm leading-relaxed space-y-4">
                  <p>Most platforms want to become your whole workflow. But traders already have one — the charts they read, the screeners they run, the rules they size by. What&apos;s genuinely hard to do on your own is reading sentiment: thousands of price ticks, headlines, filings, and macro prints, every day, for every name you follow.</p>
                  <p>So we do that one job, properly. A continuously running pipeline ingests price action, financial news, insider and analyst activity, and macroeconomic data for all 502 stocks in the S&amp;P 500 — then normalizes, weighs, and blends them into a single 0–100 score with a confidence value, refreshed every 30 minutes around the clock.</p>
                  <p>You overlay it on your own analysis: confirmation when sentiment agrees with your setup, a flag worth investigating when it doesn&apos;t. The full methodology is documented on the <Link href="/technology" className="text-[#0052ff] hover:underline">Technology page</Link> — no black boxes.</p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* STATS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal delay={0.1}>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">By the numbers</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#dee1e6] border border-[#dee1e6] rounded-xl overflow-hidden">
                {([
                  { label: 'Sentiment channels', val: '4', desc: 'Market · Narrative · Influencer · Macro' },
                  { label: 'Coverage', val: '502', desc: 'Every stock in the S&P 500' },
                  { label: 'Refresh cycle', val: '30m', desc: 'Recomputed around the clock' },
                  { label: 'Pro price', val: '$12.99', desc: 'Per month — cancel anytime', blur: true },
                ] as { label: string; val: string; desc: string; blur?: boolean }[]).map(({ label, val, desc, blur }) => (
                  <div key={label} className={`bg-white p-6 flex flex-col gap-2 ${blur ? 'pro-blur' : ''}`} aria-hidden={blur || undefined}>
                    <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a]">{label}</div>
                    <div className="text-3xl font-mono font-medium text-[#0a0b0d]">{val}</div>
                    <div className="text-xs text-[#a8acb3]">{desc}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* SCORE EXPLAINER */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">How the score works</div>
              <div className="flex flex-col md:flex-row gap-8 bg-white border border-[#dee1e6] rounded-xl p-8">
                <div className="text-5xl md:text-7xl font-mono font-medium text-[#05b169] tabular-nums shrink-0">72</div>
                <div className="flex flex-col gap-4 flex-1">
                  <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a]">Sentiment score — example</div>
                  <div className="text-lg font-semibold text-[#0a0b0d]">One score, four channels — and a confidence value</div>
                  <div className="h-1.5 bg-[#eef0f3] rounded-full relative">
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#05b169] border-2 border-white" style={{ left: '72%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7c828a] uppercase tracking-[0.05em] font-semibold">
                    <span>Bearish</span><span>Neutral</span><span>Bullish</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                    {[
                      { range: '0 – 20', label: 'Strongly Bearish', color: 'text-[#cf202f] border-[rgba(207,32,47,0.25)] bg-[rgba(207,32,47,0.08)]' },
                      { range: '21 – 40', label: 'Bearish', color: 'text-[#cf202f] border-[rgba(207,32,47,0.15)] bg-[rgba(207,32,47,0.04)]' },
                      { range: '41 – 60', label: 'Neutral', color: 'text-[#7c828a] border-[#dee1e6] bg-[#f7f7f7]' },
                      { range: '61 – 80', label: 'Bullish', color: 'text-[#05b169] border-[rgba(5,177,105,0.15)] bg-[rgba(5,177,105,0.04)]' },
                      { range: '81 – 100', label: 'Strongly Bullish', color: 'text-[#05b169] border-[rgba(5,177,105,0.25)] bg-[rgba(5,177,105,0.08)]' },
                    ].map(({ range, label, color }) => (
                      <div key={label} className={`border rounded-lg p-3 text-center ${color}`}>
                        <div className="text-[10px] font-mono">{range}</div>
                        <div className="text-xs font-semibold mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#5b616e] leading-relaxed">
                    Every score also carries a <strong className="text-[#0a0b0d]">confidence</strong> value (0–100) that drops when data
                    is stale, a channel is missing, or channels sharply disagree — so you always know how much
                    weight the number deserves in your own process.
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* THE FOUR CHANNELS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">The four channels</div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  name: 'Market',
                  weight: '35%',
                  desc: 'What the price action itself is saying — returns, intraday order flow, momentum, short volume, liquidity, and volume, each mapped to a bullish–bearish scale.',
                  sources: [
                    { name: 'Price, volume & order flow', tag: 'Yahoo / Polygon' },
                    { name: 'Daily short-volume files', tag: 'FINRA' },
                  ],
                },
                {
                  name: 'Narrative',
                  weight: '30%',
                  desc: 'Financial news scored by FinBERT, a transformer fine-tuned on financial text — with relevance filtering and event deduplication so ten outlets covering one story count once.',
                  sources: [
                    { name: 'Financial news (primary)', tag: 'Alpha Vantage' },
                    { name: 'News fallback', tag: 'Finnhub' },
                  ],
                },
                {
                  name: 'Influencer',
                  weight: '25%',
                  desc: 'Not social chatter — the people with real skin in the game. Insider transactions carry the highest weight and the longest memory; analyst consensus, price targets, and estimate revisions follow.',
                  sources: [
                    { name: 'Insider transactions', tag: 'Finnhub' },
                    { name: 'Analyst consensus & targets', tag: 'Finnhub' },
                  ],
                },
                {
                  name: 'Macro',
                  weight: '10%',
                  desc: 'The backdrop every ticker trades against — each stock’s own sector-ETF momentum, the VIX, Treasury yields, and the yield-curve slope.',
                  sources: [
                    { name: 'Treasury yields & curve', tag: 'FRED' },
                    { name: 'VIX', tag: 'CBOE' },
                  ],
                },
              ].map(({ name, weight, desc, sources }, i) => (
                <Reveal key={name} delay={i * 0.08} className="h-full">
                  <div className="bg-white border border-[#dee1e6] rounded-xl p-6 flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[#0a0b0d]">{name}</div>
                      <span className="text-[10px] font-semibold bg-[#eef0f3] text-[#7c828a] px-2 py-0.5 rounded-[5px]">{weight}</span>
                    </div>
                    <p className="text-xs text-[#5b616e] leading-relaxed">{desc}</p>
                    <div className="border-t border-[#eef0f3] pt-4 flex flex-col gap-2 mt-auto">
                      {sources.map(({ name: sName, tag }) => (
                        <div key={sName} className="flex justify-between items-center gap-2">
                          <span className="text-xs text-[#5b616e]">{sName}</span>
                          <span className="text-[10px] font-mono bg-[#eef0f3] px-2 py-0.5 rounded-[5px] text-[#7c828a] shrink-0">{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* WHAT IT IS / ISN'T */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">On top of your system — not instead of it</div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              <Reveal className="h-full">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                  <div className="text-sm font-semibold text-[#0a0b0d] mb-4">What it is</div>
                  <ul className="flex flex-col gap-3">
                    {[
                      'An additional input for the process you already run',
                      'A measurement of current signal alignment across four channels',
                      'A documented methodology — every weight and threshold is public',
                      'The same number for every name, refreshed every 30 minutes, day and night',
                    ].map(item => (
                      <li key={item} className="flex gap-2.5 text-xs text-[#5b616e] leading-relaxed">
                        <span className="text-[#05b169] font-bold shrink-0">+</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={0.08} className="h-full">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                  <div className="text-sm font-semibold text-[#0a0b0d] mb-4">What it isn&apos;t</div>
                  <ul className="flex flex-col gap-3">
                    {[
                      'A buy/sell signal service — the decisions stay yours',
                      'A price prediction',
                      'A replacement for your own analysis or risk management',
                      'A tick-level feed — sentiment moves in hours, not milliseconds',
                    ].map(item => (
                      <li key={item} className="flex gap-2.5 text-xs text-[#5b616e] leading-relaxed">
                        <span className="text-[#cf202f] font-bold shrink-0">−</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </section>

          {/* WHO IT'S FOR */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">How traders layer it in</div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Discretionary chart traders',
                  desc: 'You already have your setups. Use the score as a confirmation layer — sentiment agreeing with your read adds conviction; sentiment diverging is a reason to look twice before entering.',
                },
                {
                  title: 'Rules-based traders',
                  desc: 'Treat the score and its confidence value as one more input alongside your indicators — a regime filter, a screen condition, or a tiebreaker your rules can reference.',
                },
                {
                  title: 'Long-term investors',
                  desc: "You're not trading the 30-minute cycle — but before you size up or trim, a fast check of whether sentiment is with or against your position is a cheap sanity test.",
                },
              ].map(({ title, desc }, i) => (
                <Reveal key={title} delay={i * 0.08} className="h-full">
                  <div className="bg-white border border-[#dee1e6] rounded-xl p-6 h-full">
                    <div className="w-8 h-8 rounded-lg bg-[#eef0f3] mb-4" />
                    <div className="text-sm font-semibold text-[#0a0b0d] mb-2">{title}</div>
                    <div className="text-xs text-[#5b616e] leading-relaxed">{desc}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 text-center">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-4">Get started</div>
              <h2 className="text-3xl md:text-4xl font-normal text-[#5b616e] tracking-[-0.4px] mb-4">
                Add one more signal<br />to <em className="not-italic text-[#0a0b0d]">your process.</em>
              </h2>
              <p className="text-[#7c828a] text-sm mb-8">Search any S&amp;P 500 ticker. Free to try — no account required.</p>
              <Link href="/" className="inline-block bg-[#0052ff] hover:bg-[#003ecc] text-white px-7 py-3 rounded-full text-sm font-semibold transition-all active:scale-95">
                Analyse a stock →
              </Link>
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
