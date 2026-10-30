// Mini Golf: drag back from the ball and let go. Fewest strokes over nine holes wins.
Hub.register('minigolf', (api) => {
  const W = 400, H = 600;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  // Each hole: tee, cup, and wall rectangles [x, y, w, h] inside the 400x600 course.
  const HOLES = [
    { tee: [200, 540], cup: [200, 90], par: 2, walls: [] },
    { tee: [90, 540], cup: [310, 90], par: 2, walls: [[150, 280, 100, 18]] },
    { tee: [200, 540], cup: [200, 80], par: 3, walls: [[40, 330, 200, 18], [160, 190, 200, 18]] },
    { tee: [80, 540], cup: [320, 540], par: 3, walls: [[190, 380, 18, 220]] },
    { tee: [200, 540], cup: [200, 80], par: 3, walls: [[120, 300, 18, 120], [262, 300, 18, 120], [120, 220, 160, 18]] },
    { tee: [60, 540], cup: [340, 80], par: 3, walls: [[130, 200, 18, 400], [260, 0, 18, 400]] },
    { tee: [200, 540], cup: [200, 70], par: 4, walls: [[0, 400, 260, 18], [140, 250, 260, 18], [0, 120, 200, 18]] },
    { tee: [340, 540], cup: [60, 540], par: 3, walls: [[100, 440, 18, 160], [200, 380, 18, 160], [300, 440, 18, 160]] },
    { tee: [200, 545], cup: [200, 60], par: 4, walls: [[60, 400, 120, 18], [220, 400, 120, 18], [60, 250, 120, 18], [220, 250, 120, 18], [185, 120, 30, 18]] }
  ];
  let hole = 0, strokes = 0, total = 0, ball, drag = null, cup, state = 'aim', sink = 0, card = [], t = 0;

  function load() {
    const h = HOLES[hole];
    ball = { x: h.tee[0], y: h.tee[1], vx: 0, vy: 0 };
    cup = { x: h.cup[0], y: h.cup[1] };
    strokes = 0; state = 'aim'; sink = 0; drag = null;
    api.status('Hole ' + (hole + 1) + ' of 9 · par ' + h.par);
  }
  load();

  api.pointer(c, {
    down: (x, y) => { if (state === 'aim' && U.dist(x, y, ball.x, ball.y) < 60) drag = { x, y }; },
    move: (x, y, e, down) => { if (drag && down) drag = { x, y }; },
    up: () => {
      if (!drag) return;
      const dx = ball.x - drag.x, dy = ball.y - drag.y, d = Math.min(120, Math.hypot(dx, dy));
      if (d > 8) {
        const a = Math.atan2(dy, dx);
        ball.vx = Math.cos(a) * d * 5.2; ball.vy = Math.sin(a) * d * 5.2; strokes++; state = 'roll'; api.sfx('hit');
      }
      drag = null;
    }
  });

  function bounce(wl) {
    const [x, y, w, h] = wl, R = 7;
    const cx = U.clamp(ball.x, x, x + w), cy = U.clamp(ball.y, y, y + h), dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
    if (d < R && d >= 0) {
      let nx, ny;
      if (d === 0) { nx = 0; ny = -1; } else { nx = dx / d; ny = dy / d; }
      ball.x = cx + nx * R; ball.y = cy + ny * R;
      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) { ball.vx -= 1.8 * dot * nx; ball.vy -= 1.8 * dot * ny; api.sfx('move'); }
    }
  }

  api.loop(dt => {
    t += dt;
    if (state === 'sink') {
      sink += dt * 2.5; ball.x = U.lerp(ball.x, cup.x, .2); ball.y = U.lerp(ball.y, cup.y, .2);
      if (sink >= 1) {
        card.push(strokes); total += strokes;
        const par = HOLES[hole].par, diff = strokes - par;
        api.toast(strokes === 1 ? 'Hole in one!' : diff <= -1 ? 'Birdie!' : diff === 0 ? 'Par' : '+' + diff, 900);
        hole++;
        if (hole >= HOLES.length) { state = 'done'; return api.end({ win: true, title: 'Round complete', msg: total + ' strokes (par ' + HOLES.reduce((s, q) => s + q.par, 0) + ')', score: total, emoji: '⛳' }); }
        load();
      }
      return;
    }
    if (state !== 'roll') return;
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
      if (ball.x < 7) { ball.x = 7; ball.vx = Math.abs(ball.vx); } if (ball.x > W - 7) { ball.x = W - 7; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < 7) { ball.y = 7; ball.vy = Math.abs(ball.vy); } if (ball.y > H - 7) { ball.y = H - 7; ball.vy = -Math.abs(ball.vy); }
      HOLES[hole].walls.forEach(bounce);
    }
    const f = Math.pow(.35, dt); ball.vx *= f; ball.vy *= f;
    const sp = Math.hypot(ball.vx, ball.vy), dc = U.dist(ball.x, ball.y, cup.x, cup.y);
    if (dc < 13 && sp < 320) { state = 'sink'; sink = 0; api.sfx('coin'); }
    else if (sp < 8) { ball.vx = ball.vy = 0; state = 'aim'; if (strokes >= 12) { card.push(strokes); total += strokes; hole++; api.toast('Pick up — max 12 strokes', 900); if (hole >= HOLES.length) return api.end({ win: true, score: total, title: 'Round complete', msg: total + ' strokes', emoji: '⛳' }); load(); } }
  }, draw);

  function draw() {
    ctx.fillStyle = '#1d5a2e'; ctx.fillRect(0, 0, W, H);
    // grass stripes
    for (let y = 0; y < H; y += 40) { ctx.fillStyle = (y / 40) % 2 ? '#2a7a3d' : '#2f8a45'; ctx.fillRect(0, y, W, 40); }
    const h = HOLES[hole];
    // cup
    U.circle(ctx, cup.x, cup.y, 12, '#10241a'); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(cup.x, cup.y + 2, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cup.x, cup.y); ctx.lineTo(cup.x, cup.y - 38); ctx.stroke();
    ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(cup.x, cup.y - 38); ctx.lineTo(cup.x + 18, cup.y - 31); ctx.lineTo(cup.x, cup.y - 24); ctx.fill();
    h.walls.forEach(w => U.box(ctx, w[0], w[1], w[2], w[3], '#8a5a34', 8));
    // course border
    ctx.__flat = true; ctx.strokeStyle = '#6b4220'; ctx.lineWidth = 10; ctx.strokeRect(0, 0, W, H); ctx.__flat = false;
    if (drag) {
      const dx = ball.x - drag.x, dy = ball.y - drag.y, d = Math.min(120, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(a) * d * 2, ball.y + Math.sin(a) * d * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x - Math.cos(a) * d, ball.y - Math.sin(a) * d); ctx.stroke();
      U.text(ctx, Math.round(d / 1.2) + '%', ball.x, ball.y + 28, 13, '#fff');
    }
    const r = state === 'sink' ? 7 * (1 - sink * .6) : 7;
    U.blob(ctx, ball.x + 2, ball.y + 5, 8, 3, .35);
    U.circle(ctx, ball.x, ball.y, r, '#fff');
    U.text(ctx, 'Hole ' + (hole + 1) + ' · Strokes ' + strokes, 12, 18, 14, '#fff', 'left');
    U.text(ctx, 'Par ' + h.par, W - 12, 18, 14, '#ffe27a', 'right');
  }
});
