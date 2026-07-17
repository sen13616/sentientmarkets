'use client';

import { useEffect, useState } from 'react';
import { getStockQuoteV2 } from '@/lib/api';
import s from './stockpage.module.css';

type Quote = { price: number; change: number | null; change_percent: number | null };

/* Small header box: last traded price + 1d change (backend-cached quote,
   5-minute TTL). Renders a fixed-size skeleton while loading so the pills
   row below doesn't shift; hides only if no price comes back. */
export default function QuoteBox({ ticker }: { ticker: string }) {
  // undefined = loading, null = unavailable (hide).
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    let stale = false;
    setQuote(undefined);
    getStockQuoteV2(ticker)
      .then((d) => {
        if (stale) return;
        setQuote(
          typeof d?.price === 'number'
            ? { price: d.price, change: d.change ?? null, change_percent: d.change_percent ?? null }
            : null,
        );
      })
      .catch(() => {
        if (!stale) setQuote(null);
      });
    return () => {
      stale = true;
    };
  }, [ticker]);

  if (quote === null) return null;

  if (quote === undefined) {
    return (
      <div className={s.priceBox} aria-hidden="true">
        <div className={s.skelLine} style={{ width: 148, height: 18 }} />
      </div>
    );
  }

  const up = (quote.change ?? 0) >= 0;
  return (
    <div className={s.priceBox}>
      <span className={`${s.priceNum} ${s.mono}`}>${quote.price.toFixed(2)}</span>
      {quote.change !== null && (
        <span className={`${s.deltaBadge} ${up ? s.deltaUp : s.deltaDown} ${s.mono}`}>
          {up ? '▲' : '▼'} {up ? '+' : ''}{quote.change.toFixed(2)}
          {quote.change_percent !== null &&
            ` (${up ? '+' : ''}${quote.change_percent.toFixed(2)}%)`}{' '}
          (1d)
        </span>
      )}
    </div>
  );
}
