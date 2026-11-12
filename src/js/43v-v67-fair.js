/* ======================= V67: Uhr-Prüfung, Merker für neue Erfolge, „Neu“-Fenster auf itch.io ======================= */
var v67Ready=false,clkSkew=0,clkOk=false,clkMiss=false,clkBusy=false;
/* Vertrauenswürdige Zeit: Gerätezeit plus Abweichung zur Server-Zeit (wenn bekannt). Für Tages-Belohnungen und Glücksrad. */
function tNow(){return Date.now()+(clkOk?clkSkew:0);}
/* Spielstand-Teile (werden in sanitize() aufgerufen, darum als Funktions-Deklaration) */
function sanXF(o){const r={};if(o&&typeof o==='object') ['style','share','rename','top10'].forEach(k=>{if(o[k]) r[k]=1;});return r;}
function sanTZ(o){return o&&typeof o==='object'&&isFinite(+o.s)&&isFinite(+o.l)&&+o.s>0?{s:+o.s,l:+o.l}:null;}
function sanCK(o){
  if(!o||typeof o!=='object') return null;
  const k=['gap','gain','cap','l0','s0','cbg','cbc'],r={};
  for(const x of k){const v=+o[x];if(!isFinite(v)||v<0) return null;r[x]=v;}
  return r;
}
function xfSet(k){if(!S.xf) S.xf={};if(S.xf[k]) return;S.xf[k]=1;if(typeof checkAch==='function') checkAch(false);}

/* ---------- 1. Uhr-Prüfung ----------
   Beim Start wird der Offline-Ertrag mit der Gerätezeit berechnet. Sobald die Server-Zeit bekannt ist,
   prüft das Spiel, wie lange man wirklich weg war, und nimmt zu viel bekommene Kekse (und ein zu frühes
   Willkommensgeschenk) wieder weg. Ohne Internet bleibt die Prüfung im Spielstand und läuft später. */
function clkNote(gap,gain,cap,cbg,cbc){
  if(!S.tz||!(gap>120)) return;
  S.ck={gap,gain:Math.max(0,gain||0),cap:Math.max(1,cap||gap),l0:Date.now(),s0:S.tz.s,cbg:cbg||0,cbc:cbc||0};
}
async function clkSync(){
  if(clkBusy||clkMiss||!lbOn()) return;
  clkBusy=true;
  try{
    const t0=Date.now(),p0=performance.now(),srv=+(await lbApi('rpc/kf_now',{})),rtt=performance.now()-p0;
    if(isFinite(srv)&&srv>1e12){clkSkew=Math.round(srv+rtt/2-(t0+rtt));clkOk=true;clkCheck();clkStamp();}
  }catch(x){if(lbMissing(x)) clkMiss=true;}
  clkBusy=false;
}
/* Merkt sich die Server-Zeit im Spielstand (für die Prüfung beim nächsten Start) */
function clkStamp(){if(clkOk&&S){const l=Date.now();S.tz={s:l+clkSkew,l};}}
function clkCheck(){
  const P=S.ck;if(!P||!clkOk) return;
  S.ck=null;
  const realGap=(P.l0+clkSkew-P.s0)/1000,extra=P.gap-realGap;
  if(!(extra>600)) return;   /* bis 10 Minuten Abweichung sind normal */
  const fair=P.gain*Math.min(Math.max(0,realGap),P.cap)/Math.min(P.gap,P.cap),take=Math.max(0,P.gain-fair);
  let msg='';
  if(take>0){S.cookies=Math.max(0,S.cookies-take);S.run=Math.max(0,S.run-take);S.all=Math.max(0,S.all-take);msg+=fmt(take)+' '+tt('Kekse','cookies');}
  if(P.cbg&&realGap<259200){
    S.w.mat.gem=Math.max(0,(S.w.mat.gem||0)-P.cbg);S.cookies=Math.max(0,S.cookies-P.cbc);S.cb=0;
    msg+=(msg?', ':'')+P.cbg+' '+tt('Edelsteine','gems');
  }
  if(msg){
    recalc();save();
    toast(tt('Die Uhr deines Geräts ging um ','Your device clock was ahead by ')+fmtDur(extra)+tt(' vor. Zu viel bekommen und zurückgenommen: ','. Too much was given and taken back: ')+msg+'.',true,true);
  }
}
setTimeout(clkSync,2500);setInterval(clkSync,600000);setInterval(clkStamp,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden) clkSync();});

/* ---------- 7. Unter den Besten: Platz 1–10 in irgendeiner Bestenliste ---------- */
setInterval(()=>{
  if(!S||!S.lb||!S.lb.on||(S.xf&&S.xf.top10)) return;
  let top=typeof lbRank!=='undefined'&&lbRank>0&&lbRank<=10;
  if(!top&&typeof lbCatData!=='undefined'&&lbCatData) top=Object.values(lbCatData).some(d=>d&&d.me&&d.me.rank>0&&d.me.rank<=10);
  if(top) xfSet('top10');
},5000);

/* ---------- 12. „Neu“-Fenster nach einem Update – nur in Portal-Kopien (dort gibt es keinen Update-Hinweis) ---------- */
if(window.KF_PORTAL){
  const iv=setInterval(()=>{
    if(!S||!S.opt) return;
    if(!(S.opt.news>0&&S.opt.news<NEWS_VER)){clearInterval(iv);return;}
    if(!startOv.hidden||document.querySelector('.overlay:not([hidden])')||(typeof awayOpen!=='undefined'&&awayOpen)) return;
    clearInterval(iv);openNews();
  },700);
}

v67Ready=true;
