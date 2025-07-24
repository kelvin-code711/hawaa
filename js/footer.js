document.addEventListener('DOMContentLoaded', () => {
  // Only run mobile accordion if viewport ≤ 767px
  if (window.innerWidth <= 767) initMobileFooter();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 767) initMobileFooter();
    }, 150);
  });
});

function initMobileFooter() {
  // You can replace these with your own icon URLs
  const expandIcon = 'icons/expand.svg';
  const collapseIcon = 'icons/collapse.svg';

  // Inject mobile-only CSS for the expand/collapse icons
  let styleEl = document.getElementById('mobile-footer-icons');
  if (styleEl) styleEl.remove();
  styleEl = document.createElement('style');
  styleEl.id = 'mobile-footer-icons';
  styleEl.textContent = `
    @media (max-width: 767px) {
      .footer-column h3::after {
        background-image: url("${expandIcon}") !important;
      }
      .footer-column.expanded h3::after {
        background-image: url("${collapseIcon}") !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Set up each column as a toggle
  document.querySelectorAll('.footer-column').forEach(col => {
    const heading = col.querySelector('h3');
    const list    = col.querySelector('ul');
    if (!heading || !list) return;

    // remove old listeners
    const newHeading = heading.cloneNode(true);
    heading.parentNode.replaceChild(newHeading, heading);

    newHeading.setAttribute('role', 'button');
    newHeading.setAttribute('tabindex', '0');
    newHeading.setAttribute('aria-expanded', 'false');
    list.setAttribute('aria-hidden', 'true');
    list.style.maxHeight = '0px';

    newHeading.addEventListener('click', e => {
      e.preventDefault();
      col.classList.toggle('expanded');
      const expanded = col.classList.contains('expanded');
      newHeading.setAttribute('aria-expanded', expanded);
      list.setAttribute('aria-hidden', !expanded);
      if (expanded) {
        list.style.maxHeight = list.scrollHeight + 'px';
      } else {
        list.style.maxHeight = '0px';
      }
    });

    newHeading.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        newHeading.click();
      }
    });
  });
}
