/* ======================= V40: Admin – Bestenliste verwalten ======================= */
let admLbData=null,admLbErr='',admLbBusy=false,admLbArm={k:'',t:0};
function admLbRender(){
  const box=$id('admLb');if(!box) return;
  let h='<div class="admcard"><h4>'+tt('Bestenliste verwalten','Manage the leaderboard')+'</h4><p class="small">'+tt('Entferne Spieler, sperre Schummler oder setze ihr Spiel zurück. Das Zurücksetzen passiert beim nächsten Start ihres Spiels; ihr Spielstand liegt nur auf ihrem Gerät.','Remove players, ban cheaters or reset their game. A reset happens the next time their game starts; their save only lives on their own device.')+'</p>';
  if(!lbOn()){box.innerHTML=h+'<p class="small">'+tt('Die Bestenliste ist nicht eingerichtet.','The leaderboard isn’t set up.')+'</p></div>';return;}
  if(!admPass){
    h+='<form class="coderow" id="admLbPwF" novalidate><input type="password" class="namein" id="admLbPw" autocomplete="current-password" placeholder="'+tt('Server-Passwort','Server password')+'" aria-label="'+tt('Server-Passwort','Server password')+'"><button type="submit" class="btn primary">'+tt('Laden','Load')+'</button></form><p class="small" style="margin-top:6px">'+tt('Die Server-Werkzeuge haben ein eigenes Passwort. Nach 5 falschen Versuchen sind sie 15 Minuten gesperrt.','The server tools have their own password. After 5 wrong tries they lock for 15 minutes.')+'</p>';
  }else{
    h+='<div class="btns" style="margin-top:8px"><button type="button" class="btn sm primary" data-lba="list">'+(admLbBusy?tt('Lädt …','Loading …'):tt('Aktualisieren','Refresh'))+'</button><button type="button" class="btn sm'+(admLbArm.k==='clear:'&&Date.now()-admLbArm.t<5000?' armed':'')+'" data-lba="clear:">'+(admLbArm.k==='clear:'&&Date.now()-admLbArm.t<5000?tt('Wirklich alle entfernen? Nochmal klicken','Really remove everyone? Click again'):tt('Ganze Bestenliste leeren','Clear the whole leaderboard'))+'</button></div>';
  }
  if(admLbErr) h+='<p class="nameerr">'+admLbErr+'</p>';
  h+='</div>';
  if(admPass&&admLbData){
    const E=admLbData.entries||[],B=admLbData.banned||[];
    const btn=(a,id,label,cls)=>{const k=a+':'+id,arm=admLbArm.k===k&&Date.now()-admLbArm.t<5000;return '<button type="button" class="btn sm'+(cls?' '+cls:'')+(arm?' armed':'')+'" data-lba="'+k+'">'+(arm?tt('Sicher?','Sure?'):label)+'</button>';};
    h+='<div class="admcard"><h4>'+tt('Spieler','Players')+' <small class="muted">('+E.length+')</small></h4>'+(E.length?'<div class="admlbl">'+E.map((r,i)=>'<div class="admlbr"><span class="rk">'+(i+1)+'</span><span class="who"><b>'+pcl(r.name)+'</b><small>'+fmt(+r.score||0)+' '+tt('Kekse','cookies')+' · '+new Date(r.updated_at).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</small></span><span class="btns">'+btn('remove',r.id,tt('Entfernen','Remove'))+btn('ban',r.id,tt('Sperren','Ban'))+btn('reset',r.id,tt('Spiel zurücksetzen','Reset game'),'warn')+'</span></div>').join('')+'</div>':'<p class="small">'+tt('Niemand in der Bestenliste.','Nobody on the leaderboard.')+'</p>')+'</div>';
    h+='<div class="admcard"><h4>'+tt('Gesperrt','Banned')+' <small class="muted">('+B.length+')</small></h4>'+(B.length?'<div class="admlbl">'+B.map(r=>'<div class="admlbr"><span class="rk">⛔</span><span class="who"><b>'+escName(r.name||tt('(ohne Namen)','(no name)'))+'</b><small>'+new Date(r.created_at).toLocaleDateString(LOC[LANG])+'</small></span><span class="btns">'+btn('unban',r.id,tt('Entsperren','Unban'))+'</span></div>').join('')+'</div>':'<p class="small">'+tt('Niemand gesperrt.','Nobody banned.')+'</p>')+(admLbData.resets?'<p class="small" style="margin-top:6px">'+tt('Wartende Zurücksetzungen: ','Resets waiting to happen: ')+admLbData.resets+'</p>':'')+'</div>';
  }
  if(box._h!==h){box._h=h;box.innerHTML=h;}
}
async function admLbCall(action,id){
  admLbBusy=true;admLbErr='';admLbRender();
  try{
    if(action!=='list') await lbApi('rpc/admin_lb',{p_pass:admPass,p_action:action,p_id:id||null});
    admLbData=await lbApi('rpc/admin_lb',{p_pass:admPass,p_action:'list'});
    if(action!=='list') toast({remove:tt('Spieler entfernt.','Player removed.'),ban:tt('Spieler gesperrt.','Player banned.'),unban:tt('Spieler entsperrt.','Player unbanned.'),reset:tt('Zurücksetzen angefordert. Es passiert beim nächsten Start des Spielers.','Reset requested. It happens the next time the player opens the game.'),clear:tt('Bestenliste geleert.','Leaderboard cleared.')}[action]||'OK');
    if(action!=='list'){lbLast=0;lbRefresh();}
  }catch(x){
    const m=String(x&&x.message||'');
    if(/wrong admin password/.test(m)){admSrvDrop();admLbErr=tt('Server-Sitzung abgelaufen. Bitte entsperre neu.','Server session ended. Please unlock again.');}
    else if(lbMissing(x)) admLbErr=tt('Die Datenbank kennt diese Funktion noch nicht. Führe zuerst docs/leaderboard-v2.sql in Supabase aus.','The database doesn’t have this yet. Run docs/leaderboard-v2.sql in Supabase first.');
    else admLbErr=tt('Hat nicht geklappt: ','Didn’t work: ')+escName(m);
  }
  admLbBusy=false;admLbArm={k:'',t:0};admLbRender();
}
els.admin.addEventListener('submit',e=>{
  if(e.target.id!=='admLbPwF') return;
  e.preventDefault();const v=$id('admLbPw').value;if(!v) return;admSrvLogin(v,'lb');
});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-lba]');if(!b) return;
  const [a,id]=b.dataset.lba.split(':');
  if(a==='list'){admLbCall('list');return;}
  if(a!=='remove'&&a!=='unban'&&(admLbArm.k!==b.dataset.lba||Date.now()-admLbArm.t>5000)){admLbArm={k:b.dataset.lba,t:Date.now()};admLbRender();return;}
  admLbCall(a,id||null);
});
els.admin.addEventListener('click',e=>{const b=e.target.closest('#admSeg [data-ap="lb"]');if(b) setTimeout(()=>{admLbRender();if(admPass&&!admLbData&&!admLbBusy) admLbCall('list');},0);});
