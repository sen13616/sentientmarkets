import { HistoryPayload } from '../types';

/* Shared data-gap rendering: a whisper-quiet flat band with dashed boundary
   rules and (when it fits) a centered "no data · N days" label. Replaces the
   old 50%-coverage hatch pattern, which made the ABSENCE of data the loudest
   object on the page. */
export default function GapBands({
  gaps,
  xAt,
  top,
  height,
}: {
  gaps: HistoryPayload['gaps'];
  xAt: (ms: number) => number;
  top: number;
  height: number;
}) {
  return (
    <>
      {gaps.map((g, i) => {
        const x0 = xAt(new Date(g.from).getTime());
        const x1 = xAt(new Date(g.to).getTime());
        const w = Math.max(0, x1 - x0);
        const days = Math.round(g.hours / 24);
        const label = `no data · ${days} day${days === 1 ? '' : 's'}`;
        // ~6px per mono char at font-size 10; omit rather than overflow.
        const labelFits = w > label.length * 6 + 14;
        return (
          <g key={i}>
            <rect x={x0} y={top} width={w} height={height} fill="rgba(10,11,13,0.035)" />
            <line x1={x0} x2={x0} y1={top} y2={top + height} stroke="#d9dee8" strokeDasharray="3 3" />
            <line x1={x1} x2={x1} y1={top} y2={top + height} stroke="#d9dee8" strokeDasharray="3 3" />
            {/* Label parked at the TOP of the band so it never collides with
                the zero / neutral lines that cross the vertical centre. */}
            {labelFits && (
              <text
                x={(x0 + x1) / 2}
                y={top + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#8a919e"
                fontFamily="var(--font-jetbrains-mono), monospace"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
