// Aim Trainer: hit shrinking targets for 30 seconds. Accuracy counts.
Hub.register('aim', (api) => {
  const W = 600, H = 600;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let targets = [], time = 30, hits = 0, shots = 0, score = 0, spawnT = 0, fx = [];

  function spawn() {
    targets.push({ x: U.rand(50, W - 50), y: U.rand(80, H - 50), r: 0, max: U.rand(26, 40), age: 0, life: U.rand(1.6, 2.4) - (30 - time) / 40 });
  }
  api.pointer(c, {
    down: (x, y) => {
      if (api.over) return;
      shots++;
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        const d = U.dist(x, y, t.x, t.y);
        if (d <= t.r) {
          const pts = d < t.r * .3 ? 3 : d < t.r * .65 ? 2 : 1;
          score += pts;
          hits++;
          targets.splice(i, 1);
          fx.push({ x: t.x, y: t.y, r: t.r, s: '+' + pts, a: .5 });
          api.sfx(pts === 3 ? 'coin' : 'pop');
          api.setScore(score);
          return;
        }
      }
      fx.push({ x, y, r: 6, s: '', a: .3, miss: true });
      api.sfx('click');
    }
  });

  api.loop(dt => {
    time -= dt;
    if (time <= 0) {
      time = 0;
      const acc = shots ? Math.round(hits / shots * 100) : 0;
      return api.end({ win: true, title: 'Time up!', emoji: '🎯', score, msg: hits + ' hits · ' + acc + '% accuracy' });
    }
    spawnT -= dt;
    if (spawnT <= 0 && targets.length < 4) { spawn(); spawnT = Math.max(.25, .65 - (30 - time) / 80); }
    targets.forEach(t => {
      t.age += dt;
      const k = t.age / t.life;
      t.r = t.max * (k < .25 ? k / .25 : 1 - (k - .25) / .75 * .85);
    });
    targets = targets.filter(t => t.age < t.life);
    fx.forEach(f => { f.a -= dt; f.y -= 30 * dt; });
    fx = fx.filter(f => f.a > 0);
  }, draw);

  function draw() {
    c.clear('#0e1430');
    ctx.fillStyle = '#18204d';
    ctx.fillRect(0, 0, W, 50);
    U.text(ctx, '⏱ ' + time.toFixed(1), 16, 25, 18, '#fff', 'left');
    const acc = shots ? Math.round(hits / shots * 100) : 100;
    U.text(ctx, acc + '% acc', W - 16, 25, 16, '#8f99c4', 'right');
    targets.forEach(t => {
      [['#ff5c7a', 1], ['#fff', .65], ['#ff5c7a', .3]].forEach(([col, m]) => U.circle(ctx, t.x, t.y, Math.max(0, t.r * m), col));
    });
    fx.forEach(f => {
      ctx.globalAlpha = Math.max(0, f.a * 2);
      if (f.miss) { ctx.strokeStyle = '#8f99c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.stroke(); }
      else U.text(ctx, f.s, f.x, f.y, 24, '#ffc94d', 'center', 900);
    });
    ctx.globalAlpha = 1;
  }
});
