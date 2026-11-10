/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V58: Server-Gesundheit (installierte Teile, Server-Jobs, Prüfungen, Alarme) ======================= */
var v58aReady=false;
const KF_SCHEMA_NEED=18;   /* the newest server part this admin version expects (docs/players-v18.sql) */
var admHealth=null,admHealthErr='';
async function admHealthLoad(){
  if(!admPass) return;
  try{admHealth=await lbApi('rpc/admin_health',{p_pass:admPass});admHealthErr='';}
  catch(x){admHealthErr=lbMissing(x)?tt('Braucht zuerst docs/backend-v16.sql in Supabase.','Needs docs/backend-v16.sql in Supabase first.'):admErrTxt(x);}
  admSrvRender();
}
const HJOB={'kf-schedule':['Geplante Events','Planned events'],'kf-health':['Gesundheits-Check','Health check'],'kf-cleanup':['Aufräumen','Cleanup'],'kf-backup':['Backup','Backup'],'kf-reminders':['Erinnerungen','Reminders'],'kf-week':['Wochenbericht','Weekly report'],'kf-cron-tidy':['Job-Protokoll kürzen','Trim job log']};
function admHealthHtml(){
  const H=admHealth;let b='';
  if(!H) b='<p class="small">'+(admHealthErr||tt('Lädt …','Loading …'))+'</p>';
  else{
    const parts=(H.schema||[]).map(p=>+p.part),top=parts.length?Math.max(...parts):0,missing=[];
    for(let i=1;i<=KF_SCHEMA_NEED;i++) if(!parts.includes(i)&&i!==1) missing.push(i);
    b+='<p class="small"><b>'+(top>=KF_SCHEMA_NEED&&!missing.length?'✅ '+tt('Server-Teile 1–','Server parts 1–')+top+tt(' installiert',' installed'):'⚠️ '+tt('Fehlende Server-Teile: ','Missing server parts: ')+missing.join(', '))+'</b>'
      +(H.schema&&H.schema.length?' · '+tt('zuletzt: ','latest: ')+escName(H.schema[H.schema.length-1].name)+' ('+admDT(H.schema[H.schema.length-1].at)+')':'')+'</p>';
    b+='<p class="small">'+(H.cron?'⏰ '+tt('Server-Uhr (pg_cron) an – Jobs laufen pünktlich, auch ohne Spieler.','Server clock (pg_cron) on – jobs run on time, even with no players.'):'⏰ '+tt('Server-Uhr aus – Jobs laufen, wenn Spieler online sind.','Server clock off – jobs run when players are online.'))
      +' · 💬 '+(H.realtime?tt('Live-Chat an','Live chat on'):tt('Live-Chat aus','Live chat off'))+'</p>';
    if((H.jobs||[]).length) b+='<div class="admlbl">'+H.jobs.map(j=>'<div class="admlbr"><span class="rk">'+(j.last_status==='failed'?'❌':j.last_status==='succeeded'?'✅':'⏳')+'</span><span class="who"><b>'+tx(HJOB[j.name]||[j.name,j.name])+'</b><small>'+escName(j.schedule)+' · '+(j.last_at?tt('zuletzt ','last ')+admDT(j.last_at):tt('noch nicht gelaufen','not run yet'))+(j.last_status==='failed'&&j.last_msg?' · '+escName(j.last_msg):'')+'</small></span></div>').join('')+'</div>';
    const C=H.checks&&H.checks.r;
    if(C) b+='<div class="admstats">'+[[tt('Push wartet','Push waiting'),C.push_stuck,C.push_stuck>0],[tt('Abstürze heute','Crashes today'),C.crashes_today+' / Ø '+C.crashes_avg,C.crashes_today>=Math.max(20,3*C.crashes_avg)],[tt('Datenbank','Database'),C.db_pct+' %',C.db_pct>=80],[tt('Jobs fehlgeschlagen','Jobs failed'),C.jobs_failed,C.jobs_failed>0]].map(([l,v,bad])=>'<span class="'+(bad?'hbad':'')+'"><small>'+l+'</small><b>'+(bad?'⚠️ ':'')+escName(String(v))+'</b></span>').join('')+'</div><p class="small muted">'+tt('Letzte Prüfung: ','Last check: ')+admDT(H.checks.at)+' · '+tt('alle 10 Minuten','every 10 minutes')+'</p>';
    if((H.alerts||[]).length) b+='<p class="small">'+tt('Letzte Alarme: ','Recent alarms: ')+H.alerts.slice(0,4).map(a=>escName(a.k)+' '+admDT(a.at)).join(' · ')+'</p>';
    b+='<p class="small">'+tt('Bei Problemen bekommst du eine Push-Nachricht (wenn „Alarme aufs Handy“ an ist), höchstens eine pro Art alle 6 Stunden. Ist die Seite oder Datenbank ganz weg, öffnet GitHub ein Issue (siehe Uptime-Check).','You get a push when something is wrong (if “Alerts on your phone” is on), at most one per kind every 6 hours. If the site or database is down completely, GitHub opens an issue (see the uptime check).')+'</p>';
  }
  b+='<div class="btns"><button type="button" class="btn sm" data-hlth="reload">'+tt('Neu laden','Reload')+'</button></div>';
  if(H&&admHealthErr) b+='<p class="nameerr">'+admHealthErr+'</p>';
  return admCardH('🩺 '+tt('Server-Gesundheit','Server health'),b);
}
els.admin.addEventListener('click',e=>{if(e.target.closest('[data-hlth]')) admHealthLoad();});
v58aReady=true;
if(admPass) admHealthLoad();
