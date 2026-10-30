// Slot Machine: pick a bet and spin. Three matching symbols win big. You start with 100 credits.
Hub.register('slots', (api) => {
  const W = 400, H = 580, RW = 104, RH = 150, SH = 62, CX = W / 2, CY = 220;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const SYM = [['🍒', 5], ['🍋', 8], ['🍊', 10], ['🍇', 15], ['🔔', 25], ['⭐', 40], ['💎', 75], ['7️⃣', 150]];
  const WEIGHT = [26, 22, 18, 14, 10, 6, 3, 1];
  const n = SYM.length;
  const reels = [0, 1, 2].map(i => ({ pos: U.randi(0, n - 1), start: 0, target: 0, t: 1, dur: 1, res: 0 }));
  let credits = 100, bet = 5, spinning = false, win = 0, winFlash = 0, t = 0, msg = 'Pick a bet and press SPIN';
  api.setScore(credits);

  const BTN = { spin: { x: W / 2 - 90, y: 440, w: 180, h: 64 }, b1: { x: 36, y: 456, w: 62, h: 40 }, b5: { x: 106, y: 456, w: 62, h: 40 }, b10: { x: W - 168, y: 456, w: 62, h: 40 }, bmax: { x: W - 98, y: 456, w: 62, h: 40 } };
  const pickSym = () => { let r = Math.random() * WEIGHT.reduce((a, b) => a + b, 0); for (let i = 0; i < n; i++) { r -= WEIGHT[i]; if (r <= 0) return i; } return 0; };
  const setBet = v => { if (spinning) return; bet = Math.min(v, credits); api.sfx('click'); };

  function spin() {
    if (spinning || api.over) return;
    if (credits < bet) { if (credits <= 0) return; bet = credits; }
    credits -= bet; api.setScore(Math.max(credits, api.score)); spinning = true; win = 0; msg = 'Good luck!';
    reels.forEach((r, i) => {
      r.res = pickSym(); r.start = r.pos;
      const cur = ((Math.round(r.pos) % n) + n) % n;
      r.target = r.pos + 16 + i * 7 + ((r.res - cur + n) % n); r.t = 0; r.dur = 1.3 + i * .55;
    });
    api.sfx('flip');
  }
  api.pointer(c, { down: (x, y) => {
    if (U.inR(x, y, BTN.spin)) spin();
    else if (U.inR(x, y, BTN.b1)) setBet(1); else if (U.inR(x, y, BTN.b5)) setBet(5); else if (U.inR(x, y, BTN.b10)) setBet(10); else if (U.inR(x, y, BTN.bmax)) setBet(credits);
  } });
  api.onKey(k => { if (k === 'a' || k === 'down') spin(); if (k === 'up') setBet(Math.min(credits, bet + 5)); });

  function settle() {
    spinning = false;
    const r = reels.map(q => q.res);
    let mult = 0;
    if (r[0] === r[1] && r[1] === r[2]) mult = SYM[r[0]][1];
    else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = r.filter(v => v === 0).length >= 2 ? 2 : 1;
    win = bet * mult;
    if (win > 0) { credits += win; winFlash = 1.2; api.sfx(mult >= 25 ? 'win' : 'coin'); msg = mult >= 5 ? 'WIN ' + win + '!' : 'Pair — you win ' + win; }
    else msg = 'No luck. Try again!';
    api.setScore(Math.max(credits, api.score));
    if (credits <= 0) api.end({ msg: 'Peak balance ' + api.score + ' credits', emoji: '🎰', score: api.score });
    else if (bet > credits) bet = credits;
  }

  api.loop(dt => {
    t += dt; winFlash = Math.max(0, winFlash - dt);
    if (!spinning) return;
    let done = true;
    reels.forEach(r => {
      if (r.t < 1) { r.t = Math.min(1, r.t + dt / r.dur); const e = 1 - Math.pow(1 - r.t, 3); r.pos = r.start + (r.target - r.start) * e; if (r.t < 1) done = false; else api.sfx('click'); }
    });
    if (done) settle();
  }, draw, true);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3a0d4a'); g.addColorStop(1, '#14061f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    U.text(ctx, 'LUCKY SLOTS', CX, 44, 30, '#ffd23f', 'center', 900);
    // cabinet
    ctx.fillStyle = '#7a1f3d'; U.rr(ctx, 24, 80, W - 48, 330, 26); ctx.fill();
    ctx.fillStyle = '#10051a'; U.rr(ctx, 38, 94, W - 76, 302, 18); ctx.fill();
    reels.forEach((r, i) => {
      const x = CX + (i - 1) * (RW + 6) - RW / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(x, CY - RH / 2, RW, RH); ctx.clip();
      const lg = ctx.createLinearGradient(0, CY - RH / 2, 0, CY + RH / 2);
      lg.addColorStop(0, '#9a98b8'); lg.addColorStop(.5, '#ffffff'); lg.addColorStop(1, '#9a98b8');
      ctx.__flat = true; ctx.fillStyle = lg; ctx.fillRect(x, CY - RH / 2, RW, RH); ctx.__flat = false;
      const base = Math.floor(r.pos);
      for (let o = -2; o <= 3; o++) {
        const idx = base + o, d = idx - r.pos, ang = d * .72;
        if (Math.abs(ang) > 1.4) continue;
        const sy = Math.cos(ang), y = CY + Math.sin(ang) * SH * 1.25;
        ctx.save(); ctx.translate(x + RW / 2, y); ctx.scale(1, Math.max(.2, sy));
        U.text(ctx, SYM[((idx % n) + n) % n][0], 0, 0, 56);
        ctx.restore();
      }
      ctx.restore();
      ctx.__flat = true; ctx.strokeStyle = '#2a1030'; ctx.lineWidth = 4; ctx.strokeRect(x, CY - RH / 2, RW, RH); ctx.__flat = false;
    });
    // payline
    ctx.__flat = true; ctx.strokeStyle = winFlash > 0 ? 'rgba(255,226,122,' + (.5 + Math.sin(t * 20) * .5) + ')' : 'rgba(255,77,109,.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(44, CY); ctx.lineTo(W - 44, CY); ctx.stroke(); ctx.__flat = false;
    U.text(ctx, msg, CX, 358, 20, winFlash > 0 ? '#ffe27a' : '#cfc3ee', 'center', 800);
    U.text(ctx, 'Credits ' + credits, 48, 120 + 0, 15, '#9fe3b5', 'left', 800);
    U.text(ctx, 'Bet ' + bet, W - 48, 120, 15, '#ffd23f', 'right', 800);
    U.btn(ctx, BTN.b1, '1', bet === 1 ? '#2ea84a' : '#4a3a7a', 16); U.btn(ctx, BTN.b5, '5', bet === 5 ? '#2ea84a' : '#4a3a7a', 16);
    U.btn(ctx, BTN.b10, '10', bet === 10 ? '#2ea84a' : '#4a3a7a', 16); U.btn(ctx, BTN.bmax, 'MAX', bet === credits ? '#2ea84a' : '#4a3a7a', 14);
    U.btn(ctx, BTN.spin, spinning ? '…' : 'SPIN', '#e0245e', 28, spinning);
    SYM.slice(2).forEach((s, i) => U.text(ctx, s[0] + '×' + s[1], 30 + i * 62, 548, 13, '#8f84b8', 'left', 700));
  }
});
