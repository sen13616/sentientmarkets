'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../Nav';
import Footer from '../Footer';
import StockHeader from './StockHeader';
import ContextStrip from './ContextStrip';
import AttributionCard from './AttributionCard';
import HistoryChart from './charts/HistoryChart';
import DriversChart from './charts/DriversChart';
import PressureChart from './charts/PressureChart';
import { Composite, HistoryPayload } from './types';
import { getStockHistoryV2 } from '@/lib/api';
import { fmtGapRange } from '@/lib/stockMath';
import s from './stockpage.module.css';

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

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

  const switchRange = useCallback(
    async (next: Range) => {
      setDays(next);
      const cached = cacheRef.current.get(next);
      if (cached) {
        setHistory(cached);
        return;
      }
      setLoadingRange(true);
      try {
        const payload = (await getStockHistoryV2(composite.ticker, next)) as HistoryPayload;
        cacheRef.current.set(next, payload);
        setHistory(payload);
      } catch {
        // keep the previous range on failure
      } finally {
        setLoadingRange(false);
      }
    },
    [composite.ticker],
  );

  const sentiment = composite.sentiment ?? null;
  const gap = history?.gaps?.[0];

  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />

      <div className={s.wrap}>
        <StockHeader composite={composite} />

        {!sentiment && (
          <div className={s.pending}>
            {composite.ticker} is in the supported universe but hasn&apos;t been scored yet —
            scores appear after the next scoring tick.
          </div>
        )}

        {sentiment && <ContextStrip composite={composite} />}

        {/* ── Sentiment history ── */}
        {history && history.points.length > 0 && (
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
              </div>
            </div>
            <div className={s.cardSub}>
              Smoothed composite (4-hour EMA) with raw composite underlay. Windows never
              interpolate across missing data.
            </div>
            <div className={loadingRange ? s.chartLoading : undefined}>
              <HistoryChart history={history} hatchId="hatch-history" />
            </div>
            <div className={s.legend}>
              <span><span className={s.legendLineKey} style={{ borderColor: 'var(--blue)' }} />Smoothed score</span>
              <span><span className={`${s.legendLineKey} ${s.legendDashed}`} style={{ borderColor: '#b8c8f0' }} />Raw composite</span>
              <span><span className={s.legendLineKey} style={{ borderColor: 'var(--line-strong)' }} />Neutral 50</span>
            </div>
            {gap && (
              <div className={s.gapNote}>
                <span className={s.gapSwatch} />
                No data · {fmtGapRange(gap.from, gap.to)} · stats skip this window, never interpolate
              </div>
            )}
          </div>
        )}

        {/* ── Sentiment drivers ── */}
        {history && history.points.length > 0 && (
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>
                Sentiment drivers <span className={s.newTag}>New</span>
              </div>
              <span className={s.pill}>
                Channel weights <span className={s.mono}>.35 / .30 / .25 / .10</span>
              </span>
            </div>
            <div className={s.cardSub}>
              Weighted contribution of each channel to the composite at every scoring tick —
              why the score is where it is, not just where it is.
            </div>
            <div className={loadingRange ? s.chartLoading : undefined}>
              <DriversChart history={history} hatchId="hatch-drivers" />
            </div>
            <div className={s.legend}>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-market)' }} />Market</span>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-narrative)' }} />Narrative</span>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-influencer)' }} />Influencer</span>
              <span><span className={s.legendKey} style={{ background: 'var(--ch-macro)' }} />Macro</span>
            </div>
          </div>
        )}

        {sentiment && (
          <div className={s.twoCol}>
            {/* ── Short-term pressure ── */}
            <div className={s.card}>
              <div className={s.cardHead}>
                <div className={s.cardTitle}>
                  Short-term pressure <span className={s.newTag}>New</span>
                </div>
              </div>
              <div className={s.cardSub}>
                Raw minus smoothed score. Positive bars: fresh signal running ahead of the EMA
                trend. Negative: cooling under it.
              </div>
              {pressureHistory && pressureHistory.points.length > 0 && (
                <PressureChart history={pressureHistory} hatchId="hatch-pressure" />
              )}
              <div className={s.pressFoot}>
                <div className={s.pfItem}>
                  <div className={s.ctxLabel}>Current gap</div>
                  <div
                    className={`${s.mono} ${
                      (composite.pressure?.current_gap ?? 0) > 0
                        ? s.pfGreen
                        : (composite.pressure?.current_gap ?? 0) < 0
                          ? s.pfRed
                          : ''
                    }`}
                  >
                    {composite.pressure?.current_gap !== null && composite.pressure?.current_gap !== undefined
                      ? `${composite.pressure.current_gap >= 0 ? '+' : ''}${composite.pressure.current_gap.toFixed(1)}`
                      : '—'}
                  </div>
                </div>
                <div className={s.pfItem}>
                  <div className={s.ctxLabel}>7-day mean</div>
                  <div className={s.mono}>
                    {composite.pressure?.mean_7d !== null && composite.pressure?.mean_7d !== undefined
                      ? `${composite.pressure.mean_7d >= 0 ? '+' : ''}${composite.pressure.mean_7d.toFixed(1)}`
                      : '—'}
                  </div>
                </div>
                {composite.pressure?.reads_as && (
                  <div className={s.pfItem}>
                    <div className={s.ctxLabel}>Reads as</div>
                    <div className={s.pfText}>{composite.pressure.reads_as}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Today's attribution ── */}
            <AttributionCard sentiment={sentiment} />
          </div>
        )}

        <div className={s.footNote}>
          Scores are computed on a fixed cadence from market, narrative, influencer and macro
          signals, and served precomputed. Sentiment is not investment advice.
        </div>
      </div>

      <Footer variant="light" />
    </div>
  );
}
