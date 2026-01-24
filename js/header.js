document.addEventListener('DOMContentLoaded', function () {
  console.log('Header Auth: Initializing...');

  // Elements
  const header = document.getElementById('hawaa-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const navClose = document.getElementById('nav-close');
  const navOverlay = document.getElementById('nav-overlay');

  // Auth elements
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const authOverlay = document.getElementById('authOverlay');
  const authDrawer = document.getElementById('authDrawer');
  const closeAuthBtn = document.getElementById('closeAuthBtn');
  const authTitle = document.getElementById('authTitle');

  // Screens
  const loginScreen = document.getElementById('loginScreen');
  const signupScreen = document.getElementById('signupScreen');
  const otpScreen = document.getElementById('otpScreen');
  const successScreen = document.getElementById('successScreen');

  // Forms and inputs
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const otpForm = document.getElementById('otpForm');
  const loginPhone = document.getElementById('loginPhone');
  const signupName = document.getElementById('signupName');
  const signupPhone = document.getElementById('signupPhone');

  // Optional (you'll add these inputs later; safe if not present yet)
  const signupEmail = document.getElementById('signupEmail');
  const signupCity = document.getElementById('signupCity');

  const otpPhoneDisplay = document.getElementById('otpPhoneDisplay');
  const otpDigits = document.querySelectorAll('.otp-digit');

  // Buttons
  const switchToSignup = document.getElementById('switchToSignup');
  const switchToLogin = document.getElementById('switchToLogin');
  const sendLoginOtpBtn = document.getElementById('sendLoginOtpBtn');
  const sendSignupOtpBtn = document.getElementById('sendSignupOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const changePhoneBtn = document.getElementById('changePhoneBtn');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const continueBtn = document.getElementById('continueBtn');
  const resendTimer = document.getElementById('resendTimer');
  const successTitle = document.getElementById('successTitle');
  const successMessage = document.getElementById('successMessage');

  // State
  let currentMode = 'login'; // 'login' or 'signup'
  let currentPhone = '';
  let confirmationResult = null;
  let recaptchaVerifier = null;
  let resendTimerInterval = null;

  // ===== Firestore (safe init; only if SDK is loaded) =====
  let db = null;
  try {
    if (firebase && firebase.firestore) {
      db = firebase.firestore();
      console.log('Firestore ready');
    } else {
      console.warn('Firestore SDK not found; profile save will be skipped.');
    }
  } catch (e) {
    console.warn('Firestore init error:', e);
  }

  // -------------------------------
  // Mobile Navigation
  // -------------------------------
  function toggleMobileMenu() {
    document.body.classList.toggle('menu-open');
    if (mobileNav) mobileNav.classList.toggle('active');
  }

  if (menuToggle && navClose && navOverlay && mobileNav) {
    menuToggle.addEventListener('click', toggleMobileMenu);
    navClose.addEventListener('click', toggleMobileMenu);
    navOverlay.addEventListener('click', toggleMobileMenu);
  }

  // -------------------------------
  // Header Scroll Effect
  // -------------------------------
  let lastScroll = 0;
  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
      header?.classList.remove('scrolled');
      return;
    }
    header?.classList.add('scrolled');
    lastScroll = currentScroll;
  });

  // -------------------------------
  // Auth Drawer Functions
  // -------------------------------
  function openAuthDrawer() {
    console.log('Opening auth drawer');
    authOverlay?.classList.add('active');
    authDrawer?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthDrawer() {
    console.log('Closing auth drawer');
    authOverlay?.classList.remove('active');
    authDrawer?.classList.remove('active');
    document.body.style.overflow = '';

    // Reset to login screen after closing
    setTimeout(() => {
      showScreen('login');
      clearAllInputs();
      clearErrors();
      if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
      }
    }, 300);
  }

  function showScreen(screen) {
    console.log('Showing screen:', screen);

    // Hide all screens
    [loginScreen, signupScreen, otpScreen, successScreen].forEach(s => {
      if (s) s.style.display = 'none';
    });

    // Show target screen and update title
    switch (screen) {
      case 'login':
        if (loginScreen) loginScreen.style.display = 'block';
        if (authTitle) authTitle.textContent = 'Login';
        currentMode = 'login';
        break;
      case 'signup':
        if (signupScreen) signupScreen.style.display = 'block';
        if (authTitle) authTitle.textContent = 'Create Account';
        currentMode = 'signup';
        break;
      case 'otp':
        if (otpScreen) otpScreen.style.display = 'block';
        if (authTitle) authTitle.textContent = 'Verify OTP';
        break;
      case 'success':
        if (successScreen) successScreen.style.display = 'block';
        if (authTitle) authTitle.textContent = 'Success';
        break;
    }
  }

  function clearAllInputs() {
    [loginPhone, signupName, signupPhone, signupEmail, signupCity].forEach(input => {
      if (input) {
        input.value = '';
        input.classList.remove('error');
      }
    });
    clearOtpInputs();
  }

  function clearOtpInputs() {
    otpDigits.forEach(input => {
      if (input) {
        input.value = '';
        input.classList.remove('error');
      }
    });
  }

  function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());

    document.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });
  }

  function showError(message, container) {
    clearErrors();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
  }

  // -------------------------------
  // Phone Number Validation
  // -------------------------------
  function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  }

  function formatPhoneForDisplay(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  // -------------------------------
  // Firebase reCAPTCHA Setup (Improved)
  // -------------------------------
  async function setupRecaptcha() {
    console.log('Setting up reCAPTCHA...');

    try {
      // Clear any existing verifier first
      if (recaptchaVerifier) {
        try {
          await recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing existing verifier:', e);
        }
        recaptchaVerifier = null;
      }

      // Ensure the container exists and is empty
      const container = document.getElementById('recaptcha-container');
      if (!container) {
        console.error('reCAPTCHA container not found');
        return false;
      }
      container.innerHTML = ''; // Clear any existing content

      // Create new verifier with better error handling
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
        },
        'error-callback': (error) => {
          console.error('reCAPTCHA error callback:', error);
        }
      });

      // Render with timeout
      const renderPromise = recaptchaVerifier.render();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('reCAPTCHA render timeout')), 10000);
      });

      await Promise.race([renderPromise, timeoutPromise]);
      console.log('reCAPTCHA setup complete');
      return true;

    } catch (error) {
      console.error('reCAPTCHA setup failed:', error);

      // Reset container on error
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      recaptchaVerifier = null;
      return false;
    }
  }

  // -------------------------------
  // OTP Functions (Improved)
  // -------------------------------
  async function sendOtp(phoneNumber) {
    console.log('Sending OTP to:', phoneNumber);

    try {
      // Validate Firebase is available
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase not properly initialized');
      }

      // Setup reCAPTCHA with retry logic
      let recaptchaReady = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`reCAPTCHA setup attempt ${attempt}/3`);
        recaptchaReady = await setupRecaptcha();
        if (recaptchaReady) break;

        // Wait before retry
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!recaptchaReady) {
        throw new Error('Failed to setup reCAPTCHA after multiple attempts');
      }

      const fullPhone = `+91${phoneNumber}`;
      console.log('Calling Firebase signInWithPhoneNumber...');

      confirmationResult = await firebase.auth().signInWithPhoneNumber(fullPhone, recaptchaVerifier);

      console.log('OTP sent successfully');
      currentPhone = phoneNumber;

      if (otpPhoneDisplay) {
        otpPhoneDisplay.textContent = formatPhoneForDisplay(phoneNumber);
      }

      showScreen('otp');
      startResendTimer();

      // Focus first OTP input
      setTimeout(() => {
        clearOtpInputs();
        if (otpDigits[0]) otpDigits[0].focus();
      }, 100);

      return true;

    } catch (error) {
      console.error('Send OTP failed:', error);

      // Clean up on error
      if (recaptchaVerifier) {
        try {
          await recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing verifier after failure:', e);
        }
        recaptchaVerifier = null;
      }

      let errorMessage = 'Failed to send OTP. Please try again.';

      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please wait 15-30 minutes before trying again.';
          break;
        case 'auth/invalid-phone-number':
          errorMessage = 'Please enter a valid Indian mobile number.';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'SMS quota exceeded. Please try again later.';
          break;
        case 'auth/internal-error':
          errorMessage = 'Internal error occurred. Please try again.';
          break;
        default:
          if (error.message.includes('reCAPTCHA')) {
            errorMessage = 'Security verification failed. Please refresh and try again.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          }
          break;
      }

      const activeForm = currentMode === 'login' ? loginForm : signupForm;
      showError(errorMessage, activeForm);
      return false;
    }
  }

  // -------------------------------
  // VERIFY OTP (Manual verification - no auto-verify)
  // -------------------------------
  async function verifyOtp() {
    const otpCode = Array.from(otpDigits).map(input => input.value).join('');

    if (otpCode.length !== 6) {
      showOtpError('Please enter complete 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      showOtpError('OTP session expired. Please request a new OTP.');
      setTimeout(() => {
        showScreen(currentMode);
      }, 2000);
      return;
    }

    try {
      console.log('Verifying OTP:', otpCode);

      // Disable verify button during verification
      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';
      }

      const result = await confirmationResult.confirm(otpCode);
      console.log('OTP verified successfully:', result.user.uid);

      // ---- Create/Update Firestore profile ----
      try {
        if (db) {
          const uid = result.user.uid;
          const usersRef = db.collection('users').doc(uid);

          const safe = (el) => (el && el.value ? el.value.trim() : '');
          const name = signupName?.value?.trim() || '';
          const phone = `+91${currentPhone}`;
          const email = safe(signupEmail);
          const city = safe(signupCity);

          if (currentMode === 'signup') {
            await usersRef.set({
              name,
              phone,
              email,
              city,

              status: "active",          // ✅ ADD THIS
              isLoggedIn: true,          // ✅ optional (if you want)

              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(), // ✅ optional
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          } else {
            await usersRef.set({
              status: "active",          // ✅ ADD THIS
              isLoggedIn: true,          // ✅ optional

              lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }

          console.log("✅ wrote to doc:", uid);
          console.log('User profile stored/updated in Firestore');
        } else {
          console.warn('Skipping profile write: Firestore not initialized');
        }
      } catch (profileErr) {
        console.error('Failed to write user profile:', profileErr);
      }
      // ---- END profile write ----

      // Show success screen
      if (currentMode === 'signup') {
        if (successTitle) successTitle.textContent = 'Account Created Successfully!';
        if (successMessage) successMessage.textContent = 'Welcome to Hawaa! Your account has been created.';
      } else {
        if (successTitle) successTitle.textContent = 'Login Successful!';
        if (successMessage) successMessage.textContent = 'Welcome back! You are now logged in.';
      }

      showScreen('success');

      // Clear timer
      if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
      }

    } catch (error) {
      console.error('OTP verification failed:', error);

      let errorMessage = 'Invalid OTP. Please try again.';

      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'Invalid OTP. Please check and try again.';
          break;
        case 'auth/code-expired':
          errorMessage = 'OTP has expired. Please request a new one.';
          break;
        case 'auth/missing-verification-code':
          errorMessage = 'Please enter the complete 6-digit OTP.';
          break;
        default:
          if (error.message.includes('session')) {
            errorMessage = 'Session expired. Please request a new OTP.';
          }
          break;
      }

      showOtpError(errorMessage);

    } finally {
      // Re-enable verify button
      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify';
      }
    }
  }

  function showOtpError(message) {
    console.log('Showing OTP error:', message);

    // Visual feedback
    otpDigits.forEach(input => {
      if (input) input.classList.add('error');
    });

    // Add shake animation to the screen
    if (otpScreen) {
      otpScreen.classList.add('shake');
      setTimeout(() => {
        if (otpScreen) otpScreen.classList.remove('shake');
      }, 400);
    }

    // Show error message
    showError(message, otpForm);

    // Clear error styling after delay
    setTimeout(() => {
      otpDigits.forEach(input => {
        if (input) input.classList.remove('error');
      });
    }, 2000);

    // Clear OTP inputs
    setTimeout(() => {
      clearOtpInputs();
      if (otpDigits[0]) otpDigits[0].focus();
    }, 500);
  }

  // -------------------------------
  // Resend Timer
  // -------------------------------
  function startResendTimer() {
    let timeLeft = 30;

    if (resendTimerInterval) {
      clearInterval(resendTimerInterval);
    }

    if (resendOtpBtn) {
      resendOtpBtn.disabled = true;
    }

    function updateTimer() {
      if (resendTimer) resendTimer.textContent = timeLeft;

      if (timeLeft <= 0) {
        if (resendOtpBtn) resendOtpBtn.disabled = false;
        if (resendTimer) resendTimer.textContent = '0';
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
        return;
      }

      timeLeft--;
    }

    updateTimer();
    resendTimerInterval = setInterval(updateTimer, 1000);
  }

  // -------------------------------
  // OTP Input Handlers (Enhanced - NO AUTO-VERIFY)
  // -------------------------------
  function setupOtpInputs() {
    if (!otpDigits.length) return;

    otpDigits.forEach((input, index) => {
      // Set numeric inputmode for mobile keyboard
      input.setAttribute('inputmode', 'numeric');

      // Input event
      input.addEventListener('input', function () {
        // Only allow digits
        let value = this.value.replace(/\D/g, '');
        this.value = value.slice(0, 1);

        // Move to next input if current is filled
        if (this.value && index < otpDigits.length - 1) {
          otpDigits[index + 1].focus();
        }

        // Clear error state when typing
        this.classList.remove('error');
        clearErrors();

        // NO AUTO-VERIFY - user must click Verify button
      });

      // Keydown event for navigation
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
          if (!this.value && index > 0) {
            otpDigits[index - 1].focus();
          }
        }
        if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          otpDigits[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && index < otpDigits.length - 1) {
          e.preventDefault();
          otpDigits[index + 1].focus();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          verifyOtp();
        }
      });

      // Paste event
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const digits = paste.replace(/\D/g, '');
        if (digits.length >= 6) {
          otpDigits.forEach((inp, i) => {
            inp.value = digits[i] || '';
            inp.classList.remove('error');
          });
          // Focus the verify button after paste
          if (verifyOtpBtn) {
            verifyOtpBtn.focus();
          }
        }
      });

      // Focus event
      input.addEventListener('focus', function () {
        this.classList.remove('error');
        this.select();
      });
    });
  }

  // -------------------------------
  // NEW: Auth-aware Header & Nav
  // -------------------------------
  function addNavLogoutItem() {
    if (!mobileNav) return;

    // already exists?
    if (mobileNav.querySelector('#navLogoutSection')) return;

    // Find the nav-content container
    const navContent = mobileNav.querySelector('.nav-content');
    if (!navContent) return;

    // Create logout section outside nav-sections, at the bottom
    const logoutSection = document.createElement('div');
    logoutSection.id = 'navLogoutSection';
    logoutSection.className = 'nav-logout-section';

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'nav-logout-btn';
    logoutBtn.innerHTML = `
      <span class="material-symbols-rounded">logout</span>
      <span>Log out</span>
    `;

    logoutBtn.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        if (mobileNav.classList.contains('active')) toggleMobileMenu();
      } catch (e) {
        console.error('Sign out failed:', e);
        alert('Failed to log out. Please try again.');
      }
    });

    logoutSection.appendChild(logoutBtn);
    navContent.appendChild(logoutSection);
  }

  function removeNavLogoutItem() {
    const section = document.getElementById('navLogoutSection');
    if (section && section.parentNode) section.parentNode.removeChild(section);
  }

  function renderAuthUI(user) {
    // Hide/show header Login button
    if (headerLoginBtn) {
      headerLoginBtn.style.display = user ? 'none' : 'inline-flex';
    }
    // Add/remove mobile nav logout
    if (user) addNavLogoutItem();
    else removeNavLogoutItem();
  }

  // Observe auth state (works even after page reload)
  try {
    firebase.auth().onAuthStateChanged(function (user) {
      console.log('Auth state changed. Signed in?', !!user);
      renderAuthUI(user);
    });
  } catch (e) {
    console.warn('Auth observer failed:', e);
  }

  // -------------------------------
  // Events
  // -------------------------------
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showScreen('login');
      openAuthDrawer();
    });
  }

  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthDrawer);
  if (authOverlay) authOverlay.addEventListener('click', closeAuthDrawer);

  if (switchToSignup) {
    switchToSignup.addEventListener('click', function (e) {
      e.preventDefault();
      showScreen('signup');
      clearErrors();
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', function (e) {
      e.preventDefault();
      showScreen('login');
      clearErrors();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const phone = loginPhone.value.replace(/\D/g, '');
      if (!validatePhone(phone)) {
        showError('Please enter a valid 10-digit mobile number', this);
        loginPhone.focus();
        loginPhone.classList.add('error');
        return;
      }

      loginPhone.classList.remove('error');
      sendLoginOtpBtn.disabled = true;
      sendLoginOtpBtn.textContent = 'Sending...';

      await sendOtp(phone);

      sendLoginOtpBtn.disabled = false;
      sendLoginOtpBtn.textContent = 'Send OTP';
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = signupName.value.trim();
      const phone = signupPhone.value.replace(/\D/g, '');

      let hasError = false;

      if (!name || name.length < 2) {
        showError('Please enter your full name (at least 2 characters)', this);
        signupName.focus();
        signupName.classList.add('error');
        hasError = true;
      } else {
        signupName.classList.remove('error');
      }

      if (!validatePhone(phone)) {
        if (!hasError) {
          showError('Please enter a valid 10-digit mobile number', this);
        }
        if (!hasError) signupPhone.focus();
        signupPhone.classList.add('error');
        hasError = true;
      } else {
        signupPhone.classList.remove('error');
      }

      if (hasError) return;

      sendSignupOtpBtn.disabled = true;
      sendSignupOtpBtn.textContent = 'Sending...';

      await sendOtp(phone);

      sendSignupOtpBtn.disabled = false;
      sendSignupOtpBtn.textContent = 'Send OTP';
    });
  }

  if (otpForm) {
    otpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      verifyOtp();
    });
  }

  if (changePhoneBtn) {
    changePhoneBtn.addEventListener('click', function () {
      showScreen(currentMode);
      clearErrors();
      if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
      }
    });
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async function () {
      if (this.disabled || !currentPhone) return;

      console.log('Resending OTP...');
      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = 'Sending...';

      const success = await sendOtp(currentPhone);

      if (!success) {
        this.disabled = false;
        this.textContent = originalText;
      }
      // Timer will be started by sendOtp if successful
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', function () {
      closeAuthDrawer();
      // Optional: redirect after success
      // window.location.href = '/';
    });
  }

  // Phone input UX polish with mobile keyboard support
  [loginPhone, signupPhone].forEach(input => {
    if (!input) return;

    // Set numeric inputmode for mobile keyboard
    input.setAttribute('inputmode', 'numeric');

    input.addEventListener('input', function () {
      let value = this.value.replace(/\D/g, '');
      this.value = value.slice(0, 10);
      this.classList.remove('error');
      if (validatePhone(value)) {
        const err = this.parentNode.parentNode.querySelector('.error-message');
        if (err) err.remove();
      }
    });
    input.addEventListener('keydown', function (e) {
      const allow = [46, 8, 9, 27, 13];
      if (allow.includes(e.keyCode) ||
        (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
        (e.keyCode >= 35 && e.keyCode <= 40)) return;
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
        (e.keyCode < 96 || e.keyCode > 105)) e.preventDefault();
    });
  });

  // Name input - normal keyboard
  if (signupName) {
    signupName.addEventListener('input', function () {
      this.classList.remove('error');
      if (this.value.trim().length >= 2) {
        const err = this.parentNode.querySelector('.error-message');
        if (err) err.remove();
      }
    });
  }

  // Email input - email keyboard if exists
  if (signupEmail) {
    signupEmail.setAttribute('inputmode', 'email');
  }

  // ESC to close drawer or menu
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (authDrawer && authDrawer.classList.contains('active')) {
        closeAuthDrawer();
      } else if (mobileNav && mobileNav.classList.contains('active')) {
        toggleMobileMenu();
      }
    }
  });

  // Initialize OTP inputs
  setupOtpInputs();

  // Final sanity: Firebase ready check
  function checkFirebaseAuth() {
    if (typeof firebase === 'undefined') {
      console.error('Firebase not loaded! Make sure Firebase scripts are included.');
      return false;
    }
    if (!firebase.auth) {
      console.error('Firebase Auth not loaded! Make sure firebase-auth script is included.');
      return false;
    }
    try {
      firebase.auth();
      console.log('Firebase Auth instance OK');
      return true;
    } catch (error) {
      console.error('Firebase Auth initialization error:', error);
      return false;
    }
  }

  setTimeout(() => {
    const ok = checkFirebaseAuth();
    if (!ok && headerLoginBtn) {
      headerLoginBtn.addEventListener('click', () =>
        alert('Authentication system is not properly loaded. Please refresh the page and try again.')
      );
    } else {
      console.log('✅ Firebase Auth ready');
      console.log('✅ Header Auth: Initialization complete');
    }
  }, 100);
});