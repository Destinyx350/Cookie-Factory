/* Fehleranzeige: zeigt Fehler sichtbar an, statt dass das Spiel still stehen bleibt */
(function(){
  const seen={};
  function show(msg){
    msg=String(msg||'Unbekannter Fehler').slice(0,300);if(seen[msg]) return;seen[msg]=1;
    let box=document.getElementById('errBox');
    if(!box){box=document.createElement('div');box.id='errBox';box.setAttribute('role','alert');
      box.style.cssText='position:fixed;z-index:99;left:12px;right:12px;top:12px;max-width:560px;margin:0 auto;background:#3a1410;color:#ffe2da;border:1px solid #ff8c6b;border-radius:14px;padding:10px 14px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4)';
      box.innerHTML='<b>Fehler / Error</b> – automatisch gemeldet · reported automatically:<pre style="white-space:pre-wrap;margin:6px 0;font:12px ui-monospace,monospace"></pre><button type="button" style="border:0;border-radius:999px;padding:5px 12px;background:#ff8c6b;color:#2b0d05;font-weight:700;cursor:pointer">OK</button>';
      box.querySelector('button').onclick=()=>box.remove();(document.body||document.documentElement).appendChild(box);}
    const pre=box.querySelector('pre');pre.textContent=(pre.textContent?pre.textContent+'\n':'')+msg;
  }
  window.__kfErr=show;
  /* Absturzberichte: jeder Fehler wird gemerkt und (ab V51) an den Server geschickt. */
  const Q=window.__kfErrQ=[];
  const keep=(m,st,src)=>{try{Q.push({m:String(m||'').slice(0,300),st:String(st||'').slice(0,2000),src:String(src||'').slice(0,200)});if(window.__kfErrFlush) window.__kfErrFlush();}catch(x){}};
  addEventListener('error',e=>{if(!e.message&&!e.error) return;keep(e.message||(e.error&&e.error.message),e.error&&e.error.stack,String(e.filename||'').split('/').pop()+':'+e.lineno+':'+e.colno);show((e.message||'Fehler')+(e.lineno?' (Zeile '+e.lineno+')':''));});
  addEventListener('unhandledrejection',e=>{const r=e.reason;if(r&&/AudioContext|play\(\)|NotAllowed|Failed to fetch|NetworkError|Load failed|AbortError/i.test(String(r&&r.message||r))) return;keep('Promise: '+(r&&r.message||r),r&&r.stack,'');show('Promise: '+(r&&r.message||r));});
})();
(function(){
'use strict';
/* Admin-Haken: Nur admin.html trägt hier Funktionen ein. Im Spiel für Spieler bleibt das leer. */
const ADMH={on:false};
