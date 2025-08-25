// Minimal JS: menu + curtain glue (keeps layout breathing on all devices)

// Mobile menu
const menuToggle = document.getElementById('menu-toggle');
const mobileNav  = document.getElementById('mobile-nav');
const navClose   = document.getElementById('nav-close');
const navOverlay = document.getElementById('nav-overlay');

if (menuToggle && mobileNav && navClose && navOverlay) {
  const open = () => { mobileNav.classList.add('active'); mobileNav.setAttribute('aria-hidden','false'); };
  const close = () => { mobileNav.classList.remove('active'); mobileNav.setAttribute('aria-hidden','true'); };

  menuToggle.addEventListener('click', open);
  navClose.addEventListener('click', close);
  navOverlay.addEventListener('click', close);
}

// Curtain: make scene1 sticky under real header height, add soft shadow on overlap
(() => {
  const curtain = document.querySelector('.curtain');
  const scene2  = document.getElementById('scene2');
  const header  = document.getElementById('hawaa-header');
  if (!curtain || !scene2) return;

  const syncHeaderH = () => {
    const h = header ? header.offsetHeight : 72;
    document.documentElement.style.setProperty('--header-h', `${h}px`);
  };
  syncHeaderH();
  window.addEventListener('resize', syncHeaderH, { passive: true });
  window.addEventListener('orientationchange', syncHeaderH, { passive: true });

  // Toggle shadow when scene2 overlaps the hero edge
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { curtain.classList.add('is-crossing'); }
      else { curtain.classList.remove('is-crossing'); }
    }
  }, { threshold: 0.01 });
  io.observe(scene2);
})();
