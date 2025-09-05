document.addEventListener('DOMContentLoaded', () => {
  // ======================================================
  // Helpers (cart + DOM)
  // ======================================================
  const CART_KEY = 'hawaa_cart';

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const moneyToNumberINR = (txt) => {
    const m = (txt || '').match(/[\d,.]+(?:\.\d+)?/);
    if (!m) return 0;
    return Math.round(parseFloat(m[0].replace(/,/g, '')));
  };

  const inr = new Intl.NumberFormat('en-IN', {
    style:'currency', currency:'INR', maximumFractionDigits:0
  });

  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  };

  const saveCart = (arr) => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(arr)); } catch {}
  };

  const addToCart = (item) => {
    const cart = loadCart();
    const idx = cart.findIndex(x =>
      (x.title || '')   === (item.title || '') &&
      (x.variant || '') === (item.variant || '')
    );
    if (idx >= 0) {
      cart[idx].qty   = Math.max(1, Number(cart[idx].qty || 1)) + (item.qty || 1);
      cart[idx].price = Number(item.price || cart[idx].price || 0);
      if (item.img) cart[idx].img = item.img;
    } else {
      cart.push({
        id: item.id || Math.random().toString(36).slice(2, 10),
        title: item.title,
        price: Number(item.price || 0),
        img: item.img,
        variant: item.variant || '',
        qty: Math.max(1, Number(item.qty || 1)),
      });
    }
    saveCart(cart);
  };

  const readProductMeta = () => {
    const title = $('.product-title')?.textContent?.trim() || 'Hawaa Air Purifier';
    const img   = $('#main-product-image')?.getAttribute('src') || 'images/product-main.jpg';
    return { title, img };
  };

  // ======================================================
  // Frequency / Plan UI state
  // ======================================================
  const freqCards  = $$('.freq-card');
  const planGroup  = $('#plan-group');
  const planSelect = $('#plan-select');
  const planMenu   = $('#plan-menu');
  const planValue  = $('#plan-value');
  const planSavings= $('#plan-savings');

  // default INR text for one-time card (if not present)
  const onetimeSub = document.querySelector('.freq-card[data-freq="onetime"] .freq-sub');
  if (onetimeSub) onetimeSub.textContent = `${inr.format(4999)}/ea`;

  // frequency toggle
  freqCards.forEach(btn => {
    btn.addEventListener('click', () => {
      freqCards.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      const isSub = btn.dataset.freq === 'subscribe';
      if (planGroup) planGroup.style.display = isSub ? '' : 'none';
    });
  });

  // dropdown open/close + options
  if (planSelect && planMenu) {
    planSelect.addEventListener('click', () => {
      planMenu.classList.toggle('open');
      planSelect.classList.toggle('is-open', planMenu.classList.contains('open'));
    });

    planMenu.querySelectorAll('.plan-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        planMenu.querySelectorAll('.plan-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');

        const months = opt.getAttribute('data-months');
        const price  = Number(opt.getAttribute('data-price') || 4599);

        planValue.textContent = `1 filter every ${months} months`;

        const strikeEl  = document.querySelector('.plan-pricing .strike');
        const currentEl = document.querySelector('.plan-pricing .current');
        if (strikeEl)  strikeEl.textContent  = inr.format(4999);
        if (currentEl) currentEl.textContent = `${inr.format(price)}/ea`;

        if (planSavings) planSavings.textContent = `A 1-filter subscription saves you ${inr.format(4800)}/yr`;

        planMenu.classList.remove('open');
        planSelect.classList.remove('is-open');
        planSelect.focus();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!planSelect.contains(e.target) && !planMenu.contains(e.target)) {
        planMenu.classList.remove('open');
        planSelect.classList.remove('is-open');
      }
    });

    // Close on ESC + keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        planMenu.classList.remove('open');
        planSelect.classList.remove('is-open');
        planSelect.focus();
      }
      if (planMenu.classList.contains('open')) {
        const opts = [...planMenu.querySelectorAll('.plan-opt')];
        const i = opts.findIndex(o => o === document.activeElement);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          (opts[i + 1] || opts[0]).focus();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          (opts[i - 1] || opts[opts.length - 1]).focus();
        }
        if (e.key === 'Enter' && document.activeElement?.classList.contains('plan-opt')) {
          document.activeElement.click();
        }
      }
    });
  }

  // Determine selected pricing/variant for cart
  const readActiveOption = () => {
    const activeFreq = $('.freq-card.active');
    const isSub = activeFreq ? activeFreq.dataset.freq === 'subscribe' : false;

    if (!isSub) {
      const p = moneyToNumberINR(onetimeSub?.textContent || '₹4,999');
      return { price: p, variant: 'One-time purchase' };
    }

    const activeOpt = $('.plan-opt.active');
    const months = activeOpt?.getAttribute('data-months') || '4';
    const price  = Number(activeOpt?.getAttribute('data-price') || 4599);
    const variant = `Subscription • Filter every ${months} months`;

    return { price, variant };
  };

  // ======================================================
  // Checkout drawer
  // ======================================================
  function openCheckoutDrawer() {
    document.querySelectorAll('#hawaa-checkout-overlay').forEach(n => n.remove());
    document.querySelectorAll('style[data-hawaa="checkout"]').forEach(s => s.remove());

    const overlay = document.createElement('div');
    overlay.id = 'hawaa-checkout-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="hawaa-overlay-backdrop"></div>
      <div class="hawaa-drawer">
        <iframe class="hawaa-drawer-frame" title="Checkout" src="sections/checkout.html" referrerpolicy="no-referrer"></iframe>
      </div>
    `;

    const style = document.createElement('style');
    style.setAttribute('data-hawaa', 'checkout');
    style.textContent = `
      #hawaa-checkout-overlay{position:fixed;inset:0;z-index:9999;display:grid;grid-template-columns:1fr auto}
      .hawaa-overlay-backdrop{background:rgba(2,6,23,.38)}
      .hawaa-drawer{
        width:560px;max-width:96vw;height:100vh;background:#fff;border-left:1px solid #e5e7eb;
        box-shadow:-8px 0 24px rgba(2,6,23,.12);
        transform:translateX(100%);transition:transform .25s ease
      }
      .hawaa-drawer-frame{width:100%;height:100%;border:0;display:block;background:#fff}
      body.hawaa-no-scroll{overflow:hidden}
      @media (max-width:600px){ .hawaa-drawer{width:94vw} }
    `;

    document.body.appendChild(style);
    document.body.appendChild(overlay);
    document.body.classList.add('hawaa-no-scroll');

    requestAnimationFrame(() => {
      overlay.querySelector('.hawaa-drawer').style.transform = 'translateX(0)';
    });

    function closeDrawerImmediately(){
      document.body.classList.remove('hawaa-no-scroll');
      overlay.remove();
      style.remove();
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('message', onMsg);
    }

    overlay.querySelector('.hawaa-overlay-backdrop')
      .addEventListener('click', closeDrawerImmediately);

    function onMsg(e){
      if (e && e.data && e.data.type === 'hawaa:closeCheckout'){
        closeDrawerImmediately();
      }
    }
    window.addEventListener('message', onMsg);

    function onKeydown(ev){
      if (ev.key === 'Escape') closeDrawerImmediately();
    }
    window.addEventListener('keydown', onKeydown);
  }

  // ======================================================
  // Image gallery
  // ======================================================
  const thumbnails    = document.querySelectorAll('.thumbnail');
  const mainImageElem = document.getElementById('main-product-image');
  const defaultSrc    = mainImageElem ? mainImageElem.src : '';

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const newSrc = thumb.dataset.image;
      const oldSrc = mainImageElem.src;

      mainImageElem.style.opacity = '0';
      setTimeout(() => {
        mainImageElem.src = newSrc;
        mainImageElem.style.opacity = '1';

        thumb.dataset.image = oldSrc;
        const img = thumb.querySelector('img');
        if (img) img.src = oldSrc;

        thumbnails.forEach(t => t.classList.remove('active'));
        if (newSrc !== defaultSrc) thumb.classList.add('active');
      }, 300);
    });
  });

  // ======================================================
  // Accordions
  // ======================================================
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
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
  });

  // ======================================================
  // Add to Cart
  // ======================================================
  function handleAdd(){
    const { title, img }     = readProductMeta();
    const { price, variant } = readActiveOption();
    addToCart({ title, img, price, variant, qty: 1 });
    openCheckoutDrawer();
  }
  document.querySelectorAll('.add-to-cart, .cta-add').forEach(btn => {
    btn.addEventListener('click', handleAdd);
  });
});
