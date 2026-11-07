/* ===== Sammelbuch ===== */
const BOOKC=[
  {id:'mon',n:['Monster','Monsters'],list:()=>MON_KINDS.map((m,i)=>({has:!!S.book.mon[i],ic:monsterSVG(i,0),nm:tx(m.n)}))},
  {id:'pets',n:['Begleiter','Companions'],list:()=>PETS.map(p=>({has:!!S.w.pet.owned[p.id],ic:petSVG(p),nm:tx(p.n)}))},
  {id:'items',n:['Gegenstände','Items'],list:()=>ITEMS.map(it=>({has:!!S.items[it.id],ic:art(it.art),nm:tx(it.name)}))},
  {id:'gear',n:['Ausrüstung','Gear'],list:()=>SLOTS.flatMap(([s,nm,a])=>[0,1,2,3,4].map(i=>({has:!!S.book.gear[s+i],ic:art(a),nm:tx(GEARN[s][i])})))},
  {id:'pl',n:['Pflanzen','Plants'],list:()=>PLANTS.map(p=>({has:!!S.book.pl[p.id],ic:plantSVG(p.col,'ripe'),nm:tx(p.n)}))},
  {id:'vis',n:['Besucher','Visitors'],list:()=>VISITORS.map(v=>({has:!!S.book.vis[v.id],ic:avatarSVG(v.look),nm:tx(v.n)}))},
  {id:'b',n:['Gebäude','Buildings'],list:()=>B.map((b,i)=>({has:!!S.book.b[i]||S.b[i]>0,ic:art('b'+i),nm:tx(b.name)}))},
  {id:'dung',n:['Dungeons','Dungeons'],list:()=>DUNG.map(d=>({has:!!S.hero.clr[d.id],ic:destSVG(d.col),nm:tx(d.n)}))}
];
const bookDone=c=>c.list().every(x=>x.has);
function bookCount(){let a=0,t=0;BOOKC.forEach(c=>{const l=c.list();t+=l.length;a+=l.filter(x=>x.has).length;});return [a,t];}
function bookReady(){if(!S.book.cl.all&&BOOKC.every(c=>S.book.cl[c.id])) return true;return BOOKC.some(c=>!S.book.cl[c.id]&&bookDone(c));}
function claimBook(id){
  if(id==='all'){if(S.book.cl.all||!BOOKC.every(c=>S.book.cl[c.id])) return false;S.book.cl.all=1;giveStar(1,tt('Sammelbuch','Collection'));toast(tt('Sammelbuch komplett!','Collection complete!'),true);return true;}
  const c=BOOKC.find(x=>x.id===id);if(!c||S.book.cl[id]||!bookDone(c)) return false;
  S.book.cl[id]=1;recalc();toast(tt('Sammelbuch: ','Collection: ')+tx(c.n)+tt(' komplett! Produktion +2 %',' complete! Production +2%'),true);return true;
}
function bookR(){
  const [a,t]=bookCount(),allc=BOOKC.every(c=>S.book.cl[c.id]);
  let h='<section class="wsec first"><h3 class="wt">'+tt('Sammelbuch','Collection')+' · '+a+' / '+t+'</h3><p class="small wnote">'+tt('Hier siehst du alles, was du gefunden hast. Jede volle Seite gibt dauerhaft +2 % Produktion. Ist das ganze Buch voll, gibt es einen Sternenkrümel.','Here you see everything you have found. Every full page gives +2% production forever. When the whole book is full, you get a star crumb.')+'</p>';
  if(allc) h+='<div class="btns" style="margin-top:8px">'+(S.book.cl.all?'<span class="wk-on">'+tt('✓ Sternenkrümel abgeholt','✓ Star crumb claimed')+'</span>':'<button type="button" class="btn primary" data-bk2="all">'+tt('Sternenkrümel abholen','Claim star crumb')+'</button>')+'</div>';
  h+='</section>';
  BOOKC.forEach(c=>{
    const l=c.list(),n=l.filter(x=>x.has).length,done=n===l.length,cl=!!S.book.cl[c.id];
    h+='<section class="bcat"><h3 class="wt">'+tx(c.n)+' · '+n+' / '+l.length+(cl?' <span class="wk-on">+2 %</span>':done?' <button type="button" class="btn sm primary" data-bk2="'+c.id+'">'+tt('Belohnung abholen','Claim reward')+'</button>':'')+'</h3><div class="bgrid">'+l.map(x=>'<div class="bent'+(x.has?'':' no')+'"><span class="bi">'+x.ic+'</span>'+(x.has?x.nm:'???')+'</div>').join('')+'</div></section>';
  });
  return {html:h,live:{},wid:{}};
}

