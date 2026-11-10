/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V54: Alarme aufs Handy und Feedback der Spieler ======================= */
var v54aReady=false;
let admAlertOn=null,admAlertBusy=false,admAlertErr='';
const admAlertTok=()=>admPass||(typeof modTok!=='undefined'&&modTok?modTok.t:'');
const admAlertRe=()=>{if(admPass) admSrvRender();else if(typeof modRender==='function') modRender();};
async function admAlertState(){
  const t=admAlertTok();if(!t||!pushOk()){admAlertOn=false;admAlertRe();return;}
  try{const s=await pushSub();if(!s){admAlertOn=false;}else{const r=await lbApi('rpc/admin_push',{p_pass:t,p_action:'status',p_data:{endpoint:s.endpoint}});admAlertOn=!!(r&&r.on);}admAlertErr='';}
  catch(x){admAlertOn=false;if(lbMissing(x)) admAlertErr=tt('Alarme brauchen zuerst docs/community-v13.sql.','Alerts need docs/community-v13.sql first.');}
  admAlertRe();
}
async function admAlertSet(on){
  const t=admAlertTok();if(!t||admAlertBusy) return;
  admAlertBusy=true;admAlertErr='';admAlertRe();
  try{
    if(on){
      if(!pushOk()) throw new Error('unsupported');
      const perm=await Notification.requestPermission();if(perm!=='granted') throw new Error('denied');
      const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
      if(!sub){
        let key=null;for(let i=0;i<4&&!key;i++){key=await lbApi('rpc/push_pubkey',{});if(!key) await new Promise(r=>setTimeout(r,2500));}
        if(!key) throw new Error('not ready');
        sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(key)});
      }
      const r=await lbApi('rpc/admin_push',{p_pass:t,p_action:'subscribe',p_data:{sub:sub.toJSON(),lang:LANG}});admAlertOn=!!(r&&r.on);
      toast(tt('Alarme sind auf diesem Gerät an.','Alerts are on for this device.'),true);
    }else{
      const s=await pushSub();if(s) await lbApi('rpc/admin_push',{p_pass:t,p_action:'unsubscribe',p_data:{endpoint:s.endpoint}});
      admAlertOn=false;toast(tt('Alarme sind auf diesem Gerät aus.','Alerts are off for this device.'));
    }
  }catch(x){
    const m=String(x&&x.message||'');
    admAlertErr=m==='denied'?tt('Benachrichtigungen sind im Browser blockiert. Erlaube sie in den Website-Einstellungen.','Notifications are blocked in the browser. Allow them in the site settings.'):m==='unsupported'?tt('Dieser Browser kann keine Push-Benachrichtigungen. Auf dem iPhone: admin.html zum Home-Bildschirm hinzufügen und von dort öffnen.','This browser can’t do push notifications. On iPhone: add admin.html to the home screen and open it from there.'):m==='not ready'?tt('Push wird auf dem Server noch eingerichtet. Versuch es in einer Minute nochmal.','Push is still being set up on the server. Try again in a minute.'):lbMissing(x)?tt('Alarme brauchen zuerst docs/community-v13.sql.','Alerts need docs/community-v13.sql first.'):admErrTxt(x);
  }
  admAlertBusy=false;admAlertRe();
}
function admAlertHtml(mod){
  const what=mod?tt('neue Meldungen im Club-Chat','new reports in club chat'):tt('neue Meldungen, Einsprüche, Feedback und neue Fehlerarten','new reports, appeals, feedback and new kinds of crashes');
  const st=admAlertOn===null?tt('Prüfe …','Checking …'):admAlertOn?tt('✅ An auf diesem Gerät.','✅ On for this device.'):tt('Aus auf diesem Gerät.','Off for this device.');
  return admCardH('🔔 '+tt('Alarme aufs Handy','Alerts on your phone'),'<p class="small">'+tt('Eine Push-Benachrichtigung bei ','A push notification for ')+what+tt(' – höchstens eine pro Art alle 10 Minuten. Antippen öffnet admin.html.',' – at most one of each kind every 10 minutes. Tapping it opens admin.html.')+'</p><p class="small"><b>'+st+'</b></p>'
    +'<div class="btns"><button type="button" class="btn sm '+(admAlertOn?'':'primary')+'" data-alrt="'+(admAlertOn?'off':'on')+'"'+(admAlertBusy?' disabled':'')+'>'+(admAlertBusy?tt('Moment …','One moment …'):admAlertOn?tt('Ausschalten','Turn off'):tt('Einschalten','Turn on'))+'</button></div>'
    +(admAlertErr?'<p class="nameerr">'+admAlertErr+'</p>':''));
}
els.admin.addEventListener('click',e=>{const b=e.target.closest('[data-alrt]');if(b) admAlertSet(b.dataset.alrt==='on');});

/* ---------- Feedback der Spieler (Server-Tab) ---------- */
var admFb=null,admFbErr='';
async function admFbCall(action,data,okTxt){
  if(!admPass) return;
  try{admFb=await lbApi('rpc/admin_feedback',{p_pass:admPass,p_action:action,p_data:data||null})||[];admFbErr='';if(okTxt) toast(okTxt);}
  catch(x){admFbErr=lbMissing(x)?tt('Feedback braucht zuerst docs/community-v13.sql.','Feedback needs docs/community-v13.sql first.'):admErrTxt(x);}
  admSrvRender();
}
const FB_ICON={bug:'🐞',idea:'💡',other:'💬'};
function admFbHtml(){
  const F=admFb||[],open=F.filter(f=>f.status==='open');
  const row=f=>'<div class="admlbr'+(f.status==='open'?'':' done')+'"><span class="rk">'+(FB_ICON[f.kind]||'💬')+'</span><span class="who"><b>'+(f.username?pcl(f.username):tt('ohne Konto','no account'))+' · v'+f.ver+'</b><small class="fbbody">'+escName(f.body)+'</small><small>'+admDT(f.created_at)+(f.ua?' · '+escName(f.ua.slice(0,80)):'')+'</small></span><span class="btns">'+(f.status==='open'?'<button type="button" class="btn sm" data-fba="done:'+f.id+'">'+tt('Erledigt','Done')+'</button>':'')+'<button type="button" class="btn sm warn" data-fba="delete:'+f.id+'">'+tt('Löschen','Delete')+'</button></span></div>';
  return admCardH('💬 '+tt('Feedback von Spielern','Player feedback')+' <small class="muted">('+(admFb?open.length+' '+tt('offen','open'):'…')+')</small>',
    '<p class="small">'+tt('Was Spieler über „Feedback senden“ in den Einstellungen schicken (höchstens 5 pro Gerät und Tag).','What players send with “Send feedback” in Settings (at most 5 per device a day).')+'</p>'
    +(open.length?'<div class="admlbl">'+open.map(row).join('')+'</div>':'<p class="small">'+(admFb?tt('Kein neues Feedback.','No new feedback.'):tt('Lädt …','Loading …'))+'</p>')
    +(F.length>open.length?'<details class="fold"><summary>'+tt('Erledigt','Done')+' ('+(F.length-open.length)+')</summary><div class="admlbl">'+F.filter(f=>f.status!=='open').map(row).join('')+'</div></details>':'')
    +(admFbErr?'<p class="nameerr">'+admFbErr+'</p>':''));
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-fba]');if(!b) return;
  const [a,id]=b.dataset.fba.split(':');
  admFbCall(a,{id:+id},a==='done'?tt('Erledigt.','Done.'):tt('Gelöscht.','Deleted.'));
});

v54aReady=true;
if(admPass){admFbCall('list');admAlertState();}
else if(typeof modTok!=='undefined'&&modTok) admAlertState();
