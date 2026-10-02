(function(){
'use strict';

WM.register('settings', {
  title: 'Ajustes',
  width: 780, height: 540,
  onOpen: init,
  onClose: cleanup
});

const SECTIONS = [
  { id: 'appearance', label: 'Aparência', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' },
  { id: 'system', label: 'Sistema', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { id: 'network', label: 'Rede', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>' },
  { id: 'battery', label: 'Bateria', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>' },
  { id: 'disk', label: 'Armazenamento', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { id: 'git', label: 'Git', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="12" r="3"/><line x1="6" y1="9" x2="6" y2="15"/><path d="M6 9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v0"/></svg>' },
  { id: 'about', label: 'Sobre', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }
];

const ACCENTS = [
  { h: 210, c: '#6ea8fe' }, { h: 270, c: '#c084fc' }, { h: 330, c: '#f472b6' },
  { h: 0, c: '#f87171' }, { h: 25, c: '#fb923c' }, { h: 45, c: '#fbbf24' },
  { h: 145, c: '#34d399' }, { h: 185, c: '#22d3ee' }
];

let st = null;

function init(inst) {
  inst.body.innerHTML = `
    <div class="stg">
      <div class="stg-nav" id="stgNav"></div>
      <div class="stg-pane" id="stgPane"></div>
    </div>`;

  st = { inst, pane: inst.body.querySelector('#stgPane'), nav: inst.body.querySelector('#stgNav'), data: null };

  st.nav.innerHTML = SECTIONS.map((s, i) =>
    `<div class="stg-nav-item${i === 0 ? ' active' : ''}" data-id="${s.id}">${s.icon}<span>${s.label}</span></div>`
  ).join('');

  st.nav.querySelectorAll('.stg-nav-item').forEach(el => {
    el.onclick = () => {
      st.nav.querySelectorAll('.stg-nav-item').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      showSection(el.dataset.id);
    };
  });

  showSection('appearance');
}

function cleanup() { st = null; }

async function showSection(id) {
  if (!st) return;
  if (id === 'git') return renderGit();
  if (id !== 'appearance') {
    try {
      const r = await fetch('/api/system');
      st.data = await r.json();
    } catch { st.data = null; }
  }
  render(id);
}

function render(id) {
  if (!st) return;
  switch (id) {
    case 'appearance': return renderAppearance();
    case 'system': return renderSystem();
    case 'network': return renderNetwork();
    case 'battery': return renderBattery();
    case 'disk': return renderDisk();
    case 'about': return renderAbout();
  }
}

function renderAppearance() {
  const isDark = OS.prefs.theme === 'dark';
  const curH = OS.prefs.accent;
  const curW = OS.prefs.wallpaper;

  st.pane.innerHTML = `
    <div class="stg-title">Aparência</div>
    <div class="stg-card">
      <div class="stg-row">
        <span class="stg-label">Modo escuro</span>
        <div class="stg-toggle${isDark ? ' active' : ''}" id="stgTheme"></div>
      </div>
    </div>
    <div class="stg-card">
      <div class="stg-label" style="margin-bottom:12px">Cor de destaque</div>
      <div class="stg-colors" id="stgAccents">
        ${ACCENTS.map(a => `<div class="stg-color${a.h === curH ? ' active' : ''}" data-h="${a.h}" style="background:${a.c}"></div>`).join('')}
      </div>
    </div>
    <div class="stg-card">
      <div class="stg-label" style="margin-bottom:12px">Papel de parede</div>
      <div class="stg-walls" id="stgWalls">
        ${WALLPAPERS.map((w, i) => `<div class="stg-wall${i === curW ? ' active' : ''}" data-i="${i}" style="background:${w.bg}" title="${w.name}"></div>`).join('')}
      </div>
    </div>
    <div class="stg-card">
      <div class="stg-row">
        <span class="stg-label">Encerrar sessão</span>
        <button class="editor-btn" style="color:var(--red)" id="stgLogout">Sair</button>
      </div>
    </div>`;

  st.pane.querySelector('#stgTheme').onclick = () => {
    OS.prefs.theme = OS.prefs.theme === 'dark' ? 'light' : 'dark';
    OS.savePrefs(); OS.applyPrefs(); renderAppearance();
  };
  st.pane.querySelector('#stgAccents').onclick = (e) => {
    const el = e.target.closest('.stg-color');
    if (!el) return;
    OS.prefs.accent = +el.dataset.h;
    OS.savePrefs(); OS.applyPrefs(); renderAppearance();
  };
  st.pane.querySelector('#stgWalls').onclick = (e) => {
    const el = e.target.closest('.stg-wall');
    if (!el) return;
    OS.prefs.wallpaper = +el.dataset.i;
    OS.savePrefs(); OS.applyPrefs(); renderAppearance();
  };
  st.pane.querySelector('#stgLogout').onclick = async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
  };
}

function renderSystem() {
  const d = st.data;
  if (!d) return st.pane.innerHTML = '<div class="stg-title">Sistema</div><div class="stg-card">Carregando…</div>';
  st.pane.innerHTML = `
    <div class="stg-title">Sistema</div>
    <div class="stg-card">
      ${row('Hostname', d.hostname)}
      ${row('Plataforma', `${d.platform} · ${d.arch}`)}
      ${row('Kernel', d.kernel)}
      ${row('Tempo ativo', formatUptime(d.uptime))}
      ${row('Node.js', d.node)}
      ${row('Shell', d.shell)}
      ${row('Usuário', d.user)}
      ${row('Home', d.home)}
    </div>
    <div class="stg-title" style="font-size:15px;margin-top:20px">Processador</div>
    <div class="stg-card">
      ${row('Modelo', d.cpu.model)}
      ${row('Núcleos', d.cpu.cores)}
      ${row('Clock', d.cpu.speed + ' MHz')}
    </div>
    <div class="stg-title" style="font-size:15px;margin-top:20px">Memória</div>
    <div class="stg-card">
      ${row('Total', fmtBytes(d.memory.total))}
      ${row('Em uso', fmtBytes(d.memory.used))}
      ${row('Livre', fmtBytes(d.memory.free))}
      ${meter(Math.round(d.memory.used / d.memory.total * 100))}
    </div>`;
}

function renderNetwork() {
  const d = st.data;
  if (!d) return st.pane.innerHTML = '<div class="stg-title">Rede</div><div class="stg-card">Carregando…</div>';
  const nets = d.network.map(n =>
    `<div class="stg-card">
      ${row('Interface', n.name)}
      ${row('IP', n.ip + (n.internal ? ' (local)' : ''))}
      ${n.mac && n.mac !== '00:00:00:00:00:00' ? row('MAC', n.mac) : ''}
    </div>`
  ).join('');
  st.pane.innerHTML = `
    <div class="stg-title">Rede</div>
    <div class="stg-card">
      ${row('Wi-Fi', d.wifi ? '<span class="stg-badge g">● ' + d.wifi + '</span>' : '<span class="stg-badge y">Sem Wi-Fi</span>')}
    </div>
    ${nets || '<div class="stg-card">Nenhuma interface encontrada</div>'}`;
}

function renderBattery() {
  const d = st.data;
  if (!d) return st.pane.innerHTML = '<div class="stg-title">Bateria</div><div class="stg-card">Carregando…</div>';
  if (!d.battery) {
    st.pane.innerHTML = `
      <div class="stg-title">Bateria</div>
      <div class="stg-card">
        <p style="color:var(--text-2)">Dados de bateria indisponíveis.</p>
        <p style="color:var(--text-3);font-size:11.5px;margin-top:8px">
          Instale <code>termux-api</code> e <code>termux-api</code> app para ver dados da bateria.
        </p>
      </div>`;
    return;
  }
  const lv = d.battery.level;
  const col = lv > 60 ? 'g' : lv > 20 ? 'y' : 'r';
  const statusMap = { Charging: '⚡ Carregando', Full: 'Completa', Discharging: 'Descarregando', Not_charging: 'Parado' };
  st.pane.innerHTML = `
    <div class="stg-title">Bateria</div>
    <div class="stg-card">
      ${row('Nível', `<span class="stg-badge ${col}">${lv}%</span>`)}
      ${row('Status', statusMap[d.battery.status] || d.battery.status)}
      ${d.battery.temp ? row('Temperatura', d.battery.temp + '°C') : ''}
      ${meter(lv, col === 'g' ? 'var(--green)' : col === 'y' ? 'var(--yellow)' : 'var(--red)')}
    </div>`;
}

function renderDisk() {
  const d = st.data;
  if (!d) return st.pane.innerHTML = '<div class="stg-title">Armazenamento</div><div class="stg-card">Carregando…</div>';
  if (!d.disk) {
    st.pane.innerHTML = '<div class="stg-title">Armazenamento</div><div class="stg-card">Informação indisponível</div>';
    return;
  }
  const pct = Math.round(d.disk.used / d.disk.total * 100);
  const col = pct > 90 ? 'r' : pct > 70 ? 'y' : 'g';
  st.pane.innerHTML = `
    <div class="stg-title">Armazenamento</div>
    <div class="stg-card">
      ${row('Montagem', d.disk.mount)}
      ${row('Total', fmtBytes(d.disk.total))}
      ${row('Usado', fmtBytes(d.disk.used) + ' (' + pct + '%)')}
      ${row('Livre', fmtBytes(d.disk.free))}
      ${meter(pct, col === 'g' ? 'var(--green)' : col === 'y' ? 'var(--yellow)' : 'var(--red)')}
    </div>`;
}

function renderAbout() {
  st.pane.innerHTML = `
    <div class="stg-title">Sobre</div>
    <div class="stg-card">
      ${row('Sistema', 'FlowOS v4.0')}
      ${row('Estilo', 'Inspirado no macOS')}
      ${row('Stack', 'Node.js + Express + Vanilla JS')}
      ${row('Conceito', 'Termux = servidor · Browser = tela')}
    </div>
    <div class="stg-card" style="text-align:center;padding:24px">
      <div style="font-size:42px;margin-bottom:8px">⚡</div>
      <p style="color:var(--text-2);font-size:12px">Feito para programar do celular</p>
    </div>`;
}

/* Helpers */
function row(label, value) {
  return `<div class="stg-row"><span class="stg-label">${label}</span><span class="stg-value">${value}</span></div>`;
}
function meter(pct, color) {
  return `<div class="stg-meter"><div class="stg-meter-fill" style="width:${pct}%;background:${color || 'var(--accent)'}"></div></div>`;
}
function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}
function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor(s % 86400 / 3600);
  const m = Math.floor(s % 3600 / 60);
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h) parts.push(h + 'h');
  parts.push(m + 'm');
  return parts.join(' ');
}

async function renderGit() {
  let cfg = { user: '', email: '', hasToken: false };
  try {
    const r = await fetch('/api/git/config');
    cfg = await r.json();
  } catch {}

  st.pane.innerHTML = `
    <div class="stg-title">Git</div>
    <div class="stg-card">
      <div class="stg-row"><span class="stg-label">Nome (user.name)</span></div>
      <input class="code-git-msg" id="gitName" placeholder="Seu Nome" value="${esc(cfg.user)}">
      <div class="stg-row" style="margin-top:10px"><span class="stg-label">Email (user.email)</span></div>
      <input class="code-git-msg" id="gitEmail" placeholder="voce@exemplo.com" value="${esc(cfg.email)}">
      <div class="stg-row" style="margin-top:10px"><span class="stg-label">Token do GitHub</span>
        <span class="stg-badge ${cfg.hasToken ? 'g' : 'y'}">${cfg.hasToken ? 'Configurado' : 'Não configurado'}</span>
      </div>
      <input class="code-git-msg" id="gitToken" type="password"
             placeholder="${cfg.hasToken ? 'Deixe vazio para manter o atual' : 'ghp_…  (cole aqui)'}">
      <p style="font-size:11px;color:var(--text-3);margin-top:8px;line-height:1.5">
        Crie um token em <b>github.com/settings/tokens</b> → <b>Generate new token (classic)</b> → marque <b>repo</b>.<br>
        Cole aqui. O token fica salvo só no seu Termux (<code>~/.flowos/config.json</code>).
      </p>
      <div class="stg-row" style="margin-top:14px">
        <button class="editor-btn primary" id="gitSave">Salvar</button>
        <button class="editor-btn" id="gitClear" style="color:var(--red)">Apagar token</button>
      </div>
    </div>
    <div class="stg-card">
      <div class="stg-label" style="margin-bottom:10px">Atalhos do editor</div>
      <div class="stg-row"><span class="stg-label">Salvar</span><span class="stg-value">Ctrl + S</span></div>
      <div class="stg-row"><span class="stg-label">Fechar aba</span><span class="stg-value">Ctrl + W</span></div>
      <div class="stg-row"><span class="stg-label">Buscar arquivo</span><span class="stg-value">Ctrl + P</span></div>
    </div>`;

  st.pane.querySelector('#gitSave').onclick = async () => {
    const body = {
      user:  st.pane.querySelector('#gitName').value.trim(),
      email: st.pane.querySelector('#gitEmail').value.trim()
    };
    const tok = st.pane.querySelector('#gitToken').value.trim();
    if (tok) body.token = tok;
    await fetch('/api/git/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    renderGit();
  };

  st.pane.querySelector('#gitClear').onclick = async () => {
    if (!confirm('Apagar token salvo?')) return;
    await fetch('/api/git/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '' })
    });
    renderGit();
  };
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

window.Settings = { showGit: () => {
  // used by Code app to jump straight to the Git section
  const items = document.querySelectorAll('.stg-nav-item');
  items.forEach(el => el.classList.toggle('active', el.dataset.id === 'git'));
  renderGit();
}};
  
})();
