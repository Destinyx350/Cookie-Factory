/* ======================= V59: Tab-Leiste, Gebäude-Karten, Übergänge, Bäckerei-Start, Vibration, Verlauf, Willkommen ======================= */
var v59Ready=false;
const lsGetJ=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v;}catch(x){return d;}};
const lsSetJ=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(x){}};

/* ---------- Eigene Tab-Leiste (pro Gerät) ---------- */
const TABK='keksfabrik-tabs';
let tabCfg=(()=>{const v=lsGetJ(TABK,null);return v&&Array.isArray(v.order)?{order:v.order.filter(x=>typeof x==='string').slice(0,20),hide:Array.isArray(v.hide)?v.hide.filter(x=>typeof x==='string'&&x!=='build').slice(0,20):[]}:{order:[],hide:[]};})();
const tabIdsAll=()=>tabs.map(t=>t.dataset.tab);
const tabOrder=()=>{const ids=tabIdsAll();return tabCfg.order.filter(x=>ids.includes(x)).concat(ids.filter(x=>!tabCfg.order.includes(x)));};
function tabApply(){
  const ord=tabOrder();
  tabs.forEach(t=>{const o=String(ord.indexOf(t.dataset.tab));if(t.style.order!==o) t.style.order=o;t.classList.toggle('tabhid',tabCfg.hide.includes(t.dataset.tab));});
  const cur=tabs.find(t=>t.getAttribute('aria-selected')==='true');
  if(cur&&tabCfg.hide.includes(cur.dataset.tab)) selectTab('build');
}
function tabSave(){lsSetJ(TABK,tabCfg);tabApply();tabCfgSig='';tabCfgRender();}
const tabName=t=>{const s=t.querySelector('[data-i18n]');return (s?s.textContent:t.textContent).trim();};
let tabCfgSig='';
function tabCfgRender(){
  const box=$id('tabCfgList');if(!box) return;
  const ord=tabOrder(),shown=ord.map(id=>tabs.find(t=>t.dataset.tab===id)).filter(t=>t&&!t.hidden);
  const sig=LANG+'|'+shown.map(t=>t.dataset.tab).join(',')+'|'+tabCfg.hide.join(',');if(sig===tabCfgSig) return;tabCfgSig=sig;
  box.innerHTML=shown.map((t,i)=>{const id=t.dataset.tab,hid=tabCfg.hide.includes(id),ic=t.querySelector('.tico');
    return '<div class="tabcfg'+(hid?' off':'')+'" data-tc="'+id+'"><span class="tico" aria-hidden="true">'+(ic?ic.innerHTML:'')+'</span><b>'+escName(tabName(t))+'</b>'
      +'<span class="btns"><button type="button" class="btn sm" data-tcm="up" aria-label="'+tt('Nach oben','Move up')+'"'+(i===0?' disabled':'')+'>↑</button><button type="button" class="btn sm" data-tcm="down" aria-label="'+tt('Nach unten','Move down')+'"'+(i===shown.length-1?' disabled':'')+'>↓</button>'
      +(id==='build'?'<span class="small tcfix">'+tt('immer da','always there')+'</span>':'<label class="check"><input type="checkbox" data-tch'+(hid?'':' checked')+'> '+tt('zeigen','show')+'</label>')+'</span></div>';}).join('');
}
function tabCfgSetup(){
  const disp=[...document.querySelectorAll('#setOv .optsec[data-sc="disp"]')];if(!disp.length||$id('tabSec')) return;
  const sec=document.createElement('div');sec.className='optsec';sec.dataset.sc='disp';sec.id='tabSec';
  sec.innerHTML='<h2 id="tabSecH"></h2><p class="small" id="tabSecP"></p><div class="tabcfgl" id="tabCfgList"></div><div class="btns" style="margin-top:8px"><button type="button" class="btn sm" id="tabReset"></button></div>';
  disp[disp.length-1].after(sec);
  sec.addEventListener('click',e=>{
    if(e.target.closest('#tabReset')){tabCfg={order:[],hide:[]};tabSave();toast(tt('Tab-Leiste zurückgesetzt.','Tab bar reset.'));return;}
    const b=e.target.closest('[data-tcm]');if(!b) return;
    const id=b.closest('[data-tc]').dataset.tc,shown=tabOrder().filter(x=>{const t=tabs.find(y=>y.dataset.tab===x);return t&&!t.hidden;}),ord=tabOrder();
    const i=shown.indexOf(id),j=b.dataset.tcm==='up'?i-1:i+1;if(j<0||j>=shown.length) return;
    const a=ord.indexOf(id),c=ord.indexOf(shown[j]);ord[a]=shown[j];ord[c]=id;tabCfg.order=ord;tabSave();
    const nb=$id('tabCfgList').querySelector('[data-tc="'+id+'"] [data-tcm="'+b.dataset.tcm+'"]');if(nb&&!nb.disabled) nb.focus();
  });
  sec.addEventListener('change',e=>{const c=e.target.closest('[data-tch]');if(!c) return;const id=c.closest('[data-tc]').dataset.tc;tabCfg.hide=tabCfg.hide.filter(x=>x!==id);if(!c.checked) tabCfg.hide.push(id);tabSave();});
}

/* ---------- Gebäude-Karten: Meilenstein-Balken und Raster-Ansicht ---------- */
const BVK='keksfabrik-bview';
function bldMs(r,i){
  if(!r.ms){r.ms=document.createElement('span');r.ms.className='msbar';r.ms.setAttribute('aria-hidden','true');r.ms.innerHTML='<i></i>';r.el.appendChild(r.ms);r.msi=r.ms.firstChild;}
  const own=S.b[i]||0,next=MS.find(m=>m>own),prev=MS.filter(m=>m<=own).pop()||0;
  const w=next?Math.max(0,Math.min(1,(own-prev)/(next-prev))):1,ws=(w*100).toFixed(1)+'%';
  if(r.msi.style.width!==ws) r.msi.style.width=ws;
  r.ms.classList.toggle('done',!next);r.ms.hidden=own<=0;
  if(own>0) r.st.textContent+=' · '+tt('Meilenstein ','Milestone ')+msCount(i)+'/'+MS.length+(next?' → '+next+' ('+tt('noch ','')+(next-own)+tt('',' to go')+')':' ✓');
}
function bviewSet(v){
  const g=v==='grid';els.buildList.classList.toggle('bgrid',g);
  document.querySelectorAll('#bviewSeg [data-bv]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bv===(g?'grid':'list'))));
}
function bviewSetup(){
  if($id('bviewSeg')) return;
  const seg=document.createElement('div');seg.className='seg bview';seg.id='bviewSeg';seg.setAttribute('role','group');
  seg.innerHTML='<button type="button" data-bv="list" aria-pressed="true"></button><button type="button" data-bv="grid" aria-pressed="false"></button>';
  els.amountSeg.after(seg);
  seg.addEventListener('click',e=>{const b=e.target.closest('[data-bv]');if(!b) return;lsSetJ(BVK,b.dataset.bv);bviewSet(b.dataset.bv);});
  bviewSet(lsGetJ(BVK,'list'));
}

/* ---------- Übergänge ---------- */
let rowAnimOk=false;setTimeout(()=>{rowAnimOk=true;},1500);
function restartAnim(el,cls){if(!el||reduced) return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);el.addEventListener('animationend',()=>el.classList.remove(cls),{once:true});}
function rowIn(el){if(rowAnimOk) restartAnim(el,'rowin');}
function paneIn(p){restartAnim(p,'panein');}
function countUp(el,to,ms,pre){
  pre=pre||'';
  if(!el||reduced||!isFinite(to)||to<=0){if(el) el.textContent=pre+fmt(to);return;}
  const t0=performance.now(),step=t=>{const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=pre+fmt(k<1?to*e:to);if(k<1) requestAnimationFrame(step);};
  el.textContent=pre+fmt(0);requestAnimationFrame(step);
}

/* ---------- Startbildschirm: kleine Bäckerei mit Rauch und Namensschild ---------- */
function stBakery(){
  const box=$id('stLogo');if(!box) return;
  const h=new Date().getHours(),night=h>=20||h<6;
  box.classList.add('bake');
  box.innerHTML='<svg class="stbake'+(night?' night':'')+'" viewBox="0 0 260 180" role="img" aria-label="'+tt('Deine Bäckerei','Your bakery')+'">'
    +'<defs><linearGradient id="sbRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9624a"/><stop offset="1" stop-color="#a8402f"/></linearGradient>'
    +'<linearGradient id="sbWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7c6"/><stop offset="1" stop-color="#ecc993"/></linearGradient>'
    +'<radialGradient id="sbGlow"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#ffb347"/></radialGradient></defs>'
    +'<g class="sbsky">'+(night?'<circle class="sbmoon" cx="218" cy="30" r="13" fill="#fff4c9"/><circle cx="224" cy="26" r="11" fill="var(--bg,#120e1f)"/>'+[[30,22],[62,40],[184,52],[240,70],[18,64],[150,18]].map(([x,y],i)=>'<circle class="sbstar" style="animation-delay:'+(i*.45)+'s" cx="'+x+'" cy="'+y+'" r="1.6" fill="#fff"/>').join(''):'<circle class="sbsun" cx="222" cy="32" r="14" fill="#ffd36a"/>')+'</g>'
    +'<ellipse cx="130" cy="168" rx="122" ry="10" fill="rgba(0,0,0,.28)"/>'
    +'<rect x="170" y="38" width="20" height="44" rx="3" fill="#8a5a44"/><rect x="166" y="34" width="28" height="8" rx="3" fill="#6f4535"/>'
    +'<g class="sbsmoke"><circle cx="180" cy="26" r="7"/><circle cx="180" cy="26" r="8"/><circle cx="180" cy="26" r="6"/></g>'
    +'<path d="M30 86 L130 30 L230 86 Z" fill="url(#sbRoof)"/><path d="M30 86 L130 30 L230 86" fill="none" stroke="#7d2f22" stroke-width="4" stroke-linejoin="round"/>'
    +'<rect x="44" y="84" width="172" height="80" rx="4" fill="url(#sbWall)"/>'
    +'<g class="sbawn">'+[0,1,2,3,4,5,6,7].map(k=>'<path d="M'+(48+k*20.5)+' 100 h20.5 v10 a10.25 10.25 0 0 1 -20.5 0 Z" fill="'+(k%2?'#fff6e8':'#e0533f')+'"/>').join('')+'</g>'
    +'<rect class="sbwin" x="58" y="122" width="40" height="30" rx="4" fill="url(#sbGlow)"/><path d="M78 122 v30 M58 137 h40" stroke="#b07a46" stroke-width="3"/>'
    +'<rect class="sbwin w2" x="162" y="122" width="40" height="30" rx="4" fill="url(#sbGlow)"/><path d="M182 122 v30 M162 137 h40" stroke="#b07a46" stroke-width="3"/>'
    +'<rect x="112" y="118" width="36" height="46" rx="6" fill="#8a5a44"/><circle cx="141" cy="142" r="2.4" fill="#ffd36a"/>'
    +'<g class="sbsign"><rect x="62" y="64" width="136" height="26" rx="8" fill="#3b2a20" stroke="#ffd36a" stroke-width="2"/><text id="stSign" x="130" y="82" text-anchor="middle" font-size="14" font-weight="700" fill="#ffe7a8"></text></g>'
    +'<g class="sbck" transform="translate(130 50)"><circle r="12" fill="#e0b57a" stroke="#a97a3d" stroke-width="2"/><circle cx="-4" cy="-3" r="2.2" fill="#5a3a22"/><circle cx="4" cy="2" r="2.2" fill="#5a3a22"/><circle cx="-1" cy="5" r="1.8" fill="#5a3a22"/><circle cx="5" cy="-5" r="1.6" fill="#5a3a22"/></g>'
    +'</svg>';
  const t=$id('stSign'),nm=String(S.name||'').trim()||tt('Keksfabrik','Cookie Factory');
  t.textContent=nm.length>22?nm.slice(0,21)+'…':nm;
  if(nm.length>12) t.setAttribute('textLength','124'),t.setAttribute('lengthAdjust','spacingAndGlyphs');
}

/* ---------- Vibration (Handy) ---------- */
const VIB={click:8,buy:10,claim:14,star:20,gold:[25,40,25],ach:[15,30,15,30,40],level:[30,50,30],win:[30,50,30,50,60]};
let vibLast=0;
function vibFor(kind){
  if(!S.opt.vib||!navigator.vibrate||document.documentElement.dataset.input!=='touch'||document.hidden) return;
  const p=VIB[kind];if(!p) return;
  const now=performance.now();if(now-vibLast<70) return;vibLast=now;
  try{navigator.vibrate(p);}catch(x){}
}
function vibSetup(){
  if($id('vibChk')||!('vibrate' in navigator)) return;
  const bgm=$id('bgmChk');if(!bgm) return;
  const l=document.createElement('label');l.className='check';l.style.marginTop='8px';
  l.innerHTML='<input type="checkbox" id="vibChk"> <span id="vibL"></span>';
  bgm.closest('label').after(l);
  $id('vibChk').checked=S.opt.vib!==false;
  $id('vibChk').addEventListener('change',e=>{S.opt.vib=e.target.checked;save();if(S.opt.vib) try{navigator.vibrate(30);}catch(x){}});
}

/* ---------- Verlauf: Kekse und Produktion über die Zeit ---------- */
function sanHist(o){
  const ok=a=>Array.isArray(a)?a.filter(p=>Array.isArray(p)&&p.length===3&&p.every(v=>typeof v==='number'&&isFinite(v)&&v>=0)).map(p=>[Math.floor(p[0]),p[1],p[2]]):[];
  if(!o||typeof o!=='object') return {h:[],d:[],a:[],ac:0};
  return {h:ok(o.h).slice(-72),d:ok(o.d).slice(-365),a:Array.isArray(o.a)?o.a.filter(v=>typeof v==='number'&&isFinite(v)&&v>0).map(Math.floor).slice(-100):[],ac:typeof o.ac==='number'&&o.ac>=0?Math.floor(o.ac):0};
}
function histTick(){
  if(!S||!S.hist) return;
  const H=S.hist,tm=Math.floor(Date.now()/60000),kps=isFinite(C.kps)?C.kps:0;
  if(!H.h.length&&!H.d.length) H.ac=S.asc;
  if(S.asc>H.ac){H.a.push(tm);H.a=H.a.slice(-100);H.ac=S.asc;}else if(S.asc<H.ac) H.ac=S.asc;
  const lh=H.h[H.h.length-1];
  if(!lh||tm-lh[0]>=60){H.h.push([tm,S.all,kps]);if(H.h.length>72) H.h.shift();}
  const ld=H.d[H.d.length-1];
  if(!ld||Math.floor(ld[0]/1440)!==Math.floor(tm/1440)){H.d.push([tm,S.all,kps]);if(H.d.length>365) H.d.shift();}
  else{ld[1]=S.all;ld[2]=kps;}
}
let histRange='h',histSig='';
function histPts(){
  const H=S.hist||{h:[],d:[]},now=Math.floor(Date.now()/60000);
  let P=histRange==='h'?H.h.slice():H.d.filter(p=>p[0]>=(histRange==='m'?now-30*1440:0));
  if(histRange!=='h') P=P.slice(0,-1);   // today's daily point is replaced by "now"
  const last=P[P.length-1];
  if(!last||now-last[0]>=5) P.push([now,S.all,isFinite(C.kps)?C.kps:0]);   // the line always ends with the values right now
  return P;
}
const histDT=(tm,long)=>new Date(tm*60000).toLocaleString(LOC[LANG],long?{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'2-digit'});
function histChart(key,title,P,k){
  const vals=P.map(p=>Math.max(1,p[k])),lg=vals.map(v=>Math.log10(v)),lo=Math.min(...lg),hi=Math.max(...lg),span=Math.max(1e-9,hi-lo);
  const t0=P[0][0],t1=P[P.length-1][0],tspan=Math.max(1,t1-t0);
  const xs=P.map(p=>(p[0]-t0)/tspan*1000),ys=lg.map(v=>150-(v-lo)/span*136);
  const line=xs.map((x,i)=>(i?'L':'M')+x.toFixed(1)+' '+ys[i].toFixed(1)).join(' ');
  const area=line+' L1000 160 L0 160 Z';
  const asc=(S.hist.a||[]).filter(a=>a>=t0&&a<=t1).map(a=>'<i class="hasc" style="left:'+((a-t0)/tspan*100).toFixed(2)+'%" title="'+tt('Aufstieg','Ascension')+' '+histDT(a,true)+'"><span>👼</span></i>').join('');
  return '<figure class="hchart" data-hk="'+k+'"><figcaption><b>'+title+'</b><span>'+tt('jetzt ','now ')+fmt(P[P.length-1][k])+'</span></figcaption>'
    +'<div class="hplot" role="img" aria-label="'+title+': '+tt('von ','from ')+fmt(P[0][k])+tt(' bis ',' to ')+fmt(P[P.length-1][k])+'">'
    +'<span class="hmax">'+fmt(Math.pow(10,hi))+'</span><span class="hmin">'+fmt(Math.pow(10,lo))+'</span>'
    +'<svg viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true"><path class="harea" d="'+area+'"/><path class="hline" d="'+line+'" vector-effect="non-scaling-stroke"/></svg>'
    +asc+'<i class="hguide" hidden></i><div class="htip" hidden></div></div>'
    +'<div class="dx"><span>'+histDT(t0,histRange==='h')+'</span><span>'+histDT(t1,histRange==='h')+'</span></div></figure>';
}
function histRender(force){
  const box=$id('histBox'),sb=$id('statBox');if(!box||!sb) return;
  const vis=!sb.closest('.gsub').hidden&&!document.hidden;if(!vis&&!force) return;
  const P=histPts(),sig=LANG+'|'+histRange+'|'+P.length+'|'+(P.length?P[P.length-1][0]:'')+'|'+(S.hist.a||[]).length;
  if(sig===histSig&&!force) return;histSig=sig;
  let h='<div class="hhead"><h3 class="wt">📈 '+tt('Dein Verlauf','Your history')+'</h3><div class="seg" id="histSeg" role="group" aria-label="'+tt('Zeitraum','Time range')+'">'
    +[['h',tt('3 Tage','3 days')],['m',tt('30 Tage','30 days')],['a',tt('Alles','All')]].map(([v,l])=>'<button type="button" data-hr="'+v+'" aria-pressed="'+(histRange===v)+'">'+l+'</button>').join('')+'</div></div>';
  if(P.length<2) h+='<p class="small">'+tt('Dein Verlauf beginnt jetzt – in ein paar Minuten siehst du die erste Linie, danach kommt jede Stunde ein Punkt dazu.','Your history starts now – in a few minutes you’ll see the first line, then a new point is added every hour.')+'</p>';
  else{
    h+=histChart('all',tt('Kekse insgesamt gebacken','Cookies baked in total'),P,1)+histChart('kps',tt('Produktion pro Sekunde','Production per second'),P,2);
    h+='<p class="small muted">'+tt('Logarithmische Skala: jede Stufe nach oben ist ein Vielfaches. 👼 = Aufstieg.','Logarithmic scale: each step up is a multiple. 👼 = ascension.')+'</p>';
    h+='<details class="fold"><summary>'+tt('Als Tabelle','As a table')+'</summary><div class="dtable"><table><thead><tr><th>'+tt('Zeit','Time')+'</th><th>'+tt('Kekse insgesamt','Cookies in total')+'</th><th>'+tt('pro Sekunde','per second')+'</th></tr></thead><tbody>'
      +P.slice().reverse().slice(0,60).map(p=>'<tr><td>'+histDT(p[0],true)+'</td><td>'+fmt(p[1])+'</td><td>'+fmt(p[2])+'</td></tr>').join('')+'</tbody></table></div></details>';
  }
  box.innerHTML=h;
}
function histTip(e){
  const p=e.target.closest&&e.target.closest('.hplot');if(!p) return;
  const P=histPts();if(P.length<2) return;
  const k=+p.closest('.hchart').dataset.hk,r=p.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  const t0=P[0][0],t1=P[P.length-1][0],tm=t0+x*(t1-t0);let bi=0;P.forEach((q,i)=>{if(Math.abs(q[0]-tm)<Math.abs(P[bi][0]-tm)) bi=i;});
  const q=P[bi],px=(q[0]-t0)/Math.max(1,t1-t0)*r.width,g=p.querySelector('.hguide'),tip=p.querySelector('.htip');
  g.hidden=false;g.style.left=px+'px';tip.hidden=false;tip.innerHTML='<b>'+fmt(q[k])+'</b> '+histDT(q[0],true);
  tip.style.left=Math.max(4,Math.min(r.width-tip.offsetWidth-4,px-tip.offsetWidth/2))+'px';
}
function histSetup(){
  const sb=$id('statBox');if(!sb||$id('histBox')) return;
  const b=document.createElement('div');b.id='histBox';b.className='histbox';sb.after(b);
  b.addEventListener('click',e=>{const s=e.target.closest('[data-hr]');if(s){histRange=s.dataset.hr;histRender(true);}});
  b.addEventListener('pointermove',histTip);b.addEventListener('pointerdown',histTip);
  b.addEventListener('pointerout',e=>{const p=e.target.closest&&e.target.closest('.hplot');if(p&&!p.contains(e.relatedTarget)){p.querySelectorAll('.hguide,.htip').forEach(x=>x.hidden=true);}});
}

/* ---------- Willkommen zurück: hochzählen, nacheinander einblenden, alles einsammeln ---------- */
function awayReadyExp(){return (S.w&&S.w.exp&&S.w.exp.slots||[]).map((s,i)=>s&&Date.now()>=s.end?i:-1).filter(i=>i>=0);}
function awayPlus(r){
  const body=$id('awayBody');if(!body) return;
  const g=body.querySelector('.awhero b');if(g&&r&&r.gain>0) countUp(g,r.gain,1200,'+');
  body.querySelectorAll('.awt').forEach((t,i)=>{t.style.animationDelay=(.15+i*.07)+'s';t.classList.add('awin');});
  const can=goalsReady()||awayReadyExp().length>0;
  if(!can||body.querySelector('[data-aw2]')) return;
  const btn='<button type="button" class="btn primary awall" data-aw2="all">🧺 '+tt('Alles einsammeln','Collect all')+'</button>';
  const rd=body.querySelector('.awready .btns');
  if(rd) rd.insertAdjacentHTML('afterbegin',btn);else body.insertAdjacentHTML('beforeend','<div class="awready"><div class="btns">'+btn+'</div></div>');
}
$id('awayBody').addEventListener('click',e=>{
  const b=e.target.closest('[data-aw2]');if(!b) return;
  e.stopPropagation();
  const c0=S.cookies;let n=0;
  if(goalsReady()){claimAll();n++;}
  awayReadyExp().forEach(i=>{expCollect(i);n++;});
  render();snd('claim');
  b.disabled=true;b.textContent='✓ '+tt('Eingesammelt','Collected')+(S.cookies>c0?' · +'+fmt(S.cookies-c0):'');
  const cl=$id('awayBody').querySelector('[data-aw="claim"]');if(cl) cl.remove();
},true);

/* ---------- Start ---------- */
tabCfgSetup();bviewSetup();vibSetup();histSetup();
tabs.forEach(t=>t.addEventListener('click',()=>tabApply()));
function v59Txt(){
  set$('tabSecH',tt('Tab-Leiste','Tab bar'));
  set$('tabSecP',tt('Ändere die Reihenfolge und blende Tabs aus, die du nicht brauchst. „Bauen“ bleibt immer. Gilt für dieses Gerät.','Change the order and hide tabs you don’t use. “Build” always stays. Applies to this device.'));
  set$('tabReset',tt('Zurücksetzen','Reset'));set$('vibL',tt('Vibration bei Klicks, Goldkeksen und Erfolgen','Vibration for clicks, golden cookies and achievements'));
  const bl=document.querySelector('#bviewSeg [data-bv="list"]'),bg=document.querySelector('#bviewSeg [data-bv="grid"]');
  if(bl){bl.textContent='☰';bl.setAttribute('aria-label',tt('Liste','List'));bl.title=tt('Liste','List');}
  if(bg){bg.textContent='▦';bg.setAttribute('aria-label',tt('Raster','Grid'));bg.title=tt('Raster','Grid');}
}
v59Ready=true;
v59Txt();tabApply();histTick();
if(!startOv.hidden) stBakery();
setInterval(()=>{histTick();v59Txt();tabApply();if(!els.setOv.hidden) tabCfgRender();histRender(false);const v=$id('vibChk');if(v&&v.checked!==(S.opt.vib!==false)) v.checked=S.opt.vib!==false;},2000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden) histTick();});
