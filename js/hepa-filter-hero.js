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
  
  // Hover effects removed - no more card interactions
  // Cards will remain static without any hover transformations
});