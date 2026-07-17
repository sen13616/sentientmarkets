import Link from 'next/link';
import styles from '../page.module.css';
import Nav from '../components/Nav';
import Reveal from '../components/Reveal';

export const metadata = {
  title: 'Contact — SentientMarkets',
};

export default function ContactPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[1200px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the homepage hero */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              Contact
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              We&apos;re easy<br />to <em className="not-italic text-[#0a0b0d]">reach.</em>
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              Questions, feedback, or just want to say something — we read everything and respond promptly.
            </p>
          </section>

          {/* GET IN TOUCH */}
          <section className="py-16 border-b border-[#eef0f3]">
            <Reveal>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-8">Get in touch</div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  label: 'General enquiries',
                  title: 'Send us an email',
                  desc: 'For questions about the platform, your account, data, or anything else — email is the fastest way to reach us.',
                  action: { href: 'mailto:hello@sentientmarkets.ai', text: 'hello@sentientmarkets.ai →', isExternal: true },
                  highlight: true,
                },
                {
                  label: 'Have a question first?',
                  title: 'Check the FAQ',
                  desc: 'Most common questions about the score, data sources, and Pro are already answered in our FAQ — worth a quick look before reaching out.',
                  action: { href: '/faq', text: 'Browse FAQ →', isExternal: false },
                  highlight: false,
                },
                {
                  label: 'Found a bug?',
                  title: 'Report an issue',
                  desc: "If something looks wrong — a bad score, a broken chart, a ticker that isn't loading — let us know and we'll look into it straight away.",
                  action: { href: 'mailto:hello@sentientmarkets.ai?subject=Bug report', text: 'Report a bug →', isExternal: true },
                  highlight: false,
                },
              ].map(({ label, title, desc, action, highlight }, i) => (
                <Reveal key={title} delay={i * 0.08} className="h-full">
                  <div
                    className={`bg-white rounded-xl p-6 flex flex-col gap-3 border h-full ${
                      highlight ? 'border-[rgba(0,82,255,0.3)]' : 'border-[#dee1e6]'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-[#a8acb3]">{label}</div>
                    <div className="text-sm font-semibold text-[#0a0b0d]">{title}</div>
                    <div className="text-xs text-[#5b616e] leading-relaxed flex-1">{desc}</div>
                    {action.isExternal ? (
                      <a href={action.href} className="text-xs font-semibold text-[#0052ff] hover:underline mt-1">
                        {action.text}
                      </a>
                    ) : (
                      <Link href={action.href} className="text-xs font-semibold text-[#0052ff] hover:underline mt-1">
                        {action.text}
                      </Link>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <div className="flex items-center gap-2 text-xs text-[#5b616e]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#05b169]" />
                We typically respond within <strong className="font-mono font-medium text-[#0a0b0d]">24 hours</strong> on business days.
              </div>
            </Reveal>
          </section>

          {/* FAQ NUDGE */}
          <section className="py-16">
            <Reveal>
              <div className="flex items-center justify-between bg-white border border-[#dee1e6] rounded-xl p-6">
                <div>
                  <div className="text-sm font-semibold text-[#0a0b0d] mb-1">Looking for something specific?</div>
                  <div className="text-xs text-[#7c828a]">Our FAQ covers the score, data sources, Pro features, and more.</div>
                </div>
                <Link href="/faq" className="shrink-0 ml-4 text-xs font-semibold text-[#0a0b0d] bg-[#eef0f3] hover:bg-[#dee1e6] px-4 py-2 rounded-full transition-colors">
                  Go to FAQ →
                </Link>
              </div>
            </Reveal>
          </section>

        </div>
      </div>

      <footer className="border-t border-[#dee1e6] bg-white py-8 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-base font-semibold tracking-[-0.01em] text-[#0a0b0d]">SentientMarkets</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Terms</Link>
          <Link href="/contact" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Contact</Link>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a]">© 2026 · Not financial advice.</div>
      </footer>
    </div>
  );
}
