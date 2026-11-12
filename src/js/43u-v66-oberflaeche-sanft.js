/* ======================= V66: Sanfte Fenster, lebendige Zahlen, ruhige Meldungen, Glocke, heller Look, bessere erste Minuten ======================= */
var v66Ready=false;
const uiMotion=()=>document.documentElement.dataset.motion!=='off';

/* ---------- 1. Fenster schließen sanft ----------
   Jedes .overlay bekommt eine eigene hidden-Eigenschaft: Schließen spielt erst kurz eine Ausblende-Animation ab.
   Für den Rest des Spiels gilt das Fenster sofort als geschlossen (hidden liefert true). */
(function(){
  const D=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'hidden');if(!D||!D.set) return;
  document.querySelectorAll('.overlay').forEach(ov=>{
    let tm=0;
    Object.defineProperty(ov,'hidden',{configurable:true,
      get(){return D.get.call(this)||this.classList.contains('ovout');},
      set(v){
        v=!!v;
        if(!v){if(tm){clearTimeout(tm);tm=0;}this.classList.remove('ovout');D.set.call(this,false);return;}
        if(D.get.call(this)||this.classList.contains('ovout')) return;
        if(!uiMotion()){D.set.call(this,true);return;}
        this.classList.add('ovout');
        tm=setTimeout(()=>{tm=0;this.classList.remove('ovout');D.set.call(this,true);},170);
      }});
  });
})();

/* ---------- 3. Lebendige Zahlen ---------- */
/* Zählt eine angezeigte Zahl (z. B. „5 billion", „1.234", „#2") von 0 hoch; Text davor und danach bleibt. */
function uiCountUp(el,ms){
  if(!el||!uiMotion()||el._cu) return;
  const t=el.textContent,m=t.match(/^([^\d]*)(\d[\d.,  ]*)(.*)$/);if(!m) return;
  const de=LANG==='de',raw=m[2].replace(/[  ]/g,''),
    num=parseFloat(de?raw.replace(/\./g,'').replace(',','.'):raw.replace(/,/g,'')),dec=(raw.split(de?',':'.')[1]||'').length;
  if(!isFinite(num)||num===0) return;
  const f=v=>v.toLocaleString(LOC[LANG],{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const t0=performance.now(),dur=ms||650;el._cu=1;
  const step=n=>{const k=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=m[1]+f(num*e)+m[3];if(k<1&&el.isConnected) requestAnimationFrame(step);else{el.textContent=t;el._cu=0;}};
  requestAnimationFrame(step);
}
/* Profil-Kacheln und Belohnungs-Fenster zählen beim Öffnen hoch */
new MutationObserver(()=>{$id('profBody').querySelectorAll('.ptile b').forEach(b=>uiCountUp(b));}).observe($id('profBody'),{childList:true});
new MutationObserver(()=>{$id('rwBody').querySelectorAll('b').forEach(b=>{if(/^\+?\d/.test(b.textContent.trim())) uiCountUp(b);});}).observe($id('rwBody'),{childList:true});
/* Edelsteine & Co. oben: kurzer Hüpfer, wenn der Wert steigt */
{
  const cb=$id('curBar'),last={};
  if(cb) new MutationObserver(()=>{
    cb.querySelectorAll('[data-cur]').forEach(b=>{
      const v=parseFloat(String(b.lastChild&&b.lastChild.textContent||'').replace(/[^\d.,]/g,'').replace(/[.,](?=\d{3}\b)/g,'').replace(',','.'))||0,k=b.dataset.cur;
      if(last[k]!==undefined&&v>last[k]&&uiMotion()){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');}
      last[k]=v;
    });
  }).observe(cb,{childList:true,subtree:true,characterData:true});
}

/* ---------- 4. Sanftes Umschalten von Listen ---------- */
function uiSwitchIn(el){if(!el||!uiMotion()) return;el.classList.remove('swin');void el.offsetWidth;el.classList.add('swin');}
{
  const watch=(box,sel)=>{
    const el=$id(box);if(!el) return;let pend=false;
    el.closest('.overlay').addEventListener('click',e=>{if(e.target.closest(sel)) pend=true;},true);
    new MutationObserver(()=>{if(pend){pend=false;uiSwitchIn(el);}}).observe(el,{childList:true});
  };
  watch('lbBody','[data-lbc],[data-lbk],[data-lbp],.seg button');
  watch('clubBody','[data-clt]');
}

/* ---------- 7. Ruhige Meldungen: eine nach der anderen, gleiche zusammengefasst ---------- */
let uiTQ=[],uiTCur=null,uiTTm=0;
toast=function(text,gold,force){
  NTF.push({t:Date.now(),text,gold:!!gold});if(NTF.length>60) NTF.shift();if(document.getElementById('ntfOv').hidden) ntfUnread++;
  const O=(typeof S!=='undefined'&&S&&S.opt)||{},mode=O.ntf||'all';
  if(!force&&(mode==='off'||(mode==='imp'&&!gold))) return;
  if(uiTCur&&uiTCur.text===text){uiTCur.n++;uiTShowN(uiTCur);uiTPlan(uiTCur,true);return;}
  const q=uiTQ.find(x=>x.text===text);if(q){q.n++;return;}
  uiTQ.push({text,gold:!!gold,n:1});
  if(uiTQ.length>5){const i=uiTQ.findIndex(x=>!x.gold);uiTQ.splice(i<0?0:i,1);}
  if(uiTCur) uiTPlan(uiTCur,false);else uiTNext();
};
function uiTShowN(it){let s=it.el.querySelector('.tn');if(it.n>1){if(!s){s=document.createElement('span');s.className='tn';it.el.appendChild(s);}s.textContent='×'+it.n;}}
/* Wie lange die aktuelle Meldung bleibt: kürzer, wenn weitere warten */
function uiTPlan(it,reset){
  const O=(S&&S.opt)||{},full=Math.max(1500,(O.ntfT||5)*1000-400),want=uiTQ.length?Math.min(full,2200):full;
  const left=reset?want:Math.min(want,Math.max(0,it.end-Date.now()));
  clearTimeout(uiTTm);it.end=Date.now()+left;uiTTm=setTimeout(uiTOut,left);
}
function uiTOut(){
  const it=uiTCur;if(!it){uiTNext();return;}
  if(uiMotion()){it.el.classList.add('tout');setTimeout(()=>{it.el.remove();uiTCur=null;uiTNext();},200);}
  else{it.el.remove();uiTCur=null;uiTNext();}
}
function uiTNext(){
  const it=uiTQ.shift();if(!it){uiTCur=null;return;}
  const el=document.createElement('div');el.className='toast'+(it.gold?' gold':'');el.textContent=it.text;it.el=el;
  els.toasts.querySelectorAll('.toast').forEach(x=>x.remove());
  els.toasts.appendChild(el);uiTShowN(it);uiTCur=it;uiTPlan(it,true);
}
els.toasts.addEventListener('click',e=>{if(e.target.closest('.toast')){clearTimeout(uiTTm);uiTOut();}});

/* ---------- 8. Aufgeräumte Glocke: gleiche Meldungen zusammen, Neu/Früher, Filter, „Alle gelesen" ---------- */
let ntfSeen=+(lsGet('keksfabrik-ntfseen')||0),ntfSeenOpen=0,ntfFilt='all';
document.getElementById('ntfBtn').addEventListener('click',()=>{ntfSeenOpen=ntfSeen;ntfSig='';updNtf();},true);
function ntfMarkRead(){ntfSeen=Date.now();lsSet('keksfabrik-ntfseen',String(ntfSeen));}
renderNtf=function(){
  setTxt(document.getElementById('ntfT'),tt('Meldungen','Notifications'));
  setTxt(document.getElementById('ntfClear'),tt('Leeren','Clear'));
  setTxt(document.getElementById('ntfClose'),tt('Schließen','Close'));
  let rd=$id('ntfRead');
  if(!rd){rd=document.createElement('button');rd.type='button';rd.className='btn sm';rd.id='ntfRead';$id('ntfClear').before(rd);}
  setTxt(rd,tt('Alle gelesen','Mark all read'));
  const G=[],by={};
  NTF.slice().reverse().forEach(n=>{if(ntfFilt==='imp'&&!n.gold) return;const g=by[n.text];if(g){g.n++;return;}const x={text:n.text,gold:n.gold,t:n.t,n:1};by[n.text]=x;G.push(x);});
  const row=x=>'<div class="nitem'+(x.gold?' gold':'')+(x.t>ntfSeenOpen?' new':'')+'"><span>'+x.text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c])+(x.n>1?' <em class="nn">×'+x.n+'</em>':'')+'</span><time>'+agoTxt(x.t)+'</time></div>';
  const nw=G.filter(x=>x.t>ntfSeenOpen),old=G.filter(x=>x.t<=ntfSeenOpen);
  let h='<div class="seg ntfseg" role="group"><button type="button" data-nf="all" aria-pressed="'+(ntfFilt==='all')+'">'+tt('Alle','All')+'</button><button type="button" data-nf="imp" aria-pressed="'+(ntfFilt==='imp')+'">'+tt('Wichtig','Important')+'</button></div>';
  if(!G.length) h+='<p class="small">'+(ntfFilt==='imp'?tt('Keine wichtigen Meldungen.','No important notifications.'):tt('Noch keine Meldungen.','No notifications yet.'))+'</p>';
  else{
    if(nw.length) h+='<h3 class="nhead">'+tt('Neu','New')+' <span class="todon">'+nw.length+'</span></h3><div class="nlist">'+nw.map(row).join('')+'</div>';
    if(old.length) h+='<h3 class="nhead">'+tt('Früher','Earlier')+'</h3><div class="nlist">'+old.map(row).join('')+'</div>';
  }
  document.getElementById('ntfBody').innerHTML=h;
};
$id('ntfOv').addEventListener('click',e=>{
  const f=e.target.closest('[data-nf]');if(f){ntfFilt=f.dataset.nf;ntfSig='';renderNtf();return;}
  if(e.target.closest('#ntfRead')){ntfMarkRead();ntfSeenOpen=ntfSeen;ntfUnread=0;ntfSig='';updNtf();renderNtf();}
});
/* Schließen zählt als gelesen */
new MutationObserver(()=>{if(ntfOv.hasAttribute('hidden')) ntfMarkRead();}).observe(ntfOv,{attributes:true,attributeFilter:['hidden']});

/* ---------- 10. Bessere erste Minuten ---------- */
/* Zeiger auf den Keks, dann auf das erste Gebäude; in den ersten Schritten keine zusätzlichen Hinweis-Knöpfe */
let uiCoachEl=null;
function uiCoach(){
  const de=document.documentElement,st=typeof tutStep==='function'?tutStep():null,fresh=st&&S.tut.i<4&&S.all<20000;
  let c='',done=false;
  if(st){try{const [x,y]=st.p();done=x>=y;}catch(e){}}
  if(fresh&&done) c='claim';
  else if(fresh&&S.tut.i===0) c='cookie';
  else if(fresh&&(S.tut.i===1||S.tut.i===2||S.tut.i===3)) c='buy';
  const quiet=fresh&&S.tut.i<2?'1':'';
  if((de.dataset.coach||'')!==c){if(c) de.dataset.coach=c;else delete de.dataset.coach;}
  if((de.dataset.quiet||'')!==quiet){if(quiet) de.dataset.quiet=quiet;else delete de.dataset.quiet;}
  if(c==='cookie'){
    if(!uiCoachEl){uiCoachEl=document.createElement('div');uiCoachEl.className='coach';uiCoachEl.setAttribute('aria-hidden','true');const ck=$id('cookie');if(ck&&ck.parentElement) ck.parentElement.appendChild(uiCoachEl);}
    setTxt(uiCoachEl,'👆 '+tt('Tipp auf den Keks!','Tap the cookie!')+' '+Math.min(15,S.clicks)+'/15');
  }else if(uiCoachEl){uiCoachEl.remove();uiCoachEl=null;}
  /* Fertiger Schritt: der „Abholen"-Knopf pulsiert */
  document.querySelectorAll('#tutBox .coachbtn').forEach(b=>{if(c!=='claim') b.classList.remove('coachbtn');});
  if(c==='claim'){const b=document.querySelector('#tutBox [data-tut]:not([data-tut="hide"])');if(b&&!b.classList.contains('coachbtn')) b.classList.add('coachbtn');}
  /* Zeige auf das Gebäude, das der aktuelle Schritt will, sobald man es sich leisten kann */
  const want=c==='buy'?(S.tut.i===3?1:0):-1;
  document.querySelectorAll('#buildList .row.coachrow').forEach(r=>{if(+r.dataset.i!==want||!r.classList.contains('can')) r.classList.remove('coachrow');});
  if(want>=0){const r=document.querySelector('#buildList .row[data-i="'+want+'"]');if(r&&r.classList.contains('can')) r.classList.add('coachrow');}
}
/* Konto-Karte: einmal zur richtigen Zeit erklären, was ein Konto bringt (höchstens 3-mal, mit 3 Tagen Abstand) */
function uiAccHint(){
  let box=$id('accHint');
  const st=(()=>{try{return JSON.parse(lsGet('keksfabrik-acchint')||'{}')||{};}catch(e){return {};}})();
  const due=lbOn()&&!accTok&&(S.tut.i>=3||S.all>=5000)&&(st.n||0)<3&&Date.now()-(st.t||0)>3*86400e3;
  const show=due&&startOv.hidden&&!document.querySelector('.overlay:not([hidden])');
  if(!show){if(box&&!due) box.remove();if(box) box.hidden=!due||!!document.querySelector('.overlay:not([hidden])');return;}
  if(!box){
    box=document.createElement('div');box.id='accHint';box.className='acchint';box.setAttribute('role','dialog');box.setAttribute('aria-label',tt('Gratis-Konto','Free account'));
    box.innerHTML='<b>☁️ '+tt('Sichere deine Bäckerei – gratis','Keep your bakery safe – it’s free')+'</b><ul><li>'+tt('Auf jedem Gerät weiterspielen','Keep playing on every device')+'</li><li>'+tt('Bestenliste und eigenes Profil','Leaderboard and your own profile')+'</li><li>'+tt('Clubs, Freunde und Geschenke','Clubs, friends and gifts')+'</li><li>'+tt('Keine E-Mail nötig','No email needed')+'</li></ul><div class="btns"><button type="button" class="btn sm primary" data-ah="go">'+tt('Konto erstellen','Create account')+'</button><button type="button" class="btn sm" data-ah="later">'+tt('Später','Later')+'</button></div>';
    document.body.appendChild(box);
  }
  box.hidden=false;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('#accHint [data-ah]');if(!b) return;
  let st={};try{st=JSON.parse(lsGet('keksfabrik-acchint')||'{}')||{};}catch(x){}
  st.n=(st.n||0)+1;st.t=Date.now();lsSet('keksfabrik-acchint',JSON.stringify(st));
  const box=$id('accHint');if(box) box.remove();
  if(b.dataset.ah==='go'&&v64Ready) lbAccGo();
});
setInterval(()=>{if(!S) return;uiCoach();uiAccHint();},500);

v66Ready=true;
