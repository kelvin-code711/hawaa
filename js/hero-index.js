/* Hero Index — scroll sizing + robust mobile autoplay with image fade */
(() => {
  const root = document.getElementById("heroIndex");
  if (!root) return;

  // ===== Inline autoplay + graceful fallback =====
  const vid =
    document.getElementById("heroVideo") ||
    root.querySelector("video.hero-media");
  const reveal = () => root.classList.add("is-video-ready");

  if (vid) {
    // Ensure all mobile autoplay requirements
    vid.muted = true;
    vid.autoplay = true;
    vid.loop = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    // If you use poster in HTML, it shows until first decoded frame

    // Reveal once a frame is available
    vid.addEventListener("loadeddata", reveal, { once: true });
    vid.addEventListener("playing", reveal, { once: true });

    // Programmatic nudge (needed on some iOS/Android builds)
    const tryPlay = () => {
      const p = vid.play?.();
      if (p && typeof p.then === "function") {
        p.then(reveal).catch(() => { /* keep fallback visible */ });
      }
    };
    tryPlay();

    // Retry once on first touch for strict iOS policies
    window.addEventListener("touchstart", tryPlay, { once: true, passive: true });

    // Resume after tab becomes visible again
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });
  }

  // Keep hero static (no scroll-driven size/radius changes)
  root.style.setProperty("--w", "100%");
  root.style.setProperty("--r", "0px");
})();
