/* =========================
   Bento AQI — JS (2025-08-29)
   - Bounds-aware dropdown (Leaflet/Google Maps)
   - India-only stations
   - Toast when typed city has no CPCB station
   - Dropdown shows names only (no AQI)
   - Nearest-station UI/logic REMOVED (per request)
========================= */
(() => {
  const MAX_AQI = 500;
  const WHO_24H = { pm25: 15, pm10: 45 };
  const AQICN_TOKEN = 'd51edd8bd0f9f59e1ba1cf2df56eacc3377bd23d';

  // ------- Helpers -------
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : NaN; };
  const properCase = (s) => !s ? s : s.toLowerCase().split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

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
  let box3GoodWrap = null, box3ModerateWrap = null, box3USGWrap = null, box3UnhealthyWrap = null, box3VeryWrap = null, box3HazardWrap = null, box3Caption = null;

  // Box 1 lane + title
  const box1    = qs('.box1');
  const titleH1 = qs('.box1 h1');
  const laneBox = qs('.box1 .particle-lane');
  const laneDots = laneBox ? laneBox.querySelector('.particles') : null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ring path length cache
  let CIRC = 0;

  // Mobile visibility flag for Box 2
  let hasSearchedYet = false;

  // Demo data (kept)
  const DEMO_DATA = {
    'Mumbai': { aqi:132, pm25:68,  pm10:104 }, 'Delhi':{ aqi:242, pm25:142, pm10:210 },
    'Ahmedabad':{ aqi:176, pm25:95, pm10:160 }, 'Bengaluru':{ aqi:88, pm25:36, pm10:70 },
    'Chennai':{ aqi:72, pm25:28, pm10:64 }, 'Hyderabad':{ aqi:110, pm25:52, pm10:98 },
    'Pune':{ aqi:92, pm25:40, pm10:80 }, 'Kolkata':{ aqi:158, pm25:82, pm10:140 },
    'Toronto':{ aqi:42, pm25:10, pm10:22 }, 'Munich':{ aqi:28, pm25:8, pm10:16 }
  };

  const CAPTIONS = {
    good:'Every breath adds life 🌿',
    moderate:'Like sitting in traffic all day 🚦',
    usg:'Each breath = one cigarette.',
    unhealthy:'Today’s air = half a pack of smokes.',
    very:'Like working all day in choking dust.',
    hazard:'This air is poison — like living inside a chimney.'
  };

  // ------- AQICN fetchers -------
  async function fetchAQICNByCity(city){
    const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${AQICN_TOKEN}`;
    const resp = await fetch(url, { cache: 'no-store' });
    const json = await resp.json();
    if (json.status !== 'ok') throw new Error(json.data || 'AQICN city fetch failed');
    return mapAQICN(json);
  }
  async function fetchAQICNByGeo(lat, lon){
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_TOKEN}`;
    const resp = await fetch(url, { cache: 'no-store' });
    const json = await resp.json();
    if (json.status !== 'ok') throw new Error(json.data || 'AQICN geo fetch failed');
    return mapAQICN(json);
  }
  async function fetchAQICNByUid(uid){
    const url = `https://api.waqi.info/feed/@${encodeURIComponent(uid)}/?token=${AQICN_TOKEN}`;
    const resp = await fetch(url, { cache: 'no-store' });
    const json = await resp.json();
    if (json.status !== 'ok') throw new Error(json.data || 'AQICN uid fetch failed');
    return mapAQICN(json);
  }
  function mapAQICN(json){
    const d = json?.data || {};
    const n = (v) => { const num = Number(v); return Number.isFinite(num) ? Math.round(num) : NaN; };
    return {
      status: 'ok',
      data: {
        aqi: n(d.aqi),
        iaqi: { pm25: { v: n(d?.iaqi?.pm25?.v) }, pm10: { v: n(d?.iaqi?.pm10?.v) } },
        city: { name: d?.city?.name || '' },
        idx: d?.idx
      }
    };
  }

  // ------- Type-ahead (/search) -------
  let suggestionWrap = null;
  let selectedUid = null;
  let lastSuggestQuery = '';
  let suggestReqId = 0;

  // Bounds-driven suggestion
  const USE_BOUNDS_FOR_SUGGEST = true;
  const MAX_SUGGESTIONS = 30;

  function getCurrentBounds() {
    if (window.map && typeof window.map.getBounds === 'function') {
      const b = window.map.getBounds();
      const sw = b.getSouthWest ? b.getSouthWest() : b._southWest;
      const ne = b.getNorthEast ? b.getNorthEast() : b._northEast;
      if (sw && ne) return { minLat: sw.lat, maxLat: ne.lat, minLng: sw.lng, maxLng: ne.lng };
    }
    if (window.gmap && typeof window.gmap.getBounds === 'function') {
      const b = window.gmap.getBounds();
      if (b) {
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        return { minLat: sw.lat(), maxLat: ne.lat(), minLng: sw.lng(), maxLng: ne.lng() };
      }
    }
    return null;
  }
  function pointInBounds(lat, lng, bounds) {
    if (!bounds) return true;
    return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
  }

  function initTypeahead(){
    if (!cityInput) return;

    const holder = cityInput.closest('.search-input') || cityInput.parentElement;
    suggestionWrap = document.createElement('div');
    suggestionWrap.className = 'aqi-suggest';
    holder.appendChild(suggestionWrap);

    cityInput.addEventListener('input', onType);
    cityInput.addEventListener('focus', () => {
      if (suggestionWrap && suggestionWrap.childElementCount) suggestionWrap.classList.add('is-open');
    });
    document.addEventListener('click', (e) => {
      if (!suggestionWrap) return;
      if (!suggestionWrap.contains(e.target) && e.target !== cityInput) hideSuggest();
    });

    if (window.map && typeof window.map.on === 'function') {
      window.map.on('moveend', () => {
        if (window._lastSuggestList && suggestionWrap?.classList.contains('is-open')) {
          renderSuggest(window._lastSuggestList, lastSuggestQuery);
        }
      });
    }
    if (window.gmap && typeof window.gmap.addListener === 'function') {
      window.gmap.addListener('idle', () => {
        if (window._lastSuggestList && suggestionWrap?.classList.contains('is-open')) {
          renderSuggest(window._lastSuggestList, lastSuggestQuery);
        }
      });
    }
  }

  const onType = debounce(async (valEvt) => {
    selectedUid = null;
    const q = (typeof valEvt === 'string' ? valEvt : valEvt.target.value).trim();
    if (q.length < 2){ hideSuggest(); lastSuggestQuery=''; return; }
    if (q === lastSuggestQuery) return;
    lastSuggestQuery = q;

    const reqId = ++suggestReqId;
    try{
      const results = await searchStations(q);
      if (reqId !== suggestReqId) return; // stale
      if (!results.length){ hideSuggest(); return; }
      window._lastSuggestList = results;
      renderSuggest(results, q);
    } catch { hideSuggest(); }
  }, 220);

  // INDIA-ONLY filter for dropdown
  async function searchStations(q){
    const url = `https://api.waqi.info/search/?token=${AQICN_TOKEN}&keyword=${encodeURIComponent(q)}`;
    const resp = await fetch(url, { cache: 'no-store' });
    const json = await resp.json();
    if (json.status !== 'ok') return [];

    const seen = new Set();
    const items = (json.data || []).map(it => {
      const name = it?.station?.name || it?.station || it?.city || '';
      const aqi = safeNum(it?.aqi);
      const uid = it?.uid ?? it?.station?.idx ?? it?.idx;
      const countryRaw = it?.station?.country ?? it?.country ?? '';
      const country = typeof countryRaw === 'string' ? countryRaw.toLowerCase() : '';
      const g = it?.station?.geo || it?.geo || [];
      const lat = Number(g?.[0]);
      const lng = Number(g?.[1]);
      return { name, aqi, uid, country, lat, lng };
    }).filter(x => {
      if (!x.name || !(x.uid || x.uid === 0)) return false;
      const nameLC = x.name.toLowerCase();
      const isIndiaByCountry = x.country.includes('india');
      const isIndiaByName =
        nameLC.includes(', india') ||
        nameLC.endsWith(', in') ||
        /\bindia\b/.test(nameLC);
      return isIndiaByCountry || isIndiaByName;
    });

    const dedup = [];
    for (const x of items){
      if (seen.has(x.uid)) continue;
      seen.add(x.uid);
      dedup.push(x);
    }
    const qlc = q.toLowerCase();
    dedup.sort((a,b) => {
      const an=a.name.toLowerCase(), bn=b.name.toLowerCase();
      const asw = an.startsWith(qlc), bsw = bn.startsWith(qlc);
      if (asw !== bsw) return bsw - asw;
      const ain = an.includes(qlc), bin = bn.includes(qlc);
      if (ain !== bin) return bin - ain;
      const av = Number.isFinite(a.aqi) ? a.aqi : 9999;
      const bv = Number.isFinite(b.aqi) ? b.aqi : 9999;
      return av - bv;
    });
    return dedup;
  }

  // renderSuggest — names only + bounds + cap
  function renderSuggest(list, query){
    if (!suggestionWrap) return;
    suggestionWrap.innerHTML = '';

    let out = Array.isArray(list) ? list.slice() : [];

    if (USE_BOUNDS_FOR_SUGGEST) {
      const b = getCurrentBounds();
      out = out.filter(it => Number.isFinite(it.lat) && Number.isFinite(it.lng) && pointInBounds(it.lat, it.lng, b));
    }

    out = out.slice(0, Number.isFinite(MAX_SUGGESTIONS) ? MAX_SUGGESTIONS : out.length);

    if (!out.length) { suggestionWrap.classList.remove('is-open'); return; }

    out.forEach(item => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'aqi-suggest__row';
      row.innerHTML = `<span class="aqi-suggest__name">${highlight(item.name, query)}</span>`;
      row.addEventListener('click', () => {
        cityInput.value = item.name;
        selectedUid = item.uid;
        hideSuggest();
        getAqi();
      });
      suggestionWrap.appendChild(row);
    });
    suggestionWrap.classList.add('is-open');
  }
  function hideSuggest(){
    if (!suggestionWrap) return;
    suggestionWrap.classList.remove('is-open');
    suggestionWrap.innerHTML = '';
  }
  function highlight(text, q){
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return `${text.slice(0,i)}<strong>${text.slice(i, i+q.length)}</strong>${text.slice(i+q.length)}`;
  }
  function debounce(fn, ms){
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // --- Toast (for city-not-in-list & general notices) ---
  let aqiToastTimer = null;
  function getToastHost(){
    let host = document.getElementById('aqi-toast-host');
    if (!host){
      host = document.createElement('div');
      host.id = 'aqi-toast-host';
      host.className = 'aqi-toast-host';
      document.body.prepend(host);
    }
    return host;
  }
  function showToast(html, timeout = 4000){
    const host = getToastHost();
    const el = document.createElement('div');
    el.className = 'aqi-toast';
    el.innerHTML = html;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    clearTimeout(aqiToastTimer);
    aqiToastTimer = setTimeout(() => {
      el.classList.remove('is-visible');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, timeout);
  }

  // ------- Init -------
  document.addEventListener('DOMContentLoaded', () => {
    primeRing();

    if (searchBtn) searchBtn.addEventListener('click', () => getAqi());
    if (cityInput) cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') getAqi(); });
    if (locateBtn) locateBtn.addEventListener('click', onLocateMe);

    initTypeahead();
    injectLocateIcon();
    ensureCaption();
    ensureDefaultBG();
    setEmpty('Enter a city to see the AQI.');

    setBox2MobileHidden(true);
    primeLaneStyles();
    buildLaneParticles();
    positionLaneAboveTitle();
    retargetLaneParticles();

    window.addEventListener('resize', () => {
      setBox2MobileHidden(!hasSearchedYet);
      positionLaneAboveTitle();
      retargetLaneParticles();
      dockBottom(box3GoodWrap); dockBottom(box3ModerateWrap); dockBottom(box3USGWrap);
      dockBottom(box3UnhealthyWrap); dockBottom(box3VeryWrap); dockBottom(box3HazardWrap);
    });

    setTimeout(() => { positionLaneAboveTitle(); retargetLaneParticles(); }, 60);
  });

  // ------- Live city search (nearest-station logic removed) -------
  window.getAqi = async () => {
    const typed = (cityInput?.value || '').trim();
    if (!typed) { bumpInput(cityInput); return; }

    hasSearchedYet = true;
    setBox2MobileHidden(false);
    setLoading('Fetching latest air data…');
    hideSuggest();

    // Pre-check: if typed city has no CPCB/AQICN station in India, show a toast (no station available)
    try {
      const precheckList = await searchStations(typed);
      const qlc = typed.toLowerCase();
      const typedInList = precheckList.some(it => it.name.toLowerCase().includes(qlc));
      if (!typedInList) {
        showToast(`No CPCB station available in <strong>${properCase(typed)}</strong>.`, 5000);
      }
    } catch { /* ignore pre-check errors */ }

    try {
      const payload = selectedUid ? await fetchAQICNByUid(selectedUid)
                                  : await fetchAQICNByCity(typed);
      const stationName = payload?.data?.city?.name || '';
      const stationUid  = payload?.data?.idx ?? null;

      handleAqiPayload(payload, {
        typedQuery: typed,
        stationName,
        stationUid
      });
    } catch (err) {
      console.warn('[AQI city/uid fetch failed, fallback to demo]', err);
      setLoading('Live source unavailable — showing demo…');
      setTimeout(() =>
        handleAqiPayload(
          makeDemoPayload(typed, { labelOverride: properCase(typed) }),
          { typedQuery: typed, stationName: properCase(typed), stationUid: null }
        ), 300);
    } finally {
      selectedUid = null;
    }
  };

  // ------- Ring -------
  function primeRing(){
    if (!ringProg) return;
    try {
      CIRC = ringProg.getTotalLength();
      ringProg.style.strokeDasharray = `${CIRC}`;
      ringProg.style.strokeDashoffset = `${CIRC}`;
    } catch {}
  }

  // ------- Locate Me (geo -> live) -------
  function onLocateMe(){
    hasSearchedYet = true;
    setBox2MobileHidden(false);
    setLoading('Getting location & fetching air data…');

    const noData = (msg = 'No station/data found for your location. Try searching a nearby city.') => {
      showToast(msg, 5000);
      setEmpty('No station/data found for your location. Try searching by city.');
    };

    if (!navigator.geolocation){
      console.warn('Geolocation unsupported');
      noData();
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords || {};
        const payload = await fetchAQICNByGeo(latitude, longitude);
        const stationName = payload?.data?.city?.name || '';
        handleAqiPayload(payload, { typedQuery:'', stationName, stationUid: payload?.data?.idx ?? null });
      } catch (err) {
        console.warn('[AQI geo fetch failed]', err);
        noData();
      }
    }, (err) => {
      console.warn('Geolocation error', err);
      noData();
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  }

  // ------- Demo loader (kept) -------
  function makeDemoPayload(city, opts={}){
    const base = DEMO_DATA[properCase(city)];
    let aqi, pm25, pm10, label;
    if (base){
      aqi  = clamp(base.aqi + rnd(-6, 8), 5, 400);
      pm25 = clamp(base.pm25 + rnd(-4, 6), 2, 250);
      pm10 = clamp(base.pm10 + rnd(-8,10), 5, 400);
      label = opts.labelOverride || properCase(city);
    } else {
      aqi = clamp(rnd(20, 240), 5, 400);
      pm25 = clamp(Math.round(aqi * (0.38 + Math.random() * 0.16)), 3, 250);
      pm10 = clamp(Math.round(aqi * (0.60 + Math.random() * 0.20)), 5, 400);
      label = opts.labelOverride || properCase(city || 'Unknown city');
    }
    return { status:'ok', data:{ aqi, iaqi:{ pm25:{ v: pm25 }, pm10:{ v: pm10 } }, city:{ name: label }, idx: null } };
  }

  // ------- WHO helper -------
  function whoFactor(value, kind='pm25'){
    const limit = WHO_24H[kind];
    if (!Number.isFinite(value) || !limit) return { factor:NaN, label:'—', stateClass:'is-na' };
    const f = value / limit;
    const rounded = f >= 10 ? Math.round(f) : Math.round(f*10)/10;
    const label = `${rounded}× WHO`;
    const stateClass = f <= 1 ? 'is-healthy' : f <= 2 ? 'is-elevated' : f <= 3 ? 'is-high' : f <= 6 ? 'is-very-high' : 'is-severe';
    return { factor:f, label, stateClass };
  }

  // ------- Render / State -------
  function handleAqiPayload(json, meta = { typedQuery:'', stationName:'', stationUid:null }){
    const d = json?.data || {};
    const aqi  = Number(d.aqi ?? NaN);
    const pm25 = safeNum(d?.iaqi?.pm25?.v);
    const pm10 = safeNum(d?.iaqi?.pm10?.v);
    const stationLabel = meta.stationName || d?.city?.name || '';

    setPM(pm25El, pm25, 'pm25');
    setPM(pm10El, pm10, 'pm10');

    if (pm25UnitEl) pm25UnitEl.textContent = 'µg/m³';
    if (pm10UnitEl) pm10UnitEl.textContent = 'µg/m³';

    setAqi(aqi, stationLabel);

    showResult();
    setBox2MobileHidden(false);
  }

  function setPM(valueEl, value, kind){
    if (!valueEl) return;
    const tile = valueEl.closest('.pm-tile');
    if (Number.isFinite(value)){ valueEl.textContent = String(value); tile?.classList.remove('is-na'); }
    else { valueEl.textContent = '—'; tile?.classList.add('is-na'); }

    if (tile){
      let badge = tile.querySelector('.pm-xwho');
      if (!badge){ badge = document.createElement('div'); badge.className = 'pm-xwho'; (valueEl.parentElement || tile).appendChild(badge); }
      const meta = whoFactor(value, kind);
      badge.textContent = meta.label;
      tile.classList.remove('is-healthy','is-elevated','is-high','is-very-high','is-severe');
      tile.classList.add(meta.stateClass);
    }
  }

  function setAqi(aqi, cityLabel=''){
    if (scoreNum) scoreNum.textContent = Number.isFinite(aqi) ? String(aqi) : '—';
    if (scoreLbl) scoreLbl.textContent = 'AQI';
    if (statusTxt) statusTxt.textContent = buildStatusText(aqi, cityLabel);

    if (ringProg && CIRC){
      const norm = Number.isFinite(aqi) ? clamp(aqi, 0, MAX_AQI) / MAX_AQI : 0;
      ringProg.style.strokeDashoffset = `${CIRC * (1 - norm)}`;
    }
    setAqiCategory(box2, aqi);
    updateBox3Lottie(aqi);
  }

  function buildStatusText(aqi, city){
    const category = !Number.isFinite(aqi) ? '' :
      aqi <= 50 ? 'Good / Healthy' :
      aqi <= 100 ? 'Moderate' :
      aqi <= 150 ? 'Unhealthy for Sensitive Groups' :
      aqi <= 200 ? 'Unhealthy for All' :
      aqi <= 300 ? 'Very Unhealthy' : 'Hazardous / Emergency';
    return [city, category].filter(Boolean).join(' • ') || '—';
  }

  function setAqiCategory(el, aqi){
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

  // ------- Box 3 wrappers / caption -------
  function ensureCaption(){
    if (!box3) return null;
    if (box3Caption && box3.contains(box3Caption)) return box3Caption;
    const el = document.createElement('div');
    el.className = 'box3-caption';
    el.setAttribute('aria-live', 'polite');
    el.style.display = 'none';
    box3.appendChild(el);
    box3Caption = el; return el;
  }
  function ensureDefaultBG(){
    if (!box3) return;
    if (!box3DefaultBG){
      const wrap = document.createElement('div'); wrap.className = 'default-bg-wrap';
      const layer = document.createElement('div'); layer.className = 'default-bg';
      wrap.appendChild(layer); box3.appendChild(wrap); box3DefaultBG = wrap;
    } else { box3DefaultBG.hidden = false; box3DefaultBG.style.display = 'block'; }
  }
  function ensureWrap(refName, cls, title, src){
    if (!box3) return null;
    if (refName && box3[refName] && box3.contains(box3[refName])) return box3[refName];
    const w = document.createElement('div'); w.className = cls; w.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'lottie-iframe'; iframe.title = title; iframe.loading = 'lazy'; iframe.allow = 'autoplay'; iframe.src = src;
    w.appendChild(iframe); box3.appendChild(w); dockBottom(w);
    return w;
  }
  const ensureGoodWrap      = () => (box3GoodWrap ||= ensureWrap('box3GoodWrap','lottie-good-wrap','Good AQI Animation','https://lottie.host/embed/69ef2c59-c01e-4ea8-8d91-e030c1bd3d2c/ytXU6mo7xS.json'));
  const ensureModerateWrap  = () => (box3ModerateWrap ||= ensureWrap('box3ModerateWrap','lottie-moderate-wrap','Moderate AQI Animation','https://lottie.host/embed/3ec86fb8-fdf7-4854-9241-c31d76ae1a1f/IXy5zPtHUX.json'));
  const ensureUSGWrap       = () => (box3USGWrap ||= ensureWrap('box3USGWrap','lottie-usg-wrap','USG AQI Animation','https://lottie.host/embed/95f452fa-4d17-444a-a820-140e7a8e6da9/DucssUgjEL.json'));
  const ensureUnhealthyWrap = () => (box3UnhealthyWrap ||= ensureWrap('box3UnhealthyWrap','lottie-unhealthy-wrap','Unhealthy AQI Animation','https://lottie.host/embed/2cd2f30c-5fd0-49f2-91c8-8d1c7f92cfd2/dndklH6ELw.json'));
  const ensureVeryWrap      = () => (box3VeryWrap ||= ensureWrap('box3VeryWrap','lottie-very-wrap','Very Unhealthy AQI Animation','https://lottie.host/embed/ac2c9c48-23c7-454a-9988-f0f8d2db2862/uWZW7ant0U.json'));
  const ensureHazardWrap    = () => (box3HazardWrap ||= ensureWrap('box3HazardWrap','lottie-hazard-wrap','Hazardous AQI Animation','https://lottie.host/embed/66a2944f-193d-46a3-aefc-bba1562ecf57/SCjkY1P63j.json'));

  function updateBox3Lottie(aqi){
    if (!box3) return;
    const isGood     = Number.isFinite(aqi) && aqi <= 50;
    const isModerate = Number.isFinite(aqi) && aqi > 50 && aqi <= 100;
    const isUSG      = Number.isFinite(aqi) && aqi > 100 && aqi <= 150;
    const isUnh      = Number.isFinite(aqi) && aqi > 150 && aqi <= 200;
    const isVery     = Number.isFinite(aqi) && aqi > 200 && aqi <= 300;
    const isHaz      = Number.isFinite(aqi) && aqi > 300 && aqi <= 500;

    ensureDefaultBG();
    const useDefault = !(isGood || isModerate || isUSG || isUnh || isVery || isHaz);
    if (box3DefaultBG) box3DefaultBG.hidden = !useDefault;
    if (box3DefaultFG) box3DefaultFG.hidden = !useDefault;

    if (useDefault) box3.classList.add('is-default'); else box3.classList.remove('is-default');

    const good = ensureGoodWrap(), mod = ensureModerateWrap(), usg = ensureUSGWrap(), unh = ensureUnhealthyWrap(), very = ensureVeryWrap(), haz = ensureHazardWrap();
    if (good) good.hidden = !isGood; if (mod) mod.hidden = !isModerate; if (usg) usg.hidden = !isUSG; if (unh) unh.hidden = !isUnh; if (very) very.hidden = !isVery; if (haz) haz.hidden = !isHaz;

    if (!box3Caption) ensureCaption();
    if (box3Caption){
      if (useDefault){ box3Caption.style.display = 'none'; box3Caption.textContent = ''; }
      else{
        box3Caption.textContent = isGood ? CAPTIONS.good : isModerate ? CAPTIONS.moderate : isUSG ? CAPTIONS.usg : isUnh ? CAPTIONS.unhealthy : isVery ? CAPTIONS.very : CAPTIONS.hazard;
        box3Caption.style.display = 'block';
      }
    }

    box3.classList.remove('state-good','state-moderate','state-usg','state-unhealthy','state-very','state-hazard');
    if (!useDefault){
      box3.classList.add(isGood ? 'state-good' : isModerate ? 'state-moderate' : isUSG ? 'state-usg' : isUnh ? 'state-unhealthy' : isVery ? 'state-very' : 'is-hazard');
    }
  }

  function resetBox3ToDefault(){
    if (!box3) return;
    ensureDefaultBG();
    if (box3DefaultBG) { box3DefaultBG.hidden = false; box3DefaultBG.style.display = 'block'; }
    if (box3DefaultFG) box3DefaultFG.hidden = false;
    if (box3GoodWrap) box3GoodWrap.hidden = true;
    if (box3ModerateWrap) box3ModerateWrap.hidden = true;
    if (box3USGWrap) box3USGWrap.hidden = true;
    if (box3UnhealthyWrap) box3UnhealthyWrap.hidden = true;
    if (box3VeryWrap) box3VeryWrap.hidden = true;
    if (box3HazardWrap) box3HazardWrap.hidden = true;
    if (box3Caption) { box3Caption.style.display = 'none'; box3Caption.textContent = ''; }
    box3.classList.remove('state-good','state-moderate','state-usg','state-unhealthy','state-very','state-hazard');
    box3.classList.add('is-default');
  }

  // ------- UI state helpers -------
  function setLoading(msg='Fetching…'){
    if (emptyState) emptyState.style.display = 'none';
    if (resultState) resultState.style.display = 'none';
    if (loadingState){ loadingState.style.display = ''; const p = qs('.loading-copy', loadingState); if (p) p.textContent = msg; }
    resetBox3ToDefault(); setBox2MobileHidden(false);
  }
  function setEmpty(msg='Enter a city to see the AQI.'){
    if (loadingState) loadingState.style.display = 'none';
    if (resultState) resultState.style.display = 'none';
    if (emptyState){ emptyState.style.display = ''; const p = qs('.empty-hint', emptyState); if (p) p.textContent = msg; }
    resetBox3ToDefault(); hasSearchedYet = false; setBox2MobileHidden(true);
  }
  function showResult(){
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (resultState) resultState.style.display = '';
  }

  // ------- Mobile toggle for Box 2 -------
  function setBox2MobileHidden(hidden){
    if (!box2) return;
    if (isMobile()) box2.setAttribute('data-mobile-hidden', hidden ? 'true' : 'false');
    else box2.removeAttribute('data-mobile-hidden');
  }

  // ------- Small UI helpers -------
  function bumpInput(inputEl){ if(!inputEl) return; inputEl.focus(); inputEl.classList.add('input-bump'); setTimeout(()=>{ inputEl.classList.remove('input-bump'); }, 700); }

  // ------- Box 1 lane ------
  function primeLaneStyles(){
    if (!laneBox) return;
    laneBox.style.position = 'absolute';
    laneBox.style.left = '50%';
    laneBox.style.transform = 'translateX(-50%)';
    laneBox.style.width = 'min(92%, 320px)';
    laneBox.style.zIndex = '1';
    if (laneDots) laneDots.style.pointerEvents = 'none';
  }
  function buildLaneParticles(count = 26){
    if (!laneBox || !laneDots) return;
    const laneH = laneBox.clientHeight || 78;
    const centerX = Math.round((laneBox.clientWidth || 280) / 2);
    laneDots.innerHTML = '';
    for (let i = 0; i < count; i++){
      const dot = document.createElement('span');
      dot.className = 'p';
      const size = 3 + Math.random() * 5;
      const top  = Math.max(2, Math.random() * (laneH - size - 2));
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.top = `${top}px`;
      const spawnAbs = 16 + Math.random() * 24;
      dot.style.setProperty('--spawn', `${-spawnAbs}px`);
      dot.style.setProperty('--toX', `${centerX + spawnAbs}px`);
      const dur = prefersReduced ? 6 : (2.2 + Math.random() * 1.6);
      const delay = Math.random() * (prefersReduced ? 1 : 2.2);
      dot.style.setProperty('--dur', `${dur}s`);
      dot.style.setProperty('--delay', `${delay}s`);
      laneDots.appendChild(dot);
    }
  }
  function positionLaneAboveTitle(){
    if (!box1 || !laneBox || !titleH1) return;
    const gap = isMobile() ? 16 : 24;
    const h1Top = titleH1.offsetTop;
    const laneH = laneBox.offsetHeight || 78;
    let top = h1Top - gap - laneH;
    top = Math.max(12, top);
    laneBox.style.top = `${top}px`;
    box1.style.setProperty('--lane-spacer', `${laneH + gap}px`);
  }
  function retargetLaneParticles(){
    if (!laneBox || !laneDots) return;
    const centerX = Math.round((laneBox.clientWidth || 280) / 2);
    laneDots.querySelectorAll('.p').forEach(p => {
      const style = getComputedStyle(p);
      const spawn = parseFloat(style.getPropertyValue('--spawn')) || -24;
      const spawnAbs = Math.abs(spawn);
      p.style.setProperty('--toX', `${centerX + spawnAbs}px`);
    });
  }
  function injectLocateIcon(){
    if (!locateBtn) return;
    if (locateBtn.querySelector('.locate-icon')) return;
    const span = document.createElement('span');
    span.className = 'locate-icon';
    span.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M12 2v2m0 16v2M4 12H2m20 0h-2M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 6a6 6 0 1 1 0 12a6 6 0 0 1 0-12Z" stroke-width="1.25" opacity=".4"/>
      </svg>`;
    locateBtn.prepend(span);
  }
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
