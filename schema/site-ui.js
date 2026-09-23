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
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Auto-advance while on screen; hold while the pointer or keyboard focus is inside, so a photo can be looked at.
  let index = 0, visible = false, holding = false, timer, pending = 0;
  function schedule() {
    clearTimeout(timer);
    if (!reduced.matches && visible && !holding && !document.hidden) timer = setTimeout(() => show(index + 1), 5000);
  }
  async function show(next, announce = false) {
    const request = ++pending;
    next = (next + slides.length) % slides.length;
    try { await slides[next].decode(); } catch { schedule(); return; }
    if (request !== pending) return;
    index = next;
    slides.forEach((slide,i) => {
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',String(i!==index));
    });
    counter.setAttribute('aria-live', announce ? 'polite' : 'off');
    counter.textContent = `${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    schedule();
  }
  const hold = on => {holding = on; schedule();};
  gallery.querySelector('[data-office-prev]').addEventListener('click',()=>show(index-1,true));
  gallery.querySelector('[data-office-next]').addEventListener('click',()=>show(index+1,true));
  gallery.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hold(true);});
  gallery.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hold(false);});
  gallery.addEventListener('focusin',()=>hold(true));
  gallery.addEventListener('focusout',e=>{if(!gallery.contains(e.relatedTarget))hold(false);});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(gallery);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',schedule);
}
