/**
 * Monrion Digital Haute Couture
 * Core Engine: Lenis Smooth Scroll + GSAP + Magnetic Cursor
 */

import gsap from "https://esm.sh/gsap@3.12.5";
import { ScrollTrigger } from "https://esm.sh/gsap@3.12.5/ScrollTrigger";
import Lenis from "https://unpkg.com/@studio-freight/lenis@1.0.39/dist/lenis.mjs";

gsap.registerPlugin(ScrollTrigger);

class MonrionEngine {
    constructor() {
        this.lenis = null;
        this.cursor = null;
        this.init();
    }

    init() {
        this.initPageTransitions();
        this.initSmoothScroll();
        this.initCursor();
        this.initParallax();
        this.initReveals();
        this.injectFilmGrain();

        // Re-trigger scroll on load to ensure GSAP calc is correct
        window.addEventListener("load", () => {
            ScrollTrigger.refresh();
            // Add a tiny delay to ensure everything is rendered
        });
    }

    initSmoothScroll() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        // Ensure GSAP ScrollTrigger updates with Lenis
        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            if (this.lenis) this.lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    }

    initPageTransitions() {
        // Create the loader element if it doesn't exist
        let loader = document.getElementById('monrion-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'monrion-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: #EBE9E4; /* Paper color */
                z-index: 10000;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
            `;
            loader.innerHTML = `
               <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #121212;">
                  Carregando
               </div>
            `;
            document.body.appendChild(loader);
        }

        // On load, fade out the loader
        window.addEventListener('load', () => {
            document.body.style.visibility = "visible";
            gsap.to(loader, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    loader.style.display = 'none';
                }
            });
        });

        // Intercept links for fade out
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                const target = link.getAttribute('href');
                // Ignore hash links, external links, mailto, tel, or essentially empty/current page targets
                if (!target || target.startsWith('#') || target.startsWith('mailto:') || target.startsWith('tel:') || link.target === "_blank") {
                    return;
                }

                e.preventDefault();
                loader.style.display = 'flex';
                gsap.to(loader, {
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        window.location.href = target;
                    }
                });
            });
        });
    }

    initCursor() {
        if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

        // Create cursor element
        this.cursor = document.createElement("div");
        this.cursor.id = "monrion-cursor";
        document.body.appendChild(this.cursor);

        // Use GSAP quickTo for highly performant tracking
        const xTo = gsap.quickTo(this.cursor, "x", { duration: 0.2, ease: "power3" });
        const yTo = gsap.quickTo(this.cursor, "y", { duration: 0.2, ease: "power3" });

        let isMagnetic = false;

        window.addEventListener("mousemove", (e) => {
            if (!isMagnetic) {
                xTo(e.clientX);
                yTo(e.clientY);
            }
        });

        // Handle interactive elements (Links, Buttons)
        const interactables = document.querySelectorAll("a, button, .interactive");
        interactables.forEach((el) => {
            el.addEventListener("mouseenter", () => {
                this.cursor.classList.add("state-hover");
            });
            el.addEventListener("mouseleave", () => {
                this.cursor.classList.remove("state-hover");
            });
        });

        // Handle Portfolio Gallery specific hover (The "View" expanding circle)
        const galleryItems = document.querySelectorAll(".project-card");
        galleryItems.forEach((item) => {
            item.addEventListener("mouseenter", () => {
                this.cursor.classList.add("state-view");
                this.cursor.innerText = "VIEW";
            });
            item.addEventListener("mouseleave", () => {
                this.cursor.classList.remove("state-view");
                this.cursor.innerText = "";
            });
        });

        // Make the Contact button highly magnetic
        const magnetBtns = document.querySelectorAll(".btn-contact, .magnetic");
        magnetBtns.forEach((btn) => {
            btn.addEventListener("mousemove", (e) => {
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Calculate distance from center (magnetic pull)
                const pullX = (e.clientX - centerX) * 0.4; // 40% pull
                const pullY = (e.clientY - centerY) * 0.4;

                isMagnetic = true;

                // Move button slightly
                gsap.to(btn, {
                    x: pullX,
                    y: pullY,
                    duration: 1,
                    ease: "power3.out"
                });

                // Snap cursor perfectly to center of button whilst inside
                xTo(centerX + pullX * 0.5);
                yTo(centerY + pullY * 0.5);
            });

            btn.addEventListener("mouseleave", () => {
                isMagnetic = false;
                // Snap button back
                gsap.to(btn, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
            });
        });
    }

    initParallax() {
        const images = document.querySelectorAll(".project-card img");

        images.forEach(img => {
            gsap.to(img, {
                yPercent: 12, // Moves down as you scroll up, creating slower parallax
                ease: "none",
                scrollTrigger: {
                    trigger: img.parentElement,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                }
            });
        });
    }

    initReveals() {
        // Basic Reveal for containers (Bottom-up fade)
        const reveals = gsap.utils.toArray(".reveal-on-scroll");
        reveals.forEach(elem => {
            gsap.from(elem, {
                scrollTrigger: {
                    trigger: elem,
                    start: "top 85%",
                },
                y: 60,
                opacity: 0,
                duration: 1.2,
                ease: "expo.out"
            });
        });

        // Clip-path Reveal for Images (The slow unmasking)
        const clipImages = gsap.utils.toArray(".clip-reveal");
        clipImages.forEach(img => {
            gsap.from(img, {
                scrollTrigger: {
                    trigger: img.parentElement,
                    start: "top 80%",
                },
                clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
                duration: 2,
                ease: "power4.inOut"
            });
        });

        // Split text logic for staggered titles
        const titles = document.querySelectorAll(".stagger-title");
        titles.forEach(title => {
            // In a real prod environment we use SplitText plugin, 
            // here we simulate it by assuming the user structured HTML correctly
            // i.e., lines wrapped in .reveal-text-line > .reveal-text-word
            const words = title.querySelectorAll(".reveal-text-word");
            if (words.length) {
                gsap.to(words, {
                    scrollTrigger: {
                        trigger: title,
                        start: "top 85%",
                    },
                    y: "0%",
                    duration: 1.5,
                    stagger: 0.1,
                    ease: "power4.out"
                });
            }
        });
    }

    injectFilmGrain() {
        // Add SVG filter noise wrapper dynamically if not present
        if (!document.getElementById("monrion-noise-filter")) {
            const svg = `
        <svg id="monrion-noise-filter" class="hidden">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          </filter>
        </svg>
      `;
            document.body.insertAdjacentHTML("beforeend", svg);
        }

        // Add the overlay div
        if (!document.querySelector('.film-grain')) {
            const grainDiv = document.createElement('div');
            grainDiv.className = 'film-grain';
            document.body.appendChild(grainDiv);

            // Use regular CSS styling for the filter string to bypass cross-browser SVG bugs
            grainDiv.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")';
        }
    }
}

// Instantiate
const Engine = new MonrionEngine();
window.MonrionEngine = Engine; // Expose globally just in case
