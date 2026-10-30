// Water Sort: pour liquid between tubes until every tube holds a single colour.
Hub.register('watersort', (api) => {
  const W = 420, H = 560, CAP = 4;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const PAL = ['#ff4d6d', '#ffb703', '#2ee59d', '#4cc9f0', '#9d4edd', '#ff8fab', '#8ac926', '#f77f00', '#118ab2', '#e5e5e5'];
  let level = 1, tubes, sel = -1, hist = [], moves = 0, flash = 0, pour = null, layout = [], t = 0;

  function build() {
    const n = Math.min(3 + level, 9), units = [];
    for (let i = 0; i < n; i++) for (let k = 0; k < CAP; k++) units.push(i);
    U.shuffle(units);
    tubes = Array.from({ length: n + 2 }, () => []);
    units.forEach((u, i) => tubes[i % n].push(u));
    hist = []; sel = -1; moves = 0;
    const cols = tubes.length > 6 ? Math.ceil(tubes.length / 2) : tubes.length, rows = tubes.length > 6 ? 2 : 1;
    layout = tubes.map((_, i) => {
      const r = Math.floor(i / cols), k = i % cols, inRow = r === rows - 1 ? tubes.length - r * cols : cols;
      const gap = Math.min(78, (W - 40) / inRow), x0 = (W - gap * inRow) / 2 + gap / 2;
      return { x: x0 + k * gap, y: rows === 1 ? 300 : 150 + r * 210, w: 44 };
    });
    api.status('Level ' + level);
  }
  build();

  const top = tb => { if (!tb.length) return null; const col = tb[tb.length - 1]; let n = 0; for (let i = tb.length - 1; i >= 0 && tb[i] === col; i--) n++; return { col, n }; };
  const BTN = { undo: { x: 20, y: H - 54, w: 120, h: 40 }, reset: { x: W - 140, y: H - 54, w: 120, h: 40 } };

  function move(a, b) {
    const s = top(tubes[a]);
    if (!s || a === b) return false;
    const d = tubes[b], dt = top(d);
    if (d.length >= CAP || (dt && dt.col !== s.col)) return false;
    const n = Math.min(s.n, CAP - d.length);
    for (let i = 0; i < n; i++) d.push(tubes[a].pop());
    hist.push([a, b, n]); moves++; api.sfx('pop'); pour = { a, b, t: 0 };
    return true;
  }
  function undo() {
    const h = hist.pop();
    if (!h) return;
    for (let i = 0; i < h[2]; i++) tubes[h[0]].push(tubes[h[1]].pop());
    moves--; sel = -1; api.sfx('click');
  }
  const solved = () => tubes.every(tb => tb.length === 0 || (tb.length === CAP && tb.every(v => v === tb[0])));

  api.pointer(c, {
    down: (x, y) => {
      if (api.over) return;
      if (U.inR(x, y, BTN.undo)) return undo();
      if (U.inR(x, y, BTN.reset)) { const lv = level; build(); level = lv; return; }
      const i = layout.findIndex(l => Math.abs(x - l.x) < l.w / 2 + 12 && y > l.y - 150 && y < l.y + 24);
      if (i < 0) { sel = -1; return; }
      if (sel < 0) { if (tubes[i].length) { sel = i; api.sfx('click'); } }
      else if (sel === i) sel = -1;
      else { if (!move(sel, i)) api.sfx('bad'); sel = -1; }
      if (solved()) {
        api.sfx('win'); level++; api.setScore(level - 1); flash = 1;
        api.after(900, () => { build(); });
      }
    }
  });

  api.loop(dt => { t += dt; flash = Math.max(0, flash - dt); if (pour) { pour.t += dt; if (pour.t > .3) pour = null; } }, draw, true);

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d2b64'); g.addColorStop(1, '#0f1738');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    layout.forEach((l, i) => {
      const tb = tubes[i], lift = sel === i ? -22 : 0, h = 140, uh = h / CAP, x = l.x - l.w / 2, y = l.y - h + lift;
      U.blob(ctx, l.x + 6, l.y + 14, 28, 6, .35);
      ctx.fillStyle = 'rgba(255,255,255,.1)'; U.rr(ctx, x, y - 8, l.w, h + 8, 20); ctx.fill();
      ctx.save(); U.rr(ctx, x, y - 8, l.w, h + 8, 20); ctx.clip();
      tb.forEach((col, k) => {
        const yy = y + h - (k + 1) * uh;
        ctx.__flat = true; ctx.fillStyle = PAL[col]; ctx.fillRect(x, yy, l.w, uh + .5);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 4, yy, 6, uh); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + l.w - 10, yy, 10, uh);
        ctx.__flat = false;
      });
      ctx.restore();
      ctx.__flat = true; ctx.strokeStyle = sel === i ? '#ffe27a' : 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; U.rr(ctx, x, y - 8, l.w, h + 8, 20); ctx.stroke(); ctx.__flat = false;
    });
    U.text(ctx, 'Level ' + level, W / 2, 34, 24, '#fff', 'center', 900);
    U.text(ctx, 'Moves ' + moves, W / 2, 62, 14, '#9fb2ff');
    U.btn(ctx, BTN.undo, '↶ Undo', '#5b6bd6', 16, !hist.length);
    U.btn(ctx, BTN.reset, '↻ Reset', '#d65b8a', 16);
    if (flash > 0) U.text(ctx, 'Sorted!', W / 2, H / 2, 54, 'rgba(255,255,255,' + flash + ')', 'center', 900);
  }
});
