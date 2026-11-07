/* ======================= V31: Bedienung, Hilfe, Start ======================= */
/* --- Hilfe-Texte (auch für Freischalt-Erklärungen) --- */
const HELP=[
  {id:'cookie',ic:'cookie',t:['Kekse & Klicken','Cookies & clicking'],d:['Klicke auf den großen Keks, um Kekse zu backen. Schnelle Klicks bauen eine Combo auf, die jeden Klick stärker macht.','Click the big cookie to bake cookies. Fast clicks build a combo that makes every click stronger.'],u:()=>true},
  {id:'build',ic:'b2',t:['Gebäude','Buildings'],d:['Gebäude backen von selbst Kekse pro Sekunde. Jedes Gebäude wird nach dem Kauf etwas teurer. Ab 25, 50, 100 … Stück gibt es Meilenstein-Boni.','Buildings bake cookies per second by themselves. Every building gets a bit more expensive after you buy it. At 25, 50, 100 … owned you get milestone bonuses.'],u:()=>true},
  {id:'up',ic:'spark',t:['Upgrades','Upgrades'],d:['Upgrades machen Gebäude, Klicks und Goldkekse stärker. „Kompakt“ zeigt nur das nächste Upgrade jeder Reihe. Die grüne Zahl zeigt, wie viel ein Upgrade bringt.','Upgrades make buildings, clicks and golden cookies stronger. “Compact” shows only the next upgrade of each series. The green number shows how much an upgrade gives.'],u:()=>true},
  {id:'gold',ic:'gold',t:['Goldkekse','Golden cookies'],d:['Ab und zu erscheint ein Goldkeks. Klick ihn schnell an – er gibt einen Rausch, viele Kekse oder einen anderen Bonus.','Now and then a golden cookie appears. Click it fast – it gives a frenzy, lots of cookies or another bonus.'],u:()=>true},
  {id:'work',ic:'chef',t:['Helfer','Helpers'],d:['Helfer arbeiten für dich: Sie kaufen Gebäude, ernten, kämpfen oder handeln. Mit Erfahrung steigen sie auf und werden stärker.','Helpers work for you: they buy buildings, harvest, fight or trade. With experience they level up and get stronger.'],u:()=>tabUnl('work')},
  {id:'orders',ic:'scroll',t:['Aufträge','Orders'],d:['Kunden geben dir Aufgaben mit Zeitlimit. Schaffst du sie, gibt es Belohnungen und Ruf.','Customers give you tasks with a time limit. If you finish them you get rewards and reputation.'],u:()=>tabUnl('orders')},
  {id:'world',ic:'moon',t:['Welt','World'],d:['Auf der Weltkarte gibt es Monster, Garten, Expeditionen, Markt, Labor, Haustiere und Zauber. Hier sammelst du Edelsteine, Kräuter und Monsterzähne.','On the world map there are monsters, a garden, expeditions, a market, a lab, pets and spells. Here you collect gems, herbs and monster teeth.'],u:()=>tabUnl('world')},
  {id:'adv',ic:'flame',t:['Abenteuer','Adventure'],d:['Dein Held kämpft in Dungeons und im Endlos-Turm. Er findet Ausrüstung und steigt auf. Jedes Abenteuer kostet Ausdauer, die von selbst wieder voll wird.','Your hero fights in dungeons and in the endless tower. He finds gear and levels up. Every adventure costs stamina, which refills by itself.'],u:()=>tabUnl('adv')},
  {id:'fr',ic:'b6',t:['Filialen','Stores'],d:['Eröffne Filialen in Städten. Sie verkaufen deine Kekse und bringen Gewinn, auch wenn du nicht spielst.','Open stores in cities. They sell your cookies and make profit, even while you are not playing.'],u:()=>tabUnl('fr')},
  {id:'ach',ic:'crown',t:['Ziele','Goals'],d:['Tagesaufgaben, Login-Serie, Pass, Erfolge und Sammelbuch. Hier holst du viele Belohnungen ab – oben hilft „Alles abholen“.','Daily tasks, login streak, pass, achievements and collection book. You claim lots of rewards here – “Claim all” at the top helps.'],u:()=>true},
  {id:'wheel',ic:'lucky',t:['Glücksrad','Lucky wheel'],d:['Einmal am Tag gratis drehen, danach bis zu 3-mal mit Edelsteinen. Mit etwas Glück gibt es den Jackpot. Du findest es im Tab Ziele.','Spin for free once a day, then up to 3 more times with gems. With luck you win the jackpot. You find it in the Goals tab.'],u:()=>S.all>=5e4},
  {id:'ttl',ic:'crown',t:['Titel & Abzeichen','Titles & badges'],d:['Titel zeigst du oben neben dem Namen. Abzeichen gibt es in Bronze, Silber und Gold – jede Stufe gibt +1 % Produktion.','You show titles at the top next to the name. Badges come in bronze, silver and gold – each tier gives +1% production.'],u:()=>S.all>=1e6},
  {id:'shop',ic:'coin',t:['Shop','Shop'],d:['Wundertüten mit Gegenständen, kurze Boosts und der Sternen-Laden mit dauerhaften Verbesserungen.','Surprise boxes with items, short boosts and the star shop with permanent upgrades.'],u:()=>tabUnl('shop')},
  {id:'art',ic:'box',t:['Artefakte','Artifacts'],d:['Aus Artefakt-Splittern schmiedest du Artefakte (Tab Shop). Du kannst 3 tragen. Sockel mit Edelsteinen machen sie stärker.','You forge artifacts from artifact shards (Shop tab). You can wear 3. Sockets with gems make them stronger.'],u:()=>artUnl()},
  {id:'asc',ic:'star',t:['Aufstieg','Ascension'],d:['Beim Aufstieg fängst du neu an, bekommst aber Himmelschips. Jeder Chip gibt dauerhaft +1 % Produktion. Im Himmlischen Baum kaufst du starke Vorteile.','When you ascend you start over but get heavenly chips. Each chip gives +1% production forever. In the heavenly tree you buy strong perks.'],u:()=>tabUnl('asc')},
  {id:'rank',ic:'star',t:['Prestige-Rang','Prestige rank'],d:['Aufstiege, Wiedergeburten und Kosmische Aufstiege geben Rangpunkte. Jeder Rang gibt +5 % Produktion und einen Rahmen um den Keks.','Ascensions, rebirths and cosmic ascensions give rank points. Every rank gives +5% production and a frame around the cookie.'],u:()=>S.eg.ascT>=1},
  {id:'reb',ic:'book',t:['Wiedergeburt','Rebirth'],d:['Ab 100 Himmelschips kannst du wiedergeboren werden. Du verlierst Chips und Baum, bekommst aber Rezeptseiten: je +15 % Produktion und starke Rezepte.','From 100 heavenly chips you can be reborn. You lose chips and the tree but get recipe pages: +15% production each and strong recipes.'],u:()=>S.chips>=50||S.reb.n>0||S.eg.rebT>0},
  {id:'cos',ic:'moon',t:['Kosmischer Aufstieg','Cosmic ascension'],d:['Ab 3 Wiedergeburten und 10 Rezeptseiten steigst du ins All auf. Kosmos-Splitter geben je +30 % Produktion und kosmische Kräfte.','From 3 rebirths and 10 recipe pages you rise into space. Cosmic shards give +30% production each and cosmic powers.'],u:()=>S.reb.n>=1||S.eg.cos.n>0||S.eg.rebT>0},
  {id:'par',ic:'infinity',t:['Paragon-Stufen','Paragon levels'],d:['Unendliche Stufen ab 10^27 Keksen insgesamt. Jede Stufe gibt einen Punkt für Produktion, Klicks, Goldkekse oder Preise.','Endless levels from 10^27 cookies in total. Every level gives a point for production, clicks, golden cookies or prices.'],u:()=>parUnl()},
  {id:'evo',ic:'b5',t:['Gebäude-Evolution','Building evolution'],d:['Ab 500 Stück kann ein Gebäude golden werden und produziert für immer ×10. Du findest es im Tab Bauen unter der Liste.','From 500 owned a building can turn golden and produces ×10 forever. You find it in the Build tab below the list.'],u:()=>B.some((b,i)=>S.b[i]>=250)||Object.keys(S.eg.evo).length>0},
  {id:'auto',ic:'timer',t:['Automatik-Zentrale','Automation center'],d:['Regeln, die Dinge von selbst erledigen: Aufstieg, Wiedergeburt, Glücksrad, Abholen, Goldkekse und Abenteuer. Du findest sie im Tab Helfer.','Rules that do things by themselves: ascension, rebirth, lucky wheel, claiming, golden cookies and adventure. You find them in the Helpers tab.'],u:()=>autoUnl()}
];
/* --- Währungs-Leiste --- */
const CUR=[
  {id:'chips',ic:'spark',h:'asc',n:['Himmelschips','Heavenly chips'],v:()=>fmt(S.chips),u:()=>S.chips>0||S.eg.ascT>0,d:['Vom Aufstieg. Jeder gibt +1 % Produktion. Ausgeben im Himmlischen Baum.','From ascending. Each gives +1% production. Spend them in the heavenly tree.']},
  {id:'pages',ic:'book',h:'reb',n:['Rezeptseiten','Recipe pages'],v:()=>String(S.reb.pages),u:()=>S.reb.pages>0||S.eg.rebT>0,d:['Von der Wiedergeburt. Jede gibt +15 % Produktion. Ausgeben im Rezeptbuch.','From rebirth. Each gives +15% production. Spend them in the recipe book.']},
  {id:'shards',ic:'moon',h:'cos',n:['Kosmos-Splitter','Cosmic shards'],v:()=>String(S.eg.cos.sh),u:()=>S.eg.cos.sh>0||S.eg.cos.n>0,d:['Vom Kosmischen Aufstieg. Jeder gibt +30 % Produktion. Ausgeben für kosmische Kräfte.','From cosmic ascension. Each gives +30% production. Spend them on cosmic powers.']},
  {id:'par',ic:'infinity',h:'par',n:['Paragon-Punkte','Paragon points'],v:()=>String(parFree()),u:()=>parUnl(),d:['Freie Paragon-Punkte. Verteile sie im Tab Aufstieg → Paragon.','Free paragon points. Spend them in Ascension → Paragon.']},
  {id:'gem',ic:'@gem',h:'world',n:['Edelsteine','Gems'],v:()=>fmt(S.w.mat.gem),u:()=>tabUnl('world'),d:['Aus Welt, Monstern und Expeditionen. Für Gegenstände, Glücksrad und Artefakt-Sockel.','From the world, monsters and expeditions. For items, the lucky wheel and artifact sockets.']},
  {id:'star',ic:'star',h:'shop',n:['Sternenkrümel','Star crumbs'],v:()=>String(S.w.star.n),u:()=>S.all>=STAR_UNLOCK,d:['Sehr selten. Für dauerhafte Verbesserungen im Sternen-Laden.','Very rare. For permanent upgrades in the star shop.']},
  {id:'frag',ic:'box',h:'art',n:['Artefakt-Splitter','Artifact shards'],v:()=>String(S.eg.art.frag),u:()=>artUnl(),d:['Von Goldkeksen, Monstern und Expeditionen. Zum Schmieden von Artefakten.','From golden cookies, monsters and expeditions. For forging artifacts.']}
];
const curBar=document.getElementById('curBar'),curTip=document.getElementById('curTip');
let curSig='',curT=0,curOpen='';
function updCur(){
  const now=Date.now();if(now-curT<300) return;curT=now;
  const L=CUR.filter(c=>{try{return c.u();}catch(e){return false;}});
  const sig=LANG+'|'+L.map(c=>c.id).join(',');
  if(sig!==curSig){curSig=sig;curBar.hidden=!L.length;curBar.innerHTML=L.map(c=>'<button type="button" class="cur" data-cur="'+c.id+'" title="'+tx(c.n)+'"><span class="ci">'+(c.ic[0]==='@'?matSVG(c.ic.slice(1)):art(c.ic))+'</span><b></b></button>').join('')+'<button type="button" class="cur curhelp" data-cur="?" aria-label="'+tt('Hilfe','Help')+'">?</button>';}
  curBar.querySelectorAll('[data-cur]').forEach(b=>{const c=CUR.find(x=>x.id===b.dataset.cur);if(!c) return;const v=c.v(),el=b.lastChild;if(el.textContent!==v) el.textContent=v;});
}
curBar.addEventListener('click',e=>{
  const b=e.target.closest('[data-cur]');if(!b) return;
  if(b.dataset.cur==='?'){openHelp();return;}
  const c=CUR.find(x=>x.id===b.dataset.cur);if(!c) return;
  if(curOpen===c.id&&!curTip.hidden){curTip.hidden=true;curOpen='';return;}
  curOpen=c.id;
  curTip.innerHTML='<b>'+tx(c.n)+': '+c.v()+'</b><p>'+tx(c.d)+'</p><button type="button" class="btn sm" data-hh="'+c.h+'">'+tt('Mehr in der Hilfe','More in help')+'</button>';
  curTip.hidden=false;
  const r=b.getBoundingClientRect(),w=Math.min(280,innerWidth-24);curTip.style.width=w+'px';
  curTip.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';curTip.style.top=(r.bottom+8)+'px';
});
curTip.addEventListener('click',e=>{const b=e.target.closest('[data-hh]');if(b){curTip.hidden=true;openHelp(b.dataset.hh);}});
document.addEventListener('pointerdown',e=>{if(!curTip.hidden&&!e.target.closest('#curTip,#curBar')) curTip.hidden=true;});
addEventListener('scroll',()=>{if(!curTip.hidden) curTip.hidden=true;},{passive:true});

/* --- Hilfe-Fenster --- */
const helpOv=document.getElementById('helpOv');
function renderHelp(openId){
  const q=(document.getElementById('helpQ').value||'').trim().toLowerCase();
  document.getElementById('helpT').textContent=tt('Hilfe','Help');
  document.getElementById('helpClose').textContent=tt('Schließen','Close');
  document.getElementById('helpQ').placeholder=tt('Hilfe durchsuchen …','Search help …');
  const L=HELP.filter(x=>!q||(tx(x.t)+' '+tx(x.d)).toLowerCase().includes(q));
  document.getElementById('helpBody').innerHTML='<p class="small" style="margin:0 0 8px">'+tt('Alles Wichtige in kurzen Sätzen. Gesperrte Teile schaltest du später frei.','Everything important in short sentences. Locked parts unlock later.')+'</p>'
    +L.map(x=>{let ok=true;try{ok=x.u();}catch(e){}return '<details class="hlp'+(ok?'':' lk')+'" data-h="'+x.id+'"'+(openId===x.id||q?' open':'')+'><summary><span class="ico">'+art(x.ic)+'</span><b>'+tx(x.t)+'</b>'+(ok?'':'<small>'+tt('noch gesperrt','still locked')+'</small>')+'</summary><p>'+tx(x.d)+'</p></details>';}).join('')
    +(L.length?'':'<p class="small">'+tt('Nichts gefunden.','Nothing found.')+'</p>');
}
function openHelp(id){
  document.getElementById('helpQ').value='';renderHelp(id);helpOv.hidden=false;
  if(id){const el=helpOv.querySelector('[data-h="'+id+'"]');if(el) setTimeout(()=>el.scrollIntoView({block:'center',behavior:'smooth'}),60);}
  document.getElementById('helpClose').focus();
}
function closeHelp(){helpOv.hidden=true;}
document.getElementById('helpBtn').addEventListener('click',()=>openHelp());
document.getElementById('helpClose').addEventListener('click',closeHelp);
helpOv.addEventListener('click',e=>{if(e.target===helpOv) closeHelp();});
document.getElementById('helpQ').addEventListener('input',()=>renderHelp());

/* --- Schritt für Schritt: Erklärung beim Freischalten --- */
const introOv=document.getElementById('introOv');let introQ=[],introCur=null;
const SYSGO={work:()=>selectTab('work'),orders:()=>selectTab('orders'),world:()=>{selectTab('world');setWsub('world');},adv:()=>{selectTab('world');setWsub('adv');},fr:()=>{selectTab('world');setWsub('fr');},shop:()=>selectTab('shop'),asc:()=>{selectTab('asc');ascSub='asc';},
  wheel:()=>{selectTab('ach');gSub='wheel';document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});},ttl:()=>{selectTab('ach');gSub='ttl';document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});},
  rank:()=>{selectTab('asc');ascSub='rank';},reb:()=>{selectTab('asc');ascSub='reb';},cos:()=>{selectTab('asc');ascSub='cos';},par:()=>{selectTab('asc');ascSub='par';},
  evo:()=>{selectTab('build');const f=document.getElementById('evoF');f.open=true;setTimeout(()=>f.scrollIntoView({block:'center',behavior:'smooth'}),80);},
  art:()=>{selectTab('shop');setTimeout(()=>document.getElementById('artSec').scrollIntoView({block:'start',behavior:'smooth'}),120);},
  auto:()=>{selectTab('work');setTimeout(()=>document.getElementById('autoSec').scrollIntoView({block:'start',behavior:'smooth'}),120);}};
const SYSIDS=Object.keys(SYSGO);
function sysCheck(){
  const Y=S.sys;
  SYSIDS.forEach(id=>{if(Y.seen[id]) return;const hp=HELP.find(x=>x.id===id);let ok=false;try{ok=hp?hp.u():false;}catch(e){}if(!ok) return;Y.seen[id]=1;if(Y.init) introQ.push(id);});
  if(!Y.init){Y.init=1;introQ=[];}
  showIntro();
}
function anyOverlay(){return !!document.querySelector('.overlay:not([hidden])')||!document.getElementById('startOv').hidden;}
function showIntro(){
  if(introCur||!introQ.length||anyOverlay()) return;
  const id=introQ.shift(),hp=HELP.find(x=>x.id===id);if(!hp) return;introCur=id;
  document.getElementById('introBody').innerHTML='<div class="intro-ico">'+art(hp.ic)+'</div><p class="intro-k">'+tt('Neu freigeschaltet','Newly unlocked')+'</p><h2>'+tx(hp.t)+'</h2><p>'+tx(hp.d)+'</p><div class="btns c"><button type="button" class="btn primary" data-in="go">'+tt('Zeig es mir','Show me')+'</button><button type="button" class="btn" data-in="ok">'+tt('Später','Later')+'</button></div>';
  introOv.hidden=false;snd('star');
  const b=introOv.querySelector('[data-in="go"]');if(b) b.focus();
}
function closeIntro(go){const id=introCur;introOv.hidden=true;introCur=null;if(go&&SYSGO[id]){SYSGO[id]();render();}setTimeout(showIntro,600);}
introOv.addEventListener('click',e=>{const b=e.target.closest('[data-in]');if(b) closeIntro(b.dataset.in==='go');else if(e.target===introOv) closeIntro(false);});

/* --- Aufstieg-Tab in Bereiche teilen --- */
let ascSub='asc';
const ASUBS=[['asc','Aufstieg','Ascend',()=>true],['tree','Baum','Tree',()=>true],['reb','Wiedergeburt','Rebirth',()=>HELP.find(x=>x.id==='reb').u()],['cos','Kosmisch','Cosmic',()=>HELP.find(x=>x.id==='cos').u()],['par','Paragon','Paragon',()=>parUnl()],['rank','Rang','Rank',()=>S.eg.ascT>=1]];
let ascSubSig='';
function updAscSub(){
  const ok={};ASUBS.forEach(a=>{try{ok[a[0]]=a[3]();}catch(e){ok[a[0]]=false;}});
  if(!ok[ascSub]) ascSub='asc';
  const sig=LANG+'|'+ascSub+'|'+JSON.stringify(ok);if(sig===ascSubSig) return;ascSubSig=sig;
  const sg=document.getElementById('ascSeg');
  sg.innerHTML=ASUBS.filter(a=>ok[a[0]]).map(a=>'<button type="button" data-as="'+a[0]+'" aria-pressed="'+(a[0]===ascSub)+'">'+tt(a[1],a[2])+'</button>').join('');
  sg.hidden=ASUBS.filter(a=>ok[a[0]]).length<2;
  document.querySelectorAll('#ascPane .asub').forEach(s=>{s.hidden=s.dataset.asub!==ascSub;});
  rebSig='';egLast=0;
}
document.getElementById('ascSeg').addEventListener('click',e=>{const b=e.target.closest('[data-as]');if(!b) return;ascSub=b.dataset.as;ascSubSig='';updAscSub();if(ascSub==='tree') setTimeout(()=>{treeSig='';TV.s=.6;tCenter('root');render();},30);render();});

/* --- Klick-Effekte auf eigener Zeichenfläche --- */
const fxc=document.createElement('canvas');fxc.id='fxc';fxc.setAttribute('aria-hidden','true');document.body.appendChild(fxc);
const FX={p:[],r:[],g:fxc.getContext('2d'),run:false,last:0};
function fxStart(){if(FX.run) return;FX.run=true;FX.last=performance.now();requestAnimationFrame(fxLoop);}
function fxLoop(ts){
  const dt=Math.min(.05,Math.max(0,(ts-FX.last)/1000));FX.last=ts;
  const dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;
  if(fxc.width!==Math.round(W*dpr)||fxc.height!==Math.round(H*dpr)){fxc.width=Math.round(W*dpr);fxc.height=Math.round(H*dpr);}
  const g=FX.g;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  for(let i=FX.p.length-1;i>=0;i--){
    const p=FX.p[i];p.t+=dt;if(p.t>=p.l){FX.p.splice(i,1);continue;}
    p.vy+=p.gr*dt;p.vx*=1-1.5*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;
    const k=p.t/p.l;g.save();g.globalAlpha=k<.7?1:1-(k-.7)/.3;g.translate(p.x,p.y);g.rotate(p.a);
    if(p.k===0){g.fillStyle=p.c;g.beginPath();g.moveTo(-p.s,-p.s*.6);g.lineTo(p.s*.8,-p.s);g.lineTo(p.s,p.s*.5);g.lineTo(-p.s*.4,p.s);g.closePath();g.fill();g.strokeStyle='rgba(59,36,22,.55)';g.lineWidth=1;g.stroke();}
    else if(p.k===1){g.fillStyle='#4b2a16';g.beginPath();g.arc(0,0,p.s,0,Math.PI*2);g.fill();}
    else{const s=p.s*(1-k*.5);g.fillStyle=p.c;g.beginPath();g.moveTo(0,-s);g.quadraticCurveTo(0,0,s,0);g.quadraticCurveTo(0,0,0,s);g.quadraticCurveTo(0,0,-s,0);g.quadraticCurveTo(0,0,0,-s);g.fill();}
    g.restore();
  }
  for(let i=FX.r.length-1;i>=0;i--){const r=FX.r[i];r.t+=dt;if(r.t>=r.l){FX.r.splice(i,1);continue;}const k=r.t/r.l,e=1-Math.pow(1-k,3);g.globalAlpha=(1-k)*.85;g.strokeStyle=r.c;g.lineWidth=r.w*(1-k)+1;g.beginPath();g.arc(r.x,r.y,r.r0+e*r.r1,0,Math.PI*2);g.stroke();}
  g.globalAlpha=1;
  if(FX.p.length||FX.r.length) requestAnimationFrame(fxLoop);else{FX.run=false;g.clearRect(0,0,W,H);}
}
const CRC=['#e3a24c','#d9953f','#f6cf80','#b87725','#c98a4b'];
function fxCrumbs(x,y,n,spd){for(let i=0;i<n&&FX.p.length<300;i++){const a=rand(-Math.PI*.95,-Math.PI*.05),v=rand(120,300)*(spd||1);FX.p.push({k:Math.random()<.25?1:0,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,gr:900,a:rand(0,6.3),va:rand(-12,12),s:rand(2.5,5.5),c:CRC[Math.floor(Math.random()*CRC.length)],t:0,l:rand(.6,1.1)});}fxStart();}
function fxSparks(x,y,n,col){for(let i=0;i<n&&FX.p.length<300;i++){const a=rand(0,Math.PI*2),v=rand(60,200);FX.p.push({k:2,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,gr:120,a:0,va:rand(-3,3),s:rand(4,8),c:col||'#ffe27a',t:0,l:rand(.45,.8)});}fxStart();}
function fxRing(x,y,col,big){FX.r.push({x,y,r0:big?14:8,r1:big?110:55,w:big?7:4,c:col||'rgba(255,220,120,1)',t:0,l:big?.55:.4});fxStart();}
function clickBurst(x,y,crit){if(!fxOk()) return;fxCrumbs(x,y,crit?16:7,crit?1.4:1);fxSparks(x,y,crit?12:3,crit?'#ff8a5a':'#ffe27a');fxRing(x,y,crit?'#ff8a5a':'rgba(255,225,140,1)',crit);}

/* --- Startbildschirm --- */
const startOv=document.getElementById('startOv');let startDone=false;
function renderStart(){
  const r=awayRep,has=hadSave&&S.all>0;
  document.getElementById('stLogo').innerHTML=(v55Ready&&g3dStartHtml())||cookieSVG(skinOf(),'stc');
  document.getElementById('stTitle').textContent=tt('Keksfabrik','Cookie Factory');
  document.getElementById('stSub').textContent=tt('Backe, baue und erobere das Keks-Universum!','Bake, build and conquer the cookie universe!');
  let c='';
  if(has){
    c=(S.name?'<p class="stway">'+tt('Willkommen zurück, ','Welcome back, ')+escName(S.name)+'!</p>':'')+'<div class="stk"><span>'+tt('Kekse','Cookies')+'</span><b>'+fmt(S.cookies)+'</b></div><div class="stk"><span>'+tt('pro Sekunde','per second')+'</span><b>'+fmtRate(C.kps)+'</b></div><div class="stk"><span>'+tt('Rang','Rank')+'</span><b>'+tx([RANKS[rankIdx()][1],RANKS[rankIdx()][2]])+'</b></div>';
    if(r&&r.gain>0) c+='<p class="stway">'+tt('Während du weg warst: +','While you were away: +')+fmt(r.gain)+' '+tt('Kekse','cookies')+' ('+fmtDur(r.gap)+')</p>';
  }else c='<p class="stway">'+tt('Ein neues Abenteuer wartet. Klick auf den Keks und leg los!','A new adventure awaits. Click the cookie and get started!')+'</p>';
  document.getElementById('stCard').innerHTML=c;
  document.getElementById('stGo').textContent=has?tt('Weiterspielen','Continue'):tt('Spielen!','Play!');
  document.getElementById('stSlots').textContent=tt('Spielstände','Save slots');
  document.getElementById('stSet').textContent=tt('Einstellungen','Settings');
  document.getElementById('stHelp').textContent=tt('Hilfe','Help');
  document.getElementById('stShowL').textContent=tt('Startbildschirm beim Öffnen zeigen','Show start screen when opening');
  document.getElementById('stShow').checked=S.opt.start!==false;
}
let mustName=!hadSave;
function closeStart(then){
  if(mustName&&!S.name){askName({cancel:false},nm=>{mustName=false;S.name=nm;save();showName();closeStart(then);});return;}
  startOv.hidden=true;startDone=true;getCtx();
  if(then) then();
  else if(awayRep&&!awayShown){awayShown=true;setTimeout(()=>showAway(awayRep),250);}
}
let awayShown=false;
document.getElementById('stGo').addEventListener('click',()=>closeStart());
document.getElementById('stSlots').addEventListener('click',()=>closeStart(()=>{openSettings();showSetPane('save');}));
document.getElementById('stSet').addEventListener('click',()=>closeStart(()=>openSettings()));
document.getElementById('stHelp').addEventListener('click',()=>closeStart(()=>openHelp()));
document.getElementById('stShow').addEventListener('change',e=>{S.opt.start=e.target.checked;save();});
