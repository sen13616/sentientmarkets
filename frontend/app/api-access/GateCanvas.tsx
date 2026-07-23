'use client';

import { useEffect, useRef } from 'react';

/* "Context gate" — /api-access hero, right of the content column.
   Green/red dots (stocks, colored by sentiment) drift rightward like sand
   through a sideways hourglass: the cloud compresses into a narrow neck,
   only green (bullish) dots pass through and fan back out the right side;
   reds stall at the membrane and dissolve. Sells the API use-case of a
   context gate — only bullish stocks flow on to deeper analysis. Sits
   entirely beside the hero text (never behind it). Palette and canvas
   conventions shared with HeartCanvas so the homepage and this page read
   as one system. */

type Dot = {
  x: number;
  y: number;
  green: boolean;
  pre: string;    // 'rgba(r,g,b,' — precomputed so the draw loop only appends alpha
  r: number;
  aJit: number;
  vMul: number;
  s1: number;     // wander phase seeds
  s2: number;
  off: number;    // relative slot in the shrinking funnel envelope, -1..1 —
                  // keeping this (not pulling to centerline) is what draws
                  // the hourglass silhouette
  fan: number;    // green only: post-gate fan-out angle (rad)
  dieP: number;   // red only: funnel depth where this dot dissolves —
                  // per-dot so the membrane isn't one crisp line
  dying: boolean; // red absorbed at the membrane, fading out
  fade: number;   // 0..1 alpha ramp (in at spawn, out when dying)
  ox: number;     // cursor-repulsion offset (px), springs back to 0
  oy: number;
};

const GREENS = [[5, 177, 105], [62, 207, 142], [16, 200, 120], [88, 220, 160]];
const REDS = [[224, 85, 99], [236, 64, 79], [240, 110, 120], [220, 50, 66]];

const N = 170;
const NECK_HALF = 7;
/* cursor repulsion — same feel as HeartCanvas, scaled to the smaller strip */
const REPEL_R = 120;
const REPEL_STR = 60;

export default function GateCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* geometry — recomputed on resize */
    let W = 0, H = 0, dpr = 1;
    let gateX = 0, gateY = 0, fLen = 0, fx0 = 0, V0 = 0, spread = 0;
    function resize(): boolean {
      dpr = devicePixelRatio || 1;
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      if (W === 0 || H === 0) return false; // hidden below md — nothing to run
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The canvas only spans the area right of the hero content, so the
      // fractions below are of that strip, not the whole hero.
      gateX = 0.5 * W;
      gateY = 0.5 * H;
      fLen = 0.4 * W;
      fx0 = gateX - fLen;
      V0 = W / 22;
      // Slim band around the centerline, not the full hero height.
      spread = H * 0.16;
      return true;
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    /* hourglass wall half-height at funnel progress p (0 mouth → 1 neck) */
    const env = (p: number) => lerp(spread, NECK_HALF, p * p);

    function makeDot(): Dot {
      const green = Math.random() < 0.55;
      const rgb = green
        ? GREENS[Math.floor(Math.random() * GREENS.length)]
        : REDS[Math.floor(Math.random() * REDS.length)];
      return {
        x: 0,
        y: 0,
        green,
        pre: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},`,
        r: 1.2 + Math.random() * 1.2,
        aJit: 0.65 + Math.random() * 0.45,
        vMul: 0.75 + Math.random() * 0.55,
        s1: Math.random() * Math.PI * 2,
        s2: Math.random() * Math.PI * 2,
        off: Math.random() * 2 - 1,
        fan: (Math.random() * 2 - 1) * 0.18,
        dieP: 0.55 + Math.random() * 0.25,
        dying: false,
        fade: 0,
        ox: 0,
        oy: 0,
      };
    }

    function respawn(q: Dot) {
      // Staggered re-entry depth: combined with the positional edge fade,
      // dots materialize across the entry zone instead of popping up in
      // one vertical column at the canvas edge.
      q.x = -20 - Math.random() * 0.1 * W;
      q.y = gateY + (Math.random() * 2 - 1) * spread;
      q.off = (q.y - gateY) / spread;
      q.dieP = 0.55 + Math.random() * 0.25;
      q.dying = false;
      q.fade = 0;
    }

    const dots: Dot[] = [];
    for (let k = 0; k < N; k++) dots.push(makeDot());

    /* Initial fill: the scene starts mid-flow (also the reduced-motion still
       frame, so it must tell the whole story on its own). */
    function initialFill() {
      for (const q of dots) {
        q.dying = false;
        q.fade = 1;
        const x = -40 + Math.random() * (W + 40);
        q.x = x;
        if (x >= gateX) {
          // Past the gate only greens exist, fanning out of the neck.
          if (!q.green) {
            const rgb = GREENS[Math.floor(Math.random() * GREENS.length)];
            q.green = true;
            q.pre = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},`;
          }
          q.y = gateY + Math.tan(q.fan) * (x - gateX) * 0.9;
        } else if (x >= fx0) {
          const p = (x - fx0) / fLen;
          // A few stalled reds at partial alpha near their membrane depth.
          if (!q.green && p > q.dieP) {
            q.x = fx0 + (q.dieP - 0.05 - Math.random() * 0.12) * fLen;
            q.fade = 0.4 + Math.random() * 0.4;
          }
          const pp = (q.x - fx0) / fLen;
          q.y = gateY + q.off * env(pp);
        } else {
          q.y = gateY + (Math.random() * 2 - 1) * spread;
          q.off = (q.y - gateY) / spread;
        }
      }
    }

    const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

    /* cursor repulsion: dots push away from the pointer and spring back.
       The wrapper is pointer-events-none, so listen on the hero section
       (wrap's parent) — the HeartCanvas pattern. */
    let mx = -9999, my = -9999;
    const parent = wrap.parentElement;
    function onPointerMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }
    function onPointerLeave() { mx = -9999; my = -9999; }
    if (!reduce) {
      parent?.addEventListener('pointermove', onPointerMove, { passive: true });
      parent?.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }

    const t0 = performance.now();
    function step(t: number, dt: number, q: Dot) {
      const wander =
        10 * Math.sin(0.6 * t + q.s1 + 0.008 * q.x) +
        6 * Math.sin(1.1 * t + q.s2 + 0.012 * q.y);

      if (q.dying) {
        /* dissolve in place with a little forward momentum — no backward
           drift, which read as reds "retreating" in formation */
        q.x += 5 * dt;
        q.y += wander * 0.2 * dt;
        q.fade -= dt / 0.6;
        if (q.fade <= 0) respawn(q);
        return;
      }
      if (q.fade < 1) q.fade = Math.min(1, q.fade + dt / 0.5);

      let vx: number, vy: number;
      if (q.x < fx0) {
        /* drift: fluid rightward wander inside the band */
        vx = V0 * q.vMul;
        vy = wander;
        const top = gateY - spread;
        const bot = gateY + spread;
        if (q.y < top) vy += (top - q.y) * 1.5;
        else if (q.y > bot) vy -= (q.y - bot) * 1.5;
        q.off = clamp((q.y - gateY) / spread, -1, 1);
      } else if (q.x < gateX) {
        /* funnel: each dot rides its own slot in the shrinking envelope */
        const p = (q.x - fx0) / fLen;
        vx = V0 * q.vMul * (1 + 2.2 * p * p);
        const targetY = gateY + q.off * env(p);
        vy = wander * (1 - p) * 0.6 + (targetY - q.y) * (3 + 6 * p);
        if (!q.green && p > q.dieP - 0.17) {
          /* membrane: reds slow down, then dissolve at their own per-dot
             depth (dieP) so absorption never forms one crisp line. The
             floor on the multiplier matters — decaying to zero before the
             death threshold would stall reds forever without respawning. */
          vx *= Math.max(0.12, 1 - (p - (q.dieP - 0.17)) / 0.2);
          if (p >= q.dieP) q.dying = true;
        }
      } else {
        /* jet out of the neck, decaying to cruise while fanning out */
        const qq = Math.min(1, (q.x - gateX) / (0.1 * W));
        const eo = 1 - (1 - qq) * (1 - qq);
        const v = lerp(3.2 * V0, 1.4 * V0, eo) * q.vMul;
        const ang = q.fan * eo;
        vx = v * Math.cos(ang);
        vy = v * Math.sin(ang) + wander * 0.4 * qq;
      }
      q.x += vx * dt;
      q.y += vy * dt;
      if (q.x > W + 8) respawn(q);
    }

    function drawFrame(now: number) {
      const t = (now - t0) / 1000;
      ctx!.clearRect(0, 0, W, H);
      const inZone = 0.14 * W;  // positional fade-in across the entry zone
      const outZone = 0.08 * W; // and fade-out approaching the right edge
      for (const q of dots) {
        if (q.fade <= 0.01) continue;
        const edgeIn = clamp(q.x / inZone, 0, 1);
        const edgeOut = clamp((W - q.x) / outZone, 0, 1);
        const alpha = Math.min(0.95, q.aJit * q.fade) * edgeIn * edgeOut;
        if (alpha <= 0.01) continue;
        /* repulsion: push away inside the radius, spring back outside */
        let tx = 0, ty = 0;
        const ddx = q.x - mx, ddy = q.y - my;
        const d = Math.hypot(ddx, ddy);
        if (d < REPEL_R && d > 0.001 && !reduce) {
          const f = 1 - d / REPEL_R;
          const fs = f * f * REPEL_STR;
          tx = (ddx / d) * fs;
          ty = (ddy / d) * fs;
        }
        q.ox += (tx - q.ox) * 0.14;
        q.oy += (ty - q.oy) * 0.14;
        ctx!.beginPath();
        ctx!.arc(q.x + q.ox, q.y + q.oy, q.r, 0, Math.PI * 2);
        ctx!.fillStyle = q.pre + alpha + ')';
        ctx!.fill();
      }
    }

    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - t0) / 1000;
      for (const q of dots) step(t, dt, q);
      drawFrame(now);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    let started = resize();
    if (started) {
      initialFill();
      if (reduce) drawFrame(performance.now());
      else if (visible) start();
    }
    function onResize() {
      const ok = resize();
      if (!ok) {
        stop();
        started = false;
        return;
      }
      if (!started) {
        // First time the canvas gains size (e.g. rotate past the md breakpoint).
        initialFill();
        started = true;
      }
      if (reduce) drawFrame(performance.now());
      else if (visible) start();
    }
    // Observe the element, not the window: the hero reflows without a window
    // resize (demo-key card popping in, fonts, hydration settling the 55%
    // strip), and a stale backing store gets CSS-squashed — the dots render
    // horizontally compressed.
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    /* pause the loop while the hero is scrolled offscreen */
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible && started) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      parent?.removeEventListener('pointermove', onPointerMove);
      parent?.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      // Starts just right of the hero content column (max-w-xl ≈ 53% of the
      // 1200px container) — the animation sits beside the text, never behind.
      className="absolute inset-y-0 left-[55%] right-0 z-0 hidden md:block pointer-events-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
