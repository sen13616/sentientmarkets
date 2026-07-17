import DistributionChart from './charts/DistributionChart';
import { Sp500Payload } from './types';
import s from './indexpage.module.css';

export default function DistributionCard({ data }: { data: Sp500Payload }) {
  const { histogram, stats, universe_scored } = data;
  if (histogram.length === 0) return null;

  const neutral =
    universe_scored !== null && stats.bullish_count !== null && stats.bearish_count !== null
      ? universe_scored - stats.bullish_count - stats.bearish_count
      : null;

  return (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Score distribution</h3>
      <p className={s.cardSub}>
        Every scored name placed in a 5-point bucket. The shape is what a single index-level
        average would destroy — a market can average 54 while being split, or while agreeing.
      </p>
      <DistributionChart histogram={histogram} />
      {neutral !== null && (
        <div className={s.footNote}>
          <span className={s.fnDot} />
          <span>
            {stats.bearish_count} names below neutral · {neutral} neutral-to-bullish ·{' '}
            {stats.bullish_count} at 65 or above
          </span>
        </div>
      )}
    </div>
  );
}
