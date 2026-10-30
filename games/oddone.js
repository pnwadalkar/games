// Odd Colour Out: one tile is a slightly different shade. Tap it. The grid grows and the difference shrinks. 60 seconds.
Hub.register('oddone', (api) => {
  const S = 460, TIME = 60;
  const c = api.canvas(S, S + 60);
  const ctx = c.ctx;
  let level = 1, n = 2, hue, odd, delta, score = 0, t0 = 0, started = false, left = TIME, wrongFlash = 0, t = 0, lives = 3;

  function setup() {
    n = Math.min(8, 2 + Math.floor(level / 2)); hue = U.randi(0, 359);
    odd = U.randi(0, n * n - 1); delta = Math.max(3, 24 - level * 1.3);
    api.status('Find the different tile');
  }
  setup();
  const base = () => `hsl(${hue},70%,55%)`, off = () => `hsl(${hue},70%,${55 + (hue % 2 ? delta : -delta)}%)`;
  api.pointer(c, { down: (x, y) => {
    if (api.over) return;
    const cs = S / n, k = Math.floor(x / cs), r = Math.floor(y / cs);
    if (r < 0 || k < 0 || r >= n || k >= n) return;
    if (!started) { started = true; t0 = performance.now(); }
    if (r * n + k === odd) { score++; level++; api.setScore(score); api.sfx('coin'); setup(); }
    else { wrongFlash = .3; lives--; api.sfx('bad'); t0 -= 3000; if (lives <= 0) api.end({ win: true, title: 'Out of lives', msg: score + ' found', score, emoji: '👁️' }); }
  } });
  api.loop(dt => {
    t += dt; wrongFlash = Math.max(0, wrongFlash - dt);
    if (started) { left = Math.max(0, TIME - (performance.now() - t0) / 1000); if (left <= 0 && !api.over) api.end({ win: true, title: 'Time!', msg: score + ' tiles found', score, emoji: '👁️' }); }
  }, draw, true);

  function draw() {
    c.clear('#14122e');
    const cs = S / n;
    for (let i = 0; i < n * n; i++) {
      const x = (i % n) * cs, y = Math.floor(i / n) * cs;
      ctx.__flat = true; ctx.fillStyle = i === odd ? off() : base(); U.rr(ctx, x + 3, y + 3, cs - 6, cs - 6, Math.min(14, cs * .18)); ctx.fill(); ctx.__flat = false;
    }
    if (wrongFlash > 0) { ctx.fillStyle = 'rgba(255,77,109,' + wrongFlash + ')'; ctx.fillRect(0, 0, S, S); }
    U.text(ctx, started ? Math.ceil(left) + 's' : TIME + 's', 14, S + 30, 22, left < 10 ? '#ff5c7a' : '#9fb2ff', 'left', 900);
    U.text(ctx, 'Found ' + score, S / 2, S + 30, 20, '#fff', 'center', 800);
    U.text(ctx, '❤'.repeat(Math.max(0, lives)), S - 14, S + 30, 20, '#ff5c7a', 'right');
  }
});
