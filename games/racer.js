// Highway Racer: weave through traffic, grab coins, speed keeps rising.
Hub.register('racer', (api) => {
  const W = 400, H = 640, LANES = 4, LW = 80, RX = (W - LANES * LW) / 2;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr');
  const car = { x: W / 2 - 20, y: H - 130, w: 40, h: 70 };
  let traffic = [], coins = [], speed = 300, dist = 0, stripe = 0, spawnT = 1, coinsGot = 0, t = 0;
  const COLS = ['#ff5c7a', '#ffc94d', '#2ee59d', '#7c5cff', '#ff8a3d', '#f0f0f0'];

  api.pointer(c, {
    down: x => { car.tx = x; },
    move: (x, y, e, isDown) => { if (isDown || e.pointerType === 'mouse') car.tx = x; },
    up: () => { car.tx = null; }
  });

  api.loop(dt => {
    t += dt;
    speed = Math.min(800, 300 + t * 8);
    dist += speed * dt / 20;
    api.setScore(Math.floor(dist) + coinsGot * 25);
    const sp = 360 * dt;
    if (api.keys.left) car.x -= sp;
    if (api.keys.right) car.x += sp;
    if (car.tx != null) car.x += U.clamp(car.tx - car.w / 2 - car.x, -sp * 1.4, sp * 1.4);
    car.x = U.clamp(car.x, RX + 4, RX + LANES * LW - car.w - 4);
    stripe = (stripe + speed * dt) % 60;
    spawnT -= dt;
    if (spawnT <= 0) {
      const lane = U.randi(0, LANES - 1);
      // never fill every lane near the top, so there is always a way through
      const nearTop = traffic.filter(v => v.y < 170).map(v => v.lane);
      if (!nearTop.includes(lane) && new Set(nearTop).size < LANES - 1) traffic.push({ lane, x: RX + lane * LW + LW / 2 - 21, y: -90, w: 42, h: 74, v: U.rand(.36, .44), col: U.pick(COLS) });
      if (Math.random() < .35) coins.push({ x: RX + U.randi(0, LANES - 1) * LW + LW / 2, y: -30 });
      spawnT = Math.max(.32, .95 - t / 70) * U.rand(.7, 1.2);
    }
    traffic.forEach(v => { v.y += speed * (1 - v.v) * dt; });
    traffic = traffic.filter(v => v.y < H + 100);
    coins.forEach(q => { q.y += speed * dt; });
    const hb = { x: car.x + 4, y: car.y + 6, w: car.w - 8, h: car.h - 12 };
    coins = coins.filter(q => {
      if (U.hit(hb, { x: q.x - 12, y: q.y - 12, w: 24, h: 24 })) { coinsGot++; api.sfx('coin'); return false; }
      return q.y < H + 30;
    });
    for (const v of traffic) if (U.hit(hb, { x: v.x + 4, y: v.y + 4, w: v.w - 8, h: v.h - 8 })) { api.end({ msg: Math.floor(dist) + ' m · ' + coinsGot + ' coins' }); break; }
  }, draw);

  function drawCar(x, y, w, h, col, mine) {
    U.blob(ctx, x + w / 2 + 3, y + h - 2, w * .8, h * .22, .45);
    U.box(ctx, x, y, w, h, col, 10);
    // cabin sits on top of the body
    ctx.fillStyle = 'rgba(20,30,60,.85)';
    U.rr(ctx, x + 5, y + (mine ? 16 : h - 30), w - 10, 14, 4); ctx.fill();
    U.rr(ctx, x + 6, y + (mine ? h - 22 : 10), w - 12, 10, 3); ctx.fill();
    ctx.fillStyle = mine ? '#fff7b0' : '#ff3b3b';
    ctx.fillRect(x + 4, y + (mine ? 2 : h - 5), 8, 3);
    ctx.fillRect(x + w - 12, y + (mine ? 2 : h - 5), 8, 3);
  }
  function draw() {
    c.clear('#2f7d32');
    ctx.fillStyle = '#3a3f55';
    ctx.fillRect(RX, 0, LANES * LW, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(RX - 6, 0, 6, H);
    ctx.fillRect(RX + LANES * LW, 0, 6, H);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let l = 1; l < LANES; l++) for (let y = -60 + stripe; y < H; y += 60) ctx.fillRect(RX + l * LW - 2, y, 4, 30);
    coins.forEach(q => { U.circle(ctx, q.x, q.y, 12, '#ffc94d'); U.text(ctx, '$', q.x, q.y + 1, 14, '#a07800', 'center', 900); });
    traffic.forEach(v => drawCar(v.x, v.y, v.w, v.h, v.col, false));
    drawCar(car.x, car.y, car.w, car.h, '#00d4ff', true);
    U.text(ctx, Math.round(speed / 4) + ' km/h', W - 10, 20, 14, '#fff', 'right');
  }
});
