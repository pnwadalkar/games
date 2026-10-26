// Collapse (SameGame): tap groups of 2+ matching blocks. Bigger groups score far more.
Hub.register('collapse', (api, o) => {
  const C = o.cols || 10, R = o.rows || 12, K = o.colors || 4, CS = 44, W = C * CS, H = R * CS;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const PAL = ['#ff5c7a', '#ffc94d', '#2ee59d', '#00d4ff', '#b06cff'];
  // cols[x] is a column from bottom to top
  let cols = Array.from({ length: C }, () => Array.from({ length: R }, () => U.randi(0, K - 1)));
  let score = 0, hover = null, fx = [];

  const get = (x, y) => (cols[x] && y < cols[x].length) ? cols[x][y] : null;
  function group(x, y) {
    const t = get(x, y);
    if (t == null) return [];
    const seen = new Set([x + ',' + y]), q = [[x, y]];
    for (let i = 0; i < q.length; i++) {
      const [a, b] = q[i];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = a + dx, ny = b + dy, key = nx + ',' + ny;
        if (ny >= 0 && !seen.has(key) && get(nx, ny) === t) { seen.add(key); q.push([nx, ny]); }
      });
    }
    return q;
  }
  function anyMoves() {
    for (let x = 0; x < cols.length; x++) for (let y = 0; y < cols[x].length; y++) {
      if (get(x + 1, y) === cols[x][y] || get(x, y + 1) === cols[x][y]) return true;
    }
    return false;
  }
  const cellAt = (px, py) => [Math.floor(px / CS), R - 1 - Math.floor(py / CS)];
  function tap(px, py) {
    if (api.over) return;
    const [x, y] = cellAt(px, py);
    const g = group(x, y);
    if (g.length < 2) { api.sfx('bad'); return; }
    const col = get(x, y);
    g.forEach(([a, b]) => { fx.push({ x: a * CS + CS / 2, y: (R - 1 - b) * CS + CS / 2, col: PAL[col], t: .35 }); cols[a][b] = null; });
    cols = cols.map(cl => cl.filter(v => v != null)).filter(cl => cl.length);
    score += (g.length - 2) ** 2 + g.length * 2;
    api.setScore(score);
    api.sfx(g.length >= 8 ? 'coin' : 'pop');
    hover = null;
    if (!cols.length) { score += 1000; api.end({ win: true, title: 'Board cleared!', msg: '+1000 bonus', score }); }
    else if (!anyMoves()) {
      const left = cols.reduce((s, cl) => s + cl.length, 0);
      api.end({ win: true, title: 'No more moves', emoji: '🧱', score, msg: left + ' blocks left' });
    }
  }
  api.pointer(c, {
    down: (x, y) => tap(x, y),
    move: (x, y, e) => { if (e.pointerType === 'mouse') { const [a, b] = cellAt(x, y); hover = group(a, b); if (hover.length < 2) hover = null; } }
  });

  api.loop(dt => { fx.forEach(f => { f.t -= dt; }); fx = fx.filter(f => f.t > 0); }, () => {
    c.clear('#10163a');
    const hs = new Set((hover || []).map(([a, b]) => a + ',' + b));
    cols.forEach((cl, x) => cl.forEach((v, y) => {
      const px = x * CS, py = (R - 1 - y) * CS;
      ctx.fillStyle = PAL[v];
      ctx.globalAlpha = hover && !hs.has(x + ',' + y) ? .55 : 1;
      U.rr(ctx, px + 2, py + 2, CS - 4, CS - 4, 9); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      U.rr(ctx, px + 6, py + 6, CS - 12, 8, 4); ctx.fill();
    }));
    ctx.globalAlpha = 1;
    fx.forEach(f => { const s = f.t / .35; ctx.globalAlpha = s; ctx.fillStyle = f.col; const z = (CS - 4) * s; ctx.fillRect(f.x - z / 2, f.y - z / 2, z, z); });
    ctx.globalAlpha = 1;
  }, true);
});
