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
