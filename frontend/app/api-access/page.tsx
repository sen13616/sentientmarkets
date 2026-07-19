import Link from 'next/link';
import styles from '../page.module.css';
import Nav from '../components/Nav';
import Reveal from '../components/Reveal';

export const metadata = {
  title: 'API Access — SentientMarkets',
};

const TIER_ROWS: { feature: string; free: boolean; pro: boolean }[] = [
  { feature: 'Composite score (0–100), label, confidence', free: true, pro: true },
  { feature: '1-day score change (points and %)', free: true, pro: true },
  { feature: 'Market-hours info in every response', free: true, pro: true },
  { feature: 'Supported tickers list (/v1/tickers)', free: true, pro: true },
  { feature: 'API status (/v1/status)', free: true, pro: true },
  { feature: 'Sub-indices (market / narrative / influencer / macro)', free: false, pro: true },
  { feature: 'Top drivers — the ranked signals behind the score', free: false, pro: true },
  { feature: 'Written explanation of each score', free: false, pro: true },
  { feature: 'Raw (unsmoothed) score + universe percentile', free: false, pro: true },
  { feature: 'Divergence flag + per-layer freshness timestamps', free: false, pro: true },
  { feature: 'Score history — up to 365 days (/history)', free: false, pro: true },
  { feature: 'Whole-market overview (/v1/market/overview)', free: false, pro: true },
];

const ENDPOINTS: { path: string; tier: string; title: string; desc: string }[] = [
  {
    path: 'GET /v1/sentiment/{ticker}',
    tier: 'Free + Pro',
    title: 'The core endpoint',
    desc: 'The latest sentiment score for any supported ticker — score, label, 1-day change, confidence, and market-hours info. Pro adds ?detail=full: the four sub-indices, ranked top drivers, a written explanation, the raw unsmoothed score, universe percentile, divergence flag, and per-layer freshness.',
  },
  {
    path: 'GET /v1/sentiment/{ticker}/history',
    tier: 'Pro',
    title: 'Score history',
    desc: 'Up to 365 days of historical scores per ticker, with sub-indices in every record. Selectable granularity — daily, hourly, or raw (every scoring cycle). The endpoint for charting sentiment over time and backtesting sentiment against price.',
  },
  {
    path: 'GET /v1/tickers',
    tier: 'Free + Pro',
    title: 'The supported universe',
    desc: 'All 502 supported tickers (S&P 500 coverage) with company name and GICS sector. Useful for building pickers and screeners, and for validating input.',
  },
  {
    path: 'GET /v1/market/overview',
    tier: 'Pro',
    title: 'The whole market at a glance',
    desc: 'One call, the entire universe summarized for the latest scoring pass: average score and breadth stats, top and bottom movers by 1-day change, per-sector averages with within-sector rankings, and a generated plain-English market narrative ready to display verbatim.',
  },
  {
    path: 'GET /v1/status',
    tier: 'Free + Pro',
    title: 'Pipeline transparency',
    desc: 'Operational status plus the last-run timestamp of every data pipeline — market, news, insider/analyst, macro, and scoring. Verify for yourself how fresh the data is; nothing hidden.',
  },
  {
    path: 'GET /health',
    tier: 'No key required',
    title: 'Liveness',
    desc: 'Simple {"status": "ok"} for uptime monitors.',
  },
];

const FREE_RESPONSE = `{
  "ticker": "AAPL",
  "score": 72,
  "score_change_1d": 3.25,
  "score_change_1d_pct": 4.73,
  "label": "Bullish",
  "confidence": 81,
  "timestamp": "2026-04-24T14:32:00Z",
  "cache_age_seconds": 480,
  "market_hours": {
    "is_open": true,
    "next_open": "2026-04-27T14:30:00Z",
    "last_close": "2026-04-24T21:00:00Z"
  }
}`;

export default function ApiAccessPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[1200px] pb-24">

          {/* HERO */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`flex items-center gap-3 mb-6 ${styles.heroFade0}`}>
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a]">
                API Access
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] bg-[#0052ff] text-white px-2.5 py-1 rounded-full">
                Coming soon
              </span>
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              Our sentiment data.<br /><em className="not-italic text-[#0a0b0d]">Your API key.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] mb-8 ${styles.heroFade2}`}>
              The same real-time sentiment engine that powers this site is becoming available as a
              developer API. Every stock in the S&amp;P 500 (502 tickers), scored 0–100 every
              15 minutes during market hours, delivered as clean JSON — for your dashboards, trading
              research, screeners, and apps.
            </p>
            <div className={styles.heroFade2}>
              <a
                href="mailto:aayudh.sen@gmail.com?subject=Notify%20me%20when%20API%20keys%20open%20up"
                className="inline-block bg-[#0052ff] hover:bg-[#003ecc] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all active:scale-95"
              >
                Get notified when keys open up →
              </a>
            </div>
          </section>

          {/* HOW IT WORKS + TERMINAL */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">How it works</div>
            </Reveal>
            {/* min-w-0 on the columns: grid items default to min-width auto,
                so the terminal's unwrappable curl line would otherwise force
                both columns wider than a phone viewport. */}
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <Reveal className="min-w-0">
                <ol className="flex flex-col gap-5">
                  {[
                    ['Get your key', 'Every user receives a personal API key (format: sk-sm-…). It’s shown once at creation — we store only a hash.'],
                    ['Call the API', 'One HTTPS request with your key in the Authorization header. That’s the whole integration.'],
                    ['Get JSON back', 'Pre-computed scores served from cache — responses are fast and never trigger heavy computation. Typical response time is a few hundred milliseconds, dominated by network distance, not processing.'],
                  ].map(([step, desc], i) => (
                    <li key={step} className="flex gap-3.5">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-[#eef0f3] text-[#0a0b0d] text-[11px] font-mono font-medium flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="text-sm text-[#5b616e] leading-relaxed">
                        <strong className="text-[#0a0b0d]">{step}</strong> — {desc}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-[#5b616e] leading-relaxed mt-6 pt-5 border-t border-[#eef0f3]">
                  Scores are recomputed by the background pipeline every 15 minutes during US market
                  hours (every 30 minutes off-hours) — the API always serves the latest completed
                  scoring pass. There is no on-demand recompute; every caller sees the same
                  consistent, timestamped score, and every response includes{' '}
                  <code className="font-mono text-[11px] bg-[#eef0f3] px-1.5 py-0.5 rounded text-[#0a0b0d]">cache_age_seconds</code>{' '}
                  so you always know how fresh it is.
                </p>
              </Reveal>

              <Reveal delay={0.08} className="min-w-0">
                <div className="bg-[#0a0b0d] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#cf202f]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#05b169]/60" />
                    <span className="ml-3 text-[10px] font-mono text-white/40">terminal</span>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="font-mono text-[11.5px] leading-[1.6] text-white/80 whitespace-pre">
{`$ curl -H "Authorization: Bearer sk-sm-your-key" \\
    https://sentimentapi-p.up.railway.app/v1/sentiment/AAPL
`}
                      <span className="text-white/50">{FREE_RESPONSE.split('"score": 72')[0]}</span>
                      <span className="text-[#4ade80] font-semibold">&quot;score&quot;: 72</span>
                      <span className="text-white/50">{FREE_RESPONSE.split('"score": 72')[1]}</span>
                    </pre>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* TIERS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">The two tiers</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_52px_52px] sm:grid-cols-[1fr_90px_90px] gap-3 px-4 sm:px-6 py-3 bg-[#f7f7f7] border-b border-[#dee1e6] text-[11px] uppercase tracking-[0.05em] text-[#7c828a] font-semibold">
                  <span />
                  <span className="text-center">Free</span>
                  <span className="text-center">Pro</span>
                </div>
                <div className="grid grid-cols-[1fr_52px_52px] sm:grid-cols-[1fr_90px_90px] gap-3 px-4 sm:px-6 py-3.5 border-b border-[#eef0f3] items-center">
                  <span className="text-xs font-semibold text-[#0a0b0d]">Rate limit</span>
                  <span className="text-center text-xs font-mono tabular-nums text-[#0a0b0d]">10/min</span>
                  <span className="text-center text-xs font-mono tabular-nums text-[#0a0b0d]">600/min</span>
                </div>
                {TIER_ROWS.map(({ feature, free, pro }, i) => (
                  <div
                    key={feature}
                    className={`grid grid-cols-[1fr_52px_52px] sm:grid-cols-[1fr_90px_90px] gap-3 px-4 sm:px-6 py-3.5 items-center ${i < TIER_ROWS.length - 1 ? 'border-b border-[#eef0f3]' : ''}`}
                  >
                    <span className="text-xs text-[#5b616e]">{feature}</span>
                    <span className={`text-center text-sm ${free ? 'text-[#05b169]' : 'text-[#dee1e6]'}`}>{free ? '✓' : '—'}</span>
                    <span className={`text-center text-sm ${pro ? 'text-[#05b169]' : 'text-[#dee1e6]'}`}>{pro ? '✓' : '—'}</span>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white border border-[#dee1e6] rounded-xl p-5">
                  <div className="text-sm font-semibold text-[#0a0b0d] mb-2">Free answers &ldquo;what?&rdquo;</div>
                  <p className="text-xs text-[#5b616e] leading-relaxed">
                    What&apos;s the sentiment on this stock right now, and which way is it moving? The
                    score, its label, how confident we are in it, and how it changed over the last
                    day. Enough to power a watchlist or a widget.
                  </p>
                </div>
                <div className="bg-white border border-[#dee1e6] rounded-xl p-5">
                  <div className="text-sm font-semibold text-[#0a0b0d] mb-2">Pro answers &ldquo;why?&rdquo;</div>
                  <p className="text-xs text-[#5b616e] leading-relaxed">
                    The four sub-indices behind the score, the specific signals driving it, a
                    human-readable explanation, where the ticker ranks against the whole universe, a
                    year of score history, and a bird&apos;s-eye view of the entire market — plus 60× the
                    request rate, enough for production apps.
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ENDPOINTS */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">The endpoints</div>
            </Reveal>
            <div className="flex flex-col gap-3">
              {ENDPOINTS.map(({ path, tier, title, desc }, i) => (
                <Reveal key={path} delay={i * 0.05}>
                  <div className="bg-white border border-[#dee1e6] rounded-xl p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <code className="font-mono text-[12px] text-[#0a0b0d] bg-[#eef0f3] px-2 py-1 rounded-md">{path}</code>
                      <span className="text-[10px] font-semibold bg-[#f7f7f7] border border-[#dee1e6] text-[#7c828a] px-2 py-0.5 rounded-full">{tier}</span>
                    </div>
                    <div className="text-sm font-semibold text-[#0a0b0d] mb-1.5">{title}</div>
                    <p className="text-xs text-[#5b616e] leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* METHODOLOGY TEASER */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">What&apos;s behind the numbers</div>
              <div className="bg-white border border-[#dee1e6] rounded-xl p-6">
                <ul className="flex flex-col gap-3 text-xs text-[#5b616e] leading-relaxed">
                  <li>
                    Four independent channels — <strong className="text-[#0a0b0d]">market (35%), narrative (30%),
                    influencer (25%), macro (10%)</strong> — blended into one composite score.
                  </li>
                  <li>
                    News is scored by <strong className="text-[#0a0b0d]">FinBERT</strong>, a finance-tuned
                    transformer, with semantic deduplication so ten outlets covering one story count
                    once, not ten times.
                  </li>
                  <li>
                    Data refreshes continuously: market data every 15 minutes during trading hours,
                    news every 30 minutes around the clock, insider/analyst activity every 6 hours,
                    macro hourly and daily.
                  </li>
                  <li>
                    Every score ships with its own confidence rating and freshness metadata — the API
                    tells you when <em className="not-italic text-[#0a0b0d]">not</em> to trust it.
                  </li>
                </ul>
                <Link href="/technology" className="inline-block mt-5 text-xs font-semibold text-[#0052ff] hover:underline">
                  Read the full methodology →
                </Link>
              </div>
            </Reveal>
          </section>

          {/* FAIR USE */}
          <section className="py-16">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Fair use &amp; practical notes</div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['Rate limits', '10 requests/min (Free) and 600 requests/min (Pro), enforced per key per rolling minute. Exceeding it returns HTTP 429 — back off and retry after the minute window.'],
                  ['Coverage', 'US-listed S&P 500 equities (502 tickers). Unsupported tickers return a clean ticker_not_found response, and newly supported tickers return insufficient_data until enough history accumulates — the API never guesses.'],
                  ['Keys are secret', 'Treat sk-sm-… like a password. It’s shown once at creation and cannot be recovered — only regenerated.'],
                  ['Errors are predictable', '401 (bad or missing key), 403 (endpoint needs Pro), 429 (rate limit), 500 (our fault) — all with JSON error bodies.'],
                ].map(([title, desc]) => (
                  <div key={title} className="bg-white border border-[#dee1e6] rounded-xl p-5">
                    <div className="text-sm font-semibold text-[#0a0b0d] mb-1.5">{title}</div>
                    <p className="text-xs text-[#5b616e] leading-relaxed">{desc}</p>
                  </div>
                ))}
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
