/* ======================= V58: Wiederherstellungs-Code, Geräte-Liste, Live-Club-Chat ======================= */
var v58Ready=false;
let recSt=null,recFor='',recBusy=false,recArm=0,recCodeNow='',devList=null,devErr='',devBusy=false;
const recFmt=c=>String(c||'').replace(/(.{4})(?!$)/g,'$1-');

/* ---------- Wiederherstellungs-Code ---------- */
async function recLoad(){
  if(!accTok) return;
  try{recSt=await lbApi('rpc/acc_recovery',{p_token:accTok,p_action:'status'});}catch(x){recSt=lbMissing(x)?{missing:1}:{err:1};}
  accRender();
}
async function recMake(mode){
  if(!accTok||recBusy) return;
  recBusy=true;accRender();
  try{const r=await lbApi('rpc/acc_recovery',{p_token:accTok,p_action:'new'});recSt={on:true,at:r.at};recBusy=false;recShow(r.code,mode);}
  catch(x){recBusy=false;if(mode!==true&&mode!=='recovered'){accMsg=lbMissing(x)?tt('Das kann der Server noch nicht.','The server can’t do this yet.'):/too many/.test(String(x.message))?tt('Zu viele neue Codes. Versuch es später nochmal.','Too many new codes. Try again later.'):tt('Hat nicht geklappt.','Didn’t work.');accMsgOk=false;}}
  recArm=0;accRender();
}
function recShow(code,mode){
  recCodeNow=recFmt(code);
  const intro=mode===true?tt('Dein Konto ist fertig! Hier ist dein Wiederherstellungs-Code:','Your account is ready! Here is your recovery code:')
    :mode==='recovered'?tt('Neues Passwort gesetzt. Dein alter Code ist verbraucht – hier ist ein neuer:','New password set. Your old code is used up – here is a new one:')
    :tt('Dein neuer Wiederherstellungs-Code (der alte geht nicht mehr):','Your new recovery code (the old one no longer works):');
  accAsk('🔑 '+tt('Wiederherstellungs-Code','Recovery code'),
    '<p>'+intro+'</p><p class="reccode" id="recCode">'+recCodeNow+'</p>'
    +'<div class="btns c"><button type="button" class="btn sm" data-recx="copy">'+tt('Kopieren','Copy')+'</button><button type="button" class="btn sm" data-recx="file">'+tt('Als Datei speichern','Save as file')+'</button></div>'
    +'<p class="small">'+tt('Mit diesem Code und deinem Benutzernamen setzt du ein neues Passwort, falls du es vergisst („Passwort vergessen?“ beim Anmelden). Er geht einmal. Bewahre ihn sicher auf – wir können ihn dir nicht noch einmal zeigen.','With this code and your username you can set a new password if you forget yours (“Forgot your password?” when signing in). It works once. Keep it safe – we can’t show it to you again.')+'</p>',
    tt('Ich habe ihn gespeichert','I saved it'),'',()=>{$id('accNo').hidden=false;},()=>{$id('accNo').hidden=false;});
  $id('accNo').hidden=true;
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-recx]');if(!b||!recCodeNow) return;
  if(b.dataset.recx==='copy'){try{await navigator.clipboard.writeText(recCodeNow);toast(tt('Code kopiert.','Code copied.'));}catch(x){const r=document.createRange(),el=$id('recCode');if(el){r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);}toast(tt('Markiere den Code und kopiere ihn.','Select the code and copy it.'));}return;}
  const who=(accMe&&accMe.username)||'';
  const txt='Cookie Factory · Keksfabrik\n'+tt('Wiederherstellungs-Code','Recovery code')+'\n\n'+tt('Benutzername: ','Username: ')+who+'\n'+tt('Code: ','Code: ')+recCodeNow+'\n'+tt('Erstellt: ','Created: ')+new Date().toLocaleString(LOC[LANG])+'\n\nhttps://destinyx350.github.io/Cookie-Factory/\n';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='cookie-factory-recovery-'+who+'.txt';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
});

/* ---------- Geräte ---------- */
function devLabel(){
  const u=navigator.userAgent||'',br=/Edg\//.test(u)?'Edge':/SamsungBrowser/.test(u)?'Samsung Internet':/OPR\//.test(u)?'Opera':/Firefox\//.test(u)?'Firefox':/Chrome\//.test(u)?'Chrome':/Safari\//.test(u)?'Safari':tt('Browser','Browser');
  const os=/Android/.test(u)?'Android':/iPhone|iPad|iPod/.test(u)?'iOS':/Windows/.test(u)?'Windows':/Mac OS X/.test(u)?'macOS':/CrOS/.test(u)?'ChromeOS':/Linux/.test(u)?'Linux':'';
  const dv={phone:tt('Handy','Phone'),tablet:'Tablet',desktop:tt('Computer','Computer')}[document.documentElement.dataset.device]||'';
  const app=window.KF_PORTAL?tt('Portal','Portal'):(matchMedia('(display-mode: standalone)').matches||navigator.standalone)?'App':'';
  return [br,os,dv,app].filter(Boolean).join(' · ');
}
async function devName(){if(accTok) try{await lbApi('rpc/acc_devices',{p_token:accTok,p_action:'name',p_data:{label:devLabel()}});}catch(x){}}
async function devDo(action,data){
  if(!accTok||devBusy) return;
  devBusy=true;
  try{devList=await lbApi('rpc/acc_devices',{p_token:accTok,p_action:action,p_data:data||null})||[];devErr='';if(action==='remove') toast(tt('Gerät abgemeldet.','Device signed out.'));}
  catch(x){devErr=lbMissing(x)?tt('Das kann der Server noch nicht.','The server can’t do this yet.'):tt('Hat nicht geklappt.','Didn’t work.');}
  devBusy=false;accRender();
}
function accSecHtml(){
  if(accMe&&recFor!==accMe.username){recFor=accMe.username;recSt=null;devList=null;setTimeout(recLoad,0);}
  const R=recSt,dt=v=>new Date(v).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  let h='<details class="fold accfold" data-sec="rec"><summary>🔑 '+tt('Wiederherstellungs-Code','Recovery code')+(R&&R.on===false?' <span class="recwarn">'+tt('fehlt','missing')+'</span>':'')+'</summary>';
  if(!R) h+='<p class="small">'+tt('Lädt …','Loading …')+'</p>';
  else if(R.missing) h+='<p class="small">'+tt('Das kann der Server noch nicht.','The server can’t do this yet.')+'</p>';
  else{
    h+='<p class="small">'+(R.on?'✅ '+tt('Eingerichtet am ','Set up on ')+dt(R.at)+'. '+tt('Verloren? Mach einen neuen – der alte geht dann nicht mehr.','Lost it? Make a new one – the old one stops working.')
      :'⚠️ '+tt('Noch nicht eingerichtet. Ohne Code kannst du ein vergessenes Passwort nicht selbst zurücksetzen.','Not set up yet. Without a code you can’t reset a forgotten password yourself.'))+'</p>';
    const armed=R.on&&Date.now()-recArm<5000;
    h+='<div class="btns"><button type="button" class="btn sm'+(R.on?(armed?' armed':''):' primary')+'" data-rec="new"'+(recBusy?' disabled':'')+'>'+(recBusy?tt('Moment …','One moment …'):R.on?(armed?tt('Sicher? Der alte Code geht dann nicht mehr','Sure? The old code stops working'):tt('Neuen Code erstellen','Make a new code')):tt('Code erstellen','Create code'))+'</button></div>';
  }
  h+='</details><details class="fold accfold" data-sec="dev"><summary>📱 '+tt('Angemeldete Geräte','Signed-in devices')+(devList?' ('+devList.length+')':'')+'</summary>';
  if(!devList) h+='<p class="small">'+(devErr||tt('Lädt …','Loading …'))+'</p>';
  else h+='<div class="devlist">'+devList.map(d=>'<div class="devrow"><span><b>'+(d.label?escName(d.label):tt('Unbekanntes Gerät','Unknown device'))+(d.current?' <em class="devme">'+tt('dieses Gerät','this device')+'</em>':'')+'</b><small>'+tt('Zuletzt: ','Last used: ')+dt(d.last_used)+' · '+tt('seit ','since ')+dt(d.created_at)+'</small></span>'+(d.current?'':'<button type="button" class="btn sm" data-dev="'+escName(d.id)+'">'+tt('Abmelden','Sign out')+'</button>')+'</div>').join('')+'</div>'+(devErr?'<p class="nameerr">'+devErr+'</p>':'');
  return h+'</details>';
}
function accForgotHtml(){
  return '<details class="fold accfold" id="accForgot"><summary>'+tt('Passwort vergessen?','Forgot your password?')+'</summary>'
    +'<form class="accform" id="accRecF" novalidate><input class="namein" name="ruser" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="'+tt('Benutzername','Username')+'" aria-label="'+tt('Benutzername','Username')+'">'
    +'<input class="namein" name="rcode" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="'+tt('Wiederherstellungs-Code (XXXX-XXXX-XXXX-XXXX)','Recovery code (XXXX-XXXX-XXXX-XXXX)')+'" aria-label="'+tt('Wiederherstellungs-Code','Recovery code')+'">'
    +'<input class="namein" name="rpass" type="password" maxlength="72" autocomplete="new-password" placeholder="'+tt('Neues Passwort (mind. 6 Zeichen)','New password (at least 6 characters)')+'" aria-label="'+tt('Neues Passwort','New password')+'">'
    +'<button type="submit" class="btn primary">'+tt('Neues Passwort setzen','Set new password')+'</button></form>'
    +'<p class="small">'+tt('Keinen Code? Schreib über „Feedback senden“ (Einstellungen → Spiel) mit deinem Benutzernamen – der Betreiber kann helfen.','No code? Write via “Send feedback” (Settings → Game) with your username – the owner can help.')+'</p></details>';
}
$id('accBox').addEventListener('click',e=>{
  const r=e.target.closest('[data-rec]');
  if(r){if(recSt&&recSt.on&&Date.now()-recArm>5000){recArm=Date.now();accRender();return;}recMake(false);return;}
  const d=e.target.closest('[data-dev]');if(d) devDo('remove',{id:d.dataset.dev});
});
$id('accBox').addEventListener('toggle',e=>{const t=e.target;if(t.matches&&t.matches('details[data-sec="dev"]')&&t.open&&!devBusy) devDo('list');},true);
$id('accBox').addEventListener('submit',async e=>{
  const f=e.target;if(f.id!=='accRecF') return;
  e.preventDefault();
  const d=Object.fromEntries(new FormData(f).entries()),user=String(d.ruser||'').trim(),code=String(d.rcode||'').toUpperCase().replace(/[^A-Z2-7]/g,''),pass=d.rpass||'';
  accMsgOk=false;
  if(!/^[A-Za-z0-9_]{3,16}$/.test(user)) accMsg=tt('Bitte gib deinen Benutzernamen ein.','Please enter your username.');
  else if(code.length!==16) accMsg=tt('Der Code hat 16 Zeichen (Buchstaben und Zahlen 2–7).','The code has 16 characters (letters and the numbers 2–7).');
  else if(pass.length<6) accMsg=tt('Das neue Passwort braucht mindestens 6 Zeichen.','The new password needs at least 6 characters.');
  else{
    accMsg='';accBusy=true;accRender();
    try{
      const r=await lbApi('rpc/acc_recover',{p_user:user,p_code:code,p_pass:pass});accBusy=false;
      if(r&&r.error){if(r.error==='banned') banShow(r,user);accMsg=r.error==='banned'?banTxt(r):r.error==='too many tries'?tt('Zu viele falsche Versuche. Warte 15 Minuten.','Too many wrong tries. Wait 15 minutes.'):r.error==='invalid password'?tt('Das neue Passwort braucht 6 bis 72 Zeichen.','The new password needs 6 to 72 characters.'):tt('Benutzername oder Code stimmt nicht.','Wrong username or code.');}
      else{
        await accLoginOk(r);recFor=r.username;recSt={on:false};
        toast(tt('Neues Passwort gesetzt. Andere Geräte wurden abgemeldet.','New password set. Other devices were signed out.'),true);
        setTimeout(()=>{if($id('accAskOv').hidden) recMake('recovered');else{const iv=setInterval(()=>{if($id('accAskOv').hidden){clearInterval(iv);recMake('recovered');}},400);}},500);
      }
    }catch(x){accBusy=false;accMsg=lbMissing(x)?tt('Das kann der Server noch nicht.','The server can’t do this yet.'):tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.');}
  }
  accRender();
});

/* ---------- Live-Club-Chat: der Server meldet „neue Nachricht“, das Spiel holt den Chat sofort ---------- */
const clubRT={ws:null,topic:null,club:null,checked:false,busy:false,on:false,tries:0,ref:0,hb:0,deb:0};
function rtClose(){
  clearInterval(clubRT.hb);clubRT.hb=0;
  if(clubRT.ws){clubRT.ws.onclose=null;clubRT.ws.onmessage=null;try{clubRT.ws.close();}catch(x){}}
  clubRT.ws=null;clubRT.on=false;const o=$id('clubOv');if(o) delete o.dataset.rt;
}
function rtOpen(){
  clubRT.tries++;
  let ws;try{ws=new WebSocket(LB_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(LB_KEY)+'&vsn=1.0.0');}catch(x){return;}
  clubRT.ws=ws;const T='realtime:'+clubRT.topic;
  ws.onopen=()=>{
    ws.send(JSON.stringify({topic:T,event:'phx_join',payload:{config:{broadcast:{self:false,ack:false},presence:{key:''},postgres_changes:[],private:false}},ref:String(++clubRT.ref),join_ref:String(clubRT.ref)}));
    clubRT.hb=setInterval(()=>{if(ws.readyState===1) ws.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(++clubRT.ref)}));},25000);
  };
  ws.onmessage=e=>{
    let m;try{m=JSON.parse(e.data);}catch(x){return;}
    if(m.topic!==T) return;
    if(m.event==='phx_reply'&&m.payload&&m.payload.status==='ok'&&!clubRT.on){clubRT.on=true;clubRT.tries=0;$id('clubOv').dataset.rt='1';}
    else if(m.event==='broadcast'){clearTimeout(clubRT.deb);clubRT.deb=setTimeout(()=>clubLoad(true),250);}
    else if(m.event==='phx_error'||m.event==='phx_close') rtClose();
  };
  ws.onclose=()=>rtClose();
}
setInterval(async()=>{
  const o=$id('clubOv'),want=clubOn()&&clubSigned()&&o&&!o.hidden&&!document.hidden&&clubData&&clubData.club&&featOn('clubs');
  if(!want){if(clubRT.ws) rtClose();return;}
  if(clubRT.club!==clubData.club.id){rtClose();clubRT.club=clubData.club.id;clubRT.topic=null;clubRT.checked=false;clubRT.tries=0;}
  if(clubRT.ws||clubRT.busy||clubRT.tries>=4) return;
  if(!clubRT.checked){
    clubRT.busy=true;
    try{const r=await lbApi('rpc/club_rt',{p_token:accTok});clubRT.topic=r&&r.on?r.topic:null;}catch(x){clubRT.topic=null;}
    clubRT.checked=true;clubRT.busy=false;
  }
  if(clubRT.topic) rtOpen();
},1500);

v58Ready=true;
if(accTok&&accMe) accRender();
