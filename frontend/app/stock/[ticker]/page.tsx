import AssetPage from '@/app/components/AssetPage';
import StockSentimentPage from '@/app/components/stockpage/StockSentimentPage';
import { getStockSentimentV2, getStockHistoryV2 } from '@/lib/api';

// The proxy's Redis is the caching layer; never let Next cache this route.
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { ticker: string } }) {
  return { title: `${params.ticker.toUpperCase()} — SentientMarkets` };
}

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();

  // Fallback boundary: the dark AssetPage renders ONLY for tickers outside
  // the SentimentAPI universe or when the sentiment service is hard-down.
  // In-universe tickers with sparse data (no score yet, thin history,
  // missing overview) still get the light page with pending/em-dash states.
  let composite: any = null;
  try {
    composite = await getStockSentimentV2(ticker);
  } catch {
    composite = null;
  }

  if (!composite || composite.in_universe !== true) {
    return <AssetPage ticker={params.ticker} assetTypeHint="stock" />;
  }

  let initialHistory = null;
  try {
    initialHistory = await getStockHistoryV2(ticker, 30);
  } catch {
    initialHistory = null; // charts degrade; the page still renders
  }

  return <StockSentimentPage composite={composite} initialHistory={initialHistory} />;
}
