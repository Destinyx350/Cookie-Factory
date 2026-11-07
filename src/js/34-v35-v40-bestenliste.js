/* ======================= V35/V40: Bestenliste ======================= */
// Supabase project and its public (publishable) key. See docs/LEADERBOARD.md. Empty values hide the leaderboard.
const LB_URL='https://nmmlemtljjvfurlrvuvm.supabase.co',LB_KEY='sb_publishable_STHuGWpHxg6efQhuvc_sQQ_xO5AvI5J';
const lbOn=()=>!!(LB_URL&&LB_KEY);
let lbTop=null,lbRank=0,lbErr=false,lbBusy=false,lbLast=0,lbSent=0,lbNote='';
let lbTab='all',lbV2=null,lbPer={W:null,M:null},lbPerRank={W:0,M:0},lbPrev={W:null,M:null};
const lbCheat=()=>{const a=S.admin;return !!S.adm||!!S.tamp||['prod','click','cost','speed','gold','goldPow'].some(k=>a[k]!==1)||a.growth!==1.15||(a.ac||0)>0||Object.keys(a.b||{}).length>0;};
const lbScore=()=>Math.floor(Math.min(S.all,9.9e299));
function lbUUID(){
  if(crypto.randomUUID) return crypto.randomUUID();
  const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;
  const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
async function lbApi(path,body){
  const r=await fetch(LB_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{apikey:LB_KEY,Authorization:'Bearer '+LB_KEY,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const t=await r.text();
  if(!r.ok){let m='HTTP '+r.status;try{const j=JSON.parse(t);m=j.message||m;if(j.code) m+=' ['+j.code+']';}catch(x){}if(/^banned: /.test(m)) setTimeout(()=>banSeen(m),0);const e=new Error(m);e.status=r.status;throw e;}
  return t?JSON.parse(t):null;
}
const lbMissing=x=>x&&(x.status===404||/PGRST20[25]|does not exist|schema cache/.test(String(x.message||'')));

/* Wochen und Monate (UTC, wie in der Datenbank) */
function lbWeekId(d){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear();const w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return 'W'+y+'-'+String(w).padStart(2,'0');}
const lbMonthId=d=>'M'+d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
const lbPid=(k,d)=>k==='W'?lbWeekId(d||new Date()):lbMonthId(d||new Date());
function lbEnds(k){const n=new Date();if(k==='M') return Date.UTC(n.getUTCFullYear(),n.getUTCMonth()+1,1);const day=n.getUTCDay()||7;return Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+8-day);}
function lbLeft(ms){const s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?d+tt(' T ',' d ')+h+tt(' Std',' h'):h?h+tt(' Std ',' h ')+m+' min':m+' min';}
const LB_PRIZE={W:[{gems:100,h:2},{gems:60,h:1},{gems:30,h:.5}],M:[{gems:300,stars:8,h:6},{gems:200,stars:5,h:4},{gems:100,stars:3,h:2}]};
const lbPrizeTxt=p=>[p.gems+' '+matName('gem'),p.stars?p.stars+' '+tt('Sternenkrümel','star crumbs'):'',(p.h>=1?p.h+tt(' Std',' h'):Math.round(p.h*60)+' min')+tt(' Kekse',' of cookies')].filter(Boolean).join(' + ');

/* Punkte senden: jede Minute, nie schneller als die Anti-Cheat-Regel erlaubt */
const LB_EVERY=60000;
function lbCapped(){
  const sc=lbScore();if(!S.lb.ls) return sc;
  const hrs=Math.max(0,(Date.now()-(S.lb.t||0))/3.6e6);
  return Math.floor(Math.min(sc,Math.max(S.lb.ls,1e8)*Math.pow(10,Math.min(12*hrs,12))*.98));
}
async function lbSubmit(force){
  if(!lbOn()||!S.lb.on||!S.name||lbCheat()) return;
  if(!force&&Date.now()-(S.lb.t||0)<LB_EVERY) return;
  if(!S.lb.id){S.lb.id=lbUUID();save();}
  const sc=lbCapped(),prev=S.lb.ls||0;
  try{await lbApi('rpc/submit_score',{p_id:S.lb.id,p_name:S.name,p_score:sc});}
  catch(x){if(/banned/.test(String(x.message))) lbBanned();throw x;}
  ['W','M'].forEach(k=>{const id=lbPid(k);if(!S.lb.pb||S.lb.pb[k+'id']!==id){S.lb.pb=S.lb.pb||{};S.lb.pb[k+'id']=id;S.lb.pb[k]=prev||sc;}});
  S.lb.ls=Math.max(prev,sc);lbSent=S.lb.t=Date.now();
}
const lbGain=k=>S.lb.pb&&S.lb.pb[k+'id']===lbPid(k)?Math.max(0,(S.lb.ls||0)-(S.lb.pb[k]||0)):0;
async function lbRefresh(){
  if(!lbOn()||lbBusy) return;
  lbBusy=true;lbErr=false;renderLb();
  try{
    lbNote='';try{await lbSubmit();}catch(x){const m=String(x&&x.message||'');if(/too fast|too high|not allowed|name taken/.test(m)) lbNote=m;}
    const top=await lbApi('leaderboard?select=name,score,updated_at&order=score.desc,updated_at.asc&limit=50');
    lbTop=Array.isArray(top)?top:[];
    const mine=S.lb.on&&!lbCheat();
    lbRank=mine?(Number(await lbApi('rpc/leaderboard_rank',{p_score:S.lb.ls||lbScore()}))||0):0;
    if(lbV2!==false){
      try{
        for(const k of ['W','M']){
          const id=lbPid(k);
          lbPer[k]=await lbApi('lb_period?select=name,gain,updated_at&period=eq.'+id+'&order=gain.desc,updated_at.asc&limit=50')||[];
          lbPerRank[k]=mine?(Number(await lbApi('rpc/lb_period_rank',{p_period:id,p_gain:lbGain(k)}))||0):0;
          const prevId=k==='W'?lbPid('W',new Date(Date.now()-7*864e5)):lbPid('M',new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),0)));
          lbPrev[k]={id:prevId,rows:await lbApi('lb_rewards?select=place,name,gain&period=eq.'+prevId+'&order=place.asc')||[]};
        }
        lbV2=true;
      }catch(x){if(lbMissing(x)) lbV2=false;else throw x;}
    }
    lbLast=Date.now();
  }catch(x){lbErr=true;}
  lbBusy=false;renderLb();
}
function lbJoin(){
  if(lbCheat()) return;
  if(!S.name){askName({text:tt('Unter diesem Namen erscheint deine Bäckerei in der Bestenliste.','Your bakery shows up on the leaderboard under this name.')},nm=>{S.name=nm;save();showName();lbJoin();});return;}
  S.lb.on=1;S.lb.t=0;if(!S.lb.id) S.lb.id=lbUUID();save();
  toast(tt('Du bist jetzt in der Bestenliste!','You joined the leaderboard!'),true);
  lbRefresh();if(v46Ready&&accTok) setTimeout(()=>lbAccSync(true),2500);
}
async function lbLeave(){
  S.lb.on=0;S.lb.ls=0;S.lb.pb=null;save();lbRank=0;lbPerRank={W:0,M:0};
  try{if(S.lb.id) await lbApi('rpc/leave_leaderboard',{p_id:S.lb.id});}catch(x){}
  toast(tt('Deine Bäckerei ist nicht mehr in der Bestenliste.','Your bakery left the leaderboard.'));
  lbRefresh();
}
function lbBanned(){
  if(!S.lb.on) return;
  S.lb.on=0;S.lb.ls=0;S.lb.pb=null;S.lb.ban=1;save();lbRank=0;
  toast(tt('Deine Bäckerei wurde vom Admin aus der Bestenliste entfernt.','Your bakery was removed from the leaderboard by the admin.'),true);
}

/* Preise abholen, Sperren und Zurücksetzen vom Admin */
function lbShowMsg(title,html,icon){$id('rwBurst').textContent=icon||'🏆';$id('rwT').textContent=title;$id('rwBody').innerHTML=html;$id('rwClose').textContent=tt('Super!','Great!');$id('rwOv').hidden=false;$id('rwClose').focus();}
async function lbCheckStatus(){
  if(!lbOn()||!S.lb.id||lbV2===false) return;
  let st;try{st=await lbApi('rpc/lb_status',{p_id:S.lb.id});}catch(x){if(lbMissing(x)) lbV2=false;return;}
  if(!st) return;
  if(st.reset){
    const nm=S.name,l=LANG,id=S.lb.id;
    S=fresh();S.name=nm;S.opt.lang=l;applyLang();rebuildAll();save();
    try{await lbApi('rpc/ack_reset',{p_id:id});}catch(x){}
    lbShowMsg(tt('Spiel zurückgesetzt','Game reset'),'<p>'+tt('Der Admin der Keksfabrik hat dein Spiel zurückgesetzt. Du startest mit einer frischen Bäckerei.','The admin of Cookie Factory reset your game. You start over with a fresh bakery.')+'</p>');
    return;
  }
  if(st.banned) lbBanned();
  if(st.rewards>0){
    let got=[];try{got=await lbApi('rpc/claim_lb_rewards',{p_id:S.lb.id})||[];}catch(x){return;}
    if(!got.length) return;
    const lines=got.map(r=>{
      const k=String(r.period).charAt(0)==='M'?'M':'W',p=LB_PRIZE[k][Math.min(2,Math.max(0,(r.place|0)-1))];
      S.w.mat.gem+=p.gems;if(p.stars){S.w.star.n+=p.stars;S.w.star.all=Math.max(S.w.star.all||0,S.w.star.n);}
      addCk(Math.max(10000*p.h,C.kps0*3600*p.h));
      const per=k==='W'?tt('Woche ','Week ')+String(r.period).split('-')[1]:new Date(String(r.period).slice(1)+'-01T00:00:00Z').toLocaleDateString(LOC[LANG],{month:'long',year:'numeric',timeZone:'UTC'});
      return '<div class="rwline"><span class="rwmed m'+r.place+'">'+['🥇','🥈','🥉'][(r.place|0)-1]+'</span><span><b>'+tt('Platz ','#')+r.place+' · '+per+'</b><small>'+lbPrizeTxt(p)+'</small></span></div>';
    }).join('');
    recalc();save();snd('claim');
    lbShowMsg(tt('Preis aus der Bestenliste!','Leaderboard prize!'),'<p>'+tt('Du warst ganz vorne dabei. Deine Belohnung:','You made it to the top. Your reward:')+'</p>'+lines);
  }
}
$id('rwClose').addEventListener('click',()=>{$id('rwOv').hidden=true;});
$id('rwOv').addEventListener('click',e=>{if(e.target===$id('rwOv')) $id('rwOv').hidden=true;});

function lbRowsHtml(rows,valKey,myRank){
  return '<div class="lblist">'+rows.map((r,i)=>{
    const mine=S.lb.on&&r.name===S.name&&myRank===i+1;
    return '<div class="lbrow'+(mine?' me':'')+'" style="--i:'+Math.min(i,12)+'"><span class="rk'+(i<3?' m'+(i+1):'')+'">'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</span><button type="button" class="nm pname" data-prof="'+escName(String(r.name||''))+'">'+escName(String(r.name||''))+'</button><span class="sc">'+(valKey==='gain'?'+':'')+fmt(+r[valKey]||0)+'</span></div>';
  }).join('')+'</div>';
}
function renderLb(){
  const bar=$id('lbBar');if(!bar) return;
  const lbUse=lbOn()&&featOn('lb');
  bar.hidden=!lbUse;if(!lbUse&&!$id('lbOv').hidden) $id('lbOv').hidden=true;
  const tb=$id('lbTopBtn'),rk=$id('lbTopRk');
  if(tb){tb.hidden=!lbUse;tb.setAttribute('aria-label',tt('Bestenliste','Leaderboard')+(lbRank&&S.lb.on&&!lbCheat()?' · '+tt('Platz ','#')+lbRank:''));tb.title=tt('Bestenliste','Leaderboard');const show=lbRank>0&&S.lb.on&&!lbCheat();rk.hidden=!show;if(show){const v=lbRank>99?'99+':String(lbRank);if(rk.textContent!==v) rk.textContent=v;}}
  if(!lbUse) return;
  const status=S.tamp?tt('Nicht verfügbar: Spielstand verändert','Not available: save modified'):lbCheat()?tt('Nicht verfügbar: Admin benutzt','Not available: admin used'):!S.lb.on?tt('Mitmachen und vergleichen','Join and compare'):lbRank?tt('Du bist auf Platz ','You’re #')+fmt(lbRank)+(lbV2&&lbPerRank.W?' · '+tt('Woche: ','week: ')+lbPerRank.W:''):tt('Du bist dabei','You’re on the board');
  const bh='<span class="ico">'+art('crown')+'</span><span><small>'+tt('Bestenliste','Leaderboard')+(lbV2?' · '+tt('Wochenpreise!','weekly prizes!'):'')+'</small><b>'+status+'</b></span><span class="go" aria-hidden="true">›</span>';
  if(bar._h!==bh){bar._h=bh;bar.innerHTML=bh;}
  $id('lbT').textContent=tt('Bestenliste','Leaderboard');
  $id('lbClose').textContent=tt('Schließen','Close');
  if($id('lbOv').hidden) return;
  if(!lbV2&&lbTab!=='all') lbTab='all';
  const k=lbTab==='week'?'W':lbTab==='month'?'M':'';
  let h='';
  if(lbV2) h+='<div class="seg lbtabs" role="tablist">'+[['all',tt('Gesamt','All time')],['week',tt('Diese Woche','This week')],['month',tt('Dieser Monat','This month')]].map(([t,l])=>'<button type="button" role="tab" data-lbt="'+t+'" aria-selected="'+(lbTab===t)+'" aria-pressed="'+(lbTab===t)+'">'+l+'</button>').join('')+'</div>';
  if(k){
    const prize=LB_PRIZE[k];
    h+='<div class="lbprize"><div class="lbends"><span>'+(k==='W'?tt('Woche endet in ','Week ends in '):tt('Monat endet in ','Month ends in '))+'</span><b data-lbleft="'+k+'">'+lbLeft(lbEnds(k)-Date.now())+'</b></div>'
      +'<div class="lbprizes">'+prize.map((p,i)=>'<div class="lbpz"><span class="rwmed m'+(i+1)+'">'+['🥇','🥈','🥉'][i]+'</span><small>'+lbPrizeTxt(p)+'</small></div>').join('')+'</div>'
      +'<p class="small" style="margin:6px 0 0">'+tt('Gezählt werden die Kekse, die du in diesem Zeitraum backst. Die Top 3 bekommen ihren Preis beim nächsten Spielstart.','Counts the cookies you bake during this period. The top 3 get their prize the next time they play.')+'</p>'
      +(lbPrev[k]&&lbPrev[k].rows&&lbPrev[k].rows.length?'<p class="lbprev">'+(k==='W'?tt('Letzte Woche: ','Last week: '):tt('Letzter Monat: ','Last month: '))+lbPrev[k].rows.map(r=>['🥇','🥈','🥉'][r.place-1]+' '+escName(r.name)).join(' · ')+'</p>':'')
      +'</div>';
  }
  let me='<div class="lbme">';
  if(S.tamp) me+='<p class="small" style="margin:0">'+tt('Dieser Spielstand wurde außerhalb des Spiels verändert (z. B. mit Browser-Werkzeugen oder einer bearbeiteten Datei). Damit es fair bleibt, kann er nicht in die Bestenliste. Starte ein neues Spiel, um mitzumachen.','This save was changed outside the game (for example with browser tools or an edited file). To keep things fair, it can’t join the leaderboard. Start a new game to take part.')+'</p>';
  else if(lbCheat()) me+='<p class="small" style="margin:0">'+tt('In diesem Spielstand wurde das Admin-Panel benutzt. Damit es fair bleibt, kann er nicht in die Bestenliste. Starte ein neues Spiel, um mitzumachen.','This save used the admin panel. To keep things fair, it can’t join the leaderboard. Start a new game to take part.')+'</p>';
  else if(!S.lb.on) me+='<div class="row"><span><b>'+tt('Mach mit!','Join in!')+'</b><span class="sub" style="display:block">'+(S.lb.ban?tt('Der Admin hat dich entfernt. Du kannst es später nochmal versuchen.','The admin removed you. You can try again later.'):tt('Dein Bäckerei-Name und deine gebackenen Kekse sind dann für alle sichtbar.','Your bakery name and cookies baked will be visible to everyone.'))+'</span></span><button type="button" class="btn primary" data-lb="join">'+tt('Mitmachen','Join')+'</button></div>';
  else{
    const r=k?lbPerRank[k]:lbRank,v=k?'+'+fmt(lbGain(k)):fmt(lbScore());
    me+='<div class="row"><span><span class="sub" style="display:block">'+escName(S.name||'')+'</span><span class="big">'+(r?tt('Platz ','#')+fmt(r):'–')+'</span></span><span style="text-align:right"><span class="sub" style="display:block">'+(k?(k==='W'?tt('Diese Woche gebacken','Baked this week'):tt('Diesen Monat gebacken','Baked this month')):tt('Kekse gebacken','Cookies baked'))+'</span><b>'+v+'</b></span></div>';
  }
  if(lbNote) me+='<p class="lbnote">'+(/name taken/.test(lbNote)?tt('Diesen Bäckerei-Namen hat schon jemand anderes in der Bestenliste. Gib deiner Bäckerei unter Einstellungen einen anderen Namen – oder melde dich mit deinem Konto an, wenn das dein Platz ist.','Someone else already has this bakery name on the leaderboard. Give your bakery another name in Settings – or sign in to your account if that spot is yours.'):/not allowed/.test(lbNote)?tt('Dein Bäckerei-Name ist in der Bestenliste nicht erlaubt. Gib deiner Bäckerei unter Einstellungen einen anderen Namen.','Your bakery name isn’t allowed on the leaderboard. Give your bakery a different name in Settings.'):/too high/.test(lbNote)?tt('Dein Punktestand ist für einen neuen Eintrag zu hoch. Melde dich beim Besitzer des Spiels.','Your score is too high for a new entry. Please contact the game’s owner.'):tt('Dein neuer Punktestand wurde nicht gespeichert, weil er schneller gewachsen ist, als das Spiel es erlaubt. Später versucht es das Spiel nochmal.','Your new score wasn’t saved because it grew faster than the game allows. The game will try again later.'))+'</p>';
  me+='</div>';
  const rows=k?lbPer[k]:lbTop,myRank=k?lbPerRank[k]:lbRank;
  let list;
  if(lbBusy&&!rows) list='<p class="lbmsg">'+tt('Lädt …','Loading …')+'</p>';
  else if(lbErr&&!rows) list='<p class="lbmsg">'+tt('Die Bestenliste ist gerade nicht erreichbar. Prüfe dein Internet und versuch es nochmal.','The leaderboard can’t be reached right now. Check your internet and try again.')+'</p>';
  else if(rows&&!rows.length) list='<p class="lbmsg">'+(k?tt('Noch niemand in diesem Zeitraum. Back los und hol dir Platz 1!','Nobody yet this period. Start baking and grab #1!'):tt('Noch niemand dabei. Sei die erste Bäckerei!','Nobody here yet. Be the first bakery!'))+'</p>';
  else list=lbRowsHtml(rows||[],k?'gain':'score',myRank);
  const when=lbLast?tt('Stand: ','Updated ')+new Date(lbLast).toLocaleTimeString(LOC[LANG],{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
  const foot='<div class="lbfoot"><span class="small">'+(lbErr&&rows?tt('Aktualisieren hat nicht geklappt. ','Couldn’t refresh. '):'')+when+'</span><span class="btns">'+(S.lb.on&&!lbCheat()?'<button type="button" class="btn sm" data-lb="leave">'+tt('Verlassen','Leave')+'</button>':'')+'<button type="button" class="btn sm" data-lb="refresh"'+(lbBusy?' disabled':'')+'>'+(lbBusy?tt('Lädt …','Loading …'):tt('Aktualisieren','Refresh'))+'</button></span></div>';
  const html=h+me+list+(k?'':lbSeasonsHtml())+foot;
  const body=$id('lbBody');if(body._h!==html){body._h=html;body.innerHTML=html;}
}
function openLb(){lbFrom=document.activeElement;$id('lbOv').hidden=false;renderLb();lbLoadSeasons();if(Date.now()-lbLast>10000) lbRefresh();$id('lbClose').focus();}
let lbFrom=null;
function closeLb(){if($id('lbOv').hidden) return;$id('lbOv').hidden=true;const f=lbFrom&&!lbFrom.hidden&&lbFrom.offsetParent?lbFrom:$id('lbTopBtn');if(f&&f.focus) f.focus();}
$id('lbBar').addEventListener('click',openLb);
$id('lbTopBtn').addEventListener('click',openLb);
$id('lbClose').addEventListener('click',closeLb);
$id('lbOv').addEventListener('click',e=>{
  if(e.target===$id('lbOv')){closeLb();return;}
  const t=e.target.closest('[data-lbt]');if(t){lbTab=t.dataset.lbt;$id('lbBody')._h='';renderLb();return;}
  const b=e.target.closest('[data-lb]');if(!b) return;
  if(b.dataset.lb==='join') lbJoin();else if(b.dataset.lb==='leave') lbLeave();else if(b.dataset.lb==='refresh') lbRefresh();
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$id('lbOv').hidden&&$id('nameOv').hidden){e.preventDefault();e.stopImmediatePropagation();closeLb();}},true);
/* Schnell aktuell: offen alle 30 s, sonst jede Minute, wenn du mitmachst */
setInterval(()=>{
  if(!lbOn()||document.hidden||lbBusy) return;
  const open=!$id('lbOv').hidden,age=Date.now()-lbLast;
  if((open&&age>=30000)||(S.lb.on&&!lbCheat()&&age>=LB_EVERY)) lbRefresh();
},5000);
let lbCheatWas=null;
setInterval(()=>{
  if(!lbOn()) return;
  const c=lbCheat();if(c!==lbCheatWas){lbCheatWas=c;renderLb();}else{const bar=$id('lbBar');if(bar&&!bar.hidden) renderLb();}
  document.querySelectorAll('[data-lbleft]').forEach(e=>{const v=lbLeft(lbEnds(e.dataset.lbleft)-Date.now());if(e.textContent!==v) e.textContent=v;});
},1000);
if(lbOn()&&S.lb.on) setTimeout(lbRefresh,3000);
if(lbOn()&&S.lb.id) setTimeout(lbCheckStatus,4000);
function tampWarn(){toast(tt('Dieser Spielstand wurde außerhalb des Spiels verändert. Er kann nicht in die Bestenliste.','This save was changed outside the game. It can’t join the leaderboard.'),true);updV34Txt();}
if(S.tamp&&hadSave&&!S.tampSeen){S.tampSeen=1;setTimeout(tampWarn,1500);}
