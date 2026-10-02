/* ══════════════════════════════════════════════════════
   FlowOS — backend
   ══════════════════════════════════════════════════════ */
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn, exec } = require('child_process');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const USER = process.env.FLOW_USER || 'flow';
const PASS = process.env.FLOW_PASS || 'flow';
const HOME = os.homedir();

/* ─── Shell ─── */
const SHELL = (() => {
  const c = [
    process.env.SHELL,
    process.env.PREFIX && path.join(process.env.PREFIX, 'bin', 'bash'),
    '/bin/bash', '/bin/sh', '/system/bin/sh'
  ].filter(Boolean);
  for (const s of c) { try { if (fs.existsSync(s)) return s; } catch {} }
  return '/bin/sh';
})();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

/* ─── Sessions ─── */
const TTL = 12 * 3600 * 1000;
const sessions = new Map();

const newId = () => crypto.randomBytes(32).toString('hex');
const newSession = () => ({ ts: Date.now(), cwd: HOME });
const getSession = (req) => {
  const id = req.cookies.sid;
  if (!id) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.ts > TTL) { sessions.delete(id); return null; }
  s.ts = Date.now();
  return s;
};
const auth = (req, res, next) => {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'unauthorized' });
  req.sess = s;
  next();
};

/* ─── Auth ─── */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username && username !== USER) return res.status(403).json({ error: 'invalid' });
  if (password !== PASS) return res.status(403).json({ error: 'invalid' });
  const id = newId();
  sessions.set(id, newSession());
  res.cookie('sid', id, { httpOnly: true, sameSite: 'lax', maxAge: TTL });
  res.json({ ok: true, user: USER, home: HOME });
});

app.post('/api/logout', (req, res) => {
  const id = req.cookies.sid;
  if (id) sessions.delete(id);
  res.clearCookie('sid');
  res.json({ ok: true });
});

app.get('/api/whoami', (req, res) => {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'unauthorized' });
  res.json({ user: USER, home: HOME });
});

/* ─── Métricas ─── */
let prevCpu = cpuSnap();
function cpuSnap() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    for (const k in c.times) total += c.times[k];
    idle += c.times.idle;
  }
  return { idle, total, ts: Date.now() };
}
function readTemp() {
  try {
    const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8').trim();
    const t = parseInt(raw, 10);
    if (!isNaN(t)) return t > 1000 ? (t / 1000).toFixed(1) : t.toFixed(1);
  } catch {}
  return null;
}
app.get('/api/metrics', auth, (req, res) => {
  const cur = cpuSnap();
  const dIdle = cur.idle - prevCpu.idle;
  const dTotal = cur.total - prevCpu.total;
  prevCpu = cur;
  const cpu = dTotal > 0 ? Math.max(0, Math.min(100, Math.round((1 - dIdle / dTotal) * 100))) : 0;
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const mem = Math.round(((memTotal - memFree) / memTotal) * 100);
  res.json({
    cpu, mem,
    load: os.loadavg()[0].toFixed(2),
    uptime: os.uptime(),
    temp: readTemp()
  });
});

/* ─── Sistema ─── */
const readSafe = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return null; } };
const execP = (cmd, opts = {}) => new Promise((resolve) => {
  exec(cmd, { timeout: 8000, maxBuffer: 2 * 1024 * 1024, ...opts }, (err, stdout) => resolve(stdout || ''));
});

app.get('/api/system', auth, async (req, res) => {
  const cpus = os.cpus();
  const nets = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4') nets.push({ name, ip: a.address, mac: a.mac, internal: a.internal });
    }
  }

  let battery = null;
  const cap = readSafe('/sys/class/power_supply/battery/capacity');
  const stat = readSafe('/sys/class/power_supply/battery/status');
  const tmp = readSafe('/sys/class/power_supply/battery/temp');
  if (cap !== null) {
    battery = { level: parseInt(cap, 10), status: stat || 'Unknown' };
    if (tmp) battery.temp = (parseInt(tmp, 10) / 10).toFixed(1);
  }

  let disk = null;
  const dfOut = await execP(`df -B1 "${HOME}" 2>/dev/null`);
  const dfLine = dfOut.trim().split('\n')[1];
  if (dfLine) {
    const p = dfLine.split(/\s+/);
    disk = { total: +p[1], used: +p[2], free: +p[3], mount: p[5] };
  }

  let wifi = null;
  const wifiOut = await execP(`iwgetid -r 2>/dev/null`);
  if (wifiOut.trim()) wifi = wifiOut.trim();

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    kernel: os.release(),
    uptime: os.uptime(),
    node: process.version,
    shell: SHELL,
    user: USER,
    home: HOME,
    cpu: { model: (cpus[0]?.model || 'Unknown').trim(), cores: cpus.length, speed: cpus[0]?.speed || 0 },
    memory: { total: memTotal, free: memFree, used: memTotal - memFree },
    network: nets,
    wifi, battery, disk
  });
});

/* ─── Terminal ─── */
app.post('/api/terminal/exec', auth, (req, res) => {
  const raw = (req.body?.cmd || '').toString();
  if (!raw.trim()) return res.json({ output: '', cwd: req.sess.cwd });
  const cwd = req.body?.cwd || req.sess.cwd || HOME;

  const marker = `__FLOW_${crypto.randomBytes(6).toString('hex')}__`;
  const wrapped = `{ ${raw}\n} 2>&1; printf '\\n${marker}\\n'; pwd`;

  const child = spawn(SHELL, ['-c', wrapped], {
    cwd,
    env: { ...process.env, TERM: 'dumb', LANG: process.env.LANG || 'C.UTF-8' }
  });

  let out = '';
  let killed = false;
  const killTimer = setTimeout(() => { killed = true; try { child.kill('SIGKILL'); } catch {} }, 30000);
  const onData = (d) => {
    out += d.toString();
    if (out.length > 4 * 1024 * 1024) { killed = true; try { child.kill('SIGKILL'); } catch {} }
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('error', (e) => { out += '\n[erro: ' + e.message + ']'; });
  child.on('close', (code) => {
    clearTimeout(killTimer);
    let newCwd = cwd;
    const idx = out.lastIndexOf(marker);
    if (idx !== -1) {
      const tail = out.substring(idx + marker.length);
      const firstLine = tail.split('\n').map(l => l.trim()).find(Boolean);
      if (firstLine && firstLine.startsWith('/')) newCwd = firstLine;
      out = out.substring(0, idx).replace(/\n+$/, '');
    }
    if (killed) out += '\n[comando interrompido — timeout ou buffer cheio]';
    req.sess.cwd = newCwd;
    res.json({ output: out, cwd: newCwd, exitCode: code });
  });
});

/* ─── Filesystem ─── */
const resolve = (p) => {
  if (!p || typeof p !== 'string') throw new Error('invalid path');
  if (p === '~') return HOME;
  if (p.startsWith('~/')) return path.join(HOME, p.slice(2));
  return path.resolve(p);
};

app.get('/api/files/list', auth, async (req, res) => {
  try {
    const dir = resolve(req.query.path || HOME);
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const items = await Promise.all(entries.map(async (e) => {
      const full = path.join(dir, e.name);
      let st = null;
      try { st = await fsp.lstat(full); } catch {}
      return {
        name: e.name,
        type: e.isDirectory() ? 'dir' : e.isSymbolicLink() ? 'link' : 'file',
        size: st?.size || 0,
        mtime: st?.mtimeMs || 0,
        ext: path.extname(e.name).slice(1).toLowerCase()
      };
    }));
    items.sort((a, b) => {
      const da = a.type === 'dir', db = b.type === 'dir';
      if (da !== db) return da ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    const parent = path.dirname(dir);
    res.json({ path: dir, parent: parent !== dir ? parent : null, items, home: HOME });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/files/read', auth, async (req, res) => {
  try {
    const p = resolve(req.query.path);
    const st = await fsp.stat(p);
    if (!st.isFile()) return res.status(400).json({ error: 'not_a_file' });
    if (st.size > 5 * 1024 * 1024) return res.json({ error: 'too_large', size: st.size });
    const buf = await fsp.readFile(p);
    const sample = buf.subarray(0, Math.min(8192, buf.length));
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) return res.json({ error: 'binary', size: st.size });
    }
    res.json({ content: buf.toString('utf8'), size: st.size, name: path.basename(p), path: p, mtime: st.mtimeMs });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/write', auth, async (req, res) => {
  try {
    const p = resolve(req.body?.path);
    await fsp.mkdir(path.dirname(p), { recursive: true });
    await fsp.writeFile(p, req.body?.content ?? '', 'utf8');
    const st = await fsp.stat(p);
    res.json({ ok: true, size: st.size, mtime: st.mtimeMs });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/mkdir', auth, async (req, res) => {
  try {
    await fsp.mkdir(resolve(req.body?.path), { recursive: true });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/delete', auth, async (req, res) => {
  try {
    const p = resolve(req.body?.path);
    if (p === '/' || p === HOME) return res.status(400).json({ error: 'refusing' });
    await fsp.rm(p, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/files/rename', auth, async (req, res) => {
  try {
    await fsp.rename(resolve(req.body?.from), resolve(req.body?.to));
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/files/search', auth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ items: [] });
  try {
    const dir = resolve(req.query.path || HOME);
    const safe = q.replace(/"/g, '\\"');
    const out = await execP(`find "${dir}" -maxdepth 6 -iname "*${safe}*" 2>/dev/null | head -n 100`);
    const items = out.trim().split('\n').filter(Boolean).map(p => ({ path: p, name: path.basename(p) }));
    res.json({ items });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* ─── Processos ─── */
app.get('/api/processes', auth, async (req, res) => {
  try {
    const out = await execP('ps -eo pid,ppid,user,pcpu,pmem,etime,comm,args 2>/dev/null');
    const lines = out.trim().split('\n');
    const procs = [];
    for (let i = 1; i < lines.length; i++) {
      const p = lines[i].trim().split(/\s+/);
      if (p.length < 7) continue;
      const pid = parseInt(p[0], 10);
      if (isNaN(pid)) continue;
      procs.push({
        pid,
        ppid: parseInt(p[1], 10) || 0,
        user: p[2] || '',
        cpu: parseFloat(p[3]) || 0,
        mem: parseFloat(p[4]) || 0,
        etime: p[5] || '',
        name: p[6] || '',
        cmd: p.slice(7).join(' ').substring(0, 200)
      });
    }
    procs.sort((a, b) => b.cpu - a.cpu || b.mem - a.mem);
    res.json({ processes: procs.slice(0, 200) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/processes/kill', auth, (req, res) => {
  const pid = parseInt(req.body?.pid, 10);
  const sig = (req.body?.signal || 'TERM').toUpperCase();
  if (!pid || pid <= 1 || pid === process.pid) return res.status(400).json({ error: 'invalid_pid' });
  if (!['TERM', 'KILL', 'INT', 'HUP'].includes(sig)) return res.status(400).json({ error: 'invalid_signal' });
  try {
    process.kill(pid, sig);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* ─── Static ─── */
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ⚡ FlowOS v4 → http://localhost:${PORT}`);
  for (const [, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`     http://${a.address}:${PORT}`);
    }
  }
  console.log(`  👤 ${USER}  ·  🐚 ${SHELL}\n`);
});
