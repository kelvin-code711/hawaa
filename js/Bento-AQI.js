/* =========================
   Bento AQI — Full JS (Final, Air Breeze removed)
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
    unhealthy:'Today\'s air = half a pack of smokes.',
    very:     'Like working all day in choking dust.',
    hazard:   'This air is poison — like living inside a chimney.'
  };

  // Box 1 particle lane elements
  const laneBox1 = document.querySelector('.box1 .particle-lane');
  const dotsElBox1 = document.getElementById('particlesBox1');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    window.addEventListener('resize', () => {
      setBox2MobileHidden(!hasSearchedYet);
      retargetBox1Particles();
    });

    // === Build Ambient Particle Lane in Box 1 (Air Breeze removed) ===
    buildBox1Particles();
    retargetBox1Particles();
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

  // ------- Box 3: wrappers & caption (unchanged) -------
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
    resetBox3ToDefault();
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
    resetBox3ToDefault();
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
    inputEl.classList.add('input-bump');
    setTimeout(()=>{ inputEl.classList.remove('input-bump'); }, 700);
  }

  // ------- Box 1 Ambient Particle Lane (build & retarget) -------
  function buildBox1Particles(count = 26){
    if (!laneBox1 || !dotsElBox1) return;
    const centerX = Math.round(laneBox1.clientWidth / 2);
    const laneH   = laneBox1.clientHeight;

    dotsElBox1.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.className = 'p';

      // Size & vertical position
      const size = 3 + Math.random() * 5;
      const top  = Math.max(2, Math.random() * (laneH - size - 2));
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.top = `${top}px`;

      // Spawn offset (negative = left of lane)
      const spawnAbs = 16 + Math.random() * 24;
      dot.style.setProperty('--spawn', `${-spawnAbs}px`);

      // Travel to the exact center line (accounting for spawn distance)
      dot.style.setProperty('--toX', `${centerX + spawnAbs}px`);

      // Motion
      const dur   = prefersReduced ? 6 : (2.2 + Math.random() * 1.6);
      const delay = Math.random() * (prefersReduced ? 1 : 2.2);
      dot.style.setProperty('--dur', `${dur}s`);
      dot.style.setProperty('--delay', `${delay}s`);

      dotsElBox1.appendChild(dot);
    }
  }

  function retargetBox1Particles(){
    if (!laneBox1 || !dotsElBox1) return;
    const centerX = Math.round(laneBox1.clientWidth / 2);
    dotsElBox1.querySelectorAll('.p').forEach(p => {
      // compute spawnAbs from current --spawn value
      const style = getComputedStyle(p);
      const spawn = parseFloat(style.getPropertyValue('--spawn')) || -24;
      const spawnAbs = Math.abs(spawn);
      p.style.setProperty('--toX', `${centerX + spawnAbs}px`);
    });
  }

  // Maintain docking on resize for Box 3 lotties
  window.addEventListener('resize', () => {
    dockBottom(box3GoodWrap); dockBottom(box3ModerateWrap); dockBottom(box3USGWrap);
    dockBottom(box3UnhealthyWrap); dockBottom(box3VeryWrap); dockBottom(box3HazardWrap);
    retargetBox1Particles();
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