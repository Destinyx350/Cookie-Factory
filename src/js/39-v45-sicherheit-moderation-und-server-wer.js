/* ======================= V45: Sicherheit, Moderation und Server-Werkzeuge ======================= */
var v45Ready=false;
/* ---------- Spieler: Schalter, Wartung, Update-Pflicht ---------- */
var kfCfg={feat:{chat:true,gifts:true,clubs:true,lb:true},maint:{on:false},min_ver:0};
function featOn(k){return !kfCfg||!kfCfg.feat||kfCfg.feat[k]!==false;}
function cfgApply(c){
  if(!c||typeof c!=='object') return;
  const prev=JSON.stringify(kfCfg);
  kfCfg={feat:Object.assign({chat:true,gifts:true,clubs:true,lb:true},c.feat||{}),maint:Object.assign({on:false},c.maint||{}),min_ver:+c.min_ver||0};
  if(JSON.stringify(kfCfg)===prev) return;
  renderLb();clubRender();maintRender();
}
function maintRender(){
  const ov=$id('maintOv');if(!ov) return;
  const need=kfCfg.min_ver>NEWS_VER,mt=kfCfg.maint&&kfCfg.maint.on&&!ADMH.on;
  ov.hidden=!(need||mt);if(ov.hidden) return;
  const m=mt?String((LANG==='de'?kfCfg.maint.de:kfCfg.maint.en)||kfCfg.maint.de||kfCfg.maint.en||''):'';
  const h=need?'<div class="mbig" aria-hidden="true">⬆️</div><h2 id="maintT">'+tt('Update nötig','Update needed')+'</h2><p>'+tt('Es gibt eine neue Version der Keksfabrik. Lade neu, um weiterzuspielen. Dein Fortschritt bleibt.','There’s a new version of Cookie Factory. Reload to keep playing. Your progress stays.')+'</p><div class="btns" style="justify-content:center"><button type="button" class="btn primary" id="maintGo">'+tt('Jetzt aktualisieren','Update now')+'</button></div>'
    :'<div class="mbig" aria-hidden="true">🛠️</div><h2 id="maintT">'+tt('Wir backen gerade an einem Update','We’re baking an update')+'</h2><p>'+(m?escName(m):tt('Die Keksfabrik ist gleich wieder da. Bitte versuch es in ein paar Minuten nochmal.','Cookie Factory will be back soon. Please try again in a few minutes.'))+'</p><p class="small">'+tt('Dein Fortschritt ist gespeichert.','Your progress is saved.')+'</p>'+(ADMH.build?'<div class="btns" style="justify-content:center"><button type="button" class="btn sm" id="maintAdm">'+tt('Admin','Admin')+'</button></div>':'');
  const d=$id('maintBody');if(d._h!==h){d._h=h;d.innerHTML=h;}
}
$id('maintOv').addEventListener('click',e=>{
  if(e.target.closest('#maintGo')){save();location.reload();return;}
});
window.addEventListener('keydown',e=>{if(!$id('maintOv').hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}},true);

/* Bestenliste: frühere Saisons */
var lbSeasons=null,lbSeasonsAt=0;
async function lbLoadSeasons(){
  if(!lbOn()||Date.now()-lbSeasonsAt<300000) return;
  lbSeasonsAt=Date.now();
  try{lbSeasons=await lbApi('rpc/lb_seasons',{});}catch(x){lbSeasons=[];}
  renderLb();
}
function lbSeasonsHtml(){
  if(!lbSeasons||!lbSeasons.length) return '';
  return '<details class="fold lbhof"><summary>🏛️ '+tt('Ruhmeshalle: frühere Saisons','Hall of fame: past seasons')+'</summary>'+lbSeasons.map(s=>'<p class="lbprev"><b>'+escName(s.name)+'</b>: '+(s.top||[]).slice(0,3).map((t,i)=>['🥇','🥈','🥉'][i]+' '+escName(t.name)).join(' · ')+'</p>').join('')+'</details>';
}
v45Ready=true;
