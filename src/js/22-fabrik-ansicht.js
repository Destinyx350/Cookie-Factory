/* ===== Fabrik-Ansicht ===== */
function factR(){
  const live={},wid={};let h='';
  const own=B.map((b,i)=>i).filter(i=>S.b[i]>0);
  if(!own.length) return {html:'<p class="small">'+tt('Kauf dein erstes Gebäude, dann siehst du es hier arbeiten.','Buy your first building and watch it work here.')+'</p>',live,wid};
  own.forEach(i=>{
    const n=S.b[i],show=Math.min(n,12),share=C.kps>0?C.per[i]*n/C.kps:0,dur=(1.6+3.4*(1-Math.min(1,share*2))).toFixed(1);
    let icons='';for(let k=0;k<show;k++) icons+='<span class="bu" style="animation-delay:'+(-(k*.23+i*.11)%1.4).toFixed(2)+'s">'+art('b'+i)+'</span>';
    h+='<div class="lane"><span class="lname">'+tx(B[i].name)+'<small>× '+fmt(n)+'</small></span><span class="lwork"><span class="lrow">'+icons+'</span><span class="lbelt">'+[0,1,2].map(k=>'<i style="animation-duration:'+dur+'s;animation-delay:'+(-k*dur/3).toFixed(2)+'s"></i>').join('')+'</span></span><span class="lps" data-l="p'+i+'"></span></div>';
    live['p'+i]='+'+fmtRate(C.per[i]*n)+'/s';
  });
  return {html:h,live,wid};
}
function updFact(){
  const f=document.getElementById('factFold');
  setTxt(document.getElementById('factHead'),tt('Fabrik-Ansicht','Factory view'));
  if(panes.build.hidden||!f.open) return;
  const v=document.getElementById('factView');v.classList.toggle('still',!fxOk());
  mount(v,factR(),{});
}
