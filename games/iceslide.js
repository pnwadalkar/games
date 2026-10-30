// Ice Slide: you slide until you hit a rock. Reach the flag within your move budget.
Hub.register('iceslide', (api) => {
  const N = 8, CS = 56, S = N * CS, W = S, H = S + 60;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('dpad');
  let level = 1, rocks, me, goal, budget, moves, t = 0, anim = null, trail = [];
  const DIRS = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };

  const slide = (rk, r, k, d) => { let nr = r, nk = k; for (;;) { const a = nr + d[0], b = nk + d[1]; if (a < 0 || b < 0 || a >= N || b >= N || rk[a][b]) break; nr = a; nk = b; } return [nr, nk]; };
  // BFS: smallest number of slides from start to the goal square (stopping exactly on it counts; passing over it also counts)
  function solve(rk, s, g) {
    const dist = U.grid(N, N, -1); dist[s[0]][s[1]] = 0; const q = [s];
    while (q.length) {
      const [r, k] = q.shift();
      for (const d of Object.values(DIRS)) {
        let a = r, b = k;
        for (;;) {
          const na = a + d[0], nb = b + d[1];
          if (na < 0 || nb < 0 || na >= N || nb >= N || rk[na][nb]) break;
          a = na; b = nb;
          if (na === g[0] && nb === g[1]) return dist[r][k] + 1;
        }
        if (dist[a][b] < 0) { dist[a][b] = dist[r][k] + 1; q.push([a, b]); }
      }
    }
    return -1;
  }
  function build() {
    for (let tries = 0; tries < 400; tries++) {
      const rk = U.grid(N, N, false), n = 12 + Math.min(level, 10);
      for (let i = 0; i < n; i++) rk[U.randi(0, N - 1)][U.randi(0, N - 1)] = true;
      const s = [U.randi(0, N - 1), U.randi(0, N - 1)], g = [U.randi(0, N - 1), U.randi(0, N - 1)];
      if (rk[s[0]][s[1]] || rk[g[0]][g[1]] || (s[0] === g[0] && s[1] === g[1])) continue;
      const need = solve(rk, s, g), want = 3 + Math.min(Math.floor(level / 2), 4);
      if (need >= want && need <= want + 3) { rocks = rk; me = { r: s[0], k: s[1] }; goal = g; budget = need + 2; moves = 0; trail = []; api.status('Level ' + level + ' · moves left ' + budget); return; }
    }
    rocks = U.grid(N, N, false); me = { r: 0, k: 0 }; goal = [N - 1, N - 1]; budget = 6; moves = 0;
  }
  build();

  function go(name) {
    if (anim || api.over) return;
    const d = DIRS[name];
    let a = me.r, b = me.k, hit = false;
    const path = [[a, b]];
    for (;;) {
      const na = a + d[0], nb = b + d[1];
      if (na < 0 || nb < 0 || na >= N || nb >= N || rocks[na][nb]) break;
      a = na; b = nb; path.push([a, b]);
      if (a === goal[0] && b === goal[1]) { hit = true; break; }
    }
    if (path.length < 2) { api.sfx('bad'); return; }
    anim = { path, i: 0, hit }; moves++; api.sfx('move');
  }
  api.onKey(k => { if (DIRS[k]) go(k); });
  api.onSwipe(go, api.stage);
  api.loop(dt => {
    t += dt;
    if (!anim) return;
    anim.i += dt * 14;
    const idx = Math.min(anim.path.length - 1, Math.floor(anim.i));
    me.r = anim.path[idx][0]; me.k = anim.path[idx][1];
    if (idx >= anim.path.length - 1) {
      const hit = anim.hit; anim = null;
      if (hit) { api.sfx('win'); level++; api.setScore(level - 1); api.toast('Level ' + level, 900); api.after(500, build); }
      else if (moves >= budget) api.end({ msg: 'Out of moves on level ' + level, emoji: '🧊' });
      else api.status('Level ' + level + ' · moves left ' + (budget - moves));
    }
  }, draw, true);

  function draw() {
    c.clear('#0d2238');
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      ctx.__flat = true; ctx.fillStyle = (r + k) % 2 ? '#bfe7ff' : '#d6f0ff'; ctx.fillRect(k * CS, r * CS, CS, CS);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(k * CS + 4, r * CS + 4, CS * .4, 3); ctx.__flat = false;
    }
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (rocks[r][k]) U.box(ctx, k * CS + 6, r * CS + 12, CS - 12, CS - 16, '#6b7a99', 10);
    U.text(ctx, '🚩', (goal[1] + .5) * CS, (goal[0] + .5) * CS - 2, CS * .62);
    U.blob(ctx, (me.k + .5) * CS + 3, (me.r + .5) * CS + CS * .32, CS * .3, CS * .09, .4);
    U.circle(ctx, (me.k + .5) * CS, (me.r + .5) * CS, CS * .34, '#ff7b3d');
    U.text(ctx, '🐧', (me.k + .5) * CS, (me.r + .5) * CS + 1, CS * .5);
    // budget pips
    for (let i = 0; i < budget; i++) U.circle(ctx, S / 2 - (budget - 1) * 12 + i * 24, S + 32, 8, i < budget - moves ? '#ffd23f' : '#33415f');
    U.text(ctx, 'Level ' + level, 12, S + 32, 15, '#9fb2ff', 'left');
  }
});
