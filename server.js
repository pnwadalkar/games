// GameNest server: serves the site and a small account API. No dependencies, just Node.js (v16+).
//   node server.js            -> http://localhost:8000
//   PORT=3000 node server.js  -> custom port
// Accounts, password hashes, sessions and each account's saved data live in data/db.json.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT) || 8000;
const ITER = 150000;
const MAX_BODY = 2 * 1024 * 1024;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};

// ---------- tiny database (one JSON file, rewritten atomically) ----------
let db = { users: {}, sessions: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (e) { /* first run */ }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
  }, 200);
}

// ---------- helpers ----------
const normName = n => String(n || '').trim().toLowerCase();
const hashPw = (pw, salt) => new Promise((ok, no) =>
  crypto.pbkdf2(String(pw), salt, ITER, 32, 'sha256', (e, k) => (e ? no(e) : ok('p1:' + k.toString('hex')))));
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req) {
  return new Promise((ok, no) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { no(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { ok(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { no(new Error('bad json')); } });
    req.on('error', no);
  });
}
function sessionUser(req) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  if (!m) return null;
  const s = db.sessions[m[1]];
  if (!s || !db.users[s.user]) return null;
  return { id: s.user, token: m[1], user: db.users[s.user] };
}
function publicUser(id, u) { return { id, name: u.name, color: u.color, created: u.created }; }
function newSession(id) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { user: id, at: Date.now() };
  save();
  return token;
}

// ---------- API ----------
async function api(req, res, pathname) {
  if (pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });

  if (pathname === '/api/register' && req.method === 'POST') {
    const b = await readBody(req);
    const name = String(b.name || '').trim();
    if (!/^[\w .-]{3,20}$/.test(name)) return send(res, 400, { error: 'Username must be 3–20 letters, numbers, spaces, dots or dashes.' });
    if (String(b.password || '').length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
    const id = normName(name);
    if (db.users[id]) return send(res, 409, { error: 'That username is already taken.' });
    const salt = crypto.randomBytes(16).toString('hex');
    db.users[id] = { name, salt, hash: await hashPw(b.password, salt), created: Date.now(), color: Math.floor(Math.random() * 360), data: {} };
    const token = newSession(id);
    save();
    return send(res, 200, { token, user: publicUser(id, db.users[id]) });
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const id = normName(b.name), u = db.users[id];
    if (!u || !safeEq(await hashPw(b.password, u.salt), u.hash)) return send(res, 401, { error: 'Wrong username or password.' });
    return send(res, 200, { token: newSession(id), user: publicUser(id, u) });
  }

  if (pathname === '/api/logout' && req.method === 'POST') {
    const s = sessionUser(req);
    if (s) { delete db.sessions[s.token]; save(); }
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/me' && req.method === 'GET') {
    const s = sessionUser(req);
    if (!s) return send(res, 401, { error: 'Not signed in.' });
    return send(res, 200, { user: publicUser(s.id, s.user) });
  }

  if (pathname === '/api/data') {
    const s = sessionUser(req);
    if (!s) return send(res, 401, { error: 'Not signed in.' });
    if (req.method === 'GET') return send(res, 200, { data: s.user.data || {} });
    if (req.method === 'PUT') {
      const b = await readBody(req);
      const clean = {};
      for (const [k, v] of Object.entries(b.data || {})) {
        if (typeof v === 'string' && k.length <= 200) clean[k] = v.slice(0, 100000);
      }
      s.user.data = clean;
      save();
      return send(res, 200, { ok: true });
    }
  }
  return send(res, 404, { error: 'Not found.' });
}

// ---------- static files ----------
function serveFile(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const blocked = !file.startsWith(ROOT + path.sep) || file.startsWith(DATA_DIR) || path.basename(file) === 'server.js';
  if (blocked) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname.startsWith('/api/')) return await api(req, res, pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    serveFile(req, res, pathname);
  } catch (e) {
    if (!res.headersSent) send(res, 500, { error: 'Server error.' });
  }
}).listen(PORT, () => console.log(`GameNest running at http://localhost:${PORT}`));
