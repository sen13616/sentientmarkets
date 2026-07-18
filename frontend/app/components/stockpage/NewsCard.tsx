'use client';

import { useEffect, useState } from 'react';
import { getStockNewsV2 } from '@/lib/api';
import s from './stockpage.module.css';

type Article = {
  title: string;
  source: string | null;
  published_at: string | null;
  description: string | null;
  url: string | null;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* Latest per-ticker coverage from Finnhub in a responsive 3×3 grid.
   Hidden entirely when the (backend-cached) result comes back empty. */
export default function NewsCard({ ticker }: { ticker: string }) {
  // null = loading; [] = confirmed empty (card hides).
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    let stale = false;
    setArticles(null);
    getStockNewsV2(ticker)
      .then((d) => {
        if (!stale) setArticles(Array.isArray(d?.articles) ? d.articles : []);
      })
      .catch(() => {
        if (!stale) setArticles([]);
      });
    return () => {
      stale = true;
    };
  }, [ticker]);

  if (articles !== null && articles.length === 0) return null;

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>In the news</div>
      </div>
      <div className={s.cardSub}>Latest coverage via Finnhub. Links open the source.</div>
      <div className={s.newsGrid}>
        {articles === null
          ? Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={s.newsSkelCell} aria-hidden="true">
                <div className={s.skelLine} style={{ width: '42%' }} />
                <div className={s.skelLine} style={{ width: '94%' }} />
                <div className={s.skelLine} style={{ width: '71%' }} />
              </div>
            ))
          : articles.map((a, i) =>
              a.url ? (
                <a
                  key={i}
                  className={s.newsCell}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={`${s.newsMeta} ${s.mono}`}>
                    <span>{a.source ?? 'Unknown source'}</span>
                    {a.published_at && <span>· {timeAgo(a.published_at)}</span>}
                  </div>
                  <div className={s.newsTitle}>{a.title}</div>
                </a>
              ) : null,
            )}
      </div>
    </div>
  );
}
