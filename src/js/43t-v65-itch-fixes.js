/* ======================= V65: Fixes für das Spielen auf itch.io ======================= */
/* Läuft das Spiel in einem Rahmen (itch.io und andere Seiten), scrollt nicht die Seite, sondern der Spielbereich (.wrap).
   So geht Scrollen auch dann, wenn der Rahmen selbst nicht scrollen darf (itch.io: "Enable scrollbars" aus). */
(function(){
  let framed=false;
  try{framed=window.self!==window.top;}catch(e){framed=true;}
  if(framed) document.documentElement.dataset.embed='1';
})();
