/* ======================= Optionen ======================= */
els.fx.checked=S.opt.fx;
els.fx.addEventListener('change',()=>{S.opt.fx=els.fx.checked;});
els.saveBtn.addEventListener('click',()=>{save();toast(tr('toast_saved'));});
els.exportBtn.addEventListener('click',()=>{S.t=Date.now();els.exportBox.value=enc(sealJSON(S));els.exportBox.focus();els.exportBox.select();});
els.copyBtn.addEventListener('click',()=>{
  if(!els.exportBox.value) els.exportBox.value=enc(sealJSON(S));
  const done=()=>toast(tr('toast_copied'));
  const fallback=()=>{els.exportBox.focus();els.exportBox.select();toast(tr('toast_select'));};
  try{navigator.clipboard.writeText(els.exportBox.value).then(done,fallback);}catch(e){fallback();}
});
els.importBtn.addEventListener('click',()=>{
  try{
    const s=sanitize(JSON.parse(dec(els.importBox.value)));
    if(!s.name) s.name=S.name;
    if(s.tamp&&!S.tamp) setTimeout(tampWarn,400);
    S=s;S.t=Date.now();LANG=S.opt.lang;els.fx.checked=S.opt.fx;els.importBox.value='';
    applyLang();rebuildAll();save();toast(tr('toast_loaded'));
  }catch(e){toast(tr('toast_invalid'));}
});
armed(els.resetBtn,'wipe_confirm',()=>{els.resetBtn.textContent=tr('wipe');},()=>{
  askName({title:tt('Neues Spiel','New game'),text:tt('Wie soll dein neuer Spielstand heißen? Dein bisheriger Fortschritt in diesem Platz wird gelöscht.','What should your new save be called? Your current progress in this slot will be erased.'),ok:tt('Neu starten','Start over')},nm=>{
    const l=LANG;S=fresh();S.opt.lang=l;S.name=nm;els.fx.checked=true;rebuildAll();save();slotSig='';toast(tr('toast_new'));
  });
});

/* Sprache */
function applyLang(){
  document.documentElement.lang=LANG;
  document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=tr(e.dataset.i18n);});
  document.querySelectorAll('[data-ph]').forEach(e=>{e.placeholder=tr(e.dataset.ph);});
  document.querySelectorAll('[data-aria]').forEach(e=>{e.setAttribute('aria-label',tr(e.dataset.aria));});
  document.querySelectorAll('.langseg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===LANG?'true':'false'));
  els.respecBtn.textContent=tr('respec');
  els.resetBtn.textContent=tr('wipe');
  showName();updV34Txt();
  upSig='';treeSig='';
  rebuildAch();if(ADMH.build) ADMH.build();buildNews();setSkin();showSaveNote();render();
}
document.querySelectorAll('.langseg').forEach(g=>g.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b) return;
  if(LANG!==b.dataset.lang) S.sec.lang=(S.sec.lang||0)+1;
  LANG=b.dataset.lang;S.opt.lang=LANG;applyLang();save();
}));
