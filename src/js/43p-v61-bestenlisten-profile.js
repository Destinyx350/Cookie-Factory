/* ======================= V61: Bestenlisten nach Kategorie, schönere Profile ======================= */
var v61Ready=false;

/* ---------- Lauf-Zeit bis 1 Milliarde (für die Bestenliste „Schnellste Milliarde“) ---------- */
function sanRR(o){
  if(!o||typeof o!=='object') return null;
  const n=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
  return {t:n(o.t,Date.now()),a:Math.max(0,Math.floor(n(o.a,0))),f:Math.floor(n(o.f,0)),w:typeof o.w==='string'?o.w.slice(0,10):''};
}
function rrTick(){
  if(!S.rr||S.rr.a!==S.asc) S.rr={t:Date.now(),a:S.asc,f:S.run>=1e6?-1:0,w:''};   // a run that is already under way doesn't count
  if(S.rr.f===0&&S.run>=1e9){S.rr.f=Math.max(1,Math.round((Date.now()-S.rr.t)/1000));S.rr.w=lbWeekId(new Date());}
}
const rrFast=()=>S.rr&&S.rr.f>0&&S.rr.w===lbWeekId(new Date())?S.rr.f:null;

/* ---------- Kategorie-Zahlen mitschicken ---------- */
let lbStatsOk=true;
async function lbStatsSend(){
  if(!lbStatsOk||!S.lb.on||!S.lb.id||lbCheat()) return;
  try{await lbApi('rpc/submit_stats',{p_id:S.lb.id,p_clicks:Math.floor(S.clicks||0),p_gold:S.gold|0,p_asc:S.asc|0,p_fast:rrFast()});lbCatData={};}
  catch(x){if(lbMissing(x)) lbStatsOk=false;}
}

/* ---------- Bestenlisten nach Kategorie ---------- */
var lbCat='ck',lbCatData={},lbCatBusy=false,lbCatErr='';
const LBCATS=[['ck','🍪','Kekse','Cookies'],['clicks','👆','Klicks','Clicks'],['gold','✨','Goldkekse','Golden'],['fast','⚡','Schnellste Milliarde','Fastest billion'],['asc','👼','Aufstiege','Ascensions']];
const LBCAT_TXT={clicks:['Wie oft du den großen Keks insgesamt geklickt hast.','How often you clicked the big cookie in total.'],
  gold:['Wie viele Goldkekse du insgesamt gefangen hast.','How many golden cookies you caught in total.'],
  fast:['Dein schnellster Lauf diese Woche von 0 bis 1 Milliarde Kekse in einem Lauf. Ein neuer Lauf beginnt nach jedem Aufstieg. Startet jeden Montag neu.','Your fastest run this week from 0 to 1 billion cookies in one run. A new run starts after every ascension. Starts over every Monday.'],
  asc:['Wie oft du insgesamt aufgestiegen bist.','How often you ascended in total.']};
const lbCatVal=(k,v)=>k==='fast'?fmtDur(+v||0):fmt(+v||0);
function lbCatSeg(){
  if(lbV2===false&&!lbStatsOk) return '';
  return '<div class="seg lbcats" role="group" aria-label="'+tt('Kategorie','Category')+'">'+LBCATS.map(([k,ic,de,en])=>'<button type="button" data-lbc="'+k+'" aria-pressed="'+(lbCat===k)+'" title="'+tt(de,en)+'"><span aria-hidden="true">'+ic+'</span><span class="lbcl">'+tt(de,en)+'</span></button>').join('')+'</div>';
}
async function lbCatLoad(k){
  if(lbCatBusy) return;lbCatBusy=true;lbCatErr='';
  try{lbCatData[k]={...(await lbApi('rpc/lb_board',{p_kind:k,p_id:S.lb.on&&!lbCheat()?S.lb.id:null})),t:Date.now()};}
  catch(x){lbCatErr=lbMissing(x)?tt('Diese Bestenlisten kommen mit dem nächsten Server-Update.','These leaderboards arrive with the next server update.'):tt('Gerade nicht erreichbar. Versuch es gleich nochmal.','Can’t be reached right now. Try again in a moment.');}
  lbCatBusy=false;$id('lbBody')._h='';renderLb();
}
function lbCatHtml(){
  const k=lbCat,D=lbCatData[k];
  if((!D||Date.now()-D.t>30000)&&!lbCatBusy&&!lbCatErr) setTimeout(()=>lbCatLoad(k),0);
  const c=LBCATS.find(x=>x[0]===k);
  let h='<p class="small lbcatd">'+tx(LBCAT_TXT[k])+'</p><div class="lbme">';
  if(lbCheat()) h+='<p class="small" style="margin:0">'+tt('Mit diesem Spielstand kannst du nicht in die Bestenliste.','This save can’t join the leaderboard.')+'</p>';
  else if(!S.lb.on&&v64Ready&&!accTok) h+=lbGuestBox();
  else if(!S.lb.on) h+='<div class="row"><span><b>'+tt('Mach mit!','Join in!')+'</b><span class="sub" style="display:block">'+tt('Tritt der Bestenliste bei, dann zählen auch deine Klicks, Goldkekse und Aufstiege.','Join the leaderboard and your clicks, golden cookies and ascensions count too.')+'</span></span><button type="button" class="btn primary" data-lb="join">'+tt('Mitmachen','Join')+'</button></div>';
  else{
    const me=D&&D.me,mine=k==='fast'?rrFast():k==='clicks'?S.clicks:k==='gold'?S.gold:S.asc;
    h+='<div class="row"><span><span class="sub" style="display:block">'+escName(lbMyName())+'</span><span class="big">'+(me&&me.rank?tt('Platz ','#')+fmt(me.rank):'–')+'</span></span><span style="text-align:right"><span class="sub" style="display:block">'+c[1]+' '+tt(c[2],c[3])+'</span><span class="big">'+(mine?lbCatVal(k,mine):k==='fast'?tt('noch nicht','not yet'):'0')+'</span></span></div>';
    if(k==='fast'&&!rrFast()) h+='<p class="small" style="margin:6px 0 0">'+(S.rr&&S.rr.f<0?tt('Dein jetziger Lauf hat schon vor dem Start der Messung begonnen. Nach deinem nächsten Aufstieg läuft die Uhr.','Your current run began before timing started. The clock runs after your next ascension.'):tt('Back in diesem Lauf 1 Milliarde Kekse, dann zählt deine Zeit.','Bake 1 billion cookies in this run and your time counts.'))+'</p>';
  }
  h+='</div>';
  const rows=D&&D.top,myR=D&&D.me&&D.me.rank;
  if(lbCatErr&&!rows) h+='<p class="lbmsg">'+lbCatErr+'</p>';
  else if(!rows) h+='<p class="lbmsg">'+tt('Lädt …','Loading …')+'</p>';
  else if(!rows.length) h+='<p class="lbmsg">'+tt('Noch niemand hier. Hol dir Platz 1!','Nobody here yet. Grab #1!')+'</p>';
  else h+='<div class="lblist">'+rows.map((r,i)=>'<div class="lbrow'+(S.lb.on&&r.name===lbMyName()&&myR===i+1?' me':'')+'" style="--i:'+Math.min(i,12)+'"><span class="rk'+(i<3?' m'+(i+1):'')+'">'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</span><button type="button" class="nm pname" data-prof="'+escName(String(r.name||''))+'">'+escName(String(r.name||''))+'</button><span class="sc">'+lbCatVal(k,r.v)+'</span></div>').join('')+'</div>';
  return h;
}
$id('lbOv').addEventListener('click',e=>{const b=e.target.closest('[data-lbc]');if(!b) return;lbCat=b.dataset.lbc;lbCatErr='';$id('lbBody')._h='';renderLb();});

/* ---------- Profile: Avatar, Farbe, Motto, Vitrine, Plätze, Teilen ---------- */
const PAVS=['🍪','🧁','🍩','🎂','🥐','🍰','🍫','🥨','👩‍🍳','🧑‍🍳','👵','🐻','🐱','🐶','🦊','🐼','🦄','🐸','🚀','👑','⭐','🔥','🌈','🎮'];
const PCOLS=['orange','gold','red','pink','purple','blue','teal','green'];
const profSty=P=>(P&&P.style)||{};
function profAv(P){const s=profSty(P);return PAVS.includes(s.av)?s.av:(P.username?'👤':'🍪');}
function profCol(P){const s=profSty(P);return PCOLS.includes(s.col)?' pc-'+s.col:'';}
const achName=id=>{const a=A.find(x=>x.id===id);return a?tx(a.name):'';};
let profEdit=null;
function profExtra(P,me){
  const s=profSty(P),R=P.ranks||{};
  let h='';
  if(s.motto) h+='<p class="pmotto">“'+escName(s.motto)+'”</p>';
  const rk=[['clicks','👆',tt('Klicks','Clicks')],['gold','✨',tt('Goldkekse','Golden cookies')],['fast','⚡',tt('Schnellste Milliarde','Fastest billion')],['asc','👼',tt('Aufstiege','Ascensions')]].filter(([k])=>R[k]);
  if(rk.length) h+='<div class="pranks">'+rk.map(([k,ic,l])=>'<span class="prank'+(R[k]<=3?' top':'')+'" title="'+l+'"><b>'+ic+' #'+fmt(R[k])+'</b><small>'+l+(k==='fast'&&R.fast_s?' · '+fmtDur(R.fast_s):'')+'</small></span>').join('')+'</div>';
  const show=(Array.isArray(s.show)?s.show:[]).map(id=>achName(id)).filter(Boolean);
  if(show.length) h+='<div class="pshow"><small>'+tt('Lieblings-Erfolge','Favourite achievements')+'</small>'+show.map(n=>'<span class="pach">🏅 '+escName(n)+'</span>').join('')+'</div>';
  if(me) h+='<div class="btns" style="margin-top:12px"><button type="button" class="btn primary" data-pe="edit">✏️ '+tt('Profil bearbeiten','Edit profile')+'</button><button type="button" class="btn" data-pe="share">🔗 '+tt('Profil teilen','Share profile')+'</button></div><div id="profEditBox"></div>';
  else if(P.username) h+='<div class="btns" style="margin-top:12px"><button type="button" class="btn sm" data-pe="share">🔗 '+tt('Profil teilen','Share profile')+'</button></div>';
  profEdit=me?{av:s.av||'',col:s.col||'',motto:s.motto||'',show:Array.isArray(s.show)?s.show.slice(0,3):[],P}:null;
  return h;
}
function profEditHtml(){
  const E=profEdit,got=A.filter(a=>S.ach&&S.ach[a.id]).map(a=>[a.id,tx(a.name)]).sort((x,y)=>x[1].localeCompare(y[1]));
  const sel=i=>'<select class="namein" data-pes="'+i+'"><option value="">–</option>'+got.map(([id,n])=>'<option value="'+escName(id)+'"'+(E.show[i]===id?' selected':'')+'>'+escName(n)+'</option>').join('')+'</select>';
  return '<form class="pedit" id="profEditF" novalidate>'
    +'<p class="small"><b>'+tt('Avatar','Avatar')+'</b></p><div class="pavs" role="radiogroup" aria-label="'+tt('Avatar','Avatar')+'">'+PAVS.map(a=>'<button type="button" role="radio" aria-checked="'+(E.av===a)+'" data-pav="'+a+'">'+a+'</button>').join('')+'</div>'
    +'<p class="small"><b>'+tt('Farbe','Color')+'</b></p><div class="pcols" role="radiogroup" aria-label="'+tt('Farbe','Color')+'">'+PCOLS.map(c=>'<button type="button" role="radio" class="pc-'+c+'" aria-checked="'+(E.col===c)+'" aria-label="'+c+'" data-pcol="'+c+'"></button>').join('')+'</div>'
    +'<label class="small"><b>'+tt('Motto','Motto')+'</b> <span class="muted">('+tt('höchstens 60 Zeichen','up to 60 characters')+')</span><input class="namein" name="motto" maxlength="60" value="'+escName(E.motto)+'" placeholder="'+tt('z. B. Ich backe, also bin ich.','e.g. I bake, therefore I am.')+'"></label>'
    +'<p class="small"><b>'+tt('Lieblings-Erfolge (bis zu 3)','Favourite achievements (up to 3)')+'</b></p><div class="pshowsel">'+sel(0)+sel(1)+sel(2)+'</div>'
    +'<div class="btns" style="margin-top:10px"><button type="submit" class="btn primary">'+tt('Speichern','Save')+'</button><button type="button" class="btn" data-pe="cancel">'+tt('Abbrechen','Cancel')+'</button></div><p class="nameerr" id="profEditErr" hidden></p></form>';
}
function profShareUrl(name){const base=window.KF_PORTAL?'https://destinyx350.github.io/Cookie-Factory/':location.origin+location.pathname.replace(/admin\.html$/,'');return base+'?p='+encodeURIComponent(name);}
$id('profOv').addEventListener('click',async e=>{
  const b=e.target.closest('[data-pe]');
  if(b){
    const a=b.dataset.pe;
    if(a==='edit'&&profEdit){const box=$id('profEditBox');if(box){box.innerHTML=profEditHtml();b.hidden=true;}}
    else if(a==='cancel'){const box=$id('profEditBox');if(box) box.innerHTML='';const eb=$id('profBody').querySelector('[data-pe="edit"]');if(eb) eb.hidden=false;}
    else if(a==='share'){
      const nm=($id('profT').textContent||'').trim(),url=profShareUrl(nm),txt=tt('Schau dir meine Bäckerei in der Keksfabrik an!','Check out my bakery in Cookie Factory!');
      try{if(v67Ready) xfSet('share');if(navigator.share){await navigator.share({title:'Cookie Factory',text:txt,url});return;}await navigator.clipboard.writeText(url);toast(tt('Link kopiert!','Link copied!'));}
      catch(x){if(x&&x.name==='AbortError') return;toast(url);}
    }
    return;
  }
  const av=e.target.closest('[data-pav]');if(av&&profEdit){profEdit.av=av.dataset.pav;av.parentElement.querySelectorAll('[data-pav]').forEach(x=>x.setAttribute('aria-checked',String(x===av)));return;}
  const pc=e.target.closest('[data-pcol]');if(pc&&profEdit){profEdit.col=pc.dataset.pcol;pc.parentElement.querySelectorAll('[data-pcol]').forEach(x=>x.setAttribute('aria-checked',String(x===pc)));}
});
$id('profOv').addEventListener('submit',async e=>{
  const f=e.target;if(f.id!=='profEditF'||!profEdit) return;
  e.preventDefault();
  const show=[...f.querySelectorAll('[data-pes]')].map(s=>s.value).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,3);
  const motto=String(new FormData(f).get('motto')||'').trim().slice(0,60),err=$id('profEditErr');
  try{
    await lbApi('rpc/acc_style',{p_token:accTok,p_data:{av:profEdit.av,col:profEdit.col,motto,show}});
    toast(tt('Profil gespeichert.','Profile saved.'),true);if(v67Ready) xfSet('style');openProfile(accMe.username);
  }catch(x){const m=String(x&&x.message||'');err.hidden=false;err.textContent=/blocked word/.test(m)?tt('Dieses Motto ist nicht erlaubt.','That motto isn’t allowed.'):/invalid motto/.test(m)?tt('Das Motto darf höchstens 60 Zeichen haben und kein < oder >.','The motto can have at most 60 characters and no < or >.'):/too many/.test(m)?tt('Zu oft geändert. Versuch es später nochmal.','Changed too often. Try again later.'):lbMissing(x)?tt('Das kommt mit dem nächsten Server-Update.','This arrives with the next server update.'):tt('Hat nicht geklappt.','Didn’t work.');}
});
/* ?p=name öffnet ein geteiltes Profil, sobald der Startbildschirm zu ist */
(function(){
  try{const u=new URL(location.href),p=(u.searchParams.get('p')||'').trim();
    if(!/^[^<>]{2,20}$/.test(p)) return;
    u.searchParams.delete('p');history.replaceState(null,'',u.pathname+(u.search?u.search:'')+u.hash);
    const iv=setInterval(()=>{if(startOv.hidden){clearInterval(iv);setTimeout(()=>openProfile(p),400);}},500);
  }catch(e){}
})();

v61Ready=true;
rrTick();setInterval(rrTick,1000);
