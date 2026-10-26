// Gomoku (five in a row) vs CPU or 2 players. Options: twoP.
Hub.register('gomoku', (api, o) => {
  const N = 15, CS = 36, PAD = 20, S = N * CS + PAD * 2 - CS;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const b = U.grid(N, N, 0);
  let turn = 1, done = false, last = null, winLine = null, moves = 0;
  const D4 = [[0, 1], [1, 0], [1, 1], [1, -1]];
  const inB = (r, k) => r >= 0 && k >= 0 && r < N && k < N;

  function line(r, k, p, dr, dk) {
    let n = 1, open = 0;
    const cells = [[r, k]];
    for (const s of [1, -1]) {
      let rr = r + dr * s, kk = k + dk * s;
      while (inB(rr, kk) && b[rr][kk] === p) { n++; cells.push([rr, kk]); rr += dr * s; kk += dk * s; }
      if (inB(rr, kk) && !b[rr][kk]) open++;
    }
    return { n, open, cells };
  }
  function cellScore(r, k, p) {
    let s = 0;
    for (const [dr, dk] of D4) {
      const { n, open } = line(r, k, p, dr, dk);
      if (n >= 5) s += 1e6;
      else if (n === 4) s += open === 2 ? 1e5 : open ? 1e4 : 0;
      else if (n === 3) s += open === 2 ? 5e3 : open ? 400 : 0;
      else if (n === 2) s += open === 2 ? 200 : open ? 40 : 0;
      else s += open * 4;
    }
    return s;
  }
  function cpuMove() {
    let best = null, bs = -1;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      if (b[r][k]) continue;
      let near = false;
      for (let a = -2; a <= 2 && !near; a++) for (let z = -2; z <= 2; z++) if (inB(r + a, k + z) && b[r + a][k + z]) { near = true; break; }
      if (!near) continue;
      const s = cellScore(r, k, 2) * 1.1 + cellScore(r, k, 1) + Math.random() * 3;
      if (s > bs) { bs = s; best = [r, k]; }
    }
    if (!best) best = [7, 7];
    place(best[0], best[1]);
  }
  function place(r, k) {
    if (done || b[r][k]) return;
    b[r][k] = turn;
    last = [r, k];
    moves++;
    api.sfx('click');
    for (const [dr, dk] of D4) {
      const L = line(r, k, turn, dr, dk);
      if (L.n >= 5) {
        done = true; winLine = L.cells;
        draw();
        if (o.twoP) return api.end({ win: true, title: (turn === 1 ? 'Black' : 'White') + ' wins!', emoji: '🎉', delay: 900 });
        return api.end({ win: turn === 1, title: turn === 1 ? 'You win!' : 'CPU wins', emoji: turn === 1 ? '🏆' : '🤖', delay: 900, score: turn === 1 ? Math.max(1, 120 - moves) : undefined });
      }
    }
    if (moves === N * N) { done = true; return api.end({ title: 'Draw!', emoji: '🤝', sound: 'hit' }); }
    turn = 3 - turn;
    api.status(o.twoP ? (turn === 1 ? '⚫ Black' : '⚪ White') + ' to move' : turn === 1 ? 'Your move (⚫)' : 'CPU thinking…');
    draw();
    if (!o.twoP && turn === 2) api.after(300, cpuMove);
  }
  api.status(o.twoP ? '⚫ Black to move' : 'Your move (⚫) — get five in a row');
  api.pointer(c, {
    down: (x, y) => {
      if (!o.twoP && turn === 2) return;
      const k = Math.round((x - PAD) / CS), r = Math.round((y - PAD) / CS);
      if (inB(r, k)) place(r, k);
    }
  });

  c.draw = draw;
  function draw() {
    c.clear('#d9a85b');
    ctx.strokeStyle = '#7a5428'; ctx.lineWidth = 1.2;
    for (let i = 0; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(PAD, PAD + i * CS); ctx.lineTo(PAD + (N - 1) * CS, PAD + i * CS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD + i * CS, PAD); ctx.lineTo(PAD + i * CS, PAD + (N - 1) * CS); ctx.stroke();
    }
    [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]].forEach(([r, k]) => U.circle(ctx, PAD + k * CS, PAD + r * CS, 4, '#7a5428'));
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = b[r][k];
      if (!v) continue;
      const x = PAD + k * CS, y = PAD + r * CS;
      U.circle(ctx, x + 1.5, y + 2, CS * .44, 'rgba(0,0,0,.3)');
      U.circle(ctx, x, y, CS * .44, v === 1 ? '#1a1a22' : '#fafafa');
      U.circle(ctx, x - 4, y - 4, CS * .12, v === 1 ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,1)');
    }
    if (last) U.circle(ctx, PAD + last[1] * CS, PAD + last[0] * CS, 4, '#ff3b5c');
    if (winLine) winLine.forEach(([r, k]) => { ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(PAD + k * CS, PAD + r * CS, CS * .44, 0, 7); ctx.stroke(); });
  }
  draw();
});
