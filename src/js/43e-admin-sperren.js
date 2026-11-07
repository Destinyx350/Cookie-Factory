/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ---------- Admin: Konten sperren (Moderation-Tab) ---------- */
var v52Ready=false,admBans=null,admBanErr='',admBanUser='';
async function admBanCall(action,data,okTxt){
  admBanErr='';
  try{admBans=await lbApi('rpc/admin_bans',{p_pass:admPass,p_action:action,p_data:data||null});if(okTxt) toast(okTxt);}
  catch(x){const m=String(x.message||'');admBanErr=lbMissing(x)?tt('Dafür braucht der Server zuerst docs/admin-v11.sql.','This needs docs/admin-v11.sql on the server first.'):/player not found/.test(m)?tt('Diesen Benutzernamen gibt es nicht.','No account with that username.'):/invalid hours/.test(m)?tt('Ungültige Dauer.','Invalid duration.'):admErrTxt(x);}
  admModArm={k:'',t:0};admModRender();
}
function admBanHtml(){
  const L=admBans||[],armed=admModArmed('banF');
  const dur=[[1,tt('1 Stunde','1 hour')],[24,tt('1 Tag','1 day')],[168,tt('7 Tage','7 days')],[720,tt('30 Tage','30 days')],[0,tt('Für immer','Forever')]];
  return admCardH('⛔ '+tt('Konten sperren','Account bans')+' <small class="muted">('+(admBans?L.length:'…')+')</small>',
    '<p class="small">'+tt('Ein gesperrtes Konto kann sich nicht anmelden und keine Online-Funktionen nutzen (Konto-Speicher, Clubs, Chat, Geschenke, Freunde, Push). Sein Platz in der Bestenliste wird auch gesperrt, und es verlässt seinen Club. Das Spiel auf dem Gerät bleibt.','A banned account can’t sign in or use online features (account saves, clubs, chat, gifts, friends, push). Its leaderboard spot is banned too, and it leaves its club. The game on the device stays.')+'</p>'
    +'<form class="admform" id="admBanF" novalidate><label class="small">'+tt('Benutzername','Username')+'<input class="namein" name="user" maxlength="16" autocapitalize="off" spellcheck="false" value="'+escName(admBanUser)+'"></label>'
    +'<label class="small">'+tt('Dauer','How long')+'<select class="namein" name="hours">'+dur.map(([h,l])=>'<option value="'+h+'"'+(h===168?' selected':'')+'>'+l+'</option>').join('')+'</select></label>'
    +'<input class="namein" name="reason" maxlength="200" placeholder="'+tt('Grund (sieht der Spieler)','Reason (the player sees it)')+'" style="grid-column:1/-1">'
    +'<label class="chk" style="grid-column:1/-1"><input type="checkbox" name="device"><span>'+tt('Auch seine Geräte sperren (keine neuen Konten, Clubs, Geschenke oder Meldungen von dort)','Also block their devices (no new accounts, clubs, gifts or reports from them)')+'</span></label>'
    +'<label class="chk" style="grid-column:1/-1"><input type="checkbox" name="wipe"><span>'+tt('Seine Chat-Nachrichten löschen','Delete their chat messages')+'</span></label>'
    +'<button type="submit" class="btn warn'+(armed?' armed':'')+'">'+(armed?tt('Wirklich sperren?','Really ban?'):tt('Konto sperren','Ban account'))+'</button></form>'
    +(admBanErr?'<p class="nameerr">'+admBanErr+'</p>':'')
    +(L.length?'<div class="admlbl" style="margin-top:8px">'+L.map(b=>'<div class="admlbr"><span class="rk">⛔</span><span class="who"><b>'+escName(b.username)+'</b><small>'+(b.until?tt('bis ','until ')+admDT(b.until):tt('für immer','forever'))+(b.devices?' · '+b.devices+' '+tt('Gerät(e)','device(s)'):'')+' · '+tt('seit ','since ')+admDT(b.created_at)+'</small>'+(b.reason?'<small>„'+escName(b.reason)+'“</small>':'')+'</span><span class="btns"><button type="button" class="btn sm" data-ban="unban:'+escName(b.username)+'">'+tt('Entsperren','Unban')+'</button></span></div>').join('')+'</div>':''));
}
els.admin.addEventListener('submit',e=>{
  const f=e.target;if(f.getAttribute('id')!=='admBanF') return;
  e.preventDefault();const d=Object.fromEntries(new FormData(f).entries()),user=String(d.user||'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(user)){admBanErr=tt('Gib den Benutzernamen des Kontos ein.','Enter the account username.');admModRender();return;}
  if(!admModArmed('banF')){admModArm={k:'banF',t:Date.now()};admBanUser=user;admModRender();return;}
  admBanUser='';
  admBanCall('ban',{user,hours:+d.hours||0,reason:String(d.reason||'').trim(),device:!!f.querySelector('[name=device]').checked,wipe_chat:!!f.querySelector('[name=wipe]').checked},tt('Konto gesperrt.','Account banned.'))
    .then(()=>{if(!admBanErr){const nf=$id('admBanF');if(nf) nf.reset();if(admFindQ) admMod('search',{q:admFindQ}).then(x=>{admFind=x;admModRender();}).catch(()=>{});}});
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-ban]');if(!b) return;
  const [a,user]=b.dataset.ban.split(':');
  if(a==='pick'){admBanUser=user;admBanErr='';admModRender();const f=$id('admBanF');if(f){f.scrollIntoView({block:'center',behavior:'smooth'});const r=f.querySelector('[name=reason]');if(r) r.focus();}return;}
  if(a==='unban') admBanCall('unban',{user},tt('Konto entsperrt.','Account unbanned.'));
});
els.admin.addEventListener('click',e=>{const b=e.target.closest('#admSeg [data-ap="mod"]');if(b) setTimeout(()=>{if(admPass&&!admBans) admBanCall('list');},0);});
v52Ready=true;
if(admPass) admBanCall('list');
