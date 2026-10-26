// Sokoban: push every box onto a target. Levels unlock as you go; undo and level reset included.
Hub.register('sokoban', (api) => {
  const LEVELS = [
    ['#######', '#     #', '# .$@ #', '#     #', '#######'],
    ['######', '#    #', '# #@ #', '# $* #', '# .* #', '#    #', '######'],
    ['####', '# .#', '#  ###', '#*@  #', '#  $ #', '#  ###', '####'],
    ['########', '#      #', '# .**$@#', '#      #', '#####  #', '    ####'],
    [' #######', ' #     #', ' # .$. #', '## $@$ #', '#  .$. #', '#      #', '########'],
    ['#######', '#     #', '# .$. #', '# $.$ #', '# .$. #', '# $.$ #', '#  @  #', '#######'],
    ['#####', '#.  ##', '#@$$ #', '##   #', ' ##  #', '  ##.#', '   ###'],
    ['  ####', '###  ####', '#     $ #', '# #  #$ #', '# . .#@ #', '#########'],
    ['  #####', '###   #', '#.@$  #', '### $.#', '#.##$ #', '# # . ##', '#$ *$$.#', '#   .  #', '########'],
    ['      #####', '      #.  #', '      #.# #', '#######.# #', '# @ $ $ $ #', '# # # # ###', '#       #', '#########'],
    ['###### #####', '#    ###   #', '# $$     #@#', '# $ #...   #', '#   ########', '#####'],
    ['  ######', '  # ..@#', '  # $$ #', '  ## ###', '   # #', '   # #', '#### #', '#    ##', '# #   #', '#   # #', '###   #', '  #####']
  ];
  const c = api.canvas(400, 400);
  const ctx = c.ctx;
  api.controls('dpad');
  let unlocked = Hub.LS.get('soko:unlocked', 0);
  let lv = Math.min(unlocked, LEVELS.length - 1), walls, goals, boxes, p, w, h, moves, pushes, hist, won;

  function load(i) {
    lv = i;
    const L = LEVELS[i];
    h = L.length; w = Math.max(...L.map(r => r.length));
    walls = new Set(); goals = new Set(); boxes = new Set(); hist = []; moves = 0; pushes = 0; won = false;
    L.forEach((row, y) => [...row].forEach((ch, x) => {
      const k = x + ',' + y;
      if (ch === '#') walls.add(k);
      if (ch === '.' || ch === '*' || ch === '+') goals.add(k);
      if (ch === '$' || ch === '*') boxes.add(k);
      if (ch === '@' || ch === '+') p = [x, y];
    }));
    const CS = Math.floor(Math.min(64, 640 / Math.max(w, h)));
    c.CS = CS;
    c.resize(w * CS, h * CS + 50);
    status();
  }
  function status() { api.status('Level ' + (lv + 1) + ' / ' + LEVELS.length + ' · moves ' + moves + ' · pushes ' + pushes); }

  function move(dir) {
    if (won || api.over) return;
    const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
    if (!d) return;
    const nx = p[0] + d[0], ny = p[1] + d[1], nk = nx + ',' + ny;
    if (walls.has(nk)) return;
    if (boxes.has(nk)) {
      const bk = (nx + d[0]) + ',' + (ny + d[1]);
      if (walls.has(bk) || boxes.has(bk)) return;
      hist.push([p.slice(), new Set(boxes), moves, pushes]);
      boxes.delete(nk); boxes.add(bk);
      pushes++;
      api.sfx(goals.has(bk) ? 'coin' : 'hit');
    } else {
      hist.push([p.slice(), new Set(boxes), moves, pushes]);
      api.sfx('move');
    }
    p = [nx, ny];
    moves++;
    status();
    draw();
    if ([...boxes].every(b => goals.has(b))) {
      won = true;
      unlocked = Math.max(unlocked, lv + 1);
      Hub.LS.set('soko:unlocked', unlocked);
      api.setScore(lv + 1);
      if (lv + 1 >= LEVELS.length) api.end({ win: true, title: 'All levels solved!', emoji: '📦', score: lv + 1 });
      else { api.toast('Level ' + (lv + 1) + ' solved!'); api.sfx('win'); api.after(1100, () => load(lv + 1)); }
    }
  }
  function undo() {
    const h0 = hist.pop();
    if (!h0 || won) return;
    [p, boxes, moves, pushes] = h0;
    status(); draw();
  }
  api.onKey((k, raw) => {
    if (raw === 'u' || raw === 'U' || raw === 'Backspace' || raw === 'z' || raw === 'Z') return undo();
    if (raw === 'r' || raw === 'R') { load(lv); return draw(); }
    move(k);
  });
  api.onSwipe(move);
  const BTNS = () => [
    { l: '◀ Prev', x: 0, f: () => { if (lv > 0) { load(lv - 1); draw(); } } },
    { l: '↶ Undo', x: 1, f: undo },
    { l: '⟲ Reset', x: 2, f: () => { load(lv); draw(); } },
    { l: 'Next ▶', x: 3, f: () => { if (lv < Math.min(unlocked, LEVELS.length - 1)) { load(lv + 1); draw(); } } }
  ];
  api.pointer(c, {
    down: (x, y) => {
      if (y > c.h - 50) { const b = BTNS()[Math.floor(x / (c.w / 4))]; if (b) b.f(); return; }
      const CS = c.CS, dx = x / CS - (p[0] + .5), dy = y / CS - (p[1] + .5);
      if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
  });

  c.draw = draw;
  function draw() {
    if (!walls) return;
    const CS = c.CS;
    c.clear('#10163a');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = x + ',' + y, X = x * CS, Y = y * CS;
      if (walls.has(k)) {
        ctx.fillStyle = '#5b4b8a'; ctx.fillRect(X, Y, CS, CS);
        ctx.fillStyle = '#6d5ca3'; ctx.fillRect(X + 2, Y + 2, CS - 4, CS / 2 - 3);
      }
    }
    // floor = cells reachable from the player (outside cells stay dark)
    const seen = new Set([p.join(',')]), q = [p.slice()];
    for (let i = 0; i < q.length; i++) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => {
      const nx = q[i][0] + a, ny = q[i][1] + b, k = nx + ',' + ny;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !walls.has(k) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    });
    boxes.forEach(k => seen.add(k));
    seen.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillStyle = (x + y) % 2 ? '#1d2659' : '#202a60'; ctx.fillRect(x * CS, y * CS, CS, CS); });
    goals.forEach(k => { const [x, y] = k.split(',').map(Number); U.circle(ctx, x * CS + CS / 2, y * CS + CS / 2, CS * .18, '#ff5c7a'); });
    boxes.forEach(k => {
      const [x, y] = k.split(',').map(Number), on = goals.has(k);
      ctx.fillStyle = on ? '#2ee59d' : '#d9a05b';
      U.rr(ctx, x * CS + 4, y * CS + 4, CS - 8, CS - 8, 6); ctx.fill();
      ctx.strokeStyle = on ? '#1a9e6a' : '#8d5a2b'; ctx.lineWidth = 3;
      ctx.strokeRect(x * CS + 10, y * CS + 10, CS - 20, CS - 20);
    });
    U.circle(ctx, p[0] * CS + CS / 2, p[1] * CS + CS / 2, CS * .34, '#00d4ff');
    U.circle(ctx, p[0] * CS + CS / 2 - CS * .1, p[1] * CS + CS / 2 - CS * .06, CS * .06, '#10163a');
    U.circle(ctx, p[0] * CS + CS / 2 + CS * .1, p[1] * CS + CS / 2 - CS * .06, CS * .06, '#10163a');
    BTNS().forEach((b, i) => {
      const bw = c.w / 4;
      ctx.fillStyle = '#26306b';
      U.rr(ctx, i * bw + 4, c.h - 44, bw - 8, 38, 9); ctx.fill();
      U.text(ctx, b.l, i * bw + bw / 2, c.h - 25, Math.min(14, bw / 6), '#fff');
    });
  }
  load(lv);
  draw();
});
