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
  const mus=actx.createGain();mus.gain.value=0;mus.connect(comp);
  const revOut=actx.createGain();revOut.gain.value=.8;rev.connect(revOut);revOut.connect(comp);
  const noise=actx.createBuffer(1,actx.sampleRate,actx.sampleRate);{const d=noise.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;}
  AU={comp,rev,sfx,mus,noise,mx:mxGraph(actx,mus)};
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
  if(v59Ready) vibFor(kind);
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
/*MUSIC-START*/
/* ===== Musik (V55): 7 Stücke mit Liedform, echten Instrumenten und Mischpult – alles live erzeugt ===== */
function mxRng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* Mischpult: je Instrumentengruppe ein Kanal mit Panorama, Hall- und Echo-Anteil; Pad und Klavier werden vom Bass-Drum „weggedrückt“ (Sidechain). */
function mxGraph(C,out){
  const ir=(sec,pre)=>{const r=C.sampleRate,n=Math.floor(r*sec),b=C.createBuffer(2,n,r);for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;for(let i=0;i<n;i++){const x=i/n,w=Math.random()*2-1;lp+=(w-lp)*(.55-.4*x);d[i]=i<pre*r?0:lp*Math.pow(1-x,2.6)*(1+.15*Math.sin(i*.0007*(c+1)));}}return b;};
  const eq1=C.createBiquadFilter();eq1.type='lowshelf';eq1.frequency.value=180;eq1.gain.value=2;
  const eq2=C.createBiquadFilter();eq2.type='highshelf';eq2.frequency.value=7000;eq2.gain.value=-2.5;
  const lim=C.createDynamicsCompressor();lim.threshold.value=-10;lim.knee.value=6;lim.ratio.value=8;lim.attack.value=.004;lim.release.value=.2;
  const mg=C.createGain();mg.gain.value=.6;eq1.connect(eq2);eq2.connect(lim);lim.connect(mg);mg.connect(out);
  const rev=C.createConvolver();rev.buffer=ir(2.6,.025);const revG=C.createGain();revG.gain.value=.9;rev.connect(revG);revG.connect(eq1);
  const dl=C.createDelay(2),fb=C.createGain(),dlf=C.createBiquadFilter(),dlG=C.createGain();fb.gain.value=.34;dlf.type='lowpass';dlf.frequency.value=2600;dlG.gain.value=.55;
  dl.connect(dlf);dlf.connect(fb);fb.connect(dl);dlf.connect(dlG);dlG.connect(eq1);dlG.connect(rev);
  const duck=C.createGain();duck.connect(eq1);
  const mk=(pan,rv,dy,vol,ducked)=>{const g=C.createGain();g.gain.value=vol;const p=C.createStereoPanner?C.createStereoPanner():null;let n=g;if(p){p.pan.value=pan;g.connect(p);n=p;}n.connect(ducked?duck:eq1);const r=C.createGain();r.gain.value=rv;n.connect(r);r.connect(rev);const d=C.createGain();d.gain.value=dy;n.connect(d);d.connect(dl);return{g,r,d};};
  const B={drum:mk(0,.08,0,.8),bass:mk(0,.04,0,.85),keys:mk(-.18,.22,.06,.7,1),pad:mk(.12,.45,0,.55,1),lead:mk(.15,.3,.22,.62),perc:mk(-.35,.2,.08,.55),str:mk(.3,.35,0,.5,1),fx:mk(0,.5,.2,.4)};
  return{C,B,rev,revG,dl,fb,duck,eq1,mg,noise:(()=>{const b=C.createBuffer(1,C.sampleRate*2,C.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;return b;})()};
}
/* Bausteine */
function mxEnv(C,g,t,a,peak,hold,rel){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(.0001,t+a+hold+rel);}
function mxOsc(X,type,f,t,end,dst,det){const o=X.C.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(det) o.detune.value=det;o.connect(dst);o.start(t);o.stop(end+.05);return o;}
function mxNoise(X,t,d,dst,f,q,type,amp,a){const C=X.C,s=C.createBufferSource(),fl=C.createBiquadFilter(),g=C.createGain();s.buffer=X.noise;fl.type=type||'bandpass';fl.frequency.value=f;fl.Q.value=q||1;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(amp,t+(a||.002));g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(dst);s.start(t,Math.random()*1.5);s.stop(t+d+.05);}
const INS={
  /* E-Piano (FM): weich, glockig im Anschlag */
  ep(X,dst,f,t,d,v){const C=X.C,g=C.createGain(),c=mxOsc(X,'sine',f,t,t+d+1.2,g),m=C.createOscillator(),mg=C.createGain();m.frequency.value=f;mg.gain.setValueAtTime(f*2.2*v+f*.4,t);mg.gain.exponentialRampToValueAtTime(f*.15,t+.7);m.connect(mg);mg.connect(c.frequency);m.start(t);m.stop(t+d+1.25);
    const g2=C.createGain();mxOsc(X,'sine',f*2,t,t+.6,g2);g2.gain.setValueAtTime(.12*v,t);g2.gain.exponentialRampToValueAtTime(.0001,t+.5);g2.connect(dst);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22*v,t+.006);g.gain.exponentialRampToValueAtTime(.09*v,t+.5);g.gain.setValueAtTime(.09*v,t+Math.max(.5,d));g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.5,d)+.7);g.connect(dst);},
  /* Flächen: drei verstimmte Sägezähne mit langsam öffnendem Filter */
  pad(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='lowpass';fl.Q.value=.7;fl.frequency.setValueAtTime(350,t);fl.frequency.linearRampToValueAtTime(1100+700*v,t+d*.6);fl.frequency.linearRampToValueAtTime(600,t+d+.8);
    [-9,0,9].forEach(dt=>mxOsc(X,'sawtooth',f,t,t+d+1,fl,dt));mxOsc(X,'sine',f/2,t,t+d+1,fl);fl.connect(g);g.connect(dst);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*v,t+Math.min(1.4,d*.4));g.gain.setValueAtTime(.05*v,t+d);g.gain.linearRampToValueAtTime(0,t+d+.9);},
  /* Streicher mit Vibrato */
  str(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain(),lfo=C.createOscillator(),lg=C.createGain();fl.type='lowpass';fl.frequency.value=2400;lfo.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(7,t+.4);lfo.connect(lg);lfo.start(t);lfo.stop(t+d+.6);
    [-6,6].forEach(dt=>{const o=mxOsc(X,'sawtooth',f,t,t+d+.5,fl,dt);lg.connect(o.detune);});fl.connect(g);g.connect(dst);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.075*v,t+.14);g.gain.setValueAtTime(.075*v,t+d);g.gain.linearRampToValueAtTime(0,t+d+.45);},
  /* Kurze Streicher-Achtel (Ostinato) */
  spic(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='lowpass';fl.frequency.value=2000;[-5,5].forEach(dt=>mxOsc(X,'sawtooth',f,t,t+.3,fl,dt));fl.connect(g);g.connect(dst);mxEnv(C,g,t,.01,.08*v,.05,.16);},
  /* Blech: Filter öffnet beim Anblasen */
  brass(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='lowpass';fl.Q.value=2;fl.frequency.setValueAtTime(300,t);fl.frequency.linearRampToValueAtTime(2600*v+600,t+.06);fl.frequency.exponentialRampToValueAtTime(1100,t+.4);
    [-4,4].forEach(dt=>mxOsc(X,'sawtooth',f,t,t+d+.3,fl,dt));fl.connect(g);g.connect(dst);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.11*v,t+.035);g.gain.setValueAtTime(.09*v,t+Math.max(.1,d-.05));g.gain.exponentialRampToValueAtTime(.0001,t+d+.25);},
  /* Glocken (FM) */
  bell(X,dst,f,t,d,v){const C=X.C,g=C.createGain(),c=mxOsc(X,'sine',f,t,t+3.2,g),m=C.createOscillator(),mg=C.createGain();m.frequency.value=f*3.5;mg.gain.setValueAtTime(f*1.8,t);mg.gain.exponentialRampToValueAtTime(f*.05,t+2.2);m.connect(mg);mg.connect(c.frequency);m.start(t);m.stop(t+3.25);g.connect(dst);mxEnv(C,g,t,.003,.12*v,0,2.8);},
  /* Glockenspiel / Celesta */
  glock(X,dst,f,t,d,v){const C=X.C,g=C.createGain();mxOsc(X,'sine',f,t,t+1.3,g);mxOsc(X,'sine',f*4.07,t,t+.25,g);g.connect(dst);mxEnv(C,g,t,.002,.09*v,0,1.1);},
  /* Marimba / Kalimba */
  mallet(X,dst,f,t,d,v){const C=X.C,g=C.createGain(),g2=C.createGain();mxOsc(X,'sine',f,t,t+.6,g);mxOsc(X,'sine',f*3.98,t,t+.08,g2);g.connect(dst);g2.connect(dst);mxEnv(C,g,t,.002,.2*v,0,.45);mxEnv(C,g2,t,.001,.06*v,0,.06);},
  /* Gezupfte Gitarre / Funk-Chops */
  pluck(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='lowpass';fl.Q.value=3;fl.frequency.setValueAtTime(4200,t);fl.frequency.exponentialRampToValueAtTime(700,t+.18);mxOsc(X,'sawtooth',f,t,t+.5,fl);mxOsc(X,'triangle',f*2,t,t+.3,fl);fl.connect(g);g.connect(dst);mxEnv(C,g,t,.002,.1*v,0,Math.min(.45,d+.15));},
  /* Akkordeon-artige Begleitung für den Walzer */
  reed(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='lowpass';fl.frequency.value=1150;fl.Q.value=.5;[-7,7].forEach(dt=>mxOsc(X,'square',f,t,t+d+.2,fl,dt));fl.connect(g);g.connect(dst);mxEnv(C,g,t,.015,.03*v,Math.max(.02,d-.08),.12);},
  /* Flöte / Lead mit Atem und Vibrato */
  flute(X,dst,f,t,d,v){const C=X.C,g=C.createGain(),lfo=C.createOscillator(),lg=C.createGain();lfo.frequency.value=5.4;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(9,t+.35);lfo.connect(lg);lfo.start(t);lfo.stop(t+d+.4);
    const o=mxOsc(X,'triangle',f,t,t+d+.35,g),o2=mxOsc(X,'sine',f*2,t,t+d+.35,g);lg.connect(o.detune);lg.connect(o2.detune);g.connect(dst);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13*v,t+.05);g.gain.setValueAtTime(.11*v,t+Math.max(.06,d));g.gain.linearRampToValueAtTime(0,t+d+.25);
    mxNoise(X,t,.12,dst,f*2,1.5,'bandpass',.03*v,.02);},
  /* Gedämpfte Trompete (Jazz) */
  mute(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='bandpass';fl.frequency.value=f*2.2;fl.Q.value=1.2;mxOsc(X,'sawtooth',f,t,t+d+.3,fl);fl.connect(g);g.connect(dst);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*v,t+.04);g.gain.setValueAtTime(.12*v,t+Math.max(.05,d));g.gain.exponentialRampToValueAtTime(.0001,t+d+.2);},
  /* Synth-Lead (Groove, Showdown) */
  saw(X,dst,f,t,d,v){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain();fl.type='lowpass';fl.Q.value=4;fl.frequency.setValueAtTime(900,t);fl.frequency.linearRampToValueAtTime(3200,t+.05);fl.frequency.exponentialRampToValueAtTime(1400,t+.3);[-10,10].forEach(dt=>mxOsc(X,'sawtooth',f,t,t+d+.2,fl,dt));fl.connect(g);g.connect(dst);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08*v,t+.01);g.gain.setValueAtTime(.07*v,t+Math.max(.03,d));g.gain.exponentialRampToValueAtTime(.0001,t+d+.15);},
  /* Bässe */
  bass(X,dst,f,t,d,v,kind){const C=X.C,fl=C.createBiquadFilter(),g=C.createGain(),sub=C.createGain();fl.type='lowpass';
    if(kind==='upright'){fl.frequency.setValueAtTime(900,t);fl.frequency.exponentialRampToValueAtTime(380,t+.25);mxOsc(X,'triangle',f,t,t+d+.2,fl);mxEnv(C,g,t,.004,.32*v,Math.max(.02,d*.5),.25);}
    else if(kind==='synth'){fl.Q.value=6;fl.frequency.setValueAtTime(1800*v,t);fl.frequency.exponentialRampToValueAtTime(220,t+.16);mxOsc(X,'sawtooth',f,t,t+d+.1,fl);mxOsc(X,'square',f/2,t,t+d+.1,fl);mxEnv(C,g,t,.003,.17*v,Math.max(.02,d-.04),.08);}
    else{fl.Q.value=1.5;fl.frequency.setValueAtTime(1100*v,t);fl.frequency.exponentialRampToValueAtTime(260,t+.3);mxOsc(X,'sawtooth',f,t,t+d+.3,fl);mxEnv(C,g,t,.004,.2*v,Math.max(.03,d*.6),.25);}
    mxOsc(X,'sine',f,t,t+d+.3,sub);mxEnv(C,sub,t,.006,.34*v,Math.max(.03,d*.7),.2);fl.connect(g);g.connect(dst);sub.connect(dst);},
  /* Schlagzeug */
  kick(X,dst,t,v){const C=X.C,g=C.createGain(),o=mxOsc(X,'sine',140,t,t+.45,g);o.frequency.exponentialRampToValueAtTime(44,t+.11);mxEnv(C,g,t,.002,.9*v,.04,.32);g.connect(dst);mxNoise(X,t,.012,dst,3500,.7,'highpass',.25*v);
    const dk=X.duck.gain;dk.cancelScheduledValues(t);dk.setValueAtTime(1,t);dk.linearRampToValueAtTime(.55,t+.012);dk.linearRampToValueAtTime(1,t+.24);},
  snare(X,dst,t,v){const C=X.C,g=C.createGain(),o=mxOsc(X,'triangle',220,t,t+.15,g);o.frequency.exponentialRampToValueAtTime(160,t+.08);mxEnv(C,g,t,.001,.22*v,0,.1);g.connect(dst);mxNoise(X,t,.2,dst,2400,.6,'bandpass',.3*v);mxNoise(X,t,.12,dst,6000,.5,'highpass',.12*v);},
  rim(X,dst,t,v){const C=X.C,g=C.createGain();mxOsc(X,'square',1650,t,t+.04,g);mxEnv(C,g,t,.001,.07*v,0,.025);g.connect(dst);mxNoise(X,t,.03,dst,3000,3,'bandpass',.12*v);},
  clap(X,dst,t,v){[0,.011,.023].forEach((o,i)=>mxNoise(X,t+o,i===2?.22:.02,dst,1300,1.1,'bandpass',.32*v));},
  hat(X,dst,t,v,open){mxNoise(X,t,open?.28:.045,dst,8800,.7,'highpass',(open?.11:.09)*v);},
  shaker(X,dst,t,v){mxNoise(X,t,.07,dst,6500,1.2,'bandpass',.08*v,.02);},
  brush(X,dst,t,v){mxNoise(X,t,.22,dst,3800,.6,'bandpass',.07*v,.06);},
  ride(X,dst,t,v){mxNoise(X,t,.6,dst,9500,1,'bandpass',.07*v);const g=X.C.createGain();mxOsc(X,'sine',3100,t,t+.4,g);mxEnv(X.C,g,t,.001,.025*v,0,.35);g.connect(dst);},
  tom(X,dst,t,v,f){const C=X.C,g=C.createGain(),o=mxOsc(X,'sine',f||160,t,t+.5,g);o.frequency.exponentialRampToValueAtTime((f||160)*.55,t+.25);mxEnv(C,g,t,.002,.55*v,.02,.32);g.connect(dst);},
  timp(X,dst,t,v,f){const C=X.C,g=C.createGain(),o=mxOsc(X,'sine',f||87,t,t+1.4,g);o.frequency.exponentialRampToValueAtTime((f||87)*.97,t+1);mxEnv(C,g,t,.004,.6*v,.05,1.1);g.connect(dst);mxNoise(X,t,.25,dst,300,.8,'lowpass',.2*v);},
  crash(X,dst,t,v){mxNoise(X,t,1.6,dst,5500,.4,'highpass',.09*v);},
  crackle(X,dst,t,v){mxNoise(X,t,.004,dst,2500+Math.random()*3000,1,'bandpass',.05*v);}
};
/* Akkorde (Halbtöne über dem Grundton der Tonart) */
const CHD={I:[0,4,7],Imaj7:[0,4,7,11],I6:[0,4,7,9],i:[0,3,7],i7:[0,3,7,10],ii7:[2,5,9,12],iii7:[4,7,11,14],IV:[5,9,12],IVmaj7:[5,9,12,16],IV7:[5,9,12,15],iv:[5,8,12],V:[7,11,14],V7:[7,11,14,17],Vsus:[7,12,14,17],v7:[7,10,14,17],vi:[9,12,16],vi7:[9,12,16,19],bIII:[3,7,10],bVI:[8,12,15],bVImaj7:[8,12,15,19],bVII:[10,14,17],II7:[2,6,9,12],VI7:[9,13,16,19],III7:[4,8,11,14]};
/* Schlagzeug-Muster: 16 Schritte je Takt (Walzer: 12). k Bass-Drum, s Snare, c Clap, r Rim, h Hi-Hat, o offene Hi-Hat, x Shaker, b Besen, R Ride, t Tom, T Pauke */
const TRK={
  bake:{n:['Morgenbäckerei','Morning Bakery'],d:['Lo-Fi, warm und gemütlich','Lo-fi, warm and cozy'],bpm:82,swing:.14,key:65,spb:16,crackle:1,
    prog:{A:['Imaj7','vi7','ii7','V7'],B:['IVmaj7','iii7','ii7','Vsus'],C:['vi7','IVmaj7','ii7','V7']},form:['intro','A','A','B','A','C'],
    parts:{intro:['keys'],A:['keys','bass','drums','lead'],B:['keys','bass','drums','pad','lead'],C:['keys','pad','bass','drumsLow']},
    keys:{ins:'ep',rh:[0,6,10],oct:0},bass:{kind:'pluck',rh:'R.....5...R.....',oct:-24},lead:{ins:'flute',oct:12,dens:.34,rest:.5},pad:{ins:'pad',oct:-12},
    drums:{full:'k.....k.s..k..s.|....h.h..h...h..',low:'k.........k.....|..h...h...h...h.'},hatI:'r'},
  market:{n:['Fabrik-Groove','Factory Groove'],d:['Funky und flott','Funky and upbeat'],bpm:112,swing:.04,key:64,spb:16,
    prog:{A:['i7','IV7','i7','IV7'],B:['bVImaj7','bVII','i7','v7'],C:['iv','bVII','bIII','bVI']},form:['intro','A','A','B','A','C'],
    parts:{intro:['drums','bass'],A:['drums','bass','chops','lead'],B:['drums','bass','chops','brass','lead'],C:['drums','bass','pad','brass']},
    bass:{kind:'synth',rh:'R..R..R.5.R..8..',oct:-24},chops:{ins:'pluck',rh:[2,6,10,14]},brass:{rh:[0,3,6]},lead:{ins:'saw',oct:12,dens:.5,rest:.35},pad:{ins:'pad',oct:-12},
    drums:{full:'k..k..k.k..k..k.|....c.......c...|h.hoh.h.h.hoh.h.',low:'k.......k.......|....c.......c...'}},
  night:{n:['Nachtschicht','Night Shift'],d:['Jazzig mit Besen und Kontrabass','Jazzy, with brushes and upright bass'],bpm:96,swing:.2,key:58,spb:16,
    prog:{A:['ii7','V7','Imaj7','vi7'],B:['ii7','V7','iii7','VI7'],C:['IVmaj7','iv','iii7','VI7']},form:['intro','A','A','B','A','C'],
    parts:{intro:['keys','bass'],A:['keys','walk','brushes','lead'],B:['keys','walk','brushes','lead'],C:['keys','walk','brushes','pad']},
    keys:{ins:'ep',rh:[0,6,14],oct:0},lead:{ins:'mute',oct:0,dens:.4,rest:.45},pad:{ins:'pad',oct:-12},
    drums:{full:'R...R.R.R...R.R.|....b.......b...|k.........k.....',low:'R...R.R.R...R.R.'}},
  adv:{n:['Großes Abenteuer','Great Adventure'],d:['Orchester mit Pauken','Orchestral, with timpani'],bpm:100,key:62,spb:16,
    prog:{A:['i','bVI','bIII','bVII'],B:['iv','i','bVI','V'],C:['bVI','bVII','i','i']},form:['intro','A','A','B','A','C'],
    parts:{intro:['spic','timp'],A:['spic','strings','bassO','timp','brass'],B:['spic','strings','bassO','drums','brass'],C:['strings','pad','timp','lead']},
    lead:{ins:'flute',oct:12,dens:.36,rest:.45},pad:{ins:'pad',oct:-12},brass:{mel:1,oct:0},
    drums:{full:'T.......T.......|....s.......s.ss|t.t.....t.t.t...',low:'T...............'}},
  boss:{n:['Showdown','Showdown'],d:['Schnell und spannend','Fast and tense'],bpm:134,key:60,spb:16,
    prog:{A:['i','i','bVI','bVII'],B:['iv','iv','V','V'],C:['bVI','bVII','i','V']},form:['intro','A','A','B','A','C'],
    parts:{intro:['spic','drumsLow'],A:['spic','bassS','drums','lead','strings'],B:['spic','bassS','drums','brass','lead'],C:['spic','bassS','drums','strings']},
    bass:{kind:'synth',rh:'R.R.R.R.R.R.R.8.',oct:-24},lead:{ins:'saw',oct:12,dens:.55,rest:.25},brass:{rh:[0,6,10]},
    drums:{full:'k...s.k.k.k.s...|h.h.h.h.h.h.h.h.',low:'k.......k.......|h...h...h...h...'}},
  stars:{n:['Sternenaufstieg','Starry Ascension'],d:['Verträumt, mit Glocken','Dreamy, with bells'],bpm:66,key:57,spb:16,
    prog:{A:['Imaj7','IVmaj7','vi7','Vsus'],B:['IVmaj7','iii7','vi7','IVmaj7'],C:['vi7','Vsus','IVmaj7','Imaj7']},form:['intro','A','B','A','C'],
    parts:{intro:['pad'],A:['pad','arp','bassSoft','lead'],B:['pad','arp','bassSoft','drumsLow','lead'],C:['pad','arp','strings']},
    lead:{ins:'bell',oct:12,dens:.22,rest:.6},pad:{ins:'pad',oct:-12},arp:{ins:'glock',oct:12},
    drums:{full:'k...............',low:'k.............x.'}},
  fest:{n:['Keks-Fest','Cookie Festival'],d:['Fröhlicher Walzer','Cheerful waltz'],bpm:152,key:67,spb:12,mix:{bass:1.25},
    prog:{A:['I','V7','V7','I'],B:['IV','I','V7','I'],C:['vi','II7','V7','V7']},form:['intro','A','A','B','A','C'],
    parts:{intro:['oompah'],A:['oompah','lead','glock'],B:['oompah','lead','strings'],C:['oompah','lead','glock','strings']},
    lead:{ins:'flute',oct:12,dens:.62,rest:.2},
    drums:{full:'k...h...h...',low:'k...........'}}
};
const TRK_IDS=Object.keys(TRK);
const TAB_TRK={build:'bake',up:'bake',work:'market',orders:'market',world:'adv',ach:'fest',shop:'fest',asc:'stars'};
/* Melodie: ein Motiv (2 Takte) mit Antwort – je Abschnitt fest (wiedererkennbar), Akkordtöne auf betonten Schlägen. */
function mxMelody(T,sec,seed){
  const r=mxRng(seed),spb=T.spb,prog=T.prog[sec]||T.prog.A,L=T.lead||{},dens=L.dens||.4,N={},scale=[0,2,4,5,7,9,11];
  const minor=CHD[prog[0]]&&CHD[prog[0]][1]===3;const sc=minor?[0,2,3,5,7,8,10]:scale;
  const rhythm=[];for(let s=0;s<spb*2;s+=2){const strong=s%(spb/2)===0;if(r()<dens*(strong?1.6:1)) rhythm.push(s);}
  if(!rhythm.length) rhythm.push(0);
  let deg=7+Math.floor(r()*3);
  const motif=rhythm.map((s,i)=>{deg=Math.max(4,Math.min(12,deg+[-2,-1,-1,0,1,1,2,3][Math.floor(r()*8)]));const nx=rhythm[i+1]!==undefined?rhythm[i+1]:spb*2;return{s,len:Math.max(1,Math.min(nx-s,s%4===0&&r()<.5?6:2+Math.floor(r()*3))),deg};});
  for(let bar=0;bar<prog.length;bar+=2){
    const answer=(bar/2)%2===1;
    motif.forEach((m,i)=>{
      if(answer&&i===motif.length-1&&r()<.6) return;
      if(r()<(L.rest||.4)*.35) return;
      let d=m.deg+(answer?(r()<.5?-2:1):0);
      const st=bar*spb+m.s,b=Math.floor(st/spb),ch=CHD[prog[b%prog.length]]||[0,4,7],strong=(st%spb)%(spb/2)===0;
      let semis=sc[((d%7)+7)%7]+12*Math.floor(d/7);
      if(strong){let best=semis,bd=99;for(const c of ch) for(const o of [0,12,24]){const x=c+o;if(Math.abs(x-semis)<bd){bd=Math.abs(x-semis);best=x;}}semis=best;}
      N[st]={m:semis,len:m.len};
    });
  }
  return N;
}
/* Ein Musik-Spieler; funktioniert mit dem Live-Audio und offline (für Hörproben) */
function mxPlayer(X){
  const P={X,trk:null,step:0,t:0,sec:0,secStep:0,mel:{},I:.5,cyc:0,lastFill:-1};
  P.start=(id,t)=>{P.trk=id;P.step=0;P.t=t;P.sec=0;P.secStep=0;P.cyc=0;P.mel={};const mx=TRK[id].mix||{};X.B.bass.g.gain.setValueAtTime(.85*(mx.bass||1),t);};
  P.secName=()=>{const T=TRK[P.trk];return T.form[P.sec%T.form.length];};
  P.melFor=sec=>{const k=sec+':'+(P.cyc%2);if(!P.mel[k]) P.mel[k]=mxMelody(TRK[P.trk],sec==='intro'?'A':sec,(P.trk.length*7919+sec.charCodeAt(0)*131+(P.cyc%2)*17)>>>0);return P.mel[k];};
  P.step1=t=>{
    const T=TRK[P.trk],B=X.B,spb=T.spb,sec=P.secName(),prog=T.prog[sec==='intro'?'A':sec]||T.prog.A,secBars=sec==='intro'?2:prog.length*2;
    const st=P.secStep%spb,bar=Math.floor(P.secStep/spb),chName=prog[bar%prog.length],ch=CHD[chName]||[0,4,7],root=T.key+ch[0]-(ch[0]>=7?12:0),sd=60/T.bpm/4,barD=sd*spb;
    const on=k=>T.parts[sec]&&T.parts[sec].includes(k),I=P.I,v=.75+.25*I;
    const chordM=o=>ch.map(x=>T.key+x+(o||0));
    /* Akkorde */
    if(on('keys')&&T.keys&&T.keys.rh.includes(st)) chordM(T.keys.oct).forEach((m,i)=>INS[T.keys.ins](X,B.keys.g,mHz(m),t+i*.008,st===0?sd*5:sd*3,v*.85));
    if(on('pad')&&st===0) chordM(-12).forEach(m=>INS.pad(X,B.pad.g,mHz(m),t,barD,v));
    if(on('strings')&&st===0) chordM(0).forEach(m=>INS.str(X,B.str.g,mHz(m),t,barD*.98,v*.8));
    if(on('chops')&&T.chops.rh.includes(st)) chordM(0).forEach(m=>INS.pluck(X,B.keys.g,mHz(m),t,sd,v*.7));
    if(on('spic')&&st%2===0){const seq=[0,1,2,1],m=T.key+ch[seq[(st/2)%4]%ch.length]-12;INS.spic(X,B.str.g,mHz(m),t,sd,v*(st%8===0?1:.75));}
    if(on('arp')&&st%2===0){const seq=[0,1,2,3,2,1],m=T.key+ch[seq[(st/2)%seq.length]%ch.length]+(T.arp.oct||0);INS[T.arp.ins](X,B.perc.g,mHz(m),t,sd*2,v*.8);}
    if(on('glock')&&(st===0||st===spb/2)) INS.glock(X,B.perc.g,mHz(T.key+ch[(bar+st)%ch.length]+24),t,sd,v*.7);
    if(on('oompah')){if(st===0) INS.bass(X,B.bass.g,mHz(root-24),t,sd*3,v,'upright');else if(st===4||st===8) chordM(0).forEach(m=>INS.reed(X,B.keys.g,mHz(m),t,sd*2.5,v));}
    if(on('brass')&&T.brass){if(T.brass.mel){if(st===0&&bar%2===0) chordM(0).slice(0,3).forEach(m=>INS.brass(X,B.lead.g,mHz(m),t,barD*1.4,v*.9));}else if(T.brass.rh.includes(st)&&bar%2===1) chordM(0).forEach(m=>INS.brass(X,B.lead.g,mHz(m),t,sd*1.2,v*.75));}
    /* Bass */
    const bs=T.bass;
    if((on('bass')||on('bassS'))&&bs){const c=bs.rh[st];if(c&&c!=='.'){const off=c==='R'?0:c==='5'?7:c==='8'?12:c==='3'?(ch[1]-ch[0]):0;const nx=bs.rh.slice(st+1).search(/[^.]/);INS.bass(X,B.bass.g,mHz(root+off+(bs.oct||-24)),t,sd*Math.max(1,Math.min(4,nx<0?spb-st:nx+1))*.9,v,bs.kind);}}
    if(on('bassO')&&(st===0||st===8)) INS.bass(X,B.bass.g,mHz(root-24),t,sd*7,v,'pluck');
    if(on('bassSoft')&&st===0) INS.bass(X,B.bass.g,mHz(root-12),t,barD*.9,v*.8,'upright');
    if(on('walk')&&st%4===0){const beat=st/4,nextCh=CHD[prog[(bar+1)%prog.length]]||ch,nr=T.key+nextCh[0]-(nextCh[0]>=7?12:0);const m=beat===0?root:beat===1?root+ch[1]-ch[0]:beat===2?root+7:nr+(nr>root?-1:1);INS.bass(X,B.bass.g,mHz(m-12),t,sd*3.6,v,'upright');}
    /* Schlagzeug */
    const dpat=(on('drums')||on('brushes'))?(I>.3||sec!=='intro'?T.drums.full:T.drums.low):(on('drumsLow')?T.drums.low:null);
    if(dpat){dpat.split('|').forEach(row=>{const c=row[st%row.length];if(!c||c==='.') return;const D=B.drum.g;
      if(c==='k') INS.kick(X,D,t,v);else if(c==='s') INS.snare(X,D,t,v);else if(c==='c') INS.clap(X,D,t,v);else if(c==='r') INS.rim(X,D,t,v);
      else if(c==='h') INS[T.hatI==='r'&&(st%4)?'shaker':'hat'](X,D,t,v*(st%4?.7:1));else if(c==='o') INS.hat(X,D,t,v,1);else if(c==='x') INS.shaker(X,D,t,v);
      else if(c==='b') INS.brush(X,D,t,v);else if(c==='R') INS.ride(X,D,t,v*(st%4?.7:1));else if(c==='t') INS.tom(X,D,t,v,st<8?180:130);else if(c==='T') INS.timp(X,D,t,v,mHz(root-24));});
      if(I>.7&&sec!=='intro'&&T.drums.full.includes('h')&&st%2===1) INS.hat(X,B.drum.g,t,v*.45);
      if(bar===secBars-1&&st>=12&&T.spb===16&&(on('drums'))&&sec!=='C') INS[T.key===62||T.key===60?'tom':'snare'](X,B.drum.g,t,v*(.6+(st-12)*.12),200-(st-12)*25);}
    if(on('timp')&&st===0&&bar%2===0) INS.timp(X,B.drum.g,t,v,mHz(root-24));
    if(st===0&&bar===0&&sec==='A'&&P.cyc>0&&T.drums.full.includes('k')&&on('drums')) INS.crash(X,B.drum.g,t,v*.8);
    if(T.crackle&&Math.random()<.18) INS.crackle(X,B.fx.g,t+Math.random()*sd,1);
    /* Melodie */
    if(on('lead')&&T.lead){const mel=P.melFor(sec),k=(bar%prog.length)*spb+st,n=mel[k%(prog.length*spb)];if(n) INS[T.lead.ins](X,B.lead.g,mHz(T.key+n.m+(T.lead.oct||0)),t,sd*n.len,v);}
    /* weiter */
    P.secStep++;if(P.secStep>=secBars*spb){P.secStep=0;P.sec++;if(P.sec%T.form.length===0){P.sec=1;P.cyc++;}}
  };
  P.run=(until)=>{const T=TRK[P.trk],sd=60/T.bpm/4;let n=0;while(P.t<until&&n<64){const sw=T.swing&&P.step%2?T.swing*sd*2:0;P.step1(P.t+sw);P.t+=sd;P.step++;n++;}};
  return P;
}
/*MUSIC-END*/
const M={sw:0,swT:0};let MP=null;
function curTrk(){
  const o=S.opt.trk||'auto';if(TRK[o]) return o;
  const sel=tabs.find(t=>t.getAttribute('aria-selected')==='true'),tab=sel?sel.dataset.tab:'build';
  let id=TAB_TRK[tab]||'bake';
  if(id==='bake'&&curPhase().id==='night') id='night';
  if(tab==='world'&&S.hero&&S.hero.run) id='boss';
  return id;
}
/* Spannung: Combo und Boosts machen die Musik voller */
const musI=()=>Math.min(1,.45+(combo>25?.25:0)+(S.buffs&&S.buffs.length?.3:0));
function musTick(){
  if(!actx||!AU) return;
  const want=[0,.5,1][S.opt.mus|0]*.9,now=actx.currentTime;
  if(!MP) MP=mxPlayer(AU.mx);
  if(!want){if(MP.trk){AU.mus.gain.setTargetAtTime(0,now,.25);MP.trk=null;}return;}
  if(actx.state!=='running') return;
  const id=curTrk();
  if(!MP.trk){MP.start(id,now+.1);AU.mus.gain.setTargetAtTime(want,now,.6);}
  else if(id!==MP.trk&&!M.sw){M.sw=1;M.swT=now+1.2;AU.mus.gain.setTargetAtTime(0,now,.35);}
  if(M.sw&&now>=M.swT){M.sw=0;MP.start(curTrk(),now+.05);AU.mus.gain.setTargetAtTime(want,now,.6);}
  else if(!M.sw) AU.mus.gain.setTargetAtTime(want,now,.3);
  if(MP.t<now) MP.t=now+.05;
  MP.I=musI();
  MP.run(now+(document.hidden?2:.6));
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
