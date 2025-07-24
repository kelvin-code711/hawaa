document.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('hawaa-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const navClose = document.getElementById('nav-close');
  const navOverlay = document.getElementById('nav-overlay');

  function toggleMenu() {
    document.body.classList.toggle('menu-open');
    mobileNav.classList.toggle('active');
  }

  if (menuToggle && navClose && navOverlay && mobileNav) {
    menuToggle.addEventListener('click', toggleMenu);
    navClose.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);
  }

  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (mobileNav.classList.contains('active')) {
        toggleMenu();
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      toggleMenu();
    }
  });

  let lastScroll = 0;
  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
      header.classList.remove('scroll-up');
      return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
      header.classList.remove('scroll-up');
      header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
      header.classList.remove('scroll-down');
      header.classList.add('scroll-up');
    }

    lastScroll = currentScroll;
  });
});