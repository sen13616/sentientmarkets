'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './faq.module.css';

type FaqItem = {
  q: string;
  a: React.ReactNode;
};

type FaqGroup = {
  id: string;
  label: string;
  items: FaqItem[];
};

const groups: FaqGroup[] = [
  {
    id: 'the-score',
    label: 'The score',
    items: [
      {
        q: 'What is the MarketMood Score?',
        a: <>The MarketMood Score is a 0–100 composite sentiment rating for any US-listed stock. It aggregates signals from three pillars — <strong>Technical</strong> (price action, RSI, moving averages), <strong>Fundamental</strong> (analyst ratings, earnings, price targets), and <strong>Sentiment</strong> (news tone, Reddit activity, insider behaviour, macro fear). Scores below 45 are Bearish, 45–64 are Neutral, and 65 and above are Bullish.</>,
      },
      {
        q: 'How often does the score update?',
        a: 'Scores are cached for 15 minutes. When you search a ticker, you\'ll receive the most recently computed score. If the cache has expired, a fresh score is computed in real time from all seven data sources before being returned to you.',
      },
      {
        q: 'Why do different stocks have similar scores?',
        a: <>Some market-wide signals — like the CNN Fear &amp; Greed Index — apply equally to all stocks, which can pull scores toward the middle. We&apos;re actively working on per-stock differentiation so that company-specific signals carry more weight relative to macro conditions. Score differentiation is a priority for upcoming releases.</>,
      },
      {
        q: 'What stocks can I look up?',
        a: 'Any US-listed equity ticker — NYSE, NASDAQ, and AMEX listed stocks. ETFs and indices may return partial scores depending on data availability. Non-US tickers and crypto are not currently supported.',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data & sources',
    items: [
      {
        q: 'Where does the data come from?',
        a: <>We aggregate from seven sources: <strong>yfinance</strong> for price and fundamentals, <strong>Alpha Vantage</strong> for RSI and news sentiment, <strong>CNN Fear &amp; Greed</strong> for macro context, <strong>Finnhub</strong> for insider activity and earnings, <strong>ApeWisdom</strong> for Reddit mentions, <strong>Google Trends</strong> for search interest, and <strong>NewsAPI</strong> for macro headlines. Full details are on the <Link href="/technology">Technology page</Link>.</>,
      },
      {
        q: 'Is the data real-time?',
        a: 'Price data is near real-time during market hours, subject to the standard 15-minute delay from data providers. Sentiment signals like Reddit mentions and news sentiment update on their own schedules — typically within the hour. The CNN Fear & Greed Index refreshes daily. All data is subject to our 15-minute Redis cache TTL.',
      },
      {
        q: 'What does the Reddit data actually measure?',
        a: <>We use ApeWisdom to track mention counts, rank, and rank velocity for tickers across major finance subreddits including r/wallstreetbets, r/stocks, and r/investing. Currently this measures <strong>volume</strong> of discussion — how much a stock is being talked about. Sentiment polarity (whether that discussion is bullish or bearish in tone) is on our roadmap as a high-priority enhancement.</>,
      },
    ],
  },
  {
    id: 'pro',
    label: 'Pro plan',
    items: [
      {
        q: 'What do I get with Pro?',
        a: <>Pro unlocks the AI narrative layer — a GPT-4o-mini generated analysis for every stock you look up. This includes a <strong>Summary</strong>, a <strong>Bull case</strong>, a <strong>Bear case</strong>, and a <strong>What to watch</strong> section — all grounded in the actual scored data rather than generic commentary. Free users still get the full MarketMood Score and all three signal pillars.</>,
      },
      {
        q: 'How much does Pro cost?',
        a: <>Pro is <strong>$12.99 per month</strong>, billed monthly. You can cancel at any time — there are no long-term commitments or cancellation fees.</>,
      },
      {
        q: 'Can I try it before subscribing?',
        a: 'Yes — the full MarketMood Score, all signal pillars, charts, news, and analyst data are free with no account required. Pro is only needed for the AI narrative layer. Search any ticker to see what free access looks like.',
      },
    ],
  },
  {
    id: 'accuracy',
    label: 'Accuracy & limits',
    items: [
      {
        q: 'Is this financial advice?',
        a: 'No. TheMarketMood.ai is an informational tool — it aggregates and presents sentiment data to help you form your own view. Nothing on this platform constitutes a buy or sell recommendation. Always do your own research and consult a qualified financial advisor before making investment decisions.',
      },
      {
        q: 'How accurate is the score?',
        a: 'The MarketMood Score reflects the current state of aggregated signals — it is not a price prediction. Sentiment scores are useful as a snapshot of market psychology and signal alignment, but they do not guarantee future price direction. Backtesting capability to measure historical score accuracy is on our roadmap.',
      },
      {
        q: 'What if a data source is unavailable?',
        a: <>If an individual data source fails or is rate-limited, the score is computed from the remaining available sources and the affected signal is marked as <strong>Unavailable</strong> in the UI. We never silently substitute or fabricate data — if something isn&apos;t available, it&apos;s clearly labelled as such.</>,
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        q: 'Do I need an account to use TheMarketMood.ai?',
        a: 'No account is required to search tickers and view the MarketMood Score. An account is only needed to subscribe to Pro and access the AI narrative layer.',
      },
      {
        q: 'How do I cancel my Pro subscription?',
        a: 'You can cancel any time from your account settings. Your Pro access continues until the end of the current billing period.',
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
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.faqWrap}>

        {/* STICKY SIDE NAV */}
        <div className={styles.faqNav}>
          <div className={styles.faqNavLabel}>Jump to</div>
          {groups.map(g => (
            <span
              key={g.id}
              className={`${styles.faqNavLink} ${activeNav === g.id ? styles.active : ''}`}
              onClick={() => scrollToGroup(g.id)}
            >
              {g.label}
            </span>
          ))}
        </div>

        {/* ACCORDION CONTENT */}
        <div className={styles.faqContent}>
          {groups.map(group => (
            <div
              key={group.id}
              id={group.id}
              className={styles.faqGroup}
              ref={el => { groupRefs.current[group.id] = el; }}
            >
              <div className={styles.faqGroupLabel}>{group.label}</div>
              <div className={styles.faqList}>
                {group.items.map((item, i) => {
                  const key = `${group.id}-${i}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}
                    >
                      <div
                        className={styles.faqQ}
                        onClick={() => toggle(group.id, i)}
                      >
                        <div className={styles.faqQText}>{item.q}</div>
                        <div className={styles.faqIcon}></div>
                      </div>
                      <div className={styles.faqA}>
                        <div className={styles.faqAInner}>{item.a}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CONTACT NUDGE */}
          <div className={styles.contactNudge}>
            <div className={styles.nudgeLeft}>
              <div className={styles.nudgeTitle}>Still have questions?</div>
              <div className={styles.nudgeDesc}>We&apos;re happy to help — reach out and we&apos;ll get back to you promptly.</div>
            </div>
            <Link href="/contact" className={styles.nudgeBtn}>Contact us →</Link>
          </div>

        </div>
      </div>
    </section>
  );
}