document.addEventListener('DOMContentLoaded', function() {
    // FAQ functionality using button/div elements instead of details/summary
    const faqItems = document.querySelectorAll('.faq-item');
    const faqQuestions = document.querySelectorAll('.faq-question');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const accordionBehavior = true; // Set to false if you don't want accordion behavior

    // Initialize FAQ
    initializeFAQ();
    initializeFilters();
    
    function initializeFAQ() {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const faqItem = this.parentElement;
                const isOpen = faqItem.classList.contains('open');
                
                if (accordionBehavior) {
                    // Close all other FAQ items in the same category
                    const currentCategory = faqItem.getAttribute('data-category');
                    faqItems.forEach(item => {
                        if (item.getAttribute('data-category') === currentCategory && item !== faqItem) {
                            item.classList.remove('open');
                            const otherQuestion = item.querySelector('.faq-question');
                            otherQuestion.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
                
                // Toggle current FAQ item
                if (isOpen) {
                    faqItem.classList.remove('open');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    faqItem.classList.add('open');
                    this.setAttribute('aria-expanded', 'true');
                    
                    // Smooth scroll to the opened item if needed
                    setTimeout(() => {
                        const rect = faqItem.getBoundingClientRect();
                        if (rect.top < 100) {
                            smoothScrollToElement(faqItem);
                        }
                    }, 300);
                }
                
                // Track interaction for analytics
                const questionText = this.querySelector('.question-text').textContent;
                const category = faqItem.getAttribute('data-category');
                const action = isOpen ? 'closed' : 'opened';
                trackFAQInteraction(questionText, action, category);
            });
        });
    }
    
    function initializeFilters() {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                setActiveFilter(tab, category);
                filterFAQItems(category);
            });
        });
        
        // Show general category by default
        filterFAQItems('general');
    }
    
    function setActiveFilter(activeTab, category) {
        filterTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }
    
    function filterFAQItems(category) {
        faqItems.forEach(item => {
            const itemCategory = item.dataset.category;
            
            if (itemCategory === category) {
                item.classList.remove('hidden');
                item.style.display = 'block';
            } else {
                item.classList.add('hidden');
                item.style.display = 'none';
                // Close any open items that are being hidden
                if (item.classList.contains('open')) {
                    item.classList.remove('open');
                    const question = item.querySelector('.faq-question');
                    question.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    
    // Smooth scroll for better UX when FAQ items expand/collapse
    function smoothScrollToElement(element) {
        const elementTop = element.offsetTop;
        const offset = 100; // Adjust this value as needed
        
        window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
        });
    }
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all open FAQ items when Escape is pressed
            faqItems.forEach(item => {
                if (item.classList.contains('open')) {
                    item.classList.remove('open');
                    const question = item.querySelector('.faq-question');
                    question.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });
    
    // Analytics tracking (optional)
    function trackFAQInteraction(question, action, category) {
        // Add your analytics tracking code here
        console.log(`FAQ ${action}: ${question} (Category: ${category})`);
        
        // Example for Google Analytics:
        // gtag('event', 'faq_interaction', {
        //     'event_category': 'FAQ',
        //     'event_label': question,
        //     'custom_parameter_1': action,
        //     'custom_parameter_2': category
        // });
    }
    
    // Search functionality (optional enhancement)
    function addSearchFunctionality() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                filterFAQBySearch(searchTerm);
            });
        }
    }
    
    function filterFAQBySearch(searchTerm) {
        faqItems.forEach(item => {
            const questionText = item.querySelector('.question-text').textContent.toLowerCase();
            const answerText = item.querySelector('.faq-answer').textContent.toLowerCase();
            
            if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                item.style.display = 'block';
                item.classList.remove('hidden');
            } else {
                item.style.display = 'none';
                item.classList.add('hidden');
                // Close items that don't match search
                if (item.classList.contains('open')) {
                    item.classList.remove('open');
                    const question = item.querySelector('.faq-question');
                    question.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    
    // Initialize keyboard accessibility
    function initializeKeyboardAccessibility() {
        faqQuestions.forEach((question, index) => {
            // Add tabindex for keyboard navigation
            question.setAttribute('tabindex', '0');
            
            // Add keyboard event listener
            question.addEventListener('keydown', function(e) {
                // Enter or Space key
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
                
                // Arrow key navigation
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % faqQuestions.length;
                    faqQuestions[nextIndex].focus();
                }
                
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + faqQuestions.length) % faqQuestions.length;
                    faqQuestions[prevIndex].focus();
                }
            });
        });
    }
    
    // Initialize enhanced features
    initializeKeyboardAccessibility();
    
    // Uncomment to add search functionality if you have a search input
    // addSearchFunctionality();
    
    // Optional: Auto-close FAQ items after a certain time (uncomment if needed)
    /*
    function autoCloseFAQ() {
        setTimeout(() => {
            faqItems.forEach(item => {
                if (item.classList.contains('open')) {
                    item.classList.remove('open');
                    const question = item.querySelector('.faq-question');
                    question.setAttribute('aria-expanded', 'false');
                }
            });
        }, 30000); // Close after 30 seconds
    }
    */
    
    // Optional: Add animation delay for staggered effect
    function addStaggeredAnimation() {
        faqItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }
    
    // Initialize staggered animation
    addStaggeredAnimation();
});