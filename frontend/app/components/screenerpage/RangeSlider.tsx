'use client';

import { useCallback, useRef } from 'react';
import { Range } from './types';
import s from './screenerpage.module.css';

/* Dual-thumb range slider matching the mockup's track/fill/knob styling.
   Pointer-drag with capture, keyboard per thumb (arrows ±1, Shift ±5,
   Home/End), integer snapping, min-gap 1, ≥44px hit areas (CSS ::before).
   `.act` blue styling applies whenever the range is narrowed from full. */
export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  label,
}: {
  min: number;
  max: number;
  value: Range;
  onChange: (next: Range) => void;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [lo, hi] = value;
  const active = lo !== min || hi !== max;
  const span = max - min;
  const pct = (v: number) => ((v - min) / span) * 100;

  const valueAt = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return min;
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(min + frac * span);
    },
    [min, span],
  );

  const startDrag = (thumb: 'lo' | 'hi') => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const v = valueAt(ev.clientX);
      if (thumb === 'lo') onChange([Math.min(v, hi - 1), hi]);
      else onChange([lo, Math.max(v, lo + 1)]);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const keyNudge = (thumb: 'lo' | 'hi') => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    let delta = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = step;
    else if (e.key === 'Home') delta = -span;
    else if (e.key === 'End') delta = span;
    else return;
    e.preventDefault();
    if (thumb === 'lo') {
      onChange([Math.min(Math.max(min, lo + delta), hi - 1), hi]);
    } else {
      onChange([lo, Math.max(Math.min(max, hi + delta), lo + 1)]);
    }
  };

  const fmt = (v: number) => (v > 0 && min < 0 ? `+${v}` : String(v));

  return (
    <div className={s.f}>
      <div className={s.fLabel}>
        <span className={s.fName}>{label}</span>
        <span className={`${s.fVal} ${active ? s.fValAct : ''}`}>
          {fmt(lo)} – {fmt(hi)}
        </span>
      </div>
      <div className={s.track} ref={trackRef}>
        <div
          className={`${s.fill} ${active ? s.fillAct : ''}`}
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
        />
        {(['lo', 'hi'] as const).map((thumb) => {
          const v = thumb === 'lo' ? lo : hi;
          return (
            <div
              key={thumb}
              className={`${s.knob} ${active ? s.knobAct : ''}`}
              style={{ left: `${pct(v)}%` }}
              role="slider"
              tabIndex={0}
              aria-label={`${label} ${thumb === 'lo' ? 'minimum' : 'maximum'}`}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={v}
              onPointerDown={startDrag(thumb)}
              onKeyDown={keyNudge(thumb)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* Single-thumb "minimum" slider (Data quality → Min confidence). */
export function MinSlider({
  min,
  max,
  value,
  onChange,
  label,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const active = value > min;
  const span = max - min;
  const pct = ((value - min) / span) * 100;

  const valueAt = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(min + frac * span);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => onChange(valueAt(ev.clientX));
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const keyNudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    let next = value;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + step;
    else if (e.key === 'Home') next = min;
    else if (e.key === 'End') next = max;
    else return;
    e.preventDefault();
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <div className={s.f}>
      <div className={s.fLabel}>
        <span className={s.fName}>{label}</span>
        <span className={`${s.fVal} ${active ? s.fValAct : ''}`}>{value}</span>
      </div>
      <div className={s.track} ref={trackRef}>
        <div
          className={`${s.fill} ${active ? s.fillAct : ''}`}
          style={{ left: `${pct}%`, width: `${100 - pct}%` }}
        />
        <div
          className={`${s.knob} ${active ? s.knobAct : ''}`}
          style={{ left: `${pct}%` }}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onPointerDown={startDrag}
          onKeyDown={keyNudge}
        />
      </div>
    </div>
  );
}
