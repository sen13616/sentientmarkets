'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Nav from './components/Nav';
import Footer from './components/Footer';
import HeroSearch from './HeroSearch';
import MoodCard from './components/MoodCard';
import MarketSnapshot from './components/MarketSnapshot';
import SocialFeed from './components/SocialFeed';
import StockDetailPage from './components/StockDetailPage';
import EcgCanvas from './components/EcgCanvas';
import TickerTape from './components/TickerTape';
import ScrollCue from './components/ScrollCue';
import { getHomeData } from '@/lib/api';
import styles from './page.module.css';

type TrendingTicker = { name: string; change: string; positive: boolean };

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'stock'>('home');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [trending, setTrending] = useState<TrendingTicker[]>([]);

  useEffect(() => {
    getHomeData()
      .then((data) => {
        const top5: TrendingTicker[] = (data.trending_tickers ?? [])
          .slice(0, 5)
          .map((t: any) => {
            const pct: number | null = t.mention_change_percent ?? null;
            const signal: string = t.momentum_signal ?? '';
            return {
              name: t.ticker,
              change: pct != null
                ? (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
                : signal,
              positive: pct != null
                ? pct >= 0
                : !signal.toLowerCase().includes('fall'),
            };
          });
        if (top5.length > 0) setTrending(top5);
      })
      .catch(() => {});
  }, []);

  function navigateToStock(ticker: string) {
    setCurrentPage('stock');
    setSelectedTicker(ticker);
  }

  function navigateToHome() {
    setCurrentPage('home');
    setSelectedTicker(null);
  }

  if (currentPage === 'stock') {
    return (
      <div className="min-h-screen bg-[#0A0A0B]">
        <Nav onNavigate={(page) => { if (page === 'home') navigateToHome(); }} />
        <main className="px-6 md:px-20 py-12">
          <StockDetailPage ticker={selectedTicker} onBack={navigateToHome} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <Nav onNavigate={(page) => { if (page === 'home') navigateToHome(); }} />

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* ECG canvas + veils — sits behind all hero content */}
          <EcgCanvas />

          {/* Hero content — above canvas (z-[2]) */}
          <div className="relative z-[2] px-6 md:px-20 pt-24 pb-32 max-w-[600px]">

            {/* Eyebrow */}
            <p className={`font-serif italic text-xl text-[#A1A1AA] mb-4 ${styles.heroFade0}`}>
              Daily Market Intelligence
            </p>

            {/* H1 — two lines stagger independently */}
            <h1 className="text-[3.5rem] md:text-[4.5rem] font-semibold text-white mb-12 leading-[1.1] tracking-[-0.03em]">
              <span className={`block ${styles.heroFade1}`}>Decode the noise.</span>
              <span className={`block text-[#A1A1AA] ${styles.heroFade2}`}>Discover the mood.</span>
            </h1>

            {/* Search */}
            <div className={`w-full max-w-xl mb-12 ${styles.heroFade3}`}>
              <HeroSearch />
            </div>

            {/* Trending tickers */}
            {trending.length > 0 && (
              <div className={`flex flex-wrap items-center gap-3 ${styles.heroFade4}`}>
                <span className="text-[11px] font-bold text-[#F4F4F5]/40 uppercase tracking-widest">
                  Trending:
                </span>
                {trending.map((ticker, i) => (
                  <motion.button
                    key={ticker.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.65 + i * 0.05, ease: 'easeOut' }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => navigateToStock(ticker.name)}
                    className="bg-[#18181B] border border-[#27272A] px-4 py-2 rounded-lg text-sm font-medium text-[#D4D4D8] hover:border-[#3F3F46] transition-colors"
                  >
                    {ticker.name}{' '}
                    {ticker.change && (
                      <span className={`text-xs font-mono ${ticker.positive ? 'text-green-500' : 'text-red-400'}`}>
                        {ticker.change}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Scroll cue — absolute at bottom-left, fades in after 1.2s */}
          <ScrollCue />
        </section>

        {/* ── Ticker Tape ── */}
        <TickerTape />

        {/* ── Market Mood ── */}
        <section className="px-6 md:px-20 pb-20">
          <MoodCard />
        </section>

        {/* ── Market Snapshot ── */}
        <section className="px-6 md:px-20 pb-20">
          <MarketSnapshot />
        </section>

        {/* ── Reddit Trending + Mood Insights ── */}
        <section className="px-6 md:px-20 pb-20">
          <SocialFeed onNavigate={navigateToStock} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
