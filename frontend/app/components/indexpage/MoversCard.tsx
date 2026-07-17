import { Mover } from './types';
import s from './indexpage.module.css';

function fmtDelta(v: number | null): string {
  if (v === null) return '—';
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
}

/* One movers table (gainers or decliners). The parent hides the card when
   the list is empty. */
export default function MoversCard({
  title,
  sub,
  movers,
}: {
  title: string;
  sub: string;
  movers: Mover[];
}) {
  if (movers.length === 0) return null;
  return (
    <div className={s.card}>
      <h3 className={s.cardTitle}>{title}</h3>
      <p className={s.cardSub}>{sub}</p>
      <div className={s.mvHead}>
        <span>Ticker</span><span>Name</span><span>Score</span><span>1d</span>
      </div>
      {movers.map((m) => (
        <div key={m.ticker} className={s.moverRow}>
          <span className={s.mvTicker}>{m.ticker}</span>
          <span className={s.mvName}>{m.name ?? '—'}</span>
          <span className={s.mvScore}>{m.score !== null ? m.score.toFixed(1) : '—'}</span>
          <span
            className={`${s.mvDelta} ${
              m.change_1d !== null ? (m.change_1d >= 0 ? s.pos : s.neg) : ''
            }`}
          >
            {fmtDelta(m.change_1d)}
          </span>
        </div>
      ))}
    </div>
  );
}
