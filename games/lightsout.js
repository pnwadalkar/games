// Lights Out: tapping a light toggles it and its neighbours. Turn all lights off. Options: n.
Hub.register('lightsout', (api, o) => {
  const N = o.n || 5, GAP = 10, S = 480, CELL = (S - GAP * (N + 1)) / N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const g = U.grid(N, N, false);
  let moves = 0, done = false;
  const flip = (r, k) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => {
    const y = r + a, x = k + b;
    if (y >= 0 && y < N && x >= 0 && x < N) g[y][x] = !g[y][x];
  });
  // scramble from the solved state, so a solution always exists
  do { for (let i = 0; i < N * N; i++) if (Math.random() < .4) flip(U.randi(0, N - 1), U.randi(0, N - 1)); } while (g.every(r => r.every(v => !v)));
  const lit = () => g.reduce((s, r) => s + r.filter(Boolean).length, 0);
  api.status(lit() + ' lights on');

  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      const k = Math.floor(x / (S / N)), r = Math.floor(y / (S / N));
      if (k < 0 || r < 0 || k >= N || r >= N) return;
      flip(r, k);
      moves++;
      api.setScore(moves);
      api.sfx('flip');
      api.status(lit() + ' lights on');
      draw();
      if (!lit()) { done = true; api.end({ win: true, title: 'Lights out!', score: moves, msg: moves + ' moves', emoji: '💡' }); }
    }
  });
  c.draw = draw;
  function draw() {
    c.clear('#0b0f2a');
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = GAP + k * (CELL + GAP), y = GAP + r * (CELL + GAP);
      if (g[r][k]) {
        ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffd84d';
      } else ctx.fillStyle = '#1e2656';
      U.rr(ctx, x, y, CELL, CELL, 14); ctx.fill();
      ctx.shadowBlur = 0;
      if (g[r][k]) { ctx.fillStyle = 'rgba(255,255,255,.5)'; U.rr(ctx, x + 8, y + 8, CELL - 16, CELL * .25, 8); ctx.fill(); }
    }
  }
  draw();
});
