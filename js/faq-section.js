document.addEventListener('DOMContentLoaded', function() {
    // FAQ accordion functionality with smooth, slow animations
    const faqItems = document.querySelectorAll('#faq-section .faq-item');
    const accordionBehavior = true; // Set to false if you don't want accordion behavior

    faqItems.forEach((item, index) => {
        const answer = item.querySelector('.faq-answer');
        const paragraphs = answer.querySelectorAll('p');
        
        // Set initial state for all items
        if (!item.open) {
            answer.style.maxHeight = '0px';
            answer.style.opacity = '0';
            answer.style.transform = 'translateY(-15px)';
            
            // Set initial state for paragraphs
            paragraphs.forEach(p => {
                p.style.opacity = '0';
                p.style.transform = 'translateY(10px)';
            });
        }

        // Handle toggle event with smooth animations
        item.addEventListener('toggle', function(e) {
            const answer = this.querySelector('.faq-answer');
            const paragraphs = answer.querySelectorAll('p');
            
            if (this.open) {
                // Opening animation - slower and smoother
                setTimeout(() => {
                    answer.style.maxHeight = answer.scrollHeight + 50 + 'px'; // Add extra space
                    answer.style.opacity = '1';
                    answer.style.transform = 'translateY(0)';
                    
                    // Staggered paragraph animation
                    paragraphs.forEach((p, pIndex) => {
                        setTimeout(() => {
                            p.style.opacity = '1';
                            p.style.transform = 'translateY(0)';
                        }, 200 + (pIndex * 100)); // Staggered by 100ms each
                    });
                }, 50);
                
                // Close others if accordion behavior is enabled
                if (accordionBehavior) {
                    faqItems.forEach(other => {
                        if (other !== this && other.open) {
                            closeAccordionItem(other);
                        }
                    });
                }
            } else {
                // Closing animation
                closeAccordionItem(this);
            }
        });

        // Enhanced smooth closing function
        function closeAccordionItem(item) {
            const answer = item.querySelector('.faq-answer');
            const paragraphs = answer.querySelectorAll('p');
            
            // First fade out paragraphs
            paragraphs.forEach((p, pIndex) => {
                setTimeout(() => {
                    p.style.opacity = '0';
                    p.style.transform = 'translateY(10px)';
                }, pIndex * 50);
            });
            
            // Then close the container
            setTimeout(() => {
                answer.style.maxHeight = '0px';
                answer.style.opacity = '0';
                answer.style.transform = 'translateY(-15px)';
                
                // Close the details element after animation
                setTimeout(() => {
                    item.open = false;
                }, 300);
            }, paragraphs.length * 50 + 100);
        }

        // Handle direct clicks for better UX
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle the details element manually for better control
            if (!item.open) {
                // Close others first if accordion behavior
                if (accordionBehavior) {
                    faqItems.forEach(other => {
                        if (other !== item && other.open) {
                            closeAccordionItem(other);
                        }
                    });
                }
                
                // Open current item
                setTimeout(() => {
                    item.open = true;
                }, accordionBehavior ? 400 : 0);
            } else {
                closeAccordionItem(item);
            }
        });

        // Handle window resize to recalculate heights smoothly
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (item.open) {
                    const answer = item.querySelector('.faq-answer');
                    answer.style.maxHeight = answer.scrollHeight + 50 + 'px';
                }
            }, 100);
        });
    });

    // Add smooth scroll behavior for better UX
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            // Delay to allow for opening animation
            setTimeout(() => {
                const item = this.closest('.faq-item');
                if (item.open) {
                    const rect = this.getBoundingClientRect();
                    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                    
                    if (!isVisible) {
                        this.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                            inline: 'nearest'
                        });
                    }
                }
            }, 300);
        });
    });

    // Add intersection observer for enhanced animations (optional)
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.opacity = '1';
                }
            });
        }, observerOptions);

        // Observe FAQ items for scroll animations
        faqItems.forEach(item => {
            observer.observe(item);
        });
    }

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('faq-question')) {
                e.preventDefault();
                activeElement.click();
            }
        }
    });

    // Initialize with smooth entrance animation
    setTimeout(() => {
        faqItems.forEach((item, index) => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        });
    }, 100);
});