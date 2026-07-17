'use client';

import { useEffect, useState } from 'react';
import { getStockInsightV2 } from '@/lib/api';
import s from './stockpage.module.css';

type State =
  | { status: 'loading' }
  | { status: 'ready'; insight: string }
  | { status: 'empty' };

/* Auto-loading narrative interpretation of the current scoring tick. The
   backend caches one Claude generation per ticker per tick; a null insight
   (unscored ticker, Claude failure) hides the card entirely. */
export default function InsightCard({ ticker }: { ticker: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let stale = false;
    setState({ status: 'loading' });
    getStockInsightV2(ticker)
      .then((d) => {
        if (stale) return;
        setState(
          typeof d?.insight === 'string' && d.insight.length > 0
            ? { status: 'ready', insight: d.insight }
            : { status: 'empty' },
        );
      })
      .catch(() => {
        if (!stale) setState({ status: 'empty' });
      });
    return () => {
      stale = true;
    };
  }, [ticker]);

  if (state.status === 'empty') return null;

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>AI insight</div>
        <span className={s.aiBadge}>
          <span className={s.aiSpark} aria-hidden="true">✦</span> Claude
        </span>
      </div>
      {state.status === 'loading' ? (
        <div aria-hidden="true">
          <div className={s.skelLine} style={{ width: '96%' }} />
          <div className={s.skelLine} style={{ width: '89%' }} />
          <div className={s.skelLine} style={{ width: '58%' }} />
        </div>
      ) : (
        <p className={s.insightProse}>{state.insight}</p>
      )}
      <div className={s.insightFoot}>
        Generated from the current scoring tick · not investment advice
      </div>
    </div>
  );
}
