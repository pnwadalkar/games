// Make 24: combine the four numbers with + − × ÷ to reach exactly 24. Tap a number, an operator, then another number.
Hub.register('math24', (api) => {
  const W = 400, H = 580, TIME = 180;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const OPS = ['+', '−', '×', '÷'];
  const apply = (a, op, b) => (op === 0 ? a + b : op === 1 ? a - b : op === 2 ? a * b : (b !== 0 ? a / b : NaN));
  // a set is solvable if some order and operator choice reaches 24
  function solvable(nums) {
    if (nums.length === 1) return Math.abs(nums[0] - 24) < 1e-6;
    for (let i = 0; i < nums.length; i++) for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      for (let op = 0; op < 4; op++) {
        const v = apply(nums[i], op, nums[j]);
        if (!isFinite(v)) continue;
        if (solvable(nums.filter((_, k) => k !== i && k !== j).concat(v))) return true;
      }
    }
    return false;
  }
  let tiles, selA = -1, selOp = -1, hist = [], score = 0, skips = 3, t0 = 0, started = false, left = TIME, flash = 0, t = 0;
  function newPuzzle() {
    let nums;
    do { nums = [0, 0, 0, 0].map(() => U.randi(1, 9)); } while (!solvable(nums));
    tiles = nums.map((v, i) => ({ v, id: i, alive: true })); selA = -1; selOp = -1; hist = [];
  }
  newPuzzle();
  api.status('Reach 24 using all four numbers');

  const tileRect = i => ({ x: 24 + (i % 2) * 184, y: 130 + Math.floor(i / 2) * 110, w: 168, h: 94 });
  const opRect = i => ({ x: 24 + i * 94, y: 372, w: 82, h: 62 });
  const BTN = { undo: { x: 24, y: 470, w: 112, h: 50 }, reset: { x: 144, y: 470, w: 112, h: 50 }, skip: { x: 264, y: 470, w: 112, h: 50 } };
  const fmt = v => (Number.isInteger(v) ? String(v) : (Math.round(v * 100) / 100).toString());

  function combine(b) {
    const A = tiles[selA], B = tiles[b], v = apply(A.v, selOp, B.v);
    if (!isFinite(v)) { api.sfx('bad'); selA = selOp = -1; return; }
    hist.push(tiles.map(q => ({ ...q })));
    A.alive = false; B.v = v; selA = -1; selOp = -1; api.sfx('click');
    const live = tiles.filter(q => q.alive);
    if (live.length === 1) {
      if (Math.abs(live[0].v - 24) < 1e-6) { score++; api.setScore(score); api.sfx('win'); flash = .8; api.after(700, newPuzzle); }
      else { api.sfx('bad'); api.toast('That makes ' + fmt(live[0].v), 900); api.after(500, undo); }
    }
  }
  function undo() { const h = hist.pop(); if (h) { tiles = h; selA = selOp = -1; } }
  api.pointer(c, { down: (x, y) => {
    if (api.over) return;
    if (!started) { started = true; t0 = performance.now(); }
    if (U.inR(x, y, BTN.undo)) return undo();
    if (U.inR(x, y, BTN.reset)) { tiles = (hist[0] || tiles).map(q => ({ ...q })); hist = []; selA = selOp = -1; return; }
    if (U.inR(x, y, BTN.skip)) { if (skips > 0) { skips--; newPuzzle(); api.sfx('flip'); } return; }
    for (let i = 0; i < 4; i++) if (U.inR(x, y, opRect(i)) && selA >= 0) { selOp = i; api.sfx('click'); return; }
    for (let i = 0; i < 4; i++) if (tiles[i].alive && U.inR(x, y, tileRect(i))) {
      if (selA < 0) { selA = i; api.sfx('click'); }
      else if (selA === i) { selA = -1; selOp = -1; }
      else if (selOp >= 0) combine(i);
      return;
    }
  } });
  api.loop(dt => {
    t += dt; flash = Math.max(0, flash - dt);
    if (started) { left = Math.max(0, TIME - (performance.now() - t0) / 1000); if (left <= 0 && !api.over) api.end({ win: true, title: 'Time!', msg: score + ' puzzles solved', score, emoji: '🧮' }); }
  }, draw, true);

  function draw() {
    c.clear('#14122e');
    U.text(ctx, started ? Math.ceil(left) + 's' : TIME + 's', 20, 34, 24, left < 20 ? '#ff5c7a' : '#9fb2ff', 'left', 900);
    U.text(ctx, 'Solved ' + score, W - 20, 34, 20, '#fff', 'right', 800);
    U.text(ctx, 'Make 24', W / 2, 80, 30, '#ffd23f', 'center', 900);
    tiles.forEach((q, i) => {
      if (!q.alive) return;
      const r = tileRect(i), sel = selA === i;
      U.box(ctx, r.x, r.y + (sel ? -6 : 0), r.w, r.h, sel ? '#ffb703' : flash > 0 ? '#2ea84a' : '#4a56a8', 12);
      U.text(ctx, fmt(q.v), r.x + r.w / 2, r.y + r.h / 2 + (sel ? -4 : 2), 40, '#fff', 'center', 900);
    });
    OPS.forEach((o, i) => U.btn(ctx, opRect(i), o, selOp === i ? '#e0245e' : '#5b6bd6', 32, selA < 0));
    U.text(ctx, selA < 0 ? 'Pick a number' : selOp < 0 ? 'Pick an operator' : 'Pick the second number', W / 2, 352, 14, '#9fb2ff');
    U.btn(ctx, BTN.undo, '↶ Undo', '#5b6bd6', 15, !hist.length); U.btn(ctx, BTN.reset, '↻ Reset', '#d65b8a', 15); U.btn(ctx, BTN.skip, 'Skip (' + skips + ')', '#4a5a88', 15, skips <= 0);
  }
});
