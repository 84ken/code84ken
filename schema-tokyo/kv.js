// キービジュアル：頭から立ちのぼる24本の線を、描いて、ゆらす。
// 顔と下半分の髪は画像（assets/kv-head.png）、上に広がる線と視線と単語は SVG。
import { FAN } from './fan-data.js';

const NS = 'http://www.w3.org/2000/svg';
const NECK = 490;          // 画像と線の継ぎ目（viewBox 座標）
const svg = document.querySelector('.kv-art');
const fanGroup = svg.querySelector('.kv-fan');
const words = [...svg.querySelectorAll('.kv-word')];
const beams = [...svg.querySelectorAll('.kv-beam')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const paths = lines.map(pts => {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', toPath(pts));
  p.setAttribute('pathLength', '1');
  fanGroup.appendChild(p);
  return p;
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
  const $ = id => document.getElementById(id);
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
    lines.forEach((pts, i) => {
      paths[i].setAttribute('d', toPath(pts.map(([x, y]) => sway(x, y, i, t))));
    });
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
