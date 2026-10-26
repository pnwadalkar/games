// Color Match (Stroop test): does the word's MEANING match its INK colour? 45 seconds.
Hub.register('colormatch', (api) => {
  const W = 480, H = 560, TIME = 45;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const C = [['RED', '#ff4d6d'], ['BLUE', '#3d8bff'], ['GREEN', '#2ee59d'], ['YELLOW', '#ffd84d'], ['PURPLE', '#b06cff'], ['ORANGE', '#ff8a3d']];
  let time = TIME, score = 0, word, ink, match, flash = 0, flashCol = '', streak = 0;
  function next() {
    word = U.randi(0, C.length - 1);
    match = Math.random() < .5;
    ink = match ? word : (word + U.randi(1, C.length - 1)) % C.length;
  }
  next();
  function answer(yes) {
    if (api.over) return;
    if (yes === match) { score++; streak++; api.setScore(score); api.sfx('pop'); flashCol = '#2ee59d'; }
    else { score = Math.max(0, score - 1); streak = 0; api.setScore(score); api.sfx('bad'); flashCol = '#ff5c7a'; }
    flash = .2;
    next();
  }
  const NO = { x: 30, y: 400, w: 200, h: 110 }, YES = { x: 250, y: 400, w: 200, h: 110 };
  const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  api.pointer(c, { down: (x, y) => { if (inR(x, y, NO)) answer(false); else if (inR(x, y, YES)) answer(true); } });
  api.onKey(k => { if (k === 'left') answer(false); if (k === 'right') answer(true); });

  api.loop(dt => {
    time -= dt; flash = Math.max(0, flash - dt);
    if (time <= 0) { time = 0; api.end({ win: true, title: 'Time up!', emoji: '🎨', score }); }
  }, () => {
    c.clear('#10163a');
    if (flash > 0) { ctx.globalAlpha = flash * 2; ctx.fillStyle = flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    U.text(ctx, '⏱ ' + Math.ceil(time), 24, 34, 22, time < 10 ? '#ff5c7a' : '#fff', 'left', 800);
    U.text(ctx, '🔥 ' + streak, W - 24, 34, 20, '#ffc94d', 'right', 800);
    U.text(ctx, 'Does the meaning match the ink colour?', W / 2, 110, 17, '#8f99c4', 'center', 600);
    ctx.fillStyle = '#f5f6ff'; U.rr(ctx, 60, 150, W - 120, 170, 22); ctx.fill();
    U.text(ctx, C[word][0], W / 2, 238, 64, C[ink][1], 'center', 900);
    [[NO, '✕ No', '#ff5c7a'], [YES, '✓ Yes', '#2ee59d']].forEach(([r, l, col]) => {
      ctx.fillStyle = col; U.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
      U.text(ctx, l, r.x + r.w / 2, r.y + r.h / 2, 30, '#10163a', 'center', 900);
    });
    if (!api.isTouch) U.text(ctx, '← No      Yes →', W / 2, 535, 13, '#5d6799');
  });
});
