// checkout.js — preserves your UI, enforces Outfit, loads order from localStorage,
// Save & Continue buttons below fields (right-aligned), no info icon,
// BACK TO CART strictly hidden on Cart step, shown only on Info step.

(function(){
  const CART_KEY = 'hawaa_cart'; // same key as product page (order fetching)
  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const inr = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });

  // DOM
  const drawer      = $('#cart-drawer');
  const listEl      = $('#cart-items');
  const emptyEl     = $('#cart-empty');
  const subtotalEl  = $('#sum-subtotal');
  const discountEl  = $('#sum-discount');
  const shippingEl  = $('#sum-shipping');
  const totalEl     = $('#sum-total');
  const footTotalEl = $('#foot-total');
  const promoForm   = $('#promo-form');
  const promoInput  = $('#promo-input');
  const promoMsg    = $('#promo-msg');
  const nextBtn     = $('#next-btn');
  const closeBtn    = $('#close-btn');

  const viewCart    = $('#view-cart');
  const viewInfo    = $('#view-info');

  // Header pieces
  const cartTitle   = $('#cart-title');
  const infoHeader  = $('#info-header');
  const backToCart  = $('#back-to-cart');

  // Accordions + fields
  const accRoot     = $('#info-accordions');
  const customerHead= document.querySelector('.cd-acc-customer .cd-acc-head');
  const customerBody= $('#acc-customer');
  const shippingHead= document.querySelector('.cd-acc-shipping .cd-acc-head');
  const shippingBody= $('#acc-shipping');

  const saveCustomerBtn = document.querySelector('.cd-acc-customer .cd-save-continue');
  const saveShippingBtn = document.querySelector('.cd-acc-shipping .cd-save-continue');

  // State
  let cart     = [];
  let discount = 0;
  const shippingFlat = 80;
  let step = 'cart'; // 'cart' | 'info'

  // --- Storage helpers ---
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  };
  const saveCart = (arr) => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(arr)); } catch {}
  };

  // --- Totals ---
  const calcSubtotal = () => cart.reduce((s, it) => s + (Number(it.price)||0) * (Number(it.qty)||1), 0);

  function renderTotals(){
    const sub = calcSubtotal();
    const ship = cart.length ? shippingFlat : 0;
    const tot = Math.max(0, sub - discount) + ship;

    subtotalEl.textContent  = inr.format(sub);
    discountEl.textContent  = discount ? `– ${inr.format(discount)}` : '– ₹0';
    shippingEl.textContent  = inr.format(ship);
    totalEl.textContent     = inr.format(tot);
    footTotalEl.textContent = inr.format(tot);
  }

  // --- Cart render ---
  function renderCart(){
    listEl.innerHTML = '';
    if (!cart.length){
      emptyEl.hidden = false;
      renderTotals();
      return;
    }
    emptyEl.hidden = true;

    for (const item of cart){
      const li = document.createElement('li');
      li.className = 'cd-item';
      li.innerHTML = `
        <div class="cd-thumb"><img alt="" src="${item.img || ''}"></div>
        <div class="cd-meta">
          <h4 class="cd-title">${item.title || ''}</h4>
          <div class="cd-attrs">${item.variant || ''}</div>
          <div class="cd-qty" data-id="${item.id}">
            <button type="button" class="qty-dec" data-glyph="−" aria-label="Decrease"></button>
            <input class="qty-input" inputmode="numeric" value="${item.qty || 1}" aria-label="Quantity">
            <button type="button" class="qty-inc" data-glyph="+" aria-label="Increase"></button>
          </div>
        </div>
        <div class="cd-pricecol">
          <div class="cd-line">${inr.format(item.price || 0)}</div>
          <button class="cd-remove" type="button" data-id="${item.id}">
            <span class="material-symbols-rounded" aria-hidden="true">delete</span>
            Remove
          </button>
        </div>
      `;
      listEl.appendChild(li);
    }

    renderTotals();
  }

  // --- Step management ---
  function setStep(next){
    step = next;

    if (step === 'cart'){
      // Views
      viewCart.hidden = false; viewCart.classList.add('active');
      viewInfo.hidden = true;  viewInfo.classList.remove('active');

      // Header: title visible, back button hidden (force)
      cartTitle.hidden = false;
      infoHeader.hidden = true;                // attribute
      infoHeader.style.display = '';           // clear inline styles if any
      // (CSS has .cd-infohead[hidden]{display:none!important} to hard-hide)

      // Footer button
      nextBtn.dataset.state = 'cart';
      nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span> Next`;
    } else {
      // Views
      viewCart.hidden = true;  viewCart.classList.remove('active');
      viewInfo.hidden = false; viewInfo.classList.add('active');

      // Header: title hidden, back button shown
      cartTitle.hidden = true;
      infoHeader.hidden = false;

      // Footer button
      nextBtn.dataset.state = 'info';
      nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">payment</span> Continue to pay`;

      // Default accordion states
      customerHead?.setAttribute('aria-expanded','true');
      customerBody?.classList.add('open');
      shippingHead?.setAttribute('aria-expanded','false');
      shippingBody?.classList.remove('open');
    }

    renderTotals();
    // scroll to top of drawer body
    $('#cart-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Quantity / Remove handlers (delegated) ---
  listEl.addEventListener('click', (e) => {
    const dec = e.target.closest('.qty-dec');
    const inc = e.target.closest('.qty-inc');
    const rem = e.target.closest('.cd-remove');

    if (rem){
      const id = rem.getAttribute('data-id');
      cart = cart.filter(x => String(x.id) !== String(id));
      saveCart(cart);
      renderCart();
      return;
    }

    const ctrl = dec || inc;
    if (!ctrl) return;

    const wrap = ctrl.closest('.cd-qty');
    const id   = wrap?.getAttribute('data-id');
    const input= wrap?.querySelector('.qty-input');
    const item = cart.find(x => String(x.id) === String(id));
    if (!item || !input) return;

    let q = Number(input.value || 1);
    if (dec) q = Math.max(1, q - 1);
    if (inc) q = Math.max(1, q + 1);
    input.value = q;
    item.qty = q;
    saveCart(cart);
    renderTotals();
  });

  listEl.addEventListener('change', (e) => {
    const input = e.target.closest('.qty-input');
    if (!input) return;
    const wrap = input.closest('.cd-qty');
    const id   = wrap?.getAttribute('data-id');
    const item = cart.find(x => String(x.id) === String(id));
    if (!item) return;
    let q = parseInt((input.value||'').replace(/\D+/g,'')) || 1;
    q = Math.max(1, q);
    input.value = q;
    item.qty = q;
    saveCart(cart);
    renderTotals();
  });

  // --- Promo code demo ---
  promoForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = (promoInput?.value || '').trim().toUpperCase();
    const sub = calcSubtotal();

    if (!code){
      discount = 0; promoMsg.textContent = ''; renderTotals(); return;
    }
    if (code === 'SAVE10'){
      discount = Math.round(sub * 0.10);
      promoMsg.textContent = 'Applied 10% off.';
    } else {
      discount = 0; promoMsg.textContent = 'Invalid code.';
    }
    renderTotals();
  });

  // --- Validation helpers for Info step ---
  function validateCustomer(){
    const email = $('#cust-email');
    const phone = $('#cust-phone');
    let ok = true;

    for (const el of [email, phone]){
      const valid = el && el.value && String(el.value).trim().length > 0;
      el.classList.toggle('cd-invalid', !valid);
      if (!valid) ok = false;
    }
    return ok;
  }

  function validateShipping(){
    const reqSel = ['#ship-first','#ship-last','#ship-line1','#ship-city','#ship-state','#ship-zip','#ship-country'];
    let ok = true;
    for (const sel of reqSel){
      const el = $(sel);
      const valid = el && el.value && String(el.value).trim().length > 0;
      el.classList.toggle('cd-invalid', !valid);
      if (!valid) ok = false;
    }
    return ok;
  }

  // --- Accordion header toggle (expand/collapse) ---
  accRoot?.addEventListener('click', (e) => {
    const head = e.target.closest('.cd-acc-head');
    if (!head) return;

    const expanded = head.getAttribute('aria-expanded') === 'true';
    head.setAttribute('aria-expanded', expanded ? 'false' : 'true');

    const body = head.nextElementSibling;
    if (body) body.classList.toggle('open', !expanded);
  });

  // --- Save & Continue buttons (below fields) ---
  saveCustomerBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validateCustomer()){
      customerHead?.setAttribute('aria-expanded','true');
      customerBody?.classList.add('open');
      return;
    }
    // Close customer, open shipping
    customerHead?.setAttribute('aria-expanded','false');
    customerBody?.classList.remove('open');
    shippingHead?.setAttribute('aria-expanded','true');
    shippingBody?.classList.add('open');
  });

  saveShippingBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validateShipping()){
      shippingHead?.setAttribute('aria-expanded','true');
      shippingBody?.classList.add('open');
      return;
    }
    // Shipping saved — user will tap "Continue to pay"
  });

  // --- Footer primary button: Next → Continue to pay ---
  nextBtn?.addEventListener('click', () => {
    if (step === 'cart'){
      if (!cart.length){ return; }
      setStep('info');
      return;
    }

    // On info step, ensure both groups valid before continuing to pay
    const okCustomer = validateCustomer();
    const okShipping = validateShipping();

    if (!okCustomer){
      customerHead?.setAttribute('aria-expanded','true');
      customerBody?.classList.add('open');
    }
    if (!okShipping){
      shippingHead?.setAttribute('aria-expanded','true');
      shippingBody?.classList.add('open');
    }
    if (!(okCustomer && okShipping)) return;

    // Build payload
    const payload = {
      email: $('#cust-email').value.trim(),
      phone: $('#cust-phone').value.trim(),
      shipping: {
        firstName: $('#ship-first').value.trim(),
        lastName:  $('#ship-last').value.trim(),
        line1:     $('#ship-line1').value.trim(),
        line2:     $('#ship-line2').value.trim(),
        city:      $('#ship-city').value.trim(),
        state:     $('#ship-state').value.trim(),
        zip:       $('#ship-zip').value.trim(),
        country:   $('#ship-country').value
      },
      totals: {
        subtotal: calcSubtotal(),
        discount,
        shipping: cart.length ? 80 : 0
      },
      cart
    };

    // Notify parent page to proceed to payment step
    try { window.parent.postMessage({ type:'hawaa:continueToPayment', data: payload }, '*'); } catch {}
  });

  // --- Header buttons ---
  backToCart?.addEventListener('click', () => setStep('cart'));

  closeBtn?.addEventListener('click', () => {
    try { window.parent.postMessage({ type:'hawaa:closeCheckout' }, '*'); } catch {}
  });

  $('#continue-shopping')?.addEventListener('click', () => {
    try { window.parent.postMessage({ type:'hawaa:closeCheckout' }, '*'); } catch {}
  });

  // --- Init ---
  function init(){
    cart = loadCart();  // order fetching retained
    renderCart();

    // FORCE initial state to Cart: show title, hide back button
    cartTitle.hidden = false;
    infoHeader.hidden = true;

    setStep('cart');
    requestAnimationFrame(() => drawer.classList.add('is-open'));
  }
  init();

})();
