import styles from '../page.module.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Privacy Policy — SentientMarkets',
};

/* Standard sub-section shell so every block shares the About/FAQ rhythm. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-10 border-b border-[#eef0f3]">
      <h2 className="text-lg font-semibold text-[#0a0b0d] mb-4">{title}</h2>
      <div className="text-[#5b616e] text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[840px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the About/FAQ pages */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              Privacy Policy
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              Your data, <em className="not-italic text-[#0a0b0d]">plainly.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              SentientMarkets is a market-sentiment analytics site. We collect very little,
              and this page explains exactly what. Last updated: July 2026.
            </p>
          </section>

          {/* TODO: legal entity details */}
          <Section title="Who we are">
            <p>
              SentientMarkets is operated by <strong className="text-[#0a0b0d]">[Company name]</strong>,
              <strong className="text-[#0a0b0d]"> [registered address]</strong>. When this policy says
              &ldquo;we&rdquo; or &ldquo;us&rdquo;, it means that operator.
            </p>
          </Section>

          <Section title="What we collect">
            <p>
              SentientMarkets currently has <strong className="text-[#0a0b0d]">no user accounts</strong> —
              you don&apos;t register, log in, or give us your name or email to use the site.
            </p>
            <p>We collect only:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#0a0b0d]">Basic analytics</strong> — aggregate, non-identifying
                usage data such as pages visited, approximate region, browser type, and referring site,
                used to understand how the product is used and to improve it.
              </li>
              <li>
                <strong className="text-[#0a0b0d]">Server logs</strong> — standard request logs
                (IP address, timestamp, requested URL) kept for a limited period for security and
                debugging.
              </li>
              <li>
                <strong className="text-[#0a0b0d]">Anything you send us</strong> — if you email us
                (feedback, bug reports), we keep that correspondence to respond to it.
              </li>
            </ul>
            <p>We do not sell personal data, and we do not run third-party advertising.</p>
          </Section>

          <Section title="Cookies">
            <p>
              We use only the minimal cookies (or similar local-storage entries) needed for the site to
              function and for basic analytics. We do not use advertising or cross-site tracking cookies.
              You can clear or block cookies in your browser settings; the site will keep working.
            </p>
          </Section>

          <Section title="Third-party data sources">
            <p>
              The market data and sentiment inputs shown on this site come from third-party providers —
              including price and volume feeds, financial news APIs, regulatory filings, and macroeconomic
              data series. That data flows <em className="not-italic">into</em> the site; it is about
              markets, not about you. We do not share your personal data with these providers.
            </p>
            <p>
              Some infrastructure providers (hosting, analytics) process technical data such as IP
              addresses on our behalf, as is standard for any website.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              Server logs and analytics data are retained only as long as needed for the purposes above
              and are then deleted or aggregated. Email correspondence is kept for as long as needed to
              handle your request.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              Depending on where you live, you may have rights to access, correct, or delete personal
              data we hold about you. Since we hold almost none, the practical answer is usually quick —
              contact us and we&apos;ll sort it out.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If our data practices change — for example, if we introduce user accounts — we will update
              this page and revise the &ldquo;last updated&rdquo; date above.
            </p>
          </Section>

          <section className="py-10">
            <h2 className="text-lg font-semibold text-[#0a0b0d] mb-4">Contact</h2>
            <p className="text-[#5b616e] text-sm leading-relaxed">
              Questions about this policy? Email{' '}
              <a href="mailto:aayudh.sen@gmail.com" className="text-[#0052ff] hover:underline">
                aayudh.sen@gmail.com
              </a>.
            </p>
          </section>

        </div>
      </div>

      <Footer variant="light" />
    </div>
  );
}
