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
  { key: 'sp500',  label: 'S&P 500',   route: '/index/%5EGSPC' },
  { key: 'nasdaq', label: 'NASDAQ',    route: '/index/%5ENDX'  },
  { key: 'dow',    label: 'Dow Jones', route: '/index/%5EDJI'  },
  { key: 'vix',    label: 'VIX'                                },
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
  if (score > 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

function fgFillColor(score: number): string {
  if (score > 60) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
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
        <div className="h-3 w-36 bg-white/5 rounded mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-[#111112] border border-white/5 rounded-[2rem] p-10 space-y-8">
            <div className="h-24 w-32 bg-white/5 rounded" />
            <div className="h-2 w-full bg-white/5 rounded-full" />
            <div className="flex gap-3">
              {[0,1,2].map(i => <div key={i} className="h-8 w-16 bg-white/5 rounded-xl" />)}
            </div>
          </div>
          <div className="flex-[1.2] grid grid-cols-2 gap-6">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-[#111112] border border-white/5 rounded-[2rem] p-8 space-y-4">
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-10 w-32 bg-white/5 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
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
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA] opacity-60 px-2 mb-6">
        Market Snapshot
      </p>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Fear & Greed card ── */}
        <div className="flex-1 bg-[#111112] border border-white/5 rounded-[2rem] p-10 space-y-12">

          {/* Score */}
          <div>
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Fear &amp; Greed Index
            </p>
            <div className="flex items-end gap-2 mb-3">
              <span className={`text-6xl font-bold font-mono tracking-tighter ${fgTextColor(fgScore)}`}>
                <CountUp value={fgScore} decimals={0} duration={800} />
              </span>
              <span className="text-2xl font-bold text-[#A1A1AA] opacity-60 mb-2">/100</span>
            </div>
            <div className={`text-2xl font-bold ${fgTextColor(fgScore)}`}>
              {fgLabel(fgScore)}
            </div>
          </div>

          {/* Gradient bar */}
          <div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full relative overflow-hidden">
              <motion.div
                className={`absolute left-0 top-0 h-full rounded-full ${fgFillColor(fgScore)}`}
                initial={{ width: '0%' }}
                whileInView={{ width: `${fgScore}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-[0.1em] opacity-50">
                Extreme Fear
              </span>
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-[0.1em] opacity-50">
                Extreme Greed
              </span>
            </div>
          </div>

          {/* Historical chips */}
          <div>
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40 mb-4">
              Historical
            </p>
            <div className="flex gap-3">
              {historical.map((h, i) => (
                <button
                  key={h.label}
                  onClick={() => setActiveHistorical(i)}
                  className={`px-4 py-2 rounded-xl font-mono flex items-center gap-2 transition-all ${
                    i === activeHistorical
                      ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                      : 'bg-white/[0.03] border border-white/5 text-[#A1A1AA]'
                  }`}
                >
                  <span className="text-[10px] opacity-60">{h.label}</span>
                  <span className="text-sm font-bold">{h.value > 0 ? h.value : '—'}</span>
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
            const changeColor = isPos ? 'text-green-500' : 'text-red-500';
            const absChange   = idx.change ?? 0;

            const tile = (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-[#111112] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between h-full ${route ? 'hover:border-white/10 transition-colors duration-200' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-bold text-white tracking-wide">
                    {label}
                  </span>
                  <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
                    <span className="text-[8px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                      {tag}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-4xl font-serif font-bold text-white tracking-tighter mb-3">
                  <span className="text-2xl mr-0.5">$</span>
                  {fmtPrice(idx.price)}
                </div>

                {/* Change row */}
                <div className={`flex items-center gap-1.5 text-[11px] font-bold font-mono ${changeColor}`}>
                  {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{fmtPct(idx.change_percent)}</span>
                  <span className="opacity-40">
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
