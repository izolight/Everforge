// Simplified bases v1 (reference/prismatic-simplified-bases-v1.png): compact proportions,
// smoothly sculpted anatomy, open hands, volumetric copper hair and linen underclothes.
// Authored in the shared rig's rest space, so every gear item, bone and clip still fits after profiling.
(function(){
"use strict";
const {G,U}=H3,{sstep,clamp}=U;
const skin="#efb28c",linen="#ece2cb",seam="#c9b796",cord="#6b4532";
const HC={base:"#b65530",mid:"#c8673a",light:"#db7f47",dark:"#8a3c22",tie:"#e2c79a"};
// Soft painterly light: warm, light shadows so forms read through gradients rather than facets.
Object.assign(H3.MATS.prism_skin,{sh:[.9,.77,.76],lt:[1.08,1.02,.97],ramp:.8,rim:.16,spec:.03,gloss:.97});
Object.assign(H3.MATS.prism_cloth,{sh:[.78,.76,.80],lt:[1.07,1.05,1.0],ramp:.95,rim:.12});
Object.assign(H3.MATS.prism_hair,{sh:[.70,.52,.52],lt:[1.16,1.06,.96],ramp:.75,rim:.28,spec:.12,gloss:.955});

// ---------- rest-space profile (body, gear, bones and colliders share it) ----------
const keys=[[0,0,1],[.11,.12,.94],[.37,.45,1.06],[.50,.64,1.05],[.66,.86,1],[.88,1.075,.94],[1.13,1.29,1],[1.25,1.405,1],[1.32,1.445,.94],[1.8,1.80,.94]];
const NECK_Y=1.4336;   // profiled height of rest y=1.30, the pivot for the head scale
H3.wanderer.profile=function(p,variant){
 let i=1;while(i<keys.length-1&&p[1]>keys[i][0])i++;
 const a=keys[i-1],b=keys[i],t=(p[1]-a[0])/(b[0]-a[0]);
 const limb=sstep(.19,.29,Math.abs(p[0]))*(1-sstep(1.16,1.28,p[1]));
 let sx=a[2]+(b[2]-a[2])*sstep(0,1,t);sx+=(1-sx)*limb;
 if(variant==="male"&&p[1]<1.32)sx*=1+.10*sstep(.85,1.2,p[1]);
 const q=[p[0]*sx,a[1]+(b[1]-a[1])*t,p[2]*(p[1]>1.32?.88:.94)];
 // The reference head is smaller than the rig's: scale it about the top of the neck.
 const k=1-sstep(1.30,1.42,p[1])*(variant==="male"?.15:.13);
 if(p[1]>1.30){q[0]*=k;q[2]*=k;q[1]=NECK_Y+(q[1]-NECK_Y)*k}
 return q;
};

// ---------- sculpting helpers ----------
const gs=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
const angd=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const ga=(phi,c,w)=>Math.exp(-((angd(phi,c)/w)**2));
// Scale each loft ring radially by 1+fn(phi,y): phi=0 faces +z, +pi/2 faces +x.
function sculpt(m,seg,fn){
 const N=seg+1,R=Math.floor(m.v.length/N);
 for(let j=0;j<R;j++){
  let cx=0,cz=0;for(let i=0;i<seg;i++){cx+=m.v[j*N+i][0];cz+=m.v[j*N+i][2]}cx/=seg;cz/=seg;
  for(let i=0;i<N;i++){const p=m.v[j*N+i],dx=p[0]-cx,dz=p[2]-cz,f=1+fn(Math.atan2(dx,dz),p[1],p);p[0]=cx+dx*f;p[2]=cz+dz*f}
 }
 return m;
}
// A garment band offset from rows of a sculpted loft, between heights y0 and y1.
function band(m,seg,y0,y1,off,o){
 const N=seg+1,R=Math.floor(m.v.length/N),v=[],f=[];
 for(let j=0;j<R;j++){const y=m.v[j*N][1];if(y<y0-1e-6||y>y1+1e-6)continue;
  let cx=0,cz=0;for(let i=0;i<seg;i++){cx+=m.v[j*N+i][0];cz+=m.v[j*N+i][2]}cx/=seg;cz/=seg;
  for(let i=0;i<N;i++){const p=m.v[j*N+i],dx=p[0]-cx,dz=p[2]-cz,l=Math.hypot(dx,dz)||1;v.push([p[0]+dx/l*off,p[1],p[2]+dz/l*off])}}
 const rows=v.length/N;
 for(let j=0;j<rows-1;j++)for(let i=0;i<seg;i++){const a=j*N+i;
  if(o.cut&&o.cut(U.mul(U.add(v[a],v[a+N+1]),.5)))continue;f.push([a,a+1,a+N+1],[a,a+N+1,a+N])}
 // Drop vertices orphaned by the cut so every vertex has a normal.
 const map=new Map(),V=[];for(const fc of f)for(let k=0;k<3;k++){if(!map.has(fc[k])){map.set(fc[k],V.length);V.push(v[fc[k]])}fc[k]=map.get(fc[k])}
 return G.mesh(V,f,Object.assign({twoSided:true},o));
}

// ---------- hair ----------
// The skull as a superellipsoid (matches the face loft); hair is laid out on it in (az, v, lift):
// az=0 faces front, +pi/2 the hero's left; v in [-1,1] is height; lift is metres off the scalp.
const HCEN=[0,1.552,.012],HR=[.144,.205,.150];
function hp(az,v,lift){
 v=clamp(v,-1,1);const h=Math.pow(Math.max(0,1-Math.abs(v)**2.5),.4);
 return[(HR[0]+lift)*h*Math.sin(az),HCEN[1]+(HR[1]+lift)*v,HCEN[2]+(HR[2]+lift)*h*Math.cos(az)];
}
// A tapering, flattened lock. Points are [az,v,lift] on the skull or {p:[x,y,z]} in rest space.
// Locks have no contact ink, so they read as clumps of one mass; only their tips break the silhouette.
function lock(pts,w,o){
 const P=pts.map(q=>Array.isArray(q)?hp(q[0],q[1],q[2]):q.p);
 const root=P[0],up=o.up||U.norm(U.sub(root,[HCEN[0],HCEN[1]-.02,HCEN[2]]));
 return G.tube(P.map((p,i)=>({p,rx:Math.max(.0008,w[i]*(o.thick||.3)),ry:Math.max(.001,w[i])})),
  {seg:10,steps:3,up,tag:o.tag||"hair.top",mat:"hair",color:o.color||HC.base,bind:o.bind||"head",ink:!!o.ink});
}
// A strand follows control points [az,v] over the hair volume as a ribbon whose flat side stays on
// the skull's normal (so it never turns edge-on over the crown), lifting off toward the tip.
function strand(lift,ctrl,w,out,o){
 const K=18,n=ctrl.length,seg=12,v=[],f=[],P=[],cr=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
 const at=t=>{const x=t*(n-1),j=Math.min(n-2,Math.floor(x)),u=x-j,g=i=>ctrl[clamp(i,0,n-1)];
  return[0,1].map(k=>cr(g(j-1)[k],g(j)[k],g(j+1)[k],g(j+2)[k],u))};
 const th=o.thick||.32;
 for(let i=0;i<=K;i++){const t=i/K,[az,vv]=at(t),wid=w*(t<.3?.55+1.5*t:1-Math.pow((t-.3)/.7,1.6)*.98);
  const L=lift(az,vv)+.003+out*t*t*t+wid*th*.6;P.push({p:hp(az,vv,L),w:wid});}
 for(let i=0;i<=K;i++){
  const p=P[i].p,T=U.norm(U.sub(P[Math.min(K,i+1)].p,P[Math.max(0,i-1)].p));
  let N=U.norm([p[0]/HR[0],(p[1]-HCEN[1])/HR[1],(p[2]-HCEN[2])/HR[2]]);
  const B=U.norm(U.cross(T,N));N=U.cross(B,T);
  for(let k=0;k<=seg;k++){const a=2*Math.PI*k/seg,c=Math.cos(a),sn=Math.sin(a);
   v.push(U.add(p,U.add(U.mul(N,P[i].w*th*c),U.mul(B,P[i].w*sn))))}}
 const N1=seg+1;
 for(let i=0;i<K;i++)for(let k=0;k<seg;k++){const a=i*N1+k;f.push([a,a+1,a+N1+1],[a,a+N1+1,a+N1])}
 let sg=0;f.forEach((fc,q)=>{const i=Math.floor(q/2/seg);sg+=U.dot(U.cross(U.sub(v[fc[1]],v[fc[0]]),U.sub(v[fc[2]],v[fc[0]])),U.sub(v[fc[0]],P[i].p))});
 if(sg<0)f.forEach(fc=>fc.reverse());
 for(const[i,dir]of[[0,-1],[K,1]]){const ci=v.length;v.push(P[i].p.slice());const away=U.mul(U.sub(P[Math.min(K,i+1)].p,P[Math.max(0,i-1)].p),dir);
  for(let k=0;k<seg;k++){const fc=[ci,i*N1+k,i*N1+k+1];if(U.dot(U.cross(U.sub(v[fc[1]],v[fc[0]]),U.sub(v[fc[2]],v[fc[0]])),away)<0)fc.reverse();f.push(fc)}}
 return G.mesh(v,f,{tag:o.tag||"hair.top",mat:"hair",color:o.color||HC.base,bind:o.bind||"head",ink:!!o.ink});
}
const path=(a0,v0,a1,v1,bow)=>[0,.25,.5,.75,1].map(t=>[a0+(a1-a0)*t,v0+(v1-v0)*t+(bow||0)*Math.sin(Math.PI*t)]);
function hairCap(lift,bottom,tag,streaks){
 // bottom(az) is the hairline height in v; the lowest band tucks in toward the nape.
 const NU=48,NV=18;
 return G.sheet((u,t)=>{
  const az=Math.PI+(u*2-1)*Math.PI,vb=bottom(az),v=vb+(1-vb)*t,p=hp(az,v,lift(az,v));
  const tuck=1-.2*sstep(.2,0,t)*sstep(-.1,-.5,vb);
  return[p[0]*tuck,p[1],HCEN[2]+(p[2]-HCEN[2])*tuck];
 },NU,NV,{tag,mat:"hair",color:HC.base,back:HC.dark,bind:"head",ink:false,
  pal:[{c:HC.base},{c:HC.dark,line:false},{c:HC.mid,line:false}],
  // Brushed strands converge on the ponytail: meridians around the head's front-back axis.
  paint:streaks?p=>{const a=Math.atan2(p[0],p[1]-HCEN[1]+.05)*5.5+.4*Math.sin(p[2]*20),q=a-Math.floor(a);
   return p[1]<1.5?0:q<.07?1:q>.45&&q<.62?2:0}:null});
}
const table=T=>az=>{const a=Math.abs(angd(az,0));let i=1;while(i<T.length-1&&a>T[i][0])i++;
 const p=T[i-1],q=T[i];return p[1]+(q[1]-p[1])*sstep(0,1,(a-p[0])/(q[0]-p[0]))};

function maleHair(M){
 // Tousled volume: the mass rises well above the skull, with soft clumps.
 const lift=(az,v)=>.016+.042*sstep(.05,.85,v)+.008*Math.sin(az*5)*sstep(.3,.9,v);
 M.push(hairCap(lift,table([[0,.50],[.8,.30],[1.35,.14],[1.75,.08],[2.25,-.28],[Math.PI,-.45]]),"hair.back"));
 const C=[HC.base,HC.mid,HC.base,HC.mid,HC.light];
 let n=0;const S=(ctrl,w,out,tag)=>M.push(strand(lift,ctrl,w,out,{tag,color:tag==="hair.back"?C[n++%2]:C[n++%5]}));
 // Back: clumps fan from the crown whorl to pointed nape tips; an upper layer flicks out.
 for(let k=-4;k<=4;k++)S(path(Math.PI+k*.14,.88,Math.PI+k*.34,-.5-.1*(k&1),-.05),.085,.02,"hair.back");
 for(let k=-3;k<=3;k+=1.5)S(path(Math.PI+k*.16,.95,Math.PI+k*.36,.15,.1),.08,.06,"hair.top");
 // Sides sweep back over the ears.
 for(const s of[-1,1])for(let k=0;k<3;k++)S(path(s*(.55+k*.32),.92,s*(1.4+k*.36),-.02-k*.12,.05),.08,.035,"hair.back");
 // Crown spikes rise from the front and sides and point up and back.
 [[-.7,.45,-1.0,.9,.06],[-.35,.5,-.5,.93,.08],[0,.52,.05,.95,.09],[.35,.5,.6,.93,.08],[.7,.45,1.05,.9,.06],
  [-1.1,.4,-1.6,.85,.05],[1.1,.4,1.6,.85,.05],[2.6,.6,2.9,.92,.07],[-2.6,.6,-2.9,.92,.07]]
  .forEach(([a0,v0,a1,v1,o])=>S(path(a0,v0,a1,v1,.08),.095,o,"hair.top"));
 // Fringe: pointed clumps fall over the forehead, swept toward the hero's left.
 // The fringe stays close to the scalp so it also sits inside a hood.
 const low=(az,v)=>Math.min(lift(az,v),.03);
 [[-.5,.30],[-.2,.24],[.12,.3],[.45,.26]].forEach(([az,vt],i)=>M.push(strand(low,path(az*.6-.1,.78,az+.28,vt,.1),.075,.018,{tag:"hair.front",color:C[(i+1)%5]})));
}

function femaleHair(M,bones){
 const lift=(az,v)=>.024+.02*sstep(.2,.9,v);
 M.push(hairCap(lift,table([[0,.46],[.8,.24],[1.35,.02],[1.75,-.14],[2.25,-.30],[Math.PI,-.40]]),"hair.back",true));
 const C=[HC.base,HC.mid,HC.light,HC.mid];
 let n=0;const S=(ctrl,w,out,tag,o)=>M.push(strand(lift,ctrl,w,out,Object.assign({tag,color:C[n++%4]},o)));
 // Face-framing locks fall past the cheeks and flip out at the jaw.
 for(const s of[-1,1]){
  S([[s*.95,.38],[s*1.1,.15],[s*1.2,-.2],[s*1.25,-.55],[s*1.3,-.82]],.075,.035,"hair.back");
  S([[s*1.35,.36],[s*1.5,.15],[s*1.6,-.2],[s*1.65,-.55],[s*1.75,-.78]],.08,.04,"hair.back");
 }
 // Side-swept bangs: one broad sweep across the brow, two shorter locks on the part side.
 S([[-.42,.92],[-.05,.66],[.38,.4],[.78,.2],[1.0,.0]],.10,.02,"hair.front",{color:HC.mid});
 S([[-.25,.86],[.08,.62],[.38,.44],[.6,.3],[.72,.18]],.07,.015,"hair.front",{color:HC.light});
 S([[-.48,.9],[-.6,.62],[-.74,.38],[-.84,.2],[-.9,.05]],.07,.02,"hair.front",{color:HC.base});
 // High ponytail on its own spring bone.
 const tail="hair.ponytail",tie=[.005,1.665,-.182];
 bones.push({name:tail,parent:"head",head:tie,tail:[.03,1.30,-.26],spring:{stiff:85,drag:.3,grav:1,wind:.15,r:.01}});
 M.push(G.xform(G.loft([{y:-.016,rx:.036,rz:.032},{y:.016,rx:.036,rz:.032}],{seg:14,steps:1,tag:"hair.back",mat:"cloth",color:HC.tie,bind:"head"}),
  {rx:Math.PI/2-.5,t:tie}));
 const tl=[[0,0,.02,.08,HC.mid],[-.025,.012,-.01,.065,HC.base],[.028,-.01,.0,.062,HC.light]];
 for(const[dx,dy,dz,w,c]of tl)M.push(lock([{p:[tie[0]+dx,tie[1]+dy,tie[2]+.03]},{p:[.01+dx,1.72+dy,-.24+dz]},{p:[.04+dx,1.645,-.315+dz]},
   {p:[.055+dx,1.50,-.32+dz]},{p:[.035+dx,1.38,-.275+dz]},{p:[.0+dx,1.31,-.235+dz]}],[w*.7,w,w*1.1,w*.9,w*.55,.002],
   {tag:"hair.back",color:c,bind:tail,up:[1,0,0],thick:.62}));
}

// ---------- body ----------
const previous=H3.body.build,RINGS={torso:H3.body.dims.rings.torso.slice()};
H3.body.build=function(o){
 const female=!!(o&&o.variant==="female"),b=previous(o);
 // The detailed face from the female wanderer build is shared by both variants.
 b.meshes=previous({variant:"female"}).meshes.filter(m=>m.tag.startsWith("head"));
 b.bones=[];
 const add=m=>(b.meshes.push(m),m);
 const bind=bones=>({bones,power:4});
 const face=b.meshes.reduce((a,m)=>m.v.length>a.v.length?m:a);
 for(const m of b.meshes){
  for(const p of m.v){
   if(!female){if(p[1]<1.49)p[0]*=1.04;if(p[1]>1.525&&p[1]<1.575)p[1]=1.548+(p[1]-1.548)*.82}
   if(m===face){
    // A tapered jaw and chin replace the round lower face.
    const t=sstep(1.50,1.335,p[1]);p[0]*=1-t*(female?.26:.18);
    if(p[2]>0)p[2]+=t*.012*Math.max(0,1-Math.abs(p[0])/.08);
   }
  }
  // Larger eyes, as on the reference sheet: scale the eye sheets and lash lines about each eye.
  const box=m.v.reduce((a,p)=>[Math.min(a[0],Math.abs(p[0])),Math.max(a[1],Math.abs(p[0])),Math.min(a[2],p[1]),Math.max(a[3],p[1]),Math.min(a[4],p[2])],[9,0,9,0,9]);
  if(m!==face&&box[0]>.02&&box[1]<.11&&box[2]>1.5&&box[3]<1.62&&box[4]>.1){
   const brow=box[2]>1.585;
   for(const p of m.v){if(brow){p[1]+=.009;p[2]+=.002;continue}
    const cx=Math.sign(p[0])*.064;p[0]=cx+(p[0]-cx)*1.2;p[1]=1.548+(p[1]-1.548)*1.22;p[2]+=.003}
  }
  m.color=m.color==="#e6aa88"?skin:m.color;if(m.pal)m.pal=m.pal.map(e=>e.c==="#e6aa88"?{...e,c:skin}:e);
 }
 (female?femaleHair:maleHair)(b.meshes,b.bones);

 const torsoBind=bind(["hips","spine","chest","neck","shoulder.L","shoulder.R"]);
 const TS=48;
 const tk=female?[
  {y:.74,rx:.176,rz:.122,e:2.2},{y:.84,rx:.158,rz:.108,e:2.2},{y:.94,rx:.145,rz:.102,e:2.2},{y:1.04,rx:.165,rz:.116,e:2.2},
  {y:1.13,rx:.178,rz:.124,e:2.2},{y:1.20,rx:.178,rz:.112,e:2.3},{y:1.25,rx:.158,rz:.088,e:2.2},{y:1.29,rx:.10,rz:.068},{y:1.32,rx:.062,rz:.058}
 ]:[
  {y:.74,rx:.172,rz:.12,e:2.2},{y:.84,rx:.158,rz:.112,e:2.2},{y:.94,rx:.168,rz:.116,e:2.2},{y:1.04,rx:.198,rz:.132,e:2.2},
  {y:1.13,rx:.222,rz:.15,e:2.2},{y:1.20,rx:.222,rz:.128,e:2.3},{y:1.25,rx:.19,rz:.10,e:2.2},{y:1.29,rx:.13,rz:.078},{y:1.32,rx:.074,rz:.066}
 ];
 const torso=add(G.loft(tk,{seg:TS,steps:4,tag:"torso",mat:"skin",color:skin,bind:torsoBind}));
 const armRings={};
 sculpt(torso,TS,(phi,y)=>{
  const a=Math.abs(phi);let f=0;
  if(female){
   f+=.17*gs(y,1.095,.055)*ga(a,.48,.36);                       // bust
   f+=.05*gs(y,1.15,.06)*ga(a,2.55,.4);                         // shoulder blades
  }else{
   f+=.13*gs(y,1.135,.055)*ga(a,.55,.42)*(y<1.09?.6:1);         // pectorals
   f+=.03*(gs(y,1.0,.025)+gs(y,.935,.025)+gs(y,.875,.025))*ga(a,.22,.16);   // abdominals
   f+=.06*gs(y,1.07,.07)*ga(a,1.5,.35);                         // lats
   f+=.08*gs(y,1.16,.06)*ga(a,2.45,.42)+.04*gs(y,1.24,.03)*ga(a,2.0,.5);   // shoulder blades, traps
  }
  f-=.05*ga(phi,Math.PI,.14)*gs(y,1.02,.2);                      // spine groove
  f-=.025*ga(a,0,.08)*gs(y,1.05,.12);                            // sternum line
  return f;
 });
 torso.pal=[{c:skin,mat:"skin"},{c:"#e8a888",mat:"skin",line:false},{c:"#c98468",mat:"skin",line:false}];
 torso.paint=p=>{
  const x=Math.abs(p[0]),y=p[1];
  if(p[2]>.05&&Math.hypot(p[0]/.006,(y-.83)/.008)<1)return 2;
  if(p[2]>.05&&U.seg2(x,y,.03,1.262,.15,1.24)<.0035)return 1;
  return 0;
 };
 add(G.loft(female?[{y:1.22,rx:.06,rz:.058},{y:1.31,rx:.053,rz:.054},{y:1.40,rx:.05,rz:.052}]:[{y:1.22,rx:.078,rz:.072},{y:1.31,rx:.069,rz:.066},{y:1.40,rx:.064,rz:.062}],
  {seg:24,steps:2,tag:"neck",color:skin,mat:"skin",bind:bind(["chest","neck","head"])}));

 // Shorts: a waistband, a full seat and two loose, square legs to mid-thigh.
 const shortsBind=bind(["hips","spine"]);
 add(G.loft([{y:.725,rx:.186,rz:.132,e:2.3},{y:.775,rx:.181,rz:.128,e:2.3}],{seg:40,steps:1,tag:"torso.tie",bind:shortsBind,
  pal:[{c:linen,mat:"cloth"},{c:seam,mat:"cloth",line:false}],paint:p=>p[1]<.731||p[1]>.769?1:0}));
 for(const s of[-1,1]){
  add(G.tube([{p:[s*.006,.752,.134],r:.0045},{p:[s*.03,.758,.142],r:.0045},{p:[s*.02,.744,.143],r:.004},{p:[s*.004,.75,.139],r:.004}],
   {seg:6,steps:2,color:cord,tag:"torso.lace",bind:shortsBind,ink:false}));
  add(G.tube([{p:[s*.004,.748,.14],r:.004},{p:[s*.012,.715,.146],r:.0035},{p:[s*.009,.685,.147],r:.0035}],
   {seg:6,steps:2,color:cord,tag:"torso.lace",bind:shortsBind,ink:false}));
 }
 const hem=female?.555:.53;
 for(const[s,S]of[[1,"L"],[-1,"R"]]){
  const LS=36;
  const shorts=G.loft([{y:.745,rx:.098,rz:.132,cx:s*.088,e:2.4},{y:.68,rx:.112,rz:.142,cx:s*.092,e:2.4},{y:.61,rx:.118,rz:.13,cx:s*.103,e:2.5},{y:hem,rx:.121,rz:.125,cx:s*.108,e:2.6}],
   {seg:LS,steps:4,cap:false,twoSided:true,back:"#b8a684",tag:"leg."+S+".braies",bind:bind(["hips","thigh."+S]),mat:"cloth",
    pal:[{c:linen},{c:seam,line:false},{c:"#dccfb4",line:false}],
    paint:p=>{const y=p[1];if(y<hem+.012)return 1;     if(p[2]>0&&Math.abs(p[0])<.003&&y>.64)return 2;return 0}});
  sculpt(shorts,LS,(phi,y)=>.10*gs(y,.68,.05)*ga(phi,Math.PI-s*.45,.6)+.012*Math.sin(phi*5+s)*sstep(.66,hem,y));
  add(shorts);

  // Arms: deltoid cap, biceps and triceps, a narrow elbow and a tapering forearm.
  const AS=28,af=female?.84:1.1;
  const ak=[
   {y:1.285,rx:.04,rz:.046,cx:s*.192},{y:1.245,rx:.086,rz:.09,cx:s*.222},{y:1.17,rx:.082,rz:.082,cx:s*.246},
   {y:1.09,rx:.068,rz:.072,cx:s*.268,cz:.006},{y:1.0,rx:.055,rz:.058,cx:s*.29,cz:.01},{y:.96,rx:.052,rz:.054,cx:s*.299,cz:.012},
   {y:.90,rx:.066,rz:.062,cx:s*.312,cz:.02},{y:.82,rx:.055,rz:.05,cx:s*.328,cz:.026},{y:.735,rx:.036,rz:.034,cx:s*.346,cz:.034}
  ].map((r,i)=>({...r,rx:r.rx*(i?af:1),rz:r.rz*(i?af:1)}));
  armRings[S]=ak;
  const arm=G.loft(ak,{seg:AS,steps:4,tag:"arm."+S,color:skin,mat:"skin",
   bind:bind(["shoulder."+S,"upperarm."+S,"forearm."+S,"hand."+S])});
  const m=female?.5:1;
  sculpt(arm,AS,(phi,y)=>m*(.10*gs(y,1.075,.05)*ga(phi,s*.15,.75)+.08*gs(y,1.10,.06)*ga(phi,Math.PI,.8)
   +.10*gs(y,.89,.045)*ga(phi,s*.9,.8)+.05*gs(y,1.19,.04)*ga(phi,s*1.4,.7)));
  add(arm);

  // Legs: full thighs, inner knee, defined calves and slim ankles.
  const LG=28,lf=female?1:1.06;
  const leg=G.loft([
   {y:.70,rx:.104,rz:.11,cx:s*.084},{y:.60,rx:.108,rz:.112,cx:s*.088},{y:.50,rx:.094,rz:.098,cx:s*.092},{y:.42,rx:.074,rz:.08,cx:s*.095,cz:.006},
   {y:.37,rx:.063,rz:.068,cx:s*.096,cz:.012},{y:.31,rx:.068,rz:.075,cx:s*.097},{y:.25,rx:.07,rz:.077,cx:s*.098,cz:-.008},
   {y:.18,rx:.05,rz:.054,cx:s*.098},{y:.12,rx:.037,rz:.041,cx:s*.098}
  ].map(r=>({...r,rx:r.rx*lf,rz:r.rz*lf})),{seg:LG,steps:5,tag:"leg."+S,color:skin,mat:"skin",bind:bind(["hips","thigh."+S,"shin."+S,"foot."+S])});
  const lm=female?.6:1;
  sculpt(leg,LG,(phi,y)=>lm*(.08*gs(y,.55,.07)*ga(phi,s*.35,.6)+.11*gs(y,.44,.035)*ga(phi,-s*1.1,.5)
   +.2*gs(y,.275,.05)*ga(phi,Math.PI+s*.5,.7)+.12*gs(y,.29,.05)*ga(phi,Math.PI-s*.6,.5)+.05*gs(y,.375,.018)*ga(phi,0,.45))
   +(female?.05*gs(y,.62,.08)*ga(phi,s*1.5,.6):0));
  add(leg);

  // Feet: broad soles, a rounded heel and five toes.
  const foot=G.loft([{y:.13,rx:.036,rz:.044},{y:.085,rx:.044,rz:.066,cz:.014},{y:.045,rx:.06,rz:.112,cz:.044},{y:.015,rx:.063,rz:.12,cz:.046},{y:.0,rx:.058,rz:.112,cz:.046}],
   {seg:24,steps:3,tag:"foot."+S,color:skin,mat:"skin",bind:bind(["shin."+S,"foot."+S])});
  add(G.xform(foot,{s:[1.12,1,1.14],ry:s*.12,t:[s*.098,0,0]}));
  for(let i=0;i<5;i++){const big=i?0:.004;
   add(G.xform(G.ball(.012+big-i*.001,.014+big*.5,.02+big-i*.002,{seg:10,rings:6,tag:"foot."+S,color:skin,mat:"skin",bind:"foot."+S,ink:false}),
    {s:[1.1,1,1.1],t:[s*(.077+i*.021),.016,.198-i*.013]}));
  }

  // Hands: a flat palm, four slightly curled fingers on the closing bone, and an opposed thumb.
  const hf=female?.92:1,hand0=b.meshes.length;
  add(G.loft([{y:.765,rx:.03*hf,rz:.03*hf,cx:s*.344,cz:.033},{y:.735,rx:.031*hf,rz:.036*hf,cx:s*.347,cz:.036},{y:.70,rx:.026*hf,rz:.047*hf,cx:s*.352,cz:.042},{y:.655,rx:.024*hf,rz:.05*hf,cx:s*.358,cz:.044},
   {y:.635,rx:.021*hf,rz:.046*hf,cx:s*.36,cz:.044}],{seg:20,steps:3,tag:"hand."+S,color:skin,mat:"skin",bind:bind(["forearm."+S,"hand."+S])}));
  [.052,.068,.075,.068].forEach((len,i)=>{
   const z=.044+(i-1.5)*.021*hf,L=len*hf;
   add(G.tube([{p:[s*.359,.652,z],r:.0108*hf},{p:[s*.363,.652-L*.5,z+.003],r:.0098*hf},{p:[s*.356,.652-L*.85,z+.006],r:.0085*hf},{p:[s*.35,.652-L,z+.007],r:.006*hf}],
    {seg:10,steps:3,tag:"hand."+S,color:skin,mat:"skin",bind:"fingers."+S,ink:false}));
  });
  add(G.tube([{p:[s*.347,.712,.07],r:.016*hf},{p:[s*.338,.678,.092],r:.0135*hf},{p:[s*.336,.645,.101],r:.0105*hf},{p:[s*.341,.625,.098],r:.007*hf}],
   {seg:10,steps:3,tag:"hand."+S,color:skin,mat:"skin",bind:"hand."+S,ink:false}));
  // The reference hands are large: scale them about the wrist.
  const wrist=[s*.346,.735,.034],hk=female?1.12:1.25;
  const ry=-s*.7,cy=Math.cos(ry),sy=Math.sin(ry);   // turn the back of the hand slightly forward
  for(const m of b.meshes.slice(hand0))for(const p of m.v){
   for(let k=0;k<3;k++)p[k]=wrist[k]+(p[k]-wrist[k])*hk;
   const dx=p[0]-wrist[0],dz=p[2]-wrist[2];p[0]=wrist[0]+dx*cy+dz*sy;p[2]=wrist[2]-dx*sy+dz*cy;
  }
 }

 if(female){
  // Square-necked crop top fitted to the sculpted chest, with straps and side lacing.
  const top=band(torso,TS,1.0,1.215,.008,{cut:p=>p[2]>0&&Math.abs(p[0])<.115&&p[1]>1.17,tag:"torso.bodice",mat:"cloth",bind:torsoBind,back:"#b8a684",
   pal:[{c:linen},{c:seam,line:false},{c:skin,mat:"skin"}],
   paint:p=>{const x=Math.abs(p[0]),y=p[1],front=p[2]>0&&x<.13;
    return y<1.012||y>(front?1.162:1.203)||p[2]>0&&Math.abs(x-.122)<.004&&y>1.165?1:0}});
  add(top);
  for(const s of[-1,1]){
   add(G.sheet((u,v)=>{const t=v*Math.PI;return[s*(.132+.03*(u-.5)),1.198+.088*Math.sin(t),.122*Math.cos(t)]},3,16,{tag:"torso.bodice",color:linen,mat:"cloth",bind:torsoBind}));
   for(let i=0;i<4;i++){
    const y=1.03+i*.038,x=s*.178;
    add(G.tube([{p:[x,y,-.024],r:.003},{p:[x+s*.006,y+.031,.024],r:.003}],{seg:6,steps:1,color:cord,tag:"torso.bodice",bind:torsoBind,ink:false}));
    add(G.tube([{p:[x,y,.024],r:.003},{p:[x+s*.006,y+.031,-.024],r:.003}],{seg:6,steps:1,color:cord,tag:"torso.bodice",bind:torsoBind,ink:false}));
   }
  }
 }
 // Publish the fitted rings (with an allowance for the sculpted muscle) so clothing wraps this body.
 const env=(r,k)=>({...r,rx:r.rx*k,rz:r.rz*k});
 H3.body.dims.rings.torso=[...tk.slice().reverse().map(r=>env(r,r.y>1.0&&r.y<1.22?1.1:1.03)),...RINGS.torso.filter(r=>r.y<tk[0].y-.01)];
 H3.body.dims.rings.arm={L:armRings.L.map(r=>env(r,1.12)),R:armRings.R.map(r=>env(r,1.12))};
 // Smooth shading throughout; inner ink is left to the hair and garments.
 for(const m of b.meshes){
  m.smooth=true;
  if(/^(torso|arm|leg|neck|hand|foot)/.test(m.tag)&&!/braies|bodice|tie/.test(m.tag))m.ink=false;
 }
 return b;
};
})();
