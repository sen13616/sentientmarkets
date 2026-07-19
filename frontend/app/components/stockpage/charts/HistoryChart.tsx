'use client';

import { useId, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { HistoryPayload, PricePoint } from '../types';
import { buildLinePath, fmtPointDate, fmtShortDate } from '@/lib/stockMath';
import { labelIndices, makeScale, yDomain } from './chartUtils';
import GapBands from './GapBands';
import ChartTooltip from './ChartTooltip';
import useChartHover from './useChartHover';
import useCompactChart from './useCompactChart';
import useDrawIn from './useDrawIn';
import css from '../stockpage.module.css';

// PR reserves room so the final centered x tick and the endpoint value label
// stay inside the 960 viewBox instead of clipping. The compact set trades
// that gutter for label legibility at phone widths (price labels move
// inside the plot there, so nothing renders past the viewBox).
const DESKTOP = { W: 960, H: 300, PL: 42, PR: 40, PT: 12, PB: 26 };
const COMPACT = { W: 390, H: 260, PL: 30, PR: 8, PT: 12, PB: 24 };

/* Smoothed composite (solid blue) over raw composite (dashed underlay),
   neutral-50 dashline, quiet flat bands over data gaps. Draws in with a
   one-shot left-to-right clip wipe (handles the dashed underlay + endpoint
   in one go — a dashoffset trick would destroy the dash pattern); range
   switches crossfade the data only, never replaying the wipe. */
export default function HistoryChart({
  history,
  priceSeries,
}: {
  history: HistoryPayload;
  priceSeries?: PricePoint[] | null;
}) {
  const { points, segments, gaps } = history;
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const { shouldDraw, reduced } = useDrawIn(svgRef);
  const compact = useCompactChart();
  const { W, H, PL, PR, PT, PB } = compact ? COMPACT : DESKTOP;
  const PLOT_W = W - PL - PR;

  const geom = useMemo(() => {
    const scores = points.map((p) => p.score);
    const raws = points.map((p) => p.score_raw);
    const [yMin, yMax] = yDomain([...scores, ...raws]);
    const s = makeScale(points, { W, H, PL, PR, PT, PB, yMin, yMax });
    const grid: number[] = [];
    for (let g = yMin; g <= yMax; g += (yMax - yMin) / 4) grid.push(g);
    return {
      s,
      grid,
      rawPath: buildLinePath(raws, segments, s.x, s.y),
      scorePath: buildLinePath(scores, segments, s.x, s.y),
      hoverXs: points
        .map((p, i) => ({ i, x: s.x(i), ok: p.score !== null }))
        .filter((e) => e.ok)
        .map(({ i, x }) => ({ i, x })),
    };
  }, [points, segments, W, H, PL, PR, PT, PB]);

  /* Price overlay geometry: its own right-axis scale, and ONE continuous
     path — price trades straight through sentiment outages, so the line
     honestly bridges the gap band instead of being segmented by it. */
  const priceGeom = useMemo(() => {
    if (!priceSeries || priceSeries.length < 2) return null;
    const { s } = geom;
    const pts = priceSeries.filter((p) => {
      const x = s.xAt(p.t);
      return x >= PL - 0.5 && x <= W - PR + 0.5;
    });
    if (pts.length < 2) return null;
    const closes = pts.map((p) => p.close);
    const dataLo = Math.min(...closes);
    const dataHi = Math.max(...closes);
    const pad = (dataHi - dataLo) * 0.04 || Math.abs(dataHi) * 0.02 || 1;
    const lo = dataLo - pad;
    const hi = dataHi + pad;
    const y = (v: number) => PT + (H - PT - PB) * (1 - (v - lo) / (hi - lo));
    let d = '';
    pts.forEach((p, i) => {
      d += `${i === 0 ? 'M' : 'L'}${s.xAt(p.t).toFixed(1)} ${y(p.close).toFixed(1)} `;
    });
    return { pts, y, d, labels: [dataLo, (dataLo + dataHi) / 2, dataHi] };
  }, [priceSeries, geom, W, H, PL, PR, PT, PB]);

  const { hover, handlers } = useChartHover({ svgRef, xs: geom.hoverXs, viewBoxWidth: W });

  if (points.length === 0) return null;
  const { s, grid } = geom;
  const last = points[points.length - 1];
  const hoverPoint = hover ? points[hover.i] : null;

  // Tooltip price row: nearest observation by time, ≤36h away, else em-dash.
  let priceRow: { label: string; value: string } | null = null;
  if (priceGeom && hoverPoint) {
    const t = Date.parse(hoverPoint.t);
    let best: PricePoint | null = null;
    for (const p of priceGeom.pts) {
      if (!best || Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
    }
    priceRow = {
      label: 'Price',
      value: best && Math.abs(best.t - t) <= 36 * 3600e3 ? `$${best.close.toFixed(2)}` : '—',
    };
  }

  return (
    <div className={css.chartWrap}>
      {/* overflow visible: the price-axis labels sit just past the viewBox
          right edge, in the card's padding gutter, clear of the plot lines. */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible' }}
        role="img"
        aria-label="Sentiment history chart"
        {...handlers}
      >
        <defs>
          <clipPath id={clipId}>
            <motion.rect
              x={PL}
              y={0}
              height={H}
              initial={false}
              animate={{ width: reduced || shouldDraw ? PLOT_W + PR : 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            />
          </clipPath>
        </defs>
        {grid.map((g) => (
          <g key={g}>
            <line x1={PL} x2={W - PR} y1={s.y(g)} y2={s.y(g)} stroke="#f1f3f6" strokeWidth={1} />
            <text x={PL - 8} y={s.y(g) + 4} textAnchor="end" fontSize={11} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
              {Math.round(g)}
            </text>
          </g>
        ))}
        {labelIndices(s.n, compact ? 3 : 6).map((i, idx, arr) => (
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
        <line x1={PL} x2={W - PR} y1={s.y(50)} y2={s.y(50)} stroke="#dfe2e7" strokeWidth={1} strokeDasharray="2 4" />
        <g clipPath={`url(#${clipId})`}>
          {/* Keyed by range: swapping 7/30/90D replays only this 250ms
              opacity settle — the clip rect lives outside, so the wipe
              never replays. */}
          <motion.g
            key={history.days}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <path d={geom.rawPath} fill="none" stroke="#b8c8f0" strokeWidth={1.4} strokeDasharray="3 4" />
            <path d={geom.scorePath} fill="none" stroke="#0052ff" strokeWidth={2.2} strokeLinejoin="round" />
            {last.score !== null && (
              <>
                <circle cx={s.x(s.n - 1)} cy={s.y(last.score)} r={4} fill="#0052ff" />
                <text x={s.x(s.n - 1) - 10} y={s.y(last.score) - 10} textAnchor="end" fontSize={12} fontFamily="var(--font-jetbrains-mono), monospace" fill="#0a0b0d">
                  {last.score.toFixed(1)}
                </text>
              </>
            )}
          </motion.g>
          {/* Price overlay — inside the clip (drawn by the same wipe) but
              OUTSIDE the range-keyed crossfade: it fades in once on toggle
              and re-renders silently on range switches. */}
          {priceGeom && (
            <motion.path
              d={priceGeom.d}
              fill="none"
              stroke="#8a919e"
              strokeWidth={1.6}
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          )}
        </g>
        {/* Right price axis — only while the overlay is on. Desktop: just
            past the viewBox edge in the card's padding gutter (overflow is
            visible); compact: inside the plot so nothing escapes the phone
            viewport. */}
        {priceGeom && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {priceGeom.labels.map((v, i) => (
              <text
                key={i}
                x={compact ? W - 4 : W + 12}
                y={priceGeom.y(v) + 4}
                textAnchor="end"
                fontSize={10.5}
                fill="#8a919e"
                fontFamily="var(--font-jetbrains-mono), monospace"
              >
                {`$${v.toFixed(v >= 1000 ? 0 : 2)}`}
              </text>
            ))}
          </motion.g>
        )}
        {/* Crosshair — outside the clip so hover works mid-wipe. */}
        {hover && hoverPoint && hoverPoint.score !== null && (
          <g pointerEvents="none">
            <line x1={hover.x} x2={hover.x} y1={PT} y2={H - PB} stroke="#c9cfd8" strokeWidth={1} />
            <circle cx={hover.x} cy={s.y(hoverPoint.score)} r={3.5} fill="#0052ff" stroke="#fff" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {hover && hoverPoint && (
        <ChartTooltip
          xFrac={hover.x / W}
          title={fmtPointDate(hoverPoint.t, history.interval)}
          rows={[
            { label: 'Smoothed', value: hoverPoint.score !== null ? hoverPoint.score.toFixed(1) : '—' },
            { label: 'Raw', value: hoverPoint.score_raw !== null ? hoverPoint.score_raw.toFixed(1) : '—' },
            ...(priceRow ? [priceRow] : []),
          ]}
        />
      )}
    </div>
  );
}
