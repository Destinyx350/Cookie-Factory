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
async function kfPing(){
  if(!kfOk()||document.hidden) return;
  try{kfLive=await lbApi('rpc/kf_ping',{p_id:kfId(),p_baked:lbCheat()?0:Math.floor(Math.min(S.all,9.9e299))});kfV3=true;if(kfLive&&kfLive.cfg) cfgApply(kfLive.cfg);}catch(x){kfNote(x);}
  renderLive();
}
function renderLive(){
  const L=kfLive,t=L?'🌍 '+(L.online===1?tt('1 Bäckerei online','1 bakery online'):fmt(L.online)+tt(' Bäckereien online',' bakeries online'))+' · '+fmt(L.total)+tt(' Kekse weltweit gebacken',' cookies baked worldwide'):'';
  ['stLive','lbLive'].forEach(id=>{const e=$id(id);if(!e) return;e.hidden=!t;if(e.textContent!==t) e.textContent=t;});
}

/* Cloud: Spielstand per Code auf ein anderes Gerät */
let cloudArm=0;
const fmtCloud=c=>'KEKS-'+c.slice(0,4)+'-'+c.slice(4,8);
$id('cloudUp').addEventListener('click',async()=>{
  const b=$id('cloudUp'),box=$id('cloudCode'),msg=$id('cloudMsg');msg.className='nameerr';msg.textContent='';
  if(!lbOn()){msg.textContent=tt('Online-Funktionen sind nicht eingerichtet.','Online features aren’t set up.');return;}
  b.disabled=true;b.textContent=tt('Lädt hoch …','Uploading …');
  try{
    save();const r=await lbApi('rpc/save_upload',{p_data:enc(sealJSON(S))});kfV3=true;
    const code=fmtCloud(r.code),until=new Date(r.expires_at).toLocaleString(LOC[LANG],{weekday:'short',hour:'2-digit',minute:'2-digit'});
    box.hidden=false;box.innerHTML='<b class="ccode">'+code+'</b><small>'+tt('Gültig bis ','Valid until ')+until+tt('. Gib ihn auf dem anderen Gerät unter Einstellungen → Speichern ein.','. Enter it on your other device under Settings → Saving.')+'</small><button type="button" class="btn sm" id="cloudCopy">'+tt('Kopieren','Copy')+'</button>';
    box.dataset.code=code;
  }catch(x){kfNote(x);msg.textContent=lbMissing(x)?tt('Die Datenbank kennt diese Funktion noch nicht.','The database doesn’t have this feature yet.'):/too many requests/.test(String(x&&x.message))?tt('Zu viele Codes von diesem Gerät. Versuch es in einer Stunde nochmal.','Too many codes from this device. Try again in an hour.'):tt('Hochladen hat nicht geklappt. Prüfe dein Internet.','Upload didn’t work. Check your internet.');}
  b.disabled=false;updV42Txt();
});
$id('cloudCode').addEventListener('click',async e=>{
  if(!e.target.closest('#cloudCopy')) return;
  const c=$id('cloudCode').dataset.code;try{await navigator.clipboard.writeText(c);toast(tt('Code kopiert!','Code copied!'));}catch(x){toast(c);}
});
$id('cloudForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const inp=$id('cloudIn'),msg=$id('cloudMsg'),go=$id('cloudGo');msg.className='nameerr';
  const raw=inp.value.trim();if(!raw){msg.textContent=tt('Gib zuerst einen Code ein.','Enter a code first.');inp.focus();return;}
  if(S.opt.ask!==false&&!cloudArm){go.classList.add('armed');go.textContent=tt('Ersetzt dein Spiel! Nochmal','Replaces your game! Again');cloudArm=setTimeout(()=>{cloudArm=0;go.classList.remove('armed');updV42Txt();},5000);return;}
  clearTimeout(cloudArm);cloudArm=0;go.classList.remove('armed');go.disabled=true;go.textContent=tt('Lädt …','Loading …');
  try{
    const t=await lbApi('rpc/save_download',{p_code:raw});kfV3=true;
    let o=null;try{o=JSON.parse(dec(String(t)));}catch(x){try{o=JSON.parse(String(t));}catch(y){o=null;}}
    if(!o||typeof o!=='object'||typeof o.cookies!=='number') throw new Error('bad save');
    try{pushBackup();}catch(x){}
    const s=sanitize(o);if(!s.name) s.name=S.name;
    if(s.tamp) setTimeout(tampWarn,400);
    S=s;S.t=Date.now();LANG=S.opt.lang;els.fx.checked=S.opt.fx;
    applyLang();rebuildAll();save();slotSig='';inp.value='';
    msg.className='nameerr ok';msg.textContent=tt('Spielstand geladen','Save loaded')+(S.name?': '+S.name:'')+'.';
    toast(tt('Spielstand aus der Cloud geladen. Dein altes Spiel liegt unter Backups.','Save loaded from the cloud. Your old game is under Backups.'),true);
  }catch(x){
    kfNote(x);const m=String(x&&x.message||'');
    msg.textContent=/unknown or expired/.test(m)?tt('Diesen Code gibt es nicht oder er ist abgelaufen (Codes gelten 24 Stunden).','That code doesn’t exist or has expired (codes last 24 hours).'):/bad save/.test(m)?tt('Unter diesem Code liegt kein gültiger Spielstand.','There’s no valid save under this code.'):lbMissing(x)?tt('Die Datenbank kennt diese Funktion noch nicht.','The database doesn’t have this feature yet.'):tt('Laden hat nicht geklappt. Prüfe dein Internet.','Loading didn’t work. Check your internet.');
  }
  go.disabled=false;updV42Txt();
});

function updV42Txt(){
  const set=(id,t)=>{const e=$id(id);if(e&&e.textContent!==t) e.textContent=t;};
  set('cloudT',tt('Auf ein anderes Gerät mitnehmen','Move to another device'));
  set('cloudP',tt('Erstelle einen Code und gib ihn auf deinem anderen Gerät ein. Der Code gilt 24 Stunden. Beim Laden wird dein aktuelles Spiel ersetzt und vorher als Backup gesichert.','Create a code and enter it on your other device. The code lasts 24 hours. Loading replaces your current game, which is kept as a backup first.'));
  if(!$id('cloudUp').disabled) set('cloudUp',tt('Transfer-Code erstellen','Create transfer code'));
  if(!cloudArm&&!$id('cloudGo').disabled) set('cloudGo',tt('Laden','Load'));
  $id('cloudIn').setAttribute('aria-label',tt('Transfer-Code','Transfer code'));
  renderLive();kfApplyEvents();
}

/* Zeitplan */
setInterval(()=>{kfApplyEvents();if(document.hidden) return;const n=Date.now();if(n-kfLastEv>120000) kfLoadEvents();if(n-kfLastNews>300000) kfLoadNews();},1000);
setInterval(kfPing,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){kfPing();kfLoadEvents();}});
if(lbOn()){setTimeout(kfLoadEvents,1500);setTimeout(kfPing,2500);setTimeout(kfLoadNews,6000);}
