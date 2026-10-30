// Yahtzee: roll five dice up to three times, then score the best category. Thirteen rounds.
Hub.register('yahtzee', (api) => {
  const W = 420, H = 640, DS = 56;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const CATS = [
    ['Ones', d => sum(d, 1)], ['Twos', d => sum(d, 2)], ['Threes', d => sum(d, 3)], ['Fours', d => sum(d, 4)], ['Fives', d => sum(d, 5)], ['Sixes', d => sum(d, 6)],
    ['3 of a Kind', d => (maxCount(d) >= 3 ? tot(d) : 0)], ['4 of a Kind', d => (maxCount(d) >= 4 ? tot(d) : 0)], ['Full House', d => (isFull(d) ? 25 : 0)],
    ['Small Straight', d => (run(d) >= 4 ? 30 : 0)], ['Large Straight', d => (run(d) >= 5 ? 40 : 0)], ['YAHTZEE', d => (maxCount(d) === 5 ? 50 : 0)], ['Chance', d => tot(d)]
  ];
  const tot = d => d.reduce((a, b) => a + b, 0), sum = (d, n) => d.filter(v => v === n).length * n;
  const counts = d => { const k = [0, 0, 0, 0, 0, 0, 0]; d.forEach(v => k[v]++); return k; };
  const maxCount = d => Math.max(...counts(d));
  const isFull = d => { const k = counts(d).filter(Boolean).sort(); return k.length === 2 && k[0] === 2 && k[1] === 3; };
  const run = d => { const s = new Set(d); let best = 0, cur = 0; for (let v = 1; v <= 6; v++) { cur = s.has(v) ? cur + 1 : 0; best = Math.max(best, cur); } return best; };

  let dice = [1, 1, 1, 1, 1], held = [false, false, false, false, false], rolls = 0, round = 1, card = Array(13).fill(null), rolling = 0, t = 0;
  const upper = () => card.slice(0, 6).reduce((a, b) => a + (b || 0), 0);
  const total = () => card.reduce((a, b) => a + (b || 0), 0) + (upper() >= 63 ? 35 : 0);
  const diceX = i => (W - 5 * DS - 4 * 14) / 2 + i * (DS + 14), DY = 58;
  const BTN = { roll: { x: W / 2 - 90, y: 134, w: 180, h: 46 } };
  const ROW = 31, TOP = 214;
  const catRect = i => ({ x: 20, y: TOP + i * ROW + (i >= 6 ? 6 : 0), w: W - 40, h: ROW - 3 });
  api.status('Round 1 of 13 — roll the dice');

  function roll() {
    if (rolling > 0 || rolls >= 3 || api.over) return;
    rolls++; rolling = .5; api.sfx('flip');
  }
  function score(i) {
    if (card[i] !== null || rolls === 0 || rolling > 0 || api.over) return;
    card[i] = CATS[i][1](dice); api.setScore(total()); api.sfx(card[i] ? 'coin' : 'bad');
    if (round >= 13) return api.end({ win: true, title: 'Game complete', msg: 'Final score ' + total() + (upper() >= 63 ? ' (with bonus)' : ''), score: total(), emoji: '🎲' });
    round++; rolls = 0; held = [false, false, false, false, false]; api.status('Round ' + round + ' of 13 — roll the dice');
  }
  api.pointer(c, { down: (x, y) => {
    if (U.inR(x, y, BTN.roll)) return roll();
    dice.forEach((_, i) => { if (rolls > 0 && rolls < 4 && U.inR(x, y, { x: diceX(i) - 4, y: DY - 4, w: DS + 8, h: DS + 8 })) { held[i] = !held[i]; api.sfx('click'); } });
    CATS.forEach((_, i) => { if (U.inR(x, y, catRect(i))) score(i); });
  } });
  api.onKey(k => { if (k === 'a') roll(); });
  api.loop(dt => {
    t += dt;
    if (rolling > 0) { rolling -= dt; dice = dice.map((v, i) => (held[i] ? v : U.randi(1, 6))); }
  }, draw, true);

  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#16423c'); g.addColorStop(1, '#0a2420');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    U.text(ctx, 'Round ' + round + ' / 13', 20, 24, 15, '#9fe3b5', 'left', 800);
    U.text(ctx, 'Score ' + total(), W - 20, 24, 15, '#ffe27a', 'right', 800);
    dice.forEach((v, i) => {
      const x = diceX(i), j = rolling > 0 && !held[i] ? Math.sin(t * 50 + i) * 4 : 0, y = DY + j - (held[i] ? 10 : 0);
      U.blob(ctx, x + DS / 2 + 3, DY + DS + 4, DS * .45, 6, .35);
      U.box(ctx, x, y, DS, DS, held[i] ? '#ffe27a' : '#ffffff', 10);
      ctx.__flat = true; ctx.fillStyle = '#1b1e33';
      PIPS[v].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(x + DS / 2 + a * 14, y + DS / 2 + b * 14, 5.2, 0, 7); ctx.fill(); });
      ctx.__flat = false;
    });
    U.btn(ctx, BTN.roll, rolls >= 3 ? 'Choose a category' : rolls === 0 ? 'ROLL' : 'Roll again (' + (3 - rolls) + ' left)', '#e0245e', 17, rolls >= 3 || rolling > 0);
    U.text(ctx, rolls > 0 ? 'Tap dice to hold · tap a row to score' : '', W / 2, 198, 13, '#8fc9b0');
    CATS.forEach((cat, i) => {
      const r = catRect(i), done = card[i] !== null, pot = rolls > 0 && !done ? cat[1](dice) : null;
      ctx.fillStyle = done ? '#12302c' : '#1f5a50'; U.rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      U.text(ctx, cat[0], r.x + 12, r.y + r.h / 2 + 1, 14, done ? '#6b9a8c' : '#e6fff6', 'left', 700);
      U.text(ctx, done ? card[i] : pot != null ? pot : '', r.x + r.w - 14, r.y + r.h / 2 + 1, 16, done ? '#fff' : pot ? '#ffe27a' : '#9fe3b5', 'right', 900);
    });
    U.text(ctx, 'Upper bonus (63+): ' + upper() + ' / 63  → +35', W / 2, TOP + 6 * ROW + 1, 11, '#8fc9b0', 'center', 600);
  }
});
