// Shadow DOM Support Script
(() => {
  document.currentScript.remove();
  processNode(document);

  function processNode(node) {
    node.querySelectorAll("template[shadowrootmode]").forEach(element => {
      let shadowRoot = element.parentElement.shadowRoot;
      if (!shadowRoot) {
        try {
          shadowRoot = element.parentElement.attachShadow({
            mode: element.getAttribute("shadowrootmode"),
            delegatesFocus: element.getAttribute("shadowrootdelegatesfocus") != null,
            clonable: element.getAttribute("shadowrootclonable") != null,
            serializable: element.getAttribute("shadowrootserializable") != null
          });
          shadowRoot.innerHTML = element.innerHTML;
          element.remove();
        } catch (error) {}
        if (shadowRoot) {
          processNode(shadowRoot);
        }
      }
    });
  }
})();

// Rotating Text Animation Script
document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('rotating-text-container');
  const texts = container.querySelectorAll('.rotating-text');
  const speed = 3000;
  let currentIndex = 0;

  if (!container || texts.length === 0) {
    console.error('Rotating text container or items missing.');
    return;
  }

  // Measure widest text for container min-width
  let maxWidth = 0;
  texts.forEach(text => {
    const clone = text.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.opacity = '0';
    clone.style.visibility = 'hidden';
    container.appendChild(clone);
    const width = clone.offsetWidth;
    if (width > maxWidth) maxWidth = width;
    container.removeChild(clone);
  });

  if (window.innerWidth <= 991) {
    container.style.width = '100%';
  } else {
    container.style.minWidth = (maxWidth + 20) + 'px';
  }

  // Function to rotate text
  function rotateText() {
    texts.forEach((text, i) => {
      text.classList.remove('active');
      text.style.opacity = '0';
      text.style.visibility = 'hidden';
      text.style.transform = 'translateY(15px)';
    });

    const nextText = texts[currentIndex];
    nextText.classList.add('active');
    nextText.style.opacity = '1';
    nextText.style.visibility = 'visible';
    nextText.style.transform = 'translateY(0)';
    currentIndex = (currentIndex + 1) % texts.length;
  }

  // Initialize the first item and start rotation
  rotateText();
  setInterval(rotateText, speed);

  // Optional performance optimization
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        container.style.willChange = entry.isIntersecting ? 'opacity, transform' : 'auto';
      });
    }, { threshold: 0.1 });
    observer.observe(container);
  }

  // Update width on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 991) {
      container.style.width = '100%';
      container.style.minWidth = 'unset';
    } else {
      container.style.minWidth = (maxWidth + 20) + 'px';
    }
  });
});
