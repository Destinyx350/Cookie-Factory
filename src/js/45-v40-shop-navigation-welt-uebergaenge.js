/* ======================= V40: Shop-Navigation & Welt-Übergänge ======================= */
const SHOPK=[['starShop','⭐','Sterne','Stars'],['artSec','⚒️','Schmiede','Forge'],['cardSec','🃏','Karten','Cards'],['boostList','⚡','Boosts','Boosts'],['boostListW','🌍','Welt','World'],['boxBtn','🎁','Keksbox','Cookie box'],['itemGrid','🎒','Gegenstände','Items'],['skinRow','🍪','Designs','Designs']];
const shopPane=$id('shopPane'),shopNav=document.createElement('nav');
shopNav.className='shopnav';shopPane.prepend(shopNav);
SHOPK.forEach(([id,e])=>{const el=$id(id);const sec=el&&(el.matches('.wsec')?el:el.closest('.wsec'));if(sec){sec.dataset.shk=id;sec.dataset.ico=e;}});
const shopSecs=()=>SHOPK.map(k=>shopPane.querySelector('[data-shk="'+k[0]+'"]')).filter(s=>s&&!s.hidden);
function shopSpy(){
  if(shopPane.hidden) return;
  const line=shopNav.getBoundingClientRect().bottom+12;let cur=null;
  shopSecs().forEach(s=>{if(s.getBoundingClientRect().top<=line) cur=s;});
  if(!cur){const f=shopSecs()[0];cur=f||null;}
  shopNav.querySelectorAll('[data-shg]').forEach(b=>{const on=!!cur&&b.dataset.shg===cur.dataset.shk;if((b.getAttribute('aria-current')==='true')!==on){b.setAttribute('aria-current',on?'true':'false');if(on&&b.scrollIntoView) b.scrollIntoView({block:'nearest',inline:'nearest'});}});
}
function updShopNav(){
  shopNav.setAttribute('aria-label',tt('Shop-Bereiche','Shop sections'));
  const h=SHOPK.filter(k=>{const s=shopPane.querySelector('[data-shk="'+k[0]+'"]');return s&&!s.hidden;}).map(k=>'<button type="button" data-shg="'+k[0]+'" aria-current="false"><span class="e" aria-hidden="true">'+k[1]+'</span>'+tt(k[2],k[3])+'</button>').join('');
  if(shopNav._h!==h){shopNav._h=h;shopNav.innerHTML=h;}
  shopSpy();
}
shopNav.addEventListener('click',e=>{
  const b=e.target.closest('[data-shg]');if(!b) return;
  const sec=shopPane.querySelector('[data-shk="'+b.dataset.shg+'"]');if(!sec) return;
  sec.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
  shopNav.querySelectorAll('[data-shg]').forEach(x=>x.setAttribute('aria-current',x===b?'true':'false'));
});
let shopRaf=0;
const onShopScroll=()=>{if(shopRaf) return;shopRaf=requestAnimationFrame(()=>{shopRaf=0;shopSpy();});};
window.addEventListener('scroll',onShopScroll,{passive:true});
document.addEventListener('scroll',onShopScroll,{passive:true,capture:true});
setInterval(()=>{if(!shopPane.hidden) updShopNav();},1000);
$id('wMap').addEventListener('click',e=>{
  if(!e.target.closest('.wloc,button,[data-loc],[data-w]')) return;
  const wb=$id('wBody');setTimeout(()=>{wb.classList.remove('pin-in');void wb.offsetWidth;wb.classList.add('pin-in');},0);
});
