// Pac-Maze: eat every dot, dodge the ghosts, and grab a power pellet to turn the tables.
Hub.register('pacmaze', (api) => {
  const MAP = [
    '###################',
    '#........#........#',
    '#o##.###.#.###.##o#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.### # ###.####',
    '   #.#       #.#   ',
    '####.# ##-## #.####',
    '    .  #   #  .    ',
    '####.# ##### #.####',
    '   #.#       #.#   ',
    '####.# ##### #.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#o.#.....P.....#.o#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#.................#',
    '###################'
  ];
  const COLS = 19, ROWS = MAP.length, T = 21, W = COLS * T, H = ROWS * T + 30, OY = 30;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('dpad');
  const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const wall = (x, y) => y < 0 || y >= ROWS || (x >= 0 && x < COLS && (MAP[y][x] === '#' || MAP[y][x] === '-'));
  const wrapX = x => (x + COLS) % COLS;
  const gateOk = (x, y, ghost) => MAP[y] && MAP[y][x] === '-' ? ghost : true;
  let grid, dots, level = 1, lives = 3, score = 0, power = 0, pac, ghosts, want = 'left', tick = 0, msg = 0;
  const GC = ['#ff4d6d', '#ffb86b', '#2fe5ff', '#ff8cf0'];

  function init(keepScore) {
    grid = MAP.map(r => r.split(''));
    dots = 0;
    grid.forEach(r => r.forEach(ch => { if (ch === '.' || ch === 'o') dots++; }));
    spawn();
    if (!keepScore) { score = 0; level = 1; lives = 3; }
  }
  function spawn() {
    const px = 9, py = 15;
    pac = { tx: px, ty: py, p: 0, dir: 'left', moving: false, mouth: 0 };
    want = 'left';
    ghosts = GC.map((col, i) => ({ tx: 8 + i % 3, ty: 9, p: 0, dir: 'up', col, eaten: false, home: 2 + i * 3 }));
    power = 0;
  }
  init();

  api.onKey(k => { if (DIRS[k]) want = k; });
  api.onSwipe(d => { want = d; });

  // Entities live on tiles: (tx, ty) is the tile they are leaving, p (0..1) is progress towards the next tile.
  const OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const px = e => (e.tx + DIRS[e.dir][0] * e.p) * T + T / 2, py = e => (e.ty + DIRS[e.dir][1] * e.p) * T + T / 2;
  function advance(e, dt, speed, choose, ghost) {
    let left = speed * dt / T;
    for (let guard = 0; left > 0 && guard < 6; guard++) {
      if (e.p === 0) {
        const nd = choose(e.tx, e.ty);
        if (nd) e.dir = nd;
        const [vx, vy] = DIRS[e.dir];
        if (wall(e.tx + vx, e.ty + vy) || !gateOk(e.tx + vx, e.ty + vy, ghost)) { e.moving = false; return; }
        e.moving = true;
      }
      const step = Math.min(left, 1 - e.p);
      e.p += step; left -= step;
      if (e.p >= .9999) {
        e.p = 0; e.tx += DIRS[e.dir][0]; e.ty += DIRS[e.dir][1];
        if (e.tx < 0) e.tx = COLS - 1; else if (e.tx >= COLS) e.tx = 0;
      }
    }
  }

  function ghostChoose(g) {
    return (cx, cy) => {
      const opts = Object.keys(DIRS).filter(d => {
        const [vx, vy] = DIRS[d], opp = DIRS[g.dir];
        if (vx === -opp[0] && vy === -opp[1]) return false;
        return !wall(cx + vx, cy + vy) && gateOk(cx + vx, cy + vy, true);
      });
      if (!opts.length) return OPP[g.dir];
      const tx = Math.floor(pac.x / T), ty = Math.floor(pac.y / T);
      const scared = power > 0 && !g.eaten;
      if (g.eaten) { const hx = 9, hy = 9; return opts.sort((a, b) => dd(a, cx, cy, hx, hy) - dd(b, cx, cy, hx, hy))[0]; }
      if (Math.random() < (scared ? .5 : .22)) return U.pick(opts);
      return opts.sort((a, b) => (dd(a, cx, cy, tx, ty) - dd(b, cx, cy, tx, ty)) * (scared ? -1 : 1))[0];
    };
  }
  const dd = (d, cx, cy, tx, ty) => Math.hypot(cx + DIRS[d][0] - tx, cy + DIRS[d][1] - ty);

  api.loop(dt => {
    tick += dt;
    const sp = 84 + level * 4;
    // a reversal is allowed mid-corridor
    if (pac.p > 0 && want === OPP[pac.dir]) { pac.tx += DIRS[pac.dir][0]; pac.ty += DIRS[pac.dir][1]; pac.p = 1 - pac.p; pac.dir = want; }
    advance(pac, dt, sp, (cx, cy) => (!wall(cx + DIRS[want][0], cy + DIRS[want][1]) ? want : null), false);
    pac.mouth += dt * 12;
    const ch = grid[pac.ty] && grid[pac.ty][pac.tx];
    if ((ch === '.' || ch === 'o') && pac.p < .5) {
      grid[pac.ty][pac.tx] = ' '; dots--; score += ch === 'o' ? 50 : 10; api.setScore(score);
      if (ch === 'o') { power = 7; api.sfx('coin'); } else if (dots % 2) api.sfx('click');
      if (dots <= 0) { level++; api.sfx('win'); api.toast('Level ' + level, 900); init(true); return; }
    }
    power = Math.max(0, power - dt);
    ghosts.forEach(g => {
      if (g.home > 0) { g.home -= dt; return; }
      advance(g, dt, g.eaten ? 170 : power > 0 ? 55 : 68 + level * 3, ghostChoose(g), true);
      if (g.eaten && g.tx === 9 && g.ty === 9) g.eaten = false;
      if (U.dist(px(g), py(g), px(pac), py(pac)) < T * .7 && !g.eaten) {
        if (power > 0) { g.eaten = true; score += 200; api.setScore(score); api.sfx('coin'); }
        else {
          lives--; api.sfx('die');
          if (lives <= 0) return api.end({ msg: 'Level ' + level, emoji: '👻' });
          spawn();
        }
      }
    });
  }, draw);

  function draw() {
    ctx.fillStyle = '#05061a'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(0, OY);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const ch = grid[y][x];
      if (ch === '#') U.box(ctx, x * T + 1, y * T + 3, T - 2, T - 3, '#2b4ad9', 5);
      else if (ch === '-') { ctx.fillStyle = '#ff8cf0'; ctx.fillRect(x * T, y * T + T / 2 - 2, T, 4); }
      else if (ch === '.') U.circle(ctx, x * T + T / 2, y * T + T / 2, 2.4, '#ffe9b0');
      else if (ch === 'o') U.circle(ctx, x * T + T / 2, y * T + T / 2, 6 + Math.sin(tick * 8) * 1.2, '#fff6c9');
    }
    ghosts.forEach(g => {
      g.x = px(g); g.y = py(g) + (g.home > 0 ? Math.sin(tick * 6) * 2 : 0);
      const scared = power > 0 && !g.eaten, flash = scared && power < 2 && Math.floor(tick * 6) % 2;
      U.blob(ctx, g.x, g.y + 9, 9, 3, .4);
      if (g.eaten) { U.text(ctx, '👀', g.x, g.y, 16); return; }
      const col = scared ? (flash ? '#fff' : '#3b5bff') : g.col;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(g.x, g.y - 1, 9, Math.PI, 0); ctx.lineTo(g.x + 9, g.y + 9);
      for (let i = 0; i < 3; i++) ctx.lineTo(g.x + 9 - (i + 1) * 6, g.y + 9 - (i % 2 ? 0 : 3));
      ctx.closePath(); ctx.fill();
      U.circle(ctx, g.x - 3.5, g.y - 3, 2.6, '#fff'); U.circle(ctx, g.x + 3.5, g.y - 3, 2.6, '#fff');
      U.circle(ctx, g.x - 3.5 + DIRS[g.dir][0], g.y - 3 + DIRS[g.dir][1], 1.2, '#111'); U.circle(ctx, g.x + 3.5 + DIRS[g.dir][0], g.y - 3 + DIRS[g.dir][1], 1.2, '#111');
    });
    pac.x = px(pac); pac.y = py(pac);
    const m = Math.abs(Math.sin(pac.mouth)) * .6, rot = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[pac.dir];
    U.blob(ctx, pac.x, pac.y + 9, 9, 3, .4);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(pac.x, pac.y); ctx.arc(pac.x, pac.y, 10, rot + m, rot + Math.PI * 2 - m); ctx.closePath(); ctx.fill();
    ctx.restore();
    U.text(ctx, 'Level ' + level, 10, 14, 15, '#9fb2ff', 'left');
    U.text(ctx, '●'.repeat(Math.max(0, lives)), W - 10, 15, 16, '#ffd23f', 'right');
  }
});
