// Simon: watch the colour sequence, then repeat it. It grows by one each round.
Hub.register('simon', (api, o) => {
  const S = 480, R = 220, CX = S / 2, CY = S / 2;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const PADS = [['#2ee59d', '#0e6b48', 329.6], ['#ff5c7a', '#7a1f30', 261.6], ['#ffc94d', '#7a5d16', 220], ['#00a2ff', '#0c4a75', 164.8]];
  let seq = [], pos = 0, lit = -1, mode = 'watch', round = 0;
  const speed = o.fast ? .6 : 1;

  function flash(i, ms) {
    lit = i;
    api.tone(PADS[i][2], ms / 1000, 'triangle', .12);
    api.after(ms, () => { lit = -1; });
  }
  function nextRound() {
    seq.push(U.randi(0, 3));
    round = seq.length;
    mode = 'watch';
    pos = 0;
    const gap = Math.max(220, 620 - round * 25) * speed;
    seq.forEach((p, i) => api.after(700 + i * gap, () => flash(p, gap * .7)));
    api.after(700 + seq.length * gap, () => { mode = 'input'; });
  }
  api.after(400, nextRound);

  function press(i) {
    if (mode !== 'input') return;
    flash(i, 250);
    if (i !== seq[pos]) {
      mode = 'over';
      api.tone(110, .6, 'sawtooth', .1);
      return api.end({ msg: 'You remembered ' + (round - 1) + ' step' + (round === 2 ? '' : 's'), score: round - 1, emoji: '🔴' });
    }
    pos++;
    if (pos === seq.length) { api.setScore(round); mode = 'watch'; api.after(500, nextRound); }
  }
  api.pointer(c, {
    down: (x, y) => {
      const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy);
      if (d < 70 || d > R) return;
      press(dy < 0 ? (dx < 0 ? 0 : 1) : (dx < 0 ? 2 : 3));
    }
  });
  api.onKey((k, raw) => {
    const map = { up: 0, right: 1, left: 2, down: 3, '1': 0, '2': 1, '3': 2, '4': 3, q: 0, w: 1, a: 2, s: 3 };
    const v = raw && map[raw] != null ? map[raw] : map[k];
    if (v != null) press(v);
  });

  api.loop(() => {}, () => {
    c.clear('#10163a');
    PADS.forEach((p, i) => {
      const a0 = [Math.PI, Math.PI * 1.5, Math.PI * .5, 0][i];
      ctx.beginPath();
      ctx.arc(CX, CY, R, a0 + .04, a0 + Math.PI / 2 - .04);
      ctx.arc(CX, CY, 78, a0 + Math.PI / 2 - .1, a0 + .1, true);
      ctx.closePath();
      ctx.fillStyle = lit === i ? p[0] : p[1];
      if (lit === i) { ctx.shadowColor = p[0]; ctx.shadowBlur = 40; }
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    U.circle(ctx, CX, CY, 70, '#1b2250');
    U.text(ctx, round, CX, CY - 8, 36, '#fff', 'center', 900);
    U.text(ctx, mode === 'input' ? 'your turn' : mode === 'watch' ? 'watch' : '', CX, CY + 24, 13, '#8f99c4');
  }, true);
});
