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
  // Enhanced Firebase Phone Auth with Better Error Handling
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

  // Fixed reCAPTCHA setup with better error handling
  async function ensureRecaptcha() {
    console.log('Setting up reCAPTCHA...');
    
    if (typeof firebase === 'undefined' || !firebase?.auth) {
      console.error('Firebase not loaded. Check Firebase script inclusion.');
      alert('Firebase authentication is not properly loaded. Please refresh the page.');
      return null;
    }

    // Clear any existing verifier first
    if (recaptchaVerifier) {
      try {
        await recaptchaVerifier.clear();
        console.log('Cleared existing reCAPTCHA verifier');
      } catch (e) {
        console.warn('Error clearing reCAPTCHA:', e);
      }
      recaptchaVerifier = null;
      recaptchaWidgetId = null;
    }

    // Reset the container completely
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
      console.log('Reset reCAPTCHA container');
    }

    try {
      // Create new verifier
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, will need to retry');
        },
        'error-callback': (error) => {
          console.error('reCAPTCHA error:', error);
        }
      });

      // Render the verifier
      recaptchaWidgetId = await recaptchaVerifier.render();
      console.log('reCAPTCHA rendered with widget ID:', recaptchaWidgetId);
      
      return recaptchaVerifier;

    } catch (error) {
      console.error('reCAPTCHA setup failed:', error);
      
      // If it's the "already rendered" error, try to work around it
      if (error.message.includes('already been rendered')) {
        console.log('Attempting to handle already rendered error...');
        
        // Clear everything and try once more
        if (container) {
          container.innerHTML = '';
          // Create a new container element
          const newDiv = document.createElement('div');
          newDiv.id = 'recaptcha-container-retry';
          newDiv.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
          document.body.appendChild(newDiv);
          
          try {
            recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container-retry', {
              size: 'invisible'
            });
            recaptchaWidgetId = await recaptchaVerifier.render();
            console.log('reCAPTCHA retry successful');
            return recaptchaVerifier;
          } catch (retryError) {
            console.error('reCAPTCHA retry also failed:', retryError);
          }
        }
      }
      
      return null;
    }
  }

  // Show detailed error messages to user
  function showUserFriendlyError(error) {
    const code = error?.code || '';
    const message = error?.message || '';
    
    console.error('Firebase Auth Error:', { code, message, error });
    
    let userMessage = '';
    
    switch (code) {
      case 'auth/too-many-requests':
        userMessage = 'Too many attempts. Please wait 15-30 minutes before trying again.';
        break;
      case 'auth/invalid-phone-number':
        userMessage = 'Please enter a valid Indian mobile number.';
        break;
      case 'auth/quota-exceeded':
        userMessage = 'SMS quota exceeded. Please try again later.';
        break;
      case 'auth/invalid-verification-code':
        userMessage = 'Invalid OTP. Please check and try again.';
        break;
      case 'auth/code-expired':
        userMessage = 'OTP has expired. Please request a new one.';
        break;
      case 'auth/missing-verification-code':
        userMessage = 'Please enter the complete 6-digit OTP.';
        break;
      default:
        if (message.includes('reCAPTCHA')) {
          userMessage = 'Security verification failed. Please try again.';
        } else if (message.includes('network')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else {
          userMessage = 'Something went wrong. Please try again.';
        }
        break;
    }
    
    // Show error to user (you can customize this)
    alert(userMessage);
    
    return userMessage;
  }

  // Enhanced OTP sending with better error handling
  async function sendOtpReal() {
    if (isSendingOtp) {
      console.log('Already sending OTP, ignoring duplicate request');
      return;
    }
    
    isSendingOtp = true;
    console.log('Starting OTP send process...');

    // Disable the active submit button for UX
    const activeBtn = (otpMode === 'signup') ? signupSubmitBtn : loginSubmitBtn;
    if (activeBtn) {
      activeBtn.disabled = true;
      activeBtn.textContent = 'Sending OTP...';
    }

    try {
      // Get phone number
      const phoneNumber = getFullPhone();
      console.log('Sending OTP to:', phoneNumber);

      // Validate phone number format
      if (!/^\+91\d{10}$/.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Setup reCAPTCHA
      const verifier = await ensureRecaptcha();
      if (!verifier) {
        throw new Error('reCAPTCHA setup failed');
      }

      console.log('Calling Firebase signInWithPhoneNumber...');
      
      // Send SMS
      confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, verifier);
      
      console.log('OTP sent successfully!', confirmationResult);

      // Use the goToOtp() function which handles everything properly
      goToOtp();

    } catch (error) {
      console.error('Send OTP failed:', error);
      
      // Show user-friendly error
      showUserFriendlyError(error);

      // Return to original form
      if (otpMode === 'signup') {
        setTitle('Create new account');
        showWelcome(false);
        showForm('signup');
      } else {
        setTitle('Login');
        showWelcome(true);
        showForm('login');
      }

      // Highlight problematic input
      const sourceId = (otpMode === 'signup') ? 'signupPhone' : 'loginPhone';
      const input = document.getElementById(sourceId);
      if (input) {
        input.style.borderColor = '#ff4444';
        input.style.backgroundColor = '#fff5f5';
        setTimeout(() => {
          if (input) {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
          }
        }, 2000);
      }

      // Reset reCAPTCHA on certain errors
      if (error.code === 'auth/internal-error' || 
          error.message.includes('already been rendered') ||
          error.message.includes('reCAPTCHA')) {
        console.log('Resetting reCAPTCHA due to error');
        try {
          if (recaptchaVerifier) {
            await recaptchaVerifier.clear();
          }
        } catch (e) {
          console.warn('Error clearing reCAPTCHA:', e);
        }
        recaptchaVerifier = null;
        recaptchaWidgetId = null;
      }

    } finally {
      isSendingOtp = false;
      
      // Re-enable submit button
      if (activeBtn) {
        activeBtn.disabled = false;
        activeBtn.textContent = (otpMode === 'signup') ? 'Create account' : 'Log in';
      }
    }
  }

  // Enhanced OTP verification
  async function verifyOtpReal(otpCode) {
    console.log('Verifying OTP:', otpCode);

    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      console.error('No valid confirmation result found');
      alert('OTP session expired. Please request a new OTP.');
      return false;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      console.error('Invalid OTP format:', otpCode);
      showOtpError();
      return false;
    }

    try {
      const result = await confirmationResult.confirm(otpCode);
      console.log('OTP verification successful:', result.user.uid);
      
      // Show success screen
      showInlineSuccess(otpMode);
      
      return true;

    } catch (error) {
      console.error('OTP verification failed:', error);
      
      // Show user-friendly error
      showUserFriendlyError(error);
      
      // Show visual error feedback
      showOtpError();
      
      return false;
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
  // Form Submit Handlers
  // -------------------------------

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Login form submitted');
      
      const phone = document.getElementById('loginPhone');
      if (!ensurePhone(phone)) {
        console.log('Phone validation failed');
        return;
      }
      
      otpMode = 'login';
      await sendOtpReal();
    });
  }

  // Signup form submit
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Signup form submitted');
      
      const nameInput = document.getElementById('signupName');
      const phone = document.getElementById('signupPhone');

      // Validate name
      if (!nameInput || !nameInput.value.trim()) {
        console.log('Name validation failed');
        if (nameInput) {
          nameInput.focus();
          nameInput.style.borderColor = '#ff4444';
          nameInput.style.backgroundColor = '#fff5f5';
          setTimeout(() => {
            if (nameInput) {
              nameInput.style.borderColor = '';
              nameInput.style.backgroundColor = '';
            }
          }, 1500);
        }
        return;
      }
      
      // Validate phone
      if (!ensurePhone(phone)) {
        console.log('Phone validation failed');
        return;
      }

      otpMode = 'signup';
      await sendOtpReal();
    });
  }

  // OTP form submit
  if (otpForm) {
    otpForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('OTP form submitted');
      
      const inputs = Array.from(otpForm.querySelectorAll('.otp'));
      const code = inputs.map(i => i.value).join('');
      
      await verifyOtpReal(code);
    });
  }

  // Edit phone in OTP
  if (editPhoneBtn) {
    editPhoneBtn.addEventListener('click', function() {
      console.log('Edit phone clicked');
      
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
      console.log('Success continue clicked');
      closeDrawer();
    });
  }

  // Enhanced resend OTP
  if (resendBtn) {
    resendBtn.addEventListener('click', async function() {
      if (resendBtn.disabled) {
        console.log('Resend button disabled, ignoring click');
        return;
      }

      console.log('Resend OTP clicked');
      
      // Clear OTP inputs and restart timer immediately for better UX
      clearOtpInputs();
      startResendTimer();
      
      try {
        const verifier = await ensureRecaptcha();
        if (!verifier) {
          throw new Error('reCAPTCHA setup failed');
        }

        const phoneNumber = getFullPhone();
        console.log('Resending OTP to:', phoneNumber);
        
        confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, verifier);
        console.log('OTP resent successfully');
        
      } catch (error) {
        console.error('Resend OTP failed:', error);
        
        // Show user-friendly error
        showUserFriendlyError(error);
        
        // Stop timer and restore button
        if (currentResendTimer) {
          clearInterval(currentResendTimer);
          currentResendTimer = null;
        }
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Resend code';

        // Reset reCAPTCHA on error
        try {
          if (recaptchaVerifier) {
            await recaptchaVerifier.clear();
          }
        } catch (e) {
          console.warn('Error clearing reCAPTCHA:', e);
        }
        recaptchaVerifier = null;
        recaptchaWidgetId = null;
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

  // Initialize Firebase check
  function initializeFirebaseAuth() {
    console.log('Checking Firebase initialization...');
    
    if (typeof firebase === 'undefined') {
      console.error('Firebase not loaded! Check script tags.');
      return false;
    }
    
    if (!firebase.auth) {
      console.error('Firebase Auth not loaded! Check firebase-auth script tag.');
      return false;
    }
    
    console.log('Firebase Auth ready');
    return true;
  }

  // Final initialization
  setTimeout(() => {
    const firebaseReady = initializeFirebaseAuth();
    if (!firebaseReady) {
      console.error('Firebase initialization failed - authentication will not work');
      alert('Authentication system is not properly loaded. Please refresh the page.');
    } else {
      console.log('Header.js initialization complete - Firebase Auth ready');
    }
  }, 100);

});