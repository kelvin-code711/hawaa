(function () {
  const form = document.getElementById('guideForm');
  const email = document.getElementById('hgEmail');
  const msg = document.getElementById('hgMsg');

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = (email?.value || '').trim();

    if (!validEmail(value)) {
      msg.textContent = 'Please enter a valid email.';
      msg.style.color = '#ffe4e6';
      email?.focus();
      return;
    }

    // TODO: hook up to backend/CRM
    msg.textContent = 'Thanks! Your guide link is on the way.';
    msg.style.color = '#e6fff0';
    form.reset();
  });
})();
