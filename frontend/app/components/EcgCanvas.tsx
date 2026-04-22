'use client';

import { useRef, useEffect } from 'react';

const GREEN: [number, number, number] = [74, 250, 138];
const RED:   [number, number, number] = [255, 92, 92];

// [yFraction, phaseOffset, speed, color, lineWidth, alpha, beats]
type LineDef = [number, number, number, [number, number, number], number, number, number];

const LINE_DEFS: LineDef[] = [
  [.22, .0,  .18, GREEN, 1.0, .28, 1.8],
  [.38, .3,  .14, RED,   1.4, .45, 2.2],
  [.55, .6,  .20, GREEN,  .8, .22, 1.5],
  [.70, .15, .16, RED,   1.1, .18, 2.6],
  [.84, .75, .13, GREEN,  .6, .12, 1.2],
  [.12, .42, .09, RED,    .5, .08, 3.0],
  [.48, .8,  .11, GREEN,  .5, .08, 2.8],
  [.62, .25, .10, RED,    .5, .07, 1.9],
  [.92, .55, .12, GREEN,  .4, .06, 2.4],
];

function lerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function ecgY(phase: number): number {
  phase = ((phase % 1) + 1) % 1;
  let y = 0;
  const p1 = (phase - .12) / .06;
  const p2 = (phase - .25) / .018;
  const p3 = (phase - .28) / .015;
  const p4 = (phase - .31) / .018;
  const p5 = (phase - .46) / .07;
  y += .12 * Math.exp(-(p1 * p1));
  y -= .18 * Math.exp(-(p2 * p2));
  y += 1.0 * Math.exp(-(p3 * p3));
  y -= .22 * Math.exp(-(p4 * p4));
  y += .28 * Math.exp(-(p5 * p5));
  return y;
}

export default function EcgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let time = 0, lastTs = 0;
    let mX = -1, mY = -1, smX = -1, smY = -1;
    let rafId = 0;

    // Per-line mutable state
    const lineState = LINE_DEFS.map(([,,, initialColor], i) => ({
      color:        [...initialColor] as [number, number, number],
      isGreen:      i % 2 === 0,
      nextFlip:     2 + Math.random() * 10,
      flipping:     false,
      flipProgress: 0,
      fromColor:    [...initialColor] as [number, number, number],
      toColor:      [...initialColor] as [number, number, number],
    }));

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function onMouseMove(e: MouseEvent) { mX = e.clientX; mY = e.clientY; }
    window.addEventListener('mousemove', onMouseMove);

    function tickColors(dt: number) {
      lineState.forEach(s => {
        s.nextFlip -= dt;
        if (s.nextFlip <= 0 && !s.flipping) {
          s.flipping     = true;
          s.flipProgress = 0;
          s.fromColor    = [...s.color]  as [number, number, number];
          s.toColor      = s.isGreen ? [...RED] : [...GREEN] as [number, number, number];
        }
        if (s.flipping) {
          s.flipProgress = Math.min(1, s.flipProgress + dt * 1.2);
          s.color = lerp(s.fromColor, s.toColor, s.flipProgress);
          if (s.flipProgress >= 1) {
            s.flipping  = false;
            s.isGreen   = !s.isGreen;
            s.nextFlip  = 4 + Math.random() * 12;
          }
        }
      });
    }

    function drawLine(
      yC: number, phOff: number, spd: number,
      color: [number, number, number], lw: number, alpha: number, beats: number,
      inf: number, cPhase: number,
    ) {
      ctx.beginPath();
      ctx.lineWidth  = lw;
      ctx.lineCap    = 'round';
      ctx.lineJoin   = 'round';
      const steps = W * 1.2;
      for (let i = 0; i <= steps; i++) {
        const xR    = (i / steps) * W;
        const nX    = xR / W;
        const phase = ((nX * beats - time * spd + phOff) % 1 + 1) % 1;
        let y = ecgY(phase);
        if (inf > 0) {
          const d    = Math.abs(phase - cPhase);
          const prox = Math.exp(-d * d * 80);
          const w    = inf * prox;
          const dN   = (phase - cPhase) / .025;
          y += w * .6  * Math.sin(phase * 180 + time * 3.2);
          y += w * .35 * Math.cos(phase * 360 + time * 5.1);
          y += w * .5  * Math.exp(-(dN * dN));
        }
        const yP = yC + y * 58;
        i === 0 ? ctx.moveTo(xR, yP) : ctx.lineTo(xR, yP);
      }
      const [r, g, b] = color;
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${alpha * .28})`);
      grd.addColorStop(.46, `rgba(${r},${g},${b},${alpha * .5})`);
      grd.addColorStop(.54, `rgba(${r},${g},${b},${alpha * .72})`);
      grd.addColorStop(1,   `rgba(${r},${g},${b},${alpha * 1.4})`);
      ctx.strokeStyle = grd;
      ctx.stroke();
    }

    function frame(ts: number) {
      const dt = Math.min((ts - lastTs) / 1000, .1);
      lastTs = ts;
      time   = ts * .001;

      if (smX < 0) { smX = mX; smY = mY; }
      smX += (mX - smX) * .06;
      smY += (mY - smY) * .06;

      tickColors(dt);
      ctx.clearRect(0, 0, W, H);

      const mxN = smX > 0 ? smX / W : -1;
      const inf  = mxN > .38 ? Math.min(1, (mxN - .38) / .4 * 1.2) : 0;
      const cP   = mxN > 0 ? (mxN * 2.2) % 1 : .5;

      LINE_DEFS.forEach(([yF, ph, sp,, lw, al, bt], i) => {
        const yC = H * yF;
        const yd = Math.abs(yC - smY) / H;
        drawLine(yC, ph, sp, lineState[i].color, lw, al, bt, inf * Math.exp(-yd * yd * 18), cP);
      });

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      {/* ECG waveform canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Blur veil — covers left 62%, fades to transparent on the right */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          width: '62%',
          backdropFilter: 'blur(14px) saturate(0.6)',
          WebkitBackdropFilter: 'blur(14px) saturate(0.6)',
          maskImage: 'linear-gradient(to right, black 0%, black 42%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 42%, transparent 100%)',
        }}
      />

      {/* Color veil — darkens left side so hero text reads clearly */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'linear-gradient(to right, rgba(10,10,11,.84) 0%, rgba(10,10,11,.7) 30%, rgba(10,10,11,.32) 52%, transparent 68%)',
        }}
      />
    </>
  );
}
