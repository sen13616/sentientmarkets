import ScreenerPage from '@/app/components/screenerpage/ScreenerPage';
import ScreenerUnavailable from '@/app/components/screenerpage/ScreenerUnavailable';
import { getScreener } from '@/lib/api';

// The backend's swept Redis blob is the caching layer; never let Next cache.
export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return { title: 'Screener — SentientMarkets' };
}

export default async function Page() {
  try {
    const data = await getScreener();
    return <ScreenerPage data={data} />;
  } catch (err: any) {
    return <ScreenerUnavailable building={err?.code === 'screener_building'} />;
  }
}
