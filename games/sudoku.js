// Sudoku with a unique-solution generator, notes, hints and mistake highlighting. Options: clues.
Hub.register('sudoku', (api, o) => {
  const CS = 50, B = 9 * CS, M = 6, W = B + M * 2, PADY = B + M * 2 + 8, H = PADY + 130;
  const c = api.canvas(W, H);
  const ctx = c.ctx;

  // ---- generator ----
  const rowOf = i => Math.floor(i / 9), colOf = i => i % 9, boxOf = i => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
  const PEERS = Array.from({ length: 81 }, (_, i) => {
    const s = new Set();
    for (let j = 0; j < 81; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) s.add(j);
    return [...s];
  });
  const cands = (g, i) => { let m = 0x3FE; PEERS[i].forEach(j => { if (g[j]) m &= ~(1 << g[j]); }); return m; };
  function count(g, limit) {
    let best = -1, bm = 0, bc = 10;
    for (let i = 0; i < 81; i++) if (!g[i]) {
      const m = cands(g, i);
      let n = 0; for (let d = 1; d <= 9; d++) if (m & (1 << d)) n++;
      if (!n) return 0;
      if (n < bc) { bc = n; best = i; bm = m; if (n === 1) break; }
    }
    if (best < 0) return 1;
    let total = 0;
    for (let d = 1; d <= 9 && total < limit; d++) if (bm & (1 << d)) { g[best] = d; total += count(g, limit - total); }
    g[best] = 0;
    return total;
  }
  function fill(g) {
    const i = g.indexOf(0);
    if (i < 0) return true;
    const m = cands(g, i);
    for (const d of U.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) if (m & (1 << d)) { g[i] = d; if (fill(g)) return true; }
    g[i] = 0;
    return false;
  }
  const sol = Array(81).fill(0);
  fill(sol);
  const puz = sol.slice();
  let clues = 81;
  const target = o.clues || 36;
  for (const i of U.shuffle([...Array(81).keys()])) {
    if (clues <= target) break;
    const v = puz[i];
    puz[i] = 0;
    if (count(puz.slice(), 2) !== 1) puz[i] = v; else clues--;
  }

  // ---- state ----
  const given = puz.map(v => v > 0);
  const val = puz.slice();
  const notes = Array.from({ length: 81 }, () => new Set());
  let sel = given.indexOf(false), notesMode = false, mistakes = 0, secs = 0, done = false;
  const history = [];
  api.every(1000, () => { if (!done) { secs++; api.setScore(secs); } });
  api.status('Mistakes: 0');

  function set(d) {
    if (sel < 0 || given[sel] || done) return;
    history.push([sel, val[sel], new Set(notes[sel])]);
    if (d === 0) { val[sel] = 0; notes[sel].clear(); }
    else if (notesMode) { if (val[sel]) return; notes[sel].has(d) ? notes[sel].delete(d) : notes[sel].add(d); }
    else if (val[sel] === d) val[sel] = 0;
    else {
      val[sel] = d;
      notes[sel].clear();
      if (d !== sol[sel]) { mistakes++; api.status('Mistakes: ' + mistakes); api.sfx('bad'); }
      else { PEERS[sel].forEach(j => notes[j].delete(d)); api.sfx('click'); }
    }
    checkWin();
    draw();
  }
  function hint() {
    if (done) return;
    let i = sel >= 0 && !given[sel] && val[sel] !== sol[sel] ? sel : -1;
    if (i < 0) { const open = val.map((v, j) => v !== sol[j] ? j : -1).filter(j => j >= 0); if (!open.length) return; i = U.pick(open); }
    val[i] = sol[i]; given[i] = true; notes[i].clear(); sel = i;
    PEERS[i].forEach(j => notes[j].delete(sol[i]));
    api.sfx('coin');
    checkWin();
    draw();
  }
  function undo() {
    const h = history.pop();
    if (!h || done) return;
    [sel, val[h[0]], notes[h[0]]] = [h[0], h[1], h[2]];
    draw();
  }
  function checkWin() {
    if (val.every((v, i) => v === sol[i])) {
      done = true;
      api.end({ win: true, title: 'Solved!', score: secs, msg: mistakes + ' mistake' + (mistakes === 1 ? '' : 's') });
    }
  }

  const BTN = [['Undo', undo], ['Erase', () => set(0)], ['Notes', () => { notesMode = !notesMode; draw(); }], ['Hint', hint]];
  api.pointer(c, {
    down: (x, y) => {
      if (y < PADY - 4) {
        const k = Math.floor((x - M) / CS), r = Math.floor((y - M) / CS);
        if (k >= 0 && k < 9 && r >= 0 && r < 9) { sel = r * 9 + k; draw(); }
      } else if (y < PADY + 58) {
        const d = Math.floor((x - M) / CS) + 1;
        if (d >= 1 && d <= 9) set(d);
      } else if (y > PADY + 70) {
        const b = Math.floor((x - M) / (B / 4));
        if (BTN[b]) BTN[b][1]();
      }
    }
  });
  api.onKey((k, raw) => {
    if (raw >= '1' && raw <= '9') return set(+raw);
    if (raw === '0' || raw === 'Backspace' || raw === 'Delete') return set(0);
    if (raw === 'n' || raw === 'N') { notesMode = !notesMode; return draw(); }
    if ((raw === 'z' || raw === 'Z')) return undo();
    if (raw === 'h' || raw === 'H') return hint();
    if (['left', 'right', 'up', 'down'].includes(k) && !(raw && /^[a-zA-Z]$/.test(raw))) {
      if (sel < 0) sel = 0;
      let r = rowOf(sel), q = colOf(sel);
      if (k === 'left') q = (q + 8) % 9; if (k === 'right') q = (q + 1) % 9;
      if (k === 'up') r = (r + 8) % 9; if (k === 'down') r = (r + 1) % 9;
      sel = r * 9 + q;
      draw();
    }
  });

  c.draw = draw;
  function draw() {
    c.clear('#0f1538');
    const sv = sel >= 0 ? val[sel] : 0;
    for (let i = 0; i < 81; i++) {
      const x = M + colOf(i) * CS, y = M + rowOf(i) * CS;
      let bg = '#f5f6ff';
      if (sel >= 0 && PEERS[sel].includes(i)) bg = '#dfe4ff';
      if (sv && val[i] === sv) bg = '#c3cbff';
      if (i === sel) bg = '#9fb0ff';
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, CS, CS);
      if (val[i]) {
        const wrong = !given[i] && val[i] !== sol[i];
        U.text(ctx, val[i], x + CS / 2, y + CS / 2 + 2, 28, wrong ? '#e0244a' : given[i] ? '#1b2150' : '#3d5afe', 'center', given[i] ? 800 : 600);
      } else notes[i].forEach(d => {
        U.text(ctx, d, x + 9 + ((d - 1) % 3) * 16, y + 10 + Math.floor((d - 1) / 3) * 15, 11, '#5a6399', 'center', 600);
      });
    }
    ctx.strokeStyle = '#b4bbe0'; ctx.lineWidth = 1;
    for (let i = 1; i < 9; i++) {
      ctx.beginPath(); ctx.moveTo(M + i * CS, M); ctx.lineTo(M + i * CS, M + B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(M, M + i * CS); ctx.lineTo(M + B, M + i * CS); ctx.stroke();
    }
    ctx.strokeStyle = '#1b2150'; ctx.lineWidth = 3;
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(M + i * CS * 3, M); ctx.lineTo(M + i * CS * 3, M + B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(M, M + i * CS * 3); ctx.lineTo(M + B, M + i * CS * 3); ctx.stroke();
    }
    for (let d = 1; d <= 9; d++) {
      const left = 9 - val.filter((v, i) => v === d && v === sol[i]).length;
      const x = M + (d - 1) * CS;
      ctx.fillStyle = left ? '#26306b' : '#171d45';
      U.rr(ctx, x + 3, PADY, CS - 6, 56, 10); ctx.fill();
      U.text(ctx, d, x + CS / 2, PADY + 24, 26, left ? '#fff' : '#3b4570', 'center', 800);
      U.text(ctx, left || '', x + CS / 2, PADY + 46, 10, '#8f99c4');
    }
    BTN.forEach(([l], b) => {
      const bw = B / 4, x = M + b * bw;
      const on = l === 'Notes' && notesMode;
      ctx.fillStyle = on ? '#7c5cff' : '#1f2852';
      U.rr(ctx, x + 4, PADY + 72, bw - 8, 46, 10); ctx.fill();
      U.text(ctx, l + (l === 'Notes' ? (notesMode ? ' ON' : ' OFF') : ''), x + bw / 2, PADY + 95, 15, '#fff', 'center', 700);
    });
  }
  draw();
});
