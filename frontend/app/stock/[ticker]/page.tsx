import { getSentiment } from '@/lib/api';
import styles from './page.module.css';
import Link from 'next/link';
import NavSearch from './NavSearch';
import InsightTabs from './InsightTabs';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function fmtLargeNum(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtShares(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'var(--amber)';
  if (score >= 65) return 'var(--green)';
  if (score >= 50) return 'var(--amber)';
  return 'var(--red)';
}

function tagClass(signal: string | null | undefined): string {
  if (!signal) return styles.tNeu;
  const s = signal.toLowerCase();
  if (['bullish','rising','buy','strong','net buying','low','above','near highs','positive','calm','surging'].some(x => s.includes(x))) return styles.tBull;
  if (['bearish','falling','sell','net selling','high','below','near lows','negative','extreme fear','fear'].some(x => s.includes(x))) return styles.tBear;
  return styles.tNeu;
}

function calc52wPosition(price: any): string {
  try {
    const cur = price?.current_price;
    const lo  = price?.week_52_low;
    const hi  = price?.week_52_high;
    if (cur == null || lo == null || hi == null || hi === lo) return '—';
    return `${(((cur - lo) / (hi - lo)) * 100).toFixed(0)}%`;
  } catch { return '—'; }
}

function calc52wTag(price: any): string {
  try {
    const cur = price?.current_price;
    const lo  = price?.week_52_low;
    const hi  = price?.week_52_high;
    if (cur == null || lo == null || hi == null || hi === lo) return 'Mid range';
    const pos = ((cur - lo) / (hi - lo)) * 100;
    if (pos > 70) return 'Near highs';
    if (pos > 40) return 'Mid range';
    return 'Near lows';
  } catch { return 'Mid range'; }
}

function fmtQuarter(period: string | null | undefined): string {
  if (!period) return '—';
  try {
    const d = new Date(period);
    const month = d.getMonth(); // 0-indexed
    const year  = d.getFullYear() % 100;
    // Apple fiscal quarters: Q1=Oct-Dec, Q2=Jan-Mar, Q3=Apr-Jun, Q4=Jul-Sep
    let q: number;
    if (month <= 2)       q = 2;  // Jan-Mar → Q2
    else if (month <= 5)  q = 3;  // Apr-Jun → Q3
    else if (month <= 8)  q = 4;  // Jul-Sep → Q4
    else                  q = 1;  // Oct-Dec → Q1
    const fy = month <= 8 ? year : year + 1;
    return `Q${q} FY${fy < 10 ? '0' + fy : fy}`;
  } catch { return period; }
}

function calcUpside(target: number | null | undefined, current: number | null | undefined): string {
  if (target == null || current == null || current === 0) return '—';
  const pct = ((target - current) / current) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function calcUpsideClass(target: number | null | undefined, current: number | null | undefined): string {
  if (target == null || current == null || current === 0) return '';
  return target >= current ? styles.pos : styles.neg;
}

function truncateTag(label: string | null | undefined): string {
  if (!label) return 'N/A';
  const l = label.toLowerCase();
  if (l.includes('approaching') && l.includes('oversold'))   return 'Near Oversold';
  if (l.includes('approaching') && l.includes('overbought')) return 'Near Overbought';
  if (l.includes('somewhat') && l.includes('bull')) return 'Bullish';
  if (l.includes('somewhat') && l.includes('bear')) return 'Bearish';
  return label;
}

function formatSentimentLabel(label: string | null | undefined): string {
  if (!label) return 'Neutral';
  const l = label.toLowerCase();
  if (l.includes('somewhat-bull') || l.includes('somewhat bull')) return 'Bullish';
  if (l.includes('somewhat-bear') || l.includes('somewhat bear')) return 'Bearish';
  if (l.includes('bull')) return 'Bullish';
  if (l.includes('bear')) return 'Bearish';
  return 'Neutral';
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const data = await getSentiment(params.ticker);

  const ticker     = (params.ticker || '').toUpperCase();
  const price      = data.price_data       ?? {};
  const fund       = data.fundamentals     ?? {};
  const analyst    = data.analyst_data     ?? {};
  const tech       = data.technical_indicators ?? {};
  const inst       = data.institutional_data  ?? {};
  const fg         = data.fear_and_greed   ?? {};
  const aiIns      = data.ai_insights      ?? {};
  const news       = data.news_sentiment   ?? {};
  const social     = data.social_sentiment ?? {};
  const reddit     = social.reddit         ?? {};
  const insider    = social.insider_sentiment ?? {};

  const score      = data.market_mood_score ?? 50;
  const scoreCol   = scoreColor(score);
  const arcOffset  = 257 - (score / 100 * 257);

  // Thumb position along arc (baseline y=112 matches updated arc path)
  const angle = Math.PI - (score / 100) * Math.PI;
  const thumbCx = 100 + 82 * Math.cos(angle);
  const thumbCy = 112 - 82 * Math.sin(angle);

  const changePos  = (price.change ?? 0) >= 0;
  const changeSign = changePos ? '▲ +' : '▼ ';

  const articles = (news.articles ?? []).slice(0, 8);

  // Market momentum — show last word only to avoid overflow ("Extreme Fear" → "Fear")
  const momentumLabel = fg.sub_indicators?.market_momentum?.label as string | undefined;
  const momentumShort = momentumLabel?.split(' ').slice(-1)[0] ?? '—';

  return (
    <div className={styles.page}>

      {/* ── 1. NAV ─────────────────────────────────────────────── */}
      <nav className={styles.navOuter}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoWord}>TheMarketMood</span>
            <span className={styles.logoTld}>.ai</span>
          </Link>
          <NavSearch />
          <button className={styles.btnPro}>Get Pro</button>
        </div>
      </nav>

      {/* ── 2. HEADER ──────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.hdrLeft}>
          <div className={styles.ticker}>{ticker}</div>
          <div className={styles.company}>{data.company_name ?? ticker}</div>
          <div className={styles.exchange}>
            {fund.sector ? `${fund.sector} · ` : ''}{data.exchange ?? 'NASDAQ'} · USA
          </div>
        </div>
        <div className={styles.hdrRight}>
          <div className={styles.hdrPrice}>
            {price.current_price != null ? `$${price.current_price.toFixed(2)}` : '—'}
          </div>
          <div className={`${styles.hdrChange} ${changePos ? styles.pos : styles.neg}`}>
            {changeSign}${Math.abs(price.change ?? 0).toFixed(2)}&nbsp;&nbsp;
            {fmtPct(price.change_percent)} today
          </div>
          {price.post_market_price != null && (
            <div className={styles.hdrPrepost}>
              <div className={styles.hdrPrepostLabel}>After hours</div>
              <div className={styles.hdrPrepostVal}>
                ${price.post_market_price.toFixed(2)}&nbsp;&nbsp;
                {price.post_market_change_percent != null
                  ? fmtPct(price.post_market_change_percent)
                  : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. SCORE SECTION ───────────────────────────────────── */}
      <div className={styles.scoreSection}>

        {/* Arc gauge + spectrum */}
        <div className={styles.gaugeCol}>
          <div className={styles.gaugeSvgWrap}>
            <svg width="200" height="154" viewBox="0 0 200 154">
              <defs>
                <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#f06060" />
                  <stop offset="50%"  stopColor="#e0a030" />
                  <stop offset="100%" stopColor="#1dcc9a" />
                </linearGradient>
              </defs>
              {/* Track */}
              <path
                d="M 18 112 A 82 82 0 0 1 182 112"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Fill */}
              <path
                d="M 18 112 A 82 82 0 0 1 182 112"
                fill="none"
                stroke="url(#arcG)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="257"
                strokeDashoffset={arcOffset}
              />
              {/* Thumb outer ring */}
              <circle cx={thumbCx} cy={thumbCy} r="14" fill={scoreCol} opacity="0.12" />
              {/* Thumb inner */}
              <circle cx={thumbCx} cy={thumbCy} r="8"  fill={scoreCol} opacity="0.9" />
            </svg>
            <div className={styles.gaugeCenter}>
              <div className={styles.gaugeNum}>{score}</div>
              <div className={styles.gaugeWord} style={{ color: scoreCol }}>
                {data.market_mood_label ?? 'Neutral'}
              </div>
              <div className={styles.gaugeConf}>
                {data.market_mood_confidence ?? 'medium'} confidence
              </div>
            </div>
          </div>

          {/* Spectrum */}
          <div className={styles.spectrumWrap}>
            <div className={styles.spectrumTrack}>
              <div
                className={styles.spectrumThumb}
                style={{
                  left: `${score}%`,
                  boxShadow: `0 0 0 2px var(--bg), 0 0 0 3.5px ${scoreCol}`,
                }}
              />
            </div>
            <div className={styles.spectrumLabels}>
              <span>Bearish</span>
              <span>Neutral</span>
              <span>Bullish</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className={styles.scoreRight}>
          <div className={styles.insightsCard}>
            <div className={styles.insightsHeader}>
              <div className={styles.aiPip} />
              <span className={styles.insightsHeaderLabel}>AI Insights</span>
              <span className={styles.insightsPro}>Pro</span>
            </div>
            <InsightTabs
              summary={aiIns.summary ?? null}
              bullCase={aiIns.bull_case ?? null}
              bearCase={aiIns.bear_case ?? null}
              whatToWatch={aiIns.what_to_watch ?? null}
            />
          </div>
        </div>
      </div>

      {/* ── 4. SIGNAL GRID ─────────────────────────────────────── */}
      <div className={`${styles.section} ${styles.signalGridSection}`}>
        <div className={styles.secLabel}>Signal grid</div>
        <div className={styles.signalColsWrapper}>

          {/* Technical */}
          <div className={styles.signalCol}>
            <div className={styles.signalColTitle}>Technical</div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>RSI (14)</span>
              <span className={styles.rowVal}>{tech.rsi_14 != null ? tech.rsi_14.toFixed(1) : '—'}</span>
              <span className={`${styles.tag} ${tagClass(tech.rsi_signal)}`}>{truncateTag(tech.rsi_signal)}</span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>vs 50-day MA</span>
              <span className={`${styles.rowVal} ${(tech.price_vs_50d_ma_percent ?? 0) >= 0 ? styles.pos : styles.neg}`}>
                {fmtPct(tech.price_vs_50d_ma_percent)}
              </span>
              <span className={`${styles.tag} ${(tech.price_vs_50d_ma_percent ?? 0) >= 0 ? styles.tBull : styles.tBear}`}>
                {(tech.price_vs_50d_ma_percent ?? 0) >= 0 ? 'Above' : 'Below'}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>vs 200-day MA</span>
              <span className={`${styles.rowVal} ${(tech.price_vs_200d_ma_percent ?? 0) >= 0 ? styles.pos : styles.neg}`}>
                {fmtPct(tech.price_vs_200d_ma_percent)}
              </span>
              <span className={`${styles.tag} ${(tech.price_vs_200d_ma_percent ?? 0) >= 0 ? styles.tBull : styles.tBear}`}>
                {(tech.price_vs_200d_ma_percent ?? 0) >= 0 ? 'Above' : 'Below'}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>52W position</span>
              <span className={styles.rowVal}>{calc52wPosition(price)}</span>
              <span className={`${styles.tag} ${tagClass(calc52wTag(price))}`}>{calc52wTag(price)}</span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Volume vs avg</span>
              <span className={styles.rowVal}>
                {price.volume != null && price.average_volume != null
                  ? `${(price.volume / price.average_volume).toFixed(1)}×`
                  : '—'}
              </span>
              <span className={`${styles.tag} ${(price.volume ?? 0) / (price.average_volume ?? 1) > 1.5 ? styles.tNeu : styles.tBull}`}>
                {(price.volume ?? 0) / (price.average_volume ?? 1) > 1.5 ? 'Elevated' : 'Normal'}
              </span>
            </div>
          </div>

          {/* Sentiment */}
          <div className={styles.signalCol}>
            <div className={styles.signalColTitle}>Sentiment</div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Analyst consensus</span>
              <span className={styles.rowVal}>{analyst.consensus ?? '—'}</span>
              <span className={`${styles.tag} ${tagClass(analyst.consensus)}`}>{analyst.consensus ?? 'N/A'}</span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Price target upside</span>
              <span className={`${styles.rowVal} ${(analyst.upside_to_target_percent ?? 0) >= 0 ? styles.pos : styles.neg}`}>
                {fmtPct(analyst.upside_to_target_percent)}
              </span>
              <span className={`${styles.tag} ${
                (analyst.upside_to_target_percent ?? 0) > 10 ? styles.tBull
                : (analyst.upside_to_target_percent ?? 0) > 0 ? styles.tNeu
                : styles.tBear
              }`}>
                {(analyst.upside_to_target_percent ?? 0) > 10 ? 'Bullish'
                  : (analyst.upside_to_target_percent ?? 0) > 0 ? 'Neutral'
                  : 'Bearish'}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>News sentiment</span>
              <span className={`${styles.rowVal} ${(news.average_sentiment_score ?? 0) >= 0 ? styles.pos : styles.neg}`}>
                {news.average_sentiment_score != null
                  ? `${news.average_sentiment_score >= 0 ? '+' : ''}${news.average_sentiment_score.toFixed(2)}`
                  : '—'}
              </span>
              <span className={`${styles.tag} ${tagClass(news.average_sentiment_label)}`}>
                {truncateTag(news.average_sentiment_label)}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Social momentum</span>
              <span className={styles.rowVal}>{reddit.momentum_signal ?? '—'}</span>
              <span className={`${styles.tag} ${tagClass(reddit.momentum_signal)}`}>
                {reddit.rank_change != null
                  ? `${reddit.rank_change >= 0 ? '+' : ''}${reddit.rank_change} rnks`
                  : 'N/A'}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Insider MSPR</span>
              <span className={`${styles.rowVal} ${(insider.latest_mspr ?? 0) >= 0 ? styles.pos : styles.neg}`}>
                {insider.latest_mspr != null ? insider.latest_mspr.toFixed(1) : '—'}
              </span>
              <span className={`${styles.tag} ${tagClass(insider.signal)}`}>
                {insider.signal ?? 'N/A'}
              </span>
            </div>
          </div>

          {/* Market Context */}
          <div className={styles.signalCol}>
            <div className={styles.signalColTitle}>Market Context</div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Fear &amp; Greed</span>
              <span className={`${styles.rowVal} ${styles.neu}`}>
                {fg.score != null ? Math.round(fg.score) : '—'}
              </span>
              <span className={`${styles.tag} ${tagClass(fg.label)}`}>{fg.label ?? 'N/A'}</span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>F&amp;G trend</span>
              <span className={`${styles.rowVal} ${fg.trend === 'Rising' ? styles.pos : fg.trend === 'Falling' ? styles.neg : ''}`}>
                {fg.trend === 'Rising' ? '↑' : fg.trend === 'Falling' ? '↓' : '→'} {fg.trend ?? '—'}
              </span>
              <span className={`${styles.tag} ${tagClass(fg.trend)}`}>{fg.trend ?? 'N/A'}</span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Market momentum</span>
              <span className={`${styles.rowVal} ${tagClass(momentumLabel) === styles.tBull ? styles.pos : tagClass(momentumLabel) === styles.tBear ? styles.neg : ''}`}>
                {momentumShort}
              </span>
              <span className={`${styles.tag} ${tagClass(momentumLabel)}`}>
                {momentumLabel ?? 'N/A'}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>VIX</span>
              <span className={styles.rowVal}>
                {fg.sub_indicators?.market_volatility?.score != null
                  ? fg.sub_indicators.market_volatility.score.toFixed(1)
                  : '—'}
              </span>
              <span className={`${styles.tag} ${tagClass(fg.sub_indicators?.market_volatility?.label)}`}>
                {fg.sub_indicators?.market_volatility?.label ?? 'N/A'}
              </span>
            </div>
            <div className={`${styles.groupRow} ${styles.row3}`}>
              <span className={styles.rowName}>Short float</span>
              <span className={styles.rowVal}>
                {inst.short_percent_of_float != null
                  ? `${inst.short_percent_of_float.toFixed(2)}%`
                  : '—'}
              </span>
              <span className={`${styles.tag} ${
                (inst.short_percent_of_float ?? 0) < 5 ? styles.tBull
                : (inst.short_percent_of_float ?? 0) < 10 ? styles.tNeu
                : styles.tBear
              }`}>
                {(inst.short_percent_of_float ?? 0) < 5 ? 'Low'
                  : (inst.short_percent_of_float ?? 0) < 10 ? 'Elevated'
                  : 'High'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 5. NEWS ────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.secLabel}>Recent news</div>
        <div className={styles.newsList}>
          {articles.length > 0 ? articles.map((article: any, i: number) => (
            <a
              key={i}
              className={styles.newsRow}
              href={article.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className={styles.newsTitle}>{article.title}</div>
                <div className={styles.newsMeta}>
                  <span>{article.source}</span>
                  <span>{fmtTime(article.published_at)}</span>
                </div>
              </div>
              <span className={`${styles.tag} ${tagClass(article.sentiment_label)}`}>
                {formatSentimentLabel(article.sentiment_label)}
              </span>
            </a>
          )) : (
            <div className={styles.newsEmpty}>
              News data refreshes daily — check back during market hours.
            </div>
          )}
        </div>
      </div>

      {/* ── 6. FUNDAMENTALS ────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.secLabel}>Fundamentals</div>
        <div className={styles.fundGrid}>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Market cap</div>
            <div className={styles.fundVal}>{fmtLargeNum(fund.market_cap)}</div>
            <div className={styles.fundSub}>USD</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>P/E trailing</div>
            <div className={styles.fundVal}>{fund.pe_ratio_trailing != null ? `${fmt(fund.pe_ratio_trailing, 1)}×` : '—'}</div>
            <div className={styles.fundSub}>TTM</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>P/E forward</div>
            <div className={styles.fundVal}>{fund.pe_ratio_forward != null ? `${fmt(fund.pe_ratio_forward, 1)}×` : '—'}</div>
            <div className={styles.fundSub}>FY est.</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>EPS (TTM)</div>
            <div className={styles.fundVal}>{fund.eps_trailing != null ? `$${fmt(fund.eps_trailing, 2)}` : '—'}</div>
            <div className={styles.fundSub}>USD</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Revenue</div>
            <div className={styles.fundVal}>{fmtLargeNum(fund.revenue_ttm)}</div>
            <div className={styles.fundSub}>TTM</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Revenue growth</div>
            <div className={`${styles.fundVal} ${(fund.revenue_growth ?? 0) >= 0 ? styles.pos : styles.neg}`}>
              {fund.revenue_growth != null ? fmtPct(fund.revenue_growth * 100) : '—'}
            </div>
            <div className={styles.fundSub}>YoY</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Profit margin</div>
            <div className={styles.fundVal}>
              {fund.profit_margin != null ? `${fmt(fund.profit_margin * 100, 1)}%` : '—'}
            </div>
            <div className={styles.fundSub}>Net</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Free cash flow</div>
            <div className={styles.fundVal}>{fmtLargeNum(fund.free_cash_flow)}</div>
            <div className={styles.fundSub}>TTM</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>ROE</div>
            <div className={`${styles.fundVal} ${(fund.return_on_equity ?? 0) >= 0 ? styles.pos : styles.neg}`}>
              {fund.return_on_equity != null ? `${fmt(fund.return_on_equity * 100, 0)}%` : '—'}
            </div>
            <div className={styles.fundSub}>TTM</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Debt / equity</div>
            <div className={styles.fundVal}>
              {fund.debt_to_equity != null ? fmt(fund.debt_to_equity / 100, 2) : '—'}
            </div>
            <div className={styles.fundSub}>Ratio</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Beta</div>
            <div className={styles.fundVal}>{fmt(fund.beta, 2)}</div>
            <div className={styles.fundSub}>5Y monthly</div>
          </div>
          <div className={styles.fundCell}>
            <div className={styles.fundLabel}>Dividend yield</div>
            <div className={styles.fundVal}>
              {fund.dividend_yield != null ? `${fmt(fund.dividend_yield * 100, 2)}%` : '—'}
            </div>
            <div className={styles.fundSub}>Trailing</div>
          </div>
        </div>
      </div>

      {/* ── 7. ANALYST VIEW ────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.secLabel}>Analyst view</div>
        <div className={styles.analystGrid}>

          <div className={styles.analystConsensus}>
            <div className={styles.consensusLabel}>Consensus</div>
            <div className={styles.consensusWord}>{analyst.consensus ?? '—'}</div>
            <div className={styles.consensusScore}>
              Mean score {analyst.mean_score != null ? `${analyst.mean_score.toFixed(1)} / 5` : '—'}
            </div>
            <div className={styles.consensusCount}>
              {analyst.number_of_analysts != null ? `${analyst.number_of_analysts} analysts` : '—'}
            </div>
          </div>

          <div className={styles.analystRight}>
            <div className={styles.priceTargets}>
              <div className={styles.ptLabel}>
                Price targets{analyst.number_of_analysts != null ? ` (${analyst.number_of_analysts} analysts)` : ''}
              </div>
              <div className={styles.ptRow}>
                {[
                  { label: 'Mean',   val: analyst.price_target_mean },
                  { label: 'High',   val: analyst.price_target_high },
                  { label: 'Median', val: analyst.price_target_median },
                  { label: 'Low',    val: analyst.price_target_low },
                ].map(({ label, val }) => (
                  <div key={label} className={styles.ptItem}>
                    <div className={styles.ptItemLabel}>{label}</div>
                    <div className={styles.ptItemVal}>{val != null ? `$${Math.round(val)}` : '—'}</div>
                    <div className={`${styles.ptItemSub} ${calcUpsideClass(val, price.current_price)}`}>
                      {calcUpside(val, price.current_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(analyst.earnings_surprises ?? []).length > 0 && (
              <div className={styles.earningsTable}>
                <div className={styles.etHead}>
                  <span>Quarter</span>
                  <span>EPS est.</span>
                  <span>EPS actual</span>
                  <span>Surprise</span>
                </div>
                {(analyst.earnings_surprises ?? []).map((row: any, i: number) => (
                  <div key={i} className={styles.etRow}>
                    <span className={styles.etTx1}>{fmtQuarter(row.period)}</span>
                    <span>{row.estimate != null ? `$${row.estimate.toFixed(2)}` : '—'}</span>
                    <span className={styles.etTx1}>{row.actual != null ? `$${row.actual.toFixed(2)}` : '—'}</span>
                    <span className={(row.surprise_percent ?? 0) >= 0 ? styles.etPos : styles.etNeg}>
                      {row.surprise_percent != null
                        ? `${row.surprise_percent >= 0 ? '+' : ''}${row.surprise_percent.toFixed(1)}%`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 8. INSTITUTIONAL ───────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.secLabel}>Institutional &amp; insider activity</div>

        <div className={styles.instTop}>
          <div className={styles.instStat}>
            <div className={styles.instLabel}>Institutional ownership</div>
            <div className={styles.instVal}>
              {inst.percent_held_by_institutions != null
                ? `${inst.percent_held_by_institutions.toFixed(1)}%`
                : '—'}
            </div>
            <div className={styles.instSub}>of float</div>
          </div>
          <div className={styles.instStat}>
            <div className={styles.instLabel}>Insider ownership</div>
            <div className={styles.instVal}>
              {inst.percent_held_by_insiders != null
                ? `${inst.percent_held_by_insiders.toFixed(2)}%`
                : '—'}
            </div>
            <div className={styles.instSub}>of float</div>
          </div>
          <div className={styles.instStat}>
            <div className={styles.instLabel}>Short float</div>
            <div className={styles.instVal}>
              {inst.short_percent_of_float != null
                ? `${inst.short_percent_of_float.toFixed(1)}%`
                : '—'}
            </div>
            <div className={styles.instSub}>of float</div>
          </div>
          <div className={styles.instStat}>
            <div className={styles.instLabel}>Short ratio</div>
            <div className={styles.instVal}>
              {inst.short_ratio != null ? inst.short_ratio.toFixed(1) : '—'}
            </div>
            <div className={styles.instSub}>days to cover</div>
          </div>
        </div>

        {(inst.top_holders ?? []).length > 0 && (
          <div className={styles.holdersTable}>
            <div className={styles.htHead}>
              <span>Holder</span>
              <span>Shares</span>
              <span>% owned</span>
              <span>Change</span>
            </div>
            {(inst.top_holders ?? []).map((h: any, i: number) => (
              <div key={i} className={styles.htRow}>
                <span className={styles.htTx1}>{h.holder ?? '—'}</span>
                <span>{fmtShares(h.shares)}</span>
                <span>{h.percent_held != null ? `${h.percent_held.toFixed(2)}%` : '—'}</span>
                <span className={(h.change_percent ?? 0) > 0 ? styles.htPos : (h.change_percent ?? 0) < 0 ? styles.htNeg : ''}>
                  {h.change_percent != null
                    ? `${h.change_percent >= 0 ? '+' : ''}${h.change_percent.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 9. FOOTER ──────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span className={styles.footerLogoWord}>TheMarketMood</span>
          <span className={styles.footerLogoTld}>.ai</span>
        </div>
        <div className={styles.footerLinks}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
          <a href="#">API</a>
        </div>
        <div className={styles.footerCopy}>© 2026 · Data for informational purposes only. Not financial advice.</div>
      </footer>

    </div>
  );
}
