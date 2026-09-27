'use strict';
// ===================================================================
// STUDY QUEST v4 — Undertale-style engine
// ===================================================================
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const SOUL_PATH = 'M2 2h4v1h1v1h2V3h1V2h4v1h1v5h-1v1h-1v1h-1v1h-1v1h-1v1H9v1H7v-1H6v-1H5v-1H4v-1H3V9H2V8H1V3h1z';
const SOUL_SVG = '<svg class="soul" viewBox="0 0 16 16"><use href="#i-soul"/></svg>';

// A flow (battle, story, game over) owns a run id. Leaving the flow bumps runId,
// and any pending await in the old flow throws CANCEL at its next checkpoint.
const CANCEL = { cancelled: true };
let runId = 0;
const newRun = () => ++runId;
const guard = fn => (...a) => Promise.resolve().then(() => fn(...a)).catch(e => { if (e !== CANCEL) console.error(e); });

// ===================================================================
// STATE / SAVE
// ===================================================================
let state = {
  playerName: '', subject: 'math',
  playerHp: 100, playerMaxHp: 100, playerAtk: 15,
  playerLevel: 1, playerExp: 0, expToNext: 30,
  combo: 0, maxCombo: 0,
  stage: 1, totalDefeated: 0, totalSpared: 0,
  gold: 0,
  items: { candy: 1, toast: 0, pie: 0 },
  equipment: { excalibur: false, scale: false, fudebako: false },
  subjectClears: { math: false, japanese: false, science: false, social: false, english: false },
  subjectCorrect: { math: 0, japanese: 0, science: 0, social: 0, english: 0 },
  enemy: null, enemyHp: 0, enemyMaxHp: 0,
  usedQuestions: [],
  introSeen: false, storyChapter: 0, superUnlocked: false, superBeaten: false,
  monsterBook: {},
};

const SUBJECT_JA = { math:'さんすう', japanese:'こくご', science:'りか', social:'しゃかい', english:'えいご' };
const SUBJECT_EN = { math:'MATH', japanese:'KOKUGO', science:'SCIENCE', social:'SOCIAL', english:'ENGLISH' };
const SUBJECT_BENEFIT = {
  math:'クリティカルが でやすくなった!',
  japanese:'みのがしが しやすくなった!',
  science:'たべものの かいふくが 1.5ばいに なった!',
  social:'もらえる ゴールドが 1.3ばいに なった!',
  english:'もらえる EXPが 1.2ばいに なった!',
};
const RANK_NAMES = ['', 'みならい', 'いっちょまえ', 'はかせ', 'かみさま'];
const RANK_STEPS = [10, 30, 60, 100];
function subjectRank(subject) {
  const n = (state.subjectCorrect && state.subjectCorrect[subject]) || 0;
  return RANK_STEPS.filter(s => n >= s).length;
}

const ITEMS = {
  candy: { name:'おかあさんの おにぎり', short:'おにぎり', desc:'HP +15', heal:15, price:10,
    useMsg:'* おにぎりを たべた。\n* なかみは しゃけだった。あたりだ。' },
  toast: { name:'ばあちゃんの カレー', short:'カレー', desc:'HP +40', heal:40, price:25,
    useMsg:'* カレーを たべた。\n* ばあちゃんの あじが した。ちからが わく!' },
  pie:   { name:'おふろあがりの プリン', short:'プリン', desc:'HP ぜんかいふく', heal:'full', price:60,
    useMsg:'* プリンを たべた。\n* ちきゅうが すくわれる あじが する!' },
};
const BADGE = { name:'けずりたての えんぴつ', desc:'ATK +2 (ずっと)', price:100 };
const LEGENDARY = {
  excalibur: { name:'エクスカリバー2B', desc:'ATK +10', price:999, lore:'ゆうしゃだけが けずれる でんせつの えんぴつ。かきごこち むてき。' },
  scale:     { name:'りゅうのうろこの したじき', desc:'うけるダメージ 30%カット', price:777, lore:'シメキリュウの ぬけがらで できている。じょうぶ。' },
  fudebako:  { name:'ほしのふでばこ', desc:'さいだいHP +50', price:1500, lore:'よぞらの かけらで できた ふでばこ。もつと あんしんする。' },
};

const BOSS_CHAPTER = { mendokusai:1, suitoru:2, shimekiryu:3, atomawashi:4, hachigatsu:5 };
const STORY = {
  1: [
    'ニュースそくほう。\nせかいの こどもたちが すこしだけ\nしゅくだいを やるように なったらしい。',
    'おかあさんたちが なんだか やさしい。\nカレーの おかわりが ふえた。\nちきゅうは すこし かるくなった。',
    'でも うちゅうの おくから、\nまだ ゴウンゴウンという おとが\nきこえてくる…',
  ],
  2: [
    'すいとられていた「やるき」が\nせかいじゅうに かえっていく。\nとなりの おじさんも さんぽを はじめた。',
    'テンイン星人から てがみが きた。\n「そろそろ おおものが うごきだす。\nプリンを たべて そなえて」',
  ],
  3: [
    'ちきゅうの とけいが\nただしい はやさで うごきだした。\nあしたは ちゃんと あしたに くる。',
    'そのとき。そらの おくで\nおおきな むらさきいろの うずが\nゆっくりと まわりはじめた…',
    'あとまわし星人の おうさま。\nアトマワシ大王の おでましだ。',
  ],
  4: [
    'アトマワシ大王は ほしに かえった。\nちきゅうの「あとでやる」は\nちいさな こえに もどった。',
    'せかいの こどもたちは きょうも\nしゅくだいを やったり、やらなかったり\nしている。それで いいのだ。',
    'きみは ちきゅうを すくった。\nしゅくだいを やっただけなのに。\n\n— THE END —',
    '…と おもったら。\n\nカレンダーの さいごの ページが\nカサリと めくれる おとが した。',
    '『8がつ31にち』。\nすべての こどもが おそれる\nさいきょうの まものが めを さました。',
    'タイトルがめんに あかい もじが\nあらわれた。じゅんびが できたら こい。\nプリンを わすれるな。',
  ],
  5: [
    'たたかいが おわった。\nきえていくまえに、8がつ31にちは\nちいさな こえで いった。',
    '「ぼくはね、ほんとうは\nたのしみだったんだ。\nなつやすみの さいごに、みんなが\nあわてて ぼくのところに くるのが」',
    '「ことしは だれも こなかった。\nみんな ちゃんと おわらせてたから。\n…うれしいような、\nすこし さみしいような」',
    'きみは すこし かんがえて、\nやりのこしていた「ドッジボール」に\n8がつ31にちを さそった。',
    'さいきょうの まものは その日、\nうまれて はじめて、なつやすみの さいごを\nだれかと いっしょに あそんで すごした。',
    'なつやすみの さいごのひは、\nしゅくだいが おわっていれば\nせかいで いちばん たのしい ひに なる。\n\nきみは それを しょうめいした。',
    'おめでとう。そして ありがとう。\n\n— ほんとうの THE END —\n\n(しゅくだいは あしたも あるけどね)',
    '…そのころ。\nとおい ほしの かいぎしつで、\nあたらしい かげが うごきだしていた。',
    '「つぎは 『かたづけ』だ。\nこどもたちの へやを、えいえんに\nちらかしつづけるのだ…フフフ」\n\nSTUDY QUEST 2 (よてい は みてい)',
  ],
};
const sh = id => ({ id, shadow: true });
const INTRO_ART = ['tsuzuki', 'atomawashi', 'mendokusai', 'suitoru', 'soul'];
const STORY_ART = {
  1: ['tsuzuki', 'soul', sh('suitoru')],
  2: ['suitoru', 'tenin'],
  3: ['shimekiryu', sh('atomawashi'), 'atomawashi'],
  4: ['atomawashi', 'soul', 'soul', sh('hachigatsu'), 'hachigatsu', 'hachigatsu'],
  5: ['hachigatsu', 'hachigatsu', 'hachigatsu', 'asobouze', 'hachigatsu', 'soul', 'soul', sh('mangayama'), sh('mangayama')],
};

function allMonsterDefs() { return [...enemies, ...bosses, superBoss]; }
function isBossId(id) { return bosses.some(b => b.id === id) || id === superBoss.id; }
function initMonsterBook() {
  allMonsterDefs().forEach(m => {
    if (!state.monsterBook[m.id]) state.monsterBook[m.id] = { defeated:false, spared:false, count:0, friendCount:0, isBoss:isBossId(m.id) };
  });
}

const SAVE_KEY = 'studyquest_save_v2';
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      playerName: state.playerName,
      playerLevel: state.playerLevel, playerExp: state.playerExp,
      playerMaxHp: state.playerMaxHp, playerAtk: state.playerAtk,
      totalDefeated: state.totalDefeated, totalSpared: state.totalSpared,
      maxCombo: state.maxCombo, gold: state.gold, items: state.items,
      monsterBook: state.monsterBook, introSeen: state.introSeen,
      storyChapter: state.storyChapter, superUnlocked: state.superUnlocked, superBeaten: state.superBeaten,
      equipment: state.equipment, subjectClears: state.subjectClears, subjectCorrect: state.subjectCorrect,
    }));
  } catch (e) {}
}
function loadGame() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
  if (raw) {
    try {
      const s = JSON.parse(raw);
      Object.assign(state, {
        playerName: s.playerName || '',
        playerLevel: s.playerLevel || 1, playerExp: s.playerExp || 0,
        playerMaxHp: s.playerMaxHp || 100, playerAtk: s.playerAtk || 15,
        totalDefeated: s.totalDefeated || 0, totalSpared: s.totalSpared || 0,
        maxCombo: s.maxCombo || 0, gold: s.gold || 0,
        items: Object.assign({ candy:1, toast:0, pie:0 }, s.items || {}),
        introSeen: !!s.introSeen, storyChapter: s.storyChapter || 0,
        superUnlocked: !!s.superUnlocked, superBeaten: !!s.superBeaten,
        equipment: Object.assign({ excalibur:false, scale:false, fudebako:false }, s.equipment || {}),
        subjectClears: Object.assign({ math:false, japanese:false, science:false, social:false, english:false }, s.subjectClears || {}),
        subjectCorrect: Object.assign({ math:0, japanese:0, science:0, social:0, english:0 }, s.subjectCorrect || {}),
      });
      if (s.monsterBook) state.monsterBook = s.monsterBook;
    } catch (e) {}
  }
  updateExpToNext();
  initMonsterBook();
}
function updateExpToNext() { state.expToNext = 30 + (state.playerLevel - 1) * 15; }

// ===================================================================
// AUDIO
// ===================================================================
let musicOn = false;
function bgm(kind) {
  if (kind === 'silence') { music.currentBGM = 'silence'; music.stop(); return; }
  music.playBGM(kind);
  if (musicOn && !music.playing) music.start();
}
function setMusic(on) {
  musicOn = on;
  const b = $('musicToggle');
  b.textContent = on ? '♫ BGM ON' : '♪ BGM OFF';
  b.classList.toggle('on', on);
  if (on) { if (music.currentBGM !== 'silence') music.start(); }
  else music.stop();
}
$('musicToggle').addEventListener('click', () => { music.init(); setMusic(!musicOn); });
function voiceOf(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const boss = isBossId(id);
  return { pitch: boss ? 140 + (h % 90) : 300 + (h % 420), wave: h % 3 === 0 ? 'triangle' : 'square' };
}

// ===================================================================
// SCREEN FX
// ===================================================================
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('in-battle', id === 'battleScreen' || id === 'gameOverScreen');
  window.scrollTo(0, 0);
}
async function fadeTo(fn, ms = 260) {
  activeList = null;
  $('fade').classList.add('on');
  await sleep(ms);
  fn();
  await sleep(40);
  $('fade').classList.remove('on');
}
function flash(red) {
  const f = $('flash');
  f.classList.toggle('red', !!red);
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function shake(el, size) {
  const cls = 'shake-' + (size || 'm');
  el.classList.remove('shake-s', 'shake-m', 'shake-l'); void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 800);
}

// ===================================================================
// PIXEL SPRITES
// ===================================================================
function renderSprite(id, scale, opt = {}) {
  const c = document.createElement('canvas');
  if (id === 'soul') {
    c.width = c.height = 16 * scale;
    const x = c.getContext('2d');
    x.scale(scale, scale); x.fillStyle = '#ff0000'; x.fill(new Path2D(SOUL_PATH));
    return c;
  }
  const def = SPRITES[id];
  if (!def) return c;
  const rows = def.map, w = Math.max(...rows.map(r => r.length));
  c.width = w * scale; c.height = rows.length * scale;
  const ctx = c.getContext('2d');
  const pal = Object.assign({}, def.palette, opt.palette || {});
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (ch === '.' || !pal[ch]) continue;
      ctx.fillStyle = opt.silhouette ? (opt.silhouette === true ? '#1a1a1a' : opt.silhouette) : pal[ch];
      ctx.fillRect(rx * scale, ry * scale, scale, scale);
    }
  });
  return c;
}
let soulMaskCache = null;
function soulMask() {
  if (soulMaskCache) return soulMaskCache;
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const x = c.getContext('2d'); x.fill(new Path2D(SOUL_PATH));
  const d = x.getImageData(0, 0, 16, 16).data;
  soulMaskCache = [];
  for (let y = 0; y < 16; y++) for (let xx = 0; xx < 16; xx++) if (d[(y * 16 + xx) * 4 + 3] > 128) soulMaskCache.push([xx, y]);
  return soulMaskCache;
}
function drawSoul(ctx, cx, cy, size, color) {
  const s = size / 16;
  ctx.save(); ctx.translate(Math.round(cx - size / 2), Math.round(cy - size / 2)); ctx.scale(s, s);
  ctx.fillStyle = color || '#ff0000'; ctx.fill(new Path2D(SOUL_PATH)); ctx.restore();
}

// ===================================================================
// TYPEWRITER / ADVANCE
// ===================================================================
const activeTypers = new Set();
function typeInto(el, text, opt = {}) {
  const speed = opt.speed || 30;
  const tok = el._tok = (el._tok || 0) + 1;
  el.textContent = '';
  return new Promise(resolve => {
    let i = 0;
    const entry = {};
    const done = () => { activeTypers.delete(entry); resolve(); };
    entry.finish = () => { if (el._tok === tok) el.textContent = text; done(); };
    activeTypers.add(entry);
    const step = () => {
      if (el._tok !== tok || !activeTypers.has(entry)) { done(); return; }
      if (i >= text.length) { done(); return; }
      const ch = text[i++];
      el.textContent += ch;
      if (opt.voice !== 0 && ch.trim() && i % 2 === 1) music.voice(opt.voice || 480, opt.wave);
      const d = '、。!?！？…'.includes(ch) ? speed * 4 : ch === '\n' ? speed * 3 : speed;
      setTimeout(step, d);
    };
    step();
  });
}
function skipTyping() {
  if (!activeTypers.size) return false;
  [...activeTypers].forEach(e => e.finish());
  return true;
}
let advanceResolve = null;
function waitAdvance() { return new Promise(r => { advanceResolve = r; }); }
function advance() {
  if (skipTyping()) return;
  if (advanceResolve) { const r = advanceResolve; advanceResolve = null; r(); }
}
function addNextMark(el) {
  const s = document.createElement('span'); s.className = 'next'; s.textContent = '▼'; el.appendChild(s);
}

// ===================================================================
// HEART-CURSOR LISTS
// ===================================================================
let activeList = null;
class CursorList {
  constructor(el, items, o = {}) {
    this.el = el; this.items = items; this.o = o;
    this.cols = o.cols || 1; this.sel = Math.min(o.sel || 0, items.length - 1);
    this.render();
    activeList = this;
    this.select(this.sel, true);
  }
  render() {
    this.el.innerHTML = '';
    this.nodes = this.items.map((it, i) => {
      if (it.sepBefore) { const s = document.createElement('div'); s.className = 'sep'; this.el.appendChild(s); }
      const n = this.o.renderItem ? this.o.renderItem(it, i) : this.node(it);
      n.tabIndex = -1;
      n.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && activeList === this) this.select(i); });
      n.addEventListener('mousedown', e => e.preventDefault());
      n.addEventListener('click', () => { if (activeList !== this) return; this.select(i, true); this.pick(); });
      this.el.appendChild(n);
      return n;
    });
  }
  node(it) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt' + (it.cls ? ' ' + it.cls : '') + (it.disabled ? ' disabled' : '');
    b.innerHTML = SOUL_SVG + '<span class="ast">*</span><span class="lbl"></span>';
    b.querySelector('.lbl').textContent = it.label;
    if (it.sub) { const s = document.createElement('span'); s.className = 'sub'; s.textContent = ' ' + it.sub; b.querySelector('.lbl').appendChild(s); }
    if (it.right != null) { const r = document.createElement('span'); r.className = 'right'; r.textContent = it.right; b.appendChild(r); }
    return b;
  }
  select(i, silent) {
    if (i < 0 || i >= this.items.length) return;
    if (!silent && i !== this.sel) music.fx('move');
    this.sel = i;
    this.nodes.forEach((n, k) => n.classList.toggle('sel', k === i));
    if (this.o.onMove) this.o.onMove(this.items[i], i);
  }
  move(dx, dy) {
    const i = Math.max(0, Math.min(this.items.length - 1, this.sel + dx + dy * this.cols));
    this.select(i);
  }
  pick() {
    if (activeList !== this) return;
    music.fx('confirm');
    if (this.o.onPick) this.o.onPick(this.items[this.sel], this.sel);
  }
  back() { if (this.o.onBack) { music.fx('back'); this.o.onBack(); } }
}

// ===================================================================
// INPUT
// ===================================================================
const ui = { phase: 'none', menuSel: 0 };
const held = { left: false, right: false, up: false, down: false };
const DIRS = { ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1], a:[-1,0], d:[1,0], w:[0,-1], s:[0,1] };
const HELD_KEY = { ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right', ArrowUp:'up', w:'up', ArrowDown:'down', s:'down' };
document.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') {
    if (e.key === 'Enter') { e.preventDefault(); confirmName(); }
    return;
  }
  const k = e.key;
  const isZ = k === 'z' || k === 'Z' || k === 'Enter' || k === ' ';
  const isX = k === 'x' || k === 'X' || k === 'Escape' || k === 'Backspace' || k === 'Shift';
  const dir = DIRS[k];
  if (HELD_KEY[k]) held[HELD_KEY[k]] = true;
  if (dir || isZ || isX) e.preventDefault();
  if (ui.phase === 'dodge') return;
  if (e.repeat && isZ) return;
  switch (ui.phase) {
    case 'splash': if (isZ) splashGo(); break;
    case 'say': case 'story': if (isZ) advance(); else if (isX) skipTyping(); break;
    case 'menu':
      if (dir && dir[0]) { ui.menuSel = (ui.menuSel + dir[0] + 4) % 4; renderMenu(); music.fx('move'); }
      else if (isZ) chooseMenu(ui.menuSel);
      break;
    case 'attack': if (isZ && attackTapFn) attackTapFn(); break;
    case 'mash': if (isZ && mashTapFn) mashTapFn(); break;
    case 'roulette': if (isZ && rouStopFn) rouStopFn(); break;
    default:
      if (activeList) {
        if (dir) activeList.move(dir[0], dir[1]);
        else if (isZ) activeList.pick();
        else if (isX) activeList.back();
      }
  }
});
document.addEventListener('keyup', e => { if (HELD_KEY[e.key]) held[HELD_KEY[e.key]] = false; });
window.addEventListener('blur', () => { held.left = held.right = held.up = held.down = false; });

// ===================================================================
// SPLASH / NAME / STORY
// ===================================================================
function showSplash() { show('splash'); ui.phase = 'splash'; }
$('splashWrap').addEventListener('click', () => splashGo());
function splashGo() {
  if (ui.phase !== 'splash') return;
  ui.phase = 'none';
  music.init();
  bgm('title');
  setMusic(true);
  music.fx('confirm');
  fadeTo(() => {
    if (!state.playerName) showName();
    else if (!state.introSeen) startIntro();
    else goTitle();
  });
}

function showName() {
  show('nameScreen'); ui.phase = 'name';
  const inp = $('nameInput');
  inp.value = state.playerName || '';
  $('nameReact').textContent = '';
  new CursorList($('nameMenu'), [{ label:'けってい', key:'ok' }, { label:'もどる', key:'back' }], {
    cols: 2,
    onPick: it => { if (it.key === 'ok') confirmName(); else fadeTo(() => (state.playerName ? goTitle() : showSplash())); },
  });
  setTimeout(() => inp.focus(), 50);
}
$('nameInput').addEventListener('input', () => {
  const v = $('nameInput').value.trim();
  $('nameReact').textContent = NAME_REACTIONS[v] || '';
});
function confirmName() {
  const v = $('nameInput').value.trim();
  if (!v) { $('nameReact').textContent = '* なまえを いれてね!'; music.fx('back'); return; }
  state.playerName = v;
  $('nameInput').blur();
  music.playSfx('correct');
  saveGame();
  fadeTo(() => startIntro());
}

let lastArtKey = '';
function setArt(spec) {
  const box = $('storyArt');
  if (spec == null) return;
  const s = typeof spec === 'string' ? { id: spec } : spec;
  const key = s.id + (s.shadow ? ':s' : '');
  if (key === lastArtKey) return;
  lastArtKey = key;
  box.innerHTML = '';
  const cv = renderSprite(s.id, s.id === 'hachigatsu' ? 6 : s.id === 'soul' ? 6 : 7, s.shadow ? { silhouette:'#3a3226' } : {});
  box.appendChild(cv);
  box.classList.remove('fadeart'); void box.offsetWidth; box.classList.add('fadeart');
}
async function playStory(slides, arts, done, music_) {
  const id = newRun();
  lastArtKey = '';
  $('storyArt').innerHTML = '';
  show('storyScreen');
  activeList = null;
  bgm(music_ || 'title');
  for (let i = 0; i < slides.length; i++) {
    ui.phase = 'story';
    if (arts) setArt(arts[Math.min(i, arts.length - 1)]);
    await typeInto($('storyText'), slides[i], { speed: 46, voice: 300, wave: 'triangle' });
    if (id !== runId) return;
    await waitAdvance();
    if (id !== runId) return;
    music.fx('move');
  }
  ui.phase = 'none';
  if (done) done();
}
$('storyWrap').addEventListener('click', () => { if (ui.phase === 'story') advance(); });
function startIntro() {
  playStory(INTRO_SLIDES, INTRO_ART, () => { state.introSeen = true; saveGame(); fadeTo(() => goTitle()); });
}

// ===================================================================
// TITLE
// ===================================================================
function goTitle(saved) {
  newRun();
  stopBattleTimers();
  ui.phase = 'title';
  document.body.classList.remove('boss-battle', 'super-battle', 'phase2');
  hideBubble();
  saveGame();
  bgm('title');
  show('titleScreen');
  renderFileBox();
  $('saveLine').textContent = saved ? 'けついが みなぎった。(セーブ しました)' : pick(['ちきゅうは きょうも ぶじだ。きみの おかげで。', 'しゅくだいの においが する。けついが みなぎった。', 'テンイン星人の おみせから いい においが する。']);
  if (saved) music.fx('save');
  const items = Object.keys(SUBJECT_JA).map(s => {
    const r = subjectRank(s);
    const right = (state.subjectClears[s] ? '🏅' : '') + (r ? RANK_NAMES[r] : '');
    return { key:'sub', subject:s, label:SUBJECT_JA[s], sub:SUBJECT_EN[s], right };
  });
  items.push({ key:'zukan', label:'ずかん', sub:'MONSTERS', sepBefore:true });
  items.push({ key:'shop', label:'おみせ', sub:'SHOP' });
  items.push({ key:'story', label:'おはなし', sub:'STORY' });
  items.push({ key:'name', label:'なまえを かえる', sub:'NAME' });
  if (state.superUnlocked) items.push({ key:'super', label:'? ? ?', sub: state.superBeaten ? '(クリアずみ)' : 'うちゅうの おく', cls:'danger', sepBefore:true });
  new CursorList($('titleList'), items, {
    onPick: it => {
      if (it.key === 'sub') startGame(it.subject);
      else if (it.key === 'zukan') fadeTo(showZukan);
      else if (it.key === 'shop') fadeTo(showShop);
      else if (it.key === 'story') fadeTo(startIntro);
      else if (it.key === 'name') fadeTo(showName);
      else if (it.key === 'super') startSuperBattle();
    },
  });
}
function renderFileBox() {
  const ch = ['', 'だい1しょう クリア', 'だい2しょう クリア', 'だい3しょう クリア', 'アトマワシ大王を やっつけた!', 'ほんとうの THE END とうたつ!'][state.storyChapter] || 'ぼうけんの はじまり';
  $('fileBox').innerHTML = `
    <div class="file-row"><span id="fbName"></span><span>LV ${state.playerLevel}</span><span style="color:var(--gold)">${state.gold} G</span></div>
    <div class="file-row file-sub"><span>たおした ${state.totalDefeated}</span><span>ともだち ${state.totalSpared}</span><span>ATK ${state.playerAtk}</span><span>さいだいコンボ ${state.maxCombo}</span></div>
    <div class="file-chapter">★ ${ch}</div>`;
  $('fbName').textContent = state.playerName || 'きみ';
}

// ===================================================================
// BATTLE — shared state
// ===================================================================
const B = {
  run: 0, def: null, acts: null, isBoss: false, isSuper: false,
  spareProgress: 0, spareAnnounced: false, phase2: false,
  q: null, intent: null, act: null, pendingRankUp: '', usedSuper: [], eyeTimer: 0,
};
let pendingChapter = 0;
let blueTipShown = false;
const ALL_QUESTIONS = () => [].concat(...Object.values(questions));
function ck() { if (B.run !== runId) throw CANCEL; }
async function wait(ms) { await sleep(ms); ck(); }
async function W(p) { const r = await p; ck(); return r; }
function stopBattleTimers() {
  clearInterval(B.eyeTimer); B.eyeTimer = 0;
  attackTapFn = mashTapFn = rouStopFn = null;
}

function boxMode(m) {
  const target = /^b[A-Z]/.test(m) ? m : 'b' + m[0].toUpperCase() + m.slice(1);
  ['bText', 'bQuestion', 'bList', 'bAttack', 'bMash', 'bRoulette', 'bDodge'].forEach(id => $(id).classList.toggle('on', id === target));
}
function renderMenu() {
  document.querySelectorAll('.mbtn').forEach((b, i) => b.classList.toggle('sel', i === ui.menuSel));
}
function menuOn(on) { $('menu').classList.toggle('off', !on); }
document.querySelectorAll('.mbtn').forEach(b => {
  const i = +b.dataset.i;
  b.tabIndex = -1;
  b.addEventListener('mousedown', e => e.preventDefault());
  b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && ui.phase === 'menu' && ui.menuSel !== i) { ui.menuSel = i; renderMenu(); music.fx('move'); } });
  b.addEventListener('click', () => { if (ui.phase !== 'menu') return; ui.menuSel = i; renderMenu(); chooseMenu(i); });
});
$('bText').addEventListener('click', () => { if (ui.phase === 'say') advance(); });
$('enemyStage').addEventListener('click', () => { if (ui.phase === 'say') advance(); });

function updateHud() {
  $('bStage').textContent = B.isSuper ? 'STAGE ???' : `STAGE ${state.stage}`;
  const c = $('bCombo');
  c.textContent = `${state.combo} COMBO`;
  c.classList.toggle('hot', state.combo >= 3);
  $('bGold').textContent = `${state.gold} G`;
  $('sName').textContent = state.playerName || 'きみ';
  $('sLv').textContent = `LV ${state.playerLevel}`;
  const hp = Math.max(0, state.playerHp);
  $('hpFill').style.width = (hp / state.playerMaxHp * 100) + '%';
  $('hpBar').style.width = Math.min(window.innerWidth < 520 ? 84 : 160, 60 + state.playerMaxHp * 0.4) + 'px';
  $('sHp').textContent = `${hp} / ${state.playerMaxHp}`;
  $('stats').classList.toggle('danger', hp > 0 && hp <= state.playerMaxHp * 0.25);
}

function spriteScale() {
  const narrow = window.innerWidth < 520;
  if (B.isSuper) return narrow ? 6 : 8;
  if (B.isBoss) return narrow ? 6 : 8;
  return narrow ? 5 : 6;
}
function renderEnemy(extraClass) {
  const wrap = $('enemySprite');
  wrap.getAnimations().forEach(a => a.cancel());
  wrap.innerHTML = '';
  wrap.className = '';
  wrap.style.opacity = '';
  wrap.style.visibility = '';
  const idle = document.createElement('div');
  idle.className = B.isBoss ? 'idle-float' : 'idle-breathe';
  if (extraClass) idle.classList.add(extraClass);
  idle.appendChild(renderSprite(B.def.id, spriteScale()));
  wrap.appendChild(idle);
  const old = $('dustCanvas'); if (old) old.remove();
}
function startEyeFlicker() {
  clearInterval(B.eyeTimer);
  B.eyeTimer = setInterval(() => {
    const idle = $('enemySprite').firstChild;
    if (!idle || !B.isSuper) return;
    const glow = renderSprite('hachigatsu', spriteScale(), { palette: { R: B.phase2 ? '#ffffff' : '#00e5ff' } });
    const normal = idle.firstChild;
    idle.replaceChild(glow, normal);
    setTimeout(() => { if (idle.firstChild === glow) idle.replaceChild(renderSprite('hachigatsu', spriteScale()), glow); }, 160);
  }, B.phase2 ? 700 : 1500);
}

function positionBubble() {
  const b = $('bubble'), st = $('enemyStage').getBoundingClientRect(), sp = $('enemySprite').getBoundingClientRect();
  let left = sp.right - st.left + 14;
  const room = st.width - left - 4;
  if (room < 90) left = st.width - 94;
  b.style.left = left + 'px';
  b.style.maxWidth = Math.max(90, st.width - left - 4) + 'px';
  b.style.top = Math.max(4, sp.top - st.top - 6) + 'px';
}
async function speak(text, opt = {}) {
  const b = $('bubble');
  positionBubble();
  b.classList.add('on');
  const v = voiceOf(B.def.id);
  const p = typeInto(b, text, { speed: 36, voice: v.pitch, wave: v.wave });
  if (opt.wait) {
    ui.phase = 'say';
    await p; ck();
    addNextMark(b);
    await waitAdvance(); ck();
  } else if (opt.hold) {
    await p; await wait(opt.hold);
  }
}
function hideBubble() { $('bubble').classList.remove('on'); $('bubble').textContent = ''; }

async function say(lines, opt = {}) {
  if (!Array.isArray(lines)) lines = [lines];
  boxMode('text');
  menuOn(false);
  for (const ln of lines) {
    const line = typeof ln === 'string' ? { t: ln } : ln;
    if (line.fx) music.fx(line.fx);
    ui.phase = 'say';
    const el = $('bText');
    await typeInto(el, line.t, { voice: opt.voice || 480 });
    ck();
    addNextMark(el);
    await waitAdvance();
    ck();
  }
}

// ===================================================================
// BATTLE — setup & encounter
// ===================================================================
function startGame(subject) {
  state.subject = subject;
  state.playerHp = state.playerMaxHp;
  state.combo = 0;
  state.stage = 1;
  state.usedQuestions = [];
  startEncounter();
}
function stageEnemy(stage) {
  // non-boss stages map to consecutive monsters; after the last one, they cycle
  const n = stage - Math.floor(stage / 5) - 1;
  return n < enemies.length ? enemies[n] : enemies[(n * 7) % enemies.length];
}
function spawnForStage() {
  B.isSuper = false;
  B.spareProgress = 0; B.spareAnnounced = false; B.phase2 = false;
  if (state.stage % 5 === 0) {
    let boss = bosses.find(b => b.stage === state.stage);
    let hp;
    if (boss) hp = Math.floor(boss.hp * (1 + Math.floor(state.stage / 20) * 0.3));
    else {
      const last = bosses[bosses.length - 1];
      const sc = 1 + (state.stage - last.stage) * 0.15;
      boss = Object.assign({}, last, { atk: Math.floor(last.atk * sc), exp: Math.floor(last.exp * sc), gold: Math.floor(last.gold * sc),
        appear: `* ${last.name}が ふたたび あらわれた!\n* さらに つよくなっている!` });
      hp = Math.floor(last.hp * sc);
    }
    setupEnemy(boss, true, hp);
  } else {
    const base = stageEnemy(state.stage);
    setupEnemy(Object.assign({}, base), false, Math.floor(base.hp * (1 + (state.stage - 1) * 0.1)));
  }
}
function setupEnemy(def, isBoss, hp) {
  B.def = def; B.isBoss = isBoss;
  B.acts = ACTS[def.id] || { desc:'', acts:[], need:1, bullet:'●' };
  state.enemy = def; state.enemyHp = state.enemyMaxHp = hp;
}

const startEncounter = guard(async function () {
  B.run = newRun();
  stopBattleTimers();
  spawnForStage();
  document.body.classList.remove('super-battle', 'phase2');
  document.body.classList.toggle('boss-battle', B.isBoss);
  await enterBattleScreen();
  await introEnemy();
});

async function enterBattleScreen() {
  hideBubble();
  ui.phase = 'busy'; activeList = null;
  ui.menuSel = 0; renderMenu(); menuOn(false);
  $('battleBox').classList.remove('dodge');
  boxMode('text'); $('bText').textContent = '';
  $('dmgLayer').classList.remove('on');
  renderEnemy();
  $('enemySprite').style.visibility = 'hidden';
  updateHud();
  bgm('silence');
  show('battleScreen');
  await encounterTransition();
  ck();
}

async function encounterTransition() {
  const enc = $('encounter'), soul = $('encSoul');
  soul.style.transition = 'none';
  soul.style.transform = `translate(${window.innerWidth / 2 - 11}px, ${window.innerHeight / 2 - 11}px)`;
  enc.style.transition = 'none';
  enc.style.opacity = '1';
  enc.classList.add('on');
  for (let i = 0; i < 3; i++) {
    soul.style.visibility = 'visible'; music.fx('encounter'); await sleep(85);
    soul.style.visibility = 'hidden'; await sleep(85);
  }
  soul.style.visibility = 'visible';
  const r = document.querySelector('.mbtn[data-i="0"]').getBoundingClientRect();
  void soul.offsetWidth;
  soul.style.transition = 'transform .42s steps(8)';
  soul.style.transform = `translate(${r.left + 16}px, ${r.top + r.height / 2 - 11}px)`;
  music.fx('soulFly');
  await sleep(450);
  enc.style.transition = 'opacity .25s steps(4)';
  enc.style.opacity = '0';
  await sleep(260);
  enc.classList.remove('on');
}

async function introEnemy() {
  const sp = $('enemySprite');
  sp.style.visibility = 'visible';
  if (B.isBoss) {
    sp.firstChild.classList.add('boss-rise');
    music.fx('bossAppear');
    await wait(900);
    flash();
    shake($('battleScreen'), 'l');
    bgm(B.def.id === 'atomawashi' ? 'final' : 'boss');
    sp.firstChild.classList.remove('boss-rise');
    await wait(400);
  } else {
    bgm('battle');
  }
  playerTurn(B.def.appear);
}

// ===================================================================
// BATTLE — player turn & menu
// ===================================================================
function parseLine(line) {
  const t = line.replace(/^\* ?/, '');
  const name = B.def.name;
  if (t.startsWith(name + '「') && t.endsWith('」')) return { bubble: t.slice(name.length + 1, -1) };
  return { text: '* ' + t };
}
function flavor() {
  const d = B.def;
  if (isSpareable() && Math.random() < 0.5) return { text: `* ${d.name}は もう たたかう きが ないようだ。` };
  if (state.playerHp <= state.playerMaxHp * 0.25 && Object.values(state.items).some(n => n > 0))
    return { text: '* ピンチだ! ITEMで かいふく できるよ。' };
  const parsed = (d.lines || []).map(parseLine);
  const f = pick(parsed);
  if (f.bubble) {
    const nar = parsed.filter(p => p.text);
    return { bubble: f.bubble, text: nar.length ? pick(nar).text : `* ${d.name}が たちはだかっている。` };
  }
  return f;
}
function playerTurn(text) {
  ck();
  ui.phase = 'menu';
  activeList = null;
  $('battleBox').classList.remove('dodge');
  boxMode('text');
  menuOn(true);
  renderMenu();
  updateHud();
  let t = text;
  if (!t) {
    const f = flavor();
    t = f.text;
    if (f.bubble) speak(f.bubble).catch(() => {});
    else hideBubble();
  } else hideBubble();
  typeInto($('bText'), t, { voice: 480 });
}

const chooseMenu = guard(async function (i) {
  if (ui.phase !== 'menu') return;
  ui.phase = 'busy';
  music.fx('confirm');
  menuOn(false);
  skipTyping();
  hideBubble();
  if (i === 0) openQuestion('fight');
  else if (i === 1) openAct();
  else if (i === 2) await openItems();
  else openMercy();
});

// ===================================================================
// QUESTIONS
// ===================================================================
function nextQuestion() {
  if (B.isSuper) {
    const pool = ALL_QUESTIONS();
    if (B.usedSuper.length >= pool.length) B.usedSuper = [];
    let i; do { i = Math.floor(Math.random() * pool.length); } while (B.usedSuper.includes(i));
    B.usedSuper.push(i);
    return pool[i];
  }
  const pool = questions[state.subject];
  let avail = pool.map((_, i) => i).filter(i => !state.usedQuestions.includes(i));
  if (!avail.length) { state.usedQuestions = []; avail = pool.map((_, i) => i); }
  const qi = pick(avail);
  state.usedQuestions.push(qi);
  return pool[qi];
}
function openQuestion(intent, act) {
  const q = nextQuestion();
  B.q = q; B.intent = intent; B.act = act || null;
  boxMode('bQuestion');
  $('qSubject').textContent = intent === 'act' ? `こうどう「${act.name}」` : (B.isSuper ? 'ぜんきょうか' : `${SUBJECT_JA[state.subject]} ${SUBJECT_EN[state.subject]}`);
  $('qText').textContent = q.q;
  ui.phase = 'list';
  new CursorList($('qChoices'), q.c.map(c => ({ label: c })), {
    cols: 2,
    onPick: (it, idx) => answer(idx),
    onBack: () => playerTurn(),
  });
}
const answer = guard(async function (idx) {
  if (ui.phase !== 'list' || !B.q) return;
  ui.phase = 'busy';
  activeList = null;
  const q = B.q; B.q = null;
  if (idx === q.a) {
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    if (!B.isSuper) {
      const before = subjectRank(state.subject);
      state.subjectCorrect[state.subject]++;
      const after = subjectRank(state.subject);
      if (after > before) B.pendingRankUp = `${SUBJECT_JA[state.subject]}の うでまえが「${RANK_NAMES[after]}」に あがった!`;
    }
    music.playSfx('correct');
    updateHud();
    await wait(260);
    if (B.intent === 'fight') await fightMinigame();
    else await actSuccess(B.act);
  } else {
    state.combo = 0;
    updateHud();
    music.playSfx('wrong');
    shake($('battleBox'), 's');
    await say(`* ざんねん…\n* こたえは「${q.c[q.a]}」だよ。`);
    await enemyTurn();
  }
});

// ===================================================================
// FIGHT minigames
// ===================================================================
let attackTapFn = null, mashTapFn = null, rouStopFn = null;
async function fightMinigame() {
  const g = pick(['bar', 'bar', 'mash', 'roulette']);
  const res = await W(g === 'bar' ? attackBar() : g === 'mash' ? mashGame() : rouletteGame());
  await dealDamage(res.mult, res.crit);
}
function drawTarget(ctx, W_, H) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W_, H);
  const cx = W_ / 2, cy = H / 2, rx = W_ / 2 - 6, ry = H / 2 - 8;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#0c140c'; ctx.fillRect(0, 0, W_, H);
  for (let i = 0; i <= 22; i++) {
    const f = i / 22, dx = rx * Math.pow(f, 1.5);
    ctx.fillStyle = f < 0.1 ? '#00ff00' : f < 0.3 ? '#00b400' : f < 0.6 ? '#1f7a1f' : '#2c4a2c';
    ctx.fillRect(Math.round(cx + dx - 2), 0, 4, H);
    ctx.fillRect(Math.round(cx - dx - 2), 0, 4, H);
  }
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
}
function drawCursor(ctx, x, H, color) {
  ctx.fillStyle = color === '#000' ? '#fff' : '#000';
  ctx.fillRect(Math.round(x - 8), 4, 16, H - 8);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - 5), 7, 10, H - 14);
}
function attackBar() {
  return new Promise(resolve => {
    boxMode('bAttack');
    ui.phase = 'attack';
    const cv = $('attackCanvas'), ctx = cv.getContext('2d'), W_ = cv.width, H = cv.height;
    const dur = 1250, t0 = performance.now(), run = B.run;
    let pos = 0, done = false;
    const xAt = p => 12 + p * (W_ - 24);
    const frame = t => {
      if (done) return;
      if (run !== runId) { done = true; resolve({ mult: 0, crit: false }); return; }
      pos = Math.min(1, (t - t0) / dur);
      drawTarget(ctx, W_, H); drawCursor(ctx, xAt(pos), H, '#fff');
      if (pos >= 1) { finish(true); return; }
      requestAnimationFrame(frame);
    };
    const finish = timeout => {
      if (done) return;
      done = true; attackTapFn = null; ui.phase = 'busy';
      const x = xAt(pos);
      const acc = 1 - Math.abs(x - W_ / 2) / (W_ / 2);
      const critLine = state.subjectClears.math ? 0.80 : 0.88;
      let mult, crit = false;
      if (timeout) mult = 0.45;
      else if (acc >= critLine) { mult = 2; crit = true; }
      else mult = 0.7 + acc * 0.8;
      let n = 0;
      const iv = setInterval(() => {
        drawTarget(ctx, W_, H); drawCursor(ctx, x, H, n % 2 ? '#fff' : '#000');
        if (++n > 6) { clearInterval(iv); resolve({ mult, crit }); }
      }, 60);
    };
    attackTapFn = () => finish(false);
    requestAnimationFrame(frame);
  });
}
$('attackCanvas').addEventListener('pointerdown', () => { if (ui.phase === 'attack' && attackTapFn) attackTapFn(); });

function mashGame() {
  return new Promise(resolve => {
    boxMode('bMash');
    ui.phase = 'mash';
    let taps = 0;
    const heart = $('mashHeart');
    const upd = () => {
      $('mashCount').textContent = taps;
      $('mashFill').style.width = Math.min(100, taps * 4.5) + '%';
      heart.style.transform = `scale(${1 + Math.min(taps, 25) * 0.035})`;
    };
    upd();
    mashTapFn = () => { taps++; music.fx('move'); upd(); heart.animate([{ filter:'brightness(2)' }, { filter:'none' }], { duration: 90 }); };
    setTimeout(() => {
      mashTapFn = null; ui.phase = 'busy';
      const crit = taps >= (state.subjectClears.math ? 19 : 22);
      resolve({ mult: crit ? 2 : 0.6 + Math.min(taps, 20) * 0.06, crit });
    }, 2700);
  });
}
$('bMash').addEventListener('pointerdown', e => { e.preventDefault(); if (ui.phase === 'mash' && mashTapFn) mashTapFn(); });

function rouletteGame() {
  return new Promise(resolve => {
    boxMode('bRoulette');
    ui.phase = 'roulette';
    let n = 1, stopped = false;
    const el = $('rouNum');
    const iv = setInterval(() => { n = n % 9 + 1; el.textContent = n; el.style.color = n === 9 ? 'var(--yellow)' : ''; }, 85);
    const stop = () => {
      if (stopped) return;
      stopped = true; clearInterval(iv); clearTimeout(to); rouStopFn = null; ui.phase = 'busy';
      const crit = n === 9 || (state.subjectClears.math && n === 8);
      music.fx(crit ? 'ding' : 'confirm');
      el.animate([{ transform:'scale(1.25)' }, { transform:'scale(1)' }], { duration: 250 });
      setTimeout(() => resolve({ mult: crit ? 2 : 0.5 + n * 0.15, crit }), 450);
    };
    const to = setTimeout(stop, 3200);
    rouStopFn = stop;
  });
}
$('bRoulette').addEventListener('pointerdown', e => { e.preventDefault(); if (ui.phase === 'roulette' && rouStopFn) rouStopFn(); });

function slashAnim(crit) {
  const svg = $('slashFx');
  svg.innerHTML = '';
  const ds = crit ? ['M150 20 L55 180', 'M50 20 L145 180'] : ['M145 20 L60 180'];
  ds.forEach((d, i) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('stroke-width', crit ? 9 : 6);
    p.setAttribute('vector-effect', 'non-scaling-stroke');
    p.style.strokeDasharray = 260; p.style.strokeDashoffset = 260;
    p.style.animationDelay = (i * 110) + 'ms';
    p.classList.add('slash-anim');
    svg.appendChild(p);
  });
  setTimeout(() => { svg.innerHTML = ''; }, 750);
}
function showDmg(dmg, before, after, crit) {
  const L = $('dmgLayer'), n = $('dmgNum'), f = $('dmgGaugeFill');
  n.className = crit ? 'crit' : '';
  n.textContent = dmg > 0 ? String(dmg) : 'MISS';
  f.style.transition = 'none';
  f.style.width = (before / state.enemyMaxHp * 100) + '%';
  L.classList.remove('on'); void L.offsetWidth; L.classList.add('on');
  requestAnimationFrame(() => { f.style.transition = ''; f.style.width = (after / state.enemyMaxHp * 100) + '%'; });
}
async function dealDamage(mult, crit) {
  boxMode('bText'); $('bText').textContent = '';
  const comboMult = 1 + Math.max(0, state.combo - 1) * 0.15;
  const rankMult = B.isSuper ? 1 : 1 + subjectRank(state.subject) * 0.1;
  const dmg = Math.max(1, Math.floor(state.playerAtk * comboMult * mult * rankMult));
  music.fx('slash');
  slashAnim(crit);
  await wait(330);
  music.fx(crit ? 'crit' : 'hitEnemy');
  if (crit) { flash(); shake($('battleScreen'), 'm'); }
  const before = state.enemyHp;
  state.enemyHp = Math.max(0, state.enemyHp - dmg);
  const sp = $('enemySprite');
  sp.classList.remove('hit-shake'); void sp.offsetWidth; sp.classList.add('hit-shake');
  showDmg(dmg, before, state.enemyHp, crit);
  updateHud();
  await wait(1150);
  $('dmgLayer').classList.remove('on');
  if (state.enemyHp <= 0) { await enemyDies(); return; }
  if (B.isSuper && !B.phase2 && state.enemyHp <= state.enemyMaxHp * 0.5) await superPhase2();
  if (B.pendingRankUp) { const m = B.pendingRankUp; B.pendingRankUp = ''; await say({ t: `* ★ ${m}`, fx: 'save' }); }
  await announceSpareable();
  playerTurn(crit ? '* かいしんの いちげき!!' : state.combo >= 3 ? `* ${state.combo}コンボ! ちょうしが いいぞ!` : null);
}

// ===================================================================
// ACT / ITEM / MERCY
// ===================================================================
function isSpareable() {
  if (!B.def) return false;
  if (B.isSuper) return state.enemyHp <= state.enemyMaxHp * 0.2;
  if (B.spareProgress >= (B.acts.need || 1)) return true;
  const jp = state.subjectClears.japanese;
  return state.combo >= (jp ? 2 : 3) || state.enemyHp <= state.enemyMaxHp * (jp ? 0.4 : 0.3);
}
async function announceSpareable() {
  if (B.spareAnnounced || !isSpareable()) return;
  B.spareAnnounced = true;
  await say({ t: `* ${B.def.name}は もう たたかう きが ないようだ。\n* MERCYで みのがして あげられるよ。`, fx: 'spareOk' });
}
function listBox(items, onPick, cols) {
  boxMode('bList');
  ui.phase = 'list';
  new CursorList($('listEl'), items, { cols: cols || 2, onPick, onBack: () => playerTurn() });
}
function openAct() {
  const items = [{ label:'しらべる', key:'check' }].concat(B.acts.acts.map(a => ({ label:a.name, key:'act', act:a })));
  listBox(items, guard(async it => {
    if (ui.phase !== 'list') return;
    ui.phase = 'busy'; activeList = null;
    if (it.key === 'check') {
      const d = B.def;
      await say(`* ${d.name} ― ATK ${d.atk}  HP ${state.enemyHp}/${state.enemyMaxHp}\n* ${B.acts.desc}`);
      playerTurn();
    } else openQuestion('act', it.act);
  }));
}
async function actSuccess(act) {
  const lines = act.ok.split('\n').map(l => '* ' + l).join('\n');
  await say(lines);
  B.spareProgress++;
  await announceSpareable();
  playerTurn();
}
async function openItems() {
  const keys = Object.keys(ITEMS).filter(k => (state.items[k] || 0) > 0);
  if (!keys.length) { await say('* どうぐを もっていない…\n* テンイン星人の おみせで かえるよ。'); playerTurn(); return; }
  listBox(keys.map(k => ({ label: ITEMS[k].short, right: `x${state.items[k]}`, key: k })), guard(async it => {
    if (ui.phase !== 'list') return;
    ui.phase = 'busy'; activeList = null;
    const item = ITEMS[it.key];
    state.items[it.key]--;
    let heal = item.heal === 'full' ? state.playerMaxHp : item.heal;
    if (state.subjectClears.science && item.heal !== 'full') heal = Math.floor(heal * 1.5);
    const before = state.playerHp;
    state.playerHp = Math.min(state.playerMaxHp, state.playerHp + heal);
    music.playSfx('heal');
    updateHud();
    saveGame();
    const got = state.playerHp - before;
    await say(`${item.useMsg}\n* ` + (state.playerHp >= state.playerMaxHp ? 'HPが まんたんに なった!' : `HPが ${got} かいふくした!`));
    playerTurn();
  }));
}
function openMercy() {
  const can = isSpareable();
  listBox([{ label:'みのがす', key:'spare', cls: can ? 'spareable' : '' }, { label:'にげる', key:'flee' }], guard(async it => {
    if (ui.phase !== 'list') return;
    ui.phase = 'busy'; activeList = null;
    if (it.key === 'spare') {
      if (isSpareable()) { await doSpare(); return; }
      let hint = '* ACTの こうどうを ためしてみよう。';
      if (B.isSuper) hint = '* …もっと よわらせないと きいてくれない。';
      await say(`* ${B.def.name}は まだ たたかう きだ…\n${hint}`);
      playerTurn();
    } else {
      if (B.isSuper) { await say('* にげられない!\n* さいごの ひからは、にげられないのだ。'); playerTurn(); return; }
      await say('* きみは こんどに した…\n* (しゅくだいは まっている)');
      fadeTo(() => goTitle(true));
    }
  }), 1);
}

// ===================================================================
// ENEMY TURN — bullet box
// ===================================================================
async function enemyTurn() {
  menuOn(false);
  boxMode('bText'); $('bText').textContent = '';
  await speak(`${B.def.atkName || 'こうげき'}!`, { hold: 650 });
  const res = await dodgePhase();
  hideBubble();
  if (state.playerHp <= 0) { gameOver(); throw CANCEL; }
  playerTurn(res.hits === 0 ? '* かんぺきに よけた! ノーダメージ!' : null);
}
async function dodgePhase() {
  $('battleBox').classList.add('dodge');
  await wait(330);
  boxMode('bDodge');
  ui.phase = 'dodge';
  const res = await W(runDodge());
  ui.phase = 'busy';
  boxMode('bText'); $('bText').textContent = '';
  $('battleBox').classList.remove('dodge');
  await wait(330);
  return res;
}
const drag = { active: false, dx: 0, dy: 0, lx: 0, ly: 0 };
(function () {
  const cv = $('dodgeCanvas');
  cv.addEventListener('pointerdown', e => {
    drag.active = true; drag.lx = e.clientX; drag.ly = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => {
    if (!drag.active) return;
    const r = cv.getBoundingClientRect(), k = cv.width / r.width;
    drag.dx += (e.clientX - drag.lx) * k * 1.15; drag.dy += (e.clientY - drag.ly) * k * 1.15;
    drag.lx = e.clientX; drag.ly = e.clientY;
  });
  const end = () => { drag.active = false; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
})();

function runDodge() {
  return new Promise(resolve => {
    const cv = $('dodgeCanvas'), ctx = cv.getContext('2d');
    const box = $('bDodge').getBoundingClientRect();
    cv.width = Math.round(box.width) || 292; cv.height = Math.round(box.height) || 182;
    const Wd = cv.width, Hd = cv.height;
    const soul = { x: Wd / 2, y: Hd / 2 + 30, r: 7 };
    const bullets = [], walls = [];
    let hits = 0, inv = 0;
    const sup = B.isSuper, boss = B.isBoss, id = B.def.id;
    const dur = sup ? (B.phase2 ? 7000 : 6000) : boss ? 4500 : 3400;
    let patterns;
    if (sup) patterns = B.phase2 ? ['walls', 'spiral', 'blue', 'aimed', 'rain', 'walls'] : ['rain', 'walls', 'spiral', 'blue', 'aimed'];
    else if (id === 'atomawashi') patterns = ['spiral', 'walls', 'blue'];
    else if (boss) patterns = [pick(['rain', 'aimed', 'spiral', 'walls'])];
    else patterns = [pick(state.stage >= 3 ? ['rain', 'aimed', 'walls'] : ['rain', 'rain', 'aimed'])];
    const glyph = B.acts.bullet || '●';
    const spd = sup ? (B.phase2 ? 1.5 : 1.3) : boss ? 1.15 : 1 + Math.min(state.stage, 20) * 0.015;
    const t0 = performance.now();
    let last = t0, next = t0 + 250, angle = 0, blueSeen = false, run = B.run;
    drag.dx = drag.dy = 0;
    const hit = t => {
      hits++; inv = t + 750;
      let per = Math.max(2, Math.ceil(B.def.atk * 0.5));
      if (state.equipment.scale) per = Math.max(1, Math.floor(per * 0.7));
      state.playerHp = Math.max(0, state.playerHp - per);
      music.fx('hurt');
      shake($('battleBox'), 's');
      updateHud();
    };
    const frame = t => {
      if (run !== runId) { resolve({ hits }); return; }
      const dt = Math.min(50, t - last) / 1000; last = t;
      const px = soul.x, py = soul.y, v = 150;
      if (held.left) soul.x -= v * dt;
      if (held.right) soul.x += v * dt;
      if (held.up) soul.y -= v * dt;
      if (held.down) soul.y += v * dt;
      soul.x += drag.dx; soul.y += drag.dy; drag.dx = drag.dy = 0;
      soul.x = Math.max(soul.r + 2, Math.min(Wd - soul.r - 2, soul.x));
      soul.y = Math.max(soul.r + 2, Math.min(Hd - soul.r - 2, soul.y));
      const moved = Math.hypot(soul.x - px, soul.y - py) > 0.4;
      const el = t - t0;
      const pat = patterns[Math.min(patterns.length - 1, Math.floor(el / (dur / patterns.length)))];
      if (pat === 'blue' && !blueSeen) {
        blueSeen = true;
        if (!blueTipShown) { blueTipShown = true; speak('あおい こうげきは\nうごかなければ\nあたらない!').catch(() => {}); }
      }
      if (t >= next && el < dur - 600) {
        if (pat === 'rain') {
          for (let i = 0; i < (boss ? 2 : 1); i++) bullets.push({ x: rand(12, Wd - 12), y: -10, vx: rand(-25, 25) * spd, vy: rand(90, 150) * spd, r: 7 });
          next = t + (boss ? 210 : 270);
        } else if (pat === 'aimed') {
          const x = rand(12, Wd - 12), dx = soul.x - x, dy = soul.y + 10, len = Math.hypot(dx, dy), s = 150 * spd;
          bullets.push({ x, y: -10, vx: dx / len * s, vy: dy / len * s, r: 7 });
          next = t + (boss ? 300 : 400);
        } else if (pat === 'spiral') {
          angle += 0.55;
          for (let k = 0; k < 2; k++) {
            const a = angle + k * Math.PI;
            bullets.push({ x: Wd / 2, y: 24, vx: Math.cos(a) * 120 * spd, vy: (Math.abs(Math.sin(a)) * 90 + 40) * spd, r: 6 });
          }
          next = t + 160;
        } else if (pat === 'walls') {
          const gap = sup ? 58 : 70;
          walls.push({ x: Wd + 8, w: 14, vx: -120 * spd, gapY: rand(gap / 2 + 14, Hd - gap / 2 - 14), gap, blue: false });
          next = t + (sup ? 760 : 950);
        } else if (pat === 'blue') {
          const blue = walls.length % 2 === 0;
          walls.push(blue ? { x: Wd + 8, w: 18, vx: -150 * spd, gap: 0, blue: true }
                          : { x: Wd + 8, w: 14, vx: -150 * spd, gapY: rand(60, Hd - 60), gap: 76, blue: false });
          next = t + 650;
        }
      }
      bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; });
      walls.forEach(w => { w.x += w.vx * dt; });
      for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.y > Hd + 20 || b.x < -20 || b.x > Wd + 20) bullets.splice(i, 1); }
      for (let i = walls.length - 1; i >= 0; i--) if (walls[i].x < -30) walls.splice(i, 1);
      if (t > inv) {
        let isHit = bullets.some(b => Math.hypot(b.x - soul.x, b.y - soul.y) < b.r + soul.r - 3);
        if (!isHit) isHit = walls.some(w => {
          if (soul.x + soul.r - 2 < w.x || soul.x - soul.r + 2 > w.x + w.w) return false;
          if (w.blue) return moved;
          return soul.y - soul.r + 2 < w.gapY - w.gap / 2 || soul.y + soul.r - 2 > w.gapY + w.gap / 2;
        });
        if (isHit) hit(t);
      }
      // draw
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, Wd, Hd);
      walls.forEach(w => {
        ctx.fillStyle = w.blue ? '#14a9ff' : '#fff';
        if (w.gap) {
          ctx.fillRect(Math.round(w.x), 0, w.w, Math.round(w.gapY - w.gap / 2));
          ctx.fillRect(Math.round(w.x), Math.round(w.gapY + w.gap / 2), w.w, Hd);
        } else ctx.fillRect(Math.round(w.x), 0, w.w, Hd);
      });
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${glyph.length > 1 ? 13 : 17}px DotGothic16, monospace`;
      bullets.forEach(b => {
        if (glyph === '●') { ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillText(glyph, b.x, b.y);
      });
      if (!(t < inv && Math.floor(t / 70) % 2 === 0)) drawSoul(ctx, soul.x, soul.y, 16, '#ff0000');
      if (state.playerHp <= 0) { resolve({ hits, dead: true }); return; }
      if (el >= dur) { resolve({ hits }); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// ===================================================================
// VICTORY / SPARE
// ===================================================================
function dustEffect() {
  return new Promise(resolve => {
    const src = $('enemySprite').querySelector('canvas');
    if (!src) { resolve(); return; }
    const stage = $('enemyStage'), sr = src.getBoundingClientRect(), st = stage.getBoundingClientRect();
    const pad = 70, w = src.width, h = src.height;
    const cv = document.createElement('canvas');
    cv.id = 'dustCanvas';
    cv.width = w + pad * 2; cv.height = h + pad * 2;
    cv.style.left = (sr.left - st.left - pad) + 'px';
    cv.style.top = (sr.top - st.top - pad) + 'px';
    stage.appendChild(cv);
    const ctx = cv.getContext('2d');
    const data = src.getContext('2d').getImageData(0, 0, w, h).data;
    $('enemySprite').style.visibility = 'hidden';
    const parts = [];
    let cut = -Math.round(h * 0.25), whiteT = 10;
    const step = Math.max(2, Math.round(h / 45));
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (whiteT > 0) {
        whiteT--;
        ctx.drawImage(src, pad, pad);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255,255,255,${0.9 - whiteT * 0.05})`;
        ctx.fillRect(pad, pad, w, h);
        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(tick); return;
      }
      const prev = Math.max(0, cut);
      cut += step;
      for (let y = prev; y < Math.min(h, cut); y += 2) for (let x = 0; x < w; x += 3) {
        if (data[(y * w + x) * 4 + 3] > 0) parts.push({ x: x + pad, y: y + pad, vx: rand(0.2, 1.8), vy: rand(-1.6, -0.2), life: rand(28, 60), max: 60 });
      }
      if (cut < h) {
        const c0 = Math.max(0, cut);
        ctx.drawImage(src, 0, c0, w, h - c0, pad, pad + c0, w, h - c0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(pad, pad + c0, w, h - c0);
        ctx.globalCompositeOperation = 'source-over';
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy -= 0.01; p.life--;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(200,200,200,${p.life / p.max})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }
      if (cut >= h && !parts.length) { cv.remove(); resolve(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
async function poofEffect() {
  const sp = $('enemySprite');
  sp.firstChild.style.animation = 'none';
  sp.classList.add('spared');
  music.fx('poof');
  const stage = $('enemyStage'), sr = sp.getBoundingClientRect(), st = stage.getBoundingClientRect();
  for (let i = 0; i < 9; i++) {
    const d = document.createElement('div');
    const size = rand(14, 30);
    d.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:#fff;z-index:4;` +
      `left:${sr.left - st.left + rand(0, sr.width) - size / 2}px;top:${sr.top - st.top + rand(sr.height * 0.3, sr.height) - size / 2}px;`;
    stage.appendChild(d);
    d.animate([{ transform:'scale(.2)', opacity:1 }, { transform:`translate(${rand(-30, 30)}px,${rand(-40, -10)}px) scale(1.4)`, opacity:0 }], { duration: 700, easing:'steps(7)' });
    setTimeout(() => d.remove(), 720);
  }
  await wait(750);
  sp.animate([{ opacity: 0.45 }, { opacity: 0 }], { duration: 400, easing:'steps(4)', fill:'forwards' });
  await wait(420);
}
function queueChapter() {
  const ch = BOSS_CHAPTER[B.def.id] || 0;
  if (ch && state.storyChapter < ch) pendingChapter = ch;
}
function emblemLines() {
  if (!B.isBoss || B.isSuper) return [];
  const s = state.subject;
  if (state.subjectClears[s]) return [];
  state.subjectClears[s] = true;
  return [{ t: `* 🏅 ${SUBJECT_JA[s]}バッジを てにいれた!\n* ${SUBJECT_BENEFIT[s]}`, fx: 'save' }];
}
function levelUpLines() {
  const out = [];
  while (state.playerExp >= state.expToNext) {
    state.playerExp -= state.expToNext;
    state.playerLevel++;
    state.playerMaxHp += 10;
    state.playerAtk += 3;
    state.playerHp = state.playerMaxHp;
    updateExpToNext();
    out.push({ t: `* きみの LVが あがった! (LV ${state.playerLevel})\n* HP +10  ATK +3  HPが ぜんかいふく!`, fx: 'levelup' });
  }
  return out;
}
function applyRewardMultipliers(exp, gold) {
  if (state.subjectClears.english) exp = Math.floor(exp * 1.2);
  if (state.subjectClears.social) gold = Math.floor(gold * 1.3);
  return [exp, gold];
}
async function enemyDies() {
  ui.phase = 'busy'; menuOn(false); hideBubble();
  bgm('silence');
  const d = B.def;
  if (B.isBoss) { flash(); shake($('battleScreen'), 'l'); }
  music.fx('dust');
  await W(dustEffect());
  state.totalDefeated++;
  const book = state.monsterBook[d.id];
  if (book) { book.defeated = true; book.count = (book.count || 0) + 1; }
  queueChapter();
  let exp = (d.exp + state.combo * 2) * (B.isBoss ? 3 : 1);
  let gold = d.gold + state.combo;
  [exp, gold] = applyRewardMultipliers(exp, gold);
  state.playerExp += exp; state.gold += gold;
  const lines = [];
  if (d.win) lines.push(d.win);
  lines.push({ t: `* きみの かち!\n* ${exp} EXP と ${gold} ゴールドを てにいれた。`, fx: B.isBoss ? 'bossClear' : 'victory' });
  lines.push(...emblemLines(), ...levelUpLines());
  updateHud();
  saveGame();
  await say(lines);
  await afterBattle();
}
async function doSpare() {
  ui.phase = 'busy'; menuOn(false); hideBubble();
  bgm('silence');
  const d = B.def;
  await poofEffect();
  state.totalSpared++;
  const book = state.monsterBook[d.id];
  if (book) { book.spared = true; book.friendCount = (book.friendCount || 0) + 1; }
  queueChapter();
  let exp = Math.floor((d.exp + state.combo * 2) * (B.isBoss ? 1.5 : 0.5));
  let gold = (d.gold + state.combo) * 2;
  [exp, gold] = applyRewardMultipliers(exp, gold);
  state.playerExp += exp; state.gold += gold;
  const lines = [];
  if (d.spare) lines.push(d.spare);
  lines.push({ t: `* きみの かち! ${d.name}と ともだちに なった。\n* ${exp} EXP と ${gold} ゴールドを てにいれた。`, fx: 'spare' });
  lines.push(...emblemLines(), ...levelUpLines());
  updateHud();
  saveGame();
  await say(lines);
  await afterBattle();
}
async function afterBattle() {
  saveGame();
  if (pendingChapter) { playPendingStory(); return; }
  if (B.isSuper) { fadeTo(() => goTitle(true)); return; }
  state.stage++;
  state.playerHp = Math.min(state.playerMaxHp, state.playerHp + Math.floor(state.playerMaxHp * 0.2));
  startEncounter();
}
function playPendingStory() {
  const ch = pendingChapter;
  pendingChapter = 0;
  state.storyChapter = Math.max(state.storyChapter, ch);
  if (ch >= 4) state.superUnlocked = true;
  if (ch >= 5) state.superBeaten = true;
  saveGame();
  document.body.classList.remove('boss-battle', 'super-battle', 'phase2');
  stopBattleTimers();
  fadeTo(() => playStory(STORY[ch], STORY_ART[ch], () => {
    if (ch >= 4) { fadeTo(() => goTitle(true)); return; }
    state.stage++;
    state.playerHp = Math.min(state.playerMaxHp, state.playerHp + Math.floor(state.playerMaxHp * 0.2));
    startEncounter();
  }, ch === 5 ? 'gameover' : 'title'));
}

// ===================================================================
// SUPER BOSS — 8がつ31にち
// ===================================================================
const startSuperBattle = guard(async function () {
  B.run = newRun();
  stopBattleTimers();
  B.isSuper = true; B.phase2 = false; B.spareProgress = 0; B.spareAnnounced = false; B.usedSuper = [];
  setupEnemy(Object.assign({}, superBoss), true, superBoss.hp);
  B.isSuper = true;
  state.playerHp = state.playerMaxHp;
  state.combo = 0;
  document.body.classList.remove('boss-battle', 'phase2');
  document.body.classList.add('super-battle');
  await enterBattleScreen();
  const sp = $('enemySprite');
  sp.style.visibility = 'visible';
  sp.firstChild.classList.add('super-rise');
  await wait(2700);
  sp.firstChild.classList.remove('super-rise');
  startEyeFlicker();
  for (const line of SUPER_INTRO) await speak(line, { wait: true });
  hideBubble();
  flash(true);
  shake($('battleScreen'), 'l');
  music.fx('bossAppear');
  bgm('final');
  await wait(500);
  playerTurn(superBoss.appear);
});
async function superPhase2() {
  B.phase2 = true;
  bgm('silence');
  await wait(400);
  await speak('…へえ。\nやるじゃない。', { wait: true });
  await speak('じゃあ、ぼくも\nほんきで いくよ。', { wait: true });
  hideBubble();
  music.fx('phase');
  flash(true);
  shake($('battleScreen'), 'l');
  document.body.classList.add('phase2');
  startEyeFlicker();
  bgm('final');
  music.tempo = 232;
  await wait(600);
}

// ===================================================================
// GAME OVER
// ===================================================================
const gameOver = guard(async function () {
  const id = newRun();
  stopBattleTimers();
  ui.phase = 'busy'; activeList = null;
  bgm('silence');
  hideBubble();
  document.body.classList.remove('boss-battle', 'super-battle', 'phase2');
  show('gameOverScreen');
  $('goTitle').classList.remove('on');
  $('goText').textContent = '';
  $('goMenu').classList.remove('on'); $('goMenu').innerHTML = '';
  const cv = $('goCanvas'), ctx = cv.getContext('2d');
  const S = 7, cx = cv.width / 2, cy = cv.height / 2 - 10;
  const px = soulMask();
  const zig = y => 8 + [0, 1, 0, -1][y % 4];
  const draw = (split) => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#ff0000';
    px.forEach(([x, y]) => {
      if (split && x === zig(y)) return;
      const off = split ? (x < zig(y) ? -split : split) : 0;
      ctx.fillRect(cx - 8 * S + x * S + off, cy - 8 * S + y * S, S, S);
    });
  };
  const alive = () => id === runId;
  draw(0);
  await sleep(800); if (!alive()) return;
  music.fx('crack');
  draw(6);
  await sleep(1100); if (!alive()) return;
  music.fx('shatter');
  const shards = Array.from({ length: 7 }, () => ({ x: cx + rand(-30, 30), y: cy + rand(-20, 20), vx: rand(-3.2, 3.2), vy: rand(-6, -2), r: 0 }));
  const shard = [[1,0],[0,1],[1,1],[2,1],[1,2]];
  await new Promise(res => {
    let f = 0;
    const tick = () => {
      if (!alive()) { res(); return; }
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#ff0000';
      shards.forEach(s => { s.x += s.vx; s.y += s.vy; s.vy += 0.28; shard.forEach(([a, b]) => ctx.fillRect(Math.round(s.x + a * 4), Math.round(s.y + b * 4), 4, 4)); });
      if (++f < 80) requestAnimationFrame(tick); else { ctx.clearRect(0, 0, cv.width, cv.height); res(); }
    };
    requestAnimationFrame(tick);
  });
  if (!alive()) return;
  await sleep(400); if (!alive()) return;
  $('goTitle').classList.add('on');
  bgm('gameover');
  await sleep(1900); if (!alive()) return;
  ui.phase = 'story';
  await typeInto($('goText'), `まだ あきらめちゃ だめだ…\n${state.playerName || 'きみ'}!\nけついを もて…!`, { speed: 70, voice: 220, wave: 'triangle' });
  if (!alive()) return;
  ui.phase = 'go';
  $('goMenu').classList.add('on');
  new CursorList($('goMenu'), [{ label:'つづける', key:'retry' }, { label:'タイトルへ', key:'title' }], {
    onPick: it => {
      activeList = null;
      if (it.key === 'title') { fadeTo(() => goTitle(true)); return; }
      state.playerHp = state.playerMaxHp;
      state.combo = 0;
      if (B.isSuper) startSuperBattle(); else startEncounter();
    },
  });
  saveGame();
});

// ===================================================================
// SHOP
// ===================================================================
function showShop() {
  newRun();
  ui.phase = 'shop';
  show('shopScreen');
  bgm('title');
  const kp = $('shopKeeper');
  kp.innerHTML = '';
  kp.appendChild(renderSprite('tenin', window.innerWidth < 520 ? 6 : 7));
  const win = $('shopWin');
  if (!win.childElementCount) for (let i = 0; i < 9; i++) { const s = document.createElement('i'); s.style.left = rand(4, 62) + 'px'; s.style.top = rand(4, 46) + 'px'; win.appendChild(s); }
  shopSay(pick(SHOP_LINES));
  renderShop(0);
}
function shopSay(t) { typeInto($('shopMsg'), '* ' + t, { voice: 760, wave: 'triangle', speed: 28 }); }
function renderShop(sel) {
  const items = Object.keys(ITEMS).map(k => ({ key:'item', id:k, label: ITEMS[k].short, right: `${ITEMS[k].price}G` }));
  items.push({ key:'badge', label:'えんぴつ', right: `${BADGE.price}G` });
  Object.keys(LEGENDARY).forEach((k, i) => items.push({ key:'legend', id:k, label: LEGENDARY[k].name, right: state.equipment[k] ? 'そうびちゅう' : `${LEGENDARY[k].price}G`, cls: 'spareable', sepBefore: i === 0 }));
  items.push({ key:'exit', label:'もどる', sepBefore: true });
  new CursorList($('shopList'), items, {
    sel,
    onMove: it => shopInfo(it),
    onPick: (it, i) => shopBuy(it, i),
    onBack: () => fadeTo(() => goTitle()),
  });
}
function shopInfo(it) {
  let t = '';
  if (it.key === 'item') { const x = ITEMS[it.id]; t = `${x.name}\n${x.desc}\nもってる: ${state.items[it.id] || 0}`; }
  else if (it.key === 'badge') t = `${BADGE.name}\n${BADGE.desc}\nいまの ATK: ${state.playerAtk}`;
  else if (it.key === 'legend') { const x = LEGENDARY[it.id]; t = `★ でんせつの そうび\n${x.desc}\n${x.lore}`; }
  else t = 'また きてね。';
  $('shopInfo').innerHTML = `<span class="g">${state.gold} G</span>\n`;
  $('shopInfo').appendChild(document.createTextNode(t));
}
function shopBuy(it, i) {
  if (it.key === 'exit') { fadeTo(() => goTitle()); return; }
  let price, ok;
  if (it.key === 'item') price = ITEMS[it.id].price;
  else if (it.key === 'badge') price = BADGE.price;
  else {
    price = LEGENDARY[it.id].price;
    if (state.equipment[it.id]) { shopSay('それは もう きみの ものだよ。だいじに してね。'); return; }
  }
  if (state.gold < price) { music.fx('back'); shopSay(pick(['ゴールドが たりないみたい。べんきょう してから また おいで。', 'うーん、ちょっと たりないね。モンスターと たたかうか、ともだちに なろう。'])); return; }
  state.gold -= price;
  if (it.key === 'item') { state.items[it.id] = (state.items[it.id] || 0) + 1; music.playSfx('buy'); shopSay(`まいど。${ITEMS[it.id].short}だね。ちきゅうを たのむよ。`); }
  else if (it.key === 'badge') { state.playerAtk += 2; music.playSfx('levelup'); shopSay(`いいおとで けずれた。ATKが 2 あがったよ。(いまの ATK: ${state.playerAtk})`); }
  else {
    state.equipment[it.id] = true;
    if (it.id === 'excalibur') state.playerAtk += 10;
    if (it.id === 'fudebako') { state.playerMaxHp += 50; state.playerHp = state.playerMaxHp; }
    music.playSfx('bossClear'); flash();
    shopSay(`…ほんとうに かうんだ。すごいな きみ。${LEGENDARY[it.id].lore}`);
  }
  saveGame();
  renderShop(i);
}

// ===================================================================
// ZUKAN
// ===================================================================
function showZukan() {
  newRun();
  ui.phase = 'zukan';
  initMonsterBook();
  show('zukanScreen');
  const defs = allMonsterDefs();
  const met = defs.filter(d => { const m = state.monsterBook[d.id]; return m && (m.defeated || m.spared); });
  $('zukanRate').textContent = `COMPLETE ${met.length} / ${defs.length}  (${Math.floor(met.length / defs.length * 100)}%)`;
  $('zukanDetail').textContent = '* モンスターを えらぶと くわしく みられる。';
  const cols = window.innerWidth < 520 ? 4 : 5;
  new CursorList($('zukanGrid'), defs, {
    cols,
    renderItem: d => {
      const m = state.monsterBook[d.id] || {};
      const known = m.defeated || m.spared;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'zcard' + (known ? ' known' : '') + (m.spared ? ' friend' : '') + (isBossId(d.id) ? ' boss' : '');
      card.appendChild(renderSprite(d.id, 3, known ? {} : { silhouette: '#262626' }));
      const n = document.createElement('div'); n.className = 'zn'; n.textContent = known ? d.name : '???';
      card.appendChild(n);
      return card;
    },
    onMove: d => zukanDetail(d),
    onPick: d => { zukanDetail(d); music.voice(voiceOf(d.id).pitch, voiceOf(d.id).wave); },
    onBack: () => fadeTo(() => goTitle()),
  });
  $('zukanBack').innerHTML = '';
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'opt'; back.innerHTML = SOUL_SVG + '<span class="ast">*</span><span class="lbl">もどる</span>';
  back.addEventListener('mouseenter', () => back.classList.add('sel'));
  back.addEventListener('mouseleave', () => back.classList.remove('sel'));
  back.addEventListener('click', () => { music.fx('confirm'); fadeTo(() => goTitle()); });
  $('zukanBack').appendChild(back);
}
function zukanDetail(d) {
  const m = state.monsterBook[d.id] || {};
  const known = m.defeated || m.spared;
  if (!known) { $('zukanDetail').textContent = '* ???\n* まだ であっていない。'; return; }
  const a = ACTS[d.id] || {};
  const line = (d.lines && d.lines.length) ? d.lines[0] : '';
  $('zukanDetail').textContent =
    `* ${d.name}${isBossId(d.id) ? '  [BOSS]' : ''}  ― ATK ${d.atk}\n* ${a.desc || ''}\n` +
    `* たおした: ${m.count || 0}  ともだち: ${m.friendCount || 0}${m.spared ? ' ♥' : ''}\n${line}`;
}

// ===================================================================
// INIT
// ===================================================================
(function stars() {
  const c = $('stars');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() < 0.8 ? 2 : 3;
    s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 3}s;animation-duration:${2 + Math.random() * 3}s;`;
    c.appendChild(s);
  }
})();
loadGame();
showSplash();
