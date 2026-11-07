/* ===== Audio-Engine: alles selbst erzeugt (keine Dateien) ===== */
let actx=null,AU=null,sndLast=0,sndAny=0,uiLast=0;
const SNG={click:'click',buy:'buy',coin:'buy',gold:'gold',ach:'ach',star:'other',claim:'other',level:'other',tick:'other',win:'other',tab:'ui',ui:'ui',sel:'ui',on:'ui',off:'ui',open:'ui',close:'ui',nope:'ui'};
const gestured=()=>!navigator.userActivation||navigator.userActivation.hasBeenActive;
function getCtx(){
  if(!actx){if(!gestured()) return null;const AC=window.AudioContext||window.webkitAudioContext;if(!AC) return null;try{actx=new AC({latencyHint:'playback'});}catch(e){try{actx=new AC();}catch(e2){return null;}}}
  if(!AU) initAU();
  if(actx.state==='suspended'&&!(document.hidden&&S.opt.bgm)&&!adMute) actx.resume().catch(()=>{});
  return actx;
}
function irBuf(sec,decay){const r=actx.sampleRate,n=Math.floor(r*sec),b=actx.createBuffer(2,n,r);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;}
function initAU(){
  const comp=actx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.connect(actx.destination);
  const rev=actx.createConvolver();rev.buffer=irBuf(1.8,3);
  const sfx=actx.createGain();sfx.connect(comp);
  const sfxRev=actx.createGain();sfxRev.gain.value=.16;sfx.connect(sfxRev);sfxRev.connect(rev);
  const mus=actx.createGain();mus.gain.value=0;
  const musDry=actx.createGain();mus.connect(musDry);musDry.connect(comp);
  const musRev=actx.createGain();musRev.gain.value=.35;mus.connect(musRev);musRev.connect(rev);
  const revOut=actx.createGain();revOut.gain.value=.8;rev.connect(revOut);revOut.connect(comp);
  const noise=actx.createBuffer(1,actx.sampleRate,actx.sampleRate);{const d=noise.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;}
  AU={comp,rev,sfx,mus,musRev,noise};
}
function tone(dst,f,t,d,o){
  o=o||{};const os=actx.createOscillator(),g=actx.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);
  if(o.f2) os.frequency.exponentialRampToValueAtTime(o.f2,t+(o.fd||d));
  if(o.det) os.detune.value=o.det;
  const amp=Math.max(.0002,o.amp||.3),at=o.a||.005;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amp,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(d,at+.01));
  let n=os;if(o.lp){const fl=actx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;fl.Q.value=o.q||.8;os.connect(fl);n=fl;}
  n.connect(g);g.connect(dst);os.start(t);os.stop(t+d+.05);
}
function nz(dst,t,d,o){
  o=o||{};const s=actx.createBufferSource();s.buffer=AU.noise;const g=actx.createGain();let n=s;
  const add=(type,fq)=>{const f=actx.createBiquadFilter();f.type=type;f.frequency.value=fq;f.Q.value=o.q||.8;n.connect(f);n=f;};
  if(o.hp) add('highpass',o.hp);if(o.lp) add('lowpass',o.lp);if(o.bp) add('bandpass',o.bp);
  g.gain.setValueAtTime(Math.max(.0002,o.amp||.2),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(g);g.connect(dst);s.start(t,Math.random()*.6);s.stop(t+d+.02);
}
function padV(dst,f,t,d,amp,lp){
  [-8,8].forEach(dt=>{const o=actx.createOscillator(),fl=actx.createBiquadFilter(),g=actx.createGain();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;fl.type='lowpass';fl.frequency.value=lp||900;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+Math.min(1.2,d*.3));g.gain.setValueAtTime(amp,t+d*.75);g.gain.linearRampToValueAtTime(0,t+d);o.connect(fl);fl.connect(g);g.connect(dst);o.start(t);o.stop(t+d+.05);});
}
const mHz=m=>440*Math.pow(2,(m-69)/12);
/* Soundeffekte */
const SFX={
  click(o,t,v){const p=1+(Math.random()-.5)*.3;nz(o,t,.06,{amp:v*.55,bp:2200*p,q:1.4});tone(o,480*p,t,.08,{type:'triangle',amp:v*.45,f2:260*p});},
  buy(o,t,v){tone(o,988,t,.14,{amp:v*.45,a:.002});tone(o,1480,t+.055,.26,{amp:v*.42,a:.002});tone(o,2960,t+.055,.09,{amp:v*.1,a:.001});},
  coin(o,t,v){SFX.buy(o,t,v);},
  gold(o,t,v){[1047,1319,1568,2093,2637].forEach((f,i)=>{tone(o,f,t+i*.055,.55,{amp:v*.32,a:.002});tone(o,f*2.76,t+i*.055,.18,{amp:v*.06,a:.001});});nz(o,t,.6,{amp:v*.06,hp:6000});},
  ach(o,t,v){[[523,0],[659,.09],[784,.18],[1047,.27]].forEach(([f,d],i)=>{tone(o,f,t+d,i===3?.7:.16,{type:'triangle',amp:v*.4,a:.004});tone(o,f*2,t+d,i===3?.5:.12,{amp:v*.12});});tone(o,2093,t+.27,1.1,{amp:v*.12,a:.002});},
  star(o,t,v){[1319,1568,1976,2349,2637,3136].forEach((f,i)=>tone(o,f,t+i*.045,.5,{amp:v*.22,a:.002}));nz(o,t,.8,{amp:v*.05,hp:7000});},
  claim(o,t,v){tone(o,784,t,.12,{type:'triangle',amp:v*.4});tone(o,1175,t+.08,.3,{type:'triangle',amp:v*.4});tone(o,2350,t+.08,.15,{amp:v*.08});},
  level(o,t,v){tone(o,392,t,.5,{type:'triangle',amp:v*.35,f2:1568,fd:.35});[784,988,1175].forEach((f,i)=>tone(o,f,t+.3+i*.07,.4,{amp:v*.25}));},
  tab(o,t,v,x){const f=[523,587,659,698,784,880,988,1047][x|0]||660;tone(o,f,t,.11,{amp:v*.28,a:.003});tone(o,f*2,t,.05,{amp:v*.07});nz(o,t,.05,{amp:v*.07,hp:4000});},
  ui(o,t,v){tone(o,1350,t,.045,{amp:v*.2,a:.002,f2:950});},
  sel(o,t,v){tone(o,700,t,.07,{amp:v*.24,a:.003,f2:1050,fd:.05});},
  on(o,t,v){tone(o,660,t,.06,{amp:v*.24});tone(o,990,t+.05,.09,{amp:v*.24});},
  off(o,t,v){tone(o,990,t,.06,{amp:v*.2});tone(o,620,t+.05,.09,{amp:v*.2});},
  open(o,t,v){tone(o,320,t,.2,{amp:v*.2,f2:760,fd:.16});nz(o,t,.18,{amp:v*.05,bp:2500,q:.6});},
  close(o,t,v){tone(o,760,t,.17,{amp:v*.17,f2:330,fd:.14});},
  tick(o,t,v){tone(o,1800,t,.025,{amp:v*.16,a:.001});nz(o,t,.02,{amp:v*.08,hp:5000});},
  win(o,t,v){[659,784,988,1319].forEach((f,i)=>tone(o,f,t+i*.07,.35,{type:'triangle',amp:v*.32}));},
  nope(o,t,v){tone(o,170,t,.09,{type:'square',amp:v*.11,lp:900});tone(o,140,t+.1,.12,{type:'square',amp:v*.11,lp:900});}
};
function snd(kind,x){
  const v=[0,.4,.85][S.opt.vol|0];if(!v) return;
  const grp=SNG[kind]||'other';if(S.opt.sn[grp]===false) return;
  if(document.hidden&&S.opt.bgm) return;
  const now=performance.now();
  if(kind==='click'){if(now-sndLast<45) return;sndLast=now;}
  if(grp==='ui'){if(now-uiLast<40) return;uiLast=now;}else sndAny=now;
  try{
    if(!getCtx()||!SFX[kind]) return;
    SFX[kind](AU.sfx,actx.currentTime+.01,v,x);
  }catch(e){}
}
/* Musik: 5 Stücke, live erzeugt */
const TRK={
  bake:{n:['Gemütliche Backstube','Cozy Bakery'],d:['Ruhig & warm','Calm & warm'],bpm:80,rev:.4,spb:16,ch:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]],root:[48,45,41,43],sc:[60,62,64,67,69,72,74,76,79],lead:'keys',dens:.42,len:[2,4],pad:.035,padLp:750,bass:[0,10],dr:{sh:[2,6,10,14],k:[0]}},
  market:{n:['Fröhlicher Markt','Happy Market'],d:['Fröhlich & flott','Happy & lively'],bpm:116,rev:.22,spb:16,swing:.08,ch:[[65,69,72],[70,74,77],[72,76,79],[65,69,72],[62,65,69],[70,74,77],[72,76,79],[67,72,76]],root:[41,46,48,41,38,46,48,48],sc:[65,67,69,72,74,77,79,81,84],lead:'marimba',dens:.6,len:[1,2],stab:[2,6,10,14],stabI:'marimba',bass:[0,6,8,14],alt:1,dr:{k:[0,8],h:[2,6,10,14],sn:[4,12],soft:1}},
  stars:{n:['Sternennacht','Starry Night'],d:['Verträumt, mit Glocken','Dreamy, with bells'],bpm:62,rev:.75,spb:16,ch:[[57,60,64,71],[53,57,60,64],[48,52,55,59],[52,55,59,62]],root:[45,41,36,40],sc:[69,71,72,74,76,79,81,83,84],lead:'bell',dens:.26,len:[4,8],pad:.04,padLp:1300,bass:[0],dr:{}},
  adv:{n:['Abenteuer','Adventure'],d:['Spannend, mit Trommeln','Exciting, with drums'],bpm:104,rev:.3,spb:16,ch:[[62,65,69],[58,62,65],[53,57,60],[60,64,67]],root:[38,34,41,36],sc:[62,64,65,67,69,70,72,74,76],lead:'str',dens:.55,len:[1,3],pad:.03,padLp:700,bass:[0,2,4,6,8,10,12,14],dr:{k:[0,6,8],sn:[4,12],h:[0,2,4,6,8,10,12,14],roll:1}},
  fest:{n:['Keks-Fest','Cookie Festival'],d:['Festlicher Walzer','Festive waltz'],bpm:150,rev:.3,spb:12,ch:[[67,71,74],[72,76,79],[74,78,81],[67,71,74],[64,67,71],[72,76,79],[74,78,81],[74,77,81]],root:[43,48,50,43,40,48,50,50],sc:[67,69,71,72,74,76,78,79,81,83],lead:'pluck',dens:.55,len:[2,4],stab:[4,8],stabI:'keys',bass:[0],dr:{k:[0],h:[4,8]}}
};
const TRK_IDS=Object.keys(TRK);
const TAB_TRK={build:'bake',up:'bake',work:'market',orders:'market',world:'adv',ach:'fest',shop:'fest',asc:'stars'};
const M={trk:null,step:0,t:0,P:null,Q:null,sw:0,swT:0};
function curTrk(){const o=S.opt.trk||'auto';if(TRK[o]) return o;const sel=tabs.find(t=>t.getAttribute('aria-selected')==='true');return TAB_TRK[sel?sel.dataset.tab:'build']||'bake';}
function genPhrase(T){
  const P={},n=T.sc.length;let i=Math.floor(n/2);
  for(let s=0;s<T.spb*2;s+=2){
    const strong=s%(T.spb/2)===0;
    if(Math.random()<T.dens*(strong?1.5:1)){
      i=Math.max(0,Math.min(n-1,i+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)]));
      const len=T.len[0]+Math.floor(Math.random()*(T.len[1]-T.len[0]+1));P[s]={i,len};
      if(len>2) s+=2*Math.floor((len-1)/2);
    }
  }
  return P;
}
function inst(k,o,f,t,d,a){
  switch(k){
    case 'keys':tone(o,f,t,d*1.5+.35,{amp:a,a:.008});tone(o,f*2,t,.45,{amp:a*.2});tone(o,f*3.01,t,.1,{amp:a*.1,a:.002});break;
    case 'bell':tone(o,f,t,2.6,{amp:a,a:.004});tone(o,f*2.76,t,1,{amp:a*.26,a:.002});tone(o,f*5.4,t,.3,{amp:a*.08,a:.002});break;
    case 'marimba':tone(o,f,t,.42,{amp:a,a:.003});tone(o,f*4,t,.06,{amp:a*.3,a:.001});break;
    case 'pluck':tone(o,f,t,.55,{type:'triangle',amp:a,a:.003,lp:2800});tone(o,f*2,t,.14,{amp:a*.22,a:.002});break;
    case 'str':tone(o,f,t,Math.max(.2,d),{type:'sawtooth',amp:a*.55,a:.025,lp:1700});tone(o,f*1.004,t,Math.max(.2,d),{type:'sawtooth',amp:a*.4,a:.025,lp:1500});break;
  }
}
function playStep(T,s,t){
  const spb=T.spb,bar=Math.floor(s/spb),st=s%spb,ci=bar%T.ch.length,ch=T.ch[ci],root=T.root[ci],o=AU.mus,sd=60/T.bpm/4,barD=sd*spb;
  if(st===0&&(bar%16===0||!M.P)){M.P=genPhrase(T);M.Q=genPhrase(T);}
  if(st===0&&T.pad) ch.forEach(m=>padV(o,mHz(m-12),t,barD+.4,T.pad,T.padLp));
  if(T.stab&&T.stab.includes(st)) ch.forEach(m=>inst(T.stabI,o,mHz(m),t,sd,.05));
  if(T.bass.includes(st)){const k=T.bass.indexOf(st),f=mHz(root+(T.alt&&k%2?7:0));tone(o,f,t,Math.min(barD,sd*(T.bass.length>2?2:6)),{type:'triangle',amp:.26,a:.01,lp:520});tone(o,f/2,t,Math.min(barD,sd*4),{amp:.12,a:.01});}
  const D=T.dr;
  if(D.k&&D.k.includes(st)) tone(o,140,t,.3,{amp:.5,a:.002,f2:42,fd:.18});
  if(D.sn&&(D.sn.includes(st)||(D.roll&&bar%4===3&&st>=13))){nz(o,t,.15,{amp:D.soft?.08:.17,bp:1900,q:.7});tone(o,210,t,.07,{type:'triangle',amp:D.soft?.05:.1,f2:150});}
  if(D.h&&D.h.includes(st)) nz(o,t,.035,{amp:.045,hp:7500});
  if(D.sh&&D.sh.includes(st)) nz(o,t,.07,{amp:.035,hp:5500});
  const ph=(bar%8>=6?M.Q:M.P),p=ph&&ph[(bar%2)*spb+st];
  if(p){
    let m=T.sc[p.i];
    if(st%4===0){const pcs=ch.map(x=>x%12);if(!pcs.includes(m%12)) for(const d of [1,-1,2,-2]){const j=p.i+d;if(T.sc[j]!==undefined&&pcs.includes(T.sc[j]%12)){m=T.sc[j];break;}}}
    inst(T.lead,o,mHz(m),t,p.len*sd,T.lead==='bell'?.13:.16);
  }
}
function startTrk(id,t){M.trk=id;M.step=0;M.t=t;M.P=null;M.Q=null;AU.musRev.gain.setTargetAtTime(TRK[id].rev,t,.2);}
function musTick(){
  if(!actx||!AU) return;
  const want=[0,.5,1][S.opt.mus|0]*.9,now=actx.currentTime;
  if(!want){if(M.trk){AU.mus.gain.setTargetAtTime(0,now,.25);M.trk=null;}return;}
  if(actx.state!=='running') return;
  const id=curTrk();
  if(!M.trk){startTrk(id,now+.1);AU.mus.gain.setTargetAtTime(want,now,.6);}
  else if(id!==M.trk&&!M.sw){M.sw=1;M.swT=now+1;AU.mus.gain.setTargetAtTime(0,now,.3);}
  if(M.sw&&now>=M.swT){M.sw=0;startTrk(curTrk(),now+.05);AU.mus.gain.setTargetAtTime(want,now,.5);}
  else if(!M.sw) AU.mus.gain.setTargetAtTime(want,now,.3);
  if(M.t<now) M.t=now+.05;
  const T=TRK[M.trk],ahead=document.hidden?2:.5,sd=60/T.bpm/4;
  let n=0;
  while(M.t<now+ahead&&n<64){const sw=T.swing&&M.step%2?T.swing*sd*2:0;playStep(T,M.step,M.t+sw);M.t+=sd;M.step++;n++;}
}
addEventListener('pointerdown',()=>{getCtx();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!actx) return;if(document.hidden&&S.opt.bgm) actx.suspend().catch(()=>{});else if(!document.hidden&&!adMute) actx.resume().catch(()=>{});});
/* Töne für alle Knöpfe, Tabs, Schalter und Fenster */
document.addEventListener('click',e=>{
  const el=e.target.closest('button,[role="tab"],summary,input[type="checkbox"],.chip,a');
  if(!el||el.closest('#cookie')||el.closest('.golden')) return;
  const t0=performance.now();
  setTimeout(()=>{
    if(sndAny>=t0) return;
    let k='ui',x=0;
    if(el.matches('[role="tab"]')){k='tab';x=tabs.indexOf(el);}
    else if(el.matches('input[type="checkbox"]')) k=el.checked?'on':'off';
    else if(el.matches('summary')) k=el.parentElement&&el.parentElement.open?'open':'close';
    else if(el.closest('.seg,.chips,.accs,.setseg,#upCats')) k='sel';
    snd(k,x);
  },0);
},true);
{
  let ovReady=false;setTimeout(()=>{ovReady=true;},1500);
  const mo=new MutationObserver(ms=>{if(!ovReady) return;for(const m of ms){if(m.attributeName!=='hidden') continue;const op=!m.target.hidden;if(op!==(m.oldValue===null)) {snd(op?'open':'close');sndAny=performance.now();}}});
  document.querySelectorAll('.overlay').forEach(o=>mo.observe(o,{attributes:true,attributeFilter:['hidden'],attributeOldValue:true}));
}
document.getElementById('sndSeg').addEventListener('click',e=>{
  const b=e.target.closest('[data-vol]');if(!b) return;
  S.opt.vol=+b.dataset.vol;render();snd('claim');
});

/* Ziele: Täglich + Statistik */
let gSub='daily',dayT=0,histT=0;
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function genQuests(){
  const ids=QUESTS.map(q=>q.id).filter(id=>(!['mon','cast','exp'].includes(id)||S.all>=UNL.world)&&(id!=='ord'||S.all>=UNL.orders));
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0,3).map((id,d)=>{const q=QUESTS.find(x=>x.id===id);return {id,d,goal:q.rel?Math.max(1000,Math.ceil(C.kps0*q.g[d])):q.g[d],base:q.v(),c:0};});
}
function checkDay(silent){
  const D=S.day,now=Date.now(),today=dayKey(now);
  if(D.date===today&&D.last===today) return false;
  if(D.date!==today){D.date=today;D.q=genQuests();D.bonus=0;}
  if(D.last!==today){D.streak=D.last===dayKey(now-864e5)?D.streak+1:1;D.best=Math.max(D.best,D.streak);D.last=today;}
  if(!silent) toast(tt('Ein neuer Tag! Neue Tagesaufgaben warten im Tab Ziele.','A new day! New daily tasks are waiting in the Goals tab.'),true);
  return true;
}
const qDef=q=>QUESTS.find(x=>x.id===q.id);
const qProg=q=>Math.max(0,Math.min(q.goal,qDef(q).v()-q.base));
const qDone=q=>qProg(q)>=q.goal;
const qReward=q=>Math.ceil(Math.max(1000,C.kps0*[300,600,1200][q.d]));
const loginDay=()=>(Math.max(1,S.day.streak)-1)%7;
const loginGot=()=>S.day.lc===dayKey(Date.now());
function addCk(g){S.cookies+=g;S.run+=g;S.all+=g;S.day.q.forEach(q=>{if(q.id==='bake'&&!q.c) q.base+=g;});}
function loginText(r){
  const p=[];
  if(r.c) p.push(fmt(Math.max(1000,C.kps0*r.c))+' '+tt('Kekse','cookies'));
  if(r.gem) p.push(r.gem+' '+matName('gem'));
  if(r.egg) p.push(tt('1 Ei','1 egg'));
  if(r.star) p.push(tt('1 Sternenkrümel','1 star crumb'));
  return p.join(' + ');
}
function claimLogin(){
  if(loginGot()) return false;
  const r=LOGIN[loginDay()];S.day.lc=dayKey(Date.now());addPP(10);
  if(r.c) addCk(Math.max(1000,C.kps0*r.c));
  if(r.gem) addMat('gem',r.gem);
  if(r.egg) S.w.pet.eggs++;
  toast(tt('Login-Belohnung: ','Login reward: ')+loginText(r),true);
  if(r.star) giveStar(r.star,tt('Login-Serie','Login streak'));
  snd('claim');return true;
}
function claimQuest(i){
  const q=S.day.q[i];if(!q||q.c||!qDone(q)) return false;
  q.c=1;S.day.total++;addPP(10);
  const g=qReward(q);addCk(g);let ex='';
  if(q.d===2){addMat('gem',2);ex=' + 2 '+matName('gem');}
  toast(tt('Aufgabe geschafft: +','Task done: +')+fmt(g)+ex,true);snd('claim');
  return true;
}
const bonusReady=()=>!S.day.bonus&&S.day.q.length===3&&S.day.q.every(q=>q.c);
function claimBonus(){
  if(!bonusReady()) return false;
  S.day.bonus=1;addPP(20);
  const g=Math.ceil(Math.max(5000,C.kps0*1800));addCk(g);addMat('gem',5);
  toast(tt('Bonus-Truhe: +','Bonus chest: +')+fmt(g)+' + 5 '+matName('gem'),true);
  if(Math.random()<.15) giveStar(1,tt('Bonus-Truhe','Bonus chest'));
  snd('claim');flash(.25,700);return true;
}
const goalsReady=()=>!loginGot()||S.day.q.some(q=>!q.c&&qDone(q))||bonusReady()||passReady()||bookReady();
function fmtDur(s){
  s=Math.floor(s);const d=Math.floor(s/86400),hh=Math.floor(s%86400/3600),mm=Math.floor(s%3600/60);
  if(d) return d+' d '+hh+' h';
  if(hh) return hh+' h '+mm+' min';
  return mm+' min '+(s%60)+' s';
}
function dailyR(){
  const D=S.day,li=loginDay(),got=loginGot(),live={},wid={};
  let h='<section class="wsec first"><h3 class="wt">'+tt('Login-Serie','Login streak')+' · '+tt('Tag ','Day ')+D.streak+'</h3><p class="small wnote">'+tt('Spiel jeden Tag, dann wird die Belohnung besser. Nach Tag 7 geht es von vorne los. Längste Serie: ','Play every day and the reward gets better. After day 7 it starts over. Longest streak: ')+D.best+'</p><div class="lgrid">';
  LOGIN.forEach((r,i)=>{const st=(i<li||(i===li&&got))?' done':i===li?' now':'';h+='<div class="lday'+st+'"><b>'+tt('Tag ','Day ')+(i+1)+'</b><span>'+loginText(r)+'</span></div>';});
  h+='</div><div class="btns" style="margin-top:10px"><button type="button" class="btn primary'+(got?' dis':'')+'" data-gc="login">'+(got?tt('Heute schon abgeholt','Already claimed today'):tt('Belohnung abholen','Claim reward'))+'</button></div></section>';
  h+='<section class="wsec"><h3 class="wt">'+tt('Tagesaufgaben','Daily tasks')+'</h3><p class="small wnote">'+tt('Neue Aufgaben in ','New tasks in ')+wLive('left')+'. '+tt('Schaffst du alle 3, gibt es eine Bonus-Truhe.','Finish all 3 for a bonus chest.')+'</p><div class="list">';
  const n=new Date(),mid=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);live.left=fmtDur((mid-n)/1000);
  D.q.forEach((q,i)=>{
    const d=qDef(q),p=qProg(q),done=p>=q.goal;
    const act=q.c?'<span class="wk-on">'+tt('Erledigt','Done')+'</span>':'<button type="button" class="btn sm primary'+(done?'':' dis')+'" data-gc="q:'+i+'">'+tt('Abholen','Claim')+'</button>';
    live['p'+i]=fmt(p)+' / '+fmt(q.goal);live['r'+i]=fmt(qReward(q))+(q.d===2?' + 2 '+matName('gem'):'');wid['p'+i]=p/q.goal*100;
    h+='<div class="wcard"><span class="ico">'+art(d.art)+'</span><span class="info"><span class="nm"><span>'+tx(d.n).replace('{g}',fmt(q.goal))+'</span></span><span class="sub">'+[tt('Leicht','Easy'),tt('Mittel','Medium'),tt('Schwer','Hard')][q.d]+' · '+wLive('p'+i)+' · '+tt('Belohnung: ','Reward: ')+wLive('r'+i)+'</span>'+wBar('p'+i)+'</span><span class="oact">'+act+'</span></div>';
  });
  const br=bonusReady();
  h+='<div class="wcard"><span class="ico">'+art('box')+'</span><span class="info"><span class="nm"><span>'+tt('Bonus-Truhe','Bonus chest')+'</span></span><span class="sub">'+tt('Für alle 3 Aufgaben: Kekse, 5 Edelsteine und 15 % Chance auf einen Sternenkrümel.','For all 3 tasks: cookies, 5 gems and a 15% chance of a star crumb.')+'</span></span><span class="oact">'+(D.bonus?'<span class="wk-on">'+tt('Abgeholt','Claimed')+'</span>':'<button type="button" class="btn sm primary'+(br?'':' dis')+'" data-gc="bonus">'+tt('Öffnen','Open')+'</button>')+'</span></div>';
  h+='</div></section>';
  return {html:h,live,wid};
}
function chartHTML(hist){
  if(hist.length<2) return '<div class="chart"><p class="small">'+tt('Der Verlauf füllt sich jede Minute, in der du spielst.','The chart fills up every minute you play.')+'</p></div>';
  const L=hist.map(v=>Math.log10(Math.max(1,v))),mn=Math.min(...L),mx=Math.max(...L),r=Math.max(.01,mx-mn);
  const pts=L.map((v,i)=>(i/(L.length-1)*300).toFixed(1)+','+(96-(v-mn)/r*92).toFixed(1)).join(' ');
  return '<div class="chart"><svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+pts+'"/></svg><div class="ax"><span>'+tt('vor ','')+hist.length+tt(' min',' min ago')+'</span><span>'+fmtRate(Math.pow(10,mn))+' – '+fmtRate(Math.pow(10,mx))+' '+tt('pro Sekunde','per second')+'</span><span>'+tt('jetzt','now')+'</span></div></div>';
}
function statsR(){
  const st=S.stat,live={};
  const rows=[
    ['time',tt('Spielzeit','Play time'),fmtDur(st.time)],
    ['since',tt('Spielstand seit','Save started'),new Date(st.since).toLocaleDateString(LOC[LANG])],
    ['all',tt('Kekse insgesamt','Cookies baked in total'),fmt(S.all)],
    ['run',tt('Kekse diese Runde','Cookies this run'),fmt(S.run)],
    ['kps',tt('Kekse pro Sekunde','Cookies per second'),fmtRate(C.kps)],
    ['best',tt('Rekord pro Sekunde','Best per second'),fmtRate(st.best)],
    ['clicks',tt('Klicks','Clicks'),fmt(S.clicks)],
    ['click',tt('Kekse pro Klick','Cookies per click'),fmtRate(C.click)],
    ['gold',tt('Goldkekse','Golden cookies'),fmt(S.gold)],
    ['bought',tt('Gebäude gekauft','Buildings bought'),fmt(S.bought)],
    ['own',tt('Gebäude jetzt','Buildings now'),fmt(S.b.reduce((a,b)=>a+b,0))],
    ['ms',tt('Meilensteine','Milestones'),msTotal()+' / '+B.length*MS.length],
    ['ups',tt('Upgrades','Upgrades'),Object.keys(S.up).length+' / '+UP.length],
    ['ach',tt('Erfolge','Achievements'),Object.keys(S.ach).length+' / '+A.length],
    ['asc',tt('Aufstiege','Ascensions'),String(S.asc)],
    ['chips',tt('Himmelschips','Heavenly chips'),fmt(S.chips)],
    ['reb',tt('Wiedergeburten','Rebirths'),String(S.reb.n)],
    ['pages',tt('Rezeptseiten','Recipe pages'),String(S.reb.pages)],
    ['mon',tt('Monster besiegt','Monsters beaten'),fmt(S.w.mon.k)],
    ['ord',tt('Aufträge geschafft','Orders completed'),fmt(S.orders.done)],
    ['exp',tt('Expeditionen','Expeditions'),fmt(S.w.exp.done)],
    ['cast',tt('Zauber gewirkt','Spells cast'),fmt(S.w.casts)],
    ['stars',tt('Sternenkrümel gefunden','Star crumbs found'),String(S.w.star.all)],
    ['quests',tt('Tagesaufgaben erledigt','Daily tasks done'),String(S.day.total)],
    ['streak',tt('Längste Login-Serie','Longest login streak'),S.day.best+' '+tt('Tage','days')],
    ['hero',tt('Held','Hero'),tt('Stufe ','Level ')+S.hero.lvl],
    ['tower',tt('Endlos-Turm Rekord','Endless Tower record'),String(S.hero.tower.best)],
    ['dung',tt('Dungeons geschafft','Dungeons cleared'),String(Object.values(S.hero.clr).reduce((a,b)=>a+b,0))],
    ['fr',tt('Filialen-Gewinn','Store profit'),fmt(S.fr.earned)],
    ['book',tt('Sammelbuch','Collection'),bookCount()[0]+' / '+bookCount()[1]],
    ['visn',tt('Besucher empfangen','Visitors received'),String(S.vis.n)],
    ['pass',tt('Saison-Pass Stufe','Season pass tier'),passTier()+' / 30'],
    ['tut',tt('Erste Schritte','First steps'),Math.min(S.tut.i,TUT.length)+' / '+TUT.length],
    ['inf',tt('Endlos-Upgrades (Stufen)','Endless upgrades (levels)'),String(S.inf.p+S.inf.c+S.inf.g)],
    ['work',tt('Helfer','Helpers'),WORKERS.filter(x=>S.work.hired[x.id]).length+' / '+WORKERS.length]
  ];
  rows.forEach(r=>{live['s_'+r[0]]=r[2];});
  const h='<h3 class="wt">'+tt('Kekse pro Sekunde (Verlauf)','Cookies per second (history)')+'</h3>'+chartHTML(st.hist)
    +'<h3 class="wt" style="margin-top:18px">'+tt('Zahlen','Numbers')+'</h3><dl class="kv" style="margin-top:8px">'+rows.map(r=>'<dt>'+r[1]+'</dt><dd data-l="s_'+r[0]+'"></dd>').join('')+'</dl>';
  return {html:h,live,wid:{}};
}
const gEls={book:document.getElementById('bookBox'),pass:document.getElementById('passBox'),daily:document.getElementById('dailyBox'),stats:document.getElementById('statBox'),dot:document.getElementById('gDot')};
function updGoals(){
  gEls.dot.hidden=!(goalsReady()||wheelFree()||premReady()||passBonusN()>0);
  setTxt(document.querySelector('#gWheelB .gl'),tt('Glücksrad','Lucky wheel'));setTxt(document.querySelector('#gTtlB .gl'),tt('Titel','Titles'));updGoalsUI();
  {const hw=S.all>=5e4,ht=S.all>=1e6,bw=document.getElementById('gWheelB'),bt=document.getElementById('gTtlB');if(bw.hidden===hw) bw.hidden=!hw;if(bt.hidden===ht) bt.hidden=!ht;if((gSub==='wheel'&&!hw)||(gSub==='ttl'&&!ht)){gSub='daily';document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});}}
  updWheel();updTtl();
  document.querySelectorAll('#gSeg [data-g]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.g===gSub?'true':'false'));
  document.querySelectorAll('#sndSeg [data-vol]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.vol===S.opt.vol?'true':'false'));
  if(panes.ach.hidden) return;
  if(gSub==='daily') mount(gEls.daily,dailyR(),{});
  else if(gSub==='stats') mount(gEls.stats,statsR(),{});
  else if(gSub==='pass'){mount(gEls.pass,passR(),{});passScroll();}
  else if(gSub==='ach') updAchF();
  else if(gSub==='book') mount(gEls.book,bookR(),{});
}
