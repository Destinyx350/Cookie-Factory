/* ===== Melde-Fenster ===== */
const ntfOv=document.getElementById('ntfOv');
function renderNtf(){
  setTxt(document.getElementById('ntfT'),tt('Meldungen','Notifications'));
  setTxt(document.getElementById('ntfClear'),tt('Leeren','Clear'));
  setTxt(document.getElementById('ntfClose'),tt('Schließen','Close'));
  document.getElementById('ntfBody').innerHTML=NTF.length?'<div class="nlist">'+NTF.slice().reverse().map(n=>'<div class="nitem'+(n.gold?' gold':'')+'"><span>'+n.text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c])+'</span><time>'+agoTxt(n.t)+'</time></div>').join('')+'</div>':'<p class="small">'+tt('Noch keine Meldungen.','No notifications yet.')+'</p>';
}
function updNtf(){
  const b=document.getElementById('ntfBadge'),show=ntfUnread>0&&S.opt.ntfB!==false;
  if(b.hidden===show) b.hidden=!show;
  if(show) setTxt(b,ntfUnread>99?'99+':String(ntfUnread));
  document.getElementById('ntfBtn').setAttribute('aria-label',tt('Meldungen','Notifications'));
  if(!ntfOv.hidden){const s=NTF.length+'|'+(NTF.length?NTF[NTF.length-1].t:0)+'|'+Math.floor(Date.now()/30000)+'|'+LANG;if(s!==ntfSig){ntfSig=s;renderNtf();}}
}
document.getElementById('ntfBtn').addEventListener('click',()=>{ntfOv.hidden=false;ntfUnread=0;ntfSig='';updNtf();document.getElementById('ntfClose').focus();});
document.getElementById('ntfClose').addEventListener('click',()=>{ntfOv.hidden=true;});
document.getElementById('ntfClear').addEventListener('click',()=>{NTF.length=0;ntfSig='';updNtf();});
ntfOv.addEventListener('click',e=>{if(e.target===ntfOv) ntfOv.hidden=true;});
document.addEventListener('keydown',e=>{if(!ntfOv.hidden&&e.key==='Escape'){e.preventDefault();ntfOv.hidden=true;}});

