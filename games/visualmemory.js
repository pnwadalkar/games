// Pattern Memory: tiles light up briefly — tap them all back. Grid and pattern grow each level.
Hub.register('visualmemory', (api) => {
  const S = 500;
  const c = api.canvas(S, S + 50);
  const ctx = c.ctx;
  let level = 1, n, tiles, target, picked, phase, lives = 3, misses = 0, t = 0;

  function round() {
    n = Math.min(7, 3 + Math.floor((level - 1) / 3));
    const count = Math.min(n * n - 2, level + 2);
    target = new Set(U.shuffle([...Array(n * n).keys()]).slice(0, count));
    picked = new Set();
    misses = 0;
    phase = 'show'; t = 1.3;
  }
  round();
  api.pointer(c, {
    down: (x, y) => {
      if (phase !== 'input' || y > S) return;
      const cs = S / n, i = Math.floor(y / cs) * n + Math.floor(x / cs);
      if (picked.has(i)) return;
      picked.add(i);
      if (target.has(i)) {
        api.sfx('click');
        if ([...target].every(v => picked.has(v))) { api.setScore(level); level++; phase = 'pause'; api.sfx('coin'); api.after(600, round); }
      } else {
        misses++;
        api.sfx('bad');
        if (misses >= 3) {
          lives--;
          phase = 'reveal';
          if (lives <= 0) return api.end({ msg: 'Reached level ' + level, score: level - 1, emoji: '🧩' });
          api.after(1200, round);
        }
      }
    }
  });
  api.loop(dt => { if (phase === 'show') { t -= dt; if (t <= 0) phase = 'input'; } }, () => {
    c.clear('#10163a');
    const cs = S / n, g = 6;
    for (let i = 0; i < n * n; i++) {
      const x = (i % n) * cs + g / 2, y = Math.floor(i / n) * cs + g / 2;
      let col = '#26306b';
      if ((phase === 'show' || phase === 'reveal') && target.has(i)) col = '#f5f6ff';
      if (picked.has(i)) col = target.has(i) ? '#f5f6ff' : '#4a1d33';
      if (phase === 'reveal' && target.has(i) && !picked.has(i)) col = '#ffc94d';
      ctx.fillStyle = col;
      U.rr(ctx, x, y, cs - g, cs - g, 10); ctx.fill();
    }
    U.text(ctx, 'Level ' + level, 16, S + 26, 18, '#fff', 'left', 800);
    U.text(ctx, '❤'.repeat(lives), S - 16, S + 26, 18, '#ff5c7a', 'right');
    U.text(ctx, '✕'.repeat(misses), S / 2, S + 26, 18, '#ff5c7a');
  }, true);
});
