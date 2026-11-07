/* ======================= V34: Sammelkarten & Keks-Qualität ======================= */
var CRAR=[{n:['Gewöhnlich','Common'],c:'#9fb0bb',dust:5,make:40},{n:['Selten','Rare'],c:'#5aa0d8',dust:15,make:100},{n:['Episch','Epic'],c:'#b48cf2',dust:40,make:250},{n:['Legendär','Legendary'],c:'#f1b24a',dust:100,make:600}];
var CSETS=[
  {id:'bake',n:['Backstube','Bakery'],b:['Produktion ×1,15 (Gold-Set ×1,3)','Production ×1.15 (gold set ×1.3)'],cards:[['sack','Mehlsack','Flour Sack',0],['whisk','Schneebesen','Whisk',0],['rolling','Nudelholz','Rolling Pin',1],['b2','Steinofen','Stone Oven',1],['chef','Konditor','Pastry Chef',2],['spoon','Goldlöffel','Golden Spoon',3]]},
  {id:'sorts',n:['Keks-Sorten','Cookie Kinds'],b:['Klicks ×1,5 (Gold-Set ×2)','Clicks ×1.5 (gold set ×2)'],cards:[['r0','Haferkeks','Oat Cookie',0],['r2','Vanillekipferl','Vanilla Crescent',0],['r1','Zimtstern','Cinnamon Star',1],['r3','Linzer Auge','Linzer Eye',1],['r4','Lebkuchenherz','Gingerbread Heart',2],['cookie','Regenbogenkeks','Rainbow Cookie',3]]},
  {id:'world',n:['Welt der Abenteuer','World of Adventure'],b:['Goldkekse ×1,15 (Gold-Set ×1,3)','Golden cookies ×1.15 (gold set ×1.3)'],cards:[['box','Schatztruhe','Treasure Chest',0],['moon','Mondstein','Moonstone',0],['book','Zauberbuch','Spell Book',1],['amulet','Amulett','Amulet',1],['flame','Feuerdrache','Fire Dragon',2],['crown','Königskrone','Royal Crown',3]]},
  {id:'cosmos',n:['Kosmos','Cosmos'],b:['Produktion ×1,5 (Gold-Set ×2)','Production ×1.5 (gold set ×2)'],cards:[['b9','Keks-Rakete','Cookie Rocket',0],['b14','Lichtprisma','Light Prism',0],['b11','Dimensionstor','Dimension Gate',1],['b15','Keks-Planet','Cookie Planet',1],['b17','Schwarzes Loch','Black Hole',2],['b19','Urknall-Ofen','Big Bang Oven',3]]}
];
var CARDS=[];CSETS.forEach(s=>s.cards.forEach((c,i)=>CARDS.push({id:s.id+i,set:s.id,ic:c[0],n:[c[1],c[2]],r:c[3]})));
var QING=[{id:'flour',ic:'sack',n:['Mehl','Flour'],d:['Gebäude backen besser.','Buildings bake better.']},{id:'butter',ic:'butter',n:['Butter','Butter'],d:['Klicks +4 % je Stufe.','Clicks +4% per level.']},{id:'sugar',ic:'sugar',n:['Zucker','Sugar'],d:['Goldkekse +3 % je Stufe.','Golden cookies +3% per level.']},{id:'choc',ic:'choc',n:['Schokolade','Chocolate'],d:['Aufträge und Filialen +4 % je Stufe.','Orders and stores +4% per level.']}];
var QGR=[[0,'Einfach','Plain'],[8,'Gut','Good'],[16,'Fein','Fine'],[24,'Premium','Premium'],[32,'Gourmet','Gourmet'],[40,'Meisterwerk','Masterpiece']];
const QMAX=10;
const qPts=()=>{const q=S.qual;return q?QING.reduce((a,x)=>a+(q[x.id]||0),0):0;};
const qGrade=()=>{const p=qPts();let g=0;QGR.forEach((x,i)=>{if(p>=x[0]) g=i;});return g;};
const qCost=lv=>Math.max(5e4*Math.pow(4,lv),C.kps0*30*Math.pow(2.2,lv));
function qualMods(r){
  if(!S.qual) return;
  const q=S.qual,p=qPts();
  r.prod*=1+.04*p;if(p>=40) r.prod*=1.5;
  r.click*=1+.04*(q.butter||0);
  r.gold*=(1+.03*(q.sugar||0))*(p>=24?1.2:1);
  r.fr*=(1+.04*(q.choc||0))*(p>=16?1.2:1);
}
const qualOrd=()=>S.qual?(1+.04*(S.qual.choc||0))*(qPts()>=8?1.1:1):1;
function qualBuy(id){
  const q=S.qual,lv=q[id]||0;if(lv>=QMAX) return false;
  const c=qCost(lv);if(!(S.cookies>=c)) return false;
  S.cookies-=c;q[id]=lv+1;recalc();snd('buy');qSig='';
  const g=qGrade();if(g!==qLastG){if(g>qLastG){toast(tt('Keks-Qualität: ','Cookie quality: ')+tx([QGR[g][1],QGR[g][2]])+'!',true);confetti(30);}qLastG=g;}
  return true;
}
let qLastG=-1,qSig='',qT=0;
function qStars(g){let s='';for(let i=1;i<=5;i++) s+='<i class="'+(i<=g?'on':'')+'">★</i>';return s;}
function updQual(){
  const unl=S.all>=1e5,f=document.getElementById('qualF'),chip=document.getElementById('qChip');
  if(f.hidden===unl) f.hidden=!unl;if(chip.hidden===unl) chip.hidden=!unl;if(!unl) return;
  if(qLastG<0) qLastG=qGrade();
  const g=qGrade(),p=qPts();
  const ct=tt('Qualität: ','Quality: ')+tx([QGR[g][1],QGR[g][2]]);
  if(chip._t!==ct+g){chip._t=ct+g;chip.innerHTML='<span>'+ct+'</span><span class="qst">'+qStars(g)+'</span>';}
  setTxt(document.getElementById('qualH'),tt('Zutaten & Keks-Qualität','Ingredients & cookie quality')+' · '+tx([QGR[g][1],QGR[g][2]]));
  if(!f.open||panes.build.hidden) return;
  const now=Date.now();if(now-qT<300) return;qT=now;
  let h='<p class="small wnote">'+tt('Bessere Zutaten machen bessere Kekse. Jede Stufe gibt +4 % Produktion und einen Extra-Bonus. Die Zutaten starten nach jedem Aufstieg neu – wie Upgrades.','Better ingredients make better cookies. Every level gives +4% production and an extra bonus. Ingredients start over after every ascension – like upgrades.')+'</p>'
    +'<div class="qhead"><div><b>'+tx([QGR[g][1],QGR[g][2]])+'</b><span class="qst">'+qStars(g)+'</span></div><span class="small">'+p+' / 40 '+tt('Qualitätspunkte','quality points')+' · +'+Math.round(p*4)+' % '+tt('Produktion','production')+'</span><span class="obar"><i style="width:'+(p/40*100)+'%"></i></span></div>'
    +'<div class="qgr">'+QGR.slice(1).map((x,i)=>'<span class="'+(g>=i+1?'on':'')+'"><b>'+tx([x[1],x[2]])+'</b> ('+x[0]+')<br><small>'+tx([['Aufträge +10 %','Orders +10%'],['Filialen +20 %','Stores +20%'],['Goldkekse +20 %','Golden cookies +20%'],['Noch besser schmecken','Taste even better'],['Produktion ×1,5','Production ×1.5']][i])+'</small></span>').join('')+'</div><div class="list" style="margin-top:10px">';
  QING.forEach(x=>{const lv=S.qual[x.id]||0,mx=lv>=QMAX,c=mx?0:qCost(lv),ok=!mx&&S.cookies>=c;
    h+='<div class="wcard"><span class="ico">'+art(x.ic)+'</span><span class="info"><span class="nm"><span>'+tx(x.n)+'</span><span class="wlvl'+(mx?' max':'')+'">'+lv+' / '+QMAX+'</span></span><span class="sub">'+tx(x.d)+'</span><span class="obar"><i style="width:'+(lv/QMAX*100)+'%"></i></span></span><span class="oact">'+(mx?'<b class="wk-on">'+tt('Beste Qualität','Top quality')+'</b>':'<button type="button" class="btn sm'+(ok?' primary':' dis')+'" data-q="'+x.id+'">'+tt('Verbessern: ','Improve: ')+fmt(c)+'</button>')+'</span></div>';});
  h+='</div>';
  const box=document.getElementById('qualBox');if(box._h!==h){box._h=h;box.innerHTML=h;}
}
document.getElementById('qualBox').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b) return;if(qualBuy(b.dataset.q)){qT=0;render();}else nope(b);});

/* --- Sammelkarten --- */
const cardOwn=id=>(S.cards.own[id]||0);
function setState(s){let full=true,gold=true;s.cards.forEach((c,i)=>{const L=cardOwn(s.id+i);if(!L) full=false;if(L<5) gold=false;});return gold?2:full?1:0;}
function cardMods(r){
  if(!S.cards) return;
  let lv=0;for(const c of CARDS) lv+=cardOwn(c.id);
  r.prod*=1+.005*lv;
  CSETS.forEach(s=>{const st=setState(s);if(!st) return;
    if(s.id==='bake') r.prod*=st===2?1.3:1.15;else if(s.id==='sorts') r.click*=st===2?2:1.5;else if(s.id==='world') r.gold*=st===2?1.3:1.15;else r.prod*=st===2?2:1.5;});
}
const packCost=()=>Math.max(1e5,C.kps0*1800);
function rollCard(gem){const W=gem?[40,38,16,6]:[60,28,9,3];let x=Math.random()*100,r=0;for(;r<3;r++){x-=W[r];if(x<0) break;}const pool=CARDS.filter(c=>c.r===r);return pool[Math.floor(Math.random()*pool.length)];}
function giveCard(c){const C2=S.cards,L=C2.own[c.id]||0;if(L>=5){C2.dust+=CRAR[c.r].dust;return {c,dust:CRAR[c.r].dust};}C2.own[c.id]=L+1;return {c,fresh:!L,lv:L+1};}
function openPack(gem){
  const C2=S.cards;
  if(gem){if(S.w.mat.gem<25) return false;S.w.mat.gem-=25;}else{const c=packCost();if(!(S.cookies>=c)) return false;S.cookies-=c;}
  const n=gem?5:3,res=[];for(let i=0;i<n;i++) res.push(giveCard(rollCard(gem)));
  C2.opened++;recalc();cardSig='';showPack(res);checkAch(false);save();return true;
}
function craftCard(id){const c=CARDS.find(x=>x.id===id),C2=S.cards;if(!c||cardOwn(id)||C2.dust<CRAR[c.r].make) return false;C2.dust-=CRAR[c.r].make;C2.own[id]=1;recalc();cardSig='';toast(tt('Hergestellt: ','Crafted: ')+tx(c.n),true);snd('claim');return true;}
function cardHTML(c,L,extra){
  const R=CRAR[c.r],own=L>0;
  return '<div class="kcard r'+c.r+(own?'':' no')+'" style="--rc:'+R.c+'"><span class="kc-n">'+(own?tx(c.n):'???')+'</span><span class="kc-a">'+art(c.ic)+'</span><span class="kc-r">'+tx(R.n)+'</span>'+(own?'<span class="kc-l">'+'★'.repeat(L)+'<i>'+'★'.repeat(5-L)+'</i></span>':'')+(extra||'')+'</div>';
}
let cardSig='';
function updCards(){
  const sec=document.getElementById('cardSec'),unl=tabUnl('shop');if(sec.hidden===unl) sec.hidden=!unl;
  if(!unl||panes.shop.hidden) return;
  const C2=S.cards,pc=packCost(),sig=[LANG,JSON.stringify(C2),Math.floor(Math.log10(pc)*4),S.cookies>=pc,S.w.mat.gem>=25].join('|');
  if(sig===cardSig) return;cardSig=sig;
  const tot=CARDS.length,got=CARDS.filter(c=>cardOwn(c.id)).length;
  let h='<h3 class="wt">'+tt('Sammelkarten','Trading cards')+'</h3><p class="small wnote">'+tt('Öffne Kartenpäckchen und sammle alle 24 Karten. Jede Karten-Stufe gibt +0,5 % Produktion. Ein volles Set gibt einen großen Bonus – und alle Karten auf 5 Sternen machen es zum Gold-Set. Doppelte Karten steigen auf, ab 5 Sternen werden sie zu Kartenstaub.','Open card packs and collect all 24 cards. Every card level gives +0.5% production. A full set gives a big bonus – and all cards at 5 stars make it a gold set. Duplicates level up, from 5 stars they turn into card dust.')+'</p>'
    +'<div class="mats"><span class="mat">'+art('album')+tt('Karten','Cards')+': <b>'+got+' / '+tot+'</b></span><span class="mat">'+art('spark')+tt('Kartenstaub','Card dust')+': <b>'+C2.dust+'</b></span><span class="mat">'+tt('Päckchen geöffnet','Packs opened')+': <b>'+C2.opened+'</b></span></div>'
    +'<div class="btns"><button type="button" class="btn primary'+(S.cookies>=pc?'':' dis')+'" data-cp="ck">'+tt('Keks-Päckchen (3 Karten): ','Cookie pack (3 cards): ')+fmt(pc)+'</button><button type="button" class="btn'+(S.w.mat.gem>=25?' primary':' dis')+'" data-cp="gem">'+tt('Edelstein-Päckchen (5 Karten, bessere Chancen): 25 ','Gem pack (5 cards, better odds): 25 ')+matName('gem')+'</button></div>'
    +'<p class="small" style="margin-top:6px">'+tt('Chancen Keks-Päckchen: Gewöhnlich 60 %, Selten 28 %, Episch 9 %, Legendär 3 %. Edelstein-Päckchen: 40 / 38 / 16 / 6 %.','Odds cookie pack: common 60%, rare 28%, epic 9%, legendary 3%. Gem pack: 40 / 38 / 16 / 6%.')+'</p>';
  CSETS.forEach(s=>{const st=setState(s);
    h+='<div class="kset'+(st===2?' gold':st===1?' full':'')+'"><div class="kset-h"><b>'+tx(s.n)+'</b><span class="small">'+(st===2?tt('Gold-Set! ','Gold set! '):st===1?tt('Set komplett! ','Set complete! '):tt('Set-Bonus: ','Set bonus: '))+tx(s.b)+'</span></div><div class="kgrid">'
      +s.cards.map((_,i)=>{const c=CARDS.find(x=>x.id===s.id+i),L=cardOwn(c.id),mk=CRAR[c.r].make;return cardHTML(c,L,!L?'<button type="button" class="btn sm'+(C2.dust>=mk?' primary':' dis')+'" data-cc="'+c.id+'">'+mk+' '+tt('Staub','dust')+'</button>':'');}).join('')+'</div></div>';});
  sec.innerHTML=h;
}
document.getElementById('cardSec').addEventListener('click',e=>{
  const b=e.target.closest('[data-cp],[data-cc]');if(!b) return;
  const ok=b.dataset.cp?openPack(b.dataset.cp==='gem'):craftCard(b.dataset.cc);
  if(!ok) nope(b);render();
});
/* Päckchen öffnen */
const packOv=document.getElementById('packOv');let packRes=null;
function showPack(res){
  packRes=res;
  document.getElementById('packT').textContent=tt('Kartenpäckchen','Card pack');
  document.getElementById('packCards').innerHTML=res.map((x,i)=>'<div class="pflip" data-i="'+i+'"><div class="pf-in"><div class="pf-back"><span>?</span></div><div class="pf-front">'+cardHTML(x.c,x.lv||5,'<span class="pf-tag">'+(x.fresh?tt('NEU!','NEW!'):x.dust?'+'+x.dust+' '+tt('Staub','dust'):'★'+x.lv)+'</span>')+'</div></div></div>').join('');
  document.getElementById('packAll').textContent=tt('Alle aufdecken','Reveal all');
  document.getElementById('packDone').textContent=tt('Fertig','Done');
  packOv.hidden=false;snd('open');
  const fl=document.querySelectorAll('#packCards .pflip');
  fl.forEach((el,i)=>setTimeout(()=>flipCard(el),fxOk()?500+i*420:0));
}
function flipCard(el){if(!el||el.classList.contains('on')) return;el.classList.add('on');const x=packRes[+el.dataset.i];if(!x) return;
  if(x.c.r>=3){snd('star');if(fxOk()){const r=el.getBoundingClientRect();fxSparks(r.left+r.width/2,r.top+r.height/2,18,'#ffd96a');confetti(30);}}else if(x.c.r===2) snd('gold');else snd('tick');}
document.getElementById('packAll').addEventListener('click',()=>document.querySelectorAll('#packCards .pflip').forEach(flipCard));
document.getElementById('packDone').addEventListener('click',()=>{packOv.hidden=true;cardSig='';render();});
document.getElementById('packCards').addEventListener('click',e=>{const el=e.target.closest('.pflip');if(el) flipCard(el);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!packOv.hidden){e.preventDefault();packOv.hidden=true;}});

/* Hilfe, Freischalten, Währung */
HELP.push({id:'qual',ic:'butter',t:['Keks-Qualität','Cookie quality'],d:['Kaufe bessere Zutaten im Tab Bauen. Je besser die Qualität, desto mehr ist jeder Keks wert. Ab bestimmten Stufen gibt es Extra-Boni.','Buy better ingredients in the Build tab. The better the quality, the more every cookie is worth. At certain grades you get extra bonuses.'],u:()=>S.all>=1e5},
  {id:'cards',ic:'album',t:['Sammelkarten','Trading cards'],d:['Kartenpäckchen im Tab Shop öffnen und 24 Karten in 4 Sets sammeln. Volle Sets geben große Boni.','Open card packs in the Shop tab and collect 24 cards in 4 sets. Full sets give big bonuses.'],u:()=>tabUnl('shop')});
SYSGO.qual=()=>{selectTab('build');const f=document.getElementById('qualF');f.open=true;setTimeout(()=>f.scrollIntoView({block:'center',behavior:'smooth'}),80);};
SYSGO.cards=()=>{selectTab('shop');setTimeout(()=>document.getElementById('cardSec').scrollIntoView({block:'start',behavior:'smooth'}),120);};
SYSIDS.push('qual','cards');
CUR.push({id:'dust',ic:'album',h:'cards',n:['Kartenstaub','Card dust'],v:()=>String(S.cards.dust),u:()=>S.cards.opened>0,d:['Von doppelten Karten mit 5 Sternen. Damit stellst du fehlende Karten her.','From duplicate cards at 5 stars. Use it to craft missing cards.']});
function updCQ(){updQual();updCards();}

/* Start */
recalc();ensureOrders();ensureWorld();
let awayRep=null;
if(hadSave){
  const bks=readBk();
  if(!bks.length||Date.now()-bks[0].t>600000) pushBackup();else lastBk=bks[0].t;

  const gap=(Date.now()-S.t)/1000,pre=awayPre(),m0=S.w.mana,sta0=S.hero.sta;
  offlineWorld(Math.max(0,gap));
  if(gap>120){
    const cap=Math.min(gap,C.offCap*3600);
    S.buffs=S.buffs.filter(f=>(f.t-=gap)>0);
    recalc();
    let gain=C.kps*cap*C.offEff/(S.runT<300?2:1);
    if(!(gain>0)) gain=0;
    S.cookies+=gain;S.run+=gain;S.all+=gain;
    const frp=frOffline(gap),help=offlineHelpers(gap);if(frp>0) help.push([tt('Filialen','Stores'),'+'+fmt(frp)]);
    regenSta();
    awayRep={gap,gain,mana:S.w.mana-m0,pre,help,sta:Math.max(0,S.hero.sta-sta0)};
    /* V51: Willkommensgeschenk nach 3+ Tagen Pause (höchstens alle 3 Tage) */
    if(gap>=259200&&Date.now()-(S.cb||0)>=259200){
      const days=Math.floor(gap/86400),g=Math.min(50,10+5*days),mins=30;
      S.w.mat.gem+=g;addCk(Math.max(10000*mins/60,C.kps0*60*mins));S.cb=Date.now();recalc();
      awayRep.cb={g,mins};if(typeof kfTrackStep==='function') kfTrackStep('comeback');
    }
  }
}
checkDay(true);
[S.hero.gear.w,S.hero.gear.a,S.hero.gear.t].concat(S.hero.bag).forEach(it=>{if(it) S.book.gear[it.s+tierIdx(it.p)]=1;});
checkAch(true);
applyLook();
envTick();
applyLang();
setInterval(tick,100);
if(S.opt.start!==false){renderStart();startOv.hidden=false;setTimeout(()=>{const b=document.getElementById('stGo');if(b) b.focus();},60);}
else if(awayRep){awayShown=true;setTimeout(()=>showAway(awayRep),350);}
document.addEventListener('visibilitychange',()=>{if(document.hidden) save();});
window.addEventListener('pagehide',save);
})();