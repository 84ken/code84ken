// ============================================
// TOTAL PUNKS — App Script
// ============================================

let currentLang = 'ja';

const bands = [
  // 77 Punk
  { name: "THE CLASH", genre: "77punk", page: "review/c/clash.htm", img: "review/c/image/londoncalling.jpg",
    yt: "The Clash London Calling",
    ja: "76年結成。パンク史上、いやロック史上最高峰のバンド。ジョー・ストラマーの魂は永遠に。",
    en: "Formed in '76. The greatest band in punk&mdash;no, rock history. Joe Strummer's spirit lives forever." },
  { name: "SEX PISTOLS", genre: "77punk", page: "review/s/sexpistols.htm", img: "review/s/image/nevermind.jpg",
    yt: "Sex Pistols Anarchy In The U.K.",
    ja: "唯一のアルバム「Never Mind The Bollocks」はパンクそのものを語るうえで絶対的必聴盤。",
    en: "Their sole album 'Never Mind The Bollocks' is the absolute essential record to understand punk." },
  { name: "RAMONES", genre: "77punk", page: "review/r/ramones.htm", img: "review/r/image/ramonesmania.jpg",
    yt: "Ramones Blitzkrieg Bop",
    ja: "74年結成。SEX PISTOLSにすら多大な影響を与えた一撃必殺伝説のロックンロールバンド。",
    en: "Formed in '74. The legendary one-shot-kill rock'n'roll band that even influenced the SEX PISTOLS." },
  { name: "THE DAMNED", genre: "77punk", page: "review/d/damned.htm", img: "review/d/image/damned.jpg",
    yt: "The Damned New Rose",
    ja: "PISTOLSやCLASHと並ぶ初期UKパンクの重要バンド。最初のUKパンクシングルをリリース。",
    en: "A key early UK punk band alongside the PISTOLS and CLASH. Released the first-ever UK punk single." },
  { name: "GENERATION X", genre: "77punk", page: "review/g/generationx.htm", img: "review/g/image/genaration.jpg",
    yt: "Generation X King Rocker",
    ja: "ビリー・アイドル率いる77パンクバンド。キャッチーでポップなパンクサウンド。",
    en: "Billy Idol's '77 punk band. Catchy, pop-infused punk sound." },
  { name: "EATER", genre: "77punk", page: "review/e/EATER.htm", img: "review/e/image/EATER.jpg",
    yt: "Eater Outside View",
    ja: "平均年齢15歳でデビューした早熟のパンクバンド。",
    en: "A precocious punk band that debuted at an average age of 15." },
  { name: "EDDIE AND THE HOT RODS", genre: "77punk", page: "review/e/eddieandthehotrods.htm", img: "review/e/image/lifeontheline.jpg",
    yt: "Eddie And The Hot Rods Do Anything You Wanna Do",
    ja: "パブロック/パンクの先駆者。「Do Anything You Wanna Do」は名曲。",
    en: "Pub rock/punk pioneers. 'Do Anything You Wanna Do' is a classic." },
  { name: "SLAUGHTER AND THE DOGS", genre: "77punk", page: "review/s/slaughter.htm", img: "review/s/image/doitsogstyle.jpg",
    yt: "Slaughter And The Dogs Cranked Up Really High",
    ja: "マンチェスター出身の初期UKパンクバンド。",
    en: "Early UK punk band from Manchester." },
  { name: "THE JAM", genre: "77punk", page: "review/j/jam.htm", img: "review/j/image/allmodcons.jpg",
    yt: "The Jam Town Called Malice",
    ja: "ポール・ウェラー率いるモッズパンクバンド。パンクとモッズの融合。82年絶頂期に解散。",
    en: "Paul Weller's mod-punk band. Fusing punk energy with mod sensibility. Disbanded at their peak in '82." },

  // UK Hardcore
  { name: "THE EXPLOITED", genre: "ukhc", page: "review/e/exploited.htm", img: "review/e/image/punksnotdead.jpg",
    yt: "The Exploited Punks Not Dead",
    ja: "「Punks Not Dead」で知られるUKハードコアの代表格。ウォーリーの巨大モヒカンは象徴的。",
    en: "UK hardcore icons known for 'Punks Not Dead'. Wattie's giant mohawk is iconic." },
  { name: "DISCHARGE", genre: "ukhc", page: "review/d/discharg.htm", img: "review/d/image/hearnothingseenothingsaynothing.jpg",
    yt: "Discharge Hear Nothing See Nothing Say Nothing",
    ja: "D-Beatの創始者。世界中のハードコアバンドに計り知れない影響を与えた。",
    en: "Creators of D-Beat. Their influence on hardcore bands worldwide is immeasurable." },
  { name: "G.B.H", genre: "ukhc", page: "review/g/GBH.htm", img: "review/g/image/nosurvivors.jpg",
    yt: "GBH City Baby Attacked By Rats",
    ja: "バーミンガム出身。UK82ハードコアパンクを代表するバンドの一つ。",
    en: "From Birmingham. One of the defining bands of UK82 hardcore punk." },
  { name: "CHAOS U.K.", genre: "ukhc", page: "review/c/chaosuk.htm", img: "review/c/image/chaosu.k..jpg",
    yt: "Chaos UK No Security",
    ja: "ブリストル出身のノイズコアバンド。カオティックなサウンドが特徴。",
    en: "Noisecore band from Bristol. Defined by their chaotic sound." },
  { name: "CHAOTIC DISCHORD", genre: "ukhc", page: "review/c/chaoticdischord.htm", img: "review/c/image/fuckthelotofyou.jpg",
    yt: "Chaotic Dischord Glue Sniffing",
    ja: "VICE SQUADのメンバーによるサイドプロジェクト。",
    en: "Side project by members of VICE SQUAD." },
  { name: "ENGLISH DOGS", genre: "ukhc", page: "review/e/englishdogs.htm", img: "review/e/image/bowtonone.jpg",
    yt: "English Dogs Mad Punx and English Dogs",
    ja: "UKハードコアからメタルクロスオーバーへと進化したバンド。",
    en: "A band that evolved from UK hardcore into metal crossover." },
  { name: "THE VARUKERS", genre: "ukhc", page: "review/v/varukers.htm", img: "review/v/image/varukers.jpg",
    yt: "The Varukers Die For Your Government",
    ja: "DISCHARGEの影響を色濃く受けたUKハードコアバンド。",
    en: "UK hardcore band heavily influenced by DISCHARGE." },
  { name: "ABRASIVE WHEELS", genre: "ukhc", page: "review/a/abrasive.htm", img: "review/a/image/whenthepunks.jpg",
    yt: "Abrasive Wheels Vicious Circle",
    ja: "リーズ出身のUKパンク/ハードコアバンド。",
    en: "UK punk/hardcore band from Leeds." },
  { name: "VICE SQUAD", genre: "ukhc", page: "review/v/vicesquad.htm", img: "review/v/image/lastlockers.jpg",
    yt: "Vice Squad Last Rockers",
    ja: "ベッキー・ボンデージ率いるブリストルのパンクバンド。",
    en: "Bristol punk band fronted by Beki Bondage." },
  { name: "THE ENEMY", genre: "ukhc", page: "review/e/theenemy.htm", img: "review/e/image/punksalive.jpg",
    yt: "The Enemy UK 50,000 Dead",
    ja: "UKハードコアシーンの一角を担ったバンド。",
    en: "A band that carved out a place in the UK hardcore scene." },
  { name: "TOTAL CHAOS", genre: "ukhc", page: "review/t/totalchaos.htm", img: "review/t/image/anthemfrom.jpg",
    yt: "Total Chaos Riot City",
    ja: "LA出身ながらUK的なハードコアパンクサウンド。",
    en: "From LA but with a distinctly UK-style hardcore punk sound." },
  { name: "ANTI NOWHERE LEAGUE", genre: "ukhc", page: "review/a/antinowhere.htm", img: "review/a/image/wearetheleagueliveinyogosla.jpg",
    yt: "Anti Nowhere League Streets Of London",
    ja: "過激なライブパフォーマンスで知られるUKパンクバンド。",
    en: "UK punk band notorious for their extreme live performances." },
  { name: "ONEWAY SYSTEM", genre: "ukhc", page: "review/o/oneway.htm", img: "review/o/image/allsystemsgo.jpg",
    yt: "One Way System Jerusalem",
    ja: "UK82パンクの重要バンド。キャッチーかつハードなサウンド。",
    en: "Key UK82 punk band. Catchy yet hard-hitting sound." },

  // Oi! / Skins
  { name: "COCKNEY REJECTS", genre: "oi", page: "review/c/cockney.htm", img: "review/c/image/greatestohits3.jpg",
    yt: "Cockney Rejects Oi Oi Oi",
    ja: "Oi!ムーブメントの火付け役。ウエストハムの応援歌でも有名。",
    en: "Sparked the Oi! movement. Also famous for the West Ham anthem." },
  { name: "COCK SPARRER", genre: "oi", page: "review/c/cocksparrer.htm", img: "review/c/image/runningriot.jpg",
    yt: "Cock Sparrer England Belongs To Me",
    ja: "72年結成のOi!/ストリートパンクの元祖。アンセム製造機。",
    en: "Formed in '72. The godfathers of Oi!/street punk. An anthem machine." },
  { name: "4SKINS", genre: "oi", page: "review/f/4skins.htm", img: "review/f/image/bestof4skins.jpg",
    yt: "4 Skins Chaos",
    ja: "Oi!ムーブメントの中心的バンド。ストリートの声を代弁した。",
    en: "Central band of the Oi! movement. Voice of the streets." },
  { name: "BLITZ", genre: "oi", page: "review/b/blitz.htm", img: "review/b/image/blitzedanall.jpg",
    yt: "Blitz Someone's Gonna Die",
    ja: "ニューミルズ出身。Oi!からニューウェーブへと進化を遂げたバンド。",
    en: "From New Mills. Evolved from Oi! into new wave." },
  { name: "THE BUSINESS", genre: "oi", page: "review/b/business.htm", img: "review/b/image/suburbanrebels.jpg",
    yt: "The Business Suburban Rebels",
    ja: "サウスロンドン出身のOi!バンド。「Suburban Rebels」は名盤。",
    en: "South London Oi! band. 'Suburban Rebels' is a classic." },
  { name: "THE OPPRESSED", genre: "oi", page: "review/o/oppressed.htm", img: "review/o/image/oioimusic.jpg",
    yt: "The Oppressed Victims",
    ja: "ウェールズ出身の反レイシズムOi!バンド。",
    en: "Anti-racist Oi! band from Wales." },
  { name: "ANGELIC UPSTARTS", genre: "oi", page: "review/a/angelic.htm", img: "review/a/image/bombedout.jpg",
    yt: "Angelic Upstarts Teenage Warning",
    ja: "サウスシールズ出身。ワーキングクラスの怒りを体現したOi!パンク。",
    en: "From South Shields. Oi! punk embodying working class rage." },
  { name: "RED ALERT", genre: "oi", page: "review/r/redalert.htm", img: "review/r/image/wegotthepower.jpg",
    yt: "Red Alert In Britain",
    ja: "サンダーランド出身のOi!バンド。",
    en: "Oi! band from Sunderland." },
  { name: "SECTION 5", genre: "oi", page: "review/s/section5.htm", img: "review/s/image/section5.jpg",
    yt: "Section 5 We Don't Care",
    ja: "ストリートパンク/Oi!シーンの重要バンド。",
    en: "Key band in the street punk/Oi! scene." },
  { name: "THE ADICTS", genre: "oi", page: "review/a/adicts.htm", img: "review/a/image/soundofmusic.jpg",
    yt: "The Adicts Viva La Revolution",
    ja: "「時計じかけのオレンジ」をモチーフにした独自のビジュアルとポップパンクサウンド。",
    en: "'A Clockwork Orange'-inspired visuals with pop punk sound." },
  { name: "SHAM 69", genre: "oi", page: "review/s/sham69.htm", img: "review/s/image/thegame.jpg",
    yt: "Sham 69 If The Kids Are United",
    ja: "ジミー・パーシーが率いたストリートパンクの先駆者。Oi!ムーブメントに多大な影響。",
    en: "Street punk pioneers led by Jimmy Pursey. Hugely influential on the Oi! movement." },

  // Street Punk
  { name: "THE CASUALTIES", genre: "streetpunk", page: "review/c/casualties.htm", img: "review/c/image/diehard.jpg",
    yt: "The Casualties Unknown Soldier",
    ja: "NYストリートパンクの代表格。巨大モヒカンとスタッズだらけのルックス。",
    en: "Icons of NY street punk. Giant mohawks and studs everywhere." },
  { name: "BLANKS 77", genre: "streetpunk", page: "review/b/blanks77.htm", img: "review/b/image/killerblanks.jpg",
    yt: "Blanks 77 Killer Blanks",
    ja: "NJストリートパンク。キャッチーで攻撃的なサウンド。",
    en: "NJ street punk. Catchy and aggressive sound." },
  // US Hardcore / Punk
  { name: "DEAD KENNEDYS", genre: "ushc", page: "review/d/deadkennedys.htm", img: "review/d/image/freshfruit.jpg",
    yt: "Dead Kennedys Holiday In Cambodia",
    ja: "ジェロ・ビアフラ率いるSFハードコアバンド。政治的な歌詞とサーフギターが特徴。",
    en: "SF hardcore band led by Jello Biafra. Political lyrics and surf guitar." },
  { name: "AGNOSTIC FRONT", genre: "ushc", page: "review/a/agnostic.htm", img: "review/a/image/libertyjustice.jpg",
    yt: "Agnostic Front Gotta Go",
    ja: "NYハードコアの重鎮。CBGBを拠点に活動。",
    en: "NYHC legends. Based out of CBGB." },
  { name: "DROPKICK MURPHYS", genre: "ushc", page: "review/d/dropkick.htm", img: "review/d/image/singloud.jpg",
    yt: "Dropkick Murphys Shipping Up To Boston",
    ja: "ボストン出身。アイリッシュパンクの代表格。",
    en: "From Boston. The face of Irish punk." },

  // Melodic / Ska
  { name: "RANCID", genre: "melodic", page: "review/r/rancid.htm", img: "review/r/image/rancid.jpg",
    yt: "Rancid Time Bomb",
    ja: "OPERATION IVYの遺伝子を継ぐスカパンクバンド。90年代パンクリバイバルの立役者。",
    en: "Ska-punk carrying OPERATION IVY's DNA. Key players in the '90s punk revival." },
  { name: "OPERATION IVY", genre: "melodic", page: "review/o/oprationivy.htm", img: "review/o/image/1987-operationivy.jpg",
    yt: "Operation Ivy Knowledge",
    ja: "スカコアの伝説。わずか2年の活動ながら後世に多大な影響を残した。",
    en: "Ska-core legends. Only active for 2 years but left an enormous legacy." },
  { name: "BAD RELIGION", genre: "melodic", page: "review/b/badreligon.htm", img: "review/b/image/suffer.jpg",
    yt: "Bad Religion 21st Century Digital Boy",
    ja: "メロディックパンクの開祖。知的な歌詞とコーラスワークが特徴。",
    en: "Godfathers of melodic punk. Known for intellectual lyrics and vocal harmonies." },
  { name: "GREEN DAY", genre: "melodic", page: "review/g/greenday.htm", img: "review/g/image/dookie.jpg",
    yt: "Green Day Basket Case",
    ja: "「Dookie」でパンクをメインストリームに押し上げた。",
    en: "'Dookie' pushed punk into the mainstream." },
  { name: "THE OFFSPRING", genre: "melodic", page: "review/o/offspring.htm", img: "review/o/image/smash.jpg",
    yt: "The Offspring Self Esteem",
    ja: "「Smash」はインディーズ史上最も売れたアルバムに。",
    en: "'Smash' became the best-selling independent album ever." },
  { name: "PENNYWISE", genre: "melodic", page: "review/p/pennywise.htm", img: "review/p/image/unknownroad.jpg",
    yt: "Pennywise Bro Hymn",
    ja: "ハモビーチ出身のメロディックパンク。Epitaphの看板バンド。",
    en: "Melodic punk from Hermosa Beach. Epitaph's flagship band." },
  { name: "DANCE HALL CRASHERS", genre: "melodic", page: "review/d/dancehall.htm", img: "review/d/image/honey.jpg",
    yt: "Dance Hall Crashers Enough",
    ja: "OPERATION IVYのメンバーが結成。女性ボーカルのスカパンク。",
    en: "Formed by OPERATION IVY members. Female-fronted ska punk." },
  { name: "STIFF LITTLE FINGERS", genre: "melodic", page: "review/s/stiff.htm", img: "review/s/image/stiffliveandloud.jpg",
    yt: "Stiff Little Fingers Alternative Ulster",
    ja: "北アイルランド出身。政治的メッセージとメロディックなサウンド。",
    en: "From Northern Ireland. Political message with melodic sound." },
  { name: "THE DISTILLERS", genre: "melodic", page: "review/d/thedistillers.htm", img: "review/d/image/distillers.jpg",
    yt: "The Distillers City of Angels",
    ja: "ブロディ・ダル率いるガレージパンクバンド。",
    en: "Garage punk band fronted by Brody Dalle." },
  { name: "PETER AND THE TEST TUBE BABIES", genre: "melodic", page: "review/p/thepeterand.htm", img: "review/p/image/pissedandproud.jpg",
    yt: "Peter And The Test Tube Babies Banned From The Pubs",
    ja: "ブライトン出身のユーモラスなパンクバンド。",
    en: "Humorous punk band from Brighton." },

  // Japan
  { name: "SA", genre: "jp", page: "review/s/sa.htm", img: "review/s/image/greatoperation.jpg",
    yt: "SA GREAT OPERATION",
    ja: "日本のストリートパンクシーンを代表するバンド。",
    en: "A band representing Japan's street punk scene." },
  { name: "GUITAR WOLF", genre: "jp", page: "review/g/GUTERWOLF.htm", img: "review/g/image/GUTERWOLF1.jpg",
    yt: "Guitar Wolf Jet Generation",
    ja: "世界最大音量のジェットロックンロールバンド。",
    en: "The world's loudest jet rock'n'roll band." },

  // VA
  { name: "VA (Various Artists)", genre: "oi", page: "review/va/va.html", img: "review/va/image/punkanddisordery.jpg",
    yt: null,
    ja: "Punk and Disorderly、Oi! Unitedなど、パンクの名コンピレーションを紹介。",
    en: "Essential punk compilations: Punk and Disorderly, Oi! United, and more." },
];

// ============================================
// Render Cards
// ============================================
const grid = document.getElementById('cards-grid');

const genreLabels = {
  '77punk': '77 Punk',
  'ukhc': 'UK Hardcore',
  'oi': 'Oi! / Skins',
  'streetpunk': 'Street Punk',
  'ushc': 'US Hardcore',
  'melodic': 'Melodic / Ska',
  'jp': 'Japan'
};

function renderCards(filter) {
  const filtered = filter === 'all' ? bands : bands.filter(b => b.genre === filter);
  grid.innerHTML = '';

  filtered.forEach((band, i) => {
    const card = document.createElement('a');
    card.href = band.page;
    card.className = 'card';
    card.style.animationDelay = `${i * 0.03}s`;

    const rot = (Math.random() - 0.5) * 2.5;
    card.style.setProperty('--rot', rot + 'deg');

    const imgHtml = band.img
      ? `<img src="${band.img}" alt="${band.name}" loading="lazy">`
      : `<div class="card-img-placeholder">${band.name.charAt(0)}</div>`;

    const desc = currentLang === 'en' ? band.en : band.ja;

    card.innerHTML = `
      <div class="card-img-wrap">${imgHtml}</div>
      <span class="card-tag">${genreLabels[band.genre]}</span>
      <h3 class="card-title">${band.name}</h3>
      <p class="card-desc">${desc}</p>
    `;
    grid.appendChild(card);
  });
}

renderCards('all');

// ============================================
// Filter
// ============================================
let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderCards(currentFilter);
  });
});

document.querySelectorAll('.genre-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const filter = card.dataset.filter;
    document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
      });
      currentFilter = filter;
      renderCards(filter);
    }, 400);
  });
});

// ============================================
// Language Toggle
// ============================================
function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  // Update all elements with data-ja / data-en attributes
  document.querySelectorAll('[data-ja][data-en]').forEach(el => {
    el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.ja;
  });

  // Update toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.textContent = lang === 'ja' ? 'EN' : 'JA';
    btn.classList.toggle('active', lang === 'en');
  });

  // Re-render cards with new language
  renderCards(currentFilter);
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setLang(currentLang === 'ja' ? 'en' : 'ja');
  });
});

// ============================================
// Mobile Menu
// ============================================
const menuBtn = document.querySelector('.menu-btn');
const mobileNav = document.querySelector('.mobile-nav');

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('active');
  mobileNav.classList.toggle('open');
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.classList.remove('active');
    mobileNav.classList.remove('open');
  });
});
