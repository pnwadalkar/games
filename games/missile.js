// Missile Defense: tap to fire an interceptor; its blast destroys incoming missiles. Protect your cities.
Hub.register('missile', (api) => {
  const W = 480, H = 640, GY = H - 56;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const cities = [60, 130, 200, 280, 350, 420].map(x => ({ x, alive: true }));
  const bases = [{ x: 24, ammo: 8 }, { x: W / 2, ammo: 8 }, { x: W - 24, ammo: 8 }];
  let enemies = [], shots = [], blasts = [], score = 0, wave = 1, toSpawn = 8, spawnT = 1, t = 0, rubble = [];

  function fire(x, y) {
    if (api.over || y > GY - 20) return;
    let best = null;
    bases.forEach(b => { if (b.ammo > 0 && (!best || Math.abs(b.x - x) < Math.abs(best.x - x))) best = b; });
    if (!best) { api.toast('Out of ammo!', 600); return; }
    best.ammo--;
    const d = U.dist(best.x, GY - 10, x, y);
    shots.push({ sx: best.x, sy: GY - 10, tx: x, ty: y, x: best.x, y: GY - 10, p: 0, dur: d / 520 });
    api.sfx('shoot');
  }
  api.pointer(c, { down: (x, y) => fire(x, y) });

  api.loop(dt => {
    t += dt;
    spawnT -= dt;
    if (toSpawn > 0 && spawnT <= 0) {
      const tg = U.pick(cities.filter(q => q.alive).concat(bases.map(b => ({ x: b.x }))));
      const sx = U.rand(0, W), d = U.dist(sx, 0, tg.x, GY);
      enemies.push({ sx, sy: 0, x: sx, y: 0, tx: tg.x, ty: GY, p: 0, dur: d / (50 + wave * 7) });
      toSpawn--; spawnT = Math.max(.5, 1.5 - wave * .1);
    }
    enemies.forEach(e => {
      e.p += dt / e.dur; e.x = U.lerp(e.sx, e.tx, e.p); e.y = U.lerp(e.sy, e.ty, e.p);
      if (e.p >= 1) {
        e.dead = true; blasts.push({ x: e.x, y: e.y, r: 0, max: 34, t: 0, evil: true }); api.sfx('boom');
        cities.forEach(q => { if (q.alive && Math.abs(q.x - e.x) < 26) q.alive = false; });
        bases.forEach(b => { if (Math.abs(b.x - e.x) < 22) b.ammo = 0; });
      }
    });
    shots.forEach(s => {
      s.p += dt / s.dur; s.x = U.lerp(s.sx, s.tx, Math.min(1, s.p)); s.y = U.lerp(s.sy, s.ty, Math.min(1, s.p));
      if (s.p >= 1) { s.dead = true; blasts.push({ x: s.tx, y: s.ty, r: 0, max: 46, t: 0 }); api.sfx('pop'); }
    });
    blasts.forEach(b => {
      b.t += dt; b.r = b.max * Math.sin(Math.min(1, b.t / 1.1) * Math.PI);
      if (!b.evil) enemies.forEach(e => { if (!e.dead && U.dist(e.x, e.y, b.x, b.y) < b.r) { e.dead = true; score += 25; api.setScore(score); blasts.push({ x: e.x, y: e.y, r: 0, max: 30, t: 0 }); } });
    });
    enemies = enemies.filter(e => !e.dead); shots = shots.filter(s => !s.dead); blasts = blasts.filter(b => b.t < 1.1);
    if (!cities.some(q => q.alive)) return api.end({ msg: 'All cities destroyed · wave ' + wave, emoji: '🏙️' });
    if (toSpawn === 0 && !enemies.length && !shots.length) {
      const bonus = cities.filter(q => q.alive).length * 50 + bases.reduce((s, b) => s + b.ammo, 0) * 5;
      score += bonus; api.setScore(score); wave++; toSpawn = 6 + wave * 2; spawnT = 1.5;
      bases.forEach(b => { b.ammo = 8; });
      cities.forEach((q, i) => { if (!q.alive && i % 2 === wave % 2) q.alive = true; });
      api.sfx('win'); api.toast('Wave ' + wave + ' · bonus +' + bonus, 1400);
    }
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04061a'); g.addColorStop(1, '#2a1f4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    enemies.forEach(e => {
      ctx.strokeStyle = 'rgba(255,92,122,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.sx, e.sy); ctx.lineTo(e.x, e.y); ctx.stroke();
      U.circle(ctx, e.x, e.y, 4, '#ffd23f');
    });
    shots.forEach(s => {
      ctx.strokeStyle = 'rgba(46,229,157,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.sx, s.sy); ctx.lineTo(s.x, s.y); ctx.stroke();
      U.circle(ctx, s.x, s.y, 3.5, '#fff');
      const k = 5; ctx.strokeStyle = '#2ee59d'; ctx.beginPath(); ctx.moveTo(s.tx - k, s.ty - k); ctx.lineTo(s.tx + k, s.ty + k); ctx.moveTo(s.tx + k, s.ty - k); ctx.lineTo(s.tx - k, s.ty + k); ctx.stroke();
    });
    blasts.forEach(b => { ctx.globalAlpha = .85; U.circle(ctx, b.x, b.y, Math.max(1, b.r), b.evil ? '#ff6b3d' : '#ffe27a'); ctx.globalAlpha = 1; });
    // ground with extruded edge
    const gg = ctx.createLinearGradient(0, GY, 0, H);
    gg.addColorStop(0, '#4a5a2a'); gg.addColorStop(1, '#2a3318');
    ctx.fillStyle = gg; ctx.fillRect(0, GY, W, H - GY);
    ctx.fillStyle = '#8bb04a'; ctx.fillRect(0, GY, W, 4);
    cities.forEach(q => {
      if (!q.alive) { ctx.fillStyle = '#3a3f3a'; ctx.fillRect(q.x - 16, GY - 6, 32, 6); return; }
      U.box(ctx, q.x - 16, GY - 24, 10, 24, '#5fb0ff', 6); U.box(ctx, q.x - 5, GY - 34, 11, 34, '#7cc4ff', 6); U.box(ctx, q.x + 7, GY - 18, 10, 18, '#4a98e8', 6);
    });
    bases.forEach(b => {
      U.box(ctx, b.x - 16, GY - 14, 32, 14, b.ammo ? '#9a7cff' : '#555a77', 8);
      U.text(ctx, b.ammo, b.x, GY + 22, 15, b.ammo ? '#fff' : '#ff5c7a');
    });
    U.text(ctx, 'Wave ' + wave, 12, 18, 15, '#9fb2ff', 'left');
  }
});
