// Quick Count: a cloud of dots flashes for a moment. Choose how many there were. Three mistakes end the game.
Hub.register('estimate', (api) => {
  const W = 400, H = 560;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let round = 1, count, dots = [], phase = 'show', showT = 0, options = [], lives = 3, score = 0, feedback = null, t = 0;
  const BTN = i => ({ x: 24 + (i % 2) * 180, y: 400 + Math.floor(i / 2) * 76, w: 172, h: 62 });

  function setup() {
    count = 4 + Math.floor(round * 1.6) + U.randi(0, 3);
    const spread = Math.max(3, Math.round(count * .12));
    dots = [];
    for (let i = 0; i < count; i++) {
      for (let tries = 0; tries < 60; tries++) {
        const x = U.rand(40, W - 40), y = U.rand(70, 330);
        if (dots.every(d => U.dist(d.x, d.y, x, y) > 26)) { dots.push({ x, y, col: U.pick(U.C) }); break; }
      }
    }
    count = dots.length;
    const set = new Set([count]);
    while (set.size < 4) { const v = count + U.randi(-spread, spread) * (Math.random() < .5 ? 1 : 1) + (set.size % 2 ? 1 : -1); if (v > 0) set.add(v); }
    options = U.shuffle([...set]);
    phase = 'show'; showT = Math.max(.7, 1.6 - round * .05); feedback = null;
    api.status('Round ' + round);
  }
  setup();
  const choose = i => {
    if (phase !== 'ask') return;
    const ok = options[i] === count;
    feedback = { ok, pick: options[i] }; phase = 'result';
    if (ok) { score++; api.setScore(score); api.sfx('coin'); } else { lives--; api.sfx('bad'); }
    api.after(1100, () => { if (lives <= 0) return api.end({ msg: score + ' correct', score, emoji: '👀' }); round++; setup(); });
  };
  api.pointer(c, { down: (x, y) => { for (let i = 0; i < 4; i++) if (U.inR(x, y, BTN(i))) choose(i); } });
  api.on(window, 'keydown', e => { if (/^[1-4]$/.test(e.key)) choose(+e.key - 1); });
  api.loop(dt => { t += dt; if (phase === 'show') { showT -= dt; if (showT <= 0) phase = 'ask'; } }, draw, true);

  function draw() {
    c.clear('#14122e');
    ctx.fillStyle = '#1d1a40'; U.rr(ctx, 14, 56, W - 28, 290, 20); ctx.fill();
    U.text(ctx, 'Round ' + round, 18, 28, 16, '#9fb2ff', 'left', 800);
    U.text(ctx, '❤'.repeat(Math.max(0, lives)), W - 18, 28, 18, '#ff5c7a', 'right');
    if (phase === 'show' || phase === 'result') dots.forEach(d => U.circle(ctx, d.x, d.y, 10, d.col));
    else U.text(ctx, '?', W / 2, 200, 80, '#3a3570', 'center', 900);
    U.text(ctx, phase === 'ask' ? 'How many dots?' : phase === 'show' ? 'Count quickly!' : feedback.ok ? 'Correct — ' + count : 'It was ' + count, W / 2, 372, 20, phase === 'result' ? (feedback.ok ? '#2ee59d' : '#ff8a9a') : '#fff', 'center', 800);
    options.forEach((v, i) => U.btn(ctx, BTN(i), v, phase === 'result' ? (v === count ? '#2ea84a' : v === feedback.pick ? '#c2294a' : '#3a3a5a') : '#5b6bd6', 26, phase === 'show'));
  }
});
