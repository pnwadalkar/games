// Pig (dice) vs CPU: roll to build a turn total, hold to bank it, a 1 loses the turn. First to 100.
Hub.register('pig', (api, o) => {
  const W = 480, H = 600, GOAL = 100;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let sc = [0, 0], turn = 0, pot = 0, die = 1, rolling = 0, busy = false, msg = 'Your turn — roll!';
  api.turnOf = () => turn;
  api.busy = () => busy || rolling > 0;
  const name = p => o.twoP ? 'Player ' + (p + 1) : p === 0 ? 'You' : 'CPU';

  function roll() {
    if (busy || api.over) return;
    busy = true; rolling = .6;
    api.sfx('click');
    api.after(600, () => {
      die = api.randi(1, 6); // seeded when playing online, so both players see the same roll
      busy = false;
      if (die === 1) { msg = name(turn) + ' rolled a 1 — turn lost!'; pot = 0; api.sfx('bad'); swap(); }
      else {
        pot += die; api.sfx('move'); msg = name(turn) + ' rolled ' + die;
        if (sc[turn] + pot >= GOAL) return hold();
        if (!o.twoP && turn === 1) cpuThink();
      }
    });
  }
  function hold() {
    if (busy || api.over || !pot) return;
    sc[turn] += pot;
    msg = name(turn) + ' banked ' + pot;
    pot = 0;
    api.sfx('coin');
    if (sc[turn] >= GOAL) {
      const w = turn;
      return api.end({ win: o.twoP || w === 0, title: name(w) + (w === 0 && !o.twoP ? ' win!' : ' wins!'), msg: sc[0] + ' – ' + sc[1], emoji: w === 0 || o.twoP ? '🐷' : '🤖', delay: 500 });
    }
    swap();
  }
  function swap() {
    turn = 1 - turn;
    if (!o.twoP && turn === 1) { busy = true; api.after(900, () => { busy = false; cpuThink(); }); }
  }
  function cpuThink() {
    // hold at 20, or sooner when far ahead; chase when behind late in the game
    const need = GOAL - sc[1];
    const target = need <= 20 ? need : sc[0] >= 80 ? 30 : sc[1] - sc[0] > 30 ? 15 : 20;
    busy = true;
    api.after(700, () => { busy = false; if (pot >= target) hold(); else roll(); });
  }
  const BR = { x: 40, y: 480, w: 190, h: 80 }, BH = { x: 250, y: 480, w: 190, h: 80 };
  const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  const mine = () => o.twoP || turn === 0;
  api.pointer(c, { down: (x, y) => { if (!mine()) return; if (inR(x, y, BR)) roll(); else if (inR(x, y, BH)) hold(); } });
  api.onKey((k, raw) => { if (!mine()) return; if (k === 'a' || raw === 'r') roll(); if (raw === 'h' || k === 'b') hold(); });

  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  api.loop(dt => { if (rolling > 0) { rolling -= dt; if (Math.random() < .5) die = U.randi(1, 6); } }, () => {
    c.clear('#3b1f4f');
    [0, 1].forEach(p => {
      const x = p ? W - 130 : 130, act = turn === p;
      ctx.fillStyle = act ? '#ff8ac0' : '#5a3470';
      U.rr(ctx, x - 100, 24, 200, 110, 16); ctx.fill();
      U.text(ctx, name(p), x, 50, 16, act ? '#3b1f4f' : '#e7c9f5', 'center', 800);
      U.text(ctx, sc[p], x, 95, 42, act ? '#3b1f4f' : '#fff', 'center', 900);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 80, 120, 160, 6);
      ctx.fillStyle = act ? '#3b1f4f' : '#ff8ac0'; ctx.fillRect(x - 80, 120, 160 * Math.min(1, sc[p] / GOAL), 6);
    });
    ctx.save();
    ctx.translate(W / 2, 260);
    if (rolling > 0) ctx.rotate(Math.sin(rolling * 30) * .3);
    ctx.fillStyle = '#fff';
    U.rr(ctx, -60, -60, 120, 120, 20); ctx.fill();
    PIPS[die].forEach(([a, b]) => U.circle(ctx, a * 32, b * 32, 11, die === 1 ? '#e0244a' : '#1b1e33'));
    ctx.restore();
    U.text(ctx, 'Turn total: ' + pot, W / 2, 370, 24, '#ffd1e8', 'center', 800);
    U.text(ctx, msg, W / 2, 420, 16, '#e7c9f5', 'center', 600);
    [[BR, '🎲 Roll', '#ffc94d'], [BH, '✋ Hold', '#2ee59d']].forEach(([r, l, col]) => {
      ctx.fillStyle = mine() && !busy ? col : '#5a3470';
      U.rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill();
      U.text(ctx, l, r.x + r.w / 2, r.y + r.h / 2, 22, '#1b1e33', 'center', 900);
    });
  }, true);
});
