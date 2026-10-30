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
      U.cyl(ctx, p.x, 0, PIPE_W, p.top - 24, '#5ed16a');
      U.cyl(ctx, p.x, p.top + GAP + 24, PIPE_W, GROUND - p.top - GAP - 24, '#5ed16a');
      U.cyl(ctx, p.x - 5, p.top - 24, PIPE_W + 10, 24, '#4cc45a');
      U.cyl(ctx, p.x - 5, p.top + GAP, PIPE_W + 10, 24, '#4cc45a');
      // shadow under each rim + dark outline give the lip real thickness
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(p.x, p.top - 24 - 5, PIPE_W, 5);
      ctx.fillRect(p.x, p.top + GAP + 24, PIPE_W, 5);
      ctx.strokeStyle = 'rgba(10,60,20,.55)'; ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 5, p.top - 24, PIPE_W + 10, 24);
      ctx.strokeRect(p.x - 5, p.top + GAP, PIPE_W + 10, 24);
    });
    const dirt = ctx.createLinearGradient(0, GROUND, 0, H);
    dirt.addColorStop(0, '#e6d08a'); dirt.addColorStop(1, '#b89a50');
    ctx.fillStyle = dirt;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#4e9a2f';
    ctx.fillRect(0, GROUND + 8, W, 8);
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, GROUND, W, 10);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = '#c4ab62';
    for (let x = groundX; x < W; x += 24) ctx.fillRect(x, GROUND + 26, 12, 6);
    U.blob(ctx, bird.x, GROUND + 14, 16 * U.clamp(1 - (GROUND - bird.y) / 500, .3, 1), 5, .35);
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
