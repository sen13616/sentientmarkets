import { SentimentFull } from './types';
import { CHANNEL_ORDER, stackContributions } from '@/lib/stockMath';
import s from './stockpage.module.css';

const COLORS: Record<string, string> = {
  market: '#0052ff',
  narrative: '#5e8bff',
  influencer: '#a8c0ff',
  macro: '#d9dee8',
};
const LABELS: Record<string, string> = {
  market: 'Market',
  narrative: 'Narrative',
  influencer: 'Influencer',
  macro: 'Macro',
};

/* Per-channel weighted contributions to the RAW composite (weighted
   sub-indices reconcile to score_raw within integer rounding — verified
   live against AAPL/MSFT/AOS). Missing layers render as "no data this
   tick" with their weight redistributed across the drawn bars. */
export default function AttributionCard({ sentiment }: { sentiment: SentimentFull }) {
  const rows = stackContributions(sentiment.sub_indices, sentiment.missing_layers);
  const missing = new Set(sentiment.missing_layers ?? []);
  const sum = rows.reduce((a, r) => a + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 1) * 1.1;
  const topDriver = sentiment.top_drivers?.[0];

  const W = 470, PL = 110, PR = 64, ROW = 46;
  const allRows = CHANNEL_ORDER.map((key) => ({ key, row: rows.find((r) => r.key === key) }));
  const H = allRows.length * ROW + 8;

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>Today&apos;s attribution</div>
      </div>
      <div className={s.cardSub}>
        Where the current raw composite comes from, channel by channel.
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Attribution bars">
        {allRows.map(({ key, row }, i) => {
          const y = 10 + i * ROW;
          return (
            <g key={key}>
              <text x={0} y={y + 13} fontSize={13} fill="#0a0b0d" fontFamily="var(--font-inter), sans-serif" fontWeight={500}>
                {LABELS[key]}
              </text>
              <text x={0} y={y + 29} fontSize={11} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
                {row
                  ? `w ${row.weight.toFixed(2)} · ${row.sub.toFixed(1)} sub-index`
                  : missing.has(key)
                    ? 'no data this tick'
                    : 'unavailable'}
              </text>
              <rect x={PL} y={y + 4} width={W - PL - PR} height={16} rx={4} fill="#f4f6f9" />
              {row && (
                <>
                  <rect x={PL} y={y + 4} width={((W - PL - PR) * row.value) / max} height={16} rx={4} fill={COLORS[key]} />
                  <text x={W - PR + 10} y={y + 16} fontSize={12.5} fill="#0a0b0d" fontFamily="var(--font-jetbrains-mono), monospace">
                    +{row.value.toFixed(1)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div className={s.pressFoot}>
        <div className={s.pfItem}>
          <div className={s.ctxLabel}>Sum of contributions</div>
          <div className={s.mono}>
            {sum.toFixed(1)}
            {sentiment.score_raw !== null && ` · raw ${sentiment.score_raw.toFixed(1)}`}
          </div>
        </div>
        {topDriver && (
          <div className={s.pfItem}>
            <div className={s.ctxLabel}>Top driver</div>
            <div className={s.pfText}>
              {LABELS[topDriver.source_layer] ?? topDriver.source_layer} — {topDriver.signal}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
