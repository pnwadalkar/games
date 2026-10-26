// 2048: slide tiles, merge equal numbers. Options: n (board size).
Hub.register('g2048', (api, o) => {
  const N = o.n || 4, GAP = 12, CELL = Math.round((480 - GAP * (N + 1)) / N), S = CELL * N + GAP * (N + 1);
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  let tiles = [], score = 0, won = false, anim = 0, nextId = 1;
  const COLORS = {
    2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'],
    32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'], 128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'],
    512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'], 2048: ['#edc22e', '#fff']
  };
  const at = (r, k) => tiles.find(t => t.r === r && t.c === k && !t.dead);

  function addTile() {
    const free = [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (!at(r, k)) free.push([r, k]);
    if (!free.length) return;
    const [r, k] = U.pick(free);
    tiles.push({ id: nextId++, v: Math.random() < .9 ? 2 : 4, r, c: k, pr: r, pc: k, born: 1 });
  }
  addTile(); addTile();

  function move(dir) {
    if (api.over) return;
    tiles = tiles.filter(t => !t.dead);
    tiles.forEach(t => { t.pr = t.r; t.pc = t.c; t.born = 0; t.pop = 0; });
    const dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0, dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    let moved = false, gained = 0;
    for (let line = 0; line < N; line++) {
      const cells = [];
      for (let i = 0; i < N; i++) {
        const idx = (dr + dc > 0) ? N - 1 - i : i;
        cells.push(dr ? [idx, line] : [line, idx]);
      }
      const row = cells.map(([r, k]) => at(r, k)).filter(Boolean);
      let pos = 0, last = null;
      row.forEach(t => {
        if (last && last.v === t.v && !last.merged) {
          t.r = last.r; t.c = last.c; t.dead = true;
          last.v *= 2; last.merged = true; last.pop = 1;
          gained += last.v;
          moved = true;
          if (last.v === 2048 && !won) { won = true; api.after(300, () => { api.toast('2048! Keep going for a bigger tile', 2200); api.sfx('win'); }); }
          last = null;
        } else {
          const [r, k] = cells[pos++];
          if (t.r !== r || t.c !== k) moved = true;
          t.r = r; t.c = k;
          last = t;
        }
      });
    }
    tiles.forEach(t => { t.merged = false; });
    if (!moved) return;
    api.sfx(gained ? 'pop' : 'move');
    score += gained;
    api.setScore(score);
    anim = 1;
    addTile();
    if (!canMove()) api.end({ msg: 'Biggest tile: ' + Math.max(...tiles.filter(t => !t.dead).map(t => t.v)) });
  }
  function canMove() {
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const t = at(r, k);
      if (!t) return true;
      const rt = at(r, k + 1), dn = at(r + 1, k);
      if ((rt && rt.v === t.v) || (dn && dn.v === t.v)) return true;
    }
    return false;
  }
  api.onKey(k => { if (['left', 'right', 'up', 'down'].includes(k)) move(k); });
  api.onSwipe(move);

  const xy = (r, k) => [GAP + k * (CELL + GAP), GAP + r * (CELL + GAP)];
  api.loop(dt => { anim = Math.max(0, anim - dt / .12); }, draw, true);

  function draw() {
    ctx.fillStyle = '#3d3a5c';
    U.rr(ctx, 0, 0, S, S, 14); ctx.fill();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const [x, y] = xy(r, k);
      ctx.fillStyle = '#4e4a72';
      U.rr(ctx, x, y, CELL, CELL, 8); ctx.fill();
    }
    const t1 = 1 - anim;
    const order = tiles.slice().sort((a, b) => (a.dead ? 0 : 1) - (b.dead ? 0 : 1));
    order.forEach(t => {
      if (t.dead && anim <= 0) return;
      if (t.born && anim > 0) return;
      const [x0, y0] = xy(t.pr, t.pc), [x1, y1] = xy(t.r, t.c);
      const x = U.lerp(x0, x1, t1), y = U.lerp(y0, y1, t1);
      let s = 1;
      if (t.pop && anim <= 0) s = 1;
      else if (t.pop) s = 1 + .12 * Math.sin(t1 * Math.PI);
      const v = t.dead ? t.v : (t.pop && anim > 0 ? t.v / 2 : t.v);
      const [bg, fg] = COLORS[v] || ['#3c3a32', '#fff'];
      ctx.save();
      ctx.translate(x + CELL / 2, y + CELL / 2);
      ctx.scale(s, s);
      ctx.fillStyle = bg;
      U.rr(ctx, -CELL / 2, -CELL / 2, CELL, CELL, 8); ctx.fill();
      const digits = String(v).length;
      U.text(ctx, v, 0, 2, CELL * (digits < 3 ? .45 : digits < 4 ? .36 : digits < 5 ? .29 : .23), fg, 'center', 800);
      ctx.restore();
    });
  }
});
