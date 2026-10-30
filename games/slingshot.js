// Slingshot: pull back and let go to launch the ball. Knock out every target; wooden blocks shatter on impact.
Hub.register('slingshot', (api) => {
  const W = 640, H = 400, GY = H - 50, SX = 110, SY = GY - 90, G = 620;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let level = 1, score = 0, shots, ball, targets, blocks, drag = null, bits = [], t = 0, clouds = [60, 260, 470], waiting = false;

  function build() {
    targets = []; blocks = [];
    const n = Math.min(2 + level, 6), baseX = 400;
    for (let i = 0; i < n; i++) {
      const x = baseX + (i % 3) * 70 + U.rand(-6, 6), tier = Math.floor(i / 3), floor = GY - tier * 54;
      targets.push({ x, y: floor - 30, r: 17, alive: true });
      blocks.push({ x: x - 26, y: floor - 44, w: 10, h: 44, hp: 1 }, { x: x + 20, y: floor - 44, w: 10, h: 44, hp: 1 });
      blocks.push({ x: x - 30, y: floor - 54, w: 62, h: 10, hp: 1 });
    }
    shots = n + 2; ball = null; waiting = false; drag = null;
  }
  build();
  api.status('Pull back and release · shots left ' + shots);

  const rest = { x: SX, y: SY };
  api.pointer(c, {
    down: (x, y) => { if (!ball && !api.over && U.dist(x, y, rest.x, rest.y) < 70) drag = { x, y }; },
    move: (x, y, e, down) => {
      if (!drag || !down) return;
      const dx = x - SX, dy = y - SY, d = Math.min(90, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
      drag = { x: SX + Math.cos(a) * d, y: Math.min(GY - 14, SY + Math.sin(a) * d) };
    },
    up: () => {
      if (!drag) return;
      const dx = SX - drag.x, dy = SY - drag.y, d = Math.hypot(dx, dy);
      if (d > 14) { ball = { x: drag.x, y: drag.y, vx: dx * 7.2, vy: dy * 7.2, trail: [], rest: 0 }; shots--; api.sfx('shoot'); api.status('Shots left ' + shots); }
      drag = null;
    }
  });

  function boom(x, y, col, n) { for (let i = 0; i < n; i++) bits.push({ x, y, vx: U.rand(-200, 200), vy: U.rand(-260, 40), t: U.rand(.4, .9), col }); }

  api.loop(dt => {
    t += dt;
    bits.forEach(p => { p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; });
    bits = bits.filter(p => p.t > 0);
    if (!ball) return;
    ball.vy += G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 24) ball.trail.shift();
    targets.forEach(tg => {
      if (tg.alive && U.dist(tg.x, tg.y, ball.x, ball.y) < tg.r + 11) { tg.alive = false; score += 100; api.setScore(score); boom(tg.x, tg.y, '#7ee26f', 16); api.sfx('coin'); ball.vx *= .7; }
    });
    blocks.forEach(b => {
      if (b.hp > 0 && ball.x > b.x - 10 && ball.x < b.x + b.w + 10 && ball.y > b.y - 10 && ball.y < b.y + b.h + 10) {
        const sp = Math.hypot(ball.vx, ball.vy);
        if (sp > 160) { b.hp = 0; score += 20; api.setScore(score); boom(b.x + b.w / 2, b.y + b.h / 2, '#b9824a', 10); api.sfx('hit'); ball.vx *= .72; ball.vy *= .72; }
        else { ball.vx *= -.4; }
      }
    });
    if (ball.y > GY - 11) { ball.y = GY - 11; ball.vy *= -.35; ball.vx *= .7; if (Math.abs(ball.vy) < 40) ball.vy = 0; ball.rest += dt * 2; }
    const stop = ball.x > W + 40 || ball.x < -60 || (ball.y >= GY - 12 && Math.hypot(ball.vx, ball.vy) < 30) || ball.rest > 2.2;
    if (stop && !waiting) {
      waiting = true;
      api.after(500, () => {
        ball = null; waiting = false;
        if (!targets.some(q => q.alive)) {
          score += shots * 50; api.setScore(score); level++; api.sfx('win'); api.toast('Level ' + level + ' · +' + shots * 50 + ' for spare shots', 1400);
          build(); api.status('Shots left ' + shots);
        } else if (shots <= 0) api.end({ msg: 'Reached level ' + level, emoji: '🎯' });
      });
    }
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6bb9ff'); g.addColorStop(1, '#cfeeff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    clouds.forEach((x, i) => { const cx = (x + t * (6 + i * 3)) % (W + 120) - 60; ctx.beginPath(); ctx.arc(cx, 60 + i * 30, 22, 0, 7); ctx.arc(cx + 26, 52 + i * 30, 28, 0, 7); ctx.arc(cx + 54, 60 + i * 30, 20, 0, 7); ctx.fill(); });
    const gg = ctx.createLinearGradient(0, GY, 0, H);
    gg.addColorStop(0, '#7ec850'); gg.addColorStop(.25, '#4e9a2f'); gg.addColorStop(1, '#3a2a18');
    ctx.fillStyle = gg; ctx.fillRect(0, GY, W, H - GY);
    // slingshot
    U.cyl(ctx, SX - 6, SY + 10, 12, GY - SY - 10, '#7a4a22');
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(SX, SY + 20); ctx.lineTo(SX - 14, SY - 6); ctx.moveTo(SX, SY + 20); ctx.lineTo(SX + 14, SY - 6); ctx.stroke();
    const bp = drag || (ball ? null : rest);
    if (bp) {
      ctx.strokeStyle = '#3b2412'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(SX - 14, SY - 6); ctx.lineTo(bp.x, bp.y); ctx.lineTo(SX + 14, SY - 6); ctx.stroke();
    }
    if (drag) {
      const dx = SX - drag.x, dy = SY - drag.y; let x = drag.x, y = drag.y, vx = dx * 7.2, vy = dy * 7.2;
      for (let i = 0; i < 16; i++) { vy += G * .06; x += vx * .06; y += vy * .06; U.circle(ctx, x, y, 3, 'rgba(255,255,255,' + (.9 - i * .05) + ')'); }
    }
    blocks.forEach(b => { if (b.hp > 0) U.box(ctx, b.x, b.y, b.w, b.h, '#c48a4f', 6); });
    targets.forEach(tg => { if (tg.alive) { U.blob(ctx, tg.x + 3, tg.y + tg.r + 3, tg.r, 5, .35); U.circle(ctx, tg.x, tg.y, tg.r, '#7ee26f'); U.text(ctx, '🐷', tg.x, tg.y + 1, 24); } });
    if (ball) { ball.trail.forEach((p, i) => { ctx.globalAlpha = i / 40; U.circle(ctx, p.x, p.y, 3, '#fff'); }); ctx.globalAlpha = 1; }
    const b = ball || drag || rest;
    U.blob(ctx, b.x + 3, GY + 2, 10, 3, .3);
    U.circle(ctx, b.x, b.y, 11, '#ff5c4d');
    bits.forEach(p => { ctx.globalAlpha = Math.max(0, p.t * 2); U.circle(ctx, p.x, p.y, 3.5, p.col); }); ctx.globalAlpha = 1;
    U.text(ctx, 'Level ' + level, 12, 18, 15, '#2b4a7a', 'left');
    U.text(ctx, '●'.repeat(Math.max(0, shots)), W - 12, 18, 16, '#ff5c4d', 'right');
  }
});
