import Link from 'next/link';

export const metadata = {
  title: 'About — SentientMarkets',
};

const NAV_LINKS: [string, string][] = [
  ['/', 'Markets'],
  ['/about', 'About'],
  ['/technology', 'Technology'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
];

export default function AboutPage() {
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
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] inline-block" />
            About
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Built for traders who<br />deserve <em className="not-italic text-[var(--green)]">better data.</em>
          </h1>
          <p className="text-[#A1A1AA] text-base max-w-xl leading-relaxed">
            Hedge funds have always had access to aggregated sentiment signals. SentientMarkets closes
            that gap — giving every retail trader institutional-grade intelligence at a fraction of the cost.
          </p>
        </section>

        {/* MISSION */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Our mission</div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-2xl md:text-3xl font-bold text-white leading-snug">
              The <em className="not-italic text-[var(--amber)]">information gap</em> between retail and institutional traders is the problem we&apos;re solving.
            </div>
            <div className="text-[#A1A1AA] text-sm leading-relaxed space-y-4">
              <p>Professional trading desks spend thousands per month on sentiment terminals, options flow data, and social intelligence platforms. That information advantage compounds over time — and retail traders are left making decisions with incomplete signals.</p>
              <p>SentientMarkets aggregates technical indicators, crowd sentiment, news flow, insider activity, and macro context into a single MarketMood Score. One number. Full picture.</p>
              <p>We built this because we believe access to quality data shouldn&apos;t be a function of your net worth.</p>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">By the numbers</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
            {[
              { label: 'Data sources', val: '7', valColor: 'text-[var(--green)]', desc: 'Aggregated into every score' },
              { label: 'Score range', val: '0–100', valColor: 'text-white', desc: 'Bearish to Bullish, calibrated' },
              { label: 'Update frequency', val: 'Live', valColor: 'text-[var(--blue)]', desc: 'Redis-cached, sub-second serve' },
              { label: 'Pro price', val: '$12', valColor: 'text-[var(--amber)]', desc: 'Per month — cancel anytime' },
            ].map(({ label, val, valColor, desc }) => (
              <div key={label} className="bg-[#0A0A0B] p-6 flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-[1.2px] text-[#A1A1AA]">{label}</div>
                <div className={`text-3xl font-bold ${valColor}`}>{val}</div>
                <div className="text-xs text-[#71717A]">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SCORE EXPLAINER */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">How the score works</div>
          <div className="flex flex-col md:flex-row gap-8 bg-[#111112] border border-white/[0.07] rounded-xl p-8">
            <div className="text-7xl font-bold text-white tabular-nums shrink-0">72</div>
            <div className="flex flex-col gap-4 flex-1">
              <div className="text-[10px] uppercase tracking-[1.2px] text-[#A1A1AA]">MarketMood Score — example</div>
              <div className="text-lg font-bold text-white">One score, three sentiment pillars</div>
              <div className="h-2 bg-gradient-to-r from-[var(--red)] via-[var(--amber)] to-[var(--green)] rounded-full relative">
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#111112]" style={{ left: '72%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#A1A1AA] uppercase tracking-wide">
                <span>Bearish</span><span>Neutral</span><span>Bullish</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { range: '0 – 44', label: 'Bearish', color: 'text-[var(--red)] border-[var(--red)]/20 bg-[var(--red)]/5' },
                  { range: '45 – 64', label: 'Neutral', color: 'text-[var(--amber)] border-[var(--amber)]/20 bg-[var(--amber)]/5' },
                  { range: '65 – 100', label: 'Bullish', color: 'text-[var(--green)] border-[var(--green)]/20 bg-[var(--green)]/5' },
                ].map(({ range, label, color }) => (
                  <div key={label} className={`border rounded-lg p-3 text-center ${color}`}>
                    <div className="text-[10px] font-mono">{range}</div>
                    <div className="text-xs font-bold mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SIGNAL PILLARS */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Signal pillars</div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                pip: 'bg-[var(--blue)]',
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
                pip: 'bg-[var(--amber)]',
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
                pip: 'bg-[var(--green)]',
                name: 'Sentiment',
                desc: 'The signal hedge funds pay most for — crowd psychology, social buzz, insider behaviour, and macro fear. Aggregated from sources retail tools typically ignore.',
                sources: [
                  { name: 'News sentiment', tag: 'Alpha Vantage' },
                  { name: 'Reddit mentions', tag: 'ApeWisdom' },
                  { name: 'Insider activity', tag: 'Finnhub' },
                  { name: 'Fear & Greed', tag: 'CNN' },
                ],
              },
            ].map(({ pip, name, desc, sources }) => (
              <div key={name} className="bg-[#111112] border border-white/[0.07] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pip}`} />
                  <div className="text-sm font-bold text-white">{name}</div>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{desc}</p>
                <div className="border-t border-white/[0.07] pt-4 flex flex-col gap-2">
                  {sources.map(({ name: sName, tag }) => (
                    <div key={sName} className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">{sName}</span>
                      <span className="text-[10px] bg-white/5 border border-white/[0.07] px-2 py-0.5 rounded text-[#71717A]">{tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Who it&apos;s for</div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                iconColor: 'border-[var(--green)]/20 bg-[var(--green)]/5',
                title: 'Active retail traders',
                desc: "You're making your own calls but want more signal. SentientMarkets gives you the same multi-source sentiment picture that professional desks have — without the $500/month data terminal.",
              },
              {
                iconColor: 'border-[var(--blue)]/20 bg-[var(--blue)]/5',
                title: 'Long-term investors',
                desc: "You're not day trading, but you want to know whether sentiment is with or against your positions. Our scores give you a fast sanity check before you size up or trim.",
              },
            ].map(({ iconColor, title, desc }) => (
              <div key={title} className="bg-[#111112] border border-white/[0.07] rounded-xl p-6">
                <div className={`w-8 h-8 rounded-lg border ${iconColor} mb-4`} />
                <div className="text-sm font-bold text-white mb-2">{title}</div>
                <div className="text-xs text-[#A1A1AA] leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-4">Get started</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Read the market&apos;s <em className="not-italic text-[var(--green)]">mood</em><br />in seconds.
          </h2>
          <p className="text-[#A1A1AA] text-sm mb-8">Search any US-listed ticker. Free to try — no account required.</p>
          <Link href="/" className="inline-block bg-white text-black px-8 py-3 rounded-md text-sm font-bold hover:bg-[#E4E4E7] transition-all active:scale-95">
            Analyse a stock →
          </Link>
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
