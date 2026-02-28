import {
  createIcons,
  Menu, X, ArrowRight,
  Mail, Phone, Instagram, Linkedin, MapPin, Clock
} from 'lucide';

import { initLoader } from './loading.js';

// ── Lucide icons — render while body is still hidden so they're ready on reveal
createIcons({
  icons: { Menu, X, ArrowRight, Mail, Phone, Instagram, Linkedin, MapPin, Clock }
});

// ── Loading screen → reveal ───────────────────────────────────────────────
initLoader(() => {
  // Make page visible
  document.body.style.visibility = 'visible';

  // Navbar scroll behaviour
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const update = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // Mobile menu toggle
  const menuBtn      = document.getElementById('menu-btn');
  const closeMenuBtn = document.getElementById('close-menu-btn');
  const mobileMenu   = document.getElementById('mobile-menu');

  menuBtn?.addEventListener('click',      () => mobileMenu?.classList.remove('translate-y-full'));
  closeMenuBtn?.addEventListener('click', () => mobileMenu?.classList.add('translate-y-full'));

  // Close mobile menu on any nav link click
  mobileMenu?.querySelectorAll('a[href]').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.add('translate-y-full'))
  );

  // Active nav link — match first path segment to data-navpage attribute
  const currentPage = location.pathname.split('/').filter(Boolean)[0] ?? '';
  document.querySelectorAll('[data-navpage]').forEach(el => {
    if (el.dataset.navpage === currentPage) el.classList.add('active');
  });

  // Footer GMT clock
  const clock = document.getElementById('footer-gmt-time');
  if (clock) {
    const tick = () => {
      const d = new Date();
      clock.textContent =
        `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    };
    tick();
    setInterval(tick, 30000);
  }
});
