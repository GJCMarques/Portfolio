import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { createIcons, Menu, X, ArrowRight, Microscope, Activity, Sprout, Mail, Phone, Instagram, Linkedin, MapPin, Clock } from 'lucide';
import { initGlobe } from './globe.js';

gsap.registerPlugin(ScrollTrigger);

// --- Icons ---
createIcons({
  icons: {
    Menu,
    X,
    ArrowRight,
    Microscope,
    Activity,
    Sprout,
    Mail,
    Phone,
    Instagram,
    Linkedin,
    MapPin,
    Clock
  }
});

// --- Navbar Logic ---
const navbar = document.getElementById('navbar');
const menuBtn = document.getElementById('menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

menuBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('translate-y-full');
});

closeMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.add('translate-y-full');
});

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
    uniforms.time.value += 0.07;
    renderer.render(scene, camera);
  };

  animate();
};

initShader();
initGlobe();

// --- GSAP Animations ---

// Anti-FOUC: Pre-set all animated elements to their "from" states
// so nothing flashes when the body becomes visible.
gsap.set("#navbar", { y: -40, opacity: 0, filter: "blur(10px)" });
gsap.set("#canvas-container", { opacity: 0 });
gsap.set(".bg-gradient-to-t", { opacity: 0 });
gsap.set(".hero-text-part", { y: 40, opacity: 0, filter: "blur(6px)" });
gsap.set("#globe-canvas", { opacity: 0, scale: 0.85 });

// Entrance Animations — Cinematic sequence (compressed)
const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

// 1. Page ready — body visibility flips on, but everything above is already hidden
tl.set("body", { autoAlpha: 1 });

// 2. Navbar: blur dissolve, snappy
tl.fromTo("#navbar",
  { y: -40, opacity: 0, filter: "blur(10px)" },
  { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" },
  0.1
);

// 3. Hero canvas fades in
tl.fromTo("#canvas-container",
  { opacity: 0 },
  { opacity: 1, duration: 1.2, ease: "power2.inOut" },
  0.15
);

// 4. Hero gradient overlay
tl.fromTo(".bg-gradient-to-t",
  { opacity: 0 },
  { opacity: 1, duration: 0.9, ease: "power2.out" },
  0.3
);

// 5. Hero text — rise + blur clear, tighter stagger
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
  0.5
);

// 6. Globe canvas — scale up from center
tl.fromTo("#globe-canvas",
  { opacity: 0, scale: 0.85 },
  { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" },
  0.6
);


gsap.from(".feature-card", {
  scrollTrigger: {
    trigger: "#servicos",
    start: "top 80%",
  },
  y: 40,
  opacity: 0,
  duration: 1,
  stagger: 0.2,
  ease: "power3.out"
});

// Philosophy
gsap.from(".philosophy-line", {
  scrollTrigger: {
    trigger: "#sobre",
    start: "top 70%",
  },
  y: 50,
  opacity: 0,
  duration: 1.5,
  stagger: 0.2,
  ease: "power3.out"
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

initCtaShader();

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

// --- Interactive Cards Logic ---

// 1. Diagnostic Shuffler
const shufflerContainer = document.getElementById('shuffler-container');

function initShuffler() {
  for (let i = 0; i < 3; i++) {
    const card = document.createElement('div');
    // Updated classes for Noir theme: bg-paper, border-ink/10
    card.className = `absolute inset-x-0 bottom-0 h-24 bg-paper rounded-xl border border-ink/10 shadow-lg transition-all duration-500 flex items-center px-4 gap-3`;
    card.style.transform = `translateY(${i * -10}px) scale(${1 - i * 0.05})`;
    card.style.zIndex = 3 - i;
    card.style.opacity = 1 - i * 0.2;

    card.innerHTML = `
            <div class="w-2 h-2 rounded-full bg-carbon animate-pulse"></div>
            <div class="h-2 w-24 bg-ink/10 rounded-full"></div>
        `;
    shufflerContainer.appendChild(card);
  }

  setInterval(() => {
    const cards = Array.from(shufflerContainer.children);
    const lastCard = cards.pop();
    shufflerContainer.insertBefore(lastCard, shufflerContainer.firstChild);

    // Re-apply styles
    Array.from(shufflerContainer.children).forEach((card, i) => {
      card.style.transform = `translateY(${i * -10}px) scale(${1 - i * 0.05})`;
      card.style.zIndex = 3 - i;
      card.style.opacity = 1 - i * 0.2;
    });
  }, 3000);
}
initShuffler();

// 2. Telemetry Typewriter
const typewriterText = document.getElementById('typewriter-text');
const messages = [
  "> analyzing_bio_data...",
  "> synthesizing_dna...",
  "> optimizing_growth...",
  "> system_stable."
];
let msgIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeLoop() {
  const currentMsg = messages[msgIndex];

  if (isDeleting) {
    typewriterText.innerHTML = currentMsg.substring(0, charIndex - 1) + '<br/>';
    charIndex--;
  } else {
    typewriterText.innerHTML = currentMsg.substring(0, charIndex + 1) + '<br/>';
    charIndex++;
  }

  let typeSpeed = isDeleting ? 30 : 80;

  if (!isDeleting && charIndex === currentMsg.length) {
    typeSpeed = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    msgIndex = (msgIndex + 1) % messages.length;
    typeSpeed = 500;
  }

  setTimeout(typeLoop, typeSpeed);
}
typeLoop();

// 3. Calendar Grid
const calendarGrid = document.getElementById('calendar-grid');
for (let i = 0; i < 21; i++) {
  const cell = document.createElement('div');
  // Updated classes for Noir theme: bg-carbon, bg-ink/10
  cell.className = `aspect-square rounded-sm ${i === 10 ? 'bg-carbon animate-pulse' : 'bg-ink/10'}`;
  calendarGrid.appendChild(cell);
}
