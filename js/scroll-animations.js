/**
 * Apple-style Scroll Reveal Animations
 * Uses Intersection Observer for performant scroll-based reveals
 */

document.addEventListener("DOMContentLoaded", () => {
  // Select all elements with reveal attributes
  const reveals = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
  
  if (!reveals.length) return;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  if (prefersReducedMotion) {
    // Immediately reveal all elements if user prefers reduced motion
    reveals.forEach((el) => el.classList.add("revealed"));
    return;
  }
  
  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          // Optional: unobserve after reveal for performance
          // observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -60px 0px"
    }
  );
  
  // Observe all reveal elements
  reveals.forEach((el) => observer.observe(el));
});
