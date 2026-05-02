import { DOW_30 } from './dow30';
import { NASDAQ_100 } from './nasdaq100';

export type IndexConstituent = {
  ticker: string;
  name: string;
  marketCap: number;
};

export function getConstituents(indexTicker: string): IndexConstituent[] | null {
  const t = indexTicker.toUpperCase();
  if (t === 'DOW' || t === '^DJI' || t === '%5EDJI' || t === 'DJI') return DOW_30;
  if (t === 'NDX' || t === '^NDX' || t === '%5ENDX') return NASDAQ_100;
  return null;
}

export function getIndexName(indexTicker: string): string | null {
  const t = indexTicker.toUpperCase();
  if (t === 'DOW' || t === '^DJI' || t === '%5EDJI' || t === 'DJI') return 'Dow Jones Industrial Average';
  if (t === 'NDX' || t === '^NDX' || t === '%5ENDX') return 'Nasdaq 100';
  return null;
}
