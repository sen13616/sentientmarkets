'use client';

import { RefObject, useCallback, useState } from 'react';

export type HoverPoint = { i: number; x: number } | null;

/* Shared crosshair hover for the responsive SVG charts.

   - Coordinates: the SVGs render with a fixed viewBox at width:100%, uniform
     scale, so clientX maps to viewBox units by plain ratio (rect read fresh
     per event — it is viewport-relative and changes on scroll).
   - Snapping: `xs` holds the viewBox x of REAL (non-null) data points only,
     so the crosshair can never rest inside a data-gap band — the nearest
     real point wins by construction.
   - Touch: pointerdown places the crosshair and pointermove scrubs; the
     svg carries `touch-action: pan-y` (CSS) so vertical page scroll works. */
export default function useChartHover({
  svgRef,
  xs,
  viewBoxWidth,
}: {
  svgRef: RefObject<SVGSVGElement>;
  xs: { i: number; x: number }[];
  viewBoxWidth: number;
}) {
  const [hover, setHover] = useState<HoverPoint>(null);

  const locate = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || xs.length === 0) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return;
      const vx = (clientX - rect.left) * (viewBoxWidth / rect.width);
      let best = xs[0];
      let bestD = Math.abs(vx - best.x);
      for (let k = 1; k < xs.length; k++) {
        const d = Math.abs(vx - xs[k].x);
        if (d < bestD) {
          best = xs[k];
          bestD = d;
        }
      }
      setHover({ i: best.i, x: best.x });
    },
    [svgRef, xs, viewBoxWidth],
  );

  const clear = useCallback(() => setHover(null), []);

  return {
    hover,
    handlers: {
      onPointerMove: (e: React.PointerEvent) => locate(e.clientX),
      onPointerDown: (e: React.PointerEvent) => locate(e.clientX),
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}
