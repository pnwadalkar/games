// Checkers (American rules: forced captures, multi-jumps, kings) vs CPU or 2 players. Options: twoP, depth.
Hub.register('checkers', (api, o) => {
  const N = 8, CS = 62, TOP = 46, W = N * CS, H = N * CS + TOP;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  // + red (you, moving up), - black (CPU, moving down); |2| = king
  const b = U.grid(N, N, 0);
  for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if ((r + k) % 2 === 1) { if (r < 3) b[r][k] = -1; else if (r > 4) b[r][k] = 1; }
  let turn = 1, sel = null, path = [], done = false, quiet = 0, lastMove = null;
  api.turnOf = () => (turn > 0 ? 0 : 1);

  const inB = (r, k) => r >= 0 && k >= 0 && r < N && k < N;
  const dirsOf = v => Math.abs(v) === 2 ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : v > 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  function jumps(bd, r, k, v, pathSoFar, caps, out) {
    let ext = false;
    for (const [dr, dk] of dirsOf(v)) {
      const mr = r + dr, mk = k + dk, lr = r + 2 * dr, lk = k + 2 * dk;
      if (!inB(lr, lk) || bd[lr][lk] !== 0 || !bd[mr][mk] || Math.sign(bd[mr][mk]) === Math.sign(v)) continue;
      ext = true;
      const saved = bd[mr][mk];
      bd[mr][mk] = 0; bd[r][k] = 0;
      const crown = Math.abs(v) === 1 && (lr === 0 || lr === N - 1);
      bd[lr][lk] = crown ? v * 2 : v;
      const np = pathSoFar.concat([[lr, lk]]), nc = caps.concat([[mr, mk]]);
      if (crown) out.push({ path: np, caps: nc });
      else jumps(bd, lr, lk, v, np, nc, out);
      bd[lr][lk] = 0; bd[mr][mk] = saved; bd[r][k] = v;
    }
    if (!ext && caps.length) out.push({ path: pathSoFar, caps });
  }
  function allMoves(bd, side) {
    const caps = [], steps = [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = bd[r][k];
      if (!v || Math.sign(v) !== side) continue;
      jumps(bd, r, k, v, [[r, k]], [], caps);
      if (!caps.length) for (const [dr, dk] of dirsOf(v)) if (inB(r + dr, k + dk) && !bd[r + dr][k + dk]) steps.push({ path: [[r, k], [r + dr, k + dk]], caps: [] });
    }
    return caps.length ? caps : steps;
  }
  function apply(bd, m) {
    const [sr, sk] = m.path[0], [er, ek] = m.path[m.path.length - 1];
    let v = bd[sr][sk];
    bd[sr][sk] = 0;
    m.caps.forEach(([r, k]) => { bd[r][k] = 0; });
    if (Math.abs(v) === 1 && (er === 0 || er === N - 1)) v *= 2;
    bd[er][ek] = v;
  }
  function evalB(bd) {
    let s = 0;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = bd[r][k];
      if (!v) continue;
      const val = Math.abs(v) === 2 ? 175 : 100 + (v < 0 ? r : N - 1 - r) * 4;
      s += v < 0 ? val : -val;
    }
    return s;
  }
  function search(bd, depth, a, beta, side) {
    const ms = allMoves(bd, side);
    if (!ms.length) return { s: side < 0 ? -1e6 : 1e6 };
    if (!depth) return { s: evalB(bd) };
    let best = { s: side < 0 ? -1e9 : 1e9, m: ms[0] };
    for (const m of U.shuffle(ms.slice())) {
      const nb = bd.map(row => row.slice());
      apply(nb, m);
      const s = search(nb, depth - 1, a, beta, -side).s;
      if (side < 0 ? s > best.s : s < best.s) best = { s, m };
      if (side < 0) a = Math.max(a, s); else beta = Math.min(beta, s);
      if (a >= beta) break;
    }
    return best;
  }
  const count = side => b.flat().filter(v => Math.sign(v) === side).length;
  const name = side => o.twoP ? (side > 0 ? 'Red' : 'Black') : (side > 0 ? 'You' : 'CPU');
  function status() {
    api.status(`🔴 ${name(1)} ${count(1)} · ⚫ ${name(-1)} ${count(-1)}` + (done ? '' : ' · ' + name(turn) + (o.twoP || turn > 0 ? ' to move' : ' thinking…')));
  }
  function commit(m) {
    apply(b, m);
    lastMove = m;
    quiet = m.caps.length ? 0 : quiet + 1;
    api.sfx(m.caps.length ? 'pop' : 'move');
    sel = null; path = [];
    turn = -turn;
    const ms = allMoves(b, turn);
    if (!ms.length) {
      done = true; status();
      const winner = -turn;
      return api.end({ win: o.twoP || winner > 0, title: name(winner) + (o.twoP || winner < 0 ? ' wins!' : ' win!'), emoji: winner > 0 ? '🏆' : '🤖', delay: 800 });
    }
    if (quiet >= 80) { done = true; status(); return api.end({ win: false, title: 'Draw', msg: '40 moves without a capture', emoji: '🤝', sound: 'hit' }); }
    status();
    if (!o.twoP && turn < 0) api.after(450, () => commit(search(b, o.depth || 5, -1e9, 1e9, -1).m));
  }
  status();

  function legalForSel() {
    return allMoves(b, turn).filter(m => path.every(([r, k], i) => m.path[i] && m.path[i][0] === r && m.path[i][1] === k));
  }
  api.pointer(c, {
    down: (x, y) => {
      if (done || (!o.twoP && turn < 0)) return;
      const k = Math.floor(x / CS), r = Math.floor((y - TOP) / CS);
      if (!inB(r, k)) return;
      const v = b[r][k];
      if (v && Math.sign(v) === turn && path.length <= 1) {
        path = [[r, k]];
        if (!legalForSel().length) { path = []; sel = null; api.toast(allMoves(b, turn).some(m => m.caps.length) ? 'You must capture!' : 'That piece can\'t move'); return; }
        sel = [r, k]; api.sfx('click'); return;
      }
      if (!path.length) return;
      const cand = legalForSel().filter(m => m.path[path.length] && m.path[path.length][0] === r && m.path[path.length][1] === k);
      if (!cand.length) { api.sfx('bad'); return; }
      path.push([r, k]);
      const full = cand.find(m => m.path.length === path.length);
      if (full) commit(full);
      else api.sfx('pop');
    }
  });

  c.draw = draw;
  api.loop(() => {}, draw, true);
  function draw() {
    c.clear('#10163a');
    U.text(ctx, '🔴 ' + count(1), 14, TOP / 2, 18, '#fff', 'left', 800);
    U.text(ctx, count(-1) + ' ⚫', W - 14, TOP / 2, 18, '#fff', 'right', 800);
    if (!done) U.text(ctx, name(turn) + (o.twoP || turn > 0 ? ' to move' : ' thinking…'), W / 2, TOP / 2, 14, '#8f99c4');
    const targets = path.length ? legalForSel().map(m => m.path[path.length]).filter(Boolean) : [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const dark = (r + k) % 2 === 1;
      ctx.fillStyle = dark ? '#8a5a35' : '#f0d9b5';
      ctx.fillRect(k * CS, TOP + r * CS, CS, CS);
      if (lastMove && lastMove.path.some(([a, z]) => a === r && z === k)) { ctx.fillStyle = 'rgba(255,201,77,.25)'; ctx.fillRect(k * CS, TOP + r * CS, CS, CS); }
      if (path.some(([a, z]) => a === r && z === k)) { ctx.fillStyle = 'rgba(0,212,255,.35)'; ctx.fillRect(k * CS, TOP + r * CS, CS, CS); }
      if (targets.some(([a, z]) => a === r && z === k)) U.circle(ctx, k * CS + CS / 2, TOP + r * CS + CS / 2, 10, 'rgba(46,229,157,.85)');
      const v = b[r][k];
      if (!v) continue;
      const cx = k * CS + CS / 2, cy = TOP + r * CS + CS / 2;
      U.circle(ctx, cx, cy + 3, CS * .38, 'rgba(0,0,0,.35)');
      U.circle(ctx, cx, cy, CS * .38, v > 0 ? '#e63950' : '#22253a');
      ctx.strokeStyle = v > 0 ? '#ff8a9d' : '#4a4f70'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, CS * .27, 0, 7); ctx.stroke();
      if (Math.abs(v) === 2) U.text(ctx, '♛', cx, cy + 1, CS * .38, '#ffc94d');
    }
  }
});
