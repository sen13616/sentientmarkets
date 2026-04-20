'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getHomeData } from '@/lib/api';

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

function fmtTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function momentumClass(signal: string): string {
  const s = signal.toLowerCase();
  if (s === 'surging' || s === 'rising') return 'bg-green-500/10 text-green-500';
  if (s === 'falling')                   return 'bg-red-500/10 text-red-500';
  return 'bg-blue-500/10 text-blue-400';
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
        setArticles((data.macro_news?.articles ?? []).slice(0, 6));
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

      {/* ── Reddit Trending ── */}
      <div className="lg:col-span-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A1A1AA] opacity-40 mb-6">
          Reddit Trending
        </p>

        <div className="bg-[#111112] border border-white/5 rounded-[2rem] overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-4 items-center bg-white/[0.01] border-b border-white/5 px-8 py-6">
            {['Rank', 'Ticker', 'Mentions', 'Momentum'].map((h) => (
              <span key={h} className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">
                {h}
              </span>
            ))}
          </div>

          {/* Skeleton */}
          {!loaded && (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="grid grid-cols-[3rem_1fr_auto_auto] gap-4 items-center px-8 py-6 animate-pulse">
                  <div className="h-3 w-4 bg-white/5 rounded" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-white/5 rounded" />
                    <div className="h-2 w-28 bg-white/5 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-white/5 rounded" />
                  <div className="h-5 w-16 bg-white/5 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          {loaded && (
            <div className="divide-y divide-white/5">
              {trending.length === 0 ? (
                <div className="px-8 py-12 text-center text-sm text-[#A1A1AA] opacity-40">
                  Unavailable
                </div>
              ) : (
                trending.map((stock) => {
                  const signal = stock.momentum_signal ?? 'Stable';
                  return (
                    <div
                      key={stock.ticker}
                      onClick={() => onNavigate(stock.ticker)}
                      className="group grid grid-cols-[3rem_1fr_auto_auto] gap-4 items-center px-8 py-6 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      {/* Rank */}
                      <span className="text-sm font-bold opacity-30">{stock.rank}</span>

                      {/* Ticker + name */}
                      <div>
                        <div className="text-sm font-bold text-white uppercase group-hover:text-blue-500 transition-colors">
                          {stock.ticker}
                        </div>
                        <div className="text-[10px] text-[#A1A1AA] opacity-40 font-medium uppercase tracking-wider mt-0.5">
                          {stock.name}
                        </div>
                      </div>

                      {/* Mentions */}
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                        <span className="text-sm font-mono font-bold text-white">
                          {(stock.mentions ?? 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Momentum */}
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${momentumClass(signal)}`}>
                          {signal}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mood Insights ── */}
      <div className="col-span-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A1A1AA] opacity-40 mb-6">
          Mood Insights
        </p>

        <div className="space-y-6">
          {/* Skeleton */}
          {!loaded &&
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="p-6 bg-[#111112] border border-white/5 rounded-2xl animate-pulse">
                <div className="h-2.5 w-24 bg-white/5 rounded mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full bg-white/5 rounded" />
                  <div className="h-4 w-4/5 bg-white/5 rounded" />
                </div>
                <div className="h-2.5 w-16 bg-white/5 rounded" />
              </div>
            ))}

          {/* Articles */}
          {loaded && articles.length === 0 && (
            <p className="text-sm text-[#A1A1AA] opacity-40">Unavailable</p>
          )}
          {loaded &&
            articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 bg-[#111112] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all cursor-pointer group"
              >
                {/* Source + time */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 border-l border-blue-500 pl-2">
                    {article.source}
                  </span>
                  <span className="text-[9px] font-bold text-[#A1A1AA] opacity-20 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded">
                    {fmtTime(article.published_at)}
                  </span>
                </div>

                {/* Headline */}
                <p className="font-serif font-medium leading-snug text-[#F4F4F5] group-hover:text-blue-400 transition-colors mb-4">
                  {article.title}
                </p>

                {/* Read link */}
                <span className="text-[10px] font-bold text-blue-400 group-hover:underline uppercase tracking-widest">
                  Read Mood →
                </span>
              </a>
            ))}
        </div>
      </div>

    </motion.div>
  );
}
