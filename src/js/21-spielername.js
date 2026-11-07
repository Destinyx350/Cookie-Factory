/* ===== Spielername ===== */
function cleanName(v){return String(v==null?'':v).replace(/[<>\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,20);}
function escName(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);}
function showName(){const e=document.getElementById('plName');if(!e) return;e.textContent=S.name||'';e.hidden=!S.name;}
const nameOv=document.getElementById('nameOv'),nameIn=document.getElementById('nameIn'),nameErr=document.getElementById('nameErr');
let nameCb=null,nameCan=true,nameRet=null;
function askName(o,cb){
  nameCb=cb;nameCan=o.cancel!==false;nameRet=document.activeElement;
  document.getElementById('nameT').textContent=o.title||tt('Wie heißt deine Bäckerei?','Name your bakery');
  document.getElementById('nameP').textContent=o.text||tt('Gib deinem Spielstand einen Namen. Du kannst ihn später in den Einstellungen ändern.','Give your save a name. You can change it later in the settings.');
  document.getElementById('nameOk').textContent=o.ok||tt('Los geht’s','Let’s go');
  const c=document.getElementById('nameCancel');c.textContent=tt('Abbrechen','Cancel');c.hidden=!nameCan;
  nameIn.placeholder=tt('z. B. Omas Backstube','e.g. Grandma’s Bakery');
  nameIn.setAttribute('aria-label',tt('Name des Spielstands','Save name'));
  nameIn.value=o.value||'';nameErr.textContent='';
  nameOv.hidden=false;setTimeout(()=>{nameIn.focus();nameIn.select();},30);
}
function closeName(){nameOv.hidden=true;nameCb=null;if(nameRet&&nameRet.focus&&document.contains(nameRet)) nameRet.focus();}
document.getElementById('nameForm').addEventListener('submit',e=>{
  e.preventDefault();
  const n=cleanName(nameIn.value);
  if(n.length<2){nameErr.textContent=tt('Bitte gib einen Namen mit mindestens 2 Zeichen ein.','Please enter a name with at least 2 characters.');nameIn.focus();return;}
  const cb=nameCb;closeName();if(cb) cb(n);
});
document.getElementById('nameCancel').addEventListener('click',()=>{if(nameCan) closeName();});
nameOv.addEventListener('click',e=>{if(e.target===nameOv&&nameCan) closeName();});
window.addEventListener('keydown',e=>{if(nameOv.hidden) return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(nameCan) closeName();}},true);

document.querySelector('.brandrow').addEventListener('click',()=>{S.sec.title=(S.sec.title||0)+1;});
