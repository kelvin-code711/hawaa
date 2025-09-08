// tiny helpers
const $ = (s, r=document) => r.querySelector(s);
const toastEl = $('#toast');
const toast = (msg) => {
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(window.__t);
  window.__t = setTimeout(()=>toastEl.hidden=true, 2600);
};

// Tabs — Support default
const tabSupport  = $('#tab-support');
const tabWarranty = $('#tab-warranty');
const secSupport  = $('#support');
const secWarranty = $('#warranty');

function show(which){
  const isSupport = which === 'support';
  tabSupport.classList.toggle('active', isSupport);
  tabWarranty.classList.toggle('active', !isSupport);
  secSupport.classList.toggle('hidden', !isSupport);
  secWarranty.classList.toggle('hidden', isSupport);
}
tabSupport .addEventListener('click', ()=>show('support'));
tabWarranty.addEventListener('click', ()=>show('warranty'));
show('support'); // default

/* ----------------------------
   Warranty flow
----------------------------- */
const fetchForm   = $('#fetch-form');
const detailsForm = $('#details-form');
const fCancel     = $('#f-cancel');
const dBack       = $('#d-back');

fetchForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = $('#f-email').value.trim();
  const order = $('#f-order').value.trim();
  if(!email || !/\S+@\S+\.\S+/.test(email)){ toast('Please enter a valid email.'); return; }
  if(!order){ toast('Please enter your order number.'); return; }

  // Simulate fetch success + prefill a couple of fields
  $('#d-product').value = 'Hawaa Purifier X (example)';
  detailsForm.classList.remove('hidden');
  fetchForm.classList.add('hidden');
  detailsForm.scrollIntoView({behavior:'smooth'});
  toast('Order found. Please complete the form.');
});

fCancel?.addEventListener('click', ()=>{
  fetchForm.reset();
});

dBack?.addEventListener('click', ()=>{
  detailsForm.classList.add('hidden');
  fetchForm.classList.remove('hidden');
  fetchForm.scrollIntoView({behavior:'smooth'});
});

detailsForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(!$('#d-reason').value || !$('#d-resolution').value){
    toast('Please choose a reason and preferred resolution.');
    return;
  }
  detailsForm.reset();
  detailsForm.classList.add('hidden');
  fetchForm.classList.remove('hidden');
  toast('✅ Request submitted. We’ll reply within 24 hours.');
});
