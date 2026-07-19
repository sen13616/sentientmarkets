import Link from 'next/link';
import FaqAccordion from './FaqAccordion';
import styles from '../page.module.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'FAQ — SentientMarkets',
};


export default function FaqPage() {
  return (
    <div className={`${styles.home} home-light min-h-screen`}>
      <Nav variant="light" />

      <div className="px-6 md:px-20">
        <div className="mx-auto w-full max-w-[1200px] pb-24">

          {/* HERO — CSS stagger on load, same recipe as the homepage hero */}
          <section className="py-20 border-b border-[#eef0f3]">
            <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a] mb-6 ${styles.heroFade0}`}>
              FAQ
            </div>
            <h1 className={`text-4xl md:text-[44px] font-normal text-[#5b616e] leading-[1.1] tracking-[-1px] mb-6 ${styles.heroFade1}`}>
              Common <em className="not-italic text-[#0a0b0d]">questions,</em><br />straight answers.
            </h1>
            <p className={`text-[#5b616e] text-base max-w-xl leading-[1.55] ${styles.heroFade2}`}>
              Everything you need to know about how SentientMarkets works, what the score means, and
              what you get with <span className="pro-blur" aria-hidden="true">Pro</span>.
            </p>
          </section>

          {/* FAQ BODY — client component handles accordion + nav */}
          <FaqAccordion />

        </div>
      </div>

      <footer className="border-t border-[#dee1e6] bg-white py-8 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-base font-semibold tracking-[-0.01em] text-[#0a0b0d]">SentientMarkets</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Terms</Link>
          <Link href="/faq" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">FAQ</Link>
          <Link href="/contact" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a] hover:text-[#0a0b0d] transition-colors">Contact</Link>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c828a]">© 2026 · Not financial advice.</div>
      </footer>
    </div>
  );
}
