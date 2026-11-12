/* ======================= V68: Schneller Einstieg, Willkommens-Truhen ======================= */
var v68Ready=false,v68Sess=0;
/* Spielstand-Teil (wird in sanitize() aufgerufen, darum als Funktions-Deklaration).
   Alte Spielstände ohne den Eintrag bekommen keine Truhen mehr (n:3). */
function sanRet(o){
  const day=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)?v:'';
  if(!o||typeof o!=='object') return {n:3,a:'',s:''};
  return {n:Math.max(0,Math.min(3,Math.floor(+o.n||0))),a:day(o.a),s:day(o.s)};
}

/* ---------- 1. Kein Namens-Fenster mehr: neue Bäckereien bekommen gleich einen Namen ---------- */
const V68_NM={de:[['Sonnige','Goldene','Gemütliche','Fröhliche','Knusprige','Süße','Kleine','Warme'],['Backstube','Bäckerei','Keksküche']],
  en:[['Sunny','Golden','Cozy','Happy','Crispy','Sweet','Little','Warm'],['Bakery','Kitchen','Bakehouse','Cookie Shop']]};
function autoName(){const [a,n]=V68_NM[LANG==='de'?'de':'en'],p=x=>x[Math.floor(Math.random()*x.length)];return cleanName(p(a)+' '+p(n));}
if(!S.name){S.name=autoName();showName();}
/* Der Name oben ist ein Knopf: antippen zum Umbenennen */
{
  const e=$id('plName');
  e.setAttribute('role','button');e.tabIndex=0;
  const ren=()=>askName({title:tt('Bäckerei umbenennen','Rename your bakery'),text:tt('Wie soll deine Bäckerei heißen?','What should your bakery be called?'),ok:tt('Speichern','Save'),value:S.name},nm=>{S.name=nm;save();showName();if(typeof slotSig!=='undefined') slotSig='';toast(tt('Deine Bäckerei heißt jetzt ','Your bakery is now called ')+nm,true);});
  e.addEventListener('click',ren);
  e.addEventListener('keydown',k=>{if(k.key==='Enter'||k.key===' '){k.preventDefault();ren();}});
}

/* ---------- 2. Beim allerersten Besuch geht es ohne Startbildschirm direkt los (siehe 48-…) ----------
   Wer schon ein Konto hat, findet „Anmelden“ unter den ersten Schritten. */
function v68SignIn(){
  if($id('setOv').hidden) $id('setBtn').click();
  const sp=document.querySelector('#setSeg [data-sp=save]');if(sp) sp.click();
  accMode='login';accMsg='';accRender();
  setTimeout(()=>{const u=document.querySelector('#accF [name=user]');if(u) u.focus();},120);
}
const v68In=document.createElement('p');
v68In.className='v68in';v68In.hidden=true;
$id('tutBox').insertAdjacentElement('afterend',v68In);
v68In.addEventListener('click',e=>{if(e.target.closest('button')) v68SignIn();});

/* ---------- 3. Erste Schritte 1–4 holen sich selbst ab, ein Pfeil zeigt aufs erste Gebäude ---------- */
let v68Due=0,v68Scr=-1;
function v68Coach(){
  const st=tutStep();
  if(st&&S.tut.i<4&&startOv.hidden){
    let done=false;try{const [a,b]=st.p();done=a>=b;}catch(x){}
    if(!done) v68Due=0;
    else if(!v68Due) v68Due=Date.now();
    else if(Date.now()-v68Due>700){v68Due=0;const b=document.querySelector('#tutBox [data-tut]:not([data-tut="hide"])');if(b) b.click();}
  }else v68Due=0;
  const r=document.querySelector('#buildList .row.coachrow'),t='👉 '+tt('Kaufen!','Buy!');
  if(r){
    if(r.dataset.ct!==t) r.dataset.ct=t;
    /* Auf dem Handy liegt die Liste unter dem Keks: einmal pro Schritt hinscrollen */
    if(v68Scr!==S.tut.i&&document.documentElement.dataset.device==='phone'&&startOv.hidden&&!document.querySelector('.overlay:not([hidden])')){const q=r.getBoundingClientRect();v68Scr=S.tut.i;if(q.bottom>innerHeight||q.top<0) r.scrollIntoView({block:'center',behavior:document.documentElement.dataset.motion==='off'?'auto':'smooth'});}
  }
  const show=lbOn()&&!accTok&&S.tut.i<=1&&S.all<5000&&startOv.hidden;
  if(v68In.hidden===show){v68In.hidden=!show;}
  if(show){const h=tt('Schon ein Konto?','Already have an account?')+' <button type="button" class="linkbtn">'+tt('Anmelden','Sign in')+'</button>';if(v68In._h!==h){v68In._h=h;v68In.innerHTML=h;}}
}

/* ---------- 4. Willkommens-Truhen: an den nächsten 3 Tagen je eine Truhe, oben ein 🎁 mit Countdown ---------- */
const RET_GIFT=[{gem:10,min:20},{gem:15,egg:1,min:30},{gem:20,star:1,min:45}];
const RET_DEV='keksfabrik-chests';   /* pro Gerät höchstens 3 Truhen, auch über mehrere Spielstände */
const retDev=()=>Math.max(0,+lsGet(RET_DEV)||0);
const retToday=()=>dayKey(tNow());
const retTrust=()=>!lbOn()||(v67Ready&&(clkOk||clkMiss))||v68Sess>=20;
function retReady(){const R=S.ret;return !!(R&&R.a&&R.n<3&&retToday()>R.a&&retTrust());}
function retText(g){
  const p=[g.gem+' '+tt('Edelsteine','gems')];
  if(g.egg) p.push(tt('1 Ei','1 egg'));
  if(g.star) p.push(tt('1 Sternenkrümel','1 star crumb'));
  p.push(tt(g.min+' Minuten Backen',g.min+' minutes of baking'));
  return p.join(' + ');
}
function retLeft(){const n=new Date(tNow()),mid=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);return Math.max(60,(mid-n)/1000);}
function retCard(){
  const R=S.ret;if(!R||!R.a||R.n>=3) return;
  if(retReady()){retOpen();return;}
  const nx=LOGIN[S.day.streak%7];
  lbShowMsg(tt('Komm morgen wieder!','Come back tomorrow!'),
    '<p>'+tt('Truhe '+(R.n+1)+' von 3 öffnet sich morgen (in '+fmtDur(retLeft())+'):','Chest '+(R.n+1)+' of 3 opens tomorrow (in '+fmtDur(retLeft())+'):')+'</p>'
    +'<p><b>'+retText(RET_GIFT[R.n])+'</b></p>'
    +'<p class="small">🔥 '+tt('Login-Serie: Tag ','Login streak: day ')+S.day.streak+' · '+tt('Morgen gibt es außerdem: ','Tomorrow you also get: ')+loginText(nx)+'</p>'
    +'<p class="small">'+tt('Deine Bäckerei backt weiter, während du weg bist.','Your bakery keeps baking while you’re away.')+'</p>','🎁');
}
function retOpen(){
  if(!retReady()) return false;
  const R=S.ret,g=RET_GIFT[R.n],ck=Math.max(10000*g.min/60,C.kps0*60*g.min);
  addMat('gem',g.gem);addCk(ck);if(g.egg) S.w.pet.eggs++;
  if(g.star) giveStar(1,tt('Willkommens-Truhe','Welcome chest'),true);
  R.n++;R.a=R.n<3?retToday():'';R.s='';
  lsSet(RET_DEV,String(retDev()+1));
  recalc();save();snd('claim');
  if(typeof kfTrackStep==='function') kfTrackStep('chest'+R.n);
  lbShowMsg(tt('Truhe geöffnet!','Chest opened!'),
    '<p><b>+'+fmt(ck)+' '+tt('Kekse','cookies')+' · +'+g.gem+' '+tt('Edelsteine','gems')+(g.egg?' · '+tt('+1 Ei','+1 egg'):'')+(g.star?' · '+tt('+1 Sternenkrümel','+1 star crumb'):'')+'</b></p>'
    +'<p class="small">'+(R.n<3?tt('Die nächste Truhe öffnet sich morgen.','The next chest opens tomorrow.'):tt('Das war die letzte Willkommens-Truhe. Deine täglichen Login-Belohnungen gehen im Tab Ziele weiter.','That was the last welcome chest. Your daily login rewards keep going in the Goals tab.'))+'</p>','🎁');
  retChip();return true;
}
const retBtn=document.createElement('button');
retBtn.type='button';retBtn.className='btn retchip';retBtn.id='retChip';retBtn.hidden=true;
$id('ntfBtn').insertAdjacentElement('beforebegin',retBtn);
retBtn.addEventListener('click',retCard);
function retChip(){
  const R=S.ret,on=!!(R&&R.a&&R.n<3),rd=on&&retReady();
  if(retBtn.hidden===on) retBtn.hidden=!on;
  if(!on) return;
  const left=retLeft(),t=rd?tt('Öffnen!','Open!'):(left>=3600?Math.floor(left/3600)+' h':Math.ceil(left/60)+' min');
  const h='<span aria-hidden="true">🎁</span><span class="rt">'+t+'</span>';
  if(retBtn._h!==h){retBtn._h=h;retBtn.innerHTML=h;}
  retBtn.classList.toggle('ready',rd);
  const lb=rd?tt('Willkommens-Truhe öffnen','Open welcome chest'):tt('Nächste Willkommens-Truhe in ','Next welcome chest in ')+fmtDur(left);
  if(retBtn.getAttribute('aria-label')!==lb){retBtn.setAttribute('aria-label',lb);retBtn.title=lb;}
}
let retNoted=false;
function retTick(){
  const R=S.ret;if(!R) return;
  /* Truhen scharf schalten, sobald jemand wirklich spielt */
  if(!R.a&&R.n<3&&retDev()<3&&(S.tut.i>=2||v68Sess>=120)) R.a=retToday();
  retChip();
  const free=startOv.hidden&&!document.querySelector('.overlay:not([hidden])')&&!(typeof awayOpen!=='undefined'&&awayOpen);
  if(retReady()&&!retNoted&&free){retNoted=true;toast(tt('Deine Willkommens-Truhe ist bereit! Tipp oben auf 🎁.','Your welcome chest is ready! Tap 🎁 at the top.'),true);}
  /* Nach 4 Minuten Spielen einmal am Tag zeigen, was morgen wartet */
  if(R.a&&R.n<3&&R.s!==R.a&&R.a===retToday()&&v68Sess>=240&&free&&!$id('accHint')){R.s=R.a;retCard();}
}

setInterval(()=>{
  if(!document.hidden&&startOv.hidden) v68Sess+=.4;
  try{v68Coach();}catch(x){}
  try{retTick();}catch(x){}
},400);

v68Ready=true;
