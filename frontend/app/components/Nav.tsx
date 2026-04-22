'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export default function Nav({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 py-6 backdrop-blur-md border-b transition-colors duration-300 ${
        scrolled ? 'bg-[#0A0A0B]/95 border-white/10' : 'bg-[#0A0A0B]/80 border-white/5'
      }`}
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate('home')}
        className="font-serif italic text-2xl font-bold tracking-tight text-white"
      >
        SentientMarkets.
      </button>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-8">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide opacity-70 hover:opacity-100"
        >
          Markets
        </button>
        {[
          ['/about', 'About'],
          ['/technology', 'Technology'],
          ['/faq', 'FAQ'],
          ['/contact', 'Contact'],
        ].map(([href, label]) => (
          <Link
            key={label}
            href={href}
            className="text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-wide opacity-70 hover:opacity-100"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="bg-white hover:bg-[#E4E4E7] text-black px-6 py-2 rounded-md text-xs font-bold transition-all active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          Get Pro
        </button>
        <button className="md:hidden text-[#A1A1AA]">
          <Menu size={20} />
        </button>
      </div>
    </motion.nav>
  );
}
