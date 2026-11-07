/* ===== Saison-Pass ===== */
const monthKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};
function passCheck(){const P=S.pass,m=monthKey();if(P.m!==m){const had=P.m;P.m=m;P.pp=0;P.cl={};P.gold=0;P.gcl={};P.bx=0;if(had) toast(tt('Eine neue Saison hat begonnen!','A new season has started!'),true);}}
function addPP(n){passCheck();S.pass.pp+=n;}
const passTier=()=>Math.min(30,Math.floor(S.pass.pp/PASS_PP));
const passReady=()=>{passCheck();const t=passTier();for(let i=0;i<t;i++) if(!S.pass.cl[i]) return true;return false;};
function passRwTxt(r){
  const p=[];
  if(r.c) p.push(fmt(Math.max(1000,C.kps0*r.c))+' '+tt('Kekse','cookies'));
  if(r.gem) p.push(r.gem+' '+matName('gem'));
  if(r.tooth) p.push(r.tooth+' '+matName('tooth'));
  if(r.herb) p.push(r.herb+' '+matName('herb'));
  if(r.egg) p.push(tt('1 Ei','1 egg'));
  if(r.box) p.push(tt('1 Gegenstand','1 item'));
  if(r.star) p.push(tt('1 Sternenkrümel','1 star crumb'));
  if(r.cos) p.push(tt('Design: ','Design: ')+tx(COS[r.cos]));
  return p.join(' + ');
}
function claimPass(i){
  passCheck();
  if(i<0||i>=passTier()||S.pass.cl[i]) return false;
  const r=PASSR[i];S.pass.cl[i]=1;
  if(r.c) addCk(Math.max(1000,C.kps0*r.c));
  if(r.gem) addMat('gem',r.gem);
  if(r.tooth) addMat('tooth',r.tooth);
  if(r.herb) addMat('herb',r.herb);
  if(r.egg) S.w.pet.eggs++;
  if(r.box){if(S.all>=BOX_UNLOCK) rollItem();else addCk(Math.max(1000,C.kps0*600));}
  if(r.cos){S.cos[r.cos]=1;lootSig='';}
  toast(tt('Pass-Stufe ','Pass tier ')+(i+1)+': '+passRwTxt(r),true);confetti(10);
  if(r.star) giveStar(r.star,tt('Saison-Pass','Season pass'));
  return true;
}
function claimPassAll(){let n=0;const t=passTier();for(let i=0;i<t;i++) if(!S.pass.cl[i]&&claimPass(i)) n++;return n;}
const PREMR=[{gem:10},{frag:3},{c:3600},{pack:1},{star:1},{gem:15},{frag:5},{c:7200},{pack:1},{star:1},
  {gem:20},{frag:5},{c:10800},{pack:1},{star:2},{gem:25},{frag:8},{c:14400},{pack:2},{star:2},
  {gem:30},{frag:10},{c:21600},{pack:2},{star:3},{gem:40},{frag:12},{c:28800},{pack:3},{star:5}];
const GOLDPASS=180,SEASONS=[['Winterkekse','Winter Cookies'],['Herzklopfen','Heartbeat'],['Frühlingsblüte','Spring Bloom'],['Osterkekse','Easter Cookies'],['Maiglöckchen','Lily of the Valley'],['Sommerbrise','Summer Breeze'],['Eiskekse','Ice Cookies'],['Strandkekse','Beach Cookies'],['Erntezeit','Harvest Time'],['Gruselkekse','Spooky Cookies'],['Herbstlaub','Autumn Leaves'],['Lebkuchenzeit','Gingerbread Time']];
const EGG_SVG='<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="16" ry="21" fill="#fff3d6" stroke="#3b2416" stroke-width="2.4"/><circle cx="26" cy="30" r="3.2" fill="#f2a6c4"/><circle cx="37" cy="42" r="2.8" fill="#7fb8f2"/><circle cx="35" cy="25" r="2" fill="#7fd69b"/></svg>';
function rwIcon(r){
  if(r.star) return art('star');if(r.cos) return art('spark');if(r.pack) return art('album');if(r.frag) return art('amulet');if(r.box) return art('box');if(r.egg) return EGG_SVG;
  if(r.gem) return matSVG('gem');if(r.tooth) return matSVG('tooth');if(r.herb) return matSVG('herb');return art('cookie');
}
function rwAmt(r){
  if(r.star) return '×'+r.star;if(r.cos) return tt('Design','Design');if(r.pack) return '×'+r.pack;if(r.frag) return '×'+r.frag;if(r.box) return '×1';if(r.egg) return '×1';
  if(r.gem) return '×'+r.gem;if(r.tooth) return '×'+r.tooth;if(r.herb) return '×'+r.herb;return fmt(Math.max(1000,C.kps0*r.c));
}
function premTxt(r){const p=[];if(r.c) p.push(fmt(Math.max(1000,C.kps0*r.c))+' '+tt('Kekse','cookies'));if(r.gem) p.push(r.gem+' '+matName('gem'));if(r.frag) p.push(r.frag+' '+tt('Artefakt-Splitter','artifact shards'));if(r.pack) p.push(r.pack+' '+tt('Kartenpäckchen','card pack'+(r.pack>1?'s':'')));if(r.star) p.push(r.star+' '+tt('Sternenkrümel','star crumbs'));return p.join(' + ');}
function claimPrem(i){
  passCheck();const P=S.pass;
  if(!P.gold||i<0||i>=passTier()||P.gcl[i]) return false;
  const r=PREMR[i];P.gcl[i]=1;
  if(r.c) addCk(Math.max(1000,C.kps0*r.c));
  if(r.gem) addMat('gem',r.gem);
  if(r.frag) giveFrag(r.frag,'',true);
  if(r.star) giveStar(r.star,tt('Gold-Pass','Gold pass'),true);
  if(r.pack){const res=[];for(let k=0;k<r.pack*5;k++) res.push(giveCard(rollCard(true)));S.cards.opened+=r.pack;recalc();cardSig='';showPack(res);}
  toast(tt('Gold-Pass Stufe ','Gold pass tier ')+(i+1)+': '+premTxt(r),true);confetti(14);
  return true;
}
const premReady=()=>{const P=S.pass;if(!P.gold) return false;const t=passTier();for(let i=0;i<t;i++) if(!P.gcl[i]) return true;return false;};
const passBonusN=()=>Math.max(0,Math.floor((S.pass.pp-30*PASS_PP)/PASS_PP)-S.pass.bx);
function claimPassBonus(){if(passBonusN()<1) return false;S.pass.bx++;addMat('gem',5);addCk(Math.max(1000,C.kps0*600));toast(tt('Bonus-Truhe: +5 ','Bonus chest: +5 ')+matName('gem'),true);if(Math.random()<.1) giveStar(1,tt('Bonus-Truhe','Bonus chest'));return true;}
function buyGoldPass(){passCheck();const P=S.pass;if(P.gold||S.w.mat.gem<GOLDPASS) return false;S.w.mat.gem-=GOLDPASS;P.gold=1;toast(tt('Gold-Pass freigeschaltet! Hol dir alle Gold-Belohnungen.','Gold pass unlocked! Claim all gold rewards.'),true);confetti(60);snd('star');return true;}
let passScrolled='';
function passR(){
  passCheck();
  const P=S.pass,t=passTier(),live={},wid={},d=new Date(),end=new Date(d.getFullYear(),d.getMonth()+1,1),se=SEASONS[d.getMonth()];
  const rd=passReady()||premReady()||passBonusN()>0;
  let h='<div class="bp-banner"><div class="bp-lvl"><small>'+tt('Stufe','Tier')+'</small><b>'+t+'</b></div><div class="bp-info"><span class="bp-season">'+tt('Saison ','Season ')+(d.getMonth()+1)+' · '+tx(se)+'</span><span class="small">'+tt('Endet in ','Ends in ')+'<b data-l="end"></b></span>'
    +'<span class="obar big"><i data-w="pp"></i></span><span class="small" data-l="pp"></span></div>'
    +'<div class="bp-act"><button type="button" class="btn primary'+(rd?'':' dis')+'" data-pc="all">'+tt('Alles abholen','Claim all')+'</button>'+(P.gold?'<span class="bp-gold on">★ '+tt('Gold-Pass aktiv','Gold pass active')+'</span>':'<button type="button" class="btn bp-buy'+(S.w.mat.gem>=GOLDPASS?'':' dis')+'" data-pb="1">★ '+tt('Gold-Pass: ','Gold pass: ')+GOLDPASS+' '+matName('gem')+'</button>')+'</div></div>';
  live.pp=fmt(P.pp)+tt(' Punkte',' points')+(t<30?' · '+tt('nächste Stufe bei ','next tier at ')+fmt((t+1)*PASS_PP):' · '+tt('Bonus-Truhen alle 50 Punkte','bonus chests every 50 points'));
  wid.pp=t>=30?((P.pp-30*PASS_PP)%PASS_PP)/PASS_PP*100:(P.pp%PASS_PP)/PASS_PP*100;live.end=fmtDur((end-d)/1000);
  h+='<div class="bp-wrap"><div class="bp-lab"><span class="free">'+tt('Gratis','Free')+'</span><span class="mid"></span><span class="prem">★ '+tt('Gold','Gold')+'</span></div><div class="bp-track" id="bpTrack">';
  PASSR.forEach((r,i)=>{
    const pr=PREMR[i],unl=i<t,fg=!!P.cl[i],pg=!!P.gcl[i];
    const cell=(rw,got,ready,lock,attr,big,txt)=>'<div class="bp-cell'+(got?' got':ready?' ready':' lock')+(big?' big':'')+(lock?' nop':'')+'" title="'+txt.replace(/"/g,'')+'"><span class="bp-ic">'+rwIcon(rw)+'</span><span class="bp-amt">'+rwAmt(rw)+'</span>'+(got?'<span class="bp-ok">✓</span>':ready?'<button type="button" class="btn sm primary" '+attr+'>'+tt('Holen','Claim')+'</button>':lock?'<span class="bp-lock">🔒</span>':'')+'</div>';
    h+='<div class="bp-col'+(i===t?' cur':'')+(unl?' unl':'')+'">'
      +cell(r,fg,unl&&!fg,false,'data-pc="'+i+'"',r.star||r.cos,passRwTxt(r))
      +'<div class="bp-node"><span>'+(i+1)+'</span></div>'
      +cell(pr,pg,unl&&!pg&&P.gold,!P.gold,'data-pg="'+i+'"',pr.star||pr.pack,premTxt(pr))+'</div>';
  });
  const bn=passBonusN();
  h+='<div class="bp-col bonus"><div class="bp-cell big'+(bn?' ready':' lock')+'"><span class="bp-ic">'+art('box')+'</span><span class="bp-amt">'+tt('Bonus','Bonus')+(bn?' ×'+bn:'')+'</span>'+(bn?'<button type="button" class="btn sm primary" data-px="1">'+tt('Holen','Claim')+'</button>':'')+'</div><div class="bp-node"><span>∞</span></div><div class="bp-cell lock"><span class="small">'+tt('Alle 50 Punkte nach Stufe 30','Every 50 points after tier 30')+'</span></div></div>';
  h+='</div></div>';
  h+='<details class="fold" style="margin-top:12px"><summary class="wt">'+tt('So bekommst du Pass-Punkte','How to earn pass points')+'</summary><ul class="earn small"><li><b>'+tt('Tagesaufgaben','Daily tasks')+'</b>: +10</li><li><b>'+tt('Bonus-Truhe','Bonus chest')+'</b>: +20</li><li><b>'+tt('Login','Login')+'</b>: +10</li><li><b>'+tt('Erfolge','Achievements')+'</b>: +5</li><li><b>'+tt('Dungeons','Dungeons')+'</b>: +5</li><li><b>'+tt('Aufträge','Orders')+'</b>: +3</li><li><b>'+tt('Turm','Tower')+'</b>: +2</li><li><b>'+tt('Goldkekse & Monster','Golden cookies & monsters')+'</b>: +1</li></ul><p class="small">'+tt('Jede Stufe braucht 50 Punkte. Am Monatsende beginnt eine neue Saison mit neuen Belohnungen. Der Gold-Pass gilt für eine Saison.','Every tier needs 50 points. At the end of the month a new season starts. The gold pass lasts one season.')+'</p></details>';
  return {html:h,live,wid};
}
function passScroll(){
  const tr=document.getElementById('bpTrack');if(!tr) return;
  const key=S.pass.m+'|'+passTier()+'|'+LANG;if(passScrolled===key) return;passScrolled=key;
  const c=tr.querySelector('.bp-col.cur')||tr.lastElementChild;if(c) tr.scrollLeft=Math.max(0,c.offsetLeft-tr.clientWidth/2+c.clientWidth/2);
}
/* --- Ziele-Übersicht und Navigation --- */
const GICO={daily:'timer',wheel:'lucky',ttl:'crown',pass:'star',ach:'album',book:'book',stats:'scale'};
document.querySelectorAll('#gSeg [data-g]').forEach(b=>{const lab=document.createElement('span');lab.className='gl';while(b.firstChild) lab.appendChild(b.firstChild);b.innerHTML='<span class="gi">'+art(GICO[b.dataset.g]||'star')+'</span><i class="gdot" hidden></i>';b.appendChild(lab);if(b.dataset.i18n){lab.dataset.i18n=b.dataset.i18n;b.removeAttribute('data-i18n');}});
let gOverSig='';
function updGoalsUI(){
  const dots={daily:!loginGot()||S.day.q.some(q=>!q.c&&qDone(q))||bonusReady(),wheel:S.all>=5e4&&wheelFree(),pass:passReady()||premReady()||passBonusN()>0,book:bookReady()};
  document.querySelectorAll('#gSeg [data-g]').forEach(b=>{const d=b.querySelector('.gdot');if(d){const v=!!dots[b.dataset.g];if(d.hidden===v) d.hidden=!v;}});
  if(panes.ach.hidden) return;
  const qd=S.day.q.filter(q=>q.c).length,an=Object.keys(S.ach).length,rd=goalsReady()||premReady()||passBonusN()>0;
  const sig=[LANG,qd,S.day.q.length,passTier(),an,S.day.streak,rd,S.pass.gold].join('|');if(sig===gOverSig) return;gOverSig=sig;
  const chip=(ic,l,v,g)=>'<button type="button" class="gochip" data-gog="'+g+'"><span class="ico">'+art(ic)+'</span><span><small>'+l+'</small><b>'+v+'</b></span></button>';
  document.getElementById('gOver').innerHTML='<div class="gochips">'+chip('timer',tt('Heute','Today'),qd+' / '+S.day.q.length,'daily')+chip('star',tt('Pass','Pass'),tt('Stufe ','Tier ')+passTier()+(S.pass.gold?' ★':''),'pass')+chip('album',tt('Erfolge','Achievements'),an+' / '+A.length,'ach')+chip('flame',tt('Login-Serie','Streak'),S.day.streak+' '+tt(S.day.streak===1?'Tag':'Tage',S.day.streak===1?'day':'days'),'daily')+'</div>'
    +'<button type="button" class="btn primary'+(rd?'':' dis')+'" id="gClaimAll">'+tt('Alles abholen','Claim all')+'</button>';
}
document.getElementById('gOver').addEventListener('click',e=>{
  if(e.target.closest('#gClaimAll')){let n=claimAll()?1:0;if(S.pass.gold){const t=passTier();for(let i=0;i<t;i++) if(!S.pass.gcl[i]&&claimPrem(i)) n++;}while(claimPassBonus()) n++;if(!n) nope(e.target.closest('#gClaimAll'));else{snd('claim');gOverSig='';}render();return;}
  const c=e.target.closest('[data-gog]');if(c){gSub=c.dataset.gog;document.querySelectorAll('.gsub').forEach(s=>{s.hidden=s.dataset.gsub!==gSub;});render();}
});
/* Erfolge filtern */
let achFilter='all';
function updAchF(){
  const el=document.getElementById('achF');if(!el) return;
  const n=Object.keys(S.ach).length,pl=A.filter(a=>a.plat).length;
  const s=LANG+'|'+achFilter+'|'+n;if(el._s===s) return;el._s=s;
  el.innerHTML=[['all',tt('Alle','All'),A.length],['on',tt('Geschafft','Done'),n],['off',tt('Offen','Open'),A.length-n],['plat',tt('Platin','Platinum'),pl]].map(x=>'<button type="button" class="chip'+(achFilter===x[0]?' on':'')+'" data-af="'+x[0]+'">'+x[1]+' <small>'+x[2]+'</small></button>').join('');
  els.achGrid.dataset.f=achFilter;
}
document.getElementById('achF').addEventListener('click',e=>{const b=e.target.closest('[data-af]');if(!b) return;achFilter=b.dataset.af;updAchF();});
