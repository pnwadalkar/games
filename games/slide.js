// Sliding tile puzzle (8 / 15 / 24 puzzle). Options: n.
Hub.register('slide', (api, o) => {
  const N = o.n || 4, GAP = 8, S = 480, CELL = (S - GAP * (N + 1)) / N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  let board = [...Array(N * N).keys()].map(i => (i + 1) % (N * N)); // 0 = blank, solved order
  let moves = 0, done = false;
  const anim = {};

  // shuffle with random legal moves so it is always solvable
  let blank = N * N - 1, prev = -1;
  for (let i = 0; i < N * N * 40; i++) {
    const opts = nb(blank).filter(j => j !== prev);
    const j = U.pick(opts);
    [board[blank], board[j]] = [board[j], board[blank]];
    prev = blank; blank = j;
  }
  if (isSolved()) { const j = nb(blank)[0]; [board[blank], board[j]] = [board[j], board[blank]]; }
  function nb(i) {
    const r = Math.floor(i / N), k = i % N, out = [];
    if (r > 0) out.push(i - N); if (r < N - 1) out.push(i + N);
    if (k > 0) out.push(i - 1); if (k < N - 1) out.push(i + 1);
    return out;
  }
  function isSolved() { return board.every((v, i) => v === (i + 1) % (N * N)); }

  function slideFrom(i) {
    if (done) return;
    const b = board.indexOf(0);
    const br = Math.floor(b / N), bk = b % N, r = Math.floor(i / N), k = i % N;
    if (br !== r && bk !== k) return;
    if (i === b) return;
    const step = br === r ? (k > bk ? 1 : -1) : (r > br ? N : -N);
    let cur = b;
    while (cur !== i) {
      const nx = cur + step;
      anim[board[nx]] = { from: nx, t: 1 };
      board[cur] = board[nx]; board[nx] = 0;
      cur = nx;
      moves++;
    }
    api.setScore(moves);
    api.sfx('move');
    if (isSolved()) { done = true; api.end({ win: true, title: 'Solved!', score: moves, msg: moves + ' moves', delay: 400 }); }
  }
  api.pointer(c, {
    down: (x, y) => {
      const k = Math.floor((x - GAP / 2) / (CELL + GAP)), r = Math.floor((y - GAP / 2) / (CELL + GAP));
      if (k >= 0 && k < N && r >= 0 && r < N) slideFrom(r * N + k);
    }
  });
  api.onKey(k => {
    const b = board.indexOf(0), br = Math.floor(b / N), bk = b % N;
    // arrow moves the tile next to the blank in that direction into it
    if (k === 'left' && bk < N - 1) slideFrom(b + 1);
    if (k === 'right' && bk > 0) slideFrom(b - 1);
    if (k === 'up' && br < N - 1) slideFrom(b + N);
    if (k === 'down' && br > 0) slideFrom(b - N);
  });

  const pos = i => [GAP + (i % N) * (CELL + GAP), GAP + Math.floor(i / N) * (CELL + GAP)];
  api.loop(dt => { for (const k in anim) { anim[k].t -= dt / .09; if (anim[k].t <= 0) delete anim[k]; } }, () => {
    ctx.fillStyle = '#1b2250';
    U.rr(ctx, 0, 0, S, S, 16); ctx.fill();
    board.forEach((v, i) => {
      if (!v) return;
      let [x, y] = pos(i);
      if (anim[v]) { const [fx, fy] = pos(anim[v].from); const t = anim[v].t; x = U.lerp(x, fx, t); y = U.lerp(y, fy, t); }
      const home = v - 1, ok = home === i;
      const hue = 200 + (Math.floor(home / N) * N + home % N) / (N * N) * 140;
      ctx.fillStyle = ok ? `hsl(${hue},70%,58%)` : `hsl(${hue},55%,42%)`;
      U.rr(ctx, x, y, CELL, CELL, 12); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      U.rr(ctx, x + 4, y + 4, CELL - 8, CELL * .3, 8); ctx.fill();
      U.text(ctx, v, x + CELL / 2, y + CELL / 2 + 2, CELL * .42, '#fff', 'center', 800);
    });
  }, true);
});
