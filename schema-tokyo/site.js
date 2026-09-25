// スクロールで現れる要素に .in を付ける。動きを減らす設定なら軌道上の電子も止める
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.orbits svg').forEach(s => s.pauseAnimations && s.pauseAnimations());
  }

  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  targets.forEach(t => io.observe(t));
})();
