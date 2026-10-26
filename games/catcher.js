// Fruit Catcher: move the basket to catch fruit; avoid bombs; 3 misses and you're out.
Hub.register('catcher', (api) => {
  const W = 400, H = 640;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr');
  const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍉', '🍒', '🍑'];
  const bk = { x: W / 2 - 45, y: H - 70, w: 90, h: 40 };
  let items = [], lives = 3, score = 0, t = 0, spawnT = 0, pops = [];

  api.pointer(c, {
    down: x => { bk.x = U.clamp(x - bk.w / 2, 0, W - bk.w); },
    move: (x, y, e, isDown) => { if (isDown || e.pointerType === 'mouse') bk.x = U.clamp(x - bk.w / 2, 0, W - bk.w); }
  });

  api.loop(dt => {
    t += dt;
    const sp = 420 * dt;
    if (api.keys.left) bk.x -= sp;
    if (api.keys.right) bk.x += sp;
    bk.x = U.clamp(bk.x, 0, W - bk.w);
    spawnT -= dt;
    if (spawnT <= 0) {
      const bomb = Math.random() < Math.min(.3, .08 + t / 300);
      const gold = !bomb && Math.random() < .06;
      items.push({ x: U.rand(24, W - 24), y: -30, vy: U.rand(150, 210) + t * 4, s: bomb ? '💣' : gold ? '⭐' : U.pick(FRUITS), bomb, gold, r: U.rand(-1, 1) });
      spawnT = Math.max(.3, 1 - t / 90) * U.rand(.6, 1.1);
    }
    items.forEach(it => { it.y += it.vy * dt; it.r += dt; });
    items = items.filter(it => {
      if (it.y > bk.y - 6 && it.y < bk.y + 24 && it.x > bk.x - 4 && it.x < bk.x + bk.w + 4) {
        if (it.bomb) { lives--; api.sfx('boom'); pops.push({ x: it.x, y: it.y, s: '💥', t: .6 }); if (lives <= 0) api.end({ msg: score + ' points' }); }
        else { const v = it.gold ? 5 : 1; score += v; api.setScore(score); api.sfx(it.gold ? 'coin' : 'pop'); pops.push({ x: it.x, y: it.y - 20, s: '+' + v, t: .6 }); }
        return false;
      }
      if (it.y > H + 30) {
        if (!it.bomb) { lives--; api.sfx('bad'); if (lives <= 0) api.end({ msg: score + ' points' }); }
        return false;
      }
      return true;
    });
    pops.forEach(p => { p.t -= dt; p.y -= 50 * dt; });
    pops = pops.filter(p => p.t > 0);
  }, draw);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffb86b'); g.addColorStop(1, '#ff6b8b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a8f3a';
    ctx.fillRect(0, H - 30, W, 30);
    items.forEach(it => {
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.r);
      U.text(ctx, it.s, 0, 0, 34); ctx.restore();
    });
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.moveTo(bk.x, bk.y); ctx.lineTo(bk.x + bk.w, bk.y); ctx.lineTo(bk.x + bk.w - 10, bk.y + bk.h); ctx.lineTo(bk.x + 10, bk.y + bk.h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6b4220'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bk.x + 4, bk.y + i * 10); ctx.lineTo(bk.x + bk.w - 4, bk.y + i * 10); ctx.stroke(); }
    pops.forEach(p => U.text(ctx, p.s, p.x, p.y, 26, '#fff', 'center', 900));
    U.text(ctx, '❤'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)), W - 14, 26, 22, '#d6003c', 'right');
  }
});
