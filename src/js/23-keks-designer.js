/* ===== Keks-Designer ===== */
let dsgSig='';
function updDesign(){
  setTxt(document.getElementById('designHead'),tt('Keks-Designer','Cookie designer'));
  if(panes.shop.hidden||!document.getElementById('designFold').open) return;
  const cd=S.opt.cd,sig=LANG+'|'+JSON.stringify(cd)+'|'+JSON.stringify(S.cos)+'|'+S.opt.skin;
  if(sig===dsgSig) return;
  dsgSig=sig;
  const row=(key,title,list)=>'<div class="drow"><b>'+title+'</b><div class="chips">'+list.map((o,i)=>{const lk=o.cos&&!S.cos[o.cos];return '<button type="button" class="chip'+(cd[key]===i?' on':'')+'" data-cd="'+key+':'+i+'"'+(lk?' disabled title="'+tt('Saison-Pass','Season pass')+'"':'')+'>'+tx(o.n)+(lk?' 🔒':'')+'</button>';}).join('')+'</div></div>';
  const using=S.opt.skin==='custom';
  document.getElementById('designBox').innerHTML='<div class="dsg"><div class="prev">'+cookieSVG(customSkin(),'dsgp')+'</div><div>'
    +row('d',tt('Teig','Dough'),DOUGHS)+row('c',tt('Stückchen','Chips'),CHIPS)+row('g',tt('Glasur','Glaze'),GLAZES)+row('t',tt('Streusel','Toppings'),TOPS)
    +'<div class="btns"><button type="button" class="btn'+(using?'':' primary')+'" data-cd="use">'+(using?tt('✓ Wird benutzt','✓ In use'):tt('Dieses Design benutzen','Use this design'))+'</button></div>'
    +'<p class="small" style="margin-top:8px">'+tt('Gesperrte Teile (🔒) schaltest du im Saison-Pass frei.','Locked parts (🔒) are unlocked in the season pass.')+'</p></div></div>';
}
document.getElementById('designBox').addEventListener('click',e=>{
  const b=e.target.closest('[data-cd]');if(!b||b.disabled) return;
  const v=b.dataset.cd;
  if(v==='use'){S.opt.skin='custom';S.sec.design=(S.sec.design||0)+1;setSkin();lootSig='';dsgSig='';checkAch(false);render();snd('claim');return;}
  const [k,i]=v.split(':');S.opt.cd[k]=+i;dsgSig='';
  if(S.opt.skin==='custom'){setSkin();lootSig='';}
  render();
});

