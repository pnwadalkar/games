// Chess vs the computer (alpha-beta search) or a second player. You play white. No castling or en passant; pawns promote to queens.
Hub.register('chess', (api, o) => {
  const S = 480, CS = 60, DEPTH = o.depth || 2;
  const c = api.canvas(S, S);
  const ctx = c.ctx;
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  let bd = [];
  START.split('/').forEach(row => { for (const ch of row) { if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) bd.push(''); else bd.push(ch); } });
  const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  const VAL = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
  const isW = ch => ch && ch === ch.toUpperCase(), side = ch => (isW(ch) ? 'w' : 'b');
  let sel = -1, targets = [], turn = 'w', over = false, last = null, think = false, plies = 0, check = false, anim = null, t = 0;
  api.turnOf = () => (turn === 'w' ? 0 : 1);
  // the online guest plays black, so turn the board around for them
  const flip = !!(api.net && api.net.me === 1);
  const place = sq => { const r = sq >> 3, k = sq & 7; return flip ? [(7 - k) * CS, (7 - r) * CS] : [k * CS, r * CS]; };
  const sqAt = (x, y) => { const r = Math.floor(y / CS), k = Math.floor(x / CS); return r < 0 || k < 0 || r > 7 || k > 7 ? -1 : r * 8 + k; };
  if (flip) api.canon = (x, y) => [S - x, S - y]; // clicks are mapped back to white's view before they are shared

  const KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const KG = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]], BISH = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  function attacked(b, sq, by) {
    const r = sq >> 3, k = sq & 7;
    const at = (rr, kk) => (rr >= 0 && kk >= 0 && rr < 8 && kk < 8 ? b[rr * 8 + kk] : null);
    const mine = ch => ch && side(ch) === by ? ch.toLowerCase() : null;
    const pr = by === 'w' ? r + 1 : r - 1;
    if (mine(at(pr, k - 1)) === 'p' || mine(at(pr, k + 1)) === 'p') return true;
    for (const [dr, dk] of KN) if (mine(at(r + dr, k + dk)) === 'n') return true;
    for (const [dr, dk] of KG) if (mine(at(r + dr, k + dk)) === 'k') return true;
    for (const dirs of [ROOK, BISH]) for (const [dr, dk] of dirs) {
      for (let i = 1; i < 8; i++) {
        const ch = at(r + dr * i, k + dk * i);
        if (ch === null) break;
        if (ch) { const m = mine(ch); if (m && (m === 'q' || (dirs === ROOK ? m === 'r' : m === 'b'))) return true; break; }
      }
    }
    return false;
  }
  function pseudo(b, sd) {
    const out = [];
    for (let sq = 0; sq < 64; sq++) {
      const ch = b[sq];
      if (!ch || side(ch) !== sd) continue;
      const r = sq >> 3, k = sq & 7, p = ch.toLowerCase();
      const add = (rr, kk, capOnly, noCap) => {
        if (rr < 0 || kk < 0 || rr > 7 || kk > 7) return false;
        const t2 = b[rr * 8 + kk];
        if (t2 && side(t2) === sd) return false;
        if (capOnly && !t2) return false;
        if (noCap && t2) return false;
        out.push([sq, rr * 8 + kk]);
        return !t2;
      };
      if (p === 'p') {
        const d = sd === 'w' ? -1 : 1, home = sd === 'w' ? 6 : 1;
        if (add(r + d, k, false, true) && r === home) add(r + 2 * d, k, false, true);
        add(r + d, k - 1, true); add(r + d, k + 1, true);
      } else if (p === 'n') KN.forEach(([dr, dk]) => add(r + dr, k + dk));
      else if (p === 'k') KG.forEach(([dr, dk]) => add(r + dr, k + dk));
      else {
        const dirs = p === 'r' ? ROOK : p === 'b' ? BISH : ROOK.concat(BISH);
        dirs.forEach(([dr, dk]) => { for (let i = 1; i < 8; i++) if (!add(r + dr * i, k + dk * i)) break; });
      }
    }
    return out;
  }
  const make = (b, m) => {
    const nb = b.slice(), ch = nb[m[0]];
    nb[m[1]] = ch; nb[m[0]] = '';
    if ((ch === 'P' && m[1] < 8) || (ch === 'p' && m[1] >= 56)) nb[m[1]] = ch === 'P' ? 'Q' : 'q';
    return nb;
  };
  const kingSq = (b, sd) => b.indexOf(sd === 'w' ? 'K' : 'k');
  const legal = (b, sd) => pseudo(b, sd).filter(m => { const nb = make(b, m); return !attacked(nb, kingSq(nb, sd), sd === 'w' ? 'b' : 'w'); });

  function evaluate(b) { // positive = good for white
    let s = 0;
    for (let sq = 0; sq < 64; sq++) {
      const ch = b[sq]; if (!ch) continue;
      const p = ch.toLowerCase(), r = sq >> 3, k = sq & 7, cen = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(k - 3.5)) * .5;
      let v = VAL[p];
      if (p === 'n' || p === 'b') v += cen * 8; else if (p === 'p') v += (isW(ch) ? 6 - r : r - 1) * 6 + cen * 3; else if (p === 'q') v += cen * 2;
      s += isW(ch) ? v : -v;
    }
    return s;
  }
  function search(b, depth, alpha, beta, sd) {
    const ms = legal(b, sd);
    if (!ms.length) return attacked(b, kingSq(b, sd), sd === 'w' ? 'b' : 'w') ? (sd === 'w' ? -99000 - depth : 99000 + depth) : 0;
    if (depth === 0) return evaluate(b);
    ms.sort((x, y) => (b[y[1]] ? VAL[b[y[1]].toLowerCase()] : 0) - (b[x[1]] ? VAL[b[x[1]].toLowerCase()] : 0));
    if (sd === 'w') { let best = -1e9; for (const m of ms) { best = Math.max(best, search(make(b, m), depth - 1, alpha, beta, 'b')); alpha = Math.max(alpha, best); if (alpha >= beta) break; } return best; }
    let best = 1e9; for (const m of ms) { best = Math.min(best, search(make(b, m), depth - 1, alpha, beta, 'w')); beta = Math.min(beta, best); if (alpha >= beta) break; } return best;
  }
  function cpuMove() {
    const ms = legal(bd, 'b');
    if (!ms.length) return;
    let scored = ms.map(m => [m, search(make(bd, m), DEPTH - 1, -1e9, 1e9, 'w') + Math.random() * 4]);
    scored.sort((a, b2) => a[1] - b2[1]);
    const pickFrom = DEPTH <= 1 ? scored.slice(0, Math.min(5, scored.length)) : [scored[0]];
    apply(U.pick(pickFrom)[0]);
  }

  function apply(m) {
    const cap = bd[m[1]];
    anim = { from: m[0], to: m[1], ch: bd[m[0]], p: 0 };
    bd = make(bd, m); last = m; plies++;
    api.sfx(cap ? 'hit' : 'move');
    turn = turn === 'w' ? 'b' : 'w';
    const ms = legal(bd, turn);
    check = attacked(bd, kingSq(bd, turn), turn === 'w' ? 'b' : 'w');
    if (!ms.length) {
      over = true;
      if (check && o.twoP) api.end({ win: true, title: 'Checkmate — ' + (turn === 'b' ? 'White' : 'Black') + ' wins!', msg: 'Well played, both of you.', emoji: '♚' });
      else if (check) api.end({ win: turn === 'b', title: turn === 'b' ? 'Checkmate — you win!' : 'Checkmate', msg: turn === 'b' ? 'Well played!' : 'The computer wins this one.', emoji: '♚' });
      else api.end({ title: 'Stalemate', msg: 'No legal moves — it is a draw.', emoji: '🤝', sound: 'bad' });
      return;
    }
    if (plies > 300) { over = true; api.end({ title: 'Draw', msg: 'Move limit reached.', emoji: '🤝' }); return; }
    if (o.twoP) api.status((turn === 'w' ? 'White' : 'Black') + ' to move' + (check ? ' — check!' : ''));
    else api.status(turn === 'w' ? (check ? 'Check! Your move' : 'Your move') : 'Computer thinking…');
    if (turn === 'b' && !o.twoP) { think = true; api.after(350, () => { cpuMove(); think = false; }); }
  }
  if (api.debug) api.debug({ legal, make, search, board: () => bd, attacked, kingSq });
  api.status(o.twoP ? 'White to move' : 'Your move (white)');

  api.pointer(c, {
    down: (x, y) => {
      if (over || think || (!o.twoP && turn !== 'w')) return;
      const sq = sqAt(x, y);
      if (sq < 0) return;
      const m = targets.find(mv => mv[1] === sq);
      if (m) { sel = -1; targets = []; apply(m); return; }
      if (bd[sq] && side(bd[sq]) === turn) { sel = sq; targets = legal(bd, turn).filter(mv => mv[0] === sq); api.sfx('click'); }
      else { sel = -1; targets = []; }
    }
  });
  api.loop(dt => { t += dt; if (anim) { anim.p += dt * 5; if (anim.p >= 1) anim = null; } }, draw, true);

  function piece(ch, x, y, scale) {
    const w = isW(ch), cx = x + CS / 2, cy = y + CS / 2 + 2;
    U.blob(ctx, cx + 3, cy + CS * .3, CS * .3, CS * .08, .45);
    U.circle(ctx, cx, cy + CS * .2, CS * .26, w ? '#cfd6ee' : '#2b3150');
    ctx.font = '700 ' + CS * .8 * scale + 'px "Segoe UI Symbol","Noto Sans Symbols 2",system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = w ? '#2b2f4a' : '#e8ecff'; ctx.lineJoin = 'round';
    ctx.strokeText(GLYPH[ch.toLowerCase()], cx, cy - 2);
    ctx.fillStyle = w ? '#ffffff' : '#12162b'; ctx.fillText(GLYPH[ch.toLowerCase()], cx, cy - 2);
  }
  function draw() {
    c.clear('#1a1430');
    const kw = check ? kingSq(bd, turn) : -1;
    for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) {
      const sq = r * 8 + k, [x, y] = place(sq);
      ctx.__flat = true;
      ctx.fillStyle = (r + k) % 2 ? '#8a6a4a' : '#ecd9b0'; ctx.fillRect(x, y, CS, CS);
      if (last && (last[0] === sq || last[1] === sq)) { ctx.fillStyle = 'rgba(255,226,122,.35)'; ctx.fillRect(x, y, CS, CS); }
      if (sq === sel) { ctx.fillStyle = 'rgba(46,229,157,.45)'; ctx.fillRect(x, y, CS, CS); }
      if (sq === kw) { ctx.fillStyle = 'rgba(255,77,109,.55)'; ctx.fillRect(x, y, CS, CS); }
      ctx.__flat = false;
    }
    for (let sq = 0; sq < 64; sq++) {
      const ch = bd[sq]; if (!ch) continue;
      let [x, y] = place(sq);
      if (anim && anim.to === sq) { const [fx, fy] = place(anim.from); x = U.lerp(fx, x, anim.p); y = U.lerp(fy, y, anim.p) - Math.sin(anim.p * Math.PI) * 10; }
      piece(ch, x, y, 1);
    }
    targets.forEach(m => { const [px, py] = place(m[1]), x = px + CS / 2, y = py + CS / 2; ctx.globalAlpha = .75; if (bd[m[1]]) { ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, CS * .42, 0, 7); ctx.stroke(); } else U.circle(ctx, x, y, CS * .14, '#2ee59d'); ctx.globalAlpha = 1; });
  }
});
