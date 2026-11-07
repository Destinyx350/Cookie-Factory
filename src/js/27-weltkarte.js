/* ===== Weltkarte ===== */
let wSelSec='mon',mapSig='';
const MAPLOC=[
  {id:'mon',x:14,y:30,art:'flame',n:['Monsterhöhle','Monster Cave']},
  {id:'mag',x:33,y:16,art:'book',n:['Zauberturm','Wizard Tower']},
  {id:'cr',x:30,y:47,art:'whisk',n:['Werkstatt','Workshop']},
  {id:'gar',x:16,y:70,art:'drop',n:['Garten','Garden']},
  {id:'mk',x:50,y:38,art:'coin',n:['Börse','Stock Market']},
  {id:'lab',x:52,y:12,art:'therm',n:['Labor','Lab']},
  {id:'pet',x:31,y:76,art:'milk',n:['Tierhof','Animal Farm']},
  {id:'ch',x:58,y:62,art:'crown',n:['Arena','Arena']},
  {id:'exp',x:50,y:82,art:'moon',n:['Hafen','Harbor'],sub:['Expeditionen','Expeditions']},
  {id:'adv',x:84,y:24,art:'mitt',n:['Burg','Castle'],sub:['Abenteuer','Adventure'],ws:1},
  {id:'fr',x:84,y:72,art:'b2',n:['Stadt','Town'],sub:['Filialen','Stores'],ws:1}
];
const MAPBG='<svg viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">'
 +'<rect width="1000" height="500" fill="#86c76f"/>'
 +'<path d="M0 0H1000V500H0Z" fill="url(#mg)" opacity=".5"/><defs><radialGradient id="mg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#a8dc8a"/><stop offset="1" stop-color="#5f9f52"/></radialGradient></defs>'
 +'<path d="M0 0H330L300 60 250 40 200 110 150 50 90 120 40 70 0 120Z" fill="#8a96a3"/><path d="M150 50l-22 30 14-4 8 12 8-12 14 4zM250 40l-18 26 12-3 6 10 6-10 12 3z" fill="#f4f6f8"/>'
 +'<path d="M640 0C610 110 700 190 660 290S600 420 650 500" stroke="#5aa0d8" stroke-width="34" fill="none"/><path d="M640 0C610 110 700 190 660 290S600 420 650 500" stroke="#8cc6ef" stroke-width="12" fill="none" opacity=".7"/>'
 +'<path d="M0 470C150 430 300 500 470 455S760 440 1000 470V500H0Z" fill="#4f8fd0"/>'
 +'<rect x="626" y="300" width="70" height="16" rx="3" fill="#b07a4a"/>'
 +'<path d="M140 150C220 190 260 220 300 235S420 230 500 190 560 160 640 160M300 235C250 290 200 320 160 350M500 190C520 260 560 300 580 310M300 235C350 300 390 330 400 360M580 310C520 360 470 400 440 450M680 160C760 130 800 120 840 120M680 310C760 340 800 360 840 360" stroke="#e9d3a2" stroke-width="9" stroke-dasharray="2 14" stroke-linecap="round" fill="none" opacity=".95"/>'
 +[[90,250],[110,270],[230,300],[250,330],[380,120],[410,140],[560,240],[740,250],[770,270],[930,200],[950,430],[880,430],[360,420],[700,420],[480,300]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="16" fill="#3f7a3a"/><circle cx="'+(x-4)+'" cy="'+(y-5)+'" r="9" fill="#5a9a4c"/>').join('')
 +'<path d="M770 70h120v80H770z" fill="#c9b08a"/><path d="M760 70l20-26 20 26zM850 70l20-26 20 26zM805 70l25-34 25 34z" fill="#8f5a3c"/>'
 +'<path d="M760 330h40v40h-40zM810 315h45v55h-45zM865 335h40v35h-40z" fill="#f3e3c3"/><path d="M756 330l24-18 24 18zM806 315l26-20 26 20zM861 335l24-16 24 16z" fill="#d9573f"/>'
 +'</svg>';
function mapDots(){
  const w=S.w,mx=maxMana();
  return {
    mon:w.mon.st==='wait'&&!wLv('hunter'),
    mag:mx>=15&&w.mana>=mx-.5&&!wLv('mage'),
    gar:!wLv('garden')&&w.gar.plots.some((p,i)=>!p&&S.all>=PLOT_UNLOCK[i])&&S.all>=1e5,
    exp:!wLv('exped')&&w.exp.done>0&&w.exp.slots.some(s=>!s),
    lab:!wLv('research')&&!w.lab.cur&&LABS.some(l=>!w.lab.done[l.id]&&S.all>=l.unlock&&S.cookies>=labCost(l)),
    adv:advReady(),fr:frEmpty()
  };
}
function updMap(){
  const d=mapDots(),cur=wSubV==='world'?wSelSec:wSubV;
  const sig=LANG+'|'+cur+'|'+JSON.stringify(d)+'|'+tabUnl('adv')+tabUnl('fr')+'|'+(S.seen.adv?1:0)+(S.seen.fr?1:0);
  if(sig===mapSig) return;
  mapSig=sig;
  document.getElementById('wMap').innerHTML=MAPBG+MAPLOC.map(l=>{
    const lk=l.ws&&!tabUnl(l.id),nw=l.ws&&!lk&&!S.seen[l.id];
    return '<button type="button" class="wloc'+(l.id===cur?' on':'')+(lk?' lk':'')+'" style="left:'+l.x+'%;top:'+l.y+'%" data-loc="'+l.id+'" title="'+tx(l.sub||l.n)+(lk?' · '+tt('ab ','from ')+fmt(UNL[l.id]):'')+'"><span class="wi">'+art(l.art)+(d[l.id]?'<i class="dot"></i>':'')+(nw?'<i class="tnew">'+tr('tab_new')+'</i>':'')+'</span><span class="nm">'+tx(l.n)+'</span></button>';
  }).join('');
}
document.getElementById('wMap').addEventListener('click',e=>{
  const b=e.target.closest('[data-loc]');if(!b) return;
  const l=MAPLOC.find(x=>x.id===b.dataset.loc);
  if(l.ws){if(!tabUnl(l.id)){nope(b);toast(tx(l.sub)+tt(' wird ab ',' unlocks at ')+fmt(UNL[l.id])+tt(' Keksen insgesamt freigeschaltet.',' cookies baked in total.'));return;}setWsub(l.id);}
  else{wSelSec=l.id;if(wSubV!=='world') setWsub('world');else render();}
  mapSig='';
});

/* Erfolge */
const achEls={};
function rebuildAch(){
  els.achGrid.innerHTML='';
  A.forEach(a=>{
    const d=document.createElement('div');d.className='ach';
    d.innerHTML='<b></b><span></span>';
    els.achGrid.appendChild(d);achEls[a.id]=d;
  });
  refreshAch();
}
function refreshAch(){
  A.forEach(a=>{const el=achEls[a.id];if(!el) return;const on=!!S.ach[a.id];el.classList.toggle('on',on);el.classList.toggle('plat',!!a.plat);
    const hid=a.secret&&!on,nm=hid?'???':tx(a.name),ds=hid?tt('Geheimer Erfolg','Secret achievement'):a.desc();
    if(el.firstChild.textContent!==nm) el.firstChild.textContent=nm;if(el.lastChild.textContent!==ds) el.lastChild.textContent=ds;});
  const n=Object.keys(S.ach).length;
  els.achHead.textContent=tr('ach_head',{n,m:A.length,x:(Math.round(n*5)/10).toLocaleString(LOC[LANG])});
}
function checkAch(silent){
  let got=false;
  for(const a of A){
    if(S.ach[a.id]) continue;
    if(a.test()){S.ach[a.id]=1;got=true;addPP(5);if(!silent) toast(tr('toast_ach',{n:tx(a.name)}),true);}
  }
  if(got){recalc();refreshAch();starMilestones();if(!silent){snd('ach');confetti(12);}}
}

/* Aufstieg */
const chipWord=c=>tr(c===1?'chip_1':'chip_n',{n:c});
function updAsc(){
  const gain=chipsPotential(),free=chipsFree();
  els.ascBadge.textContent=free;els.ascBadge.hidden=free<=0;
  if(!panes.asc.hidden){
    const k=S.chips+gain+1,need=Math.max(0,8e9*k*k*k-(S.all-S.reb.base));
    const base=(Math.round(S.chips*C.chipRate*1000)/10).toLocaleString(LOC[LANG]);
    const asb=(S.asc*(S.reb.tree.r_asc?4:2)).toLocaleString(LOC[LANG]);
    els.kv.innerHTML='<dt>'+tr('kv_all')+'</dt><dd>'+fmt(S.all)+'</dd><dt>'+tr('kv_chips')+'</dt><dd>'+S.chips+'</dd><dt>'+tr('kv_free')+'</dt><dd>'+free+'</dd><dt>'+tr('kv_base')+'</dt><dd>+'+base+' %</dd><dt>'+tr('kv_ascs')+'</dt><dd>'+S.asc+' (+'+asb+' %)</dd><dt>'+tr('kv_gain')+'</dt><dd>'+gain+'</dd><dt>'+tr('kv_next')+'</dt><dd>'+tr('kv_next_v',{n:fmt(need)})+'</dd>';
    updTree();
  }
  els.ascBtn.disabled=gain<=0;
  if(!els.ascBtn.dataset.armed) els.ascBtn.textContent=gain>0?tr(gain===1?'asc_btn_1':'asc_btn_n',{n:gain}):tr('asc_btn');
}
function armed(btn,armedKey,restore,action){
  let timer=null;
  btn.addEventListener('click',()=>{
    if(btn!==els.resetBtn&&!S.opt.ask){restore();action();return;}
    if(btn.dataset.armed){
      clearTimeout(timer);delete btn.dataset.armed;btn.classList.remove('armed');restore();action();return;
    }
    btn.dataset.armed='1';btn.classList.add('armed');btn.textContent=tr(armedKey);
    timer=setTimeout(()=>{delete btn.dataset.armed;btn.classList.remove('armed');restore();},5000);
  });
}
function rebuildAll(){
  showName();
  checkDay(true);rebSig='';workSig='';
  upSig='';upSeen=null;treeSig='';lootSig='';lastDraw=null;recalc();ensureOrders();ensureWorld();refreshAch();if(ADMH.fill) ADMH.fill();setSkin();render();
}
armed(els.ascBtn,'asc_confirm',()=>updAsc(),()=>{doAscend();});
function doAscend(){
  const gain=chipsPotential();if(gain<=0) return false;
  resetRun(gain,null);
  flash(.95,1500);burst(innerWidth/2,innerHeight/2,36);
  toast(tr('asc_done',{n:S.chips}),true);return true;
}

/* Himmlischer Baum */
let selNode='root',treeSig='';
const nodeEls={};
(function buildTree(){
  let ln='';
  TREE.forEach(n=>n.req.forEach(r=>{
    const a=TMAP[r];
    ln+='<line data-from="'+r+'" data-to="'+n.id+'" x1="'+a.px+'" y1="'+a.py+'" x2="'+n.px+'" y2="'+n.py+'"/>';
  }));
  els.treeLines.innerHTML=ln;
  let st='',sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  for(let i=0;i<900;i++){const r=rnd()<.9?.6+rnd()*.9:1.6+rnd()*1.4;st+='<circle cx="'+Math.round(rnd()*4000)+'" cy="'+Math.round(rnd()*4000)+'" r="'+r.toFixed(1)+'" opacity="'+(.25+rnd()*.7).toFixed(2)+'"/>';}
  document.getElementById('smapStars').innerHTML=st;
  TREE.forEach(n=>{
    const b=document.createElement('button');
    b.type='button';b.className='tnode'+(n.id==='root'?' root':'');b.dataset.id=n.id;
    b.style.left=n.px+'px';b.style.top=n.py+'px';
    b.innerHTML='<span class="ti">'+art(n.art)+'</span><span class="tn"></span><span class="c"></span>';
    els.tree.appendChild(b);nodeEls[n.id]=b;
  });
})();
const bought=id=>!!S.tree[id];
const reqMet=n=>n.req.every(bought);
function updTree(){
  if(!TV.init&&smap.clientWidth>0){TV.init=true;TV.s=smap.clientWidth<500?.45:.6;tCenter('root');}
  setTxt(document.getElementById('smapHelp'),tt('Ziehen zum Verschieben · Mausrad oder +/− zum Zoomen · Knoten antippen für Details','Drag to move · mouse wheel or +/− to zoom · tap a node for details'));
  const free=chipsFree();
  els.treeHead.textContent=tr('tree_head',{f:chipWord(free),t:S.chips});
  TREE.forEach(n=>{
    const el=nodeEls[n.id],on=bought(n.id),met=reqMet(n);
    el.classList.toggle('on',on);
    el.classList.toggle('can',!on&&met&&free>=n.cost);
    el.classList.toggle('locked',!on&&!met);
    el.classList.toggle('sel',n.id===selNode);
    el.querySelector('.tn').textContent=tx(n.name);el.title=tx(n.name)+' · '+(on?tr('active'):chipWord(n.cost));
    el.querySelector('.c').textContent=on?tr('active'):chipWord(n.cost);
  });
  els.treeLines.querySelectorAll('line').forEach(l=>l.classList.toggle('on',bought(l.dataset.to)));
  const n=TMAP[selNode],on=bought(n.id),met=reqMet(n),afford=free>=n.cost;
  const sig=[LANG,selNode,on,met,afford,free].join('|');
  if(sig===treeSig) return;
  treeSig=sig;
  let action;
  if(on) action='<span class="small">'+tr('active')+'.</span>';
  else if(!met) action='<span class="small">'+tr('tree_locked',{r:n.req.map(r=>tx(TMAP[r].name)).join(', ')})+'</span>';
  else action='<button type="button" class="btn primary" id="buyNode"'+(afford?'':' disabled')+'>'+tr('tree_buy',{c:chipWord(n.cost)})+'</button>'+(afford?'':' <span class="small">'+tr('tree_missing',{c:chipWord(n.cost-free)})+'</span>');
  els.tdetail.innerHTML='<h3>'+tx(n.name)+'</h3><p>'+tx(n.desc)+'</p>'+action;
}
els.tree.addEventListener('click',e=>{
  if(tDrag.moved) return;
  const b=e.target.closest('.tnode');if(!b) return;
  selNode=b.dataset.id;treeSig='';render();
});
/* Sternenkarte: verschieben + zoomen */
const smap=document.getElementById('smap'),TV={x:0,y:0,s:.6,init:false},tDrag={on:false,moved:false,sx:0,sy:0,ox:0,oy:0,id:null};
function tApply(){els.tree.style.transform='translate('+TV.x+'px,'+TV.y+'px) scale('+TV.s+')';}
function tCenter(id){const n=TMAP[id]||TMAP.root;TV.x=smap.clientWidth/2-n.px*TV.s;TV.y=smap.clientHeight/2-n.py*TV.s;tApply();}
function tZoom(f,cx,cy){
  const s2=Math.min(1.6,Math.max(.25,TV.s*f));
  if(cx===undefined){cx=smap.clientWidth/2;cy=smap.clientHeight/2;}
  TV.x=cx-(cx-TV.x)*(s2/TV.s);TV.y=cy-(cy-TV.y)*(s2/TV.s);TV.s=s2;tApply();
}
smap.addEventListener('pointerdown',e=>{
  if(e.target.closest('.smap-ctl')) return;
  tDrag.on=true;tDrag.moved=false;tDrag.sx=e.clientX;tDrag.sy=e.clientY;tDrag.ox=TV.x;tDrag.oy=TV.y;tDrag.id=e.pointerId;
});
smap.addEventListener('pointermove',e=>{
  if(!tDrag.on||e.pointerId!==tDrag.id) return;
  const dx=e.clientX-tDrag.sx,dy=e.clientY-tDrag.sy;
  if(!tDrag.moved&&Math.abs(dx)+Math.abs(dy)>5){tDrag.moved=true;smap.classList.add('drag');try{smap.setPointerCapture(e.pointerId);}catch(err){}}
  if(tDrag.moved){TV.x=tDrag.ox+dx;TV.y=tDrag.oy+dy;tApply();}
});
const tUp=()=>{if(!tDrag.on) return;tDrag.on=false;smap.classList.remove('drag');setTimeout(()=>{tDrag.moved=false;},0);};
smap.addEventListener('pointerup',tUp);smap.addEventListener('pointercancel',tUp);
smap.addEventListener('wheel',e=>{e.preventDefault();const r=smap.getBoundingClientRect();tZoom(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top);},{passive:false});
document.getElementById('tzIn').addEventListener('click',()=>tZoom(1.25));
document.getElementById('tzOut').addEventListener('click',()=>tZoom(1/1.25));
document.getElementById('tzHome').addEventListener('click',()=>{TV.s=.6;tCenter('root');});
els.tdetail.addEventListener('click',e=>{
  if(!e.target.closest('#buyNode')) return;
  const n=TMAP[selNode];
  if(bought(n.id)||!reqMet(n)||chipsFree()<n.cost) return;
  S.tree[n.id]=1;recalc();treeSig='';checkAch(false);render();
  const el=nodeEls[n.id],rc=el.getBoundingClientRect();
  anim(el,[{boxShadow:'0 0 0 0 rgba(241,178,74,.9)'},{boxShadow:'0 0 0 22px rgba(241,178,74,0)'}],{duration:650,easing:'ease-out'});
  burst(rc.left+rc.width/2,rc.top+rc.height/2,16);
  toast(tr('tree_unlocked',{n:tx(n.name)}),true);
});
armed(els.respecBtn,'respec_confirm',()=>{els.respecBtn.textContent=tr('respec');},()=>{
  S.tree={};S.sec.respec=(S.sec.respec||0)+1;recalc();treeSig='';render();toast(tr('respec_done'));
});
