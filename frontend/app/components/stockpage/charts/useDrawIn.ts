'use client';

import { RefObject } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/* One-shot draw-in trigger shared by all chart animations.
   Observe the <svg>/wrapper element — never elements inside a <clipPath>
   (IntersectionObserver does not fire on unrendered clip contents).
   When `reduced`, callers must render the final state with no animation. */
export default function useDrawIn(ref: RefObject<Element>) {
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion() ?? false;
  return { shouldDraw: inView, reduced };
}
