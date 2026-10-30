// Video Poker (Jacks or Better): hold the cards you want, draw once, and get paid for the best hand.
Hub.register('videopoker', (api) => {
  const W = 400, H = 560, CW = 68, CH = 98, GAP = 10, X0 = (W - (5 * CW + 4 * GAP)) / 2, CY = 250;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const PAY = [['Royal Flush', 250], ['Straight Flush', 50], ['Four of a Kind', 25], ['Full House', 9], ['Flush', 6], ['Straight', 4], ['Three of a Kind', 3], ['Two Pair', 2], ['Jacks or Better', 1]];
  const BET = 5;
  let deck, hand = [], held = [false, false, false, false, false], phase = 'bet', credits = 100, result = null, flash = 0, t = 0;
  api.setScore(credits);

  function evalHand(h) {
    const r = h.map(x => x.r).sort((a, b) => a - b), s = h.map(x => x.s), cnt = {};
    r.forEach(v => { cnt[v] = (cnt[v] || 0) + 1; });
    const counts = Object.values(cnt).sort((a, b) => b - a), flush = s.every(v => v === s[0]);
    const uniq = [...new Set(r)];
    const straight = uniq.length === 5 && (r[4] - r[0] === 4 || r.join() === '1,10,11,12,13');
    const royal = r.join() === '1,10,11,12,13';
    if (royal && flush) return 0; if (straight && flush) return 1; if (counts[0] === 4) return 2; if (counts[0] === 3 && counts[1] === 2) return 3;
    if (flush) return 4; if (straight) return 5; if (counts[0] === 3) return 6; if (counts[0] === 2 && counts[1] === 2) return 7;
    if (counts[0] === 2) { const p = +Object.keys(cnt).find(k => cnt[k] === 2); if (p === 1 || p >= 11) return 8; }
    return -1;
  }
  const BTN = { deal: { x: W / 2 - 90, y: 430, w: 180, h: 60 } };

  function deal() {
    if (api.over) return;
    if (phase === 'bet') {
      if (credits < BET) return;
      credits -= BET; deck = U.deck(); hand = [0, 1, 2, 3, 4].map(() => { const k = deck.pop(); k.up = true; return k; });
      held = [false, false, false, false, false]; phase = 'hold'; result = null; api.sfx('flip');
    } else if (phase === 'hold') {
      hand = hand.map((k, i) => (held[i] ? k : (() => { const n = deck.pop(); n.up = true; return n; })()));
      phase = 'bet'; const e = evalHand(hand); result = e;
      if (e >= 0) { const w = PAY[e][1] * BET; credits += w; flash = 1.5; api.sfx(e <= 3 ? 'win' : 'coin'); }
      else api.sfx('bad');
      api.setScore(Math.max(api.score, credits));
      if (credits < BET) api.end({ msg: 'Peak balance ' + api.score + ' credits', emoji: '🃏', score: api.score });
    }
  }
  api.pointer(c, { down: (x, y) => {
    if (U.inR(x, y, BTN.deal)) return deal();
    if (phase !== 'hold') return;
    hand.forEach((_, i) => { if (U.inR(x, y, { x: X0 + i * (CW + GAP), y: CY - 20, w: CW, h: CH + 40 })) { held[i] = !held[i]; api.sfx('click'); } });
  } });
  api.onKey(k => { if (k === 'a') deal(); if (phase === 'hold') { const i = { left: 0, up: 1, down: 2, right: 3 }[k]; if (i !== undefined) held[i] = !held[i]; } });
  api.on(window, 'keydown', e => { if (phase === 'hold' && /^[1-5]$/.test(e.key)) { held[+e.key - 1] = !held[+e.key - 1]; api.sfx('click'); } });
  api.loop(dt => { t += dt; flash = Math.max(0, flash - dt); }, draw, true);

  function draw() {
    const g = ctx.createRadialGradient(W / 2, 240, 40, W / 2, 240, 420);
    g.addColorStop(0, '#0f6b3a'); g.addColorStop(1, '#073a20');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // pay table
    ctx.fillStyle = 'rgba(0,0,0,.35)'; U.rr(ctx, 14, 10, W - 28, 168, 12); ctx.fill();
    PAY.forEach((p, i) => {
      const hit = result === i && flash > 0, y = 26 + i * 16.5;
      U.text(ctx, p[0], 28, y, 12, hit ? '#ffe27a' : '#bfe8cf', 'left', hit ? 900 : 600);
      U.text(ctx, p[1] * BET, W - 28, y, 12, hit ? '#ffe27a' : '#bfe8cf', 'right', hit ? 900 : 600);
    });
    for (let i = 0; i < 5; i++) {
      const x = X0 + i * (CW + GAP), y = CY - (held[i] ? 14 : 0);
      if (hand[i]) U.drawCard(ctx, x, y, CW, CH, hand[i], false); else U.drawCard(ctx, x, y, CW, CH, null, true);
      if (held[i]) U.text(ctx, 'HELD', x + CW / 2, y + CH + 20, 14, '#ffe27a', 'center', 900);
    }
    const msg = phase === 'hold' ? 'Tap cards to hold, then DRAW' : result == null ? 'Press DEAL (bet ' + BET + ')' : result >= 0 ? PAY[result][0] + ' — +' + PAY[result][1] * BET : 'No win';
    U.text(ctx, msg, W / 2, 392, 19, result >= 0 && phase === 'bet' ? '#ffe27a' : '#e6fff0', 'center', 800);
    U.btn(ctx, BTN.deal, phase === 'hold' ? 'DRAW' : 'DEAL', '#e0245e', 26, phase === 'bet' && credits < BET);
    U.text(ctx, 'Credits ' + credits, W / 2, 520, 17, '#9fe3b5', 'center', 800);
  }
});
