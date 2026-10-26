// Snake: eat food, grow, avoid walls and yourself. Options: wrap, speed, accel, maze.
Hub.register('snake', (api, o) => {
  const N = 20, CS = 24;
  const c = api.canvas(N * CS, N * CS);
  const ctx = c.ctx;
  api.controls('dpad');

  const walls = new Set();
  if (o.maze) {
    for (let i = 3; i < 17; i++) {
      if (i < 8 || i > 11) { walls.add(i + ',4'); walls.add(i + ',15'); walls.add('4,' + i); walls.add('15,' + i); }
    }
  }
  let snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  let dir = { x: 1, y: 0 }, queue = [], food = null, acc = 0, score = 0, speed = o.speed || 8;
  const occupied = (x, y) => walls.has(x + ',' + y) || snake.some(s => s.x === x && s.y === y);
  function placeFood() {
    const free = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!occupied(x, y)) free.push({ x, y });
    food = free.length ? U.pick(free) : null;
  }
  placeFood();

  const DIRS = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
  const turn = k => {
    const d = DIRS[k];
    if (!d) return;
    const last = queue.length ? queue[queue.length - 1] : dir;
    if ((d.x === -last.x && d.y === -last.y) || (d.x === last.x && d.y === last.y)) return;
    if (queue.length < 3) queue.push(d);
  };
  api.onKey(turn);
  api.onSwipe(turn);

  function tick() {
    if (queue.length) dir = queue.shift();
    const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (o.wrap) { h.x = (h.x + N) % N; h.y = (h.y + N) % N; }
    else if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N) return die();
    if (walls.has(h.x + ',' + h.y)) return die();
    const eat = food && h.x === food.x && h.y === food.y;
    const body = eat ? snake : snake.slice(0, -1);
    if (body.some(s => s.x === h.x && s.y === h.y)) return die();
    snake.unshift(h);
    if (eat) {
      score++;
      api.setScore(score);
      api.sfx('coin');
      if (o.accel) speed = Math.min(22, speed + 0.35);
      placeFood();
      if (!food) api.end({ win: true, msg: 'You filled the whole board!' });
    } else snake.pop();
  }
  function die() { api.end({ msg: 'Length ' + snake.length }); }

  api.loop(dt => {
    acc += dt;
    const step = 1 / speed;
    while (acc >= step && !api.over) { acc -= step; tick(); }
  }, draw);

  function draw() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#16204a' : '#1a2556';
      ctx.fillRect(x * CS, y * CS, CS, CS);
    }
    ctx.fillStyle = '#5a6599';
    walls.forEach(w => { const [x, y] = w.split(',').map(Number); U.rr(ctx, x * CS + 1, y * CS + 1, CS - 2, CS - 2, 4); ctx.fill(); });
    if (food) {
      U.circle(ctx, food.x * CS + CS / 2, food.y * CS + CS / 2 + 1, CS * .38, '#ff4d6d');
      ctx.fillStyle = '#2ee59d';
      ctx.fillRect(food.x * CS + CS / 2, food.y * CS + 3, 3, 5);
    }
    snake.forEach((s, i) => {
      const t = i / Math.max(1, snake.length - 1);
      ctx.fillStyle = `hsl(${150 - t * 40}, 75%, ${55 - t * 18}%)`;
      U.rr(ctx, s.x * CS + 1.5, s.y * CS + 1.5, CS - 3, CS - 3, i === 0 ? 8 : 6);
      ctx.fill();
    });
    const h = snake[0], ex = h.x * CS + CS / 2, ey = h.y * CS + CS / 2;
    const px = -dir.y, py = dir.x;
    [-1, 1].forEach(sg => {
      U.circle(ctx, ex + dir.x * 4 + px * 5 * sg, ey + dir.y * 4 + py * 5 * sg, 3.2, '#fff');
      U.circle(ctx, ex + dir.x * 5.5 + px * 5 * sg, ey + dir.y * 5.5 + py * 5 * sg, 1.6, '#111');
    });
  }
});
