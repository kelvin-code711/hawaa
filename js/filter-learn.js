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

  // Header scroll behavior for filter-learn page
  const heroSection = document.querySelector('.hero-section');
  
  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;
    
    // Get the hero section height to determine when to make header fixed
    const heroHeight = heroSection ? heroSection.offsetTop + 100 : 100;
    
    // Add fixed positioning and white background when scrolled past hero
    if (currentScroll > heroHeight) {
      header.classList.add('header-fixed');
    } else {
      header.classList.remove('header-fixed');
    }
    
    // Remove any scroll transform classes to keep header always visible
    header.classList.remove('scroll-up', 'scroll-down');
  });
});