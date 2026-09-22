// Animate measured text, then restore uninterrupted Japanese shaping.
const headline = document.querySelector('.refined-copy');
if (headline && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const lines = [...headline.children];
  const copy = lines.map(line => line.textContent);
  const originalHTML = lines.map(line => line.innerHTML);
  headline.setAttribute('aria-label', copy.join(''));
  lines.forEach(line => line.setAttribute('aria-hidden', 'true'));
  lines[0].innerHTML = '世界の<br class="hero-mobile-break"><span class="hero-square-word"><span class="hero-word">「しかく」</span><i class="hero-square" aria-hidden="true"></i></span>を、';
  lines[1].innerHTML = 'ひら<span class="hero-dash" aria-hidden="true">ーーー</span>く<br class="hero-mobile-break">デザイン。';
  const word = headline.querySelector('.hero-square-word');
  const letters = headline.querySelector('.hero-word');
  const square = headline.querySelector('.hero-square');
  const dash = headline.querySelector('.hero-dash');
  const animations = [];
  let finished = false;
  const restore = () => {
    if (finished) return;
    finished = true;
    animations.forEach(a => a.cancel());
    lines.forEach((line, i) => { line.innerHTML = originalHTML[i]; });
  };
  const animate = (el, frames, options) => {
    const animation = el.animate(frames, options);
    animations.push(animation);
    return animation;
  };
  document.fonts.ready.then(async () => {
    if (finished) return;
    const em = parseFloat(getComputedStyle(headline).fontSize);
    const finalWidth = letters.getBoundingClientRect().width;
    const duration = 2200, delay = 1700;
    const timing = {duration, delay, fill:'both', easing:'linear'};
    // Both stretches share exact keyframe offsets and easing.
    const frames = (small, peak, recoil, settle) => [
      {width:small,offset:0},
      {width:small,offset:.22,easing:'cubic-bezier(.65,0,.25,1)'},
      {width:peak,offset:.53,easing:'cubic-bezier(.2,.8,.3,1)'},
      {width:recoil,offset:.68},
      {width:settle,offset:.82},
      {width:small,offset:1}
    ];
    const wordFrames = frames('.85em', `${finalWidth + em*.18}px`, `${finalWidth - em*.08}px`, `${finalWidth + em*.04}px`);
    wordFrames[5].width = `${finalWidth}px`;
    animate(word, wordFrames, timing);
    animate(square,[{opacity:1,transform:'scaleY(1)',offset:0},{opacity:1,transform:'scaleY(1)',offset:.22},{opacity:1,transform:'scaleY(.7)',offset:.47},{opacity:0,transform:'scaleY(.06)',offset:.58},{opacity:0,offset:1}],timing);
    animate(letters,[{opacity:0,clipPath:'inset(0 100% 0 0)',offset:0},{opacity:0,clipPath:'inset(0 100% 0 0)',offset:.44},{opacity:1,clipPath:'inset(0)',offset:.63},{opacity:1,offset:1}],timing);
    // Keep the complete phrase inside its column at the widest point.
    const textWidth = (() => { const r=document.createRange();if(matchMedia('(max-width:700px)').matches){r.setStart(lines[1].firstChild,0);r.setEnd(dash.nextSibling,1);}else{r.selectNodeContents(lines[1]);}return r.getBoundingClientRect().width; })();
    const stretch = Math.min(dash.scrollWidth, Math.max(0, lines[1].clientWidth-textWidth-em*.15));
    const last = animate(dash, frames('0px',`${stretch}px`,'0px',`${em*.12}px`),timing);
    animate(lines[0],[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0)'}],{duration:600,delay:120,easing:'steps(6,end)',fill:'backwards'});
    animate(lines[1],[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0)'}],{duration:800,delay:750,easing:'steps(8,end)',fill:'backwards'});
    try { await last.finished; } catch {}
    restore();
  });
  addEventListener('resize',restore,{once:true});
}
