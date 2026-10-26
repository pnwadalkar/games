// Number Memory: memorise the number, then type it back. One more digit every round.
Hub.register('numbermemory', (api) => {
  const W = 420, H = 600;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let digits = 3, num = '', entry = '', phase = 'show', showT = 0, showMax = 0, lives = 2, msg = '';

  function round() {
    num = String(U.randi(1, 9)) + Array.from({ length: digits - 1 }, () => U.randi(0, 9)).join('');
    entry = '';
    phase = 'show';
    showMax = showT = 1.2 + digits * .6;
    msg = '';
  }
  round();
  function submit() {
    if (phase !== 'input' || !entry) return;
    if (entry === num) { api.setScore(digits); digits++; api.sfx('coin'); msg = 'Correct!'; phase = 'pause'; api.after(700, round); }
    else {
      lives--;
      api.sfx('bad');
      msg = 'It was ' + num;
      phase = 'pause';
      if (lives <= 0) return api.end({ msg: 'You remembered ' + (digits - 1) + ' digits', score: digits - 1, emoji: '🔢' });
      api.after(1500, round);
    }
  }
  function key(k) {
    if (phase !== 'input') return;
    if (k === '⌫') entry = entry.slice(0, -1);
    else if (k === '✓') submit();
    else if (entry.length < 30) { entry += k; api.sfx('click'); }
  }
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
  const kr = i => ({ x: 30 + (i % 3) * 125, y: 300 + Math.floor(i / 3) * 72, w: 110, h: 62 });
  api.pointer(c, { down: (x, y) => { KEYS.forEach((k, i) => { const r = kr(i); if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) key(k); }); } });
  api.onKey((k, raw) => {
    if (raw >= '0' && raw <= '9') key(raw);
    else if (raw === 'Backspace') key('⌫');
    else if (raw === 'Enter') key('✓');
  });

  api.loop(dt => {
    if (phase === 'show') { showT -= dt; if (showT <= 0) phase = 'input'; }
  }, () => {
    c.clear('#10163a');
    U.text(ctx, digits + ' digits', 20, 28, 16, '#8f99c4', 'left');
    U.text(ctx, '❤'.repeat(lives), W - 20, 28, 16, '#ff5c7a', 'right');
    const fs = Math.min(56, (W - 40) / Math.max(entry.length, num.length, 1) * 1.6);
    if (phase === 'show') {
      U.text(ctx, num, W / 2, 150, fs, '#fff', 'center', 900);
      ctx.fillStyle = '#7c5cff'; ctx.fillRect(40, 220, (W - 80) * (showT / showMax), 6);
    } else {
      U.text(ctx, phase === 'input' ? 'What was the number?' : msg, W / 2, 110, 18, phase === 'pause' && msg !== 'Correct!' ? '#ff5c7a' : '#8f99c4');
      ctx.fillStyle = '#1b2250'; U.rr(ctx, 30, 140, W - 60, 90, 16); ctx.fill();
      U.text(ctx, entry || (phase === 'input' ? '_' : ''), W / 2, 186, fs, '#fff', 'center', 800);
    }
    KEYS.forEach((k, i) => {
      const r = kr(i);
      ctx.fillStyle = phase !== 'input' ? '#171d45' : k === '✓' ? '#7c5cff' : '#26306b';
      U.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      U.text(ctx, k, r.x + r.w / 2, r.y + r.h / 2 + 1, 26, phase === 'input' ? '#fff' : '#3b4570', 'center', 800);
    });
  }, true);
});
