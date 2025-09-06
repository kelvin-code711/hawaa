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

  // ===== Scroll-driven size/radius (kept from your previous logic) =====
  const mqMobile  = window.matchMedia("(max-width: 767px)");
  const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function cfg() {
    return mqMobile.matches
      ? { maxScroll: 500, minWidth: 94, maxRadius: 48 } // mobile
      : { maxScroll: 700, minWidth: 95, maxRadius: 64 }; // desktop
  }

  let target = { w: 100, r: 0 };
  let state  = { w: 100, r: 0 };
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;

  let rafId = null;

  function updateTargets() {
    if (mqReduced.matches) {
      target.w = 100; target.r = 0;
      return;
    }
    const { maxScroll, minWidth, maxRadius } = cfg();
    const y = Math.min(window.scrollY, maxScroll);
    const p = easeOutCubic(y / maxScroll);
    target.w = 100 - p * (100 - minWidth);
    target.r = p * maxRadius;
  }

  function frame() {
    // slightly slower/smoother
    state.w = lerp(state.w, target.w, 0.12);
    state.r = lerp(state.r, target.r, 0.12);

    root.style.setProperty("--w", state.w.toFixed(2) + "%");
    root.style.setProperty("--r", state.r.toFixed(2) + "px");

    if (Math.abs(state.w - target.w) > 0.02 || Math.abs(state.r - target.r) > 0.02) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
    }
  }

  function kick() {
    updateTargets();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  // listeners
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  mqMobile.addEventListener?.("change", kick);
  mqReduced.addEventListener?.("change", kick);

  // init
  kick();
})();
