// Dots and Boxes vs CPU or 2 players. Complete a box to score and move again. Options: n (boxes per side), twoP.
Hub.register('dots', (api, o) => {
  const N = o.n || 4, GAP = Math.floor(440 / N), PAD = 30, S = N * GAP + PAD * 2;
  const c = api.canvas(S, S + 40);
  const ctx = c.ctx;
  // h[r][k]: horizontal line at row r (0..N) between dots k..k+1; v[r][k]: vertical at col k (0..N) between rows r..r+1
  const h = U.grid(N, N + 1, 0), v = U.grid(N + 1, N, 0), owner = U.grid(N, N, 0);
  let turn = 1, sc = [0, 0, 0], done = false, last = null;
  api.turnOf = () => turn - 1;
  const COL = ['', '#00d4ff', '#ff5c7a'];
  const name = p => o.twoP ? 'Player ' + p : p === 1 ? 'You' : 'CPU';

  // lines are stored as the player number (1 or 2), so count the drawn ones instead of adding the numbers up
  const sides = (r, k) => (h[r][k] ? 1 : 0) + (h[r + 1][k] ? 1 : 0) + (v[r][k] ? 1 : 0) + (v[r][k + 1] ? 1 : 0);
  function boxesOf(type, r, k) {
    return type === 'h' ? [[r - 1, k], [r, k]].filter(([a]) => a >= 0 && a < N) : [[r, k - 1], [r, k]].filter(([, z]) => z >= 0 && z < N);
  }
  function allFree() {
    const out = [];
    for (let r = 0; r <= N; r++) for (let k = 0; k < N; k++) if (!h[r][k]) out.push(['h', r, k]);
    for (let r = 0; r < N; r++) for (let k = 0; k <= N; k++) if (!v[r][k]) out.push(['v', r, k]);
    return out;
  }
  function draw1(m) {
    const [type, r, k] = m;
    (type === 'h' ? h : v)[r][k] = turn;
    last = m;
    let made = 0;
    boxesOf(type, r, k).forEach(([a, z]) => { if (sides(a, z) === 4 && !owner[a][z]) { owner[a][z] = turn; made++; } });
    sc[turn] += made;
    api.sfx(made ? 'coin' : 'click');
    if (!o.twoP) api.setScore(sc[1]);
    if (sc[1] + sc[2] === N * N) {
      done = true;
      draw();
      const w = sc[1] > sc[2] ? 1 : sc[2] > sc[1] ? 2 : 0;
      return api.end({ win: o.twoP ? !!w : w === 1, title: w ? name(w) + (w === 1 && !o.twoP ? ' win!' : ' wins!') : 'Draw!', msg: sc[1] + ' – ' + sc[2], emoji: w === 1 ? '🏆' : w ? (o.twoP ? '🎉' : '🤖') : '🤝', delay: 600 });
    }
    if (!made) turn = 3 - turn;
    status();
    draw();
    if (!o.twoP && turn === 2) api.after(380, cpu);
  }
  function cpu() {
    const free = allFree();
    const gives = m => boxesOf(m[0], m[1], m[2]).some(([a, z]) => sides(a, z) === 2);
    const takes = m => boxesOf(m[0], m[1], m[2]).some(([a, z]) => sides(a, z) === 3);
    let m = free.find(takes);
    if (!m) { const safe = free.filter(x => !gives(x)); if (safe.length) m = U.pick(safe); }
    if (!m) {
      // all moves give boxes away: choose the one that gives the fewest
      const cost = x => {
        const H = h.map(r => r.slice()), V = v.map(r => r.slice());
        (x[0] === 'h' ? H : V)[x[1]][x[2]] = 1;
        let n = 0, changed = true;
        const sd = (r, k) => H[r][k] + H[r + 1][k] + V[r][k] + V[r][k + 1];
        while (changed) {
          changed = false;
          for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (sd(r, k) === 3) {
            if (!H[r][k]) H[r][k] = 1; else if (!H[r + 1][k]) H[r + 1][k] = 1; else if (!V[r][k]) V[r][k] = 1; else V[r][k + 1] = 1;
            n++; changed = true;
          }
        }
        return n;
      };
      m = free.map(x => [cost(x), x]).sort((a, b) => a[0] - b[0])[0][1];
    }
    draw1(m);
  }
  function status() { api.status(`${name(1)} ${sc[1]} · ${name(2)} ${sc[2]}` + (done ? '' : ' · ' + name(turn) + (turn === 1 || o.twoP ? ' to move' : ' thinking…'))); }
  status();

  api.pointer(c, {
    down: (x, y) => {
      if (done || (!o.twoP && turn === 2)) return;
      const gx = (x - PAD) / GAP, gy = (y - PAD) / GAP;
      const fx = gx - Math.floor(gx), fy = gy - Math.floor(gy);
      const dh = Math.min(fy, 1 - fy), dv = Math.min(fx, 1 - fx);
      let m = null;
      if (dh < dv && dh < .3) { const r = Math.round(gy), k = Math.floor(gx); if (r >= 0 && r <= N && k >= 0 && k < N && !h[r][k]) m = ['h', r, k]; }
      else if (dv < .3) { const k = Math.round(gx), r = Math.floor(gy); if (r >= 0 && r < N && k >= 0 && k <= N && !v[r][k]) m = ['v', r, k]; }
      if (m) draw1(m);
    }
  });

  c.draw = draw;
  function draw() {
    c.clear('#10163a');
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (owner[r][k]) {
      ctx.fillStyle = COL[owner[r][k]] + '44';
      ctx.fillRect(PAD + k * GAP + 4, PAD + r * GAP + 4, GAP - 8, GAP - 8);
      U.text(ctx, owner[r][k] === 1 ? (o.twoP ? 'P1' : 'You') : (o.twoP ? 'P2' : 'CPU'), PAD + k * GAP + GAP / 2, PAD + r * GAP + GAP / 2, GAP * .2, COL[owner[r][k]]);
    }
    ctx.lineCap = 'round';
    const seg = (x1, y1, x2, y2, p, isLast) => {
      ctx.strokeStyle = p ? COL[p] : '#232c63';
      ctx.lineWidth = p ? (isLast ? 9 : 7) : 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    const isL = (t, r, k) => last && last[0] === t && last[1] === r && last[2] === k;
    for (let r = 0; r <= N; r++) for (let k = 0; k < N; k++) seg(PAD + k * GAP, PAD + r * GAP, PAD + (k + 1) * GAP, PAD + r * GAP, h[r][k], isL('h', r, k));
    for (let r = 0; r < N; r++) for (let k = 0; k <= N; k++) seg(PAD + k * GAP, PAD + r * GAP, PAD + k * GAP, PAD + (r + 1) * GAP, v[r][k], isL('v', r, k));
    for (let r = 0; r <= N; r++) for (let k = 0; k <= N; k++) U.circle(ctx, PAD + k * GAP, PAD + r * GAP, 7, '#eef1ff');
    U.text(ctx, name(1) + ' ' + sc[1], PAD, S + 16, 18, COL[1], 'left', 800);
    U.text(ctx, sc[2] + ' ' + name(2), S - PAD, S + 16, 18, COL[2], 'right', 800);
  }
  draw();
});
