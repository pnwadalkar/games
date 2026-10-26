// Endless runner: jump over cactus, duck under birds. Speed ramps up.
Hub.register('runner', (api) => {
  const W = 720, H = 300, GY = 240;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const p = { x: 70, y: GY, vy: 0, w: 34, h: 44, duck: false, onGround: true };
  let obs = [], speed = 340, dist = 0, spawn = 1.2, t = 0, groundOff = 0, dead = false;
  const clouds = Array.from({ length: 4 }, () => ({ x: U.rand(0, W), y: U.rand(30, 120) }));

  function jump() {
    if (dead || api.over) return;
    if (p.onGround) { p.vy = -780; p.onGround = false; api.sfx('jump'); }
  }
  api.onKey(k => { if (k === 'a' || k === 'up') jump(); });
  api.onSwipe(d => { if (d === 'up') jump(); });
  let downPtr = null;
  api.on(api.stage, 'pointerdown', e => { downPtr = { y: e.clientY }; jump(); });
  api.on(api.stage, 'pointermove', e => { if (downPtr && e.clientY - downPtr.y > 30) p.duckTouch = true; });
  api.on(api.stage, 'pointerup', () => { downPtr = null; p.duckTouch = false; });

  api.loop(dt => {
    t += dt;
    speed = Math.min(900, 340 + t * 9);
    dist += speed * dt / 10;
    api.setScore(Math.floor(dist));
    p.duck = (api.keys.down || p.duckTouch) && p.onGround;
    if (!p.onGround) {
      p.vy += (api.keys.down ? 4200 : 2400) * dt;
      p.y += p.vy * dt;
      if (p.y >= GY) { p.y = GY; p.vy = 0; p.onGround = true; }
    }
    spawn -= dt;
    if (spawn <= 0) {
      const bird = t > 12 && Math.random() < .3;
      if (bird) {
        const high = Math.random() < .5;
        obs.push({ type: 'bird', x: W + 20, y: high ? GY - 70 : GY - 38, w: 40, h: 24 });
      } else {
        const n = U.randi(1, t > 20 ? 3 : 2);
        obs.push({ type: 'cactus', x: W + 20, y: GY, w: 18 * n + 6 * (n - 1), h: U.randi(34, 52), n });
      }
      spawn = U.rand(.75, 1.5) * (420 / speed) + .35;
    }
    obs.forEach(o => { o.x -= speed * dt; });
    obs = obs.filter(o => o.x + o.w > -20);
    clouds.forEach(cl => { cl.x -= speed * .15 * dt; if (cl.x < -60) { cl.x = W + 40; cl.y = U.rand(30, 120); } });
    groundOff = (groundOff + speed * dt) % 40;
    const ph = p.duck ? 26 : p.h;
    const box = { x: p.x + 5, y: p.y - ph + 4, w: (p.duck ? 46 : p.w) - 10, h: ph - 6 };
    for (const o of obs) {
      const ob = o.type === 'bird' ? { x: o.x + 4, y: o.y - o.h + 4, w: o.w - 8, h: o.h - 8 } : { x: o.x + 3, y: o.y - o.h + 3, w: o.w - 6, h: o.h - 3 };
      if (U.hit(box, ob)) { dead = true; api.end({ msg: Math.floor(dist) + ' m' }); break; }
    }
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d2b64'); g.addColorStop(1, '#f8cdda');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    clouds.forEach(cl => { ctx.beginPath(); ctx.ellipse(cl.x, cl.y, 34, 12, 0, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#3d2f5b';
    ctx.fillRect(0, GY, W, H - GY);
    ctx.fillStyle = '#5a4785';
    for (let x = -groundOff; x < W; x += 40) ctx.fillRect(x, GY + 10, 18, 3);
    ctx.fillStyle = '#2b2142';
    ctx.fillRect(0, GY, W, 3);
    obs.forEach(o => {
      if (o.type === 'cactus') {
        ctx.fillStyle = '#2ea44f';
        for (let i = 0; i < o.n; i++) {
          const x = o.x + i * 24;
          U.rr(ctx, x, o.y - o.h, 18, o.h, 6); ctx.fill();
          U.rr(ctx, x - 6, o.y - o.h * .7, 8, 16, 4); ctx.fill();
          U.rr(ctx, x + 16, o.y - o.h * .8, 8, 14, 4); ctx.fill();
        }
      } else {
        ctx.fillStyle = '#ffd166';
        const flapUp = Math.floor(t * 8) % 2;
        ctx.beginPath(); ctx.ellipse(o.x + 20, o.y - 12, 18, 8, 0, 0, 7); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(o.x + 12, o.y - 14); ctx.lineTo(o.x + 22, o.y - (flapUp ? 32 : -4)); ctx.lineTo(o.x + 28, o.y - 14);
        ctx.fill();
        ctx.fillStyle = '#ff7b00';
        ctx.beginPath(); ctx.moveTo(o.x + 2, o.y - 12); ctx.lineTo(o.x - 8, o.y - 9); ctx.lineTo(o.x + 4, o.y - 7); ctx.fill();
      }
    });
    // runner
    const ph = p.duck ? 26 : p.h, pw = p.duck ? 46 : p.w;
    ctx.fillStyle = '#00d4ff';
    U.rr(ctx, p.x, p.y - ph, pw, ph - 8, 9); ctx.fill();
    U.circle(ctx, p.x + pw - 9, p.y - ph + 10, 4, '#fff');
    U.circle(ctx, p.x + pw - 8, p.y - ph + 10, 2, '#111');
    ctx.fillStyle = '#0096b4';
    const leg = p.onGround ? Math.sin(t * 22) * 5 : 0;
    ctx.fillRect(p.x + 7 + leg, p.y - 9, 7, 9);
    ctx.fillRect(p.x + pw - 16 - leg, p.y - 9, 7, 9);
  }
});
