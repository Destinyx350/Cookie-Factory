/* Nur in admin.html (nicht im Spiel für Spieler). */
/* Admin: Clubs */
let admClubData=null,admClubErr='',admClubArm={k:'',t:0};
function admClubRender(){
  const box=$id('admClub');if(!box||!admPass){if(box) box.innerHTML='';return;}
  const D=admClubData,arm=k=>admClubArm.k===k&&Date.now()-admClubArm.t<5000,dt=s=>new Date(s).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  let b='<p class="small">'+tt('Clubs: ','Clubs: ')+(D?D.clubs.length:'–')+' · '+tt('Geschenke (24 Std): ','Gifts (24 h): ')+(D?D.gifts_today:'–')+'</p>';
  if(D&&D.clubs.length) b+='<div class="admlbl">'+D.clubs.map(c=>'<div class="admlbr"><span class="rk">'+escName(c.emoji)+'</span><span class="who"><b>'+escName(c.name)+'</b><small>'+c.members+tt(' Mitglieder',' members')+'</small></span><span class="btns"><button type="button" class="btn sm warn'+(arm('delete_club:'+c.id)?' armed':'')+'" data-clba="delete_club:'+c.id+'">'+(arm('delete_club:'+c.id)?tt('Sicher?','Sure?'):tt('Löschen','Delete'))+'</button></span></div>').join('')+'</div>';
  if(D&&D.msgs.length) b+='<h4 style="margin:12px 0 0">💬 '+tt('Neueste Chat-Nachrichten','Latest chat messages')+'</h4><div class="admlbl">'+D.msgs.map(m=>'<div class="admlbr"><span class="rk">💬</span><span class="who"><b>'+escName(m.username)+' · '+escName(m.club)+'</b><small>'+escName(m.body)+' · '+dt(m.created_at)+'</small></span><span class="btns"><button type="button" class="btn sm warn" data-clba="delete_msg:'+m.id+'">'+tt('Löschen','Delete')+'</button></span></div>').join('')+'</div>';
  if(admClubErr) b+='<p class="nameerr">'+admClubErr+'</p>';
  const h='<div class="admcard"><h4>👥 '+tt('Clubs & Geschenke','Clubs & gifts')+'</h4>'+b+'</div>';
  if(box._h!==h){box._h=h;box.innerHTML=h;}
}
async function admClubCall(action,id){
  admClubErr='';
  try{admClubData=await lbApi('rpc/admin_clubs',{p_pass:admPass,p_action:action,p_id:id||null});if(action==='delete_club') toast(tt('Club gelöscht.','Club deleted.'));if(action==='delete_msg') toast(tt('Nachricht gelöscht.','Message deleted.'));}
  catch(x){admClubErr=lbMissing(x)?tt('Clubs sind noch nicht eingerichtet (docs/clubs-v5.sql).','Clubs aren’t set up yet (docs/clubs-v5.sql).'):tt('Hat nicht geklappt: ','Didn’t work: ')+escName(String(x.message||''));}
  admClubArm={k:'',t:0};admClubRender();
}
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-clba]');
  if(b){const [a,id]=b.dataset.clba.split(':');if(a==='delete_club'&&(admClubArm.k!==b.dataset.clba||Date.now()-admClubArm.t>5000)){admClubArm={k:b.dataset.clba,t:Date.now()};admClubRender();return;}admClubCall(a,id);return;}
  if(e.target.closest('#admSeg [data-ap="online"]')||e.target.closest('[data-ona="list"]')) setTimeout(()=>{if(admPass) admClubCall('list');},80);
});
