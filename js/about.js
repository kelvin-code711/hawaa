/* ===== 100vh mobile fix ===== */
(function () {
  function setVH() {
    document.documentElement.style.setProperty("--vh", (window.innerHeight * 0.01) + "px");
  }
  setVH();
  window.addEventListener("resize", setVH, { passive: true });
  window.addEventListener("orientationchange", setVH, { passive: true });
})();

/* ===== Text ring rotates with scroll (kept) ===== */
(function () {
  const ring = document.querySelector("#scene1 .text-ring");
  if (!ring) return;
  const speed = 0.06;
  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    ring.style.transform =
      `translate(-50%, calc(50% + var(--circle-offset-y))) ` +
      `scale(var(--text-ring-scale)) rotate(${y * speed}deg)`;
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
})();

/* ===== Ensure S1 paints correctly on iOS ===== */
(function () {
  const s1 = document.querySelector("#scene1 .card");
  if (!s1) return;
  const ensure = () => {
    s1.style.minHeight = `calc(var(--vh, 1vh) * 100)`;
    s1.style.top = "0px";
  };
  ensure();
  window.addEventListener("resize", ensure, { passive: true });
  window.addEventListener("orientationchange", ensure, { passive: true });
})();

/* ===== Horizontal scroll ONLY inside pilot cards; never the page ===== */
document.addEventListener("DOMContentLoaded", function () {
  const strip = document.querySelector(".cards-container");
  if (!strip) return;

  // Guard rails on the element itself
  strip.style.touchAction = "pan-x pinch-zoom";
  strip.style.overscrollBehaviorInline = "contain";

  // Trackpads / mice: map both horizontal and vertical deltas to X while hovering the strip
  strip.addEventListener("wheel", function (e) {
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    // If mostly horizontal, consume; otherwise translate vertical to horizontal
    if (absX >= absY) {
      e.preventDefault();
      this.scrollLeft += e.deltaX;
    } else if (absY > 0) {
      e.preventDefault();
      this.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // Touch: lock to X inside the strip
  let startX = 0, startY = 0, active = false;
  strip.addEventListener("touchstart", (e) => {
    const t = e.touches[0]; if (!t) return;
    startX = t.clientX; startY = t.clientY; active = true;
  }, { passive: true });

  strip.addEventListener("touchmove", (e) => {
    if (!active) return;
    const t = e.touches[0]; if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal gesture → keep it inside the strip
      e.preventDefault();
      strip.scrollLeft -= dx;
      startX = t.clientX; // continue smooth dragging
    }
    // If vertical dominates, do nothing (page scrolls)
  }, { passive: false });

  strip.addEventListener("touchend", () => (active = false), { passive: true });
});

/* ===== Make sure S1 visuals are visible (no accidental hides) ===== */
document.addEventListener("DOMContentLoaded", function () {
  const elms = [
    document.querySelector("#scene1 .circle"),
    document.querySelector("#scene1 .text-ring"),
    document.querySelector("#scene1 .circle-center-image"),
  ];
  elms.forEach((el) => {
    if (!el) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") {
      el.style.display = "block";
      el.style.visibility = "visible";
      el.style.opacity = "1";
    }
  });
});

/* ===== IMPORTANT FIX: remove any page-level horizontal touch blocking that broke curtain reveal =====
   (We do NOT add global touchmove preventDefault anywhere.) */
