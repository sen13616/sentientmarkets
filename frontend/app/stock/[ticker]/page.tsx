import AssetPage from '@/app/components/AssetPage';

export function generateMetadata({ params }: { params: { ticker: string } }) {
  return { title: `${params.ticker.toUpperCase()} — SentientMarkets` };
}

export default function StockPage({ params }: { params: { ticker: string } }) {
  return <AssetPage ticker={params.ticker} assetTypeHint="stock" />;
}
