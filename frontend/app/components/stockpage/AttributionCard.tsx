'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SentimentFull } from './types';
import { CHANNEL_ORDER, stackContributions } from '@/lib/stockMath';
import s from './stockpage.module.css';

const COLORS: Record<string, string> = {
  market: 'var(--ch-market)',
  narrative: 'var(--ch-narrative)',
  influencer: 'var(--ch-influencer)',
  macro: 'var(--ch-macro)',
};
const LABELS: Record<string, string> = {
  market: 'Market',
  narrative: 'Narrative',
  influencer: 'Influencer',
  macro: 'Macro',
};

/* One stacked bar = the whole raw composite; each segment is a channel's
   share of the contribution SUM (weights renormalized over present layers in
   stackContributions — reconciles to score_raw within integer rounding).
   Below it, one arithmetic row per channel: weight × sub-index = value. */
export default function AttributionCard({ sentiment }: { sentiment: SentimentFull }) {
  const rows = stackContributions(sentiment.sub_indices, sentiment.missing_layers);
  const missing = new Set(sentiment.missing_layers ?? []);
  const sum = rows.reduce((a, r) => a + r.value, 0);
  const topDriver = sentiment.top_drivers?.[0];
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const reduced = useReducedMotion() ?? false;

  return (
    <div className={s.card}>
      <div>
        <h3 className={s.cardTitle}>Today&apos;s attribution</h3>
        <p className={s.cardSub}>
          Where the current raw composite comes from, channel by channel. Segments are shares
          of the whole.
        </p>
      </div>

      <div className={s.cardBody}>
        <div
          className={s.stackBar}
          role="img"
          aria-label={
            sum > 0
              ? `Composite made of ${rows.map((r) => `${LABELS[r.key].toLowerCase()} ${Math.round((r.value / sum) * 100)}%`).join(', ')}`
              : 'No contribution data'
          }
        >
          {/* Guard sum <= 0: empty track, no division. Segments expand once
              on first scroll into view; static under reduced motion. */}
          {sum > 0 &&
            rows.map((r, idx) => {
              const width = `${((r.value / sum) * 100).toFixed(2)}%`;
              if (reduced) {
                return (
                  <div key={r.key} className={s.stackSeg} style={{ width, background: COLORS[r.key] }} />
                );
              }
              return (
                <motion.div
                  key={r.key}
                  className={s.stackSeg}
                  style={{ background: COLORS[r.key] }}
                  initial={{ width: 0 }}
                  whileInView={{ width }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 + idx * 0.08 }}
                />
              );
            })}
        </div>
        <div className={s.stackScale}>
          <span>0</span>
          <span>
            raw composite {sentiment.score_raw !== null ? sentiment.score_raw.toFixed(1) : '—'}
          </span>
        </div>

        <div className={s.attrRows}>
          {CHANNEL_ORDER.map((key) => {
            const row = byKey.get(key);
            return (
              <div key={key} className={s.attrRow}>
                <span className={s.swatch} style={{ background: COLORS[key] }} />
                <span className={s.attrName}>{LABELS[key]}</span>
                <span className={s.attrMath}>
                  {row
                    ? `${row.weight.toFixed(2)} × ${row.sub.toFixed(1)}`
                    : missing.has(key)
                      ? 'no data this tick'
                      : 'unavailable'}
                </span>
                <span className={s.attrVal}>{row ? `+${row.value.toFixed(1)}` : '—'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.cardFoot}>
        <div className={s.stat}>
          <span className={s.statLabel}>Sum of contributions</span>
          <span className={s.statValue}>
            {sum.toFixed(1)}
            {sentiment.score_raw !== null && (
              <span className={s.dim}> · raw {sentiment.score_raw.toFixed(1)}</span>
            )}
          </span>
        </div>
        {topDriver && (
          <div className={s.stat}>
            <span className={s.statLabel}>Top driver</span>
            <span className={`${s.statValue} ${s.statProse}`}>
              {LABELS[topDriver.source_layer] ?? topDriver.source_layer} — {topDriver.signal}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
