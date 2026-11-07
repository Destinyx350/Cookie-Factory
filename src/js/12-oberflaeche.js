/* ======================= Oberfläche ======================= */
const els={};
['saveNote','boostListW','starShop','starHead','starNote','starTitle','starEarn','starEarnHead','wBoostTitle','wBoostNote','shDot','setOv','setBtn','setClose','itemsNote','count','kps','perClick','run','chips','buffs','hint','cookie','cookieStage','stage','rain','buildList','upList','upBadge','upNote','upEmpty','achHead','achGrid','kv','ascBtn','ascBadge','toasts','fx','exportBox','importBox','saveBtn','exportBtn','copyBtn','importBtn','resetBtn','amountSeg','respecBtn','tree','treeLines','tdetail','treeHead','admin','flash','newsBtn','newsBadge','newsOv','newsBody','newsClose','boostList','boxBtn','boxReveal','itemGrid','skinRow','itemsHead','rvIco','rvName','rvSub'].forEach(id=>{els[id]=document.getElementById(id);});
const tabs=[...document.querySelectorAll('.tab')];
const panes={};document.querySelectorAll('.pane').forEach(p=>{panes[p.dataset.pane]=p;});
document.getElementById('logo').innerHTML=art('cookie');
document.querySelector('.nico').innerHTML=art('news');

const fxOk=()=>S.opt.fx&&!S.opt.eco&&!reduced;
function selectTab(id){
  if(S.seen&&!S.seen[id]){S.seen[id]=1;}
  tabs.forEach(t=>{const on=t.dataset.tab===id;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;});
  Object.keys(panes).forEach(k=>{panes[k].hidden=k!==id;});
  render();
}
tabs.forEach(t=>t.addEventListener('click',()=>{selectTab(t.dataset.tab);if(innerWidth<=720){const st=document.querySelector('.store'),r=st.getBoundingClientRect();if(r.top>innerHeight*.45||r.bottom<120) st.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});}}));
{const TABICO={build:'rolling',up:'spark',work:'chef',orders:'scroll',world:'moon',ach:'crown',shop:'coin',asc:'star'};
 tabs.forEach(t=>{const k=TABICO[t.dataset.tab];if(k&&!t.querySelector('.tico')) t.insertAdjacentHTML('afterbegin','<span class="tico" aria-hidden="true">'+art(k)+'</span>');});}
tabs.forEach((t,i)=>t.addEventListener('keydown',e=>{
  const vis=tabs.filter(x=>!x.hidden),k=vis.indexOf(t);
  let n=null;
  if(e.key==='ArrowRight') n=vis[(k+1)%vis.length];
  else if(e.key==='ArrowLeft') n=vis[(k+vis.length-1)%vis.length];
  else if(e.key==='Home') n=vis[0];
  else if(e.key==='End') n=vis[vis.length-1];
  if(!n) return;
  const j=tabs.indexOf(n);
  e.preventDefault();selectTab(tabs[j].dataset.tab);tabs[j].focus();
}));

const NTF=[];let ntfUnread=0,ntfSig='';
function toast(text,gold,force){
  NTF.push({t:Date.now(),text,gold:!!gold});if(NTF.length>60) NTF.shift();if(document.getElementById('ntfOv').hidden) ntfUnread++;
  const O=(typeof S!=='undefined'&&S&&S.opt)||{},mode=O.ntf||'all';
  if(!force&&(mode==='off'||(mode==='imp'&&!gold))) return;
  const el=document.createElement('div');el.className='toast'+(gold?' gold':'');el.textContent=text;
  els.toasts.appendChild(el);
  while(els.toasts.children.length>3) els.toasts.firstChild.remove();
  setTimeout(()=>el.remove(),((O.ntfT||5)*1000)-400);
}

/* ---- Animationen ---- */
function anim(el,kf,opt,done){
  if(!el||!el.animate){if(done) done();return null;}
  const a=el.animate(kf,opt);
  if(done) a.onfinish=done;
  return a;
}
let fxCount=0;
function floater(x,y,text,cls){
  if(!fxOk()||fxCount>40) return;
  fxCount++;
  const f=document.createElement('div');f.className='float'+(cls?' '+cls:'');f.textContent=text;
  f.style.left=x+'px';f.style.top=y+'px';
  document.body.appendChild(f);
  const sx=rand(-30,30);
  anim(f,[{transform:'translate(-50%,-50%) scale(.5)',opacity:0},{transform:'translate(-50%,-110%) scale(1.2)',opacity:1,offset:.2},{transform:'translate(calc(-50% + '+sx+'px),-260%) scale(1)',opacity:0}],{duration:950,easing:'ease-out'},()=>{f.remove();fxCount--;});
}
function crumbs(x,y,n){if(!fxOk()) return;fxCrumbs(x,y,n,.8);}
let confN=0;
function confetti(n){
  if(!fxOk()) return;
  const cols=['#ffb347','#5fd39a','#5aa0d8','#e0566f','#b48cf2','#f1d36a'];
  for(let i=0;i<n;i++){
    if(confN>140) return;
    confN++;
    const c=document.createElement('div');c.className='conf';
    c.style.left=(Math.random()*100)+'vw';c.style.background=cols[i%cols.length];
    document.body.appendChild(c);
    const dx=rand(-80,80),rot=rand(-540,540),dur=rand(1400,2400);
    anim(c,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate('+dx+'px,'+(innerHeight+40)+'px) rotate('+rot+'deg)',opacity:.9}],{duration:dur,delay:rand(0,400),easing:'cubic-bezier(.3,.6,.6,1)',fill:'backwards'},()=>{c.remove();confN--;});
  }
}
function shake(){
  if(!fxOk()||S.opt.shake===false) return;
  const w=document.querySelector('.wrap');
  anim(w,[{transform:'translate(0,0)'},{transform:'translate(-7px,3px)'},{transform:'translate(6px,-4px)'},{transform:'translate(-4px,2px)'},{transform:'translate(3px,-1px)'},{transform:'translate(0,0)'}],{duration:420,easing:'ease-out'});
}
function burst(x,y,n){
  if(!fxOk()) return;
  for(let i=0;i<n;i++){
    if(fxCount>60) return;
    fxCount++;
    const s=document.createElement('div');s.className='spark';
    s.style.left=x+'px';s.style.top=y+'px';
    document.body.appendChild(s);
    const a=Math.random()*Math.PI*2,d=rand(40,110);
    anim(s,[{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(calc(-50% + '+Math.cos(a)*d+'px),calc(-50% + '+Math.sin(a)*d+'px)) scale(.2)',opacity:0}],{duration:rand(500,850),easing:'ease-out'},()=>{s.remove();fxCount--;});
  }
}
let ripples=0;
function ripple(x,y){
  if(!fxOk()||ripples>6) return;
  ripples++;
  const r=els.cookieStage.getBoundingClientRect();
  const el=document.createElement('div');el.className='ripple';
  el.style.left=(x-r.left)+'px';el.style.top=(y-r.top)+'px';
  els.cookieStage.appendChild(el);
  anim(el,[{transform:'scale(.2)',opacity:.9},{transform:'scale(3)',opacity:0}],{duration:520,easing:'ease-out'},()=>{el.remove();ripples--;});
}
function squish(){
  if(!fxOk()) return;
  const sv=els.cookie.firstElementChild;if(!sv) return;
  const rot=(Math.random()<.5?-1:1)*rand(1,3);
  anim(sv,[{transform:'scale(1)'},{transform:'scale(.92) rotate('+rot+'deg)',offset:.35},{transform:'scale(1.04) rotate('+(-rot/2)+'deg)',offset:.7},{transform:'scale(1)'}],{duration:240,easing:'ease-out'});
}
let buyFxT=0;
function buyFx(r,big){
  if(!fxOk()) return;
  const now=performance.now();if(!big&&now-buyFxT<140) return;buyFxT=now;
  const ic=r.querySelector('.ico')||r,rc=ic.getBoundingClientRect(),x=rc.left+rc.width/2,y=rc.top+rc.height/2;
  anim(ic,[{transform:'scale(1) rotate(0deg)'},{transform:'scale(1.28) rotate(-9deg)',offset:.35},{transform:'scale(.94) rotate(4deg)',offset:.7},{transform:'scale(1) rotate(0deg)'}],{duration:440,easing:'ease-out'});
  fxRing(x,y,big?'rgba(255,200,80,1)':'rgba(255,225,140,1)',big);fxSparks(x,y,big?16:6,big?'#ffd257':'#ffe9a6');
  const pr=r.querySelector('.price');if(pr){const pc=pr.getBoundingClientRect();fxSparks(pc.left+pc.width/2,pc.top+pc.height/2,big?8:3,'#fff1b8');}
  const old=r.querySelector('.rshine');if(old) old.remove();
  const sh=document.createElement('i');sh.className='rshine';r.appendChild(sh);setTimeout(()=>sh.remove(),650);
}
function upFx(r){
  if(!fxOk()) return;
  const ic=r.querySelector('.ico');if(!ic) return;
  const rc=ic.getBoundingClientRect(),cs=getComputedStyle(ic),g=ic.cloneNode(true),x=rc.left+rc.width/2,y=rc.top+rc.height/2;
  g.classList.add('upghost');
  g.style.cssText='position:fixed;margin:0;left:'+rc.left+'px;top:'+rc.top+'px;width:'+rc.width+'px;height:'+rc.height+'px;border-radius:'+cs.borderRadius+';background:'+cs.background;
  g.querySelectorAll('.tag').forEach(t=>t.remove());
  const sv=ic.querySelector('svg');if(sv){const sr=sv.getBoundingClientRect();g.querySelectorAll('svg').forEach(s=>{s.style.width=sr.width+'px';s.style.height=sr.height+'px';});}
  document.body.appendChild(g);
  fxRing(x,y,'rgba(200,160,255,1)',true);fxSparks(x,y,18,'#e2ccff');fxSparks(x,y,8,'#ffe27a');
  anim(g,[{transform:'scale(1) rotate(0deg)',opacity:1},{transform:'translateY(-16px) scale(1.65) rotate(-8deg)',opacity:1,offset:.35},{transform:'translateY(-80px) scale(.5) rotate(12deg)',opacity:0}],{duration:780,easing:'cubic-bezier(.2,.8,.3,1)'},()=>g.remove());
  setTimeout(()=>{if(g.isConnected) g.remove();},1200);
}
function bump(el){if(fxOk()) anim(el,[{transform:'scale(1)'},{transform:'scale(1.035)',borderColor:'#f1b24a',offset:.4},{transform:'scale(1)'}],{duration:300,easing:'ease-out'});}
function nope(el){snd('nope');sndAny=performance.now();if(fxOk()) anim(el,[{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(5px)'},{transform:'translateX(-3px)'},{transform:'translateX(0)'}],{duration:260});}
function flash(power,dur){if(fxOk()) anim(els.flash,[{opacity:0},{opacity:power,offset:.25},{opacity:0}],{duration:dur||700,easing:'ease-out'});}

/* Kekse im Hintergrund */
const rain={ctx:null,sprite:null,parts:[],acc:0,last:0,w:0,h:0};
(function initRain(){
  const sp=document.createElement('canvas');sp.width=sp.height=48;
  const g=sp.getContext('2d');
  const gr=g.createRadialGradient(18,16,2,24,24,22);gr.addColorStop(0,'#f6cf80');gr.addColorStop(.6,'#e3a24c');gr.addColorStop(1,'#b87725');
  g.fillStyle=gr;g.strokeStyle='#8f5a1b';g.lineWidth=2;g.beginPath();g.arc(24,24,21,0,Math.PI*2);g.fill();g.stroke();
  g.fillStyle='#4b2a16';[[16,17,3.4],[30,15,3],[32,29,3.4],[17,31,3],[25,24,2.4]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,Math.PI*2);g.fill();});
  rain.sprite=sp;rain.ctx=els.rain.getContext('2d');
  /* Sparsam: Größe nur bei Änderung messen, nicht zeichnen, wenn der Bereich nicht zu sehen ist, und 30 Bilder pro Sekunde reichen. */
  rain.vis=true;rain.mw=0;rain.mh=0;
  try{new IntersectionObserver(es=>{rain.vis=es[es.length-1].isIntersecting;}).observe(els.rain);}catch(e){}
  try{new ResizeObserver(es=>{const r=es[es.length-1].contentRect;rain.mw=Math.round(r.width);rain.mh=Math.round(r.height);}).observe(els.rain);}catch(e){}
  function loop(ts){
    requestAnimationFrame(loop);
    if(ts-rain.last<30) return;
    const dt=Math.min(.08,(ts-rain.last)/1000||0);rain.last=ts;
    if(document.hidden||!fxOk()||!rain.vis){if(rain.parts.length){rain.parts.length=0;rain.ctx.clearRect(0,0,rain.w,rain.h);}return;}
    const cv=els.rain,w=rain.mw||cv.clientWidth,h=rain.mh||cv.clientHeight;
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;rain.w=w;rain.h=h;}
    const rate=C.kps>0?Math.min(14,1+Math.log10(1+C.kps)*2.3):0;
    rain.acc+=rate*dt;
    while(rain.acc>=1&&rain.parts.length<45){rain.acc--;rain.parts.push({x:rand(0,w),y:-30,vy:rand(50,130),s:rand(.35,.85),r:rand(0,6.28),vr:rand(-1.4,1.4),a:rand(.3,.7)});}
    if(rain.acc>1) rain.acc=0;
    const ctx=rain.ctx;ctx.clearRect(0,0,w,h);
    for(let i=rain.parts.length-1;i>=0;i--){
      const p=rain.parts[i];p.y+=p.vy*dt;p.r+=p.vr*dt;
      if(p.y>h+30){rain.parts.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.a;ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.scale(p.s,p.s);ctx.drawImage(rain.sprite,-24,-24);ctx.restore();
    }
  }
  requestAnimationFrame(loop);
})();

/* Keks zeichnen */
function rng(seed){return()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;}
function cookieSVG(sk,uid){
  if(sk&&sk.custom&&!sk.c){try{sk=customSkin();}catch(e){sk=null;}}
  if(!sk||!sk.c) sk=SKINS[0];uid=uid||'cg';
  const r=rng(11),cx=100,cy=100,N=40,pts=[];
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2,rad=86+(r()-.5)*5+Math.sin(a*5+1)*1.6;
    pts.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]);
  }
  let d='';
  for(let i=0;i<N;i++){
    const p0=pts[i],p1=pts[(i+1)%N],m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];
    if(i===0){const pl=pts[N-1];d+='M'+((pl[0]+p0[0])/2).toFixed(1)+' '+((pl[1]+p0[1])/2).toFixed(1);}
    d+=' Q'+p0[0].toFixed(1)+' '+p0[1].toFixed(1)+' '+m[0].toFixed(1)+' '+m[1].toFixed(1);
  }
  d+='Z';
  const chips=[];let guard=0;
  while(chips.length<12&&guard++<400){
    const a=r()*Math.PI*2,rad=Math.sqrt(r())*64,x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
    if(chips.every(c=>Math.hypot(c[0]-x,c[1]-y)>25)) chips.push([x,y]);
  }
  let g='';
  if(sk.noChips) chips.length=0;
  chips.forEach(([x,y])=>{
    if(sk.heart){g+='<path d="M'+x.toFixed(1)+' '+(y+7).toFixed(1)+'c-9-6-11-10-8-14 2.5-3 6-2 8 1 2-3 5.5-4 8-1 3 4 1 8-8 14z" fill="'+sk.chip+'" stroke="'+sk.chipS+'" stroke-width="1"/>';return;}
    const k=5+Math.floor(r()*2);let p='';
    for(let i=0;i<k;i++){
      const a=i/k*Math.PI*2+r()*.5,rr=6+r()*5;
      p+=(i?'L':'M')+(x+Math.cos(a)*rr).toFixed(1)+' '+(y+Math.sin(a)*rr*.8).toFixed(1);
    }
    g+='<path d="'+p+'Z" fill="'+sk.chip+'" stroke="'+sk.chipS+'" stroke-width="1" stroke-linejoin="round"/>';
    g+='<ellipse cx="'+(x-2).toFixed(1)+'" cy="'+(y-2.5).toFixed(1)+'" rx="2.6" ry="1.4" fill="'+sk.hi+'" opacity=".8"/>';
  });
  let specks='';
  for(let i=0;i<34;i++){
    const a=r()*Math.PI*2,rad=Math.sqrt(r())*76;
    specks+='<circle cx="'+(cx+Math.cos(a)*rad).toFixed(1)+'" cy="'+(cy+Math.sin(a)*rad).toFixed(1)+'" r="'+(0.8+r()*1.3).toFixed(1)+'" fill="'+sk.speck+'" opacity=".55"/>';
  }
  return '<svg viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="'+uid+'" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="'+sk.c[0]+'"/><stop offset=".5" stop-color="'+sk.c[1]+'"/><stop offset="1" stop-color="'+sk.c[2]+'"/></radialGradient></defs>'
    +'<path d="'+d+'" fill="url(#'+uid+')" stroke="'+sk.stroke+'" stroke-width="3"/>'
    +'<circle cx="100" cy="100" r="76" fill="none" stroke="#ffe3a8" stroke-opacity=".35" stroke-width="2" stroke-dasharray="3 6"/>'
    +specks+g+cookieExtras(sk,uid,d,r)+'</svg>';
}
function cookieExtras(sk,uid,d,r){
  let s='';
  const G=sk.glaze,T=sk.top;
  if((G&&(G.col||G.rainbow))||(T&&T.cols)) s+='<defs><clipPath id="'+uid+'c"><path d="'+d+'"/></clipPath></defs><g clip-path="url(#'+uid+'c)">';
  else return '';
  if(G&&(G.col||G.rainbow)){
    const RB=['#ff6b6b','#ffb347','#ffe66d','#7fd69b','#5aa0d8','#b48cf2'];
    for(let i=0;i<5;i++){
      const y0=40+i*28;let p='M10 '+y0;
      for(let x=10;x<=190;x+=20) p+=' L'+(x+10)+' '+(y0+(((x/20)%2)?-9:9));
      s+='<path d="'+p+'" fill="none" stroke="'+(G.rainbow?RB[i%RB.length]:G.col)+'" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>';
    }
  }
  if(T&&T.cols){
    for(let i=0;i<46;i++){
      const a=r()*Math.PI*2,rad=Math.sqrt(r())*74,x=100+Math.cos(a)*rad,y=100+Math.sin(a)*rad,col=T.cols[Math.floor(r()*T.cols.length)],rot=Math.floor(r()*180);
      if(T.star) s+='<path d="M'+x.toFixed(1)+' '+(y-4).toFixed(1)+'l1.2 2.8 3 .3-2.3 2 .7 3-2.6-1.6-2.6 1.6.7-3-2.3-2 3-.3z" fill="'+col+'"/>';
      else if(T.flake) s+='<path d="M'+x.toFixed(1)+' '+y.toFixed(1)+'l4-2 2 3-3 3-4-1z" fill="'+col+'" transform="rotate('+rot+' '+x.toFixed(1)+' '+y.toFixed(1)+')"/>';
      else if(T.sugar) s+='<rect x="'+(x-1.4).toFixed(1)+'" y="'+(y-1.4).toFixed(1)+'" width="2.8" height="2.8" fill="'+col+'" opacity=".9" transform="rotate('+rot+' '+x.toFixed(1)+' '+y.toFixed(1)+')"/>';
      else s+='<rect x="'+(x-4).toFixed(1)+'" y="'+(y-1.3).toFixed(1)+'" width="8" height="2.6" rx="1.3" fill="'+col+'" transform="rotate('+rot+' '+x.toFixed(1)+' '+y.toFixed(1)+')"/>';
    }
  }
  return s+'</g>';
}
els.cookie.innerHTML=cookieSVG(S.opt.skin==='custom'?customSkin():(SKINS.find(s=>s.id===S.opt.skin)||SKINS[0]),'cg');
const GOLD_SVG='<svg viewBox="0 0 80 80" aria-hidden="true"><defs><radialGradient id="gg" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff0a8"/><stop offset=".55" stop-color="#f2b92e"/><stop offset="1" stop-color="#b9770f"/></radialGradient></defs><circle cx="40" cy="40" r="36" fill="url(#gg)" stroke="#8a5608" stroke-width="3"/><circle cx="40" cy="40" r="28" fill="none" stroke="#fff3b8" stroke-opacity=".6" stroke-width="2" stroke-dasharray="2 4"/><path d="M40 20l5.6 12.2 13.3 1.4-9.9 9 2.8 13.1L40 48.6 28.2 55.7 31 42.6l-9.9-9 13.3-1.4z" fill="#8a5608" fill-opacity=".55"/></svg>';

/* Klicken */
function doClick(x,y){
  comboHit();
  let g=C.click*comboMul();const crit=critRoll();if(crit) g*=20;
  S.cookies+=g;S.run+=g;S.all+=g;S.clicks++;
  floater(x,y,(crit?tt('KRIT! +','CRIT! +'):'+')+fmtRate(g),crit?'crit':'');clickBurst(x,y,crit);ripple(x,y);squish();snd('click');
  if(fxOk()) anim(els.count,[{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:170,easing:'ease-out'});
}
els.cookie.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0) return;
  doClick(e.clientX,e.clientY);
});
els.cookie.addEventListener('keydown',e=>{
  if((e.key===' '||e.key==='Enter')&&!e.repeat){
    e.preventDefault();
    const r=els.cookie.getBoundingClientRect();
    doClick(r.left+r.width/2+rand(-30,30),r.top+r.height/2+rand(-30,30));
  }
});
els.cookie.addEventListener('click',e=>e.preventDefault());

/* Goldkeks */
let goldEl=null,goldTimer=null;
function addBuff(id,tm){
  S.buffs=S.buffs.filter(f=>f.id!==id);
  S.buffs.push({id,t:tm});
  recalc();
}
function applyGold(kind){
  const pw=C.goldPower;
  if(kind==='build'){
    const mx=Math.max(...S.b),v=Math.round((1+mx/25)*10)/10,t0=Math.round(30*pw*C.buffTime);
    addBuff('g_build',t0);const bf=S.buffs.find(f=>f.id==='g_build');if(bf) bf.v=v;recalc();
    toast(tt('Gebäude-Rausch! Produktion ×','Building rush! Production ×')+v.toLocaleString(LOC[LANG])+tt(' für ',' for ')+t0+' s',true);return;
  }
  if(kind==='rain'){
    const gain=C.kps0*600*pw*C.luck;addCk(gain);toast(tt('Keks-Regen! +','Cookie rain! +')+fmt(gain),true);
    if(fxOk()) for(let i=0;i<14;i++) setTimeout(()=>crumbs(Math.random()*innerWidth,Math.random()*innerHeight*.5,4),i*70);
    return;
  }
  if(kind==='gift'){
    const g=3+Math.floor(Math.random()*8);addMat('gem',g);let ex='';
    if(S.all>=BOX_UNLOCK&&Math.random()<.25){rollItem();ex=tt(' und ein Gegenstand',' and an item');}
    toast(tt('Glücks-Geschenk: +','Lucky gift: +')+g+' '+matName('gem')+ex,true);confetti(15);return;
  }
  if(kind==='frenzy'){const t0=Math.round(77*pw*C.buffTime);addBuff('frenzy',t0);toast(tr('g_frenzy',{t:t0}),true);}
  else if(kind==='lucky'){
    const gain=(Math.min(S.cookies*.15,C.kps0*600)+13)*pw*C.luck;
    S.cookies+=gain;S.run+=gain;S.all+=gain;
    toast(tr('g_lucky',{n:fmt(gain)}),true);
  }else{const t0=Math.round(13*pw*C.buffTime);addBuff('clickfrenzy',t0);toast(tr('g_click',{t:t0}),true);}
}
let noStar=false;
function goldenClick(){
  S.gold++;snd('gold');addPP(1);
  if(artUnl()&&Math.random()<.04) giveFrag(1,tt('Goldkeks','Golden cookie'));
  const r=Math.random();
  const fxs=UP.filter(u=>u.kind==='goldfx'&&S.up[u.id]).map(u=>u.fx);
  applyGold(fxs.length&&Math.random()<.3?fxs[Math.floor(Math.random()*fxs.length)]:r<.4?'frenzy':r<.8?'lucky':'click');
  if(!noStar) starRoll(.02,tt('Goldkeks','Golden cookie'));
  if(S.all>=BOX_UNLOCK&&Math.random()<.05){toast(tr('box_drop'),true);rollItem();}
}
function spawnGolden(){
  if(goldEl) return;
  const el=document.createElement('button');
  el.type='button';el.className='golden';el.setAttribute('aria-label',tr('gold_label'));el.innerHTML=GOLD_SVG;
  el.style.left=(16+Math.random()*Math.max(10,innerWidth-104))+'px';
  el.style.top=(70+Math.random()*Math.max(10,innerHeight-230))+'px';
  el.addEventListener('click',()=>{
    const r=el.getBoundingClientRect();
    clearTimeout(goldTimer);el.remove();goldEl=null;
    burst(r.left+r.width/2,r.top+r.height/2,18);flash(.35,600);
    goldenClick();render();
  });
  document.body.appendChild(el);goldEl=el;
  goldTimer=setTimeout(()=>{
    el.classList.add('fade');
    setTimeout(()=>{el.remove();if(goldEl===el) goldEl=null;},650);
  },C.goldLife*1000);
}

/* Boosts, Items, Designs */
let lootSig='',lastDraw=null,lastAdmFill=0;
const P10=k=>10*Math.pow(2,S.pc[k]||0);
const pcInc=k=>{S.pc[k]=(S.pc[k]||0)+1;};
const BPRICE={turbo:5e5,sugar:1e6,wmana:5e6,wmon:1e7,wgrow:1.5e7,sale:1e8,wexp:2e8,magnet:1e9,wegg:2e9,goldb:1e10,wevent:3e10,cap:1e11,chill:1e12};
const boostCost=b=>BPRICE[b.id]||1e6;
const boostDur=b=>Math.round(b.dur*C.durM);
const boxCost=()=>Math.ceil(P10('box')*C.boxM);
const lvlOf=id=>Math.min(5,S.items[id]||0);
function mmss(s){const t=Math.ceil(s),m=Math.floor(t/60);return m+':'+String(t%60).padStart(2,'0');}
function buffName(id){
  if(id==='g_build'){const f=S.buffs.find(x=>x.id==='g_build');return tt('Gebäude-Rausch ×','Building Rush ×')+((f&&f.v)||1.5).toLocaleString(LOC[LANG]);}
  if(id==='frenzy') return tr('buff_frenzy');
  if(id==='clickfrenzy') return tr('buff_click');
  if(id==='s_click') return tt('Klickschwung ×10','Click Swing ×10');
  if(id==='s_sale') return tt('Preisnachlass −20 %','Price Cut −20%');
  if(id==='s_time') return tt('Zeitwirbel ×5','Time Whirl ×5');
  const b=BOOSTS.find(x=>x.buff===id);return b?tx(b.label):id;
}
function itemText(it,L){
  if(it.abs) return tx(it.tpl).replace('{x}',fmt(it.v*L));
  const v=it.k==='goldLife'?it.v*L:it.v*100*L;
  return tx(it.tpl).replace('{x}',(Math.round(v*10)/10).toLocaleString(LOC[LANG]));
}
function wBoostCan(id){
  const w=S.w;
  if(id==='wmana') return w.mana<maxMana()*.9;
  if(id==='wmon') return w.mon.st==='idle';
  if(id==='wgrow') return w.gar.plots.some(p=>p&&plantStage(p)==='grow');
  if(id==='wexp') return w.exp.slots.some(s=>s&&s.end>Date.now()+2000);
  if(id==='wegg') return !!(w.pet.egg&&w.pet.egg.end>Date.now()+2000);
  if(id==='wevent') return !w.ev.cur;
  return true;
}
function wBoostDo(id){
  const w=S.w,now=Date.now();
  if(id==='wmana'){w.mana=maxMana();toast(tt('Mana ist voll.','Mana is full.'),true);}
  else if(id==='wmon') spawnMon();
  else if(id==='wgrow'){
    w.gar.plots.forEach(p=>{if(p&&plantStage(p)==='grow'){const rest=plantGrow(plantDef(p))*1000-(now-p.at);p.at-=rest*.5;}});
    recalc();toast(tt('Die Pflanzen wachsen schneller.','The plants grow faster.'),true);
  }
  else if(id==='wexp'){w.exp.slots.forEach(s=>{if(s&&s.end>now) s.end=now+(s.end-now)*.5;});toast(tt('Rückenwind für die Expeditionen!','Tailwind for the expeditions!'),true);}
  else if(id==='wegg'){w.pet.egg.end=now+(w.pet.egg.end-now)*.4;toast(tt('Das Ei wird warm.','The egg gets warm.'),true);}
  else if(id==='wevent') startEvent();
}
function useBoost(b){
  if(S.all<b.unlock||(S.boostCd[b.id]||0)>0) return false;
  if(b.id==='goldb'&&goldEl){toast(tr('toast_nogold'));return false;}
  const c=boostCost(b);
  if(S.cookies<c) return false;
  if(b.world&&!wBoostCan(b.id)){toast(tt('Das bringt gerade nichts.','That would do nothing right now.'));return false;}
  S.cookies-=c;
  if(b.id==='chill') S.boostCd={};
  S.boostCd[b.id]=b.cd*C.cdM;
  if(b.buff){addBuff(b.buff,boostDur(b));toast(tr('toast_boost',{n:tx(b.label)}),true);}
  else if(b.id==='goldb') spawnGolden();
  else if(b.id==='cap'){const g=C.kps0*300;S.cookies+=g;S.run+=g;S.all+=g;toast(tr('toast_cap',{n:fmt(g)}),true);}
  else if(b.world) wBoostDo(b.id);
  else toast(tr('toast_chill'),true);
  flash(.16,500);
  return true;
}
function renderReveal(){
  const d=lastDraw;
  els.boxReveal.hidden=!d;
  if(!d) return;
  const it=d.it;
  els.boxReveal.className='reveal r-'+it.rar;
  els.rvIco.innerHTML=art(it.art);
  els.rvName.innerHTML=tx(it.name)+' <span class="rar" style="font-weight:600;font-size:13px">· '+tx(RAR[it.rar].n)+'</span>';
  els.rvSub.textContent=d.max?tr('box_max',{n:fmt(d.g)}):d.fresh?tr('box_new')+' '+itemText(it,1):tr('box_up',{l:d.lvl})+' '+itemText(it,d.lvl);
}
function giveItem(it){
  S.rolls++;
  const have=S.items[it.id]||0;
  let info;
  if(have>=5){const g=C.kps0*180+1000;S.cookies+=g;S.run+=g;S.all+=g;info={it,max:true,g};}
  else{S.items[it.id]=have+1;recalc();info={it,fresh:have===0,lvl:have+1};}
  lastDraw=info;lootSig='';
  renderReveal();
  toast(tr('box_found',{n:tx(it.name)}),['epic','legendary','mythic'].includes(it.rar));
  if(fxOk()){
    anim(els.rvIco,[{transform:'scale(.2) rotate(-50deg)',opacity:0},{transform:'scale(1.3) rotate(10deg)',opacity:1,offset:.6},{transform:'scale(1) rotate(0)'}],{duration:620,easing:'ease-out'});
    const r=els.rvIco.getBoundingClientRect();
    if(!panes.shop.hidden) burst(r.left+r.width/2,r.top+r.height/2,it.rar==='legendary'?26:it.rar==='epic'?16:8);
  }
  if(it.rar==='legendary'||it.rar==='mythic') flash(.4,900);
  checkAch(false);
  return info;
}
function rollItem(){
  let r=Math.random()*Object.values(RAR).reduce((a,x)=>a+x.w,0),rar='common',acc=0;
  for(const k in RAR){acc+=RAR[k].w;if(r<acc){rar=k;break;}}
  const pool=ITEMS.filter(i=>i.rar===rar);
  return giveItem(pool[Math.floor(Math.random()*pool.length)]);
}
const boostRows=[];
BOOSTS.forEach((b,i)=>{
  const el=document.createElement('button');
  el.type='button';el.className='row boost owned';el.dataset.b=b.id;el.style.setProperty('--d',(-i*.45)+'s');
  el.innerHTML='<span class="ico">'+art(b.art)+'</span><span class="info"><span class="nm"><span class="bn"></span></span><span class="sub bd"></span></span><span class="price"><span class="pv"></span><span class="pq"></span></span>';
  (b.world?els.boostListW:els.boostList).appendChild(el);
  boostRows.push({el,bn:el.querySelector('.bn'),bd:el.querySelector('.bd'),pv:el.querySelector('.pv'),pq:el.querySelector('.pq')});
});
[els.boostList,els.boostListW].forEach(list=>list.addEventListener('click',e=>{
  const r=e.target.closest('.row');if(!r) return;
  const b=BOOSTS.find(x=>x.id===r.dataset.b);
  if(useBoost(b)){render();bump(r);const rc=r.getBoundingClientRect();burst(rc.left+34,rc.top+rc.height/2,10);}
  else nope(r);
}));
els.boxBtn.addEventListener('click',()=>{
  if(S.all<BOX_UNLOCK){nope(els.boxBtn);return;}
  const c=boxCost();
  if(S.cookies<c){nope(els.boxBtn);return;}
  S.cookies-=c;pcInc('box');rollItem();render();
});
const ITEM_GEM={common:4,rare:10,epic:25,legendary:60,mythic:200};
const itemGemCost=it=>ITEM_GEM[it.rar]*((S.items[it.id]||0)+1);
function renderStars(){
  const s=S.w.star,open=S.all>=STAR_UNLOCK,own=STAR_ITEMS.filter(x=>s.shop[x.id]).length;
  els.starTitle.textContent=tt('Sternen-Laden','Star Shop');
  els.wBoostTitle.textContent=tt('Welt-Boosts','World Boosts');
  els.wBoostNote.textContent=tt('Kurze Hilfen für Monster, Garten, Expeditionen, Eier und Ereignisse. Sie kosten Kekse.','Short helpers for monsters, garden, expeditions, eggs and events. They cost cookies.');
  els.starHead.innerHTML='<span class="mat starmat">'+art('star')+tt('Sternenkrümel','Star crumbs')+': <b>'+s.n+'</b></span><span class="mat">'+tt('Insgesamt gefunden','Found in total')+': <b>'+s.all+'</b></span><span class="mat">'+tt('Gekauft','Bought')+': <b>'+own+' / '+STAR_ITEMS.length+'</b></span>';
  els.starNote.textContent=open?tt('Sternenkrümel sind sehr selten und bleiben auch nach dem Aufstieg. Damit kaufst du dauerhafte Verbesserungen für die Welt.','Star crumbs are very rare and stay after ascension. Use them to buy permanent upgrades for the World tab.'):tt('Sternenkrümel erscheinen ab '+fmt(STAR_UNLOCK)+' Keksen insgesamt.','Star crumbs start to appear at '+fmt(STAR_UNLOCK)+' cookies baked in total.');
  els.starEarnHead.textContent=tt('So findest du Sternenkrümel','How to find star crumbs');
  els.starEarn.innerHTML='<ul class="earn">'
   +'<li><b>'+tt('Goldkeks','Golden cookie')+'</b>: '+tt('2 % Chance pro Klick','2% chance per click')+'</li>'
   +'<li><b>'+tt('Monster','Monsters')+'</b>: '+tt('1,5 % Chance, bei Bossen 15 %','1.5% chance, 15% for bosses')+'</li>'
   +'<li><b>'+tt('Schwere Aufträge','Hard orders')+'</b>: '+tt('6 % Chance','6% chance')+'</li>'
   +'<li><b>'+tt('Expeditionen','Expeditions')+'</b>: '+tt('Sternenbäckerei 4 %, Krümelabgrund 12 %','Star Bakery 4%, Crumb Abyss 12%')+'</li>'
   +'<li><b>'+tt('Challenges','Challenges')+'</b>: '+tt('+3 beim ersten Mal','+3 the first time')+'</li>'
   +'<li><b>'+tt('Aufstieg','Ascension')+'</b>: '+tt('+1 bei jedem 5. Aufstieg','+1 on every 5th ascension')+'</li>'
   +'<li><b>'+tt('Erfolge','Achievements')+'</b>: '+tt('+1 für je 25 Erfolge','+1 for every 25 achievements')+'</li>'
   +'</ul>';
  els.starShop.innerHTML=STAR_ITEMS.map(it=>{
    const has=!!s.shop[it.id],ok=starAvail(it),lk=it.need&&own<it.need&&!has;
    const foot=has?'<span class="own-t">'+tt('Gekauft','Bought')+'</span>':'<button type="button" class="btn sm cost'+(ok?' primary':' dis')+(ok&&starArm.id===it.id?' armed':'')+'" data-sbuy="'+it.id+'">'+(ok&&starArm.id===it.id?tt('Sicher? Nochmal tippen','Sure? Tap again'):it.c+' '+tt('Sternenkrümel','star crumbs'))+'</button>';
    return '<div class="scard'+(has?' own':'')+(lk?' lk':'')+'"><span class="ico">'+art('star')+'</span><span class="info"><span class="nm"><span>'+tx(it.n)+'</span></span><span class="sub">'+tx(it.d)+'</span>'+foot+'</span></div>';
  }).join('');
}
let starArm={id:'',t:0};
els.starShop.addEventListener('click',e=>{
  const b=e.target.closest('[data-sbuy]');if(!b) return;
  const id=b.dataset.sbuy,it=STAR_ITEMS.find(x=>x.id===id);
  if(S.opt.ask&&it&&starAvail(it)&&!(starArm.id===id&&Date.now()-starArm.t<4000)){starArm={id,t:Date.now()};lootSig='';render();setTimeout(()=>{if(starArm.id===id){starArm={id:'',t:0};lootSig='';}},4100);return;}
  starArm={id:'',t:0};
  if(buyStar(b.dataset.sbuy)) render();else nope(b);
});
function buyItem(id){
  const it=ITEMS.find(x=>x.id===id),L=S.items[id]||0,c=itemGemCost(it);
  if(!it||L>=5||S.w.mat.gem<c) return false;
  S.w.mat.gem-=c;S.items[id]=L+1;recalc();lastDraw=null;lootSig='';
  toast(tr('box_found',{n:tx(it.name)}),['epic','legendary','mythic'].includes(it.rar));
  checkAch(false);return true;
}
els.itemGrid.addEventListener('click',e=>{
  const b=e.target.closest('[data-buy]');if(!b) return;
  if(buyItem(b.dataset.buy)){render();}else nope(b);
});
els.skinRow.addEventListener('click',e=>{
  const b=e.target.closest('.skin');if(!b||b.disabled) return;
  S.opt.skin=b.dataset.s;setSkin();lootSig='';render();
});
function customSkin(cd){
  cd=cd||S.opt.cd;const D=DOUGHS[cd.d]||DOUGHS[0],K=CHIPS[cd.c]||CHIPS[0],G=GLAZES[cd.g]||GLAZES[0],T=TOPS[cd.t]||TOPS[0];
  return {id:'custom',custom:1,name:['Eigenes Design','My design'],c:D.c,stroke:D.stroke,speck:D.speck,chip:K.chip,chipS:K.chipS,hi:K.hi,noChips:!!K.none,heart:!!K.heart,glaze:G,top:T};
}
const skinOf=()=>S.opt.skin==='custom'?customSkin():(SKINS.find(s=>s.id===S.opt.skin)||SKINS[0]);
function setSkin(){els.cookie.innerHTML=cookieSVG(skinOf(),'cg');}
function starAvail(it){return !S.w.star.shop[it.id]&&S.w.star.n>=it.c&&(!it.need||Object.keys(S.w.star.shop).length>=it.need);}
function buyStar(id){
  const it=STAR_ITEMS.find(x=>x.id===id),s=S.w.star;
  if(!it||!starAvail(it)) return false;
  s.n-=it.c;s.shop[id]=1;recalc();lootSig='';
  toast(tt('Gekauft: ','Bought: ')+tx(it.n),true);flash(.2,600);
  return true;
}
function updLoot(){
  els.shDot.hidden=!STAR_ITEMS.some(starAvail);
  if(panes.shop.hidden) return;
  BOOSTS.forEach((b,i)=>{
    const r=boostRows[i],locked=S.all<b.unlock,cd=S.boostCd[b.id]||0,cost=boostCost(b);
    r.el.classList.toggle('locked',locked);
    r.el.classList.toggle('can',!locked&&cd<=0&&S.cookies>=cost);
    r.bn.textContent=locked?'???':tx(b.name);
    r.bd.textContent=locked?tr('locked_from',{n:fmt(b.unlock)}):tx(b.desc).replace('{d}',b.buff?boostDur(b):'');
    r.pv.textContent=locked?'':fmt(cost);
    r.pq.textContent=locked?'':cd>0?tr('boost_cd',{t:mmss(cd)}):tr('boost_activate');
  });
  const bc=boxCost(),boxOk=S.all>=BOX_UNLOCK;
  els.boxBtn.textContent=boxOk?tr('box_btn',{c:fmt(bc)}):tr('box_locked',{n:fmt(BOX_UNLOCK)});
  els.boxBtn.style.opacity=boxOk&&S.cookies>=bc?'1':'.6';
  const unlocked=SKINS.filter(s=>S.all>=s.need).length;
  const sig=LANG+'|'+JSON.stringify(S.items)+'|'+S.opt.skin+'|'+unlocked+'|'+S.w.mat.gem+'|'+JSON.stringify(S.w.star)+'|'+(S.all>=STAR_UNLOCK)+'|'+starArm.id;
  if(sig===lootSig) return;
  lootSig=sig;
  const got=ITEMS.filter(i=>S.items[i.id]).length;
  renderStars();
  els.itemsHead.textContent=tr('items_title',{a:got,b:ITEMS.length});els.itemsNote.textContent=tr('items_note');
  els.itemGrid.innerHTML=ITEMS.map(it=>{
    const L=lvlOf(it.id),has=L>0;
    const gc=itemGemCost(it),buy=L>=5?'<span class="sub">'+tr('item_max')+'</span>':'<button type="button" class="btn sm" data-buy="'+it.id+'" data-need="'+gc+'">'+tr('buy_gems',{n:gc})+'</button>';
    return '<div class="icard r-'+it.rar+(has?'':' lock')+'"><span class="ico">'+art(it.art)+'</span><span class="info"><span class="nm"><span>'+tx(it.name)+'</span></span><span class="sub rar">'+tx(RAR[it.rar].n)+(has?' · '+tr('level',{l:L}):'')+'</span><span class="sub">'+itemText(it,Math.min(5,L+1||1))+'</span><span class="pips">'+[1,2,3,4,5].map(n=>'<i'+(n<=L?' class="on"':'')+'></i>').join('')+'</span><span class="buyline">'+buy+'</span></span></div>';
  }).join('');
  els.skinRow.innerHTML=SKINS.map((s,i)=>{
    const ok=S.all>=s.need,on=s.id===skinOf().id;
    return '<button type="button" class="skin'+(on?' on':'')+'" data-s="'+s.id+'"'+(ok?'':' disabled')+'>'+cookieSVG(s.custom?customSkin():s,'sk'+i)+'<span>'+tx(s.name)+'</span><small>'+(on?tr('skin_on'):ok?'':tr('skin_need',{n:fmt(s.need)}))+'</small></button>';
  }).join('');
  renderReveal();
}

/* Kundenaufträge */
function avatarSVG(c){
  const hr=c.hair,sk=c.skin;
  let back='',front='';
  if(c.style==='long') back='<rect x="16" y="20" width="32" height="28" rx="12" fill="'+hr+'"/>';
  if(c.style==='bun') back='<circle cx="32" cy="10" r="6" fill="'+hr+'"/>';
  if(c.style==='long'||c.style==='bun'||c.style==='short') front='<path d="M18 27a14 14 0 0 1 28 0c-4-6-10-8-14-8s-10 2-14 8z" fill="'+hr+'"/>';
  if(c.style==='cap') front='<path d="M18 27a14 14 0 0 1 28 0z" fill="#d9573f"/><path d="M30 27h22" stroke="#d9573f" stroke-width="4" stroke-linecap="round"/>';
  if(c.style==='toque') front='<rect x="20" y="10" width="24" height="10" rx="3" fill="#fff"/><circle cx="24" cy="10" r="6" fill="#fff"/><circle cx="32" cy="7" r="7" fill="#fff"/><circle cx="40" cy="10" r="6" fill="#fff"/><rect x="19" y="18" width="26" height="5" fill="#f0f3f5"/>';
  if(c.style==='hat') front='<ellipse cx="32" cy="21" rx="21" ry="4.5" fill="#c9a46a"/><path d="M22 21a10 10 0 0 1 20 0z" fill="#c9a46a"/><rect x="22" y="18" width="20" height="3" fill="#b5654a"/>';
  const gl=c.glasses?'<circle cx="26" cy="29" r="4.4" fill="none" stroke="#5b6b75" stroke-width="1.6"/><circle cx="38" cy="29" r="4.4" fill="none" stroke="#5b6b75" stroke-width="1.6"/><path d="M30.4 29h3.2" stroke="#5b6b75" stroke-width="1.6"/>':'';
  const st=c.stache?'<path d="M26 36q6-3 12 0q-3 3-6 1q-3 2-6-1z" fill="'+hr+'"/>':'';
  return '<svg viewBox="0 0 64 64" aria-hidden="true">'+back
   +'<path d="M8 64c0-14 10-20 24-20s24 6 24 20z" fill="'+c.shirt+'"/><rect x="28" y="38" width="8" height="8" rx="3" fill="'+sk+'"/>'
   +'<circle cx="32" cy="28" r="14" fill="'+sk+'"/>'+front
   +'<circle cx="26" cy="29" r="1.8" fill="#2a1a12"/><circle cx="38" cy="29" r="1.8" fill="#2a1a12"/>'+gl
   +'<path d="M27 37.5q5 4 10 0" fill="none" stroke="#9b5a45" stroke-width="1.8" stroke-linecap="round"/>'+st+'</svg>';
}
function nice(n){const e=Math.pow(10,Math.max(0,Math.floor(Math.log10(Math.max(1,n)))-1));return Math.max(1,Math.round(n/e)*e);}
function genOrder(){
  const r=Math.random(),diff=r<.45?'easy':r<.85?'mid':'hard';
  const type=ORD_TYPES[Math.floor(Math.random()*3)],D=ORD_D[diff];
  let target,time;
  if(type==='bake'){time=D.T;const cv=Math.min(C.click,1+C.kps0*.25);target=nice(Math.max(D.rmin,(C.kps0+3*cv)*time*D.f));}
  else if(type==='click'){time=D.clk[1];target=nice(Math.min(time*8,Math.max(D.clk[0],ordCps*time*D.cf)));}
  else{time=D.buy[1];const owned=S.b.reduce((a,n)=>a+n,0);target=Math.max(D.buy[0],Math.ceil(owned*D.bp));}
  return {c:Math.floor(Math.random()*CUST.length),type,diff,target,time,cookies:Math.ceil(Math.max(D.rmin,C.kps0*D.rc)),rep:D.rep,item:diff==='hard',st:'offer',t:0,sa:0,sc:0,sb:0};
}
/* V41: Aufträge wachsen mit der Runde mit */
let ordCps=2,ordLastClicks=null;
setInterval(()=>{if(ordLastClicks===null){ordLastClicks=S.clicks;return;}const d=Math.max(0,S.clicks-ordLastClicks);ordLastClicks=S.clicks;if(d>0||ordCps>.3) ordCps=ordCps*.92+d*.08;},1000);
const ordBusy=()=>1/(1+.25*(S.orders.heat||0));
function ordReward(s){
  const D=ORD_D[s.diff]||ORD_D.easy;
  const cap=Math.max(Math.max(S.run,0)*D.cap,D.rmin);
  return Math.ceil(Math.min(C.kps0*D.rc*WFX.ord*qualOrd(),cap)*ordBusy()*GEV.orders);
}
function ensureOrders(){S.orders.slots.forEach((s,i)=>{if(!s) S.orders.slots[i]=genOrder();});}
function ordProg(s){
  const v=s.type==='bake'?S.all-s.sa:s.type==='click'?S.clicks-s.sc:S.bought-s.sb;
  return Math.max(0,v);
}
function acceptOrder(i){
  const sl=S.orders.slots;
  if(sl.filter(s=>s&&s.st==='active').length>=2){toast(tr('ord_max'));return false;}
  const s=sl[i];if(!s||s.st!=='offer') return false;
  s.st='active';s.t=s.time;s.sa=S.all;s.sc=S.clicks;s.sb=S.bought;
  return true;
}
function completeOrder(i){
  const s=S.orders.slots[i];if(!s) return;
  const g=ordReward(s);
  S.cookies+=g;S.run+=g;S.all+=g;
  S.orders.slots.forEach(o=>{if(o&&o.st==='active'&&o.type==='bake') o.sa+=g;});
  S.orders.rep+=s.rep;S.orders.done++;S.orders.heat=Math.min(20,(S.orders.heat||0)+1);addPP(3);
  if(s.diff==='hard') starRoll(.06,tt('Auftrag','Order'));
  toast(tr('ord_ok',{n:tx(CUST[s.c].n),c:fmt(g)}),true);
  if(s.item){if(S.all>=BOX_UNLOCK){const a0=S.all;rollItem();const extra=S.all-a0;if(extra>g){const cut=extra-g;S.cookies=Math.max(0,S.cookies-cut);S.run-=cut;S.all-=cut;}}else{const x=g;S.cookies+=x;S.run+=x;S.all+=x;}}
  S.orders.slots[i]={st:'cool',t:15,c:s.c};
  recalc();checkAch(false);
}
function tickOrders(dt){
  const O=S.orders;
  if(O.cd>0) O.cd=Math.max(0,O.cd-dt);
  if(O.heat>0) O.heat=Math.max(0,O.heat-dt/240);
  O.slots.forEach((s,i)=>{
    if(!s) return;
    if(s.st==='active'){
      s.t-=dt;
      if(ordProg(s)>=s.target) completeOrder(i);
      else if(s.t<=0){toast(tr('ord_fail',{n:tx(CUST[s.c].n)}));O.slots[i]={st:'cool',t:20,c:s.c};}
    }else if(s.st==='cool'){
      s.t-=dt;if(s.t<=0) O.slots[i]=genOrder();
    }
  });
}
const ordCards=[];
(function(){
  const list=document.getElementById('ordList');
  for(let i=0;i<3;i++){
    const el=document.createElement('div');el.className='order';
    el.innerHTML='<span class="ico oav"></span><span class="info"><span class="nm"><span class="oname"></span><span class="odiff"></span></span><span class="sub otask"></span><span class="sub orew"></span><span class="obar"><i></i></span></span><span class="oact"><button type="button" class="btn sm primary" data-o="'+i+'"></button><span class="ost"></span></span>';
    list.appendChild(el);
    ordCards.push({el,av:el.querySelector('.oav'),nm:el.querySelector('.oname'),df:el.querySelector('.odiff'),task:el.querySelector('.otask'),rew:el.querySelector('.orew'),bar:el.querySelector('.obar'),fill:el.querySelector('.obar i'),btn:el.querySelector('button'),st:el.querySelector('.ost'),key:''});
  }
  list.addEventListener('click',e=>{
    const b=e.target.closest('button[data-o]');if(!b) return;
    if(acceptOrder(+b.dataset.o)){render();bump(b.closest('.order'));}else nope(b);
  });
  const rr=document.getElementById('ordReroll');
  rr.addEventListener('click',()=>{
    if(S.orders.cd>0){nope(rr);return;}
    S.orders.slots.forEach((s,i)=>{if(s&&s.st==='offer') S.orders.slots[i]=genOrder();});
    S.orders.cd=300;render();
  });
})();
function updOrders(){
  if(panes.orders.hidden) return;
  const O=S.orders;
  {const bn=(Math.round(Math.min(15,O.rep*.06)*10)/10).toLocaleString(LOC[LANG]),busy=ordBusy(),os=document.getElementById('ordStats'),
    oh='<span class="obico">'+art('scroll')+'</span><span class="obtx"><b>'+tt('Auftragsbrett','Order board')+'</b><small>'+tr('ord_lead')+'</small></span><span class="ochips"><span class="ochip"><i>'+tt('Ruf','Reputation')+'</i><b>'+fmt(O.rep)+'</b></span><span class="ochip"><i>'+tt('Produktion','Production')+'</i><b>+'+bn+' %</b></span><span class="ochip"><i>'+tt('Erledigt','Done')+'</i><b>'+fmt(O.done)+'</b></span>'+(busy<.97?'<span class="ochip busy" title="'+tt('Viele Aufträge in kurzer Zeit: Die Kunden zahlen gerade weniger. Das erholt sich in ein paar Minuten.','Lots of orders in a short time: customers pay less for now. This recovers within a few minutes.')+'"><i>'+tt('Kunden beschäftigt','Customers busy')+'</i><b>×'+(Math.round(busy*100)/100).toLocaleString(LOC[LANG])+'</b></span>':'')+'</span>';
   if(os._h!==oh){os.innerHTML=oh;os._h=oh;}}
  const rr=document.getElementById('ordReroll');
  rr.textContent=O.cd>0?tr('ord_reroll_cd',{t:mmss(O.cd)}):tr('ord_reroll');
  rr.style.opacity=O.cd>0?'.6':'1';
  ordCards.forEach((c,i)=>{
    const s=O.slots[i];if(!s) return;
    const cu=CUST[s.c],key=s.c+'|'+LANG;
    if(c.key!==key){c.key=key;c.av.innerHTML=avatarSVG(cu);c.nm.textContent=tx(cu.n);}
    c.el.classList.toggle('active',s.st==='active');
    const cool=s.st==='cool';
    c.task.hidden=cool;c.rew.hidden=cool;c.df.hidden=cool;
    c.bar.hidden=s.st!=='active';
    {const dd=cool?'':s.diff;if(c.el.dataset.d!==dd) c.el.dataset.d=dd;}
    if(cool){c.btn.hidden=true;c.st.textContent=tr('ord_cool',{t:mmss(s.t)});return;}
    c.df.className='odiff d-'+s.diff;c.df.textContent=tr('ord_'+s.diff);
    c.task.textContent=tr('ord_'+s.type,{n:fmt(s.target),t:mmss(s.time)});
    c.rew.textContent=tr('ord_reward',{c:fmt(ordReward(s)),r:s.rep})+(s.item?tr('ord_item'):'');
    if(s.st==='offer'){c.btn.hidden=false;c.btn.textContent=tr('ord_accept');c.st.textContent='';}
    else{
      c.btn.hidden=true;
      const p=ordProg(s);
      c.fill.style.width=Math.min(100,p/s.target*100)+'%';
      c.st.textContent=tr('ord_left',{t:mmss(s.t)})+' · '+tr('ord_prog',{a:fmt(p),b:fmt(s.target)});
    }
  });
}

/* Spielwelt: Logik */
const hasLab=id=>!!S.w.lab.done[id];
function plantDef(p){return PLANTS.find(x=>x.id===p.p);}
function plantGrow(d){return envV(curWeather().grow)*UE.grow*d.grow*(hasLab('fert')?.75:1)*(S.w.star.shop.s_herb?.8:1)*(wLv('garden')>=2?.9:1);}
function plantStage(p){
  const d=plantDef(p),age=(Date.now()-p.at)/1000,g=plantGrow(d);
  return age<g?'grow':age<g+d.life?'ripe':'old';
}
function petLvl(id){return S.w.pet.owned[id]||0;}
function petVal(p){return p.v*(1+.3*(petLvl(p.id)-1));}
function calcWFX(){
  const w=S.w,f={prod:1,click:1,gold:1,cost:1,costPost:1,mana:0,manaR:0,exp:1,mon:1,ord:1,vol:1,fee:.03,maxSh:5,slots:2,hatch:1,click0:0,nogold:0,monHp:1,monFast:1,evFast:1,g:{prod:0,click:0,gold:1,cost:1,mana:0}};
  let pp=0,cl=1,gd=1,cs=1;
  const g=f.g;
  w.gar.plots.forEach(p=>{
    if(!p||plantStage(p)!=='ripe') return;
    const d=plantDef(p);
    if(d.prod) g.prod+=d.prod;if(d.click) g.click+=d.click;if(d.gold) g.gold*=d.gold;if(d.cost) g.cost*=d.cost;if(d.mana) g.mana+=d.mana;
  });
  g.prod=Math.min(.12,g.prod);g.click=Math.min(.5,g.click);
  pp+=g.prod;cl*=1+g.click;gd*=g.gold;cs*=g.cost;f.manaR+=g.mana;
  const add=o=>{
    if(o.prod&&o.prod<1) pp+=o.prod;
    if(o.click&&o.click>=1) cl*=o.click;
    if(o.gold) gd*=o.gold;
    if(o.cost) cs*=o.cost;
    if(o.mana&&o.mana>=1) f.mana+=o.mana;
    if(o.exp) f.exp*=o.exp;
    if(o.mon&&o.mon>=1) f.mon*=o.mon;
    if(o.ord) f.ord*=o.ord;
  };
  LABS.forEach(l=>{if(w.lab.done[l.id]){add(l);if(l.trade){f.fee=.015;f.maxSh+=3;}if(l.breed){f.slots=3;f.hatch=.5;}if(l.grow) {}}});
  CRAFTS.forEach(c=>{if(w.craft.done[c.id]) add(c);});
  {const wc=wLv('catcher'),wo=wLv('orders'),wm=wLv('mage'),wb=wLv('broker'),wh=wLv('hunter');
   if(wc>=3) gd*=.95;
   if(wo>=2) f.ord*=wo>=3?1.25:1.1;
   if(wm>=2) f.mana+=20;
   if(wm>=3) f.manaR+=.2;
   if(wh>=3) f.mon*=1.2;
   f.brokerHalf=wb>=3?1:0;}
  {const ph=curPhase(),wx=curWeather();if(ph.mana) f.manaR+=ph.mana*UE.wxMul;f.mon*=envV(ph.mon);f.exp*=envV(wx.exp);}
  f.mon*=UE.monRew;f.exp*=UE.exp;f.mana+=UE.mana;f.manaR+=UE.manaR;f.maxSh+=UE.stockSh;
  const so=w.star.shop;
  if(so.s_mana) f.mana+=30;
  if(so.s_manar) f.manaR+=.25;
  if(so.s_mon) f.mon*=1.4;
  if(so.s_monfast) f.monFast=1.25;
  if(so.s_exp) f.exp*=.85;
  if(so.s_pet) f.slots+=1;
  if(so.s_egg) f.hatch*=.7;
  if(so.s_trade){f.maxSh+=3;f.fee=Math.max(.005,f.fee-.01);}
  if(f.brokerHalf) f.fee*=.5;
  if(so.s_ord) f.ord*=1.2;
  if(so.s_ev) f.evFast=1.4;
  if(so.s_crown) pp+=.04;
  w.pet.eq.forEach(id=>{
    const p=PETS.find(x=>x.id===id);if(!p||!petLvl(id)) return;
    const v=petVal(p);
    if(p.k==='prod') pp+=v;else if(p.k==='click') cl*=1+v;else if(p.k==='gold') gd*=1-v;else if(p.k==='cost') cs*=1-v;else if(p.k==='mana') f.manaR+=v;else if(p.k==='mon') f.mon*=1+v;
  });
  CHALS.forEach(c=>{if(w.chal.done[c.id]){const r=c.rew;if(r.prod) pp+=r.prod;if(r.cost) cs*=r.cost;if(r.gold) gd*=r.gold;}});
  f.prod=1+Math.min(.6,pp);f.click=cl;f.gold=gd;f.cost=cs;
  if(w.ev.cur){
    const e=EVENTS.find(x=>x.id===w.ev.cur.id);
    if(e.prod) f.prod*=e.prod;if(e.gold) f.gold*=e.gold;if(e.cost) f.cost*=e.cost;if(e.mon) f.mon*=e.mon;if(e.ord) f.ord*=e.ord;if(e.vol) f.vol*=e.vol;
  }
  if(w.chal.act){
    const c=CHALS.find(x=>x.id===w.chal.act);
    if(c.prod) f.prod*=c.prod;if(c.cost) f.costPost*=c.cost;if(c.click0) f.click0=1;if(c.nogold) f.nogold=1;
  }
  f.mon=Math.min(3,f.mon);
  f.sig=[f.prod,f.click,f.gold,f.cost,f.costPost,f.mana,f.manaR,f.exp,f.mon,f.ord,f.vol,f.fee,f.maxSh,f.slots,f.click0,f.nogold,f.monFast,f.evFast,f.hatch].map(x=>Math.round(x*1e4)/1e4).join('|');
  return f;
}
const maxMana=()=>Math.min(160,20+Math.floor(S.b.reduce((a,b)=>a+b,0)/10)+WFX.mana);
const manaRegen=()=>(1/12)*(1+WFX.manaR);
function forceGold(){
  if(goldEl||WFX.nogold) return false;
  spawnGolden();return true;
}
function addMat(id,n){if(id==='gem'&&n>0&&S.eg){const m=(1+.03*(S.eg.par.pts.gem||0))*(S.reb.tree.r_gem?1.5:1),x=n*m;n=Math.floor(x)+(Math.random()<x%1?1:0);}S.w.mat[id]+=n;}
function matName(id){return tx(MATS.find(m=>m.id===id).n);}
function matCost(m){return Object.keys(m).map(k=>m[k]+' '+matName(k)).join(', ');}
function canMat(m){return Object.keys(m).every(k=>S.w.mat[k]>=m[k]);}
function payMat(m){Object.keys(m).forEach(k=>{S.w.mat[k]-=m[k];});}

/* Sternenkrümel */
function giveStar(n,src,silent){
  const s=S.w.star;s.n+=n;s.all+=n;lootSig='';
  if(silent) return;
  snd('star');
  toast(tt('Sternenkrümel gefunden! +','Star crumb found! +')+n+(src?' · '+src:''),true);
  flash(.25,800);
}
function starRoll(p,src){if(S.eg) p*=1+.02*(S.eg.par.pts.star||0);if(S.all>=STAR_UNLOCK&&Math.random()<p) giveStar(1,src);}
function starMilestones(){
  const s=S.w.star,ms=Math.floor(Object.keys(S.ach).length/25);
  if(ms>s.ms){const n=ms-s.ms;s.ms=ms;giveStar(n,tt('Erfolge','Achievements'),S.all<STAR_UNLOCK);}
}
/* Monster */
const monHp=()=>{const m=S.w.mon;return Math.max(10,Math.ceil((25+4*Math.min(m.k,60))*(m.boss?3:1)*(hasLab('beast')?.9:1)*UE.monHp));};
const monDmg=()=>1+Math.floor(Math.log10(Math.max(1,C.click)));
const monReward=()=>Math.ceil(Math.max(2000,C.kps0*(15+.75*Math.min(S.w.mon.k,30)))*(S.w.mon.boss?3:1)*WFX.mon);
function monWin(){
  const m=S.w.mon,g=monReward();
  S.book.mon[m.kind]=1;
  if(artUnl()&&Math.random()<.15) giveFrag(1+(Math.random()<.4?1:0),tt('Monster','Monster'));
  if(m.boss){shake();burst(innerWidth/2,innerHeight/2,26);}
  S.cookies+=g;S.run+=g;S.all+=g;
  const th=m.boss?3:(Math.random()<.5?2:1);addMat('tooth',th);
  let extra='';
  if(Math.random()<(m.boss?.4:.05)){S.w.pet.eggs++;extra=' · '+tt('Ein Ei!','An egg!');}
  starRoll(m.boss?.15:.015,m.boss?tt('Boss','Boss'):tt('Monster','Monster'));
  m.k++;m.st='idle';addPP(1);m.next=rand(200,320);
  toast(tt('Monster besiegt! +','Monster beaten! +')+fmt(g)+' · +'+th+' '+matName('tooth')+extra,true);
  checkAch(false);
}
function monLose(){
  const m=S.w.mon,s=Math.min(S.cookies*.02,C.kps0*120);
  S.cookies-=s;m.st='idle';m.next=rand(150,240);
  toast(tt('Das Monster ist mit ','The monster ran off with ')+fmt(s)+tt(' Keksen abgehauen.',' cookies.'));
}
function monHit(el){
  const m=S.w.mon;if(m.st!=='fight') return;
  m.hp-=monDmg();
  if(el) bump(el);
  if(m.hp<=0) monWin();
}
function spawnMon(){
  const m=S.w.mon;m.st='wait';m.kind=Math.floor(Math.random()*MON_KINDS.length);m.boss=((m.k+1)%5===0)?1:0;
  toast(tt('Ein Monster ist aufgetaucht! Schau im Tab „Welt“.','A monster appeared! Check the “World” tab.'));
}

/* Börse */
const stockPrice=i=>Math.max(1,Math.ceil(S.w.mkt.ref*STOCKS[i].f*S.w.mkt.m[i]));
function marketStep(){
  const k=S.w.mkt;
  k.ref=10;
  STOCKS.forEach((s,i)=>{
    if(Math.random()<.12) k.trend[i]=rand(-1,1);
    let m=k.m[i];
    m*=Math.exp((Math.random()-.5)*2*s.vol*WFX.vol+k.trend[i]*.012);
    m+=(1-m)*.05;
    k.m[i]=Math.min(1.8,Math.max(.45,m));
    k.hist[i].push(Math.round(k.m[i]*1000)/1000);if(k.hist[i].length>30) k.hist[i].shift();
  });
}
function seedMarket(){
  const k=S.w.mkt;k.ref=10;
  for(let n=0;n<24;n++) marketStep();
  k.ref=10;k.tick=15;
}
function buyStock(i,n){
  const k=S.w.mkt,p=stockPrice(i),room=WFX.maxSh-k.hold[i];
  n=Math.min(n,room);if(n<=0) return false;
  const cost=Math.ceil(p*n*(1+WFX.fee));
  if(S.cookies<cost) return false;
  S.cookies-=cost;k.hold[i]+=n;k.spent[i]+=cost;return true;
}
function sellStock(i,n){
  const k=S.w.mkt;n=Math.min(n,k.hold[i]);if(n<=0) return false;
  const g=Math.floor(stockPrice(i)*n*(1-WFX.fee)),frac=n/k.hold[i];
  S.cookies+=g;S.run+=g;S.all+=g;k.spent[i]*=1-frac;k.hold[i]-=n;
  if(k.hold[i]<=0){k.hold[i]=0;k.spent[i]=0;}
  return g;
}

/* Expeditionen */
const expCost=d=>P10('e_'+d.id);
const expReward=d=>Math.ceil(Math.max(100,C.kps0*d.dur*.44));
const expDur=d=>d.dur*WFX.exp;
function expStart(did){
  const d=DESTS.find(x=>x.id===did),sl=S.w.exp.slots,i=sl.findIndex(s=>!s);
  if(i<0||S.cookies<expCost(d)) return false;
  S.cookies-=expCost(d);pcInc('e_'+d.id);
  sl[i]={d:did,end:Date.now()+expDur(d)*1000,ok:Math.random()>=d.risk*(wLv('exped')>=2?.75:1)?1:0};
  return true;
}
function expCollect(i){
  const s=S.w.exp.slots[i];if(!s||Date.now()<s.end) return;
  const d=DESTS.find(x=>x.id===s.d);
  S.w.exp.slots[i]=null;S.w.exp.done++;
  if(!s.ok){toast(tt('Die Expedition ist gescheitert: ','The expedition failed: ')+tx(d.n));return;}
  if(artUnl()&&Math.random()<.35) giveFrag(1+Math.floor(Math.random()*3),tt('Expedition','Expedition'));
  const g=expReward(d),gq=d.gems+(wLv('exped')>=3?2:0)+UE.expGem;S.cookies+=g;S.run+=g;S.all+=g;addMat('gem',gq);
  if(d.id==='void') starRoll(.12,tx(d.n));else if(d.id==='star') starRoll(.04,tx(d.n));
  let extra='';
  if(d.item&&Math.random()<d.item){
    if(S.all>=BOX_UNLOCK){rollItem();extra=' · '+tt('Gegenstand!','Item!');}
    else{S.w.pet.eggs++;extra=' · '+tt('Ein Ei!','An egg!');}
  }
  toast(tx(d.n)+': +'+fmt(g)+' · +'+gq+' '+matName('gem')+extra,true);
  checkAch(false);
}

/* Labor */
const labCost=l=>10*Math.pow(2,Object.keys(S.w.lab.done).length+(S.w.lab.cur?1:0));
function labStart(id){
  const l=LABS.find(x=>x.id===id),L=S.w.lab;
  if(L.cur||L.done[id]||S.all<l.unlock||S.cookies<labCost(l)) return false;
  S.cookies-=labCost(l);L.cur={id,end:Date.now()+l.time*1000*(wLv('research')>=3?.7:wLv('research')>=2?.85:1)};return true;
}

/* Begleiter */
function eggStart(){
  const p=S.w.pet;if(p.egg||p.eggs<1) return false;
  p.eggs--;p.egg={end:Date.now()+600000*WFX.hatch};return true;
}
function hatch(){
  const p=S.w.pet;p.egg=null;
  let r=Math.random()*100,rar=0;
  for(let i=0;i<PET_RAR.length;i++){r-=PET_RAR[i].w;if(r<0){rar=i;break;}rar=i;}
  const pool=PETS.filter(x=>x.rar===rar),pet=pool[Math.floor(Math.random()*pool.length)];
  const had=p.owned[pet.id]||0;
  if(had>=5){addMat('gem',3);toast(tx(pet.n)+tt(' ist schon auf Stufe 5. Du bekommst 3 Edelsteine.',' is already level 5. You get 3 gems.'),true);}
  else{p.owned[pet.id]=had+1;toast(had?tx(pet.n)+tt(' ist jetzt Stufe ',' is now level ')+(had+1)+'!':tt('Neuer Begleiter: ','New companion: ')+tx(pet.n)+'!',true);}
  checkAch(false);
}

/* Events */
function startEvent(id){
  const e=id?EVENTS.find(x=>x.id===id):EVENTS[Math.floor(Math.random()*EVENTS.length)];
  S.w.ev.cur={id:e.id,t:EV_DUR};S.w.ev.n++;
  toast(tt('Ereignis: ','Event: ')+tx(e.n)+' – '+tx(e.d),true);
  recalc();
}

/* Herausforderungen */
function chalProgress(c){return Math.min(1,S.run/c.goal);}
function resetRun(gain,chalId){
  const oldUp=S.up;
  const keep={name:S.name,codes:S.codes,lb:S.lb,adm:S.adm,tamp:S.tamp,all:S.all,ach:S.ach,chips:S.chips+gain,asc:S.asc+(gain>0?1:0),opt:S.opt,gold:S.gold,clicks:S.clicks,tree:S.tree,admin:S.admin,items:S.items,rolls:S.rolls,orders:S.orders,bought:S.bought,w:S.w,work:S.work,day:S.day,stat:S.stat,reb:S.reb,tut:S.tut,seen:S.seen,sec:S.sec,pass:S.pass,cos:S.cos,vis:S.vis,book:S.book,hero:S.hero,fr:S.fr,wheel:S.wheel,ttl:S.ttl,eg:S.eg,sys:S.sys,cards:S.cards};
  S=Object.assign(fresh(),keep);
  S.orders.slots=[null,null,null];S.orders.heat=0;
  if(gain>0){S.eg.ascT++;if(egHas('c_keep')) S.up=oldUp;}
  const w=S.w;
  w.gar.plots=[null,null,null,null,null,null];w.mana=0;
  w.mkt.hold=[0,0,0,0,0,0];w.mkt.spent=[0,0,0,0,0,0];
  w.mon.st='idle';w.mon.next=200;w.chal.act=chalId||null;
  if(gain>0) setTimeout(()=>confetti(80),200);
  if(gain>0&&S.asc%5===0) giveStar(1,tt('Aufstieg','Ascension'));
  rebuildAll();seedMarket();S.cookies+=C.startCookies;checkAch(false);render();save();
}

/* Tick */
function offlineWorld(gap){
  const w=S.w;
  w.mana=Math.min(maxMana(),w.mana+gap*manaRegen());
  if(w.mon.st==='idle') w.mon.next=Math.max(0,w.mon.next-gap);
  if(w.ev.cur){w.ev.cur.t-=gap;if(w.ev.cur.t<=0) w.ev.cur=null;}else w.ev.next=Math.max(5,w.ev.next-gap);
}
function tickWorld(dt){
  const w=S.w,now=Date.now();
  w.mana=Math.min(maxMana(),w.mana+dt*manaRegen());
  const m=w.mon;
  if(m.st==='idle'){m.next-=dt*(w.ev.cur&&w.ev.cur.id==='hunt'?4:1)*WFX.monFast;if(m.next<=0){if(S.all>=UNL.world) spawnMon();else m.next=60;}}
  else if(m.st==='fight'){
    m.t-=dt;m.hp-=m.max/90*dt;
    if(m.hp<=0) monWin();else if(m.t<=0) monLose();
  }
  w.mkt.tick-=dt;
  for(let n=0;n<6&&w.mkt.tick<=0;n++){marketStep();w.mkt.tick+=15;}
  if(w.mkt.tick<0) w.mkt.tick=15;
  const L=w.lab;
  if(L.cur&&now>=L.cur.end){const l=LABS.find(x=>x.id===L.cur.id);L.done[l.id]=1;L.cur=null;toast(tt('Forschung fertig: ','Research done: ')+tx(l.n),true);recalc();checkAch(false);}
  const P=w.pet;
  if(P.egg&&now>=P.egg.end) hatch();
  if(!P.egg&&P.eggs>0) eggStart();
  w.exp.slots.forEach((s,i)=>{if(s&&now>=s.end) expCollect(i);});
  w.gar.plots.forEach((p,i)=>{if(p&&plantStage(p)==='old'){S.book.pl[p.p]=1;const d=plantDef(p),hb=d.herb+(wLv('garden')>=3?1:0)+UE.herb;addMat('herb',hb);w.gar.plots[i]=null;toast('+'+hb+' '+matName('herb')+' · '+tx(d.n));recalc();}});
  const E=w.ev;
  if(E.cur){E.cur.t-=dt;if(E.cur.t<=0){E.cur=null;E.next=rand(420,780);toast(tt('Das Ereignis ist vorbei.','The event is over.'));recalc();}}
  else{E.next-=dt*WFX.evFast;if(E.next<=0){if(S.all>=UNL.world) startEvent();else E.next=120;}}
  if(w.chal.act){
    const c=CHALS.find(x=>x.id===w.chal.act);
    if(S.run>=c.goal){w.chal.done[c.id]=1;w.chal.act=null;giveStar(3,tx(c.n));toast(tt('Herausforderung geschafft: ','Challenge complete: ')+tx(c.n)+' – '+tx(c.rd),true);recalc();checkAch(false);}
  }
  const f=calcWFX();
  if(f.sig!==WFX.sig){recalc();}
}
/* Spielwelt: Bilder */
function monsterSVG(k,boss){
  const c=MON_KINDS[k].col;
  let h='<svg viewBox="0 0 120 120" aria-hidden="true">';
  if(k===0) h+='<path d="M30 38l-8-24 20 14zM90 38l8-24-20 14z" fill="'+c+'"/>';
  if(k===1) h+='<path d="M60 26v-14" stroke="'+c+'" stroke-width="4"/><circle cx="60" cy="11" r="6" fill="#f1b24a"/>';
  if(k===2) h+='<circle cx="30" cy="94" r="14" fill="'+c+'"/><circle cx="90" cy="94" r="14" fill="'+c+'"/>';
  if(k===3) h+='<path d="M30 100q-4 14 0 18t8-4zM60 104q-4 12 0 14t6-6zM88 100q-4 14 0 18t8-4z" fill="'+c+'"/>';
  if(k===4) h+='<circle cx="26" cy="46" r="14" fill="'+c+'"/><circle cx="94" cy="46" r="14" fill="'+c+'"/>';
  if(k===5) h+='<path d="M40 30q-4-16 6-24q2 12 10 14q-2-10 8-16q0 14 8 16q6-8 4-14q12 10 4 24z" fill="#f1b24a"/>';
  h+='<path d="M60 24c28 0 46 18 46 44s-18 40-46 40S14 94 14 68s18-44 46-44z" fill="'+c+'" stroke="#00000040" stroke-width="3"/>';
  h+='<path d="M30 52q8-10 20-8" stroke="#ffffff30" stroke-width="5" fill="none" stroke-linecap="round"/>';
  if(k===4) h+='<circle cx="60" cy="56" r="17" fill="#fff"/><circle cx="62" cy="57" r="8" fill="#2a1a12"/><circle cx="65" cy="54" r="2.5" fill="#fff"/>';
  else h+='<circle cx="44" cy="58" r="11" fill="#fff"/><circle cx="76" cy="58" r="11" fill="#fff"/><circle cx="46" cy="60" r="5" fill="#2a1a12"/><circle cx="74" cy="60" r="5" fill="#2a1a12"/>';
  h+='<path d="M36 82q24 22 48 0z" fill="#3a1d12"/><path d="M42 83l4 8 4-7 4 8 4-8 4 8 4-8 4 8 4-8 4 8" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>';
  if(boss) h+='<path d="M34 28l6-18 10 12 10-16 10 16 10-12 6 18z" fill="#f1b24a" stroke="#b5821e" stroke-width="2"/>';
  return h+'</svg>';
}
function petSVG(p){
  const c=p.col,id=p.id;
  let h='<svg viewBox="0 0 64 64" aria-hidden="true">';
  if(id==='milch'||id==='goldi') h+='<path d="M14 26l4-20 14 14zM50 26l-4-20-14 14z" fill="'+c+'"/>';
  else if(id==='mondi') h+='<rect x="18" y="2" width="9" height="28" rx="4.5" fill="'+c+'"/><rect x="37" y="2" width="9" height="28" rx="4.5" fill="'+c+'"/>';
  else if(id==='butter'||id==='krumel') h+='<circle cx="16" cy="18" r="8" fill="'+c+'"/><circle cx="48" cy="18" r="8" fill="'+c+'"/>';
  else if(id==='zimt'||id==='phoenix') h+='<path d="M10 40q-10-8-6-22q10 4 16 14zM54 40q10-8 6-22q-10 4-16 14z" fill="'+(id==='phoenix'?'#f1b24a':'#8a4a30')+'"/>';
  else if(id==='schoko') h+='<path d="M20 20l-4-14 10 8zM44 20l4-14-10 8z" fill="#f1d36a"/>';
  if(id==='goldi') h+='<path d="M50 52q14-2 12-18q-10 6-16 10z" fill="'+c+'"/>';
  if(id==='phoenix') h+='<path d="M24 14q2-10 8-12q6 2 8 12z" fill="#f1b24a"/>';
  h+='<circle cx="32" cy="36" r="24" fill="'+c+'" stroke="#00000030" stroke-width="2"/><ellipse cx="32" cy="44" rx="13" ry="9" fill="#ffffff35"/>';
  h+='<circle cx="24" cy="34" r="3.6" fill="#2a1a12"/><circle cx="40" cy="34" r="3.6" fill="#2a1a12"/><circle cx="25.2" cy="32.8" r="1.2" fill="#fff"/><circle cx="41.2" cy="32.8" r="1.2" fill="#fff"/>';
  h+='<circle cx="17" cy="42" r="3.5" fill="#ff8a8a55"/><circle cx="47" cy="42" r="3.5" fill="#ff8a8a55"/><path d="M28 44q4 4 8 0" fill="none" stroke="#2a1a12" stroke-width="2" stroke-linecap="round"/>';
  return h+'</svg>';
}
function plantSVG(col,stage){
  let h='<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="18" ry="4" fill="#00000030"/>';
  if(stage==='grow') return h+'<path d="M32 56V38" stroke="#5aa85a" stroke-width="3" stroke-linecap="round"/><path d="M32 42q-12-2-14-12q12 0 14 12zM32 38q12-2 14-12q-12 0-14 12z" fill="#7fd69b"/></svg>';
  if(stage==='old') return h+'<path d="M32 56V34q0-8 10-8" stroke="#8a7a52" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 26q8 2 6 10q-8-2-6-10z" fill="#a89a6a"/><path d="M32 46q-8 0-10 8q8 0 10-8z" fill="#8a7a52"/></svg>';
  h+='<path d="M32 56V30" stroke="#5aa85a" stroke-width="3" stroke-linecap="round"/><path d="M32 48q-12 0-14 8q12 0 14-8zM32 44q12 0 14 8q-12 0-14-8z" fill="#7fd69b"/>';
  for(let i=0;i<6;i++){const a=i*60;h+='<ellipse cx="32" cy="16" rx="6" ry="9" fill="'+col+'" transform="rotate('+a+' 32 26)"/>';}
  return h+'<circle cx="32" cy="26" r="6" fill="#f1d36a" stroke="#00000025" stroke-width="1.5"/></svg>';
}
function badgeSVG(letter,col){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="6" width="52" height="52" rx="14" fill="'+col+'" stroke="#00000030" stroke-width="2"/><text x="32" y="43" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="30" fill="#00000075">'+letter+'</text></svg>';
}
function destSVG(col){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="14" fill="'+col+'"/><path d="M4 46q12-16 22-6t20-10q8-4 14 4v22H4z" fill="#00000035"/><path d="M12 40l12-18 8 10 8-14 12 22z" fill="#ffffff45"/></svg>';
}
function matSVG(id){
  if(id==='tooth') return '<svg viewBox="0 0 24 24" class="mi"><path d="M5 5q3-3 7-1q4-2 7 1 1 6-1 10-1 5-3 5-2 0-2-5-1 0-2 0 0 5-2 5-2 0-3-5-2-4-1-10z" fill="#efe6cf" stroke="#00000040"/></svg>';
  if(id==='herb') return '<svg viewBox="0 0 24 24" class="mi"><path d="M12 22V10" stroke="#5aa85a" stroke-width="2"/><path d="M12 14q-8 0-9-8 8 0 9 8zM12 12q8 0 9-8-8 0-9 8z" fill="#7fd69b" stroke="#00000030"/></svg>';
  return '<svg viewBox="0 0 24 24" class="mi"><path d="M12 2l9 8-9 12L3 10z" fill="#7fb8f2" stroke="#00000040"/><path d="M3 10h18M12 2l-4 8 4 12 4-12z" fill="none" stroke="#ffffff70"/></svg>';
}
function sparkline(h,good){
  if(h.length<2) return '';
  const mn=Math.min(...h),mx=Math.max(...h),r=Math.max(.001,mx-mn);
  const pts=h.map((v,i)=>(i/(h.length-1)*100).toFixed(1)+','+(26-(v-mn)/r*24).toFixed(1)).join(' ');
  return '<svg viewBox="0 0 100 28" class="spark" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+pts+'" fill="none" stroke="'+(good?'var(--good)':'var(--warn)')+'" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
}

/* Spielwelt: Oberfläche */
const WSECS=[
  {id:'mon',n:['Monster','Monsters']},{id:'mag',n:['Zauberbuch','Spellbook']},{id:'gar',n:['Garten','Garden']},
  {id:'mk',n:['Börse','Stocks']},{id:'exp',n:['Expeditionen','Expeditions']},{id:'lab',n:['Labor','Lab']},
  {id:'pet',n:['Begleiter','Companions']},{id:'cr',n:['Crafting','Crafting']},{id:'ev',n:['Ereignisse','Events']},{id:'ch',n:['Challenges','Challenges']}
];
let wSub='mon',wSel='sugarbloom',wConf={k:'',t:0};
const wBtn=(label,act,o)=>'<button type="button" class="btn sm'+(o&&o.plain?'':' primary')+'" data-a="'+act+'"'+(o&&o.need!==undefined?' data-need="'+o.need+'"'+(o.res?' data-res="'+o.res+'"':''):'')+'>'+label+'</button>';
const wCard=(art,title,subs,act)=>'<div class="wcard"><span class="ico">'+art+'</span><span class="info"><span class="nm"><span>'+title+'</span></span>'+subs.map(s=>'<span class="sub">'+s+'</span>').join('')+'</span><span class="oact">'+(act||'')+'</span></div>';
const wBar=k=>'<span class="obar"><i data-w="'+k+'"></i></span>';
const wLive=k=>'<span data-l="'+k+'"></span>';
const secs={};
let wA={};
const wHead=(id,title,hint)=>'<h3 class="wt">'+title+(wA[id]?'<i class="dot"></i>':'')+'</h3>'+(hint?'<p class="small wnote">'+hint+'</p>':'');
const wStep=(i,hold,max,price)=>'<div class="step">'+wBtn('−','mk:sell:'+i+':1',{plain:1,need:hold>0?0:1e300})+'<b>'+hold+'/'+max+'</b>'+wBtn('+','mk:buy:'+i+':1',{need:Math.ceil(price*(1+WFX.fee))})+'</div>';

secs.top=()=>{
  const w=S.w,E=w.ev,live={},wid={};
  let h='<div class="mats">'+MATS.map(m=>'<span class="mat">'+matSVG(m.id)+tx(m.n)+': <b>'+w.mat[m.id]+'</b></span>').join('')+'<span class="mat starmat">'+art('star')+tt('Sternenkrümel','Star crumbs')+': <b>'+w.star.n+'</b></span></div>';
  if(E.cur){
    const e=EVENTS.find(x=>x.id===E.cur.id);
    h+='<div class="wbox evbox"><b>'+tt('Ereignis: ','Event: ')+tx(e.n)+'</b><span class="sub">'+tx(e.d)+' · '+wLive('ev')+'</span></div>';
    live.ev=mmss(E.cur.t);
  }else{
    h+='<p class="small">'+tt('Ereignisse (z. B. Backwut oder Goldregen) starten von selbst. Das nächste in etwa ','Events (e.g. Baking Rush or Gold Rain) start on their own. The next one in about ')+wLive('ev')+'</p>';
    live.ev=mmss(E.next);
  }
  return {html:h,live,wid};
};

secs.mon=()=>{
  const m=S.w.mon,live={},wid={};
  let h=wHead('mon',tt('Monster','Monsters'),tt('Besiege Monster durch Klicken. Jedes 5. ist ein Boss. Besiegt: ','Beat monsters by clicking. Every 5th is a boss. Beaten: ')+m.k);
  if(m.st==='idle'){
    h+='<div class="wbox"><span class="sub">'+tt('Das nächste Monster kommt in etwa ','The next monster comes in about ')+wLive('next')+'</span></div>';
    live.next=mmss(m.next);
  }else if(m.st==='wait'){
    const kd=MON_KINDS[m.kind];
    h+=wCard(monsterSVG(m.kind,m.boss),tx(kd.n)+(m.boss?' · BOSS':''),[tt('Leben ','Health ')+fmt(monHp())+' · '+(m.boss?40:30)+' s',tt('Belohnung: ','Reward: ')+fmt(monReward())+' '+tt('Kekse','cookies')],wBtn(tt('Kämpfen','Fight'),'mon:fight'));
  }else{
    h+='<div class="wbox center"><button type="button" class="monster" data-a="mon:hit" aria-label="'+tt('Monster schlagen','Hit monster')+'">'+monsterSVG(m.kind,m.boss)+'</button>'+wBar('hp').replace('class="obar"','class="obar big"')+'<span class="sub">'+wLive('hp')+' · '+wLive('t')+' · '+tt('Schaden pro Klick: ','Damage per click: ')+monDmg()+'</span></div>';
    live.hp=fmt(Math.max(0,Math.ceil(m.hp)))+' / '+fmt(m.max);live.t=Math.max(0,Math.ceil(m.t))+' s';wid.hp=Math.max(0,m.hp/m.max*100);
  }
  return {html:h,live,wid};
};

secs.mag=()=>{
  const w=S.w,live={},wid={},mx=maxMana();
  let h=wHead('mag',tt('Zauberbuch','Spellbook'),tt('Mana lädt von selbst auf (1 alle ','Mana refills on its own (1 every ')+(1/manaRegen()).toFixed(1).replace('.',LANG==='de'?',':'.')+' s).');
  h+='<div class="manarow"><b>Mana</b><span>'+wLive('mana')+'</span></div>'+wBar('mana').replace('class="obar"','class="obar big"');
  live.mana=Math.floor(w.mana)+' / '+mx;wid.mana=w.mana/mx*100;
  h+='<div class="spells">'+SPELLS.map(s=>'<button type="button" class="spell" data-a="mag:'+s.id+'" data-need="'+s.cost+'" data-res="mana"><b>'+tx(s.n)+'</b><span class="sub">'+tx(s.d)+'</span><i>'+s.cost+' Mana'+(mx<s.cost?' · '+tt('braucht ','needs ')+s.cost+tt(' Höchst-Mana',' max mana'):'')+'</i></button>').join('')+'</div>';
  return {html:h,live,wid};
};

const plantCost=d=>P10('p_'+d.id);
secs.gar=()=>{
  const w=S.w,live={},wid={},now=Date.now();
  let h=wHead('gar',tt('Garten','Garden'),tt('Reife Pflanzen helfen dir. Wenn sie verwelken, bekommst du Kräuter. Wähle eine Pflanze und tippe auf ein freies Beet.','Ripe plants help you. When they wither you get herbs. Pick a plant and tap a free plot.'));
  h+='<div class="wnav">'+PLANTS.map(p=>'<button type="button" class="chip'+(wSel===p.id?' on':'')+'" data-a="gar:sel:'+p.id+'">'+tx(p.n)+'</button>').join('')+'</div>';
  const sd=PLANTS.find(p=>p.id===wSel);
  h+='<p class="small" style="margin:0 0 8px">'+tx(sd.eff)+' · '+tt('wächst ','grows ')+mmss(plantGrow(sd))+' · '+tt('reif ','ripe ')+mmss(sd.life)+' · '+fmt(plantCost(sd))+'</p><div class="wgrid">';
  for(let i=0;i<6;i++){
    if(S.all<PLOT_UNLOCK[i]){h+='<div class="plot lock"><span class="sub">'+tt('Ab ','From ')+fmt(PLOT_UNLOCK[i])+'</span></div>';continue;}
    const p=w.gar.plots[i];
    if(!p){h+='<button type="button" class="plot empty" data-a="gar:plant:'+i+'" data-need="'+plantCost(sd)+'">+ '+tx(sd.n)+'</button>';continue;}
    const d=plantDef(p),st=plantStage(p),age=(now-p.at)/1000,g=plantGrow(d);
    h+='<div class="plot"><button type="button" class="px" data-a="gar:take:'+i+'" title="'+(st==='ripe'?tt('Ernten','Harvest'):tt('Entfernen','Remove'))+'">'+(st==='ripe'?'✓':'×')+'</button><span class="ico">'+plantSVG(d.col,st)+'</span><b>'+tx(d.n)+'</b><span class="sub">'+wLive('p'+i)+'</span>'+wBar('p'+i)+'</div>';
    if(st==='grow'){live['p'+i]=tt('wächst ','growing ')+mmss(g-age);wid['p'+i]=age/g*100;}
    else{live['p'+i]=tt('reif ','ripe ')+mmss(Math.max(0,g+d.life-age));wid['p'+i]=100-(age-g)/d.life*100;}
  }
  h+='</div>';
  const g=WFX.g,eff=[];
  if(g.prod) eff.push(tt('Produktion +','Production +')+Math.round(g.prod*100)+' %');
  if(g.click) eff.push(tt('Klick +','Click +')+Math.round(g.click*100)+' %');
  if(g.gold<1) eff.push(tt('Gold ','Gold ')+Math.round((1-g.gold)*100)+tt(' % schneller',' % faster'));
  if(g.cost<1) eff.push(tt('Gebäude −','Buildings −')+Math.round((1-g.cost)*1000)/10+' %');
  if(g.mana) eff.push('Mana +'+Math.round(g.mana*100)+' %');
  if(eff.length) h+='<p class="wstat small" style="margin-top:8px">'+tt('Aktiv: ','Active: ')+eff.join(' · ')+'</p>';
  return {html:h,live,wid};
};

secs.exp=()=>{
  const w=S.w,live={},wid={},now=Date.now();
  let h=wHead('exp',tt('Expeditionen','Expeditions'),tt('Reisende bringen Kekse und Edelsteine. Sie kommen von selbst zurück. Zwei gleichzeitig.','Explorers bring cookies and gems. They return on their own. Two at a time.'));
  w.exp.slots.forEach((s,i)=>{
    if(!s) return;
    const d=DESTS.find(x=>x.id===s.d),left=Math.max(0,(s.end-now)/1000);
    live['e'+i]=tt('noch ','left ')+mmss(left);wid['e'+i]=100-left/expDur(d)*100;
    h+=wCard(destSVG(d.col),tx(d.n),[wLive('e'+i),wBar('e'+i)],'');
  });
  const free=w.exp.slots.filter(s=>!s).length;
  h+='<div class="list">'+DESTS.map(d=>wCard(destSVG(d.col),tx(d.n),[mmss(expDur(d))+' · '+tt('Risiko ','Risk ')+Math.round(d.risk*100)+' % · '+fmt(expReward(d))+' + '+d.gems+' '+matName('gem')+(d.item?' · '+tt('Chance auf Gegenstand','item chance'):'')],wBtn(fmt(expCost(d)),'exp:go:'+d.id,{need:free?expCost(d):1e300}))).join('')+'</div>';
  return {html:h,live,wid};
};

secs.mk=()=>{
  const k=S.w.mkt,live={},wid={};
  let h=wHead('mk',tt('Börse','Stocks'),tt('Kaufe billig, verkaufe teuer. Gebühr ','Buy low, sell high. Fee ')+String(WFX.fee*100).replace('.',LANG==='de'?',':'.')+' %. '+tt('Beim Aufstieg gehen Aktien verloren.','Shares are lost when you ascend.'));
  h+='<div class="list">'+STOCKS.map((s,i)=>{
    const p=stockPrice(i),hist=k.hist[i],last=hist[hist.length-1]||1,prev=hist[hist.length-2]||last,chg=(last/prev-1)*100;
    const val=Math.floor(p*k.hold[i]*(1-WFX.fee)),pl=k.hold[i]?val-k.spent[i]:0;
    return wCard(badgeSVG(s.n[0][0],s.col),tx(s.n)+' <span class="chg '+(chg>=0?'up':'dn')+'">'+(chg>=0?'+':'')+chg.toFixed(1).replace('.',LANG==='de'?',':'.')+' %</span>',
      [fmt(p)+sparkline(hist,last>=1)+(k.hold[i]?' · '+(pl>=0?'+':'−')+fmt(Math.abs(pl)):'')],wStep(i,k.hold[i],WFX.maxSh,p));
  }).join('')+'</div><div class="btns" style="margin-top:8px;align-items:center">'+wBtn(tt('Alles verkaufen','Sell all'),'mk:sellall',{plain:1})+'<span class="small">'+tt('Neue Kurse in ','New prices in ')+wLive('tick')+'</span></div>';
  live.tick=Math.ceil(Math.max(0,k.tick))+' s';
  return {html:h,live,wid};
};

secs.lab=()=>{
  const L=S.w.lab,live={},wid={},now=Date.now(),doneN=Object.keys(L.done).length;
  let h=wHead('lab',tt('Labor','Lab'),tt('Dauerhafte Boni, die auch nach dem Aufstieg bleiben. Ein Projekt gleichzeitig. Fertig: ','Permanent bonuses that stay after ascending. One project at a time. Done: ')+doneN+' / '+LABS.length);
  let n=0,next=null,more=0;
  LABS.forEach(l=>{
    if(L.done[l.id]) return;
    if(n>=3&&!(L.cur&&L.cur.id===l.id)&&S.all>=l.unlock){more++;return;}
    const art=badgeSVG(tx(l.n)[0],'#5aa0d8');
    if(L.cur&&L.cur.id===l.id){live.l=tt('noch ','left ')+mmss(Math.max(0,(L.cur.end-now)/1000));wid.l=100-Math.max(0,L.cur.end-now)/1000/l.time*100;h+=wCard(art,tx(l.n),[tx(l.d),wLive('l'),wBar('l')],'');n++;}
    else if(S.all>=l.unlock){h+=wCard(art,tx(l.n),[tx(l.d)+' · '+mmss(l.time)],wBtn(fmt(labCost(l)),'lab:go:'+l.id,{need:L.cur?1e300:labCost(l)}));n++;}
    else if(!next) next=l;
  });
  if(more) h+='<p class="small" style="margin-top:6px">'+tt('Noch ','Another ')+more+tt(' weitere Forschungen warten.',' more researches are waiting.')+'</p>';
  if(next) h+='<p class="small" style="margin-top:6px">'+tt('Nächste Forschung ab ','Next research from ')+fmt(next.unlock)+tt(' Keksen',' cookies')+'</p>';
  else if(!n&&!more) h+='<p class="small">'+tt('Alles erforscht!','All researched!')+'</p>';
  return {html:h,live,wid};
};

secs.pet=()=>{
  const P=S.w.pet,live={},wid={},now=Date.now(),slots=WFX.slots;
  let h=wHead('pet',tt('Begleiter','Companions'),tt('Eier brüten von selbst. Tippe einen Begleiter an, um ihn mitzunehmen ('+P.eq.length+' / '+slots+'). Doppelte steigen eine Stufe.','Eggs hatch on their own. Tap a companion to bring it along ('+P.eq.length+' / '+slots+'). Duplicates level up.'));
  h+='<div class="wline"><span>'+tt('Eier: ','Eggs: ')+'<b>'+P.eggs+'</b>'+(P.egg?' · '+tt('brütet ','hatching ')+wLive('egg'):'')+'</span>'+wBtn(tt('Ei kaufen · 12 ','Buy egg · 12 ')+matName('gem'),'pet:buy',{need:12,res:'gem',plain:1})+'</div>';
  if(P.egg){live.egg=mmss(Math.max(0,(P.egg.end-now)/1000));wid.egg=100-Math.max(0,P.egg.end-now)/(600000*WFX.hatch)*100;h+=wBar('egg');}
  h+='<div class="pgrid">'+PETS.map(p=>{
    const L=petLvl(p.id),rar=PET_RAR[p.rar];
    if(!L) return '<div class="pet lock"><span class="ico"><svg viewBox="0 0 64 64"><circle cx="32" cy="34" r="22" fill="#2a3038"/><text x="32" y="44" text-anchor="middle" font-size="26" font-weight="800" fill="#98a2ad">?</text></svg></span><span class="info"><b>???</b><span class="sub" style="color:'+rar.col+'">'+tx(rar.n)+'</span></span></div>';
    const on=P.eq.includes(p.id),val=petVal(p),pct=p.k==='cost'||p.k==='gold'?'−':'+';
    return '<button type="button" class="pet'+(on?' on':'')+'" data-a="pet:eq:'+p.id+'"><span class="ico">'+petSVG(p)+'</span><span class="info"><b>'+tx(p.n)+' <span class="lvl">'+L+'</span></b><span class="sub">'+tx(p.d)+' '+pct+(Math.round(val*1000)/10).toString().replace('.',LANG==='de'?',':'.')+' %</span></span></button>';
  }).join('')+'</div>';
  return {html:h,live,wid};
};

secs.cr=()=>{
  const w=S.w;
  let h=wHead('cr',tt('Crafting','Crafting'),tt('Baue Ausrüstung aus Zähnen, Kräutern und Edelsteinen. Sie bleibt nach dem Aufstieg.','Craft gear from teeth, herbs and gems. You keep it after ascending.'));
  const open=CRAFTS.filter(c=>!w.craft.done[c.id]),built=CRAFTS.filter(c=>w.craft.done[c.id]);
  h+='<div class="list">'+open.slice(0,4).map(c=>wCard(badgeSVG(tx(c.n)[0],'#c9a46a'),tx(c.n),[tx(c.d)+' · '+matCost(c.m)],wBtn(tt('Bauen','Craft'),'cr:make:'+c.id,{need:canMat(c.m)?0:1e300}))).join('')
   +POTIONS.map(p=>wCard(badgeSVG(tx(p.n)[0],'#e58a4b'),tx(p.n),[tx(p.d)+' · '+matCost(p.m)],wBtn(tt('Trinken','Drink'),'cr:drink:'+p.id,{need:canMat(p.m)?0:1e300,plain:1}))).join('')+'</div>';
  if(open.length>4) h+='<p class="small" style="margin-top:8px">'+tt('Noch ','Another ')+(open.length-4)+tt(' Ausrüstungen folgen.',' more gear pieces follow.')+'</p>';
  if(built.length) h+='<p class="small" style="margin-top:8px">'+tt('Gebaut: ','Built: ')+built.map(c=>tx(c.n)).join(', ')+'</p>';
  return {html:h,live:{},wid:{}};
};

secs.ch=()=>{
  const C2=S.w.chal,live={},wid={};
  let h=wHead('ch','Challenges',tt('Starte einen neuen Durchlauf mit Erschwernis (das ist ein Aufstieg). Schaffst du das Ziel, bekommst du einen dauerhaften Bonus.','Start a new run with a handicap (this is an ascension). Reach the goal for a permanent bonus.'));
  const done=CHALS.filter(c=>C2.done[c.id]);
  h+='<div class="list">'+CHALS.filter(c=>!C2.done[c.id]).map(c=>{
    const art=badgeSVG(tx(c.n)[0],'#d9573f'),subs=[tx(c.d)+' · '+tt('Ziel ','Goal ')+fmt(c.goal),tt('Belohnung: ','Reward: ')+tx(c.rd)];
    if(C2.act===c.id){live.c=fmt(S.run)+' / '+fmt(c.goal);wid.c=chalProgress(c)*100;return wCard(art,tx(c.n)+' · '+tt('läuft','running'),[subs[0],wLive('c'),wBar('c')],wBtn(tt('Abbrechen','Cancel'),'ch:cancel',{plain:1}));}
    const key='ch'+c.id,armedNow=wConf.k===key&&Date.now()-wConf.t<5000;
    return wCard(art,tx(c.n),subs,wBtn(armedNow?tt('Sicher?','Sure?'):tt('Starten','Start'),'ch:start:'+c.id));
  }).join('')+'</div>';
  if(done.length) h+='<p class="small" style="margin-top:8px">'+tt('Geschafft: ','Completed: ')+done.map(c=>tx(c.n)).join(', ')+'</p>';
  return {html:h,live,wid};
};

function mount(el,r,have){
  if(el._h!==r.html){el.innerHTML=r.html;el._h=r.html;el._lv=[...el.querySelectorAll('[data-l]')];el._wd=[...el.querySelectorAll('[data-w]')];el._nd=[...el.querySelectorAll('[data-need]')];}
  el._lv.forEach(n=>{const v=r.live[n.dataset.l];if(v!==undefined&&n.textContent!==v) n.textContent=v;});
  el._wd.forEach(n=>{const v=r.wid[n.dataset.w];if(v!==undefined) n.style.width=Math.max(0,Math.min(100,v))+'%';});
  el._nd.forEach(n=>{n.classList.toggle('dis',(have[n.dataset.res||'cookies']||0)<+n.dataset.need);});
}
function wAttn(){return {mon:S.w.mon.st==='wait'};}
const WORDER=['mon','mag','gar','exp','mk','lab','pet','cr','ch'];
const wEls={top:document.getElementById('wTop'),body:document.getElementById('wBody'),dot:document.getElementById('wDot'),secs:{}};
WORDER.forEach(id=>{const s=document.createElement('section');s.className='wsec';wEls.body.appendChild(s);wEls.secs[id]=s;});
function updWorld(){
  wA=wAttn();
  wEls.dot.hidden=!(Object.values(wA).some(Boolean)||advReady()||frEmpty());
  if(panes.world.hidden) return;
  updMap();
  if(wSubV!=='world') return;
  const have={cookies:S.cookies,mana:S.w.mana};MATS.forEach(m=>{have[m.id]=S.w.mat[m.id];});
  mount(wEls.top,secs.top(),have);
  WORDER.forEach(id=>{const el=wEls.secs[id],on=id===wSelSec;if(el.hidden===on) el.hidden=!on;if(on) mount(el,secs[id](),have);});
}
function cast(id){
  const sp=SPELLS.find(x=>x.id===id),w=S.w;
  if(w.mana<sp.cost||maxMana()<sp.cost) return false;
  if(id==='gold'&&!forceGold()){toast(tt('Gerade kann kein Goldkeks erscheinen.','No golden cookie can appear right now.'));return false;}
  w.mana-=sp.cost;w.casts++;
  if(id==='bake'){const g=Math.min(S.cookies*.05,C.kps0*20)+13;S.cookies+=g;S.run+=g;S.all+=g;toast(tt('Backzauber: +','Bake Spell: +')+fmt(g),true);}
  else if(id==='click') addBuff('s_click',20);
  else if(id==='sale') addBuff('s_sale',60);
  else if(id==='time') addBuff('s_time',25);
  checkAch(false);
  return true;
}
function worldAction(a,el){
  const p=a.split(':'),s=p[0],w=S.w;
  if(s==='mon'&&p[1]==='hit'){monHit(el);return;}
  let ok=true;
  if(s==='nav'){wSub=p[1];}
  else if(s==='mon'){
    if(p[1]==='fight'&&w.mon.st==='wait'){const m=w.mon;m.max=m.hp=monHp();m.t=m.boss?40:30;m.st='fight';}
    else if(p[1]==='hit') monHit(el);
  }
  else if(s==='mag') ok=cast(p[1]);
  else if(s==='gar'){
    if(p[1]==='sel') wSel=p[2];
    else if(p[1]==='plant'){
      const i=+p[2],d=PLANTS.find(x=>x.id===wSel),c=plantCost(d);
      if(w.gar.plots[i]||S.cookies<c) ok=false;else{S.cookies-=c;pcInc('p_'+d.id);w.gar.plots[i]={p:d.id,at:Date.now()};recalc();}
    }else if(p[1]==='take'){
      const i=+p[2],pl=w.gar.plots[i];if(pl){
        const d=plantDef(pl),st=plantStage(pl),n0=st==='ripe'?d.herb:st==='old'?Math.floor(d.herb/2):0,n=n0?n0+(wLv('garden')>=3?1:0)+UE.herb:0;
        if(n){addMat('herb',n);S.book.pl[pl.p]=1;}w.gar.plots[i]=null;recalc();if(n) toast('+'+n+' '+matName('herb'));
      }
    }
  }
  else if(s==='mk'&&p[1]==='sellall'){ok=false;for(let i=0;i<6;i++) if(w.mkt.hold[i]>0&&sellStock(i,99)!==false) ok=true;}
  else if(s==='mk'){
    const i=+p[2],n=+p[3];
    if(p[1]==='buy') ok=buyStock(i,n);else ok=sellStock(i,n)!==false&&w.mkt.hold[i]>=0;
  }
  else if(s==='exp'){if(p[1]==='go') ok=expStart(p[2]);else expCollect(+p[2]);}
  else if(s==='lab') ok=labStart(p[2]);
  else if(s==='pet'){
    if(p[1]==='egg') ok=eggStart();
    else if(p[1]==='buy'){if(w.mat.gem>=12){w.mat.gem-=12;w.pet.eggs++;}else ok=false;}
    else if(p[1]==='eq'){
      const i=w.pet.eq.indexOf(p[2]);
      if(i>=0) w.pet.eq.splice(i,1);else if(w.pet.eq.length<WFX.slots) w.pet.eq.push(p[2]);else{toast(tt('Alle Plätze sind belegt.','All slots are used.'));ok=false;}
      recalc();
    }
  }
  else if(s==='cr'){
    if(p[1]==='make'){const c=CRAFTS.find(x=>x.id===p[2]);if(w.craft.done[c.id]||!canMat(c.m)) ok=false;else{payMat(c.m);w.craft.done[c.id]=1;recalc();toast(tt('Gebaut: ','Crafted: ')+tx(c.n),true);checkAch(false);}}
    else if(p[1]==='drink'){
      const c=POTIONS.find(x=>x.id===p[2]);
      if(!canMat(c.m)) ok=false;
      else if(c.id==='p_gold'&&!forceGold()){toast(tt('Gerade kann kein Goldkeks erscheinen.','No golden cookie can appear right now.'));ok=false;}
      else{payMat(c.m);if(c.id==='p_sugar') addBuff('b_sugar',30);else if(c.id==='p_click') addBuff('s_click',20);}
    }
  }
  else if(s==='ch'){
    if(p[1]==='cancel'){w.chal.act=null;recalc();}
    else{
      const key='ch'+p[2];
      if(wConf.k===key&&Date.now()-wConf.t<5000){wConf={k:'',t:0};resetRun(chipsPotential(),p[2]);return;}
      wConf={k:key,t:Date.now()};
    }
  }
  if(!ok&&el) nope(el);
  recalc();render();
}
document.getElementById('worldPane').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b||b.closest('#advBox,#frBox')) return;
  worldAction(b.dataset.a,b);
});

function evChip(){
  const e=S.w.ev.cur;if(!e) return '';
  return '<span class="buff ev">'+tx(EVENTS.find(x=>x.id===e.id).n)+' · '+tr('secs',{n:Math.ceil(e.t)})+'</span>';
}
function ensureWorld(){if(!S.w.mkt.hist[0].length) seedMarket();}
/* Neuigkeiten */
function buildNews(){
  const tag=k=>'<span class="ntag k-'+k+'">'+tr(k==='new'?'news_k_new':'news_k_change')+'</span>';
  els.newsBody.innerHTML=NEWS.map(n=>
    '<section class="nv"><h3>'+tr('version',{n:n.v})+(n.v===NEWS_VER?'<span class="newtag">'+tr('news_tag')+'</span>':'')+'</h3><p class="nsum">'+tx(n.sum)+'</p><ul>'
    +n.items.map(t=>{
      const txt=(LANG==='de'?t[1]:t[2]).replace('{u}',UP.length),i=txt.indexOf(': ');
      return '<li>'+tag(t[0])+(i>0?'<b>'+txt.slice(0,i+1)+'</b>'+txt.slice(i+1):txt)+'</li>';
    }).join('')+'</ul></section>').join('');
}
function openNews(){
  els.newsOv.hidden=false;S.opt.news=NEWS_VER;S.sec.news=(S.sec.news||0)+1;render();
  els.newsClose.focus();
}
function closeNews(){
  if(els.newsOv.hidden) return;
  els.newsOv.hidden=true;els.newsBtn.focus();
}
els.newsBtn.addEventListener('click',openNews);
els.newsClose.addEventListener('click',closeNews);
els.newsOv.addEventListener('click',e=>{if(e.target===els.newsOv) closeNews();});
document.addEventListener('keydown',e=>{
  if(els.newsOv.hidden) return;
  if(e.key==='Escape'){e.preventDefault();closeNews();}
  else if(e.key==='Tab'){e.preventDefault();els.newsClose.focus();}
});

/* Einstellungen (Zahnrad oben rechts) */
let setSub='disp';
const setQ=document.getElementById('setQ');
function showSetPane(id){
  if(id) setSub=id;
  const q=setQ.value.trim().toLowerCase(),adm=!q&&setSub==='admin';
  document.querySelectorAll('#setOv .spane').forEach(p=>{p.hidden=p.dataset.spane==='admin'?!adm:adm;});
  let n=0;
  document.querySelectorAll('#setOv .optsec').forEach(s=>{const show=q?s.textContent.toLowerCase().includes(q):s.dataset.sc===setSub;s.hidden=!show;if(show) n++;});
  document.querySelectorAll('#setSeg button').forEach(b=>b.setAttribute('aria-pressed',!q&&b.dataset.sp===setSub?'true':'false'));
  document.querySelectorAll('#setOv details.savemore').forEach(d=>{if(q&&!d.hidden) d.open=true;});
  const no=document.getElementById('setNone');no.hidden=!q||n>0;no.textContent=tt('Nichts gefunden.','Nothing found.');
  if(adm) fillAdmin();
}
setQ.addEventListener('input',()=>{updOptTxt();showSetPane();});
setQ.addEventListener('keydown',e=>{if(e.key==='Escape'&&setQ.value){e.stopPropagation();e.preventDefault();setQ.value='';showSetPane();}});
function openSettings(){els.setOv.hidden=false;updOptTxt();showSetPane(setSub);els.setClose.focus();}
function closeSettings(){if(els.setOv.hidden) return;els.setOv.hidden=true;els.setBtn.focus();}
els.setBtn.addEventListener('click',openSettings);
els.setClose.addEventListener('click',closeSettings);
els.setOv.addEventListener('click',e=>{if(e.target===els.setOv) closeSettings();});
document.getElementById('setSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-sp]');if(b){setQ.value='';showSetPane(b.dataset.sp);}});
document.addEventListener('keydown',e=>{if(!els.setOv.hidden&&e.key==='Escape'){e.preventDefault();closeSettings();}});

/* Gebäude */
const rows=[];
B.forEach((b,i)=>{
  const el=document.createElement('button');
  el.type='button';el.className='row';el.dataset.i=i;el.style.setProperty('--d',(-i*0.37)+'s');
  el.innerHTML='<span class="ico">'+art('b'+i)+'</span>'
    +'<span class="info"><span class="nm"><span class="nmt"></span><span class="own"></span></span><span class="sub fl"></span><span class="sub st"></span></span>'
    +'<span class="price"><span class="pv"></span><span class="pq"></span></span>';
  els.buildList.appendChild(el);
  rows.push({el,nmt:el.querySelector('.nmt'),own:el.querySelector('.own'),fl:el.querySelector('.fl'),st:el.querySelector('.st'),pv:el.querySelector('.pv'),pq:el.querySelector('.pq')});
});
/* Rückgängig */
let undo=null;
function undoBegin(){if(!undo||Date.now()-undo.t>5000) undo={b:S.b.slice(),bought:S.bought,up:Object.assign({},S.up),inf:Object.assign({},S.inf),spent:0,t:Date.now()};}
function undoAdd(c){undo.spent+=c;undo.t=Date.now();}
function doUndo(){
  if(!undo||undo.spent<=0||Date.now()-undo.t>5000) return false;
  S.cookies+=undo.spent;S.b=undo.b;S.bought=undo.bought;S.up=undo.up;S.inf=undo.inf;undo=null;upSig='';
  S.sec.undo=(S.sec.undo||0)+1;recalc();render();toast(tt('Kauf zurückgenommen.','Purchase undone.'));return true;
}
function fmtWait(s){
  if(!isFinite(s)||s>365*86400) return tt('über 1 Jahr','over 1 year');
  if(s<60) return Math.ceil(s)+' s';
  if(s<3600) return mmss(s);
  if(s<86400) return Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min';
  return Math.floor(s/86400)+' d '+Math.floor(s%86400/3600)+' h';
}
function buyRow(r,quiet){
  const i=+r.dataset.i,n=amountN(i),cost=buyCost(i,n);
  if(S.cookies<cost){if(!quiet) nope(r);return false;}
  undoBegin();
  S.cookies-=cost;S.b[i]+=n;S.bought+=n;undoAdd(cost);recalc();render();snd('buy');
  buyFx(r,Math.floor((S.b[i]-n)/10)<Math.floor(S.b[i]/10));bump(r);anim(rows[i].own,[{transform:'scale(1)'},{transform:'scale(1.7)',color:'#f1b24a',offset:.4},{transform:'scale(1)'}],{duration:320,easing:'ease-out'});
  const rc=r.getBoundingClientRect();crumbs(rc.left+34,rc.top+rc.height/2,4);if(!quiet) floater(rc.right-70,rc.top+12,'+'+n+' '+tx(n>1?B[i].plural:B[i].name));
  return true;
}
let holdT=null,holdI=null,holdUsed=false;
function holdStop(){clearTimeout(holdT);clearInterval(holdI);holdT=holdI=null;}
els.buildList.addEventListener('pointerdown',e=>{
  if(e.button!==0) return;
  const r=e.target.closest('.row');if(!r||r.classList.contains('locked')) return;
  holdStop();holdUsed=false;
  holdT=setTimeout(()=>{holdUsed=true;buyRow(r,true);holdI=setInterval(()=>buyRow(r,true),110);},420);
});
['pointerup','pointercancel','pointerleave'].forEach(ev=>els.buildList.addEventListener(ev,holdStop));
window.addEventListener('blur',holdStop);
els.buildList.addEventListener('contextmenu',e=>{if(e.target.closest('.row')) e.preventDefault();});
els.buildList.addEventListener('click',e=>{
  const r=e.target.closest('.row');if(!r||r.classList.contains('locked')) return;
  if(holdUsed){holdUsed=false;return;}
  buyRow(r,false);
});
els.amountSeg.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b) return;
  mode=b.dataset.amt==='max'?'max':+b.dataset.amt;
  els.amountSeg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));
  render();
});
function updBuild(){
  msCheck();
  let known=0;
  B.forEach((b,i)=>{if(S.b[i]>0||S.run>=baseCost(i)*0.7) known=i+1;});
  B.forEach((b,i)=>{
    const r=rows[i];
    if(i>known){r.el.hidden=true;return;}
    r.el.hidden=false;
    const locked=i===known;
    r.el.classList.toggle('locked',locked);
    r.el.classList.toggle('owned',!locked&&S.b[i]>0);
    if(locked){
      r.nmt.textContent='???';r.own.textContent='';r.fl.textContent=tr('locked');r.st.textContent='';
      r.pv.textContent=fmt(baseCost(i));r.pq.textContent='';r.el.classList.remove('can');
      return;
    }
    const n=amountN(i),cost=buyCost(i,n);
    r.el.classList.toggle('can',S.cookies>=cost);
    r.nmt.textContent=tx(b.name);
    r.own.textContent=S.b[i]>0?S.b[i]:'';
    r.fl.textContent=tx(b.flavor);
    let st=tr('each_ps',{x:fmtRate(C.per[i])});
    if(S.b[i]>0&&C.kps>0) st+=tr('total_part',{x:fmtRate(C.per[i]*S.b[i]),p:Math.round(C.per[i]*S.b[i]/C.kps*100)});
    const mk=msCount(i);
    if(mk) st+=' · '+tt('Meilenstein ','Milestone ')+mk+'/'+MS.length;
    r.el.classList.toggle('evo',!!(S.eg&&S.eg.evo[i]));r.el.classList.toggle('ms-b',mk>=1&&mk<3);r.el.classList.toggle('ms-s',mk>=3&&mk<6);r.el.classList.toggle('ms-g',mk>=6);
    if(C.per[i]>0) st+=' · '+tt('Rückzahlung ','Payback ')+fmtWait(cost/(C.per[i]*n));
    r.st.textContent=st;
    r.pv.textContent=fmt(cost);
    {const wt=S.cookies<cost&&C.kps>0?tt('in ','in ')+fmtWait((cost-S.cookies)/C.kps):'';const pt=[n>1?tr('for_n',{n}):'',wt].filter(Boolean).join(' · ');if(r.pq.textContent!==pt) r.pq.textContent=pt;}
  });
}

/* Upgrades */
const availUp=()=>UP.filter(u=>!S.up[u.id]&&visible(u)).sort((a,b)=>a.cost-b.cost);
let upSig='',upSeen=null,upAfford=0;
function visible(u){
  if(u.mega) return S.all>=u.cost/1000;
  switch(u.kind){
    case 'goldfx': return S.gold>=u.req;
    case 'tier': return S.b[u.b]>=u.req;
    case 'clickx': return S.clicks>=u.req;
    case 'goldu': return S.gold>=u.req;
    case 'syn': return S.b[u.s]>=10&&S.b[u.t]>=10;
    default: return S.all>=u.cost/5;
  }
}
let upHid={};
const upSerK=u=>u.kind==='tier'?'t'+u.b:u.kind==='syn'?'syn':u.kind==='recipe'?'rec':u.kind==='click'?'clk':u.kind==='clickx'?'clkx':u.kind==='goldu'?'gu':u.kind==='goldfx'?'gfx':u.kind==='global'?'glob':(u.kind==='gen'&&!u.mega)?'g'+u.id.replace(/\d+$/,'')+':'+Object.keys(u.e||{}).join(','):u.id;
function upRow(u,isNew){
  return '<button type="button" class="row'+(isNew?' in':'')+(u.mega?' mega':'')+'" data-id="'+u.id+'"><span class="ico">'+art(u.art)+'<i class="tag">'+u.tag()+'</i></span>'
    +'<span class="info"><span class="nm"><span>'+tx(u.name)+'</span>'+(upHid[u.id]?'<small class="useries" title="'+tt('weitere in dieser Reihe','more in this series')+'">+'+upHid[u.id]+'</small>':'')+'</span><span class="sub">'+u.desc()+'</span><span class="ug"></span></span>'
    +'<span class="price"><span class="pv">'+fmt(u.cost)+'</span><span class="pq"></span></span></button>';
}
document.getElementById('upCats').addEventListener('click',e=>{const b=e.target.closest('[data-uc]');if(!b) return;upCat=b.dataset.uc;upSig='';render();});
document.getElementById('upCompact').addEventListener('click',()=>{S.opt.upc=S.opt.upc===false;upSig='';render();save();});
document.getElementById('upSort').addEventListener('click',e=>{const b=e.target.closest('[data-us]');if(!b) return;upSortBy=b.dataset.us;upSig='';render();});
els.upList.addEventListener('click',e=>{
  const r=e.target.closest('.row');if(!r) return;
  const u=UPMAP[r.dataset.id];
  if(!u||S.up[u.id]) return;
  if(S.cookies<u.cost){nope(r);return;}
  const rc=r.getBoundingClientRect();
  if(fxOk()) upFx(r);
  undoBegin();S.cookies-=u.cost;S.up[u.id]=1;undoAdd(u.cost);recalc();render();snd('buy');
  if(!fxOk()) burst(rc.left+34,rc.top+rc.height/2,10);flash(.12,500);
});
const UPCATS=[['all','Alle','All'],['build','Gebäude','Buildings'],['prod','Produktion','Production'],['click','Klick','Click'],['gold','Gold','Gold'],['world','Welt','World'],['hero','Held','Hero'],['fr','Filialen','Stores'],['work','Helfer','Helpers'],['special','Spezial','Special']];
const upCatOf=u=>u.cat||({tier:'build',syn:'build',global:'prod',recipe:'prod',click:'click',clickx:'click',goldu:'gold',goldfx:'gold'})[u.kind]||'special';
let upCat='all',upSortBy='price',gainCache={},gainKey='',gainN=0,catSig='',boughtSig='';
const gainable=u=>['tier','global','recipe','syn','click','clickx'].includes(u.kind)||(u.kind==='gen'&&(u.e.prod||u.e.click));
function ensureGains(all){
  const key=all.map(u=>u.id).join(',')+'|'+Object.keys(S.up).length+'|'+S.b.join(',')+'|'+Math.floor(Date.now()/5000);
  if(key===gainKey) return;
  gainKey=key;gainN++;gainCache={};
  const base={k:C.kps0,c:C.click};
  all.forEach(u=>{if(!gainable(u)) return;S.up[u.id]=1;recalc();gainCache[u.id]={dk:C.kps0-base.k,dc:C.click-base.c};delete S.up[u.id];});
  recalc();
}
const upVal=u=>{const g=gainCache[u.id];return g?g.dk/u.cost:0;};
function updUp(){
  const all=availUp();
  {let c0=S.cookies;upAfford=0;for(const u of all){if(u.cost>c0) break;c0-=u.cost;upAfford++;}}
  if(!panes.up.hidden) ensureGains(all);
  if(upCat!=='all'&&!all.some(u=>upCatOf(u)===upCat)) upCat='all';
  upHid={};let src=all;
  if(S.opt.upc!==false){const seen={};src=[];for(const u of all){const k=upSerK(u);if(seen[k]===undefined){seen[k]=src.length;src.push(u);upHid[u.id]=0;}else upHid[src[seen[k]].id]++;}}
  {const b=document.getElementById('upCompact'),on=S.opt.upc!==false,t=tt('Kompakt','Compact')+(on?' ✓':'');if(b.textContent!==t) b.textContent=t;b.classList.toggle('on',on);b.title=tt('Nur das nächste Upgrade jeder Reihe zeigen','Only show the next upgrade of each series');}
  let avail=upCat==='all'?src:src.filter(u=>upCatOf(u)===upCat);
  if(upSortBy==='value') avail=avail.slice().sort((a,b)=>upVal(b)-upVal(a)||a.cost-b.cost);
  {const cnt={};all.forEach(u=>{const c=upCatOf(u);cnt[c]=(cnt[c]||0)+1;});
   const cs=LANG+'|'+upCat+'|'+JSON.stringify(cnt)+'|'+upSortBy;
   if(cs!==catSig){catSig=cs;document.getElementById('upCats').innerHTML=UPCATS.filter(c=>c[0]==='all'||cnt[c[0]]).map(c=>'<button type="button" class="chip'+(upCat===c[0]?' on':'')+'" data-uc="'+c[0]+'">'+(LANG==='de'?c[1]:c[2])+'<small>'+(c[0]==='all'?all.length:cnt[c[0]])+'</small></button>').join('');
     document.querySelectorAll('#upSort [data-us]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.us===upSortBy?'true':'false');b.textContent=b.dataset.us==='price'?tt('Preis','Price'):tt('Nutzen','Value');});}}
  const sig=LANG+'|'+upCat+'|'+upSortBy+'|'+(upSortBy==='value'?gainN+'|':'')+avail.map(u=>u.id+(upHid[u.id]?'+'+upHid[u.id]:'')).join(',');
  if(sig!==upSig){
    upSig=sig;
    const first=upSeen===null;
    els.upList.innerHTML=avail.map(u=>upRow(u,!first&&!upSeen.has(u.id))).join('');
    upSeen=new Set(avail.map(u=>u.id));
  }
  const can=all.filter(u=>S.cookies>=u.cost).length;
  els.upList.querySelectorAll('.row').forEach(r=>{
    const u=UPMAP[r.dataset.id],ok=S.cookies>=u.cost;
    r.classList.toggle('can',ok);
    {const g=gainCache[u.id],el=r.querySelector('.ug');let t='';
     if(g&&g.dk>0){const pc=g.dk/Math.max(1e-9,C.kps0)*100;t='+'+fmtRate(g.dk)+'/s (+'+(pc<.1?'<0,1'.replace(',',LANG==='de'?',':'.'):(Math.round(pc*10)/10).toLocaleString(LOC[LANG]))+' %)';}
     else if(g&&g.dc>0) t='+'+fmtRate(g.dc)+tt(' pro Klick',' per click');
     if(el&&el.textContent!==t) el.textContent=t;}
    const q=r.querySelector('.pq'),wt=ok||!(C.kps>0)?'':tt('in ','in ')+fmtWait((u.cost-S.cookies)/C.kps);
    if(q&&q.textContent!==wt) q.textContent=wt;
  });
  els.upBadge.textContent=can;els.upBadge.hidden=can===0;
  els.upEmpty.hidden=avail.length>0;
  els.upNote.textContent=tr('up_bought',{a:Object.keys(S.up).length,b:UP.length});
  {const bl=UP.filter(u=>S.up[u.id]);setTxt(document.getElementById('upBoughtH'),tt('Gekaufte Upgrades','Bought upgrades')+' ('+bl.length+')');
   const f=document.getElementById('upBoughtF');
   if(f.open&&!panes.up.hidden){const bs=LANG+'|'+bl.length;if(bs!==boughtSig){boughtSig=bs;document.getElementById('upBought').innerHTML=bl.map(u=>'<div class="row owned bought'+(u.mega?' mega':'')+'"><span class="ico">'+art(u.art)+'<i class="tag">'+u.tag()+'</i></span><span class="info"><span class="nm"><span>'+tx(u.name)+'</span></span><span class="sub">'+u.desc()+'</span></span><span class="price"><span class="pv">✓</span></span></div>').join('');}}}
}

/* Komfort & Helfer */
let bestIdx=-1,workT=0,workSig='';
const budgetOk=c=>c<=S.cookies*S.work.budget/100;
const knownB=()=>{let k=0;B.forEach((b,i)=>{if(S.b[i]>0||S.run>=baseCost(i)*0.7) k=i+1;});return k;};
function bestBuild(){
  const k=Math.min(knownB(),B.length);let best=-1,bv=Infinity;
  for(let i=0;i<k;i++){
    const per=C.per[i];if(!(per>0)) continue;
    const v=buyCost(i,1)/per;if(v<bv){bv=v;best=i;}
  }
  return best;
}
function buyBuilding(i,n){
  const c=buyCost(i,n);if(S.cookies<c) return false;
  S.cookies-=c;S.b[i]+=n;S.bought+=n;return true;
}
function buyUpgrade(u){
  if(S.up[u.id]||S.cookies<u.cost) return false;
  S.cookies-=u.cost;S.up[u.id]=1;return true;
}
const setTxt=(el,t)=>{if(el.textContent!==t) el.textContent=t;};
function tickWork(dt){
  workT+=dt;if(workT<.7) return;workT=0;
  const W=S.work;
  const on=id=>W.hired[id]&&W.on[id];
  const did=(id,k,n,x)=>{W.cnt[id]=(W.cnt[id]||0)+n;wXP(id,n*WORKERS.find(w=>w.id===id).xp);wlog(id,k,n,x);};
  if(on('builder')){let n=0;const mx=wLv('builder')>=2?20:8;for(;n<mx;n++){
    const i=bestBuild();if(i<0) break;
    if(!budgetOk(buyCost(i,1))||!buyBuilding(i,1)) break;
    recalc();
  }if(n) did('builder','buy',n);}
  if(W.autoU){for(let n=0;n<6;n++){
    const u=availUp()[0];
    if(!u||!budgetOk(u.cost)||!buyUpgrade(u)) break;
    recalc();
  }}
  if(on('catcher')&&goldEl){
    goldEl._n=(goldEl._n||0)+1;
    if(goldEl._n>=(wLv('catcher')>=2?2:3)){noStar=true;try{goldEl.click();}finally{noStar=false;}did('catcher','catch',1);}
  }
  if(on('orders')){
    const sl=S.orders.slots;
    sl.forEach((s,i)=>{
      if(s&&s.st==='offer'&&s.type==='bake'&&C.kps*s.time>=s.target*1.1&&sl.filter(x=>x&&x.st==='active').length<2&&acceptOrder(i)) did('orders','order',1);
    });
  }
  if(on('manager')){
    const sl=S.orders.slots,L=wLv('manager');let acc=0,up=0,hl=0;
    sl.forEach((s,i)=>{if(s&&s.st==='offer'&&sl.filter(x=>x&&x.st==='active').length<2&&acceptOrder(i)) acc++;});
    sl.forEach(s=>{if(!s||s.st!=='active') return;
      if(s.type==='click'){const n=L>=2?6:3;S.clicks+=n;addCk(C.click*n);hl+=n;}
      else if(s.type==='buy'){const i=bestBuild();if(i>=0&&budgetOk(buyCost(i,1))&&buyBuilding(i,1)){recalc();hl++;}}
    });
    const mx=L>=3?12:4;for(let n=0;n<mx;n++){const u=availUp()[0];if(!u||!budgetOk(u.cost)||!buyUpgrade(u)) break;up++;recalc();}
    if(acc) did('manager','order',acc);if(up) did('manager','upbuy',up);if(hl&&!acc&&!up) wXP('manager',.5);
  }
  if(on('boostm')){
    for(const id of ['sugar','magnet','goldb','cap']){
      const b=BOOSTS.find(x=>x.id===id);
      if(S.all<b.unlock||(S.boostCd[id]||0)>0||!budgetOk(boostCost(b))) continue;
      if(id==='goldb'&&(goldEl||WFX.nogold)) continue;
      if(useBoost(b)){did('boostm','boost',1);break;}
    }
  }
  if(on('research')&&!S.w.lab.cur){
    const l=LABS.find(x=>!S.w.lab.done[x.id]&&S.all>=x.unlock);
    if(l&&budgetOk(labCost(l))&&labStart(l.id)) did('research','lab',1,tx(l.n));
  }
  if(on('garden')){
    const d=PLANTS.find(x=>x.id===wSel)||PLANTS[0];let n=0;
    S.w.gar.plots.forEach((p,i)=>{
      if(p||S.all<PLOT_UNLOCK[i]) return;
      const c=plantCost(d);
      if(budgetOk(c)&&S.cookies>=c){S.cookies-=c;pcInc('p_'+d.id);S.w.gar.plots[i]={p:d.id,at:Date.now()};n++;}
    });
    if(n) did('garden','plant',n);
  }
  if(on('exped')){
    const d=DESTS.find(x=>x.id===W.dest)||DESTS[0];
    if(S.w.exp.slots.some(s=>!s)&&budgetOk(expCost(d))&&expStart(d.id)) did('exped','exp',1);
  }
  if(on('hunter')){
    const m=S.w.mon;
    if(m.st==='wait'){m.max=m.hp=monHp();m.t=m.boss?40:30;m.st='fight';}
    else if(m.st==='fight'){m.hp-=Math.ceil(m.max*(wLv('hunter')>=2?.08:.05));if(m.hp<=0){monWin();did('hunter','fight',1);}}
  }
  if(on('mage')){
    const sp=SPELLS.find(x=>x.id===W.spell)||SPELLS[0],mx=maxMana();
    if(mx>=sp.cost&&S.w.mana>=mx-.5&&!(sp.id==='gold'&&(goldEl||WFX.nogold))&&cast(sp.id)) did('mage','cast',1);
  }
  if(on('broker')){
    const k=S.w.mkt,L=wLv('broker'),buyT=L>=2?.85:.8,sellP=L>=2?1.1:1.15;let n=0;
    for(let i=0;i<6;i++){
      const pr=stockPrice(i);
      if(k.hold[i]>0&&pr*(1-WFX.fee)>=k.spent[i]/k.hold[i]*sellP){if(sellStock(i,k.hold[i])!==false) n++;}
      else if(k.m[i]<buyT&&k.hold[i]<WFX.maxSh&&budgetOk(pr*(L>=2?3:1))&&buyStock(i,L>=2?3:1)) n++;
    }
    if(n) did('broker','trade',n);
  }
  if(on('supplier')&&tabUnl('fr')){
    const thr=wLv('supplier')>=2?.7:.5;let n=0;
    CITIES.forEach(c=>{const x=S.fr.s[c.id];if(!x) return;const cap=frCap(c,x);if(x.stock<cap*thr){const pay=Math.min(cap-x.stock,S.cookies*S.work.budget/100);if(pay>0){S.cookies-=pay;x.stock+=pay;n++;}}});
    if(n) did('supplier','fill',n);
  }
  if(on('adventurer')&&tabUnl('adv')){
    const H=S.hero;
    if(!H.run&&H.sta>=1){let d=0;for(let i=DUNG.length-1;i>=0;i--){if(simDungeon(i)>=6){d=i;break;}}if(advStart('d',d)) did('adventurer','dung',1,tx(DUNG[d].n));}
  }
}
function updQol(){
  const W=S.work,bi=bestBuild();bestIdx=bi;
  rows.forEach((r,i)=>r.el.classList.toggle('best',i===bi));
  const bb=document.getElementById('bestBtn');
  if(bi>=0){
    const n=amountN(bi),c=buyCost(bi,n);
    setTxt(bb,tt('Bester Kauf: ','Best buy: ')+tx(B[bi].name)+(n>1?' ×'+n:'')+' · '+fmt(c));
    bb.classList.toggle('dis',S.cookies<c);
  }else{setTxt(bb,tt('Bester Kauf','Best buy'));bb.classList.add('dis');}
  const au=document.getElementById('autoU'),al=document.getElementById('allUpBtn');
  setTxt(au,tt('Auto-Upgrades: ','Auto upgrades: ')+(W.autoU?tt('An','On'):tt('Aus','Off')));au.setAttribute('aria-pressed',W.autoU?'true':'false');
  setTxt(al,tt('Alle kaufen','Buy all')+' ('+upAfford+')');al.classList.toggle('dis',upAfford<1);
  document.querySelectorAll('.budlab').forEach(e=>setTxt(e,tt('Automatik gibt höchstens aus:','Automation spends at most:')));
  document.querySelectorAll('.bud button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.bud===W.budget?'true':'false'));
  updWork();
}
const wNeed=L=>Math.ceil(50*Math.pow(L,1.5));
function wXP(id,n){
  const W=S.work;if(!W.hired[id]) return;
  let L=W.lvl[id]||1;if(L>=10) return;
  n*=UE.wkXP;
  if(wTrait(id)==='diligent') n*=1.25;
  if(wTrait(id)==='lucky'&&Math.random()<.15) n*=2;
  W.xp[id]=(W.xp[id]||0)+n;
  while(L<10&&W.xp[id]>=wNeed(L)){W.xp[id]-=wNeed(L);L++;W.lvl[id]=L;
    const x=WORKERS.find(w=>w.id===id);
    confetti(20);
    toast((W.face[id]?W.face[id].nm+' · ':'')+tx(x.n)+tt(' ist jetzt Stufe ',' is now level ')+L+(L===3||L===6?tt(' · neuer Bonus!',' · new bonus!'):L===10?tt(' · Meister!',' · Master!'):''),true);snd('ach');
    wlog(id,'lvl',L);recalc();workSig='';
  }
  if(L>=10) W.xp[id]=0;
}
const LOGT={buy:['Gebäude gekauft: {n}','buildings bought: {n}'],catch:['Goldkekse gefangen: {n}','golden cookies caught: {n}'],order:['Aufträge angenommen: {n}','orders accepted: {n}'],upbuy:['Upgrades gekauft: {n}','upgrades bought: {n}'],boost:['Boosts benutzt: {n}','boosts used: {n}'],plant:['Pflanzen gesetzt: {n}','plants planted: {n}'],exp:['Expeditionen gestartet: {n}','expeditions started: {n}'],fight:['Monster besiegt: {n}','monsters beaten: {n}'],cast:['Zauber gewirkt: {n}','spells cast: {n}'],trade:['Aktien-Geschäfte: {n}','stock trades: {n}'],lab:['Forschung gestartet: {x}','started research: {x}'],fill:['Lager aufgefüllt: {n}×','stocks refilled: {n}×'],dung:['Dungeon betreten: {x}','entered dungeon: {x}'],off:['Offline: {x}','Offline: {x}'],lvl:['Stufe {n} erreicht!','reached level {n}!']};
let logSig='';
function wlog(id,k,n,x){
  const L=S.work.log,last=L[L.length-1],now=Date.now();
  if(last&&last.id===id&&last.k===k&&!['lvl','lab','off','dung'].includes(k)&&now-last.t<120000){last.n+=n;last.t=now;}
  else{L.push({t:now,id,k,n,x:x||''});if(L.length>40) L.shift();}
}
function agoTxt(t){const s=Math.max(0,(Date.now()-t)/1000);if(s<60) return tt('gerade eben','just now');if(s<3600) return tt('vor ','')+Math.floor(s/60)+tt(' min',' min ago');if(s<86400) return tt('vor ','')+Math.floor(s/3600)+tt(' h',' h ago');return tt('vor ','')+Math.floor(s/86400)+tt(' d',' d ago');}
function updWork(){
  const W=S.work,n=WORKERS.filter(x=>W.hired[x.id]).length;
  setTxt(document.getElementById('workHead'),tt('Helfer','Helpers')+' · '+n+' / '+WORKERS.length+' '+tt('angestellt','hired'));
  if(panes.work.hidden) return;
  setTxt(document.getElementById('workNote'),tt('Helfer sammeln Erfahrung durch ihre Arbeit und steigen bis Stufe 10 auf. Auf Stufe 3 und 6 bekommen sie einen Bonus, auf Stufe 10 werden sie Meister (+5 % Produktion). Sie bleiben auch nach dem Aufstieg angestellt.','Helpers gain experience by working and level up to 10. At levels 3 and 6 they get a bonus, at level 10 they become masters (+5% production). They stay hired after ascension.'));
  setTxt(document.getElementById('logHead'),tt('Arbeits-Protokoll','Work log'));
  const pl=PLANTS.find(x=>x.id===wSel)||PLANTS[0],live={},wid={};
  const html=WORKERS.map(x=>{
    const hired=!!W.hired[x.id],unl=S.all>=x.unlock,L=W.lvl[x.id]||1;
    let act;
    if(hired) act='<button type="button" class="btn sm tgl" data-wk="tog:'+x.id+'" aria-pressed="'+(W.on[x.id]?'true':'false')+'">'+(W.on[x.id]?tt('An','On'):tt('Aus','Off'))+'</button>';
    else if(!unl) act=tt('Ab ','From ')+fmt(x.unlock);
    else{if(!W.cand[x.id]) W.cand[x.id]=genFace();act='<span class="wkact"><button type="button" class="btn sm primary" data-wk="hire:'+x.id+'" data-need="'+x.cost+'">'+tt('Anstellen · ','Hire · ')+fmt(x.cost)+'</button><button type="button" class="btn sm" data-wk="reroll:'+x.id+'" data-need="'+Math.ceil(x.cost*.1)+'">'+tt('Anderer Bewerber · ','Other applicant · ')+fmt(Math.ceil(x.cost*.1))+'</button></span>';}
    let extra='';
    if(hired){
      if(L<10){live['x'+x.id]=fmt(Math.floor(W.xp[x.id]||0))+' / '+fmt(wNeed(L))+' XP';wid['x'+x.id]=(W.xp[x.id]||0)/wNeed(L)*100;extra+='<span class="wxp"><span class="obar"><i data-w="x'+x.id+'"></i></span><span data-l="x'+x.id+'"></span></span>';}
      live['c'+x.id]=fmt(W.cnt[x.id]||0);
      extra+='<span class="sub">'+tt('Aufgaben erledigt: ','Tasks done: ')+'<span data-l="c'+x.id+'"></span></span>';
      if(x.id==='exped') extra+='<select class="sel" data-wsel="dest" aria-label="'+tt('Ziel','Destination')+'">'+DESTS.map(d=>'<option value="'+d.id+'"'+(d.id===W.dest?' selected':'')+'>'+tx(d.n)+'</option>').join('')+'</select>';
      if(x.id==='mage') extra+='<select class="sel" data-wsel="spell" aria-label="'+tt('Zauber','Spell')+'">'+SPELLS.map(s=>'<option value="'+s.id+'"'+(s.id===W.spell?' selected':'')+'>'+tx(s.n)+' ('+s.cost+' Mana)</option>').join('')+'</select>';
      if(x.id==='garden') extra+='<span class="sub">'+tt('Pflanze: ','Plant: ')+tx(pl.n)+'</span>';
    }
    const face=hired?W.face[x.id]:unl?W.cand[x.id]:null,tl=face&&face.tr==='talent',trt=face?TRAITS.find(t=>t.id===face.tr):null;
    const perks='<span class="perks">'+x.lv.map((p,i)=>{const lv=i?(tl?5:6):(tl?2:3);return '<span class="sub'+(hired&&L>=lv?' on':'')+'">'+tt('Stufe ','Level ')+lv+': '+tx(p)+'</span>';}).join('')+'<span class="sub'+(hired&&L>=10?' on':'')+'">'+tt('Stufe 10: Meister, Produktion +','Level 10: master, production +')+(face&&face.tr==='ambit'?10:5)+' %.</span></span>';
    const who=face?'<span class="sub">'+(hired?'':tt('Bewerber: ','Applicant: '))+'<b>'+face.nm+'</b><span class="trait" title="'+tx(trt.d)+'">'+tx(trt.n)+'</span> · '+tx(trt.d)+'</span>':'';
    return '<div class="wcard"><span class="ico'+(face?' face':'')+'">'+(face?avatarSVG(face):art(x.art))+'</span><span class="info"><span class="nm"><span>'+tx(x.n)+(hired?'<span class="wlvl'+(L>=10?' max':'')+'">'+(L>=10?tt('Meister','Master'):tt('Stufe ','Lv ')+L)+'</span>':'')+'</span></span>'+who+'<span class="sub">'+tx(x.d)+'</span>'+perks+extra+'</span><span class="oact">'+act+'</span></div>';
  }).join('');
  mount(document.getElementById('workList'),{html,live,wid},{cookies:S.cookies});
  const LG=W.log,ls=LANG+'|'+LG.length+'|'+(LG.length?LG[LG.length-1].t+':'+LG[LG.length-1].n:'')+'|'+Math.floor(Date.now()/30000);
  if(ls!==logSig){
    logSig=ls;
    document.getElementById('workLog').innerHTML=LG.length?LG.slice().reverse().map(l=>{const x=WORKERS.find(w=>w.id===l.id),t=LOGT[l.k]||['{x}','{x}'];return '<div class="wle"><span class="ico">'+art(x.art)+'</span><span><b>'+tx(x.n)+'</b>: '+tx(t).replace('{n}',fmt(l.n)).replace('{x}',l.x)+'</span><time>'+agoTxt(l.t)+'</time></div>';}).join(''):'<p class="small">'+tt('Noch nichts passiert. Stell einen Helfer an!','Nothing happened yet. Hire a helper!')+'</p>';
  }
}
document.getElementById('workList').addEventListener('click',e=>{
  const b=e.target.closest('[data-wk]');if(!b) return;
  const [a,id]=b.dataset.wk.split(':'),x=WORKERS.find(w=>w.id===id);if(!x) return;
  const W=S.work;
  if(a==='hire'){
    if(W.hired[id]||S.all<x.unlock||S.cookies<x.cost){nope(b);return;}
    S.cookies-=x.cost;W.hired[id]=1;W.on[id]=1;W.face[id]=W.cand[id]||genFace();delete W.cand[id];toast(tt('Angestellt: ','Hired: ')+W.face[id].nm+' ('+tx(x.n)+')',true);snd('buy');confetti(18);
  }else if(a==='reroll'&&!W.hired[id]){
    const c=Math.ceil(x.cost*.1);if(S.cookies<c){nope(b);return;}
    S.cookies-=c;W.cand[id]=genFace();snd('buy');
  }else if(a==='tog'&&W.hired[id]){W.on[id]=W.on[id]?0:1;}
  recalc();render();
});
document.getElementById('workList').addEventListener('change',e=>{
  const s=e.target.closest('[data-wsel]');if(!s) return;
  if(s.dataset.wsel==='dest'&&DESTS.some(d=>d.id===s.value)) S.work.dest=s.value;
  if(s.dataset.wsel==='spell'&&SPELLS.some(d=>d.id===s.value)) S.work.spell=s.value;
  render();
});
document.getElementById('bestBtn').addEventListener('click',e=>{
  const bi=bestBuild(),b=e.currentTarget;
  if(bi<0){nope(b);return;}
  const n=amountN(bi),c=buyCost(bi,n);
  if(S.cookies<c){nope(b);return;}
  undoBegin();buyBuilding(bi,n);undoAdd(c);
  recalc();render();bump(rows[bi].el);snd('buy');
  const rc=rows[bi].el.getBoundingClientRect();crumbs(rc.left+34,rc.top+rc.height/2,4);
});
document.getElementById('autoU').addEventListener('click',()=>{S.work.autoU=S.work.autoU?0:1;render();});
document.getElementById('allUpBtn').addEventListener('click',e=>{
  let n=0;
  undoBegin();
  for(const u of availUp()){const c=u.cost;if(!buyUpgrade(u)) break;undoAdd(c);n++;}
  if(!n){nope(e.currentTarget);return;}
  recalc();upSig='';render();flash(.14,500);snd('buy');
  toast(tt(n+' Upgrades gekauft.',n+' upgrades bought.'),true);
});
document.querySelectorAll('.bud').forEach(g=>g.addEventListener('click',e=>{
  const b=e.target.closest('[data-bud]');if(!b) return;
  S.work.budget=+b.dataset.bud;render();
}));


/* Helfer-Stufe (aktiv) */
const wTrait=id=>{const f=S.work.face&&S.work.face[id];return f?f.tr:'';};
function wLv(id){const W=S.work;if(!W||!W.hired[id]||!W.on[id]) return 0;const L=W.lvl[id]||1,t=wTrait(id)==='talent';return L>=(t?5:6)?3:L>=(t?2:3)?2:1;}
/* Meilensteine */
const msMul=()=>(S.reb.tree.r_ms?1.25:1.15)+UE.msAdd;
const msCount=i=>{let k=0;for(const m of MS){if(S.b[i]>=m) k++;else break;}return k;};
const msTotal=()=>B.reduce((a,b,i)=>a+msCount(i),0);
let msS=null,msPrev=[];
function msCheck(){
  if(msS!==S){msS=S;msPrev=B.map((b,i)=>msCount(i));return;}
  B.forEach((b,i)=>{
    const k=msCount(i);
    if(k>msPrev[i]){msPrev[i]=k;confetti(40);toast(tt('Meilenstein: ','Milestone: ')+tx(b.name)+' × '+MS[k-1]+' · '+tx(b.name)+' +'+Math.round((msMul()-1)*100)+' %',true);snd('ach');}
    else if(k<msPrev[i]) msPrev[i]=k;
  });
}

/* Töne */