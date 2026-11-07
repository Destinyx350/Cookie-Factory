/* ======================= Boosts, Items, Designs, News ======================= */
const BUFFIDS=['g_build','frenzy','clickfrenzy','b_sugar','b_turbo','b_sale','b_magnet','s_click','s_sale','s_time'];
const BOX_UNLOCK=1e8;
const BOOSTS=[
  {id:'sugar',buff:'b_sugar',art:'sugar',unlock:1e7,cd:420,dur:45,sec:30,min:2000,name:['Zuckerschub','Sugar Rush'],label:['Zuckerschub ×2','Sugar Rush ×2'],desc:['Produktion ×2 für {d} Sekunden.','Production ×2 for {d} seconds.']},
  {id:'turbo',buff:'b_turbo',art:'hand',unlock:1e7,cd:300,dur:30,sec:15,min:1000,name:['Klick-Turbo','Click Turbo'],label:['Klick-Turbo ×3','Click Turbo ×3'],desc:['Klicks zählen ×3 für {d} Sekunden.','Clicks count ×3 for {d} seconds.']},
  {id:'sale',buff:'b_sale',art:'tag',unlock:1e9,cd:420,dur:45,sec:30,min:5000,name:['Rabattaktion','Flash Sale'],label:['Rabatt −15 %','Sale −15%'],desc:['Gebäude kosten {d} Sekunden lang 15 % weniger.','Buildings cost 15% less for {d} seconds.']},
  {id:'magnet',buff:'b_magnet',art:'magnet',unlock:1e10,cd:1200,dur:90,sec:90,min:10000,name:['Keksmagnet','Cookie Magnet'],label:['Keksmagnet','Cookie Magnet'],desc:['Goldkekse erscheinen {d} Sekunden lang doppelt so oft.','Golden cookies appear twice as often for {d} seconds.']},
  {id:'goldb',art:'gold',unlock:1e11,cd:1200,sec:250,min:20000,name:['Goldener Ofen','Golden Oven'],desc:['Ein Goldkeks erscheint sofort.','A golden cookie appears right away.']},
  {id:'cap',art:'hourglass',unlock:1e12,cd:1800,sec:240,min:50000,name:['Zeitkapsel','Time Capsule'],desc:['Sofort die Produktion von 5 Minuten.','Instantly gives 5 minutes of production.']},
  {id:'chill',art:'fridge',unlock:1e13,cd:3600,sec:600,min:100000,name:['Kühlschrank','Fridge'],desc:['Alle anderen Boosts sind sofort wieder bereit.','All other boosts are ready again right away.']},
  {id:'wmana',world:1,art:'jar',unlock:5e7,cd:900,sec:120,min:20000,name:['Mana-Trank','Mana Potion'],desc:['Füllt dein Mana sofort ganz auf.','Refills your mana completely.']},
  {id:'wmon',world:1,art:'flame',unlock:1e8,cd:600,sec:100,min:20000,name:['Monsterruf','Monster Call'],desc:['Ein Monster erscheint sofort.','A monster appears right away.']},
  {id:'wgrow',world:1,art:'drop',unlock:1e8,cd:1200,sec:150,min:30000,name:['Düngerregen','Fertilizer Rain'],desc:['Alle wachsenden Pflanzen brauchen nur noch die halbe Restzeit.','All growing plants need only half of their remaining time.']},
  {id:'wexp',world:1,art:'spark',unlock:1e9,cd:1800,sec:200,min:100000,name:['Expeditionswind','Expedition Wind'],desc:['Alle laufenden Expeditionen brauchen nur noch die halbe Restzeit.','All running expeditions need only half of their remaining time.']},
  {id:'wegg',world:1,art:'amulet',unlock:1e10,cd:2400,sec:250,min:300000,name:['Eierwärmer','Egg Warmer'],desc:['Das brütende Ei braucht 60 % weniger Restzeit.','The hatching egg needs 60% less remaining time.']},
  {id:'wevent',world:1,art:'crown',unlock:1e11,cd:3600,sec:400,min:1000000,name:['Ereignis rufen','Call Event'],desc:['Ein zufälliges Ereignis startet sofort.','A random event starts right away.']}
];
const WORKERS=[
  {id:'builder',art:'b2',unlock:1000,cost:5000,xp:1,n:['Bauleiter','Site Manager'],d:['Kauft Gebäude mit dem besten Preis-Leistungs-Verhältnis.','Buys the buildings with the best value.'],lv:[['Kauft bis zu 20 Gebäude auf einmal statt 8.','Buys up to 20 buildings at once instead of 8.'],['Gebäude 2 % billiger.','Buildings 2% cheaper.']]},
  {id:'research',art:'therm',unlock:1e6,cost:5e6,xp:15,n:['Forscher','Researcher'],d:['Startet automatisch die nächste Forschung im Labor.','Starts the next lab research automatically.'],lv:[['Forschung 15 % schneller.','Research 15% faster.'],['Forschung 30 % schneller.','Research 30% faster.']]},
  {id:'catcher',xp:10,art:'gold',unlock:1e7,cost:2e7,n:['Goldkeks-Fänger','Gold Catcher'],d:['Fängt Goldkekse, wenn sie 2 Sekunden liegen bleiben. Bei diesen Fängen gibt es keine Sternenkrümel.','Catches golden cookies that stay for 2 seconds. These catches give no star crumbs.'],lv:[['Fängt schon nach 1 Sekunde.','Catches after 1 second.'],['Goldkekse kommen 5 % öfter.','Golden cookies come 5% more often.']]},
  {id:'orders',xp:8,art:'scroll',unlock:1e7,cost:5e7,n:['Auftragsbüro','Order Office'],d:['Nimmt Back-Aufträge an, die sich von selbst schaffen lassen.','Accepts baking orders that can be done on their own.'],lv:[['Aufträge geben 10 % mehr Kekse.','Orders give 10% more cookies.'],['Aufträge geben 25 % mehr Kekse.','Orders give 25% more cookies.']]},
  {id:'boostm',xp:8,art:'timer',unlock:1e8,cost:3e8,n:['Boost-Meister','Boost Master'],d:['Nutzt Zuckerschub, Keksmagnet, Goldenen Ofen und Zeitkapsel, sobald sie bereit sind.','Uses Sugar Rush, Cookie Magnet, Golden Oven and Time Capsule as soon as they are ready.'],lv:[['Boosts laden 10 % schneller.','Boosts recharge 10% faster.'],['Boosts laden 20 % schneller.','Boosts recharge 20% faster.']]},
  {id:'mage',xp:5,art:'book',unlock:1e8,cost:2e8,n:['Zauberlehrling','Apprentice Mage'],d:['Wirkt den gewählten Zauber, sobald das Mana voll ist.','Casts the chosen spell as soon as mana is full.'],lv:[['Höchstens +20 Mana.','+20 max mana.'],['Mana lädt 20 % schneller.','Mana regenerates 20% faster.']]},
  {id:'hunter',xp:10,art:'flame',unlock:1e8,cost:5e8,n:['Monsterjäger','Monster Hunter'],d:['Kämpft gegen jedes Monster, das auftaucht.','Fights every monster that appears.'],lv:[['Schlägt doppelt so oft zu.','Hits twice as often.'],['Monster geben 20 % mehr Belohnung.','Monsters give 20% more reward.']]},
  {id:'garden',xp:3,art:'sack',unlock:1e9,cost:2e9,n:['Gärtner','Gardener'],d:['Pflanzt die im Tab Welt gewählte Pflanze auf leere Beete.','Plants the plant chosen in the World tab on empty plots.'],lv:[['Pflanzen wachsen 10 % schneller.','Plants grow 10% faster.'],['+1 Kraut bei jeder Ernte.','+1 herb per harvest.']]},
  {id:'broker',xp:2,art:'coin',unlock:1e9,cost:5e9,n:['Börsenmakler','Stock Broker'],d:['Kauft Aktien, wenn sie billig sind, und verkauft sie mit Gewinn.','Buys stocks when they are cheap and sells them for a profit.'],lv:[['Handelt mutiger und kauft 3 Aktien auf einmal.','Trades more boldly and buys 3 shares at once.'],['Börsengebühr halbiert.','Stock fee halved.']]},
  {id:'exped',xp:10,art:'moon',unlock:1e10,cost:2e10,n:['Expeditionsleiter','Expedition Leader'],d:['Schickt Expeditionen zum gewählten Ziel los, sobald ein Platz frei ist.','Sends expeditions to the chosen destination as soon as a slot is free.'],lv:[['Expeditionen scheitern 25 % seltener.','Expeditions fail 25% less often.'],['+2 Edelsteine pro Expedition.','+2 gems per expedition.']]},
  {id:'adventurer',art:'mitt',unlock:1e7,cost:5e7,xp:10,n:['Abenteurer','Adventurer'],d:['Schickt den Helden in den schwersten Dungeon, den er schafft, wenn er Ausdauer hat.','Sends the hero into the hardest dungeon he can clear whenever he has stamina.'],lv:[['Der Held bekommt 20 % mehr XP.','The hero gets 20% more XP.'],['Der Held heilt zwischen Räumen 40 % statt 25 %.','The hero heals 40% instead of 25% between rooms.']]},
  {id:'manager',art:'crown',unlock:1e8,cost:1e9,xp:4,n:['Betriebsleiter','Operations Manager'],d:['Nimmt jeden Auftrag an, hilft bei Klick- und Kauf-Aufträgen und kauft Upgrades, die in dein Budget passen.','Accepts every order, helps with click and buy orders and buys upgrades that fit your budget.'],lv:[['Hilft doppelt so schnell bei Klick-Aufträgen.','Helps twice as fast with click orders.'],['Kauft bis zu 12 Upgrades auf einmal statt 4.','Buys up to 12 upgrades at once instead of 4.']]},
  {id:'supplier',art:'sack',unlock:1e9,cost:1e10,xp:1,n:['Lieferant','Supplier'],d:['Füllt die Lager der Filialen auf, wenn sie halb leer sind.','Refills the store stocks when they are half empty.'],lv:[['Füllt schon bei 70 % auf.','Refills at 70% already.'],['Filialen verkaufen 10 % mehr.','Stores sell 10% more.']]}
];
const BUDGETS=[10,25,50,100];
const WNAMES=['Anna','Ben','Clara','David','Emma','Felix','Greta','Hannes','Ida','Jonas','Klara','Leon','Mia','Noah','Olga','Paul','Rosa','Simon','Theo','Ute','Vera','Wilma','Xaver','Yvonne','Zoe','Lukas','Sophie','Elias','Lena','Moritz','Resi','Sepp'];
const TRAITS=[
  {id:'diligent',n:['Fleißig','Diligent'],d:['+25 % Erfahrung.','+25% experience.']},
  {id:'talent',n:['Talentiert','Talented'],d:['Boni schon ab Stufe 2 und 5.','Bonuses from levels 2 and 5.']},
  {id:'cheer',n:['Fröhlich','Cheerful'],d:['+1 % Produktion, solange er arbeitet.','+1% production while working.']},
  {id:'ambit',n:['Ehrgeizig','Ambitious'],d:['Meister-Bonus +10 % statt +5 %.','Master bonus +10% instead of +5%.']},
  {id:'lucky',n:['Glückspilz','Lucky'],d:['15 % Chance auf doppelte Erfahrung.','15% chance of double experience.']}
];
const FACEC={skin:['#f1c9a5','#e8b894','#f6d3b3','#c98d62','#8d5a3c','#ffdcc0'],hair:['#4b2a16','#1f1a17','#e0a04a','#d5dade','#a34a2a','#6b4a2a','#2a2a40'],shirt:['#d9573f','#3e6aa8','#6bbf6a','#f2b92e','#8a63d2','#3fb8b0','#e0566f'],style:['short','long','bun','cap','toque','hat']};
function genFace(){const p=a=>a[Math.floor(Math.random()*a.length)];return {nm:p(WNAMES),skin:p(FACEC.skin),hair:p(FACEC.hair),shirt:p(FACEC.shirt),style:p(FACEC.style),glasses:Math.random()<.25?1:0,stache:Math.random()<.2?1:0,tr:p(TRAITS).id};}
function sanFace(f){
  if(!f||typeof f!=='object') return null;
  const hx=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
  if(!hx(f.skin)||!hx(f.hair)||!hx(f.shirt)||!FACEC.style.includes(f.style)||!TRAITS.some(t=>t.id===f.tr)||typeof f.nm!=='string') return null;
  return {nm:f.nm.slice(0,16),skin:f.skin,hair:f.hair,shirt:f.shirt,style:f.style,glasses:f.glasses?1:0,stache:f.stache?1:0,tr:f.tr};
}
const MS=[25,50,100,150,200,300,400,500,600,700,800,900,1000];
const PHASES=[
  {id:'morning',from:6,to:11,n:['Morgen','Morning'],d:['Klicks +10 %','Clicks +10%'],click:1.1},
  {id:'noon',from:11,to:17,n:['Mittag','Midday'],d:['Produktion +5 %','Production +5%'],prod:1.05},
  {id:'evening',from:17,to:22,n:['Abend','Evening'],d:['Goldkekse 10 % öfter','Golden cookies 10% more often'],gold:.9},
  {id:'night',from:22,to:30,n:['Nacht','Night'],d:['Mana lädt 20 % schneller, Monster geben 20 % mehr','Mana regenerates 20% faster, monsters give 20% more'],mana:.2,mon:1.2}
];
const WEATHER=[
  {id:'sun',w:30,n:['Sonnig','Sunny'],d:['Produktion +3 %','Production +3%'],prod:1.03},
  {id:'rain',w:20,n:['Regen','Rain'],d:['Pflanzen wachsen 25 % schneller','Plants grow 25% faster'],grow:.75},
  {id:'storm',w:10,n:['Gewitter','Thunderstorm'],d:['Goldkekse 15 % öfter','Golden cookies 15% more often'],gold:.85},
  {id:'snow',w:12,n:['Schnee','Snow'],d:['Boosts halten 20 % länger','Boosts last 20% longer'],dur:1.2},
  {id:'fog',w:12,n:['Nebel','Fog'],d:['Expeditionen 15 % kürzer','Expeditions 15% shorter'],exp:.85},
  {id:'wind',w:12,n:['Wind','Wind'],d:['Filialen verkaufen 10 % mehr','Stores sell 10% more'],fr:1.1},
  {id:'rainbow',w:4,n:['Regenbogen','Rainbow'],d:['Produktion und Klicks +10 %','Production and clicks +10%'],prod:1.1,click:1.1}
];
const COS={g_pink:['Rosa Glasur','Pink glaze'],t_star:['Sternstreusel','Star sprinkles'],d_galaxy:['Galaxie-Teig','Galaxy dough'],g_rainbow:['Regenbogen-Glasur','Rainbow glaze'],t_gold:['Goldflocken','Gold flakes'],c_heart:['Herz-Stückchen','Heart chips']};
const PASSR=[{c:600},{gem:3},{tooth:10},{c:1200},{cos:'g_pink'},{egg:1},{herb:10},{c:1800},{gem:5},{star:1},
  {box:1},{c:2400},{tooth:20},{gem:8},{cos:'t_star'},{egg:1},{c:3600},{herb:20},{box:1},{star:1},
  {gem:12},{c:5400},{cos:'d_galaxy'},{egg:1},{cos:'g_rainbow'},{c:7200},{gem:20},{box:1},{cos:'t_gold'},{star:1,cos:'c_heart'}];
const PASS_PP=50;
const VISITORS=[
  {id:'trader',n:['Händlerin Frieda','Trader Frieda'],look:{skin:'#f1c9a5',hair:'#a34a2a',shirt:'#3fb8b0',style:'hat',glasses:0,stache:0},txt:['„Ich tausche 25 Kräuter gegen 10 Edelsteine. Interesse?“','“I trade 25 herbs for 10 gems. Interested?”'],
   ch:[{t:['Tauschen (10 Edelsteine)','Trade (10 gems)'],ok:()=>S.w.mat.gem>=10,do:()=>{S.w.mat.gem-=10;addMat('herb',25);return tt('+25 Kräuter','+25 herbs');}},{t:['Nein danke','No thanks']}]},
  {id:'witch',n:['Hexe Walburga','Witch Walburga'],look:{skin:'#c8e0b0',hair:'#2a2a40',shirt:'#8a63d2',style:'long',glasses:0,stache:0},txt:['„Mein Trank macht deine Öfen doppelt so schnell. Nur 5 Kräuter! Oder probier den riskanten …“','“My potion makes your ovens twice as fast. Only 5 herbs! Or try the risky one …”'],
   ch:[{t:['Trinken (5 Kräuter)','Drink (5 herbs)'],ok:()=>S.w.mat.herb>=5,do:()=>{S.w.mat.herb-=5;addBuff('b_sugar',60);return tt('Produktion ×2 für 60 Sekunden','Production ×2 for 60 seconds');}},
       {t:['Riskanter Trank (gratis)','Risky potion (free)'],do:()=>{if(Math.random()<.5){addBuff('frenzy',30);return tt('Glück! Produktion ×7 für 30 Sekunden','Lucky! Production ×7 for 30 seconds');}const l=Math.floor(S.cookies*.05);S.cookies-=l;return tt('Bäh! Du verlierst ','Yuck! You lose ')+fmt(l)+tt(' Kekse',' cookies');}},{t:['Nein danke','No thanks']}]},
  {id:'critic',n:['Kritiker Herr Fein','Critic Mr. Fine'],look:{skin:'#e8b894',hair:'#1f1a17',shirt:'#2a3640',style:'short',glasses:1,stache:1},txt:['„Ich schreibe über die besten Bäckereien. Zeig mir deine Kekse!“','“I write about the best bakeries. Show me your cookies!”'],
   ch:[{t:['Beste Kekse zeigen (2 % deiner Kekse)','Show your best cookies (2% of your cookies)'],do:()=>{S.cookies-=S.cookies*.02;addPP(15);S.orders.rep+=5;recalc();return tt('Tolle Kritik! +15 Pass-Punkte, +5 Ruf','Great review! +15 pass points, +5 reputation');}},{t:['Lieber nicht','Rather not']}]},
  {id:'wanderer',n:['Wanderer Ole','Wanderer Ole'],look:{skin:'#c98d62',hair:'#6b4a2a',shirt:'#6bbf6a',style:'cap',glasses:0,stache:1},txt:['„Ich habe ein seltsames Ei gefunden. 8 Edelsteine und es gehört dir.“','“I found a strange egg. 8 gems and it is yours.”'],
   ch:[{t:['Kaufen (8 Edelsteine)','Buy (8 gems)'],ok:()=>S.w.mat.gem>=8,do:()=>{S.w.mat.gem-=8;S.w.pet.eggs++;return tt('+1 Ei','+1 egg');}},{t:['Nein danke','No thanks']}]},
  {id:'mayor',n:['Bürgermeisterin Huber','Mayor Huber'],look:{skin:'#f6d3b3',hair:'#d5dade',shirt:'#d9573f',style:'bun',glasses:1,stache:0},txt:['„Die Stadt feiert ein Fest! Spendest du 1 % deiner Kekse?“','“The town is having a festival! Will you donate 1% of your cookies?”'],
   ch:[{t:['Spenden','Donate'],do:()=>{S.cookies-=S.cookies*.01;addBuff('b_turbo',60);S.orders.rep+=3;recalc();return tt('Danke! Klicks ×3 für 60 Sekunden, +3 Ruf','Thanks! Clicks ×3 for 60 seconds, +3 reputation');}},{t:['Nicht jetzt','Not now']}]},
  {id:'gambler',n:['Spieler Gustl','Gambler Gustl'],look:{skin:'#e8b894',hair:'#4b2a16',shirt:'#f2b92e',style:'hat',glasses:0,stache:1},txt:['„Kopf oder Zahl? Ich setze 5 % deiner Kekse dagegen.“','“Heads or tails? I bet 5% of your cookies.”'],
   ch:[{t:['Kopf','Heads'],do:()=>visCoin()},{t:['Zahl','Tails'],do:()=>visCoin()},{t:['Kein Interesse','Not interested']}]},
  {id:'smith',n:['Schmied Rudi','Smith Rudi'],look:{skin:'#c98d62',hair:'#1f1a17',shirt:'#6b4a2a',style:'short',glasses:0,stache:1},txt:['„Ich verbessere ein Stück deiner Ausrüstung. Gratis, ich habe heute gute Laune!“','“I will improve one piece of your gear. Free, I am in a good mood today!”'],
   ch:[{t:['Gern!','Sure!'],do:()=>{const its=Object.values(S.hero.gear).filter(it=>it&&(it.up||0)<10);if(its.length){const it=its[Math.floor(Math.random()*its.length)];it.up=(it.up||0)+1;recalc();return tt('Veredelt: ','Refined: ')+itemName(it);}addMat('tooth',10);return tt('Keine Ausrüstung? Dann nimm 10 Monsterzähne.','No gear? Then take 10 monster teeth.');}},{t:['Nein danke','No thanks']}]},
  {id:'kid',n:['Kleine Mia','Little Mia'],look:{skin:'#ffdcc0',hair:'#e0a04a',shirt:'#e0566f',style:'long',glasses:0,stache:0},txt:['„Darf ich einen Keks haben? Bitte, bitte!“','“May I have a cookie? Please, please!”'],
   ch:[{t:['Klar! (1 Keks)','Sure! (1 cookie)'],do:()=>{S.cookies=Math.max(0,S.cookies-1);addPP(10);S.sec.kid=(S.sec.kid||0)+1;return tt('Mia strahlt. +10 Pass-Punkte','Mia beams. +10 pass points');}},{t:['Nein','No'],do:()=>tt('Mia geht traurig weg.','Mia walks away sadly.')}]}
];
const DOUGHS=[
  {n:['Klassisch','Classic'],c:['#f6cf80','#e3a24c','#b87725'],stroke:'#8f5a1b',speck:'#b97a2a'},
  {n:['Schoko','Chocolate'],c:['#8a5a3c','#5e3822','#3a2012'],stroke:'#24120a',speck:'#2a1509'},
  {n:['Vanille','Vanilla'],c:['#fff3d6','#f3dca8','#d9b878'],stroke:'#a8864a',speck:'#c9a868'},
  {n:['Matcha','Matcha'],c:['#c5e3a0','#8fbf6a','#5c8f42'],stroke:'#3d6a2c',speck:'#4e8035'},
  {n:['Erdbeere','Strawberry'],c:['#ffc2cf','#f08ca4','#c9567a'],stroke:'#933655',speck:'#b3466a'},
  {n:['Galaxie','Galaxy'],c:['#9be7ff','#6a5bd8','#2a1a6a'],stroke:'#160c40',speck:'#d8c8ff',cos:'d_galaxy'}
];
const CHIPS=[
  {n:['Schoko','Chocolate'],chip:'#4b2a16',chipS:'#34190b',hi:'#7a4a2a'},
  {n:['Weiße Schoko','White chocolate'],chip:'#f4e8d2',chipS:'#c9b793',hi:'#ffffff'},
  {n:['Karamell','Caramel'],chip:'#d08a3a',chipS:'#9a5c1c',hi:'#ffd59a'},
  {n:['Keine','None'],none:1},
  {n:['Herzen','Hearts'],heart:1,chip:'#e0566f',chipS:'#9e2f45',hi:'#ffb3c2',cos:'c_heart'}
];
const GLAZES=[
  {n:['Keine','None']},
  {n:['Weiß','White'],col:'#fff7ec'},
  {n:['Schoko','Chocolate'],col:'#4a2615'},
  {n:['Rosa','Pink'],col:'#f7a1c0',cos:'g_pink'},
  {n:['Regenbogen','Rainbow'],rainbow:1,cos:'g_rainbow'}
];
const TOPS=[
  {n:['Keine','None']},
  {n:['Bunte Streusel','Sprinkles'],cols:['#e0566f','#5aa0d8','#7fd69b','#f1d36a','#b48cf2']},
  {n:['Zucker','Sugar'],cols:['#ffffff','#f3f3f3'],sugar:1},
  {n:['Sternstreusel','Star sprinkles'],star:1,cols:['#ffd36a','#fff1b0'],cos:'t_star'},
  {n:['Goldflocken','Gold flakes'],flake:1,cols:['#f1c46a','#e0a030','#fff0b0'],cos:'t_gold'}
];
const TUT=[
  {n:['Klicke 15-mal auf den großen Keks.','Click the big cookie 15 times.'],art:'hand',p:()=>[S.clicks,15],r:30,w:['Jeder Klick backt einen Keks. So fängt deine Fabrik an.','Every click bakes a cookie. This is how your factory starts.']},
  {n:['Kaufe deinen ersten Teigfinger.','Buy your first Dough Finger.'],art:'b0',p:()=>[S.b[0],1],r:20,w:['Gebäude backen von allein, auch wenn du nicht klickst.','Buildings bake on their own, even when you do not click.']},
  {n:['Kaufe 5 Teigfinger.','Buy 5 Dough Fingers.'],art:'b0',p:()=>[S.b[0],5],r:80,w:['Jedes Gebäude kostet etwas mehr als das letzte, backt aber immer weiter.','Each building costs a bit more than the last, but keeps on baking.']},
  {n:['Kaufe eine Oma.','Buy a Granny.'],art:'b1',p:()=>[S.b[1],1],r:150,w:['Neue Gebäude-Arten backen viel mehr als die alten.','New kinds of buildings bake much more than the old ones.']},
  {n:['Kaufe dein erstes Upgrade im Tab Upgrades.','Buy your first upgrade in the Upgrades tab.'],art:'spark',p:()=>[Object.keys(S.up).length,1],r:300,w:['Upgrades kosten nur einmal und wirken für immer in dieser Runde.','Upgrades cost only once and work for the whole run.']},
  {n:['Erreiche 10 Kekse pro Sekunde.','Reach 10 cookies per second.'],art:'timer',p:()=>[C.kps,10],r:600,w:['Kekse pro Sekunde zeigen, wie schnell deine Fabrik backt.','Cookies per second show how fast your factory bakes.']},
  {n:['Fange einen Goldkeks, wenn einer auftaucht.','Catch a golden cookie when one appears.'],art:'gold',p:()=>[S.gold,1],r:60,sec:1,w:['Goldkekse geben dir kurz einen großen Bonus. Sei schnell!','Golden cookies give you a big bonus for a short time. Be quick!']},
  {n:['Schaffe einen Kundenauftrag im Tab Aufträge.','Complete a customer order in the Orders tab.'],art:'scroll',p:()=>[S.orders.done,1],r:120,sec:1,w:['Aufträge geben viele Kekse und Ruf. Ruf erhöht deine Produktion.','Orders give lots of cookies and reputation. Reputation raises your production.']},
  {n:['Hole eine Belohnung im Tab Ziele ab.','Claim a reward in the Goals tab.'],art:'box',p:()=>[(S.day.lc||S.day.total)?1:0,1],r:120,sec:1,w:['Im Tab Ziele warten jeden Tag neue Belohnungen.','New rewards wait in the Goals tab every day.']},
  {n:['Besiege ein Monster im Tab Welt.','Beat a monster in the World tab.'],art:'flame',p:()=>[S.w.mon.k,1],r:180,sec:1,w:['Monster besiegst du mit Klicks. Sie geben Belohnungen.','You beat monsters with clicks. They give rewards.']},
  {n:['Wirke einen Zauber im Zauberbuch (Tab Welt).','Cast a spell in the spellbook (World tab).'],art:'book',p:()=>[S.w.casts,1],r:180,sec:1,w:['Zauber geben dir kurze, starke Boni.','Spells give you short, strong boosts.']},
  {n:['Pflanze etwas im Garten (Tab Welt).','Plant something in the garden (World tab).'],art:'drop',p:()=>[S.w.gar.plots.some(Boolean)?1:0,1],r:180,sec:1,w:['Pflanzen wachsen mit der Zeit und geben Boni.','Plants grow over time and give bonuses.']},
  {n:['Backe insgesamt 1 Million Kekse.','Bake 1 million cookies in total.'],art:'cookie',p:()=>[S.all,1e6],r:300,sec:1,w:['Mit mehr Keksen öffnen sich neue Bereiche im Spiel.','With more cookies, new parts of the game open up.']},
  {n:['Stelle deinen ersten Helfer ein (Tab Helfer).','Hire your first helper (Helpers tab).'],art:'chef',p:()=>[Object.keys(S.work.hired).length,1],r:600,sec:1,w:['Helfer arbeiten für dich und werden mit der Zeit besser.','Helpers work for you and get better over time.']},
  {n:['Steige zum ersten Mal auf (Tab Aufstieg).','Ascend for the first time (Ascension tab).'],art:'star',p:()=>[S.asc+S.reb.n,1],r:0,star:1,w:['Du fängst neu an, bekommst aber Himmelschips für dauerhafte Boni.','You start over, but get heavenly chips for permanent bonuses.']}
];
const DUNG=[
  {id:'d1',n:['Krümelkeller','Crumb Cellar'],lvl:1,pw:1,col:'#a0764a'},
  {id:'d2',n:['Zuckerhöhle','Sugar Cave'],lvl:6,pw:3,col:'#f2a6c4'},
  {id:'d3',n:['Schokominen','Chocolate Mines'],lvl:14,pw:9,col:'#7a4a2a'},
  {id:'d4',n:['Lebkuchenburg','Gingerbread Castle'],lvl:26,pw:27,col:'#c0763a'},
  {id:'d5',n:['Sternengewölbe','Star Vault'],lvl:40,pw:81,col:'#8a63d2'}
];
const SKILLS=[
  {id:'ds',art:'flame',n:['Doppelschlag','Double Strike'],d:['+10 % Angriff pro Stufe.','+10% attack per rank.']},
  {id:'crit',art:'spark',n:['Volltreffer','Critical Hit'],d:['+5 % Chance auf doppelten Schaden pro Stufe.','+5% chance of double damage per rank.']},
  {id:'heal',art:'drop',n:['Heilung','Healing'],d:['Heilt im Kampf 1 % Leben pro Sekunde pro Stufe.','Heals 1% health per second per rank in fights.']},
  {id:'iron',art:'mitt',n:['Eisenhaut','Iron Skin'],d:['Nimmt 6 % weniger Schaden pro Stufe.','Takes 6% less damage per rank.']},
  {id:'loot',art:'box',n:['Beutejäger','Loot Hunter'],d:['+8 % Beute-Chance in Räumen pro Stufe.','+8% loot chance in rooms per rank.']},
  {id:'gold',art:'coin',n:['Schatzsucher','Treasure Seeker'],d:['+15 % Kekse aus Dungeons und Turm pro Stufe.','+15% cookies from dungeons and the tower per rank.']}
];
const RARN=[['Gewöhnlich','Common'],['Selten','Rare'],['Episch','Epic'],['Legendär','Legendary'],['Mythisch','Mythic']];
const RARC=['#9fb0bb','#5aa0d8','#b48cf2','#f1b24a','#ff6b8b'];
const GEARN={w:[['Nudelholz','Rolling Pin'],['Schneebesen','Whisk'],['Kuchengabel','Cake Fork'],['Tortenheber','Cake Server'],['Zuckerschwert','Sugar Sword']],
  a:[['Schürze','Apron'],['Ofenhandschuh-Rüstung','Oven Mitt Armor'],['Backblech-Panzer','Baking Tray Plate'],['Lebkuchen-Rüstung','Gingerbread Armor'],['Sternenmantel','Star Cloak']],
  t:[['Krümel-Anhänger','Crumb Pendant'],['Zuckerring','Sugar Ring'],['Schokoamulett','Chocolate Amulet'],['Goldkeks-Kette','Golden Cookie Chain'],['Sternenherz','Star Heart']]};
const SLOTS=[['w',['Waffe','Weapon'],'rolling'],['a',['Rüstung','Armor'],'mitt'],['t',['Amulett','Amulet'],'amulet']];
const CITIES=[
  {id:'sbg',p:1e8,n:['Salzburg','Salzburg'],o:90,sr:.06,mar:.3,col:'#c94b4b'},
  {id:'linz',p:5e8,n:['Linz','Linz'],o:180,sr:.085,mar:.35,col:'#5aa0d8'},
  {id:'ibk',p:2e9,n:['Innsbruck','Innsbruck'],o:360,sr:.1,mar:.4,col:'#5fbf7f'},
  {id:'graz',p:1e10,n:['Graz','Graz'],o:600,sr:.11,mar:.45,col:'#e0a030'},
  {id:'kla',p:5e10,n:['Klagenfurt','Klagenfurt'],o:1000,sr:.13,mar:.5,col:'#3fb8b0'},
  {id:'wien',p:2e11,n:['Wien','Vienna'],o:1600,sr:.13,mar:.6,col:'#9a6ad8'}
];
const UNL={work:1000,build:0,up:0,ach:0,orders:5e3,world:1e4,shop:1e6,adv:1e7,fr:1e9,asc:5e8};
const INF=[
  {id:'p',base:1e12,g:1.6,max:999,n:['Ewige Backkunst','Eternal Baking'],d:['Produktion ×1,05 pro Stufe.','Production ×1.05 per level.']},
  {id:'c',base:1e11,g:1.5,max:999,n:['Ewige Klickkraft','Eternal Click Power'],d:['Klicks ×1,15 pro Stufe.','Clicks ×1.15 per level.']},
  {id:'g',base:1e13,g:1.8,max:50,n:['Ewiges Gold','Eternal Gold'],d:['Goldkekse +3 % stärker pro Stufe (höchstens 50 Stufen).','Golden cookies +3% stronger per level (max 50 levels).']}
];
const QUESTS=[
  {id:'clicks',art:'hand',n:['Klicke den Keks {g}-mal','Click the cookie {g} times'],g:[150,400,800],v:()=>S.clicks},
  {id:'gold',art:'gold',n:['Fange {g} Goldkekse','Catch {g} golden cookies'],g:[2,3,5],v:()=>S.gold},
  {id:'buy',art:'b2',n:['Kaufe {g} Gebäude','Buy {g} buildings'],g:[15,40,80],v:()=>S.bought},
  {id:'mon',art:'flame',n:['Besiege {g} Monster','Beat {g} monsters'],g:[1,3,5],v:()=>S.w.mon.k},
  {id:'ord',art:'scroll',n:['Schaffe {g} Aufträge','Complete {g} orders'],g:[2,3,4],v:()=>S.orders.done},
  {id:'cast',art:'book',n:['Wirke {g} Zauber','Cast {g} spells'],g:[2,4,8],v:()=>S.w.casts},
  {id:'exp',art:'moon',n:['Schließe {g} Expeditionen ab','Finish {g} expeditions'],g:[2,3,4],v:()=>S.w.exp.done},
  {id:'bake',art:'cookie',n:['Backe {g} Kekse','Bake {g} cookies'],g:[600,1800,5400],v:()=>S.all,rel:1}
];
const LOGIN=[{c:600},{c:900},{gem:3},{c:1800},{gem:5,egg:1},{c:3600},{star:1,c:3600}];
const REB=[
  {id:'r_click',c:1,n:['Knusperfinger','Crispy Fingers'],d:['Klicks ×3.','Clicks ×3.']},
  {id:'r_start',c:2,n:['Vorratskammer','Pantry'],d:['Jeder Aufstieg startet mit 10 Mio Keksen.','Every ascension starts with 10 million cookies.']},
  {id:'r_chip',c:2,n:['Himmelsrezept','Heavenly Recipe'],d:['Himmelschips wirken 25 % stärker.','Heavenly chips work 25% stronger.']},
  {id:'r_gold',c:3,n:['Goldene Glasur','Golden Glaze'],d:['Goldkekse kommen 10 % öfter und sind 10 % stärker.','Golden cookies come 10% more often and are 10% stronger.']},
  {id:'r_cost',c:3,n:['Großbäckerei','Big Bakery'],d:['Gebäude 5 % billiger.','Buildings 5% cheaper.']},
  {id:'r_off',c:3,n:['Nachtschicht','Night Shift'],d:['Offline-Ertrag +25 %.','Offline income +25%.']},
  {id:'r_ms',c:5,n:['Meisterbäcker','Master Baker'],d:['Meilensteine geben +25 % statt +15 %.','Milestones give +25% instead of +15%.']},
  {id:'r_star',c:5,n:['Sternenmehl','Star Flour'],d:['+2 Sternenkrümel bei jeder Wiedergeburt.','+2 star crumbs on every rebirth.']},
  {id:'r_asc',c:8,n:['Ewiges Rezept','Eternal Recipe'],d:['Jeder Aufstieg gibt +4 % statt +2 % Produktion.','Every ascension gives +4% instead of +2% production.']},
  {id:'r_gold2',c:5,n:['Goldregen','Gold Rain'],d:['Goldkekse 25 % stärker.','Golden cookies 25% stronger.']},
  {id:'r_hero',c:5,n:['Heldenrezept','Hero Recipe'],d:['Der Held hat 25 % mehr Angriff und Leben.','The hero has 25% more attack and health.']},
  {id:'r_work',c:5,n:['Lehrwerkstatt','Training Workshop'],d:['Helfer bekommen 50 % mehr Erfahrung.','Helpers get 50% more experience.']},
  {id:'r_click2',c:6,n:['Teigmeister','Dough Master'],d:['Klicks ×5.','Clicks ×5.']},
  {id:'r_build',c:6,n:['Bauboom','Building Boom'],d:['Gebäude 10 % billiger.','Buildings 10% cheaper.']},
  {id:'r_off2',c:6,n:['Nachtbäckerei','Night Bakery'],d:['Offline-Grenze +8 Stunden.','Offline limit +8 hours.']},
  {id:'r_gem',c:7,n:['Edelsteinofen','Gem Oven'],d:['50 % mehr Edelsteine.','50% more gems.']},
  {id:'r_chip2',c:8,n:['Himmelsmehl','Heaven Flour'],d:['Himmelschips wirken 50 % stärker.','Heavenly chips work 50% stronger.']},
  {id:'r_prod',c:10,n:['Großes Rezept','Grand Recipe'],d:['Produktion ×3.','Production ×3.']},
  {id:'r_page',c:12,n:['Doppelseite','Double Page'],d:['Wiedergeburt gibt 25 % mehr Rezeptseiten.','Rebirth gives 25% more recipe pages.']}
];
const STAR_UNLOCK=1e7;
const STAR_ITEMS=[
  {id:'s_mana',c:2,n:['Sternen-Phiole','Star Vial'],d:['Höchstens +30 Mana.','+30 max mana.']},
  {id:'s_manar',c:3,n:['Mondlicht','Moonlight'],d:['Mana lädt 25 % schneller.','Mana regenerates 25% faster.']},
  {id:'s_herb',c:3,n:['Wachstumsstern','Growth Star'],d:['Pflanzen wachsen 20 % schneller.','Plants grow 20% faster.']},
  {id:'s_mon',c:4,n:['Sternenschwert','Star Sword'],d:['Monster geben 40 % mehr Belohnung.','Monsters give 40% more reward.']},
  {id:'s_monfast',c:4,n:['Leuchtfeuer','Beacon'],d:['Monster kommen 25 % öfter.','Monsters come 25% more often.']},
  {id:'s_exp',c:5,n:['Sternkompass','Star Compass'],d:['Expeditionen sind 15 % kürzer.','Expeditions are 15% shorter.']},
  {id:'s_pet',c:5,n:['Kuschelkissen','Cuddle Cushion'],d:['Ein vierter Begleiter-Platz.','A fourth companion slot.']},
  {id:'s_egg',c:5,n:['Wärmestein','Warm Stone'],d:['Eier schlüpfen 30 % schneller.','Eggs hatch 30% faster.']},
  {id:'s_trade',c:6,n:['Börsenlizenz','Trading License'],d:['+3 Aktien pro Firma erlaubt, Gebühr 1 % niedriger.','+3 shares per company allowed, fee 1% lower.']},
  {id:'s_ord',c:6,n:['Stammkundenkarte','Loyalty Card'],d:['Aufträge geben 20 % mehr Kekse.','Orders give 20% more cookies.']},
  {id:'s_ev',c:8,n:['Ereignis-Magnet','Event Magnet'],d:['Ereignisse kommen 40 % öfter.','Events come 40% more often.']},
  {id:'s_crown',c:10,need:8,n:['Sternenkrone','Star Crown'],d:['Produktion dauerhaft +4 %. Braucht 8 andere Sternen-Gegenstände.','Production +4% permanently. Needs 8 other star items.']}
];

const RAR={common:{w:70,n:['Gewöhnlich','Common']},rare:{w:22,n:['Selten','Rare']},epic:{w:7,n:['Episch','Epic']},legendary:{w:1,n:['Legendär','Legendary']}};
const ITEMS=[
  {id:'spoon',rar:'common',art:'spoon',k:'click',v:.05,name:['Holzlöffel','Wooden Spoon'],tpl:['Klicks bringen +{x} % mehr Kekse.','Clicks give +{x}% more cookies.']},
  {id:'rolling',rar:'common',art:'rolling',k:'prod',v:.01,name:['Teigrolle','Rolling Pin'],tpl:['Produktion +{x} %.','Production +{x}%.']},
  {id:'mitt',rar:'common',art:'mitt',k:'cost',v:.01,name:['Backhandschuh','Oven Mitt'],tpl:['Gebäude kosten {x} % weniger.','Buildings cost {x}% less.']},
  {id:'shaker',rar:'common',art:'shaker',k:'goldRate',v:.02,name:['Zuckerstreuer','Sugar Shaker'],tpl:['Goldkekse erscheinen {x} % häufiger.','Golden cookies appear {x}% more often.']},
  {id:'flour',rar:'common',art:'sack',k:'boxcost',v:.02,name:['Mehlsack','Flour Sack'],tpl:['Keksboxen kosten {x} % weniger.','Cookie boxes cost {x}% less.']},
  {id:'timer',rar:'common',art:'timer',k:'boostcd',v:.03,name:['Küchenuhr','Kitchen Timer'],tpl:['Boosts laden {x} % schneller.','Boosts recharge {x}% faster.']},
  {id:'scale',rar:'rare',art:'scale',k:'luck',v:.04,name:['Küchenwaage','Kitchen Scale'],tpl:['Glückstreffer bringen +{x} % Kekse.','Lucky hits give +{x}% cookies.']},
  {id:'therm',rar:'rare',art:'therm',k:'time',v:.04,name:['Ofenthermometer','Oven Thermometer'],tpl:['Goldkeks-Räusche halten {x} % länger.','Golden cookie frenzies last {x}% longer.']},
  {id:'milk',rar:'rare',art:'milk',k:'offline',v:.03,name:['Milchkanne','Milk Can'],tpl:['Offline-Ertrag +{x} Prozentpunkte.','Offline gains +{x} percentage points.']},
  {id:'whisk',rar:'rare',art:'whisk',k:'boostdur',v:.04,name:['Schneebesen','Whisk'],tpl:['Boosts halten {x} % länger.','Boosts last {x}% longer.']},
  {id:'cutter',rar:'rare',art:'cutter',k:'goldPow',v:.03,name:['Ausstechform','Cookie Cutter'],tpl:['Goldkeks-Effekte sind {x} % stärker.','Golden cookie effects are {x}% stronger.']},
  {id:'mold',rar:'epic',art:'mold',k:'prod',v:.02,name:['Silberne Backform','Silver Baking Mold'],tpl:['Produktion +{x} %.','Production +{x}%.']},
  {id:'amulet',rar:'epic',art:'amulet',k:'clickPct',v:.002,name:['Schokotropfen-Amulett','Chocolate Drop Amulet'],tpl:['Jeder Klick bringt zusätzlich {x} % deiner Kekse pro Sekunde.','Each click adds {x}% of your cookies per second.']},
  {id:'clover',rar:'epic',art:'lucky',k:'goldLife',v:1,name:['Glücksklee','Lucky Clover'],tpl:['Goldkekse bleiben {x} Sekunden länger.','Golden cookies stay {x} seconds longer.']},
  {id:'chef',rar:'epic',art:'chef',k:'start',v:25000,abs:1,name:['Kochmütze','Chef Hat'],tpl:['Nach jedem Aufstieg startest du mit {x} Keksen mehr.','After each ascension you start with {x} more cookies.']},
  {id:'album',rar:'epic',art:'album',k:'ach',v:.1,name:['Sammelalbum','Collector Album'],tpl:['Erfolge geben {x} % mehr Produktion.','Achievements give {x}% more production.']},
  {id:'anise',rar:'legendary',art:'star',k:'chip',v:.001,name:['Sternanis','Star Anise'],tpl:['Jeder Himmelschip bringt {x} % mehr.','Each heavenly chip gives {x}% more.']},
  {id:'crown',rar:'legendary',art:'crown',k:'prod',v:.04,name:['Keksgebieter-Krone','Cookie Lord Crown'],tpl:['Produktion +{x} %.','Production +{x}%.']},
  {id:'sandglass',rar:'legendary',art:'hourglass',k:'boostcd',v:.06,name:['Ewige Sanduhr','Eternal Hourglass'],tpl:['Boosts laden {x} % schneller.','Boosts recharge {x}% faster.']},
  {id:'nebula',rar:'legendary',art:'spark',k:'prod',v:.05,name:['Sternennebel','Star Nebula'],tpl:['Produktion +{x} %.','Production +{x}%.']},
  {id:'heart',rar:'legendary',art:'r4',k:'cost',v:.02,name:['Fabrikherz','Factory Heart'],tpl:['Gebäude kosten {x} % weniger.','Buildings cost {x}% less.']}
];