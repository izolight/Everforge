// Simplified bases v1: six-head proportions, broad anatomy and grouped hair/hands.
// Authored in the shared rig's rest space so all equipment still fits after profiling.
(function(){
"use strict";
const {G,U}=H3, skin="#e6aa88",linen="#e7dbc2",seam="#baa58a",cord="#70503b";
// Broad diffuse light preserves sculpted planes without the old two-tone cel bands.
Object.assign(H3.MATS.prism_skin,{sh:[.73,.56,.49],lt:[1.10,1.03,.96],ramp:.95,rim:.12});
Object.assign(H3.MATS.prism_cloth,{sh:[.66,.65,.62],lt:[1.09,1.06,1.0],ramp:.90,rim:.10});
Object.assign(H3.MATS.prism_hair,{sh:[.48,.31,.25],lt:[1.24,1.08,.94],ramp:.8,rim:.18});
const previous=H3.body.build;
const keys=[[0,0,1],[.11,.12,.94],[.37,.45,1.06],[.50,.64,1.05],[.66,.86,1],[.88,1.075,.94],[1.13,1.29,1],[1.25,1.405,1],[1.32,1.445,.94],[1.8,1.80,.94]];
H3.wanderer.profile=function(p,variant){
 let i=1;while(i<keys.length-1&&p[1]>keys[i][0])i++;
 const a=keys[i-1],b=keys[i],t=(p[1]-a[0])/(b[0]-a[0]);
 const limb=U.sstep(.19,.29,Math.abs(p[0]))*(1-U.sstep(1.16,1.28,p[1]));
 let sx=a[2]+(b[2]-a[2])*U.sstep(0,1,t);sx+=(1-sx)*limb;
 if(variant==="male"&&p[1]<1.32)sx*=1+.10*U.sstep(.85,1.2,p[1]);
 return[p[0]*sx,a[1]+(b[1]-a[1])*t,p[2]*(p[1]>1.32?.88:.94)];
};
H3.body.build=function(o){
 const b=previous(o),female=o&&o.variant==="female",M=b.meshes;
 b.meshes=M.filter(m=>/^(head|hair)/.test(m.tag));
 if(!female){
  const detailed=previous({variant:"female"}).meshes.filter(m=>m.tag.startsWith("head"));
  for(const m of detailed)for(const p of m.v){
   if(p[1]<1.49)p[0]*=1.04;
   if(p[1]>1.525&&p[1]<1.575)p[1]=1.548+(p[1]-1.548)*.82;
  }
  b.meshes=b.meshes.filter(m=>!m.tag.startsWith("head"));b.meshes.push(...detailed);
 }
 const add=m=>(b.meshes.push(m),m);
 const bind=bones=>({bones,power:4});
 const line=(pts,r,color,tag,binding)=>add(G.tube(pts.map(p=>({p,r})),{seg:6,steps:2,color,tag,bind:binding,ink:false}));
 const torsoBind=bind(["hips","spine","chest","neck","shoulder.L","shoulder.R"]);
 const torso=add(G.loft([
 {y:.755,rx:.167,rz:.112,e:2.1},{y:.84,rx:female?.145:.157,rz:.103,e:2.1},
 {y:.94,rx:female?.150:.177,rz:.111,e:2.1},{y:1.04,rx:female?.177:.205,rz:.13,e:2.1},
 {y:1.13,rx:female?.19:.219,rz:.142,e:2.1},{y:1.20,rx:female?.183:.215,rz:.121,e:2.2},
 {y:1.25,rx:.167,rz:.092,e:2.1},{y:1.29,rx:.092,rz:.069},{y:1.32,rx:.062,rz:.058}
 ],{seg:24,steps:2,tag:"torso",pal:[{c:skin,mat:"skin"},{c:linen,mat:"cloth"}],paint:p=>p[1]<.756?1:0,mat:"skin",bind:torsoBind}));
 // Continuous ribcage, abdomen and shoulder planes, rather than separate muscle balls.
 for(const p of torso.v){
  const x=Math.abs(p[0]),y=p[1];
  if(y>.75&&y<1.26){
   p[0]*=1-.02*Math.exp(-1*((y-.9)/.14)**2);
   if(p[2]>0){
    const pec=Math.exp(-1*((x-.095)/.075)**2-((y-1.14)/.08)**2);
    const abs=Math.exp(-1*((x-.055)/.05)**2)*(Math.exp(-1*((y-1.01)/.045)**2)+Math.exp(-1*((y-.92)/.04)**2)+Math.exp(-1*((y-.83)/.04)**2));
    p[2]+=(female?.018:.025)*pec;
   }
  }
 }
 add(G.loft([{y:1.22,rx:.067,rz:.064},{y:1.30,rx:.06,rz:.057},{y:1.39,rx:.058,rz:.056}],{seg:20,steps:2,tag:"neck",color:skin,mat:"skin",bind:bind(["chest","neck","head"])}));
 // Painted anatomical landmarks follow the sculpted chest, abdomen and shoulder blades.
 torso.pal=[{c:skin,mat:"skin"},{c:"#d69977",mat:"skin",line:false},{c:"#f0b794",mat:"skin",line:false},{c:"#b77b5f",mat:"skin",line:false}];
 torso.paint=p=>{
  const x=Math.abs(p[0]),y=p[1];
  if(p[2]>.05){
   if(x<.006&&Math.abs(y-.817)<.006)return 3;
   if(U.seg2(x,y,.025,1.255,.16,1.232)<.005)return 2;
   if(!female&&y>1.065&&y<1.08+x*.10&&x>.024&&x<.17)return 1;
  }else if(p[2]<-.05){
   if(x<.006&&y>1.0)return 1;
   if(U.seg2(x,y,.05,1.19,.14,1.09)<.009)return 2;
  }
  return 0;
 };
 // Braies have a continuous rise and two open, flared leg hems.
 add(G.loft([{y:.744,rx:.181,rz:.129,e:2.5},{y:.768,rx:.178,rz:.126,e:2.5}],{seg:32,steps:1,tag:"torso.tie",color:linen,bind:bind(["hips","spine"]),
  pal:[{c:linen},{c:seam,line:false}],paint:p=>p[1]<.749||p[1]>.763?1:0}));
 for(const s of [-1,1])line([[0,.75,.135],[s*.014,.72,.15],[s*.019,.65,.153]],.004,cord,"torso.lace",bind(["hips","spine"]));
 for(const [s,S]of [[1,"L"],[-1,"R"]]){
  const arm=[
   {y:1.275,rx:.035,rz:.043,cx:s*.194},
   {y:1.235,rx:.074,rz:.083,cx:s*.218},
   {y:1.16,rx:.076,rz:.078,cx:s*.243},
   {y:1.075,rx:.061,rz:.073,cx:s*.270,cz:.008},
   {y:.985,rx:.040,rz:.043,cx:s*.296,cz:.012},
   {y:.92,rx:.053,rz:.057,cx:s*.311,cz:.023},
   {y:.85,rx:.048,rz:.050,cx:s*.326,cz:.028},
   {y:.73,rx:.029,rz:.033,cx:s*.347,cz:.034}
  ].map(r=>({...r,rx:r.rx*(female?.80:1),rz:r.rz*(female?.83:1)}));
  add(G.loft(arm,{seg:14,steps:2,tag:"arm."+S,color:skin,mat:"skin",bind:bind(["shoulder."+S,"upperarm."+S,"forearm."+S,"hand."+S])}));
  const leg=[{y:.69,rx:.096,rz:.102,cx:s*.087},{y:.57,rx:.095,rz:.103,cx:s*.09},{y:.46,rx:.075,rz:.083,cx:s*.095},{y:.37,rx:.052,rz:.059,cx:s*.096,cz:.01},{y:.28,rx:.068,rz:.074,cx:s*.099,cz:-.009},{y:.19,rx:.049,rz:.053,cx:s*.099},{y:.11,rx:.033,rz:.038,cx:s*.098}];
  add(G.loft(leg,{seg:14,steps:8,tag:"leg."+S,color:skin,mat:"skin",bind:bind(["hips","thigh."+S,"shin."+S,"foot."+S])}));
  add(G.loft([{y:.755,rx:.09,rz:.128,cx:s*.09,e:2.3},{y:.67,rx:.103,rz:.143,cx:s*.09,e:2.3},{y:.61,rx:.108,rz:.132,cx:s*.098,e:2.3},{y:.565,rx:.111,rz:.125,cx:s*.106,e:2.3}],
   {seg:18,steps:2,cap:false,twoSided:true,tag:"leg."+S+".braies",bind:bind(["hips","thigh."+S]),pal:[{c:linen},{c:seam,line:false}],
    paint:p=>p[1]<.574||Math.abs(p[0]-s*.208)<.003?1:0}));
  const foot=G.loft([{y:.13,rx:.034,rz:.041},{y:.085,rx:.041,rz:.061,cz:.012},{y:.042,rx:.057,rz:.102,cz:.039},{y:.014,rx:.06,rz:.108,cz:.04}],
   {seg:18,steps:2,tag:"foot."+S,color:skin,mat:"skin",bind:bind(["shin."+S,"foot."+S])});
  add(G.xform(foot,{ry:s*.12,t:[s*.098,0,0]}));
  for(let i=0;i<5;i++)add(G.xform(G.ball(.012-i*.001,.016,.029-i*.003,{seg:8,rings:4,tag:"foot."+S,color:skin,mat:"skin",bind:"foot."+S,ink:false}),{t:[s*(.058+i*.023),.019,.145-i*.005]}));
  add(G.loft([{y:.733,rx:.032,rz:.034,cx:s*.347,cz:.034},{y:.68,rx:.033,rz:.04,cx:s*.355,cz:.039},{y:.643,rx:.032,rz:.038,cx:s*.36,cz:.04}],{seg:12,steps:2,tag:"hand."+S,color:skin,mat:"skin",bind:bind(["forearm."+S,"hand."+S])}));
  for(let i=0;i<4;i++){
   const z=.011+i*.019,len=[.061,.078,.073,.055][i];
   add(G.tube([{p:[s*.36,.65,z],r:.010},{p:[s*.369,.616,z+.003],r:.010},{p:[s*.373,.65-len,z+.006],r:.006}],{seg:8,steps:2,tag:"hand."+S,color:skin,mat:"skin",bind:"fingers."+S,ink:false}));
  }
  add(G.tube([{p:[s*.345,.69,.067],r:.016},{p:[s*.325,.666,.091],r:.014},{p:[s*.329,.636,.10],r:.008}],{seg:8,steps:2,tag:"hand."+S,color:skin,mat:"skin",bind:"hand."+S,ink:false}));
 }
 if(female){
  add(G.loft([{y:.975,rx:.185,rz:.13,e:2.4},{y:1.035,rx:.20,rz:.139,e:2.4},{y:1.12,rx:.216,rz:.157,e:2.3},{y:1.20,rx:.198,rz:.148,e:2.3}],
   {seg:28,steps:3,cap:false,twoSided:true,tag:"torso.bodice",bind:torsoBind,pal:[{c:linen},{c:seam,line:false}],
    paint:p=>p[1]<.986||p[1]>1.19||Math.abs(Math.abs(p[0])-.115)<.0025?1:0}));
  for(const s of[-1,1]){
   add(G.sheet((u,v)=>{const t=v*Math.PI;return[s*(.135+.028*(u-.5)),1.185+.083*Math.sin(t),.13*Math.cos(t)]},3,14,{tag:"torso.bodice",color:linen,bind:torsoBind}));
   for(let i=0;i<4;i++){
    const y=1.0+i*.039,x=s*(.193+(y-1)*.20);
    line([[x,y,-.027],[x+s*.008,y+.033,.03]],.003,cord,"torso.bodice",torsoBind);
    line([[x,y,.03],[x+s*.008,y+.033,-.027]],.003,cord,"torso.bodice",torsoBind);
   }
  }
 }
 // Reuse the simplified board's broad locks and single finger-block hands.
 const simple=previous({variant:"female"});
 b.meshes=b.meshes.filter(m=>!/^hair|^hand\./.test(m.tag));
 for(const m of simple.meshes.filter(m=>/^hair|^hand\./.test(m.tag))){
  if(!female&&m.bind==="hair.ponytail")continue;
  if(!female&&m.tag.startsWith("hair"))for(const p of m.v){
   if(p[1]<1.50)p[1]=1.50+(p[1]-1.50)*.25;
  }
  b.meshes.push(m);
 }
 // Broad pointed crown wedges give the male its swept, broken silhouette.
 if(!female)for(let i=0;i<4;i++){
  const x=-.10+i*.065;
  add(G.tube([{p:[x,1.70,-.015],rx:.027,ry:.045},
   {p:[x+.015,1.765,.015],rx:.023,ry:.043},
   {p:[x+.065,1.79+(i%2)*.027,.025],rx:.001,ry:.001}],
   {seg:5,steps:2,up:[0,0,1],tag:"hair.top",color:i%2?"#a45130":"#b65b35",mat:"hair",bind:"head",ink:false}));
 }
 // Low relief folds and tailored seams sit on the linen rather than a flat color fill.
 for(const m of b.meshes){
  if(m.tag.includes("braies")){
   const side=m.tag.includes(".L")?1:-1;
   for(const p of m.v){
    const y=p[1],x=p[0]-side*.10;
    const fold=Math.sin(x*55+y*23)*.003*Math.exp(-1*((y-.67)/.13)**2);
    p[2]+=Math.sign(p[2])*fold;
   }
   m.pal=[{c:linen},{c:seam,line:false},{c:"#d1c0a4",line:false},{c:"#f2e8d3",line:false}];
   m.paint=p=>{
    const x=p[0]-side*.10,y=p[1];
    if(y<.577||Math.abs(x-side*.102)<.003)return 1;
    if(U.seg2(Math.abs(p[0]),y,.175,.726,.14,.647)<.002)return 1;
    if(Math.abs(x)<.003)return 2;
    return 0;
   };
  }
  if(m.tag==="torso"||/^arm\.|^leg\./.test(m.tag)&&m.mat==="skin")m.planar=true;
  if(/^(torso|arm|leg|neck|hand|foot)/.test(m.tag))m.ink=false;
 }
 // Warm copper and skin are shared by the two reference characters.
 if(!female)for(const m of b.meshes.filter(m=>/^(head|hair)/.test(m.tag))){
  const colors={[H3.body.C.skin]:skin,[H3.body.C.hair]:"#96482e",[H3.body.C.hairHi]:"#c57141"};
  if(m.tag==="hair.back")for(const p of m.v){if(p[1]<1.5){p[1]=1.5+(p[1]-1.5)*.35;p[2]=Math.max(p[2],-.18);}}
  m.color=colors[m.color]||m.color;if(m.pal)m.pal=m.pal.map(e=>({...e,c:colors[e.c]||e.c}));
 }
 return b;
};
})();
