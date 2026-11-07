/* ======================= V51: Absturzberichte, Spieler-Weg, Chat-Reaktionen ======================= */
var v51Ready=false;

/* ---------- Absturzberichte: Fehler gehen anonym an den Server (höchstens 5 pro Sitzung) ---------- */
let errSent=0,errBusy=false,errOff=false;const errSeen={};
const errNoise=m=>!m||/^Script error\.?$/i.test(m)||/ResizeObserver loop|Failed to fetch|NetworkError|Load failed|AbortError|QuotaExceeded|chrome-extension|moz-extension|safari-extension/i.test(m);
async function errFlush(){
  const Q=window.__kfErrQ||[];
  if(errBusy||errOff||!lbOn()) return;
  errBusy=true;
  while(Q.length){
    const e=Q.shift(),k=e.m+'|'+e.src;
    if(errNoise(e.m)||errSeen[k]||errSent>=5) continue;
    errSeen[k]=1;errSent++;
    try{await lbApi('rpc/kf_report_error',{p_msg:e.m,p_stack:e.st,p_src:e.src,p_ver:NEWS_VER,p_ua:String(navigator.userAgent||'').slice(0,200)});}
    catch(x){if(lbMissing(x)){errOff=true;break;}}
  }
  errBusy=false;
}
window.__kfErrFlush=()=>{setTimeout(errFlush,0);};

/* ---------- Spieler-Weg: jeder Schritt wird einmal pro Spielstand gemeldet (anonym, nur die Kennung) ---------- */
const STEP_KEY='keksfabrik-steps';
let stepOff=false,stepBusy=false;
function stepsDone(){let o={};try{o=JSON.parse(localStorage.getItem(STEP_KEY)||'{}')||{};}catch(x){}if(o.id!==S.lb.id) o={id:S.lb.id,s:{}};if(!o.s) o.s={};return o;}
async function kfTrackStep(step){
  if(stepOff||!lbOn()||S.adm) return;
  kfId();const o=stepsDone();if(o.s[step]) return;
  o.s[step]=1;try{localStorage.setItem(STEP_KEY,JSON.stringify(o));}catch(x){}
  try{await lbApi('rpc/kf_track',{p_id:S.lb.id,p_step:step});}
  catch(x){if(lbMissing(x)) stepOff=true;else{const p=stepsDone();delete p.s[step];try{localStorage.setItem(STEP_KEY,JSON.stringify(p));}catch(y){}}}
}
const STEPS=[
  ['open',()=>true],
  ['click50',()=>S.clicks>=50],
  ['build1',()=>S.b.some(n=>n>0)],
  ['up1',()=>Object.keys(S.up).length>0],
  ['tut5',()=>S.tut&&S.tut.i>=5],
  ['tutdone',()=>S.tut&&S.tut.i>=TUT.length],
  ['bld25',()=>S.b.reduce((a,n)=>a+n,0)>=25],
  ['world',()=>tabUnl('world')],
  ['asc1',()=>S.asc>=1],
  ['acc',()=>!!accTok],
  ['club',()=>clubIn()],
  ['lb',()=>!!S.lb.on],
  ['push',()=>pushOn===true]
];
async function stepCheck(){
  if(stepOff||stepBusy||!lbOn()||document.hidden) return;
  stepBusy=true;
  try{const o=stepsDone();for(const [k,f] of STEPS){if(o.s[k]) continue;let ok=false;try{ok=f();}catch(x){}if(ok) await kfTrackStep(k);if(stepOff) break;}}
  finally{stepBusy=false;}
}

/* ---------- Club-Chat: Reaktionen, angeheftete Nachricht, Winken ---------- */
const CHAT_EMO=['👍','❤️','😂','🎉','🍪'];
let chatPick=0;
function chatPinHtml(D,own){
  const p=D.pinned;if(!p) return '';
  return '<div class="cpin"><span aria-hidden="true">📌</span><span><small>'+tt('Angeheftet','Pinned')+' · '+escName(String(p.username))+'</small>'+escName(String(p.body))+'</span>'+(own?'<button type="button" class="crx" data-cr="unpin" aria-label="'+tt('Lösen','Unpin')+'" title="'+tt('Lösen','Unpin')+'">✕</button>':'')+'</div>';
}
function chatMsgExtra(m,own){
  const R=m.reacts||[];
  let h='<div class="creact">'+R.map(r=>'<button type="button" class="cre'+(r.mine?' mine':'')+'" data-cr="re:'+m.id+':'+r.e+'" aria-pressed="'+(r.mine?'true':'false')+'">'+r.e+' <b>'+r.n+'</b></button>').join('');
  if(featOn('chat')&&!(clubMuted>Date.now())) h+='<button type="button" class="cre add" data-cr="pick:'+m.id+'" aria-label="'+tt('Reagieren','React')+'" title="'+tt('Reagieren','React')+'">☺︎+</button>';
  if(own) h+='<button type="button" class="cre add" data-cr="pin:'+m.id+'" aria-label="'+tt('Anheften','Pin')+'" title="'+tt('Anheften','Pin')+'">📌</button>';
  h+='</div>';
  if(chatPick===m.id) h+='<div class="cpick" role="group" aria-label="'+tt('Reaktion wählen','Pick a reaction')+'">'+CHAT_EMO.map(e=>'<button type="button" data-cr="re:'+m.id+':'+e+'">'+e+'</button>').join('')+'</div>';
  return h;
}
$id('clubOv').addEventListener('click',async e=>{
  const b=e.target.closest('[data-cr]');if(!b) return;
  const [a,id,emo]=b.dataset.cr.split(':');clubMsg='';
  if(a==='pick'){chatPick=chatPick===+id?0:+id;clubRender();return;}
  if(a==='re'){chatPick=0;await clubCall('club_react',{p_msg:+id,p_emoji:emo});return;}
  if(a==='pin'){await clubCall('club_pin',{p_msg:+id},tt('Nachricht angeheftet.','Message pinned.'));return;}
  if(a==='unpin'){await clubCall('club_pin',{p_msg:null},tt('Nachricht gelöst.','Message unpinned.'));return;}
  if(a==='wave'){await clubCall('club_post',{p_body:'👋'});return;}
});

/* ---------- Admin: Absturzberichte und Spieler-Weg (Server-Tab) ---------- */
var admErrs=null,admJour=null,admInsErr='',admInsArm=0;
async function admIns(action,data){return lbApi('rpc/admin_insights',{p_pass:admPass,p_action:action,p_data:data||null});}
async function admInsLoad(){
  if(!admPass) return;
  try{const [e,j]=await Promise.all([admIns('errors'),admIns('journey')]);admErrs=e||[];admJour=j||{};admInsErr='';}
  catch(x){admInsErr=lbMissing(x)?tt('Dafür braucht der Server zuerst docs/insights-v10.sql.','This needs docs/insights-v10.sql on the server first.'):admErrTxt(x);}
  admSrvRender();
}
const STEP_TXT={open:['Spiel geöffnet','Opened the game'],click50:['50 Klicks','50 clicks'],build1:['Erstes Gebäude','First building'],up1:['Erstes Upgrade','First upgrade'],
  tut5:['5 Tipps gelesen','5 tips done'],tutdone:['Erste Schritte fertig','First steps done'],bld25:['25 Gebäude','25 buildings'],world:['Welt freigeschaltet','World unlocked'],
  asc1:['Erster Aufstieg','First ascension'],acc:['Konto erstellt','Made an account'],club:['In einem Club','Joined a club'],lb:['In der Bestenliste','On the leaderboard'],push:['Push an','Push on'],comeback:['Kam nach 3+ Tagen zurück','Came back after 3+ days']};
function admInsHtml(){
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
  let h='';
  if(admInsErr) return admCardH('🧭 '+tt('Spieler-Weg','Player journey'),'<p class="nameerr">'+admInsErr+'</p>');
  const J=admJour||{},St=J.steps||{},base=Math.max(+J.new30||0,+St.open||0);
  h+=admCardH('🧭 '+tt('Spieler-Weg (neue Spieler, 30 Tage)','Player journey (new players, 30 days)'),
    '<p class="small">'+tt('Wie weit neue Spieler kommen. Anonym: gezählt wird nur, welcher Schritt einmal erreicht wurde.','How far new players get. Anonymous: only which steps were reached once is counted.')+'</p>'
    +'<div class="admstats"><span><small>'+tt('Neue Spieler','New players')+'</small><b>'+fmt(+J.new30||0)+'</b></span><span><small>'+tt('Am 2. Tag zurück','Back on day 2')+'</small><b>'+pct(+J.back1||0,+J.cohort||0)+'</b></span><span><small>'+tt('Nach 7 Tagen zurück','Back after 7 days')+'</small><b>'+pct(+J.back7||0,+J.cohort7||0)+'</b></span></div>'
    +'<div class="admfun">'+Object.keys(STEP_TXT).map(k=>{const n=+St[k]||0,w=base?Math.round(n/base*100):0;return '<div><span>'+tt(STEP_TXT[k][0],STEP_TXT[k][1])+'</span><i style="--w:'+Math.min(100,w)+'%"></i><b>'+n+' <small>'+(base?w+'%':'')+'</small></b></div>';}).join('')+'</div>'
    +'<h5 class="admh5">'+tt('Spieler pro Tag (14 Tage)','Players per day (14 days)')+'</h5>'+admBars(J.daily));
  const E=admErrs||[],arm=Date.now()-admInsArm<5000;
  h+=admCardH('🐞 '+tt('Absturzberichte','Crash reports'),
    '<p class="small">'+tt('Fehler, die bei Spielern passiert sind. Gleiche Fehler werden zusammengezählt. Es wird kein Spielstand und kein Name mitgeschickt.','Errors that happened for players. The same error is counted together. No save and no name are sent.')+'</p>'
    +(E.length?'<div class="admerrs">'+E.map(x=>'<details class="fold"><summary><b>'+escName(x.msg)+'</b><small>'+x.count+'× · v'+x.ver+' · '+admDT(x.last_at)+'</small></summary>'+(x.src?'<p class="small">'+escName(x.src)+'</p>':'')+(x.stack?'<pre>'+escName(x.stack)+'</pre>':'')+(x.ua?'<p class="small">'+escName(x.ua)+'</p>':'')+'<div class="btns"><button type="button" class="btn sm" data-ina="done:'+escName(x.fp)+'">'+tt('Behoben','Mark fixed')+'</button></div></details>').join('')+'</div>'
      +'<div class="btns"><button type="button" class="btn sm warn'+(arm?' armed':'')+'" data-ina="clear">'+(arm?tt('Wirklich alle löschen?','Really clear all?'):tt('Liste leeren','Clear list'))+'</button></div>'
      :'<p class="small">'+(admErrs?tt('Keine Fehler gemeldet. 🎉','No errors reported. 🎉'):tt('Lädt …','Loading …'))+'</p>'));
  return h;
}
els.admin.addEventListener('click',async e=>{
  const b=e.target.closest('[data-ina]');if(!b) return;
  const [a,fp]=b.dataset.ina.split(':');
  try{
    if(a==='done'){admErrs=await admIns('error_done',{fp});toast(tt('Als behoben markiert.','Marked as fixed.'));}
    if(a==='clear'){if(Date.now()-admInsArm>=5000){admInsArm=Date.now();admSrvRender();return;}admInsArm=0;admErrs=await admIns('errors_clear');toast(tt('Liste geleert.','List cleared.'));}
  }catch(x){admInsErr=admErrTxt(x);}
  admSrvRender();
});

/* ---------- Spieleportale (itch.io, CrazyGames …): keine App-Installation, kein Offline-Speicher ---------- */
if(window.KF_PORTAL){const a=$id('appT');if(a&&a.parentElement) a.parentElement.hidden=true;}

setInterval(stepCheck,15000);
setTimeout(()=>{stepCheck();errFlush();},4000);
v51Ready=true;
