import {
  createIcons,
  Menu,
  X,
  ArrowRight,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  MapPin,
  Clock,
} from "lucide";

import { initLoader, initGlobalEffects } from "./loading.js";
import gsap from "gsap";

// ── Lucide icons — render while body is still hidden so they're ready on reveal
createIcons({
  icons: {
    Menu,
    X,
    ArrowRight,
    Mail,
    Phone,
    Instagram,
    Linkedin,
    MapPin,
    Clock,
  },
});

// ── Global Custom Cursor and Morph Leave Transition
initGlobalEffects();

// ── Loading screen → reveal ───────────────────────────────────────────────
initLoader(() => {
  // Make page visible
  document.body.style.visibility = "visible";

  // Navbar scroll behaviour
  const navbar = document.getElementById("navbar");
  if (navbar) {
    const update = () =>
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    update();
    window.addEventListener("scroll", update, { passive: true });
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
    const currentPathSegment =
      location.pathname.split("/").filter(Boolean)[0] ?? "";

    navLinks.forEach((link) => {
      const isCurrentPage = (() => {
        const hrefSeg =
          link.getAttribute("href").split("/").filter(Boolean)[0] ?? "";
        return hrefSeg === currentPathSegment;
      })();

      // Localized frame bound tightly to each individual link
      const frame = document.createElement("div");
      frame.className =
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-0 w-0 h-0";
      frame.innerHTML = `
        <!-- Top Left Esquadria -->
        <div class="bp-mark absolute left-0 top-0 w-[8px] h-[1px] bg-ink opacity-40 origin-left"></div>
        <div class="bp-mark absolute left-0 top-0 w-[1px] h-[8px] bg-ink opacity-40 origin-top"></div>
        
        <!-- Bottom Right Esquadria -->
        <div class="bp-mark absolute right-0 bottom-0 w-[8px] h-[1px] bg-ink opacity-40 origin-right"></div>
        <div class="bp-mark absolute right-0 bottom-0 w-[1px] h-[8px] bg-ink opacity-40 origin-bottom"></div>

        ${
          isCurrentPage
            ? `
        <!-- Opposing Dots (Balance) ONLY for Active Page -->
        <div class="bp-dot absolute right-[1px] top-[1px] w-[2.5px] h-[2.5px] bg-ink opacity-40 origin-center rounded-full"></div>
        <div class="bp-dot absolute left-[1px] bottom-[1px] w-[2.5px] h-[2.5px] bg-ink opacity-40 origin-center rounded-full"></div>
        `
            : ""
        }
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

  // Mobile menu toggle
  const menuBtn = document.getElementById("menu-btn");
  const closeMenuBtn = document.getElementById("close-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  menuBtn?.addEventListener("click", () =>
    mobileMenu?.classList.remove("translate-y-full"),
  );
  closeMenuBtn?.addEventListener("click", () =>
    mobileMenu?.classList.add("translate-y-full"),
  );

  // Close mobile menu on any nav link click
  mobileMenu
    ?.querySelectorAll("a[href]")
    .forEach((a) =>
      a.addEventListener("click", () =>
        mobileMenu.classList.add("translate-y-full"),
      ),
    );

  // Active nav link — match first path segment to data-navpage attribute
  const currentPage = location.pathname.split("/").filter(Boolean)[0] ?? "";
  document.querySelectorAll("[data-navpage]").forEach((el) => {
    if (el.dataset.navpage === currentPage) el.classList.add("active");
  });

  // Footer GMT clock
  const clock = document.getElementById("footer-gmt-time");
  if (clock) {
    const tick = () => {
      const d = new Date();
      clock.textContent = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    };
    tick();
    setInterval(tick, 30000);
  }
});
