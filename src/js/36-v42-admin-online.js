/* ======================= V42: Admin – Online ======================= */
let admOnData=null,admOnErr='',admOnBusy=false,admOnArm={k:'',t:0};
function admOnRender(){
  const box=$id('admOn');if(!box) return;
  const card=(t,b)=>'<div class="admcard"><h4>'+t+'</h4>'+b+'</div>';
  if(!lbOn()){box.innerHTML=card(tt('Online','Online'),'<p class="small">'+tt('Online-Funktionen sind nicht eingerichtet.','Online features aren’t set up.')+'</p>');return;}
  let h='';
  if(!admPass){
    h+=card(tt('Online-Werkzeuge','Online tools'),'<form class="coderow" id="admOnPwF" novalidate><input type="password" class="namein" id="admOnPw" autocomplete="current-password" placeholder="'+tt('Server-Passwort','Server password')+'" aria-label="'+tt('Server-Passwort','Server password')+'"><button type="submit" class="btn primary">'+tt('Laden','Load')+'</button></form>');
    if(admOnErr) h+='<p class="nameerr">'+admOnErr+'</p>';
    if(box._h!==h){box._h=h;box.innerHTML=h;}return;
  }
  if(admOnErr) h+='<p class="nameerr">'+admOnErr+'</p>';
  const D=admOnData||{},L=D.live||{};
  const arm=k=>admOnArm.k===k&&Date.now()-admOnArm.t<5000;
  const dt=v=>v?new Date(v).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'∞';
  h+=card('🌍 '+tt('Live','Live'),'<div class="admstats">'+[[tt('Jetzt online','Online now'),L.online],[tt('Heute','Today'),L.today],[tt('Spieler','Players'),L.players],[tt('Kekse weltweit','Cookies worldwide'),L.total!=null?fmt(L.total):'']].map(([l,v])=>'<span><small>'+l+'</small><b>'+(v==null?'–':typeof v==='number'?fmt(v):v)+'</b></span>').join('')+'</div><div class="btns" style="margin-top:8px"><button type="button" class="btn sm primary" data-ona="list">'+(admOnBusy?tt('Lädt …','Loading …'):tt('Aktualisieren','Refresh'))+'</button></div>');
  h+=card('📢 '+tt('Ankündigung','Announcement'),'<form class="admform" id="admNewsF" novalidate><input class="namein" name="title" maxlength="80" placeholder="'+tt('Titel, z. B. Doppelte Kekse am Wochenende!','Title, e.g. Double cookies this weekend!')+'" style="grid-column:1/-1"><textarea class="namein" name="body" maxlength="600" rows="3" placeholder="'+tt('Nachricht (optional)','Message (optional)')+'" style="grid-column:1/-1"></textarea><label class="small">'+tt('Sichtbar für Tage','Visible for days')+'<input class="namein" name="days" type="number" min="0" step="1" value="3"></label><button type="submit" class="btn primary">'+tt('Veröffentlichen','Post')+'</button></form>'
    +((D.news||[]).length?'<div class="admlbl">'+D.news.map(n=>'<div class="admlbr"><span class="rk">📢</span><span class="who"><b>'+escName(n.title)+'</b><small>'+(n.until&&Date.parse(n.until)<Date.now()?tt('abgelaufen','expired'):tt('bis ','until ')+dt(n.until))+'</small></span><span class="btns"><button type="button" class="btn sm'+(arm('news_del:'+n.id)?' armed':'')+'" data-ona="news_del:'+n.id+'">'+(arm('news_del:'+n.id)?tt('Sicher?','Sure?'):tt('Löschen','Delete'))+'</button></span></div>').join('')+'</div>':''));
  h+=card('⚡ '+tt('Globales Event','Global event'),'<form class="admform" id="admEvF" novalidate><label class="small">'+tt('Art','Type')+'<select class="namein" name="kind">'+Object.keys(EVK).map(k=>'<option value="'+k+'">'+EVI[k]+' '+tx(EVK[k])+'</option>').join('')+'</select></label><label class="small">'+tt('Stärke','Strength')+'<select class="namein" name="mult">'+[1.5,2,3,5,10].map(m=>'<option value="'+m+'"'+(m===2?' selected':'')+'>×'+m+'</option>').join('')+'</select></label><label class="small">'+tt('Dauer in Stunden','Hours')+'<input class="namein" name="hours" type="number" min="1" step="1" value="24"></label><label class="small">'+tt('Start in Stunden (0 = jetzt)','Start in hours (0 = now)')+'<input class="namein" name="start_hours" type="number" min="0" step="1" value="0"></label><label class="small">'+tt('Jede Woche wiederholen (Wochen)','Repeat weekly (weeks)')+'<select class="namein" name="repeat_weeks">'+[0,1,2,3,4,8,12].map(w=>'<option value="'+w+'">'+(w?w+'×':tt('Nicht wiederholen','Don’t repeat'))+'</option>').join('')+'</select></label><input class="namein" name="title" maxlength="60" placeholder="'+tt('Name, z. B. Kekswochenende','Name, e.g. Cookie weekend')+'"><button type="submit" class="btn primary" style="grid-column:1/-1">'+tt('Event planen','Schedule event')+'</button></form>'
    +((D.events||[]).length?'<div class="admlbl">'+D.events.map(e=>{const live=Date.parse(e.ends_at)>Date.now(),soon=Date.parse(e.starts_at)>Date.now();return '<div class="admlbr"><span class="rk">'+EVI[e.kind]+'</span><span class="who"><b>×'+e.mult+' '+tx(EVK[e.kind])+(e.title?' · '+escName(e.title):'')+'</b><small>'+(soon?'🗓️ '+tt('startet ','starts ')+dt(e.starts_at)+' · '+tt('bis ','until ')+dt(e.ends_at):live?tt('läuft bis ','running until ')+dt(e.ends_at):tt('beendet ','ended ')+dt(e.ends_at))+'</small></span><span class="btns">'+(live?'<button type="button" class="btn sm'+(arm('event_end:'+e.id)?' armed':'')+'" data-ona="event_end:'+e.id+'">'+(arm('event_end:'+e.id)?tt('Sicher?','Sure?'):soon?tt('Absagen','Cancel'):tt('Beenden','End now'))+'</button>':'')+'</span></div>';}).join('')+'</div>':''));
  h+=card('🎁 '+tt('Codes','Codes'),'<form class="admform" id="admCodeF" novalidate><input class="namein" name="code" maxlength="24" placeholder="'+tt('CODE (Buchstaben/Zahlen)','CODE (letters/numbers)')+'" style="text-transform:uppercase"><input class="namein" name="label" maxlength="40" placeholder="'+tt('Name, z. B. Freunde-Geschenk','Name, e.g. Friends gift')+'"><label class="small">'+tt('Edelsteine','Gems')+'<input class="namein" name="gems" type="number" min="0" value="50"></label><label class="small">'+tt('Sternenkrümel','Star crumbs')+'<input class="namein" name="stars" type="number" min="0" value="0"></label><label class="small">'+tt('Minuten Produktion','Minutes of production')+'<input class="namein" name="minutes" type="number" min="0" value="30"></label><label class="small">'+tt('Max. Einlösungen (leer = unbegrenzt)','Max uses (empty = unlimited)')+'<input class="namein" name="max_uses" type="number" min="1"></label><label class="small">'+tt('Gültig für Tage (leer = immer)','Valid for days (empty = forever)')+'<input class="namein" name="days" type="number" min="1"></label><button type="submit" class="btn primary">'+tt('Code erstellen','Create code')+'</button></form>'
    +((D.codes||[]).length?'<div class="admlbl">'+D.codes.map(c=>'<div class="admlbr"><span class="rk">🎁</span><span class="who"><b>'+escName(c.code)+(c.label?' · '+escName(c.label):'')+'</b><small>'+[c.gems?c.gems+' '+matName('gem'):'',c.stars?c.stars+' ⭐':'',c.minutes?c.minutes+' min':''].filter(Boolean).join(' + ')+' · '+tt('eingelöst ','used ')+c.uses+(c.max_uses?' / '+c.max_uses:'')+' · '+(c.expires_at?(Date.parse(c.expires_at)<Date.now()?tt('abgelaufen','expired'):tt('bis ','until ')+dt(c.expires_at)):tt('ohne Ablauf','no expiry'))+'</small></span><span class="btns"><button type="button" class="btn sm'+(arm('code_del:'+c.code)?' armed':'')+'" data-ona="code_del:'+escName(c.code)+'">'+(arm('code_del:'+c.code)?tt('Sicher?','Sure?'):tt('Löschen','Delete'))+'</button></span></div>').join('')+'</div>':''));
  h+=card('🎟️ '+tt('Viele Einmal-Codes','Bulk one-time codes'),'<p class="small">'+tt('Erstellt bis zu 100 Codes, die jeweils nur einmal gehen – z. B. für ein Gewinnspiel.','Creates up to 100 codes that each work once – e.g. for a giveaway.')+'</p><form class="admform" id="admBulkF" novalidate><label class="small">'+tt('Anfang (optional)','Prefix (optional)')+'<input class="namein" name="prefix" maxlength="10" style="text-transform:uppercase" placeholder="GIFT"></label><label class="small">'+tt('Anzahl','How many')+'<input class="namein" name="count" type="number" min="1" max="100" value="10"></label><input class="namein" name="label" maxlength="40" placeholder="'+tt('Name, z. B. Gewinnspiel','Name, e.g. Giveaway')+'"><label class="small">'+tt('Edelsteine','Gems')+'<input class="namein" name="gems" type="number" min="0" value="25"></label><label class="small">'+tt('Sternenkrümel','Star crumbs')+'<input class="namein" name="stars" type="number" min="0" value="0"></label><label class="small">'+tt('Minuten Produktion','Minutes of production')+'<input class="namein" name="minutes" type="number" min="0" value="0"></label><label class="small">'+tt('Gültig für Tage (leer = immer)','Valid for days (empty = forever)')+'<input class="namein" name="days" type="number" min="1"></label><button type="submit" class="btn primary">'+tt('Codes erstellen','Create codes')+'</button></form>'
    +((admOnBulk||[]).length?'<div class="bulkcodes"><textarea class="namein" readonly rows="'+Math.min(8,admOnBulk.length)+'">'+admOnBulk.join('\n')+'</textarea><button type="button" class="btn sm primary" id="admBulkCopy">'+tt('Alle kopieren','Copy all')+'</button></div>':''));
  if(box._h!==h){box._h=h;box.innerHTML=h;}
}
var admOnBulk=[];
els.admin.addEventListener('click',async e=>{if(!e.target.closest('#admBulkCopy')) return;const t=admOnBulk.join('\n');try{await navigator.clipboard.writeText(t);toast(tt('Codes kopiert!','Codes copied!'));}catch(x){toast(tt('Markiere die Liste und kopiere sie.','Select the list and copy it.'));}});
async function admOnCall(action,data){
  admOnBusy=true;admOnErr='';admOnRender();
  try{
    admOnData=await lbApi('rpc/admin_online',{p_pass:admPass,p_action:action,p_data:data||null});kfV3=true;if(action==='code_bulk') admOnBulk=(admOnData&&admOnData.bulk)||[];
    if(action!=='list') toast({code_add:tt('Code gespeichert.','Code saved.'),code_del:tt('Code gelöscht.','Code deleted.'),news_add:tt('Ankündigung veröffentlicht.','Announcement posted.'),news_del:tt('Ankündigung gelöscht.','Announcement deleted.'),event_add:tt('Event geplant!','Event scheduled!'),code_bulk:tt('Codes erstellt.','Codes created.'),event_end:tt('Event beendet.','Event ended.')}[action]||'OK');
    if(/^event/.test(action)) kfLoadEvents();
  }catch(x){
    const m=String(x&&x.message||'');
    if(/wrong admin password/.test(m)){admSrvDrop();admOnErr=tt('Server-Sitzung abgelaufen. Bitte entsperre neu.','Server session ended. Please unlock again.');}
    else if(lbMissing(x)) admOnErr=tt('Die Datenbank kennt diese Funktionen noch nicht. Führe zuerst docs/online-v3.sql in Supabase aus.','The database doesn’t have these features yet. Run docs/online-v3.sql in Supabase first.');
    else if(/check constraint|kf_codes_code_check/.test(m)) admOnErr=tt('Ungültige Eingabe. Codes: 3–24 Buchstaben oder Zahlen.','Invalid input. Codes: 3–24 letters or numbers.');
    else admOnErr=tt('Hat nicht geklappt: ','Didn’t work: ')+escName(m);
  }
  admOnBusy=false;admOnArm={k:'',t:0};admOnRender();
}
els.admin.addEventListener('submit',e=>{
  const f=e.target;if(!['admOnPwF','admNewsF','admEvF','admCodeF','admBulkF'].includes(f.id)) return;
  e.preventDefault();
  if(f.id==='admOnPwF'){const v=$id('admOnPw').value;if(!v) return;admSrvLogin(v,'on');return;}
  const d=Object.fromEntries(new FormData(f).entries());
  if(f.id==='admNewsF'){if(!d.title||!d.title.trim()){admOnErr=tt('Bitte gib einen Titel ein.','Please enter a title.');admOnRender();return;}admOnCall('news_add',d);}
  else if(f.id==='admEvF') admOnCall('event_add',d);
  else if(f.id==='admBulkF') admOnCall('code_bulk',d);
  else{if(!/^[A-Za-z0-9]{3,24}$/.test((d.code||'').replace(/[\s-]/g,''))){admOnErr=tt('Codes: 3–24 Buchstaben oder Zahlen.','Codes: 3–24 letters or numbers.');admOnRender();return;}admOnCall('code_add',d);}
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-ona]');if(!b) return;
  const k=b.dataset.ona,[a,...rest]=k.split(':'),v=rest.join(':');
  if(a==='list'){admOnCall('list');return;}
  if(admOnArm.k!==k||Date.now()-admOnArm.t>5000){admOnArm={k,t:Date.now()};admOnRender();return;}
  admOnCall(a,a==='code_del'?{code:v}:{id:v});
});
els.admin.addEventListener('click',e=>{const b=e.target.closest('#admSeg [data-ap="online"]');if(b) setTimeout(()=>{admOnRender();if(admPass&&!admOnData&&!admOnBusy) admOnCall('list');},0);});
