/* ======================= V62: Neue Konten kommen von selbst in die Bestenliste ======================= */
var v62Ready=false;
/* Nach "Konto erstellen": die Bäckerei tritt der Bestenliste bei. Ist der Name schon vergeben oder nicht erlaubt,
   nimmt sie den Benutzernamen (und notfalls den Benutzernamen mit einer Zahl). Wer austreten will, kann das jederzeit. */
async function lbAutoJoin(){
  if(!lbOn()||!accTok||!accMe||S.lb.on||S.lb.ban||lbCheat()) return false;
  /* V64: der Server nimmt immer den Benutzernamen, der Bäckerei-Name bleibt unverändert */
  if(v64Ready&&lbTokOk){
    if(!S.lb.id) S.lb.id=lbUUID();
    S.lb.on=1;S.lb.t=0;
    try{await lbSubmit(true);}catch(x){}
    if(!S.lb.on) return false;
    save();toast(tt('Deine Bäckerei ist jetzt als „','You joined the leaderboard as “')+accMe.username+tt('“ in der Bestenliste.','”.'),true);
    if(v46Ready) setTimeout(()=>lbAccSync(true),1500);
    lbLast=0;return true;
  }
  const u=String(accMe.username||'').slice(0,16),okN=n=>typeof n==='string'&&/^[^<>]{2,20}$/.test(n.trim());
  const names=[];
  if(okN(S.name)) names.push(S.name.trim());
  if(okN(u)) names.push(u);
  for(let i=0;i<3&&u.length>=2;i++) names.push(u+' '+(10+Math.floor(Math.random()*990)));
  const was=S.name;
  if(!S.lb.id) S.lb.id=lbUUID();
  for(const nm of names){
    S.name=nm;S.lb.on=1;S.lb.t=0;
    try{
      await lbSubmit(true);
      save();showName();
      toast(nm===was?tt('Deine Bäckerei ist jetzt in der Bestenliste!','Your bakery joined the leaderboard!'):tt('Deine Bäckerei ist jetzt als „','Your bakery joined the leaderboard as “')+nm+tt('“ in der Bestenliste.','”.'),true);
      if(v46Ready) setTimeout(()=>lbAccSync(true),1500);
      lbLast=0;return true;
    }catch(x){
      const m=String(x&&x.message||'');
      if(/name taken|name not allowed|invalid name/.test(m)) continue;
      // Netz weg oder Server gerade nicht da: dabei bleiben, der Minuten-Takt schickt es später.
      save();showName();return true;
    }
  }
  S.name=was;S.lb.on=0;save();showName();return false;
}
v62Ready=true;
