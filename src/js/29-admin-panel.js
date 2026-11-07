/* ======================= Admin-Panel ======================= */
function numStr(x){return Number(Number(x).toPrecision(10)).toString();}
function parseNum(s){
  s=String(s).trim().replace(/\s/g,'').replace(',','.');
  if(s==='') return null;
  const n=Number(s);
  return isFinite(n)&&n>=0?n:null;
}
const RES=[['cookies','adm_cookies'],['all','kv_all'],['run','this_run'],['chips','adm_chips'],['asc','kv_ascs'],['clicks','adm_clicks'],['gold','adm_gold_n']];
const MUL=[['prod','adm_m_prod'],['click','adm_m_click'],['cost','adm_m_cost'],['speed','adm_m_speed'],['gold','adm_m_gold'],['goldPow','adm_m_goldpow'],['growth','adm_m_growth']];
const frow=(f,label)=>'<label class="frow"><span>'+label+'</span><input type="text" inputmode="decimal" autocomplete="off" data-f="'+f+'"></label>';
function chkList(g,list){
  return '<div class="chklist">'+list.map(o=>'<label class="chk"><input type="checkbox" data-u="'+g+':'+o.id+'"><span>'+tx(o.name)+'</span></label>').join('')+'</div>';
}
function unlockSec(g,titleKey,list){
  return '<details class="adm"><summary>'+tr('adm_unlock')+': '+tr(titleKey)+'</summary><div class="adm-body"><div class="btns"><button type="button" class="btn sm" data-act="all:'+g+'">'+tr('adm_all_on')+'</button><button type="button" class="btn sm" data-act="none:'+g+'">'+tr('adm_all_off')+'</button></div>'+chkList(g,list)+'</div></details>';
}
const ADM_TABS=[['lb','Bestenliste','Leaderboard'],['online','Online','Online'],['mod','Moderation','Moderation'],['srv','Server','Server'],['quick','Schnell','Quick'],['val','Werte','Values'],['bld','Gebäude','Buildings'],['unl','Freischalten','Unlock'],['world','Welt & Held','World & hero'],['end','Endgame','Endgame'],['tool','Werkzeuge','Tools']];
let admTab='quick',admPass='';
const ADM_ONLINE=['lb','online','mod','srv'];
function admXV(){
  const X={};
  MATS.forEach(m=>{X['mat_'+m.id]=[()=>S.w.mat[m.id],v=>{S.w.mat[m.id]=Math.floor(v);},m.n];});
  Object.assign(X,{
    star:[()=>S.w.star.n,v=>{S.w.star.n=Math.floor(v);S.w.star.all=Math.max(S.w.star.all,S.w.star.n);lootSig='';},['Sternenkrümel','Star crumbs']],
    pages:[()=>S.reb.pages,v=>{S.reb.pages=Math.floor(v);rebSig='';},['Rezeptseiten','Recipe pages']],
    rebn:[()=>S.reb.n,v=>{S.reb.n=Math.floor(v);rebSig='';},['Wiedergeburten','Rebirths']],
    hlvl:[()=>S.hero.lvl,v=>{S.hero.lvl=Math.max(1,Math.min(999,Math.floor(v)));},['Helden-Stufe','Hero level']],
    sta:[()=>S.hero.sta,v=>{S.hero.sta=Math.max(0,Math.min(staMax(),Math.floor(v)));},['Ausdauer','Stamina']],
    shards:[()=>S.eg.cos.sh,v=>{S.eg.cos.sh=Math.floor(v);},['Kosmos-Splitter','Cosmic shards']],
    cosn:[()=>S.eg.cos.n,v=>{S.eg.cos.n=Math.floor(v);},['Kosmische Aufstiege','Cosmic ascensions']],
    plvl:[()=>S.eg.par.lvl,v=>{S.eg.par.lvl=Math.floor(v);PARK.forEach(k=>{S.eg.par.pts[k[0]]=0;});},['Paragon-Stufe','Paragon level']],
    frag:[()=>S.eg.art.frag,v=>{S.eg.art.frag=Math.floor(v);},['Artefakt-Splitter','Artifact shards']],
    ascT:[()=>S.eg.ascT,v=>{S.eg.ascT=Math.floor(v);},['Aufstiege gesamt (für Rang)','Total ascensions (for rank)']],
    rebT:[()=>S.eg.rebT,v=>{S.eg.rebT=Math.floor(v);},['Wiedergeburten gesamt (für Rang)','Total rebirths (for rank)']],
    spins:[()=>S.wheel.n,v=>{S.wheel.n=Math.floor(v);},['Glücksrad-Drehungen','Wheel spins']],
    ac:[()=>S.admin.ac||0,v=>{S.admin.ac=Math.min(1000,Math.floor(v));},['Auto-Klicks pro Sekunde','Auto clicks per second']]
  });
  return X;
}
let XV=null;
const ab=(act,label,cls)=>'<button type="button" class="btn sm'+(cls?' '+cls:'')+'" data-act="'+act+'">'+label+'</button>';
const admCard=(title,body,extra)=>'<div class="admcard admitem" data-k="'+String(title+' '+(extra||'')).toLowerCase().replace(/"/g,'')+'"><h4>'+title+'</h4>'+body+'</div>';
const xrow=k=>frow('x:'+k,tx(XV[k][2]));
/* Admin-Sperre: Nur ein gesalzener, langsamer Hash des Passworts steht im Code, nie das Passwort selbst. */
var ADM_KEY='keksfabrik-admin',ADM_SALT='cc41055918420ef4b5d51c8663244fd5',ADM_ITER=150000,ADM_HASH='0ab689e6cbc41b35531f987ad3a12e4754fa413f15809c0575630143077df3e9';
var admOK=false,admFails=0,admWait=0;
try{admOK=sessionStorage.getItem(ADM_KEY)===ADM_HASH||localStorage.getItem(ADM_KEY)===ADM_HASH;}catch(e){}
async function admHash(pw){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
  const salt=Uint8Array.from(ADM_SALT.match(/../g),x=>parseInt(x,16));
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:ADM_ITER},key,256);
  return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
}
function admLockHTML(){
  return '<form class="admlock" id="admLockF" novalidate><span class="lockico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg></span><h2>'+tt('Admin-Panel ist gesperrt','Admin panel is locked')+'</h2><p class="small">'+tt('Gib das Admin-Passwort ein, um es zu öffnen.','Enter the admin password to open it.')+'</p>'
    +'<input type="password" class="namein" id="admPw" autocomplete="current-password" aria-label="'+tt('Admin-Passwort','Admin password')+'" placeholder="'+tt('Passwort','Password')+'">'
    +'<label class="chk"><input type="checkbox" id="admRem"><span>'+tt('Auf diesem Gerät entsperrt lassen','Keep unlocked on this device')+'</span></label>'
    +'<button type="submit" class="btn primary">'+tt('Entsperren','Unlock')+'</button><p class="nameerr" id="admPwErr" aria-live="polite"></p></form>';
}
els.admin.addEventListener('submit',async e=>{
  if(e.target.id!=='admLockF') return;
  e.preventDefault();
  const inp=document.getElementById('admPw'),err=document.getElementById('admPwErr'),rem=document.getElementById('admRem').checked;
  const wait=Math.ceil((admWait-Date.now())/1000);
  if(wait>0){err.textContent=tt('Zu viele Versuche. Warte noch '+wait+' s.','Too many tries. Wait '+wait+' s.');return;}
  if(!window.crypto||!crypto.subtle){err.textContent=tt('Entsperren geht nur auf einer sicheren Seite (https).','Unlocking only works on a secure page (https).');return;}
  let ok=false;try{ok=(await admHash(inp.value))===ADM_HASH;}catch(x){}
  if(!ok){
    admFails++;if(admFails>=5){admFails=0;admWait=Date.now()+30000;}
    err.textContent=tt('Falsches Passwort.','Wrong password.');inp.value='';inp.focus();return;
  }
  admOK=true;admFails=0;if(typeof maintRender==='function') setTimeout(maintRender,0);
  try{(rem?localStorage:sessionStorage).setItem(ADM_KEY,ADM_HASH);}catch(x){}
  buildAdmin();toast(tt('Admin-Panel entsperrt.','Admin panel unlocked.'));
});
els.admin.addEventListener('click',e=>{
  if(!e.target.closest('#admLockBtn')) return;
  admOK=false;admPass='';try{sessionStorage.removeItem(ADM_KEY);localStorage.removeItem(ADM_KEY);}catch(x){}
  buildAdmin();toast(tt('Admin-Panel gesperrt.','Admin panel locked.'));
});
function buildAdmin(){
  if(!admOK){XV=null;els.admin.innerHTML=admLockHTML();return;}
  XV=admXV();
  const P={};
  P.quick=admCard(tt('Kekse','Cookies'),'<div class="btns">'+[1e6,1e9,1e12,1e15,1e18,1e21,1e24].map(v=>ab('add:'+v,'+'+fmt(v))).join('')+ab('mul10',tr('adm_x10'))+ab('mul1000','×1000')+ab('zero',tt('Auf 0','Set to 0'))+'</div>')
    +admCard(tt('Zeitsprung','Time warp'),'<div class="btns">'+[[60,'1 min'],[600,'10 min'],[3600,'1 h'],[28800,'8 h'],[86400,tt('1 Tag','1 day')],[604800,tt('7 Tage','7 days')]].map(w=>ab('warp:'+w[0],w[1])).join('')+'</div><p class="small" style="margin-top:6px">'+tt('Gibt die Kekse, die du in dieser Zeit backen würdest.','Gives the cookies you would bake in that time.')+'</p>')
    +admCard(tt('Spieltempo','Game speed'),'<div class="seg" data-aseg="speed">'+[1,2,5,10,100].map(v=>'<button type="button" data-act="speed:'+v+'" data-v="'+v+'">×'+v+'</button>').join('')+'</div><p class="small" style="margin-top:6px">'+tt('Alles läuft schneller: Produktion, Timer und Welt.','Everything runs faster: production, timers and world.')+'</p>',tt('tempo speed geschwindigkeit','speed'))
    +admCard(tt('Auto-Klicker','Auto clicker'),'<div class="seg" data-aseg="ac">'+[0,10,50,200].map(v=>'<button type="button" data-act="ac:'+v+'" data-v="'+v+'">'+(v?v+'/s':tt('Aus','Off'))+'</button>').join('')+'</div>')
    +admCard(tr('adm_gold'),'<div class="btns">'+ab('gold:spawn',tr('adm_spawn'),'primary')+ab('gold:frenzy',tr('adm_fr'))+ab('gold:lucky',tr('adm_lu'))+ab('gold:click',tr('adm_ck'))+ab('gold:build',tt('Gebäude-Rausch','Building rush'))+ab('gold:rain',tt('Keks-Regen','Cookie rain'))+ab('gold:gift',tt('Geschenk','Gift'))+ab('gold:clear',tr('adm_clear'))+'</div>')
    +admCard(tt('Alles auf einmal','Everything at once'),'<div class="btns">'+ab('maxall',tt('Alles maximieren','Max everything'),'primary')+ab('all:up',tt('Alle Upgrades','All upgrades'))+ab('all:tree',tt('Ganzer Baum','Whole tree'))+ab('items:max',tr('adm_items_max'))+ab('work:max',tt('Helfer Stufe 10','Helpers level 10'))+ab('w:timers',tt('Alle Timer beenden','Finish all timers'))+'</div><p class="small" style="margin-top:6px">'+tt('„Alles maximieren“: alle Upgrades, der ganze Baum, alle Gegenstände Stufe 5, alle Helfer Stufe 10.','“Max everything”: all upgrades, the whole tree, all items level 5, all helpers level 10.')+'</p>');
  P.val=admCard(tr('adm_res'),RES.map(r=>frow('r:'+r[0],tr(r[1]))).join(''))
    +admCard(tt('Materialien & Währungen','Materials & currencies'),Object.keys(XV).filter(k=>k.startsWith('mat_')||['star','pages','rebn','shards','frag','spins'].includes(k)).map(xrow).join(''))
    +admCard(tt('Held, Endgame & Rang','Hero, endgame & rank'),['hlvl','sta','cosn','plvl','ascT','rebT','ac'].map(xrow).join(''))
    +admCard(tr('adm_mult'),MUL.map(m=>frow('m:'+m[0],tr(m[1]))).join('')+'<div class="btns" style="margin-top:8px">'+ab('mulset:1',tt('Alle ×1','All ×1'))+ab('mulset:10',tt('Alle ×10','All ×10'))+ab('mulset:1000',tt('Alle ×1000','All ×1000'))+'</div>');
  P.bld=admCard(tt('Alle Gebäude','All buildings'),'<div class="btns">'+ab('bset:0',tt('Alle auf 0','All to 0'))+ab('badd:10','+10')+ab('badd:100','+100')+ab('bset:500',tt('Alle auf 500','All to 500'))+ab('bset:1000',tt('Alle auf 1000','All to 1000'))+ab('evo:all',tt('Alle entwickeln','Evolve all'),'primary')+ab('evo:none',tt('Evolution entfernen','Remove evolution'))+'</div>')
    +B.map((b,i)=>'<div class="admcard admitem bcard" data-k="'+tx(b.name).toLowerCase()+'"><h4><span>'+tx(b.name)+(S.eg&&S.eg.evo[i]?' ★':'')+'</span>'+ab('rb:'+i,tr('adm_default'))+'</h4><div class="bgrid"><label><span>'+tr('adm_owned')+'</span><input type="text" inputmode="decimal" autocomplete="off" data-f="b:'+i+':own"></label><label><span>'+tr('adm_price')+'</span><input type="text" inputmode="decimal" autocomplete="off" data-f="b:'+i+':cost"></label><label><span>'+tr('adm_cps')+'</span><input type="text" inputmode="decimal" autocomplete="off" data-f="b:'+i+':cps"></label></div></div>').join('');
  P.unl=[['up','adm_u_up',UP],['ach','adm_u_ach',A],['tree','adm_u_tree',TREE]].map(([g,k,l])=>unlockSec(g,k,l).replace('<details class="adm">','<details class="adm admitem" data-k="'+tr(k).toLowerCase()+'">')).join('')
    +admCard(tt('Titel & Abzeichen','Titles & badges'),'<div class="btns">'+ab('ttl:all',tt('Alle Titel','All titles'))+ab('ttl:badges',tt('Alle Abzeichen Gold','All badges gold'))+ab('ttl:none',tt('Titel & Abzeichen zurücksetzen','Reset titles & badges'))+'</div>')
    +admCard(tt('Platin-Erfolge','Platinum achievements'),'<div class="btns">'+ab('plat:all',tt('Alle freischalten','Unlock all'))+ab('plat:none',tt('Alle entfernen','Remove all'))+'</div>');
  P.world=admCard(tt('Spielwelt','World'),'<div class="btns">'+[['mana','Mana füllen','Fill mana'],['mon','Monster rufen','Call monster'],['timers','Alle Timer beenden','Finish all timers'],['mat','+20 Materialien','+20 materials'],['event','Ereignis starten','Start event'],['egg','+1 Ei','+1 egg'],['star','+3 Sternenkrümel','+3 star crumbs'],['chal','Aktive Challenge schaffen','Finish active challenge'],['reset','Spielwelt zurücksetzen','Reset world']].map(x=>ab('w:'+x[0],tt(x[1],x[2]))).join('')+'</div>')
    +admCard(tt('Held','Hero'),'<div class="btns">'+ab('hero:lvl',tt('+10 Stufen','+10 levels'))+ab('hero:sta',tt('Ausdauer voll','Full stamina'))+ab('hero:myth',tt('Mythische Ausrüstung','Mythic gear'),'primary')+ab('hero:clear',tt('Abenteuer abbrechen','Cancel adventure'))+'</div>')
    +admCard(tt('Helfer','Helpers'),'<div class="btns">'+ab('work:all',tt('Alle anstellen','Hire all'))+ab('work:none',tt('Alle entlassen','Fire all'))+ab('work:max',tt('Alle auf Stufe 10','All to level 10'))+'</div>')
    +admCard(tt('Ziele & Glücksrad','Goals & wheel'),'<div class="btns">'+ab('day:done',tt('Tagesaufgaben erfüllen','Complete daily tasks'))+ab('day:next',tt('Nächster Tag','Next day'))+ab('wheel:free',tt('Gratis-Drehung zurück','Free spin again'))+ab('wheel:all',tt('Alle Drehungen zurück','All spins again'))+'</div>')
    +admCard(tr('adm_orders'),frow('o:rep',tr('adm_ord_rep'))+frow('o:done',tr('adm_ord_done'))+'<div class="btns">'+ab('orders:done',tr('adm_ord_finish'))+ab('orders:new',tr('adm_ord_new'))+'</div>')
    +admCard(tr('adm_items'),'<div class="btns" style="margin-bottom:10px">'+ab('boosts:ready',tr('adm_boosts_ready'))+ab('box:free',tr('adm_free_box'))+ab('items:max',tr('adm_items_max'))+ab('items:none',tr('adm_items_none'))+'</div><details class="fold"><summary class="wt">'+tt('Einzelne Gegenstände','Single items')+'</summary>'+ITEMS.map(it=>frow('i:'+it.id,tx(it.name)+(it.rar==='mythic'?' ✦':''))).join('')+'</details>',ITEMS.map(it=>tx(it.name)).join(' '));
  P.end=admCard(tt('Kosmischer Aufstieg','Cosmic ascension'),'<div class="btns">'+ab('cos:1','+1 '+tt('Splitter','shard'))+ab('cos:10','+10 '+tt('Splitter','shards'))+ab('cos:shop',tt('Alle Kräfte','All powers'),'primary')+ab('cos:reset',tt('Kräfte zurücksetzen','Reset powers'))+ab('cos:req',tt('Bedingung erfüllen','Meet requirement'))+'</div>')
    +admCard(tt('Paragon','Paragon'),'<div class="btns">'+ab('par:1','+1 '+tt('Stufe','level'))+ab('par:10','+10')+ab('par:100','+100')+ab('par:unl',tt('Freischalten','Unlock'),'primary')+ab('par:reset',tt('Stufen auf 0','Levels to 0'))+'</div>')
    +admCard(tt('Artefakte','Artifacts'),'<div class="btns">'+ab('frag:10','+10 '+tt('Splitter','shards'))+ab('frag:100','+100')+ab('art:myth',tt('Mythisches Artefakt','Mythic artifact'),'primary')+ab('art:sock',tt('Alle Sockel füllen','Fill all sockets'))+ab('art:clear',tt('Alle löschen','Delete all'))+'</div>')
    +admCard(tt('Gebäude-Evolution','Building evolution'),'<div class="btns">'+ab('evo:all',tt('Alle entwickeln','Evolve all'),'primary')+ab('evo:none',tt('Alle zurück','Remove all'))+'</div>')
    +admCard(tt('Prestige-Rang','Prestige rank'),'<div class="btns">'+ab('rank:10','+10 '+tt('Punkte','points'))+ab('rank:100','+100')+ab('rank:1000','+1000')+ab('rank:0',tt('Auf 0','To 0'))+'</div>')
    +admCard(tt('Automatik & Mythisch','Automation & mythic'),'<div class="btns">'+ab('auto:unl',tt('Automatik freischalten','Unlock automation'))+ab('myth:items',tt('Mythische Gegenstände Stufe 5','Mythic items level 5'),'primary')+'</div>');
  P.tool=admCard(tt('Fehler-Scanner','Error scanner'),'<p class="small">'+tt('Sucht kaputte Zahlen im Spielstand und repariert sie.','Looks for broken numbers in the save and repairs them.')+'</p><div class="btns" style="margin-top:6px">'+ab('scan',tt('Jetzt prüfen','Check now'),'primary')+'</div><p class="small" id="admScan" style="margin-top:6px"></p>',tt('bug fehler nan','bug error nan'))
    +admCard(tt('Speichern','Saving'),'<div class="btns">'+ab('savenow',tt('Jetzt speichern','Save now'))+ab('backup',tt('Backup anlegen','Create backup'))+'</div>')
    +admCard(tt('Spielstand-Daten','Save data'),'<div class="btns">'+ab('json',tt('Daten anzeigen','Show data'))+'</div><textarea id="admJson" readonly hidden></textarea><p class="small" id="admJsonN"></p>',tt('json export','json export'))
    +admCard(tr('adm_reset'),'<div class="btns">'+ab('reset:admin',tr('adm_reset_btn'))+'</div>');
  P.lb='<div id="admLb" class="admlb"></div>';P.online='<div id="admOn" class="admlb"></div><div id="admAcc" class="admlb" style="margin-top:10px"></div><div id="admClub" class="admlb" style="margin-top:10px"></div>';P.mod='<div id="admMod" class="admlb"></div>';P.srv='<div id="admSrv" class="admlb"></div>';
  let h='<div class="admlockbar"><button type="button" class="btn sm" id="admLockBtn">'+tt('Admin sperren','Lock admin')+'</button></div><div class="admhead"><div class="admstats">'+[['ck',tt('Kekse','Cookies')],['kps',tt('pro Sek.','per sec')],['clk',tt('pro Klick','per click')],['chips',tt('Chips','Chips')],['spd',tt('Tempo','Speed')]].map(([k,l])=>'<span><small>'+l+'</small><b data-al="'+k+'"></b></span>').join('')+'</div>'
    +'<input type="search" class="setq" id="admQ" autocomplete="off" placeholder="'+tt('Admin durchsuchen …','Search admin …')+'"><div class="seg admgrp" id="admGrp" role="group"><button type="button" data-ag="game">'+tt('Spiel','Game')+'</button><button type="button" data-ag="online">'+tt('Online','Online')+'</button></div><div class="seg admseg" id="admSeg">'+ADM_TABS.map(t=>'<button type="button" data-ap="'+t[0]+'" data-g="'+(ADM_ONLINE.includes(t[0])?'online':'game')+'" aria-pressed="'+(t[0]===admTab)+'">'+tt(t[1],t[2])+'</button>').join('')+'</div></div>'
    +ADM_TABS.map(t=>'<div class="admpane" data-ap="'+t[0]+'">'+P[t[0]]+'</div>').join('')+'<p class="small" id="admNone" hidden>'+tt('Nichts gefunden.','Nothing found.')+'</p>';
  els.admin.innerHTML=h;
  admShow();
  fillAdmin();
  admLbRender();admOnRender();admAccRender();if(v45Ready){admModRender();admSrvRender();}
}
function admShow(){
  const q=(document.getElementById('admQ')||{value:''}).value.trim().toLowerCase();let n=0;
  els.admin.querySelectorAll('.admpane').forEach(p=>{p.hidden=!q&&p.dataset.ap!==admTab;});
  els.admin.querySelectorAll('.admitem').forEach(it=>{const show=!q||(it.dataset.k+' '+it.textContent).toLowerCase().includes(q);it.hidden=!show;if(show&&(q||it.closest('.admpane').dataset.ap===admTab)) n++;});
  els.admin.querySelectorAll('#admSeg [data-ap]').forEach(b=>b.setAttribute('aria-pressed',!q&&b.dataset.ap===admTab?'true':'false'));
  const grp=ADM_ONLINE.includes(admTab)?'online':'game',sg=document.getElementById('admSeg');if(sg) sg.dataset.grp=q?'':grp;
  els.admin.querySelectorAll('#admGrp [data-ag]').forEach(b=>b.setAttribute('aria-pressed',!q&&b.dataset.ag===grp?'true':'false'));
  const no=document.getElementById('admNone');if(no) no.hidden=n>0;
}
els.admin.addEventListener('input',e=>{if(e.target.id==='admQ') admShow();});
/* Admin in zwei Gruppen: Spiel und Online */
els.admin.addEventListener('click',e=>{const g=e.target.closest('#admGrp [data-ag]');if(!g) return;const cur=ADM_ONLINE.includes(admTab)?'online':'game';if(g.dataset.ag===cur) return;const first=els.admin.querySelector('#admSeg [data-g="'+g.dataset.ag+'"]');if(first) first.click();});
els.admin.addEventListener('click',e=>{const b=e.target.closest('#admSeg [data-ap]');if(!b) return;admTab=b.dataset.ap;const q=document.getElementById('admQ');if(q) q.value='';admShow();},true);
function admScanFix(){
  let n=0;const walk=(o,d)=>{if(!o||typeof o!=='object'||d>8) return;for(const k in o){const v=o[k];if(typeof v==='number'&&!isFinite(v)){o[k]=0;n++;}else if(v&&typeof v==='object') walk(v,d+1);}};
  walk(S,0);return n;
}
function admAct2(p){
  const E=S.eg;
  switch(p[0]){
    case 'mul1000':{const v=S.cookies*999;addCookies(v);toast(tr('toast_added',{n:fmt(v)}));return true;}
    case 'zero':S.cookies=0;return true;
    case 'speed':S.admin.speed=+p[1];toast(tt('Spieltempo ×','Game speed ×')+p[1]);return true;
    case 'ac':S.admin.ac=+p[1];return true;
    case 'mulset':['prod','click','gold','goldPow'].forEach(k=>{S.admin[k]=+p[1];});return true;
    case 'maxall':UP.forEach(u=>{S.up[u.id]=1;});TREE.forEach(n=>{S.tree[n.id]=1;});{const spent=TREE.reduce((s,n)=>s+(S.tree[n.id]?n.cost:0),0);if(spent>S.chips) S.chips=spent;}ITEMS.forEach(it=>{S.items[it.id]=5;});WORKERS.forEach(x=>{S.work.hired[x.id]=1;S.work.on[x.id]=1;if(!S.work.face[x.id]) S.work.face[x.id]=genFace();S.work.lvl[x.id]=10;S.work.xp[x.id]=0;});upSig='';treeSig='';lootSig='';workSig='';toast(tt('Alles maximiert.','Everything maxed.'));return true;
    case 'bset':B.forEach((b,i)=>{S.b[i]=+p[1];});return true;
    case 'badd':B.forEach((b,i)=>{S.b[i]+=+p[1];});return true;
    case 'evo':B.forEach((b,i)=>{if(p[1]==='all') E.evo[i]=1;else delete E.evo[i];});egLast=0;buildAdmin();return true;
    case 'ttl':if(p[1]==='all') TITLES.forEach(x=>{S.ttl.got[x.id]=1;});else if(p[1]==='badges') BADGES.forEach(b=>{S.ttl.b[b.id]=3;});else{S.ttl={cur:'lehrling',got:{lehrling:1},b:{},init:1};}return true;
    case 'plat':A.forEach(a=>{if(a.plat){if(p[1]==='all') S.ach[a.id]=1;else delete S.ach[a.id];}});return true;
    case 'hero':{const H=S.hero;if(p[1]==='lvl'){H.lvl=Math.min(999,H.lvl+10);}else if(p[1]==='sta'){H.sta=staMax();H.staT=Date.now();}else if(p[1]==='clear'){H.run=null;}else if(p[1]==='myth'){['w','a','t'].forEach(s=>{const it=newItem(Math.max(3,towerPw(H.tower.best+5)*3),true);it.s=s;it.r=4;const old=H.gear[s];H.gear[s]=it;if(old&&H.bag.length<20) H.bag.push(old);S.book.gear[s+tierIdx(it.p)]=1;});toast(tt('Mythische Ausrüstung angelegt.','Mythic gear equipped.'),true);}return true;}
    case 'wheel':S.wheel.d=dayKey(Date.now());S.wheel.free=0;if(p[1]==='all') S.wheel.ext=0;S.wheel.pend=-1;return true;
    case 'cos':if(p[1]==='shop') COSN.forEach(n=>{E.cos.shop[n.id]=1;});else if(p[1]==='reset') E.cos.shop={};else if(p[1]==='req'){S.reb.n=Math.max(3,S.reb.n);S.reb.pages=Math.max(10,S.reb.pages);rebSig='';}else E.cos.sh+=+p[1];egLast=0;return true;
    case 'par':{const P=E.par;if(p[1]==='unl'){P.on=1;if(S.all<1e27){S.all=1e27;}P.last=S.all;}else if(p[1]==='reset'){P.lvl=0;P.xp=0;PARK.forEach(k=>{P.pts[k[0]]=0;});}else{P.on=1;P.lvl+=+p[1];}egLast=0;return true;}
    case 'frag':E.art.frag+=+p[1];egLast=0;return true;
    case 'art':if(p[1]==='myth') forgeArt(false,4);else if(p[1]==='sock') E.art.list.forEach(a=>{a.g=a.g.map(()=>1);});else if(p[1]==='clear'){E.art.list=[];E.art.eq=[];}egLast=0;return true;
    case 'rank':if(p[1]==='0'){E.ascT=0;E.rebT=0;}else E.ascT+=+p[1];return true;
    case 'auto':E.ascT=Math.max(3,E.ascT);egLast=0;return true;
    case 'myth':ITEMS.forEach(it=>{if(it.rar==='mythic') S.items[it.id]=5;});lootSig='';return true;
    case 'scan':{const n=admScanFix();const el=document.getElementById('admScan');if(el) el.textContent=n?tt(n+' kaputte Werte repariert.',n+' broken values repaired.'):tt('Alles in Ordnung – keine kaputten Werte gefunden.','All good – no broken values found.');save();return true;}
    case 'savenow':save();toast(tr('toast_saved'));return true;
    case 'backup':pushBackup();toast(tt('Backup angelegt.','Backup created.'));return true;
    case 'json':{const t=document.getElementById('admJson'),s=JSON.stringify(S);t.hidden=false;t.value=JSON.stringify(S,null,1);document.getElementById('admJsonN').textContent=tt('Größe: ','Size: ')+Math.round(s.length/1024)+' KB';return true;}
  }
  return false;
}

function fillAdmin(){
  if(!admOK||!els.admin.firstChild) return;
  const act=document.activeElement;
  els.admin.querySelectorAll('input[data-f]').forEach(inp=>{
    if(inp===act) return;
    const [g,a,b]=inp.dataset.f.split(':');
    let v;
    if(g==='x') v=XV&&XV[a]?XV[a][0]():0;
    else if(g==='r') v=S[a];
    else if(g==='m') v=S.admin[a];
    else if(g==='i') v=S.items[a]||0;
    else if(g==='o') v=S.orders[a];
    else if(b==='own') v=S.b[+a];
    else if(b==='cost') v=baseCost(+a);
    else v=baseCps(+a);
    inp.value=numStr(g==='r'&&a!=='cookies'||b==='own'?Math.floor(v):v);
  });
  els.admin.querySelectorAll('input[data-u]').forEach(inp=>{
    const [g,id]=inp.dataset.u.split(':');
    inp.checked=!!(g==='up'?S.up[id]:g==='ach'?S.ach[id]:S.tree[id]);
  });
  const AL={ck:fmt(S.cookies),kps:fmtRate(C.kps),clk:fmtRate(C.click),chips:fmt(S.chips),spd:'×'+S.admin.speed+(S.admin.ac?' · '+S.admin.ac+'/s':'')};
  els.admin.querySelectorAll('[data-al]').forEach(n=>{const v=AL[n.dataset.al];if(n.textContent!==v) n.textContent=v;});
  els.admin.querySelectorAll('[data-aseg]').forEach(sg=>{const cur=String(sg.dataset.aseg==='speed'?S.admin.speed:(S.admin.ac||0));sg.querySelectorAll('[data-v]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===cur?'true':'false'));});
}
function admSet(f,v){
  S.adm=1;
  const [g,a,b]=f.split(':');
  if(g==='x'){if(XV&&XV[a]) XV[a][1](v);}
  else if(g==='r'){
    S[a]=(a==='cookies'||a==='all'||a==='run')?v:Math.floor(v);
    if(a==='chips'||a==='asc') treeSig='';
    if(a==='chips'){const spent=TREE.reduce((s,n)=>s+(S.tree[n.id]?n.cost:0),0);if(spent>S.chips) S.tree={};}
  }else if(g==='m'){
    S.admin[a]=a==='growth'?Math.min(3,Math.max(1.001,v)):Math.min(1e9,Math.max(1e-4,v));
  }else if(g==='o'){
    S.orders[a]=Math.floor(Math.min(1e9,Math.max(0,v)));
  }else if(g==='i'){
    if(v>=1) S.items[a]=Math.min(99,Math.floor(v));else delete S.items[a];
  }else{
    const i=+a;
    if(b==='own') S.b[i]=Math.floor(v);
    else{
      const e=S.admin.b[i]||(S.admin.b[i]={});
      if(v>0) e[b]=v;else delete e[b];
      if(!e.cost&&!e.cps) delete S.admin.b[i];
    }
  }
  recalc();render();fillAdmin();
}
function toggleUnlock(g,id,on){
  S.adm=1;
  const map=g==='up'?S.up:g==='ach'?S.ach:S.tree;
  if(on) map[id]=1;else delete map[id];
  if(g==='tree'){const spent=TREE.reduce((s,n)=>s+(S.tree[n.id]?n.cost:0),0);if(spent>S.chips) S.chips=spent;treeSig='';}
  upSig='';recalc();refreshAch();render();
}
function addCookies(v){S.cookies+=v;S.run+=v;S.all+=v;}
function admAct(act){
  const p=act.split(':');
  if(!['savenow','backup','json','scan'].includes(p[0])) S.adm=1;
  if(admAct2(p)){recalc();refreshAch();render();fillAdmin();save();return;}
  if(p[0]==='add'){const v=+p[1];addCookies(v);toast(tr('toast_added',{n:fmt(v)}));}
  else if(p[0]==='mul10'){const v=S.cookies*9;addCookies(v);toast(tr('toast_added',{n:fmt(v)}));}
  else if(p[0]==='warp'){const v=C.kps*(+p[1]);addCookies(v);toast(tr('toast_warp',{n:fmt(v)}));}
  else if(p[0]==='gold'){
    if(p[1]==='spawn') spawnGolden();
    else if(p[1]==='clear'){S.buffs=[];recalc();}
    else applyGold(p[1]);
  }else if(p[0]==='all'||p[0]==='none'){
    const on=p[0]==='all',g=p[1],list=g==='up'?UP:g==='ach'?A:TREE;
    const map=g==='up'?S.up:g==='ach'?S.ach:S.tree;
    list.forEach(o=>{if(on) map[o.id]=1;else delete map[o.id];});
    if(g==='tree'){const spent=TREE.reduce((s,n)=>s+(S.tree[n.id]?n.cost:0),0);if(spent>S.chips) S.chips=spent;treeSig='';}
    upSig='';
  }else if(p[0]==='w'){
    const w=S.w;
    if(p[1]==='mana') w.mana=maxMana();
    else if(p[1]==='mon'){if(w.mon.st==='idle') spawnMon();}
    else if(p[1]==='timers'){const n=Date.now();w.exp.slots.forEach(s=>{if(s) s.end=n-1;});if(w.lab.cur) w.lab.cur.end=n-1;if(w.pet.egg) w.pet.egg.end=n-1;w.gar.plots.forEach(pl=>{if(pl){pl.at=n-(plantGrow(plantDef(pl))+5)*1000;}});}
    else if(p[1]==='mat') MATS.forEach(m=>addMat(m.id,20));
    else if(p[1]==='event') startEvent();
    else if(p[1]==='egg') w.pet.eggs++;
    else if(p[1]==='star') giveStar(3,'');
    else if(p[1]==='chal'){if(w.chal.act) S.run=Math.max(S.run,CHALS.find(c=>c.id===w.chal.act).goal);}
    else if(p[1]==='reset'){S.w=freshWorld();seedMarket();}
  }else if(p[0]==='day'){
    if(p[1]==='done') S.day.q.forEach(q=>{q.base=qDef(q).v()-q.goal;});
    else{const D=S.day;D.date='';D.last=dayKey(Date.now()-864e5);D.lc='';checkDay(false);}
  }else if(p[0]==='work'){
    WORKERS.forEach(x=>{if(p[1]==='all'||p[1]==='max'){S.work.hired[x.id]=1;S.work.on[x.id]=1;if(!S.work.face[x.id]) S.work.face[x.id]=genFace();if(p[1]==='max'){S.work.lvl[x.id]=10;S.work.xp[x.id]=0;}}else{delete S.work.hired[x.id];delete S.work.on[x.id];delete S.work.lvl[x.id];}});workSig='';recalc();
  }else if(p[0]==='orders'){
    if(p[1]==='done') S.orders.slots.forEach((s,i)=>{if(s&&s.st==='active') completeOrder(i);});
    else{S.orders.slots=[null,null,null];S.orders.cd=0;ensureOrders();}
  }else if(p[0]==='boosts'){S.boostCd={};
  }else if(p[0]==='box'){rollItem();
  }else if(p[0]==='items'){ITEMS.forEach(it=>{if(p[1]==='max') S.items[it.id]=5;else delete S.items[it.id];});lootSig='';
  }else if(p[0]==='rb'){delete S.admin.b[+p[1]];}
  else if(p[0]==='reset'){S.admin=defAdmin();toast(tr('toast_adm_reset'));}
  recalc();refreshAch();render();fillAdmin();
}
els.admin.addEventListener('change',e=>{
  const inp=e.target;
  if(inp.dataset.f){const v=parseNum(inp.value);if(v!==null) admSet(inp.dataset.f,v);else fillAdmin();inp.blur();}
  else if(inp.dataset.u){const [g,id]=inp.dataset.u.split(':');toggleUnlock(g,id,inp.checked);}
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b) return;
  admAct(b.dataset.act);
});
