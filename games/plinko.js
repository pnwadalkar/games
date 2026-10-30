// Plinko: pick where to drop the chip and watch it bounce down. Ten drops; the middle slots pay least, the edges pay most.
Hub.register('plinko', (api) => {
  const W = 400, H = 620, ROWS = 11, PEGS_Y0 = 120, DY = 38, SLOTS = 9, SW = W / SLOTS;
  const VALS = [100, 40, 15, 5, 1, 5, 15, 40, 100];
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const pegs = [];
  for (let r = 0; r < ROWS; r++) {
    const n = r % 2 ? SLOTS - 1 : SLOTS;
    for (let i = 0; i < n; i++) pegs.push({ x: (r % 2 ? SW : SW / 2) + i * SW, y: PEGS_Y0 + r * DY });
  }
  const slotFlash = {};
  let chips = [], drops = 10, score = 0, hx = W / 2, lit = {}, t = 0;
  api.status('Drops left 10');

  function drop(x) {
    if (api.over || drops <= 0 || chips.length >= 3) return;
    drops--; api.status('Drops left ' + drops);
    chips.push({ x: U.clamp(x, 20, W - 20) + U.rand(-1.5, 1.5), y: 60, vx: 0, vy: 0, r: 11 });
    api.sfx('click');
  }
  api.pointer(c, { down: (x) => { hx = x; drop(x); }, move: (x) => { hx = x; } });
  api.onKey(k => { if (k === 'left') hx = Math.max(20, hx - 24); if (k === 'right') hx = Math.min(W - 20, hx + 24); if (k === 'a' || k === 'down') drop(hx); });

  api.loop(dt => {
    t += dt;
    for (const k in lit) { lit[k] -= dt; if (lit[k] <= 0) delete lit[k]; }
    chips.forEach(ch => {
      for (let s = 0; s < 2; s++) {
        const h = dt / 2;
        ch.vy += 900 * h; ch.x += ch.vx * h; ch.y += ch.vy * h;
        if (ch.x < ch.r) { ch.x = ch.r; ch.vx = Math.abs(ch.vx) * .6; } if (ch.x > W - ch.r) { ch.x = W - ch.r; ch.vx = -Math.abs(ch.vx) * .6; }
        pegs.forEach((p, i) => {
          const dx = ch.x - p.x, dy = ch.y - p.y, d = Math.hypot(dx, dy), m = ch.r + 5;
          if (d < m && d > 0) {
            const nx = dx / d, ny = dy / d;
            ch.x = p.x + nx * m; ch.y = p.y + ny * m;
            const dot = ch.vx * nx + ch.vy * ny;
            if (dot < 0) { ch.vx -= 1.55 * dot * nx; ch.vy -= 1.55 * dot * ny; lit[i] = .25; if (!ch.tick || t - ch.tick > .05) { api.tone(500 + Math.random() * 500, .04, 'triangle', .03); ch.tick = t; } }
            ch.vx += U.rand(-6, 6);
          }
        });
      }
      if (ch.y > H - 70) {
        ch.done = true;
        const slot = U.clamp(Math.floor(ch.x / SW), 0, SLOTS - 1);
        score += VALS[slot]; api.setScore(score); api.sfx(VALS[slot] >= 40 ? 'coin' : 'score');
        ch.slot = slot; slotFlash[slot] = .6;
      }
    });
    for (const k in slotFlash) { slotFlash[k] -= dt; if (slotFlash[k] <= 0) delete slotFlash[k]; }
    chips = chips.filter(ch => !ch.done);
    if (drops <= 0 && !chips.length && !api.over) api.end({ msg: score + ' points', emoji: '🪙', score });
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#20104a'); g.addColorStop(1, '#0c1030');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    pegs.forEach((p, i) => { U.blob(ctx, p.x + 2, p.y + 4, 6, 2.5, .3); U.circle(ctx, p.x, p.y, 5, lit[i] ? '#ffe27a' : '#9fb2ff'); });
    for (let i = 0; i < SLOTS; i++) {
      const x = i * SW, hot = VALS[i] >= 40, col = hot ? '#ff5c7a' : VALS[i] >= 15 ? '#ffb703' : VALS[i] >= 5 ? '#2ee59d' : '#4cc9f0';
      U.box(ctx, x + 3, H - 64, SW - 6, 50, slotFlash[i] ? '#fff' : col, 8);
      U.text(ctx, VALS[i], x + SW / 2, H - 38, 15, '#0b1020', 'center', 900);
    }
    chips.forEach(ch => { U.blob(ctx, ch.x + 3, ch.y + 8, ch.r, 4, .35); U.circle(ctx, ch.x, ch.y, ch.r, '#ffd23f'); U.circle(ctx, ch.x, ch.y, ch.r * .55, '#e0a800'); });
    if (drops > 0) {
      ctx.globalAlpha = .6 + Math.sin(t * 6) * .2; U.circle(ctx, hx, 40, 11, '#ffd23f'); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(hx, 52); ctx.lineTo(hx, 100); ctx.stroke(); ctx.setLineDash([]);
      if (!score && t < 5) U.text(ctx, 'Tap where to drop', W / 2, 90, 15, 'rgba(255,255,255,.7)');
    }
  }
});
