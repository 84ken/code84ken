/* =========================================================
   サーキュラーエコノミーラボ 公式サイト
   共通スクリプト（ビルド不要・素の JavaScript）

   主な機能
   1. モバイルメニューの開閉
   2. お知らせ一覧の描画        …… [data-news]
   3. 開催情報一覧の描画        …… [data-events]
   4. 出展企業一覧＋絞り込み    …… [data-exhibitors]
   5. 実績カウンターのアニメ    …… [data-count-to]
   6. フッターの年表示          …… [data-year]
   7. SNSシェア                 …… [data-share]

   データは /assets/data/*.json を編集すれば反映されます。
   ========================================================= */

(function () {
  'use strict';

  var DATA = '/assets/data/';

  /* ---------- 小さなユーティリティ ---------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getJSON(name) {
    return fetch(DATA + name, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + ' の読み込みに失敗しました');
      return r.json();
    });
  }

  function formatDate(iso) {
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[0] + '.' + p[1] + '.' + p[2];
  }

  function fail(el, msg) {
    el.innerHTML = '<p class="text-base text-soft text-center py-12">' + esc(msg) + '</p>';
  }

  var ARROW = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

  /* ---------- 1. モバイルメニュー ---------- */

  function initNav() {
    var toggle = $('#navToggle');
    var panel = $('#mobileNav');
    if (!toggle || !panel) return;

    function setOpen(open) {
      panel.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      $('[data-icon-open]', toggle).classList.toggle('hidden', open);
      $('[data-icon-close]', toggle).classList.toggle('hidden', !open);
    }

    toggle.addEventListener('click', function () {
      setOpen(panel.classList.contains('hidden'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
        setOpen(false);
        toggle.focus();
      }
    });

    $$('a', panel).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* ---------- 2. お知らせ ---------- */

  var CATEGORY_STYLE = {
    'イベント': 'bg-primary-100 text-primary-800',
    'レポート': 'bg-sun text-navy',
    'お知らせ': 'bg-primary-50 text-primary-800'
  };

  function newsItem(n) {
    var badge = CATEGORY_STYLE[n.category] || CATEGORY_STYLE['お知らせ'];
    return '' +
      '<li>' +
        '<a href="' + esc(n.url) + '" class="group flex flex-col gap-2 rounded-2xl bg-white border-2 border-primary-100 hover:border-sun p-5 transition-colors sm:flex-row sm:items-center sm:gap-5">' +
          '<span class="flex items-center gap-3 leading-normal shrink-0">' +
            '<time datetime="' + esc(n.date) + '" class="display-num text-lg text-primary-700">' + esc(formatDate(n.date)) + '</time>' +
            '<span class="font-round ' + badge + ' px-3 py-1 rounded-full text-xs font-bold">' + esc(n.category) + '</span>' +
          '</span>' +
          '<span class="text-base text-ink group-hover:text-primary-700 leading-relaxed flex-1">' + esc(n.title) + '</span>' +
          '<span class="hidden sm:inline-flex text-primary-700 shrink-0">' + ARROW + '</span>' +
        '</a>' +
      '</li>';
  }

  function initNews() {
    var hosts = $$('[data-news]');
    if (!hosts.length) return;
    getJSON('news.json').then(function (d) {
      hosts.forEach(function (host) {
        var limit = parseInt(host.getAttribute('data-limit'), 10) || d.news.length;
        host.innerHTML = '<ul class="space-y-3">' + d.news.slice(0, limit).map(newsItem).join('') + '</ul>';
      });
    }).catch(function (e) {
      hosts.forEach(function (h) { fail(h, 'お知らせを読み込めませんでした。'); });
      console.error(e);
    });
  }

  /* ---------- 3. 開催情報 ---------- */

  function metaRow(icon, text) {
    return '<div class="flex items-start gap-2"><span class="text-primary-600 shrink-0 mt-0.5">' + icon + '</span><span>' + esc(text) + '</span></div>';
  }

  var IC_CAL = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  var IC_PIN = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';
  var IC_STAR = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18"/></svg>';

  function eventCard(ev) {
    var upcoming = ev.status === 'upcoming';
    var img = ev.photo
      ? '<img src="' + esc(ev.photo) + '" alt="' + esc(ev.photoAlt || '') + '" loading="lazy" decoding="async" width="1200" height="800">'
      : '<span class="photo-placeholder block w-full h-full"></span>';

    var meta = metaRow(IC_CAL, ev.dateLabel) + metaRow(IC_PIN, ev.venue);
    if (ev.concurrent) meta += metaRow(IC_STAR, ev.concurrent);

    var stats = '';
    if (!upcoming && ev.visitors) {
      stats = '<div class="flex flex-wrap gap-x-6 gap-y-1 mt-4 pt-4 border-t-2 border-primary-100 leading-normal">' +
        '<span class="text-sm text-soft">来場者 <strong class="display-num text-xl text-primary-700 align-middle">' + ev.visitors.toLocaleString('ja-JP') + '</strong> 人</span>' +
        '<span class="text-sm text-soft">出展 <strong class="display-num text-xl text-primary-700 align-middle">' + ev.exhibitorCount + '</strong> 団体</span>' +
        '</div>';
    }

    var label = upcoming
      ? '<span class="font-round bg-sun text-navy px-4 py-1.5 rounded-full text-sm font-bold">次回開催</span>'
      : '<span class="font-round bg-primary-100 text-primary-800 px-4 py-1.5 rounded-full text-sm font-bold">開催終了</span>';

    var cta = upcoming ? '開催のくわしい情報' : '開催レポートを読む';
    var frame = upcoming ? 'card-y' : 'bg-white border-[3px] border-primary-100 rounded-3xl group-hover:border-sun transition-colors';

    return '' +
      '<article class="h-full">' +
        '<a href="' + esc(ev.url) + '" class="group flex flex-col h-full ' + frame + ' overflow-hidden">' +
          '<div class="photo-figure aspect-[3/2] bg-primary-50 overflow-hidden">' + img + '</div>' +
          '<div class="p-6 flex flex-col flex-1">' +
            '<div class="leading-normal mb-3">' + label + '</div>' +
            '<h3 class="font-round text-xl font-bold text-primary-800">' + esc(ev.title) + '</h3>' +
            '<div class="mt-3 space-y-1.5 text-[0.9375rem] text-body leading-relaxed">' + meta + '</div>' +
            '<p class="mt-4 text-base text-body leading-relaxed flex-1">' + esc(ev.summary) + '</p>' +
            stats +
            '<span class="font-round mt-5 inline-flex items-center gap-1.5 text-base font-bold text-primary-700 leading-normal">' + cta + ARROW + '</span>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  function initEvents() {
    var hosts = $$('[data-events]');
    if (!hosts.length) return;
    getJSON('events.json').then(function (d) {
      hosts.forEach(function (host) {
        var status = host.getAttribute('data-status');
        var limit = parseInt(host.getAttribute('data-limit'), 10) || 99;
        var list = d.events.filter(function (e) { return !status || e.status === status; }).slice(0, limit);
        if (!list.length) { fail(host, '該当する開催情報はありません。'); return; }
        host.innerHTML = list.map(eventCard).join('');
      });
    }).catch(function (e) {
      hosts.forEach(function (h) { fail(h, '開催情報を読み込めませんでした。'); });
      console.error(e);
    });
  }

  /* ---------- 4. 出展企業（チラシ裏面のカードに寄せる） ---------- */

  var EVENT_LABEL = { 'koshigaya-2025': '越谷', 'hanyu-2026': '羽生' };
  var EVENT_YEAR  = { 'koshigaya-2025': '2025', 'hanyu-2026': '2026' };

  function exhibitorCard(x) {
    var img = x.photo
      ? '<img src="' + esc(x.photo) + '" alt="' + esc(x.photoAlt || (x.name + 'のブースの様子')) + '" loading="lazy" decoding="async" width="1200" height="800">'
      : '<span class="photo-placeholder w-full h-full flex items-center justify-center">' +
          '<span class="font-round text-sm font-bold text-primary-800 leading-normal">写真は準備中です</span>' +
        '</span>';

    // 右上の丸バッジ（チラシ裏面の出展日バッジと同じ役割）
    var dayBadges = (x.events || []).map(function (id, i) {
      return '<span class="badge-day' + (i > 0 ? ' is-second' : '') + '">' + esc(EVENT_LABEL[id] || id) + '</span>';
    }).join('');

    var tagBadges = (x.tags || []).map(function (t) {
      return '<span class="font-round bg-primary-50 text-primary-800 px-3 py-1 rounded-full text-xs font-bold">' + esc(t) + '</span>';
    }).join('');

    var registered = x.ceRegistered
      ? '<p class="mt-4 flex items-start gap-2 p-3 rounded-xl bg-primary-50 text-primary-800 text-sm leading-relaxed">' +
          '<svg class="w-4 h-4 shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
          '<span>「彩の国サーキュラーエコノミー」の登録企業です</span>' +
        '</p>'
      : '';

    var link = x.url
      ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer" class="font-round mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-800 leading-normal">公式サイト' +
          '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>' +
        '</a>'
      : '';

    return '' +
      '<article class="relative bg-white rounded-2xl overflow-hidden flex flex-col shadow-[0_5px_0_rgba(26,58,29,0.12)]"' +
        ' data-x-events="' + esc((x.events || []).join(' ')) + '"' +
        ' data-x-tags="' + esc((x.tags || []).join(' ')) + '">' +
        '<div class="photo-figure aspect-[3/2] bg-primary-50 overflow-hidden">' + img + '</div>' +
        '<div class="absolute right-3 top-3 flex gap-1.5">' + dayBadges + '</div>' +
        '<div class="p-5 lg:p-6 flex flex-col flex-1">' +
          '<h3 class="font-round text-lg font-bold text-primary-700">' + esc(x.name) + '</h3>' +
          (x.partner ? '<p class="text-sm text-soft leading-relaxed">' + esc(x.partner) + '</p>' : '') +
          '<p class="mt-3 text-[0.9375rem] text-body leading-relaxed flex-1">' + esc(x.summary) + '</p>' +
          '<div class="mt-4 flex flex-wrap gap-2 leading-normal">' + tagBadges + '</div>' +
          '<dl class="mt-4 pt-4 border-t-2 border-primary-100 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1.5 text-sm leading-relaxed">' +
            '<dt class="text-soft">循環する資源</dt><dd class="text-ink font-medium">' + esc(x.resource) + '</dd>' +
            '<dt class="text-soft">出展日</dt><dd class="text-ink font-medium">' + esc(x.days) + '</dd>' +
          '</dl>' +
          registered +
          link +
        '</div>' +
      '</article>';
  }

  function initExhibitors() {
    var host = $('[data-exhibitors]');
    if (!host) return;
    var countEl = $('[data-exhibitor-count]');
    var filterHost = $('[data-exhibitor-filters]');

    getJSON('exhibitors.json').then(function (d) {
      host.innerHTML = d.exhibitors.map(exhibitorCard).join('');

      var state = { event: 'all', tag: 'all' };
      var ON = 'bg-primary-700 border-primary-700 text-white';
      var OFF = 'bg-white border-primary-200 text-primary-800 hover:border-primary-400';

      function apply() {
        var shown = 0;
        $$('article', host).forEach(function (card) {
          var evs = card.getAttribute('data-x-events').split(' ');
          var tags = card.getAttribute('data-x-tags').split(' ');
          var ok = (state.event === 'all' || evs.indexOf(state.event) !== -1) &&
                   (state.tag === 'all' || tags.indexOf(state.tag) !== -1);
          card.classList.toggle('hidden', !ok);
          if (ok) shown++;
        });
        if (countEl) countEl.textContent = shown;
        var empty = $('[data-exhibitor-empty]');
        if (empty) empty.classList.toggle('hidden', shown > 0);
      }

      function chipGroup(legend, group, options) {
        var chips = options.map(function (o, i) {
          var active = i === 0;
          return '<button type="button" role="tab" aria-selected="' + active + '"' +
            ' data-filter-group="' + group + '" data-filter-value="' + esc(o.value) + '"' +
            ' class="font-round inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border-2 cursor-pointer leading-normal transition-colors ' +
            (active ? ON : OFF) + '">' + esc(o.label) + '</button>';
        }).join('');
        return '<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">' +
          '<span class="font-round text-sm font-bold text-primary-800 leading-normal shrink-0 sm:w-28">' + esc(legend) + '</span>' +
          '<div role="tablist" aria-label="' + esc(legend) + 'で絞り込む" class="flex flex-wrap gap-2">' + chips + '</div>' +
        '</div>';
      }

      if (filterHost) {
        filterHost.innerHTML =
          chipGroup('開催回', 'event', [
            { value: 'all', label: 'すべて' },
            { value: 'koshigaya-2025', label: '越谷 2025' },
            { value: 'hanyu-2026', label: '羽生 2026' }
          ]) +
          '<div class="border-t-2 border-primary-100 my-4"></div>' +
          chipGroup('循環する資源', 'tag',
            [{ value: 'all', label: 'すべて' }].concat(
              d.resourceTags.map(function (t) { return { value: t, label: t }; })
            )
          );

        filterHost.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-filter-group]');
          if (!btn) return;
          var group = btn.getAttribute('data-filter-group');
          state[group] = btn.getAttribute('data-filter-value');
          $$('[data-filter-group="' + group + '"]', filterHost).forEach(function (b) {
            var on = b === btn;
            b.setAttribute('aria-selected', on);
            b.className = b.className.replace(ON, '').replace(OFF, '').replace(/\s+/g, ' ').trim() + ' ' + (on ? ON : OFF);
          });
          apply();
        });
      }

      apply();
    }).catch(function (e) {
      fail(host, '出展企業の情報を読み込めませんでした。');
      console.error(e);
    });
  }

  /* ---------- 5. 実績カウンター ---------- */

  function initCounters() {
    var els = $$('[data-count-to]');
    if (!els.length) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.textContent = Number(el.getAttribute('data-count-to')).toLocaleString('ja-JP');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var el = entry.target;
        var target = Number(el.getAttribute('data-count-to'));
        var start = null;
        var dur = 900;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('ja-JP');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* ---------- 6. フッターの年 ---------- */

  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- 7. SNSシェア ---------- */

  function initShare() {
    $$('[data-share]').forEach(function (host) {
      var url = location.href.split('#')[0];
      var text = host.getAttribute('data-share-text') || document.title;
      var u = encodeURIComponent(url);
      var t = encodeURIComponent(text);

      var x = $('[data-share-x]', host);
      if (x) x.href = 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;

      var fb = $('[data-share-fb]', host);
      if (fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + u;

      var line = $('[data-share-line]', host);
      if (line) line.href = 'https://social-plugins.line.me/lineit/share?url=' + u + '&text=' + t;

      var copy = $('[data-share-copy]', host);
      if (copy) {
        copy.addEventListener('click', function () {
          var label = $('[data-share-copy-label]', copy);
          function done(msg) {
            if (!label) return;
            var prev = label.textContent;
            label.textContent = msg;
            setTimeout(function () { label.textContent = prev; }, 2000);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
              .then(function () { done('コピーしました'); })
              .catch(function () { done('コピーできませんでした'); });
          } else {
            done('コピーできませんでした');
          }
        });
      }
    });
  }

  /* ---------- 起動 ---------- */

  function boot() {
    initNav(); initNews(); initEvents(); initExhibitors();
    initCounters(); initYear(); initShare();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
