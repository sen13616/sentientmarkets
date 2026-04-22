'use client';

import { useEffect, useState } from 'react';

export default function ScrollCue() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`absolute bottom-9 left-6 md:left-20 z-[2] flex items-center gap-2.5 text-[0.65rem] tracking-[0.1em] uppercase text-white/20 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <style>{`
        @keyframes line-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .scroll-line-fill { animation: line-sweep 2s ease-in-out infinite; }
      `}</style>

      {/* Animated line */}
      <div className="relative w-8 h-px bg-white/15 overflow-hidden">
        <div className="scroll-line-fill absolute inset-0 bg-[#4afa8a]" />
      </div>

      Scroll to explore
    </div>
  );
}
