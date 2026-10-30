// Battleship: find and sink the hidden fleet before the computer sinks yours.
Hub.register('battleship', (api, o) => {
  const N = 10, CS = 34, GX = 20, GY = 50, MS = 16, MY = 50 + N * CS + 56, W = 380, H = MY + N * MS + 24;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const FLEET = [5, 4, 3, 3, 2];
  const hard = !!o.hard;
  let mine, theirs, phase = 'setup', shotsMine = U.grid(N, N, 0), shotsTheirs = U.grid(N, N, 0), turn = 'me', msg = '', t = 0, queue = [], hits = [], splash = [], sunkMsg = 0;

  function randomFleet() {
    const g = U.grid(N, N, 0), ships = [];
    FLEET.forEach((len, id) => {
      for (let tries = 0; tries < 500; tries++) {
        const h = Math.random() < .5, r = U.randi(0, h ? N - 1 : N - len), k = U.randi(0, h ? N - len : N - 1);
        const cells = Array.from({ length: len }, (_, i) => [r + (h ? 0 : i), k + (h ? i : 0)]);
        if (cells.some(([a, b]) => g[a][b])) continue;
        cells.forEach(([a, b]) => { g[a][b] = id + 1; });
        ships.push({ id: id + 1, len, cells, hit: 0 });
        break;
      }
    });
    return { g, ships };
  }
  mine = randomFleet(); theirs = randomFleet();
  api.status('Arrange your fleet, then press Start');
  const BTN = { shuffle: { x: 20, y: MY - 6, w: 160, h: 44 }, start: { x: W - 180, y: MY - 6, w: 160, h: 44 } };

  const sunk = f => f.ships.every(s => s.hit >= s.len);
  function fire(f, shots, r, k) {
    shots[r][k] = f.g[r][k] ? 2 : 1;
    if (f.g[r][k]) { const s = f.ships.find(q => q.id === f.g[r][k]); s.hit++; return s.hit >= s.len ? { hit: true, sunk: s } : { hit: true }; }
    return { hit: false };
  }

  api.pointer(c, {
    down: (x, y) => {
      if (api.over) return;
      if (phase === 'setup') {
        if (U.inR(x, y, BTN.shuffle)) { mine = randomFleet(); api.sfx('click'); }
        else if (U.inR(x, y, BTN.start)) { phase = 'play'; api.status('Your turn — tap the top grid to fire'); api.sfx('coin'); }
        return;
      }
      if (turn !== 'me') return;
      const k = Math.floor((x - GX) / CS), r = Math.floor((y - GY) / CS);
      if (r < 0 || k < 0 || r >= N || k >= N || shotsMine[r][k]) return;
      const res = fire(theirs, shotsMine, r, k);
      splash.push({ x: GX + k * CS + CS / 2, y: GY + r * CS + CS / 2, t: .5, hit: res.hit });
      api.sfx(res.hit ? 'boom' : 'pop');
      if (res.sunk) { api.toast('You sank their ' + res.sunk.len + '-ship!', 1200); }
      if (sunk(theirs)) { api.end({ win: true, title: 'Victory!', msg: 'You sank the whole fleet.', emoji: '🚢' }); return; }
      if (res.hit) { api.status('Hit! Fire again'); return; }
      turn = 'cpu'; api.status('Enemy is aiming…'); api.after(700, cpuTurn);
    }
  });

  function cpuPick() {
    // finish off a ship once something was hit; otherwise search on a checkerboard pattern
    while (queue.length) { const [r, k] = queue.shift(); if (!shotsTheirs[r][k]) return [r, k]; }
    const all = [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (!shotsTheirs[r][k] && (!hard || (r + k) % 2 === 0)) all.push([r, k]);
    if (!all.length) for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (!shotsTheirs[r][k]) all.push([r, k]);
    return U.pick(all);
  }
  function cpuTurn() {
    if (api.over) return;
    const [r, k] = cpuPick();
    const res = fire(mine, shotsTheirs, r, k);
    splash.push({ x: GX + k * MS + MS / 2, y: MY + r * MS + MS / 2, t: .5, hit: res.hit, small: true });
    api.sfx(res.hit ? 'boom' : 'pop');
    if (res.hit) {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dk]) => { const a = r + dr, b = k + dk; if (a >= 0 && b >= 0 && a < N && b < N && !shotsTheirs[a][b]) queue.push([a, b]); });
      if (res.sunk) queue = [];
      if (sunk(mine)) { api.end({ title: 'Defeat', msg: 'Your fleet was sunk.', emoji: '💥' }); return; }
      api.after(700, cpuTurn);
    } else { turn = 'me'; api.status('Your turn — tap the top grid to fire'); }
  }

  api.loop(dt => { t += dt; splash.forEach(s => { s.t -= dt; }); splash = splash.filter(s => s.t > 0); }, draw, true);

  function drawGrid(ox, oy, cs, shots, fleet, showShips) {
    ctx.fillStyle = '#0d3b66'; U.rr(ctx, ox - 6, oy - 6, N * cs + 12, N * cs + 12, 10); ctx.fill();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = ox + k * cs, y = oy + r * cs;
      ctx.__flat = true; ctx.fillStyle = (r + k) % 2 ? '#14508a' : '#1a5f9e'; ctx.fillRect(x, y, cs, cs); ctx.__flat = false;
    }
    if (showShips) fleet.ships.forEach(s => {
      const rs = s.cells.map(q => q[0]), ks = s.cells.map(q => q[1]);
      const x = ox + Math.min(...ks) * cs + 2, y = oy + Math.min(...rs) * cs + 2, w = (Math.max(...ks) - Math.min(...ks) + 1) * cs - 4, h = (Math.max(...rs) - Math.min(...rs) + 1) * cs - 4;
      U.box(ctx, x, y + 3, w - 3, h - 3, '#9aa6c4', cs * .22);
    });
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = shots[r][k], x = ox + k * cs + cs / 2, y = oy + r * cs + cs / 2;
      if (v === 1) U.circle(ctx, x, y, cs * .16, '#e8f3ff');
      else if (v === 2) { U.circle(ctx, x, y, cs * .32, '#ff4d2e'); U.circle(ctx, x, y, cs * .15, '#ffd23f'); }
    }
    // revealed sunk ships on the enemy grid
    if (!showShips) fleet.ships.forEach(s => { if (s.hit >= s.len) s.cells.forEach(([r, k]) => { ctx.fillStyle = 'rgba(40,40,60,.55)'; ctx.fillRect(ox + k * cs + 2, oy + r * cs + 2, cs - 4, cs - 4); U.circle(ctx, ox + k * cs + cs / 2, oy + r * cs + cs / 2, cs * .28, '#ff4d2e'); }); });
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07203a'); g.addColorStop(1, '#0a1a2c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    U.text(ctx, phase === 'setup' ? 'Your fleet' : 'Enemy waters', W / 2, 26, 18, '#bfe0ff', 'center', 800);
    if (phase === 'setup') {
      drawGrid(GX, GY, CS, shotsTheirs, mine, true);
      U.btn(ctx, BTN.shuffle, '🔀 Shuffle', '#5b6bd6', 17); U.btn(ctx, BTN.start, '▶ Start', '#2ea84a', 17);
      U.text(ctx, 'Ships are hidden from the computer', W / 2, MY + 62, 13, '#7fa3d6');
      return;
    }
    drawGrid(GX, GY, CS, shotsMine, theirs, false);
    U.text(ctx, 'Your fleet', W / 2, MY - 20, 14, '#7fa3d6', 'center', 700);
    drawGrid(GX, MY, MS, shotsTheirs, mine, true);
    splash.forEach(s => { ctx.strokeStyle = s.hit ? '#ffd23f' : '#e8f3ff'; ctx.globalAlpha = s.t * 2; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, (s.small ? 10 : 22) * (1.6 - s.t), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; });
    if (turn === 'cpu') U.text(ctx, 'Enemy is aiming…', W / 2, 42, 12, '#ff9aa8');
  }
});
