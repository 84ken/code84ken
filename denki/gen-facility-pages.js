/**
 * 個別施設ページ生成スクリプト
 * data/facilities.json から各施設の HTML を facility/[id].html に出力
 */
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'facilities.json'), 'utf8'));
const ALL = data.facilities;
const OUT_DIR = path.join(__dirname, 'facility');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// === Helpers ===
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function findNearest(f, n = 4) {
  return ALL
    .filter(x => x.id !== f.id && x.status === '営業中')
    .map(x => ({ ...x, _dist: haversineKm(f, x) }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, n);
}

function findSameMaker(f, n = 5) {
  if (!f.maker || f.maker === '?' || f.maker === '不明') return [];
  // Normalize maker (取り出し小西/坂田/水野のいずれか)
  const m = f.maker.includes('小西') ? '小西'
          : f.maker.includes('坂田') ? '坂田'
          : f.maker.includes('水野') ? '水野' : null;
  if (!m) return [];
  return ALL
    .filter(x => x.id !== f.id && x.maker && x.maker.includes(m) && x.status === '営業中')
    .slice(0, n);
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function powerLabel(p) {
  if (p >= 5) return '最強';
  if (p >= 4) return '強め';
  if (p >= 3) return '普通';
  if (p >= 2) return 'やや弱め';
  return '弱め';
}

function powerBolts(p) {
  return '⚡'.repeat(Math.min(p, 5));
}

function makerExplain(maker) {
  if (!maker || maker === '?') return null;
  const lines = [];
  if (maker.includes('小西')) lines.push({
    name: '小西電機',
    icon: '◇',
    color: '#0c1222',
    desc: '関東の電気風呂の8割以上、全国最大シェア。白い◇型電極板が目印。「ラジエニア」ブランドでジワジワ型のパルス電流が特徴。'
  });
  if (maker.includes('坂田')) lines.push({
    name: '坂田電気工業所',
    icon: '●',
    color: '#fff',
    desc: 'すでに廃業済み。白い●型電極板、アナログ半自動でランダム発振、ドンドン型の刺激。今や絶滅危惧種で出会えたら超レア。'
  });
  if (maker.includes('水野')) lines.push({
    name: '水野通信工業',
    icon: '■',
    color: '#0c1222',
    desc: '名古屋拠点。黒い電極板、「揉兵衛（じゅうべえ）」ブランド。押す・揉む・叩くの3種刺激でガッツン系。'
  });
  return lines;
}

function statusBadge(status) {
  if (status === '閉店') return `<span class="stamp text-white" style="background:#0c1222;border-color:#0c1222">CLOSED ✕ 閉店</span>`;
  if (status === '休業中') return `<span class="stamp text-bath-dark" style="background:#fef3c7;border-color:#0c1222">休業中</span>`;
  if (status === '閉店の可能性') return `<span class="stamp text-stamp-red" style="background:#fff;border-color:#ff4040">閉店の可能性？</span>`;
  return '';
}

// === Template ===
function genPage(f) {
  const nearest = findNearest(f);
  const sameMaker = findSameMaker(f);
  const isClosed = f.status === '閉店';
  const isHiatus = f.status === '休業中';
  const memoSafe = escapeHtml(f.memo === '?' ? '' : (f.memo || ''));
  const makerInfo = makerExplain(f.maker);

  // SEO: title and description
  const title = `${f.name}｜${f.ward}の電気風呂・サウナ｜パワー${f.power}/5｜ビリビリ君`;
  const desc = `${f.name}（${f.area}${f.ward}）の電気風呂情報。${f.station}（${f.stationLine}）${f.walkMin ? `徒歩${f.walkMin}分。` : ''}${f.maker && f.maker !== '?' ? `メーカー：${f.maker}。` : ''}パワー${powerLabel(f.power)}（${f.power}/5）。${(f.memo && f.memo !== '?' ? f.memo.replace(/\n/g, ' ').replace(/\s+/g, ' ').slice(0, 80) : '')}`;
  const descSafe = escapeHtml(desc.slice(0, 160));

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://denki.schema.tokyo/facility/${f.id}.html`,
    name: f.name,
    image: 'https://denki.schema.tokyo/og-image.png',
    address: {
      '@type': 'PostalAddress',
      streetAddress: f.address,
      addressLocality: f.ward,
      addressRegion: f.area,
      addressCountry: 'JP'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: f.lat,
      longitude: f.lng
    },
    url: `https://denki.schema.tokyo/facility/${f.id}.html`,
    isAccessibleForFree: false,
    priceRange: f.price ? `¥${f.price}` : undefined,
    description: desc.slice(0, 300),
  };
  if (isClosed) jsonLd['@type'] = ['LocalBusiness'], jsonLd.specialOpeningHoursSpecification = [{
    '@type': 'OpeningHoursSpecification',
    validFrom: '2024-01-01',
    validThrough: '2099-12-31',
    description: '閉店済み'
  }];

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://denki.schema.tokyo/' },
      { '@type': 'ListItem', position: 2, name: f.area, item: `https://denki.schema.tokyo/?area=${encodeURIComponent(f.area)}` },
      { '@type': 'ListItem', position: 3, name: f.name }
    ]
  };

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${descSafe}">
<meta name="keywords" content="${escapeHtml(f.name)},電気風呂,銭湯,${escapeHtml(f.station)},${escapeHtml(f.ward)},${escapeHtml(f.area)}${f.maker && f.maker !== '?' ? ',' + escapeHtml(f.maker) : ''}">
<meta name="robots" content="${isClosed ? 'index,follow' : 'index,follow'}">
<link rel="canonical" href="https://denki.schema.tokyo/facility/${f.id}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(f.name)}｜${escapeHtml(f.ward)}の電気風呂">
<meta property="og:description" content="${descSafe}">
<meta property="og:url" content="https://denki.schema.tokyo/facility/${f.id}.html">
<meta property="og:image" content="https://denki.schema.tokyo/og-image.png">
<meta property="og:site_name" content="ビリビリ君">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(f.name)}｜ビリビリ君">
<meta name="twitter:description" content="${descSafe}">
<meta name="twitter:image" content="https://denki.schema.tokyo/og-image.png">
<meta name="theme-color" content="#0c1222">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        denki: {50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e'},
        bath: {dark:'#0c1222',navy:'#131b2e',blue:'#1a2744'},
        soda: {50:'#e7f9ff',100:'#c3f0ff',500:'#00b7e0',600:'#0092b5'},
        stamp: {red:'#ff4040',ink:'#0c1222',paper:'#fff8e7'}
      },
      fontFamily: {
        sans: ['Inter','Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','sans-serif'],
        display: ['"Zen Kaku Gothic New"','"Noto Sans JP"','Inter','sans-serif'],
        mono: ['"JetBrains Mono"','ui-monospace','"SFMono-Regular"','monospace']
      }
    }
  }
}
</script>
<style>
.text-body{color:#3d4b5f}
.header-bg{background:linear-gradient(135deg,#0c1222 0%,#131b2e 50%,#1a2744 100%)}
.electric-glow{text-shadow:0 0 10px rgba(250,204,21,.4),0 0 30px rgba(250,204,21,.1)}
@keyframes header-pulse{0%,100%{filter:drop-shadow(0 0 4px rgba(250,204,21,.4))}50%{filter:drop-shadow(0 0 12px rgba(250,204,21,.8))}}
.header-bolt{animation:header-pulse 2s ease-in-out infinite}
.paper-bg{background-color:#fff8e7;background-image:radial-gradient(circle at 20% 30%, rgba(255,64,64,0.04) 0, transparent 40%),radial-gradient(circle at 80% 70%, rgba(0,183,224,0.05) 0, transparent 40%),repeating-linear-gradient(45deg, rgba(12,18,34,0.025) 0 1px, transparent 1px 8px)}
.display-kana{font-family:'Zen Kaku Gothic New',sans-serif;font-weight:900;letter-spacing:-0.02em;line-height:0.95}
.display-eng{font-family:'Bebas Neue','Zen Kaku Gothic New',sans-serif;letter-spacing:0.08em;line-height:0.9}
.stamp{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:2px solid currentColor;border-radius:3px;font-family:'Bebas Neue','Zen Kaku Gothic New',sans-serif;letter-spacing:0.12em;font-size:12px;font-weight:700;transform:rotate(-2deg)}
.checker-ribbon{height:12px;background:linear-gradient(135deg,transparent 25%,#0c1222 25% 50%,transparent 50% 75%,#0c1222 75%),linear-gradient(135deg,#facc15 0 100%);background-size:16px 16px,100% 100%}
.zine-card{border:2px solid #0c1222;box-shadow:4px 4px 0 0 #0c1222;background:#fff;transition:all .15s ease}
.zine-card:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 0 #0c1222}
.ink-under{background:linear-gradient(to top,#facc15 0 30%,transparent 30%)}
.bolt-on{color:#facc15;filter:drop-shadow(0 0 3px rgba(250,204,21,.5))}
.bolt-off{color:#cbd5e1}
${isClosed ? '.closed-overlay{position:relative}.closed-overlay::after{content:"閉店";position:absolute;top:30%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);font-size:clamp(60px,12vw,140px);font-family:"Zen Kaku Gothic New",sans-serif;font-weight:900;color:#ff4040;border:8px solid #ff4040;padding:8px 24px;background:rgba(255,255,255,.85);pointer-events:none;letter-spacing:.1em;z-index:5}' : ''}
</style>
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(breadcrumbLd, null, 2)}
</script>
</head>
<body class="bg-stamp-paper min-h-screen font-sans">

<header class="header-bg border-b-4 border-denki-400 sticky top-0 z-[1000]">
  <div class="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
    <a href="../" class="flex items-center gap-3 no-underline shrink-0">
      <img src="../mascot.svg" alt="ビリビリ君" class="w-12 h-14 header-bolt">
      <div class="leading-none">
        <div class="flex items-baseline gap-2">
          <h1 class="display-kana text-white text-2xl md:text-[28px] electric-glow">ビリビリ君</h1>
          <span class="hidden sm:inline display-eng text-denki-400 text-sm">BIRIBIRI-KUN</span>
        </div>
        <p class="text-[11px] text-denki-200 tracking-wider mt-1 font-mono">⚡ ELECTRIC BATH ATLAS</p>
      </div>
    </a>
    <nav class="hidden md:flex items-center gap-1" aria-label="メインナビゲーション">
      <a href="../" class="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-2 border-transparent">⚡ 探す</a>
      <a href="../about.html" class="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-2 border-transparent">電気風呂とは</a>
      <a href="../history.html" class="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-2 border-transparent">歴史</a>
      <a href="../post.html" class="px-3 py-2 text-sm font-medium text-white bg-stamp-red/80 hover:bg-stamp-red rounded-lg transition-colors border-2 border-stamp-red">+ 投稿</a>
    </nav>
  </div>
</header>

<div class="checker-ribbon"></div>

<!-- Breadcrumb -->
<nav aria-label="パンくず" class="max-w-5xl mx-auto px-4 md:px-8 pt-4">
  <ol class="flex flex-wrap items-center gap-2 text-xs font-mono text-bath-dark/70">
    <li><a href="../" class="hover:text-bath-dark underline decoration-dotted">HOME</a></li>
    <li>›</li>
    <li><a href="../?area=${encodeURIComponent(f.area)}" class="hover:text-bath-dark underline decoration-dotted">${escapeHtml(f.area)}</a></li>
    <li>›</li>
    <li class="text-bath-dark font-bold">${escapeHtml(f.name)}</li>
  </ol>
</nav>

<!-- Hero -->
<section class="paper-bg border-b-2 border-bath-dark relative overflow-hidden ${isClosed ? 'closed-overlay' : ''}">
  <div class="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10 relative">
    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <span class="stamp text-stamp-red bg-white">#${String(f.id).padStart(3, '0')}</span>
      ${f.status && f.status !== '営業中' ? statusBadge(f.status) : ''}
      ${f.maker && f.maker !== '?' ? `<span class="stamp text-soda-600 bg-white" style="transform:rotate(2deg)">${escapeHtml(f.maker.includes('小西') ? 'KONISHI' : f.maker.includes('坂田') ? 'SAKATA' : f.maker.includes('水野') ? 'MIZUNO' : 'MIX')}</span>` : ''}
    </div>
    <h2 class="display-kana text-[34px] md:text-[56px] text-bath-dark mb-2 leading-tight">
      <span class="ink-under">${escapeHtml(f.name)}</span>
    </h2>
    <p class="text-lg text-bath-dark/80 mb-3">${escapeHtml(f.area)}${escapeHtml(f.ward)}${f.area !== f.ward ? '' : ''}${f.station ? ` ／ ${escapeHtml(f.station)}（${escapeHtml(f.stationLine)}）${f.walkMin ? ' 徒歩' + f.walkMin + '分' : ''}` : ''}</p>
    <div class="flex items-center gap-3 mt-4">
      <div class="text-3xl">${powerBolts(f.power).split('').map((_,i) => `<span class="${i < f.power ? 'bolt-on' : 'bolt-off'}">⚡</span>`).join('')}</div>
      <span class="display-eng text-stamp-red text-xl">${powerLabel(f.power)} / POWER ${f.power}/5</span>
    </div>
  </div>
</section>

<main class="max-w-5xl mx-auto px-4 md:px-8 py-8">

  ${(f.memo && f.memo !== '?') ? `
  <!-- Memo -->
  <section class="zine-card rounded-lg p-5 md:p-6 mb-6">
    <h3 class="display-kana text-xl text-bath-dark mb-3">📝 体験メモ</h3>
    <p class="text-sm md:text-base text-bath-dark/90 leading-relaxed whitespace-pre-line">${memoSafe}</p>
  </section>
  ` : ''}

  <!-- Basic Info -->
  <section class="zine-card rounded-lg p-5 md:p-6 mb-6">
    <h3 class="display-kana text-xl text-bath-dark mb-4">⚡ 基本情報</h3>
    <dl class="grid sm:grid-cols-2 gap-4 text-sm">
      <div><dt class="font-mono text-xs text-soda-600 mb-1">住所 / ADDRESS</dt><dd class="text-bath-dark font-bold">${escapeHtml(f.address)}</dd></div>
      <div><dt class="font-mono text-xs text-soda-600 mb-1">最寄り駅 / STATION</dt><dd class="text-bath-dark font-bold">${escapeHtml(f.station)}（${escapeHtml(f.stationLine)}）${f.walkMin ? '<br>徒歩' + f.walkMin + '分' : ''}</dd></div>
      ${f.maker && f.maker !== '?' ? `<div><dt class="font-mono text-xs text-soda-600 mb-1">メーカー / MAKER</dt><dd class="text-bath-dark font-bold">${escapeHtml(f.maker)}</dd></div>` : ''}
      ${f.type && f.type !== '?' ? `<div><dt class="font-mono text-xs text-soda-600 mb-1">タイプ / TYPE</dt><dd class="text-bath-dark font-bold">${escapeHtml(f.type)}</dd></div>` : ''}
      ${f.price ? `<div><dt class="font-mono text-xs text-soda-600 mb-1">料金 / PRICE</dt><dd class="text-bath-dark font-bold">¥${f.price}</dd></div>` : ''}
      <div><dt class="font-mono text-xs text-soda-600 mb-1">パワー / POWER</dt><dd class="text-bath-dark font-bold">${powerBolts(f.power)} ${powerLabel(f.power)}（${f.power}/5）</dd></div>
    </dl>
    <div class="mt-5 flex flex-wrap gap-3">
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ' ' + f.address)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-bold bg-bath-dark text-denki-400 rounded-lg border-2 border-bath-dark hover:bg-bath-navy" style="box-shadow:3px 3px 0 0 #facc15">
        🗺 Google Mapsで開く
      </a>
      <button onclick="toggleVisited(${f.id})" id="visited-btn" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-bold rounded-lg border-2 border-bath-dark cursor-pointer transition-colors">
        <span id="visited-label">⚡ 行ったことある</span>
      </button>
    </div>
  </section>

  ${makerInfo ? `
  <!-- Maker explainer -->
  <section class="zine-card rounded-lg p-5 md:p-6 mb-6 bg-denki-50">
    <h3 class="display-kana text-xl text-bath-dark mb-3">🏭 メーカー解説</h3>
    ${makerInfo.map(m => `
      <div class="mb-3 last:mb-0">
        <h4 class="display-kana text-base text-bath-dark mb-1"><span class="inline-block w-6 h-6 leading-6 text-center mr-2 bg-bath-dark text-denki-400 rounded">${m.icon}</span>${escapeHtml(m.name)}</h4>
        <p class="text-sm text-bath-dark/80 ml-8 leading-relaxed">${escapeHtml(m.desc)}</p>
      </div>
    `).join('')}
    <p class="text-xs text-bath-dark/60 mt-3 ml-8"><a href="../about.html" class="underline decoration-dotted hover:text-bath-dark">→ 三大メーカーの違いを詳しく見る</a></p>
  </section>
  ` : ''}

  <!-- Map -->
  <section class="zine-card rounded-lg overflow-hidden mb-6">
    <div class="p-5 md:p-6 pb-0">
      <h3 class="display-kana text-xl text-bath-dark mb-3">📍 地図</h3>
    </div>
    <div id="mini-map" style="height:320px" class="border-t-2 border-bath-dark"></div>
  </section>

  ${nearest.length ? `
  <!-- Nearest -->
  <section class="mb-6">
    <h3 class="display-kana text-xl text-bath-dark mb-3 flex items-baseline gap-2">📍 近くの電気風呂 <span class="display-eng text-sm text-soda-600">/ NEARBY</span></h3>
    <div class="grid sm:grid-cols-2 gap-3">
      ${nearest.map(n => `
        <a href="${n.id}.html" class="zine-card rounded-lg p-4 block no-underline">
          <div class="flex items-center gap-2 text-[10px] font-mono text-soda-600 mb-1">
            <span>#${String(n.id).padStart(3, '0')}</span>
            <span class="text-bath-dark/40">·</span>
            <span class="font-bold">📍 ${n._dist < 10 ? n._dist.toFixed(1) : Math.round(n._dist)}km</span>
          </div>
          <h4 class="display-kana text-base text-bath-dark mb-1">${escapeHtml(n.name)}</h4>
          <div class="text-xs text-bath-dark/70">${escapeHtml(n.ward)} ／ ${escapeHtml(n.station)} ／ ${powerBolts(n.power)} ${powerLabel(n.power)}</div>
        </a>
      `).join('')}
    </div>
  </section>
  ` : ''}

  ${sameMaker.length ? `
  <!-- Same maker -->
  <section class="mb-6">
    <h3 class="display-kana text-xl text-bath-dark mb-3 flex items-baseline gap-2">🏭 同じメーカーの電気風呂 <span class="display-eng text-sm text-soda-600">/ SAME MAKER</span></h3>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${sameMaker.map(n => `
        <a href="${n.id}.html" class="zine-card rounded-lg p-4 block no-underline">
          <div class="flex items-center gap-2 text-[10px] font-mono text-soda-600 mb-1">
            <span>#${String(n.id).padStart(3, '0')}</span>
          </div>
          <h4 class="display-kana text-base text-bath-dark mb-1">${escapeHtml(n.name)}</h4>
          <div class="text-xs text-bath-dark/70">${escapeHtml(n.ward)} ／ ${powerBolts(n.power)}</div>
        </a>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- Bottom CTA -->
  <section class="text-center mt-10 mb-4">
    <a href="../" class="inline-flex items-center gap-2 h-12 px-6 text-base font-bold bg-bath-dark text-denki-400 rounded-lg border-2 border-bath-dark hover:bg-bath-navy" style="box-shadow:4px 4px 0 0 #facc15">
      ← すべての電気風呂を見る
    </a>
  </section>

</main>

<div class="checker-ribbon mt-8"></div>

<footer class="bg-bath-dark text-denki-200 py-8 px-4">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
    <div class="flex items-center gap-4">
      <img src="../mascot.svg" alt="" class="w-14 h-16" style="transform:rotate(-4deg)">
      <div>
        <div class="flex items-baseline gap-2">
          <span class="display-kana text-xl text-white">ビリビリ君</span>
          <span class="display-eng text-xs text-denki-400">BIRIBIRI-KUN</span>
        </div>
        <p class="text-[11px] text-denki-300/70 mt-1 font-mono">© 2026 — ELECTRIC BATH ATLAS</p>
      </div>
    </div>
    <div class="text-xs text-denki-200/70 text-center md:text-right leading-relaxed">
      <div class="flex gap-3 justify-center md:justify-end mt-2">
        <a href="../" class="text-denki-300 hover:text-denki-400 underline decoration-dotted">探す</a>
        <a href="../about.html" class="text-denki-300 hover:text-denki-400 underline decoration-dotted">とは</a>
        <a href="../history.html" class="text-denki-300 hover:text-denki-400 underline decoration-dotted">歴史</a>
        <a href="../post.html" class="text-denki-300 hover:text-denki-400 underline decoration-dotted">投稿</a>
      </div>
    </div>
  </div>
</footer>

<script>
// Visited toggle (localStorage shared with main site)
const FACILITY_ID = ${f.id};
function getVisited() { try { return JSON.parse(localStorage.getItem('denki-visited') || '{}'); } catch { return {}; } }
function setVisitedState(on) {
  const v = getVisited();
  if (on) v[FACILITY_ID] = Date.now();
  else delete v[FACILITY_ID];
  localStorage.setItem('denki-visited', JSON.stringify(v));
  updateBtn();
}
function isVisited() { return !!getVisited()[FACILITY_ID]; }
function updateBtn() {
  const btn = document.getElementById('visited-btn');
  const lbl = document.getElementById('visited-label');
  if (isVisited()) {
    btn.style.background = '#facc15';
    btn.style.color = '#0c1222';
    btn.style.boxShadow = '3px 3px 0 0 #ff4040';
    lbl.textContent = '⚡ 行った！';
  } else {
    btn.style.background = '#fff';
    btn.style.color = '#0c1222';
    btn.style.boxShadow = '3px 3px 0 0 #0c1222';
    lbl.textContent = '⚡ 行ったことある';
  }
}
function toggleVisited() {
  setVisitedState(!isVisited());
}
updateBtn();

// Mini map
const map = L.map('mini-map').setView([${f.lat}, ${f.lng}], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
}).addTo(map);
const icon = L.divIcon({
  className: 'custom-pin',
  html: '<div style="width:36px;height:36px;border-radius:50%;background:${f.power>=5?'#ef4444':f.power>=4?'#f59e0b':'#facc15'};border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:${f.power>=4?'white':'#0c1222'};font-size:14px;font-weight:bold">${f.power}</div>',
  iconSize: [36, 36], iconAnchor: [18, 18]
});
L.marker([${f.lat}, ${f.lng}], { icon }).addTo(map).bindPopup('<strong>${escapeHtml(f.name).replace(/'/g, "\\'")}</strong>');
</script>

</body>
</html>
`;
}

// === Generate ===
let generated = 0;
ALL.forEach(f => {
  const html = genPage(f);
  fs.writeFileSync(path.join(OUT_DIR, `${f.id}.html`), html, 'utf8');
  generated++;
});
console.log(`✅ Generated ${generated} facility pages in ${OUT_DIR}`);

// === Update sitemap ===
const sitemapPath = path.join(__dirname, 'sitemap.xml');
const today = new Date().toISOString().slice(0, 10);

const baseUrls = [
  { loc: 'https://denki.schema.tokyo/',              lastmod: today, changefreq: 'weekly',  priority: '1.0' },
  { loc: 'https://denki.schema.tokyo/about.html',    lastmod: today, changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://denki.schema.tokyo/history.html',  lastmod: today, changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://denki.schema.tokyo/post.html',     lastmod: today, changefreq: 'monthly', priority: '0.9' },
];

const facilityUrls = ALL.map(f => ({
  loc: `https://denki.schema.tokyo/facility/${f.id}.html`,
  lastmod: today,
  changefreq: 'monthly',
  priority: f.status === '営業中' ? '0.7' : '0.5'
}));

const urls = [...baseUrls, ...facilityUrls];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`✅ Updated sitemap.xml with ${urls.length} URLs`);
