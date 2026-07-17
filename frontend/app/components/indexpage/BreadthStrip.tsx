import { Sp500Payload } from './types';
import s from './indexpage.module.css';

const dash = '—';

/* Four always-rendered cells; any null stat renders an em-dash. */
export default function BreadthStrip({ data }: { data: Sp500Payload }) {
  const { stats, widest_sector_gap: gap } = data;
  return (
    <div className={s.strip}>
      <div className={s.cell}>
        <div className={s.cellLabel}>Median score</div>
        <div className={s.cellVal}>{stats.median !== null ? stats.median.toFixed(1) : dash}</div>
        <div className={s.cellSub}>
          {stats.mean !== null ? `mean ${stats.mean.toFixed(1)}` : dash}
        </div>
      </div>
      <div className={s.cell}>
        <div className={s.cellLabel}>Bullish · 65+</div>
        <div className={s.cellVal}>{stats.bullish_count ?? dash}</div>
        <div className={s.cellSub}>
          {stats.bullish_pct !== null ? `${stats.bullish_pct.toFixed(1)}% of names` : dash}
        </div>
      </div>
      <div className={s.cell}>
        <div className={s.cellLabel}>Bearish · under 50</div>
        <div className={s.cellVal}>{stats.bearish_count ?? dash}</div>
        <div className={s.cellSub}>
          {stats.bearish_pct !== null ? `${stats.bearish_pct.toFixed(1)}% of names` : dash}
        </div>
      </div>
      <div className={s.cell}>
        <div className={s.cellLabel}>Widest sector gap</div>
        <div className={s.cellVal}>{gap.value !== null ? gap.value.toFixed(1) : dash}</div>
        <div className={s.cellSub}>
          {gap.top_sector && gap.bottom_sector
            ? `${gap.top_sector} over ${gap.bottom_sector}`
            : dash}
        </div>
      </div>
    </div>
  );
}
