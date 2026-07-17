'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Nav from '../Nav';
import Footer from '../Footer';
import s from './stockpage.module.css';

/* Light replacement for the old dark AssetPage fallback.

   Two distinct states so an upstream outage never reads as "not covered":
   - "not-covered": the ticker is outside the SentimentAPI universe.
   - "unavailable": the sentiment service is down and coverage is unknown. */
export default function NotCoveredPage({
  ticker,
  variant,
}: {
  ticker: string;
  variant: 'not-covered' | 'unavailable';
}) {
  const router = useRouter();
  const notCovered = variant === 'not-covered';

  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />

      <div className={s.wrap}>
        <div className={s.nfBlock}>
          <div className={`${s.pill} ${s.mono}`}>{ticker}</div>
          {/* Two-tone display copy (DESIGN.md): grey setup, ink payoff. */}
          <h1 className={s.nfTitle}>
            <span className={s.nfSetup}>
              {notCovered ? 'Sorry — we don’t have this one.' : 'Scores are taking a breather.'}
            </span>
            <span className={s.nfPayoff}>
              {notCovered
                ? 'Sentiment covers 500+ large-cap US names.'
                : 'The sentiment service is temporarily unavailable.'}
            </span>
          </h1>
          <p className={s.nfSub}>
            {notCovered
              ? `${ticker} isn’t in the scored universe yet, so there’s no composite to show — no
                 stand-in numbers, no guesses.`
              : `${ticker} may well be covered — we just can’t reach the scoring service right now.
                 It usually comes back within a few minutes.`}
          </p>
          <div className={s.nfActions}>
            <Link href="/index/sp500" className={s.nfPrimary}>
              Browse the S&amp;P 500 →
            </Link>
            <Link href="/" className={s.nfSecondary}>
              Back to home
            </Link>
          </div>
        </div>
      </div>

      <Footer variant="light" />
    </div>
  );
}
