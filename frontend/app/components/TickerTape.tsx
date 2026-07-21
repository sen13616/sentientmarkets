'use client';

export type TapeItem = {
  ticker: string;
  change: string;
  positive: boolean | null; // null = neutral / no direction (e.g. VIX raw value)
};

export default function TickerTape({ tickers }: { tickers: TapeItem[] }) {
  // Real data only — while the feed loads, hold the band's height with an
  // empty shell so the hero doesn't jump when items arrive.
  if (tickers.length === 0) {
    return (
      <div className="overflow-hidden whitespace-nowrap border-t border-b border-[#dee1e6] bg-[#f7f7f7] py-3 select-none">
        <span className="text-[0.75rem] opacity-0">·</span>
      </div>
    );
  }

  // Duplicate for seamless infinite loop: CSS shifts -50% = back to visual start
  const doubled = [...tickers, ...tickers];

  return (
    <div className="overflow-hidden whitespace-nowrap border-t border-b border-[#dee1e6] bg-[#f7f7f7] py-3 select-none">
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
            <span className="text-[0.75rem] tracking-wide">
              <span className="font-semibold text-[#0a0b0d]">{ticker}</span>
              <span
                className={`ml-1.5 font-mono ${
                  positive === null
                    ? 'text-[#7c828a]'
                    : positive
                    ? 'text-[#05b169]'
                    : 'text-[#cf202f]'
                }`}
              >
                {change}
              </span>
            </span>
            <span className="mx-10 text-[#dee1e6] text-xs">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
