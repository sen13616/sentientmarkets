/* Pure chart/format helpers for the SentimentAPI stock page. */

// Composite channel weights (contract §Data semantics). Renormalized over
// present layers when some are missing. NOTE: macro is .10 (amendment 6).
export const CHANNEL_WEIGHTS: Record<string, number> = {
  market: 0.35,
  narrative: 0.3,
  influencer: 0.25,
  macro: 0.1,
};

export const CHANNEL_ORDER = ['market', 'narrative', 'influencer', 'macro'] as const;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Weighted per-channel contributions, renormalized over present layers.
    Sums to ≈ the raw composite (verified live within integer rounding). */
export function stackContributions(
  sub: Partial<Record<string, number | null>>,
  missingLayers: string[] = [],
): { key: string; weight: number; sub: number; value: number }[] {
  const missing = new Set(missingLayers);
  const present = CHANNEL_ORDER.filter(
    (k) => !missing.has(k) && sub[k] !== null && sub[k] !== undefined,
  );
  const wSum = present.reduce((acc, k) => acc + CHANNEL_WEIGHTS[k], 0);
  if (wSum === 0) return [];
  return present.map((k) => {
    const w = CHANNEL_WEIGHTS[k] / wSum;
    return { key: k, weight: w, sub: sub[k] as number, value: w * (sub[k] as number) };
  });
}

/** SVG path over index-spaced points, pen-up outside segment boundaries. */
export function buildLinePath(
  values: (number | null)[],
  segments: [number, number][],
  x: (i: number) => number,
  y: (v: number) => number,
): string {
  let d = '';
  for (const [a, b] of segments) {
    let pen = false;
    for (let i = a; i <= b; i++) {
      const v = values[i];
      if (v === null || v === undefined) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      pen = true;
    }
  }
  return d.trim();
}

export function minutesAgo(cacheAgeSeconds: number | null | undefined): number | null {
  if (cacheAgeSeconds === null || cacheAgeSeconds === undefined) return null;
  return Math.max(0, Math.round(cacheAgeSeconds / 60));
}

export function fmtUtc(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function fmtGapRange(from: string, to: string): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const a = new Date(from);
  const b = new Date(to);
  return `${MONTHS[a.getUTCMonth()]} ${a.getUTCDate()} – ${MONTHS[b.getUTCMonth()]} ${b.getUTCDate()}`;
}
