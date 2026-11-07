/* ======================= V38: Neue Version sofort melden ======================= */
let updShown=0,updLast=0;
async function checkUpdate(){
  if(window.KF_PORTAL) return;
  if(updShown||navigator.onLine===false||Date.now()-updLast<60000) return;
  updLast=Date.now();
  try{
    const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok) return;
    const v=Number((await r.json()).v);if(v>NEWS_VER) showUpdate(v);
  }catch(e){}
}
function showUpdate(v){
  updShown=v;const b=$id('updBar');
  b.innerHTML='<span>🍪 '+tt('Version '+v+' ist da!','Version '+v+' is ready!')+'</span><button type="button" class="btn sm primary" id="updGo">'+tt('Jetzt aktualisieren','Update now')+'</button>';
  b.hidden=false;
}
$id('updBar').addEventListener('click',e=>{if(e.target.closest('#updGo')){save();location.reload();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden) checkUpdate();});
window.addEventListener('online',checkUpdate);
setInterval(checkUpdate,5*60000);
setTimeout(checkUpdate,15000);

/* --- Tasten für neue Fenster --- */
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(!helpOv.hidden){e.preventDefault();closeHelp();}
  else if(!introOv.hidden){e.preventDefault();closeIntro(false);}
  else if(!startOv.hidden){e.preventDefault();closeStart();}
  else if(!curTip.hidden){curTip.hidden=true;}
});
