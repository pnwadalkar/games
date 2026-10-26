// Blackjack: beat the dealer without going over 21. Start with 100 chips; blackjack pays 3:2.
Hub.register('blackjack', (api) => {
  const W = 560, H = 640, CW = 76, CH = 108;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let shoe = [], chips = 100, bet = 10, player = [], dealer = [], phase = 'bet', msg = 'Choose your bet', hands = 0, doubled = false;
  api.setScore(chips);

  const draw1 = () => { if (shoe.length < 15) shoe = U.deck().concat(U.deck()); const k = shoe.pop(); k.up = true; return k; };
  function total(hand) {
    let t = 0, aces = 0;
    hand.forEach(k => { if (k.up === false) return; t += k.r === 1 ? 11 : Math.min(10, k.r); if (k.r === 1) aces++; });
    while (t > 21 && aces) { t -= 10; aces--; }
    return t;
  }
  const isBJ = h => h.length === 2 && total(h) === 21;
  function deal() {
    if (bet > chips) bet = chips;
    chips -= bet;
    doubled = false;
    player = [draw1(), draw1()];
    dealer = [draw1(), draw1()];
    dealer[1].up = false;
    phase = 'play';
    msg = '';
    api.sfx('flip');
    if (isBJ(player) || (dealer[0].r === 1 || dealer[0].r >= 10) && isBJ(dealer.map(k => ({ ...k, up: true })))) { api.after(500, settle); phase = 'wait'; }
    api.setScore(chips);
  }
  function hit() {
    player.push(draw1());
    api.sfx('flip');
    if (total(player) > 21) { phase = 'wait'; api.after(400, settle); }
    else if (total(player) === 21) stand();
  }
  function stand() {
    phase = 'dealer';
    dealer[1].up = true;
    api.sfx('flip');
    const step = () => {
      if (total(dealer) < 17 && total(player) <= 21 && !isBJ(player)) { dealer.push(draw1()); api.sfx('flip'); api.after(550, step); }
      else settle();
    };
    api.after(500, step);
  }
  function double() {
    if (chips < bet || player.length !== 2) return;
    chips -= bet; bet *= 2; doubled = true;
    player.push(draw1());
    api.sfx('flip');
    api.setScore(chips);
    if (total(player) > 21) { phase = 'wait'; api.after(400, settle); } else stand();
  }
  function settle() {
    dealer.forEach(k => { k.up = true; });
    const p = total(player), d = total(dealer);
    let win = 0;
    if (p > 21) { msg = 'Bust! You lose ' + bet; }
    else if (isBJ(player) && !isBJ(dealer)) { win = Math.floor(bet * 2.5); msg = 'Blackjack! +' + (win - bet); }
    else if (isBJ(dealer) && !isBJ(player)) { msg = 'Dealer blackjack'; }
    else if (d > 21) { win = bet * 2; msg = 'Dealer busts! +' + bet; }
    else if (p > d) { win = bet * 2; msg = 'You win +' + bet; }
    else if (p === d) { win = bet; msg = 'Push'; }
    else msg = 'Dealer wins';
    chips += win;
    api.sfx(win > bet ? 'coin' : win === bet ? 'click' : 'bad');
    if (doubled) bet /= 2;
    hands++;
    phase = 'bet';
    api.setScore(chips);
    if (chips <= 0) api.end({ title: 'Out of chips', msg: hands + ' hands played', emoji: '🃏', score: 0 });
  }

  const BTNS = {
    bet: [['−', () => { bet = Math.max(5, bet - 5); api.sfx('click'); }], ['Deal', deal], ['+', () => { bet = Math.min(chips, bet + 5); api.sfx('click'); }]],
    play: [['Hit', hit], ['Stand', stand], ['Double', double]]
  };
  const btnRects = () => {
    const list = BTNS[phase] || [];
    const bw = 150, gap = 12, x0 = (W - (list.length * bw + (list.length - 1) * gap)) / 2;
    return list.map((b, i) => ({ x: x0 + i * (bw + gap), y: H - 86, w: bw, h: 58, l: b[0], f: b[1] }));
  };
  api.pointer(c, { down: (x, y) => { const b = btnRects().find(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h); if (b) b.f(); } });
  api.onKey((k, raw) => {
    if (phase === 'bet' && (k === 'a')) deal();
    else if (phase === 'bet' && k === 'up') BTNS.bet[2][1]();
    else if (phase === 'bet' && k === 'down') BTNS.bet[0][1]();
    else if (phase === 'play') { if (raw === 'h' || raw === 'H') hit(); if (raw === 's' || raw === 'S') stand(); if (raw === 'd' || raw === 'D') double(); }
  });

  function hand(cards, y, label) {
    const x0 = W / 2 - (cards.length * 46 + CW - 46) / 2;
    cards.forEach((k, i) => U.drawCard(ctx, x0 + i * 46, y, CW, CH, k, !k.up));
    if (cards.length) U.text(ctx, label + ' · ' + total(cards), W / 2, y - 18, 16, '#d4f7e0', 'center', 700);
  }
  api.loop(() => {}, () => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 420);
    g.addColorStop(0, '#1f8a55'); g.addColorStop(1, '#0d4d2e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    hand(dealer, 70, 'Dealer');
    hand(player, 330, 'You');
    U.text(ctx, msg, W / 2, 268, 24, '#ffe58a', 'center', 800);
    U.text(ctx, '🪙 ' + chips, 16, 22, 18, '#fff', 'left', 800);
    U.text(ctx, 'Bet ' + bet, W - 16, 22, 18, '#fff', 'right', 800);
    btnRects().forEach(b => {
      ctx.fillStyle = b.l === 'Deal' ? '#ffc94d' : 'rgba(0,0,0,.35)';
      U.rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
      U.text(ctx, b.l, b.x + b.w / 2, b.y + b.h / 2, 20, b.l === 'Deal' ? '#3a2a00' : '#fff', 'center', 800);
    });
  }, true);
});
