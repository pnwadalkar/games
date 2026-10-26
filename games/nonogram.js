// Nonogram (Picross): fill cells so each row/column matches its number clues. Options: n.
Hub.register('nonogram', (api, o) => {
  const N = o.n || 5, CLUE = N <= 5 ? 90 : 120, S = 540, CS = Math.floor((S - CLUE) / N), W = CLUE + CS * N + 4, H = W + 60;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let sol;
  do { sol = U.grid(N, N, () => Math.random() < .58); } while (sol.some(r => !r.some(Boolean)) || sol[0].some((_, k) => !sol.some(r => r[k])));
  const runs = line => { const out = []; let n = 0; line.forEach(v => { if (v) n++; else if (n) { out.push(n); n = 0; } }); if (n) out.push(n); return out.length ? out : [0]; };
  const rowClues = sol.map(runs), colClues = sol[0].map((_, k) => runs(sol.map(r => r[k])));
  const g = U.grid(N, N, 0); // 0 empty, 1 filled, 2 crossed
  let mode = 1, done = false, secs = 0, paint = null;
  api.every(1000, () => { if (!done) { secs++; api.setScore(secs); } });

  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const rowOk = r => same(runs(g[r].map(v => v === 1)), rowClues[r]);
  const colOk = k => same(runs(g.map(r => r[k] === 1)), colClues[k]);
  function check() {
    for (let i = 0; i < N; i++) if (!rowOk(i) || !colOk(i)) return;
    done = true;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (g[r][k] === 2) g[r][k] = 0;
    api.end({ win: true, title: 'Solved!', score: secs, emoji: '🖼️' });
  }
  const cellAt = (x, y) => { const k = Math.floor((x - CLUE) / CS), r = Math.floor((y - CLUE) / CS); return k >= 0 && r >= 0 && k < N && r < N ? [r, k] : null; };
  function apply(r, k) {
    if (g[r][k] === paint.to) return;
    g[r][k] = paint.to;
    api.sfx('click');
    draw();
  }
  api.pointer(c, {
    down: (x, y, e) => {
      if (done) return;
      if (y > W) { mode = mode === 1 ? 2 : 1; api.sfx('flip'); draw(); return; }
      const cell = cellAt(x, y);
      if (!cell) return;
      const m = e.button === 2 ? (mode === 1 ? 2 : 1) : mode;
      const [r, k] = cell;
      paint = { to: g[r][k] === m ? 0 : m };
      apply(r, k);
    },
    move: (x, y, e, isDown) => { if (paint && isDown) { const cell = cellAt(x, y); if (cell) apply(cell[0], cell[1]); } },
    up: () => { if (paint) { paint = null; check(); } }
  });
  api.onKey((k, raw) => { if (raw === 'x' || raw === 'X' || raw === ' ') { mode = mode === 1 ? 2 : 1; draw(); } });

  c.draw = draw;
  function draw() {
    c.clear('#10163a');
    const fs = N <= 5 ? 22 : 15;
    for (let i = 0; i < N; i++) {
      const rc = rowClues[i], cc = colClues[i], rok = rowOk(i), cok = colOk(i);
      ctx.fillStyle = i % 2 ? '#161e4b' : '#1a2356';
      ctx.fillRect(0, CLUE + i * CS, CLUE, CS);
      ctx.fillRect(CLUE + i * CS, 0, CS, CLUE);
      rc.forEach((n, j) => U.text(ctx, n, CLUE - 12 - (rc.length - 1 - j) * fs * 1.1, CLUE + i * CS + CS / 2, fs, rok ? '#5d6799' : '#fff', 'center', 800));
      cc.forEach((n, j) => U.text(ctx, n, CLUE + i * CS + CS / 2, CLUE - 12 - (cc.length - 1 - j) * fs * 1.2, fs, cok ? '#5d6799' : '#fff', 'center', 800));
    }
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = CLUE + k * CS, y = CLUE + r * CS;
      ctx.fillStyle = g[r][k] === 1 ? (done ? '#2ee59d' : '#7c5cff') : '#eef0ff';
      ctx.fillRect(x, y, CS, CS);
      if (g[r][k] === 2) U.text(ctx, '✕', x + CS / 2, y + CS / 2 + 1, CS * .5, '#ff5c7a', 'center', 900);
    }
    ctx.strokeStyle = '#9aa3d6'; ctx.lineWidth = 1;
    for (let i = 0; i <= N; i++) {
      ctx.lineWidth = i % 5 === 0 ? 3 : 1;
      ctx.strokeStyle = i % 5 === 0 ? '#1b2150' : '#9aa3d6';
      ctx.beginPath(); ctx.moveTo(CLUE + i * CS, CLUE); ctx.lineTo(CLUE + i * CS, CLUE + N * CS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CLUE, CLUE + i * CS); ctx.lineTo(CLUE + N * CS, CLUE + i * CS); ctx.stroke();
    }
    ctx.fillStyle = mode === 1 ? '#7c5cff' : '#ff5c7a';
    U.rr(ctx, W / 2 - 90, W + 10, 180, 44, 12); ctx.fill();
    U.text(ctx, mode === 1 ? '■  Fill mode' : '✕  Cross mode', W / 2, W + 32, 16, '#fff');
  }
  draw();
});
