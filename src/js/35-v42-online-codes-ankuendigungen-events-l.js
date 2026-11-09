/* ======================= V42: Online – Codes, Ankündigungen, Events, Live-Zähler, Cloud ======================= */
let kfV3=null,kfEvents=[],kfLive=null,kfLastEv=0,kfLastNews=0;
function kfId(){if(!S.lb.id){S.lb.id=lbUUID();save();}return S.lb.id;}
const kfOk=()=>lbOn()&&kfV3!==false&&navigator.onLine!==false;
const kfNote=x=>{if(lbMissing(x)) kfV3=false;};
const lsGet=k=>{try{return localStorage.getItem(k);}catch(x){return null;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(x){}};

/* Codes aus dem Admin-Panel */
async function kfRedeem(c){
  const r=await lbApi('rpc/redeem_code',{p_id:kfId(),p_code:c})||{};kfV3=true;
  const parts=[];
  if(r.gems){S.w.mat.gem+=r.gems;parts.push('+'+r.gems+' '+matName('gem'));}
  if(r.stars){S.w.star.n+=r.stars;S.w.star.all=Math.max(S.w.star.all||0,S.w.star.n);parts.push('+'+r.stars+' '+tt('Sternenkrümel','star crumbs'));}
  if(r.minutes){const g=Math.max(1000*r.minutes,C.kps0*60*r.minutes);addCk(g);parts.push('+'+fmt(g)+' '+tt('Kekse','cookies'));}
  recalc();save();render();
  return {label:r.label?escName(r.label):tt('Geschenk-Code','Gift code'),txt:parts.join(' · ')||tt('eingelöst','redeemed')};
}

/* Globale Events */
const EVK={prod:['Produktion','production'],click:['Klicks','clicks'],gold:['Goldkekse','golden cookies'],orders:['Aufträge','orders']};
const EVI={prod:'🏭',click:'👆',gold:'✨',orders:'📜'};
async function kfLoadEvents(){
  if(!kfOk()) return;kfLastEv=Date.now();
  try{const r=await lbApi('kf_events?select=id,kind,mult,title,starts_at,ends_at&order=ends_at.asc');kfEvents=Array.isArray(r)?r:[];kfV3=true;}catch(x){kfNote(x);}
  kfApplyEvents();
}
const kfActive=()=>{const n=Date.now();return kfEvents.filter(e=>n>=Date.parse(e.starts_at)&&n<Date.parse(e.ends_at)&&EVK[e.kind]);};
function kfApplyEvents(){
  const g={prod:1,click:1,gold:1,orders:1};
  kfActive().forEach(e=>{g[e.kind]=Math.min(10,g[e.kind]*Math.max(1,Math.min(10,+e.mult||1)));});
  const sig=JSON.stringify(g);if(sig!==kfApplyEvents._s){kfApplyEvents._s=sig;Object.assign(GEV,g);recalc();}
  const bar=$id('gevBar');if(!bar) return;
  const act=kfActive(),n=Date.now();
  const h=act.map(e=>'<span class="gev"><span aria-hidden="true">'+EVI[e.kind]+'</span><b>×'+(Math.round(e.mult*100)/100).toLocaleString(LOC[LANG])+' '+tx(EVK[e.kind])+'</b>'+(e.title?'<small>'+escName(e.title)+'</small>':'')+'<small>'+tt('noch ','')+lbLeft(Date.parse(e.ends_at)-n)+tt('',' left')+'</small></span>').join('');
  bar.hidden=!act.length;if(bar._h!==h){bar._h=h;bar.innerHTML=h;}
}

/* Ankündigungen */
async function kfLoadNews(){
  if(!kfOk()) return;kfLastNews=Date.now();
  let r;try{r=await lbApi('kf_news?select=id,title,body,created_at&order=id.desc&limit=5');kfV3=true;}catch(x){kfNote(x);return;}
  const seen=+(lsGet('keksfabrik-news-seen')||0),fresh=(r||[]).filter(n=>n.id>seen);
  if(!fresh.length) return;
  if(!startDone||!$id('rwOv').hidden||!$id('lbOv').hidden){kfLastNews=0;return;}
  lsSet('keksfabrik-news-seen',String(Math.max(...fresh.map(n=>n.id))));
  const html=fresh.slice(0,3).map(n=>'<div class="annc"><b>'+escName(n.title)+'</b>'+(n.body?'<p>'+escName(n.body).replace(/\n/g,'<br>')+'</p>':'')+'<small>'+new Date(n.created_at).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</small></div>').join('');
  lbShowMsg(tt('Neuigkeiten von der Keksfabrik','News from Cookie Factory'),html,'📢');
}

/* Live-Zähler */
var kfPingX=true;
async function kfPing(){
  if(!kfOk()||document.hidden) return;
  const pb={p_id:kfId(),p_baked:lbCheat()?0:Math.floor(Math.min(S.all,9.9e299))};
  /* V57: browser language, device and where the game runs, for the owner's dashboard (older servers don't know them yet) */
  if(kfPingX) Object.assign(pb,{p_lang:String(navigator.language||'').slice(0,2).toLowerCase(),p_dev:document.documentElement.dataset.device||null,p_src:window.KF_PORTAL?'portal':(matchMedia('(display-mode: standalone)').matches||navigator.standalone)?'app':'web'});
  try{kfLive=await lbApi('rpc/kf_ping',pb);kfV3=true;if(kfLive&&kfLive.cfg) cfgApply(kfLive.cfg);}
  catch(x){if(kfPingX&&lbMissing(x)){kfPingX=false;return kfPing();}kfNote(x);}
  renderLive();
}
function renderLive(){
  const L=kfLive,t=L?'🌍 '+(L.online===1?tt('1 Bäckerei online','1 bakery online'):fmt(L.online)+tt(' Bäckereien online',' bakeries online'))+' · '+fmt(L.total)+tt(' Kekse weltweit gebacken',' cookies baked worldwide'):'';
  ['stLive','lbLive'].forEach(id=>{const e=$id(id);if(!e) return;e.hidden=!t;if(e.textContent!==t) e.textContent=t;});
}

function updV42Txt(){
  const set=(id,t)=>{const e=$id(id);if(e&&e.textContent!==t) e.textContent=t;};
  renderLive();kfApplyEvents();
}

/* Zeitplan */
setInterval(()=>{kfApplyEvents();if(document.hidden) return;const n=Date.now();if(n-kfLastEv>120000) kfLoadEvents();if(n-kfLastNews>300000) kfLoadNews();},1000);
setInterval(kfPing,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){kfPing();kfLoadEvents();}});
if(lbOn()){setTimeout(kfLoadEvents,1500);setTimeout(kfPing,2500);setTimeout(kfLoadNews,6000);}
