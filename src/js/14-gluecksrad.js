/* ===== Glücksrad ===== */
const WHEEL=[
  {id:'ck',w:24,c:'#e3a24c',l:['Kekse','Cookies'],n:['15 Minuten Kekse','15 minutes of cookies']},
  {id:'gem',w:16,c:'#5aa0d8',l:['Edelsteine','Gems'],n:['5–14 Edelsteine','5–14 gems']},
  {id:'fr',w:14,c:'#e0567a',l:['Rausch','Frenzy'],n:['Produktions-Rausch ×7','Production frenzy ×7']},
  {id:'herb',w:12,c:'#5fb36a',l:['Kräuter','Herbs'],n:['8 Kräuter','8 herbs']},
  {id:'click',w:12,c:'#b48cf2',l:['Klick','Click'],n:['Klick-Rausch','Click frenzy']},
  {id:'ck1',w:12,c:'#d9853b',l:['1 Std','1 hour'],n:['1 Stunde Kekse','1 hour of cookies']},
  {id:'star',w:7,c:'#3e3178',l:['Stern','Star'],n:['1 Sternenkrümel','1 star crumb']},
  {id:'jp',w:3,c:'#f1b24a',l:['JACKPOT','JACKPOT'],n:['Jackpot: 4 Std Kekse, 25 Edelsteine, 2 Sternenkrümel','Jackpot: 4 h cookies, 25 gems, 2 star crumbs']}
];
const WHEEL_TOT=WHEEL.reduce((a,s)=>a+s.w,0);
function wheelState(){const W=S.wheel,today=dayKey(tNow());if(W.d!==today){W.d=today;W.free=0;W.ext=0;}return W;}
const wheelFree=()=>wheelState().free<1;
const wheelExtCost=()=>20+10*S.wheel.ext;
let wheelRot=0,wheelBusy=false,wheelSvgSig='',wheelWin=null;
function wheelSvg(){
  const N=WHEEL.length,R=100,seg=Math.PI*2/N;let p='';
  WHEEL.forEach((s,i)=>{
    const a0=-Math.PI/2+i*seg,a1=a0+seg,x0=R+R*Math.cos(a0),y0=R+R*Math.sin(a0),x1=R+R*Math.cos(a1),y1=R+R*Math.sin(a1);
    p+='<path d="M100 100L'+x0.toFixed(2)+' '+y0.toFixed(2)+'A100 100 0 0 1 '+x1.toFixed(2)+' '+y1.toFixed(2)+'Z" fill="'+s.c+'" stroke="rgba(0,0,0,.25)" stroke-width="1"/>';
    const am=(i+.5)*360/N;
    p+='<text x="100" y="30" transform="rotate('+am+' 100 100)" text-anchor="middle" font-family="Figtree,system-ui,sans-serif" font-weight="800" font-size="'+(s.id==='jp'?11:12.5)+'" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="2.4" paint-order="stroke">'+tx(s.l)+'</text>';
  });
  return '<svg viewBox="-6 -6 212 212" aria-hidden="true"><circle cx="100" cy="100" r="104" fill="#5b3a1e" stroke="#2f1d0e" stroke-width="2"/><g id="wheelG" style="transform:rotate('+wheelRot+'deg)">'+p+'</g>'
    +Array.from({length:16},(_,k)=>{const a=k*Math.PI/8;return '<circle cx="'+(100+102*Math.cos(a)).toFixed(1)+'" cy="'+(100+102*Math.sin(a)).toFixed(1)+'" r="2.4" fill="#ffe3a8"/>';}).join('')
    +'<circle cx="100" cy="100" r="22" fill="#f6cf80" stroke="#8f5a1b" stroke-width="3"/><circle cx="93" cy="95" r="3.2" fill="#4b2a16"/><circle cx="106" cy="98" r="2.8" fill="#4b2a16"/><circle cx="98" cy="107" r="3" fill="#4b2a16"/></svg>';
}
function giveWheel(i){
  const s=WHEEL[i];if(!s) return;const k0=C.kps0;let msg='';
  if(s.id==='ck'){const g=Math.max(250,k0*900);addCk(g);msg='+'+fmt(g)+' '+tt('Kekse','cookies');}
  else if(s.id==='ck1'){const g=Math.max(1000,k0*3600);addCk(g);msg='+'+fmt(g)+' '+tt('Kekse','cookies');}
  else if(s.id==='gem'){const g=5+Math.floor(Math.random()*10);addMat('gem',g);msg='+'+g+' '+matName('gem');}
  else if(s.id==='herb'){addMat('herb',8);msg='+8 '+matName('herb');}
  else if(s.id==='fr'){applyGold('frenzy');msg=tt('Produktions-Rausch!','Production frenzy!');}
  else if(s.id==='click'){applyGold('click');msg=tt('Klick-Rausch!','Click frenzy!');}
  else if(s.id==='star'){if(S.all>=STAR_UNLOCK){giveStar(1,tt('Glücksrad','Lucky wheel'),true);msg='+1 '+tt('Sternenkrümel','star crumb');}else{addMat('gem',15);msg='+15 '+matName('gem');}}
  else if(s.id==='jp'){const g=Math.max(5000,k0*14400);addCk(g);addMat('gem',25);if(S.all>=STAR_UNLOCK) giveStar(2,'',true);S.wheel.jp++;msg='+'+fmt(g)+' '+tt('Kekse','cookies')+', +25 '+matName('gem')+(S.all>=STAR_UNLOCK?', +2 '+tt('Sternenkrümel','star crumbs'):'');}
  wheelWin={i,msg};
  if(s.id==='jp'){snd('star');confetti(60);flash(.4,900);}else{snd('win');confetti(18);}
  toast(tt('Glücksrad: ','Lucky wheel: ')+tx(s.n)+' – '+msg,true);
  lootSig='';save();
}
function spinWheel(paid){
  if(wheelBusy) return false;const W=wheelState();
  if(W.pend>=0) return false;
  if(paid){const c=wheelExtCost();if(W.free<1||W.ext>=3||S.w.mat.gem<c) return false;S.w.mat.gem-=c;W.ext++;}
  else{if(W.free>=1) return false;W.free=1;}
  let r=Math.random()*WHEEL_TOT,i=0;for(;i<WHEEL.length-1;i++){r-=WHEEL[i].w;if(r<0) break;}
  W.n++;W.last=WHEEL[i].id;W.pend=i;wheelWin=null;save();
  const sg=360/WHEEL.length,want=(360-(i*sg+sg/2)+(Math.random()-.5)*sg*.7+3600)%360;
  wheelRot=wheelRot-(wheelRot%360)+360*6+want;
  const g=document.getElementById('wheelG'),dur=fxOk()?4300:0;wheelBusy=true;
  if(g){g.style.transition=dur?'transform '+dur+'ms cubic-bezier(.1,.75,.12,1)':'none';g.style.transform='rotate('+wheelRot+'deg)';}
  if(dur){let t=0,st=45;while(t<dur*.93){setTimeout(()=>snd('tick'),t);t+=st;st*=1.09;}}
  setTimeout(()=>{wheelBusy=false;if(S.wheel.pend===i){S.wheel.pend=-1;giveWheel(i);}render();},dur+120);
  render();return true;
}
function updWheel(){
  const W=wheelState();
  if(W.pend>=0&&!wheelBusy){const i=W.pend;W.pend=-1;giveWheel(i);}
  if(panes.ach.hidden||gSub!=='wheel') return;
  const box=document.getElementById('wheelSvg'),ws=LANG;
  if(wheelSvgSig!==ws&&!wheelBusy){wheelSvgSig=ws;box.innerHTML=wheelSvg();}
  const now=new Date(),mid=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime(),left=Math.max(0,Math.ceil((mid-now.getTime())/1000));
  const free=W.free<1,c=wheelExtCost(),canExt=!free&&W.ext<3;
  let html='<h3 class="wt">'+tt('Glücksrad','Lucky wheel')+'</h3><p class="small wnote">'+tt('Einmal am Tag gratis drehen. Danach bis zu 3-mal mit Edelsteinen.','Spin for free once a day. After that up to 3 times with gems.')+'</p>';
  if(wheelBusy) html+='<div class="btns"><button type="button" class="btn primary dis">'+tt('Dreht …','Spinning …')+'</button></div>';
  else if(free) html+='<div class="btns"><button type="button" class="btn primary" data-wh="free">'+tt('Gratis drehen!','Spin for free!')+'</button></div>';
  else html+='<p class="small">'+tt('Nächste Gratis-Drehung in ','Next free spin in ')+'<b data-l="wcd"></b></p><div class="btns" style="margin-top:8px">'+(canExt?'<button type="button" class="btn primary" data-wh="paid" data-need="'+c+'" data-res="gem">'+tt('Nochmal drehen: ','Spin again: ')+c+' '+matName('gem')+' ('+(3-W.ext)+tt(' übrig',' left')+')</button>':'<button type="button" class="btn dis">'+tt('Heute keine Drehungen mehr','No more spins today')+'</button>')+'</div>';
  if(wheelWin&&!wheelBusy) html+='<div class="whwin">'+tx(WHEEL[wheelWin.i].n)+'<br><span class="small">'+wheelWin.msg+'</span></div>';
  html+='<h3 class="wt" style="margin-top:16px">'+tt('Preise','Prizes')+'</h3>'+WHEEL.map(s=>'<div class="whprize"><i style="background:'+s.c+'"></i><span>'+tx(s.n)+'</span><small>'+(Math.round(s.w/WHEEL_TOT*1000)/10).toLocaleString(LOC[LANG])+' %</small></div>').join('')
    +'<p class="small" style="margin-top:10px">'+tt('Drehungen gesamt: ','Total spins: ')+'<b>'+W.n+'</b> · '+tt('Jackpots: ','Jackpots: ')+'<b>'+W.jp+'</b> · '+matName('gem')+': <b>'+Math.floor(S.w.mat.gem)+'</b></p>';
  mount(document.getElementById('wheelInfo'),{html,live:{wcd:fmtDur(left)},wid:{}},{gem:S.w.mat.gem});
}
document.getElementById('wheelInfo').addEventListener('click',e=>{
  const b=e.target.closest('[data-wh]');if(!b) return;
  if(!spinWheel(b.dataset.wh==='paid')) nope(b);
});
