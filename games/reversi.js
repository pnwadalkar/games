// Reversi / Othello vs CPU or 2 players. Options: twoP, depth.
Hub.register('reversi', (api, o) => {
  const N = 8, CS = 62, TOP = 50, W = N * CS, H = N * CS + TOP;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const b = U.grid(N, N, 0); // 1 black (you), 2 white (CPU)
  b[3][3] = b[4][4] = 2; b[3][4] = b[4][3] = 1;
  let turn = 1, done = false, flips = {}, last = null;
  api.turnOf = () => turn - 1;
  const WT = [
    [100, -20, 10, 5, 5, 10, -20, 100], [-20, -50, -2, -2, -2, -2, -50, -20], [10, -2, 1, 1, 1, 1, -2, 10], [5, -2, 1, 0, 0, 1, -2, 5],
    [5, -2, 1, 0, 0, 1, -2, 5], [10, -2, 1, 1, 1, 1, -2, 10], [-20, -50, -2, -2, -2, -2, -50, -20], [100, -20, 10, 5, 5, 10, -20, 100]
  ];
  const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function captures(bd, r, k, p) {
    if (bd[r][k]) return [];
    const out = [];
    for (const [dr, dk] of D8) {
      const line = [];
      let rr = r + dr, kk = k + dk;
      while (rr >= 0 && rr < N && kk >= 0 && kk < N && bd[rr][kk] === 3 - p) { line.push([rr, kk]); rr += dr; kk += dk; }
      if (line.length && rr >= 0 && rr < N && kk >= 0 && kk < N && bd[rr][kk] === p) out.push(...line);
    }
    return out;
  }
  function moves(bd, p) {
    const m = [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) { const cap = captures(bd, r, k, p); if (cap.length) m.push({ r, k, cap }); }
    return m;
  }
  function evalB(bd) {
    let s = 0;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (bd[r][k]) s += (bd[r][k] === 2 ? 1 : -1) * WT[r][k];
    return s + (moves(bd, 2).length - moves(bd, 1).length) * 5;
  }
  function search(bd, depth, a, beta, p) {
    const ms = moves(bd, p);
    if (!depth || !ms.length) return { s: evalB(bd) };
    let best = { s: p === 2 ? -1e9 : 1e9, m: ms[0] };
    for (const m of ms) {
      const nb = bd.map(row => row.slice());
      nb[m.r][m.k] = p; m.cap.forEach(([r, k]) => { nb[r][k] = p; });
      const s = search(nb, depth - 1, a, beta, 3 - p).s;
      if (p === 2 ? s > best.s : s < best.s) best = { s, m };
      if (p === 2) a = Math.max(a, s); else beta = Math.min(beta, s);
      if (a >= beta) break;
    }
    return best;
  }
  const count = p => b.flat().filter(v => v === p).length;
  function status() {
    const name = p => o.twoP ? (p === 1 ? 'Black' : 'White') : (p === 1 ? 'You' : 'CPU');
    api.status(`⚫ ${name(1)} ${count(1)} · ⚪ ${name(2)} ${count(2)}` + (done ? '' : ' · ' + name(turn) + (o.twoP || turn === 1 ? ' to move' : ' thinking…')));
    if (!o.twoP) api.setScore(count(1));
  }
  function play(m) {
    b[m.r][m.k] = turn;
    m.cap.forEach(([r, k]) => { b[r][k] = turn; flips[r * N + k] = 0; });
    last = [m.r, m.k];
    api.sfx('flip');
    next();
  }
  function next() {
    const opp = 3 - turn;
    if (moves(b, opp).length) turn = opp;
    else if (!moves(b, turn).length) return finish();
    else api.toast((o.twoP ? (opp === 1 ? 'Black' : 'White') : opp === 1 ? 'You have' : 'CPU has') + ' no moves — pass');
    status();
    if (!o.twoP && turn === 2) api.after(500, () => play(search(b, o.depth || 3, -1e9, 1e9, 2).m));
  }
  function finish() {
    done = true;
    status();
    const a = count(1), z = count(2);
    if (o.twoP) api.end({ win: a !== z, title: a === z ? 'Draw!' : (a > z ? 'Black' : 'White') + ' wins!', msg: a + ' – ' + z, emoji: '⚫', delay: 900 });
    else api.end({ win: a > z, title: a > z ? 'You win!' : a < z ? 'CPU wins' : 'Draw!', msg: a + ' – ' + z, score: a, emoji: a > z ? '🏆' : '🤖', delay: 900 });
  }
  status();
  api.pointer(c, {
    down: (x, y) => {
      if (done || (!o.twoP && turn === 2)) return;
      const k = Math.floor(x / CS), r = Math.floor((y - TOP) / CS);
      if (r < 0 || k < 0 || r >= N || k >= N) return;
      const cap = captures(b, r, k, turn);
      if (cap.length) play({ r, k, cap }); else api.sfx('bad');
    }
  });

  api.loop(dt => { for (const i in flips) { flips[i] += dt * 4; if (flips[i] >= 1) delete flips[i]; } }, () => {
    c.clear('#10163a');
    U.text(ctx, '⚫ ' + count(1), 16, TOP / 2, 20, '#fff', 'left', 800);
    U.text(ctx, count(2) + ' ⚪', W - 16, TOP / 2, 20, '#fff', 'right', 800);
    if (!done) U.text(ctx, (turn === 1 ? 'Black' : 'White') + ' to move', W / 2, TOP / 2, 14, '#8f99c4');
    ctx.fillStyle = '#1e8a4c';
    ctx.fillRect(0, TOP, W, N * CS);
    ctx.strokeStyle = '#146a39'; ctx.lineWidth = 2;
    for (let i = 0; i <= N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CS, TOP); ctx.lineTo(i * CS, TOP + N * CS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, TOP + i * CS); ctx.lineTo(W, TOP + i * CS); ctx.stroke();
    }
    const showHints = !done && (o.twoP || turn === 1);
    const hints = showHints ? moves(b, turn) : [];
    hints.forEach(m => U.circle(ctx, m.k * CS + CS / 2, TOP + m.r * CS + CS / 2, 6, 'rgba(0,0,0,.25)'));
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = b[r][k];
      if (!v) continue;
      const f = flips[r * N + k];
      const sx = f == null ? 1 : Math.abs(Math.cos(f * Math.PI));
      const shown = f != null && f < .5 ? 3 - v : v;
      ctx.save();
      ctx.translate(k * CS + CS / 2, TOP + r * CS + CS / 2);
      ctx.scale(Math.max(.05, sx), 1);
      U.circle(ctx, 0, 3, CS * .4, 'rgba(0,0,0,.3)');
      U.circle(ctx, 0, 0, CS * .4, shown === 1 ? '#15172b' : '#f4f5ff');
      ctx.restore();
    }
    if (last) { U.circle(ctx, last[1] * CS + CS / 2, TOP + last[0] * CS + CS / 2, 4, '#ff5c7a'); }
  }, true);
});
