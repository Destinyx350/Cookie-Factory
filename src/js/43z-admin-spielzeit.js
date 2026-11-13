/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V69: Spielzeit im Dashboard ======================= */
var v69aReady=false;
let admPt=null,admPtErr='',admPtDays=30,admPtSrc='';
async function admPtLoad(){
  if(!admPass) return;
  try{admPt=await lbApi('rpc/admin_playtime',{p_pass:admPass,p_days:admPtDays,p_src:admPtSrc||null});admPtErr='';}
  catch(x){admPtErr=lbMissing(x)?tt('Braucht zuerst docs/playtime-v21.sql in Supabase.','Needs docs/playtime-v21.sql in Supabase first.'):admErrTxt(x);}
  admSrvRender();
}
const ptMin=v=>(Math.round((+v||0)*10)/10).toLocaleString(LOC[LANG])+' min';
/* Vor und ab Version 68 zusammenfassen (gewichtet nach Spielerzahl) */
function ptGroup(G,keep){
  let n=0,m=0;(G||[]).filter(g=>keep(+g.ver||0)).forEach(g=>{n+=+g.n||0;m+=(+g.n||0)*(+g.avg_min||0);});
  return {n,avg:n?m/n:0};
}
function admPtHtml(){
  let b='<p class="small">'+tt('Wie lange gespielt wird: Das Spiel meldet sich jede Minute, solange es offen und sichtbar ist. Eine Pause von mehr als 3 Minuten beginnt eine neue Sitzung.','How long people play: the game checks in every minute while it is open and visible. A break of more than 3 minutes starts a new session.')+'</p>'
    +'<div class="drange" role="group" aria-label="'+tt('Zeitraum','Time range')+'">'+[7,30,90].map(n=>'<button type="button" class="btn sm'+(admPtDays===n?' on':'')+'" data-pt="d:'+n+'" aria-pressed="'+(admPtDays===n)+'">'+n+' '+tt('Tage','days')+'</button>').join('')+'</div>'
    +'<div class="drange" role="group" aria-label="'+tt('Herkunft','Source')+'">'+FUN_SRC.map(([k,l])=>'<button type="button" class="btn sm'+(admPtSrc===k?' on':'')+'" data-pt="s:'+k+'" aria-pressed="'+(admPtSrc===k)+'">'+tx(l)+'</button>').join('')+'</div>';
  const P=admPt;
  if(admPtErr) b+='<p class="nameerr">'+admPtErr+'</p>';
  else if(!P) b+=skelRows(3);
  else if(!P.since) b+='<p class="small">'+tt('Noch keine Spielzeit gemessen – die Zahlen kommen, sobald Spieler mit diesem Server-Teil spielen.','No play time measured yet – numbers appear as soon as players play with this server part.')+'</p>';
  else{
    const T=P.total||{},tile=(l,v,s)=>'<span><small>'+l+'</small><b>'+v+'</b>'+(s?'<small>'+s+'</small>':'')+'</span>';
    b+='<div class="admstats">'+tile(tt('Pro Spieler und Tag','Per player per day'),ptMin(T.avg_min))+tile(tt('Pro Sitzung','Per session'),ptMin(T.sess_min))
      +tile(tt('Sitzungen pro Tag','Sessions per day'),(+T.sess_per_day||0).toLocaleString(LOC[LANG]))+tile(tt('10+ Minuten','10+ minutes'),(T.ten_plus==null?'–':T.ten_plus+' %'),tt('der Spieler-Tage','of player-days'))+'</div>';
    const days=(P.per_day||[]).slice(-Math.min(60,(P.per_day||[]).length));
    if(days.length&&v57aReady) b+=dashBars('avg_min',tt('Minuten pro Spieler und Tag','Minutes per player per day'),days,'avg_min').replace('<figure class="dchart"','<figure class="dchart" data-src="pt"');
    const o=ptGroup(P.first_day,v=>v<68),nw=ptGroup(P.first_day,v=>v>=68);
    b+='<div class="admtwo"><div><h5 class="admh5">'+tt('Erster Tag neuer Spieler','First day of new players')+'</h5>'
      +'<div class="dsr"><span>'+tt('Vor Version 68','Before version 68')+'</span><b>'+(o.n?ptMin(o.avg):'–')+'</b><small>'+fmt(o.n)+' '+tt('Spieler','players')+'</small></div>'
      +'<div class="dsr"><span>'+tt('Ab Version 68','Version 68 and later')+'</span><b>'+(nw.n?ptMin(nw.avg):'–')+'</b><small>'+fmt(nw.n)+' '+tt('Spieler','players')+'</small></div></div>'
      +'<div><h5 class="admh5">'+tt('Nach Herkunft','By source')+'</h5>'+((P.by_src||[]).length?(P.by_src||[]).map(r=>'<div class="dsr"><span>'+escName(tx(DASH_NAME[r.k]||[r.k,r.k]))+'</span><b>'+ptMin(r.avg_min)+'</b><small>'+fmt(+r.n)+' '+tt('Spieler-Tage','player-days')+'</small></div>').join(''):'<p class="small">–</p>')+'</div></div>'
      +'<p class="small">'+tt('Gemessen seit ','Measured since ')+new Date(P.since+'T12:00:00Z').toLocaleDateString(LOC[LANG],{day:'numeric',month:'long',year:'numeric'})+'.</p>';
  }
  return admCardH('⏱️ '+tt('Spielzeit','Play time'),b+'<div class="btns"><button type="button" class="btn sm" data-pt="r:1">'+tt('Aktualisieren','Refresh')+'</button></div>');
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-pt]');if(!b) return;
  const [k,v]=b.dataset.pt.split(':');
  if(k==='d') admPtDays=+v;else if(k==='s') admPtSrc=v;
  admPtLoad();
});
/* Tooltip für das eigene Diagramm */
function ptTip(e){
  const p=e.target.closest&&e.target.closest('.dchart[data-src="pt"] .dplot');if(!p||!admPt) return;
  const c=p.querySelector('.dcols'),tip=p.querySelector('.dtip'),days=(admPt.per_day||[]).slice(-Math.min(60,(admPt.per_day||[]).length));if(!c||!tip||!days.length) return;
  const r=c.getBoundingClientRect(),i=Math.max(0,Math.min(days.length-1,Math.floor((e.clientX-r.left)/r.width*days.length)));
  c.querySelectorAll('i.hi').forEach(x=>x.classList.remove('hi'));const col=c.children[i];if(col) col.classList.add('hi');
  tip.hidden=false;tip.innerHTML='<b>'+ptMin(days[i].avg_min)+'</b> · '+fmt(+days[i].players||0)+' '+tt('Spieler','players')+' · '+dashWd(days[i].day);
  const x=(i+.5)/days.length*r.width;tip.style.left=Math.max(4,Math.min(r.width-tip.offsetWidth-4,x-tip.offsetWidth/2))+'px';
}
els.admin.addEventListener('pointermove',ptTip);
els.admin.addEventListener('pointerdown',ptTip);
v69aReady=true;
admPtLoad();
