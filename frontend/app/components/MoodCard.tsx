'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Clock } from 'lucide-react';
import { getMood } from '@/lib/api';

type MoodData = {
  emotion: string;
  rationale: string;
  intensity: number;
  accent_color?: string;
  key_signals?: string[];
  history?: { emotion: string }[];
  timestamp?: string;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function isNegative(emotion: string): boolean {
  const e = emotion.toLowerCase();
  return ['anxious', 'fear', 'bearish', 'wary'].some((w) => e.includes(w));
}

export default function MoodCard() {
  const [mood, setMood] = useState<MoodData | null>(null);
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);

  useEffect(() => {
    getMood()
      .then((data: MoodData) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[MoodCard] API response:', data);
        }
        setMood(data);
        if (data?.timestamp) {
          setMinutesAgo(
            Math.floor((Date.now() - new Date(data.timestamp).getTime()) / 60000)
          );
        }
      })
      .catch(() => {});
  }, []);

  if (!mood?.emotion) {
    return (
      <div className="bg-[#111112] border border-white/5 rounded-[2rem] p-10 md:p-14 w-full animate-pulse">
        <div className="h-4 w-28 bg-white/5 rounded mb-8" />
        <div className="h-14 w-48 bg-white/5 rounded mb-6" />
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: 10 }, (_, i) => <div key={i} className="h-3 w-3 rounded-full bg-white/5" />)}
        </div>
        <div className="space-y-3 mb-10">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-4/5 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  const negative    = isNegative(mood.emotion);
  const score       = Math.min(Math.max(Math.round(mood.intensity ?? 5), 1), 10);
  const accentText  = negative ? 'text-red-500'      : 'text-green-500';
  const accentBg    = negative ? 'bg-red-500'        : 'bg-green-500';
  const dotColor    = negative ? 'bg-red-500/60'     : 'bg-green-500/60';
  const glowColor   = negative ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)';
  const signals     = (mood.key_signals ?? []).slice(0, 4);
  const history     = (mood.history ?? []).slice(-5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bg-[#111112] border border-white/5 rounded-[2rem] p-10 md:p-14 relative overflow-hidden w-full">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#A1A1AA] opacity-50">
              Market Mood
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          </div>
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-full">
            <Globe size={10} className="text-[#A1A1AA]" />
            <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
              GPT-4o
            </span>
          </div>
        </div>

        {/* Emotion word */}
        <div
          className={`text-5xl md:text-6xl font-serif font-bold tracking-tight leading-none transition-colors duration-500 mb-6 ${accentText}`}
        >
          {mood.emotion}
        </div>

        {/* Dot score row */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full ${i < score ? accentBg : 'bg-neutral-800'}`}
              />
            ))}
          </div>
          <span className="text-sm font-mono font-bold text-[#A1A1AA] opacity-60 px-2 py-0.5 bg-white/[0.03] rounded">
            {score}/10
          </span>
        </div>

        {/* Rationale */}
        <p className="text-lg md:text-xl text-[#D4D4D8] font-normal leading-relaxed max-w-5xl mb-10">
          {mood.rationale}
        </p>

        {/* Chips from key_signals */}
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {signals.map((signal, i) => {
              // Attempt to split "Label: Value" — fall back to full text as value
              const colonIdx = signal.indexOf(':');
              const label = colonIdx > -1 ? signal.slice(0, colonIdx).trim() : 'Signal';
              const value = colonIdx > -1 ? signal.slice(colonIdx + 1).trim() : signal;
              return (
                <div
                  key={i}
                  className="bg-white/[0.04] border border-white/5 px-5 py-2.5 rounded-full flex items-center gap-3"
                >
                  <span className="text-[11px] text-[#A1A1AA] uppercase tracking-wider opacity-60 font-bold">
                    {label}
                  </span>
                  <span className="text-[11px] font-bold text-white uppercase tracking-tight">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 5-day mood history — only renders when the API returns history data */}
        {history.length > 0 && (
          <div className="border-t border-white/5 pt-16 mt-8">
            <div className="flex items-end justify-between flex-wrap gap-6">
              <div>
                <p className="text-[12px] font-bold text-[#A1A1AA] uppercase tracking-[0.2em] opacity-50 mb-6">
                  5-day mood history
                </p>
                <div className="flex items-end gap-4">
                  {history.map((h, i) => {
                    const isToday = i === history.length - 1;
                    const neg = isNegative(h.emotion);
                    const bg  = neg ? 'bg-red-500' : 'bg-green-500';
                    const glow = neg ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)';
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div
                          className={`h-1.5 w-16 md:w-20 rounded-full ${bg} ${!isToday ? 'opacity-20' : ''}`}
                          style={isToday ? { boxShadow: `0 0 20px ${glow}` } : undefined}
                        />
                        <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40">
                          {DAYS[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#A1A1AA] opacity-40">
                <Clock size={12} />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Real-time update
                </span>
                {minutesAgo !== null && (
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    · Updated {minutesAgo} min ago
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
