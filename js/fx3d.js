// 2.5D look for every canvas game. Wraps the 2D context so each solid shape picks up depth:
// a hard "extrusion" shadow under it, a glossy bevel (or sphere shading for circles) on top, and
// full-canvas background fills get a vignette plus a faint perspective floor. Games need no changes.
(function () {
  'use strict';
  const P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (!P) return;

  // Engines whose boards are dense grids of tiny cells or text: bevels there only add noise.
  const FLAT = new Set(['sudoku', 'nonogram', 'wordsearch', 'schulte', 'numbermemory']);
  const FX = window.FX3D = { off: false, depth: 1 };
  try {
    const gid = new URLSearchParams(location.search).get('g');
    const meta = window.Hub && Hub.find(gid);
    if (meta && FLAT.has(meta.engine)) FX.off = true;
    if (new URLSearchParams(location.search).get('flat')) FX.off = true;
    if (Hub.LS.get('fx3d', true) === false) FX.off = true;
  } catch (e) { /* ignore */ }

  const O = {};
  ['stroke', 'beginPath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'rect', 'roundRect', 'ellipse', 'quadraticCurveTo',
    'bezierCurveTo', 'fill', 'fillRect'].forEach(k => { O[k] = P[k]; });

  // ---------- path bounding box tracking ----------
  function st(ctx) { return ctx.__b || (ctx.__b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, n: 0, circle: null }); }
  function ext(s, x, y) {
    if (x < s.x0) s.x0 = x; if (x > s.x1) s.x1 = x;
    if (y < s.y0) s.y0 = y; if (y > s.y1) s.y1 = y;
  }
  P.beginPath = function () {
    const s = st(this); s.x0 = s.y0 = 1e9; s.x1 = s.y1 = -1e9; s.n = 0; s.circle = null;
    return O.beginPath.call(this);
  };
  P.moveTo = function (x, y) { const s = st(this); s.n++; ext(s, x, y); s.circle = null; return O.moveTo.apply(this, arguments); };
  P.lineTo = function (x, y) { const s = st(this); s.n++; ext(s, x, y); s.circle = null; return O.lineTo.apply(this, arguments); };
  P.quadraticCurveTo = function (a, b, x, y) { const s = st(this); s.n++; ext(s, a, b); ext(s, x, y); s.circle = null; return O.quadraticCurveTo.apply(this, arguments); };
  P.bezierCurveTo = function (a, b, c, d, x, y) { const s = st(this); s.n++; ext(s, a, b); ext(s, c, d); ext(s, x, y); s.circle = null; return O.bezierCurveTo.apply(this, arguments); };
  P.arcTo = function (x1, y1, x2, y2) { const s = st(this); s.n++; ext(s, x1, y1); ext(s, x2, y2); s.circle = null; return O.arcTo.apply(this, arguments); };
  P.rect = function (x, y, w, h) { const s = st(this); s.n++; ext(s, x, y); ext(s, x + w, y + h); s.circle = null; return O.rect.apply(this, arguments); };
  if (O.roundRect) P.roundRect = function (x, y, w, h) { const s = st(this); s.n++; ext(s, x, y); ext(s, x + w, y + h); s.circle = null; return O.roundRect.apply(this, arguments); };
  P.arc = function (x, y, r, a0, a1) {
    const s = st(this), first = s.n === 0;
    s.n++; ext(s, x - r, y - r); ext(s, x + r, y + r);
    s.circle = first && Math.abs(a1 - a0) >= Math.PI * 2 - 1e-3 ? { x, y, r } : null;
    return O.arc.apply(this, arguments);
  };
  P.ellipse = function (x, y, rx, ry) {
    const s = st(this); s.n++; ext(s, x - rx, y - ry); ext(s, x + rx, y + ry); s.circle = null;
    return O.ellipse.apply(this, arguments);
  };

  // ---------- adaptive safety: switch effects off on slow devices ----------
  let frames = 0, spent = 0, drawn = 0, scheduled = false, last = 0, slow = 0;
  const BUDGET = 900;
  function tick(t) {
    scheduled = false; drawn = 0;
    if (last) {
      const dt = t - last;
      if (dt < 250) { frames++; if (dt > 34) slow++; }
      if (frames >= 90) { if (slow > 55 && !FX.off) FX.off = true; frames = slow = 0; }
    }
    last = t;
  }

  const alphaOf = s => {
    if (typeof s !== 'string') return 1;
    if (s.charAt(0) === '#') return s.length === 9 ? parseInt(s.slice(7), 16) / 255 : 1;
    if (s.charAt(0) === 'r' || s.charAt(0) === 'h') { const m = /,\s*([\d.]+)\s*\)$/.exec(s); if (m && /a\(/.test(s)) return +m[1]; }
    return 1;
  };

  let busy = false;
  P.fill = function (a) {
    if (FX.off || busy || this.__flat || (a && typeof a === 'object')) return O.fill.apply(this, arguments);
    const s = this.__b;
    if (!s || s.n === 0 || s.x1 < s.x0) return O.fill.apply(this, arguments);
    if (!scheduled) { scheduled = true; requestAnimationFrame(tick); }
    if (++drawn > BUDGET || this.shadowBlur > 0 || this.globalAlpha < .55 || alphaOf(this.fillStyle) < .55 ||
        this.globalCompositeOperation !== 'source-over') return O.fill.apply(this, arguments);

    const m = this.getTransform(), sc = Math.hypot(m.a, m.b) || 1;
    const w = s.x1 - s.x0, h = s.y1 - s.y0, pw = w * sc, ph = h * sc;
    const cv = this.canvas;
    if (pw < 8 || ph < 8 || (pw > cv.width * .55 && ph > cv.height * .4) || pw > cv.width * .95 || ph > cv.height * .95) {
      return O.fill.apply(this, arguments);
    }

    const rule = typeof a === 'string' ? a : 'nonzero';
    const k = FX.depth, d = Math.max(1.5, Math.min(Math.min(pw, ph) * .09, 9)) * k;
    const c = s.circle && Math.abs(pw - ph) < 1 ? s.circle : null;
    busy = true;
    this.save();
    this.shadowColor = c ? 'rgba(0,0,0,.38)' : 'rgba(0,0,0,.42)';
    this.shadowOffsetX = 0; this.shadowOffsetY = d;
    this.shadowBlur = c ? d * 1.6 : 0;
    O.fill.apply(this, arguments);
    this.shadowColor = 'transparent'; this.shadowBlur = 0; this.shadowOffsetY = 0;
    this.clip(rule);
    let g;
    if (c) {
      g = this.createRadialGradient(c.x - c.r * .38, c.y - c.r * .42, c.r * .04, c.x, c.y, c.r * 1.08);
      g.addColorStop(0, 'rgba(255,255,255,.62)');
      g.addColorStop(.3, 'rgba(255,255,255,.14)');
      g.addColorStop(.62, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.42)');
    } else {
      g = this.createLinearGradient(0, s.y0, 0, s.y1);
      g.addColorStop(0, 'rgba(255,255,255,.34)');
      g.addColorStop(.4, 'rgba(255,255,255,.05)');
      g.addColorStop(.55, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.30)');
    }
    this.fillStyle = g;
    this.globalAlpha = 1;
    O.fillRect.call(this, s.x0 - 1, s.y0 - 1, w + 2, h + 2);
    // thin bright rim along the lit edge sells the bevel
    const rim = this.createLinearGradient(0, s.y0, 0, s.y0 + h * .5);
    rim.addColorStop(0, 'rgba(255,255,255,.55)');
    rim.addColorStop(1, 'rgba(255,255,255,0)');
    this.strokeStyle = rim;
    this.lineWidth = 2 / sc;
    this.stroke();
    this.restore();
    busy = false;
    return undefined;
  };

  // Thick strokes (lines, rings, X / O marks, snake bodies) become rounded tubes: offset shadow + centre highlight.
  P.stroke = function (a) {
    if (FX.off || busy || this.__flat || (a && typeof a === 'object')) return O.stroke.apply(this, arguments);
    const s = this.__b, m = this.getTransform(), sc = Math.hypot(m.a, m.b) || 1, lw = this.lineWidth * sc;
    if (!s || s.n === 0 || lw < 5 || lw > 60 || ++drawn > BUDGET || this.shadowBlur > 0 || this.globalAlpha < .55 ||
        alphaOf(this.strokeStyle) < .55 || this.globalCompositeOperation !== 'source-over') return O.stroke.apply(this, arguments);
    busy = true;
    this.save();
    this.shadowColor = 'rgba(0,0,0,.4)'; this.shadowOffsetX = 0; this.shadowOffsetY = Math.max(2, lw * .35) * FX.depth; this.shadowBlur = 0;
    O.stroke.apply(this, arguments);
    this.shadowColor = 'transparent'; this.shadowOffsetY = 0;
    this.strokeStyle = 'rgba(255,255,255,.3)';
    this.lineWidth = this.lineWidth * .34;
    O.stroke.apply(this, arguments);
    this.restore();
    busy = false;
  };

  // ---------- backdrop: vignette + perspective floor on full-canvas background fills ----------
  let bd = null;
  function backdrop(w, h) {
    if (bd && bd.width === w && bd.height === h) return bd;
    bd = document.createElement('canvas'); bd.width = w; bd.height = h;
    const g = bd.getContext('2d');
    // floor grid converging on a vanishing point just above the lower third
    const hy = h * .58, vx = w / 2;
    g.save();
    g.beginPath(); g.rect(0, hy, w, h - hy); g.clip();
    g.strokeStyle = 'rgba(140,170,255,.045)'; g.lineWidth = Math.max(1, w / 500);
    for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(vx + i * w * .015, hy); g.lineTo(vx + i * w * .16, h); g.stroke(); }
    for (let j = 1; j <= 9; j++) {
      const y = hy + (h - hy) * Math.pow(j / 9, 2.1);
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }
    g.restore();
    const hz = g.createLinearGradient(0, hy - h * .12, 0, hy + h * .08);
    hz.addColorStop(0, 'rgba(120,140,255,0)'); hz.addColorStop(.6, 'rgba(120,140,255,.06)'); hz.addColorStop(1, 'rgba(120,140,255,0)');
    g.fillStyle = hz; g.fillRect(0, hy - h * .12, w, h * .2);
    // vignette and top light
    const v = g.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .25, w / 2, h / 2, Math.hypot(w, h) * .6);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    const t = g.createLinearGradient(0, 0, 0, h * .35);
    t.addColorStop(0, 'rgba(255,255,255,.07)'); t.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = t; g.fillRect(0, 0, w, h * .35);
    return bd;
  }

  P.fillRect = function (x, y, w, h) {
    O.fillRect.apply(this, arguments);
    if (FX.off || busy || this.__flat || this.globalAlpha < .95 || alphaOf(this.fillStyle) < .95) return;
    const cv = this.canvas, m = this.getTransform();
    if (m.b || m.c) return;
    const lw = cv.width / m.a, lh = cv.height / m.d;
    // covers the whole logical canvas?
    const X = x * m.a + m.e, Y = y * m.d + m.f, W = w * m.a, H = h * m.d;
    if (X > 1 || Y > 1 || X + W < cv.width - 1 || Y + H < cv.height - 1 || lw < 50) return;
    this.save();
    this.setTransform(1, 0, 0, 1, 0, 0);
    this.globalAlpha = 1;
    this.drawImage(backdrop(cv.width, cv.height), 0, 0);
    this.restore();
  };
})();
