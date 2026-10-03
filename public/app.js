(()=>{"use strict";
const $=s=>s==="#main"?(state.renderTarget||state.windows.get(state.view)?.querySelector(".window-body")||document.querySelector(s)):document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={view:"home",home:"~",user:"flow",cwd:"~",project:null,tree:[],openFiles:new Map(),active:null,termHistory:[],termIndex:0,git:null,windows:new Map(),z:20,renderTarget:null};
const windowMeta={
 home:{title:"Início",icon:"⌂"},projects:{title:"Projetos",icon:"▦"},files:{title:"Arquivos",icon:"□"},editor:{title:"Editor",icon:"✎"},markdown:{title:"Markdown",icon:"M"},terminal:{title:"Terminal",icon:"›_"},git:{title:"Git / GitHub",icon:"⌘"},processes:{title:"Processos",icon:"◌"},system:{title:"Status do sistema",icon:"◈"},settings:{title:"Ajustes",icon:"⚙"}
};
const icons={folder:"📁",file:"📄",md:"M",js:"JS",ts:"TS",py:"PY",json:"{}",css:"#",html:"<>",sh:"$_",git:"●"};

async function api(url,opt={}){const r=await fetch(url,{credentials:"same-origin",...opt});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||`Erro ${r.status}`);return d}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2300)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function bytes(n){if(!n)return"0 B";const u=["B","KB","MB","GB"];let i=0;while(n>=1024&&i<3){n/=1024;i++}return n.toFixed(i?1:0)+" "+u[i]}
function rel(p){if(!p)return"";if(state.home&&p.startsWith(state.home))return"~"+p.slice(state.home.length);return p}
function ext(p){return (p.split(".").pop()||"").toLowerCase()}
function fileIcon(n,type){if(type==="dir")return"📁";return icons[ext(n)]||"📄"}

async function boot(){
 try{const me=await api("/api/whoami");state.user=me.user;state.home=me.home;state.cwd=me.home;showApp();await route("home");}
 catch{showLogin()}
}
function showLogin(){$("#login").classList.remove("hidden");$("#app").classList.add("hidden");$("#loginPass").focus()}
function showApp(){$("#login").classList.add("hidden");$("#app").classList.remove("hidden");$("#sideUser").textContent=state.user}
$("#loginForm").onsubmit=async e=>{e.preventDefault();try{const d=await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("#loginPass").value})});state.user=d.user;state.home=d.home;state.cwd=d.home;showApp();route("home")}catch(e){$("#loginError").textContent="Senha incorreta ou servidor indisponível";$("#loginPass").select()}};

$$(".nav-item").forEach(b=>b.onclick=()=>{route(b.dataset.view);$("#sidebar").classList.remove("open")});
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#quickTerminal").onclick=()=>route("terminal");
$("#settingsBtn").onclick=()=>route("settings");
$("#brandBtn").onclick=()=>route("home");

async function route(view){
 state.view=view;
 $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
 const meta=windowMeta[view]||{title:"FlowOS",icon:"F"};
 const existing=state.windows.get(view);
 if(existing){focusWindow(existing);await renderWindow(view,existing);return}
 const win=createWindow(view,meta.title,meta.icon);
 await renderWindow(view,win);
}

function createWindow(view,title,icon){
 const desktop=$("#main");
 const win=document.createElement("section");
 win.className="window focused";
 win.dataset.view=view;
 const count=state.windows.size;
 const left=18+(count%5)*28, top=18+(count%4)*24;
 win.style.left=`${left}px`;win.style.top=`${top}px`;
 win.style.width=view==="editor"?"min(1100px,calc(100% - 36px))":"min(900px,calc(100% - 36px))";
 win.style.height=view==="terminal"?"min(650px,calc(100% - 78px))":"min(680px,calc(100% - 78px))";
 win.style.zIndex=++state.z;
 win.innerHTML=`<div class="window-titlebar"><div class="window-icon">${esc(icon)}</div><div class="window-title">${esc(title)}</div><div class="window-subtitle" data-window-subtitle></div><div class="window-controls"><button class="window-control" data-action="minimize" title="Minimizar">—</button><button class="window-control" data-action="maximize" title="Maximizar">□</button><button class="window-control close" data-action="close" title="Fechar">×</button></div></div><div class="window-body"></div><div class="resize-grip"></div>`;
 desktop.appendChild(win);
 state.windows.set(view,win);
 const titlebar=win.querySelector(".window-titlebar");
 titlebar.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;startDrag(e,win)});
 win.addEventListener("pointerdown",()=>focusWindow(win));
 win.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const a=b.dataset.action;if(a==="minimize")minimizeWindow(view);if(a==="maximize")maximizeWindow(view);if(a==="close")closeAppWindow(view)}));
 win.querySelector(".resize-grip").addEventListener("pointerdown",e=>startResize(e,win));
 updateTaskbar();
 return win;
}

function focusWindow(win){if(!win)return;state.z++;win.style.zIndex=state.z;$$('.window').forEach(w=>w.classList.remove('focused'));win.classList.add('focused');const view=win.dataset.view;state.view=view;$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));updateTaskbar()}
function minimizeWindow(view){const win=state.windows.get(view);if(!win)return;win.classList.add('minimized');updateTaskbar()}
function maximizeWindow(view){const win=state.windows.get(view);if(!win)return;win.classList.toggle('maximized');if(!win.classList.contains('maximized')){const saved=win.dataset.restore;if(saved){try{const r=JSON.parse(saved);win.style.left=r.left;win.style.top=r.top;win.style.width=r.width;win.style.height=r.height}catch{}}}else{win.dataset.restore=JSON.stringify({left:win.style.left,top:win.style.top,width:win.style.width,height:win.style.height})}focusWindow(win)}
function closeAppWindow(view){
 const win=state.windows.get(view);if(!win)return;
 if(view==="editor"&&[...state.openFiles.values()].some(f=>f.dirty)&&!confirm("Existem arquivos não salvos no Editor. Fechar a janela mesmo assim?"))return;
 win.remove();state.windows.delete(view);updateTaskbar();
}
function restoreWindow(view){const win=state.windows.get(view);if(!win)return;win.classList.remove('minimized');focusWindow(win)}
function updateTaskbar(){
 const bar=$("#taskbar");if(!bar)return;
 const items=[...state.windows.entries()].map(([view,w])=>{const m=windowMeta[view];return `<button class="task-item ${w.classList.contains('minimized')?'minimized ':''}${w.classList.contains('focused')&&!w.classList.contains('minimized')?'active':''}" onclick="taskbarOpen('${view}')"><span>${m.icon}</span><span>${esc(m.title)}</span></button>`}).join('');
 bar.innerHTML=`<button class="taskbar-start" onclick="toggleLauncher()" title="Aplicativos">F</button><div class="taskbar-apps">${items}</div><div class="taskbar-status"><span id="taskClock">--:--</span><span id="taskRam">FlowOS</span></div>`;
}
function taskbarOpen(view){const win=state.windows.get(view);if(!win)return;if(win.classList.contains('minimized'))restoreWindow(view);else focusWindow(win)}
function toggleLauncher(){$("#sidebar").classList.toggle('open')}
function startDrag(e,win){if(win.classList.contains('maximized'))return;const desktop=$("#main"),dr=desktop.getBoundingClientRect(),wr=win.getBoundingClientRect();const sx=e.clientX,sy=e.clientY,ox=wr.left-dr.left,oy=wr.top-dr.top;win.setPointerCapture?.(e.pointerId);const move=ev=>{const x=Math.max(4,Math.min(dr.width-win.offsetWidth-4,ox+(ev.clientX-sx)));const y=Math.max(4,Math.min(dr.height-win.offsetHeight-52,oy+(ev.clientY-sy)));win.style.left=x+'px';win.style.top=y+'px'};const up=()=>{win.releasePointerCapture?.(e.pointerId);win.removeEventListener('pointermove',move);win.removeEventListener('pointerup',up)};win.addEventListener('pointermove',move);win.addEventListener('pointerup',up)}
function startResize(e,win){if(win.classList.contains('maximized'))return;const desktop=$("#main"),dr=desktop.getBoundingClientRect(),wr=win.getBoundingClientRect();const sx=e.clientX,sy=e.clientY,sw=wr.width,sh=wr.height;win.setPointerCapture?.(e.pointerId);const move=ev=>{win.style.width=Math.max(360,Math.min(dr.width-wr.left-4,sw+ev.clientX-sx))+'px';win.style.height=Math.max(240,Math.min(dr.height-wr.top-52,sh+ev.clientY-sy))+'px'};const up=()=>{win.releasePointerCapture?.(e.pointerId);win.removeEventListener('pointermove',move);win.removeEventListener('pointerup',up)};win.addEventListener('pointermove',move);win.addEventListener('pointerup',up)}
async function renderWindow(view,win){
 const body=win.querySelector('.window-body');if(!body)return;
 state.renderTarget=body;
 try{const fn={home:renderHome,projects:renderProjects,files:()=>renderFiles(state.cwd),git:renderGit,editor:renderEditor,markdown:renderMarkdown,terminal:renderTerminal,processes:renderProcesses,system:renderSystem,settings:renderSettings}[view];if(fn)await fn();}catch(e){errorView(e.message)}finally{state.renderTarget=null;focusWindow(win)}
}
function refreshWindow(view){const win=state.windows.get(view);if(win)return renderWindow(view,win)}

function renderHome(){
 $("#main").innerHTML=`<div class="view">
 <div class="welcome"><div class="eyebrow">FlowOS 5</div><h2>Programar no celular, sem complicação.</h2><p>Crie projetos, edite código, escreva Markdown, use Git e abra um terminal — tudo em uma única interface pensada para Termux.</p></div>
 <div class="quick-grid">
  <button class="quick" onclick="newProject()"><div class="qicon">＋</div><b>Novo projeto</b><small>Comece uma pasta limpa</small></button>
  <button class="quick" onclick="route('projects')"><div class="qicon">▦</div><b>Abrir projeto</b><small>Escolha visualmente</small></button>
  <button class="quick" onclick="route('git')"><div class="qicon">⌘</div><b>Git / GitHub</b><small>Commit, pull e push</small></button>
  <button class="quick" onclick="route('markdown')"><div class="qicon">M</div><b>Notas Markdown</b><small>Escreva e visualize</small></button>
 </div>
 <div class="grid grid-4" style="margin-top:13px" id="homeStats"><div class="card"><div class="stat-label">CPU</div><div class="stat-value">—</div></div><div class="card"><div class="stat-label">RAM</div><div class="stat-value">—</div></div><div class="card"><div class="stat-label">Projeto atual</div><div class="stat-value" style="font-size:16px">${state.project?esc(state.project.name):"Nenhum"}</div></div><div class="card"><div class="stat-label">Branch</div><div class="stat-value" style="font-size:16px">${state.git?.branch||"—"}</div></div></div>
 <div class="grid grid-2" style="margin-top:13px">
  <div class="card"><div class="card-title">Acesso rápido <small>toque para abrir</small></div><div class="list">
   <div class="list-row click" onclick="route('files')"><span>📁</span><div class="grow"><b>Arquivos</b><small>Navegue sem digitar caminhos</small></div><span>›</span></div>
   <div class="list-row click" onclick="route('editor')"><span>✎</span><div class="grow"><b>Editor</b><small>Arquivos com abas e atalhos</small></div><span>›</span></div>
   <div class="list-row click" onclick="route('terminal')"><span>›_</span><div class="grow"><b>Terminal</b><small>Shell real do Termux</small></div><span>›</span></div>
  </div></div>
  <div class="card"><div class="card-title">Dica</div><p class="muted">Use <b>Projetos</b> para abrir uma pasta. Depois, o editor e o Git passam a trabalhar nela automaticamente.</p><p class="muted">Atalho: <span class="mono">Ctrl/⌘ + S</span> salva o arquivo aberto.</p></div>
 </div></div>`;
 updateMetrics();
}

async function updateMetrics(){
 try{const d=await api("/api/metrics");const cards=$("#homeStats");if(cards)cards.innerHTML=`<div class="card"><div class="stat-label">CPU</div><div class="stat-value">${d.cpu}%</div><div class="progress"><i style="width:${d.cpu}%"></i></div></div><div class="card"><div class="stat-label">RAM</div><div class="stat-value">${d.mem}%</div><div class="progress"><i style="width:${d.mem}%"></i></div></div><div class="card"><div class="stat-label">Projeto atual</div><div class="stat-value" style="font-size:16px">${state.project?esc(state.project.name):"Nenhum"}</div></div><div class="card"><div class="stat-label">Branch</div><div class="stat-value" style="font-size:16px">${esc(state.git?.branch||"—")}</div></div>`;$("#health i").style.background="var(--good)"}catch{}}

async function listDir(path){return api("/api/files/list?path="+encodeURIComponent(path))}
async function renderProjects(){
 let d;try{d=await listDir(state.home)}catch(e){return errorView(e.message)}
 const dirs=d.items.filter(x=>x.type==="dir"&&!x.name.startsWith("."));
 $("#main").innerHTML=`<div class="view"><div class="view-head"><div><div class="eyebrow">Workspace</div><h1>Projetos</h1><p>Abra uma pasta como seu espaço de trabalho.</p></div><div class="actions"><button class="secondary" onclick="cloneRepo()">↓ Clonar GitHub</button><button class="primary" onclick="newProject()">＋ Novo projeto</button></div></div>
 <div class="toolbar"><span>⌂</span><input id="projectFilter" placeholder="Filtrar pastas…"><span class="muted">${dirs.length} pastas</span></div>
 <div class="grid grid-3" id="projectGrid">${dirs.map(x=>`<button class="card click project-card" data-name="${esc(x.name)}" onclick="openProject(${JSON.stringify(x.path)},${JSON.stringify(x.name)})"><div style="font-size:25px">📁</div><div style="margin-top:10px;font-weight:650">${esc(x.name)}</div><div class="muted" style="font-size:11px;margin-top:4px">Abrir workspace</div></button>`).join("")||`<div class="card empty"><b>Nenhum projeto aqui</b>Crie seu primeiro projeto.</div>`}</div></div>`;
 $("#projectFilter").oninput=e=>$$(".project-card").forEach(c=>c.style.display=c.dataset.name.toLowerCase().includes(e.target.value.toLowerCase())?"":"none");
}
async function openProject(path,name){state.project={path,name};state.cwd=path;state.openFiles.clear();state.active=null;await refreshGit();toast(`Projeto “${name}” aberto`);route("editor")}
async function newProject(){showModal("Novo projeto",`<div class="row"><label>Nome da pasta</label><input id="newName" placeholder="meu-projeto" autofocus></div><div class="row"><label>Onde criar</label><input id="newParent" value="${esc(rel(state.home))}"></div>`,async()=>{let n=$("#newName").value.trim(),p=$("#newParent").value.trim()||"~";if(!n)return;const d=await api("/api/files/mkdir",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:p+"/"+n})});await openProject(d.path,n);closeModal()})}
async function cloneRepo(){showModal("Clonar repositório",`<div class="row"><label>URL do GitHub</label><input id="cloneUrl" placeholder="https://github.com/usuario/projeto.git"></div><div class="row"><label>Pasta destino</label><input id="cloneDest" value="~"></div>`,async()=>{const u=$("#cloneUrl").value.trim();if(!u)return;const d=await api("/api/git/clone",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:u,dest:$("#cloneDest").value.trim()||"~"})});closeModal();const name=d.path.split("/").pop();await openProject(d.path,name);toast("Repositório clonado")})}

async function renderFiles(path){
 let d;try{d=await listDir(path)}catch(e){return errorView(e.message)}
 state.cwd=path;
 $("#main").innerHTML=`<div class="view"><div class="view-head"><div><div class="eyebrow">Explorador</div><h1>Arquivos</h1><p class="mono">${esc(rel(path))}</p></div><div class="actions"><button class="secondary" onclick="chooseDir()">⌂ Ir para pasta</button><button class="primary" onclick="createFile()">＋ Arquivo</button></div></div>
 <div class="card" style="padding:7px"><div class="list">${d.items.map(x=>`<div class="list-row click" onclick='fileClick(${JSON.stringify(x.path)},${JSON.stringify(x.type)},${JSON.stringify(x.name)})'><span style="font-size:17px">${fileIcon(x.name,x.type)}</span><div class="grow"><b>${esc(x.name)}</b><small>${x.type==="dir"?"Pasta":bytes(x.size||0)}</small></div><span>›</span></div>`).join("")||`<div class="empty">Pasta vazia</div>`}</div></div></div>`;
}
async function fileClick(path,type,name){if(type==="dir")return renderFiles(path);openFile(path,name)}
async function chooseDir(){showModal("Abrir pasta",`<div class="row"><label>Caminho</label><input id="dirPath" value="${esc(rel(state.cwd))}" placeholder="~"></div><div class="muted">Você pode usar o seletor de projetos para evitar caminhos.</div>`,async()=>{const p=$("#dirPath").value.trim()||"~";try{const d=await listDir(p);closeModal();renderFiles(d.path)}catch(e){toast(e.message)}})}
async function createFile(){showModal("Novo arquivo",`<div class="row"><label>Nome</label><input id="fileName" placeholder="index.js"></div>`,async()=>{const n=$("#fileName").value.trim();if(!n)return;await api("/api/files/write",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.cwd+"/"+n,content:""})});closeModal();openFile(state.cwd+"/"+n,n)})}

async function loadTree(root){
 try{const d=await api("/api/files/tree?path="+encodeURIComponent(root)+"&depth=5");state.tree=d.tree;return d.tree}catch(e){return[]}
}
function treeHtml(nodes,depth=0){return nodes.map(n=>`<div class="tree-node"><div class="tree-line ${state.active===n.path?"active":""}" style="padding-left:${6+depth*2}px" onclick='${n.type==="dir"?`toggleDir(this,${JSON.stringify(n.path)})`:`openFile(${JSON.stringify(n.path)},${JSON.stringify(n.name)})`}'><span class="chev">${n.type==="dir"?"›":""}</span><span class="ico">${fileIcon(n.name,n.type)}</span><span class="name">${esc(n.name)}</span></div>${n.type==="dir"?`<div class="tree-children" data-dir="${esc(n.path)}" style="display:none"></div>`:""}</div>`).join("")}
async function toggleDir(el,path){const box=el.parentElement.querySelector(".tree-children");if(box.style.display==="none"){if(!box.dataset.loaded){const d=await api("/api/files/tree?path="+encodeURIComponent(path)+"&depth=4");box.innerHTML=treeHtml(d.tree);box.dataset.loaded="1"}box.style.display="block";el.querySelector(".chev").textContent="⌄"}else{box.style.display="none";el.querySelector(".chev").textContent="›"}}

async function renderEditor(){
 if(!state.project){return renderProjects()}
 await loadTree(state.project.path);
 $("#main").innerHTML=`<div class="workspace"><div class="tree"><div class="tree-head"><b>${esc(state.project.name)}</b><div class="tree-tools"><button onclick="createFile()">＋</button><button onclick="refreshEditor()">↻</button></div></div><div class="tree-root">${treeHtml(state.tree)}</div></div><div class="editor-area"><div class="tabs" id="tabs"></div><div class="editor-toolbar"><button onclick="saveActive()">Salvar</button><button onclick="duplicateActive()">Duplicar</button><button onclick="showFileMenu()">Mais</button><span class="muted" id="saveState"></span></div><div class="editor-shell" id="editorShell"><div class="line-numbers" id="lineNumbers">1</div><textarea id="codeInput" class="code-input" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div><div class="editor-status"><span id="langStatus">texto</span><span id="cursorStatus">Ln 1, Col 1</span><span class="push" id="fileStatus">—</span></div></div></div>`;
 renderTabs();bindEditor();if(state.active)activateFile(state.active);else emptyEditor();
}
function emptyEditor(){$("#codeInput").value="";$("#codeInput").placeholder="Abra um arquivo no explorador para começar…";$("#codeInput").disabled=true}
async function openFile(path,name){
 let f=state.openFiles.get(path);
 if(!f){try{const d=await api("/api/files/read?path="+encodeURIComponent(path));if(d.error)return toast(d.error);f={path,name,content:d.content,dirty:false};state.openFiles.set(path,f)}catch(e){return toast(e.message)}}
 state.active=path;
 if(state.view!=="editor" || !state.windows.get("editor")){await route("editor");}
 else {const w=state.windows.get("editor");focusWindow(w);renderTabs();bindEditor();activateFile(path)}
}
function renderTabs(){const t=$("#tabs");if(!t)return;t.innerHTML=[...state.openFiles.values()].map(f=>`<div class="tab ${state.active===f.path?"active":""}" onclick='activateFile(${JSON.stringify(f.path)})'><span>${fileIcon(f.name,"file")}</span><span style="overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</span>${f.dirty?"•":""}<span class="close" onclick='event.stopPropagation();closeFile(${JSON.stringify(f.path)})'>×</span></div>`).join("")}
function activateFile(path){const f=state.openFiles.get(path);if(!f)return;state.active=path;const input=$("#codeInput");if(!input)return;input.disabled=false;input.value=f.content;input.placeholder="";$("#langStatus").textContent=ext(f.name)||"texto";$("#fileStatus").textContent=rel(path);$("#saveState").textContent=f.dirty?"● não salvo":"salvo";renderTabs();updateLines();updateCursor();input.focus()}
function bindEditor(){const input=$("#codeInput");if(!input)return;input.oninput=()=>{const f=state.openFiles.get(state.active);if(f){f.content=input.value;f.dirty=true;$("#saveState").textContent="● não salvo"}updateLines();updateCursor()};input.onscroll=()=>{$("#lineNumbers").scrollTop=input.scrollTop};input.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveActive()}if(e.key==="Tab"){e.preventDefault();const a=input.selectionStart,b=input.selectionEnd;input.value=input.value.slice(0,a)+"  "+input.value.slice(b);input.selectionStart=input.selectionEnd=a+2;input.dispatchEvent(new Event("input"))}if(e.key==="Enter"){const pos=input.selectionStart;const line=input.value.slice(0,pos).split("\n").pop();const indent=(line.match(/^\s*/)||[""])[0];if(indent){e.preventDefault();const a=input.selectionStart,b=input.selectionEnd;input.value=input.value.slice(0,a)+"\n"+indent+input.value.slice(b);input.selectionStart=input.selectionEnd=a+1+indent.length;input.dispatchEvent(new Event("input"))}}};input.onkeyup=updateCursor}
function updateLines(){const n=($("#codeInput")?.value||"").split("\n").length;$("#lineNumbers").textContent=Array.from({length:n},(_,i)=>i+1).join("\n")}
function updateCursor(){const i=$("#codeInput");if(!i||!$("#cursorStatus"))return;const before=i.value.slice(0,i.selectionStart),line=before.split("\n").length,col=before.length-before.lastIndexOf("\n");$("#cursorStatus").textContent=`Ln ${line}, Col ${col}`}
async function saveActive(){const f=state.openFiles.get(state.active);if(!f)return;try{await api("/api/files/write",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:f.path,content:f.content})});f.dirty=false;$("#saveState").textContent="salvo";renderTabs();toast("Arquivo salvo")}catch(e){toast(e.message)}}
async function closeFile(path){const f=state.openFiles.get(path);if(f?.dirty&&!confirm("Este arquivo tem alterações. Fechar mesmo assim?"))return;state.openFiles.delete(path);state.active=[...state.openFiles.keys()].pop()||null;renderTabs();if(state.active)activateFile(state.active);else emptyEditor()}
async function refreshEditor(){if(state.project){await loadTree(state.project.path);await refreshWindow("editor")}}
function duplicateActive(){const f=state.openFiles.get(state.active);if(!f)return;toast("Use Salvar como pelo terminal por enquanto.")}
function showFileMenu(){toast("Atalhos: Ctrl/⌘+S salva · Tab indenta · Enter preserva indentação")}

function markdownToHtml(md){let s=esc(md);s=s.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/^\> (.*)$/gm,"<blockquote>$1</blockquote>").replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/\*([^*]+)\*/g,"<i>$1</i>").replace(/^\- (.*)$/gm,"• $1").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>");return"<p>"+s+"</p>"}
async function renderMarkdown(){
 const sample="# Minha nota\n\nEscreva **Markdown** aqui. O preview atualiza enquanto você digita.\n\n- Ideias\n- Documentação\n- Checklist\n\n```js\nconsole.log('FlowOS');\n```";
 $("#main").innerHTML=`<div class="md-split"><div class="md-edit"><div class="editor-toolbar"><button onclick="saveMarkdown()">Salvar nota</button><button onclick="loadMarkdown()">Abrir .md</button></div><textarea id="mdInput" spellcheck="false" placeholder="# Minha nota">${sample}</textarea></div><div class="md-preview" id="mdPreview"></div></div>`;
 $("#mdInput").oninput=e=>$("#mdPreview").innerHTML=markdownToHtml(e.target.value);$("#mdPreview").innerHTML=markdownToHtml(sample)
}
async function saveMarkdown(){const n=prompt("Nome do arquivo","nota.md");if(!n)return;const p=(state.project?.path||state.home)+"/"+(n.endsWith(".md")?n:n+".md");await api("/api/files/write",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:p,content:$("#mdInput").value})});toast("Nota salva");openFile(p,n)}
async function loadMarkdown(){if(state.project){const d=await api("/api/files/list?path="+encodeURIComponent(state.project.path));const m=d.items.find(x=>x.type==="file"&&ext(x.name)==="md");if(m){const f=await api("/api/files/read?path="+encodeURIComponent(m.path));$("#mdInput").value=f.content;$("#mdPreview").innerHTML=markdownToHtml(f.content);toast(m.name)}}}

async function refreshGit(){if(!state.project){state.git=null;return}try{state.git=await api("/api/git/status?path="+encodeURIComponent(state.project.path))}catch{state.git=null}$("#gitBadge")?.classList.toggle("on",!!state.git&&!state.git.clean)}
async function renderGit(){
 if(!state.project)return $("#main").innerHTML=`<div class="view"><div class="empty"><b>Abra um projeto primeiro</b><button class="primary" onclick="route('projects')">Escolher projeto</button></div></div>`;
 await refreshGit();const g=state.git;
 $("#main").innerHTML=`<div class="view"><div class="view-head"><div><div class="eyebrow">Versionamento</div><h1>${esc(state.project.name)}</h1><p>Fluxo simples de Git, inspirado no GitHub Desktop.</p></div><div class="actions"><button class="secondary" onclick="pullGit()">↓ Pull</button><button class="primary" onclick="pushGit()">↑ Push</button></div></div>
 <div class="git-layout"><div class="card"><div class="card-title">Alterações <small class="branch">⎇ ${esc(g?.branch||"sem Git")}</small></div>${g?.files?.length?`<div>${g.files.map((f,i)=>`<div class="change"><span class="status-letter">${f.status[0]||"?"}</span><span class="file">${esc(f.file)}</span><span class="badge">${f.staged?"staged":"alterado"}</span><button class="icon-btn" onclick='toggleStage(${JSON.stringify(f.file)},${f.staged})'>${f.staged?"−":"＋"}</button></div>`).join("")}</div>`:`<div class="empty"><b>${g?"Tudo limpo":"Não é um repositório Git"}</b>${g?"Nenhuma alteração pendente.":"Inicialize este projeto para começar."}</div>`}</div>
 <div><div class="card commit-box"><div class="card-title">Commit</div><textarea id="commitMsg" placeholder="Ex.: cria tela inicial"></textarea><button class="primary" style="width:100%" onclick="commitGit()">Commitar alterações</button></div><div class="card" style="margin-top:13px"><div class="card-title">Repositório</div><div id="remoteBox" class="muted">Carregando…</div><button class="secondary" style="margin-top:10px;width:100%" onclick="repoSetup()">${g?"Configurar remoto":"Inicializar Git"}</button></div></div></div></div>`;
 loadRemotes()
}
async function loadRemotes(){try{const d=await api("/api/git/remotes?path="+encodeURIComponent(state.project.path));$("#remoteBox").innerHTML=d.remotes.length?d.remotes.map(r=>`<div class="mono" style="font-size:11px;overflow:hidden;text-overflow:ellipsis">${esc(r.url)}</div>`).join(""):"<span>Nenhum remoto configurado</span>"}catch{}}
async function toggleStage(file,staged){await api(staged?"/api/git/unstage":"/api/git/add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path,files:[file]})});renderGit()}
async function commitGit(){const msg=$("#commitMsg").value.trim();if(!msg)return toast("Escreva a mensagem do commit");try{await api("/api/git/add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path})});await api("/api/git/commit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path,message:msg})});toast("Commit criado");renderGit()}catch(e){toast(e.message)}}
async function pushGit(){try{await api("/api/git/push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path})});toast("Push concluído");renderGit()}catch(e){toast(e.message)}}
async function pullGit(){try{await api("/api/git/pull",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path})});toast("Pull concluído");renderGit()}catch(e){toast(e.message)}}
async function repoSetup(){if(!state.git){try{await api("/api/git/init",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path})});toast("Git inicializado");renderGit()}catch(e){toast(e.message)};return}showModal("Configurar remoto",`<div class="row"><label>URL do GitHub</label><input id="remoteUrl" placeholder="https://github.com/usuario/projeto.git"></div>`,async()=>{const u=$("#remoteUrl").value.trim();if(!u)return;try{await api("/api/git/remote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:state.project.path,url:u})});closeModal();toast("Remoto configurado");renderGit()}catch(e){toast(e.message)}})}

function renderTerminal(){ $("#main").innerHTML=`<div class="terminal-page"><div class="view-head"><div><div class="eyebrow">Shell real</div><h1>Terminal</h1><p>Executa comandos no mesmo ambiente do Termux.</p></div></div><div class="terminal-box"><div id="pageTermOut" class="term-output"></div><div class="term-input-row"><span id="pageTermPrompt">~ $</span><input id="pageTermInput" placeholder="npm install, git status, python…"></div></div></div>`;const i=$("#pageTermInput");i.onkeydown=e=>{if(e.key==="Enter"){runTerminal(i.value,$("#pageTermOut"),$("#pageTermPrompt"));i.value=""}if(e.key==="ArrowUp"){e.preventDefault();if(state.termHistory.length){state.termIndex=Math.max(0,state.termIndex-1);i.value=state.termHistory[state.termIndex]||""}}};i.focus()}
function appendTerm(out,text,cls=""){const d=document.createElement("div");d.className="term-line "+cls;d.textContent=text;out.appendChild(d);out.scrollTop=out.scrollHeight}
async function runTerminal(cmd,out,prompt){if(!cmd.trim())return;state.termHistory.push(cmd);state.termIndex=state.termHistory.length;appendTerm(out,(prompt?.textContent||rel(state.cwd)+" $")+" "+cmd,"cmd");try{const d=await api("/api/terminal/exec",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cmd,cwd:state.cwd})});if(d.output)appendTerm(out,d.output);state.cwd=d.cwd;state.cwd&&(prompt.textContent=rel(state.cwd)+" $")}catch(e){appendTerm(out,e.message,"err")}}

async function renderProcesses(){let d;try{d=await api("/api/processes")}catch(e){return errorView(e.message)}$("#main").innerHTML=`<div class="view"><div class="view-head"><div><div class="eyebrow">Sistema</div><h1>Processos</h1><p>Veja o que está rodando e encerre processos quando necessário.</p></div><div class="actions"><button class="secondary" onclick="route('processes')">↻ Atualizar</button></div></div><div class="card"><div class="list">${(d.processes||[]).map(p=>`<div class="list-row"><span class="mono">${p.pid}</span><div class="grow"><b>${esc(p.command||p.cmd||"processo")}</b><small>${esc(p.user||"")}</small></div><button class="secondary danger" onclick="killProcess(${p.pid})">Encerrar</button></div>`).join("")}</div></div></div>`}
async function killProcess(pid){try{await api("/api/processes/kill",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pid})});toast("Processo encerrado");route("processes")}catch(e){toast(e.message)}}

async function renderSystem(){let d;try{d=await api("/api/system")}catch(e){return errorView(e.message)}const mem=d.memory||{};const disk=d.disk||{};$("#main").innerHTML=`<div class="view"><div class="view-head"><div><div class="eyebrow">Termux</div><h1>Status do sistema</h1><p>Informações reais do ambiente onde o FlowOS está executando.</p></div></div><div class="system-grid"><div class="card"><div class="stat-label">CPU</div><div class="stat-value">${d.cpu?.cores||"—"} núcleos</div><div class="stat-sub">${esc(d.cpu?.model||"")}</div></div><div class="card"><div class="stat-label">Memória</div><div class="stat-value">${bytes(mem.used)}</div><div class="stat-sub">de ${bytes(mem.total)}</div><div class="progress"><i style="width:${mem.total?mem.used/mem.total*100:0}%"></i></div></div><div class="card"><div class="stat-label">Disco</div><div class="stat-value">${bytes(disk.used)}</div><div class="stat-sub">de ${bytes(disk.total)}</div></div></div><div class="card" style="margin-top:13px"><div class="card-title">Detalhes</div><div class="kv"><span>Hostname</span><b>${esc(d.hostname)}</b><span>Plataforma</span><b>${esc(d.platform)} · ${esc(d.arch)}</b><span>Kernel</span><b>${esc(d.kernel)}</b><span>Node</span><b>${esc(d.node)}</b><span>Shell</span><b class="mono">${esc(d.shell)}</b><span>Home</span><b class="mono">${esc(d.home)}</b><span>Wi‑Fi</span><b>${esc(d.wifi||"não identificado")}</b></div></div></div>`}

async function renderSettings(){let c={};try{c=await api("/api/git/config")}catch{}$("#main").innerHTML=`<div class="view"><div class="view-head"><div><div class="eyebrow">Preferências</div><h1>Ajustes</h1><p>Configuração do ambiente e do GitHub.</p></div></div><div class="settings"><div class="card"><div class="card-title">Git / GitHub</div><div class="setting"><div class="grow"><b>Nome do Git</b><small>Usado nos commits</small></div><input id="gitUser" value="${esc(c.user||"")}"></div><div class="setting"><div class="grow"><b>Email</b><small>Usado nos commits</small></div><input id="gitEmail" value="${esc(c.email||"")}"></div><div class="setting"><div class="grow"><b>Token do GitHub</b><small>${c.hasToken?"Token salvo com segurança no servidor":"Configure um token para fazer push privado/autenticado"}</small></div><input id="gitToken" type="password" placeholder="${c.hasToken?"••••••••":"ghp_…"}"></div><div style="margin-top:13px;text-align:right"><button class="primary" onclick="saveGitConfig()">Salvar Git</button></div></div><div class="card" style="margin-top:13px"><div class="card-title">Aparência</div><div class="setting"><div class="grow"><b>Tema</b><small>Claro ou escuro</small></div><select class="select" id="themeSelect" onchange="setTheme(this.value)"><option value="dark">Escuro</option><option value="light">Claro</option></select></div><div class="setting"><div class="grow"><b>Senha</b><small>A senha é definida no arquivo .env</small></div><span class="badge">Termux</span></div></div><div class="card" style="margin-top:13px"><div class="card-title">Sessão</div><button class="secondary" onclick="logout()">Sair do FlowOS</button></div></div></div>`;$("#themeSelect").value=document.documentElement.dataset.theme}
async function saveGitConfig(){await api("/api/git/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user:$("#gitUser").value,email:$("#gitEmail").value,token:$("#gitToken").value})});toast("Configuração do Git salva")}
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem("flowos.theme",t)}
async function logout(){await api("/api/logout",{method:"POST"});showLogin()}

function showModal(title,body,ok){const m=$("#modal");m.classList.remove("hidden");m.innerHTML=`<div class="modal-card"><h3>${esc(title)}</h3>${body}<div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" id="modalOk">Continuar</button></div></div>`;$("#modalOk").onclick=async()=>{try{await ok()}catch(e){toast(e.message)}};setTimeout(()=>m.querySelector("input")?.focus(),30)}
function closeModal(){$("#modal").classList.add("hidden");$("#modal").innerHTML=""}
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()}
function errorView(msg){$("#main").innerHTML=`<div class="view"><div class="empty"><b>Não foi possível carregar</b>${esc(msg)}</div></div>`}

document.addEventListener("keydown",e=>{
 if(e.altKey&&e.key==="Tab"){e.preventDefault();const wins=[...state.windows.values()].filter(w=>!w.classList.contains("minimized"));if(wins.length>1){const active=wins.findIndex(w=>w.classList.contains("focused"));const next=wins[(active+1)%wins.length];focusWindow(next)}}
 if((e.ctrlKey||e.metaKey)&&e.altKey&&e.key.toLowerCase()==="t"){e.preventDefault();route("terminal")}
});

window.route=route;window.taskbarOpen=taskbarOpen;window.toggleLauncher=toggleLauncher;window.closeAppWindow=closeAppWindow;window.minimizeWindow=minimizeWindow;window.maximizeWindow=maximizeWindow;window.openProject=openProject;window.newProject=newProject;window.cloneRepo=cloneRepo;window.fileClick=fileClick;window.openFile=openFile;window.createFile=createFile;window.chooseDir=chooseDir;window.toggleDir=toggleDir;window.saveActive=saveActive;window.closeFile=closeFile;window.activateFile=activateFile;window.duplicateActive=duplicateActive;window.showFileMenu=showFileMenu;window.saveMarkdown=saveMarkdown;window.loadMarkdown=loadMarkdown;window.toggleStage=toggleStage;window.commitGit=commitGit;window.pushGit=pushGit;window.pullGit=pullGit;window.repoSetup=repoSetup;window.killProcess=killProcess;window.saveGitConfig=saveGitConfig;window.setTheme=setTheme;window.logout=logout;window.closeModal=closeModal;window.refreshEditor=refreshEditor;
const savedTheme=localStorage.getItem("flowos.theme");if(savedTheme)document.documentElement.dataset.theme=savedTheme;
setInterval(()=>{if(state.view==="home")updateMetrics();const c=$("#taskClock");if(c)c.textContent=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});},5000);
boot();
})();