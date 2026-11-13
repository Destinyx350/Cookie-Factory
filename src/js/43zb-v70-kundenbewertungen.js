/* ======================= V70: Kundenbewertungen ======================= */
/* Alle paar Minuten schreibt ein Kunde eine kurze Bewertung (1–5 Sterne). Die Sterne hängen davon ab, wie die Bäckerei
   gerade läuft: Auswahl (Gebäude-Arten), Aufträge, Wachstum der Produktion und Aufmerksamkeit (Klicks, Goldkekse).
   Der Schnitt der letzten 20 Bewertungen gibt ab 3 Sternen einen kleinen Bonus: bis +5 % Produktion bei 5,0. */
var v70Ready=false;
const RV_MAX=20;   /* RV_NAMES hat 24 Namen; sanRV prüft das mit Literalen */
const RV_TXT={
  'var+':[['So viel Auswahl – ich konnte mich kaum entscheiden!','So much choice – I could hardly decide!'],['Jedes Mal gibt es etwas Neues zu probieren.','There’s something new to try every time.'],['Von {a} bis {b} – hier gibt es einfach alles.','From {a} to {b} – this place has it all.']],
  'var-':[['Lecker, aber immer nur {b}. Mehr Auswahl wäre schön.','Tasty, but always just {b}. More choice would be nice.'],['Die Theke sieht ein bisschen leer aus.','The counter looks a bit empty.']],
  'ord+':[['Meine Bestellung war blitzschnell fertig!','My order was ready in a flash!'],['Ich habe eine Torte bestellt, und sie war perfekt.','I ordered a cake and it was perfect.']],
  'ord-':[['Ich habe etwas bestellt und warte immer noch …','I placed an order and I’m still waiting …'],['Bestellungen nehmen sie hier wohl nicht so ernst.','They don’t seem to take orders very seriously here.']],
  'gro+':[['Jedes Mal, wenn ich komme, ist die Bäckerei größer!','Every time I visit, the bakery is bigger!'],['Hier geht es richtig voran – beeindruckend.','Things are really moving here – impressive.']],
  'gro-':[['Seit letzter Woche hat sich hier nichts verändert.','Nothing has changed here since last week.'],['Gut, aber ein bisschen eingeschlafen.','Good, but a little sleepy.']],
  'act+':[['Der Bäcker hat mir beim Kneten zugewinkt!','The baker waved at me while kneading!'],['So freundlich und so frisch – danke!','So friendly and so fresh – thank you!']],
  'act-':[['Niemand war an der Theke.','Nobody was at the counter.'],['Die Kekse sind gut, aber der Laden wirkt verlassen.','The cookies are good, but the shop feels deserted.']],
  'mid':[['Ganz okay. Ich komme wieder.','Pretty okay. I’ll be back.'],['Solide Kekse, nichts Besonderes.','Solid cookies, nothing special.'],['Gut, aber da geht noch mehr.','Good, but there’s room to grow.']]
};
const RV_NAMES=['Mia','Leo','Ava','Finn','Zoe','Noah','Lina','Max','Ella','Ben','Ida','Tom','Rosa','Jan','Nora','Emil','Sara','Paul','Lea','Omar','Yuki','Ana','Ravi','Ivy'];
const RV_FACE=['','😞','😕','🙂','😋','🤩'];
/* Spielstand-Teil (wird in sanitize() aufgerufen, darum als Funktions-Deklaration) */
function sanRV(o){
  /* Läuft beim Laden des Spielstands, also bevor die Konstanten dieser Datei gesetzt sind: darum nur Zahlen und Literale hier. */
  if(!o||typeof o!=='object'||!Array.isArray(o.l)) return null;
  const num=(v,lo,hi,d)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d;},nb=B.length-1;
  const l=o.l.slice(-20).filter(r=>Array.isArray(r)&&isFinite(+r[0])&&[1,2,3,4,5].includes(+r[1])&&/^(var|ord|gro|act)[+-]\d$|^mid\d$/.test(String(r[2]))&&+r[3]>=0&&+r[3]<24)
    .map(r=>[+r[0],+r[1],String(r[2]),+r[3]|0,Array.isArray(r[4])?[num(r[4][0],0,nb,0)|0,num(r[4][1],0,nb,0)|0]:[0,0]]);
  return {l,nx:num(o.nx,0,3600,90),kp:num(o.kp,0,1e300,0),ck:num(o.ck,0,1e300,0),gd:num(o.gd,0,1e300,0),b5:o.b5?1:0};
}
function rvAvg(){const L=S.rv&&S.rv.l;if(!L||!L.length) return 0;return L.reduce((a,r)=>a+r[1],0)/L.length;}
/* Produktions-Bonus (in recalc): erst ab 3 Bewertungen, nur über 3 Sternen */
function rvMult(){if(!S||!S.rv||!S.rv.l||S.rv.l.length<3) return 1;return 1+.025*Math.max(0,rvAvg()-3);}
const rvOn=()=>S.all>=5000&&S.b.some(n=>n>0);
/* Was die Kunden gerade merken, je 0–1 */
function rvFactors(){
  const R=S.rv||{},own=S.b.filter(n=>n>0).length,top=S.b.reduce((m,n,i)=>n>0?i:m,-1);
  const vari=Math.min(1,own/Math.min(B.length,Math.max(3,top+1)));
  const ordOn=S.all>=UNL.orders,ord=ordOn?.3+.7*Math.min(1,(S.orders.heat||0)/3):.6;
  const g=R.kp>0?C.kps/R.kp:1.1,gro=g>=1.2?1:g>=1.02?.8:g>=.98?.5:.3;
  const act=Math.max(.2,Math.min(1,(S.clicks-(R.ck||0))/60)*.7+(S.gold>(R.gd||0)?.3:0));
  return {vari,ord,gro,act,ordOn};
}
function rvText(r){
  const k=r[2],key=k.startsWith('mid')?'mid':k.slice(0,4),i=+k.slice(-1),L=RV_TXT[key]||RV_TXT.mid,t=L[Math.min(i,L.length-1)];
  return tx(t).replace('{a}',tx(B[r[4][0]].name)).replace('{b}',tx(B[r[4][1]].name));
}
const rvQ=t=>tt('„','“')+t+tt('“','”');
function rvAgo(t){const m=Math.max(1,Math.round((Date.now()-t)/60000)),v=m<60?m+' min':m<1440?Math.round(m/60)+' h':Math.round(m/1440)+tt(' Tg.',' d');return tt('vor '+v,v+' ago');}
const rvStars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
function rvNew(){
  if(!S.rv) S.rv={l:[],nx:90,kp:C.kps,ck:S.clicks,gd:S.gold,b5:0};
  const R=S.rv,F=rvFactors(),sc=F.vari*.35+F.ord*.2+F.gro*.3+F.act*.15;
  const st=Math.max(1,Math.min(5,Math.round(1.6+3.6*sc+(Math.random()-.5))));
  const f=[['var',F.vari],['ord',F.ordOn?F.ord:.6],['gro',F.gro],['act',F.act]];
  let k;
  if(st>=4){const b=f.reduce((a,x)=>x[1]>a[1]?x:a);k=b[0]+'+';}
  else if(st<=2){const w=f.reduce((a,x)=>x[1]<a[1]?x:a);k=w[0]+'-';}
  else k='mid';
  k+=Math.floor(Math.random()*RV_TXT[k].length);
  const owned=S.b.map((n,i)=>[n,i]).filter(x=>x[0]>0),lo=owned.length?owned[0][1]:0,hi=owned.length?owned[owned.length-1][1]:0,most=owned.length?owned.reduce((a,x)=>x[0]>a[0]?x:a)[1]:0;
  const r=[Date.now(),st,k,Math.floor(Math.random()*RV_NAMES.length),[lo,k.startsWith('var-')?most:hi]];
  R.l.push(r);if(R.l.length>RV_MAX) R.l.splice(0,R.l.length-RV_MAX);
  if(st===5) R.b5=1;
  R.kp=C.kps;R.ck=S.clicks;R.gd=S.gold;R.nx=240+Math.floor(Math.random()*180);
  recalc();checkAch(false);rvChip();
  if(!$id('rvOv').hidden) rvRender();
  if(document.documentElement.dataset.quiet!=='1') toast(rvStars(st)+' '+rvQ(rvText(r))+' – '+RV_NAMES[r[3]],st===5);
  return r;
}
/* Chip unter der Qualität: ⭐ 4,3 · 12 */
const rvBtn=document.createElement('button');
rvBtn.type='button';rvBtn.className='qchip rvchip';rvBtn.id='rvChip';rvBtn.hidden=true;
$id('qChip').insertAdjacentElement('afterend',rvBtn);
function rvChip(){
  const L=S.rv&&S.rv.l,on=!!(L&&L.length);
  if(rvBtn.hidden===on) rvBtn.hidden=!on;
  if(!on) return;
  const t='⭐ '+rvAvg().toLocaleString(LOC[LANG],{minimumFractionDigits:1,maximumFractionDigits:1})+' · '+L.length;
  if(rvBtn.textContent!==t) rvBtn.textContent=t;
  const lb=tt('Kundenbewertungen ansehen','See customer reviews');if(rvBtn.getAttribute('aria-label')!==lb) rvBtn.setAttribute('aria-label',lb+': '+t);
}
function rvRender(){
  setTxt($id('rvT'),tt('Kundenbewertungen','Customer reviews'));setTxt($id('rvClose'),tt('Schließen','Close'));
  const L=(S.rv&&S.rv.l)||[],avg=rvAvg(),F=rvFactors(),pc=(rvMult()-1)*100;
  const bar=(ic,l,v,tip)=>'<div class="rvf"><span class="rvfl">'+ic+' '+l+'</span><span class="rvfb"><i style="width:'+Math.round(v*100)+'%"></i></span><small>'+tip+'</small></div>';
  let h='<div class="rvtop"><div class="rvbig">'+(L.length?avg.toLocaleString(LOC[LANG],{minimumFractionDigits:1,maximumFractionDigits:1}):'–')+'<span class="rvst" aria-hidden="true">'+rvStars(Math.round(avg))+'</span></div><p class="small">'
    +(L.length<3?tt('Ab 3 Bewertungen gibt deine Bewertung einen Bonus.','From 3 reviews on, your rating gives a bonus.')
      :pc>0?tt('Deine Bewertung gibt dir ','Your rating gives you ')+'<b>+'+pc.toLocaleString(LOC[LANG],{maximumFractionDigits:1})+' % '+tt('Produktion','production')+'</b>.'
      :tt('Über 3 Sternen gibt deine Bewertung einen Bonus (bis +5 % Produktion).','Above 3 stars your rating gives a bonus (up to +5% production).'))
    +' '+tt('Es zählen die letzten 20 Bewertungen.','The last 20 reviews count.')+'</p></div>'
    +'<h3 class="wt">'+tt('Darauf achten die Kunden','What customers notice')+'</h3>'
    +bar('🧁',tt('Auswahl','Variety'),F.vari,tt('Besitze viele Gebäude-Arten.','Own many kinds of buildings.'))
    +bar('📜',tt('Aufträge','Orders'),F.ord,F.ordOn?tt('Erledige Kundenaufträge (Tab Aufträge).','Complete customer orders (Orders tab).'):tt('Aufträge kommen später dazu.','Orders unlock later.'))
    +bar('📈',tt('Wachstum','Growth'),F.gro,tt('Lass deine Produktion weiter wachsen.','Keep your production growing.'))
    +bar('👋',tt('Aufmerksamkeit','Attention'),F.act,tt('Klick ab und zu auf den Keks und fang Goldkekse.','Click the cookie now and then and catch golden cookies.'))
    +'<h3 class="wt">'+tt('Neueste Bewertungen','Latest reviews')+'</h3>';
  h+=L.length?'<ul class="rvlist">'+L.slice().reverse().map(r=>'<li><span class="rvav" aria-hidden="true">'+RV_FACE[r[1]]+'</span><span><b>'+RV_NAMES[r[3]]+'</b> <span class="rvst" aria-label="'+r[1]+' '+tt('von 5 Sternen','of 5 stars')+'">'+rvStars(r[1])+'</span><span class="rvtx">'+rvQ(escName(rvText(r)))+'</span><small>'+rvAgo(r[0])+'</small></span></li>').join('')+'</ul>'
    :'<p class="small">'+tt('Noch keine Bewertungen. Die ersten Kunden kommen bald!','No reviews yet. The first customers are on their way!')+'</p>';
  const b=$id('rvBody');if(b._h!==h){b._h=h;b.innerHTML=h;}
}
function rvOpen(){rvRender();$id('rvOv').hidden=false;$id('rvClose').focus();}
function rvClose(){if($id('rvOv').hidden) return;$id('rvOv').hidden=true;rvBtn.focus();}
rvBtn.addEventListener('click',rvOpen);
$id('rvClose').addEventListener('click',rvClose);
$id('rvOv').addEventListener('click',e=>{if(e.target===$id('rvOv')) rvClose();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$id('rvOv').hidden){e.preventDefault();e.stopImmediatePropagation();rvClose();}},true);
/* Takt: Zeit zählt nur, während gespielt wird */
setInterval(()=>{
  try{
    rvChip();
    if(document.hidden||!startOv.hidden||!rvOn()) return;
    if(!S.rv) S.rv={l:[],nx:90,kp:C.kps,ck:S.clicks,gd:S.gold,b5:0};
    S.rv.nx-=1;
    if(S.rv.nx<=0) rvNew();
    if(!$id('rvOv').hidden&&Math.random()<.2) rvRender();
  }catch(x){}
},1000);
v70Ready=true;
