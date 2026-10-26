// Higher or Lower: guess whether the next card is higher or lower. Build the longest streak.
Hub.register('hilo', (api) => {
  const W = 480, H = 560, CW = 150, CH = 214;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let deck = U.deck(), cur = deck.pop(), next = null, streak = 0, msg = 'Will the next card be higher or lower?', busy = false, flip = 0;
  cur.up = true;

  function guess(dir) {
    if (busy || api.over) return;
    if (deck.length < 2) deck = U.deck();
    next = deck.pop();
    next.up = true;
    busy = true; flip = 0;
    api.sfx('flip');
    api.after(650, () => {
      const v = n => n.r === 1 ? 14 : n.r;
      const d = v(next) - v(cur);
      if (d === 0) { msg = 'Same value — free pass!'; api.sfx('click'); }
      else if ((d > 0) === (dir === 'up')) { streak++; api.setScore(streak); msg = 'Correct! Streak ' + streak; api.sfx('coin'); }
      else { msg = 'Wrong!'; return api.end({ msg: 'Streak of ' + streak, emoji: '🃏', score: streak }); }
      cur = next; next = null; busy = false;
    });
  }
  const BH = { x: 40, y: 430, w: 190, h: 80 }, BL = { x: 250, y: 430, w: 190, h: 80 };
  const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  api.pointer(c, { down: (x, y) => { if (inR(x, y, BH)) guess('up'); else if (inR(x, y, BL)) guess('down'); } });
  api.onKey(k => { if (k === 'up' || k === 'right') guess('up'); if (k === 'down' || k === 'left') guess('down'); });

  api.loop(dt => { flip = Math.min(1, flip + dt * 3); }, () => {
    c.clear('#123a6b');
    U.text(ctx, 'Streak ' + streak, W / 2, 34, 22, '#fff', 'center', 800);
    U.drawCard(ctx, next ? 60 : W / 2 - CW / 2, 80, CW, CH, cur);
    if (next) {
      const sx = Math.abs(Math.cos(flip * Math.PI));
      ctx.save();
      ctx.translate(W - 60 - CW / 2, 80 + CH / 2);
      ctx.scale(Math.max(.03, sx), 1);
      U.drawCard(ctx, -CW / 2, -CH / 2, CW, CH, next, flip < .5);
      ctx.restore();
    }
    U.text(ctx, msg, W / 2, 350, 18, '#cfe3ff', 'center', 600);
    U.text(ctx, 'Aces are high · ' + deck.length + ' cards left', W / 2, 385, 13, '#7fa3d6');
    [[BH, '▲ Higher', '#2ee59d'], [BL, '▼ Lower', '#ff5c7a']].forEach(([r, l, col]) => {
      ctx.fillStyle = busy ? '#2a4a7a' : col;
      U.rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill();
      U.text(ctx, l, r.x + r.w / 2, r.y + r.h / 2, 24, '#0b1020', 'center', 900);
    });
  }, true);
});
