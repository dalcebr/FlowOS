/*═══════════════════════════════════════════
  FlowOS v3 — server.js
  Auto-detects Termux shell path.
═══════════════════════════════════════════*/
require('dotenv').config();
const express=require('express'), cookieParser=require('cookie-parser'),
      crypto=require('crypto'), os=require('os'), fs=require('fs'),
      path=require('path'), {exec}=require('child_process');

const app=express(), PORT=+process.env.PORT||3000,
      USER=process.env.USERNAME||'flowos', PASS=process.env.PASSWORD||'1234';

/* ── Auto-detect shell (fixes Termux ENOENT) ── */
const SHELL=(()=>{
  const tries=[process.env.SHELL,(process.env.PREFIX||'')+'/bin/bash',
    (process.env.PREFIX||'')+'/bin/sh','/bin/bash','/bin/sh'];
  for(const s of tries){try{if(s&&fs.existsSync(s))return s}catch(_){}}
  return true;
})();

app.use(express.json({limit:'2mb'}));
app.use(cookieParser());

/* ── Sessions ── */
const sessions=new Map();
const tok=()=>crypto.randomBytes(32).toString('hex');
function auth(q,r,n){const t=q.cookies.sid;if(t&&sessions.has(t)){q.sess=sessions.get(t);return n()}r.status(401).json({error:'unauthorized'})}

/* ── Auth ── */
app.get('/api/whoami',(q,r)=>{const t=q.cookies.sid;if(t&&sessions.has(t))return r.json({user:USER});r.status(401).json({ok:false})});
app.post('/api/login',(q,r)=>{
  if(q.body.password!==PASS)return r.status(403).json({error:'wrong'});
  const s=tok();sessions.set(s,{ts:Date.now(),cwd:os.homedir()});
  r.cookie('sid',s,{httpOnly:true,sameSite:'lax',maxAge:43200000});
  r.json({ok:true,user:USER});
});
app.post('/api/logout',(q,r)=>{const t=q.cookies.sid;if(t)sessions.delete(t);r.clearCookie('sid');r.json({ok:true})});

/* ── Metrics (cached 2.5s) ── */
let mC={cpu:0,mem:0,ts:0},pS=cpuS();
function cpuS(){let i=0,t=0;for(const c of os.cpus()){for(const v of Object.values(c.times))t+=v;i+=c.times.idle}return{i,t}}
function met(){const n=Date.now();if(n-mC.ts<2500)return mC;const s=cpuS(),di=s.i-pS.i,dt=s.t-pS.t;pS=s;
  const tm=os.totalmem(),fm=os.freemem();mC={cpu:dt?Math.round((1-di/dt)*100):0,mem:Math.round(((tm-fm)/tm)*100),ts:n};return mC}
app.get('/api/metrics',auth,(_,r)=>{const m=met();r.json({cpu:m.cpu,mem:m.mem})});

/* ── System info (cached 5s) ── */
let sC={d:null,ts:0};
const rd=p=>{try{return fs.readFileSync(p,'utf8').trim()}catch(_){return null}};
app.get('/api/system',auth,(_,r)=>{
  const n=Date.now();if(sC.d&&n-sC.ts<5000)return r.json(sC.d);
  const cpus=os.cpus(),tm=os.totalmem(),fm=os.freemem();
  const nets=[];for(const[nm,as]of Object.entries(os.networkInterfaces()))for(const a of as)if(a.family==='IPv4')nets.push({name:nm,ip:a.address,mac:a.mac,internal:a.internal});
  let bat=null;const cap=rd('/sys/class/power_supply/battery/capacity'),st=rd('/sys/class/power_supply/battery/status'),tmp=rd('/sys/class/power_supply/battery/temp');
  if(cap!==null){bat={level:+cap,status:st||'Unknown'};if(tmp!==null)bat.temp=(+tmp/10).toFixed(1)}
  let disk=null;try{const p=require('child_process').execSync('df -B1 '+os.homedir()+' 2>/dev/null').toString().trim().split('\n')[1]?.split(/\s+/);if(p)disk={total:+p[1],used:+p[2],free:+p[3],mount:p[5]}}catch(_){}
  let wifi=null;try{const w=require('child_process').execSync("iwgetid -r 2>/dev/null||echo ''").toString().trim();if(w)wifi=w}catch(_){}
  const d={hostname:os.hostname(),platform:os.platform(),arch:os.arch(),kernel:os.release(),uptime:os.uptime(),
    nodeVersion:process.version,shellPath:typeof SHELL==='string'?SHELL:'auto',
    cpu:{model:cpus[0]?.model?.trim()||'Unknown',cores:cpus.length,speed:cpus[0]?.speed||0},
    memory:{total:tm,free:fm,used:tm-fm},network:nets,wifi,battery:bat,disk,user:USER};
  sC={d,ts:n};r.json(d);
});

/* ── Terminal ── */
app.post('/api/terminal/exec',auth,(q,r)=>{
  const cmd=(q.body.cmd||'').trim(),cwd=q.body.cwd||q.sess.cwd||os.homedir();
  if(!cmd)return r.json({output:'',cwd});
  exec(cmd+'\necho "__FCWD__"\npwd',{cwd,shell:SHELL,timeout:30000,maxBuffer:512*1024,
    env:{...process.env,TERM:'dumb',COLUMNS:'120',LINES:'40'}},(e,so,se)=>{
    let out=so||'',nc=cwd;const i=out.lastIndexOf('__FCWD__');
    if(i!==-1){const a=out.substring(i+'__FCWD__'.length).trim();if(a)nc=a.split('\n')[0].trim();out=out.substring(0,i)}
    if(e&&!out&&!se)out='Error: '+(e.killed?'timeout 30s':e.message)+'\n';
    if(se)out+=se;q.sess.cwd=nc;r.json({output:out,cwd:nc});
  });
});

/* ── Files ── */
app.get('/api/files/list',auth,(q,r)=>{
  const dir=q.query.path||os.homedir();
  try{const ents=fs.readdirSync(dir,{withFileTypes:true});
    const items=ents.map(e=>{let s=null;try{s=fs.statSync(path.join(dir,e.name))}catch(_){}
      return{name:e.name,type:e.isDirectory()?'dir':'file',size:s?.size||0,modified:s?.mtimeMs||0}})
    .sort((a,b)=>a.type!==b.type?(a.type==='dir'?-1:1):a.name.localeCompare(b.name));
    r.json({path:dir,parent:path.dirname(dir),items,home:os.homedir()});
  }catch(e){r.status(400).json({error:e.message})}
});
app.get('/api/files/read',auth,(q,r)=>{
  const fp=q.query.path;if(!fp)return r.status(400).json({error:'path required'});
  try{const s=fs.statSync(fp);if(s.size>1024*1024)return r.json({error:'too_large',size:s.size});
    r.json({content:fs.readFileSync(fp,'utf8'),size:s.size,name:path.basename(fp)})}
  catch(e){r.status(400).json({error:e.message})}
});
app.post('/api/files/write',auth,(q,r)=>{try{fs.writeFileSync(q.body.path,q.body.content||'','utf8');r.json({ok:true})}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/files/mkdir',auth,(q,r)=>{try{fs.mkdirSync(q.body.path,{recursive:true});r.json({ok:true})}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/files/delete',auth,(q,r)=>{try{fs.rmSync(q.body.path,{recursive:true,force:true});r.json({ok:true})}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/files/rename',auth,(q,r)=>{try{fs.renameSync(q.body.from,q.body.to);r.json({ok:true})}catch(e){r.status(400).json({error:e.message})}});

/* ── Static ── */
app.use(express.static(path.join(__dirname,'public')));
app.get('*',(_,r)=>r.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT,'0.0.0.0',()=>{
  console.log(`\n  ⚡ FlowOS v3.0 — http://localhost:${PORT}`);
  for(const[n,as]of Object.entries(os.networkInterfaces()))for(const a of as)if(a.family==='IPv4'&&!a.internal)console.log(`  📡 http://${a.address}:${PORT}`);
  console.log(`  👤 ${USER}  |  🐚 ${SHELL}\n`);
});
