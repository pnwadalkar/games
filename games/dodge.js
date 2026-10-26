// Dodge: survive as long as possible while orbs fly in from every side.
Hub.register('dodge', (api) => {
  const W = 420, H = 620;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('dpad');
  const p = { x: W / 2, y: H / 2, r: 11 };
  let foes = [], t = 0, spawnT = 0, off = null, trail = [], gems = [], bonus = 0;

  api.pointer(c, {
    down: (x, y) => { off = { dx: p.x - x, dy: p.y - y }; },
    move: (x, y, e, isDown) => {
      if (isDown && off) { p.x = U.clamp(x + off.dx, p.r, W - p.r); p.y = U.clamp(y + off.dy, p.r, H - p.r); }
    },
    up: () => { off = null; }
  });

  function spawn() {
    const side = U.randi(0, 3), sp = U.rand(120, 190) + t * 3.5;
    let x, y;
    if (side === 0) { x = U.rand(0, W); y = -20; } else if (side === 1) { x = W + 20; y = U.rand(0, H); }
    else if (side === 2) { x = U.rand(0, W); y = H + 20; } else { x = -20; y = U.rand(0, H); }
    const aim = Math.atan2(p.y - y, p.x - x) + U.rand(-.5, .5);
    const big = Math.random() < .15;
    foes.push({ x, y, vx: Math.cos(aim) * sp * (big ? .6 : 1), vy: Math.sin(aim) * sp * (big ? .6 : 1), r: big ? 22 : U.rand(7, 12), col: U.pick(['#ff5c7a', '#ff8a3d', '#ff5cc8', '#ffc94d']) });
  }

  api.loop(dt => {
    t += dt;
    const sp = 300 * dt;
    if (api.keys.left) p.x -= sp;
    if (api.keys.right) p.x += sp;
    if (api.keys.up) p.y -= sp;
    if (api.keys.down) p.y += sp;
    p.x = U.clamp(p.x, p.r, W - p.r);
    p.y = U.clamp(p.y, p.r, H - p.r);
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(.12, .7 - t / 60); }
    if (Math.random() < dt * .25 && gems.length < 2) gems.push({ x: U.rand(30, W - 30), y: U.rand(30, H - 30), t: 6 });
    foes.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; });
    foes = foes.filter(f => f.x > -60 && f.x < W + 60 && f.y > -60 && f.y < H + 60);
    gems.forEach(g => { g.t -= dt; });
    gems = gems.filter(g => {
      if (U.dist(g.x, g.y, p.x, p.y) < p.r + 12) { bonus += 50; api.sfx('coin'); api.toast('+50', 600); return false; }
      return g.t > 0;
    });
    trail.push({ x: p.x, y: p.y });
    if (trail.length > 14) trail.shift();
    api.setScore(Math.floor(t * 10) + bonus);
    for (const f of foes) if (U.dist(f.x, f.y, p.x, p.y) < f.r + p.r - 2) { api.end({ msg: 'Survived ' + t.toFixed(1) + 's' }); break; }
  }, draw);

  function draw() {
    c.clear('#0a0e26');
    ctx.strokeStyle = '#141b45';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    gems.forEach(g => {
      ctx.globalAlpha = g.t < 1.5 ? (Math.floor(g.t * 6) % 2 ? .4 : 1) : 1;
      U.text(ctx, '💎', g.x, g.y, 24);
    });
    ctx.globalAlpha = 1;
    foes.forEach(f => { U.circle(ctx, f.x, f.y, f.r, f.col); U.circle(ctx, f.x - f.r * .3, f.y - f.r * .3, f.r * .3, 'rgba(255,255,255,.35)'); });
    trail.forEach((q, i) => { ctx.globalAlpha = i / trail.length * .5; U.circle(ctx, q.x, q.y, p.r * i / trail.length, '#00d4ff'); });
    ctx.globalAlpha = 1;
    U.circle(ctx, p.x, p.y, p.r + 4, 'rgba(0,212,255,.25)');
    U.circle(ctx, p.x, p.y, p.r, '#00d4ff');
    U.text(ctx, t.toFixed(1) + 's', W / 2, 26, 18, '#8f99c4');
    if (t < 2.5) U.text(ctx, api.isTouch ? 'Drag anywhere to move' : 'Arrows / WASD or drag', W / 2, H / 2 + 50, 16, '#fff');
  }
});
