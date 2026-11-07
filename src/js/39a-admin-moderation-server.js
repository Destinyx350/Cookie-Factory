/* Nur in admin.html (nicht im Spiel für Spieler). */
/* Server-Admin: eigenes Passwort, der Server gibt dafür ein Sitzungs-Token (12 Std). Nur das Token liegt im Tab-Speicher. */
var ADM_TOK='keksfabrik-admtok';
try{const o=JSON.parse(sessionStorage.getItem(ADM_TOK)||'null');if(o&&o.t&&o.e>Date.now()+60000&&admOK) admPass=o.t;}catch(x){}
function admSrvDrop(){admPass='';try{sessionStorage.removeItem(ADM_TOK);}catch(x){}}
var admSrvBusy=false,admNeedCode=false,admPwHold='';
async function admSrvLogin(pw,where){
  if(admSrvBusy) return;
  /* Zwei-Schritt-Anmeldung: Im zweiten Schritt ist die Eingabe der 6-stellige Code. */
  let code=null;if(admNeedCode){code=String(pw).replace(/\s/g,'');pw=admPwHold;}
  const fail=m=>{if(where==='lb'){admLbErr=m;admLbRender();}else if(where==='on'){admOnErr=m;admOnRender();}else{admModErr=m;admModRender();admSrvRender();}};
  admSrvBusy=true;let r=null;
  try{r=await lbApi('rpc/admin_login',code?{p_pass:pw,p_code:code}:{p_pass:pw});}
  catch(x){admSrvBusy=false;if(lbMissing(x)){admPass=pw;admSrvAfter();return;}fail(tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.'));return;}
  admSrvBusy=false;
  if(r&&r.error==='code needed'){admNeedCode=true;admPwHold=pw;admSrvRerender();setTimeout(()=>{const i=els.admin.querySelector('.admpane:not([hidden]) [name=spw]');if(i) i.focus();},50);return;}
  if(r&&r.error==='locked'){admNeedCode=false;admPwHold='';}
  if(!r||r.error){fail(r&&r.error==='wrong code'?tt('Falscher Code. Nimm den aktuellen Code aus deiner Authenticator-App.','Wrong code. Use the current code from your authenticator app.'):r&&r.error==='locked'?tt('Zu viele falsche Versuche. Warte 15 Minuten.','Too many wrong tries. Wait 15 minutes.'):r&&r.error==='not set up'?tt('Das Server-Passwort ist noch nicht eingerichtet.','The server password isn’t set up yet.'):tt('Falsches Server-Passwort.','Wrong server password.'));return;}
  admNeedCode=false;admPwHold='';
  admPass=r.token;try{sessionStorage.setItem(ADM_TOK,JSON.stringify({t:r.token,e:Date.parse(r.expires_at)||Date.now()+11*3600e3}));}catch(x){}
  toast(tt('Server-Werkzeuge entsperrt.','Server tools unlocked.'));admSrvAfter();
}
function admSrvAfter(){admLbErr='';admOnErr='';admModErr='';admLbCall('list');admOnCall('list');admAccCall('list');admClubCall('list');admModLoad();admSrvLoad();if(v52Ready) admBanCall('list');if(v53Ready) admTeamLoad();}
function admSrvRerender(){admLbRender();admOnRender();admModRender();admSrvRender();}
const admSrvForm=(id,note)=>(admNeedCode?'<form class="coderow" id="'+id+'" novalidate><input type="text" class="namein" name="spw" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="'+tt('6-stelliger Code','6-digit code')+'" aria-label="'+tt('Code aus der Authenticator-App','Code from your authenticator app')+'"><button type="submit" class="btn primary">'+tt('Bestätigen','Confirm')+'</button><button type="button" class="btn" data-sva="codeback">'+tt('Zurück','Back')+'</button></form><p class="small" style="margin-top:6px">'+tt('Zwei-Schritt-Anmeldung ist an. Gib den Code aus deiner Authenticator-App ein.','Two-step sign-in is on. Enter the code from your authenticator app.')+'</p>':'<form class="coderow" id="'+id+'" novalidate><input type="password" class="namein" name="spw" autocomplete="current-password" placeholder="'+tt('Server-Passwort','Server password')+'" aria-label="'+tt('Server-Passwort','Server password')+'"><button type="submit" class="btn primary">'+tt('Entsperren','Unlock')+'</button></form>')+'<p class="small" style="margin-top:6px">'+(note||tt('Die Server-Werkzeuge haben ein eigenes Passwort. Nach 5 falschen Versuchen sind sie 15 Minuten gesperrt.','The server tools have their own password. After 5 wrong tries they lock for 15 minutes.'))+'</p>';
els.admin.addEventListener('submit',e=>{
  const id=e.target.getAttribute('id');if(!['admModPwF','admSrvPwF'].includes(id)) return;
  e.preventDefault();const v=e.target.querySelector('[name=spw]').value;if(v) admSrvLogin(v,'mod');
});
els.admin.addEventListener('click',e=>{if(e.target.closest('#admLockBtn')&&admPass){const t=admPass;admSrvDrop();lbApi('rpc/admin_logout',{p_pass:t}).catch(()=>{});}},true);

/* Gemeinsame Bausteine */
const admDT=v=>v?new Date(v).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'–';
const admCardH=(t,b)=>'<div class="admcard"><h4>'+t+'</h4>'+b+'</div>';
function admErrTxt(x){
  const m=String(x&&x.message||'');
  if(/wrong admin password/.test(m)){admSrvDrop();return tt('Deine Server-Sitzung ist abgelaufen. Bitte entsperre sie neu.','Your server session ended. Please unlock again.');}
  if(lbMissing(x)) return tt('Die Datenbank kennt das noch nicht. Führe zuerst docs/security-v6.sql in Supabase aus.','The database doesn’t have this yet. Run docs/security-v6.sql in Supabase first.');
  const T=[[/player not found/,'Diesen Spieler gibt es nicht.','No player with that name.'],[/invalid club name/,'Clubname: 3–24 Buchstaben, Zahlen, Leerzeichen, - oder _.','Club name: 3–24 letters, numbers, spaces, - or _.'],[/invalid username/,'Benutzername: 3–16 Buchstaben, Zahlen oder _.','Username: 3–16 letters, numbers or _.'],[/username taken/,'Diesen Benutzernamen gibt es schon.','That username is taken.'],[/invalid name/,'Name: 2–20 Zeichen, ohne < und >.','Name: 2–20 characters, no < or >.'],[/invalid word/,'Wörter: 2–30 Buchstaben.','Words: 2–30 letters.'],[/title missing/,'Bitte gib einen Titel ein.','Please enter a title.'],[/check constraint/,'Ungültige Eingabe.','Invalid input.']];
  for(const [r,de,en] of T) if(r.test(m)) return tt(de,en);
  return tt('Hat nicht geklappt: ','Didn’t work: ')+escName(m);
}

/* ---------- Admin: Moderation ---------- */
var admModErr='',admModBusy=false,admReports=null,admMutes=null,admWords=null,admFind=null,admFindQ='',admMailTo={kind:'player',to:'',club:'',name:''},admModArm={k:'',t:0};
const admModArmed=k=>admModArm.k===k&&Date.now()-admModArm.t<5000;
async function admMod(action,data){return lbApi('rpc/admin_mod',{p_pass:admPass,p_action:action,p_data:data||null});}
async function admModLoad(){
  if(!admPass||admModBusy) return;
  admModBusy=true;
  try{const [r,m,w]=await Promise.all([admMod('reports'),admMod('mutes'),admMod('words')]);admReports=r||[];admMutes=m||[];admWords=w||[];admModErr='';}
  catch(x){admModErr=admErrTxt(x);}
  admModBusy=false;admModRender();
}
async function admModDo(action,data,okTxt,after){
  admModErr='';
  try{const r=await admMod(action,data);if(okTxt) toast(okTxt);if(after) after(r);}
  catch(x){admModErr=admErrTxt(x);}
  admModArm={k:'',t:0};admModRender();
}
function admModRender(){
  const box=$id('admMod');if(!box) return;
  let h='';
  if(!lbOn()) h=admCardH(tt('Moderation','Moderation'),'<p class="small">'+tt('Online-Funktionen sind nicht eingerichtet.','Online features aren’t set up.')+'</p>');
  else if(!admPass) h=admCardH('🔐 '+tt('Server-Werkzeuge','Server tools'),admSrvForm('admModPwF'))+(admModErr?'<p class="nameerr">'+admModErr+'</p>':'');
  else{
    if(admModErr) h+='<p class="nameerr">'+admModErr+'</p>';
    const R=admReports||[],open=R.filter(r=>r.status==='open');
    const repRow=r=>'<div class="admlbr'+(r.status==='open'?'':' done')+'"><span class="rk">'+(r.status==='open'?'🚩':'✓')+'</span><span class="who"><b>'+escName(r.reported)+' · '+escName(r.club)+'</b><small>„'+escName(r.body)+'“</small><small>'+tt('Gemeldet von ','Reported by ')+escName(r.reporter)+' · '+admDT(r.created_at)+(r.msg_exists?'':' · '+tt('Nachricht schon gelöscht','message already deleted'))+'</small></span><span class="btns">'+(r.status==='open'?(r.msg_exists?'<button type="button" class="btn sm warn" data-mda="repdel:'+r.id+'">'+tt('Nachricht löschen','Delete message')+'</button>':'')+'<button type="button" class="btn sm" data-mda="repok:'+r.id+'">'+tt('Erledigt','Done')+'</button><button type="button" class="btn sm" data-mda="mute24:'+escName(r.reported)+'">'+tt('24 Std stumm','Mute 24 h')+'</button>':'')+'</span></div>';
    h+=admCardH('🚩 '+tt('Meldungen','Reports')+' <small class="muted">('+(admReports?open.length+' '+tt('offen','open'):'…')+')</small>',
      (admReports?(open.length?'<div class="admlbl">'+open.map(repRow).join('')+'</div>':'<p class="small">'+tt('Keine offenen Meldungen. 🎉','No open reports. 🎉')+'</p>')
        +(R.length>open.length?'<details class="fold"><summary>'+tt('Erledigte Meldungen','Handled reports')+' ('+(R.length-open.length)+')</summary><div class="admlbl">'+R.filter(r=>r.status!=='open').map(repRow).join('')+'</div></details>':''):'<p class="small">'+tt('Lädt …','Loading …')+'</p>')
      +'<div class="btns" style="margin-top:8px"><button type="button" class="btn sm" data-mda="reload">'+tt('Aktualisieren','Refresh')+'</button></div>');
    /* Spielersuche */
    let f='<form class="coderow" id="admFindF" novalidate><input class="namein" name="q" maxlength="24" autocomplete="off" value="'+escName(admFindQ)+'" placeholder="'+tt('Name von Spieler, Bäckerei oder Club','Player, bakery or club name')+'"><button type="submit" class="btn primary">'+tt('Suchen','Search')+'</button></form>';
    if(admFind){
      const A=admFind.accounts||[],Sc=admFind.scores||[],Cl=admFind.clubs||[];
      if(!A.length&&!Sc.length&&!Cl.length) f+='<p class="small">'+tt('Nichts gefunden.','Nothing found.')+'</p>';
      if(A.length) f+='<h5 class="admh5">👤 '+tt('Konten','Accounts')+'</h5><div class="admlbl">'+A.map(a=>{
        const on=a.online&&Date.now()-Date.parse(a.online)<180000;
        return '<div class="admlbr"><span class="rk">'+(on?'🟢':'👤')+'</span><span class="who"><b>'+escName(a.username)+(a.muted?' · 🔇':'')+'</b><small>'+fmt(+a.save_baked||0)+tt(' Kekse',' cookies')+' · '+(a.club?'👥 '+escName(a.club)+' · ':'')+tt('dabei seit ','joined ')+new Date(a.created_at).toLocaleDateString(LOC[LANG])+'</small><small>'+tt('Zuletzt: ','Last seen: ')+admDT(a.online||a.save_at||a.last_login)+' · 🎁 '+a.gifts_sent+' '+tt('gesendet','sent')+' / '+a.gifts_got+' '+tt('bekommen','got')+' (30 '+tt('Tage','days')+') · 🚩 '+a.reports+(a.muted?' · '+tt('stumm bis ','muted until ')+admDT(a.muted):'')+'</small></span><span class="btns"><button type="button" class="btn sm primary" data-mda="mailto:'+escName(a.username)+'">'+tt('Senden','Send')+'</button>'+(a.muted?'<button type="button" class="btn sm" data-mda="unmute:'+escName(a.username)+'">'+tt('Stumm aus','Unmute')+'</button>':'<button type="button" class="btn sm" data-mda="mute24:'+escName(a.username)+'">'+tt('24 Std stumm','Mute 24 h')+'</button>')+'<button type="button" class="btn sm" data-mda="ren:account:'+a.id+':'+escName(a.username)+'">'+tt('Umbenennen','Rename')+'</button>'+(v52Ready?'<button type="button" class="btn sm warn" data-ban="pick:'+escName(a.username)+'">'+tt('Sperren …','Ban …')+'</button>':'')+'</span></div>';}).join('')+'</div>';
      if(Sc.length) f+='<h5 class="admh5">🏆 '+tt('Bestenliste','Leaderboard')+'</h5><div class="admlbl">'+Sc.map(s=>'<div class="admlbr"><span class="rk">'+(s.banned?'⛔':'🏆')+'</span><span class="who"><b>'+escName(s.name)+'</b><small>'+fmt(+s.score||0)+tt(' Kekse',' cookies')+' · '+admDT(s.updated_at)+'</small></span><span class="btns"><button type="button" class="btn sm" data-mda="ren:score:'+s.id+':'+escName(s.name)+'">'+tt('Umbenennen','Rename')+'</button><button type="button" class="btn sm warn'+(admModArmed('ban:'+s.id)?' armed':'')+'" data-mda="ban:'+s.id+'">'+(admModArmed('ban:'+s.id)?tt('Sicher?','Sure?'):tt('Sperren','Ban'))+'</button></span></div>').join('')+'</div>';
      if(Cl.length) f+='<h5 class="admh5">👥 '+tt('Clubs','Clubs')+'</h5><div class="admlbl">'+Cl.map(c=>'<div class="admlbr"><span class="rk">'+escName(c.emoji)+'</span><span class="who"><b>'+escName(c.name)+'</b><small>'+c.members+tt(' Mitglieder',' members')+'</small></span><span class="btns"><button type="button" class="btn sm primary" data-mda="mailclub:'+c.id+':'+escName(c.name)+'">'+tt('Nachricht','Message')+'</button><button type="button" class="btn sm" data-mda="ren:club:'+c.id+':'+escName(c.name)+'">'+tt('Umbenennen','Rename')+'</button></span></div>').join('')+'</div>';
    }
    h+=admCardH('🔎 '+tt('Spieler suchen','Find a player'),f);
    /* Senden */
    const M=admMailTo;
    h+=admCardH('✉️ '+tt('Nachricht oder Geschenk senden','Send a message or gift'),'<form class="admform" id="admMailF" novalidate>'
      +'<label class="small">'+tt('An','To')+'<select class="namein" name="kind"><option value="player"'+(M.kind==='player'?' selected':'')+'>'+tt('Einen Spieler','One player')+'</option>'+(M.club?'<option value="club" selected>👥 '+escName(M.name)+'</option>':'')+'</select></label>'
      +'<label class="small">'+tt('Benutzername','Username')+'<input class="namein" name="to" maxlength="16" value="'+escName(M.to)+'" autocapitalize="off" spellcheck="false"></label>'
      +'<input class="namein" name="title" maxlength="80" placeholder="'+tt('Titel, z. B. Danke fürs Spielen!','Title, e.g. Thanks for playing!')+'" style="grid-column:1/-1"><textarea class="namein" name="body" maxlength="600" rows="2" placeholder="'+tt('Nachricht (optional)','Message (optional)')+'" style="grid-column:1/-1"></textarea>'
      +'<label class="small">'+tt('Edelsteine','Gems')+'<input class="namein" name="gems" type="number" min="0" max="100000" value="0"></label><label class="small">'+tt('Sternenkrümel','Star crumbs')+'<input class="namein" name="stars" type="number" min="0" max="1000" value="0"></label><label class="small">'+tt('Minuten Produktion','Minutes of production')+'<input class="namein" name="minutes" type="number" min="0" max="10080" value="0"></label>'
      +'<button type="submit" class="btn primary">'+tt('Senden','Send')+'</button></form><p class="small" style="margin-top:6px">'+tt('Geht an Spieler mit Konto. Sie bekommen es beim nächsten Spielen als Nachricht. An einen Club: jedes Mitglied bekommt es, und es erscheint im Club-Chat.','Goes to players with an account. They get it as a message the next time they play. To a club: every member gets it, and it appears in the club chat.')+'</p>');
    /* Stumm */
    const Mu=admMutes||[];
    h+=admCardH('🔇 '+tt('Stummgeschaltet','Muted players')+' <small class="muted">('+Mu.length+')</small>','<form class="admform" id="admMuteF" novalidate><label class="small">'+tt('Benutzername','Username')+'<input class="namein" name="user" maxlength="16" autocapitalize="off" spellcheck="false"></label><label class="small">'+tt('Stunden','Hours')+'<input class="namein" name="hours" type="number" min="1" max="8760" value="24"></label><input class="namein" name="reason" maxlength="120" placeholder="'+tt('Grund (optional)','Reason (optional)')+'"><button type="submit" class="btn primary">'+tt('Stummschalten','Mute')+'</button></form><p class="small" style="margin-top:6px">'+tt('Stumme Spieler können nicht im Club-Chat schreiben und nichts verschenken. Sie spielen sonst normal weiter.','Muted players can’t write in club chat or send gifts. Otherwise they play normally.')+'</p>'
      +(Mu.length?'<div class="admlbl">'+Mu.map(m=>'<div class="admlbr"><span class="rk">🔇</span><span class="who"><b>'+escName(m.username)+'</b><small>'+tt('bis ','until ')+admDT(m.until)+(m.reason?' · '+escName(m.reason):'')+'</small></span><span class="btns"><button type="button" class="btn sm" data-mda="unmute:'+escName(m.username)+'">'+tt('Stumm aus','Unmute')+'</button></span></div>').join('')+'</div>':''));
    if(v52Ready) h+=admBanHtml();
    if(v53Ready) h+=admTeamHtml();
    /* Wörter */
    const W=admWords||[];
    h+=admCardH('🚫 '+tt('Gesperrte Wörter','Blocked words')+' <small class="muted">('+W.length+')</small>','<p class="small">'+tt('Gilt für Benutzernamen, Clubnamen, Club-Chat, Geschenk-Notizen und Namen in der Bestenliste. Auch Tricks wie 0 statt o oder @ statt a werden erkannt.','Applies to usernames, club names, club chat, gift notes and leaderboard names. Tricks like 0 for o or @ for a are caught too.')+'</p><form class="coderow" id="admWordF" novalidate><input class="namein" name="word" maxlength="30" autocomplete="off" placeholder="'+tt('Neues Wort','New word')+'"><button type="submit" class="btn primary">'+tt('Hinzufügen','Add')+'</button></form>'
      +'<details class="fold"><summary>'+tt('Liste zeigen','Show the list')+'</summary><div class="wordchips">'+W.map(w=>'<span class="wchip">'+escName(w)+'<button type="button" aria-label="'+tt('Entfernen','Remove')+'" data-mda="wdel:'+escName(w)+'">×</button></span>').join('')+'</div></details>');
  }
  if(box._h!==h){
    const keep={},open=[...box.querySelectorAll('details')].map(d=>d.open);
    box.querySelectorAll('input,textarea,select').forEach(i=>{if(i.name&&i.closest('form')) keep[i.closest('form').getAttribute('id')+'|'+i.name]=i.value;});
    box._h=h;box.innerHTML=h;
    box.querySelectorAll('input,textarea,select').forEach(i=>{const k=i.closest('form')&&i.closest('form').getAttribute('id')+'|'+i.name;if(k&&keep[k]!=null&&!(i.closest('#admMailF')&&(i.name==='to'||i.name==='kind'))) i.value=keep[k];});
    box.querySelectorAll('details').forEach((d,i)=>{if(open[i]) d.open=true;});
  }
}
els.admin.addEventListener('submit',e=>{
  const f=e.target,id=f.getAttribute('id');if(!['admFindF','admMailF','admMuteF','admWordF'].includes(id)) return;
  e.preventDefault();const d=Object.fromEntries(new FormData(f).entries());
  if(id==='admFindF'){admFindQ=String(d.q||'').trim();if(!admFindQ) return;admMod('search',{q:admFindQ}).then(r=>{admFind=r;admModErr='';admModRender();}).catch(x=>{admModErr=admErrTxt(x);admModRender();});return;}
  if(id==='admMailF'){
    if(!String(d.title||'').trim()){admModErr=tt('Bitte gib einen Titel ein.','Please enter a title.');admModRender();return;}
    const club=d.kind==='club'?admMailTo.club:'';
    if(!club&&!/^[A-Za-z0-9_]{3,16}$/.test(String(d.to||'').trim())){admModErr=tt('Gib den Benutzernamen des Kontos ein.','Enter the account username.');admModRender();return;}
    admModDo('mail',{to:String(d.to||'').trim(),club,title:d.title.trim(),body:String(d.body||'').trim(),gems:d.gems,stars:d.stars,minutes:d.minutes},null,r=>{toast(tt('Gesendet an ','Sent to ')+(r&&r.sent||0)+tt(' Spieler.',' player(s).'));const nf=$id('admMailF');if(nf) nf.reset();admMailTo={kind:'player',to:'',club:'',name:''};});
    return;
  }
  if(id==='admMuteF'){admModDo('mute',{user:String(d.user||'').trim(),hours:d.hours,reason:String(d.reason||'').trim()},tt('Stummgeschaltet.','Muted.'),r=>{admMutes=r||[];const nf=$id('admMuteF');if(nf) nf.reset();});return;}
  if(id==='admWordF'){admModDo('word_add',{word:d.word},tt('Wort gesperrt.','Word blocked.'),r=>{admWords=r||[];const nf=$id('admWordF');if(nf) nf.reset();});}
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-mda]');if(!b) return;
  const parts=b.dataset.mda.split(':'),a=parts[0];
  if(a==='reload'){admModLoad();if(v52Ready) admBanCall('list');if(v53Ready) admTeamLoad();return;}
  if(a==='repdel'||a==='repok'){admModDo('report_done',{id:parts[1],delete:a==='repdel'},a==='repdel'?tt('Nachricht gelöscht.','Message deleted.'):tt('Erledigt.','Done.'),r=>{admReports=r||[];});return;}
  if(a==='mute24'){admModDo('mute',{user:parts[1],hours:24,reason:tt('Meldung','Report')},tt('24 Stunden stummgeschaltet.','Muted for 24 hours.'),r=>{admMutes=r||[];if(admFindQ) admMod('search',{q:admFindQ}).then(x=>{admFind=x;admModRender();}).catch(()=>{});});return;}
  if(a==='unmute'){admModDo('unmute',{user:parts[1]},tt('Stummschaltung aufgehoben.','Unmuted.'),r=>{admMutes=r||[];if(admFindQ) admMod('search',{q:admFindQ}).then(x=>{admFind=x;admModRender();}).catch(()=>{});});return;}
  if(a==='wdel'){admModDo('word_del',{word:parts[1]},null,r=>{admWords=r||[];});return;}
  if(a==='mailto'){admMailTo={kind:'player',to:parts[1],club:'',name:''};admModRender();const f=$id('admMailF');if(f){f.scrollIntoView({block:'center',behavior:'smooth'});f.querySelector('[name=title]').focus();}return;}
  if(a==='mailclub'){admMailTo={kind:'club',to:'',club:parts[1],name:parts.slice(2).join(':')};admModRender();const f=$id('admMailF');if(f){f.scrollIntoView({block:'center',behavior:'smooth'});f.querySelector('[name=title]').focus();}return;}
  if(a==='ren'){
    const kind=parts[1],id=parts[2],old=parts.slice(3).join(':');
    const nm=window.prompt(tt('Neuer Name für ','New name for ')+old+':',old);if(!nm||nm.trim()===old) return;
    admModDo('rename',{kind,id,name:nm.trim()},tt('Umbenannt.','Renamed.'),()=>{admMod('search',{q:admFindQ}).then(x=>{admFind=x;admModRender();}).catch(()=>{});if(kind==='score'){lbLast=0;}});
    if(kind==='account') toast(tt('Sag dem Spieler seinen neuen Benutzernamen fürs Anmelden.','Tell the player their new username for signing in.'));
    return;
  }
  if(a==='ban'){
    if(!admModArmed(b.dataset.mda)){admModArm={k:b.dataset.mda,t:Date.now()};admModRender();return;}
    admModArm={k:'',t:0};lbApi('rpc/admin_lb',{p_pass:admPass,p_action:'ban',p_id:parts[1]}).then(()=>{toast(tt('Spieler gesperrt.','Player banned.'));return admMod('search',{q:admFindQ});}).then(x=>{admFind=x;admModRender();}).catch(x=>{admModErr=admErrTxt(x);admModRender();});
  }
});

/* ---------- Admin: Server (Statistik, Schalter, Wartung, Update, Saisons, Protokoll) ---------- */
var admStats=null,admCfg=null,admSeasons=null,admLog=null,admSrvErr='',admSrvArm={k:'',t:0};
async function admSrvLoad(){
  if(!admPass) return;
  try{const [s,c,se,l]=await Promise.all([admMod('stats'),admMod('settings'),admMod('seasons'),admMod('log')]);admStats=s;admCfg=c||{};admSeasons=se||[];admLog=l||[];admSrvErr='';}
  catch(x){admSrvErr=admErrTxt(x);}
  if(v46Ready) admBkCall('list');
  if(v51Ready) admInsLoad();
  if(v53Ready) admWeekLoad();
  admSrvRender();
}
function admBars(rows){
  if(!rows||!rows.length) return '';
  const mx=Math.max(1,...rows.map(r=>+r.n||0));
  return '<div class="admbars" role="img" aria-label="'+rows.map(r=>r.day+': '+r.n).join(', ')+'">'+rows.map(r=>'<span title="'+new Date(r.day+'T00:00:00').toLocaleDateString(LOC[LANG],{day:'2-digit',month:'2-digit'})+': '+r.n+'"><i style="height:'+Math.max(4,Math.round((+r.n||0)/mx*100))+'%"></i><small>'+(+r.n||'')+'</small></span>').join('')+'</div>';
}
function admSrvRender(){
  const box=$id('admSrv');if(!box) return;
  let h='';
  if(!lbOn()) h=admCardH(tt('Server','Server'),'<p class="small">'+tt('Online-Funktionen sind nicht eingerichtet.','Online features aren’t set up.')+'</p>');
  else if(!admPass) h=admCardH('🔐 '+tt('Server-Werkzeuge','Server tools'),admSrvForm('admSrvPwF'))+(admModErr?'<p class="nameerr">'+admModErr+'</p>':'');
  else{
    if(admSrvErr) h+='<p class="nameerr">'+admSrvErr+'</p>';
    const St=admStats||{},L=St.live||{},C=admCfg||{},F=Object.assign({chat:true,gifts:true,clubs:true,lb:true},C.feat||{}),Mt=Object.assign({on:false,de:'',en:''},C.maint||{}),mv=+C.min_ver||0;
    const tile=(l,v)=>'<span><small>'+l+'</small><b>'+(v==null?'–':typeof v==='number'?fmt(v):escName(String(v)))+'</b></span>';
    if(v53Ready) h+=admWeekHtml();
    h+=admCardH('📊 '+tt('Statistik','Statistics'),'<div class="admstats">'+tile(tt('Jetzt online','Online now'),L.online)+tile(tt('Heute','Today'),L.today)+tile(tt('Spieler','Players'),L.players)+tile(tt('Konten','Accounts'),St.accounts)+tile(tt('Aktiv (7 Tage)','Active (7 days)'),St.active7)+tile(tt('Clubs','Clubs'),St.clubs)+tile(tt('Chat (24 Std)','Chat (24 h)'),St.msgs24)+tile(tt('Offene Meldungen','Open reports'),St.reports_open)+tile(tt('In der Bestenliste','On the leaderboard'),St.lb_entries)+tile(tt('Stumm','Muted'),St.mutes)+'</div>'
      +'<h5 class="admh5">'+tt('Neue Konten pro Tag (14 Tage)','New accounts per day (14 days)')+'</h5>'+admBars(St.new14)
      +'<h5 class="admh5">'+tt('Geschenke pro Tag (14 Tage)','Gifts per day (14 days)')+'</h5>'+admBars(St.gifts14)
      +'<div class="admtwo"><div><h5 class="admh5">'+tt('Top-Clubs diese Woche','Top clubs this week')+'</h5>'+((St.top_clubs||[]).length?'<ol class="admol">'+St.top_clubs.map(c=>'<li>'+escName(c.emoji)+' '+escName(c.name)+' <small>+'+fmt(+c.gain||0)+'</small></li>').join('')+'</ol>':'<p class="small">–</p>')+'</div>'
      +'<div><h5 class="admh5">'+tt('Meistgenutzte Codes','Most used codes')+'</h5>'+((St.top_codes||[]).length?'<ol class="admol">'+St.top_codes.map(c=>'<li>'+escName(c.code)+(c.label?' · '+escName(c.label):'')+' <small>'+c.uses+'×</small></li>').join('')+'</ol>':'<p class="small">–</p>')+'</div></div>'
      +'<p class="small">'+(St.ip_seen===false?tt('Hinweis: Die Limits pro Gerät sind gerade nicht aktiv, weil der Server keine Geräte-Adresse sieht. Die allgemeinen Limits gelten weiter.','Note: per-device limits are off right now because the server can’t see device addresses. The general limits still apply.'):St.ip_seen?tt('Limits pro Gerät sind aktiv.','Per-device limits are active.'):'')+'</p>'
      +'<div class="btns"><button type="button" class="btn sm primary" data-sva="reload">'+tt('Aktualisieren','Refresh')+'</button></div>');
    const sw=(k,ic,l)=>'<label class="admsw"><input type="checkbox" data-feat="'+k+'"'+(F[k]!==false?' checked':'')+'><span class="tog" aria-hidden="true"></span><span>'+ic+' '+l+'</span></label>';
    h+=admCardH('🎚️ '+tt('Funktionen an/aus','Feature switches'),'<p class="small">'+tt('Wirkt bei allen Spielern innerhalb einer Minute, ganz ohne Update.','Takes effect for every player within a minute, no update needed.')+'</p><div class="admsws">'+sw('chat','💬',tt('Club-Chat','Club chat'))+sw('gifts','🎁',tt('Geschenke','Gifts'))+sw('clubs','👥',tt('Clubs','Clubs'))+sw('lb','🏆',tt('Bestenliste','Leaderboard'))+'</div>');
    h+=admCardH('🛠️ '+tt('Wartungsmodus','Maintenance mode'),'<p class="small">'+tt('Zeigt allen Spielern „Wir aktualisieren gerade“ und pausiert das Spiel. Du selbst kannst weiterspielen, solange das Admin-Panel entsperrt ist.','Shows every player “We’re updating, back soon” and pauses the game. You can keep playing while the admin panel is unlocked.')+'</p><form class="admform" id="admMaintF" novalidate><input class="namein" name="de" maxlength="200" value="'+escName(Mt.de||'')+'" placeholder="Nachricht (Deutsch)" style="grid-column:1/-1"><input class="namein" name="en" maxlength="200" value="'+escName(Mt.en||'')+'" placeholder="Message (English)" style="grid-column:1/-1"><button type="submit" class="btn '+(Mt.on?'':'primary')+'" name="go" value="'+(Mt.on?'off':'on')+'">'+(Mt.on?tt('Wartung beenden','End maintenance'):tt('Wartung starten','Start maintenance'))+'</button></form>'+(Mt.on?'<p class="nameerr">'+tt('Wartung läuft gerade.','Maintenance is on right now.')+'</p>':''));
    h+=admCardH('⬆️ '+tt('Update erzwingen','Force update'),'<p class="small">'+tt('Spieler mit einer älteren Version müssen zuerst neu laden. Aktuelle Version: ','Players on an older version must reload first. Current version: ')+NEWS_VER+'. '+(mv?tt('Gerade nötig: Version ','Required right now: version ')+mv:tt('Gerade aus.','Off right now.'))+'</p><div class="btns"><button type="button" class="btn sm primary" data-sva="minver:'+NEWS_VER+'">'+tt('Version ','Require version ')+NEWS_VER+tt(' verlangen','')+'</button>'+(mv?'<button type="button" class="btn sm" data-sva="minver:0">'+tt('Ausschalten','Turn off')+'</button>':'')+'</div>');
    const Se=admSeasons||[],armS=admSrvArm.k==='season'&&Date.now()-admSrvArm.t<5000;
    h+=admCardH('🏛️ '+tt('Saisons','Seasons'),'<p class="small">'+tt('Speichert die Top 10 der Bestenliste als beendete Saison (alle sehen sie in der Bestenliste) und startet sie danach neu.','Saves the leaderboard’s top 10 as a finished season (everyone sees it in the leaderboard), then starts it fresh.')+'</p><form class="coderow" id="admSeasonF" novalidate><input class="namein" name="name" maxlength="40" placeholder="'+tt('Name, z. B. Saison ','Name, e.g. Season ')+(Se.length+1)+'"><button type="submit" class="btn warn'+(armS?' armed':'')+'">'+(armS?tt('Wirklich? Nochmal','Really? Again'):tt('Saison beenden','End season'))+'</button></form>'
      +(Se.length?'<div class="admlbl">'+Se.map(s=>'<div class="admlbr"><span class="rk">🏛️</span><span class="who"><b>'+escName(s.name)+'</b><small>'+(s.top||[]).slice(0,3).map((t,i)=>['🥇','🥈','🥉'][i]+' '+escName(t.name)+' '+fmt(+t.score||0)).join(' · ')+'</small><small>'+admDT(s.archived_at)+'</small></span></div>').join('')+'</div>':''));
    if(v51Ready) h+=admInsHtml();
    h+=admCardH('💾 '+tt('Backups','Backups'),admBkHtml());
    const Lg=admLog||[];
    h+=admCardH('📜 '+tt('Admin-Protokoll','Admin log'),'<p class="small">'+tt('Jede Admin-Aktion auf dem Server, die neuesten zuerst.','Every admin action on the server, newest first.')+'</p>'+(Lg.length?'<div class="admlog">'+Lg.map(l=>'<div><small>'+admDT(l.at)+'</small><b>'+escName(l.action)+'</b>'+(l.detail?'<span>'+escName(l.detail)+'</span>':'')+'</div>').join('')+'</div>':'<p class="small">–</p>'));
    if(v53Ready) h+=adm2faHtml();
    h+=admCardH('🔐 '+tt('Server-Sitzung','Server session'),'<p class="small">'+tt('Du bist für 12 Stunden angemeldet.','You’re signed in for 12 hours.')+'</p><div class="btns"><button type="button" class="btn sm" data-sva="logout">'+tt('Server-Werkzeuge sperren','Lock server tools')+'</button></div>');
  }
  if(box._h!==h){const open=[...box.querySelectorAll('details')].map(d=>d.open);box._h=h;box.innerHTML=h;box.querySelectorAll('details').forEach((d,i)=>{if(open[i]) d.open=true;});}
}
async function admCfgSet(k,v,okTxt){
  try{admCfg=await admMod('set',{k,v});admSrvErr='';if(okTxt) toast(okTxt);cfgApply(admCfg);}
  catch(x){admSrvErr=admErrTxt(x);}
  admSrvArm={k:'',t:0};admSrvRender();
}
els.admin.addEventListener('change',e=>{
  const c=e.target.closest('[data-feat]');if(!c) return;
  const F=Object.assign({chat:true,gifts:true,clubs:true,lb:true},(admCfg||{}).feat||{});F[c.dataset.feat]=c.checked;
  admCfgSet('feat',F,c.checked?tt('Eingeschaltet.','Turned on.'):tt('Ausgeschaltet.','Turned off.'));
});
els.admin.addEventListener('submit',e=>{
  const f=e.target,id=f.getAttribute('id');if(!['admMaintF','admSeasonF'].includes(id)) return;
  e.preventDefault();const d=Object.fromEntries(new FormData(f).entries());
  if(id==='admMaintF'){const on=(e.submitter&&e.submitter.value||f.querySelector('[name=go]').value)==='on';admCfgSet('maint',{on,de:String(d.de||'').trim(),en:String(d.en||'').trim()},on?tt('Wartung gestartet.','Maintenance started.'):tt('Wartung beendet.','Maintenance ended.'));return;}
  if(id==='admSeasonF'){
    if(!(admSrvArm.k==='season'&&Date.now()-admSrvArm.t<5000)){admSrvArm={k:'season',t:Date.now()};admSrvRender();return;}
    admSrvArm={k:'',t:0};admMod('season_end',{name:String(d.name||'').trim()}).then(r=>{admSeasons=r||[];toast(tt('Saison beendet. Die Bestenliste startet neu.','Season ended. The leaderboard starts fresh.'));lbLast=0;lbSeasons=null;lbSeasonsAt=0;lbRefresh();admSrvLoad();}).catch(x=>{admSrvErr=admErrTxt(x);admSrvRender();});
  }
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-sva]');if(!b) return;
  const [a,v]=b.dataset.sva.split(':');
  if(a==='codeback'){admNeedCode=false;admPwHold='';admSrvRerender();return;}
  if(a==='reload'){admSrvLoad();return;}
  if(a==='minver'){admCfgSet('min_ver',+v||0,+v?tt('Update wird jetzt verlangt.','Update is now required.'):tt('Ausgeschaltet.','Turned off.'));return;}
  if(a==='logout'){const t=admPass;admSrvDrop();lbApi('rpc/admin_logout',{p_pass:t}).catch(()=>{});admModRender();admSrvRender();admLbRender();admOnRender();admAccRender();admClubRender();toast(tt('Server-Werkzeuge gesperrt.','Server tools locked.'));}
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('#admSeg [data-ap]');if(!b) return;
  if(b.dataset.ap==='mod') setTimeout(()=>{admModRender();if(admPass&&!admReports) admModLoad();},0);
  if(b.dataset.ap==='srv') setTimeout(()=>{admSrvRender();if(admPass) admSrvLoad();},0);
});
admModRender();admSrvRender();
/* Wartung: das Admin-Panel öffnen */
$id('maintOv').addEventListener('click',e=>{if(e.target.closest('#maintAdm')){$id('maintOv').hidden=true;closeStart(()=>{openSettings();showSetPane('admin');});setTimeout(()=>{const t=setInterval(()=>{if(admOK||els.setOv.hidden){clearInterval(t);maintRender();}},1000);},500);}});
