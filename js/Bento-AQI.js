function getAqi() {
  const city = document.getElementById('cityInput').value.trim();
  const cityName = document.getElementById('cityName');
  const aqiValue = document.getElementById('aqiValue');
  const box2 = document.getElementById('box2');

  if (!city) return;

  const aqi = Math.floor(Math.random() * 300);
  cityName.textContent = `AQI in ${city}`;
  aqiValue.textContent = aqi;

  let color = '#999';
  if (aqi <= 50) color = '#4caf50';
  else if (aqi <= 100) color = '#ffeb3b';
  else if (aqi <= 200) color = '#ff9800';
  else color = '#f44336';

  box2.style.backgroundColor = color;
}

const phrases = [
  "Breathe better with Hawaa.",
  "99.9% airborne particles blocked.",
  "Air so clean, it feels new.",
  "Smart air monitoring at home.",
  "Cleaner air. Healthier you."
];
let phraseIndex = 0;
const textEl = document.getElementById('rotatingText');

setInterval(() => {
  phraseIndex = (phraseIndex + 1) % phrases.length;
  textEl.style.opacity = 0;
  setTimeout(() => {
    textEl.textContent = phrases[phraseIndex];
    textEl.style.opacity = 1;
  }, 300);
}, 2000);