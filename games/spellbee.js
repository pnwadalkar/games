// Spelling Bee: make words (4+ letters) from the seven letters. Every word must use the gold centre letter. Letters can repeat.
Hub.register('spellbee', (api) => {
  const W = 420, H = 640, TIME = 180;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const DICT = [...new Set(WORDS.five.concat(WORDS.all).map(w => w.toLowerCase()).filter(w => /^[a-z]+$/.test(w) && w.length >= 4))];
  let letters, center, valid, found = [], typed = '', score = 0, msg = '', msgT = 0, t0 = performance.now(), started = false, left = TIME, t = 0, outer;

  function setup() {
    for (let tries = 0; tries < 2000; tries++) {
      const base = U.pick(DICT), set = [...new Set(base.split(''))];
      if (set.length > 7 || set.length < 5) continue;
      const extra = 'aeiourstlnmdcphbgy'.split('').filter(ch => !set.includes(ch));
      while (set.length < 7) set.push(extra.splice(U.randi(0, extra.length - 1), 1)[0]);
      const cen = U.pick(set);
      const ok = DICT.filter(w => w.includes(cen) && [...w].every(ch => set.includes(ch)));
      if (ok.length >= 8 && ok.length <= 70) { letters = set; center = cen; valid = new Set(ok); outer = U.shuffle(set.filter(ch => ch !== cen)); return; }
    }
    letters = 'etarsnl'.split(''); center = 'e'; valid = new Set(DICT.filter(w => w.includes('e') && [...w].every(ch => letters.includes(ch)))); outer = letters.filter(ch => ch !== 'e');
  }
  setup();
  api.status(valid.size + ' words to find · 3 minutes');

  const HX = W / 2, HY = 300, R = 56;
  const hexPos = i => (i < 0 ? [HX, HY] : [HX + Math.cos(i * Math.PI / 3 - Math.PI / 2) * R * 1.85, HY + Math.sin(i * Math.PI / 3 - Math.PI / 2) * R * 1.85]);
  const BTN = { del: { x: 24, y: 480, w: 112, h: 52 }, shuf: { x: W / 2 - 56, y: 480, w: 112, h: 52 }, ent: { x: W - 136, y: 480, w: 112, h: 52 } };

  const flash = (m, good) => { msg = m; msgT = 1.1; msgGood = good; };
  let msgGood = false;
  function press(ch) { if (typed.length < 18) { typed += ch; api.sfx('click'); } }
  function submit() {
    const w = typed; typed = '';
    if (w.length < 4) return flash('Too short', false);
    if (!w.includes(center)) return flash('Missing centre letter', false);
    if (found.includes(w)) return flash('Already found', false);
    if (!valid.has(w)) return flash('Not in word list', false), api.sfx('bad');
    found.push(w);
    const pts = w.length === 4 ? 1 : w.length + (new Set(w).size === 7 ? 7 : 0);
    score += pts; api.setScore(score); flash(new Set(w).size === 7 ? 'PANGRAM! +' + pts : 'Nice! +' + pts, true); api.sfx('coin');
    if (found.length === valid.size) api.end({ win: true, title: 'Genius!', msg: 'You found every word.', score, emoji: '🐝' });
  }
  api.pointer(c, { down: (x, y) => {
    if (U.inR(x, y, BTN.del)) { typed = typed.slice(0, -1); return; }
    if (U.inR(x, y, BTN.shuf)) { outer = U.shuffle(outer); api.sfx('flip'); return; }
    if (U.inR(x, y, BTN.ent)) return submit();
    for (let i = -1; i < 6; i++) { const [px, py] = hexPos(i); if (Math.hypot(x - px, y - py) < R * .9) press(i < 0 ? center : outer[i]); }
  } });
  api.on(window, 'keydown', e => {
    if (api.over) return;
    if (/^[a-z]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && letters.includes(e.key.toLowerCase())) press(e.key.toLowerCase());
    else if (e.key === 'Backspace') typed = typed.slice(0, -1);
    else if (e.key === 'Enter') submit();
  });
  api.loop(dt => {
    t += dt; msgT = Math.max(0, msgT - dt);
    if (!started && (typed || found.length)) { started = true; t0 = performance.now(); }
    if (started) { left = Math.max(0, TIME - (performance.now() - t0) / 1000); if (left <= 0 && !api.over) api.end({ win: true, title: 'Time!', msg: found.length + ' of ' + valid.size + ' words', score, emoji: '🐝' }); }
  }, draw, true);

  function hex(x, y, r, col) {
    ctx.__flat = true;
    ctx.fillStyle = U.shade(col, -.4); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + 7 + Math.sin(a) * r); } ctx.fill();
    const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, U.shade(col, .2)); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.fill();
    ctx.__flat = false;
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff3c4'); g.addColorStop(1, '#ffd96b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    U.text(ctx, started ? Math.ceil(left) + 's' : TIME + 's', 16, 24, 18, left < 15 ? '#c2185b' : '#7a5a00', 'left', 900);
    U.text(ctx, 'Score ' + score, W - 16, 24, 18, '#7a5a00', 'right', 900);
    const lvl = ['Beginner', 'Good Start', 'Moving Up', 'Good', 'Solid', 'Nice', 'Great', 'Amazing', 'Genius'][Math.min(8, Math.floor(found.length / Math.max(1, valid.size) * 9))];
    U.text(ctx, lvl + ' · ' + found.length + '/' + valid.size, W / 2, 24, 14, '#9a7400', 'center', 800);
    U.text(ctx, typed ? typed.toUpperCase() : (msgT > 0 ? msg : 'Type or tap letters'), W / 2, 90, typed ? 34 : 20, typed ? '#3a2a00' : msgT > 0 ? (msgGood ? '#1f8f4a' : '#c2185b') : '#a88a3a', 'center', 900);
    for (let i = 0; i < 6; i++) { const [x, y] = hexPos(i); hex(x, y, R, '#f1e2a8'); U.text(ctx, outer[i].toUpperCase(), x, y + 2, 34, '#3a2a00', 'center', 900); }
    const [cx, cy] = hexPos(-1); hex(cx, cy, R, '#f6b800'); U.text(ctx, center.toUpperCase(), cx, cy + 2, 36, '#3a2a00', 'center', 900);
    U.btn(ctx, BTN.del, 'Delete', '#a08030', 16); U.btn(ctx, BTN.shuf, '🔀', '#a08030', 22); U.btn(ctx, BTN.ent, 'Enter', '#e08a00', 18);
    U.wrap(ctx, found.slice(-12).reverse().join(' · '), W / 2, 566, W - 40, 20, 14, '#6b5200');
  }
});
