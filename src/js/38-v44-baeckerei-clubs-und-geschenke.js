/* ======================= V44: Bäckerei-Clubs und Geschenke ======================= */
var v44Ready=false;
const CLUB_PRIZE=[{gems:80,h:1},{gems:50,h:.5},{gems:30,h:.25}];
const CLUB_EMO=['🍪','🥐','🍩','🧁','🎂','🍫','🍬','🥨','🍰','⭐','🔥','👑'];
var clubMuted=0;
let clubV5=null,clubData=null,clubList=null,clubTab='mine',clubBusy=false,clubMsg='',clubMsgOk=false,clubLast=0,clubListLast=0,clubQ='',giftLim=null,clubArm={k:'',t:0},clubFrom=null,clubErrNet=false;
const clubOn=()=>lbOn()&&accV4!==false&&clubV5!==false&&featOn('clubs');
const clubSigned=()=>!!(accTok&&accMe);
const clubIn=()=>!!(clubData&&clubData.club);
const clubArmed=k=>clubArm.k===k&&Date.now()-clubArm.t<5000;
const clubPrizeTxt=p=>p.gems+' '+tt('Edelsteine','gems')+' + '+(p.h>=1?p.h+tt(' Std',' h'):Math.round(p.h*60)+' min')+tt(' Kekse',' of cookies');
function clubErrTxt(x){
  const m=String(x&&x.message||'');
  if(lbMissing(x)){clubV5=false;return tt('Clubs sind noch nicht eingerichtet.','Clubs aren’t set up yet.');}
  if(/not signed in/.test(m)){accUnset();accRender();return tt('Bitte melde dich wieder an.','Please sign in again.');}
  const T=[[/already in a club/,'Du bist schon in einem Club.','You’re already in a club.'],[/club name taken/,'Diesen Clubnamen gibt es schon.','That club name is already taken.'],
    [/invalid club name/,'Clubname: 3–24 Buchstaben, Zahlen, Leerzeichen, - oder _.','Club name: 3–24 letters, numbers, spaces, - or _.'],[/club not found/,'Diesen Club gibt es nicht mehr.','That club doesn’t exist anymore.'],
    [/club is closed/,'Dieser Club nimmt gerade niemanden auf.','This club isn’t taking new members right now.'],[/club is full/,'Der Club ist voll (30 Mitglieder).','The club is full (30 members).'],
    [/only the owner/,'Das darf nur der Club-Chef.','Only the club leader can do that.'],[/slow down/,'Nicht so schnell! Warte kurz.','Not so fast! Wait a moment.'],[/not in a club/,'Du bist in keinem Club.','You’re not in a club.'],
    [/invalid message/,'Nachrichten haben 1–200 Zeichen.','Messages have 1–200 characters.'],[/player not found/,'Diesen Spieler gibt es nicht. Achte auf den Benutzernamen des Kontos.','No player with that name. Use their account username.'],
    [/cannot gift yourself/,'Du kannst dir nicht selbst etwas schenken.','You can’t send a gift to yourself.'],[/daily gift limit/,'Du hast heute schon 10 Geschenke verschickt.','You already sent 10 gifts today.'],
    [/daily (gem|star) limit/,'So viel kannst du heute nicht mehr verschenken.','You can’t give that much more today.'],[/receiver limit/,'Dieser Spieler hat heute schon genug Geschenke bekommen.','That player already got enough gifts today.'],
    [/invalid (amount|gift)/,'Ungültige Menge.','Invalid amount.'],[/blocked word/,'Das enthält ein Wort, das nicht erlaubt ist.','That contains a word that isn’t allowed.'],[/muted/,'Du bist gerade stummgeschaltet.','You’re muted right now.'],
    [/chat is off/,'Der Club-Chat ist gerade ausgeschaltet.','Club chat is turned off right now.'],[/gifts are off/,'Geschenke sind gerade ausgeschaltet.','Gifts are turned off right now.'],[/clubs are off/,'Clubs sind gerade ausgeschaltet.','Clubs are turned off right now.'],
    [/too many requests/,'Zu viele Versuche von diesem Gerät. Versuch es später nochmal.','Too many tries from this device. Try again later.'],[/account too new/,'Geschenke gehen erst, wenn dein Konto einen Tag alt ist.','Gifts unlock once your account is a day old.'],
    [/play more first/,'Back zuerst mindestens 1 Million Kekse, dann kannst du Geschenke senden.','Bake at least 1 million cookies first, then you can send gifts.'],[/cannot report yourself/,'Eigene Nachrichten kannst du nicht melden.','You can’t report your own message.'],[/message not found/,'Diese Nachricht gibt es nicht mehr.','That message is gone.'],[/^banned/,'Dein Konto ist gesperrt.','Your account is banned.'],[/busy/,'Gerade viel los. Versuch es in einer Minute nochmal.','Busy right now. Try again in a minute.']];
  for(const [r,de,en] of T) if(r.test(m)) return tt(de,en);
  return tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.');
}
async function clubLoad(force){
  if(!clubOn()||!clubSigned()||clubBusy) return;
  if(!force&&Date.now()-clubLast<8000) return;
  try{clubData=await lbApi('rpc/club_mine',{p_token:accTok});clubV5=true;clubErrNet=false;clubLast=Date.now();}
  catch(x){const t=clubErrTxt(x);if(clubV5!==false&&clubSigned()){clubErrNet=true;if(force){clubMsg=t;clubMsgOk=false;}}}
  clubRender();
}
async function clubLoadList(){
  if(!clubOn()) return;
  try{clubList=await lbApi('rpc/club_list',{p_search:clubQ});clubV5=true;clubListLast=Date.now();}catch(x){clubMsg=clubErrTxt(x);clubMsgOk=false;}
  clubRender();
}
async function clubLimits(){
  if(!clubOn()||!clubSigned()) return;
  try{giftLim=await lbApi('rpc/gift_limits',{p_token:accTok});}catch(x){clubErrTxt(x);}
  clubRender();
}
async function clubCall(fn,body,okTxt){
  if(clubBusy) return null;
  clubBusy=true;clubMsg='';clubRender();
  let r=null;
  try{r=await lbApi('rpc/'+fn,Object.assign({p_token:accTok},body||{}));if(r&&typeof r==='object'&&'club' in r){clubData=r;clubLast=Date.now();}if(okTxt){clubMsg=okTxt;clubMsgOk=true;}}
  catch(x){clubMsg=clubErrTxt(x);clubMsgOk=false;r=null;}
  clubBusy=false;clubRender();return r;
}
/* Geschenke und Club-Preise abholen (alle 2 Minuten, wenn angemeldet) */
let socialBusy=false,socialLast=0;
async function socialClaim(){
  if(!clubOn()||!clubSigned()||socialBusy||document.hidden) return;
  socialBusy=true;socialLast=Date.now();
  let r=null;try{r=await lbApi('rpc/social_claim',{p_token:accTok});clubV5=true;}catch(x){clubErrTxt(x);}
  socialBusy=false;
  if(!r) {clubRender();return;}
  const gifts=r.gifts||[],rw=r.rewards||[],mail=r.mail||[];
  const mu=r.muted?Date.parse(r.muted)||0:0;if(mu!==clubMuted){clubMuted=mu;clubRender();}
  if(v48Ready&&(r.friend_requests|0)!==frReq){frReq=r.friend_requests|0;frData=null;clubRender();}
  if(!gifts.length&&!rw.length&&!mail.length) return;
  let lines='';
  gifts.forEach(g=>{
    const n=Math.max(0,Math.min(50,g.amount|0));
    if(g.kind==='stars'){S.w.star.n+=n;S.w.star.all=Math.max(S.w.star.all||0,S.w.star.n);}else S.w.mat.gem+=n;
    lines+='<div class="rwline"><span class="rwmed">🎁</span><span><b>'+n+' '+(g.kind==='stars'?tt('Sternenkrümel','star crumbs'):tt('Edelsteine','gems'))+'</b><small>'+tt('von ','from ')+escName(String(g.from||'?'))+(g.note?' · „'+escName(String(g.note))+'“':'')+'</small></span></div>';
  });
  rw.forEach(w=>{
    const pl=Math.min(3,Math.max(1,w.place|0)),p=v54Ready?clubPrizeLv(CLUB_PRIZE[pl-1]):CLUB_PRIZE[pl-1];
    S.w.mat.gem+=p.gems;addCk(Math.max(10000*p.h,C.kps0*3600*p.h));
    lines+='<div class="rwline"><span class="rwmed m'+pl+'">'+['🥇','🥈','🥉'][pl-1]+'</span><span><b>'+tt('Platz ','#')+pl+' · '+escName(String(w.club||''))+' · '+tt('Woche ','Week ')+String(w.week||'').split('-')[1]+'</b><small>'+clubPrizeTxt(p)+'</small></span></div>';
  });
  mail.forEach(m=>{
    const g=Math.max(0,m.gems|0),st=Math.max(0,m.stars|0),mn=Math.max(0,m.minutes|0);
    if(g) S.w.mat.gem+=g;if(st){S.w.star.n+=st;S.w.star.all=Math.max(S.w.star.all||0,S.w.star.n);}if(mn) addCk(Math.max(10000*mn/60,C.kps0*60*mn));
    const rew=[g?g+' '+tt('Edelsteine','gems'):'',st?st+' '+tt('Sternenkrümel','star crumbs'):'',mn?(mn>=60&&mn%60===0?mn/60+tt(' Std',' h'):mn+' min')+tt(' Kekse',' of cookies'):''].filter(Boolean).join(' + ');
    lines+='<div class="rwline"><span class="rwmed">✉️</span><span><b>'+escName(String(m.title||''))+'</b>'+(m.body?'<small>'+escName(String(m.body))+'</small>':'')+(rew?'<small>🎁 '+rew+'</small>':'')+'</span></div>';
  });
  lootSig='';recalc();save();snd('claim');
  setTimeout(()=>accUpload(false),16000);
  if(mail.length&&!rw.length&&!gifts.length){lbShowMsg(tt('Nachricht vom Admin','Message from the admin'),lines,'✉️');clubRender();return;}
  lbShowMsg(rw.length?tt('Club-Preis!','Club prize!'):tt('Du hast Post!','You’ve got mail!'),'<p>'+(rw.length?tt('Dein Club war diese Woche ganz vorne. Deine Belohnung:','Your club made the top 3 last week. Your reward:'):tt('Jemand hat dir etwas geschenkt:','Someone sent you a gift:'))+'</p>'+lines,rw.length?'🏆':'🎁');
  clubRender();
}
function clubBarHtml(){
  let sub,main;
  if(!clubSigned()){sub=tt('Bäckerei-Clubs','Bakery clubs');main=tt('Mit Konto: Clubs & Geschenke','With an account: clubs & gifts');}
  else if(clubIn()){const c=clubData.club;sub=tt('Dein Club','Your club')+(clubData.rank?' · '+tt('Platz ','#')+clubData.rank+tt(' diese Woche',' this week'):'');main=c.emoji+' '+escName(c.name);}
  else{sub=tt('Bäckerei-Clubs','Bakery clubs');main=tt('Tritt einem Club bei!','Join a club!');}
  return '<span class="ico clubico" aria-hidden="true">👥</span><span><small>'+sub+'</small><b>'+main+'</b></span><span class="go" aria-hidden="true">›</span>';
}
function clubRender(){
  if(v54Ready) clubLvlSync();
  const bar=$id('clubBar');if(!bar) return;
  bar.hidden=!clubOn();
  if(bar.hidden) {if(!$id('clubOv').hidden) closeClub();return;}
  const bh=clubBarHtml();if(bar._h!==bh){bar._h=bh;bar.innerHTML=bh;}
  set$('clubT',tt('Bäckerei-Clubs','Bakery clubs'));set$('clubClose',tt('Schließen','Close'));
  if($id('clubOv').hidden) return;
  let h='<div class="seg clubtabs" role="tablist">'+[['mine',tt('Mein Club','My club')],['list',tt('Clubs','Clubs')],['friends',tt('Freunde','Friends')],['gift',tt('Geschenke','Gifts')]].map(([t,l])=>'<button type="button" role="tab" data-clt="'+t+'" aria-selected="'+(clubTab===t)+'" aria-pressed="'+(clubTab===t)+'">'+l+(t==='friends'&&frReq>0?'<i class="tabdot" aria-label="'+frReq+'"></i>':'')+'</button>').join('')+'</div>';
  if(!clubSigned()){
    h+='<div class="clubempty"><span class="big" aria-hidden="true">👥</span><p><b>'+tt('Clubs und Geschenke brauchen ein Konto.','Clubs and gifts need an account.')+'</b></p><p class="small">'+tt('Erstelle ein Konto mit Benutzername und Passwort (keine E-Mail nötig). Dann kannst du Clubs beitreten, mit anderen chatten und Geschenke verschicken.','Create an account with a username and password (no email needed). Then you can join clubs, chat with others and send gifts.')+'</p><button type="button" class="btn primary" data-cl="signin">'+tt('Konto erstellen oder anmelden','Create account or sign in')+'</button></div>';
  }else if(clubTab==='mine') h+=clubMineHtml();
  else if(clubTab==='friends') h+=frHtml();
  else if(clubTab==='list') h+=clubListHtml();
  else h+=clubGiftHtml();
  if(clubMsg) h+='<p class="nameerr'+(clubMsgOk?' ok':'')+'">'+clubMsg+'</p>';
  const body=$id('clubBody');
  if(body._h!==h){
    const keep={},ae=document.activeElement,af=ae&&body.contains(ae)&&ae.name?ae.name:'',open=[...body.querySelectorAll('details')].map(d=>d.open),chat=body.querySelector('.clubchat'),atEnd=!chat||chat.scrollHeight-chat.scrollTop-chat.clientHeight<30,top=chat?chat.scrollTop:0;
    const key=i=>i.type==='checkbox'||i.type==='radio'?i.name+'='+i.value:i.name;
    body.querySelectorAll('input,textarea,select').forEach(i=>{if(i.name) keep[key(i)]=i.type==='checkbox'||i.type==='radio'?i.checked:i.value;});
    body._h=h;body.innerHTML=h;
    body.querySelectorAll('input,textarea,select').forEach(i=>{if(!i.name||!(key(i) in keep)) return;if(i.type==='checkbox'||i.type==='radio') i.checked=keep[key(i)];else i.value=keep[key(i)];});
    body.querySelectorAll('details').forEach((d,i)=>{if(open[i]) d.open=true;});
    const c2=body.querySelector('.clubchat');if(c2) c2.scrollTop=atEnd?c2.scrollHeight:top;
    if(af){const f=body.querySelector('[name="'+af+'"]');if(f&&f.type!=='radio') f.focus();}
  }
}
function clubWeekLeft(){return lbLeft(lbEnds('W')-Date.now());}
function clubMineHtml(){
  if(!clubData) return '<p class="lbmsg">'+(clubErrNet?tt('Clubs sind gerade nicht erreichbar.','Clubs can’t be reached right now.'):tt('Lädt …','Loading …'))+'</p>';
  if(!clubData.club){
    return '<div class="clubempty"><span class="big" aria-hidden="true">🧑‍🍳</span><p><b>'+tt('Du bist noch in keinem Club.','You’re not in a club yet.')+'</b></p><p class="small">'+tt('In einem Club backt ihr zusammen. Die 3 Clubs, die in einer Woche die meisten Kekse backen, bekommen Preise – für jedes Mitglied, das mitgebacken hat.','In a club you bake together. The 3 clubs that bake the most cookies in a week win prizes – for every member who helped.')+'</p><button type="button" class="btn primary" data-clt="list">'+tt('Clubs ansehen','Browse clubs')+'</button></div>'
      +'<form class="clubcard clubform" id="clubNewF" novalidate><h4>'+tt('Eigenen Club gründen','Start your own club')+'</h4><div class="clubemo" role="radiogroup" aria-label="'+tt('Symbol','Icon')+'">'+CLUB_EMO.map((e,i)=>'<label><input type="radio" name="emoji" value="'+e+'"'+(i===0?' checked':'')+'><span>'+e+'</span></label>').join('')+'</div><input class="namein" name="cname" maxlength="24" placeholder="'+tt('Clubname (3–24 Zeichen)','Club name (3–24 characters)')+'" aria-label="'+tt('Clubname','Club name')+'"><input class="namein" name="cdescr" maxlength="140" placeholder="'+tt('Beschreibung (optional)','Description (optional)')+'" aria-label="'+tt('Beschreibung','Description')+'"><button type="submit" class="btn primary"'+(clubBusy?' disabled':'')+'>'+tt('Club gründen','Create club')+'</button></form>';
  }
  const c=clubData.club,own=clubData.role==='owner',D=clubData;
  let h='<div class="clubhead"><span class="clubemoji" aria-hidden="true">'+escName(c.emoji)+'</span><span><b>'+escName(c.name)+(c.trophies?' <span class="trophy" title="'+tt('Clubkrieg-Trophäen','Club war trophies')+'">🏆 ×'+c.trophies+'</span>':'')+'</b><small>'+(c.descr?escName(c.descr):tt('Keine Beschreibung','No description'))+'</small><small>'+D.members.length+'/30 '+tt('Mitglieder','members')+' · '+(c.open?tt('offen','open'):tt('geschlossen','closed'))+'</small></span></div>'+(v54Ready?clubLvlHtml(c):'');
  h+='<div class="lbprize"><div class="lbends"><span>'+tt('Diese Woche: Platz ','This week: #')+(D.rank||'–')+' · +'+fmt(+D.week_gain||0)+'</span><b data-clleft>'+clubWeekLeft()+'</b></div><div class="lbprizes">'+CLUB_PRIZE.map((p,i)=>'<div class="lbpz"><span class="rwmed m'+(i+1)+'">'+['🥇','🥈','🥉'][i]+'</span><small>'+clubPrizeTxt(v54Ready?clubPrizeLv(p):p)+'</small></div>').join('')+'</div><p class="small" style="margin:6px 0 0">'+tt('Gezählt werden die Kekse, die ihr diese Woche backt (beim Speichern ins Konto). Jedes Mitglied, das mitbackt, bekommt den Preis.','Counts the cookies you bake this week (when your game saves to your account). Every member who bakes gets the prize.')+'</p></div>';
  if(v48Ready) h+=warHtml(D);
  h+='<h4 class="clubh">'+tt('Mitglieder','Members')+'</h4><div class="lblist">'+D.members.map((m,i)=>{
    const me=accMe&&m.username.toLowerCase()===accMe.username.toLowerCase();
    return '<div class="lbrow'+(me?' me':'')+'" style="--i:'+Math.min(i,12)+'"><span class="rk">'+(m.role==='owner'?'👑':i+1)+'</span><button type="button" class="nm pname" data-prof="'+escName(m.username)+'">'+escName(m.username)+'</button><span class="sc">+'+fmt(+m.gain||0)+(own&&!me?' <button type="button" class="btn sm warn'+(clubArmed('kick:'+m.username)?' armed':'')+'" data-cl="kick:'+escName(m.username)+'">'+(clubArmed('kick:'+m.username)?tt('Sicher?','Sure?'):tt('Entfernen','Remove'))+'</button>':'')+'</span></div>';
  }).join('')+'</div>';
  h+='<h4 class="clubh">'+tt('Club-Chat','Club chat')+'</h4>'+(v51Ready?chatPinHtml(D,own):'')+'<div class="clubchat" aria-live="polite">'+(D.msgs&&D.msgs.length?D.msgs.map(m=>{const me=accMe&&String(m.username).toLowerCase()===accMe.username.toLowerCase(),adm=!/^[A-Za-z0-9_]+$/.test(String(m.username)),rk='report:'+m.id;return '<div class="cmsg'+(me?' me':'')+(adm?' adm':'')+'"><small>'+escName(String(m.username))+' · '+new Date(m.created_at).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+(me||adm?'':' <button type="button" class="crep'+(clubArmed(rk)?' armed':'')+'" data-cl="'+rk+'" title="'+tt('Melden','Report')+'" aria-label="'+tt('Nachricht melden','Report message')+'">'+(clubArmed(rk)?tt('Melden?','Report?'):'⚑')+'</button>')+'</small><span>'+escName(String(m.body))+'</span>'+(v51Ready?chatMsgExtra(m,own):'')+'</div>';}).join(''):'<p class="small" style="margin:0;text-align:center">'+tt('Noch keine Nachrichten. Sag Hallo!','No messages yet. Say hello!')+'</p>')+'</div>'
    +(!featOn('chat')?'<p class="small clubnote">'+tt('💬 Der Club-Chat ist gerade ausgeschaltet.','💬 Club chat is turned off right now.')+'</p>':clubMuted>Date.now()?'<p class="small clubnote">'+tt('🔇 Du bist bis ','🔇 You’re muted until ')+new Date(clubMuted).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+tt(' stummgeschaltet.','.')+'</p>':'<form class="coderow" id="clubPostF" novalidate><input class="namein" name="body" maxlength="200" autocomplete="off" placeholder="'+tt('Nachricht an deinen Club','Message to your club')+'" aria-label="'+tt('Nachricht','Message')+'">'+(v51Ready?'<button type="button" class="btn wave" data-cr="wave" title="'+tt('Winken','Wave')+'" aria-label="'+tt('Winken','Wave')+'"'+(clubBusy?' disabled':'')+'>👋</button>':'')+'<button type="submit" class="btn primary"'+(clubBusy?' disabled':'')+'>'+tt('Senden','Send')+'</button></form>')
    +'<p class="small">'+tt('Sei freundlich. Mit ⚑ meldest du eine Nachricht an den Admin.','Be kind. Tap ⚑ to report a message to the admin.')+'</p>';
  if(own) h+='<details class="fold accfold"><summary>'+tt('Club bearbeiten','Edit club')+'</summary><form class="accform" id="clubEditF" novalidate><input class="namein" name="edescr" maxlength="140" value="'+escName(c.descr||'')+'" placeholder="'+tt('Beschreibung','Description')+'"><label class="chk"><input type="checkbox" name="eopen"'+(c.open?' checked':'')+'><span>'+tt('Neue Mitglieder dürfen beitreten','New members may join')+'</span></label><button type="submit" class="btn">'+tt('Speichern','Save')+'</button></form></details>';
  h+='<div class="lbfoot"><span class="small">'+(own?tt('Du bist Club-Chef. Wenn du gehst, übernimmt das älteste Mitglied.','You’re the club leader. If you leave, the longest member takes over.'):'')+'</span><span class="btns"><button type="button" class="btn sm" data-cl="refresh">'+tt('Aktualisieren','Refresh')+'</button><button type="button" class="btn sm warn'+(clubArmed('leave')?' armed':'')+'" data-cl="leave">'+(clubArmed('leave')?tt('Wirklich verlassen?','Really leave?'):tt('Club verlassen','Leave club'))+'</button></span></div>';
  return h;
}
function clubListHtml(){
  let h='<form class="coderow" id="clubSearchF" novalidate><input class="namein" name="q" maxlength="24" autocomplete="off" placeholder="'+tt('Club suchen','Search clubs')+'" aria-label="'+tt('Club suchen','Search clubs')+'"><button type="submit" class="btn">'+tt('Suchen','Search')+'</button></form>';
  if(!clubList) return h+'<p class="lbmsg">'+tt('Lädt …','Loading …')+'</p>';
  if(!clubList.length) return h+'<p class="lbmsg">'+(clubQ?tt('Kein Club gefunden.','No club found.'):tt('Noch keine Clubs. Gründe den ersten unter „Mein Club“!','No clubs yet. Start the first one under “My club”!'))+'</p>';
  const mine=clubIn()?clubData.club.id:'';
  return h+'<div class="lblist">'+clubList.map((c,i)=>{
    const full=c.members>=30,can=!clubIn()&&c.open&&!full;
    return '<div class="lbrow clubrow" style="--i:'+Math.min(i,12)+'"><span class="rk'+(i<3&&+c.week_gain>0?' m'+(i+1):'')+'">'+(i<3&&+c.week_gain>0?['🥇','🥈','🥉'][i]:escName(c.emoji))+'</span><span class="nm"><b>'+escName(c.name)+(c.trophies?' 🏆'+c.trophies:'')+'</b><small>'+(c.level?tt('Stufe ','Level ')+c.level+' · ':'')+c.members+'/30 · +'+fmt(+c.week_gain||0)+tt(' diese Woche',' this week')+(c.descr?' · '+escName(c.descr):'')+'</small></span><span class="sc">'+(c.id===mine?'<span class="small">'+tt('Dein Club','Your club')+'</span>':can?'<button type="button" class="btn sm primary" data-cl="join:'+c.id+'"'+(clubBusy?' disabled':'')+'>'+tt('Beitreten','Join')+'</button>':'<span class="small">'+(full?tt('voll','full'):!c.open?tt('geschlossen','closed'):'')+'</span>')+'</span></div>';
  }).join('')+'</div>';
}
function clubGiftHtml(){
  const L=giftLim,gem=Math.floor(S.w.mat.gem||0),st=Math.floor(S.w.star.n||0);
  let h='<p class="small">'+tt('Schenke anderen Spielern mit Konto Edelsteine oder Sternenkrümel. Sie bekommen das Geschenk beim nächsten Spielen.','Send gems or star crumbs to other players with an account. They get the gift the next time they play.')+'</p>';
  h+='<div class="mats giftmats"><span class="mat">💎 '+fmt(gem)+' '+tt('Edelsteine','gems')+'</span><span class="mat">⭐ '+fmt(st)+' '+tt('Sternenkrümel','star crumbs')+'</span></div>';
  if(!featOn('gifts')) return h+'<p class="small clubnote">'+tt('🎁 Geschenke sind gerade ausgeschaltet.','🎁 Gifts are turned off right now.')+'</p>';
  if(clubMuted>Date.now()) return h+'<p class="small clubnote">'+tt('🔇 Du bist gerade stummgeschaltet und kannst nichts verschenken.','🔇 You’re muted right now and can’t send gifts.')+'</p>';
  if(lbCheat()) return h+'<p class="nameerr">'+tt('Mit diesem Spielstand kannst du nichts verschenken, weil das Admin-Panel benutzt wurde oder er verändert wurde.','You can’t send gifts from this save because it used the admin panel or was modified.')+'</p>';
  h+='<form class="clubcard accform" id="giftF" novalidate><input class="namein" name="to" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" value="'+escName(giftTo||'')+'" placeholder="'+tt('Benutzername des Empfängers','Receiver’s username')+'" aria-label="'+tt('Empfänger','Receiver')+'"><div class="giftrow"><select class="namein" name="kind" aria-label="'+tt('Was','What')+'"><option value="gems">💎 '+tt('Edelsteine','gems')+'</option><option value="stars">⭐ '+tt('Sternenkrümel','Star crumbs')+'</option></select><input class="namein" name="amount" type="number" min="1" max="50" value="10" aria-label="'+tt('Menge','Amount')+'"></div><input class="namein" name="note" maxlength="60" autocomplete="off" placeholder="'+tt('Nachricht (optional)','Note (optional)')+'" aria-label="'+tt('Nachricht','Note')+'"><button type="submit" class="btn primary'+(clubArmed('gift')?' armed':'')+'"'+(clubBusy?' disabled':'')+'>'+(clubArmed('gift')?tt('Wirklich verschenken? Nochmal','Really send? Again'):tt('Geschenk senden','Send gift'))+'</button></form>';
  h+='<p class="small">'+(L?tt('Heute noch: ','Left today: ')+Math.max(0,L.gems_left)+' '+tt('Edelsteine','gems')+' · '+Math.max(0,L.stars_left)+tt(' Sternenkrümel',' star crumbs')+' · '+Math.max(0,L.gifts_left)+tt(' Geschenke',' gifts'):tt('Pro Tag: bis zu 50 Edelsteine, 5 Sternenkrümel und 10 Geschenke.','Per day: up to 50 gems, 5 star crumbs and 10 gifts.'))+'</p>';
  return h;
}
function openClub(){
  clubFrom=document.activeElement;$id('clubOv').hidden=false;clubMsg='';$id('clubBody')._h='';clubRender();$id('clubClose').focus();
  if(clubSigned()){clubLoad(true);if(clubTab==='list') clubLoadList();if(clubTab==='gift') clubLimits();if(Date.now()-socialLast>20000) socialClaim();}
}
function closeClub(){if($id('clubOv').hidden) return;$id('clubOv').hidden=true;clubArm={k:'',t:0};const f=clubFrom&&clubFrom.offsetParent?clubFrom:$id('clubBar');if(f&&f.focus) f.focus();}
$id('clubBar').addEventListener('click',openClub);
$id('clubClose').addEventListener('click',closeClub);
$id('clubOv').addEventListener('click',async e=>{
  if(e.target===$id('clubOv')){closeClub();return;}
  const t=e.target.closest('[data-clt]');
  if(t){clubTab=t.dataset.clt;clubMsg='';clubArm={k:'',t:0};clubRender();if(clubTab==='list'&&Date.now()-clubListLast>5000) clubLoadList();if(clubTab==='gift') clubLimits();if(clubTab==='mine') clubLoad(false);if(clubTab==='friends') frLoad();return;}
  const b=e.target.closest('[data-cl]');if(!b) return;
  const [a,arg]=b.dataset.cl.split(/:(.*)/s);clubMsg='';
  if(a==='signin'){closeClub();openSettings();showSetPane('save');return;}
  if(a==='refresh'){clubLoad(true);return;}
  if(a==='report'){
    if(!clubArmed(b.dataset.cl)){clubArm={k:b.dataset.cl,t:Date.now()};clubRender();return;}
    clubArm={k:'',t:0};
    try{await lbApi('rpc/club_report',{p_token:accTok,p_msg:+arg});clubMsg=tt('Danke! Der Admin schaut sich die Nachricht an.','Thanks! The admin will take a look.');clubMsgOk=true;}
    catch(x){clubMsg=lbMissing(x)?tt('Melden geht erst nach dem nächsten Server-Update.','Reporting works after the next server update.'):clubErrTxt(x);clubMsgOk=false;}
    clubRender();return;
  }
  if(a==='join'){const r=await clubCall('club_join',{p_club:arg});if(r){clubTab='mine';clubMsg=tt('Willkommen im Club!','Welcome to the club!');clubMsgOk=true;snd('claim');clubListLast=0;clubRender();}return;}
  if(a==='leave'||a==='kick'){
    if(!clubArmed(b.dataset.cl)){clubArm={k:b.dataset.cl,t:Date.now()};clubRender();return;}
    clubArm={k:'',t:0};
    if(a==='leave'){const ok=await clubCall('club_leave',{},tt('Du hast den Club verlassen.','You left the club.'));if(ok!==null||clubMsgOk){clubData={club:null};clubListLast=0;clubRender();}}
    else await clubCall('club_kick',{p_user:arg},tt('Mitglied entfernt.','Member removed.'));
  }
});
$id('clubOv').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,id=f.getAttribute('id'),d=Object.fromEntries(new FormData(f).entries());
  if(id==='clubNewF'){
    const nm=String(d.cname||'').trim().replace(/\s+/g,' ');
    if(!/^[A-Za-z0-9ÄÖÜäöüß _-]{3,24}$/.test(nm)){clubMsg=tt('Clubname: 3–24 Buchstaben, Zahlen, Leerzeichen, - oder _.','Club name: 3–24 letters, numbers, spaces, - or _.');clubMsgOk=false;clubRender();return;}
    const r=await clubCall('club_create',{p_name:nm,p_emoji:d.emoji||'🍪',p_descr:String(d.cdescr||'').trim()});
    if(r){clubMsg=tt('Dein Club ist gegründet! Lade Freunde ein.','Your club is ready! Invite your friends.');clubMsgOk=true;snd('claim');clubListLast=0;clubRender();}
    return;
  }
  if(id==='clubPostF'){
    const body=String(d.body||'').trim();if(!body) return;
    const r=await clubCall('club_post',{p_body:body});
    if(r){const i=$id('clubBody').querySelector('[name=body]');if(i){i.value='';i.focus();}}
    return;
  }
  if(id==='clubEditF'){await clubCall('club_edit',{p_descr:String(d.edescr||'').trim(),p_open:!!f.querySelector('[name=eopen]').checked},tt('Gespeichert.','Saved.'));return;}
  if(id==='clubSearchF'){clubQ=String(d.q||'').trim();clubList=null;clubRender();clubLoadList();return;}
  if(id==='giftF'){
    const to=String(d.to||'').trim(),kind=d.kind==='stars'?'stars':'gems',n=Math.floor(+d.amount||0),have=kind==='stars'?S.w.star.n:S.w.mat.gem;
    let err='';
    if(lbCheat()) return;
    if(!/^[A-Za-z0-9_]{3,16}$/.test(to)) err=tt('Gib den Benutzernamen des Kontos ein.','Enter the account username.');
    else if(accMe&&to.toLowerCase()===accMe.username.toLowerCase()) err=tt('Du kannst dir nicht selbst etwas schenken.','You can’t send a gift to yourself.');
    else if(n<1||n>(kind==='stars'?5:50)) err=kind==='stars'?tt('1 bis 5 Sternenkrümel pro Tag.','1 to 5 star crumbs per day.'):tt('1 bis 50 Edelsteine pro Tag.','1 to 50 gems per day.');
    else if(have<n) err=tt('So viel hast du nicht.','You don’t have that many.');
    if(err){clubMsg=err;clubMsgOk=false;clubArm={k:'',t:0};clubRender();return;}
    if(!clubArmed('gift')){clubArm={k:'gift',t:Date.now()};clubRender();return;}
    clubArm={k:'',t:0};
    const r=await clubCall('gift_send',{p_to:to,p_kind:kind,p_amount:n,p_note:String(d.note||'').trim()});
    if(r){
      if(kind==='stars') S.w.star.n=Math.max(0,S.w.star.n-n);else S.w.mat.gem=Math.max(0,S.w.mat.gem-n);
      lootSig='';giftLim=r;save();setTimeout(()=>accUpload(false),16000);snd('claim');
      clubMsg=tt('Geschenk an ','Gift sent to ')+escName(to)+tt(' gesendet!','!');clubMsgOk=true;
      giftTo='';const nf=$id('giftF');if(nf){nf.reset();const ti=nf.querySelector('[name=to]');if(ti) ti.value='';}clubRender();
    }
  }
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$id('clubOv').hidden&&$id('nameOv').hidden&&$id('rwOv').hidden){e.preventDefault();e.stopImmediatePropagation();closeClub();}},true);
setInterval(()=>{
  if(!clubOn()) return;
  const open=!$id('clubOv').hidden;
  if(open){document.querySelectorAll('[data-clleft]').forEach(e=>{const v=clubWeekLeft();if(e.textContent!==v) e.textContent=v;});if(clubArm.k&&Date.now()-clubArm.t>5000){clubArm={k:'',t:0};clubRender();}}
  if(document.hidden||!clubSigned()) return;
  if(open&&clubTab==='mine'&&Date.now()-clubLast>(v58Ready&&clubRT.on?60000:10000)) clubLoad(false); /* V58: with the live signal a slow check is enough */
  else if(!open&&Date.now()-clubLast>120000) clubLoad(false);
  if(Date.now()-socialLast>120000) socialClaim();
},1000);
var clubWho='';
function clubAccChanged(){
  const who=clubSigned()?accMe.username:'';
  if(who===clubWho){clubRender();return;}
  clubWho=who;clubData=null;clubList=null;giftLim=null;clubLast=0;clubListLast=0;
  if(who){clubLoad(true);setTimeout(socialClaim,1500);}
  clubRender();
}

clubRender();
if(lbOn()) setTimeout(()=>{if(clubV5===null) clubLoadList();},2500);
v44Ready=true;
