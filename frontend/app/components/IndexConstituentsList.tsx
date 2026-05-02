'use client';

import { useState } from 'react';
import Link from 'next/link';
import { scoreColor } from '@/app/components/AssetPage';
import type { ConstituentRow } from '@/app/components/IndexConstituents';

type SortKey = 'mood' | 'marketCap' | 'movers';

const SORT_LABELS: Record<SortKey, string> = {
  mood: 'Mood',
  marketCap: 'Market cap',
  movers: 'Movers',
};

function moodLabel(score: number): string {
  if (score >= 75) return 'Very Bullish';
  if (score >= 60) return 'Leaning Bullish';
  if (score >= 45) return 'Neutral';
  if (score >= 30) return 'Leaning Bearish';
  return 'Very Bearish';
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

const GRID_COLS = '36px 72px minmax(0, 1fr) 140px minmax(140px, 200px) 84px';

export default function IndexConstituentsList({ rows }: { rows: ConstituentRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('mood');
  const [expanded, setExpanded] = useState(false);

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === 'mood') return b.sentiment - a.sentiment;
    if (sortKey === 'marketCap') return b.marketCap - a.marketCap;
    return Math.abs(b.changePercent) - Math.abs(a.changePercent);
  });

  const visible = expanded ? sorted : sorted.slice(0, 10);
  const visibilityLabel = expanded
    ? `Showing all ${sorted.length} by ${SORT_LABELS[sortKey]}`
    : `Top 10 by ${SORT_LABELS[sortKey]}`;

  return (
    <>
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '1.4px',
            color: 'var(--tx3)',
          }}
        >
          {visibilityLabel}
        </span>
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid var(--line-soft)',
            borderRadius: 999,
          }}
        >
          <SortChip active={sortKey === 'mood'} onClick={() => setSortKey('mood')} label="Mood" />
          <SortChip
            active={sortKey === 'marketCap'}
            onClick={() => setSortKey('marketCap')}
            label="Market cap"
          />
          <SortChip
            active={sortKey === 'movers'}
            onClick={() => setSortKey('movers')}
            label="Movers"
          />
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID_COLS,
          gap: 16,
          padding: '10px 14px',
          borderBottom: '1px solid var(--line-soft)',
          fontFamily: 'var(--mono)',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          color: 'var(--tx3)',
        }}
      >
        <div>#</div>
        <div>Ticker</div>
        <div>Company</div>
        <div>Mood</div>
        <div>Sentiment</div>
        <div style={{ textAlign: 'right' }}>Change</div>
      </div>

      {/* Rows */}
      <div>
        {visible.map((row, i) => (
          <Link
            key={row.ticker}
            href={`/stock/${row.ticker}`}
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <RowItem row={row} rank={i + 1} />
          </Link>
        ))}
      </div>

      {/* Expand / collapse */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          marginTop: 16,
          padding: '14px 16px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid var(--line-soft)',
          borderRadius: 12,
          color: 'var(--tx2)',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          cursor: 'pointer',
          transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.color = 'var(--tx1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
          e.currentTarget.style.borderColor = 'var(--line-soft)';
          e.currentTarget.style.color = 'var(--tx2)';
        }}
      >
        {expanded ? 'Show less' : `Show all ${sorted.length}`}
        <span
          style={{
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        >
          ▾
        </span>
      </button>
    </>
  );
}

function SortChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none',
        borderRadius: 999,
        color: active ? 'var(--tx1)' : 'var(--tx2)',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

function RowItem({ row, rank }: { row: ConstituentRow; rank: number }) {
  const score = Math.round(row.sentiment);
  const color = scoreColor(score);
  const changeColor = row.changePercent >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: GRID_COLS,
        gap: 16,
        alignItems: 'center',
        padding: '14px',
        borderBottom: '1px solid var(--line-soft)',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx3)' }}>
        {String(rank).padStart(2, '0')}
      </span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--tx1)',
          letterSpacing: '0.5px',
        }}
      >
        {row.ticker}
      </span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--tx2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.name}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 24,
            lineHeight: 1,
            color,
            fontWeight: 400,
            letterSpacing: '-0.5px',
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--tx3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {moodLabel(score)}
        </span>
      </div>
      <SentimentBar score={score} />
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          fontWeight: 600,
          color: changeColor,
          textAlign: 'right',
        }}
      >
        {fmtPct(row.changePercent)}
      </span>
    </div>
  );
}

function SentimentBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div style={{ position: 'relative', width: '100%', height: 4 }}>
      {/* Track: full gradient at low opacity */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          background: 'linear-gradient(to right, var(--red) 0%, var(--amber) 50%, var(--green) 100%)',
          opacity: 0.18,
        }}
      />
      {/* Fill: clipping container at score width, full-bar gradient inside */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${10000 / Math.max(pct, 1)}%`,
            background:
              'linear-gradient(to right, var(--red) 0%, var(--amber) 50%, var(--green) 100%)',
          }}
        />
      </div>
      {/* Marker */}
      <div
        style={{
          position: 'absolute',
          left: `${pct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8,
          height: 8,
          background: 'var(--tx1)',
          borderRadius: 999,
          border: '1.5px solid var(--bg)',
        }}
      />
    </div>
  );
}
