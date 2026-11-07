/* ======================= V43: Konten (Benutzername + Passwort) ======================= */
const ACC_KEY='keksfabrik-session',ACC_SYNC='keksfabrik-acc-sync';
let accTok=lsGet(ACC_KEY)||'',accMe=null,accV4=null,accMode='login',accBusy=false,accMsg='',accMsgOk=false,accArm={k:'',t:0},accAsked=false;
const accUnset=()=>{accTok='';accMe=null;accMode='login';try{localStorage.removeItem(ACC_KEY);}catch(x){}};
const accSaveText=()=>enc(sealJSON(S));
function accApplySave(t){
  let o=null;try{o=JSON.parse(dec(String(t)));}catch(x){try{o=JSON.parse(String(t));}catch(y){o=null;}}
  if(!o||typeof o!=='object'||typeof o.cookies!=='number') return false;
  try{pushBackup();}catch(x){}
  const s=sanitize(o);if(!s.name) s.name=S.name;
  if(s.tamp) setTimeout(tampWarn,400);
  S=s;S.t=Date.now();LANG=S.opt.lang;els.fx.checked=S.opt.fx;
  applyLang();rebuildAll();save();slotSig='';if(v46Ready) setTimeout(()=>lbAccSync(true),300);return true;
}
async function accRefresh(){
  if(!lbOn()){accRender();return;}
  if(!accTok){
    if(accV4===null){try{await lbApi('rpc/acc_me',{p_token:'-'});}catch(x){accV4=lbMissing(x)?false:true;}}
    accRender();return;
  }
  try{accMe=await lbApi('rpc/acc_me',{p_token:accTok});accV4=true;}
  catch(x){if(lbMissing(x)) accV4=false;else if(/not signed in/.test(String(x.message))) accUnset();}
  accRender();accCheckNewer();
}
async function accUpload(manual){
  if(!accTok||accBusy) return;
  try{
    save();const r=await lbApi('rpc/acc_save',{p_token:accTok,p_data:accSaveText(),p_baked:lbCheat()?0:Math.floor(Math.min(S.all,9.9e299))});
    if(r&&r.save_at){lsSet(ACC_SYNC,r.save_at);if(accMe){accMe.save_at=r.save_at;accMe.has_save=true;}if(v48Ready) profPush();}
    if(manual){accMsg=tt('In deinem Konto gespeichert.','Saved to your account.');accMsgOk=true;}
  }catch(x){if(/not signed in/.test(String(x.message))) accUnset();if(manual){accMsg=tt('Speichern hat nicht geklappt. Prüfe dein Internet.','Saving didn’t work. Check your internet.');accMsgOk=false;}}
  accRender();
}
async function accDownload(){
  try{const t=await lbApi('rpc/acc_load',{p_token:accTok});if(!accApplySave(t)) throw new Error('bad');lsSet(ACC_SYNC,accMe&&accMe.save_at||new Date().toISOString());accMsg=tt('Bäckerei aus deinem Konto geladen. Dein altes Spiel liegt unter Backups.','Bakery loaded from your account. Your old game is under Backups.');accMsgOk=true;toast(accMsg,true);}
  catch(x){accMsg=tt('Laden hat nicht geklappt.','Loading didn’t work.');accMsgOk=false;}
  accRender();
}
function accAsk(title,body,yes,no,onYes,onNo){
  $id('accAskT').textContent=title;$id('accAskB').innerHTML=body;$id('accYes').textContent=yes;$id('accNo').textContent=no;
  $id('accYes').onclick=()=>{$id('accAskOv').hidden=true;onYes();};$id('accNo').onclick=()=>{$id('accAskOv').hidden=true;onNo();};
  $id('accAskOv').hidden=false;$id('accYes').focus();
}
function accCheckNewer(){
  if(!accMe||!accMe.has_save||accAsked) return;
  const last=Date.parse(lsGet(ACC_SYNC)||0)||0,at=Date.parse(accMe.save_at)||0;
  if(at<=last+5000) return;
  accAsked=true;
  accAsk(tt('Neuerer Spielstand im Konto','Newer save in your account'),
    '<p>'+tt('Dein Konto hat einen Spielstand von einem anderen Gerät:','Your account has a save from another device:')+'</p><p><b>'+fmt(accMe.save_baked||0)+tt(' Kekse',' cookies')+'</b> · '+new Date(accMe.save_at).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</p><p class="small">'+tt('Auf diesem Gerät: ','On this device: ')+fmt(S.all)+tt(' Kekse',' cookies')+'</p>',
    tt('Konto-Spielstand laden','Load account save'),tt('Dieses Gerät behalten','Keep this device'),
    ()=>accDownload(),()=>{accUpload(false);});
}
function accRender(){
  const box=$id('accBox');if(!box) return;
  const st=$id('stAcc');
  if(st){st.hidden=!lbOn()||accV4===false;st.textContent=accMe?'👤 '+accMe.username:tt('👤 Anmelden','👤 Sign in');}
  let h;
  if(!lbOn()||accV4===false) h='<p class="small">'+tt('Konten sind noch nicht eingerichtet.','Accounts aren’t set up yet.')+'</p>';
  else if(accTok&&accMe){
    const arm=k=>accArm.k===k&&Date.now()-accArm.t<5000;
    h='<div class="accme"><span class="accav" aria-hidden="true">👤</span><span><b>'+escName(accMe.username)+'</b><small>'+(accMe.save_at?tt('Zuletzt gespeichert: ','Last saved: ')+new Date(accMe.save_at).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):tt('Noch nichts gespeichert','Nothing saved yet'))+' · '+tt('speichert automatisch','saves automatically')+'</small></span></div>'
      +'<div class="btns" style="margin-top:10px"><button type="button" class="btn primary" data-acc="save">'+tt('Jetzt speichern','Save now')+'</button>'+(accMe.has_save?'<button type="button" class="btn'+(arm('load')?' armed':'')+'" data-acc="load">'+(arm('load')?tt('Ersetzt dein Spiel! Nochmal','Replaces your game! Again'):tt('Aus Konto laden','Load from account'))+'</button>':'')+'<button type="button" class="btn" data-acc="logout">'+tt('Abmelden','Sign out')+'</button><button type="button" class="btn" data-acc="logoutall">'+tt('Andere Geräte abmelden','Sign out other devices')+'</button></div>'
      +'<details class="fold accfold"><summary>'+tt('Passwort ändern','Change password')+'</summary><form class="coderow" id="accPwF" novalidate><input type="password" class="namein" name="old" autocomplete="current-password" placeholder="'+tt('Altes Passwort','Old password')+'"><input type="password" class="namein" name="new" autocomplete="new-password" placeholder="'+tt('Neues Passwort (mind. 6)','New password (6+)')+'"><button type="submit" class="btn">'+tt('Ändern','Change')+'</button></form></details>'
      +'<details class="fold accfold"><summary>'+tt('Konto löschen','Delete account')+'</summary><p class="small">'+tt('Löscht dein Konto und den Spielstand darin für immer. Dein Spiel auf diesem Gerät bleibt.','Deletes your account and its save forever. Your game on this device stays.')+'</p><form class="coderow" id="accDelF" novalidate><input type="password" class="namein" name="pass" autocomplete="current-password" placeholder="'+tt('Passwort zur Bestätigung','Password to confirm')+'"><button type="submit" class="btn'+(arm('del')?' armed':'')+'">'+(arm('del')?tt('Wirklich löschen? Nochmal','Really delete? Again'):tt('Konto löschen','Delete account'))+'</button></form></details>';
  }else{
    const up=accMode==='signup';
    h='<div class="seg acctabs" role="tablist"><button type="button" data-accm="login" aria-pressed="'+(!up)+'">'+tt('Anmelden','Sign in')+'</button><button type="button" data-accm="signup" aria-pressed="'+up+'">'+tt('Konto erstellen','Create account')+'</button></div>'
      +'<form class="accform" id="accF" novalidate><input class="namein" name="user" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="'+tt('Benutzername (3–16 Buchstaben, Zahlen oder _)','Username (3–16 letters, numbers or _)')+'" aria-label="'+tt('Benutzername','Username')+'"><input class="namein" name="pass" type="password" maxlength="72" autocomplete="'+(up?'new-password':'current-password')+'" placeholder="'+tt('Passwort','Password')+(up?tt(' (mind. 6 Zeichen)',' (at least 6 characters)'):'')+'" aria-label="'+tt('Passwort','Password')+'"><label class="chk"><input type="checkbox" id="accShow"><span>'+tt('Passwort anzeigen','Show password')+'</span></label><button type="submit" class="btn primary"'+(accBusy?' disabled':'')+'>'+(accBusy?tt('Moment …','One moment …'):up?tt('Konto erstellen','Create account'):tt('Anmelden','Sign in'))+'</button></form>'
      +'<p class="small" style="margin-top:6px">'+(up?tt('Keine E-Mail nötig. Merk dir dein Passwort gut – wenn du es vergisst, kann der Admin ein neues setzen.','No email needed. Remember your password – if you forget it, the admin can set a new one.'):tt('Mit deinem Konto spielst du auf jedem Gerät mit derselben Bäckerei weiter.','With your account you keep playing the same bakery on every device.'))+'</p>';
  }
  if(accMsg) h+='<p class="nameerr'+(accMsgOk?' ok':'')+'">'+accMsg+'</p>';
  if(box._h!==h){
    const keep={},open=[...box.querySelectorAll('details')].map(d=>d.open);box.querySelectorAll('input').forEach(i=>{if(i.name) keep[i.name]=i.value;});
    box._h=h;box.innerHTML=h;
    box.querySelectorAll('input').forEach(i=>{if(i.name&&keep[i.name]) i.value=keep[i.name];});
    box.querySelectorAll('details').forEach((d,i)=>{if(open[i]) d.open=true;});
  }
  set$('accT',tt('Konto','Account'));
  if(v44Ready) clubAccChanged();
  if(v46Ready) lbAccSync(false);
}
function set$(id,t){const e=$id(id);if(e&&e.textContent!==t) e.textContent=t;}
$id('accBox').addEventListener('change',e=>{if(e.target.id==='accShow') $id('accBox').querySelectorAll('input[name=pass]').forEach(i=>{i.type=e.target.checked?'text':'password';});});
$id('accBox').addEventListener('click',async e=>{
  const m=e.target.closest('[data-accm]');if(m){accMode=m.dataset.accm;accMsg='';accRender();return;}
  const b=e.target.closest('[data-acc]');if(!b) return;
  const a=b.dataset.acc;accMsg='';
  if(a==='save'){accUpload(true);return;}
  if(a==='load'){if(accArm.k!=='load'||Date.now()-accArm.t>5000){accArm={k:'load',t:Date.now()};accRender();return;}accArm={k:'',t:0};accDownload();return;}
  if(a==='logoutall'){try{const n=await lbApi('rpc/acc_logout_all',{p_token:accTok});accMsg=tt('Abgemeldet auf anderen Geräten: ','Signed out on other devices: ')+(+n||0)+'.';accMsgOk=true;}catch(x){accMsg=lbMissing(x)?tt('Das kann die Datenbank noch nicht.','The database can’t do this yet.'):tt('Hat nicht geklappt.','Didn’t work.');accMsgOk=false;}accRender();return;}
  if(a==='logout'){await accUpload(false);try{await lbApi('rpc/acc_logout',{p_token:accTok});}catch(x){}accUnset();accMsg=tt('Abgemeldet. Dein Spiel auf diesem Gerät bleibt.','Signed out. Your game on this device stays.');accMsgOk=true;accRender();}
});
$id('accBox').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f).entries());
  if(f.id==='accF'){
    const user=(d.user||'').trim(),pass=d.pass||'';
    if(!/^[A-Za-z0-9_]{3,16}$/.test(user)){accMsg=tt('Benutzername: 3–16 Buchstaben, Zahlen oder _.','Username: 3–16 letters, numbers or _.');accMsgOk=false;accRender();return;}
    if(pass.length<6){accMsg=tt('Das Passwort braucht mindestens 6 Zeichen.','The password needs at least 6 characters.');accMsgOk=false;accRender();return;}
    accBusy=true;accMsg='';accRender();
    try{
      if(accMode==='signup'){
        const r=await lbApi('rpc/acc_signup',{p_user:user,p_pass:pass,p_player:kfId()});accV4=true;
        accTok=r.token;lsSet(ACC_KEY,accTok);accMe={username:r.username,has_save:false};accBusy=false;
        await accUpload(false);if(v48Ready) refClaim();accMsg=tt('Konto erstellt! Deine Bäckerei ist jetzt in deinem Konto gespeichert.','Account created! Your bakery is now saved in your account.');accMsgOk=true;toast(accMsg,true);
      }else{
        const r=await lbApi('rpc/acc_login',{p_user:user,p_pass:pass});accV4=true;
        if(r&&r.error){accMsg=r.error==='too many tries'?tt('Zu viele falsche Versuche. Warte 15 Minuten.','Too many wrong tries. Wait 15 minutes.'):tt('Benutzername oder Passwort stimmt nicht.','Wrong username or password.');accMsgOk=false;}
        else{
          accTok=r.token;lsSet(ACC_KEY,accTok);accMe=r;accBusy=false;
          if(r.has_save){accAsked=true;accAsk(tt('Willkommen zurück, ','Welcome back, ')+r.username+'!','<p>'+tt('In deinem Konto liegt eine Bäckerei mit ','Your account has a bakery with ')+'<b>'+fmt(r.save_baked||0)+tt(' Keksen',' cookies')+'</b>.</p><p class="small">'+tt('Auf diesem Gerät: ','On this device: ')+fmt(S.all)+tt(' Kekse',' cookies')+'</p>',tt('Konto-Bäckerei laden','Load account bakery'),tt('Dieses Gerät ins Konto','Use this device’s bakery'),()=>accDownload(),()=>accUpload(true));}
          else await accUpload(false);
          accMsg=tt('Angemeldet als ','Signed in as ')+escName(r.username)+'.';accMsgOk=true;
        }
      }
    }catch(x){
      const m=String(x&&x.message||'');accMsgOk=false;
      accMsg=/username taken/.test(m)?tt('Diesen Benutzernamen gibt es schon.','That username is already taken.'):/blocked word/.test(m)?tt('Dieser Benutzername ist nicht erlaubt.','That username isn’t allowed.'):/too many requests/.test(m)?tt('Zu viele neue Konten von diesem Gerät. Versuch es später nochmal.','Too many new accounts from this device. Try again later.'):/invalid username/.test(m)?tt('Benutzername: 3–16 Buchstaben, Zahlen oder _.','Username: 3–16 letters, numbers or _.'):/invalid password/.test(m)?tt('Das Passwort braucht 6–72 Zeichen.','The password needs 6–72 characters.'):/busy/.test(m)?tt('Gerade viel los. Versuch es in einer Minute nochmal.','Busy right now. Try again in a minute.'):lbMissing(x)?tt('Konten sind noch nicht eingerichtet.','Accounts aren’t set up yet.'):tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.');
      if(lbMissing(x)) accV4=false;
    }
    accBusy=false;accRender();return;
  }
  if(f.id==='accPwF'){
    try{await lbApi('rpc/acc_password',{p_token:accTok,p_old:d.old||'',p_new:d.new||''});accMsg=tt('Passwort geändert. Andere Geräte wurden abgemeldet.','Password changed. Other devices were signed out.');accMsgOk=true;f.reset();}
    catch(x){const m=String(x.message||'');accMsg=/wrong password/.test(m)?tt('Das alte Passwort stimmt nicht.','The old password is wrong.'):/invalid password/.test(m)?tt('Das neue Passwort braucht 6–72 Zeichen.','The new password needs 6–72 characters.'):tt('Hat nicht geklappt.','Didn’t work.');accMsgOk=false;}
    accRender();return;
  }
  if(f.id==='accDelF'){
    if(accArm.k!=='del'||Date.now()-accArm.t>5000){accArm={k:'del',t:Date.now()};accRender();return;}
    accArm={k:'',t:0};
    try{await lbApi('rpc/acc_delete',{p_token:accTok,p_pass:d.pass||''});accUnset();try{localStorage.removeItem(ACC_SYNC);}catch(x){}accMsg=tt('Dein Konto wurde gelöscht.','Your account was deleted.');accMsgOk=true;}
    catch(x){accMsg=/wrong password/.test(String(x.message))?tt('Das Passwort stimmt nicht.','Wrong password.'):tt('Hat nicht geklappt.','Didn’t work.');accMsgOk=false;}
    accRender();
  }
});
$id('stAcc').addEventListener('click',()=>closeStart(()=>{openSettings();showSetPane('save');}));
setInterval(()=>{if(accTok&&!document.hidden&&Date.now()-(Date.parse(lsGet(ACC_SYNC)||0)||0)>5*60000) accUpload(false);},30000);
window.addEventListener('pagehide',()=>{
  if(!accTok||!lbOn()) return;
  try{const body=JSON.stringify({p_token:accTok,p_data:accSaveText(),p_baked:lbCheat()?0:Math.floor(Math.min(S.all,9.9e299))});
    if(body.length<60000) fetch(LB_URL+'/rest/v1/rpc/acc_save',{method:'POST',keepalive:true,headers:{apikey:LB_KEY,Authorization:'Bearer '+LB_KEY,'Content-Type':'application/json'},body});}catch(x){}
});
if(lbOn()) setTimeout(accRefresh,2000);

/* Admin: Konten */
let admAccData=null,admAccErr='',admAccArm={k:'',t:0};
function admAccRender(){
  const box=$id('admAcc');if(!box||!admPass) {if(box) box.innerHTML='';return;}
  const D=admAccData,arm=k=>admAccArm.k===k&&Date.now()-admAccArm.t<5000;
  let b='<p class="small">'+tt('Spieler mit Konto: ','Players with an account: ')+(D?D.count:'–')+'</p>';
  if(D&&D.accounts.length){
    b+='<form class="admform" id="admAccPwF" novalidate><label class="small">'+tt('Konto','Account')+'<select class="namein" name="acc">'+D.accounts.map(a=>'<option value="'+a.id+'">'+escName(a.username)+'</option>').join('')+'</select></label><label class="small">'+tt('Neues Passwort','New password')+'<input class="namein" name="pw" minlength="6" maxlength="72"></label><button type="submit" class="btn primary">'+tt('Passwort setzen','Set password')+'</button></form>';
    b+='<div class="admlbl">'+D.accounts.map(a=>'<div class="admlbr"><span class="rk">👤</span><span class="who"><b>'+escName(a.username)+'</b><small>'+fmt(+a.save_baked||0)+tt(' Kekse',' cookies')+' · '+tt('zuletzt ','last ')+(a.last_login?new Date(a.last_login).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'–')+'</small></span><span class="btns"><button type="button" class="btn sm warn'+(arm('del:'+a.id)?' armed':'')+'" data-acca="del:'+a.id+'">'+(arm('del:'+a.id)?tt('Sicher?','Sure?'):tt('Löschen','Delete'))+'</button></span></div>').join('')+'</div>';
  }
  if(admAccErr) b+='<p class="nameerr">'+admAccErr+'</p>';
  const h='<div class="admcard"><h4>👤 '+tt('Konten','Accounts')+'</h4>'+b+'</div>';
  if(box._h!==h){box._h=h;box.innerHTML=h;}
}
async function admAccCall(action,id,pw){
  admAccErr='';
  try{admAccData=await lbApi('rpc/admin_accounts',{p_pass:admPass,p_action:action,p_id:id||null,p_new:pw||null});if(action==='set_password') toast(tt('Neues Passwort gesetzt. Sag es dem Spieler.','New password set. Tell the player.'));if(action==='delete') toast(tt('Konto gelöscht.','Account deleted.'));}
  catch(x){const m=String(x.message||'');admAccErr=lbMissing(x)?tt('Konten sind noch nicht eingerichtet (docs/accounts-v4.sql).','Accounts aren’t set up yet (docs/accounts-v4.sql).'):/invalid password/.test(m)?tt('Das Passwort braucht 6–72 Zeichen.','The password needs 6–72 characters.'):tt('Hat nicht geklappt: ','Didn’t work: ')+escName(m);}
  admAccArm={k:'',t:0};admAccRender();
}
els.admin.addEventListener('submit',e=>{if(e.target.getAttribute('id')!=='admAccPwF') return;e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());admAccCall('set_password',d.acc,d.pw);});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-acca]');if(b){const [a,id]=b.dataset.acca.split(':');if(admAccArm.k!==b.dataset.acca||Date.now()-admAccArm.t>5000){admAccArm={k:b.dataset.acca,t:Date.now()};admAccRender();return;}admAccCall('delete',id);return;}
  if(e.target.closest('#admSeg [data-ap="online"]')||e.target.closest('[data-ona="list"]')) setTimeout(()=>{if(admPass) admAccCall('list');},50);
});
