document.addEventListener('DOMContentLoaded', function() {
    // Button click handlers
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const buttonType = this.classList.contains('btn-primary') ? 'Primary' : 'Secondary';
            console.log(`${buttonType} button clicked`);
            
            // Add your custom button click logic here
            // Example: window.location.href = this.getAttribute('href');
        });
    });

    // Optional: Lazy loading for images
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('.hero-img img');
        images.forEach(img => {
            if (img.getAttribute('data-src')) {
                img.setAttribute('src', img.getAttribute('data-src'));
                img.removeAttribute('data-src');
            }
        });
    };

    // Initialize
    lazyLoadImages();
});