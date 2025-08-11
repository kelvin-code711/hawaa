(function() {
  'use strict';

  // ── Mobile Viewport Height Fix ──
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVH();
  window.addEventListener('resize', setVH);

  // ── Header Navigation & Progress ──
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.hero-nav');
  const navLinks = document.querySelectorAll('.hero-nav a');
  
  // Create progress bar element if it doesn't exist
  if (header && !header.querySelector('.header-progress')) {
    const progressBar = document.createElement('div');
    progressBar.className = 'header-progress';
    progressBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: #0070f3;
      width: 0%;
      transition: width 0.2s ease;
      z-index: 100;
    `;
    header.appendChild(progressBar);
  }

  // ── NAV: link steps to sections (hero excluded) + smooth scroll + active state ──
  const STEP_TO_ID = {
    'Filter Installation': 's1',
    'Plug & Position': 's2',
    'App Pairing': 's3',
    'App Pairing & Setup': 's3',
    'Filter Maintenance': 's5',
    'Replace Filter': 's4',
    'Replacing the Filter': 's4',
    'Troubleshooting': 's6',
    'Support': 's6'
  };

  // Normalize hrefs so highlighting works even if HTML order changes
  navLinks.forEach(link => {
    const title = (link.querySelector('.step-title')?.textContent || '').trim();
    const mappedId = STEP_TO_ID[title] || link.hash.replace('#', '');
    if (mappedId && mappedId !== 'hero') {
      link.setAttribute('href', `#${mappedId}`);
      link.dataset.target = mappedId;
    }
  });

  function scrollToSection(id) {
    if (!id || id === 'hero') return;
    const target = document.getElementById(id);
    if (!target) return;

    const headerH = header ? header.offsetHeight : 0;
    const y = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerH - 20);

    window.scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);

    // close the dropdown if open
    if (menuToggle && nav) {
      menuToggle.classList.remove('active');
      nav.classList.remove('open');
      nav.setAttribute('aria-hidden', 'true');
    }
  }

  // Active-state highlighting (excludes hero)
  const linksById = new Map(
    Array.from(navLinks).map(a => [a.dataset.target || a.hash.replace('#', ''), a])
  );

  function updateActive() {
    const scrollPos = window.scrollY + (header ? header.offsetHeight : 0) + 100;
    const sections = document.querySelectorAll('section[id]:not(#hero)');
    let activeId = null;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) activeId = sec.id;
    });

    navLinks.forEach(a => a.classList.remove('active'));
    if (activeId && linksById.get(activeId)) {
      linksById.get(activeId).classList.add('active');
    }
  }

  // ── Scroll Progress ──
  function updateProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    
    const progressBar = header ? header.querySelector('.header-progress') : null;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  // Toggle mobile menu
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      menuToggle.classList.toggle('active', !isOpen);
      nav.classList.toggle('open', !isOpen);
      nav.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        nav.classList.remove('open');
        nav.setAttribute('aria-hidden', 'true');
      }
    });

    // Click → smooth scroll (uses normalized data-target)
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        scrollToSection(link.dataset.target || link.hash.replace('#', ''));
      });
    });
  }

  // If the page opens with a hash, normalize it (but never to hero)
  if (location.hash) {
    const id = location.hash.replace('#', '');
    const normalized = Array.from(linksById.keys()).includes(id) ? id : null;
    if (normalized && normalized !== 'hero') {
      setTimeout(() => scrollToSection(normalized), 0);
    }
  }

  // ── Filter Installation Video Controls ──
  const installationVideo = document.getElementById('installation-video');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const muteBtn = document.getElementById('muteBtn');

  if (installationVideo && playPauseBtn) {
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    const videoContainer = installationVideo.closest('.video-container');

    // Play/Pause functionality
    playPauseBtn.addEventListener('click', () => {
      if (installationVideo.paused) {
        installationVideo.play().catch(e => console.log('Video play failed:', e));
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        videoContainer.classList.remove('paused');
      } else {
        installationVideo.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        videoContainer.classList.add('paused');
      }
    });

    // Video ended event
    installationVideo.addEventListener('ended', () => {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      videoContainer.classList.add('paused');
    });

    // Fullscreen functionality - modified for mobile
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen().catch(e => console.log('Fullscreen error:', e));
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
          videoContainer.msRequestFullscreen();
        } else if (installationVideo.webkitEnterFullscreen) {
          // iOS specific fullscreen
          installationVideo.webkitEnterFullscreen();
        }
      });
    }

    // Mute functionality
    if (muteBtn) {
      const volumeIcon = muteBtn.querySelector('.volume-icon');
      const muteIcon = muteBtn.querySelector('.mute-icon');

      muteBtn.addEventListener('click', () => {
        installationVideo.muted = !installationVideo.muted;
        if (installationVideo.muted) {
          volumeIcon.style.display = 'none';
          muteIcon.style.display = 'block';
        } else {
          volumeIcon.style.display = 'block';
          muteIcon.style.display = 'none';
        }
      });
    }
  }

  // ── Plug & Position Interactive Content ──
  const placementItems = document.querySelectorAll('.placement-item');
  const placementImages = document.querySelectorAll('.placement-image');
  let currentPlacementIndex = 0;
  let placementInterval;

  function showPlacementItem(index) {
    placementItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    placementImages.forEach((img, i) => {
      img.classList.toggle('active', i === index);
      // Ensure images are visible by forcing display (mobile fix)
      img.style.display = i === index ? 'block' : 'none';
    });
  }

  function startPlacementRotation() {
    if (placementItems.length > 1) {
      placementInterval = setInterval(() => {
        currentPlacementIndex = (currentPlacementIndex + 1) % placementItems.length;
        showPlacementItem(currentPlacementIndex);
      }, 4000); // Change every 4 seconds
    }
  }

  function stopPlacementRotation() {
    if (placementInterval) {
      clearInterval(placementInterval);
    }
  }

  // Manual placement item interaction - enhanced for touch devices
  placementItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      stopPlacementRotation();
      currentPlacementIndex = index;
      showPlacementItem(index);
      // Restart auto-rotation after 8 seconds
      setTimeout(startPlacementRotation, 8000);
    });

    // Add touch events for better mobile interaction
    item.addEventListener('touchstart', (e) => {
      e.preventDefault();
      stopPlacementRotation();
      currentPlacementIndex = index;
      showPlacementItem(index);
    });

    item.addEventListener('touchend', () => {
      // Restart auto-rotation after 8 seconds
      setTimeout(startPlacementRotation, 8000);
    });
  });

  // ── App Pairing Video ──
  const appVideo = document.getElementById('app-pairing-video');
  if (appVideo) {
    // Auto-play when in viewport - modified for mobile autoplay restrictions
    const appVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // On mobile, we need user interaction to play video
          const playPromise = appVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Add fallback play button for mobile
              if (!document.querySelector('.mobile-video-play-button')) {
                const playBtn = document.createElement('button');
                playBtn.className = 'mobile-video-play-button';
                playBtn.innerHTML = '▶ Play Video';
                playBtn.style.cssText = `
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  padding: 10px 20px;
                  background: rgba(0,0,0,0.7);
                  color: white;
                  border: none;
                  border-radius: 5px;
                  z-index: 10;
                `;
                playBtn.addEventListener('click', () => {
                  appVideo.play();
                  playBtn.style.display = 'none';
                });
                appVideo.parentNode.appendChild(playBtn);
              }
            });
          }
        } else {
          appVideo.pause();
        }
      });
    }, { threshold: 0.5 });

    appVideoObserver.observe(appVideo);
  }

  // ── Section 4: Replacing Filter Auto-rotation ──
  const replacingImages = document.querySelectorAll('.replacing-image');
  let currentReplacingIndex = 0;
  let replacingInterval;

  function showReplacingImage(index) {
    replacingImages.forEach((img, i) => {
      img.classList.toggle('active', i === index);
      // Ensure images are visible on mobile
      img.style.display = i === index ? 'block' : 'none';
    });
  }

  function startReplacingRotation() {
    if (replacingImages.length > 1) {
      replacingInterval = setInterval(() => {
        currentReplacingIndex = (currentReplacingIndex + 1) % replacingImages.length;
        showReplacingImage(currentReplacingIndex);
      }, 5000); // Change every 5 seconds
    }
  }

  function stopReplacingRotation() {
    if (replacingInterval) {
      clearInterval(replacingInterval);
    }
  }

  // ── Section 5: Filter Maintenance Interactive Content ──
  const maintenanceItems = document.querySelectorAll('.maintenance-item');
  const maintenanceImages = document.querySelectorAll('.maintenance-image');
  let currentMaintenanceIndex = 0;
  let maintenanceInterval;

  function showMaintenanceItem(index) {
    maintenanceItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    maintenanceImages.forEach((img, i) => {
      img.classList.toggle('active', i === index);
      // Ensure images are visible on mobile
      img.style.display = i === index ? 'block' : 'none';
    });
  }

  function startMaintenanceRotation() {
    if (maintenanceItems.length > 1) {
      maintenanceInterval = setInterval(() => {
        currentMaintenanceIndex = (currentMaintenanceIndex + 1) % maintenanceItems.length;
        showMaintenanceItem(currentMaintenanceIndex);
      }, 6000); // Change every 6 seconds
    }
  }

  function stopMaintenanceRotation() {
    if (maintenanceInterval) {
      clearInterval(maintenanceInterval);
    }
  }

  // Manual maintenance item interaction - enhanced for touch devices
  maintenanceItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      stopMaintenanceRotation();
      currentMaintenanceIndex = index;
      showMaintenanceItem(index);
      // Restart auto-rotation after 8 seconds
      setTimeout(startMaintenanceRotation, 8000);
    });

    // Add touch events for better mobile interaction
    item.addEventListener('touchstart', (e) => {
      e.preventDefault();
      stopMaintenanceRotation();
      currentMaintenanceIndex = index;
      showMaintenanceItem(index);
    });

    item.addEventListener('touchend', () => {
      // Restart auto-rotation after 8 seconds
      setTimeout(startMaintenanceRotation, 8000);
    });
  });

  // ── Intersection Observer for Section Animations ──
  const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target;
        section.classList.add('visible');

        // Start section-specific interactions when visible
        if (section.classList.contains('plug-position-section')) {
          startPlacementRotation();
        }
        if (section.classList.contains('replacing-filter-section') && section.id === 's4') {
          startReplacingRotation();
        }
        if (section.classList.contains('filter-maintenance-section') && section.id === 's5') {
          startMaintenanceRotation();
        }
      } else {
        const section = entry.target;
        
        // Stop interactions when section leaves viewport
        if (section.classList.contains('plug-position-section')) {
          stopPlacementRotation();
        }
        if (section.classList.contains('replacing-filter-section') && section.id === 's4') {
          stopReplacingRotation();
        }
        if (section.classList.contains('filter-maintenance-section') && section.id === 's5') {
          stopMaintenanceRotation();
        }
      }
    });
  }, observerOptions);

  // Observe all main sections
  document.querySelectorAll('section').forEach(section => {
    sectionObserver.observe(section);
  });

  // ── Button Interactions ──
  const downloadBtn = document.querySelector('.download-btn');
  const orderBtn = document.querySelector('.order-btn');
  const maintenanceBtn = document.querySelector('.maintenance-btn');
  const registerBtn = document.querySelector('.register-btn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Add download functionality here
      console.log('Download setup guide');
    });
  }

  if (orderBtn) {
    orderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Add order functionality here
      console.log('Order replacement filters');
    });
  }

  if (maintenanceBtn) {
    maintenanceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Add maintenance scheduling functionality here
      console.log('Schedule maintenance');
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Add registration functionality here
      console.log('Register product');
    });
  }

  // ── Mobile-Specific Enhancements ──
  
  // Handle viewport resize
  function handleResize() {
    // Reset placement images display on resize
    showPlacementItem(currentPlacementIndex);
    showReplacingImage(currentReplacingIndex);
    showMaintenanceItem(currentMaintenanceIndex);
    
    // Adjust video sizes for mobile
    if (window.innerWidth < 768) {
      if (installationVideo) {
        installationVideo.style.width = '100%';
        installationVideo.style.height = 'auto';
      }
      if (appVideo) {
        appVideo.style.width = '100%';
        appVideo.style.height = 'auto';
      }
    }
  }
  
  window.addEventListener('resize', handleResize);

  // ── Initialize Everything ──
  function init() {
    // Initial state - ensure first items are visible
    showPlacementItem(0);
    showReplacingImage(0);
    showMaintenanceItem(0);
    
    updateProgress();
    updateActive();
    
    // Add loaded class to body for CSS transitions
    document.body.classList.add('loaded');
    
    // Mobile-specific initializations
    if (window.innerWidth < 768) {
      // Adjust any mobile-specific settings
      handleResize();
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Error Handling ──
  window.addEventListener('error', (e) => {
    console.warn('Installation guide error:', e.error);
  });

  // ── Cleanup on Page Unload ──
  window.addEventListener('beforeunload', () => {
    stopPlacementRotation();
    stopReplacingRotation();
    stopMaintenanceRotation();
  });

  // ── Scroll Event Listener ──
  window.addEventListener('scroll', () => {
    updateProgress();
    updateActive();
  }, { passive: true });

})();