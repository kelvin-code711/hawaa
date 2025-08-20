/* =========================
   Bento AQI — Full JS (Final)
   ========================= */
(() => {
  const MAX_AQI = 500;
  const WHO_24H = { pm25: 15, pm10: 45 };

  // ------- Helpers -------
  const qs  = (sel, root = document) => root.querySelector(sel);
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  // Inputs & actions
  const cityInput = qs('#cityInput') || qs('input[name="city"], .city-input');
  const searchBtn = qs('.search-btn');
  const locateBtn = qs('#locateBtn') || qs('#locateMe') || qs('.locate-btn');

  // Box 2 + states
  const box2 = qs('.box2');
  const emptyState   = qs('.aqi-empty', box2);
  const loadingState = qs('.aqi-loading', box2);
  const resultState  = qs('.aqi-result', box2);

  // PM tiles
  const pm25El = qs('[data-js="pm25-value"]') || qs('.pm-stats .pm-tile:nth-child(1) .pm-value');
  const pm10El = qs('[data-js="pm10-value"]') || qs('.pm-stats .pm-tile:nth-child(2) .pm-value');
  const pm25UnitEl = qs('[data-js="pm25-unit"]') || qs('.pm-stats .pm-tile:nth-child(1) .pm-unit');
  const pm10UnitEl = qs('[data-js="pm10-unit"]') || qs('.pm-stats .pm-tile:nth-child(2) .pm-unit');

  // AQI ring + labels
  const ringProg  = qs('.ring .progress');
  const scoreNum  = qs('.result-score .num');
  const scoreLbl  = qs('.result-score .label');
  const statusTxt = qs('.result-status');

  // Box 3 refs
  const box3 = qs('.box3');
  let box3DefaultBG = box3 ? qs('.default-bg-wrap', box3) || qs('.lottie-bg-wrap', box3) : null;
  const box3DefaultFG = box3 ? qs('.lottie-fg-wrap', box3) : null;

  let box3GoodWrap      = null;
  let box3ModerateWrap  = null;
  let box3USGWrap       = null;
  let box3UnhealthyWrap = null;
  let box3VeryWrap      = null;
  let box3HazardWrap    = null;
  let box3Caption       = null;

  // ring path length cache
  let CIRC = 0;

  // Mobile visibility flag for Box 2
  let hasSearchedYet = false;

  // ------- Demo data -------
  const DEMO_DATA = {
    'Mumbai':      { aqi: 132, pm25: 68,  pm10: 104 },
    'Delhi':       { aqi: 242, pm25: 142, pm10: 210 },
    'Ahmedabad':   { aqi: 176, pm25: 95,  pm10: 160 },
    'Bengaluru':   { aqi: 88,  pm25: 36,  pm10: 70  },
    'Chennai':     { aqi: 72,  pm25: 28,  pm10: 64  },
    'Hyderabad':   { aqi: 110, pm25: 52,  pm10: 98  },
    'Pune':        { aqi: 92,  pm25: 40,  pm10: 80  },
    'Kolkata':     { aqi: 158, pm25: 82,  pm10: 140 },
    'Toronto':     { aqi: 42,  pm25: 10,  pm10: 22  },
    'Munich':      { aqi: 28,  pm25: 8,   pm10: 16  }
  };
  const DEMO_LOCATIONS_IN = ['Mumbai','Delhi','Ahmedabad','Bengaluru','Chennai','Hyderabad','Pune','Kolkata'];

  // Caption text per band
  const CAPTIONS = {
    good:     'Every breath adds life 🌿',
    moderate: 'Like sitting in traffic all day 🚦',
    usg:      'Each breath = one cigarette.',
    unhealthy:'Today’s air = half a pack of smokes.',
    very:     'Like working all day in choking dust.',
    hazard:   'This air is poison — like living inside a chimney.'
  };

  // =========================
  // Soft Air Breeze
  // =========================
  class AirBreeze {
    constructor(root, opts = {}) {
      this.root = typeof root === 'string' ? document.querySelector(root) : root;
      if (!this.root) return;

      // Canvas
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.root.appendChild(this.canvas);

      // Options
      this.opts = Object.assign({
        speed: 1.0,
        density: 1.6,
        hue: 190, sat: 80, light: 78,
        aMin: 0.12, aMax: 0.28,
        blur: 12, sAlpha: 0.85
      }, opts);

      // State
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.particles = [];
      this.time = 0;
      this.prev = performance.now();
      this.accum = 0;
      this.fixedDt = 1 / 75;

      // Events
      window.addEventListener('resize', this.resize.bind(this), { passive:true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(this.raf);
        else { this.prev = performance.now(); this.raf = requestAnimationFrame(this.loop.bind(this)); }
      });

      this.resize();
      this.spawn();
      this.loop();
    }

    resize() {
      const rect = this.root.getBoundingClientRect();
      const dpr = this.pixelRatio;
      this.w = Math.max(1, Math.floor(rect.width));
      this.h = Math.max(1, Math.floor(rect.height));
      this.canvas.width  = Math.floor(this.w * dpr);
      this.canvas.height = Math.floor(this.h * dpr);
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const base = Math.round((this.w * this.h) / 10000);
      this.targetCount = Math.max(120, Math.min(340, Math.round(base * this.opts.density)));
      this.syncCount();
    }

    spawn() {
      this.particles.length = 0;
      for (let i = 0; i < this.targetCount; i++) this.particles.push(this.make(true));
    }
    syncCount() {
      while (this.particles.length < this.targetCount) this.particles.push(this.make(true));
      while (this.particles.length > this.targetCount) this.particles.pop();
    }

    make(initial = false) {
      const margin = 28;
      const x = initial ? (Math.random() * (this.w + 2 * margin) - margin) : -margin;
      const y = Math.random() * this.h;
      const size  = 1.2 + Math.random() * 2.1;
      const speed = 0.55 + Math.random() * 0.75;

      return {
        x, y, px: x, py: y, ppx: x, ppy: y,
        size, speed,
        vx: 0, vy: 0,
        life: Math.random() * 3,
        maxLife: 10 + Math.random() * 10
      };
    }

    noise(x, y, t) {
      const s = Math.sin, c = Math.cos;
      const k1 = s((x * 0.007 + t * 0.00035)) * c((y * 0.011 - t * 0.00027));
      const k2 = c((x * 0.0032 - t * 0.00018)) * s((y * 0.0050 + t * 0.00022));
      const k3 = s((x * 0.0012 + y * 0.0014) + t * 0.00012);
      return (k1 + 0.7 * k2 + 0.4 * k3) * 0.46;
    }

    step(p, dt) {
      const baseAngle = Math.sin(this.time * 0.00016) * 0.26;
      const windX = Math.cos(baseAngle);
      const windY = Math.sin(baseAngle) * 0.06;

      const n = this.noise(p.x, p.y, this.time);
      const dir = baseAngle + n * 0.42;

      const tvx = windX * p.speed + Math.cos(dir) * 0.24;
      const tvy = windY * p.speed + Math.sin(dir) * 0.11;

      const k = 0.14;
      p.vx += (tvx - p.vx) * k;
      p.vy += (tvy - p.vy) * k;

      p.ppx = p.px; p.ppy = p.py;
      p.px = p.x;  p.py = p.y;
      p.x += p.vx * (16 * dt);
      p.y += p.vy * (16 * dt);

      const margin = 28;
      const span = this.w + 2 * margin;
      if (p.x > this.w + margin) { p.x -= span; p.px = p.ppx = p.x; }
      else if (p.x < -margin)     { p.x += span; p.px = p.ppx = p.x; }

      if (p.y > this.h + margin) { p.y = -margin; p.py = p.ppy = p.y; }
      else if (p.y < -margin)    { p.y = this.h + margin; p.py = p.ppy = p.y; }

      p.life += dt;
      if (p.life > p.maxLife) p.life = 0;
    }

    fadeTrails() {
      const ctx = this.ctx;
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.94)';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalCompositeOperation = 'source-over';
    }

    draw(p) {
      const ctx = this.ctx;
      const phase = p.life / p.maxLife;
      const ramp  = phase < 0.5 ? (phase * 2) : (1 - (phase - 0.5) * 2);

      const alpha = this.opts.aMin + (this.opts.aMax - this.opts.aMin) * ramp;
      const h = this.opts.hue + Math.sin((p.y / this.h) * 1.6 + this.time * 0.00024) * 4;

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = `hsla(${h}, ${this.opts.sat}%, ${this.opts.light}%, ${alpha})`;
      ctx.shadowBlur = this.opts.blur;
      ctx.shadowColor = `hsla(${h}, ${this.opts.sat + 5}%, ${this.opts.light - 3}%, ${alpha * this.opts.sAlpha})`;

      const mx = (p.px + p.ppx) * 0.5;
      const my = (p.py + p.ppy) * 0.5;

      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(p.px, p.py, p.x, p.y);
      ctx.stroke();
    }

    loop(now = performance.now()) {
      let dt = Math.min(0.05, (now - this.prev) / 1000);
      this.prev = now;
      this.time = now;

      this.accum += dt;

      this.fadeTrails();

      while (this.accum >= this.fixedDt) {
        for (let i = 0; i < this.particles.length; i++) this.step(this.particles[i], this.fixedDt);
        this.accum -= this.fixedDt;
      }

      for (let i = 0; i < this.particles.length; i++) this.draw(this.particles[i]);

      this.raf = requestAnimationFrame(this.loop.bind(this));
    }
  }

  // ------- Init -------
  document.addEventListener('DOMContentLoaded', () => {
    primeRing();

    if (searchBtn) searchBtn.addEventListener('click', () => getAqi());
    if (cityInput) cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') getAqi(); });
    if (locateBtn) locateBtn.addEventListener('click', onLocateMe);

    ensureCaption();
    ensureDefaultBG();         // guarantee default BG exists & is visible initially
    setEmpty('Enter a city to see the AQI.');

    // Mobile: Box 2 hidden on first load
    setBox2MobileHidden(true);
    window.addEventListener('resize', () => setBox2MobileHidden(!hasSearchedYet));

    // === Mount Soft Air Breeze in Box 1 ===
    const box1 = qs('.box1');
    if (box1){
      const oldImg = box1.querySelector('.bg-image-container');
      if (oldImg) oldImg.style.display = 'none';

      let host = box1.querySelector('.air-breeze');
      if (!host){
        host = document.createElement('div');
        host.className = 'air-breeze';
        box1.insertBefore(host, box1.firstChild);
      }
      new AirBreeze(host);
    }

    // === Box 4: ensure product grid (non-breaking) ===
    const box4 = qs('.box4');
    if (box4 && !box4.querySelector('.box4-grid')) {
      // If old quiz button exists, replace with grid; otherwise do nothing harmful
      box4.innerHTML = `
        <div class="box4-grid">
          <a class="prod-card" href="#air-purifier"><img src="your-air-purifier.jpg" alt="Air Purifier"></a>
          <a class="prod-card" href="#filter"><img src="your-filter.jpg" alt="Replacement Filter"></a>
        </div>
      `;
    }
  });

  // Expose for inline HTML hooks
  window.getAqi = async () => {
    const city = (cityInput?.value || '').trim();
    if (!city) { bumpInput(cityInput); return; }
    hasSearchedYet = true;
    setBox2MobileHidden(false);
    setLoading('Preparing demo data…');
    setTimeout(() => handleAqiPayload(makeDemoPayload(city)), 400);
  };

  // ------- Ring -------
  function primeRing() {
    const el = ringProg;
    if (!el) return;
    try {
      CIRC = el.getTotalLength();
      el.style.strokeDasharray = `${CIRC}`;
      el.style.strokeDashoffset = `${CIRC}`;
    } catch {}
  }

  // ------- Demo loaders -------
  function onLocateMe() {
    hasSearchedYet = true;
    setBox2MobileHidden(false);
    setLoading('Getting a quick demo reading…');
    setTimeout(() => {
      const city = DEMO_LOCATIONS_IN[rnd(0, DEMO_LOCATIONS_IN.length - 1)];
      handleAqiPayload(makeDemoPayload(city, { labelOverride: 'My location (demo)' }));
    }, 450);
  }

  function makeDemoPayload(city, opts = {}) {
    const base = DEMO_DATA[properCase(city)];
    let aqi, pm25, pm10, label;
    if (base) {
      aqi  = clamp(base.aqi + rnd(-6, 8), 5, 400);
      pm25 = clamp(base.pm25 + rnd(-4, 6), 2, 250);
      pm10 = clamp(base.pm10 + rnd(-8, 10), 5, 400);
      label = opts.labelOverride || properCase(city);
    } else {
      aqi = clamp(rnd(20, 240), 5, 400);
      pm25 = clamp(Math.round(aqi * (0.38 + Math.random() * 0.16)), 3, 250);
      pm10 = clamp(Math.round(aqi * (0.60 + Math.random() * 0.20)), 5, 400);
      label = opts.labelOverride || properCase(city || 'Unknown city');
    }
    return { status:'ok', data:{ aqi, iaqi:{ pm25:{ v: pm25 }, pm10:{ v: pm10 } }, city:{ name: label } } };
  }

  // ------- WHO helper -------
  function whoFactor(value, kind = 'pm25') {
    const limit = WHO_24H[kind];
    if (!Number.isFinite(value) || !limit) return { factor: NaN, label:'—', stateClass:'is-na' };
    const f = value / limit;
    const rounded = f >= 10 ? Math.round(f) : Math.round(f*10)/10;
    const label = `${rounded}× WHO`;
    const stateClass =
      f <= 1 ? 'is-healthy' :
      f <= 2 ? 'is-elevated' :
      f <= 3 ? 'is-high' :
      f <= 6 ? 'is-very-high' : 'is-severe';
    return { factor:f, label, stateClass };
  }

  // ------- Render / State -------
  function handleAqiPayload(json) {
    const d = json?.data || {};
    const aqi  = Number(d.aqi ?? NaN);
    const pm25 = safeNum(d?.iaqi?.pm25?.v);
    const pm10 = safeNum(d?.iaqi?.pm10?.v);
    const city = d?.city?.name || '';

    setPM(pm25El, pm25, 'pm25');
    setPM(pm10El, pm10, 'pm10');

    if (pm25UnitEl) pm25UnitEl.textContent = 'µg/m³';
    if (pm10UnitEl) pm10UnitEl.textContent = 'µg/m³';

    setAqi(aqi, city);
    showResult();
    setBox2MobileHidden(false);
  }

  function setPM(valueEl, value, kind) {
    if (!valueEl) return;
    const tile = valueEl.closest('.pm-tile');
    if (Number.isFinite(value)) {
      valueEl.textContent = String(value);
      tile?.classList.remove('is-na');
    } else {
      valueEl.textContent = '—';
      tile?.classList.add('is-na');
    }

    if (tile) {
      let badge = tile.querySelector('.pm-xwho');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'pm-xwho';
        (valueEl.parentElement || tile).appendChild(badge);
      }
      const meta = whoFactor(value, kind);
      badge.textContent = meta.label;
      tile.classList.remove('is-healthy','is-elevated','is-high','is-very-high','is-severe');
      tile.classList.add(meta.stateClass);
    }
  }

  function setAqi(aqi, cityLabel = '') {
    if (scoreNum) scoreNum.textContent = Number.isFinite(aqi) ? String(aqi) : '—';
    if (scoreLbl)  scoreLbl.textContent  = 'AQI';
    if (statusTxt) statusTxt.textContent = buildStatusText(aqi, cityLabel);

    if (ringProg && CIRC) {
      const norm = Number.isFinite(aqi) ? clamp(aqi, 0, MAX_AQI) / MAX_AQI : 0;
      ringProg.style.strokeDashoffset = `${CIRC * (1 - norm)}`;
    }

    setAqiCategory(box2, aqi);
    updateBox3Lottie(aqi);
  }

  function buildStatusText(aqi, city) {
    const category =
      !Number.isFinite(aqi) ? '' :
      aqi <= 50 ? 'Good / Healthy' :
      aqi <= 100 ? 'Moderate' :
      aqi <= 150 ? 'Unhealthy for Sensitive Groups' :
      aqi <= 200 ? 'Unhealthy for All' :
      aqi <= 300 ? 'Very Unhealthy' : 'Hazardous / Emergency';
    return [city, category].filter(Boolean).join(' • ') || '—';
  }
  function setAqiCategory(el, aqi) {
    if (!el) return;
    ['is-good','is-moderate','is-usg','is-unhealthy','is-very','is-hazard'].forEach(c => el.classList.remove(c));
    if (!Number.isFinite(aqi)) return;
    el.classList.add(
      aqi <= 50 ? 'is-good' :
      aqi <= 100 ? 'is-moderate' :
      aqi <= 150 ? 'is-usg' :
      aqi <= 200 ? 'is-unhealthy' :
      aqi <= 300 ? 'is-very' : 'is-hazard'
    );
  }

  // ------- Box 3: wrappers & caption -------
  function ensureCaption(){
    if (!box3) return null;
    if (box3Caption && box3.contains(box3Caption)) return box3Caption;
    const el = document.createElement('div');
    el.className = 'box3-caption';
    el.setAttribute('aria-live', 'polite');
    el.style.display = 'none';
    box3.appendChild(el);
    box3Caption = el;
    return el;
  }

  // Create/ensure a default BG (CSS-animated) for Box 3 and keep it visible when no band
  function ensureDefaultBG(){
    if (!box3) return;
    if (!box3DefaultBG){
      const wrap = document.createElement('div');
      wrap.className = 'default-bg-wrap';
      const layer = document.createElement('div');
      layer.className = 'default-bg';
      wrap.appendChild(layer);
      box3.appendChild(wrap);
      box3DefaultBG = wrap;
    } else {
      box3DefaultBG.hidden = false;
      box3DefaultBG.style.display = 'block';
    }
  }

  // Lottie ensures (if you use them; harmless otherwise)
  function ensureWrap(refName, cls, title, src){
    if (!box3) return null;
    if (refName && box3[refName] && box3.contains(box3[refName])) return box3[refName];
    const w = document.createElement('div'); w.className = cls; w.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe';
    iframe.title = title; iframe.loading = 'lazy'; iframe.allow = 'autoplay'; iframe.src = src;
    w.appendChild(iframe); box3.appendChild(w);
    dockBottom(w);
    return w;
  }
  function ensureGoodWrap(){ return (box3GoodWrap ||= ensureWrap('box3GoodWrap','lottie-good-wrap','Good AQI Animation','https://lottie.host/embed/69ef2c59-c01e-4ea8-8d91-e030c1bd3d2c/ytXU6mo7xS.json')); }
  function ensureModerateWrap(){ return (box3ModerateWrap ||= ensureWrap('box3ModerateWrap','lottie-moderate-wrap','Moderate AQI Animation','https://lottie.host/embed/3ec86fb8-fdf7-4854-9241-c31d76ae1a1f/IXy5zPtHUX.json')); }
  function ensureUSGWrap(){ return (box3USGWrap ||= ensureWrap('box3USGWrap','lottie-usg-wrap','USG AQI Animation','https://lottie.host/embed/95f452fa-4d17-444a-a820-140e7a8e6da9/DucssUgjEL.json')); }
  function ensureUnhealthyWrap(){ return (box3UnhealthyWrap ||= ensureWrap('box3UnhealthyWrap','lottie-unhealthy-wrap','Unhealthy AQI Animation','https://lottie.host/embed/2cd2f30c-5fd0-49f2-91c8-8d1c7f92cfd2/dndklH6ELw.json')); }
  function ensureVeryWrap(){ return (box3VeryWrap ||= ensureWrap('box3VeryWrap','lottie-very-wrap','Very Unhealthy AQI Animation','https://lottie.host/embed/ac2c9c48-23c7-454a-9988-f0f8d2db2862/uWZW7ant0U.json')); }
  function ensureHazardWrap(){ return (box3HazardWrap ||= ensureWrap('box3HazardWrap','lottie-hazard-wrap','Hazardous AQI Animation','https://lottie.host/embed/66a2944f-193d-46a3-aefc-bba1562ecf57/SCjkY1P63j.json')); }

  function updateBox3Lottie(aqi){
    if (!box3) return;

    const isGood     = Number.isFinite(aqi) && aqi >= 0   && aqi <= 50;
    const isModerate = Number.isFinite(aqi) && aqi >  50  && aqi <= 100;
    const isUSG      = Number.isFinite(aqi) && aqi >  100 && aqi <= 150;
    const isUnh      = Number.isFinite(aqi) && aqi >  150 && aqi <= 200;
    const isVery     = Number.isFinite(aqi) && aqi >  200 && aqi <= 300;
    const isHaz      = Number.isFinite(aqi) && aqi >  300 && aqi <= 500;

    ensureDefaultBG();
    const useDefault = !(isGood || isModerate || isUSG || isUnh || isVery || isHaz);
    if (box3DefaultBG) box3DefaultBG.hidden = !useDefault;
    if (box3DefaultFG) box3DefaultFG.hidden = !useDefault;

    // Toggle default-looping bg class
    if (useDefault) box3.classList.add('is-default');
    else            box3.classList.remove('is-default');

    const good = ensureGoodWrap();
    const mod  = ensureModerateWrap();
    const usg  = ensureUSGWrap();
    const unh  = ensureUnhealthyWrap();
    const very = ensureVeryWrap();
    const haz  = ensureHazardWrap();

    if (good) good.hidden = !isGood;
    if (mod)  mod.hidden  = !isModerate;
    if (usg)  usg.hidden  = !isUSG;
    if (unh)  unh.hidden  = !isUnh;
    if (very) very.hidden = !isVery;
    if (haz)  haz.hidden  = !isHaz;

    if (!box3Caption) ensureCaption();
    if (box3Caption){
      if (useDefault){
        box3Caption.style.display = 'none';
        box3Caption.textContent = '';
      } else {
        box3Caption.textContent =
          isGood ? CAPTIONS.good :
          isModerate ? CAPTIONS.moderate :
          isUSG ? CAPTIONS.usg :
          isUnh ? CAPTIONS.unhealthy :
          isVery ? CAPTIONS.very : CAPTIONS.hazard;
        box3Caption.style.display = 'block';
      }
    }

    box3.classList.remove('state-good','state-moderate','state-usg','state-unhealthy','state-very','state-hazard');
    if (!useDefault){
      box3.classList.add(
        isGood ? 'state-good' :
        isModerate ? 'state-moderate' :
        isUSG ? 'state-usg' :
        isUnh ? 'state-unhealthy' :
        isVery ? 'state-very' : 'state-hazard'
      );
    }
  }

  function resetBox3ToDefault(){
    if (!box3) return;
    ensureDefaultBG();
    if (box3DefaultBG) { box3DefaultBG.hidden = false; box3DefaultBG.style.display = 'block'; }
    if (box3DefaultFG) box3DefaultFG.hidden = false;
    if (box3GoodWrap)      box3GoodWrap.hidden      = true;
    if (box3ModerateWrap)  box3ModerateWrap.hidden  = true;
    if (box3USGWrap)       box3USGWrap.hidden       = true;
    if (box3UnhealthyWrap) box3UnhealthyWrap.hidden = true;
    if (box3VeryWrap)      box3VeryWrap.hidden      = true;
    if (box3HazardWrap)    box3HazardWrap.hidden    = true;
    if (box3Caption)       { box3Caption.style.display = 'none'; box3Caption.textContent = ''; }
    box3.classList.remove('state-good','state-moderate','state-usg','state-unhealthy','state-very','state-hazard');

    // Ensure pulsing loop runs in default state
    box3.classList.add('is-default');
  }

  // ------- UI state helpers -------
  function setLoading(msg='Fetching…'){
    if (emptyState) emptyState.style.display = 'none';
    if (resultState) resultState.style.display = 'none';
    if (loadingState) {
      loadingState.style.display = '';
      const p = qs('.loading-copy', loadingState);
      if (p) p.textContent = msg;
    }
    resetBox3ToDefault(); // show default bg
    setBox2MobileHidden(false);
  }
  function setEmpty(msg='Enter a city to see the AQI.'){
    if (loadingState) loadingState.style.display = 'none';
    if (resultState)  resultState.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = '';
      const p = qs('.empty-hint', emptyState);
      if (p) p.textContent = msg;
    }
    resetBox3ToDefault(); // show default bg
    hasSearchedYet = false;
    setBox2MobileHidden(true);
  }
  function showResult(){
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (resultState)  resultState.style.display = '';
  }

  // ------- Mobile toggle for Box 2 -------
  function setBox2MobileHidden(hidden){
    if (!box2) return;
    if (isMobile()) box2.setAttribute('data-mobile-hidden', hidden ? 'true' : 'false');
    else box2.removeAttribute('data-mobile-hidden');
  }

  // ------- Utils -------
  function safeNum(v){ const n = Number(v); return Number.isFinite(n) ? Math.round(n) : NaN; }
  function properCase(s){ if(!s) return s; return s.toLowerCase().split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '); }
  function bumpInput(inputEl){
    if(!inputEl) return;
    inputEl.focus();
    inputEl.classList.add('input-bump');       // CSS controls color
    setTimeout(()=>{ inputEl.classList.remove('input-bump'); }, 700);
  }

  // Maintain docking on resize
  window.addEventListener('resize', () => {
    dockBottom(box3GoodWrap); dockBottom(box3ModerateWrap); dockBottom(box3USGWrap);
    dockBottom(box3UnhealthyWrap); dockBottom(box3VeryWrap); dockBottom(box3HazardWrap);
  });

  // Dock util for lottie wrappers
  function dockBottom(wrap){
    if (!wrap) return;
    wrap.style.position = 'absolute';
    wrap.style.left = '0'; wrap.style.right = '0';
    wrap.style.bottom = '0'; wrap.style.top = 'auto';
    wrap.style.height = '100%';
    wrap.style.display = 'grid';
    wrap.style.alignItems = 'end';
    wrap.style.justifyItems = 'center';
    wrap.style.pointerEvents = 'none';
    const iframe = wrap.querySelector('iframe');
    if (iframe){
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.style.background = 'transparent';
    }
  }
})();
