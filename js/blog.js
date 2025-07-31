const wrapper = document.querySelector('.card-image-wrapper');
const img = wrapper?.querySelector('img');

// Menu
const menuToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
const navClose = document.getElementById('nav-close');
const navOverlay = document.getElementById('nav-overlay');

// === Menu Events — run ONCE, not inside scroll ===
if (menuToggle && mobileNav && navClose && navOverlay) {
  menuToggle.addEventListener('click', function () {
    mobileNav.classList.add('active');
  });

  navClose.addEventListener('click', function () {
    mobileNav.classList.remove('active');
  });

  navOverlay.addEventListener('click', function () {
    mobileNav.classList.remove('active');
  });
}

// === Scroll zoom effect ===
window.addEventListener('scroll', () => {
  if (!wrapper || !img) return;

  const rect = wrapper.getBoundingClientRect();
  const vh = window.innerHeight;

  const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) / (rect.height + vh);

  const scale = 1 + visible * 0.1;
  img.style.transform = `translate3d(0,0,0) scale3d(${scale},${scale},1)`;
});
