'use client';

import s from '../stockpage.module.css';

export type TooltipRow = {
  swatch?: string;
  label: string;
  value: string;
  valueClass?: string;
};

/* HTML tooltip overlay (real typography — SVG text would scale with the
   viewBox and become unreadable at narrow widths). Positioned absolutely
   inside the `.chartWrap` relative wrapper via the snapped point's x as a
   FRACTION of the viewBox width, so it stays correct through resizes.
   Flips sides past the horizontal midpoint so it never overflows the card. */
export default function ChartTooltip({
  xFrac,
  title,
  rows,
}: {
  xFrac: number;
  title: string;
  rows: TooltipRow[];
}) {
  const flip = xFrac > 0.5;
  return (
    <div
      className={s.tip}
      style={
        flip
          ? { right: `calc(${((1 - xFrac) * 100).toFixed(2)}% + 12px)` }
          : { left: `calc(${(xFrac * 100).toFixed(2)}% + 12px)` }
      }
    >
      <div className={s.tipTitle}>{title}</div>
      {rows.map((r, i) => (
        <div key={i} className={s.tipRow}>
          {r.swatch && <span className={s.tipSwatch} style={{ background: r.swatch }} />}
          <span className={s.tipLabel}>{r.label}</span>
          <span className={`${s.tipValue} ${r.valueClass ?? ''}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
