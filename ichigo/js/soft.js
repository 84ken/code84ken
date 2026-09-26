/*
 * ぽわっと表示（全ページ共通）
 * - 見出し・本文：ぼかしから浮かび上がる
 * 動きを減らす設定の端末や IntersectionObserver 非対応環境では何もしない（通常表示のまま）。
 */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const style = document.createElement('style');
  style.textContent = `
    .soft-up { opacity: 0; transform: translateY(22px); filter: blur(8px); }
    .soft-up.is-in {
      opacity: 1; transform: none; filter: blur(0);
      transition: opacity 1.2s ${EASE}, transform 1.2s ${EASE}, filter 1.2s ${EASE};
    }

    /* 既存の .reveal にも、ぼかしから浮かぶ質感を足す */
    .reveal { filter: blur(8px); transition: opacity 1.1s ${EASE}, transform 1.1s ${EASE}, filter 1.1s ${EASE}; }
    .reveal.is-visible { filter: blur(0); }
  `;
  document.head.appendChild(style);

  const skip = (el) => el.closest('header, footer, #farm-grid, [data-soft="off"]');

  // 見出し・本文
  const texts = [];
  document.querySelectorAll('section h2, section h3, section .label-en, section .body-jp').forEach((el) => {
    if (skip(el) || el.closest('.reveal, .soft-up')) return;
    el.classList.add('soft-up');
    texts.push(el);
  });

  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((e, i) => {
        const el = e.target;
        const delay = Math.min(i, 6) * 90;
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

  texts.forEach((el) => io.observe(el));
})();
