/*══════════════════════════════════════════
  FlowOS v3 — Core
  macOS-style: menubar, dock, traffic lights
  Theme persistence via localStorage
══════════════════════════════════════════*/
(function(){
'use strict';
var $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

window.OS={user:'FlowOS',home:null};

/* ═══ ICONS ═══ */
var I={
  term:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  files:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  editor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};

/* ═══ PREFS (localStorage) ═══ */
window.Prefs={
  _d:{theme:'dark',accentH:215,wallIdx:0},
  get:function(k){try{var s=localStorage.getItem('flowos_prefs');var o=s?JSON.parse(s):{}; return o[k]!==undefined?o[k]:this._d[k]}catch(_){return this._d[k]}},
  set:function(k,v){try{var s=localStorage.getItem('flowos_prefs');var o=s?JSON.parse(s):{};o[k]=v;localStorage.setItem('flowos_prefs',JSON.stringify(o))}catch(_){}},
  apply:function(){
    var t=this.get('theme');document.documentElement.setAttribute('data-theme',t);
    document.documentElement.style.setProperty('--accentH',this.get('accentH'));
    var walls=['linear-gradient(135deg,#1a0533,#0c1a3a 40%,#0a2e1f)','linear-gradient(135deg,#0f2027,#203a43,#2c5364)','linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)','linear-gradient(135deg,#2d1b69,#11998e)','linear-gradient(135deg,#141e30,#243b55)','linear-gradient(135deg,#0c0c1d,#1a1a2e,#2d132c)'];
    var w=walls[this.get('wallIdx')]||walls[0];
    document.documentElement.style.setProperty('--wall',w);
  }
};
Prefs.apply();

/* ═══ LOCK ═══ */
var lockOn=true,clockUp=true;
var days=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
var months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var mShort=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function lkTick(){var n=new Date();$('#lkTime').textContent=pad(n.getHours())+':'+pad(n.getMinutes());$('#lkDate').textContent=days[n.getDay()]+', '+n.getDate()+' de '+months[n.getMonth()]}

function reveal(){if(!clockUp)return;clockUp=false;$('#lkClock').classList.add('up');$('#lkHint').classList.add('hide');$('#lkLogin').classList.add('show');setTimeout(()=>$('#lkPwd').focus(),400)}

$('#lkClock').onclick=reveal;
document.addEventListener('keydown',e=>{if(!lockOn)return;if(clockUp){reveal();return};if(e.key==='Enter')doLogin()});
$('#lkBtn').onclick=doLogin;

async function doLogin(){
  var p=$('#lkPwd').value;if(!p)return;
  try{var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})});
    if(r.ok){var d=await r.json();OS.user=d.user||'FlowOS';enter()}
    else{$('#lkErr').textContent='Senha incorreta';$('#lkErr').classList.add('show');$('.lk-field').classList.add('shake');setTimeout(()=>$('.lk-field').classList.remove('shake'),450);setTimeout(()=>$('#lkErr').classList.remove('show'),2500)}
  }catch(_){$('#lkErr').textContent='Sem conexão';$('#lkErr').classList.add('show')}
}

async function checkSess(){try{var r=await fetch('/api/whoami');if(r.ok){var d=await r.json();OS.user=d.user||'FlowOS';enter()}}catch(_){}}

function enter(){
  lockOn=false;$('#lock').classList.add('fade-out');
  setTimeout(()=>{$('#lock').classList.add('gone');$('#lock').classList.remove('fade-out');$('#desk').classList.remove('gone');$('#desk').classList.add('fade-in');setUser();setTimeout(()=>$('#desk').classList.remove('fade-in'),400)},300);
}

function toLock(){
  for(var id in WM._inst)WM.close(id);
  $('#desk').classList.add('fade-out');
  setTimeout(()=>{$('#desk').classList.add('gone');$('#desk').classList.remove('fade-out');
    var l=$('#lock');l.classList.remove('gone');l.classList.add('fade-in');
    lockOn=true;clockUp=true;$('#lkClock').classList.remove('up');$('#lkLogin').classList.remove('show');$('#lkHint').classList.remove('hide');$('#lkPwd').value='';
    setTimeout(()=>l.classList.remove('fade-in'),400)},300);
}

function setUser(){$('#lkUser').textContent=OS.user;$('#lkAvatar').textContent=OS.user.charAt(0).toUpperCase()}

/* ═══ WINDOW MANAGER ═══ */
var WM=window.WM={_apps:{},_inst:{},_z:800,
  register(id,d){this._apps[id]=d},
  open(id){if(this._inst[id]){this.focus(id);var w=this._inst[id];if(w.min){w.min=false;w.el.style.display=''}return}var d=this._apps[id];if(d)this._mk(id,d)},

  _mk(id,d){
    var L=$('#winLayer'),el=document.createElement('div');el.className='win opening';el.dataset.app=id;
    var vw=L.clientWidth,vh=L.clientHeight,w=Math.min(d.width||700,vw-20),h=Math.min(d.height||470,vh-20);
    el.style.cssText=`width:${w}px;height:${h}px;left:${Math.max(10,(vw-w)/2)}px;top:${Math.max(10,(vh-h)/2)}px`;
    var bar=document.createElement('div');bar.className='win-bar';
    bar.innerHTML=`<div class="win-dots"><button class="win-dot close"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="3" stroke-linecap="round"><line x1="7" y1="7" x2="17" y2="17"/><line x1="17" y1="7" x2="7" y2="17"/></svg></button><button class="win-dot min"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="3"><line x1="6" y1="12" x2="18" y2="12"/></svg></button><button class="win-dot max"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="3"><polyline points="8 4 16 12 8 20"/></svg></button></div><span class="win-title">${d.title||id}</span><div class="win-bar-pad"></div>`;
    var body=document.createElement('div');body.className='win-body';
    el.appendChild(bar);el.appendChild(body);L.appendChild(el);

    var inst={el,body,def:d,min:false};this._inst[id]=inst;this.focus(id);
    this._dockDot(id,true);this._drag(el,bar);

    bar.querySelector('.close').onclick=()=>WM.close(id);
    bar.querySelector('.max').onclick=()=>el.classList.toggle('max');
    bar.querySelector('.min').onclick=()=>{inst.min=true;el.style.display='none';WM._focusTop()};
    el.addEventListener('pointerdown',()=>WM.focus(id));
    setTimeout(()=>el.classList.remove('opening'),300);
    $('#mbApp').textContent=d.title||id;
    if(d.onOpen)d.onOpen(body,inst);
  },

  close(id){var i=this._inst[id];if(!i)return;if(i.def.onClose)i.def.onClose();
    i.el.classList.add('closing');setTimeout(()=>{i.el.remove();delete this._inst[id];this._dockDot(id,false);this._focusTop()},200)},

  focus(id){this._z++;var i=this._inst[id];if(i){i.el.style.zIndex=this._z;$('#mbApp').textContent=i.def.title||id}},

  _focusTop(){var top=null,tz=0;for(var id in this._inst){var i=this._inst[id];if(!i.min){var z=+i.el.style.zIndex||0;if(z>=tz){tz=z;top=id}}}
    if(top)this.focus(top);else $('#mbApp').textContent='FlowOS'},

  _dockDot(id,on){var d=document.querySelector(`.dock-icon[data-app="${id}"]`);if(d)d.classList.toggle('running',on)},

  _drag(el,bar){var ox,oy,on=false;
    bar.addEventListener('pointerdown',e=>{if(e.target.closest('.win-dot')||el.classList.contains('max'))return;on=true;var r=el.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top;bar.classList.add('dragging');e.preventDefault()});
    document.addEventListener('pointermove',e=>{if(!on)return;el.style.left=Math.max(0,e.clientX-ox)+'px';el.style.top=Math.max(0,e.clientY-oy)+'px'});
    document.addEventListener('pointerup',()=>{on=false;bar.classList.remove('dragging')})}
};

/* ═══ DOCK ═══ */
var dockApps=[
  {id:'terminal',name:'Terminal',icon:I.term},
  {id:'files',name:'Arquivos',icon:I.files},
  {id:'editor',name:'Editor',icon:I.editor},
  {id:'_sep'},
  {id:'settings',name:'Ajustes',icon:I.cfg}
];
(function buildDock(){
  var d=$('#dockInner'),f=document.createDocumentFragment();
  dockApps.forEach(a=>{
    if(a.id==='_sep'){var s=document.createElement('div');s.className='dock-sep';f.appendChild(s);return}
    var b=document.createElement('button');b.className='dock-icon';b.dataset.app=a.id;
    b.innerHTML=a.icon+'<div class="dock-dot"></div><div class="dock-tooltip">'+a.name+'</div>';
    b.onclick=()=>{if(WM._apps[a.id])WM.open(a.id);else alert(a.name+' — em breve')};
    f.appendChild(b);
  });
  d.appendChild(f);
})();

/* ═══ MENUBAR CLOCK + METRICS ═══ */
function mbTick(){
  var n=new Date();$('#mbClock').textContent=pad(n.getHours())+':'+pad(n.getMinutes());
  var wd=['dom','seg','ter','qua','qui','sex','sáb'];
  $('#mbDate').textContent=wd[n.getDay()]+'. '+n.getDate()+' '+mShort[n.getMonth()]+'.';
}
async function mbMet(){try{var r=await fetch('/api/metrics');if(!r.ok)return;var d=await r.json();
  $('#mbCpu').textContent='CPU '+d.cpu+'%';$('#mbRam').textContent='RAM '+d.mem+'%'}catch(_){}}

function pad(n){return String(n).padStart(2,'0')}

/* ═══ INIT ═══ */
lkTick();setInterval(lkTick,1000);
mbTick();setInterval(mbTick,1000);
mbMet();setInterval(mbMet,3000);
checkSess();

/* expose for apps */
window._toLock=toLock;
})();
