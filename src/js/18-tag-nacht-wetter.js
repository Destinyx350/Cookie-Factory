/* ===== Tag & Nacht + Wetter ===== */
function curPhase(){const hr=new Date().getHours(),x=hr<6?hr+24:hr;return PHASES.find(p=>x>=p.from&&x<p.to)||PHASES[1];}
let wxCache={b:-1,w:WEATHER[0]};
function curWeather(){
  const b=Math.floor(Date.now()/1800000);
  if(wxCache.b===b) return wxCache.w;
  let x=(b*2654435761)>>>0;x^=x>>>13;x=Math.imul(x,1274126177)>>>0;x^=x>>>16;
  let r=(x%1000)/1000*WEATHER.reduce((a,w)=>a+w.w,0),w=WEATHER[0];
  for(const k of WEATHER){r-=k.w;if(r<0){w=k;break;}}
  wxCache={b,w};return w;
}
let envKey='';
function envTick(){
  const ph=curPhase(),wx=curWeather(),k=ph.id+'|'+wx.id;
  if(k!==envKey){
    const first=!envKey;envKey=k;recalc();
    if(!first) toast(tt('Wetter: ','Weather: ')+tx(wx.n)+' · '+tx(wx.d)+' — '+tx(ph.n)+': '+tx(ph.d));
    const fx=document.getElementById('wxfx');
    fx.className='wxfx'+(ph.id==='night'?' night':'')+(['rain','storm','snow','fog','rainbow'].includes(wx.id)?' '+wx.id:'')+(fxOk()?'':' still');
  }
}
function envChip(){
  const ph=curPhase(),wx=curWeather(),left=1800-(Date.now()/1000)%1800;
  return '<button type="button" class="buff env" data-env="1" title="'+tx(ph.n)+': '+tx(ph.d)+' · '+tx(wx.n)+': '+tx(wx.d)+'">'+tx(ph.n)+' · '+tx(wx.n)+'</button>';
}
els.buffs.addEventListener('click',e=>{
  if(!e.target.closest('[data-env]')) return;
  const ph=curPhase(),wx=curWeather(),left=1800-(Date.now()/1000)%1800;
  toast(tx(ph.n)+': '+tx(ph.d)+' · '+tx(wx.n)+': '+tx(wx.d)+' · '+tt('Wetterwechsel in ','Weather changes in ')+mmss(left));
});
