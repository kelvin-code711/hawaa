/* =========================
   Bento AQI — JS (single box) + WAQI Station Typeahead
   — dropdown works, image stays still, smooth result transitions
   — NEW: ring + number animate together from 0 to target
   ========================= */
(() => {
  const MAX_AQI = 500;
  const WHO_24H = { pm25: 15, pm10: 45 };
  const AQICN_TOKEN = (window.AQICN_TOKEN || 'd51edd8bd0f9f59e1ba1cf2df56eacc3377bd23d');

  const qs  = (s, r=document) => r.querySelector(s);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const rnd = (a,b) => Math.round(a + Math.random()*(b-a));
  const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : NaN; };
  const properCase = (s) => !s ? s : s.toLowerCase().split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

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
  const ringEl   = qs('.ring');
  const scoreNum = qs('.result-score .num');
  const scoreLbl = qs('.result-score .label');
  const statusTxt= qs('.result-status');

  const container = qs('#bento-aqi');

  // demo data (fallback)
  const DEMO = {
    'Mumbai':{ aqi:132, pm25:68, pm10:104 }, 'Delhi':{ aqi:242, pm25:142, pm10:210 },
    'Ahmedabad':{ aqi:176, pm25:95, pm10:160 }, 'Bengaluru':{ aqi:88, pm25:36, pm10:70 },
    'Chennai':{ aqi:72, pm25:28, pm10:64 }, 'Hyderabad':{ aqi:110, pm25:52, pm10:98 },
    'Pune':{ aqi:92, pm25:40, pm10:80 }, 'Kolkata':{ aqi:158, pm25:82, pm10:140 }
  };

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

  async function searchStations(q){
    if (taAbort) taAbort.abort();
    taAbort = new AbortController();
    const url = `https://api.waqi.info/search/?token=${AQICN_TOKEN}&keyword=${encodeURIComponent(q)}`;
    const r = await fetch(url, { signal: taAbort.signal, cache:'no-store' });
    const j = await r.json();
    if (j.status !== 'ok') return [];
    const rows = Array.isArray(j.data) ? j.data : [];
    return rows.map(x => ({
      uid: x.uid,
      aqi: safeNum(x.aqi),
      name: x.station?.name || '',
      country: x.station?.country || '',
      time: x.time || '',
      geo: Array.isArray(x.station?.geo) ? x.station.geo : null
    }));
  }

  const onType = debounce(async () => {
    const q = (cityInput?.value || '').trim();
    taActiveIndex = -1;
    if (!q || q.length < 2){ hideTA(); return; }

    const list = await searchStations(q);
    taItems = list;
    renderTA(list, q);
  }, 220);

  function renderTA(list, q){
    if (!dropdown) return;
    if (!list.length){ hideTA(); return; }

    dropdown.innerHTML = list.slice(0, 50).map((it, i) => {
      const nm = escapeHTML(it.name);
      const meta = [it.country].filter(Boolean).join(' · ');
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
    setLoading('Fetching station data…');
    try{
      const d = await fetchByUid(it.uid);
      render(d.aqi, d.pm25, d.pm10, d.city || it.name);
    } catch {
      setEmpty('Could not load that station. Try another.');
    }
  }

  // helpers for highlighting
  function escapeHTML(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function highlight(text, q){
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i<0) return text;
    const j = i + q.length;
    return text.slice(0,i) + '<strong>' + text.slice(i,j) + '</strong>' + text.slice(j);
  }

  /* ---------- Wire up ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    // prime smooth-state visibility
    [emptyState, loadingState, resultState].forEach(el => el && el.classList.remove('is-visible'));
    setEmpty('Enter a city to see the AQI.');

    searchBtn?.addEventListener('click', getAqi);
    cityInput?.addEventListener('input', onType);
    cityInput?.addEventListener('focus', onType);
    cityInput?.addEventListener('blur', () => setTimeout(hideTA, 120));
    locateBtn?.addEventListener('click', onLocateMe);
  });

  // Search by typed city — unchanged
  window.getAqi = async () => {
    const typed = (cityInput?.value || '').trim();
    if (!typed){ bump(cityInput); return; }

    setLoading('Fetching latest air data…');
    // Reset ring/number visually so animation always starts from 0
    resetAqiVisuals();
    try{
      const d = await fetchByCity(typed);
      render(d.aqi, d.pm25, d.pm10, d.city || properCase(typed));
    } catch (e){
      console.warn('[AQI fetch failed, demo]', e);
      setLoading('Live source unavailable — showing demo…');
      const demo = DEMO[properCase(typed)];
      const aqi  = demo ? clamp(demo.aqi + rnd(-6,8), 5, 400) : clamp(rnd(20,240), 5, 400);
      const pm25 = demo ? clamp(demo.pm25 + rnd(-4,6), 2, 250) : clamp(Math.round(aqi*(0.38+Math.random()*0.16)),3,250);
      const pm10 = demo ? clamp(demo.pm10 + rnd(-8,10),5,400) : clamp(Math.round(aqi*(0.60+Math.random()*0.20)),5,400);
      setTimeout(()=>render(aqi, pm25, pm10, properCase(typed)), 300);
    }
  };

  function onLocateMe(){
    setLoading('Getting location & fetching air data…');
    resetAqiVisuals();
    if (!navigator.geolocation){ setEmpty('Location unavailable. Try searching a city.'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        const d = await fetchByGeo(latitude, longitude);
        render(d.aqi, d.pm25, d.pm10, d.city);
      } catch { setEmpty('No station/data found for your location. Try a nearby city.'); }
    }, ()=> setEmpty('Location permission denied. Try searching a city.'), { enableHighAccuracy:true, timeout:8000, maximumAge:0 });
  }

  /* ---------- Render ---------- */
  let aqiAnimId = null; // requestAnimationFrame id for ring/number sync

  function resetAqiVisuals(){
    if (aqiAnimId) cancelAnimationFrame(aqiAnimId);
    if (ringEl) ringEl.style.setProperty('--pct', '0');
    if (scoreNum) scoreNum.textContent = '0';
  }

  function render(aqi, pm25, pm10, label){
    // PM tiles (no animation requested)
    setPM(pm25El, pm25, 'pm25'); pm25UnitEl && (pm25UnitEl.textContent='µg/m³');
    setPM(pm10El, pm10, 'pm10'); pm10UnitEl && (pm10UnitEl.textContent='µg/m³');

    // Labels (number value will animate separately)
    scoreLbl && (scoreLbl.textContent = 'AQI');
    statusTxt && (statusTxt.textContent = statusText(aqi, label));
    setCategory(container, aqi);

    // Show result canvas first (so animation is visible on it)
    showResult();

    // Animate ring + number together from 0 → target
    animateAQI(Number.isFinite(aqi) ? clamp(aqi, 0, MAX_AQI) : 0);
  }

  function animateAQI(target){
    if (!ringEl || !scoreNum){ return; }
    const duration = 900; // ms
    const start = performance.now();
    const endPct = Math.round((target / MAX_AQI) * 100);

    if (aqiAnimId) cancelAnimationFrame(aqiAnimId);

    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = ease(t);

      const currAqi = Math.round(target * e);
      const currPct = Math.round(endPct * e);

      ringEl.style.setProperty('--pct', String(currPct));
      scoreNum.textContent = String(currAqi);

      if (t < 1){
        aqiAnimId = requestAnimationFrame(tick);
      } else {
        aqiAnimId = null;
        // snap to exact target in case of rounding
        ringEl.style.setProperty('--pct', String(endPct));
        scoreNum.textContent = String(target);
      }
    };
    // ensure we really start from 0 each time
    ringEl.style.setProperty('--pct', '0');
    scoreNum.textContent = '0';
    aqiAnimId = requestAnimationFrame(tick);
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

  function statusText(aqi, city){
    const cat = !Number.isFinite(aqi) ? '—' :
      aqi<=50 ? 'Good' : aqi<=100 ? 'Moderate' : aqi<=150 ? 'Unhealthy for Sensitive Groups' :
      aqi<=200 ? 'Unhealthy' : aqi<=300 ? 'Very Unhealthy' : 'Hazardous';
    return Number.isFinite(aqi) ? `${cat}${city?` • ${city}`:''}` : `No data${city?` • ${city}`:''}`;
  }

  function setCategory(el, aqi){
    if (!el) return;
    el.classList.remove('is-good','is-moderate','is-usg','is-unhealthy','is-very','is-hazard');
    if (!Number.isFinite(aqi)) return;
    if (aqi<=50) el.classList.add('is-good');
    else if (aqi<=100) el.classList.add('is-moderate');
    else if (aqi<=150) el.classList.add('is-usg');
    else if (aqi<=200) el.classList.add('is-unhealthy');
    else if (aqi<=300) el.classList.add('is-very');
    else el.classList.add('is-hazard');
  }

  /* ---------- Smooth state helpers ---------- */
  function setEmpty(msg=''){
    if (qs('.empty-hint')) qs('.empty-hint').textContent = msg || 'Enter a city to see the AQI.';
    showOnly(emptyState);
  }
  function setLoading(msg=''){
    if (qs('.loading-copy')) qs('.loading-copy').innerHTML = msg || 'Fetching latest air data…';
    showOnly(loadingState);
  }
  function showResult(){
    showOnly(resultState);
  }
  function showOnly(target){
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
