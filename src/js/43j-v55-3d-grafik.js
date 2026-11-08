/* ======================= V55: 3D-Grafik (WebGL, ohne Bibliotheken) ======================= */
/* Der große Keks ist ein echtes 3D-Modell: Teig mit Wölbung, Krümelstruktur, gebräuntem Rand und erhabenen Schokostücken,
   beleuchtet von einem warmen Haupt- und einem kühlen Fülllicht. Er neigt sich zum Finger, hüpft beim Klick und dreht sich langsam.
   Goldkekse und die Kekse im Hintergrund werden einmal in 3D gerendert und als Bild benutzt. Ohne WebGL bleibt alles wie bisher. */
var v55Ready=false;
const G3D={on:false,gl:null,cv:null,prog:null,buf:null,ibuf:null,n:0,sig:'',spin:0,spinV:0,tx:0,ty:0,ptx:0,pty:0,kick:0,last:0,vis:true,slow:0,frames:0,ftime:0};
const g3dWanted=()=>S.opt.g3d!==false;
/* kleine Matrix-Helfer (Spalten-Reihenfolge wie WebGL) */
function m4mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++) for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}
function m4rot(ax,an){const c=Math.cos(an),s=Math.sin(an),m=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  if(ax==='x'){m[5]=c;m[6]=s;m[9]=-s;m[10]=c;}else if(ax==='y'){m[0]=c;m[2]=-s;m[8]=s;m[10]=c;}else{m[0]=c;m[1]=s;m[4]=-s;m[5]=c;}return m;}
function m4persp(fov,asp,n,f){const t=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m;}
const hexRgb=h=>{h=String(h||'#000').replace('#','');if(h.length===3) h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16)||0;return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const mixC=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
/* Keks-Modell: Oberseite (gewölbt) und Unterseite treffen sich am runden Rand. Je Ecke: Position, Normale, Farbe, Glanz. */
const G3D_MESH={};
function g3dMesh(sk,seed){
  if(!sk||!sk.c) sk=SKINS[0];
  const mk=JSON.stringify([sk.c,sk.chip,sk.chipS,sk.speck,seed||11]);if(G3D_MESH[mk]) return G3D_MESH[mk];
  const keys=Object.keys(G3D_MESH);if(keys.length>4) delete G3D_MESH[keys[0]];
  const r=rng(seed||11),R=60,SG=160,T=.21,TB=.11,c0=hexRgb(sk.c[0]),c1=hexRgb(sk.c[1]),c2=hexRgb(sk.c[2]),chC=hexRgb(sk.chip),chS=hexRgb(sk.chipS||sk.chip),spk=hexRgb(sk.speck||sk.stroke);
  const ph=[0,0,0,0,0,0].map(()=>r()*6.28),er=th=>1+.022*Math.sin(5*th+ph[0])+.014*Math.sin(9*th+ph[1])+.008*Math.sin(17*th+ph[2]);
  /* natürliche Teig-Struktur: Rauschen in mehreren Größen, leicht gedreht, damit kein Raster entsteht */
  const sd=Math.floor(r()*1e6),hsh=(a,b)=>{let n=Math.imul(a,374761393)+Math.imul(b,668265263)+Math.imul(sd,1442695)|0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;};
  const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return(hsh(xi,yi)*(1-u)+hsh(xi+1,yi)*u)*(1-v)+(hsh(xi,yi+1)*(1-u)+hsh(xi+1,yi+1)*u)*v;};
  const fbm=(x,y)=>{let t=0,a=.5,f=1;for(let o=0;o<5;o++){const c=Math.cos(o*.9+.3),q=Math.sin(o*.9+.3);t+=a*(vn((x*c-y*q)*f+o*17.3,(x*q+y*c)*f-o*9.1)-.5);f*=2.03;a*=.5;}return t;};
  const hn=(x,y,fine)=>.034*fbm(x*5.5,y*5.5)+.012*fbm(x*19,y*19)*(fine===undefined?1:fine);
  const chips=[];for(let k=0,tries=0;k<10&&tries<400;tries++){const a=r()*6.28,d=Math.sqrt(r())*.74,x=Math.cos(a)*d,y=Math.sin(a)*d;if(chips.every(c=>Math.hypot(c.x-x,c.y-y)>.27)){chips.push({x,y,rad:.085+r()*.05,h:.04+r()*.025,rot:r()*6.28});k++;}}
  const specks=[];for(let k=0;k<40;k++){const a=r()*6.28,d=Math.sqrt(r())*.92;specks.push([Math.cos(a)*d,Math.sin(a)*d,.012+r()*.018]);}
  const V=[],idx=[];
  const surf=(top)=>{
    const base=V.length/10;
    for(let i=0;i<=R;i++){const rho=i/R;for(let j=0;j<SG;j++){
      const th=j/SG*Math.PI*2,e=er(th),x=rho*e*Math.cos(th),y=rho*e*Math.sin(th);
      let z,col,gl=0;
      if(top){
        const prof=Math.pow(Math.max(0,1-Math.pow(rho,5)),1/3);
        let w=0,cc=null;for(const c of chips){const dx=x-c.x,dy=y-c.y,d=Math.hypot(dx,dy)/c.rad;const q=Math.exp(-Math.pow(d,4));if(q>w){w=q;cc=c;}}
        z=T*prof+prof*hn(x,y,smooth(.03,.28,rho))*(.35+.65*smooth(0,.2,rho))+(cc?w*cc.h*Math.pow(prof,.3):0);
        col=mixC(c0,c1,smooth(.15,.75,rho));col=mixC(col,c2,smooth(.8,1,rho)*.85);
        const tn=fbm(x*3.1+5,y*3.1-2);col=mixC(col,c2,Math.max(0,tn)*.9);col=mixC(col,mixC(c0,[1,1,1],.2),Math.max(0,-tn)*.6);
        for(const s of specks){if(Math.hypot(x-s[0],y-s[1])<s[2]){col=mixC(col,spk,.55);break;}}
        if(w>.12){const t=smooth(.12,.82,w);col=mixC(col,mixC(chS,chC,.35+.65*smooth(.5,1,w)),t);gl=t;}
      }else{
        z=-TB*Math.pow(Math.max(0,1-Math.pow(rho,7)),1/4);col=mixC(c2,c1,.25*(1-rho));col=mixC(col,[0,0,0],.18);
      }
      V.push(x,y,z,0,0,0,col[0],col[1],col[2],gl);
    }}
    for(let i=0;i<R;i++) for(let j=0;j<SG;j++){const a=base+i*SG+j,b=base+i*SG+(j+1)%SG,c=base+(i+1)*SG+j,d=base+(i+1)*SG+(j+1)%SG;if(top) idx.push(a,c,b,b,c,d);else idx.push(a,b,c,b,d,c);}
  };
  surf(true);surf(false);
  /* Normalen aus den Dreiecken */
  for(let k=0;k<idx.length;k+=3){const [a,b,c]=[idx[k]*10,idx[k+1]*10,idx[k+2]*10];const ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2],vx=V[c]-V[a],vy=V[c+1]-V[a+1],vz=V[c+2]-V[a+2];const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;[a,b,c].forEach(o=>{V[o+3]+=nx;V[o+4]+=ny;V[o+5]+=nz;});}
  for(let o=0;o<V.length;o+=10){const l=Math.hypot(V[o+3],V[o+4],V[o+5])||1;V[o+3]/=l;V[o+4]/=l;V[o+5]/=l;}
  return(G3D_MESH[mk]={v:new Float32Array(V),i:new Uint16Array(idx)});
}
const G3D_VS='attribute vec3 p;attribute vec3 n;attribute vec3 c;attribute float g;uniform mat4 M;uniform mat4 P;varying vec3 vN;varying vec3 vC;varying vec3 vW;varying float vG;void main(){vec4 w=M*vec4(p,1.);vW=w.xyz;vN=mat3(M)*n;vC=c;vG=g;gl_Position=P*w;}';
const G3D_FS='precision mediump float;varying vec3 vN;varying vec3 vC;varying vec3 vW;varying float vG;uniform float glow;'
  +'float h(vec3 q){return fract(sin(dot(q,vec3(12.9898,78.233,37.719)))*43758.5453);}'
  +'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(-vW);vec3 L1=normalize(vec3(-.55,.7,.9));vec3 L2=normalize(vec3(.8,-.3,.5));'
  +'float d1=max(dot(N,L1),0.);float d2=max(dot(N,L2),0.);vec3 H=normalize(L1+V);float sp=pow(max(dot(N,H),0.),mix(14.,70.,vG))*mix(.1,.6,vG);'
  +'float rim=pow(1.-max(dot(N,V),0.),3.)*.32;float gr=(h(floor(vW*260.))-.5)*.05*(1.-vG);'
  +'vec3 col=vC*(.34+d1*vec3(1.,.93,.82)*.95+d2*vec3(.55,.66,.95)*.3)+sp+rim*vec3(1.,.84,.55)+gr+glow*vC*.35;'
  +'gl_FragColor=vec4(pow(max(col,0.),vec3(.92)),1.);}';
function g3dInit(cv){
  let gl=null;try{gl=cv.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false})||cv.getContext('experimental-webgl');}catch(e){}
  if(!gl) return null;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));return o;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,G3D_VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,G3D_FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error('link');
  const R={gl,prog:pr,buf:gl.createBuffer(),ibuf:gl.createBuffer(),n:0,loc:{}};
  /* Ohne Grafikkarte (Software-Rendering) nur bei Bedarf zeichnen, damit der Prozessor nicht dauernd arbeitet */
  try{const ext=gl.getExtension('WEBGL_debug_renderer_info'),ren=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));R.soft=/swiftshader|llvmpipe|software|basic render/i.test(ren);}catch(e){R.soft=false;}
  ['p','n','c','g'].forEach(k=>R.loc[k]=gl.getAttribLocation(pr,k));['M','P','glow'].forEach(k=>R.loc[k]=gl.getUniformLocation(pr,k));
  gl.enable(gl.DEPTH_TEST);return R;
}
function g3dLoad(R,mesh){
  const gl=R.gl;gl.bindBuffer(gl.ARRAY_BUFFER,R.buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,R.ibuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);R.n=mesh.i.length;
}
function g3dDraw(R,w,h,rx,ry,rz,glow){
  const gl=R.gl;gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(R.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER,R.buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,R.ibuf);
  const st=40,L=R.loc;[['p',3,0],['n',3,12],['c',3,24],['g',1,36]].forEach(([k,sz,off])=>{gl.enableVertexAttribArray(L[k]);gl.vertexAttribPointer(L[k],sz,gl.FLOAT,false,st,off);});
  let M=m4rot('z',rz);M=m4mul(m4rot('x',rx),M);M=m4mul(m4rot('y',ry),M);M[14]-=3.45;
  gl.uniformMatrix4fv(L.M,false,M);gl.uniformMatrix4fv(L.P,false,m4persp(.64,w/h,.5,10));gl.uniform1f(L.glow,glow||0);
  gl.drawElements(gl.TRIANGLES,R.n,gl.UNSIGNED_SHORT,0);
}
/* Großer Keks */
function g3dAttach(){
  const btn=els.cookie;if(!btn) return;
  const old=btn.querySelector('canvas.c3d');
  if(!g3dWanted()){if(old) old.remove();G3D.on=false;btn.classList.remove('is3d');return;}
  const sk=skinOf(),sig=JSON.stringify(sk&&sk.c?[sk.c,sk.chip,sk.speck]:'0');
  if(old&&G3D.on&&G3D.sig===sig) return;
  let cv=old;
  if(!cv){cv=document.createElement('canvas');cv.className='c3d';cv.setAttribute('aria-hidden','true');btn.insertBefore(cv,btn.firstChild);}
  try{
    if(!G3D.R||G3D.cv!==cv){G3D.R=g3dInit(cv);G3D.cv=cv;}
    if(!G3D.R) throw new Error('no webgl');
    g3dLoad(G3D.R,g3dMesh(sk,11));G3D.sig=sig;G3D.on=true;btn.classList.add('is3d');G3D.dirty=1;
  }catch(e){cv.remove();G3D.on=false;G3D.R=null;btn.classList.remove('is3d');}
}
function g3dFrame(ts){
  requestAnimationFrame(g3dFrame);
  if(!G3D.on||document.hidden||!G3D.vis) return;
  const still=!fxOk(),soft=G3D.R&&G3D.R.soft;
  if(still&&!G3D.dirty) return;
  if(soft&&!G3D.dirty&&G3D.kick<.02&&Math.abs(G3D.ptx-G3D.tx)+Math.abs(G3D.pty-G3D.ty)<.004&&Math.abs(G3D.spinV)<.02) return;
  if(ts-G3D.last<(G3D.slow?66:33)&&!G3D.dirty) return;
  const dt=Math.min(.1,(ts-G3D.last)/1000||0);G3D.last=ts;
  const cv=G3D.cv,dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(64,Math.round(cv.clientWidth*dpr)),h=Math.max(64,Math.round(cv.clientHeight*dpr));
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  if(!still){G3D.spinV*=Math.pow(.15,dt);G3D.spin+=dt*(.11+G3D.spinV);G3D.kick*=Math.pow(.02,dt);G3D.tx+=(G3D.ptx-G3D.tx)*Math.min(1,dt*6);G3D.ty+=(G3D.pty-G3D.ty)*Math.min(1,dt*6);}
  const wob=still?0:Math.sin(ts/1700)*.045,t0=performance.now();
  g3dDraw(G3D.R,w,h,.3+G3D.tx+wob+G3D.kick*.25,G3D.ty+Math.cos(ts/2300)*(still?0:.04),G3D.spin,Math.min(1,G3D.kick*1.5));
  G3D.dirty=0;
  /* Zu langsam? Dann nur noch 15 Bilder pro Sekunde. */
  G3D.frames++;G3D.ftime+=performance.now()-t0;if(G3D.frames>=60){if(G3D.ftime/G3D.frames>12) G3D.slow=1;G3D.frames=0;G3D.ftime=0;}
}
/* Neigen zum Finger, Hüpfer beim Klick */
(function(){
  const stage=$id('cookieStage')||els.cookie;
  stage.addEventListener('pointermove',e=>{if(!G3D.on) return;G3D.dirty=1;const r=els.cookie.getBoundingClientRect();G3D.ptx=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height/2)))*-.22;G3D.pty=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)))*.26;});
  stage.addEventListener('pointerleave',()=>{G3D.ptx=0;G3D.pty=0;});
  els.cookie.addEventListener('pointerdown',()=>{if(!G3D.on) return;G3D.kick=Math.min(1.2,G3D.kick+.55);G3D.spinV+=(Math.random()<.5?-1:1)*.9;G3D.dirty=1;});
  try{new IntersectionObserver(es=>{G3D.vis=es[es.length-1].isIntersecting;}).observe(els.cookie);}catch(e){}
})();
/* Goldkeks und Hintergrund-Kekse: einmal in 3D rendern, dann als Bild verwenden */
const G3D_SPR={gold:null,rain:null,rainSig:''};
function g3dSprite(sk,size,rx,rz,glow){
  const cv=document.createElement('canvas');cv.width=cv.height=size;
  try{const R=g3dInit(cv);if(!R) return null;g3dLoad(R,g3dMesh(sk,11));g3dDraw(R,size,size,rx,0,rz,glow);const out=document.createElement('canvas');out.width=out.height=size;out.getContext('2d').drawImage(cv,0,0);const ext=R.gl.getExtension('WEBGL_lose_context');if(ext) ext.loseContext();return out;}catch(e){return null;}
}
function g3dSprites(){
  if(!g3dWanted()){if(G3D_SPR.rainOld){rain.sprite=G3D_SPR.rainOld;G3D_SPR.rainSig='';}return;}
  const sk=skinOf(),sig=JSON.stringify(sk&&sk.c?sk.c:'0');
  if(G3D_SPR.rainSig!==sig){const c=g3dSprite(sk,96,.35,.4,0);if(c){const s=document.createElement('canvas');s.width=s.height=48;s.getContext('2d').drawImage(c,0,0,48,48);if(!G3D_SPR.rainOld) G3D_SPR.rainOld=rain.sprite;rain.sprite=s;G3D_SPR.rainSig=sig;}}
  if(!G3D_SPR.gold){const gs=SKINS.find(s=>s.id==='gold')||SKINS[0],c=g3dSprite(gs,160,.32,.3,.35);if(c) G3D_SPR.gold=c.toDataURL('image/png');}
}
/* Startbildschirm: der Keks im aktuellen Design, einmal in 3D gerendert */
function g3dStartHtml(){
  if(!g3dWanted()) return null;
  const sk=skinOf(),sig=JSON.stringify(sk&&sk.c?[sk.c,sk.chip]:'0');
  if(G3D_SPR.startSig!==sig){const c=g3dSprite(sk,440,.3,.25,0);G3D_SPR.start=c?c.toDataURL('image/png'):null;G3D_SPR.startSig=sig;}
  return G3D_SPR.start?'<img class="st3d" src="'+G3D_SPR.start+'" alt="" draggable="false">':null;
}
function g3dGoldHtml(){return g3dWanted()&&G3D_SPR.gold?'<img class="gold3d" src="'+G3D_SPR.gold+'" alt="" draggable="false">':null;}

/* 3D-Look für alle gezeichneten Symbole: Licht von oben links, Glanzkante und weicher Schatten (ein SVG-Filter für alle) */
(function(){
  const d=document.createElement('div');d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML='<svg width="0" height="0" focusable="false"><defs><filter id="kf3d" x="-15%" y="-15%" width="130%" height="140%" color-interpolation-filters="sRGB">'
    +'<feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>'
    +'<feSpecularLighting in="b" surfaceScale="4.2" specularConstant="1.05" specularExponent="16" lighting-color="#ffffff" result="s"><feDistantLight azimuth="235" elevation="42"/></feSpecularLighting>'
    +'<feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>'
    +'<feDiffuseLighting in="b" surfaceScale="4.2" diffuseConstant="1.1" lighting-color="#ffffff" result="dl"><feDistantLight azimuth="235" elevation="52"/></feDiffuseLighting>'
    +'<feComposite in="SourceGraphic" in2="dl" operator="arithmetic" k1=".75" k2=".42" result="shaded"/>'
    +'<feComposite in="shaded" in2="s2" operator="arithmetic" k2="1" k3=".8" result="lit"/>'
    +'<feComposite in="lit" in2="SourceAlpha" operator="in" result="body"/>'
    +'<feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="sb"/><feOffset in="sb" dx="0" dy="2.2" result="so"/>'
    +'<feFlood flood-color="#000" flood-opacity=".38"/><feComposite in2="so" operator="in" result="shadow"/>'
    +'<feMerge><feMergeNode in="shadow"/><feMergeNode in="body"/></feMerge></filter></defs></svg>';
  document.body.appendChild(d);
})();
let g3dSprT=0;
function g3dSpritesLater(){clearTimeout(g3dSprT);g3dSprT=setTimeout(()=>{(window.requestIdleCallback||(f=>setTimeout(f,0)))(()=>g3dSprites(),{timeout:3000});},1200);}
function g3dApply(){
  document.documentElement.toggleAttribute('data-g3d',g3dWanted());
  g3dAttach();g3dSpritesLater();
  const c=$id('g3dChk');if(c) c.checked=g3dWanted();
}
/* Schalter unter Einstellungen → Anzeige */
(function(){
  const fx=$id('fx');if(!fx) return;
  const lab=document.createElement('label');lab.className='check';lab.style.marginTop='10px';
  lab.innerHTML='<input type="checkbox" id="g3dChk"> <span id="g3dT"></span>';
  fx.closest('label').insertAdjacentElement('afterend',lab);
  $id('g3dChk').addEventListener('change',e=>{S.opt.g3d=e.target.checked;g3dApply();save();});
})();
function updV55Txt(){set$('g3dT',tt('3D-Grafik (Keks und Symbole)','3D graphics (cookie and icons)'));}
updV55Txt();
v55Ready=true;
g3dApply();
requestAnimationFrame(g3dFrame);
