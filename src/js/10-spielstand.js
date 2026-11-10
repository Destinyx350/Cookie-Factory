/* ======================= Spielstand ======================= */
const defAdmin=()=>({prod:1,click:1,cost:1,speed:1,gold:1,goldPow:1,growth:1.15,ac:0,b:{}});
function fresh(){
  return {rr:null,hist:{h:[],d:[],a:[],ac:0},name:'',codes:{},lb:{on:0,id:'',t:0,ls:0,pb:null,ban:0},adm:0,tamp:0,cb:0,clv:0,cookies:0,run:0,all:0,clicks:0,gold:0,b:B.map(()=>0),up:{},ach:{},chips:0,asc:0,buffs:[],tree:{},items:{},boostCd:{},rolls:0,bought:0,orders:sanOrders(null),w:freshWorld(),pc:{},work:{v:2,xp:{},cnt:{},log:[],face:{},cand:{},hired:{},on:{},lvl:{},autoB:0,autoU:0,budget:25,dest:'flour',spell:'bake'},day:{date:'',q:[],bonus:0,total:0,streak:0,best:0,last:'',lc:''},stat:{time:0,best:0,hist:[],since:Date.now()},reb:{pages:0,n:0,base:0,tree:{}},tut:{i:0,hide:0},sec:{},vis:{next:420,n:0},book:{mon:{},gear:{},pl:{},vis:{},b:{},cl:{}},pass:{m:'',pp:0,cl:{},gold:0,gcl:{},bx:0},cos:{},seen:{build:1,up:1,ach:1},hero:{lvl:1,xp:0,sk:{},gear:{w:null,a:null,t:null},bag:[],sta:5,staT:Date.now(),tower:{best:0},clr:{},auto:0,nid:1,run:null},fr:{s:{},earned:0},wheel:{d:'',free:0,ext:0,n:0,jp:0,last:'',pend:-1},ttl:{cur:'lehrling',got:{lehrling:1},b:{},init:0},eg:freshEG(),sys:{seen:{},init:0},cards:{own:{},dust:0,opened:0},qual:{flour:0,butter:0,sugar:0,choc:0},runT:0,inf:{p:0,c:0,g:0},admin:defAdmin(),goldT:rand(120,240),t:Date.now(),opt:{fx:true,lang:detectLang(),skin:'classic',news:0,vol:1,look:'dark',compact:false,cd:{d:0,c:0,g:0,t:0},...DEFOPT()}};
}
function sanitize(o){
  const s=fresh();
  if(!o||typeof o!=='object') return s;
  const seal=sealState(o);
  const num=(v,d)=>(typeof v==='number'&&isFinite(v)&&v>=0)?v:(d||0);
  s.cookies=num(o.cookies);s.run=num(o.run);s.all=Math.max(num(o.all),s.run);
  s.clicks=Math.floor(num(o.clicks));s.gold=Math.floor(num(o.gold));s.cb=num(o.cb);s.clv=Math.max(0,Math.min(10,Math.floor(num(o.clv))));
  s.chips=Math.floor(num(o.chips));s.asc=Math.floor(num(o.asc));
  s.t=num(o.t,Date.now());
  if(Array.isArray(o.b)) B.forEach((_,i)=>{s.b[i]=Math.floor(num(o.b[i]));});
  if(o.up&&typeof o.up==='object') UP.forEach(u=>{if(o.up[u.id]) s.up[u.id]=1;});
  if(o.ach&&typeof o.ach==='object') A.forEach(a=>{if(o.ach[a.id]) s.ach[a.id]=1;});
  if(o.tree&&typeof o.tree==='object') TREE.forEach(n=>{if(o.tree[n.id]) s.tree[n.id]=1;});
  if(o.items&&typeof o.items==='object') ITEMS.forEach(it=>{const n=Math.floor(num(o.items[it.id]));if(n>0) s.items[it.id]=Math.min(n,99);});
  if(o.boostCd&&typeof o.boostCd==='object') BOOSTS.forEach(b=>{const n=num(o.boostCd[b.id]);if(n>0) s.boostCd[b.id]=Math.min(n,b.cd*5);});
  s.rolls=Math.floor(num(o.rolls));
  s.bought=Math.floor(num(o.bought));s.orders=sanOrders(o.orders);s.w=sanWorld(o.w);
  if(o.pc&&typeof o.pc==='object') Object.keys(o.pc).forEach(k=>{if(/^[a-z0-9_]{1,24}$/.test(k)){const v=Math.floor(num(o.pc[k]));if(v>0) s.pc[k]=Math.min(v,300);}});
  if(s.w.mkt.ref!==10){s.cookies+=s.w.mkt.spent.reduce((a,b)=>a+b,0);s.w.mkt.hold=[0,0,0,0,0,0];s.w.mkt.spent=[0,0,0,0,0,0];s.w.mkt.ref=10;}
  if(o.work&&typeof o.work==='object'){
    const k=o.work;
    WORKERS.forEach(x=>{if(k.hired&&k.hired[x.id]){s.work.hired[x.id]=1;if(k.on&&k.on[x.id]) s.work.on[x.id]=1;}});
    s.work.autoB=k.autoB?1:0;s.work.autoU=k.autoU?1:0;
    if(BUDGETS.includes(k.budget)) s.work.budget=k.budget;
    if(DESTS.some(d=>d.id===k.dest)) s.work.dest=k.dest;
    if(SPELLS.some(p=>p.id===k.spell)) s.work.spell=k.spell;
    const v2=k.v===2;
    if(k.lvl&&typeof k.lvl==='object') WORKERS.forEach(x=>{let L=Math.floor(num(k.lvl[x.id]));if(!v2) L=L>=3?6:L>=2?3:1;if(s.work.hired[x.id]&&L>=2) s.work.lvl[x.id]=Math.min(10,L);});
    if(k.xp&&typeof k.xp==='object') WORKERS.forEach(x=>{const v=num(k.xp[x.id]);if(v>0) s.work.xp[x.id]=v;});
    if(k.cnt&&typeof k.cnt==='object') WORKERS.forEach(x=>{const v=Math.floor(num(k.cnt[x.id]));if(v>0) s.work.cnt[x.id]=v;});
    if(Array.isArray(k.log)) s.work.log=k.log.filter(l=>l&&WORKERS.some(x=>x.id===l.id)&&typeof l.k==='string'&&l.k.length<12&&typeof l.t==='number').slice(-40).map(l=>({t:l.t,id:l.id,k:l.k,n:Math.floor(num(l.n,1)),x:typeof l.x==='string'?l.x.slice(0,60):''}));
    if(k.autoB){s.work.hired.builder=1;s.work.on.builder=1;}
    WORKERS.forEach(x=>{const f=sanFace(k.face&&k.face[x.id]);if(s.work.hired[x.id]) s.work.face[x.id]=f||genFace();else{const c=sanFace(k.cand&&k.cand[x.id]);if(c) s.work.cand[x.id]=c;}});
  }
  if(o.stat&&typeof o.stat==='object'){
    const t=o.stat;s.stat.time=num(t.time);s.stat.best=num(t.best);s.stat.since=num(t.since,Date.now());
    if(Array.isArray(t.hist)) s.stat.hist=t.hist.filter(v=>typeof v==='number'&&isFinite(v)&&v>=0).slice(-180);
  }
  if(o.day&&typeof o.day==='object'){
    const d=o.day,ds=v=>(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v))?v:'';
    s.day.date=ds(d.date);s.day.last=ds(d.last);s.day.lc=ds(d.lc);s.day.bonus=d.bonus?1:0;
    s.day.total=Math.floor(num(d.total));s.day.streak=Math.floor(num(d.streak));s.day.best=Math.max(s.day.streak,Math.floor(num(d.best)));
    if(Array.isArray(d.q)) s.day.q=d.q.filter(q=>q&&QUESTS.some(x=>x.id===q.id)).slice(0,3).map(q=>({id:q.id,d:Math.min(2,Math.floor(num(q.d))),goal:Math.max(1,num(q.goal,1)),base:num(q.base),c:q.c?1:0}));
    if(s.day.q.length!==3){s.day.q=[];s.day.date='';}
  }
  if(o.sec&&typeof o.sec==='object') ['title','lang','news','flee','respec','undo','design','kid'].forEach(k=>{const v=Math.floor(num(o.sec[k]));if(v>0) s.sec[k]=Math.min(v,1e6);});
  if(o.vis&&typeof o.vis==='object'){s.vis.next=Math.min(1200,num(o.vis.next,420));s.vis.n=Math.floor(num(o.vis.n));}
  if(o.wheel&&typeof o.wheel==='object'){const q=o.wheel,W=s.wheel;W.d=typeof q.d==='string'?q.d.slice(0,12):'';W.free=q.free?1:0;W.ext=Math.max(0,Math.min(3,Math.floor(num(q.ext,0))));W.n=Math.max(0,Math.floor(num(q.n,0)));W.jp=Math.max(0,Math.floor(num(q.jp,0)));W.last=typeof q.last==='string'?q.last.slice(0,8):'';const pd=Math.floor(num(q.pend,-1));W.pend=pd>=0&&pd<8?pd:-1;}
  if(o.ttl&&typeof o.ttl==='object'){const q=o.ttl,T=s.ttl;if(typeof q.cur==='string') T.cur=q.cur.slice(0,20);if(q.got&&typeof q.got==='object') Object.keys(q.got).slice(0,60).forEach(k=>{if(q.got[k]) T.got[String(k).slice(0,20)]=1;});if(q.b&&typeof q.b==='object') Object.keys(q.b).slice(0,30).forEach(k=>{T.b[String(k).slice(0,12)]=Math.max(0,Math.min(3,Math.floor(num(q.b[k],0))));});T.init=q.init?1:0;}
  if(o.book&&typeof o.book==='object'){const bk=o.book,fl=(src,keys,dst)=>{if(src&&typeof src==='object') keys.forEach(k=>{if(src[k]) dst[k]=1;});};
    fl(bk.mon,MON_KINDS.map((m,i)=>String(i)),s.book.mon);fl(bk.gear,['w','a','t'].flatMap(x=>[0,1,2,3,4].map(i=>x+i)),s.book.gear);fl(bk.pl,PLANTS.map(p=>p.id),s.book.pl);fl(bk.vis,VISITORS.map(v=>v.id),s.book.vis);fl(bk.b,B.map((b,i)=>String(i)),s.book.b);fl(bk.cl,['mon','pets','items','gear','pl','vis','b','dung','all'],s.book.cl);}
  if(o.pass&&typeof o.pass==='object'){s.pass.m=typeof o.pass.m==='string'&&/^\d{4}-\d{2}$/.test(o.pass.m)?o.pass.m:'';s.pass.pp=Math.floor(num(o.pass.pp));if(o.pass.cl) for(let i=0;i<30;i++) if(o.pass.cl[i]) s.pass.cl[i]=1;s.pass.gold=o.pass.gold?1:0;s.pass.bx=Math.floor(num(o.pass.bx,0));if(o.pass.gcl) for(let i=0;i<30;i++) if(o.pass.gcl[i]) s.pass.gcl[i]=1;}
  if(o.cos&&typeof o.cos==='object') Object.keys(COS).forEach(k=>{if(o.cos[k]) s.cos[k]=1;});
  if(o.tut&&typeof o.tut==='object'){s.tut.i=Math.min(TUT.length,Math.floor(num(o.tut.i)));s.tut.hide=o.tut.hide?1:0;}
  else if(s.all>=1e6) s.tut.i=TUT.length;
  if(o.seen&&typeof o.seen==='object') Object.keys(UNL).forEach(k=>{if(o.seen[k]) s.seen[k]=1;});
  else if(s.all>0) ['build','up','ach','orders','world','shop','asc'].forEach(k=>{if(s.all>=UNL[k]) s.seen[k]=1;});
  s.runT=typeof o.runT==='number'?num(o.runT):900;
  if(o.inf&&typeof o.inf==='object') INF.forEach(x=>{s.inf[x.id]=Math.min(x.max,Math.floor(num(o.inf[x.id])));});
  if(o.hero&&typeof o.hero==='object'){
    const H=o.hero,sH=s.hero,okIt=it=>it&&typeof it==='object'&&['w','a','t'].includes(it.s)&&typeof it.p==='number'&&isFinite(it.p)&&it.p>0?{id:Math.floor(num(it.id)),s:it.s,r:Math.min(4,Math.floor(num(it.r))),p:Math.min(1e9,it.p),up:Math.min(10,Math.floor(num(it.up)))}:null;
    sH.lvl=Math.max(1,Math.min(999,Math.floor(num(H.lvl,1))));sH.xp=num(H.xp);
    if(H.gear) ['w','a','t'].forEach(k=>{const it=okIt(H.gear[k]);if(it&&it.s===k) sH.gear[k]=it;});
    if(Array.isArray(H.bag)) sH.bag=H.bag.map(okIt).filter(Boolean).slice(0,20);
    sH.sta=Math.min(7,Math.floor(num(H.sta,5)));sH.staT=Math.min(Date.now(),num(H.staT,Date.now()));
    if(H.run&&H.run.k==='d') sH.sta=Math.min(7,sH.sta+1);
    sH.tower.best=Math.floor(num(H.tower&&H.tower.best));sH.auto=0;
    if(H.clr) DUNG.forEach(d=>{const n=Math.floor(num(H.clr[d.id]));if(n) sH.clr[d.id]=n;});
    sH.nid=Math.max(1,Math.floor(num(H.nid,1)));
    if(H.sk&&typeof H.sk==='object'){let tot=0;SKILLS.forEach(k=>{const v=Math.min(5,Math.floor(num(H.sk[k.id])));if(v>0&&tot+v<=sH.lvl-1){sH.sk[k.id]=v;tot+=v;}});}
    [sH.gear.w,sH.gear.a,sH.gear.t].concat(sH.bag).forEach(it=>{if(it&&it.id>=sH.nid) sH.nid=it.id+1;});
  }
  if(o.fr&&typeof o.fr==='object'){
    s.fr.earned=num(o.fr.earned);
    if(o.fr.s) CITIES.forEach(c=>{const x=o.fr.s[c.id];if(x&&typeof x==='object') s.fr.s[c.id]={L:Math.max(1,Math.min(10,Math.floor(num(x.L,1)))),st:Math.min(5,Math.floor(num(x.st))),stock:num(x.stock),ad:Math.min(120,num(x.ad)),cd:Math.min(900,num(x.cd)),truck:x.truck?1:0,ads:Math.min(200,Math.floor(num(x.ads)))};});
  }
  if(o.reb&&typeof o.reb==='object'){
    const r=o.reb;s.reb.pages=Math.floor(num(r.pages));s.reb.n=Math.floor(num(r.n));s.reb.base=Math.min(num(r.base),s.all);
    if(r.tree&&typeof r.tree==='object') REB.forEach(n=>{if(r.tree[n.id]) s.reb.tree[n.id]=1;});
    const sp=REB.reduce((a,n)=>a+(s.reb.tree[n.id]?n.c:0),0);if(sp>s.reb.pages) s.reb.pages=sp;
  }
  const spent=TREE.reduce((sum,n)=>sum+(s.tree[n.id]?n.cost:0),0);
  if(spent>s.chips) s.chips=spent;
  if(o.opt&&typeof o.opt==='object'){s.opt.fx=o.opt.fx!==false;if(o.opt.lang==='de'||o.opt.lang==='en') s.opt.lang=o.opt.lang;if(SKINS.some(k=>k.id===o.opt.skin)) s.opt.skin=o.opt.skin;s.opt.news=Math.floor(num(o.opt.news));if([0,1,2].includes(o.opt.vol)) s.opt.vol=o.opt.vol;if(['dark','light','auto'].includes(o.opt.look)) s.opt.look=o.opt.look;s.opt.compact=!!o.opt.compact;
    {const q=o.opt,d=DEFOPT();if(['short','long','sci'].includes(q.num)) s.opt.num=q.num;if([0,1,2].includes(q.fs)) s.opt.fs=q.fs;if(['orange','blue','teal','purple','pink'].includes(q.acc)) s.opt.acc=q.acc;
     s.opt.title=!!q.title;s.opt.vib=q.vib!==false;s.opt.eco=!!q.eco;s.opt.g3d=q.g3d!==false;s.opt.hc=!!q.hc;s.opt.ask=q.ask!==false;if([10,30,60].includes(q.as)) s.opt.as=q.as;if([0,1,2].includes(q.mus)) s.opt.mus=q.mus;if(q.trk==='auto'||TRK_OK.includes(q.trk)) s.opt.trk=q.trk;if(!q.m24) s.opt.mus=Math.max(1,s.opt.mus);s.opt.m24=1;if(['all','imp','off'].includes(q.ntf)) s.opt.ntf=q.ntf;if([3,5,8].includes(q.ntfT)) s.opt.ntfT=q.ntfT;s.opt.ntfB=q.ntfB!==false;if(['on','sys','off'].includes(q.motion)) s.opt.motion=q.motion;s.opt.start=q.start!==false;s.opt.shake=q.shake!==false;s.opt.upc=q.upc!==false;s.opt.bgm=q.bgm!==false;
     if(q.sn&&typeof q.sn==='object') Object.keys(d.sn).forEach(k=>{s.opt.sn[k]=q.sn[k]!==false;});}if(o.opt.cd&&typeof o.opt.cd==='object'){const q=(v,n)=>Math.max(0,Math.min(n-1,Math.floor(num(v))));s.opt.cd={d:q(o.opt.cd.d,DOUGHS.length),c:q(o.opt.cd.c,CHIPS.length),g:q(o.opt.cd.g,GLAZES.length),t:q(o.opt.cd.t,TOPS.length)};}}
  if(o.admin&&typeof o.admin==='object'){
    const cl=(v,lo,hi,d)=>(typeof v==='number'&&isFinite(v))?Math.min(hi,Math.max(lo,v)):d;
    ['prod','click','cost','speed','gold','goldPow'].forEach(k=>{s.admin[k]=cl(o.admin[k],1e-4,1e9,1);});
    s.admin.growth=cl(o.admin.growth,1.001,3,1.15);
    s.admin.ac=Math.floor(cl(o.admin.ac,0,1000,0));
    if(o.admin.b&&typeof o.admin.b==='object') B.forEach((_,i)=>{
      const e=o.admin.b[i];if(!e||typeof e!=='object') return;
      const r={};if(typeof e.cost==='number'&&e.cost>0&&isFinite(e.cost)) r.cost=e.cost;if(typeof e.cps==='number'&&e.cps>0&&isFinite(e.cps)) r.cps=e.cps;
      if(r.cost||r.cps) s.admin.b[i]=r;
    });
  }
  if(Array.isArray(o.buffs)) o.buffs.forEach(f=>{
    if(f&&BUFFIDS.includes(f.id)){const t0=num(f.t);if(t0>0&&t0<=3600) s.buffs.push({id:f.id,t:t0,v:Math.min(100,num(f.v,1.5))});}
  });
  s.goldT=num(o.goldT,rand(120,240));
  s.eg=sanEG(o.eg,s);
  if(o.cards&&typeof o.cards==='object'){const c=o.cards;s.cards.dust=Math.floor(num(c.dust,0));s.cards.opened=Math.floor(num(c.opened,0));if(c.own&&typeof c.own==='object') Object.keys(c.own).slice(0,40).forEach(k=>{if(/^[a-z]+\d$/.test(k)) s.cards.own[k]=Math.max(0,Math.min(5,Math.floor(num(c.own[k],0))));});}
  if(o.qual&&typeof o.qual==='object') ['flour','butter','sugar','choc'].forEach(k=>{s.qual[k]=Math.max(0,Math.min(10,Math.floor(num(o.qual[k],0))));});
  if(o.sys&&typeof o.sys==='object'){s.sys.init=o.sys.init?1:0;if(o.sys.seen&&typeof o.sys.seen==='object') Object.keys(o.sys.seen).slice(0,40).forEach(k=>{if(o.sys.seen[k]) s.sys.seen[String(k).slice(0,12)]=1;});}
  s.name=cleanName(o.name);
  if(o.lb&&typeof o.lb==='object'){s.lb.on=o.lb.on?1:0;s.lb.t=Math.min(num(o.lb.t),Date.now());s.lb.ls=num(o.lb.ls);s.lb.ban=o.lb.ban?1:0;if(o.lb.pb&&typeof o.lb.pb==='object'){const q=o.lb.pb,pb={};['W','M'].forEach(k=>{if(typeof q[k+'id']==='string'&&/^[WM]\d{4}-\d{2}$/.test(q[k+'id'])){pb[k+'id']=q[k+'id'];pb[k]=num(q[k]);}});s.lb.pb=pb;}if(typeof o.lb.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(o.lb.id)) s.lb.id=o.lb.id;}
  s.adm=o.adm?1:0;
  s.tamp=o.tamp||seal!=='ok'?1:0;
  if(o.codes&&typeof o.codes==='object') Object.keys(o.codes).slice(0,200).forEach(k=>{if(/^[0-9a-f]{12}$/.test(k)) s.codes[k]=num(o.codes[k],1)||1;});
  s.hist=sanHist(o.hist);
  s.rr=sanRR(o.rr);
  return s;
}
let storageOK=true;
function readSave(){
  let raw=null;
  try{raw=localStorage.getItem(SAVE_KEY);}catch(e){storageOK=false;}
  if(!raw) return null;
  try{return sanitize(JSON.parse(raw));}catch(e){return null;}
}
function enc(str){const bytes=new TextEncoder().encode(str);let bin='';bytes.forEach(b=>{bin+=String.fromCharCode(b);});return btoa(bin);}
function dec(b64){const bin=atob(b64.trim());const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes);}

/* V37: Spielstand-Siegel. Erkennt Spielstände, die außerhalb des Spiels geändert wurden. */
function sealHash(str){
  const k='64e78344ef81515b13764efac867108e',t=k+'|'+str+'|'+k;
  let a=0x9e3779b1,b=0x85ebca77,c=0xc2b2ae3d,d=0x27d4eb2f;
  for(let i=0;i<t.length;i++){
    const x=t.charCodeAt(i);
    a=Math.imul(a^x,2654435761);b=Math.imul(b^x,1597334677);c=Math.imul(c^x,2246822507);d=Math.imul(d^x,3266489909);
    a=((a<<13)|(a>>>19))+b|0;b=((b<<17)|(b>>>15))+c|0;c=((c<<11)|(c>>>21))+d|0;d=((d<<7)|(d>>>25))+a|0;
  }
  return [a,b,c,d].map(v=>{v^=v>>>16;v=Math.imul(v,2246822507);v^=v>>>13;v=Math.imul(v,3266489909);v^=v>>>16;return (v>>>0).toString(16).padStart(8,'0');}).join('');
}
function sealJSON(o){const j=JSON.stringify(o);return j.slice(0,-1)+(j.length>2?',':'')+'"sig":"'+sealHash(j)+'"}';}
function sealState(o){
  if(!o||typeof o!=='object') return 'bad';
  if(typeof o.sig!=='string') return 'none';
  const {sig,...rest}=o;return sealHash(JSON.stringify(rest))===sig?'ok':'bad';
}
(function sealMigrate(){
  try{
    if(localStorage.getItem('keksfabrik-seal')) return;
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);if(!/^keksfabrik-save-v1(-s\d+)?$/.test(k)) continue;
      const o=JSON.parse(localStorage.getItem(k));if(o&&typeof o==='object'&&sealState(o)==='none') localStorage.setItem(k,sealJSON(o));
    }
    const bk=JSON.parse(localStorage.getItem('keksfabrik-backups-v1')||'[]');
    if(Array.isArray(bk)){bk.forEach(x=>{try{const o=JSON.parse(x.s);if(sealState(o)==='none') x.s=sealJSON(o);}catch(e){}});localStorage.setItem('keksfabrik-backups-v1',JSON.stringify(bk));}
    localStorage.setItem('keksfabrik-seal','1');
  }catch(e){}
})();
let S=readSave();
const hadSave=!!S;
if(!S) S=fresh();
LANG=S.opt.lang;
let lastSaveAt=Date.now(),saveTime='';
function showSaveNote(){
  els.saveNote.textContent=!saveTime?tr('saved_auto'):storageOK?tr('saved_at',{t:saveTime}):tr('save_fail');
}
function save(){
  S.t=Date.now();lastSaveAt=S.t;
  try{localStorage.setItem(SAVE_KEY,sealJSON(S));storageOK=true;}catch(e){storageOK=false;}
  saveTime=new Date().toLocaleTimeString(LOC[LANG],{hour:'2-digit',minute:'2-digit'});
  showSaveNote();
}

/* V42: globale Events (vom Server) */
var GEV={prod:1,click:1,gold:1,orders:1};