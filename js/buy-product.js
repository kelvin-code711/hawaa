// buy-product.js — Transparent iframe drawer + single blurred overlay

document.addEventListener('DOMContentLoaded', () => {
  // ======================================================
  // Helpers
  // ======================================================
  const CART_KEY = 'hawaa_cart';
  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const moneyToNumberINR = (txt) => {
    const m = (txt || '').match(/[\d,.]+(?:\.\d+)?/);
    if (!m) return 0;
    return Math.round(parseFloat(m[0].replace(/,/g, '')));
  };

  const inr = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });

  const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
  const saveCart = (arr) => { try { localStorage.setItem(CART_KEY, JSON.stringify(arr)); } catch {} };

  const addToCart = (item) => {
    const cart = loadCart();
    const idx = cart.findIndex(x => (x.title||'')=== (item.title||'') && (x.variant||'') === (item.variant||''));
    if (idx >= 0) {
      cart[idx].qty   = Math.max(1, Number(cart[idx].qty || 1)) + (item.qty || 1);
      cart[idx].price = Number(item.price || cart[idx].price || 0);
      if (item.img) cart[idx].img = item.img;
    } else {
      cart.push({
        id: item.id || Math.random().toString(36).slice(2,10),
        title: item.title,
        price: Number(item.price || 0),
        img: item.img,
        variant: item.variant || '',
        qty: Math.max(1, Number(item.qty || 1)),
      });
    }
    saveCart(cart);
  };

  const readProductMeta = () => ({
    title: $('.product-title')?.textContent?.trim() || 'Hawaa Air Purifier',
    img:   $('#main-product-image')?.getAttribute('src') || 'images/product-main.jpg'
  });

  // ======================================================
  // Cached elements
  // ======================================================
  const freqWrap   = $('.freq');
  const planGroup  = $('#plan-group');
  const planSelect = $('#plan-select');
  const planMenu   = $('#plan-menu');
  const planValue  = $('#plan-value');
  const planSavings= $('#plan-savings');
  const onetimeSub = document.querySelector('.freq-card[data-freq="onetime"] .freq-sub');

  // default INR text for one-time (if empty)
  if (onetimeSub && !/\d/.test(onetimeSub.textContent)) onetimeSub.textContent = `${inr.format(4999)}/ea`;

  // ======================================================
  // Frequency toggle (delegated)
  // ======================================================
  function setActiveFrequency(btn){
    if (!btn) return;
    const cards = $$('.freq-card', freqWrap);
    for (const b of cards){
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      const icon = b.querySelector('.freq-check');
      if (icon) icon.textContent = isActive ? 'check_circle' : 'radio_button_unchecked';
    }
    const isSub = btn.dataset.freq === 'subscribe';
    if (planGroup) planGroup.style.display = isSub ? '' : 'none';
  }

  if (freqWrap){
    freqWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.freq-card');
      if (!btn || !freqWrap.contains(btn)) return;
      setActiveFrequency(btn);
    });
    // initial state (respect pre-marked .active or default to first)
    setActiveFrequency($('.freq-card.active', freqWrap) || $('.freq-card', freqWrap));
  }

  // ======================================================
  // Plan dropdown (delegated + aria hygiene)
  // ======================================================
  function openMenu(open){
    if (!planMenu || !planSelect) return;
    planMenu.classList.toggle('open', open);
    planSelect.classList.toggle('is-open', open);
    planMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  if (planSelect){
    planSelect.addEventListener('click', () => openMenu(!planMenu.classList.contains('open')));
  }

  if (planMenu){
    planMenu.addEventListener('click', (e) => {
      const opt = e.target.closest('.plan-opt');
      if (!opt) return;

      // activate chosen option
      $$('.plan-opt', planMenu).forEach(o => o.classList.remove('active'));
      opt.classList.add('active');

      const months = opt.getAttribute('data-months') || '4';
      const price  = Number(opt.getAttribute('data-price') || 4599);

      if (planValue) planValue.textContent = `1 filter every ${months} months`;

      const strikeEl  = document.querySelector('.plan-pricing .strike');
      const currentEl = document.querySelector('.plan-pricing .current');
      if (strikeEl)  strikeEl.textContent  = inr.format(4999);
      if (currentEl) currentEl.textContent = `${inr.format(price)}/ea`;

      if (planSavings) planSavings.textContent = `A 1-filter subscription saves you ${inr.format(4800)}/yr`;

      openMenu(false);
      planSelect.focus();
    });
  }

  // Close menu on outside click (single global listener)
  document.addEventListener('click', (e) => {
    if (!planSelect || !planMenu) return;
    if (!planSelect.contains(e.target) && !planMenu.contains(e.target)) openMenu(false);
  });

  // Keyboard support with minimal work
  document.addEventListener('keydown', (e) => {
    if (!planMenu?.classList.contains('open')) return;
    if (e.key === 'Escape') { openMenu(false); planSelect?.focus(); return; }

    const opts = $$('.plan-opt', planMenu);
    if (!opts.length) return;

    const i = opts.findIndex(o => o === document.activeElement);
    if (e.key === 'ArrowDown'){ e.preventDefault(); (opts[i+1] || opts[0]).focus(); }
    if (e.key === 'ArrowUp'){   e.preventDefault(); (opts[i-1] || opts[opts.length-1]).focus(); }
    if (e.key === 'Enter' && document.activeElement?.classList.contains('plan-opt')){
      document.activeElement.click();
    }
  });

  // ======================================================
  // Image gallery (delegated)
  // ======================================================
  const mainImageElem = $('#main-product-image');
  const thumbWrap     = mainImageElem?.closest('.main-image');
  const defaultSrc    = mainImageElem ? mainImageElem.src : '';

  if (thumbWrap){
    thumbWrap.addEventListener('click', (e) => {
      const thumb = e.target.closest('.thumbnail');
      if (!thumb) return;

      const newSrc = thumb.dataset.image;
      const oldSrc = mainImageElem.src;

      // fade swap
      mainImageElem.style.opacity = '0';
      setTimeout(() => {
        mainImageElem.src = newSrc;
        mainImageElem.style.opacity = '1';

        // swap thumb image to the old main image for quick toggling effect
        thumb.dataset.image = oldSrc;
        const img = thumb.querySelector('img'); if (img) img.src = oldSrc;

        $$('.thumbnail', thumbWrap).forEach(t => t.classList.remove('active'));
        if (newSrc !== defaultSrc) thumb.classList.add('active');
      }, 300);
    });
  }

  // ======================================================
  // Accordions (delegated)
  // ======================================================
  const accRoot = $('.product-accordions');
  if (accRoot){
    accRoot.addEventListener('click', (e) => {
      const header = e.target.closest('.accordion-header');
      if (!header) return;
      const item    = header.parentElement;
      const content = header.nextElementSibling;
      const open    = item.classList.contains('active');

      if (open) {
        item.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  }

  // ======================================================
  // Selected option for cart
  // ======================================================
  function readActiveOption(){
    const activeFreq = $('.freq-card.active', freqWrap);
    const isSub = activeFreq ? activeFreq.dataset.freq === 'subscribe' : false;

    if (!isSub) {
      const p = moneyToNumberINR(onetimeSub?.textContent || '₹4,999');
      return { price: p, variant: 'One-time purchase' };
    }

    const activeOpt = $('.plan-opt.active', planMenu);
    const months = activeOpt?.getAttribute('data-months') || '4';
    const price  = Number(activeOpt?.getAttribute('data-price') || 4599);
    return { price, variant: `Subscription • Filter every ${months} months` };
  }

  // ======================================================
  // Checkout drawer — add ONE blurred overlay under iframe
  // ======================================================
  function openCheckoutDrawer(){
    // Clean any previous nodes/listeners
    document.getElementById('hawaa-checkout-frame')?.remove();
    document.getElementById('hawaa-blur-layer')?.remove();

    // Create blur layer (single, transparent, blurred)
    const blur = document.createElement('div');
    blur.id = 'hawaa-blur-layer';
    Object.assign(blur.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483644',
      background: 'rgba(2, 6, 23, 0.28)', // subtle tint
      backdropFilter: 'blur(3px) saturate(120%)',
      WebkitBackdropFilter: 'blur(3px) saturate(120%)'
    });

    // Clicking blur closes the drawer
    blur.addEventListener('click', closeDrawer);

    // Create right-docked iframe (stays above blur)
    const iframe = document.createElement('iframe');
    iframe.id = 'hawaa-checkout-frame';
    iframe.title = 'Cart';
    iframe.src = 'sections/checkout.html';
    Object.assign(iframe.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: 'min(100vw, 408px)',  // should match drawer width
      height: '100vh',
      border: '0',
      background: 'transparent',
      zIndex: '2147483645'         // above blur layer
    });
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('referrerpolicy', 'no-referrer');

    // Close handlers
    function onMsg(e){
      if (e?.data?.type === 'hawaa:closeCheckout') closeDrawer();
    }
    function onEsc(ev){
      if (ev.key === 'Escape') closeDrawer();
    }
    function closeDrawer(){
      iframe.remove();
      blur.remove();
      window.removeEventListener('message', onMsg);
      document.removeEventListener('keydown', onEsc);
    }

    window.addEventListener('message', onMsg);
    document.addEventListener('keydown', onEsc);

    // Add to DOM (blur first, then iframe)
    document.body.appendChild(blur);
    document.body.appendChild(iframe);
  }

  // ======================================================
  // Add to cart (delegated to page)
  // ======================================================
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart, .cta-add');
    if (!addBtn) return;
    const { title, img }     = readProductMeta();
    const { price, variant } = readActiveOption();
    addToCart({ title, img, price, variant, qty:1 });
    openCheckoutDrawer();
  });
});
