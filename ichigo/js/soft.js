/*
 * ぽわっと表示（全ページ共通）
 * - 写真：丸みのある幕が拭うように開き、中の写真がふわっと縮みながら現れる
 * - 見出し・本文：ぼかしから浮かび上がる
 * 動きを減らす設定の端末や IntersectionObserver 非対応環境では何もしない（通常表示のまま）。
 */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const style = document.createElement('style');
  style.textContent = `
    .soft-ph { position: relative; isolation: isolate; }
    .soft-ph::after {
      content: ""; position: absolute; z-index: 2; pointer-events: none;
      top: -50%; left: -50%; width: 150%; height: 200%;
      background: var(--soft-curtain, #fff);
      border-radius: 30% 0 0 30% / 50% 0 0 50%;
      transition: left 1.6s cubic-bezier(0.65, 0, 0.35, 1), border-radius 1.6s cubic-bezier(0.65, 0, 0.35, 1);
    }
    .soft-ph img { opacity: 0; transform: scale(1.2); }
    .soft-ph.is-in::after { left: 100%; border-radius: 0 0 0 0 / 50% 0 0 50%; }
    .soft-ph.is-in img { animation: soft-ph-pop 1.9s ${EASE} 0.2s both; }
    @keyframes soft-ph-pop {
      from { opacity: 0; transform: scale(1.2); filter: blur(6px); }
      to   { opacity: 1; transform: scale(1);   filter: blur(0); }
    }

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

  const isTransparent = (c) => !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
  const bgBehind = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (!isTransparent(c)) return c;
    }
    return '#fff';
  };
  const skip = (el) => el.closest('header, footer, #farm-grid, [data-soft="off"]');

  // 写真：親が overflow:hidden の枠になっているものだけ（ロゴ・イラスト・動画は除外）
  const photos = [];
  document.querySelectorAll('img').forEach((img) => {
    const box = img.parentElement;
    if (!box || skip(img) || /\/logo\//.test(img.getAttribute('src') || '')) return;
    if (getComputedStyle(box).overflow !== 'hidden' || box.clientWidth < 60) return;
    box.style.setProperty('--soft-curtain', bgBehind(box.parentElement));
    box.classList.add('soft-ph');
    photos.push(box);
  });

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
        if (el.classList.contains('soft-ph')) {
          // 幕は疑似要素なので、クラスの付与自体をずらして順番に開かせる
          setTimeout(() => el.classList.add('is-in'), delay);
          // 終わったら通常の状態に戻し、ホバー拡大などを邪魔しない
          setTimeout(() => el.classList.remove('soft-ph', 'is-in'), delay + 2300);
        } else {
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('is-in');
        }
        io.unobserve(el);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

  photos.concat(texts).forEach((el) => io.observe(el));
})();
