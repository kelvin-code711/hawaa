(function() {
  const hero       = document.querySelector('.gradient-section');
  const heading    = hero.querySelector('h1');
  const background = document.querySelector('.background');
  const toggle     = document.querySelector('.menu-toggle');
  const nav        = document.querySelector('.hero-nav');
  const header     = document.querySelector('.site-header');
  
  // Mobile viewport detection and dynamic viewport height support
  let vh = window.innerHeight;
  let isMobile = window.innerWidth <= 768;
  let isTouch = 'ontouchstart' in window;
  let scrollTicking = false;
  
  // Smooth scrolling variables
  let currentScrollY = 0;
  let targetScrollY = 0;
  let ease = 0.15; // Smoothing factor - higher = more responsive
  let isScrolling = false;
  let lastScrollTime = 0;
  
  // Update viewport height on resize (important for mobile)
  function updateViewportHeight() {
    vh = window.innerHeight;
    isMobile = window.innerWidth <= 768;
    
    // Set CSS custom property for dynamic viewport height
    document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
  }
  
  // Initial viewport height setup
  updateViewportHeight();
  
  // Update on resize with debouncing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateViewportHeight, 100);
  });
  
  // Handle orientation changes on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportHeight, 100);
  });

  // Video controls
  const video = document.getElementById('installation-video');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const muteBtn = document.getElementById('muteBtn');
  const videoContainer = document.querySelector('.video-container');

  // Plug & Position section elements
  const plugPositionSection = document.getElementById('plug-position');
  const placementItems = document.querySelectorAll('.placement-item');
  const placementImages = document.querySelectorAll('.placement-image');
  let currentImageIndex = 0;
  let autoScrollInterval;

  // ── Menu toggle ── (ENHANCED FOR MOBILE)
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('active');
    nav.setAttribute('aria-hidden', !isOpen);
    
    // Prevent body scroll when menu is open on mobile
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  // Enhanced click outside detection for mobile
  document.addEventListener('click', (e) => {
    const isHeaderClick = header.contains(e.target);
    const isNavClick = nav.contains(e.target);
    
    if (!isHeaderClick && !isNavClick && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      nav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });
  
  // Handle touch events for better mobile navigation
  if (isTouch) {
    let touchStartY = 0;
    
    nav.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    
    nav.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;
      
      // Prevent rubber band scrolling when at top/bottom of nav
      const navScrollTop = nav.scrollTop;
      const navScrollHeight = nav.scrollHeight;
      const navClientHeight = nav.clientHeight;
      
      if ((navScrollTop === 0 && deltaY > 0) || 
          (navScrollTop + navClientHeight >= navScrollHeight && deltaY < 0)) {
        e.preventDefault();
      }
    });
  }

  // ── Enhanced Navigation smooth scrolling for mobile ──
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
      document.body.style.overflow = '';
      
      let targetScrollPosition;
      
      // Special handling for different sections
      if (targetId === 'filter-installation') {
        const heroSpeed = isMobile ? 0.6 : 0.8;
        const heroFullyScrolledAt = vh / heroSpeed;
        targetScrollPosition = heroFullyScrolledAt;
      } else if (targetId === 'plug-position') {
        // MOBILE-SPECIFIC FIX: Adjust for mobile section heights
        const heroSpeed = isMobile ? 0.6 : 0.8;
        const heroFullyScrolledAt = vh / heroSpeed;
        
        if (isMobile) {
          // Check if it's small mobile (480px) or regular mobile (768px)
          const isSmallMobile = window.innerWidth <= 480;
          const mobileFilterSectionHeight = isSmallMobile ? vh * 0.5 : vh * 0.75; // 50vh for 480px, 75vh for 768px
          targetScrollPosition = heroFullyScrolledAt + mobileFilterSectionHeight;
        } else {
          targetScrollPosition = heroFullyScrolledAt + vh;
        }
      } else {
        // Calculate the scroll position for other sections
        const sections = document.querySelectorAll('.background section');
        const sectionIndex = Array.from(sections).indexOf(targetSection);
        
        const heroSpeed = isMobile ? 0.6 : 0.8;
        const heroFullyScrolledAt = vh / heroSpeed;
        
        if (isMobile) {
          // Mobile section heights calculation
          const isSmallMobile = window.innerWidth <= 480;
          const mobileFilterHeight = isSmallMobile ? vh * 0.5 : vh * 0.75; // 50vh or 75vh
          const mobilePlugHeight = vh * 0.9;   // Keep your plug section height
          const mobileSectionHeight = vh * 0.85; // Keep your other sections height
          
          let totalHeight = heroFullyScrolledAt;
          
          for (let i = 0; i < sectionIndex; i++) {
            if (i === 0) totalHeight += mobileFilterHeight;
            else if (i === 1) totalHeight += mobilePlugHeight;
            else totalHeight += mobileSectionHeight;
          }
          
          targetScrollPosition = totalHeight;
        } else {
          targetScrollPosition = heroFullyScrolledAt + (sectionIndex * vh);
        }
      }
      
      // Use requestAnimationFrame for smoother scrolling on mobile
      const smoothScrollTo = (target) => {
        const start = window.pageYOffset;
        const distance = target - start;
        const duration = isMobile ? 800 : 1000;
        let startTime = null;
        
        const animation = (currentTime) => {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          
          // Easing function for smooth animation
          const easeInOutCubic = progress => {
            return progress < 0.5 
              ? 4 * progress * progress * progress 
              : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
          };
          
          window.scrollTo(0, start + distance * easeInOutCubic(progress));
          
          if (progress < 1) {
            requestAnimationFrame(animation);
          }
        };
        
        requestAnimationFrame(animation);
      };
      
      smoothScrollTo(targetScrollPosition);
    }
  });
});

  // ── Plug & Position Auto-scroll Images ──
  function cycleImages() {
    // Remove active class from current items
    placementItems.forEach(item => item.classList.remove('active'));
    placementImages.forEach(img => img.classList.remove('active'));
    
    // Move to next image
    currentImageIndex = (currentImageIndex + 1) % placementImages.length;
    
    // Add active class to new items
    placementItems[currentImageIndex].classList.add('active');
    placementImages[currentImageIndex].classList.add('active');
  }

  function startAutoScroll() {
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(cycleImages, 3000); // Change every 3 seconds
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Check if plug-position section is in viewport
  function checkPlugPositionVisibility() {
    const rect = plugPositionSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  }

  // Smooth animation loop
  function animate() {
    if (Math.abs(currentScrollY - targetScrollY) > 0.5) {
      currentScrollY += (targetScrollY - currentScrollY) * ease;
      updateParallaxEffects(currentScrollY);
      isScrolling = true;
    } else {
      currentScrollY = targetScrollY;
      if (isScrolling) {
        updateParallaxEffects(currentScrollY);
        isScrolling = false;
      }
    }
    requestAnimationFrame(animate);
  }

  // Update parallax effects with smooth values
  function updateParallaxEffects(scrollY) {
    if (scrollTicking) return;
    
    scrollTicking = true;
    
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Progress bar (0% to 100% based on scroll position)
    const scrollProgress = Math.min(scrollY / documentHeight, 1) * 100;
    header.style.setProperty('--progress', `${scrollProgress}%`);

    // Hero section shrinking effect
    const maxShrinkDistance = vh * 1.5;
    const shrinkProgress = Math.min(scrollY / maxShrinkDistance, 1);
    
    const maxWidthShrink = isMobile ? 10 : 16;
    const maxHeightShrink = isMobile ? 8 : 14;
    
    const currentWidthShrink = shrinkProgress * maxWidthShrink;
    const currentHeightShrink = shrinkProgress * maxHeightShrink;
    
    // Apply shrinking effect
    hero.style.width = `calc(100% - ${currentWidthShrink * 2}px)`;
    hero.style.height = `calc(100vh - ${currentHeightShrink * 2}px)`;
    hero.style.top = `${currentHeightShrink}px`;
    hero.style.left = `${currentWidthShrink}px`;
    
    // For modern browsers with dvh support
    if (CSS.supports('height', '100dvh')) {
      hero.style.height = `calc(100dvh - ${currentHeightShrink * 2}px)`;
    }

    // Smooth parallax with stable transforms to prevent vibration
    if (isMobile) {
      const heroSpeed = 0.6;
      const textSpeed = 0.2;
      
      // Use integers only for transform values to prevent vibration
      const heroTransform = Math.floor(-scrollY * heroSpeed);
      const textTransform = Math.floor(scrollY * textSpeed);
      
      hero.style.transform = `translate3d(0, ${heroTransform}px, 0)`;
      heading.style.transform = `translate3d(0, ${textTransform}px, 0)`;
    } else {
      const heroSpeed = 0.8;
      const textSpeed = 0.3;
      
      // Use integers only for transform values to prevent vibration
      const heroTransform = Math.floor(-scrollY * heroSpeed);
      const textTransform = Math.floor(scrollY * textSpeed);
      
      hero.style.transform = `translateY(${heroTransform}px)`;
      heading.style.transform = `translateY(${textTransform}px)`;
    }

    // Freeze background until hero scrolls out
    const heroSpeed = isMobile ? 0.6 : 0.8;
    const heroFullyScrolledAt = vh / heroSpeed;
    
    if (scrollY < heroFullyScrolledAt) {
      background.style.position = 'fixed';
      background.style.top = '0';
      if (isMobile) {
        background.style.transform = 'translate3d(0, 0, 0)';
      }
    } else {
      const excess = scrollY - heroFullyScrolledAt;
      const roundedExcess = Math.floor(excess);
      background.style.position = 'fixed';
      background.style.top = `-${roundedExcess}px`;
      if (isMobile) {
        background.style.transform = `translate3d(0, -${roundedExcess}px, 0)`;
      }
    }

    // Animate bottom radius 0 → 64px over first viewport
    const progress = Math.min(scrollY / vh, 1);
    const radius = Math.floor(progress * (isMobile ? 32 : 64));
    hero.style.borderBottomLeftRadius = `${radius}px`;
    hero.style.borderBottomRightRadius = `${radius}px`;

    // Handle Plug & Position section opacity and visibility
    const plugPositionRect = plugPositionSection.getBoundingClientRect();
    const plugPositionStart = scrollY + plugPositionRect.top;
    const plugPositionEnd = plugPositionStart + plugPositionRect.height;
    
    // Calculate opacity based on scroll position
    let opacity = 0;
    if (scrollY >= plugPositionStart - vh && scrollY <= plugPositionEnd) {
      const sectionProgress = Math.max(0, Math.min(1, (scrollY - plugPositionStart + vh) / (vh * 0.5)));
      opacity = sectionProgress;
    } else if (scrollY > plugPositionEnd) {
      opacity = 1;
    }
    
    plugPositionSection.style.opacity = opacity;
    plugPositionSection.style.transform = `translateY(${Math.floor((1 - opacity) * 30)}px)`;

    // Check visibility for auto-scroll
    checkPlugPositionVisibility();
    
    scrollTicking = false;
  }

  // Enhanced scroll handler with throttling
  function handleScroll() {
    const now = Date.now();
    
    // Throttle scroll updates for performance
    if (now - lastScrollTime >= (isMobile ? 16 : 8)) {
      targetScrollY = window.scrollY;
      lastScrollTime = now;
    }
  }

  // Start the smooth animation loop
  animate();

  // Use passive scroll listener for better mobile performance
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Initialize progress bar
  header.style.setProperty('--progress', '0%');

  // ── Enhanced Video Controls for Mobile ──
  if (video && playPauseBtn && fullscreenBtn && muteBtn) {
    
    // Enhanced play/pause for mobile
    const togglePlayPause = () => {
      if (video.paused) {
        video.play().catch(e => console.log('Video play failed:', e));
        playPauseBtn.querySelector('.play-icon').style.display = 'none';
        playPauseBtn.querySelector('.pause-icon').style.display = 'block';
        videoContainer.classList.remove('paused');
      } else {
        video.pause();
        playPauseBtn.querySelector('.play-icon').style.display = 'block';
        playPauseBtn.querySelector('.pause-icon').style.display = 'none';
        videoContainer.classList.add('paused');
      }
    };

    // Play/Pause functionality with touch optimization
    playPauseBtn.addEventListener('click', togglePlayPause);
    video.addEventListener('click', togglePlayPause);
    
    // Touch events for better mobile interaction
    if (isTouch) {
      let touchTimeout;
      
      video.addEventListener('touchstart', (e) => {
        touchTimeout = setTimeout(() => {
          videoContainer.classList.add('paused');
        }, 500);
      });
      
      video.addEventListener('touchend', (e) => {
        clearTimeout(touchTimeout);
        if (!videoContainer.classList.contains('paused')) {
          togglePlayPause();
        }
      });
      
      video.addEventListener('touchcancel', () => {
        clearTimeout(touchTimeout);
      });
    }

    // Video state events
    video.addEventListener('ended', () => {
      playPauseBtn.querySelector('.play-icon').style.display = 'block';
      playPauseBtn.querySelector('.pause-icon').style.display = 'none';
      videoContainer.classList.add('paused');
    });

    video.addEventListener('pause', () => {
      videoContainer.classList.add('paused');
    });

    video.addEventListener('play', () => {
      videoContainer.classList.remove('paused');
    });

    // Enhanced fullscreen with mobile support
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        const requestFullscreen = videoContainer.requestFullscreen || 
                                 videoContainer.webkitRequestFullscreen || 
                                 videoContainer.msRequestFullscreen ||
                                 videoContainer.webkitEnterFullscreen;
        
        if (requestFullscreen) {
          requestFullscreen.call(videoContainer);
        }
      } else {
        const exitFullscreen = document.exitFullscreen || 
                              document.webkitExitFullscreen || 
                              document.msExitFullscreen;
        
        if (exitFullscreen) {
          exitFullscreen.call(document);
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

    // Mobile-optimized control visibility
    if (isMobile) {
      videoContainer.classList.add('paused');
      
      video.addEventListener('play', () => {
        setTimeout(() => {
          if (!video.paused) {
            videoContainer.classList.remove('paused');
          }
        }, 3000);
      });
    } else {
      video.addEventListener('play', () => {
        setTimeout(() => {
          if (!video.paused && !videoContainer.matches(':hover')) {
            videoContainer.classList.remove('paused');
          }
        }, 2000);
      });
    }

    // Enhanced keyboard controls with mobile detection
    document.addEventListener('keydown', (e) => {
      if (isMobile) return;
      
      const rect = videoContainer.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isInViewport) {
        switch(e.key) {
          case ' ':
          case 'k':
            e.preventDefault();
            togglePlayPause();
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

    // Handle video loading states for mobile
    video.addEventListener('loadstart', () => {
      videoContainer.classList.add('loading');
    });

    video.addEventListener('canplay', () => {
      videoContainer.classList.remove('loading');
    });

    video.addEventListener('waiting', () => {
      videoContainer.classList.add('loading');
    });

    video.addEventListener('playing', () => {
      videoContainer.classList.remove('loading');
    });
  }

  // ── Mobile-specific performance optimizations ──
  if (isMobile) {
    // Keep same easing for mobile
    ease = 0.15;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (video && !video.paused) {
          video.pause();
        }
        stopAutoScroll();
      } else {
        checkPlugPositionVisibility();
      }
    });

    let lastInnerHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      const currentInnerHeight = window.innerHeight;
      const heightDifference = Math.abs(currentInnerHeight - lastInnerHeight);
      
      if (heightDifference > 100) {
        updateViewportHeight();
        lastInnerHeight = currentInnerHeight;
      }
    });
  }

  // ── iOS Safari specific fixes ──
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isIOS) {
    document.body.addEventListener('touchmove', (e) => {
      if (nav.classList.contains('open')) {
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        updateViewportHeight();
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      }, 300);
    });
  }

  // Initial scroll position handling and reset hero dimensions
  window.addEventListener('load', () => {
    hero.style.width = '100%';
    hero.style.height = '100vh';
    hero.style.top = '0';
    hero.style.left = '0';
    
    if (CSS.supports('height', '100dvh')) {
      hero.style.height = '100dvh';
    }
    
    // Initialize with current scroll position
    currentScrollY = targetScrollY = window.scrollY;
    if (window.scrollY > 0) {
      updateParallaxEffects(currentScrollY);
    }
  });
})();