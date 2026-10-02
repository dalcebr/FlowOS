/*═══════════════════════════════════════════════
  FlowOS — server.js
  Backend optimised for Termux on low-end Android.
  APIs: auth · metrics · terminal · files · sysinfo
═══════════════════════════════════════════════*/

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = +process.env.PORT || 3000;
const USERNAME = process.env.USERNAME || 'flowos';
const PASSWORD = process.env.PASSWORD || '1234';

app.use(express.json());
app.use(cookieParser());

/* ═══ Sessions ════════════════════════════ */

const sessions = new Map();
const token = () => crypto.randomBytes(32).toString('hex');

function auth(req, res, next) {
  const t = req.cookies.sid;
  if (t && sessions.has(t)) { req.sess = sessions.get(t); return next(); }
  res.status(401).json({ error: 'unauthorized' });
}

/* ═══ Auth ════════════════════════════════ */

// Returns username so the frontend can greet the user
app.get('/api/whoami', (req, res) => {
  const t = req.cookies.sid;
  if (t && sessions.has(t)) return res.json({ user: USERNAME });
  res.status(401).json({ ok: false });
});

app.post('/api/login', (req, res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({ error: 'wrong_password' });
  const sid = token();
  sessions.set(sid, { ts: Date.now(), cwd: os.homedir() });
  res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax', maxAge: 43200000 });
  res.json({ ok: true, user: USERNAME });
});

app.post('/api/logout', (req, res) => {
  const t = req.cookies.sid;
  if (t) sessions.delete(t);
  res.clearCookie('sid');
  res.json({ ok: true });
});

/* ═══ Metrics (cached 2.5 s) ═════════════ */

let mCache = { cpu: 0, mem: 0, ts: 0 }, prevSnap = cpuSnap();

function cpuSnap() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    for (const v of Object.values(c.times)) total += v;
    idle += c.times.idle;
  }
  return { idle, total };
}

function metrics() {
  const now = Date.now();
  if (now - mCache.ts < 2500) return mCache;
  const s = cpuSnap();
  const di = s.idle - prevSnap.idle, dt = s.total - prevSnap.total;
  prevSnap = s;
  const tm = os.totalmem(), fm = os.freemem();
  mCache = { cpu: dt ? Math.round((1 - di / dt) * 100) : 0, mem: Math.round(((tm - fm) / tm) * 100), ts: now };
  return mCache;
}

app.get('/api/metrics', auth, (_, res) => { const m = metrics(); res.json({ cpu: m.cpu, mem: m.mem }); });

/* ═══ System info (cached 5 s) ═══════════ */

let sCache = { d: null, ts: 0 };
const readSafe = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return null; } };

app.get('/api/system', auth, (_, res) => {
  const now = Date.now();
  if (sCache.d && now - sCache.ts < 5000) return res.json(sCache.d);

  const cpus = os.cpus();
  const tm = os.totalmem(), fm = os.freemem();

  // Network interfaces
  const nets = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs) {
      if (a.family === 'IPv4') nets.push({ name, ip: a.address, mac: a.mac, internal: a.internal });
    }
  }

  // Battery (Android sysfs)
  let battery = null;
  const cap = readSafe('/sys/class/power_supply/battery/capacity');
  const status = readSafe('/sys/class/power_supply/battery/status');
  const temp = readSafe('/sys/class/power_supply/battery/temp');
  if (cap !== null) {
    battery = { level: +cap, status: status || 'Unknown' };
    if (temp !== null) battery.temp = (+temp / 10).toFixed(1);
  }

  // Disk
  let disk = null;
  try {
    const raw = require('child_process').execSync('df -B1 ' + os.homedir() + ' 2>/dev/null').toString();
    const p = raw.trim().split('\n')[1]?.split(/\s+/);
    if (p) disk = { total: +p[1], used: +p[2], free: +p[3], mount: p[5] };
  } catch {}

  // Wi-Fi SSID
  let wifi = null;
  try {
    const r = require('child_process').execSync("iwgetid -r 2>/dev/null || echo ''").toString().trim();
    if (r) wifi = r;
  } catch {}

  const d = {
    hostname: os.hostname(), platform: os.platform(), arch: os.arch(),
    kernel: os.release(), uptime: os.uptime(), nodeVersion: process.version,
    cpu: { model: cpus[0]?.model?.trim() || 'Unknown', cores: cpus.length, speed: cpus[0]?.speed || 0 },
    memory: { total: tm, free: fm, used: tm - fm },
    network: nets, wifi, battery, disk, user: USERNAME
  };
  sCache = { d, ts: now };
  res.json(d);
});

/* ═══ Terminal ════════════════════════════ */

app.post('/api/terminal/exec', auth, (req, res) => {
  const cmd = (req.body.cmd || '').trim();
  const cwd = req.body.cwd || req.sess.cwd || os.homedir();
  if (!cmd) return res.json({ output: '', cwd });

  const full = cmd + '\necho "__FLOWOS_CWD__"\npwd';

  exec(full, {
    cwd, shell: process.env.SHELL || '/bin/sh',
    timeout: 30000, maxBuffer: 512 * 1024,
    env: { ...process.env, TERM: 'dumb', COLUMNS: '120', LINES: '40' }
  }, (err, stdout, stderr) => {
    let output = stdout || '';
    let newCwd = cwd;

    const idx = output.lastIndexOf('__FLOWOS_CWD__');
    if (idx !== -1) {
      const after = output.substring(idx + '__FLOWOS_CWD__'.length).trim();
      if (after) newCwd = after.split('\n')[0].trim();
      output = output.substring(0, idx);
    }
    if (err && !output && !stderr) output = 'Error: ' + (err.killed ? 'timeout (30s)' : err.message) + '\n';
    if (stderr) output += stderr;

    req.sess.cwd = newCwd;
    res.json({ output, cwd: newCwd });
  });
});

/* ═══ File Manager ════════════════════════ */

app.get('/api/files/list', auth, (req, res) => {
  const dir = req.query.path || os.homedir();
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const items = entries.map(e => {
      let stat = null;
      try { stat = fs.statSync(path.join(dir, e.name)); } catch {}
      return {
        name: e.name,
        type: e.isDirectory() ? 'dir' : (e.isSymbolicLink() ? 'link' : 'file'),
        size: stat?.size || 0,
        modified: stat?.mtimeMs || 0,
        permissions: stat ? (stat.mode & 0o777).toString(8) : '000'
      };
    }).sort((a, b) => a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name));
    res.json({ path: dir, parent: path.dirname(dir), items, home: os.homedir() });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/files/read', auth, (req, res) => {
  const fp = req.query.path;
  if (!fp) return res.status(400).json({ error: 'path required' });
  try {
    const stat = fs.statSync(fp);
    if (stat.size > 512 * 1024) return res.json({ error: 'too_large', size: stat.size });
    res.json({ content: fs.readFileSync(fp, 'utf8'), size: stat.size, name: path.basename(fp) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/mkdir', auth, (req, res) => {
  try { fs.mkdirSync(req.body.path, { recursive: true }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/delete', auth, (req, res) => {
  try { fs.rmSync(req.body.path, { recursive: true, force: true }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/rename', auth, (req, res) => {
  try { fs.renameSync(req.body.from, req.body.to); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/write', auth, (req, res) => {
  try { fs.writeFileSync(req.body.path, req.body.content || '', 'utf8'); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

/* ═══ Static + SPA ════════════════════════ */

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ═══ Start ═══════════════════════════════ */

app.listen(PORT, '0.0.0.0', () => {
  const line = '═'.repeat(36);
  console.log(`\n  ╔${line}╗`);
  console.log(`  ║  FlowOS v2.0 — port ${PORT}            ║`);
  console.log(`  ╚${line}╝\n`);
  console.log(`  Local:   http://localhost:${PORT}`);
  for (const [n, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  Network: http://${a.address}:${PORT}`);
    }
  }
  console.log(`\n  User: ${USERNAME}\n`);
});
