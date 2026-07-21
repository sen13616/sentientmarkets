/* Shared ticker→route resolution, used by HeroSearch and NavSearch (it was
 * copy-pasted in both). Resolves free-text input via /api/search: exact
 * ticker match first, then best result, then a bare /stock/ fallback. */
import type { useRouter } from 'next/navigation';

import { API_URL } from './api';

type Router = ReturnType<typeof useRouter>;

export type ResolvedAsset = {
  ticker: string;
  display_ticker?: string | null;
  asset_type?: string | null;
  [key: string]: unknown;
};

export function getAssetUrl(r: { asset_type?: string | null; ticker: string }): string {
  return `/${r.asset_type || 'stock'}/${encodeURIComponent(r.ticker)}`;
}

/** Navigate to the best route for a typed ticker/company query.
 * `onResolved` fires with the matched search result (e.g. to record
 * recent searches) before navigation. */
export async function navigateToTicker(
  router: Router,
  input: string,
  onResolved?: (result: ResolvedAsset) => void,
): Promise<void> {
  const ticker = input.trim().toUpperCase();
  if (!ticker) return;
  try {
    const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(ticker)}`);
    const data = await res.json();
    const results: ResolvedAsset[] = data.results ?? [];
    const exact = results.find(
      (r) =>
        r.ticker.toUpperCase() === ticker ||
        (r.display_ticker ?? '').toUpperCase() === ticker,
    );
    const match = exact ?? results[0];
    if (match) {
      onResolved?.(match);
      router.push(getAssetUrl(match));
    } else {
      router.push(`/stock/${ticker}`);
    }
  } catch {
    router.push(`/stock/${ticker}`);
  }
}
