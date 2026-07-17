'use client';

import RangeSlider, { MinSlider } from './RangeSlider';
import { ALL_SECTORS, CHANNEL_LABELS, CHANNELS, Filters } from './types';
import s from './screenerpage.module.css';

const SPREAD_OPTIONS = [
  ['any', 'Any'],
  ['tight', 'Tight'],
  ['moderate', 'Moderate'],
  ['wide', 'Wide'],
] as const;

const RANK_OPTIONS = [
  ['any', 'Any'],
  ['top3', 'Top 3'],
  ['top10', 'Top 10'],
  ['bottom10', 'Bottom 10'],
] as const;

const QUALITY_CHECKS: [keyof Filters, string][] = [
  ['excludeMissing', 'Exclude missing channels'],
  ['excludeCold', 'Exclude cold start'],
  ['excludeStale', 'Exclude stale signals'],
];

/* The four mockup filter groups. Every control routes through `patch` so
   the page can clear the active preset on any manual change. */
export default function FilterRail({
  filters,
  patch,
  clearAll,
}: {
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
  clearAll: () => void;
}) {
  const allSectors = filters.sectors.length === ALL_SECTORS.length;

  const toggleSector = (sector: string) => {
    const on = filters.sectors.includes(sector);
    patch({
      sectors: on
        ? filters.sectors.filter((x) => x !== sector)
        : [...filters.sectors, sector],
    });
  };

  return (
    <div className={s.rail}>
      <div className={s.fGroup}>
        <div className={s.fGroupTitle}>Score</div>
        <RangeSlider
          label="Composite"
          min={0}
          max={100}
          value={filters.composite}
          onChange={(v) => patch({ composite: v })}
        />
        <RangeSlider
          label="1-day change"
          min={-20}
          max={20}
          value={filters.change1d}
          onChange={(v) => patch({ change1d: v })}
        />
        <RangeSlider
          label="Universe percentile"
          min={0}
          max={100}
          value={filters.percentile}
          onChange={(v) => patch({ percentile: v })}
        />
      </div>

      <div className={s.fGroup}>
        <div className={s.fGroupTitle}>Channels</div>
        {CHANNELS.map((ch) => (
          <RangeSlider
            key={ch}
            label={CHANNEL_LABELS[ch]}
            min={0}
            max={100}
            value={filters.channels[ch]}
            onChange={(v) => patch({ channels: { ...filters.channels, [ch]: v } })}
          />
        ))}
        <div className={s.f}>
          <div className={s.fLabel}>
            <span className={s.fName}>Channel spread</span>
          </div>
          <div className={s.chips}>
            {SPREAD_OPTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${s.chip} ${filters.spread === key ? s.chipOn : ''}`}
                onClick={() => patch({ spread: key })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.fGroup}>
        <div className={s.fGroupTitle}>Position</div>
        <div className={s.f}>
          <div className={s.fLabel}>
            <span className={s.fName}>Sector rank</span>
            <span className={`${s.fVal} ${filters.sectorRank !== 'any' ? s.fValAct : ''}`}>
              {filters.sectorRank === 'any' ? 'any' : ''}
            </span>
          </div>
          <div className={s.chips}>
            {RANK_OPTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${s.chip} ${filters.sectorRank === key ? s.chipOn : ''}`}
                onClick={() => patch({ sectorRank: key })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={s.f}>
          <div className={s.fLabel}>
            <span className={s.fName}>Sectors</span>
            <span className={`${s.fVal} ${allSectors ? '' : s.fValAct}`}>
              {allSectors ? `all ${ALL_SECTORS.length}` : `${filters.sectors.length} of ${ALL_SECTORS.length}`}
            </span>
          </div>
          <div className={`${s.checks} ${s.sectorList}`}>
            {ALL_SECTORS.map((sector) => {
              const on = filters.sectors.includes(sector);
              return (
                <button
                  key={sector}
                  type="button"
                  className={s.check}
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleSector(sector)}
                >
                  <span className={`${s.box} ${on ? s.boxOn : ''}`} />
                  {sector}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={s.fGroup}>
        <div className={s.fGroupTitle}>Data quality</div>
        <MinSlider
          label="Min confidence"
          min={0}
          max={100}
          value={filters.minConfidence}
          onChange={(v) => patch({ minConfidence: v })}
        />
        <div className={s.checks} style={{ marginTop: 14 }}>
          {QUALITY_CHECKS.map(([key, label]) => {
            const on = filters[key] as boolean;
            return (
              <button
                key={key}
                type="button"
                className={s.check}
                role="checkbox"
                aria-checked={on}
                onClick={() => patch({ [key]: !on } as Partial<Filters>)}
              >
                <span className={`${s.box} ${on ? s.boxOn : ''}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" className={s.clearBtn} onClick={clearAll}>
        Clear all filters
      </button>
    </div>
  );
}
