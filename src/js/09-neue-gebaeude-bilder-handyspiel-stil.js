/* ===== Neue Gebäude-Bilder (Handyspiel-Stil) ===== */
{
const O=' stroke="#3b2416" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"',o=' stroke="#3b2416" stroke-width="1.6" stroke-linejoin="round"';
const SH='<ellipse cx="32" cy="58.5" rx="21" ry="3.6" fill="rgba(0,0,0,.25)"/>';
const HL=d=>'<path d="'+d+'" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2.2" stroke-linecap="round"/>';
const ck=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#e3a24c"'+o+'/><circle cx="'+(x-r*.35)+'" cy="'+(y-r*.25)+'" r="'+(r*.18)+'" fill="#4b2a16"/><circle cx="'+(x+r*.3)+'" cy="'+(y+r*.3)+'" r="'+(r*.18)+'" fill="#4b2a16"/>';
const st=(x,y,s,c)=>'<path d="M'+x+' '+(y-s)+'l'+(s*.3)+' '+(s*.7)+' '+(s*.7)+' '+(s*.3)+'-'+(s*.7)+' '+(s*.3)+'-'+(s*.3)+' '+(s*.7)+'-'+(s*.3)+'-'+(s*.7)+'-'+(s*.7)+'-'+(s*.3)+' '+(s*.7)+'-'+(s*.3)+'z" fill="'+(c||'#ffd96a')+'"/>';
Object.assign(ART,{
b0:SH+'<path d="M15 51c0-8 7-13 17-13s17 5 17 13c0 4-7 6-17 6s-17-2-17-6z" fill="#f6dcaa"'+O+'/>'+HL('M21 46c3-3 7-4 11-4')+'<ellipse cx="32" cy="42.5" rx="5" ry="1.8" fill="#dcb578"/><path d="M27 5h10v31a5 5 0 0 1-10 0z" fill="#f4c19b"'+O+'/><path d="M29.3 31h5.4v4.3a2.7 2.7 0 0 1-5.4 0z" fill="#ffe6d6" stroke="#c98f6b" stroke-width="1"/><path d="M29 15h6M29 21h6" stroke="#c98f6b" stroke-width="1.6" stroke-linecap="round"/>'+HL('M30 8v8')+st(49,16,6)+st(14,24,4,'#fff3c4'),
b1:SH+'<path d="M11 58c0-10 9-15 21-15s21 5 21 15z" fill="#d9573f"'+O+'/><path d="M25 44l7 6 7-6" fill="#fff"'+o+'/><circle cx="32" cy="12" r="6" fill="#e6e8ee"'+O+'/><circle cx="32" cy="29" r="13.5" fill="#f7d1b0"'+O+'/><path d="M18.5 28c0-10 6-14 13.5-14s13.5 4 13.5 14c-3-4-8-6.5-13.5-6.5S21.5 24 18.5 28z" fill="#e6e8ee"'+O+'/><circle cx="26.5" cy="30" r="3.8" fill="rgba(255,255,255,.55)" stroke="#3b2416" stroke-width="1.8"/><circle cx="37.5" cy="30" r="3.8" fill="rgba(255,255,255,.55)" stroke="#3b2416" stroke-width="1.8"/><path d="M30.3 30h3.4" stroke="#3b2416" stroke-width="1.8"/><circle cx="22.5" cy="35.5" r="2.3" fill="#f29a8a"/><circle cx="41.5" cy="35.5" r="2.3" fill="#f29a8a"/><path d="M28.5 37.5c2 2 5 2 7 0" fill="none" stroke="#3b2416" stroke-width="1.8" stroke-linecap="round"/>'+ck(49,50,6.5),
b2:SH+'<path d="M12 31h40v26H12z" fill="#f6e3c4"'+O+'/><path d="M42 13h6v13l-6-5z" fill="#b5523d"'+O+'/><circle cx="46" cy="8" r="3" fill="#fff" opacity=".85"/><circle cx="50.5" cy="4" r="2.2" fill="#fff" opacity=".6"/><path d="M7 33L32 12l25 21z" fill="#e0583e"'+O+'/>'+HL('M14 30L32 15.5')+'<path d="M21 57V46a11 11 0 0 1 22 0v11z" fill="#7a3f22"'+O+'/><path d="M26 57c0-5 3-6 3-10 2 2 1 4 3 4 0-2 1-3 2-4 1 4 4 5 4 10z" fill="#ffb347"/><path d="M29.5 57c0-3 2-3 2.5-5.5 1 2 3 3 3 5.5z" fill="#ffe08a"/>'+ck(32,25,4.2),
b3:SH+'<path d="M5 52c8-6 46-6 54 0v5H5z" fill="#7cc06a"'+O+'/><path d="M31 31l11-9 11 9v19H31z" fill="#d9573f"'+O+'/><path d="M37.5 50v-9h9v9" fill="#8a2f22"'+o+'/><path d="M37.5 41l9 9M46.5 41l-9 9" stroke="#f6e3c4" stroke-width="1.6"/><path d="M29 31.5l13-11 13 11" fill="none" stroke="#f6e3c4" stroke-width="2"/><circle cx="17" cy="41" r="11" fill="#5fae55"'+O+'/>'+HL('M10 37c1-3 3-5 6-6')+ck(13,40,3.2)+ck(21,36,3.2)+ck(20,46,3.2),
b4:SH+'<path d="M3 57L21 22l10 12 8-10 22 33z" fill="#9a8a7a"'+O+'/><path d="M21 22l-5 9 5-2 3 3z" fill="#fff"/><path d="M21 57V45a10 10 0 0 1 20 0v12z" fill="#2a1a10"'+O+'/><path d="M20.5 45h21M23 45v12M39 45v12" stroke="#a46a35" stroke-width="3"/><path d="M36 49h19l-3 7H39z" fill="#6b7680"'+O+'/><path d="M38.5 49l3-4 3 3 3.5-4.5 3 5.5z" fill="#5a3320"'+o+'/><circle cx="41.5" cy="57" r="2.3" fill="#3b2416"/><circle cx="50" cy="57" r="2.3" fill="#3b2416"/>',
b5:SH+'<path d="M44 57V13h9v44z" fill="#d9573f"'+O+'/><path d="M44 20h9M44 27h9" stroke="#fff" stroke-width="2.4"/><circle cx="49" cy="8" r="3.2" fill="#dfe6ea" opacity=".9"/><circle cx="53.5" cy="3.5" r="2.4" fill="#dfe6ea" opacity=".7"/><path d="M8 57V35l12-7v7l12-7v7l12-7v29z" fill="#b8c2cc"'+O+'/><path d="M8 52h36" stroke="#3b2416" stroke-width="2"/><rect x="11.5" y="40" width="6" height="6" rx="1.5" fill="#ffd96a"'+o+'/><rect x="23" y="40" width="6" height="6" rx="1.5" fill="#ffd96a"'+o+'/><rect x="34.5" y="40" width="6" height="6" rx="1.5" fill="#ffd96a"'+o+'/><circle cx="15" cy="50" r="2" fill="#e3a24c"/><circle cx="26" cy="50" r="2" fill="#e3a24c"/><circle cx="37" cy="50" r="2" fill="#e3a24c"/>',
b6:SH+'<path d="M6 25L32 10l26 15z" fill="#e6ebf0"'+O+'/><path d="M9 25h46v5H9z" fill="#d5dce4"'+O+'/><path d="M13 30h6v24h-6zM24 30h6v24h-6zM34 30h6v24h-6zM45 30h6v24h-6z" fill="#f4f7fa"'+O+'/><path d="M7 54h50v4H7z" fill="#c7cfd8"'+O+'/><circle cx="32" cy="19" r="4.8" fill="#ffd25a"'+O+'/><path d="M30.6 19h2.8" stroke="#a46a00" stroke-width="1.6"/>'+HL('M12 23.5L32 12.5'),
b7:SH+'<path d="M5 57h54v-5H5z" fill="#e8c27a"'+O+'/><path d="M11 52h42v-5H11z" fill="#f0d08f"'+O+'/><path d="M16 47V29h32v18z" fill="#f6e0a8"'+O+'/><path d="M13.5 29a18.5 15 0 0 1 37 0z" fill="#ffc94a"'+O+'/>'+HL('M19 24c3-5 8-8 13-8')+'<path d="M32 14V7"'+O+'/><circle cx="32" cy="6" r="2.6" fill="#ffd96a"'+o+'/><path d="M27 47v-9a5 5 0 0 1 10 0v9z" fill="#8a5a2a"'+o+'/>'+ck(21,38,3)+ck(43,38,3),
b8:SH+'<path d="M22 57l3-31h14l3 31z" fill="#7a68c8"'+O+'/><path d="M24 36h16M23 46h18" stroke="#5a48a8" stroke-width="1.6"/><path d="M19 27L32 3l13 24z" fill="#4b3a9c"'+O+'/>'+HL('M24 23L31 9')+st(33,16,3.5)+'<path d="M29 41v-5a3 3 0 0 1 6 0v5z" fill="#ffd96a"'+o+'/><path d="M29 57v-6a3 3 0 0 1 6 0v6" fill="#3b2a6e"'+o+'/>'+st(12,20,4)+st(52,32,4.5,'#c9b8ff')+st(10,44,3,'#c9b8ff'),
b9:SH+'<path d="M22 31l-8 11v7l8-4zM42 31l8 11v7l-8-4z" fill="#d9573f"'+O+'/><path d="M25 39h14c0 7-4 12-7 17-3-5-7-10-7-17z" fill="#ffb347"'+O+'/><path d="M29 39h6c0 4-1.5 7-3 10-1.5-3-3-6-3-10z" fill="#ffe08a"/><path d="M32 4c9 7 12 18 10 35H22C20 22 23 11 32 4z" fill="#eef2f6"'+O+'/><path d="M32 4c4 3 7 7 8.5 12h-17C25 11 28 7 32 4z" fill="#d9573f"'+O+'/><circle cx="32" cy="25" r="5.2" fill="#7fc8ff"'+O+'/>'+HL('M29.5 23.5a3 3 0 0 1 2.5-2')+HL('M25 20v12'),
b10:SH+'<path d="M26 7h12v4h-2v12l14 24a6 6 0 0 1-5 9H19a6 6 0 0 1-5-9l14-24V11h-2z" fill="rgba(220,240,255,.6)"'+O+'/><path d="M20.5 40h23l5.2 8.6a4 4 0 0 1-3.4 6.1H18.7a4 4 0 0 1-3.4-6.1z" fill="#5fe08a"/><circle cx="27" cy="47" r="2.2" fill="#c8ffd9"/><circle cx="35" cy="50.5" r="1.6" fill="#c8ffd9"/><circle cx="33" cy="34" r="1.8" fill="#5fe08a"/><circle cx="30" cy="28" r="1.3" fill="#5fe08a"/><rect x="26.5" y="3" width="11" height="5.5" rx="1.6" fill="#b98550"'+O+'/>'+HL('M22.5 46l5-8.5'),
b11:SH+'<ellipse cx="32" cy="32" rx="22.5" ry="24.5" fill="#3a1f6b"'+O+'/><ellipse cx="32" cy="32" rx="16.5" ry="18.5" fill="#7a3fd1"/><ellipse cx="32" cy="32" rx="10.5" ry="12.5" fill="#b07aff"/><ellipse cx="32" cy="32" rx="4.5" ry="5.5" fill="#f2e6ff"/><path d="M19 30c2-8 15-11 19-4M45 34c-2 8-15 11-19 4" fill="none" stroke="#f2e6ff" stroke-width="2.2" stroke-linecap="round"/>'+ck(51,13,3.4)+ck(12,52,2.6)+st(52,48,3.5,'#e6d4ff'),
b12:SH+'<circle cx="18" cy="50" r="7.5" fill="#c9a86a"'+O+'/><circle cx="18" cy="50" r="2.6" fill="#3b2416"/><circle cx="46" cy="51" r="6" fill="#c9a86a"'+O+'/><circle cx="46" cy="51" r="2.2" fill="#3b2416"/><path d="M26 8.5h12"'+O+'/><circle cx="32" cy="29" r="20" fill="#f6e3c4"'+O+'/><circle cx="32" cy="29" r="15" fill="#fffaf0" stroke="#c9a86a" stroke-width="2"/><path d="M32 16v2.5M32 39.5V42M19 29h2.5M42.5 29H45" stroke="#3b2416" stroke-width="2"/><path d="M32 29V19.5M32 29l7 5" fill="none"'+O+'/><circle cx="32" cy="29" r="2" fill="#d9573f"/>'+HL('M19 21c2-4 6-7 10-8'),
b13:SH+'<path d="M18 50h28l-4 7H22z" fill="#6b7680"'+O+'/><circle cx="32" cy="29" r="18" fill="rgba(90,216,255,.18)"/><ellipse cx="32" cy="29" rx="23" ry="7.5" fill="none" stroke="#b07aff" stroke-width="2.6" transform="rotate(-25 32 29)"/><circle cx="32" cy="29" r="12" fill="#5ad8ff"'+O+'/><circle cx="32" cy="29" r="6" fill="#e6fbff"/><ellipse cx="32" cy="29" rx="23" ry="7.5" fill="none" stroke="#e0c8ff" stroke-width="2.6" transform="rotate(25 32 29)"/>'+HL('M25 24a8 8 0 0 1 5-4'),
b14:SH+'<path d="M2 37l20-4" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M40 30l22-9" stroke="#ff5a5a" stroke-width="2.6"/><path d="M41 32l21-5" stroke="#ffa53a" stroke-width="2.6"/><path d="M41.5 34l20.5-1" stroke="#ffe04a" stroke-width="2.6"/><path d="M42 36l20 3" stroke="#5fe08a" stroke-width="2.6"/><path d="M42.5 38l19.5 7" stroke="#5aa8ff" stroke-width="2.6"/><path d="M43 40l19 11" stroke="#b07aff" stroke-width="2.6"/><path d="M32 9l19 35H13z" fill="rgba(215,238,255,.75)"'+O+'/>'+HL('M20 38l10-19'),
b15:'<path d="M5 8h1M58 30h1M8 40h1M44 4h1" stroke="#fff" stroke-width="2" stroke-linecap="round"/><ellipse cx="28" cy="35" rx="23" ry="6.5" fill="none" stroke="#b48cf2" stroke-width="2.6" transform="rotate(-15 28 35)"/>'+'<circle cx="28" cy="35" r="15" fill="#e3a24c"'+O+'/><circle cx="23" cy="31" r="2.3" fill="#4b2a16"/><circle cx="33" cy="30" r="2" fill="#4b2a16"/><circle cx="30" cy="41" r="2.4" fill="#4b2a16"/><circle cx="21" cy="40" r="1.6" fill="#4b2a16"/>'+HL('M17 30c1-4 4-7 8-8')+'<path d="M6 41.5c8 5 36-2 44-11" fill="none" stroke="#b48cf2" stroke-width="2.6" stroke-linecap="round"/><circle cx="51" cy="13" r="6" fill="#8a5a3c"'+O+'/><circle cx="53" cy="51" r="4.2" fill="#f2a6c4"'+O+'/>',
b16:SH+'<path d="M12 34h34c0 5-5 8-11 8v6h7v7H21v-7h7v-6c-9 0-16-3-16-8z" fill="#6b7680"'+O+'/>'+HL('M15 35.5h28')+'<path d="M44 19L30 33" stroke="#8a5a2a" stroke-width="4.5" stroke-linecap="round"/><path d="M40 9l9 9-4.5 4.5-9-9z" fill="#a9b4c0"'+O+'/><path d="M23 18l2.6 5.6 6.1.8-4.5 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.5-4.2 6.1-.8z" fill="#ffd96a"'+O+'/>'+st(10,12,3,'#fff3c4')+st(36,26,2.5,'#fff3c4')+st(50,30,3)
,
b17:'<path d="M6 10h1M56 54h1M50 8h1M10 54h1" stroke="#fff" stroke-width="2" stroke-linecap="round"/><ellipse cx="32" cy="33" rx="27" ry="10.5" fill="#ff9a3c"'+O+'/><ellipse cx="32" cy="33" rx="19" ry="6.5" fill="#ffd96a"/><circle cx="32" cy="30" r="13.5" fill="none" stroke="rgba(255,200,120,.7)" stroke-width="2.4"/><circle cx="32" cy="30" r="11" fill="#0d0a14"'+O+'/><path d="M7 34c6 7 44 7 50 0" fill="none" stroke="#ffb347" stroke-width="4.2" stroke-linecap="round"/>'+ck(53,15,2.8)+ck(11,18,2.2),
b18:SH+'<path d="M44 5a10 10 0 1 0 11 15 8 8 0 1 1-11-15z" fill="#ffd96a"'+O+'/><path d="M11 50a9 9 0 0 1 3-17 12 12 0 0 1 22-6 10 10 0 0 1 15 9 8 8 0 0 1-2 14z" fill="#f5f0ff"'+O+'/>'+HL('M16 37c1-3 4-5 7-5')+ck(29,41,7.5)+'<path d="M13 12h5l-5 5h5" fill="none" stroke="#b8a8ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'+st(26,8,3)+st(56,32,2.5,'#e6d4ff'),
b19:SH+'<path d="M32 1l4.5 10 10-6-3 11 11 1-9 7 7 8.5-11-.5 1 10.5-10-5-10 5 1-10.5-11 .5 7-8.5-9-7 11-1-3-11 10 6z" fill="#ffb347" opacity=".95"/><rect x="13" y="24" width="38" height="32" rx="6" fill="#4b4f5c"'+O+'/><rect x="18.5" y="31" width="27" height="18" rx="3.5" fill="#2a1035"'+o+'/><circle cx="32" cy="40" r="7" fill="#ff7a3c"/><circle cx="32" cy="40" r="3.6" fill="#fff3b0"/>'+st(23,35,2.2,'#fff')+st(41,45,2,'#ffd96a')+'<circle cx="19" cy="27.5" r="1.7" fill="#ffd96a"/><circle cx="25" cy="27.5" r="1.7" fill="#5ad8ff"/><path d="M38 27.5h8" stroke="#8a98a3" stroke-width="2" stroke-linecap="round"/>'+HL('M16 30v20'),
b20:SH+'<circle cx="32" cy="30" r="25" fill="#1d1846"'+O+'/><path d="M16 36 26 22 38 30 48 18" fill="none" stroke="#9fb4ff" stroke-width="1.6" stroke-dasharray="2 2.5"/>'+ck(16,36,4.5)+ck(26,22,4)+ck(38,30,4.5)+ck(48,18,4)+st(20,46,2.4,'#fff')+st(44,44,2,'#ffd96a')+HL('M14 18c3-5 8-9 14-10'),
b21:SH+'<ellipse cx="32" cy="32" rx="26" ry="9" fill="none" stroke="#5ad8ff" stroke-width="2.2" transform="rotate(30 32 32)"/><ellipse cx="32" cy="32" rx="26" ry="9" fill="none" stroke="#c48bff" stroke-width="2.2" transform="rotate(-30 32 32)"/>'+ck(26,30,10)+'<g opacity=".55">'+ck(38,34,10)+'</g>'+st(50,14,2.4,'#5ad8ff')+st(14,50,2,'#c48bff'),
b22:SH+'<circle cx="32" cy="32" r="24" fill="#0b0716"'+O+'/><path d="M32 12a20 20 0 0 1 20 20M32 52a20 20 0 0 1-20-20M12 32a20 20 0 0 1 20-20" fill="none" stroke="#ffb347" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><circle cx="32" cy="32" r="9" fill="#ffcf7a"'+o+'/><circle cx="32" cy="32" r="4" fill="#fff6d6"/>'+st(48,48,2.2,'#fff')
});
}

const SKINS=[
  {id:'classic',need:0,name:['Klassisch','Classic'],c:['#f6cf80','#e3a24c','#b87725'],stroke:'#8f5a1b',chip:'#4b2a16',chipS:'#34190b',hi:'#7a4a2a',speck:'#b97a2a'},
  {id:'choco',need:1e6,name:['Schoko','Choco'],c:['#8a5a3c','#5e3822','#3a2012'],stroke:'#24120a',chip:'#f4e8d2',chipS:'#c9b793',hi:'#ffffff',speck:'#2a1509'},
  {id:'matcha',need:1e9,name:['Matcha','Matcha'],c:['#c5e3a0','#8fbf6a','#5c8f42'],stroke:'#3d6a2c',chip:'#f6f1dc',chipS:'#cfc79d',hi:'#ffffff',speck:'#4e8035'},
  {id:'berry',need:1e12,name:['Erdbeere','Strawberry'],c:['#ffc2cf','#f08ca4','#c9567a'],stroke:'#933655',chip:'#fff4f0',chipS:'#e9c7c0',hi:'#ffffff',speck:'#b3466a'},
  {id:'night',need:1e15,name:['Mitternacht','Midnight'],c:['#6d5aa8','#3e3178','#241a52'],stroke:'#150f33',chip:'#f2c75a',chipS:'#b58a1e',hi:'#fff1b0',speck:'#8a77d0'},
  {id:'gold',need:1e18,name:['Gold','Gold'],c:['#fff3b0','#f2c648','#c58f12'],stroke:'#8a5a08',chip:'#7a4a0a',chipS:'#4b2a05',hi:'#b87a22',speck:'#d9a62a'},
  {id:'cosmos',need:1e21,name:['Kosmos','Cosmos'],c:['#9be7ff','#6a7bff','#3a2a9a'],stroke:'#201866',chip:'#ffd1f4',chipS:'#c58ab8',hi:'#ffffff',speck:'#b9a8ff'},
  {id:'custom',need:0,custom:1,name:['Eigenes Design','My design']},
  {id:'void',need:1e24,name:['Leere','Void'],c:['#4a4a58','#1c1c24','#08080c'],stroke:'#000000',chip:'#c8a2ff',chipS:'#7a52c4',hi:'#ffffff',speck:'#5a5a72'}
];
const NEWS_VER=63;
const NEWS=[
  {v:63,sum:['Großes Balance-Update','Big balance update'],items:[
    ['change','Klicks: Die stärksten Klick-Upgrades sind schwächer (zum Beispiel ×10 → ×3, ×100 → ×10). Für den Teil eines Klicks, der aus deiner Produktion kommt, zählen Klick-Multiplikatoren höchstens ×10. Alle Klick-Boosts zusammen geben höchstens ×300.','Clicks: the strongest click upgrades are weaker (for example ×10 → ×3, ×100 → ×10). For the part of a click that comes from your production, click multipliers count at most ×10. All click boosts together give at most ×300.'],
    ['change','Nur echte Klicks zählen, höchstens 20 pro Sekunde – Auto-Klicker bringen nichts mehr.','Only real clicks count, at most 20 a second – auto-clickers no longer help.'],
    ['change','Offline: Du bekommst höchstens 100 % deiner Produktion. Die höheren Offline-Upgrades geben dafür mehr Zeit (bis zu 7 Tage).','Offline: you get at most 100% of your production. The higher offline upgrades give more time instead (up to 7 days).'],
    ['change','Goldkekse: Gebäude-Rausch höchstens ×5, Keks-Regen höchstens 15 % deiner Kekse (wie Glückstreffer), und alle Produktions-Boosts zusammen höchstens ×100.','Golden cookies: Building Rush at most ×5, Cookie Rain at most 15% of your cookies (like Lucky), and all production boosts together at most ×100.']]},
  {v:62,sum:['Neue Konten sind gleich in der Bestenliste','New accounts join the leaderboard right away'],items:[
    ['new','Wer ein Konto erstellt, ist mit seiner Bäckerei sofort in der Bestenliste – auch in den Listen für Klicks, Goldkekse, Aufstiege und die schnellste Milliarde. Ist der Bäckerei-Name schon vergeben, nimmt sie den Benutzernamen.','When you create an account, your bakery joins the leaderboard right away – including the boards for clicks, golden cookies, ascensions and the fastest billion. If the bakery name is taken, it uses your username.'],
    ['change','Du willst nicht in der Bestenliste sein? Tippe dort auf „Austreten“; danach kommst du nicht von selbst wieder hinein.','Don’t want to be on the leaderboard? Tap "Leave" there; you won’t be added again by yourself.']]},
  {v:61,sum:['Neue Bestenlisten und dein eigenes Profil','New leaderboards and your own profile'],items:[
    ['new','Mehr Bestenlisten: die meisten Klicks, die meisten Goldkekse, die meisten Aufstiege und die schnellste Milliarde (dein schnellster Lauf von 0 bis 1 Milliarde Kekse diese Woche). Oben in der Bestenliste wechselst du zwischen ihnen.','More leaderboards: most clicks, most golden cookies, most ascensions and the fastest billion (your quickest run from 0 to 1 billion cookies this week). Switch between them at the top of the leaderboard.'],
    ['new','Dein Profil: Mit einem Konto wählst du Avatar, Farbe, Motto und bis zu 3 Lieblings-Erfolge. Öffne dein Profil über deinen Namen in der Bestenliste und tippe auf „Profil bearbeiten“.','Your profile: with an account, pick an avatar, a color, a motto and up to 3 favourite achievements. Open your profile from your name on the leaderboard and tap "Edit profile".'],
    ['new','Profile zeigen jetzt den Platz in jeder Bestenliste, und mit „Profil teilen“ schickst du einen Link zu deinem Profil.','Profiles now show the place in every leaderboard, and "Share profile" sends a link to your profile.']]},
  {v:60,sum:['Die Keksfabrik ist auf itch.io!','Cookie Factory is on itch.io!'],items:[
    ['new','itch.io: Die Keksfabrik hat jetzt eine Seite auf itch.io (destinyx350.itch.io/cookie-factory). Eine Bewertung oder ein Kommentar dort hilft dem Spiel sehr – der Knopf ist unter Einstellungen → Spiel.','itch.io: Cookie Factory now has a page on itch.io (destinyx350.itch.io/cookie-factory). A rating or comment there helps the game a lot – the button is under Settings → Game.']]},
  {v:59,sum:['Neuer Start, eigene Tabs und dein Verlauf','A new start, your own tabs and your history'],items:[
    ['new','Startbildschirm: eine kleine Bäckerei mit rauchendem Schornstein, leuchtenden Fenstern und deinem Bäckerei-Namen auf dem Schild – nachts mit Mond und Sternen.','Start screen: a little bakery with a smoking chimney, glowing windows and your bakery’s name on the sign – with moon and stars at night.'],
    ['new','Tab-Leiste: Sortiere die Tabs um und blende aus, was du nicht brauchst (Einstellungen → Anzeige).','Tab bar: reorder the tabs and hide what you don’t need (Settings → Display).'],
    ['new','Gebäude: Ein Balken zeigt den Weg zum nächsten Meilenstein, und ☰/▦ wechselt zwischen Liste und Raster.','Buildings: a bar shows the way to the next milestone, and ☰/▦ switches between list and grid.'],
    ['new','Dein Verlauf: Ziele → Statistik zeigt Diagramme deiner Kekse und Produktion über die Zeit, mit 👼 für Aufstiege.','Your history: Goals → Statistics shows charts of your cookies and production over time, with 👼 for ascensions.'],
    ['change','Willkommen zurück: Die Kekse zählen hoch, und „Alles einsammeln“ holt Belohnungen und fertige Expeditionen auf einmal.','Welcome back: the cookies count up, and “Collect all” picks up rewards and finished expeditions at once.'],
    ['change','Weicher: Tabs blenden ein, neue Gebäude gleiten herein, und Handys vibrieren sanft (abschaltbar unter Einstellungen → Ton).','Smoother: tabs fade in, new buildings slide in, and phones vibrate softly (turn it off under Settings → Sound).']]},
  {v:58,sum:['Sicherere Konten und ein Live-Club-Chat','Safer accounts and a live club chat'],items:[
    ['new','Wiederherstellungs-Code: Mit einem Einmal-Code setzt du ein neues Passwort, falls du es vergisst („Passwort vergessen?“ beim Anmelden). Hast du schon ein Konto? Erstelle ihn unter Einstellungen → Speichern → Konto.','Recovery code: a one-time code lets you set a new password if you forget yours (“Forgot your password?” when signing in). Already have an account? Create one under Settings → Saving → Account.'],
    ['new','Geräte: Sieh, wo dein Konto angemeldet ist, und melde einzelne Geräte ab.','Devices: see where your account is signed in and sign out single devices.'],
    ['new','Live-Club-Chat: Neue Nachrichten erscheinen sofort, solange der Club offen ist.','Live club chat: new messages appear right away while the club is open.'],
    ['change','Schnellerer Server: Geplante Events starten jetzt pünktlich auf die Minute, und der Server meldet Probleme von selbst.','Faster server: planned events now start right on time, and the server reports problems on its own.']]},
  {v:57,sum:['Website, Trailer und Werkzeuge für den Betreiber','A website, a trailer and tools for the owner'],items:[
    ['new','Website: Die Keksfabrik hat jetzt eine eigene Seite mit Trailer, Bildern und einer Anleitung zum Installieren – perfekt zum Teilen: destinyx350.github.io/Cookie-Factory/welcome.html','Website: Cookie Factory now has its own page with a trailer, screenshots and install steps – perfect for sharing: destinyx350.github.io/Cookie-Factory/welcome.html'],
    ['new','Trailer: ein kurzes Gameplay-Video vom 3D-Keks, den Gebäuden und der Welt.','Trailer: a short gameplay video of the 3D cookie, the buildings and the world.'],
    ['change','Hinter den Kulissen: Der Betreiber sieht jetzt ein Live-Dashboard und bekommt jeden Montag einen Wochenbericht – so werden Probleme schneller gefunden. Dafür zählt das Spiel anonym Browsersprache, Gerätetyp und ob es als App läuft.','Behind the scenes: the owner now has a live dashboard and a weekly report every Monday, so problems get found faster. For this the game anonymously counts browser language, device type and whether it runs as an app.']]},
  {v:56,sum:['Einfacher speichern und ein sichererer Server','Simpler saving and a safer server'],items:[
    ['change','Einfacher speichern: Dein Konto und die Spielstand-Datei sind die zwei Wege, deine Bäckerei auf ein anderes Gerät mitzunehmen. Transfer-Code und Spielstand-Text gibt es nicht mehr.','Simpler saving: your account and the save file are the two ways to take your bakery to another device. The transfer code and the save text are gone.'],
    ['new','Geplante Events: Events und Ankündigungen starten jetzt auch zu festen Zeiten, manche jede Woche – halte Ausschau!','Planned events: events and announcements now also start at set times, some every week – keep an eye out!'],
    ['new','Sicherer Server: Eine verschlüsselte Kopie des wöchentlichen Backups liegt jetzt außerhalb des Spielservers, und alte Daten werden automatisch gelöscht.','Safer server: an encrypted copy of the weekly backup is now kept outside the game server, and old data is deleted automatically.'],
    ['change','Fairer: Unrealistische Sprünge in Konto-Spielständen werden geprüft. Dein Spielstand wird dabei nie gelöscht.','Fairer: unrealistic jumps in account saves are checked. Your save is never deleted by this.']]},
  {v:55,sum:['Neuer Soundtrack und 3D-Grafik!','A new soundtrack and 3D graphics!'],items:[
    ['new','Neuer Soundtrack: 7 Stücke mit echten Instrumenten (E-Piano, Streicher, Blech, Glocken, Kontrabass, Schlagzeug), Hall und Echo – Morgenbäckerei, Fabrik-Groove, Nachtschicht, Großes Abenteuer, Showdown, Sternenaufstieg und Keks-Fest.','New soundtrack: 7 tracks with real instruments (electric piano, strings, brass, bells, upright bass, drums), reverb and echo – Morning Bakery, Factory Groove, Night Shift, Great Adventure, Showdown, Starry Ascension and Cookie Festival.'],
    ['new','Die Musik passt sich an: Sie wird voller bei Combos und Boosts, spielt nachts Jazz und im Kampf den Showdown.','The music adapts: it gets fuller during combos and boosts, plays jazz at night and the Showdown in fights.'],
    ['new','3D-Keks: Der große Keks ist jetzt ein echtes 3D-Modell mit Licht, Schokostücken und knusprigem Rand. Er neigt sich zum Finger und hüpft beim Klicken – in jedem Keks-Design.','3D cookie: the big cookie is now a real 3D model with lighting, chocolate chips and a crispy edge. It tilts toward your finger and bounces when you click – in every cookie design.'],
    ['new','Goldkekse, die Kekse im Hintergrund und alle Symbole haben jetzt einen 3D-Look. Abschalten unter Einstellungen → Anzeige.','Golden cookies, the background cookies and all icons now have a 3D look. Turn it off under Settings → Display.']
  ]},
  {v:54,sum:['Neu: Club-Stufen mit Bonus für alle Mitglieder und ein Feedback-Knopf!','New: club levels with a bonus for every member, and a feedback button!'],items:[
    ['new','Club-Stufen 1–10: Clubs sammeln XP, wenn Mitglieder in einer Woche mitbacken (100) und wenn sie Clubkriege gewinnen (500). Jede Stufe gibt allen Mitgliedern +1 % Produktion und +5 % auf Club-Preise.','Club levels 1–10: clubs earn XP when members bake in a week (100) and when they win club wars (500). Every level gives all members +1% production and +5% on club prizes.'],
    ['new','Feedback senden: Unter Einstellungen → Spiel kannst du Fehler melden oder Ideen schicken.','Send feedback: report bugs or share ideas under Settings → Game.'],
    ['new','Datenschutz-Info auf Deutsch und Englisch, ebenfalls unter Einstellungen → Spiel.','Privacy info in English and German, also under Settings → Game.']
  ]},
  {v:53,sum:['Gesperrt? Jetzt kannst du Einspruch einlegen. Dazu mehr Moderation und Sicherheit.','Banned? You can now appeal. Plus more moderation and security.'],items:[
    ['new','Einspruch gegen eine Sperre: Gesperrte Spieler können direkt im Sperr-Hinweis einmal am Tag um eine Prüfung bitten und sehen die Antwort beim nächsten Anmelden.','Ban appeals: banned players can ask for a review right in the ban notice, once a day, and see the answer the next time they sign in.'],
    ['new','Moderatoren helfen jetzt mit: Sie kümmern sich um Meldungen im Club-Chat.','Moderators now help out: they take care of reports in club chat.'],
    ['change','Mehr Sicherheit für die Server-Werkzeuge mit Zwei-Schritt-Anmeldung.','More security for the server tools with two-step sign-in.'],
    ['change','Auf CrazyGames und GameDistribution kannst du freiwillig eine Werbung ansehen und bekommst 20 Minuten Produktion. Auf der eigenen Seite gibt es keine Werbung.','On CrazyGames and GameDistribution you can choose to watch an ad for 20 minutes of production. The game’s own site has no ads.']
  ]},
  {v:52,sum:['Schneller laden und mehr Schutz vor Regelbrechern.','Faster loading and better protection from rule-breakers.'],items:[
    ['change','Das Spiel ist rund 10 % kleiner und lädt schneller: Die Admin-Werkzeuge stecken nicht mehr im Spiel, und der Admin-Tab ist weg.','The game is about 10% smaller and loads faster: the admin tools are no longer inside the game, and the Admin tab is gone.'],
    ['new','Wer gegen die Regeln verstößt, kann jetzt gesperrt werden. Gesperrte Spieler sehen den Grund und wie lange die Sperre dauert.','Players who break the rules can now be banned. Banned players see the reason and how long the ban lasts.']
  ]},
  {v:51,sum:['Neu: Willkommensgeschenk, Reaktionen und angeheftete Nachrichten im Club-Chat!','New: a welcome-back gift, plus reactions and pinned messages in club chat!'],items:[
    ['new','Willkommensgeschenk: Wer nach 3 oder mehr Tagen zurückkommt, bekommt Edelsteine (bis zu 50) und 30 Minuten Kekse geschenkt.','Welcome-back gift: come back after 3 or more days and get up to 50 gems and 30 minutes of cookies.'],
    ['new','Club-Chat: Reagiere mit 👍 ❤️ 😂 🎉 🍪 auf Nachrichten, wink deinem Club mit 👋 zu, und der Club-Chef kann eine Nachricht oben anheften.','Club chat: react to messages with 👍 ❤️ 😂 🎉 🍪, wave to your club with 👋, and the club leader can pin a message to the top.'],
    ['new','Mit Push-Benachrichtigungen erinnert dich das Spiel nach 3 Tagen Pause an dein Geschenk.','With push notifications on, the game reminds you about your gift after 3 days away.'],
    ['change','Fehler im Spiel werden jetzt automatisch und anonym gemeldet, damit sie schneller behoben werden.','Errors in the game are now reported automatically and anonymously, so they get fixed faster.'],
    ['change','Das Spiel kann jetzt auch auf Spieleseiten wie itch.io laufen.','The game can now also run on game sites like itch.io.']
  ]},
  {v:50,sum:['Push-Benachrichtigungen sind jetzt einfacher und sicherer eingerichtet.','Push notifications are now simpler and safer to set up.'],items:[
    ['change','Push-Benachrichtigungen holen ihren Schlüssel jetzt vom Server. Wenn es beim ersten Mal „wird eingerichtet“ heißt, versuch es eine Minute später nochmal.','Push notifications now get their key from the server. If it says “being set up” the first time, try again a minute later.']
  ]},
  {v:49,sum:['Neu: drei Gebäude fürs späte Spiel, 17 Erfolge und Push-Benachrichtigungen!','New: three late-game buildings, 17 achievements and push notifications!'],items:[
    ['new','Drei neue Gebäude nach dem Urknall-Ofen: Sternbild-Bäckerei, Quanten-Konditorei und Keks-Singularität – mit je 8 Upgrades.','Three new buildings after the Big Bang Oven: Constellation Bakery, Quantum Patisserie and Cookie Singularity – each with 8 upgrades.'],
    ['new','17 neue Erfolge, darunter „Komplette Fabrik“ und Ziele bis 10 Quintilliarden Kekse.','17 new achievements, including “Complete Factory” and goals up to 10 decillion cookies.'],
    ['new','Push-Benachrichtigungen (Einstellungen → Anzeige): Geschenke, Freundschaftsanfragen, Club-Preise, Admin-Nachrichten und Events – auch wenn das Spiel zu ist.','Push notifications (Settings → Display): gifts, friend requests, club prizes, admin messages and events – even when the game is closed.']
  ]},
  {v:48,sum:['Neu: Spielerprofile, Freunde, Clubkriege am Wochenende und Einladungen mit Bonus!','New: player profiles, friends, weekend club wars and invites with a bonus!'],items:[
    ['new','Profile: Tippe in der Bestenliste oder im Club auf einen Namen und sieh dir die Bäckerei an.','Profiles: tap a name in the leaderboard or your club to see that bakery.'],
    ['new','Freunde: Neuer Reiter „Freunde“ bei den Clubs. Sieh, wer online ist, und schick schnell ein Geschenk.','Friends: a new “Friends” tab in clubs. See who’s online and send a gift in one tap.'],
    ['new','Clubkriege: Jedes Wochenende tritt dein Club gegen einen ähnlich starken an. Gewinner: Trophäe und 40 Edelsteine für jedes Mitglied.','Club wars: every weekend your club faces one of similar strength. Winners get a trophy and 40 gems for every member.'],
    ['new','Einladen: Teile das Spiel mit deinem Konto – wer über deinen Link anfängt, bringt euch beiden einen Bonus.','Invites: share the game while signed in – anyone who starts through your link earns you both a bonus.']
  ]},
  {v:47,sum:['Neues, klares Design: ruhiger, flacher und schneller.','A clean new look: calmer, flatter and faster.'],items:[
    ['change','Das ganze Spiel sieht klarer und moderner aus: flache Flächen, feine Kanten und weniger Gedränge.','The whole game looks cleaner and more modern: flat surfaces, fine edges and less clutter.'],
    ['change','Die Kopfzeile zeigt nur noch das Nötigste. Sprache, Hilfe und Teilen findest du in den Einstellungen.','The header shows only what you need. Language, help and sharing are in Settings.'],
    ['change','Speichern ist einfacher: Das Konto steht oben, alles andere unter „Weitere Möglichkeiten“.','Saving is simpler: your account comes first, everything else is under “More options”.'],
    ['change','Höchstens 3 Hinweise auf einmal – der Rest hinter „+“.','At most 3 hints at once – the rest behind “+”.'],
    ['new','Neu in den Einstellungen: Hoher Kontrast für bessere Lesbarkeit.','New in Settings: high contrast for easier reading.'],
    ['change','Schneller, besonders auf älteren Handys: weniger Rechenarbeit pro Sekunde.','Faster, especially on older phones: less work every second.']
  ]},
  {v:46,sum:['Dein Platz in der Bestenliste gehört jetzt zu deinem Konto – auf jedem Gerät.','Your leaderboard spot now belongs to your account – on every device.'],items:[
    ['new','Mit Konto nimmst du deinen Platz in der Bestenliste auf jedes Gerät mit. Kein doppelter Eintrag mehr.','With an account your leaderboard spot comes with you to every device. No more duplicate entries.'],
    ['change','Namen in der Bestenliste gibt es jetzt nur einmal.','Each leaderboard name can now only be used once.'],
    ['change','Mehr Sicherheit für deinen Fortschritt: Der Server macht jede Woche automatisch ein Backup.','More safety for your progress: the server now makes an automatic backup every week.']
  ]},
  {v:45,sum:['Mehr Sicherheit: Melde-Knopf im Club-Chat, Wortfilter und „Andere Geräte abmelden“.','More security: a report button in club chat, a word filter and “Sign out other devices”.'],items:[
    ['new','Melde unfreundliche Nachrichten im Club-Chat mit ⚑. Der Admin sieht jede Meldung.','Report unkind club chat messages with ⚑. The admin sees every report.'],
    ['new','Konto: „Andere Geräte abmelden“. Wenn du dein Passwort änderst, werden andere Geräte automatisch abgemeldet.','Account: “Sign out other devices”. Changing your password signs out other devices automatically.'],
    ['new','Nachrichten und Geschenke vom Admin kommen direkt in dein Spiel.','Messages and gifts from the admin arrive right in your game.'],
    ['new','Bestenliste: Die Ruhmeshalle zeigt die Gewinner früherer Saisons.','Leaderboard: the hall of fame shows the winners of past seasons.'],
    ['change','Ein Wortfilter blockiert unfreundliche Wörter in Namen, Clubs und im Chat.','A word filter blocks rude words in names, clubs and chat.'],
    ['change','Geschenke senden geht ab einem Tag Kontoalter und 1 Million gebackenen Keksen. Das schützt vor Fake-Konten.','Sending gifts needs an account that is a day old and 1 million cookies baked. This stops fake accounts.'],
    ['change','Besserer Schutz: Limits pro Gerät, strengere Grenze für Punkte-Sprünge und eine Sicherheitsregel für die Webseite.','Better protection: per-device limits, a stricter limit on score jumps and a security rule for the website.']
  ]},
  {v:44,sum:['Neu: Bäckerei-Clubs und Geschenke! Backt gemeinsam und gewinnt Wochenpreise.','New: Bakery clubs and gifts! Bake together and win weekly prizes.'],items:[
    ['new','Bäckerei-Clubs (Tab Ziele): Gründe einen Club oder tritt einem bei. Bis zu 30 Mitglieder, mit Club-Chat.','Bakery clubs (Goals tab): Start a club or join one. Up to 30 members, with a club chat.'],
    ['new','Die 3 Clubs, die in einer Woche die meisten Kekse backen, gewinnen Edelsteine und Kekse – für jedes Mitglied, das mitgebacken hat.','The 3 clubs that bake the most cookies in a week win gems and cookies – for every member who helped.'],
    ['new','Geschenke: Schicke anderen Spielern Edelsteine oder Sternenkrümel. Sie bekommen sie beim nächsten Spielen.','Gifts: Send gems or star crumbs to other players. They get them the next time they play.'],
    ['new','Clubs und Geschenke brauchen ein Konto (Einstellungen → Speichern).','Clubs and gifts need an account (Settings → Saving).']
  ]},
  {v:43,sum:['Neu: Konten! Spiele mit deinem Benutzernamen auf jedem Gerät weiter.','New: Accounts! Keep playing with your username on every device.'],items:[
    ['new','Erstelle unter Einstellungen → Speichern ein Konto mit Benutzername und Passwort (keine E-Mail nötig). Deine Bäckerei wird automatisch im Konto gespeichert.','Create an account under Settings → Saving with a username and password (no email needed). Your bakery is saved to your account automatically.'],
    ['new','Melde dich auf einem anderen Gerät an und spiel dieselbe Bäckerei weiter. Gibt es zwei Spielstände, entscheidest du, welcher bleibt.','Sign in on another device and keep playing the same bakery. If there are two saves, you choose which one to keep.'],
    ['new','Du kannst dein Passwort ändern und dein Konto jederzeit löschen.','You can change your password and delete your account at any time.']
  ]},
  {v:42,sum:['Neu: Online-Ankündigungen, globale Events, ein Live-Zähler und Spielstände per Code aufs andere Gerät.','New: Online announcements, global events, a live counter and moving your save to another device with a code.'],items:[
    ['new','Globale Events: Manchmal gibt es für alle gleichzeitig z. B. doppelte Produktion. Ein Banner unter dem Keks zeigt, wie lange noch.','Global events: Sometimes everyone gets a boost at once, like double production. A banner under the cookie shows how long it lasts.'],
    ['new','Ankündigungen: Neuigkeiten von der Keksfabrik erscheinen beim Start.','Announcements: News from Cookie Factory appears when you open the game.'],
    ['new','Live-Zähler: Auf dem Startbildschirm und in der Bestenliste siehst du, wie viele Bäckereien gerade online sind und wie viele Kekse alle zusammen gebacken haben.','Live counter: The start screen and leaderboard show how many bakeries are online and how many cookies everyone has baked together.'],
    ['new','Auf ein anderes Gerät mitnehmen: Unter Einstellungen → Speichern bekommst du einen Code (24 Stunden gültig) und gibst ihn auf dem anderen Gerät ein.','Move to another device: Under Settings → Saving you get a code (valid for 24 hours) and enter it on your other device.'],
    ['new','Neue Codes kommen jetzt auch direkt vom Server. Halte die Augen offen!','New codes now also come straight from the server. Keep your eyes open!']
  ]},
  {v:41,sum:['Aufträge sind jetzt dynamisch und fairer, besonders nach einem Aufstieg.','Orders are now dynamic and fairer, especially after ascending.'],items:[
    ['change','Belohnungen wachsen mit deiner Runde: höchstens 2 % / 4 % / 6 % der Kekse, die du in dieser Runde gebacken hast (leicht / mittel / schwer). Direkt nach einem Aufstieg geben Aufträge also weniger, später mehr.','Rewards grow with your run: at most 2% / 4% / 6% of the cookies baked this run (easy / medium / hard). Right after ascending orders give less, later more.'],
    ['change','Klick- und Kaufaufträge passen sich an: Wer schnell klickt oder viele Gebäude hat, bekommt größere Aufgaben.','Click and buy orders adapt: if you click fast or own many buildings, you get bigger tasks.'],
    ['change','Viele Aufträge kurz hintereinander machen die Kunden „beschäftigt“: Die Belohnung sinkt eine Weile und erholt sich in ein paar Minuten.','Many orders in a row make customers “busy”: rewards drop for a while and recover within a few minutes.'],
    ['change','Ruf gibt jetzt bis zu +15 % Produktion (vorher +25 %). Beim Aufstieg werden offene Aufträge neu gewürfelt.','Reputation now gives up to +15% production (was +25%). Open orders are re-rolled when you ascend.']
  ]},
  {v:40,sum:['Neu: Wochen- und Monatspreise in der Bestenliste, schnellere Updates und ein neuer Look für Welt und Shop.','New: Weekly and monthly leaderboard prizes, faster updates, and a fresh look for World and Shop.'],items:[
    ['new','Bestenliste: Neue Reiter „Diese Woche“ und „Dieser Monat“. Gezählt werden die Kekse, die du in dem Zeitraum backst. Die Top 3 bekommen Edelsteine, Sternenkrümel und Kekse.','Leaderboard: New “This week” and “This month” tabs. They count the cookies you bake during that period. The top 3 win gems, star crumbs and cookies.'],
    ['change','Die Bestenliste ist jetzt viel schneller aktuell: Dein Punktestand wird jede Minute gesendet, die offene Liste aktualisiert sich alle 30 Sekunden.','The leaderboard is much faster now: your score is sent every minute and the open board refreshes every 30 seconds.'],
    ['new','Shop: Eine Leiste oben springt direkt zu Sternen, Karten, Boosts, Keksbox, Gegenständen und Designs. Jeder Bereich ist jetzt eine eigene Karte.','Shop: A bar at the top jumps straight to stars, cards, boosts, cookie box, items and designs. Every section is now its own card.'],
    ['change','Welt: Modernere Karte, Material-Chips und Ortsfenster mit sanftem Übergang.','World: A more modern map, material chips and place panels with a smooth transition.']
  ]},
  {v:39,sum:['Neu: Ein Layout für jedes Gerät, dazu ein ruhigeres Design und flüssigere Animationen.','New: A layout for every device, plus a cleaner look and smoother animations.'],items:[
    ['new','Das Spiel erkennt, ob du am Handy, Tablet oder Computer spielst, und passt sich an. Am Handy quer stehen Keks und Laden nebeneinander, am Tablet in zwei Spalten, am Computer breiter.','The game detects whether you play on a phone, tablet or computer and adapts. On a phone held sideways the cookie and shop sit side by side, tablets get two columns, and computers a wider layout.'],
    ['new','Unter Einstellungen → Anzeige siehst du das erkannte Gerät und kannst das Layout selbst wählen.','Under Settings → Display you can see the detected device and pick the layout yourself.'],
    ['change','Ruhigeres Design und flüssigere Animationen: sanfter Start, weiche Reiterwechsel, federnde Knöpfe. Hover-Effekte gibt es nur noch mit der Maus.','Cleaner look and smoother animations: a gentle start, soft tab changes and springy buttons. Hover effects now only appear with a mouse.']
  ]},
  {v:38,sum:['Updates kommen jetzt sofort an.','Updates now arrive right away.'],items:[
    ['new','Wenn es eine neue Version gibt, erscheint oben ein Hinweis. Ein Tipp auf „Jetzt aktualisieren“ lädt sie, dein Spielstand wird vorher gespeichert.','When a new version is out, a notice appears at the top. Tap “Update now” to load it. Your game is saved first.'],
    ['change','Das Spiel holt sich beim Öffnen immer die neueste Version, statt bis zu 10 Minuten eine alte zu zeigen.','The game always loads the newest version when you open it, instead of showing an old one for up to 10 minutes.']
  ]},
  {v:37,sum:['Neu: Bestenliste oben als Pokal und ein Schutz gegen Schummeln.','New: Leaderboard as a trophy at the top and protection against cheating.'],items:[
    ['new','Oben gibt es jetzt einen Pokal. Er öffnet die Bestenliste und zeigt deinen Platz.','There is now a trophy at the top. It opens the leaderboard and shows your rank.'],
    ['new','Spielstände sind jetzt versiegelt. Wer seinen Spielstand außerhalb des Spiels ändert (Browser-Werkzeuge, bearbeitete Dateien oder Texte), kann nicht mehr in die Bestenliste.','Saves are now sealed. If a save is changed outside the game (browser tools, edited files or text), it can no longer join the leaderboard.'],
    ['change','Die Bestenliste lehnt Punkte ab, die schneller wachsen, als das Spiel es erlaubt.','The leaderboard rejects scores that grow faster than the game allows.']
  ]},
  {v:36,sum:['Neu: Die Bestenliste ist da!','New: The leaderboard is live!'],items:[
    ['new','Bestenliste im Tab Ziele: Mach mit deinem Bäckerei-Namen mit und vergleiche deine gebackenen Kekse mit allen anderen. Die Top 3 bekommen Gold, Silber und Bronze.','Leaderboard in the Goals tab: Join with your bakery name and compare your cookies baked with everyone else. The top 3 get gold, silver and bronze.'],
    ['new','Dein Platz steht direkt im Tab Ziele. Du kannst die Bestenliste jederzeit wieder verlassen.','Your rank shows right in the Goals tab. You can leave the leaderboard at any time.']
  ]},
  {v:35,sum:['Bald: Eine Bestenliste für alle Bäckereien.','Coming soon: a leaderboard for every bakery.'],items:[
    ['new','Die Bestenliste ist fertig gebaut und wird bald eingeschaltet. Dann findest du sie im Tab Ziele und kannst mit deinem Bäckerei-Namen mitmachen.','The leaderboard is built and will be switched on soon. You’ll find it in the Goals tab and can join with your bakery name.'],
    ['change','Spielstände, in denen das Admin-Panel benutzt wurde, können nicht in die Bestenliste. So bleibt sie fair.','Saves that used the admin panel can’t join the leaderboard. This keeps it fair.']
  ]},
  {v:34,sum:['Neu: Geheime Codes, Spielstand als Datei, die Keksfabrik als App und ein Teilen-Knopf.','New: Secret codes, save files, Cookie Factory as an app and a share button.'],items:[
    ['new','Codes: Gib unter Einstellungen → Spiel einen geheimen Code ein und hol dir eine Belohnung. Jeder Code geht einmal pro Spielstand.','Codes: Enter a secret code under Settings → Game to get a reward. Each code works once per save.'],
    ['new','Spielstand als Datei: Unter Einstellungen → Speichern kannst du deinen Spielstand herunterladen und auf einem anderen Gerät wieder laden.','Save files: Under Settings → Saving you can download your save and load it again on another device.'],
    ['new','Als App installieren: Die Keksfabrik läuft jetzt wie eine App auf dem Startbildschirm, auch ohne Internet.','Install as an app: Cookie Factory now runs like an app from your home screen, even without internet.'],
    ['new','Teilen-Knopf oben: Zeig deinen Freunden, wie viele Kekse deine Bäckerei schon gebacken hat.','Share button at the top: Show your friends how many cookies your bakery has baked.']
  ]},
  {v:33,sum:['Neu: Namen für Spielstände und ein Passwort für das Admin-Panel.','New: Names for save files and a password for the admin panel.'],items:[
    ['new','Spielstände haben jetzt Namen. Beim ersten Start, bei „Neu starten“ und bei „Neues Spiel“ gibst du einen Namen ein.','Save files now have names. You enter one on first launch, with “Start new” and with “New game”.'],
    ['new','Der Name steht oben neben dem Titel. Ändern kannst du ihn in den Einstellungen unter Spielstände.','The name shows at the top next to the title. You can change it in the settings under Save slots.'],
    ['change','Das Admin-Panel ist jetzt mit einem Passwort geschützt.','The admin panel is now protected by a password.']
  ]},
  {v:32,sum:['Neuer Look für Aufträge, Welt, Abenteuer und Filialen. Dazu Kauf-Effekte und bessere Tipps für den Start.','New look for Orders, World, Adventure and Stores. Plus purchase effects and better tips for the start.'],items:[
    ['new','Aufträge: Auftragsbrett-Banner mit Ruf, Bonus und Anzahl als Chips. Jede Karte hat einen Farbstreifen für die Schwierigkeit.','Orders: order board banner with reputation, bonus and count as chips. Each card has a colour stripe for its difficulty.'],
    ['new','Welt: Materialien als Leiste, jeder Bereich als eigene Karte. Der Held hat ein Banner mit Stufen-Abzeichen, Filialen zeigen ihre Zahlen als Chips.','World: materials as a bar, each section as its own card. The hero gets a banner with a level badge, stores show their numbers as chips.'],
    ['new','Kauf-Effekte: Gebäude-Symbole hüpfen mit Funken und Glanz. Bei jedem 10. Gebäude gibt es einen größeren Effekt. Upgrades fliegen mit Funken davon.','Purchase effects: building icons bounce with sparks and a shine. Every 10th building gives a bigger effect. Upgrades fly away with sparks.'],
    ['new','Start: Eine Sprechblase unter dem Keks erklärt die ersten Minuten Schritt für Schritt. Erste Schritte sagen jetzt auch, warum etwas hilft.','Start: a speech bubble under the cookie explains the first minutes step by step. First steps now also say why something helps.']
  ]},
  {v:31,sum:['Balance: Das Spiel ist jetzt etwas schwerer.','Balance: The game is now a bit harder.'],items:[
    ['change','Starke Boni gedämpft: Platin-Erfolge +15 % statt ×1,25, Sammelkarten +0,5 % je Stern und kleinere Set-Boni, Keks-Qualität +4 % je Stufe (Meisterwerk ×1,5), Kosmos-Splitter +30 %, Rezeptseiten +15 %.','Strong bonuses toned down: platinum achievements +15% instead of ×1.25, cards +0.5% per star and smaller set bonuses, cookie quality +4% per level (masterpiece ×1.5), cosmic shards +30%, recipe pages +15%.'],
    ['change','Aufstieg: Der erste Himmelschip kommt ab 8 Mrd Keksen (etwa halb so viele Chips). Goldkekse kommen alle 5–11 Minuten.','Ascension: the first heavenly chip comes at 8 billion cookies (about half as many chips). Golden cookies come every 5–11 minutes.'],
    ['change','Offline-Ertrag am Anfang 35 % statt 50 %. Startschub nur noch 5 Minuten.','Offline income starts at 35% instead of 50%. Head start lasts only 5 minutes.'],
    ['change','Gold-Pass 180 Edelsteine, Gebäude-Evolution teurer, Paragon-Stufen wachsen schneller, neues Helfer-Budget startet bei 25 %.','Gold pass 180 gems, building evolution more expensive, paragon levels grow faster, new helper budget starts at 25%.']
  ]},
  {v:30,sum:['Neu: Saison-Pass wie in Online-Spielen und ein aufgeräumter Ziele-Tab.','New: Season pass like in online games and a tidier Goals tab.'],items:[
    ['new','Saison-Pass: Stufen-Leiste zum Wischen mit Gratis- und Gold-Reihe, Banner mit Stufe, Saison-Name und Countdown, Bonus-Truhen nach Stufe 30.','Season pass: swipeable tier track with free and gold row, banner with tier, season name and countdown, bonus chests after tier 30.'],
    ['new','Gold-Pass für 180 Edelsteine pro Saison: extra Edelsteine, Artefakt-Splitter, Kartenpäckchen und Sternenkrümel.','Gold pass for 180 gems per season: extra gems, artifact shards, card packs and star crumbs.'],
    ['change','Ziele-Tab: Übersicht oben mit „Alles abholen“, Bereiche als Symbol-Kacheln mit roten Punkten und Erfolge mit Filter.','Goals tab: overview at the top with “Claim all”, sections as icon tiles with red dots and achievements with a filter.']
  ]},
  {v:29,sum:['Neu: Sammelkarten und Keks-Qualität.','New: Trading cards and cookie quality.'],items:[
    ['new','Sammelkarten (Tab Shop): Päckchen öffnen, 24 Karten in 4 Sets sammeln, Karten bis 5 Sterne verbessern. Volle Sets und Gold-Sets geben große Boni.','Trading cards (Shop tab): open packs, collect 24 cards in 4 sets, level cards up to 5 stars. Full sets and gold sets give big bonuses.'],
    ['new','Keks-Qualität (Tab Bauen): Bessere Zutaten kaufen – Mehl, Butter, Zucker und Schokolade. 6 Qualitätsstufen von Einfach bis Meisterwerk.','Cookie quality (Build tab): buy better ingredients – flour, butter, sugar and chocolate. 6 quality grades from plain to masterpiece.'],
    ['new','Einstellungen: Bildschirm-Wackeln an oder aus.','Settings: screen shake on or off.']
  ]},
  {v:28,sum:['Neu: Mehr Paragon, Ränge, Rezepte, ein größerer Baum und der Betriebsleiter.','New: More paragon, ranks, recipes, a bigger tree and the operations manager.'],items:[
    ['new','Paragon: 10 neue Bereiche, z. B. Offline-Ertrag, Goldkeks-Häufigkeit, Edelsteine, Heldenkraft, Helfer-Erfahrung und Combo.','Paragon: 10 new areas, e.g. offline income, golden cookie frequency, gems, hero power, helper experience and combo.'],
    ['new','5 neue Ränge: Mythisch, Kosmisch, Göttlich, Ewig und Unendlich – mit neuen leuchtenden Rahmen.','5 new ranks: Mythic, Cosmic, Divine, Eternal and Infinite – with new glowing frames.'],
    ['new','Wiedergeburt: 10 neue Rezepte im Rezeptbuch.','Rebirth: 10 new recipes in the recipe book.'],
    ['new','Himmlischer Baum: 28 neue Knoten am Ende der Äste.','Heavenly tree: 28 new nodes at the end of the branches.'],
    ['new','Neuer Helfer „Betriebsleiter“: nimmt jeden Auftrag an, hilft dabei und kauft Upgrades in deinem Budget.','New helper “Operations Manager”: accepts every order, helps with it and buys upgrades within your budget.']
  ]},
  {v:27,sum:['Großer Umbau: Startbildschirm, Hilfe, neue Gebäude-Bilder und mehr.','Big rework: start screen, help, new building pictures and more.'],items:[
    ['new','Startbildschirm mit „Weiterspielen“, Spielständen und Einstellungen. Kann in den Einstellungen ausgeschaltet werden.','Start screen with “Continue”, save slots and settings. Can be turned off in the settings.'],
    ['new','Hilfe (Knopf „?“): Jedes System kurz in einfacher Sprache erklärt. Neue Systeme erklären sich beim Freischalten selbst.','Help (“?” button): every system explained briefly in simple words. New systems explain themselves when they unlock.'],
    ['new','Währungs-Leiste oben: Tippe auf eine Währung, um zu sehen, wofür sie ist.','Currency bar at the top: tap a currency to see what it is for.'],
    ['change','Der Tab Aufstieg hat jetzt Bereiche: Aufstieg, Baum, Wiedergeburt, Kosmisch, Paragon und Rang.','The Ascension tab now has sections: ascend, tree, rebirth, cosmic, paragon and rank.'],
    ['change','Upgrades „Kompakt“: Nur das nächste Upgrade jeder Reihe wird gezeigt. Die Zahl +N zeigt, wie viele noch folgen.','Upgrades “Compact”: only the next upgrade of each series is shown. The +N number shows how many more follow.'],
    ['new','Alle 20 Gebäude neu gezeichnet und schönere Klick-Effekte mit Krümeln, Funken und Ringen.','All 20 buildings redrawn and nicer click effects with crumbs, sparks and rings.'],
    ['change','„Willkommen zurück“ zeigt jetzt mehr: was passiert ist und was jetzt bereit ist – mit Knöpfen zum direkt Hinspringen.','“Welcome back” now shows more: what happened and what is ready now – with buttons to jump right there.']
  ]},
  {v:26,sum:['Neu: 8 Endgame-Systeme und ein neues Admin-Panel.','New: 8 endgame systems and a new admin panel.'],items:[
    ['new','Kosmischer Aufstieg (Tab Aufstieg): die 3. Prestige-Stufe mit Kosmos-Splittern und 10 kosmischen Kräften.','Cosmic ascension (Ascension tab): the 3rd prestige layer with cosmic shards and 10 cosmic powers.'],
    ['new','Paragon-Stufen: unendliche Stufen mit Punkten für Produktion, Klicks, Goldkekse und Preise.','Paragon levels: endless levels with points for production, clicks, golden cookies and prices.'],
    ['new','Gebäude-Evolution (Tab Bauen): Ab 500 Stück wird ein Gebäude golden und produziert ×10.','Building evolution (Build tab): From 500 owned a building turns golden and produces ×10.'],
    ['new','Prestige-Ränge von Bronze bis Legende mit Rahmen um den Keks.','Prestige ranks from bronze to legend with a frame around the cookie.'],
    ['new','Artefakt-Schmiede (Tab Shop) und Automatik-Zentrale (Tab Helfer).','Artifact forge (Shop tab) and automation center (Helpers tab).'],
    ['new','4 mythische Gegenstände und 10 Platin-Erfolge (je Produktion ×1,25).','4 mythic items and 10 platinum achievements (production ×1.25 each).'],
    ['new','Admin-Panel neu: Bereiche, Suche, Live-Werte, Spieltempo, Auto-Klicker, Endgame-Werkzeuge und Fehler-Scanner.','New admin panel: sections, search, live values, game speed, auto clicker, endgame tools and error scanner.']
  ]},
  {v:25,sum:['Neu: Komplett neues Aussehen im Handyspiel-Stil.','New: A completely new look in mobile game style.'],items:[
    ['new','Neues Design: bunte Karten, 3D-Knöpfe zum Drücken, runde Schrift und Reiter mit Symbolen.','New design: colorful cards, 3D buttons you can press, a round font and tabs with icons.'],
    ['new','Auf dem Handy sind die Reiter jetzt unten wie in einem Handyspiel.','On phones the tabs are now at the bottom like in a mobile game.'],
    ['new','Viele Animationen: Strahlen hinter dem Keks, hüpfende Reiter, Balken mit Streifen und eine flüssig zählende Keks-Zahl.','Lots of animations: rays behind the cookie, bouncing tabs, striped bars and a smoothly counting cookie number.'],
    ['change','Animationen laufen jetzt auch, wenn dein Gerät „weniger Bewegung“ eingestellt hat. Du kannst sie unter Einstellungen → Anzeige → Animationen ändern.','Animations now also run if your device is set to “reduce motion”. You can change this under Settings → Display → Animations.']
  ]},
  {v:24,sum:['Neu: Glücksrad, Titel & Abzeichen und Meldungen ein/aus.','New: Lucky wheel, titles & badges and notifications on/off.'],items:[
    ['new','Glücksrad (Tab Ziele): Einmal am Tag gratis drehen, danach bis zu 3-mal mit Edelsteinen. Mit Jackpot!','Lucky wheel (Goals tab): Spin for free once a day, then up to 3 times with gems. With a jackpot!'],
    ['new','Titel & Abzeichen (Tab Ziele): 18 Titel zum Freischalten und 9 Abzeichen in Bronze, Silber und Gold. Jede Abzeichen-Stufe gibt +1 % Produktion.','Titles & badges (Goals tab): 18 titles to unlock and 9 badges in bronze, silver and gold. Every badge tier gives +1% production.'],
    ['new','Dein Titel steht oben neben dem Namen.','Your title is shown at the top next to the name.'],
    ['new','Einstellungen: Meldungen an, nur wichtige oder aus.','Settings: Notifications on, important only or off.']
  ]},
  {v:23,sum:['Neu: 5 Musikstücke und Töne für alle Knöpfe und Tabs.','New: 5 music tracks and sounds for all buttons and tabs.'],items:[
    ['new','Musik: 5 neue Stücke (Backstube, Markt, Sternennacht, Abenteuer, Keks-Fest). Auf Wunsch wechselt die Musik passend zum Tab.','Music: 5 new tracks (Bakery, Market, Starry Night, Adventure, Cookie Festival). If you want, the music changes with the tab.'],
    ['new','Töne: Jeder Tab, Knopf, Schalter und jedes Fenster hat jetzt einen eigenen Ton. Auch Klicks, Käufe und Goldkekse klingen besser.','Sounds: Every tab, button, switch and window now has its own sound. Clicks, buys and golden cookies also sound better.'],
    ['new','In den Einstellungen unter Ton kannst du das Musikstück wählen und Knopf-Töne extra ausschalten.','In the settings under Sound you can pick the track and turn off button sounds separately.']
  ]},
  {v:22,sum:['Neu: Viele neue Einstellungen und ein aufgeräumtes Einstellungs-Fenster.','New: Lots of new settings and a tidier settings window.'],items:[
    ['new','Einstellungen haben jetzt Bereiche (Anzeige, Ton, Spiel, Speichern) und eine Suche.','Settings now have sections (Display, Sound, Game, Saving) and a search.'],
    ['new','Anzeige: Zahlenformat, Schriftgröße, Akzentfarbe, Kekse im Browser-Tab und ein Spar-Modus.','Display: Number format, text size, accent color, cookies in the browser tab and a saver mode.'],
    ['new','Ton: Töne einzeln an oder aus, ruhige Hintergrundmusik und stumm, wenn ein anderer Tab offen ist.','Sound: Turn single sounds on or off, calm background music and mute when another tab is open.'],
    ['new','Spiel: Sicherheitsfragen an oder aus, Autosave-Zeit wählen und Einstellungen zurücksetzen.','Game: Safety questions on or off, choose the autosave time and reset settings.']
  ]},
  {v:21,sum:['Neu: Fast 100 neue Upgrades und ein besserer Upgrades-Tab.','New: Almost 100 new upgrades and a better Upgrades tab.'],items:[
    ['new','Upgrades: 30 neue Kekssorten, 20 neue Synergien, mehr Klick-Kraft und eine Combo bis ×5.','Upgrades: 30 new cookie types, 20 new synergies, more click power and a combo up to ×5.'],
    ['new','Goldkekse: 3 neue Effekte (Gebäude-Rausch, Keks-Regen, Glücks-Geschenk) zum Freischalten.','Golden cookies: 3 new effects (building rush, cookie rain, lucky gift) to unlock.'],
    ['new','System-Upgrades: Eigene Upgrades für Welt, Held, Filialen und Helfer.','System upgrades: Own upgrades for world, hero, stores and helpers.'],
    ['new','Spezial: Glänzende Mega-Upgrades, stärkeres Wetter und neue Meilensteine bis 1000 Gebäude.','Special: Shiny mega upgrades, stronger weather and new milestones up to 1000 buildings.'],
    ['new','Upgrades-Tab: Filter nach Art, Sortieren nach Preis oder Nutzen, Nutzen-Vorschau in Kekse pro Sekunde und eine Liste der gekauften Upgrades.','Upgrades tab: Filter by type, sort by price or value, value preview in cookies per second and a list of bought upgrades.']
  ]},
  {v:20,sum:['Neu: Weltkarte, Besucher, Sammelbuch, Helfer mit Gesichtern, mehr Animationen und ein Melde-Fenster.','New: World map, visitors, collection book, helpers with faces, more animations and a notification window.'],items:[
    ['new','Weltkarte: Der Tab Welt ist jetzt eine Karte. Tippe auf einen Ort (Monsterhöhle, Zauberturm, Garten, Hafen, Burg, Stadt …), um ihn zu öffnen.','World map: The World tab is now a map. Tap a place (Monster Cave, Wizard Tower, Garden, Harbor, Castle, Town …) to open it.'],
    ['new','Besucher: Ab und zu klopft jemand an, z. B. eine Händlerin oder eine Hexe, und du entscheidest, was passiert.','Visitors: Now and then someone knocks, e.g. a trader or a witch, and you decide what happens.'],
    ['new','Sammelbuch: Im Tab Ziele siehst du alles, was du gefunden hast. Volle Seiten geben Produktion.','Collection: In the Goals tab you see everything you have found. Full pages give production.'],
    ['new','Helfer: Jeder Helfer hat jetzt Name, Gesicht und eine Eigenschaft. Vor dem Anstellen kannst du einen anderen Bewerber wählen.','Helpers: Every helper now has a name, a face and a trait. Before hiring you can pick another applicant.'],
    ['new','Melde-Fenster: Die Glocke neben DE/EN zeigt alle letzten Meldungen.','Notification window: The bell next to DE/EN shows all recent notifications.'],
    ['new','Mehr Animationen: Konfetti bei Stufenaufstiegen, Meilensteinen und Bossen, und der Bildschirm wackelt bei großen Siegen.','More animations: Confetti on level ups, milestones and bosses, and the screen shakes on big wins.']
  ]},
  {v:19,sum:['Neu: Saison-Pass, Tag & Nacht mit Wetter, Held-Fähigkeiten, Schmiede, Fabrik-Ansicht, Keks-Designer, geheime Erfolge und 3 Spielstände.','New: Season pass, day & night with weather, hero skills, forge, factory view, cookie designer, secret achievements and 3 save slots.'],items:[
    ['new','Saison-Pass: Im Tab Ziele sammelst du Pass-Punkte und schaltest 30 Stufen frei, mit Sternenkrümeln und besonderen Keks-Designs.','Season pass: In the Goals tab you collect pass points and unlock 30 tiers, with star crumbs and special cookie designs.'],
    ['new','Tag & Nacht + Wetter: Tageszeit und Wetter wechseln und geben kleine Boni. Tippe auf den blauen Hinweis unter dem Keks.','Day & night + weather: Time of day and weather change and give small bonuses. Tap the blue chip below the cookie.'],
    ['new','Held: 6 Fähigkeiten, Begleiter kämpfen mit, und in der Schmiede baust und veredelst du Ausrüstung.','Hero: 6 skills, companions fight along, and in the forge you build and refine gear.'],
    ['new','Fabrik-Ansicht: Im Tab Bauen siehst du deine Gebäude arbeiten.','Factory view: In the Build tab you can watch your buildings work.'],
    ['new','Keks-Designer: Im Shop gestaltest du deinen eigenen Keks.','Cookie designer: In the shop you design your own cookie.'],
    ['new','Geheime Erfolge und 3 Spielstände (in den Einstellungen).','Secret achievements and 3 save slots (in the settings).']
  ]},
  {v:18,sum:['Neu: Ein eigener Tab für Helfer, Helfer steigen durch Arbeit auf, 4 neue Helfer und feste Preise.','New: Its own tab for helpers, helpers level up by working, 4 new helpers and fixed prices.'],items:[
    ['new','Tab Helfer: Alle Helfer, die Spar-Grenze und ein Arbeits-Protokoll sind jetzt in einem eigenen Tab.','Helpers tab: All helpers, the spending limit and a work log are now in their own tab.'],
    ['new','Erfahrung: Helfer sammeln XP durch ihre Arbeit und steigen bis Stufe 10 auf. Stufe 3 und 6 geben einen Bonus, Stufe 10 macht sie zu Meistern (+5 % Produktion).','Experience: Helpers gain XP by working and level up to 10. Levels 3 and 6 give a bonus, level 10 makes them masters (+5% production).'],
    ['new','Neue Helfer: Bauleiter (ersetzt Auto-Kauf), Forscher, Abenteurer und Lieferant.','New helpers: Site Manager (replaces auto buy), Researcher, Adventurer and Supplier.'],
    ['change','Preise: Boosts, Welt-Boosts und Filialen haben feste Preise. Stärkere Boosts und bessere Städte kosten mehr.','Prices: Boosts, world boosts and stores have fixed prices. Stronger boosts and better cities cost more.']
  ]},
  {v:17,sum:['Neu: Der Himmlische Baum ist eine große Sternenkarte mit 90 Knoten, und Preise starten jetzt bei 10.','New: The heavenly tree is a big star map with 90 nodes, and prices now start at 10.'],items:[
    ['new','Sternenkarte: Der Himmlische Baum hat 8 Spiralarme (Produktion, Gold, Klicks, Gebäude, Wirtschaft, Offline, Boosts, Himmelschips). Ziehen zum Verschieben, Mausrad oder +/− zum Zoomen.','Star map: The heavenly tree has 8 spiral arms (production, gold, clicks, buildings, economy, offline, boosts, heavenly chips). Drag to move, mouse wheel or +/− to zoom.'],
    ['new','Gebäude-Arm: Für jedes der 20 Gebäude gibt es einen Knoten, der seine Produktion verdoppelt.','Building arm: Each of the 20 buildings has a node that doubles its production.'],
    ['change','Preise: Boosts, Keksbox, Pflanzen, Expeditionen, Labor und Filialen kosten am Anfang 10 Kekse und werden nach jedem Kauf doppelt so teuer. Beim Aufstieg gehen Boosts, Box, Pflanzen und Expeditionen zurück auf 10.','Prices: Boosts, cookie box, plants, expeditions, lab and stores start at 10 cookies and double after each purchase. Ascending resets boosts, box, plants and expeditions to 10.'],
    ['change','Börse: Aktien starten bei etwa 10 Keksen und hängen nicht mehr von deiner Produktion ab. Alte Aktien wurden zum Kaufpreis zurückerstattet.','Stocks: Shares start at about 10 cookies and no longer depend on your production. Old shares were refunded at their purchase price.']
  ]},
  {v:16,sum:['Abenteuer und Filialen sind jetzt im Tab Welt.','Adventure and Stores are now in the World tab.'],items:[
    ['change','Tab Welt: Oben im Tab Welt schaltest du zwischen Welt, Abenteuer und Filialen um. Ein Punkt zeigt, wo etwas bereit ist.','World tab: At the top of the World tab you switch between World, Adventure and Stores. A dot shows where something is ready.']
  ]},
  {v:15,sum:['Neu: Abenteuer mit Held und Endlos-Turm, Filialen, 4 neue Gebäude und ein besserer Spielanfang.','New: Adventure with a hero and the Endless Tower, stores, 4 new buildings and a better start.'],items:[
    ['new','Abenteuer: Dein Keks-Held kämpft in 5 Dungeons und im Endlos-Turm, findet Ausrüstung und steigt auf. Er gibt dir Bonus-Produktion.','Adventure: Your cookie hero fights in 5 dungeons and the Endless Tower, finds gear and levels up. He gives you bonus production.'],
    ['new','Filialen: Eröffne Keksläden in 6 österreichischen Städten. Sie verkaufen deine Kekse mit Gewinn, auch offline.','Stores: Open cookie stores in 6 Austrian cities. They sell your cookies for a profit, even offline.'],
    ['new','Gebäude: Sternenschmiede, Schwarzes Loch, Traumbäckerei und Urknall-Ofen.','Buildings: Star Forge, Black Hole, Dream Bakery and Big Bang Oven.'],
    ['new','Endlos-Upgrades: Drei Upgrades im Tab Upgrades, die du immer wieder kaufen kannst.','Endless upgrades: Three upgrades in the Upgrades tab you can buy again and again.'],
    ['new','Spielanfang: Erste Schritte führen dich durchs Spiel, Tabs erscheinen nach und nach, Klick-Combo bis ×3 und ein Startschub ×2 in den ersten 15 Minuten jeder Runde.','Start: First steps guide you through the game, tabs appear one by one, click combo up to ×3 and a ×2 head start in the first 15 minutes of each run.']
  ]},
  {v:14,sum:['Neu: Viele Komfort-Sachen, ein heller Modus und Backups.','New: Lots of quality-of-life features, a light theme and backups.'],items:[
    ['new','Gedrückt halten: Halte ein Gebäude gedrückt, dann kauft es immer weiter.','Hold to buy: Hold a building and it keeps buying.'],
    ['new','Kaufbar in: Bei Gebäuden und Upgrades steht, wie lange du noch sparen musst. Gebäude zeigen auch ihre Rückzahlzeit.','Affordable in: Buildings and upgrades show how long you still need to save. Buildings also show their payback time.'],
    ['new','Hinweis-Leiste: Über den Tabs siehst du, was gerade bereit ist. Ein Klick bringt dich hin. „Alles abholen“ holt alle Belohnungen auf einmal.','Hint bar: Above the tabs you see what is ready right now. One click takes you there. “Claim all” collects all rewards at once.'],
    ['new','Rückgängig: Einen Kauf kannst du 5 Sekunden lang zurücknehmen (auch mit Strg+Z).','Undo: You can take back a purchase for 5 seconds (also with Ctrl+Z).'],
    ['new','Aussehen: Heller Modus und Kompakt-Ansicht in den Einstellungen.','Look: Light theme and compact view in the settings.'],
    ['new','Backups: Die letzten 3 Spielstände werden automatisch gesichert und lassen sich in den Einstellungen wiederherstellen.','Backups: The last 3 saves are stored automatically and can be restored in the settings.']
  ]},
  {v:13,sum:['Neu: Tagesaufgaben, Login-Serie, Helfer-Stufen, Meilensteine, Wiedergeburt, Statistik und Töne.','New: Daily tasks, login streak, helper levels, milestones, rebirth, statistics and sounds.'],items:[
    ['new','Ziele: Der Tab heißt jetzt Ziele. Dort findest du Tagesaufgaben, die Login-Serie, deine Erfolge und eine Statistik mit Verlauf.','Goals: The tab is now called Goals. It has daily tasks, the login streak, your achievements and statistics with a chart.'],
    ['new','Helfer: 3 neue Helfer (Zauberlehrling, Monsterjäger, Börsenmakler). Alle Helfer lassen sich bis Stufe 3 verbessern. Einige arbeiten jetzt auch, wenn das Spiel zu ist.','Helpers: 3 new helpers (Apprentice Mage, Monster Hunter, Stock Broker). All helpers can be improved up to level 3. Some now also work while the game is closed.'],
    ['new','Meilensteine: Bei 25, 50, 100 … 500 Stück eines Gebäudes produziert es 15 % mehr und bekommt einen farbigen Rahmen.','Milestones: At 25, 50, 100 … 500 of a building it produces 15% more and gets a colored frame.'],
    ['new','Wiedergeburt: Die zweite Prestige-Stufe im Tab Aufstieg, mit Rezeptseiten und einem Rezeptbuch.','Rebirth: The second prestige layer in the Ascension tab, with recipe pages and a recipe book.'],
    ['new','Willkommen zurück: Nach einer Pause zeigt ein Fenster, was passiert ist.','Welcome back: After a break a window shows what happened.'],
    ['new','Töne: Leise Töne für Klicks, Käufe und Goldkekse. In den Einstellungen kannst du sie ausschalten.','Sounds: Quiet sounds for clicks, purchases and golden cookies. You can switch them off in the settings.']
  ]},
  {v:12,sum:['Neu: Komfort-Knöpfe und Helfer, die für dich arbeiten.','New: Quality-of-life buttons and helpers that work for you.'],items:[
    ['new','Bauen: „Bester Kauf“ kauft das Gebäude mit der schnellsten Rückzahlung. „Auto-Kauf“ macht das von selbst.','Build: “Best buy” buys the building that pays back fastest. “Auto buy” does it for you.'],
    ['new','Upgrades: „Alle kaufen“ und „Auto-Upgrades“ kaufen alles Bezahlbare, das Billigste zuerst.','Upgrades: “Buy all” and “Auto upgrades” buy everything you can afford, cheapest first.'],
    ['new','Spar-Grenze: Die Automatik gibt pro Kauf höchstens 10, 25, 50 oder 100 % deiner Kekse aus.','Spending limit: Automation spends at most 10, 25, 50 or 100% of your cookies per purchase.'],
    ['new','Helfer: 5 Angestellte (Goldkeks-Fänger, Auftragsbüro, Boost-Meister, Gärtner, Expeditionsleiter). Jeder lässt sich einzeln ausschalten.','Helpers: 5 employees (Gold Catcher, Order Office, Boost Master, Gardener, Expedition Leader). Each one can be switched off.']
  ]},
  {v:11,sum:['Neu: Der Shop hat wieder einen eigenen Tab, direkt vor dem Aufstieg. Dazu gibt es Sternenkrümel.','New: The shop has its own tab again, right before Ascension. Plus star crumbs.'],items:[
    ['new','Sternenkrümel: Eine sehr seltene Währung. Du findest sie bei Goldkeksen, Monstern, schweren Aufträgen, Expeditionen, Challenges und Erfolgen.','Star crumbs: A very rare currency. You find them from golden cookies, monsters, hard orders, expeditions, challenges and achievements.'],
    ['new','Sternen-Laden: 12 dauerhafte Verbesserungen für den Tab Welt. Sie bleiben auch nach dem Aufstieg.','Star Shop: 12 permanent upgrades for the World tab. They stay after ascension.'],
    ['new','Welt-Boosts: 6 neue Boosts für Mana, Monster, Garten, Expeditionen, Eier und Ereignisse.','World boosts: 6 new boosts for mana, monsters, garden, expeditions, eggs and events.'],
    ['change','Tabs: Die Welt hat wieder ihren eigenen Tab. Boosts, Keksboxen, Gegenstände und Designs sind jetzt im Shop.','Tabs: The world has its own tab again. Boosts, cookie boxes, items and designs are now in the shop.']
  ]},
  {v:10,sum:['Neu: Welt und Shop sind jetzt ein Tab, und die Einstellungen sind oben rechts.','New: World and Shop are now one tab, and settings are at the top right.'],items:[
    ['new','Welt & Shop: Boosts, Keksboxen, Gegenstände und die ganze Welt sind auf einer Seite.','World & Shop: Boosts, cookie boxes, items and the whole world are on one page.'],
    ['new','Gegenstände kaufen: Mit Edelsteinen aus Expeditionen kannst du jeden Gegenstand direkt kaufen. Jede Stufe kostet mehr.','Buy items: With gems from expeditions you can buy any item directly. Each level costs more.'],
    ['change','Einstellungen: Das Zahnrad oben rechts öffnet Optionen und das Admin-Panel. Die beiden Reiter sind weg.','Settings: The gear at the top right opens options and the admin panel. The two tabs are gone.']
  ]},
  {v:9,sum:['Neu: Ein modernes, ruhigeres Design.','New: A modern, calmer design.'],items:[
    ['change','Design: Alles ist jetzt flacher und übersichtlicher, mit weniger Rahmen und Schnörkeln.','Design: Everything is now flatter and cleaner, with fewer borders and decorations.'],
    ['change','Reiter: Die Reiter sind runde Knöpfe. Der aktive ist weiß.','Tabs: The tabs are round buttons. The active one is white.'],
    ['change','Karten: Gebäude, Upgrades und Aufträge haben eine ruhige Karte und einen klaren Preis.','Cards: Buildings, upgrades and orders have a calm card and a clear price.'],
    ['change','Auf dem Handy ist der Keks kleiner, damit du schneller zur Liste kommst.','On phones the cookie is smaller so you reach the list faster.'],
    ['change','Welt: Alles ist jetzt auf einer Seite, ohne Unterreiter. Expeditionen, Eier und Pflanzen laufen von selbst. Die Börse hat nur noch + und −.','World: Everything is now on one page, with no sub-tabs. Expeditions, eggs and plants run by themselves. The stock market now only has + and −.']
  ]},
  {v:8,sum:['Neu: Der Tab „Welt“ mit 10 neuen Spielideen.','New: The “World” tab with 10 new game ideas.'],items:[
    ['new','Monster: Besiege Monster durch Klicken. Du bekommst Kekse und Monsterzähne.','Monsters: Beat monsters by clicking. You get cookies and monster teeth.'],
    ['new','Zauberbuch: Mana für Zauber wie Backzauber, Goldruf und Zeitwirbel.','Spellbook: Mana for spells like Bake Spell, Gold Call and Time Whirl.'],
    ['new','Garten: Pflanzen geben dir Boni, solange sie reif sind. Ernten gibt Kräuter.','Garden: Plants give you bonuses while they are ripe. Harvesting gives herbs.'],
    ['new','Börse: Kaufe Aktien billig und verkaufe sie teuer. Es gibt eine kleine Gebühr.','Stocks: Buy shares cheap and sell them high. There is a small fee.'],
    ['new','Expeditionen: Schicke Reisende los und bekomme Kekse und Edelsteine.','Expeditions: Send explorers out and get cookies and gems.'],
    ['new','Labor: Forschung mit dauerhaften Boni. Sie bleibt nach dem Aufstieg.','Lab: Research with permanent bonuses. It stays after ascending.'],
    ['new','Begleiter: Schlüpfe Haustiere aus Eiern und nimm 2 mit.','Companions: Hatch pets from eggs and bring 2 along.'],
    ['new','Crafting: Baue Ausrüstung und Tränke aus Zähnen, Kräutern und Edelsteinen.','Crafting: Make gear and potions from teeth, herbs and gems.'],
    ['new','Ereignisse: Alle paar Minuten gibt es kurz einen Bonus, zum Beispiel Backwut.','Events: Every few minutes there is a short bonus, for example Baking Rush.'],
    ['new','Challenges: Spiele mit einer Erschwernis und bekomme dauerhafte Belohnungen.','Challenges: Play with a handicap and get permanent rewards.'],
    ['new','9 neue Erfolge und ein Bereich im Admin-Panel.','9 new achievements and a section in the admin panel.']
  ]},
  {v:7,sum:['Neu: Kundenaufträge. Kunden bestellen Kekse und du bekommst Belohnungen.','New: customer orders. Customers order cookies and you get rewards.'],items:[
    ['new','Aufträge: Ein neuer Tab. Kunden wollen z. B. Kekse, Klicks oder neue Gebäude in kurzer Zeit.','Orders: A new tab. Customers want e.g. cookies, clicks or new buildings in a short time.'],
    ['new','Belohnung: Du bekommst Kekse. Schwere Aufträge geben sogar einen Gegenstand.','Reward: You get cookies. Hard orders even give an item.'],
    ['new','Ruf: Jeder erledigte Auftrag gibt Ruf. Mehr Ruf bedeutet bis zu +15 % Produktion.','Reputation: Every finished order gives reputation. More reputation means up to +15% production.'],
    ['new','4 neue Erfolge für Aufträge und ein Bereich im Admin-Panel.','4 new achievements for orders and a section in the admin panel.']
  ]},
  {v:6,sum:['Endgame: mehr Gebäude, mehr Upgrades und ein viel größerer Himmelsbaum.','Endgame: more buildings, more upgrades and a much bigger heavenly tree.'],items:[
    ['new','Gebäude: 3 neue ganz am Ende. Antimaterie-Kondensator, Prisma und Keks-Multiversum.','Buildings: 3 new ones at the very end. Antimatter Condenser, Prism and Cookie Multiverse.'],
    ['new','Upgrades: Jedes Gebäude hat 2 neue Stufen (bei 200 und 250 Stück). Dazu 6 neue Rezepte, 6 große Produktions-Upgrades, 3 Synergien und 2 Klick-Trainings.','Upgrades: Every building has 2 new levels (at 200 and 250 owned). Plus 6 new recipes, 6 big production upgrades, 3 synergies and 2 click trainings.'],
    ['new','Himmelsbaum: 8 neue Knoten unter dem „Ewigen Rezept“. Sie kosten 120 bis 1000 Himmelschips.','Heavenly tree: 8 new nodes below the "Eternal Recipe". They cost 120 to 1000 heavenly chips.'],
    ['new','Gegenstände: 2 neue legendäre Gegenstände, Sternennebel und Fabrikherz.','Items: 2 new legendary items, Star Nebula and Factory Heart.'],
    ['new','Keks-Designs: Kosmos und Leere.','Cookie designs: Cosmos and Void.'],
    ['new','Erfolge: Viele neue für große Mengen Kekse, Himmelschips und Aufstiege.','Achievements: Many new ones for huge amounts of cookies, heavenly chips and ascensions.'],
    ['change','Sehr große Zahlen werden kurz geschrieben, zum Beispiel 1,5e30.','Very big numbers are written short, for example 1.5e30.']
  ]},
  {v:5,sum:['Mehr Boosts, mehr Gegenstände und ein fairerer Schwierigkeitsgrad.','More boosts, more items and a fairer difficulty.'],items:[
    ['new','Boosts: Es gibt jetzt 7 statt 5. Neu sind der Keksmagnet und der Kühlschrank.','Boosts: There are now 7 instead of 5. New are the Cookie Magnet and the Fridge.'],
    ['new','Gegenstände: Es gibt jetzt 19 statt 12. Neu sind zum Beispiel Mehlsack, Schneebesen und Kochmütze.','Items: There are now 19 instead of 12. New ones include Flour Sack, Whisk and Chef Hat.'],
    ['change','Schwerer zu bekommen: Boosts und Keksboxen sind erst später im Spiel da. Seltene Gegenstände sind sehr selten.','Harder to get: Boosts and cookie boxes only unlock later in the game. Rare items are very rare.'],
    ['change','Keksboxen: Jede Box, die du öffnest, macht die nächste etwas teurer. Goldkekse lassen nur noch selten eine Box fallen.','Cookie boxes: Every box you open makes the next one a bit more expensive. Golden cookies rarely drop a box now.'],
    ['change','Goldkekse kommen viel seltener. Vorher waren sie zu stark.','Golden cookies appear much less often. Before, they were too strong.'],
    ['change','Klicks sind schwächer. Der Klick-Rausch zählt ×150 statt ×777.','Clicks are weaker. Click Frenzy counts ×150 instead of ×777.'],
    ['change','Der Himmelsbaum und die Synergie-Upgrades sind etwas schwächer.','The heavenly tree and the synergy upgrades are a bit weaker.'],
    ['change','Alles wurde geprüft, damit nichts mehr viel zu stark ist.','Everything was checked so that nothing is way too strong anymore.']
  ]},
  {v:4,sum:['Das Neuigkeiten-Fenster, Boosts, Gegenstände und Keks-Designs.','The news window, boosts, items and cookie designs.'],items:[
    ['new','Neuigkeiten: Dieses Fenster zeigt, was neu ist.','News: This window shows what is new.'],
    ['new','Boosts: Du zahlst Kekse und bekommst kurz einen Vorteil.','Boosts: You pay cookies and get a short advantage.'],
    ['new','Keksbox: In jeder Box steckt ein zufälliger Gegenstand.','Cookie box: Every box holds a random item.'],
    ['new','Keks-Designs: Der große Keks hat 6 neue Looks.','Cookie designs: The big cookie has 6 new looks.']
  ]},
  {v:3,sum:['Admin-Panel, mehr Inhalt, Bilder und zwei Sprachen.','Admin panel, more content, images and two languages.'],items:[
    ['new','Admin-Panel: Hier kannst du fast alles ändern.','Admin panel: Here you can change almost everything.'],
    ['new','{u} Upgrades und ein größerer Himmelsbaum mit 17 Knoten.','{u} upgrades and a bigger heavenly tree with 17 nodes.'],
    ['new','Bilder für Gebäude, Upgrades und den Himmelsbaum.','Images for buildings, upgrades and the heavenly tree.'],
    ['new','Deutsch und Englisch, dazu bessere Animationen.','German and English, plus better animations.']
  ]},
  {v:2,sum:['Der Himmelsbaum und bessere Tasten.','The heavenly tree and better buttons.'],items:[
    ['new','Himmelsbaum: Steige auf und gib Himmelschips für dauerhafte Boni aus.','Heavenly tree: Ascend and spend heavenly chips on permanent bonuses.'],
    ['change','Tasten und Leertaste funktionieren zuverlässiger.','Buttons and the Space key work more reliably.']
  ]},
  {v:1,sum:['Das Grundspiel.','The base game.'],items:[
    ['new','Klicke den Keks und kaufe Gebäude, die für dich backen.','Click the cookie and buy buildings that bake for you.'],
    ['new','Upgrades, Goldkekse, Erfolge und Aufstieg.','Upgrades, golden cookies, achievements and ascension.'],
    ['new','Dein Spiel wird automatisch gespeichert.','Your game saves automatically.']
  ]}
];


/* Kundenaufträge: Daten */
const CUST=[
  {n:['Oma Resi','Granny Rosie'],skin:'#f1c9a5',hair:'#d5dade',shirt:'#d9573f',style:'bun',glasses:1},
  {n:['Herr Moser','Mr. Moser'],skin:'#e8b894',hair:'#4b2a16',shirt:'#3e6aa8',style:'short',stache:1},
  {n:['Lena','Lena'],skin:'#f6d3b3',hair:'#e0a04a',shirt:'#6bbf6a',style:'long'},
  {n:['Max','Max'],skin:'#c98d62',hair:'#1f1a17',shirt:'#f2b92e',style:'cap'},
  {n:['Frau Gruber','Mrs. Gruber'],skin:'#f1c9a5',hair:'#7a4a2a',shirt:'#8a63d2',style:'long',glasses:1},
  {n:['Koch Luigi','Chef Luigi'],skin:'#e8b894',hair:'#2a1a12',shirt:'#f5f7f6',style:'toque',stache:1},
  {n:['Bürgermeisterin','Mayor'],skin:'#9a6a4a',hair:'#1f1a17',shirt:'#2c456e',style:'bun'},
  {n:['Touristin Mia','Tourist Mia'],skin:'#f6d3b3',hair:'#b5654a',shirt:'#5aa0d8',style:'hat'}
];
const ORD_TYPES=['bake','click','buy'];
const ORD_D={
  easy:{f:.8,T:60,clk:[40,30],buy:[3,90],rc:45,rmin:100,rep:1,cf:.55,bp:.04,cap:.02,cmin:10},
  mid:{f:1.2,T:90,clk:[100,40],buy:[6,120],rc:90,rmin:500,rep:2,cf:.75,bp:.07,cap:.04,cmin:25},
  hard:{f:1.8,T:120,clk:[180,45],buy:[12,150],rc:180,rmin:2000,rep:4,cf:.95,bp:.1,cap:.06,cmin:50}
};
function sanOrders(o){
  const r={slots:[null,null,null],rep:0,done:0,cd:0,heat:0};
  if(o&&typeof o.heat==='number'&&isFinite(o.heat)) r.heat=Math.max(0,Math.min(20,o.heat));
  const nn=(v,d)=>(typeof v==='number'&&isFinite(v)&&v>=0)?v:(d||0);
  if(!o||typeof o!=='object') return r;
  r.rep=Math.floor(nn(o.rep));r.done=Math.floor(nn(o.done));r.cd=Math.min(300,nn(o.cd));
  if(Array.isArray(o.slots)) for(let i=0;i<3;i++){
    const s=o.slots[i];
    if(!s||typeof s!=='object'||!ORD_TYPES.includes(s.type)||!ORD_D[s.diff]||!(s.c>=0&&s.c<CUST.length)||!['offer','active','cool'].includes(s.st)) continue;
    const t=nn(s.target,0);if(t<=0) continue;
    r.slots[i]={c:Math.floor(s.c),type:s.type,diff:s.diff,target:t,time:nn(s.time,60),cookies:nn(s.cookies),rep:Math.floor(nn(s.rep,1)),item:!!s.item,st:s.st,t:Math.min(600,nn(s.t)),sa:nn(s.sa),sc:nn(s.sc),sb:nn(s.sb)};
  }
  return r;
}


/* Spielwelt: Daten (Monster, Magie, Garten, Börse, Expeditionen, Labor, Begleiter, Crafting, Ereignisse, Herausforderungen) */
const tt=(de,en)=>LANG==='en'?en:de;
const MATS=[
  {id:'tooth',n:['Monsterzahn','Monster tooth'],col:'#efe6cf'},
  {id:'herb',n:['Kraut','Herb'],col:'#7fd69b'},
  {id:'gem',n:['Edelstein','Gem'],col:'#7fb8f2'}
];
const MON_KINDS=[
  {n:['Krümelmonster','Crumb Monster'],col:'#8a5a3c'},
  {n:['Mehlgeist','Flour Ghost'],col:'#d9d4c6'},
  {n:['Zuckerwurm','Sugar Worm'],col:'#e58aa8'},
  {n:['Schokoblob','Choco Blob'],col:'#5a3320'},
  {n:['Teigtroll','Dough Troll'],col:'#d8b36a'},
  {n:['Backofen-Imp','Oven Imp'],col:'#d9573f'}
];
const SPELLS=[
  {id:'bake',n:['Backzauber','Bake Spell'],cost:15,d:['Gibt sofort Kekse (20 Sekunden Produktion, höchstens 5 % deiner Kekse).','Gives cookies at once (20 seconds of production, at most 5% of your cookies).']},
  {id:'click',n:['Klickschwung','Click Swing'],cost:20,d:['Klicks zählen 20 Sekunden lang ×10.','Clicks count ×10 for 20 seconds.']},
  {id:'sale',n:['Preisnachlass','Price Cut'],cost:25,d:['Gebäude sind 60 Sekunden lang 20 % billiger.','Buildings are 20% cheaper for 60 seconds.']},
  {id:'gold',n:['Goldruf','Gold Call'],cost:100,d:['Ein Goldkeks erscheint sofort.','A golden cookie appears at once.']},
  {id:'time',n:['Zeitwirbel','Time Whirl'],cost:60,d:['Produktion ×5 für 25 Sekunden.','Production ×5 for 25 seconds.']}
];
const PLANTS=[
  {id:'sugarbloom',n:['Zuckerblume','Sugar Bloom'],grow:180,life:600,c:40,col:'#f2a6c4',eff:['Produktion +2 %','Production +2%'],prod:.02,herb:1},
  {id:'clover',n:['Klickklee','Click Clover'],grow:240,life:600,c:40,col:'#7fd69b',eff:['Klick-Kraft +12 %','Click power +12%'],click:.12,herb:1},
  {id:'poppy',n:['Goldmohn','Gold Poppy'],grow:420,life:600,c:90,col:'#f1b24a',eff:['Goldkekse kommen 4 % schneller','Golden cookies come 4% faster'],gold:.96,herb:2},
  {id:'rose',n:['Rabattrose','Discount Rose'],grow:420,life:600,c:90,col:'#e0566f',eff:['Gebäude 1,5 % billiger','Buildings 1.5% cheaper'],cost:.985,herb:2},
  {id:'mint',n:['Manaminze','Mana Mint'],grow:600,life:900,c:150,col:'#5ad1c4',eff:['Mana lädt 10 % schneller','Mana regenerates 10% faster'],mana:.1,herb:2},
  {id:'pumpkin',n:['Kekskürbis','Cookie Pumpkin'],grow:900,life:900,c:240,col:'#e58a4b',eff:['Produktion +5 %','Production +5%'],prod:.05,herb:3}
];
const PLOT_UNLOCK=[0,0,1e6,1e9,1e12,1e15];
const STOCKS=[
  {id:'mehl',n:['Mehl AG','Flour Inc'],f:1,vol:.05,col:'#d9d4c6'},
  {id:'zucker',n:['Zucker & Co','Sugar & Co'],f:.6,vol:.07,col:'#f2a6c4'},
  {id:'schoko',n:['Schoko Ltd','Choco Ltd'],f:1.5,vol:.06,col:'#a8693f'},
  {id:'butter',n:['Butter KG','Butter KG'],f:.8,vol:.045,col:'#f1d36a'},
  {id:'milch',n:['Milch AG','Milk Inc'],f:1.2,vol:.055,col:'#bfe0f5'},
  {id:'nuss',n:['Nuss GmbH','Nut Ltd'],f:2,vol:.09,col:'#c9a46a'}
];
const DESTS=[
  {id:'flour',n:['Mehlgebirge','Flour Mountains'],dur:180,risk:.08,gems:1,item:0,col:'#d9d4c6'},
  {id:'sugar',n:['Zuckerwüste','Sugar Desert'],dur:600,risk:.15,gems:3,item:0,col:'#f2a6c4'},
  {id:'lake',n:['Schokoladensee','Chocolate Lake'],dur:1500,risk:.22,gems:7,item:0,col:'#7a4a2a'},
  {id:'star',n:['Sternenbäckerei','Star Bakery'],dur:3600,risk:.30,gems:16,item:.15,col:'#8a63d2'},
  {id:'void',n:['Krümelabgrund','Crumb Abyss'],dur:7200,risk:.40,gems:40,item:.3,col:'#2c456e'}
];
const LABS=[
  {id:'ovens',n:['Bessere Öfen','Better Ovens'],d:['Produktion +3 %.','Production +3%.'],time:300,f:600,min:1e5,unlock:1e5,prod:.03},
  {id:'gloves',n:['Klickhandschuhe','Click Gloves'],d:['Klick-Kraft ×1,2.','Click power ×1.2.'],time:420,f:600,min:3e5,unlock:3e5,click:1.2},
  {id:'radar',n:['Gold-Radar','Gold Radar'],d:['Goldkekse kommen 8 % schneller.','Golden cookies come 8% faster.'],time:600,f:900,min:2e6,unlock:1e6,gold:.92},
  {id:'bulk',n:['Großeinkauf','Bulk Buying'],d:['Gebäude 3 % billiger.','Buildings 3% cheaper.'],time:900,f:1200,min:1e7,unlock:1e7,cost:.97},
  {id:'tank',n:['Mana-Tank','Mana Tank'],d:['Höchstens +20 Mana.','+20 max mana.'],time:900,f:1200,min:5e7,unlock:5e7,mana:20},
  {id:'fert',n:['Dünger','Fertilizer'],d:['Pflanzen wachsen 25 % schneller.','Plants grow 25% faster.'],time:1200,f:1500,min:1e8,unlock:1e8,grow:.75},
  {id:'boats',n:['Expeditionsboote','Expedition Boats'],d:['Expeditionen sind 20 % kürzer.','Expeditions are 20% shorter.'],time:1800,f:1800,min:1e9,unlock:1e9,exp:.8},
  {id:'beast',n:['Monsterkunde','Monster Lore'],d:['Monster geben 30 % mehr Belohnung und haben 10 % weniger Leben.','Monsters give 30% more reward and have 10% less health.'],time:1800,f:2400,min:1e10,unlock:1e10,mon:1.3},
  {id:'trade',n:['Handelsrecht','Trade Law'],d:['+3 Aktien pro Firma erlaubt, Gebühr nur 1,5 %.','+3 shares per company allowed, fee only 1.5%.'],time:2400,f:3000,min:1e11,unlock:1e11,trade:1},
  {id:'law',n:['Auftragsvertrag','Order Contract'],d:['Aufträge geben 25 % mehr Kekse.','Orders give 25% more cookies.'],time:3600,f:3600,min:1e12,unlock:1e12,ord:1.25},
  {id:'breed',n:['Tierzucht','Animal Breeding'],d:['Eier schlüpfen doppelt so schnell, dazu ein dritter Begleiter-Platz.','Eggs hatch twice as fast, plus a third companion slot.'],time:5400,f:7200,min:1e13,unlock:1e13,breed:1},
  {id:'science',n:['Keks-Wissenschaft','Cookie Science'],d:['Produktion +5 %.','Production +5%.'],time:7200,f:9000,min:1e14,unlock:1e14,prod:.05}
];
const PETS=[
  {id:'krumel',n:['Krümel','Crumb'],rar:0,col:'#c98a4b',k:'prod',v:.01,d:['Produktion','Production']},
  {id:'butter',n:['Butterbär','Butter Bear'],rar:0,col:'#f1d36a',k:'click',v:.06,d:['Klick-Kraft','Click power']},
  {id:'milch',n:['Milchkatze','Milk Cat'],rar:0,col:'#e8eef0',k:'cost',v:.01,d:['Gebäude billiger','Cheaper buildings']},
  {id:'mondi',n:['Mondhase','Moon Hare'],rar:1,col:'#bfc8f5',k:'mana',v:.08,d:['Mana-Ladung','Mana regen']},
  {id:'goldi',n:['Goldfuchs','Gold Fox'],rar:1,col:'#f1b24a',k:'gold',v:.03,d:['Goldkekse schneller','Faster golden cookies']},
  {id:'zimt',n:['Zimtfalke','Cinnamon Hawk'],rar:2,col:'#b5654a',k:'mon',v:.1,d:['Monster-Belohnung','Monster reward']},
  {id:'schoko',n:['Schokodrache','Choco Dragon'],rar:2,col:'#6b3a22',k:'prod',v:.025,d:['Produktion','Production']},
  {id:'phoenix',n:['Backphönix','Bake Phoenix'],rar:3,col:'#e8573f',k:'prod',v:.04,d:['Produktion','Production']}
];
const PET_RAR=[{n:['Gewöhnlich','Common'],w:60,col:'#8fa6b1'},{n:['Selten','Rare'],w:25,col:'#7fb8f2'},{n:['Episch','Epic'],w:12,col:'#b58af2'},{n:['Legendär','Legendary'],w:3,col:'#f1b24a'}];
const CRAFTS=[
  {id:'amulet',n:['Krümelamulett','Crumb Amulet'],m:{tooth:5,herb:3},d:['Produktion +2 %.','Production +2%.'],prod:.02},
  {id:'whisk',n:['Goldener Schneebesen','Golden Whisk'],m:{herb:6,gem:3},d:['Klick-Kraft ×1,15.','Click power ×1.15.'],click:1.15},
  {id:'compass',n:['Sternenkompass','Star Compass'],m:{gem:8,tooth:3},d:['Goldkekse kommen 5 % schneller.','Golden cookies come 5% faster.'],gold:.95},
  {id:'purse',n:['Zuckerbeutel','Sugar Purse'],m:{herb:8,gem:5},d:['Gebäude 2 % billiger.','Buildings 2% cheaper.'],cost:.98},
  {id:'quill',n:['Zauberfeder','Magic Quill'],m:{tooth:8,gem:6},d:['Höchstens +10 Mana.','+10 max mana.'],mana:10},
  {id:'ring',n:['Monsterring','Monster Ring'],m:{tooth:15,gem:10},d:['Monster geben 15 % mehr, dazu Produktion +1,5 %.','Monsters give 15% more, plus production +1.5%.'],mon:1.15,prod:.015},
  {id:'lantern',n:['Backlaterne','Bake Lantern'],m:{herb:12,tooth:10,gem:12},d:['Produktion +3 %.','Production +3%.'],prod:.03},
  {id:'grail',n:['Heiliger Teigtopf','Holy Dough Pot'],m:{tooth:25,herb:20,gem:25},d:['Produktion +5 %.','Production +5%.'],prod:.05}
];
const POTIONS=[
  {id:'p_sugar',n:['Zuckertrank','Sugar Potion'],m:{herb:3},d:['Produktion ×2 für 30 Sekunden.','Production ×2 for 30 seconds.']},
  {id:'p_click',n:['Klicktrank','Click Potion'],m:{tooth:3},d:['Klicks ×10 für 20 Sekunden.','Clicks ×10 for 20 seconds.']},
  {id:'p_gold',n:['Glückstrank','Luck Potion'],m:{gem:4},d:['Ein Goldkeks erscheint.','A golden cookie appears.']}
];
const EVENTS=[
  {id:'rush',n:['Backwut','Baking Rush'],d:['Produktion ×1,5.','Production ×1.5.'],prod:1.5},
  {id:'rain',n:['Goldregen','Gold Rain'],d:['Goldkekse kommen doppelt so oft.','Golden cookies come twice as often.'],gold:.5},
  {id:'sale',n:['Ausverkauf','Clearance'],d:['Gebäude 20 % billiger.','Buildings 20% cheaper.'],cost:.8},
  {id:'hunt',n:['Monsterjagd','Monster Hunt'],d:['Monster kommen viel öfter und geben 50 % mehr.','Monsters come much more often and give 50% more.'],mon:1.5,monFast:4},
  {id:'fever',n:['Börsenfieber','Stock Fever'],d:['Die Aktienkurse schwanken viel stärker.','Stock prices swing much more.'],vol:2.2},
  {id:'trader',n:['Wanderhändler','Wandering Trader'],d:['Aufträge geben doppelt so viele Kekse.','Orders give twice as many cookies.'],ord:2}
];
const EV_DUR=150;
const CHALS=[
  {id:'weak',n:['Sparflamme','Low Flame'],d:['Produktion ×0,2.','Production ×0.2.'],goal:1e10,rd:['Dauerhaft Produktion +2 %.','Permanent production +2%.'],prod:.2,rew:{prod:.02}},
  {id:'noclick',n:['Klick-Fasten','Click Fast'],d:['Klicks geben nichts.','Clicks give nothing.'],goal:1e11,rd:['Dauerhaft Produktion +3 %.','Permanent production +3%.'],click0:1,rew:{prod:.03}},
  {id:'pricey',n:['Teure Zeiten','Pricey Times'],d:['Gebäude kosten ×1,6.','Buildings cost ×1.6.'],goal:1e12,rd:['Dauerhaft Gebäude 3 % billiger.','Permanent buildings 3% cheaper.'],cost:1.6,rew:{cost:.97}},
  {id:'nogold',n:['Goldlos','Goldless'],d:['Es erscheinen keine Goldkekse.','No golden cookies appear.'],goal:1e13,rd:['Dauerhaft Goldkekse 6 % schneller.','Permanent golden cookies 6% faster.'],nogold:1,rew:{gold:.94}},
  {id:'frail',n:['Zerbrechlich','Frail'],d:['Produktion ×0,5 und Gebäude kosten ×1,3.','Production ×0.5 and buildings cost ×1.3.'],goal:1e15,rd:['Dauerhaft Produktion +5 %.','Permanent production +5%.'],prod:.5,cost:1.3,rew:{prod:.05}}
];
function freshWorld(){
  return {mat:{tooth:0,herb:0,gem:0},
    mon:{k:0,st:'idle',next:240,hp:0,max:0,t:0,kind:0,boss:0},
    mana:0,casts:0,
    gar:{plots:[null,null,null,null,null,null]},
    mkt:{ref:300,m:[1,1,1,1,1,1],hold:[0,0,0,0,0,0],spent:[0,0,0,0,0,0],hist:[[],[],[],[],[],[]],tick:15,trend:[0,0,0,0,0,0]},
    exp:{slots:[null,null],done:0},
    lab:{done:{},cur:null},
    pet:{owned:{},eq:[],egg:null,eggs:0},
    craft:{done:{},pot:{}},
    ev:{cur:null,next:420,n:0},
    chal:{done:{},act:null},
    star:{n:0,all:0,shop:{},ms:0}};
}
function sanWorld(o){
  const w=freshWorld();
  if(!o||typeof o!=='object') return w;
  const nn=(v,d,mx)=>{v=(typeof v==='number'&&isFinite(v))?v:d;return Math.min(mx===undefined?1e15:mx,Math.max(0,v));};
  const flags=(src,list,dst)=>{if(src&&typeof src==='object') list.forEach(x=>{if(src[x.id]) dst[x.id]=1;});};
  if(o.mat) MATS.forEach(m=>{w.mat[m.id]=Math.floor(nn(o.mat[m.id],0,1e9));});
  if(o.mon&&typeof o.mon==='object'){
    const m=o.mon;w.mon.k=Math.floor(nn(m.k,0,1e6));
    if(m.st==='wait'||m.st==='fight'){w.mon.st='wait';w.mon.kind=Math.floor(nn(m.kind,0,MON_KINDS.length-1));w.mon.boss=m.boss?1:0;}
    else w.mon.next=nn(m.next,240,900);
  }
  w.mana=nn(o.mana,0,500);w.casts=Math.floor(nn(o.casts,0,1e7));
  if(o.gar&&Array.isArray(o.gar.plots)) for(let i=0;i<6;i++){const p=o.gar.plots[i];if(p&&PLANTS.some(x=>x.id===p.p)&&typeof p.at==='number') w.gar.plots[i]={p:p.p,at:p.at};}
  if(o.mkt&&typeof o.mkt==='object'){
    const k=o.mkt;w.mkt.ref=nn(k.ref,300,1e30);
    for(let i=0;i<6;i++){
      w.mkt.m[i]=nn(k.m&&k.m[i],1,1.8)||1;if(w.mkt.m[i]<.45) w.mkt.m[i]=.45;
      w.mkt.hold[i]=Math.floor(nn(k.hold&&k.hold[i],0,40));w.mkt.spent[i]=nn(k.spent&&k.spent[i],0,1e40);
      w.mkt.trend[i]=Math.max(-1,Math.min(1,nn(k.trend&&k.trend[i]+1,1,2)-1));
      if(k.hist&&Array.isArray(k.hist[i])) w.mkt.hist[i]=k.hist[i].filter(v=>typeof v==='number'&&isFinite(v)).slice(-30);
    }
  }
  if(o.exp&&Array.isArray(o.exp.slots)){
    for(let i=0;i<2;i++){const s=o.exp.slots[i];if(s&&DESTS.some(d=>d.id===s.d)&&typeof s.end==='number') w.exp.slots[i]={d:s.d,end:s.end,ok:s.ok?1:0};}
    w.exp.done=Math.floor(nn(o.exp.done,0,1e7));
  }
  if(o.lab){flags(o.lab.done,LABS,w.lab.done);const c=o.lab.cur;if(c&&LABS.some(x=>x.id===c.id)&&!w.lab.done[c.id]&&typeof c.end==='number') w.lab.cur={id:c.id,end:c.end};}
  if(o.pet){
    PETS.forEach(p=>{const n=Math.floor(nn(o.pet.owned&&o.pet.owned[p.id],0,5));if(n>0) w.pet.owned[p.id]=n;});
    if(Array.isArray(o.pet.eq)) w.pet.eq=o.pet.eq.filter((id,i,a)=>w.pet.owned[id]&&a.indexOf(id)===i).slice(0,4);
    w.pet.eggs=Math.floor(nn(o.pet.eggs,0,99));
    if(o.pet.egg&&typeof o.pet.egg.end==='number') w.pet.egg={end:o.pet.egg.end};
  }
  if(o.craft){flags(o.craft.done,CRAFTS,w.craft.done);if(o.craft.pot) POTIONS.forEach(p=>{const n=Math.floor(nn(o.craft.pot[p.id],0,99));if(n>0) w.craft.pot[p.id]=n;});}
  if(o.ev){w.ev.n=Math.floor(nn(o.ev.n,0,1e6));w.ev.next=nn(o.ev.next,420,1200);const c=o.ev.cur;if(c&&EVENTS.some(e=>e.id===c.id)&&typeof c.t==='number'&&c.t>0) w.ev.cur={id:c.id,t:Math.min(EV_DUR,c.t)};}
  if(o.star&&typeof o.star==='object'){
    w.star.n=Math.floor(nn(o.star.n,0,1e6));w.star.all=Math.max(w.star.n,Math.floor(nn(o.star.all,0,1e6)));w.star.ms=Math.floor(nn(o.star.ms,0,100));
    flags(o.star.shop,STAR_ITEMS,w.star.shop);
  }
  if(o.chal){flags(o.chal.done,CHALS,w.chal.done);if(o.chal.act&&CHALS.some(c=>c.id===o.chal.act)&&!w.chal.done[o.chal.act]) w.chal.act=o.chal.act;}
  return w;
}
let WFX=null;
