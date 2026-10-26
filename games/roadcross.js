// Road Cross: endless hop across roads and rivers (Crossy Road / Frogger style).
Hub.register('roadcross', (api) => {
  const COLS = 10, CS = 40, VIEW = 15, W = COLS * CS, H = VIEW * CS;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('dpad');
  const rows = {};
  const CAR_COLS = ['#ff5c7a', '#ffc94d', '#7c5cff', '#00d4ff', '#ff8a3d', '#f4f4f4'];

  function row(i) {
    if (rows[i]) return rows[i];
    let r;
    const prev = rows[i - 1];
    const lvl = Math.min(1, i / 150);
    if (i < 3) r = { type: 'grass', trees: new Set() };
    else {
      const x = Math.random();
      let type = x < .34 ? 'grass' : x < .76 ? 'road' : 'river';
      if (i < 8 && type === 'river') type = 'road';
      if (prev && prev.type === 'grass' && type === 'grass') type = 'road';
      r = { type };
      if (type === 'grass') {
        r.trees = new Set();
        const n = U.randi(1, 4);
        for (let k = 0; k < n; k++) r.trees.add(U.randi(0, COLS - 1));
      } else {
        r.dir = Math.random() < .5 ? -1 : 1;
        if (prev && prev.dir) r.dir = -prev.dir;
        r.speed = (type === 'road' ? U.rand(60, 120) : U.rand(40, 75)) * (1 + lvl * 1.4);
        r.objs = [];
        const len = type === 'road' ? (Math.random() < .25 ? 2.2 : 1.3) : U.randi(2, 4);
        const gap = type === 'road' ? U.rand(2.6, 5) : U.rand(1.6, 2.6);
        const span = W + 4 * CS;
        for (let x = U.rand(0, gap * CS); x < span; x += (len + gap) * CS) r.objs.push({ x: x - 2 * CS, w: len * CS, col: U.pick(CAR_COLS) });
        r.span = span;
      }
    }
    // keep a free column through grass rows next to the start column
    if (r.type === 'grass' && i < 3) r.trees = new Set(i === 0 ? [0, COLS - 1] : []);
    rows[i] = r;
    return r;
  }

  const p = { col: 4, x: 4 * CS, row: 0, hop: 0, fromX: 0, fromRow: 0, dead: false };
  let cam = -3, best = 0, started = false;

  function tryMove(k) {
    if (p.dead || api.over || p.hop > 0) return;
    let nx = Math.round(p.x / CS), nr = p.row;
    if (k === 'up') nr++; else if (k === 'down') nr--; else if (k === 'left') nx--; else if (k === 'right') nx++; else return;
    if (nx < 0 || nx >= COLS || nr < cam + 1) return;
    const target = row(nr);
    if (target.type === 'grass' && target.trees.has(nx)) return;
    started = true;
    p.fromX = p.x; p.fromRow = p.row;
    p.toX = nx * CS; p.row = nr;
    p.hop = .12;
    api.sfx('move');
    if (nr > best) { best = nr; api.setScore(best); }
  }
  api.onKey(tryMove);
  api.onSwipe(tryMove);
  api.on(api.stage, 'pointerup', e => {
    // simple tap (not a swipe) hops forward
    if (!e.isPrimary) return;
    if (p.tapStart && Math.hypot(e.clientX - p.tapStart[0], e.clientY - p.tapStart[1]) < 15) tryMove('up');
    p.tapStart = null;
  });
  api.on(api.stage, 'pointerdown', e => { p.tapStart = [e.clientX, e.clientY]; });

  function die(why) {
    if (p.dead) return;
    p.dead = true;
    p.why = why;
    api.sfx(why === 'water' ? 'bad' : 'boom');
    api.end({ msg: 'Reached row ' + best });
  }

  api.loop(dt => {
    for (let i = Math.floor(cam) - 1; i < cam + VIEW + 2; i++) {
      const r = row(i);
      if (!r.objs) continue;
      r.objs.forEach(o => {
        o.x += r.speed * r.dir * dt;
        if (r.dir > 0 && o.x > W + 2 * CS) o.x -= r.span;
        if (r.dir < 0 && o.x + o.w < -2 * CS) o.x += r.span;
      });
    }
    if (p.hop > 0) {
      p.hop -= dt;
      const t = 1 - Math.max(0, p.hop) / .12;
      p.x = U.lerp(p.fromX, p.toX, t);
      if (p.hop <= 0) p.x = p.toX;
    }
    const r = row(p.row);
    if (r.type === 'road') {
      for (const o of r.objs) if (p.x + CS - 8 > o.x && p.x + 8 < o.x + o.w) return die('car');
    } else if (r.type === 'river' && p.hop <= 0) {
      const log = r.objs.find(o => p.x + CS / 2 > o.x && p.x + CS / 2 < o.x + o.w);
      if (!log) return die('water');
      p.x += r.speed * r.dir * dt;
      if (p.x < -CS / 2 || p.x > W - CS / 2) return die('water');
    } else if (p.hop <= 0) {
      p.x = U.lerp(p.x, Math.round(p.x / CS) * CS, Math.min(1, dt * 20));
    }
    if (started) cam += dt * (.35 + Math.min(.6, best / 200));
    cam = Math.max(cam, p.row - 5);
    if (p.row < cam) die('eagle');
    for (const k in rows) if (k < cam - 4) delete rows[k];
  }, draw);

  function draw() {
    const sy = i => H - (i - cam + 1) * CS;
    for (let i = Math.floor(cam) - 1; i < cam + VIEW + 1; i++) {
      const r = row(i), y = sy(i);
      if (r.type === 'grass') {
        ctx.fillStyle = i % 2 ? '#5fbf4a' : '#57b543';
        ctx.fillRect(0, y, W, CS);
        r.trees.forEach(k => {
          ctx.fillStyle = '#6b4423'; ctx.fillRect(k * CS + 16, y + 24, 8, 12);
          U.circle(ctx, k * CS + 20, y + 18, 14, '#2e7d32');
          U.circle(ctx, k * CS + 15, y + 15, 6, '#43a047');
        });
      } else if (r.type === 'road') {
        ctx.fillStyle = '#3b3f54';
        ctx.fillRect(0, y, W, CS);
        ctx.fillStyle = '#5c6080';
        for (let x = 0; x < W; x += 40) ctx.fillRect(x + 10, y + CS - 2, 20, 2);
        r.objs.forEach(o => {
          ctx.fillStyle = o.col;
          U.rr(ctx, o.x + 2, y + 6, o.w - 4, CS - 12, 7); ctx.fill();
          ctx.fillStyle = 'rgba(20,30,60,.7)';
          const wx = r.dir > 0 ? o.x + o.w - 18 : o.x + 6;
          ctx.fillRect(wx, y + 10, 12, CS - 20);
          ctx.fillStyle = '#111';
          ctx.fillRect(o.x + 8, y + 3, 10, 4); ctx.fillRect(o.x + o.w - 18, y + 3, 10, 4);
          ctx.fillRect(o.x + 8, y + CS - 7, 10, 4); ctx.fillRect(o.x + o.w - 18, y + CS - 7, 10, 4);
        });
      } else {
        ctx.fillStyle = '#2f7fd6';
        ctx.fillRect(0, y, W, CS);
        ctx.fillStyle = 'rgba(255,255,255,.15)';
        for (let x = (i * 37) % 60; x < W; x += 60) ctx.fillRect(x, y + 12, 18, 2);
        r.objs.forEach(o => {
          ctx.fillStyle = '#8d5a2b';
          U.rr(ctx, o.x, y + 5, o.w, CS - 10, 10); ctx.fill();
          ctx.fillStyle = '#a8703c';
          ctx.fillRect(o.x + 6, y + 12, o.w - 12, 3);
        });
      }
    }
    const t = p.hop > 0 ? 1 - p.hop / .12 : 1;
    const ry = U.lerp(p.fromRow, p.row, p.hop > 0 ? t : 1);
    const py = sy(ry) - Math.sin(t * Math.PI) * 10;
    if (!(p.dead && p.why === 'water')) {
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath(); ctx.ellipse(p.x + CS / 2, sy(ry) + CS - 6, 13, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      U.rr(ctx, p.x + 8, py + 6, CS - 16, CS - 12, 8); ctx.fill();
      ctx.fillStyle = '#ff5c7a'; ctx.fillRect(p.x + 17, py + 2, 6, 6);
      ctx.fillStyle = '#ff8a3d'; ctx.fillRect(p.x + 17, py + 16, 6, 5);
      U.circle(ctx, p.x + 14, py + 13, 2.2, '#111'); U.circle(ctx, p.x + 26, py + 13, 2.2, '#111');
    }
    if (!started) U.text(ctx, api.isTouch ? 'Tap to hop · swipe to turn' : 'Arrow keys to hop', W / 2, H - 20, 15, '#fff');
  }
});
