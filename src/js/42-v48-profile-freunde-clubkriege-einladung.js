/* ======================= V48: Profile, Freunde, Clubkriege, Einladungen ======================= */
var v48Ready=false;
/* ---------- Profile ---------- */
var profFrom=null,profName='';
async function openProfile(name){
  name=String(name||'').trim();if(!name||!lbOn()) return;
  profName=name;profFrom=document.activeElement;
  $id('profOv').hidden=false;$id('profT').textContent=name;$id('profBody').innerHTML='<p class="lbmsg">'+tt('Lädt …','Loading …')+'</p>';$id('profClose').textContent=tt('Schließen','Close');$id('profClose').focus();
  let P=null,err='';
  try{P=await lbApi('rpc/player_profile',{p_name:name});}catch(x){err=lbMissing(x)?tt('Profile kommen mit dem nächsten Server-Update.','Profiles arrive with the next server update.'):/player not found/.test(String(x.message))?tt('Dieses Profil gibt es nicht.','No profile found.'):tt('Keine Verbindung.','No connection.');}
  if(profName!==name||$id('profOv').hidden) return;
  if(!P){$id('profBody').innerHTML='<p class="lbmsg">'+err+'</p>';return;}
  const st=P.stats||{},me=accMe&&P.username&&accMe.username.toLowerCase()===String(P.username).toLowerCase();
  const tile=(ic,l,v)=>v==null||v===''?'':'<span class="ptile"><span aria-hidden="true">'+ic+'</span><small>'+l+'</small><b>'+v+'</b></span>';
  $id('profT').textContent=P.username||P.bakery||name;
  let h='<div class="phead"><span class="pav'+(v61Ready?profCol(P):'')+'" aria-hidden="true">'+(v61Ready?profAv(P):(P.username?'👤':'🍪'))+'<i class="pdot'+(P.online?' on':'')+'"></i></span><span><b>'+escName(P.bakery||P.username||name)+'</b>'
    +(P.username?'<small>@'+escName(P.username)+(st.title?' · '+escName(st.title):'')+'</small>':'<small>'+tt('Ohne Konto','No account')+'</small>')
    +'<small>'+(P.online?tt('🟢 Gerade online','🟢 Online now'):P.since?tt('Dabei seit ','Playing since ')+new Date(P.since).toLocaleDateString(LOC[LANG],{month:'long',year:'numeric'}):'')+'</small></span></div>';
  h+='<div class="ptiles">'+tile('🍪',tt('Gebacken','Baked'),fmt(+P.baked||0))+tile('🏆',tt('Platz','Rank'),P.rank?'#'+fmt(P.rank):null)+tile('🥇',tt('Wochen-/Monatssiege','Weekly/monthly wins'),P.wins?fmt(P.wins):null)
    +tile('⭐',tt('Erfolge','Achievements'),st.ach!=null?fmt(st.ach):null)+tile('👼',tt('Aufstiege','Ascensions'),st.asc?fmt(st.asc):null)+tile('🏭',tt('Gebäude','Buildings'),st.bld!=null?fmt(st.bld):null)
    +tile('🤝',tt('Freunde','Friends'),P.username?fmt(P.friends||0):null)+'</div>';
  if(v61Ready) h+=profExtra(P,me);
  if(P.club) h+='<p class="pclub">'+escName(P.club.emoji)+' <b>'+escName(P.club.name)+'</b>'+(P.club.trophies?' · 🏆 ×'+P.club.trophies:'')+'</p>';
  const isFr=frData&&frData.friends&&frData.friends.some(f=>String(f.username).toLowerCase()===String(P.username||'').toLowerCase());
  if(P.username&&clubSigned()&&!me) h+='<div class="btns" style="margin-top:12px">'+(isFr?'<span class="small" style="align-self:center">🤝 '+tt('Ihr seid Freunde','You’re friends')+'</span>':'<button type="button" class="btn primary" data-pf="add:'+escName(P.username)+'">'+tt('Als Freund hinzufügen','Add friend')+'</button>')+'<button type="button" class="btn" data-pf="gift:'+escName(P.username)+'">'+tt('Geschenk senden','Send a gift')+'</button></div>';
  $id('profBody').innerHTML=h;
}
function closeProfile(){if($id('profOv').hidden) return;$id('profOv').hidden=true;if(profFrom&&profFrom.focus&&profFrom.offsetParent) profFrom.focus();}
$id('profClose').addEventListener('click',closeProfile);
$id('profOv').addEventListener('click',async e=>{
  if(e.target===$id('profOv')){closeProfile();return;}
  const b=e.target.closest('[data-pf]');if(!b) return;
  const [a,u]=b.dataset.pf.split(':');
  if(a==='add'){b.disabled=true;try{await lbApi('rpc/friend_request',{p_token:accTok,p_user:u});b.textContent=tt('Anfrage gesendet ✓','Request sent ✓');frData=null;}catch(x){b.disabled=false;toast(clubErrTxt(x));}return;}
  if(a==='gift'){closeProfile();giftTo=u;clubTab='gift';openClub();}
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-prof]');if(!b) return;e.preventDefault();openProfile(b.dataset.prof);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$id('profOv').hidden){e.preventDefault();e.stopImmediatePropagation();closeProfile();}},true);
/* Öffentliche Zahlen fürs Profil, höchstens alle 10 Minuten */
var profSent=0;
function profPush(){
  if(!accTok||!lbOn()||Date.now()-profSent<600000) return;profSent=Date.now();
  const ttl=($id('ttlChip')&&!$id('ttlChip').hidden)?$id('ttlChip').textContent.trim():'';
  lbApi('rpc/acc_profile',{p_token:accTok,p_data:{ach:Object.keys(S.ach||{}).length,asc:S.asc|0,reb:(S.reb&&S.reb.n)|0,bld:(S.b||[]).reduce((a,x)=>a+(x|0),0),up:Object.keys(S.up||{}).length,clicks:Math.floor(S.clicks||0),title:ttl.slice(0,40),bakery:String(S.name||'').slice(0,20)}}).catch(()=>{});
}

/* ---------- Freunde ---------- */
var frData=null,frBusy=false,frReq=0,giftTo='';
async function frLoad(){
  if(!clubSigned()||frBusy) return;frBusy=true;
  try{frData=await lbApi('rpc/friend_list',{p_token:accTok});}catch(x){if(lbMissing(x)) frData={missing:1};}
  frBusy=false;clubRender();
}
async function frCall(fn,body,ok){
  try{frData=await lbApi('rpc/'+fn,Object.assign({p_token:accTok},body));if(ok){clubMsg=ok;clubMsgOk=true;}}
  catch(x){clubMsg=/cannot add yourself/.test(String(x.message))?tt('Du kannst dich nicht selbst hinzufügen.','You can’t add yourself.'):/friend list full/.test(String(x.message))?tt('Deine Freundesliste ist voll (100).','Your friend list is full (100).'):clubErrTxt(x);clubMsgOk=false;}
  clubRender();
}
function frHtml(){
  if(!frData) return '<p class="lbmsg">'+tt('Lädt …','Loading …')+'</p>';
  if(frData.missing) return '<p class="lbmsg">'+tt('Freunde kommen mit dem nächsten Server-Update.','Friends arrive with the next server update.')+'</p>';
  const F=frData.friends||[],I=frData.incoming||[],O=frData.outgoing||[],seen=s=>s?new Date(s).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'–';
  let h='<form class="coderow" id="frAddF" novalidate><input class="namein" name="fu" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="'+tt('Benutzername deines Freundes','Your friend’s username')+'" aria-label="'+tt('Benutzername','Username')+'"><button type="submit" class="btn primary">'+tt('Hinzufügen','Add')+'</button></form>';
  if(I.length) h+='<h4 class="clubh">'+tt('Anfragen','Requests')+'</h4><div class="lblist">'+I.map(u=>'<div class="lbrow"><span class="rk">👋</span><button type="button" class="nm pname" data-prof="'+escName(u)+'">'+escName(u)+'</button><span class="sc"><button type="button" class="btn sm primary" data-fr="yes:'+escName(u)+'">'+tt('Annehmen','Accept')+'</button><button type="button" class="btn sm" data-fr="no:'+escName(u)+'">'+tt('Ablehnen','Decline')+'</button></span></div>').join('')+'</div>';
  h+='<h4 class="clubh">'+tt('Freunde','Friends')+' <small class="muted">('+F.length+')</small></h4>';
  h+=F.length?'<div class="lblist">'+F.map(f=>'<div class="lbrow"><span class="rk">'+(f.online?'🟢':'⚪')+'</span><span class="nm"><button type="button" class="pname" data-prof="'+escName(f.username)+'">'+escName(f.username)+'</button><small>'+(f.online?tt('online','online'):tt('zuletzt ','last seen ')+seen(f.seen))+(f.club?' · '+escName(f.club):'')+' · 🍪 '+fmt(+f.baked||0)+'</small></span><span class="sc"><button type="button" class="btn sm" data-fr="gift:'+escName(f.username)+'" title="'+tt('Geschenk','Gift')+'">🎁</button><button type="button" class="btn sm warn'+(clubArmed('frdel:'+f.username)?' armed':'')+'" data-fr="del:'+escName(f.username)+'">'+(clubArmed('frdel:'+f.username)?tt('Sicher?','Sure?'):'✕')+'</button></span></div>').join('')+'</div>'
    :'<p class="small">'+tt('Noch keine Freunde. Füge jemanden mit seinem Benutzernamen hinzu – oder tippe in der Bestenliste oder im Club auf einen Namen.','No friends yet. Add someone by username – or tap a name in the leaderboard or your club.')+'</p>';
  if(O.length) h+='<p class="small">'+tt('Wartet auf Antwort: ','Waiting for an answer: ')+O.map(escName).join(', ')+'</p>';
  return h;
}

/* ---------- Clubkrieg ---------- */
function warHtml(D){
  const W=D.war;
  if(!W||!W.current){
    let h='';
    if(W&&W.closed) h='<p class="small">'+(W.won?tt('🏆 Letzter Clubkrieg gewonnen gegen ','🏆 Won the last club war against '):W.tie?tt('🤝 Letzter Clubkrieg: Unentschieden gegen ','🤝 Last club war: a tie against '):tt('Letzter Clubkrieg verloren gegen ','Lost the last club war against '))+escName(W.vs_emoji)+' '+escName(W.vs)+'</p>';
    return '<div class="warcard"><b>⚔️ '+tt('Clubkrieg am Wochenende','Weekend club war')+'</b><p class="small">'+(D.weekend?tt('Backt jetzt los: Sobald ein zweiter Club bäckt, bekommt ihr einen Gegner.','Start baking: as soon as another club bakes too, you get an opponent.'):tt('Jeden Samstag und Sonntag tritt euer Club gegen einen ähnlich starken Club an. Der Gewinner bekommt eine Trophäe, und jedes Mitglied 40 Edelsteine + 30 min Kekse.','Every Saturday and Sunday your club faces a club of similar strength. The winner gets a trophy, and every member gets 40 gems + 30 min of cookies.'))+'</p>'+h+'</div>';
  }
  const me=+W.me||0,them=+W.them||0,tot=Math.max(1,me+them),pct=Math.round(me/tot*100);
  return '<div class="warcard on"><div class="warhd"><b>⚔️ '+tt('Clubkrieg gegen ','Club war vs ')+escName(W.vs_emoji)+' '+escName(W.vs)+'</b><b data-clleft>'+clubWeekLeft()+'</b></div><div class="warbar" role="img" aria-label="'+fmt(me)+' : '+fmt(them)+'"><i style="width:'+pct+'%"></i></div><div class="warsc"><span>'+tt('Ihr ','You ')+'<b>+'+fmt(me)+'</b></span><span><b>+'+fmt(them)+'</b> '+tt(' die anderen',' them')+'</span></div><p class="small" style="margin:6px 0 0">'+(me>=them?tt('Ihr liegt vorne! ','You’re ahead! '):tt('Holt auf! ','Catch up! '))+tt('Zählt beim Speichern ins Konto.','Counts when your game saves to your account.')+'</p></div>';
}

/* ---------- Einladungen ---------- */
var REF_KEY='keksfabrik-ref';
(function(){
  try{const u=new URL(location.href),r=(u.searchParams.get('ref')||'').trim();
    if(/^[A-Za-z0-9_]{3,16}$/.test(r)){lsSet(REF_KEY,r);u.searchParams.delete('ref');history.replaceState(null,'',u.pathname+(u.search?u.search:'')+u.hash);}
  }catch(e){}
})();
async function refClaim(){
  const r=lsGet(REF_KEY);if(!r||!accTok) return;
  try{const x=await lbApi('rpc/ref_claim',{p_token:accTok,p_ref:r});try{localStorage.removeItem(REF_KEY);}catch(e){}
    if(x&&x.ok) toast(tt(r+' hat dich eingeladen! Ihr bekommt beide einen Bonus, sobald du 1 Million Kekse gebacken hast.',r+' invited you! You both get a bonus once you’ve baked 1 million cookies.'),true);}
  catch(x){if(!lbMissing(x)){try{localStorage.removeItem(REF_KEY);}catch(e){}}}
}
function shareURL(){return GAME_URL+(accMe&&accMe.username?'?ref='+encodeURIComponent(accMe.username):'');}
function refNote(){
  const r=lsGet(REF_KEY),el=$id('stRef');if(!el) return;
  const t=r&&!accTok?'🤝 '+tt(r+' hat dich eingeladen! Erstelle ein Konto, dann bekommt ihr beide einen Bonus.',r+' invited you! Create an account and you both get a bonus.'):'';
  el.hidden=!t;if(el.textContent!==t) el.textContent=t;
}
refNote();
$id('clubOv').addEventListener('click',e=>{
  const b=e.target.closest('[data-fr]');if(!b) return;
  const [a,u]=b.dataset.fr.split(':');clubMsg='';
  if(a==='yes'||a==='no'){frCall('friend_answer',{p_user:u,p_accept:a==='yes'},a==='yes'?tt('Ihr seid jetzt Freunde! 🎉','You’re friends now! 🎉'):'');frReq=Math.max(0,frReq-1);return;}
  if(a==='gift'){giftTo=u;clubTab='gift';clubRender();clubLimits();return;}
  if(a==='del'){if(!clubArmed('frdel:'+u)){clubArm={k:'frdel:'+u,t:Date.now()};clubRender();return;}clubArm={k:'',t:0};frCall('friend_remove',{p_user:u},tt('Freund entfernt.','Friend removed.'));}
});
$id('clubOv').addEventListener('submit',e=>{
  if(e.target.getAttribute('id')!=='frAddF') return;
  e.preventDefault();const u=String(new FormData(e.target).get('fu')||'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(u)){clubMsg=tt('Gib einen Benutzernamen ein (3–16 Zeichen).','Enter a username (3–16 characters).');clubMsgOk=false;clubRender();return;}
  frCall('friend_request',{p_user:u},tt('Anfrage gesendet an ','Request sent to ')+escName(u)+'.');
  e.target.reset();
});
v48Ready=true;
