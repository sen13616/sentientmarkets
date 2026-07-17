'use client';

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { HistoryPayload } from '../types';
import { clamp, fmtPointDate, fmtShortDate } from '@/lib/stockMath';
import { labelIndices, makeScale } from './chartUtils';
import GapBands from './GapBands';
import ChartTooltip from './ChartTooltip';
import useChartHover from './useChartHover';
import useDrawIn from './useDrawIn';
import css from '../stockpage.module.css';

// PR reserves room for the final centered x tick (Part B: no clipping).
const W = 470, H = 190, PL = 34, PR = 26, PT = 10, PB = 22;
const LIMIT = 6;

/* Raw minus smoothed score per point, clamped to ±6 — green above trend,
   red below. Bars grow from the zero line once on first scroll into view
   (this chart is pinned to the initial 30D payload, so no replay risk). */
export default function PressureChart({ history }: { history: HistoryPayload }) {
  const { points, gaps } = history;
  const svgRef = useRef<SVGSVGElement>(null);
  const { shouldDraw, reduced } = useDrawIn(svgRef);

  const geom = useMemo(() => {
    const s = makeScale(points, { W, H, PL, PR, PT, PB, yMin: -LIMIT, yMax: LIMIT });
    const barW = Math.max(2, ((W - PL - PR) / Math.max(points.length, 1)) * 0.55);
    const hoverXs = points
      .map((p, i) => ({ i, x: s.x(i), ok: p.score !== null && p.score_raw !== null }))
      .filter((e) => e.ok)
      .map(({ i, x }) => ({ i, x }));
    return { s, barW, hoverXs };
  }, [points]);

  const { hover, handlers } = useChartHover({ svgRef, xs: geom.hoverXs, viewBoxWidth: W });

  if (points.length === 0) return null;
  const { s, barW } = geom;
  const ticks = labelIndices(points.length, 5);
  const hoverPoint = hover ? points[hover.i] : null;
  const hoverGap =
    hoverPoint && hoverPoint.score !== null && hoverPoint.score_raw !== null
      ? hoverPoint.score_raw - hoverPoint.score
      : null;

  return (
    <div className={`${css.chartWrap} ${css.chartWrapSm}`}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Short-term pressure chart" {...handlers}>
        {[-6, -3, 3, 6].map((g) => (
          <line key={g} x1={PL} x2={W - PR} y1={s.y(g)} y2={s.y(g)} stroke="#f1f3f6" strokeWidth={1} />
        ))}
        {[-6, -3, 0, 3, 6].map((g) => (
          <text key={g} x={PL - 7} y={s.y(g) + 4} textAnchor="end" fontSize={10.5} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
            {(g > 0 ? '+' : '') + g}
          </text>
        ))}
        <GapBands gaps={gaps} xAt={s.xAt} top={PT} height={H - PT - PB} />
        {points.map((p, i) => {
          if (p.score === null || p.score_raw === null) return null;
          const v = clamp(p.score_raw - p.score, -LIMIT, LIMIT);
          const y0 = s.y(0);
          const y1 = s.y(v);
          const finalY = Math.min(y0, y1);
          const finalH = Math.max(0.5, Math.abs(y1 - y0));
          const isHovered = hover?.i === i;
          const shared = {
            x: s.x(i) - barW / 2,
            width: barW,
            rx: 1.5,
            fill: v >= 0 ? '#05b169' : '#cf202f',
            opacity: isHovered ? 1 : 0.85,
            stroke: isHovered ? '#0a0b0d' : 'none',
            strokeWidth: isHovered ? 0.75 : 0,
          } as const;
          // Reduced motion: plain static rects, final state.
          if (reduced) return <rect key={i} {...shared} y={finalY} height={finalH} />;
          // Bars grow out of the zero line (animate y+height — scaleY fights
          // SVG transform-origin), with a per-bar micro-stagger.
          return (
            <motion.rect
              key={i}
              {...shared}
              initial={false}
              animate={shouldDraw ? { y: finalY, height: finalH } : { y: y0, height: 0.5 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 + i * 0.012 }}
            />
          );
        })}
        {/* Zero line drawn after the bars so it reads above them. */}
        <line x1={PL} x2={W - PR} y1={s.y(0)} y2={s.y(0)} stroke="#c9cfd8" strokeWidth={1} />
        {hover && (
          <line pointerEvents="none" x1={hover.x} x2={hover.x} y1={PT} y2={H - PB} stroke="#c9cfd8" strokeWidth={1} />
        )}
        {/* Edge ticks anchor to their edge so no label can clip the viewBox. */}
        {ticks.map((i, idx) => (
          <text
            key={i}
            x={s.x(i)}
            y={H - 6}
            textAnchor={idx === 0 ? 'start' : idx === ticks.length - 1 ? 'end' : 'middle'}
            fontSize={10.5}
            fill="#8a919e"
            fontFamily="var(--font-jetbrains-mono), monospace"
          >
            {fmtShortDate(points[i].t)}
          </text>
        ))}
      </svg>
      {hover && hoverPoint && hoverGap !== null && (
        <ChartTooltip
          xFrac={hover.x / W}
          title={fmtPointDate(hoverPoint.t, history.interval)}
          rows={[
            {
              label: 'Gap (raw − smoothed)',
              value: `${hoverGap >= 0 ? '+' : ''}${hoverGap.toFixed(1)}`,
              valueClass: hoverGap > 0 ? css.pos : hoverGap < 0 ? css.neg : undefined,
            },
          ]}
        />
      )}
    </div>
  );
}
