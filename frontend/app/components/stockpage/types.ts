export type SubIndices = {
  market: number | null;
  narrative: number | null;
  influencer: number | null;
  macro: number | null;
};

export type Driver = {
  signal: string;
  description: string;
  direction: string;
  magnitude: number;
  source_layer: string;
};

export type SentimentFull = {
  score: number | null;
  score_raw: number | null;
  score_change_1d: number | null;
  score_change_1d_pct: number | null;
  label: string | null;
  confidence: number | null;
  ema_obs_count: number | null;
  sub_indices: SubIndices;
  missing_layers: string[];
  divergence: string | null;
  top_drivers: Driver[];
  explanation: string | null;
  timestamp: string;
  cache_age_seconds: number | null;
  market_hours: { is_open: boolean } | null;
};

export type Composite = {
  ticker: string;
  in_universe: boolean;
  meta?: { name: string | null; sector: string | null; sector_etf: string | null };
  sentiment?: SentimentFull | null;
  context?: {
    universe_percentile: number | null;
    universe_size: number;
    own_history_percentile: number | null;
    sector_rank: number | null;
    sector_size: number | null;
    sector_average: number | null;
    sector_delta: number | null;
  };
  stability?: { sigma_7d: number | null; label: string | null };
  pressure?: { current_gap: number | null; mean_7d: number | null; reads_as: string | null };
};

export type HistoryPoint = {
  t: string;
  score: number | null;
  score_raw: number | null;
  confidence: number | null;
  sub: Partial<SubIndices>;
  missing_layers: string[];
};

/* One price observation for the history-chart overlay (t = epoch ms). */
export type PricePoint = {
  t: number;
  close: number;
};

export type HistoryPayload = {
  ticker: string;
  days: 7 | 30 | 90;
  interval: 'daily' | 'hourly';
  points: HistoryPoint[];
  segments: [number, number][];
  gaps: { from: string; to: string; hours: number }[];
};
