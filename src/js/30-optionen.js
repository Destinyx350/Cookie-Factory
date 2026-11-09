/* ======================= Optionen ======================= */
els.fx.checked=S.opt.fx;
els.fx.addEventListener('change',()=>{S.opt.fx=els.fx.checked;});
els.saveBtn.addEventListener('click',()=>{save();toast(tr('toast_saved'));});
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
