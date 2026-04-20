'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Zap } from 'lucide-react';
import { getSentiment } from '@/lib/api';
import PriceChart from '@/app/components/stock/PriceChart';
import InsightTabs from '@/app/components/stock/InsightTabs';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, d = 2): string {
  if (n == null) return '—';
  return n.toFixed(d);
}
function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}
function fmtLarge(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function scoreAccent(s: number): string {
  if (s >= 65) return 'var(--green)';
  if (s >= 50) return 'var(--amber)';
  return 'var(--red)';
}
function fgAccent(s: number): string {
  if (s > 60) return 'var(--green)';
  if (s >= 40) return 'var(--amber)';
  return 'var(--red)';
}
function fgLabel(s: number): string {
  if (s >= 75) return 'Extreme Greed';
  if (s >= 55) return 'Greed';
  if (s >= 45) return 'Neutral';
  if (s >= 25) return 'Fear';
  return 'Extreme Fear';
}
function clamp(v: number, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }

// ── Inline helper components ───────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA] opacity-40 mb-6">
      {children}
    </p>
  );
}

function StockStatCard({
  label,
  value,
  subValue,
  trend,
}: {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
      <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-3">
        {label}
      </div>
      <div
        className="text-2xl font-bold font-mono text-white"
        style={trend === 'up' ? { color: 'var(--green)' } : trend === 'down' ? { color: 'var(--red)' } : undefined}
      >
        {value}
      </div>
      {subValue && (
        <div className="text-[11px] text-[#A1A1AA] opacity-40 mt-1">{subValue}</div>
      )}
    </div>
  );
}

function IndicatorBar({
  label,
  value,
  score,
  color = 'var(--blue)',
}: {
  label: string;
  value?: string;
  score: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[#A1A1AA] w-28 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamp(score)}%`, background: color }}
        />
      </div>
      {value && (
        <span className="text-[11px] font-mono font-bold text-[#A1A1AA] w-10 text-right">
          {value}
        </span>
      )}
    </div>
  );
}

function RangeIndicator({
  current,
  min,
  max,
  label,
  unit = '$',
}: {
  current: number | null | undefined;
  min: number | null | undefined;
  max: number | null | undefined;
  label?: string;
  unit?: string;
}) {
  const pct =
    current != null && min != null && max != null && max !== min
      ? clamp(((current - min) / (max - min)) * 100)
      : null;
  return (
    <div>
      {label && (
        <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-3">
          {label}
        </div>
      )}
      <div className="relative h-1.5 w-full bg-white/5 rounded-full my-3">
        {pct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#111112]"
            style={{ left: `${pct}%`, transform: 'translate(-50%,-50%)' }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-[#A1A1AA] opacity-40">
        <span>{min != null ? `${unit}${fmt(min)}` : '—'}</span>
        <span>{current != null ? `${unit}${fmt(current)}` : '—'}</span>
        <span>{max != null ? `${unit}${fmt(max)}` : '—'}</span>
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-28 bg-white/5 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111112] border border-white/5 rounded-[2rem] h-72" />
        <div className="lg:col-span-2 bg-[#111112] border border-white/5 rounded-[2rem] h-72" />
      </div>
      <div className="bg-[#111112] border border-white/5 rounded-[2rem] h-48" />
      <div className="grid grid-cols-2 gap-6">
        {[0,1,2,3].map(i => <div key={i} className="bg-[#111112] border border-white/5 rounded-2xl h-40" />)}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  ticker: string | null;
  onBack: () => void;
}

export default function StockDetailPage({ ticker, onBack }: Props) {
  const [data, setData] = useState<any>(null);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setData(null);
    setFailed(false);
    getSentiment(ticker)
      .then(setData)
      .catch(() => setFailed(true));
  }, [ticker]);

  if (!ticker) return null;

  if (failed) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#A1A1AA] text-sm mb-4">Could not load data for {ticker.toUpperCase()}</p>
        <button onClick={onBack} className="text-blue-400 text-sm hover:underline">← Back</button>
      </div>
    );
  }

  if (!data) return <LoadingSkeleton />;

  // ── Data extraction ──
  const tk        = (ticker || '').toUpperCase();
  const price     = data.price_data             ?? {};
  const fund      = data.fundamentals           ?? {};
  const analyst   = data.analyst_data           ?? {};
  const tech      = data.technical_indicators   ?? {};
  const inst      = data.institutional_data     ?? {};
  const fg        = data.fear_and_greed         ?? {};
  const aiIns     = data.ai_insights            ?? {};
  const news      = data.news_sentiment         ?? {};
  const social    = data.social_sentiment       ?? {};
  const reddit    = social.reddit               ?? {};
  const insider   = social.insider_sentiment    ?? {};
  const ph        = data.price_history          ?? {};

  const score     = data.market_mood_score      ?? 50;
  const accentCol = scoreAccent(score);
  const articles  = (news.articles ?? []).slice(0, 8);

  // Analyst bars
  const totalAn  = analyst.number_of_analysts ?? 0;
  const sbuy     = analyst.strong_buy  ?? 0;
  const abuy     = analyst.buy         ?? 0;
  const hold     = analyst.hold        ?? 0;
  const asell    = analyst.sell        ?? 0;
  const ssell    = analyst.strong_sell ?? 0;
  const analystSum = sbuy + abuy + hold + asell + ssell || totalAn || 1;

  // News sentiment
  const nBull  = news.bullish_count  ?? 0;
  const nNeut  = news.neutral_count  ?? 0;
  const nBear  = news.bearish_count  ?? 0;
  const nTotal = nBull + nNeut + nBear || 1;
  const sentScore = news.average_sentiment_score as number | null | undefined;

  // Volume
  const vol      = price.volume          as number | null | undefined;
  const avgVol   = price.average_volume  as number | null | undefined;
  const volRatio = vol != null && avgVol != null && avgVol > 0 ? vol / avgVol : null;

  // F&G sub-indicators
  const fgScore = Math.round(fg.score ?? 50);
  const subs    = fg.sub_indicators ?? {};

  const SUB_DEFS = [
    { key: 'market_momentum',      name: 'Market Momentum' },
    { key: 'stock_price_strength', name: 'Price Strength'  },
    { key: 'stock_price_breadth',  name: 'Price Breadth'   },
    { key: 'put_call_ratio',       name: 'Put/Call Ratio'  },
    { key: 'market_volatility',    name: 'Volatility (VIX)' },
    { key: 'safe_haven_demand',    name: 'Safe Haven'      },
    { key: 'junk_bond_demand',     name: 'Junk Bond'       },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >

      {/* ── 1. Back button ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-[0.2em] hover:text-white transition-colors"
      >
        <ChevronLeft size={14} />
        Market Home
      </button>

      {/* ── 2. Top grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Ticker + Score */}
        <div className="lg:col-span-1 bg-[#111112] border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6">
          {/* Top row: ticker + price */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">{tk}</div>
              <div className="text-[11px] text-[#A1A1AA] opacity-50 mt-0.5 uppercase tracking-wider">
                {data.company_name ?? ''}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-white">
                ${fmt(price.current_price)}
              </div>
              <div
                className="text-[11px] font-mono font-bold mt-0.5"
                style={{ color: (price.change ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {fmtPct(price.change_percent)}
              </div>
            </div>
          </div>

          {/* Score */}
          <div>
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-2">
              Mood score
            </div>
            <div className="text-5xl font-bold font-mono" style={{ color: accentCol }}>
              {Math.round(score)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-semibold" style={{ color: accentCol }}>
                {data.market_mood_label ?? 'Neutral'}
              </span>
              <span className="text-[11px] text-[#A1A1AA] opacity-40">
                · {data.market_mood_confidence ?? 'medium'} confidence
              </span>
            </div>
          </div>

          {/* Spectrum bar */}
          <div>
            <div className="relative h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: 'linear-gradient(to right, var(--red) 0%, var(--amber) 50%, var(--green) 100%)' }}>
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#111112]"
                style={{ left: `${score}%`, transform: 'translate(-50%,-50%)' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider opacity-30">
              <span>Bearish</span><span>Neutral</span><span>Bullish</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {data.exchange && (
              <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2 py-1 bg-white/[0.03] border border-white/5 rounded">
                {data.exchange}
              </span>
            )}
            {fund.sector && (
              <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2 py-1 bg-white/[0.03] border border-white/5 rounded">
                {fund.sector}
              </span>
            )}
          </div>
        </div>

        {/* Right — Price Chart */}
        <div className="lg:col-span-2 bg-[#111112] border border-white/5 rounded-[2rem] p-8">
          {ph.dates?.length > 0 && ph.stock_prices?.length > 0 ? (
            <PriceChart
              ticker={tk}
              indexName={ph.index_name ?? 'S&P 500'}
              dates={ph.dates}
              stockPrices={ph.stock_prices}
              indexPrices={ph.index_prices ?? []}
              showIndexComparison={!!ph.index_prices?.length}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[#A1A1AA] text-sm opacity-40">
              Chart data unavailable
            </div>
          )}
        </div>
      </div>

      {/* ── 3. AI Insights ── */}
      <div className="bg-[#111112] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#A1A1AA] opacity-60">
              AI Insights
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <Zap size={9} className="text-blue-400" />
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">PRO</span>
          </div>
        </div>
        <InsightTabs
          summary={aiIns.summary ?? null}
          bullCase={aiIns.bull_case ?? null}
          bearCase={aiIns.bear_case ?? null}
          whatToWatch={aiIns.what_to_watch ?? null}
          ticker={tk}
          signals={data}
        />
      </div>

      {/* ── 4. Sentiment Analytics ── */}
      <div>
        <SectionLabel>Sentiment Analytics</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Analyst Consensus */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Analyst Consensus
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--green)' }}>
              {analyst.recommendation_mean ?? (sbuy > 0 ? 'Strong Buy' : 'Buy')}
            </div>
            <div className="text-[11px] text-[#A1A1AA] opacity-40 mb-5">
              {totalAn} analysts
            </div>
            <div className="space-y-2.5">
              {[
                { l: 'Strong Buy', v: sbuy,  c: 'var(--green)' },
                { l: 'Buy',        v: abuy,  c: 'var(--green)' },
                { l: 'Hold',       v: hold,  c: 'var(--amber)' },
                { l: 'Sell',       v: asell, c: 'var(--red)'   },
                { l: 'Strong Sell',v: ssell, c: 'var(--red)'   },
              ].map(({ l, v, c }) => (
                <IndicatorBar
                  key={l}
                  label={l}
                  value={String(v)}
                  score={(v / analystSum) * 100}
                  color={c}
                />
              ))}
            </div>
          </div>

          {/* Price Target Range */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Price Target Range
            </div>
            <RangeIndicator
              current={analyst.price_target_mean ?? analyst.mean_target}
              min={analyst.price_target_low  ?? analyst.low_target}
              max={analyst.price_target_high ?? analyst.high_target}
            />
            <div className="mt-5 space-y-2">
              {[
                { l: 'Mean target',   v: `$${fmt(analyst.price_target_mean ?? analyst.mean_target)}` },
                { l: 'Low target',    v: `$${fmt(analyst.price_target_low  ?? analyst.low_target)}` },
                { l: 'High target',   v: `$${fmt(analyst.price_target_high ?? analyst.high_target)}` },
                {
                  l: 'Upside / downside',
                  v: (() => {
                    const t = analyst.price_target_mean ?? analyst.mean_target;
                    const c = price.current_price;
                    if (!t || !c) return '—';
                    const p = ((t - c) / c) * 100;
                    return (p >= 0 ? '+' : '') + p.toFixed(1) + '%';
                  })(),
                },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between text-[11px]">
                  <span className="text-[#A1A1AA] opacity-50">{l}</span>
                  <span className="font-mono font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* News Sentiment */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-5">
              News Sentiment
            </div>
            {/* Simple SVG donut */}
            <div className="flex items-center gap-6 mb-5">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                {sentScore != null && (
                  <circle
                    cx="36" cy="36" r="28" fill="none"
                    stroke={sentScore >= 0.2 ? 'var(--green)' : sentScore >= -0.2 ? 'var(--amber)' : 'var(--red)'}
                    strokeWidth="10"
                    strokeDasharray={`${Math.PI * 56}`}
                    strokeDashoffset={`${Math.PI * 56 * (1 - clamp((sentScore + 1) / 2))}`}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                )}
                <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#F4F4F5" fontFamily="monospace">
                  {sentScore != null ? (sentScore >= 0 ? '+' : '') + sentScore.toFixed(2) : '—'}
                </text>
              </svg>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[#A1A1AA]">Bullish</span>
                  <span className="font-mono font-bold text-white ml-auto">{nBull}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[#A1A1AA]">Neutral</span>
                  <span className="font-mono font-bold text-white ml-auto">{nNeut}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[#A1A1AA]">Bearish</span>
                  <span className="font-mono font-bold text-white ml-auto">{nBear}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <IndicatorBar label="Bullish" score={(nBull / nTotal) * 100} color="var(--green)" value={`${Math.round((nBull / nTotal) * 100)}%`} />
              <IndicatorBar label="Neutral" score={(nNeut / nTotal) * 100} color="var(--amber)" value={`${Math.round((nNeut / nTotal) * 100)}%`} />
              <IndicatorBar label="Bearish" score={(nBear / nTotal) * 100} color="var(--red)"   value={`${Math.round((nBear / nTotal) * 100)}%`} />
            </div>
          </div>

          {/* Reddit & Insider */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-5">
              Reddit &amp; Insider
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#A1A1AA] opacity-50 uppercase tracking-wider mb-0.5">Reddit rank</div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {reddit.current_rank != null ? `#${reddit.current_rank}` : '—'}
                  </div>
                  <div className="text-[11px] text-[#A1A1AA] opacity-40 mt-0.5">
                    {reddit.mentions_24h != null ? `${reddit.mentions_24h.toLocaleString()} mentions` : ''}
                  </div>
                </div>
                {reddit.momentum_signal && (
                  <span className="text-[9px] font-bold px-3 py-1 rounded-full border"
                    style={{
                      background: reddit.momentum_signal.toLowerCase().includes('surg') || reddit.momentum_signal.toLowerCase().includes('ris') ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                      color: reddit.momentum_signal.toLowerCase().includes('surg') || reddit.momentum_signal.toLowerCase().includes('ris') ? 'var(--green)' : 'var(--blue)',
                      borderColor: reddit.momentum_signal.toLowerCase().includes('surg') || reddit.momentum_signal.toLowerCase().includes('ris') ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                    }}>
                    {reddit.momentum_signal}
                  </span>
                )}
              </div>
              <div className="border-t border-white/5 pt-4">
                <div className="text-[10px] text-[#A1A1AA] opacity-50 uppercase tracking-wider mb-2">Insider MSPR</div>
                <IndicatorBar
                  label=""
                  score={insider.latest_mspr != null ? clamp((insider.latest_mspr + 1) / 2 * 100) : 50}
                  color={insider.latest_mspr != null && insider.latest_mspr > 0 ? 'var(--green)' : 'var(--red)'}
                  value={insider.latest_mspr != null ? fmt(insider.latest_mspr, 3) : '—'}
                />
                {insider.signal && (
                  <div className="text-[11px] text-[#A1A1AA] opacity-50 mt-1.5">{insider.signal}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Technical Analysis ── */}
      <div>
        <SectionLabel>Technical Analysis</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* RSI */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              RSI (14)
            </div>
            <div className="text-5xl font-bold font-mono mb-2"
              style={{ color: tech.rsi_14 >= 70 ? 'var(--red)' : tech.rsi_14 <= 30 ? 'var(--green)' : 'var(--amber)' }}>
              {tech.rsi_14 != null ? fmt(tech.rsi_14, 1) : '—'}
            </div>
            <div className="text-sm text-[#A1A1AA] opacity-50 mb-5">
              {tech.rsi_14 == null ? 'No data' : tech.rsi_14 >= 70 ? 'Overbought' : tech.rsi_14 <= 30 ? 'Oversold' : 'Neutral zone'}
            </div>
            <div className="relative h-1.5 w-full bg-white/5 rounded-full">
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-[#111112] bg-white"
                style={{ left: `${tech.rsi_14 ?? 50}%`, transform: 'translate(-50%,-50%)' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-bold text-[#A1A1AA] opacity-30 uppercase tracking-wider">
              <span>0</span><span>Oversold 30</span><span>70 Overbought</span><span>100</span>
            </div>
          </div>

          {/* Moving Averages */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Moving Averages
            </div>
            <div className="space-y-3">
              {[
                { l: '5d MA',   v: tech.five_day_ma,         pct: tech.price_vs_5d_ma_percent },
                { l: '20d MA',  v: tech.twenty_day_ma,        pct: tech.price_vs_20d_ma_percent },
                { l: '50d MA',  v: tech.fifty_day_ma,         pct: tech.price_vs_50d_ma_percent },
                { l: '200d MA', v: tech.two_hundred_day_ma,   pct: tech.price_vs_200d_ma_percent },
              ].map(({ l, v, pct }) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#A1A1AA] opacity-60 w-16">{l}</span>
                  <span className="text-[11px] font-mono text-white">{v != null ? `$${fmt(v)}` : '—'}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                    style={{
                      background: pct == null ? 'rgba(255,255,255,0.05)'
                        : pct > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: pct == null ? 'var(--tx3)' : pct > 0 ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 52-Week Range */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              52-Week Range
            </div>
            <RangeIndicator
              current={price.current_price}
              min={price.week_52_low}
              max={price.week_52_high}
            />
          </div>

          {/* Volume */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Volume vs Average
            </div>
            <div className="text-2xl font-bold font-mono text-white mb-1">
              {vol != null ? (vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol.toLocaleString()) : '—'}
            </div>
            {volRatio != null && (
              <div className="text-[11px] mb-4"
                style={{ color: volRatio > 1.5 ? 'var(--green)' : volRatio < 0.5 ? 'var(--red)' : 'var(--tx2)' }}>
                {volRatio.toFixed(2)}× average
              </div>
            )}
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#A1A1AA] opacity-50">Today</span>
                <span className="font-mono font-bold text-white">
                  {vol != null ? (vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol.toLocaleString()) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#A1A1AA] opacity-50">30-day avg</span>
                <span className="font-mono font-bold text-[#A1A1AA]">
                  {avgVol != null ? (avgVol >= 1e6 ? `${(avgVol / 1e6).toFixed(1)}M` : avgVol.toLocaleString()) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Institutional & Insider ── */}
      <div>
        <SectionLabel>Institutional &amp; Insider</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StockStatCard label="Institutional" value={inst.percent_held_by_institutions != null ? `${fmt(inst.percent_held_by_institutions, 1)}%` : '—'} subValue="% owned" />
          <StockStatCard label="Insider" value={inst.percent_held_by_insiders != null ? `${fmt(inst.percent_held_by_insiders, 2)}%` : '—'} subValue="% owned" />
          <StockStatCard label="Short Float" value={inst.short_percent_of_float != null ? `${fmt(inst.short_percent_of_float, 1)}%` : '—'} subValue="% float" trend={inst.short_percent_of_float > 15 ? 'down' : null} />
          <StockStatCard label="Short Ratio" value={inst.short_ratio != null ? fmt(inst.short_ratio, 1) : '—'} subValue="days to cover" />
        </div>

        {/* Holders table */}
        {(inst.top_holders ?? []).length > 0 && (
          <div className="bg-[#111112] border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] bg-white/[0.01] border-b border-white/5 px-6 py-4 gap-4">
              {['Holder', 'Shares', '% Owned', 'Change'].map(h => (
                <span key={h} className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {(inst.top_holders as any[]).map((h: any, i: number) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] px-6 py-4 gap-4 items-center">
                  <span className="text-sm text-white font-medium">{h.holder ?? h.name ?? '—'}</span>
                  <span className="text-sm font-mono text-[#A1A1AA]">{h.shares != null ? (h.shares >= 1e6 ? `${(h.shares / 1e6).toFixed(1)}M` : h.shares.toLocaleString()) : '—'}</span>
                  <span className="text-sm font-mono text-[#A1A1AA]">{h.percent != null ? `${fmt(h.percent, 2)}%` : '—'}</span>
                  <span className="text-sm font-mono"
                    style={{ color: h.change == null ? 'var(--tx3)' : h.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {h.change != null ? (h.change >= 0 ? '+' : '') + h.change.toLocaleString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Market Context ── */}
      <div>
        <SectionLabel>Market Context</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* F&G score card */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Fear &amp; Greed Index
            </div>
            <div className="text-6xl font-bold font-mono mb-1" style={{ color: fgAccent(fgScore) }}>
              {fgScore}
            </div>
            <div className="text-lg font-bold mb-4" style={{ color: fgAccent(fgScore) }}>
              {fgLabel(fgScore)}
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full relative overflow-hidden mb-3">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{ width: `${fgScore}%`, background: fgAccent(fgScore) }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: '1W ago', v: Math.round(fg.one_week_ago  ?? 0) },
                { l: '1M ago', v: Math.round(fg.one_month_ago ?? 0) },
                { l: '1Y ago', v: Math.round(fg.one_year_ago  ?? 0) },
              ].map(({ l, v }) => (
                <div key={l} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                  <div className="text-[9px] text-[#A1A1AA] opacity-40 uppercase tracking-wider mb-1">{l}</div>
                  <div className="text-sm font-mono font-bold" style={{ color: fgAccent(v) }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* F&G sub-indicators */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-5">
              Sub-Indicators
            </div>
            <div className="space-y-3">
              {SUB_DEFS.map(({ key, name }) => {
                const s = Math.round((subs as any)[key]?.score ?? 0);
                return (
                  <IndicatorBar
                    key={key}
                    label={name}
                    score={s}
                    value={String(s)}
                    color={s >= 60 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)'}
                  />
                );
              })}
            </div>
          </div>

          {/* VIX gauge */}
          <StockStatCard
            label="VIX"
            value={fmt(fg.vix ?? null, 1)}
            subValue={fg.vix == null ? undefined : fg.vix < 15 ? 'Low volatility' : fg.vix < 25 ? 'Elevated' : 'High volatility'}
            trend={fg.vix != null && fg.vix > 25 ? 'down' : fg.vix != null && fg.vix < 15 ? 'up' : null}
          />

          {/* Short Float gauge */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 mb-4">
              Short Float
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-4">
              {inst.short_percent_of_float != null ? `${fmt(inst.short_percent_of_float, 1)}%` : '—'}
            </div>
            <IndicatorBar
              label=""
              score={inst.short_percent_of_float != null ? clamp((inst.short_percent_of_float / 30) * 100) : 0}
              color={inst.short_percent_of_float > 20 ? 'var(--red)' : inst.short_percent_of_float > 10 ? 'var(--amber)' : 'var(--green)'}
            />
          </div>
        </div>
      </div>

      {/* ── 8. Latest News ── */}
      {articles.length > 0 && (
        <div>
          <SectionLabel>Latest News</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((a: any, i: number) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 bg-[#111112] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-60 border-l border-blue-500 pl-2">
                    {a.source}
                  </span>
                  <span className="text-[9px] font-bold text-[#A1A1AA] opacity-20 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded">
                    {fmtTime(a.published_at)}
                  </span>
                </div>
                <p className="font-serif font-medium leading-snug text-[#F4F4F5] group-hover:text-blue-400 transition-colors mb-4">
                  {a.title}
                </p>
                <span className="text-[10px] font-bold text-blue-400 group-hover:underline uppercase tracking-widest">
                  Read →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
