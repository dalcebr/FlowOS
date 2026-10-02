/*══ File Manager App ══*/
(function(){
'use strict';
var cur='',items=[],phist=[],wrap,list,pathEl,stat,ctx=null;

var ID='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
var IF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

WM.register('files',{
  title:'Arquivos',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  width:700,height:480,onOpen:init,onClose:cleanup
});

function init(body){
  body.innerHTML=
    '<div class="fm"><div class="fm-bar">'+
      '<button class="fm-btn" id="fb" title="Voltar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>'+
      '<button class="fm-btn" id="fu" title="Pasta pai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></button>'+
      '<button class="fm-btn" id="fr" title="Atualizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>'+
      '<div class="fm-path" id="fp"></div>'+
      '<button class="fm-btn" id="fn" title="Nova pasta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
    '</div><div class="fm-body" id="fl"></div><div class="fm-stat" id="fs"></div></div>';
  wrap=body.querySelector('.fm');list=body.querySelector('#fl');pathEl=body.querySelector('#fp');stat=body.querySelector('#fs');
  body.querySelector('#fb').onclick=goBack;
  body.querySelector('#fu').onclick=goUp;
  body.querySelector('#fr').onclick=function(){load(cur)};
  body.querySelector('#fn').onclick=mkDir;
  document.addEventListener('click',hideCtx);
  load('');
}
function cleanup(){document.removeEventListener('click',hideCtx);if(ctx){ctx.remove();ctx=null}wrap=list=pathEl=stat=null}

async function load(p){
  if(!list)return;list.innerHTML='<div class="fm-empty">Carregando...</div>';
  try{
    var r=await fetch('/api/files/list'+(p?'?path='+encodeURIComponent(p):''));
    var d=await r.json();if(d.error){list.innerHTML='<div class="fm-empty">'+esc(d.error)+'</div>';return}
    if(cur&&cur!==d.path)phist.push(cur);
    cur=d.path;items=d.items;pathEl.textContent=cur;stat.textContent=items.length+' itens';
    render();
  }catch(_){list.innerHTML='<div class="fm-empty">Erro de conexão</div>'}
}

function render(){
  if(!list)return;
  if(!items.length){list.innerHTML='<div class="fm-empty">Pasta vazia</div>';return}
  var h='';for(var i=0;i<items.length;i++){var it=items[i];
    h+='<div class="fm-row" data-i="'+i+'"><div class="fm-ico '+(it.type==='dir'?'dir':'file')+'">'+(it.type==='dir'?ID:IF)+'</div><span class="fm-name">'+esc(it.name)+'</span><span class="fm-meta">'+(it.type==='dir'?'':fmtSz(it.size))+'</span></div>'}
  list.innerHTML=h;
  list.onclick=function(e){var r=e.target.closest('.fm-row');if(!r)return;var it=items[+r.dataset.i];
    if(it.type==='dir')load(cur+'/'+it.name);else viewFile(it)};
  list.oncontextmenu=function(e){e.preventDefault();var r=e.target.closest('.fm-row');if(!r)return;showCtx(e.clientX,e.clientY,items[+r.dataset.i])};
}

async function viewFile(it){
  if(!wrap)return;var fp=cur+'/'+it.name;
  wrap.innerHTML='<div class="fm-vbar"><button class="fm-btn" id="fvb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button><div class="fm-path" style="flex:1">'+esc(it.name)+' ('+fmtSz(it.size)+')</div></div><div class="fm-viewer" id="fv">Carregando...</div>';
  wrap.querySelector('#fvb').onclick=function(){init(wrap.parentElement);load(cur)};
  try{var r=await fetch('/api/files/read?path='+encodeURIComponent(fp));var d=await r.json();var v=wrap.querySelector('#fv');
    if(d.error==='too_large')v.textContent='Arquivo grande demais ('+fmtSz(d.size)+')';
    else if(d.error)v.textContent='Erro: '+d.error;else v.textContent=d.content;
  }catch(_){var vv=wrap.querySelector('#fv');if(vv)vv.textContent='Erro de conexão'}
}

function showCtx(x,y,it){
  hideCtx();var fp=cur+'/'+it.name;ctx=document.createElement('div');ctx.className='fm-ctx';ctx.style.left=x+'px';ctx.style.top=y+'px';
  ctx.innerHTML='<div class="fm-ctx-i" data-a="open"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+(it.type==='dir'?'Abrir':'Ver')+'</div><div class="fm-ctx-i" data-a="ren"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Renomear</div><div class="fm-ctx-hr"></div><div class="fm-ctx-i del" data-a="del"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>Excluir</div>';
  ctx.onclick=function(e){var a=e.target.closest('.fm-ctx-i');if(!a)return;hideCtx();
    if(a.dataset.a==='open'){it.type==='dir'?load(fp):viewFile(it)}
    else if(a.dataset.a==='ren'){var nn=prompt('Novo nome:',it.name);if(nn&&nn!==it.name)api('/api/files/rename',{from:fp,to:cur+'/'+nn})}
    else if(a.dataset.a==='del'){if(confirm('Excluir "'+it.name+'"?'))api('/api/files/delete',{path:fp})}};
  document.body.appendChild(ctx);
  var rc=ctx.getBoundingClientRect();if(rc.right>window.innerWidth)ctx.style.left=(x-rc.width)+'px';if(rc.bottom>window.innerHeight)ctx.style.top=(y-rc.height)+'px';
}
function hideCtx(){if(ctx){ctx.remove();ctx=null}}
async function api(url,body){try{await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});load(cur)}catch(_){}}
function mkDir(){var n=prompt('Nome da pasta:');if(n)api('/api/files/mkdir',{path:cur+'/'+n})}
function goBack(){if(phist.length)load(phist.pop())}
function goUp(){var p=cur.split('/');if(p.length>1){p.pop();load(p.join('/')||'/')}}
function fmtSz(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';if(b<1073741824)return(b/1048576).toFixed(1)+' MB';return(b/1073741824).toFixed(1)+' GB'}
function esc(s){var d=document.createElement('span');d.textContent=s;return d.innerHTML}
})();
