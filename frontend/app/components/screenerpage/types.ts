export type Channel = 'market' | 'narrative' | 'influencer' | 'macro';

export const CHANNELS: Channel[] = ['market', 'narrative', 'influencer', 'macro'];

/* This page's channel palette (mockup tokens — macro deliberately differs
   from the stock page's #d9dee8 for legibility at 3.2px dot size). */
export const CHANNEL_COLORS: Record<Channel, string> = {
  market: '#0052ff',
  narrative: '#5e8bff',
  influencer: '#a8c0ff',
  macro: '#94a3b8',
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  market: 'Market',
  narrative: 'Narrative',
  influencer: 'Influencer',
  macro: 'Macro',
};

export type SpreadClass = 'tight' | 'moderate' | 'wide';

export type ScreenerRow = {
  ticker: string;
  name: string | null;
  sector: string | null;
  score: number;
  change_1d: number | null;
  percentile: number | null;
  confidence: number | null;
  sub: Record<Channel, number | null>;
  spread: number | null;
  spread_class: SpreadClass | null;
  rank: number | null;
  sector_size: number | null;
  missing_layers: string[];
  cold_start: boolean;
  stale: boolean;
};

export type ScreenerPayload = {
  generated_at: string;
  tick_timestamp: string | null;
  universe_scored: number;
  rows: ScreenerRow[];
};

export type Range = [number, number];

export type Filters = {
  composite: Range;          // 0..100
  change1d: Range;           // -20..+20
  percentile: Range;         // 0..100
  channels: Record<Channel, Range>; // each 0..100
  spread: 'any' | SpreadClass;
  sectorRank: 'any' | 'top3' | 'top10' | 'bottom10';
  sectors: string[];         // selected sector names (all = no filter)
  minConfidence: number;     // 0..100
  excludeMissing: boolean;
  excludeCold: boolean;
  excludeStale: boolean;
  crossingNeutral: boolean;  // preset-only derived filter
};

export const ALL_SECTORS = [
  'Communication Services',
  'Consumer Discretionary',
  'Consumer Staples',
  'Energy',
  'Financials',
  'Health Care',
  'Industrials',
  'Information Technology',
  'Materials',
  'Real Estate',
  'Utilities',
];

export const DEFAULT_FILTERS: Filters = {
  composite: [0, 100],
  change1d: [-20, 20],
  percentile: [0, 100],
  channels: {
    market: [0, 100],
    narrative: [0, 100],
    influencer: [0, 100],
    macro: [0, 100],
  },
  spread: 'any',
  sectorRank: 'any',
  sectors: [...ALL_SECTORS],
  minConfidence: 0,
  excludeMissing: false,
  excludeCold: false,
  excludeStale: false,
  crossingNeutral: false,
};

export type PresetKey =
  | 'all'
  | 'storyAhead'
  | 'priceAhead'
  | 'breakout'
  | 'sectorLeaders'
  | 'aligned'
  | 'crossing';

/* Preset = named filter state (applied over defaults). */
export const PRESETS: { key: PresetKey; label: string; apply: Partial<Filters> }[] = [
  { key: 'all', label: 'All names', apply: {} },
  {
    key: 'storyAhead',
    label: 'Story ahead of price',
    apply: { channels: { ...DEFAULT_FILTERS.channels, narrative: [60, 100], market: [0, 45] } },
  },
  {
    key: 'priceAhead',
    label: 'Price ahead of story',
    apply: { channels: { ...DEFAULT_FILTERS.channels, market: [60, 100], narrative: [0, 45] } },
  },
  { key: 'breakout', label: 'Sentiment breakout', apply: { change1d: [5, 20] } },
  { key: 'sectorLeaders', label: 'Sector leaders', apply: { sectorRank: 'top3' } },
  { key: 'aligned', label: 'Channels aligned', apply: { spread: 'tight' } },
  { key: 'crossing', label: 'Crossing neutral', apply: { crossingNeutral: true } },
];
