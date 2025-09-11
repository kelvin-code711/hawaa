/* Cart drawer — background scroll lock, smoother slide, refined quantity UI, merged items, totals in footer */

document.addEventListener('DOMContentLoaded', () => {
  const LS_KEY = 'hawaa_cart';

  // Elements
  const drawer      = document.getElementById('cart-drawer');
  const closeBtn    = drawer.querySelector('.cd-close');
  const itemsEl     = document.getElementById('cart-items');
  const emptyEl     = document.getElementById('cart-empty');
  const promoForm   = document.getElementById('promo-form');
  const promoInput  = document.getElementById('promo-input');
  const promoMsg    = document.getElementById('promo-msg');
  const sumSubtotal = document.getElementById('sum-subtotal');
  const sumDiscount = document.getElementById('sum-discount');
  const sumShipping = document.getElementById('sum-shipping');
  const sumTotal    = document.getElementById('sum-total');
  const footTotal   = document.getElementById('foot-total');   // footer amount (your layout)
  const nextBtn     = document.getElementById('next-btn');     // "Next" button (your layout)

  // State
  let cart = [];
  let discount = 0;
  let shipping = 80;
  let lastFocus = null;
  let lockedScrollY = 0;

  // Helpers
  const currency = (n) => `₹${Math.max(0, Number(n) || 0).toLocaleString('en-IN')}`;
  const loadLS = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  };
  const saveLS = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch {}
  };

  // Merge key so duplicate adds become one line with increased qty
  const makeKey = (it) => {
    const pid  = (it.productId || it.pid || '').toString().trim();
    const sku  = (it.sku || '').toString().trim();
    const varr = (it.variant || it.attrs || '').toString().trim();
    const title= (it.name || it.title || it.productTitle || '').toString().trim();
    const price= Number(it.price || 0);
    const base = pid || sku || `${title}|${varr}`;
    return `${base}|${price}`.toLowerCase();
  };

  function normalizeFromLS(arr) {
    const list = Array.isArray(arr) ? arr : [];
    const merged = new Map();
    for (const raw of list) {
      const key = makeKey(raw);
      const norm = {
        key,
        id: key,
        title: raw.name || raw.title || raw.productTitle || 'Item',
        attrs: raw.variant || raw.attrs || raw.optionsText || '',
        desc:  raw.description || raw.desc || '',
        price: Number(raw.price || 0),
        qty:   Math.max(1, Number(raw.qty || raw.quantity || 1)),
        img:   raw.img || raw.image || ''
      };
      if (merged.has(key)) {
        const m = merged.get(key);
        m.qty = Math.min(99, m.qty + norm.qty);
        merged.set(key, m);
      } else {
        merged.set(key, norm);
      }
    }
    return Array.from(merged.values());
  }

  /* ---------- Scroll lock helpers ---------- */
  function lockScroll() {
    // keep page from moving while drawer is open (desktop + iOS safe)
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add('cd-noscroll');
    document.body.classList.add('cd-noscroll');
    // position:fixed trick avoids iOS background scroll-through
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    document.documentElement.classList.remove('cd-noscroll');
    document.body.classList.remove('cd-noscroll');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
  }

  // Drawer open/close
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-modal', 'true');
    lockScroll();
    setTimeout(() => (drawer.querySelector('.cd-close') || drawer).focus(), 10);
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-modal', 'false');
    unlockScroll();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    try { window.parent?.postMessage?.({ type: 'hawaa:closeCheckout' }, '*'); } catch {}
  }

  // Render
  function render() {
    const isEmpty = cart.length === 0;
    emptyEl.hidden = !isEmpty;
    itemsEl.innerHTML = '';

    if (!isEmpty) {
      cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cd-item';
        li.dataset.id = item.id;
        li.innerHTML = `
          <div class="cd-thumb" aria-hidden="true">
            ${item.img ? `<img src="${item.img}" alt="${item.title}">`
                        : `<span class="material-symbols-rounded">widgets</span>`}
          </div>
          <div class="cd-meta">
            <p class="cd-title">${item.title}</p>
            ${item.attrs ? `<div class="cd-attrs">${item.attrs}</div>` : ''}
            ${item.desc  ? `<div class="cd-desc">${item.desc}</div>`   : ''}
            <div class="cd-qty" role="group" aria-label="Quantity">
              <button class="cd-minus" aria-label="Decrease">
                <span class="material-symbols-rounded">remove</span>
              </button>
              <input class="cd-q" inputmode="numeric" aria-label="Quantity value" value="${item.qty}" />
              <button class="cd-plus" aria-label="Increase">
                <span class="material-symbols-rounded">add</span>
              </button>
            </div>
          </div>
          <div class="cd-pricecol">
            <div class="cd-line">${currency(item.price * item.qty)}</div>
            <button class="cd-remove" type="button">
              <span class="material-symbols-rounded" aria-hidden="true">delete</span>
              Remove
            </button>
          </div>
        `;
        itemsEl.appendChild(li);
      });
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const d        = Math.min(discount, subtotal);
    const total    = Math.max(0, subtotal - d + (cart.length ? shipping : 0));

    sumSubtotal.textContent = currency(subtotal);
    sumDiscount.textContent = d ? `– ${currency(d)}` : '– ₹0';
    sumShipping.textContent = cart.length ? currency(shipping) : '₹0';
    sumTotal.textContent    = currency(total);
    if (footTotal) footTotal.textContent = currency(total);

    if (nextBtn) nextBtn.disabled = cart.length === 0;

    saveLS();
  }

  // Quantity / remove (delegation)
  itemsEl.addEventListener('click', (e) => {
    const row  = e.target.closest('.cd-item'); if (!row) return;
    const id   = row.dataset.id;
    const item = cart.find(i => i.id === id); if (!item) return;

    if (e.target.closest('.cd-minus')) { item.qty = Math.max(1, item.qty - 1); render(); }
    else if (e.target.closest('.cd-plus')) { item.qty = Math.min(99, item.qty + 1); render(); }
    else if (e.target.closest('.cd-remove')) { cart = cart.filter(i => i.id !== id); render(); }
  });

  itemsEl.addEventListener('input', (e) => {
    if (!e.target.classList.contains('cd-q')) return;
    const row  = e.target.closest('.cd-item'); if (!row) return;
    const id   = row.dataset.id;
    const item = cart.find(i => i.id === id); if (!item) return;

    const raw = (e.target.value || '').replace(/[^\d]/g, '');
    const v   = parseInt(raw || '1', 10);
    item.qty  = Math.min(99, Math.max(1, isNaN(v) ? 1 : v));
    e.target.value = String(item.qty);
    render();
  });

  // Promo code
  promoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = (promoInput.value || '').trim().toUpperCase();
    if (!code) { discount = 0; promoMsg.textContent = ''; render(); return; }
    if (code === 'HAWAA10') {
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      discount = Math.min(800, Math.round(subtotal * 0.10));
      promoMsg.textContent = `Applied HAWAA10 — ${currency(discount)} off`;
      promoMsg.style.color = 'var(--cd-success)';
    } else {
      discount = 0;
      promoMsg.textContent = 'Invalid code';
      promoMsg.style.color = 'var(--cd-danger)';
    }
    render();
  });

  // Close
  closeBtn.addEventListener('click', closeDrawer);

  // Esc + basic focus trap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
    const focusables = drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // React to storage changes (e.g., same item added again while open)
  window.addEventListener('storage', (e) => {
    if (e.key !== LS_KEY) return;
    cart = normalizeFromLS(loadLS());
    render();
  });

  // Init
  cart = normalizeFromLS(loadLS());
  render();
  openDrawer();

  // Optional: Continue shopping closes overlay
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cd-continue')) closeDrawer();
  });

  // Next button stub
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      try { window.parent?.postMessage?.({ type: 'hawaa:checkoutNext' }, '*'); } catch {}
    });
  }
});
