document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('testimonialsTrack');
    const cards = [...track.querySelectorAll('.testimonial-card')];
    const leftArrow = track.parentElement.querySelector('.nav-arrow.left');
    const rightArrow = track.parentElement.querySelector('.nav-arrow.right');
    
    // Calculate card width dynamically with proper gap handling
    function getCardWidth() {
        if (window.innerWidth >= 992) { // Desktop
            const cardEl = track.querySelector('.testimonial-card');
            if (!cardEl) return 300;
            const computedStyle = window.getComputedStyle(cardEl);
            const cardWidth = parseFloat(computedStyle.width);
            const marginLeft = parseFloat(computedStyle.marginLeft);
            const marginRight = parseFloat(computedStyle.marginRight);
            return cardWidth + marginLeft + marginRight + 20; // Include gap
        } else { // Mobile
            const cardEl = track.querySelector('.testimonial-card');
            if (!cardEl) return 180;
            const computedStyle = window.getComputedStyle(cardEl);
            const cardWidth = parseFloat(computedStyle.width);
            return cardWidth + 16; // Mobile gap
        }
    }

    /* -------- arrow visibility (desktop only) -------- */
    function updateArrows() {
        if (window.innerWidth <= 991) {
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
            return;
        }

        const maxScroll = track.scrollWidth - track.clientWidth;
        
        if (maxScroll <= 0) {
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
            return;
        }
        
        leftArrow.style.display = track.scrollLeft > 5 ? 'flex' : 'none';
        rightArrow.style.display = track.scrollLeft < maxScroll - 5 ? 'flex' : 'none';
    }

    // Initialize arrows on desktop
    if (window.matchMedia('(min-width:992px)').matches) {
        updateArrows();
        track.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows, { passive: true });
        
        // Smooth scrolling with proper easing
        leftArrow.addEventListener('click', () => {
            const cardWidth = getCardWidth();
            track.scrollBy({
                left: -cardWidth,
                behavior: 'smooth'
            });
        });
        
        rightArrow.addEventListener('click', () => {
            const cardWidth = getCardWidth();
            track.scrollBy({
                left: cardWidth,
                behavior: 'smooth'
            });
        });
    }

    /* -------- one-at-a-time playback with sound on click -------- */
    let currentPlayingCard = null;
    
    cards.forEach(card => {
        const vid = card.querySelector('video');
        if (!vid) return;
        
        // Ensure videos are properly sized
        vid.style.width = '100%';
        vid.style.height = '100%';
        vid.style.objectFit = 'cover';
        vid.style.position = 'absolute';
        vid.style.top = '0';
        vid.style.left = '0';
        
        card.addEventListener('click', e => {
            e.preventDefault();
            
            // If clicking a different card than the one currently playing
            if (currentPlayingCard && currentPlayingCard !== card) {
                const prevVid = currentPlayingCard.querySelector('video');
                if (prevVid) {
                    // Reset previous video to start with muted autoplay
                    prevVid.pause();
                    prevVid.currentTime = 0;
                    prevVid.muted = true;
                    prevVid.loop = true;
                    prevVid.play().catch(() => {}); // Silently handle play failures
                }
            }
            
            // Set current card as the active one
            currentPlayingCard = card;
            
            // Check if video is currently playing with sound
            if (!vid.muted) {
                // Toggle between pause and resume for current video
                if (vid.paused) {
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            } else {
                // First time playing this video with sound - always start from beginning
                vid.pause();
                vid.currentTime = 0; // Reset to beginning
                vid.muted = false;
                vid.loop = false;
                vid.play().catch(() => {});
            }
        });
        
        // Reset to muted autoplay when video ends
        vid.addEventListener('ended', () => {
            vid.currentTime = 0;
            vid.muted = true;
            vid.loop = true;
            vid.play().catch(() => {});
            currentPlayingCard = null;
        });

        // Handle video load errors gracefully
        vid.addEventListener('error', () => {
            console.warn('Video failed to load:', vid.src);
        });
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateArrows();
        }, 100);
    });
});