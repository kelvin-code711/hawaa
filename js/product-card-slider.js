document.addEventListener('DOMContentLoaded', function() {
  initAppleSlider('hawaa-product-slider');
});

function initAppleSlider(sectionId) {
  const slider = document.getElementById(sectionId);
  if (!slider) return;
  
  // Core elements
  const track = slider.querySelector('.apple-slider__track');
  const container = slider.querySelector('.apple-slider__container');
  const prevBtn = slider.querySelector('.apple-slider__arrow--prev');
  const nextBtn = slider.querySelector('.apple-slider__arrow--next');
  const dotsContainer = slider.querySelector('.apple-slider__dots');
  
  // Configuration options
  const autoplay = true;
  const autoplaySpeed = 6000;
  const transitionSpeed = 0.7;
  
  // Get original slides
  const originalSlides = Array.from(slider.querySelectorAll('.apple-slider__slide'));
  const slideCount = originalSlides.length;
  
  // Early exit if no slides
  if (slideCount === 0) return;
  
  // Setup for infinite loop
  function setupInfiniteLoop() {
    // Remove any existing clones
    track.querySelectorAll('.clone').forEach(el => el.remove());
    
    // Clone slides for infinite loop
    const cloneCount = Math.max(2, slideCount);
    
    // Clone slides and append them
    for (let repeat = 0; repeat < cloneCount; repeat++) {
      for (let i = 0; i < slideCount; i++) {
        const clone = originalSlides[i].cloneNode(true);
        clone.classList.add('clone');
        clone.setAttribute('aria-hidden', 'true');
        clone.dataset.clone = 'true';
        clone.dataset.index = i;
        track.appendChild(clone);
      }
    }
    
    // Clone slides and prepend them
    for (let repeat = 0; repeat < cloneCount; repeat++) {
      for (let i = slideCount - 1; i >= 0; i--) {
        const clone = originalSlides[i].cloneNode(true);
        clone.classList.add('clone');
        clone.setAttribute('aria-hidden', 'true');
        clone.dataset.clone = 'true';
        clone.dataset.index = i;
        track.insertBefore(clone, track.firstChild);
      }
    }
    
    return Array.from(track.querySelectorAll('.apple-slider__slide'));
  }
  
  // Set up slides
  const slides = setupInfiniteLoop();
  
  // Create dots for navigation
  originalSlides.forEach(function(_, idx) {
    const dot = document.createElement('button');
    dot.className = 'apple-slider__dot';
    dot.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
    dot.dataset.index = idx;
    dotsContainer.appendChild(dot);
  });
  
  const dots = Array.from(dotsContainer.querySelectorAll('.apple-slider__dot'));
  
  // State variables
  let currentIndex = slideCount * 2; // Start with first original slide
  let autoplayTimer;
  let isDragging = false;
  let isTransitioning = false;
  
  // Performance optimization variables
  let lastUpdateTime = 0;
  const updateThrottle = 16; // 60fps
  
  /**
   * Updates active classes based on current index
   */
  function updateActiveClasses() {
    const realIndex = currentIndex % slideCount;
    
    // Batch DOM updates for better performance
    requestAnimationFrame(() => {
      // Update slides
      slides.forEach(function(slide) {
        slide.classList.remove('active');
      });
      
      slides.forEach(function(slide, idx) {
        const slideIndex = parseInt(slide.dataset.index);
        if (slideIndex === realIndex) {
          slide.classList.add('active');
        }
      });
      
      // Update dots
      dots.forEach(function(dot, idx) {
        if (idx === realIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });
  }
  
  /**
   * ENHANCED CENTERING CALCULATION WITH SMOOTHER PERFORMANCE
   */
  function updateSlidePositions(animate) {
    if (animate === undefined) animate = true;
    
    // Throttle updates for better performance
    const now = performance.now();
    if (animate && (now - lastUpdateTime) < updateThrottle) {
      return;
    }
    lastUpdateTime = now;
    
    if (isTransitioning && animate) return;
    
    const containerWidth = container.offsetWidth;
    const slideWidth = slides[0] ? slides[0].offsetWidth : 0;
    if (!slideWidth) return;
    
    // SMOOTHER CENTERING CALCULATION
    const containerCenter = containerWidth / 2;
    const slideCenter = slideWidth / 2;
    
    // Calculate total width of one slide including gap - RESPONSIVE
    const currentIsMobile = window.innerWidth <= 767;
    const gapProperty = currentIsMobile ? '--mobile-card-gap' : '--card-gap';
    const gap = parseInt(getComputedStyle(slider).getPropertyValue(gapProperty)) || 0;
    const slideWithGap = slideWidth + gap;
    
    // Calculate the exact offset to center the current slide
    const totalOffset = currentIndex * slideWithGap;
    const centeringOffset = containerCenter - slideCenter - totalOffset;
    
    // Apply transform with HARDWARE ACCELERATION for smoother animation
    if (animate) {
      isTransitioning = true;
      track.style.transition = `transform ${transitionSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      
      setTimeout(function() {
        isTransitioning = false;
      }, transitionSpeed * 1000);
    } else {
      track.style.transition = 'none';
    }
    
    // Use translate3d for hardware acceleration and smoother performance
    track.style.transform = `translate3d(${centeringOffset}px, 0, 0)`;
    
    // Reset transition for next time with requestAnimationFrame for smoothness
    if (!animate) {
      requestAnimationFrame(() => {
        track.style.transition = `transform ${transitionSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      });
    }
    
    updateActiveClasses();
  }
  
  /**
   * Handle infinite loop jumps with smoother transitions
   */
  function handleLoopJump() {
    setTimeout(function() {
      if (isTransitioning) return;
      
      // If we've gone past the end, jump to the start
      if (currentIndex >= slideCount * 3) {
        currentIndex = slideCount * 2;
        updateSlidePositions(false);
      } 
      // If we've gone before the start, jump to the end
      else if (currentIndex < slideCount * 2) {
        currentIndex = slideCount * 3 - 1;
        updateSlidePositions(false);
      }
    }, transitionSpeed * 1000 + 50);
  }
  
  /**
   * Go to a specific slide with smoother animation
   */
  function goToSlide(index, animate) {
    if (animate === undefined) animate = true;
    if (isTransitioning && animate) return;
    
    currentIndex = index;
    updateSlidePositions(animate);
    handleLoopJump();
  }
  
  /**
   * Navigation functions
   */
  function nextSlide() {
    goToSlide(currentIndex + 1);
  }
  
  function prevSlide() {
    goToSlide(currentIndex - 1);
  }
  
  /**
   * Autoplay functions
   */
  function startAutoplay() {
    if (autoplay && slideCount > 1 && !isDragging) {
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, autoplaySpeed);
    }
  }
  
  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }
  
  // Event listeners
  prevBtn.addEventListener('click', function() {
    if (isTransitioning) return;
    stopAutoplay();
    prevSlide();
    startAutoplay();
  });
  
  nextBtn.addEventListener('click', function() {
    if (isTransitioning) return;
    stopAutoplay();
    nextSlide();
    startAutoplay();
  });
  
  // Slide click handlers
  slides.forEach(function(slide, index) {
    slide.addEventListener('click', function(e) {
      if (!slide.classList.contains('active') && !isTransitioning) {
        e.preventDefault();
        stopAutoplay();
        const slideIndex = parseInt(slide.dataset.index);
        
        // Find the closest instance of this slide to current position
        let targetIndex = currentIndex;
        let minDistance = Infinity;
        
        slides.forEach(function(s, idx) {
          if (parseInt(s.dataset.index) === slideIndex) {
            const distance = Math.abs(idx - currentIndex);
            if (distance < minDistance) {
              minDistance = distance;
              targetIndex = idx;
            }
          }
        });
        
        goToSlide(targetIndex);
        startAutoplay();
      }
    });
  });
  
  // Dot click handlers
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      if (isTransitioning) return;
      stopAutoplay();
      const targetSlideIndex = parseInt(this.dataset.index);
      goToSlide(targetSlideIndex + slideCount * 2);
      startAutoplay();
    });
  });
  
  // Enhanced touch handling for smoother mobile experience
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;
  
  slider.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchMoved = false;
    isDragging = true;
    stopAutoplay();
  }, { passive: true });
  
  slider.addEventListener('touchmove', function(e) {
    const touchDistance = Math.abs(e.changedTouches[0].screenX - touchStartX);
    if (touchDistance > 10) {
      touchMoved = true;
    }
  }, { passive: true });
  
  slider.addEventListener('touchend', function(e) {
    isDragging = false;
    if (!touchMoved || isTransitioning) {
      startAutoplay();
      return;
    }
    
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const xDiff = touchStartX - touchEndX;
    const yDiff = touchStartY - touchEndY;
    
    // Only respond to horizontal swipes with sufficient distance
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
      if (xDiff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    startAutoplay();
  }, { passive: true });
  
  // Keyboard navigation
  slider.addEventListener('keydown', function(e) {
    if (isTransitioning) return;
    
    if (e.key === 'ArrowLeft') {
      stopAutoplay();
      prevSlide();
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      stopAutoplay();
      nextSlide();
      startAutoplay();
    }
  });
  
  // Enhanced resize handling with debouncing for smoother performance
  function handleResize() {
    requestAnimationFrame(() => {
      updateSlidePositions(false);
    });
  }
  
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 100);
  });
  
  window.addEventListener('orientationchange', function() {
    setTimeout(handleResize, 300);
  });
  
  // Initialize the slider with smoother startup
  function initialize() {
    requestAnimationFrame(() => {
      updateSlidePositions(false);
      updateActiveClasses();
      
      // Make the first dot active
      if (dots.length > 0) {
        dots[0].classList.add('active');
      }
      
      // Start autoplay
      startAutoplay();
    });
  }
  
  // Use requestAnimationFrame for smoother initialization
  setTimeout(initialize, 100);
}