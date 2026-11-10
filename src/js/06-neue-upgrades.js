/* ===== Neue Upgrades ===== */
{
  const RECN=[['Sachertorten-Kekse','Sacher Torte Cookies'],['Mozartkugel-Kekse','Mozart Ball Cookies'],['Husarenkrapferl','Hussar Cookies'],['Spitzbuben','Jam Rascals'],['Nussbusserl','Nut Kisses'],['Rumkugeln','Rum Balls'],['Anisbögen','Anise Arches'],['Bärentatzen','Bear Paws'],['Schwarz-Weiß-Gebäck','Black and White Cookies'],['Heidesand','Heath Sand Cookies'],['Spekulatius','Speculoos'],['Printen','Printen'],['Elisenlebkuchen','Elisen Gingerbread'],['Kokosmakronen','Coconut Macaroons'],['Haselnusstaler','Hazelnut Coins'],['Mandelhörnchen','Almond Horns'],['Engelsaugen','Angel Eyes'],['Butter-S','Butter S'],['Terrassenkekse','Terrace Cookies'],['Schokocrossies','Choco Crossies'],['Cantuccini','Cantuccini'],['Shortbread','Shortbread'],['Snickerdoodles','Snickerdoodles'],['Macarons','Macarons'],['Madeleines','Madeleines'],['Erdnussbutter-Kekse','Peanut Butter Cookies'],['Ingwerkekse','Ginger Cookies'],['Zitronenherzen','Lemon Hearts'],['Marmorkekse','Marble Cookies'],['Orangentaler','Orange Coins']];
  const c0=5e3*Math.pow(8,17);
  RECN.forEach((r,j)=>UP.push({id:'r'+(18+j),kind:'recipe',cost:c0*Math.pow(4,j+1),art:'r'+((18+j)%12),tag:()=>'+5 %',name:r,desc:()=>tr('u_recipe')}));
  [[1,0],[2,1],[0,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9],[12,10],[13,11],[14,12],[15,13],[16,14],[17,15],[18,16],[19,17],[2,5],[4,1]].forEach(([t,s],j)=>UP.push({id:'s'+(17+j),kind:'syn',t,s,cost:Math.round(B[t].base*600),art:'b'+t,tag:()=>'+0,5 %',name:[B[t].name[0]+' & '+B[s].name[0],B[t].name[1]+' & '+B[s].name[1]],desc:()=>tr('u_syn',{t:tx(B[t].plural),s:tx(B[s].name)})}));
  [[1e15,.03],[1e17,.04],[1e19,.05]].forEach(([c,p],j)=>UP.push({id:'c'+(5+j),kind:'click',cost:c,pct:p,art:'hand',tag:()=>tr('tag_click'),name:[['Klick-Sturm','Click Storm'],['Klick-Orkan','Click Hurricane'],['Klick-Urknall','Click Big Bang']][j],desc:()=>tr('u_click',{p:(p*100).toLocaleString(LOC[LANG])})}));
  const G=(id,cat,cost,art,tag,name,d,e,x)=>UP.push(Object.assign({id,kind:'gen',cat,cost,art,tag:()=>tag,name,desc:()=>tx(d),e},x||{}));
  G('co1','click',1e6,'hand','Combo',['Combo-Training','Combo Training'],['Die Klick-Combo geht bis ×4.','The click combo goes up to ×4.'],{comboCap:1});
  G('co2','click',1e9,'hand','Combo',['Combo-Meister','Combo Master'],['Die Klick-Combo geht bis ×5.','The click combo goes up to ×5.'],{comboCap:1});
  G('co3','click',1e5,'timer','Combo',['Ausdauernde Finger','Enduring Fingers'],['Die Combo fällt 40 % langsamer ab.','The combo drops 40% slower.'],{comboDecay:.6});
  G('co4','click',1e8,'timer','Combo',['Eiserne Finger','Iron Fingers'],['Die Combo fällt nochmal 40 % langsamer ab.','The combo drops another 40% slower.'],{comboDecay:.6});
  [['gx1','build',40,1e12,'b5',['Gebäude-Rausch','Building Rush'],['Goldkekse können einen Gebäude-Rausch auslösen: Produktion steigt mit deinem größten Gebäude (bis ×5).','Golden cookies can trigger a building rush: production grows with your biggest building (up to ×5).']],
   ['gx2','rain',60,1e14,'drop',['Keks-Regen','Cookie Rain'],['Goldkekse können einen Keks-Regen auslösen: sofort bis zu 10 Minuten Produktion (höchstens 15 % deiner Kekse).','Golden cookies can trigger cookie rain: up to 10 minutes of production at once (at most 15% of your cookies).']],
   ['gx3','gift',90,1e16,'box',['Glücks-Geschenk','Lucky Gift'],['Goldkekse können ein Geschenk bringen: Edelsteine und vielleicht einen Gegenstand.','Golden cookies can bring a gift: gems and maybe an item.']]
  ].forEach(([id,fx,req,cost,art,name,d])=>UP.push({id,kind:'goldfx',fx,req,cost,art,tag:()=>tr('tag_gold'),name,desc:()=>tx(d)}));
  G('wu1','world',1e8,'drop','Welt',['Gartenerde','Garden Soil'],['Pflanzen wachsen 15 % schneller.','Plants grow 15% faster.'],{grow:.85});
  G('wu2','world',1e10,'drop','Welt',['Doppelernte','Double Harvest'],['+1 Kraut bei jeder Ernte.','+1 herb per harvest.'],{herb:1});
  G('wu3','world',1e9,'flame','Welt',['Monsterfallen','Monster Traps'],['Monster geben 25 % mehr Belohnung.','Monsters give 25% more reward.'],{monRew:1.25});
  G('wu4','world',1e11,'flame','Welt',['Schwache Monster','Weak Monsters'],['Monster haben 15 % weniger Leben.','Monsters have 15% less health.'],{monHp:.85});
  G('wu5','world',1e10,'moon','Welt',['Schnelle Schiffe','Fast Ships'],['Expeditionen sind 15 % kürzer.','Expeditions are 15% shorter.'],{exp:.85});
  G('wu6','world',1e12,'moon','Welt',['Edelstein-Sucher','Gem Seekers'],['+1 Edelstein pro Expedition.','+1 gem per expedition.'],{expGem:1});
  G('wu7','world',1e9,'book','Welt',['Manaquelle','Mana Spring'],['Höchstens +20 Mana und Mana lädt 20 % schneller.','+20 max mana and mana regenerates 20% faster.'],{mana:20,manaR:.2});
  G('wu8','world',1e11,'coin','Welt',['Börsenplatz','Trading Floor'],['+3 Aktien pro Firma erlaubt.','+3 shares per company allowed.'],{stockSh:3});
  [[1e9,'Schärfere Klinge','Sharper Blade'],[1e11,'Meisterklinge','Master Blade'],[1e13,'Sternenklinge','Star Blade']].forEach(([c,de,en],j)=>G('hu'+(j+1),'hero',c,'flame','Held',[de,en],['Der Held hat 20 % mehr Angriff.','The hero has 20% more attack.'],{heroAtk:1.2}));
  [[1e9,'Dicke Rüstung','Thick Armor'],[1e11,'Schwere Rüstung','Heavy Armor'],[1e13,'Sternenrüstung','Star Armor']].forEach(([c,de,en],j)=>G('hu'+(j+4),'hero',c,'mitt','Held',[de,en],['Der Held hat 20 % mehr Leben.','The hero has 20% more health.'],{heroHp:1.2}));
  G('hu7','hero',1e10,'timer','Held',['Ausdauertraining','Stamina Training'],['+1 höchste Ausdauer.','+1 max stamina.'],{sta:1});
  G('hu8','hero',1e14,'timer','Held',['Unermüdlich','Tireless'],['+1 höchste Ausdauer.','+1 max stamina.'],{sta:1});
  [[1e10,'Werbetafeln','Billboards'],[1e12,'Radiowerbung','Radio Ads'],[1e14,'Fernsehwerbung','TV Ads']].forEach(([c,de,en],j)=>G('fu'+(j+1),'fr',c,'b2','Filiale',[de,en],['Filialen verkaufen 15 % mehr.','Stores sell 15% more.'],{frSell:1.15}));
  G('fu4','fr',1e11,'sack','Filiale',['Größere Lager','Bigger Stockrooms'],['Filialen-Lager 50 % größer.','Store stock 50% bigger.'],{frCap:1.5});
  G('fu5','fr',1e13,'sack','Filiale',['Lagerhallen','Warehouses'],['Filialen-Lager nochmal 50 % größer.','Store stock another 50% bigger.'],{frCap:1.5});
  G('fu6','fr',1e12,'coin','Filiale',['Premium-Kekse','Premium Cookies'],['Gewinnspanne aller Filialen +5 %.','Margin of all stores +5%.'],{frMar:.05});
  G('fu7','fr',1e15,'gold','Filiale',['Luxus-Kekse','Luxury Cookies'],['Gewinnspanne aller Filialen nochmal +5 %.','Margin of all stores another +5%.'],{frMar:.05});
  G('ku1','work',1e7,'chef','Helfer',['Schulungen','Training Courses'],['Alle Helfer bekommen 25 % mehr Erfahrung.','All helpers get 25% more experience.'],{wkXP:1.25});
  G('ku2','work',1e10,'chef','Helfer',['Weiterbildung','Further Training'],['Alle Helfer bekommen nochmal 25 % mehr Erfahrung.','All helpers get another 25% more experience.'],{wkXP:1.25});
  G('ku3','work',1e13,'chef','Helfer',['Helfer-Akademie','Helper Academy'],['Alle Helfer bekommen 50 % mehr Erfahrung.','All helpers get 50% more experience.'],{wkXP:1.5});
  G('ku4','work',1e12,'crown','Helfer',['Meisterkurs','Master Course'],['Jeder Meister-Helfer gibt +2 % mehr Produktion.','Every master helper gives +2% more production.'],{wkMaster:.02});
  G('ku5','work',1e16,'crown','Helfer',['Großmeister','Grandmaster'],['Jeder Meister-Helfer gibt nochmal +2 % mehr Produktion.','Every master helper gives another +2% more production.'],{wkMaster:.02});
  G('env1','special',1e10,'spark','Wetter',['Wetterfrosch','Weather Frog'],['Wetter und Tageszeit wirken 50 % stärker.','Weather and time of day are 50% stronger.'],{wxMul:.5});
  G('env2','special',1e14,'spark','Wetter',['Klimaforscher','Climate Scientist'],['Wetter und Tageszeit wirken nochmal 50 % stärker.','Weather and time of day are another 50% stronger.'],{wxMul:.5});
  G('msu1','special',1e12,'layers','+5 %',['Meisterbetrieb','Master Business'],['Jeder Meilenstein gibt 5 % mehr.','Every milestone gives 5% more.'],{msAdd:.05});
  G('msu2','special',1e18,'layers','+5 %',['Legendärer Betrieb','Legendary Business'],['Jeder Meilenstein gibt nochmal 5 % mehr.','Every milestone gives another 5% more.'],{msAdd:.05});
  G('mg1','special',1e23,'hand','×3',['Hand Gottes','Hand of God'],['Klicks ×3.','Clicks ×3.'],{click:3},{mega:1});
  G('mg2','special',1e24,'infinity','×10',['Keks-Singularität','Cookie Singularity'],['Produktion ×10.','Production ×10.'],{prod:10},{mega:1});
  G('mg3','special',1e25,'gold','×2',['Goldene Ära','Golden Era'],['Goldkeks-Effekte doppelt so stark.','Golden cookie effects twice as strong.'],{goldPower:2},{mega:1});
  G('mg4','special',1e26,'tag','−25 %',['Ewiger Ausverkauf','Eternal Clearance'],['Alle Gebäude 25 % billiger.','All buildings 25% cheaper.'],{costMult:.75},{mega:1});
  G('mg5','special',1e30,'crown','×10',['Das letzte Rezept','The Final Recipe'],['Produktion ×10.','Production ×10.'],{prod:10},{mega:1});
}
const UPMAP={};UP.forEach(u=>{UPMAP[u.id]=u;});

const A=[];
[[1,'Erster Krümel','First Crumb'],[100,'Kleine Auslage','Small Display'],[1e3,'Volle Backstube','Full Bakery'],[1e4,'Marktstand','Market Stall'],[1e5,'Lieferwagen','Delivery Van'],[1e6,'Millionenbäcker','Millionaire Baker'],[1e7,'Keksbaron','Cookie Baron'],[1e8,'Zuckerkaiser','Sugar Emperor'],[1e9,'Milliardär','Billionaire'],[1e10,'Kekslawine','Cookie Avalanche'],[1e11,'Mehlberg','Flour Mountain'],[1e12,'Teigimperium','Dough Empire'],[1e13,'Kekskosmos','Cookie Cosmos'],[1e15,'Unendliche Rezeptur','Infinite Recipe'],[1e16,'Keksgalaxie','Cookie Galaxy'],[1e18,'Sternenbäcker','Star Baker'],[1e20,'Universumsbäcker','Universe Baker'],[1e22,'Multiversum-Meister','Multiverse Master'],[1e25,'Keksgott','Cookie God'],[1e28,'Keks-Ewigkeit','Cookie Eternity'],[1e31,'Jenseits der Zahlen','Beyond Numbers'],[1e34,'Krümel-Unendlich','Crumb Infinity']]
  .forEach(([n,de,en])=>A.push({id:'all'+n,name:[de,en],desc:()=>tr(n===1?'a_all_1':'a_all_n',{n:fmt(n)}),test:()=>S.all>=n}));
[[1,'Läuft von selbst','Runs by Itself'],[10,'Zehnerpack','Ten-Pack'],[100,'Hundertschaft','Hundred Strong'],[1e3,'Tausendsassa','Jack of All Trades'],[1e4,'Dauerbetrieb','Non-Stop'],[1e5,'Nachtschicht','Night Shift'],[1e6,'Keksflut','Cookie Flood'],[1e7,'Backorkan','Baking Hurricane'],[1e8,'Teigtsunami','Dough Tsunami'],[1e9,'Gigabäcker','Giga Baker'],[1e10,'Keksstrom','Cookie Stream'],[1e11,'Keksfluss','Cookie River'],[1e12,'Keksozean','Cookie Ocean'],[1e14,'Kekssturmflut','Cookie Deluge']]
  .forEach(([n,de,en])=>A.push({id:'kps'+n,name:[de,en],desc:()=>tr('a_kps',{n:fmt(n)}),test:()=>C.kps>=n}));
[[1,'Erster Klick','First Click'],[100,'Warmgeklickt','Warmed Up'],[1e3,'Klickgewitter','Click Storm'],[1e4,'Mausarm','Mouse Arm'],[1e5,'Klickmaschine','Click Machine']]
  .forEach(([n,de,en])=>A.push({id:'clk'+n,name:[de,en],desc:()=>tr('a_clicks',{n:fmt(n)}),test:()=>S.clicks>=n}));
A.push({id:'allb1',name:['Komplette Fabrik','Complete Factory'],desc:()=>tt('Besitze von jedem Gebäude mindestens eins.','Own at least one of every building.'),test:()=>B.every((b,i)=>S.b[i]>=1)});
A.push({id:'allb100',name:['Keks-Imperium','Cookie Empire'],desc:()=>tt('Besitze von jedem Gebäude mindestens 100.','Own at least 100 of every building.'),test:()=>B.every((b,i)=>S.b[i]>=100)});
B.forEach((b,i)=>[[1,'Der Anfang','The Beginning'],[50,'Belegschaft','Workforce'],[100,'Großbetrieb','Large Operation'],[150,'Riesenbetrieb','Giant Operation']].forEach(([n,de,en])=>A.push({
  id:'own'+i+'_'+n,name:[b.name[0]+': '+de,b.name[1]+': '+en],desc:()=>tr('a_own',{n,name:tx(n===1?b.name:b.plural)}),test:()=>S.b[i]>=n
})));
[[1,'Goldrausch','Gold Rush'],[7,'Goldschmied','Goldsmith'],[27,'Goldfieber','Gold Fever']]
  .forEach(([n,de,en])=>A.push({id:'gold'+n,name:[de,en],desc:()=>tr(n===1?'a_gold_1':'a_gold_n',{n}),test:()=>S.gold>=n}));
A.push({id:'asc1',name:['Himmelfahrt','Ascension'],desc:()=>tr('a_asc'),test:()=>S.asc>=1});
A.push({id:'asc5',name:['Stammgast im Himmel','Heaven Regular'],desc:()=>tr('a_asc5'),test:()=>S.asc>=5});
A.push({id:'box1',name:['Erste Box','First Box'],desc:()=>tr('a_box1'),test:()=>S.rolls>=1});
A.push({id:'box25',name:['Boxenfan','Box Fan'],desc:()=>tr('a_box25'),test:()=>S.rolls>=25});
A.push({id:'items8',name:['Sammler','Collector'],desc:()=>tr('a_items8'),test:()=>Object.keys(S.items).length>=8});
A.push({id:'chips100',name:['Himmelsstürmer','Sky Stormer'],desc:()=>tr('a_chips',{n:100}),test:()=>S.chips>=100});
A.push({id:'chips1000',name:['Heiliger Bäcker','Holy Baker'],desc:()=>tr('a_chips',{n:1000}),test:()=>S.chips>=1000});
A.push({id:'asc10',name:['Aufstiegsprofi','Ascension Pro'],desc:()=>tr('a_asc10'),test:()=>S.asc>=10});
[[1,'Erster Kunde','First Customer'],[10,'Stammkundschaft','Regulars'],[50,'Lieferdienst','Delivery Service'],[100,'Hofbäcker','Court Baker']].forEach(([n,de,en])=>A.push({id:'ord'+n,name:[de,en],desc:()=>tr('a_ord',{n}),test:()=>S.orders.done>=n}));
[[1,'Monsterjäger','Monster Hunter'],[10,'Monsterschreck','Monster Scare'],[50,'Monsterkönig','Monster King']].forEach(([n,de,en])=>A.push({id:'mon'+n,name:[de,en],desc:()=>tt('Besiege '+n+(n===1?' Monster.':' Monster.'),'Beat '+n+(n===1?' monster.':' monsters.')),test:()=>S.w.mon.k>=n}));
A.push({id:'cast25',name:['Zauberlehrling','Sorcerer Apprentice'],desc:()=>tt('Wirke 25 Zauber.','Cast 25 spells.'),test:()=>S.w.casts>=25});
A.push({id:'exp10',name:['Entdecker','Explorer'],desc:()=>tt('Schließe 10 Expeditionen ab.','Finish 10 expeditions.'),test:()=>S.w.exp.done>=10});
A.push({id:'craftall',name:['Meisterhandwerker','Master Crafter'],desc:()=>tt('Baue alle Ausrüstungsstücke.','Craft all gear.'),test:()=>Object.keys(S.w.craft.done).length>=CRAFTS.length});
A.push({id:'pets5',name:['Tierfreund','Animal Friend'],desc:()=>tt('Sammle 5 verschiedene Begleiter.','Collect 5 different companions.'),test:()=>Object.keys(S.w.pet.owned).length>=5});
A.push({id:'laball',name:['Chefforscher','Chief Researcher'],desc:()=>tt('Schließe alle Forschungen ab.','Finish all research.'),test:()=>Object.keys(S.w.lab.done).length>=LABS.length});
A.push({id:'chal1',name:['Herausforderer','Challenger'],desc:()=>tt('Schaffe eine Herausforderung.','Complete a challenge.'),test:()=>Object.keys(S.w.chal.done).length>=1});
A.push({id:'hero10',name:['Junger Held','Young Hero'],desc:()=>tt('Bring deinen Helden auf Stufe 10.','Get your hero to level 10.'),test:()=>S.hero.lvl>=10});
A.push({id:'hero40',name:['Keksritter','Cookie Knight'],desc:()=>tt('Bring deinen Helden auf Stufe 40.','Get your hero to level 40.'),test:()=>S.hero.lvl>=40});
A.push({id:'dung1',name:['Kellerkind','Cellar Kid'],desc:()=>tt('Schaffe den Krümelkeller.','Clear the Crumb Cellar.'),test:()=>!!S.hero.clr.d1});
A.push({id:'dung5',name:['Sternenbezwinger','Star Conqueror'],desc:()=>tt('Schaffe das Sternengewölbe.','Clear the Star Vault.'),test:()=>!!S.hero.clr.d5});
A.push({id:'tower25',name:['Turmkletterer','Tower Climber'],desc:()=>tt('Schaffe Stockwerk 25 im Endlos-Turm.','Clear floor 25 of the Endless Tower.'),test:()=>S.hero.tower.best>=25});
A.push({id:'tower100',name:['Himmelsstürmer des Turms','Tower Sky Stormer'],desc:()=>tt('Schaffe Stockwerk 100 im Endlos-Turm.','Clear floor 100 of the Endless Tower.'),test:()=>S.hero.tower.best>=100});
A.push({id:'fr1',name:['Erste Filiale','First Store'],desc:()=>tt('Eröffne eine Filiale.','Open a store.'),test:()=>Object.keys(S.fr.s).length>=1});
A.push({id:'fr6',name:['Keks-Imperium','Cookie Empire'],desc:()=>tt('Eröffne Filialen in allen 6 Städten.','Open stores in all 6 cities.'),test:()=>Object.keys(S.fr.s).length>=6});
A.push({id:'frmax',name:['Flaggschiff','Flagship'],desc:()=>tt('Bring eine Filiale auf Stufe 10.','Get a store to level 10.'),test:()=>Object.values(S.fr.s).some(x=>x.L>=10)});
[['sec_title',['Titelklicker','Title Clicker'],()=>S.sec.title>=50,['Klicke 50-mal auf den Namen „Keksfabrik“.','Click the name “Cookie Factory” 50 times.']],
 ['sec_night',['Mitternachtsbäcker','Midnight Baker'],()=>new Date().getHours()===0,['Spiele um Mitternacht.','Play at midnight.']],
 ['sec_777',['Glückszahl','Lucky Number'],()=>Math.floor(S.cookies)===777,['Habe genau 777 Kekse.','Have exactly 777 cookies.']],
 ['sec_lang',['Weltenbummler','Globetrotter'],()=>S.sec.lang>=10,['Wechsle 10-mal die Sprache.','Switch the language 10 times.']],
 ['sec_news',['Neugierig','Curious'],()=>S.sec.news>=10,['Öffne 10-mal die Neuigkeiten.','Open the news 10 times.']],
 ['sec_flee',['Strategischer Rückzug','Strategic Retreat'],()=>S.sec.flee>=5,['Lass deinen Helden 5-mal fliehen.','Let your hero flee 5 times.']],
 ['sec_respec',['Unentschlossen','Indecisive'],()=>S.sec.respec>=3,['Setze den Himmlischen Baum 3-mal zurück.','Reset the heavenly tree 3 times.']],
 ['sec_undo',['Zeitreisender','Time Traveler'],()=>S.sec.undo>=10,['Nimm 10 Käufe zurück.','Undo 10 purchases.']],
 ['sec_combo',['Klick-Wirbelwind','Click Whirlwind'],()=>combo>=100,['Erreiche die volle Klick-Combo ×3.','Reach the full ×3 click combo.']],
 ['sec_rainbow',['Regenbogenjäger','Rainbow Hunter'],()=>curWeather().id==='rainbow',['Spiele bei Regenbogen-Wetter.','Play during rainbow weather.']],
 ['sec_design',['Künstler','Artist'],()=>S.sec.design>=1,['Benutze ein eigenes Keks-Design.','Use your own cookie design.']],
 ['sec_kid',['Kinderfreund','Kid Friend'],()=>(S.sec.kid||0)>=3,['Schenke einem Kind 3-mal einen Keks.','Give a child a cookie 3 times.']],
 ['sec_broke',['Pleite','Broke'],()=>S.all>=1e6&&S.cookies<1,['Gib wirklich alle Kekse aus.','Spend really all your cookies.']]
].forEach(([id,name,test,d])=>A.push({id,secret:1,name,desc:()=>tx(d),test}));
A.push({id:'tree8',name:['Baumschüler','Tree Apprentice'],desc:()=>tr('a_tree'),test:()=>Object.keys(S.tree).length>=8});

/* Himmlischer Baum: x/y in Prozent der Zeichenfläche */
/* Himmlischer Baum: Sternenkarte mit Spiralarmen */
const TREE=[];
(function(){
  const N=(id,name,cost,art,desc,eff)=>Object.assign({id,name,cost,art,desc},eff||{});
  const pct=v=>Math.round((v-1)*100);
  const ARMS=[
    {a:-90,nodes:[
      N('l1',['Doppelter Boden','Double Bottom'],2,'layers',['Produktion +10 %.','Production +10%.'],{prod:1.1}),
      N('p1',['Himmelsmehl','Heavenly Flour'],4,'sugar',['Produktion +10 %.','Production +10%.'],{prod:1.1}),
      N('l3',['Himmelsrezept','Heavenly Recipe'],15,'book',['Produktion +30 %.','Production +30%.'],{prod:1.3}),
      N('l4',['Himmlische Fabrik','Heavenly Factory'],25,'b5',['Produktion +15 %.','Production +15%.'],{prod:1.15}),
      N('p2',['Wolkenofen','Cloud Oven'],35,'fan',['Produktion +20 %.','Production +20%.'],{prod:1.2}),
      N('fin',['Goldenes Rezept','Golden Recipe'],40,'crown',['Produktion ×1,5.','Production ×1.5.'],{prod:1.5}),
      N('p3',['Engelsbutter','Angel Butter'],60,'butter',['Produktion +25 %.','Production +25%.'],{prod:1.25}),
      N('end',['Das ewige Rezept','The Eternal Recipe'],80,'infinity',['Produktion ×2 und jeder Himmelschip bringt +2 % statt +1,5 %.','Production ×2 and each heavenly chip gives +2% instead of +1.5%.'],{prod:2,chip:.02}),
      N('e1',['Zeitschleife','Time Loop'],120,'moon',['Produktion ×1,5.','Production ×1.5.'],{prod:1.5}),
      N('p4',['Sternenteig','Star Dough'],200,'star',['Produktion +30 %.','Production +30%.'],{prod:1.3}),
      N('e5',['Kosmischer Ofen','Cosmic Oven'],300,'flame',['Produktion ×2.','Production ×2.'],{prod:2}),
      N('p5',['Galaxienzucker','Galaxy Sugar'],400,'spark',['Produktion +40 %.','Production +40%.'],{prod:1.4}),
      N('e7',['Keksgott','Cookie God'],500,'crown',['Produktion ×2.','Production ×2.'],{prod:2}),
      N('p6',['Unendliche Krümel','Endless Crumbs'],700,'cookie',['Produktion +50 %.','Production +50%.'],{prod:1.5}),
      N('e8',['Das Ende der Kekse','The End of Cookies'],1000,'infinity',['Produktion ×3, und du startest nach jedem Aufstieg mit 1 Mrd Keksen.','Production ×3, and you start every ascension with 1 billion cookies.'],{prod:3,start:1e9}),
      N('p7',['Jenseits der Kekse','Beyond Cookies'],2000,'moon',['Produktion ×2.','Production ×2.'],{prod:2}),
      N('p8',['Der letzte Krümel','The Last Crumb'],5000,'star',['Produktion ×3.','Production ×3.'],{prod:3})
    ]},
    {a:-45,nodes:[
      N('m1',['Goldene Hände','Golden Hands'],2,'magnet',['Goldkekse erscheinen 25 % häufiger.','Golden cookies appear 25% more often.'],{goldRate:.75}),
      N('m2',['Langer Glanz','Long Shine'],4,'spark',['Goldkekse bleiben 8 Sekunden länger sichtbar.','Golden cookies stay visible 8 seconds longer.'],{goldLife:8}),
      N('m3',['Goldadern','Gold Veins'],10,'gold',['Goldkeks-Effekte sind 30 % stärker.','Golden cookie effects are 30% stronger.'],{goldPower:1.3}),
      N('m4',['Goldregen','Gold Rain'],20,'drop',['Goldkekse erscheinen weitere 20 % häufiger.','Golden cookies appear another 20% more often.'],{goldRate:.8}),
      N('g1',['Glückspilz','Lucky Fellow'],30,'lucky',['Glückstreffer bringen 25 % mehr.','Lucky hits give 25% more.'],{luck:1.25}),
      N('g2',['Langer Rausch','Long Frenzy'],50,'timer',['Goldkeks-Räusche halten 20 % länger.','Golden cookie frenzies last 20% longer.'],{buffTime:1.2}),
      N('e3',['Goldener Schnitt','Golden Cut'],150,'gold',['Goldkekse bleiben 10 Sekunden länger sichtbar.','Golden cookies stay visible 10 seconds longer.'],{goldLife:10}),
      N('g3',['Goldschmiede','Gold Forge'],200,'coin',['Goldkeks-Effekte sind 30 % stärker.','Golden cookie effects are 30% stronger.'],{goldPower:1.3}),
      N('g4',['Goldstrom','Gold Stream'],350,'magnet',['Goldkekse erscheinen 15 % häufiger.','Golden cookies appear 15% more often.'],{goldRate:.85}),
      N('g5',['Vierblättriger Keks','Four-Leaf Cookie'],600,'lucky',['Glückstreffer bringen 30 % mehr.','Lucky hits give 30% more.'],{luck:1.3}),
      N('g6',['Ewiger Rausch','Eternal Frenzy'],900,'hourglass',['Goldkeks-Räusche halten 30 % länger.','Golden cookie frenzies last 30% longer.'],{buffTime:1.3}),
      N('g7',['Goldsonne','Golden Sun'],1500,'gold',['Goldkeks-Effekte sind 50 % stärker.','Golden cookie effects are 50% stronger.'],{goldPower:1.5}),
      N('g8',['Goldsturm','Gold Storm'],3000,'spark',['Goldkekse erscheinen 20 % häufiger.','Golden cookies appear 20% more often.'],{goldRate:.8})
    ]},
    {a:0,nodes:[
      N('r1',['Flinke Ahnen','Nimble Ancestors'],2,'hand',['Klicks bringen doppelt so viele Kekse.','Clicks give twice as many cookies.'],{click:2}),
      N('c1',['Himmelsfinger','Heaven Fingers'],6,'hand',['Klicks ×2.','Clicks ×2.'],{click:2}),
      N('x2',['Meisterklick','Master Click'],22,'lucky',['Jeder Klick bringt zusätzlich 2 % deiner Kekse pro Sekunde.','Each click adds another 2% of your cookies per second.'],{clickPct:.02}),
      N('c2',['Donnerklick','Thunder Click'],40,'spark',['Klicks ×3.','Clicks ×3.'],{click:3}),
      N('c3',['Klickstrom','Click Stream'],80,'hand',['Jeder Klick bringt zusätzlich 2 % deiner Kekse pro Sekunde.','Each click adds another 2% of your cookies per second.'],{clickPct:.02}),
      N('c4',['Sternenfinger','Star Fingers'],150,'star',['Klicks ×5.','Clicks ×5.'],{click:5}),
      N('c5',['Klickflut','Click Flood'],300,'drop',['Jeder Klick bringt zusätzlich 3 % deiner Kekse pro Sekunde.','Each click adds another 3% of your cookies per second.'],{clickPct:.03}),
      N('c6',['Göttlicher Klick','Divine Click'],600,'crown',['Klicks ×3.','Clicks ×3.'],{click:3}),
      N('c7',['Ewiger Klick','Eternal Click'],1500,'infinity',['Jeder Klick bringt zusätzlich 5 % deiner Kekse pro Sekunde.','Each click adds another 5% of your cookies per second.'],{clickPct:.05})
    ]},
    {a:45,build:1,nodes:[]},
    {a:90,nodes:[
      N('r2',['Vorratskammer','Pantry'],5,'pantry',['Nach jedem Aufstieg startest du mit 50.000 Keksen.','After every ascension you start with 50,000 cookies.'],{start:5e4}),
      N('r3',['Stammkunden','Regular Customers'],8,'tag',['Gebäude kosten 5 % weniger.','Buildings cost 5% less.'],{costMult:.95}),
      N('r4',['Schnäppchenjäger','Bargain Hunter'],18,'coin',['Gebäude kosten weitere 6 % weniger.','Buildings cost another 6% less.'],{costMult:.94}),
      N('w1',['Boxenrabatt','Box Discount'],30,'box',['Keksboxen kosten 15 % weniger.','Cookie boxes cost 15% less.'],{boxM:.85}),
      N('e2',['Himmelsmarkt','Heavenly Market'],150,'coin',['Gebäude kosten weitere 5 % weniger.','Buildings cost another 5% less.'],{costMult:.95}),
      N('w2',['Gefüllte Speisekammer','Full Larder'],250,'sack',['Nach jedem Aufstieg startest du mit 10 Mio Keksen.','After every ascension you start with 10 million cookies.'],{start:1e7}),
      N('w3',['Großhandel','Wholesale'],500,'scale',['Gebäude kosten weitere 5 % weniger.','Buildings cost another 5% less.'],{costMult:.95}),
      N('w4',['Schatzkammer','Treasury'],1200,'gold',['Nach jedem Aufstieg startest du mit 1 Billion Keksen.','After every ascension you start with 1 trillion cookies.'],{start:1e12}),
      N('w5',['Himmlischer Ausverkauf','Heavenly Clearance'],2500,'tag',['Gebäude kosten 10 % weniger.','Buildings cost 10% less.'],{costMult:.9})
    ]},
    {a:135,nodes:[
      N('o1',['Nachtwache','Night Watch'],10,'moon',['Offline-Erträge steigen auf 60 %, maximal 10 Stunden.','Offline gains rise to 60%, up to 10 hours.'],{offline:.6,offCap:10}),
      N('x1',['Ewiger Ofen','Eternal Oven'],22,'moon',['Offline-Erträge steigen auf 80 %, maximal 12 Stunden.','Offline gains rise to 80%, up to 12 hours.'],{offline:.8,offCap:12}),
      N('o2',['Schlafender Bäcker','Sleeping Baker'],100,'b1',['Offline-Erträge steigen auf 90 %, maximal 16 Stunden.','Offline gains rise to 90%, up to 16 hours.'],{offline:.9,offCap:16}),
      N('e6',['Zeitreisender Opa','Time Travel Grandpa'],300,'b1',['Offline-Erträge steigen auf 100 %, maximal 24 Stunden.','Offline gains rise to 100%, up to 24 hours.'],{offline:1,offCap:24}),
      N('o3',['Traumschicht','Dream Shift'],800,'b18',['Offline-Erträge 100 %, maximal 36 Stunden.','Offline gains 100%, up to 36 hours.'],{offline:1,offCap:36}),
      N('o4',['Ewige Nacht','Eternal Night'],2000,'moon',['Offline-Erträge 100 %, maximal 48 Stunden.','Offline gains 100%, up to 48 hours.'],{offline:1,offCap:48})
    ]},
    {a:180,nodes:[
      N('k1',['Schnelle Öfen','Quick Ovens'],8,'fridge',['Boosts laden 10 % schneller.','Boosts recharge 10% faster.'],{cdRed:.1}),
      N('k2',['Lange Wirkung','Long Effect'],20,'hourglass',['Boosts halten 25 % länger.','Boosts last 25% longer.'],{durM:1.25}),
      N('k3',['Turbo-Kühlung','Turbo Cooling'],60,'fridge',['Boosts laden 10 % schneller.','Boosts recharge 10% faster.'],{cdRed:.1}),
      N('k4',['Zeitdehnung','Time Stretch'],150,'hourglass',['Boosts halten 25 % länger.','Boosts last 25% longer.'],{durM:1.25}),
      N('k5',['Sofort-Ofen','Instant Oven'],400,'flame',['Boosts laden 10 % schneller.','Boosts recharge 10% faster.'],{cdRed:.1}),
      N('k6',['Ewige Boosts','Eternal Boosts'],1000,'infinity',['Boosts halten 50 % länger.','Boosts last 50% longer.'],{durM:1.5})
    ]},
    {a:-135,nodes:[
      N('h1',['Himmelsfunke','Heaven Spark'],3,'spark',['Erfolge bringen 10 % mehr Produktion.','Achievements give 10% more production.'],{achMul:1.1}),
      N('l2',['Ewiger Sauerteig','Eternal Sourdough'],5,'jar',['Jeder Himmelschip bringt +1,5 % statt +1 % Produktion.','Each heavenly chip gives +1.5% instead of +1% production.'],{chip:.015}),
      N('h2',['Ruhmeshalle','Hall of Fame'],30,'album',['Erfolge bringen 20 % mehr Produktion.','Achievements give 20% more production.'],{achMul:1.2}),
      N('h3',['Chip-Glanz','Chip Shine'],50,'coin',['Jeder Himmelschip bringt +1,75 % Produktion.','Each heavenly chip gives +1.75% production.'],{chip:.0175}),
      N('e4',['Unendlicher Hunger','Endless Hunger'],250,'jar',['Jeder Himmelschip bringt +2,5 % Produktion.','Each heavenly chip gives +2.5% production.'],{chip:.025}),
      N('h4',['Trophäensaal','Trophy Room'],400,'album',['Erfolge bringen 30 % mehr Produktion.','Achievements give 30% more production.'],{achMul:1.3}),
      N('h5',['Himmlischer Schatz','Heavenly Treasure'],600,'gold',['Jeder Himmelschip bringt +3 % Produktion.','Each heavenly chip gives +3% production.'],{chip:.03}),
      N('h6',['Chip-Krone','Chip Crown'],1500,'crown',['Jeder Himmelschip bringt +3,5 % Produktion.','Each heavenly chip gives +3.5% production.'],{chip:.035}),
      N('h7',['Sternenchip','Star Chip'],4000,'star',['Jeder Himmelschip bringt +4 % Produktion.','Each heavenly chip gives +4% production.'],{chip:.04})
    ]}
  ];
  ARMS[0].nodes.push(N('p9',['Urknall-Rezept','Big Bang Recipe'],12000,'b19',['Produktion ×3.','Production ×3.'],{prod:3}),N('p10',['Unendlicher Ofen','Infinite Oven'],30000,'infinity',['Produktion ×5.','Production ×5.'],{prod:5}));
  ARMS[1].nodes.push(N('g9',['Goldader-Gott','Gold Vein God'],6000,'gold',['Goldkeks-Effekte 50 % stärker.','Golden cookie effects 50% stronger.'],{goldPower:1.5}),N('g10',['Goldene Ewigkeit','Golden Eternity'],12000,'hourglass',['Goldkekse bleiben 15 Sekunden länger.','Golden cookies stay 15 seconds longer.'],{goldLife:15}),N('g11',['Glückskaiser','Luck Emperor'],25000,'lucky',['Glückstreffer bringen 50 % mehr.','Lucky hits give 50% more.'],{luck:1.5}),N('g12',['Goldene Galaxie','Golden Galaxy'],50000,'spark',['Goldkekse erscheinen 25 % häufiger.','Golden cookies appear 25% more often.'],{goldRate:.75}));
  ARMS[2].nodes.push(N('c8',['Klick-Galaxie','Click Galaxy'],3000,'b15',['Klicks ×3.','Clicks ×3.'],{click:3}),N('c9',['Klick-Universum','Click Universe'],6000,'spark',['Jeder Klick bringt zusätzlich 5 % deiner Kekse pro Sekunde.','Each click adds another 5% of your cookies per second.'],{clickPct:.05}),N('c10',['Allmachtsklick','Almighty Click'],12000,'crown',['Klicks ×4.','Clicks ×4.'],{click:4}),N('c11',['Klick der Ewigkeit','Click of Eternity'],25000,'hourglass',['Jeder Klick bringt zusätzlich 8 % deiner Kekse pro Sekunde.','Each click adds another 8% of your cookies per second.'],{clickPct:.08}),N('c12',['Urknall-Klick','Big Bang Click'],50000,'b19',['Klicks ×5.','Clicks ×5.'],{click:5}),N('c13',['Der letzte Klick','The Last Click'],100000,'infinity',['Klicks ×10.','Clicks ×10.'],{click:10}));
  ARMS[4].nodes.push(N('w6',['Himmlische Großbank','Heavenly Bank'],5000,'b6',['Nach jedem Aufstieg startest du mit 1 Billiarde Keksen.','After every ascension you start with 1 quadrillion cookies.'],{start:1e15}),N('w7',['Kosmischer Rabatt','Cosmic Discount'],10000,'tag',['Gebäude kosten 10 % weniger.','Buildings cost 10% less.'],{costMult:.9}),N('w8',['Goldener Tresor','Golden Vault'],25000,'gold',['Nach jedem Aufstieg startest du mit 1 Trillion Keksen.','After every ascension you start with 1 quintillion cookies.'],{start:1e18}),N('w9',['Ewiger Ausverkauf','Eternal Sale'],50000,'coin',['Gebäude kosten 15 % weniger.','Buildings cost 15% less.'],{costMult:.85}));
  ARMS[5].nodes.push(N('o5',['Schlummerofen','Slumber Oven'],4000,'b18',['Offline-Erträge 100 %, maximal 72 Stunden.','Offline gains 100%, up to 72 hours.'],{offline:1,offCap:72}),N('o6',['Winterschlaf','Hibernation'],10000,'moon',['Offline-Erträge 100 %, maximal 96 Stunden.','Offline gains 100%, up to 96 hours.'],{offline:1,offCap:96}),N('o7',['Zeitloser Schlaf','Timeless Sleep'],25000,'b12',['Offline-Erträge 100 %, maximal 7 Tage.','Offline gains 100%, up to 7 days.'],{offline:1,offCap:168}),N('o8',['Ewiger Traum','Eternal Dream'],60000,'infinity',['Offline-Erträge 300 %, maximal 14 Tage.','Offline gains 300%, up to 14 days.'],{offline:3,offCap:336}));
  ARMS[6].nodes.push(N('k7',['Blitz-Ofen','Flash Oven'],2500,'flame',['Boosts laden 10 % schneller.','Boosts recharge 10% faster.'],{cdRed:.1}),N('k8',['Dauerbrenner','Long Burner'],6000,'hourglass',['Boosts halten 50 % länger.','Boosts last 50% longer.'],{durM:1.5}),N('k9',['Sofort-Kühlung','Instant Cooling'],15000,'fridge',['Boosts laden 10 % schneller.','Boosts recharge 10% faster.'],{cdRed:.1}),N('k10',['Zeitlose Boosts','Timeless Boosts'],40000,'infinity',['Boosts halten doppelt so lange.','Boosts last twice as long.'],{durM:2}));
  ARMS[7].nodes.push(N('h8',['Ruhmestempel','Temple of Fame'],8000,'b7',['Erfolge bringen 50 % mehr Produktion.','Achievements give 50% more production.'],{achMul:1.5}),N('h9',['Chip-Galaxie','Chip Galaxy'],15000,'spark',['Jeder Himmelschip bringt +5 % Produktion.','Each heavenly chip gives +5% production.'],{chip:.05}),N('h10',['Ewiger Ruhm','Eternal Fame'],35000,'album',['Erfolge bringen doppelt so viel Produktion.','Achievements give twice as much production.'],{achMul:2}),N('h11',['Chip-Universum','Chip Universe'],80000,'infinity',['Jeder Himmelschip bringt +6 % Produktion.','Each heavenly chip gives +6% production.'],{chip:.06}));
  B.forEach((b,i)=>ARMS[3].nodes.push(N('hb'+i,[b.name[0]+' im Himmel',b.name[1]+' in Heaven'],Math.round(3*Math.pow(1.5,i)),'b'+i,[b.plural[0]+' produzieren doppelt so viel.',b.plural[1]+' produce twice as much.'],{bi:i,bmul:2})));
  const C0=2000;
  TREE.push(N('root',['Himmelsofen','Heavenly Oven'],1,'b2',['Der erste Ofen im Himmel. Produktion +10 %.','The first oven in heaven. Production +10%.'],{prod:1.1,req:[],px:C0,py:C0}));
  ARMS.forEach(arm=>{
    let prev='root';
    arm.nodes.forEach((n,k)=>{
      const r=150+k*88,ang=(arm.a+k*9.5)*Math.PI/180,wob=(k%2?1:-1)*10;
      n.px=Math.round(C0+r*Math.cos(ang)-wob*Math.sin(ang));n.py=Math.round(C0+r*Math.sin(ang)+wob*Math.cos(ang));
      n.req=[prev];prev=n.id;TREE.push(n);
    });
  });
})();
const TMAP={};TREE.forEach(n=>{TMAP[n.id]=n;});
