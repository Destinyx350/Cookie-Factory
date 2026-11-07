/* ======================= Zahlen ======================= */
const SUF={
  de:[[1e24,'Quad'],[1e21,'Trd'],[1e18,'Trio'],[1e15,'Brd'],[1e12,'Bio'],[1e9,'Mrd'],[1e6,'Mio']],
  en:[[1e24,'septillion'],[1e21,'sextillion'],[1e18,'quintillion'],[1e15,'quadrillion'],[1e12,'trillion'],[1e9,'billion'],[1e6,'million']]
};
function group(n){return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,LANG==='de'?'.':',');}
const DEFOPT=()=>({num:'short',fs:1,acc:'orange',title:false,eco:false,ask:true,as:30,sn:{click:true,buy:true,gold:true,ach:true,other:true,ui:true},mus:1,trk:'auto',bgm:true,m24:1,ntf:'all',ntfT:5,ntfB:true,motion:'on',start:true,upc:true,shake:true});
let numMode='short';
const TRK_OK=['bake','market','stars','adv','fest'];
/* Zahlenformate einmal bauen und wiederverwenden: toLocaleString mit Optionen baut sonst jedes Mal ein neues. */
const NFC={};
function nf(d){const k=LANG+d;return NFC[k]||(NFC[k]=new Intl.NumberFormat(LOC[LANG],{maximumFractionDigits:d}));}
function fmt(n){
  if(!isFinite(n)) return '∞';
  if(n<0) n=0;
  if(numMode==='sci'&&n>=1e6||n>=1e27) return n.toExponential(2).replace('e+','e').replace('.',LANG==='de'?',':'.');
  if(n<1e6||numMode==='long'&&n<1e18) return group(n);
  for(const [v,s] of SUF[LANG]){
    if(n>=v){const x=n/v;return nf(x>=100?0:x>=10?1:2).format(x)+' '+s;}
  }
  return group(n);
}
function fmtRate(n){
  if(n>=1000) return fmt(n);
  return nf(1).format(Math.round(n*10)/10);
}
