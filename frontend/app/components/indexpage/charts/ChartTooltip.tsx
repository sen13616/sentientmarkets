'use client';

import { CSSProperties } from 'react';
import s from '../indexpage.module.css';

export type TooltipRow = {
  swatch?: string;
  label: string;
  value: string;
  valueClass?: string;
};

/* HTML tooltip overlay (real typography — SVG text would scale with the
   viewBox and become unreadable at narrow widths). Positioned inside the
   `.chartWrap` relative wrapper via viewBox FRACTIONS so it stays correct
   through resizes. Flips sides past the horizontal midpoint. Optional
   `yFrac` pins it near the hovered row (tall charts like the sector bars);
   omitted → the CSS default top: 8px. */
export default function ChartTooltip({
  xFrac,
  yFrac,
  title,
  rows,
}: {
  xFrac: number;
  yFrac?: number;
  title: string;
  rows: TooltipRow[];
}) {
  const flip = xFrac > 0.5;
  const style: CSSProperties = flip
    ? { right: `calc(${((1 - xFrac) * 100).toFixed(2)}% + 12px)` }
    : { left: `calc(${(xFrac * 100).toFixed(2)}% + 12px)` };
  if (yFrac !== undefined) {
    style.top = `calc(${(yFrac * 100).toFixed(2)}% - 14px)`;
  }
  return (
    <div className={s.tip} style={style}>
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
