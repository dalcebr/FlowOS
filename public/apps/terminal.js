(function(){
'use strict';
const $ = window.$;

WM.register('terminal', {
  title: 'Terminal',
  width: 760, height: 480,
  onOpen: init,
  onClose: cleanup
});

let state = null;

function init(inst) {
  inst.body.innerHTML = `
    <div class="terminal">
      <div class="terminal-out" id="tOut"></div>
      <div class="terminal-prompt">
        <span class="terminal-ps1" id="tPs1">$</span>
        <input class="terminal-input" id="tIn" type="text" spellcheck="false"
               autocomplete="off" autocapitalize="off" autocorrect="off">
      </div>
    </div>`;

  const out = inst.body.querySelector('#tOut');
  const inp = inst.body.querySelector('#tIn');
  const ps = inst.body.querySelector('#tPs1');

  state = { out, inp, ps, cwd: OS.home || null, history: [], histIdx: 0, busy: false };

  write('⚡ FlowOS Terminal\nDigite "help" para comandos disponíveis.\n\n', 'sys');

  inp.addEventListener('keydown', onKey);
  inst.el.addEventListener('click', (e) => {
    if (e.target.closest('input')) return;
    if (window.getSelection().toString()) return;
    inp.focus();
  });
  setTimeout(() => inp.focus(), 100);
  updatePrompt();
}

function cleanup() { state = null; }

function onKey(e) {
  if (!state) return;
  const { inp, history } = state;

  if (e.key === 'Enter') {
    const cmd = inp.value;
    inp.value = '';
    if (cmd.trim()) { history.push(cmd); state.histIdx = history.length; }
    run(cmd);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (state.histIdx > 0) {
      state.histIdx--;
      inp.value = history[state.histIdx] || '';
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (state.histIdx < history.length - 1) {
      state.histIdx++;
      inp.value = history[state.histIdx] || '';
    } else {
      state.histIdx = history.length;
      inp.value = '';
    }
  } else if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) {
    inp.value = '';
    write('^C\n', 'err');
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault();
    state.out.innerHTML = '';
  }
}

async function run(cmd) {
  if (!state) return;
  const { out, inp } = state;

  write(promptText() + ' ' + cmd + '\n', 'cmd');

  if (!cmd.trim()) return;

  if (cmd.trim() === 'clear' || cmd.trim() === 'cls') {
    out.innerHTML = '';
    return;
  }

  state.busy = true;
  inp.disabled = true;

  try {
    const r = await fetch('/api/terminal/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd, cwd: state.cwd })
    });
    const d = await r.json();
    if (d.output) {
      write(d.output);
      if (!d.output.endsWith('\n')) write('\n');
    }
    if (d.cwd) state.cwd = d.cwd;
  } catch (e) {
    write('Erro de conexão: ' + e.message + '\n', 'err');
  }

  state.busy = false;
  inp.disabled = false;
  inp.focus();
  updatePrompt();
}

function promptText() {
  const p = (state && state.cwd) || OS.home || '~';
  if (OS.home && p.startsWith(OS.home)) return '~' + p.slice(OS.home.length);
  return p;
}

function updatePrompt() {
  if (!state || !state.ps) return;
  state.ps.textContent = promptText() + ' $';
}

function write(text, cls) {
  if (!state || !state.out) return;
  const span = document.createElement('span');
  if (cls) span.className = 'term-' + cls;
  span.textContent = text;
  state.out.appendChild(span);
  state.out.scrollTop = state.out.scrollHeight;
}

window.Terminal = {
  write,
  run: (cmd) => run(cmd),
  cd: (p) => { if (state) { state.cwd = p; updatePrompt(); } }
};
})();
