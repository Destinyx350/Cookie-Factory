/* ======================= Anzeige und Takt ======================= */
let dispCk=null,dispTs=0;
function ckFrame(ts){
  requestAnimationFrame(ckFrame);
  const tgt=S.cookies;
  if(dispCk===null||!isFinite(dispCk)||!isFinite(tgt)||reduced||S.opt.eco||Math.abs(tgt-dispCk)>Math.max(1e3,Math.abs(tgt))*50) dispCk=tgt;
  else{const dt=Math.min(.2,Math.max(0,(ts-dispTs)/1000));dispCk+=(tgt-dispCk)*(1-Math.exp(-dt*11));if(Math.abs(tgt-dispCk)<Math.max(.5,Math.abs(tgt)*1e-7)) dispCk=tgt;}
  dispTs=ts;const t=fmt(dispCk);if(els.count.textContent!==t) els.count.textContent=t;
}
requestAnimationFrame(ckFrame);
function render(){
  if(document.hidden||S.opt.eco) els.count.textContent=fmt(S.cookies);
  els.kps.textContent=fmtRate(C.kps);
  els.perClick.textContent=fmtRate(C.click);
  els.run.textContent=fmt(S.run);
  els.chips.textContent=chipsFree()+' / '+S.chips;
  {const bh=beginHint();if(els.hint._h!==bh){els.hint._h=bh;els.hint.textContent=bh;els.hint.hidden=!bh;}}
  {const bh=visChip()+envChip()+startChip()+S.buffs.map(f=>'<span class="buff">'+buffName(f.id)+' · '+tr('secs',{n:Math.ceil(f.t)})+'</span>').join('')+evChip();if(els.buffs._h!==bh){els.buffs.innerHTML=bh;els.buffs._h=bh;}}
  els.stage.classList.toggle('frenzy',S.buffs.some(f=>f.id==='frenzy'));
  els.stage.classList.toggle('clickfrenzy',S.buffs.some(f=>f.id==='clickfrenzy'));
  updTabs();updTut();updBuild();updUp();updInf();updQol();updAsc();updReb();updGoals();updAdv();updFr();updHints();updUndo();updOpts();updCombo();updSlots();updFact();updDesign();updNtf();safe(updAscSub,'ascsub');safe(updEG,'eg-ui');safe(updCur,'cur');safe(updCQ,'cq');updLoot();updOrders();updWorld();
  if(!els.setOv.hidden&&setSub==='admin'&&Date.now()-lastAdmFill>600){lastAdmFill=Date.now();if(ADMH.fill) ADMH.fill();}
  els.newsBadge.hidden=S.opt.news>=NEWS_VER;els.newsBtn.classList.toggle('fresh',S.opt.news<NEWS_VER);
}
let last=Date.now();
let ecoN=0,titleT=0;const safeErr={};
function safe(fn,tag){try{fn();}catch(e){if(!safeErr[tag]){safeErr[tag]=1;if(window.__kfErr) window.__kfErr(tag+': '+(e&&e.message||e));}}}
function tick(){
  const now=Date.now();
  let dt=(now-last)/1000;last=now;
  if(!(dt>0)) return;
  const rdt=Math.min(dt,60);
  dt=Math.min(dt,3600)*S.admin.speed;
  if(S.buffs.length){
    let ch=false;
    for(let i=S.buffs.length-1;i>=0;i--){S.buffs[i].t-=dt;if(S.buffs[i].t<=0){S.buffs.splice(i,1);ch=true;}}
    if(ch) recalc();
  }
  for(const k in S.boostCd){S.boostCd[k]-=dt;if(S.boostCd[k]<=0) delete S.boostCd[k];}
  safe(()=>tickOrders(dt),'orders');safe(()=>tickWorld(dt),'world');safe(()=>tickWork(dt),'work');safe(()=>statTick(rdt),'stat');safe(()=>runTick(rdt),'run');safe(()=>comboTick(rdt),'combo');safe(()=>heroTick(dt),'hero');safe(()=>frTick(dt),'fr');safe(()=>visTick(rdt),'vis');safe(()=>egTick(rdt),'endgame');
  const g=C.kps*dt;
  S.cookies+=g;S.run+=g;S.all+=g;
  S.goldT-=dt;
  if(S.goldT<=0){
    if(goldEl) S.goldT=5;
    else if(WFX.nogold){S.goldT=60;}
    else{spawnGolden();S.goldT=rand(300,660)*C.goldRate;}
  }
  safe(()=>checkAch(false),'ach');
  if(now-ttlT>2000){ttlT=now;safe(checkTtl,'titles');safe(sysCheck,'sys');}
  ecoN++;if(!S.opt.eco||ecoN%4===0) safe(render,'render');
  safe(musTick,'music');
  if(now-titleT>1000){titleT=now;const tl=S.opt.title?fmt(S.cookies)+' '+tt('Kekse','cookies')+' – '+tt('Keksfabrik','Cookie Factory'):tt('Keksfabrik','Cookie Factory');if(document.title!==tl) document.title=tl;}
  if(now-lastSaveAt>S.opt.as*1000) save();
  if(now-lastBk>900000) pushBackup();
}

/* Tastatur: Leertaste oder Enter backen, solange kein Bedienelement den Fokus hat.
   Nach einem Mausklick verliert der Button den Fokus, damit die Leertaste ihn nicht erneut auslöst. */
document.addEventListener('keydown',e=>{
  if((e.key!==' '&&e.key!=='Enter')||e.repeat) return;
  if((e.target!==document.body&&e.target!==document.documentElement)||!els.newsOv.hidden||!els.setOv.hidden||awayOpen||!!document.querySelector('.overlay:not([hidden]),#startOv:not([hidden])')||!document.getElementById('ntfOv').hidden||!document.getElementById('visOv').hidden) return;
  e.preventDefault();
  const r=els.cookie.getBoundingClientRect();
  doClick(r.left+r.width/2+rand(-30,30),r.top+r.height/2+rand(-30,30));
});
document.addEventListener('click',e=>{
  if(e.detail===0) return;
  const b=e.target.closest&&e.target.closest('button');
  if(b&&b!==els.cookie&&!b.closest('.tdetail')) b.blur();
});
