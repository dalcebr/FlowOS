(function(){
'use strict';
var cur='',items=[],ph=[],wrap,mainWrap,list,pathEl,stat,side,ctx=null;
var ID='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
var IF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

WM.register('files',{title:'Finder',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  width:740,height:500,onOpen:init,onClose:cleanup});

function init(body){
  body.innerHTML='<div class="fm"><div class="fm-side" id="fmSide"><div class="fm-side-label">Favoritos</div></div><div class="fm-main"><div class="fm-toolbar"><button class="fm-btn" id="fb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button><button class="fm-btn" id="fu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></button><div class="fm-path" id="fp"></div><button class="fm-btn" id="fn" title="Nova pasta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div><div class="fm-body" id="fl"></div><div class="fm-stat" id="fs"></div></div></div>';
  mainWrap=body.querySelector('.fm-main');list=body.querySelector('#fl');pathEl=body.querySelector('#fp');stat=body.querySelector('#fs');side=body.querySelector('#fmSide');
  body.querySelector('#fb').onclick=goBack;body.querySelector('#fu').onclick=goUp;body.querySelector('#fn').onclick=mkDir;
  document.addEventListener('click',hideCtx);
  buildSide();load('');
}
function cleanup(){document.removeEventListener('click',hideCtx);if(ctx){ctx.remove();ctx=null}list=null}
function buildSide(){
  var favs=[{name:'Home',path:'__home__',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'},
    {name:'Desktop',path:'__home__/Desktop',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'},
    {name:'Documents',path:'__home__/Documents',icon:ID},
    {name:'Downloads',path:'__home__/Downloads',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'}];
  favs.forEach(f=>{var d=document.createElement('div');d.className='fm-side-item';d.innerHTML=f.icon+'<span>'+f.name+'</span>';
    d.onclick=()=>{load(f.path==='__home__'?'':f.path.replace('__home__','')); $$('.fm-side-item').forEach(x=>x.classList.remove('on'));d.classList.add('on')};side.appendChild(d)});
}
async function load(p){
  if(!list)return;list.innerHTML='<div class="fm-empty">Carregando...</div>';
  try{var r=await fetch('/api/files/list'+(p?'?path='+encodeURIComponent(p):''));var d=await r.json();if(d.error){list.innerHTML='<div class="fm-empty">'+esc(d.error)+'</div>';return}
    if(cur&&cur!==d.path)ph.push(cur);cur=d.path;items=d.items;pathEl.textContent=cur;stat.textContent=items.length+' itens';render();
  }catch(_){list.innerHTML='<div class="fm-empty">Erro de conexão</div>'}
}
function render(){
  if(!list)return;if(!items.length){list.innerHTML='<div class="fm-empty">Pasta vazia</div>';return}
  var h='';for(var i=0;i<items.length;i++){var it=items[i];h+='<div class="fm-row" data-i="'+i+'"><div class="fm-ico '+(it.type==='dir'?'dir':'file')+'">'+(it.type==='dir'?ID:IF)+'</div><span class="fm-name">'+esc(it.name)+'</span><span class="fm-meta">'+(it.type==='dir'?'':fmtSz(it.size))+'</span></div>'}
  list.innerHTML=h;
  list.onclick=e=>{var r=e.target.closest('.fm-row');if(!r)return;var it=items[+r.dataset.i];it.type==='dir'?load(cur+'/'+it.name):viewFile(it)};
  list.oncontextmenu=e=>{e.preventDefault();var r=e.target.closest('.fm-row');if(r)showCtx(e.clientX,e.clientY,items[+r.dataset.i])};
}
async function viewFile(it){
  if(!mainWrap)return;var fp=cur+'/'+it.name;
  mainWrap.innerHTML='<div class="fm-vbar"><button class="fm-btn" id="fvb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button><div class="fm-path" style="flex:1">'+esc(it.name)+'</div><button class="fm-btn" id="fve" title="Abrir no Editor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></button></div><div class="fm-viewer" id="fv">Carregando...</div>';
  mainWrap.querySelector('#fvb').onclick=()=>{var body=mainWrap.parentElement;init(body);load(cur)};
  mainWrap.querySelector('#fve').onclick=()=>{if(WM._apps.editor){WM.open('editor');setTimeout(()=>{if(window._editorLoad)window._editorLoad(fp)},200)}};
  try{var r=await fetch('/api/files/read?path='+encodeURIComponent(fp));var d=await r.json();var v=mainWrap.querySelector('#fv');
    if(d.error==='too_large')v.textContent='Arquivo grande demais ('+fmtSz(d.size)+')';else if(d.error)v.textContent='Erro: '+d.error;else v.textContent=d.content;
  }catch(_){var vv=mainWrap.querySelector('#fv');if(vv)vv.textContent='Erro'}
}
function showCtx(x,y,it){hideCtx();var fp=cur+'/'+it.name;ctx=document.createElement('div');ctx.className='fm-ctx';ctx.style.left=x+'px';ctx.style.top=y+'px';
  ctx.innerHTML='<div class="fm-ctx-i" data-a="open"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>'+(it.type==='dir'?'Abrir':'Ver')+'</div><div class="fm-ctx-i" data-a="ren"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Renomear</div>'+(it.type==='file'?'<div class="fm-ctx-i" data-a="edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>Abrir no Editor</div>':'')+'<div class="fm-ctx-hr"></div><div class="fm-ctx-i del" data-a="del"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Excluir</div>';
  ctx.onclick=e=>{var a=e.target.closest('.fm-ctx-i');if(!a)return;hideCtx();
    if(a.dataset.a==='open'){it.type==='dir'?load(fp):viewFile(it)}
    else if(a.dataset.a==='ren'){var nn=prompt('Novo nome:',it.name);if(nn&&nn!==it.name)api('/api/files/rename',{from:fp,to:cur+'/'+nn})}
    else if(a.dataset.a==='edit'){WM.open('editor');setTimeout(()=>{if(window._editorLoad)window._editorLoad(fp)},200)}
    else if(a.dataset.a==='del'){if(confirm('Excluir "'+it.name+'"?'))api('/api/files/delete',{path:fp})}};
  document.body.appendChild(ctx);var rc=ctx.getBoundingClientRect();if(rc.right>innerWidth)ctx.style.left=(x-rc.width)+'px';if(rc.bottom>innerHeight)ctx.style.top=(y-rc.height)+'px';
}
function hideCtx(){if(ctx){ctx.remove();ctx=null}}
async function api(u,b){try{await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});load(cur)}catch(_){}}
function mkDir(){var n=prompt('Nome da pasta:');if(n)api('/api/files/mkdir',{path:cur+'/'+n})}
function goBack(){if(ph.length)load(ph.pop())}
function goUp(){var p=cur.split('/');if(p.length>1){p.pop();load(p.join('/')||'/')}}
function fmtSz(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';if(b<1073741824)return(b/1048576).toFixed(1)+' MB';return(b/1073741824).toFixed(1)+' GB'}
function esc(s){var d=document.createElement('span');d.textContent=s;return d.innerHTML}
})();
