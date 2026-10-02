(function(){
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ═══ Preferências ═══ */
const PREFS_KEY = 'flowos.prefs';
const DEFAULTS = { theme: 'dark', accent: 210, wallpaper: 0 };

const OS = window.OS = {
  user: 'flow',
  home: '/',
  prefs: (() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; }
    catch { return { ...DEFAULTS }; }
  })()
};

const WALLPAPERS = [
  { name: 'Aurora', bg: 'linear-gradient(135deg,#1a0533,#0c1a3a 45%,#0a2e1f)' },
  { name: 'Oceano', bg: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' },
  { name: 'Meia-noite', bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' },
  { name: 'Floresta', bg: 'linear-gradient(135deg,#0a2e1f,#134e3a,#2d5a3f)' },
  { name: 'Nebulosa', bg: 'linear-gradient(135deg,#0c0c1d,#1a1a2e,#2d132c)' },
  { name: 'Pôr do sol', bg: 'linear-gradient(135deg,#2d132c,#801336,#c72c41,#ee4540)' },
  { name: 'Grafite', bg: 'linear-gradient(135deg,#1c1c1e,#2c2c2e,#3a3a3c)' },
  { name: 'Céu noturno', bg: 'linear-gradient(135deg,#000428,#004e92)' }
];

OS.savePrefs = () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(OS.prefs)); } catch {}
};

OS.applyPrefs = () => {
  const p = OS.prefs;
  document.documentElement.setAttribute('data-theme', p.theme);
  document.documentElement.style.setProperty('--accent-h', p.accent);
  const w = WALLPAPERS[p.wallpaper] || WALLPAPERS[0];
  document.documentElement.style.setProperty('--wall', w.bg);
};

/* ═══ Login ═══ */
const loginEl = $('#login');
const desktopEl = $('#desktop');
const loginForm = $('#loginForm');
const loginPass = $('#loginPass');
const loginError = $('#loginError');

const showLogin = () => {
  desktopEl.classList.add('hidden');
  loginEl.classList.remove('hidden');
  loginPass.value = '';
  loginError.textContent = '';
  setTimeout(() => loginPass.focus(), 80);
};

const showDesktop = () => {
  loginEl.classList.add('hidden');
  desktopEl.classList.remove('hidden');
  updateMetrics();
};

const checkSession = async () => {
  try {
    const r = await fetch('/api/whoami');
    if (r.ok) {
      const d = await r.json();
      OS.user = d.user;
      OS.home = d.home;
      showDesktop();
      return;
    }
  } catch {}
  showLogin();
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: loginPass.value })
    });
    if (r.ok) {
      const d = await r.json();
      OS.user = d.user;
      OS.home = d.home;
      showDesktop();
    } else {
      loginError.textContent = 'Senha incorreta';
      loginPass.value = '';
      loginPass.focus();
    }
  } catch {
    loginError.textContent = 'Sem conexão';
  }
});

/* ═══ Window Manager ═══ */
const WM = window.WM = {
  apps: {},
  instances: {},
  zIndex: 100,

  register(id, def) { this.apps[id] = { id, ...def }; },

  open(id) {
    if (this.instances[id]) {
      const inst = this.instances[id];
      if (inst.minimized) { inst.minimized = false; inst.el.classList.remove('minimized'); }
      this.focus(id);
      return;
    }
    const def = this.apps[id];
    if (!def) return;
    const inst = this.create(def);
    this.instances[id] = inst;
    this.updateDockDot(id, true);
    if (def.onOpen) { try { def.onOpen(inst); } catch (e) { console.error(e); } }
    this.focus(id);
  },

  create(def) {
    const layer = $('#windows');
    const el = document.createElement('div');
    el.className = 'window';
    el.dataset.app = def.id;

    const layerW = layer.clientWidth;
    const layerH = layer.clientHeight;
    const n = Object.keys(this.instances).length;
    const w = Math.min(def.width || 720, layerW - 16);
    const h = Math.min(def.height || 480, layerH - 16);
    const x = Math.max(8, Math.floor((layerW - w) / 2) + (n * 24) % 120);
    const y = Math.max(8, Math.floor((layerH - h) / 2) + (n * 24) % 120);

    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const bar = document.createElement('div');
    bar.className = 'window-bar';
    bar.innerHTML = `
      <div class="window-dots">
        <button class="dot close"></button>
        <button class="dot min"></button>
        <button class="dot max"></button>
      </div>
      <div class="window-title">${def.title || def.id}</div>
      <div class="window-pad"></div>
    `;
    const body = document.createElement('div');
    body.className = 'window-body';

    el.appendChild(bar);
    el.appendChild(body);
    layer.appendChild(el);

    const inst = { id: def.id, def, el, body, minimized: false };

    bar.querySelector('.close').onclick = (e) => { e.stopPropagation(); this.close(def.id); };
    bar.querySelector('.min').onclick   = (e) => { e.stopPropagation(); this.minimize(def.id); };
    bar.querySelector('.max').onclick   = (e) => { e.stopPropagation(); el.classList.toggle('maximized'); };
    el.addEventListener('pointerdown', () => this.focus(def.id), true);

    this.makeDraggable(el, bar);
    return inst;
  },

  close(id) {
    const inst = this.instances[id];
    if (!inst) return;
    if (inst.def.onClose) { try { inst.def.onClose(inst); } catch {} }
    inst.el.classList.add('closing');
    setTimeout(() => {
      inst.el.remove();
      delete this.instances[id];
      this.updateDockDot(id, false);
      this.refocusTop();
    }, 150);
  },

  focus(id) {
    const inst = this.instances[id];
    if (!inst) return;
    this.zIndex++;
    inst.el.style.zIndex = this.zIndex;
    $('#mbTitle').textContent = inst.def.title || inst.id;
    $$('.dock-icon').forEach(el => el.classList.toggle('active', el.dataset.app === id));
  },

  minimize(id) {
    const inst = this.instances[id];
    if (!inst) return;
    inst.minimized = true;
    inst.el.classList.add('minimized');
    $$('.dock-icon').forEach(el => el.classList.remove('active'));
    this.refocusTop();
  },

  refocusTop() {
    let top = null, tz = 0;
    for (const id in this.instances) {
      const i = this.instances[id];
      if (i.minimized) continue;
      const z = +i.el.style.zIndex || 0;
      if (z >= tz) { tz = z; top = id; }
    }
    if (top) this.focus(top);
    else $('#mbTitle').textContent = 'FlowOS';
  },

  updateDockDot(id, running) {
    const el = document.querySelector(`.dock-icon[data-app="${id}"]`);
    if (el) el.classList.toggle('running', running);
  },

  makeDraggable(el, handle) {
    let dragging = false, sx, sy, sl, st;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      if (el.classList.contains('maximized')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      sl = el.offsetLeft; st = el.offsetTop;
      try { handle.setPointerCapture(e.pointerId); } catch {}
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      el.style.left = Math.max(-el.offsetWidth + 80, Math.min(layerW() - 80, sl + e.clientX - sx)) + 'px';
      el.style.top = Math.max(0, Math.min(layerH() - 40, st + e.clientY - sy)) + 'px';
    });
    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch {}
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
    function layerW() { return $('#windows').clientWidth; }
    function layerH() { return $('#windows').clientHeight; }
  }
};

/* ═══ Dock ═══ */
const DOCK = [
  { id: 'terminal', name: 'Terminal' },
  { id: 'files', name: 'Arquivos' },
  { id: 'code', name: 'Code' },
  { sep: true },
  { id: 'processes', name: 'Processos' },
  { id: 'settings', name: 'Ajustes' }
];

const ICONS = {
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  editor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  processes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};

const buildDock = () => {
  const dock = $('#dock');
  dock.innerHTML = '';
  for (const app of DOCK) {
    if (app.sep) {
      const sep = document.createElement('div');
      sep.className = 'dock-sep';
      dock.appendChild(sep);
      continue;
    }
    const btn = document.createElement('button');
    btn.className = 'dock-icon';
    btn.dataset.app = app.id;
    btn.innerHTML = ICONS[app.id] + `<div class="dock-tooltip">${app.name}</div>`;
    btn.addEventListener('click', () => WM.open(app.id));
    dock.appendChild(btn);
  }
};

/* ═══ Clock + Métricas ═══ */
const updateClock = () => {
  const n = new Date();
  $('#mbClock').textContent =
    String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
};

const updateMetrics = async () => {
  try {
    const r = await fetch('/api/metrics');
    if (!r.ok) return;
    const d = await r.json();
    $('#mbCpu').textContent = `CPU ${d.cpu}%`;
    $('#mbRam').textContent = `RAM ${d.mem}%`;
  } catch {}
};

/* ═══ Init ═══ */
OS.applyPrefs();
buildDock();
updateClock();
setInterval(updateClock, 1000);
setInterval(updateMetrics, 2500);
checkSession();

window.$ = $;
window.$$ = $$;
})();
