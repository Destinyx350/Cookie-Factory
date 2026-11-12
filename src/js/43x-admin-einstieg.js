/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V68: Einstieg neuer Spieler – vor und nach Version 68 ======================= */
var v68aReady=false;
let admFun=null,admFunErr='',admFunDays=30,admFunSrc='';
async function admFunLoad(){
  if(!admPass) return;
  try{admFun=await lbApi('rpc/admin_funnel',{p_pass:admPass,p_days:admFunDays,p_src:admFunSrc||null});admFunErr='';}
  catch(x){admFunErr=lbMissing(x)?tt('Braucht zuerst docs/funnel-v20.sql in Supabase.','Needs docs/funnel-v20.sql in Supabase first.'):admErrTxt(x);}
  admSrvRender();
}
/* Schritte in der Reihenfolge, in der neue Spieler sie erreichen. new: erst ab Version 68 gemessen. */
const FUN_STEPS=[
  ['open',['Spiel geöffnet','Opened the game']],
  ['play',['Spiel-Bildschirm erreicht','Reached the game screen'],1],
  ['tut1',['Erster Schritt geschafft','Finished the first step'],1],
  ['build1',['Erstes Gebäude gekauft','Bought a first building']],
  ['up1',['Erstes Upgrade gekauft','Bought a first upgrade']],
  ['tut3',['3 erste Schritte geschafft','Finished 3 first steps'],1],
  ['tut5',['5 erste Schritte geschafft','Finished 5 first steps']],
  ['back',['An einem anderen Tag wiedergekommen','Came back on another day']],
  ['chest1',['Erste Willkommens-Truhe geöffnet','Opened the first welcome chest'],1],
  ['acc',['Konto erstellt','Made an account']]];
const FUN_SRC=[['',['Alle','All']],['portal',['itch.io & Portale','itch.io & portals']],['web',['Website','Website']],['app',['App','App']]];
function funMerge(G,keep){
  const o={n:0,back_n:0,back:0,steps:{},vers:[]};
  (G||[]).filter(g=>keep(+g.ver||0)).forEach(g=>{
    o.n+=+g.n||0;o.back_n+=+g.back_n||0;o.back+=+g.back||0;o.vers.push(+g.ver||0);
    Object.entries(g.steps||{}).forEach(([k,v])=>{o.steps[k]=(o.steps[k]||0)+(+v||0);});
  });
  return o;
}
function funCell(g,k,isNew){
  if(!g.n) return '<td class="fnone">–</td>';
  if(isNew&&!g.vers.some(v=>v>=68)) return '<td class="fnone" title="'+tt('Erst ab Version 68 gemessen','Measured from version 68')+'">–</td>';
  const [n,of]=k==='back'?[g.back,g.back_n]:[g.steps[k]||0,g.n];
  if(!of) return '<td class="fnone" title="'+tt('Noch niemand lange genug dabei','Nobody old enough yet')+'">–</td>';
  const pc=n/of*100;
  return '<td><span class="fbar"><i style="width:'+Math.min(100,pc).toFixed(1)+'%"></i></span><b>'+Math.round(pc)+' %</b><small>'+fmt(n)+' / '+fmt(of)+'</small></td>';
}
function admFunHtml(){
  let b='<p class="small">'+tt('Wie weit neue Spieler kommen: alle, die das Spiel im gewählten Zeitraum zum ersten Mal geöffnet haben, aufgeteilt nach der Version, mit der sie angefangen haben. So siehst du, ob Version 68 (kein Namens-Fenster, kein Startbildschirm beim ersten Mal, Willkommens-Truhen) hilft.','How far new players get: everyone who first opened the game in the chosen time range, split by the version they started on. This shows whether version 68 (no name window, no start screen the first time, welcome chests) helps.')+'</p>'
    +'<div class="drange" role="group" aria-label="'+tt('Zeitraum','Time range')+'">'+[7,30,90].map(n=>'<button type="button" class="btn sm'+(admFunDays===n?' on':'')+'" data-fun="d:'+n+'" aria-pressed="'+(admFunDays===n)+'">'+n+' '+tt('Tage','days')+'</button>').join('')+'</div>'
    +'<div class="drange" role="group" aria-label="'+tt('Herkunft','Source')+'">'+FUN_SRC.map(([k,l])=>{const c=k?((admFun&&admFun.srcs||{})[k]||0):Object.values(admFun&&admFun.srcs||{}).reduce((a,v)=>a+(+v||0),0);return '<button type="button" class="btn sm'+(admFunSrc===k?' on':'')+'" data-fun="s:'+k+'" aria-pressed="'+(admFunSrc===k)+'">'+tx(l)+(admFun?' · '+fmt(c):'')+'</button>';}).join('')+'</div>';
  if(admFunErr) b+='<p class="nameerr">'+admFunErr+'</p>';
  else if(!admFun) b+=skelRows(4);
  else{
    const G=admFun.groups||[],old=funMerge(G,v=>v<68),now=funMerge(G,v=>v>=68);
    if(!old.n&&!now.n) b+='<p class="small">'+tt('In diesem Zeitraum gibt es noch keine neuen Spieler.','No new players in this time range yet.')+'</p>';
    else b+='<div class="ftable"><table><caption class="vh">'+tt('Einstieg neuer Spieler','New player funnel')+'</caption><thead><tr><th scope="col">'+tt('Schritt','Step')+'</th><th scope="col">'+tt('Vor Version 68','Before version 68')+'<small>'+fmt(old.n)+' '+tt('Spieler','players')+'</small></th><th scope="col">'+tt('Ab Version 68','Version 68 and later')+'<small>'+fmt(now.n)+' '+tt('Spieler','players')+'</small></th></tr></thead><tbody>'
      +FUN_STEPS.map(([k,l,isNew])=>'<tr><th scope="row">'+tx(l)+'</th>'+funCell(old,k,isNew)+funCell(now,k,isNew)+'</tr>').join('')+'</tbody></table></div>'
      +'<p class="small">'+tt('„Wiedergekommen“ zählt nur Spieler, die vor mindestens 2 Tagen angefangen haben. Spieler ohne bekannte Version zählen zu „vor 68“. Schritte mit – wurden in der Version noch nicht gemessen.','“Came back” only counts players who started at least 2 days ago. Players without a known version count as “before 68”. Steps with – weren’t measured in that version yet.')+'</p>';
  }
  return admCardH('🚪 '+tt('Neue Spieler','New players'),b+'<div class="btns"><button type="button" class="btn sm" data-fun="r:1">'+tt('Aktualisieren','Refresh')+'</button></div>');
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-fun]');if(!b) return;
  const [k,v]=b.dataset.fun.split(':');
  if(k==='d') admFunDays=+v;else if(k==='s') admFunSrc=v;
  admFunLoad();
});
v68aReady=true;
admFunLoad();
