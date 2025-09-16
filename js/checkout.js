// checkout.js — OPTIMIZED VERSION
// Reduces DOM queries, implements debouncing, improves performance

(function(){
  'use strict'; // Enable strict mode for better performance
  
  const CART_KEY = 'hawaa_cart';
  const DEBOUNCE_DELAY = 150; // ms for input debouncing
  
  // Optimized DOM selectors - cache frequently used elements
  const DOM = {
    drawer: null,
    listEl: null,
    emptyEl: null,
    subtotalEl: null,
    discountEl: null,
    shippingEl: null,
    totalEl: null,
    footTotalEl: null,
    promoForm: null,
    promoInput: null,
    promoMsg: null,
    nextBtn: null,
    closeBtn: null,
    viewCart: null,
    viewInfo: null,
    cartTitle: null,
    infoHeader: null,
    backToCart: null,
    accRoot: null,
    customerHead: null,
    customerBody: null,
    shippingHead: null,
    shippingBody: null,
    saveCustomerBtn: null,
    saveShippingBtn: null,
    scrollContainer: null
  };

  // Performance optimized selectors
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  
  // Currency formatter - create once, reuse
  const inr = new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  });

  // State management
  let cart = [];
  let discount = 0;
  const shippingFlat = 80;
  let step = 'cart';
  
  // Debounce utility for input handling
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Optimized RAF wrapper for smooth animations
  const scheduleUpdate = (() => {
    let rafId = null;
    let callbacks = [];
    
    const flush = () => {
      const cbs = callbacks.slice();
      callbacks.length = 0;
      rafId = null;
      cbs.forEach(cb => cb());
    };
    
    return (callback) => {
      callbacks.push(callback);
      if (!rafId) {
        rafId = requestAnimationFrame(flush);
      }
    };
  })();

  // --- Storage helpers with error handling ---
  const loadCart = () => {
    try { 
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    catch (error) { 
      console.warn('Failed to load cart from localStorage:', error);
      return []; 
    }
  };
  
  const saveCart = (arr) => {
    try { 
      localStorage.setItem(CART_KEY, JSON.stringify(arr)); 
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  };

  // --- Optimized calculation functions ---
  const calcSubtotal = () => cart.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.qty) || 1);
  }, 0);

  // Batch DOM updates to prevent layout thrashing
  function updateTotals(){
    const sub = calcSubtotal();
    const ship = cart.length ? shippingFlat : 0;
    const tot = Math.max(0, sub - discount) + ship;
    
    // Batch all DOM updates
    scheduleUpdate(() => {
      if (DOM.subtotalEl) DOM.subtotalEl.textContent = inr.format(sub);
      if (DOM.discountEl) DOM.discountEl.textContent = discount ? `− ${inr.format(discount)}` : '− ₹0';
      if (DOM.shippingEl) DOM.shippingEl.textContent = inr.format(ship);
      if (DOM.totalEl) DOM.totalEl.textContent = inr.format(tot);
      if (DOM.footTotalEl) DOM.footTotalEl.textContent = inr.format(tot);
    });
  }

  // --- Optimized cart rendering with DocumentFragment ---
  function renderCart(){
    if (!DOM.listEl) return;
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (!cart.length){
      DOM.emptyEl && (DOM.emptyEl.hidden = false);
      DOM.listEl.innerHTML = '';
      updateTotals();
      return;
    }
    
    DOM.emptyEl && (DOM.emptyEl.hidden = true);

    // Build all items in memory first
    cart.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cd-item';
      
      // Use template literal with proper escaping
      li.innerHTML = `
        <div class="cd-thumb">
          <img alt="${escapeHtml(item.title || '')}" src="${escapeHtml(item.img || '')}" loading="lazy">
        </div>
        <div class="cd-meta">
          <h4 class="cd-title">${escapeHtml(item.title || '')}</h4>
          <div class="cd-attrs">${escapeHtml(item.variant || '')}</div>
          <div class="cd-qty" data-id="${escapeHtml(item.id)}">
            <button type="button" class="qty-dec" data-glyph="−" aria-label="Decrease quantity"></button>
            <input class="qty-input" inputmode="numeric" value="${item.qty || 1}" aria-label="Quantity" min="1">
            <button type="button" class="qty-inc" data-glyph="+" aria-label="Increase quantity"></button>
          </div>
        </div>
        <div class="cd-pricecol">
          <div class="cd-line">${inr.format(item.price || 0)}</div>
          <button class="cd-remove" type="button" data-id="${escapeHtml(item.id)}">
            <span class="material-symbols-rounded" aria-hidden="true">delete</span>
            Remove
          </button>
        </div>
      `;
      fragment.appendChild(li);
    });

    // Single DOM update
    DOM.listEl.innerHTML = '';
    DOM.listEl.appendChild(fragment);
    updateTotals();
  }

  // HTML escaping utility
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Optimized step management ---
  function setStep(nextStep){
    if (step === nextStep) return; // Avoid unnecessary updates
    
    step = nextStep;

    scheduleUpdate(() => {
      if (step === 'cart'){
        // Show cart view
        DOM.viewCart && (DOM.viewCart.hidden = false, DOM.viewCart.classList.add('active'));
        DOM.viewInfo && (DOM.viewInfo.hidden = true, DOM.viewInfo.classList.remove('active'));

        // Update header
        DOM.cartTitle && (DOM.cartTitle.hidden = false);
        DOM.infoHeader && (DOM.infoHeader.hidden = true);

        // Update footer button
        if (DOM.nextBtn) {
          DOM.nextBtn.dataset.state = 'cart';
          DOM.nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span> Next`;
        }
      } else {
        // Show info view
        DOM.viewCart && (DOM.viewCart.hidden = true, DOM.viewCart.classList.remove('active'));
        DOM.viewInfo && (DOM.viewInfo.hidden = false, DOM.viewInfo.classList.add('active'));

        // Update header
        DOM.cartTitle && (DOM.cartTitle.hidden = true);
        DOM.infoHeader && (DOM.infoHeader.hidden = false);

        // Update footer button
        if (DOM.nextBtn) {
          DOM.nextBtn.dataset.state = 'info';
          DOM.nextBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">payment</span> Continue to pay`;
        }

        // Set default accordion states
        DOM.customerHead?.setAttribute('aria-expanded','true');
        DOM.customerBody?.classList.add('open');
        DOM.shippingHead?.setAttribute('aria-expanded','false');
        DOM.shippingBody?.classList.remove('open');
      }

      updateTotals();
      
      // Smooth scroll to top
      DOM.scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Optimized quantity handlers with debouncing ---
  const debouncedQtyUpdate = debounce((item, newQty) => {
    item.qty = Math.max(1, newQty);
    saveCart(cart);
    updateTotals();
  }, DEBOUNCE_DELAY);

  // Event delegation for better performance
  function handleListClick(e) {
    const target = e.target;
    const button = target.closest('button');
    
    if (!button) return;

    if (button.classList.contains('cd-remove')) {
      const id = button.getAttribute('data-id');
      cart = cart.filter(x => String(x.id) !== String(id));
      saveCart(cart);
      renderCart();
      return;
    }

    if (button.classList.contains('qty-dec') || button.classList.contains('qty-inc')) {
      const wrap = button.closest('.cd-qty');
      const id = wrap?.getAttribute('data-id');
      const input = wrap?.querySelector('.qty-input');
      const item = cart.find(x => String(x.id) === String(id));
      
      if (!item || !input) return;

      let qty = Number(input.value) || 1;
      
      if (button.classList.contains('qty-dec')) {
        qty = Math.max(1, qty - 1);
      } else {
        qty = Math.max(1, qty + 1);
      }
      
      input.value = qty;
      debouncedQtyUpdate(item, qty);
    }
  }

  function handleListInput(e) {
    const input = e.target;
    if (!input.classList.contains('qty-input')) return;
    
    const wrap = input.closest('.cd-qty');
    const id = wrap?.getAttribute('data-id');
    const item = cart.find(x => String(x.id) === String(id));
    
    if (!item) return;
    
    let qty = parseInt(input.value.replace(/\D+/g, '')) || 1;
    qty = Math.max(1, Math.min(999, qty)); // Reasonable limits
    input.value = qty;
    
    debouncedQtyUpdate(item, qty);
  }

  // --- Promo code handling ---
  function handlePromoSubmit(e) {
    e.preventDefault();
    
    const code = (DOM.promoInput?.value || '').trim().toUpperCase();
    const sub = calcSubtotal();

    if (!code) {
      discount = 0;
      DOM.promoMsg && (DOM.promoMsg.textContent = '');
      updateTotals();
      return;
    }
    
    // Simple promo logic - can be extended
    if (code === 'SAVE10') {
      discount = Math.round(sub * 0.10);
      DOM.promoMsg && (DOM.promoMsg.textContent = 'Applied 10% off.');
    } else {
      discount = 0;
      DOM.promoMsg && (DOM.promoMsg.textContent = 'Invalid code.');
    }
    
    updateTotals();
  }

  // --- Validation with better UX ---
  function validateField(element) {
    if (!element) return false;
    
    const value = String(element.value || '').trim();
    const isValid = value.length > 0;
    
    element.classList.toggle('cd-invalid', !isValid);
    
    return isValid;
  }

  function validateCustomer() {
    const emailEl = $('#cust-email');
    const phoneEl = $('#cust-phone');
    
    const emailValid = validateField(emailEl);
    const phoneValid = validateField(phoneEl);
    
    return emailValid && phoneValid;
  }

  function validateShipping() {
    const requiredSelectors = [
      '#ship-first', '#ship-last', '#ship-line1', 
      '#ship-city', '#ship-state', '#ship-zip', '#ship-country'
    ];
    
    return requiredSelectors.every(selector => validateField($(selector)));
  }

  // --- Accordion management ---
  function handleAccordionClick(e) {
    const head = e.target.closest('.cd-acc-head');
    if (!head) return;

    const expanded = head.getAttribute('aria-expanded') === 'true';
    const newState = expanded ? 'false' : 'true';
    
    head.setAttribute('aria-expanded', newState);

    const body = head.nextElementSibling;
    if (body) {
      body.classList.toggle('open', newState === 'true');
    }
  }

  // --- Save & Continue handlers ---
  function handleSaveCustomer(e) {
    e.preventDefault();
    
    if (!validateCustomer()) {
      DOM.customerHead?.setAttribute('aria-expanded', 'true');
      DOM.customerBody?.classList.add('open');
      return;
    }
    
    // Smooth transition to shipping
    scheduleUpdate(() => {
      DOM.customerHead?.setAttribute('aria-expanded', 'false');
      DOM.customerBody?.classList.remove('open');
      DOM.shippingHead?.setAttribute('aria-expanded', 'true');
      DOM.shippingBody?.classList.add('open');
    });
  }

  function handleSaveShipping(e) {
    e.preventDefault();
    
    if (!validateShipping()) {
      DOM.shippingHead?.setAttribute('aria-expanded', 'true');
      DOM.shippingBody?.classList.add('open');
    }
    // If valid, user will use "Continue to pay"
  }

  // --- Main action handler ---
  function handleNextClick() {
    if (step === 'cart') {
      if (!cart.length) return;
      setStep('info');
      return;
    }

    // Info step - validate everything
    const customerValid = validateCustomer();
    const shippingValid = validateShipping();

    if (!customerValid) {
      DOM.customerHead?.setAttribute('aria-expanded', 'true');
      DOM.customerBody?.classList.add('open');
    }
    
    if (!shippingValid) {
      DOM.shippingHead?.setAttribute('aria-expanded', 'true');
      DOM.shippingBody?.classList.add('open');
    }
    
    if (!customerValid || !shippingValid) return;

    // Build optimized payload
    const payload = {
      email: $('#cust-email')?.value.trim() || '',
      phone: $('#cust-phone')?.value.trim() || '',
      shipping: {
        firstName: $('#ship-first')?.value.trim() || '',
        lastName: $('#ship-last')?.value.trim() || '',
        line1: $('#ship-line1')?.value.trim() || '',
        line2: $('#ship-line2')?.value.trim() || '',
        city: $('#ship-city')?.value.trim() || '',
        state: $('#ship-state')?.value.trim() || '',
        zip: $('#ship-zip')?.value.trim() || '',
        country: $('#ship-country')?.value || 'IN'
      },
      totals: {
        subtotal: calcSubtotal(),
        discount,
        shipping: cart.length ? shippingFlat : 0
      },
      cart: cart.slice() // Create copy to prevent mutations
    };

    // Notify parent
    try {
      window.parent.postMessage({
        type: 'hawaa:continueToPayment',
        data: payload
      }, '*');
    } catch (error) {
      console.warn('Failed to communicate with parent window:', error);
    }
  }

  // --- Navigation handlers ---
  function handleBackToCart() {
    setStep('cart');
  }

  function handleClose() {
    try {
      window.parent.postMessage({
        type: 'hawaa:closeCheckout'
      }, '*');
    } catch (error) {
      console.warn('Failed to communicate with parent window:', error);
    }
  }

  // --- DOM initialization ---
  function initializeDOM() {
    // Cache all frequently accessed elements
    DOM.drawer = $('#cart-drawer');
    DOM.listEl = $('#cart-items');
    DOM.emptyEl = $('#cart-empty');
    DOM.subtotalEl = $('#sum-subtotal');
    DOM.discountEl = $('#sum-discount');
    DOM.shippingEl = $('#sum-shipping');
    DOM.totalEl = $('#sum-total');
    DOM.footTotalEl = $('#foot-total');
    DOM.promoForm = $('#promo-form');
    DOM.promoInput = $('#promo-input');
    DOM.promoMsg = $('#promo-msg');
    DOM.nextBtn = $('#next-btn');
    DOM.closeBtn = $('#close-btn');
    DOM.viewCart = $('#view-cart');
    DOM.viewInfo = $('#view-info');
    DOM.cartTitle = $('#cart-title');
    DOM.infoHeader = $('#info-header');
    DOM.backToCart = $('#back-to-cart');
    DOM.accRoot = $('#info-accordions');
    DOM.customerHead = $('.cd-acc-customer .cd-acc-head');
    DOM.customerBody = $('#acc-customer');
    DOM.shippingHead = $('.cd-acc-shipping .cd-acc-head');
    DOM.shippingBody = $('#acc-shipping');
    DOM.saveCustomerBtn = $('.cd-acc-customer .cd-save-continue');
    DOM.saveShippingBtn = $('.cd-acc-shipping .cd-save-continue');
    DOM.scrollContainer = $('#cart-scroll');
  }

  // --- Event listeners setup ---
  function setupEventListeners() {
    // Use event delegation for better performance
    DOM.listEl?.addEventListener('click', handleListClick);
    DOM.listEl?.addEventListener('input', handleListInput);
    DOM.promoForm?.addEventListener('submit', handlePromoSubmit);
    DOM.accRoot?.addEventListener('click', handleAccordionClick);
    DOM.saveCustomerBtn?.addEventListener('click', handleSaveCustomer);
    DOM.saveShippingBtn?.addEventListener('click', handleSaveShipping);
    DOM.nextBtn?.addEventListener('click', handleNextClick);
    DOM.backToCart?.addEventListener('click', handleBackToCart);
    DOM.closeBtn?.addEventListener('click', handleClose);
    $('#continue-shopping')?.addEventListener('click', handleClose);
  }

  // --- Initialization ---
  function initialize() {
    // Load data
    cart = loadCart();
    
    // Initialize DOM references
    initializeDOM();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderCart();

    // Set initial state
    if (DOM.cartTitle) DOM.cartTitle.hidden = false;
    if (DOM.infoHeader) DOM.infoHeader.hidden = true;
    
    setStep('cart');
    
    // Smooth drawer opening
    requestAnimationFrame(() => {
      DOM.drawer?.classList.add('is-open');
      // Mark as fonts loaded if font detection didn't work
      setTimeout(() => {
        DOM.drawer?.classList.add('fonts-loaded');
      }, 100);
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();