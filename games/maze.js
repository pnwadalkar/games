// Maze Runner: escape a freshly generated maze. Options: n (cells per side).
Hub.register('maze', (api, o) => {
  const N = o.n || 12, S = 600, CS = S / N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  api.controls('dpad');
  // walls[y][x] = {n,e,s,w}; carved with an iterative recursive-backtracker
  const walls = U.grid(N, N, () => ({ n: true, e: true, s: true, w: true }));
  const seen = U.grid(N, N, false), stack = [[0, 0]];
  seen[0][0] = true;
  const D = { n: [0, -1, 's'], s: [0, 1, 'n'], e: [1, 0, 'w'], w: [-1, 0, 'e'] };
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = Object.keys(D).filter(d => { const nx = x + D[d][0], ny = y + D[d][1]; return nx >= 0 && ny >= 0 && nx < N && ny < N && !seen[ny][nx]; });
    if (!opts.length) { stack.pop(); continue; }
    const d = U.pick(opts), nx = x + D[d][0], ny = y + D[d][1];
    walls[y][x][d] = false; walls[ny][nx][D[d][2]] = false;
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }
  const p = { x: 0, y: 0, dx: 0, dy: 0 }, goal = { x: N - 1, y: N - 1 };
  const trail = new Set(['0,0']);
  let secs = 0, t0 = performance.now(), done = false, steps = 0;

  function step(dir) {
    if (done) return;
    const d = { up: 'n', down: 's', left: 'w', right: 'e' }[dir];
    if (!d) return;
    // keep running down corridors until a junction, so swipes feel good
    let moved = false;
    for (let guard = 0; guard < N * N; guard++) {
      if (walls[p.y][p.x][d]) break;
      p.x += D[d][0]; p.y += D[d][1];
      trail.add(p.x + ',' + p.y);
      steps++; moved = true;
      if (p.x === goal.x && p.y === goal.y) break;
      const open = Object.keys(D).filter(k => !walls[p.y][p.x][k]);
      if (open.length !== 2 || !open.includes(d)) break;
    }
    if (moved) api.sfx('move');
    if (p.x === goal.x && p.y === goal.y) {
      done = true;
      secs = (performance.now() - t0) / 1000;
      api.end({ win: true, title: 'Escaped!', score: Math.round(secs * 10) / 10, emoji: '🏁' });
    }
  }
  api.onKey(step);
  api.onSwipe(step);

  api.loop(() => {
    if (!done) api.setScore(Math.round((performance.now() - t0) / 100) / 10);
    p.dx = U.lerp(p.dx, p.x, .35); p.dy = U.lerp(p.dy, p.y, .35);
  }, () => {
    c.clear('#0f1538');
    ctx.fillStyle = 'rgba(0,212,255,.12)';
    trail.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillRect(x * CS, y * CS, CS, CS); });
    ctx.fillStyle = '#2ee59d';
    U.rr(ctx, goal.x * CS + CS * .15, goal.y * CS + CS * .15, CS * .7, CS * .7, 6); ctx.fill();
    U.text(ctx, '🏁', goal.x * CS + CS / 2, goal.y * CS + CS / 2, CS * .5);
    ctx.strokeStyle = '#9aa6ff';
    ctx.lineWidth = Math.max(2, CS * .1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const w = walls[y][x], X = x * CS, Y = y * CS;
      if (w.n) { ctx.moveTo(X, Y); ctx.lineTo(X + CS, Y); }
      if (w.w) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + CS); }
      if (y === N - 1 && w.s) { ctx.moveTo(X, Y + CS); ctx.lineTo(X + CS, Y + CS); }
      if (x === N - 1 && w.e) { ctx.moveTo(X + CS, Y); ctx.lineTo(X + CS, Y + CS); }
    }
    ctx.stroke();
    U.circle(ctx, p.dx * CS + CS / 2, p.dy * CS + CS / 2, CS * .3, '#ffc94d');
  }, true);
});
