'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import Nav from '../Nav';
import Footer from '../Footer';
import Reveal from '../Reveal';
import FilterRail from './FilterRail';
import ResultsTable, { SortDir, SortKey } from './ResultsTable';
import {
  ALL_SECTORS,
  DEFAULT_FILTERS,
  Filters,
  PRESETS,
  PresetKey,
  Range,
  ScreenerPayload,
  ScreenerRow,
} from './types';
import s from './screenerpage.module.css';

function inRange(v: number, [lo, hi]: Range): boolean {
  return v >= lo && v <= hi;
}

function rangeActive(value: Range, def: Range): boolean {
  return value[0] !== def[0] || value[1] !== def[1];
}

/* How many filters differ from defaults — shown on the mobile Filters toggle. */
function countActiveFilters(f: Filters): number {
  let n = 0;
  if (rangeActive(f.composite, DEFAULT_FILTERS.composite)) n++;
  if (rangeActive(f.change1d, DEFAULT_FILTERS.change1d)) n++;
  if (rangeActive(f.percentile, DEFAULT_FILTERS.percentile)) n++;
  for (const ch of Object.keys(f.channels) as (keyof Filters['channels'])[]) {
    if (rangeActive(f.channels[ch], DEFAULT_FILTERS.channels[ch])) n++;
  }
  if (f.spread !== 'any') n++;
  if (f.sectorRank !== 'any') n++;
  if (f.sectors.length !== ALL_SECTORS.length) n++;
  if (f.minConfidence > 0) n++;
  if (f.excludeMissing) n++;
  if (f.excludeCold) n++;
  if (f.excludeStale) n++;
  if (f.crossingNeutral) n++;
  return n;
}

/* Null semantics: a row with a null value for an ACTIVE (narrowed) filter is
   excluded; untouched filters exclude nothing. */
function passes(row: ScreenerRow, f: Filters): boolean {
  if (!inRange(row.score, f.composite)) return false;

  if (rangeActive(f.change1d, DEFAULT_FILTERS.change1d)) {
    if (row.change_1d === null || !inRange(row.change_1d, f.change1d)) return false;
  }
  if (rangeActive(f.percentile, DEFAULT_FILTERS.percentile)) {
    if (row.percentile === null || !inRange(row.percentile, f.percentile)) return false;
  }
  for (const ch of Object.keys(f.channels) as (keyof Filters['channels'])[]) {
    if (rangeActive(f.channels[ch], DEFAULT_FILTERS.channels[ch])) {
      const v = row.sub[ch];
      if (v === null || !inRange(v, f.channels[ch])) return false;
    }
  }
  if (f.spread !== 'any' && row.spread_class !== f.spread) return false;

  if (f.sectorRank !== 'any') {
    if (row.rank === null) return false;
    if (f.sectorRank === 'top3' && row.rank > 3) return false;
    if (f.sectorRank === 'top10' && row.rank > 10) return false;
    if (f.sectorRank === 'bottom10') {
      if (row.sector_size === null || row.rank <= row.sector_size - 10) return false;
    }
  }
  if (f.sectors.length !== ALL_SECTORS.length) {
    if (row.sector === null || !f.sectors.includes(row.sector)) return false;
  }
  if (f.minConfidence > 0) {
    if (row.confidence === null || row.confidence < f.minConfidence) return false;
  }
  if (f.excludeMissing && row.missing_layers.length > 0) return false;
  if (f.excludeCold && row.cold_start) return false;
  if (f.excludeStale && row.stale) return false;
  if (f.crossingNeutral) {
    if (row.change_1d === null) return false;
    const before = row.score - row.change_1d < 50;
    const now = row.score < 50;
    if (before === now) return false;
  }
  return true;
}

export default function ScreenerPage({ data }: { data: ScreenerPayload }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activePreset, setActivePreset] = useState<PresetKey | null>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  // Collapsed by default on phones so the results table is visible on landing.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Manual edits clear the active preset highlight; presets replace state.
  const patch = (p: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...p }));
    setActivePreset(null);
  };
  const applyPreset = (key: PresetKey) => {
    const preset = PRESETS.find((p) => p.key === key)!;
    setFilters({ ...DEFAULT_FILTERS, ...preset.apply });
    setActivePreset(key);
  };
  const clearAll = () => applyPreset('all');

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const matches = useMemo(() => {
    const filtered = data.rows.filter((row) => passes(row, filters));
    const dir = sortDir === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const av = sortKey === 'score' ? a.score : a.change_1d;
      const bv = sortKey === 'score' ? b.score : b.change_1d;
      // nulls always sink to the bottom regardless of direction
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
    return filtered;
  }, [data.rows, filters, sortKey, sortDir]);

  return (
    <div className={`${s.page} home-light`}>
      <Nav variant="light" onNavigate={(page) => { if (page === 'home') router.push('/'); }} />

      <div className={s.wrap}>
        <div className={s.head}>
          <div className={s.fadeUp0}>
            <div className={s.hTitle}>Screener</div>
            <div className={s.hSub}>
              Filter the universe by sentiment structure — where the channels agree, and where
              they don&apos;t.
            </div>
          </div>
          <div className={`${s.hCount} ${s.fadeUp1}`}>
            <div className={s.countNum}>{matches.length}</div>
            <div className={s.countSub}>of {data.universe_scored} names match</div>
          </div>
        </div>

        <Reveal>
          <div className={s.presets}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`${s.preset} ${activePreset === p.key ? s.presetOn : ''}`}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className={s.cols}>
          <Reveal>
            <div>
              <button
                type="button"
                className={s.filtersToggle}
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <span className={s.filtersToggleLabel}>
                  Filters
                  {countActiveFilters(filters) > 0 && (
                    <span className={s.filtersBadge}>{countActiveFilters(filters)}</span>
                  )}
                </span>
                <ChevronDown size={16} className={filtersOpen ? s.chevOpen : undefined} />
              </button>
              <div className={`${s.railWrap} ${filtersOpen ? s.railWrapOpen : ''}`}>
                <FilterRail filters={filters} patch={patch} clearAll={clearAll} />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ResultsTable
              rows={matches}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              clearAll={clearAll}
            />
          </Reveal>
        </div>
      </div>

      <Footer variant="light" />
    </div>
  );
}
