// Bubble Shooter: aim, bounce off walls, match 3+ of a color; loose bubbles drop.
Hub.register('bubble', (api) => {
  const W = 480, H = 680, R = 20, RH = R * Math.sqrt(3), TOP = 10, COLS = 12;
  const SX = W / 2, SY = H - 46, DEAD = SY - 60;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr+a');
  const PAL = ['#ff5c7a', '#ffc94d', '#2ee59d', '#00d4ff', '#b06cff', '#ff8a3d'];
  let nColors = 5, grid = [], shift = 0, shot = null, cur, next, aim = -Math.PI / 2, misses = 0, score = 0, falling = [], level = 1, aiming = false;

  const odd = r => (r + shift) % 2 === 1;
  const width = r => odd(r) ? COLS - 1 : COLS;
  const pos = (r, k) => ({ x: R + k * 2 * R + (odd(r) ? R : 0), y: TOP + R + r * RH });
  const get = (r, k) => (grid[r] && k >= 0 && k < width(r)) ? grid[r][k] : null;
  function neighbors(r, k) {
    const o = odd(r);
    const d = o ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
    return d.map(([dr, dk]) => [r + dr, k + dk]).filter(([a, b]) => a >= 0 && b >= 0 && b < width(a));
  }
  function ensureRow(r) { while (grid.length <= r) grid.push(Array(width(grid.length)).fill(null)); }
  function newRow() {
    shift = (shift + 1) % 2;
    grid.unshift(Array.from({ length: width(0) }, () => U.randi(0, nColors - 1)));
  }
  function setup() {
    grid = []; shift = 0;
    const rows = Math.min(5 + level, 9);
    for (let r = 0; r < rows; r++) { ensureRow(r); for (let k = 0; k < width(r); k++) grid[r][k] = U.randi(0, nColors - 1); }
    cur = pickColor(); next = pickColor();
  }
  function present() {
    const s = new Set();
    grid.forEach(row => row.forEach(v => { if (v != null) s.add(v); }));
    return [...s];
  }
  function pickColor() { const p = present(); return p.length ? U.pick(p) : U.randi(0, nColors - 1); }
  setup();

  function shoot() {
    if (shot || api.over) return;
    shot = { x: SX, y: SY, vx: Math.cos(aim) * 980, vy: Math.sin(aim) * 980, col: cur };
    cur = next; next = pickColor();
    api.sfx('shoot');
  }
  const setAim = (x, y) => { aim = Math.atan2(y - SY, x - SX); aim = U.clamp(aim, -Math.PI + .12, -.12); if (y > SY) aim = aim < -Math.PI / 2 ? -Math.PI + .12 : -.12; };
  api.pointer(c, {
    down: (x, y) => { aiming = true; setAim(x, y); },
    move: (x, y, e, isDown) => { if (isDown || e.pointerType === 'mouse') setAim(x, y); },
    up: () => { if (aiming) shoot(); aiming = false; }
  });
  api.onKey(k => {
    if (k === 'a' || k === 'up') shoot();
    if (k === 'b') { const t = cur; cur = next; next = t; }
  });

  function snap(x, y) {
    let best = null, bd = 1e9;
    const r0 = Math.max(0, Math.round((y - TOP - R) / RH));
    for (let r = Math.max(0, r0 - 1); r <= r0 + 1; r++) {
      for (let k = 0; k < (odd(r) ? COLS - 1 : COLS); k++) {
        if (get(r, k) != null) continue;
        const p = pos(r, k);
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        // must touch the ceiling or an existing bubble
        const supported = r === 0 || neighbors(r, k).some(([a, b]) => get(a, b) != null);
        if (supported && d < bd) { bd = d; best = [r, k]; }
      }
    }
    return best;
  }
  function land() {
    const cell = snap(shot.x, shot.y);
    const col = shot.col;
    shot = null;
    if (!cell) return;
    const [r, k] = cell;
    ensureRow(r);
    grid[r][k] = col;
    const seen = new Set([r + ',' + k]), group = [[r, k]];
    for (let i = 0; i < group.length; i++) {
      neighbors(group[i][0], group[i][1]).forEach(([a, b]) => {
        const key = a + ',' + b;
        if (!seen.has(key) && get(a, b) === col) { seen.add(key); group.push([a, b]); }
      });
    }
    if (group.length >= 3) {
      group.forEach(([a, b]) => { const p = pos(a, b); falling.push({ x: p.x, y: p.y, vx: U.rand(-60, 60), vy: U.rand(-200, 0), col: grid[a][b] }); grid[a][b] = null; });
      score += group.length * 10;
      // drop everything no longer attached to the ceiling
      const keep = new Set(), q = [];
      if (grid[0]) grid[0].forEach((v, b) => { if (v != null) { keep.add('0,' + b); q.push([0, b]); } });
      for (let i = 0; i < q.length; i++) neighbors(q[i][0], q[i][1]).forEach(([a, b]) => {
        const key = a + ',' + b;
        if (!keep.has(key) && get(a, b) != null) { keep.add(key); q.push([a, b]); }
      });
      let dropped = 0;
      grid.forEach((row, a) => row.forEach((v, b) => {
        if (v != null && !keep.has(a + ',' + b)) { const p = pos(a, b); falling.push({ x: p.x, y: p.y, vx: U.rand(-40, 40), vy: 0, col: v }); row[b] = null; dropped++; }
      }));
      score += dropped * 20;
      api.setScore(score);
      api.sfx(dropped ? 'coin' : 'pop');
    } else {
      misses++;
      api.sfx('hit');
      if (misses >= 6) { misses = 0; newRow(); }
    }
    while (grid.length && grid[grid.length - 1].every(v => v == null)) grid.pop();
    if (!present().length) {
      level++;
      score += 500;
      api.setScore(score);
      api.toast('Board cleared! Level ' + level);
      api.sfx('win');
      setup();
      return;
    }
    if (!present().includes(cur)) cur = pickColor();
    if (!present().includes(next)) next = pickColor();
    for (let a = 0; a < grid.length; a++) if (grid[a].some(v => v != null) && pos(a, 0).y + R > DEAD) return api.end({ msg: 'Level ' + level });
  }

  api.loop(dt => {
    if (api.keys.left) aim = Math.max(-Math.PI + .12, aim - 1.8 * dt);
    if (api.keys.right) aim = Math.min(-.12, aim + 1.8 * dt);
    if (shot) {
      const n = 4;
      for (let i = 0; i < n && shot; i++) {
        shot.x += shot.vx * dt / n;
        shot.y += shot.vy * dt / n;
        if (shot.x < R) { shot.x = R; shot.vx = Math.abs(shot.vx); }
        if (shot.x > W - R) { shot.x = W - R; shot.vx = -Math.abs(shot.vx); }
        if (shot.y <= TOP + R) { land(); break; }
        let hit = false;
        for (let r = 0; r < grid.length && !hit; r++) for (let k = 0; k < grid[r].length; k++) {
          if (grid[r][k] == null) continue;
          const p = pos(r, k);
          if ((p.x - shot.x) ** 2 + (p.y - shot.y) ** 2 < (2 * R * .88) ** 2) { hit = true; break; }
        }
        if (hit) land();
      }
    }
    falling.forEach(f => { f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; });
    falling = falling.filter(f => f.y < H + 40);
  }, draw);

  function bubble(x, y, col, r) {
    U.circle(ctx, x, y, r || R - 1, PAL[col]);
    U.circle(ctx, x - 6, y - 6, (r || R) * .3, 'rgba(255,255,255,.45)');
  }
  function draw() {
    c.clear('#121a42');
    ctx.fillStyle = 'rgba(255,92,122,.12)';
    ctx.fillRect(0, DEAD, W, 2);
    grid.forEach((row, r) => row.forEach((v, k) => { if (v != null) { const p = pos(r, k); bubble(p.x, p.y, v); } }));
    falling.forEach(f => bubble(f.x, f.y, f.col));
    // aim guide with one wall bounce
    ctx.setLineDash([4, 10]);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let x = SX, y = SY, vx = Math.cos(aim), vy = Math.sin(aim);
    ctx.moveTo(x, y);
    for (let s = 0, b = 0; s < 70 && y > TOP + R && b < 2; s++) {
      x += vx * 9; y += vy * 9;
      if (x < R || x > W - R) { vx = -vx; b++; x = U.clamp(x, R, W - R); }
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if (shot) bubble(shot.x, shot.y, shot.col);
    ctx.fillStyle = '#1b2459';
    ctx.fillRect(0, H - 90 + 30, W, 60);
    if (!shot) bubble(SX, SY, cur);
    bubble(SX - 80, SY + 6, next, 13);
    U.text(ctx, 'next', SX - 80, SY + 30, 11, '#8f99c4');
    U.text(ctx, '●'.repeat(6 - misses) + '○'.repeat(misses), W - 14, SY + 6, 12, '#8f99c4', 'right');
    U.text(ctx, 'Lv ' + level, 14, SY + 6, 14, '#8f99c4', 'left');
  }
});
