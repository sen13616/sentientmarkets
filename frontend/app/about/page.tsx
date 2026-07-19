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
              Built for traders who<br />deserve <em className="not-italic text-[#0a0b0d]">better data.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              Hedge funds have always had access to aggregated sentiment signals. SentientMarkets closes
              that gap — giving every retail trader institutional-grade intelligence at a fraction of the cost.
            </p>
          </section>

          {/* MISSION */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Our mission</div>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="text-2xl md:text-3xl font-normal text-[#5b616e] leading-snug tracking-[-0.4px]">
                  The <em className="not-italic text-[#0a0b0d]">information gap</em> between retail and institutional traders is the problem we&apos;re solving.
                </div>
                <div className="text-[#5b616e] text-sm leading-relaxed space-y-4">
                  <p>Professional trading desks spend thousands per month on sentiment terminals, options flow data, and social intelligence platforms. That information advantage compounds over time — and retail traders are left making decisions with incomplete signals.</p>
                  <p>SentientMarkets aggregates technical indicators, crowd sentiment, news flow, insider activity, and macro context into a single MarketMood Score. One number. Full picture.</p>
                  <p>We built this because we believe access to quality data shouldn&apos;t be a function of your net worth.</p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* STATS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal delay={0.1}>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">By the numbers</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#dee1e6] border border-[#dee1e6] rounded-xl overflow-hidden">
                {[
                  { label: 'Data sources', val: '7', desc: 'Aggregated into every score' },
                  { label: 'Score range', val: '0–100', desc: 'Bearish to Bullish, calibrated' },
                  { label: 'Update frequency', val: 'Live', desc: 'Redis-cached, sub-second serve' },
                  { label: 'Pro price', val: '$12', desc: 'Per month — cancel anytime' },
                ].map(({ label, val, desc }) => (
                  <div key={label} className="bg-white p-6 flex flex-col gap-2">
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
                  <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#7c828a]">MarketMood Score — example</div>
                  <div className="text-lg font-semibold text-[#0a0b0d]">One score, three sentiment pillars</div>
                  <div className="h-1.5 bg-[#eef0f3] rounded-full relative">
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#05b169] border-2 border-white" style={{ left: '72%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7c828a] uppercase tracking-[0.05em] font-semibold">
                    <span>Bearish</span><span>Neutral</span><span>Bullish</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { range: '0 – 44', label: 'Bearish', color: 'text-[#cf202f] border-[rgba(207,32,47,0.2)] bg-[rgba(207,32,47,0.06)]' },
                      { range: '45 – 64', label: 'Neutral', color: 'text-[#7c828a] border-[#dee1e6] bg-[#f7f7f7]' },
                      { range: '65 – 100', label: 'Bullish', color: 'text-[#05b169] border-[rgba(5,177,105,0.2)] bg-[rgba(5,177,105,0.06)]' },
                    ].map(({ range, label, color }) => (
                      <div key={label} className={`border rounded-lg p-3 text-center ${color}`}>
                        <div className="text-[10px] font-mono">{range}</div>
                        <div className="text-xs font-semibold mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* SIGNAL PILLARS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Signal pillars</div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Technical',
                  desc: 'Price action, momentum, and moving average signals derived from market data. Cuts through noise to show where a stock actually sits in its trend.',
                  sources: [
                    { name: 'RSI (14-day)', tag: 'yfinance' },
                    { name: 'Moving averages', tag: 'yfinance' },
                    { name: '52-week range', tag: 'yfinance' },
                    { name: 'Volume analysis', tag: 'Alpha Vantage' },
                  ],
                },
                {
                  name: 'Fundamental',
                  desc: 'Analyst consensus, price targets, and earnings data. Reflects what the professional research community thinks — and how reality compares to their expectations.',
                  sources: [
                    { name: 'Analyst ratings', tag: 'yfinance' },
                    { name: 'Price targets', tag: 'yfinance' },
                    { name: 'Earnings surprises', tag: 'Finnhub' },
                    { name: 'Key metrics', tag: 'yfinance' },
                  ],
                },
                {
                  name: 'Sentiment',
                  desc: 'The signal hedge funds pay most for — crowd psychology, social buzz, insider behaviour, and macro fear. Aggregated from sources retail tools typically ignore.',
                  sources: [
                    { name: 'News sentiment', tag: 'Alpha Vantage' },
                    { name: 'Reddit mentions', tag: 'ApeWisdom' },
                    { name: 'Insider activity', tag: 'Finnhub' },
                    { name: 'Fear & Greed', tag: 'CNN' },
                  ],
                },
              ].map(({ name, desc, sources }, i) => (
                <Reveal key={name} delay={i * 0.08} className="h-full">
                  <div className="bg-white border border-[#dee1e6] rounded-xl p-6 flex flex-col gap-4 h-full">
                    <div className="text-sm font-semibold text-[#0a0b0d]">{name}</div>
                    <p className="text-xs text-[#5b616e] leading-relaxed">{desc}</p>
                    <div className="border-t border-[#eef0f3] pt-4 flex flex-col gap-2 mt-auto">
                      {sources.map(({ name: sName, tag }) => (
                        <div key={sName} className="flex justify-between items-center">
                          <span className="text-xs text-[#5b616e]">{sName}</span>
                          <span className="text-[10px] font-mono bg-[#eef0f3] px-2 py-0.5 rounded-[5px] text-[#7c828a]">{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* WHO IT'S FOR */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Who it&apos;s for</div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Active retail traders',
                  desc: "You're making your own calls but want more signal. SentientMarkets gives you the same multi-source sentiment picture that professional desks have — without the $500/month data terminal.",
                },
                {
                  title: 'Long-term investors',
                  desc: "You're not day trading, but you want to know whether sentiment is with or against your positions. Our scores give you a fast sanity check before you size up or trim.",
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
                Read the market&apos;s <em className="not-italic text-[#0a0b0d]">mood</em><br />in seconds.
              </h2>
              <p className="text-[#7c828a] text-sm mb-8">Search any US-listed ticker. Free to try — no account required.</p>
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
          <Link href="/contact" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Contact</Link>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a]">© 2026 · Not financial advice.</div>
      </footer>
    </div>
  );
}
