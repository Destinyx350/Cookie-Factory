/* ===== Endgame-Daten (V30) ===== */
RAR.mythic={w:.35,n:['Mythisch','Mythic']};
ITEMS.push(
  {id:'m_heart',rar:'mythic',art:'amulet',k:'m_all',v:.12,name:['Kosmisches Herz','Cosmic Heart'],tpl:['Produktion und Klicks +{x} %.','Production and clicks +{x}%.']},
  {id:'m_hammer',rar:'mythic',art:'flame',k:'m_crit',v:.04,name:['Sternenschmiede-Hammer','Star Forge Hammer'],tpl:['{x} % Chance auf einen Krit-Klick ×20.','{x}% chance for a critical click ×20.']},
  {id:'m_oven',rar:'mythic',art:'b2',k:'m_auto',v:.02,name:['Ewiger Ofen','Eternal Oven'],tpl:['Klickt {x}-mal pro Sekunde von selbst.','Clicks {x} times per second by itself.']},
  {id:'m_compass',rar:'mythic',art:'gold',k:'m_gold',v:.1,name:['Goldener Kompass','Golden Compass'],tpl:['Goldkekse +{x} % stärker und öfter.','Golden cookies +{x}% stronger and more often.']}
);
var RANKS=[[0,'Ohne Rang','Unranked','#7d8794'],[5,'Bronze','Bronze','#c98a4b'],[20,'Silber','Silver','#c7d0d9'],[50,'Gold','Gold','#f1b24a'],[120,'Platin','Platinum','#7fe0e0'],[250,'Diamant','Diamond','#8fd3ff'],[500,'Meister','Master','#c38bff'],[1000,'Großmeister','Grandmaster','#ff6b8a'],[2000,'Legende','Legend','#ffd700'],[4000,'Mythisch','Mythic','#ff5ad8'],[8000,'Kosmisch','Cosmic','#7a5cff'],[15000,'Göttlich','Divine','#fff3b0'],[30000,'Ewig','Eternal','#5affd8'],[60000,'Unendlich','Infinite','#ffffff']];
var COSN=[
  {id:'c_prod',c:1,ic:'spark',n:['Sternenstaub','Stardust'],d:['Produktion ×3.','Production ×3.']},
  {id:'c_click',c:1,ic:'hand',n:['Sternenfinger','Star Fingers'],d:['Klicks ×10.','Clicks ×10.']},
  {id:'c_chip',c:2,ic:'star',n:['Himmelsnebel','Heaven Nebula'],d:['Himmelschips wirken doppelt.','Heavenly chips work twice as well.']},
  {id:'c_pages',c:2,ic:'book',n:['Kosmisches Rezept','Cosmic Recipe'],d:['Rezeptseiten wirken doppelt.','Recipe pages work twice as well.']},
  {id:'c_start',c:2,ic:'pantry',n:['Urknall-Start','Big Bang Start'],d:['Jeder Aufstieg startet mit 1 Bio Keksen.','Every ascension starts with 1 trillion cookies.']},
  {id:'c_gold',c:3,ic:'gold',n:['Goldene Galaxie','Golden Galaxy'],d:['Goldkekse doppelt so stark.','Golden cookies twice as strong.']},
  {id:'c_keep',c:4,ic:'layers',n:['Ewiges Gedächtnis','Eternal Memory'],d:['Upgrades bleiben beim Aufstieg.','Upgrades stay when you ascend.']},
  {id:'c_evo',c:4,ic:'crown',n:['Evolutions-Kern','Evolution Core'],d:['Gebäude-Evolution schon ab 250 Stück.','Building evolution already at 250.']},
  {id:'c_par',c:5,ic:'infinity',n:['Paragon-Licht','Paragon Light'],d:['Paragon-Erfahrung ×2.','Paragon experience ×2.']},
  {id:'c_harv',c:6,ic:'moon',n:['Kosmische Ernte','Cosmic Harvest'],d:['+1 Kosmos-Splitter bei jedem Kosmischen Aufstieg.','+1 cosmic shard on every cosmic ascension.']}
];
var PARK=[['prod','Produktion','Production',4,'spark'],['click','Klicks','Clicks',8,'hand'],['gold','Goldkekse','Golden cookies',3,'gold'],['cost','Gebäudepreis','Building price',-1,'tag',25],
  ['off','Offline-Ertrag','Offline income',2,'moon',50],['goldf','Goldkeks-Häufigkeit','Golden cookie frequency',1,'magnet',30],['buff','Rausch-Dauer','Frenzy duration',2,'hourglass'],['chip','Himmelschip-Wirkung','Heavenly chip effect',1,'star'],
  ['gem','Edelstein-Fund','Gem finds',3,'amulet'],['hero','Heldenkraft','Hero power',3,'flame'],['work','Helfer-Erfahrung','Helper experience',4,'chef'],['fr','Filialen-Verkauf','Store sales',3,'b6'],
  ['combo','Combo-Maximum','Combo maximum',.1,'timer',20,'x'],['star','Sternenkrümel-Chance','Star crumb chance',2,'lucky']];
var ARTT=[{id:'prod',n:['Kristallkern','Crystal Core'],ic:'spark',d:['Produktion','Production'],m:1},{id:'click',n:['Fingerreliquie','Finger Relic'],ic:'hand',d:['Klicks','Clicks'],m:2},{id:'gold',n:['Goldgral','Golden Grail'],ic:'gold',d:['Goldkeks-Stärke','Golden cookie power'],m:.5},{id:'chip',n:['Himmelsprisma','Heaven Prism'],ic:'star',d:['Himmelschip-Wirkung','Heavenly chip effect'],m:.25}];
var ARTR=[null,{n:['Selten','Rare'],c:'#5aa0d8',v:.2,s:1,melt:3},{n:['Episch','Epic'],c:'#b48cf2',v:.4,s:2,melt:6},{n:['Legendär','Legendary'],c:'#f1b24a',v:.8,s:2,melt:12},{n:['Mythisch','Mythic'],c:'#ff5ad8',v:1.5,s:3,melt:25}];
var AUTOR=[['asc','Auto-Aufstieg','Auto ascend','Steigt auf, wenn genug Himmelschips warten.','Ascends when enough heavenly chips are waiting.'],['reb','Auto-Wiedergeburt','Auto rebirth','Wird wiedergeboren, sobald genug Rezeptseiten warten.','Rebirths as soon as enough recipe pages are waiting.'],['wheel','Auto-Glücksrad','Auto lucky wheel','Dreht das Glücksrad, wenn es gratis ist.','Spins the lucky wheel when it is free.'],['claim','Auto-Abholen','Auto claim','Holt Tagesaufgaben, Login und Pass ab.','Claims daily tasks, login and pass.'],['gold','Auto-Goldkeks','Auto golden cookie','Klickt jeden Goldkeks sofort.','Clicks every golden cookie right away.'],['adv','Auto-Abenteuer','Auto adventure','Startet das beste Abenteuer, wenn die Ausdauer voll ist.','Starts the best adventure when stamina is full.']];
[['p_ck','Keks-Unendlichkeit','Cookie Infinity','Backe insgesamt 10^33 Kekse.','Bake 10^33 cookies in total.',()=>S.all>=1e33],
 ['p_1000','Tausender-Club','Thousand Club','Besitze 1.000 Stück eines Gebäudes.','Own 1,000 of one building.',()=>S.b.some(x=>x>=1000)],
 ['p_asc','Himmelsfürst','Prince of Heaven','Steige insgesamt 100-mal auf.','Ascend 100 times in total.',()=>S.eg.ascT>=100],
 ['p_reb','Ewiger Kreislauf','Eternal Cycle','Werde insgesamt 25-mal wiedergeboren.','Be reborn 25 times in total.',()=>S.eg.rebT>=25],
 ['p_cos','Kosmonaut','Cosmonaut','Mach einen Kosmischen Aufstieg.','Do a cosmic ascension.',()=>S.eg.cos.n>=1],
 ['p_par','Paragon-Legende','Paragon Legend','Erreiche Paragon-Stufe 100.','Reach paragon level 100.',()=>S.eg.par.lvl>=100],
 ['p_evo','Goldene Fabrik','Golden Factory','Entwickle 10 Gebäude.','Evolve 10 buildings.',()=>Object.keys(S.eg.evo).length>=10],
 ['p_myth','Mythen-Sammler','Myth Collector','Besitze ein mythisches Artefakt und einen mythischen Gegenstand.','Own a mythic artifact and a mythic item.',()=>S.eg.art.list.some(a=>a.r===4)&&ITEMS.some(i=>i.rar==='mythic'&&S.items[i.id])],
 ['p_gold','Goldkeks-Gott','Golden Cookie God','Klicke 2.500 Goldkekse.','Click 2,500 golden cookies.',()=>S.gold>=2500],
 ['p_hero','Ewiger Held','Eternal Hero','Bring deinen Helden auf Stufe 100.','Bring your hero to level 100.',()=>S.hero.lvl>=100]
].forEach(([id,de,en,dde,den,t])=>A.push({id,plat:1,name:['Platin: '+de,'Platinum: '+en],desc:()=>tt(dde+' Belohnung: Produktion +15 %.',den+' Reward: production +15%.'),test:()=>!!(S.eg&&t())}));
const freshEG=()=>({ascT:0,rebT:0,evo:{},cos:{n:0,sh:0,shop:{}},par:{xp:0,lvl:0,last:0,on:0,pts:Object.fromEntries(PARK.map(k=>[k[0],0]))},art:{frag:0,list:[],eq:[],nid:1,forged:0},auto:{on:{},asc:100,ascMin:5,reb:1,log:[]}});
function sanEG(o,s){
  const num=(v,d)=>(typeof v==='number'&&isFinite(v)&&v>=0)?v:(d||0);
  const E=freshEG();
  if(!o||typeof o!=='object'){E.ascT=s.asc||0;E.rebT=(s.reb&&s.reb.n)||0;return E;}
  const I=(v,mx)=>Math.max(0,Math.min(mx||1e9,Math.floor(num(v,0))));
  E.ascT=I(o.ascT);E.rebT=I(o.rebT);
  if(o.evo&&typeof o.evo==='object') B.forEach((_,i)=>{if(o.evo[i]) E.evo[i]=1;});
  if(o.cos&&typeof o.cos==='object'){E.cos.n=I(o.cos.n);E.cos.sh=I(o.cos.sh);if(o.cos.shop&&typeof o.cos.shop==='object') COSN.forEach(n=>{if(o.cos.shop[n.id]) E.cos.shop[n.id]=1;});}
  if(o.par&&typeof o.par==='object'){const p=o.par;E.par.xp=Math.max(0,num(p.xp,0));if(!isFinite(E.par.xp)) E.par.xp=0;E.par.lvl=I(p.lvl,1e6);E.par.last=Math.max(0,num(p.last,0));E.par.on=p.on?1:0;if(p.pts&&typeof p.pts==='object') PARK.forEach(k=>{E.par.pts[k[0]]=I(p.pts[k[0]],1e6);});
    let used=PARK.reduce((a,k)=>a+E.par.pts[k[0]],0);if(used>E.par.lvl) PARK.forEach(k=>{E.par.pts[k[0]]=0;});
    PARK.forEach(k=>{if(k[5]&&E.par.pts[k[0]]>k[5]) E.par.pts[k[0]]=k[5];});}
  if(o.art&&typeof o.art==='object'){const a=o.art;E.art.frag=I(a.frag);E.art.forged=I(a.forged);E.art.nid=Math.max(1,I(a.nid));
    if(Array.isArray(a.list)) a.list.slice(0,24).forEach(x=>{if(!x||typeof x!=='object') return;const r=I(x.r,4);if(r<1||!ARTT.some(t=>t.id===x.t)) return;const g=Array(ARTR[r].s).fill(0);if(Array.isArray(x.g)) g.forEach((_,k)=>{g[k]=x.g[k]?1:0;});const id=Math.max(1,I(x.id));E.art.list.push({id,t:x.t,r,g});if(id>=E.art.nid) E.art.nid=id+1;});
    if(Array.isArray(a.eq)) a.eq.forEach(id=>{if(E.art.eq.length<3&&E.art.list.some(x=>x.id===id)&&!E.art.eq.includes(id)) E.art.eq.push(id);});}
  if(o.auto&&typeof o.auto==='object'){const u=o.auto;if(u.on&&typeof u.on==='object') AUTOR.forEach(r=>{if(u.on[r[0]]) E.auto.on[r[0]]=1;});if([50,100,200,500].includes(u.asc)) E.auto.asc=u.asc;if([1,5,15,30].includes(u.ascMin)) E.auto.ascMin=u.ascMin;if([1,3,5,10].includes(u.reb)) E.auto.reb=u.reb;
    if(Array.isArray(u.log)) u.log.slice(0,8).forEach(l=>{if(l&&typeof l.x==='string') E.auto.log.push({t:num(l.t,0),x:l.x.slice(0,80)});});}
  return E;
}
