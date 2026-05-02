import { getSentiment } from '@/lib/api';
import { getConstituents, getIndexName } from '@/lib/data/index-constituents';
import IndexConstituentsList from '@/app/components/IndexConstituentsList';

interface IndexConstituentsProps {
  ticker: string;
}

export type ConstituentRow = {
  ticker: string;
  name: string;
  marketCap: number;
  sentiment: number;
  changePercent: number;
};

export default async function IndexConstituents({ ticker }: IndexConstituentsProps) {
  const constituents = getConstituents(ticker);
  if (!constituents || constituents.length === 0) return null;

  const results = await Promise.all(
    constituents.map(c => getSentiment(c.ticker).catch(() => null))
  );

  const rows: ConstituentRow[] = constituents
    .map((c, i) => {
      const data: any = results[i];
      if (!data) return null;
      const sentiment = typeof data.market_mood_score === 'number' ? data.market_mood_score : null;
      if (sentiment == null) return null;
      const changePercent = data.price_data?.change_percent ?? 0;
      return {
        ticker: c.ticker,
        name: c.name,
        marketCap: c.marketCap,
        sentiment,
        changePercent,
      };
    })
    .filter((r): r is ConstituentRow => r !== null);

  if (rows.length === 0) return null;

  const bullish = rows.filter(r => r.sentiment >= 65).length;
  const bearish = rows.filter(r => r.sentiment < 50).length;
  const neutral = rows.length - bullish - bearish;

  const indexLabel = getIndexName(ticker) ?? ticker.toUpperCase();

  return (
    <div
      className="bg-[#111112] border border-white/5 rounded-[2rem]"
      style={{ padding: '36px 36px 28px', marginTop: 24, fontFamily: 'var(--sans)' }}
    >
      {/* ── Card header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: 'var(--blue)',
              boxShadow: '0 0 6px var(--blue)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '1.6px',
              color: 'var(--tx2)',
            }}
          >
            Constituents
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--tx3)',
            letterSpacing: '0.8px',
          }}
        >
          {indexLabel} · {rows.length} companies
        </span>
      </div>

      {/* ── Subheader ── */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--tx1)',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          What&apos;s moving the index
        </h2>
        <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5, maxWidth: 560 }}>
          Mood scores for each {getIndexName(ticker) ?? 'index'} component. Sort by sentiment, market cap, or biggest movers
          to see what&apos;s driving today&apos;s price action.
        </p>
      </div>

      {/* ── Breadth summary ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          alignItems: 'center',
          padding: '24px 0',
          marginBottom: 28,
          border: '1px solid var(--line-soft)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <BreadthStat label="Bullish" count={bullish} color="var(--green)" />
        <span
          style={{
            width: 1,
            height: 44,
            background: 'var(--line-soft)',
            justifySelf: 'center',
          }}
        />
        <BreadthStat label="Neutral" count={neutral} color="var(--amber)" />
        <span
          style={{
            width: 1,
            height: 44,
            background: 'var(--line-soft)',
            justifySelf: 'center',
          }}
        />
        <BreadthStat label="Bearish" count={bearish} color="var(--red)" />
      </div>

      {/* ── Sortable / expandable list (client) ── */}
      <IndexConstituentsList rows={rows} />

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--line-soft)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--tx3)',
          letterSpacing: '0.8px',
          textAlign: 'center',
        }}
      >
        Updated just now · Mood scores recompute every 15 minutes
      </div>
    </div>
  );
}

function BreadthStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 56,
          fontWeight: 400,
          lineHeight: 1,
          color,
          letterSpacing: '-1px',
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '1.4px',
          color: 'var(--tx2)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function IndexConstituentsSkeleton() {
  return (
    <div
      className="bg-[#111112] border border-white/5 rounded-[2rem] animate-pulse"
      style={{ padding: 36, marginTop: 24 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="h-3 w-32 bg-white/5 rounded" />
        <div className="h-3 w-48 bg-white/5 rounded" />
      </div>
      <div className="h-8 w-72 bg-white/5 rounded mb-3" />
      <div className="h-4 w-96 bg-white/5 rounded mb-8" />
      <div className="grid grid-cols-3 gap-4 mb-8 p-6 border border-white/5 rounded-2xl">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-12 w-16 bg-white/5 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-28 bg-white/5 rounded" />
        <div className="h-8 w-72 bg-white/5 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
