// Fruit Merge: drop fruit into the jar. Two of the same kind merge into the next one. Don't overflow the line.
Hub.register('fruitmerge', (api) => {
  const W = 360, H = 600, FLOOR = H - 20, LINE = 120, WALLL = 14, WALLR = W - 14;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const KINDS = [['🍒', 14, '#ff4d6d'], ['🍓', 19, '#ff6b8b'], ['🍇', 25, '#9d4edd'], ['🍊', 31, '#ff9f1c'], ['🍎', 38, '#e63946'], ['🍐', 46, '#9bd13f'], ['🍑', 55, '#ffb38a'], ['🍍', 65, '#f4c430'], ['🍈', 76, '#7bd150'], ['🍉', 88, '#2ea84a']];
  let balls = [], hx = W / 2, cur = U.randi(0, 2), nxt = U.randi(0, 2), score = 0, cool = 0, over = 0, pops = [];

  const dropAt = x => {
    if (cool > 0 || api.over) return;
    const k = KINDS[cur], r = k[1];
    balls.push({ x: U.clamp(x, WALLL + r, WALLR - r), y: LINE - 40, vx: 0, vy: 0, k: cur, r, age: 0 });
    cur = nxt; nxt = U.randi(0, 3); cool = .55; api.sfx('click');
  };
  api.pointer(c, { down: (x) => { hx = x; dropAt(x); }, move: (x) => { hx = x; } });
  api.onKey(k => { if (k === 'left') hx -= 22; if (k === 'right') hx += 22; if (k === 'a' || k === 'down') dropAt(hx); });

  api.loop(dt => {
    cool -= dt;
    const steps = 3, h = dt / steps;
    for (let s = 0; s < steps; s++) {
      balls.forEach(b => {
        b.vy += 1100 * h; b.x += b.vx * h; b.y += b.vy * h; b.age += h;
        if (b.x < WALLL + b.r) { b.x = WALLL + b.r; b.vx *= -.3; } if (b.x > WALLR - b.r) { b.x = WALLR - b.r; b.vx *= -.3; }
        if (b.y > FLOOR - b.r) { b.y = FLOOR - b.r; b.vy *= -.2; b.vx *= .96; }
        b.vx *= .999;
      });
      for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j];
        if (a.dead || b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
        if (d < m && d > 0) {
          if (a.k === b.k && a.k < KINDS.length - 1) {
            a.dead = b.dead = true;
            const nk = a.k + 1, r = KINDS[nk][1];
            balls.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: 0, vy: 0, k: nk, r, age: 1 });
            score += (nk + 1) * (nk + 1); api.setScore(score); api.sfx('pop');
            pops.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: .3, r });
            continue;
          }
          const nx = dx / d, ny = dy / d, ov = (m - d) / 2, ma = a.r * a.r, mb = b.r * b.r, tot = ma + mb;
          a.x -= nx * ov * (mb / tot) * 2; a.y -= ny * ov * (mb / tot) * 2; b.x += nx * ov * (ma / tot) * 2; b.y += ny * ov * (ma / tot) * 2;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const imp = -1.15 * rv / (1 / ma + 1 / mb); a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; b.vx += imp * nx / mb; b.vy += imp * ny / mb; }
        }
      }
      balls = balls.filter(b => !b.dead);
    }
    pops.forEach(p => { p.t -= dt; }); pops = pops.filter(p => p.t > 0);
    // overflow: a settled fruit resting above the line for 2 seconds
    const high = balls.some(b => b.age > 1 && b.y - b.r < LINE && Math.hypot(b.vx, b.vy) < 60);
    over = high ? over + dt : Math.max(0, over - dt);
    if (over > 2 && !api.over) api.end({ msg: score + ' points', emoji: '🍉' });
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffd8a8'); g.addColorStop(1, '#ffb38a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // glass jar
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(WALLL, LINE - 60, WALLR - WALLL, FLOOR - LINE + 60);
    ctx.__flat = true;
    ctx.strokeStyle = 'rgba(120,80,60,.55)'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(WALLL, LINE - 60); ctx.lineTo(WALLL, FLOOR); ctx.lineTo(WALLR, FLOOR); ctx.lineTo(WALLR, LINE - 60); ctx.stroke();
    ctx.setLineDash([10, 8]); ctx.strokeStyle = over > 0 ? 'rgba(230,57,70,' + (.4 + Math.sin(over * 12) * .3) + ')' : 'rgba(120,80,60,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(WALLL, LINE); ctx.lineTo(WALLR, LINE); ctx.stroke(); ctx.setLineDash([]);
    ctx.__flat = false;
    balls.forEach(b => {
      U.circle(ctx, b.x, b.y, b.r, KINDS[b.k][2]);
      U.text(ctx, KINDS[b.k][0], b.x, b.y + 1, b.r * 1.15);
    });
    pops.forEach(p => { ctx.globalAlpha = p.t * 2.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.8 - p.t * 2), 0, 7); ctx.stroke(); });
    ctx.globalAlpha = 1;
    if (!api.over) {
      const r = KINDS[cur][1], x = U.clamp(hx, WALLL + r, WALLR - r);
      ctx.strokeStyle = 'rgba(120,80,60,.25)'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(x, LINE - 40); ctx.lineTo(x, FLOOR); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = cool > 0 ? .35 : 1; U.circle(ctx, x, LINE - 40, r, KINDS[cur][2]); U.text(ctx, KINDS[cur][0], x, LINE - 39, r * 1.15); ctx.globalAlpha = 1;
    }
    U.text(ctx, 'Next', W - 52, 22, 12, '#7a4a30'); U.text(ctx, KINDS[nxt][0], W - 52, 46, 26);
    // evolution chain
    KINDS.forEach((k, i) => U.text(ctx, k[0], 18 + i * 12, H - 6, 11));
  }
});
