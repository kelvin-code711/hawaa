/* =========================
   Bento AQI — DEMO JS (no API)
   Box3: per-band Lottie + per-band caption overlay
   Particle lane fully removed
   ========================= */

(() => {
  const MAX_AQI = 500;
  const WHO_24H = { pm25: 15, pm10: 45 };

  // ------- Helpers -------
  const qs  = (sel, root = document) => root.querySelector(sel);
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const rnd = (min, max) => Math.round(min + Math.random() * (max - min));

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
  const box3DefaultBG = box3 ? qs('.lottie-bg-wrap', box3) : null;
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
    good:    'Every breath adds life 🌿',
    moderate:'Like sitting in traffic all day 🚦',
    usg:     'Each breath = one cigarette.',
    unhealthy:'Today’s air = half a pack of smokes.',
    very:    'Like working all day in choking dust.',
    hazard:  'This air is poison — like living inside a chimney.'
  };

  // ------- Init -------
  document.addEventListener('DOMContentLoaded', () => {
    // Remove any legacy particle lane in the DOM
    const strayLane = qs('.particle-lane');
    if (strayLane && strayLane.parentNode) strayLane.parentNode.removeChild(strayLane);

    primeRing();

    if (searchBtn) searchBtn.addEventListener('click', () => getAqi());
    if (cityInput) cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') getAqi(); });
    if (locateBtn) locateBtn.addEventListener('click', onLocateMe);

    ensureCaption();
    setEmpty('Enter a city to see the AQI.');
    resetBox3ToDefault();
  });

  // Expose for inline HTML hooks
  window.getAqi = async () => {
    const city = (cityInput?.value || '').trim();
    if (!city) { bumpInput(cityInput); return; }
    setLoading('Preparing demo data…');
    setTimeout(() => handleAqiPayload(makeDemoPayload(city)), 400);
  };

  // ------- Ring -------
  function primeRing() {
    if (!ringProg) return;
    try {
      CIRC = ringProg.getTotalLength();
      ringProg.style.strokeDasharray = `${CIRC}`;
      ringProg.style.strokeDashoffset = `${CIRC}`;
    } catch {}
  }

  // ------- Demo loaders -------
  function onLocateMe() {
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
    updateBox3Lottie(aqi); // swap animation + caption
  }

  function buildStatusText(aqi, city) {
    const category = aqiCategory(aqi);
    const parts = [];
    if (city) parts.push(city);
    if (category) parts.push(category);
    return parts.join(' • ') || '—';
  }

  function setAqiCategory(el, aqi) {
    if (!el) return;
    ['is-good','is-moderate','is-usg','is-unhealthy','is-very','is-hazard'].forEach(c => el.classList.remove(c));
    const c = aqiClass(aqi);
    if (c) el.classList.add(c);
  }

  function aqiCategory(aqi){
    if (!Number.isFinite(aqi)) return '';
    if (aqi <= 50)  return 'Good / Healthy';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy for All';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous / Emergency';
  }
  function aqiClass(aqi){
    if (!Number.isFinite(aqi)) return '';
    if (aqi <= 50)  return 'is-good';
    if (aqi <= 100) return 'is-moderate';
    if (aqi <= 150) return 'is-usg';
    if (aqi <= 200) return 'is-unhealthy';
    if (aqi <= 300) return 'is-very';
    return 'is-hazard';
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

  function ensureGoodWrap() {
    if (!box3) return null;
    if (box3GoodWrap && box3.contains(box3GoodWrap)) return box3GoodWrap;
    const wrap = document.createElement('div'); wrap.className = 'lottie-good-wrap'; wrap.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe lottie-iframe--good';
    iframe.title = 'Good AQI Animation';
    iframe.loading = 'lazy'; iframe.allow = 'autoplay';
    iframe.src = 'https://lottie.host/embed/69ef2c59-c01e-4ea8-8d91-e030c1bd3d2c/ytXU6mo7xS.json';
    wrap.appendChild(iframe); box3.appendChild(wrap); box3GoodWrap = wrap; return wrap;
  }
  function ensureModerateWrap() {
    if (!box3) return null;
    if (box3ModerateWrap && box3.contains(box3ModerateWrap)) return box3ModerateWrap;
    const wrap = document.createElement('div'); wrap.className = 'lottie-moderate-wrap'; wrap.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe lottie-iframe--moderate';
    iframe.title = 'Moderate AQI Animation';
    iframe.loading = 'lazy'; iframe.allow = 'autoplay';
    iframe.src = 'https://lottie.host/embed/3ec86fb8-fdf7-4854-9241-c31d76ae1a1f/IXy5zPtHUX.json';
    wrap.appendChild(iframe); box3.appendChild(wrap); box3ModerateWrap = wrap; return wrap;
  }
  function ensureUSGWrap() {
    if (!box3) return null;
    if (box3USGWrap && box3.contains(box3USGWrap)) return box3USGWrap;
    const wrap = document.createElement('div'); wrap.className = 'lottie-usg-wrap'; wrap.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe lottie-iframe--usg';
    iframe.title = 'Unhealthy for Sensitive Groups AQI Animation';
    iframe.loading = 'lazy'; iframe.allow = 'autoplay';
    iframe.src = 'https://lottie.host/embed/95f452fa-4d17-444a-a820-140e7a8e6da9/DucssUgjEL.json';
    wrap.appendChild(iframe); box3.appendChild(wrap); box3USGWrap = wrap; return wrap;
  }
  function ensureUnhealthyWrap() {
    if (!box3) return null;
    if (box3UnhealthyWrap && box3.contains(box3UnhealthyWrap)) return box3UnhealthyWrap;
    const wrap = document.createElement('div'); wrap.className = 'lottie-unhealthy-wrap'; wrap.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe lottie-iframe--unhealthy';
    iframe.title = 'Unhealthy AQI Animation';
    iframe.loading = 'lazy'; iframe.allow = 'autoplay';
    iframe.src = 'https://lottie.host/embed/2cd2f30c-5fd0-49f2-91c8-8d1c7f92cfd2/dndklH6ELw.json';
    wrap.appendChild(iframe); box3.appendChild(wrap); box3UnhealthyWrap = wrap; return wrap;
  }
  function ensureVeryWrap() {
    if (!box3) return null;
    if (box3VeryWrap && box3.contains(box3VeryWrap)) return box3VeryWrap;
    const wrap = document.createElement('div'); wrap.className = 'lottie-very-wrap'; wrap.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe lottie-iframe--very';
    iframe.title = 'Very Unhealthy AQI Animation';
    iframe.loading = 'lazy'; iframe.allow = 'autoplay';
    iframe.src = 'https://lottie.host/embed/ac2c9c48-23c7-454a-9988-f0f8d2db2862/uWZW7ant0U.json';
    wrap.appendChild(iframe); box3.appendChild(wrap); box3VeryWrap = wrap; return wrap;
  }
  function ensureHazardWrap() {
    if (!box3) return null;
    if (box3HazardWrap && box3.contains(box3HazardWrap)) return box3HazardWrap;
    const wrap = document.createElement('div'); wrap.className = 'lottie-hazard-wrap'; wrap.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe lottie-iframe--hazard';
    iframe.title = 'Hazardous AQI Animation';
    iframe.loading = 'lazy'; iframe.allow = 'autoplay';
    iframe.src = 'https://lottie.host/embed/66a2944f-193d-46a3-aefc-bba1562ecf57/SCjkY1P63j.json';
    wrap.appendChild(iframe); box3.appendChild(wrap); box3HazardWrap = wrap; return wrap;
  }

  function updateBox3Lottie(aqi){
    if (!box3) return;

    const isGood     = Number.isFinite(aqi) && aqi >= 0   && aqi <= 50;
    const isModerate = Number.isFinite(aqi) && aqi >  50  && aqi <= 100;
    const isUSG      = Number.isFinite(aqi) && aqi >  100 && aqi <= 150;
    const isUnh      = Number.isFinite(aqi) && aqi >  150 && aqi <= 200;
    const isVery     = Number.isFinite(aqi) && aqi >  200 && aqi <= 300;
    const isHaz      = Number.isFinite(aqi) && aqi >  300 && aqi <= 500;

    const good = ensureGoodWrap();
    const mod  = ensureModerateWrap();
    const usg  = ensureUSGWrap();
    const unh  = ensureUnhealthyWrap();
    const very = ensureVeryWrap();
    const haz  = ensureHazardWrap();
    ensureCaption();

    // Only one visible at a time
    if (good) good.hidden = !isGood;
    if (mod)  mod.hidden  = !isModerate;
    if (usg)  usg.hidden  = !isUSG;
    if (unh)  unh.hidden  = !isUnh;
    if (very) very.hidden = !isVery;
    if (haz)  haz.hidden  = !isHaz;

    // Default bg/fg visible only when no valid category
    const useDefault = !(isGood || isModerate || isUSG || isUnh || isVery || isHaz);
    if (box3DefaultBG) box3DefaultBG.hidden = !useDefault;
    if (box3DefaultFG) box3DefaultFG.hidden = !useDefault;

    // Background tints by state (optional)
    box3.style.background =
      isGood ? 'linear-gradient(135deg, #E8F7EE, #DFF7FF)' :
      isModerate ? 'linear-gradient(135deg, #FFF6D6, #FFEFC2)' :
      isUSG ? 'linear-gradient(135deg, #FFE8C9, #FFE0B3)' :
      isUnh ? 'linear-gradient(135deg, #FFE1E1, #FFD0D0)' :
      isVery ? 'linear-gradient(135deg, #F1D9FF, #E8C8FF)' :
      isHaz ? 'linear-gradient(135deg, #F3C9C9, #E6B0B0)' :
      'linear-gradient(135deg, var(--blue-50), var(--blue-200))';

    // Apply per-band state class for CSS sizing/positioning
    box3.classList.remove('state-good','state-moderate','state-usg','state-unhealthy','state-very','state-hazard');
    let captionText = '';
    if (isGood)        { box3.classList.add('state-good');      captionText = CAPTIONS.good; }
    else if (isModerate){ box3.classList.add('state-moderate'); captionText = CAPTIONS.moderate; }
    else if (isUSG)     { box3.classList.add('state-usg');      captionText = CAPTIONS.usg; }
    else if (isUnh)     { box3.classList.add('state-unhealthy');captionText = CAPTIONS.unhealthy; }
    else if (isVery)    { box3.classList.add('state-very');     captionText = CAPTIONS.very; }
    else if (isHaz)     { box3.classList.add('state-hazard');   captionText = CAPTIONS.hazard; }

    // Update caption visibility/text
    if (box3Caption) {
      if (useDefault) {
        box3Caption.style.display = 'none';
        box3Caption.textContent = '';
      } else {
        box3Caption.textContent = captionText || '';
        box3Caption.style.display = captionText ? 'block' : 'none';
      }
    }
  }

  function resetBox3ToDefault(){
    if (!box3) return;
    if (box3DefaultBG) box3DefaultBG.hidden = false;
    if (box3DefaultFG) box3DefaultFG.hidden = false;
    if (box3GoodWrap)      box3GoodWrap.hidden      = true;
    if (box3ModerateWrap)  box3ModerateWrap.hidden  = true;
    if (box3USGWrap)       box3USGWrap.hidden       = true;
    if (box3UnhealthyWrap) box3UnhealthyWrap.hidden = true;
    if (box3VeryWrap)      box3VeryWrap.hidden      = true;
    if (box3HazardWrap)    box3HazardWrap.hidden    = true;
    if (box3Caption)       { box3Caption.style.display = 'none'; box3Caption.textContent = ''; }
    box3.classList.remove('state-good','state-moderate','state-usg','state-unhealthy','state-very','state-hazard');
    box3.style.background = 'linear-gradient(135deg, var(--blue-50), var(--blue-200))';
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
    resetBox3ToDefault(); // keep defaults during loading
  }
  function setEmpty(msg='Enter a city to see the AQI.'){
    if (loadingState) loadingState.style.display = 'none';
    if (resultState)  resultState.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = '';
      const p = qs('.empty-hint', emptyState);
      if (p) p.textContent = msg;
    }
    resetBox3ToDefault(); // show default bg+fg when no search
  }
  function showResult(){
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (resultState)  resultState.style.display = '';
  }

  // ------- Utils -------
  function safeNum(v){ const n = Number(v); return Number.isFinite(n) ? Math.round(n) : NaN; }
  function properCase(s){ if(!s) return s; return s.toLowerCase().split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '); }
  function bumpInput(inputEl){ if(!inputEl) return; inputEl.focus(); inputEl.style.outline='2px solid #ff6666'; setTimeout(()=>{inputEl.style.outline='';},700); }
})();
