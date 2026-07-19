const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* Module-level memo for the market-wide payloads (home, mood) that several
   components fetch on every mount. Caching the *promise* both dedupes
   concurrent callers and reuses the result across client-side navigations
   (home → stock → home no longer refetches). Failures are evicted so a
   flaky request doesn't poison the window. */
const _memo: Record<string, { promise: Promise<any>; at: number }> = {};

function memoized(key: string, ttlMs: number, fn: () => Promise<any>): Promise<any> {
  const hit = _memo[key];
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise;
  const entry = { promise: fn(), at: Date.now() };
  _memo[key] = entry;
  entry.promise.catch(() => {
    if (_memo[key] === entry) delete _memo[key];
  });
  return entry.promise;
}

export async function getSentiment(ticker: string) {
  const res = await fetch(`${API_URL}/api/sentiment/${ticker.toUpperCase()}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ?? {};
    const err = new Error(detail?.message ?? `Failed to fetch sentiment for ${ticker}`) as any;
    err.code = detail?.error ?? 'unknown_error';
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getHomeData() {
  return memoized('home', 5 * 60_000, async () => {
    const res = await fetch(`${API_URL}/api/home`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error('Failed to fetch home data');
    return res.json();
  });
}

async function v2Fetch(path: string) {
  // no-store: the website backend's Redis is the caching layer for the
  // SentimentAPI proxy — double-caching in the Next Data Cache only adds
  // staleness confusion.
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ?? {};
    const err = new Error(detail?.message ?? `Request failed: ${path}`) as any;
    err.code = detail?.error ?? 'unknown_error';
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getStockSentimentV2(ticker: string) {
  return v2Fetch(`/api/v2/stock/${encodeURIComponent(ticker.toUpperCase())}`);
}

export async function getStockHistoryV2(ticker: string, days: 7 | 30 | 90) {
  return v2Fetch(`/api/v2/stock/${encodeURIComponent(ticker.toUpperCase())}/history?days=${days}`);
}

export async function getStockInsightV2(ticker: string) {
  return v2Fetch(`/api/v2/stock/${encodeURIComponent(ticker.toUpperCase())}/insight`);
}

export async function getStockQuoteV2(ticker: string) {
  return v2Fetch(`/api/v2/stock/${encodeURIComponent(ticker.toUpperCase())}/quote`);
}

export async function getStockNewsV2(ticker: string) {
  return v2Fetch(`/api/v2/stock/${encodeURIComponent(ticker.toUpperCase())}/news`);
}

export async function getPriceHistory(ticker: string, period: '1M' | '3M' | '6M' | '1Y') {
  const res = await fetch(
    `${API_URL}/api/price-history/${encodeURIComponent(ticker.toUpperCase())}?period=${period}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch price history for ${ticker}`);
  return res.json();
}

export async function getScreener() {
  return v2Fetch('/api/v2/market/screener');
}

export async function getMarketSp500() {
  return v2Fetch('/api/v2/market/sp500');
}

export async function getMood() {
  return memoized('mood', 15 * 60_000, async () => {
    const res = await fetch(`${API_URL}/api/mood`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed to fetch mood');
    return res.json();
  });
}
