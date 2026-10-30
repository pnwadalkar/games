// Balloon Pop: tap balloons before they float away. Pop several of one colour in a row for a combo. Avoid spiky ones.
Hub.register('balloons', (api) => {
  const W = 400, H = 640;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const COLS = ['#ff4d6d', '#ffb703', '#2ee59d', '#4cc9f0', '#9d4edd', '#ff8fab'];
  let balls = [], bits = [], clouds = Array.from({ length: 5 }, () => ({ x: U.rand(0, W), y: U.rand(40, H * .7), s: U.rand(.6, 1.2), v: U.rand(6, 16) }));
  let lives = 5, score = 0, t = 0, spawnT = .3, lastCol = -1, streak = 0;

  api.pointer(c, {
    down: (x, y) => {
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (((x - b.x) / (b.r * .85)) ** 2 + ((y - b.y) / b.r) ** 2 < 1.15) { pop(b, i); return; }
      }
      streak = 0;
    }
  });
  function pop(b, i) {
    balls.splice(i, 1);
    api.sfx(b.spike ? 'boom' : 'pop');
    for (let k = 0; k < 12; k++) bits.push({ x: b.x, y: b.y, vx: U.rand(-160, 160), vy: U.rand(-200, 80), t: .6, col: b.spike ? '#555' : COLS[b.c] });
    if (b.spike) { lives = Math.max(0, lives - 2); if (lives <= 0) api.end({ msg: score + ' points', emoji: '🎈' }); return; }
    streak = b.c === lastCol ? streak + 1 : 1; lastCol = b.c;
    const pts = 1 + (streak >= 3 ? streak - 2 : 0);
    score += pts; api.setScore(score);
    if (streak >= 3) api.toast('Combo ×' + streak, 500);
  }

  api.loop(dt => {
    t += dt;
    spawnT -= dt;
    if (spawnT <= 0) {
      const spike = Math.random() < Math.min(.16, .04 + t / 500), r = U.rand(26, 38);
      balls.push({ x: U.rand(r, W - r), y: H + r, vy: -U.rand(70, 120) - t * 1.4, r, c: U.randi(0, COLS.length - 1), spike, ph: U.rand(0, 6), sway: U.rand(10, 30) });
      spawnT = Math.max(.28, .85 - t / 140) * U.rand(.7, 1.2);
    }
    balls.forEach(b => { b.y += b.vy * dt; b.x += Math.sin(t * 2 + b.ph) * b.sway * dt; });
    balls = balls.filter(b => {
      if (b.y < -b.r * 2) { if (!b.spike) { lives--; api.sfx('bad'); streak = 0; if (lives <= 0) api.end({ msg: score + ' points', emoji: '🎈' }); } return false; }
      return true;
    });
    bits.forEach(p => { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; });
    bits = bits.filter(p => p.t > 0);
    clouds.forEach(cl => { cl.x += cl.v * dt; if (cl.x > W + 80) cl.x = -80; });
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#59b8ff'); g.addColorStop(1, '#d9f3ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    clouds.forEach(cl => { ctx.beginPath(); ctx.arc(cl.x, cl.y, 24 * cl.s, 0, 7); ctx.arc(cl.x + 28 * cl.s, cl.y - 8 * cl.s, 30 * cl.s, 0, 7); ctx.arc(cl.x + 58 * cl.s, cl.y, 22 * cl.s, 0, 7); ctx.fill(); });
    balls.forEach(b => {
      ctx.strokeStyle = 'rgba(60,60,80,.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r); ctx.quadraticCurveTo(b.x + Math.sin(t * 3 + b.ph) * 8, b.y + b.r + 24, b.x, b.y + b.r + 46); ctx.stroke();
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(.85, 1);
      U.circle(ctx, 0, 0, b.r, b.spike ? '#555a6e' : COLS[b.c]);
      ctx.restore();
      ctx.fillStyle = b.spike ? '#555a6e' : COLS[b.c];
      ctx.beginPath(); ctx.moveTo(b.x - 5, b.y + b.r + 4); ctx.lineTo(b.x + 5, b.y + b.r + 4); ctx.lineTo(b.x, b.y + b.r - 2); ctx.fill();
      if (b.spike) U.text(ctx, '✸', b.x, b.y, b.r, '#ff5c7a');
    });
    bits.forEach(p => { ctx.globalAlpha = Math.max(0, p.t * 1.6); U.circle(ctx, p.x, p.y, 4, p.col); });
    ctx.globalAlpha = 1;
    U.text(ctx, '❤'.repeat(Math.max(0, lives)), W - 12, 24, 20, '#d6003c', 'right');
    if (streak >= 2) U.text(ctx, '×' + streak, 14, 24, 22, '#fff', 'left', 900);
  }
});
