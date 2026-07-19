'use client';

import { useEffect, useState } from 'react';

/* Phone-width flag for the fixed-viewBox SVG charts. At ≤640px the desktop
   960/1000-unit geometry scales labels down to ~4px, so charts swap to a
   compact constant set instead of scrolling (which would fight the
   touch-action:pan-y scrub). Initializes false so SSR/hydration render the
   desktop geometry, then corrects in an effect before first paint settles. */
export default function useCompactChart(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return compact;
}
