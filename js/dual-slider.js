document.addEventListener('DOMContentLoaded', function() {
    initReviewSlider();
    initBlogSlider();
});

// Review Card Slider Initialization
function initReviewSlider() {
    const container = document.getElementById('dual-slider');
    if (!container) return;
    
    const slides = container.querySelectorAll('.rc-slide');
    const dots = container.querySelectorAll('.rc-dot');
    const prevBtn = container.querySelector('.rc-arrow--prev');
    const nextBtn = container.querySelector('.rc-arrow--next');
    const slideContainer = container.querySelector('.rc-slides');
    const sliderWrapper = container.querySelector('.rc-slider-wrapper');
    
    if (!slides.length || !slideContainer) return;
    
    let currentIndex = 0;
    const slideCount = slides.length;
    
    // Check if mobile view
    const isMobile = window.innerWidth <= 767;
    
    // Update navigation buttons state based on current slide
    function updateNavigationState() {
        if (slideCount <= 1) {
            // Hide navigation if only one slide
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            hideAllDots();
            return;
        }
        
        // Update arrow disabled state (only for desktop)
        if (!isMobile) {
            if (prevBtn) {
                if (currentIndex === 0) {
                    prevBtn.classList.add('rc-arrow--disabled');
                } else {
                    prevBtn.classList.remove('rc-arrow--disabled');
                }
            }
            
            if (nextBtn) {
                if (currentIndex === slideCount - 1) {
                    nextBtn.classList.add('rc-arrow--disabled');
                } else {
                    nextBtn.classList.remove('rc-arrow--disabled');
                }
            }
        }
        
        // Show correct number of dots (max 4)
        const maxVisibleDots = 4;
        for (let i = 0; i < dots.length; i++) {
            if (i < Math.min(slideCount, maxVisibleDots)) {
                dots[i].style.display = 'block';
            } else {
                dots[i].style.display = 'none';
            }
        }
    }
    
    updateNavigationState();
    
    // Set up event listeners for desktop navigation
    if (prevBtn) prevBtn.addEventListener('click', goToPrevSlide);
    if (nextBtn) nextBtn.addEventListener('click', goToNextSlide);
    
    // Set up dots
    updateDots();
    dots.forEach((dot, index) => {
        if (index < Math.min(slideCount, dots.length)) {
            dot.addEventListener('click', function() {
                goToSlide(index);
            });
        }
    });
    
    // One-to-one relationship between slides and dots
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index < Math.min(slideCount, 4)) { // Max 4 dots
                dot.style.display = 'block';
                if (index === currentIndex % 4) { // Cycle through dots for more than 4 slides
                    dot.classList.add('rc-dot--active');
                } else {
                    dot.classList.remove('rc-dot--active');
                }
            } else {
                dot.style.display = 'none';
            }
        });
    }
    
    function hideAllDots() {
        dots.forEach(dot => {
            dot.style.display = 'none';
        });
    }
    
    // Autoplay functionality
    let autoplayTimer;
    
    function startAutoplay() {
        if (slideCount > 1) {
            autoplayTimer = setInterval(goToNextSlide, 4000);
        }
    }
    
    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
        }
    }
    
    // Navigation functions
    function goToSlide(index) {
        if (index < 0) index = slideCount - 1;
        if (index >= slideCount) index = 0;
        
        // Update active state
        currentIndex = index;
        updateSlider();
    }
    
    function goToPrevSlide() {
        goToSlide(currentIndex - 1);
    }
    
    function goToNextSlide() {
        goToSlide(currentIndex + 1);
    }
    
    function updateSlider() {
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            slideContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        });
        
        // Update dots - showing the current position in sets of 4
        updateDots();
        
        // Update arrow states
        updateNavigationState();
    }
    
    // Enhanced swipe functionality for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let swipeDetected = false;
    
    // Add touch event handlers to prevent page scrolling during horizontal swipe
    if (sliderWrapper) {
        sliderWrapper.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            swipeDetected = false;
            stopAutoplay();
        }, { passive: true });

        sliderWrapper.addEventListener('touchmove', function(e) {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touchCurrentX = e.changedTouches[0].screenX;
                const touchCurrentY = e.changedTouches[0].screenY;
                const xDiff = touchStartX - touchCurrentX;
                const yDiff = touchStartY - touchCurrentY;
                
                // If horizontal swipe is more significant than vertical scroll
                if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 10) {
                    swipeDetected = true;
                    // Prevent page scroll
                    e.preventDefault();
                }
            }
        }, { passive: false }); // Important: passive must be false to call preventDefault

        sliderWrapper.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            if (swipeDetected) {
                handleSwipe();
            }
            startAutoplay();
        }, { passive: true });
    }
    
    function handleSwipe() {
        const threshold = 30; // Smaller threshold for more sensitivity
        const swipeDistance = Math.abs(touchEndX - touchStartX);
        
        // More sensitive swipe detection
        if (swipeDistance > threshold) {
            if (touchEndX < touchStartX) {
                goToNextSlide();
            } else {
                goToPrevSlide();
            }
        }
    }
    
    // Pause autoplay on hover (desktop only)
    if (!isMobile && sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', stopAutoplay);
        sliderWrapper.addEventListener('mouseleave', startAutoplay);
    }
    
    // Start autoplay
    startAutoplay();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateNavigationState();
        }, 100);
    });
}

// Blog Card Slider Initialization
function initBlogSlider() {
    const container = document.getElementById('dual-slider');
    if (!container) return;
    
    const slides = container.querySelectorAll('.bc-slide');
    const dots = container.querySelectorAll('.bc-dot');
    const prevBtn = container.querySelector('.bc-arrow--prev');
    const nextBtn = container.querySelector('.bc-arrow--next');
    const slideContainer = container.querySelector('.bc-slides');
    const sliderWrapper = container.querySelector('.bc-slider-wrapper');
    
    if (!slides.length || !slideContainer) return;
    
    let currentIndex = 0;
    const slideCount = slides.length;
    
    // Check if mobile view
    const isMobile = window.innerWidth <= 767;
    
    // Update navigation buttons state based on current slide
    function updateNavigationState() {
        if (slideCount <= 1) {
            // Hide navigation if only one slide
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            hideAllDots();
            return;
        }
        
        // Update arrow disabled state (only for desktop)
        if (!isMobile) {
            if (prevBtn) {
                if (currentIndex === 0) {
                    prevBtn.classList.add('bc-arrow--disabled');
                } else {
                    prevBtn.classList.remove('bc-arrow--disabled');
                }
            }
            
            if (nextBtn) {
                if (currentIndex === slideCount - 1) {
                    nextBtn.classList.add('bc-arrow--disabled');
                } else {
                    nextBtn.classList.remove('bc-arrow--disabled');
                }
            }
        }
        
        // Show correct number of dots (max 4)
        const maxVisibleDots = 4;
        for (let i = 0; i < dots.length; i++) {
            if (i < Math.min(slideCount, maxVisibleDots)) {
                dots[i].style.display = 'block';
            } else {
                dots[i].style.display = 'none';
            }
        }
    }
    
    updateNavigationState();
    
    // Set up event listeners for desktop navigation
    if (prevBtn) prevBtn.addEventListener('click', goToPrevSlide);
    if (nextBtn) nextBtn.addEventListener('click', goToNextSlide);
    
    // Set up dots
    updateDots();
    dots.forEach((dot, index) => {
        if (index < Math.min(slideCount, dots.length)) {
            dot.addEventListener('click', function() {
                goToSlide(index);
            });
        }
    });
    
    // One-to-one relationship between slides and dots
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index < Math.min(slideCount, 4)) { // Max 4 dots
                dot.style.display = 'block';
                if (index === currentIndex % 4) { // Cycle through dots for more than 4 slides
                    dot.classList.add('bc-dot--active');
                } else {
                    dot.classList.remove('bc-dot--active');
                }
            } else {
                dot.style.display = 'none';
            }
        });
    }
    
    function hideAllDots() {
        dots.forEach(dot => {
            dot.style.display = 'none';
        });
    }
    
    // Autoplay functionality
    let autoplayTimer;
    
    function startAutoplay() {
        if (slideCount > 1) {
            autoplayTimer = setInterval(goToNextSlide, 4000);
        }
    }
    
    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
        }
    }
    
    // Navigation functions
    function goToSlide(index) {
        if (index < 0) index = slideCount - 1;
        if (index >= slideCount) index = 0;
        
        // Update active state
        currentIndex = index;
        updateSlider();
    }
    
    function goToPrevSlide() {
        goToSlide(currentIndex - 1);
    }
    
    function goToNextSlide() {
        goToSlide(currentIndex + 1);
    }
    
    function updateSlider() {
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            slideContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        });
        
        // Update dots - showing the current position in sets of 4
        updateDots();
        
        // Update arrow states
        updateNavigationState();
    }
    
    // Enhanced swipe functionality for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let swipeDetected = false;
    
    // Add touch event handlers to prevent page scrolling during horizontal swipe
    if (sliderWrapper) {
        sliderWrapper.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            swipeDetected = false;
            stopAutoplay();
        }, { passive: true });

        sliderWrapper.addEventListener('touchmove', function(e) {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touchCurrentX = e.changedTouches[0].screenX;
                const touchCurrentY = e.changedTouches[0].screenY;
                const xDiff = touchStartX - touchCurrentX;
                const yDiff = touchStartY - touchCurrentY;
                
                // If horizontal swipe is more significant than vertical scroll
                if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 10) {
                    swipeDetected = true;
                    // Prevent page scroll
                    e.preventDefault();
                }
            }
        }, { passive: false }); // Important: passive must be false to call preventDefault

        sliderWrapper.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            if (swipeDetected) {
                handleSwipe();
            }
            startAutoplay();
        }, { passive: true });
    }
    
    function handleSwipe() {
        const threshold = 30; // Smaller threshold for more sensitivity
        const swipeDistance = Math.abs(touchEndX - touchStartX);
        
        // More sensitive swipe detection
        if (swipeDistance > threshold) {
            if (touchEndX < touchStartX) {
                goToNextSlide();
            } else {
                goToPrevSlide();
            }
        }
    }
    
    // Pause autoplay on hover (desktop only)
    if (!isMobile && sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', stopAutoplay);
        sliderWrapper.addEventListener('mouseleave', startAutoplay);
    }
    
    // Start autoplay
    startAutoplay();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateNavigationState();
        }, 100);
    });
}