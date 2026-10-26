// Sky Hop (Doodle Jump style): bounce upward on platforms, don't fall.
Hub.register('skyhop', (api) => {
  const W = 400, H = 640, G = 1300, JUMP = -690;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr');
  const p = { x: W / 2 - 18, y: H - 120, vx: 0, vy: JUMP, w: 36, h: 36, face: 1 };
  let plats = [], height = 0, topY = H, touchDir = 0;

  function addPlat(y, solid) {
    const h = height + (H - y);
    const r = Math.random();
    let type = 'n';
    if (h > 1500 && r < Math.min(.3, h / 20000)) type = 'm';
    if (h > 3000 && r > .9 && !solid) type = 'b';
    const pl = { x: U.rand(0, W - 64), y, w: 64, h: 14, type, vx: type === 'm' ? U.rand(60, 120) * (Math.random() < .5 ? -1 : 1) : 0, spring: type === 'n' && Math.random() < .08 };
    plats.push(pl);
    // a breaking platform is a decoy, so always add a real one beside it
    if (type === 'b') addPlat(y + U.rand(-20, 20), true);
    return pl;
  }
  plats.push({ x: W / 2 - 40, y: H - 40, w: 80, h: 14, type: 'n', vx: 0 });
  for (let y = H - 120; y > -40; y -= U.rand(60, 90)) addPlat(y);
  topY = Math.min(...plats.map(q => q.y));

  const half = e => {
    const r = c.cv.getBoundingClientRect();
    return (e.clientX - r.left) < r.width / 2 ? -1 : 1;
  };
  api.on(c.cv, 'pointerdown', e => { e.preventDefault(); touchDir = half(e); });
  api.on(c.cv, 'pointermove', e => { if (e.buttons || e.pointerType === 'touch') touchDir = half(e); });
  api.on(c.cv, 'pointerup', () => { touchDir = 0; });
  api.on(c.cv, 'pointercancel', () => { touchDir = 0; });

  api.loop(dt => {
    const dir = (api.keys.left ? -1 : 0) + (api.keys.right ? 1 : 0) || touchDir;
    p.vx = U.lerp(p.vx, dir * 330, Math.min(1, dt * 10));
    if (dir) p.face = dir;
    p.x += p.vx * dt;
    if (p.x + p.w / 2 < 0) p.x += W; else if (p.x + p.w / 2 > W) p.x -= W;
    const prevBottom = p.y + p.h;
    p.vy += G * dt;
    p.y += p.vy * dt;
    plats.forEach(pl => {
      if (pl.type === 'm') { pl.x += pl.vx * dt; if (pl.x < 0 || pl.x + pl.w > W) pl.vx *= -1; }
      if (pl.falling) pl.y += 400 * dt;
    });
    if (p.vy > 0) {
      for (const pl of plats) {
        if (pl.falling) continue;
        if (prevBottom <= pl.y + 2 && p.y + p.h >= pl.y && p.x + p.w - 6 > pl.x && p.x + 6 < pl.x + pl.w) {
          if (pl.type === 'b') { pl.falling = true; api.sfx('bad'); continue; }
          p.y = pl.y - p.h;
          const spring = pl.spring && p.x + p.w / 2 > pl.x + pl.w / 2 - 14 && p.x + p.w / 2 < pl.x + pl.w / 2 + 14;
          p.vy = spring ? JUMP * 1.65 : JUMP;
          api.sfx(spring ? 'coin' : 'jump');
          break;
        }
      }
    }
    if (p.y < H * .4) {
      const d = H * .4 - p.y;
      p.y += d;
      plats.forEach(pl => { pl.y += d; });
      height += d;
      api.setScore(Math.floor(height / 10));
    }
    plats = plats.filter(pl => pl.y < H + 30);
    topY = Math.min(...plats.map(q => q.y));
    const maxGap = Math.min(150, 70 + height / 120);
    while (topY > -40) { topY -= U.rand(Math.max(50, maxGap - 50), maxGap); addPlat(topY); }
    if (p.y > H) api.end({ msg: 'Height ' + Math.floor(height / 10) });
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const hue = 210 - Math.min(160, height / 100);
    g.addColorStop(0, `hsl(${hue}, 60%, 25%)`); g.addColorStop(1, `hsl(${hue + 20}, 55%, 55%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    for (let y = (height % 40); y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    plats.forEach(pl => {
      ctx.fillStyle = pl.type === 'm' ? '#00d4ff' : pl.type === 'b' ? '#9b6b43' : '#2ee59d';
      U.rr(ctx, pl.x, pl.y, pl.w, pl.h, 7); ctx.fill();
      if (pl.type === 'b') { ctx.strokeStyle = '#5a3a1f'; ctx.beginPath(); ctx.moveTo(pl.x + 20, pl.y); ctx.lineTo(pl.x + 28, pl.y + 14); ctx.moveTo(pl.x + 44, pl.y); ctx.lineTo(pl.x + 38, pl.y + 14); ctx.stroke(); }
      if (pl.spring) { ctx.fillStyle = '#ffc94d'; ctx.fillRect(pl.x + pl.w / 2 - 9, pl.y - 9, 18, 9); }
    });
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(p.face, 1);
    ctx.fillStyle = '#ffc94d';
    U.rr(ctx, -p.w / 2, -p.h / 2, p.w, p.h - 6, 12); ctx.fill();
    ctx.fillStyle = '#e0a800';
    ctx.fillRect(-12, p.h / 2 - 8, 6, 8); ctx.fillRect(6, p.h / 2 - 8, 6, 8);
    U.circle(ctx, 6, -6, 6, '#fff'); U.circle(ctx, 8, -6, 3, '#111');
    ctx.fillStyle = '#ff8a3d'; ctx.fillRect(14, -1, 10, 6);
    ctx.restore();
  }
});
