/* ======================= V69: Der Browser soll den Spielstand behalten ======================= */
/* Ohne „dauerhaften Speicher“ darf der Browser die Daten einer Seite löschen, wenn Platz fehlt oder sie länger
   nicht besucht wurde (Safari nach etwa einer Woche, auch im itch.io-Rahmen). navigator.storage.persist() bittet darum,
   sie zu behalten. Chrome, Edge und Safari entscheiden still; Firefox fragt nach – dort nur auf Knopfdruck. */
var v69Ready=false;
let persOk=null,persBusy=false;
const PERS_KEY='keksfabrik-persist';
const persCan=()=>!!(navigator.storage&&navigator.storage.persist&&navigator.storage.persisted);
const persAsks=()=>/Firefox\//.test(navigator.userAgent||'');   /* Firefox zeigt eine Frage */
async function persCheck(){
  if(!persCan()) return;
  try{persOk=!!(await navigator.storage.persisted());}catch(x){}
  persLine();
}
async function persAsk(){
  if(!persCan()||persBusy) return persOk;
  persBusy=true;
  try{persOk=!!(await navigator.storage.persist());}catch(x){persOk=false;}
  persBusy=false;
  lsSet(PERS_KEY,JSON.stringify({t:Date.now(),ok:persOk?1:0}));
  if(typeof kfTrackStep==='function') kfTrackStep(persOk?'keep':'nokeep');
  persLine();
  return persOk;
}
/* Automatisch fragen, sobald es etwas zu verlieren gibt – höchstens alle 7 Tage, nie in Firefox */
function persAuto(){
  if(!persCan()||persOk||persAsks()) return;
  if(!(S.tut.i>=3||S.all>=5000)) return;
  let st={};try{st=JSON.parse(lsGet(PERS_KEY)||'{}')||{};}catch(x){}
  if(Date.now()-(st.t||0)<7*86400e3) return;
  persAsk();
}
/* Zeile unter „Jetzt speichern“ */
const persEl=document.createElement('p');
persEl.className='small persline';persEl.id='persLine';persEl.hidden=true;
{const sb=$id('saveBtn');if(sb&&sb.parentElement) sb.parentElement.insertAdjacentElement('afterend',persEl);}
persEl.addEventListener('click',async e=>{
  if(!e.target.closest('[data-pers]')) return;
  const ok=await persAsk();
  toast(ok?tt('Dein Browser behält diesen Spielstand jetzt.','Your browser now keeps this save.'):tt('Der Browser hat abgelehnt. Ein Konto oder eine Spielstand-Datei schützt deine Bäckerei trotzdem.','The browser said no. An account or a save file still keeps your bakery safe.'),!!ok);
});
function persLine(){
  if(!persCan()){persEl.hidden=true;return;}
  const h=persOk
    ?'🛡️ '+tt('Dein Browser behält diesen Spielstand (dauerhafter Speicher ist an).','Your browser keeps this save (persistent storage is on).')
    :'🛡️ '+tt('Dein Browser darf diesen Spielstand löschen, wenn Platz fehlt oder du länger nicht spielst.','Your browser may delete this save when space runs low or you don’t play for a while.')+' <button type="button" class="linkbtn" data-pers="1">'+tt('Behalten lassen','Ask it to keep it')+'</button>';
  if(persEl._h!==h){persEl._h=h;persEl.innerHTML=h;}
  persEl.hidden=false;
}
persCheck().then(()=>setTimeout(persAuto,3000));
setInterval(()=>{persAuto();if(!$id('setOv').hidden) persLine();},30000);
$id('setBtn').addEventListener('click',()=>setTimeout(persLine,0));
v69Ready=true;
