// Quick Math: answer as many sums as you can in 60 seconds. Wrong answers cost 3 seconds. Options: hard.
Hub.register('quickmath', (api, o) => {
  const W = 480, H = 560, TIME = 60;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let time = TIME, score = 0, q, choices, flash = 0, flashCol = '', streak = 0;

  function make() {
    const lvl = Math.min(4, Math.floor(score / 5)) + (o.hard ? 2 : 0);
    const ops = lvl < 1 ? ['+', '−'] : lvl < 3 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
    const op = U.pick(ops), big = 10 + lvl * 15;
    let a, b, ans;
    if (op === '+') { a = U.randi(2, big); b = U.randi(2, big); ans = a + b; }
    else if (op === '−') { a = U.randi(5, big + 10); b = U.randi(1, a); ans = a - b; }
    else if (op === '×') { a = U.randi(2, 5 + lvl * 2); b = U.randi(2, 9 + lvl); ans = a * b; }
    else { b = U.randi(2, 9 + lvl); ans = U.randi(2, 9 + lvl); a = b * ans; }
    q = a + ' ' + op + ' ' + b;
    const set = new Set([ans]);
    while (set.size < 4) { const d = ans + U.randi(-10, 10); if (d >= 0 && d !== ans) set.add(d); }
    choices = U.shuffle([...set]).map(v => ({ v, ok: v === ans }));
  }
  make();
  function answer(i) {
    if (api.over || !choices[i]) return;
    if (choices[i].ok) { score++; streak++; api.setScore(score); api.sfx(streak % 5 === 0 ? 'coin' : 'pop'); flashCol = '#2ee59d'; }
    else { time -= 3; streak = 0; api.sfx('bad'); flashCol = '#ff5c7a'; }
    flash = .25;
    make();
  }
  const rect = i => ({ x: 30 + (i % 2) * 220, y: 280 + Math.floor(i / 2) * 120, w: 200, h: 100 });
  api.pointer(c, { down: (x, y) => { for (let i = 0; i < 4; i++) { const r = rect(i); if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) answer(i); } } });
  api.onKey((k, raw) => { const d = parseInt(raw, 10); if (d >= 1 && d <= 4) answer(d - 1); });

  api.loop(dt => {
    time -= dt;
    flash = Math.max(0, flash - dt);
    if (time <= 0) { time = 0; api.end({ win: true, title: 'Time up!', emoji: '➗', score, msg: score + ' correct' }); }
  }, () => {
    c.clear('#10163a');
    if (flash > 0) { ctx.globalAlpha = flash * 2; ctx.fillStyle = flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    U.text(ctx, '⏱ ' + Math.ceil(time), 24, 34, 24, time < 10 ? '#ff5c7a' : '#fff', 'left', 800);
    U.text(ctx, '🔥 ' + streak, W - 24, 34, 20, '#ffc94d', 'right', 800);
    ctx.fillStyle = '#ffc94d'; ctx.fillRect(24, 62, (W - 48) * Math.max(0, time) / TIME, 6);
    U.text(ctx, q + ' = ?', W / 2, 170, 54, '#fff', 'center', 900);
    choices.forEach((ch, i) => {
      const r = rect(i);
      ctx.fillStyle = ['#7c5cff', '#00a2ff', '#ff8a3d', '#2ea866'][i];
      U.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
      U.text(ctx, ch.v, r.x + r.w / 2, r.y + r.h / 2, 40, '#fff', 'center', 900);
      if (!api.isTouch) U.text(ctx, i + 1, r.x + 16, r.y + 16, 12, 'rgba(255,255,255,.6)');
    });
  });
});
