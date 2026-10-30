// Roulette: place chips on the table, spin the wheel and see where the ball lands. You start with 200 credits.
Hub.register('roulette', (api) => {
  const W = 420, H = 640, CX = W / 2, WY = 130, WR = 100;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colOf = n => (n === 0 ? '#1f9d55' : RED.has(n) ? '#d6213f' : '#1b1e33');
  // table layout
  const TX = 44, TY = 262, CW = 28, RH = 38;
  const cells = [{ id: 'n0', n: 0, x: TX - 30, y: TY, w: 28, h: RH * 3, label: '0', pay: 35, test: n => n === 0 }];
  for (let k = 0; k < 12; k++) for (let r = 0; r < 3; r++) { const n = k * 3 + (3 - r); cells.push({ id: 'n' + n, n, x: TX + k * CW, y: TY + r * RH, w: CW, h: RH, label: String(n), pay: 35, test: m => m === n }); }
  const OUT = [
    ['1st 12', 0, 4, n => n >= 1 && n <= 12, 2], ['2nd 12', 4, 4, n => n >= 13 && n <= 24, 2], ['3rd 12', 8, 4, n => n >= 25 && n <= 36, 2],
    ['1-18', 0, 2, n => n >= 1 && n <= 18, 1], ['EVEN', 2, 2, n => n && n % 2 === 0, 1], ['RED', 4, 2, n => RED.has(n), 1], ['BLACK', 6, 2, n => n && !RED.has(n), 1], ['ODD', 8, 2, n => n % 2 === 1, 1], ['19-36', 10, 2, n => n >= 19, 1]
  ];
  OUT.forEach((o, i) => { const row = i < 3 ? 0 : 1; cells.push({ id: 'o' + i, x: TX + o[1] * CW, y: TY + RH * 3 + 4 + row * 34, w: o[2] * CW, h: 32, label: o[0], pay: o[4], test: o[3], out: true, col: o[0] === 'RED' ? '#d6213f' : o[0] === 'BLACK' ? '#1b1e33' : null }); });
  const CHIPS = [1, 5, 25];
  let bets = {}, credits = 200, chip = 5, ang = 0, ballA = 0, spinning = 0, result = null, msg = 'Place your bets', t = 0, history = [], lastWin = 0;
  api.setScore(credits);
  const BTN = { spin: { x: W / 2 - 80, y: 500, w: 160, h: 54 }, clear: { x: 24, y: 500, w: 90, h: 54 } };
  const chipBtn = i => ({ x: W - 150 + i * 46, y: 440, w: 40, h: 40 });
  const staked = () => Object.values(bets).reduce((a, b) => a + b, 0);

  function spin() {
    if (spinning > 0 || api.over || !staked()) { if (!staked()) { msg = 'Place a bet first'; api.sfx('bad'); } return; }
    spinning = 5; result = null; lastWin = 0; msg = 'No more bets…';
    const n = U.randi(0, 36); result = n;
    // final wheel angle so that the winning pocket sits under the ball's resting spot (top)
    const idx = ORDER.indexOf(n), per = Math.PI * 2 / 37;
    spinTarget = Math.PI * 2 * 6 - idx * per; spinStart = ang; api.sfx('flip');
  }
  let spinTarget = 0, spinStart = 0;
  api.pointer(c, { down: (x, y) => {
    if (spinning > 0 || api.over) return;
    if (U.inR(x, y, BTN.spin)) return spin();
    if (U.inR(x, y, BTN.clear)) { credits += staked(); bets = {}; api.sfx('click'); return; }
    CHIPS.forEach((v, i) => { if (U.inR(x, y, chipBtn(i))) { chip = v; api.sfx('click'); } });
    const cell = cells.find(q => U.inR(x, y, q));
    if (cell) {
      if (credits < chip) { api.sfx('bad'); return; }
      credits -= chip; bets[cell.id] = (bets[cell.id] || 0) + chip; api.sfx('coin'); msg = 'Staked ' + staked();
    }
  } });
  api.onKey(k => { if (k === 'a') spin(); });

  function settle() {
    let win = 0;
    cells.forEach(q => { const b = bets[q.id]; if (b && q.test(result)) win += b * (q.pay + 1); });
    credits += win; lastWin = win; const net = win - staked();
    history.unshift(result); history = history.slice(0, 10);
    msg = win ? (net > 0 ? 'Won ' + win + '!' : 'Returned ' + win) : 'Lost ' + staked();
    api.sfx(win ? 'win' : 'bad'); bets = {}; api.setScore(Math.max(api.score, credits));
    if (credits <= 0) api.end({ msg: 'Peak balance ' + api.score + ' credits', emoji: '🎡', score: api.score });
  }
  api.loop(dt => {
    t += dt;
    if (spinning > 0) {
      spinning -= dt; const p = 1 - Math.max(0, spinning) / 5, e = 1 - Math.pow(1 - p, 3);
      ang = spinStart + (spinTarget - spinStart) * e; ballA = -ang * 1.6 - t * 4 * (1 - e);
      if (spinning <= 0) { ang = spinTarget % (Math.PI * 2); settle(); }
    }
  }, draw, true);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a0f12'); g.addColorStop(1, '#14090b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // wheel (drawn as a tilted disc for depth)
    ctx.save(); ctx.translate(CX, WY); ctx.scale(1, .86);
    U.circle(ctx, 0, 14, WR + 18, 'rgba(0,0,0,.4)');
    U.circle(ctx, 0, 0, WR + 14, '#6b3a1e');
    const per = Math.PI * 2 / 37;
    ctx.save(); ctx.rotate(ang);
    ctx.__flat = true;
    ORDER.forEach((n, i) => {
      ctx.fillStyle = colOf(n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, WR, i * per - per / 2 - Math.PI / 2, i * per + per / 2 - Math.PI / 2); ctx.closePath(); ctx.fill();
    });
    ORDER.forEach((n, i) => { ctx.save(); ctx.rotate(i * per); U.text(ctx, n, 0, -WR + 12, 10, '#fff', 'center', 800); ctx.restore(); });
    ctx.__flat = false;
    ctx.restore();
    U.circle(ctx, 0, 0, WR * .42, '#c9a35a'); U.circle(ctx, 0, 0, WR * .12, '#8a6a2a');
    // ball: circles the rim, then rests at the top pocket
    const settled = spinning <= 0, ba = settled ? -Math.PI / 2 : ballA - Math.PI / 2, br = settled ? WR - 10 : WR - 8 + Math.min(8, spinning * 3);
    U.circle(ctx, Math.cos(ba) * br, Math.sin(ba) * br, 6, '#fff');
    ctx.restore();
    U.text(ctx, msg, CX, 238, 16, lastWin ? '#ffe27a' : '#f0dede', 'center', 800);
    if (result != null && spinning <= 0) U.text(ctx, String(result), CX + WR + 44, WY, 34, result === 0 ? '#2ee59d' : RED.has(result) ? '#ff5c6c' : '#fff', 'center', 900);
    // history
    history.forEach((n, i) => U.circle(ctx, 22 + i * 18, 20, 8, colOf(n)));
    // table
    ctx.fillStyle = '#0e5a2e'; U.rr(ctx, 4, TY - 10, W - 8, 200, 14); ctx.fill();
    cells.forEach(q => {
      const col = q.out ? q.col || '#0e5a2e' : colOf(q.n);
      ctx.__flat = true; ctx.fillStyle = col; ctx.fillRect(q.x + 1, q.y + 1, q.w - 2, q.h - 2);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.strokeRect(q.x + .5, q.y + .5, q.w - 1, q.h - 1); ctx.__flat = false;
      U.text(ctx, q.label, q.x + q.w / 2, q.y + q.h / 2 + 1, q.out ? 12 : 12, '#fff', 'center', 800);
      const b = bets[q.id];
      if (b) { U.circle(ctx, q.x + q.w / 2, q.y + q.h / 2, 11, '#ffd23f'); U.text(ctx, b, q.x + q.w / 2, q.y + q.h / 2 + 1, 10, '#5a3a00', 'center', 900); }
    });
    U.text(ctx, 'Credits ' + credits, 24, 452, 16, '#9fe3b5', 'left', 800);
    U.text(ctx, 'Bet ' + staked(), 24, 474, 13, '#ffd23f', 'left', 700);
    CHIPS.forEach((v, i) => { const r = chipBtn(i); U.circle(ctx, r.x + 20, r.y + 20, 19, chip === v ? '#ffd23f' : '#7a5a8a'); U.text(ctx, v, r.x + 20, r.y + 21, 14, chip === v ? '#5a3a00' : '#fff', 'center', 900); });
    U.btn(ctx, BTN.spin, spinning > 0 ? '…' : 'SPIN', '#e0245e', 26, spinning > 0);
    U.btn(ctx, BTN.clear, 'Clear', '#4a5a88', 15, spinning > 0);
    U.text(ctx, 'Numbers pay 35:1 · dozens 2:1 · colour, odd/even, halves 1:1', W / 2, 590, 12, '#a88c8c');
  }
});
