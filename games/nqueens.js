// N-Queens: place one queen on every row so that no two queens attack each other.
Hub.register('nqueens', (api, o) => {
  const N = o.n || 8, CS = Math.floor(520 / N), S = CS * N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const q = Array(N).fill(-1); // q[row] = column
  let t0 = 0, started = false, done = false, hint = null, flash = 0, t = 0;

  const conflicts = () => {
    const bad = new Set();
    for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) {
      if (q[a] < 0 || q[b] < 0) continue;
      if (q[a] === q[b] || Math.abs(q[a] - q[b]) === b - a) { bad.add(a); bad.add(b); }
    }
    return bad;
  };
  const count = () => q.filter(v => v >= 0).length;
  api.status('Place ' + N + ' queens');

  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      const col = Math.floor(x / CS), row = Math.floor(y / CS);
      if (col < 0 || row < 0 || col >= N || row >= N) return;
      if (!started) { started = true; t0 = performance.now(); }
      q[row] = q[row] === col ? -1 : col; api.sfx(q[row] >= 0 ? 'click' : 'move');
      api.status(count() + ' of ' + N + ' placed');
      if (count() === N && conflicts().size === 0) {
        done = true; flash = 1;
        api.end({ win: true, title: 'Solved!', score: Math.round((performance.now() - t0) / 100) / 10, emoji: '♛' });
      }
    }
  });

  api.loop(dt => { t += dt; flash = Math.max(0, flash - dt); if (started && !done) api.setScore(Math.round((performance.now() - t0) / 100) / 10); }, draw, true);

  function draw() {
    c.clear('#1a1430');
    const bad = conflicts();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const x = k * CS, y = r * CS;
      ctx.__flat = true; ctx.fillStyle = (r + k) % 2 ? '#6b4a8a' : '#d9c7f0'; ctx.fillRect(x, y, CS, CS); ctx.__flat = false;
    }
    // attacked squares
    ctx.__flat = true; ctx.fillStyle = 'rgba(255,92,122,.18)';
    for (let r = 0; r < N; r++) if (q[r] >= 0) for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      if ((a === r || b === q[r] || Math.abs(a - r) === Math.abs(b - q[r])) && !(a === r && b === q[r])) ctx.fillRect(b * CS, a * CS, CS, CS);
    }
    ctx.__flat = false;
    for (let r = 0; r < N; r++) if (q[r] >= 0) {
      const x = q[r] * CS + CS / 2, y = r * CS + CS / 2, isBad = bad.has(r);
      U.blob(ctx, x + 3, y + CS * .32, CS * .34, CS * .1, .45);
      U.circle(ctx, x, y, CS * .36, isBad ? '#ff4d6d' : '#ffd23f');
      U.text(ctx, '♛', x, y + 1, CS * .52, isBad ? '#5a0016' : '#6b4a00');
    }
    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flash * .5 + ')'; ctx.fillRect(0, 0, S, S); }
  }
});
