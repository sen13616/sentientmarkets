import { HistoryPayload } from '../types';
import { buildLinePath, fmtShortDate } from '@/lib/stockMath';
import { labelIndices, makeScale, yDomain } from './chartUtils';

const W = 960, H = 300, PL = 42, PR = 10, PT = 12, PB = 26;

/* Smoothed composite (solid blue) over raw composite (dashed underlay),
   neutral-50 dashline, hatched rects over data gaps. Never draws across a
   gap — paths are built per segment. */
export default function HistoryChart({ history, hatchId }: { history: HistoryPayload; hatchId: string }) {
  const { points, segments, gaps } = history;
  if (points.length === 0) return null;

  const scores = points.map((p) => p.score);
  const raws = points.map((p) => p.score_raw);
  const [yMin, yMax] = yDomain([...scores, ...raws]);
  const s = makeScale(points, { W, H, PL, PR, PT, PB, yMin, yMax });

  const grid: number[] = [];
  for (let g = yMin; g <= yMax; g += (yMax - yMin) / 4) grid.push(g);

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sentiment history chart">
      <defs>
        <pattern id={hatchId} width="6" height="6" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f4f6f9" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#e2e7ee" strokeWidth="3" />
        </pattern>
      </defs>
      {grid.map((g) => (
        <g key={g}>
          <line x1={PL} x2={W - PR} y1={s.y(g)} y2={s.y(g)} stroke="#f1f3f6" strokeWidth={1} />
          <text x={PL - 8} y={s.y(g) + 4} textAnchor="end" fontSize={11} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
            {Math.round(g)}
          </text>
        </g>
      ))}
      {labelIndices(s.n).map((i) => (
        <text key={i} x={s.x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#8a919e" fontFamily="var(--font-jetbrains-mono), monospace">
          {fmtShortDate(points[i].t)}
        </text>
      ))}
      {gaps.map((g, i) => {
        const x0 = s.xAt(new Date(g.from).getTime());
        const x1 = s.xAt(new Date(g.to).getTime());
        return <rect key={i} x={x0} y={PT} width={Math.max(0, x1 - x0)} height={H - PT - PB} fill={`url(#${hatchId})`} />;
      })}
      <line x1={PL} x2={W - PR} y1={s.y(50)} y2={s.y(50)} stroke="#dfe2e7" strokeWidth={1} strokeDasharray="2 4" />
      <path d={buildLinePath(raws, segments, s.x, s.y)} fill="none" stroke="#b8c8f0" strokeWidth={1.4} strokeDasharray="3 4" />
      <path d={buildLinePath(scores, segments, s.x, s.y)} fill="none" stroke="#0052ff" strokeWidth={2.2} strokeLinejoin="round" />
      {last.score !== null && (
        <>
          <circle cx={s.x(s.n - 1)} cy={s.y(last.score)} r={4} fill="#0052ff" />
          <text x={s.x(s.n - 1) - 10} y={s.y(last.score) - 10} textAnchor="end" fontSize={12} fontFamily="var(--font-jetbrains-mono), monospace" fill="#0a0b0d">
            {last.score.toFixed(1)}
          </text>
        </>
      )}
    </svg>
  );
}
