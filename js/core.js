// Shared namespace, storage and catalog helpers used by both the hub and the player.
(function () {
  'use strict';
  const Hub = window.Hub = window.Hub || {};

  // ---------- accounts ----------
  // Accounts live in this browser only (no server). Passwords are stored as salted PBKDF2 hashes.
  // Each signed-in user gets their own saved scores, favorites and recents; guests use the shared default slot.
  const AUTH_KEY = 'mg_auth:users', SESSION_KEY = 'mg_auth:session';
  const rawGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const rawSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  const normName = n => String(n || '').trim().toLowerCase();

  async function hashPw(pw, salt) {
    const enc = new TextEncoder();
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
      return 'p1:' + hex(bits);
    }
    // Insecure contexts (plain http on a LAN address) have no crypto.subtle; fall back to a simple mix.
    let h = 2166136261;
    const str = salt + pw;
    for (let r = 0; r < 2000; r++) for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 'f1:' + h.toString(16);
  }
  const newSalt = () => {
    const a = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < 16; i++) a[i] = Math.random() * 256;
    return hex(a);
  };

  const Auth = Hub.Auth = {
    users: () => rawGet(AUTH_KEY, {}),
    // The signed-in user's record, or null for a guest.
    current() {
      const id = rawGet(SESSION_KEY, null);
      const u = id && Auth.users()[id];
      return u ? { id, name: u.name, color: u.color, created: u.created } : null;
    },
    async register(name, pw) {
      if (await serverUp()) {
        const j = await call('POST', 'register', { name, password: pw });
        adoptRemote(j.user, j.token);
        await pullData();
        return Auth.current();
      }
      name = String(name || '').trim();
      if (!/^[\w .-]{3,20}$/.test(name)) throw new Error('Username must be 3–20 letters, numbers, spaces, dots or dashes.');
      if (String(pw || '').length < 6) throw new Error('Password must be at least 6 characters.');
      const users = Auth.users(), id = normName(name);
      if (users[id]) throw new Error('That username is already taken on this device.');
      const salt = newSalt();
      users[id] = { name, salt, hash: await hashPw(pw, salt), created: Date.now(), color: Math.floor(Math.random() * 360) };
      if (!rawSet(AUTH_KEY, users)) throw new Error('Could not save the account. Is browser storage blocked?');
      rawSet(SESSION_KEY, id);
      return Auth.current();
    },
    async login(name, pw) {
      if (await serverUp()) {
        const j = await call('POST', 'login', { name, password: pw });
        adoptRemote(j.user, j.token);
        await pullData();
        return Auth.current();
      }
      const id = normName(name), u = Auth.users()[id];
      if (!u || !u.hash || (await hashPw(pw, u.salt)) !== u.hash) throw new Error('Wrong username or password.');
      rawSet(SESSION_KEY, id);
      return Auth.current();
    },
    logout() {
      const t = rawGet(TOKEN_KEY, null);
      if (t) call('POST', 'logout').catch(() => { /* ignore */ });
      try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
    }
  };

  // ---------- server accounts (used when server.js is running) ----------
  // Accounts then work on every device that can reach the server. Each account's saved data is synced to it.
  const API = 'api/';
  const TOKEN_KEY = 'mg_auth:token';
  let upP = null;
  const serverUp = () => upP || (upP = (async () => {
    try { const r = await fetch(API + 'health', { cache: 'no-store' }); const j = await r.json(); return !!(r.ok && j.ok); } catch (e) { return false; }
  })());
  async function call(method, path, body) {
    const h = { 'Content-Type': 'application/json' };
    const t = rawGet(TOKEN_KEY, null);
    if (t) h.Authorization = 'Bearer ' + t;
    const r = await fetch(API + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    let j = {}; try { j = await r.json(); } catch (e) { /* empty body */ }
    if (!r.ok) throw new Error(j.error || 'Could not reach the server.');
    return j;
  }
  function adoptRemote(u, token) {
    const users = Auth.users();
    users[u.id] = { name: u.name, color: u.color, created: u.created, remote: true };
    rawSet(AUTH_KEY, users);
    rawSet(TOKEN_KEY, token);
    rawSet(SESSION_KEY, u.id);
  }
  const userPrefix = () => 'mg:u:' + rawGet(SESSION_KEY, '') + ':';
  async function pullData() {
    if (!rawGet(TOKEN_KEY, null)) return;
    const j = await call('GET', 'data');
    const p = userPrefix();
    for (const [k, v] of Object.entries(j.data || {})) { try { localStorage.setItem(p + k, v); } catch (e) { /* storage full */ } }
  }
  let pushTimer = null;
  async function pushData() {
    clearTimeout(pushTimer); pushTimer = null;
    if (!rawGet(TOKEN_KEY, null)) return;
    const p = userPrefix(), data = {};
    for (const k of Object.keys(localStorage)) if (k.startsWith(p)) data[k.slice(p.length)] = localStorage.getItem(k);
    try { await call('PUT', 'data', { data }); } catch (e) { /* offline: try again on the next change */ }
  }
  function schedulePush() {
    if (!rawGet(TOKEN_KEY, null)) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushData, 800);
  }
  window.addEventListener('pagehide', () => { if (pushTimer) pushData(); });
  // Refresh this account's data from the server on page load (the first render may show the cached copy).
  if (rawGet(TOKEN_KEY, null)) serverUp().then(ok => { if (ok) pullData().catch(() => { /* keep local copy */ }); });

  // ---------- per-user storage ----------
  const prefix = () => { const u = Auth.current(); return u ? 'mg:u:' + u.id + ':' : 'mg:'; };
  Hub.LS = {
    get: (k, d) => rawGet(prefix() + k, d),
    set: (k, v) => { rawSet(prefix() + k, v); schedulePush(); }
  };

  // Small avatar + menu shown in the header of every page.
  Hub.mountUser = function (box) {
    const u = Auth.current();
    box.innerHTML = '';
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    if (!u) {
      const a = document.createElement('a');
      a.className = 'pill-btn ghost'; a.href = 'login.html?next=' + next; a.textContent = 'Sign in';
      box.appendChild(a);
      return;
    }
    const b = document.createElement('button');
    b.className = 'avatar'; b.title = u.name; b.setAttribute('aria-label', 'Account menu');
    b.style.setProperty('--h', u.color);
    b.textContent = u.name.charAt(0).toUpperCase();
    const m = document.createElement('div');
    m.className = 'umenu'; m.hidden = true;
    const played = Object.keys(localStorage).filter(k => k.startsWith('mg:u:' + u.id + ':best:')).length;
    m.innerHTML = '<div class="un"></div><div class="us"></div><button class="btn out">Sign out</button>';
    m.querySelector('.un').textContent = u.name;
    m.querySelector('.us').textContent = played + ' game' + (played === 1 ? '' : 's') + ' with a saved best';
    m.querySelector('.out').onclick = () => { Auth.logout(); location.href = 'login.html'; };
    b.onclick = e => { e.stopPropagation(); m.hidden = !m.hidden; };
    document.addEventListener('click', () => { m.hidden = true; });
    box.appendChild(b); box.appendChild(m);
  };

  Hub.CATS = [
    { id: 'all', name: 'All', icon: '🎮' },
    { id: 'arcade', name: 'Arcade', icon: '🕹️' },
    { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
    { id: 'board', name: 'Board', icon: '♟️' },
    { id: 'cards', name: 'Cards & Dice', icon: '🃏' },
    { id: 'word', name: 'Word', icon: '🔤' },
    { id: 'brain', name: 'Brain', icon: '🧠' },
    { id: '2p', name: '2 Players', icon: '👥' }
  ];

  // Game engines register a factory: Hub.register(engineId, (api, options) => { ... })
  Hub.factories = {};
  Hub.register = (id, factory) => { Hub.factories[id] = factory; };

  Hub.GAMES = [];
  // add(engine, id, name, cat, icon, [c1, c2], desc, how, extra)
  Hub.add = function (engine, id, name, cat, icon, colors, desc, how, extra) {
    Hub.GAMES.push(Object.assign({
      engine, id, name, cat, icon, c1: colors[0], c2: colors[1], desc, how,
      opt: {}, best: 'high', label: 'Score'
    }, extra || {}));
  };
  Hub.find = id => Hub.GAMES.find(g => g.id === id);

  // ---------- groups ----------
  // The catalog shows one card per game. Entries that share a group (default: the engine) are modes of that
  // game, e.g. Sudoku → Easy / Medium / Hard. Hub.LABELS names the group and each mode.
  Hub.LABELS = {};
  Hub.groups = [];
  Hub.buildGroups = function () {
    const map = new Map();
    Hub.GAMES.forEach(g => {
      const k = g.group || g.engine;
      let G = map.get(k);
      if (!G) {
        G = { id: k, name: g.name, cat: g.cat, icon: g.icon, c1: g.c1, c2: g.c2, desc: g.desc, how: g.how, tags: g.tags || '', twoP: false, variants: [] };
        map.set(k, G);
      }
      G.variants.push(g);
      g.groupId = k;
      if (g.twoP) G.twoP = true;
    });
    const order = c => Hub.CATS.findIndex(x => x.id === c);
    Hub.groups = Array.from(map.values()).sort((a, b) => order(a.cat) - order(b.cat)); // stable: keeps catalog order inside a category
    Hub.groups.forEach(G => {
      const L = Hub.LABELS[G.id];
      if (L) { G.name = L.name; if (L.desc) G.desc = L.desc; }
      G.variants.forEach(v => { v.vlabel = (L && L.v && L.v[v.id]) || v.name; v.gname = G.name; });
      G.search = (G.name + ' ' + G.desc + ' ' + G.cat + ' ' + G.tags + ' ' + G.variants.map(v => v.vlabel).join(' ')).toLowerCase();
    });
  };
  Hub.groupOf = id => Hub.groups.find(G => G.id === id || G.variants.some(v => v.id === id));

  Hub.bestText = function (g) {
    const b = Hub.LS.get('best:' + g.id, null);
    if (b == null || g.best === 'none') return '';
    return (g.best === 'low' ? 'Best ' : 'Best ') + Hub.fmt(b, g.fmt);
  };
  Hub.fmt = function (v, fmt) {
    if (fmt === 'time') {
      const s = Math.round(v * 10) / 10;
      if (s < 60) return s.toFixed(1) + 's';
      const m = Math.floor(s / 60);
      return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    }
    if (fmt === 'ms') return Math.round(v) + 'ms';
    return String(v);
  };
})();
