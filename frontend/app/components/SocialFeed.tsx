'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getHomeData } from '@/lib/api';
import { timeAgo } from '@/lib/format';

type RedditStock = {
  rank: number;
  ticker: string;
  name: string;
  mentions: number;
  mention_change_percent?: number;
  momentum_signal?: string;
};

type Article = {
  title: string;
  source: string;
  url: string;
  published_at: string;
};

function momentumClass(signal: string): string {
  const s = signal.toLowerCase();
  if (s === 'surging' || s === 'rising') return 'bg-[rgba(5,177,105,0.1)] text-[#05b169]';
  if (s === 'falling')                   return 'bg-[rgba(207,32,47,0.1)] text-[#cf202f]';
  return 'bg-[#eef0f3] text-[#7c828a]';
}

export default function SocialFeed({
  onNavigate,
}: {
  onNavigate: (ticker: string) => void;
}) {
  const [trending, setTrending] = useState<RedditStock[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    getHomeData()
      .then((data) => {
        setTrending((data.trending_tickers ?? []).slice(0, 10));
        setArticles((data.macro_news?.articles ?? []).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-16 w-full"
    >

      {/* ── Reddit Trending — flex column so the table card stretches to
          match the Mood Insights column height ── */}
      <div className="lg:col-span-2 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#7c828a] mb-6">
          Reddit Trending
        </p>

        <div className="bg-white border border-[#dee1e6] rounded-xl overflow-hidden flex-1 flex flex-col">

          {/* Table header */}
          <div className="grid grid-cols-[2.25rem_1fr_auto_auto] gap-3 px-4 py-3.5 sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-4 sm:px-8 sm:py-4 items-center bg-[#f7f7f7] border-b border-[#dee1e6]">
            {['Rank', 'Ticker', 'Mentions', 'Momentum'].map((h) => (
              <span key={h} className="text-[10px] sm:text-[11px] font-semibold text-[#7c828a] uppercase tracking-[0.05em]">
                {h}
              </span>
            ))}
          </div>

          {/* Skeleton */}
          {!loaded && (
            <div className="divide-y divide-[#eef0f3]">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="grid grid-cols-[2.25rem_1fr_auto_auto] gap-3 px-4 py-3.5 sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-4 sm:px-8 sm:py-4 items-center animate-pulse">
                  <div className="h-3 w-4 bg-[#eef0f3] rounded" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-[#eef0f3] rounded" />
                    <div className="h-2 w-28 bg-[#eef0f3] rounded" />
                  </div>
                  <div className="h-3 w-12 bg-[#eef0f3] rounded" />
                  <div className="h-5 w-16 bg-[#eef0f3] rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Rows — flex-1 so rows share any extra column height evenly */}
          {loaded && (
            <div className="divide-y divide-[#eef0f3] flex-1 flex flex-col">
              {trending.length === 0 ? (
                <div className="px-4 sm:px-8 py-12 text-center text-sm text-[#a8acb3]">
                  Unavailable
                </div>
              ) : (
                trending.map((stock, rowIdx) => {
                  const signal = stock.momentum_signal ?? 'Stable';
                  return (
                    <motion.div
                      key={stock.ticker}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: Math.min(rowIdx, 7) * 0.04, ease: 'easeOut' }}
                      onClick={() => onNavigate(stock.ticker)}
                      className="group flex-1 grid grid-cols-[2.25rem_1fr_auto_auto] gap-3 px-4 py-3.5 sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-4 sm:px-8 sm:py-4 items-center hover:bg-[#f7f7f7] cursor-pointer transition-colors"
                    >
                      {/* Rank */}
                      <span className="text-sm font-mono text-[#7c828a]">{stock.rank}</span>

                      {/* Ticker + name */}
                      <div>
                        <div className="text-sm font-mono font-medium text-[#0a0b0d] uppercase group-hover:text-[#0052ff] group-hover:translate-x-1 transition-all">
                          {stock.ticker}
                        </div>
                        <div className="text-[10px] text-[#7c828a] font-medium uppercase tracking-[0.05em] mt-0.5">
                          {stock.name}
                        </div>
                      </div>

                      {/* Mentions */}
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#a8acb3]" />
                        <span className="text-sm font-mono font-medium text-[#0a0b0d]">
                          {(stock.mentions ?? 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Momentum */}
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.05em] ${momentumClass(signal)}`}>
                          {signal}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mood Insights ── */}
      <div className="col-span-1">
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#7c828a] mb-6">
          Mood Insights
        </p>

        <div className="space-y-6">
          {/* Skeleton */}
          {!loaded &&
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="p-6 bg-white border border-[#dee1e6] rounded-xl animate-pulse">
                <div className="h-2.5 w-24 bg-[#eef0f3] rounded mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full bg-[#eef0f3] rounded" />
                  <div className="h-4 w-4/5 bg-[#eef0f3] rounded" />
                </div>
                <div className="h-2.5 w-16 bg-[#eef0f3] rounded" />
              </div>
            ))}

          {/* Articles */}
          {loaded && articles.length === 0 && (
            <p className="text-sm text-[#a8acb3]">Unavailable</p>
          )}
          {loaded &&
            articles.slice(0, 5).map((article, i) => (
              <motion.a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                className="block p-6 bg-white hover:bg-[#f7f7f7] border border-[#dee1e6] hover:border-[#a8acb3] rounded-xl transition-all cursor-pointer group"
              >
                {/* Source + time */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-semibold text-[#7c828a] uppercase tracking-[0.05em] border-l-2 border-[#0052ff] pl-2 max-w-[120px] truncate">
                    {article.source}
                  </span>
                  <span className="text-[9px] font-semibold text-[#7c828a] uppercase tracking-[0.05em] px-2 py-0.5 bg-[#eef0f3] rounded shrink-0 font-mono">
                    {timeAgo(article.published_at)}
                  </span>
                </div>

                {/* Headline */}
                <p className="font-medium leading-snug text-[#0a0b0d] group-hover:text-[#0052ff] transition-colors mb-3">
                  {article.title}
                </p>

                {/* Read link */}
                <span className="text-xs font-semibold text-[#0052ff] uppercase tracking-[0.05em]">
                  Read Mood <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </motion.a>
            ))}
        </div>
      </div>

    </motion.div>
  );
}
