'use client';

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { HistoryPayload } from '../types';
import { CHANNEL_ORDER, stackContributions, fmtPointDate, fmtShortDate } from '@/lib/stockMath';
import { labelIndices, makeScale } from './chartUtils';
import GapBands from './GapBands';
import ChartTooltip from './ChartTooltip';
import useChartHover from './useChartHover';
import css from '../stockpage.module.css';

// PR reserves room for the final centered x tick (Part B: no clipping).
const W = 960, H = 280, PL = 42, PR = 40, PT = 12, PB = 26;

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

/* Weighted per-channel contributions stacked to the raw composite, drawn per
   gap segment (stacks never bridge a gap), with a faint composite outline.
   No draw-in by design — the card's Reveal covers it; range switches
   crossfade the stack. */
export default function DriversChart({ history }: { history: HistoryPayload }) {
  const { points, segments, gaps } = history;
  const svgRef = useRef<SVGSVGElement>(null);

  const geom = useMemo(() => {
    // Per-point channel contributions (renormalized over present layers).
    const contribs = points.map((p) => {
      const rows = stackContributions(p.sub, p.missing_layers);
      const byKey: Record<string, number> = {};
      for (const r of rows) byKey[r.key] = r.value;
      return byKey;
    });
    const totals = contribs.map((c) => Object.values(c).reduce((a, b) => a + b, 0));
    const yMax = Math.min(100, Math.ceil((Math.max(...totals, 50) + 5) / 5) * 5);
    const s = makeScale(points, { W, H, PL, PR, PT, PB, yMin: 0, yMax });
    const grid: number[] = [];
    for (let g = 0; g <= yMax; g += yMax / 4) grid.push(g);
    const hoverXs = points
      .map((_, i) => ({ i, x: s.x(i), ok: Object.keys(contribs[i]).length > 0 }))
      .filter((e) => e.ok)
      .map(({ i, x }) => ({ i, x }));
    return { contribs, totals, s, grid, hoverXs };
  }, [points]);

  const { hover, handlers } = useChartHover({ svgRef, xs: geom.hoverXs, viewBoxWidth: W });

  if (points.length === 0) return null;
  const { contribs, totals, s, grid } = geom;

  const areas: JSX.Element[] = [];
  const outlines: JSX.Element[] = [];
  segments.forEach(([a, b], si) => {
    if (b <= a) return; // an area needs at least two points
    const base = new Array(points.length).fill(0);
    for (const key of CHANNEL_ORDER) {
      let d = '';
      for (let i = a; i <= b; i++) d += `${i === a ? 'M' : 'L'}${s.x(i).toFixed(1)} ${s.y(base[i] + (contribs[i][key] ?? 0)).toFixed(1)} `;
      for (let i = b; i >= a; i--) d += `L${s.x(i).toFixed(1)} ${s.y(base[i]).toFixed(1)} `;
      areas.push(<path key={`${si}-${key}`} d={`${d}Z`} fill={COLORS[key]} opacity={key === 'market' ? 0.92 : 1} />);
      for (let i = a; i <= b; i++) base[i] += contribs[i][key] ?? 0;
    }
    let outline = '';
    for (let i = a; i <= b; i++) outline += `${i === a ? 'M' : 'L'}${s.x(i).toFixed(1)} ${s.y(base[i]).toFixed(1)} `;
    outlines.push(<path key={`o-${si}`} d={outline} fill="none" stroke="#0a0b0d" strokeWidth={1} opacity={0.35} />);
  });

  const hp = hover ? contribs[hover.i] : null;

  return (
    <div className={css.chartWrap}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sentiment drivers chart" {...handlers}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={PL} x2={W - PR} y1={s.y(g)} y2={s.y(g)} stroke="#f1f3f6" strokeWidth={1} />
            <text x={PL - 8} y={s.y(g) + 4} textAnchor="end" fontSize={11} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
              {Math.round(g)}
            </text>
          </g>
        ))}
        {labelIndices(s.n).map((i, idx, arr) => (
          <text
            key={i}
            x={s.x(i)}
            y={H - 8}
            textAnchor={idx === 0 ? 'start' : idx === arr.length - 1 ? 'end' : 'middle'}
            fontSize={11}
            fill="#8a919e"
            fontFamily="var(--font-jetbrains-mono), monospace"
          >
            {fmtShortDate(points[i].t)}
          </text>
        ))}
        <GapBands gaps={gaps} xAt={s.xAt} top={PT} height={H - PT - PB} />
        {/* Range switches crossfade the stack (250ms); no draw-in by design. */}
        <motion.g
          key={history.days}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {areas}
          {outlines}
        </motion.g>
        {hover && (
          <line pointerEvents="none" x1={hover.x} x2={hover.x} y1={PT} y2={H - PB} stroke="#c9cfd8" strokeWidth={1} />
        )}
      </svg>
      {hover && hp && (
        <ChartTooltip
          xFrac={hover.x / W}
          title={fmtPointDate(points[hover.i].t, history.interval)}
          rows={[
            ...CHANNEL_ORDER.map((key) => ({
              swatch: COLORS[key],
              label: LABELS[key],
              value: hp[key] !== undefined ? `+${hp[key].toFixed(1)}` : '—',
            })),
            { label: 'Total', value: totals[hover.i].toFixed(1) },
          ]}
        />
      )}
    </div>
  );
}
