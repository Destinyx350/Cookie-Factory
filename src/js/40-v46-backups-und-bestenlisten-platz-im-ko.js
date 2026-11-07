/* ======================= V46: Backups und Bestenlisten-Platz im Konto ======================= */
var v46Ready=false;
/* Bestenliste: Der Platz gehört zum Konto und kommt auf jedes Gerät mit. */
var lbAccWho='';
async function lbAccSync(force){
  if(!lbOn()||!accTok||!accMe){lbAccWho='';return;}
  if(!force&&lbAccWho===accMe.username) return;
  lbAccWho=accMe.username;
  if(!$id('accAskOv').hidden){lbAccWho='';setTimeout(()=>lbAccSync(false),2500);return;}
  if(lbCheat()) return;
  const mine=S.lb.on&&S.lb.id?S.lb.id:null;
  let r=null;try{r=await lbApi('rpc/acc_lb_link',{p_token:accTok,p_lb:mine});}catch(x){return;}
  if(!r||!r.lb_id||(r.lb_id===S.lb.id&&S.lb.on)) return;
  const old=S.lb.on&&S.lb.id&&S.lb.id!==r.lb_id?S.lb.id:null;
  if(old&&!r.other_taken){try{await lbApi('rpc/leave_leaderboard',{p_id:old});}catch(x){}}
  S.lb.id=r.lb_id;S.lb.on=1;S.lb.ban=0;S.lb.ls=+r.score||0;S.lb.t=r.updated_at?Date.parse(r.updated_at)||0:0;S.lb.pb=null;
  save();lbRank=0;lbPerRank={W:0,M:0};lbLast=0;lbRefresh();
  toast(tt('Dein Platz in der Bestenliste kommt jetzt aus deinem Konto.','Your leaderboard spot now comes from your account.'),true);
}

v46Ready=true;
