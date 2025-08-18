/* ===========================
   Bento AQI — Full JS (with Box 3 dual Lottie + clipping)
   - Ambient particles that reach the center filter (responsive)
   - Inline “Locate me” button (reverse geocode to city)
   - Right-side AQI states + animated ring
   - Box 3: Background + Foreground Lottie (no bleed outside card)
   =========================== */
(function () {
  'use strict';

  // Inputs / containers
  const input   = document.getElementById('cityInput');
  const box2    = document.getElementById('box2');

  // Right-side states
  const elEmpty   = document.getElementById('aqiEmpty');
  const elLoading = document.getElementById('aqiLoading');
  const elResult  = document.getElementById('aqiResult');

  // Right-side elements
  const cityLoadingName = document.getElementById('cityLoadingName');
  const aqiValue  = document.getElementById('aqiValue');
  const aqiStatus = document.getElementById('aqiStatus');
  const gauge     = document.getElementById('gauge');

  // Left lane
  const lane        = document.querySelector('.particle-lane');
  const particlesEl = document.getElementById('particles');

  // Misc
  const chipsWrap = document.getElementById('popularChips');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CIRC = 2 * Math.PI * 42; // ring circumference
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function aqiCategory(v) {
    if (v <= 50)  return { key: 'is-good',      label: 'Good',                    color: '#34c759' };
    if (v <= 100) return { key: 'is-moderate',  label: 'Moderate',                color: '#ffd60a' };
    if (v <= 150) return { key: 'is-usg',       label: 'Unhealthy for Sensitive', color: '#ff8c00' };
    if (v <= 200) return { key: 'is-unhealthy', label: 'Unhealthy',               color: '#ff3b30' };
    if (v <= 300) return { key: 'is-very',      label: 'Very Unhealthy',          color: '#bf5af2' };
    return              { key: 'is-hazard',     label: 'Hazardous',               color: '#8e2a2a' };
  }
  function setBox2Category(key) {
    box2.classList.remove('is-good','is-moderate','is-usg','is-unhealthy','is-very','is-hazard');
    if (key) box2.classList.add(key);
  }

  /* ---------- PARTICLES (reach exact center) ---------- */
  let particlesBuilt = false;
  function buildAmbientParticles(count = 26) {
    if (!lane || !particlesEl) return;
    particlesEl.innerHTML = '';
    const laneH   = lane.clientHeight;
    const centerX = Math.round(lane.clientWidth / 2);

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.className = 'p';

      // size & vertical placement
      const size = 3 + Math.random() * 5;
      const top  = Math.max(2, Math.random() * (laneH - size - 2));
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.top = `${top}px`;

      // spawn x off-lane to the left
      const spawnAbs = 16 + Math.random() * 24; // 16–40 px left of lane
      dot.style.setProperty('--spawn', `${-spawnAbs}px`);
      dot.dataset.spawnAbs = String(spawnAbs);

      // target: centerX + spawnAbs (px)
      dot.style.setProperty('--toX', `${centerX + spawnAbs}px`);

      // motion
      const dur = prefersReduced ? 6 : (2.2 + Math.random() * 1.6);
      const delay = Math.random() * (prefersReduced ? 1 : 2.2);
      dot.style.setProperty('--dur', `${dur}s`);
      dot.style.setProperty('--delay', `${delay}s`);

      particlesEl.appendChild(dot);
    }
    particlesBuilt = true;
  }
  function retargetParticlesToCenter() {
    if (!particlesBuilt || !lane || !particlesEl) return;
    const centerX = Math.round(lane.clientWidth / 2);
    particlesEl.querySelectorAll('.p').forEach(p => {
      const spawnAbs = parseFloat(p.dataset.spawnAbs || '24');
      p.style.setProperty('--toX', `${centerX + spawnAbs}px`);
    });
  }
  window.addEventListener('resize', retargetParticlesToCenter);
  window.addEventListener('load',   retargetParticlesToCenter);

  /* ---------- RIGHT STATES + RING ---------- */
  function showEmpty() {
    elEmpty.hidden = false; elLoading.hidden = true; elResult.hidden = true; setBox2Category(null);
  }
  function showLoading(city) {
    elEmpty.hidden = true; elResult.hidden = true; elLoading.hidden = false;
    cityLoadingName.textContent = city || 'your city';
  }
  function showResult(aqi) {
    elEmpty.hidden = true; elLoading.hidden = true; elResult.hidden = false;

    const v = clamp(Math.round(aqi), 0, 500);
    const cat = aqiCategory(v);
    setBox2Category(cat.key);
    aqiStatus.textContent = cat.label;

    // ring
    gauge.style.stroke = cat.color;
    gauge.style.strokeDasharray = CIRC;
    gauge.style.strokeDashoffset = CIRC;

    // value animation (tiny overshoot)
    const overshoot = Math.min(v + Math.max(3, Math.round(v * 0.03)), 500);
    animateNumber(0, overshoot, 500, n => aqiValue.textContent = String(Math.round(n)));
    setTimeout(() => animateNumber(overshoot, v, 220, n => aqiValue.textContent = String(Math.round(n))), 520);

    const percent = v / 500;
    const targetOffset = CIRC * (1 - percent);
    requestAnimationFrame(() => { gauge.style.strokeDashoffset = String(targetOffset); });
  }
  function animateNumber(from, to, dur, cb) {
    const start = performance.now();
    (function frame(t){
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      cb(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- PUBLIC SEARCH ---------- */
  window.getAqi = async function getAqi() {
    const city = (input?.value || '').trim();
    if (!city) { showEmpty(); return; }
    showLoading(city);

    // Demo fetch — replace with your API call
    await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
    const aqi = Math.floor(Math.random() * 300);
    showResult(aqi);
  };

  // chips + enter
  chipsWrap?.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip'); if (!btn) return;
    input.value = (btn.dataset.city || btn.textContent || '').trim();
    window.getAqi();
  });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); window.getAqi(); }
  });

  /* ---------- LOCATE ME ---------- */
  const locateBtn = document.getElementById('locateBtn');
  if (locateBtn) {
    locateBtn.addEventListener('click', async () => {
      if (!navigator.geolocation) { alert('Location not supported on this browser.'); return; }
      const originalHTML = locateBtn.innerHTML;
      locateBtn.disabled = true;
      locateBtn.innerHTML = '<span class="icon" aria-hidden="true">⌛</span> Locating…';

      const setCityAndSearch = (name) => {
        if (input) input.value = name || '';
        window.getAqi();
      };

      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || 'Your location';
          setCityAndSearch(city);
        } catch (_) {
          setCityAndSearch('Your location');
        } finally {
          locateBtn.disabled = false;
          locateBtn.innerHTML = originalHTML;
        }
      }, () => {
        alert('Could not get your location.');
        locateBtn.disabled = false;
        locateBtn.innerHTML = originalHTML;
      }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
    });
  }

  /* ---------- LOTTIE HELPERS ---------- */
  function ensureLottie(cb){
    if (window.lottie) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
    s.onload = cb;
    s.onerror = () => console.warn('[Bento AQI] Failed to load lottie-web CDN.');
    document.head.appendChild(s);
  }

  function stripLottieBackground(anim){
    // Run after the SVG is built
    anim.addEventListener('DOMLoaded', () => {
      const svg = anim.renderer?.svgElement;
      if (!svg) return;

      // Helper to compare sizes loosely
      const approx = (a, b) => Math.abs(a - b) <= 1;

      // Get viewBox size (fallback to client size)
      const vb = svg.getAttribute('viewBox')?.split(/\s+/).map(parseFloat);
      const w = vb ? vb[2] : (svg.clientWidth || 0);
      const h = vb ? vb[3] : (svg.clientHeight || 0);

      // 1) Hide any obvious BG layers by name
      svg.querySelectorAll('[id],[data-name]').forEach(el => {
        const name = (el.getAttribute('id') || el.getAttribute('data-name') || '').toLowerCase();
        if (name.includes('bg') || name.includes('background')) {
          el.setAttribute('fill', 'transparent');
          el.setAttribute('stroke', 'none');
          el.setAttribute('opacity', '0');
        }
      });

      // 2) Hide any <rect> that covers the whole canvas
      svg.querySelectorAll('rect').forEach(r => {
        const x  = parseFloat(r.getAttribute('x') || '0');
        const y  = parseFloat(r.getAttribute('y') || '0');
        const rw = parseFloat(r.getAttribute('width')  || '0');
        const rh = parseFloat(r.getAttribute('height') || '0');
        const fill = (r.getAttribute('fill') || '').toLowerCase();

        if (approx(rw, w) && approx(rh, h) && x <= 1 && y <= 1 && fill !== 'none' && fill !== 'transparent') {
          r.setAttribute('fill', 'transparent');
          r.setAttribute('stroke', 'none');
          r.setAttribute('opacity', '0');
        }
      });

      // 3) Safety: kill any solid <path> used as a flat BG (rare)
      svg.querySelectorAll('path').forEach(p => {
        const name = (p.getAttribute('id') || p.getAttribute('data-name') || '').toLowerCase();
        if (name.includes('bg') || name.includes('background')) {
          p.setAttribute('fill', 'transparent');
          p.setAttribute('stroke', 'none');
          p.setAttribute('opacity', '0');
        }
      });
    });
  }

  /* ---------- LOTTIE IN BOX 3 (BG + FG, clipped) ---------- */
  function initLottie(){
    const fg = document.getElementById('lottieBox3');
    const bg = document.getElementById('lottieBg3');
    if (!fg && !bg) return;

    // Ensure visible size for the foreground container (if CSS hasn’t applied yet)
    if (fg) {
      if (!fg.style.width)  fg.style.width  = '200px';
      if (!fg.style.height) fg.style.height = '200px';
      fg.style.display = 'flex';
      fg.style.alignItems = 'center';
      fg.style.justifyContent = 'center';
      fg.style.background = 'transparent';
    }

    // === Foreground animation (icon) ===
    if (fg) {
      const sources = [
        // Prefer the JSON that worked for you
        'https://lottie.host/embed/2b8e749b-4cd3-4320-9076-594a35c7e358/pUlp7B6m1m.json',
        // Fallback
        'https://lottie.host/embed/2f98f016-a108-4399-b171-efdfe09504bd/OgM6DVuwEP.json'
      ];

      const loadFG = (i = 0) => {
        const anim = lottie.loadAnimation({
          container: fg,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: sources[i],
          rendererSettings: { progressiveLoad: true }
        });

        anim.addEventListener('data_failed', () => {
          if (i + 1 < sources.length) loadFG(i + 1);
          else console.warn('[Bento AQI] Foreground Lottie sources failed.');
        });

        // Remove any bg fill from FG to avoid a bounding box
        stripLottieBackground(anim);
      };

      loadFG(0);
    }

    // === Background animation (fills card) ===
    if (bg) {
      const bgAnim = lottie.loadAnimation({
        container: bg,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://lottie.host/embed/56ac60ad-7b43-4b04-bc9e-71d6b3c9bbb3/it7gfhRfdW.json',
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice', // cover the box neatly
          progressiveLoad: true
        }
      });

      bgAnim.addEventListener('DOMLoaded', () => {
        try { bgAnim.setSpeed(0.6); } catch (_){}
      });

      // In case the BG JSON includes a solid rect
      stripLottieBackground(bgAnim);
    }
  }

  // Load after Lottie script + DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ensureLottie(initLottie));
  } else {
    ensureLottie(initLottie);
  }

  /* ---------- INIT ---------- */
  buildAmbientParticles();       // always animating
  retargetParticlesToCenter();   // ensure exact center target
  showEmpty();                   // default right state
})();
