document.addEventListener('DOMContentLoaded', () => {
  // — MENU TOGGLE —
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav  = document.getElementById('mobile-nav');
  const navClose   = document.getElementById('nav-close');
  const navOverlay = document.getElementById('nav-overlay');

  function toggleMenu() {
    document.body.classList.toggle('menu-open');
    mobileNav.classList.toggle('active');
  }
  if (menuToggle && navClose && navOverlay && mobileNav) {
    menuToggle.addEventListener('click', toggleMenu);
    navClose.addEventListener('click',   toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);
  }

  // — IMAGE GALLERY —
  const thumbnails    = document.querySelectorAll('.thumbnail');
  const mainImageElem = document.getElementById('main-product-image');
  const defaultSrc    = mainImageElem.src;

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const newSrc = thumb.dataset.image;
      const oldSrc = mainImageElem.src;

      mainImageElem.style.opacity = '0';
      setTimeout(() => {
        mainImageElem.src        = newSrc;
        mainImageElem.style.opacity = '1';

        thumb.dataset.image             = oldSrc;
        thumb.querySelector('img').src  = oldSrc;

        thumbnails.forEach(t => t.classList.remove('active'));
        if (newSrc !== defaultSrc) thumb.classList.add('active');
      }, 300);
    });
  });

  // — PURCHASE OPTION TABS —
  const tabs     = document.querySelectorAll('.option-tab');
  const contents = document.querySelectorAll('.option-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const opt = tab.dataset.option;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      contents.forEach(c => c.classList.toggle('active', c.classList.contains(opt)));
    });
  });

  // — ADD TO CART / SUBSCRIBE BUTTONS —
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const isSub = btn.closest('.option-content').classList.contains('subscription');
      if (!isSub) {
        console.log('Added to cart: One-time purchase ₹4,999');
      } else {
        const freq = document.querySelector('.subscription-dropdown')?.value;
        console.log(`Subscribed: ₹4,599 + filter every ${freq} months (₹899/mo)`);
      }
      // TODO: hook into real cart/checkout logic
    });
  });

  // — ACCORDION DROPDOWNS —
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item    = header.parentElement;         // .accordion-item
      const content = header.nextElementSibling;    // .accordion-content
      const open    = item.classList.contains('active');

      if (open) {
        item.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

});
