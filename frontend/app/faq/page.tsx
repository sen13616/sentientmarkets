import Link from 'next/link';
import styles from './faq.module.css';
import FaqAccordion from './FaqAccordion'

export const metadata = {
  title: 'FAQ — TheMarketMood.ai',
};

export default function FaqPage() {
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
            <Link className={styles.navLink} href="/technology">Technology</Link>
            <Link className={`${styles.navLink} ${styles.active}`} href="/faq">FAQ</Link>
            <Link className={styles.navLink} href="/contact">Contact</Link>
          </div>
          <button className={styles.btnPro}>Get Pro</button>
        </div>
      </nav>

      <div className={styles.page}>

        {/* HERO */}
        <section className={styles.faqHero}>
          <div className={`${styles.eyebrow} ${styles.fade0}`}>
            <span className={styles.pip}></span>FAQ
          </div>
          <h1 className={styles.fade1}>
            Common <em>questions,</em><br />straight answers.
          </h1>
          <p className={`${styles.heroSub} ${styles.fade2}`}>
            Everything you need to know about how TheMarketMood.ai works, what the score means, and
            what you get with Pro.
          </p>
        </section>

        {/* FAQ BODY — client component handles accordion + nav */}
        <FaqAccordion />

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