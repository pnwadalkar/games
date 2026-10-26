// Word Guess (Wordle style): find the hidden 5-letter word in 6 tries.
Hub.register('wordguess', (api) => {
  const W = 460, TS = 60, TG = 8, GX = (W - (5 * TS + 4 * TG)) / 2, GY = 12, KY = GY + 6 * (TS + TG) + 14, H = KY + 3 * 62 + 10;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const answer = U.pick(WORDS.five).toUpperCase();
  const rows = [], marks = [];
  let cur = '', done = false, shake = 0, flipRow = -1, flipT = 0;
  const keyState = {};
  let streak = Hub.LS.get('wg:streak', 0);
  api.setScore(streak);
  const KB = ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'];
  const COL = { g: '#2fa866', y: '#c9a227', x: '#3a4064' };

  function evaluate(g) {
    const res = Array(5).fill('x'), pool = {};
    for (let i = 0; i < 5; i++) { if (g[i] === answer[i]) res[i] = 'g'; else pool[answer[i]] = (pool[answer[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (res[i] !== 'g' && pool[g[i]]) { res[i] = 'y'; pool[g[i]]--; }
    return res;
  }
  function submit() {
    if (cur.length < 5) { shake = .4; api.sfx('bad'); api.toast('Not enough letters'); return; }
    const m = evaluate(cur);
    rows.push(cur); marks.push(m);
    flipRow = rows.length - 1; flipT = 0;
    const rank = { x: 1, y: 2, g: 3 }, back = { 1: 'x', 2: 'y', 3: 'g' };
    [...cur].forEach((ch, i) => { keyState[ch] = back[Math.max(rank[keyState[ch]] || 0, rank[m[i]])]; });
    const guess = cur;
    cur = '';
    api.sfx('flip');
    if (guess === answer) {
      done = true;
      streak++;
      Hub.LS.set('wg:streak', streak);
      api.setScore(streak);
      api.end({ win: true, title: ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][rows.length - 1], msg: 'Solved in ' + rows.length + '/6 · streak ' + streak, emoji: '🟩', delay: 1400 });
    } else if (rows.length === 6) {
      done = true;
      streak = 0;
      Hub.LS.set('wg:streak', 0);
      api.end({ title: 'The word was ' + answer, msg: 'Streak reset', emoji: '📕', delay: 1400 });
    }
  }
  function key(k) {
    if (done) return;
    if (k === '⏎' || k === 'ENTER') submit();
    else if (k === '⌫' || k === 'BACKSPACE') cur = cur.slice(0, -1);
    else if (/^[A-Z]$/.test(k) && cur.length < 5) { cur += k; api.sfx('click'); }
  }
  api.onKey((k, raw) => { if (raw) key(raw.toUpperCase()); });
  const keyRects = () => {
    const out = [];
    KB.forEach((row, r) => {
      const n = row.length, kw = 40, gap = 5;
      const widths = [...row].map(ch => (ch === '⏎' || ch === '⌫') ? 62 : kw);
      const tot = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
      let x = (W - tot) / 2;
      [...row].forEach((ch, i) => { out.push({ ch, x, y: KY + r * 62, w: widths[i], h: 54 }); x += widths[i] + gap; });
    });
    return out;
  };
  api.pointer(c, { down: (x, y) => { const k = keyRects().find(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h); if (k) key(k.ch); } });

  api.loop(dt => { shake = Math.max(0, shake - dt); flipT += dt; }, () => {
    c.clear('#10163a');
    for (let r = 0; r < 6; r++) {
      const word = r < rows.length ? rows[r] : r === rows.length ? cur : '';
      const ox = r === rows.length && shake > 0 ? Math.sin(shake * 60) * 8 : 0;
      for (let i = 0; i < 5; i++) {
        const x = GX + i * (TS + TG) + ox, y = GY + r * (TS + TG);
        let revealed = r < rows.length, sy = 1;
        if (r === flipRow) {
          const t = U.clamp((flipT - i * .25) / .3, 0, 1);
          sy = Math.abs(Math.cos(t * Math.PI));
          revealed = t > .5;
        }
        ctx.save();
        ctx.translate(x + TS / 2, y + TS / 2);
        ctx.scale(1, Math.max(.05, sy));
        if (revealed) { ctx.fillStyle = COL[marks[r][i]]; U.rr(ctx, -TS / 2, -TS / 2, TS, TS, 6); ctx.fill(); }
        else { ctx.strokeStyle = word[i] ? '#6b75a8' : '#2e3769'; ctx.lineWidth = 2.5; U.rr(ctx, -TS / 2 + 1, -TS / 2 + 1, TS - 2, TS - 2, 6); ctx.stroke(); }
        if (word[i]) U.text(ctx, word[i], 0, 2, 30, '#fff', 'center', 800);
        ctx.restore();
      }
    }
    keyRects().forEach(k => {
      const st = keyState[k.ch];
      ctx.fillStyle = st ? COL[st] : '#4a5490';
      U.rr(ctx, k.x, k.y, k.w, k.h, 7); ctx.fill();
      U.text(ctx, k.ch, k.x + k.w / 2, k.y + k.h / 2 + 1, k.ch.length > 1 || k.ch === '⏎' || k.ch === '⌫' ? 20 : 18, '#fff', 'center', 700);
    });
  }, true);
});
