'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Link from 'next/link';

// `variant` defaults to 'dark' so any existing caller keeps the original look.
// The redesigned homepage opts into the light NEW_DESIGN treatment; the
// in-page stock view stays on the dark variant until its own redesign.
export default function Nav({
  onNavigate,
  variant = 'dark',
}: {
  onNavigate: (page: string) => void;
  variant?: 'dark' | 'light';
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 backdrop-blur-md border-b transition-colors duration-300 ${frameCls}`}
    >
      {/* Logo */}
      <button onClick={() => onNavigate('home')} className={logoCls}>
        {light ? 'SentientMarkets' : 'SentientMarkets.'}
      </button>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-8">
        <button onClick={() => onNavigate('home')} className={linkCls}>
          Markets
        </button>
        {[
          ['/about', 'About'],
          ['/technology', 'Technology'],
          ['/faq', 'FAQ'],
          ['/contact', 'Contact'],
        ].map(([href, label]) => (
          <Link key={label} href={href} className={linkCls}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right — on light, the single blue moment in the nav fold */}
      <div className="flex items-center gap-4">
        <button className={ctaCls}>Get Pro</button>
        <button className={menuCls}>
          <Menu size={20} />
        </button>
      </div>
    </motion.nav>
  );
}
