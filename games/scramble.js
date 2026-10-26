// Word Scramble: unscramble as many words as you can in 90 seconds. Tap letters or type.
Hub.register('scramble', (api) => {
  const W = 480, H = 520, TIME = 90;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let time = TIME, score = 0, solved = 0, word, cat, tiles, picked, flash = 0, flashCol = '#2ee59d';
  const used = new Set();

  function next() {
    let w;
    do { cat = U.pick(Object.keys(WORDS.cats)); w = U.pick(WORDS.cats[cat]); } while ((used.has(w) || w.length > 9) && used.size < 100);
    used.add(w);
    word = w.toUpperCase();
    let s;
    do { s = U.shuffle([...word]); } while (s.join('') === word && new Set(word).size > 1);
    tiles = s.map((ch, i) => ({ ch, i, used: false }));
    picked = [];
  }
  next();
  function pick(t) {
    if (t.used || api.over) return;
    t.used = true; picked.push(t);
    api.sfx('click');
    if (picked.length === word.length) {
      if (picked.map(p => p.ch).join('') === word) {
        score += word.length * 10; solved++; api.setScore(score); api.sfx('coin');
        flash = .4; flashCol = '#2ee59d';
        next();
      } else {
        flash = .4; flashCol = '#ff5c7a'; api.sfx('bad');
        api.after(350, () => { picked.forEach(p => { p.used = false; }); picked = []; });
      }
    }
  }
  function unpick() { const t = picked.pop(); if (t) { t.used = false; api.sfx('move'); } }
  function skip() { score = Math.max(0, score - 5); api.setScore(score); api.toast('It was ' + word); next(); }
  api.onKey((k, raw) => {
    if (!raw) return;
    if (raw === 'Backspace') return unpick();
    if (raw === 'Enter' || raw === ' ') return;
    const ch = raw.toUpperCase();
    const t = tiles.find(x => !x.used && x.ch === ch);
    if (t) pick(t);
  });
  const layout = () => {
    const n = word.length, ts = Math.min(58, (W - 30) / n - 6), x0 = (W - (n * (ts + 6) - 6)) / 2;
    return { ts, x0 };
  };
  const SKIP = { x: 40, y: 430, w: 180, h: 60 }, CLR = { x: 260, y: 430, w: 180, h: 60 };
  const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  api.pointer(c, {
    down: (x, y) => {
      if (inR(x, y, SKIP)) return skip();
      if (inR(x, y, CLR)) { while (picked.length) unpick(); return; }
      const { ts, x0 } = layout();
      const i = Math.floor((x - x0) / (ts + 6));
      if (y > 300 && y < 300 + ts && tiles[i]) pick(tiles[i]);
      if (y > 180 && y < 180 + ts) unpick();
    }
  });

  api.loop(dt => {
    time -= dt;
    flash = Math.max(0, flash - dt);
    if (time <= 0) { time = 0; api.end({ win: true, title: 'Time up!', msg: solved + ' word' + (solved === 1 ? '' : 's') + ' solved', emoji: '🔤', score }); }
  }, () => {
    c.clear('#10163a');
    if (flash > 0) { ctx.fillStyle = flashCol; ctx.globalAlpha = flash; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    U.text(ctx, '⏱ ' + Math.ceil(time), 20, 30, 22, time < 10 ? '#ff5c7a' : '#fff', 'left', 800);
    U.text(ctx, solved + ' solved', W - 20, 30, 18, '#8f99c4', 'right');
    ctx.fillStyle = '#ffc94d'; ctx.fillRect(20, 52, (W - 40) * time / TIME, 6);
    U.text(ctx, 'Category: ' + cat, W / 2, 110, 20, '#00d4ff', 'center', 700);
    U.text(ctx, word.length + ' letters', W / 2, 140, 14, '#8f99c4');
    const { ts, x0 } = layout();
    for (let i = 0; i < word.length; i++) {
      const x = x0 + i * (ts + 6);
      ctx.fillStyle = '#1f2852'; U.rr(ctx, x, 180, ts, ts, 10); ctx.fill();
      if (picked[i]) U.text(ctx, picked[i].ch, x + ts / 2, 180 + ts / 2 + 2, ts * .5, '#fff', 'center', 800);
    }
    tiles.forEach((t, i) => {
      const x = x0 + i * (ts + 6);
      ctx.fillStyle = t.used ? '#1a2048' : '#7c5cff';
      U.rr(ctx, x, 300, ts, ts, 10); ctx.fill();
      if (!t.used) U.text(ctx, t.ch, x + ts / 2, 300 + ts / 2 + 2, ts * .5, '#fff', 'center', 800);
    });
    [[SKIP, 'Skip (−5)'], [CLR, 'Clear']].forEach(([r, l]) => { ctx.fillStyle = '#26306b'; U.rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill(); U.text(ctx, l, r.x + r.w / 2, r.y + r.h / 2, 18, '#fff'); });
  });
});
