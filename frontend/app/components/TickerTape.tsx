'use client';

export type TapeItem = {
  ticker: string;
  change: string;
  positive: boolean | null; // null = neutral / no direction (e.g. VIX raw value)
};

const DEFAULT_TICKERS: TapeItem[] = [
  { ticker: 'SPY',   change: '+1.24%', positive: true  },
  { ticker: 'AAPL',  change: '+0.82%', positive: true  },
  { ticker: 'TSLA',  change: '-3.14%', positive: false },
  { ticker: 'NVDA',  change: '+4.60%', positive: true  },
  { ticker: 'MSFT',  change: '+0.55%', positive: true  },
  { ticker: 'AMZN',  change: '+1.18%', positive: true  },
  { ticker: 'META',  change: '+0.38%', positive: true  },
  { ticker: 'GOOGL', change: '-0.21%', positive: false },
  { ticker: 'GME',   change: '+44.2%', positive: true  },
  { ticker: 'RKLB',  change: '+9.1%',  positive: true  },
  { ticker: 'VIX',   change: '18.87',  positive: null  },
  { ticker: 'ASTS',  change: '-5.3%',  positive: false },
];

export default function TickerTape({ tickers = DEFAULT_TICKERS }: { tickers?: TapeItem[] }) {
  // Duplicate for seamless infinite loop: CSS shifts -50% = back to visual start
  const doubled = [...tickers, ...tickers];

  return (
    <div className="overflow-hidden whitespace-nowrap border-t border-white/[0.07] border-b bg-[#111112] py-3.5 select-none">
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .tape-track { animation: ticker-scroll 28s linear infinite; }
        .tape-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="tape-track inline-flex items-center gap-0">
        {doubled.map(({ ticker, change, positive }, i) => (
          <span key={`${ticker}-${i}`} className="inline-flex items-center">
            <span className="text-[0.72rem] font-medium tracking-wide">
              <span className="text-[#A1A1AA]">{ticker}</span>
              <span
                className={`ml-1.5 ${
                  positive === null
                    ? 'text-[#71717A]'
                    : positive
                    ? 'text-[#4afa8a]'
                    : 'text-[#ff5c5c]'
                }`}
              >
                {change}
              </span>
            </span>
            <span className="mx-10 text-white/10 text-xs">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
