/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ---------- Admin: Absturzberichte und Spieler-Weg (Server-Tab) ---------- */
var admErrs=null,admJour=null,admInsErr='',admInsArm=0;
async function admIns(action,data){return lbApi('rpc/admin_insights',{p_pass:admPass,p_action:action,p_data:data||null});}
async function admInsLoad(){
  if(!admPass) return;
  try{const [e,j]=await Promise.all([admIns('errors'),admIns('journey')]);admErrs=e||[];admJour=j||{};admInsErr='';}
  catch(x){admInsErr=lbMissing(x)?tt('Dafür braucht der Server zuerst docs/insights-v10.sql.','This needs docs/insights-v10.sql on the server first.'):admErrTxt(x);}
  admSrvRender();
}
const STEP_TXT={open:['Spiel geöffnet','Opened the game'],click50:['50 Klicks','50 clicks'],build1:['Erstes Gebäude','First building'],up1:['Erstes Upgrade','First upgrade'],
  tut5:['5 Tipps gelesen','5 tips done'],tutdone:['Erste Schritte fertig','First steps done'],bld25:['25 Gebäude','25 buildings'],world:['Welt freigeschaltet','World unlocked'],
  asc1:['Erster Aufstieg','First ascension'],acc:['Konto erstellt','Made an account'],club:['In einem Club','Joined a club'],lb:['In der Bestenliste','On the leaderboard'],push:['Push an','Push on'],comeback:['Kam nach 3+ Tagen zurück','Came back after 3+ days']};
function admInsHtml(){
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
  let h='';
  if(admInsErr) return admCardH('🧭 '+tt('Spieler-Weg','Player journey'),'<p class="nameerr">'+admInsErr+'</p>');
  const J=admJour||{},St=J.steps||{},base=Math.max(+J.new30||0,+St.open||0);
  h+=admCardH('🧭 '+tt('Spieler-Weg (neue Spieler, 30 Tage)','Player journey (new players, 30 days)'),
    '<p class="small">'+tt('Wie weit neue Spieler kommen. Anonym: gezählt wird nur, welcher Schritt einmal erreicht wurde.','How far new players get. Anonymous: only which steps were reached once is counted.')+'</p>'
    +'<div class="admstats"><span><small>'+tt('Neue Spieler','New players')+'</small><b>'+fmt(+J.new30||0)+'</b></span><span><small>'+tt('Am 2. Tag zurück','Back on day 2')+'</small><b>'+pct(+J.back1||0,+J.cohort||0)+'</b></span><span><small>'+tt('Nach 7 Tagen zurück','Back after 7 days')+'</small><b>'+pct(+J.back7||0,+J.cohort7||0)+'</b></span></div>'
    +'<div class="admfun">'+Object.keys(STEP_TXT).map(k=>{const n=+St[k]||0,w=base?Math.round(n/base*100):0;return '<div><span>'+tt(STEP_TXT[k][0],STEP_TXT[k][1])+'</span><i style="--w:'+Math.min(100,w)+'%"></i><b>'+n+' <small>'+(base?w+'%':'')+'</small></b></div>';}).join('')+'</div>'
    +'<h5 class="admh5">'+tt('Spieler pro Tag (14 Tage)','Players per day (14 days)')+'</h5>'+admBars(J.daily));
  const E=admErrs||[],arm=Date.now()-admInsArm<5000;
  h+=admCardH('🐞 '+tt('Absturzberichte','Crash reports'),
    '<p class="small">'+tt('Fehler, die bei Spielern passiert sind. Gleiche Fehler werden zusammengezählt. Es wird kein Spielstand und kein Name mitgeschickt.','Errors that happened for players. The same error is counted together. No save and no name are sent.')+'</p>'
    +(E.length?'<div class="admerrs">'+E.map(x=>'<details class="fold"><summary><b>'+escName(x.msg)+'</b><small>'+x.count+'× · v'+x.ver+' · '+admDT(x.last_at)+'</small></summary>'+(x.src?'<p class="small">'+escName(x.src)+'</p>':'')+(x.stack?'<pre>'+escName(x.stack)+'</pre>':'')+(x.ua?'<p class="small">'+escName(x.ua)+'</p>':'')+'<div class="btns"><button type="button" class="btn sm" data-ina="done:'+escName(x.fp)+'">'+tt('Behoben','Mark fixed')+'</button></div></details>').join('')+'</div>'
      +'<div class="btns"><button type="button" class="btn sm warn'+(arm?' armed':'')+'" data-ina="clear">'+(arm?tt('Wirklich alle löschen?','Really clear all?'):tt('Liste leeren','Clear list'))+'</button></div>'
      :'<p class="small">'+(admErrs?tt('Keine Fehler gemeldet. 🎉','No errors reported. 🎉'):tt('Lädt …','Loading …'))+'</p>'));
  return h;
}
els.admin.addEventListener('click',async e=>{
  const b=e.target.closest('[data-ina]');if(!b) return;
  const [a,fp]=b.dataset.ina.split(':');
  try{
    if(a==='done'){admErrs=await admIns('error_done',{fp});toast(tt('Als behoben markiert.','Marked as fixed.'));}
    if(a==='clear'){if(Date.now()-admInsArm>=5000){admInsArm=Date.now();admSrvRender();return;}admInsArm=0;admErrs=await admIns('errors_clear');toast(tt('Liste geleert.','List cleared.'));}
  }catch(x){admInsErr=admErrTxt(x);}
  admSrvRender();
});
