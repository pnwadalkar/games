// Asteroids: rotate, thrust and shoot rocks that split apart.
Hub.register('asteroids', (api) => {
  const W = 600, H = 600;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr+ua');

  const ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, inv: 2 };
  let rocks = [], bullets = [], parts = [], wave = 0, lives = 3, score = 0, cool = 0, thrusting = false;
  const RAD = { 3: 46, 2: 26, 1: 14 }, PTS = { 3: 20, 2: 50, 1: 100 };

  function rock(x, y, size) {
    const n = U.randi(9, 13), pts = [];
    for (let i = 0; i < n; i++) pts.push(U.rand(.72, 1.15));
    const a = U.rand(0, Math.PI * 2), sp = U.rand(30, 70) + wave * 8 + (3 - size) * 25;
    return { x, y, size, r: RAD[size], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: 0, vr: U.rand(-1, 1), pts };
  }
  function newWave() {
    wave++;
    for (let i = 0; i < 2 + wave; i++) {
      let x, y;
      do { x = U.rand(0, W); y = U.rand(0, H); } while (U.dist(x, y, ship.x, ship.y) < 170);
      rocks.push(rock(x, y, 3));
    }
  }
  newWave();

  const wrap = o => {
    if (o.x < -o.r) o.x += W + o.r * 2; else if (o.x > W + o.r) o.x -= W + o.r * 2;
    if (o.y < -o.r) o.y += H + o.r * 2; else if (o.y > H + o.r) o.y -= H + o.r * 2;
  };
  function burst(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = U.rand(0, 7), s = U.rand(40, 200); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), col }); }
  }

  api.loop(dt => {
    if (api.keys.left) ship.a -= 4.2 * dt;
    if (api.keys.right) ship.a += 4.2 * dt;
    thrusting = !!api.keys.up;
    if (thrusting) { ship.vx += Math.cos(ship.a) * 300 * dt; ship.vy += Math.sin(ship.a) * 300 * dt; }
    const damp = Math.exp(-.55 * dt);
    ship.vx *= damp; ship.vy *= damp;
    const sp = Math.hypot(ship.vx, ship.vy);
    if (sp > 380) { ship.vx *= 380 / sp; ship.vy *= 380 / sp; }
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
    ship.r = 12;
    wrap(ship);
    ship.inv = Math.max(0, ship.inv - dt);
    cool -= dt;
    if (api.keys.a && cool <= 0 && bullets.length < 6) {
      bullets.push({ x: ship.x + Math.cos(ship.a) * 16, y: ship.y + Math.sin(ship.a) * 16, vx: Math.cos(ship.a) * 520 + ship.vx, vy: Math.sin(ship.a) * 520 + ship.vy, life: .95, r: 2 });
      cool = .2;
      api.sfx('shoot');
    }
    bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; wrap(b); });
    rocks.forEach(r => { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; wrap(r); });
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    parts = parts.filter(p => p.life > 0);

    const born = [];
    bullets = bullets.filter(b => {
      if (b.life <= 0) return false;
      for (const r of rocks) if (!r.dead && U.dist(b.x, b.y, r.x, r.y) < r.r) {
        r.dead = true;
        score += PTS[r.size];
        api.setScore(score);
        burst(r.x, r.y, 10 + r.size * 4, '#c9cff0');
        api.sfx(r.size === 3 ? 'boom' : 'pop');
        if (r.size > 1) { born.push(rock(r.x, r.y, r.size - 1)); born.push(rock(r.x, r.y, r.size - 1)); }
        return false;
      }
      return true;
    });
    rocks = rocks.filter(r => !r.dead).concat(born);

    if (ship.inv <= 0) for (const r of rocks) if (U.dist(ship.x, ship.y, r.x, r.y) < r.r * .85 + 10) {
      lives--;
      burst(ship.x, ship.y, 40, '#00d4ff');
      api.sfx('boom');
      if (lives <= 0) { api.end({ msg: 'Wave ' + wave }); ship.dead = true; return; }
      Object.assign(ship, { x: W / 2, y: H / 2, vx: 0, vy: 0, a: -Math.PI / 2, inv: 2.5 });
      break;
    }
    if (!rocks.length) { newWave(); api.toast('Wave ' + wave); }
  }, draw);

  const stars = Array.from({ length: 80 }, () => [Math.random() * W, Math.random() * H, Math.random()]);
  function draw() {
    c.clear('#05071a');
    stars.forEach(s => { ctx.fillStyle = `rgba(255,255,255,${.2 + s[2] * .5})`; ctx.fillRect(s[0], s[1], 1.5, 1.5); });
    ctx.strokeStyle = '#c9cff0';
    ctx.lineWidth = 2;
    rocks.forEach(r => {
      ctx.beginPath();
      r.pts.forEach((m, i) => {
        const a = r.rot + i / r.pts.length * Math.PI * 2;
        const x = r.x + Math.cos(a) * r.r * m, y = r.y + Math.sin(a) * r.r * m;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = '#1b2147';
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = '#fff';
    bullets.forEach(b => U.circle(ctx, b.x, b.y, 2.4, '#fff'));
    parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 2, 2); });
    ctx.globalAlpha = 1;
    if (!ship.dead && !(ship.inv > 0 && Math.floor(ship.inv * 8) % 2)) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.a);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-11, -10); ctx.lineTo(-6, 0); ctx.lineTo(-11, 10); ctx.closePath(); ctx.stroke();
      if (thrusting && Math.random() > .3) {
        ctx.strokeStyle = '#ffc94d';
        ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-20 - Math.random() * 8, 0); ctx.lineTo(-8, 5); ctx.stroke();
      }
      ctx.restore();
    }
    U.text(ctx, 'Wave ' + wave, 12, 20, 15, '#8f99c4', 'left');
    U.text(ctx, '▲'.repeat(Math.max(0, lives)), W - 12, 20, 15, '#00d4ff', 'right');
  }
});
