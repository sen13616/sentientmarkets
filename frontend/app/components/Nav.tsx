'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Shared by the desktop link row and the mobile menu panel.
const NAV_LINKS: [string, string][] = [
  ['/screener', 'Screener'],
  ['/about', 'About'],
  ['/technology', 'Technology'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
];

// `variant` defaults to 'dark' so any existing caller keeps the original look.
// The redesigned homepage opts into the light NEW_DESIGN treatment; the
// in-page stock view stays on the dark variant until its own redesign.
// `onNavigate` is optional so server components (the static pages) can render
// the Nav — without it, the logo and "Markets" fall back to plain links.
export default function Nav({
  onNavigate,
  variant = 'dark',
}: {
  onNavigate?: (page: string) => void;
  variant?: 'dark' | 'light';
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Route change closes the panel (covers back/forward too).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const light = variant === 'light';

  const frameCls = light
    ? `h-14 ${scrolled ? 'bg-white/95 border-[#dee1e6]' : 'bg-white/80 border-[#eef0f3]'}`
    : `py-6 ${scrolled ? 'bg-[#0A0A0B]/95 border-white/10' : 'bg-[#0A0A0B]/80 border-white/5'}`;

  const logoCls = light
    ? 'text-lg font-semibold tracking-[-0.01em] text-[#0a0b0d]'
    : 'font-serif italic text-2xl font-bold tracking-tight text-white';

  const linkCls = light
    ? 'text-sm font-medium text-[#5b616e] hover:text-[#0a0b0d] transition-colors'
    : 'text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide opacity-70 hover:opacity-100';

  const ctaCls = light
    ? 'bg-[#0052ff] hover:bg-[#003ecc] text-white px-5 h-10 rounded-full text-sm font-semibold transition-all active:scale-95'
    : 'bg-white hover:bg-[#E4E4E7] text-black px-6 py-2 rounded-md text-xs font-bold transition-all active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]';

  const menuCls = light ? 'md:hidden text-[#5b616e]' : 'md:hidden text-[#A1A1AA]';

  const panelCls = light
    ? 'bg-white border-b border-[#dee1e6]'
    : 'bg-[#0A0A0B] border-b border-white/10';

  const panelLinkCls = light
    ? 'block px-6 py-3.5 text-[15px] font-medium text-[#0a0b0d] active:bg-[#f7f7f7] transition-colors'
    : 'block px-6 py-3.5 text-sm font-bold text-white uppercase tracking-wide active:bg-white/5 transition-colors';

  function handleHome() {
    setMenuOpen(false);
    onNavigate?.('home');
  }

  // Logo + "Markets": buttons when the caller drives navigation, links otherwise.
  const logo = onNavigate ? (
    <button onClick={handleHome} className={logoCls}>
      {light ? 'SentientMarkets' : 'SentientMarkets.'}
    </button>
  ) : (
    <Link href="/" className={logoCls}>
      {light ? 'SentientMarkets' : 'SentientMarkets.'}
    </Link>
  );

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 backdrop-blur-md border-b transition-colors duration-300 ${frameCls}`}
    >
      {/* Logo */}
      {logo}

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-8">
        {onNavigate ? (
          <button onClick={() => onNavigate('home')} className={linkCls}>
            Markets
          </button>
        ) : (
          <Link href="/" className={linkCls}>
            Markets
          </Link>
        )}
        {NAV_LINKS.map(([href, label]) => (
          <Link key={label} href={href} className={linkCls}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right — on light, the single blue moment in the nav fold */}
      <div className="flex items-center gap-4">
        <button className={ctaCls}>Get Pro</button>
        <button
          className={menuCls}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu — scrim + slide-down panel pinned under the sticky bar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="md:hidden absolute left-0 right-0 top-full h-screen bg-black/25"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              key="panel"
              initial={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`md:hidden absolute left-0 right-0 top-full overflow-hidden ${panelCls}`}
            >
              <div className="py-2">
                {onNavigate ? (
                  <button onClick={handleHome} className={`${panelLinkCls} w-full text-left`}>
                    Markets
                  </button>
                ) : (
                  <Link href="/" className={panelLinkCls} onClick={() => setMenuOpen(false)}>
                    Markets
                  </Link>
                )}
                {NAV_LINKS.map(([href, label]) => (
                  <Link
                    key={label}
                    href={href}
                    className={panelLinkCls}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
                <div className={`mt-2 px-6 py-4 border-t ${light ? 'border-[#eef0f3]' : 'border-white/10'}`}>
                  <button className={`${ctaCls} w-full`}>Get Pro</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
