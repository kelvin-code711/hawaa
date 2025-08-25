// Sticky Index + Smooth Scroll + Multi-active Scrollspy + buttery easing
(function () {
  const toc = document.querySelector('.toc');
  const tocList = document.getElementById('tocList');
  const article = document.getElementById('article');
  if (!toc || !tocList || !article) return;

  // ----- Build TOC from <section> blocks (stable) -----
  const sections = Array.from(article.querySelectorAll('section'));
  sections.forEach((sec, i) => {
    if (!sec.id) {
      const h2 = sec.querySelector('h2');
      const base = h2 ? h2.textContent.trim() : `Section ${i + 1}`;
      const slug = base.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      sec.id = slug || `section-${i + 1}`;
    }
  });

  const frag = document.createDocumentFragment();
  sections.forEach(sec => {
    const h2 = sec.querySelector('h2');
    const title = (h2 ? h2.textContent.trim() : sec.id);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${sec.id}`;
    a.textContent = title;
    li.appendChild(a);
    frag.appendChild(li);
  });
  tocList.innerHTML = '';
  tocList.appendChild(frag);

  // ----- Smooth scroll with custom easing (cubic-bezier-ish) -----
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  function smoothScrollTo(targetY, duration = 600) {
    if (prefersReduced) {
      window.scrollTo(0, targetY);
      return;
    }
    const startY = window.scrollY;
    const dist = targetY - startY;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      window.scrollTo(0, Math.round(startY + dist * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Offset small nudge to keep headings comfortable from top
  const OFFSET = 8;

  tocList.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - OFFSET;
    smoothScrollTo(y, 650); // slightly longer = smoother
  });

  // ----- Multi-active Scrollspy (highlight all sections visible) -----
  const tocLinks = Array.from(tocList.querySelectorAll('a'));
  const state = new Map(sections.map(sec => [sec.id, false]));

  function setActiveIds(ids) {
    tocLinks.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const active = ids.includes(id);
      a.classList.toggle('active', active);
      if (a.parentElement) a.parentElement.classList.toggle('is-active', active);
    });
  }

  function nearestToTop() {
    let bestId = null, bestDist = Infinity;
    sections.forEach(sec => {
      const d = Math.abs(sec.getBoundingClientRect().top);
      if (d < bestDist) { bestDist = d; bestId = sec.id; }
    });
    return bestId ? [bestId] : [];
  }

  // Use a slightly padded viewport so tiny slivers don’t count
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      state.set(en.target.id, en.isIntersecting);
    });
    const activeIds = Array.from(state.entries())
      .filter(([, inView]) => inView)
      .map(([id]) => id);

    setActiveIds(activeIds.length ? activeIds : nearestToTop());
  }, {
    root: null,
    rootMargin: '-10% 0px -10% 0px',
    threshold: [0.06, 0.12, 0.2, 0.35, 0.5]
  });

  sections.forEach(sec => io.observe(sec));

  // Initial state
  setActiveIds(nearestToTop());
})();

/* =========================
   Header height offset helper
   (prevents content from hiding under fixed header)
   ========================= */
(function(){
  const header = document.getElementById('hawaa-header');
  if (!header) return;

  function setHeaderOffset(){
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  // Set once and on resize
  setHeaderOffset();
  window.addEventListener('resize', setHeaderOffset, { passive: true });
})();
