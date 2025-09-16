// Minimal JS: blog-specific functionality only
// Mobile menu functionality is handled by header.js

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
