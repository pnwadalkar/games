// Word Search: drag across letters to find every hidden word (any of 8 directions). Options: n, count.
Hub.register('wordsearch', (api, o) => {
  const N = o.n || 10, COUNT = o.count || 8, CS = Math.floor(520 / N), GW = N * CS, LISTH = 130, W = GW, H = GW + LISTH;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const cat = U.pick(Object.keys(WORDS.cats));
  const g = U.grid(N, N, '');
  const DIRS = [[1, 0], [0, 1], [1, 1], [-1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1]];
  const placed = [];
  for (const w0 of U.shuffle(WORDS.cats[cat].filter(w => w.length <= N).slice())) {
    if (placed.length >= COUNT) break;
    const w = w0.toUpperCase();
    for (let tries = 0; tries < 200; tries++) {
      const [dx, dy] = U.pick(o.easy ? DIRS.slice(0, 3) : DIRS);
      const x = U.randi(0, N - 1), y = U.randi(0, N - 1), ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
      if (ex < 0 || ey < 0 || ex >= N || ey >= N) continue;
      let fits = true;
      for (let i = 0; i < w.length; i++) { const ch = g[y + dy * i][x + dx * i]; if (ch && ch !== w[i]) { fits = false; break; } }
      if (!fits) continue;
      for (let i = 0; i < w.length; i++) g[y + dy * i][x + dx * i] = w[i];
      placed.push({ w, x, y, ex, ey, found: false, col: `hsla(${placed.length * 47 % 360},80%,60%,.45)` });
      break;
    }
  }
  const AB = 'ABCDEFGHIJKLMNOPRSTUVWY';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x]) g[y][x] = U.pick([...AB]);
  api.status('Theme: ' + cat + ' · find ' + placed.length + ' words');
  let sel = null, secs = 0, done = false;
  api.every(1000, () => { if (!done) { secs++; api.setScore(secs); } });

  const cell = (x, y) => [U.clamp(Math.floor(x / CS), 0, N - 1), U.clamp(Math.floor(y / CS), 0, N - 1)];
  function snapEnd(sx, sy, x, y) {
    // constrain the selection to a straight line in one of the 8 directions
    let dx = x - sx, dy = y - sy;
    const len = Math.max(Math.abs(dx), Math.abs(dy));
    if (!len) return [sx, sy];
    const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    dx = Math.round(Math.cos(ang)); dy = Math.round(Math.sin(ang));
    let l = len;
    while (l > 0 && (sx + dx * l < 0 || sy + dy * l < 0 || sx + dx * l >= N || sy + dy * l >= N)) l--;
    return [sx + dx * l, sy + dy * l];
  }
  api.pointer(c, {
    down: (x, y) => { if (y < GW && !done) { const [a, b] = cell(x, y); sel = { sx: a, sy: b, ex: a, ey: b }; } },
    move: (x, y, e, isDown) => { if (sel && isDown) { const [a, b] = cell(x, y); [sel.ex, sel.ey] = snapEnd(sel.sx, sel.sy, a, b); } },
    up: () => {
      if (!sel) return;
      const m = placed.find(p => !p.found && ((p.x === sel.sx && p.y === sel.sy && p.ex === sel.ex && p.ey === sel.ey) || (p.x === sel.ex && p.y === sel.ey && p.ex === sel.sx && p.ey === sel.sy)));
      if (m) {
        m.found = true;
        api.sfx('coin');
        if (placed.every(p => p.found)) { done = true; api.end({ win: true, title: 'All words found!', score: secs, emoji: '🔍' }); }
      } else if (sel.sx !== sel.ex || sel.sy !== sel.ey) api.sfx('bad');
      sel = null;
    }
  });

  const line = (x1, y1, x2, y2, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = CS * .78; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 * CS + CS / 2, y1 * CS + CS / 2); ctx.lineTo(x2 * CS + CS / 2, y2 * CS + CS / 2); ctx.stroke();
  };
  api.loop(() => {}, () => {
    c.clear('#f4f5ff');
    placed.forEach(p => { if (p.found) line(p.x, p.y, p.ex, p.ey, p.col); });
    if (sel) line(sel.sx, sel.sy, sel.ex, sel.ey, 'rgba(124,92,255,.45)');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) U.text(ctx, g[y][x], x * CS + CS / 2, y * CS + CS / 2 + 1, CS * .5, '#1b2150', 'center', 700);
    ctx.fillStyle = '#10163a'; ctx.fillRect(0, GW, W, LISTH);
    const cols = 2, cw = W / cols;
    placed.forEach((p, i) => {
      const x = (i % cols) * cw + cw / 2, y = GW + 22 + Math.floor(i / cols) * 26;
      U.text(ctx, p.w, x, y, 16, p.found ? '#4a5384' : '#fff', 'center', 700);
      if (p.found) { ctx.fillStyle = '#4a5384'; ctx.fillRect(x - p.w.length * 6, y, p.w.length * 12, 2); }
    });
  }, true);
});
