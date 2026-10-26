// Flood It: flood the board from the top-left corner to a single colour within the move limit.
// Options: n, colors, max.
Hub.register('flood', (api, o) => {
  const N = o.n || 14, K = o.colors || 6, MAX = o.max || 25, BS = 480, CS = BS / N, H = BS + 90;
  const c = api.canvas(BS, H);
  const ctx = c.ctx;
  const PAL = ['#ff5c7a', '#ffc94d', '#2ee59d', '#00d4ff', '#b06cff', '#ff8a3d', '#ff5cc8', '#b8f35a'].slice(0, K);
  const g = U.grid(N, N, () => U.randi(0, K - 1));
  let moves = 0, done = false;
  api.status('Moves left: ' + MAX);

  function region() {
    const col = g[0][0], seen = new Set(['0,0']), q = [[0, 0]];
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => {
        const nx = x + a, ny = y + b, key = nx + ',' + ny;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && !seen.has(key) && g[ny][nx] === col) { seen.add(key); q.push([nx, ny]); }
      });
    }
    return q;
  }
  function pick(col) {
    if (done || col === g[0][0]) return;
    region().forEach(([x, y]) => { g[y][x] = col; });
    moves++;
    api.setScore(moves);
    api.sfx('pop');
    api.status('Moves left: ' + (MAX - moves));
    const all = region().length === N * N;
    if (all) { done = true; api.end({ win: true, title: 'Flooded!', score: moves, msg: 'In ' + moves + ' of ' + MAX + ' moves', emoji: '🌊' }); }
    else if (moves >= MAX) { done = true; api.end({ msg: 'Out of moves — ' + Math.round(region().length / (N * N) * 100) + '% flooded', emoji: '💧' }); }
    draw();
  }
  const bw = BS / K;
  api.pointer(c, {
    down: (x, y) => {
      if (y > BS + 14) pick(Math.floor(x / bw));
      else if (y < BS) { const k = Math.floor(x / CS), r = Math.floor(y / CS); if (g[r] && g[r][k] != null) pick(g[r][k]); }
    }
  });
  api.onKey((k, raw) => { const d = parseInt(raw, 10); if (d >= 1 && d <= K) pick(d - 1); });

  c.draw = draw;
  function draw() {
    c.clear('#0f1538');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { ctx.fillStyle = PAL[g[y][x]]; ctx.fillRect(x * CS, y * CS, CS + .5, CS + .5); }
    PAL.forEach((p, i) => {
      ctx.fillStyle = p;
      U.rr(ctx, i * bw + 6, BS + 18, bw - 12, 62, 14); ctx.fill();
      if (i === g[0][0]) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); }
      if (!api.isTouch) U.text(ctx, i + 1, i * bw + bw / 2, BS + 49, 16, 'rgba(0,0,0,.45)');
    });
  }
  draw();
});
