// Whack-a-mole: tap moles before they hide, avoid bombs. 30 second rounds. Options: n (grid size), fast.
Hub.register('whack', (api, o) => {
  const N = o.n || 3, CELL = 150, TOP = 60, W = N * CELL, H = N * CELL + TOP;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const holes = [];
  for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) holes.push({ x: k * CELL + CELL / 2, y: TOP + r * CELL + CELL / 2 + 20, m: null });
  let time = 30, score = 0, spawnT = .5, hits = [], shake = 0;

  function spawn() {
    const free = holes.filter(h => !h.m);
    if (!free.length) return;
    const h = U.pick(free);
    const prog = 1 - time / 30;
    const life = (o.fast ? .8 : 1.15) - prog * .45;
    const r = Math.random();
    h.m = { kind: r < .14 ? 'bomb' : r < .22 ? 'gold' : 'mole', t: 0, life, hit: false };
  }

  api.pointer(c, {
    down: (x, y) => {
      for (const h of holes) {
        if (!h.m || h.m.hit) continue;
        if (Math.abs(x - h.x) < CELL * .42 && y > h.y - CELL * .55 && y < h.y + CELL * .25) {
          h.m.hit = true;
          h.m.t = Math.max(h.m.t, h.m.life - .15);
          if (h.m.kind === 'bomb') { score = Math.max(0, score - 5); shake = .3; api.sfx('boom'); hits.push({ x: h.x, y: h.y - 50, s: '-5', t: .8, c: '#ff5c7a' }); }
          else { const p = h.m.kind === 'gold' ? 5 : 1; score += p; api.sfx(p > 1 ? 'coin' : 'pop'); hits.push({ x: h.x, y: h.y - 50, s: '+' + p, t: .8, c: '#ffc94d' }); }
          api.setScore(score);
          return;
        }
      }
    }
  });

  api.loop(dt => {
    time -= dt;
    if (time <= 0) { time = 0; return api.end({ win: true, title: 'Time up!', emoji: '🔨', score }); }
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); if (Math.random() < .25 + (1 - time / 30) * .3) spawn(); spawnT = U.rand(.35, .75) * (o.fast ? .7 : 1); }
    holes.forEach(h => { if (h.m) { h.m.t += dt; if (h.m.t > h.m.life) h.m = null; } });
    hits.forEach(p => { p.t -= dt; p.y -= 40 * dt; });
    hits = hits.filter(p => p.t > 0);
    shake = Math.max(0, shake - dt);
  }, draw);

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate(U.rand(-6, 6), U.rand(-6, 6));
    ctx.fillStyle = '#3f8f3a';
    ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = '#4ea64a';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, TOP + (i * 53) % (H - TOP), 4, 10);
    ctx.fillStyle = '#26306b';
    ctx.fillRect(-10, -10, W + 20, TOP + 10);
    U.text(ctx, '⏱ ' + Math.ceil(time) + 's', 16, TOP / 2, 22, '#fff', 'left');
    ctx.fillStyle = '#ffc94d';
    ctx.fillRect(W - 216, TOP / 2 - 6, 200 * (time / 30), 12);
    holes.forEach(h => {
      ctx.fillStyle = '#2b1d0e';
      ctx.beginPath(); ctx.ellipse(h.x, h.y, CELL * .38, CELL * .14, 0, 0, 7); ctx.fill();
      if (h.m) {
        const m = h.m, up = Math.min(1, m.t / .12, (m.life - m.t) / .12);
        const rise = up * CELL * .42;
        ctx.save();
        ctx.beginPath();
        ctx.rect(h.x - CELL / 2, h.y - CELL, CELL, CELL);
        ctx.clip();
        const cy = h.y + 10 - rise;
        if (m.kind === 'bomb') {
          U.circle(ctx, h.x, cy, 34, '#222');
          ctx.fillStyle = '#ffc94d'; ctx.fillRect(h.x - 3, cy - 46, 6, 14);
          U.text(ctx, '💣', h.x, cy, 38);
        } else {
          U.circle(ctx, h.x, cy, 38, m.kind === 'gold' ? '#ffcf3f' : '#8b5a2b');
          U.circle(ctx, h.x, cy + 12, 20, m.kind === 'gold' ? '#ffe58a' : '#c48a55');
          const eye = m.hit ? 'x' : '';
          if (eye) { U.text(ctx, '✕', h.x - 13, cy - 10, 16, '#000'); U.text(ctx, '✕', h.x + 13, cy - 10, 16, '#000'); }
          else { U.circle(ctx, h.x - 13, cy - 10, 5, '#000'); U.circle(ctx, h.x + 13, cy - 10, 5, '#000'); }
          U.circle(ctx, h.x, cy + 4, 7, '#ff7a9a');
        }
        ctx.restore();
      }
      ctx.fillStyle = '#5b3a1a';
      ctx.beginPath(); ctx.ellipse(h.x, h.y + 4, CELL * .4, CELL * .1, 0, 0, Math.PI); ctx.fill();
    });
    hits.forEach(p => U.text(ctx, p.s, p.x, p.y, 28, p.c, 'center', 900));
    ctx.restore();
  }
});
