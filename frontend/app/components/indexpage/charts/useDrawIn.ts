'use client';

import { RefObject } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/* One-shot draw-in trigger (local copy of the stockpage hook — the pages
   stay decoupled): fires once when the chart scrolls into view, never
   replays; reduced-motion renders the final state statically. */
export default function useDrawIn(ref: RefObject<Element>) {
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion() ?? false;
  return { shouldDraw: inView, reduced };
}
