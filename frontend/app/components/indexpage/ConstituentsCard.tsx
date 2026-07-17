'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Constituent, Mover } from './types';
import s from './indexpage.module.css';

type SortKey = 'score' | 'sector' | 'movers' | 'az';

const SORT_LABELS: Record<SortKey, string> = {
  score: 'Score',
  sector: 'Sector',
  movers: 'Movers',
  az: 'A–Z',
};

const COLLAPSED_ROWS = 10;

/* Full constituents table: sortable, collapsed to the top rows by default,
   every row linking to its stock page. The "Movers" sort uses the payload's
   top/bottom mover deltas (the only per-ticker 1d data the overview carries)
   — movers first by |Δ|, everyone else behind them by score. */
export default function ConstituentsCard({
  constituents,
  universeScored,
  movers,
}: {
  constituents: Constituent[];
  universeScored: number | null;
  movers: { top: Mover[]; bottom: Mover[] };
}) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [expanded, setExpanded] = useState(false);

  const moverDelta = useMemo(() => {
    const m = new Map<string, number>();
    for (const mv of [...movers.top, ...movers.bottom]) {
      if (mv.change_1d !== null) m.set(mv.ticker, mv.change_1d);
    }
    return m;
  }, [movers]);

  const sorted = useMemo(() => {
    const rows = [...constituents];
    const byScoreDesc = (a: Constituent, b: Constituent) =>
      (b.score ?? -1) - (a.score ?? -1);
    if (sortKey === 'score') rows.sort(byScoreDesc);
    if (sortKey === 'az') rows.sort((a, b) => a.ticker.localeCompare(b.ticker));
    if (sortKey === 'sector') {
      rows.sort(
        (a, b) =>
          (a.sector ?? '').localeCompare(b.sector ?? '') ||
          (a.rank ?? 999) - (b.rank ?? 999),
      );
    }
    if (sortKey === 'movers') {
      rows.sort((a, b) => {
        const da = moverDelta.get(a.ticker);
        const db = moverDelta.get(b.ticker);
        if (da !== undefined || db !== undefined) {
          return Math.abs(db ?? 0) - Math.abs(da ?? 0);
        }
        return byScoreDesc(a, b);
      });
    }
    return rows;
  }, [constituents, sortKey, moverDelta]);

  if (constituents.length === 0) return null;
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_ROWS);
  const total = universeScored ?? constituents.length;

  return (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Constituents</h3>
      <p className={s.cardSub}>Every scored name, with its rank inside its own sector.</p>

      <div className={s.tblHead}>
        <span>Ticker</span><span>Name</span><span>Sector</span><span>Score</span><span>Sector rank</span>
      </div>
      {visible.map((c) => (
        <Link key={c.ticker} href={`/stock/${c.ticker}`} className={s.tblRow}>
          <span className={s.cTicker}>{c.ticker}</span>
          <span className={s.cName}>{c.name ?? '—'}</span>
          <span className={s.cSector}>{c.sector ?? '—'}</span>
          <span className={s.cScore}>{c.score !== null ? c.score.toFixed(1) : '—'}</span>
          <span className={s.cRank}>
            {c.rank !== null && c.sector_size !== null ? `#${c.rank} of ${c.sector_size}` : '—'}
          </span>
        </Link>
      ))}

      <div className={s.tblFoot}>
        <div className={s.sortPills}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`${s.pill} ${sortKey === key ? s.pillOn : ''}`}
              onClick={() => setSortKey(key)}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
        <button type="button" className={s.showAll} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show top 10 ↑' : `Show all ${total} →`}
        </button>
      </div>
    </div>
  );
}
