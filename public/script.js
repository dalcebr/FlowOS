/*══════════════════════════════════════════════
  FlowOS — Core (script.js)
  Lock screen · Auth · Window Manager · Clock · Metrics
  Exposes: window.WM, window.OS
══════════════════════════════════════════════*/
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};

/* ═══ OS namespace ═══ */
window.OS={user:'FlowOS',home:null};

/* ═══ SVG Icons ═══ */
var I={
  term:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  files:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
};

/* ═══ LOCK SCREEN ═══ */
var lockActive=true, lockShown=true;
var lockClock=$('#lockClock'),lockPanel=$('#lockPanel'),lockHint=$('#lockHint');
var loginPwd=$('#loginPwd'),loginBtn=$('#loginBtn'),loginErr=$('#loginErr'),lockField=$('.lock-field');

var dayNames=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
var monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function updateLockClock(){
  var n=new Date();
  $('#lockTime').textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
  $('#lockDate').textContent=dayNames[n.getDay()]+', '+n.getDate()+' de '+monthNames[n.getMonth()];
}

function revealLogin(){
  if(!lockShown) return;
  lockShown=false;
  lockClock.classList.add('up');
  lockHint.classList.add('hide');
  lockPanel.classList.add('show');
  setTimeout(function(){loginPwd.focus()},400);
}

// Click clock or press key → reveal login
lockClock.addEventListener('click',revealLogin);
document.addEventListener('keydown',function(e){
  if(!lockActive) return;
  if(lockShown && e.key!=='Escape'){revealLogin();return}
  if(e.key==='Enter' && !lockShown) login();
});

loginBtn.addEventListener('click',login);

async function login(){
  var pwd=loginPwd.value;if(!pwd)return;
  loginBtn.disabled=true;
  try{
    var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})});
    if(r.ok){var d=await r.json();OS.user=d.user||'FlowOS';enterDesktop()}
    else{showErr('Senha incorreta')}
  }catch(_){showErr('Sem conexão')}
  loginBtn.disabled=false;
}

function showErr(m){
  loginErr.textContent=m;loginErr.classList.add('show');
  lockField.classList.add('shake');
  setTimeout(function(){lockField.classList.remove('shake')},500);
  setTimeout(function(){loginErr.classList.remove('show')},2500);
}

async function checkSession(){
  try{
    var r=await fetch('/api/whoami');
    if(r.ok){var d=await r.json();OS.user=d.user||'FlowOS';enterDesktop()}
  }catch(_){}
}

function enterDesktop(){
  lockActive=false;
  $('#lockScreen').classList.add('fade-out');
  setTimeout(function(){
    $('#lockScreen').classList.add('gone');$('#lockScreen').classList.remove('fade-out');
    $('#desktop').classList.remove('gone');$('#desktop').classList.add('fade-in');
    setUserLabels();
    setTimeout(function(){$('#desktop').classList.remove('fade-in')},400);
  },300);
}

function returnToLock(){
  for(var id in WM._inst) WM.close(id);
  closeSM();
  $('#desktop').classList.add('fade-out');
  setTimeout(function(){
    $('#desktop').classList.add('gone');$('#desktop').classList.remove('fade-out');
    var ls=$('#lockScreen');ls.classList.remove('gone');ls.classList.add('fade-in');
    lockActive=true;lockShown=true;
    lockClock.classList.remove('up');lockPanel.classList.remove('show');lockHint.classList.remove('hide');
    loginPwd.value='';
    setTimeout(function(){ls.classList.remove('fade-in')},400);
  },300);
}

function setUserLabels(){
  $('#lockUser').textContent=OS.user;
  $('#smUser').textContent=OS.user;
  var av=$('#lockAvatar');
  // Build initials
  var init=OS.user.charAt(0).toUpperCase();
  if(init && init!=='F'){
    av.innerHTML='<span style="font-size:32px;font-weight:500;color:var(--tx2)">'+init+'</span>';
  }
}

/* ═══ WINDOW MANAGER ═══ */
var WM=window.WM={
  _apps:{},_inst:{},_z:700,
  register:function(id,d){this._apps[id]=d},
  open:function(id){
    closeSM();
    if(this._inst[id]){this.focus(id);var w=this._inst[id];if(w.min){w.min=false;w.el.style.display=''}return}
    var d=this._apps[id];if(!d)return;this._mk(id,d)},

  _mk:function(id,d){
    var L=$('#winLayer'),el=document.createElement('div');
    el.className='win opening';el.dataset.app=id;
    var vw=L.clientWidth,vh=L.clientHeight;
    var w=Math.min(d.width||680,vw-12),h=Math.min(d.height||460,vh-12);
    el.style.width=w+'px';el.style.height=h+'px';
    el.style.left=Math.max(6,(vw-w)/2)+'px';el.style.top=Math.max(6,(vh-h)/2)+'px';

    // Title bar
    var bar=document.createElement('div');bar.className='win-bar';
    bar.innerHTML='<div class="win-bar-ico">'+( d.icon||'')+'</div><span class="win-bar-title">'+(d.title||id)+'</span>'+
      '<button class="win-btn min" title="Minimizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
      '<button class="win-btn max" title="Maximizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/></svg></button>'+
      '<button class="win-btn close" title="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="17" y1="7" x2="7" y2="17"/><line x1="7" y1="7" x2="17" y2="17"/></svg></button>';
    var body=document.createElement('div');body.className='win-body';
    el.appendChild(bar);el.appendChild(body);L.appendChild(el);

    var inst={el:el,body:body,def:d,min:false};
    this._inst[id]=inst;this.focus(id);this._addTB(id,d);this._drag(el,bar);

    bar.querySelector('.close').onclick=function(){WM.close(id)};
    bar.querySelector('.max').onclick=function(){el.classList.toggle('max')};
    bar.querySelector('.min').onclick=function(){inst.min=true;el.style.display='none';WM._focusTop()};
    el.addEventListener('pointerdown',function(){WM.focus(id)});
    setTimeout(function(){el.classList.remove('opening')},260);
    if(d.onOpen) d.onOpen(body,inst);
  },

  close:function(id){
    var i=this._inst[id];if(!i)return;
    if(i.def.onClose) i.def.onClose();
    i.el.classList.add('closing');var s=this;
    setTimeout(function(){i.el.remove();delete s._inst[id];s._rmTB(id);s._focusTop()},160);
  },

  focus:function(id){
    this._z++;var i=this._inst[id];if(i)i.el.style.zIndex=this._z;
    var bs=document.querySelectorAll('.tb-app');
    for(var j=0;j<bs.length;j++) bs[j].classList.toggle('on',bs[j].dataset.app===id);
  },

  _focusTop:function(){
    var top=null,tz=0;
    for(var id in this._inst){var i=this._inst[id];if(!i.min){var z=+i.el.style.zIndex||0;if(z>=tz){tz=z;top=id}}}
    if(top)this.focus(top);
  },

  _addTB:function(id,d){
    var b=document.createElement('button');b.className='tb-app on';b.dataset.app=id;
    b.innerHTML=(d.icon||'')+'<span>'+(d.title||id)+'</span>';
    b.onclick=function(){WM.open(id)};$('#tbApps').appendChild(b);
  },
  _rmTB:function(id){var b=document.querySelector('.tb-app[data-app="'+id+'"]');if(b)b.remove()},

  _drag:function(el,bar){
    var ox,oy,on=false;
    bar.addEventListener('pointerdown',function(e){
      if(e.target.closest('.win-btn')||el.classList.contains('max'))return;
      on=true;var r=el.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top;
      bar.classList.add('dragging');e.preventDefault()});
    document.addEventListener('pointermove',function(e){if(!on)return;
      el.style.left=Math.max(0,e.clientX-ox)+'px';el.style.top=Math.max(0,e.clientY-oy)+'px'});
    document.addEventListener('pointerup',function(){on=false;bar.classList.remove('dragging')});
  }
};

/* ═══ START MENU ═══ */
var smOpen=false;
var appList=[
  {id:'terminal',name:'Terminal',icon:I.term},
  {id:'files',name:'Arquivos',icon:I.files},
  {id:'settings',name:'Configurações',icon:I.cfg},
  {id:'editor',name:'Editor',icon:I.edit}
];

(function buildGrid(){
  var g=$('#smGrid'),f=document.createDocumentFragment();
  appList.forEach(function(a){
    var t=document.createElement('div');t.className='sm-tile';
    t.innerHTML='<div class="sm-tile-ico">'+a.icon+'</div><span class="sm-tile-name">'+a.name+'</span>';
    t.onclick=function(){WM._apps[a.id]?WM.open(a.id):alert(a.name+' — em breve')};
    f.appendChild(t);
  });
  g.appendChild(f);
})();

function openSM(){var m=$('#startMenu');m.classList.remove('gone','exit');m.classList.add('enter');smOpen=true}
function closeSM(){if(!smOpen)return;var m=$('#startMenu');m.classList.remove('enter');m.classList.add('exit');smOpen=false;setTimeout(function(){if(!smOpen)m.classList.add('gone')},200)}

$('#tbStart').addEventListener('click',function(e){e.stopPropagation();smOpen?closeSM():openSM()});
$('#startMenu').addEventListener('click',function(e){e.stopPropagation()});
$('#smLogout').addEventListener('click',function(){fetch('/api/logout',{method:'POST'});returnToLock()});
document.addEventListener('click',function(e){if(smOpen&&!e.target.closest('.sm')&&!e.target.closest('.tb-start'))closeSM()});

/* ═══ TASKBAR CLOCK + METRICS ═══ */
function tbTick(){
  var n=new Date();
  $('#tbTime').textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
  $('#tbDate').textContent=String(n.getDate()).padStart(2,'0')+'/'+String(n.getMonth()+1).padStart(2,'0')+'/'+n.getFullYear();
}
async function tbMetrics(){
  try{var r=await fetch('/api/metrics');if(!r.ok)return;var d=await r.json();
    $('#cpuVal').textContent=d.cpu+'%';$('#ramVal').textContent=d.mem+'%'}catch(_){}
}

/* ═══ INIT ═══ */
updateLockClock();setInterval(updateLockClock,1000);
tbTick();setInterval(tbTick,1000);
tbMetrics();setInterval(tbMetrics,3000);
checkSession();
})();
