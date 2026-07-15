import { HistoryPayload } from '../types';
import { clamp, fmtShortDate } from '@/lib/stockMath';
import { labelIndices, makeScale } from './chartUtils';

const W = 470, H = 190, PL = 34, PR = 8, PT = 10, PB = 22;
const LIMIT = 6;

/* Raw minus smoothed score per point, clamped to ±6 — green above trend,
   red below. Gap windows are hatched and produce no bars. */
export default function PressureChart({ history, hatchId }: { history: HistoryPayload; hatchId: string }) {
  const { points, gaps } = history;
  if (points.length === 0) return null;

  const s = makeScale(points, { W, H, PL, PR, PT, PB, yMin: -LIMIT, yMax: LIMIT });
  const barW = Math.max(2, ((W - PL - PR) / Math.max(points.length, 1)) * 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Short-term pressure chart">
      <defs>
        <pattern id={hatchId} width="6" height="6" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f4f6f9" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#e2e7ee" strokeWidth="3" />
        </pattern>
      </defs>
      {[-6, -3, 0, 3, 6].map((g) => (
        <g key={g}>
          <line x1={PL} x2={W - PR} y1={s.y(g)} y2={s.y(g)} stroke={g === 0 ? '#dfe2e7' : '#f1f3f6'} strokeWidth={1} />
          <text x={PL - 7} y={s.y(g) + 4} textAnchor="end" fontSize={10.5} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
            {(g > 0 ? '+' : '') + g}
          </text>
        </g>
      ))}
      {gaps.map((g, i) => {
        const x0 = s.xAt(new Date(g.from).getTime());
        const x1 = s.xAt(new Date(g.to).getTime());
        return <rect key={i} x={x0} y={PT} width={Math.max(0, x1 - x0)} height={H - PT - PB} fill={`url(#${hatchId})`} />;
      })}
      {points.map((p, i) => {
        if (p.score === null || p.score_raw === null) return null;
        const v = clamp(p.score_raw - p.score, -LIMIT, LIMIT);
        const y0 = s.y(0);
        const y1 = s.y(v);
        return (
          <rect
            key={i}
            x={s.x(i) - barW / 2}
            y={Math.min(y0, y1)}
            width={barW}
            height={Math.max(0.5, Math.abs(y1 - y0))}
            rx={1.5}
            fill={v >= 0 ? '#05b169' : '#cf202f'}
            opacity={0.85}
          />
        );
      })}
      {labelIndices(points.length, 5).map((i) => (
        <text key={i} x={s.x(i)} y={H - 6} textAnchor="middle" fontSize={10.5} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
          {fmtShortDate(points[i].t)}
        </text>
      ))}
    </svg>
  );
}
