// Colour Clash (Stroop test): tap the button matching the colour of the INK, not the word. 45 seconds.
Hub.register('stroop', (api) => {
  const W = 400, H = 560, TIME = 45;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const COLS = [['RED', '#ff4d6d'], ['BLUE', '#3a86ff'], ['GREEN', '#2ee59d'], ['YELLOW', '#ffd23f'], ['PURPLE', '#b068ff'], ['ORANGE', '#ff9f1c']];
  let word, ink, score = 0, streak = 0, t0 = 0, started = false, left = TIME, flash = 0, flashOk = true, t = 0, opts;
  const BTN = i => ({ x: 24 + (i % 2) * 180, y: 320 + Math.floor(i / 2) * 78, w: 172, h: 64 });

  function next() {
    word = U.randi(0, COLS.length - 1);
    ink = Math.random() < .75 ? U.pick(COLS.map((_, i) => i).filter(i => i !== word)) : word;
    const others = U.shuffle(COLS.map((_, i) => i).filter(i => i !== ink)).slice(0, 3);
    opts = U.shuffle([ink].concat(others));
  }
  next();
  api.status('Tap the colour of the INK');

  function pick(i) {
    if (api.over) return;
    if (!started) { started = true; t0 = performance.now(); }
    if (opts[i] === ink) { streak++; score += 1 + (streak >= 5 ? 1 : 0); flashOk = true; api.sfx('click'); }
    else { streak = 0; score = Math.max(0, score - 1); flashOk = false; api.sfx('bad'); }
    api.setScore(score); flash = .25; next();
  }
  api.pointer(c, { down: (x, y) => { for (let i = 0; i < 4; i++) if (U.inR(x, y, BTN(i))) pick(i); } });
  api.on(window, 'keydown', e => { if (/^[1-4]$/.test(e.key)) pick(+e.key - 1); });
  api.loop(dt => {
    t += dt; flash = Math.max(0, flash - dt);
    if (started) { left = Math.max(0, TIME - (performance.now() - t0) / 1000); if (left <= 0 && !api.over) api.end({ win: true, title: 'Time!', msg: score + ' points', score, emoji: '🎨' }); }
  }, draw, true);

  function draw() {
    c.clear('#14122e');
    ctx.fillStyle = '#231f4a'; U.rr(ctx, 24, 90, W - 48, 190, 24); ctx.fill();
    if (flash > 0) { ctx.fillStyle = (flashOk ? 'rgba(46,229,157,' : 'rgba(255,77,109,') + flash * 1.2 + ')'; U.rr(ctx, 24, 90, W - 48, 190, 24); ctx.fill(); }
    ctx.font = '900 64px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(COLS[word][0], W / 2, 190 + 4);
    ctx.fillStyle = COLS[ink][1]; ctx.fillText(COLS[word][0], W / 2, 190);
    U.text(ctx, started ? Math.ceil(left) + 's' : TIME + 's', 24, 40, 24, left < 8 ? '#ff5c7a' : '#9fb2ff', 'left', 900);
    U.text(ctx, 'Score ' + score, W - 24, 40, 24, '#fff', 'right', 900);
    if (streak >= 3) U.text(ctx, 'Streak ' + streak + (streak >= 5 ? '  ×2' : ''), W / 2, 64, 14, '#ffe27a', 'center', 800);
    opts.forEach((o, i) => U.btn(ctx, BTN(i), COLS[o][0], '#4a4a7a', 20));
    ctx.__flat = true; opts.forEach((o, i) => { const r = BTN(i); ctx.fillStyle = COLS[o][1]; ctx.fillRect(r.x + 14, r.y + r.h - 12, r.w - 28, 5); }); ctx.__flat = false;
  }
});
