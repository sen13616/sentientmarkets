'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Nav from './components/Nav';
import Footer from './components/Footer';
import HeroSearch from './HeroSearch';
import MoodCard from './components/MoodCard';
import MarketSnapshot from './components/MarketSnapshot';
import SocialFeed from './components/SocialFeed';
import TickerTape from './components/TickerTape';
import HeartCanvas from './components/HeartCanvas';
import { getHomeData, getStockQuoteV2 } from '@/lib/api';
import styles from './page.module.css';

type TrendingTicker = { name: string; change: string; positive: boolean };

export default function Home() {
  const router = useRouter();
  const [trending, setTrending] = useState<TrendingTicker[]>([]);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getHomeData();
        const top: any[] = (data.trending_tickers ?? []).slice(0, 5);
        if (top.length === 0) return;
        // The chip % is the 1d PRICE change (cheap cached quote route) — the
        // old mention_change_percent was Reddit mention growth and read as a
        // wildly wrong price stat (e.g. NFLX "+603.6%").
        const quotes = await Promise.all(
          top.map((t) => getStockQuoteV2(t.ticker).catch(() => null)),
        );
        const top5: TrendingTicker[] = top.map((t, i) => {
          const pct: number | null = quotes[i]?.change_percent ?? null;
          return {
            name: t.ticker,
            // No quote → chip shows just the ticker; never a stand-in stat.
            change: pct != null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '',
            positive: pct != null ? pct >= 0 : true,
          };
        });
        setTrending(top5);
      } catch {
        /* chips simply don't render */
      }
    })();
  }, []);

  // Ticker clicks route to the SentimentAPI-driven /stock/[ticker] page
  // (the old in-page StockDetailPage swap is retired; the component remains
  // in the repo for the asset-page fallback ecosystem).
  function navigateToStock(ticker: string) {
    router.push(`/stock/${encodeURIComponent(ticker)}`);
  }

  function navigateToHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') navigateToHome(); }} />

      <main>
        {/* ── Hero — full-viewport editorial band (NEW_DESIGN). Fills the
            screen below the 56px nav and re-centers on any resize; the
            ticker tape forms its bottom edge. ── */}
        <section className="relative min-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden">
          {/* 3D particle heart + white veil — sits behind all hero content */}
          <HeartCanvas />

          {/* Asymmetric vertical padding nudges the content block above true
              mathematical center — full-screen heroes read balanced when the
              content sits slightly high. */}
          <div className="relative z-[2] flex-1 flex items-center justify-center px-6 md:px-20 pt-[6vh] pb-[14vh]">
            <div className={`relative mx-auto w-full max-w-[760px] text-center ${searchFocused ? 'z-[45]' : 'z-[2]'}`}>

              {/* Eyebrow — muted uppercase caption */}
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
                Daily Market Intelligence
              </p>

              {/* H1 — Inter at weight 400 (editorial calm), two-line stagger */}
              <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-normal text-[#0a0b0d] mb-8 leading-[1.05] tracking-[-0.04em]">
                <span className={`block text-[#5b616e] ${styles.heroFade1}`}>Decode the noise.</span>
                <span className={`block ${styles.heroFade2}`}>Discover the mood.</span>
              </h1>

              {/* Search */}
              <div className={`w-full max-w-[600px] mx-auto mb-8 ${styles.heroFade3}`}>
                <HeroSearch onFocusModeChange={setSearchFocused} />
              </div>

              {/* Trending tickers — the chips arrive from an async fetch, so
                  the row animates open (height 0 → auto) instead of popping
                  in: the hero re-centers as a glide, not a jump, while the
                  chips fade up inside the opening space. */}
              {trending.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{
                    height: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.45, delay: 0.15, ease: 'easeOut' },
                  }}
                  className="overflow-hidden"
                >
                  <div className={`flex flex-wrap items-center justify-center gap-2.5 transition-all duration-300 ease-out ${searchFocused ? 'opacity-30 pointer-events-none' : ''}`}>
                    <span className="text-[11px] font-semibold text-[#7c828a] uppercase tracking-[0.08em]">
                      Trending
                    </span>
                    {trending.map((ticker, i) => (
                      <motion.button
                        key={ticker.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
                        onClick={() => navigateToStock(ticker.name)}
                        className="inline-flex items-center gap-1.5 bg-[#f7f7f7] border border-[#dee1e6] px-3.5 py-1.5 rounded-full text-sm font-medium text-[#0a0b0d] hover:border-[#a8acb3] transition-colors"
                      >
                        {ticker.name}
                        {ticker.change && (
                          <span className={`text-xs font-mono ${ticker.positive ? 'text-[#05b169]' : 'text-[#cf202f]'}`}>
                            {ticker.change}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Ticker Tape — pinned flush to the hero's bottom edge, a
              data footer to the fold. z-[1]: above the heart canvas, below
              the search focus vignette. ── */}
          <div className="relative z-[1]">
            <TickerTape />
          </div>
        </section>

        {/* ── Market Mood ── */}
        <section className="px-6 md:px-20 pt-20 md:pt-[88px] pb-20 md:pb-[88px]">
          <div className="mx-auto w-full max-w-[1200px]">
            <MoodCard />
          </div>
        </section>

        {/* ── Market Snapshot ── */}
        <section className="px-6 md:px-20 pb-20 md:pb-[88px]">
          <div className="mx-auto w-full max-w-[1200px]">
            <MarketSnapshot />
          </div>
        </section>

        {/* ── Reddit Trending + Mood Insights ── */}
        <section className="px-6 md:px-20 pb-20 md:pb-[88px]">
          <div className="mx-auto w-full max-w-[1200px]">
            <SocialFeed onNavigate={navigateToStock} />
          </div>
        </section>
      </main>

      <Footer variant="light" />
    </div>
  );
}
