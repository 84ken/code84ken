/*
 * いちごトピックス：data/topics.json を読み、[data-topics] の中に一覧を描く
 *   <div data-topics data-limit="4"></div>
 * データは週1回の候補集め（Claude）→ 確認 → マージで更新される。
 */
(() => {
  const boxes = document.querySelectorAll('[data-topics]');
  if (!boxes.length) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (d) => { const [y, m, day] = String(d).split('-'); return `${y}.${m}${day ? '.' + day : ''}`; };
  const isExternal = (u) => /^https?:\/\//.test(u);
  const extIcon = '<svg class="topic-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>';

  fetch('data/topics.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      const items = (data.items || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
      boxes.forEach((box) => {
        const limit = parseInt(box.dataset.limit || '0', 10) || items.length;
        box.innerHTML = '<ul class="topic-list">' + items.slice(0, limit).map((t) => {
          const ext = isExternal(t.url);
          return `<li><a class="topic-card" href="${esc(t.url)}"${ext ? ' target="_blank" rel="noopener"' : ''}>
            <span class="topic-meta"><time datetime="${esc(t.date)}">${fmt(t.date)}</time>${t.tag ? `<span class="topic-tag">${esc(t.tag)}</span>` : ''}<span class="topic-source">${esc(t.source)}</span></span>
            <span class="topic-title">${esc(t.title)}${ext ? extIcon : ''}</span>
            ${t.note ? `<span class="topic-note">${esc(t.note)}</span>` : ''}
          </a></li>`;
        }).join('') + '</ul>';
      });
    })
    .catch(() => {
      boxes.forEach((box) => { box.innerHTML = '<p class="topic-empty">トピックスを読み込めませんでした。時間をおいて再度お試しください。</p>'; });
    });
})();
