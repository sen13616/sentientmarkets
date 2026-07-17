'use client';

import { useState } from 'react';
import { CHANNELS, CHANNEL_COLORS, CHANNEL_LABELS, ScreenerRow } from './types';
import s from './screenerpage.module.css';

const W = 148, H = 20;
// xAt is computed from the 0–100 scale — never the mockup's literal x=74.
const xAt = (v: number) => 4 + (v / 100) * 140;

/* Per-row channel-spread sparkline: neutral tick at 50, a gray range line
   from the lowest to highest PRESENT channel, one dot per present channel.
   Hovering shows a tooltip listing each channel's value. */
export default function SparkSpread({ row }: { row: ScreenerRow }) {
  const [hover, setHover] = useState(false);
  const present = CHANNELS.filter((ch) => row.sub[ch] !== null);
  const vals = present.map((ch) => row.sub[ch] as number);
  const lo = vals.length ? Math.min(...vals) : null;
  const hi = vals.length ? Math.max(...vals) : null;

  return (
    <div
      className={s.sparkWrap}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <svg
        className={s.spark}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Channel spread for ${row.ticker}`}
      >
        <line x1={4} x2={144} y1={10} y2={10} stroke="#f1f3f6" strokeWidth={1} />
        <line x1={xAt(50)} x2={xAt(50)} y1={4} y2={16} stroke="#e2e6ec" strokeWidth={1} />
        {lo !== null && hi !== null && vals.length >= 2 && (
          <line x1={xAt(lo)} x2={xAt(hi)} y1={10} y2={10} stroke="#c9cfd8" strokeWidth={1.5} />
        )}
        {present.map((ch) => (
          <circle
            key={ch}
            cx={xAt(row.sub[ch] as number)}
            cy={10}
            r={3.2}
            fill={CHANNEL_COLORS[ch]}
            stroke="#fff"
            strokeWidth={1}
          />
        ))}
      </svg>
      {hover && (
        <div className={s.tip} style={{ right: 'calc(100% + 8px)', top: -28 }}>
          <div className={s.tipTitle}>{row.ticker} · channels</div>
          {CHANNELS.map((ch) => (
            <div key={ch} className={s.tipRow}>
              <span className={s.tipSwatch} style={{ background: CHANNEL_COLORS[ch] }} />
              <span className={s.tipLabel}>{CHANNEL_LABELS[ch]}</span>
              <span className={s.tipValue}>
                {row.sub[ch] !== null ? (row.sub[ch] as number).toFixed(1) : 'no data'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
