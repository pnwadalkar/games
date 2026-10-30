// Unblock: slide the blocks out of the way and free the red block. Puzzles are scrambled from a solved state, so each is solvable.
Hub.register('unblock', (api, o) => {
  const N = 6, CS = 64, PAD = 20, S = N * CS + PAD * 2, W = S + 20, H = S + 90, OX = (W - N * CS) / 2, OY = 60;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const COLS = ['#2ee59d', '#4cc9f0', '#ffb703', '#9d4edd', '#ff8fab', '#8ac926', '#f77f00', '#118ab2', '#e5c07b'];
  // pieces: {r, c, len, horiz, red}
  let pcs = [], moves = 0, drag = null, won = false;

  const occ = (skip) => { const g = U.grid(N, N, -1); pcs.forEach((p, i) => { if (i === skip) return; for (let k = 0; k < p.len; k++) g[p.r + (p.horiz ? 0 : k)][p.c + (p.horiz ? k : 0)] = i; }); return g; };
  function scramble() {
    pcs = [{ r: 2, c: 4, len: 2, horiz: true, red: true }];
    const target = o.blocks || 8;
    for (let tries = 0; pcs.length < target + 1 && tries < 300; tries++) {
      const horiz = Math.random() < .5, len = Math.random() < .3 ? 3 : 2;
      const r = U.randi(0, horiz ? N - 1 : N - len), cc = U.randi(0, horiz ? N - len : N - 1);
      if (horiz && r === 2) continue;
      const g = occ(-1); let ok = true;
      for (let k = 0; k < len; k++) if (g[r + (horiz ? 0 : k)][cc + (horiz ? k : 0)] !== -1) ok = false;
      if (ok) pcs.push({ r, c: cc, len, horiz });
    }
    // random legal moves from the solved state (always reversible)
    for (let s = 0; s < 4000 && (s < (o.steps || 120) || pcs[0].c > 2); s++) {
      const i = U.randi(0, pcs.length - 1), p = pcs[i], d = Math.random() < .5 ? -1 : 1, g = occ(i);
      const nr = p.r + (p.horiz ? 0 : d), nc = p.c + (p.horiz ? d : 0);
      const lead = p.horiz ? [nr, d > 0 ? p.c + p.len : p.c - 1] : [d > 0 ? p.r + p.len : p.r - 1, nc];
      if (lead[0] < 0 || lead[1] < 0 || lead[0] >= N || lead[1] >= N || g[lead[0]][lead[1]] !== -1) continue;
      p.r = nr; p.c = nc;
    }
    if (pcs[0].c > 2) return scramble(); // red ended up too close to the exit: try again
  }
  scramble();
  api.status('Slide the red block to the exit →');

  const cell = (x, y) => [Math.floor((y - OY) / CS), Math.floor((x - OX) / CS)];
  api.pointer(c, {
    down: (x, y) => {
      if (won || api.over) return;
      const [r, cc] = cell(x, y), g = occ(-1);
      if (r < 0 || cc < 0 || r >= N || cc >= N || g[r][cc] < 0) return;
      const i = g[r][cc], p = pcs[i], gg = occ(i);
      // legal travel range along the piece's axis
      let lo = p.horiz ? p.c : p.r, hi = lo;
      while (lo > 0 && gg[p.horiz ? p.r : lo - 1][p.horiz ? lo - 1 : p.c] < 0) lo--;
      let end = (p.horiz ? p.c : p.r) + p.len - 1;
      while (end < N - 1 && gg[p.horiz ? p.r : end + 1][p.horiz ? end + 1 : p.c] < 0) end++;
      hi = end - p.len + 1;
      drag = { i, lo, hi, startPos: p.horiz ? p.c : p.r, grab: p.horiz ? x : y, pos: p.horiz ? p.c : p.r, startC: p.c, startR: p.r };
    },
    move: (x, y, e, down) => {
      if (!drag || !down) return;
      const p = pcs[drag.i], d = ((p.horiz ? x : y) - drag.grab) / CS;
      drag.pos = U.clamp(drag.startPos + d, drag.lo, drag.hi);
    },
    up: () => {
      if (!drag) return;
      const p = pcs[drag.i], np = Math.round(drag.pos);
      if (np !== drag.startPos) {
        if (p.horiz) p.c = np; else p.r = np;
        moves++; api.setScore(moves); api.sfx('move');
        if (p.red && p.c + p.len - 1 >= N - 1) {
          won = true; api.sfx('win'); api.end({ win: true, title: 'Free!', score: moves, msg: 'Solved in ' + moves + ' moves', emoji: '🔓' });
        }
      }
      drag = null;
    }
  });

  api.loop(() => {}, draw, true);
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b2142'); g.addColorStop(1, '#14102a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // board tray with exit gap
    ctx.fillStyle = '#4a3a2a'; U.rr(ctx, OX - 12, OY - 12, N * CS + 24, N * CS + 24, 14); ctx.fill();
    ctx.fillStyle = '#6b5238'; ctx.fillRect(OX + N * CS + 6, OY + 2 * CS + 4, 14, CS - 8);
    ctx.__flat = true; ctx.fillStyle = '#d9c7a0'; ctx.fillRect(OX, OY, N * CS, N * CS);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
    for (let i = 1; i < N; i++) { ctx.beginPath(); ctx.moveTo(OX + i * CS, OY); ctx.lineTo(OX + i * CS, OY + N * CS); ctx.moveTo(OX, OY + i * CS); ctx.lineTo(OX + N * CS, OY + i * CS); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(OX + N * CS - 6, OY + 2 * CS + 6, 6, CS - 12);
    ctx.__flat = false;
    pcs.forEach((p, i) => {
      const pos = drag && drag.i === i ? drag.pos : (p.horiz ? p.c : p.r);
      const x = OX + (p.horiz ? pos : p.c) * CS + 3, y = OY + (p.horiz ? p.r : pos) * CS + 3;
      const w = (p.horiz ? p.len : 1) * CS - 6, h = (p.horiz ? 1 : p.len) * CS - 6;
      U.box(ctx, x, y + 4, w, h - 4, p.red ? '#ff4d6d' : COLS[i % COLS.length], 8);
      if (p.red) U.text(ctx, '➜', x + w / 2, y + h / 2 + 4, 26, '#fff');
    });
    U.text(ctx, 'Moves ' + moves, W / 2, 26, 18, '#fff', 'center', 800);
  }
});
