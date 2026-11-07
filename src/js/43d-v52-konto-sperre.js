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
  const b=banParse(m);
  if(accTok){accUnset();accMsg=banTxt(b);accMsgOk=false;accRender();}
  clubData=null;clubRender();
  if(banShown) return;banShown=true;
  const ov=document.createElement('div');ov.className='overlay';ov.id='banOv';
  ov.innerHTML='<div class="dlg namedlg" role="alertdialog" aria-modal="true" aria-labelledby="banT"><div class="mbig" aria-hidden="true">⛔</div><h2 id="banT">'+tt('Konto gesperrt','Account banned')+'</h2><p>'+banTxt(b)+'</p><p class="small">'+tt('Online-Funktionen wie Konto, Clubs, Geschenke und Bestenliste sind gesperrt. Dein Spiel auf diesem Gerät bleibt.','Online features like your account, clubs, gifts and the leaderboard are blocked. Your game on this device stays.')+'</p><div class="btns" style="justify-content:center"><button type="button" class="btn primary" id="banOk">OK</button></div></div>';
  document.body.appendChild(ov);const ok=ov.querySelector('#banOk');ok.focus();
  ok.addEventListener('click',()=>ov.remove());
}
