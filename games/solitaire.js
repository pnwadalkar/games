// Klondike Solitaire (draw 1 or 3). Tap a card to auto-move it, or drag cards between piles. Options: draw.
Hub.register('solitaire', (api, o) => {
  const W = 640, H = 900, CW = 80, CH = 112, GX = 88, X0 = 12, TY = 150, BOT = H - 70;
  const DRAW = o.draw || 1;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const d = U.deck();
  let tab = Array.from({ length: 7 }, (_, i) => { const p = d.splice(0, i + 1); p[p.length - 1].up = true; return p; });
  let stock = d, waste = [], found = [[], [], [], []], moves = 0, hist = [], drag = null, autoing = false, secs = 0, started = false, done = false;
  api.every(1000, () => { if (started && !done) secs++; });

  const red = k => k.s === 1 || k.s === 2;
  const top = p => p[p.length - 1];
  const snap = () => JSON.stringify({ tab, stock, waste, found, moves });
  function undo() {
    const s = hist.pop();
    if (!s || done) return;
    ({ tab, stock, waste, found, moves } = JSON.parse(s));
    api.setScore(moves);
    api.sfx('flip');
  }
  function after() {
    tab.forEach(p => { if (p.length && !top(p).up) { top(p).up = true; } });
    moves++;
    started = true;
    api.setScore(moves);
    if (found.every(f => f.length === 13)) {
      done = true;
      return api.end({ win: true, title: 'Solved!', score: moves, msg: moves + ' moves · ' + secs + 's', emoji: '🂡', delay: 500 });
    }
    if (!autoing && !stock.length && !waste.length && tab.every(p => p.every(k => k.up))) autoFinish();
  }
  function autoFinish() {
    autoing = true;
    const step = () => {
      for (let i = 0; i < 7; i++) {
        const k = top(tab[i]);
        if (k && found[k.s].length === k.r - 1) { hist.push(snap()); found[k.s].push(tab[i].pop()); api.sfx('flip'); after(); if (!done) api.after(90, step); return; }
      }
    };
    step();
  }
  function drawStock() {
    hist.push(snap());
    if (!stock.length) {
      if (!waste.length) { hist.pop(); return; }
      stock = waste.reverse().map(k => ({ ...k, up: false }));
      waste = [];
    } else {
      for (let i = 0; i < DRAW && stock.length; i++) { const k = stock.pop(); k.up = true; waste.push(k); }
    }
    api.sfx('flip');
    after();
  }
  const canTab = (k, pile) => pile.length ? (top(pile).up && top(pile).r === k.r + 1 && red(top(pile)) !== red(k)) : k.r === 13;
  const canFound = k => found[k.s].length === k.r - 1;

  function take(src) {
    if (src.pile === 'waste') return waste.splice(waste.length - 1, 1);
    if (src.pile === 'found') return found[src.i].splice(found[src.i].length - 1, 1);
    return tab[src.i].splice(src.idx);
  }
  function moveTo(src, cards, dest) {
    const single = cards.length === 1;
    if (dest.pile === 'found') {
      if (!single || !canFound(cards[0])) return false;
      hist.push(snap()); take(src); found[cards[0].s].push(cards[0]);
    } else if (dest.pile === 'tab') {
      if (src.pile === 'tab' && src.i === dest.i) return false;
      if (!canTab(cards[0], tab[dest.i])) return false;
      hist.push(snap()); take(src); tab[dest.i].push(...cards);
    } else return false;
    api.sfx(dest.pile === 'found' ? 'coin' : 'flip');
    after();
    return true;
  }
  function autoMove(src, cards) {
    if (cards.length === 1 && moveTo(src, cards, { pile: 'found' })) return true;
    const order = [...Array(7).keys()].sort((a, b) => (tab[b].length ? 1 : 0) - (tab[a].length ? 1 : 0));
    for (const i of order) {
      // don't shuffle a king from one empty column to another
      if (!tab[i].length && src.pile === 'tab' && src.idx === 0) continue;
      if (moveTo(src, cards, { pile: 'tab', i })) return true;
    }
    return false;
  }

  // ---- layout ----
  const colX = i => X0 + i * GX;
  function offsets(p) {
    const downs = p.filter(k => !k.up).length, ups = p.length - downs;
    const avail = BOT - CH - TY - downs * 12;
    const up = ups > 1 ? Math.min(30, avail / (ups - 1)) : 30;
    let y = TY;
    return p.map(k => { const yy = y; y += k.up ? up : 12; return yy; });
  }
  function hit(x, y) {
    if (y >= 12 && y <= 12 + CH) {
      if (x >= colX(0) && x <= colX(0) + CW) return { pile: 'stock' };
      if (x >= colX(1) && x <= colX(1) + CW + (DRAW > 1 ? 40 : 0) && waste.length) return { pile: 'waste', cards: [top(waste)] };
      for (let f = 0; f < 4; f++) if (x >= colX(3 + f) && x <= colX(3 + f) + CW && found[f].length) return { pile: 'found', i: f, cards: [top(found[f])] };
      return null;
    }
    const i = Math.floor((x - X0 + 4) / GX);
    if (i < 0 || i > 6 || y < TY) return null;
    const ys = offsets(tab[i]);
    for (let j = tab[i].length - 1; j >= 0; j--) if (y >= ys[j] && y <= ys[j] + CH && tab[i][j].up) return { pile: 'tab', i, idx: j, cards: tab[i].slice(j) };
    return null;
  }
  function dropTarget(x, y) {
    const i = Math.floor((x - X0 + 4) / GX);
    if (y < TY - 10 && i >= 3 && i <= 6) return { pile: 'found' };
    if (i >= 0 && i <= 6 && y >= TY - 10) return { pile: 'tab', i };
    return null;
  }
  const UNDO = { x: W / 2 - 80, y: H - 58, w: 160, h: 46 };
  api.pointer(c, {
    down: (x, y) => {
      if (done || autoing) return;
      if (x > UNDO.x && x < UNDO.x + UNDO.w && y > UNDO.y && y < UNDO.y + UNDO.h) return undo();
      const h = hit(x, y);
      if (!h) return;
      if (h.pile === 'stock') return drawStock();
      drag = { src: h, cards: h.cards, sx: x, sy: y, x, y, moved: false };
    },
    move: (x, y, e, isDown) => {
      if (!drag || !isDown) return;
      drag.x = x; drag.y = y;
      if (Math.hypot(x - drag.sx, y - drag.sy) > 8) drag.moved = true;
    },
    up: (x, y) => {
      if (!drag) return;
      const dr = drag;
      drag = null;
      if (dr.moved) {
        const t = dropTarget(x, y);
        if (!t || !moveTo(dr.src, dr.cards, t)) api.sfx('bad');
      } else if (!autoMove(dr.src, dr.cards)) api.sfx('bad');
    }
  });
  api.onKey((k, raw) => { if (raw === 'z' || raw === 'u' || raw === 'Backspace') undo(); else if (k === 'a') drawStock(); });

  function slot(x, y, label) {
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2;
    U.rr(ctx, x, y, CW, CH, 8); ctx.stroke();
    if (label) U.text(ctx, label, x + CW / 2, y + CH / 2, 30, 'rgba(255,255,255,.22)');
  }
  api.loop(() => {}, () => {
    const g = ctx.createRadialGradient(W / 2, H / 3, 80, W / 2, H / 2, 700);
    g.addColorStop(0, '#1f8a55'); g.addColorStop(1, '#0c4a2c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const dragging = drag && drag.moved ? drag : null;
    const hidden = new Set(dragging ? dragging.cards : []);
    if (stock.length) U.drawCard(ctx, colX(0), 12, CW, CH, null, true); else slot(colX(0), 12, '↻');
    if (stock.length) U.text(ctx, stock.length, colX(0) + CW / 2, 12 + CH + 12, 12, 'rgba(255,255,255,.6)');
    slot(colX(1), 12);
    const wv = waste.slice(-DRAW).filter(k => !hidden.has(k));
    wv.forEach((k, i) => U.drawCard(ctx, colX(1) + i * 20, 12, CW, CH, k));
    for (let f = 0; f < 4; f++) {
      slot(colX(3 + f), 12, U.SUITS[f]);
      const fs = found[f].filter(k => !hidden.has(k));
      if (fs.length) U.drawCard(ctx, colX(3 + f), 12, CW, CH, top(fs));
    }
    tab.forEach((p, i) => {
      slot(colX(i), TY);
      const ys = offsets(p);
      p.forEach((k, j) => { if (!hidden.has(k)) U.drawCard(ctx, colX(i), ys[j], CW, CH, k, !k.up); });
    });
    if (dragging) dragging.cards.forEach((k, j) => U.drawCard(ctx, dragging.x - CW / 2, dragging.y - 20 + j * 30, CW, CH, k));
    ctx.fillStyle = hist.length ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.15)';
    U.rr(ctx, UNDO.x, UNDO.y, UNDO.w, UNDO.h, 12); ctx.fill();
    U.text(ctx, '↶ Undo', W / 2, UNDO.y + UNDO.h / 2, 17, hist.length ? '#fff' : 'rgba(255,255,255,.4)');
    U.text(ctx, '⏱ ' + secs + 's', W - 16, H - 35, 15, 'rgba(255,255,255,.7)', 'right');
  }, true);
});
