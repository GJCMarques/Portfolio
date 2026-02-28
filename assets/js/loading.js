/**
 * Monrion — Loading Screen
 *
 * Canvas 2D + requestAnimationFrame — GPU-composited, always smooth.
 *
 * Replicates the BackgroundPaths React component faithfully:
 *   pathLength  : 0.3   → visible segment = 30% of path
 *   pathOffset  : [0,1,0] → triangle wave, segment travels forward then back
 *   opacity     : [0.3,0.6,0.3] → element opacity triangle wave
 *   strokeOpacity: 0.1 + i*0.03 → per-path base opacity (fixed)
 *   36 paths × 2 sides = 72 total
 *
 * SVG stroke-dashoffset is NOT GPU-composited → causes jank with 72 paths.
 * Canvas clearRect + stroke IS composited → always 60 fps.
 */

export function initLoader(onComplete) {
  const SHOW_MS   = 1880;   // 20 ms after 3rd dot fills (1400+180+280+20)
  const FADE_MS   = 700;
  const REVEAL_MS = 250;

  // ── Styles (dot animation only — Canvas handles paths) ───────────────────
  const style = document.createElement('style');
  style.id = '_ldr-style';
  style.textContent = `
    #_ldr {
      position: fixed; inset: 0; z-index: 99999;
      background: #EBE9E4;
      display: flex; align-items: center; justify-content: center;
      visibility: visible !important;
      opacity: 1;
    }
    #_ldr canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    }
    @keyframes _ldr-draw {
      from { stroke-dashoffset: var(--c, 15.71); }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes _ldr-fill {
      from { fill: transparent; }
      to   { fill: rgba(18,18,18,0.52); }
    }
    #_ldr .ld {
      --c: 15.71;
      stroke-dasharray: var(--c) var(--c);
      stroke-dashoffset: var(--c);
      fill: transparent;
    }
    #_ldr .ld.on {
      animation:
        _ldr-draw 0.42s cubic-bezier(0.4, 0, 0.2, 1) forwards,
        _ldr-fill 0.28s 0.18s ease forwards;
    }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────
  const loader = document.createElement('div');
  loader.id = '_ldr';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = `
    <canvas></canvas>
    <div style="position:relative;z-index:10;display:flex;align-items:center;gap:0.65rem;">
      <span style="
        font-family:'IBM Plex Mono',monospace;
        font-size:clamp(0.58rem,1vw,0.75rem);
        letter-spacing:0.35em;text-transform:uppercase;
        color:rgba(18,18,18,0.48);white-space:nowrap;user-select:none;
      ">A Carregar</span>
      <svg width="42" height="10" viewBox="0 0 42 10" fill="none" overflow="visible" aria-label="a carregar">
        <circle id="ld1" class="ld" cx="5"  cy="5" r="2.5"
          stroke="rgba(18,18,18,0.52)" stroke-width="1.5" stroke-linecap="round"/>
        <circle id="ld2" class="ld" cx="21" cy="5" r="2.5"
          stroke="rgba(18,18,18,0.52)" stroke-width="1.5" stroke-linecap="round"/>
        <circle id="ld3" class="ld" cx="37" cy="5" r="2.5"
          stroke="rgba(18,18,18,0.52)" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
  `;
  document.body.prepend(loader);

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvas = loader.querySelector('canvas');
  const ctx    = canvas.getContext('2d');
  let   dpr    = window.devicePixelRatio || 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── Paths — identical formula to React FloatingPaths × 2 ─────────────────
  const VBW = 696, VBH = 316;
  const paths = [];

  for (const pos of [1, -1]) {
    for (let i = 0; i < 36; i++) {
      paths.push({
        // Segment A: M(x0,y0) C(x0,y0)(xc1,y1)(xe1,ye1)
        x0:  -(380 - i * 5 * pos),  y0:  -(189 + i * 6),
        xc1: -(312 - i * 5 * pos),  y1:   216 - i * 6,
        xe1:  152 - i * 5 * pos,    ye1:  343 - i * 6,
        // Segment B: C(xc2,y2)(xe2,ye2)(xe2,ye2)
        xc2:  616 - i * 5 * pos,    y2:   470 - i * 6,
        xe2:  684 - i * 5 * pos,    ye2:  875 - i * 6,
        // strokeOpacity={0.1 + path.id * 0.03} from React component
        strokeOpacity: Math.min(0.1 + i * 0.03, 1),
        width:  0.5 + i * 0.03,
        // duration: 20 + Math.random() * 10  (seconds)
        period: 20 + Math.random() * 10,
        phase:  Math.random(),
      });
    }
  }

  // ── Bezier evaluation ─────────────────────────────────────────────────────
  function cubic(p0, c1, c2, p1, t) {
    const m = 1 - t;
    return m*m*m*p0 + 3*m*m*t*c1 + 3*m*t*t*c2 + t*t*t*p1;
  }

  // Point along the compound 2-segment path, parameter t ∈ [0, 1] (split 50/50)
  function pt(p, t) {
    if (t <= 0.5) {
      const u = t * 2;
      return [cubic(p.x0, p.x0, p.xc1, p.xe1, u),
              cubic(p.y0, p.y0, p.y1,  p.ye1, u)];
    }
    const u = (t - 0.5) * 2;
    return [cubic(p.xe1, p.xc2, p.xe2, p.xe2, u),
            cubic(p.ye1, p.y2,  p.ye2, p.ye2, u)];
  }

  // ── Render loop ───────────────────────────────────────────────────────────
  const SEG   = 0.30;   // pathLength: 0.3 — visible segment fraction
  const STEPS = 32;     // polyline resolution

  let rafId = null, running = true, t0 = null;

  function draw(now) {
    if (!running) return;
    if (t0 === null) t0 = now;
    const elapsed = (now - t0) / 1000;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Apply DPR + xMidYMid-slice viewport transform
    const scl = Math.max(W / VBW, H / VBH);
    const ox  = (W - VBW * scl) / 2;
    const oy  = (H - VBH * scl) / 2;
    ctx.setTransform(dpr * scl, 0, 0, dpr * scl, dpr * ox, dpr * oy);
    ctx.clearRect(-ox / scl, -oy / scl, W / scl, H / scl);

    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    for (const p of paths) {
      // Triangle wave 0→1→0  (matches pathOffset: [0, 1, 0], linear)
      const cycle = ((elapsed / p.period) + p.phase) % 1;
      const wave  = cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;

      // Element opacity [0.3, 0.6, 0.3]  (matches opacity: [0.3, 0.6, 0.3])
      const eOp = 0.3 + 0.3 * wave;

      // Segment position along path — same clipping as stroke-dashoffset/array
      const tS = wave;
      const tE = Math.min(tS + SEG, 1.0);
      if (tE <= tS) continue;

      // Effective alpha = per-path strokeOpacity × animated element opacity
      const alpha = p.strokeOpacity * eOp;

      ctx.beginPath();
      let first = true;
      for (let s = 0; s <= STEPS; s++) {
        const [vx, vy] = pt(p, tS + (s / STEPS) * (tE - tS));
        if (first) { ctx.moveTo(vx, vy); first = false; }
        else        ctx.lineTo(vx, vy);
      }
      ctx.strokeStyle = `rgba(15,23,42,${alpha.toFixed(3)})`;
      ctx.lineWidth   = p.width;
      ctx.stroke();
    }

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);

  // ── Dot sequencing ────────────────────────────────────────────────────────
  const d1 = loader.querySelector('#ld1');
  const d2 = loader.querySelector('#ld2');
  const d3 = loader.querySelector('#ld3');

  const t1 = setTimeout(() => d1?.classList.add('on'), 500);
  const t2 = setTimeout(() => d2?.classList.add('on'), 950);
  const t3 = setTimeout(() => d3?.classList.add('on'), 1400);

  // ── Exit ──────────────────────────────────────────────────────────────────
  const tExit = setTimeout(() => {
    loader.style.transition = `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    loader.style.opacity    = '0';

    const tReveal = setTimeout(() => onComplete(), REVEAL_MS);

    setTimeout(() => {
      running = false;
      cancelAnimationFrame(rafId);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(tReveal);
      window.removeEventListener('resize', resize);
      loader.remove();
      style.remove();
    }, FADE_MS);
  }, SHOW_MS);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    clearTimeout(tExit);
    window.removeEventListener('resize', resize);
    loader.remove();
    style.remove();
    onComplete();
  };
}
