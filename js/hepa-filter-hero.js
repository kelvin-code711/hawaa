document.addEventListener('DOMContentLoaded', function() {
  // No JavaScript functionality was in the original template
  // You can add any interactive features here if needed
  
  // Example: Add click event to CTA button
  const ctaButton = document.querySelector('.hf-cta');
  if (ctaButton) {
    ctaButton.addEventListener('click', function(e) {
      console.log('CTA button clicked');
      // Add your custom click logic here
    });
  }
  
  // Example: Add hover effect to cards
  const cards = document.querySelectorAll('.hf-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
      this.style.transition = 'transform 0.3s ease';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
});