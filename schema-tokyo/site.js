// 丸括弧の弧線を差し込み、スクロールで現れる要素に .in を付ける
(() => {
  const NS = 'http://www.w3.org/2000/svg';

  // 弧線は実寸（px）の viewBox で描く（線幅を歪ませないため）
  const drawArc = (wrap, side) => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    const svg = wrap.firstChild, path = svg.firstChild;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    path.setAttribute('d', side === 'l'
      ? `M${w} 0 Q${-w * .35} ${h / 2} ${w} ${h}`
      : `M0 0 Q${w * 1.35} ${h / 2} 0 ${h}`);
  };
  const arcs = [];
  document.querySelectorAll('.bracket').forEach(b => {
    ['l', 'r'].forEach(side => {
      const wrap = document.createElement('span');
      wrap.className = `arc arc-${side}`;
      wrap.setAttribute('aria-hidden', 'true');
      const svg = document.createElementNS(NS, 'svg');
      const path = document.createElementNS(NS, 'path');
      svg.appendChild(path);
      wrap.appendChild(svg);
      b.appendChild(wrap);
      arcs.push([wrap, side]);
    });
  });
  const redraw = () => arcs.forEach(([w, s]) => drawArc(w, s));
  redraw();
  if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(document.body);

  const targets = document.querySelectorAll('.reveal, .bracket');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  targets.forEach(t => io.observe(t));
})();
