// checkout.js — PhonePe PG integration with Firebase backend

(function(){
  const CART_KEY = 'hawaa_cart';
  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const inr = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });

  // PhonePe Configuration - UPDATED WITH YOUR FIREBASE PROJECT ID
  const PHONEPE_CONFIG = {
    merchantId: 'M01IMCT0B',
    environment: 'UAT', // Change to 'PRODUCTION' for live
    saltIndex: 1,
    baseUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    redirectUrl: 'https://www.hawaa.in/sections/payment-success.html',
    callbackUrl: 'https://hawaa-df1cc.cloudfunctions.net/phonepe-callback',
    initiatePaymentUrl: 'https://hawaa-df1cc.cloudfunctions.net/initiatePhonePePayment'
  };

  // DOM Elements
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
  const viewPayment = $('#view-payment');

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

  // Payment elements
  const paymentAmount = $('#payment-amount');
  const paymentOrderId = $('#payment-order-id');

  // State
  let cart     = [];
  let discount = 0;
  const shippingFlat = 80;
  let step = 'cart';
  let currentOrderId = null;

  // --- Storage helpers ---
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  };
  const saveCart = (arr) => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(arr)); } catch {}
  };

  // --- Utility functions ---
  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `HAWAA_${timestamp}_${random}`;
  };

  const showError = (message) => {
    console.error('Checkout Error:', message);
    alert(message);
  };

  const showSuccess = (message) => {
    console.log('Checkout Success:', message);
    alert(message);
  };

  // --- Totals ---
  const calcSubtotal = () => cart.reduce((s, it) => s + (Number(it.price)||0) * (Number(it.qty)||1), 0);

  function renderTotals(){
    const sub = calcSubtotal();
    const ship = cart.length ? shippingFlat : 0;
    const tot = Math.max(0, sub - discount) + ship;

    subtotalEl.textContent  = inr.format(sub);
    discountEl.textContent  = discount ? `— ${inr.format(discount)}` : '— ₹0';
    shippingEl.textContent  = inr.format(ship);
    totalEl.textContent     = inr.format(tot);
    footTotalEl.textContent = inr.format(tot);
    
    if (paymentAmount) {
      paymentAmount.textContent = inr.format(tot);
    }
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

    // Hide all views first
    viewCart.hidden = true; viewCart.classList.remove('active');
    viewInfo.hidden = true; viewInfo.classList.remove('active');
    viewPayment.hidden = true; viewPayment.classList.remove('active');

    if (step === 'cart'){
      viewCart.hidden = false; viewCart.classList.add('active');
      cartTitle.hidden = false;
      infoHeader.hidden = true;
      nextBtn.dataset.state = 'cart';
      nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span> Next`;
      nextBtn.disabled = false;
      nextBtn.classList.remove('loading');

    } else if (step === 'info') {
      viewInfo.hidden = false; viewInfo.classList.add('active');
      cartTitle.hidden = true;
      infoHeader.hidden = false;
      nextBtn.dataset.state = 'info';
      nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">payment</span> Pay with PhonePe`;
      nextBtn.disabled = false;
      nextBtn.classList.remove('loading');
      customerHead?.setAttribute('aria-expanded','true');
      customerBody?.classList.add('open');
      shippingHead?.setAttribute('aria-expanded','false');
      shippingBody?.classList.remove('open');

    } else if (step === 'payment') {
      viewPayment.hidden = false; viewPayment.classList.add('active');
      cartTitle.hidden = true;
      infoHeader.hidden = false;
      nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">hourglass_empty</span> Processing...`;
      nextBtn.disabled = true;
      nextBtn.classList.add('loading');
      if (paymentOrderId) {
        paymentOrderId.textContent = currentOrderId || '-';
      }
    }

    renderTotals();
    $('#cart-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- PhonePe Payment Integration ---
  async function initiatePhonePePayment(orderData) {
    try {
      currentOrderId = generateOrderId();
      const totalAmount = Math.max(0, orderData.totals.subtotal - orderData.totals.discount) + orderData.totals.shipping;
      const amountInPaise = Math.round(totalAmount * 100);

      const paymentPayload = {
        merchantId: PHONEPE_CONFIG.merchantId,
        merchantTransactionId: currentOrderId,
        merchantUserId: `USER_${Date.now()}`,
        amount: amountInPaise,
        redirectUrl: PHONEPE_CONFIG.redirectUrl,
        redirectMode: 'REDIRECT',
        callbackUrl: PHONEPE_CONFIG.callbackUrl,
        paymentInstrument: {
          type: 'PAY_PAGE'
        },
        merchantOrderId: currentOrderId,
        message: `Payment for order ${currentOrderId}`,
        email: orderData.email,
        mobile: orderData.phone.replace(/\D/g, ''),
        orderDetails: {
          cart: orderData.cart,
          shipping: orderData.shipping,
          totals: orderData.totals
        }
      };

      console.log('Initiating PhonePe payment with payload:', paymentPayload);
      setStep('payment');

      const response = await fetch(PHONEPE_CONFIG.initiatePaymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
        window.top.location.href = result.data.instrumentResponse.redirectInfo.url;
      } else {
        throw new Error(result.message || 'Failed to initiate payment');
      }

    } catch (error) {
      console.error('PhonePe payment initiation failed:', error);
      showError(`Payment initiation failed: ${error.message}`);
      setStep('info');
    }
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
    } else if (code === 'PHONEPE50'){
      discount = Math.min(50, Math.round(sub * 0.05));
      promoMsg.textContent = 'PhonePe special: ₹50 off applied!';
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

    if (email) {
      const emailValid = email.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      email.classList.toggle('cd-invalid', !emailValid);
      if (!emailValid) ok = false;
    }

    if (phone) {
      const phoneValid = phone.value && /^[\+]?[\d\s\-\(\)]{10,}$/.test(phone.value.trim());
      phone.classList.toggle('cd-invalid', !phoneValid);
      if (!phoneValid) ok = false;
    }

    return ok;
  }

  function validateShipping(){
    const reqSel = ['#ship-first','#ship-last','#ship-line1','#ship-city','#ship-state','#ship-zip','#ship-country'];
    let ok = true;
    for (const sel of reqSel){
      const el = $(sel);
      const valid = el && el.value && String(el.value).trim().length > 0;
      el?.classList.toggle('cd-invalid', !valid);
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
  });

  // --- Footer primary button: Next → Pay with PhonePe ---
  nextBtn?.addEventListener('click', () => {
    if (step === 'cart'){
      if (!cart.length){ return; }
      setStep('info');
      return;
    }

    if (step === 'info') {
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

      const orderData = {
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

      initiatePhonePePayment(orderData);
      return;
    }
  });

  // --- Header buttons ---
  backToCart?.addEventListener('click', () => {
    if (step === 'payment') {
      setStep('info');
    } else {
      setStep('cart');
    }
  });

  closeBtn?.addEventListener('click', () => {
    try { window.parent.postMessage({ type:'hawaa:closeCheckout' }, '*'); } catch {}
  });

  $('#continue-shopping')?.addEventListener('click', () => {
    try { window.parent.postMessage({ type:'hawaa:closeCheckout' }, '*'); } catch {}
  });

  // --- Payment status handling ---
  function handlePaymentResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const orderId = urlParams.get('orderId');

    if (status && orderId) {
      if (status === 'success') {
        cart = [];
        saveCart(cart);
        showSuccess('Payment successful! Your order has been placed.');
        
        try { 
          window.parent.postMessage({ 
            type:'hawaa:paymentSuccess', 
            data: { orderId, status } 
          }, '*'); 
        } catch {}
        
      } else if (status === 'failed') {
        showError('Payment failed. Please try again.');
        setStep('info');
        
      } else if (status === 'cancelled') {
        showError('Payment was cancelled.');
        setStep('info');
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // --- Init ---
  function init(){
    cart = loadCart();
    renderCart();
    handlePaymentResult();
    cartTitle.hidden = false;
    infoHeader.hidden = true;
    setStep('cart');
    requestAnimationFrame(() => drawer.classList.add('is-open'));
  }

  init();

})();