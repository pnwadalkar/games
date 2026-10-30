// Snakes & Ladders: roll the dice, climb the ladders, slide down the snakes. First to 100 wins.
Hub.register('snakesladders', (api, o) => {
  const B = 400, CS = B / 10, W = B, H = B + 140;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const LAD = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };
  const SNK = { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 99: 41 };
  const cellPos = n => { const i = n - 1, r = Math.floor(i / 10), k = i % 10, col = r % 2 ? 9 - k : k; return [col * CS + CS / 2, B - r * CS - CS / 2]; };
  const players = [{ pos: 0, show: 0, col: '#ff4d6d', name: o.twoP ? 'Player 1' : 'You' }, { pos: 0, show: 0, col: '#4cc9f0', name: o.twoP ? 'Player 2' : 'CPU' }];
  let turn = 0, die = 1, rolling = 0, moving = null, t = 0, msg = '', pending = null;
  api.turnOf = () => turn;
  api.busy = () => rolling > 0 || !!moving || pending != null;
  api.status(o.twoP ? 'Player 1 — roll the dice' : 'Your turn — tap to roll');

  function roll() {
    if (rolling > 0 || moving || api.over) return;
    rolling = .7; api.sfx('flip');
  }
  api.pointer(c, { down: () => { if (turn === 0 || o.twoP) roll(); } });
  api.onKey(k => { if (k === 'a' && (turn === 0 || o.twoP)) roll(); });

  function finishRoll() {
    const p = players[turn];
    die = api.randi(1, 6); // seeded when playing online
    let to = p.pos + die;
    if (to > 100) to = p.pos; // needs an exact roll
    moving = { to, from: p.pos, step: 0, die };
    msg = (turn === 0 || o.twoP ? players[turn].name : 'CPU') + ' rolled ' + die;
  }

  api.loop(dt => {
    t += dt;
    if (rolling > 0) { rolling -= dt; if (Math.random() < .5) die = U.randi(1, 6); if (rolling <= 0) finishRoll(); }
    const p = players[turn];
    if (moving) {
      moving.step += dt * 7;
      const n = Math.min(moving.to, moving.from + Math.floor(moving.step));
      p.show = n === moving.from ? moving.from : n;
      if (moving.from + Math.floor(moving.step) >= moving.to) {
        p.pos = moving.to; p.show = p.pos; moving = null;
        const dest = LAD[p.pos] || SNK[p.pos];
        if (dest) { api.sfx(LAD[p.pos] ? 'coin' : 'bad'); msg = LAD[p.pos] ? 'Ladder! Up to ' + dest : 'Snake! Down to ' + dest; pending = dest; api.after(450, () => { p.pos = pending; p.show = pending; pending = null; next(); }); return; }
        next();
      }
    }
  }, draw, true);

  function next() {
    const p = players[turn];
    if (p.pos === 100) { api.end({ win: turn === 0 || !!o.twoP, title: o.twoP ? p.name + ' wins!' : turn === 0 ? 'You win!' : 'CPU wins', msg: 'Reached square 100', emoji: '🏁' }); return; }
    if (die !== 6) turn = 1 - turn; else msg += ' — roll again!';
    api.status(turn === 0 || o.twoP ? (o.twoP ? 'Player ' + (turn + 1) + ' — tap to roll' : 'Your turn — tap to roll') : 'CPU is rolling…');
    if (turn === 1 && !o.twoP) api.after(700, roll);
  }

  function draw() {
    ctx.fillStyle = '#2b1d12'; ctx.fillRect(0, 0, W, H);
    for (let n = 1; n <= 100; n++) {
      const [x, y] = cellPos(n);
      ctx.__flat = true; ctx.fillStyle = n % 2 ? '#f2e2b8' : '#e0c98e'; ctx.fillRect(x - CS / 2, y - CS / 2, CS, CS);
      ctx.fillStyle = 'rgba(0,0,0,.04)'; ctx.fillRect(x - CS / 2, y - 1, CS, 2); ctx.__flat = false;
      U.text(ctx, n, x - CS / 2 + 3, y - CS / 2 + 8, 9, '#8a6f3c', 'left', 700);
    }
    ctx.lineCap = 'round';
    Object.entries(LAD).forEach(([a, b]) => {
      const [x1, y1] = cellPos(+a), [x2, y2] = cellPos(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * 7, ny = dx / L * 7;
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x2 - nx, y2 - ny); ctx.stroke();
      ctx.lineWidth = 3;
      for (let i = 1; i < L / 16; i++) { const u = i * 16 / L; ctx.beginPath(); ctx.moveTo(x1 + dx * u + nx, y1 + dy * u + ny); ctx.lineTo(x1 + dx * u - nx, y1 + dy * u - ny); ctx.stroke(); }
    });
    Object.entries(SNK).forEach(([a, b], i) => {
      const [x1, y1] = cellPos(+a), [x2, y2] = cellPos(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const col = ['#2ea84a', '#d6336c', '#7c5cff', '#f59f00'][i % 4];
      ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) { const u = s / 24, w = Math.sin(u * Math.PI * 4) * 12 * (1 - u * .3); const x = x1 + dx * u + nx * w, y = y1 + dy * u + ny * w; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      U.circle(ctx, x1, y1, 8, col); U.circle(ctx, x1 - 2.5, y1 - 2, 1.8, '#fff'); U.circle(ctx, x1 + 2.5, y1 - 2, 1.8, '#fff');
    });
    players.forEach((p, i) => {
      const n = p.show || 0; if (!n) return;
      const [x, y] = cellPos(n);
      const ox = i ? 9 : -9;
      U.blob(ctx, x + ox + 3, y + 12, 10, 3, .4);
      U.circle(ctx, x + ox, y + 2, 11, p.col);
      U.text(ctx, i ? '2' : '1', x + ox, y + 3, 11, '#fff', 'center', 900);
    });
    // dice tray
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, B, W, 140);
    const shake = rolling > 0 ? Math.sin(t * 40) * 4 : 0;
    U.box(ctx, W / 2 - 34 + shake, B + 36, 68, 68, '#fff', 12);
    const dots = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    ctx.__flat = true;
    dots[die].forEach(([a, b]) => { ctx.fillStyle = '#1b1e33'; ctx.beginPath(); ctx.arc(W / 2 - 34 + shake + 34 + a * 16, B + 36 + 34 + 4 + b * 16, 6, 0, 7); ctx.fill(); });
    ctx.__flat = false;
    U.text(ctx, msg, W / 2, B + 124, 14, '#f2e2b8');
    U.text(ctx, players[0].name + ': ' + players[0].pos, 14, B + 40, 14, players[0].col, 'left', 800);
    U.text(ctx, players[1].name + ': ' + players[1].pos, W - 14, B + 40, 14, players[1].col, 'right', 800);
    if (turn === 0 || o.twoP) U.text(ctx, rolling > 0 || moving ? '' : 'Tap to roll', W / 2, B + 18, 13, '#ffe27a');
    ctx.fillStyle = turn === 0 ? players[0].col : players[1].col; ctx.fillRect(0, B, W, 4);
  }
});
