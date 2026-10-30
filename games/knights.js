// Knight's Tour: move the knight in L-shapes and visit every square exactly once.
Hub.register('knights', (api, o) => {
  const N = o.n || 5, CS = Math.floor(500 / N), S = CS * N, H = S + 70;
  const c = api.canvas(S, H);
  const ctx = c.ctx;
  const seen = U.grid(N, N, 0);
  let path = [], t0 = 0, started = false, done = false, t = 0;
  const MV = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const UNDO = { x: S / 2 - 70, y: S + 14, w: 140, h: 42 };
  api.status('Pick a starting square');

  const legal = (r, k) => MV.map(m => [r + m[0], k + m[1]]).filter(p => p[0] >= 0 && p[1] >= 0 && p[0] < N && p[1] < N && !seen[p[0]][p[1]]);
  function undo() {
    if (done || !path.length) return;
    const p = path.pop(); seen[p[0]][p[1]] = 0; api.sfx('click');
    if (!path.length) api.status('Pick a starting square');
  }
  api.onKey(k => { if (k === 'b') undo(); });
  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      if (U.inR(x, y, UNDO)) return undo();
      const k = Math.floor(x / CS), r = Math.floor(y / CS);
      if (r < 0 || k < 0 || r >= N || k >= N || seen[r][k]) return;
      if (path.length) { const [pr, pk] = path[path.length - 1]; if (!MV.some(m => pr + m[0] === r && pk + m[1] === k)) { api.sfx('bad'); return; } }
      if (!started) { started = true; t0 = performance.now(); }
      seen[r][k] = path.length + 1; path.push([r, k]); api.sfx('move');
      const nxt = legal(r, k).length;
      api.status(path.length + ' of ' + N * N + ' visited');
      if (path.length === N * N) { done = true; api.end({ win: true, title: 'Tour complete!', score: Math.round((performance.now() - t0) / 100) / 10, emoji: '♞' }); }
      else if (!nxt) api.status('Stuck! Undo a few moves.');
    }
  });
  api.loop(dt => { t += dt; if (started && !done) api.setScore(Math.round((performance.now() - t0) / 100) / 10); }, draw, true);

  function draw() {
    c.clear('#1c1530');
    const last = path[path.length - 1], hints = last ? legal(last[0], last[1]) : [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = k * CS, y = r * CS, v = seen[r][k];
      ctx.__flat = true; ctx.fillStyle = (r + k) % 2 ? '#8a6a4a' : '#e8d3a8'; ctx.fillRect(x, y, CS, CS); ctx.__flat = false;
      if (v) { U.box(ctx, x + 6, y + 10, CS - 12, CS - 14, '#7c5cff', 5); U.text(ctx, v, x + CS / 2 - 3, y + CS / 2 + 4, CS * .3, '#fff', 'center', 800); }
    }
    hints.forEach(p => { ctx.globalAlpha = .55 + Math.sin(t * 6) * .25; U.circle(ctx, p[1] * CS + CS / 2, p[0] * CS + CS / 2, CS * .16, '#2ee59d'); }); ctx.globalAlpha = 1;
    if (path.length > 1) {
      ctx.__flat = true; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      path.forEach((p, i) => (i ? ctx.lineTo(p[1] * CS + CS / 2, p[0] * CS + CS / 2) : ctx.moveTo(p[1] * CS + CS / 2, p[0] * CS + CS / 2))); ctx.stroke(); ctx.__flat = false;
    }
    if (last) { U.blob(ctx, last[1] * CS + CS / 2 + 3, last[0] * CS + CS * .85, CS * .3, CS * .08, .4); U.text(ctx, '♞', last[1] * CS + CS / 2, last[0] * CS + CS / 2 - 2, CS * .72, '#fff'); }
    U.btn(ctx, UNDO, '↶ Undo', '#5b6bd6', 16, !path.length);
  }
});
