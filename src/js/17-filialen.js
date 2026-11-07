/* ===== Filialen ===== */
function shopSVG(col){return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="22" width="48" height="34" rx="3" fill="#f3e3c3"/><path d="M5 22l6-12h42l6 12z" fill="'+col+'"/><path d="M5 22h54v6H5z" fill="'+col+'" opacity=".75"/><path d="M15 22v6M25 22v6M35 22v6M45 22v6" stroke="#fff" stroke-width="3" opacity=".6"/><rect x="26" y="37" width="12" height="19" fill="#8a5a3c"/><rect x="12" y="34" width="10" height="10" rx="1" fill="#9fd3f0"/><rect x="42" y="34" width="10" height="10" rx="1" fill="#9fd3f0"/><circle cx="35" cy="47" r="1.2" fill="#f1d36a"/></svg>';}
const frOpenCost=c=>c.p;
const frLvlCost=(c,L)=>c.p*.5*L*L;
const frStCost=(c,n)=>c.p*.4*(n+1)*(n+1);
const frAdCost=c=>c.p*.05;
const frTruckCost=c=>c.p*3;
const mar=c=>c.mar+UE.frMar;
const frBase=(c,x)=>C.kps0*c.sr*x.L*(1+.2*x.st)*UE.frSell;
const frRate=(c,x)=>frBase(c,x)*(x.ad>0?2:1)*(wLv('supplier')>=3?1.1:1)*envV(curWeather().fr);
const frCap=(c,x)=>frBase(c,x)*7200*UE.frCap;
function frProfit(){let p=0;CITIES.forEach(c=>{const x=S.fr.s[c.id];if(x&&x.stock>0) p+=frRate(c,x)*mar(c);});return p;}
function frTick(dt){
  CITIES.forEach(c=>{
    const x=S.fr.s[c.id];if(!x) return;
    if(x.ad>0) x.ad=Math.max(0,x.ad-dt);
    if(x.cd>0) x.cd=Math.max(0,x.cd-dt);
    const sold=Math.min(x.stock,frRate(c,x)*dt);
    if(sold>0){x.stock-=sold;const pr=sold*mar(c);S.cookies+=sold+pr;S.run+=pr;S.all+=pr;S.fr.earned+=pr;}
    if(x.truck){const cap=frCap(c,x);if(x.stock<cap*.3){const pay=Math.min(cap-x.stock,S.cookies*.5);if(pay>0){S.cookies-=pay;x.stock+=pay;}}}
  });
}
function frRefill(c){const x=S.fr.s[c.id];if(!x) return 0;const pay=Math.min(Math.max(0,frCap(c,x)-x.stock),S.cookies);if(pay<=0) return 0;S.cookies-=pay;x.stock+=pay;return pay;}
function frOffline(sec){
  sec=Math.min(sec,C.offCap*3600);let pr=0;
  CITIES.forEach(c=>{
    const x=S.fr.s[c.id];if(!x) return;
    x.ad=0;x.cd=Math.max(0,x.cd-sec);
    const r=frBase(c,x);
    if(x.truck){const p=r*sec*mar(c);pr+=p;}
    else{const sold=Math.min(x.stock,r*sec);x.stock-=sold;S.cookies+=sold;pr+=sold*mar(c);}
  });
  if(pr>0){S.cookies+=pr;S.run+=pr;S.all+=pr;S.fr.earned+=pr;}
  return pr;
}
function frR(){
  const F=S.fr,live={},wid={},n=Object.keys(F.s).length;
  let need=0;CITIES.forEach(c=>{const x=F.s[c.id];if(x) need+=Math.max(0,frCap(c,x)-x.stock);});
  let h='<p class="small wnote" style="margin-bottom:8px">'+tt('Eröffne Keksläden in Städten. Fülle ihr Lager mit deinen Keksen, dann verkaufen sie sie mit Gewinn weiter, auch wenn das Spiel zu ist. Ein Lieferwagen füllt das Lager automatisch auf.','Open cookie stores in cities. Fill their stock with your cookies and they sell them on for a profit, even while the game is closed. A delivery van refills the stock automatically.')+'</p>';
  h+='<div class="frsum"><span>'+tt('Gewinn','Profit')+': <b>'+wLive('pr')+'</b></span><span>'+tt('Filialen','Stores')+': <b>'+n+' / '+CITIES.length+'</b></span><span>'+tt('Insgesamt verdient','Earned in total')+': <b>'+wLive('earn')+'</b></span></div>';
  live.pr='+'+fmtRate(frProfit())+' '+tt('pro Sekunde','per second');live.earn=fmt(F.earned);
  if(n){h+='<div class="btns" style="margin-bottom:6px">'+wBtn(tt('Alle auffüllen · ','Refill all · ')+wLive('fa'),'fr:all',{plain:need<=0})+'</div>';live.fa=fmt(need);}
  CITIES.forEach(c=>{
    const x=F.s[c.id];
    if(!x){
      const oc=frOpenCost(c);
      h+='<div class="frc"><div class="fh"><span class="ico">'+shopSVG(c.col)+'</span><span class="info"><span class="nm"><span>'+tx(c.n)+'</span></span><span class="sub">'+tt('Gewinnspanne ','Margin ')+Math.round(mar(c)*100)+' % · '+tt('Gewinn auf Stufe 1: +','Profit at level 1: +')+fmtRate(C.kps0*c.sr*mar(c))+tt(' pro Sekunde',' per second')+'</span></span></div><div class="btns">'+wBtn(tt('Eröffnen · ','Open · ')+fmt(oc),'fr:open:'+c.id,{need:oc})+'</div></div>';
      return;
    }
    const cap=frCap(c,x),rate=frRate(c,x),lc=frLvlCost(c,x.L),sc=frStCost(c,x.st),ac=frAdCost(c),tc=frTruckCost(c),k=c.id;
    live['s'+k]=fmt(x.stock)+' / '+fmt(cap)+(rate>0&&x.stock>0?' · '+tt('reicht ','lasts ')+fmtWait(x.stock/rate):x.stock<=0?' · '+tt('leer!','empty!'):'');wid['s'+k]=x.stock/cap*100;
    live['r'+k]=fmtRate(rate)+'/s';live['p'+k]='+'+fmtRate(x.stock>0?rate*mar(c):0)+'/s';
    if(x.ad>0) live['a'+k]=mmss(x.ad);if(x.cd>0&&x.ad<=0) live['c'+k]=mmss(x.cd);
    const ref=Math.max(0,cap-x.stock);live['f'+k]=fmt(ref);
    h+='<div class="frc"><div class="fh"><span class="ico">'+shopSVG(c.col)+'</span><span class="info"><span class="nm"><span>'+tx(c.n)+' · '+tt('Stufe ','Level ')+x.L+'</span></span><span class="sub">'+tt('Personal ','Staff ')+x.st+' / 5 · '+tt('Verkauf ','Sales ')+wLive('r'+k)+' · '+tt('Gewinn ','Profit ')+wLive('p'+k)+(x.ad>0?' · <b>'+tt('Werbung ×2 ','Ad ×2 ')+wLive('a'+k)+'</b>':'')+'</span><span class="sub">'+tt('Lager: ','Stock: ')+wLive('s'+k)+'</span>'+wBar('s'+k)+'</span></div><div class="btns">'
      +wBtn(tt('Auffüllen · ','Refill · ')+wLive('f'+k),'fr:fill:'+k,{plain:ref<=0})
      +(x.L<10?wBtn(tt('Stufe ','Level ')+(x.L+1)+' · '+fmt(lc),'fr:lvl:'+k,{need:lc,plain:1}):'')
      +(x.st<5?wBtn(tt('Personal + · ','Staff + · ')+fmt(sc),'fr:st:'+k,{need:sc,plain:1}):'')
      +(x.ad>0?'':x.cd>0?'<span class="sub" style="align-self:center">'+tt('Werbung wieder in ','Ad again in ')+wLive('c'+k)+'</span>':wBtn(tt('Werbung ×2 · ','Ad ×2 · ')+fmt(ac),'fr:ad:'+k,{need:ac,plain:1}))
      +(x.truck?'<span class="sub wk-on" style="align-self:center">'+tt('✓ Lieferwagen','✓ Delivery van')+'</span>':wBtn(tt('Lieferwagen · ','Delivery van · ')+fmt(tc),'fr:truck:'+k,{need:tc,plain:1}))
      +'</div></div>';
  });
  return {html:h,live,wid};
}
function updFr(){
  document.getElementById('frDot').hidden=!frEmpty();
  if(panes.world.hidden||wSubV!=='fr') return;
  mount(document.getElementById('frBox'),frR(),{cookies:S.cookies});
}
document.getElementById('frBox').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b) return;
  const p=b.dataset.a.split(':'),F=S.fr;let ok=true;
  if(p[1]==='all'){let t=0;CITIES.forEach(c=>{t+=frRefill(c);});ok=t>0;}
  else{
    const c=CITIES.find(x=>x.id===p[2]);if(!c) return;
    const x=F.s[c.id];
    if(p[1]==='open'){const oc=frOpenCost(c);if(x||S.cookies<oc) ok=false;else{S.cookies-=oc;F.s[c.id]={L:1,st:0,stock:0,ad:0,cd:0,truck:0,ads:0};toast(tt('Neue Filiale in ','New store in ')+tx(c.n)+'! '+tt('Fülle jetzt das Lager auf.','Now fill up its stock.'),true);checkAch(false);}}
    else if(!x) ok=false;
    else if(p[1]==='fill') ok=frRefill(c)>0;
    else if(p[1]==='lvl'){const lc=frLvlCost(c,x.L);if(x.L>=10||S.cookies<lc) ok=false;else{S.cookies-=lc;x.L++;checkAch(false);}}
    else if(p[1]==='st'){const sc=frStCost(c,x.st);if(x.st>=5||S.cookies<sc) ok=false;else{S.cookies-=sc;x.st++;}}
    else if(p[1]==='ad'){const ac=frAdCost(c);if(x.ad>0||x.cd>0||S.cookies<ac) ok=false;else{S.cookies-=ac;x.ad=120;x.cd=900;x.ads=(x.ads||0)+1;}}
    else if(p[1]==='truck'){const tc=frTruckCost(c);if(x.truck||S.cookies<tc) ok=false;else{S.cookies-=tc;x.truck=1;toast(tt('Lieferwagen für ','Delivery van for ')+tx(c.n)+'!',true);}}
  }
  if(!ok) nope(b);else snd('buy');
  render();
});

