// Word Hunt: drag across touching letters (any direction, even diagonals) to spell words. Ninety seconds.
Hub.register('wordhunt', (api, o) => {
  const N = o.n || 4, S = 440, CS = S / N, W = S, H = S + 130, TIME = 90;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const DICT = new Set(WORDS.five.concat(WORDS.all).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length >= 3));
  const LET = 'eeeeeeeeeeeeaaaaaaaaaiiiiiiiiioooooooonnnnnnrrrrrrttttttllllssssuuuuddddgggbbccmmppffhhvvwwyykjxqz';
  let grid, possible, found = [], score = 0, path = [], cur = '', t0 = performance.now(), started = false, flash = null, t = 0, left = TIME;

  function neighbours(i) { const r = Math.floor(i / N), k = i % N, out = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const rr = r + a, kk = k + b; if (rr >= 0 && kk >= 0 && rr < N && kk < N) out.push(rr * N + kk); } return out; }
  function plant() {
    // lay a few real words along random paths, then fill the rest with common letters
    const g = Array(N * N).fill('');
    const words = U.shuffle([...DICT].filter(w => w.length >= 4 && w.length <= N + 2));
    let placed = 0;
    for (const w of words) {
      if (placed >= 4) break;
      for (let tries = 0; tries < 20; tries++) {
        const p = [U.randi(0, N * N - 1)];
        if (g[p[0]] && g[p[0]] !== w[0]) continue;
        let ok = true;
        for (let i = 1; i < w.length; i++) {
          const opts = neighbours(p[p.length - 1]).filter(q => !p.includes(q) && (!g[q] || g[q] === w[i]));
          if (!opts.length) { ok = false; break; }
          p.push(U.pick(opts));
        }
        if (!ok) continue;
        p.forEach((q, i) => { g[q] = w[i]; }); placed++; break;
      }
    }
    return g.map(ch => ch || U.pick(LET.split('')));
  }
  function findAll(g) {
    const res = new Set();
    const prefixes = new Set(); DICT.forEach(w => { for (let i = 1; i <= w.length; i++) prefixes.add(w.slice(0, i)); });
    const dfs = (i, used, s) => {
      s += g[i];
      if (!prefixes.has(s)) return;
      if (DICT.has(s)) res.add(s);
      neighbours(i).forEach(q => { if (!used.includes(q)) dfs(q, used.concat(q), s); });
    };
    for (let i = 0; i < N * N; i++) dfs(i, [i], '');
    return res;
  }
  grid = plant(); possible = findAll(grid);
  api.status(possible.size + ' words hidden in this board');

  const pos = (x, y) => { const k = Math.floor(x / CS), r = Math.floor(y / CS); if (k < 0 || r < 0 || k >= N || r >= N) return -1; const cx = (k + .5) * CS, cy = (r + .5) * CS; return Math.hypot(x - cx, y - cy) < CS * .42 ? r * N + k : -1; };
  const word = () => path.map(i => grid[i]).join('');
  function add(i) {
    if (i < 0 || path.includes(i)) { if (path.length > 1 && i === path[path.length - 2]) path.pop(); return; }
    if (path.length && !neighbours(path[path.length - 1]).includes(i)) return;
    path.push(i); if (!started) { started = true; t0 = performance.now(); } api.tone(380 + path.length * 55, .05, 'triangle', .04);
  }
  api.pointer(c, {
    down: (x, y) => { path = []; add(pos(x, y)); },
    move: (x, y, e, down) => { if (down) add(pos(x, y)); },
    up: () => {
      const w = word();
      if (w.length >= 3) {
        if (found.includes(w)) flash = { t: .6, ok: false, m: 'Already found' };
        else if (possible.has(w)) { found.push(w); const pts = [0, 0, 0, 1, 2, 4, 7, 11][Math.min(w.length, 7)]; score += pts; api.setScore(score); flash = { t: .8, ok: true, m: w.toUpperCase() + ' +' + pts }; api.sfx('coin'); }
        else { flash = { t: .6, ok: false, m: 'Not in our word list' }; api.sfx('bad'); }
      }
      path = [];
    }
  });
  api.loop(dt => {
    t += dt; if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; }
    if (started) { left = Math.max(0, TIME - (performance.now() - t0) / 1000); if (left <= 0 && !api.over) api.end({ win: true, title: 'Time!', msg: found.length + ' of ' + possible.size + ' words found', score, emoji: '🔤' }); }
  }, draw, true);

  function draw() {
    c.clear('#14122e');
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N), k = i % N, on = path.includes(i);
      U.box(ctx, k * CS + 6, r * CS + 10, CS - 12, CS - 14, on ? '#ffd23f' : '#f2e2b8', 9);
      U.text(ctx, grid[i].toUpperCase(), k * CS + CS / 2, r * CS + CS / 2 + 2, CS * .46, '#3a2a14', 'center', 900);
    }
    if (path.length > 1) { ctx.__flat = true; ctx.strokeStyle = 'rgba(255,92,122,.75)'; ctx.lineWidth = 8; ctx.lineJoin = ctx.lineCap = 'round'; ctx.beginPath(); path.forEach((i, n) => { const x = (i % N + .5) * CS, y = (Math.floor(i / N) + .5) * CS; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.__flat = false; }
    const w = word();
    U.text(ctx, w ? w.toUpperCase() : flash ? flash.m : 'Drag across letters', W / 2, S + 24, 26, w ? '#fff' : flash ? (flash.ok ? '#2ee59d' : '#ff8a9a') : '#6b74a0', 'center', 900);
    U.text(ctx, started ? Math.ceil(left) + 's' : TIME + 's', 14, S + 62, 18, left < 10 ? '#ff5c7a' : '#9fb2ff', 'left', 900);
    U.text(ctx, found.length + ' / ' + possible.size + ' words', W - 14, S + 62, 15, '#9fb2ff', 'right', 800);
    U.text(ctx, found.slice(-9).reverse().join(' · '), W / 2, S + 100, 13, '#8f99c4');
  }
});
