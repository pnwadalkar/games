// Code Breaker (Mastermind): crack the hidden 4-colour code in 10 guesses. Options: dup (allow repeats).
Hub.register('mastermind', (api, o) => {
  const P = 4, K = 6, ROWS = 10, W = 420, RH = 50, TOP = 60, H = TOP + ROWS * RH + 150;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const COL = ['#ff5c7a', '#ffc94d', '#2ee59d', '#00d4ff', '#b06cff', '#ff8a3d'];
  const code = o.dup ? Array.from({ length: P }, () => U.randi(0, K - 1)) : U.shuffle([0, 1, 2, 3, 4, 5]).slice(0, P);
  const guesses = [], fb = [];
  let cur = Array(P).fill(-1), done = false;
  api.status(o.dup ? 'Colours may repeat' : 'Every colour is different');

  function score(g) {
    let black = 0, white = 0;
    const a = {}, b = {};
    for (let i = 0; i < P; i++) { if (g[i] === code[i]) black++; else { a[g[i]] = (a[g[i]] || 0) + 1; b[code[i]] = (b[code[i]] || 0) + 1; } }
    for (const k in a) white += Math.min(a[k], b[k] || 0);
    return [black, white];
  }
  function check() {
    if (done || cur.includes(-1)) { api.sfx('bad'); return; }
    const f = score(cur);
    guesses.push(cur.slice()); fb.push(f);
    cur = Array(P).fill(-1);
    api.setScore(guesses.length);
    api.sfx('flip');
    if (f[0] === P) { done = true; api.end({ win: true, title: 'Code cracked!', score: guesses.length, msg: 'In ' + guesses.length + ' guess' + (guesses.length === 1 ? '' : 'es'), emoji: '🔓' }); }
    else if (guesses.length >= ROWS) { done = true; api.end({ title: 'Out of guesses', msg: 'The code is shown at the top', emoji: '🔒' }); }
    draw();
  }
  function add(k) { const i = cur.indexOf(-1); if (i >= 0 && !done) { cur[i] = k; api.sfx('click'); draw(); } }
  const rowY = r => TOP + (ROWS - 1 - r) * RH;
  const PY = TOP + ROWS * RH + 22;
  const CHECK = { x: W - 120, y: PY + 64, w: 100, h: 50 }, CLEAR = { x: 20, y: PY + 64, w: 100, h: 50 };
  const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      if (inR(x, y, CHECK)) return check();
      if (inR(x, y, CLEAR)) { cur = Array(P).fill(-1); draw(); return; }
      if (y > PY && y < PY + 50) { const k = Math.floor((x - 20) / ((W - 40) / K)); if (k >= 0 && k < K) add(k); return; }
      const r = guesses.length, ry = rowY(r);
      if (y > ry && y < ry + RH) { const i = Math.floor((x - 60) / 56); if (i >= 0 && i < P) { cur[i] = -1; draw(); } }
    }
  });
  api.onKey((k, raw) => {
    const d = parseInt(raw, 10);
    if (d >= 1 && d <= K) add(d - 1);
    else if (raw === 'Backspace') { const i = cur.findIndex(v => v === -1); const j = i < 0 ? P - 1 : i - 1; if (j >= 0) { cur[j] = -1; draw(); } }
    else if (raw === 'Enter') check();
  });

  c.draw = draw;
  function draw() {
    c.clear('#10163a');
    ctx.fillStyle = '#1b2250'; U.rr(ctx, 50, 8, 240, 44, 12); ctx.fill();
    code.forEach((k, i) => { if (done) U.circle(ctx, 84 + i * 56, 30, 15, COL[k]); else U.text(ctx, '?', 84 + i * 56, 31, 22, '#5d6799', 'center', 900); });
    for (let r = 0; r < ROWS; r++) {
      const y = rowY(r), g = r < guesses.length ? guesses[r] : r === guesses.length ? cur : null;
      ctx.fillStyle = r === guesses.length && !done ? '#222c66' : (r % 2 ? '#151c47' : '#18204f');
      ctx.fillRect(0, y, W, RH);
      U.text(ctx, r + 1, 24, y + RH / 2, 13, '#5d6799');
      for (let i = 0; i < P; i++) {
        const v = g ? g[i] : -1;
        if (v >= 0) U.circle(ctx, 84 + i * 56, y + RH / 2, 16, COL[v]);
        else U.circle(ctx, 84 + i * 56, y + RH / 2, 7, '#2e3769');
      }
      if (r < fb.length) {
        const pins = Array(fb[r][0]).fill('#fff').concat(Array(fb[r][1]).fill('#8f99c4'));
        for (let i = 0; i < P; i++) U.circle(ctx, 330 + (i % 2) * 18, y + 16 + Math.floor(i / 2) * 18, 6, pins[i] || '#232c5e');
      }
    }
    const bw = (W - 40) / K;
    COL.forEach((col, k) => { U.circle(ctx, 20 + k * bw + bw / 2, PY + 25, 22, col); if (!api.isTouch) U.text(ctx, k + 1, 20 + k * bw + bw / 2, PY + 26, 13, 'rgba(0,0,0,.5)'); });
    [[CLEAR, 'Clear', '#26306b'], [CHECK, 'Check', '#7c5cff']].forEach(([r, l, col]) => { ctx.fillStyle = col; U.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill(); U.text(ctx, l, r.x + r.w / 2, r.y + r.h / 2, 17, '#fff'); });
    U.text(ctx, '● right place  ○ wrong place', W / 2, PY + 89, 12, '#8f99c4');
  }
  draw();
});
