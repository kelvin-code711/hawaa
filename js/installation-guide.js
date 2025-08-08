(function() {
  const hero       = document.querySelector('.gradient-section');
  const heading    = hero.querySelector('h1');
  const background = document.querySelector('.background');
  const toggle     = document.querySelector('.menu-toggle');
  const nav        = document.querySelector('.hero-nav');
  const header     = document.querySelector('.site-header');
  const vh         = window.innerHeight;

  // Video controls
  const video = document.getElementById('installation-video');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const muteBtn = document.getElementById('muteBtn');
  const videoContainer = document.querySelector('.video-container');

  // ── Menu toggle ── (ORIGINAL FUNCTIONALITY PRESERVED)
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('active');
    nav.setAttribute('aria-hidden', !isOpen);
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      nav.setAttribute('aria-hidden', 'true');
    }
  });

  // ── Navigation smooth scrolling ──
  const navLinks = document.querySelectorAll('.hero-nav a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        // Close the navigation menu
        nav.classList.remove('open');
        toggle.classList.remove('active');
        nav.setAttribute('aria-hidden', 'true');
        
        // Calculate the scroll position
        // Since sections are in .background which is fixed, we need to calculate based on section index
        const sections = document.querySelectorAll('.background section');
        const sectionIndex = Array.from(sections).indexOf(targetSection);
        
        // Each section represents one viewport height of scroll
        const targetScrollPosition = (sectionIndex + 1) * vh;
        
        // Smooth scroll to the target position
        window.scrollTo({
          top: targetScrollPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ── Scroll-driven parallax, corner-radius & progress bar ── (MODIFIED SCROLL SPEED)
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Progress bar (0% to 100% based on scroll position)
    const scrollProgress = Math.min(scrollY / documentHeight, 1) * 100;
    header.style.setProperty('--progress', `${scrollProgress}%`);

    // MODIFIED: Increased hero parallax speed from 0.5 to 0.8
    const heroSpeed = 0.8;
    hero.style.transform = `translateY(${ -scrollY * heroSpeed }px)`;

    // Text moves in opposite direction
    const textSpeed = 0.3;
    heading.style.transform = `translateY(${ scrollY * textSpeed }px)`;

    // Freeze background until hero scrolls out
    const heroFullyScrolledAt = vh / heroSpeed;
    if (scrollY < heroFullyScrolledAt) {
      background.style.position = 'fixed';
      background.style.top = '0';
    } else {
      const excess = scrollY - heroFullyScrolledAt;
      background.style.position = 'fixed';
      background.style.top = `-${ excess }px`;
    }

    // Animate bottom radius 0 → 64px over first viewport
    const progress = Math.min(scrollY / vh, 1);
    const radius   = progress * 64;
    hero.style.borderBottomLeftRadius  = `${ radius }px`;
    hero.style.borderBottomRightRadius = `${ radius }px`;
  });

  // Initialize progress bar
  header.style.setProperty('--progress', '0%');

  // ── Video Controls ──
  if (video && playPauseBtn && fullscreenBtn && muteBtn) {
    
    // Play/Pause functionality
    playPauseBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playPauseBtn.querySelector('.play-icon').style.display = 'none';
        playPauseBtn.querySelector('.pause-icon').style.display = 'block';
        videoContainer.classList.remove('paused');
      } else {
        video.pause();
        playPauseBtn.querySelector('.play-icon').style.display = 'block';
        playPauseBtn.querySelector('.pause-icon').style.display = 'none';
        videoContainer.classList.add('paused');
      }
    });

    // Video ended event
    video.addEventListener('ended', () => {
      playPauseBtn.querySelector('.play-icon').style.display = 'block';
      playPauseBtn.querySelector('.pause-icon').style.display = 'none';
      videoContainer.classList.add('paused');
    });

    // Video pause event (for other triggers)
    video.addEventListener('pause', () => {
      videoContainer.classList.add('paused');
    });

    // Video play event (for other triggers)
    video.addEventListener('play', () => {
      videoContainer.classList.remove('paused');
    });

    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
          videoContainer.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    });

    // Mute/Unmute functionality
    muteBtn.addEventListener('click', () => {
      if (video.muted) {
        video.muted = false;
        muteBtn.querySelector('.volume-icon').style.display = 'block';
        muteBtn.querySelector('.mute-icon').style.display = 'none';
      } else {
        video.muted = true;
        muteBtn.querySelector('.volume-icon').style.display = 'none';
        muteBtn.querySelector('.mute-icon').style.display = 'block';
      }
    });

    // Hide controls after video starts playing (except on hover)
    video.addEventListener('play', () => {
      setTimeout(() => {
        if (!video.paused && !videoContainer.matches(':hover')) {
          videoContainer.classList.remove('paused');
        }
      }, 2000);
    });

    // Show controls when video is clicked
    video.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playPauseBtn.querySelector('.play-icon').style.display = 'none';
        playPauseBtn.querySelector('.pause-icon').style.display = 'block';
        videoContainer.classList.remove('paused');
      } else {
        video.pause();
        playPauseBtn.querySelector('.play-icon').style.display = 'block';
        playPauseBtn.querySelector('.pause-icon').style.display = 'none';
        videoContainer.classList.add('paused');
      }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      // Only handle keyboard events when video container is in viewport
      const rect = videoContainer.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isInViewport) {
        switch(e.key) {
          case ' ':
          case 'k':
            e.preventDefault();
            playPauseBtn.click();
            break;
          case 'f':
            e.preventDefault();
            fullscreenBtn.click();
            break;
          case 'm':
            e.preventDefault();
            muteBtn.click();
            break;
        }
      }
    });
  }
})();