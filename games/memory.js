// Memory Match: flip two cards at a time to find all pairs. Options: pairs, theme.
Hub.register('memory', (api, o) => {
  const THEMES = {
    animals: ['🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐧', '🐙', '🦄', '🐢', '🦋', '🐝', '🐳', '🦉', '🐰', '🐯', '🐨'],
    food: ['🍕', '🍔', '🍟', '🌮', '🍩', '🍪', '🍣', '🍦', '🍉', '🍓', '🥑', '🍇', '🥨', '🧁', '🍿', '🍒', '🥕', '🍋'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🏒', '🥏', '🎳', '🛹', '🏹', '🥌'],
    space: ['🚀', '🌍', '🌙', '⭐', '☄️', '🪐', '👽', '🛸', '🌞', '🔭', '🌌', '👨‍🚀', '🛰️', '🌑', '🌠', '🌕', '⚡', '🌈']
  };
  const P = o.pairs || 8;
  const cols = P <= 6 ? 4 : P <= 8 ? 4 : P <= 10 ? 5 : 6, rows = Math.ceil(P * 2 / cols);
  const CS = 104, GAP = 10, W = cols * CS + (cols + 1) * GAP, H = rows * CS * 1.15 + (rows + 1) * GAP;
  const CH = CS * 1.15;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const icons = U.shuffle(THEMES[o.theme || 'animals'].slice()).slice(0, P);
  const cards = U.shuffle(icons.concat(icons)).map((s, i) => ({ s, i, up: false, done: false, f: 0 }));
  let open = [], moves = 0, found = 0, lock = false, secs = 0, started = false;

  api.every(1000, () => { if (started && found < P) { secs++; api.status('Time ' + secs + 's · ' + found + '/' + P + ' pairs'); } });
  api.status('Find all ' + P + ' pairs');

  function flip(card) {
    if (lock || card.up || card.done || api.over) return;
    started = true;
    card.up = true;
    open.push(card);
    api.sfx('flip');
    if (open.length === 2) {
      moves++;
      api.setScore(moves);
      const [a, b] = open;
      if (a.s === b.s) {
        a.done = b.done = true;
        open = [];
        found++;
        api.after(150, () => api.sfx('coin'));
        if (found === P) api.end({ win: true, title: 'All pairs found!', score: moves, msg: moves + ' moves · ' + secs + 's', emoji: '🧠' });
      } else {
        lock = true;
        api.after(750, () => { a.up = b.up = false; open = []; lock = false; });
      }
    }
  }
  const at = (x, y) => cards.find(cd => {
    const k = cd.i % cols, r = Math.floor(cd.i / cols);
    const cx = GAP + k * (CS + GAP), cy = GAP + r * (CH + GAP);
    return x >= cx && x <= cx + CS && y >= cy && y <= cy + CH;
  });
  api.pointer(c, { down: (x, y) => { const cd = at(x, y); if (cd) flip(cd); } });

  api.loop(dt => {
    cards.forEach(cd => { const t = cd.up ? 1 : 0; cd.f += U.clamp(t - cd.f, -dt * 7, dt * 7); });
  }, () => {
    c.clear('#10163a');
    cards.forEach(cd => {
      const k = cd.i % cols, r = Math.floor(cd.i / cols);
      const x = GAP + k * (CS + GAP), y = GAP + r * (CH + GAP);
      const sx = Math.abs(Math.cos(cd.f * Math.PI));
      const face = cd.f > .5;
      ctx.save();
      ctx.translate(x + CS / 2, y + CH / 2);
      ctx.scale(Math.max(.02, sx), 1);
      if (face) {
        ctx.fillStyle = cd.done ? '#2ee59d' : '#f5f6ff';
        U.rr(ctx, -CS / 2, -CH / 2, CS, CH, 14); ctx.fill();
        U.text(ctx, cd.s, 0, 4, CS * .52);
      } else {
        const g = ctx.createLinearGradient(-CS / 2, -CH / 2, CS / 2, CH / 2);
        g.addColorStop(0, '#7c5cff'); g.addColorStop(1, '#00a2ff');
        ctx.fillStyle = g;
        U.rr(ctx, -CS / 2, -CH / 2, CS, CH, 14); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3;
        U.rr(ctx, -CS / 2 + 8, -CH / 2 + 8, CS - 16, CH - 16, 10); ctx.stroke();
        U.text(ctx, '?', 0, 3, CS * .4, 'rgba(255,255,255,.7)', 'center', 900);
      }
      ctx.restore();
    });
  }, true);
});
