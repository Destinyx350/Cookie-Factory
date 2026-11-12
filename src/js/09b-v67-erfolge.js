/* ======================= V67: Erfolge für die neuen Funktionen ======================= */
/* Steht vor dem Laden des Spielstands, damit gespeicherte Erfolge erhalten bleiben. Die Merker liegen in S.xf (siehe 43v). */
const xfHas=k=>!!(typeof S!=='undefined'&&S&&S.xf&&S.xf[k]);
A.push(
  {id:'x_tut',name:['Gut angefangen','Off to a Great Start'],desc:()=>tt('Schaffe alle ersten Schritte.','Finish all first steps.'),test:()=>S.tut&&S.tut.i>=TUT.length},
  {id:'x_lb',name:['Auf der Liste','On the Board'],desc:()=>tt('Sei mit deinem Konto in der Bestenliste.','Be on the leaderboard with your account.'),test:()=>!!(S.lb&&S.lb.on&&typeof accTok!=='undefined'&&accTok)},
  {id:'x_style',name:['Mein Stil','My Style'],desc:()=>tt('Gestalte dein Profil (Avatar, Farbe oder Motto).','Style your profile (avatar, color or motto).'),test:()=>xfHas('style')},
  {id:'x_share',name:['Sag es weiter','Spread the Word'],desc:()=>tt('Teile dein Profil.','Share your profile.'),test:()=>xfHas('share')},
  {id:'x_name',name:['Neuer Name','A Fresh Name'],desc:()=>tt('Ändere deinen Benutzernamen.','Change your username.'),test:()=>xfHas('rename')},
  {id:'x_top10',name:['Unter den Besten','Top Ten'],desc:()=>tt('Komm in einer Bestenliste unter die ersten 10.','Reach the top 10 on any leaderboard.'),test:()=>xfHas('top10')}
);
