import Link from 'next/link';
import { Composite } from './types';
import { fmtUtc, minutesAgo } from '@/lib/stockMath';
import s from './stockpage.module.css';

export default function StockHeader({ composite }: { composite: Composite }) {
  const { ticker, meta, sentiment, stability } = composite;
  const name = meta?.name ?? ticker;
  const metaLine = [meta?.sector, meta?.sector_etf ? `Sector ETF ${meta.sector_etf}` : null]
    .filter(Boolean)
    .join(' · ');

  const mins = minutesAgo(sentiment?.cache_age_seconds);
  const isOpen = sentiment?.market_hours?.is_open ?? false;
  const delta = sentiment?.score_change_1d ?? null;

  return (
    <header className={s.header}>
      <div className={s.crumb}>
        <Link href="/">Stocks</Link> / {meta?.sector ?? 'S&P 500'} / {ticker}
      </div>
      <div className={s.headRow}>
        <div>
          <h1>
            {name} <span className={`${s.pill} ${s.mono}`} style={{ fontSize: '12.5px' }}>{ticker}</span>
          </h1>
          {metaLine && <div className={s.identName}>{metaLine}</div>}
          <div className={s.identPills}>
            {mins !== null && (
              <span className={s.pill}>
                <span className={`${s.dot} ${isOpen ? '' : s.dotGray}`} />
                {isOpen ? 'Live' : 'Off-hours'} · scored {mins} min ago
              </span>
            )}
            {/* 7-day sigma is a DAILY-resolution stability measure (computed
                from daily history points) — never label it intraday. */}
            {stability?.sigma_7d !== null && stability?.sigma_7d !== undefined && (
              <span className={s.stability}>
                <span className={`${s.dot} ${stability.label === 'Stable' ? '' : stability.label === 'Choppy' ? s.dotAmber : s.dotRed}`} />
                {stability.label} · 7-day σ {stability.sigma_7d}
              </span>
            )}
          </div>
        </div>
        {sentiment && (
          <div className={s.scoreBlock}>
            <div className={s.scoreLabel}>Composite sentiment</div>
            <div className={s.scoreLine}>
              <span className={`${s.scoreNum} ${s.mono}`}>
                {sentiment.score !== null ? sentiment.score.toFixed(1) : '—'}
              </span>
              {delta !== null ? (
                <span className={`${s.deltaBadge} ${delta >= 0 ? s.deltaUp : s.deltaDown} ${s.mono}`}>
                  {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}{delta.toFixed(1)} (1d)
                </span>
              ) : (
                // Quiet no-baseline state (amendment 9): absence stays legible
                // and the layout doesn't jump when the baseline appears.
                <span className={`${s.deltaBadge} ${s.deltaNone} ${s.mono}`}>— no 1d baseline</span>
              )}
            </div>
            <div className={s.scoreMeta}>
              {sentiment.score_raw !== null && (
                <span className={s.pill}>Raw <span className={s.mono}>{sentiment.score_raw.toFixed(1)}</span></span>
              )}
              {sentiment.confidence !== null && (
                <span className={s.pill}>Confidence <span className={s.mono}>{(sentiment.confidence / 100).toFixed(2)}</span></span>
              )}
            </div>
            <div className={`${s.freshness} ${s.mono}`}>{fmtUtc(sentiment.timestamp)}</div>
          </div>
        )}
      </div>
    </header>
  );
}
