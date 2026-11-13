/* ======================= V70: Erfolge für Kundenbewertungen ======================= */
/* Steht vor dem Laden des Spielstands, damit gespeicherte Erfolge erhalten bleiben. Die Bewertungen liegen in S.rv (siehe 43zb). */
A.push(
  {id:'x_rv5',name:['Fünf Sterne','Five Stars'],desc:()=>tt('Bekomm eine Bewertung mit 5 Sternen.','Get a 5-star review.'),test:()=>!!(S.rv&&S.rv.b5)},
  {id:'x_rv45',name:['Lieblingsbäckerei','Beloved Bakery'],desc:()=>tt('Erreiche eine Bewertung von 4,5 Sternen mit 20 Bewertungen.','Reach a 4.5-star rating with 20 reviews.'),test:()=>!!(S.rv&&S.rv.l&&S.rv.l.length>=20&&rvAvg()>=4.5)}
);
