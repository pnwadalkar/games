// Air Hockey: knock the puck into the opposite goal. First to 7 wins.
Hub.register('airhockey', (api, o) => {
  const W = 360, H = 600, R = 26, PR = 16, GW = 130;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const me = { x: W / 2, y: H - 90, vx: 0, vy: 0 }, cpu = { x: W / 2, y: 90, vx: 0, vy: 0 };
  const puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  let sc = [0, 0], pause = 1, tx = me.x, ty = me.y, goalFlash = 0;
  const skill = o.hard ? 1 : .62;

  api.pointer(c, {
    down: (x, y) => { tx = x; ty = y; },
    move: (x, y, e, d) => { if (d || e.pointerType === 'mouse') { tx = x; ty = y; } }
  });
  api.status('You 0 · CPU 0');

  function serve(dir) { puck.x = W / 2; puck.y = H / 2; puck.vx = puck.vy = 0; pause = 1; me.x = W / 2; me.y = H - 90; cpu.x = W / 2; cpu.y = 90; tx = me.x; ty = me.y; puck.vy = 0; puck.dir = dir; }
  function hitMallet(m, dt) {
    const dx = puck.x - m.x, dy = puck.y - m.y, d = Math.hypot(dx, dy), min = R + PR;
    if (d < min && d > 0) {
      const nx = dx / d, ny = dy / d;
      puck.x = m.x + nx * min; puck.y = m.y + ny * min;
      const rel = (puck.vx - m.vx) * nx + (puck.vy - m.vy) * ny;
      puck.vx -= 1.9 * rel * nx; puck.vy -= 1.9 * rel * ny;
      const sp = Math.hypot(puck.vx, puck.vy);
      if (sp > 900) { puck.vx *= 900 / sp; puck.vy *= 900 / sp; }
      api.sfx('hit');
    }
  }

  api.loop(dt => {
    if (pause > 0) { pause -= dt; if (pause <= 0 && puck.vx === 0 && puck.vy === 0) puck.vy = (puck.dir || 1) * 170; return; }
    goalFlash = Math.max(0, goalFlash - dt);
    // player mallet follows the pointer inside its half
    const px = me.x, py = me.y;
    const nx = U.clamp(tx, R, W - R), ny = U.clamp(ty, H / 2 + R, H - R);
    me.x += U.clamp(nx - me.x, -1400 * dt, 1400 * dt); me.y += U.clamp(ny - me.y, -1400 * dt, 1400 * dt);
    me.vx = (me.x - px) / dt; me.vy = (me.y - py) / dt;
    // computer: defend when the puck is coming, attack when it is on its half
    const cx = cpu.x, cy = cpu.y;
    let gx = W / 2, gy = 80;
    if (puck.y < H / 2 + 20) { gx = puck.x + (puck.vx * .05); gy = puck.vy < 0 || puck.y < H * .35 ? Math.min(puck.y - 30, H / 2 - 40) : 90; if (puck.y > cpu.y - 10 && Math.abs(puck.x - cpu.x) < 40) gy = puck.y + 40; }
    gy = U.clamp(gy, R, H / 2 - R);
    const sp = 420 * skill * dt;
    cpu.x += U.clamp(gx - cpu.x, -sp, sp); cpu.y += U.clamp(gy - cpu.y, -sp, sp);
    cpu.x = U.clamp(cpu.x, R, W - R); cpu.y = U.clamp(cpu.y, R, H / 2 - R);
    cpu.vx = (cpu.x - cx) / dt; cpu.vy = (cpu.y - cy) / dt;

    puck.x += puck.vx * dt; puck.y += puck.vy * dt;
    puck.vx *= Math.pow(.62, dt); puck.vy *= Math.pow(.62, dt);
    if (puck.x < PR) { puck.x = PR; puck.vx = Math.abs(puck.vx) * .95; api.sfx('move'); }
    if (puck.x > W - PR) { puck.x = W - PR; puck.vx = -Math.abs(puck.vx) * .95; api.sfx('move'); }
    const inGoal = Math.abs(puck.x - W / 2) < GW / 2;
    if (puck.y < PR && !inGoal) { puck.y = PR; puck.vy = Math.abs(puck.vy) * .95; }
    if (puck.y > H - PR && !inGoal) { puck.y = H - PR; puck.vy = -Math.abs(puck.vy) * .95; }
    hitMallet(me, dt); hitMallet(cpu, dt);
    if (puck.y < -PR || puck.y > H + PR) {
      const mine = puck.y < 0;
      sc[mine ? 0 : 1]++; goalFlash = .6; api.sfx(mine ? 'win' : 'bad');
      api.status('You ' + sc[0] + ' · CPU ' + sc[1]);
      if (sc[0] >= 7 || sc[1] >= 7) return api.end({ win: sc[0] >= 7, title: sc[0] >= 7 ? 'You win!' : 'CPU wins', msg: sc[0] + ' – ' + sc[1], emoji: '🏒' });
      serve(mine ? 1 : -1);
    }
  }, draw);

  function mallet(m, col) {
    U.blob(ctx, m.x + 4, m.y + 10, R, 8, .4);
    U.circle(ctx, m.x, m.y, R, col);
    U.circle(ctx, m.x, m.y, R * .55, U.shade(col, -.2));
    U.circle(ctx, m.x, m.y, R * .3, U.shade(col, .3));
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#12497a'); g.addColorStop(1, '#0f5c8f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.__flat = true;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 54, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,92,122,.8)'; ctx.beginPath(); ctx.arc(W / 2, 0, GW / 2, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(46,229,157,.8)'; ctx.beginPath(); ctx.arc(W / 2, H, GW / 2, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H - 6, W, 6);
    ctx.__flat = false;
    if (goalFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + goalFlash * .4 + ')'; ctx.fillRect(0, 0, W, H); }
    U.text(ctx, sc[1], 30, H / 2 - 30, 40, 'rgba(255,255,255,.25)', 'left', 900);
    U.text(ctx, sc[0], 30, H / 2 + 30, 40, 'rgba(255,255,255,.25)', 'left', 900);
    U.blob(ctx, puck.x + 3, puck.y + 8, PR, 5, .45);
    U.circle(ctx, puck.x, puck.y, PR, '#222a44');
    mallet(cpu, '#ff5c7a'); mallet(me, '#2ee59d');
  }
});
