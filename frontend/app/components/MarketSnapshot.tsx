'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CountUp from '@/app/components/stock/CountUp';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getHomeData } from '@/lib/api';

type IndexData = {
  price?: number;
  change?: number;
  change_percent?: number;
};

type FGData = {
  score?: number;
  one_week_ago?: number;
  one_month_ago?: number;
  one_year_ago?: number;
};

type HomeData = {
  fear_and_greed?: FGData;
  market_indices?: Record<string, IndexData>;
};

const INDEX_DEFS: { key: string; label: string; route?: string }[] = [
  // Only the S&P 500 has a breadth page; NASDAQ and Dow tiles display
  // levels but no longer navigate (their index pages were removed).
  { key: 'sp500',  label: 'S&P 500',   route: '/index/sp500' },
  { key: 'nasdaq', label: 'NASDAQ'                           },
  { key: 'dow',    label: 'Dow Jones'                        },
  { key: 'vix',    label: 'VIX'                              },
];

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function fgLabel(score: number): string {
  if (score >= 75) return 'Extreme Greed';
  if (score >= 55) return 'Greed';
  if (score >= 45) return 'Neutral';
  if (score >= 25) return 'Fear';
  return 'Extreme Fear';
}

function fgTextColor(score: number): string {
  if (score > 60) return 'text-[#05b169]';
  if (score >= 40) return 'text-[#7c828a]';
  return 'text-[#cf202f]';
}

function fgFillColor(score: number): string {
  if (score > 60) return 'bg-[#05b169]';
  if (score >= 40) return 'bg-[#7c828a]';
  return 'bg-[#cf202f]';
}

function vixTag(price: number): string {
  if (price < 15) return 'Calm';
  if (price < 25) return 'Elevated';
  return 'High';
}

export default function MarketSnapshot() {
  const [data, setData] = useState<HomeData | null>(null);
  const [activeHistorical, setActiveHistorical] = useState(0);

  useEffect(() => {
    getHomeData().then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse">
        <div className="h-3 w-36 bg-[#eef0f3] rounded mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white border border-[#dee1e6] rounded-xl p-8 space-y-8">
            <div className="h-24 w-32 bg-[#eef0f3] rounded" />
            <div className="h-2 w-full bg-[#eef0f3] rounded-full" />
            <div className="flex gap-3">
              {[0,1,2].map(i => <div key={i} className="h-8 w-16 bg-[#eef0f3] rounded-xl" />)}
            </div>
          </div>
          <div className="flex-[1.2] grid grid-cols-2 gap-6">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-white border border-[#dee1e6] rounded-xl p-8 space-y-4">
                <div className="h-3 w-20 bg-[#eef0f3] rounded" />
                <div className="h-10 w-32 bg-[#eef0f3] rounded" />
                <div className="h-3 w-16 bg-[#eef0f3] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const fg      = data?.fear_and_greed ?? {};
  const indices = data?.market_indices ?? {};
  const fgScore = Math.round(fg.score ?? 50);

  const historical = [
    { label: '1W', value: Math.round(fg.one_week_ago  ?? 0) },
    { label: '1M', value: Math.round(fg.one_month_ago ?? 0) },
    { label: '1Y', value: Math.round(fg.one_year_ago  ?? 0) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7c828a] mb-6">
        Market Snapshot
      </p>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Fear & Greed card ── */}
        <div className="flex-1 bg-white border border-[#dee1e6] rounded-xl p-8 space-y-12">

          {/* Score */}
          <div>
            <p className="text-[11px] font-semibold text-[#7c828a] uppercase tracking-[0.05em] mb-4">
              Fear &amp; Greed Index
            </p>
            <div className="flex items-end gap-2 mb-3">
              <span className={`text-6xl font-medium font-mono tracking-tight ${fgTextColor(fgScore)}`}>
                <CountUp value={fgScore} decimals={0} duration={800} />
              </span>
              <span className="text-2xl font-medium font-mono text-[#a8acb3] mb-2">/100</span>
            </div>
            <div className={`text-2xl font-normal ${fgTextColor(fgScore)}`}>
              {fgLabel(fgScore)}
            </div>
          </div>

          {/* Progress bar — flat fill, no gradient */}
          <div>
            <div className="h-1.5 w-full bg-[#eef0f3] rounded-full relative overflow-hidden">
              <motion.div
                className={`absolute left-0 top-0 h-full rounded-full ${fgFillColor(fgScore)}`}
                initial={{ width: '0%' }}
                whileInView={{ width: `${fgScore}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-semibold text-[#a8acb3] uppercase tracking-[0.05em]">
                Extreme Fear
              </span>
              <span className="text-[10px] font-semibold text-[#a8acb3] uppercase tracking-[0.05em]">
                Extreme Greed
              </span>
            </div>
          </div>

          {/* Historical chips */}
          <div>
            <p className="text-[10px] font-semibold text-[#7c828a] uppercase tracking-[0.05em] mb-4">
              Historical
            </p>
            <div className="flex gap-3">
              {historical.map((h, i) => (
                <button
                  key={h.label}
                  onClick={() => setActiveHistorical(i)}
                  className={`px-4 py-2 rounded-full font-mono flex items-center gap-2 transition-all ${
                    i === activeHistorical
                      ? 'bg-[rgba(0,82,255,0.08)] border border-[rgba(0,82,255,0.3)] text-[#0052ff]'
                      : 'bg-[#f7f7f7] border border-[#dee1e6] text-[#7c828a] hover:border-[#a8acb3]'
                  }`}
                >
                  <span className="text-[10px] opacity-70">{h.label}</span>
                  <span className="text-sm font-medium">{h.value > 0 ? h.value : '—'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Indices grid ── */}
        <div className="flex-[1.2] grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDEX_DEFS.map(({ key, label, route }, i) => {
            const idx  = indices[key] ?? {};
            const isVix = key === 'vix';
            const isPos = (idx.change_percent ?? 0) >= 0;
            const tag   = isVix ? vixTag(idx.price ?? 0) : (isPos ? 'Bullish' : 'Bearish');
            const changeColor = isPos ? 'text-[#05b169]' : 'text-[#cf202f]';
            const absChange   = idx.change ?? 0;

            const tile = (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white border border-[#dee1e6] rounded-xl p-8 flex flex-col justify-between h-full ${route ? 'hover:border-[#a8acb3] transition-colors duration-200' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[12px] font-semibold text-[#0a0b0d] tracking-wide">
                    {label}
                  </span>
                  <div className="px-2.5 py-1 rounded-full bg-[#eef0f3]">
                    <span className="text-[9px] font-semibold text-[#7c828a] uppercase tracking-[0.05em]">
                      {tag}
                    </span>
                  </div>
                </div>

                {/* Price — mono per NEW_DESIGN */}
                <div className="text-4xl font-mono font-medium text-[#0a0b0d] tracking-tight mb-3">
                  <span className="text-2xl mr-0.5 text-[#a8acb3]">$</span>
                  {fmtPrice(idx.price)}
                </div>

                {/* Change row */}
                <div className={`flex items-center gap-1.5 text-[11px] font-medium font-mono ${changeColor}`}>
                  {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{fmtPct(idx.change_percent)}</span>
                  <span className="text-[#a8acb3]">
                    {isPos ? '+' : ''}{absChange.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            );

            return route ? (
              <Link key={key} href={route} className="contents">{tile}</Link>
            ) : (
              <div key={key} className="contents">{tile}</div>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
}
