import { notFound, permanentRedirect } from 'next/navigation';
import IndexPage from '@/app/components/indexpage/IndexPage';
import IndexUnavailable from '@/app/components/indexpage/IndexUnavailable';
import { getMarketSp500 } from '@/lib/api';

// The proxy's Redis is the caching layer; never let Next cache this route.
export const dynamic = 'force-dynamic';

// Aliases that permanently redirect (308) to the canonical /index/sp500.
// ^NDX / ^DJI / NDX / DJI / DOW deliberately 404 — those pages are removed,
// and redirecting them here would serve wrong content under a
// right-looking URL.
const SP500_ALIASES = new Set(['^GSPC', 'GSPC', 'SPX', '^SPX', 'SP500', 'SPY']);

// The loading.tsx boundary makes Next commit a 200 and stream before the
// page body runs, which would downgrade redirects/404s to client-side
// navigations. generateMetadata runs BEFORE the response commits, so the
// alias handling lives here to produce real HTTP 308/404 statuses.
function resolveSlug(param: string): void {
  if (param === 'sp500') return;
  if (SP500_ALIASES.has(decodeURIComponent(param).toUpperCase())) {
    permanentRedirect('/index/sp500');
  }
  notFound();
}

export function generateMetadata({ params }: { params: { ticker: string } }) {
  resolveSlug(params.ticker);
  return { title: 'S&P 500 — SentientMarkets' };
}

export default async function Page({ params }: { params: { ticker: string } }) {
  resolveSlug(params.ticker);

  // Upstream 503 → light error state. This page has no local-scorer
  // fallback and must never render the dark AssetPage.
  let data = null;
  try {
    data = await getMarketSp500();
  } catch {
    data = null;
  }
  if (!data) return <IndexUnavailable />;

  return <IndexPage data={data} />;
}
