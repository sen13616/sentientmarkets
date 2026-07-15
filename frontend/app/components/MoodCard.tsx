'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
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
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7c828a] mb-6">
          Market Mood
        </p>
        <div className="bg-white border border-[#dee1e6] rounded-xl p-7 w-full animate-pulse">
          <div className="flex justify-end mb-1">
            <div className="h-6 w-20 bg-[#eef0f3] rounded-full" />
          </div>
          <div className="flex items-center justify-between pb-[22px] mb-[22px] border-b border-[#eef0f3]">
            <div className="h-11 w-48 bg-[#eef0f3] rounded" />
            <div className="flex gap-[5px]">
              {Array.from({ length: 10 }, (_, i) => <div key={i} className="h-[9px] w-[9px] rounded-full bg-[#eef0f3]" />)}
            </div>
          </div>
          <div className="grid md:grid-cols-[1.15fr_1fr] gap-6 md:gap-9">
            <div className="space-y-3">
              <div className="h-4 w-full bg-[#eef0f3] rounded" />
              <div className="h-4 w-full bg-[#eef0f3] rounded" />
              <div className="h-4 w-4/5 bg-[#eef0f3] rounded" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-10 w-full bg-[#eef0f3] rounded-[10px]" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const negative    = isNegative(mood.emotion);
  const score       = Math.min(Math.max(Math.round(mood.intensity ?? 5), 1), 10);
  const accentText  = negative ? 'text-[#cf202f]'    : 'text-[#05b169]';
  const accentBg    = negative ? 'bg-[#cf202f]'      : 'bg-[#05b169]';
  const dotColor    = negative ? 'bg-[#cf202f]'      : 'bg-[#05b169]';
  const signals     = (mood.key_signals ?? []).slice(0, 4);
  const history     = (mood.history ?? []).slice(-5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Section label — outside the card so it shares the column's left
          edge with Market Snapshot / Reddit Trending */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 }}
            className={`absolute w-1.5 h-1.5 rounded-full ${dotColor}`}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
          />
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7c828a]">
          Market Mood
        </span>
      </div>

      <div className="bg-white border border-[#dee1e6] rounded-xl p-7 relative overflow-hidden w-full">

        {/* Meta row — model badge only, right-aligned */}
        <div className="flex justify-end mb-1">
          <span className="inline-flex items-center gap-1.5 bg-[#eef0f3] text-[#7c828a] text-[11px] font-semibold tracking-[0.03em] px-[11px] py-[5px] rounded-full">
            ✦ Claude
          </span>
        </div>

        {/* Headline row — verdict + score own the full width */}
        <div className="flex items-center justify-between gap-6 pb-[22px] mb-[22px] border-b border-[#eef0f3]">
          <div
            className={`text-4xl md:text-[44px] font-normal leading-none tracking-[-1.5px] transition-colors duration-500 ${accentText}`}
          >
            {mood.emotion}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-[5px]">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.3 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
                  className={`h-[9px] w-[9px] rounded-full ${i < score ? accentBg : 'bg-[#dee1e6]'}`}
                />
              ))}
            </div>
            <span className="text-sm font-mono font-medium text-[#5b616e] bg-[#eef0f3] px-[11px] py-1 rounded-md">
              {score}/10
            </span>
          </div>
        </div>

        {/* Body row — rationale + key signals, two columns */}
        <div className="grid md:grid-cols-[1.15fr_1fr] gap-6 md:gap-9 items-start">
          <p className="text-base leading-[1.55] text-[#5b616e]">
            {mood.rationale}
          </p>

          {signals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8acb3] mb-3">
                Key Signals
              </p>
              {signals.map((signal, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3.5 py-[11px] bg-[#f7f7f7] border border-[#eef0f3] rounded-[10px] mb-2 last:mb-0"
                >
                  <span className="text-[10px] font-bold tracking-[0.04em] text-[#7c828a] bg-white border border-[#dee1e6] px-[7px] py-0.5 rounded-[5px] shrink-0 mt-px">
                    SIGNAL
                  </span>
                  <span className="text-[12.5px] font-medium leading-[1.35] text-[#0a0b0d]">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — 5-day history + freshness, only when history data exists */}
        {history.length > 0 && (
          <>
            <div className="h-px bg-[#eef0f3] mt-6 mb-5" />
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <p className="text-[11px] font-semibold text-[#7c828a] uppercase tracking-[0.06em] mb-3">
                  5-Day Mood History
                </p>
                <div className="flex items-center gap-7">
                  {history.map((h, i) => {
                    const isToday = i === history.length - 1;
                    const neg = isNegative(h.emotion);
                    const textColor = neg ? 'text-[#cf202f]' : 'text-[#05b169]';
                    return (
                      <div key={i} className="flex flex-col gap-[3px]">
                        <span className={`text-[13px] font-semibold capitalize ${isToday ? textColor : 'text-[#7c828a]'}`}>
                          {h.emotion}
                        </span>
                        <span className="text-[10px] font-medium text-[#a8acb3] uppercase tracking-[0.05em]">
                          {DAYS[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#a8acb3]">
                <Clock size={11} />
                <span>
                  Real-time update{minutesAgo !== null ? ` · updated ${minutesAgo} min ago` : ''}
                </span>
              </div>
            </div>
          </>
        )}

      </div>
    </motion.div>
  );
}
