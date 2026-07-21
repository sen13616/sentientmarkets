'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../Nav';
import Footer from '../Footer';
import Reveal from '../Reveal';
import StockHeader from './StockHeader';
import ContextStrip from './ContextStrip';
import AttributionCard from './AttributionCard';
import InsightCard from './InsightCard';
import NewsCard from './NewsCard';
import HistoryChart from './charts/HistoryChart';
import DriversChart from './charts/DriversChart';
import PressureChart from './charts/PressureChart';
import { Composite, HistoryPayload, PricePoint } from './types';
import { getPriceHistory, getStockHistoryV2, getStockQuoteV2 } from '@/lib/api';
import { fmtGapRange } from '@/lib/stockMath';
import s from './stockpage.module.css';

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

/* Daily bars arrive as bare YYYY-MM-DD dates; Date.parse puts those at
   midnight UTC — ~21h BEFORE the close they represent, which skewed the
   overlay left and broke the tooltip's ≤36h nearest-match. Anchor each
   close at ~4pm ET instead (constant offset; DST-exact isn't needed for a
   daily overlay). */
const US_CLOSE_UTC_MS = 21 * 3600e3;

/* The live point refreshes at the quote route's cache cadence. */
const QUOTE_POLL_MS = 120_000;

function fmtSigned(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
}

/* Semantic coloring for signed stats: positive green, negative red, zero plain. */
function signClass(v: number | null | undefined): string {
  if (v === null || v === undefined || v === 0) return '';
  return v > 0 ? s.pos : s.neg;
}

export default function StockSentimentPage({
  composite,
  initialHistory,
}: {
  composite: Composite;
  initialHistory: HistoryPayload | null;
}) {
  const router = useRouter();
  const [days, setDays] = useState<Range>(30);
  const [history, setHistory] = useState<HistoryPayload | null>(initialHistory);
  const [loadingRange, setLoadingRange] = useState(false);
  // Range payloads are memoized per range; the backend's Redis makes cold
  // switches cheap and warm switches instant.
  const cacheRef = useRef<Map<Range, HistoryPayload>>(
    new Map(initialHistory ? [[30 as Range, initialHistory]] : []),
  );
  // The pressure card is pinned to the initial 30D daily payload — it does
  // not follow the range pills (mockup behavior: a fixed 30-day oscillator).
  const pressureHistory = initialHistory;

  // ── Price overlay ── fetched lazily on first enable, memoized per yfinance
  // period (7D/30D share the 1M payload; 90D uses 3M).
  const [showPrice, setShowPrice] = useState(false);
  const [priceData, setPriceData] = useState<PricePoint[] | null>(null);
  const priceCacheRef = useRef<Map<'1M' | '3M', PricePoint[]>>(new Map());
  const pricePeriod: '1M' | '3M' = days === 90 ? '3M' : '1M';

  useEffect(() => {
    if (!showPrice) return;
    const cached = priceCacheRef.current.get(pricePeriod);
    if (cached) {
      setPriceData(cached);
      return;
    }
    let stale = false;
    getPriceHistory(composite.ticker, pricePeriod)
      .then((d) => {
        const dates: string[] = Array.isArray(d?.dates) ? d.dates : [];
        const closes: unknown[] = Array.isArray(d?.stock_prices) ? d.stock_prices : [];
        const series: PricePoint[] = dates
          .map((iso, i) => ({ t: Date.parse(iso) + US_CLOSE_UTC_MS, close: closes[i] as number }))
          .filter((p) => Number.isFinite(p.t) && typeof p.close === 'number' && Number.isFinite(p.close));
        priceCacheRef.current.set(pricePeriod, series);
        if (!stale) setPriceData(series);
      })
      .catch(() => {
        if (!stale) setPriceData([]);
      });
    return () => {
      stale = true;
    };
  }, [showPrice, pricePeriod, composite.ticker]);

  // ── Live price point ── the daily series ends at the last US close, up to
  // ~28h (weekends: days) behind the sentiment axis. Poll the cached quote
  // route while the overlay is on so the line extends to the current price.
  const [liveQuote, setLiveQuote] = useState<PricePoint | null>(null);

  useEffect(() => {
    if (!showPrice) return;
    let stopped = false;

    const fetchQuote = () => {
      if (document.visibilityState === 'hidden') return;
      getStockQuoteV2(composite.ticker)
        .then((q) => {
          const price = q?.price;
          if (!stopped && typeof price === 'number' && Number.isFinite(price)) {
            setLiveQuote({ t: Date.now(), close: price });
          }
        })
        .catch(() => {
          /* keep the previous live point; the daily line still renders */
        });
    };

    fetchQuote();
    const id = setInterval(fetchQuote, QUOTE_POLL_MS);
    document.addEventListener('visibilitychange', fetchQuote);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', fetchQuote);
    };
  }, [showPrice, composite.ticker]);

  // Slice the fetched period down to the visible sentiment window, then
  // append the live point (never baked into priceCacheRef — the per-period
  // cache stays pure daily-close data).
  const priceSeries = useMemo(() => {
    if (!showPrice || !priceData || !history || history.points.length === 0) return null;
    const start = Date.parse(history.points[0].t) - 86_400_000;
    const sliced = priceData.filter((p) => p.t >= start);
    if (sliced.length < 2) return null;

    if (liveQuote && Number.isFinite(liveQuote.close)) {
      // HistoryChart clips price points to the sentiment x-domain, and "now"
      // is usually past the newest sentiment tick — clamp the live point to
      // the axis end so the line runs exactly to the plot's right edge.
      const axisEnd = Date.parse(history.points[history.points.length - 1].t);
      const t = Math.min(liveQuote.t, axisEnd);
      const last = sliced[sliced.length - 1];
      if (t > last.t) return [...sliced, { t, close: liveQuote.close }];
    }
    return sliced;
  }, [showPrice, priceData, history, liveQuote]);

  const switchRange = useCallback(
    async (next: Range) => {
      const cached = cacheRef.current.get(next);
      if (cached) {
        setDays(next);
        setHistory(cached);
        return;
      }
      setLoadingRange(true);
      try {
        const payload = (await getStockHistoryV2(composite.ticker, next)) as HistoryPayload;
        cacheRef.current.set(next, payload);
        // Commit the pill and the data together — flipping the pill before
        // the fetch left an active 90D pill over a 30D chart whenever the
        // client-side fetch failed (e.g. CORS on preview deploys).
        setDays(next);
        setHistory(payload);
      } catch {
        // fetch failed — pill and chart both stay on the previous range
      } finally {
        setLoadingRange(false);
      }
    },
    [composite.ticker],
  );

  const sentiment = composite.sentiment ?? null;
  const gap = history?.gaps?.[0];
  const pressureGap = pressureHistory?.gaps?.[0];

  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />

      <div className={s.wrap}>
        <StockHeader composite={composite} />

        {!sentiment && (
          <Reveal>
            <div className={s.pending}>
              {composite.ticker} is in the supported universe but hasn&apos;t been scored yet —
              scores appear after the next scoring tick.
            </div>
          </Reveal>
        )}

        {/* ── Sentiment history — first card on the page. The Reveal sits
            OUTSIDE everything that re-renders on a range switch, so it can
            never replay. ── */}
        {history && history.points.length > 0 && (
          <Reveal>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>Sentiment history</div>
              <div className={s.rangePills}>
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${s.pill} ${days === r ? s.pillOn : ''}`}
                    onClick={() => switchRange(r)}
                  >
                    {r}D
                  </button>
                ))}
                <span className={s.pillDivider} aria-hidden="true" />
                <button
                  type="button"
                  className={`${s.pill} ${showPrice ? s.pillOn : ''}`}
                  aria-pressed={showPrice}
                  onClick={() => setShowPrice((v) => !v)}
                >
                  Price
                </button>
              </div>
            </div>
            <div className={s.cardSub}>
              Smoothed composite (4-hour EMA) with raw underlay.
            </div>
            <div className={loadingRange ? s.chartLoading : undefined}>
              <HistoryChart history={history} priceSeries={priceSeries} />
            </div>
            <div className={s.legend}>
              <span><span className={s.legendLineKey} style={{ borderColor: 'var(--blue)' }} />Smoothed score</span>
              <span><span className={`${s.legendLineKey} ${s.legendDashed}`} style={{ borderColor: '#b8c8f0' }} />Raw composite</span>
              <span><span className={s.legendLineKey} style={{ borderColor: 'var(--line-strong)' }} />Neutral 50</span>
              {priceSeries && (
                <span><span className={s.legendLineKey} style={{ borderColor: '#8a919e' }} />Price (right axis)</span>
              )}
              {gap && (
                <span>
                  <span className={s.gapSwatch} />
                  No data {fmtGapRange(gap.from, gap.to)} · never interpolated
                </span>
              )}
            </div>
          </div>
          </Reveal>
        )}

        {sentiment && (
          <Reveal>
            <ContextStrip composite={composite} />
          </Reveal>
        )}

        {sentiment && (
          <Reveal>
            <InsightCard ticker={composite.ticker} />
          </Reveal>
        )}

        {/* ── Sentiment drivers ── */}
        {history && history.points.length > 0 && (
          <Reveal delay={0.1}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>Sentiment drivers</div>
              <span className={s.pill}>
                Channel weights <span className={s.mono}>.35 / .30 / .25 / .10</span>
              </span>
            </div>
            <div className={s.cardSub}>
              Weighted contribution of each channel to the composite at every tick.
            </div>
            <div className={loadingRange ? s.chartLoading : undefined}>
              <DriversChart history={history} />
            </div>
            <div className={s.legend}>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-market)' }} />Market</span>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-narrative)' }} />Narrative</span>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-influencer)' }} />Influencer</span>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-macro)' }} />Macro</span>
            </div>
          </div>
          </Reveal>
        )}

        {sentiment && (
          <div className={s.twoCol}>
            {/* ── Short-term pressure ── */}
            <Reveal className={s.revealCol}>
            <div className={s.card}>
              <div>
                <h3 className={s.cardTitle}>Short-term pressure</h3>
                <p className={s.cardSub}>
                  Raw composite minus the smoothed score. Positive means fresh signal is
                  running ahead of the EMA trend.
                </p>
              </div>
              <div className={s.cardBody}>
                {pressureHistory && pressureHistory.points.length > 0 && (
                  <PressureChart history={pressureHistory} />
                )}
                {pressureGap && (
                  <div className={s.gapNote}>
                    <span className={s.gapSwatch} />
                    <span>
                      No data {fmtGapRange(pressureGap.from, pressureGap.to)} · never interpolated
                    </span>
                  </div>
                )}
              </div>
              <div className={s.cardFoot}>
                <div className={s.stat}>
                  <span className={s.statLabel}>Current gap</span>
                  <span className={`${s.statValue} ${signClass(composite.pressure?.current_gap)}`}>
                    {fmtSigned(composite.pressure?.current_gap)}
                  </span>
                </div>
                <div className={s.stat}>
                  <span className={s.statLabel}>7-day mean</span>
                  <span className={`${s.statValue} ${signClass(composite.pressure?.mean_7d)}`}>
                    {fmtSigned(composite.pressure?.mean_7d)}
                  </span>
                </div>
                {composite.pressure?.reads_as && (
                  <div className={s.stat}>
                    <span className={s.statLabel}>Reads as</span>
                    <span className={`${s.statValue} ${s.statProse}`}>
                      {composite.pressure.reads_as}
                    </span>
                  </div>
                )}
              </div>
            </div>
            </Reveal>

            {/* ── Today's attribution ── */}
            <Reveal delay={0.1} className={s.revealCol}>
              <AttributionCard sentiment={sentiment} />
            </Reveal>
          </div>
        )}

        <Reveal>
          <NewsCard ticker={composite.ticker} />
        </Reveal>

        <div className={s.footNote}>
          Scores are computed on a fixed cadence from market, narrative, influencer and macro
          signals, and served precomputed. Sentiment is not investment advice.
        </div>
      </div>

      <Footer variant="light" />
    </div>
  );
}
