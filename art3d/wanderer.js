// Prismatic Wanderer: geometry authored against the front turnaround in reference/.
// Uses the shared rest-space rig; the female profile fits body, clothing and bones together.
(function(){
"use strict";
const {G,U}=H3,{clamp,sstep,seg2}=U,TAU=Math.PI*2;
const C={skin:"#e6aa88",rose:"#c77a6d",lip:"#b66157",hair:"#a84f2e",hairDark:"#693225",copper:"#ca6635",hairLight:"#e58c4e",
 teal:"#327f8b",tealLight:"#4397a0",tealDark:"#225564",sleeve:"#647d99",gold:"#d9a358",goldLight:"#f1ca7c",leather:"#86523b",leatherDark:"#58382f",leatherLight:"#b57850",
 violet:"#524a73",violetLight:"#776485",violetDark:"#39364f",pants:"#454354"};
const from=(...tags)=>({from:tags});
function line(points,r,color,bind,name,mat){return G.tube(points.map(p=>({p,r})),{seg:6,steps:2,color,mat:mat||"cloth",bind,name,ink:false})}
function ell(p,r,color,bind,name,mat){return G.xform(G.ball(...r,{seg:16,rings:8,color,mat:mat||"skin",bind,name,tag:name,ink:false}),{t:p})}
function ring(cx,cy,rz,rx,color,bind,name){
 return line(Array.from({length:33},(_,i)=>[cx+rx*Math.sin(i/32*TAU),cy+rx*Math.cos(i/32*TAU),rz]),0.0027,color,bind,name,"gold");
}
// Eight-point compass rose with long cardinal points and a suspended diamond.
function compass(x,y,r,w){
 const rr=Math.hypot(x,y);if(Math.abs(rr-r*.70)<w)return true;
 if(Math.abs(x)<w&&Math.abs(y)<r*1.35||Math.abs(y)<w&&Math.abs(x)<r*1.18)return true;
 for(let i=0;i<8;i++){
  const a=i*TAU/8,dx=Math.sin(a),dy=Math.cos(a),along=x*dx+y*dy,across=Math.abs(x*dy-y*dx),len=r*(i%2?.66:1.08);
  if(along>0&&along<len&&Math.abs(across-(1-along/len)*r*.17)<w*.85)return true;
 }
 const dy=y+r*1.53;
 return Math.abs(Math.abs(x)+Math.abs(dy)-r*.12)<w&&Math.abs(dy)<r*.15;
}
// Remap the old rig's short legs / oversized head to the sheet's seven-head adult figure.
const profileKeys=[[0,0,1],[.11,.12,.9],[.37,.50,1],[.66,.88,.96],[.88,1.075,.76],[1.13,1.33,.91],[1.25,1.475,.97],[1.32,1.515,.75],[1.8,1.805,.75]];
function profile(p){
 let i=1;while(i<profileKeys.length-1&&p[1]>profileKeys[i][0])i++;
 const a=profileKeys[i-1],b=profileKeys[i],t=(p[1]-a[0])/(b[0]-a[0]),sx=a[2]+(b[2]-a[2])*sstep(0,1,t);
 const depth=p[1]>1.32?.72:p[1]>.88?.89:.94;
 return[p[0]*sx,a[1]+(b[1]-a[1])*t,p[2]*depth];
}
H3.wanderer={profile};

// Female anatomy: shaped face, copper waves, bare arms and individual fingers.
const baseBuild=H3.body.build;
H3.body.build=function(o){
 const b=baseBuild(o);if(!o||o.variant!=="female")return b;
 b.meshes=b.meshes.filter(m=>!/^head|^hair|^hand\./.test(m.tag));
 b.bones=[];const M=b.meshes;
 for(const m of M){
  if(m.tag.startsWith("arm.")){m.pal=[{c:C.skin,mat:"skin"}];m.paint=null;m.mat="skin";
   // Remove the undershirt cuff; the new short sleeves belong to the body slot.
   if(m.v.length<250)m.v.forEach(p=>p[0]*=.96);
  }
  if(m.tag.startsWith("leg.")){m.pal=[{c:C.pants,mat:"cloth"},{c:"#565063",mat:"cloth",line:false}];m.paint=p=>Math.sin(p[1]*56+Math.abs(p[0])*24)>.87?1:0;}
  if(m.tag==="neck"){m.color=C.skin;m.pal=null;}
 }
 // Old cuff is a separate arm mesh, so discard it instead of leaving a ring of skin.
 b.meshes=M.filter(m=>!m.tag.startsWith("arm.")||m.v.length>250);
 const headKeys=[{y:1.325,rx:.025,rz:.03,cz:.05},{y:1.36,rx:.066,rz:.071,cz:.039},{y:1.415,rx:.102,rz:.102,cz:.027},
  {y:1.48,rx:.137,rz:.132,cz:.018},{y:1.55,rx:.142,rz:.145,cz:.013},{y:1.64,rx:.14,rz:.146,cz:0},{y:1.715,rx:.105,rz:.111,cz:-.005},{y:1.755,rx:.028,rz:.033,cz:-.008}];
 const face=G.loft(headKeys,{seg:64,steps:5,tag:"head",mat:"skin",bind:"head",
  pal:[{c:C.skin,mat:"skin"},{c:"#f1b995",mat:"skin",line:false},{c:C.rose,mat:"skin",line:false},{c:C.lip,mat:"skin",line:false}],
  paint:p=>{
   if(p[2]<.06)return 0;
   if(Math.abs(p[0])<.032&&Math.abs(p[1]-(1.422+.12*Math.abs(p[0])))<.005)return 3;
   if(Math.abs(Math.abs(p[0])-.09)<.027&&Math.abs(p[1]-1.478)<.02)return 2;
   return Math.abs(p[0])<.05&&p[1]>1.47?1:0;
  }});
 for(const p of face.v)if(p[2]>0){
  const cheek=Math.exp(-(((Math.abs(p[0])-.086)/.04)**2+((p[1]-1.49)/.045)**2));
  const nose=Math.exp(-((p[0]/.018)**2+((p[1]-1.496)/.042)**2));
  const socket=Math.exp(-(((Math.abs(p[0])-.065)/.033)**2+((p[1]-1.55)/.025)**2));
  p[2]+=.008*cheek+.025*nose-.007*socket;
 }
 b.meshes.push(face);
 // Eyes sit on the face surface, with almond-shaped openings and tilted outer corners.
 for(const s of[-1,1]){
  const cx=s*.064,cy=1.548;
  const eye=G.sheet((u,v)=>{
   const x=(u*2-1)*.034,arc=Math.sin(u*Math.PI)**.72,y=cy+s*x*.12+arc*(v*2-1)*(v>.5?.020:.014);
   return[cx+x,y,.159-.23*Math.abs(cx+x)+.002*arc];
  },24,8,{tag:"head",mat:"skin",bind:"head",ink:false,
   pal:[{c:"#f6e6cc",mat:"skin",line:false},{c:"#3c542d",mat:"skin",line:false},{c:"#849953",mat:"skin",line:false},{c:"#222b23",mat:"skin",line:false},{c:"#fff5db",mat:"glow",line:false}],
   paint:p=>{const x=(p[0]-cx)/.015,y=(p[1]-cy)/.023,d=x*x+y*y;
    if(((p[0]-cx+.004)/.004)**2+((p[1]-cy-.006)/.005)**2<1)return 4;
    return d<.26?3:d<.77?2:d<1?1:0;}});
  eye.bias=.002;b.meshes.push(eye);
  const lash=[],lower=[];
  for(let i=0;i<=16;i++){const u=i/16,x=(u*2-1)*.034,arc=Math.sin(u*Math.PI)**.72;
   lash.push([cx+x,cy+s*x*.12+arc*.020,.161-.23*Math.abs(cx+x)]);
   lower.push([cx+x,cy+s*x*.12-arc*.014,.160-.23*Math.abs(cx+x)]);}
  b.meshes.push(line(lash,.0033,"#442b28","head","head"),line(lower,.0013,"#a66553","head","head"));
  const brow=G.tube([{p:[s*.031,1.592,.155],rx:.006,ry:.005},{p:[s*.061,1.611,.144],rx:.008,ry:.005},{p:[s*.101,1.592,.126],rx:.002,ry:.002}],
   {seg:6,steps:4,tag:"head",mat:"hair",color:"#683727",bind:"head",ink:false});b.meshes.push(brow);
  b.meshes.push(ell([s*.14,1.516,0],[.019,.038,.023],C.skin,"head","head.ears"));
  b.meshes.push(ell([s*.151,1.516,.014],[.008,.021,.013],C.rose,"head","head.ears"));
  // Subtle freckles across the cheeks.
  for(let i=0;i<5;i++)b.meshes.push(ell([s*(.059+i*.009),1.487+(i%2)*.009,.145-i*.004],[.0017,.002,.001],"#b77857","head","head"));
 }
 b.meshes.push(ell([0,1.486,.174],[.013,.014,.014],C.skin,"head","head"));
 b.meshes.push(ell([0,1.416,.139],[.023,.006,.005],"#d18a76","head","head"));
 b.meshes.push(line([[-.025,1.425,.139],[-.01,1.427,.146],[0,1.424,.149],[.01,1.427,.146],[.025,1.425,.139]],.0018,"#8e4f45","head","head"));
 // Closed crown under overlapping, tapered, flattened locks. No painted hairline on skin.
 b.meshes.push(G.loft([{y:1.57,rx:.148,rz:.154,cz:-.018},{y:1.66,rx:.158,rz:.165,cz:-.014},{y:1.73,rx:.124,rz:.131,cz:-.012},{y:1.78,rx:.06,rz:.07,cz:-.018},{y:1.795,rx:.012,rz:.017,cz:-.022}],
  {seg:20,steps:2,open:y=>y<1.7?1.25:0,cap:false,twoSided:true,back:C.hairDark,tag:"hair.top",mat:"hair",color:C.hair,bind:"head"}));
 const lock=(pts,widths,color,tag,bind)=>G.tube(pts.map((p,i)=>({p,rx:widths[i]*.36,ry:widths[i]})),
  {seg:6,steps:4,up:[0,0,1],tag,mat:"hair",color,bind:bind||"head",ink:false});
 // Layered waves around the back, curling out at the shoulder line.
 for(let i=0;i<11;i++){
  const a=-Math.PI*.76+i*Math.PI*1.52/10,x=Math.sin(a),z=-Math.cos(a),side=x<0?-1:1;
  b.meshes.push(lock([[x*.10,1.75,z*.105-.02],[x*.145,1.62,z*.15-.025],[x*.161+side*.01,1.48,z*.165-.03],
   [x*.17-side*.015,1.34,z*.17-.045],[x*.17+side*.035,1.26+(i%3)*.02,z*.15-.04],[x*.17+side*.055,1.30,z*.13-.045]],
   [.018,.047,.048,.042,.028,.001],i%3===0?C.copper:i%3===1?C.hair:C.hairDark,"hair.back",{bones:["head","neck"],power:5}));
 }
 // Big side-swept fringe, part above the character's left eye.
 const fringe=[
  [[.032,1.787,.024],[.016,1.77,.127],[-.05,1.699,.168],[-.133,1.636,.14],[-.194,1.63,.078]],
  [[.057,1.779,.061],[.03,1.749,.151],[-.033,1.669,.175],[-.12,1.617,.148],[-.166,1.59,.09]],
  [[.025,1.79,.035],[-.043,1.769,.108],[-.125,1.69,.125],[-.163,1.584,.062],[-.196,1.535,.07]],
  [[.051,1.778,.055],[.093,1.723,.147],[.128,1.656,.141],[.172,1.62,.112],[.189,1.646,.075]],
  [[.059,1.77,.018],[.122,1.728,.087],[.163,1.65,.06],[.169,1.53,.048],[.2,1.48,.036]]
 ];
 fringe.forEach((pts,i)=>b.meshes.push(lock(pts,[.012,.037,.032,.020,.001],i%2?C.copper:C.hair,"hair.front")));
 // Temple locks frame the face, leave both eyes visible, and have independent springs.
 for(const s of[-1,1]){
  const name="hair.lock."+(s>0?"L":"R");b.bones.push({name,parent:"head",head:[s*.145,1.56,-.01],tail:[s*.17,1.27,-.012],spring:{stiff:65,drag:.3,grav:1,wind:.1,r:.006}});
  for(let i=0;i<3;i++)b.meshes.push(lock([[s*(.14+i*.008),1.64-i*.035,.045-i*.045],[s*(.17+i*.01),1.50,.025-i*.035],
   [s*(.146+i*.012),1.39,-.003-i*.025],[s*(.18+i*.012),1.29+i*.014,.015-i*.035],[s*(.21+i*.009),1.32+i*.015,.005-i*.02]],
   [.022,.028,.026,.018,.001],i===1?C.copper:C.hair,"hair.back",{fn:p=>{const w=1-sstep(1.28,1.58,p[1]);return[["head",1-w],[name,w]]}}));
 }
 // Hands: a small palm, four separated fingers, and the opposed thumb.
 for(const[s,S]of[[1,"L"],[-1,"R"]]){
  b.meshes.push(G.loft([{y:.732,rx:.029,rz:.032,cx:s*.347,cz:.034},{y:.69,rx:.032,rz:.036,cx:s*.354,cz:.038},{y:.646,rx:.028,rz:.035,cx:s*.36,cz:.04}],
   {seg:16,steps:3,tag:"hand."+S,color:C.skin,mat:"skin",bind:"hand."+S}));
  for(let i=0;i<4;i++){
   const z=.014+i*.018,len=[.071,.083,.077,.059][i];
   b.meshes.push(G.tube([{p:[s*(.343+i*.007),.653,z],r:.009},{p:[s*(.351+i*.007),.62,z+.002],r:.009},
    {p:[s*(.354+i*.007),.65-len,z+.006],r:.007},{p:[s*(.35+i*.007),.645-len,z+.007],r:.003}],
    {seg:8,steps:3,tag:"hand."+S,mat:"skin",color:C.skin,bind:"fingers."+S,ink:false}));
  }
  b.meshes.push(G.tube([{p:[s*.345,.698,.066],r:.013},{p:[s*.331,.674,.084],r:.012},{p:[s*.328,.647,.09],r:.009},{p:[s*.333,.634,.088],r:.003}],
   {seg:8,steps:3,tag:"hand."+S,mat:"skin",color:C.skin,bind:"hand."+S,ink:false}));
 }
 return b;
};

// Fitted bodice, short blue sleeves and three open embroidered skirt panels.
H3.gear.register({id:"wanderer_tunic",slot:"body",name:"Wanderer's embroidered tunic",hides:["torso"],
 colors:{main:C.teal,sleeve:C.sleeve,trim:C.gold,belt:C.leather},
 build(ctx){
 const M=[],c=ctx.col,bind=from("torso"),gold=c("trim");
 const torso=G.loft(ctx.body.inflate(ctx.dims.rings.torso.filter(r=>r.y>=.66),.012),{seg:20,steps:3,name:"wanderer.bodice",mat:"cloth",bind,
  pal:[{c:c("main")},{c:C.tealDark,line:false},{c:gold,line:false},{c:C.skin,mat:"skin"}],
  paint:p=>{const ax=Math.abs(p[0]);if(p[2]>.02&&p[1]>1.18+ax*.62)return 3;
   if(p[2]>.08&&Math.abs(p[1]-1.18-ax*.62)<.005)return 2;
   if(p[2]>.08&&Math.abs(ax-(.07+.15*(p[1]-.88)))<.0025&&p[1]>.9)return 1;
   if(p[2]>.08&&Math.abs(p[0])<.003&&p[1]>.92&&p[1]<1.13)return 2;
   return 0;}});
 M.push(torso);
 for(const[s,S]of[[1,"L"],[-1,"R"]]){
  const keys=ctx.dims.rings.arm[S].filter(r=>r.y>=1.13).map(r=>({...r,rx:r.rx+.018,rz:r.rz+.018}));
  keys.push({y:1.04,rx:.087,rz:.085,cx:s*.279,cz:.008});
  M.push(G.loft(keys,{seg:10,steps:2,mat:"cloth",name:"wanderer.sleeve",bind:from("arm."+S),
   pal:[{c:c("sleeve")},{c:"#8496aa",line:false}],paint:p=>p[1]<1.067?1:0}));
 }
 // Panels are separate surfaces. Gaps at the thighs reveal indigo trousers.
 const panel=(angle,width,back)=>{
  const surf=(u,v)=>{
   const a=angle+(u-.5)*width,rx=.2+.075*v,rz=.143+.057*v,fold=.008*Math.cos(u*Math.PI*4)*v;
   const y=.84-.41*v+(angle===0?-.013*v:0)+.018*Math.cos(u*TAU)*v;
   return[(rx+fold)*Math.sin(a),y,(rz+fold)*Math.cos(a)];};
  const mesh=G.sheet(surf,10,9,{name:"wanderer.skirt",mat:"cloth",back:C.tealDark,bind:from("hips","torso"),
   pal:[{c:c("main")},{c:gold,line:false},{c:C.tealDark,line:false}],
   paint:p=>{
    const a=Math.atan2(p[0],p[2]),u=(a-angle)/width+.5,v=(.84-p[1])/.41;
    if(u<.035||u>.965||v>.965)return 2;
    if(u>.06&&u<.075||u>.925&&u<.94||v>.93&&v<.945)return 1;
    if(angle===0){if(compass(p[0],(p[1]-.65)*1.05,.068,.0017))return 1;}
    // Angular vines, small diamonds and crossed hem flourishes.
    if(v>.66){const dx=(u-.5)*2,dy=(v-.83)*3;
     if(Math.abs(Math.abs(dx)+Math.abs(dy)-.80)<.025||Math.abs(dy-.30*Math.cos(dx*8))<.023&&Math.abs(dx)>.32)return 1;}
    if(v>.1&&v<.9&&(u<.16||u>.84)){const q=(v*5)%1,d=Math.abs((u<.5?u:1-u)-.115);
     if(Math.abs(d*13+Math.abs(q-.5)-.21)<.045)return 1;}
    return 0;
   }});
  if(!back)mesh.bias=.001;M.push(mesh);
 };
 panel(0,.85);panel(1.08,.87);panel(-1.08,.87);panel(Math.PI,1.65,true);panel(-2.12,.8,true);panel(2.12,.8,true);
 // Leather and gold shoulder guard on the character's LEFT.
 const cap=G.loft([{y:1.27,rx:.04,rz:.067,cx:.19},{y:1.24,rx:.085,rz:.108,cx:.218},{y:1.16,rx:.091,rz:.104,cx:.254},
  {y:1.125,rx:.103,rz:.106,cx:.266}],{seg:12,steps:2,mat:"leather",name:"wanderer.pauldron",bind:from("arm.L","torso"),
  pal:[{c:C.leather},{c:gold,line:false},{c:C.leatherLight,line:false}],paint:p=>p[1]<1.137||p[1]>1.253?1:p[0]>.28?2:0});M.push(cap);
 for(const x of[.20,.25,.30])M.push(ell([x,1.22-(x-.20)*.6,.106],[.004,.006,.003],gold,from("arm.L"),"wanderer.rivet","gold"));
 // Waist belt. Buckle is an open frame, not a solid yellow block.
 M.push(G.loft([{y:.855,rx:.197,rz:.145,e:2.8},{y:.902,rx:.193,rz:.144,e:2.8}],{seg:32,steps:1,mat:"leather",color:c("belt"),bind,name:"wanderer.belt"}));
 const frame=(x,y,z,w,h,binding)=>{
  const m=line([[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[x-w/2,y-h/2,z]],.003,gold,binding,"wanderer.buckle","gold");M.push(m);
  M.push(line([[x,y-h*.4,z+.002],[x+w*.1,y+h*.4,z+.002]],.002,gold,binding,"wanderer.buckle","gold"));
 };
 frame(-.04,.881,.154,.051,.035,bind);
 // Baldric over right shoulder down to left hip, following the bodice surface.
 const strap=G.sheet((u,v)=>{
  const y=1.24-.37*v,x=-.14+.28*v+(u-.5)*.032;
  const rz=.151-.013*v,rx=.20-.015*v;
  return[x,y,rz*Math.pow(Math.max(.1,1-Math.abs(x/rx)**2.8),1/2.8)+.008];
 },3,24,{name:"wanderer.baldric",mat:"leather",bind,
  pal:[{c:c("belt")},{c:gold,line:false}],paint:p=>Math.abs(p[0]-(-.14+(1.24-p[1])/.37*.28))>.012&&(p[1]*60)%1<.38?1:0});strap.bias=.003;M.push(strap);
 // Visible back half of the same cross-body strap.
 M.push(G.sheet((u,v)=>{const y=1.24-.36*v,x=-.14+.28*v+(u-.5)*.032;return[x,y,-.14*Math.sqrt(Math.max(.2,1-(x/.21)**2))-.01]},3,18,
  {name:"wanderer.baldric.back",mat:"leather",color:c("belt"),bind}));
 // Left hip pouch: boxy gussets, overlapping flap, strap and small gold buckle.
 M.push(G.loft([{y:.857,rx:.052,rz:.022,cx:.163,cz:.126,e:4},{y:.78,rx:.058,rz:.036,cx:.177,cz:.134,e:4},{y:.724,rx:.05,rz:.03,cx:.185,cz:.14,e:4}],
  {seg:12,steps:2,color:C.leather,mat:"leather",bind,name:"wanderer.pouch"}));
 M.push(G.sheet((u,v)=>[.123+u*.108+v*.01,.85-v*(.06+.01*Math.sin(u*Math.PI)),.164+v*.013],6,4,
  {name:"wanderer.pouch.flap",mat:"leather",color:C.leatherLight,bind}));
 M.push(line([[.18,.848,.178],[.185,.745,.182]],.008,C.leatherDark,bind,"wanderer.pouch.strap","leather"));frame(.183,.797,.186,.018,.022,bind);
 // Small belt tail opposite the pouch.
 M.push(G.xform(G.box(.027,.17,.012,{color:C.leather,mat:"leather",bind,name:"wanderer.belt.tail"}),{rz:-.24,t:[-.17,.766,.133]}));
 return{meshes:M};
}});

// Hood-down mantle and a wide angular cloak reaching the upper boots.
H3.gear.register({id:"wanderer_cape",slot:"back",name:"Violet compass cloak",colors:{main:C.violet,fold:C.violetDark,lining:C.violetLight,trim:C.gold},
 build(ctx){
 const M=[],bones=[],c=ctx.col,bind=from("torso","neck");
 for(let i=0;i<7;i++)for(let k=0;k<3;k++){
  const name="wanderer.cape."+i+"."+k,x=(i-3)*.085,y=1.24-k*.31;
  bones.push({name,parent:k?"wanderer.cape."+i+"."+(k-1):"chest",head:[x,y,-.17],tail:[x,y-.31,-.2],spring:{stiff:[75,48,30][k],drag:.3,grav:5,wind:.4,r:.012}});
 }
 const hem=u=>.245+.10*Math.abs(u*2-1)+.025*Math.cos(u*TAU*3);
 const surface=(u,v)=>{
  const t=u*2-1,x=t*(.235+.185*v),y=1.265-.075*Math.abs(t)+(hem(u)-1.265+.075*Math.abs(t))*v;
  const z=-.156-.045*v-.06*v*v+.04*Math.cos(u*TAU*5)*(.25+.75*v)+.045*Math.abs(t)**3;
  return[x,y,z];
 };
 const cloth=G.sheet(surface,28,15,{name:"wanderer.cloak",mat:"cloth",back:c("lining"),
  pal:[{c:c("main")},{c:c("fold"),line:false},{c:c("lining"),line:false},{c:c("trim"),line:false}],
  paint:p=>{
   const v=clamp((1.25-p[1])/1.0,0,1),u=(p[0]/(.235+.185*v)+1)/2,h=p[1]-hem(u);
   if(h<.011)return 1;
   if(h>.017&&h<.021)return 3;
   if(compass(p[0],(p[1]-1.02),.074,.0021)&&p[1]>.86)return 3;
   const valley=Math.cos(u*TAU*5);return valley<-.55?1:valley>.8?2:0;
  }});
 cloth.bind={fn:p=>{
  const v=clamp((1.24-p[1])/.94,0,1),u=clamp((p[0]/(.235+.185*v)+1)*3,0,6),i=Math.round(u),k=Math.min(2,Math.floor(v*3));
  const w=sstep(1.26,1.12,p[1]);return[["chest",1-w],["wanderer.cape."+i+"."+k,w]];
 }};M.push(cloth);
 // Rolled hood and two overlapping triangular folds around the neck.
 const hood=G.loft([{y:1.35,rx:.085,rz:.083,cz:-.03},{y:1.30,rx:.155,rz:.143,cz:-.035},{y:1.23,rx:.234,rz:.165,cz:-.025},
  {y:1.18,rx:.251,rz:.16,cz:-.017}],{seg:16,steps:2,open:y=>.47+(1.35-y)*4,cap:false,twoSided:true,back:c("fold"),name:"wanderer.hood.down",mat:"cloth",color:c("main"),bind});M.push(hood);
 for(const s of[-1,1]){
  M.push(G.sheet((u,v)=>[s*(.025+.20*u),1.285-.14*u-.03*v,.10+.045*Math.sin(u*Math.PI)-.11*v],8,3,
   {name:"wanderer.mantle.fold",mat:"cloth",color:s<0?c("main"):c("lining"),back:c("fold"),bind}));
  M.push(line([[s*.035,1.255,.119],[s*.12,1.25,.142],[s*.225,1.18,.075]],.006,c("fold"),bind,"wanderer.mantle.edge"));
 }
 // Two compass brooches and connecting chain at the collar.
 for(const[x,y,r]of[[0,1.245,.025],[-.039,1.216,.021]]){
  M.push(ell([x,y,.158],[r,r,.008],C.leatherDark,bind,"wanderer.brooch","leather"),ring(x,y,.168,r,c("trim"),bind,"wanderer.brooch"));
  M.push(line([[x-r*.6,y,.171],[x+r*.6,y,.171]],.0016,C.goldLight,bind,"wanderer.brooch","gold"),line([[x,y-r*.65,.171],[x,y+r*.65,.171]],.0016,C.goldLight,bind,"wanderer.brooch","gold"));
 }
 return{meshes:M,bones};
}});

// Tall angular boots and folded cuffs, matching the exposed shin length on the sheet.
H3.gear.register({id:"wanderer_boots",slot:"feet",name:"Tall folded leather boots",hides:["foot"],colors:{main:C.leather,trim:C.leatherLight,sole:C.leatherDark},
 build(ctx){const M=[],c=ctx.col;
 for(const[s,S]of[[1,"L"],[-1,"R"]]){
  const x=s*.098,bind={bones:["shin."+S,"foot."+S],power:5};
  const foot=G.loft([{y:0,rx:.074,rz:.128,cz:.052,e:3},{y:.026,rx:.078,rz:.13,cz:.052,e:3},{y:.047,rx:.077,rz:.124,cz:.046,e:3},
   {y:.084,rx:.063,rz:.085,cz:.025,e:2.5},{y:.13,rx:.058,rz:.064}],{seg:16,steps:2,name:"wanderer.boot.foot",mat:"leather",bind,
   pal:[{c:c("main")},{c:c("sole")},{c:c("trim"),line:false}],paint:p=>p[1]<.022?1:p[1]<.029?2:0});G.xform(foot,{ry:s*.11,t:[x,0,0]});M.push(foot);
  M.push(G.loft([{y:.10,rx:.060,rz:.066,cx:x},{y:.18,rx:.064,rz:.074,cx:x},{y:.26,rx:.072,rz:.077,cx:x},{y:.325,rx:.081,rz:.078,cx:x}],
   {seg:12,steps:2,name:"wanderer.boot.shaft",mat:"leather",color:c("main"),bind:"shin."+S}));
  const cuff=G.loft([{y:.285,rx:.087,rz:.091,cx:x},{y:.32,rx:.091,rz:.094,cx:x},{y:.35,rx:.103,rz:.098,cx:x}],
   {seg:8,steps:1,name:"wanderer.boot.cuff",mat:"leather",color:c("trim"),bind:"shin."+S});M.push(cuff);
  // Folded V at the cuff, reinforced shin seam and two crossed ankle straps.
  M.push(line([[x-.085,.334,.089],[x,.296,.105],[x+.085,.335,.089]],.013,c("main"),"shin."+S,"wanderer.boot.fold","leather"));
  M.push(line([[x,.295,.085],[x+.012,.21,.078],[x,.13,.069]],.004,c("trim"),"shin."+S,"wanderer.boot.seam","leather"));
  for(const sign of[-1,1])M.push(line([[x+sign*.059,.16,.056],[x,.12,.083],[x-sign*.055,.092,.066]],.009,c("trim"),bind,"wanderer.boot.strap","leather"));
  M.push(line([[x-.046,.053,.156],[x,.06,.172],[x+.046,.053,.156]],.003,c("trim"),"foot."+S,"wanderer.boot.toe","leather"));
 }
 return{meshes:M};
}});

H3.gear.register({id:"wanderer_bracers",slot:"hands",name:"Leather bracers & fingerless gloves",colors:{main:C.leather,trim:C.leatherLight},
 build(ctx){const M=[],c=ctx.col;
 for(const[s,S]of[[1,"L"],[-1,"R"]]){
  const bind={bones:["forearm."+S,"hand."+S],power:6};
  M.push(G.loft([{y:.714,rx:.043,rz:.049,cx:s*.348,cz:.034},{y:.765,rx:.05,rz:.055,cx:s*.339,cz:.03},
   {y:.86,rx:.063,rz:.066,cx:s*.322,cz:.022},{y:.905,rx:.063,rz:.066,cx:s*.312,cz:.018}],
   {seg:10,steps:2,name:"wanderer.bracer",mat:"leather",color:c("main"),bind}));
  M.push(G.loft([{y:.648,rx:.034,rz:.04,cx:s*.36,cz:.04},{y:.70,rx:.037,rz:.043,cx:s*.354,cz:.038},{y:.73,rx:.037,rz:.042,cx:s*.347,cz:.034}],
   {seg:12,steps:2,name:"wanderer.glove",mat:"leather",color:C.leatherDark,bind:"hand."+S}));
  for(const[y,x,z]of[[.745,.342,.088],[.865,.318,.087]])M.push(line([[s*(x-.045),y+.01,z-.008],[s*x,y-.012,z+.006],[s*(x+.04),y+.018,z-.01]],.007,c("trim"),bind,"wanderer.bracer.strap","leather"));
  M.push(line([[s*.30,.898,.075],[s*.33,.81,.09],[s*.345,.73,.083]],.003,c("trim"),bind,"wanderer.bracer.seam","leather"));
 }
 return{meshes:M};
}});
// Optional sword uses the existing grip and sword animation contract, with the sheet's gold hilt.
H3.gear.register({id:"wanderer_sword",slot:"main",name:"Compass sword",kind:"sword",colors:{},build(ctx){
 const original=H3.gear.get("iron_sword"),colors={...original.colors,guard:C.gold,pommel:C.gold,wrap:"#343849",wrapDark:"#232938",blade:"#dce0df",fuller:"#9ca7b6"};
 return original.build({...ctx,col:n=>colors[n]});
}});
})();
