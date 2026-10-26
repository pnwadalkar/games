// Tower of Hanoi: move the whole stack to the right peg; never put a bigger disc on a smaller one.
Hub.register('hanoi', (api, o) => {
  const N = o.discs || 4, W = 600, H = 400, BASE = 340, DH = Math.min(30, 220 / N);
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const pegs = [[...Array(N).keys()].map(i => N - i), [], []];
  let held = null, moves = 0, done = false;
  const min = 2 ** N - 1;
  api.status('Minimum possible: ' + min + ' moves');

  function tap(p) {
    if (done) return;
    if (held == null) {
      if (pegs[p].length) { held = p; api.sfx('click'); }
    } else {
      if (p !== held) {
        const d = pegs[held][pegs[held].length - 1], top = pegs[p][pegs[p].length - 1];
        if (top && top < d) { api.sfx('bad'); api.toast('Can\'t place a bigger disc on a smaller one'); held = null; draw(); return; }
        pegs[p].push(pegs[held].pop());
        moves++;
        api.setScore(moves);
        api.sfx('move');
      }
      held = null;
      if (pegs[2].length === N) {
        done = true;
        api.end({ win: true, title: 'Solved!', score: moves, msg: moves === min ? 'Perfect — the minimum number of moves!' : moves + ' moves (best possible ' + min + ')', emoji: '🗼' });
      }
    }
    draw();
  }
  api.pointer(c, { down: x => tap(Math.min(2, Math.floor(x / (W / 3)))) });
  api.onKey((k, raw) => { if (raw === '1' || raw === '2' || raw === '3') tap(+raw - 1); });

  c.draw = draw;
  function draw() {
    c.clear('#10163a');
    ctx.fillStyle = '#5b3a1a';
    U.rr(ctx, 20, BASE, W - 40, 16, 6); ctx.fill();
    for (let p = 0; p < 3; p++) {
      const cx = W / 6 + p * W / 3;
      if (held === p) { ctx.fillStyle = 'rgba(124,92,255,.15)'; U.rr(ctx, cx - W / 6 + 8, 30, W / 3 - 16, BASE - 30, 14); ctx.fill(); }
      ctx.fillStyle = '#8b5a2b';
      U.rr(ctx, cx - 6, 90, 12, BASE - 90, 6); ctx.fill();
      pegs[p].forEach((d, i) => {
        const lift = held === p && i === pegs[p].length - 1;
        const dw = 40 + (d / N) * (W / 3 - 60), y = lift ? 40 : BASE - (i + 1) * DH;
        ctx.fillStyle = `hsl(${(d * 360 / N + 200) % 360}, 70%, 58%)`;
        U.rr(ctx, cx - dw / 2, y, dw, DH - 3, 8); ctx.fill();
      });
      U.text(ctx, p + 1, cx, BASE + 34, 14, '#5d6799');
    }
  }
  draw();
});
