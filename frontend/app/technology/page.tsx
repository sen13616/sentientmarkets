import Link from 'next/link';
import styles from './technology.module.css';

export const metadata = {
  title: 'Technology — TheMarketMood.ai',
};

export default function TechnologyPage() {
  return (
    <>
      <nav className={styles.navOuter}>
        <div className={styles.navInner}>
          <Link className={styles.logo} href="/">
            <span className={styles.logoWord}>TheMarketMood</span>
            <span className={styles.logoTld}>.ai</span>
          </Link>
          <div className={styles.navLinks}>
            <Link className={styles.navLink} href="/">Markets</Link>
            <Link className={styles.navLink} href="/about">About</Link>
            <Link className={`${styles.navLink} ${styles.active}`} href="/technology">Technology</Link>
            <Link className={styles.navLink} href="/faq">FAQ</Link>
            <Link className={styles.navLink} href="/contact">Contact</Link>
          </div>
          <button className={styles.btnPro}>Get Pro</button>
        </div>
      </nav>

      <div className={styles.page}>

        {/* HERO */}
        <section className={styles.techHero}>
          <div className={`${styles.eyebrow} ${styles.fade0}`}>
            <span className={styles.pip}></span>Technology
          </div>
          <h1 className={styles.fade1}>
            Built on <em>real signals,</em><br />not black boxes.
          </h1>
          <p className={`${styles.heroSub} ${styles.fade2}`}>
            Every number on TheMarketMood.ai comes from a documented source. Here&apos;s exactly how the
            score is calculated, where the data comes from, and how we serve it fast.
          </p>
        </section>

        {/* DATA SOURCES */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Data sources</div>
          <div className={styles.sourcesTable}>
            <div className={styles.sourcesHead}>
              <span>Source</span>
              <span>What we use it for</span>
              <span>Signals</span>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>yfinance</div>
              <div className={styles.srcDesc}>Price data, fundamentals, analyst ratings, moving averages, 52-week range, insider transactions</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>Price</span>
                <span className={styles.srcSignal}>MAs</span>
                <span className={styles.srcSignal}>Analysts</span>
              </div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>Alpha Vantage</div>
              <div className={styles.srcDesc}>RSI (14-day), technical indicators, and news sentiment scoring</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>RSI</span>
                <span className={styles.srcSignal}>News</span>
              </div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>CNN Fear &amp; Greed</div>
              <div className={styles.srcDesc}>Composite market fear index and 7 sub-indicators including momentum, safe haven demand, and put/call ratio</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>Macro</span>
                <span className={styles.srcSignal}>Fear</span>
              </div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>Finnhub</div>
              <div className={styles.srcDesc}>Insider sentiment via MSPR score, earnings surprise history</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>Insider</span>
                <span className={styles.srcSignal}>Earnings</span>
              </div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>ApeWisdom</div>
              <div className={styles.srcDesc}>Reddit mention counts, rank velocity, and trending ticker detection across finance subreddits</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>Reddit</span>
                <span className={styles.srcSignal}>Social</span>
              </div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>Google Trends</div>
              <div className={styles.srcDesc}>Search interest index for ticker symbols — proxy for retail attention and momentum</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>Search</span>
                <span className={styles.srcSignal}>Attention</span>
              </div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.srcName}>NewsAPI</div>
              <div className={styles.srcDesc}>Macro headline aggregation for homepage market context</div>
              <div className={styles.srcSignals}>
                <span className={styles.srcSignal}>Headlines</span>
              </div>
            </div>
          </div>
        </section>

        {/* SCORE CALCULATION */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Score calculation</div>
          <div className={styles.formulaWrap}>
            <div className={styles.formulaHead}>
              <div className={`${styles.aiPip} ${styles.aiPipAmber}`}></div>
              <div className={styles.formulaHeadLabel}>MarketMood Score — weighted composition</div>
            </div>
            <div className={styles.formulaBody}>
              <div className={styles.formulaRow}>
                <div className={`${styles.fPillar} ${styles.fPillarBlue}`}>Technical</div>
                <div className={styles.fBarWrap}>
                  <div className={`${styles.fBar} ${styles.fBarBlue}`} style={{ width: '35%' }}></div>
                </div>
                <div className={`${styles.fWeight} ${styles.fWeightBlue}`}>35%</div>
              </div>
              <div className={styles.formulaRow}>
                <div className={`${styles.fPillar} ${styles.fPillarAmber}`}>Fundamental</div>
                <div className={styles.fBarWrap}>
                  <div className={`${styles.fBar} ${styles.fBarAmber}`} style={{ width: '25%' }}></div>
                </div>
                <div className={`${styles.fWeight} ${styles.fWeightAmber}`}>25%</div>
              </div>
              <div className={styles.formulaRow}>
                <div className={`${styles.fPillar} ${styles.fPillarGreen}`}>Sentiment</div>
                <div className={styles.fBarWrap}>
                  <div className={`${styles.fBar} ${styles.fBarGreen}`} style={{ width: '40%' }}></div>
                </div>
                <div className={`${styles.fWeight} ${styles.fWeightGreen}`}>40%</div>
              </div>
              <div className={styles.formulaDivider}></div>
              <div className={styles.formulaNote}>
                Each pillar is scored 0–100 independently before weighting. The final MarketMood Score is a
                weighted average clamped to 0–100.{' '}
                <strong>Scores ≥65 = Bullish · 45–64 = Neutral · ≤44 = Bearish.</strong>{' '}
                Weights are calibrated to reflect the relative predictive value of each signal category —
                sentiment is weighted highest as it captures forward-looking crowd and institutional behaviour.
              </div>
            </div>
          </div>
        </section>

        {/* INFRASTRUCTURE */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Infrastructure</div>
          <div className={styles.stackGrid}>
            <div className={styles.stackCard}>
              <div className={styles.stackHead}>
                <div className={styles.stackHeadLeft}>
                  <div className={`${styles.stackPip} ${styles.blue}`}></div>
                  <div className={styles.stackName}>Frontend</div>
                </div>
                <div className={`${styles.stackTag} ${styles.blue}`}>Vercel</div>
              </div>
              <div className={styles.stackBody}>
                <p className={styles.stackDesc}>
                  Built on Next.js 14 App Router with CSS Modules for scoped, zero-runtime styling.
                  Chart.js powers all data visualisations. Deployed to Vercel&apos;s edge network for
                  global low-latency delivery.
                </p>
                <div className={styles.techPills}>
                  <span className={styles.techPill}>Next.js 14</span>
                  <span className={styles.techPill}>App Router</span>
                  <span className={styles.techPill}>CSS Modules</span>
                  <span className={styles.techPill}>Chart.js</span>
                  <span className={styles.techPill}>TypeScript</span>
                </div>
              </div>
            </div>
            <div className={styles.stackCard}>
              <div className={styles.stackHead}>
                <div className={styles.stackHeadLeft}>
                  <div className={`${styles.stackPip} ${styles.green}`}></div>
                  <div className={styles.stackName}>Backend</div>
                </div>
                <div className={`${styles.stackTag} ${styles.green}`}>Railway</div>
              </div>
              <div className={styles.stackBody}>
                <p className={styles.stackDesc}>
                  Python FastAPI handles all data aggregation, score computation, and API routing. Redis
                  caches computed scores to keep response times fast even under concurrent load.
                </p>
                <div className={styles.techPills}>
                  <span className={styles.techPill}>Python</span>
                  <span className={styles.techPill}>FastAPI</span>
                  <span className={styles.techPill}>Redis</span>
                  <span className={styles.techPill}>yfinance</span>
                  <span className={styles.techPill}>pytrends</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PERFORMANCE */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Performance</div>
          <div className={styles.cacheGrid}>
            <div className={styles.cacheCard}>
              <div className={styles.cacheLabel}>Cache TTL</div>
              <div className={`${styles.cacheVal} ${styles.cacheValGreen}`}>15m</div>
              <div className={styles.cacheDesc}>
                Score data is cached in Redis for 15 minutes. Subsequent requests for the same ticker
                are served instantly without hitting upstream APIs.
              </div>
            </div>
            <div className={styles.cacheCard}>
              <div className={styles.cacheLabel}>Cached tickers</div>
              <div className={`${styles.cacheVal} ${styles.cacheValBlue}`}>Top 20</div>
              <div className={styles.cacheDesc}>
                The 20 most-searched tickers are pre-warmed on startup so the first visitor never waits
                on a cold cache for high-traffic stocks.
              </div>
            </div>
            <div className={styles.cacheCard}>
              <div className={styles.cacheLabel}>Data sources</div>
              <div className={`${styles.cacheVal} ${styles.cacheValAmber}`}>7</div>
              <div className={styles.cacheDesc}>
                All 7 sources are fetched in parallel and aggregated server-side. A single API call from
                the frontend returns the full scored dataset.
              </div>
            </div>
          </div>
        </section>

        {/* AI NARRATIVE LAYER */}
        <section className={styles.section}>
          <div className={styles.secLabel}>AI narrative layer</div>
          <div className={styles.aiCard}>
            <div className={styles.aiHead}>
              <div className={styles.aiHeadLeft}>
                <div className={styles.aiPip}></div>
                <div className={styles.aiHeadLabel}>GPT-4o-mini · Pro feature</div>
              </div>
              <div className={styles.aiProTag}>Pro</div>
            </div>
            <div className={styles.aiBody}>
              <div className={styles.aiLeft}>
                <div className={styles.aiTitle}>From numbers to narrative</div>
                <p className={styles.aiDesc}>
                  Pro subscribers get an AI-generated analysis built on top of the scored data — not
                  generic commentary, but a structured read of the specific signals driving the current
                  score.
                </p>
                <p className={styles.aiDesc}>
                  The model receives the full scored dataset as context and produces four structured
                  outputs, each grounded in the underlying data.
                </p>
                <div className={styles.aiTabs}>
                  <div className={styles.aiTab}>Summary</div>
                  <div className={styles.aiTab}>Bull case</div>
                  <div className={styles.aiTab}>Bear case</div>
                  <div className={styles.aiTab}>What to watch</div>
                </div>
              </div>
              <div className={styles.aiRight}>
                <div className={styles.aiRightHead}>
                  <div className={styles.aiRightLabel}>Example output — Bear case</div>
                </div>
                <div className={styles.aiRightBody}>
                  <p className={styles.aiText}>
                    RSI at <strong>71.4</strong> suggests the stock is technically overbought — historically
                    a precursor to mean reversion when momentum stalls. The <strong>put/call ratio</strong> has
                    quietly risen over the past week, indicating options traders are hedging against downside.
                    Meanwhile, insider MSPR at <strong>0.18</strong> reflects net selling pressure from people
                    with the most information. None of these signals are individually decisive, but their
                    convergence warrants caution at current levels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoWord}>TheMarketMood</span>
            <span className={styles.footerLogoTld}>.ai</span>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className={styles.footerCopy}>© 2026 · Not financial advice.</div>
        </footer>

      </div>
    </>
  );
}