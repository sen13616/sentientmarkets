import styles from '../page.module.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Terms of Use — SentientMarkets',
};

/* Standard sub-section shell so every block shares the About/FAQ rhythm. */
function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-10 border-b border-[#eef0f3]">
      <h2 className="text-lg font-semibold text-[#0a0b0d] mb-4">{title}</h2>
      <div className="text-[#5b616e] text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[840px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the About/FAQ pages */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              Terms of Use
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              The rules, <em className="not-italic text-[#0a0b0d]">in plain terms.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              By using SentientMarkets you agree to these terms. The short version: this is an
              informational tool, not investment advice. Last updated: July 2026.
            </p>
          </section>

          {/* TODO: legal entity details */}
          <Section title="Who provides this service">
            <p>
              SentientMarkets is operated by <strong className="text-[#0a0b0d]">[Company name]</strong>,
              <strong className="text-[#0a0b0d]"> [registered address]</strong>. When these terms say
              &ldquo;we&rdquo; or &ldquo;us&rdquo;, it means that operator.
            </p>
          </Section>

          <Section title="Informational use only">
            <p>
              SentientMarkets provides sentiment scores, market data, and related analytics for
              <strong className="text-[#0a0b0d]"> informational and educational purposes only</strong>.
              You may use the site for your own personal, non-commercial research. You may not scrape,
              resell, or redistribute the data or scores without our written permission.
            </p>
          </Section>

          {/* Prominent disclaimer — linked directly from the footer's "Legal Disclaimer". */}
          <section
            id="disclaimer"
            className="my-10 scroll-mt-24 border border-[rgba(207,32,47,0.25)] bg-[rgba(207,32,47,0.04)] rounded-xl p-6 md:p-8"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#cf202f] mb-3">
              Important disclaimer
            </div>
            <h2 className="text-xl font-semibold text-[#0a0b0d] mb-4">Not investment advice</h2>
            <div className="text-[#5b616e] text-sm leading-relaxed space-y-3">
              <p>
                Nothing on SentientMarkets constitutes investment advice, financial advice, trading
                advice, or a recommendation to buy, sell, or hold any security or other asset. Sentiment
                scores are automated statistical measurements of publicly available data — they are
                <strong className="text-[#0a0b0d]"> not predictions of future prices</strong> and not
                an endorsement of any investment.
              </p>
              <p>
                We are not a registered investment adviser, broker-dealer, or financial institution.
                Any investment decisions you make are yours alone, based on your own research and risk
                tolerance. Consider consulting a licensed financial adviser before making investment
                decisions. Trading and investing involve substantial risk, including the possible loss
                of the entire amount invested.
              </p>
            </div>
          </section>

          <Section title="Data provided as-is">
            <p>
              Market data, news, and other inputs shown on this site come from third-party sources.
              We do not control those sources and cannot guarantee that the data is accurate, complete,
              or timely. Quotes and scores may be delayed, cached, or occasionally wrong. Everything on
              this site is provided <strong className="text-[#0a0b0d]">&ldquo;as is&rdquo; and
              &ldquo;as available&rdquo;</strong>, without warranties of any kind.
            </p>
          </Section>

          <Section title="No warranty">
            <p>
              To the maximum extent permitted by law, we disclaim all warranties, express or implied,
              including warranties of merchantability, fitness for a particular purpose, accuracy, and
              non-infringement. We do not warrant that the site will be uninterrupted, error-free, or
              secure, or that defects will be corrected.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, we will not be liable for any indirect,
              incidental, special, consequential, or punitive damages — including lost profits, lost
              savings, or trading losses — arising out of or related to your use of (or inability to
              use) the site or its data, even if we have been advised of the possibility of such
              damages. Where liability cannot be excluded, it is limited to the amount you paid us to
              use the service (currently nothing).
            </p>
          </Section>

          <Section title="Changes to the service and these terms">
            <p>
              We may change, suspend, or discontinue any part of the site at any time without notice.
              We may also update these terms; continued use of the site after an update means you accept
              the revised terms. The &ldquo;last updated&rdquo; date above reflects the current version.
            </p>
          </Section>

          <section className="py-10">
            <h2 className="text-lg font-semibold text-[#0a0b0d] mb-4">Contact</h2>
            <p className="text-[#5b616e] text-sm leading-relaxed">
              Questions about these terms? Email{' '}
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
