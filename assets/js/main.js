import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { createIcons, Menu, X, ArrowRight, Microscope, Activity, Sprout, Mail, Phone, Instagram, Linkedin, MapPin, Clock } from 'lucide';
import { initGlobe } from './globe.js';
import { initLoader, initGlobalEffects } from './loading.js';

gsap.registerPlugin(ScrollTrigger);

// ── Icons ────────────────────────────────────────────────────────
createIcons({
  icons: { Menu, X, ArrowRight, Microscope, Activity, Sprout, Mail, Phone, Instagram, Linkedin, MapPin, Clock }
});

// ── Global Custom Cursor and Morph Leave Transition ───────────────
initGlobalEffects();

// --- Navbar Logic ---
const navbar = document.getElementById("navbar");
const menuBtn = document.getElementById("menu-btn");
const closeMenuBtn = document.getElementById("close-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

window.addEventListener("scroll", () => {
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }
});

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("translate-y-full");
  });
}

if (closeMenuBtn) {
  closeMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.add("translate-y-full");
  });
}

// --- Navbar Award-Winning Cinematic Hover (Individual Minimal Esquadrias) ---
const navContainer = document.querySelector("#navbar .md\\:flex.absolute");
if (navContainer) {
  // Override the previous hover CSS lines securely for layout and pure CSS dims
  const styleOverride = document.createElement("style");
  styleOverride.innerHTML = `
    #navbar .md\\:flex.absolute { z-index: 30 !important; }
    #navbar .md\\:flex.absolute .nav-link::before,
    #navbar .md\\:flex.absolute .nav-link::after { display: none !important; }
    #navbar .md\\:flex.absolute .nav-link { 
      position: relative; z-index: 10; 
      padding: 6px 14px;
      margin: 0;
      transition: opacity 0.4s ease; 
      display: inline-block; 
    }
    /* Pure CSS Dimming - flawless tracking */
    #navbar .md\\:flex.absolute:hover .nav-link { opacity: 0.35; }
    #navbar .md\\:flex.absolute .nav-link:hover,
    #navbar .md\\:flex.absolute .nav-link.active-page { opacity: 1 !important; }
  `;
  document.head.appendChild(styleOverride);

  const navLinks = Array.from(navContainer.querySelectorAll(".nav-link"));

  // Determine current page link based on URL
  const currentPathSegment = location.pathname.split("/").filter(Boolean)[0] ?? "";

  navLinks.forEach((link) => {
    const isCurrentPage = (() => {
      const hrefSeg = link.getAttribute("href").split("/").filter(Boolean)[0] ?? "";
      return hrefSeg === currentPathSegment;
    })();

    // Localized frame bound tightly to each individual link
    const frame = document.createElement("div");
    frame.className = "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-0 w-0 h-0";
    frame.innerHTML = `
      <!-- Top Left Esquadria -->
      <div class="bp-mark absolute left-0 top-0 w-[8px] h-[1px] bg-ink opacity-40 origin-left"></div>
      <div class="bp-mark absolute left-0 top-0 w-[1px] h-[8px] bg-ink opacity-40 origin-top"></div>
      
      <!-- Bottom Right Esquadria -->
      <div class="bp-mark absolute right-0 bottom-0 w-[8px] h-[1px] bg-ink opacity-40 origin-right"></div>
      <div class="bp-mark absolute right-0 bottom-0 w-[1px] h-[8px] bg-ink opacity-40 origin-bottom"></div>

      ${isCurrentPage ? `
      <!-- Opposing Dots (Balance) ONLY for Active Page -->
      <div class="bp-dot absolute right-[1px] top-[1px] w-[2.5px] h-[2.5px] bg-ink opacity-40 origin-center rounded-full"></div>
      <div class="bp-dot absolute left-[1px] bottom-[1px] w-[2.5px] h-[2.5px] bg-ink opacity-40 origin-center rounded-full"></div>
      ` : ""}
    `;
    link.appendChild(frame);

    // Active state representation
    if (isCurrentPage) {
      link.classList.add("active-page");
      gsap.set(frame, { opacity: 1, width: "100%", height: "100%" });
      // Intro pulse
      gsap.to(frame.querySelectorAll(".bp-mark, .bp-dot"), {
        scale: 1.5,
        duration: 0.4,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }

    // Safe individual hover interactions
    link.addEventListener("mouseenter", () => {
      // Expand the box from the center outwards with authority
      gsap.to(frame, {
        opacity: 1,
        width: "100%",
        height: "100%",
        duration: 0.4,
        ease: "expo.out",
        overwrite: "auto",
      });

      // Snappy "Elastic" Detail around the edges during travel
      gsap.to(frame.querySelectorAll(".bp-mark, .bp-dot"), {
        scale: 2,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    link.addEventListener("mouseleave", () => {
      if (isCurrentPage) {
        // Restore to active state gracefully
        gsap.to(frame, {
          opacity: 1,
          width: "100%",
          height: "100%",
          duration: 0.4,
          ease: "expo.out",
          overwrite: "auto",
        });
        gsap.to(frame.querySelectorAll(".bp-mark, .bp-dot"), {
          scale: 1,
          duration: 0.3,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      } else {
        // Shrink back to center
        gsap.to(frame, {
          opacity: 0,
          width: "0%",
          height: "0%",
          duration: 0.35,
          ease: "power2.inOut",
          overwrite: "auto",
        });
        gsap.to(frame.querySelectorAll(".bp-mark, .bp-dot"), {
          scale: 1,
          duration: 0.3,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      }
    });
  });
}

// --- Three.js Shader Animation ---
const initShader = () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const vertexShader = `
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
  `;

  const fragmentShader = `
    #define TWO_PI 6.2831853072
    #define PI 3.14159265359

    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    void main(void) {
      vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
      float t = time*0.05;
      float lineWidth = 0.002;

      // Technicolor / Vibrant Palette for contrast against B&W UI
      // Cyan, Magenta, Yellow, Red
      vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
      vec3 color2 = vec3(1.0, 0.0, 1.0); // Magenta
      vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
      
      vec3 color = vec3(0.92, 0.91, 0.89); // Paper background base

      for(int j = 0; j < 3; j++){
        for(int i=0; i < 5; i++){
          float d = abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          float intensity = lineWidth*float(i*i) / d;
          
          if (mod(float(j), 3.0) == 0.0) {
             color -= (1.0 - color1) * intensity * 0.8; 
          } else if (mod(float(j), 3.0) == 1.0) {
             color -= (1.0 - color2) * intensity * 0.8;
          } else {
             color -= (1.0 - color3) * intensity * 0.8;
          }
        }
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const camera = new THREE.Camera();
  camera.position.z = 1;

  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);

  const uniforms = {
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const onWindowResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    uniforms.resolution.value.x = renderer.domElement.width;
    uniforms.resolution.value.y = renderer.domElement.height;
  };

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);

  let shaderVisible = true;
  const heroEl = document.getElementById('hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { shaderVisible = e.isIntersecting; }, { threshold: 0 }).observe(heroEl);
  }

  const animate = () => {
    requestAnimationFrame(animate);
    if (!shaderVisible) return;
    uniforms.time.value += 0.04;
    renderer.render(scene, camera);
  };

  animate();
};

try { initShader(); } catch (e) { console.warn('[Shader] WebGL unavailable:', e.message); }
initGlobe();

// --- GSAP Animations ---

// Anti-FOUC: Pre-set all animated elements to their "from" states
// so nothing flashes when the body becomes visible.
gsap.set("#navbar", { y: -40, opacity: 0, filter: "blur(10px)" });
gsap.set("#canvas-container", { opacity: 0 });
gsap.set(".bg-gradient-to-t", { opacity: 0 });
gsap.set(".hero-text-part", { y: 40, opacity: 0, filter: "blur(6px)" });
gsap.set("#globe-canvas", { opacity: 0, scale: 0.85 });

// Entrance Animations — deferred until the loading screen exits
initLoader(() => {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  // Body reveal — loader has already faded or is morphing out, so this is instantaneous
  tl.set("body", { autoAlpha: 1 });

  // Hero canvas FAST reveal (during morph out)
  tl.fromTo("#canvas-container",
    { opacity: 0 },
    { opacity: 1, duration: 2.0, ease: "power2.out" },
    0
  );

  // Globe canvas FAST reveal (during morph out)
  tl.fromTo("#globe-canvas",
    { opacity: 0, scale: 0.85 },
    { opacity: 1, scale: 1, duration: 2.0, ease: "power2.out" },
    0.1
  );

  // Navbar: blur dissolve
  tl.fromTo("#navbar",
    { y: -40, opacity: 0, filter: "blur(10px)" },
    { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" },
    0.2
  );

  // Hero gradient overlay
  tl.fromTo(".bg-gradient-to-t",
    { opacity: 0 },
    { opacity: 1, duration: 0.9, ease: "power2.out" },
    0.3
  );

  // Hero text — rise + blur clear
  tl.fromTo(".hero-text-part",
    { y: 40, opacity: 0, filter: "blur(6px)" },
    {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 1.1,
      stagger: 0.14,
      ease: "power3.out"
    },
    0.4
  );
});

// --- Hero ↔ Portfolio snap magnet ---
// If scroll stops mid-spacer, snaps to either hero (0) or portfolio (1).
ScrollTrigger.create({
  trigger: ".hero-spacer",
  start: "top top",
  end: "bottom top",
  snap: {
    snapTo: [0, 1],
    ease: "power2.inOut",
    duration: { min: 0.35, max: 0.65 },
    delay: 0.05,
  },
});

// --- Hero: Curtain Reveal Effect ---
// Hero is position:fixed (z-0). Portfolio (z-20, bg-paper) slides over it naturally.
// A 100dvh spacer div before portfolio creates the scroll space.
// Hero content fades out gently as portfolio covers it.
gsap.timeline({
  scrollTrigger: {
    trigger: ".hero-spacer",
    start: "top top",
    end: "bottom top",
    scrub: 1,
  }
})
  .to(".hero-text-part", { opacity: 0, ease: "none" }, 0)
  .to("#globe-canvas", { opacity: 0, scale: 0.96, ease: "none" }, 0)
  .to("#canvas-container, .bg-gradient-to-t", { opacity: 0.3, ease: "none" }, 0);


// ── Portfolio — Scroll Animations ────────────────────────────────────────────

gsap.from(".portfolio-anim", {
  scrollTrigger: { trigger: "#portfolio", start: "top 88%" },
  y: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
});

gsap.from(".portfolio-nav", {
  scrollTrigger: { trigger: "#portfolio", start: "top 88%" },
  opacity: 0, duration: 0.5, ease: "power2.out"
});

gsap.from("#proj-container", {
  scrollTrigger: { trigger: "#portfolio", start: "top 60%" },
  y: 40, opacity: 0, scale: 0.98, duration: 0.8, ease: "power3.out"
});

gsap.from("#proj-progress-row", {
  scrollTrigger: { trigger: "#portfolio", start: "top 55%" },
  opacity: 0, duration: 0.4, ease: "power2.out"
});

// ── Manifesto ────────────────────────────────────────────────────────────────

gsap.from(".manifesto-label", {
  scrollTrigger: { trigger: "#sobre", start: "top 75%" },
  y: 20, opacity: 0, duration: 1, ease: "power3.out"
});

gsap.from(".manifesto-line", {
  scrollTrigger: { trigger: "#sobre", start: "top 60%", end: "bottom 40%", scrub: 0.8 },
  y: 40, opacity: 0, stagger: 0.15, ease: "power2.out"
});

// ── Services ─────────────────────────────────────────────────────────────────

gsap.from(".serv-anim", {
  scrollTrigger: { trigger: "#servicos", start: "top 75%" },
  y: 30, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out"
});

gsap.from(".serv-item", {
  scrollTrigger: { trigger: "#servicos", start: "top 65%" },
  x: -20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out"
});

// Protocol Cards Stacking
const protocolCards = document.querySelectorAll('.protocol-card');
protocolCards.forEach((card, index) => {
  gsap.to(card, {
    scrollTrigger: {
      trigger: card,
      start: "top top+=150",
      end: "bottom top",
      scrub: true,
      // pin: true // Simplified without pin for vanilla stability
    },
    scale: 0.95,
    opacity: 0.8,
    filter: "blur(2px)"
  });
});

// --- CTA Section Shader ---
const initCtaShader = () => {
  const container = document.getElementById('cta-canvas-container');
  if (!container) return;

  const ctaVertexShader = `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  const ctaFragmentShader = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    // Simplex-like noise helpers
    vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
    vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x_) - 0.5;
      vec3 a0 = x_ - floor(x_ + 0.5);
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      float t = time * 0.06;

      // Organic flowing noise layers — higher amplitude
      float n1 = snoise(uv * 2.5 + t);
      float n2 = snoise(uv * 4.0 - t * 1.5) * 0.6;
      float n3 = snoise(uv * 7.0 + vec2(t * 0.8, -t * 0.6)) * 0.35;
      float noise = n1 + n2 + n3;

      // Warm dirty white palette — wider range for more contrast
      vec3 paper  = vec3(0.875, 0.860, 0.835);
      vec3 cream  = vec3(0.80, 0.79, 0.76);
      vec3 silver = vec3(0.68, 0.67, 0.65);
      vec3 warm   = vec3(0.85, 0.83, 0.79);

      // Mix colors with more visible transitions
      vec3 color = mix(paper, cream, smoothstep(-0.4, 0.4, noise));
      color = mix(color, silver, smoothstep(0.2, 0.9, noise) * 0.4);
      color = mix(color, warm, smoothstep(-0.8, -0.2, noise) * 0.3);

      // Stronger vignette
      float vignette = 1.0 - length((uv - 0.5) * 1.3);
      vignette = smoothstep(0.0, 0.7, vignette);
      color = mix(color * 0.88, color, vignette);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const camera = new THREE.Camera();
  camera.position.z = 1;

  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);

  const uniforms = {
    time: { type: "f", value: 0.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: ctaVertexShader,
    fragmentShader: ctaFragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    uniforms.resolution.value.x = renderer.domElement.width;
    uniforms.resolution.value.y = renderer.domElement.height;
  };
  onResize();
  window.addEventListener('resize', onResize);

  // Only animate when visible
  let ctaVisible = false;
  const ctaSection = document.getElementById('contacto');
  if (ctaSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { ctaVisible = e.isIntersecting; }, { threshold: 0 }).observe(ctaSection);
  }

  const animateCta = () => {
    requestAnimationFrame(animateCta);
    if (!ctaVisible) return;
    uniforms.time.value += 0.05;
    renderer.render(scene, camera);
  };
  animateCta();
};

try { initCtaShader(); } catch (e) { console.warn('[CtaShader] WebGL unavailable:', e.message); }

// CTA content scroll animations
gsap.from(".cta-anim", {
  scrollTrigger: {
    trigger: "#contacto",
    start: "top 70%",
  },
  y: 50,
  opacity: 0,
  filter: "blur(6px)",
  duration: 1.2,
  stagger: 0.18,
  ease: "power3.out"
});

// --- Elegant Portfolio Showcase ---
const initElegantCarousel = () => {
  const container = document.getElementById('proj-container');
  const slides = Array.from(document.querySelectorAll('.proj-slide'));
  const bars = Array.from(document.querySelectorAll('.proj-progress'));
  const counter = document.getElementById('proj-counter');
  const prevBtn = document.getElementById('proj-prev');
  const nextBtn = document.getElementById('proj-next');

  if (!container || !slides.length) return;

  const TOTAL = slides.length;
  let cur = 0;
  let endListener = null;

  // Staggered text animation on each slide change
  const animateInfo = (slideEl) => {
    const info = slideEl.querySelector('.proj-info');
    if (!info) return;
    info.classList.remove('anim-in');
    void info.offsetWidth; // force reflow to restart animations
    info.classList.add('anim-in');
  };

  const resetBars = () => {
    bars.forEach(bar => {
      bar.classList.remove('active', 'proj-paused');
      const fill = bar.querySelector('.proj-progress-fill');
      if (fill) {
        fill.style.animation = 'none';
        void fill.offsetWidth;
        fill.style.animation = '';
      }
    });
  };

  const go = (idx) => {
    idx = ((idx % TOTAL) + TOTAL) % TOTAL;

    // Remove previous animationend listener before resetting bars
    if (endListener) {
      const prevFill = bars[cur]?.querySelector('.proj-progress-fill');
      if (prevFill) prevFill.removeEventListener('animationend', endListener);
      endListener = null;
    }

    // Switch slide
    slides[cur].classList.remove('active');
    cur = idx;
    slides[cur].classList.add('active');
    animateInfo(slides[cur]);

    // Reset + start active progress bar
    resetBars();
    bars[cur].classList.add('active');

    // Use animationend for perfect sync — zero gap between bar and slide change
    const activeFill = bars[cur].querySelector('.proj-progress-fill');
    if (activeFill) {
      endListener = () => go(cur + 1);
      activeFill.addEventListener('animationend', endListener, { once: true });
    }

    if (counter) counter.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`;
  };

  if (prevBtn) prevBtn.addEventListener('click', () => go(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(cur + 1));
  bars.forEach(bar => bar.addEventListener('click', () => go(+bar.dataset.index)));

  // Touch swipe
  let touchStartX = 0;
  container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? cur + 1 : cur - 1);
  }, { passive: true });

  go(0);
};

initElegantCarousel();

// ── Footer ────────────────────────────────────────────────────────
gsap.from('.footer-dots', {
  scrollTrigger: { trigger: 'footer', start: 'top 85%' },
  opacity: 0, duration: 1.5, ease: 'power2.out'
});

gsap.from('.footer-grid > div, .footer-bottom', {
  scrollTrigger: { trigger: 'footer', start: 'top 85%' },
  y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out'
});

