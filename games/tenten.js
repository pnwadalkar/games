// Block Fit: drag pieces onto the 10×10 board. Complete rows or columns to clear them. No room for a piece ends the game.
Hub.register('tenten', (api) => {
  const N = 10, CS = 36, OX = 20, OY = 20, W = OX * 2 + N * CS, H = 640, TRAY = OY + N * CS + 50;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const SHAPES = [
    [[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]],
    [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]
  ];
  const board = U.grid(N, N, null);
  let tray = [], drag = null, score = 0, combo = 0, clearing = [], t = 0;

  const newPiece = () => { const s = U.pick(SHAPES); return { cells: s, col: U.pick(U.C), w: Math.max(...s.map(p => p[1])) + 1, h: Math.max(...s.map(p => p[0])) + 1, used: false }; };
  const refill = () => { tray = [newPiece(), newPiece(), newPiece()]; };
  refill();
  const slotX = i => W / 6 + i * W / 3;
  const fits = (p, r, k) => p.cells.every(([dr, dk]) => { const a = r + dr, b = k + dk; return a >= 0 && b >= 0 && a < N && b < N && !board[a][b]; });
  const canPlaceAny = () => tray.some(p => !p.used && board.some((_, r) => board[r].some((__, k) => fits(p, r, k))));

  api.pointer(c, {
    down: (x, y) => {
      if (api.over) return;
      tray.forEach((p, i) => {
        if (p.used) return;
        const sc = Math.min(1, 100 / (Math.max(p.w, p.h) * CS)), cx = slotX(i), w = p.w * CS * sc, h = p.h * CS * sc;
        if (Math.abs(x - cx) < Math.max(50, w / 2 + 10) && y > TRAY - 20 && y < TRAY + 130) drag = { i, x, y, off: 0 };
      });
    },
    move: (x, y, e, down) => { if (drag && down) { drag.x = x; drag.y = y; } },
    up: (x, y) => {
      if (!drag) return;
      const p = tray[drag.i], pos = anchor(p);
      if (pos && fits(p, pos[0], pos[1])) place(p, pos[0], pos[1]);
      drag = null;
    }
  });
  // while dragging the piece floats above the finger; return the board cell for its top-left
  function anchor(p) {
    const px = drag.x - (p.w * CS) / 2, py = drag.y - 70 - (p.h * CS) / 2;
    const k = Math.round((px - OX) / CS), r = Math.round((py - OY) / CS);
    return [r, k];
  }
  function place(p, r, k) {
    p.cells.forEach(([dr, dk]) => { board[r + dr][k + dk] = p.col; });
    p.used = true; score += p.cells.length; api.sfx('click');
    const rows = [], cols = [];
    for (let i = 0; i < N; i++) { if (board[i].every(Boolean)) rows.push(i); if (board.every(row => row[i])) cols.push(i); }
    const n = rows.length + cols.length;
    if (n) {
      combo++; score += n * 10 * n + (combo > 1 ? combo * 5 : 0); api.sfx(n > 1 ? 'win' : 'coin');
      rows.forEach(i => { for (let k = 0; k < N; k++) { clearing.push({ r: i, k, col: board[i][k], t: .35 }); } });
      cols.forEach(i => { for (let r = 0; r < N; r++) clearing.push({ r, k: i, col: board[r][i], t: .35 }); });
      rows.forEach(i => { for (let k = 0; k < N; k++) board[i][k] = null; });
      cols.forEach(i => { for (let r = 0; r < N; r++) board[r][i] = null; });
    } else combo = 0;
    api.setScore(score);
    if (tray.every(q => q.used)) refill();
    if (!canPlaceAny()) api.end({ msg: score + ' points', emoji: '🧱' });
  }

  api.loop(dt => { t += dt; clearing.forEach(c2 => { c2.t -= dt; }); clearing = clearing.filter(c2 => c2.t > 0); }, draw, true);

  function cellDraw(x, y, col, s) { U.box(ctx, x + 2, y + 5, s - 5, s - 7, col, 5); }
  function draw() {
    c.clear('#14122e');
    ctx.fillStyle = '#231f4a'; U.rr(ctx, OX - 8, OY - 8, N * CS + 16, N * CS + 16, 12); ctx.fill();
    const dragCell = drag && anchor(tray[drag.i]), ok = drag && dragCell && fits(tray[drag.i], dragCell[0], dragCell[1]);
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = OX + k * CS, y = OY + r * CS;
      ctx.__flat = true; ctx.fillStyle = (Math.floor(r / 5) + Math.floor(k / 5)) % 2 ? '#2a2658' : '#312d66'; ctx.fillRect(x + 1, y + 1, CS - 2, CS - 2); ctx.__flat = false;
    }
    if (ok) tray[drag.i].cells.forEach(([dr, dk]) => { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(OX + (dragCell[1] + dk) * CS + 1, OY + (dragCell[0] + dr) * CS + 1, CS - 2, CS - 2); });
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (board[r][k]) cellDraw(OX + k * CS, OY + r * CS, board[r][k], CS);
    clearing.forEach(c2 => { ctx.globalAlpha = c2.t * 2.8; ctx.fillStyle = '#fff'; ctx.fillRect(OX + c2.k * CS + 1, OY + c2.r * CS + 1, CS - 2, CS - 2); }); ctx.globalAlpha = 1;
    tray.forEach((p, i) => {
      if (p.used || (drag && drag.i === i)) return;
      const sc = Math.min(1, 100 / (Math.max(p.w, p.h) * CS)), s = CS * sc, x0 = slotX(i) - p.w * s / 2, y0 = TRAY + 60 - p.h * s / 2;
      p.cells.forEach(([dr, dk]) => cellDraw(x0 + dk * s, y0 + dr * s, p.col, s));
    });
    if (drag) {
      const p = tray[drag.i], x0 = drag.x - p.w * CS / 2, y0 = drag.y - 70 - p.h * CS / 2;
      ctx.globalAlpha = .92; p.cells.forEach(([dr, dk]) => cellDraw(x0 + dk * CS, y0 + dr * CS, p.col, CS)); ctx.globalAlpha = 1;
    }
    if (combo > 1) U.text(ctx, 'Combo ×' + combo, W / 2, TRAY - 20, 18, '#ffe27a', 'center', 900);
  }
});
