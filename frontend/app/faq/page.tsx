import Link from 'next/link';
import FaqAccordion from './FaqAccordion';

export const metadata = {
  title: 'FAQ — SentientMarkets',
};

const NAV_LINKS: [string, string][] = [
  ['/', 'Markets'],
  ['/about', 'About'],
  ['/technology', 'Technology'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
];

export default function FaqPage() {
  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 py-6 backdrop-blur-md border-b bg-[#0A0A0B]/95 border-white/10">
        <Link href="/" className="font-serif italic text-2xl font-bold tracking-tight text-white">
          SentientMarkets.
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide opacity-70 hover:opacity-100"
            >
              {label}
            </Link>
          ))}
        </div>
        <button className="bg-white hover:bg-[#E4E4E7] text-black px-6 py-2 rounded-md text-xs font-bold transition-all active:scale-95">
          Get Pro
        </button>
      </nav>

      <div className="max-w-[1080px] mx-auto pb-24">

        {/* HERO */}
        <section className="py-20 px-6 md:px-8 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] inline-block" />
            FAQ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Common <em className="not-italic text-[var(--amber)]">questions,</em><br />straight answers.
          </h1>
          <p className="text-[#A1A1AA] text-base max-w-xl leading-relaxed">
            Everything you need to know about how SentientMarkets works, what the score means, and
            what you get with Pro.
          </p>
        </section>

        {/* FAQ BODY — client component handles accordion + nav */}
        <FaqAccordion />

      </div>

      <footer className="border-t border-white/[0.07] py-8 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
        <div className="font-serif italic text-white font-bold text-lg">SentientMarkets.</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div>© 2026 · Not financial advice.</div>
      </footer>
    </>
  );
}
