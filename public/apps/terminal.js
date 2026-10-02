/*══ Terminal App ══*/
(function(){
'use strict';
var cwd='~',hist=[],hi=-1,out,inp,ps;

WM.register('terminal',{
  title:'Terminal',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  width:720,height:450,
  onOpen:init,onClose:function(){out=null}
});

function init(body){
  body.innerHTML='<div class="term"><div class="term-out" id="to"></div><div class="term-row"><span class="term-ps1" id="tp">~ $</span><input class="term-in" id="ti" type="text" spellcheck="false" autocomplete="off" autocapitalize="off"></div></div>';
  out=body.querySelector('#to');inp=body.querySelector('#ti');ps=body.querySelector('#tp');
  add('Bem-vindo ao FlowOS Terminal','sys');
  add('Use "help" para ver os atalhos.\n','sys');
  inp.addEventListener('keydown',onKey);
  body.closest('.win').addEventListener('click',function(){if(inp)inp.focus()});
  setTimeout(function(){inp.focus()},120);
}

function onKey(e){
  if(e.key==='Enter'){var c=inp.value.trim();inp.value='';if(!c)return;
    hist.push(c);hi=hist.length;run(c)}
  else if(e.key==='ArrowUp'){e.preventDefault();if(hi>0){hi--;inp.value=hist[hi]}}
  else if(e.key==='ArrowDown'){e.preventDefault();if(hi<hist.length-1){hi++;inp.value=hist[hi]}else{hi=hist.length;inp.value=''}}
  else if(e.key==='l'&&e.ctrlKey){e.preventDefault();if(out)out.innerHTML=''}
}

function short(p){var h=OS.home;return h&&p.indexOf(h)===0?'~'+p.substring(h.length):p}
function setPs(p){cwd=p;if(ps)ps.textContent=short(cwd)+' $'}

async function run(cmd){
  if(!out)return;
  if(cmd==='clear'){out.innerHTML='';return}
  if(cmd==='help'){add(short(cwd)+' $ help','cmd');
    add('Atalhos: clear, Ctrl+L (limpar) · ↑/↓ (histórico) · exit (fechar)\nTodos os outros comandos são executados no Termux.\n');return}
  if(cmd==='exit'){WM.close('terminal');return}
  add(short(cwd)+' $ '+cmd,'cmd');
  inp.disabled=true;
  try{
    var r=await fetch('/api/terminal/exec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:cmd,cwd:cwd})});
    var d=await r.json();
    if(d.output)add(d.output);
    if(d.cwd){if(!OS.home)OS.home=d.cwd;setPs(d.cwd)}
  }catch(_){add('Erro de conexão com o backend.','err')}
  inp.disabled=false;inp.focus();
}

function add(t,c){if(!out)return;var s=document.createElement('span');if(c)s.className='term-'+c;s.textContent=t+(c==='cmd'?'\n':'');out.appendChild(s);out.scrollTop=out.scrollHeight}
})();
