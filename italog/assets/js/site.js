(() => {
  // Header: hidden on the first view, shown after a short scroll.
  const header = document.getElementById('site-header');
  if (header) {
    const THRESHOLD = 120;
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-shown', window.scrollY > THRESHOLD);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Wind lines: draw in from left to right when they scroll into view.
  const targets = document.querySelectorAll('[data-draw]');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-drawn'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-drawn');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
})();
