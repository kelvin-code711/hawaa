document.addEventListener('DOMContentLoaded', function() {
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('#faq-section .faq-item');
    const accordionBehavior = true; // Set to false if you don't want accordion behavior

    faqItems.forEach(item => {
        item.addEventListener('toggle', function() {
            if (accordionBehavior) {
                // Accordion behavior - close others when one opens
                if (this.open) {
                    faqItems.forEach(other => {
                        if (other !== this) other.open = false;
                    });
                }
            }
        });
    });
});