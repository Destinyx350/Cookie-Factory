/* ===== Titel & Abzeichen ===== */
const BADGES=[
  {id:'clk',n:['Klicker','Clicker'],ic:'hand',v:()=>S.clicks,t:[1e3,1e4,1e5],u:['Klicks','clicks']},
  {id:'gold',n:['Goldsucher','Gold digger'],ic:'gold',v:()=>S.gold,t:[10,100,500],u:['Goldkekse','golden cookies']},
  {id:'bld',n:['Baumeister','Builder'],ic:'b3',v:()=>S.b.reduce((a,x)=>a+x,0),t:[100,1000,4000],u:['Gebäude','buildings']},
  {id:'ck',n:['Keks-Magnat','Cookie mogul'],ic:'cookie',v:()=>S.all,t:[1e9,1e15,1e21],u:['Kekse gesamt','cookies total'],big:1},
  {id:'asc',n:['Himmelsstürmer','Sky climber'],ic:'star',v:()=>S.asc,t:[1,10,50],u:['Aufstiege','ascensions']},
  {id:'ach',n:['Sammler','Collector'],ic:'crown',v:()=>Object.keys(S.ach).length,t:[25,75,150],u:['Erfolge','achievements']},
  {id:'hero',n:['Heldenmut','Bravery'],ic:'flame',v:()=>S.hero.lvl,t:[5,15,30],u:['Helden-Stufe','hero level']},
  {id:'whl',n:['Glückspilz','Lucky one'],ic:'lucky',v:()=>S.wheel.n,t:[7,30,100],u:['Drehungen','spins']},
  {id:'time',n:['Treue Seele','Loyal soul'],ic:'timer',v:()=>S.stat.time/3600,t:[1,10,100],u:['Stunden gespielt','hours played']}
];
const TIERC=[['#59616b','#3a4047'],['#c98a4b','#7d5126'],['#c7d0d9','#7d8894'],['#f1b24a','#9a6a10']];
const TIERN=[['Noch nicht','Not yet'],['Bronze','Bronze'],['Silber','Silver'],['Gold','Gold']];
function badgeTiers(){let n=0;const b=(S&&S.ttl&&S.ttl.b)||{};for(const k in b) n+=b[k]||0;return n;}
const TITLES=[
  {id:'lehrling',n:['Bäckerlehrling','Baker Apprentice'],h:['Von Anfang an','From the start'],ok:()=>true},
  {id:'geselle',n:['Bäckergeselle','Journeyman Baker'],h:['1 Mio Kekse gesamt','1 million cookies total'],ok:()=>S.all>=1e6},
  {id:'meister',n:['Bäckermeister','Master Baker'],h:['1 Mrd Kekse gesamt','1 billion cookies total'],ok:()=>S.all>=1e9},
  {id:'baron',n:['Keks-Baron','Cookie Baron'],h:['1 Bio Kekse gesamt','1 trillion cookies total'],ok:()=>S.all>=1e12},
  {id:'kaiser',n:['Keks-Kaiser','Cookie Emperor'],h:['1 Trio Kekse gesamt','1 quintillion cookies total'],ok:()=>S.all>=1e18},
  {id:'gott',n:['Keks-Gottheit','Cookie Deity'],h:['1 Quadrillion Kekse gesamt','1 septillion cookies total'],ok:()=>S.all>=1e24},
  {id:'klick',n:['Klick-König','Click King'],h:['10.000 Klicks','10,000 clicks'],ok:()=>S.clicks>=1e4},
  {id:'goldj',n:['Goldjäger','Gold Hunter'],h:['100 Goldkekse','100 golden cookies'],ok:()=>S.gold>=100},
  {id:'gluck',n:['Glückspilz','Lucky Duck'],h:['10-mal Glücksrad drehen','Spin the lucky wheel 10 times'],ok:()=>S.wheel.n>=10},
  {id:'jack',n:['Jackpot-Knacker','Jackpot Cracker'],h:['Einen Jackpot gewinnen','Win a jackpot'],ok:()=>S.wheel.jp>=1},
  {id:'himmel',n:['Himmelsbäcker','Heavenly Baker'],h:['1 Aufstieg','1 ascension'],ok:()=>S.asc>=1},
  {id:'stern',n:['Sternenwanderer','Star Wanderer'],h:['10 Aufstiege','10 ascensions'],ok:()=>S.asc>=10},
  {id:'held',n:['Held der Backstube','Bakery Hero'],h:['Held auf Stufe 10','Hero at level 10'],ok:()=>S.hero.lvl>=10},
  {id:'samm',n:['Großer Sammler','Great Collector'],h:['100 Erfolge','100 achievements'],ok:()=>Object.keys(S.ach).length>=100},
  {id:'stamm',n:['Stammgast','Regular'],h:['7 Tage Login-Serie','7 day login streak'],ok:()=>S.day.best>=7},
  {id:'eule',n:['Nachteule','Night Owl'],h:['Zwischen 0 und 4 Uhr spielen','Play between midnight and 4 am'],ok:()=>new Date().getHours()<4},
  {id:'frueh',n:['Frühaufsteher','Early Bird'],h:['Zwischen 5 und 7 Uhr spielen','Play between 5 and 7 am'],ok:()=>{const x=new Date().getHours();return x>=5&&x<7;}},
  {id:'abz',n:['Abzeichen-Meister','Badge Master'],h:['Alle Abzeichen in Gold','All badges in gold'],ok:()=>BADGES.every(b=>(S.ttl.b[b.id]||0)>=3)}
];
function badgeTier(b){const v=b.v();let t=0;b.t.forEach((x,i)=>{if(v>=x) t=i+1;});return t;}
let ttlT=0;
function checkTtl(){
  const T=S.ttl,first=!T.init;let nb=0,nt=0,ch=false;
  BADGES.forEach(b=>{const t=badgeTier(b),o=T.b[b.id]||0;if(t>o){T.b[b.id]=t;ch=true;nb++;if(!first){toast(tt('Abzeichen: ','Badge: ')+tx(b.n)+' ('+tx(TIERN[t])+') · +1 % '+tt('Produktion','production'),true);snd('ach');confetti(14);}}});
  TITLES.forEach(x=>{if(!T.got[x.id]&&x.ok()){T.got[x.id]=1;nt++;if(!first){toast(tt('Neuer Titel: ','New title: ')+tx(x.n),true);snd('claim');}}});
  if(first){T.init=1;if(nb+nt>1) toast(tt('Neu: Titel & Abzeichen! Du hast schon ','New: Titles & badges! You already have ')+nt+tt(' Titel und ',' titles and ')+nb+tt(' Abzeichen. Schau im Tab Ziele.',' badges. Look in the Goals tab.'),true);}
  if(ch) recalc();
}
function medal(b,t){
  const c=TIERC[t];
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 2h8l2 16h-10zM34 2h8l-2 16h-8z" fill="'+(t?'#c9573f':'#555')+'"/><circle cx="32" cy="38" r="24" fill="'+c[0]+'" stroke="'+c[1]+'" stroke-width="3"/><circle cx="32" cy="38" r="17.5" fill="rgba(0,0,0,.16)"/><g transform="translate(16 22) scale(.5)"'+(t?'':' opacity=".45"')+'>'+(ART[b.ic]||ART.cookie)+'</g>'+(t?Array.from({length:t},(_,k)=>'<circle cx="'+(32+(k-(t-1)/2)*8)+'" cy="59" r="2.6" fill="#fff"/>').join(''):'')+'</svg>';
}
const curTitle=()=>TITLES.find(x=>x.id===S.ttl.cur&&S.ttl.got[x.id])||TITLES[0];
function updTtl(){
  const chip=document.getElementById('ttlChip'),ct=tx(curTitle().n);
  if(chip.hidden) chip.hidden=false;setTxt(chip,ct);chip.title=tt('Dein Titel','Your title');
  if(panes.ach.hidden||gSub!=='ttl') return;
  const T=S.ttl,got=TITLES.filter(x=>T.got[x.id]).length,tiers=badgeTiers();
  let html='<section class="wsec first"><h3 class="wt">'+tt('Dein Titel','Your title')+': '+ct+'</h3><p class="small wnote">'+tt('Tippe auf einen freigeschalteten Titel, um ihn oben neben dem Namen zu zeigen.','Tap an unlocked title to show it next to the name at the top.')+' ('+got+' / '+TITLES.length+')</p><div class="tgrid">'
    +TITLES.map(x=>{const g=!!T.got[x.id];return '<button type="button" class="tcard'+(g?'':' lk')+(T.cur===x.id&&g?' on':'')+'"'+(g?' data-tt="'+x.id+'"':' disabled')+'><b>'+(g?tx(x.n):'???')+'</b><small>'+tx(x.h)+'</small></button>';}).join('')+'</div></section>'
    +'<section class="wsec"><h3 class="wt">'+tt('Abzeichen','Badges')+'</h3><p class="small wnote">'+tt('Jede Stufe (Bronze, Silber, Gold) gibt +1 % Produktion. Abzeichen bleiben beim Aufstieg.','Every tier (bronze, silver, gold) gives +1% production. Badges stay when you ascend.')+' '+tt('Bonus jetzt: ','Bonus now: ')+'<b>+'+tiers+' %</b></p><div class="bdgrid">'
    +BADGES.map(b=>{const t=T.b[b.id]||0,v=b.v(),nx=b.t[Math.min(t,2)],pct=t>=3?100:Math.min(100,v/nx*100),fv=x=>b.big?fmt(x):Math.floor(x).toLocaleString(LOC[LANG]);
      return '<div class="bdg">'+medal(b,t)+'<div><b>'+tx(b.n)+'</b><small>'+tx(TIERN[t])+' · '+(t>=3?tt('Fertig!','Done!'):fv(v)+' / '+fv(nx)+' '+tx(b.u))+'</small><span class="obar"><i style="width:'+pct.toFixed(1)+'%"></i></span></div></div>';}).join('')+'</div></section>';
  mount(document.getElementById('ttlBox'),{html,live:{},wid:{}},{});
}
document.getElementById('ttlBox').addEventListener('click',e=>{const b=e.target.closest('[data-tt]');if(!b) return;S.ttl.cur=b.dataset.tt;render();save();});
document.getElementById('ttlChip').addEventListener('click',()=>{selectTab('ach');gSub='ttl';document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});render();});

document.getElementById('gSeg').addEventListener('click',e=>{
  const b=e.target.closest('[data-g]');if(!b) return;
  gSub=b.dataset.g;
  document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});
  render();
});
gEls.book.addEventListener('click',e=>{
  const b=e.target.closest('[data-bk2]');if(!b) return;
  if(!claimBook(b.dataset.bk2)){nope(b);return;}
  bump(b);snd('claim');confetti(25);render();
});
gEls.pass.addEventListener('click',e=>{
  const b=e.target.closest('[data-pc],[data-pg],[data-pb],[data-px]');if(!b) return;
  let ok=false;
  if(b.dataset.pb) ok=buyGoldPass();
  else if(b.dataset.px) ok=claimPassBonus();
  else if(b.dataset.pg!==undefined) ok=claimPrem(+b.dataset.pg);
  else{const a=b.dataset.pc;if(a==='all'){let n=claimPassAll();if(S.pass.gold){const t=passTier();for(let i=0;i<t;i++) if(!S.pass.gcl[i]&&claimPrem(i)) n++;}while(claimPassBonus()) n++;ok=n>0;}else ok=claimPass(+a);}
  if(!ok){nope(b);return;}
  bump(b);snd('claim');checkAch(false);render();
});
gEls.daily.addEventListener('click',e=>{
  const b=e.target.closest('[data-gc]');if(!b) return;
  const a=b.dataset.gc;let ok=false;
  if(a==='all') ok=claimAll()>0;
  else if(a==='login') ok=claimLogin();
  else if(a==='bonus') ok=claimBonus();
  else if(a.startsWith('q:')) ok=claimQuest(+a.slice(2));
  if(!ok){nope(b);return;}
  bump(b);checkAch(false);render();
});
function statTick(rdt){
  const st=S.stat;st.time+=rdt;
  if(C.kps>st.best) st.best=C.kps;
  histT+=rdt;if(histT>=60){histT=0;st.hist.push(Number(C.kps0.toPrecision(3)));if(st.hist.length>180) st.hist.shift();}
  dayT+=rdt;if(dayT>=5){dayT=0;checkDay(false);envTick();passCheck();B.forEach((b,i)=>{if(S.b[i]>0) S.book.b[i]=1;});}
}

/* Wiedergeburt */
let rebSig='',rebConf=0;
const rebGain=()=>Math.floor(Math.sqrt(S.chips/100)*(S.reb.tree.r_page?1.25:1));
const rebFree=()=>S.reb.pages-REB.reduce((a,n)=>a+(S.reb.tree[n.id]?n.c:0),0);
function updReb(){
  if(panes.asc.hidden) return;
  const R=S.reb,g=rebGain(),free=rebFree(),armedR=Date.now()-rebConf<5000;
  const sig=[LANG,g,R.pages,R.n,free,JSON.stringify(R.tree),armedR,S.chips>=100].join('|');
  if(sig===rebSig) return;
  rebSig=sig;
  let h='<h2>'+tt('Wiedergeburt','Rebirth')+'</h2><p class="lead">'+tt('Die zweite Prestige-Stufe. Ab 100 Himmelschips kannst du wiedergeboren werden und bekommst Rezeptseiten. Jede Seite gibt dauerhaft +15 % Produktion. Freie Seiten tauschst du im Rezeptbuch gegen starke Rezepte.','The second prestige layer. From 100 heavenly chips you can be reborn and get recipe pages. Each page gives +15% production forever. Spend free pages on strong recipes in the recipe book.')+'</p>';
  h+='<dl class="kv"><dt>'+tt('Rezeptseiten','Recipe pages')+'</dt><dd>'+R.pages+' ('+free+' '+tt('frei','free')+')</dd><dt>'+tt('Bonus durch Seiten','Bonus from pages')+'</dt><dd>+'+(R.pages*15)+' %</dd><dt>'+tt('Wiedergeburten','Rebirths')+'</dt><dd>'+R.n+'</dd><dt>'+tt('Seiten bei Wiedergeburt jetzt','Pages if reborn now')+'</dt><dd>'+g+'</dd></dl>';
  h+='<button type="button" class="btn primary'+(g<1?' dis':'')+(armedR?' armed':'')+'" data-reb="go">'+(armedR?tt('Sicher? Nochmal klicken','Sure? Click again'):g<1?tt('Braucht 100 Himmelschips','Needs 100 heavenly chips'):tt('Wiedergeburt: +'+g+(g===1?' Rezeptseite':' Rezeptseiten'),'Rebirth: +'+g+(g===1?' recipe page':' recipe pages')))+'</button>';
  h+='<p class="small">'+tt('Setzt Himmelschips, den Himmlischen Baum und die Aufstiege auf 0 zurück, dazu alles, was ein Aufstieg zurücksetzt. Erfolge, Gegenstände, die Welt, Sternenkrümel und Helfer bleiben.','Resets heavenly chips, the heavenly tree and ascensions to 0, plus everything an ascension resets. Achievements, items, the world, star crumbs and helpers stay.')+'</p>';
  h+='<h3 class="wt" style="margin-top:16px">'+tt('Rezeptbuch','Recipe book')+'</h3><div class="igrid">'+REB.map(n=>{
    const has=!!R.tree[n.id],ok=!has&&free>=n.c;
    const foot=has?'<span class="own-t">'+tt('Gelernt','Learned')+'</span>':'<button type="button" class="btn sm cost'+(ok?' primary':' dis')+'" data-reb="buy:'+n.id+'">'+n.c+' '+tt(n.c===1?'Seite':'Seiten',n.c===1?'page':'pages')+'</button>';
    return '<div class="scard'+(has?' own':'')+'"><span class="ico">'+art('book')+'</span><span class="info"><span class="nm"><span>'+tx(n.n)+'</span></span><span class="sub">'+tx(n.d)+'</span>'+foot+'</span></div>';
  }).join('')+'</div>';
  document.getElementById('rebSec').innerHTML=h;
}
function rebirth(){
  const g=rebGain();if(g<1) return;
  const R=S.reb;
  R.pages+=g;R.n++;S.eg.rebT++;R.base=S.all;S.chips=0;S.tree={};S.asc=0;treeSig='';setTimeout(()=>{confetti(120);shake();},250);
  if(R.tree.r_star) giveStar(2,tt('Wiedergeburt','Rebirth'));
  resetRun(0,null);
  toast(tt('Wiedergeboren! +','Reborn! +')+g+' '+tt('Rezeptseiten','recipe pages'),true);flash(.5,1200);snd('star');rebSig='';
}
document.getElementById('rebSec').addEventListener('click',e=>{
  const b=e.target.closest('[data-reb]');if(!b) return;
  const a=b.dataset.reb;
  if(a==='go'){
    if(rebGain()<1){nope(b);return;}
    if(!S.opt.ask||Date.now()-rebConf<5000){rebConf=0;rebirth();}else{rebConf=Date.now();rebSig='';render();}
    return;
  }
  const id=a.split(':')[1],n=REB.find(x=>x.id===id);
  if(!n||S.reb.tree[id]||rebFree()<n.c){nope(b);return;}
  S.reb.tree[id]=1;recalc();rebSig='';render();toast(tt('Rezept gelernt: ','Recipe learned: ')+tx(n.n),true);snd('ach');
});

/* Weg-Fenster */
function awayPre(){
  const w=S.w,now=Date.now(),p={exp:0,lab:'',egg:0,plants:0};
  w.exp.slots.forEach(s=>{if(s&&s.end<=now) p.exp++;});
  if(w.lab.cur&&w.lab.cur.end<=now){const l=LABS.find(x=>x.id===w.lab.cur.id);if(l) p.lab=tx(l.n);}
  if(w.pet.egg&&w.pet.egg.end<=now) p.egg=1;
  w.gar.plots.forEach(pl=>{if(pl&&plantStage(pl)!=='grow') p.plants++;});
  return p;
}
function offlineHelpers(gap){
  const W=S.work,on=id=>W.hired[id]&&W.on[id],out=[],sec=Math.min(gap,C.offCap*3600),nm=id=>tx(WORKERS.find(x=>x.id===id).n);
  if(on('catcher')&&!WFX.nogold){
    const n=Math.min(200,Math.floor(sec/(345*C.goldRate)));
    if(n>0){const g=n*C.kps0*60;addCk(g);S.gold+=n;wXP('catcher',n*10);wlog('catcher','off',1,n+' '+tt('Goldkekse','golden cookies'));out.push([nm('catcher'),n+' '+tt('Goldkekse','golden cookies')+' · +'+fmt(g)]);}
  }
  if(on('mage')&&W.spell==='bake'){
    const n=Math.min(300,Math.floor(sec*manaRegen()/15));
    if(n>0){const g=n*C.kps0*20;addCk(g);S.w.casts+=n;wXP('mage',n*5);wlog('mage','off',1,n+'× '+tt('Backzauber','Bake Spell'));out.push([nm('mage'),n+'× '+tt('Backzauber','Bake Spell')+' · +'+fmt(g)]);}
  }
  if(on('hunter')&&S.w.mon.st==='idle'){
    const m=S.w.mon,n=Math.min(60,Math.floor(sec/260));let g=0,th=0;
    for(let i=0;i<n;i++){m.boss=((m.k+1)%5===0)?1:0;g+=monReward();th+=m.boss?3:1;m.k++;}
    m.boss=0;
    if(n>0){addCk(g);addMat('tooth',th);wXP('hunter',n*10);wlog('hunter','off',1,n+' '+tt('Monster','monsters'));out.push([nm('hunter'),n+' '+tt('Monster','monsters')+' · +'+fmt(g)+' · +'+th+' '+matName('tooth')]);}
  }
  if(on('exped')){
    const d=DESTS.find(x=>x.id===W.dest)||DESTS[0],risk=d.risk*(wLv('exped')>=2?.75:1);
    const maxR=Math.min(40,Math.max(0,Math.floor(sec/expDur(d))*2-S.w.exp.slots.filter(Boolean).length));
    let runs=0,paid=0;
    for(;runs<maxR;runs++){const c=expCost(d);if(!budgetOk(c)) break;S.cookies-=c;paid+=c;pcInc('e_'+d.id);}
    if(runs>0){
      const okN=Math.round(runs*(1-risk)),gems=okN*(d.gems+(wLv('exped')>=3?2:0)),gain=okN*expReward(d),net=gain-paid;
      addCk(gain);
      addMat('gem',gems);S.w.exp.done+=okN;wXP('exped',runs*10);wlog('exped','off',1,runs+'× '+tx(d.n));
      out.push([nm('exped'),runs+'× '+tx(d.n)+' · '+(net>=0?'+':'−')+fmt(Math.abs(net))+' · +'+gems+' '+matName('gem')]);
    }
  }
  if(on('garden')){
    const d=PLANTS.find(x=>x.id===wSel)||PLANTS[0],cyc=plantGrow(d)+d.life;
    const plots=PLOT_UNLOCK.filter(u=>S.all>=u).length,n=Math.min(30,Math.floor(sec/cyc))*plots;
    let k=0;for(;k<n;k++){const c=plantCost(d);if(!budgetOk(c)) break;S.cookies-=c;pcInc('p_'+d.id);}
    if(k>0){const hb=k*(d.herb+(wLv('garden')>=3?1:0));addMat('herb',hb);wXP('garden',k*3);wlog('garden','off',1,k+'× '+tx(d.n));out.push([nm('garden'),k+'× '+tx(d.n)+' · +'+hb+' '+matName('herb')]);}
  }
  return out;
}
let awayOpen=false;
function showAway(r){
  const p=r.pre,T=[];
  if(r.mana>=1) T.push(['spark','Mana','+'+Math.floor(r.mana)]);
  if(p.exp) T.push(['moon',tt('Expeditionen zurück','Expeditions back'),String(p.exp)]);
  if(p.lab) T.push(['scale',tt('Forschung fertig','Research done'),p.lab]);
  if(p.egg) T.push(['box',tt('Ei geschlüpft','Egg hatched'),'✓']);
  if(p.plants) T.push(['drop',tt('Pflanzen bereit','Plants ready'),String(p.plants)]);
  if(r.sta) T.push(['flame',tt('Ausdauer','Stamina'),'+'+r.sta]);
  r.help.forEach(x=>T.push(['chef',x[0],x[1]]));
  const capped=r.gap>C.offCap*3600;
  let h='<div class="awhero"><div class="awck">'+art('cookie')+'</div><div><span class="small">'+tt('Du warst ','You were away for ')+fmtDur(r.gap)+tt(' weg',' ')+'</span><b>+'+fmt(r.gain)+'</b><span class="small">'+tt('Kekse gebacken','cookies baked')+' · '+Math.round(C.offEff*100)+' % '+tt('Offline-Ertrag, höchstens ','offline income, max ')+C.offCap+' h'+(capped?' · <b style="display:inline;font-size:inherit;color:var(--warn)">'+tt('Grenze erreicht','limit reached')+'</b>':'')+'</span></div></div>';
  if(T.length) h+='<h3 class="wt">'+tt('Was sonst passiert ist','What else happened')+'</h3><div class="awgrid">'+T.map(x=>'<div class="awt"><span class="ico">'+art(x[0])+'</span><span><small>'+x[1]+'</small><b>'+x[2]+'</b></span></div>').join('')+'</div>';
  const R=[];
  if(goalsReady()) R.push(['claim',tt('Belohnungen abholen','Claim rewards')]);
  if(S.all>=5e4&&wheelFree()) R.push(['wheel',tt('Glücksrad drehen','Spin the wheel')]);
  if(advReady()) R.push(['adv',tt('Abenteuer starten','Start adventure')]);
  if(p.exp||p.plants||p.lab||p.egg) R.push(['world',tt('Zur Welt','Go to the world')]);
  if(R.length) h+='<div class="awready"><h3 class="wt">'+tt('Jetzt bereit','Ready now')+'</h3><div class="btns">'+R.map((x,i)=>'<button type="button" class="btn sm'+(i===0?' primary':'')+'" data-aw="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>';
  if(capped) h+='<p class="small" style="margin-top:10px">'+tt('Tipp: Der Himmlische Baum, Gegenstände und die Nachtschicht im Rezeptbuch erhöhen den Offline-Ertrag und die Grenze.','Tip: the heavenly tree, items and Night Shift in the recipe book raise offline income and the limit.')+'</p>';
  const W=S.work,onlineOnly=['builder','research','orders','boostm','broker','supplier','adventurer'].filter(id=>W.hired[id]&&W.on[id]);
  if(onlineOnly.length) h+='<p class="small" style="margin-top:8px">'+onlineOnly.map(id=>tx(WORKERS.find(x=>x.id===id).n)).join(', ')+(onlineOnly.length>1?tt(' arbeiten nur, wenn das Spiel offen ist.',' only work while the game is open.'):tt(' arbeitet nur, wenn das Spiel offen ist.',' only works while the game is open.'))+'</p>';
  if(!loginGot()) h+='<p class="small" style="margin-top:8px"><b>'+tt('Login-Serie: Tag ','Login streak: day ')+S.day.streak+'</b> · '+tt('Hol dir deine Belohnung im Tab Ziele.','Claim your reward in the Goals tab.')+'</p>';
  document.getElementById('awayT').textContent=tt('Willkommen zurück!','Welcome back!');
  document.getElementById('awayBody').innerHTML=h;
  document.getElementById('awayOv').hidden=false;awayOpen=true;
  document.getElementById('awayClose').focus();
}
document.getElementById('awayBody').addEventListener('click',e=>{
  const b=e.target.closest('[data-aw]');if(!b) return;const a=b.dataset.aw;
  if(a==='claim'){claimAll();b.remove();render();return;}
  closeAway();
  if(a==='wheel') SYSGO.wheel();else if(a==='adv'){selectTab('world');setWsub('adv');}else if(a==='world'){selectTab('world');setWsub('world');}
  render();
});
function closeAway(){document.getElementById('awayOv').hidden=true;awayOpen=false;}
document.getElementById('awayClose').addEventListener('click',closeAway);
document.getElementById('awayOv').addEventListener('click',e=>{if(e.target.id==='awayOv') closeAway();});
document.addEventListener('keydown',e=>{if(awayOpen&&e.key==='Escape'){e.preventDefault();closeAway();}});


/* Hinweis-Leiste */
let hintSig='';
function hintList(){
  const w=S.w,L=[];
  if(goalsReady()) L.push(['claim',tt('Alles abholen','Claim all'),1]);
  if(wheelFree()&&S.wheel.pend<0) L.push(['wheel',tt('Glücksrad bereit','Lucky wheel ready'),1]);
  if(visCur) L.push(['vis',tt('Besuch wartet','Visitor waiting'),1]);
  const wu=tabUnl('world');
  if(wu&&w.mon.st==='wait'&&!wLv('hunter')) L.push(['world:mon',tt('Monster wartet','Monster waiting')]);
  if(wu&&w.ev.cur){const e=EVENTS.find(x=>x.id===w.ev.cur.id);L.push(['world:top',tt('Ereignis: ','Event: ')+tx(e.n)]);}
  {const mx=maxMana();if(wu&&mx>=15&&w.mana>=mx-.5&&!wLv('mage')) L.push(['world:mag',tt('Mana voll','Mana full')]);}
  if(wu&&!wLv('garden')&&S.all>=1e5&&w.gar.plots.some((p,i)=>!p&&S.all>=PLOT_UNLOCK[i])) L.push(['world:gar',tt('Beet frei','Free plot')]);
  if(!wLv('exped')&&w.exp.done>0&&w.exp.slots.some(s=>!s)) L.push(['world:exp',tt('Expedition frei','Expedition free')]);
  if(wu&&!w.lab.cur&&LABS.some(l=>!w.lab.done[l.id]&&S.all>=l.unlock&&S.cookies>=labCost(l))) L.push(['world:lab',tt('Labor frei','Lab free')]);
  if(upAfford>0&&!S.work.autoU) L.push(['up',upAfford===1?tt('1 Upgrade kaufbar','1 upgrade affordable'):tt(upAfford+' Upgrades kaufbar',upAfford+' upgrades affordable')]);
  if(tabUnl('shop')&&STAR_ITEMS.some(starAvail)) L.push(['shop',tt('Sternen-Gegenstand kaufbar','Star item affordable')]);
  if(tabUnl('adv')&&!S.hero.run&&S.hero.sta>=staMax()) L.push(['wsub:adv',tt('Ausdauer voll','Stamina full')]);
  if(tabUnl('fr')&&CITIES.some(c=>{const x=S.fr.s[c.id];return x&&!x.truck&&x.stock<=0;})) L.push(['wsub:fr',tt('Filiale: Lager leer','Store: stock empty')]);
  if(rebGain()>=1) L.push(['asc:reb',tt('Wiedergeburt möglich','Rebirth possible')]);
  return L;
}
let hintsAll=false;
function updHints(){
  const L=hintList(),el=document.getElementById('hints');
  const sig=LANG+'|'+hintsAll+'|'+L.map(x=>x[0]+':'+x[1]).join(',');
  if(sig===hintSig) return;
  hintSig=sig;el.hidden=!L.length;
  /* Ruhiger: höchstens 3 Hinweise, der Rest hinter „+N“ */
  const show=hintsAll||L.length<=4?L:L.slice(0,3);
  el.innerHTML=show.map(x=>'<button type="button" class="hint'+(x[2]?' go':'')+'" data-hint="'+x[0]+'">'+x[1]+'</button>').join('')
    +(show.length<L.length?'<button type="button" class="hint more" data-hint="more" aria-label="'+tt('Weitere Hinweise zeigen','Show more hints')+'">+'+(L.length-show.length)+'</button>':'');
}
function claimAll(){
  let n=0;
  if(claimLogin()) n++;
  S.day.q.forEach((q,i)=>{if(claimQuest(i)) n++;});
  if(claimBonus()) n++;
  n+=claimPassAll();
  BOOKC.forEach(c=>{if(claimBook(c.id)) n++;});if(claimBook('all')) n++;
  if(n){checkAch(false);render();}
  return n;
}
document.getElementById('hints').addEventListener('click',e=>{
  const b=e.target.closest('[data-hint]');if(!b) return;
  if(b.dataset.hint==='more'){hintsAll=true;hintSig='';updHints();return;}
  const [t,sub]=b.dataset.hint.split(':');
  if(t==='claim'){if(!claimAll()) nope(b);return;}
  if(t==='vis'){openVis();return;}
  if(t==='wheel'){selectTab('ach');gSub='wheel';document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});render();return;}
  if(t==='wsub'){selectTab('world');setWsub(sub);return;}
  selectTab(t);
  if(t==='asc'&&sub){ascSub=sub;ascSubSig='';render();}
  if(t==='world'&&wSubV!=='world') setWsub('world');
  if(t==='world'&&sub&&sub!=='top'&&WORDER.includes(sub)){wSelSec=sub;render();}
});

/* Rückgängig-Knopf */
const undoBtn=document.getElementById('undoBtn');
function updUndo(){
  const left=undo&&undo.spent>0?5-(Date.now()-undo.t)/1000:0;
  if(left<=0){if(!undoBtn.hidden) undoBtn.hidden=true;return;}
  undoBtn.hidden=false;
  setTxt(undoBtn,tt('↶ Rückgängig (','↶ Undo (')+Math.ceil(left)+' s)');
}
undoBtn.addEventListener('click',()=>{if(!doUndo()) nope(undoBtn);});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==='z'||e.key==='Z')){
    const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return;
    if(doUndo()) e.preventDefault();
  }
});

/* Design + Kompakt */
const mqLight=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
function applyLook(){
  const want=S.opt.look==='auto'?(mqLight&&mqLight.matches?'light':'dark'):S.opt.look,de=document.documentElement;
  if(de.dataset.look!==want) de.dataset.look=want;
  document.body.classList.toggle('compact',!!S.opt.compact);
  numMode=S.opt.num;
  reduced=S.opt.motion==='off'||(S.opt.motion==='sys'&&!!(mqRM&&mqRM.matches));{const mv=reduced?'off':'on';if(de.dataset.motion!==mv) de.dataset.motion=mv;}
  {const hc=S.opt.hc?'1':'0';if(de.dataset.hc!==hc) de.dataset.hc=hc;}
  const bc=document.body.classList;bc.toggle('fs0',S.opt.fs===0);bc.toggle('fs2',S.opt.fs===2);bc.toggle('eco',!!S.opt.eco);
  const A=ACC[S.opt.acc],ak=S.opt.acc+'|'+want;
  if(de._acc!==ak){de._acc=ak;if(A){de.style.setProperty('--accent',want==='light'?A[1]:A[0]);}else de.style.removeProperty('--accent');}
}
const ACC={blue:['#6cb6ff','#4a90e2'],teal:['#4fd1c5','#1fa595'],purple:['#b794f6','#9a6ee6'],pink:['#ff7eb6','#e0569a']};
document.getElementById('lookSeg').addEventListener('click',e=>{
  const b=e.target.closest('[data-look]');if(!b) return;
  S.opt.look=b.dataset.look;render();
});
document.getElementById('compactChk').addEventListener('change',e=>{S.opt.compact=e.target.checked;render();});
{
  const seg=(id,k,num)=>document.getElementById(id).addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b) return;S.opt[k]=num?+b.dataset.v:b.dataset.v;rebuildAll();save();});
  seg('numSeg','num');seg('motSeg','motion');seg('ntfSeg','ntf');seg('ntfTSeg','ntfT',1);
  document.getElementById('ntfTest').addEventListener('click',()=>{toast(S.opt.ntf==='off'?tt('Test: Meldungen sind aus – diese siehst du nur, weil du sie testest.','Test: Notifications are off – you only see this because you are testing.'):tt('Test: So sieht eine Meldung aus.','Test: This is how a notification looks.'),false,true);});seg('fsSeg','fs',1);seg('accSeg','acc');seg('asSeg','as',1);
  document.getElementById('trkList').addEventListener('click',e=>{const b=e.target.closest('[data-trk]');if(!b) return;S.opt.trk=b.dataset.trk;if(!S.opt.mus) S.opt.mus=1;getCtx();render();save();});
  document.getElementById('musSeg').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b) return;S.opt.mus=+b.dataset.v;if(S.opt.mus) getCtx();render();save();});
  const chk=(id,k,fn)=>document.getElementById(id).addEventListener('change',e=>{S.opt[k]=e.target.checked;if(fn) fn();render();save();});
  chk('titleChk','title',()=>{titleT=0;});chk('shakeChk','shake',()=>{if(S.opt.shake) setTimeout(shake,50);});chk('startChk','start');chk('ntfBChk','ntfB');chk('ecoChk','eco');chk('hcChk','hc');chk('bgmChk','bgm');chk('askChk','ask');
  document.getElementById('snList').addEventListener('change',e=>{const x=e.target.closest('[data-sn]');if(!x) return;S.opt.sn[x.dataset.sn]=x.checked;save();if(x.checked){const k=x.dataset.sn==='other'?'claim':x.dataset.sn==='ui'?'sel':x.dataset.sn;snd(k);sndAny=performance.now();}});
  const rb=document.getElementById('optReset');let rt=null;
  rb.addEventListener('click',()=>{
    if(!rb.classList.contains('armed')){rb.classList.add('armed');rb.textContent=tt('Wirklich? Nochmal klicken','Really? Click again');clearTimeout(rt);rt=setTimeout(()=>{rb.classList.remove('armed');optTxtLang='';updOptTxt();},5000);return;}
    clearTimeout(rt);rb.classList.remove('armed');
    const keep={lang:S.opt.lang,skin:S.opt.skin,news:S.opt.news,cd:S.opt.cd};
    S.opt=Object.assign(fresh().opt,keep);els.fx.checked=S.opt.fx;optTxtLang='';rebuildAll();save();toast(tt('Einstellungen zurückgesetzt.','Settings reset.'));
  });
}
document.getElementById('tutShow').addEventListener('click',()=>{if(S.tut.i>=TUT.length){toast(tt('Du hast schon alle ersten Schritte geschafft.','You already finished all first steps.'));return;}S.tut.hide=0;tutSig='';toast(tt('Erste Schritte werden wieder im Tab Bauen gezeigt.','First steps are shown again in the Build tab.'));render();});
const SNL=[['ui','Knöpfe & Tabs','Buttons & tabs'],['click','Klicken','Clicking'],['buy','Kaufen','Buying'],['gold','Goldkekse','Golden cookies'],['ach','Erfolge','Achievements'],['other','Sonstiges','Other']];
let optTxtLang='';
function updOptTxt(){
  if(optTxtLang===LANG) return;optTxtLang=LANG;
  const T=(id,de,en)=>{const e=document.getElementById(id);if(e) e.textContent=tt(de,en);};
  setQ.placeholder=tt('Einstellung suchen …','Search settings …');setQ.setAttribute('aria-label',setQ.placeholder);
  [['disp','Anzeige','Display'],['snd','Ton','Sound'],['game','Spiel','Game'],['save','Speichern','Saving']].forEach(([k,de,en])=>{document.querySelector('#setSeg [data-sp="'+k+'"]').textContent=tt(de,en);});
  T('oAppH','Zahlen, Schrift & Farbe','Numbers, text & color');T('oNumL','Zahlen','Numbers');T('oFsL','Schriftgröße','Text size');T('oAccL','Farbe','Color');
  const nb=document.querySelectorAll('#numSeg button');nb[0].textContent=tt('1,5 Bio','1.5 trillion');nb[1].textContent=tt('1.500.000','1,500,000');nb[2].textContent=tt('1,5e12','1.5e12');nb.forEach((b,i)=>b.title=tt(['Kurz','Lang','Wissenschaftlich'][i],['Short','Long','Scientific'][i]));
  const fb=document.querySelectorAll('#fsSeg button');fb[0].textContent=tt('Klein','Small');fb[1].textContent=tt('Normal','Normal');fb[2].textContent=tt('Groß','Large');
  const an={orange:['Orange','Orange'],blue:['Blau','Blue'],teal:['Türkis','Teal'],purple:['Lila','Purple'],pink:['Pink','Pink']};
  document.querySelectorAll('#accSeg button').forEach(b=>{const l=tx(an[b.dataset.v]);b.setAttribute('aria-label',l);b.title=l;});
  T('oTitleL','Kekse im Browser-Tab anzeigen','Show cookies in the browser tab');
  T('oEcoL','Spar-Modus','Saver mode');T('oHcL','Hoher Kontrast (besser lesbar)','High contrast (easier to read)');T('oEcoH','Weniger Animationen und seltenere Updates. Gut für alte Handys und den Akku.','Fewer animations and less frequent updates. Good for old phones and battery.');
  T('oSnH','Einzelne Töne','Single sounds');T('oBgmL','Stumm, wenn ein anderer Tab offen ist','Mute when another tab is open');
  document.getElementById('snList').innerHTML=SNL.map(([k,de,en])=>'<label class="check"><input type="checkbox" data-sn="'+k+'"> <span>'+tt(de,en)+'</span></label>').join('');
  T('oMusH','Hintergrundmusik','Background music');
  const mb=document.querySelectorAll('#musSeg button');mb[0].textContent=tt('Aus','Off');mb[1].textContent=tt('Leise','Quiet');mb[2].textContent=tt('Normal','Normal');
  T('oMusP','Das Spiel erzeugt die Musik live selbst – sie klingt nie ganz gleich. Sie startet nach deinem nächsten Klick.','The game makes the music live by itself – it never sounds exactly the same. It starts after your next click.');
  T('oTrkL','Musikstück','Track');
  document.getElementById('trkList').innerHTML=[['auto',['Passend zum Tab','Matches the tab'],['Wechselt je nach Tab','Changes with the tab']]].concat(TRK_IDS.map(k=>[k,TRK[k].n,TRK[k].d])).map(([k,n,d])=>'<button type="button" class="trk" data-trk="'+k+'" aria-pressed="false"><b>'+tx(n)+'</b><small>'+tx(d)+'</small></button>').join('');
  T('oAskH','Sicherheitsfragen','Safety questions');T('oAskL','Vor wichtigen Aktionen nochmal fragen','Ask again before important actions');
  T('oAskP','Gilt für Aufsteigen, Wiedergeburt, Baum zurücksetzen und Käufe im Sternen-Laden. „Alles löschen“ fragt immer.','Applies to ascending, rebirth, resetting the tree and star shop purchases. “Delete everything” always asks.');
  T('oResH','Einstellungen zurücksetzen','Reset settings');T('oResP','Setzt nur die Einstellungen auf Standard. Dein Spielstand und deine Sprache bleiben.','Only resets the settings to default. Your game and language stay.');
  T('optReset','Einstellungen zurücksetzen','Reset settings');
  T('oNtfH','Meldungen','Notifications');T('oShakeL','Bildschirm wackeln (bei Bossen, Aufstieg usw.)','Screen shake (on bosses, ascension etc.)');T('oStartL','Startbildschirm beim Öffnen zeigen','Show start screen when opening');T('oMotL','Animationen','Animations');
  {const mb3=document.querySelectorAll('#motSeg button');mb3[0].textContent=tt('An','On');mb3[1].textContent=tt('Wie System','Like system');mb3[2].textContent=tt('Aus','Off');}
  const nb2=document.querySelectorAll('#ntfSeg button');nb2[0].textContent=tt('Alle','All');nb2[1].textContent=tt('Nur wichtige','Important only');nb2[2].textContent=tt('Aus','Off');
  T('oNtfP','Die kleinen Meldungen unten im Bild. Wichtig sind z. B. Goldkekse, Erfolge und Belohnungen. Alle Meldungen findest du trotzdem immer bei der Glocke.','The small messages at the bottom. Important ones are e.g. golden cookies, achievements and rewards. You can still find all messages at the bell.');
  T('oNtfTL','Anzeigedauer','Show for');
  const tb2=document.querySelectorAll('#ntfTSeg button');tb2[0].textContent='3 s';tb2[1].textContent='5 s';tb2[2].textContent='8 s';
  T('oNtfBL','Zähler an der Glocke zeigen','Show counter on the bell');T('ntfTest','Test-Meldung zeigen','Show test message');T('oAsL','Automatisch speichern alle','Autosave every');
}
function updOpts(){
  applyLook();
  if(els.setOv.hidden) return;
  updOptTxt();
  const pr=(sel,v)=>document.querySelectorAll(sel+' [data-v]').forEach(x=>{const p=x.dataset.v===String(v)?'true':'false';if(x.getAttribute('aria-pressed')!==p) x.setAttribute('aria-pressed',p);});
  pr('#numSeg',S.opt.num);pr('#motSeg',S.opt.motion);pr('#ntfSeg',S.opt.ntf);pr('#ntfTSeg',S.opt.ntfT);pr('#fsSeg',S.opt.fs);pr('#accSeg',S.opt.acc);pr('#musSeg',S.opt.mus);document.querySelectorAll('#trkList [data-trk]').forEach(x=>{const p=x.dataset.trk===(S.opt.trk||'auto')?'true':'false';if(x.getAttribute('aria-pressed')!==p) x.setAttribute('aria-pressed',p);});
  setTxt(document.getElementById('oMusNow'),S.opt.mus?tt('Läuft gerade: ','Now playing: ')+tx(TRK[curTrk()].n)+(actx&&actx.state==='running'?'':tt(' (startet nach einem Klick)',' (starts after a click)')):tt('Musik ist aus.','Music is off.'));pr('#asSeg',S.opt.as);
  const ck=(id,v)=>{const e=document.getElementById(id);if(e.checked!==!!v) e.checked=!!v;};
  ck('titleChk',S.opt.title);ck('shakeChk',S.opt.shake!==false);ck('startChk',S.opt.start!==false);ck('ntfBChk',S.opt.ntfB);ck('ecoChk',S.opt.eco);ck('hcChk',!!S.opt.hc);ck('bgmChk',S.opt.bgm);ck('askChk',S.opt.ask);
  document.querySelectorAll('#snList [data-sn]').forEach(x=>{const v=S.opt.sn[x.dataset.sn]!==false;if(x.checked!==v) x.checked=v;});
  document.querySelectorAll('#lookSeg [data-look]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.look===S.opt.look?'true':'false'));
  const cc=document.getElementById('compactChk');if(cc.checked!==!!S.opt.compact) cc.checked=!!S.opt.compact;
  setTxt(document.getElementById('tutShow'),tt('Erste Schritte wieder zeigen','Show first steps again'));
  updBk();
}

/* Backups */
const BK_KEY='keksfabrik-backups-v1';
let bkSig='',bkConf={i:-1,t:0},lastBk=0;
function readBk(){try{const a=JSON.parse(localStorage.getItem(BK_KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x.s==='string'&&typeof x.t==='number'):[];}catch(e){return [];}}
function pushBackup(){
  lastBk=Date.now();
  try{const a=readBk();a.unshift({t:lastBk,c:S.all,s:sealJSON(S)});localStorage.setItem(BK_KEY,JSON.stringify(a.slice(0,3)));}catch(e){}
  bkSig='';
}
function updBk(){
  const a=readBk(),armed=Date.now()-bkConf.t<5000?bkConf.i:-1;
  const sig=LANG+'|'+a.map(x=>x.t).join(',')+'|'+armed;
  if(sig===bkSig) return;
  bkSig=sig;
  document.getElementById('bkList').innerHTML=a.length?a.map((x,i)=>'<div class="bk"><span><b>'+new Date(x.t).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</b><span class="sub">'+fmt(+x.c||0)+' '+tt('Kekse insgesamt','cookies in total')+'</span></span><button type="button" class="btn sm'+(armed===i?' armed':'')+'" data-bk="'+i+'">'+(armed===i?tt('Sicher? Nochmal','Sure? Again'):tt('Wiederherstellen','Restore'))+'</button></div>').join(''):'<p class="small">'+tt('Noch keine Backups.','No backups yet.')+'</p>';
}
document.getElementById('bkList').addEventListener('click',e=>{
  const b=e.target.closest('[data-bk]');if(!b) return;
  const i=+b.dataset.bk;
  if(bkConf.i!==i||Date.now()-bkConf.t>5000){bkConf={i,t:Date.now()};bkSig='';updBk();return;}
  bkConf={i:-1,t:0};
  const x=readBk()[i];if(!x){nope(b);return;}
  try{
    S=sanitize(JSON.parse(x.s));S.t=Date.now();LANG=S.opt.lang;els.fx.checked=S.opt.fx;undo=null;
    applyLang();rebuildAll();save();toast(tt('Backup wiederhergestellt.','Backup restored.'),true);
  }catch(err){toast(tr('toast_invalid'));}
  bkSig='';
});


/* Klick-Combo */
let combo=0,comboLast=0;
function comboHit(){const n=performance.now();combo=(n-comboLast<1000?combo:Math.max(0,combo-5))+1;{const mx=(2+UE.comboCap)*50;if(combo>mx) combo=mx;}comboLast=n;}
const comboMul=()=>1+Math.min(2+UE.comboCap,combo/50);
function comboTick(dt){if(combo>0&&performance.now()-comboLast>800) combo=Math.max(0,combo-dt*35*UE.comboDecay);}
function updCombo(){
  const el=document.getElementById('combo'),show=combo>=5;
  if(el.hidden===show) el.hidden=!show;
  if(!show) return;
  setTxt(document.getElementById('comboT'),'Combo ×'+comboMul().toFixed(2).replace('.',LANG==='de'?',':'.'));
  document.getElementById('comboW').style.width=Math.min(100,combo/((2+UE.comboCap)*50)*100)+'%';
}

/* Startschub */
function startChip(){
  if(S.runT>=300) return '';
  return '<span class="buff start">'+tt('Startschub ×2','Head Start ×2')+' · '+mmss(300-S.runT)+'</span>';
}
function runTick(rdt){
  const was=S.runT<300;S.runT+=rdt;
  if(was&&S.runT>=900){recalc();toast(tt('Der Startschub ist vorbei.','The head start is over.'));}
}

/* Schrittweise Freischaltung */
const tabUnl=id=>S.all>=(UNL[id]||0);
let unlPrev=null;
const wsBtns=[...document.querySelectorAll('#wSeg [data-ws]')];
let wSubV='world';
const advReady=()=>tabUnl('adv')&&!S.hero.run&&S.hero.sta>=staMax();
const frEmpty=()=>tabUnl('fr')&&CITIES.some(c=>{const x=S.fr.s[c.id];return x&&!x.truck&&x.stock<=0;});
function setWsub(id){
  if(!tabUnl(id)) id='world';
  wSubV=id;S.seen[id]=1;
  wsBtns.forEach(b=>b.setAttribute('aria-pressed',b.dataset.ws===id?'true':'false'));
  document.querySelectorAll('#worldPane .wsub').forEach(s=>{s.hidden=s.dataset.wsub!==id;});
  render();
}
document.getElementById('wSeg').addEventListener('click',e=>{const b=e.target.closest('[data-ws]');if(b) setWsub(b.dataset.ws);});
function updTabs(){
  const now={};
  const sg=document.getElementById('wSeg'),anySub=tabUnl('adv')||tabUnl('fr');
  if(!sg.hidden) sg.hidden=true;
  if(!tabUnl(wSubV)&&wSubV!=='world') setWsub('world');
  tabs.concat(wsBtns.filter(b=>b.dataset.ws!=='world')).forEach(t=>{
    const id=t.dataset.tab||t.dataset.ws,ok=tabUnl(id);now[id]=ok;
    if(t.hidden===ok) t.hidden=!ok;
    let tn=t.querySelector('.tnew');
    const showNew=ok&&(!S.seen[id]||(id==='world'&&((tabUnl('adv')&&!S.seen.adv)||(tabUnl('fr')&&!S.seen.fr))));
    if(showNew&&!tn){tn=document.createElement('i');tn.className='tnew';t.appendChild(tn);}
    if(tn){tn.hidden=!showNew;setTxt(tn,tr('tab_new'));}
  });
  if(unlPrev&&unlPrev.S===S) Object.keys(now).forEach(id=>{if(now[id]&&!unlPrev.v[id]){toast(tt('Neu freigeschaltet: ','Newly unlocked: ')+tr('tab_'+id)+(id==='adv'||id==='fr'?tt(' (im Tab Welt)',' (in the World tab)'):''),true);snd('ach');}});
  unlPrev={S,v:now};
}

/* Erste Schritte */
function beginHint(){
  if(S.tut.hide||S.asc>0||S.reb.n>0||S.all>=2e4) return '';
  const n0=tx(B[0].name),c0=buyCost(0,1);
  if(S.b[0]===0&&S.clicks<5) return tt('Tippe auf den großen Keks! Jeder Klick backt einen Keks.','Tap the big cookie! Every click bakes one cookie.');
  if(S.b[0]===0&&S.cookies<c0) return tt('Super! Noch '+fmt(Math.ceil(c0-S.cookies))+' Kekse, dann kannst du deinen ersten '+n0+' kaufen.','Great! '+fmt(Math.ceil(c0-S.cookies))+' more cookies and you can buy your first '+n0+'.');
  if(S.b[0]===0) return tt('Du hast genug! Kaufe im Tab Bauen einen '+n0+'. Er backt dann ganz von allein.','You have enough! Buy a '+n0+' in the Build tab. It bakes all by itself.');
  if(S.b[1]===0&&S.b[0]<5) return tt('Gebäude backen automatisch, auch ohne Klicks. Kaufe mehr davon!','Buildings bake automatically, even without clicks. Buy more of them!');
  if(S.b[1]===0) return tt('Nächstes Ziel: '+tx(B[1].name)+' für '+fmt(buyCost(1,1))+' Kekse. Sie backt 10-mal so viel wie ein '+n0+'.','Next goal: '+tx(B[1].name)+' for '+fmt(buyCost(1,1))+' cookies. She bakes 10 times as much as a '+n0+'.');
  if(!Object.keys(S.up).length) return tt('Schau in den Tab Upgrades. Ein Upgrade macht Gebäude oder Klicks viel stärker.','Check the Upgrades tab. An upgrade makes buildings or clicks much stronger.');
  if(!S.gold) return tt('Tipp: Manchmal erscheint ein goldener Keks. Klicke ihn schnell für einen großen Bonus!','Tip: Sometimes a golden cookie appears. Click it fast for a big bonus!');
  return '';
}
let tutSig='';
function tutStep(){return S.tut.i<TUT.length&&!S.tut.hide?TUT[S.tut.i]:null;}
const tutReward=t=>t.sec?Math.ceil(Math.max(50,C.kps0*t.r)):t.r;
function updTut(){
  const el=document.getElementById('tutBox'),t=tutStep();
  if(!t){if(el.innerHTML) el.innerHTML='';tutSig='';return;}
  const [a,b]=t.p(),done=a>=b,rw=t.star?tt('1 Sternenkrümel','1 star crumb'):fmt(tutReward(t))+' '+tt('Kekse','cookies');
  const sig=[LANG,S.tut.i,done,rw].join('|');
  if(sig!==tutSig){
    tutSig=sig;
    el.innerHTML='<div class="tut"><span class="ico">'+art(t.art)+'</span><span class="info"><span class="tk">'+tt('Erste Schritte','First steps')+' · '+(S.tut.i+1)+' / '+TUT.length+'</span><span class="tt" style="display:block">'+tx(t.n)+'</span>'+(t.w?'<span class="twhy">'+tx(t.w)+'</span>':'')+'<span class="sub"><span id="tutP"></span> · '+tt('Belohnung: ','Reward: ')+rw+'</span><span class="obar"><i id="tutW"></i></span></span><span class="tact"><button type="button" class="btn sm primary'+(done?'':' dis')+'" data-tut="claim">'+tt('Abholen','Claim')+'</button><button type="button" class="lnk" data-tut="hide">'+tt('Ausblenden','Hide')+'</button></span></div>';
  }
  const pt=b>=1000?fmt(Math.min(a,b))+' / '+fmt(b):Math.min(Math.floor(a),b)+' / '+b;
  setTxt(document.getElementById('tutP'),pt);
  document.getElementById('tutW').style.width=Math.min(100,a/b*100)+'%';
}
document.getElementById('tutBox').addEventListener('click',e=>{
  const b=e.target.closest('[data-tut]');if(!b) return;
  if(b.dataset.tut==='hide'){S.tut.hide=1;toast(tt('Erste Schritte ausgeblendet. In den Einstellungen kannst du sie wieder zeigen.','First steps hidden. You can show them again in the settings.'));render();return;}
  const t=tutStep();if(!t) return;
  const [a,c]=t.p();if(a<c){nope(b);return;}
  if(t.star) giveStar(1,tt('Erste Schritte','First steps'));
  else{const g=tutReward(t);addCk(g);toast(tt('Geschafft! +','Done! +')+fmt(g)+' '+tt('Kekse','cookies'),true);}
  if(fxOk()){const bc=b.getBoundingClientRect();fxRing(bc.left+bc.width/2,bc.top+bc.height/2,'rgba(120,230,150,1)',true);fxSparks(bc.left+bc.width/2,bc.top+bc.height/2,14,'#9df0b4');}
  snd('claim');S.tut.i++;tutSig='';addPP(5);
  if(S.tut.i>=TUT.length) toast(tt('Du hast alle ersten Schritte geschafft!','You finished all first steps!'),true);
  render();
});

/* Endlos-Upgrades */
let infSig='';
const infCost=x=>Math.ceil(x.base*Math.pow(x.g,S.inf[x.id]));
function infEff(x){
  const L=S.inf[x.id];
  if(x.id==='p') return '×'+fmtRate(Math.pow(1.05,L));
  if(x.id==='c') return '×'+fmtRate(Math.pow(1.15,L));
  return '+'+(3*L)+' %';
}
function updInf(){
  const sec=document.getElementById('infSec'),on=S.all>=1e12;
  if(sec.hidden===on) sec.hidden=!on;
  if(!on||panes.up.hidden) return;
  const sig=LANG+'|'+INF.map(x=>S.inf[x.id]).join(',');
  const list=document.getElementById('infList');
  if(sig!==infSig){
    infSig=sig;
    setTxt(document.getElementById('infTitle'),tt('Endlos-Upgrades','Endless upgrades'));
    setTxt(document.getElementById('infNote'),tt('Diese Upgrades kannst du immer wieder kaufen. Jede Stufe wird teurer. Beim Aufstieg gehen sie verloren.','You can buy these upgrades again and again. Each level costs more. They reset when you ascend.'));
    list.innerHTML=INF.map(x=>{
      const L=S.inf[x.id],mx=L>=x.max;
      return '<button type="button" class="row" data-inf="'+x.id+'"><span class="ico">'+art(x.id==='p'?'infinity':x.id==='c'?'hand':'gold')+'<i class="tag">'+L+'</i></span><span class="info"><span class="nm"><span>'+tx(x.n)+' · '+tt('Stufe ','Level ')+L+'</span></span><span class="sub">'+tx(x.d)+' '+tt('Jetzt: ','Now: ')+infEff(x)+'</span></span><span class="price"><span class="pv">'+(mx?tt('Max','Max'):fmt(infCost(x)))+'</span><span class="pq"></span></span></button>';
    }).join('');
  }
  list.querySelectorAll('.row').forEach(r=>{
    const x=INF.find(y=>y.id===r.dataset.inf),c=infCost(x),ok=S.inf[x.id]<x.max&&S.cookies>=c;
    r.classList.toggle('can',ok);
    const q=r.querySelector('.pq'),wt=ok||S.inf[x.id]>=x.max||!(C.kps>0)?'':tt('in ','in ')+fmtWait((c-S.cookies)/C.kps);
    if(q.textContent!==wt) q.textContent=wt;
  });
}
document.getElementById('infList').addEventListener('click',e=>{
  const r=e.target.closest('[data-inf]');if(!r) return;
  const x=INF.find(y=>y.id===r.dataset.inf),c=infCost(x);
  if(S.inf[x.id]>=x.max||S.cookies<c){nope(r);return;}
  undoBegin();S.cookies-=c;S.inf[x.id]++;undoAdd(c);recalc();infSig='';render();snd('buy');bump(r);
});

