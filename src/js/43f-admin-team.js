/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V53: Moderatoren, Einsprüche, Zwei-Schritt-Anmeldung, Wochenbericht ======================= */
var v53Ready=false;
const MOD_TOK='keksfabrik-modtok';
var modTok=null;
try{const o=JSON.parse(sessionStorage.getItem(MOD_TOK)||'null');if(o&&o.t&&o.e>Date.now()+60000) modTok=o;}catch(x){}
let modData={reports:null,mutes:null,find:null,q:''},modErr='',modBusy=false;
const modCall=(action,data)=>lbApi('rpc/mod_tools',{p_pass:modTok.t,p_action:action,p_data:data||null});

/* ---------- Moderator: Anmeldung auf dem Sperrbildschirm ---------- */
function modLockHtml(){
  if(!lbOn()) return '';
  return '<details class="fold modlock"><summary>👮 '+tt('Moderator? Hier anmelden','Moderator? Sign in here')+'</summary><form class="admform" id="modLoginF" novalidate>'
    +'<label class="small">'+tt('Name','Name')+'<input class="namein" name="mname" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false"></label>'
    +'<label class="small">'+tt('Passwort','Password')+'<input class="namein" name="mpass" type="password" maxlength="72" autocomplete="current-password"></label>'
    +'<button type="submit" class="btn primary">'+tt('Anmelden','Sign in')+'</button></form><p class="nameerr" id="modLoginErr" aria-live="polite"></p>'
    +'<p class="small">'+tt('Moderatoren sehen nur Meldungen, Stummschaltungen und die Spielersuche.','Moderators only see reports, mutes and player search.')+'</p></details>';
}
async function modLogin(user,pass){
  const err=$id('modLoginErr');if(err) err.textContent='';
  let r=null;
  try{r=await lbApi('rpc/mod_login',{p_user:user,p_pass:pass});}
  catch(x){if(err) err.textContent=lbMissing(x)?tt('Dafür braucht der Server zuerst docs/staff-v12.sql.','This needs docs/staff-v12.sql on the server first.'):tt('Keine Verbindung.','No connection.');return;}
  if(!r||r.error){if(err) err.textContent=r&&r.error==='locked'?tt('Zu viele falsche Versuche. Warte 15 Minuten.','Too many wrong tries. Wait 15 minutes.'):tt('Name oder Passwort stimmt nicht.','Wrong name or password.');return;}
  modTok={t:r.token,e:Date.parse(r.expires_at)||Date.now()+11*3600e3,name:r.name};
  try{sessionStorage.setItem(MOD_TOK,JSON.stringify(modTok));}catch(x){}
  toast(tt('Als Moderator angemeldet.','Signed in as moderator.'));buildAdmin();
}
function modOut(){
  const t=modTok&&modTok.t;modTok=null;modData={reports:null,mutes:null,find:null,q:''};
  try{sessionStorage.removeItem(MOD_TOK);}catch(x){}
  if(t) lbApi('rpc/admin_logout',{p_pass:t}).catch(()=>{});
  buildAdmin();
}

/* ---------- Moderator: eigenes, kleines Panel ---------- */
function modPanel(){
  els.admin.innerHTML='<div class="admlockbar modbar"><span>👮 '+tt('Moderator: ','Moderator: ')+'<b>'+escName(modTok.name||'')+'</b></span><button type="button" class="btn sm" id="modOutBtn">'+tt('Abmelden','Sign out')+'</button></div><div id="modBox" class="admlb"></div>';
  modRender();modLoad();
}
async function modLoad(){
  if(!modTok||modBusy) return;
  modBusy=true;
  try{const [r,m]=await Promise.all([modCall('reports'),modCall('mutes')]);modData.reports=r||[];modData.mutes=m||[];modErr='';}
  catch(x){if(/wrong admin password/.test(String(x.message))){modBusy=false;toast(tt('Deine Moderator-Sitzung ist abgelaufen.','Your moderator session has ended.'));modOut();return;}modErr=admErrTxt(x);}
  modBusy=false;modRender();
}
async function modDo(action,data,okTxt,after){
  modErr='';
  try{const r=await modCall(action,data);if(okTxt) toast(okTxt);if(after) after(r);}
  catch(x){modErr=/player not found/.test(String(x.message))?tt('Diesen Benutzernamen gibt es nicht.','No account with that username.'):admErrTxt(x);}
  modRender();
}
function modRender(){
  const box=$id('modBox');if(!box) return;
  const R=modData.reports||[],open=R.filter(r=>r.status==='open'),M=modData.mutes||[],F=modData.find;
  let h=modErr?'<p class="nameerr">'+modErr+'</p>':'';
  h+=admCardH('🚩 '+tt('Meldungen','Reports')+' <small class="muted">('+(modData.reports?open.length+' '+tt('offen','open'):'…')+')</small>',
    (modData.reports?(open.length?'<div class="admlbl">'+open.map(r=>'<div class="admlbr"><span class="rk">🚩</span><span class="who"><b>'+escName(r.reported)+' · '+escName(r.club)+'</b><small>„'+escName(r.body)+'“</small><small>'+tt('Gemeldet von ','Reported by ')+escName(r.reporter)+' · '+admDT(r.created_at)+'</small></span><span class="btns">'+(r.msg_exists?'<button type="button" class="btn sm warn" data-moda="del:'+r.id+'">'+tt('Löschen','Delete')+'</button>':'')+'<button type="button" class="btn sm" data-moda="ok:'+r.id+'">'+tt('Erledigt','Done')+'</button><button type="button" class="btn sm" data-moda="mute:'+escName(r.reported)+'">'+tt('24 Std stumm','Mute 24 h')+'</button></span></div>').join('')+'</div>':'<p class="small">'+tt('Keine offenen Meldungen. 🎉','No open reports. 🎉')+'</p>'):'<p class="small">'+tt('Lädt …','Loading …')+'</p>')
    +'<div class="btns" style="margin-top:8px"><button type="button" class="btn sm" data-moda="reload">'+tt('Aktualisieren','Refresh')+'</button></div>');
  let f='<form class="coderow" id="modFindF" novalidate><input class="namein" name="q" maxlength="24" autocomplete="off" value="'+escName(modData.q)+'" placeholder="'+tt('Benutzername','Username')+'"><button type="submit" class="btn primary">'+tt('Suchen','Search')+'</button></form>';
  if(F) f+=F.length?'<div class="admlbl">'+F.map(a=>'<div class="admlbr"><span class="rk">'+(a.banned?'⛔':a.muted?'🔇':'👤')+'</span><span class="who"><b>'+escName(a.username)+'</b><small>'+(a.club?'👥 '+escName(a.club)+' · ':'')+'🚩 '+a.reports+' · '+tt('Zuletzt: ','Last seen: ')+admDT(a.last_seen)+(a.muted?' · '+tt('stumm bis ','muted until ')+admDT(a.muted):'')+'</small></span><span class="btns">'+(a.muted?'<button type="button" class="btn sm" data-moda="unmute:'+escName(a.username)+'">'+tt('Stumm aus','Unmute')+'</button>':'<button type="button" class="btn sm" data-moda="mute:'+escName(a.username)+'">'+tt('24 Std stumm','Mute 24 h')+'</button>')+'</span></div>').join('')+'</div>':'<p class="small">'+tt('Nichts gefunden.','Nothing found.')+'</p>';
  h+=admCardH('🔎 '+tt('Spieler suchen','Find a player'),f);
  h+=admCardH('🔇 '+tt('Stummschalten','Mute')+' <small class="muted">('+M.length+')</small>','<form class="admform" id="modMuteF" novalidate><label class="small">'+tt('Benutzername','Username')+'<input class="namein" name="user" maxlength="16" autocapitalize="off" spellcheck="false"></label><label class="small">'+tt('Stunden (höchstens 168)','Hours (at most 168)')+'<input class="namein" name="hours" type="number" min="1" max="168" value="24"></label><input class="namein" name="reason" maxlength="120" placeholder="'+tt('Grund (optional)','Reason (optional)')+'" style="grid-column:1/-1"><button type="submit" class="btn primary">'+tt('Stummschalten','Mute')+'</button></form>'
    +(M.length?'<div class="admlbl" style="margin-top:8px">'+M.map(m=>'<div class="admlbr"><span class="rk">🔇</span><span class="who"><b>'+escName(m.username)+'</b><small>'+tt('bis ','until ')+admDT(m.until)+(m.reason?' · '+escName(m.reason):'')+'</small></span><span class="btns"><button type="button" class="btn sm" data-moda="unmute:'+escName(m.username)+'">'+tt('Stumm aus','Unmute')+'</button></span></div>').join('')+'</div>':'')
    +'<p class="small" style="margin-top:6px">'+tt('Stumme Spieler können nicht im Club-Chat schreiben und keine Geschenke senden. Alles, was du tust, steht mit deinem Namen im Admin-Protokoll.','Muted players can’t write in club chat or send gifts. Everything you do is in the admin log with your name.')+'</p>');
  if(box._h!==h){box._h=h;box.innerHTML=h;}
}
els.admin.addEventListener('submit',e=>{
  const f=e.target,id=f.getAttribute('id');if(!['modLoginF','modFindF','modMuteF'].includes(id)) return;
  e.preventDefault();const d=Object.fromEntries(new FormData(f).entries());
  if(id==='modLoginF'){const u=String(d.mname||'').trim(),p=String(d.mpass||'');if(u&&p) modLogin(u,p);return;}
  if(id==='modFindF'){modData.q=String(d.q||'').trim();if(modData.q.length<2) return;modDo('search',{q:modData.q},null,r=>{modData.find=r||[];});return;}
  if(id==='modMuteF'){const u=String(d.user||'').trim();if(!/^[A-Za-z0-9_]{3,16}$/.test(u)){modErr=tt('Gib den Benutzernamen des Kontos ein.','Enter the account username.');modRender();return;}
    modDo('mute',{user:u,hours:Math.min(168,Math.max(1,+d.hours||24)),reason:String(d.reason||'').trim()},tt('Stummgeschaltet.','Muted.'),r=>{modData.mutes=r||[];const nf=$id('modMuteF');if(nf) nf.reset();});}
});
els.admin.addEventListener('click',e=>{
  if(e.target.closest('#modOutBtn')){modOut();return;}
  const b=e.target.closest('[data-moda]');if(!b) return;
  const [a,v]=b.dataset.moda.split(':');
  const refind=()=>{if(modData.q) modCall('search',{q:modData.q}).then(x=>{modData.find=x||[];modRender();}).catch(()=>{});};
  if(a==='reload'){modLoad();return;}
  if(a==='del'||a==='ok'){modDo('report_done',{id:v,delete:a==='del'},a==='del'?tt('Nachricht gelöscht.','Message deleted.'):tt('Erledigt.','Done.'),r=>{modData.reports=r||[];});return;}
  if(a==='mute'){modDo('mute',{user:v,hours:24,reason:tt('Meldung','Report')},tt('24 Stunden stummgeschaltet.','Muted for 24 hours.'),r=>{modData.mutes=r||[];refind();});return;}
  if(a==='unmute'){modDo('unmute',{user:v},tt('Stummschaltung aufgehoben.','Unmuted.'),r=>{modData.mutes=r||[];refind();});}
});
setInterval(()=>{if(modTok&&!admOK&&!els.setOv.hidden&&setSub==='admin'&&!document.hidden) modLoad();},60000);

/* ---------- Besitzer: Moderatoren und Einsprüche (Moderation-Tab) ---------- */
var admMods=null,admAppeals=null,admTeamErr='',admTeamArm={k:'',t:0};
async function admTeamLoad(){
  if(!admPass) return;
  try{const [m,a]=await Promise.all([lbApi('rpc/admin_mods',{p_pass:admPass,p_action:'list'}),lbApi('rpc/admin_appeals',{p_pass:admPass,p_action:'list'})]);admMods=m||[];admAppeals=a||[];admTeamErr='';}
  catch(x){admTeamErr=lbMissing(x)?tt('Moderatoren und Einsprüche brauchen zuerst docs/staff-v12.sql.','Moderators and appeals need docs/staff-v12.sql first.'):admErrTxt(x);}
  admModRender();
}
async function admTeamDo(fn,action,data,okTxt){
  admTeamErr='';
  try{const r=await lbApi('rpc/'+fn,{p_pass:admPass,p_action:action,p_data:data||null});if(fn==='admin_mods') admMods=r||[];else admAppeals=r||[];if(okTxt) toast(okTxt);}
  catch(x){const m=String(x.message||'');admTeamErr=/invalid password/.test(m)?tt('Das Passwort braucht 8–72 Zeichen.','The password needs 8–72 characters.'):/invalid name/.test(m)?tt('Name: 3–16 Buchstaben, Zahlen oder _.','Name: 3–16 letters, numbers or _.'):/name taken/.test(m)?tt('Diesen Namen gibt es schon.','That name is already taken.'):admErrTxt(x);}
  admTeamArm={k:'',t:0};admModRender();
}
function admTeamHtml(){
  const M=admMods||[],A=admAppeals||[],openA=A.filter(a=>a.status==='open'),arm=k=>admTeamArm.k===k&&Date.now()-admTeamArm.t<5000;
  let h=admCardH('📨 '+tt('Einsprüche gegen Sperren','Ban appeals')+' <small class="muted">('+(admAppeals?openA.length+' '+tt('offen','open'):'…')+')</small>',
    '<p class="small">'+tt('Gesperrte Spieler können einmal am Tag um eine Prüfung bitten. Annehmen hebt die Sperre auf. Deine Antwort sehen sie beim nächsten Anmeldeversuch.','Banned players can ask for a review once a day. Accepting lifts the ban. They see your answer the next time they try to sign in.')+'</p>'
    +(openA.length?'<div class="admlbl">'+openA.map(a=>'<div class="admlbr appeal"><span class="rk">📨</span><span class="who"><b>'+escName(a.username)+'</b><small>„'+escName(a.body)+'“</small><small>'+admDT(a.created_at)+(a.ban?' · ⛔ '+(a.ban.reason?escName(a.ban.reason):tt('ohne Grund','no reason'))+' · '+(a.ban.until?tt('bis ','until ')+admDT(a.ban.until):tt('für immer','forever')):'')+'</small><input class="namein" data-apans="'+a.id+'" maxlength="300" placeholder="'+tt('Antwort an den Spieler (optional)','Answer to the player (optional)')+'"></span><span class="btns"><button type="button" class="btn sm primary" data-apa="yes:'+a.id+'">'+tt('Annehmen','Accept')+'</button><button type="button" class="btn sm warn" data-apa="no:'+a.id+'">'+tt('Ablehnen','Reject')+'</button></span></div>').join('')+'</div>':'<p class="small">'+(admAppeals?tt('Keine offenen Einsprüche.','No open appeals.'):tt('Lädt …','Loading …'))+'</p>')
    +(A.length>openA.length?'<details class="fold"><summary>'+tt('Beantwortet','Answered')+' ('+(A.length-openA.length)+')</summary><div class="admlbl">'+A.filter(a=>a.status!=='open').map(a=>'<div class="admlbr done"><span class="rk">'+(a.status==='accepted'?'✅':'❌')+'</span><span class="who"><b>'+escName(a.username)+'</b><small>„'+escName(a.body)+'“</small>'+(a.answer?'<small>↳ '+escName(a.answer)+'</small>':'')+'<small>'+admDT(a.answered_at)+'</small></span></div>').join('')+'</div></details>':''));
  h+=admCardH('👮 '+tt('Moderatoren','Moderators')+' <small class="muted">('+M.length+')</small>',
    '<p class="small">'+tt('Moderatoren melden sich in admin.html unter „Moderator? Hier anmelden“ an. Sie sehen nur Meldungen, Stummschaltungen (höchstens 7 Tage) und die Spielersuche – keine Sperren, Geschenke, Einstellungen oder Spiel-Werkzeuge. Alles steht mit ihrem Namen im Admin-Protokoll.','Moderators sign in on admin.html under “Moderator? Sign in here”. They only see reports, mutes (at most 7 days) and player search – no bans, gifts, settings or game tools. Everything they do is in the admin log with their name.')+'</p>'
    +'<form class="admform" id="admModAddF" novalidate><label class="small">'+tt('Name','Name')+'<input class="namein" name="name" maxlength="16" autocapitalize="off" spellcheck="false"></label><label class="small">'+tt('Passwort (8+ Zeichen)','Password (8+ characters)')+'<input class="namein" name="pass" type="text" maxlength="72" autocomplete="new-password" spellcheck="false"></label><button type="submit" class="btn primary">'+tt('Moderator hinzufügen','Add moderator')+'</button></form>'
    +(M.length?'<div class="admlbl" style="margin-top:8px">'+M.map(m=>'<div class="admlbr"><span class="rk">👮</span><span class="who"><b>'+escName(m.name)+'</b><small>'+tt('Zuletzt angemeldet: ','Last sign-in: ')+admDT(m.last_login)+' · '+m.actions+' '+tt('Aktionen (30 Tage)','actions (30 days)')+'</small></span><span class="btns"><button type="button" class="btn sm" data-mma="pw:'+escName(m.name)+'">'+tt('Neues Passwort','New password')+'</button><button type="button" class="btn sm warn'+(arm('rm:'+m.name)?' armed':'')+'" data-mma="rm:'+escName(m.name)+'">'+(arm('rm:'+m.name)?tt('Sicher?','Sure?'):tt('Entfernen','Remove'))+'</button></span></div>').join('')+'</div>':'')
    +(admTeamErr?'<p class="nameerr">'+admTeamErr+'</p>':''));
  return h;
}
els.admin.addEventListener('submit',e=>{
  const f=e.target;if(f.getAttribute('id')!=='admModAddF') return;
  e.preventDefault();const d=Object.fromEntries(new FormData(f).entries());
  admTeamDo('admin_mods','add',{name:String(d.name||'').trim(),pass:String(d.pass||'')},tt('Moderator hinzugefügt. Gib ihm Name und Passwort persönlich.','Moderator added. Give them the name and password in person.')).then(()=>{if(!admTeamErr){const nf=$id('admModAddF');if(nf) nf.reset();}});
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-mma],[data-apa]');if(!b) return;
  if(b.dataset.apa){const [a,id]=b.dataset.apa.split(':');const ans=els.admin.querySelector('[data-apans="'+id+'"]');
    admTeamDo('admin_appeals','answer',{id:+id,accept:a==='yes',answer:ans?ans.value.trim():''},a==='yes'?tt('Einspruch angenommen, Sperre aufgehoben.','Appeal accepted, ban lifted.'):tt('Einspruch abgelehnt.','Appeal rejected.')).then(()=>{if(a==='yes'&&v52Ready) admBanCall('list');});return;}
  const [a,nm]=b.dataset.mma.split(':');
  if(a==='pw'){const p=window.prompt(tt('Neues Passwort für ','New password for ')+nm+tt(' (8+ Zeichen):',' (8+ characters):'));if(p) admTeamDo('admin_mods','password',{name:nm,pass:p},tt('Passwort geändert. Der Moderator wurde abgemeldet.','Password changed. The moderator was signed out.'));return;}
  if(a==='rm'){if(!(admTeamArm.k==='rm:'+nm&&Date.now()-admTeamArm.t<5000)){admTeamArm={k:'rm:'+nm,t:Date.now()};admModRender();return;}admTeamDo('admin_mods','remove',{name:nm},tt('Moderator entfernt.','Moderator removed.'));}
});

/* ---------- Besitzer: Wochenbericht und Zwei-Schritt-Anmeldung (Server-Tab) ---------- */
var admWeek=null,adm2fa=null,adm2faSetup=null,adm2faErr='';
async function admWeekLoad(){
  if(!admPass) return;
  try{const [w,f]=await Promise.all([lbApi('rpc/admin_summary',{p_pass:admPass}),lbApi('rpc/admin_2fa',{p_pass:admPass,p_action:'status'})]);admWeek=w;adm2fa=f;}
  catch(x){admWeek=null;adm2fa=null;if(lbMissing(x)) adm2faErr=tt('Wochenbericht und Zwei-Schritt-Anmeldung brauchen zuerst docs/staff-v12.sql.','The weekly summary and two-step sign-in need docs/staff-v12.sql first.');}
  admSrvRender();
}
const WEEK_KEYS=[['players','🍪','Spieler','Players'],['new_players','🌱','Neue Spieler','New players'],['returning','🔁','Kamen wieder','Came back'],['accounts','👤','Neue Konten','New accounts'],['clubs','👥','Neue Clubs','New clubs'],['chat','💬','Chat-Nachrichten','Chat messages'],['gifts','🎁','Geschenke','Gifts'],['reports','🚩','Meldungen','Reports'],['crashes','🐞','Fehlerarten','Crash types'],['bans','⛔','Sperren','Bans']];
function admWeekHtml(){
  if(!admWeek) return adm2faErr?admCardH('📅 '+tt('Diese Woche','This week'),'<p class="small">'+adm2faErr+'</p>'):'';
  const T=admWeek.this||{},L=admWeek.last||{},bad=['reports','crashes','bans'];
  return admCardH('📅 '+tt('Diese Woche (letzte 7 Tage)','This week (last 7 days)'),'<p class="small">'+tt('Im Vergleich zu den 7 Tagen davor.','Compared with the 7 days before.')+'</p><div class="admweek">'+WEEK_KEYS.map(([k,ic,de,en])=>{
    const a=+T[k]||0,b=+L[k]||0,d=a-b,up=d>0,cls=d===0?'':(up!==bad.includes(k)?'good':'bad');
    return '<span class="'+cls+'"><small>'+ic+' '+tt(de,en)+'</small><b>'+fmt(a)+'</b><i>'+(d===0?'±0':(up?'▲ +':'▼ ')+fmt(d))+(b?' ('+(up?'+':'')+Math.round(d/b*100)+'%)':'')+'</i></span>';
  }).join('')+'</div>');
}
function adm2faHtml(){
  if(!adm2fa) return '';
  let b='';
  if(adm2fa.on) b='<p class="small">✅ '+tt('An. Beim Anmelden mit dem Server-Passwort fragt der Server zusätzlich nach dem 6-stelligen Code aus deiner Authenticator-App.','On. Signing in with the server password also asks for the 6-digit code from your authenticator app.')+'</p><form class="coderow" id="adm2faOffF" novalidate><input class="namein" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="'+tt('Code zum Ausschalten','Code to turn it off')+'"><button type="submit" class="btn warn">'+tt('Ausschalten','Turn off')+'</button></form>';
  else if(adm2faSetup) b='<ol class="small adm2fa"><li>'+tt('Öffne eine Authenticator-App (z. B. Google Authenticator, Microsoft Authenticator, 2FAS).','Open an authenticator app (for example Google Authenticator, Microsoft Authenticator or 2FAS).')+'</li><li>'+tt('Füge ein Konto hinzu: „Schlüssel eingeben“ und diesen Schlüssel eintragen – oder auf dem Handy den Link antippen.','Add an account: choose “Enter a setup key” and type this key – or tap the link on your phone.')+'<div class="admkey"><code id="adm2faKey">'+adm2faSetup.secret.replace(/(.{4})/g,'$1 ').trim()+'</code><button type="button" class="btn sm" data-tfa="copy">'+tt('Kopieren','Copy')+'</button><a class="btn sm" href="'+escName(adm2faSetup.uri)+'">'+tt('In App öffnen','Open in app')+'</a></div></li><li>'+tt('Gib den Code ein, den die App jetzt zeigt:','Enter the code the app shows now:')+'<form class="coderow" id="adm2faOnF" novalidate><input class="namein" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123456"><button type="submit" class="btn primary">'+tt('Einschalten','Turn on')+'</button></form></li></ol><p class="small">'+tt('Wenn du das Handy verlierst, kannst du es in Supabase ausschalten (siehe docs/LEADERBOARD.md).','If you lose your phone, you can turn it off in Supabase (see docs/LEADERBOARD.md).')+'</p>';
  else b='<p class="small">'+tt('Aus. Schalte es ein, dann reicht ein gestohlenes Server-Passwort allein nicht mehr: Man braucht auch den Code von deinem Handy.','Off. Turn it on so a stolen server password alone isn’t enough: the code from your phone is needed too.')+'</p><div class="btns"><button type="button" class="btn primary" data-tfa="setup">'+tt('Einrichten','Set up')+'</button></div>';
  return admCardH('📱 '+tt('Zwei-Schritt-Anmeldung','Two-step sign-in'),b+(adm2faErr?'<p class="nameerr">'+adm2faErr+'</p>':''));
}
async function adm2faDo(action,data,okTxt){
  adm2faErr='';
  try{const r=await lbApi('rpc/admin_2fa',{p_pass:admPass,p_action:action,p_data:data||null});if(action==='setup') adm2faSetup=r;else{adm2fa=r;adm2faSetup=null;}if(okTxt) toast(okTxt,true);}
  catch(x){adm2faErr=/wrong code/.test(String(x.message))?tt('Falscher Code. Nimm den aktuellen Code aus der App.','Wrong code. Use the current code from the app.'):admErrTxt(x);}
  admSrvRender();
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-tfa]');if(!b) return;
  if(b.dataset.tfa==='setup') adm2faDo('setup');
  if(b.dataset.tfa==='copy'&&adm2faSetup){try{navigator.clipboard.writeText(adm2faSetup.secret);toast(tt('Schlüssel kopiert.','Key copied.'));}catch(x){}}
});
els.admin.addEventListener('submit',e=>{
  const f=e.target,id=f.getAttribute('id');if(id!=='adm2faOnF'&&id!=='adm2faOffF') return;
  e.preventDefault();const c=String(new FormData(f).get('code')||'').replace(/\s/g,'');if(!/^\d{6}$/.test(c)){adm2faErr=tt('Der Code hat 6 Ziffern.','The code has 6 digits.');admSrvRender();return;}
  if(id==='adm2faOnF') adm2faDo('confirm',{code:c},tt('Zwei-Schritt-Anmeldung ist an. Ab jetzt fragt die Anmeldung nach dem Code.','Two-step sign-in is on. From now on, signing in asks for the code.'));
  else adm2faDo('disable',{code:c},tt('Zwei-Schritt-Anmeldung ist aus.','Two-step sign-in is off.'));
});

v53Ready=true;
if(modTok&&!admOK) buildAdmin();
if(admPass){admTeamLoad();admWeekLoad();}
