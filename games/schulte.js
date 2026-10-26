// Number Hunt (Schulte table): tap the numbers in order as fast as you can. Options: n.
Hub.register('schulte', (api, o) => {
  const N = o.n || 5, S = 500, GAP = 8, CS = (S - GAP * (N + 1)) / N;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const nums = U.shuffle([...Array(N * N).keys()].map(i => i + 1));
  let next = 1, t0 = 0, started = false, done = false, bad = -1, badT = 0;
  api.status('Find 1');

  api.pointer(c, {
    down: (x, y) => {
      if (done) return;
      const k = Math.floor(x / (S / N)), r = Math.floor(y / (S / N));
      const i = r * N + k;
      if (nums[i] == null) return;
      if (nums[i] === next) {
        if (!started) { started = true; t0 = performance.now(); }
        next++;
        api.sfx('click');
        if (next > N * N) {
          done = true;
          const s = Math.round((performance.now() - t0) / 100) / 10;
          api.end({ win: true, title: 'Done!', score: s, emoji: '🔢' });
        } else api.status('Find ' + next);
      } else if (nums[i] >= next) { bad = i; badT = .3; api.sfx('bad'); }
    }
  });
  api.loop(dt => {
    badT = Math.max(0, badT - dt);
    if (started && !done) api.setScore(Math.round((performance.now() - t0) / 100) / 10);
  }, () => {
    c.clear('#10163a');
    nums.forEach((v, i) => {
      const x = GAP + (i % N) * (CS + GAP), y = GAP + Math.floor(i / N) * (CS + GAP);
      const doneCell = v < next;
      ctx.fillStyle = i === bad && badT > 0 ? '#ff5c7a' : doneCell ? '#171d45' : '#26306b';
      U.rr(ctx, x, y, CS, CS, 12); ctx.fill();
      U.text(ctx, v, x + CS / 2, y + CS / 2 + 2, CS * .42, doneCell ? '#3b4570' : '#fff', 'center', 800);
    });
  }, true);
});
