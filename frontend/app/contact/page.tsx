import Link from 'next/link';
import styles from './contact.module.css';

export const metadata = {
  title: 'Contact — TheMarketMood.ai',
};

export default function ContactPage() {
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
            <Link className={styles.navLink} href="/faq">FAQ</Link>
            <Link className={`${styles.navLink} ${styles.active}`} href="/contact">Contact</Link>
          </div>
          <button className={styles.btnPro}>Get Pro</button>
        </div>
      </nav>

      <div className={styles.page}>

        {/* HERO */}
        <section className={styles.contactHero}>
          <div className={`${styles.eyebrow} ${styles.fade0}`}>
            <span className={styles.pip}></span>Contact
          </div>
          <h1 className={styles.fade1}>
            We&apos;re easy<br />to <em>reach.</em>
          </h1>
          <p className={`${styles.heroSub} ${styles.fade2}`}>
            Questions, feedback, or just want to say something — we read everything and respond promptly.
          </p>
        </section>

        {/* GET IN TOUCH */}
        <section className={styles.section}>
          <div className={styles.secLabel}>Get in touch</div>

          <div className={styles.contactGrid}>
            <div className={`${styles.contactCard} ${styles.primary}`}>
              <div className={styles.ccLabel}>General enquiries</div>
              <div className={styles.ccTitle}>Send us an email</div>
              <div className={styles.ccDesc}>
                For questions about the platform, your account, data, or anything else — email is the
                fastest way to reach us.
              </div>
              <a href="mailto:hello@themarketmood.ai" className={styles.ccAction}>
                hello@themarketmood.ai →
              </a>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.ccLabel}>Have a question first?</div>
              <div className={styles.ccTitle}>Check the FAQ</div>
              <div className={styles.ccDesc}>
                Most common questions about the score, data sources, and Pro are already answered in
                our FAQ — worth a quick look before reaching out.
              </div>
              <Link href="/faq" className={styles.ccAction}>Browse FAQ →</Link>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.ccLabel}>Found a bug?</div>
              <div className={styles.ccTitle}>Report an issue</div>
              <div className={styles.ccDesc}>
                If something looks wrong — a bad score, a broken chart, a ticker that isn&apos;t
                loading — let us know and we&apos;ll look into it straight away.
              </div>
              <a href="mailto:hello@themarketmood.ai?subject=Bug report" className={styles.ccAction}>
                Report a bug →
              </a>
            </div>
          </div>

          <div className={styles.responseRow}>
            <div className={styles.responsePip}></div>
            <div className={styles.responseText}>
              We typically respond within <strong>24 hours</strong> on business days.
            </div>
          </div>
        </section>

        {/* FAQ NUDGE */}
        <section className={`${styles.section} ${styles.sectionNoBorder}`}>
          <div className={styles.faqNudge}>
            <div>
              <div className={styles.nudgeTitle}>Looking for something specific?</div>
              <div className={styles.nudgeDesc}>Our FAQ covers the score, data sources, Pro features, and more.</div>
            </div>
            <Link href="/faq" className={styles.nudgeBtn}>Go to FAQ →</Link>
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