// Gem Swap (match-3): swap neighbours to line up 3+, cascades multiply points. 30 moves.
Hub.register('gems', (api, o) => {
  const N = 8, CS = 60, TOP = 56, W = N * CS, H = N * CS + TOP, MOVES = o.moves || 30;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const T = ['💎', '🔶', '🟢', '🟣', '🔴', '⭐'];
  const K = T.length;
  let board = U.grid(N, N, null), state = 'idle', sel = null, moves = MOVES, score = 0, combo = 0, idleT = 0, hint = null, pending = null, clearT = 0;
  const mk = (r, k, fromRow) => ({ t: U.randi(0, K - 1), x: k, y: fromRow == null ? r : fromRow, s: 1 });

  function fresh() {
    do {
      for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
        let g;
        do { g = mk(r, k, r - N); } while ((k >= 2 && board[r][k - 1].t === g.t && board[r][k - 2].t === g.t) || (r >= 2 && board[r - 1][k].t === g.t && board[r - 2][k].t === g.t));
        board[r][k] = g;
      }
    } while (!findMove());
  }
  function matches() {
    const hit = new Set();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const t = board[r][k].t;
      if (k <= N - 3 && board[r][k + 1].t === t && board[r][k + 2].t === t) { hit.add(r * N + k); hit.add(r * N + k + 1); hit.add(r * N + k + 2); }
      if (r <= N - 3 && board[r + 1][k].t === t && board[r + 2][k].t === t) { hit.add(r * N + k); hit.add((r + 1) * N + k); hit.add((r + 2) * N + k); }
    }
    return hit;
  }
  function swap(a, b) { const t = board[a[0]][a[1]]; board[a[0]][a[1]] = board[b[0]][b[1]]; board[b[0]][b[1]] = t; }
  function findMove() {
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) for (const [dr, dk] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, k2 = k + dk;
      if (r2 >= N || k2 >= N) continue;
      swap([r, k], [r2, k2]);
      const ok = matches().size > 0;
      swap([r, k], [r2, k2]);
      if (ok) return [[r, k], [r2, k2]];
    }
    return null;
  }
  fresh();
  state = 'fall';

  function trySwap(a, b) {
    if (state !== 'idle' || moves <= 0) return;
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return;
    swap(a, b);
    pending = [a, b];
    state = 'swap';
    sel = null; hint = null; idleT = 0;
    api.sfx('move');
  }
  let down = null;
  const cellAt = (x, y) => { const k = Math.floor(x / CS), r = Math.floor((y - TOP) / CS); return r >= 0 && r < N && k >= 0 && k < N ? [r, k] : null; };
  api.pointer(c, {
    down: (x, y) => {
      const cell = cellAt(x, y);
      if (!cell) return;
      if (sel && Math.abs(sel[0] - cell[0]) + Math.abs(sel[1] - cell[1]) === 1) { trySwap(sel, cell); down = null; return; }
      sel = cell; down = { x, y, cell };
    },
    move: (x, y, e, isDown) => {
      if (!down || !isDown) return;
      const dx = x - down.x, dy = y - down.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > CS * .4) {
        const [r, k] = down.cell;
        const to = Math.abs(dx) > Math.abs(dy) ? [r, k + Math.sign(dx)] : [r + Math.sign(dy), k];
        if (to[0] >= 0 && to[0] < N && to[1] >= 0 && to[1] < N) trySwap(down.cell, to);
        down = null;
      }
    },
    up: () => { down = null; }
  });

  function settled() {
    let ok = true;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) { const g = board[r][k]; if (Math.abs(g.x - k) > .001 || Math.abs(g.y - r) > .001) ok = false; }
    return ok;
  }
  function startClear(hit) {
    combo++;
    hit.forEach(i => { board[Math.floor(i / N)][i % N].dying = true; });
    score += hit.size * 10 * combo;
    api.setScore(score);
    api.sfx(combo > 1 ? 'coin' : 'pop');
    if (combo > 1) api.toast('Combo ×' + combo, 700);
    clearT = .22;
    state = 'clear';
  }
  function collapse() {
    for (let k = 0; k < N; k++) {
      const col = [];
      for (let r = N - 1; r >= 0; r--) if (!board[r][k].dying) col.push(board[r][k]);
      let spawned = 0;
      for (let r = N - 1; r >= 0; r--) {
        const i = N - 1 - r;
        if (i < col.length) board[r][k] = col[i];
        else { spawned++; board[r][k] = mk(r, k, -spawned); }
      }
    }
    state = 'fall';
  }

  api.loop(dt => {
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const g = board[r][k], sp = (state === 'fall' ? 11 : 7) * dt;
      g.x += U.clamp(k - g.x, -sp, sp);
      g.y += U.clamp(r - g.y, -sp, sp);
    }
    if (state === 'swap' && settled()) {
      const hit = matches();
      if (hit.size) { moves--; combo = 0; startClear(hit); }
      else { swap(pending[0], pending[1]); state = 'unswap'; api.sfx('bad'); }
    } else if (state === 'unswap' && settled()) state = 'idle';
    else if (state === 'clear') {
      clearT -= dt;
      for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (board[r][k].dying) board[r][k].s = Math.max(0, clearT / .22);
      if (clearT <= 0) collapse();
    } else if (state === 'fall' && settled()) {
      const hit = matches();
      if (hit.size) startClear(hit);
      else {
        state = 'idle';
        if (moves <= 0) api.end({ win: true, title: 'Out of moves', emoji: '💎', score });
        else if (!findMove()) { api.toast('No moves — shuffling'); board = U.grid(N, N, null); fresh(); state = 'fall'; }
      }
    }
    if (state === 'idle') { idleT += dt; if (idleT > 6 && !hint) hint = findMove(); }
  }, draw, true);

  function draw() {
    c.clear('#10163a');
    U.text(ctx, 'Moves', 14, 18, 12, '#8f99c4', 'left');
    U.text(ctx, moves, 14, 38, 22, moves <= 5 ? '#ff5c7a' : '#fff', 'left', 800);
    U.text(ctx, 'Score ' + score, W - 14, 28, 18, '#fff', 'right', 800);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, TOP, W, H - TOP); ctx.clip();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      ctx.fillStyle = (r + k) % 2 ? '#18204f' : '#1d2659';
      ctx.fillRect(k * CS, TOP + r * CS, CS, CS);
    }
    if (sel) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(sel[1] * CS, TOP + sel[0] * CS, CS, CS); }
    const pulse = .5 + .5 * Math.sin(performance.now() / 150);
    if (hint) hint.forEach(([r, k]) => { ctx.strokeStyle = `rgba(255,201,77,${pulse})`; ctx.lineWidth = 3; ctx.strokeRect(k * CS + 3, TOP + r * CS + 3, CS - 6, CS - 6); });
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const g = board[r][k];
      if (g.s <= 0) continue;
      ctx.save();
      ctx.translate(g.x * CS + CS / 2, TOP + g.y * CS + CS / 2);
      ctx.scale(g.s, g.s);
      U.text(ctx, T[g.t], 0, 2, CS * .62);
      ctx.restore();
    }
    ctx.restore();
  }
});
