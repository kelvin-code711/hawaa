document.addEventListener('DOMContentLoaded', function() {
    const track = document.getElementById('why-hawaa-track');
    
    // If there are fewer than 6 unique items, duplicate them for seamless scrolling
    if (track) {
        const items = track.querySelectorAll('.why-strip__item');
        const uniqueItemCount = items.length / 2; // Since we already have duplicates in HTML
        
        if (uniqueItemCount > 0 && uniqueItemCount < 6) {
            // Remove existing duplicates
            for (let i = uniqueItemCount; i < items.length; i++) {
                track.removeChild(items[i]);
            }
            
            // Add new duplicates
            for (let i = 0; i < uniqueItemCount; i++) {
                const clone = items[i].cloneNode(true);
                track.appendChild(clone);
            }
        }
    }
    
    // Optional: Add click handlers or other interactivity here
    document.querySelectorAll('.why-strip__item').forEach(item => {
        item.addEventListener('click', function() {
            console.log('Clicked:', this.querySelector('.why-strip__text').textContent);
        });
    });
});