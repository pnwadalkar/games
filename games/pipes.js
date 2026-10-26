// Pipe Connect: rotate tiles until every pipe is connected to the source with no leaks. Options: n.
Hub.register('pipes', (api, o) => {
  const N = o.n || 6, S = 540, CS = S / N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  // bits: 1=N 2=E 4=S 8=W
  const DIRS = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
  const g = U.grid(N, N, 0);
  const src = { x: Math.floor(N / 2), y: Math.floor(N / 2) };
  // random spanning tree (randomised Prim) gives a guaranteed solution
  const inTree = U.grid(N, N, false);
  inTree[src.y][src.x] = true;
  let frontier = [];
  const addF = (x, y) => DIRS.forEach(([dx, dy, b, ob]) => { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && !inTree[ny][nx]) frontier.push([x, y, nx, ny, b, ob]); });
  addF(src.x, src.y);
  let treeSize = 1;
  while (treeSize < N * N) {
    if (!frontier.length) for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (inTree[yy][xx]) addF(xx, yy);
    const i = U.randi(0, frontier.length - 1), [x, y, nx, ny, b, ob] = frontier[i];
    frontier.splice(i, 1);
    if (inTree[ny][nx]) continue;
    // avoid 4-way crosses so tiles stay readable
    if ([1, 2, 4, 8].filter(m => g[y][x] & m).length >= 3) { if (Math.random() < .8) continue; }
    g[y][x] |= b; g[ny][nx] |= ob; inTree[ny][nx] = true;
    treeSize++;
    addF(nx, ny);
  }
  const rot = v => ((v << 1) | (v >> 3)) & 15;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = U.randi(0, 3); for (let i = 0; i < r; i++) g[y][x] = rot(g[y][x]); }
  let moves = 0, done = false, wet = new Set();
  const turn = {};

  function flow() {
    wet = new Set([src.x + ',' + src.y]);
    const q = [[src.x, src.y]];
    let leaks = 0;
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      DIRS.forEach(([dx, dy, b, ob]) => {
        if (!(g[y][x] & b)) return;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || !(g[ny][nx] & ob)) { leaks++; return; }
        const k = nx + ',' + ny;
        if (!wet.has(k)) { wet.add(k); q.push([nx, ny]); }
      });
    }
    return leaks;
  }
  if (flow() === 0 && wet.size === N * N) { g[0][0] = rot(g[0][0]); }
  flow();

  api.pointer(c, {
    down: (x, y, e) => {
      if (done) return;
      const k = Math.floor(x / CS), r = Math.floor(y / CS);
      if (k < 0 || r < 0 || k >= N || r >= N) return;
      const back = e.button === 2;
      g[r][k] = back ? rot(rot(rot(g[r][k]))) : rot(g[r][k]);
      turn[r * N + k] = back ? -1 : 1;
      moves++;
      api.setScore(moves);
      api.sfx('click');
      const leaks = flow();
      if (!leaks && wet.size === N * N) { done = true; api.end({ win: true, title: 'All connected!', score: moves, emoji: '🚰', delay: 500 }); }
    }
  });

  api.loop(dt => { for (const k in turn) { turn[k] -= Math.sign(turn[k]) * dt / .12; if (Math.abs(turn[k]) < .02 || Math.abs(turn[k]) > 1) delete turn[k]; } }, () => {
    c.clear('#0f1538');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const X = x * CS, Y = y * CS, w = wet.has(x + ',' + y);
      ctx.fillStyle = (x + y) % 2 ? '#151c47' : '#18204f';
      ctx.fillRect(X, Y, CS, CS);
      ctx.save();
      ctx.translate(X + CS / 2, Y + CS / 2);
      const t = turn[y * N + x];
      if (t) ctx.rotate(-t * Math.PI / 2);
      ctx.strokeStyle = w ? '#00d4ff' : '#5a6399';
      ctx.lineWidth = CS * .22;
      ctx.lineCap = 'round';
      [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]].forEach(([dx, dy, b]) => {
        if (g[y][x] & b) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dx * CS / 2, dy * CS / 2); ctx.stroke(); }
      });
      const ends = [1, 2, 4, 8].filter(m => g[y][x] & m).length;
      if (x === src.x && y === src.y) U.circle(ctx, 0, 0, CS * .28, '#ffc94d');
      else if (ends === 1) U.circle(ctx, 0, 0, CS * .2, w ? '#2ee59d' : '#3b4570');
      else U.circle(ctx, 0, 0, CS * .11, w ? '#00d4ff' : '#5a6399');
      ctx.restore();
    }
  }, true);
});
