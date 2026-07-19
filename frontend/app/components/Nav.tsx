'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

// FAQ and Contact live in the footer, not here.
const LINKS: [string, string][] = [
  ['/screener', 'Screener'],
  ['/about', 'About'],
  ['/technology', 'Technology'],
  ['/api-access', 'API Access'],
];

// `variant` defaults to 'dark' so any existing caller keeps the original look.
// The redesigned homepage opts into the light NEW_DESIGN treatment; the
// in-page stock view stays on the dark variant until its own redesign.
// `onNavigate` is optional: without it the logo and "Markets" are plain
// links to "/" (static pages); with it the caller decides (SPA scroll-to-top).
export default function Nav({
  onNavigate,
  variant = 'dark',
}: {
  onNavigate?: (page: string) => void;
  variant?: 'dark' | 'light';
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const light = variant === 'light';

  const frameCls = light
    ? `h-14 ${scrolled || open ? 'bg-white/95 border-[#dee1e6]' : 'bg-white/80 border-[#eef0f3]'}`
    : `py-6 ${scrolled || open ? 'bg-[#0A0A0B]/95 border-white/10' : 'bg-[#0A0A0B]/80 border-white/5'}`;

  const logoCls = light
    ? 'text-lg font-semibold tracking-[-0.01em] text-[#0a0b0d]'
    : 'font-serif italic text-2xl font-bold tracking-tight text-white';

  const linkCls = light
    ? 'text-sm font-medium text-[#5b616e] hover:text-[#0a0b0d] transition-colors'
    : 'text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide opacity-70 hover:opacity-100';

  const ctaCls = light
    ? 'text-sm font-semibold text-[#0052ff]'
    : 'text-xs font-bold uppercase tracking-wide text-[#5c8aff]';

  // p-3 with negative margins keeps the icon visually in place while giving
  // the hamburger a 44px touch target on phones.
  const menuCls = `md:hidden p-3 -m-3 ${light ? 'text-[#5b616e]' : 'text-[#A1A1AA]'}`;

  const panelCls = light
    ? 'bg-white/95 border-[#dee1e6]'
    : 'bg-[#0A0A0B]/95 border-white/10';

  const panelLinkCls = light
    ? 'block py-3 text-[15px] font-medium text-[#5b616e] hover:text-[#0a0b0d] transition-colors'
    : 'block py-3 text-sm font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide';

  function handleHome() {
    setOpen(false);
    onNavigate?.('home');
  }

  const home = onNavigate ? (
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
      {home}

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-8">
        {onNavigate ? (
          <button onClick={handleHome} className={linkCls}>
            Markets
          </button>
        ) : (
          <Link href="/" className={linkCls}>
            Markets
          </Link>
        )}
        {LINKS.map(([href, label]) => (
          <Link key={label} href={href} className={linkCls}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right — on light, the single blue moment in the nav fold */}
      <div className="flex items-center gap-4">
        <span className={ctaCls}>Beta Version</span>
        <button
          className={menuCls}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile slide-down panel — inherits the sticky bar's position */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`md:hidden absolute top-full left-0 right-0 border-b backdrop-blur-md px-6 py-4 ${panelCls}`}
          >
            {onNavigate ? (
              <button onClick={handleHome} className={`${panelLinkCls} w-full text-left`}>
                Markets
              </button>
            ) : (
              <Link href="/" className={panelLinkCls} onClick={() => setOpen(false)}>
                Markets
              </Link>
            )}
            {LINKS.map(([href, label]) => (
              <Link key={label} href={href} className={panelLinkCls} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
