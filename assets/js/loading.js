export function initLoader(onComplete) {
  const isHome = !!document.getElementById('canvas-container');
  const SHOW_MS = 2800;
  const MORPH_MS = 1000;

  // ── Styles ───────────────────
  const style = document.createElement('style');
  style.id = '_ldr-style';
  style.textContent = `
    #_ldr {
      position: fixed; inset: 0; z-index: 99999;
      background: #EBE9E4;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      visibility: visible !important;
      
      /* STARTING STATE */
      --origin-x: 50%;
      --origin-y: 50%;
      clip-path: circle(0% at var(--origin-x) var(--origin-y)); 
      opacity: 0;
      
      /* Will transition both in and out */
      transition: clip-path cubic-bezier(0.85, 0, 0.15, 1) ${MORPH_MS * 0.8}ms, 
                  opacity cubic-bezier(0.85, 0, 0.15, 1) ${MORPH_MS * 0.8}ms, 
                  background-color cubic-bezier(0.85, 0, 0.15, 1) ${MORPH_MS}ms;
    }
    
    /* When active, it opens up entirely */
    #_ldr.morph-in {
      clip-path: circle(150% at var(--origin-x) var(--origin-y));
      opacity: 1;
    }
    
    /* When exiting, it closes down and darkens exactly to the cursor */
    #_ldr.morph-out {
      clip-path: circle(0% at var(--origin-x) var(--origin-y));
      opacity: 1; /* Opaque while it shrinks into the cursor hole */
      background-color: #121212; /* Darkens before revealing the page underneath */
    }

    #_ldr canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      opacity: 0.15;
      transition: opacity 0.5s ease;
    }
    
    #_ldr.morph-out canvas, #_ldr.morph-out .content-wrapper,
    #_ldr:not(.morph-in) .content-wrapper {
        opacity: 0;
    }
    
    .content-wrapper {
        position: relative; z-index: 10;
        display: flex; flex-direction: column; align-items: center;
        transition: opacity 0.6s ease 0.2s, transform 0.8s cubic-bezier(0.85, 0, 0.15, 1) 0.1s;
        /* Start slightly scaled down for the entry pop */
        transform: translateY(20px) scale(0.95);
    }
    
    #_ldr.morph-in .content-wrapper {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    
    #_ldr.morph-out .content-wrapper {
        transform: translateY(-40px) scale(0.9);
        opacity: 0;
        transition-delay: 0s; /* Exiting is fast */
    }

    .ldr-dot { opacity: 0; animation: ldr-blink 1.4s infinite; display: inline-block; }
    .ldr-dot:nth-child(1) { animation-delay: 0s; }
    .ldr-dot:nth-child(2) { animation-delay: 0.25s; }
    .ldr-dot:nth-child(3) { animation-delay: 0.5s; }
    @keyframes ldr-blink {
      0%, 100% { opacity: 0; transform: translateY(0); }
      30%, 70% { opacity: 1; transform: translateY(-1px); }
    }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────
  const loader = document.createElement('div');
  loader.id = '_ldr';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = `
    <canvas></canvas>
    <div class="content-wrapper">
        <svg viewBox="0 0 40 40" fill="none" class="w-10 h-10 mb-8 text-[#121212] opacity-80" style="animation: pulse 3s infinite alternate;">
            <path d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3Z" stroke="currentColor" stroke-width="1.5" />
            <path d="M20 10L28 14.5V23.5L20 28L12 23.5V14.5L20 10Z" stroke="currentColor" stroke-width="0.7" opacity="0.4" />
            <circle cx="20" cy="19" r="1.5" fill="currentColor"/>
        </svg>
        <div class="flex items-baseline font-mono tracking-[0.25em] uppercase text-[10px] md:text-xs text-[#121212]">
            <span>A carregar</span>
            <span class="flex items-baseline ml-1 w-6">
                <span class="ldr-dot">.</span>
                <span class="ldr-dot">.</span>
                <span class="ldr-dot">.</span>
            </span>
        </div>
    </div>
  `;
  document.body.prepend(loader);
  // Attempt to recover the last click position of the Custom Cursor before the navigation happened
  const exitX = sessionStorage.getItem('morphExitX');
  const exitY = sessionStorage.getItem('morphExitY');

  if (exitX !== null) loader.style.setProperty('--origin-x', `${exitX}px`);
  if (exitY !== null) loader.style.setProperty('--origin-y', `${exitY}px`);

  // Trigger entry animation !
  setTimeout(() => {
    loader.classList.add('morph-in');
  }, 10);

  // ── Wave / Topography ANIMATION LOGIC ──────────────────────────────
  const canvas = loader.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    // Scale down resolution slightly to ensure butter smooth 60fps on mobile
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const points = [];
  const lines = 18;
  const segments = 60;

  let rafId = null, running = true, time = 0;

  function draw() {
    if (!running) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const centerY = h / 2;
    const stepX = w / segments;

    time += 0.008; // speed of waves

    ctx.lineWidth = 1 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw wireframe waves (Simulating 3D plane distortion / Topography)
    for (let i = 0; i < lines; i++) {
      ctx.beginPath();

      // Calculate dynamic opacity based on depth (i)
      const depthOpacity = 1 - (i / lines);
      ctx.strokeStyle = `rgba(18, 18, 18, ${depthOpacity * 0.7})`;

      const yOffset = (i - lines / 2) * (h * 0.04);

      for (let j = 0; j <= segments; j++) {
        const x = j * stepX;

        // Complex wave math combining sine/cosine at different frequencies
        // to create an organic, unpredictable terrain feel
        const noise = Math.sin(x * 0.003 + time + i * 0.2) *
          Math.cos(x * 0.008 - time * 0.8) *
          Math.sin(j * 0.1 - time * 1.2 + i * 0.1);

        // Amplitude falls off near edges using a rough bell curve
        const edgeFalloff = Math.sin((j / segments) * Math.PI);
        const amplitude = (h * 0.15) * edgeFalloff * (1 - depthOpacity * 0.5);

        const y = centerY + yOffset + (noise * amplitude);

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);

  // ── Morph Exit ──────────────────────────────────────────────────────────────────
  const tExit = setTimeout(() => {
    // 1. Get the current physical coordinates of the cursor (From the running global tracker inside ring memory!)
    const exitRing = document.querySelector('.cursor-ring');
    let outX = '50%';
    let outY = '50%';

    // Attempt to extract the transform matrix to know where the active circle loop currently is
    if (exitRing) {
      const matrix = window.getComputedStyle(exitRing).transform;
      if (matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        outX = values[4] + 'px';
        outY = values[5] + 'px';
      }
    }

    // Save this new coordinate for the *Next* page load to blossom from!
    sessionStorage.setItem('morphExitX', parseFloat(outX) || window.innerWidth / 2);
    sessionStorage.setItem('morphExitY', parseFloat(outY) || window.innerHeight / 2);

    // 2. Trigger morph animation dynamically shrinking back to the Mouse Ball coordinates
    loader.style.setProperty('--origin-x', outX);
    loader.style.setProperty('--origin-y', outY);
    loader.classList.remove('morph-in');
    loader.classList.add('morph-out');

    // We make sure the custom dots jump to position quickly instead of dragging
    const activeDot = document.querySelector('.cursor-dot');
    if (activeDot) activeDot.style.opacity = '1';
    if (exitRing) exitRing.style.opacity = '1';

    // 3. Call onComplete halfway through the morph so elements underneath
    //    can start animating in *while* the circle closes
    const tReveal = setTimeout(() => onComplete(), MORPH_MS * 0.4);

    // 4. Cleanup fully after morph finishes
    setTimeout(() => {
      running = false;
      cancelAnimationFrame(rafId);
      clearTimeout(tReveal);
      window.removeEventListener('resize', resize);
      loader.remove();
      style.remove();
    }, MORPH_MS);
  }, SHOW_MS);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    clearTimeout(tExit);
    window.removeEventListener('resize', resize);
    loader.remove();
    style.remove();
    onComplete();
  };
}

// ── Global Effects: Custom Cursor & Seamless Page Exit Morph Loop ─────────
export function initGlobalEffects() {
  // 1. Inject Cursor Styles (if not matching mobile)
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const style = document.createElement('style');
  style.id = 'cursor-style';
  style.textContent = `
    .cursor-dot, .cursor-ring {
      position: fixed;
      top: 0; left: 0;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99998; /* Under the Loading Screen, waiting to be revealed as it shrinks! */
      will-change: transform;
      mix-blend-mode: difference;
      transition: width 0.3s ease, height 0.3s ease,
                  background 0.3s ease, border-color 0.3s ease;
    }
    .cursor-dot {
      width: 8px; height: 8px;
      background: #ffffff;
      margin-top: -4px; margin-left: -4px;
    }
    .cursor-ring {
      width: 40px; height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      margin-top: -20px; margin-left: -20px;
    }
    .cursor-ring.cursor-expand {
      width: 64px; height: 64px;
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.6);
      margin-top: -32px; margin-left: -32px;
    }
    
    /* The Loop Exit Transition */
    .cursor-ring.morph-loop-exit {
      width: 250vw; height: 250vw;
      margin-top: -125vw; margin-left: -125vw;
      background: #EBE9E4; /* Changes to paper to match the loading screen background */
      border-width: 0;
      opacity: 1;
      transition: width 0.8s cubic-bezier(0.85, 0, 0.15, 1), 
                  height 0.8s cubic-bezier(0.85, 0, 0.15, 1), 
                  margin 0.8s cubic-bezier(0.85, 0, 0.15, 1),
                  background 0.3s ease;
      z-index: 100000;
    }
    .cursor-dot.morph-loop-exit {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  // 2. Inject Elements OR Select Existing ones
  let dot = document.querySelector('.cursor-dot');
  let ring = document.querySelector('.cursor-ring');

  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
  }

  if (!ring) {
    ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);
  }

  // 3. Logic
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let dx = mx, dy = my;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  function animCursor() {
    dx += (mx - dx) * 0.14;
    dy += (my - dy) * 0.14;
    rx += (mx - rx) * 0.55;
    ry += (my - ry) * 0.55;

    dot.style.transform = `translate(${rx}px, ${ry}px)`;
    ring.style.transform = `translate(${dx}px, ${dy}px)`;

    requestAnimationFrame(animCursor);
  }
  animCursor();

  // 4. Hover States
  const attachHovers = () => {
    document.querySelectorAll('a, button, [data-cursor-expand]').forEach(el => {
      // Remove to avoid duplicates just in case
      el.removeEventListener('mouseenter', () => ring.classList.add('cursor-expand'));
      el.removeEventListener('mouseleave', () => ring.classList.remove('cursor-expand'));

      el.addEventListener('mouseenter', () => ring.classList.add('cursor-expand'));
      el.addEventListener('mouseleave', () => ring.classList.remove('cursor-expand'));
    });
  }

  // Run on mount and allow mutation if needed (lazy load fix)
  attachHovers();
  setTimeout(attachHovers, 2000);

  // 5. Page Transition Interception (The Loop!)
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      // If valid internal page navigation (not anchor link or external)
      if (href && href.startsWith('/') && !href.startsWith('#') || (link.hostname === window.location.hostname && href !== '#')) {
        // Only trigger if we're actually changing pages
        if (link.pathname === window.location.pathname) return;

        e.preventDefault();

        // Lock the cursor position globally
        const mxFixed = e.clientX;
        const myFixed = e.clientY;

        // Remember it for the next page so the loader expands from exactly the same physical pixel
        sessionStorage.setItem('morphExitX', mxFixed);
        sessionStorage.setItem('morphExitY', myFixed);

        // Trigger the explosion of the ring! (Doesn't transform away its translation, just scales wildly)
        ring.classList.add('morph-loop-exit');
        dot.classList.add('morph-loop-exit');

        // Allow time for the circle to cover the screen before redirecting
        setTimeout(() => {
          window.location.href = href;
        }, 800);
      }
    });
  });
}
