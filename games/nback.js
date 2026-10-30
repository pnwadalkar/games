// N-Back: a square lights up every two seconds. Press MATCH when it is the same square as N steps ago.
Hub.register('nback', (api, o) => {
  const N = o.n || 2, W = 360, H = 560, TRIALS = 24 + N * 2, STEP = 2.2;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const seq = [];
  for (let i = 0; i < TRIALS; i++) seq.push(i >= N && Math.random() < .3 ? seq[i - N] : U.randi(0, 8));
  let idx = -1, tIn = STEP - .6, lit = -1, answered = false, score = 0, wrong = 0, feedback = 0, fbOk = true, t = 0, started = false, showMsg = '';
  const CS = 96, GX = (W - CS * 3) / 2, GY = 90;
  const BTN = { x: W / 2 - 100, y: 440, w: 200, h: 70 };
  api.status('Match the square from ' + N + ' step' + (N > 1 ? 's' : '') + ' ago');

  function press() {
    if (api.over || idx < 0 || answered) return;
    answered = true;
    const isMatch = idx >= N && seq[idx] === seq[idx - N];
    if (isMatch) { score++; fbOk = true; api.sfx('coin'); } else { wrong++; fbOk = false; api.sfx('bad'); }
    feedback = .35; api.setScore(Math.max(0, score - wrong));
  }
  api.pointer(c, { down: (x, y) => { if (!started) started = true; press(); } });
  api.onKey(k => { if (k === 'a' || k === 'down' || k === 'up') press(); });
  api.on(window, 'keydown', e => { if (e.key === 'm' || e.key === 'M') press(); });

  api.loop(dt => {
    t += dt; feedback = Math.max(0, feedback - dt);
    tIn += dt;
    if (tIn >= STEP) {
      // score a missed match from the previous step
      if (idx >= N && !answered && seq[idx] === seq[idx - N]) { wrong++; api.setScore(Math.max(0, score - wrong)); fbOk = false; feedback = .35; api.sfx('bad'); }
      tIn = 0; idx++; answered = false;
      if (idx >= TRIALS) { const s = Math.max(0, score - wrong); return api.end({ win: true, title: 'Done!', msg: score + ' hits · ' + wrong + ' mistakes', score: s, emoji: '🧩' }); }
      lit = seq[idx]; api.sfx('move');
    }
    if (tIn > STEP * .65) lit = -1;
  }, draw, true);

  function draw() {
    c.clear('#14122e');
    U.text(ctx, N + '-Back', W / 2, 34, 24, '#fff', 'center', 900);
    U.text(ctx, Math.max(0, idx + 1) + ' / ' + TRIALS, W / 2, 60, 14, '#8f99c4');
    for (let i = 0; i < 9; i++) {
      const x = GX + (i % 3) * CS, y = GY + Math.floor(i / 3) * CS, on = i === lit;
      if (on) U.box(ctx, x + 6, y + 10, CS - 12, CS - 14, '#ffb703', 10);
      else { ctx.fillStyle = '#231f4a'; U.rr(ctx, x + 6, y + 6, CS - 12, CS - 12, 12); ctx.fill(); }
    }
    U.btn(ctx, BTN, 'MATCH', feedback > 0 ? (fbOk ? '#2ea84a' : '#c2294a') : '#e0245e', 28, false);
    U.text(ctx, 'or press M', W / 2, 530, 13, '#6b74a0');
    U.text(ctx, '✔ ' + score + '   ✘ ' + wrong, W / 2, 410, 18, '#cfd6ff', 'center', 800);
  }
});
