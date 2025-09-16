document.addEventListener('DOMContentLoaded', function() {
  // Filter product data - you can customize these as needed
  const FILTER_PRODUCT = {
    id: 'hepa-filter-h13',
    title: 'HEPA H13 Replacement Filter',
    variant: 'Compatible with all Hawaa models',
    price: 1299, // Price in rupees
    img: 'images/hepa-filter-1.jpg', // Update path as needed
    qty: 1
  };

  const CART_KEY = 'hawaa_cart';

  // Storage helpers
  const loadCart = () => {
    try { 
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); 
    } catch { 
      return []; 
    }
  };

  const saveCart = (cart) => {
    try { 
      localStorage.setItem(CART_KEY, JSON.stringify(cart)); 
    } catch {}
  };

  // Add item to cart
  const addToCart = (product) => {
    let cart = loadCart();
    const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));
    
    if (existingIndex >= 0) {
      // If item exists, increase quantity
      cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
    } else {
      // Add new item
      cart.push({ ...product });
    }
    
    saveCart(cart);
    return cart;
  };

  // Open checkout in iframe
  const openCheckout = () => {
    // Create iframe container (overlay)
    const checkoutContainer = document.createElement('div');
    checkoutContainer.id = 'checkout-container';
    checkoutContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;

    // Create iframe positioned like drawer
    const iframe = document.createElement('iframe');
    iframe.src = 'sections/checkout.html'; // Update path as needed
    iframe.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: min(100vw, 680px);
      max-width: 680px;
      height: 100vh;
      border: none;
      background: white;
      transform: translateX(100%);
      transition: transform 0.6s cubic-bezier(0.22, 0.8, 0.2, 1);
      box-shadow: 0 10px 30px rgba(2,6,23,.18), 0 4px 10px rgba(2,6,23,.08);
      z-index: 10000;
    `;

    checkoutContainer.appendChild(iframe);
    document.body.appendChild(checkoutContainer);

    // Animate drawer in from right after DOM insertion
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        iframe.style.transform = 'translateX(0)';
      });
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Listen for messages from iframe
    const handleMessage = (event) => {
      if (event.data?.type === 'hawaa:closeCheckout') {
        closeCheckout();
      }
      // Handle other checkout events as needed
      if (event.data?.type === 'hawaa:paymentSuccess') {
        closeCheckout();
        // Show success message or redirect
        alert('Order placed successfully!');
      }
    };

    window.addEventListener('message', handleMessage);

    // Close checkout function
    const closeCheckout = () => {
      // Animate drawer out to the right
      iframe.style.transform = 'translateX(100%)';
      
      // Remove elements after animation completes
      setTimeout(() => {
        if (document.body.contains(checkoutContainer)) {
          document.body.removeChild(checkoutContainer);
        }
        document.body.style.overflow = '';
      }, 600); // Match transition duration
      
      window.removeEventListener('message', handleMessage);
    };

    // Close on outside click
    checkoutContainer.addEventListener('click', (e) => {
      if (e.target === checkoutContainer) {
        closeCheckout();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeCheckout();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  // Add click event to CTA button
  const ctaButton = document.querySelector('.hf-cta');
  if (ctaButton) {
    ctaButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Order replacement filters clicked');
      
      // Add filter to cart
      addToCart(FILTER_PRODUCT);
      
      // Open checkout
      openCheckout();
    });
  }

  // Alternative: if you want to just redirect to a product page instead
  // Uncomment the code below and comment out the above if you prefer redirection
  
  /*
  const ctaButton = document.querySelector('.hf-cta');
  if (ctaButton) {
    ctaButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Order replacement filters clicked');
      
      // Add filter to cart
      addToCart(FILTER_PRODUCT);
      
      // Redirect to checkout page
      window.location.href = 'sections/checkout.html';
    });
  }
  */
});