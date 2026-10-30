// Chimp Memory: numbers flash on the grid. Tap them in order from memory; they hide after your first tap.
Hub.register('chimp', (api) => {
  const COLS = 5, ROWS = 7, CS = 72, W = COLS * CS + 20, H = ROWS * CS + 80;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let level = 4, cells = [], next = 1, hidden = false, lives = 3, flash = null, t = 0, done = false;

  function setup() {
    const spots = U.shuffle([...Array(COLS * ROWS).keys()]).slice(0, level);
    cells = spots.map((s, i) => ({ s, n: i + 1, gone: false }));
    next = 1; hidden = false;
    api.status('Level ' + (level - 3) + ' · ' + level + ' numbers');
  }
  setup();
  api.pointer(c, { down: (x, y) => {
    if (done || api.over) return;
    const k = Math.floor((x - 10) / CS), r = Math.floor((y - 40) / CS);
    const cell = cells.find(q => !q.gone && q.s === r * COLS + k);
    if (!cell) return;
    if (cell.n === next) {
      if (next === 1) hidden = true;
      cell.gone = true; next++; api.sfx('click');
      if (next > level) {
        api.sfx('win'); level++; api.setScore(level - 4); done = true; flash = { t: .7, m: 'Level cleared!' };
        api.after(800, () => { done = false; setup(); });
      }
    } else {
      lives--; api.sfx('bad'); flash = { t: .7, m: lives ? 'Oops! ' + lives + ' left' : 'Out of lives' };
      if (lives <= 0) { done = true; hidden = false; cells.forEach(q => { q.gone = false; }); api.end({ msg: 'Reached ' + (level - 3 ) + ' numbers', score: level - 4, emoji: '🐵' }); }
      else { done = true; hidden = false; cells.forEach(q => { q.gone = false; }); api.after(900, () => { done = false; setup(); }); }
    }
  } });
  api.loop(dt => { t += dt; if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; } }, draw, true);

  function draw() {
    c.clear('#14122e');
    U.text(ctx, 'Level ' + (level - 3), 14, 20, 16, '#9fb2ff', 'left', 800);
    U.text(ctx, '❤'.repeat(Math.max(0, lives)), W - 14, 20, 18, '#ff5c7a', 'right');
    cells.forEach(q => {
      if (q.gone) return;
      const x = 10 + (q.s % COLS) * CS, y = 40 + Math.floor(q.s / COLS) * CS;
      if (hidden) U.box(ctx, x + 6, y + 10, CS - 12, CS - 14, '#f2f2fb', 10);
      else { U.box(ctx, x + 6, y + 10, CS - 12, CS - 14, '#f2f2fb', 10); U.text(ctx, q.n, x + CS / 2, y + CS / 2 + 4, 34, '#2b2f5a', 'center', 900); }
    });
    if (flash) U.text(ctx, flash.m, W / 2, H - 20, 20, '#ffe27a', 'center', 900);
  }
});
