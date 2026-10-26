// Pong (vertical so it fits phones). Options: ai ('easy'|'hard'), twoP.
Hub.register('pong', (api, o) => {
  const W = 400, H = 640, PW = 80, PH = 12, WIN = 7;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  if (!o.twoP) api.controls('lr');

  const bot = { x: W / 2 - PW / 2, y: H - 34, s: 0 };
  const top = { x: W / 2 - PW / 2, y: 22, s: 0 };
  let ball, wait = 1, serveDir = 1, flash = 0;
  const aiSpeed = o.ai === 'hard' ? 470 : 250;
  let aiErr = 0;

  function serve() {
    const a = U.rand(-.45, .45);
    ball = { x: W / 2, y: H / 2, r: 8, sp: 330, vx: Math.sin(a) * 330, vy: Math.cos(a) * 330 * serveDir };
  }
  serve();
  ball.vx = 0; ball.vy = 0;

  // Multi-touch: each pointer drives the paddle on its half (or the bottom paddle in 1P).
  const ptrs = {};
  const toLocal = e => {
    const r = c.cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
  };
  const drive = e => {
    const [x, y] = toLocal(e);
    const p = !o.twoP || y > H / 2 ? bot : top;
    p.x = U.clamp(x - PW / 2, 0, W - PW);
  };
  api.on(c.cv, 'pointerdown', e => { e.preventDefault(); ptrs[e.pointerId] = 1; try { c.cv.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } drive(e); });
  api.on(c.cv, 'pointermove', e => { if (ptrs[e.pointerId] || e.pointerType === 'mouse') drive(e); });
  api.on(c.cv, 'pointerup', e => { delete ptrs[e.pointerId]; });
  api.on(c.cv, 'pointercancel', e => { delete ptrs[e.pointerId]; });

  function predictX() {
    // Reflect the ball's path off the side walls to where it reaches the top paddle.
    let t = (ball.y - (top.y + PH)) / -ball.vy;
    let x = ball.x + ball.vx * t;
    const span = W - 2 * ball.r;
    x -= ball.r;
    x = ((x % (2 * span)) + 2 * span) % (2 * span);
    if (x > span) x = 2 * span - x;
    return x + ball.r;
  }

  function hitPaddle(p, dirDown) {
    const rel = U.clamp((ball.x - (p.x + PW / 2)) / (PW / 2), -1, 1);
    ball.sp = Math.min(ball.sp + 22, 760);
    const a = rel * 1.0;
    ball.vx = Math.sin(a) * ball.sp;
    ball.vy = Math.cos(a) * ball.sp * (dirDown ? 1 : -1);
    api.sfx('hit');
    if (p === top) aiErr = U.rand(-1, 1) * (o.ai === 'hard' ? 14 : 40);
  }

  function point(toBottom) {
    if (toBottom) bot.s++; else top.s++;
    api.sfx(toBottom ? 'score' : 'bad');
    flash = .4;
    if (!o.twoP) api.setScore(bot.s);
    if (bot.s >= WIN || top.s >= WIN) {
      const youWin = bot.s >= WIN;
      if (o.twoP) return api.end({ win: true, emoji: '🏓', title: (youWin ? 'Bottom' : 'Top') + ' player wins!', msg: bot.s + ' – ' + top.s });
      return api.end({ win: youWin, msg: bot.s + ' – ' + top.s, title: youWin ? 'You win!' : 'CPU wins' });
    }
    serveDir = toBottom ? -1 : 1;
    wait = 0.9;
    serve();
  }

  api.loop(dt => {
    const sp = 520 * dt;
    if (o.twoP) {
      if (api.held.ArrowLeft) bot.x -= sp;
      if (api.held.ArrowRight) bot.x += sp;
      if (api.held.KeyA) top.x -= sp;
      if (api.held.KeyD) top.x += sp;
    } else {
      if (api.keys.left) bot.x -= sp;
      if (api.keys.right) bot.x += sp;
      const target = ball.vy < 0 ? predictX() + aiErr : W / 2;
      const d = target - (top.x + PW / 2);
      top.x += U.clamp(d, -aiSpeed * dt, aiSpeed * dt);
    }
    bot.x = U.clamp(bot.x, 0, W - PW);
    top.x = U.clamp(top.x, 0, W - PW);
    flash = Math.max(0, flash - dt);
    if (wait > 0) {
      wait -= dt;
      if (wait <= 0 && ball.vy === 0) serve();
      if (wait > 0) return;
    }
    const n = Math.ceil(ball.sp * dt / 5);
    for (let i = 0; i < n; i++) {
      ball.x += ball.vx * dt / n;
      ball.y += ball.vy * dt / n;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.vy > 0 && ball.y + ball.r >= bot.y && ball.y < bot.y + PH && ball.x > bot.x - ball.r && ball.x < bot.x + PW + ball.r) {
        ball.y = bot.y - ball.r; hitPaddle(bot, false);
      }
      if (ball.vy < 0 && ball.y - ball.r <= top.y + PH && ball.y > top.y && ball.x > top.x - ball.r && ball.x < top.x + PW + ball.r) {
        ball.y = top.y + PH + ball.r; hitPaddle(top, true);
      }
      if (ball.y > H + 20) { point(false); break; }
      if (ball.y < -20) { point(true); break; }
    }
  }, draw);

  function draw() {
    c.clear('#0d1333');
    if (flash > 0) { ctx.fillStyle = `rgba(124,92,255,${flash * .4})`; ctx.fillRect(0, 0, W, H); }
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#2a3566';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);
    U.text(ctx, top.s, W - 30, H / 2 - 36, 40, '#3b4a8a');
    U.text(ctx, bot.s, W - 30, H / 2 + 38, 40, '#3b4a8a');
    if (o.twoP) {
      U.text(ctx, 'P2 · A / D', 14, H / 2 - 36, 13, '#3b4a8a', 'left');
      U.text(ctx, 'P1 · ← / →', 14, H / 2 + 38, 13, '#3b4a8a', 'left');
    }
    ctx.fillStyle = '#ff5c7a'; U.rr(ctx, top.x, top.y, PW, PH, 6); ctx.fill();
    ctx.fillStyle = '#00d4ff'; U.rr(ctx, bot.x, bot.y, PW, PH, 6); ctx.fill();
    U.circle(ctx, ball.x, ball.y, ball.r, '#fff');
  }
});
