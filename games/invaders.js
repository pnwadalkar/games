// Space Invaders style shooter with waves, bunkers and lives.
Hub.register('invaders', (api) => {
  const W = 480, H = 640;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr+a');

  const SPR = [
    ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'],
    ['..X.....X..', 'X..X...X..X', 'X.XXXXXXX.X', 'XXX.XXX.XXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..X.....X..', '.X.......X.']
  ];
  const ROWC = ['#ff5cc8', '#ff5c7a', '#ffc94d', '#2ee59d', '#00d4ff'];
  const ship = { x: W / 2 - 20, y: H - 60, w: 40, h: 20 };
  let aliens, dirX, wave = 0, lives = 3, score = 0, shots = [], bombs = [], bunkers = [], cool = 0, frame = 0, ftime = 0, hurt = 0, parts = [];
  let dragging = false, total = 0, stepAcc = 0;

  function newWave() {
    wave++;
    aliens = [];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 8; k++)
      aliens.push({ x: 50 + k * 48, y: 70 + Math.min(wave - 1, 4) * 12 + r * 38, w: 33, h: 24, row: r, alive: true });
    total = aliens.length;
    dirX = 1;
    shots = []; bombs = [];
    if (wave === 1 || wave % 3 === 1) buildBunkers();
  }
  function buildBunkers() {
    bunkers = [];
    for (let b = 0; b < 4; b++) {
      const bx = 50 + b * 110;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) {
        if (r === 3 && (k === 2 || k === 3 || k === 4)) continue;
        bunkers.push({ x: bx + k * 9, y: H - 150 + r * 9, w: 9, h: 9, hp: 3 });
      }
    }
  }
  newWave();

  function fire() {
    if (cool > 0 || shots.length >= 2 || api.over) return;
    shots.push({ x: ship.x + ship.w / 2 - 2, y: ship.y - 12, w: 4, h: 12 });
    cool = .32;
    api.sfx('shoot');
  }
  api.onKey(k => { if (k === 'a' || k === 'up') fire(); });
  api.pointer(c, {
    down: x => { dragging = true; ship.x = U.clamp(x - ship.w / 2, 0, W - ship.w); },
    move: (x, y, e, isDown) => { if (isDown || e.pointerType === 'mouse') ship.x = U.clamp(x - ship.w / 2, 0, W - ship.w); },
    up: () => { dragging = false; }
  });

  function boom(x, y, col, n) {
    for (let i = 0; i < (n || 12); i++) parts.push({ x, y, vx: U.rand(-150, 150), vy: U.rand(-150, 150), life: .5, col });
  }
  function hitBunker(o) {
    for (const b of bunkers) if (b.hp > 0 && U.hit(o, b)) { b.hp--; return true; }
    return false;
  }

  api.loop(dt => {
    cool -= dt;
    hurt = Math.max(0, hurt - dt);
    const sp = 330 * dt;
    if (api.keys.left) ship.x -= sp;
    if (api.keys.right) ship.x += sp;
    ship.x = U.clamp(ship.x, 0, W - ship.w);
    if (api.keys.a || dragging) fire();

    const alive = aliens.filter(a => a.alive);
    const speed = (26 + wave * 6) * (1 + (1 - alive.length / total) * 3.2);
    ftime += dt;
    if (ftime > Math.max(.08, .5 - (1 - alive.length / total) * .4)) { ftime = 0; frame ^= 1; }
    stepAcc = speed * dt * dirX;
    let edge = false;
    alive.forEach(a => { a.x += stepAcc; if (a.x < 10 || a.x + a.w > W - 10) edge = true; });
    if (edge) {
      dirX *= -1;
      alive.forEach(a => { a.x += -stepAcc; a.y += 16; });
    }
    if (alive.some(a => a.y + a.h >= ship.y)) { lives = 0; return api.end({ msg: 'They landed! Wave ' + wave }); }
    alive.forEach(a => { for (const b of bunkers) if (b.hp > 0 && U.hit(a, b)) b.hp = 0; });

    // alien bombs from the lowest alien in a random column
    if (Math.random() < dt * (0.8 + wave * .35) && alive.length) {
      const shooter = U.pick(alive);
      const low = alive.filter(a => Math.abs(a.x - shooter.x) < 5).sort((p, q) => q.y - p.y)[0];
      bombs.push({ x: low.x + low.w / 2 - 2, y: low.y + low.h, w: 4, h: 12, vy: 190 + wave * 15 });
    }
    shots.forEach(s => { s.y -= 560 * dt; });
    bombs.forEach(b => { b.y += b.vy * dt; });
    shots = shots.filter(s => {
      if (s.y < -20) return false;
      if (hitBunker(s)) return false;
      for (const a of alive) if (a.alive && U.hit(s, a)) {
        a.alive = false;
        score += (5 - a.row) * 10;
        api.setScore(score);
        boom(a.x + a.w / 2, a.y + a.h / 2, ROWC[a.row]);
        api.sfx('pop');
        return false;
      }
      return true;
    });
    bombs = bombs.filter(b => {
      if (b.y > H) return false;
      if (hitBunker(b)) return false;
      if (hurt <= 0 && U.hit(b, ship)) {
        lives--;
        hurt = 1.5;
        boom(ship.x + 20, ship.y + 10, '#00d4ff', 24);
        api.sfx('boom');
        if (lives <= 0) api.end({ msg: 'Wave ' + wave });
        return false;
      }
      return true;
    });
    bunkers = bunkers.filter(b => b.hp > 0);
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    parts = parts.filter(p => p.life > 0);
    if (!aliens.some(a => a.alive)) { api.toast('Wave ' + (wave + 1)); api.sfx('win'); newWave(); }
  }, draw);

  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + .3 }));
  function draw() {
    c.clear('#070a1c');
    ctx.fillStyle = '#ffffff55';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.r, s.r));
    U.text(ctx, 'Wave ' + wave, 12, 22, 15, '#8f99c4', 'left');
    U.text(ctx, '❤'.repeat(Math.max(0, lives)), W - 12, 22, 15, '#ff5c7a', 'right');
    aliens.forEach(a => {
      if (!a.alive) return;
      ctx.fillStyle = ROWC[a.row];
      SPR[frame].forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'X') ctx.fillRect(a.x + x * 3, a.y + y * 3, 3, 3); });
    });
    ctx.fillStyle = '#2ee59d';
    bunkers.forEach(b => { ctx.globalAlpha = b.hp / 3; ctx.fillRect(b.x, b.y, b.w, b.h); });
    ctx.globalAlpha = 1;
    if (!(hurt > 0 && Math.floor(hurt * 10) % 2)) {
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w / 2, ship.y - 8);
      ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
      ctx.lineTo(ship.x, ship.y + ship.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(ship.x + ship.w / 2 - 3, ship.y - 14, 6, 10);
    }
    ctx.fillStyle = '#fff';
    shots.forEach(s => ctx.fillRect(s.x, s.y, s.w, s.h));
    ctx.fillStyle = '#ffc94d';
    bombs.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    parts.forEach(p => { ctx.globalAlpha = p.life * 2; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 3, 3); });
    ctx.globalAlpha = 1;
  }
});
