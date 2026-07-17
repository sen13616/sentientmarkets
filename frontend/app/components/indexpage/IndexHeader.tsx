import { Sp500Payload } from './types';
import { fmtUtc } from '@/lib/stockMath';
import s from './indexpage.module.css';

function fmtLevel(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Header mirrors the stock page's: identity + level on the left, the page's
   ONE headline stat (breadth above neutral — deliberately not an index
   sentiment score) on the right. */
export default function IndexHeader({ data }: { data: Sp500Payload }) {
  const { level, breadth, stats, freshness, universe_scored, sectors, timestamp } = data;
  const mins =
    freshness.cache_age_seconds !== null ? Math.round(freshness.cache_age_seconds / 60) : null;
  const isOpen = freshness.market_hours?.is_open ?? null;
  const up = (level?.change ?? 0) >= 0;

  return (
    <div className={s.head}>
      {/* Mount-scoped CSS stagger (stock-page pattern): plays once per
          navigation, immune to re-renders. */}
      <div className={s.fadeUp0}>
        <div className={s.hName}>
          S&amp;P 500 <span className={s.tickerPill}>^GSPC</span>
        </div>
        <div className={s.hSector}>
          {universe_scored ?? '—'} large-cap US names · {sectors.length} sectors
        </div>
        {/* level null → the row is omitted entirely; never a fabricated 0.00 */}
        {level && (
          <div className={s.hLevel}>
            <span className={s.lvlNum}>{fmtLevel(level.value)}</span>
            {level.change !== null && (
              <span className={`${s.badge} ${up ? s.badgeUp : s.badgeDown}`}>
                {up ? '+' : ''}{level.change.toFixed(2)}
                {level.change_pct !== null &&
                  ` (${up ? '+' : ''}${level.change_pct.toFixed(2)}%)`}{' '}
                (1d)
              </span>
            )}
          </div>
        )}
        <div className={`${s.hPills} ${s.fadeUp1}`}>
          {isOpen !== null && mins !== null && (
            <span className={s.statPill}>
              <span className={`${s.dot} ${isOpen ? s.dotGreen : ''}`} />
              {isOpen ? 'Live' : 'Off-hours'} · scored {mins} min ago
            </span>
          )}
          {stats.stdev !== null && (
            <span className={s.statPill}>
              <span className={`${s.dot} ${s.dotAmber}`} />
              Dispersion · σ {stats.stdev.toFixed(1)} across names
            </span>
          )}
        </div>
      </div>

      <div className={`${s.hRight} ${s.fadeUp2}`}>
        <div className={s.hLabel}>Breadth above neutral</div>
        <div className={s.hBig}>
          <span className={s.bigNum}>
            {breadth.above_50_pct !== null ? `${breadth.above_50_pct.toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className={s.hSubPills}>
          {breadth.above_50_count !== null && universe_scored !== null && (
            <span className={s.subPill}>{breadth.above_50_count} of {universe_scored}</span>
          )}
          {breadth.improving_pct !== null && (
            <span className={s.subPill}>Improving {breadth.improving_pct.toFixed(1)}%</span>
          )}
        </div>
        {timestamp && <div className={s.stamp}>{fmtUtc(timestamp)}</div>}
      </div>
    </div>
  );
}
