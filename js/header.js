document.addEventListener('DOMContentLoaded', function() {
  console.log('Header.js: DOM loaded, initializing...');

  // -------------------------------
  // Menubar (Mobile Nav) Logic
  // -------------------------------
  const header = document.getElementById('hawaa-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const navClose = document.getElementById('nav-close');
  const navOverlay = document.getElementById('nav-overlay');

  function toggleMenu() {
    document.body.classList.toggle('menu-open');
    if (mobileNav) mobileNav.classList.toggle('active');
  }

  if (menuToggle && navClose && navOverlay && mobileNav) {
    menuToggle.addEventListener('click', toggleMenu);
    navClose.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);
  }

  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (mobileNav && mobileNav.classList.contains('active')) {
        toggleMenu();
      }
    });
  });

  // -------------------------------
  // Scroll behavior
  // -------------------------------
  let lastScroll = 0;
  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
      header?.classList.remove('scroll-up');
      header?.classList.remove('scrolled');
      return;
    }
    header?.classList.add('scrolled');
    if (currentScroll > lastScroll && !header?.classList.contains('scroll-down')) {
      header?.classList.remove('scroll-up');
      header?.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header?.classList.contains('scroll-down')) {
      header?.classList.remove('scroll-down');
      header?.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
  });

  // -------------------------------
  // Auth Drawer Elements
  // -------------------------------
  const drawer = document.getElementById('authDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const drawerTitle = document.getElementById('drawerTitle');
  const welcomeHeading = document.getElementById('welcomeHeading');

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const otpForm = document.getElementById('otpForm');

  const toSignupLink = document.getElementById('toSignupLink');
  const toLoginLink = document.getElementById('toLoginLink');
  const editPhoneBtn = document.getElementById('editPhoneBtn');
  const resendBtn = document.getElementById('resendBtn');

  // Inline success screen
  const authSuccess = document.getElementById('authSuccess');
  const authSuccessTitle = document.getElementById('authSuccessTitle');
  const authSuccessCopy = document.getElementById('authSuccessCopy');
  const authSuccessContinue = document.getElementById('authSuccessContinue');

  // Buttons (for disabling during async)
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const signupSubmitBtn = document.getElementById('signupSubmitBtn');
  const headerLoginBtn = document.getElementById('headerLoginBtn');

  console.log('Elements found:', {
    drawer: !!drawer,
    loginForm: !!loginForm,
    signupForm: !!signupForm,
    otpForm: !!otpForm,
    authSuccess: !!authSuccess,
    loginSubmitBtn: !!loginSubmitBtn,
    signupSubmitBtn: !!signupSubmitBtn,
    headerLoginBtn: !!headerLoginBtn
  });

  let otpMode = 'login';              // 'login' | 'signup'
  let currentResendTimer = null;

  // -------------------------------
  // Helper Functions
  // -------------------------------
  function setTitle(text) {
    if (drawerTitle) drawerTitle.textContent = text;
  }

  function showWelcome(show) {
    if (welcomeHeading) {
      welcomeHeading.style.display = show ? 'block' : 'none';
    }
  }

  function hideAllAuthViews() {
    [loginForm, signupForm, otpForm].forEach(form => {
      if (form) {
        form.style.display = 'none';
        form.classList.add('hidden');
      }
    });
    if (authSuccess) authSuccess.classList.add('hidden');
  }

  function showForm(which) {
    console.log('Showing form:', which);
    hideAllAuthViews();

    let targetForm = null;
    if (which === 'login') {
      targetForm = loginForm;
      otpMode = 'login';
    } else if (which === 'signup') {
      targetForm = signupForm;
      otpMode = 'signup';
    } else if (which === 'otp') {
      targetForm = otpForm;
    }

    if (targetForm) {
      targetForm.style.display = 'flex';
      targetForm.classList.remove('hidden');

      if (which === 'otp') setupOtpInputs();
    }
  }

  function showInlineSuccess(type = 'login') {
    console.log('Show inline success:', type);
    hideAllAuthViews();
    setTitle('Success');
    showWelcome(false);

    if (currentResendTimer) {
      clearInterval(currentResendTimer);
      currentResendTimer = null;
    }

    let title, message;
    if (type === 'signup') {
      title = 'Account Created Successfully!';
      message = 'Your account has been created and verified. Welcome to Hawaa!';
    } else {
      title = 'Login Successful!';
      message = 'You have been successfully logged in to your account.';
    }

    if (authSuccessTitle) authSuccessTitle.textContent = title;
    if (authSuccessCopy) authSuccessCopy.textContent = message;
    if (authSuccess) authSuccess.classList.remove('hidden');
  }

  function openAuthDrawer() {
    console.log('Opening auth drawer');
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      drawer.setAttribute('aria-hidden', 'false'); // important for a11y & reCAPTCHA
    }
  }

  function closeDrawer() {
    console.log('Closing drawer');
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      drawer.setAttribute('aria-hidden', 'true');

      if (currentResendTimer) {
        clearInterval(currentResendTimer);
        currentResendTimer = null;
      }

      setTimeout(() => {
        setTitle('Login');
        showWelcome(true);
        showForm('login');
        clearAllInputs();
      }, 300);
    }
  }

  function clearAllInputs() {
    const allInputs = document.querySelectorAll('#authDrawer input');
    allInputs.forEach(input => {
      input.value = '';
      input.style.borderColor = '';
      input.style.backgroundColor = '';
    });
  }

  function clearOtpInputs() {
    if (!otpForm) return;
    const inputs = Array.from(otpForm.querySelectorAll('.otp'));
    inputs.forEach(inp => {
      inp.value = '';
      inp.style.borderColor = '';
      inp.style.backgroundColor = '';
    });
    if (inputs[0]) inputs[0].focus();
  }

  function showOtpError() {
    if (!otpForm) return;

    const inputs = Array.from(otpForm.querySelectorAll('.otp'));
    inputs.forEach(inp => {
      inp.style.borderColor = '#ff4444';
      inp.style.backgroundColor = '#fff5f5';
    });

    otpForm.style.animation = 'shake 0.4s ease';

    setTimeout(() => {
      if (otpForm) otpForm.style.animation = '';
      inputs.forEach(inp => {
        inp.style.borderColor = '';
        inp.style.backgroundColor = '';
      });
    }, 400);
  }

  function ensurePhone(input) {
    if (!input) return false;
    const digits = (input.value || '').replace(/\D/g, '');
    if (digits.length === 10) return true;

    input.focus();
    input.style.borderColor = '#ff4444';
    input.style.backgroundColor = '#fff5f5';
    setTimeout(() => {
      if (input) {
        input.style.borderColor = '';
        input.style.backgroundColor = '';
      }
    }, 1500);
    return false;
  }

  function goToOtp() {
    console.log('Going to OTP screen');
    setTitle('Verify OTP');
    showWelcome(false);
    showForm('otp');
    startResendTimer();

    setTimeout(() => {
      const firstOtpInput = otpForm && otpForm.querySelector('.otp');
      if (firstOtpInput) firstOtpInput.focus();
    }, 100);
  }

  function startResendTimer() {
    if (!resendBtn) return;

    if (currentResendTimer) clearInterval(currentResendTimer);

    let timeLeft = 30;
    resendBtn.disabled = true;
    const original = 'Resend code';

    const updateLabel = () => {
      resendBtn.innerHTML = `Resend in <span id="resendTimer">${timeLeft}</span>s`;
    };
    updateLabel();

    currentResendTimer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateLabel();
      } else {
        clearInterval(currentResendTimer);
        currentResendTimer = null;
        resendBtn.disabled = false;
        resendBtn.innerHTML = original;
      }
    }, 1000);
  }

  function setupOtpInputs() {
    console.log('Setting up OTP inputs');
    if (!otpForm) return;

    const inputs = Array.from(otpForm.querySelectorAll('.otp'));
    const submitBtn = otpForm.querySelector('button[type="submit"]');

    inputs.forEach(inp => {
      inp.value = '';
      inp.style.borderColor = '';
      inp.style.backgroundColor = '';
    });

    const updateSubmitState = () => {
      const code = inputs.map(i => i.value).join('');
      if (submitBtn) submitBtn.disabled = code.length !== 6;
    };

    updateSubmitState();

    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 1);
        if (this.value && idx < inputs.length - 1) inputs[idx + 1].focus();
        updateSubmitState();
      });

      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && !this.value && idx > 0) inputs[idx - 1].focus();
      });

      inp.addEventListener('focus', function() {
        this.style.borderColor = '';
        this.style.backgroundColor = '';
      });
    });
  }

  // ============================================================
  // Real OTP via Firebase Phone Auth (Compat SDK)
  // ============================================================
  let recaptchaVerifier = null;
  let recaptchaWidgetId = null;
  let confirmationResult = null;
  let isSendingOtp = false; // debounce flag

  function getFullPhone() {
    const sourceId = (otpMode === 'signup') ? 'signupPhone' : 'loginPhone';
    const input = document.getElementById(sourceId);
    const digits = (input?.value || '').replace(/\D/g, '');
    return `+91${digits}`;
  }

  // PREWARM reCAPTCHA on load to avoid first-click delay
  (async function prewarmRecaptcha() {
    try {
      if (typeof firebase !== 'undefined' && firebase?.auth && !recaptchaVerifier) {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
        recaptchaWidgetId = await recaptchaVerifier.render();
        // console.log('reCAPTCHA ready', recaptchaWidgetId);
      }
    } catch (e) {
      console.warn('reCAPTCHA prewarm deferred:', e?.message || e);
    }
  })();

  // Create once and reuse; if broken, clear and recreate safely.
  async function ensureRecaptcha() {
    if (typeof firebase === 'undefined' || !firebase?.auth) {
      console.warn('Firebase not loaded. Include firebase-app-compat.js and firebase-auth-compat.js');
      return null;
    }
    // Reuse if already rendered
    if (recaptchaVerifier && recaptchaWidgetId != null) return recaptchaVerifier;

    try {
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
      recaptchaWidgetId = await recaptchaVerifier.render();
      return recaptchaVerifier;
    } catch (e) {
      // If element already has a widget or got stale, clear and recreate once
      try { await recaptchaVerifier?.clear(); } catch {}
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
      recaptchaWidgetId = await recaptchaVerifier.render();
      return recaptchaVerifier;
    }
  }

  // Show OTP UI immediately; send SMS in the background
  async function sendOtpReal() {
    if (isSendingOtp) return; // debounce
    isSendingOtp = true;

    // Disable the active submit button for UX
    const activeBtn = (otpMode === 'signup') ? signupSubmitBtn : loginSubmitBtn;
    if (activeBtn) activeBtn.disabled = true;

    // 1) Immediate UX: show OTP screen now
    setTitle('Verify OTP');
    showWelcome(false);
    showForm('otp');
    startResendTimer();

    try {
      const verifier = await ensureRecaptcha();
      if (!verifier) throw new Error('reCAPTCHA not ready');

      const phoneNumber = getFullPhone();
      confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, verifier);
      // success: OTP UI already visible
    } catch (err) {
      console.error('Failed to send OTP:', err);
      const code = err?.code || '';

      if (code === 'auth/too-many-requests') {
        alert('Too many OTP attempts. Please wait ~30–60 minutes and try again, or add a test phone in Firebase while developing.');
      }

      // Return to original form
      if (otpMode === 'signup') {
        setTitle('Create new account'); showWelcome(false); showForm('signup');
      } else {
        setTitle('Login'); showWelcome(true); showForm('login');
      }

      // Inline highlight
      const sourceId = (otpMode === 'signup') ? 'signupPhone' : 'loginPhone';
      const input = document.getElementById(sourceId);
      if (input) {
        input.style.borderColor = '#ff4444';
        input.style.backgroundColor = '#fff5f5';
        setTimeout(() => { input.style.borderColor = ''; input.style.backgroundColor = ''; }, 1200);
      }

      // If reCAPTCHA got into a bad state, clear it so next try works
      if (String(err).includes('already been rendered') || code === 'auth/internal-error') {
        try { await recaptchaVerifier?.clear(); } catch {}
        recaptchaVerifier = null; recaptchaWidgetId = null;
      }
    } finally {
      isSendingOtp = false;
      if (activeBtn) activeBtn.disabled = false;
    }
  }

  // -------------------------------
  // Event Listeners
  // -------------------------------

  // Header login button → open drawer on Login view
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Header login button clicked');
      setTitle('Login');
      showWelcome(true);
      showForm('login');
      openAuthDrawer();
    });
  }

  // Close drawer
  if (overlay) overlay.addEventListener('click', closeDrawer);
  const closeBtn = document.getElementById('drawerCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Switch forms
  if (toSignupLink) {
    toSignupLink.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Switch to signup clicked');
      setTitle('Create new account');
      showWelcome(false);
      showForm('signup');
    });
  }

  if (toLoginLink) {
    toLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Switch to login clicked');
      setTitle('Login');
      showWelcome(true);
      showForm('login');
    });
  }

  // -------------------------------
  // CLEANED-UP SUBMIT HANDLERS (single source of truth)
  // -------------------------------

  // Login form submit (covers button click & Enter key)
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const phone = document.getElementById('loginPhone');
      if (!ensurePhone(phone)) return;
      otpMode = 'login';
      await sendOtpReal();
    });
  }

  // Signup form submit
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const nameInput = document.getElementById('signupName');
      const phone = document.getElementById('signupPhone');

      if (!nameInput || !nameInput.value.trim()) {
        if (nameInput) {
          nameInput.focus();
          nameInput.style.borderColor = '#ff4444';
          nameInput.style.backgroundColor = '#fff5f5';
          setTimeout(() => { nameInput.style.borderColor = ''; nameInput.style.backgroundColor = ''; }, 1500);
        }
        return;
      }
      if (!ensurePhone(phone)) return;

      otpMode = 'signup';
      await sendOtpReal();
    });
  }

  // OTP submission (real verification)
  if (otpForm) {
    otpForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const inputs = Array.from(otpForm.querySelectorAll('.otp'));
      const code = inputs.map(i => i.value).join('');

      if (!/^\d{6}$/.test(code)) {
        showOtpError();
        return;
      }

      try {
        if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
          alert('Your OTP session expired. Please resend the code.');
          return;
        }
        const result = await confirmationResult.confirm(code);
        console.log('OTP verified successfully:', result?.user?.uid);
        showInlineSuccess(otpMode);
      } catch (err) {
        console.error('OTP verify failed:', err);
        showOtpError();
      }
    });
  }

  // Edit phone in OTP
  if (editPhoneBtn) {
    editPhoneBtn.addEventListener('click', function() {
      if (currentResendTimer) {
        clearInterval(currentResendTimer);
        currentResendTimer = null;
      }
      if (otpMode === 'signup') {
        setTitle('Create new account');
        showWelcome(false);
        showForm('signup');
      } else {
        setTitle('Login');
        showWelcome(true);
        showForm('login');
      }
    });
  }

  // Inline success continue
  if (authSuccessContinue) {
    authSuccessContinue.addEventListener('click', function() {
      closeDrawer();
    });
  }

  // Resend OTP (real API) — resilient and fast
  if (resendBtn) {
    resendBtn.addEventListener('click', async function() {
      if (resendBtn.disabled) return;

      clearOtpInputs();     // clear boxes
      startResendTimer();   // restart timer immediately
      try {
        const verifier = await ensureRecaptcha();
        if (!verifier) throw new Error('reCAPTCHA not ready');

        const phoneNumber = getFullPhone();
        confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, verifier);
        // success: stay on OTP screen
      } catch (e) {
        console.error('Resend failed:', e);
        // stop timer + restore button
        if (currentResendTimer) { clearInterval(currentResendTimer); currentResendTimer = null; }
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Resend code';

        // reset widget if stale
        try { await recaptchaVerifier?.clear(); } catch {}
        recaptchaVerifier = null; recaptchaWidgetId = null;
      }
    });
  }

  // ESC key handling
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (drawer && drawer.classList.contains('open')) {
        closeDrawer();
      } else if (mobileNav && mobileNav.classList.contains('active')) {
        toggleMenu();
      }
    }
  });

  // Small inline CSS for shake/error if needed
  if (!document.querySelector('style[data-shake]')) {
    const style = document.createElement('style');
    style.setAttribute('data-shake', 'true');
    style.textContent = `
      @keyframes shake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-4px); }
        40%, 60% { transform: translateX(4px); }
      }

      .input:invalid, .otp:invalid {
        border-color: #ff4444 !important;
        background-color: #fff5f5 !important;
      }
      .input:focus:invalid, .otp:focus:invalid {
        box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  console.log('Header.js initialization complete');
});