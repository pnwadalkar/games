// Hoops: drag back and flick the ball up into the basket. Sixty seconds; the hoop starts to move as you score.
Hub.register('hoops', (api) => {
  const W = 400, H = 640, TIME = 60, BX = W / 2, BY = H - 90, RIMY = 190;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let ball = null, drag = null, score = 0, streak = 0, hx = W / 2, hdir = 1, t0 = 0, started = false, left = TIME, t = 0, net = 0, msg = '', msgT = 0, swish = 0, ready = 1;

  const rest = () => ({ x: BX, y: BY });
  api.pointer(c, {
    down: (x, y) => { if (!ball && ready >= 1 && U.dist(x, y, BX, BY) < 70) drag = { x, y }; },
    move: (x, y, e, down) => { if (drag && down) drag = { x: U.clamp(x, 30, W - 30), y: U.clamp(y, BY - 20, H - 20) }; },
    up: () => {
      if (!drag) return;
      const dx = BX - drag.x, dy = BY - drag.y;
      if (dy > 24) {
        if (!started) { started = true; t0 = performance.now(); }
        ball = { x: BX, y: BY, vx: dx * 3.3, vy: -Math.min(1100, 520 + dy * 6.2), above: false, scored: false, rimHit: false, spin: 0 };
        api.sfx('jump'); ready = 0;
      }
      drag = null;
    }
  });

  api.loop(dt => {
    t += dt; net = Math.max(0, net - dt * 3); msgT = Math.max(0, msgT - dt); ready = Math.min(1, ready + dt * 2.5);
    if (score >= 4) { hx += hdir * (30 + Math.min(90, score * 5)) * dt; if (hx > W - 90) hdir = -1; if (hx < 90) hdir = 1; } else hx = W / 2;
    if (started) { left = Math.max(0, TIME - (performance.now() - t0) / 1000); if (left <= 0 && !api.over) { api.end({ win: true, title: 'Buzzer!', msg: score + ' baskets', score, emoji: '🏀' }); } }
    if (!ball) return;
    ball.vy += 1500 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.spin += dt * 6;
    if (ball.x < 14 || ball.x > W - 14) { ball.vx *= -.6; ball.x = U.clamp(ball.x, 14, W - 14); }
    const prevAbove = ball.above;
    ball.above = ball.y < RIMY;
    // rim hits (left and right edges of the hoop)
    [hx - 34, hx + 34].forEach(rx => {
      if (U.dist(ball.x, ball.y, rx, RIMY) < 14 && ball.vy > -200) {
        const nx = ball.x - rx, ny = ball.y - RIMY, d = Math.hypot(nx, ny) || 1;
        const dot = ball.vx * nx / d + ball.vy * ny / d;
        if (dot < 0) { ball.vx -= 1.6 * dot * nx / d; ball.vy -= 1.6 * dot * ny / d; ball.vx *= .8; ball.vy *= .7; ball.rimHit = true; api.sfx('hit'); }
      }
    });
    if (!ball.scored && prevAbove && !ball.above && ball.vy > 0 && Math.abs(ball.x - hx) < 30) {
      ball.scored = true; net = 1; streak++;
      const pts = ball.rimHit ? 2 : streak >= 3 ? 4 : 3;
      score += pts; api.setScore(score); msg = (ball.rimHit ? 'Bank shot' : 'SWISH') + ' +' + pts; msgT = .9; api.sfx('coin');
    }
    if (ball.y > H + 40) { if (!ball.scored) { streak = 0; if (!ball.rimHit || true) api.sfx('bad'); } ball = null; }
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2a6b'); g.addColorStop(.7, '#3a2a6b'); g.addColorStop(1, '#b5651d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // gym floor lines with perspective
    ctx.__flat = true; ctx.fillStyle = '#c98a4a'; ctx.fillRect(0, H - 150, W, 150);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, H - 150); ctx.lineTo(W, H - 150); ctx.moveTo(W / 2 - 60, H - 150); ctx.lineTo(W / 2 - 150, H); ctx.moveTo(W / 2 + 60, H - 150); ctx.lineTo(W / 2 + 150, H); ctx.stroke();
    ctx.__flat = false;
    // backboard + hoop
    U.box(ctx, hx - 60, RIMY - 110, 120, 80, '#f4f6ff', 10);
    ctx.__flat = true; ctx.strokeStyle = '#e63946'; ctx.lineWidth = 4; ctx.strokeRect(hx - 24, RIMY - 70, 48, 36); ctx.__flat = false;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 6; i++) { const x0 = hx - 30 + i * 10, x1 = hx - 22 + i * 7.3, sway = Math.sin(t * 14) * net * 5; ctx.beginPath(); ctx.moveTo(x0, RIMY); ctx.lineTo(x1 + sway, RIMY + 38 + net * 6); ctx.stroke(); }
    if (ball && ball.above === false || !ball) { /* ball in front of the rim handled below */ }
    // ball (behind the front rim while above it)
    const b = ball || (drag ? { x: drag.x, y: drag.y, spin: 0 } : { x: BX, y: BY + (1 - ready) * 30, spin: 0 }), sc = U.clamp(1 - (BY - b.y) / 1100, .45, 1);
    if (ball || ready > .2) {
      U.blob(ctx, b.x + 4, H - 40, 26 * sc, 7 * sc, .35);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin || 0); ctx.scale(sc, sc);
      U.circle(ctx, 0, 0, 26, '#ff8a2a');
      ctx.__flat = true; ctx.strokeStyle = '#7a3a0a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.moveTo(0, -26); ctx.lineTo(0, 26); ctx.arc(0, 0, 26, 0, 7); ctx.stroke(); ctx.__flat = false;
      ctx.restore();
    }
    ctx.__flat = true; ctx.strokeStyle = '#ff5c2a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - 34, RIMY); ctx.lineTo(hx + 34, RIMY); ctx.stroke(); ctx.__flat = false;
    if (drag) {
      const dx = BX - drag.x, dy = BY - drag.y;
      let x = BX, y = BY, vx = dx * 3.3, vy = -Math.min(1100, 520 + dy * 6.2);
      for (let i = 0; i < 14; i++) { vy += 1500 * .05; x += vx * .05; y += vy * .05; U.circle(ctx, x, y, 3.5, 'rgba(255,255,255,' + (.8 - i * .05) + ')'); }
    }
    U.text(ctx, started ? Math.ceil(left) + 's' : TIME + 's', 16, 26, 22, left < 10 ? '#ff5c7a' : '#fff', 'left', 900);
    U.text(ctx, score, W - 16, 26, 28, '#ffd23f', 'right', 900);
    if (streak >= 2) U.text(ctx, '🔥 ×' + streak, W / 2, 26, 18, '#ffe27a', 'center', 900);
    if (msgT > 0) U.text(ctx, msg, W / 2, 330, 30, 'rgba(255,255,255,' + Math.min(1, msgT * 2) + ')', 'center', 900);
    if (!started) U.text(ctx, 'Drag the ball down, then let go', W / 2, H - 20, 14, 'rgba(255,255,255,.8)');
  }
});
