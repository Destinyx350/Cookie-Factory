/* ===== Spielstände ===== */
let slotSig='',slotConf={n:0,t:0};
function slotInfo(n){
  if(n===SLOT) return {all:S.all,asc:S.asc,t:Date.now(),act:1,name:S.name};
  try{const raw=localStorage.getItem(slotKey(n));if(!raw) return null;const o=JSON.parse(raw);return {all:+o.all||0,asc:+o.asc||0,t:+o.t||0,name:cleanName(o.name)};}catch(e){return null;}
}
function updSlots(){
  if(els.setOv.hidden) return;
  const armed=Date.now()-slotConf.t<5000?slotConf.n:0,inf=[1,2,3].map(slotInfo);
  const sig=LANG+'|'+SLOT+'|'+armed+'|'+inf.map(x=>x?Math.floor(Math.log10(x.all+1))+':'+x.asc+':'+(x.act?0:x.t)+':'+x.name:'-').join(',');
  if(sig===slotSig) return;
  slotSig=sig;
  document.getElementById('slotList').innerHTML=inf.map((x,i)=>{
    const n=i+1,act=n===SLOT;
    let info=x?fmt(x.all)+' '+tt('Kekse insgesamt','cookies in total')+' · '+tt('Aufstiege: ','Ascensions: ')+x.asc+(act?'':' · '+new Date(x.t).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})):tt('leer','empty');
    let btn='';
    if(act) btn='<span class="wk-on">'+tt('Aktiv','Active')+'</span><button type="button" class="btn sm" data-slot="ren:'+n+'">'+(x.name?tt('Umbenennen','Rename'):tt('Name geben','Add name'))+'</button>';
    else btn='<button type="button" class="btn sm primary" data-slot="load:'+n+'">'+(x?tt('Laden','Load'):tt('Neu starten','Start new'))+'</button>'+(x?'<button type="button" class="btn sm'+(armed===n?' armed':'')+'" data-slot="del:'+n+'">'+(armed===n?tt('Sicher? Nochmal','Sure? Again'):tt('Löschen','Delete'))+'</button>':'');
    const nm=x&&x.name?escName(x.name):'';
    return '<div class="slot'+(act?' act':'')+'"><span><b>'+(nm||tt('Platz ','Slot ')+n)+'</b><span class="sub">'+(nm?tt('Platz ','Slot ')+n+' · ':'')+info+'</span></span><div class="btns">'+btn+'</div></div>';
  }).join('');
}
document.getElementById('slotList').addEventListener('click',e=>{
  const b=e.target.closest('[data-slot]');if(!b) return;
  const [a,ns]=b.dataset.slot.split(':'),n=+ns;
  if(a==='ren'){
    askName({title:tt('Spielstand umbenennen','Rename save'),text:tt('Gib deinem Spielstand einen neuen Namen.','Give your save a new name.'),ok:tt('Speichern','Save'),value:S.name},nm=>{S.name=nm;save();showName();slotSig='';updSlots();toast(tt('Name gespeichert.','Name saved.'));});
    return;
  }
  if(n===SLOT) return;
  if(a==='del'){
    if(slotConf.n!==n||Date.now()-slotConf.t>5000){slotConf={n,t:Date.now()};slotSig='';updSlots();return;}
    slotConf={n:0,t:0};try{localStorage.removeItem(slotKey(n));}catch(err){}
    toast(tt('Platz ','Slot ')+n+tt(' gelöscht.',' deleted.'));slotSig='';updSlots();return;
  }
  if(!slotInfo(n)){askName({title:tt('Neuer Spielstand','New save'),text:tt('Wie soll dein Spielstand in Platz '+n+' heißen?','What should your save in slot '+n+' be called?')},nm=>switchSlot(n,nm));return;}
  switchSlot(n);
});
function switchSlot(n,nm){
  save();
  SLOT=n;SAVE_KEY=slotKey(n);try{localStorage.setItem('keksfabrik-slot',String(n));}catch(err){}
  const s=readSave(),l=LANG;
  S=s||fresh();if(!s){S.opt.lang=l;S.name=nm||'';}
  S.t=Date.now();LANG=S.opt.lang;els.fx.checked=S.opt.fx;undo=null;
  applyLang();rebuildAll();save();slotSig='';
  toast(tt('Spielstand ','Save slot ')+n+(s?tt(' geladen.',' loaded.'):tt(': neues Spiel.',': new game.')),true);
}
