import { HistoryPoint } from '../types';

/* Shared scaffolding for the hand-rolled SVG charts (mockup port).
   X is TIME-scaled (not index-scaled) so data gaps render as wide hatched
   regions instead of collapsing into a single index step. */

export type Scale = {
  x: (i: number) => number;
  y: (v: number) => number;
  xAt: (ms: number) => number;
  n: number;
  times: number[];
};

export function makeScale(
  points: HistoryPoint[],
  opts: { W: number; H: number; PL: number; PR: number; PT: number; PB: number; yMin: number; yMax: number },
): Scale {
  const { W, H, PL, PR, PT, PB, yMin, yMax } = opts;
  const times = points.map((p) => new Date(p.t).getTime());
  const t0 = times[0] ?? 0;
  const t1 = times[times.length - 1] ?? 1;
  const span = Math.max(1, t1 - t0);
  const xAt = (ms: number) => PL + (W - PL - PR) * ((ms - t0) / span);
  return {
    times,
    n: points.length,
    xAt,
    x: (i: number) => xAt(times[i]),
    y: (v: number) => PT + (H - PT - PB) * (1 - (v - yMin) / (yMax - yMin)),
  };
}

/** y domain from data, snapped to 5s, always spanning the neutral 50 line. */
export function yDomain(values: (number | null)[], includeNeutral = true): [number, number] {
  const nums = values.filter((v): v is number => v !== null && v !== undefined);
  if (nums.length === 0) return [0, 100];
  let lo = Math.min(...nums);
  let hi = Math.max(...nums);
  if (includeNeutral) {
    lo = Math.min(lo, 50);
    hi = Math.max(hi, 50);
  }
  return [Math.max(0, Math.floor((lo - 4) / 5) * 5), Math.min(100, Math.ceil((hi + 4) / 5) * 5)];
}

/** ~6 evenly spread label indices across the series. */
export function labelIndices(n: number, count = 6): number[] {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(i * step));
}
