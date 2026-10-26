// Player runtime: loads one game, gives it a small API (canvas, input, score, sound, overlays).
(function () {
  'use strict';
  const Hub = window.Hub;
  const $ = id => document.getElementById(id);

  // ---------- shared utilities available to every game as window.U ----------
  const U = window.U = {
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      return arr;
    },
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    grid: (w, h, v) => Array.from({ length: h }, () => Array.from({ length: w }, typeof v === 'function' ? v : () => v)),
    rr(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    text(ctx, s, x, y, size, color, align, weight) {
      ctx.font = (weight || 700) + ' ' + size + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = color || '#fff';
      ctx.textAlign = align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s, x, y);
    },
    circle(ctx, x, y, r, color) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    },
    hit: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    // Playing cards: {r: 1..13, s: 0..3 (♠♥♦♣)}; deck() returns a shuffled 52-card deck.
    SUITS: ['♠', '♥', '♦', '♣'],
    RANKS: ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    deck() {
      const d = [];
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s, up: false });
      return U.shuffle(d);
    },
    drawCard(ctx, x, y, w, h, card, faceDown) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      U.rr(ctx, x + 1, y + 2, w, h, w * .1); ctx.fill();
      if (faceDown || !card) {
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, '#5b3fd9'); g.addColorStop(1, '#2f7bff');
        ctx.fillStyle = g;
        U.rr(ctx, x, y, w, h, w * .1); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
        U.rr(ctx, x + w * .1, y + w * .1, w * .8, h - w * .2, w * .06); ctx.stroke();
        return;
      }
      ctx.fillStyle = '#fdfdff';
      U.rr(ctx, x, y, w, h, w * .1); ctx.fill();
      ctx.strokeStyle = '#c9cde6'; ctx.lineWidth = 1; ctx.stroke();
      const red = card.s === 1 || card.s === 2, col = red ? '#e0244a' : '#1b1e33';
      U.text(ctx, U.RANKS[card.r], x + w * .06, y + h * .12, w * .26, col, 'left', 800);
      U.text(ctx, U.SUITS[card.s], x + w * .06, y + h * .3, w * .22, col, 'left', 700);
      U.text(ctx, U.SUITS[card.s], x + w * .55, y + h * .62, w * .55, col, 'center', 700);
    },
    C: ['#ff5c7a', '#ffc94d', '#2ee59d', '#00d4ff', '#7c5cff', '#ff8a3d', '#ff5cc8', '#b8f35a'],
    BG: '#10163a', BG2: '#1a2250', LINE: '#2a3566', TXT: '#eef1ff', MUTED: '#8f99c4'
  };

  const meta = Hub.find(new URLSearchParams(location.search).get('g'));
  if (!meta) { location.replace('./'); return; }

  document.title = meta.name + ' · GameNest';
  $('gIcon').textContent = meta.icon;
  $('gName').textContent = meta.name;

  const stage = $('stage'), pad = $('pad'), overlay = $('overlay'), modal = $('modal');
  const statusEl = $('status'), scoreEl = $('score'), bestEl = $('best');
  const btnPause = $('btnPause'), btnSound = $('btnSound'), btnFs = $('btnFs');
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const bestKey = 'best:' + meta.id;

  $('scoreLbl').textContent = meta.label;
  if (meta.best === 'none') $('stats').hidden = true;
  if (meta.hideScore) $('scoreBox').hidden = true;
  const showBest = () => {
    const b = Hub.LS.get(bestKey, null);
    bestEl.textContent = b == null ? '–' : Hub.fmt(b, meta.fmt);
  };
  showBest();

  const recent = Hub.LS.get('recent', []).filter(x => x !== meta.id);
  recent.unshift(meta.id);
  Hub.LS.set('recent', recent.slice(0, 16));

  // ---------- sound ----------
  let muted = Hub.LS.get('muted', false);
  let actx = null;
  const syncSound = () => { btnSound.textContent = muted ? '🔇' : '🔊'; };
  syncSound();
  function tone(freq, dur, type, vol, toFreq) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
      g.gain.setValueAtTime(vol || .06, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + .02);
    } catch (e) { /* audio unsupported */ }
  }
  const SFX = {
    click: () => tone(700, .04, 'square', .04),
    move: () => tone(340, .04, 'triangle', .06),
    flip: () => tone(560, .05, 'triangle', .07),
    hit: () => tone(440, .06, 'square', .05),
    pop: () => tone(900, .08, 'sine', .08, 300),
    score: () => tone(880, .09, 'sine', .08),
    coin: () => { tone(988, .06, 'square', .04); setTimeout(() => tone(1319, .14, 'square', .04), 60); },
    jump: () => tone(300, .12, 'square', .04, 600),
    shoot: () => tone(1200, .08, 'square', .03, 300),
    boom: () => tone(140, .35, 'sawtooth', .07, 40),
    bad: () => tone(170, .22, 'square', .06),
    die: () => tone(380, .5, 'sawtooth', .07, 60),
    win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .18, 'triangle', .08), i * 110))
  };

  // ---------- overlay ----------
  let modalPrimary = null, modalOpen = false;
  function showModal({ emoji, title, html, buttons }) {
    modal.innerHTML = '';
    const head = document.createElement('div');
    head.innerHTML = (emoji ? '<div class="big-emo">' + emoji + '</div>' : '') +
      '<h2></h2>' + (html || '');
    head.querySelector('h2').textContent = title || '';
    modal.appendChild(head);
    const row = document.createElement('div');
    row.className = 'btns';
    modalPrimary = null;
    (buttons || []).forEach(b => {
      const el = document.createElement('button');
      el.className = 'btn' + (b.primary ? ' primary' : '');
      el.textContent = b.label;
      el.onclick = () => { hideModal(); b.fn && b.fn(); };
      if (b.primary) modalPrimary = el;
      row.appendChild(el);
    });
    modal.appendChild(row);
    overlay.hidden = false;
    modalOpen = true;
    setTimeout(() => modalPrimary && modalPrimary.focus({ preventScroll: true }), 50);
  }
  function hideModal() { overlay.hidden = true; modalOpen = false; }

  let toastTimer;
  function toast(msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 1400);
  }

  // ---------- input mapping ----------
  const KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down',
    Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyZ: 'a', KeyX: 'b', ShiftLeft: 'b', ShiftRight: 'b'
  };
  const PADLBL = { left: '◀', right: '▶', up: '▲', down: '▼', a: '●', b: '■' };

  // ---------- session ----------
  let S = null; // current session api

  function createSession() {
    const cleanups = [], keyFns = [], keyUpFns = [], resizeFns = [];
    let usesLoop = false, newBest = false;
    const prevBest = Hub.LS.get(bestKey, null);

    const api = {
      meta, opt: meta.opt, stage, isTouch, U,
      keys: {}, held: {}, paused: false, over: false, score: 0,
      _cleanups: cleanups, _keyFns: keyFns, _keyUpFns: keyUpFns, _resizeFns: resizeFns,
      get usesLoop() { return usesLoop; },

      on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); cleanups.push(() => target.removeEventListener(ev, fn, opts)); },
      after(ms, fn) { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; },
      every(ms, fn) { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); return id; },
      cleanup(fn) { cleanups.push(fn); },
      onKey(fn) { keyFns.push(fn); },
      onKeyUp(fn) { keyUpFns.push(fn); },
      onResize(fn) { resizeFns.push(fn); },
      sfx(name) { SFX[name] && SFX[name](); },
      tone,
      toast,
      status(t) { statusEl.textContent = t == null ? '' : t; },
      size() { const r = stage.getBoundingClientRect(); return { w: r.width - 20, h: r.height - 20 }; },
      portrait() { const s = api.size(); return s.h > s.w * 1.05; },

      setScore(n) {
        api.score = n;
        scoreEl.textContent = Hub.fmt(n, meta.fmt);
        if (meta.best === 'high' && n > 0) {
          const b = Hub.LS.get(bestKey, null);
          if (b == null || n > b) {
            Hub.LS.set(bestKey, n);
            if (prevBest != null && n > prevBest) newBest = true;
            if (prevBest == null) newBest = true;
            showBest();
          }
        }
      },
      addScore(d) { api.setScore(api.score + d); },

      // End the round. opts: {win, title, msg, score, emoji}
      end(opts) {
        opts = opts || {};
        if (api.over) return;
        api.over = true;
        if (meta.best === 'low' && opts.win && opts.score != null) {
          const b = Hub.LS.get(bestKey, null);
          if (b == null || opts.score < b) { Hub.LS.set(bestKey, opts.score); newBest = true; showBest(); }
        }
        if (meta.best === 'high' && opts.score != null) api.setScore(opts.score);
        api.sfx(opts.win ? 'win' : (opts.sound || 'die'));
        const shown = opts.score != null ? opts.score : (meta.best === 'high' ? api.score : null);
        const html =
          (opts.msg ? '<p>' + opts.msg + '</p>' : '') +
          (shown != null && meta.best !== 'none' ? '<div class="scoreline">' + Hub.fmt(shown, meta.fmt) + '</div>' : '') +
          (newBest && meta.best !== 'none' ? '<p style="color:var(--warn);font-weight:700">★ New best!</p>' : '');
        api.after(opts.delay != null ? opts.delay : 700, () => showModal({
          emoji: opts.emoji || (opts.win ? '🏆' : '💥'),
          title: opts.title || (opts.win ? 'You win!' : 'Game over'),
          html,
          buttons: [
            { label: 'Menu', fn: () => { location.href = './'; } },
            { label: 'Play again', primary: true, fn: restart }
          ]
        }));
      },

      // Fixed logical-size canvas scaled to fit the stage. draw() is re-run after every resize.
      canvas(w, h, draw) {
        const cv = document.createElement('canvas');
        stage.appendChild(cv);
        const ctx = cv.getContext('2d');
        const c = { cv, ctx, w, h, scale: 1, draw };
        const fit = () => {
          const r = api.size();
          const s = Math.max(.05, Math.min(r.w / c.w, r.h / c.h));
          const cw = Math.floor(c.w * s), ch = Math.floor(c.h * s);
          const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
          cv.style.width = cw + 'px';
          cv.style.height = ch + 'px';
          cv.width = Math.max(1, Math.round(cw * dpr));
          cv.height = Math.max(1, Math.round(ch * dpr));
          c.scale = s;
          ctx.setTransform(cv.width / c.w, 0, 0, cv.height / c.h, 0, 0);
          if (c.draw) c.draw();
        };
        c.fit = fit;
        c.resize = (nw, nh) => { c.w = nw; c.h = nh; fit(); };
        c.clear = (color) => { ctx.fillStyle = color || U.BG; ctx.fillRect(0, 0, c.w, c.h); };
        fit();
        resizeFns.push(fit);
        api.on(cv, 'contextmenu', e => e.preventDefault());
        return c;
      },

      // Pointer events in canvas logical coordinates.
      pointer(c, h) {
        const pos = e => {
          const r = c.cv.getBoundingClientRect();
          return [(e.clientX - r.left) / r.width * c.w, (e.clientY - r.top) / r.height * c.h];
        };
        let downId = null;
        api.on(c.cv, 'pointerdown', e => {
          e.preventDefault();
          downId = e.pointerId;
          try { c.cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          if (h.down) { const p = pos(e); h.down(p[0], p[1], e); }
        });
        api.on(c.cv, 'pointermove', e => {
          if (h.move) { const p = pos(e); h.move(p[0], p[1], e, downId === e.pointerId); }
        });
        const up = e => {
          if (downId !== e.pointerId) return;
          downId = null;
          if (h.up) { const p = pos(e); h.up(p[0], p[1], e); }
        };
        api.on(c.cv, 'pointerup', up);
        api.on(c.cv, 'pointercancel', up);
      },

      onSwipe(fn, el) {
        el = el || stage;
        let sx = 0, sy = 0, st = 0, active = false;
        api.on(el, 'pointerdown', e => { sx = e.clientX; sy = e.clientY; st = Date.now(); active = true; });
        api.on(el, 'pointerup', e => {
          if (!active) return;
          active = false;
          const dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 22 || Date.now() - st > 800) return;
          fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        });
      },

      // Real-time loop. update(dt) is skipped while paused or over; draw() always runs.
      // Pass anim=true for turn-based games that only animate (no pause button).
      loop(update, draw, anim) {
        if (!anim) { usesLoop = true; btnPause.hidden = false; }
        let last = performance.now(), raf = 0;
        const frame = t => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((t - last) / 1000, 1 / 30);
          last = t;
          if (!api.paused && !api.over) update(dt);
          if (draw) draw();
        };
        raf = requestAnimationFrame(frame);
        cleanups.push(() => cancelAnimationFrame(raf));
      },

      // On-screen touch controls (shown only on touch devices).
      controls(layout) {
        pad.innerHTML = '';
        if (!isTouch || !layout) { pad.classList.remove('show'); return; }
        const mk = (k, cls) => {
          const b = document.createElement('button');
          b.className = 'pbtn ' + (cls || '');
          b.textContent = PADLBL[k] || k;
          const down = e => { e.preventDefault(); b.classList.add('down'); press(k, true); };
          const upf = e => { e.preventDefault(); b.classList.remove('down'); press(k, false); };
          b.addEventListener('pointerdown', down);
          b.addEventListener('pointerup', upf);
          b.addEventListener('pointercancel', upf);
          b.addEventListener('pointerleave', upf);
          b.addEventListener('contextmenu', e => e.preventDefault());
          return b;
        };
        const grp = () => { const g = document.createElement('div'); g.className = 'grp'; pad.appendChild(g); return g; };
        if (layout.startsWith('dpad')) {
          const g = grp(), d = document.createElement('div');
          d.className = 'dpad';
          ['', 'up', '', 'left', '', 'right', '', 'down', ''].forEach(k => d.appendChild(k ? mk(k) : document.createElement('span')));
          g.appendChild(d);
          const g2 = grp();
          if (layout.includes('+a')) g2.appendChild(mk('a', 'big'));
        } else if (layout === 'lr') {
          grp().appendChild(mk('left'));
          grp().appendChild(mk('right'));
        } else if (layout === 'lr+a') {
          const g = grp(); g.appendChild(mk('left')); g.appendChild(mk('right'));
          grp().appendChild(mk('a', 'big'));
        } else if (layout === 'lr+ua') {
          const g = grp(); g.appendChild(mk('left')); g.appendChild(mk('right'));
          const g2 = grp(); g2.appendChild(mk('up')); g2.appendChild(mk('a', 'big'));
        } else if (layout === 'lr+ud') {
          const g = grp(); g.appendChild(mk('left')); g.appendChild(mk('right'));
          const g2 = grp(); g2.appendChild(mk('up')); g2.appendChild(mk('down'));
        } else if (layout === 'blocks') {
          const g = grp(); g.appendChild(mk('left')); g.appendChild(mk('down')); g.appendChild(mk('right'));
          const g2 = grp(); g2.appendChild(mk('up')); g2.appendChild(mk('a', 'big'));
        } else if (layout === 'a') {
          pad.style.justifyContent = 'center';
          grp().appendChild(mk('a', 'big'));
        }
        pad.classList.add('show');
        cleanups.push(() => { pad.innerHTML = ''; pad.classList.remove('show'); pad.style.justifyContent = ''; });
      },

      // DOM container for non-canvas games.
      dom(cls) {
        const d = document.createElement('div');
        d.className = 'gui ' + (cls || '');
        stage.appendChild(d);
        return d;
      },
      el(tag, props, children) {
        const e = document.createElement(tag);
        if (props) for (const k in props) {
          if (k === 'style' && typeof props[k] === 'object') Object.assign(e.style, props[k]);
          else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
          else if (k === 'text') e.textContent = props[k];
          else if (k === 'html') e.innerHTML = props[k];
          else e.setAttribute(k, props[k]);
        }
        (children || []).forEach(ch => e.appendChild(typeof ch === 'string' ? document.createTextNode(ch) : ch));
        return e;
      },

      // Small helper for turn-based "pick a mode" dialogs inside a game.
      choose(title, options, fn, emoji) {
        showModal({
          emoji: emoji || meta.icon, title,
          buttons: options.map((o, i) => ({ label: o, primary: i === options.length - 1, fn: () => fn(i) }))
        });
      }
    };

    function press(k, isDown) {
      if (isDown) {
        if (!api.keys[k]) keyFns.forEach(f => f(k, null, null));
        api.keys[k] = true;
      } else {
        api.keys[k] = false;
        keyUpFns.forEach(f => f(k, null, null));
      }
    }
    api.press = press;
    return api;
  }

  function destroy() {
    if (!S) return;
    S._cleanups.slice().reverse().forEach(f => { try { f(); } catch (e) { console.error(e); } });
    S = null;
    stage.innerHTML = '';
    statusEl.textContent = '';
    scoreEl.textContent = '0';
    btnPause.hidden = true;
  }

  function start() {
    destroy();
    hideModal();
    S = createSession();
    window.__session = S;
    scoreEl.textContent = Hub.fmt(0, meta.fmt);
    try {
      Hub.factories[meta.engine](S, meta.opt || {});
    } catch (e) {
      console.error(e);
      statusEl.textContent = 'Something went wrong loading this game.';
    }
  }
  function restart() { start(); }

  function pause() {
    if (!S || !S.usesLoop || S.over || modalOpen) return;
    S.paused = true;
    showModal({
      emoji: '⏸️', title: 'Paused',
      buttons: [
        { label: 'Restart', fn: restart },
        { label: 'Resume', primary: true, fn: resume }
      ]
    });
  }
  function resume() { if (S) { S.paused = false; S.keys = {}; } }

  function showHelp() {
    const wasPaused = S && S.paused;
    if (S && S.usesLoop && !S.over) S.paused = true;
    showModal({
      emoji: meta.icon, title: meta.name,
      html: '<p>' + meta.desc + '</p><div class="how">' + meta.how + '</div>',
      buttons: [{ label: S ? 'Continue' : 'Play', primary: true, fn: () => { if (!S) start(); else if (!wasPaused) resume(); } }]
    });
  }

  // ---------- global wiring ----------
  btnPause.onclick = pause;
  $('btnRestart').onclick = restart;
  $('btnHelp').onclick = showHelp;
  btnSound.onclick = () => { muted = !muted; Hub.LS.set('muted', muted); syncSound(); if (!muted) SFX.click(); };
  // header buttons must not keep focus, or Space / Enter in-game would press them again
  document.querySelectorAll('.bar button').forEach(b => b.addEventListener('click', () => b.blur()));
  const fsEl = document.documentElement;
  if (!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen)) btnFs.hidden = true;
  btnFs.onclick = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const r = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl);
      if (r && r.catch) r.catch(() => {});
    }
  };

  const typingTarget = e => {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  };
  window.addEventListener('keydown', e => {
    if (modalOpen) {
      if ((e.key === 'Enter' || e.key === ' ') && modalPrimary && document.activeElement !== modalPrimary &&
          !(document.activeElement && document.activeElement.tagName === 'BUTTON')) {
        e.preventDefault();
        modalPrimary.click();
      } else if (e.key === 'Escape' && S && S.paused) {
        hideModal(); resume();
      }
      return;
    }
    if (!S) return;
    if (e.key === 'Escape' || e.key === 'p' && !typingTarget(e) && S.usesLoop) { pause(); return; }
    const k = KEYMAP[e.code] || null;
    if (!typingTarget(e) && (k || e.code === 'Space')) e.preventDefault();
    S.held[e.code] = true;
    if (k) {
      const wasDown = S.keys[k];
      S.keys[k] = true;
      if (wasDown && !e.repeat) return;
    }
    S._keyFns.forEach(f => f(k, e.key, e));
  });
  window.addEventListener('keyup', e => {
    if (!S) return;
    S.held[e.code] = false;
    const k = KEYMAP[e.code];
    if (k) S.keys[k] = false;
    S._keyUpFns.forEach(f => f(k, e.key, e));
  });
  window.addEventListener('blur', () => { if (S) { S.keys = {}; S.held = {}; } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  let resizeQueued = false;
  const onResize = () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; if (S) S._resizeFns.forEach(f => f()); });
  };
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(stage);
  else window.addEventListener('resize', onResize);

  // Stop page scrolling / zooming gestures inside the player.
  document.addEventListener('touchmove', e => { if (!e.target.closest('.gui, .modal')) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());

  // ---------- boot ----------
  const loadScript = (name, done) => {
    const sc = document.createElement('script');
    sc.src = 'games/' + name + '.js';
    sc.onload = done;
    sc.onerror = () => { statusEl.textContent = 'Could not load game files.'; };
    document.body.appendChild(sc);
  };
  const files = (meta.deps || []).concat(meta.engine);
  const loadNext = () => loadScript(files.shift(), () => (files.length ? loadNext() : ready()));
  const ready = () => {
    const b = Hub.LS.get(bestKey, null);
    showModal({
      emoji: meta.icon, title: meta.name,
      html: '<p>' + meta.desc + '</p><div class="how">' + meta.how + '</div>' +
        (b != null && meta.best !== 'none' ? '<p>Your best: <b>' + Hub.fmt(b, meta.fmt) + '</b></p>' : ''),
      buttons: [{ label: 'Menu', fn: () => { location.href = './'; } }, { label: '▶  Play', primary: true, fn: start }]
    });
  };
  loadNext();
})();
