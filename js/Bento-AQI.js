/* =========================
   Bento AQI — JS (single box) + WAQI Station Typeahead
   — dropdown works, image stays still, smooth result transitions
   — ring + number animate together from 0 to target
   — MOBILE: no placeholders/loading; section expands only when result appears,
             and auto-scrolls into view to show full result
   ========================= */
(() => {
  const MAX_AQI = 500;
  const WHO_24H = { pm25: 15, pm10: 45 };
  const AQICN_TOKEN = (window.AQICN_TOKEN || 'd51edd8bd0f9f59e1ba1cf2df56eacc3377bd23d');
  const HOOK_REFRESH_MS = 6 * 60 * 60 * 1000; // 4x per day
  const INDIA_BOUNDS = { minLat: 6.5, minLon: 68.1, maxLat: 35.7, maxLon: 97.4 };
  const IN_COUNTRY = new Set(['india', 'in']);

  const qs  = (s, r=document) => r.querySelector(s);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const rnd = (a,b) => Math.round(a + Math.random()*(b-a));
  const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : NaN; };
  const properCase = (s) => !s ? s : s.toLowerCase().split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

  const isMobile = () => window.matchMedia('(max-width: 980px)').matches;

  // inputs/actions
  const cityInput = qs('#cityInput');
  const searchBtn = qs('.search-btn');
  const locateBtn = qs('#locateBtn');

  // ensure dropdown exists even if not in HTML
  let dropdown = qs('#typeahead');
  const wrap = cityInput?.closest('.search-input');
  if (!dropdown && wrap){
    dropdown = document.createElement('div');
    dropdown.id = 'typeahead';
    dropdown.className = 'typeahead';
    dropdown.setAttribute('role','listbox');
    dropdown.setAttribute('aria-label','Stations');
    wrap.style.position = wrap.style.position || 'relative';
    wrap.appendChild(dropdown);
  }
  if (cityInput) cityInput.autocomplete = 'off';

  // states
  const emptyState   = qs('.aqi-empty');
  const loadingState = qs('.aqi-loading');
  const resultState  = qs('.aqi-result');

  // values
  const pm25El = qs('[data-js="pm25-value"]');
  const pm10El = qs('[data-js="pm10-value"]');
  const pm25UnitEl = qs('[data-js="pm25-unit"]');
  const pm10UnitEl = qs('[data-js="pm10-unit"]');

  // ring + score
  const scoreNum = qs('.aqi-meter__num');
  const statusTxt= qs('.aqi-meter__pill');
  const cityTxt = qs('.aqi-meter__city');
  const needleEl = qs('.aqi-meter__needle');
  const hookTexts = [...document.querySelectorAll('.aqi-hook__text')];
  const hookWraps = [...document.querySelectorAll('.aqi-hook')];
  const visualBox = qs('.aqi-visual-box');

  const container = qs('#bento-aqi');

  // demo data (fallback)
  const DEMO = {
    'Mumbai':{ aqi:132, pm25:68, pm10:104 }, 'Delhi':{ aqi:242, pm25:142, pm10:210 },
    'Ahmedabad':{ aqi:176, pm25:95, pm10:160 }, 'Bengaluru':{ aqi:88, pm25:36, pm10:70 },
    'Chennai':{ aqi:72, pm25:28, pm10:64 }, 'Hyderabad':{ aqi:110, pm25:52, pm10:98 },
    'Pune':{ aqi:92, pm25:40, pm10:80 }, 'Kolkata':{ aqi:158, pm25:82, pm10:140 }
  };
  const HOOK_FALLBACKS = [
    { city: 'Kanpur', aqi: 240, pm25: 120 },
    { city: 'Delhi', aqi: 210, pm25: 110 },
    { city: 'Patna', aqi: 190, pm25: 95 },
    { city: 'Lucknow', aqi: 180, pm25: 90 },
    { city: 'Ghaziabad', aqi: 200, pm25: 105 }
  ];

  function normalizeCountry(c){
    return String(c || '').trim().toLowerCase();
  }
  function formatCountry(c){
    const n = normalizeCountry(c);
    if (!n) return '';
    if (IN_COUNTRY.has(n)) return 'India';
    return c;
  }
  function isIndianStation(it){
    if (!it) return false;
    const c = normalizeCountry(it.country);
    if (IN_COUNTRY.has(c)) return true;
    if (Array.isArray(it.geo) && it.geo.length === 2){
      const [lat, lon] = it.geo.map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lon)){
        if (lat >= INDIA_BOUNDS.minLat && lat <= INDIA_BOUNDS.maxLat &&
            lon >= INDIA_BOUNDS.minLon && lon <= INDIA_BOUNDS.maxLon){
          return true;
        }
      }
    }
    const name = String(it.name || '');
    return /(?:^|,|\s)\s*india\b/i.test(name) || /\bIndia\b/i.test(name);
  }
  function isIndianCityName(name){
    const n = String(name || '');
    if (!n) return false;
    if (/\bIndia\b/i.test(n)) return true;
    const base = cleanCityName(n).toLowerCase();
    return Object.prototype.hasOwnProperty.call(DEMO, properCase(base)) ||
      HOOK_FALLBACKS.some(x => x.city.toLowerCase() === base);
  }
  function cleanCityName(name){
    return String(name || '')
      .replace(/\s*\(.*?\)\s*/g, ' ')
      .replace(/\s*[,|-]\s*india\b/ig, '')
      .replace(/\s+india\b/ig, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  function cigarettesFromPM25(pm25){
    if (!Number.isFinite(pm25)) return NaN;
    const per = pm25 / 22; // ~22 µg/m3 PM2.5 per cigarette/day
    if (per < 0.5) return 0;
    return Math.max(1, Math.round(per));
  }

  /* ---------- WAQI helpers ---------- */
  async function fetchByCity(city){
    const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${AQICN_TOKEN}`;
    const r = await fetch(url, { cache:'no-store' }); const j = await r.json();
    if (j.status !== 'ok') throw new Error(j.data || 'AQICN city fetch failed');
    return mapCity(j);
  }
  async function fetchByGeo(lat, lon){
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_TOKEN}`;
    const r = await fetch(url, { cache:'no-store' }); const j = await r.json();
    if (j.status !== 'ok') throw new Error(j.data || 'AQICN geo fetch failed');
    return mapCity(j);
  }
  async function fetchByUid(uid){
    const url = `https://api.waqi.info/feed/@${uid}/?token=${AQICN_TOKEN}`;
    const r = await fetch(url, { cache:'no-store' }); const j = await r.json();
    if (j.status !== 'ok') throw new Error(j.data || 'AQICN uid fetch failed');
    const d = j.data || {};
    return {
      aqi: num(d.aqi),
      pm25: num(d?.iaqi?.pm25?.v),
      pm10: num(d?.iaqi?.pm10?.v),
      city: d?.city?.name || '',
      geo: Array.isArray(d?.city?.geo) ? d.city.geo : null
    };
  }
  function mapCity(json){
    const d = json?.data || {};
    return { aqi:num(d.aqi), pm25:num(d?.iaqi?.pm25?.v), pm10:num(d?.iaqi?.pm10?.v), city: d?.city?.name || '', geo: d?.city?.geo||null };
  }
  function num(v){ const n=Number(v); return Number.isFinite(n)?Math.round(n):NaN; }

  /* ---------- Typeahead (WAQI /search) ---------- */
  let taAbort;
  let taActiveIndex = -1;
  let taItems = [];

  function debounce(fn, ms=220){
    let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
  }

  async function searchStations(q, onlyIndia=false){
    if (taAbort) taAbort.abort();
    taAbort = new AbortController();
    const url = `https://api.waqi.info/search/?token=${AQICN_TOKEN}&keyword=${encodeURIComponent(q)}`;
    const r = await fetch(url, { signal: taAbort.signal, cache:'no-store' });
    const j = await r.json();
    if (j.status !== 'ok') return [];
    const rows = Array.isArray(j.data) ? j.data : [];
    const list = rows.map(x => ({
      uid: x.uid,
      aqi: safeNum(x.aqi),
      name: x.station?.name || '',
      country: x.station?.country || '',
      time: x.time || '',
      geo: Array.isArray(x.station?.geo) ? x.station.geo : null
    }));
    return onlyIndia ? list.filter(isIndianStation) : list;
  }

  const onType = debounce(async () => {
    const q = (cityInput?.value || '').trim();
    taActiveIndex = -1;
    if (!q || q.length < 2){ hideTA(); return; }

    const list = await searchStations(q, true);
    taItems = list;
    renderTA(list, q);
  }, 220);

  function renderTA(list, q){
    if (!dropdown) return;
    if (!list.length){ hideTA(); return; }

    dropdown.innerHTML = list.slice(0, 50).map((it, i) => {
      const nm = escapeHTML(it.name);
      const meta = [formatCountry(it.country) || 'India'].filter(Boolean).join(' · ');
      const aqiBadge = Number.isFinite(it.aqi) ? `<span class="typeahead__aqi">AQI ${it.aqi}</span>` : '';
      return `
        <div class="typeahead__item" role="option" data-idx="${i}" data-uid="${it.uid}" aria-selected="${i===taActiveIndex?'true':'false'}">
          <div class="typeahead__main">
            <div class="typeahead__name">${highlight(nm, q)}</div>
            <div class="typeahead__meta">${escapeHTML(meta)}</div>
          </div>
          ${aqiBadge}
        </div>
      `;
    }).join('');
    dropdown.style.display = 'block';
  }

  function hideTA(){ if (dropdown){ dropdown.style.display='none'; dropdown.innerHTML=''; } taItems=[]; taActiveIndex=-1; }

  // click select
  dropdown?.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.typeahead__item');
    if (!item) return;
    const idx = Number(item.dataset.idx);
    selectTA(idx);
  });

  // keyboard navigation
  cityInput?.addEventListener('keydown', (e) => {
    if (dropdown?.style.display !== 'block') return;
    const max = taItems.length - 1;
    if (e.key === 'ArrowDown'){ e.preventDefault(); taActiveIndex = Math.min(max, taActiveIndex+1); updateTAActive(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); taActiveIndex = Math.max(0, taActiveIndex-1); updateTAActive(); }
    else if (e.key === 'Enter'){ if (taActiveIndex>=0){ e.preventDefault(); selectTA(taActiveIndex); } }
    else if (e.key === 'Escape'){ hideTA(); }
  });

  function updateTAActive(){
    [...dropdown.querySelectorAll('.typeahead__item')].forEach((el,i)=>{
      el.setAttribute('aria-selected', i===taActiveIndex ? 'true' : 'false');
      if (i===taActiveIndex){
        const r = el.getBoundingClientRect();
        const dr= dropdown.getBoundingClientRect();
        if (r.top < dr.top) el.scrollIntoView({ block:'nearest' });
        if (r.bottom > dr.bottom) el.scrollIntoView({ block:'nearest' });
      }
    });
  }

  async function selectTA(index){
    const it = taItems[index];
    hideTA();
    if (!it) return;
    cityInput.value = it.name;
    setHookVisible(false);
    setLoading('Fetching station data…');
    try{
      const d = await fetchByUid(it.uid);
      render(d.aqi, d.pm25, d.pm10, d.city || it.name);
    } catch {
      setEmpty('Could not load that station. Try another.');
    }
  }

  // helpers for highlighting
  function escapeHTML(s){
    return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function highlight(text, q){
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i<0) return text;
    const j = i + q.length;
    return text.slice(0,i) + '<strong>' + text.slice(i,j) + '</strong>' + text.slice(j);
  }

  function pickBestIndiaMatch(list, q){
    if (!Array.isArray(list) || !list.length) return null;
    const ql = String(q || '').toLowerCase();
    let best = list[0];
    let bestScore = -1;
    for (const it of list){
      const name = String(it.name || '').toLowerCase();
      let score = 0;
      if (ql && name.startsWith(ql)) score += 6;
      if (ql && name.includes(ql)) score += 3;
      if (Number.isFinite(it.aqi)) score += Math.min(it.aqi, 500) / 100;
      if (score > bestScore){
        bestScore = score;
        best = it;
      }
    }
    return best;
  }

  /* ---------- Hook: High AQI in India ---------- */
  async function fetchIndiaTopStation(){
    const { minLat, minLon, maxLat, maxLon } = INDIA_BOUNDS;
    const url = `https://api.waqi.info/map/bounds/?latlng=${minLat},${minLon},${maxLat},${maxLon}&token=${AQICN_TOKEN}`;
    const r = await fetch(url, { cache:'no-store' });
    const j = await r.json();
    if (j.status !== 'ok') throw new Error(j.data || 'AQICN bounds fetch failed');
    const rows = Array.isArray(j.data) ? j.data : [];
    const top = rows
      .map(x => ({
        uid: x.uid,
        aqi: safeNum(x.aqi),
        name: x.station?.name || x.station || ''
      }))
      .filter(x => Number.isFinite(x.aqi))
      .sort((a,b) => b.aqi - a.aqi)[0];
    if (!top) return null;
    try{
      const d = await fetchByUid(top.uid);
      return { ...d, aqi: Number.isFinite(d.aqi) ? d.aqi : top.aqi, name: top.name };
    } catch {
      return { aqi: top.aqi, city: top.name };
    }
  }

  function setHookLoading(){
    hookTexts.forEach(el => { if (el) el.textContent = 'Loading latest India AQI...'; });
  }

  function renderHook(city, pm25, aqi){
    if (!hookTexts.length) return;
    const clean = cleanCityName(city) || 'this city';
    const cig = cigarettesFromPM25(pm25);
    if (Number.isFinite(cig) && cig > 0){
      hookTexts.forEach(el => { if (el) el.textContent = `People of ${clean} are smoking ~${cig} cigarettes a day`; });
      return;
    }
    if (Number.isFinite(aqi)){
      hookTexts.forEach(el => { if (el) el.textContent = `${clean} is at AQI ${aqi} right now`; });
      return;
    }
    hookTexts.forEach(el => { if (el) el.textContent = `Air in ${clean} is unhealthy today`; });
  }

  function rotateHookFallback(){
    const idx = Math.floor(Date.now() / HOOK_REFRESH_MS) % HOOK_FALLBACKS.length;
    const pick = HOOK_FALLBACKS[idx];
    renderHook(pick.city, pick.pm25, pick.aqi);
  }

  function setHookVisible(show){
    hookWraps.forEach(el => el.classList.toggle('is-hidden', !show));
    visualBox?.classList.toggle('hook-hidden', !show);
  }

  async function refreshHook(){
    if (!hookTexts.length) return;
    setHookLoading();
    try{
      const top = await fetchIndiaTopStation();
      if (!top) throw new Error('No top station');
      renderHook(top.city || top.name, top.pm25, top.aqi);
    } catch {
      rotateHookFallback();
    }
  }

  /* ---------- Wire up ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Desktop keeps empty state; Mobile shows nothing until results.
    if (isMobile()){
      [emptyState, loadingState, resultState].forEach(el => {
        if (!el) return;
        el.classList.remove('is-visible');
        el.style.display = 'none';
      });
    } else {
      [emptyState, loadingState, resultState].forEach(el => el && el.classList.remove('is-visible'));
      setEmpty('Enter a city to see the AQI.');
    }

    searchBtn?.addEventListener('click', getAqi);
    cityInput?.addEventListener('input', onType);
    cityInput?.addEventListener('focus', onType);
    cityInput?.addEventListener('blur', () => setTimeout(hideTA, 120));
    locateBtn?.addEventListener('click', onLocateMe);
    setHookVisible(true);
    refreshHook();
    setInterval(refreshHook, HOOK_REFRESH_MS);
  });

  // Search by typed city
  window.getAqi = async () => {
    const typed = (cityInput?.value || '').trim();
    if (!typed){ bump(cityInput); return; }
    setHookVisible(false);

    setLoading('Fetching latest air data…');
    resetAqiVisuals();
    try{
      let d = null;
      try{
        const list = await searchStations(typed, true);
        const best = pickBestIndiaMatch(list, typed);
        if (best?.uid) d = await fetchByUid(best.uid);
      } catch {}
      if (!d) d = await fetchByCity(typed);
      if (!isIndianCityName(d.city || typed)){
        setEmpty('Only Indian cities are available right now.');
        return;
      }
      render(d.aqi, d.pm25, d.pm10, d.city || properCase(typed));
    } catch (e){
      console.warn('[AQI fetch failed, demo]', e);
      if (!isMobile()) setLoading('Live source unavailable — showing demo…');
      const demo = DEMO[properCase(typed)];
      const aqi  = demo ? clamp(demo.aqi + rnd(-6,8), 5, 400) : clamp(rnd(20,240), 5, 400);
      const pm25 = demo ? clamp(demo.pm25 + rnd(-4,6), 2, 250) : clamp(Math.round(aqi*(0.38+Math.random()*0.16)),3,250);
      const pm10 = demo ? clamp(demo.pm10 + rnd(-8,10),5,400) : clamp(Math.round(aqi*(0.60+Math.random()*0.20)),5,400);
      setTimeout(()=>render(aqi, pm25, pm10, properCase(typed)), 300);
    }
  };

  function onLocateMe(){
    setHookVisible(false);
    setLoading('Getting location & fetching air data…');
    resetAqiVisuals();
    if (!navigator.geolocation){ setEmpty('Location unavailable. Try searching a city.'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        const d = await fetchByGeo(latitude, longitude);
        if (!isIndianCityName(d.city)){
          setEmpty('Only Indian cities are available right now.');
          return;
        }
        render(d.aqi, d.pm25, d.pm10, d.city);
      } catch { setEmpty('No station/data found for your location. Try a nearby city.'); }
    }, ()=> setEmpty('Location permission denied. Try searching a city.'), { enableHighAccuracy:true, timeout:8000, maximumAge:0 });
  }

  /* ---------- Render ---------- */
  function resetAqiVisuals(){
    if (scoreNum) scoreNum.textContent = '—';
    if (statusTxt) statusTxt.textContent = '—';
    if (cityTxt) cityTxt.textContent = '—';
    if (needleEl) needleEl.setAttribute('transform', 'rotate(180 100 100)');
  }

  function render(aqi, pm25, pm10, label){
    // PM tiles (no animation requested)
    setPM(pm25El, pm25, 'pm25'); pm25UnitEl && (pm25UnitEl.textContent='µg/m³');
    setPM(pm10El, pm10, 'pm10'); pm10UnitEl && (pm10UnitEl.textContent='µg/m³');

    // Labels
    statusTxt && (statusTxt.textContent = categoryText(aqi));
    cityTxt && (cityTxt.textContent = label || 'Your City');
    setCategory(container, aqi);

    // Show result
    showResult();

    if (scoreNum) {
      scoreNum.textContent = Number.isFinite(aqi) ? String(clamp(aqi, 0, MAX_AQI)) : '—';
    }

    if (needleEl && Number.isFinite(aqi)){
      const pct = clamp(aqi, 0, MAX_AQI) / MAX_AQI;
      const angle = 180 - (180 * pct);
      needleEl.setAttribute('transform', `rotate(${angle} 100 100)`);
    }
  }

  function setPM(el, v, kind){
    if (!el) return;
    const tile = el.closest('.pm-tile');
    if (Number.isFinite(v)){ el.textContent = String(v); tile?.classList.remove('is-na'); }
    else { el.textContent = '—'; tile?.classList.add('is-na'); }

    // ×WHO chip
    let chip = tile?.querySelector('.pm-xwho');
    if (!chip && tile){ chip = document.createElement('div'); chip.className='pm-xwho'; tile.appendChild(chip); }
    if (chip){
      const limit = WHO_24H[kind];
      if (!Number.isFinite(v) || !limit) chip.textContent = '—';
      else {
        const f = v/limit; const rounded = f>=10 ? Math.round(f) : Math.round(f*10)/10;
        chip.textContent = `${rounded}× WHO`;
      }
    }
  }

  function categoryText(aqi){
    if (!Number.isFinite(aqi)) return '—';
    if (aqi <= 25) return 'Good';
    if (aqi <= 50) return 'Acceptable';
    if (aqi <= 75) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 100) return 'Unhealthy';
    if (aqi <= 150) return 'Very Unhealthy';
    return 'Hazardous';
  }

  function statusText(aqi){
    const cat = categoryText(aqi);
    return cat === '—' ? 'No data' : `${cat.toUpperCase()}!`;
  }


  function setCategory(el, aqi){
    if (!el) return;
    el.classList.remove('is-good','is-moderate','is-usg','is-unhealthy','is-very','is-hazard');
    if (!Number.isFinite(aqi)) return;
    if (aqi<=25) el.classList.add('is-good');
    else if (aqi<=50) el.classList.add('is-moderate');
    else if (aqi<=75) el.classList.add('is-usg');
    else if (aqi<=100) el.classList.add('is-unhealthy');
    else if (aqi<=150) el.classList.add('is-very');
    else el.classList.add('is-hazard');
    const meter = qs('.aqi-meter');
    if (!meter) return;
    meter.classList.remove('aqi-meter--good','aqi-meter--acceptable','aqi-meter--usg','aqi-meter--unhealthy','aqi-meter--very','aqi-meter--hazard');
    if (aqi<=25) meter.classList.add('aqi-meter--good');
    else if (aqi<=50) meter.classList.add('aqi-meter--acceptable');
    else if (aqi<=75) meter.classList.add('aqi-meter--usg');
    else if (aqi<=100) meter.classList.add('aqi-meter--unhealthy');
    else if (aqi<=150) meter.classList.add('aqi-meter--very');
    else meter.classList.add('aqi-meter--hazard');
  }

  /* ---------- Smooth state helpers ---------- */
  function setEmpty(msg=''){
    if (isMobile()) return; // mobile: never show placeholders
    if (qs('.empty-hint')) qs('.empty-hint').textContent = msg || 'Enter a city to see the AQI.';
    showOnly(emptyState);
  }
  function setLoading(msg=''){
    if (isMobile()) return; // mobile: skip loading state entirely
    if (qs('.loading-copy')) qs('.loading-copy').innerHTML = msg || 'Fetching latest air data…';
    showOnly(loadingState);
  }
  function showResult(){
    showOnly(resultState);
  }

  // MOBILE: reveal only result, expand section, and scroll into view
  function showOnly(target){
    if (isMobile()){
      if (target === resultState){
        resultState.style.display = '';
        resultState.classList.add('is-visible');

        // Remove any container limits to allow full expansion
        const unlock = (el) => { if(!el) return; el.style.height='auto'; el.style.maxHeight='none'; el.style.overflow='visible'; };
        unlock(container);
        unlock(container?.querySelector('.bento-merged'));
        unlock(container?.querySelector('.left-inner'));
        unlock(container?.querySelector('.aqi-states'));

        // Scroll the section into view so the full result is visible
        setTimeout(() => {
          container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
      if (emptyState){ emptyState.classList.remove('is-visible'); emptyState.style.display='none'; }
      if (loadingState){ loadingState.classList.remove('is-visible'); loadingState.style.display='none'; }
      return;
    }

    // Desktop (original smooth fade system)
    [emptyState, loadingState, resultState].forEach(el=>{
      if (!el) return;
      if (el === target){
        el.style.display = '';
        requestAnimationFrame(()=> el.classList.add('is-visible'));
      } else {
        el.classList.remove('is-visible');
        setTimeout(()=>{ if(!el.classList.contains('is-visible')) el.style.display='none'; }, 240);
      }
    });
  }

  function bump(el){ if(!el) return; el.classList.add('input-bump'); setTimeout(()=>el.classList.remove('input-bump'),600); el.focus(); }
})();
