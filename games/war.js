// War: flip a card each turn; the higher card takes both. Ties start a war. Collect all the cards.
Hub.register('war', (api) => {
  const W = 420, H = 560, CW = 120, CH = 172;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const d = U.deck();
  let you = d.slice(0, 26), cpu = d.slice(26), pile = [], a = null, b = null, msg = 'Tap to flip', busy = false, rounds = 0, flip = 1, auto = false, t = 0, warCards = 0;
  const val = k => (k.r === 1 ? 14 : k.r);
  const BTN = { flip: { x: W / 2 - 120, y: 462, w: 150, h: 54 }, auto: { x: W / 2 + 40, y: 462, w: 80, h: 54 } };
  const status = () => api.status('You ' + (you.length + (busy ? 0 : 0)) + ' · CPU ' + cpu.length);
  status();

  function play() {
    if (busy || api.over) return;
    if (!you.length || !cpu.length) return;
    busy = true; rounds++; flip = 0; api.sfx('flip');
    a = you.shift(); b = cpu.shift(); pile.push(a, b);
    a.up = b.up = true;
    api.after(650, resolve);
  }
  function resolve() {
    const va = val(a), vb = val(b);
    if (va === vb) {
      msg = 'WAR!'; api.sfx('boom'); warCards = Math.min(3, you.length - 1, cpu.length - 1);
      if (warCards < 0) warCards = 0;
      for (let i = 0; i < warCards; i++) pile.push(you.shift(), cpu.shift());
      if (!you.length || !cpu.length) return finish();
      busy = false; api.after(500, () => { warCards = 0; busy = false; play(); }); busy = true; return;
    }
    const winner = va > vb ? you : cpu;
    pile.forEach(k => { k.up = false; });
    winner.push(...U.shuffle(pile)); pile = [];
    msg = va > vb ? 'You win the round' : 'CPU wins the round'; api.sfx(va > vb ? 'coin' : 'bad');
    status(); busy = false;
    if (!you.length || !cpu.length || rounds >= 400) return finish();
    if (auto) api.after(450, play);
  }
  function finish() {
    const youWin = you.length >= cpu.length;
    api.end({ win: youWin, title: youWin ? 'You win the war!' : 'CPU wins', msg: 'Final count: you ' + you.length + ' · CPU ' + cpu.length + ' after ' + rounds + ' rounds', emoji: '⚔️' });
  }
  api.pointer(c, { down: (x, y) => { if (U.inR(x, y, BTN.auto)) { auto = !auto; if (auto) play(); } else play(); } });
  api.onKey(k => { if (k === 'a') play(); });
  api.loop(dt => { t += dt; flip = Math.min(1, flip + dt * 4); }, draw, true);

  function stack(x, y, n, label) {
    for (let i = Math.min(6, Math.ceil(n / 5)) - 1; i >= 0; i--) U.drawCard(ctx, x - i * 1.2, y - i * 2.5, 70, 100, null, true);
    U.text(ctx, label + ' · ' + n, x + 35, y + 118, 14, '#e6ffe9', 'center', 800);
  }
  function draw() {
    const g = ctx.createRadialGradient(W / 2, 220, 40, W / 2, 220, 400);
    g.addColorStop(0, '#0f6b3a'); g.addColorStop(1, '#063a1e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stack(40, 26, cpu.length, 'CPU'); stack(W - 110, 340, you.length, 'You');
    const sx = Math.max(.04, Math.abs(Math.cos(flip * Math.PI / 2 + (flip < 1 ? Math.PI / 2 : 0))));
    [[a, 70, 100], [b, W - 70 - CW, 100]].forEach(([k, x, y], i) => {
      if (!k) return;
      ctx.save(); ctx.translate(x + CW / 2, y + CH / 2 + (i ? 30 : 0)); ctx.scale(flip < 1 ? Math.max(.05, flip) : 1, 1);
      U.drawCard(ctx, -CW / 2, -CH / 2, CW, CH, k);
      ctx.restore();
    });
    if (warCards) for (let i = 0; i < warCards; i++) { U.drawCard(ctx, W / 2 - 25 + i * 8, 190 + i * 6, 50, 72, null, true); }
    U.text(ctx, msg, W / 2, 396, 26, msg === 'WAR!' ? '#ff6b6b' : '#fff', 'center', 900);
    U.btn(ctx, BTN.flip, busy ? '…' : 'FLIP', '#e0245e', 24, busy);
    U.btn(ctx, BTN.auto, auto ? 'Auto ✓' : 'Auto', auto ? '#2ea84a' : '#4a5a88', 15);
  }
});
