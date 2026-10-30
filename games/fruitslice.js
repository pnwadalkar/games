// Fruit Slice: swipe across the fruit to slice it. Skip the bombs; three dropped fruits end the game.
Hub.register('fruitslice', (api) => {
  const W = 400, H = 640;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const KINDS = [['🍉', '#ff4d6d'], ['🍊', '#ff9f1c'], ['🍋', '#ffe14d'], ['🍎', '#e63946'], ['🍍', '#f4c430'], ['🥝', '#7bd150'], ['🍓', '#ff5c8a']];
  let fruits = [], halves = [], splats = [], trail = [], lives = 3, score = 0, t = 0, spawnT = .6, combo = 0, last = null;

  const cut = (a, b, f) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
    const u = U.clamp(((f.x - a[0]) * dx + (f.y - a[1]) * dy) / l2, 0, 1);
    return U.dist(f.x, f.y, a[0] + dx * u, a[1] + dy * u) < f.r + 6;
  };
  function slice(f) {
    f.dead = true;
    if (f.bomb) { api.sfx('boom'); splats.push({ x: f.x, y: f.y, t: .5, c: '#ff5c7a', big: 1 }); lives = 0; return api.end({ msg: score + ' fruit sliced', emoji: '💣', sound: 'boom' }); }
    combo++; score++; api.setScore(score); api.sfx('pop');
    splats.push({ x: f.x, y: f.y, t: .6, c: f.col });
    [-1, 1].forEach(s => halves.push({ x: f.x, y: f.y, vx: f.vx + s * 90, vy: f.vy - 60, a: 0, va: s * 3, s: f.s, side: s, col: f.col }));
  }
  const slash = (x, y) => {
    const p = [x, y];
    trail.push({ x, y, t: .22 });
    if (last) fruits.forEach(f => { if (!f.dead && cut(last, p, f)) slice(f); });
    last = p;
  };
  api.pointer(c, {
    down: (x, y) => { last = [x, y]; combo = 0; },
    move: (x, y, e, down) => { if (down) slash(x, y); },
    up: () => { last = null; if (combo >= 3) { score += combo; api.setScore(score); api.toast('Combo ×' + combo + '!', 700); } combo = 0; }
  });

  function spawn() {
    const bomb = Math.random() < Math.min(.22, .06 + t / 400), k = U.pick(KINDS);
    fruits.push({ x: U.rand(60, W - 60), y: H + 30, vx: U.rand(-90, 90), vy: -U.rand(640, 800), r: 32, s: bomb ? '💣' : k[0], col: k[1], bomb, rot: 0, vr: U.rand(-3, 3), seen: false });
  }
  api.loop(dt => {
    t += dt;
    spawnT -= dt;
    if (spawnT <= 0) { const n = U.randi(1, 2 + Math.floor(t / 40)); for (let i = 0; i < n; i++) spawn(); spawnT = U.rand(.7, 1.3) * Math.max(.55, 1 - t / 120); }
    fruits.forEach(f => {
      f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (f.y < H) f.seen = true;
      if (f.seen && f.y > H + 40 && !f.dead) { f.dead = true; if (!f.bomb) { lives--; api.sfx('bad'); if (lives <= 0) api.end({ msg: score + ' fruit sliced', emoji: '🍉' }); } }
    });
    fruits = fruits.filter(f => !f.dead || f.y < H + 40 && false);
    fruits = fruits.filter(f => !f.dead);
    halves.forEach(h => { h.vy += 900 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.a += h.va * dt; });
    halves = halves.filter(h => h.y < H + 60);
    splats.forEach(s => { s.t -= dt; });
    splats = splats.filter(s => s.t > 0);
    trail.forEach(p => { p.t -= dt; });
    trail = trail.filter(p => p.t > 0);
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3b2a1e'); g.addColorStop(1, '#6b4a2d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // wooden plank wall
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3;
    for (let y = 70; y < H; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    splats.forEach(s => { ctx.globalAlpha = s.t; U.circle(ctx, s.x, s.y, 46 * (s.big ? 1.6 : 1), s.c); ctx.globalAlpha = 1; });
    halves.forEach(h => {
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.a);
      ctx.beginPath(); ctx.rect(h.side < 0 ? -40 : 0, -40, 40, 80); ctx.clip();
      U.text(ctx, h.s, 0, 0, 62); ctx.restore();
    });
    fruits.forEach(f => {
      U.blob(ctx, f.x + 6, f.y + 40, 30, 8, .25);
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      U.text(ctx, f.s, 0, 0, 62); ctx.restore();
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, trail[i].t * 5) + ')';
      ctx.lineWidth = 3 + trail[i].t * 40;
      ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
    }
    U.text(ctx, '❤'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)), W - 14, 26, 22, '#ff5c7a', 'right');
  }
});
