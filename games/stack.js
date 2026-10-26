// Stack: drop the sliding block on the tower; overhang gets sliced off.
Hub.register('stack', (api) => {
  const W = 400, H = 640, BH = 28;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let tower = [{ x: 100, w: 200 }], cur, dir = 1, speed = 170, camY = 0, camTarget = 0, falling = [], score = 0, perfect = 0, hue = U.randi(0, 360);

  function newBlock() {
    const top = tower[tower.length - 1];
    dir = Math.random() < .5 ? 1 : -1;
    cur = { x: dir > 0 ? -top.w : W, w: top.w };
    speed = Math.min(420, 170 + tower.length * 7);
  }
  newBlock();

  const yOf = i => H - 140 - i * BH + camY;
  function drop() {
    if (api.over || !cur) return;
    const top = tower[tower.length - 1];
    const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
    if (r - l <= 0) {
      falling.push({ x: cur.x, w: cur.w, y: yOf(tower.length), vy: 0, i: tower.length });
      cur = null;
      return api.end({ msg: score + ' blocks' });
    }
    if (Math.abs(cur.x - top.x) < 5) {
      perfect++;
      cur.x = top.x;
      const grow = perfect >= 3 ? Math.min(10, 200 - top.w) : 0;
      tower.push({ x: top.x - grow / 2, w: top.w + grow });
      api.sfx('coin');
      if (perfect >= 2) api.toast('Perfect ×' + perfect, 700);
    } else {
      perfect = 0;
      const cut = cur.x < top.x ? { x: cur.x, w: l - cur.x } : { x: r, w: cur.x + cur.w - r };
      falling.push({ x: cut.x, w: cut.w, y: yOf(tower.length), vy: 0, i: tower.length });
      tower.push({ x: l, w: r - l });
      api.sfx('hit');
    }
    score = tower.length - 1;
    api.setScore(score);
    if (tower.length > 12) camTarget = (tower.length - 12) * BH;
    newBlock();
  }
  api.on(api.stage, 'pointerdown', e => { e.preventDefault(); drop(); });
  api.onKey(k => { if (k === 'a' || k === 'down') drop(); });

  api.loop(dt => {
    if (cur) {
      cur.x += dir * speed * dt;
      if (cur.x + cur.w > W + 40 && dir > 0) dir = -1;
      if (cur.x < -40 && dir < 0) dir = 1;
    }
    camY = U.lerp(camY, camTarget, Math.min(1, dt * 6));
    falling.forEach(f => { f.vy += 1400 * dt; f.y += f.vy * dt; });
    falling = falling.filter(f => f.y < H + 100);
  }, draw);

  const col = i => `hsl(${(hue + i * 9) % 360}, 70%, 60%)`;
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${(hue + tower.length * 9 + 180) % 360}, 40%, 18%)`);
    g.addColorStop(1, `hsl(${(hue + tower.length * 9 + 200) % 360}, 45%, 32%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    tower.forEach((b, i) => {
      const y = yOf(i);
      if (y > H || y < -BH) return;
      ctx.fillStyle = col(i);
      ctx.fillRect(b.x, y, b.w, BH);
      ctx.fillStyle = 'rgba(0,0,0,.15)';
      ctx.fillRect(b.x, y + BH - 5, b.w, 5);
    });
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(0, yOf(0) + BH, W, H);
    falling.forEach(f => { ctx.fillStyle = col(f.i); ctx.fillRect(f.x, f.y, f.w, BH); });
    if (cur) {
      ctx.fillStyle = col(tower.length);
      ctx.fillRect(cur.x, yOf(tower.length), cur.w, BH);
    }
    U.text(ctx, score, W / 2, 70, 56, '#fff', 'center', 900);
    if (score === 0) U.text(ctx, 'Tap / Space to drop', W / 2, 120, 18, 'rgba(255,255,255,.8)');
  }
});
