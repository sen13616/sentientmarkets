'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import SparkSpread from './SparkSpread';
import { CHANNEL_COLORS, CHANNEL_LABELS, CHANNELS, ScreenerRow } from './types';
import s from './screenerpage.module.css';

export type SortKey = 'score' | 'change_1d';
export type SortDir = 'asc' | 'desc';

const COLLAPSED_ROWS = 60;

const Row = memo(function Row({ row }: { row: ScreenerRow }) {
  return (
    <Link href={`/stock/${row.ticker}`} className={s.tRow}>
      <span className={s.rTicker}>{row.ticker}</span>
      <span className={s.rName}>{row.name ?? '—'}</span>
      <span className={s.rSector}>{row.sector ?? '—'}</span>
      <span className={s.rScore}>{row.score.toFixed(1)}</span>
      <span
        className={`${s.rDelta} ${
          row.change_1d !== null ? (row.change_1d >= 0 ? s.pos : s.neg) : ''
        }`}
      >
        {row.change_1d !== null
          ? `${row.change_1d >= 0 ? '+' : '−'}${Math.abs(row.change_1d).toFixed(1)}`
          : '—'}
      </span>
      <SparkSpread row={row} />
      <span className={s.rPctl}>{row.percentile !== null ? `p${Math.round(row.percentile)}` : '—'}</span>
      <span className={s.rRank}>
        {row.rank !== null && row.sector_size !== null ? `#${row.rank}/${row.sector_size}` : '—'}
      </span>
    </Link>
  );
});

/* Sortable results table with a collapsed default, channel legend footer,
   and a guided empty state (never a bare "0 results"). */
export default function ResultsTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  clearAll,
}: {
  rows: ScreenerRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  clearAll: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
  const arrow = sortDir === 'desc' ? '↓' : '↑';

  return (
    <div>
      <div className={s.tbl}>
        <div className={s.tHead}>
          <span>Ticker</span>
          <span>Name</span>
          <span>Sector</span>
          <button
            type="button"
            className={`${s.sortable} ${sortKey === 'score' ? s.sortOn : ''}`}
            onClick={() => onSort('score')}
          >
            Score {sortKey === 'score' ? arrow : ''}
          </button>
          <button
            type="button"
            className={`${s.sortable} ${sortKey === 'change_1d' ? s.sortOn : ''}`}
            onClick={() => onSort('change_1d')}
          >
            1d {sortKey === 'change_1d' ? arrow : ''}
          </button>
          <span>Channel spread</span>
          <span>Pctl</span>
          <span>Rank</span>
        </div>

        {rows.length === 0 ? (
          <div className={s.empty}>
            No names match these filters — loosen one, or start over.
            <div>
              <button type="button" className={s.emptyClear} onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          visible.map((row) => <Row key={row.ticker} row={row} />)
        )}

        <div className={s.tFoot}>
          <div className={s.legend}>
            {CHANNELS.map((ch) => (
              <span key={ch} className={s.lgItem}>
                <span className={s.lgDot} style={{ background: CHANNEL_COLORS[ch] }} />
                {CHANNEL_LABELS[ch]}
              </span>
            ))}
            <span style={{ color: '#c9cfd8' }}>|</span>
            <span>tick = neutral 50</span>
          </div>
          {rows.length > COLLAPSED_ROWS && !expanded ? (
            <button type="button" className={s.loadMore} onClick={() => setExpanded(true)}>
              Show all {rows.length} matches →
            </button>
          ) : (
            <span className={s.footInfo}>
              {rows.length === 0 ? 'No matches' : `All ${rows.length} matches shown`}
            </span>
          )}
        </div>
      </div>

      <p className={s.note}>
        Screens describe the current sentiment state of each name. They are not recommendations,
        carry no predictive claim, and are not investment advice. Channel values are sub-index
        scores on a 0–100 scale where 50 is that channel&apos;s own long-run neutral — they are
        not directly comparable across channels in absolute terms, only in whether they agree.
      </p>
    </div>
  );
}
