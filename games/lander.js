// Lunar Lander: rotate and thrust to touch down gently on the flat pad. Fuel is limited.
Hub.register('lander', (api) => {
  const W = 480, H = 640;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr+ua');
  let level = 1, score = 0, ship, terrain, pad, fuel, stars, t = 0, state = 'fly', boom = 0, parts = [];
  stars = Array.from({ length: 60 }, () => ({ x: U.rand(0, W), y: U.rand(0, H * .7), r: U.rand(.5, 1.6) }));

  function setup() {
    const pts = [], n = 14, padW = Math.max(54, 100 - level * 6), padI = U.randi(2, n - 3);
    let y = U.rand(H * .72, H * .86);
    for (let i = 0; i <= n; i++) {
      y = U.clamp(y + U.rand(-70, 70), H * .55, H - 40);
      pts.push({ x: i * W / n, y });
    }
    // flatten one span into a landing pad
    const a = pts[padI], b = pts[padI + 1];
    b.x = a.x + Math.max(padW, 40); b.y = a.y;
    if (padI + 2 <= n) pts[padI + 2].x = Math.max(pts[padI + 2].x, b.x + 10);
    pad = { x1: a.x, x2: b.x, y: a.y };
    terrain = pts;
    ship = { x: W / 2, y: 70, vx: U.rand(-25, 25), vy: 0, a: 0 };
    fuel = 100;
    state = 'fly'; parts = [];
  }
  setup();

  const groundY = x => {
    for (let i = 0; i < terrain.length - 1; i++) {
      const p = terrain[i], q = terrain[i + 1];
      if (x >= p.x && x <= q.x) return p.y + (q.y - p.y) * (x - p.x) / (q.x - p.x || 1);
    }
    return H;
  };

  api.onKey(k => { if (state === 'landed' && k === 'a') { level++; setup(); } });
  api.pointer(c, { down: () => { if (state === 'landed') { level++; setup(); } } });

  api.loop(dt => {
    t += dt;
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; });
    parts = parts.filter(p => p.t > 0);
    if (state === 'crash') { boom += dt; return; }
    if (state !== 'fly') return;
    if (api.keys.left) ship.a -= 2.4 * dt;
    if (api.keys.right) ship.a += 2.4 * dt;
    ship.a = U.clamp(ship.a, -1.4, 1.4);
    const thrust = (api.keys.up || api.keys.a) && fuel > 0;
    ship.vy += 38 * dt;
    if (thrust) {
      ship.vx += Math.sin(ship.a) * 120 * dt; ship.vy -= Math.cos(ship.a) * 120 * dt;
      fuel = Math.max(0, fuel - 16 * dt);
      for (let i = 0; i < 2; i++) parts.push({ x: ship.x - Math.sin(ship.a) * 16, y: ship.y + Math.cos(ship.a) * 16, vx: -Math.sin(ship.a) * 120 + U.rand(-30, 30), vy: Math.cos(ship.a) * 120 + U.rand(-30, 30), t: .35 });
    }
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
    if (ship.x < 8) { ship.x = 8; ship.vx = 0; } if (ship.x > W - 8) { ship.x = W - 8; ship.vx = 0; }
    if (ship.y + 16 >= groundY(ship.x)) {
      const onPad = ship.x > pad.x1 && ship.x < pad.x2, soft = ship.vy < 55 && Math.abs(ship.vx) < 32 && Math.abs(ship.a) < .3;
      if (onPad && soft) {
        state = 'landed'; ship.y = pad.y - 16; ship.vx = ship.vy = 0;
        const pts = 100 + Math.round(fuel) * 2;
        score += pts; api.setScore(score); api.sfx('win');
        api.toast('Landed! +' + pts + ' · tap for next', 1600);
      } else {
        state = 'crash'; boom = 0; api.sfx('boom');
        for (let i = 0; i < 40; i++) parts.push({ x: ship.x, y: ship.y, vx: U.rand(-160, 160), vy: U.rand(-200, 60), t: U.rand(.4, 1.1) });
        api.end({ msg: onPad ? 'Too fast or tilted!' : 'You missed the pad.', emoji: '💥', score });
      }
    }
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050816'); g.addColorStop(1, '#1a1f4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => { ctx.globalAlpha = .5 + Math.sin(t * 2 + s.x) * .3; U.circle(ctx, s.x, s.y, s.r, '#fff'); });
    ctx.globalAlpha = 1;
    // terrain with a lit ridge and a side face
    ctx.__flat = true;
    const tg = ctx.createLinearGradient(0, H * .5, 0, H);
    tg.addColorStop(0, '#9aa0b8'); tg.addColorStop(1, '#3a3f5c');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.moveTo(0, H); terrain.forEach(p => ctx.lineTo(p.x, p.y)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); terrain.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.fillStyle = '#2ee59d'; ctx.fillRect(pad.x1, pad.y - 3, pad.x2 - pad.x1, 7);
    ctx.fillStyle = '#fff'; ctx.fillRect(pad.x1, pad.y - 10, 3, 8); ctx.fillRect(pad.x2 - 3, pad.y - 10, 3, 8);
    ctx.__flat = false;
    parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.t * 2); U.circle(ctx, p.x, p.y, 3, state === 'crash' ? '#ffb86b' : '#ffd23f'); });
    ctx.globalAlpha = 1;
    if (state !== 'crash') {
      U.blob(ctx, ship.x, groundY(ship.x) + 4, 18 * U.clamp(1 - (groundY(ship.x) - ship.y) / 500, .2, 1), 4, .35);
      ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.a);
      ctx.fillStyle = '#c9cfee';
      ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(-8, 4); ctx.moveTo(14, 16); ctx.lineTo(8, 4);
      ctx.strokeStyle = '#c9cfee'; ctx.lineWidth = 3; ctx.stroke();
      U.rr(ctx, -10, -8, 20, 16, 5); ctx.fill();
      U.circle(ctx, 0, -12, 9, '#ffd23f');
      U.circle(ctx, 0, -12, 4.5, '#2b3a8a');
      ctx.restore();
    }
    // HUD
    const hud = [['Fuel', fuel, '#ffd23f'], ['Speed', Math.abs(ship.vy), ship.vy < 55 ? '#2ee59d' : '#ff5c7a']];
    U.text(ctx, 'Level ' + level, 12, 18, 15, '#9fb2ff', 'left');
    ctx.fillStyle = 'rgba(255,255,255,.12)'; U.rr(ctx, W - 130, 10, 116, 12, 6); ctx.fill();
    ctx.fillStyle = hud[0][2]; U.rr(ctx, W - 130, 10, Math.max(0, 1.16 * fuel), 12, 6); ctx.fill();
    U.text(ctx, 'v ' + Math.round(ship.vy) + ' · ' + Math.round(Math.abs(ship.vx)), W - 14, 40, 13, hud[1][2], 'right');
    if (t < 4) U.text(ctx, '← → rotate · ↑ thrust · land softly on the green pad', W / 2, H - 20, 13, 'rgba(255,255,255,.7)');
  }
});
