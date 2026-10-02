(function(){
'use strict';

WM.register('code', {
  title: 'Code',
  width: 1020, height: 660,
  onOpen: init,
  onClose: cleanup
});

const EXT_LANG = {
  js:'js', mjs:'js', cjs:'js', jsx:'jsx', ts:'ts', tsx:'tsx',
  py:'py', rb:'rb', go:'go', rs:'rs', java:'java', c:'c', h:'c',
  cpp:'cpp', hpp:'cpp', cs:'cs', php:'php', swift:'swift', kt:'kt',
  sh:'sh', bash:'sh', zsh:'sh', fish:'sh', ps1:'ps1',
  html:'html', htm:'html', css:'css', scss:'css', less:'css', vue:'vue', svelte:'svelte',
  json:'json', yml:'yml', yaml:'yml', toml:'toml', xml:'xml',
  md:'md', txt:'txt', sql:'sql', lua:'lua', dart:'dart', r:'r'
};

const I = {
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>'
};

let st = null;

function init(inst) {
  inst.body.innerHTML = `
    <div class="code">
      <div class="code-toolbar">
        <button class="code-btn" id="cTree" title="Alternar árvore">☰</button>
        <button class="code-btn" id="cOpen" title="Abrir pasta">📂</button>
        <button class="code-btn" id="cNew"  title="Novo arquivo">＋</button>
        <button class="code-btn" id="cSave" title="Salvar (Ctrl+S)">💾</button>
        <button class="code-btn" id="cZip"  title="Importar .zip">📦</button>
        <div class="code-flex"></div>
        <span class="code-branch" id="cBranch">—</span>
        <button class="code-btn" id="cRefresh" title="Atualizar Git">↻</button>
        <button class="code-btn" id="cPush" title="Push">⬆</button>
        <button class="code-btn" id="cPull" title="Pull">⬇</button>
        <button class="code-btn" id="cGitCfg" title="Configurar Git">⚙</button>
      </div>
      <div class="code-body">
        <aside class="code-side" id="cSide">
          <div class="code-side-tabs">
            <button class="code-side-tab active" data-tab="files">Arquivos</button>
            <button class="code-side-tab" data-tab="git">Git</button>
          </div>
          <div class="code-side-pane" id="cFilesPane">
            <div class="code-root" id="cRoot"></div>
            <div class="code-tree" id="cTreeEl"></div>
          </div>
          <div class="code-side-pane hidden" id="cGitPane">
            <div class="code-git" id="cGitEl"></div>
          </div>
        </aside>
        <div class="code-main">
          <div class="code-tabs" id="cTabs"></div>
          <div class="code-edit-wrap" id="cEditWrap">
            <div class="code-gutter" id="cGutter">1</div>
            <textarea class="code-textarea" id="cText"
              spellcheck="false" autocapitalize="off" autocorrect="off"
              wrap="off" placeholder="// Abra ou crie um arquivo…"></textarea>
          </div>
          <div class="code-status" id="cStatus">Pronto</div>
        </div>
      </div>
    </div>`;

  st = {
    inst,
    root: null,
    tabs: [],
    active: -1,
    sideVisible: true,
    sideTab: 'files',
    el: {
      text:      inst.body.querySelector('#cText'),
      gutter:    inst.body.querySelector('#cGutter'),
      tabs:      inst.body.querySelector('#cTabs'),
      tree:      inst.body.querySelector('#cTreeEl'),
      rootLabel: inst.body.querySelector('#cRoot'),
      git:       inst.body.querySelector('#cGitEl'),
      gitPane:   inst.body.querySelector('#cGitPane'),
      filesPane: inst.body.querySelector('#cFilesPane'),
      status:    inst.body.querySelector('#cStatus'),
      branch:    inst.body.querySelector('#cBranch'),
      side:      inst.body.querySelector('#cSide'),
      editWrap:  inst.body.querySelector('#cEditWrap')
    }
  };

  bindEvents();
  const last = OS.prefs.codeRoot;
  if (last) openFolder(last, false);
  else renderEmptyTree();
}

function cleanup() { st = null; }

/* ─── Eventos ─── */
function bindEvents() {
  const q = s => st.inst.body.querySelector(s);

  q('#cTree').onclick = () => {
    st.sideVisible = !st.sideVisible;
    st.el.side.classList.toggle('collapsed', !st.sideVisible);
  };
  q('#cOpen').onclick  = pickFolder;
  q('#cNew').onclick   = createFile;
  q('#cSave').onclick  = () => saveActive();
  q('#cZip').onclick   = importZip;
  q('#cRefresh').onclick = refreshGit;
  q('#cPush').onclick    = doPush;
  q('#cPull').onclick    = doPull;
  q('#cGitCfg').onclick  = openGitConfig;

  st.inst.body.querySelectorAll('.code-side-tab').forEach(b => {
    b.onclick = () => switchSideTab(b.dataset.tab);
  });

  const ta = st.el.text;
  ta.addEventListener('input', onInput);
  ta.addEventListener('scroll', syncGutterScroll);
  ta.addEventListener('keydown', onKey);
  ta.addEventListener('click', updateCursorStatus);
  ta.addEventListener('keyup', updateCursorStatus);
}

function switchSideTab(tab) {
  st.sideTab = tab;
  st.inst.body.querySelectorAll('.code-side-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  st.el.filesPane.classList.toggle('hidden', tab !== 'files');
  st.el.gitPane.classList.toggle('hidden', tab !== 'git');
  if (tab === 'git') refreshGit();
}

/* ─── Pasta raiz ─── */
async function pickFolder() {
  const p = prompt('Caminho da pasta raiz:', st.root || OS.home || '/');
  if (!p) return;
  openFolder(p, true);
}

function openFolder(p, persist) {
  st.root = p;
  st.el.rootLabel.textContent = p;
  if (persist) {
    OS.prefs.codeRoot = p;
    OS.savePrefs();
  }
  refreshTree();
  refreshGit();
}

async function refreshTree() {
  if (!st.root) return renderEmptyTree();
  st.el.tree.innerHTML = '<div class="code-empty">Carregando…</div>';
  try {
    const r = await fetch('/api/files/tree?path=' + encodeURIComponent(st.root));
    const d = await r.json();
    if (d.error) {
      st.el.tree.innerHTML = `<div class="code-empty">Erro: ${esc(d.error)}</div>`;
      return;
    }
    st.el.tree.innerHTML = '';
    const frag = document.createDocumentFragment();
    renderTree(d.tree, frag, 0);
    st.el.tree.appendChild(frag);
  } catch (e) {
    st.el.tree.innerHTML = '<div class="code-empty">Erro de conexão</div>';
  }
}

function renderEmptyTree() {
  st.el.rootLabel.textContent = '(nenhuma pasta aberta)';
  st.el.tree.innerHTML = '<div class="code-empty">Clique em 📂 para abrir uma pasta<br>ou clone um repositório Git</div>';
}

function renderTree(nodes, parent, depth) {
  for (const n of nodes) {
    if (n.type === 'dir') {
      const row = document.createElement('div');
      row.className = 'code-tree-row dir';
      row.style.paddingLeft = (8 + depth * 12) + 'px';
      row.innerHTML = `<span class="code-tree-chev">${I.chev}</span><span class="code-tree-ico">${I.folder}</span><span class="code-tree-name">${esc(n.name)}</span>`;
      const kids = document.createElement('div');
      kids.className = 'code-tree-kids';
      kids.style.display = 'none';
      row.onclick = (e) => {
        e.stopPropagation();
        const open = kids.style.display !== 'none';
        kids.style.display = open ? 'none' : '';
        row.classList.toggle('open', !open);
      };
      parent.appendChild(row);
      parent.appendChild(kids);
      renderTree(n.children || [], kids, depth + 1);
    } else {
      const row = document.createElement('div');
      row.className = 'code-tree-row file';
      row.dataset.path = n.path;
      row.style.paddingLeft = (8 + depth * 12 + 14) + 'px';
      row.innerHTML = `<span class="code-tree-ico">${I.file}</span><span class="code-tree-name">${esc(n.name)}</span>`;
      row.onclick = () => openFile(n.path);
      parent.appendChild(row);
    }
  }
}

/* ─── Abas ─── */
function openFile(path) {
  const existing = st.tabs.findIndex(t => t.path === path);
  if (existing >= 0) return activate(existing);

  if (st.tabs.length >= 12) {
    if (!confirm('Muitas abas abertas. Fechar a primeira?')) return;
    closeTab(0);
  }

  st.tabs.push({
    path,
    name: path.split('/').pop(),
    content: '',
    original: '',
    dirty: false,
    loading: true
  });
  const idx = st.tabs.length - 1;
  activate(idx);
  loadTab(idx);
}

async function loadTab(idx) {
  const t = st.tabs[idx];
  if (!t) return;
  try {
    const r = await fetch('/api/files/read?path=' + encodeURIComponent(t.path));
    const d = await r.json();
    if (d.error) {
      t.content = `// Erro ao abrir: ${d.error}\n// Arquivo: ${t.path}\n`;
      t.original = '';
      t.dirty = false;
      t.loading = false;
      if (st.active === idx) renderEditor();
      return;
    }
    t.content = d.content;
    t.original = d.content;
    t.dirty = false;
    t.loading = false;
    if (st.active === idx) renderEditor();
    renderTabs();
  } catch (e) {
    t.content = `// Erro de conexão: ${e.message}`;
    t.loading = false;
    if (st.active === idx) renderEditor();
  }
}

function activate(idx) {
  st.active = idx;
  renderTabs();
  renderEditor();
  renderActiveInTree();
}

function renderTabs() {
  st.el.tabs.innerHTML = '';
  if (!st.tabs.length) return;
  st.tabs.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'code-tab' + (i === st.active ? ' active' : '') + (t.dirty ? ' dirty' : '');
    el.innerHTML = `<span class="code-tab-name">${esc(t.name)}</span><button class="code-tab-x" title="Fechar">×</button>`;
    el.onclick = (e) => {
      if (e.target.closest('.code-tab-x')) return;
      activate(i);
    };
    el.querySelector('.code-tab-x').onclick = (e) => { e.stopPropagation(); closeTab(i); };
    el.oncontextmenu = (e) => {
      e.preventDefault();
      const menu = [
        { label: 'Fechar', act: () => closeTab(i) },
        { label: 'Fechar outras', act: () => closeOthers(i) },
        { label: 'Fechar todas', act: () => closeAll() },
        { sep: true },
        { label: 'Copiar caminho', act: () => navigator.clipboard?.writeText(t.path) }
      ];
      showMiniMenu(e.clientX, e.clientY, menu);
    };
    st.el.tabs.appendChild(el);
  });
}

function closeTab(i) {
  const t = st.tabs[i];
  if (!t) return;
  if (t.dirty) {
    if (!confirm(`"${t.name}" tem alterações não salvas. Fechar mesmo?`)) return;
  }
  st.tabs.splice(i, 1);
  if (!st.tabs.length) { st.active = -1; renderTabs(); renderEditor(); return; }
  if (st.active >= st.tabs.length) st.active = st.tabs.length - 1;
  else if (st.active > i) st.active--;
  else if (st.active === i) st.active = Math.max(0, i - 1);
  renderTabs();
  renderEditor();
}

function closeOthers(keep) {
  st.tabs = [st.tabs[keep]];
  st.active = 0;
  renderTabs();
  renderEditor();
}
function closeAll() {
  if (st.tabs.some(t => t.dirty) && !confirm('Há arquivos não salvos. Fechar todas?')) return;
  st.tabs = [];
  st.active = -1;
  renderTabs();
  renderEditor();
}

/* ─── Editor ─── */
function renderEditor() {
  const t = st.tabs[st.active];
  const ta = st.el.text;
  if (!t) {
    ta.value = '';
    ta.disabled = true;
    updateGutter();
    st.el.status.textContent = 'Pronto';
    return;
  }
  ta.disabled = false;
  ta.value = t.content;
  updateGutter();
  updateCursorStatus();
  setTimeout(() => ta.focus(), 20);
}

function onInput() {
  const t = st.tabs[st.active];
  if (!t) return;
  t.content = st.el.text.value;
  const dirty = t.content !== t.original;
  if (dirty !== t.dirty) {
    t.dirty = dirty;
    renderTabs();
  }
  updateGutter();
  updateCursorStatus();
}

function onKey(e) {
  const ta = st.el.text;
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ta.selectionStart, en = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
    ta.selectionStart = ta.selectionEnd = s + 2;
    onInput();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const s = ta.selectionStart;
    const before = ta.value.slice(0, s);
    const lastLine = before.split('\n').pop();
    let indent = (lastLine.match(/^(\s*)/) || ['', ''])[1];
    if (/[{\[(:]\s*$/.test(lastLine)) indent += '  ';
    const ins = '\n' + indent;
    ta.value = ta.value.slice(0, s) + ins + ta.value.slice(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = s + ins.length;
    onInput();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveActive();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
    e.preventDefault();
    closeTab(st.active);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    quickOpen();
    return;
  }
}

function updateGutter() {
  const lines = st.el.text.value.split('\n').length;
  let s = '';
  for (let i = 1; i <= lines; i++) s += i + '\n';
  st.el.gutter.textContent = s;
  syncGutterScroll();
}

function syncGutterScroll() {
  st.el.gutter.style.transform = `translateY(${-st.el.text.scrollTop}px)`;
}

function updateCursorStatus() {
  const t = st.tabs[st.active];
  if (!t) return;
  const ta = st.el.text;
  const pos = ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  const lines = ta.value.split('\n').length;
  const chars = ta.value.length;
  const parts = [`Ln ${line}, Col ${col}`, `${lines} linhas`, `${chars} chars`];
  if (t.dirty) parts.push('● não salvo');
  st.el.status.textContent = parts.join(' · ');
}

function renderActiveInTree() {
  const t = st.tabs[st.active];
  st.el.tree.querySelectorAll('.code-tree-row.file.active').forEach(el => el.classList.remove('active'));
  if (!t) return;
  const row = st.el.tree.querySelector(`.code-tree-row.file[data-path="${CSS.escape(t.path)}"]`);
  if (row) row.classList.add('active');
}

/* ─── Ações de arquivo ─── */
async function saveActive() {
  const t = st.tabs[st.active];
  if (!t) return;
  if (!t.path) return saveAs();

  try {
    const r = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: t.path, content: t.content })
    });
    const d = await r.json();
    if (d.ok) {
      t.original = t.content;
      t.dirty = false;
      renderTabs();
      updateCursorStatus();
      flashStatus('Salvo ✓');
    } else {
      alert('Erro: ' + d.error);
    }
  } catch (e) { alert('Erro ao salvar: ' + e.message); }
}

async function saveAs() {
  const t = st.tabs[st.active];
  if (!t) return;
  const p = prompt('Salvar como (caminho completo):', (st.root || OS.home) + '/novo.txt');
  if (!p) return;
  t.path = p;
  t.name = p.split('/').pop();
  await saveActive();
  refreshTree();
}

async function createFile() {
  const base = st.root || OS.home;
  const p = prompt('Nome/caminho do novo arquivo:', base + '/novo.txt');
  if (!p) return;
  try {
    await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: p, content: '' })
    });
    await refreshTree();
    openFile(p);
  } catch (e) { alert('Erro: ' + e.message); }
}

/* ─── Importar .zip ─── */
function importZip() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.zip,.tar,.tar.gz,.tgz';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      alert('Arquivo grande demais (limite ~80MB). Use o terminal: unzip nome.zip');
      return;
    }
    const dest = prompt('Extrair para qual pasta?', st.root || OS.home);
    if (!dest) return;
    st.el.status.textContent = 'Enviando…';
    try {
      const buf = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      const r = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dest, name: file.name, data: base64 })
      });
      const d = await r.json();
      if (d.ok) {
        flashStatus('Importado ✓');
        refreshTree();
      } else {
        alert('Erro: ' + d.error);
      }
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };
  input.click();
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let out = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(out);
}

/* ─── Git panel ─── */
async function refreshGit() {
  if (!st.root) {
    st.el.git.innerHTML = '<div class="code-empty">Abra uma pasta primeiro</div>';
    st.el.branch.textContent = '—';
    return;
  }
  st.el.git.innerHTML = '<div class="code-empty">Consultando…</div>';
  try {
    const r = await fetch('/api/git/status?path=' + encodeURIComponent(st.root));
    const d = await r.json();
    if (d.error) {
      st.el.branch.textContent = '—';
      st.el.git.innerHTML = `
        <div class="code-empty">
          Não é um repositório Git.<br><br>
          <button class="code-btn-block" id="cGitInit">Inicializar repositório</button><br>
          <button class="code-btn-block" id="cGitClone">Clonar do GitHub</button>
        </div>`;
      const init = st.el.git.querySelector('#cGitInit');
      const clone = st.el.git.querySelector('#cGitClone');
      if (init)  init.onclick  = gitInit;
      if (clone) clone.onclick = gitClone;
      return;
    }
    st.el.branch.textContent = d.branch || '—';
    renderGitStatus(d);
  } catch (e) {
    st.el.git.innerHTML = '<div class="code-empty">Erro de conexão</div>';
  }
}

function renderGitStatus(d) {
  let html = '';
  if (d.ahead || d.behind) {
    html += `<div class="code-git-sync">`;
    if (d.ahead)  html += `<span class="code-badge blue">↑ ${d.ahead}</span>`;
    if (d.behind) html += `<span class="code-badge yellow">↓ ${d.behind}</span>`;
    html += `</div>`;
  }

  html += `<div class="code-git-files">`;
  if (!d.files.length) {
    html += `<div class="code-empty" style="padding:20px 12px">Nada para commitar</div>`;
  } else {
    for (const f of d.files) {
      const s = f.status;
      const cls = s.includes('??') ? 'new' : s.includes('D') ? 'del' : 'mod';
      const label = s.includes('??') ? 'N' : s.includes('D') ? 'D' : s.includes('A') ? 'A' : 'M';
      html += `<div class="code-git-file" data-file="${escAttr(f.file)}">
        <span class="code-git-status ${cls}">${label}</span>
        <span class="code-git-name">${esc(f.file)}</span>
      </div>`;
    }
  }
  html += `</div>`;

  html += `
    <div class="code-git-actions">
      <div class="code-git-staging">
        <button class="code-btn-sm" id="cGitAddAll">Adicionar tudo</button>
        <button class="code-btn-sm" id="cGitUnstageAll">Remover tudo</button>
      </div>
      <textarea class="code-git-msg" id="cGitMsg" rows="3"
        placeholder="Mensagem do commit…"></textarea>
      <div class="code-git-row">
        <button class="code-btn-main" id="cGitCommit">Commit</button>
        <button class="code-btn-main accent" id="cGitCommitPush">Commit + Push</button>
      </div>
    </div>`;

  st.el.git.innerHTML = html;

  st.el.git.querySelector('#cGitAddAll').onclick = async () => {
    await gitApi('add', { path: st.root, files: ['.'] });
    refreshGit();
  };
  st.el.git.querySelector('#cGitUnstageAll').onclick = async () => {
    await gitApi('unstage', { path: st.root, files: ['.'] });
    refreshGit();
  };
  st.el.git.querySelector('#cGitCommit').onclick    = () => commitOnly();
  st.el.git.querySelector('#cGitCommitPush').onclick = () => commitAndPush();
}

async function commitOnly() {
  const msg = st.el.git.querySelector('#cGitMsg').value.trim();
  if (!msg) return alert('Digite uma mensagem de commit');
  const stageAll = confirm('Adicionar todas as alterações antes de commitar?\n\nOK = adicionar tudo\nCancelar = commitar só o que já está staged');
  if (stageAll) {
    const a = await gitApi('add', { path: st.root, files: ['.'] });
    if (a.error) return alert('Erro no add: ' + a.error);
  }
  const r = await gitApi('commit', { path: st.root, message: msg });
  if (r.error) return alert('Erro: ' + r.error);
  flashStatus('Commit feito ✓');
  refreshGit();
}

async function commitAndPush() {
  const msg = st.el.git.querySelector('#cGitMsg').value.trim();
  if (!msg) return alert('Digite uma mensagem de commit');
  await gitApi('add', { path: st.root, files: ['.'] });
  const c = await gitApi('commit', { path: st.root, message: msg });
  if (c.error) return alert('Erro no commit: ' + c.error);
  const p = await gitApi('push', { path: st.root });
  if (p.error) return alert('Commit ok, mas push falhou:\n' + p.error);
  flashStatus('Push feito ✓');
  refreshGit();
}

async function gitInit() {
  const r = await gitApi('init', { path: st.root });
  if (r.error) return alert('Erro: ' + r.error);
  const url = prompt('URL do repositório remoto (opcional, ex: https://github.com/user/repo.git):');
  if (url) await gitApi('remote', { path: st.root, name: 'origin', url });
  refreshGit();
}

async function gitClone() {
  const url = prompt('URL do repositório:');
  if (!url) return;
  const dest = prompt('Clonar em qual pasta pai?', OS.home || '/');
  if (!dest) return;
  const name = url.split('/').pop().replace(/\.git$/, '');
  st.el.status.textContent = 'Clonando…';
  const r = await gitApi('clone', { url, dest, name });
  if (r.error) return alert('Erro no clone: ' + r.error);
  openFolder(r.path, true);
}

async function doPush() {
  if (!st.root) return;
  const r = await gitApi('push', { path: st.root });
  if (r.error) {
    if (r.error.includes('no upstream') || r.error.includes('has no upstream')) {
      if (confirm('Repositório sem upstream configurado. Fazer push com -u origin <branch>?')) {
        const r2 = await gitApi('push', { path: st.root, setUpstream: true, remote: 'origin' });
        if (r2.error) return alert('Erro: ' + r2.error);
        flashStatus('Push feito ✓');
        refreshGit();
        return;
      }
      return;
    }
    return alert('Erro: ' + r.error);
  }
  flashStatus('Push feito ✓');
  refreshGit();
}

async function doPull() {
  if (!st.root) return;
  const r = await gitApi('pull', { path: st.root });
  if (r.error) return alert('Erro: ' + r.error);
  flashStatus('Pull feito ✓');
  refreshGit();
  refreshTree();
}

async function gitApi(action, body) {
  try {
    const r = await fetch('/api/git/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await r.json();
  } catch (e) { return { error: e.message }; }
}

/* ─── Config Git ─── */
async function openGitConfig() {
  WM.open('settings');
  setTimeout(() => {
    if (window.Settings && window.Settings.showGit) window.Settings.showGit();
  }, 150);
}

/* ─── Quick open (Ctrl+P) ─── */
function quickOpen() {
  if (!st.root) return;
  const q = prompt('Filtrar arquivos por nome:');
  if (!q) return;
  const matches = [];
  const lower = q.toLowerCase();
  st.el.tree.querySelectorAll('.code-tree-row.file').forEach(el => {
    const name = el.querySelector('.code-tree-name').textContent;
    if (name.toLowerCase().includes(lower)) matches.push(el.dataset.path);
  });
  if (!matches.length) return alert('Nenhum arquivo encontrado');
  if (matches.length === 1) return openFile(matches[0]);
  const pick = prompt(`Encontrados ${matches.length}:\n\n` + matches.slice(0, 10).map((p, i) => `${i + 1}. ${p}`).join('\n') + '\n\nNúmero:', '1');
  const n = parseInt(pick, 10);
  if (n >= 1 && n <= matches.length) openFile(matches[n - 1]);
}

/* ─── Menu pequeno (para tabs e futuros) ─── */
let miniMenu = null;
function showMiniMenu(x, y, items) {
  closeMiniMenu();
  miniMenu = document.createElement('div');
  miniMenu.className = 'context-menu';
  miniMenu.innerHTML = items.map((a, i) =>
    a.sep ? '<div class="context-menu-sep"></div>'
          : `<div class="context-menu-item${a.danger ? ' danger' : ''}" data-i="${i}"><span>${a.label}</span></div>`
  ).join('');
  miniMenu.querySelectorAll('.context-menu-item').forEach(el => {
    el.onclick = () => { const it = items[+el.dataset.i]; closeMiniMenu(); it.act(); };
  });
  document.body.appendChild(miniMenu);
  const r = miniMenu.getBoundingClientRect();
  miniMenu.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
  miniMenu.style.top  = Math.min(y, innerHeight - r.height - 8) + 'px';
  setTimeout(() => document.addEventListener('click', closeMiniMenu, { once: true }), 0);
}
function closeMiniMenu() { if (miniMenu) { miniMenu.remove(); miniMenu = null; } }

/* ─── Helpers ─── */
function flashStatus(msg) {
  st.el.status.textContent = msg;
  setTimeout(updateCursorStatus, 1500);
}
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}
function escAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

/* ─── API pública ─── */
window.Code = {
  openFile: (p) => { openFile(p); },
  openFolder: (p) => { openFolder(p, true); }
};
})();
