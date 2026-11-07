/* ======================= V54: Club-Stufen, Feedback, Datenschutz ======================= */
var v54Ready=false;
/* Club-Stufe: +1 % Produktion und +5 % Club-Preise pro Stufe über 1 (Stufe 1–10). Die Stufe kommt vom Server. */
const clubLvBonus=lv=>({prod:Math.max(0,Math.min(9,(lv|0)-1)),prize:5*Math.max(0,Math.min(9,(lv|0)-1))});
function clubLvlSync(){
  let lv=null;
  if(!clubSigned()) lv=0;
  else if(clubData) lv=clubData.club&&clubData.club.level?(clubData.club.level.level|0):0;
  if(lv!==null&&(S.clv|0)!==lv){S.clv=lv;recalc();}
}
function clubLvlHtml(c){
  const L=c&&c.level;if(!L) return '';
  const b=clubLvBonus(L.level),pct=L.next?Math.max(0,Math.min(100,Math.round((L.xp-L.cur)/(L.next-L.cur)*100))):100;
  return '<div class="clublv"><span class="lvbadge" title="'+tt('Club-Stufe','Club level')+'">'+tt('Stufe ','Level ')+L.level+'</span><span class="lvbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></span><small>'+(L.next?fmt(L.xp)+' / '+fmt(L.next)+' XP':tt('Höchste Stufe!','Top level!'))+'</small></div>'
    +'<p class="small clublvtxt">'+(b.prod?tt('Bonus für alle Mitglieder: +','Bonus for every member: +')+b.prod+tt(' % Produktion, Club-Preise +','% production, club prizes +')+b.prize+tt(' %. ','%. '):'')+tt('XP: 100 für jedes Mitglied, das in einer Woche mitbackt, 500 für jeden gewonnenen Clubkrieg.','XP: 100 for every member who bakes in a week, 500 for every club war won.')+'</p>';
}
const clubPrizeLv=p=>{const m=1+clubLvBonus(S.clv).prize/100;return m>1?{gems:Math.round(p.gems*m),h:p.h*m}:p;};

/* Feedback: Fehler melden oder Ideen schicken (kommt im Admin-Panel an) */
function fbOpen(){
  const old=$id('fbOv');if(old) old.remove();
  const ov=document.createElement('div');ov.className='overlay';ov.id='fbOv';
  ov.innerHTML='<div class="dlg namedlg" role="dialog" aria-modal="true" aria-labelledby="fbT"><h2 id="fbT">💬 '+tt('Feedback senden','Send feedback')+'</h2>'
    +(lbOn()?'<form class="accform" id="fbF" novalidate><div class="seg fbkind" role="radiogroup" aria-label="'+tt('Art','Kind')+'">'+[['bug','🐞',tt('Fehler','Bug')],['idea','💡',tt('Idee','Idea')],['other','💬',tt('Sonstiges','Other')]].map(([k,ic,l],i)=>'<label><input type="radio" name="kind" value="'+k+'"'+(i===0?' checked':'')+'><span>'+ic+' '+l+'</span></label>').join('')+'</div>'
      +'<textarea class="namein" name="body" maxlength="1000" rows="5" placeholder="'+tt('Was ist passiert, oder was wünschst du dir?','What happened, or what would you like?')+'"></textarea>'
      +'<p class="small">'+tt('Geht an den Entwickler. Mitgeschickt werden die Spielversion, dein Browser und – wenn du angemeldet bist – dein Benutzername. Mehr in der Datenschutz-Info.','Goes to the developer. The game version, your browser and – if you’re signed in – your username are sent along. More in the privacy info.')+'</p>'
      +'<p class="nameerr" id="fbErr" aria-live="polite"></p><div class="btns"><button type="submit" class="btn primary">'+tt('Senden','Send')+'</button><button type="button" class="btn" id="fbClose">'+tt('Abbrechen','Cancel')+'</button></div></form>'
      :'<p>'+tt('Feedback geht gerade nicht.','Feedback isn’t available right now.')+'</p><div class="btns"><button type="button" class="btn" id="fbClose">OK</button></div>')+'</div>';
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.querySelector('#fbClose').addEventListener('click',close);
  ov.addEventListener('click',e=>{if(e.target===ov) close();});
  ov.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}});
  const ta=ov.querySelector('textarea');if(ta) ta.focus();
  const f=ov.querySelector('#fbF');if(!f) return;
  f.addEventListener('submit',async e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(f).entries()),body=String(d.body||'').trim(),err=$id('fbErr');
    if(body.length<5){err.textContent=tt('Schreib bitte mindestens ein paar Wörter.','Please write at least a few words.');return;}
    const btn=f.querySelector('[type=submit]');btn.disabled=true;err.textContent='';
    try{
      await lbApi('rpc/kf_feedback_send',{p_id:kfId(),p_token:accTok||null,p_kind:d.kind||'other',p_body:body,p_ver:NEWS_VER,p_ua:String(navigator.userAgent||'').slice(0,200)});
      close();toast(tt('Danke! Dein Feedback ist angekommen.','Thanks! Your feedback was sent.'),true);
    }catch(x){
      btn.disabled=false;const m=String(x.message||'');
      err.textContent=/too many requests/.test(m)?tt('Heute hast du schon genug geschickt. Versuch es morgen nochmal.','You’ve sent enough for today. Try again tomorrow.'):lbMissing(x)?tt('Feedback geht erst nach dem nächsten Server-Update.','Feedback works after the next server update.'):tt('Keine Verbindung. Versuch es gleich nochmal.','No connection. Try again in a moment.');
    }
  });
}
const PRIVACY_URL=window.KF_PORTAL?'https://destinyx350.github.io/Cookie-Factory/privacy.html':'privacy.html';
(function(){
  const row=$id('helpSetBtn')&&$id('helpSetBtn').parentElement;if(!row) return;
  const fb=document.createElement('button');fb.type='button';fb.className='btn';fb.id='fbSetBtn';row.appendChild(fb);
  const pv=document.createElement('a');pv.className='btn';pv.id='privSetBtn';pv.href=PRIVACY_URL;pv.target='_blank';pv.rel='noopener';row.appendChild(pv);
  fb.addEventListener('click',()=>{closeSettings();fbOpen();});
})();
function updV54Txt(){set$('fbSetBtn',tt('💬 Feedback senden','💬 Send feedback'));set$('privSetBtn',tt('🔒 Datenschutz','🔒 Privacy'));}
updV54Txt();
v54Ready=true;
