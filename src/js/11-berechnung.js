/* ======================= Berechnung ======================= */
const freshUE=()=>({comboCap:0,comboDecay:1,grow:1,herb:0,monRew:1,monHp:1,exp:1,expGem:0,mana:0,manaR:0,stockSh:0,heroAtk:1,heroHp:1,sta:0,frSell:1,frCap:1,frMar:0,wkXP:1,wkMaster:0,wxMul:1,msAdd:0});
let UE=freshUE();
const envV=v=>v===undefined?1:v>=1?1+(v-1)*UE.wxMul:Math.max(.3,1-(1-v)*UE.wxMul);
const staMax=()=>5+UE.sta;
const baseCost=i=>(S.admin.b[i]&&S.admin.b[i].cost)||B[i].base;
const baseCps=i=>(S.admin.b[i]&&S.admin.b[i].cps)||B[i].cps;
const CLICKBUFF_MAX=300,BUFFM_MAX=100,CLICKPCT_MAX=10,RUSH_MAX=5,RUSH_PER=25;
let C={kps:0,kps0:0,boxM:1,cdM:1,durM:1,click:1,per:B.map(()=>0),chipRate:.01,goldRate:1,goldLife:13,goldPower:1,luck:1,buffTime:1,startCookies:0,costMult:1,offEff:.5,offCap:8};
function recalc(){
  const AD=S.admin;
  let gm=AD.prod,clickPct=0,fingerUps=0,clickU=1;
  const bm=B.map(()=>1),syn=[];
  let goldRate=AD.gold,goldLife=13,luck=1,buffTime=1,goldPower=AD.goldPow,chipRate=.01,clickT=1,startCookies=0,costMult=AD.cost,offEff=.35,offCap=8,boxM=1,cdRed=0,durM=1,achMul=1;
  UE=freshUE();
  const EGM=endgameMods();
  for(const u of UP){
    if(!S.up[u.id]) continue;
    switch(u.kind){
      case 'gen':{const e=u.e;
        if(e.prod) gm*=e.prod;if(e.click) clickT*=e.click;if(e.goldPower) goldPower*=e.goldPower;if(e.costMult) costMult*=e.costMult;
        ['comboCap','herb','expGem','mana','manaR','stockSh','sta','frMar','wkMaster','wxMul','msAdd'].forEach(k=>{if(e[k]) UE[k]+=e[k];});
        ['comboDecay','grow','monRew','monHp','exp','heroAtk','heroHp','frSell','frCap','wkXP'].forEach(k=>{if(e[k]) UE[k]*=e[k];});
        break;}
      case 'tier': bm[u.b]*=2;if(u.b===0) fingerUps++;break;
      case 'global': gm*=1.1;break;
      case 'recipe': gm*=1.05;break;
      case 'click': clickPct+=u.pct;break;
      case 'clickx': clickU*=2;break;
      case 'syn': syn.push(u);break;
      case 'goldu':
        if(u.rate) goldRate*=u.rate;if(u.life) goldLife+=u.life;if(u.luck) luck*=u.luck;if(u.time) buffTime*=u.time;
        break;
    }
  }
  syn.forEach(u=>{bm[u.t]*=1+0.005*S.b[u.s];});
  {const mm=msMul();B.forEach((b,i)=>{const k=msCount(i);if(k) bm[i]*=Math.pow(mm,k);});}
  const RT=S.reb.tree;
  {const bl=wLv('boostm');if(bl>=2) cdRed+=bl>=3?.2:.1;}
  if(wLv('builder')>=3) costMult*=.98;
  {let ms=0,ch=0;WORKERS.forEach(x=>{if(!S.work.hired[x.id]) return;const f=S.work.face&&S.work.face[x.id];if((S.work.lvl[x.id]||1)>=10) ms+=((f&&f.tr==='ambit')?.1:.05)+UE.wkMaster;if(f&&f.tr==='cheer'&&S.work.on[x.id]) ch+=.01;});gm*=1+ms+ch;}
  for(const n of TREE){
    if(!S.tree[n.id]) continue;
    if(n.prod) gm*=n.prod;
    if(n.chip) chipRate=Math.max(chipRate,n.chip);
    if(n.click) clickT*=n.click;
    if(n.clickPct) clickPct+=n.clickPct;
    if(n.goldRate) goldRate*=n.goldRate;
    if(n.goldLife) goldLife+=n.goldLife;
    if(n.goldPower) goldPower*=n.goldPower;
    if(n.start) startCookies+=n.start;
    if(n.costMult) costMult*=n.costMult;
    if(n.offline) offEff=Math.max(offEff,n.offline);
    if(n.offCap) offCap=Math.max(offCap,n.offCap);
    if(n.bmul) bm[n.bi]*=n.bmul;
    if(n.luck) luck*=n.luck;
    if(n.buffTime) buffTime*=n.buffTime;
    if(n.cdRed) cdRed+=n.cdRed;
    if(n.durM) durM*=n.durM;
    if(n.boxM) boxM*=n.boxM;
    if(n.achMul) achMul*=n.achMul;
  }
  for(const it of ITEMS){
    const L=Math.min(5,S.items[it.id]||0);if(!L) continue;
    const a=it.v*L;
    switch(it.k){
      case 'm_all': gm*=1+a;clickT*=1+a;break;
      case 'm_gold': goldPower*=1+a;goldRate*=Math.max(.5,1-a/2);break;
      case 'prod': gm*=1+a;break;
      case 'click': clickT*=1+a;break;
      case 'clickPct': clickPct+=a;break;
      case 'goldRate': goldRate*=Math.max(.4,1-a);break;
      case 'cost': costMult*=1-a;break;
      case 'luck': luck*=1+a;break;
      case 'goldLife': goldLife+=a;break;
      case 'time': buffTime*=1+a;break;
      case 'offline': offEff=Math.min(1.5,offEff+a);break;
      case 'chip': chipRate+=a;break;
      case 'boxcost': boxM*=1-a;break;
      case 'boostcd': cdRed+=a;break;
      case 'boostdur': durM*=1+a;break;
      case 'goldPow': goldPower*=1+a;break;
      case 'start': startCookies+=a;break;
      case 'ach': achMul*=1+a;break;
    }
  }
  if(RT.r_click) clickT*=3;
  if(RT.r_start) startCookies+=1e7;
  if(RT.r_chip) chipRate*=1.25;
  if(RT.r_gold){goldRate*=.9;goldPower*=1.1;}
  if(RT.r_cost) costMult*=.95;
  if(RT.r_off) offEff=Math.min(1.5,offEff+.25);
  if(RT.r_gold2) goldPower*=1.25;if(RT.r_hero){UE.heroAtk*=1.25;UE.heroHp*=1.25;}if(RT.r_work) UE.wkXP*=1.5;if(RT.r_click2) clickT*=3;if(RT.r_build) costMult*=.9;if(RT.r_off2) offCap+=8;if(RT.r_chip2) chipRate*=1.5;if(RT.r_prod) gm*=3;
  const achN=Object.keys(S.ach).length;
  gm*=1+0.005*achN*achMul;
  gm*=1+chipRate*S.chips*EGM.chip;
  gm*=1+(RT.r_asc?.04:.02)*S.asc;
  gm*=1+.15*S.reb.pages*(egHas('c_pages')?2:1);
  gm*=1+.02*Object.keys(S.book.cl).filter(k=>k!=='all').length;
  gm*=Math.pow(1.05,S.inf.p);clickT*=Math.pow(1.15,S.inf.c);goldPower*=1+.03*S.inf.g;
  if(S.runT<300){gm*=2;clickT*=2;}
  {const ph=curPhase(),wx=curWeather();gm*=envV(ph.prod)*envV(wx.prod);clickT*=envV(ph.click)*envV(wx.click);goldRate*=envV(ph.gold)*envV(wx.gold);durM*=envV(wx.dur);}
  gm*=1+.01*(S.hero.lvl-1)+.005*S.hero.tower.best;
  gm*=1+Math.min(.15,.0006*S.orders.rep);
  gm*=GEV.prod;clickT*=GEV.click;goldRate/=GEV.gold;
  gm*=1+.01*Math.max(0,Math.min(9,(S.clv|0)-1));
  gm*=rvMult();   /* V70: Kundenbewertungen, bis +5 % */
  WFX=calcWFX();gm*=WFX.prod;clickT*=WFX.click;goldRate*=WFX.gold;costMult*=WFX.cost;
  let frenzy=1,clickBuff=1,sugarM=1,spellM=1;
  for(const f of S.buffs){if(f.id==='frenzy') frenzy=7;if(f.id==='clickfrenzy') clickBuff=150;if(f.id==='b_sugar') sugarM=2;if(f.id==='b_turbo') clickBuff*=3;if(f.id==='b_sale') costMult*=.85;if(f.id==='b_magnet') goldRate*=.5;if(f.id==='s_click') clickBuff*=10;if(f.id==='s_sale') costMult*=.8;if(f.id==='s_time') spellM=5;}
  /* V63: Klick-Boosts zusammen höchstens ×300 */
  clickBuff=Math.min(CLICKBUFF_MAX,clickBuff);
  goldRate=Math.max(.35,goldRate);costMult=Math.max(.5,costMult)*WFX.costPost;
  gm*=EGM.prod;clickT*=EGM.click;goldPower*=EGM.gold;costMult*=EGM.cost;startCookies+=EGM.start;offEff+=EGM.off;goldRate*=EGM.goldf;buffTime*=EGM.buff;UE.heroAtk*=EGM.hero;UE.heroHp*=EGM.hero;UE.wkXP*=EGM.work;UE.frSell*=EGM.fr;UE.comboCap+=EGM.combo;if(EGM.bm) EGM.bm.forEach((m,i)=>{bm[i]*=m;});
  gm*=1+.01*badgeTiers();
  let bldM=1;for(const f of S.buffs) if(f.id==='g_build') bldM*=f.v||1.5;
  const buffM=Math.min(BUFFM_MAX,frenzy*sugarM*spellM*bldM);   /* V63: Produktions-Boosts zusammen höchstens ×100 */
  offEff=Math.min(1,offEff);   /* V63: offline nie mehr als online */
  const per=B.map((b,i)=>baseCps(i)*bm[i]*gm*buffM);
  let kps=0;
  B.forEach((b,i)=>{kps+=per[i]*S.b[i];});
  C={kps,kps0:kps/buffM,per,achN,chipRate,goldRate,goldLife,goldPower,luck,buffTime,startCookies,costMult,offEff,offCap,boxM,cdM:Math.max(.4,1-cdRed),durM,
     /* V63: Klick-Multiplikatoren zählen voll für den Grund-Klick, für den Anteil an der Produktion höchstens ×10 (Events zählen extra) */
     click:(Math.pow(2,fingerUps)*clickU*clickT+clickPct*(kps/buffM)*Math.min(CLICKPCT_MAX,clickT/GEV.click)*GEV.click)*clickBuff*AD.click*(WFX.click0?0:1)};
}
function buyCost(i,n){const g=S.admin.growth;return Math.ceil(baseCost(i)*C.costMult*Math.pow(g,S.b[i])*(Math.pow(g,n)-1)/(g-1));}
function maxN(i){
  const g=S.admin.growth,c0=baseCost(i)*C.costMult*Math.pow(g,S.b[i]);
  let n=Math.floor(Math.log(1+S.cookies*(g-1)/c0)/Math.log(g));
  if(!isFinite(n)||n<0) n=0;
  while(n>0&&buyCost(i,n)>S.cookies) n--;
  return n;
}
let mode=1;
function amountN(i){return mode==='max'?Math.max(1,maxN(i)):mode;}
function chipsPotential(){return Math.max(0,Math.floor(Math.cbrt(Math.max(0,S.all-S.reb.base)/8e9))-S.chips);}
function chipsFree(){return S.chips-TREE.reduce((sum,n)=>sum+(S.tree[n.id]?n.cost:0),0);}
