'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SectorRow } from '../types';
import ChartTooltip from './ChartTooltip';
import useDrawIn from './useDrawIn';
import s from '../indexpage.module.css';

const W = 1000;
const LABEL_R = 188;      // sector names, right-aligned into a fixed gutter
const PLOT_L = 205;       // plot starts right of the gutter — left-extending
const PLOT_R = 890;       //   (bearish) bars can never collide with labels
const NAMES_X = 980;      // "N names" column
const ROW_H = 28, BAR_H = 16, TOP = 12;

/* Horizontal sector bars measured from the 50 baseline: right and blue when
   the sector mean is >= 50, LEFT and red when it is below (the mockup's
   snapshot has no bearish sector; the geometry must). The x-domain, the
   baseline position, and the universe-mean marker are all computed. */
export default function SectorChart({
  sectors,
  mean,
}: {
  sectors: SectorRow[];
  mean: number | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { shouldDraw, reduced } = useDrawIn(svgRef);
  const [hover, setHover] = useState<number | null>(null); // row index

  const rows = sectors
    .filter((r): r is SectorRow & { average_score: number } => r.average_score !== null)
    .sort((a, b) => b.average_score - a.average_score);
  if (rows.length === 0) return null;

  const n = rows.length;
  const plotBottom = TOP + n * ROW_H - 12;
  const H = plotBottom + 42;

  const scores = rows.map((r) => r.average_score);
  // Dynamic domain, always containing the 50 baseline with margin.
  const xMin = Math.min(Math.floor(Math.min(...scores)) - 1, 48);
  const xMax = Math.max(Math.ceil(Math.max(...scores)) + 1, 62);
  const xAt = (v: number) => PLOT_L + ((v - xMin) / (xMax - xMin)) * (PLOT_R - PLOT_L);
  const baseX = xAt(50);
  const meanX = mean !== null ? xAt(mean) : null;

  // Vertical gridlines + ticks every 2 score points; skip ticks that would
  // sit under the baseline "50" or the universe-mean label.
  const ticks: number[] = [];
  for (let v = Math.ceil(xMin / 2) * 2; v <= xMax; v += 2) ticks.push(v);
  // The mean label renders rightward from meanX (+5, ~110px wide) — skip
  // ticks inside that span, not just a symmetric radius.
  const labelled = ticks.filter(
    (v) =>
      v !== 50 &&
      (meanX === null || xAt(v) < meanX - 25 || xAt(v) > meanX + 130) &&
      xAt(v) >= PLOT_L - 1 && xAt(v) <= PLOT_R + 1,
  );

  const opacityFor = (i: number) => (n > 1 ? 1 - (i / (n - 1)) * 0.5 : 1);

  // Pointer → row index (viewBox coords via the rendered rect ratio).
  const snap = (clientY: number): number | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return null;
    const vy = (clientY - rect.top) * (H / rect.height);
    const i = Math.floor((vy - TOP + (ROW_H - BAR_H) / 2) / ROW_H);
    return i >= 0 && i < n ? i : null;
  };
  const handlers = {
    onPointerMove: (e: React.PointerEvent) => setHover(snap(e.clientY)),
    onPointerDown: (e: React.PointerEvent) => setHover(snap(e.clientY)),
    onPointerLeave: () => setHover(null),
    onPointerCancel: () => setHover(null),
  };

  const hr = hover !== null ? rows[hover] : null;

  return (
    <div className={s.chartWrap}>
    <svg
      ref={svgRef}
      className={s.chart}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mean sentiment score by sector"
      {...handlers}
    >
      <g stroke="#f1f3f6" strokeWidth={1}>
        {ticks.filter((v) => v !== 50).map((v) => (
          <line key={v} x1={xAt(v)} x2={xAt(v)} y1={TOP - 4} y2={plotBottom} />
        ))}
      </g>

      {rows.map((r, i) => {
        const bullish = r.average_score >= 50;
        const endX = xAt(r.average_score);
        const y = TOP + i * ROW_H;
        const barX = bullish ? baseX : endX;
        const barW = Math.max(1, Math.abs(endX - baseX));
        const isHovered = hover === i;
        const barShared = {
          y,
          height: BAR_H,
          rx: 2.5,
          fill: bullish ? '#0052ff' : '#cf202f',
          opacity: isHovered ? 1 : opacityFor(i),
          stroke: isHovered ? '#0a0b0d' : 'none',
          strokeWidth: isHovered ? 0.75 : 0,
        } as const;
        return (
          <g key={r.sector ?? i}>
            {/* Bars sweep out of the 50 baseline — right for bullish, LEFT
                for bearish (animate x+width together; both states set so
                nothing is left un-reset). Reduced motion: static rects. */}
            {reduced ? (
              <rect {...barShared} x={barX} width={barW} />
            ) : (
              <motion.rect
                {...barShared}
                initial={false}
                animate={shouldDraw ? { x: barX, width: barW } : { x: baseX, width: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.05 }}
              />
            )}
            <text x={LABEL_R} y={y + 12} textAnchor="end" fontFamily="var(--font-inter), sans-serif" fontSize={12.5} fill="#0a0b0d">
              {r.sector}
            </text>
            <motion.text
              x={bullish ? endX + 10 : endX - 8}
              y={y + 12}
              textAnchor={bullish ? 'start' : 'end'}
              fontFamily="var(--font-jetbrains-mono), monospace"
              fontSize={12}
              fill="#0a0b0d"
              initial={false}
              animate={{ opacity: reduced || shouldDraw ? 1 : 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.3, delay: 0.35 + i * 0.05 }}
            >
              {r.average_score.toFixed(1)}
            </motion.text>
            {r.size !== null && (
              <text x={NAMES_X} y={y + 12} textAnchor="end" fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10.5} fill="#8a919e">
                {r.size} names
              </text>
            )}
          </g>
        );
      })}

      {/* universe mean — dashed, positioned from stats.mean */}
      {meanX !== null && mean !== null && (
        <>
          <line x1={meanX} x2={meanX} y1={TOP - 4} y2={plotBottom} stroke="#0a0b0d" strokeWidth={1} strokeDasharray="3 3" opacity={0.45} />
          <text x={meanX + 5} y={plotBottom + 14} fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10} fill="#5b616e">
            universe mean {mean.toFixed(1)}
          </text>
        </>
      )}

      {/* the 50 baseline bars grow from */}
      <line x1={baseX} x2={baseX} y1={TOP - 4} y2={plotBottom} stroke="#c9cfd8" strokeWidth={1} />
      <text x={baseX} y={plotBottom + 14} textAnchor="middle" fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10} fill="#8a919e">
        50
      </text>

      <g fontFamily="var(--font-jetbrains-mono), monospace" fontSize={10} fill="#8a919e">
        {labelled.map((v, i) => (
          <text
            key={v}
            x={xAt(v)}
            y={plotBottom + 14}
            textAnchor={i === 0 ? 'start' : i === labelled.length - 1 ? 'end' : 'middle'}
          >
            {v}
          </text>
        ))}
      </g>
    </svg>
    {hr && hover !== null && (
      <ChartTooltip
        xFrac={xAt(hr.average_score) / W}
        yFrac={(TOP + hover * ROW_H) / H}
        title={hr.sector ?? '—'}
        rows={[
          { label: 'Mean score', value: hr.average_score.toFixed(1) },
          ...(mean !== null
            ? [{
                label: 'vs universe',
                value: `${hr.average_score - mean >= 0 ? '+' : ''}${(hr.average_score - mean).toFixed(1)}`,
                valueClass: hr.average_score - mean >= 0 ? s.pos : s.neg,
              }]
            : []),
          ...(hr.size !== null ? [{ label: 'Names', value: String(hr.size) }] : []),
        ]}
      />
    )}
    </div>
  );
}
