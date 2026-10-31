/*
 * みんなのアイデア：カード一覧・拡大表示・スタンプ（いいね／ほしい！／おいしそう）
 *   <div id="ideas" data-set="yokoze2026" data-count="47" data-dir="images/yokoze/"></div>
 * 一覧は「絵のシート（-b）」をメインに表示し、拡大表示で「アイデアシート（-a）」に切り替えられる。
 *   絵のシートが白紙の回（data-blank="18,19"）はアイデアシートを表示する。
 * スタンプの数は api/reactions.php に保存。押したものはこのブラウザに記録し、二重に押せないようにする。
 */
(() => {
  const root = document.getElementById('ideas'); if (!root) return;
  const SET = root.dataset.set, N = +root.dataset.count, DIR = root.dataset.dir;
  const BLANK = new Set((root.dataset.blank || '').split(',').filter(Boolean).map(Number));
  const main = (id) => BLANK.has(id) ? 'a' : 'b';
  const API = 'api/reactions.php';
  const STAMPS = [
    { key: 'like', icon: '👍', label: 'いいね' },
    { key: 'want', icon: '🙌', label: 'ほしい！' },
    { key: 'yummy', icon: '🍓', label: 'おいしそう' },
  ];
  const pad = (n) => String(n).padStart(2, '0');
  const MINE_KEY = 'ichigo-stamps-' + SET;
  let mine = {}; try { mine = JSON.parse(localStorage.getItem(MINE_KEY) || '{}'); } catch (e) { /* 使えない環境では記録しない */ }
  const saveMine = () => { try { localStorage.setItem(MINE_KEY, JSON.stringify(mine)); } catch (e) { /* 何もしない */ } };
  let counts = {};

  // カードを描く
  root.innerHTML = '<ul class="idea-grid">' + Array.from({ length: N }, (_, i) => {
    const id = i + 1;
    return `<li class="idea-card" data-id="${id}">
      <button type="button" class="idea-thumb" data-open="${id}" aria-label="アイデア No.${pad(id)} を大きく見る">
        <img loading="lazy" decoding="async" width="640" height="452" src="${DIR}idea${pad(id)}-${main(id)}-s.webp" alt="5年生のアイデア No.${pad(id)}（${main(id) === 'b' ? '商品の絵' : 'アイデアシート'}）">
      </button>
      <div class="idea-meta"><span class="label-en text-ichigo">No.${pad(id)}</span></div>
      <div class="idea-stamps" role="group" aria-label="No.${pad(id)} にスタンプを送る">
        ${STAMPS.map(s => `<button type="button" class="stamp" data-id="${id}" data-stamp="${s.key}" aria-pressed="false"><span class="stamp-icon" aria-hidden="true">${s.icon}</span><span class="stamp-label">${s.label}</span><span class="stamp-count" data-count="${id}-${s.key}">0</span></button>`).join('')}
      </div>
    </li>`;
  }).join('') + '</ul>';

  const paint = () => {
    root.querySelectorAll('.stamp').forEach(b => {
      const id = b.dataset.id, k = b.dataset.stamp;
      b.querySelector('.stamp-count').textContent = (counts[id] && counts[id][k]) || 0;
      const on = !!(mine[id] && mine[id][k]);
      b.setAttribute('aria-pressed', String(on)); b.disabled = on;
    });
    const total = Object.values(counts).reduce((s, c) => s + Object.values(c).reduce((a, b) => a + b, 0), 0);
    const t = document.getElementById('ideas-total'); if (t) t.textContent = total.toLocaleString();
  };

  fetch(`${API}?set=${SET}`, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => { counts = d.counts || {}; paint(); })
    .catch(() => { root.classList.add('stamps-offline'); paint(); });

  // スタンプを押す
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.stamp'); if (!b || b.disabled) return;
    const id = b.dataset.id, k = b.dataset.stamp;
    // 先に表示を進めて、失敗したら戻す
    counts[id] = counts[id] || {}; counts[id][k] = (counts[id][k] || 0) + 1;
    mine[id] = mine[id] || {}; mine[id][k] = 1; saveMine(); paint();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    const body = new URLSearchParams({ set: SET, id, stamp: k });
    fetch(API, { method: 'POST', body })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.counts) { counts[id] = j.counts; paint(); }
        else if (j && j.error === 'already') { /* 既に押していた：表示はそのまま */ }
        else throw new Error(j && j.error);
      })
      .catch(() => { counts[id][k] = Math.max(0, counts[id][k] - 1); delete mine[id][k]; saveMine(); paint(); });
  });

  // 拡大表示
  const dlg = document.getElementById('idea-dialog');
  if (dlg) {
    const img = dlg.querySelector('img'), cap = dlg.querySelector('[data-cap]');
    const tabs = [...dlg.querySelectorAll('[data-side]')];
    const zoom = dlg.querySelector('[data-zoom]'), hint = dlg.querySelector('[data-zoom-hint]');
    let cur = 1, side = 'b';

    // 押した場所を中心に拡大／もう一度押すと全体表示に戻る
    const setZoom = (on, fx = 0.5, fy = 0.5) => {
      zoom.classList.toggle('is-zoomed', on);
      zoom.setAttribute('aria-label', on ? '拡大をやめる' : '画像を拡大する');
      if (hint) hint.textContent = on ? 'ドラッグやスクロールで動かせます。もう一度押すと元に戻ります' : '画像を押すと、文字が読める大きさに拡大します';
      if (on) {
        zoom.scrollLeft = img.offsetWidth * fx - zoom.clientWidth / 2;
        zoom.scrollTop = img.offsetHeight * fy - zoom.clientHeight / 2;
      }
    };
    // マウスはドラッグで動かす（タッチは指でそのままスクロールできる）
    let drag = null, moved = false;
    zoom.addEventListener('pointerdown', (e) => {
      moved = false;
      if (!zoom.classList.contains('is-zoomed') || e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, y: e.clientY, l: zoom.scrollLeft, t: zoom.scrollTop };
      zoom.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      zoom.scrollLeft = drag.l - dx; zoom.scrollTop = drag.t - dy;
    });
    window.addEventListener('pointerup', () => { drag = null; zoom.classList.remove('is-dragging'); });
    zoom.addEventListener('click', (e) => {
      if (moved) return;
      const r = img.getBoundingClientRect();
      setZoom(!zoom.classList.contains('is-zoomed'), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    });
    zoom.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoom(!zoom.classList.contains('is-zoomed')); }
    });

    const paintDlg = () => {
      setZoom(false);
      const s = BLANK.has(cur) ? 'a' : side;
      img.src = `${DIR}idea${pad(cur)}-${s}.webp`;
      img.alt = `5年生のアイデア No.${pad(cur)}（${s === 'b' ? '商品の絵' : 'アイデアシート'}）`;
      cap.textContent = `No.${pad(cur)} / ${N}`;
      tabs.forEach(t => { t.setAttribute('aria-pressed', String(t.dataset.side === s)); t.disabled = BLANK.has(cur) && t.dataset.side === 'b'; });
    };
    const show = (id) => { cur = (id + N - 1) % N + 1; paintDlg(); };
    tabs.forEach(t => t.addEventListener('click', () => { side = t.dataset.side; paintDlg(); }));
    root.addEventListener('click', (e) => { const t = e.target.closest('[data-open]'); if (!t) return; side = 'b'; show(+t.dataset.open); dlg.showModal(); });
    dlg.querySelector('[data-prev]').addEventListener('click', () => show(cur - 1));
    dlg.querySelector('[data-next]').addEventListener('click', () => show(cur + 1));
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  }
})();
