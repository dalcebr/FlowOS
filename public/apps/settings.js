/*══ Settings App ══*/
(function(){
'use strict';
var pane,navs,timer,data=null;

var secs=[
  {id:'sys',l:'Sistema',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'},
  {id:'net',l:'Rede',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>'},
  {id:'disk',l:'Armazenamento',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'},
  {id:'cpu',l:'Processador',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>'},
  {id:'mem',l:'Memória',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>'},
  {id:'bat',l:'Bateria',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>'},
  {id:'display',l:'Tela',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>'},
  {id:'about',l:'Sobre',i:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}
];

WM.register('settings',{
  title:'Configurações',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  width:740,height:500,onOpen:init,onClose:function(){if(timer)clearInterval(timer);pane=null}
});

function init(body){
  var nh='';for(var i=0;i<secs.length;i++){var s=secs[i];nh+='<div class="cfg-ni'+(i===0?' on':'')+'" data-id="'+s.id+'">'+s.i+'<span>'+s.l+'</span></div>'}
  body.innerHTML='<div class="cfg"><div class="cfg-nav">'+nh+'</div><div class="cfg-pane" id="cfgP"></div></div>';
  pane=body.querySelector('#cfgP');navs=body.querySelectorAll('.cfg-ni');
  for(var j=0;j<navs.length;j++)navs[j].onclick=function(e){var t=e.currentTarget;for(var k=0;k<navs.length;k++)navs[k].classList.remove('on');t.classList.add('on');go(t.dataset.id)};
  go('sys');
  timer=setInterval(function(){var a=body.querySelector('.cfg-ni.on');if(a)go(a.dataset.id)},5000);
}

async function go(id){
  if(!pane)return;
  try{var r=await fetch('/api/system');if(!r.ok)return;data=await r.json()}catch(_){return}
  draw(id);
}

function draw(id){
  if(!pane||!data)return;var d=data,h='';
  switch(id){
    case'sys':
      h=H('Sistema')+C(R('Hostname',d.hostname)+R('Plataforma',d.platform+' / '+d.arch)+R('Kernel',d.kernel)+R('Tempo ativo',uptime(d.uptime))+R('Node.js',d.nodeVersion)+R('Usuário',d.user));break;
    case'net':
      h=H('Rede');
      h+=C(R('Wi-Fi',d.wifi?B('● Conectado','g'):B('● Desconectado','r'))+(d.wifi?R('SSID',d.wifi):''));
      if(d.network&&d.network.length){var nr='';for(var i=0;i<d.network.length;i++){var n=d.network[i];nr+=R(n.name,n.ip+(n.internal?' (local)':''));if(n.mac&&n.mac!=='00:00:00:00:00:00')nr+=R('MAC',n.mac)}h+=C(nr)}break;
    case'disk':
      h=H('Armazenamento');
      if(d.disk){var up=Math.round(d.disk.used/d.disk.total*100);var uc=up>90?'var(--red)':up>70?'var(--yellow)':'var(--green)';
        h+=C(R('Montagem',d.disk.mount)+R('Total',bytes(d.disk.total))+R('Usado',bytes(d.disk.used)+' ('+up+'%)')+R('Livre',bytes(d.disk.free))+M(up,uc))}
      else h+=C(R('Status','Indisponível'));break;
    case'cpu':
      var cp=0;try{cp=parseInt(document.getElementById('cpuVal').textContent)}catch(_){}
      var cc=cp>80?'var(--red)':cp>50?'var(--yellow)':'var(--accent)';
      h=H('Processador')+C(R('Modelo',d.cpu.model)+R('Núcleos',d.cpu.cores)+R('Velocidade',d.cpu.speed+' MHz'))+C(R('Uso atual',B(cp+'%','b'))+M(cp,cc));break;
    case'mem':
      var mu=d.memory.used,mt=d.memory.total,mp=Math.round(mu/mt*100);
      var mc=mp>85?'var(--red)':mp>60?'var(--yellow)':'var(--green)';
      h=H('Memória')+C(R('Total',bytes(mt))+R('Em uso',bytes(mu)+' ('+mp+'%)')+R('Livre',bytes(d.memory.free))+M(mp,mc));break;
    case'bat':
      h=H('Bateria');
      if(d.battery){var l=d.battery.level,s=d.battery.status;
        var bc=l>60?'var(--green)':l>20?'var(--yellow)':'var(--red)';
        var bs=s==='Charging'?B('⚡ Carregando','g'):s==='Full'?B('● Completa','g'):B('● Descarregando','y');
        h+=C(R('Nível',l+'%')+R('Status',bs)+(d.battery.temp?R('Temperatura',d.battery.temp+'°C'):'')+M(l,bc))}
      else h+=C(R('Status',B('Indisponível','y'))+'<p style="font-size:11px;color:var(--tx3);margin-top:8px">Instale termux-api para dados de bateria.</p>');break;
    case'display':
      h=H('Tela')+C(R('Resolução',window.screen.width+' × '+window.screen.height)+R('Pixel ratio',window.devicePixelRatio+'x')+R('Viewport',window.innerWidth+' × '+window.innerHeight)+R('Profundidade de cor',window.screen.colorDepth+' bits')+R('Orientação',window.innerWidth>window.innerHeight?'Paisagem':'Retrato'));break;
    case'about':
      h=H('Sobre')+C(R('Sistema','FlowOS v2.0')+R('Arquitetura','Node.js + Express + Vanilla JS')+R('Backend',d.hostname+' ('+d.platform+')')+R('Conceito','Termux = CPU · Browser = Monitor'))+'<p style="text-align:center;color:var(--tx3);font-size:11px;margin-top:24px">Feito para rodar suave até num Galaxy S8.</p>';break;
  }
  pane.innerHTML=h;
}

function H(t){return'<div class="cfg-h">'+t+'</div>'}
function C(i){return'<div class="cfg-card">'+i+'</div>'}
function R(l,v){return'<div class="cfg-row"><span class="cfg-lbl">'+l+'</span><span class="cfg-val">'+v+'</span></div>'}
function B(t,c){return'<span class="cfg-badge '+c+'">'+t+'</span>'}
function M(p,c){return'<div class="cfg-meter"><div class="cfg-meter-fill" style="width:'+p+'%;background:'+c+'"></div></div>'}
function bytes(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';if(b<1073741824)return(b/1048576).toFixed(1)+' MB';return(b/1073741824).toFixed(2)+' GB'}
function uptime(s){var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);var p=[];if(d)p.push(d+'d');if(h)p.push(h+'h');p.push(m+'min');return p.join(' ')}
})();
