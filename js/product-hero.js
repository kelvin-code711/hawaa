document.addEventListener('DOMContentLoaded', function() {
    // Button click handlers
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Only prevent default if it's a real <button>, not an <a>
        if (button.tagName.toLowerCase() === 'button') {
            e.preventDefault();
            const buttonType = this.classList.contains('btn-primary') ? 'Primary' : 'Secondary';
            console.log(`${buttonType} button clicked`);
        }
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