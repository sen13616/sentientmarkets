import { Composite } from './types';
import s from './stockpage.module.css';

/* 4-cell context strip. Every cell always renders (stable layout); values
   the upstream can't supply yet show an em-dash and light up automatically
   once available. */
export default function ContextStrip({ composite }: { composite: Composite }) {
  const ctx = composite.context;
  if (!ctx) return null;
  const { ticker, meta } = composite;

  return (
    <div className={s.contextStrip}>
      <div className={s.ctxCell}>
        <div className={s.ctxLabel}>
          Universe percentile <span className={s.newTag}>New</span>
        </div>
        <div className={`${s.ctxValue} ${s.mono}`}>
          {ctx.universe_percentile !== null ? `p${Math.round(ctx.universe_percentile)}` : '—'}
        </div>
        <div className={s.ctxSub}>of {ctx.universe_size} S&amp;P 500 names</div>
      </div>
      <div className={s.ctxCell}>
        <div className={s.ctxLabel}>Own-history percentile</div>
        <div className={`${s.ctxValue} ${s.mono}`}>
          {ctx.own_history_percentile !== null ? `p${Math.round(ctx.own_history_percentile)}` : '—'}
        </div>
        <div className={s.ctxSub}>vs {ticker}&apos;s trailing 90 days</div>
      </div>
      <div className={s.ctxCell}>
        <div className={s.ctxLabel}>Sector rank</div>
        <div className={`${s.ctxValue} ${s.mono}`}>
          {ctx.sector_rank !== null ? (
            <>#{ctx.sector_rank}<small>/ {ctx.sector_size}</small></>
          ) : (
            '—'
          )}
        </div>
        <div className={s.ctxSub}>{meta?.sector ?? 'Sector unavailable'}</div>
      </div>
      <div className={s.ctxCell}>
        <div className={s.ctxLabel}>Sector average</div>
        <div className={`${s.ctxValue} ${s.mono}`}>
          {ctx.sector_average !== null ? ctx.sector_average.toFixed(1) : '—'}
        </div>
        <div className={s.ctxSub}>
          {ctx.sector_delta !== null ? (
            <>
              {ticker} is{' '}
              <span className={s.mono} style={{ color: ctx.sector_delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {ctx.sector_delta >= 0 ? '+' : ''}{ctx.sector_delta.toFixed(1)}
              </span>{' '}
              {ctx.sector_delta >= 0 ? 'above' : 'below'}
            </>
          ) : (
            'sector data unavailable'
          )}
        </div>
      </div>
    </div>
  );
}
