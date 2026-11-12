/* ======================= V64: Ein Name für alles, Verwarnungen ======================= */
var v64Ready=false,lbTokOk=true;
/* Graue Platzhalter-Zeilen statt „Lädt …“ (damit nichts springt, wenn die Daten kommen) */
function skelRows(n){let h='<div class="skel" aria-busy="true" aria-label="'+tt('Lädt …','Loading …')+'">';for(let i=0;i<(n||3);i++) h+='<div class="skrow"><i></i><b style="width:'+(45+((i*37)%40))+'%"></b></div>';return h+'</div>';}
/* Der Benutzername ist der Name überall (Bestenliste, Chat, Clubs, Geschenke). Der Bäckerei-Name ist nur Deko im eigenen Spiel. */
function lbMyName(){return (v64Ready&&accMe&&accMe.username)||S.name||'';}
/* Antworten des Servers zur Bestenliste ohne Konto */
function lbAccErr(x){
  const m=String(x&&x.message||'');
  if(/account needed/.test(m)){S.lb.on=0;save();return true;}
  if(/another spot/.test(m)){if(v46Ready&&accTok) lbAccSync(true);return true;}
  return false;
}
function lbGuestBox(){
  return '<div class="row"><span><b>'+tt('Mit Konto mitmachen','Join with an account')+'</b><span class="sub" style="display:block">'
    +tt('Die Bestenliste ist für Spieler mit Konto. Erstell dir gratis eines – dann erscheinst du dort mit deinem Benutzernamen.','The leaderboard is for players with an account. Create a free one – then you show up there under your username.')
    +'</span></span><button type="button" class="btn primary" data-lb="acc">'+tt('Konto erstellen','Create account')+'</button></div>';
}
function lbAccGo(){
  closeLb();
  if($id('setOv').hidden) $id('setBtn').click();
  const sp=document.querySelector('#setSeg [data-sp=save]');if(sp) sp.click();
  accMode='signup';accMsg='';accRender();
  setTimeout(()=>{const u=document.querySelector('#accF [name=user]');if(u) u.focus();},120);
}
$id('lbOv').addEventListener('click',e=>{if(e.target.closest('[data-lb="acc"]')) lbAccGo();});

/* Benutzernamen ändern (alle 30 Tage, nach einer erzwungenen Umbenennung sofort) */
let accNI=null,accNIt=0,accNIfor='',accNIbusy=false,accNIok=true;
async function accNameLoad(){
  if(!accTok||!accMe||accNIbusy||!accNIok) return;
  accNIbusy=true;
  try{accNI=await lbApi('rpc/acc_name_info',{p_token:accTok});accNIt=Date.now();accNIfor=accMe.username;}
  catch(x){if(lbMissing(x)) accNIok=false;}
  accNIbusy=false;accRender();
}
function accNameHtml(){
  if(!accTok||!accMe||!accNIok) return '';
  if(accNIfor!==accMe.username||Date.now()-accNIt>120000) setTimeout(accNameLoad,0);
  const I=accNI;let st='';
  if(I){
    if(I.free) st=tt('Du darfst jetzt sofort einen neuen Namen wählen.','You may choose a new name right now.');
    else if(I.next_at&&Date.parse(I.next_at)>Date.now()) st=tt('Nächste Änderung ab ','Next change from ')+new Date(I.next_at).toLocaleDateString(LOC[LANG],{day:'numeric',month:'long'})+'.';
    else st=tt('Du kannst deinen Namen alle 30 Tage ändern.','You can change your name every 30 days.');
  }
  return '<details class="fold accfold" data-sec="name"><summary>✏️ '+tt('Benutzernamen ändern','Change username')+'</summary>'
    +'<p class="small">'+tt('Dein Benutzername ist dein Name überall: in der Bestenliste, im Chat, in Clubs und bei Geschenken. ','Your username is your name everywhere: on the leaderboard, in chat, in clubs and for gifts. ')+st+'</p>'
    +'<form class="coderow" id="accRenF" novalidate><input class="namein" name="nu" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="'+tt('Neuer Benutzername','New username')+'" aria-label="'+tt('Neuer Benutzername','New username')+'"><button type="submit" class="btn sm">'+tt('Ändern','Change')+'</button></form>'
    +(I&&I.old&&I.old.length?'<p class="small" style="margin-top:6px">'+tt('Frühere Namen: ','Earlier names: ')+I.old.map(n=>escName(n)).join(', ')+'</p>':'')+'</details>';
}
$id('accBox').addEventListener('submit',async e=>{
  const f=e.target;if(f.getAttribute('id')!=='accRenF') return;
  e.preventDefault();
  const nu=String(new FormData(f).get('nu')||'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(nu)){accMsg=tt('Benutzername: 3–16 Buchstaben, Zahlen oder _.','Username: 3–16 letters, numbers or _.');accMsgOk=false;accRender();return;}
  try{
    const r=await lbApi('rpc/acc_rename',{p_token:accTok,p_new:nu});
    accNI=r;accNIt=Date.now();accMe.username=r.username;accNIfor=r.username;f.reset();if(v67Ready) xfSet('rename');
    accMsg=tt('Dein Name ist jetzt ','Your name is now ')+escName(r.username)+'.';accMsgOk=true;toast(accMsg,true);
    lbLast=0;if(v61Ready) lbCatData={};
  }catch(x){
    const m=String(x&&x.message||'');accMsgOk=false;
    accMsg=/rename wait/.test(m)?tt('Du kannst deinen Namen nur alle 30 Tage ändern.','You can only change your name every 30 days.')
      :/username taken/.test(m)?tt('Diesen Namen gibt es schon (oder er wurde vor Kurzem abgegeben).','That name is taken (or was given up recently).')
      :/blocked word/.test(m)?tt('Dieser Name ist nicht erlaubt.','That name isn’t allowed.')
      :/same name/.test(m)?tt('Das ist schon dein Name.','That’s already your name.')
      :/too many/.test(m)?tt('Zu viele Versuche. Versuch es morgen nochmal.','Too many tries. Try again tomorrow.')
      :lbMissing(x)?tt('Das kann der Server noch nicht.','The server can’t do this yet.'):tt('Hat nicht geklappt.','Didn’t work.');
  }
  accRender();
});

/* Verwarnungen und erzwungene Umbenennungen: einmal anzeigen */
let accNtOk=true,accNtBusy=false;
const STRIKE_TXT=[
  ['Das ist eine Verwarnung. Beim nächsten Mal wird dein Konto 24 Stunden gesperrt.','This is a warning. Next time your account is banned for 24 hours.'],
  ['Dein Konto ist 24 Stunden gesperrt. Beim nächsten Mal sind es 7 Tage.','Your account is banned for 24 hours. Next time it is 7 days.'],
  ['Dein Konto ist 7 Tage gesperrt. Beim nächsten Mal ist es für immer.','Your account is banned for 7 days. Next time it is forever.'],
  ['Dein Konto ist für immer gesperrt.','Your account is banned forever.']];
async function accNoticeCheck(){
  if(!accTok||!accMe||!accNtOk||accNtBusy||!lbOn()) return;
  accNtBusy=true;let r=null;
  try{r=await lbApi('rpc/acc_notices',{p_token:accTok});}catch(x){if(lbMissing(x)) accNtOk=false;}
  accNtBusy=false;
  if(!r) return;
  if(r.username&&accMe&&r.username!==accMe.username){accMe.username=r.username;accRender();}
  const n=(r.notices||[]).slice(-1)[0];if(!n) return;
  if(n.kind==='rename') lbShowMsg(tt('Dein Name wurde geändert','Your name was changed'),'<p>'+tt('Dein neuer Benutzername ist ','Your new username is ')+'<b>'+escName(r.username||'')+'</b>.</p>'
    +(n.reason?'<p class="small">'+tt('Grund: ','Reason: ')+escName(n.reason)+'</p>':'')+'<p class="small">'+tt('Du kannst dir jetzt sofort einen neuen Namen aussuchen: Einstellungen → Speichern → Benutzernamen ändern. Anmelden geht 90 Tage lang auch noch mit dem alten Namen.','You can pick a new name right away: Settings → Saving → Change username. Signing in also works with the old name for 90 days.')+'</p>','✏️');
  else lbShowMsg(tt('Verwarnung','Warning'),'<p><b>'+escName(n.reason||'')+'</b></p><p class="small">'+tt('Verwarnung ','Strike ')+Math.min(4,n.strike||1)+tt(' von 4. ',' of 4. ')+tx(STRIKE_TXT[Math.min(4,n.strike||1)-1])+'</p><p class="small">'+tt('Verwarnungen zählen 180 Tage lang.','Strikes count for 180 days.')+'</p>','⚠️');
}
setInterval(accNoticeCheck,120000);setTimeout(accNoticeCheck,6000);

v64Ready=true;
