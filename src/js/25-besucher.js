/* ===== Besucher ===== */
let visCur=null;
function visCoin(){const v=Math.floor(S.cookies*.05);if(Math.random()<.5){addCk(v);return tt('Gewonnen! +','You won! +')+fmt(v);}S.cookies-=v;return tt('Verloren: −','You lost: −')+fmt(v);}
function visTick(rdt){
  if(S.all<1e5) return;
  if(visCur){if(Date.now()>visCur.until){const v=VISITORS.find(x=>x.id===visCur.id);toast(tx(v.n)+tt(' ist wieder gegangen.',' has left again.'));visCur=null;S.vis.next=rand(480,900);if(!document.getElementById('visOv').hidden) document.getElementById('visOv').hidden=true;}return;}
  S.vis.next-=rdt;
  if(S.vis.next<=0){
    const v=VISITORS[Math.floor(Math.random()*VISITORS.length)];
    visCur={id:v.id,until:Date.now()+180000};S.vis.n++;S.book.vis[v.id]=1;
    toast(tt('Es klopft! ','Knock knock! ')+tx(v.n)+tt(' möchte mit dir reden.',' wants to talk to you.'),true);snd('claim');
  }
}
function visChip(){
  if(!visCur) return '';
  const v=VISITORS.find(x=>x.id===visCur.id);
  return '<button type="button" class="buff vis" data-vis="1">'+tt('Besuch: ','Visitor: ')+tx(v.n)+' · '+mmss(Math.max(0,(visCur.until-Date.now())/1000))+'</button>';
}
function openVis(){
  if(!visCur) return;
  const v=VISITORS.find(x=>x.id===visCur.id);
  document.getElementById('visT').textContent=tx(v.n);
  document.getElementById('visClose').textContent=tt('Später','Later');
  document.getElementById('visBody').innerHTML='<div class="vis-head"><span class="av">'+avatarSVG(v.look)+'</span><p>'+tx(v.txt)+'</p></div><div class="vch">'+v.ch.map((c,i)=>{const ok=!c.ok||c.ok();return '<button type="button" class="btn'+(i===0?' primary':'')+(ok?'':' dis')+'" data-vc="'+i+'"'+(ok?'':' disabled')+'>'+tx(c.t)+'</button>';}).join('')+'</div>';
  document.getElementById('visOv').hidden=false;
  const f=document.querySelector('#visBody [data-vc]:not([disabled])');if(f) f.focus();
}
els.buffs.addEventListener('click',e=>{if(e.target.closest('[data-vis]')) openVis();});
document.getElementById('visClose').addEventListener('click',()=>{document.getElementById('visOv').hidden=true;});
document.getElementById('visOv').addEventListener('click',e=>{
  if(e.target.id==='visOv'){e.target.hidden=true;return;}
  const b=e.target.closest('[data-vc]');if(!b||!visCur) return;
  const v=VISITORS.find(x=>x.id===visCur.id),c=v.ch[+b.dataset.vc];
  if(c.ok&&!c.ok()){nope(b);return;}
  const res=c.do?c.do():'';
  visCur=null;S.vis.next=rand(480,900);
  document.getElementById('visOv').hidden=true;
  toast(tx(v.n)+(res?': '+res:tt(' winkt und geht weiter.',' waves and moves on.')),!!res);
  snd('claim');checkAch(false);render();
});
document.addEventListener('keydown',e=>{const o=document.getElementById('visOv');if(!o.hidden&&e.key==='Escape'){e.preventDefault();o.hidden=true;}});
