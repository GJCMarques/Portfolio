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

  // --- Navbar Award-Winning Cinematic Hover (Minimal Diagonal Esquadria) ---
  const navContainer = document.querySelector("#navbar .md\\:flex.absolute");
  if (navContainer) {
    // Elegant, minimal architectural corners (Top-Left and Bottom-Right only)
    const frame = document.createElement("div");
    frame.className = "absolute left-0 top-0 pointer-events-none z-0 opacity-0";

    frame.innerHTML = `
      <!-- Top Left Esquadria -->
      <div class="absolute left-[-8px] top-[-4px] w-[8px] h-[1px] bg-ink/40 transition-transform origin-left"></div>
      <div class="absolute left-[-8px] top-[-4px] w-[1px] h-[8px] bg-ink/40 transition-transform origin-top"></div>
      
      <!-- Bottom Right Esquadria -->
      <div class="absolute right-[-8px] bottom-[-2px] w-[8px] h-[1px] bg-ink/40 transition-transform origin-right"></div>
      <div class="absolute right-[-8px] bottom-[-2px] w-[1px] h-[8px] bg-ink/40 transition-transform origin-bottom"></div>
    `;
    navContainer.appendChild(frame);

    // Override the previous hover CSS lines securely
    const styleOverride = document.createElement("style");
    styleOverride.innerHTML = `
      #navbar .md\\:flex.absolute .nav-link::before,
      #navbar .md\\:flex.absolute .nav-link::after { display: none !important; }
      #navbar .md\\:flex.absolute .nav-link { position: relative; z-index: 10; padding: 2px 0; margin: 0; }
    `;
    document.head.appendChild(styleOverride);

    const navLinks = Array.from(navContainer.querySelectorAll(".nav-link"));

    let activeLink = null;
    let leaveTimer = null;

    // Determine current page link based on URL
    const currentPathSegment =
      location.pathname.split("/").filter(Boolean)[0] ?? "";
    const pageActiveLink =
      navLinks.find((link) => {
        const hrefSeg =
          link.getAttribute("href").split("/").filter(Boolean)[0] ?? "";
        return hrefSeg === currentPathSegment;
      }) || null;

    gsap.set(frame, { x: 0, y: 0, width: 0, height: 0 });

    // Instantly set boundaries to active page if found
    if (pageActiveLink) {
      const rect = pageActiveLink.getBoundingClientRect();
      const containerRect = navContainer.getBoundingClientRect();

      gsap.set(frame, {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        opacity: 1,
      });
      activeLink = pageActiveLink;
    }

    navLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        clearTimeout(leaveTimer);
        const rect = link.getBoundingClientRect();
        const containerRect = navContainer.getBoundingClientRect();

        const targetX = rect.left - containerRect.left;
        const targetY = rect.top - containerRect.top;
        const targetWidth = rect.width;
        const targetHeight = rect.height;

        if (activeLink === link) return;

        if (activeLink) {
          // Fluid transition to the new link
          gsap.to(frame, {
            x: targetX,
            y: targetY,
            width: targetWidth,
            height: targetHeight,
            duration: 0.65,
            ease: "expo.out",
            overwrite: "auto",
          });
        } else {
          // First entry from nowhere: scale out from center block
          gsap.set(frame, {
            x: targetX + targetWidth / 2,
            y: targetY + targetHeight / 2,
            width: 0,
            height: 0,
          });

          gsap.to(frame, {
            x: targetX,
            y: targetY,
            width: targetWidth,
            height: targetHeight,
            opacity: 1,
            duration: 0.65,
            ease: "expo.out",
            overwrite: "auto",
          });
        }

        activeLink = link;
      });
    });

    navContainer.addEventListener("mouseleave", () => {
      leaveTimer = setTimeout(() => {
        if (pageActiveLink) {
          // Glide back to the Page Active Link seamlessly
          const rect = pageActiveLink.getBoundingClientRect();
          const containerRect = navContainer.getBoundingClientRect();
          const targetX = rect.left - containerRect.left;
          const targetY = rect.top - containerRect.top;

          gsap.to(frame, {
            x: targetX,
            y: targetY,
            width: rect.width,
            height: rect.height,
            duration: 0.75,
            ease: "expo.out",
            overwrite: "auto",
            onComplete: () => {
              activeLink = pageActiveLink;
            },
          });
        } else {
          // Disappear elegantly by collapsing frames inwards
          if (!activeLink) return;
          const rect = activeLink.getBoundingClientRect();
          const containerRect = navContainer.getBoundingClientRect();
          const startX = rect.left - containerRect.left;
          const startY = rect.top - containerRect.top;

          gsap.to(frame, {
            x: startX + rect.width / 2,
            y: startY + rect.height / 2,
            width: 0,
            height: 0,
            opacity: 0,
            duration: 0.5,
            ease: "expo.inOut",
            overwrite: "auto",
            onComplete: () => {
              activeLink = null;
            },
          });
        }
      }, 50);
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
