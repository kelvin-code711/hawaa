const wrapper = document.querySelector('.card-image-wrapper');
const img     = wrapper.querySelector('img');

window.addEventListener('scroll', () => {
  const rect = wrapper.getBoundingClientRect();
  const vh   = window.innerHeight;

  // how much of the wrapper is visible (0→1)
  const visible = Math.max(0,
    Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
  ) / (rect.height + vh);

  // map to scale from 1→1.1
  const scale = 1 + visible * 0.1;
  img.style.transform = `translate3d(0,0,0) scale3d(${scale},${scale},1)`;
});
