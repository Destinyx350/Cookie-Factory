/* ===== Abenteuer: Held, Dungeons, Endlos-Turm ===== */
function heroSVG(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M50 8l5 5-21 21-5-5z" fill="#dfe6ea" stroke="#8a98a3" stroke-width="1.5"/><path d="M27 31l6 6-5 3-4-4z" fill="#b5821e"/><circle cx="28" cy="40" r="18" fill="#e3a861" stroke="#a8692e" stroke-width="2.5"/><circle cx="20" cy="45" r="2.6" fill="#5a3418"/><circle cx="34" cy="50" r="2.2" fill="#5a3418"/><circle cx="37" cy="40" r="1.8" fill="#5a3418"/><path d="M11 33q17-19 34 0v-5Q28 11 11 28z" fill="#9aa6af" stroke="#6b7780" stroke-width="1.5"/><rect x="17" y="32" width="22" height="5" rx="2.5" fill="#2a3640"/><circle cx="23" cy="34.5" r="1.4" fill="#fff"/><circle cx="33" cy="34.5" r="1.4" fill="#fff"/><path d="M28 14l3-7 3 7z" fill="#d9573f"/></svg>';}
const itemStat=it=>{const m=it.p*(1+.3*it.r)*(1+.1*(it.up||0));return it.s==='w'?{atk:Math.round(3*m),hp:0}:it.s==='a'?{atk:0,hp:Math.round(25*m)}:{atk:Math.round(1.5*m),hp:Math.round(12*m)};};
const itemScore=it=>{const s=itemStat(it);return s.atk*8+s.hp;};
const tierIdx=p=>Math.max(0,Math.min(4,Math.floor(Math.log(Math.max(1,p))/Math.log(3))));
const itemName=it=>tx(GEARN[it.s][tierIdx(it.p)])+(it.up?' +'+it.up:'');
const itemStatTxt=it=>{const s=itemStat(it),o=[];if(s.atk) o.push(tt('Angriff +','Attack +')+fmt(s.atk));if(s.hp) o.push(tt('Leben +','Health +')+fmt(s.hp));return o.join(' · ');};
const sellVal=it=>Math.ceil(Math.max(100,C.kps0*5*(1+it.r)*Math.sqrt(it.p)));
const sk=id=>S.hero.sk[id]||0;
const skFree=()=>S.hero.lvl-1-SKILLS.reduce((a,k)=>a+sk(k.id),0);
function petPower(){let p=0;S.w.pet.eq.forEach(id=>{p+=petLvl(id);});return p;}
function heroStats(){
  const H=S.hero;let atk=6+2*(H.lvl-1),hp=60+12*(H.lvl-1);
  atk*=UE.heroAtk;hp=Math.round(hp*UE.heroHp);
  Object.values(H.gear).forEach(it=>{if(it){const s=itemStat(it);atk+=s.atk*UE.heroAtk;hp+=Math.round(s.hp*UE.heroHp);}});
  atk=Math.round(atk*(1+.1*sk('ds'))*(1+.08*petPower()));
  const crit=.1+.05*sk('crit');
  return {atk,hp,dps:atk*(1+crit),crit,regen:hp*.01*sk('heal'),dr:.06*sk('iron')};
}
const fightLoss=(st,m)=>Math.max(0,m.atk*(1-st.dr)-st.regen)*(m.hp/st.dps);
const xpNeed=L=>Math.ceil(30*Math.pow(L,1.6));
function heroXP(n){
  if(wLv('adventurer')>=2) n=Math.ceil(n*1.2);
  const H=S.hero;H.xp+=n;let up=0;
  while(H.xp>=xpNeed(H.lvl)&&H.lvl<999){H.xp-=xpNeed(H.lvl);H.lvl++;up++;}
  if(up){confetti(30);toast(tt('Dein Held ist jetzt Stufe ','Your hero is now level ')+H.lvl+'!',true);snd('level');recalc();}
}
function monFor(pw,r,boss,kind){const hp=Math.ceil(30*pw*(1+.15*r)*(boss?2.5:1));return {hp,max:hp,atk:2*pw*(1+.1*r)*(boss?1.5:1),kind:kind===undefined?Math.floor(Math.random()*MON_KINDS.length):kind,boss:boss?1:0};}
const towerPw=f=>Math.pow(1.13,f-1);
const towerMon=f=>monFor(towerPw(f),2,f%10===0,f%MON_KINDS.length);
function rollRar(boss){let r=Math.random()*100;const W=boss?[35,35,20,8,2]:[60,28,9,2.5,.5];for(let i=0;i<5;i++){r-=W[i];if(r<0) return i;}return 0;}
function newItem(pw,boss){const H=S.hero;return {id:H.nid++,s:['w','a','t'][Math.floor(Math.random()*3)],r:rollRar(boss),p:Math.round(pw*(.85+Math.random()*.3)*100)/100};}
function gainItem(it){
  const H=S.hero;S.book.gear[it.s+tierIdx(it.p)]=1;
  if(!H.gear[it.s]){H.gear[it.s]=it;recalc();return tt('angelegt','equipped');}
  if(H.bag.length>=20){const v=sellVal(it);addCk(v);return tt('Tasche voll, verkauft für ','bag full, sold for ')+fmt(v);}
  H.bag.push(it);return '';
}
function regenSta(){
  const H=S.hero,now=Date.now();
  const SM=staMax();if(H.sta>=SM){H.staT=now;return;}
  const n=Math.floor((now-H.staT)/600000);
  if(n>0){H.sta=Math.min(SM,H.sta+n);H.staT+=n*600000;if(H.sta>=SM) H.staT=now;}
}
/* Vorhersage: wie weit kommt der Held? (gleiche Regeln wie im Kampf) */
function simDungeon(d){
  const st=heroStats(),D=DUNG[d];let hhp=st.hp;
  for(let r=0;r<6;r++){
    const m=monFor(D.pw,r,r===5);hhp-=fightLoss(st,m);
    if(hhp<=0) return r;
    hhp=Math.min(st.hp,hhp+st.hp*(wLv('adventurer')>=3?.4:.25));
  }
  return 6;
}
function simTower(f){const st=heroStats(),m=towerMon(f);return st.hp-fightLoss(st,m);}
function advStart(k,d){
  const H=S.hero;if(H.run) return false;
  const st=heroStats();
  if(k==='d'){regenSta();if(H.sta<1) return false;if(H.sta>=staMax()) H.staT=Date.now();H.sta--;H.run={k,d,r:0,hhp:st.hp,m:monFor(DUNG[d].pw,0,false)};}
  else{const f=H.tower.best+1;H.run={k:'t',f,r:0,hhp:st.hp,m:towerMon(f)};}
  return true;
}
function roomWin(){
  const H=S.hero,R=H.run,st=heroStats();
  S.book.mon[R.m.kind]=1;
  if(R.k==='t'){
    const f=R.f,pw=towerPw(f),xp=Math.ceil(6*pw),ck=Math.ceil(Math.max(500,C.kps0*30*Math.sqrt(f))*(1+.15*sk('gold')));
    H.tower.best=Math.max(H.tower.best,f);addPP(2);addCk(ck);heroXP(xp);let ex='';
    if(f%10===0){const it=newItem(pw*1.2,true),m=gainItem(it);ex=' · '+itemName(it)+' ('+tx(RARN[it.r])+')'+(m?' · '+m:'');}
    if(f%10===0){confetti(25);shake();}
    if(f%25===0) starRoll(.3,tt('Endlos-Turm','Endless Tower'));
    toast(tt('Stockwerk ','Floor ')+f+tt(' geschafft! +',' cleared! +')+fmt(ck)+' · +'+xp+' XP'+ex,true);
    H.run=null;recalc();checkAch(false);
    if(H.auto) H.autoT=1.2;
    return;
  }
  const D=DUNG[R.d],boss=R.r===5,xp=Math.ceil(5*D.pw*(1+.2*R.r)*(boss?3:1));
  heroXP(xp);
  if(boss||Math.random()<.25+.08*sk('loot')){
    const it=newItem(D.pw*(1+.1*R.r),boss),m=gainItem(it);
    toast(tt('Beute: ','Loot: ')+itemName(it)+' ('+tx(RARN[it.r])+')'+(m?' · '+m:''),it.r>=3);
  }
  if(boss){
    const ck=Math.ceil(Math.max(1000,C.kps0*120*Math.sqrt(D.pw))*(1+.15*sk('gold')));addCk(ck);
    H.clr[D.id]=(H.clr[D.id]||0)+1;addPP(5);
    if(R.d===4) starRoll(.05,tx(D.n));
    toast(tx(D.n)+tt(' geschafft! +',' cleared! +')+fmt(ck),true);snd('ach');confetti(35);shake();
    H.run=null;checkAch(false);return;
  }
  R.r++;R.hhp=Math.min(st.hp,R.hhp+st.hp*(wLv('adventurer')>=3?.4:.25));R.m=monFor(D.pw,R.r,R.r===5);
}
function advLose(){
  const H=S.hero,R=H.run;
  toast(R.k==='t'?tt('Dein Held hat Stockwerk '+R.f+' nicht geschafft. Werde stärker und versuch es nochmal.','Your hero did not clear floor '+R.f+'. Get stronger and try again.'):tt('Dein Held musste in Raum '+(R.r+1)+' fliehen. Die Beute bis dahin bleibt.','Your hero had to flee in room '+(R.r+1)+'. The loot so far stays.'));
  H.run=null;H.auto=0;
}
function heroTick(dt){
  regenSta();
  const H=S.hero,R=H.run;
  if(!R){if(H.auto&&H.autoT>0){H.autoT-=dt;if(H.autoT<=0){H.autoT=0;if(simTower(H.tower.best+1)>0) advStart('t');else{H.auto=0;toast(tt('Automatisch weiter gestoppt: Das nächste Stockwerk ist zu stark.','Auto continue stopped: the next floor is too strong.'));}}}return;}
  const st=heroStats();
  R.m.hp-=st.dps*dt;
  if(R.m.hp<=0){roomWin();return;}
  R.hhp=Math.min(st.hp,R.hhp+st.regen*dt)-R.m.atk*(1-st.dr)*dt;
  if(R.hhp<=0) advLose();
}
function bestEquip(){
  const H=S.hero;let ch=0;
  ['w','a','t'].forEach(s=>{
    let best=H.gear[s],bi=-1;
    H.bag.forEach((it,i)=>{if(it.s===s&&(!best||itemScore(it)>itemScore(best))){best=it;bi=i;}});
    if(bi>=0){const old=H.gear[s];H.gear[s]=H.bag[bi];H.bag.splice(bi,1);if(old) H.bag.push(old);ch++;}
  });
  if(ch) recalc();
  return ch;
}
function sellWeak(){
  const H=S.hero;let n=0,g=0;
  H.bag=H.bag.filter(it=>{const eq=H.gear[it.s];if(eq&&itemScore(it)<=itemScore(eq)){g+=sellVal(it);n++;return false;}return true;});
  if(g) addCk(g);
  return [n,g];
}
const itemRow=(it,act)=>'<div class="item'+(it.r===4?' myth':'')+'" style="--rc:'+RARC[it.r]+'"><b>'+itemName(it)+'</b><span class="sub">'+tx(RARN[it.r])+' · '+tx(SLOTS.find(x=>x[0]===it.s)[1])+'</span><span class="sub">'+itemStatTxt(it)+'</span>'+(act||'')+'</div>';
function forgeCost(s,L){
  if(s==='w') return {tooth:4+L,herb:2+Math.floor(L/3)};
  if(s==='a') return {herb:4+L,tooth:2+Math.floor(L/3)};
  return {gem:2+Math.ceil(L/2)};
}
function refineCost(it){const u=(it.up||0)+1;return {gem:u,tooth:2*u,herb:2*u};}
function forgeItem(s){
  const H=S.hero,c=forgeCost(s,H.lvl);if(!canMat(c)) return null;
  payMat(c);
  let r=Math.random()*100,rar=0;const W=[40,35,18,6,1];for(let i=0;i<5;i++){r-=W[i];if(r<0){rar=i;break;}}
  const it={id:H.nid++,s,r:rar,p:Math.round(Math.pow(3,(H.lvl-1)/10)*(.9+Math.random()*.2)*100)/100,up:0};
  return it;
}
function advR(){
  const H=S.hero,st=heroStats(),R=H.run,live={},wid={};
  regenSta();
  let h='<section class="wsec first"><div class="hero"><span class="hico">'+heroSVG()+'</span><span class="info"><span class="nm"><span>'+tt('Dein Held','Your hero')+'</span><span class="lvb">'+tt('Stufe ','Level ')+H.lvl+'</span></span><span class="sub">'+tt('Angriff ','Attack ')+fmt(st.atk)+' · '+tt('Leben ','Health ')+fmt(st.hp)+(petPower()?' · '+tt('Begleiter +','Companions +')+(petPower()*8)+' %':'')+' · '+tt('Bonus: ','Bonus: ')+'+'+((H.lvl-1)+H.tower.best*.5).toLocaleString(LOC[LANG])+' % '+tt('Produktion','production')+'</span><span class="sub">XP '+wLive('xp')+'</span>'+wBar('xp')+'</span></div>';
  live.xp=fmt(Math.floor(H.xp))+' / '+fmt(xpNeed(H.lvl));wid.xp=H.xp/xpNeed(H.lvl)*100;
  h+='<div class="gslots">'+SLOTS.map(([k,nm,a])=>{const it=H.gear[k];return '<div class="gslot'+(it&&it.r===4?' myth':'')+'"'+(it?' style="--rc:'+RARC[it.r]+'"':'')+'><span class="ico">'+art(a)+'</span><span><span class="sub">'+tx(nm)+'</span>'+(it?'<b>'+itemName(it)+'</b><span class="sub">'+itemStatTxt(it)+'</span>':'<span class="sub">'+tt('leer','empty')+'</span>')+'</span></div>';}).join('')+'</div></section>';
  if(R){
    const title=R.k==='t'?tt('Endlos-Turm · Stockwerk ','Endless Tower · Floor ')+R.f:tx(DUNG[R.d].n)+' · '+tt('Raum ','Room ')+(R.r+1)+' / 6'+(R.r===5?' · BOSS':'');
    h+='<section class="wsec"><h3 class="wt">'+tt('Kampf','Fight')+': '+title+'</h3><div class="fight"><div class="side">'+heroSVG()+'<b>'+tt('Held','Hero')+'</b><span class="obar hp"><i data-w="hh"></i></span><span class="sub">'+wLive('hh')+'</span></div><span class="vs">VS</span><div class="side">'+monsterSVG(R.m.kind,R.m.boss)+'<b>'+tx(MON_KINDS[R.m.kind].n)+(R.m.boss?' · BOSS':'')+'</b><span class="obar mhp"><i data-w="mh"></i></span><span class="sub">'+wLive('mh')+'</span></div></div><div class="btns" style="margin-top:8px">'+wBtn(tt('Fliehen','Flee'),'adv:flee',{plain:1})+'</div></section>';
    live.hh=fmt(Math.max(0,Math.ceil(R.hhp)))+' / '+fmt(st.hp);wid.hh=R.hhp/st.hp*100;
    live.mh=fmt(Math.max(0,Math.ceil(R.m.hp)))+' / '+fmt(R.m.max);wid.mh=R.m.hp/R.m.max*100;
  }
  h+='<section class="wsec"><h3 class="wt">'+tt('Dungeons','Dungeons')+'</h3><p class="small wnote">'+tt('Ein Dungeon hat 5 Räume und einen Boss. Jeder Besuch kostet 1 Ausdauer. Zwischen den Räumen heilt dein Held ein bisschen. Ausdauer: ','A dungeon has 5 rooms and a boss. Each visit costs 1 stamina. Your hero heals a little between rooms. Stamina: ')+'<b>'+H.sta+' / '+staMax()+'</b>'+(H.sta<staMax()?' · '+tt('+1 in ','+1 in ')+wLive('sta'):'')+'</p><div class="list">';
  if(H.sta<staMax()) live.sta=mmss(Math.max(0,(H.staT+600000-Date.now())/1000));
  DUNG.forEach((D,i)=>{
    const sim=simDungeon(i),pred=sim>=6?'<span class="wk-on">'+tt('Schaffbar','Doable')+'</span>':tt('Zu schwer (bis Raum ','Too hard (up to room ')+(sim+1)+')';
    const can=!R&&H.sta>=1;
    h+=wCard(destSVG(D.col),tx(D.n),[tt('Empfohlen ab Stufe ','Recommended from level ')+D.lvl+' · '+pred,tt('Geschafft: ','Cleared: ')+(H.clr[D.id]||0)+'×'],'<button type="button" class="btn sm'+(can?' primary':' dis')+'" data-a="adv:d:'+i+'">'+tt('Betreten','Enter')+'</button>');
  });
  h+='</div></section>';
  const f=H.tower.best+1,tm=towerMon(f),ts=simTower(f);
  h+='<section class="wsec"><h3 class="wt">'+tt('Endlos-Turm','Endless Tower')+'</h3><p class="small wnote">'+tt('Jedes Stockwerk ist stärker. Jedes 10. hat einen Boss mit Beute. Jedes geschaffte Stockwerk gibt dauerhaft +0,5 % Produktion. Rekord: ','Every floor is stronger. Every 10th has a boss with loot. Every cleared floor gives +0.5% production forever. Record: ')+'<b>'+H.tower.best+'</b></p>';
  h+=wCard(monsterSVG(tm.kind,tm.boss),tt('Stockwerk ','Floor ')+f+(tm.boss?' · BOSS':''),[tt('Leben ','Health ')+fmt(tm.hp)+' · '+tt('Angriff ','Attack ')+fmt(Math.ceil(tm.atk)),ts>0?'<span class="wk-on">'+tt('Gewinnbar','Winnable')+'</span>':tt('Zu stark für deinen Helden','Too strong for your hero')],'<span class="wkact"><button type="button" class="btn sm'+(R?' dis':' primary')+'" data-a="adv:t">'+tt('Kämpfen','Fight')+'</button><button type="button" class="btn sm tgl" data-a="adv:auto" aria-pressed="'+(H.auto?'true':'false')+'">'+tt('Automatisch weiter','Auto continue')+'</button></span>');
  h+='</section>';
  {const fr=skFree();
  h+='<section class="wsec"><h3 class="wt">'+tt('Fähigkeiten','Skills')+'</h3><p class="small wnote">'+tt('Jede Heldenstufe gibt 1 Fähigkeitspunkt. Jede Fähigkeit geht bis Stufe 5. Mitgenommene Begleiter aus der Welt kämpfen mit: +8 % Angriff pro Begleiter-Stufe. Freie Punkte: ','Every hero level gives 1 skill point. Each skill goes up to rank 5. Companions you bring along in the world fight too: +8% attack per companion level. Free points: ')+'<b>'+fr+'</b></p><div class="list">';
  SKILLS.forEach(k=>{const r=sk(k.id);h+=wCard(art(k.art),tx(k.n)+' · '+r+' / 5',[tx(k.d),'<span class="pips" style="--rc:var(--accent)">'+[1,2,3,4,5].map(n=>'<i'+(n<=r?' class="on"':'')+'></i>').join('')+'</span>'],'<button type="button" class="btn sm'+(fr>0&&r<5?' primary':' dis')+'" data-a="adv:sk:'+k.id+'">+1</button>');});
  h+='</div><div class="btns" style="margin-top:8px">'+wBtn(tt('Fähigkeiten zurücksetzen','Reset skills'),'adv:skreset',{plain:1})+'</div></section>';}
  {const m=S.w.mat,L=H.lvl;
  h+='<section class="wsec"><h3 class="wt">'+tt('Schmiede','Forge')+'</h3><p class="small wnote">'+tt('Baue Ausrüstung aus Materialien der Welt. Die Stärke richtet sich nach der Stufe deines Helden. Veredeln macht ein angelegtes Teil um 10 % stärker (bis +10).','Build gear from world materials. Its power depends on your hero level. Refining makes an equipped item 10% stronger (up to +10).')+'</p><div class="mats">'+MATS.map(x=>'<span class="mat">'+matSVG(x.id)+tx(x.n)+': <b>'+m[x.id]+'</b></span>').join('')+'</div><div class="list">';
  SLOTS.forEach(([s,nm,a])=>{
    const fc=forgeCost(s,L),it=H.gear[s],rc=it&&(it.up||0)<10?refineCost(it):null;
    h+=wCard(art(a),tx(nm),[tt('Neu schmieden: ','Forge new: ')+matCost(fc),it?tt('Angelegt: ','Equipped: ')+itemName(it)+(rc?' · '+tt('Veredeln: ','Refine: ')+matCost(rc):' · '+tt('voll veredelt','fully refined')):tt('Nichts angelegt','Nothing equipped')],'<span class="wkact"><button type="button" class="btn sm'+(canMat(fc)?' primary':' dis')+'" data-a="adv:forge:'+s+'">'+tt('Schmieden','Forge')+'</button>'+(rc?'<button type="button" class="btn sm'+(canMat(rc)?'':' dis')+'" data-a="adv:refine:'+s+'">'+tt('Veredeln','Refine')+'</button>':'')+'</span>');
  });
  h+='</div></section>';}
  h+='<section class="wsec"><h3 class="wt">'+tt('Tasche','Bag')+' · '+H.bag.length+' / 20</h3><div class="btns">'+wBtn(tt('Bestes anlegen','Equip best'),'adv:best',{plain:1})+wBtn(tt('Schwächeres verkaufen','Sell weaker'),'adv:weak',{plain:1})+'</div>';
  h+=H.bag.length?'<div class="items">'+H.bag.map(it=>{const eq=H.gear[it.s],better=!eq||itemScore(it)>itemScore(eq);return itemRow(it,'<div class="btns">'+'<button type="button" class="btn sm'+(better?' primary':'')+'" data-a="adv:eq:'+it.id+'">'+tt('Anlegen','Equip')+'</button><button type="button" class="btn sm" data-a="adv:sell:'+it.id+'">'+tt('Verkaufen · ','Sell · ')+fmt(sellVal(it))+'</button></div>');}).join('')+'</div>':'<p class="small" style="margin-top:8px">'+tt('Noch leer. Beute findest du in Dungeons und im Turm.','Still empty. You find loot in dungeons and in the tower.')+'</p>';
  h+='</section>';
  return {html:h,live,wid};
}
function updAdv(){
  const H=S.hero;
  document.getElementById('advDot').hidden=!advReady();
  if(panes.world.hidden||wSubV!=='adv') return;
  mount(document.getElementById('advBox'),advR(),{});
}
document.getElementById('advBox').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b) return;
  const p=b.dataset.a.split(':'),H=S.hero;let ok=true;
  if(p[1]==='d') ok=advStart('d',+p[2]);
  else if(p[1]==='t') ok=advStart('t');
  else if(p[1]==='flee'){if(H.run){H.run=null;H.auto=0;S.sec.flee=(S.sec.flee||0)+1;toast(tt('Dein Held ist geflohen.','Your hero fled.'));}}
  else if(p[1]==='auto'){H.auto=H.auto?0:1;H.autoT=H.auto&&!H.run?.3:0;}
  else if(p[1]==='best'){if(!bestEquip()){toast(tt('Du trägst schon das Beste.','You already wear the best.'));}}
  else if(p[1]==='sk'){const k=p[2];if(skFree()<1||sk(k)>=5) ok=false;else{H.sk[k]=sk(k)+1;}}
  else if(p[1]==='skreset'){if(!SKILLS.some(k=>sk(k.id))) ok=false;else{H.sk={};toast(tt('Fähigkeiten zurückgesetzt.','Skills reset.'));}}
  else if(p[1]==='forge'){const it=forgeItem(p[2]);if(!it) ok=false;else{const m=gainItem(it);toast(tt('Geschmiedet: ','Forged: ')+itemName(it)+' ('+tx(RARN[it.r])+')'+(m?' · '+m:''),it.r>=3);}}
  else if(p[1]==='refine'){const it=H.gear[p[2]];if(!it||(it.up||0)>=10) ok=false;else{const c=refineCost(it);if(!canMat(c)) ok=false;else{payMat(c);it.up=(it.up||0)+1;recalc();toast(tt('Veredelt: ','Refined: ')+itemName(it),true);}}}
  else if(p[1]==='weak'){const [n,g]=sellWeak();if(n) toast(n+tt(' Teile verkauft: +',' items sold: +')+fmt(g));else ok=false;}
  else if(p[1]==='eq'||p[1]==='sell'){
    const i=H.bag.findIndex(x=>x.id===+p[2]);if(i<0) return;
    const it=H.bag[i];
    if(p[1]==='eq'){const old=H.gear[it.s];H.gear[it.s]=it;H.bag.splice(i,1);if(old) H.bag.push(old);recalc();}
    else{const v=sellVal(it);H.bag.splice(i,1);addCk(v);toast(tt('Verkauft: +','Sold: +')+fmt(v));}
  }
  if(!ok) nope(b);else snd('buy');
  render();
});
