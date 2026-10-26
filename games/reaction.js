// Reaction Time: tap as soon as the screen turns green. Average of 5 tries.
Hub.register('reaction', (api) => {
  const W = 480, H = 560, TRIES = 5;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let state = 'idle', t0 = 0, times = [], last = null, timer = null, msg = 'Tap to start';

  function arm() {
    state = 'wait'; msg = 'Wait for green…';
    timer = api.after(U.rand(1200, 3800), () => { state = 'go'; t0 = performance.now(); api.sfx('click'); });
  }
  function tap() {
    if (api.over) return;
    if (state === 'idle' || state === 'result') return arm();
    if (state === 'wait') { clearTimeout(timer); state = 'result'; msg = 'Too soon! Tap to try again'; last = null; api.sfx('bad'); return; }
    if (state === 'go') {
      last = performance.now() - t0;
      times.push(last);
      api.sfx('pop');
      state = 'result';
      if (times.length >= TRIES) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        state = 'done';
        api.end({ win: true, title: avg + ' ms average', score: avg, msg: 'Best ' + Math.round(Math.min(...times)) + ' ms · ' + times.map(Math.round).join(', '), emoji: '⚡' });
      } else msg = Math.round(last) + ' ms — tap for next';
    }
  }
  api.on(api.stage, 'pointerdown', e => { e.preventDefault(); tap(); });
  api.onKey(k => { if (k === 'a') tap(); });

  api.loop(() => {}, () => {
    const bg = state === 'wait' ? '#c0392b' : state === 'go' ? '#27ae60' : '#2b3a8f';
    c.clear(bg);
    U.text(ctx, state === 'go' ? 'TAP!' : state === 'wait' ? '…' : '⚡', W / 2, H / 2 - 60, 80, '#fff', 'center', 900);
    U.text(ctx, state === 'go' ? '' : msg, W / 2, H / 2 + 30, 24, '#fff', 'center', 700);
    U.text(ctx, 'Try ' + Math.min(times.length + (state === 'result' || state === 'done' ? 0 : 1), TRIES) + ' / ' + TRIES, W / 2, H - 60, 18, 'rgba(255,255,255,.75)');
    times.forEach((t, i) => U.text(ctx, Math.round(t), W / 2 + (i - (times.length - 1) / 2) * 70, H - 110, 16, 'rgba(255,255,255,.85)'));
  }, true);
});
