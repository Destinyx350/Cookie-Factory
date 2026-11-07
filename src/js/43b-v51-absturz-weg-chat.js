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

/* ---------- Spieleportale (itch.io, CrazyGames …): keine App-Installation, kein Offline-Speicher ---------- */
if(window.KF_PORTAL){const a=$id('appT');if(a&&a.parentElement) a.parentElement.hidden=true;}

setInterval(stepCheck,15000);
setTimeout(()=>{stepCheck();errFlush();},4000);
v51Ready=true;
