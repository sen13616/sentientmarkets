'use client';

import { useEffect, useRef } from 'react';

/* 3D particle heart — hero background (ported from hero-background-element.html).
   Heart surface: (x² + 9/4·y² + z² − 1)³ − x²·z³ − 9/80·y²·z³ = 0  (z is up)
   Particles sampled on the surface by ray-bisection from the centre.
   Beads flow across the surface, the heart spins slowly around the
   vertical axis, beats (lub-dub scale pulse), repels from the cursor,
   and explodes outward as the user scrolls. All constants are final. */

type Bead = {
  u: number;      // azimuth on the surface
  v: number;      // polar (uniform over the sphere)
  seed: number;   // phase offset into the flow field
  drift: number;  // per-bead current speed
  size: number;
  rgb: number[];
  aJit: number;   // per-bead opacity jitter
  ox: number;     // cursor-repulsion offset (screen px)
  oy: number;
  speed: number;
};

export default function HeartCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = devicePixelRatio || 1;
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    function onResize() {
      resize();
      // Reduced motion has no rAF loop, so repaint the static frame here.
      if (reduce && lutReady) drawFrame(performance.now());
    }
    addEventListener('resize', onResize);

    function F(x: number, y: number, z: number) {
      const a = x * x + 2.25 * y * y + z * z - 1;
      return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z;
    }

    /* surface radius lookup r(v,u): built once by bisection so beads can
       FLOW across the surface cheaply at runtime (magic currents).
       The full grid is ~2M evaluations of F, so it's built lazily in
       row-chunks via requestIdleCallback (setTimeout fallback) instead of
       synchronously on mount — nothing is drawn until it's ready, then the
       visual result is identical. */
    const VS = 96, US = 192, LUT = new Float32Array(VS * US);
    function surfR(dx: number, dy: number, dz: number) {
      let lo = 0, hi = -1;
      for (let r = 0.08; r <= 1.55; r += 0.06) {
        if (F(dx * r, dy * r, dz * r) > 0) { hi = r; lo = r - 0.06; break; }
      }
      if (hi < 0) return 0.9;
      for (let i = 0; i < 20; i++) {
        const m = (lo + hi) / 2;
        if (F(dx * m, dy * m, dz * m) > 0) hi = m; else lo = m;
      }
      return (lo + hi) / 2;
    }
    let zMin = Infinity, zMax = -Infinity, zMid = 0;
    let lutReady = false;
    let buildRow = 0;
    let idleId = 0;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const hasIdle = typeof window.requestIdleCallback === 'function';
    function buildRows(deadline?: IdleDeadline) {
      const BATCH = 8; // rows per slice on the setTimeout fallback
      const start = buildRow;
      while (buildRow < VS) {
        const i = buildRow;
        const v = (i + 0.5) / VS * Math.PI, sv = Math.sin(v), cv = Math.cos(v);
        for (let j = 0; j < US; j++) {
          const u = j / US * Math.PI * 2;
          const r = surfR(sv * Math.cos(u), sv * Math.sin(u), cv);
          LUT[i * US + j] = r;
          const z = r * cv;
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
        buildRow++;
        if (deadline ? deadline.timeRemaining() < 2 : buildRow - start >= BATCH) break;
      }
      if (buildRow < VS) { scheduleBuild(); return; }
      zMid = (zMin + zMax) / 2;
      lutReady = true;
      if (reduce) {
        drawFrame(performance.now()); // one static frame, no animation loop
      } else {
        raf = requestAnimationFrame(frame);
      }
    }
    function scheduleBuild() {
      if (hasIdle) idleId = window.requestIdleCallback(buildRows, { timeout: 200 });
      else timerId = setTimeout(() => buildRows(), 0);
    }
    scheduleBuild();
    function lutR(v: number, u: number) { // bilinear lookup on the grid
      const fi = Math.min(Math.max(v / Math.PI * VS - 0.5, 0), VS - 1.001);
      let fj = (u / (Math.PI * 2)) * US;
      fj = ((fj % US) + US) % US;
      const i0 = Math.floor(fi), i1 = Math.min(i0 + 1, VS - 1), ti = fi - i0;
      const j0 = Math.floor(fj), j1 = (j0 + 1) % US, tj = fj - j0;
      const a = LUT[i0 * US + j0] * (1 - tj) + LUT[i0 * US + j1] * tj;
      const b = LUT[i1 * US + j0] * (1 - tj) + LUT[i1 * US + j1] * tj;
      return a * (1 - ti) + b * ti;
    }

    const N = 2400;
    const pts: Bead[] = [];
    const GREENS = [[5, 177, 105], [62, 207, 142], [16, 200, 120], [88, 220, 160]];
    const REDS = [[224, 85, 99], [236, 64, 79], [240, 110, 120], [220, 50, 66]];
    for (let k = 0; k < N; k++) {
      const rgb = Math.random() < 0.5
        ? GREENS[Math.floor(Math.random() * GREENS.length)]
        : REDS[Math.floor(Math.random() * REDS.length)];
      pts.push({
        u: Math.random() * Math.PI * 2,
        v: Math.acos(2 * Math.random() - 1),
        seed: Math.random() * Math.PI * 2,
        drift: 0.7 + Math.random() * 0.6,
        size: 1.2 + Math.random() * 1.0,
        rgb,
        aJit: 0.65 + Math.random() * 0.7,
        ox: 0, oy: 0,
        speed: 0.8 + Math.random() * 0.6,
      });
    }

    /* heartbeat: lub-dub then rest (period 5.2s — deep, meditative pulse) */
    function beat(t: number) {
      const p = (t % 5.2) / 5.2;
      const bump = (c: number, w: number) => Math.exp(-((p - c) * (p - c)) / (w * w));
      return 1 + 0.055 * bump(0.10, 0.045) + 0.035 * bump(0.26, 0.05);
    }

    /* scroll → explosion progress 0..1 over the first 60% of a viewport */
    let prog = 0;
    function onScroll() {
      prog = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.6)));
      // No rAF loop under reduced motion — repaint so the scroll explosion
      // still tracks (a single cheap draw per scroll event).
      if (reduce && lutReady) drawFrame(performance.now());
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const ease = (p: number) => p * p * (3 - 2 * p);

    /* cursor repulsion: beads push away from the pointer and spring back */
    let mx = -9999, my = -9999;
    const parent = canvas.parentElement;
    function onPointerMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }
    function onPointerLeave() { mx = -9999; my = -9999; }
    parent?.addEventListener('pointermove', onPointerMove, { passive: true });
    parent?.addEventListener('pointerleave', onPointerLeave, { passive: true });
    const REPEL_R = 170, REPEL_STR = 85;

    const TILT = -0.18, SIN_T = Math.sin(TILT), COS_T = Math.cos(TILT);
    const t0 = performance.now();
    let raf = 0;
    function drawFrame(now: number) {
      const t = (now - t0) / 1000;
      ctx!.clearRect(0, 0, W, H);
      const th = reduce ? 0.6 : t * 0.11;      // horizontal spin (very slow)
      const c = Math.cos(th), s = Math.sin(th);
      const sc = Math.min(W, H) * 0.34;        // heart size on screen
      const bs = reduce ? 1 : beat(t);         // beat scale
      const p = ease(prog), spread = 3.2;
      const cx = W / 2, cy = H * 0.5;          // true centre of the hero
      for (const q of pts) {
        // magic currents: drift each bead along the surface via a gentle flow field
        if (!reduce && p < 0.98) {
          q.u += (0.0008 + 0.0013 * Math.sin(q.v * 2.3 + t * 0.25 + q.seed)) * q.drift;
          q.v += 0.0010 * Math.sin(q.u * 1.7 - t * 0.21 + q.seed * 2.0) * q.drift;
          if (q.v < 0.03) { q.v = 0.06 - q.v; } else if (q.v > Math.PI - 0.03) { q.v = 2 * (Math.PI - 0.03) - q.v; }
        }
        const sv = Math.sin(q.v), cv = Math.cos(q.v);
        const rr = lutR(q.v, q.u);
        const bx = rr * sv * Math.cos(q.u), by = rr * sv * Math.sin(q.u), bz = rr * cv - zMid;
        // explode: push outward along the bead's own radial
        const bm = Math.hypot(bx, by, bz) || 1;
        const px = bx + (bx / bm) * p * spread * q.speed,
              py = by + (by / bm) * p * spread * q.speed,
              pz = bz + (bz / bm) * p * spread * q.speed;
        // spin around vertical (z) axis
        const x = px * c - py * s, y = px * s + py * c, z = pz;
        // slight tilt around x for a nicer 3/4 view
        const z2 = z * COS_T - y * SIN_T, y2 = z * SIN_T + y * COS_T;
        const X0 = cx + x * sc * bs, Y0 = cy - z2 * sc * bs;
        // cursor repulsion (screen space): push away inside radius, spring back
        let tx = 0, ty = 0;
        const ddx = X0 - mx, ddy = Y0 - my, d = Math.hypot(ddx, ddy);
        if (d < REPEL_R && d > 0.001 && !reduce) {
          const f = (1 - d / REPEL_R); const fs = f * f * REPEL_STR;
          tx = (ddx / d) * fs; ty = (ddy / d) * fs;
        }
        q.ox += (tx - q.ox) * 0.14; q.oy += (ty - q.oy) * 0.14;   // spring toward target
        const X = X0 + q.ox, Y = Y0 + q.oy;
        const depth = (y2 + 1.4) / 2.8;        // 0 back → 1 front
        const alpha = (0.45 + depth * 0.35) * Math.min(q.aJit, 1.1) * (1 - p * 0.9);
        if (alpha <= 0.01) continue;
        ctx!.beginPath();
        ctx!.arc(X, Y, q.size * (0.75 + depth * 0.45), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${q.rgb[0]},${q.rgb[1]},${q.rgb[2]},${Math.min(alpha, 1)})`;
        ctx!.fill();
      }
    }
    function frame(now: number) {
      drawFrame(now);
      raf = requestAnimationFrame(frame);
    }
    // The loop (or the single reduced-motion frame) starts once the LUT
    // finishes building in buildRows().

    return () => {
      cancelAnimationFrame(raf);
      if (hasIdle && idleId) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
      removeEventListener('resize', onResize);
      removeEventListener('scroll', onScroll);
      parent?.removeEventListener('pointermove', onPointerMove);
      parent?.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      {/* veil — keeps the headline/search legible over the heart */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 44% 32% at 50% 46%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0) 100%)',
        }}
        aria-hidden="true"
      />
    </>
  );
}
