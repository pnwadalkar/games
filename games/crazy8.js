// Crazy Eights vs the computer: match the suit or rank of the top card. Eights are wild. First to empty their hand wins.
Hub.register('crazy8', (api) => {
  const W = 440, H = 600, CW = 70, CH = 100;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let deck = U.deck(), you = [], cpu = [], pile = [], suit = 0, turn = 'you', picking = false, msg = '', t = 0, busy = false;
  for (let i = 0; i < 7; i++) { you.push(deck.pop()); cpu.push(deck.pop()); }
  let first = deck.pop(); while (first.r === 8) { deck.unshift(first); first = deck.pop(); }
  pile.push(first); suit = first.s; first.up = true; you.forEach(k => { k.up = true; });
  api.status('Your turn — play a card or draw');
  const top = () => pile[pile.length - 1];
  const ok = k => k.r === 8 || k.s === suit || k.r === top().r;
  const SUITBTN = i => ({ x: 50 + i * 85, y: 330, w: 70, h: 56 });
  const DRAW = { x: W / 2 - CW - 20, y: 190, w: CW, h: CH };
  const handX = i => { const n = you.length, step = Math.min(CW + 4, (W - 40 - CW) / Math.max(1, n - 1)); return (W - (step * (n - 1) + CW)) / 2 + i * step; };
  const HY = 450;

  function reshuffle() { if (deck.length) return; const t0 = pile.pop(); deck = U.shuffle(pile.splice(0)); pile = [t0]; }
  function draw1(hand) { reshuffle(); if (!deck.length) return false; const k = deck.pop(); k.up = hand === you; hand.push(k); return true; }
  function win(who) {
    api.end({ win: who === 'you', title: who === 'you' ? 'You win!' : 'CPU wins', msg: who === 'you' ? 'Your hand is empty.' : 'The computer emptied its hand.', emoji: '🃏' });
  }
  function playCard(hand, i, who) {
    const k = hand.splice(i, 1)[0]; k.up = true; pile.push(k); suit = k.s; api.sfx('flip');
    if (!hand.length) return win(who);
    if (k.r === 8) {
      if (who === 'you') { picking = true; api.status('Pick a suit'); return; }
      const cnt = [0, 0, 0, 0]; hand.forEach(q => cnt[q.s]++); suit = cnt.indexOf(Math.max(...cnt)); msg = 'CPU chose ' + U.SUITS[suit];
    }
    endTurn(who);
  }
  function endTurn(who) {
    turn = who === 'you' ? 'cpu' : 'you';
    api.status(turn === 'you' ? 'Your turn — play a card or draw' : 'CPU is thinking…');
    if (turn === 'cpu') api.after(800, cpuPlay);
  }
  function cpuPlay() {
    if (api.over) return;
    let i = cpu.findIndex(k => ok(k) && k.r !== 8);
    if (i < 0) i = cpu.findIndex(k => k.r === 8);
    if (i >= 0) return playCard(cpu, i, 'cpu');
    for (let n = 0; n < 6; n++) { if (!draw1(cpu)) break; if (ok(cpu[cpu.length - 1])) { api.sfx('click'); return api.after(500, () => playCard(cpu, cpu.length - 1, 'cpu')); } }
    msg = 'CPU drew and passed'; endTurn('cpu');
  }
  api.pointer(c, { down: (x, y) => {
    if (api.over) return;
    if (picking) { for (let i = 0; i < 4; i++) if (U.inR(x, y, SUITBTN(i))) { suit = i; picking = false; msg = 'You chose ' + U.SUITS[i]; api.sfx('click'); endTurn('you'); } return; }
    if (turn !== 'you') return;
    for (let i = you.length - 1; i >= 0; i--) {
      const r = { x: handX(i), y: HY - (ok(you[i]) ? 12 : 0), w: i === you.length - 1 ? CW : Math.min(CW, handX(i + 1) - handX(i)), h: CH };
      if (U.inR(x, y, r)) { if (ok(you[i])) { msg = ''; playCard(you, i, 'you'); } else { api.sfx('bad'); api.toast('That card does not match', 700); } return; }
    }
    if (U.inR(x, y, DRAW)) {
      if (you.some(ok)) { api.toast('You have a playable card', 800); return; }
      if (!draw1(you)) { msg = 'Deck empty — you pass'; endTurn('you'); return; }
      api.sfx('flip');
      if (!ok(you[you.length - 1])) { for (let n = 0; n < 2 && !ok(you[you.length - 1]); n++) draw1(you); }
      if (!you.some(ok)) { msg = 'No play — pass'; endTurn('you'); }
    }
  } });
  api.loop(dt => { t += dt; }, draw, true);

  function draw() {
    const g = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 420);
    g.addColorStop(0, '#13653a'); g.addColorStop(1, '#073a20');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // CPU hand (backs)
    const n = cpu.length, step = Math.min(34, (W - 80) / Math.max(1, n));
    cpu.forEach((_, i) => U.drawCard(ctx, (W - (step * (n - 1) + 50)) / 2 + i * step, 30, 50, 72, null, true));
    U.text(ctx, 'CPU · ' + cpu.length, W / 2, 20, 13, '#bfe8cf', 'center', 800);
    // stock + pile
    for (let i = 2; i >= 0; i--) U.drawCard(ctx, DRAW.x - i, DRAW.y - i * 2, CW, CH, null, true);
    U.text(ctx, 'Draw', DRAW.x + CW / 2, DRAW.y + CH + 16, 12, '#bfe8cf', 'center', 700);
    U.drawCard(ctx, W / 2 + 20, 190, CW, CH, top());
    const red = suit === 1 || suit === 2;
    U.circle(ctx, W / 2 + 20 + CW + 28, 190 + 24, 20, '#fff'); U.text(ctx, U.SUITS[suit], W / 2 + 20 + CW + 28, 190 + 25, 26, red ? '#e0244a' : '#1b1e33');
    U.text(ctx, msg, W / 2, 330, 15, '#ffe27a', 'center', 800);
    if (picking) {
      U.text(ctx, 'Choose the new suit', W / 2, 308, 17, '#fff', 'center', 800);
      for (let i = 0; i < 4; i++) { const r = SUITBTN(i); U.btn(ctx, r, U.SUITS[i], '#fff', 30); U.text(ctx, U.SUITS[i], r.x + r.w / 2, r.y + r.h / 2 + 1, 30, i === 1 || i === 2 ? '#e0244a' : '#1b1e33'); }
    }
    you.forEach((k, i) => U.drawCard(ctx, handX(i), HY - (turn === 'you' && ok(k) && !picking ? 12 : 0), CW, CH, k));
    U.text(ctx, turn === 'you' ? 'Your move' : '', W / 2, 580, 14, '#9fe3b5', 'center', 800);
  }
});
