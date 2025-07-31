// js/about.js
document.addEventListener('DOMContentLoaded', function() {
  const section = document.querySelector('.full-circle-section');
  const cardSection = document.querySelector('.card-section');
  const card = document.querySelector('.blank-card');
  const wrapper = document.querySelector('.card-image-wrapper');
  const impactPilotSection = document.querySelector('.impact-pilot-section');
  const header = document.querySelector('.hawaa-header');
  const body = document.body;

  if (!section || !cardSection || !card || !wrapper) {
    console.error('Missing required element.');
    return;
  }

  // Initialize element states
  section.style.willChange = 'opacity, transform';
  cardSection.style.willChange = 'transform';
  if (impactPilotSection) {
    impactPilotSection.style.opacity = '0';
    impactPilotSection.style.transition = 'opacity 0.3s ease';
    impactPilotSection.style.willChange = 'opacity';
  }

  // Calculate initial positions
  let sectionTop = section.getBoundingClientRect().top + window.scrollY;
  let sectionHeight = section.offsetHeight;
  let wrapperRect = wrapper.getBoundingClientRect();
  let wrapperWidth = wrapperRect.width;
  let wrapperHeight = wrapper.offsetHeight;
  let wrapperTop = wrapperRect.top + window.scrollY;
  let maxScale = window.innerWidth / wrapperWidth;
  let startZoom = wrapperTop - window.innerHeight * 0.5;
  let endZoom = wrapperTop + wrapperHeight - window.innerHeight;
  let cardTop = card.getBoundingClientRect().top + window.scrollY;
  let cardHeight = card.offsetHeight;
  let cardBottom = cardTop + cardHeight;
  const rotationFactor = 80;

  // Handle resize events to recalculate positions
  window.addEventListener('resize', function() {
    sectionTop = section.getBoundingClientRect().top + window.scrollY;
    sectionHeight = section.offsetHeight;
    wrapperRect = wrapper.getBoundingClientRect();
    wrapperWidth = wrapperRect.width;
    wrapperTop = wrapperRect.top + window.scrollY;
    maxScale = window.innerWidth / wrapperWidth;
    startZoom = wrapperTop - window.innerHeight * 0.5;
    endZoom = wrapperTop + wrapperHeight - window.innerHeight;
    cardTop = card.getBoundingClientRect().top + window.scrollY;
    cardHeight = card.offsetHeight;
    cardBottom = cardTop + cardHeight;
  });

  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        const y = window.scrollY;
        const viewportHeight = window.innerHeight;

        // 1) Rotate text-ring
        let frac = (y - sectionTop) / sectionHeight;
        frac = Math.min(Math.max(frac, 0), 1);
        const angle = frac * rotationFactor;
        section.style.setProperty('--rotation', `${angle}deg`);

        // 2) Zoom image container
        let t = (y - startZoom) / (endZoom - startZoom);
        t = Math.min(Math.max(t, 0), 1);
        wrapper.style.transform = `scale(${1 + t * (maxScale - 1)})`;

        // 3) Handle half-circle visibility
        const circleFadeStart = cardTop - viewportHeight * 0.3;
        const circleFadeEnd = cardTop + viewportHeight * 0.7;
        
        if (y >= circleFadeStart) {
          if (y >= circleFadeEnd) {
            section.style.opacity = '0';
            section.style.pointerEvents = 'none';
          } else {
            const opacity = 1 - (y - circleFadeStart) / (circleFadeEnd - circleFadeStart);
            section.style.opacity = opacity;
            section.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
          }
        } else {
          section.style.opacity = '1';
          section.style.pointerEvents = 'auto';
        }

        // 4) Handle impact-pilot section
        if (impactPilotSection) {
          const impactShowStart = cardTop + viewportHeight * 0.5;
          const impactShowEnd = cardBottom - viewportHeight * 0.3;
          
          if (y >= impactShowStart) {
            if (y >= impactShowEnd) {
              // Card has left viewport - release impact section
              impactPilotSection.style.position = 'relative';
              impactPilotSection.style.zIndex = '1';
              impactPilotSection.style.opacity = '1';
            } else {
              // Card is covering viewport - show impact section as background
              impactPilotSection.style.position = 'fixed';
              impactPilotSection.style.top = '0';
              impactPilotSection.style.left = '0';
              impactPilotSection.style.width = '100%';
              impactPilotSection.style.height = '100vh';
              impactPilotSection.style.zIndex = '-1';
              impactPilotSection.style.opacity = '1';
            }
          } else {
            // Card not yet in position - hide impact section
            impactPilotSection.style.opacity = '0';
          }
        }

        // 5) Handle header appearance
        if (header) {
          if (y > sectionTop + sectionHeight - header.offsetHeight) {
            body.classList.add('scrolled-past-first');
          } else {
            body.classList.remove('scrolled-past-first');
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  });

  // Trigger initial scroll to set correct positions
  window.dispatchEvent(new Event('scroll'));
});