/* Nur in admin.html (nicht im Spiel für Spieler). */
/* Admin: Backups */
var admBk=null,admBkErr='',admBkArm={k:'',t:0},admBkBusy=false;
async function admBkCall(action,data){
  if(!admPass||admBkBusy) return null;
  admBkBusy=true;admBkErr='';admSrvRender();let r=null;
  try{r=await lbApi('rpc/admin_backup',{p_pass:admPass,p_action:action,p_data:data||null});if(r&&r.backups) admBk=r.backups;}
  catch(x){admBkErr=lbMissing(x)?tt('Backups brauchen zuerst docs/update-v7.sql in Supabase.','Backups need docs/update-v7.sql in Supabase first.'):/not in this backup/.test(String(x.message))?tt('Diesen Spieler gibt es in diesem Backup nicht.','That player isn’t in this backup.'):admErrTxt(x);r=null;}
  admBkBusy=false;admBkArm={k:'',t:0};admSrvRender();return r;
}
function admBkHtml(){
  const B=admBk||[],kb=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
  const armR=admBkArm.k==='restore'&&Date.now()-admBkArm.t<5000;
  return '<p class="small">'+tt('Einmal pro Woche macht der Server automatisch ein Backup von Konten, Spielständen, Clubs, Bestenliste und Codes. Die letzten 6 automatischen und 6 eigenen bleiben. Lade ab und zu eins herunter, dann hast du auch eine Kopie außerhalb von Supabase.','Once a week the server automatically backs up accounts, saves, clubs, the leaderboard and codes. The last 6 automatic and 6 manual ones are kept. Download one now and then so you also have a copy outside Supabase.')+'</p>'
    +'<div class="btns"><button type="button" class="btn sm primary" data-bka="make"'+(admBkBusy?' disabled':'')+'>'+(admBkBusy?tt('Moment …','One moment …'):tt('Jetzt Backup machen','Back up now'))+'</button></div>'
    +(B.length?'<div class="admlbl">'+B.map(b=>'<div class="admlbr"><span class="rk">'+(b.kind==='auto'?'🗓️':'💾')+'</span><span class="who"><b>'+admDT(b.at)+' · '+(b.kind==='auto'?tt('automatisch','automatic'):tt('von dir','manual'))+'</b><small>'+kb(+b.size||0)+' · '+(b.counts&&b.counts.kf_accounts!=null?b.counts.kf_accounts+tt(' Konten',' accounts')+' · ':'')+(b.counts&&b.counts.leaderboard!=null?b.counts.leaderboard+tt(' in der Bestenliste',' on the leaderboard'):'')+'</small></span><span class="btns"><button type="button" class="btn sm" data-bka="get:'+b.id+'">'+tt('Herunterladen','Download')+'</button></span></div>').join('')+'</div>'
      +'<details class="fold"><summary>'+tt('Konto eines Spielers wiederherstellen','Restore a player’s account')+'</summary><p class="small">'+tt('Setzt den Spielstand des Kontos auf den Stand im Backup zurück. Ein gelöschtes Konto kommt mit seinem alten Passwort zurück.','Puts the account’s save back to how it was in the backup. A deleted account comes back with its old password.')+'</p><form class="admform" id="admBkRF" novalidate><label class="small">Backup<select class="namein" name="id">'+B.map(b=>'<option value="'+b.id+'">'+admDT(b.at)+'</option>').join('')+'</select></label><label class="small">'+tt('Benutzername','Username')+'<input class="namein" name="user" maxlength="16" autocapitalize="off" spellcheck="false"></label><button type="submit" class="btn warn'+(armR?' armed':'')+'">'+(armR?tt('Wirklich? Nochmal','Really? Again'):tt('Wiederherstellen','Restore'))+'</button></form></details>'
      :(admBk?'<p class="small">'+tt('Noch kein Backup.','No backup yet.')+'</p>':''))
    +(admBkErr?'<p class="nameerr">'+admBkErr+'</p>':'');
}
els.admin.addEventListener('click',async e=>{
  const b=e.target.closest('[data-bka]');if(!b) return;
  const [a,id]=b.dataset.bka.split(':');
  if(a==='make'){const r=await admBkCall('make');if(r) toast(tt('Backup gespeichert.','Backup saved.'));return;}
  if(a==='get'){
    const r=await admBkCall('get',{id});if(!r) return;
    const blob=new Blob([JSON.stringify(r)],{type:'application/json'}),url=URL.createObjectURL(blob),el=document.createElement('a');
    el.href=url;el.download='keksfabrik-backup-'+String(r.at||'').slice(0,10)+'-'+r.id+'.json';document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast(tt('Backup heruntergeladen. Bewahre die Datei sicher auf: Sie enthält alle Spielstände.','Backup downloaded. Keep the file safe: it contains every save.'),true);admBkCall('list');
  }
});
els.admin.addEventListener('submit',async e=>{
  const f=e.target;if(f.getAttribute('id')!=='admBkRF') return;
  e.preventDefault();const d=Object.fromEntries(new FormData(f).entries());
  if(!/^[A-Za-z0-9_]{3,16}$/.test(String(d.user||'').trim())){admBkErr=tt('Gib den Benutzernamen des Kontos ein.','Enter the account username.');admSrvRender();return;}
  if(!(admBkArm.k==='restore'&&Date.now()-admBkArm.t<5000)){admBkArm={k:'restore',t:Date.now()};admSrvRender();return;}
  const r=await admBkCall('restore_account',{id:d.id,user:String(d.user).trim()});
  if(r&&r.restored) toast(tt('Konto wiederhergestellt. Der Spieler lädt es beim nächsten Anmelden.','Account restored. The player gets it the next time they sign in.'),true);
});
