(function(){
'use strict';

WM.register('files', {
  title: 'Arquivos',
  width: 800, height: 520,
  onOpen: init,
  onClose: cleanup
});

const I = {
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
};

const EXT_GROUPS = {
  code: new Set('js jsx ts tsx mjs cjs py rb go rs java c cpp h hpp cs php swift kt sh bash zsh fish ps1 html htm css scss less sass vue svelte lua pl r dart elm clj ex exs sql'.split(' ')),
  image: new Set('png jpg jpeg gif webp svg bmp ico tiff'.split(' ')),
  archive: new Set('zip tar gz bz2 xz 7z rar tgz'.split(' '))
};

let st = null;

function init(inst) {
  inst.body.innerHTML = `
    <div class="fm">
      <div class="fm-sidebar">
        <div class="fm-sidebar-label">Favoritos</div>
        <div id="fmFavs"></div>
      </div>
      <div class="fm-main">
        <div class="fm-toolbar">
          <button class="fm-btn" id="fmBack" title="Voltar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <button class="fm-btn" id="fmUp" title="Subir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>
          <button class="fm-btn" id="fmReload" title="Recarregar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <div class="fm-path" id="fmPath">—</div>
          <button class="fm-btn" id="fmNew" title="Nova pasta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div class="fm-list" id="fmList"></div>
        <div class="fm-status" id="fmStatus">—</div>
      </div>
    </div>`;

  st = {
    inst,
    cwd: '',
    items: [],
    backStack: [],
    list: inst.body.querySelector('#fmList'),
    path: inst.body.querySelector('#fmPath'),
    status: inst.body.querySelector('#fmStatus')
  };

  inst.body.querySelector('#fmBack').onclick = goBack;
  inst.body.querySelector('#fmUp').onclick = goUp;
  inst.body.querySelector('#fmReload').onclick = () => load(st.cwd, false);
  inst.body.querySelector('#fmNew').onclick = newFolder;

  buildSidebar(inst.body.querySelector('#fmFavs'));
  load('', true);
}

function cleanup() { st = null; hideCtx(); }

function buildSidebar(el) {
  const places = [
    { name: 'Início', path: '', icon: I.home },
    { name: 'Desktop', path: '/Desktop', icon: I.folder },
    { name: 'Documentos', path: '/Documents', icon: I.folder },
    { name: 'Downloads', path: '/Downloads', icon: I.folder },
    { name: 'Pictures', path: '/Pictures', icon: I.folder }
  ];
  el.innerHTML = '';
  places.forEach(p => {
    const item = document.createElement('div');
    item.className = 'fm-sidebar-item';
    item.innerHTML = p.icon + '<span>' + p.name + '</span>';
    item.onclick = () => {
      el.querySelectorAll('.fm-sidebar-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      const full = p.path ? OS.home + p.path : '';
      load(full, true);
    };
    el.appendChild(item);
  });
}

async function load(p, push) {
  if (!st) return;
  st.list.innerHTML = '<div class="fm-empty">Carregando…</div>';
  try {
    const url = '/api/files/list' + (p ? '?path=' + encodeURIComponent(p) : '');
    const r = await fetch(url);
    const d = await r.json();
    if (d.error) {
      st.list.innerHTML = `<div class="fm-empty">Erro: ${esc(d.error)}</div>`;
      return;
    }
    if (push && st.cwd && st.cwd !== d.path) st.backStack.push(st.cwd);
    st.cwd = d.path;
    st.items = d.items;
    st.path.textContent = d.path;
    st.status.textContent = `${d.items.length} ${d.items.length === 1 ? 'item' : 'itens'}`;
    render();
  } catch (e) {
    st.list.innerHTML = '<div class="fm-empty">Erro de conexão</div>';
  }
}

function render() {
  if (!st) return;
  if (!st.items.length) {
    st.list.innerHTML = '<div class="fm-empty">Pasta vazia</div>';
    return;
  }
  const html = st.items.map((it, i) => {
    const ico = iconFor(it);
    return `<div class="fm-item" data-i="${i}">
      <div class="fm-item-icon ${ico.cls}">${ico.svg}</div>
      <div class="fm-item-name">${esc(it.name)}</div>
      <div class="fm-item-size">${it.type === 'dir' ? '' : fmtSize(it.size)}</div>
    </div>`;
  }).join('');
  st.list.innerHTML = html;

  st.list.querySelectorAll('.fm-item').forEach(el => {
    const it = st.items[+el.dataset.i];
    el.addEventListener('click', () => {
      st.list.querySelectorAll('.fm-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    });
    el.addEventListener('dblclick', () => openItem(it));
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      st.list.querySelectorAll('.fm-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      showCtx(e.clientX, e.clientY, it);
    });
  });
}

function iconFor(it) {
  if (it.type === 'dir' || it.type === 'link') return { svg: I.folder, cls: 'folder' };
  const e = it.ext;
  if (EXT_GROUPS.code.has(e)) return { svg: I.code, cls: 'code' };
  if (EXT_GROUPS.image.has(e)) return { svg: I.image, cls: 'image' };
  if (EXT_GROUPS.archive.has(e)) return { svg: I.archive, cls: 'archive' };
  return { svg: I.file, cls: 'file' };
}

function openItem(it) {
  if (!st) return;
  if (it.type === 'dir') {
    const next = st.cwd.endsWith('/') ? st.cwd + it.name : st.cwd + '/' + it.name;
    load(next, true);
  } else {
    openInEditor(st.cwd + '/' + it.name);
  }
}

function openInEditor(path) {
  WM.open('editor');
  setTimeout(() => {
    if (window.Editor && window.Editor.openFile) window.Editor.openFile(path);
  }, 80);
}

/* Context menu */
let ctxMenu = null;
function showCtx(x, y, it) {
  hideCtx();
  const fp = st.cwd + '/' + it.name;
  const items = [
    { label: it.type === 'dir' ? 'Abrir' : 'Editar', ic: '▶', act: () => openItem(it) },
    { label: 'Renomear', ic: '✎', act: () => rename(it) },
    { label: 'Copiar caminho', ic: '⌘', act: () => navigator.clipboard.writeText(fp) },
    { sep: true },
    { label: 'Excluir', ic: '×', danger: true, act: () => del(it) }
  ];

  ctxMenu = document.createElement('div');
  ctxMenu.className = 'context-menu';
  ctxMenu.innerHTML = items.map((a, i) =>
    a.sep ? '<div class="context-menu-sep"></div>'
          : `<div class="context-menu-item${a.danger ? ' danger' : ''}" data-i="${i}">${a.ic} <span>${a.label}</span></div>`
  ).join('');

  ctxMenu.querySelectorAll('.context-menu-item').forEach(el => {
    el.onclick = () => { hideCtx(); items[+el.dataset.i].act(); };
  });

  document.body.appendChild(ctxMenu);
  const r = ctxMenu.getBoundingClientRect();
  ctxMenu.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
  ctxMenu.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  setTimeout(() => document.addEventListener('click', hideCtx, { once: true }), 0);
}

function hideCtx() {
  if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; }
}

async function rename(it) {
  const name = prompt('Novo nome:', it.name);
  if (!name || name === it.name) return;
  await api('/api/files/rename', { from: st.cwd + '/' + it.name, to: st.cwd + '/' + name });
  load(st.cwd, false);
}

async function del(it) {
  if (!confirm(`Excluir "${it.name}"?`)) return;
  await api('/api/files/delete', { path: st.cwd + '/' + it.name });
  load(st.cwd, false);
}

async function newFolder() {
  const name = prompt('Nome da nova pasta:');
  if (!name) return;
  await api('/api/files/mkdir', { path: st.cwd + '/' + name });
  load(st.cwd, false);
}

function goBack() {
  if (!st || !st.backStack.length) return;
  const prev = st.backStack.pop();
  load(prev, false);
}

function goUp() {
  if (!st) return;
  const parts = st.cwd.split('/').filter(Boolean);
  if (parts.length <= 1) { load('', true); return; }
  parts.pop();
  load('/' + parts.join('/'), true);
}

async function api(url, body) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return r.json();
  } catch { return { error: 'network' }; }
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' K';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' M';
  return (b / 1073741824).toFixed(2) + ' G';
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

window.Files = {
  open: (path) => {
    WM.open('files');
    setTimeout(() => load(path, true), 120);
  }
};
})();
