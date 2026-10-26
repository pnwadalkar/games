// Rock Paper Scissors vs a CPU that learns your habits. First to 5 wins the match.
Hub.register('rps', (api) => {
  const W = 480, H = 560, WIN = 5;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const E = ['✊', '✋', '✌️'], N = ['Rock', 'Paper', 'Scissors'];
  let you = 0, cpu = 0, last = null, msg = 'Make your move!', anim = 0;
  const hist = [], trans = {};

  function cpuPick() {
    // predict the player's next move from what followed their previous move, then counter it
    if (hist.length >= 3 && Math.random() < .75) {
      const t = trans[hist[hist.length - 1]];
      if (t) { const guess = [0, 1, 2].sort((a, b) => (t[b] || 0) - (t[a] || 0))[0]; return (guess + 1) % 3; }
    }
    return U.randi(0, 2);
  }
  function play(p) {
    if (api.over || anim > 0) return;
    const q = cpuPick();
    if (hist.length) { const prev = hist[hist.length - 1]; trans[prev] = trans[prev] || {}; trans[prev][p] = (trans[prev][p] || 0) + 1; }
    hist.push(p);
    last = [p, q];
    anim = .6;
    api.sfx('click');
    api.after(600, () => {
      const r = (p - q + 3) % 3;
      if (r === 0) { msg = 'Draw!'; api.sfx('hit'); }
      else if (r === 1) { you++; msg = N[p] + ' beats ' + N[q]; api.sfx('coin'); }
      else { cpu++; msg = N[q] + ' beats ' + N[p]; api.sfx('bad'); }
      if (you >= WIN || cpu >= WIN) {
        const st = Hub.LS.get('rps:streak', 0);
        const ns = you >= WIN ? st + 1 : 0;
        Hub.LS.set('rps:streak', ns);
        api.setScore(ns);
        api.end({ win: you >= WIN, title: you >= WIN ? 'You win the match!' : 'CPU wins the match', msg: you + ' – ' + cpu + ' · match streak ' + ns, emoji: you >= WIN ? '🏆' : '🤖' });
      }
    });
  }
  api.setScore(Hub.LS.get('rps:streak', 0));
  const br = i => ({ x: 30 + i * 145, y: 400, w: 130, h: 120 });
  api.pointer(c, { down: (x, y) => { for (let i = 0; i < 3; i++) { const r = br(i); if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) play(i); } } });
  api.onKey((k, raw) => { const d = { '1': 0, '2': 1, '3': 2, r: 0, p: 1, s: 2 }[raw]; if (d != null) play(d); });

  api.loop(dt => { anim = Math.max(0, anim - dt); }, () => {
    c.clear('#10163a');
    U.text(ctx, 'You ' + you, 120, 40, 26, '#00d4ff', 'center', 900);
    U.text(ctx, cpu + ' CPU', W - 120, 40, 26, '#ff5c7a', 'center', 900);
    U.text(ctx, 'First to ' + WIN, W / 2, 40, 13, '#5d6799');
    if (last) {
      const shake = anim > 0 ? Math.sin(anim * 30) * 14 : 0;
      U.text(ctx, anim > 0 ? '✊' : E[last[0]], 120, 190 + shake, 90);
      U.text(ctx, anim > 0 ? '✊' : E[last[1]], W - 120, 190 + shake, 90);
      U.text(ctx, 'vs', W / 2, 190, 22, '#5d6799');
    }
    U.text(ctx, anim > 0 ? '…' : msg, W / 2, 320, 22, '#fff', 'center', 700);
    for (let i = 0; i < 3; i++) {
      const r = br(i);
      ctx.fillStyle = '#26306b'; U.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
      U.text(ctx, E[i], r.x + r.w / 2, r.y + 50, 52);
      U.text(ctx, N[i], r.x + r.w / 2, r.y + 100, 14, '#8f99c4');
    }
  }, true);
});
