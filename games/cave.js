// Cave Flyer: hold to rise, release to fall; avoid the cave walls and pillars.
Hub.register('cave', (api) => {
  const W = 640, H = 360, SEG = 16;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const heli = { x: 120, y: H / 2, vy: 0 };
  let hold = false, dist = 0, speed = 210, segs = [], blocks = [], trail = [], started = false;
  let mid = H / 2, gap = 250, drift = 0;

  for (let x = 0; x <= W + SEG; x += SEG) segs.push({ x, top: mid - gap / 2, bot: mid + gap / 2 });
  function extend() {
    const last = segs[segs.length - 1];
    gap = Math.max(130, 250 - dist / 60);
    drift = U.clamp(drift + U.rand(-6, 6), -9, 9);
    mid = U.clamp(mid + drift, gap / 2 + 10, H - gap / 2 - 10);
    if (mid <= gap / 2 + 10 || mid >= H - gap / 2 - 10) drift *= -1;
    segs.push({ x: last.x + SEG, top: mid - gap / 2, bot: mid + gap / 2 });
    if (Math.random() < .045 && dist > 300) {
      const h = U.rand(40, Math.min(90, gap * .45));
      blocks.push({ x: last.x + SEG, y: U.rand(mid - gap / 2 + 10, mid + gap / 2 - 10 - h), w: 22, h });
    }
  }

  const press = v => { hold = v; if (v) started = true; };
  api.on(api.stage, 'pointerdown', e => { e.preventDefault(); press(true); });
  api.on(api.stage, 'pointerup', () => press(false));
  api.on(api.stage, 'pointercancel', () => press(false));
  api.onKey(k => { if (k === 'a' || k === 'up') press(true); });
  api.onKeyUp(k => { if (k === 'a' || k === 'up') press(false); });

  const wallAt = x => {
    for (let i = 0; i < segs.length - 1; i++) if (segs[i].x <= x && segs[i + 1].x > x) {
      const t = (x - segs[i].x) / SEG;
      return { top: U.lerp(segs[i].top, segs[i + 1].top, t), bot: U.lerp(segs[i].bot, segs[i + 1].bot, t) };
    }
    return { top: 0, bot: H };
  };

  api.loop(dt => {
    if (!started) return;
    speed = Math.min(420, 210 + dist / 25);
    dist += speed * dt / 10;
    api.setScore(Math.floor(dist));
    heli.vy += (hold ? -1100 : 900) * dt;
    heli.vy = U.clamp(heli.vy, -340, 380);
    heli.y += heli.vy * dt;
    const dx = speed * dt;
    segs.forEach(s => { s.x -= dx; });
    blocks.forEach(b => { b.x -= dx; });
    while (segs[1].x < 0) segs.shift();
    while (segs[segs.length - 1].x < W + SEG) extend();
    blocks = blocks.filter(b => b.x > -40);
    trail.push({ x: heli.x - 16, y: heli.y });
    trail.forEach(t => { t.x -= dx; });
    trail = trail.filter(t => t.x > 0);
    const w = wallAt(heli.x);
    const hb = { x: heli.x - 16, y: heli.y - 9, w: 32, h: 18 };
    if (heli.y - 8 < w.top || heli.y + 8 > w.bot || blocks.some(b => U.hit(hb, b))) {
      api.end({ msg: Math.floor(dist) + ' m' });
    }
  }, draw);

  function draw() {
    c.clear('#0b0f2a');
    ctx.fillStyle = '#3b2a5c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    segs.forEach(s => ctx.lineTo(s.x, s.top));
    ctx.lineTo(W, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, H);
    segs.forEach(s => ctx.lineTo(s.x, s.bot));
    ctx.lineTo(W, H);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7c5cff';
    ctx.lineWidth = 3;
    ctx.beginPath(); segs.forEach((s, i) => i ? ctx.lineTo(s.x, s.top) : ctx.moveTo(s.x, s.top)); ctx.stroke();
    ctx.beginPath(); segs.forEach((s, i) => i ? ctx.lineTo(s.x, s.bot) : ctx.moveTo(s.x, s.bot)); ctx.stroke();
    ctx.fillStyle = '#ff5cc8';
    blocks.forEach(b => { U.rr(ctx, b.x, b.y, b.w, b.h, 5); ctx.fill(); });
    trail.forEach((t, i) => { ctx.globalAlpha = i / trail.length * .4; U.circle(ctx, t.x, t.y, 4, '#00d4ff'); });
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(heli.x, heli.y);
    ctx.rotate(heli.vy / 1400);
    ctx.fillStyle = '#ffc94d';
    U.rr(ctx, -16, -9, 30, 18, 9); ctx.fill();
    ctx.fillStyle = '#00d4ff';
    U.rr(ctx, 2, -6, 10, 9, 4); ctx.fill();
    ctx.fillStyle = '#ffc94d';
    ctx.fillRect(-30, -3, 16, 4);
    ctx.fillStyle = '#ddd';
    const bl = 20 * Math.abs(Math.sin(performance.now() / 40));
    ctx.fillRect(-bl, -14, bl * 2, 3);
    ctx.fillRect(-2, -13, 4, 5);
    ctx.restore();
    if (!started) U.text(ctx, 'Hold to fly up · release to drop', W / 2, H / 2 + 60, 18, '#fff');
  }
});
