/* ======================= V39: Gerät & Layout ======================= */
const DEVN={auto:['Automatisch','Automatic'],phone:['Handy','Phone'],tablet:['Tablet','Tablet'],desktop:['Computer','Computer']};
function updDev(){
  const d=window.__kfDevice?window.__kfDevice():{device:'desktop',auto:'desktop',pick:'auto',orient:'landscape',input:'mouse'};
  const set=(id,t)=>{const e=$id(id);if(e&&e.textContent!==t) e.textContent=t;};
  set('devT',tt('Layout für dein Gerät','Layout for your device'));
  set('devP',tt('Das Spiel erkennt dein Gerät und passt die Ansicht an. Du kannst das Layout hier auch selbst wählen.','The game detects your device and adapts the view. You can also pick the layout yourself here.'));
  document.querySelectorAll('#devSeg [data-dev]').forEach(b=>{b.textContent=tx(DEVN[b.dataset.dev]);b.setAttribute('aria-pressed',b.dataset.dev===d.pick?'true':'false');});
  const info=$id('devInfo');if(info){
    const h=tt('Erkannt: ','Detected: ')+'<b>'+tx(DEVN[d.auto])+'</b> · '+(d.input==='touch'?tt('Touch','touch'):tt('Maus','mouse'))+' · '+(d.orient==='portrait'?tt('hochkant','upright'):tt('quer','sideways'))+(d.pick!=='auto'?' · '+tt('Gewählt: ','Chosen: ')+'<b>'+tx(DEVN[d.device])+'</b>':'');
    if(info._h!==h){info._h=h;info.innerHTML=h;}
  }
}
$id('devSeg').addEventListener('click',e=>{
  const b=e.target.closest('[data-dev]');if(!b) return;
  try{if(b.dataset.dev==='auto') localStorage.removeItem('keksfabrik-device');else localStorage.setItem('keksfabrik-device',b.dataset.dev);}catch(x){}
  updDev();toast(tt('Layout: ','Layout: ')+tx(DEVN[b.dataset.dev]));
});
window.__kfDeviceChanged=updDev;
