/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V64 (Admin): Zu erledigen, Spieler-Karte, Verwarnungen, Sperr-Vorlagen, Bereiche ======================= */
var v64aReady=false;
let admTodo=null,admTodoErr='',admTodoBusy=false;
let admPlQ='',admPlRes=null,admPlCard=null,admPlUser='',admPlErr='',admPlMsg='',admPlMsgOk=false,admPlBusy=false,admPlArm={k:'',t:0};
const admPlCall=(a,d)=>lbApi('rpc/admin_players',{p_pass:admPass,p_action:a,p_data:d||{}});
const admPlMiss=x=>lbMissing(x)?tt('Dafür fehlt Server-Teil 18 (docs/players-v18.sql).','This needs server part 18 (docs/players-v18.sql).'):String(x&&x.message||tt('Hat nicht geklappt.','Didn’t work.'));
/* Jeder Spielername im Admin-Panel öffnet die Spieler-Karte */
function pcl(n){n=String(n||'');return n?'<button type="button" class="pcl" data-pcard="'+escName(n)+'">'+escName(n)+'</button>':'';}
const admSignIn=(id,why)=>admCardH('🔐 '+tt('Server-Werkzeuge','Server tools'),admSrvForm(id,why));
els.admin.addEventListener('submit',e=>{
  const id=e.target.getAttribute('id');if(id!=='admTodoPwF'&&id!=='admPlPwF') return;
  e.preventDefault();const v=e.target.querySelector('[name=spw]').value;if(v) admSrvLogin(v,'mod');
});

/* ---------- Zu erledigen ---------- */
async function admTodoLoad(){
  if(!admPass||admTodoBusy) return;
  admTodoBusy=true;admTodoRender();
  try{admTodo=await lbApi('rpc/admin_todo',{p_pass:admPass});admTodoErr='';}catch(x){admTodoErr=admPlMiss(x);}
  admTodoBusy=false;admTodoRender();
}
const TODO_SECS=[
  ['reports','🚩',['Offene Meldungen','Open reports'],'mod:co',it=>pcl(it.who)+(it.club?' · '+escName(it.club):''),it=>'„'+escName(it.body)+'“'],
  ['appeals','📨',['Einsprüche gegen Sperren','Ban appeals'],'mod:pl',it=>pcl(it.who),it=>'„'+escName(it.body)+'“'],
  ['flags','⚠️',['Verdächtige Spielstände','Suspicious saves'],'mod:pl',it=>pcl(it.who),it=>fmt(+it.old||0)+' → '+fmt(+it.new||0)],
  ['feedback','💬',['Feedback von Spielern','Player feedback'],'srv:hl',it=>it.who?pcl(it.who):tt('ohne Konto','no account'),it=>'„'+escName(it.body)+'“'],
  ['crashes','🐞',['Neue Abstürze (24 Std)','New crashes (24 h)'],'srv:hl',it=>escName(it.msg),it=>'×'+fmt(+it.count||1)]];
function admTodoRender(){
  const el=$id('admTodo');if(!el) return;
  if(!admPass){el.innerHTML=admSignIn('admTodoPwF',tt('Melde dich an, dann siehst du hier alles, was auf dich wartet.','Sign in to see everything that waits for you.'));return;}
  const T=admTodo;
  if(!T){el.innerHTML=admCardH('📋 '+tt('Zu erledigen','To-do'),admTodoErr?'<p class="small">'+admTodoErr+'</p>':skelRows(4));if(!admTodoErr&&!admTodoBusy) setTimeout(admTodoLoad,0);return;}
  const al=T.alarms||[];let n=al.length;TODO_SECS.forEach(s=>{n+=(T[s[0]]&&+T[s[0]].n)||0;});
  let h='<div class="admtodohead"><b>'+(n?tt('Wartet auf dich: ','Waiting for you: ')+n:'✅ '+tt('Alles erledigt – nichts wartet auf dich.','All done – nothing waits for you.'))+'</b><button type="button" class="btn sm" data-todo="reload"'+(admTodoBusy?' disabled':'')+'>'+(admTodoBusy?tt('Lädt …','Loading …'):tt('Aktualisieren','Refresh'))+'</button></div>';
  if(al.length) h+=admCardH('🩺 '+tt('Server-Alarme','Server alarms')+' <span class="todon">'+al.length+'</span>','<div class="admlbl">'+al.map(a=>'<div class="admlbr"><span class="rk">🩺</span><span class="who"><b>'+escName(a.kind)+'</b><small>'+admDT(a.at)+'</small></span></div>').join('')+'</div><div class="btns" style="margin-top:6px"><button type="button" class="btn sm" data-todogo="srv:hl">'+tt('Server-Zustand öffnen','Open server health')+'</button></div>');
  TODO_SECS.forEach(([k,ic,t,go,who,what])=>{
    const S2=T[k]||{n:0,top:[]};if(!+S2.n) return;
    h+=admCardH(ic+' '+tx(t)+' <span class="todon">'+fmt(+S2.n)+'</span>','<div class="admlbl">'+(S2.top||[]).map(it=>'<div class="admlbr"><span class="rk">'+ic+'</span><span class="who"><b>'+who(it)+'</b><small>'+what(it)+' · '+admDT(it.at)+'</small></span></div>').join('')+'</div>'
      +'<div class="btns" style="margin-top:6px"><button type="button" class="btn sm" data-todogo="'+go+'">'+tt('Alle ansehen','See all')+(+S2.n>(S2.top||[]).length?' ('+fmt(+S2.n)+')':'')+'</button></div>');
  });
  el.innerHTML=h;
}

/* ---------- Spieler: Suche und Karte ---------- */
async function admPlFind(q){
  admPlQ=q;admPlErr='';if(!q){admPlRes=null;admPlRender();return;}
  admPlBusy=true;admPlRender();
  try{admPlRes=await admPlCall('find',{q});}catch(x){admPlErr=admPlMiss(x);admPlRes=null;}
  admPlBusy=false;admPlRender();
}
async function admPlLoad(user){
  admPlUser=user||admPlUser;if(!admPlUser||!admPass) return;
  admPlBusy=true;admPlRender();
  try{admPlCard=await admPlCall('card',{user:admPlUser});admPlErr='';admPlUser=admPlCard.account.username;}catch(x){admPlCard=null;admPlErr=admPlMiss(x);}
  admPlBusy=false;admPlRender();
}
function admPlOpen(name){
  const b=els.admin.querySelector('#admSeg [data-ap="pl"]');if(b&&admTab!=='pl') b.click();
  admPlCard=null;admPlMsg='';admPlLoad(name);
  setTimeout(()=>{const c=$id('admPl');if(c) c.scrollIntoView({block:'start',behavior:'smooth'});},60);
}
const BAN_PRESETS=[
  ['cheat','🎭',['Schummeln','Cheating'],0,{device:true},['Für immer + Gerät','Forever + device']],
  ['rude','🤬',['Unhöflicher Chat','Rude chat'],24,{wipe_chat:true},['24 Std + Chat löschen','24 h + delete chat']],
  ['spam','📢',['Spam','Spam'],168,{wipe_chat:true},['7 Tage + Chat löschen','7 days + delete chat']],
  ['name','🏷️',['Unpassender Name','Bad name'],null,{},['Neuen Namen erzwingen','Force a new name']]];
const STRIKE_NEXT=[['Verwarnung','warning'],['24 Std Sperre','24 h ban'],['7 Tage Sperre','7-day ban'],['Sperre für immer','ban forever']];
const LOG_IC={warn:'⚠️',ban:'⛔',unban:'✅',ended:'⌛',mute:'🔇',unmute:'🔈',rename:'🏷️'};
const LOG_TX={warn:['Verwarnung','Warning'],ban:['Gesperrt','Banned'],unban:['Entsperrt','Unbanned'],ended:['Sperre abgelaufen','Ban ended'],mute:['Stummgeschaltet','Muted'],unmute:['Stummschaltung aufgehoben','Unmuted'],rename:['Name erzwungen','Name forced']};
const admHrs=h=>h===null||h===undefined?'':+h===0?tt('für immer','forever'):+h>=48?fmt(Math.round(h/24))+tt(' Tage',' days'):fmt(+h)+tt(' Std',' h');
function admPlArmed(k){return admPlArm.k===k&&Date.now()-admPlArm.t<5000;}
function admPlCardHtml(C){
  const A=C.account,on=A.seen_at&&Date.now()-Date.parse(A.seen_at)<180000,st=+C.strikes||0;
  const chip=(c,t)=>'<span class="plchip '+c+'">'+t+'</span>';
  let h='<div class="plhead"><span class="plav" aria-hidden="true">👤<i class="pdot'+(on?' on':'')+'"></i></span><span><b>'+escName(A.username)+'</b><small>'
    +(on?tt('🟢 Gerade online','🟢 Online now'):tt('Zuletzt gesehen: ','Last seen: ')+admDT(A.seen_at||A.last_login))+' · '+tt('Konto seit ','Account since ')+new Date(A.created_at).toLocaleDateString(LOC[LANG])+'</small>'
    +(C.names&&C.names.length?'<small>'+tt('Frühere Namen: ','Earlier names: ')+C.names.map(n=>escName(n.name)).join(', ')+'</small>':'')
    +(A.bakery&&A.bakery!==A.username?'<small>🏠 '+escName(A.bakery)+'</small>':'')+'</span></div>';
  h+='<div class="plchips">'
    +(C.ban?chip('bad','⛔ '+tt('Gesperrt ','Banned ')+(C.ban.until?tt('bis ','until ')+admDT(C.ban.until):tt('für immer','forever'))):'')
    +(C.mute?chip('warn','🔇 '+tt('Stumm bis ','Muted until ')+admDT(C.mute.until)):'')
    +chip(st?'warn':'ok','⚠️ '+tt('Verwarnungen: ','Strikes: ')+st+'/4')
    +(C.reports&&+C.reports.open?chip('warn','🚩 '+fmt(+C.reports.open)+tt(' offene Meldungen',' open reports')):'')
    +(+C.flags?chip('warn','⚠️ '+fmt(+C.flags)+tt(' verdächtige Spielstände',' suspicious saves')):'')
    +(C.appeal&&C.appeal.status==='open'?chip('warn','📨 '+tt('Einspruch offen','Appeal open')):'')
    +(C.lb&&C.lb.banned?chip('bad','🏆 '+tt('Bestenlisten-Sperre','Leaderboard ban')):'')+'</div>';
  const kv=(l,v)=>'<span><small>'+l+'</small><b>'+v+'</b></span>';
  h+='<div class="plfacts">'+kv(tt('Bestenliste','Leaderboard'),C.lb?'#'+fmt(+C.lb.rank)+' · '+fmt(+C.lb.score):'–')
    +kv(tt('Klicks','Clicks'),C.lb&&C.lb.clicks!=null?fmt(+C.lb.clicks):'–')+kv(tt('Goldkekse','Golden cookies'),C.lb&&C.lb.gold!=null?fmt(+C.lb.gold):'–')
    +kv(tt('Club','Club'),C.club?escName((C.club.emoji||'')+' '+C.club.name)+(C.club.owner?' 👑':''):'–')
    +kv(tt('Geräte','Devices'),fmt(+A.devices||0))+kv(tt('Geschenke (30 T.)','Gifts (30 d)'),'↑'+fmt(+C.gifts.sent||0)+' ↓'+fmt(+C.gifts.got||0))
    +kv(tt('Spielstand','Save'),fmt(+A.save_baked||0)+' · '+admDT(A.save_at))+kv(tt('Meldungen','Reports'),fmt(+(C.reports&&C.reports.n)||0)+tt(' gegen, ',' against, ')+fmt(+(C.reports&&C.reports.made)||0)+tt(' gemacht',' made'))+'</div>';
  const nx=STRIKE_NEXT[Math.min(st,3)];
  h+='<h5 class="plh">'+tt('Verwarnen','Warn')+'</h5><form class="coderow" id="admPlWarnF" novalidate><input class="namein" name="reason" maxlength="200" placeholder="'+tt('Grund (sieht der Spieler)','Reason (the player sees it)')+'" aria-label="'+tt('Grund','Reason')+'"><button type="submit" class="btn sm primary">⚠️ '+tt('Verwarnen','Warn')+' → '+tx(nx)+'</button></form>'
    +'<p class="small">'+tt('Stufen: Verwarnung → 24 Std → 7 Tage → für immer. Verwarnungen zählen 180 Tage.','Steps: warning → 24 h → 7 days → forever. Strikes count for 180 days.')+'</p>';
  h+='<h5 class="plh">'+tt('Schnell-Sperren','Quick bans')+'</h5><div class="plpresets">'+BAN_PRESETS.map(([k,ic,t,,,d])=>'<button type="button" class="btn sm'+(admPlArmed('p:'+k)?' armed':'')+'" data-plp="'+k+'"><span>'+ic+' '+tx(t)+'</span><small>'+(admPlArmed('p:'+k)?tt('Nochmal tippen zum Bestätigen','Tap again to confirm'):tx(d))+'</small></button>').join('')+'</div>';
  h+='<div class="btns" style="margin-top:8px">'+(C.ban?'<button type="button" class="btn sm" data-pla="unban">✅ '+tt('Entsperren','Unban')+'</button>':'<button type="button" class="btn sm" data-ban="pick:'+escName(A.username)+'">⛔ '+tt('Eigene Sperre …','Custom ban …')+'</button>')
    +(C.mute?'<button type="button" class="btn sm" data-pla="unmute">🔈 '+tt('Stummschaltung aufheben','Unmute')+'</button>':'<button type="button" class="btn sm" data-pla="mute">🔇 '+tt('24 Std stumm','Mute 24 h')+'</button>')+'</div>';
  h+='<details class="fold"><summary class="wt">✉️ '+tt('Nachricht schicken','Send a message')+'</summary><form class="admform" id="admPlMailF" novalidate><input class="namein" name="title" maxlength="80" placeholder="'+tt('Titel','Title')+'"><textarea class="namein" name="body" maxlength="600" rows="3" placeholder="'+tt('Text','Text')+'"></textarea><button type="submit" class="btn sm">'+tt('Senden','Send')+'</button></form></details>';
  h+='<h5 class="plh">'+tt('Verlauf','History')+'</h5>'+(C.log&&C.log.length?'<div class="admlbl">'+C.log.map(l=>'<div class="admlbr"><span class="rk">'+(LOG_IC[l.kind]||'•')+'</span><span class="who"><b>'+tx(LOG_TX[l.kind]||[l.kind,l.kind])+(l.strike?' · '+tt('Stufe ','strike ')+l.strike:'')+(l.hours!=null?' · '+admHrs(l.hours):'')+'</b><small>'+(l.reason?'„'+escName(l.reason)+'“ · ':'')+escName(l.who||'')+' · '+admDT(l.at)+'</small></span></div>').join('')+'</div>':'<p class="small">'+tt('Noch nichts – eine saubere Weste.','Nothing yet – a clean record.')+'</p>');
  if(C.reports&&C.reports.last&&C.reports.last.length) h+='<h5 class="plh">'+tt('Letzte Meldungen gegen den Spieler','Latest reports against the player')+'</h5><div class="admlbl">'+C.reports.last.map(r=>'<div class="admlbr'+(r.status==='open'?'':' done')+'"><span class="rk">🚩</span><span class="who"><b>„'+escName(r.body)+'“</b><small>'+escName(r.club||'')+' · '+admDT(r.at)+'</small></span></div>').join('')+'</div>';
  return h;
}
function admPlRender(){
  const el=$id('admPl');if(!el) return;
  if(!admPass){el.innerHTML=admSignIn('admPlPwF',tt('Melde dich an, um Spieler zu suchen.','Sign in to look up players.'));return;}
  let h=admCardH('🔎 '+tt('Spieler finden','Find a player'),'<form class="coderow" id="admPlF" novalidate><input type="search" class="namein" name="q" maxlength="30" autocomplete="off" value="'+escName(admPlQ)+'" placeholder="'+tt('Benutzername oder früherer Name','Username or earlier name')+'" aria-label="'+tt('Spieler suchen','Search players')+'"><button type="submit" class="btn sm primary">'+tt('Suchen','Search')+'</button></form>'
    +(admPlRes?(admPlRes.length?'<div class="admlbl" style="margin-top:8px">'+admPlRes.map(r=>'<div class="admlbr"><span class="rk">'+(r.banned?'⛔':r.muted?'🔇':r.online?'🟢':'👤')+'</span><span class="who"><b>'+pcl(r.username)+(r.strikes?' · ⚠️'+r.strikes:'')+'</b><small>'+(r.old&&r.old.length?tt('früher: ','was: ')+r.old.map(o=>escName(o)).join(', ')+' · ':'')+(r.score!=null?fmt(+r.score)+tt(' Kekse',' cookies'):tt('nicht in der Bestenliste','not on the leaderboard'))+'</small></span></div>').join('')+'</div>':'<p class="small" style="margin-top:6px">'+tt('Niemand gefunden.','Nobody found.')+'</p>'):(admPlBusy&&!admPlUser?skelRows(3):'')));
  if(admPlMsg) h+='<p class="nameerr'+(admPlMsgOk?' ok':'')+'">'+admPlMsg+'</p>';
  if(admPlErr) h+='<p class="nameerr">'+admPlErr+'</p>';
  if(admPlUser) h+='<div class="admcard plcard" id="admPlCard"><h4>👤 '+tt('Spieler-Karte','Player card')+'</h4>'+(admPlCard?admPlCardHtml(admPlCard):skelRows(5))+'</div>';
  const keep={};el.querySelectorAll('input,textarea').forEach(i=>{if(i.name&&i.closest('form')) keep[i.closest('form').getAttribute('id')+':'+i.name]=i.value;});
  const open=[...el.querySelectorAll('details')].map(d=>d.open);
  el.innerHTML=h;
  el.querySelectorAll('input,textarea').forEach(i=>{const k=i.closest('form')&&i.closest('form').getAttribute('id')+':'+i.name;if(k&&keep[k]!==undefined&&i.type!=='search') i.value=keep[k];});
  el.querySelectorAll('details').forEach((d,i)=>{if(open[i]) d.open=true;});
}
async function admPlDo(fn,okMsg){
  admPlBusy=true;admPlMsg='';
  try{const r=await fn();admPlMsg=typeof okMsg==='function'?okMsg(r):okMsg;admPlMsgOk=true;toast(admPlMsg,true);}catch(x){admPlMsg=admPlMiss(x);admPlMsgOk=false;}
  admPlBusy=false;await admPlLoad();if(typeof admBanCall==='function') admBanCall('list');admTodo=null;
}
els.admin.addEventListener('click',e=>{
  const pc=e.target.closest('[data-pcard]');if(pc){e.preventDefault();admPlOpen(pc.dataset.pcard);return;}
  if(e.target.closest('#admPl [data-ban^="pick:"]')){admSec.mod='pl';admSecSave();const b=els.admin.querySelector('#admSeg [data-ap="mod"]');if(b) b.click();setTimeout(()=>{admSecApply('mod');const f=$id('admBanF');if(f) f.scrollIntoView({block:'center',behavior:'smooth'});},80);return;}
  const tg=e.target.closest('[data-todogo]');if(tg){const [tab,sec]=tg.dataset.todogo.split(':');admSec[tab]=sec;admSecSave();const b=els.admin.querySelector('#admSeg [data-ap="'+tab+'"]');if(b) b.click();admSecApply(tab);return;}
  if(e.target.closest('[data-todo="reload"]')){admTodoLoad();return;}
  const sb=e.target.closest('[data-asec]');if(sb){const [tab,sec]=sb.dataset.asec.split(':');admSec[tab]=sec;admSecSave();admSecApply(tab);return;}
  const C=admPlCard;if(!C) return;const u=C.account.username;
  const pp=e.target.closest('[data-plp]');
  if(pp){
    const k=pp.dataset.plp,P=BAN_PRESETS.find(x=>x[0]===k);if(!P) return;
    if(!admPlArmed('p:'+k)){admPlArm={k:'p:'+k,t:Date.now()};admPlRender();setTimeout(()=>{if(admPlArm.k==='p:'+k){admPlArm={k:'',t:0};admPlRender();}},5100);return;}
    admPlArm={k:'',t:0};const why=P[2][1]+' / '+P[2][0];
    if(k==='name') admPlDo(()=>admPlCall('rename',{user:u,reason:why}),tt('Neuer Name erzwungen.','New name forced.'));
    else admPlDo(()=>lbApi('rpc/admin_bans',{p_pass:admPass,p_action:'ban',p_data:Object.assign({user:u,hours:P[3],reason:why},P[4])}),tt('Gesperrt: ','Banned: ')+u);
    return;
  }
  const pa=e.target.closest('[data-pla]');
  if(pa){
    const a=pa.dataset.pla;
    if(a==='unban') admPlDo(()=>lbApi('rpc/admin_bans',{p_pass:admPass,p_action:'unban',p_data:{user:u}}),tt('Entsperrt: ','Unbanned: ')+u);
    else if(a==='mute') admPlDo(()=>lbApi('rpc/admin_mod',{p_pass:admPass,p_action:'mute',p_data:{user:u,hours:24}}),tt('24 Std stumm: ','Muted for 24 h: ')+u);
    else if(a==='unmute') admPlDo(()=>lbApi('rpc/admin_mod',{p_pass:admPass,p_action:'unmute',p_data:{user:u}}),tt('Nicht mehr stumm: ','Unmuted: ')+u);
  }
});
els.admin.addEventListener('submit',e=>{
  const f=e.target,id=f.getAttribute('id');
  if(id==='admPlF'){e.preventDefault();admPlUser='';admPlCard=null;admPlFind(String(new FormData(f).get('q')||'').trim());return;}
  if(!admPlCard) return;const u=admPlCard.account.username,d=Object.fromEntries(new FormData(f).entries());
  if(id==='admPlWarnF'){e.preventDefault();const r=String(d.reason||'').trim();if(!r){admPlMsg=tt('Schreib einen Grund dazu.','Add a reason.');admPlMsgOk=false;admPlRender();return;}
    admPlDo(async()=>{const w=await admPlCall('warn',{user:u,reason:r});f.reset();return w;},w=>tt('Verwarnt: ','Warned: ')+u+' · '+tt('Stufe ','strike ')+w.strike+(w.hours!=null?' · '+tt('gesperrt ','banned ')+admHrs(w.hours):''));return;}
  if(id==='admPlMailF'){e.preventDefault();if(!String(d.title||'').trim()) return;
    admPlDo(()=>lbApi('rpc/admin_mod',{p_pass:admPass,p_action:'mail',p_data:{to:u,title:d.title,body:d.body||''}}),tt('Nachricht geschickt.','Message sent.'));}
});

/* ---------- Bereiche in den langen Tabs Moderation und Server ---------- */
const ADM_SECS={
  mod:[['pl','👥',['Spieler','Players'],'🔎⛔🔇⚠📨'],['co','💬',['Gemeinschaft','Community'],'🚩✉🚫👮']],
  srv:[['hl','🩺',['Server-Zustand','Server health'],'🩺📊🚪📈📅🧭🐞🗄💬'],['st','⚙️',['Einstellungen','Settings'],'🎚🛠⬆🏛💾🛰📱🔔📜']]};
let admSec={mod:'pl',srv:'hl'};
try{Object.assign(admSec,JSON.parse(sessionStorage.getItem('keksfabrik-admsec')||'{}'));}catch(x){}
function admSecSave(){try{sessionStorage.setItem('keksfabrik-admsec',JSON.stringify(admSec));}catch(x){}}
/* Die Leiste steht über dem Inhalt (nicht darin), und ausgeblendet wird per CSS – so flackert nichts, wenn der Tab neu zeichnet. */
{
  let css='';
  Object.entries(ADM_SECS).forEach(([tab,L])=>{const box=tab==='mod'?'#admMod':'#admSrv';
    L.forEach(s=>L.filter(o=>o!==s).forEach(o=>[...o[3]].forEach(ic=>{css+=box+'[data-sec="'+s[0]+'"] .admcard[data-ic="'+ic+'"]{display:none}';})));});
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
}
function admSecApply(tab){
  const box=$id(tab==='mod'?'admMod':'admSrv');if(!box||!box.parentElement) return;
  let bar=box.parentElement.querySelector(':scope > .admsecbar');
  if(!bar){bar=document.createElement('div');bar.className='seg admsecbar';bar.setAttribute('role','group');bar.innerHTML=ADM_SECS[tab].map(s=>'<button type="button" data-asec="'+tab+':'+s[0]+'">'+s[1]+' '+tx(s[2])+'</button>').join('')+'<button type="button" data-asec="'+tab+':all">'+tt('Alle','All')+'</button>';box.parentElement.insertBefore(bar,box);}
  const cur=admSec[tab]==='all'||ADM_SECS[tab].some(s=>s[0]===admSec[tab])?admSec[tab]:ADM_SECS[tab][0][0];
  if(box.dataset.sec!==cur) box.dataset.sec=cur;
  bar.querySelectorAll('[data-asec]').forEach(b=>{const v=b.dataset.asec===tab+':'+cur?'true':'false';if(b.getAttribute('aria-pressed')!==v) b.setAttribute('aria-pressed',v);});
}
let admSecRaf=0;
new MutationObserver(()=>{if(admSecRaf) return;admSecRaf=requestAnimationFrame(()=>{admSecRaf=0;admSecApply('mod');admSecApply('srv');});}).observe(els.admin,{childList:true});
setInterval(()=>{admSecApply('mod');admSecApply('srv');},1000);

/* ---------- Spieler direkt aus der Admin-Suche ---------- */
let admQPt=0,admQPq='',admQPr=null;
els.admin.addEventListener('input',e=>{
  if(e.target.id!=='admQ') return;
  const q=e.target.value.trim();clearTimeout(admQPt);
  if(q.length<2||!admPass){admQPr=null;admQPq='';admQPShow();return;}
  admQPt=setTimeout(async()=>{try{admQPr=await admPlCall('find',{q});admQPq=q;}catch(x){admQPr=null;}admQPShow();},350);
});
function admQPShow(){
  let box=$id('admQP');const qi=$id('admQ');if(!qi) return;
  if(!box){box=document.createElement('div');box.id='admQP';box.className='admqp';qi.insertAdjacentElement('afterend',box);}
  const cur=qi.value.trim();
  box.hidden=!(admQPr&&admQPr.length&&cur===admQPq);
  if(!box.hidden) box.innerHTML='<span class="small">👥 '+tt('Spieler: ','Players: ')+'</span>'+admQPr.slice(0,8).map(r=>pcl(r.username)).join('');
}

/* ---------- Einbindung ---------- */
function admV64Render(){admTodoRender();admPlRender();admSecApply('mod');admSecApply('srv');}
function admV64Load(){admTodo=null;admTodoLoad();if(admPlUser) admPlLoad();else admPlRender();}
v64aReady=true;
