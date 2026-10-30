// Piano Tiles: tap only the dark tiles as they scroll down. Miss one, or tap a white tile, and it's over.
Hub.register('tiles', (api) => {
  const W = 360, H = 600, COLS = 4, CW = W / COLS, RH = 150;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls(null);
  const NOTES = [262, 294, 330, 349, 392, 440, 494, 523];
  let rows = [], scroll = 0, speed = 220, score = 0, next = 0, flash = [], noteI = 0, started = false, wrong = null;
  const addRow = () => { rows.push({ i: next++, col: U.randi(0, COLS - 1), hit: false }); };
  for (let i = 0; i < 6; i++) addRow();
  rows[0].start = true; // the first dark tile is labelled START
  // row k (0 = lowest) sits at y = H - (k + 1) * RH + scroll; the lowest unhit row is the one to tap
  const rowY = r => H - (rows.indexOf(r) + 1) * RH + scroll;

  function tap(x, y) {
    if (api.over) return;
    const col = Math.floor(x / CW);
    // the lowest unhit row is the one to hit
    const r = rows.find(q => !q.hit);
    if (!r) return;
    const ry = rowY(r);
    if (col === r.col) {
      r.hit = true; started = true; score++; api.setScore(score); api.sfx('click');
      api.tone(NOTES[noteI++ % NOTES.length], .16, 'triangle', .08);
      flash.push({ col, y: ry, t: .25 });
      speed = Math.min(620, 220 + score * 5);
    } else {
      wrong = { col, y: ry }; api.sfx('bad');
      api.end({ msg: score + ' tiles', emoji: '🎹', delay: 500 });
    }
  }
  api.pointer(c, { down: (x, y) => tap(x, y) });
  const keyCols = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
  api.on(window, 'keydown', e => { if (e.code in keyCols) tap(keyCols[e.code] * CW + 1, H / 2); });
  api.onKey(k => { if (k === 'left') tap(1, H / 2); else if (k === 'right') tap(W - 1, H / 2); });
  api.status('Tap the dark tiles · keys D F J K');

  api.loop(dt => {
    if (started) scroll += speed * dt;
    // scroll the lane: once the lowest row has fully passed the bottom, drop it
    while (rows.length && rowY(rows[0]) > H) {
      if (!rows[0].hit) { wrong = { col: rows[0].col, y: rowY(rows[0]) }; api.sfx('die'); return api.end({ msg: 'You missed a tile · ' + score, emoji: '🎹' }); }
      rows.shift(); scroll -= RH; rows.length < 6 && addRow();
    }
    while (rows.length < 6) addRow();
    flash.forEach(f => { f.t -= dt; });
    flash = flash.filter(f => f.t > 0);
  }, draw);

  function draw() {
    ctx.fillStyle = '#f4f6ff'; ctx.fillRect(0, 0, W, H);
    ctx.__flat = true;
    ctx.strokeStyle = '#c9cde6'; ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * CW, 0); ctx.lineTo(i * CW, H); ctx.stroke(); }
    ctx.__flat = false;
    rows.forEach(r => {
      const y = rowY(r);
      ctx.__flat = true;
      ctx.strokeStyle = '#d9dcf0'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.__flat = false;
      const x = r.col * CW;
      if (r.hit) { ctx.fillStyle = '#d6d9f0'; ctx.fillRect(x, y, CW, RH); }
      else {
        U.box(ctx, x + 3, y + 8, CW - 6, RH - 8, '#1b1e33', 9);
        if (r.start) U.text(ctx, 'START', x + CW / 2, y + RH / 2 + 4, 20, '#fff');
      }
    });
    flash.forEach(f => { ctx.fillStyle = 'rgba(124,92,255,' + f.t * 1.4 + ')'; ctx.fillRect(f.col * CW, f.y, CW, RH); });
    if (wrong) { ctx.fillStyle = 'rgba(255,92,122,.8)'; ctx.fillRect(wrong.col * CW, wrong.y, CW, RH); }
    U.text(ctx, score, W / 2, 50, 52, 'rgba(60,70,130,.55)', 'center', 900);
  }
});
