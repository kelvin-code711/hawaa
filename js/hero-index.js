(() => {
  const el = document.getElementById("heroIndex");
  if (!el) return;

  const mqMobile = window.matchMedia("(max-width: 767px)");
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
    // slightly slower/smoother with lower alpha
    state.w = lerp(state.w, target.w, 0.12);
    state.r = lerp(state.r, target.r, 0.12);

    el.style.setProperty("--w", state.w.toFixed(2) + "%");
    el.style.setProperty("--r", state.r.toFixed(2) + "px");

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
