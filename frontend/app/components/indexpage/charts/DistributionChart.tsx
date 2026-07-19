'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HistogramBucket } from '../types';
import ChartTooltip from './ChartTooltip';
import useCompactChart from './useCompactChart';
import useDrawIn from './useDrawIn';
import s from '../indexpage.module.css';

// Compact keeps the 10-unit labels legible at phone widths (≈9px real
// instead of ≈3.5px when the 1000-unit viewBox squeezes into ~360 CSS px).
const DESKTOP = { W: 1000, H: 200, PL: 40, PR: 20, TOP: 12, FLOOR: 150 };
const COMPACT = { W: 390, H: 170, PL: 30, PR: 8, TOP: 10, FLOOR: 128 };

/* Bucket bars over whatever range the API returns — nothing about the
   x-domain, y-max, or the neutral-50 marker is hardcoded. Buckets aligned
   to multiples of 5 can never straddle 50, so each bar is wholly red
   (entirely below neutral) or wholly green (at/above). */
export default function DistributionChart({ histogram }: { histogram: HistogramBucket[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { shouldDraw, reduced } = useDrawIn(svgRef);
  const compact = useCompactChart();
  const [hover, setHover] = useState<number | null>(null); // bucket index

  if (histogram.length === 0) return null;

  const { W, H, PL, PR, TOP, FLOOR } = compact ? COMPACT : DESKTOP;
  const PLOT_W = W - PL - PR;
  const PLOT_H = FLOOR - TOP;

  const histMin = histogram[0].from;
  const histMax = histogram[histogram.length - 1].to;
  const span = Math.max(1, histMax - histMin);
  const maxCount = Math.max(...histogram.map((b) => b.count), 1);
  // y-axis max: largest bucket rounded up to a clean number.
  const yMax = Math.max(10, Math.ceil(maxCount / 10) * 10);

  const slot = PLOT_W / histogram.length;
  const barW = slot * 0.85;
  const yFor = (count: number) => FLOOR - (count / yMax) * PLOT_H;
  const xAt = (v: number) => PL + ((v - histMin) / span) * PLOT_W;

  // Horizontal gridlines at quarters of the clean max.
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  // Boundary labels every 2 buckets (10 points for 5-point buckets);
  // every 4 in compact so labels never collide at phone widths.
  const tickVals: number[] = [];
  for (let v = histMin; v <= histMax; v += (histogram[0].to - histogram[0].from) * (compact ? 4 : 2)) {
    tickVals.push(v);
  }
  if (tickVals[tickVals.length - 1] !== histMax) tickVals.push(histMax);

  // Neutral marker only when 50 falls inside the rendered range — its x is
  // COMPUTED from the bucket range, never a fixed coordinate.
  const neutralX = histMin < 50 && 50 < histMax ? xAt(50) : null;

  const total = histogram.reduce((a, b) => a + b.count, 0);

  // Pointer → bucket index (viewBox coords via the rendered rect ratio).
  const snap = (clientX: number, clientY: number): number | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const vx = (clientX - rect.left) * (W / rect.width);
    const vy = (clientY - rect.top) * (H / rect.height);
    if (vx < PL || vx > W - PR || vy > FLOOR + 20) return null;
    const i = Math.floor((vx - PL) / slot);
    return i >= 0 && i < histogram.length ? i : null;
  };
  const handlers = {
    onPointerMove: (e: React.PointerEvent) => setHover(snap(e.clientX, e.clientY)),
    onPointerDown: (e: React.PointerEvent) => setHover(snap(e.clientX, e.clientY)),
    onPointerLeave: () => setHover(null),
    onPointerCancel: () => setHover(null),
  };

  const hb = hover !== null ? histogram[hover] : null;

  return (
    <div className={s.chartWrap}>
    <svg
      ref={svgRef}
      className={s.chart}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Distribution of sentiment scores across ${total} names`}
      {...handlers}
    >
      <g stroke="#f1f3f6" strokeWidth={1}>
        {gridVals.map((v) => (
          <line key={v} x1={PL} x2={W - PR} y1={yFor(v)} y2={yFor(v)} />
        ))}
      </g>
      <g fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10} fill="#8a919e" textAnchor="end">
        {gridVals.map((v) => (
          <text key={v} x={PL - 9} y={yFor(v) + 3.5}>{v}</text>
        ))}
      </g>

      {histogram.map((b, i) => {
        if (b.count === 0) return null;
        const y = yFor(b.count);
        const h = Math.max(1, FLOOR - y);
        const below = b.to <= 50;
        const isHovered = hover === i;
        const shared = {
          x: PL + i * slot + (slot - barW) / 2,
          width: barW,
          rx: h < 6 ? 1 : 1.5,
          fill: below ? '#cf202f' : '#05b169',
          opacity: isHovered ? 1 : 0.72,
          stroke: isHovered ? '#0a0b0d' : 'none',
          strokeWidth: isHovered ? 0.75 : 0,
        } as const;
        // Reduced motion: plain static rects, final state.
        if (reduced) return <rect key={b.from} {...shared} y={FLOOR - h} height={h} />;
        // Bars grow up out of the floor baseline (animate y+height — scaleY
        // fights SVG transform-origin), with a left-to-right micro-stagger.
        return (
          <motion.rect
            key={b.from}
            {...shared}
            initial={false}
            animate={shouldDraw ? { y: FLOOR - h, height: h } : { y: FLOOR, height: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 + i * 0.04 }}
          />
        );
      })}

      {neutralX !== null && (
        <>
          <line x1={neutralX} x2={neutralX} y1={TOP} y2={FLOOR} stroke="#0a0b0d" strokeWidth={1} strokeDasharray="3 3" opacity={0.45} />
          <text x={neutralX - 6} y={TOP + 12} textAnchor="end" fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10} fill="#5b616e">
            neutral 50
          </text>
        </>
      )}
      <line x1={PL} x2={W - PR} y1={FLOOR} y2={FLOOR} stroke="#c9cfd8" strokeWidth={1} />

      <g fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10} fill="#8a919e">
        {tickVals.map((v, i) => (
          <text
            key={v}
            x={xAt(v)}
            y={FLOOR + 18}
            textAnchor={i === 0 ? 'start' : i === tickVals.length - 1 ? 'end' : 'middle'}
          >
            {v}
          </text>
        ))}
      </g>
    </svg>
    {hb && hover !== null && (
      <ChartTooltip
        xFrac={(PL + hover * slot + slot / 2) / W}
        title={`score ${hb.from}–${hb.to}`}
        rows={[
          { label: 'Names', value: String(hb.count) },
          {
            label: 'Share',
            value: total > 0 ? `${((hb.count / total) * 100).toFixed(1)}%` : '—',
          },
          {
            swatch: hb.to <= 50 ? '#cf202f' : '#05b169',
            label: 'Zone',
            value: hb.to <= 50 ? 'below neutral' : 'at/above neutral',
          },
        ]}
      />
    )}
    </div>
  );
}
