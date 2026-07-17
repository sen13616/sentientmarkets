export type IndexLevel = {
  value: number;
  change: number | null;
  change_pct: number | null;
};

export type Mover = {
  ticker: string;
  name: string | null;
  score: number | null;
  change_1d: number | null;
};

export type Constituent = {
  ticker: string;
  name: string | null;
  sector: string | null;
  score: number | null;
  rank: number | null;
  sector_size: number | null;
};

export type HistogramBucket = { from: number; to: number; count: number };

export type SectorRow = {
  sector: string | null;
  average_score: number | null;
  size: number | null;
};

export type Sp500Payload = {
  timestamp: string | null;
  universe_scored: number | null;
  level: IndexLevel | null;
  breadth: {
    above_50_pct: number | null;
    above_50_count: number | null;
    improving_pct: number | null;
  };
  stats: {
    mean: number | null;
    median: number | null;
    stdev: number | null;
    min: number | null;
    max: number | null;
    bullish_count: number | null;
    bullish_pct: number | null;
    bearish_count: number | null;
    bearish_pct: number | null;
  };
  histogram: HistogramBucket[];
  sectors: SectorRow[];
  widest_sector_gap: {
    value: number | null;
    top_sector: string | null;
    bottom_sector: string | null;
  };
  movers: { top: Mover[]; bottom: Mover[] };
  constituents: Constituent[];
  freshness: {
    cache_age_seconds: number | null;
    market_hours: { is_open: boolean } | null;
  };
};
