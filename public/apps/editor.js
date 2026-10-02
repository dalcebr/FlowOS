(function(){
'use strict';

WM.register('editor', {
  title: 'Editor',
  width: 820, height: 560,
  onOpen: init,
  onClose: cleanup
});

let st = null;

function init(inst) {
  inst.body.innerHTML = `
    <div class="editor">
      <div class="editor-toolbar">
        <div class="editor-name" id="edName">Sem título</div>
        <div class="editor-actions">
          <button class="editor-btn" id="edOpen">Abrir</button>
          <button class="editor-btn" id="edNew">Novo</button>
          <button class="editor-btn" id="edSaveAs">Salvar como</button>
          <button class="editor-btn primary" id="edSave">Salvar</button>
        </div>
      </div>
      <div class="editor-wrapper">
        <div class="editor-gutter" id="edGutter">1</div>
        <textarea class="editor-textarea" id="edText" spellcheck="false"
          autocapitalize="off" autocorrect="off" wrap="off"
          placeholder="// Digite seu código aqui ou abra um arquivo..."></textarea>
      </div>
      <div class="editor-status" id="edStatus">—</div>
    </div>`;

  const q = s => inst.body.querySelector(s);
  st = {
    inst,
    textarea: q('#edText'),
    gutter: q('#edGutter'),
    name: q('#edName'),
    status: q('#edStatus'),
    path: null,
    modified: false
  };

  const ta = st.textarea;
  ta.addEventListener('input', () => { st.modified = true; refreshGutter(); refreshStatus(); });
  ta.addEventListener('scroll', () => { st.gutter.scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', onKey);
  ta.addEventListener('click', refreshStatus);
  ta.addEventListener('keyup', refreshStatus);
  ta.addEventListener('blur', refreshStatus);

  q('#edSave').onclick = save;
  q('#edSaveAs').onclick = saveAs;
  q('#edNew').onclick = newFile;
  q('#edOpen').onclick = () => {
    const p = prompt('Caminho do arquivo:');
    if (p) openFile(p);
  };

  refreshGutter();
  refreshStatus();
  setTimeout(() => ta.focus(), 100);
}

function cleanup() { st = null; }

function onKey(e) {
  const ta = st.textarea;

  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ta.selectionStart, en = ta.selectionEnd;
    if (s === en) {
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
    } else {
      const val = ta.value;
      const lineStart = val.lastIndexOf('\n', s - 1) + 1;
      let lineEnd = val.indexOf('\n', en);
      if (lineEnd === -1) lineEnd = val.length;
      const block = val.slice(lineStart, lineEnd);
      const shifted = block.split('\n').map(l => '  ' + l).join('\n');
      ta.value = val.slice(0, lineStart) + shifted + val.slice(lineEnd);
      ta.selectionStart = s + 2;
      ta.selectionEnd = en + (shifted.length - block.length);
    }
    st.modified = true;
    refreshGutter();
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
    st.modified = true;
    refreshGutter();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
}

function refreshGutter() {
  if (!st) return;
  const lines = st.textarea.value.split('\n').length;
  let s = '';
  for (let i = 1; i <= lines; i++) s += i + '\n';
  st.gutter.textContent = s;
}

function refreshStatus() {
  if (!st) return;
  const ta = st.textarea;
  const pos = ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  const lines = ta.value.split('\n').length;
  const len = ta.value.length;
  const mod = st.modified ? ' · Modificado' : '';
  st.status.textContent = `Ln ${line}, Col ${col} · ${lines} linhas · ${len} caracteres${mod}`;
}

async function openFile(path) {
  if (!st) return;
  try {
    const r = await fetch('/api/files/read?path=' + encodeURIComponent(path));
    const d = await r.json();
    if (d.error) {
      alert('Não é possível abrir: ' + d.error);
      return;
    }
    st.textarea.value = d.content;
    st.path = d.path;
    st.name.textContent = d.name;
    st.modified = false;
    refreshGutter();
    refreshStatus();
    st.textarea.focus();
  } catch (e) {
    alert('Erro ao abrir: ' + e.message);
  }
}

function newFile() {
  if (!st) return;
  if (st.modified && !confirm('Descartar alterações?')) return;
  st.textarea.value = '';
  st.path = null;
  st.name.textContent = 'Sem título';
  st.modified = false;
  refreshGutter();
  refreshStatus();
  st.textarea.focus();
}

async function save() {
  if (!st) return;
  if (!st.path) return saveAs();
  await saveTo(st.path);
}

async function saveAs() {
  if (!st) return;
  const p = prompt('Salvar como:', st.path || (OS.home + '/novo.txt'));
  if (!p) return;
  await saveTo(p);
}

async function saveTo(path) {
  try {
    const r = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content: st.textarea.value })
    });
    const d = await r.json();
    if (d.ok) {
      st.path = path;
      st.name.textContent = path.split('/').pop();
      st.modified = false;
      refreshStatus();
    } else {
      alert('Erro: ' + d.error);
    }
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
}

window.Editor = {
  openFile: (p) => { if (st) openFile(p); }
};
})();
