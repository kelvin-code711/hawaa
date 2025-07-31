document.addEventListener('DOMContentLoaded', function() {
    // ========== Hero Section Video Controls ==========
    const videoControl = document.querySelector('.video-control');
    const heroVideo = document.querySelector('.hero-video');
    
    if (videoControl && heroVideo) {
        videoControl.addEventListener('click', function() {
            if (heroVideo.paused) {
                heroVideo.play();
                videoControl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M14,19H18V5H14M6,19H10V5H6V19Z"/></svg>';
            } else {
                heroVideo.pause();
                videoControl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>';
            }
        });
    }

// ========== Smooth Scroll-Snap Animation (Fixed Visibility) ==========
const circleSection = document.querySelector('.circles-section');
const circleContainer = document.querySelector('.circle-container');
const circles = document.querySelectorAll('.circle');

if (circleSection) {
    // Configuration with progression control - all circles use FOURTH config now
    const ZOOM = {
        FOURTH: {
            rest: 1.0,
            scrollMax: 1.1,
            wheelMax: 1.2
        }
    };
    const ZOOM_START_POINT = 0.1;
    const ZOOM_MAX_POINT = 0.3;
    const ANIMATION_DURATION = '1.8s'; // Slightly slower than before
    
    // Opacity configuration for first 3 circles (indices 0, 1, 2)
    const OPACITY_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1.0]; // Starting from 0
    const OPACITY_START_POINT = 0.1;
    const OPACITY_END_POINT = 0.4;

    // Initialize circles - first 3 start with opacity 0
    circles.forEach((circle, index) => {
        const initialOpacity = (index < 3) ? 0 : 1; // First 3 circles start invisible
        circle.style.opacity = initialOpacity;
        circle.style.transition = `transform ${ANIMATION_DURATION} cubic-bezier(0.2, 0.8, 0.4, 1), opacity 1s ease`;
        circle.style.transform = `
            scale(${ZOOM.FOURTH.rest})
            translateY(${-20 * index}px)
        `;
        circle.style.willChange = 'transform, opacity'; // Optimize performance
    });

    // Intersection Observer - unchanged from working version
    const circleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            circleSection.classList.toggle('in-view', entry.isIntersecting);
            // Ensure circles remain visible when in view (except first 3 which start at 0)
            if (entry.isIntersecting) {
                circles.forEach((circle, index) => {
                    circle.style.opacity = (index < 3) ? 0 : 1;
                });
            }
        });
    }, { threshold: 0.1 });
    
    circleObserver.observe(circleSection);
    
    // Smoother scroll handling with momentum
    let lastScrollPosition = window.scrollY;
    let containerOffset = -400;
    let momentum = 0;
    let animationFrameId = null;
    
    const updateContainerPosition = () => {
        momentum *= 0.88; // Gentle decay
        containerOffset -= momentum; // Note: using -= for direct movement
        
        // Apply limits
        containerOffset = Math.min(Math.max(containerOffset, -600), -200);
        
        // Apply with smooth transition
        circleContainer.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1.1)';
        circleContainer.style.transform = `translateY(${containerOffset}px)`;
        
        // Continue animation if there's significant momentum
        if (Math.abs(momentum) > 0.5) {
            animationFrameId = requestAnimationFrame(updateContainerPosition);
        } else {
            animationFrameId = null;
        }
    };
    
    window.addEventListener('scroll', () => {
        if (!circleSection.classList.contains('in-view')) return;
        
        const currentScroll = window.scrollY;
        const scrollDirection = currentScroll > lastScrollPosition ? 1 : -1;
        const scrollDelta = Math.abs(currentScroll - lastScrollPosition);
        lastScrollPosition = currentScroll;
        
        // Calculate momentum based on scroll speed
        momentum = scrollDirection * Math.min(scrollDelta, 30) * 0.6;
        
        // Start or continue the animation
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updateContainerPosition);
        }
        
        // Rest of your existing scroll handling...
        const sectionOffset = circleSection.offsetTop;
        const sectionHeight = circleSection.offsetHeight;
        let scrollProgress = (currentScroll - sectionOffset + window.innerHeight) / sectionHeight;
        scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);
        
        let zoomProgression = 0;
        if (scrollProgress > ZOOM_START_POINT) {
            zoomProgression = (scrollProgress - ZOOM_START_POINT) / (ZOOM_MAX_POINT - ZOOM_START_POINT);
            zoomProgression = Math.min(zoomProgression, 1);
        }
        
        let opacityProgression = 0;
        if (scrollProgress > OPACITY_START_POINT) {
            opacityProgression = (scrollProgress - OPACITY_START_POINT) / (OPACITY_END_POINT - OPACITY_START_POINT);
            opacityProgression = Math.min(Math.max(opacityProgression, 0), 1);
        }
        
        const opacityStep = Math.floor(opacityProgression * (OPACITY_STEPS.length - 1));
        const currentOpacity = OPACITY_STEPS[opacityStep];
        
        circles.forEach((circle, index) => {
            // All circles use the same zoom configuration now
            const currentScale = ZOOM.FOURTH.rest + 
                               (zoomProgression * (ZOOM.FOURTH.scrollMax - ZOOM.FOURTH.rest));
            
            if (index < 3) {
                circle.style.opacity = currentOpacity;
            }
            
            circle.style.transform = `
                scale(${currentScale})
                translateY(${-20 * index}px)
            `;
        });
    });
    
    // Wheel zoom - all circles use FOURTH config now
    window.addEventListener('wheel', (e) => {
        if (!circleSection.classList.contains('in-view')) return;
        
        if (e.deltaY > 0) {
            circles.forEach((circle, index) => {
                const currentScale = parseFloat(circle.style.transform.match(/scale\(([^)]+)\)/)[1]) || 1;
                const newScale = Math.min(currentScale + 0.03, ZOOM.FOURTH.wheelMax);
                
                circle.style.transform = `
                    scale(${newScale})
                    translateY(${-20 * index}px)
                `;
            });
        } else {
            circles.forEach((circle, index) => {
                const currentScale = parseFloat(circle.style.transform.match(/scale\(([^)]+)\)/)[1]) || 1;
                const newScale = Math.max(currentScale - 0.05, ZOOM.FOURTH.rest);
                
                circle.style.transform = `
                    scale(${newScale})
                    translateY(${-20 * index}px)
                `;
            });
        }
    });
}

    // ========== Features Section Carousel ==========
    const featuresSection = document.getElementById('features');
    const dotnavLinks = document.querySelectorAll('.dotnav-link');
    const featureSlides = document.querySelectorAll('.feature-slide');
    const dotnavContainer = document.querySelector('.dotnav-container');
    const prevArrow = document.querySelector('.arrow-prev');
    const nextArrow = document.querySelector('.arrow-next');
    
    let featuresAutoScrollInterval;
    let isAutoScrolling = false;
    const featuresScrollDelay = 5000;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    
    // Features Auto-scroll
    function startFeaturesAutoScroll() {
        if (featuresAutoScrollInterval) clearInterval(featuresAutoScrollInterval);
        isAutoScrolling = true;
        
        featuresAutoScrollInterval = setInterval(() => {
            if (isDragging) return;
            
            const slideWidth = featuresSection.clientWidth;
            const currentScroll = featuresSection.scrollLeft;
            const currentSlide = Math.round(currentScroll / slideWidth);
            
            if (currentSlide === featureSlides.length - 1) {
                scrollToFeatureSlide(0);
            } else {
                scrollToFeatureSlide(currentSlide + 1);
            }
        }, featuresScrollDelay);
    }
    
    function pauseFeaturesAutoScroll() {
        isAutoScrolling = false;
        clearInterval(featuresAutoScrollInterval);
        setTimeout(startFeaturesAutoScroll, featuresScrollDelay * 2);
    }
    
    function scrollToFeatureSlide(index) {
        const slideWidth = featuresSection.clientWidth;
        featuresSection.scrollTo({
            left: index * slideWidth,
            behavior: 'smooth'
        });
    }
    
    function updateActiveDot() {
        if (!featuresSection || !dotnavLinks.length) return;
        
        const scrollPosition = featuresSection.scrollLeft;
        const slideWidth = featuresSection.clientWidth;
        const currentSlide = Math.round(scrollPosition / slideWidth);
        
        dotnavLinks.forEach((link, index) => {
            if (index === currentSlide) {
                link.classList.add('active');
                link.style.width = '24px';
                link.style.height = '4px';
                link.style.borderRadius = '2px';
                link.style.backgroundColor = '#ffffff';
            } else {
                link.classList.remove('active');
                link.style.width = '12px';
                link.style.height = '12px';
                link.style.borderRadius = '50%';
                link.style.backgroundColor = '#a1a1a2';
            }
        });
    }
    
    if (featuresSection) {
        const featuresObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    featuresSection.classList.add('in-view');
                    startFeaturesAutoScroll();
                } else {
                    featuresSection.classList.remove('in-view');
                    pauseFeaturesAutoScroll();
                }
            });
        }, { threshold: 0.5 });
        featuresObserver.observe(featuresSection);
    }
    
    function goToPrevFeatureSlide() {
        const slideWidth = featuresSection.clientWidth;
        const currentScroll = featuresSection.scrollLeft;
        const prevSlide = Math.max(0, Math.floor(currentScroll / slideWidth) - 1);
        scrollToFeatureSlide(prevSlide);
        pauseFeaturesAutoScroll();
    }
    
    function goToNextFeatureSlide() {
        const slideWidth = featuresSection.clientWidth;
        const currentScroll = featuresSection.scrollLeft;
        const nextSlide = Math.min(featureSlides.length - 1, Math.ceil(currentScroll / slideWidth) + 1);
        scrollToFeatureSlide(nextSlide);
        pauseFeaturesAutoScroll();
    }
    
    // Features drag handling
    if (featuresSection) {
        featuresSection.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - featuresSection.offsetLeft;
            scrollLeft = featuresSection.scrollLeft;
            pauseFeaturesAutoScroll();
        });
        
        featuresSection.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - featuresSection.offsetLeft;
            const walk = (x - startX) * 2;
            featuresSection.scrollLeft = scrollLeft - walk;
        });
        
        featuresSection.addEventListener('mouseup', () => {
            isDragging = false;
            const slideWidth = featuresSection.clientWidth;
            const currentSlide = Math.round(featuresSection.scrollLeft / slideWidth);
            scrollToFeatureSlide(currentSlide);
        });
        
        featuresSection.addEventListener('mouseleave', () => {
            isDragging = false;
        });
        
        featuresSection.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX - featuresSection.offsetLeft;
            scrollLeft = featuresSection.scrollLeft;
            pauseFeaturesAutoScroll();
        }, { passive: true });
        
        featuresSection.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const x = e.touches[0].pageX - featuresSection.offsetLeft;
            const walk = (x - startX) * 2;
            featuresSection.scrollLeft = scrollLeft - walk;
        }, { passive: true });
        
        featuresSection.addEventListener('touchend', () => {
            isDragging = false;
            const slideWidth = featuresSection.clientWidth;
            const currentSlide = Math.round(featuresSection.scrollLeft / slideWidth);
            scrollToFeatureSlide(currentSlide);
        }, { passive: true });
    }
    
    if (dotnavLinks.length) {
        dotnavLinks.forEach((link, index) => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                scrollToFeatureSlide(index);
                pauseFeaturesAutoScroll();
            });
        });
    }
    
    if (prevArrow) prevArrow.addEventListener('click', goToPrevFeatureSlide);
    if (nextArrow) nextArrow.addEventListener('click', goToNextFeatureSlide);
    
    if (featuresSection) {
        featuresSection.addEventListener('scroll', () => {
            updateActiveDot();
            if (!isAutoScrolling) pauseFeaturesAutoScroll();
        }, { passive: true });
    }

    // ========== Take a Closer Look Section Slider ==========
    const closerLookSection = document.querySelector('.closer-look-section');
    const closerLookSlider = document.querySelector('.closer-look-section .slider');
    const closerLookSlides = document.querySelectorAll('.closer-look-section .slide');
    const closerLookPrevBtn = document.querySelector('.closer-look-section .prev-btn');
    const closerLookNextBtn = document.querySelector('.closer-look-section .next-btn');
    
    if (closerLookSlider && closerLookSlides.length > 0) {
        let currentCloserLookSlide = 0;
        const closerLookSlideCount = closerLookSlides.length;
        let closerLookSlideWidth = closerLookSlides[0].offsetWidth + 12;
        let closerLookAutoScrollInterval;
        const closerLookScrollDelay = 5000;
        
        function initCloserLookSlider() {
            closerLookSlideWidth = closerLookSlides[0].offsetWidth + 12;
            updateCloserLookSlider();
        }
        
        function updateCloserLookSlider() {
            closerLookSlider.style.transform = `translateX(-${currentCloserLookSlide * closerLookSlideWidth}px)`;
            
            closerLookSlides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentCloserLookSlide);
            });
            
            if (closerLookPrevBtn) {
                closerLookPrevBtn.disabled = currentCloserLookSlide === 0;
            }
            if (closerLookNextBtn) {
                closerLookNextBtn.disabled = currentCloserLookSlide === closerLookSlideCount - 1;
            }
        }
        
        function nextCloserLookSlide() {
            if (currentCloserLookSlide < closerLookSlideCount - 1) {
                currentCloserLookSlide++;
                updateCloserLookSlider();
                resetCloserLookAutoScroll();
            }
        }
        
        function prevCloserLookSlide() {
            if (currentCloserLookSlide > 0) {
                currentCloserLookSlide--;
                updateCloserLookSlider();
                resetCloserLookAutoScroll();
            }
        }
        
        function startCloserLookAutoScroll() {
            clearInterval(closerLookAutoScrollInterval);
            closerLookAutoScrollInterval = setInterval(() => {
                if (currentCloserLookSlide === closerLookSlideCount - 1) {
                    clearInterval(closerLookAutoScrollInterval);
                    return;
                }
                nextCloserLookSlide();
            }, closerLookScrollDelay);
        }
        
        function resetCloserLookAutoScroll() {
            clearInterval(closerLookAutoScrollInterval);
            startCloserLookAutoScroll();
        }
        
        if (closerLookNextBtn) {
            closerLookNextBtn.addEventListener('click', nextCloserLookSlide);
        }
        
        if (closerLookPrevBtn) {
            closerLookPrevBtn.addEventListener('click', prevCloserLookSlide);
        }
        
        window.addEventListener('resize', () => {
            initCloserLookSlider();
        });
        
        if (closerLookSection) {
            closerLookSection.addEventListener('mouseenter', () => {
                clearInterval(closerLookAutoScrollInterval);
            });
            
            closerLookSection.addEventListener('mouseleave', () => {
                startCloserLookAutoScroll();
            });
        }
        
        initCloserLookSlider();
        startCloserLookAutoScroll();
    }

    // ========== Combined Keyboard Navigation ==========
    document.addEventListener('keydown', function(e) {
        const featuresInView = featuresSection && featuresSection.classList.contains('in-view');
        const closerLookInView = closerLookSlider && closerLookSlider.getBoundingClientRect().top < window.innerHeight && 
                               closerLookSlider.getBoundingClientRect().bottom > 0;
        
        if (featuresInView) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrevFeatureSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToNextFeatureSlide();
            }
        } else if (closerLookInView) {
            if (e.key === 'ArrowRight' && (!closerLookNextBtn || !closerLookNextBtn.disabled)) {
                e.preventDefault();
                nextCloserLookSlide();
            } else if (e.key === 'ArrowLeft' && (!closerLookPrevBtn || !closerLookPrevBtn.disabled)) {
                e.preventDefault();
                prevCloserLookSlide();
            }
        }
    });
    
    // ========== Resize Observers ==========
    const resizeObserver = new ResizeObserver(() => {
        updateActiveDot();
    });
    
    if (featuresSection) {
        resizeObserver.observe(featuresSection);
        resizeObserver.observe(document.body);
    }
    
    // Initialize
    if (featuresSection) {
        updateActiveDot();
        startFeaturesAutoScroll();
    }
});