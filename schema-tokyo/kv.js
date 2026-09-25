// キービジュアル：頭から立ちのぼる24本の線を、描いて、ゆらす。
// 言葉にふれると、その色が近くの線を伝って頭の中へ流れ込む。
// 顔と下半分の髪は画像（assets/kv-head.png）、上に広がる線と視線と単語は SVG。
import { FAN } from './fan-data.js';

const NS = 'http://www.w3.org/2000/svg';
const NECK = 490;          // 画像と線の継ぎ目（viewBox 座標）
const svg = document.querySelector('.kv-art');
const fanGroup = svg.querySelector('.kv-fan');
const flowGroup = svg.querySelector('.kv-flow');
const words = [...svg.querySelectorAll('.kv-word')];
const beams = [...svg.querySelectorAll('.kv-beam')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);

// [x0,y0,x1,y1,...] → [[x,y],...]（首元→毛先）
const lines = FAN.map(flat => {
  const pts = [];
  for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
  return pts;
});
const TOP = Math.min(...lines.map(l => l[l.length - 1][1]));

// Catmull-Rom → 3次ベジェ
const toPath = pts => {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const mkPath = (parent, d) => {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('pathLength', '1');
  parent.appendChild(p);
  return p;
};
const paths = lines.map(pts => mkPath(fanGroup, toPath(pts)));

// ---------------------------------------------------------------- 色の流入
// 各単語に近い線を5本選び、色付きの点線を重ねておく
const flows = words.map(w => {
  const wx = +w.dataset.x, wy = +w.dataset.y;
  const near = lines
    .map((pts, i) => ({ i, d: Math.min(...pts.map(([x, y]) => Math.hypot(x - wx, (y - wy) * 1.3))) }))
    .sort((a, b) => a.d - b.d).slice(0, 5).map(o => o.i);
  const color = w.dataset.color;
  const overlay = near.map(i => {
    const p = mkPath(flowGroup, toPath(lines[i]));
    p.style.stroke = color;
    return { i, p, anim: null };
  });
  return { w, color, overlay, name: w.textContent };
});

const tintColor = $('kv-tint-color'), pour = $('kv-pour-rect'), tintImg = $('kv-head-tint');
const glow = $('kv-glow'), g0 = $('kv-glow-s0'), g1 = $('kv-glow-s1');
const figIn = $('fig-in');
let active = null, headTween = 0;

// 小さなトゥイーン（SVG属性用）
const tween = (from, to, ms, onStep, ease = t => 1 - Math.pow(1 - t, 3)) => {
  const id = ++headTween, t0 = performance.now();
  const step = now => {
    if (id !== headTween) return;
    const k = Math.min(1, (now - t0) / ms);
    onStep(from + (to - from) * ease(k));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
let pourH = 0, glowR = 0, tintOp = 0;
const setHead = (h, r, op) => {
  pourH = h; glowR = r; tintOp = op;
  pour.setAttribute('height', h.toFixed(1));
  glow.setAttribute('r', r.toFixed(1));
  tintImg.setAttribute('opacity', op.toFixed(2));
};

const activate = f => {
  if (active === f) return;
  if (active) deactivate(active, true);
  active = f;
  f.w.style.fill = f.color;
  if (figIn) figIn.value = f.name;
  // 線：毛先から首元へ流れる（pathLength=1、パスは首元が始点なので dashoffset を増やす）
  f.overlay.forEach((o, k) => {
    o.p.classList.add('on');
    if (!reduce) {
      o.anim?.cancel();
      o.anim = o.p.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 0.85 }],
        { duration: 2600 + k * 180, iterations: Infinity, easing: 'linear' });
    }
  });
  // 頭：上から色が満ちていき、脳のあたりがほのかに光る
  tintColor.setAttribute('flood-color', f.color);
  g0.setAttribute('stop-color', f.color);
  g1.setAttribute('stop-color', f.color);
  const h0 = pourH, r0 = glowR, op0 = tintOp;
  if (reduce) { setHead(340, 150, .85); return; }
  setTimeout(() => {
    if (active !== f) return;
    tween(0, 1, 1800, k => setHead(h0 + (340 - h0) * k, r0 + (150 - r0) * k, op0 + (.85 - op0) * Math.min(1, k * 1.6)));
  }, 650);
};

const deactivate = (f, switching = false) => {
  f.w.style.fill = '';
  f.overlay.forEach(o => {
    o.p.classList.remove('on');
    // フェードアウトが終わってから流れを止める
    setTimeout(() => { if (!o.p.classList.contains('on') && o.anim) { o.anim.cancel(); o.anim = null; } }, 700);
  });
  if (active === f) active = null;
  if (switching) return;
  if (figIn) figIn.value = '—';
  const h0 = pourH, r0 = glowR, op0 = tintOp;
  if (reduce) { setHead(0, 0, 0); return; }
  tween(0, 1, 1400, k => setHead(h0, r0 * (1 - k), op0 * (1 - k)));
  setTimeout(() => { if (!active) setHead(0, 0, 0); }, 1450);
};

// タップでは pointerenter・focus・click が続けて届き、点けてすぐ消えてしまう。
// ホバーはマウスだけ、focus はキーボード操作だけ（タッチは指を離した後に focus が来るので、
// 押してから1秒以内の focus は無視）で反応させ、タップは click で切り替える。
let pressedAt = -1e4;
flows.forEach(f => {
  f.w.addEventListener('pointerdown', () => { pressedAt = performance.now(); });
  f.w.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') activate(f); });
  f.w.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') deactivate(f); });
  f.w.addEventListener('focus', () => { if (performance.now() - pressedAt > 1000) activate(f); });
  f.w.addEventListener('blur', () => deactivate(f));
  f.w.addEventListener('click', () => (active === f ? deactivate(f) : activate(f)));
  f.w.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); active === f ? deactivate(f) : activate(f); }
  });
});

if (!reduce) run();

function run() {
  const mid = (lines.length - 1) / 2;
  // 首元から毛先へ描く。中央の線から外側へ少しずつ遅らせる
  paths.forEach((p, i) => {
    p.style.strokeDasharray = '1 1';
    p.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: 1900, delay: 700 + Math.abs(i - mid) * 45, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'backwards' }
    );
  });
  // 視線は目から外へ
  beams.forEach((b, i) => {
    b.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: 1100, delay: 150 + i * 120, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' }
    );
  });
  // 単語は近いものから順に
  words.forEach(w => {
    const order = +w.dataset.order;
    w.animate(
      [{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }],
      { duration: 900, delay: 1900 + order * 260, easing: 'ease-out', fill: 'backwards' }
    );
  });

  // ---- ゆらぎ
  let pointer = 0, pointerTarget = 0, visible = true, raf = 0;
  const t0 = performance.now();
  const fig = $('fig-t') && { t: $('fig-t'), a: $('fig-a'), b: $('fig-b') };
  let figAt = 0;

  const sway = (x, y, i, t) => {
    const w = Math.pow(Math.max(0, NECK - y) / (NECK - TOP), 1.7); // 首元 0 → 毛先 1
    const dx = 13 * Math.sin(t * .55 + y * .011 + i * .21)
             + 6 * Math.sin(t * .31 - i * .47 + y * .004)
             + pointer * 38 * w;
    const dy = 4 * Math.sin(t * .42 + i * .33);
    return [x + dx * w, y + dy * w];
  };

  const frame = now => {
    const t = (now - t0) / 1000;
    pointer += (pointerTarget - pointer) * .04;
    const swayed = lines.map((pts, i) => toPath(pts.map(([x, y]) => sway(x, y, i, t))));
    swayed.forEach((d, i) => paths[i].setAttribute('d', d));
    // 色の線も同じ形に追従させる（表示中のものだけ）
    flows.forEach(f => f.overlay.forEach(o => { if (o.p.classList.contains('on') || o.anim) o.p.setAttribute('d', swayed[o.i]); }));
    words.forEach(w => {
      const x = +w.dataset.x, y = +w.dataset.y;
      const [nx, ny] = sway(x, y, +w.dataset.i, t);
      w.setAttribute('transform', `translate(${(nx - x).toFixed(2)} ${(ny - y).toFixed(2)})`);
    });
    // Fig. 1 の計測値（中央の線の毛先がどれだけ振れているか）
    if (fig && now - figAt > 120) {
      figAt = now;
      const tip = lines[12][lines[12].length - 1];
      fig.t.value = t.toFixed(1);
      fig.a.value = ((sway(tip[0], tip[1], 12, t)[0] - tip[0]) / 19).toFixed(2);
      fig.b.value = (pointer >= 0 ? '+' : '') + pointer.toFixed(2);
    }
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  };
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(svg);
  document.addEventListener('visibilitychange', start);
  addEventListener('pointermove', e => {
    pointerTarget = Math.max(-1, Math.min(1, (e.clientX / innerWidth - .5) * 2));
  }, { passive: true });
  start();
}
