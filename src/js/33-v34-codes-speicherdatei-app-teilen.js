/* ======================= V34: Codes, Speicherdatei, App, Teilen ======================= */
const GAME_URL='https://destinyx350.github.io/Cookie-Factory/';
const $id=id=>document.getElementById(id);
/* Codes: Nur gesalzene SHA-256-Hashes stehen im Code, nie die Codes selbst. Siehe CLAUDE.md. */
const CODE_SALT='0f2c9c581037b1cad448aae2';
const CODES=[
  {h:'d828a1ccb337f53e181b56f18d3bce84ee5445113661140f5cca77d3506ddc6f',n:['Startgeschenk','Starter gift'],r:()=>{const g=Math.max(5000,C.kps0*600);addCk(g);return '+'+fmt(g)+' '+tt('Kekse','cookies');}},
  {h:'ed451ef345fa0c7f81011f74c6dd204faf023d83b64f237570d464ca73cce3ca',n:['Zuckerparty','Sugar party'],r:()=>{addBuff('b_sugar',600);return tt('Produktion ×2 für 10 Minuten','Production ×2 for 10 minutes');}},
  {h:'7e9b508096ac1561ba8361fc029b31d89bb558232d632b011d88b7c2dd920ee6',n:['Edelstein-Geschenk','Gem gift'],r:()=>{S.w.mat.gem+=10;return '+10 '+matName('gem');}},
  {h:'9e982c2e32dcdde135e22e2c2af3803b40c04eb18b1afe3366b0c380d72b99a8',until:Date.parse('2027-01-07T00:00:00'),n:['Winter-Überraschung','Winter surprise'],r:()=>{S.w.mat.gem+=25;const g=Math.max(50000,C.kps0*3600);addCk(g);return '+25 '+matName('gem')+' · +'+fmt(g)+' '+tt('Kekse','cookies');}}
];
let codeFails=0,codeWait=0;
async function codeHash(c){
  const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(CODE_SALT+':'+c));
  return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');
}
$id('codeForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const inp=$id('codeIn'),msg=$id('codeMsg'),bad=t=>{msg.className='nameerr';msg.textContent=t;};
  const c=inp.value.toUpperCase().replace(/[^A-Z0-9ÄÖÜ]/g,'');
  if(!c){bad(tt('Gib zuerst einen Code ein.','Enter a code first.'));inp.focus();return;}
  const wait=Math.ceil((codeWait-Date.now())/1000);
  if(wait>0){bad(tt('Zu viele falsche Codes. Warte noch '+wait+' s.','Too many wrong codes. Wait '+wait+' s.'));return;}
  if(!window.crypto||!crypto.subtle){bad(tt('Codes gehen nur auf einer sicheren Seite (https).','Codes only work on a secure page (https).'));return;}
  let h='';try{h=await codeHash(c);}catch(x){}
  const k=CODES.find(x=>x.h===h);
  if(!k&&lbOn()&&navigator.onLine!==false){
    try{const g=await kfRedeem(c);codeFails=0;msg.className='nameerr ok';msg.textContent=tt('Eingelöst: ','Redeemed: ')+g.label+' · '+g.txt;inp.value='';snd('claim');toast(g.label+': '+g.txt,true);return;}
    catch(x){const m=String(x&&x.message||'');
      if(/already used/.test(m)){bad(tt('Diesen Code hast du schon eingelöst.','You already redeemed this code.'));return;}
      if(/expired/.test(m)){bad(tt('Dieser Code ist abgelaufen.','This code has expired.'));return;}
      if(/used up/.test(m)){bad(tt('Dieser Code wurde schon zu oft eingelöst.','This code has been used up.'));return;}
      if(!/unknown code/.test(m)&&!lbMissing(x)){bad(tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.'));return;}}
  }
  if(!k){codeFails++;if(codeFails>=8){codeFails=0;codeWait=Date.now()+60000;}bad(tt('Diesen Code gibt es nicht. Prüfe die Schreibweise.','That code doesn’t exist. Check the spelling.'));return;}
  codeFails=0;
  const id=h.slice(0,12);
  if(S.codes[id]){bad(tt('Diesen Code hast du in diesem Spielstand schon eingelöst.','You already redeemed this code in this save.'));return;}
  if(k.until&&Date.now()>k.until){bad(tt('Dieser Code ist abgelaufen.','This code has expired.'));return;}
  const got=k.r();S.codes[id]=Date.now();recalc();save();render();
  msg.className='nameerr ok';msg.textContent=tt('Eingelöst: ','Redeemed: ')+tx(k.n)+' · '+got;
  inp.value='';snd('claim');toast(tx(k.n)+': '+got,true);
});

/* Spielstand als Datei */
function saveFileName(){
  const d=new Date(),p=n=>String(n).padStart(2,'0');
  const nm=(S.name||'Keksfabrik').normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'Keksfabrik';
  return nm+'-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'.keks';
}
$id('fileDl').addEventListener('click',()=>{
  save();
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([enc(sealJSON(S))],{type:'text/plain'}));
  a.download=saveFileName();document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
  toast(tt('Spielstand gespeichert: ','Save downloaded: ')+a.download);
});
let fileArm=0;
$id('fileUp').addEventListener('click',()=>{
  const b=$id('fileUp');
  if(S.opt.ask!==false&&!fileArm){
    b.classList.add('armed');b.textContent=tt('Ersetzt dein Spiel! Nochmal klicken','Replaces your game! Click again');
    fileArm=setTimeout(()=>{fileArm=0;b.classList.remove('armed');updV34Txt();},5000);return;
  }
  clearTimeout(fileArm);fileArm=0;b.classList.remove('armed');updV34Txt();
  $id('fileIn').value='';$id('fileIn').click();
});
$id('fileIn').addEventListener('change',async e=>{
  const f=e.target.files&&e.target.files[0];if(!f) return;
  if(f.size>8e6){toast(tt('Diese Datei ist zu groß für einen Spielstand.','This file is too big to be a save.'));return;}
  let o=null;
  try{const t=(await f.text()).trim();try{o=JSON.parse(dec(t));}catch(x){o=JSON.parse(t);}}catch(x){o=null;}
  if(!o||typeof o!=='object'||typeof o.cookies!=='number'){toast(tt('Das ist keine Keksfabrik-Datei.','That isn’t a Cookie Factory save file.'));return;}
  try{pushBackup();}catch(x){}
  const s=sanitize(o);if(!s.name) s.name=S.name;
  if(s.tamp) setTimeout(tampWarn,400);
  S=s;S.t=Date.now();LANG=S.opt.lang;els.fx.checked=S.opt.fx;
  applyLang();rebuildAll();save();slotSig='';
  toast(tt('Spielstand geladen','Save loaded')+(S.name?': '+S.name:'')+'. '+tt('Dein altes Spiel liegt unter Backups.','Your old game is under Backups.'),true);
});

/* Als App installieren */
let installEvt=null;
const isStandalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;updApp();});
window.addEventListener('appinstalled',()=>{installEvt=null;updApp();toast(tt('Die Keksfabrik ist jetzt als App installiert!','Cookie Factory is now installed as an app!'),true);});
async function doInstall(){
  if(!installEvt){openSettings();showSetPane('game');return;}
  installEvt.prompt();try{await installEvt.userChoice;}catch(x){}
  installEvt=null;updApp();
}
function updApp(){
  $id('installBtn').hidden=!installEvt||isStandalone();
  const box=$id('appState');if(!box) return;
  let h;
  if(isStandalone()) h='<p class="nameerr ok">'+tt('Du spielst gerade in der App. 👍','You’re playing in the app right now. 👍')+'</p>';
  else if(installEvt) h='<div class="appstate"><button type="button" class="btn primary" id="appInstall">'+tt('App installieren','Install app')+'</button></div>';
  else if(isIOS) h='<div class="apphint">'+tt('Auf dem iPhone oder iPad: Tippe in Safari unten auf <b>Teilen</b> (Quadrat mit Pfeil) und dann auf <b>Zum Home-Bildschirm</b>.','On iPhone or iPad: In Safari, tap <b>Share</b> (the square with an arrow), then <b>Add to Home Screen</b>.')+'</div>';
  else h='<div class="apphint">'+tt('Öffne das Menü deines Browsers und wähle <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>.','Open your browser’s menu and choose <b>Install app</b> or <b>Add to Home screen</b>.')+'</div>';
  box.innerHTML=h;
}
$id('installBtn').addEventListener('click',doInstall);
$id('appState').addEventListener('click',e=>{if(e.target.closest('#appInstall')) doInstall();});
if(!window.KF_PORTAL&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});
}

/* Teilen */
function shareText(){
  const who=S.name?tt('Meine Bäckerei „'+S.name+'“','My bakery “'+S.name+'”'):tt('Meine Keksfabrik','My cookie factory');
  return who+tt(' hat schon '+fmt(S.all)+' Kekse gebacken! 🍪 Schaffst du mehr?',' has baked '+fmt(S.all)+' cookies! 🍪 Can you beat that?')+(v48Ready&&accMe&&accMe.username?tt(' Spiel über meinen Link, dann bekommen wir beide einen Bonus.',' Play with my link and we both get a bonus.'):'');
}
async function shareGame(){
  const text=shareText();
  if(navigator.share){
    try{await navigator.share({title:tt('Keksfabrik','Cookie Factory'),text,url:v48Ready?shareURL():GAME_URL});return;}
    catch(x){if(x&&x.name==='AbortError') return;}
  }
  const su=v48Ready?shareURL():GAME_URL;
  try{await navigator.clipboard.writeText(text+'\n'+su);toast(tt('Kopiert! Füge es in einen Chat ein.','Copied! Paste it into a chat.'),true);return;}catch(x){}
  $id('shareBox').value=text+'\n'+su;$id('shareOv').hidden=false;$id('shareBox').focus();$id('shareBox').select();
}
$id('shareBtn').addEventListener('click',shareGame);
$id('shareCopy').addEventListener('click',async()=>{
  const b=$id('shareBox');b.focus();b.select();
  try{await navigator.clipboard.writeText(b.value);}catch(x){try{document.execCommand('copy');}catch(y){}}
  toast(tt('Kopiert!','Copied!'));
});
$id('shareClose').addEventListener('click',()=>{$id('shareOv').hidden=true;$id('shareBtn').focus();});
$id('shareOv').addEventListener('click',e=>{if(e.target===$id('shareOv')){$id('shareOv').hidden=true;}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$id('shareOv').hidden){e.preventDefault();e.stopImmediatePropagation();$id('shareOv').hidden=true;}},true);

function updV34Txt(){
  const set=(id,t)=>{const e=$id(id);if(e) e.textContent=t;};
  set('codeT',tt('Codes','Codes'));
  set('codeP',tt('Hast du einen geheimen Code? Gib ihn hier ein und hol dir deine Belohnung. Jeder Code geht einmal pro Spielstand.','Got a secret code? Enter it here to get your reward. Each code works once per save.'));
  set('codeBtn',tt('Einlösen','Redeem'));
  $id('codeIn').placeholder=tt('Code eingeben','Enter code');$id('codeIn').setAttribute('aria-label',tt('Code','Code'));
  set('fileT',tt('Spielstand als Datei','Save file'));
  set('fileP',tt('Lade deinen Spielstand als Datei herunter und lade ihn auf einem anderen Gerät wieder hoch. Beim Laden wird dein aktuelles Spiel ersetzt und vorher als Backup gesichert.','Download your save as a file and load it on another device. Loading replaces your current game, which is kept as a backup first.'));
  set('fileDl',tt('Herunterladen','Download'));
  const sr=$id('sealRow');if(sr){sr.className='sealrow '+(S.tamp?'bad':'ok');sr.textContent=S.tamp?tt('⚠ Dieser Spielstand wurde außerhalb des Spiels verändert.','⚠ This save was changed outside the game.'):tt('✓ Spielstand-Siegel intakt','✓ Save seal intact');}
  if(!fileArm) set('fileUp',tt('Datei laden','Load file'));
  set('appT',tt('Als App spielen','Play as an app'));
  set('appP',tt('Installiere die Keksfabrik auf deinem Handy oder Computer. Sie öffnet sich dann im Vollbild mit eigenem Symbol und läuft auch ohne Internet.','Install Cookie Factory on your phone or computer. It then opens full-screen with its own icon and works without internet.'));
  $id('shareBtn').setAttribute('aria-label',tt('Teilen','Share'));$id('shareBtn').title=tt('Teilen','Share');
  $id('installBtn').setAttribute('aria-label',tt('App installieren','Install app'));$id('installBtn').title=tt('App installieren','Install app');
  set('shareT',tt('Teilen','Share'));
  set('shareP',tt('Kopiere diesen Text und schick ihn deinen Freunden.','Copy this text and send it to your friends.'));
  set('shareCopy',tt('Kopieren','Copy'));set('shareClose',tt('Schließen','Close'));
  updApp();renderLb();updDev();updShopNav();updV42Txt();accRender();if(v44Ready) clubRender();if(typeof updV47Txt==='function'&&$id('saveMoreT')) updV47Txt();if(v48Ready) refNote();if(v49Ready){pushSynced=false;pushState();}if(v54Ready) updV54Txt();
}
