
document.addEventListener('DOMContentLoaded', () => {
  const columns = Array.from(document.querySelectorAll('.footer-column[data-accordion]'));
  const triggers = Array.from(document.querySelectorAll('.accordion-trigger'));
  const panels = Array.from(document.querySelectorAll('.accordion-panel'));
  const mobileMQ = window.matchMedia('(max-width: 640px)');

  function enableAccordions() {
    columns.forEach(col => col.classList.remove('open'));
    triggers.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
    panels.forEach(panel => panel.style.maxHeight = '0px');
  }
  function disableAccordions() {
    columns.forEach(col => col.classList.add('open'));
    triggers.forEach(btn => btn.setAttribute('aria-expanded', 'true'));
    panels.forEach(panel => panel.style.maxHeight = 'none');
  }
  function syncMode() {
    mobileMQ.matches ? enableAccordions() : disableAccordions();
  }

  // Toggle on click (mobile only)
  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!mobileMQ.matches) return;
      const col = btn.closest('.footer-column');
      const panel = col.querySelector('.accordion-panel');
      const isOpen = col.classList.contains('open');

      if (isOpen) {
        col.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        requestAnimationFrame(() => { panel.style.maxHeight = '0px'; });
      } else {
        // close siblings (single-open)
        columns.forEach(c => {
          if (c !== col) {
            c.classList.remove('open');
            const p = c.querySelector('.accordion-panel');
            const t = c.querySelector('.accordion-trigger');
            if (p) p.style.maxHeight = '0px';
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });
        col.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  // Re-compute open panel heights on resize (mobile)
  window.addEventListener('resize', () => {
    if (!mobileMQ.matches) return;
    document.querySelectorAll('.footer-column.open .accordion-panel').forEach(p => {
      p.style.maxHeight = p.scrollHeight + 'px';
    });
  });

  // Watch breakpoint
  if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', syncMode);
  else mobileMQ.addListener(syncMode);

  syncMode();
});