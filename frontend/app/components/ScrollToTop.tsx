'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* Guarantees every route change lands at the top of the page, covering the
   cases Next's built-in scroll heuristic misses (router.push flows, and
   same-route navigations like /stock/AAPL → /stock/TSLA where the layout
   persists). Renders nothing. */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
