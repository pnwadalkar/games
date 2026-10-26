// Flappy: tap to flap through the gaps. Options: hard.
Hub.register('flappy', (api, o) => {
  const W = 400, H = 640, GROUND = H - 70;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  const GAP = o.hard ? 138 : 170, SPEED = o.hard ? 200 : 165, PIPE_W = 66, SPACING = 230;
  const bird = { x: 110, y: H / 2 - 40, vy: 0, r: 15 };
  let pipes = [], started = false, score = 0, t = 0, groundX = 0, dead = false;
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 110, y: U.rand(40, 260), s: U.rand(.6, 1.2) }));

  function flap() {
    if (api.over || dead) return;
    if (!started) { started = true; pipes.push(newPipe(W + 40)); }
    bird.vy = -430;
    api.sfx('jump');
  }
  function newPipe(x) { return { x, top: U.rand(90, GROUND - GAP - 70), passed: false }; }
  api.on(api.stage, 'pointerdown', e => { e.preventDefault(); flap(); });
  api.onKey(k => { if (k === 'a' || k === 'up') flap(); });

  function crash() {
    if (dead) return;
    dead = true;
    api.sfx('hit');
    api.end({ msg: score + ' pipe' + (score === 1 ? '' : 's') });
  }

  api.loop(dt => {
    t += dt;
    if (!started) { bird.y = H / 2 - 40 + Math.sin(t * 4) * 8; return; }
    bird.vy += 1500 * dt;
    bird.y += bird.vy * dt;
    groundX = (groundX - SPEED * dt) % 24;
    clouds.forEach(cl => { cl.x -= SPEED * .2 * cl.s * dt; if (cl.x < -80) cl.x = W + 40; });
    pipes.forEach(p => {
      p.x -= SPEED * dt;
      if (!p.passed && p.x + PIPE_W < bird.x) { p.passed = true; score++; api.setScore(score); api.sfx('score'); }
    });
    if (pipes.length && pipes[pipes.length - 1].x < W - SPACING) pipes.push(newPipe(W + 10));
    pipes = pipes.filter(p => p.x > -PIPE_W - 10);
    if (bird.y + bird.r > GROUND) { bird.y = GROUND - bird.r; crash(); }
    if (bird.y < -40) bird.y = -40;
    for (const p of pipes) {
      if (bird.x + bird.r - 3 > p.x && bird.x - bird.r + 3 < p.x + PIPE_W &&
          (bird.y - bird.r + 3 < p.top || bird.y + bird.r - 3 > p.top + GAP)) crash();
    }
  }, draw);

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#3a8dde'); sky.addColorStop(1, '#9fe3ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    clouds.forEach(cl => {
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, 22 * cl.s, 0, 7); ctx.arc(cl.x + 24 * cl.s, cl.y - 8 * cl.s, 26 * cl.s, 0, 7); ctx.arc(cl.x + 50 * cl.s, cl.y, 20 * cl.s, 0, 7);
      ctx.fill();
    });
    pipes.forEach(p => {
      const g = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
      g.addColorStop(0, '#3fbf4f'); g.addColorStop(.5, '#7ee26f'); g.addColorStop(1, '#2f9a3d');
      ctx.fillStyle = g;
      ctx.fillRect(p.x, 0, PIPE_W, p.top);
      ctx.fillRect(p.x, p.top + GAP, PIPE_W, GROUND - p.top - GAP);
      ctx.fillStyle = '#2f9a3d';
      ctx.fillRect(p.x - 5, p.top - 24, PIPE_W + 10, 24);
      ctx.fillRect(p.x - 5, p.top + GAP, PIPE_W + 10, 24);
    });
    ctx.fillStyle = '#d9c27a';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, GROUND, W, 14);
    ctx.fillStyle = '#c4ab62';
    for (let x = groundX; x < W; x += 24) ctx.fillRect(x, GROUND + 22, 12, 6);
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(U.clamp(bird.vy / 700, -.5, 1.2));
    U.circle(ctx, 0, 0, bird.r, '#ffd23f');
    ctx.fillStyle = '#ffb703';
    ctx.beginPath(); ctx.ellipse(-4, 3, 8, 5, -.3, 0, 7); ctx.fill();
    U.circle(ctx, 6, -5, 5, '#fff');
    U.circle(ctx, 8, -5, 2.4, '#111');
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath(); ctx.moveTo(12, -1); ctx.lineTo(22, 3); ctx.lineTo(12, 6); ctx.fill();
    ctx.restore();
    U.text(ctx, score, W / 2, 70, 52, '#fff', 'center', 900);
    if (!started) U.text(ctx, 'Tap / Space to flap', W / 2, H / 2 + 60, 20, '#fff');
  }
});
