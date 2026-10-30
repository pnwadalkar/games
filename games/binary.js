// Binary Puzzle: fill the grid with 0s and 1s. No three in a row, equal counts per row and column, no repeated rows or columns.
Hub.register('binary', (api, o) => {
  const N = o.n || 6, CS = Math.floor(500 / N), S = CS * N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  let sol, g, fixed, t0 = 0, started = false, done = false, t = 0, shake = null;

  // --- generate a full valid grid by backtracking row by row ---
  function rowsOK(grid, r) {
    const row = grid[r];
    for (let k = 2; k < N; k++) if (row[k] === row[k - 1] && row[k] === row[k - 2]) return false;
    for (let k = 0; k < N; k++) { // column triples & counts so far
      if (r >= 2 && grid[r][k] === grid[r - 1][k] && grid[r][k] === grid[r - 2][k]) return false;
      let ones = 0; for (let i = 0; i <= r; i++) ones += grid[i][k];
      if (ones > N / 2 || (r + 1 - ones) > N / 2) return false;
    }
    for (let i = 0; i < r; i++) if (grid[i].every((v, k) => v === row[k])) return false;
    return row.reduce((a, b) => a + b, 0) === N / 2;
  }
  function build() {
    const grid = [];
    const place = r => {
      if (r === N) return true;
      const opts = [];
      for (let m = 0; m < 1 << N; m++) {
        let ones = 0; for (let k = 0; k < N; k++) ones += (m >> k) & 1;
        if (ones === N / 2) opts.push(m);
      }
      U.shuffle(opts);
      for (const m of opts) {
        grid[r] = Array.from({ length: N }, (_, k) => (m >> k) & 1);
        if (rowsOK(grid, r) && place(r + 1)) return true;
      }
      grid[r] = null; return false;
    };
    place(0);
    return grid;
  }
  sol = build();
  const keep = o.keep || .45;
  fixed = sol.map(row => row.map(() => Math.random() < keep));
  g = sol.map((row, r) => row.map((v, k) => (fixed[r][k] ? v : -1)));
  api.status('Tap a cell to cycle blank → 0 → 1');

  // violations: cells that break a rule right now
  function bad() {
    const b = U.grid(N, N, false);
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = g[r][k]; if (v < 0) continue;
      if (k >= 2 && g[r][k - 1] === v && g[r][k - 2] === v) b[r][k] = b[r][k - 1] = b[r][k - 2] = true;
      if (r >= 2 && g[r - 1][k] === v && g[r - 2][k] === v) b[r][k] = b[r - 1][k] = b[r - 2][k] = true;
    }
    for (let r = 0; r < N; r++) {
      const ones = g[r].filter(v => v === 1).length, zeros = g[r].filter(v => v === 0).length;
      if (ones > N / 2 || zeros > N / 2) g[r].forEach((v, k) => { if (v === (ones > N / 2 ? 1 : 0)) b[r][k] = true; });
      const co = g.filter(row => row[r] === 1).length, cz = g.filter(row => row[r] === 0).length;
      if (co > N / 2 || cz > N / 2) g.forEach((row, i) => { if (row[r] === (co > N / 2 ? 1 : 0)) b[i][r] = true; });
    }
    return b;
  }
  function solved() {
    if (g.some(row => row.some(v => v < 0))) return false;
    if (bad().some(row => row.some(Boolean))) return false;
    const rows = g.map(r => r.join('')), cols = g[0].map((_, k) => g.map(r => r[k]).join(''));
    return new Set(rows).size === N && new Set(cols).size === N && rows.every(r => r.split('1').length - 1 === N / 2) && cols.every(r => r.split('1').length - 1 === N / 2);
  }

  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      const k = Math.floor(x / CS), r = Math.floor(y / CS);
      if (k < 0 || r < 0 || k >= N || r >= N) return;
      if (fixed[r][k]) { shake = { r, k, t: .25 }; api.sfx('bad'); return; }
      if (!started) { started = true; t0 = performance.now(); }
      g[r][k] = g[r][k] < 0 ? 0 : g[r][k] === 0 ? 1 : -1; api.sfx('click');
      if (solved()) { done = true; api.end({ win: true, title: 'Solved!', score: Math.round((performance.now() - t0) / 100) / 10, emoji: '🧮' }); }
    }
  });
  api.loop(dt => { t += dt; if (shake) { shake.t -= dt; if (shake.t <= 0) shake = null; } if (started && !done) api.setScore(Math.round((performance.now() - t0) / 100) / 10); }, draw, true);

  function draw() {
    c.clear('#10163a');
    const b = bad();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = k * CS + 3, y = r * CS + 3, v = g[r][k], w = CS - 6;
      const off = shake && shake.r === r && shake.k === k ? Math.sin(shake.t * 80) * 3 : 0;
      const col = fixed[r][k] ? '#3a4690' : '#26306b';
      if (v < 0) { ctx.fillStyle = '#1b2250'; U.rr(ctx, x, y, w, w, 10); ctx.fill(); }
      else U.box(ctx, x + off, y + 3, w - 4, w - 6, b[r][k] ? '#ff4d6d' : v ? '#ffb703' : '#4cc9f0', 6);
      if (v >= 0) U.text(ctx, v, x + (w - 4) / 2 + off + 2, y + w / 2 + 2, CS * .46, fixed[r][k] ? '#fff' : '#0b1020', 'center', 900);
      if (v >= 0 && fixed[r][k]) { ctx.fillStyle = 'rgba(255,255,255,.7)'; U.circle(ctx, x + w - 8, y + 10, 3, '#fff'); }
    }
  }
});
