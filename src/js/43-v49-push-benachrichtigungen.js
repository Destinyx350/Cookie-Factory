/* ======================= V49: Push-Benachrichtigungen ======================= */
var v49Ready=false;
function b64u(s){const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0));}
const pushOk=()=>!window.KF_PORTAL&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
var pushOn=null,pushBusy=false,pushMsgT='',pushMsgOk=true,pushSynced=false;
async function pushSub(){if(!pushOk()) return null;try{const r=await navigator.serviceWorker.getRegistration();return r?await r.pushManager.getSubscription():null;}catch(e){return null;}}
async function pushState(){
  if(!pushOk()){pushOn=false;pushRender();return;}
  const s=await pushSub();pushOn=!!s;
  if(s&&accTok&&lbOn()&&!pushSynced){pushSynced=true;lbApi('rpc/push_subscribe',{p_token:accTok,p_sub:s.toJSON(),p_lang:LANG}).catch(()=>{});}
  pushRender();
}
async function pushEnable(){
  if(!accTok){pushMsgT=tt('Melde dich zuerst mit deinem Konto an (Einstellungen → Speichern).','Sign in to your account first (Settings → Saving).');pushMsgOk=false;pushRender();return;}
  pushBusy=true;pushMsgT='';pushRender();
  try{
    const perm=await Notification.requestPermission();if(perm!=='granted') throw new Error('denied');
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      let key=null;for(let i=0;i<4&&!key;i++){key=await lbApi('rpc/push_pubkey',{});if(!key) await new Promise(r=>setTimeout(r,2500));}
      if(!key) throw new Error('not ready');
      sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(key)});
    }
    await lbApi('rpc/push_subscribe',{p_token:accTok,p_sub:sub.toJSON(),p_lang:LANG});
    pushOn=true;pushSynced=true;pushMsgT=tt('Benachrichtigungen sind an. Du bekommst Bescheid bei Geschenken, Freundschaftsanfragen, Club-Preisen, Nachrichten vom Admin und globalen Events.','Notifications are on. You’ll hear about gifts, friend requests, club prizes, messages from the admin and global events.');pushMsgOk=true;
  }catch(x){const m=String(x&&x.message||'');pushMsgT=/denied/.test(m)?tt('Benachrichtigungen sind blockiert. Erlaube sie in den Einstellungen deines Browsers.','Notifications are blocked. Allow them in your browser settings.'):lbMissing(x)?tt('Das kommt mit dem nächsten Server-Update.','This arrives with the next server update.'):/not ready/.test(m)?tt('Push wird auf dem Server gerade eingerichtet. Versuch es in einer Minute nochmal.','Push is still being set up on the server. Try again in a minute.'):tt('Hat nicht geklappt. Versuch es nochmal.','Didn’t work. Please try again.');pushMsgOk=false;}
  pushBusy=false;pushRender();
}
async function pushDisable(){
  pushBusy=true;pushRender();
  try{const s=await pushSub();if(s){const ep=s.endpoint;await s.unsubscribe();lbApi('rpc/push_unsubscribe',{p_endpoint:ep}).catch(()=>{});}}catch(e){}
  pushOn=false;pushBusy=false;pushMsgT=tt('Benachrichtigungen sind aus.','Notifications are off.');pushMsgOk=true;pushRender();
}
function pushRender(){
  const B=$id('pushBtn'),P=$id('pushP'),M=$id('pushMsg');if(!B) return;
  set$('pushT',tt('Push-Benachrichtigungen','Push notifications'));
  const ok=pushOk()&&lbOn();
  const p=!ok?(isIOS?tt('Auf iPhone und iPad: Füge das Spiel zuerst zum Home-Bildschirm hinzu und öffne es von dort. Dann kannst du Benachrichtigungen einschalten.','On iPhone and iPad: add the game to your home screen first and open it from there. Then you can turn notifications on.'):tt('Dieser Browser kann keine Push-Benachrichtigungen.','This browser can’t show push notifications.')):tt('Auch wenn das Spiel geschlossen ist: Geschenke, Freundschaftsanfragen, Club-Preise, Nachrichten vom Admin und globale Events. Braucht ein Konto.','Even when the game is closed: gifts, friend requests, club prizes, messages from the admin and global events. Needs an account.');
  if(P.textContent!==p) P.textContent=p;
  B.hidden=!ok;B.disabled=pushBusy;
  const bt=pushBusy?tt('Moment …','One moment …'):pushOn?tt('Ausschalten','Turn off'):tt('Einschalten','Turn on');if(B.textContent!==bt) B.textContent=bt;
  B.classList.toggle('primary',!pushOn);
  M.className='nameerr'+(pushMsgOk?' ok':'');if(M.textContent!==pushMsgT) M.textContent=pushMsgT;
}
$id('pushBtn').addEventListener('click',()=>{if(pushBusy) return;if(pushOn) pushDisable();else pushEnable();});
pushState();
v49Ready=true;
