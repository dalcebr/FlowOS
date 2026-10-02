/*══ Settings with Personalization ══*/
(function(){
'use strict';
var pane,navs,timer,data=null;
var secs=[
  {id:'look',l:'Aparência',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'},
  {id:'sys',l:'Sistema',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'},
  {id:'net',l:'Rede',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>'},
  {id:'disk',l:'Armazenamento',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'},
  {id:'cpu',l:'Processador',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>'},
  {id:'mem',l:'Memória',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>'},
  {id:'bat',l:'Bateria',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>'},
  {id:'about',l:'Sobre',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}
];

var accents=[{h:215,c:'#6ea8fe',n:'Azul'},{h:270,c:'#c084fc',n:'Roxo'},{h:330,c:'#f472b6',n:'Rosa'},{h:0,c:'#ff7b7b',n:'Vermelho'},{h:25,c:'#fb923c',n:'Laranja'},{h:50,c:'#fbbf24',n:'Amarelo'},{h:145,c:'#34d399',n:'Verde'},{h:185,c:'#22d3ee',n:'Ciano'}];
var walls=[
  {n:'Aurora',bg:'linear-gradient(135deg,#1a0533,#0c1a3a 40%,#0a2e1f)'},
  {n:'Oceano',bg:'linear-gradient(135deg,#0f2027,#203a43,#2c5364)'},
  {n:'Meia-noite',bg:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)'},
  {n:'Esmeralda',bg:'linear-gradient(135deg,#2d1b69,#11998e)'},
  {n:'Carvão',bg:'linear-gradient(135deg,#141e30,#243b55)'},
  {n:'Nebulosa',bg:'linear-gradient(135deg,#0c0c1d,#1a1a2e,#2d132c)'}
];

WM.register('settings',{title:'Ajustes',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  width:760,height:510,onOpen:init,onClose:()=>{if(timer)clearInterval(timer);pane=null}});

function init(body){
  var nh='';secs.forEach((s,i)=>{nh+='<div class="cfg-ni'+(i===0?' on':'')+'" data-id="'+s.id+'">'+s.i+'<span>'+s.l+'</span></div>'});
  body.innerHTML='<div class="cfg"><div class="cfg-nav">'+nh+'</div><div class="cfg-pane" id="cfgP"></div></div>';
  pane=body.querySelector('#cfgP');navs=body.querySelectorAll('.cfg-ni');
  navs.forEach(n=>n.onclick=e=>{navs.forEach(x=>x.classList.remove('on'));e.currentTarget.classList.add('on');go(e.currentTarget.dataset.id)});
  go('look');
  timer=setInterval(()=>{var a=body.querySelector('.cfg-ni.on');if(a&&a.dataset.id!=='look')go(a.dataset.id)},5000);
}

async function go(id){
  if(!pane)return;
  if(id!=='look'){try{var r=await fetch('/api/system');if(r.ok)data=await r.json()}catch(_){}}
  draw(id);
}

function draw(id){
  if(!pane)return;var d=data,h='';
  if(id==='look'){
    // THEME TOGGLE
    var isDark=Prefs.get('theme')==='dark';
    h='<div class="cfg-h">Aparência</div>';
    h+=C('<div class="cfg-row"><span class="cfg-lbl">Modo escuro</span><div class="cfg-toggle'+(isDark?' on':'')+'" id="cfgTheme"></div></div>');
    // ACCENT COLORS
    h+='<div class="cfg-card"><div class="cfg-lbl" style="margin-bottom:10px">Cor de destaque</div><div class="cfg-colors" id="cfgAccent">';
    var curH=Prefs.get('accentH');
    accents.forEach(a=>{h+='<div class="cfg-color'+(a.h===curH?' on':'')+'" data-h="'+a.h+'" style="background:'+a.c+'" title="'+a.n+'"></div>'});
    h+='</div></div>';
    // WALLPAPERS
    h+='<div class="cfg-card"><div class="cfg-lbl" style="margin-bottom:10px">Papel de parede</div><div class="cfg-walls" id="cfgWall">';
    var curW=Prefs.get('wallIdx');
    walls.forEach((w,i)=>{h+='<div class="cfg-wall'+(i===curW?' on':'')+'" data-i="'+i+'" style="background:'+w.bg+'" title="'+w.n+'"></div>'});
    h+='</div></div>';
    // LOGOUT
    h+=C('<div class="cfg-row"><span class="cfg-lbl">Encerrar sessão</span><button class="ed-btn" style="color:var(--red)" id="cfgLogout">Sair</button></div>');
    pane.innerHTML=h;
    // Events
    pane.querySelector('#cfgTheme').onclick=function(){
      var nxt=Prefs.get('theme')==='dark'?'light':'dark';Prefs.set('theme',nxt);Prefs.apply();go('look')};
    pane.querySelector('#cfgAccent').onclick=function(e){var c=e.target.closest('.cfg-color');if(!c)return;Prefs.set('accentH',+c.dataset.h);Prefs.apply();go('look')};
    pane.querySelector('#cfgWall').onclick=function(e){var w=e.target.closest('.cfg-wall');if(!w)return;Prefs.set('wallIdx',+w.dataset.i);Prefs.apply();go('look')};
    pane.querySelector('#cfgLogout').onclick=function(){fetch('/api/logout',{method:'POST'});window._toLock()};
    return;
  }
  if(!d){pane.innerHTML='<div class="fm-empty">Carregando...</div>';return}
  switch(id){
    case'sys':h=H('Sistema')+C(R('Hostname',d.hostname)+R('Plataforma',d.platform+' / '+d.arch)+R('Kernel',d.kernel)+R('Tempo ativo',up(d.uptime))+R('Node.js',d.nodeVersion)+R('Shell',d.shellPath)+R('Usuário',d.user));break;
    case'net':h=H('Rede')+C(R('Wi-Fi',d.wifi?B('● Conectado','g'):B('● Sem conexão','r'))+(d.wifi?R('SSID',d.wifi):''));
      if(d.network.length){var nr='';d.network.forEach(n=>{nr+=R(n.name,n.ip+(n.internal?' (local)':''));if(n.mac&&n.mac!=='00:00:00:00:00:00')nr+=R('MAC',n.mac)});h+=C(nr)}break;
    case'disk':h=H('Armazenamento');if(d.disk){var up2=Math.round(d.disk.used/d.disk.total*100),uc=up2>90?'var(--red)':up2>70?'var(--yellow)':'var(--green)';h+=C(R('Montagem',d.disk.mount)+R('Total',bytes(d.disk.total))+R('Usado',bytes(d.disk.used)+' ('+up2+'%)')+R('Livre',bytes(d.disk.free))+M(up2,uc))}else h+=C(R('Status','Indisponível'));break;
    case'cpu':var cp=0;try{cp=parseInt(document.getElementById('mbCpu').textContent.match(/\d+/))}catch(_){}var cc=cp>80?'var(--red)':cp>50?'var(--yellow)':'var(--accent)';h=H('Processador')+C(R('Modelo',d.cpu.model)+R('Núcleos',d.cpu.cores)+R('Clock',d.cpu.speed+' MHz'))+C(R('Uso atual',B(cp+'%','b'))+M(cp,cc));break;
    case'mem':var mu=d.memory.used,mt=d.memory.total,mp=Math.round(mu/mt*100),mc=mp>85?'var(--red)':mp>60?'var(--yellow)':'var(--green)';h=H('Memória')+C(R('Total',bytes(mt))+R('Em uso',bytes(mu)+' ('+mp+'%)')+R('Livre',bytes(d.memory.free))+M(mp,mc));break;
    case'bat':h=H('Bateria');if(d.battery){var l=d.battery.level,s=d.battery.status,bc=l>60?'var(--green)':l>20?'var(--yellow)':'var(--red)';h+=C(R('Nível',l+'%')+R('Status',s==='Charging'?B('⚡ Carregando','g'):s==='Full'?B('● Completa','g'):B('● Descarregando','y'))+(d.battery.temp?R('Temperatura',d.battery.temp+'°C'):'')+M(l,bc))}else h+=C(R('Status',B('Indisponível','y'))+'<p style="font-size:11px;color:var(--tx3);margin-top:8px">Instale termux-api para dados de bateria.</p>');break;
    case'about':h=H('Sobre')+C(R('Sistema','FlowOS v3.0')+R('Estilo','macOS-inspired')+R('Stack','Node.js + Express + Vanilla JS')+R('Backend',d.hostname+' ('+d.platform+')')+R('Conceito','Termux = CPU · Browser = Monitor'));break;
  }
  pane.innerHTML=h;
}

function H(t){return'<div class="cfg-h">'+t+'</div>'}
function C(i){return'<div class="cfg-card">'+i+'</div>'}
function R(l,v){return'<div class="cfg-row"><span class="cfg-lbl">'+l+'</span><span class="cfg-val">'+v+'</span></div>'}
function B(t,c){return'<span class="cfg-badge '+c+'">'+t+'</span>'}
function M(p,c){return'<div class="cfg-meter"><div class="cfg-meter-fill" style="width:'+p+'%;background:'+c+'"></div></div>'}
function bytes(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';if(b<1073741824)return(b/1048576).toFixed(1)+' MB';return(b/1073741824).toFixed(2)+' GB'}
function up(s){var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);var p=[];if(d)p.push(d+'d');if(h)p.push(h+'h');p.push(m+'min');return p.join(' ')}
})();
