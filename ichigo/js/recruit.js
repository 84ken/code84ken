/*
 * 画面下の「入学者募集中！」ボタン（いちごのアイコン → LINE オープンチャット）
 * アイコンはサイト用に描いたシンプルないちご（キービジュアルのキャラクターは加工しない）
 * - トップではファーストビューの動画と重ならないよう、少しスクロールしてから登場
 * - ページ内の LINE ボタンが見えている間は隠す（同じ導線を二重に出さない）
 * - × で閉じたら、そのタブを閉じるまで出さない
 */
(() => {
  const LINE = 'https://line.me/ti/g2/hjGV3KSFBkkdt-RT16RJS7MCXm9znbkNzcAgkw?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';
  const KEY = 'ichigo-mascot-closed';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) { /* 保存できない環境でも表示は続ける */ }

  const style = document.createElement('style');
  style.textContent = `
    .mascot { position:fixed; z-index:45; right:max(12px, env(safe-area-inset-right)); bottom:max(12px, env(safe-area-inset-bottom)); display:flex; align-items:flex-end; gap:6px;
      opacity:0; transform:translateY(24px) scale(0.9); pointer-events:none; transition:opacity .45s cubic-bezier(.22,1,.36,1), transform .45s cubic-bezier(.34,1.56,.64,1); }
    .mascot.is-shown { opacity:1; transform:none; pointer-events:auto; }
    .mascot-link { display:flex; align-items:flex-end; gap:4px; text-decoration:none; }
    .mascot-bubble { position:relative; margin-bottom:22px; background:#fff; color:#43373B; border:2px solid #C92A57; border-radius:18px; padding:8px 14px 9px; box-shadow:0 6px 0 #F4C9D5; font-family:"Zen Maru Gothic",sans-serif; line-height:1.35; white-space:nowrap; }
    .mascot-bubble::after { content:""; position:absolute; right:-9px; bottom:14px; width:14px; height:14px; background:#fff; border-right:2px solid #C92A57; border-bottom:2px solid #C92A57; transform:rotate(-45deg); border-radius:0 0 4px 0; }
    .mascot-bubble b { display:block; font-size:15px; font-weight:700; color:#C92A57; letter-spacing:.04em; }
    .mascot-bubble span { display:block; font-size:11px; font-weight:700; color:#6E5E63; margin-top:1px; }
    .mascot-img { width:72px; height:auto; display:block; filter:drop-shadow(0 6px 8px rgba(169,40,76,.18)); animation:mascot-bob 2.8s ease-in-out infinite; transform-origin:50% 100%; }
    .mascot-link:hover .mascot-img, .mascot-link:focus-visible .mascot-img { animation:mascot-hop .7s ease-in-out infinite; }
    .mascot-link:hover .mascot-bubble { background:#FFF7D6; }
    .mascot-link:focus-visible { outline:3px solid #C92A57; outline-offset:4px; border-radius:20px; }
    .mascot-close { position:absolute; top:-6px; left:-8px; width:26px; height:26px; border-radius:999px; background:#fff; border:1.5px solid #F4C9D5; color:#6E5E63; font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.08); }
    .mascot-close:hover { color:#C92A57; border-color:#C92A57; }
    @keyframes mascot-bob { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-6px) rotate(2deg); } }
    @keyframes mascot-hop { 0%,100% { transform:translateY(0) scale(1,1); } 40% { transform:translateY(-10px) scale(.97,1.04); } 70% { transform:translateY(0) scale(1.05,.95); } }
    @media (max-width: 639px) {
      .mascot-img { width:56px; }
      .mascot-bubble { margin-bottom:16px; padding:6px 11px 7px; border-radius:16px; }
      .mascot-bubble b { font-size:13px; }
      .mascot-bubble span { font-size:10px; }
    }
    @media (prefers-reduced-motion: reduce) { .mascot, .mascot-img { transition:none; animation:none !important; } }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.className = 'mascot';
  el.innerHTML = `
    <a class="mascot-link" href="${LINE}" target="_blank" rel="noopener" aria-label="入学者募集中！LINEオープンチャットで参加する（新しいタブで開く）">
      <span class="mascot-bubble"><b>入学者募集中！</b><span>LINEで気軽に参加 →</span></span>
      <svg class="mascot-img" viewBox="0 0 100 110" aria-hidden="true"><path d="M50 30C75 25 95 39 93 62C91 86 68 107 50 108C32 107 9 86 7 62C5 39 25 25 50 30Z" fill="#C92A57"/><ellipse cx="32" cy="52" rx="7" ry="12" transform="rotate(-22 32 52)" fill="#fff" opacity=".2"/><g fill="#F7E38A"><ellipse cx="30" cy="56" rx="2.2" ry="3.4"/><ellipse cx="50" cy="52" rx="2.2" ry="3.4"/><ellipse cx="70" cy="56" rx="2.2" ry="3.4"/><ellipse cx="22" cy="72" rx="2.2" ry="3.4"/><ellipse cx="40" cy="70" rx="2.2" ry="3.4"/><ellipse cx="60" cy="70" rx="2.2" ry="3.4"/><ellipse cx="78" cy="72" rx="2.2" ry="3.4"/><ellipse cx="33" cy="87" rx="2.2" ry="3.4"/><ellipse cx="50" cy="86" rx="2.2" ry="3.4"/><ellipse cx="67" cy="87" rx="2.2" ry="3.4"/><ellipse cx="50" cy="100" rx="2.2" ry="3.2"/></g><path d="M50 24C50 16 53 10 58 7" fill="none" stroke="#6FA83E" stroke-width="4" stroke-linecap="round"/><path d="M50 36C42 24 28 25 21 33C31 33 39 36 45 41Z M50 36C58 24 72 25 79 33C69 33 61 36 55 41Z M50 39C45 31 45 25 50 20C55 25 55 31 50 39Z" fill="#A9CC5B"/></svg>
    </a>
    <button type="button" class="mascot-close" aria-label="入学者募集のボタンを閉じる">×</button>`;
  document.body.appendChild(el);

  // 表示条件：一定量スクロールした ／ ページ内の LINE ボタンが見えていない
  const isTop = /(^\/$|index\.html$)/.test(location.pathname);
  const threshold = () => (isTop ? window.innerHeight * 0.6 : 160);
  let pageLineVisible = false;
  const update = () => el.classList.toggle('is-shown', window.scrollY > threshold() && !pageLineVisible);

  const lineLinks = [...document.querySelectorAll('a[href*="line.me"]')].filter((a) => !el.contains(a));
  if ('IntersectionObserver' in window && lineLinks.length) {
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      pageLineVisible = visible.size > 0;
      update();
    });
    lineLinks.forEach((a) => io.observe(a));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  el.querySelector('.mascot-close').addEventListener('click', () => {
    el.remove();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* 何もしない */ }
  });
})();
