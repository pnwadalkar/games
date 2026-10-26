// Falling blocks (Tetris style) with ghost piece, next preview, levels. Options: startLevel.
Hub.register('blocks', (api, o) => {
  const COLS = 10, ROWS = 20, CS = 28, BX = 12, BY = 12, W = BX * 2 + COLS * CS + 130, H = BY * 2 + ROWS * CS;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('blocks');

  const SH = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
  };
  const COL = { I: '#00d4ff', O: '#ffc94d', T: '#b06cff', S: '#2ee59d', Z: '#ff5c7a', J: '#4d7cff', L: '#ff8a3d' };
  const board = U.grid(COLS, ROWS, null);
  let bag = [], cur = null, next = null, score = 0, lines = 0, level = o.startLevel || 1, fall = 0, lock = 0, das = 0, flashRows = [], flashT = 0;

  const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
  const draw7 = () => { if (!bag.length) bag = U.shuffle(Object.keys(SH)); return bag.pop(); };
  const mkPiece = t => ({ t, m: SH[t].map(r => r.slice()), x: t === 'O' ? 4 : 3, y: t === 'I' ? -1 : 0 });
  function fits(m, x, y) {
    for (let r = 0; r < m.length; r++) for (let k = 0; k < m[r].length; k++) {
      if (!m[r][k]) continue;
      const bx = x + k, by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return false;
      if (by >= 0 && board[by][bx]) return false;
    }
    return true;
  }
  function spawn() {
    cur = next ? mkPiece(next) : mkPiece(draw7());
    next = draw7();
    fall = 0; lock = 0;
    if (!fits(cur.m, cur.x, cur.y)) { cur = null; api.end({ msg: lines + ' lines · level ' + level }); }
  }
  spawn();

  const gravity = () => Math.max(.04, .8 * Math.pow(.85, level - 1));
  function move(dx) { if (cur && fits(cur.m, cur.x + dx, cur.y)) { cur.x += dx; lock = Math.min(lock, .2); api.sfx('move'); return true; } return false; }
  function rotate() {
    if (!cur || cur.t === 'O') return;
    const m = rot(cur.m);
    for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; lock = 0; api.sfx('flip'); return; }
    if (fits(m, cur.x, cur.y - 1)) { cur.m = m; cur.y -= 1; api.sfx('flip'); }
  }
  function ghostY() { let y = cur.y; while (fits(cur.m, cur.x, y + 1)) y++; return y; }
  function hardDrop() {
    if (!cur || flashT > 0) return;
    const gy = ghostY();
    score += (gy - cur.y) * 2;
    cur.y = gy;
    lockPiece();
  }
  function lockPiece() {
    cur.m.forEach((row, r) => row.forEach((v, k) => { if (v && cur.y + r >= 0) board[cur.y + r][cur.x + k] = cur.t; }));
    if (cur.m.some((row, r) => row.some(v => v) && cur.y + r < 0)) { cur = null; return api.end({ msg: lines + ' lines · level ' + level }); }
    api.sfx('hit');
    flashRows = [];
    for (let r = 0; r < ROWS; r++) if (board[r].every(Boolean)) flashRows.push(r);
    cur = null;
    if (flashRows.length) { flashT = .25; }
    else spawn();
    api.setScore(score);
  }
  function clearRows() {
    const n = flashRows.length;
    flashRows.forEach(r => { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); });
    lines += n;
    score += [0, 100, 300, 500, 800][n] * level;
    const nl = (o.startLevel || 1) + Math.floor(lines / 10);
    if (nl > level) { level = nl; api.toast('Level ' + level); }
    api.sfx(n === 4 ? 'win' : 'coin');
    api.setScore(score);
    flashRows = [];
    spawn();
  }

  api.onKey((k, raw, e) => {
    if (api.over || (e && e.repeat)) return;
    if (k === 'left' || k === 'right') { move(k === 'left' ? -1 : 1); das = 0; }
    else if (k === 'up') rotate();
    else if (k === 'a') hardDrop();
  });

  // touch gestures on the board: drag to shift, tap to rotate, flick down to drop
  let g = null;
  api.pointer(c, {
    down: (x, y) => { g = { x, y, sx: x, sy: y, t: performance.now(), moved: false }; },
    move: (x, y, e, isDown) => {
      if (!g || !isDown) return;
      while (x - g.x > CS * .9) { move(1); g.x += CS * .9; g.moved = true; }
      while (g.x - x > CS * .9) { move(-1); g.x -= CS * .9; g.moved = true; }
      if (y - g.y > CS * 1.2 && cur && fits(cur.m, cur.x, cur.y + 1)) { cur.y++; score++; g.y += CS * 1.2; g.moved = true; }
    },
    up: (x, y) => {
      if (!g) return;
      const dt = performance.now() - g.t, dy = y - g.sy;
      if (dy > 80 && dt < 250) hardDrop();
      else if (!g.moved && Math.abs(x - g.sx) < 12 && Math.abs(dy) < 12) rotate();
      g = null;
    }
  });

  api.loop(dt => {
    if (flashT > 0) { flashT -= dt; if (flashT <= 0) clearRows(); return; }
    if (!cur) return;
    if (api.keys.left || api.keys.right) {
      das += dt;
      if (das > .17) { move(api.keys.left ? -1 : 1); das = .17 - .045; }
    }
    const grav = api.keys.down ? Math.min(.04, gravity()) : gravity();
    if (fits(cur.m, cur.x, cur.y + 1)) {
      lock = 0;
      fall += dt;
      while (fall >= grav && fits(cur.m, cur.x, cur.y + 1)) { fall -= grav; cur.y++; if (api.keys.down) { score++; api.setScore(score); } }
    } else {
      lock += dt;
      if (lock > .45) lockPiece();
    }
  }, draw);

  function cell(x, y, t, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = COL[t];
    U.rr(ctx, x + 1, y + 1, CS - 2, CS - 2, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(x + 4, y + 4, CS - 8, 4);
    ctx.globalAlpha = 1;
  }
  function draw() {
    c.clear('#0d1333');
    ctx.fillStyle = '#141b45';
    ctx.fillRect(BX, BY, COLS * CS, ROWS * CS);
    ctx.strokeStyle = '#1b2357';
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(BX + x * CS, BY); ctx.lineTo(BX + x * CS, BY + ROWS * CS); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(BX, BY + y * CS); ctx.lineTo(BX + COLS * CS, BY + y * CS); ctx.stroke(); }
    board.forEach((row, r) => row.forEach((t, k) => {
      if (!t) return;
      if (flashRows.includes(r)) { ctx.fillStyle = '#fff'; ctx.fillRect(BX + k * CS, BY + r * CS, CS, CS); }
      else cell(BX + k * CS, BY + r * CS, t);
    }));
    if (cur) {
      const gy = ghostY();
      cur.m.forEach((row, r) => row.forEach((v, k) => {
        if (!v) return;
        if (gy + r >= 0) cell(BX + (cur.x + k) * CS, BY + (gy + r) * CS, cur.t, .22);
        if (cur.y + r >= 0) cell(BX + (cur.x + k) * CS, BY + (cur.y + r) * CS, cur.t);
      }));
    }
    const px = BX + COLS * CS + 16;
    U.text(ctx, 'NEXT', px, 30, 13, '#8f99c4', 'left');
    ctx.fillStyle = '#141b45';
    U.rr(ctx, px, 44, 112, 84, 10); ctx.fill();
    if (next) {
      const m = SH[next], s = 22, ox = px + 56 - m[0].length * s / 2, oy = 86 - m.length * s / 2 + (next === 'I' ? s / 2 : 0);
      m.forEach((row, r) => row.forEach((v, k) => {
        if (!v) return;
        ctx.fillStyle = COL[next];
        U.rr(ctx, ox + k * s + 1, oy + r * s + 1, s - 2, s - 2, 4); ctx.fill();
      }));
    }
    [['LEVEL', level], ['LINES', lines], ['SCORE', score]].forEach(([l, v], i) => {
      U.text(ctx, l, px, 160 + i * 62, 13, '#8f99c4', 'left');
      U.text(ctx, v, px, 184 + i * 62, 22, '#fff', 'left', 800);
    });
    if (!api.isTouch) {
      ['←→ move', '↑ rotate', '↓ soft drop', 'Space drop'].forEach((s, i) => U.text(ctx, s, px, 380 + i * 22, 12, '#5d6799', 'left', 600));
    } else {
      ['Tap: rotate', 'Drag: move', 'Flick ↓: drop'].forEach((s, i) => U.text(ctx, s, px, 380 + i * 22, 12, '#5d6799', 'left', 600));
    }
  }
});
