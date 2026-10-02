/*══ Code Editor ══*/
(function(){
'use strict';
var textarea,lineNums,nameEl,curPath='',modified=false;

WM.register('editor',{title:'Editor',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  width:720,height:480,onOpen:init,onClose:()=>{textarea=null;window._editorLoad=null}});

window._editorLoad=null;

function init(body){
  body.innerHTML='<div class="editor"><div class="editor-bar"><span class="ed-name" id="edName">Sem título</span><button class="ed-btn" id="edOpen">Abrir</button><button class="ed-btn" id="edNew">Novo</button><button class="ed-btn primary" id="edSave">Salvar</button></div><div class="editor-area"><div class="ed-lines" id="edLines">1</div><textarea class="ed-textarea" id="edArea" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Comece a digitar ou abra um arquivo..."></textarea></div></div>';
  textarea=body.querySelector('#edArea');lineNums=body.querySelector('#edLines');nameEl=body.querySelector('#edName');
  textarea.addEventListener('input',onInput);
  textarea.addEventListener('scroll',()=>{lineNums.scrollTop=textarea.scrollTop});
  textarea.addEventListener('keydown',e=>{
    if(e.key==='Tab'){e.preventDefault();var s=textarea.selectionStart,en=textarea.selectionEnd;textarea.value=textarea.value.substring(0,s)+'  '+textarea.value.substring(en);textarea.selectionStart=textarea.selectionEnd=s+2;onInput()}
    if(e.key==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();save()}
  });
  body.querySelector('#edSave').onclick=save;
  body.querySelector('#edOpen').onclick=openDialog;
  body.querySelector('#edNew').onclick=()=>{curPath='';nameEl.textContent='Sem título';textarea.value='';modified=false;updateLines()};

  window._editorLoad=loadFile;
  updateLines();
}

function onInput(){modified=true;updateLines()}

function updateLines(){
  if(!textarea)return;
  var n=textarea.value.split('\n').length;
  var h='';for(var i=1;i<=n;i++)h+=i+'\n';
  lineNums.textContent=h;
}

async function loadFile(fp){
  if(!textarea)return;
  try{var r=await fetch('/api/files/read?path='+encodeURIComponent(fp));var d=await r.json();
    if(d.error){alert('Erro: '+d.error);return}
    textarea.value=d.content;curPath=fp;nameEl.textContent=d.name;modified=false;updateLines();textarea.focus();
  }catch(_){alert('Erro ao carregar arquivo')}
}

async function save(){
  if(!textarea)return;
  if(!curPath){curPath=prompt('Caminho completo do arquivo:');if(!curPath)return}
  try{var r=await fetch('/api/files/write',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:curPath,content:textarea.value})});
    var d=await r.json();if(d.ok){modified=false;nameEl.textContent=curPath.split('/').pop();alert('Salvo!')}else alert('Erro: '+d.error);
  }catch(_){alert('Erro ao salvar')}
}

function openDialog(){
  var fp=prompt('Caminho do arquivo:');if(fp)loadFile(fp);
}
})();
