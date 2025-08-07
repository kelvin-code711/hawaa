// product-learn.js - Complete Version with Circle Animations
document.addEventListener('DOMContentLoaded', function() {
    // ========== Core Initialization ==========
    initVideoControls();
    setupLazyLoading();
    initFeatureSlider();
    initCloserLookSlider();
    initFeaturesCarousel();
    initCircleAnimations(); // Added circle animations initialization

    // ========== Video Controls ==========
    function initVideoControls() {
        const videoControl = document.querySelector('.video-control');
        const heroVideo = document.querySelector('.hero-video');
        
        if (videoControl && heroVideo) {
            if (heroVideo.paused) videoControl.style.display = 'flex';
            
            videoControl.addEventListener('click', function() {
                if (heroVideo.paused) {
                    heroVideo.play().catch(e => console.log("Video play failed:", e));
                    videoControl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M14,19H18V5H14M6,19H10V5H6V19Z"/></svg>';
                } else {
                    heroVideo.pause();
                    videoControl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>';
                }
            });
            
            heroVideo.addEventListener('playing', () => {
                videoControl.style.opacity = '0';
                setTimeout(() => videoControl.style.display = 'none', 300);
            });
        }
    }

    // ========== Lazy Loading Setup ==========
    function setupLazyLoading() {
        const sectionsToObserve = [
            '.circles-section',
            '.closer-look-section',
            '.features-carousel-container'
        ];
        
        sectionsToObserve.forEach(selector => {
            const section = document.querySelector(selector);
            if (section) {
                new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        entry.target.classList.toggle('in-view', entry.isIntersecting);
                    });
                }, { threshold: 0.1 }).observe(section);
            }
        });
    }

    // ========== Circle Animations ==========
    function initCircleAnimations() {
        const circleSection = document.querySelector('.circles-section');
        if (!circleSection) return;

        const circleContainer = document.querySelector('.circle-container');
        const circles = document.querySelectorAll('.circle');
        const blob = document.querySelector('.blob');

        // Initial setup
        circles.forEach((circle, index) => {
            circle.style.opacity = (index < 3) ? '0' : '1';
            circle.style.transition = 'transform 1.8s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 1s ease';
            circle.style.transform = `translateY(${-20 * index}px)`;
        });

        // Intersection Observer for circle section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate circles when section comes into view
                    circles.forEach((circle, index) => {
                        setTimeout(() => {
                            circle.style.opacity = (1 - (index * 0.2)).toString();
                            circle.style.transform = `translateY(${-20 * index}px) scale(1)`;
                        }, index * 150);
                    });

                    // Animate blob
                    if (blob) {
                        blob.style.opacity = '1';
                        blob.style.transform = 'translate(-50%, -50%) scale(1)';
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(circleSection);

        // Scroll-based animations
        let lastScrollPosition = window.scrollY;
        let containerOffset = -400;
        let momentum = 0;
        let animationFrameId = null;
        
        const updateContainerPosition = () => {
            momentum *= 0.88;
            containerOffset -= momentum;
            containerOffset = Math.min(Math.max(containerOffset, -600), -200);
            
            circleContainer.style.transform = `translateY(${containerOffset}px)`;
            
            if (Math.abs(momentum) > 0.5) {
                animationFrameId = requestAnimationFrame(updateContainerPosition);
            } else {
                animationFrameId = null;
            }
        };
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            const scrollDirection = currentScroll > lastScrollPosition ? 1 : -1;
            const scrollDelta = Math.abs(currentScroll - lastScrollPosition);
            lastScrollPosition = currentScroll;
            
            momentum = scrollDirection * Math.min(scrollDelta, 30) * 0.6;
            
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(updateContainerPosition);
            }
        });

        // Float animation for blob
        if (blob) {
            const floatAnimation = () => {
                const now = Date.now();
                const scale = 1 + Math.sin(now / 2000) * 0.1;
                const yOffset = Math.sin(now / 1800) * 20;
                blob.style.transform = `translate(-50%, calc(-50% + ${yOffset}px)) scale(${scale})`;
                requestAnimationFrame(floatAnimation);
            };
            floatAnimation();
        }
    }

    // ========== Feature Slider ==========
    function initFeatureSlider() {
        const section = document.getElementById('feature-overview');
        if (!section) return;

        const container = section.querySelector('.slides');
        const slides = Array.from(container.children);
        const dots = Array.from(section.querySelectorAll('.dot'));
        const dotNav = section.querySelector('.dot-nav');
        let autoTimer, scrollDebounce;

        container.style.scrollbarWidth = 'none';
        container.style.msOverflowStyle = 'none';

        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                const inView = e.isIntersecting;
                section.classList.toggle('in-view', inView);
                updateNavPosition();
                if (inView) startAuto();
                else stopAuto();
            });
        }, { threshold: 0.5 });
        io.observe(section);

        function scrollTo(idx) {
            const slide = slides[idx];
            const gap = parseInt(getComputedStyle(container).columnGap);
            const w = slide.getBoundingClientRect().width;
            const left = slide.offsetLeft - (container.clientWidth - w) / 2;
            container.scrollTo({ left, behavior: 'smooth' });
            setActive(idx);
        }

        dots.forEach(d => {
            d.addEventListener('click', e => {
                e.preventDefault();
                scrollTo(+d.dataset.index);
                restartAuto();
            });
        });

        container.addEventListener('scroll', () => {
            clearTimeout(scrollDebounce);
            scrollDebounce = setTimeout(() => {
                const gap = parseInt(getComputedStyle(container).columnGap);
                const w = slides[0].getBoundingClientRect().width + gap;
                const idx = Math.round(container.scrollLeft / w);
                setActive(idx);
                restartAuto();
            }, 50);
        });

        function startAuto() {
            if (autoTimer) return;
            autoTimer = setInterval(() => {
                const curr = slides.findIndex(s => s.classList.contains('active'));
                scrollTo((curr + 1) % slides.length);
            }, 5000);
        }
        
        function stopAuto() {
            clearInterval(autoTimer);
            autoTimer = null;
        }
        
        function restartAuto() {
            stopAuto();
            startAuto();
        }

        function setActive(idx) {
            slides.forEach((s,i) => s.classList.toggle('active', i === idx));
            dots.forEach((d,i) => d.classList.toggle('active', i === idx));
            updateNavPosition();
        }

        function updateNavPosition() {
            if (!section.classList.contains('in-view')) return;
            const rect = section.getBoundingClientRect();
            dotNav.style.position = rect.bottom > window.innerHeight + 48 ? 'fixed' : 'absolute';
            dotNav.style.bottom = rect.bottom > window.innerHeight + 48 ? '16px' : '48px';
        }

        window.addEventListener('scroll', updateNavPosition);
        window.addEventListener('resize', updateNavPosition);

        setActive(0);
    }

    // ========== Closer Look Slider ==========
    function initCloserLookSlider() {
        const container = document.querySelector('.closer-look-container');
        if (!container) return;

        container.style.scrollbarWidth = 'none';
        container.style.msOverflowStyle = 'none';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setupCloserLookSlider(container);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(container);

        function setupCloserLookSlider(container) {
            const slides = Array.from(container.children);
            const prevBtn = document.querySelector('.closer-look-controls .prev-btn');
            const nextBtn = document.querySelector('.closer-look-controls .next-btn');
            let current = 0;
            let autoScrollInterval;

            container.style.overflowX = 'hidden';
            container.style.scrollBehavior = 'smooth';

            function scrollToSlide(index) {
                const slide = slides[index];
                const scrollPosition = slide.offsetLeft - (container.offsetWidth - slide.offsetWidth) / 2;
                container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
                current = index;
                updateSlideStates();
            }

            function updateSlideStates() {
                slides.forEach((slide, index) => {
                    slide.classList.toggle('active', index === current);
                });
                if (prevBtn) prevBtn.disabled = current === 0;
                if (nextBtn) nextBtn.disabled = current === slides.length - 1;
            }

            function startAutoScroll() {
                stopAutoScroll();
                autoScrollInterval = setInterval(() => {
                    scrollToSlide((current + 1) % slides.length);
                }, 8000);
            }

            function stopAutoScroll() {
                clearInterval(autoScrollInterval);
            }

            if (prevBtn) prevBtn.addEventListener('click', () => {
                scrollToSlide(Math.max(0, current - 1));
                stopAutoScroll();
                startAutoScroll();
            });

            if (nextBtn) nextBtn.addEventListener('click', () => {
                scrollToSlide(Math.min(slides.length - 1, current + 1));
                stopAutoScroll();
                startAutoScroll();
            });

            container.addEventListener('mouseenter', stopAutoScroll);
            container.addEventListener('mouseleave', startAutoScroll);

            document.addEventListener('keydown', function(e) {
                const closerLookInView = container.getBoundingClientRect().top < window.innerHeight && 
                                       container.getBoundingClientRect().bottom > 0;
                
                if (closerLookInView) {
                    if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) {
                        e.preventDefault();
                        nextBtn.click();
                    } else if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
                        e.preventDefault();
                        prevBtn.click();
                    }
                }
            });

            scrollToSlide(0);
            startAutoScroll();
        }
    }

    // ========== Features Carousel ==========
    function initFeaturesCarousel() {
        const carouselContainer = document.querySelector('.features-carousel-container');
        if (!carouselContainer) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setupFeaturesCarousel(carouselContainer);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(carouselContainer);

        function setupFeaturesCarousel(container) {
            const carousel = container.querySelector('.carousel');
            const items = Array.from(container.querySelectorAll('.carousel-item'));
            const prevBtn = container.querySelector('.carousel-controls .prev-btn');
            const nextBtn = container.querySelector('.carousel-controls .next-btn');
            
            let currentIndex = 0;
            const itemWidth = items[0].offsetWidth + 20;
            const visibleItems = Math.min(3, Math.floor(container.offsetWidth / itemWidth));
            const maxIndex = Math.max(0, items.length - visibleItems);
            
            function updateCarousel() {
                carousel.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
                if (prevBtn) prevBtn.disabled = currentIndex === 0;
                if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
            }

            if (prevBtn) prevBtn.addEventListener('click', () => {
                currentIndex = Math.max(0, currentIndex - 1);
                updateCarousel();
            });

            if (nextBtn) nextBtn.addEventListener('click', () => {
                currentIndex = Math.min(maxIndex, currentIndex + 1);
                updateCarousel();
            });

            window.addEventListener('resize', () => {
                const newVisibleItems = Math.min(3, Math.floor(container.offsetWidth / itemWidth));
                const newMaxIndex = Math.max(0, items.length - newVisibleItems);
                if (currentIndex > newMaxIndex) currentIndex = newMaxIndex;
                updateCarousel();
            });

            updateCarousel();
        }
    }
});