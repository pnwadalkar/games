// Mancala (Kalah, 6 pits × 4 seeds) vs CPU or 2 players. Options: twoP, depth.
Hub.register('mancala', (api, o) => {
  const W = 640, H = 340;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  // pits 0-5 = player 1 (bottom, left→right), 6 = P1 store, 7-12 = player 2 (top, right→left), 13 = P2 store
  let b = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], turn = 1, done = false, lastPit = null, busy = false;
  const name = p => o.twoP ? 'Player ' + p : p === 1 ? 'You' : 'CPU';

  function sow(bd, pit, p) {
    let n = bd[pit];
    bd[pit] = 0;
    let i = pit;
    while (n) { i = (i + 1) % 14; if ((p === 1 && i === 13) || (p === 2 && i === 6)) continue; bd[i]++; n--; }
    const own = p === 1 ? i >= 0 && i <= 5 : i >= 7 && i <= 12;
    if (own && bd[i] === 1 && bd[12 - i] > 0) {
      const store = p === 1 ? 6 : 13;
      bd[store] += bd[12 - i] + 1;
      bd[i] = 0; bd[12 - i] = 0;
    }
    const again = (p === 1 && i === 6) || (p === 2 && i === 13);
    if (bd.slice(0, 6).every(x => !x) || bd.slice(7, 13).every(x => !x)) {
      for (let j = 0; j < 6; j++) { bd[6] += bd[j]; bd[j] = 0; }
      for (let j = 7; j < 13; j++) { bd[13] += bd[j]; bd[j] = 0; }
      return { again: false, over: true, last: i };
    }
    return { again, over: false, last: i };
  }
  const legal = (bd, p) => (p === 1 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]).filter(i => bd[i] > 0);
  function search(bd, depth, p, a, beta) {
    const ms = legal(bd, p);
    if (!depth || !ms.length) return { s: bd[13] - bd[6] };
    let best = { s: p === 2 ? -1e9 : 1e9, m: ms[0] };
    for (const m of ms) {
      const nb = bd.slice();
      const r = sow(nb, m, p);
      const s = r.over ? (nb[13] - nb[6]) * 100 : search(nb, r.again ? depth : depth - 1, r.again ? p : 3 - p, a, beta).s;
      if (p === 2 ? s > best.s : s < best.s) best = { s, m };
      if (p === 2) a = Math.max(a, s); else beta = Math.min(beta, s);
      if (a >= beta) break;
    }
    return best;
  }
  function play(pit) {
    if (done || busy || !b[pit]) return;
    if (turn === 1 && (pit < 0 || pit > 5)) return;
    if (turn === 2 && (pit < 7 || pit > 12)) return;
    const r = sow(b, pit, turn);
    lastPit = r.last;
    api.sfx('move');
    if (r.over) return finish();
    if (r.again) api.toast(name(turn) + (turn === 1 && !o.twoP ? ' get' : ' gets') + ' another turn!', 900);
    else turn = 3 - turn;
    status();
    if (!o.twoP && turn === 2) { busy = true; api.after(650, () => { busy = false; play(search(b, o.depth || 6, 2, -1e9, 1e9).m); }); }
  }
  function finish() {
    done = true; status();
    const a = b[6], z = b[13], w = a > z ? 1 : z > a ? 2 : 0;
    api.end({ win: o.twoP ? !!w : w === 1, title: w ? name(w) + (w === 1 && !o.twoP ? ' win!' : ' wins!') : 'Draw!', msg: a + ' – ' + z, score: o.twoP ? undefined : a, emoji: w === 1 ? '🏆' : w ? (o.twoP ? '🎉' : '🤖') : '🤝', delay: 700 });
  }
  function status() { api.status(`${name(1)} ${b[6]} · ${name(2)} ${b[13]}` + (done ? '' : ' · ' + name(turn) + (turn === 1 || o.twoP ? ' to move' : ' thinking…'))); }
  status();

  const PW = 66, X0 = 100;
  const pitPos = i => i <= 5 ? [X0 + i * (PW + 6) + PW / 2, 240] : i === 6 ? [W - 50, H / 2] : i <= 12 ? [X0 + (12 - i) * (PW + 6) + PW / 2, 100] : [50, H / 2];
  api.pointer(c, {
    down: (x, y) => {
      if (!o.twoP && turn === 2) return;
      for (let i = 0; i < 14; i++) {
        if (i === 6 || i === 13) continue;
        const [px, py] = pitPos(i);
        if (Math.abs(x - px) < PW / 2 && Math.abs(y - py) < 55) { play(i); return; }
      }
    }
  });
  api.onKey((k, raw) => { const d = parseInt(raw, 10); if (d >= 1 && d <= 6 && turn === 1) play(d - 1); });

  c.draw = draw;
  api.loop(() => {}, draw, true);
  function draw() {
    c.clear('#10163a');
    ctx.fillStyle = '#7a4a25';
    U.rr(ctx, 10, 20, W - 20, H - 40, 40); ctx.fill();
    ctx.fillStyle = '#8f5a2f';
    U.rr(ctx, 18, 28, W - 36, H - 56, 34); ctx.fill();
    for (let i = 0; i < 14; i++) {
      const [x, y] = pitPos(i), store = i === 6 || i === 13;
      const active = !done && ((turn === 1 && i <= 5) || (turn === 2 && i >= 7 && i <= 12 && o.twoP)) && b[i] > 0;
      ctx.fillStyle = active ? '#4a2a10' : '#5c3818';
      ctx.beginPath();
      if (store) ctx.ellipse(x, y, 36, 110, 0, 0, 7); else ctx.ellipse(x, y, PW / 2, 48, 0, 0, 7);
      ctx.fill();
      if (i === lastPit) { ctx.strokeStyle = '#ffc94d'; ctx.lineWidth = 3; ctx.stroke(); }
      const n = b[i];
      for (let s = 0; s < Math.min(n, 24); s++) {
        const a = s * 2.4, rr = store ? 6 + (s % 6) * 4 : 4 + (s % 5) * 3.6;
        U.circle(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr * (store ? 3 : 1.3) - (store ? 0 : 6), 5.5, U.C[s % U.C.length]);
      }
      U.text(ctx, n, x, store ? y + 128 - 30 : (i <= 5 ? y + 62 : y - 62), 18, '#fff', 'center', 800);
    }
    U.text(ctx, name(2), 50, 34, 13, '#ffd9b0');
    U.text(ctx, name(1), W - 50, H - 34, 13, '#ffd9b0');
  }
});
