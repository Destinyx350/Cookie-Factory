/* ======================= Daten ======================= */
const B=[
  {name:['Teigfinger','Dough Finger'],plural:['Teigfinger','Dough Fingers'],base:15,cps:0.1,flavor:['Knetet unermüdlich mit.','Kneads along tirelessly.']},
  {name:['Oma','Granny'],plural:['Omas','Grannies'],base:100,cps:1,flavor:['Backt nach Familienrezept.','Bakes from a family recipe.']},
  {name:['Backstube','Bakery'],plural:['Backstuben','Bakeries'],base:1100,cps:8,flavor:['Frische Kekse jeden Morgen.','Fresh cookies every morning.']},
  {name:['Keksfarm','Cookie Farm'],plural:['Keksfarmen','Cookie Farms'],base:12000,cps:47,flavor:['Hier wachsen Kekse an Sträuchern.','Cookies grow on bushes here.']},
  {name:['Mine','Mine'],plural:['Minen','Mines'],base:130000,cps:260,flavor:['Schürft Schokostücke aus der Tiefe.','Digs chocolate chunks from the deep.']},
  {name:['Fabrik','Factory'],plural:['Fabriken','Factories'],base:1.4e6,cps:1400,flavor:['Fließband rund um die Uhr.','Assembly line around the clock.']},
  {name:['Bank','Bank'],plural:['Banken','Banks'],base:2e7,cps:7800,flavor:['Zinsen werden in Keksen gezahlt.','Interest is paid in cookies.']},
  {name:['Tempel','Temple'],plural:['Tempel','Temples'],base:3.3e8,cps:44000,flavor:['Opfergaben aus Zucker.','Offerings made of sugar.']},
  {name:['Zauberturm','Wizard Tower'],plural:['Zaubertürme','Wizard Towers'],base:5.1e9,cps:260000,flavor:['Beschwört Kekse aus dem Nichts.','Conjures cookies out of thin air.']},
  {name:['Raumschiff','Spaceship'],plural:['Raumschiffe','Spaceships'],base:7.5e10,cps:1.6e6,flavor:['Liefert frische Kekse vom Mond.','Delivers fresh cookies from the moon.']},
  {name:['Alchemielabor','Alchemy Lab'],plural:['Alchemielabore','Alchemy Labs'],base:1e12,cps:1e7,flavor:['Verwandelt Blei in Butterkekse.','Turns lead into butter cookies.']},
  {name:['Portal','Portal'],plural:['Portale','Portals'],base:1.4e13,cps:6.5e7,flavor:['Kekse aus anderen Dimensionen.','Cookies from other dimensions.']},
  {name:['Zeitmaschine','Time Machine'],plural:['Zeitmaschinen','Time Machines'],base:1.7e14,cps:4.3e8,flavor:['Backt Kekse von gestern, heute.',"Bakes yesterday's cookies today."]},
  {name:['Antimaterie-Kondensator','Antimatter Condenser'],plural:['Antimaterie-Kondensatoren','Antimatter Condensers'],base:2.1e15,cps:4e9,flavor:['Presst Kekse aus dem Nichts.','Squeezes cookies out of nothing.']},
  {name:['Prisma','Prism'],plural:['Prismen','Prisms'],base:2.6e16,cps:4.8e10,flavor:['Bricht Licht in Kekse.','Splits light into cookies.']},
  {name:['Keks-Multiversum','Cookie Multiverse'],plural:['Keks-Multiversen','Cookie Multiverses'],base:3.1e17,cps:5.5e11,flavor:['Jede Parallelwelt backt mit.','Every parallel world bakes along.']},
  {name:['Sternenschmiede','Star Forge'],plural:['Sternenschmieden','Star Forges'],base:3.7e18,cps:6.3e12,flavor:['Schmiedet Kekse in Sternenglut.','Forges cookies in starfire.']},
  {name:['Schwarzes Loch','Black Hole'],plural:['Schwarze Löcher','Black Holes'],base:4.4e19,cps:7.2e13,flavor:['Zieht Kekse aus dem ganzen All an.','Pulls in cookies from all of space.']},
  {name:['Traumbäckerei','Dream Bakery'],plural:['Traumbäckereien','Dream Bakeries'],base:5.3e20,cps:8.3e14,flavor:['Backt alles, was du dir erträumst.','Bakes everything you dream of.']},
  {name:['Urknall-Ofen','Big Bang Oven'],plural:['Urknall-Öfen','Big Bang Ovens'],base:6.4e21,cps:9.6e15,flavor:['Hier begann das Keks-Universum.','This is where the cookie universe began.']},
  {name:['Sternbild-Bäckerei','Constellation Bakery'],plural:['Sternbild-Bäckereien','Constellation Bakeries'],base:7.7e22,cps:1.1e17,flavor:['Zeichnet Kekse quer über den Nachthimmel.','Draws cookies across the night sky.']},
  {name:['Quanten-Konditorei','Quantum Patisserie'],plural:['Quanten-Konditoreien','Quantum Patisseries'],base:9.3e23,cps:1.27e18,flavor:['Backt jeden möglichen Keks – gleichzeitig.','Bakes every possible cookie – all at once.']},
  {name:['Keks-Singularität','Cookie Singularity'],plural:['Keks-Singularitäten','Cookie Singularities'],base:1.12e25,cps:1.46e19,flavor:['Alle Kekse in einem Punkt. Unendlich knusprig.','All cookies in a single point. Infinitely crunchy.']}
];

const UP=[];
const TIER_REQ=[1,5,25,50,100,150,200,250];
const TIER_MULT=[10,50,500,5000,50000,5e6,1e9,1e11];
const TIER_NAMES=[['Feinschliff','Fine Polish'],['Zweite Schicht','Second Shift'],['Meisterklasse','Master Class'],['Spitzenqualität','Top Quality'],['Goldstandard','Gold Standard'],['Grenzenlos','Limitless'],['Überirdisch','Transcendent'],['Kosmisch','Cosmic']];
B.forEach((b,i)=>TIER_REQ.forEach((req,k)=>UP.push({
  id:'b'+i+'t'+k,kind:'tier',b:i,req,cost:b.base*TIER_MULT[k],art:'b'+i,tag:()=>'×2',
  name:[b.name[0]+': '+TIER_NAMES[k][0],b.name[1]+': '+TIER_NAMES[k][1]],
  desc:()=>tr('u_tier',{p:tx(b.plural)})+(i===0?tr('u_tier_click'):'')
})));
[['Frische Butter','Fresh Butter',2e3,'butter'],['Feinzucker','Fine Sugar',5e4,'sugar'],['Bourbon-Vanille','Bourbon Vanilla',2e6,'vanilla'],['Belgische Kuvertüre','Belgian Couverture',8e7,'choc'],
 ['Umluftofen','Convection Oven',3e9,'fan'],['Meisterbrief','Master Baker Certificate',1.2e11,'scroll'],['Geheimrezept','Secret Recipe',5e12,'book'],['Goldener Löffel','Golden Spoon',2e14,'spoon'],
 ['Kosmische Hefe','Cosmic Yeast',1e16,'spark'],['Sternenmehl','Stardust Flour',1e18,'star'],['Ewiges Feuer','Eternal Fire',1e20,'flame'],['Das Urrezept','The Primal Recipe',1e22,'infinity'],['Schwarzes-Loch-Mehl','Black Hole Flour',1e24,'moon'],['Quantenzucker','Quantum Sugar',1e26,'sugar'],['Singularitätsteig','Singularity Dough',1e28,'layers'],['Urknall-Ofen','Big Bang Oven',1e30,'flame'],['Multiversum-Rezept','Multiverse Recipe',1e33,'book'],['Das letzte Gewürz','The Final Spice',1e36,'crown']]
  .forEach((g,k)=>UP.push({id:'g'+k,kind:'global',cost:g[2],art:g[3],tag:()=>'+10 %',name:[g[0],g[1]],desc:()=>tr('u_global')}));
[['Haferflocken-Kekse','Oatmeal Cookies'],['Zimtsterne','Cinnamon Stars'],['Vanillekipferl','Vanilla Crescents'],['Linzer Augen','Linzer Eyes'],['Lebkuchenherzen','Gingerbread Hearts'],['Butterkekse','Butter Biscuits'],
 ['Spritzgebäck','Spritz Cookies'],['Schokoladenkekse','Chocolate Cookies'],['Kokosbusserl','Coconut Kisses'],['Nussecken','Nut Corners'],['Mohnkekse','Poppy Seed Cookies'],['Doppeldecker','Double Deckers'],['Marzipantaler','Marzipan Coins'],['Pfeffernüsse','Pepper Nuts'],['Florentiner','Florentines'],['Baiser-Küsse','Meringue Kisses'],['Amaretti','Amaretti'],['Biscotti','Biscotti']]
  .forEach((r,k)=>UP.push({id:'r'+k,kind:'recipe',cost:5e3*Math.pow(8,k),art:'r'+(k%12),tag:()=>'+5 %',name:r,desc:()=>tr('u_recipe')}));
[[3,1,'Omas Gartentipps',"Granny's Garden Tips"],[4,3,'Düngerstollen','Fertilizer Shafts'],[5,4,'Rohstoffzufuhr','Raw Material Supply'],[6,5,'Fabrikkredite','Factory Loans'],[7,6,'Spendenkonto','Donation Account'],
 [8,7,'Heiliger Zauber','Holy Magic'],[9,8,'Sternenzauber','Star Magic'],[10,9,'Weltraumproben','Space Samples'],[11,10,'Experimentierkammer','Experiment Chamber'],[12,11,'Zeitschleifen','Time Loops'],[13,12,'Gespiegelte Zeit','Mirrored Time'],[14,13,'Gebrochene Materie','Refracted Matter'],[15,14,'Paralleler Ofen','Parallel Oven'],[16,15,'Multiversum-Glut','Multiverse Embers'],[17,16,'Sternenfall','Starfall'],[18,17,'Ereignishorizont-Träume','Event Horizon Dreams'],[19,18,'Traum vom Anfang','Dream of the Beginning']]
  .forEach((s,k)=>UP.push({id:'s'+k,kind:'syn',t:s[0],s:s[1],cost:Math.round(B[s[0]].base*600),art:'b'+s[0],tag:()=>'+0,5 %',name:[s[2],s[3]],
    desc:()=>tr('u_syn',{t:tx(B[s[0]].plural),s:tx(B[s[1]].name)})}));
[['Flinke Finger','Nimble Fingers',1e5,.005],['Fingerspitzengefühl','Fingertip Feel',1e7,.005],['Zauberhände','Magic Hands',1e9,.01],['Meisterfinger','Master Fingers',1e11,.01],['Klickgott','Click God',1e13,.02]]
  .forEach((c,k)=>UP.push({id:'c'+k,kind:'click',cost:c[2],pct:c[3],art:'hand',tag:()=>tr('tag_click'),name:[c[0],c[1]],desc:()=>tr('u_click',{p:(c[3]*100).toLocaleString(LOC[LANG])})}));
[[100,1e3,'Klick-Training I','Click Training I'],[1e3,2e4,'Klick-Training II','Click Training II'],[1e4,5e5,'Klick-Training III','Click Training III'],[1e5,1e7,'Klick-Training IV','Click Training IV'],[1e6,1e10,'Klick-Training V','Click Training V'],[1e7,1e13,'Klick-Training VI','Click Training VI']]
  .forEach((c,k)=>UP.push({id:'x'+k,kind:'clickx',req:c[0],cost:c[1],art:'hand',tag:()=>'×2',name:[c[2],c[3]],desc:()=>tr('u_clickx')}));
[[3,1e6,'Goldener Magnet','Golden Magnet','magnet',{rate:.85},'u_gold_rate'],[7,1e8,'Goldstaub','Gold Dust','gold',{life:6},'u_gold_life'],[15,1e10,'Glücksbringer','Lucky Charm','lucky',{luck:1.25},'u_gold_luck'],[27,1e12,'Rauschverlängerung','Frenzy Extender','spark',{time:1.25},'u_gold_time']]
  .forEach((g,k)=>UP.push(Object.assign({id:'u'+k,kind:'goldu',req:g[0],cost:g[1],art:g[4],tag:()=>tr('tag_gold'),name:[g[2],g[3]],desc:()=>tr(g[6])},g[5])));