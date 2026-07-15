// `variant` defaults to 'dark' so every existing caller (asset pages via
// IndexConstituents, stock pages via PriceChart) keeps its current look.
// The redesigned homepage opts into the light NEW_DESIGN treatment.
export default function Footer({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const light = variant === 'light';

  const frameCls = light
    ? 'border-t border-[#dee1e6] bg-white py-8 px-6 md:px-20 mt-0'
    : 'border-t border-white/5 bg-black/20 py-12 px-6 md:px-20 mt-20';

  const copyCls = light
    ? 'mr-auto text-[11px] font-semibold text-[#7c828a] uppercase tracking-[0.08em]'
    : 'mr-auto text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40';

  const linkCls = light
    ? 'text-[11px] font-semibold text-[#7c828a] uppercase tracking-[0.08em] hover:text-[#0a0b0d] transition-colors'
    : 'text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40 hover:text-white transition-colors';

  return (
    <footer className={frameCls}>
      <div className="flex flex-wrap justify-end gap-8 md:gap-12">
        <span className={copyCls}>
          © 2026 SENTIENTMARKETS.
        </span>
        {['Privacy', 'Terms', 'Contact', 'Legal Disclaimer'].map((link) => (
          <a key={link} href="#" className={linkCls}>
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
