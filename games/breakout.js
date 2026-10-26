// Breakout: bounce the ball with the paddle to clear all bricks. Options: hard.
Hub.register('breakout', (api, o) => {
  const W = 480, H = 640;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  api.controls('lr+a');

  const padW = o.hard ? 72 : 100;
  const pad = { x: W / 2 - padW / 2, y: H - 46, w: padW, h: 14 };
  let ball, bricks = [], parts = [], level = 1, lives = 3, score = 0, stuck = true, speed = 0;
  const base = o.hard ? 390 : 320;

  function buildLevel() {
    bricks = [];
    const cols = 10, rows = Math.min(4 + level, 9), bw = 42, bh = 18, gap = 4;
    const ox = (W - (cols * bw + (cols - 1) * gap)) / 2, oy = 76;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      if (level % 3 === 2 && (r + k) % 4 === 0) continue;
      if (level % 3 === 0 && (k === 4 || k === 5) && r % 2) continue;
      const hp = (level >= 2 && r < Math.min(level - 1, 3)) ? 2 : 1;
      bricks.push({ x: ox + k * (bw + gap), y: oy + r * (bh + gap), w: bw, h: bh, hp, col: U.C[r % U.C.length] });
    }
  }
  function resetBall() {
    stuck = true;
    speed = base + (level - 1) * 25;
    ball = { x: pad.x + pad.w / 2, y: pad.y - 9, vx: 0, vy: 0, r: 8 };
  }
  function launch() {
    if (!stuck || api.over) return;
    stuck = false;
    const a = U.rand(-.5, .5);
    ball.vx = Math.sin(a) * speed;
    ball.vy = -Math.cos(a) * speed;
    api.sfx('hit');
  }
  buildLevel();
  resetBall();

  api.onKey(k => { if (k === 'a' || k === 'up') launch(); });
  api.pointer(c, {
    down: x => { pad.x = U.clamp(x - pad.w / 2, 0, W - pad.w); launch(); },
    move: x => { pad.x = U.clamp(x - pad.w / 2, 0, W - pad.w); }
  });

  function burst(x, y, col) {
    for (let i = 0; i < 10; i++) parts.push({ x, y, vx: U.rand(-160, 160), vy: U.rand(-160, 120), life: .6, col });
  }

  function step(dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
    if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < ball.r + 40) { ball.y = ball.r + 40; ball.vy = Math.abs(ball.vy); }
    if (ball.vy > 0 && ball.y + ball.r >= pad.y && ball.y - ball.r <= pad.y + pad.h &&
        ball.x >= pad.x - ball.r && ball.x <= pad.x + pad.w + ball.r) {
      const rel = U.clamp((ball.x - (pad.x + pad.w / 2)) / (pad.w / 2), -1, 1);
      const ang = rel * 1.05;
      speed = Math.min(speed + 4, base * 1.8);
      ball.vx = Math.sin(ang) * speed;
      ball.vy = -Math.cos(ang) * speed;
      ball.y = pad.y - ball.r;
      api.sfx('hit');
    }
    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      const cx = U.clamp(ball.x, b.x, b.x + b.w), cy = U.clamp(ball.y, b.y, b.y + b.h);
      if ((ball.x - cx) ** 2 + (ball.y - cy) ** 2 > ball.r * ball.r) continue;
      const ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
      const oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
      if (ox < oy) { ball.vx = ball.x < b.x + b.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx); }
      else { ball.vy = ball.y < b.y + b.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy); }
      b.hp--;
      if (b.hp <= 0) {
        bricks.splice(i, 1);
        score += 10 * level;
        api.setScore(score);
        burst(b.x + b.w / 2, b.y + b.h / 2, b.col);
        api.sfx('pop');
      } else api.sfx('hit');
      break;
    }
    if (ball.y - ball.r > H) {
      lives--;
      api.sfx('bad');
      if (lives <= 0) return api.end({ msg: 'Reached level ' + level });
      resetBall();
    }
    if (!bricks.length) {
      level++;
      api.sfx('win');
      api.toast('Level ' + level);
      buildLevel();
      resetBall();
    }
  }

  api.loop(dt => {
    const mv = 560 * dt;
    if (api.keys.left) pad.x -= mv;
    if (api.keys.right) pad.x += mv;
    pad.x = U.clamp(pad.x, 0, W - pad.w);
    if (stuck) { ball.x = pad.x + pad.w / 2; ball.y = pad.y - ball.r - 1; }
    else {
      const n = Math.ceil(speed * dt / 4);
      for (let i = 0; i < n && !stuck && !api.over; i++) step(dt / n);
    }
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt; });
    parts = parts.filter(p => p.life > 0);
  }, draw);

  function draw() {
    c.clear('#0f1538');
    ctx.fillStyle = '#18204d';
    ctx.fillRect(0, 0, W, 40);
    U.text(ctx, 'Level ' + level, 14, 20, 16, '#cfd6ff', 'left');
    U.text(ctx, '❤'.repeat(lives), W - 14, 21, 16, '#ff5c7a', 'right');
    bricks.forEach(b => {
      ctx.fillStyle = b.col;
      ctx.globalAlpha = b.hp > 1 ? 1 : .85;
      U.rr(ctx, b.x, b.y, b.w, b.h, 5);
      ctx.fill();
      if (b.hp > 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life / .6); ctx.fillStyle = p.col; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); });
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(pad.x, 0, pad.x + pad.w, 0);
    g.addColorStop(0, '#00d4ff'); g.addColorStop(1, '#7c5cff');
    ctx.fillStyle = g;
    U.rr(ctx, pad.x, pad.y, pad.w, pad.h, 7);
    ctx.fill();
    U.circle(ctx, ball.x, ball.y, ball.r, '#fff');
    if (stuck && !api.over) U.text(ctx, api.isTouch ? 'Tap to launch' : 'Click or press Space to launch', W / 2, H - 100, 16, '#8f99c4');
  }
});
