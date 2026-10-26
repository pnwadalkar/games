// Minesweeper with safe first click, chording, flags and long-press / flag mode for touch.
// Options: w, h, mines.
Hub.register('minesweeper', (api, o) => {
  let w = o.w || 9, h = o.h || 9;
  if (w > h && api.portrait()) [w, h] = [h, w];
  const MINES = o.mines || 10, CS = 32, TOP = 52, W = w * CS, H = h * CS + TOP;
  const c = api.canvas(Math.max(W, 288), H);
  const OX = (c.w - W) / 2;
  const ctx = c.ctx;
  const cells = U.grid(w, h, () => ({ mine: false, n: 0, open: false, flag: false }));
  let started = false, opened = 0, flags = 0, secs = 0, flagMode = false, done = false, boomAt = null;
  const NUMC = ['', '#3d7bff', '#2ea44f', '#ff4d4d', '#7a3dff', '#c0392b', '#14a3a3', '#222', '#777'];

  const each = (x, y, f) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if ((dx || dy) && a >= 0 && b >= 0 && a < w && b < h) f(a, b, cells[b][a]); } };
  function plant(sx, sy) {
    const spots = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(x - sx) > 1 || Math.abs(y - sy) > 1) spots.push([x, y]);
    U.shuffle(spots).slice(0, MINES).forEach(([x, y]) => { cells[y][x].mine = true; });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let n = 0; each(x, y, (a, b, q) => { if (q.mine) n++; }); cells[y][x].n = n; }
    started = true;
    api.every(1000, () => { if (!done) { secs++; draw(); } });
  }
  function open(x, y) {
    const q = cells[y][x];
    if (q.open || q.flag) return;
    if (!started) plant(x, y);
    if (q.mine) return lose(x, y);
    const stack = [[x, y]];
    while (stack.length) {
      const [a, b] = stack.pop(), s = cells[b][a];
      if (s.open || s.flag) continue;
      s.open = true; opened++;
      if (s.n === 0) each(a, b, (i, j, t) => { if (!t.open && !t.mine) stack.push([i, j]); });
    }
    api.sfx('click');
    if (opened === w * h - MINES) win();
  }
  function chord(x, y) {
    const q = cells[y][x];
    let f = 0;
    each(x, y, (a, b, t) => { if (t.flag) f++; });
    if (f === q.n) each(x, y, (a, b, t) => { if (!t.open && !t.flag && !done) open(a, b); });
  }
  function toggleFlag(x, y) {
    const q = cells[y][x];
    if (q.open || done) return;
    q.flag = !q.flag; flags += q.flag ? 1 : -1;
    api.sfx('flip');
  }
  function lose(x, y) {
    done = true; boomAt = [x, y];
    cells.forEach(r => r.forEach(q => { if (q.mine) q.open = true; }));
    api.sfx('boom');
    api.end({ msg: 'Boom! Try again.', sound: 'boom' });
  }
  function win() {
    done = true;
    cells.forEach(r => r.forEach(q => { if (q.mine) q.flag = true; }));
    api.end({ win: true, title: 'Cleared!', score: secs, emoji: '🚩' });
  }

  function act(x, y, flagIt) {
    if (done) return;
    const q = cells[y][x];
    if (q.open) chord(x, y);
    else if (flagIt) toggleFlag(x, y);
    else open(x, y);
    draw();
  }
  let press = null;
  api.pointer(c, {
    down: (px, py, e) => {
      if (py < TOP) {
        if (px > c.w / 2 - 40 && px < c.w / 2 + 40) { flagMode = !flagMode; api.sfx('click'); draw(); }
        return;
      }
      const x = Math.floor((px - OX) / CS), y = Math.floor((py - TOP) / CS);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      if (e.button === 2) { act(x, y, true); return; }
      press = { x, y, long: false };
      press.timer = setTimeout(() => { if (press) { press.long = true; act(x, y, !flagMode); if (navigator.vibrate) navigator.vibrate(25); } }, 380);
    },
    up: () => {
      if (!press) return;
      clearTimeout(press.timer);
      if (!press.long) act(press.x, press.y, flagMode);
      press = null;
    },
    move: (px, py) => {
      if (!press) return;
      const x = Math.floor((px - OX) / CS), y = Math.floor((py - TOP) / CS);
      if (x !== press.x || y !== press.y) { clearTimeout(press.timer); press = null; }
    }
  });
  api.cleanup(() => press && clearTimeout(press.timer));
  api.onKey((k, raw) => { if (raw === 'f' || raw === 'F') { flagMode = !flagMode; draw(); } });

  c.draw = draw;
  function draw() {
    c.clear('#141b45');
    U.text(ctx, '💣 ' + (MINES - flags), 12, TOP / 2, 18, '#fff', 'left');
    U.text(ctx, '⏱ ' + secs, c.w - 12, TOP / 2, 18, '#fff', 'right');
    ctx.fillStyle = flagMode ? '#ff5c7a' : '#26306b';
    U.rr(ctx, c.w / 2 - 40, 8, 80, TOP - 16, 10); ctx.fill();
    U.text(ctx, flagMode ? '🚩 Flag' : '⛏ Dig', c.w / 2, TOP / 2, 15, '#fff');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const q = cells[y][x], px = OX + x * CS, py = TOP + y * CS;
      if (q.open) {
        ctx.fillStyle = q.mine ? (boomAt && boomAt[0] === x && boomAt[1] === y ? '#ff5c7a' : '#cfd5f5') : '#dfe4ff';
        ctx.fillRect(px, py, CS, CS);
        ctx.strokeStyle = '#b8c0ea'; ctx.lineWidth = 1; ctx.strokeRect(px + .5, py + .5, CS - 1, CS - 1);
        if (q.mine) U.text(ctx, '💣', px + CS / 2, py + CS / 2 + 1, 18);
        else if (q.n) U.text(ctx, q.n, px + CS / 2, py + CS / 2 + 1, 19, NUMC[q.n], 'center', 900);
      } else {
        ctx.fillStyle = (x + y) % 2 ? '#5b6fd6' : '#6479e0';
        ctx.fillRect(px, py, CS, CS);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(px, py, CS, 3); ctx.fillRect(px, py, 3, CS);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px, py + CS - 3, CS, 3); ctx.fillRect(px + CS - 3, py, 3, CS);
        if (q.flag) U.text(ctx, '🚩', px + CS / 2, py + CS / 2 + 1, 17);
      }
    }
  }
  draw();
});
