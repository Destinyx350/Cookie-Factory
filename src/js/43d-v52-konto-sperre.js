/* ======================= V52: Gesperrte Konten ======================= */
/* Der Server meldet eine Sperre als 'banned: {"until":…,"reason":…}'. Dann zeigen wir den Grund und melden das Konto ab. */
let banShown=false;
function banParse(m){try{const j=/\{[\s\S]*\}/.exec(String(m));return j?JSON.parse(j[0])||{}:{};}catch(x){return {};}}
function banTxt(b){
  const until=b&&b.until?new Date(b.until).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  return (until?tt('Dein Konto ist gesperrt bis ','Your account is banned until ')+until+'.':tt('Dein Konto ist dauerhaft gesperrt.','Your account is banned permanently.'))
    +(b&&b.reason?' '+tt('Grund: ','Reason: ')+escName(String(b.reason)):'');
}
function banSeen(m){
  const b=banParse(m),user=accMe&&accMe.username||'';
  if(accTok){accUnset();accMsg=banTxt(b);accMsgOk=false;accRender();}
  clubData=null;clubRender();
  if(banShown) return;banShown=true;
  banShow(b,user);
}
/* V53: Der Hinweis enthält jetzt einen Einspruch. Gesperrte Spieler können sich nicht anmelden,
   deshalb bestätigen sie den Einspruch mit Benutzername und Passwort. */
function banAppealHtml(b){
  const a=b&&b.appeal;
  if(a&&a.status==='open') return '<p class="banap">⏳ '+tt('Dein Einspruch wird geprüft. Versuch später nochmal, dich anzumelden, um die Antwort zu sehen.','Your appeal is being reviewed. Try signing in again later to see the answer.')+'</p>';
  let h=a&&a.status==='rejected'?'<p class="banap">❌ '+tt('Dein Einspruch wurde abgelehnt.','Your appeal was rejected.')+(a.answer?' „'+escName(a.answer)+'“':'')+'</p>':'';
  return h+'<details class="fold banfold"><summary>'+tt('Einspruch einlegen','Appeal this ban')+'</summary><form class="accform" id="banApF" novalidate>'
    +'<input class="namein" name="user" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="'+tt('Benutzername','Username')+'" value="'+escName(b&&b.username||'')+'">'
    +'<input class="namein" name="pass" type="password" maxlength="72" autocomplete="current-password" placeholder="'+tt('Passwort','Password')+'">'
    +'<textarea class="namein" name="body" maxlength="500" rows="3" placeholder="'+tt('Warum sollte die Sperre aufgehoben werden?','Why should the ban be lifted?')+'"></textarea>'
    +'<button type="submit" class="btn primary">'+tt('Einspruch senden','Send appeal')+'</button><p class="nameerr" id="banApErr" aria-live="polite"></p></form>'
    +'<p class="small">'+tt('Ein Einspruch pro Tag. Der Admin liest ihn und antwortet.','One appeal per day. The admin reads it and answers.')+'</p></details>';
}
function banShow(b,user){
  b=Object.assign({},b||{});if(!b.username&&user) b.username=user;
  const old=$id('banOv');if(old) old.remove();
  const ov=document.createElement('div');ov.className='overlay';ov.id='banOv';
  ov.innerHTML='<div class="dlg namedlg" role="alertdialog" aria-modal="true" aria-labelledby="banT"><div class="mbig" aria-hidden="true">⛔</div><h2 id="banT">'+tt('Konto gesperrt','Account banned')+'</h2><p>'+banTxt(b)+'</p><p class="small">'+tt('Online-Funktionen wie Konto, Clubs, Geschenke und Bestenliste sind gesperrt. Dein Spiel auf diesem Gerät bleibt.','Online features like your account, clubs, gifts and the leaderboard are blocked. Your game on this device stays.')+'</p><div id="banAp">'+banAppealHtml(b)+'</div><div class="btns" style="justify-content:center"><button type="button" class="btn primary" id="banOk">OK</button></div></div>';
  document.body.appendChild(ov);const ok=ov.querySelector('#banOk');ok.focus();
  ok.addEventListener('click',()=>ov.remove());
  ov.addEventListener('submit',async e=>{
    e.preventDefault();const f=e.target;if(f.getAttribute('id')!=='banApF') return;
    const d=Object.fromEntries(new FormData(f).entries()),err=$id('banApErr'),body=String(d.body||'').trim();
    if(!body){err.textContent=tt('Schreib kurz, warum.','Write a few words why.');return;}
    const btn=f.querySelector('[type=submit]');btn.disabled=true;err.textContent='';
    try{
      const r=await lbApi('rpc/ban_appeal',{p_user:String(d.user||'').trim(),p_pass:String(d.pass||''),p_body:body});
      $id('banAp').innerHTML=banAppealHtml(Object.assign({},b,{appeal:r}));toast(tt('Einspruch gesendet.','Appeal sent.'));
    }catch(x){
      const m=String(x.message||'');btn.disabled=false;
      err.textContent=/wrong username or password/.test(m)?tt('Benutzername oder Passwort stimmt nicht.','Wrong username or password.'):/too many tries/.test(m)?tt('Zu viele falsche Versuche. Warte 15 Minuten.','Too many wrong tries. Wait 15 minutes.'):/appeal already open/.test(m)?tt('Du hast schon einen offenen Einspruch.','You already have an open appeal.'):/one appeal per day/.test(m)?tt('Nur ein Einspruch pro Tag. Versuch es morgen nochmal.','Only one appeal per day. Try again tomorrow.'):/not banned/.test(m)?tt('Dieses Konto ist nicht (mehr) gesperrt. Melde dich einfach an.','This account isn’t banned (any more). Just sign in.'):lbMissing(x)?tt('Einsprüche gehen erst nach dem nächsten Server-Update.','Appeals work after the next server update.'):tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.');
    }
  });
}
