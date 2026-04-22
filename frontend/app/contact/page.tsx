import Link from 'next/link';

export const metadata = {
  title: 'Contact — SentientMarkets',
};

const NAV_LINKS: [string, string][] = [
  ['/', 'Markets'],
  ['/about', 'About'],
  ['/technology', 'Technology'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
];

export default function ContactPage() {
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

      <div className="max-w-[1080px] mx-auto px-6 md:px-8 pb-24">

        {/* HERO */}
        <section className="py-20 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] inline-block" />
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            We&apos;re easy<br />to <em className="not-italic text-[var(--green)]">reach.</em>
          </h1>
          <p className="text-[#A1A1AA] text-base max-w-xl leading-relaxed">
            Questions, feedback, or just want to say something — we read everything and respond promptly.
          </p>
        </section>

        {/* GET IN TOUCH */}
        <section className="py-16 border-b border-white/[0.07]">
          <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#A1A1AA] mb-10">Get in touch</div>

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
            ].map(({ label, title, desc, action, highlight }) => (
              <div
                key={title}
                className={`rounded-xl p-6 flex flex-col gap-3 border ${
                  highlight
                    ? 'bg-[#111112] border-[var(--green)]/20'
                    : 'bg-[#111112] border-white/[0.07]'
                }`}
              >
                <div className="text-[10px] uppercase tracking-[1.2px] text-[#71717A]">{label}</div>
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="text-xs text-[#A1A1AA] leading-relaxed flex-1">{desc}</div>
                {action.isExternal ? (
                  <a href={action.href} className="text-xs font-bold text-[var(--green)] hover:underline mt-1">
                    {action.text}
                  </a>
                ) : (
                  <Link href={action.href} className="text-xs font-bold text-[var(--green)] hover:underline mt-1">
                    {action.text}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            We typically respond within <strong className="text-white">24 hours</strong> on business days.
          </div>
        </section>

        {/* FAQ NUDGE */}
        <section className="py-16">
          <div className="flex items-center justify-between bg-[#111112] border border-white/[0.07] rounded-xl p-6">
            <div>
              <div className="text-sm font-bold text-white mb-1">Looking for something specific?</div>
              <div className="text-xs text-[#A1A1AA]">Our FAQ covers the score, data sources, Pro features, and more.</div>
            </div>
            <Link href="/faq" className="shrink-0 ml-4 text-xs font-bold text-white border border-white/10 px-4 py-2 rounded-md hover:bg-white/5 transition-colors">
              Go to FAQ →
            </Link>
          </div>
        </section>

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
