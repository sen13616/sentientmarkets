import { permanentRedirect } from 'next/navigation';
import NotCoveredPage from '@/app/components/stockpage/NotCoveredPage';
import StockSentimentPage from '@/app/components/stockpage/StockSentimentPage';
import { getStockSentimentV2, getStockHistoryV2 } from '@/lib/api';

// S&P-500-index lookalikes route to the breadth page, not the stock flow.
const SP500_INDEX_ALIASES = new Set(['SPY', '^GSPC', 'GSPC', 'SPX', '^SPX']);

// The proxy's Redis is the caching layer; never let Next cache this route.
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { ticker: string } }) {
  // Runs before the streamed loading shell commits a 200 — this is what
  // turns the S&P alias redirect into a real HTTP 308.
  if (SP500_INDEX_ALIASES.has(decodeURIComponent(params.ticker).toUpperCase())) {
    permanentRedirect('/index/sp500');
  }
  return { title: `${params.ticker.toUpperCase()} — SentientMarkets` };
}

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();

  if (SP500_INDEX_ALIASES.has(decodeURIComponent(params.ticker).toUpperCase())) {
    permanentRedirect('/index/sp500');
  }

  // Fallback boundary: non-universe tickers get the light "not covered"
  // page; a hard-down sentiment service gets the light "unavailable" page
  // (never claim non-coverage when coverage is simply unknown). In-universe
  // tickers with sparse data (no score yet, thin history, missing overview)
  // still get the full light page with pending/em-dash states.
  // Both SSR fetches start together — composite gates what renders, but
  // waiting for it before *starting* the history fetch just serialized the
  // page's latency. A wasted history call for non-covered tickers is cheap
  // (backend 404s fast and the promise is caught below).
  const compositePromise = getStockSentimentV2(ticker).catch(() => null);
  const historyPromise = getStockHistoryV2(ticker, 30).catch(() => null);

  const composite: any = await compositePromise;
  if (!composite) {
    return <NotCoveredPage ticker={ticker} variant="unavailable" />;
  }
  if (composite.in_universe !== true) {
    return <NotCoveredPage ticker={ticker} variant="not-covered" />;
  }

  // Charts degrade when null; the page still renders.
  const initialHistory = await historyPromise;

  return <StockSentimentPage composite={composite} initialHistory={initialHistory} />;
}
