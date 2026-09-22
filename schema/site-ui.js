const homeHeader = document.querySelector('.home-header');
if (homeHeader) {
  const updateMenu = () => document.body.classList.toggle('menu-visible', scrollY > 32);
  addEventListener('scroll', updateMenu, {passive:true});
  addEventListener('pageshow', updateMenu);
  updateMenu();
}
const gallery = document.querySelector('.office-gallery');
if (gallery) {
  const slides = [...gallery.querySelectorAll('.office-slide')];
  const counter = gallery.querySelector('.office-count');
  const play = gallery.querySelector('.office-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = reduced.matches, visible = false, timer, pending = 0;
  function schedule() {
    clearTimeout(timer);
    if (!paused && visible && !document.hidden) timer = setTimeout(() => show(index + 1), 5000);
  }
  function reflectPlay() {
    play.textContent = paused ? '自動再生' : '一時停止';
    play.setAttribute('aria-pressed', String(paused));
    counter.setAttribute('aria-live', paused ? 'polite' : 'off');
  }
  async function show(next) {
    const request = ++pending;
    next = (next + slides.length) % slides.length;
    try { await slides[next].decode(); } catch { schedule(); return; }
    if (request !== pending) return;
    index = next;
    slides.forEach((slide,i) => {
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',String(i!==index));
    });
    counter.textContent = `${String(index+1).padStart(2,'0')} / 04`;
    schedule();
  }
  const manual = direction => {paused=true;reflectPlay();clearTimeout(timer);show(index+direction);};
  gallery.querySelector('[data-office-prev]').addEventListener('click',()=>manual(-1));
  gallery.querySelector('[data-office-next]').addEventListener('click',()=>manual(1));
  play.addEventListener('click',()=>{paused=!paused;reflectPlay();schedule();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(gallery);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{if(reduced.matches){paused=true;reflectPlay();schedule();}});
  reflectPlay();
}
