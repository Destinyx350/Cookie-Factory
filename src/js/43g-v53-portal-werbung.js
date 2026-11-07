/* ======================= V53: Freiwillige Werbung, nur in Portal-Versionen ======================= */
/* Nur die Zip-Dateien für CrazyGames und GameDistribution laden deren SDK (tools/portal.js --sdk …).
   Auf der eigenen Seite und in der normalen Portal-Version gibt es keine Werbung. */
const AD_SDK=window.KF_PORTAL==='crazygames'||window.KF_PORTAL==='gamedistribution'?window.KF_PORTAL:'';
const AD_MIN=20,AD_CD=300000,AD_KEY='keksfabrik-adt';
var adMute=false;
let adReady=false,adBusy=false,adNext=0,adGdOk=false;
try{adNext=+localStorage.getItem(AD_KEY)||0;}catch(x){}
function adSound(off){adMute=off;try{if(typeof actx!=='undefined'&&actx){if(off) actx.suspend().catch(()=>{});else if(!document.hidden) actx.resume().catch(()=>{});}}catch(x){}}
function adReward(){
  const g=Math.max(1000,C.kps0*60*AD_MIN);addCk(g);
  adNext=Date.now()+AD_CD;try{localStorage.setItem(AD_KEY,String(adNext));}catch(x){}
  toast(tt('🎬 Danke! +','🎬 Thanks! +')+fmt(g)+tt(' Kekse',' cookies'),true);snd('claim');render();adRender();
}
function adRender(){
  if(!AD_SDK) return;
  let b=$id('adBtn');
  if(!b){const gb=$id('gevBar');if(!gb) return;b=document.createElement('button');b.type='button';b.id='adBtn';b.className='adbtn';gb.insertAdjacentElement('afterend',b);b.addEventListener('click',adShow);}
  const wait=Math.max(0,adNext-Date.now());b.hidden=!adReady;b.disabled=adBusy||wait>0;
  const t=adBusy?tt('Werbung läuft …','Ad playing …'):wait>0?'🎬 '+Math.ceil(wait/60000)+' min':'🎬 '+tt('Werbung ansehen: +','Watch an ad: +')+AD_MIN+' min';
  if(b.textContent!==t) b.textContent=t;
  b.title=tt('Freiwillig: Sieh dir eine kurze Werbung an und bekomm '+AD_MIN+' Minuten Produktion.','Optional: watch a short ad and get '+AD_MIN+' minutes of production.');
}
function adDone(ok){adBusy=false;adSound(false);if(ok) adReward();else{toast(tt('Gerade gibt es keine Werbung. Versuch es später nochmal.','No ad available right now. Try again later.'));adRender();}}
function adShow(){
  if(adBusy||!adReady||Date.now()<adNext) return;
  adBusy=true;adRender();
  try{
    if(AD_SDK==='crazygames'){
      window.CrazyGames.SDK.ad.requestAd('rewarded',{adStarted:()=>adSound(true),adFinished:()=>adDone(true),adError:()=>adDone(false)});
    }else{
      adGdOk=false;
      window.gdsdk.showAd('rewarded').then(()=>adDone(adGdOk)).catch(()=>adDone(false));
    }
  }catch(x){adDone(false);}
}
/* GameDistribution meldet sich über GD_OPTIONS.onEvent (in tools/portal.js gesetzt). */
window.__kfGdEvent=e=>{
  const n=e&&e.name;
  if(n==='SDK_READY'){adReady=true;try{window.gdsdk.preloadAd('rewarded').catch(()=>{});}catch(x){}adRender();}
  else if(n==='SDK_GAME_PAUSE') adSound(true);
  else if(n==='SDK_GAME_START') adSound(false);
  else if(n==='SDK_REWARDED_WATCH_COMPLETE') adGdOk=true;
};
async function adInit(){
  if(AD_SDK==='crazygames'){
    for(let i=0;i<20&&!(window.CrazyGames&&window.CrazyGames.SDK);i++) await new Promise(r=>setTimeout(r,500));
    if(!(window.CrazyGames&&window.CrazyGames.SDK)) return;
    try{await window.CrazyGames.SDK.init();}catch(x){}
    try{window.CrazyGames.SDK.game.loadingStop();}catch(x){}
    adReady=true;adRender();
  }else if(AD_SDK==='gamedistribution'&&window.__kfGdReady){window.__kfGdEvent({name:'SDK_READY'});}
}
if(AD_SDK){adInit();setInterval(adRender,15000);}
