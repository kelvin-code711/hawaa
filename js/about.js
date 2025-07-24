// js/about.js

const section = document.querySelector('.full-circle-section');
const cardSection = document.querySelector('.card-section');
const card = document.querySelector('.blank-card');
const wrapper = document.querySelector('.card-image-wrapper');
const impactPilotSection = document.querySelector('.impact-pilot-section');

if (!section || !cardSection || !card || !wrapper) {
  console.error('Missing required element.');
} else {
  // PRE-CALCULATE POSITIONS & SIZES
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;
  const sectionHeight = section.offsetHeight;

  const wrapperRect0 = wrapper.getBoundingClientRect();
  const wrapperWidth = wrapperRect0.width;
  const wrapperHeight = wrapper.offsetHeight;
  const wrapperTop = wrapperRect0.top + window.scrollY;

  const vw = window.innerWidth;
  const maxScale = vw / wrapperWidth;

  const startZoom = wrapperTop - window.innerHeight * 0.5;
  const endZoom = wrapperTop + wrapperHeight - window.innerHeight;

  const cardTop = card.getBoundingClientRect().top + window.scrollY;
  const cardHeight = card.offsetHeight;
  const cardBottom = cardTop + cardHeight;
  
  // Get Impact Pilot section height
  const impactPilotHeight = impactPilotSection ? impactPilotSection.offsetHeight : 0;
  
  // Points where transitions happen
  const cardEnterViewportAt = cardTop;
  const cardCoverViewportAt = cardTop + window.innerHeight;
  const cardLeaveViewportAt = cardBottom;
  
  // SLOWER ROTATION: rotate only 180° across the entire section
  const rotationFactor = 80;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const viewportHeight = window.innerHeight;

        // 1) ROTATE TEXT-RING
        let frac = (y - sectionTop) / sectionHeight;
        frac = Math.min(Math.max(frac, 0), 1);
        const angle = frac * rotationFactor;
        section.style.setProperty('--rotation', `${angle}deg`);

        // 2) ZOOM IMAGE CONTAINER
        let t = (y - startZoom) / (endZoom - startZoom);
        t = Math.min(Math.max(t, 0), 1);
        wrapper.style.transform = `scale(${1 + t * (maxScale - 1)})`;

        // 3) HANDLE HALF-CIRCLE VISIBILITY
        if (y >= cardCoverViewportAt) {
          section.style.opacity = '0';
          section.style.pointerEvents = 'none';
        } else {
          section.style.opacity = '1';
          section.style.pointerEvents = 'auto';
        }

        // 4) IMPROVED IMPACT-PILOT SECTION HANDLING
        if (impactPilotSection) {
          if (y >= cardEnterViewportAt && y < cardLeaveViewportAt) {
            // Card is in viewport - make impact-pilot section fixed
            impactPilotSection.style.position = 'fixed';
            impactPilotSection.style.top = '0';
            impactPilotSection.style.left = '0';
            impactPilotSection.style.width = '100%';
            impactPilotSection.style.height = 'auto'; // Changed from 100vh to auto
            impactPilotSection.style.zIndex = '-1';
            impactPilotSection.style.opacity = '1';
            impactPilotSection.style.overflowY = 'visible'; // Changed from auto to visible
            impactPilotSection.style.bottom = 'auto';
            
            // Calculate max height to prevent cutoff
            const maxHeight = `calc(100vh - ${y - cardEnterViewportAt}px)`;
            impactPilotSection.style.maxHeight = maxHeight;
          } 
          else if (y >= cardLeaveViewportAt) {
            // Card has left viewport - release impact-pilot section
            impactPilotSection.style.position = 'relative';
            impactPilotSection.style.zIndex = 'auto';
            impactPilotSection.style.height = 'auto';
            impactPilotSection.style.maxHeight = 'none';
            impactPilotSection.style.opacity = '1';
          } 
          else {
            // Card not yet in viewport - hide impact-pilot section
            impactPilotSection.style.opacity = '0';
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  });

  // Handle window resize to recalculate heights
  window.addEventListener('resize', () => {
    if (impactPilotSection) {
      impactPilotSection.style.position = 'relative';
      impactPilotSection.style.height = 'auto';
      impactPilotSection.style.maxHeight = 'none';
    }
  });

  // Initialize
  if (impactPilotSection) {
    impactPilotSection.style.opacity = '0';
    impactPilotSection.style.transition = 'opacity 0.3s ease';
  }
  section.style.transition = 'opacity 0.3s ease';
  section.style.willChange = 'opacity';
}