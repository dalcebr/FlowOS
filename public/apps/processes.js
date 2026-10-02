(function(){
'use strict';

WM.register('processes', {
  title: 'Processos',
  width: 780, height: 500,
  onOpen: init,
  onClose: cleanup
});

let st = null;

function init(inst) {
  inst.body.innerHTML = `
    <div class="proc">
      <div class="proc-toolbar">
        <input class="proc-search" id="procSearch" placeholder="Filtrar processos…">
        <button class="fm-btn" id="procReload" title="Recarregar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>
      <div class="proc-list" id="procList">
        <div class="proc-row header">
          <div class="proc-cell">PID</div>
          <div class="proc-cell">CPU%</div>
          <div class="proc-cell proc-mem">MEM%</div>
          <div class="proc-cell">Nome</div>
        </div>
      </div>
    </div>`;

  st = {
    list: inst.body.querySelector('#procList'),
    search: inst.body.querySelector('#procSearch'),
    items: []
  };

  inst.body.querySelector('#procReload').onclick = refresh;
  st.search.addEventListener('input', render);
  refresh();
}

function cleanup() { st = null; }

async function refresh() {
  if (!st) return;
  try {
    const r = await fetch('/api/processes');
    const d = await r.json();
    st.items = d.processes || [];
    render();
  } catch {}
}

function render() {
  if (!st) return;
  const filter = st.search.value.toLowerCase();
  const items = st.items.filter(p =>
    !filter ||
    p.name.toLowerCase().includes(filter) ||
    (p.cmd || '').toLowerCase().includes(filter) ||
    String(p.pid).includes(filter)
  );

  const rows = items.map(p => `
    <div class="proc-row" data-pid="${p.pid}">
      <div class="proc-cell">${p.pid}</div>
      <div class="proc-cell">${p.cpu.toFixed(1)}</div>
      <div class="proc-cell proc-mem">${p.mem.toFixed(1)}</div>
      <div class="proc-cell">
        <div class="proc-name">${esc(p.name)}</div>
        <div class="proc-cmd">${esc(p.cmd || '')}</div>
      </div>
    </div>
  `).join('');

  const header = st.list.querySelector('.proc-row.header');
  st.list.innerHTML = '';
  if (header) st.list.appendChild(header);
  const temp = document.createElement('div');
  temp.innerHTML = rows;
  while (temp.firstChild) st.list.appendChild(temp.firstChild);

  st.list.querySelectorAll('.proc-row[data-pid]').forEach(el => {
    el.onclick = () => killProcess(+el.dataset.pid, el.querySelector('.proc-name').textContent);
  });
}

async function killProcess(pid, name) {
  if (!confirm(`Matar processo ${pid} (${name})?`)) return;
  try {
    const r = await fetch('/api/processes/kill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid, signal: 'TERM' })
    });
    const d = await r.json();
    if (d.error) alert('Erro: ' + d.error);
    setTimeout(refresh, 300);
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
})();
