/* ======================= V47: Aufgeräumte Einstellungen ======================= */
/* Speichern: Konto zuerst, dann Speichern; alles andere unter „Weitere Möglichkeiten“. */
(function(){
  const secs=[...document.querySelectorAll('#setOv .optsec[data-sc="save"]')];
  const acc=secs.find(x=>x.querySelector('#accBox')),main=secs.find(x=>x.querySelector('#saveBtn'));
  if(!acc||!main) return;
  main.parentNode.insertBefore(acc,main);
  const det=document.createElement('details');det.className='optsec fold savemore';det.dataset.sc='save';
  det.innerHTML='<summary id="saveMoreT"></summary>';
  main.after(det);
  secs.filter(x=>x!==acc&&x!==main).forEach(x=>det.appendChild(x));
})();
function updV47Txt(){
  set$('saveMoreT',tt('Weitere Möglichkeiten: Speicherplätze, Backups, Datei, Transfer-Code, Text','More options: save slots, backups, file, transfer code, text'));
  set$('helpSetT',tt('Hilfe und Teilen','Help and sharing'));
  set$('helpSetBtn',tt('❓ Hilfe öffnen','❓ Open help'));
  set$('shareSetBtn',tt('📣 Spiel teilen','📣 Share the game'));
}
$id('helpSetBtn').addEventListener('click',()=>{closeSettings();openHelp();});
$id('shareSetBtn').addEventListener('click',()=>{closeSettings();$id('shareBtn').click();});
updV47Txt();
