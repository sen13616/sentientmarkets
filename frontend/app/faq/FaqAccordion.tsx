'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type FaqItem = {
  q: string;
  a: React.ReactNode;
};

type FaqGroup = {
  id: string;
  label: string;
  items: FaqItem[];
  /* Pre-launch: blur the whole group (Pro isn't live yet). */
  blurred?: boolean;
};

const groups: FaqGroup[] = [
  {
    id: 'the-score',
    label: 'The score',
    items: [
      {
        q: 'What is the sentiment score?',
        a: <>A 0–100 composite sentiment rating for every stock in the S&amp;P 500. It blends four independent channels — <strong>Market</strong> (35%, what the price action itself is saying), <strong>Narrative</strong> (30%, what the financial press is saying), <strong>Influencer</strong> (25%, what insiders and analysts are doing), and <strong>Macro</strong> (10%, what the broader economy is saying). Every formula, weight, and threshold is documented on the <Link href="/technology" className="text-[#0052ff] hover:underline">Technology page</Link> and in our research paper, <em>&ldquo;How to Quantify Stock Sentiment&rdquo;</em>.</>,
      },
      {
        q: 'What do the labels mean?',
        a: <>The score maps to five plain-English bands: <strong>0–20 Strongly Bearish</strong>, <strong>21–40 Bearish</strong>, <strong>41–60 Neutral</strong>, <strong>61–80 Bullish</strong>, and <strong>81–100 Strongly Bullish</strong>. 50 is neutral by construction — every signal is normalized so that above 50 always means bullish.</>,
      },
      {
        q: 'How often does the score update?',
        a: <>All four channels are recomputed for all 502 tickers <strong>every 30 minutes, around the clock</strong>. Underneath that, each source refreshes on its own schedule: price data every 15 minutes during US trading hours (with a definitive end-of-day capture after the bell), news every 30 minutes 24/7, insider and analyst data every 6 hours, and macro data daily. The published score is smoothed with a 4-hour half-life moving average, so it reflects sustained shifts in sentiment rather than tick-to-tick noise.</>,
      },
      {
        q: 'What does the confidence value mean?',
        a: <>Every score ships with a <strong>confidence</strong> value (0–100). It starts at 100 and takes penalties for stale data, missing channels, or channels that sharply disagree with each other. A score of 72 with confidence 90 and a score of 72 with confidence 55 are different animals — and we tell you which one you&apos;re holding.</>,
      },
      {
        q: 'What stocks are covered?',
        a: 'Every stock in the S&P 500 — 502 tickers. Smaller caps aren’t scored yet. Coverage expansion is on the roadmap, but we’d rather score 502 names properly than 5,000 names badly.',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data & sources',
    items: [
      {
        q: 'Where does the data come from?',
        a: <>Six providers, each doing what it&apos;s best at: <strong>Yahoo Finance / Polygon</strong> for price, volume, and order-flow data (primary plus fallback), <strong>Alpha Vantage</strong> for financial news, <strong>Finnhub</strong> for news fallback, insider transactions, and analyst consensus, <strong>FINRA</strong> for official daily short-volume files, <strong>FRED</strong> (the Federal Reserve) for Treasury yields, and <strong>CBOE</strong> data for the VIX. Redundant providers on the critical paths mean a single vendor outage doesn&apos;t blind the system. Full details on the <Link href="/technology" className="text-[#0052ff] hover:underline">Technology page</Link>.</>,
      },
      {
        q: 'How is news turned into a number?',
        a: <>Not by keyword counting. Articles must first clear a relevance threshold — passing mentions don&apos;t move the score. Near-duplicate coverage is clustered so ten outlets covering the same story count as <strong>one event, not ten signals</strong>. Each surviving article is then scored by <strong>FinBERT</strong>, a transformer model fine-tuned on financial text, and the model&apos;s own uncertainty down-weights ambiguous articles — a confidently bullish article counts more than a hedged one.</>,
      },
      {
        q: 'Do you track social media?',
        a: <>No — social-media sentiment is not currently an input. The influencer channel tracks <strong>insiders and analysts</strong> instead: insider transaction filings, analyst buy/hold/sell consensus, price targets, and earnings estimate revisions. Their actions are regulated and verifiable, unlike anonymous posts — and insiders get the highest weight and the longest memory, because they trade on longer horizons than headlines.</>,
      },
      {
        q: 'What happens when data is missing?',
        a: <>The score degrades gracefully rather than going stale. If a channel has no fresh data for a ticker, its weight is redistributed proportionally across the remaining channels. If a ticker has only a handful of signals in a channel, that channel is shrunk toward neutral — one lone article can&apos;t swing a stock to &ldquo;Strongly Bullish.&rdquo; And whatever happens is reflected honestly in the <strong>confidence</strong> value and the freshness metadata on every response.</>,
      },
    ],
  },
  {
    id: 'pro',
    label: 'Pro plan',
    blurred: true,
    items: [
      {
        q: 'What do I get with Pro?',
        a: <>The full breakdown behind every score: <strong>per-channel sub-indices</strong> (how Market, Narrative, Influencer, and Macro each scored), the <strong>top drivers</strong> behind the number, a <strong>generated explanation</strong> of what&apos;s moving it, <strong>divergence</strong> between channels, <strong>data-freshness metadata</strong>, and the <strong>unsmoothed raw score</strong> alongside the published one. Free users get the composite score, its label, and the confidence value.</>,
      },
      {
        q: 'How much does Pro cost?',
        a: <><strong>$12.99 per month</strong>, billed monthly. You can cancel at any time — there are no long-term commitments or cancellation fees.</>,
      },
      {
        q: 'Can I try it before subscribing?',
        a: 'Yes — the composite score, labels, charts, and news are free with no account required. Pro is only needed for the full score breakdown. Search any ticker to see what free access looks like.',
      },
    ],
  },
  {
    id: 'accuracy',
    label: 'Accuracy & limits',
    items: [
      {
        q: 'Is this financial advice?',
        a: 'No. SentientMarkets is an informational tool — it aggregates and presents sentiment data to help you form your own view. Nothing on this platform constitutes a buy or sell recommendation. Always do your own research and consult a qualified financial advisor before making investment decisions.',
      },
      {
        q: 'Is the score a price prediction?',
        a: <>No. Sentiment is a measurement of <strong>current signal alignment</strong> — a snapshot of what price action, the press, insiders, analysts, and the macro backdrop are collectively saying right now. It does not guarantee future price direction. Full score history is preserved, which powers the history views and, over time, backtesting.</>,
      },
      {
        q: 'Why every 30 minutes and not real time?',
        a: <>This is deliberately not a tick-level feed. Sentiment shifts on the scale of hours, not milliseconds — the pipeline recomputes every 30 minutes and the published score is smoothed over a 4-hour half-life, which filters out noise a tick-level feed would amplify. Every response includes its exact age, so you always know how fresh the score you&apos;re holding is.</>,
      },
      {
        q: 'What if a data source goes down?',
        a: <>The critical paths — price data and news — each have redundant providers, so a single vendor outage doesn&apos;t blind the system. If a whole channel loses fresh data anyway, its weight is redistributed to the remaining channels and the confidence value takes a penalty. We never silently substitute or fabricate data.</>,
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        q: 'Do I need an account to use SentientMarkets?',
        a: <>No account is required to search tickers and view the sentiment score.{' '}
          <span className="pro-blur" aria-hidden="true">An account is only needed to subscribe to Pro and access the full score breakdown.</span></>,
      },
      {
        q: 'How do I cancel my subscription?',
        a: <><span className="pro-blur" aria-hidden="true">You can cancel your Pro subscription any time from your account settings. Your Pro access continues until the end of the current billing period.</span></>,
      },
    ],
  },
];

export default function FaqAccordion() {
  const [openItem, setOpenItem] = useState<string>('the-score-0');
  const [activeNav, setActiveNav] = useState<string>('the-score');
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function toggle(groupId: string, itemIndex: number) {
    const key = `${groupId}-${itemIndex}`;
    setOpenItem(prev => (prev === key ? '' : key));
  }

  function scrollToGroup(id: string) {
    setActiveNav(id);
    const el = groupRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <section className="py-8">
      <div className="flex gap-12">

        {/* STICKY SIDE NAV */}
        <div className="hidden md:flex flex-col gap-1 w-44 shrink-0 sticky top-28 self-start">
          <div className="text-[11px] uppercase tracking-[0.06em] text-[#a8acb3] font-semibold mb-3">Jump to</div>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => scrollToGroup(g.id)}
              className={`text-left text-xs py-1.5 px-2 rounded-full transition-colors ${
                activeNav === g.id
                  ? 'text-[#0a0b0d] bg-[#eef0f3] font-semibold'
                  : 'text-[#5b616e] hover:text-[#0a0b0d]'
              } ${g.blurred ? 'pro-blur' : ''}`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* ACCORDION CONTENT */}
        <div className="flex-1 flex flex-col gap-10">
          {groups.map(group => (
            <motion.div
              key={group.id}
              id={group.id}
              ref={el => { groupRefs.current[group.id] = el; }}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={`text-[12px] uppercase tracking-[0.06em] text-[#7c828a] font-semibold mb-4 ${group.blurred ? 'pro-blur' : ''}`}>{group.label}</div>
              <div
                className={`bg-white border border-[#dee1e6] rounded-xl overflow-hidden ${group.blurred ? 'pro-blur' : ''}`}
                aria-hidden={group.blurred || undefined}
              >
                {group.items.map((item, i) => {
                  const key = `${group.id}-${i}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className={`border-b border-[#eef0f3] last:border-b-0 ${isOpen ? 'bg-[#f7f7f7]' : ''}`}
                    >
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                        onClick={() => toggle(group.id, i)}
                      >
                        <span className="text-sm font-medium text-[#0a0b0d] pr-4">{item.q}</span>
                        <span className={`shrink-0 w-4 h-4 flex items-center justify-center text-[#7c828a] transition-transform ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm text-[#5b616e] leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* CONTACT NUDGE */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between bg-white border border-[#dee1e6] rounded-xl p-6">
            <div>
              <div className="text-sm font-semibold text-[#0a0b0d] mb-1">Still have questions?</div>
              <div className="text-xs text-[#7c828a]">We&apos;re happy to help — reach out and we&apos;ll get back to you promptly.</div>
            </div>
            <Link href="/contact" className="shrink-0 ml-4 text-xs font-semibold text-[#0a0b0d] bg-[#eef0f3] hover:bg-[#dee1e6] px-4 py-2 rounded-full transition-colors">
              Contact us →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
