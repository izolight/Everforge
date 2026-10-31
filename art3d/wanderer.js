// Prismatic Wanderer: simplified-heroes and simplified-bases boards are the design authority.
// Uses the shared rest-space rig; the female profile fits body, clothing and bones together.
(function(){
"use strict";
const {G,U}=H3,{clamp,sstep}=U;
const C={skin:"#e6aa88",rose:"#e3a787",lip:"#b66157",hair:"#96482e",hairDark:"#603025",copper:"#b65b35",hairLight:"#d48249",
 teal:"#327f8b",tealLight:"#4397a0",tealDark:"#225564",sleeve:"#647d99",gold:"#d9a358",goldLight:"#f1ca7c",leather:"#86523b",leatherDark:"#58382f",leatherLight:"#b57850",
 violet:"#716487",violetLight:"#8b728e",violetDark:"#514766",pants:"#454354"};
// Softer fill keeps facial features and violet cloth readable from every turnaround angle.
H3.MATS.prism_cloth={...H3.MATS.cloth,sh:[.64,.58,.82],lt:[1.08,1.02,.96],rim:.3};
H3.MATS.prism_skin={...H3.MATS.skin,sh:[.84,.64,.69],lt:[1.06,1,.95],rim:.2};
H3.MATS.prism_hair={...H3.MATS.hair,sh:[.59,.40,.51],lt:[1.10,1.01,.94],spec:.04,rim:.35};
const from=(...tags)=>({from:tags});
function line(points,r,color,bind,name,mat){return G.tube(points.map(p=>({p,r})),{seg:6,steps:2,color,mat:mat||"cloth",bind,name,ink:false})}
function ell(p,r,color,bind,name,mat){return G.xform(G.ball(...r,{seg:16,rings:8,color,mat:mat||"skin",bind,name,tag:name,ink:false}),{t:p})}
// Four-point compass, painted on the breast and cloak.
function compass(x,y,r,w){
 if(Math.abs(Math.hypot(x,y)-r*.70)<w)return true;
 if(Math.abs(x)<w&&Math.abs(y)<r*1.10||Math.abs(y)<w&&Math.abs(x)<r*1.10)return true;
 const a=Math.abs(x),b=Math.abs(y);
 return (a/r+b/(r*.18)<1||b/r+a/(r*.18)<1)&&Math.max(a,b)>r*.08;
}
// Fit the shared rest rig to the simplified board's compact adult proportions.
const profileKeys=[[0,0,1],[.11,.12,.94],[.37,.45,1.06],[.50,.64,1.05],[.66,.86,1.0],[.88,1.075,.84],[1.13,1.29,.88],[1.25,1.405,.9],[1.32,1.445,.86],[1.8,1.78,.86]];
function profile(p){
 let i=1;while(i<profileKeys.length-1&&p[1]>profileKeys[i][0])i++;
 const a=profileKeys[i-1],b=profileKeys[i],t=(p[1]-a[0])/(b[0]-a[0]),sx=a[2]+(b[2]-a[2])*sstep(0,1,t);
 const depth=p[1]>1.32?.82:p[1]>.88?.89:.94;
 const limb=sstep(.19,.29,Math.abs(p[0]))*(1-sstep(1.16,1.28,p[1]));
 return[p[0]*(sx+(1-sx)*limb),a[1]+(b[1]-a[1])*t,p[2]*depth];
}
H3.wanderer={profile};

// Female anatomy: broad planes, expressive face, eight hair masses and mitten hands.
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
  if(m.tag.startsWith("leg.")){m.pal=[{c:C.pants,mat:"cloth"},{c:"#565063",mat:"cloth",line:false}];m.paint=null;}
  if(m.tag.startsWith("leg."))for(const p of m.v){
   const side=p[0]<0?-1:1,cx=side*.095,w=.10*Math.exp(-(((p[1]-.37)/.085)**2));
   p[0]=cx+(p[0]-cx)*(1+w);p[2]*=1+w;
  }
  if(m.tag==="neck"){m.color=C.skin;m.pal=null;}
 }
 // Old cuff is a separate arm mesh, so discard it instead of leaving a ring of skin.
 b.meshes=M.filter(m=>!m.tag.startsWith("arm.")||m.v.length>250);
 const headKeys=[{y:1.325,rx:.025,rz:.03,cz:.05},{y:1.36,rx:.066,rz:.071,cz:.039},{y:1.415,rx:.102,rz:.102,cz:.027},
  {y:1.48,rx:.137,rz:.132,cz:.018},{y:1.55,rx:.142,rz:.145,cz:.013},{y:1.64,rx:.14,rz:.146,cz:0},{y:1.715,rx:.105,rz:.111,cz:-.005},{y:1.755,rx:.028,rz:.033,cz:-.008}];
 const face=G.loft(headKeys,{seg:32,steps:3,tag:"head",mat:"skin",bind:"head",
  pal:[{c:C.skin,mat:"skin"},{c:"#f1b995",mat:"skin",line:false},{c:C.rose,mat:"skin",line:false},{c:C.lip,mat:"skin",line:false}],
  paint:p=>{
   if(p[2]<.06)return 0;
   if(((Math.abs(p[0])-.09)/.025)**2+((p[1]-1.478)/.018)**2<1)return 2;
   return 0;
  }});
 for(const p of face.v)if(p[2]>0){
  const cheek=Math.exp(-(((Math.abs(p[0])-.086)/.04)**2+((p[1]-1.49)/.045)**2));
  const nose=Math.exp(-((p[0]/.018)**2+((p[1]-1.496)/.042)**2));
  const socket=Math.exp(-(((Math.abs(p[0])-.065)/.033)**2+((p[1]-1.55)/.025)**2));
  p[2]+=.006*cheek+.018*nose-.003*socket;
 }
 b.meshes.push(face);
 // Eyes sit on the face surface, with almond-shaped openings and tilted outer corners.
 for(const s of[-1,1]){
  const cx=s*.064,cy=1.548;
  const eye=G.sheet((u,v)=>{
   const x=(u*2-1)*.034,arc=Math.sin(u*Math.PI)**.72,y=cy+s*x*.18+arc*(v*2-1)*(v>.5?.025:.018);
   return[cx+x,y,.163-.23*Math.abs(cx+x)+.002*arc];
  },16,6,{tag:"head",mat:"skin",bind:"head",ink:false,flip:true,
   pal:[{c:"#f6e6cc",mat:"skin",line:false},{c:"#3c542d",mat:"skin",line:false},{c:"#849953",mat:"skin",line:false},{c:"#222b23",mat:"skin",line:false},{c:"#fff5db",mat:"glow",line:false}],
   paint:p=>{const x=(p[0]-cx)/.015,y=(p[1]-cy)/.027,d=x*x+y*y;
    if(((p[0]-cx+.004)/.004)**2+((p[1]-cy-.006)/.005)**2<1)return 4;
    return d<.26?3:d<.77?2:d<1?1:0;}});
  eye.bias=.002;b.meshes.push(eye);
  const lash=[],lower=[];
  for(let i=0;i<=16;i++){const u=i/16,x=(u*2-1)*.034,arc=Math.sin(u*Math.PI)**.72;
   lash.push([cx+x,cy+s*x*.18+arc*.025,.167-.23*Math.abs(cx+x)]);
   lower.push([cx+x,cy+s*x*.18-arc*.018,.166-.23*Math.abs(cx+x)]);}
  b.meshes.push(line(lash,.0033,"#442b28","head","head"),line(lower,.0013,"#a66553","head","head"));
  const brow=G.tube([{p:[s*.031,1.592,.155],rx:.0035,ry:.004},{p:[s*.061,1.604,.144],rx:.005,ry:.004},{p:[s*.101,1.592,.126],rx:.0015,ry:.002}],
   {seg:6,steps:4,tag:"head",mat:"hair",color:"#683727",bind:"head",ink:false});b.meshes.push(brow);
  b.meshes.push(ell([s*.14,1.516,0],[.019,.038,.023],C.skin,"head","head.ears"));
  b.meshes.push(ell([s*.151,1.516,.014],[.008,.021,.013],C.rose,"head","head.ears"));

 }
 b.meshes.push(ell([0,1.416,.139],[.023,.006,.005],"#d18a76","head","head"));
 b.meshes.push(line([[-.023,1.423,.14],[-.009,1.428,.146],[0,1.425,.148],[.009,1.428,.146],[.023,1.423,.14]],.0022,"#ad6457","head","head"));
 b.meshes.push(line([[-.023,1.43,.141],[-.012,1.423,.149],[0,1.422,.15],[.012,1.423,.149],[.023,1.43,.141]],.0011,"#854d45","head","head"));
 // Eight sculpted hair masses: crown, back, two swept bangs, two temple locks, two tail pieces.
 const lock=(pts,widths,color,tag,bind)=>G.tube(pts.map((p,i)=>({p,rx:widths[i]*.44,ry:widths[i]})),
  {seg:5,steps:2,up:[0,0,1],tag,mat:"hair",color,bind:bind||"head",ink:false});
 b.meshes.push(G.loft([{y:1.56,rx:.15,rz:.16,cz:-.014},{y:1.66,rx:.16,rz:.169,cz:-.014},
  {y:1.74,rx:.119,rz:.133,cz:-.013},{y:1.785,rx:.037,rz:.045,cz:-.018}],
  {seg:12,steps:2,open:y=>y<1.69?1.16:0,cap:false,twoSided:true,back:C.hairDark,tag:"hair.top",mat:"hair",color:C.hair,bind:"head"}));
 b.meshes.push(G.loft([{y:1.38,rx:.075,rz:.08,cz:-.04},{y:1.44,rx:.129,rz:.137,cz:-.025},
  {y:1.56,rx:.154,rz:.166,cz:-.018},{y:1.68,rx:.145,rz:.158,cz:-.015}],
  {seg:12,steps:2,open:()=>1.37,cap:false,twoSided:true,back:C.hairDark,tag:"hair.back",mat:"hair",color:C.hair,bind:"head"}));
 b.meshes.push(lock([[.045,1.79,.045],[.013,1.75,.151],[-.075,1.674,.182],[-.16,1.605,.13],[-.183,1.574,.09]],
  [.014,.059,.052,.029,.001],C.copper,"hair.front"));
 b.meshes.push(lock([[.058,1.77,.05],[.105,1.709,.15],[.151,1.636,.133],[.17,1.59,.075]],
  [.012,.041,.03,.001],C.hair,"hair.front"));
 for(const side of[-1,1])b.meshes.push(lock([[side*.14,1.62,.068],[side*.167,1.53,.067],[side*.153,1.435,.057],[side*.188,1.385,.031]],
  [.026,.035,.023,.001],side<0?C.copper:C.hair,"hair.back"));
 const tail="hair.ponytail";
 b.bones.push({name:tail,parent:"head",head:[.01,1.61,-.162],tail:[.03,1.22,-.22],spring:{stiff:85,drag:.3,grav:1,wind:.15,r:.008}});
 b.meshes.push(lock([[.005,1.63,-.153],[.036,1.64,-.236],[.068,1.51,-.257],[.055,1.30,-.225],[.012,1.195,-.182]],
  [.025,.075,.078,.045,.001],C.copper,"hair.back",tail));
 b.meshes.push(lock([[.018,1.64,-.175],[-.039,1.61,-.234],[-.042,1.46,-.25],[.012,1.245,-.212]],
  [.021,.056,.049,.001],C.hair,"hair.back",tail));
 b.meshes.push(G.xform(G.loft([{y:-.012,rx:.037,rz:.032},{y:.012,rx:.037,rz:.032}],
  {seg:8,steps:1,tag:"hair.back",mat:"leather",color:C.leatherDark,bind:"head"}),{rx:Math.PI/2,t:[.012,1.61,-.18]}));
 // One finger block plus an opposed thumb, keeping the existing fist-closing bone.
 for(const[side,S]of[[1,"L"],[-1,"R"]]){
  b.meshes.push(G.loft([{y:.732,rx:.034,rz:.037,cx:side*.347,cz:.034},{y:.682,rx:.041,rz:.044,cx:side*.354,cz:.038},
   {y:.642,rx:.038,rz:.043,cx:side*.36,cz:.04}],{seg:10,steps:2,tag:"hand."+S,color:C.skin,mat:"skin",bind:"hand."+S}));
  b.meshes.push(G.loft([{y:.651,rx:.039,rz:.044,cx:side*.36,cz:.04},{y:.607,rx:.039,rz:.044,cx:side*.367,cz:.042},
   {y:.57,rx:.027,rz:.034,cx:side*.368,cz:.044},{y:.56,rx:.009,rz:.014,cx:side*.365,cz:.044}],
   {seg:10,steps:2,tag:"hand."+S,color:C.skin,mat:"skin",bind:"fingers."+S}));
  b.meshes.push(G.tube([{p:[side*.34,.691,.071],r:.018},{p:[side*.324,.659,.097],r:.018},{p:[side*.332,.627,.103],r:.010}],
   {seg:8,steps:2,tag:"hand."+S,mat:"skin",color:C.skin,bind:"hand."+S,ink:false}));
 }

 return b;
};

// Short two-panel tunic. Trim and compass are painted, with no embroidery geometry.
H3.gear.register({id:"wanderer_tunic",slot:"body",name:"Simple teal tunic",hides:["torso"],
 colors:{main:C.teal,sleeve:C.teal,trim:C.gold,belt:C.leather},
 build(ctx){
 const M=[],c=ctx.col,bind=from("torso"),gold=c("trim");
 M.push(G.loft(ctx.body.inflate(ctx.dims.rings.torso.filter(r=>r.y>=.88),.014),{seg:14,steps:2,name:"wanderer.bodice",mat:"cloth",bind,
  pal:[{c:c("main")},{c:gold,line:false},{c:C.skin,mat:"skin"}],
  paint:p=>{
   const v=1.20+Math.abs(p[0])*.55;
   if(p[2]>.02&&p[1]>v)return 2;
   if(p[2]>.08&&Math.abs(p[1]-v)<.006)return 1;
   if(p[2]>.1&&compass(p[0]-.09,p[1]-1.125,.027,.0024))return 1;
   return 0;
  }}));
 for(const[side,S]of[[1,"L"],[-1,"R"]]){
  const keys=ctx.dims.rings.arm[S].filter(r=>r.y>=1.13).map(r=>({...r,rx:r.rx+.009,rz:r.rz+.009}));
  keys.push({y:1.055,rx:.073,rz:.074,cx:side*.278,cz:.008});
  M.push(G.loft(keys,{seg:10,steps:2,name:"wanderer.sleeve",mat:"cloth",bind:from("arm."+S),
   pal:[{c:c("sleeve")},{c:gold,line:false}],paint:p=>p[1]<1.067?1:0}));
 }
 // Trouser rise behind the open tunic slit, fitted to the same pelvis as the thighs.
 M.push(G.loft(ctx.dims.rings.torso.filter(r=>r.y<=.88&&r.y>=.66),
  {seg:14,steps:2,name:"wanderer.trouser.rise",mat:"cloth",color:C.pants,bind}));
 // A single flared shell, open at the centre front, makes the two short tabard tails.
 M.push(G.loft([{y:.90,rx:.194,rz:.143,e:2.5},{y:.77,rx:.218,rz:.153,e:2.5},{y:.625,rx:.256,rz:.17,e:2.4}],
  {seg:20,steps:2,open:y=>.035+.15*sstep(.90,.625,y),cap:false,twoSided:true,back:C.tealDark,
   name:"wanderer.skirt",mat:"cloth",bind, pal:[{c:c("main")},{c:gold,line:false}],
   paint:p=>{
    const t=clamp((.9-p[1])/.275,0,1),rx=.194+.062*t,rz=.143+.027*t;
    const a=Math.atan2(Math.abs(p[0]/rx)**1.23,Math.sign(p[2])*Math.abs(p[2]/rz)**1.23),edge=.035+.15*sstep(.90,.625,p[1]);
    return p[1]<.641||a<edge+.06?1:0;
   }}));
 // One broad leather shoulder plate, a quiet edge, and a single mounting stud.
 M.push(G.loft([{y:1.27,rx:.041,rz:.067,cx:.19},{y:1.235,rx:.082,rz:.10,cx:.218},{y:1.135,rx:.10,rz:.102,cx:.262}],
  {seg:10,steps:2,name:"wanderer.pauldron",mat:"leather",bind:from("arm.L","torso"),
   pal:[{c:C.leather},{c:C.leatherLight,line:false}],paint:p=>p[1]<1.149?1:0}));
 M.push(ell([.204,1.228,.106],[.009,.009,.004],gold,from("arm.L"),"wanderer.pauldron.stud","gold"));
 M.push(G.loft([{y:.853,rx:.198,rz:.146,e:2.8},{y:.909,rx:.195,rz:.145,e:2.8}],
  {seg:24,steps:1,name:"wanderer.belt",color:c("belt"),mat:"leather",bind}));
 M.push(G.xform(G.box(.059,.052,.012,{name:"wanderer.buckle",color:gold,mat:"gold",bind}),{t:[0,.882,.158]}));
 M.push(G.xform(G.box(.035,.03,.013,{name:"wanderer.buckle.inset",color:C.leatherDark,mat:"leather",bind}),{t:[0,.882,.166]}));
 M.push(line([[0,.866,.175],[0,.898,.175]],.0025,gold,bind,"wanderer.buckle.pin","gold"));
 const strap=G.sheet((u,v)=>{
  const y=1.25-.37*v,x=-.15+.28*v+(u-.5)*.044;
  return[x,y,(.151-.008*v)*Math.pow(Math.max(.1,1-Math.abs(x/.206)**2.8),1/2.8)+.012];
 },2,14,{name:"wanderer.baldric",color:c("belt"),mat:"leather",bind});strap.bias=.004;M.push(strap);
 M.push(G.sheet((u,v)=>{const y=1.25-.37*v,x=-.15+.28*v+(u-.5)*.044;return[x,y,-.15*Math.sqrt(Math.max(.2,1-(x/.21)**2))-.012]},2,12,
  {name:"wanderer.baldric.back",mat:"leather",color:c("belt"),bind}));
 M.push(G.loft([{y:.869,rx:.05,rz:.025,cx:.163,cz:.137,e:4},{y:.75,rx:.052,rz:.03,cx:.171,cz:.145,e:4}],
  {seg:8,steps:1,name:"wanderer.pouch",color:C.leather,mat:"leather",bind}));
 M.push(G.xform(G.box(.10,.046,.012,{name:"wanderer.pouch.flap",color:C.leatherDark,mat:"leather",bind}),{t:[.168,.845,.178]}));
 M.push(ell([.168,.825,.187],[.006,.007,.003],gold,bind,"wanderer.pouch.stud","gold"));
 return{meshes:M};
}});

// Three broad cloak folds, a straight angular hem, one large painted compass, and one clasp.
H3.gear.register({id:"wanderer_cape",slot:"back",name:"Simple violet cloak",colors:{main:C.violet,fold:C.violetDark,lining:C.violetLight,trim:C.gold},
 build(ctx){
 const M=[],bones=[],c=ctx.col,bind=from("torso","neck");
 for(let i=0;i<3;i++)for(let k=0;k<2;k++){
  const name="wanderer.cape."+i+"."+k,x=(i-1)*.17,y=1.24-k*.32;
  bones.push({name,parent:k?"wanderer.cape."+i+".0":"chest",head:[x,y,-.19],tail:[x,y-.32,-.24],spring:{stiff:k?48:75,drag:.3,grav:4,wind:.35,r:.012}});
 }
 const hem=u=>.39+.055*Math.abs(u*2-1);
 const width=v=>.235+.105*v;
 const surface=(u,v)=>{
  const x=(u*2-1)*width(v),yt=1.265-.065*Math.abs(u*2-1);
  const fold=1-Math.abs((u*3)%1*2-1);
  return[x,yt+(hem(u)-yt)*v,-.19-.07*v-.05*v*v+fold*.036];
 };
 const cloth=G.sheet(surface,12,8,{name:"wanderer.cloak",mat:"cloth",back:c("lining"),
  pal:[{c:c("main")},{c:c("fold"),line:false},{c:c("trim"),line:false}],
  paint:p=>{
   if(p[1]>.84&&compass(p[0],p[1]-1.035,.115,.004))return 2;
   const v=clamp((1.25-p[1])/.85,0,1),u=(p[0]/width(v)+1)/2;
   return u>.34&&u<.43||u>.72?1:0;
  }});
 cloth.bind={fn:p=>{
  const v=clamp((1.24-p[1])/.85,0,1),u=clamp((p[0]/width(v)+1),0,2),i=Math.min(1,Math.floor(u)),f=u-i;
  const k=clamp((1.08-p[1])/.32,0,1),w=sstep(1.27,1.14,p[1]);
  if(w<1)return[["chest",1-w],["wanderer.cape."+i+".0",w*(1-f)],["wanderer.cape."+(i+1)+".0",w*f]];
  return[["wanderer.cape."+i+".0",(1-f)*(1-k)],["wanderer.cape."+(i+1)+".0",f*(1-k)],
   ["wanderer.cape."+i+".1",(1-f)*k],["wanderer.cape."+(i+1)+".1",f*k]];
 }};M.push(cloth);
 M.push(G.loft([{y:1.34,rx:.084,rz:.083,cz:-.035},{y:1.29,rx:.15,rz:.14,cz:-.035},{y:1.22,rx:.225,rz:.155,cz:-.025}],
  {seg:12,steps:1,open:y=>.5+(1.34-y)*5,cap:false,twoSided:true,back:c("fold"),name:"wanderer.hood.down",mat:"cloth",color:c("main"),bind}));
 // Broad triangles drape over the shoulders and meet at a round gold clasp.
 for(const side of[-1,1])M.push(G.sheet((u,v)=>{
  const x=side*(.018+.216*u),y=1.31-.03*u-v*(.11-.085*u);
  return[x,y,.12+.055*Math.sin(u*Math.PI)+.045*v];
 },4,2,{name:"wanderer.mantle",mat:"cloth",color:c("main"),back:c("fold"),bind}));
 M.push(ell([0,1.205,.17],[.018,.018,.009],c("trim"),bind,"wanderer.clasp","gold"));
 M.push(ell([0,1.205,.18],[.009,.009,.003],C.goldLight,bind,"wanderer.clasp.inset","gold"));
 return{meshes:M,bones};
}});

H3.gear.register({id:"wanderer_boots",slot:"feet",name:"Simple cuffed boots",hides:["foot"],colors:{main:C.leather,trim:C.leatherLight,sole:C.leatherDark},
 build(ctx){const M=[],c=ctx.col;
 for(const[side,S]of[[1,"L"],[-1,"R"]]){
  const x=side*.098,bind={bones:["shin."+S,"foot."+S],power:5};
  const foot=G.loft([{y:0,rx:.076,rz:.13,cz:.052,e:3},{y:.027,rx:.08,rz:.133,cz:.052,e:3},
   {y:.07,rx:.074,rz:.108,cz:.039,e:2.5},{y:.13,rx:.06,rz:.064}],
   {seg:12,steps:2,name:"wanderer.boot.foot",mat:"leather",bind,pal:[{c:c("main")},{c:c("sole")}],paint:p=>p[1]<.025?1:0});
  G.xform(foot,{ry:side*.12,t:[x,0,0]});M.push(foot);
  M.push(G.loft([{y:.105,rx:.06,rz:.065,cx:x},{y:.21,rx:.069,rz:.074,cx:x},{y:.285,rx:.078,rz:.079,cx:x}],
   {seg:10,steps:2,name:"wanderer.boot.shaft",color:c("main"),mat:"leather",bind:"shin."+S}));
  M.push(G.loft([{y:.258,rx:.086,rz:.086,cx:x},{y:.31,rx:.09,rz:.09,cx:x}],
   {seg:8,steps:1,name:"wanderer.boot.cuff",color:c("trim"),mat:"leather",bind:"shin."+S}));
  M.push(line([[x-.057,.12,.061],[x,.104,.086],[x+.057,.10,.073]],.012,C.leatherDark,bind,"wanderer.boot.strap","leather"));
 }
 return{meshes:M};
}});

H3.gear.register({id:"wanderer_bracers",slot:"hands",name:"Simple cuffed gloves",hides:["hand"],colors:{main:C.leather,trim:C.leatherLight},
 build(ctx){const M=[],c=ctx.col;
 for(const[side,S]of[[1,"L"],[-1,"R"]]){
  M.push(G.loft([{y:.726,rx:.048,rz:.052,cx:side*.347,cz:.034},{y:.80,rx:.066,rz:.064,cx:side*.33,cz:.028}],
   {seg:8,steps:1,name:"wanderer.glove.cuff",color:c("trim"),mat:"leather",bind:{bones:["forearm."+S,"hand."+S],power:6}}));
  M.push(G.loft([{y:.735,rx:.043,rz:.047,cx:side*.347,cz:.034},{y:.68,rx:.049,rz:.053,cx:side*.356,cz:.038},
   {y:.646,rx:.046,rz:.051,cx:side*.36,cz:.04}],{seg:10,steps:2,name:"wanderer.glove.palm",mat:"leather",color:c("main"),bind:"hand."+S}));
  M.push(G.loft([{y:.652,rx:.047,rz:.052,cx:side*.36,cz:.04},{y:.604,rx:.046,rz:.051,cx:side*.367,cz:.042},
   {y:.565,rx:.031,rz:.039,cx:side*.369,cz:.044},{y:.553,rx:.01,rz:.015,cx:side*.365,cz:.044}],
   {seg:10,steps:2,name:"wanderer.glove.fingers",mat:"leather",color:c("main"),bind:"fingers."+S}));
  M.push(G.tube([{p:[side*.34,.694,.076],r:.023},{p:[side*.321,.659,.103],r:.022},{p:[side*.331,.624,.109],r:.013}],
   {seg:8,steps:2,name:"wanderer.glove.thumb",mat:"leather",color:c("main"),bind:"hand."+S,ink:false}));
 }
 return{meshes:M};
}});
// Optional sword uses the existing grip and sword animation contract, with the sheet's gold hilt.
H3.gear.register({id:"wanderer_sword",slot:"main",name:"Compass sword",kind:"sword",colors:{},build(ctx){
 const original=H3.gear.get("iron_sword"),colors={...original.colors,guard:C.gold,pommel:C.gold,wrap:"#343849",wrapDark:"#232938",blade:"#dce0df",fuller:"#9ca7b6"};
 return original.build({...ctx,col:n=>colors[n]});
}});
})();
