// Online play between two accounts, peer to peer (WebRTC through the free PeerJS broker; no game server).
//
//  * Every signed-in page listens for invites on a personal "inbox" id derived from the username.
//  * Inviting someone opens a private room id. The invited player accepts, then both browsers meet in that room.
//  * Both browsers then run the SAME game with the same random seed. Each click is sent to the other side, but only
//    the player whose turn it is may click, and a remote click is applied only when the local game agrees it is
//    that player's turn. So the two copies stay identical without a server deciding anything.
(function () {
  'use strict';
  const Hub = window.Hub;
  const $$ = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // ---------- helpers ----------
  const hex = s => Array.from(new TextEncoder().encode(String(s))).map(b => b.toString(16).padStart(2, '0')).join('');
  const inboxId = name => 'gamenest-u-' + hex(String(name).trim().toLowerCase());
  const roomId = code => 'gamenest-r-' + code;
  const CODE_RE = /^[a-z0-9]{8,16}$/;
  const rndBytes = n => { const a = new Uint8Array(n); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }); return a; };
  const newCode = () => Array.from(rndBytes(10), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  const newSeed = () => { const a = rndBytes(4); return ((a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3]) >>> 0; };
  const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').slice(0, 20);
  const mulberry32 = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const peerOk = () => typeof window.Peer === 'function';
  const myName = () => { const u = Hub.Auth && Hub.Auth.current(); return u ? u.name : 'Guest'; };

  const Online = Hub.Online = { active: false, session: null, newCode, newSeed, hexId: inboxId, CODE_RE };
  Online.available = peerOk;

  // ---------- a session is a message pipe plus the roles / names / seed ----------
  // makeSession is transport-agnostic so the same sync code can be tested with an in-memory link.
  Online.makeSession = function (opts) {
    const handlers = {}, backlog = {};
    const S = {
      me: opts.me, names: opts.names || ['Player 1', 'Player 2'], seed: opts.seed >>> 0, closed: false,
      send(msg) { if (!S.closed && opts.send) opts.send(msg); },
      // messages that arrive before anyone listens (the game may not have started yet) are kept and replayed
      on(type, fn) { (handlers[type] = handlers[type] || []).push(fn); (backlog[type] || []).splice(0).forEach(m => fn(m)); },
      emit(type, msg) { if (handlers[type]) handlers[type].forEach(fn => fn(msg)); else if (type === 'p' || type === 'k') (backlog[type] = backlog[type] || []).push(msg); },
      close() { if (!S.closed) { S.closed = true; S.emit('close'); if (opts.close) opts.close(); } },
      opponent() { return S.names[1 - S.me]; }
    };
    return S;
  };

  // ---------- attach: make an engine session network-aware ----------
  Online.attach = function (api, S) {
    api.net = S;
    const rng = mulberry32(S.seed);
    api.rng = rng;
    api.randi = (a, b) => Math.floor(a + rng() * (b - a + 1));
    const mine = () => { const t = api.turnOf ? api.turnOf() : null; return t == null || t === S.me; };
    // A game may expose api.busy() while it animates and ignores clicks. Clicks are neither sent nor applied then,
    // otherwise one copy would act on a move the other copy dropped.
    const busy = () => !!(api.busy && api.busy());
    api.mine = () => mine() && !busy();
    const queue = [];
    const pump = () => {
      while (queue.length) {
        const head = queue[0];
        if (api.over) { queue.length = 0; return; }
        const t = api.turnOf ? api.turnOf() : null;
        if ((t == null || t === 1 - S.me) && !busy()) { queue.shift(); try { head.fn(); } catch (e) { console.error(e); } continue; }
        if (Date.now() - head.at > 5000) { queue.length = 0; api.toast('Out of sync. Ask for a rematch.', 2500); }
        return;
      }
    };
    const enqueue = fn => { queue.push({ fn, at: Date.now() }); pump(); };
    api.every(40, pump);

    // pointer: local clicks are gated by turn and mirrored; remote clicks replay through the same handlers
    const origPointer = api.pointer;
    api.pointer = (c, h) => {
      let sent = false;
      // a game that shows the board from the other side (chess for the guest) sets api.canon to map what the
      // player clicked back to shared board coordinates, so both copies see the same click
      const canon = (x, y) => (api.canon ? api.canon(x, y) : [x, y]);
      origPointer(c, {
        down: (x0, y0, e) => { if (!mine() || busy()) return; const [x, y] = canon(x0, y0); sent = true; S.send({ t: 'p', k: 'down', x, y }); h.down && h.down(x, y, e); },
        move: (x0, y0, e, dn) => { if (h.move && (mine() || !dn)) { const [x, y] = canon(x0, y0); h.move(x, y, e, dn); } },
        up: (x0, y0, e) => { if (!sent) return; sent = false; const [x, y] = canon(x0, y0); S.send({ t: 'p', k: 'up', x, y }); h.up && h.up(x, y, e); }
      });
      S.on('p', m => {
        if (!m || (m.k !== 'down' && m.k !== 'up') || !isFinite(m.x) || !isFinite(m.y)) return;
        enqueue(() => { const f = h[m.k]; if (f) f(+m.x, +m.y, { pointerType: 'remote' }, false); });
      });
    };
    // keys: same idea
    const keyFns = [], origOnKey = api.onKey;
    let keyHooked = false;
    api.onKey = fn => {
      keyFns.push(fn);
      if (keyHooked) return;
      keyHooked = true;
      origOnKey((k, raw, e) => { if (!mine() || busy()) return; S.send({ t: 'k', k: k == null ? null : String(k), raw: raw == null ? null : String(raw) }); keyFns.forEach(f => f(k, raw, e)); });
      S.on('k', m => {
        if (!m) return;
        const k = typeof m.k === 'string' ? m.k.slice(0, 12) : null, raw = typeof m.raw === 'string' ? m.raw.slice(0, 12) : null;
        enqueue(() => keyFns.forEach(f => f(k, raw, {})));
      });
    };
    return api;
  };

  // ---------- PeerJS wiring ----------
  function newPeer(id) { return id ? new window.Peer(id) : new window.Peer(); }

  function wrapConn(conn, S) {
    conn.on('data', m => { if (m && typeof m === 'object' && typeof m.t === 'string') S.emit(m.t, m); });
    conn.on('close', () => S.close());
    conn.on('error', () => S.close());
  }

  // Host: register the room id, wait for exactly one guest, then hand out the seed.
  Online.host = function (code, hooks) {
    let done = false, peer = null;
    const finish = (fn, ...a) => { if (!done) { done = true; fn && fn(...a); } };
    const open = () => {
      peer = newPeer(roomId(code));
      peer.on('open', () => hooks.onOpen && hooks.onOpen(peer));
      peer.on('error', e => { if (!done && e.type === 'unavailable-id') hooks.onError && hooks.onError('That room already exists. Go back and start again.'); else if (e.type !== 'peer-unavailable' && !done && e.type !== 'webrtc') hooks.onError && hooks.onError('Connection problem: ' + e.type); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* ignore */ } });
      peer.on('connection', conn => {
        if (done || Online._guest) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 200); }); return; }
        Online._guest = conn;
        conn.on('open', () => {
          let S = null;
          conn.on('data', m => {
            if (S || !m || m.t !== 'hello') return;
            const seed = newSeed();
            S = Online.makeSession({ me: 0, names: [clean(myName()), clean(m.name) || 'Guest'], seed, send: x => conn.send(x), close: () => { try { conn.close(); } catch (e) { /* ignore */ } try { peer.destroy(); } catch (e) { /* ignore */ } } });
            conn.send({ t: 'welcome', name: S.names[0], seed });
            wrapConn(conn, S);
            finish(hooks.onReady, S);
          });
        });
      });
    };
    open();
    return { peer: () => peer, cancel() { done = true; try { peer.destroy(); } catch (e) { /* ignore */ } } };
  };

  // Guest: keep knocking on the room until the host answers.
  Online.join = function (code, hooks) {
    let done = false, tries = 0, peer, timer;
    const cancel = () => { done = true; clearTimeout(timer); try { peer.destroy(); } catch (e) { /* ignore */ } };
    const attempt = () => {
      if (done) return;
      if (tries++ >= 12) { done = true; hooks.onError && hooks.onError('Could not reach the host. They may have closed the page.'); return; }
      hooks.onTry && hooks.onTry(tries);
      const conn = peer.connect(roomId(code), { reliable: true });
      let opened = false;
      conn.on('open', () => {
        opened = true;
        let S = null;
        conn.on('data', m => {
          if (!m || S) { if (m && m.t === 'full' && !S) { done = true; hooks.onError && hooks.onError('That game already has two players.'); } return; }
          if (m.t === 'welcome' && isFinite(m.seed)) {
            done = true;
            S = Online.makeSession({ me: 1, names: [clean(m.name) || 'Host', clean(myName())], seed: m.seed, send: x => conn.send(x), close: () => { try { conn.close(); } catch (e) { /* ignore */ } try { peer.destroy(); } catch (e) { /* ignore */ } } });
            wrapConn(conn, S);
            hooks.onReady && hooks.onReady(S);
          }
        });
        conn.send({ t: 'hello', name: clean(myName()) });
      });
      timer = setTimeout(() => { if (!opened && !done) { try { conn.close(); } catch (e) { /* ignore */ } attempt(); } }, 4500);
    };
    peer = newPeer();
    peer.on('open', attempt);
    peer.on('error', e => { if (e.type === 'peer-unavailable') { clearTimeout(timer); timer = setTimeout(attempt, 1800); } else if (!done) { done = true; hooks.onError && hooks.onError('Connection problem: ' + e.type); } });
    return { cancel };
  };

  // ---------- inbox: receive invites on any page ----------
  let inbox = null, inboxTries = 0, queueUI = [];
  Online.inboxState = 'off';
  Online.startInbox = function () {
    const u = Hub.Auth && Hub.Auth.current();
    if (!u || !peerOk() || inbox) return;
    const open = () => {
      const p = newPeer(inboxId(u.name));
      inbox = p;
      p.on('open', () => { Online.inboxState = 'on'; });
      p.on('connection', conn => conn.on('data', m => onInviteMsg(conn, m)));
      p.on('disconnected', () => { try { p.reconnect(); } catch (e) { /* ignore */ } });
      p.on('error', e => {
        if (e.type === 'unavailable-id') {
          // the same account is open elsewhere, or the broker has not released our id from the last page yet
          if (inboxTries++ < 5) setTimeout(() => { try { p.destroy(); } catch (x) { /* ignore */ } inbox = null; open(); }, 2500);
          else Online.inboxState = 'taken';
        }
      });
    };
    open();
  };

  function onInviteMsg(conn, m) {
    if (!m || m.t !== 'invite') return;
    const g = Hub.find(String(m.game));
    const from = clean(m.from);
    if (!g || !g.online || !from || !CODE_RE.test(String(m.room))) return;
    if (Online.active) { conn.send({ t: 'busy' }); return; }
    queueUI.push({ conn, from, game: g, room: String(m.room) });
    if (queueUI.length === 1) showInvite();
  }
  function showInvite() {
    const inv = queueUI[0];
    if (!inv) return;
    const ov = $$('div', 'overlay net-ov'), md = $$('div', 'modal');
    ov.style.zIndex = 80;
    md.appendChild($$('div', 'big-emo', '📨'));
    md.appendChild($$('h2', null, inv.from + ' invited you'));
    md.appendChild($$('p', null, 'to play ' + inv.game.name + ' online'));
    const row = $$('div', 'btns');
    const no = $$('button', 'btn', 'Decline'), yes = $$('button', 'btn primary', 'Accept');
    const close = () => { ov.remove(); queueUI.shift(); if (queueUI.length) showInvite(); };
    no.onclick = () => { try { inv.conn.send({ t: 'decline' }); } catch (e) { /* ignore */ } close(); };
    yes.onclick = () => {
      try { inv.conn.send({ t: 'accept' }); } catch (e) { /* ignore */ }
      const friends = Hub.LS.get('friends', []).filter(n => n !== inv.from); friends.unshift(inv.from); Hub.LS.set('friends', friends.slice(0, 12));
      setTimeout(() => { location.href = 'play.html?g=' + encodeURIComponent(inv.game.id) + '&online=guest&room=' + inv.room; }, 200);
    };
    inv.conn.on('close', () => { if (ov.isConnected) close(); });
    row.appendChild(no); row.appendChild(yes); md.appendChild(row); ov.appendChild(md); document.body.appendChild(ov);
    yes.focus();
  }

  // Send an invite from a host's room peer to a username. Resolves 'accept' | 'decline' | 'busy' | 'offline' | 'timeout'.
  Online.invite = function (peer, toName, gameId, code) {
    return new Promise(resolve => {
      const id = inboxId(toName);
      let settled = false;
      const done = r => { if (!settled) { settled = true; clearTimeout(t); peer.off && peer.off('error', onErr); resolve(r); } };
      const onErr = e => { if (e.type === 'peer-unavailable' && String(e.message || '').includes(id)) done('offline'); };
      peer.on('error', onErr);
      const conn = peer.connect(id, { reliable: true });
      conn.on('open', () => conn.send({ t: 'invite', from: clean(myName()), game: gameId, room: code }));
      conn.on('data', m => { if (m && ['accept', 'decline', 'busy'].includes(m.t)) done(m.t); });
      conn.on('close', () => done('decline'));
      const t = setTimeout(() => done('timeout'), 60000);
    });
  };

  // ---------- boot UI used by play.html ----------
  function overlay() {
    const ov = $$('div', 'overlay net-ov'), md = $$('div', 'modal net-md');
    ov.style.zIndex = 70; ov.appendChild(md); document.body.appendChild(ov);
    return { ov, md, close: () => ov.remove() };
  }
  Online.boot = function (opts) {
    const { role, room, meta } = opts;
    if (!peerOk()) return opts.onFail('Online play could not load (the connection library is blocked). Check your network and reload.');
    if (!CODE_RE.test(String(room))) return opts.onFail('This invite link is not valid.');
    Online.active = true;
    const ui = overlay();
    const leave = () => { Online.active = false; location.href = './'; };
    const fail = msg => { ui.md.innerHTML = ''; ui.md.appendChild($$('div', 'big-emo', '⚠️')); ui.md.appendChild($$('h2', null, 'Could not connect')); ui.md.appendChild($$('p', null, msg)); const r = $$('div', 'btns'); const b = $$('button', 'btn primary', 'Back to games'); b.onclick = leave; r.appendChild(b); ui.md.appendChild(r); };
    const ready = S => { Online.session = S; ui.close(); opts.onReady(S); };

    if (role === 'guest') {
      ui.md.appendChild($$('div', 'big-emo', '🌐'));
      ui.md.appendChild($$('h2', null, 'Joining ' + meta.name));
      const st = $$('p', null, 'Connecting to your friend…');
      ui.md.appendChild(st);
      const r = $$('div', 'btns'), cancel = $$('button', 'btn', 'Cancel'); r.appendChild(cancel); ui.md.appendChild(r);
      const j = Online.join(room, { onTry: n => { st.textContent = n > 1 ? 'Still trying… (' + n + ')' : 'Connecting to your friend…'; }, onReady: ready, onError: fail });
      cancel.onclick = () => { j.cancel(); leave(); };
      return;
    }

    // host lobby
    const link = location.origin && location.origin !== 'null' ? location.href.split('?')[0].replace(/[^/]*$/, '') + 'play.html?g=' + encodeURIComponent(meta.id) + '&online=guest&room=' + room : 'play.html?g=' + meta.id + '&online=guest&room=' + room;
    ui.md.appendChild($$('div', 'big-emo', meta.icon));
    ui.md.appendChild($$('h2', null, meta.name + ' · online'));
    const st = $$('p', null, 'Setting up your room…');
    ui.md.appendChild(st);
    const lab1 = $$('div', 'lob-lbl', 'Share this link with a friend'), row1 = $$('div', 'lob-row');
    const inp = $$('input', 'lob-in'); inp.readOnly = true; inp.value = link;
    const cp = $$('button', 'btn', 'Copy');
    cp.onclick = () => { inp.select(); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => { cp.textContent = 'Copied ✓'; }, () => { try { document.execCommand('copy'); cp.textContent = 'Copied ✓'; } catch (e) { /* ignore */ } }); };
    row1.appendChild(inp); row1.appendChild(cp);
    const signed = !!(Hub.Auth && Hub.Auth.current());
    const lab2 = $$('div', 'lob-lbl', signed ? 'Or invite a GameNest account' : 'Sign in to invite an account by username'), row2 = $$('div', 'lob-row');
    const un = $$('input', 'lob-in'); un.placeholder = 'Friend’s username'; un.maxLength = 20; un.setAttribute('list', 'friendsList'); un.disabled = !signed;
    const dl = $$('datalist'); dl.id = 'friendsList'; Hub.LS.get('friends', []).forEach(n => { const o = document.createElement('option'); o.value = n; dl.appendChild(o); });
    const send = $$('button', 'btn primary', 'Invite'); send.disabled = !signed;
    row2.appendChild(un); row2.appendChild(send); row2.appendChild(dl);
    ui.md.appendChild(lab1); ui.md.appendChild(row1); ui.md.appendChild(lab2); ui.md.appendChild(row2);
    const note = $$('p', 'lob-note', 'Your friend must have GameNest open and be signed in to see an invite. A link works for anyone.');
    ui.md.appendChild(note);
    const r = $$('div', 'btns'), cancel = $$('button', 'btn', 'Cancel'); r.appendChild(cancel); ui.md.appendChild(r);
    let hostPeer = null;
    const h = Online.host(room, {
      onOpen: p => { hostPeer = p; st.textContent = 'Waiting for your friend to join…'; },
      onReady: ready, onError: fail
    });
    cancel.onclick = () => { h.cancel(); leave(); };
    send.onclick = async () => {
      const name = un.value.trim();
      if (!name || !hostPeer) return;
      if (name.toLowerCase() === myName().toLowerCase()) { st.textContent = 'That is you!'; return; }
      send.disabled = true; st.textContent = 'Inviting ' + clean(name) + '…';
      const res = await Online.invite(hostPeer, name, meta.id, room);
      send.disabled = false;
      st.textContent = ({ accept: clean(name) + ' accepted — connecting…', decline: clean(name) + ' declined the invite.', busy: clean(name) + ' is in another game.', offline: clean(name) + ' is not online right now. Send them the link instead.', timeout: 'No answer yet. Try again or share the link.' })[res];
      if (res === 'accept') { const f = Hub.LS.get('friends', []).filter(n => n !== name); f.unshift(name); Hub.LS.set('friends', f.slice(0, 12)); }
    };
  };

  // start listening for invites as soon as the page is ready
  if (Hub.Auth) window.addEventListener('load', () => Online.startInbox());
})();
