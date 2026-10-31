// ================= ART 3D: BASE BODY =================
// The unequipped hero: the figure, face and hair, in plain base clothes (linen undershirt,
// simple trousers, foot wraps). Everything worn or held is gear (art3d/gear/*.js).
//
// CONTRACT (other modules rely on these; change values freely, keep the names):
//   H3.body.bones     skeleton definition (bone names are fixed, see BONES below)
//   H3.body.dims      measurements gear fits to (rest pose, metres)
//   H3.body.build(o)  -> {meshes, colliders}; every mesh has a tag (for gear `hides`) and a bind
//   H3.body.C         base palette
// Body mesh tags: head (head.ears too), hair (hair.back / hair.top / hair.front), neck, torso, arm.L/R, hand.L/R,
// leg.L/R, foot.L/R. Gear hides by tag prefix ("hair" hides every hair.* part).
(function(){
"use strict";
const{G,U}=H3,{loft,tube,ball,sheet,xform,mirrorX}=G,{seg2,clamp,sstep}=U;
const C={skin:"#bd8e6d",skinLine:"#a8795c",blush:"#c98a72",hair:"#38251c",hairHi:"#4c3324",eye:"#2b201b",eyeWhite:"#efe6d6",brow:"#3a271d",mouth:"#80533e",
  shirt:"#cdbb98",shirtLine:"#a9966f",pants:"#4d4236",pantsLine:"#3a3129",wrap:"#9c8a6c",wrapLine:"#7a6a50"};

// ---------- skeleton (rest pose; .L is the figure's left, +x) ----------
const J={hips:[0,0.66,0],spine:[0,0.8,0],chest:[0,1.0,0],neck:[0,1.27,0],head:[0,1.355,0.01],headTop:[0,1.76,0.01],
  clav:[0.05,1.215,0],shoulder:[0.212,1.212,0],elbow:[0.298,0.965,0.012],wrist:[0.346,0.728,0.032],knuckle:[0.358,0.635,0.04],tip:[0.362,0.56,0.04],
  hip:[0.09,0.64,0],knee:[0.096,0.37,0.012],ankle:[0.098,0.105,0],toe:[0.1,0.03,0.17]};
const L=p=>p.slice(),Rr=p=>[-p[0],p[1],p[2]];
const BONES=[
  {name:"root",head:[0,0,0],tail:[0,0.1,0]},
  {name:"hips",parent:"root",head:J.hips,tail:J.spine},
  {name:"spine",parent:"hips",head:J.spine,tail:J.chest},
  {name:"chest",parent:"spine",head:J.chest,tail:J.neck},
  {name:"neck",parent:"chest",head:J.neck,tail:J.head},
  {name:"head",parent:"neck",head:J.head,tail:J.headTop},
];
for(const[s,f]of[["L",L],["R",Rr]])BONES.push(
  {name:"shoulder."+s,parent:"chest",head:f(J.clav),tail:f(J.shoulder)},
  {name:"upperarm."+s,parent:"shoulder."+s,head:f(J.shoulder),tail:f(J.elbow)},
  {name:"forearm."+s,parent:"upperarm."+s,head:f(J.elbow),tail:f(J.wrist)},
  {name:"hand."+s,parent:"forearm."+s,head:f(J.wrist),tail:f(J.knuckle)},
  {name:"fingers."+s,parent:"hand."+s,head:f(J.knuckle),tail:f(J.tip)},
  {name:"thigh."+s,parent:"hips",head:f(J.hip),tail:f(J.knee)},
  {name:"shin."+s,parent:"thigh."+s,head:f(J.knee),tail:f(J.ankle)},
  {name:"foot."+s,parent:"shin."+s,head:f(J.ankle),tail:f(J.toe)});

// ---------- shapes (loft keys, shared with gear through dims.rings) ----------
const TORSO=[{y:1.3,rx:0.075,rz:0.065},{y:1.268,rx:0.15,rz:0.1,e:2.4},{y:1.225,rx:0.198,rz:0.118,e:2.8},{y:1.13,rx:0.206,rz:0.126,e:2.9},
  {y:1.0,rx:0.186,rz:0.12,e:2.9},{y:0.88,rx:0.164,rz:0.112,e:2.8},{y:0.76,rx:0.172,rz:0.118,e:2.8},{y:0.66,rx:0.186,rz:0.126,e:2.8},
  {y:0.585,rx:0.16,rz:0.11,e:2.6},{y:0.555,rx:0.07,rz:0.06}];
const armKeys=s=>[{y:1.262,rx:0.045,rz:0.045,cx:s*0.196},{y:1.232,rx:0.074,rz:0.078,cx:s*0.214},{y:1.13,rx:0.068,rz:0.07,cx:s*0.25,cz:0.004},
  {y:0.98,rx:0.059,rz:0.061,cx:s*0.296,cz:0.012},{y:0.86,rx:0.056,rz:0.058,cx:s*0.322,cz:0.022},{y:0.76,rx:0.046,rz:0.047,cx:s*0.34,cz:0.03},
  {y:0.72,rx:0.044,rz:0.045,cx:s*0.347,cz:0.033}];
const legKeys=s=>[{y:0.7,rx:0.098,rz:0.104,cx:s*0.084,e:2.5},{y:0.6,rx:0.096,rz:0.1,cx:s*0.088,e:2.5},{y:0.48,rx:0.084,rz:0.088,cx:s*0.092,e:2.4},
  {y:0.37,rx:0.072,rz:0.076,cx:s*0.095},{y:0.26,rx:0.07,rz:0.074,cx:s*0.097},{y:0.16,rx:0.058,rz:0.062,cx:s*0.098},{y:0.11,rx:0.055,rz:0.058,cx:s*0.098}];
const HEAD=[{y:1.32,rx:0.02,rz:0.02,cz:0.06},{y:1.345,rx:0.075,rz:0.07,cz:0.05},{y:1.4,rx:0.12,rz:0.12,cz:0.03},
  {y:1.47,rx:0.142,rz:0.148,cz:0.022},{y:1.56,rx:0.148,rz:0.156,cz:0.02},{y:1.65,rx:0.138,rz:0.145,cz:0.01},
  {y:1.72,rx:0.09,rz:0.1},{y:1.75,rx:0.02,rz:0.02}];

const dims={
  height:1.76,
  head:{c:[0,1.54,0.02],r:[0.148,0.215,0.156],top:1.75,chin:1.33,brow:1.6,eyes:1.535},
  neck:{y0:1.25,y1:1.37,r:0.064},
  shoulderTop:1.268,chest:{y:1.13,rx:0.206,rz:0.126},waist:{y:0.88,rx:0.164,rz:0.112},hips:{y:0.66,rx:0.186,rz:0.126},crotch:0.57,
  joints:{},                 // filled below: joints.shoulder.L etc. (rest positions)
  arm:{upper:0.07,elbow:0.06,fore:0.057,wrist:0.045},
  leg:{thigh:0.098,knee:0.074,calf:0.072,ankle:0.058},
  hand:{len:0.19,w:0.056,palm:[0.355,0.672,0.04]},
  foot:{len:0.26,w:0.085,h:0.1,heel:-0.06,toe:0.19},
  // held-item grip: items are authored with the handle along +Y, origin at the grip centre;
  // xform(mesh,{rx,ry,rz,t:at}) puts them in the closed fist (rest pose), bound to `bone`.
  grip:{R:{bone:"hand.R",at:[-0.32,0.64,0.03],rx:Math.PI/2,ry:0,rz:0},L:{bone:"hand.L",at:[0.32,0.64,0.03],rx:Math.PI/2,ry:0,rz:0}},
  rings:{torso:TORSO,arm:{L:armKeys(1),R:armKeys(-1)},leg:{L:legKeys(1),R:legKeys(-1)},head:HEAD},
};
for(const[k,v]of Object.entries(J))dims.joints[k]={L:L(v),R:Rr(v)};
// inflate(keys, d): copy of ring keys grown by d (for clothing that hugs the body)
const inflate=(keys,d,dz)=>keys.map(r=>Object.assign({},r,{rx:r.rx+d,rz:r.rz+(dz==null?d:dz)}));
// ---------- skin weights for bind:{fn} (rest-space vertex -> [[bone,w],...]) ----------
const BY={};for(const b of BONES)BY[b.name]=b;
// inverse-distance weights to bone segments, as R.bindAuto does (power pw)
const segW=(p,names,pw)=>{const ws=names.map(n=>{const B=BY[n];return[n,1/Math.pow(Math.max(U.seg3(p,B.head,B.tail),1e-3),pw)]});
  const s=ws.reduce((a,x)=>a+x[1],0);return ws.map(([n,w])=>[n,w/s])};
// how much of a shoulder-area vertex follows the upper arm: most at the joint, fading out over
// ~0.1 m, and nothing below the armpit (y<1.1), so a raised arm lifts the cap but not the chest
const shoulderShare=(p,S)=>{const J=dims.joints.shoulder[S],d=Math.hypot(p[0]-J[0],p[1]-J[1],p[2]-J[2]);
  return 0.55*sstep(1.1,1.24,p[1])*(1-sstep(0.05,0.14,d))};
// blend a base weight list with upperarm.S by shoulderShare (merges duplicate bones)
const capW=(p,base,S)=>{const a=shoulderShare(p,S);if(a<1e-3)return base;
  const out=base.map(([n,w])=>[n,w*(1-a)]);const k=out.find(x=>x[0]==="upperarm."+S);if(k)k[1]+=a;else out.push(["upperarm."+S,a]);return out};

function build(o){
  o=o||{};const M=[];
  // --- torso: linen undershirt with a round neckline and short sleeves, trousers below the waist
  // the round neckline is only painted at the front (p[2]>0); the back of the shirt runs up to the nape
  const neckline=p=>{const ax=Math.abs(p[0]);return p[2]>0&&p[1]>1.215+ax*0.9};
  M.push(loft(TORSO,{seg:40,steps:5,tag:"torso",pal:[{c:C.shirt},{c:C.skin,mat:"skin"},{c:C.pants},{c:C.shirtLine,line:false}],
    paint:p=>neckline(p)?1:p[1]<0.735?2:(p[2]>0.05&&Math.abs(p[0])<0.004&&p[1]>1.08)?3:0,
    bind:{fn:p=>capW(p,segW(p,["hips","spine","chest","neck","shoulder.L","shoulder.R"],4),p[0]>=0?"L":"R")}}));
  M.push(loft([{y:1.2,rx:0.064,rz:0.062},{y:1.3,rx:0.062,rz:0.06},{y:1.39,rx:0.06,rz:0.058}],{seg:20,steps:2,tag:"neck",color:C.skin,mat:"skin",
    bind:{bones:["chest","neck","head"],power:4}}));
  // drawstring across the front of the neckline, with two tassels (torso.lace); a cord tie at the waist of
  // the trousers (torso.tie). Separate tags, so clothing worn over them can hide them.
  M.push(tube([{p:[-0.032,1.236,0.124],r:0.0075},{p:[0,1.222,0.132],r:0.0075},{p:[0.032,1.236,0.124],r:0.0075}],{seg:8,steps:3,tag:"torso.lace",color:"#8a7050",mat:"cloth",
    bind:{fn:p=>segW(p,["chest","neck"],4)}}));
  for(const s of[1,-1])M.push(tube([{p:[s*0.02,1.226,0.13],r:0.0065},{p:[s*0.025,1.204,0.134],r:0.006},{p:[s*0.027,1.186,0.137],r:0.0075}],{seg:8,steps:3,tag:"torso.lace",color:"#8a7050",mat:"cloth",
    bind:{fn:p=>segW(p,["chest","neck"],4)}}));
  M.push(loft([{y:0.728,rx:0.186,rz:0.13,e:2.8},{y:0.742,rx:0.187,rz:0.131,e:2.8},{y:0.75,rx:0.186,rz:0.13,e:2.8}],{seg:40,steps:2,tag:"torso.tie",color:"#7d6a4b",mat:"cloth",
    bind:{fn:p=>segW(p,["hips","spine"],4)}}));
  M.push(xform(ball(0.018,0.016,0.016,{seg:12,rings:6,tag:"torso.tie",color:"#7d6a4b",mat:"cloth",bind:{fn:p=>segW(p,["hips","spine"],4)}}),{t:[0,0.738,0.142]}));
  for(const s of[1,-1])M.push(tube([{p:[s*0.01,0.734,0.14],r:0.0055},{p:[s*0.022,0.71,0.15],r:0.0055},{p:[s*0.03,0.68,0.158],r:0.0048}],{seg:8,steps:3,tag:"torso.tie",color:"#7d6a4b",mat:"cloth",
    bind:{fn:p=>segW(p,["hips","spine"],4)}}));
  // --- arms: short linen sleeves to mid upper arm, bare forearms
  for(const[s,S]of[[1,"L"],[-1,"R"]]){
    M.push(loft(armKeys(s),{seg:24,steps:4,tag:"arm."+S,pal:[{c:C.skin,mat:"skin"},{c:C.shirt}],paint:p=>p[1]>1.075-0.02*(p[2]>0?1:0)?1:0,
      bind:{fn:p=>capW(p,segW(p,["shoulder."+S,"upperarm."+S,"forearm."+S,"hand."+S],4),S)}}));
    M.push(loft([{y:1.072,rx:0.074,rz:0.076,cx:s*0.26,cz:0.006},{y:1.1,rx:0.078,rz:0.08,cx:s*0.259,cz:0.006},{y:1.122,rx:0.075,rz:0.077,cx:s*0.256,cz:0.005}],
      {seg:24,steps:3,tag:"arm."+S,color:C.shirtLine,mat:"cloth",bind:"upperarm."+S}));   // rolled cuff
    // hand (built on the left, mirrored for the right): a chunky mitten. A palm, a finger block
    // bound to fingers.S (so fingers.S closes the fist), a painted split between the index finger
    // (thumb side, +z) and the other fingers, and a thumb on the front of the palm.
    const palm=loft([{y:0.736,rx:0.042,rz:0.05,cx:0.347,cz:0.034},{y:0.7,rx:0.04,rz:0.056,cx:0.352,cz:0.038},
      {y:0.665,rx:0.039,rz:0.056,cx:0.355,cz:0.04},{y:0.636,rx:0.035,rz:0.05,cx:0.357,cz:0.04}],{seg:28,steps:3,mat:"skin",color:C.skin});
    const finger=loft([{y:0.645,rx:0.034,rz:0.054,cx:0.357,cz:0.04},{y:0.615,rx:0.036,rz:0.056,cx:0.36,cz:0.04},{y:0.585,rx:0.034,rz:0.052,cx:0.361,cz:0.04},
      {y:0.558,rx:0.027,rz:0.042,cx:0.362,cz:0.04},{y:0.54,rx:0.016,rz:0.028,cx:0.362,cz:0.04},{y:0.53,rx:0.005,rz:0.008,cx:0.362,cz:0.04}],
      {seg:28,steps:3,mat:"skin",pal:[{c:C.skin,mat:"skin"},{c:C.skinLine,mat:"skin"}],
       paint:p=>(p[2]>0.062&&p[2]<0.07&&p[1]<0.64&&p[1]>0.55)?1:0});
    const thumb=tube([{p:[0.349,0.7,0.085],r:0.023},{p:[0.345,0.67,0.108],r:0.023},{p:[0.344,0.64,0.114],r:0.02},{p:[0.347,0.62,0.104],r:0.017}],{seg:14,mat:"skin",color:C.skin});
    palm.bind={fn:p=>{const a=sstep(0.69,0.72,p[1]);return[["forearm."+S,a],["hand."+S,1-a]]}};
    finger.bind={fn:p=>{const f=sstep(0.645,0.625,p[1]);return[["hand."+S,1-f],["fingers."+S,f]]}};
    thumb.bind={fn:p=>{const t=sstep(0.68,0.63,p[1]);return[["hand."+S,1-t],["fingers."+S,t]]}};
    for(const h of[palm,finger,thumb]){if(s<0)mirrorX(h);h.tag="hand."+S;M.push(h)}
  }
  // --- legs: trousers, wrapped at the shin
  for(const[s,S]of[[1,"L"],[-1,"R"]]){
    M.push(loft(legKeys(s),{seg:26,steps:4,tag:"leg."+S,pal:[{c:C.pants},{c:C.wrap,line:false},{c:C.wrapLine,line:false}],
      paint:p=>p[1]<0.27?((p[1]*55+p[0]*s*8)%1<0.2?2:1):0,bind:{bones:["hips","thigh."+S,"shin."+S,"foot."+S],power:4}}));
    const foot=loft([{y:0.135,rx:0.055,rz:0.058},{y:0.1,rx:0.062,rz:0.07,cz:0.01},{y:0.06,rx:0.074,rz:0.115,cz:0.045,e:2.3},
      {y:0.025,rx:0.078,rz:0.135,cz:0.058,e:2.5},{y:0,rx:0.074,rz:0.13,cz:0.058,e:2.5}],{seg:28,steps:3,tag:"foot."+S,
      pal:[{c:C.wrap,line:false},{c:C.skin,mat:"skin"},{c:C.wrapLine,line:false}],paint:p=>p[2]>0.135?1:((p[2]*40)%1<0.1&&p[1]>0.02?2:0)});
    xform(foot,{ry:s*0.22,t:[s*0.098,0,0]});foot.bind={bones:["shin."+S,"foot."+S],power:5};M.push(foot);
  }
  // --- head: a skin shell (hair-coloured under the hair shells), open eyes with a catch-light and an
  // upper lid line, brows, nose, a small smile
  const eye=(p,s)=>{const dx=(p[0]-s*0.072)/0.019,dy=(p[1]-1.533)/0.026;return dx*dx+dy*dy};
  const brow=(p,s)=>seg2(p[0],p[1],s*0.05,1.585,s*0.1,1.592);
  const nose=p=>Math.min(seg2(p[0],p[1],0.004,1.52,-0.012,1.47),seg2(p[0],p[1],-0.012,1.47,0.01,1.468));
  const mouth=p=>{const x=clamp(p[0],-0.03,0.03);return Math.hypot(p[0]-x,p[1]-(1.4+0.016*(x/0.03)**2))};
  const fringe=x=>(x<-0.03?1.684-5.2*(x+0.03)**2:x<0.05?1.684-0.06*(x+0.03):1.679-0.88*(x-0.05))+0.005*Math.sin(x*95);
  M.push(loft(HEAD,{seg:40,steps:6,tag:"head",mat:"skin",
    pal:[{c:C.skin,mat:"skin"},{c:C.hair,mat:"hair"},{c:C.eye,line:false},{c:C.skinLine,line:false,mat:"skin"},{c:C.mouth,line:false,mat:"skin"},{c:C.eyeWhite,line:false,mat:"glow"},{c:C.brow,line:false},{c:C.blush,line:false,mat:"skin"},{c:C.eye,mat:"skin"}],
    paint:p=>{if(p[1]>fringe(p[0])||p[2]<-0.04)return 1;if(p[2]<0.09)return 0;
      for(const s of[-1,1]){const e=eye(p,s);
        if(e<1){const hx=(p[0]-s*0.072+0.007)/0.006,hy=(p[1]-1.542)/0.007;return hx*hx+hy*hy<1?5:2}
        if(e<1.5&&p[1]>1.538)return 8;                 // upper lid line: the band just above the iris
        if(brow(p,s)<0.0065)return 6}
      if(nose(p)<0.0034)return 3;if(mouth(p)<0.0038)return 4;
      for(const s of[-1,1]){const dx=(p[0]-s*0.095)/0.03,dy=(p[1]-1.47)/0.018;if(dx*dx+dy*dy<1)return 7}
      return 0},bind:"head"}));
  // --- hair: three shells sit just off the skull. hair.back covers the back, nape and sides (its front
  // edge runs from behind the ears up to the temples), hair.top the crown, hair.front a swept fringe
  // over the forehead. Locks hang at the nape and the temples. Hoods can keep hair.front.
  const skullZ=(x,y)=>{let k=0;while(k<HEAD.length-2&&HEAD[k+1].y<y)k++;const a=HEAD[k],b=HEAD[k+1],t=clamp((y-a.y)/(b.y-a.y),0,1),
    rx=a.rx+(b.rx-a.rx)*t,rz=a.rz+(b.rz-a.rz)*t,cz=(a.cz||0)+((b.cz||0)-(a.cz||0))*t;return cz+rz*Math.sqrt(Math.max(0,1-(x/rx)**2))};
  const HAIRTOP=1.712;   // the fringe's top edge, tucked under the crown shell
  // the fringe: one swept shape. Its hairline follows the forehead, dipping at the temples with soft
  // scallops, and the sides taper in toward the crown (plain hair colour, no strands)
  M.push(sheet((u,v)=>{const x=-0.13+0.26*u,xs=x*(1-0.18*v),y0=fringe(x)-0.004-0.012*Math.pow(Math.abs(Math.sin(u*Math.PI*5)),2),y=y0+(HAIRTOP-y0)*v;return[xs,y,skullZ(xs,y)+0.01]},48,6,
    {tag:"hair.front",mat:"hair",color:C.hair,bind:"head"}));
  M.push(loft([{y:1.6,rx:0.158,rz:0.168,cz:0},{y:1.66,rx:0.158,rz:0.168,cz:0},{y:1.71,rx:0.14,rz:0.15,cz:-0.004},
    {y:1.75,rx:0.106,rz:0.116,cz:-0.006},{y:1.78,rx:0.06,rz:0.066,cz:-0.006},{y:1.8,rx:0.02,rz:0.02,cz:-0.006}],
    {seg:40,steps:5,tag:"hair.top",mat:"hair",open:y=>y<1.66?1.0:0,twoSided:true,back:"#24170f",
     pal:[{c:C.hair,mat:"hair"},{c:C.hairHi,mat:"hair",line:false}],paint:p=>(Math.atan2(p[0],p[2])*6+p[1]*26)%1.5<0.1?1:0,bind:"head"}));
  M.push(loft([{y:1.4,rx:0.112,rz:0.124,cz:-0.03},{y:1.5,rx:0.142,rz:0.158,cz:-0.012},{y:1.6,rx:0.156,rz:0.17,cz:-0.006},{y:1.66,rx:0.15,rz:0.162,cz:-0.004}],
    {seg:44,steps:5,tag:"hair.back",mat:"hair",open:y=>1.95-1.05*sstep(1.5,1.66,y),cap:false,twoSided:true,back:"#24170f",
     pal:[{c:C.hair,mat:"hair"},{c:C.hairHi,mat:"hair",line:false}],paint:p=>(Math.atan2(p[0],p[2])*7+p[1]*30)%1.6<0.12?1:0,bind:{bones:["neck","head"],power:4}}));
  // chunky locks at the nape (hair.back)
  for(const x of[-0.05,0,0.05])M.push(tube([{p:[x,1.66,-0.158],r:0.026},{p:[x*1.2,1.56,-0.172],r:0.03},{p:[x*1.3,1.46,-0.168],r:0.024},{p:[x*1.3,1.38,-0.152],r:0.013}],
    {seg:12,steps:3,tag:"hair.back",mat:"hair",color:C.hair,bind:{bones:["neck","head"],power:4}}));
  // Longer side locks distinguish the female profile, including under a hood.
  if(o.variant==="female")for(const s of[-1,1])M.push(tube([
    {p:[s*0.14,1.64,-0.035],r:0.035},{p:[s*0.15,1.47,-0.035],r:0.034},
    {p:[s*0.14,1.31,-0.045],r:0.027},{p:[s*0.16,1.22,-0.055],r:0.008}],
    {seg:14,steps:5,tag:"hair.back",mat:"hair",color:C.hair,bind:{bones:["neck","head"],power:4}}));
  // ears, bound to the head (tag head.ears)
  for(const s of[1,-1])M.push(xform(ball(0.02,0.036,0.024,{seg:14,rings:6,tag:"head.ears",color:C.skin,mat:"skin",bind:"head"}),{t:[s*0.146,1.5,-0.004]}));
  // colliders for spring bones (capes, hood tips, long hair)
  const colliders=[{bone:"chest",a:[0,0.92,-0.02],b:[0,1.18,-0.02],r:0.15},{bone:"hips",a:[0,0.66,-0.01],r:0.17},
    {bone:"head",a:[0,1.56,0],r:0.172}];
  for(const s of["L","R"]){const j=k=>dims.joints[k][s];
    colliders.push({bone:"thigh."+s,a:j("hip"),b:j("knee"),r:0.095},{bone:"shin."+s,a:j("knee"),b:j("ankle"),r:0.075},
      {bone:"upperarm."+s,a:j("shoulder"),b:j("elbow"),r:0.07},{bone:"forearm."+s,a:j("elbow"),b:j("wrist"),r:0.058})}
  return{meshes:M,colliders};
}
H3.body={bones:BONES,dims,build,C,inflate};
})();
