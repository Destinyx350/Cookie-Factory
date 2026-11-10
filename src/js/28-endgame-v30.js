/* ======================= Endgame (V30) ======================= */
function egHas(id){return !!(typeof S!=='undefined'&&S&&S.eg&&S.eg.cos.shop[id]);}
function rankPts(){const E=S.eg;return E.ascT+10*E.rebT+100*E.cos.n;}
function rankIdx(){const p=rankPts();let i=0;RANKS.forEach((r,k)=>{if(p>=r[0]) i=k;});return i;}
function platN(){let n=0;for(const a of A) if(a.plat&&S.ach[a.id]) n++;return n;}
function artVal(a){const T=ARTT.find(x=>x.id===a.t),R=ARTR[a.r];if(!T||!R) return 0;return R.v*T.m*(1+.25*a.g.filter(Boolean).length);}
function mythGear(){let n=0;Object.values(S.hero.gear).forEach(it=>{if(it&&it.r===4) n++;});return n;}
function itemL(k){let L=0;for(const it of ITEMS) if(it.k===k) L+=Math.min(5,S.items[it.id]||0);return L;}
function endgameMods(){
  const r={prod:1,click:1,gold:1,cost:1,chip:1,start:0,bm:null,off:0,goldf:1,buff:1,hero:1,work:1,fr:1,combo:0};
  if(typeof S==='undefined'||!S||!S.eg||!RANKS) return r;
  const E=S.eg;
  r.bm=B.map((b,i)=>E.evo[i]?10:1);
  r.prod*=1+.3*E.cos.sh;
  if(egHas('c_prod')) r.prod*=3;if(egHas('c_click')) r.click*=3;if(egHas('c_gold')) r.gold*=2;if(egHas('c_start')) r.start+=1e12;if(egHas('c_chip')) r.chip*=2;
  const P=E.par.pts,pv=k=>P[k]||0;r.prod*=1+.04*pv('prod');r.click*=1+.08*pv('click');r.gold*=1+.03*pv('gold');r.cost*=Math.max(.75,1-.01*pv('cost'));
  r.off=.02*pv('off');r.goldf=Math.max(.7,1-.01*pv('goldf'));r.buff=1+.02*pv('buff');r.chip*=1+.01*pv('chip');r.hero=1+.03*pv('hero');r.work=1+.04*pv('work');r.fr=1+.03*pv('fr');r.combo=.1*pv('combo');
  r.prod*=1+.05*rankIdx();
  r.prod*=1+.15*platN();
  r.prod*=1+.1*mythGear();
  if(typeof CARDS!=='undefined'&&CARDS){qualMods(r);cardMods(r);}
  E.art.eq.forEach(id=>{const a=E.art.list.find(x=>x.id===id);if(!a) return;const v=artVal(a);if(a.t==='prod') r.prod*=1+v;else if(a.t==='click') r.click*=1+v;else if(a.t==='gold') r.gold*=1+v;else if(a.t==='chip') r.chip*=1+v;});
  return r;
}
const pctTxt=v=>(Math.round(v*1000)/10).toLocaleString(LOC[LANG]);
let egSig='',egLast=0,egArm={k:'',t:0};
const egArmed=k=>egArm.k===k&&Date.now()-egArm.t<4000;
function egConfirm(k){if(!S.opt.ask||egArmed(k)){egArm={k:'',t:0};return true;}egArm={k,t:Date.now()};egLast=0;setTimeout(()=>{if(egArm.k===k){egArm={k:'',t:0};egLast=0;}},4100);return false;}

/* Paragon */
const parNeed=L=>1e24*Math.pow(1.45,L);
function parUnl(){return S.all>=1e27||S.eg.cos.n>0;}
const parFree=()=>S.eg.par.lvl-PARK.reduce((a,k)=>a+(S.eg.par.pts[k[0]]||0),0);
function parTick(){
  const P=S.eg.par;
  if(!parUnl()){P.last=S.all;return;}
  if(!P.on){P.on=1;P.last=S.all;toast(tt('Paragon-Stufen freigeschaltet! Schau im Tab Aufstieg.','Paragon levels unlocked! Look in the Ascension tab.'),true);snd('star');}
  const d=S.all-P.last;P.last=S.all;
  if(d>0&&isFinite(d)) P.xp+=d*(egHas('c_par')?2:1);
  let up=0;while(P.xp>=parNeed(P.lvl)&&up<500){P.xp-=parNeed(P.lvl);P.lvl++;up++;}
  if(!isFinite(P.xp)) P.xp=0;
  if(up){toast(tt('Paragon-Stufe ','Paragon level ')+P.lvl+'! +'+up+' '+tt(up===1?'Punkt':'Punkte',up===1?'point':'points'),true);snd('level');egLast=0;}
}
function parAdd(k,n){const P=S.eg.par,f=parFree();n=Math.min(n,f);{const mx=(PARK.find(x=>x[0]===k)||[])[5];if(mx) n=Math.min(n,mx-(P.pts[k]||0));}if(n<1) return false;P.pts[k]+=n;recalc();egLast=0;return true;}

/* Gebäude-Evolution */
const evoNeed=()=>egHas('c_evo')?250:500;
const evoCost=i=>buyCost(i,1)*5;
function evolve(i){
  const E=S.eg;if(E.evo[i]||S.b[i]<evoNeed()) return false;
  const c=evoCost(i);if(!(S.cookies>=c)) return false;
  S.cookies-=c;E.evo[i]=1;recalc();
  toast(tt('Evolution! Gold-','Evolution! Golden ')+tx(B[i].name)+tt(' produziert jetzt ×10.',' now produces ×10.'),true);snd('star');confetti(50);flash(.4,800);egLast=0;checkAch(false);return true;
}

/* Kosmischer Aufstieg */
const cosGain=()=>S.reb.n>=3&&S.reb.pages>=10?Math.floor(Math.sqrt(S.reb.pages))+(egHas('c_harv')?1:0):0;
const cosFree=()=>S.eg.cos.sh-COSN.reduce((a,n)=>a+(S.eg.cos.shop[n.id]?n.c:0),0);
function cosmicAscend(){
  const g=cosGain();if(g<1) return false;
  const E=S.eg;E.cos.n++;E.cos.sh+=g;
  S.reb={pages:0,n:0,base:S.all,tree:{}};S.chips=0;S.tree={};S.asc=0;treeSig='';rebSig='';
  resetRun(0,null);
  giveFrag(25,'',true);
  toast(tt('Kosmischer Aufstieg! +','Cosmic ascension! +')+g+tt(' Kosmos-Splitter und 25 Artefakt-Splitter',' cosmic shards and 25 artifact shards'),true);
  setTimeout(()=>{confetti(160);shake();},200);flash(.95,1800);snd('star');egLast=0;checkAch(false);return true;
}
function cosBuy(id){const n=COSN.find(x=>x.id===id),E=S.eg;if(!n||E.cos.shop[id]||cosFree()<n.c) return false;E.cos.shop[id]=1;recalc();upSig='';egLast=0;toast(tt('Kosmisch gelernt: ','Cosmic learned: ')+tx(n.n),true);snd('ach');return true;}

/* Artefakte */
function artUnl(){const a=S.eg.art;return S.all>=1e15||a.frag>0||a.list.length>0;}
function giveFrag(n,src,silent){const a=S.eg.art;a.frag+=n;egLast=0;if(!silent) toast(tt('Artefakt-Splitter +','Artifact shards +')+n+(src?' · '+src:''),n>=3);}
const artName=a=>tx(ARTT.find(x=>x.id===a.t).n);
function forgeArt(prem,forceR){
  const A2=S.eg.art,c=prem?30:10;
  if(forceR===undefined){if(A2.frag<c||A2.list.length>=24) return null;A2.frag-=c;}
  else if(A2.list.length>=24) return null;
  let k=forceR||1;
  if(!forceR){const W=prem?[0,0,60,30,10]:[0,55,30,12,3];let r=Math.random()*100;for(let i=1;i<5;i++){r-=W[i];if(r<0){k=i;break;}}}
  const t=ARTT[Math.floor(Math.random()*ARTT.length)].id;
  const a={id:A2.nid++,t,r:k,g:Array(ARTR[k].s).fill(0)};A2.list.push(a);A2.forged++;
  if(A2.eq.length<3) A2.eq.push(a.id);
  recalc();egLast=0;
  toast(tt('Geschmiedet: ','Forged: ')+artName(a)+' ('+tx(ARTR[k].n)+')',k>=3);
  if(k===4){confetti(60);flash(.5,900);snd('star');}else snd('claim');
  checkAch(false);return a;
}
function artSock(id){const a=S.eg.art.list.find(x=>x.id===id);if(!a) return false;const i=a.g.indexOf(0);if(i<0) return false;const c=40*(i+1);if(S.w.mat.gem<c) return false;S.w.mat.gem-=c;a.g[i]=1;recalc();egLast=0;snd('buy');return true;}
function artEq(id){const A2=S.eg.art,k=A2.eq.indexOf(id);if(k>=0) A2.eq.splice(k,1);else{if(A2.eq.length>=3) return false;A2.eq.push(id);}recalc();egLast=0;return true;}
function artMelt(id){const A2=S.eg.art,k=A2.list.findIndex(x=>x.id===id);if(k<0) return false;const a=A2.list[k];A2.list.splice(k,1);A2.eq=A2.eq.filter(x=>x!==id);A2.frag+=ARTR[a.r].melt;recalc();egLast=0;toast(tt('Zerlegt: +','Melted: +')+ARTR[a.r].melt+tt(' Artefakt-Splitter',' artifact shards'));return true;}

/* Automatik-Zentrale */
function autoUnl(){return S.eg.ascT>=3||S.eg.cos.n>0;}
function autoLog(txt){const L=S.eg.auto.log;L.unshift({t:Date.now(),x:txt});if(L.length>8) L.length=8;egLast=0;}
function autoTick(){
  const U=S.eg.auto,on=U.on;if(!autoUnl()) return;
  if(on.gold&&goldEl&&!goldEl.classList.contains('fade')){goldEl.click();autoLog(tt('Goldkeks geklickt','Golden cookie clicked'));}
  if(on.claim&&goalsReady()){if(claimAll()) autoLog(tt('Belohnungen abgeholt','Rewards claimed'));}
  if(on.wheel&&wheelFree()&&S.wheel.pend<0&&!wheelBusy){if(spinWheel(false)) autoLog(tt('Glücksrad gedreht','Lucky wheel spun'));}
  if(on.adv&&tabUnl('adv')&&!S.hero.run){regenSta();if(S.hero.sta>=staMax()){let d=0;DUNG.forEach((x,k)=>{if(S.hero.lvl>=x.lvl) d=k;});if(advStart('d',d)) autoLog(tt('Abenteuer gestartet: ','Adventure started: ')+tx(DUNG[d].n));}}
  if(on.reb&&rebGain()>=Math.max(1,U.reb)){const g=rebGain();rebirth();autoLog(tt('Wiedergeburt: +','Rebirth: +')+g+tt(' Seiten',' pages'));return;}
  if(on.asc&&S.runT>=U.ascMin*60){const g=chipsPotential();if(g>0&&g>=Math.max(1,S.chips*U.asc/100)){doAscend();autoLog(tt('Aufstieg: +','Ascension: +')+g+tt(' Himmelschips',' heavenly chips'));}}
}

/* Takt */
let egTickT=0,egAcc=0;
function egTick(dt){
  if(!S.eg) return;
  const per=(S.admin.ac||0)+2*itemL('m_auto');
  if(per>0){egAcc+=per*dt;const n=Math.floor(egAcc);if(n>0){egAcc-=n;const g=C.click*n;addCk(g);S.clicks+=n;}}
  const now=Date.now();if(now-egTickT<1000) return;egTickT=now;
  parTick();autoTick();
}
function critRoll(){const L=itemL('m_crit');return L>0&&Math.random()<.04*L;}

/* Oberfläche */
const egEls={rank:document.getElementById('egRank'),cos:document.getElementById('egCos'),par:document.getElementById('egPar'),evo:document.getElementById('evoBox'),evoF:document.getElementById('evoF'),evoH:document.getElementById('evoH'),art:document.getElementById('artSec'),auto:document.getElementById('autoSec')};
document.getElementById('cookieStage').insertAdjacentHTML('afterbegin','<div class="rkring" aria-hidden="true"></div>');
function rankBadge(i,big){const R=RANKS[i];return '<span class="rkb'+(big?' big':'')+'" style="--rk:'+R[3]+'">'+(i?(i<8?['','I','II','III','IV','V','VI','VII'][i]:i===8?'★':['','','','','','','','','','M','K','G','E','∞'][i]):'–')+'</span>';}
function rankR(){
  const E=S.eg,ri=rankIdx(),pts=rankPts(),nx=RANKS[ri+1];let h='',live={},wid={};
  h+='<section class="wsec"><h2>'+tt('Prestige-Rang','Prestige rank')+'</h2><div class="rkcard">'+rankBadge(ri,1)+'<div><b>'+tx([RANKS[ri][1],RANKS[ri][2]])+'</b><span class="sub">'+tt('Rangpunkte: ','Rank points: ')+fmt(pts)+(nx?' · '+tt('Nächster Rang: ','Next rank: ')+tx([nx[1],nx[2]])+tt(' bei ',' at ')+fmt(nx[0]):' · '+tt('Höchster Rang!','Highest rank!'))+'</span><span class="obar"><i data-w="rk"></i></span></div></div>'
    +'<div class="rklist">'+RANKS.slice(1).map((R,k)=>'<span class="rkchip'+(ri>=k+1?' on':'')+'" style="--rk:'+R[3]+'">'+rankBadge(k+1)+tx([R[1],R[2]])+' <small>'+fmt(R[0])+'</small></span>').join('')+'</div>'
    +'<p class="small wnote">'+tt('Punkte = Aufstiege + 10 × Wiedergeburten + 100 × Kosmische Aufstiege. Jeder Rang gibt +5 % Produktion und einen neuen Rahmen um den Keks.','Points = ascensions + 10 × rebirths + 100 × cosmic ascensions. Every rank gives +5% production and a new frame around the cookie.')+' '+tt('Bonus jetzt: ','Bonus now: ')+'<b>+'+(ri*5)+' %</b></p></section>';
  wid.rk=nx?Math.min(100,(pts-RANKS[ri][0])/(nx[0]-RANKS[ri][0])*100):100;
  return {html:h,live,wid};
}
function cosR(){
  const E=S.eg;let h='',live={},wid={};
  const g=cosGain(),free=cosFree(),arm=egArmed('cos');
  h+='<section class="wsec cosmic"><h2>'+tt('Kosmischer Aufstieg','Cosmic ascension')+'</h2><p class="lead">'+tt('Die dritte Prestige-Stufe. Ab 3 Wiedergeburten und 10 Rezeptseiten kannst du ins All aufsteigen. Du bekommst Kosmos-Splitter: Jeder gibt dauerhaft +30 % Produktion. Freie Splitter tauschst du gegen kosmische Kräfte.','The third prestige layer. From 3 rebirths and 10 recipe pages you can rise into space. You get cosmic shards: each one gives +30% production forever. Spend free shards on cosmic powers.')+'</p>'
    +'<dl class="kv"><dt>'+tt('Kosmos-Splitter','Cosmic shards')+'</dt><dd>'+E.cos.sh+' ('+free+' '+tt('frei','free')+')</dd><dt>'+tt('Bonus durch Splitter','Bonus from shards')+'</dt><dd>+'+fmt(E.cos.sh*30)+' %</dd><dt>'+tt('Kosmische Aufstiege','Cosmic ascensions')+'</dt><dd>'+E.cos.n+'</dd><dt>'+tt('Jetzt: Wiedergeburten / Seiten','Now: rebirths / pages')+'</dt><dd>'+S.reb.n+' / 3 · '+S.reb.pages+' / 10</dd></dl>'
    +'<button type="button" class="btn primary'+(g<1?' dis':'')+(arm?' armed':'')+'" data-eg="cos:go">'+(arm?tt('Sicher? Nochmal klicken','Sure? Click again'):g<1?tt('Braucht 3 Wiedergeburten und 10 Seiten','Needs 3 rebirths and 10 pages'):tt('Kosmischer Aufstieg: +','Cosmic ascension: +')+g+tt(' Splitter',' shards'))+'</button>'
    +'<p class="small" style="margin-top:8px">'+tt('Setzt Wiedergeburten, Rezeptseiten, Himmelschips, den Baum und alles von einem Aufstieg zurück. Erfolge, Titel, Abzeichen, Gegenstände, Welt, Held, Helfer, Evolutionen, Paragon und Artefakte bleiben. Du bekommst außerdem 25 Artefakt-Splitter.','Resets rebirths, recipe pages, heavenly chips, the tree and everything from an ascension. Achievements, titles, badges, items, world, hero, helpers, evolutions, paragon and artifacts stay. You also get 25 artifact shards.')+'</p>'
    +'<h3 class="wt" style="margin-top:14px">'+tt('Kosmische Kräfte','Cosmic powers')+'</h3><div class="igrid">'+COSN.map(n=>{const has=!!E.cos.shop[n.id],ok=!has&&free>=n.c;return '<div class="scard'+(has?' own':'')+'"><span class="ico">'+art(n.ic)+'</span><span class="info"><span class="nm"><span>'+tx(n.n)+'</span></span><span class="sub">'+tx(n.d)+'</span>'+(has?'<span class="own-t">'+tt('Aktiv','Active')+'</span>':'<button type="button" class="btn sm cost'+(ok?' primary':' dis')+'" data-eg="cbuy:'+n.id+'">'+n.c+' '+tt(n.c===1?'Splitter':'Splitter',n.c===1?'shard':'shards')+'</button>')+'</span></div>';}).join('')+'</div></section>';
  return {html:h,live,wid};
}
function parR(){
  const E=S.eg;let h='',live={},wid={};
  const P=E.par;
  h+='<section class="wsec"><h2>'+tt('Paragon-Stufen','Paragon levels')+'</h2>';
  if(!parUnl()){
    const pr=Math.max(0,Math.min(100,(Math.log10(Math.max(1,S.all))/27)*100));wid.par=pr;
    h+='<p class="lead">'+tt('Unendliche Stufen für das späte Spiel. Sie öffnen sich bei 10^27 Kekse insgesamt oder nach dem ersten Kosmischen Aufstieg.','Endless levels for the late game. They open at 10^27 cookies in total or after the first cosmic ascension.')+'</p><span class="obar big"><i data-w="par"></i></span><p class="small" style="margin-top:6px">'+fmt(S.all)+' / '+fmt(1e27)+'</p>';
  }else{
    const need=parNeed(P.lvl),fr=parFree();wid.par=Math.min(100,P.xp/need*100);live.parxp=fmt(P.xp)+' / '+fmt(need)+tt(' Kekse',' cookies');
    h+='<p class="lead">'+tt('Jeder gebackene Keks gibt Paragon-Erfahrung. Jede Stufe gibt 1 Punkt, den du frei verteilst. Zurücksetzen ist gratis.','Every baked cookie gives paragon experience. Every level gives 1 point that you spend freely. Resetting is free.')+'</p>'
      +'<div class="rkcard"><span class="rkb big" style="--rk:#c38bff">'+P.lvl+'</span><div><b>'+tt('Paragon-Stufe ','Paragon level ')+P.lvl+'</b><span class="sub" data-l="parxp"></span><span class="obar"><i data-w="par"></i></span></div></div>'
      +'<p class="small" style="margin:8px 0">'+tt('Freie Punkte: ','Free points: ')+'<b>'+fr+'</b></p><div class="pargrid">'
      +PARK.map(([k,de,en,per,ic,cap,unit])=>{const v=P.pts[k]||0,mx=cap||Infinity,val=unit==='x'?'+'+(Math.round(per*v*10)/10).toLocaleString(LOC[LANG])+'× Combo':(per>0?'+':'−')+Math.abs(Math.round(per*v*10)/10).toLocaleString(LOC[LANG])+' %';return '<div class="parrow"><span class="ico">'+art(ic)+'</span><span><b>'+tt(de,en)+'</b><span class="sub">'+v+tt(' Punkte',' points')+' · '+val+(cap?tt(' (höchstens '+cap+')',' (max '+cap+')'):'')+'</span></span><span class="btns"><button type="button" class="btn sm'+(fr<1||v>=mx?' dis':'')+'" data-eg="par:'+k+':1">+1</button><button type="button" class="btn sm'+(fr<1||v>=mx?' dis':'')+'" data-eg="par:'+k+':10">+10</button></span></div>';}).join('')
      +'</div><div class="btns" style="margin-top:8px"><button type="button" class="btn sm" data-eg="par:reset">'+tt('Punkte zurücksetzen','Reset points')+'</button></div>';
  }
  h+='</section>';
  return {html:h,live,wid};
}
function updEvo(){
  const any=B.some((b,i)=>S.b[i]>=250||S.eg.evo[i]);
  egEls.evoF.hidden=!any;if(!any) return;
  const n=Object.keys(S.eg.evo).length,need=evoNeed();
  setTxt(egEls.evoH,tt('Gebäude-Evolution','Building evolution')+' ('+n+' / '+B.length+')');
  if(!egEls.evoF.open) return;
  let h='<p class="small wnote">'+tt('Ab '+need+' Stück kann ein Gebäude zur Gold-Version werden. Sie produziert dauerhaft ×10, auch nach jedem Aufstieg.','From '+need+' owned a building can become its golden version. It produces ×10 forever, even after every ascension.')+'</p><div class="list">';
  B.forEach((b,i)=>{
    const ev=!!S.eg.evo[i],own=S.b[i],c=ev?0:evoCost(i),ok=!ev&&own>=need&&S.cookies>=c;
    h+='<div class="wcard'+(ev?' evo':'')+'"><span class="ico">'+art('b'+i)+'</span><span class="info"><span class="nm"><span>'+(ev?tt('Gold-','Golden ')+tx(b.name):tx(b.name))+'</span></span><span class="sub">'+(ev?tt('Entwickelt · ×10 Produktion','Evolved · ×10 production'):fmt(own)+' / '+need+tt(' Stück',' owned'))+'</span></span><span class="oact">'+(ev?'<b class="wk-on">★</b>':'<button type="button" class="btn sm'+(ok?' primary':' dis')+'" data-eg="evo:'+i+'">'+(own>=need?tt('Entwickeln: ','Evolve: ')+fmt(c):tt('Gesperrt','Locked'))+'</button>')+'</span></div>';
  });
  mount(egEls.evo,{html:h+'</div>',live:{},wid:{}},{});
}
function artR(){
  const A2=S.eg.art;let h='<h3 class="wt">'+tt('Artefakt-Schmiede','Artifact forge')+'</h3><p class="small wnote">'+tt('Sammle Artefakt-Splitter und schmiede daraus mächtige Artefakte. Du kannst 3 Artefakte gleichzeitig tragen. Fülle Sockel mit Edelsteinen für +25 % je Sockel.','Collect artifact shards and forge powerful artifacts. You can wear 3 artifacts at once. Fill sockets with gems for +25% each.')+'</p>'
    +'<div class="mats"><span class="mat">'+art('box')+tt('Artefakt-Splitter','Artifact shards')+': <b>'+A2.frag+'</b></span><span class="mat">'+matName('gem')+': <b>'+Math.floor(S.w.mat.gem)+'</b></span><span class="mat">'+tt('Getragen','Worn')+': <b>'+A2.eq.length+' / 3</b></span></div>'
    +'<div class="btns"><button type="button" class="btn primary'+(A2.frag<10?' dis':'')+'" data-eg="art:forge">'+tt('Schmieden: 10 Splitter','Forge: 10 shards')+'</button><button type="button" class="btn'+(A2.frag<30?' dis':'')+'" data-eg="art:prem">'+tt('Meister-Schmieden: 30 Splitter (mind. Episch)','Master forge: 30 shards (epic or better)')+'</button></div>'
    +'<p class="small" style="margin-top:6px">'+tt('Chancen: Selten 55 %, Episch 30 %, Legendär 12 %, Mythisch 3 %. Meister: Episch 60 %, Legendär 30 %, Mythisch 10 %.','Chances: rare 55%, epic 30%, legendary 12%, mythic 3%. Master: epic 60%, legendary 30%, mythic 10%.')+'</p>';
  if(A2.list.length) h+='<div class="igrid" style="margin-top:10px">'+A2.list.map(a=>{const R=ARTR[a.r],T=ARTT.find(x=>x.id===a.t),eq=A2.eq.includes(a.id),fi=a.g.indexOf(0),mk='melt'+a.id,arm=egArmed(mk);
    return '<div class="icard art r'+a.r+(eq?' eq':'')+'" style="--rc:'+R.c+'"><span class="ico">'+art(T.ic)+'</span><span class="info"><span class="nm"><span>'+tx(T.n)+'</span></span><span class="sub" style="color:var(--rc)">'+tx(R.n)+(eq?' · '+tt('getragen','worn'):'')+'</span><span class="sub">'+tx(T.d)+' +'+pctTxt(artVal(a))+' %</span><span class="socks">'+a.g.map(x=>'<i class="'+(x?'on':'')+'"></i>').join('')+'</span>'
      +'<span class="btns" style="margin-top:6px;gap:5px"><button type="button" class="btn sm'+(eq?'':' primary')+(!eq&&A2.eq.length>=3?' dis':'')+'" data-eg="art:eq:'+a.id+'">'+(eq?tt('Ablegen','Unequip'):tt('Tragen','Wear'))+'</button>'+(fi>=0?'<button type="button" class="btn sm'+(S.w.mat.gem<40*(fi+1)?' dis':'')+'" data-eg="art:sock:'+a.id+'">'+tt('Sockel: ','Socket: ')+(40*(fi+1))+' '+matName('gem')+'</button>':'')+'<button type="button" class="btn sm'+(arm?' armed':'')+'" data-eg="art:melt:'+a.id+'">'+(arm?tt('Sicher?','Sure?'):tt('Zerlegen +','Melt +')+R.melt)+'</button></span></span></div>';}).join('')+'</div>';
  h+='<details class="fold" style="margin-top:10px"><summary class="wt">'+tt('So findest du Splitter','How to find shards')+'</summary><ul class="earn small"><li><b>'+tt('Goldkeks','Golden cookie')+'</b>: 4 %</li><li><b>'+tt('Monster','Monsters')+'</b>: 15 %</li><li><b>'+tt('Expeditionen','Expeditions')+'</b>: 35 %</li><li><b>'+tt('Zerlegen','Melting')+'</b>: '+tt('3–25 je Artefakt','3–25 per artifact')+'</li><li><b>'+tt('Kosmischer Aufstieg','Cosmic ascension')+'</b>: +25</li></ul></details>';
  return {html:h,live:{},wid:{}};
}
function autoR(){
  const U=S.eg.auto;let h='<h3 class="wt">'+tt('Automatik-Zentrale','Automation center')+'</h3><p class="small wnote">'+tt('Schalte Regeln an, dann erledigt das Spiel diese Dinge von selbst – auch wenn du nicht hinschaust.','Turn rules on and the game does these things by itself – even when you are not watching.')+'</p><div class="list">';
  AUTOR.forEach(([k,de,en,dde,den])=>{
    const on=!!U.on[k];let ex='';
    if(k==='asc') ex='<span class="setrow" style="margin-top:6px"><span class="small">'+tt('Wenn neue Chips ≥','When new chips ≥')+'</span><span class="seg">'+[50,100,200,500].map(v=>'<button type="button" data-eg="auto:asc:'+v+'" aria-pressed="'+(U.asc===v)+'">'+v+' %</button>').join('')+'</span><span class="small">'+tt('Runde mind.','Run at least')+'</span><span class="seg">'+[1,5,15,30].map(v=>'<button type="button" data-eg="auto:min:'+v+'" aria-pressed="'+(U.ascMin===v)+'">'+v+' min</button>').join('')+'</span></span>';
    if(k==='reb') ex='<span class="setrow" style="margin-top:6px"><span class="small">'+tt('Ab Seiten:','From pages:')+'</span><span class="seg">'+[1,3,5,10].map(v=>'<button type="button" data-eg="auto:reb:'+v+'" aria-pressed="'+(U.reb===v)+'">'+v+'</button>').join('')+'</span></span>';
    h+='<div class="wcard"><span class="ico">'+art({asc:'star',reb:'book',wheel:'lucky',claim:'coin',gold:'gold',adv:'flame'}[k])+'</span><span class="info"><span class="nm"><span>'+tt(de,en)+'</span></span><span class="sub">'+tt(dde,den)+'</span>'+ex+'</span><span class="oact"><button type="button" class="btn sm tgl" aria-pressed="'+on+'" data-eg="auto:tog:'+k+'">'+(on?tt('An','On'):tt('Aus','Off'))+'</button></span></div>';
  });
  h+='</div>';
  if(U.log.length) h+='<h3 class="wt" style="margin-top:12px">'+tt('Zuletzt erledigt','Recently done')+'</h3><div class="wlog">'+U.log.map(l=>'<div class="wle"><span class="ico">'+art('timer')+'</span><span>'+l.x+'</span><time>'+agoTxt(l.t)+'</time></div>').join('')+'</div>';
  return {html:h,live:{},wid:{}};
}
function updEG(){
  if(!S.eg) return;
  {const st=document.getElementById('cookieStage'),k=String(rankIdx());if(st.dataset.rk!==k) st.dataset.rk=k;}
  const now=Date.now();if(now-egLast<400) return;egLast=now;
  if(!panes.asc.hidden){if(ascSub==='rank') mount(egEls.rank,rankR(),{});else if(ascSub==='cos') mount(egEls.cos,cosR(),{});else if(ascSub==='par') mount(egEls.par,parR(),{});}
  if(!panes.build.hidden) updEvo();
  const au=artUnl();egEls.art.hidden=!au;if(au&&!panes.shop.hidden) mount(egEls.art,artR(),{});
  const ou=autoUnl();egEls.auto.hidden=!ou;if(ou&&!panes.work.hidden) mount(egEls.auto,autoR(),{});
}
function egClick(e){
  const b=e.target.closest('[data-eg]');if(!b) return;
  const p=b.dataset.eg.split(':');let ok=true;
  if(p[0]==='cos'){if(cosGain()<1) ok=false;else if(egConfirm('cos')) ok=cosmicAscend();}
  else if(p[0]==='cbuy') ok=cosBuy(p[1]);
  else if(p[0]==='par'){if(p[1]==='reset'){PARK.forEach(k=>{S.eg.par.pts[k[0]]=0;});recalc();}else ok=parAdd(p[1],+p[2]);}
  else if(p[0]==='evo') ok=evolve(+p[1]);
  else if(p[0]==='art'){
    if(p[1]==='forge') ok=!!forgeArt(false);
    else if(p[1]==='prem') ok=!!forgeArt(true);
    else if(p[1]==='eq') ok=artEq(+p[2]);
    else if(p[1]==='sock') ok=artSock(+p[2]);
    else if(p[1]==='melt'){if(egConfirm('melt'+p[2])) ok=artMelt(+p[2]);}
  }else if(p[0]==='auto'){
    const U=S.eg.auto;
    if(p[1]==='tog'){if(U.on[p[2]]) delete U.on[p[2]];else U.on[p[2]]=1;}
    else if(p[1]==='asc') U.asc=+p[2];else if(p[1]==='min') U.ascMin=+p[2];else if(p[1]==='reb') U.reb=+p[2];
  }
  egLast=0;if(!ok) nope(b);render();save();
}
['egRank','egCos','egPar','evoBox','artSec','autoSec'].forEach(id=>document.getElementById(id).addEventListener('click',egClick));
