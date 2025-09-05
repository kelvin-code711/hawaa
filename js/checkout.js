(() => {
  // ===== Config =====
  const GST_RATE = 0.18, COD_FEE = 30;
  const SHIPPING_ALWAYS_FREE = true;

  const COUPONS = {
    HAWAA100:{type:"flat",amount:100,note:"₹100 off applied."},
    HAWAA10:{type:"percent",amount:10,note:"10% off applied."},
    FREESHIP:{type:"freeship",note:"Free shipping applied."},
    CODFREE:{type:"codfree",note:"COD fee waived."},
  };

  // Demo pincode DB
  const PINCODE_DB = {
    "380001":{city:"Ahmedabad",state:"Gujarat"},
    "395003":{city:"Surat",state:"Gujarat"},
    "360410":{city:"Dhoraji",state:"Gujarat"},
    "110001":{city:"New Delhi",state:"Delhi"},
    "400001":{city:"Mumbai",state:"Maharashtra"},
  };

  // ===== State =====
  const state = {
    cart: [],                // [{id,title,variant,img,price,qty}]
    payment:"upi",
    coupon:null, freeship:false, codfree:false,
    otpSent:false, otpVerified:false, expectedOTP:null,
    totals:{subtotal:0,discount:0,shipping:0,cod:0,gstIncluded:0,grand:0},
    unlocked:{ customer:true, shipaddr:false, payment:false }
  };

  // ===== Elements =====
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const body = document.body;

  const drawer  = $("#coDrawer");
  const toast = $("#toast");
  const backToCart = $("#backToCart");
  const closeDrawer = $("#closeDrawer");

  // Cart UI
  const cartList = $("#cartList");
  const rowSubtotal=$("#rowSubtotal"), rowDiscount=$("#rowDiscount"), rowDiscountVal=$("#rowDiscountVal"),
        rowShipping=$("#rowShipping"), rowGSTVal=$("#rowGSTVal"), rowTotal=$("#rowTotal");

  // Sticky bar
  const primaryCTA = $("#primaryCTA");
  const stickyTotal = $("#stickyTotal");

  // Checkout fields
  const fullName=$("#fullName"), mobile=$("#mobile"), email=$("#email");
  const errName=$("#errName"), errMobile=$("#errMobile"), errEmail=$("#errEmail");
  const pincode=$("#pincode"), city=$("#city"), stateEl=$("#state"), addr1=$("#addr1");
  const errPincode=$("#errPincode"), errAddr1=$("#errAddr1");
  const sameBilling=$("#sameBilling"), billingBlock=$("#billingBlock");
  const bpincode=$("#bpincode"), bcity=$("#bcity"), bstate=$("#bstate"), baddr1=$("#baddr1");
  const errBPincode=$("#errBPincode"), errBAddr1=$("#errBAddr1");

  // Buttons inside steps
  const nextCustomer = $("#nextCustomer");
  const nextShip = $("#nextShip");

  // Payment
  const tabs=$("#paymentTabs"), panels=$$(".panel");
  const upiIntent=$("#upiIntent"), sendOTP=$("#sendOTP"), verifyOTP=$("#verifyOTP"),
        otpInput=$("#otpInput"), otpStatus=$("#otpStatus");

  // ===== Utils =====
  const money = n => "₹"+(Math.round(n*100)/100).toLocaleString("en-IN",{maximumFractionDigits:2});
  function showToast(msg){ if(!toast) return; toast.textContent=msg; toast.className="toast show"; clearTimeout(showToast._t); showToast._t=setTimeout(()=>toast.classList.remove("show"),3200); }
  function rand(){ return Math.random().toString(36).slice(2,10); }
  function dispatchCartUpdated(){ window.dispatchEvent(new CustomEvent("hawaa:cart-updated",{detail:{cart:[...state.cart]}})); }

  // ===== Create transparent click-catcher (no visual overlay) =====
  let backdrop = document.getElementById("coBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "coBackdrop";
    backdrop.className = "co-backdrop";
    // place just under the drawer
    drawer?.parentNode?.insertBefore(backdrop, drawer);
  }

  // ===== Drawer helpers (open/close) =====
  const SLIDE_MS = 250;

  function openDrawer(){
    // Always reload latest persisted cart before opening
    loadCart();

    // Start in CART view so "Next" shows at bottom and back arrow stays hidden
    document.body.classList.add("mode-cart");
    document.body.classList.remove("mode-checkout");

    renderCart();
    updatePrimaryCTA();
    syncHeader();

    backdrop.classList.add("is-open");          // enable outside-click close
    drawer.style.display = "grid";
    // force reflow for smooth transition
    // eslint-disable-next-line no-unused-expressions
    drawer.offsetHeight;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }

  function hideDrawer(){
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";

    // fully remove from layout AFTER slide-out
    const onEnd = () => {
      drawer.style.display = "none";
      drawer.removeEventListener("transitionend", onEnd);
    };
    drawer.addEventListener("transitionend", onEnd);
    // Fallback in case transitionend doesn’t fire
    setTimeout(onEnd, SLIDE_MS + 50);

    backdrop.classList.remove("is-open"); // disable outside-click area
  }

  // Expose opener for product page buttons
  window.openCartDrawer = openDrawer;

  // Boot open if this file is used as the dedicated checkout page
  window.addEventListener("DOMContentLoaded", openDrawer);

  // Close: (X) button
  closeDrawer?.addEventListener("click",(e)=>{ e.preventDefault(); hideDrawer(); });

  // Close: click/touch outside
  ["click","touchstart"].forEach(evt => {
    backdrop.addEventListener(evt, (e)=> { e.preventDefault(); hideDrawer(); }, { passive:false });
  });

  // Close: Esc key
  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && drawer.classList.contains("is-open")) hideDrawer();
  });

  function syncHeader(){
    const inCart = body.classList.contains("mode-cart");
    if (backToCart) backToCart.hidden = inCart; // hidden in cart, visible in next screens
  }

  // ===== Cart load / persist / render =====
  function loadCart(){
    try{
      const stored = JSON.parse(localStorage.getItem("hawaa_cart")||"[]");
      if (Array.isArray(stored) && stored.length){
        state.cart = stored.map(it => ({
          id: it.id || rand(),
          title: it.title || "Hawaa Air Purifier",
          price: Number(it.price ?? 3500),
          img: it.img || "images/closer2b.png",
          variant: it.variant || "Model: C150 • True HEPA",
          qty: Math.max(1, Number(it.qty||1)),
        }));
      } else {
        // Fallback demo
        state.cart = [{ id:rand(), title:"Hawaa Air Purifier", price:3500, img:"images/closer2b.png", variant:"Model: C150 • True HEPA", qty:1 }];
      }
    }catch{
      state.cart = [{ id:rand(), title:"Hawaa Air Purifier", price:3500, img:"images/closer2b.png", variant:"Model: C150 • True HEPA", qty:1 }];
    }
  }

  function persistCart(){
    try{
      const arr = state.cart.map(({id,title,price,img,variant,qty})=>({id,title,price,img,variant,qty}));
      localStorage.setItem("hawaa_cart", JSON.stringify(arr));
    }catch{}
  }

  function renderCart(){
    if (!cartList) return;
    cartList.innerHTML = "";
    if (!state.cart.length){
      cartList.innerHTML = `<li class="cart-item"><div class="cart-item__info"><div class="cart-meta"><div class="cart-title">Your cart is empty</div><div class="cart-variant">Add items to continue</div></div></div></li>`;
      state.totals = {subtotal:0,discount:0,shipping:0,cod:0,gstIncluded:0,grand:0};
      updateTotalsUI();
      updatePrimaryCTA();
      return;
    }

    state.cart.forEach(item=>{
      const li=document.createElement("li");
      li.className="cart-item"; li.dataset.id=item.id;
      li.innerHTML=`
        <div class="cart-item__info">
          <img src="${item.img}" alt="${item.title}" class="cart-thumb"/>
          <div class="cart-meta">
            <div class="cart-title">${item.title}</div>
            <div class="cart-variant">${item.variant||""}</div>
            <a class="cart-remove" href="#" data-remove>Remove</a>
          </div>
        </div>
        <div class="cart-controls">
          <button class="qty-btn" data-qty="-1" aria-label="Decrease">−</button>
          <input class="qty-input" type="number" min="1" value="${item.qty}" inputmode="numeric"/>
          <button class="qty-btn" data-qty="1" aria-label="Increase">+</button>
        </div>
        <div class="cart-price">${money(item.price*item.qty)}</div>
      `;

      const dec=li.querySelector('[data-qty="-1"]');
      const inc=li.querySelector('[data-qty="1"]');
      const qtyInput=li.querySelector('.qty-input');
      const remove=li.querySelector('[data-remove]');

      const setQty=q=>{
        const newQty = Math.max(1, Number(q||1));
        if (newQty === item.qty) return;
        item.qty = newQty;
        qtyInput.value=item.qty;
        li.querySelector(".cart-price").textContent = money(item.price*item.qty);
        calcTotals();
        persistCart();
        dispatchCartUpdated();
      };

      dec.addEventListener("click",()=>setQty(item.qty-1));
      inc.addEventListener("click",()=>setQty(item.qty+1));
      // Update immediately while typing, and commit on change
      qtyInput.addEventListener("input",()=>setQty(qtyInput.value));
      qtyInput.addEventListener("change",()=>setQty(qtyInput.value));

      remove.addEventListener("click",(e)=>{
        e.preventDefault();
        state.cart = state.cart.filter(x=>x.id!==item.id);
        persistCart();
        dispatchCartUpdated();
        renderCart();
        showToast?.("Item removed.");
      });

      cartList.appendChild(li);
    });

    calcTotals();
  }

  // ===== Totals + Coupon =====
  const couponForm = $("#couponForm");
  const couponInput = $("#couponInput");

  couponForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const raw = (couponInput.value||"").trim().toUpperCase();
    if (!raw){ showToast("Enter a coupon code (optional)."); return; }
    const c = COUPONS[raw];
    if (!c){ showToast("Invalid coupon code."); return; }
    state.coupon = raw;
    state.freeship = c.type==="freeship" ? true : state.freeship;
    state.codfree  = c.type==="codfree"  ? true : state.codfree;
    showToast(c.note || "Coupon applied.");
    calcTotals();
  });

  function calcTotals(){
    const subtotal = state.cart.reduce((s,i)=> s + i.price*i.qty, 0);
    let discount = 0;
    if (state.coupon){
      const c = COUPONS[state.coupon];
      if (c){
        if (c.type==="flat") discount = Math.min(subtotal, c.amount);
        if (c.type==="percent") discount = Math.round(subtotal*(c.amount/100));
      }
    }
    const shippingFinal = (SHIPPING_ALWAYS_FREE || state.freeship) ? 0 : 0;
    const codFee = state.payment==="cod" ? (state.codfree?0:COD_FEE) : 0;
    const gstIncluded = Math.round(subtotal*(GST_RATE/(1+GST_RATE)));
    const grand = Math.max(0, subtotal - discount) + shippingFinal + codFee;
    state.totals = {subtotal,discount,shipping:shippingFinal,cod:codFee,gstIncluded,grand};

    updateTotalsUI();
    updateUPI(grand);
    updatePrimaryCTA();
  }

  function updateTotalsUI(){
    const t=state.totals;
    rowSubtotal && (rowSubtotal.textContent=money(t.subtotal));
    if (rowDiscount) rowDiscount.hidden = !(t.discount>0);
    rowDiscountVal && (rowDiscountVal.textContent="−"+money(t.discount));
    rowShipping && (rowShipping.textContent=money(0));
    rowGSTVal && (rowGSTVal.textContent=money(t.gstIncluded));
    rowTotal && (rowTotal.textContent=money(t.grand));
    stickyTotal && (stickyTotal.textContent=money(t.grand));
  }

  function updateUPI(amount){
    const upi = new URL("upi://pay");
    upi.searchParams.set("pa","hawaa@upi");
    upi.searchParams.set("pn","Hawaa");
    upi.searchParams.set("am",amount.toString());
    upi.searchParams.set("cu","INR");
    upi.searchParams.set("tn","Hawaa Order");
    upiIntent?.setAttribute("href", upi.toString());
  }

  // ===== Primary CTA / Stage transitions =====
  function updatePrimaryCTA(){
    if (body.classList.contains("mode-cart")){
      primaryCTA.textContent = "Next";
      primaryCTA.disabled = state.cart.length===0;
      primaryCTA.setAttribute("aria-disabled", String(primaryCTA.disabled));
    }else{
      primaryCTA.textContent = "Pay "+money(state.totals.grand);
      primaryCTA.disabled = !canPay();
      primaryCTA.setAttribute("aria-disabled", String(primaryCTA.disabled));
    }
  }

  function canPay(){
    if (body.classList.contains("mode-cart")) return true;
    const name=(fullName?.value||"").trim(), phone=(mobile?.value||"").trim();
    const pc=(pincode?.value||"").trim(), a1=(addr1?.value||"").trim();
    const phoneOK=/^\d{10}$/.test(phone);
    const pinOK=/^\d{6}$/.test(pc);
    return !!(name && phoneOK && pinOK && a1);
  }

  primaryCTA?.addEventListener("click", ()=>{
    if (body.classList.contains("mode-cart")){
      if (state.cart.length===0) return;
      body.classList.remove("mode-cart");
      body.classList.add("mode-checkout");
      openStep("customer");
      showToast("Cart confirmed.");
      syncHeader();          // back arrow becomes visible here
      updatePrimaryCTA();
      return;
    }
    // Final pay
    if (primaryCTA.disabled) return;
    if (state.payment === "cod"){ showToast("COD order placed (demo)."); }
    else if (state.payment === "upi"){ const href = upiIntent?.getAttribute("href"); if (href) window.location.href = href; showToast("Opening UPI app…"); }
    else { showToast("Redirecting to secure gateway…"); }
  });

  backToCart?.addEventListener("click", ()=>{
    body.classList.remove("mode-checkout");
    body.classList.add("mode-cart");
    syncHeader();            // hides back arrow again
    updatePrimaryCTA();
  });

  // ===== Stepper controls =====
  const stepHeads = $$(".step__head");
  const steps = $$(".step");
  const panelsMap = {
    customer: $("#panel-customer"),
    shipaddr: $("#panel-shipaddr"),
    payment: $("#panel-payment")
  };
  const orderKeys = ["customer","shipaddr","payment"];

  function setStepLock(stepKey, locked){
    const idx = orderKeys.indexOf(stepKey); if (idx<0) return;
    steps[idx].classList.toggle("is-locked", locked);
    stepHeads[idx].disabled = locked;
  }
  function openStep(stepKey){
    Object.entries(panelsMap).forEach(([k, el])=>{
      const head = stepHeads[orderKeys.indexOf(k)];
      const active = (k===stepKey);
      if (!el || !head) return;
      el.hidden = !active;
      head.setAttribute("aria-expanded", String(active));
      steps[orderKeys.indexOf(k)].classList.toggle("is-open", active);
    });
    updatePrimaryCTA();
  }

  stepHeads.forEach(head=>{
    head.addEventListener("click", ()=>{
      if (document.body.classList.contains("mode-cart")) return;
      const key=head.dataset.step;
      if (!state.unlocked[key]) return;
      const isOpen = head.getAttribute("aria-expanded")==="true";
      if (isOpen){ head.setAttribute("aria-expanded","false"); panelsMap[key].hidden=true; steps[orderKeys.indexOf(key)].classList.remove("is-open"); }
      else openStep(key);
    });
    head.setAttribute("role","button");
    head.setAttribute("tabindex","0");
  });

  // Save & Continue buttons
  nextCustomer?.addEventListener("click", ()=>{
    if (!validateCustomerInline()) return;
    state.unlocked.shipaddr = true; setStepLock("shipaddr", false);
    openStep("shipaddr"); showToast("Customer saved.");
    updatePrimaryCTA();
  });
  nextShip?.addEventListener("click", ()=>{
    if (!validateShippingInline()) return;
    state.unlocked.payment = true; setStepLock("payment", false);
    openStep("payment"); showToast("Address saved.");
    updatePrimaryCTA();
  });

  // ===== Validation =====
  function setError(fieldWrapId, errEl, msg){
    const wrap = document.getElementById(fieldWrapId);
    if (!wrap || !errEl) return;
    if (msg){ wrap.classList.add("error"); errEl.textContent = msg; }
    else { wrap.classList.remove("error"); errEl.textContent = ""; }
  }
  function validateCustomerInline(){
    let ok=true;
    const name=(fullName?.value||"").trim(), phone=(mobile?.value||"").trim(), mail=(email?.value||"").trim();
    if (!name){ setError("fieldName",errName,"Please enter your full name."); ok=false; } else setError("fieldName",errName,"");
    if (!/^\d{10}$/.test(phone)){ setError("fieldMobile",errMobile,"Enter a valid 10-digit mobile number."); ok=false; } else setError("fieldMobile",errMobile,"");
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){ setError("fieldEmail",errEmail,"Enter a valid email or leave empty."); ok=false; } else setError("fieldEmail",errEmail,"");
    return ok;
  }
  function validateShippingInline(){
    let ok=true;
    const pc=(pincode?.value||"").trim(), a1=(addr1?.value||"").trim();
    if (!/^\d{6}$/.test(pc)){ setError("fieldPincode",errPincode,"Enter a valid 6-digit pincode."); ok=false; } else setError("fieldPincode",errPincode,"");
    if (!a1){ setError("fieldAddr1",errAddr1,"Address Line 1 is required."); ok=false; } else setError("fieldAddr1",errAddr1,"");
    if (!sameBilling?.checked){
      const bpc=(bpincode?.value||"").trim(), ba1=(baddr1?.value||"").trim();
      if (!/^\d{6}$/.test(bpc)){ setError("fieldBPincode",errBPincode,"Enter a valid 6-digit billing pincode."); ok=false; } else setError("fieldBPincode",errBPincode,"");
      if (!ba1){ setError("fieldBAddr1",errBAddr1,"Billing Address Line 1 is required."); ok=false; } else setError("fieldBAddr1",errBAddr1,"");
    } else { setError("fieldBPincode",errBPincode,""); setError("fieldBAddr1",errBAddr1,""); }
    return ok;
  }
  [fullName,mobile,email].forEach(el=>el?.addEventListener("input",()=>{ updatePrimaryCTA(); }));
  pincode?.addEventListener("input", ()=>{
    const v=pincode.value.replace(/\D/g,"").slice(0,6);
    pincode.value=v;
    if (v.length===6){
      const rec=PINCODE_DB[v];
      if (rec){ city.value=rec.city; stateEl.value=rec.state; showToast(`Auto-filled: ${rec.city}, ${rec.state}`); }
      else { city.value=""; stateEl.value=""; showToast("Pincode not in demo DB. Enter manually."); }
    }
    updatePrimaryCTA();
  });
  addr1?.addEventListener("input", ()=>updatePrimaryCTA());
  sameBilling?.addEventListener("change", ()=>{ billingBlock.hidden=sameBilling.checked; updatePrimaryCTA(); });
  bpincode?.addEventListener("input", ()=>{
    const v=bpincode.value.replace(/\D/g,"").slice(0,6);
    bpincode.value=v;
    if (v.length===6){
      const rec=PINCODE_DB[v];
      if (rec){ bcity.value=rec.city; bstate.value=rec.state; showToast(`Billing: ${rec.city}, ${rec.state}`); }
      else { bcity.value=""; bstate.value=""; showToast("Billing pincode not in demo DB."); }
    }
    updatePrimaryCTA();
  });
  baddr1?.addEventListener("input", ()=>updatePrimaryCTA());

  // Payment tabs
  tabs?.addEventListener("click",(e)=>{
    const btn=e.target.closest(".tab"); if (!btn) return;
    $$(".tab",tabs).forEach(b=>b.classList.remove("is-active")); btn.classList.add("is-active");
    const target=btn.dataset.pay; state.payment=target;
    panels.forEach(p=>p.hidden = (p.dataset.panel!==target));
    if (target!=="cod"){
      state.otpSent=false; state.otpVerified=false; state.expectedOTP=null;
      if (otpInput) otpInput.value=""; if (otpStatus) otpStatus.textContent="OTP not sent.";
    }
    calcTotals(); updatePrimaryCTA();
  });

  // COD OTP demo
  sendOTP?.addEventListener("click", ()=>{
    const phone=(mobile?.value||"").trim();
    if (!/^\d{10}$/.test(phone)){ setError("fieldMobile",errMobile,"Enter a valid 10-digit mobile number."); showToast("Enter valid mobile before OTP."); return; }
    state.expectedOTP="123456"; state.otpSent=true; state.otpVerified=false;
    otpStatus.textContent="OTP sent (demo: 123456)."; showToast("OTP sent."); updatePrimaryCTA();
  });
  verifyOTP?.addEventListener("click", ()=>{
    if (!state.otpSent){ showToast("Send OTP first."); return; }
    const code=(otpInput?.value||"").trim();
    if (code===state.expectedOTP){ state.otpVerified=true; otpStatus.textContent="OTP verified ✅"; showToast("OTP verified."); }
    else { state.otpVerified=false; otpStatus.textContent="Incorrect OTP ❌"; showToast("Incorrect OTP."); }
    updatePrimaryCTA();
  });

  // ===== Live sync & refresh on reopen =====
  window.addEventListener("storage", (e)=>{
    if (e.key === "hawaa_cart") { loadCart(); renderCart(); }
  });
  window.addEventListener("focus", ()=>{
    loadCart(); renderCart();
  });
})();
