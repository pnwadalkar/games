// Turret Defense: aim with the mouse or your finger and shoot the swarm before it reaches the turret.
Hub.register('turret', (api) => {
  const W = 480, H = 640, CX = W / 2, CY = H / 2 + 20;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls(null);
  let enemies = [], bullets = [], bits = [], aim = -Math.PI / 2, wave = 1, toSpawn = 8, spawnT = 1, hp = 5, score = 0, cool = 0, firing = false, t = 0, kills = 0, shake = 0;

  const setAim = (x, y) => { aim = Math.atan2(y - CY, x - CX); };
  api.pointer(c, {
    down: (x, y) => { setAim(x, y); firing = true; },
    move: (x, y) => { setAim(x, y); },
    up: () => { firing = false; }
  });
  api.on(window, 'keydown', e => { if (e.code === 'Space') firing = true; });
  api.on(window, 'keyup', e => { if (e.code === 'Space') firing = false; });
  api.onKey(k => { if (k === 'left') aim -= .25; if (k === 'right') aim += .25; });

  const rate = () => Math.max(.1, .26 - kills * .0012);
  api.loop(dt => {
    t += dt;
    if (api.keys.left) aim -= 3 * dt; if (api.keys.right) aim += 3 * dt;
    cool -= dt; shake = Math.max(0, shake - dt * 4);
    if ((firing || api.keys.a) && cool <= 0) {
      cool = rate();
      bullets.push({ x: CX + Math.cos(aim) * 30, y: CY + Math.sin(aim) * 30, vx: Math.cos(aim) * 640, vy: Math.sin(aim) * 640 });
      api.sfx('shoot');
    }
    spawnT -= dt;
    if (toSpawn > 0 && spawnT <= 0) {
      const a = U.rand(0, Math.PI * 2), r = 380, big = wave >= 3 && Math.random() < .2;
      enemies.push({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * .9, hp: big ? 3 : 1, big, sp: U.rand(32, 46) + wave * 4 + (big ? -10 : 0), ph: U.rand(0, 6) });
      toSpawn--; spawnT = Math.max(.22, .85 - wave * .06);
    }
    bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; });
    enemies.forEach(e => {
      const a = Math.atan2(CY - e.y, CX - e.x);
      e.x += Math.cos(a) * e.sp * dt; e.y += Math.sin(a) * e.sp * dt; e.ph += dt * 8;
      bullets.forEach(b => {
        if (!b.dead && U.dist(b.x, b.y, e.x, e.y) < (e.big ? 22 : 15)) { b.dead = true; e.hp--; e.hit = .1; api.sfx('hit'); }
      });
      if (e.hp <= 0 && !e.dead) {
        e.dead = true; kills++; score += e.big ? 30 : 10; api.setScore(score);
        for (let i = 0; i < 8; i++) bits.push({ x: e.x, y: e.y, vx: U.rand(-140, 140), vy: U.rand(-140, 140), t: .5 });
      }
      if (U.dist(e.x, e.y, CX, CY) < 28) { e.dead = true; hp--; shake = 1; api.sfx('bad'); if (hp <= 0) api.end({ msg: 'Wave ' + wave + ' · ' + kills + ' kills', emoji: '🧟' }); }
      if (e.hit) e.hit = Math.max(0, e.hit - dt);
    });
    enemies = enemies.filter(e => !e.dead); bullets = bullets.filter(b => !b.dead && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);
    bits.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; }); bits = bits.filter(p => p.t > 0);
    if (toSpawn === 0 && !enemies.length) { wave++; toSpawn = 6 + wave * 3; spawnT = 1.5; if (hp < 5) hp++; api.toast('Wave ' + wave, 900); api.sfx('win'); }
  }, draw);

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate(U.rand(-4, 4) * shake, U.rand(-4, 4) * shake);
    const g = ctx.createRadialGradient(CX, CY, 20, CX, CY, 420);
    g.addColorStop(0, '#2b3a2a'); g.addColorStop(1, '#10180f');
    ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.__flat = true; ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (let r = 80; r < 440; r += 80) { ctx.beginPath(); ctx.ellipse(CX, CY, r, r, 0, 0, 7); ctx.stroke(); }
    ctx.__flat = false;
    // turret base + barrel
    U.blob(ctx, CX + 6, CY + 18, 36, 12, .5);
    U.circle(ctx, CX, CY, 26, '#4a5a78');
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(aim);
    U.box(ctx, 0, -7, 34, 14, '#8da2c8', 6);
    ctx.restore();
    U.circle(ctx, CX, CY, 14, '#c9cfee');
    enemies.forEach(e => {
      const r = e.big ? 22 : 15, wob = Math.sin(e.ph) * 2;
      U.blob(ctx, e.x + 3, e.y + r * .8, r, r * .35, .4);
      U.circle(ctx, e.x, e.y + wob * .3, r, e.hit ? '#fff' : e.big ? '#7a2b8a' : '#4aa84a');
      U.circle(ctx, e.x - r * .35, e.y - r * .15, r * .22, '#fff'); U.circle(ctx, e.x + r * .35, e.y - r * .15, r * .22, '#fff');
      U.circle(ctx, e.x - r * .3, e.y - r * .12, r * .1, '#111'); U.circle(ctx, e.x + r * .4, e.y - r * .12, r * .1, '#111');
    });
    bullets.forEach(b => U.circle(ctx, b.x, b.y, 4, '#ffe27a'));
    bits.forEach(p => { ctx.globalAlpha = Math.max(0, p.t * 2); U.circle(ctx, p.x, p.y, 3, '#7ee26f'); }); ctx.globalAlpha = 1;
    ctx.restore();
    U.text(ctx, 'Wave ' + wave, 12, 18, 15, '#9fb2ff', 'left');
    U.text(ctx, '❤'.repeat(Math.max(0, hp)), W - 12, 20, 18, '#ff5c7a', 'right');
    if (t < 4) U.text(ctx, 'Aim & hold to fire', W / 2, H - 24, 14, 'rgba(255,255,255,.7)');
  }
});
