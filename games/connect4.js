// Connect Four vs CPU (alpha-beta search) or 2 players. Options: depth, twoP.
Hub.register('connect4', (api, o) => {
  const COLS = 7, ROWS = 6, CS = 76, TOP = 70, W = COLS * CS, H = ROWS * CS + TOP;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const recKey = 'rec:' + api.meta.id;
  const rec = Hub.LS.get(recKey, { a: 0, b: 0, d: 0 });
  const b = U.grid(COLS, ROWS, 0); // 1 = player one (red), 2 = player two / CPU (yellow)
  let turn = 1, done = false, hoverCol = 3, drops = [], winCells = null;
  const showRec = () => api.status(o.twoP ? `Red ${rec.a} · Yellow ${rec.b} · Draws ${rec.d}` : `You ${rec.a} · CPU ${rec.b} · Draws ${rec.d}`);
  showRec();

  const rowFor = (bd, k) => { for (let r = ROWS - 1; r >= 0; r--) if (!bd[r][k]) return r; return -1; };
  function fourAt(bd, r, k) {
    const p = bd[r][k];
    for (const [dr, dk] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [[r, k]];
      for (const s of [1, -1]) {
        let rr = r + dr * s, kk = k + dk * s;
        while (rr >= 0 && rr < ROWS && kk >= 0 && kk < COLS && bd[rr][kk] === p) { cells.push([rr, kk]); rr += dr * s; kk += dk * s; }
      }
      if (cells.length >= 4) return cells;
    }
    return null;
  }
  function evalWin(w, p) {
    let s = 0;
    const cnt = w.filter(v => v === p).length, opp = w.filter(v => v === 3 - p).length, e = 4 - cnt - opp;
    if (cnt === 3 && e === 1) s += 6; else if (cnt === 2 && e === 2) s += 2;
    if (opp === 3 && e === 1) s -= 8;
    return s;
  }
  function score(bd) {
    let s = 0;
    for (let r = 0; r < ROWS; r++) if (bd[r][3] === 2) s += 3; else if (bd[r][3] === 1) s -= 3;
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) for (const [dr, dk] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const er = r + dr * 3, ek = k + dk * 3;
      if (er < 0 || er >= ROWS || ek < 0 || ek >= COLS) continue;
      const w = [0, 1, 2, 3].map(i => bd[r + dr * i][k + dk * i]);
      s += evalWin(w, 2);
    }
    return s;
  }
  const ORDER = [3, 2, 4, 1, 5, 0, 6];
  function search(bd, depth, a, beta, maxP) {
    let any = false;
    for (const k of ORDER) if (rowFor(bd, k) >= 0) { any = true; break; }
    if (!any) return { s: 0 };
    if (depth === 0) return { s: score(bd) };
    let best = { s: maxP ? -1e9 : 1e9, k: ORDER.find(k => rowFor(bd, k) >= 0) };
    for (const k of ORDER) {
      const r = rowFor(bd, k);
      if (r < 0) continue;
      bd[r][k] = maxP ? 2 : 1;
      let s;
      if (fourAt(bd, r, k)) s = maxP ? 100000 + depth : -100000 - depth;
      else s = search(bd, depth - 1, a, beta, !maxP).s;
      bd[r][k] = 0;
      if (maxP ? s > best.s : s < best.s) best = { s, k };
      if (maxP) a = Math.max(a, s); else beta = Math.min(beta, s);
      if (a >= beta) break;
    }
    return best;
  }
  function drop(k) {
    if (done || drops.length) return;
    const r = rowFor(b, k);
    if (r < 0) return;
    b[r][k] = turn;
    drops.push({ r, k, y: -1, p: turn });
    api.sfx('move');
    const four = fourAt(b, r, k);
    const full = b[0].every(Boolean);
    if (four || full) {
      done = true;
      winCells = four;
      const who = four ? turn : 0;
      if (who === 1) rec.a++; else if (who === 2) rec.b++; else rec.d++;
      Hub.LS.set(recKey, rec);
      showRec();
      if (o.twoP) api.end({ win: !!who, title: who ? (who === 1 ? 'Red' : 'Yellow') + ' wins!' : 'Draw!', emoji: who ? '🎉' : '🤝', delay: 1000 });
      else api.end({ win: who === 1, title: who === 1 ? 'You win!' : who === 2 ? 'CPU wins' : 'Draw!', emoji: who === 1 ? '🏆' : who === 2 ? '🤖' : '🤝', delay: 1000 });
      return;
    }
    turn = 3 - turn;
    if (!o.twoP && turn === 2) api.after(450, () => {
      const bd = b.map(row => row.slice());
      const res = search(bd, o.depth || 5, -1e9, 1e9, true);
      drops.length = 0;
      drop(res.k);
    });
  }
  const colAt = x => U.clamp(Math.floor(x / CS), 0, COLS - 1);
  api.pointer(c, {
    move: x => { hoverCol = colAt(x); },
    down: x => { hoverCol = colAt(x); if (o.twoP || turn === 1) drop(hoverCol); }
  });
  api.onKey(k => {
    if (k === 'left') hoverCol = Math.max(0, hoverCol - 1);
    if (k === 'right') hoverCol = Math.min(COLS - 1, hoverCol + 1);
    if ((k === 'a' || k === 'down') && (o.twoP || turn === 1)) drop(hoverCol);
  });

  api.loop(dt => {
    drops.forEach(d => { d.v = (d.v || 0) + 30 * dt; d.y += d.v * dt; });
    drops = drops.filter(d => d.y < d.r);
  }, () => {
    c.clear('#10163a');
    const col = p => p === 1 ? '#ff5c7a' : '#ffc94d';
    if (!done && (o.twoP || turn === 1)) U.circle(ctx, hoverCol * CS + CS / 2, TOP / 2, CS * .38, col(turn));
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
      const v = b[r][k], anim = drops.find(d => d.r === r && d.k === k);
      if (v && !anim) U.circle(ctx, k * CS + CS / 2, TOP + r * CS + CS / 2, CS * .4, col(v));
    }
    drops.forEach(d => U.circle(ctx, d.k * CS + CS / 2, TOP + d.y * CS + CS / 2, CS * .4, col(d.p)));
    // board with holes
    ctx.save();
    ctx.fillStyle = '#2f4bd6';
    ctx.beginPath();
    ctx.rect(0, TOP, W, ROWS * CS);
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) { ctx.moveTo(k * CS + CS / 2 + CS * .4, TOP + r * CS + CS / 2); ctx.arc(k * CS + CS / 2, TOP + r * CS + CS / 2, CS * .4, 0, Math.PI * 2, true); }
    ctx.fill('evenodd');
    ctx.restore();
    if (winCells && !drops.length) winCells.forEach(([r, k]) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(k * CS + CS / 2, TOP + r * CS + CS / 2, CS * .3, 0, 7); ctx.stroke(); });
  }, true);
});
