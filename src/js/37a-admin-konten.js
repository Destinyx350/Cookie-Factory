/* Nur in admin.html (nicht im Spiel für Spieler). */
/* Admin: Konten */
let admAccData=null,admAccErr='',admAccArm={k:'',t:0};
function admAccRender(){
  const box=$id('admAcc');if(!box||!admPass) {if(box) box.innerHTML='';return;}
  const D=admAccData,arm=k=>admAccArm.k===k&&Date.now()-admAccArm.t<5000;
  let b='<p class="small">'+tt('Spieler mit Konto: ','Players with an account: ')+(D?D.count:'–')+'</p>';
  if(D&&D.accounts.length){
    b+='<form class="admform" id="admAccPwF" novalidate><label class="small">'+tt('Konto','Account')+'<select class="namein" name="acc">'+D.accounts.map(a=>'<option value="'+a.id+'">'+escName(a.username)+'</option>').join('')+'</select></label><label class="small">'+tt('Neues Passwort','New password')+'<input class="namein" name="pw" minlength="6" maxlength="72"></label><button type="submit" class="btn primary">'+tt('Passwort setzen','Set password')+'</button></form>';
    b+='<div class="admlbl">'+D.accounts.map(a=>'<div class="admlbr"><span class="rk">👤</span><span class="who"><b>'+escName(a.username)+'</b><small>'+fmt(+a.save_baked||0)+tt(' Kekse',' cookies')+' · '+tt('zuletzt ','last ')+(a.last_login?new Date(a.last_login).toLocaleString(LOC[LANG],{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'–')+'</small></span><span class="btns"><button type="button" class="btn sm warn'+(arm('del:'+a.id)?' armed':'')+'" data-acca="del:'+a.id+'">'+(arm('del:'+a.id)?tt('Sicher?','Sure?'):tt('Löschen','Delete'))+'</button></span></div>').join('')+'</div>';
  }
  if(admAccErr) b+='<p class="nameerr">'+admAccErr+'</p>';
  const h='<div class="admcard"><h4>👤 '+tt('Konten','Accounts')+'</h4>'+b+'</div>';
  if(box._h!==h){box._h=h;box.innerHTML=h;}
}
async function admAccCall(action,id,pw){
  admAccErr='';
  try{admAccData=await lbApi('rpc/admin_accounts',{p_pass:admPass,p_action:action,p_id:id||null,p_new:pw||null});if(action==='set_password') toast(tt('Neues Passwort gesetzt. Sag es dem Spieler.','New password set. Tell the player.'));if(action==='delete') toast(tt('Konto gelöscht.','Account deleted.'));}
  catch(x){const m=String(x.message||'');admAccErr=lbMissing(x)?tt('Konten sind noch nicht eingerichtet (docs/accounts-v4.sql).','Accounts aren’t set up yet (docs/accounts-v4.sql).'):/invalid password/.test(m)?tt('Das Passwort braucht 6–72 Zeichen.','The password needs 6–72 characters.'):tt('Hat nicht geklappt: ','Didn’t work: ')+escName(m);}
  admAccArm={k:'',t:0};admAccRender();
}
els.admin.addEventListener('submit',e=>{if(e.target.getAttribute('id')!=='admAccPwF') return;e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());admAccCall('set_password',d.acc,d.pw);});
els.admin.addEventListener('click',e=>{
  const b=e.target.closest('[data-acca]');if(b){const [a,id]=b.dataset.acca.split(':');if(admAccArm.k!==b.dataset.acca||Date.now()-admAccArm.t>5000){admAccArm={k:b.dataset.acca,t:Date.now()};admAccRender();return;}admAccCall('delete',id);return;}
  if(e.target.closest('#admSeg [data-ap="online"]')||e.target.closest('[data-ona="list"]')) setTimeout(()=>{if(admPass) admAccCall('list');},50);
});
