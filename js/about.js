// js/about.js
document.addEventListener('DOMContentLoaded', function () {
  const section = document.querySelector('.full-circle-section');         // circle hero
  const cardSection = document.querySelector('.card-section');            // text+image card
  const card = document.querySelector('.blank-card');                     // card content
  const wrapper = document.querySelector('.card-image-wrapper');          // zoom container
  const impactPilotSection = document.querySelector('.impact-pilot-section'); // next section
  const header = document.querySelector('.hawaa-header');
  const body = document.body;

  if (!section || !cardSection || !card || !wrapper || !impactPilotSection) {
    console.error('Missing required element.');
    return;
  }

  // Initial state
  section.style.willChange = 'opacity, transform';
  section.style.opacity = '1';
  section.style.position = 'sticky';
  section.style.top = '0';
  section.style.left = '0';
  section.style.width = '100vw';
  section.style.height = '100vh';
  section.style.zIndex = '1';

  cardSection.style.willChange = 'transform';
  cardSection.style.position = 'relative';
  cardSection.style.zIndex = '10';

  impactPilotSection.style.willChange = 'opacity, transform';
  impactPilotSection.style.opacity = '0';
  impactPilotSection.style.position = 'relative';
  impactPilotSection.style.top = 'auto';
  impactPilotSection.style.left = 'auto';
  impactPilotSection.style.width = '100vw';
  impactPilotSection.style.height = 'auto';
  impactPilotSection.style.zIndex = '1';

  // Positions
  function recalculatePositions() {
    const sectionRect = section.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    return {
      sectionTop: sectionRect.top + window.scrollY,
      sectionHeight: section.offsetHeight,
      wrapperTop: wrapperRect.top + window.scrollY,
      wrapperHeight: wrapper.offsetHeight,
      maxScale: window.innerWidth / wrapperRect.width,
      cardTop: cardRect.top + window.scrollY,
      cardHeight: card.offsetHeight,
      cardBottom: cardRect.top + window.scrollY + card.offsetHeight
    };
  }

  let positions = recalculatePositions();
  let startZoom = positions.wrapperTop - window.innerHeight * 0.5;
  let endZoom = positions.wrapperTop + positions.wrapperHeight - window.innerHeight;
  const rotationFactor = 80;

  window.addEventListener('resize', function () {
    positions = recalculatePositions();
    startZoom = positions.wrapperTop - window.innerHeight * 0.5;
    endZoom = positions.wrapperTop + positions.wrapperHeight - window.innerHeight;
  });

  let ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    window.requestAnimationFrame(function () {
      const y = window.scrollY;
      const vh = window.innerHeight;

      // 1) Rotate text-ring
      let frac = (y - positions.sectionTop) / positions.sectionHeight;
      frac = Math.min(Math.max(frac, 0), 1);
      const angle = frac * rotationFactor;
      section.style.setProperty('--rotation', `${angle}deg`);

      // 2) Zoom image container
      let t = (y - startZoom) / (endZoom - startZoom);
      t = Math.min(Math.max(t, 0), 1);
      wrapper.style.transform = `scale(${1 + t * (positions.maxScale - 1)})`;

      // 3) Flow control across sections
      const cardScrollStart = positions.cardTop - vh;
      const cardScrollEnd = positions.cardBottom;

      if (y < cardScrollStart) {
        // Before card scroll
        section.style.position = 'sticky';
        section.style.opacity = '1';

        impactPilotSection.style.position = 'relative';
        impactPilotSection.style.opacity = '0';

        cardSection.style.position = 'relative';
        cardSection.style.zIndex = '10';
      }
      else if (y >= cardScrollStart && y <= cardScrollEnd) {
        // While card is scrolling
        section.style.position = 'fixed';
        section.style.top = '0';
        section.style.left = '0';
        section.style.width = '100vw';
        section.style.height = '100vh';
        section.style.zIndex = '1';
        section.style.opacity = '1'; // keep hero visible during card

        // Keep impact+pilot hidden and in normal flow
        impactPilotSection.style.position = 'relative';
        impactPilotSection.style.top = 'auto';
        impactPilotSection.style.left = 'auto';
        impactPilotSection.style.width = '100vw';
        impactPilotSection.style.height = 'auto';
        impactPilotSection.style.zIndex = '1';
        impactPilotSection.style.opacity = '0';

        cardSection.style.position = 'relative';
        cardSection.style.zIndex = '10';
      }
      else {
        // After card fully scrolled
        section.style.position = 'sticky';
        section.style.top = '0';
        section.style.left = '0';
        section.style.width = '100vw';
        section.style.height = '100vh';
        section.style.zIndex = '1';
        section.style.opacity = '0';        // hide hero
        section.classList.add('released');  // allow normal flow if CSS provides override

        impactPilotSection.style.position = 'relative';
        impactPilotSection.style.top = 'auto';
        impactPilotSection.style.left = 'auto';
        impactPilotSection.style.width = '100vw';
        impactPilotSection.style.height = 'auto';
        impactPilotSection.style.zIndex = '1';
        impactPilotSection.style.opacity = '1'; // now visible

        cardSection.style.position = 'relative';
        cardSection.style.zIndex = '10';
      }

      // 4) Header appearance toggle
      if (header) {
        if (y > positions.sectionTop + positions.sectionHeight - header.offsetHeight) {
          body.classList.add('scrolled-past-first');
        } else {
          body.classList.remove('scrolled-past-first');
        }
      }

      ticking = false;
    });
    ticking = true;
  });

  // kick once
  window.dispatchEvent(new Event('scroll'));
});
