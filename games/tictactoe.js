// Tic-Tac-Toe vs CPU (minimax) or 2 players. Options: ai ('easy'|'hard'), twoP.
Hub.register('tictactoe', (api, o) => {
  const S = 480, CS = S / 3;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const recKey = 'rec:' + api.meta.id;
  const rec = Hub.LS.get(recKey, { x: 0, o: 0, d: 0 });
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const b = Array(9).fill(null);
  let turn = 'X', done = false, winLine = null, anim = {};
  // online both sides must agree who starts, so the host always plays X first
  const starter = api.net ? 'X' : Hub.LS.get(recKey + ':start', 'X');
  if (!api.net) Hub.LS.set(recKey + ':start', starter === 'X' ? 'O' : 'X');
  turn = starter;
  api.turnOf = () => (turn === 'X' ? 0 : 1);
  const showRec = () => api.status(o.twoP ? `X ${rec.x} · O ${rec.o} · Draws ${rec.d}` : `You ${rec.x} · CPU ${rec.o} · Draws ${rec.d}`);
  showRec();

  const winner = bd => { for (const L of LINES) if (bd[L[0]] && bd[L[0]] === bd[L[1]] && bd[L[0]] === bd[L[2]]) return { p: bd[L[0]], L }; return bd.every(Boolean) ? { p: 'draw' } : null; };
  function minimax(bd, player, depth) {
    const w = winner(bd);
    if (w) return { s: w.p === 'O' ? 10 - depth : w.p === 'X' ? depth - 10 : 0 };
    let best = { s: player === 'O' ? -99 : 99 };
    for (let i = 0; i < 9; i++) if (!bd[i]) {
      bd[i] = player;
      const r = minimax(bd, player === 'O' ? 'X' : 'O', depth + 1);
      bd[i] = null;
      if ((player === 'O' && r.s > best.s) || (player === 'X' && r.s < best.s)) best = { s: r.s, i };
    }
    return best;
  }
  function cpu() {
    const free = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    let i;
    if (o.ai === 'easy' && Math.random() < .45) i = U.pick(free);
    else if (free.length === 9) i = U.pick([0, 2, 4, 6, 8]);
    else i = minimax(b.slice(), 'O', 0).i;
    place(i);
  }
  function place(i) {
    if (done || b[i]) return;
    b[i] = turn;
    anim[i] = 0;
    api.sfx('click');
    const w = winner(b);
    if (w) {
      done = true;
      winLine = w.L;
      if (w.p === 'draw') rec.d++; else rec[w.p.toLowerCase()]++;
      Hub.LS.set(recKey, rec);
      showRec();
      const you = w.p === 'X';
      if (o.twoP) api.end({ win: w.p !== 'draw', title: w.p === 'draw' ? 'Draw!' : w.p + ' wins!', emoji: w.p === 'draw' ? '🤝' : '🎉', delay: 900 });
      else api.end({ win: you, title: w.p === 'draw' ? 'Draw!' : you ? 'You win!' : 'CPU wins', emoji: w.p === 'draw' ? '🤝' : you ? '🏆' : '🤖', sound: w.p === 'draw' ? 'hit' : 'die', delay: 900 });
      return;
    }
    turn = turn === 'X' ? 'O' : 'X';
    if (!o.twoP && turn === 'O') api.after(380, cpu);
  }
  if (!o.twoP && turn === 'O') api.after(500, cpu);
  api.pointer(c, {
    down: (x, y) => {
      if (!o.twoP && turn === 'O') return;
      const k = Math.floor(x / CS), r = Math.floor(y / CS);
      if (k >= 0 && k < 3 && r >= 0 && r < 3) place(r * 3 + k);
    }
  });
  api.onKey((k, raw) => { const d = parseInt(raw, 10); if (d >= 1 && d <= 9 && (o.twoP || turn === 'X')) place(d - 1); });

  api.loop(dt => { for (const i in anim) anim[i] = Math.min(1, anim[i] + dt * 5); }, () => {
    c.clear('#10163a');
    ctx.strokeStyle = '#2f3a7a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * CS, 20); ctx.lineTo(i * CS, S - 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, i * CS); ctx.lineTo(S - 20, i * CS); ctx.stroke();
    }
    b.forEach((v, i) => {
      if (!v) return;
      const cx = (i % 3) * CS + CS / 2, cy = Math.floor(i / 3) * CS + CS / 2, t = anim[i] == null ? 1 : anim[i], r = CS * .3;
      ctx.lineWidth = 14;
      if (v === 'X') {
        ctx.strokeStyle = '#00d4ff';
        ctx.beginPath(); ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx - r + 2 * r * Math.min(1, t * 2), cy - r + 2 * r * Math.min(1, t * 2)); ctx.stroke();
        if (t > .5) { const u = (t - .5) * 2; ctx.beginPath(); ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx + r - 2 * r * u, cy - r + 2 * r * u); ctx.stroke(); }
      } else {
        ctx.strokeStyle = '#ff5c7a';
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t); ctx.stroke();
      }
    });
    if (winLine) {
      const p = i => [(i % 3) * CS + CS / 2, Math.floor(i / 3) * CS + CS / 2];
      const [a, z] = [p(winLine[0]), p(winLine[2])];
      ctx.strokeStyle = '#ffc94d'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(z[0], z[1]); ctx.stroke();
    }
    if (!done) U.text(ctx, o.twoP ? turn + ' to play' : (turn === 'X' ? 'Your turn (X)' : 'CPU thinking…'), S / 2, S - 12, 14, '#5d6799');
  }, true);
});
