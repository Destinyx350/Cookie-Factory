/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V57: Live-Dashboard und Wochenbericht ======================= */
var v57aReady=false;
var admDash=null,admDashErr='',admDashDays=30,admReps=null,admRepPrev=null,admRepErr='',admDashT=0;
const admDashMiss=x=>lbMissing(x)?tt('Braucht zuerst docs/stats-v15.sql in Supabase.','Needs docs/stats-v15.sql in Supabase first.'):admErrTxt(x);
async function admDashLoad(){
  if(!admPass) return;
  try{admDash=await lbApi('rpc/admin_dash',{p_pass:admPass,p_days:admDashDays});admDashErr='';admDashT=Date.now();}catch(x){admDashErr=admDashMiss(x);}
  admSrvRender();
}
async function admRepLoad(prev){
  if(!admPass) return;
  try{if(prev) admRepPrev=await lbApi('rpc/admin_reports',{p_pass:admPass,p_action:'preview'});else admReps=await lbApi('rpc/admin_reports',{p_pass:admPass,p_action:'list'})||[];admRepErr='';}
  catch(x){admRepErr=admDashMiss(x);}
  admSrvRender();
}
function admV57Load(){if(!admPass) return;admDashLoad();admRepLoad(false);}

/* ---------- Diagramme (eine Reihe, eine Farbe; Werte im Tooltip und in der Tabelle) ---------- */
const dashDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString(LOC[LANG],{day:'2-digit',month:'2-digit'});
const dashWd=d=>new Date(d+'T12:00:00Z').toLocaleDateString(LOC[LANG],{weekday:'short',day:'2-digit',month:'2-digit'});
function dashBars(id,title,days,key){
  const v=days.map(d=>+d[key]||0),mx=Math.max(1,...v),sum=v.reduce((a,b)=>a+b,0),last=v[v.length-1];
  const cols=days.map((d,i)=>'<i style="height:'+(v[i]?Math.max(2,v[i]/mx*100):0).toFixed(1)+'%" data-i="'+i+'"></i>').join('');
  return '<figure class="dchart" data-chart="'+id+'"><figcaption><b>'+title+'</b><span>'+tt('Heute ','Today ')+fmt(last)+' · Ø '+fmt(Math.round(sum/v.length))+'</span></figcaption>'
    +'<div class="dplot" role="img" aria-label="'+title+': '+tt('höchstens ','max ')+fmt(mx)+', '+tt('heute ','today ')+fmt(last)+'"><span class="dmax">'+fmt(mx)+'</span><div class="dcols" style="--n:'+v.length+'">'+cols+'</div><div class="dtip" hidden></div></div>'
    +'<div class="dx"><span>'+dashDay(days[0].day)+'</span><span>'+dashDay(days[days.length-1].day)+'</span></div></figure>';
}
const DASH_NAME={phone:['Handy','Phone'],tablet:['Tablet','Tablet'],desktop:['Computer','Computer'],web:['Website','Website'],app:['Installierte App','Installed app'],portal:['Spieleportal','Game portal'],'?':['Unbekannt','Unknown']};
function dashLangName(k){if(k==='?') return tt('Unbekannt','Unknown');try{return new Intl.DisplayNames([LOC[LANG]],{type:'language'}).of(k)+' ('+k+')';}catch(x){return k;}}
function dashShare(title,rows,name){
  const R=rows||[],tot=R.reduce((a,r)=>a+(+r.n||0),0)||1,mx=Math.max(1,...R.map(r=>+r.n||0));
  return '<div class="dshare"><b>'+title+'</b>'+(R.length?R.map(r=>'<div class="dsr"><span>'+escName(name(r.k))+'</span><i><em style="width:'+Math.max(1,r.n/mx*100).toFixed(1)+'%"></em></i><small>'+fmt(+r.n)+' · '+Math.round(r.n/tot*100)+'%</small></div>').join(''):'<p class="small">–</p>')+'</div>';
}
function admDashHtml(){
  const D=admDash;
  let b='<div class="drange" role="group" aria-label="'+tt('Zeitraum','Time range')+'">'+[7,30,90].map(n=>'<button type="button" class="btn sm'+(admDashDays===n?' on':'')+'" data-dash="'+n+'" aria-pressed="'+(admDashDays===n)+'">'+n+' '+tt('Tage','days')+'</button>').join('')+'<button type="button" class="btn sm" data-dash="reload" aria-label="'+tt('Neu laden','Reload')+'">↻</button></div>';
  if(!D){b+='<p class="small">'+(admDashErr?'':tt('Lädt …','Loading …'))+'</p>';}
  else{
    const days=D.days||[],today=days.length?days[days.length-1]:{},avg=days.length?Math.round(days.reduce((a,d)=>a+(+d.players||0),0)/days.length):0;
    b+='<div class="admstats dtiles">'+[[tt('Jetzt online','Online now'),D.online],[tt('Heute','Today'),today.players],[tt('Ø pro Tag','Avg per day'),avg],[tt('Spieler im Zeitraum','Players in range'),D.players]].map(([l,v])=>'<span><small>'+l+'</small><b>'+fmt(+v||0)+'</b></span>').join('')+'</div>';
    if(days.length) b+='<div class="dgrid">'+dashBars('players',tt('Spieler pro Tag','Players per day'),days,'players')+dashBars('new',tt('Neue Spieler','New players'),days,'new')+dashBars('accounts',tt('Neue Konten','New accounts'),days,'accounts')+dashBars('crashes',tt('Abstürze','Crashes'),days,'crashes')+'</div>';
    b+='<div class="dgrid">'+dashShare(tt('Sprachen (Browser)','Languages (browser)'),D.langs,dashLangName)+dashShare(tt('Geräte','Devices'),D.devs,k=>tx(DASH_NAME[k]||[k,k]))+dashShare(tt('Wo gespielt wird','Where people play'),D.srcs,k=>tx(DASH_NAME[k]||[k,k]))+'</div>';
    if(days.length) b+='<details class="fold"><summary>'+tt('Als Tabelle','As a table')+'</summary><div class="dtable"><table><thead><tr><th>'+tt('Tag','Day')+'</th><th>'+tt('Spieler','Players')+'</th><th>'+tt('Neu','New')+'</th><th>'+tt('Konten','Accounts')+'</th><th>'+tt('Abstürze','Crashes')+'</th></tr></thead><tbody>'
      +days.slice().reverse().map(d=>'<tr><td>'+dashWd(d.day)+'</td><td>'+fmt(+d.players)+'</td><td>'+fmt(+d.new)+'</td><td>'+fmt(+d.accounts)+'</td><td>'+fmt(+d.crashes)+'</td></tr>').join('')+'</tbody></table></div></details>';
    b+='<p class="small muted">'+tt('Sprache, Gerät und Ort zählen ab Version 57. Stand: ','Language, device and place are counted from version 57 on. As of ')+new Date(admDashT).toLocaleTimeString(LOC[LANG],{hour:'2-digit',minute:'2-digit'})+'</p>';
  }
  if(admDashErr) b+='<p class="nameerr">'+admDashErr+'</p>';
  return admCardH('📊 '+tt('Live-Dashboard','Live dashboard'),b);
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-dash]');if(!b) return;
  if(b.dataset.dash!=='reload') admDashDays=+b.dataset.dash;
  admDashLoad();
});
/* Tooltip: die ganze Spalte ist das Ziel, nicht nur der Balken */
function dashTip(e){
  const p=e.target.closest&&e.target.closest('.dplot');if(!p) return;
  const fig=p.closest('.dchart');if(!fig||fig.dataset.src) return;   /* V69: Diagramme mit eigenen Daten zeigen ihren Tooltip selbst */
  const c=p.querySelector('.dcols'),tip=p.querySelector('.dtip'),days=admDash&&admDash.days;if(!c||!tip||!days) return;
  const r=c.getBoundingClientRect(),i=Math.max(0,Math.min(days.length-1,Math.floor((e.clientX-r.left)/r.width*days.length))),key=fig.dataset.chart;
  c.querySelectorAll('i.hi').forEach(x=>x.classList.remove('hi'));const col=c.children[i];if(col) col.classList.add('hi');
  tip.hidden=false;tip.innerHTML='<b>'+fmt(+days[i][key]||0)+'</b> '+dashWd(days[i].day);
  const x=(i+.5)/days.length*r.width;tip.style.left=Math.max(4,Math.min(r.width-tip.offsetWidth-4,x-tip.offsetWidth/2))+'px';
}
els.admin.addEventListener('pointermove',dashTip);
els.admin.addEventListener('pointerdown',dashTip);
els.admin.addEventListener('pointerout',e=>{const p=e.target.closest&&e.target.closest('.dplot');if(p&&!p.contains(e.relatedTarget)){const t=p.querySelector('.dtip');if(t) t.hidden=true;p.querySelectorAll('i.hi').forEach(x=>x.classList.remove('hi'));}});

/* ---------- Wochenbericht ---------- */
function repTodo(d){
  const T=d.todo||{},A=d.this||{},L=d.last||{},out=[];
  const add=(ic,de,en)=>out.push('<li>'+ic+' '+tt(de,en)+'</li>');
  if(+T.reports) add('🚩',T.reports+' offene Meldungen – siehe Moderation.',T.reports+' open reports – see Moderation.');
  if(+T.appeals) add('📨',T.appeals+' offene Einsprüche.',T.appeals+' open ban appeals.');
  if(+T.saves) add('⚠️',T.saves+' verdächtige Spielstände prüfen.',T.saves+' suspicious saves to check.');
  if(+T.feedback) add('💬',T.feedback+' neues Feedback lesen.',T.feedback+' new feedback to read.');
  if(+T.crashes) add('🐞',T.crashes+' Arten von Abstürzen – siehe Absturzberichte.',T.crashes+' kinds of crashes – see Crash reports.');
  if(+T.db_pct>=70) add('🗄️','Die Datenbank ist zu '+T.db_pct+' % voll – jetzt aufräumen oder alte Daten prüfen.','The database is '+T.db_pct+'% full – clean up now or check old data.');
  if(T.offsite==='off') add('🛰️','Backups außerhalb von Supabase sind noch nicht eingerichtet.','Off-site backups aren’t set up yet.');
  if(T.offsite==='late') add('🛰️','Die letzte Backup-Kopie bei GitHub ist über 9 Tage alt – prüfe den GitHub-Job.','The last off-site copy is over 9 days old – check the GitHub job.');
  if(d.day2!=null&&+d.day2<20&&+A.new_players>=10) add('🌱','Nur '+d.day2+' % der neuen Spieler kommen am nächsten Tag wieder – vielleicht den Anfang leichter machen.','Only '+d.day2+'% of new players come back the next day – maybe make the start easier.');
  if(+L.players>=10&&+A.players<+L.players*.8) add('📉','Weniger Spieler als letzte Woche – plane ein Event oder eine Ankündigung.','Fewer players than last week – plan an event or an announcement.');
  if(+A.accounts===0&&+A.players>=20) add('👤','Keine neuen Konten – erinnere Spieler an die Vorteile eines Kontos.','No new accounts – remind players what an account is good for.');
  return out.length?'<ul class="reptodo">'+out.join('')+'</ul>':'<p class="small">✅ '+tt('Alles erledigt. 🎉','Nothing to do. 🎉')+'</p>';
}
function repBlock(r,open){
  const d=r.data||{},A=d.this||{},L=d.last||{},bad=['reports','crashes','bans'];
  const tiles=[['players','🍪','Spieler','Players'],['new_players','🌱','Neue Spieler','New players'],['returning','🔁','Kamen wieder','Came back'],['accounts','👤','Neue Konten','New accounts'],['chat','💬','Chat','Chat'],['gifts','🎁','Geschenke','Gifts'],['feedback','📝','Feedback','Feedback'],['crashes','🐞','Abstürze','Crashes']];
  const T=tiles.map(([k,ic,de,en])=>{const a=+A[k]||0,b=+L[k]||0,dd=a-b,up=dd>0,cls=dd===0?'':(up!==bad.includes(k)?'good':'bad');
    return '<span class="'+cls+'"><small>'+ic+' '+tt(de,en)+'</small><b>'+fmt(a)+'</b><i>'+(dd===0?'±0':(up?'▲ +':'▼ ')+fmt(dd))+(b?' ('+(up?'+':'')+Math.round(dd/b*100)+'%)':'')+'</i></span>';}).join('');
  const head=r.week==='now'?tt('Gerade eben (letzte 7 Tage)','Right now (last 7 days)'):tt('Woche ','Week ')+escName(String(r.week).replace(/^\d{4}-W/,''))+' · '+new Date(r.created_at).toLocaleDateString(LOC[LANG]);
  const langs=(d.todo&&d.todo.top_lang)||[];
  return '<details class="fold rep"'+(open?' open':'')+'><summary>'+head+' · 🍪 '+fmt(+A.players||0)+'</summary>'
    +'<div class="admweek">'+T+'</div>'
    +(d.day2!=null?'<p class="small">'+tt('Kamen am nächsten Tag wieder: ','Came back the next day: ')+'<b>'+d.day2+' %</b>'+(langs.length?' · '+tt('Top-Sprachen: ','Top languages: ')+langs.map(x=>escName(x.lang)+' '+fmt(+x.n)).join(', '):'')+'</p>':'')
    +'<p class="small"><b>'+tt('Zu tun','To do')+'</b></p>'+repTodo(d)+'</details>';
}
function admRepHtml(){
  const R=admReps||[];
  let b='<p class="small">'+tt('Jeden Montag fasst der Server die Woche zusammen und schickt dir eine Push-Nachricht (wenn „Alarme aufs Handy“ an ist). Hier stehen die letzten 12 Wochen.','Every Monday the server sums up the week and sends you a push (if “Alerts on your phone” is on). The last 12 weeks are here.')+'</p>'
    +'<div class="btns"><button type="button" class="btn sm" data-repa="prev">'+tt('Zahlen von jetzt','Numbers right now')+'</button></div>';
  if(admRepPrev) b+=repBlock(admRepPrev,true);
  b+=R.length?R.map((r,i)=>repBlock(r,i===0&&!admRepPrev)).join(''):'<p class="small">'+(admReps?tt('Noch kein Bericht – der erste kommt am Montag.','No report yet – the first one comes on Monday.'):admRepErr?'':tt('Lädt …','Loading …'))+'</p>';
  if(admRepErr) b+='<p class="nameerr">'+admRepErr+'</p>';
  return admCardH('📈 '+tt('Wochenbericht','Weekly report'),b);
}
els.admin.addEventListener('click',e=>{if(e.target.closest('[data-repa="prev"]')) admRepLoad(true);});

v57aReady=true;
admV57Load();
