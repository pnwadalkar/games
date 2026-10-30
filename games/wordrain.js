// Word Rain: words fall from the top. Type them before they hit the ground. Five misses and the rain wins.
Hub.register('wordrain', (api) => {
  const pool = WORDS.five.concat(WORDS.all).filter(w => w.length >= 3 && w.length <= 8 && /^[a-z]+$/.test(w));
  const box = api.dom();
  box.style.maxWidth = '520px';
  const field = api.el('div', { style: { position: 'relative', width: '100%', height: 'min(56vh, 460px)', minHeight: '260px', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(180deg,#1b2a6b,#0d1236)', boxShadow: 'inset 0 0 0 2px #2a3566, 0 8px 0 #0a0f26', touchAction: 'manipulation' } });
  const ground = api.el('div', { style: { position: 'absolute', left: '0', right: '0', bottom: '0', height: '10px', background: 'linear-gradient(180deg,#ff5c7a,#b3263f)' } });
  field.appendChild(ground);
  const input = api.el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Type the falling words…', 'aria-label': 'Type here' });
  const info = api.el('div', { class: 'muted', text: '' });
  [field, input, info].forEach(e => box.appendChild(e));
  const words = [];
  let lives = 5, score = 0, spawnT = .4, t = 0, speed = 38, combo = 0;
  const upInfo = () => { info.textContent = 'Lives ' + '❤'.repeat(Math.max(0, lives)) + ' · Combo ×' + combo; };
  upInfo();

  function spawn() {
    const w = U.pick(pool.filter(x => !words.some(q => q.w[0] === x[0])));
    if (!w) return;
    const el = api.el('div', { style: { position: 'absolute', left: '0', top: '0', padding: '4px 10px', borderRadius: '10px', background: 'linear-gradient(180deg,#f7f3ff,#cfc7f5)', color: '#241c52', fontWeight: '800', fontSize: '19px', boxShadow: '0 4px 0 #6a5cc2, 0 8px 12px rgba(0,0,0,.35)', whiteSpace: 'nowrap', willChange: 'transform' } });
    field.appendChild(el);
    words.push({ w, el, x: U.rand(.04, .75), y: -30, v: speed * U.rand(.8, 1.25), typed: 0 });
  }
  function render(wd) { wd.el.innerHTML = '<span style="color:#1f9d55">' + wd.w.slice(0, wd.typed) + '</span>' + wd.w.slice(wd.typed); }

  input.addEventListener('input', () => {
    const v = input.value.toLowerCase().trim();
    let hit = null;
    words.forEach(wd => { wd.typed = v && wd.w.startsWith(v) ? v.length : 0; render(wd); wd.el.style.outline = wd.typed ? '3px solid #ffd23f' : ''; });
    hit = words.find(wd => wd.w === v);
    if (hit) {
      score += hit.w.length * 10 + combo * 5; combo++; api.setScore(score); api.sfx('coin');
      hit.el.remove(); words.splice(words.indexOf(hit), 1); input.value = ''; upInfo();
    }
  });
  input.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); input.value = ''; words.forEach(wd => { wd.typed = 0; render(wd); wd.el.style.outline = ''; }); } if (e.key !== 'Escape') e.stopPropagation(); });
  setTimeout(() => input.focus({ preventScroll: true }), 80);
  api.on(field, 'pointerdown', () => input.focus({ preventScroll: true }));

  api.loop(dt => {
    t += dt; speed = 38 + t * 1.1;
    spawnT -= dt;
    if (spawnT <= 0 && words.length < 7) { spawn(); spawnT = Math.max(.9, 2.4 - t / 60); }
    const h = field.clientHeight, w = field.clientWidth;
    words.slice().forEach(wd => {
      wd.y += wd.v * dt;
      if (wd.y > h - 36) {
        wd.el.remove(); words.splice(words.indexOf(wd), 1); lives--; combo = 0; api.sfx('bad'); upInfo();
        if (lives <= 0) api.end({ msg: score + ' points', emoji: '🌧️' });
      }
    });
    words.forEach(wd => { wd.el.style.transform = 'translate(' + wd.x * (w - 100) + 'px,' + wd.y + 'px)'; });
  }, null);
});
