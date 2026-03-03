# Portfolio Page — Complete Redesign Plan

## Overview
Complete rewrite of `portfolio/index.html`. Delete all current sections, keep only: `<head>`, navbar (upgraded), footer, `page.js` link. Match the Serviços page design system exactly.

---

## Page Structure

```
<head> (keep + minor fixes)
<body class="bg-paper text-ink">
  .noise-overlay
  #navbar (upgraded to servicos pattern with mobile menu)
  #mobile-menu
  <main class="relative z-10 overflow-hidden">
    01 — HERO
    02 — PROJECTOS EM DESTAQUE (Timeline vertical, 3 projectos)
    03 — ARQUIVO COMPLETO (todos os 11 projectos)
    04 — CTA (Photo Dome 3D)
  </main>
  <footer> (identical to servicos)
  <script page.js>
  <script type="module"> (inline — rewrite)
```

---

## Section 1: HERO

**Visual concept:** Architectural editorial — large serif italic headline with ghost text behind, horizontal rules, technical reference marks. Different from servicos (no canvas rectangles). Instead: a subtle animated grid of thin crosshair points that drift.

**HTML Structure:**
```
section#pf-hero (min-h-screen, flex-col justify-end, bg-paper, bp-grid, relative)
  ├── .hero-ghost "Portfolio" (absolute, -webkit-text-stroke, clamp 20vw-38vw)
  ├── crosshair-mark #hero-ref-tl (absolute top-left)
  ├── crosshair-mark #hero-ref-tr (absolute top-right)
  ├── t-label row + h-lines ("01 — PORTFÓLIO")
  ├── h1 serif italic: "Do conceito" / "ao pixel."
  │   (clamp 3.5rem-14rem, translateY reveal)
  ├── p#hero-desc (mono, opacity:0 → fade in)
  ├── stats strip (3 stat blocks: 11+ Projectos | 3+ Clientes | 2+ Anos)
  └── scroll-cue (line + "Scroll")
```

**Animations:** GSAP timeline power4.out — h-lines scaleX, words translateY(110%→0%), desc fade, stats fromTo, crosshairs fade, ghost text scale+opacity.

---

## Section 2: FEATURED PROJECTS (Timeline)

**Visual concept:** Vertical timeline inspired by Aceternity Timeline, adapted to editorial vanilla HTML/GSAP. A thin vertical progress line on the left fills as user scrolls. Each project is a "chapter" with generous spacing. Mix of magazine layout and timeline structure.

**HTML Structure:**
```
section#pf-featured (padding standard, bg-paper)
  ├── t-label row + h-line ("02 — EM DESTAQUE")
  ├── h2 serif italic "Projectos Seleccionados"
  │
  └── .tl-container (relative, max-w-7xl, mx-auto)
      ├── .tl-line (absolute left, 2px wide, ink/8, full height)
      │   └── .tl-line-fill (absolute, ink, height animated via scrub)
      │
      ├── .tl-entry[0] — CRISTAL TERMINAL (biggest, most detail)
      │   ├── .tl-dot (sticky circle on the line, 12px, ink fill)
      │   ├── .tl-year "2025" (sticky, serif italic, left side)
      │   └── .tl-content (right side, pl-20)
      │       ├── t-label "01 / 03 — Terminal Financeiro"
      │       ├── h3 serif italic "Cristal Terminal" (clamp 2rem-4rem)
      │       ├── .tl-divider (1px line, ink/12)
      │       ├── p description (sans, ink/60)
      │       ├── .tl-meta: year + "Projecto Pessoal · Em desenvolvimento"
      │       ├── .tl-tags: Next.js 15, React 19, TypeScript, C++/WASM, Python, Ollama AI
      │       └── .tl-images: 2×2 grid of image placeholders (rounded-lg, shadow)
      │
      ├── .tl-entry[1] — CASA DO GI
      │   └── (same structure, less detail)
      │
      └── .tl-entry[2] — EXPOLIVE
          └── (same structure, less detail)
```

**Animations:**
- Progress line fill: GSAP ScrollTrigger scrub on `.tl-container`, animates `.tl-line-fill` height 0%→100%
- Per-entry: ScrollTrigger once, reveal-up pattern (opacity:0 y:50 → opacity:1 y:0)
- Dot: scale 0→1 on entry
- Images: slight parallax (y:40→0 on scrub)
- Ghost numbers behind each entry at ink/[0.025]

---

## Section 3: ALL PROJECTS (Archive)

**Visual concept:** Clean editorial archive table. Each project as a row with number, name, type, year. Hover reveals subtle bar + shift. Like servicos `.svc-row` pattern.

**HTML Structure:**
```
section#pf-archive (padding standard, bg-paper)
  ├── t-label row + h-line ("03 — ARQUIVO COMPLETO")
  ├── h2 serif italic "Todos os Projectos"
  │
  └── .arc-list
      └── .arc-row × 11 (border-bottom ink/7, padding, hover effects)
          ├── .arc-num (mono, 0.6rem, ink/22) "01"
          ├── .arc-title (sans, bold, clamp 1rem-1.5rem) "Cristal Terminal"
          ├── .arc-type (mono pill, 0.56rem, border ink/15) "Pessoal"
          ├── .arc-stack (hidden md:flex, mono tags) "Next.js · React · TS"
          └── .arc-year (mono, ink/40) "2025"
```

**All 11 projects in order:**
1. Cristal Terminal — Pessoal — Next.js · React · TypeScript — 2025
2. Casa do Gi — Comercial — PHP · MySQL · IfthenPay — 2025
3. Eletro 2000 v2 — Académico — Laravel · React · Gemini AI — 2025
4. Cristal Capital — Académico (PAP) — Laravel · Inertia · Docker — 2025
5. Volunta — Institucional — PHP · Laravel · MySQL — 2025
6. Estudas Comigo — Comercial — HTML · Tailwind · JS — 2024
7. GT Móvel — Comercial — HTML · CSS · JS — 2024
8. Hugo Brito — Académico — HTML · GSAP · Tailwind — 2024
9. Tec N' Cool — Institucional — HTML · CSS · JS — 2024
10. ExpoLive — Académico — PHP · MySQL · IA — 2023-25
11. Wise Wallet — Académico — PHP · Chart.js · Ollama — 2024

**Animations:** ScrollTrigger.batch `.arc-row` → staggered reveal-up. Hover: row bar expands, title translateX(10px).

---

## Section 4: CTA (Photo Dome 3D)

**Visual concept:** 3D sphere of photo tiles using CSS perspective + transforms, rotating slowly. CTA text centred over the dome. Light background with radial vignette.

**HTML Structure:**
```
section#pf-cta (relative, overflow-hidden, min-h 600px, bg-paper)
  ├── t-label "04 — PRÓXIMO PASSO"
  │
  ├── .dome-stage (absolute inset-0, perspective, place-items-center)
  │   └── .dome-sphere (transform-style preserve-3d, translateZ(-radius))
  │       └── .dome-tile × ~20 (absolute, transform: rotateY rotateX translateZ)
  │           └── img (object-cover, grayscale, rounded)
  │
  ├── radial-gradient vignette overlay (absolute, z-10)
  ├── edge blur overlay (mask-image radial-gradient)
  ├── top/bottom fade gradients
  │
  └── .cta-overlay (absolute, z-20, flex-col center)
      ├── h2 serif italic "O próximo" / "é o seu."
      ├── p mono "Cada projecto começa com uma conversa."
      └── buttons: "Iniciar projecto" (ink bg) + "Ver Serviços" (outline)
```

**JavaScript (dome sphere):**
- Fibonacci sphere: N=20 images, PHI = π(√5-1), y = 1-(i/(N-1))*2, r = √(1-y²), θ = PHI*i
- Each tile: x = cos(θ)*r, y, z = sin(θ)*r
- CSS custom properties: `--radius`, `--rot-y`, `--rot-x` per tile
- Transform: `rotateY(angle) rotateX(angle) translateZ(var(--radius))`
- Animation loop: `requestAnimationFrame` — auto-rotate rotY += 0.002, smooth lerp to mouse target
- Mouse: `mousemove` → targetRX/targetRY based on cursor position
- Radial vignette: `radial-gradient(transparent 60%, var(--color-paper) 100%)`
- Image sources: Unsplash placeholder URLs (architecture/interior shots)

---

## CSS Classes (New, page-specific)

```css
/* Timeline */
.tl-container { position: relative; }
.tl-line { position: absolute; left: 28px; top: 0; bottom: 0; width: 2px; background: rgba(18,18,18,0.08); }
.tl-line-fill { position: absolute; top: 0; left: 0; width: 100%; background: var(--color-ink); }
.tl-dot { width: 12px; height: 12px; rounded-full; bg-paper; border 2px solid ink; }
.tl-entry { padding: clamp(4rem,8vh,8rem) 0; padding-left: 5rem; }
.tl-tags .tl-tag { font-mono 0.56rem; uppercase; border pill; }
.tl-images img { rounded-lg; object-cover; shadow; }

/* Archive */
.arc-row { border-bottom: 1px solid rgba(18,18,18,0.07); padding: clamp(1.5rem,2.5vw,2.5rem) 0; }
.arc-row:hover .arc-title { transform: translateX(10px); }
.arc-row:hover .arc-bar { width: 100%; }
.arc-bar { position: absolute; bottom: -1px; left: 0; height: 1px; width: 0; bg-ink; transition: width 0.5s; }

/* Dome */
.dome-stage { perspective: calc(var(--dome-radius) * 2); perspective-origin: 50% 50%; }
.dome-sphere { transform-style: preserve-3d; will-change: transform; }
.dome-tile { position: absolute; transform-style: preserve-3d; backface-visibility: hidden; }
.dome-tile img { filter: grayscale(100%); border-radius: 8px; }
```

---

## JavaScript Functions

```
initAnimations()
  ├── heroTimeline()          — hero entrance GSAP timeline
  ├── initSectionReveals()    — ScrollTrigger.batch for .reveal-up, .reveal-fade
  ├── initTimelineProgress()  — ScrollTrigger scrub for .tl-line-fill
  ├── initTimelineEntries()   — per-entry ScrollTrigger reveals + image parallax
  ├── initArchiveRows()       — staggered row reveals
  └── initDome()              — 3D photo sphere rAF loop

// Called after page.js loader completes:
_doInit() → requestAnimationFrame → initAnimations()
```

---

## Implementation Order

1. **Head + Navbar + Footer** — Copy from servicos, adapt paths
2. **CSS base** — Shared tokens + new page-specific classes
3. **Hero section** — HTML + CSS + ghost text
4. **Featured Timeline** — HTML structure for 3 projects
5. **Archive section** — HTML for 11 project rows
6. **CTA + Dome** — HTML + dome container
7. **JS: Hero animation** — GSAP timeline
8. **JS: Section reveals** — ScrollTrigger.batch
9. **JS: Timeline progress** — ScrollTrigger scrub for line fill
10. **JS: Dome sphere** — rAF loop, fibonacci distribution, mouse interaction
11. **JS: Init pattern** — MutationObserver + fallback

---

## Key Decisions
- Timeline is scroll-triggered (NOT scroll-jacked) — much more reliable than the old panel system
- Dome uses pure CSS 3D + rAF (no GSAP for rotation — smoother)
- All content in PT-PT
- Image placeholders for now (user will replace later)
- No dark sections except footer
- Straight lines, no rounded blobs
