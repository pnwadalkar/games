// Number Sequence: work out the pattern and pick the next number. Right answers add time; wrong ones cost time.
Hub.register('sequence', (api) => {
  const W = 400, H = 560, START = 45;
  const c = api.canvas(W, H);
  const ctx = c.ctx;
  let seq, answer, options, score = 0, left = START, t = 0, flash = 0, flashOk = true, started = false, t0 = 0, streak = 0, bonus = 0, note = '';
  const BTN = i => ({ x: 24 + (i % 2) * 180, y: 330 + Math.floor(i / 2) * 82, w: 172, h: 66 });

  function make() {
    const lvl = score, k = U.randi(0, lvl < 3 ? 2 : 6);
    let a = U.randi(1, 9), d = U.randi(2, 9), s = [];
    if (k === 0) { for (let i = 0; i < 6; i++) s.push(a + d * i); note = 'add ' + d; }
    else if (k === 1) { d = U.randi(2, 5); a = U.randi(1, 5); for (let i = 0; i < 6; i++) s.push(a * Math.pow(d, i)); note = '×' + d; if (s[5] > 3000) return make(); }
    else if (k === 2) { a = U.randi(40, 90); for (let i = 0; i < 6; i++) s.push(a - d * i); note = 'subtract ' + d; }
    else if (k === 3) { const o = U.randi(0, 3); for (let i = 1; i <= 6; i++) s.push((i + o) * (i + o)); note = 'squares'; }
    else if (k === 4) { let x = U.randi(1, 4), y = U.randi(1, 4); s = [x, y]; for (let i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]); note = 'Fibonacci-style'; }
    else if (k === 5) { const e = U.randi(2, 6), o = U.randi(2, 6); let v = U.randi(1, 9); for (let i = 0; i < 6; i++) { s.push(v); v += i % 2 ? o : e; } note = 'alternating +' + e + ' / +' + o; }
    else { for (let i = 1; i <= 6; i++) s.push(i * i * i); note = 'cubes'; }
    // the sequence in the question hides the sixth term
    answer = s[5]; seq = s.slice(0, 5);
    const set = new Set([answer]);
    while (set.size < 4) { const v = answer + U.randi(-9, 9); if (v > 0 && v !== answer) set.add(v); }
    options = U.shuffle([...set]);
  }
  make();
  api.status('What comes next?');

  function pick(i) {
    if (api.over || flash > .1) return;
    if (!started) { started = true; t0 = performance.now(); }
    if (options[i] === answer) { score++; streak++; left = Math.min(60, left + 3); api.setScore(score); api.sfx('coin'); flashOk = true; }
    else { streak = 0; left -= 5; api.sfx('bad'); flashOk = false; }
    flash = .4; make();
  }
  api.pointer(c, { down: (x, y) => { for (let i = 0; i < 4; i++) if (U.inR(x, y, BTN(i))) pick(i); } });
  api.on(window, 'keydown', e => { if (/^[1-4]$/.test(e.key)) pick(+e.key - 1); });
  api.loop(dt => {
    t += dt; flash = Math.max(0, flash - dt);
    if (started) { left -= dt; if (left <= 0 && !api.over) api.end({ win: true, title: 'Time!', msg: score + ' sequences solved', score, emoji: '🔢' }); }
  }, draw, true);

  function draw() {
    c.clear('#14122e');
    U.text(ctx, Math.max(0, Math.ceil(left)) + 's', 20, 32, 24, left < 10 ? '#ff5c7a' : '#9fb2ff', 'left', 900);
    U.text(ctx, 'Solved ' + score, W - 20, 32, 20, '#fff', 'right', 800);
    if (flash > 0) { ctx.fillStyle = (flashOk ? 'rgba(46,229,157,' : 'rgba(255,77,109,') + flash * .8 + ')'; ctx.fillRect(0, 0, W, 8); }
    ctx.fillStyle = '#231f4a'; U.rr(ctx, 16, 76, W - 32, 190, 22); ctx.fill();
    const n = seq.length + 1, gap = (W - 56) / n;
    for (let i = 0; i < n; i++) {
      const x = 28 + gap * i + gap / 2, last = i === seq.length;
      U.box(ctx, x - gap / 2 + 4, 150, gap - 8, 54, last ? '#ffb703' : '#4a56a8', 8);
      U.text(ctx, last ? '?' : seq[i], x, 180, seq[i] > 999 ? 15 : 22, '#fff', 'center', 900);
    }
    U.text(ctx, 'Find the pattern', W / 2, 108, 16, '#9fb2ff', 'center', 700);
    options.forEach((v, i) => U.btn(ctx, BTN(i), v, '#5b6bd6', 26));
    if (streak >= 3) U.text(ctx, 'Streak ' + streak, W / 2, 300, 14, '#ffe27a', 'center', 800);
  }
});
