// Peg Solitaire (English board): jump pegs to remove them; finish with one peg.
Hub.register('pegs', (api) => {
  const S = 490, CS = 70;
  const c = api.canvas(S, S + 60);
  const ctx = c.ctx;
  const valid = (r, k) => r >= 0 && k >= 0 && r < 7 && k < 7 && !((r < 2 || r > 4) && (k < 2 || k > 4));
  let b = U.grid(7, 7, (_, i) => 0);
  for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) b[r][k] = valid(r, k) ? 1 : -1;
  b[3][3] = 0;
  let sel = null, hist = [], done = false;
  const pegs = () => b.flat().filter(v => v === 1).length;
  api.setScore(pegs());
  const UNDO = { x: S / 2 - 60, y: S + 8, w: 120, h: 44 };

  function movesFrom(r, k) {
    return [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dr, dk]) => [r + dr * 2, k + dk * 2, r + dr, k + dk])
      .filter(([r2, k2, rm, km]) => valid(r2, k2) && b[r2][k2] === 0 && b[rm][km] === 1);
  }
  const anyMove = () => { for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) if (b[r][k] === 1 && movesFrom(r, k).length) return true; return false; };

  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      if (x > UNDO.x && x < UNDO.x + UNDO.w && y > UNDO.y && y < UNDO.y + UNDO.h) {
        const h = hist.pop();
        if (h) { b = h; sel = null; api.setScore(pegs()); api.sfx('flip'); draw(); }
        return;
      }
      const k = Math.floor(x / CS), r = Math.floor(y / CS);
      if (!valid(r, k)) return;
      if (b[r][k] === 1) { sel = [r, k]; api.sfx('click'); }
      else if (b[r][k] === 0 && sel) {
        const m = movesFrom(sel[0], sel[1]).find(([r2, k2]) => r2 === r && k2 === k);
        if (m) {
          hist.push(b.map(row => row.slice()));
          b[sel[0]][sel[1]] = 0; b[m[2]][m[3]] = 0; b[r][k] = 1;
          sel = [r, k];
          api.setScore(pegs());
          api.sfx('pop');
          if (!anyMove()) {
            done = true;
            const n = pegs();
            const center = n === 1 && b[3][3] === 1;
            api.end({ win: true, score: n, title: n === 1 ? (center ? 'Perfect — center finish!' : 'One peg left!') : 'No more moves', msg: n + ' peg' + (n === 1 ? '' : 's') + ' left', emoji: '📍' });
          }
        } else api.sfx('bad');
      }
      draw();
    }
  });

  c.draw = draw;
  function draw() {
    c.clear('#10163a');
    ctx.fillStyle = '#6b4423';
    U.rr(ctx, CS * 2 - 8, 6, CS * 3 + 16, S - 12, 24); ctx.fill();
    U.rr(ctx, 6, CS * 2 - 8, S - 12, CS * 3 + 16, 24); ctx.fill();
    const targets = sel ? movesFrom(sel[0], sel[1]).map(m => m[0] + ',' + m[1]) : [];
    for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) {
      if (!valid(r, k)) continue;
      const x = k * CS + CS / 2, y = r * CS + CS / 2;
      U.circle(ctx, x, y, 14, targets.includes(r + ',' + k) ? '#2ee59d' : '#3a230f');
      if (b[r][k] === 1) {
        const on = sel && sel[0] === r && sel[1] === k;
        U.circle(ctx, x, y + 2, 22, 'rgba(0,0,0,.3)');
        U.circle(ctx, x, y, 22, on ? '#ffc94d' : '#00d4ff');
        U.circle(ctx, x - 7, y - 7, 7, 'rgba(255,255,255,.5)');
      }
    }
    ctx.fillStyle = hist.length ? '#26306b' : '#171d45';
    U.rr(ctx, UNDO.x, UNDO.y, UNDO.w, UNDO.h, 12); ctx.fill();
    U.text(ctx, '↶ Undo', S / 2, UNDO.y + UNDO.h / 2, 16, hist.length ? '#fff' : '#4a5384');
  }
  draw();
});
