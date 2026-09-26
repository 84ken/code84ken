(() => {
  const header = document.getElementById('site-header');
  const hero = document.querySelector('[data-hero]');

  // ---------- Header: hidden on the first view, shown after a short scroll ----------
  if (header) {
    const THRESHOLD = 120;
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-shown', window.scrollY > THRESHOLD);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  if (!hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const halftone = hero.querySelector('.hero-halftone');
  const steam = hero.querySelector('.hero-steam');

  // ---------- Halftone: the hero photo re-drawn as colored print dots ----------
  const img = new Image();
  img.src = '/assets/img/photos/_dsc1232_hero.webp';
  const imgReady = img.decode ? img.decode() : new Promise((res) => { img.onload = res; });

  function renderHalftone() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!w || !h || !img.naturalWidth) return;

    halftone.width = Math.round(w * DPR);
    halftone.height = Math.round(h * DPR);
    const ctx = halftone.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Dot pitch in CSS px: big enough to read as print, fine enough that the sauna stays obvious.
    // (phones get finer dots: the photo is cropped tight there and must still read as a sauna)
    const cell = Math.max(3.6, Math.min(8, w / 220));
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;

    // Downsample the photo onto the dot grid with the same "cover, center" crop as the CSS background.
    const sample = document.createElement('canvas');
    sample.width = cols;
    sample.height = rows;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(img, (w - dw) / 2 / cell, (h - dh) / 2 / cell, dw / cell, dh / cell);
    const px = sctx.getImageData(0, 0, cols, rows).data;

    // Warm dark-wood ground (not black) so the gaps between dots don't dim the photo.
    ctx.fillStyle = '#2a1d12';
    ctx.fillRect(0, 0, w, h);

    const maxR = cell * 0.74;
    for (let y = 0; y < rows; y++) {
      const offset = (y & 1) ? cell / 2 : 0;
      const cy = y * cell + cell / 2;
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        // area ∝ brightness: bright wood → large dots, shadows → pinpricks
        const rad = Math.min(maxR, (cell / 2) * Math.sqrt(lum) * 1.55);
        if (rad < 0.35) continue;
        ctx.fillStyle = `rgb(${Math.min(255, r * 1.2) | 0},${Math.min(255, g * 1.12) | 0},${Math.min(255, b * 1.02) | 0})`;
        ctx.beginPath();
        ctx.arc(x * cell + offset + cell / 2, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Keep the headline legible (same role as the CSS fallback gradient under it).
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0,0,0,0.12)');
    shade.addColorStop(1, 'rgba(0,0,0,0.50)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);

    halftone.classList.add('is-ready');
  }

  imgReady.then(renderHalftone).catch(() => { /* photo stays as the plain CSS background */ });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderHalftone();
      if (steamApi) steamApi.resize();
    }, 150);
  });

  // ---------- Steam: a wave sweeps left → right on load, then a slow drift ----------
  let steamApi = null;
  if (!reduceMotion) steamApi = startSteam();

  function startSteam() {
    const ctx = steam.getContext('2d');
    let W = 0, H = 0;

    // Soft vapor puff, pre-rendered once.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const sg = sprite.getContext('2d');
    const grad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,248,238,1)');
    grad.addColorStop(0.45, 'rgba(255,248,238,0.42)');
    grad.addColorStop(1, 'rgba(255,248,238,0)');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 128, 128);

    const SWEEP_SECONDS = 2.4;
    const MAX = 240;
    const parts = [];
    let start = performance.now();
    let last = start;
    let acc = 0;
    let raf = 0;
    let inView = true;
    let pageVisible = !document.hidden;

    function resize() {
      W = hero.clientWidth;
      H = hero.clientHeight;
      steam.width = Math.round(W * DPR);
      steam.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    // Puffs are drawn stretched sideways so they read as streaks flowing to the right.
    const STRETCH = 1.8;

    function spawn(sweep) {
      const r0 = sweep ? 40 + Math.random() * 50 : 30 + Math.random() * 40;
      parts.push({
        x: -r0 * STRETCH,
        // denser toward the lower half (benches / stove), lighter behind the headline
        y: H * (0.12 + 0.88 * Math.sqrt(Math.random())),
        vx: sweep ? 260 + Math.random() * 200 : 35 + Math.random() * 45,
        vy: -(4 + Math.random() * 14),
        r: r0,
        rMax: sweep ? 170 : 130,
        grow: sweep ? 20 + Math.random() * 20 : 4 + Math.random() * 6,
        a: sweep ? 0.06 + Math.random() * 0.04 : 0.03 + Math.random() * 0.03,
        amp: 10 + Math.random() * 24,
        freq: 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        age: 0,
      });
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const sweep = t < SWEEP_SECONDS;

      // spawn rate scales with hero width so phones and wide screens get the same density
      const widthFactor = Math.max(0.4, W / 1280);
      acc += (sweep ? 45 : 5) * widthFactor * dt;
      while (acc >= 1 && parts.length < MAX) { spawn(sweep); acc -= 1; }
      if (parts.length >= MAX) acc = 0;

      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r = Math.min(p.rMax, p.r + p.grow * dt);
        const rx = p.r * STRETCH;
        if (p.x - rx > W) { parts.splice(i, 1); continue; }

        const progress = (p.x + rx) / (W + 2 * rx);
        let alpha = p.a;
        if (p.age < 0.6) alpha *= p.age / 0.6;
        if (progress > 0.65) alpha *= Math.max(0, 1 - (progress - 0.65) / 0.35);

        const y = p.y + Math.sin(p.phase + p.age * p.freq) * p.amp;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - rx, y - p.r, rx * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;

      if (inView && pageVisible) raf = requestAnimationFrame(frame);
    }

    function resume() {
      if (raf || !inView || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      resume();
    }).observe(hero);

    document.addEventListener('visibilitychange', () => {
      pageVisible = !document.hidden;
      resume();
    });

    resize();
    start = performance.now();
    last = start;
    resume();

    return { resize };
  }
})();
