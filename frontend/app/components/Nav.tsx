'use client';

import { Menu } from 'lucide-react';

export default function Nav({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-20 py-6 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
      {/* Logo */}
      <button
        onClick={() => onNavigate('home')}
        className="font-serif italic text-2xl font-bold tracking-tight text-white"
      >
        SentientMarkets.
      </button>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-8">
        {[
          { label: 'Markets', action: () => onNavigate('home') },
          { label: 'About', action: undefined },
          { label: 'Technology', action: undefined },
          { label: 'FAQ', action: undefined },
          { label: 'Contact', action: undefined },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="text-[10px] font-bold text-[#A1A1AA] hover:text-white transition-colors uppercase tracking-[0.1em] opacity-60 hover:opacity-100"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="bg-white hover:bg-[#E4E4E7] text-black px-6 py-2 rounded-md text-xs font-bold transition-all active:scale-95">
          Get Pro
        </button>
        <button className="md:hidden text-[#A1A1AA]">
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
}
