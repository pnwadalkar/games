// Hangman: guess the word letter by letter before the drawing is complete. Category hint shown.
Hub.register('hangman', (api) => {
  const W = 480, H = 660, KY = 470;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const cat = U.pick(Object.keys(WORDS.cats));
  const word = U.pick(WORDS.cats[cat]).toUpperCase();
  const guessed = new Set();
  let wrong = 0, done = false;
  let streak = Hub.LS.get('hm:streak', 0);
  api.setScore(streak);
  api.status('Category: ' + cat);
  const MAX = 6;

  function guess(ch) {
    if (done || guessed.has(ch) || !/^[A-Z]$/.test(ch)) return;
    guessed.add(ch);
    if (word.includes(ch)) {
      api.sfx('coin');
      if ([...word].every(l => guessed.has(l))) {
        done = true; streak++; Hub.LS.set('hm:streak', streak); api.setScore(streak);
        api.end({ win: true, title: 'You saved him!', msg: word + ' · streak ' + streak, emoji: '🙌' });
      }
    } else {
      wrong++;
      api.sfx('bad');
      if (wrong >= MAX) { done = true; streak = 0; Hub.LS.set('hm:streak', 0); api.end({ title: 'The word was ' + word, msg: 'Streak reset', emoji: '💀' }); }
    }
    draw();
  }
  api.onKey((k, raw) => { if (raw && raw.length === 1) guess(raw.toUpperCase()); });
  const keys = () => {
    const out = [], L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', per = 7, kw = 58, gap = 8;
    [...L].forEach((ch, i) => {
      const r = Math.floor(i / per), n = r === 3 ? L.length - per * 3 : per;
      const x0 = (W - (n * kw + (n - 1) * gap)) / 2;
      out.push({ ch, x: x0 + (i % per) * (kw + gap), y: KY + r * 46, w: kw, h: 40 });
    });
    return out;
  };
  api.pointer(c, { down: (x, y) => { const k = keys().find(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h); if (k) guess(k.ch); } });

  c.draw = draw;
  function draw() {
    c.clear('#10163a');
    ctx.strokeStyle = '#c9cff0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const seg = (a, b, x, y) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(x, y); ctx.stroke(); };
    seg(110, 300, 290, 300); seg(150, 300, 150, 40); seg(150, 40, 300, 40); seg(300, 40, 300, 80); seg(150, 90, 200, 40);
    ctx.strokeStyle = '#ffc94d'; ctx.lineWidth = 5;
    if (wrong > 0) { ctx.beginPath(); ctx.arc(300, 110, 30, 0, 7); ctx.stroke(); }
    if (wrong > 1) seg(300, 140, 300, 215);
    if (wrong > 2) seg(300, 160, 265, 195);
    if (wrong > 3) seg(300, 160, 335, 195);
    if (wrong > 4) seg(300, 215, 272, 262);
    if (wrong > 5) { seg(300, 215, 328, 262); U.text(ctx, '✕ ✕', 300, 106, 14, '#ff5c7a'); }
    U.text(ctx, 'Lives ' + '❤'.repeat(MAX - wrong) + '♡'.repeat(wrong), W / 2, 330, 16, '#ff5c7a');
    const n = word.length, lw = Math.min(40, (W - 40) / n), x0 = (W - n * lw) / 2;
    [...word].forEach((ch, i) => {
      const x = x0 + i * lw + lw / 2, show = guessed.has(ch) || done;
      U.text(ctx, show ? ch : '', x, 395, Math.min(30, lw * .8), guessed.has(ch) ? '#fff' : '#ff5c7a', 'center', 800);
      ctx.fillStyle = '#5d6799'; ctx.fillRect(x - lw * .38, 415, lw * .76, 3);
    });
    keys().forEach(k => {
      const g = guessed.has(k.ch), ok = g && word.includes(k.ch);
      ctx.fillStyle = g ? (ok ? '#2fa866' : '#2a3159') : '#4a5490';
      U.rr(ctx, k.x, k.y, k.w, k.h, 8); ctx.fill();
      U.text(ctx, k.ch, k.x + k.w / 2, k.y + k.h / 2 + 1, 18, g && !ok ? '#59618f' : '#fff', 'center', 700);
    });
  }
  draw();
});
