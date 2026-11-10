/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V56: Verdächtige Spielstände, Datenbank & Aufräumen, Backups außerhalb, Planer ======================= */
var v56aReady=false;
var admSf=null,admSfErr='',admUse=null,admUseErr='',admUseBusy=false,admOff=null,admOffKey='',admOffErr='',admPlan=null,admPlanErr='',admPlanBusy=false,admCareArm={k:'',t:0};
const admCareArmed=k=>admCareArm.k===k&&Date.now()-admCareArm.t<5000;
const admCareMiss=x=>lbMissing(x)?tt('Braucht zuerst docs/server-v14.sql in Supabase.','Needs docs/server-v14.sql in Supabase first.'):admErrTxt(x);
async function admCareCall(fn,action,data){
  if(!admPass) return null;
  return lbApi('rpc/'+fn,data===undefined?{p_pass:admPass,p_action:action}:{p_pass:admPass,p_action:action,p_data:data});
}
function admCareLoad(){if(!admPass) return;admSfDo('list');admUseDo('usage');admOffDo('status');admPlanDo('list');}

/* ---------- Verdächtige Spielstände (Moderation) ---------- */
async function admSfDo(action,data,okTxt){
  try{admSf=await admCareCall('admin_saveflags',action,data||null)||[];admSfErr='';if(okTxt) toast(okTxt);}catch(x){admSfErr=admCareMiss(x);}
  admModRender();
}
function admSfHtml(){
  const F=admSf||[];
  const row=f=>'<div class="admlbr"><span class="rk">⚠️</span><span class="who"><b>'+pcl(f.username)+(f.banned?' · ⛔':'')+'</b><small>'+fmt(+f.old||0)+' → '+fmt(+f.new||0)+tt(' Kekse in ',' cookies in ')+(f.hours<1?Math.max(1,Math.round(f.hours*60))+' min':f.hours<48?Math.round(f.hours)+' '+tt('Std','h'):Math.round(f.hours/24)+' '+tt('Tagen','days'))+'</small><small>'+admDT(f.created_at)+'</small></span><span class="btns"><button type="button" class="btn sm" data-sfa="ok:'+f.id+'">'+tt('In Ordnung','OK')+'</button>'+(v52Ready&&!f.banned?'<button type="button" class="btn sm warn" data-ban="pick:'+escName(f.username)+'">'+tt('Sperren …','Ban …')+'</button>':'')+'</span></div>';
  return admCardH('⚠️ '+tt('Verdächtige Spielstände','Suspicious saves')+' <small class="muted">('+(admSf?F.length:'…')+')</small>',
    '<p class="small">'+tt('Konto-Spielstände, die viel schneller gewachsen sind, als das Spiel erlaubt. Der Spielstand bleibt erhalten – du entscheidest. Das kann auch ehrlich sein, wenn jemand eine Spielstand-Datei von einem anderen Gerät geladen hat.','Account saves that grew much faster than the game allows. The save is kept – you decide. It can be honest when someone loaded a save file from another device.')+'</p>'
    +(F.length?'<div class="admlbl">'+F.map(row).join('')+'</div>'+(F.length>1?'<div class="btns"><button type="button" class="btn sm" data-sfa="ok_all">'+tt('Alle in Ordnung','All OK')+'</button></div>':''):'<p class="small">'+(admSf?tt('Nichts Verdächtiges. 🎉','Nothing suspicious. 🎉'):tt('Lädt …','Loading …'))+'</p>')
    +(admSfErr?'<p class="nameerr">'+admSfErr+'</p>':''));
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-sfa]');if(!b) return;
  const [a,id]=b.dataset.sfa.split(':');
  admSfDo(a,a==='ok'?{id:+id}:{},tt('Erledigt.','Done.'));
});

/* ---------- Datenbank & Aufräumen (Server) ---------- */
async function admUseDo(action){
  admUseBusy=action==='cleanup';if(admUseBusy) admSrvRender();
  try{admUse=await admCareCall('admin_usage',action);admUseErr='';if(action==='cleanup') toast(tt('Aufgeräumt.','Cleaned up.'),true);}catch(x){admUseErr=admCareMiss(x);}
  admUseBusy=false;admSrvRender();
}
const admMB=b=>(b/1048576).toLocaleString(LOC[LANG],{maximumFractionDigits:b<10485760?1:0})+' MB';
function admUseHtml(){
  const U=admUse;let b='<p class="small">'+tt('Der kostenlose Supabase-Plan hat 500 MB Datenbank und 5 GB Datenverkehr im Monat. Alte Daten (Sitzungen, Limits, abgeholte Geschenke, erledigte Meldungen, alte Fehler …) werden alle 6 Stunden automatisch gelöscht. Spielstände, Konten und die Bestenliste nie.','The free Supabase plan has 500 MB of database and 5 GB of traffic a month. Old data (sessions, limits, claimed gifts, finished reports, old crashes …) is removed automatically every 6 hours. Saves, accounts and the leaderboard never.')+'</p>';
  if(!U) b+='<p class="small">'+(admUseErr?'':tt('Lädt …','Loading …'))+'</p>';
  else{
    const pct=Math.min(100,U.db_bytes/U.limit_bytes*100);
    b+='<div class="usebar'+(pct>80?' hot':'')+'" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(pct)+'" aria-label="'+tt('Datenbank','Database')+'"><i style="width:'+Math.max(1,pct).toFixed(1)+'%"></i></div>'
      +'<p class="small"><b>'+admMB(U.db_bytes)+'</b> '+tt('von','of')+' 500 MB ('+pct.toFixed(pct<10?1:0)+' %)</p>'
      +'<div class="admstats">'+[[tt('Spieler (30 Tage)','Players (30 days)'),U.mau],[tt('Heute','Today'),U.dau],[tt('Konten','Accounts'),U.accounts],[tt('Backups','Backups'),U.backups]].map(([l,v])=>'<span><small>'+l+'</small><b>'+(v==null?'–':fmt(+v))+'</b></span>').join('')+'</div>'
      +((U.tables||[]).length?'<details class="fold"><summary>'+tt('Größte Tabellen','Biggest tables')+'</summary><div class="admlbl">'+U.tables.map(t=>'<div class="admlbr"><span class="who"><b>'+escName(t.name)+'</b><small>'+fmt(+t.rows||0)+' '+tt('Zeilen','rows')+'</small></span><span class="rk">'+admMB(+t.bytes||0)+'</span></div>').join('')+'</div></details>':'');
    const C=U.cleanup,rm=C&&C.removed?Object.entries(C.removed).filter(([,n])=>n>0):[];
    b+='<p class="small">'+tt('Zuletzt aufgeräumt: ','Last cleanup: ')+(C?admDT(C.at)+(rm.length?' · '+rm.map(([k,n])=>escName(k)+' '+n).join(', '):' · '+tt('nichts zu tun','nothing to do')):tt('noch nie','never'))+'</p>';
  }
  b+='<div class="btns"><button type="button" class="btn sm" data-usea="cleanup"'+(admUseBusy?' disabled':'')+'>'+(admUseBusy?tt('Moment …','One moment …'):tt('Jetzt aufräumen','Clean up now'))+'</button><button type="button" class="btn sm" data-usea="usage">'+tt('Neu laden','Reload')+'</button></div>'
    +(admUseErr?'<p class="nameerr">'+admUseErr+'</p>':'');
  return admCardH('🗄️ '+tt('Datenbank & Aufräumen','Database & cleanup'),b);
}
els.admin.addEventListener('click',e=>{const b=e.target.closest('[data-usea]');if(b) admUseDo(b.dataset.usea);});

/* ---------- Backups außerhalb von Supabase (Server) ---------- */
const OFF_SECRET='https://github.com/Destinyx350/Cookie-Factory/settings/secrets/actions/new';
const OFF_RUN='https://github.com/Destinyx350/Cookie-Factory/actions/workflows/offsite-backup.yml';
async function admOffDo(action){
  try{const r=await admCareCall('admin_offsite',action);admOff=r;if(r&&r.key) admOffKey=r.key;else if(action==='remove') admOffKey='';admOffErr='';
    if(action==='newkey') toast(tt('Neuer Schlüssel erstellt.','New key created.'),true);if(action==='remove') toast(tt('Schlüssel entfernt.','Key removed.'));}
  catch(x){admOffErr=admCareMiss(x);}
  admCareArm={k:'',t:0};admSrvRender();
}
function admOffHtml(){
  const O=admOff;let b='<p class="small">'+tt('Einmal pro Woche holt ein GitHub-Job das neueste Backup, verschlüsselt es mit deinem Schlüssel und bewahrt es 90 Tage bei GitHub auf – falls mit Supabase einmal etwas schiefgeht.','Once a week a GitHub job fetches the newest backup, encrypts it with your key and keeps it at GitHub for 90 days – in case something ever goes wrong with Supabase.')+'</p>';
  if(!O) b+='<p class="small">'+(admOffErr?'':tt('Lädt …','Loading …'))+'</p>';
  else b+='<p class="small"><b>'+(O.on?'✅ '+tt('Eingerichtet','Set up'):tt('Noch nicht eingerichtet','Not set up yet'))+'</b>'+(O.on?' · '+tt('Letzte Kopie: ','Last copy: ')+(O.last_export?admDT(O.last_export):tt('noch keine','none yet'))+' · '+(O.exports||0)+' '+tt('insgesamt','in total'):'')+'</p>';
  if(admOffKey) b+='<div class="offkey"><p class="small"><b>'+tt('Dein Schlüssel – wird nur jetzt angezeigt:','Your key – shown only now:')+'</b></p><div class="coderow"><input class="namein" id="admOffKeyIn" readonly value="'+admOffKey+'" aria-label="'+tt('Schlüssel','Key')+'"><button type="button" class="btn sm primary" data-offa="copy">'+tt('Kopieren','Copy')+'</button></div>'
    +'<ol class="small"><li>'+tt('Öffne ','Open ')+'<a href="'+OFF_SECRET+'" target="_blank" rel="noopener">GitHub → Settings → Secrets → Actions</a>.</li><li>'+tt('Name: ','Name: ')+'<code>KF_BACKUP_KEY</code>, '+tt('Wert: der Schlüssel. Speichern.','value: the key. Save.')+'</li><li>'+tt('Zum Testen: ','To test: ')+'<a href="'+OFF_RUN+'" target="_blank" rel="noopener">Actions → Off-site backup</a> → „Run workflow“.</li></ol>'
    +'<p class="small">'+tt('Bewahre den Schlüssel auch in deinem Passwort-Manager auf – ohne ihn lassen sich die Kopien nicht öffnen. Wiederherstellen: siehe docs/LEADERBOARD.md.','Also keep the key in your password manager – without it the copies can’t be opened. To restore: see docs/LEADERBOARD.md.')+'</p></div>';
  b+='<div class="btns"><button type="button" class="btn sm'+(O&&O.on?(admCareArmed('newkey')?' armed':''):' primary')+'" data-offa="newkey">'+(O&&O.on?(admCareArmed('newkey')?tt('Wirklich? Der alte Schlüssel geht dann nicht mehr','Sure? The old key stops working'):tt('Neuer Schlüssel','New key')):tt('Schlüssel erstellen','Create key'))+'</button>'
    +(O&&O.on?'<button type="button" class="btn sm warn'+(admCareArmed('remove')?' armed':'')+'" data-offa="remove">'+(admCareArmed('remove')?tt('Wirklich ausschalten?','Really turn off?'):tt('Ausschalten','Turn off'))+'</button>':'')+'</div>'
    +(admOffErr?'<p class="nameerr">'+admOffErr+'</p>':'');
  return admCardH('🛰️ '+tt('Backups außerhalb von Supabase','Off-site backups'),b);
}
els.admin.addEventListener('click',async e=>{
  const b=e.target.closest('[data-offa]');if(!b) return;
  const a=b.dataset.offa;
  if(a==='copy'){try{await navigator.clipboard.writeText(admOffKey);toast(tt('Kopiert!','Copied!'));}catch(x){const i=$id('admOffKeyIn');if(i){i.select();}toast(tt('Markiere den Schlüssel und kopiere ihn.','Select the key and copy it.'));}return;}
  if((a==='remove'||(a==='newkey'&&admOff&&admOff.on))&&!admCareArmed(a)){admCareArm={k:a,t:Date.now()};admSrvRender();return;}
  admOffDo(a);
});

/* ---------- Geplante Events und Ankündigungen (Online) ---------- */
async function admPlanDo(action,data,okTxt){
  admPlanBusy=action==='add';
  try{admPlan=await admCareCall('admin_schedule',action,data||null)||[];admPlanErr='';if(okTxt) toast(okTxt,true);
    if(action==='add'||action==='toggle'){const f=action==='add'&&$id('admPlanF');if(f){f.reset();f.dataset.kind='event';}if(typeof admOnCall==='function'&&admPass) admOnCall('list');}}
  catch(x){const m=String(x&&x.message||'');
    admPlanErr=/time in the past/.test(m)?tt('Diese Zeit ist schon vorbei.','That time has already passed.'):/invalid time/.test(m)?tt('Bitte wähle Datum und Uhrzeit.','Please pick a date and time.'):/title missing/.test(m)?tt('Eine Ankündigung braucht einen Titel.','An announcement needs a title.'):/invalid duration/.test(m)?tt('Ungültige Dauer.','Invalid duration.'):admCareMiss(x);}
  admPlanBusy=false;admCareArm={k:'',t:0};admOnRender();
}
const admPlanLocal=d=>{const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes());};
function admPlanHtml(){
  const P=admPlan||[],soon=new Date(Date.now()+36e5);soon.setMinutes(0,0,0);
  const dt=v=>new Date(v).toLocaleString(LOC[LANG],{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const what=p=>p.kind==='event'?(EVI[p.ev_kind]||'⚡')+' ×'+p.mult+' '+tx(EVK[p.ev_kind]||['Event','event'])+(p.title?' · '+escName(p.title):''):'📢 '+escName(p.title);
  const dur=h=>h<1?Math.round(h*60)+' min':h%24===0&&h>=24?(h/24)+' '+tt(h===24?'Tag':'Tage',h===24?'day':'days'):h+' '+tt('Std','h');
  const row=p=>'<div class="admlbr'+(p.active?'':' done')+'"><span class="rk">'+(p.repeat==='weekly'?'🔁':'🗓️')+'</span><span class="who"><b>'+what(p)+'</b><small>'+(p.active?tt('Nächster Start: ','Next start: ')+dt(p.next_at):p.last_run&&p.repeat==='once'?tt('Gestartet ','Started ')+dt(p.last_run):tt('Pausiert','Paused'))+' · '+dur(+p.hours)+(p.repeat==='weekly'?' · '+tt('jede Woche','every week'):'')+'</small></span><span class="btns">'
    +(p.repeat==='weekly'||p.active?'<button type="button" class="btn sm" data-plna="toggle:'+p.id+'">'+(p.active?tt('Pause','Pause'):tt('Weiter','Resume'))+'</button>':'')
    +'<button type="button" class="btn sm warn'+(admCareArmed('pdel'+p.id)?' armed':'')+'" data-plna="delete:'+p.id+'">'+(admCareArmed('pdel'+p.id)?tt('Sicher?','Sure?'):tt('Löschen','Delete'))+'</button></span></div>';
  return '<div class="admcard"><h4>🗓️ '+tt('Geplant','Planned')+' <small class="muted">('+(admPlan?P.filter(p=>p.active).length:'…')+')</small></h4>'
    +'<p class="small">'+tt('Events und Ankündigungen für später oder jede Woche – der Server startet sie von allein, auch wenn du offline bist. Zeiten in deiner Ortszeit.','Events and announcements for later or every week – the server starts them on its own, even when you’re offline. Times are in your local time.')+'</p>'
    +'<form class="admform" id="admPlanF" data-kind="event" novalidate>'
    +'<label class="small">'+tt('Was','What')+'<select class="namein" name="kind"><option value="event">⚡ '+tt('Event','Event')+'</option><option value="news">📢 '+tt('Ankündigung','Announcement')+'</option></select></label>'
    +'<label class="small">'+tt('Start','Start')+'<input class="namein" type="datetime-local" name="at" value="'+admPlanLocal(soon)+'"></label>'
    +'<label class="small">'+tt('Wiederholen','Repeat')+'<select class="namein" name="repeat"><option value="once">'+tt('Einmal','Once')+'</option><option value="weekly">'+tt('Jede Woche','Every week')+'</option></select></label>'
    +'<label class="small">'+tt('Dauer','Duration')+'<select class="namein" name="hours">'+[[.5,'30 min'],[1,'1 '+tt('Std','h')],[2,'2 '+tt('Std','h')],[4,'4 '+tt('Std','h')],[8,'8 '+tt('Std','h')],[24,'1 '+tt('Tag','day')],[48,'2 '+tt('Tage','days')],[72,'3 '+tt('Tage','days')],[168,'7 '+tt('Tage','days')]].map(([v,l])=>'<option value="'+v+'"'+(v===2?' selected':'')+'>'+l+'</option>').join('')+'</select></label>'
    +'<label class="small plnev">'+tt('Art','Type')+'<select class="namein" name="ev_kind">'+Object.keys(EVK).map(k=>'<option value="'+k+'">'+EVI[k]+' '+tx(EVK[k])+'</option>').join('')+'</select></label>'
    +'<label class="small plnev">'+tt('Stärke','Strength')+'<select class="namein" name="mult">'+[1.5,2,3,5,10].map(m=>'<option value="'+m+'"'+(m===2?' selected':'')+'>×'+m+'</option>').join('')+'</select></label>'
    +'<input class="namein" name="title" maxlength="80" placeholder="'+tt('Titel (bei Events optional)','Title (optional for events)')+'" style="grid-column:1/-1">'
    +'<textarea class="namein plnnews" name="body" maxlength="600" rows="2" placeholder="'+tt('Nachricht (optional)','Message (optional)')+'" style="grid-column:1/-1"></textarea>'
    +'<button type="submit" class="btn primary" style="grid-column:1/-1"'+(admPlanBusy?' disabled':'')+'>'+tt('Planen','Schedule')+'</button></form>'
    +(P.length?'<div class="admlbl">'+P.map(row).join('')+'</div>':'<p class="small">'+(admPlan?tt('Nichts geplant.','Nothing planned.'):tt('Lädt …','Loading …'))+'</p>')
    +(admPlanErr?'<p class="nameerr">'+admPlanErr+'</p>':'')+'</div>';
}
els.admin.addEventListener('change',e=>{const s=e.target.closest('#admPlanF [name=kind]');if(s) s.form.dataset.kind=s.value;});
els.admin.addEventListener('submit',e=>{
  const f=e.target.closest('#admPlanF');if(!f) return;e.preventDefault();
  const d=Object.fromEntries(new FormData(f)),t=d.at?new Date(d.at):null;
  if(!t||isNaN(t)){admPlanErr=tt('Bitte wähle Datum und Uhrzeit.','Please pick a date and time.');admOnRender();return;}
  const ev=d.kind==='event';
  admPlanDo('add',{kind:d.kind,title:String(d.title||'').trim().slice(0,ev?60:80),body:ev?'':String(d.body||''),ev_kind:ev?d.ev_kind:null,mult:ev?+d.mult:null,hours:+d.hours,repeat:d.repeat,at:t.toISOString()},tt('Geplant!','Scheduled!'));
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-plna]');if(!b) return;
  const [a,id]=b.dataset.plna.split(':');
  if(a==='delete'&&!admCareArmed('pdel'+id)){admCareArm={k:'pdel'+id,t:Date.now()};admOnRender();return;}
  admPlanDo(a,{id:+id},a==='delete'?tt('Gelöscht.','Deleted.'):null);
});

v56aReady=true;
admCareLoad();
