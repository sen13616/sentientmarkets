import { HistoryPayload } from '../types';
import { CHANNEL_ORDER, stackContributions, fmtShortDate } from '@/lib/stockMath';
import { labelIndices, makeScale } from './chartUtils';

const W = 960, H = 280, PL = 42, PR = 10, PT = 12, PB = 26;

const COLORS: Record<string, string> = {
  market: '#0052ff',
  narrative: '#5e8bff',
  influencer: '#a8c0ff',
  macro: '#d9dee8',
};

/* Weighted per-channel contributions stacked to the raw composite, drawn per
   gap segment (stacks never bridge a gap), with a faint composite outline. */
export default function DriversChart({ history, hatchId }: { history: HistoryPayload; hatchId: string }) {
  const { points, segments, gaps } = history;
  if (points.length === 0) return null;

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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sentiment drivers chart">
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
      {areas}
      {outlines}
    </svg>
  );
}
