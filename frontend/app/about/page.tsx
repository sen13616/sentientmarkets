import Link from 'next/link';
import styles from './about.module.css';

export const metadata = {
  title: 'About — TheMarketMood.ai',
};

export default function AboutPage() {
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
            <Link className={`${styles.navLink} ${styles.active}`} href="/about">About</Link>
            <Link className={styles.navLink} href="/technology">Technology</Link>
            <Link className={styles.navLink} href="/faq">FAQ</Link>
            <Link className={styles.navLink} href="/contact">Contact</Link>
          </div>
          <button className={styles.btnPro}>Get Pro</button>
        </div>
      </nav>

      <div className={styles.page}>

        {/* HERO */}
        <section className={styles.aboutHero}>
          <div className={`${styles.eyebrow} ${styles.fade0}`}>
            <span className={styles.pip}></span>About
          </div>
          <h1 className={styles.fade1}>
            Built for traders who<br />deserve <em>better data.</em>
          </h1>
          <p className={`${styles.heroSub} ${styles.fade2}`}>
            Hedge funds have always had access to aggregated sentiment signals. TheMarketMood.ai closes
            that gap — giving every retail trader institutional-grade intelligence at a fraction of the cost.
          </p>
        </section>

        {/* MISSION */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Our mission</div>
          <div className={styles.missionGrid}>
            <div className={styles.missionLeft}>
              <div className={styles.missionQuote}>
                The <em>information gap</em> between retail and institutional traders is the problem we&apos;re solving.
              </div>
            </div>
            <div className={styles.missionRight}>
              <div className={styles.missionBody}>
                <p>Professional trading desks spend thousands per month on sentiment terminals, options flow data, and social intelligence platforms. That information advantage compounds over time — and retail traders are left making decisions with incomplete signals.</p>
                <p>TheMarketMood.ai aggregates technical indicators, crowd sentiment, news flow, insider activity, and macro context into a single MarketMood Score. One number. Full picture.</p>
                <p>We built this because we believe access to quality data shouldn&apos;t be a function of your net worth.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className={styles.section}>
          <div className={styles.secLabel}>By the numbers</div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Data sources</div>
              <div className={`${styles.statVal} ${styles.statValGreen}`}>7</div>
              <div className={styles.statDesc}>Aggregated into every score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Score range</div>
              <div className={`${styles.statVal} ${styles.statValTx1}`}>0–100</div>
              <div className={styles.statDesc}>Bearish to Bullish, calibrated</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Update frequency</div>
              <div className={`${styles.statVal} ${styles.statValBlue}`}>Live</div>
              <div className={styles.statDesc}>Redis-cached, sub-second serve</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pro price</div>
              <div className={`${styles.statVal} ${styles.statValAmber}`}>$12</div>
              <div className={styles.statDesc}>Per month — cancel anytime</div>
            </div>
          </div>
        </section>

        {/* SCORE EXPLAINER */}
        <section className={styles.section}>
          <div className={styles.secLabel}>How the score works</div>
          <div className={styles.scoreExplainer}>
            <div className={styles.scoreBig}>72</div>
            <div className={styles.scoreRight}>
              <div className={styles.scoreRightLabel}>MarketMood Score — example</div>
              <div className={styles.scoreRightTitle}>One score, three sentiment pillars</div>
              <div className={styles.scoreTrack}>
                <div className={styles.scoreThumb}></div>
              </div>
              <div className={styles.scoreTrackLabels}>
                <span>Bearish</span>
                <span>Neutral</span>
                <span>Bullish</span>
              </div>
              <div className={styles.scoreZones}>
                <div className={`${styles.zone} ${styles.bear}`}>
                  <div className={styles.zoneRange}>0 – 44</div>
                  <div className={styles.zoneLabel}>Bearish</div>
                </div>
                <div className={`${styles.zone} ${styles.neu}`}>
                  <div className={styles.zoneRange}>45 – 64</div>
                  <div className={styles.zoneLabel}>Neutral</div>
                </div>
                <div className={`${styles.zone} ${styles.bull}`}>
                  <div className={styles.zoneRange}>65 – 100</div>
                  <div className={styles.zoneLabel}>Bullish</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIGNAL PILLARS */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Signal pillars</div>
          <div className={styles.pillarsRow}>

            {/* Technical */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarHead}>
                <div className={`${styles.pillarPip} ${styles.blue}`}></div>
                <div className={styles.pillarName}>Technical</div>
              </div>
              <div className={styles.pillarBodyInner}>
                <p className={styles.pillarDesc}>
                  Price action, momentum, and moving average signals derived from market data. Cuts through noise to show where a stock actually sits in its trend.
                </p>
                <div className={styles.pillarSources}>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>RSI (14-day)</span><span className={styles.sourceTag}>yfinance</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Moving averages</span><span className={styles.sourceTag}>yfinance</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>52-week range</span><span className={styles.sourceTag}>yfinance</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Volume analysis</span><span className={styles.sourceTag}>Alpha Vantage</span></div>
                </div>
              </div>
            </div>

            {/* Fundamental */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarHead}>
                <div className={`${styles.pillarPip} ${styles.amber}`}></div>
                <div className={styles.pillarName}>Fundamental</div>
              </div>
              <div className={styles.pillarBodyInner}>
                <p className={styles.pillarDesc}>
                  Analyst consensus, price targets, and earnings data. Reflects what the professional research community thinks — and how reality compares to their expectations.
                </p>
                <div className={styles.pillarSources}>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Analyst ratings</span><span className={styles.sourceTag}>yfinance</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Price targets</span><span className={styles.sourceTag}>yfinance</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Earnings surprises</span><span className={styles.sourceTag}>Finnhub</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Key metrics</span><span className={styles.sourceTag}>yfinance</span></div>
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarHead}>
                <div className={`${styles.pillarPip} ${styles.green}`}></div>
                <div className={styles.pillarName}>Sentiment</div>
              </div>
              <div className={styles.pillarBodyInner}>
                <p className={styles.pillarDesc}>
                  The signal hedge funds pay most for — crowd psychology, social buzz, insider behaviour, and macro fear. Aggregated from sources retail tools typically ignore.
                </p>
                <div className={styles.pillarSources}>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>News sentiment</span><span className={styles.sourceTag}>Alpha Vantage</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Reddit mentions</span><span className={styles.sourceTag}>ApeWisdom</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Insider activity</span><span className={styles.sourceTag}>Finnhub</span></div>
                  <div className={styles.sourceRow}><span className={styles.sourceName}>Fear &amp; Greed</span><span className={styles.sourceTag}>CNN</span></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Who it&apos;s for</div>
          <div className={styles.whoGrid}>
            <div className={styles.whoCard}>
              <div className={`${styles.whoIcon} ${styles.green}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6L8 2Z" stroke="var(--green)" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={styles.whoTitle}>Active retail traders</div>
              <div className={styles.whoDesc}>
                You&apos;re making your own calls but want more signal. TheMarketMood.ai gives you the same multi-source sentiment picture that professional desks have — without the $500/month data terminal.
              </div>
            </div>
            <div className={styles.whoCard}>
              <div className={`${styles.whoIcon} ${styles.blue}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1" stroke="var(--blue)" strokeWidth="1.3" />
                  <rect x="9" y="2" width="5" height="5" rx="1" stroke="var(--blue)" strokeWidth="1.3" />
                  <rect x="2" y="9" width="5" height="5" rx="1" stroke="var(--blue)" strokeWidth="1.3" />
                  <rect x="9" y="9" width="5" height="5" rx="1" stroke="var(--blue)" strokeWidth="1.3" />
                </svg>
              </div>
              <div className={styles.whoTitle}>Long-term investors</div>
              <div className={styles.whoDesc}>
                You&apos;re not day trading, but you want to know whether sentiment is with or against your positions. Our scores give you a fast sanity check before you size up or trim.
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaEyebrow}>Get started</div>
          <div className={styles.ctaTitle}>
            Read the market&apos;s <em>mood</em><br />in seconds.
          </div>
          <p className={styles.ctaSub}>Search any US-listed ticker. Free to try — no account required.</p>
          <Link href="/" className={styles.ctaBtn}>Analyse a stock →</Link>
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