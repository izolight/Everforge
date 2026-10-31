// ================= ART 3D: ANIMATIONS =================
// Clips for the base body (art3d/body.js). Conventions: art3d/README.md (Euler sign table).
// A clip is a pure function of its time: sample(t, ctx) -> {t:[root offset], r:{bone:[rx,ry,rz]}}.
//   idle     loop, 3.2 s                 walk     loop, 1.0 s, speed 1.3
//   run      loop, 0.66 s, speed 3.2     attack   one-shot, 0.9 s (sword slash or punch, see below)
//   cast     one-shot, 1.2 s             hit      one-shot, 0.5 s
//   block    one-shot, 0.8 s             victory  one-shot, 1.6 s
//   defeat   one-shot, 1.4 s             ends kneeling (the exception to "ends at idle")
// Feet: every leg rotation is about x, so each leg is a planar chain in (y,z). floorY() solves the root
// height that puts the lowest sole on the floor, so the hips drop only as the knees bend and a foot
// never sinks below y=0. Airborne phases blend the root to a hop height instead.
// attack variant: ctx.kind.main "sword" -> slash, anything else -> punch; ctx.kind.off "shield" -> guard.
(function(){
"use strict";
const TAU=Math.PI*2,PI=Math.PI;

// ---------- easing and keyframes ----------
const clamp01=x=>x<0?0:x>1?1:x;
const lerp=(a,b,k)=>a+(b-a)*k;
const linear=k=>k;
const sine=k=>0.5-0.5*Math.cos(PI*clamp01(k));
const inCubic=k=>{k=clamp01(k);return k*k*k};
const outCubic=k=>{k=clamp01(k);return 1-Math.pow(1-k,3)};
const inOutCubic=k=>{k=clamp01(k);return k<0.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2};
const outBack=k=>{k=clamp01(k);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2)};
// track(keys, t, ease): keys [[time, value, easeIn?], ...] in ascending time; value is a number or an
// array of numbers. A segment is eased by its later key's easeIn (else `ease`, else linear).
// Holds the first/last value outside the key range.
function track(keys,t,ease){
  const n=keys.length,cp=v=>Array.isArray(v)?v.slice():v;
  if(t<=keys[0][0])return cp(keys[0][1]);
  if(t>=keys[n-1][0])return cp(keys[n-1][1]);
  let i=0;while(t>=keys[i+1][0])i++;
  const a=keys[i],b=keys[i+1],k=(b[2]||ease||linear)((t-a[0])/(b[0]-a[0]));
  return Array.isArray(a[1])?a[1].map((x,j)=>lerp(x,b[1][j],k)):lerp(a[1],b[1],k);
}
const X=a=>[a,0,0];

// ---------- legs (planar, sagittal) ----------
// Rest geometry from body.js, as [y,z]: the hip joint is (0.64, 0) from the root; thigh offset to the
// knee (-0.27, 0.012); shin offset to the ankle (-0.265, -0.012); sole heel and toe from the ankle
// (-0.105, -0.072) and (-0.105, 0.19). Rotation by A about x: (y,z) -> (y cA - z sA, y sA + z cA).
const rot=(A,p)=>{const c=Math.cos(A),s=Math.sin(A);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c]};
// leg(a, s, c): thigh world pitch a, shin LOCAL pitch s, foot WORLD pitch c (all rx, radians)
function leg(a,s,c){
  const K=rot(a,[-0.27,0.012]);K[0]+=0.64;
  const A=rot(a+s,[-0.265,-0.012]);A[0]+=K[0];A[1]+=K[1];
  const h=rot(c,[-0.105,-0.072]),t=rot(c,[-0.105,0.19]);
  return{K,A,heel:[A[0]+h[0],A[1]+h[1]],toe:[A[0]+t[0],A[1]+t[1]]};
}
// Skinning blends the shin and foot near the ankle, so the real sole sits a few mm lower than the
// rest-geometry sole points; FOOT_MARGIN lifts the root to keep the skinned foot above y=0.
const FOOT_MARGIN=0.009;
// Root height that puts the lowest contact on its floor: soles at y=0, and for the kneeling leg
// (index `kneel` into legs, or -1) the knee underside at y=0.05 plus the shin and ankle undersides,
// so the drop onto the knee cannot push the boot through the floor. legs: [[a,s,c], ...] (left, right)
function floorY(legs,kneel){
  let m=Infinity;
  legs.forEach((l,i)=>{
    const g=leg(l[0],l[1],l[2]);m=Math.min(m,g.heel[0],g.toe[0]);
    if(i===kneel){const hb=rot(l[2],[-0.135,-0.12]);m=Math.min(m,g.K[0]-0.125,g.A[0]-0.1,(g.K[0]+g.A[0])/2-0.09,g.A[0]+hb[0])}
  });
  return -m+FOOT_MARGIN;
}
// local rx entries for one side from [a,s,c] (foot local = c - a - s)
const legPose=(S,[a,s,c])=>({["thigh."+S]:X(a),["shin."+S]:X(s),["foot."+S]:X(c-a-s)});
// both-feet-airborne weight and hop height at phase t for windows [[a,b],...]; ramp in phase units
function airborne(t,wins,peak,ramp){
  for(const[a,b]of wins)if(t>a&&t<b){const w=Math.min(1,(t-a)/ramp,(b-t)/ramp);return[sine(w),peak*Math.sin(PI*(t-a)/(b-a))]}
  return[0,0];
}

// ---------- idle (loop) ----------
const IDLE_D=3.2;
function idlePose(t){
  const u=TAU*t/IDLE_D,br=Math.sin(u),sw=Math.sin(u-1.2),arm=Math.sin(u+1.5),hd=Math.sin(u+0.5);
  return{t:[0,0,0],r:{
    spine:[0,0,0.02*sw],                              // slow weight shift
    chest:[0.02*br,0,-0.01*sw],                       // breathing
    head:[0.01*Math.sin(u+2),0.06*hd,0],              // small head motion
    "shoulder.L":[0,0,0.03+0.02*br],"shoulder.R":[0,0,-(0.03+0.02*br)],
    "upperarm.L":[0.02*arm,0,0.08],"upperarm.R":[0.02*arm,0,-0.08],
    "forearm.L":X(-0.15),"forearm.R":X(-0.15),
    "fingers.L":[0,0,-0.18],"fingers.R":[0,0,0.18]}};
}
H3.anim.register({id:"idle",name:"Idle",loop:true,duration:IDLE_D,view:0.6,sample:t=>idlePose(t)});
const I0=idlePose(0);   // the idle pose every one-shot starts and (mostly) ends on

// ---------- one-shot clips ----------
// shot(dur, spec, hold): spec maps a bone to absolute keys [[time, [rx,ry,rz], easeIn?], ...]. Bones
// not in spec keep the idle pose. Unless hold, each listed bone is anchored to the idle pose at 0 and
// at dur (the clip starts and ends on idle). hold: the last keys stay (the pose persists).
function shot(dur,spec,hold){
  const T={};
  for(const b of Object.keys(spec)){
    const base=(I0.r[b]||[0,0,0]).slice(),mid=spec[b].filter(k=>k[0]>0&&k[0]<dur);
    T[b]=[[0,base]].concat(mid,hold?[]:[[dur,base,inOutCubic]]);
  }
  return t=>{
    const r={};for(const b of Object.keys(I0.r))r[b]=I0.r[b].slice();
    for(const b of Object.keys(T))r[b]=track(T[b],t);
    return{t:[0,0,0],r};
  };
}

// hit: flinch backward, arms up to the face, recover
const HIT=shot(0.5,{
  chest:[[0.1,[-0.25,0,0.03],outCubic],[0.3,[-0.14,0,0],inOutCubic]],
  head:[[0.1,[-0.35,0.06,0.05],outCubic],[0.3,[-0.2,0,0],inOutCubic]],
  "upperarm.L":[[0.1,[-0.45,0,0.2],outCubic],[0.3,[-0.2,0,0.1],inOutCubic]],
  "upperarm.R":[[0.1,[-0.45,0,-0.2],outCubic],[0.3,[-0.2,0,-0.1],inOutCubic]],
  "forearm.L":[[0.1,[-1.1,0,0],outCubic],[0.3,[-0.6,0,0],inOutCubic]],
  "forearm.R":[[0.1,[-1.1,0,0],outCubic],[0.3,[-0.6,0,0],inOutCubic]]});

// block: the left forearm (and a shield on it) swung across the front of the body, held, lowered;
// the upper arm rolls inward (ry<0) so a shield faces forward
const BLOCK=shot(0.8,{
  chest:[[0.25,[0.08,0.12,0],outCubic],[0.6,[0.08,0.12,0]]],
  head:[[0.25,[0.05,0,0],outCubic],[0.6,[0.05,0,0]]],
  "upperarm.L":[[0.25,[-0.85,-1.2,0.25],outBack],[0.6,[-0.85,-1.2,0.25]]],
  "forearm.L":[[0.25,[-1.5,0,0],outCubic],[0.6,[-1.5,0,0]]],
  "fingers.L":[[0.25,[0,0,-1.1],outCubic],[0.6,[0,0,-1.1]]]});

// cast: hands gather in front of the chest, thrust forward with open palms, recover
const CAST=shot(1.2,{
  "upperarm.L":[[0.5,[-0.85,0,-0.3],inOutCubic],[0.65,[-0.85,0,-0.3]],[0.9,[-1.45,0,-0.1],inCubic]],
  "upperarm.R":[[0.5,[-0.85,0,0.3],inOutCubic],[0.65,[-0.85,0,0.3]],[0.9,[-1.45,0,0.1],inCubic]],
  "forearm.L":[[0.5,[-1.5,0,0],inOutCubic],[0.65,[-1.5,0,0]],[0.9,[-0.15,0,0],inCubic]],
  "forearm.R":[[0.5,[-1.5,0,0],inOutCubic],[0.65,[-1.5,0,0]],[0.9,[-0.15,0,0],inCubic]],
  "fingers.L":[[0.5,[0,0,-0.35],inOutCubic],[0.9,[0,0,0],inCubic]],
  "fingers.R":[[0.5,[0,0,0.35],inOutCubic],[0.9,[0,0,0],inCubic]],
  chest:[[0.5,[0.08,0,0],inOutCubic],[0.65,[0.08,0,0]],[0.9,[0.15,0,0],inCubic]],
  head:[[0.65,[0,0,0]],[0.9,[-0.12,0,0],inCubic]]});

// attack: wind-up 0-0.3, strike 0.3-0.45 (fast), follow-through and recovery 0.45-0.9.
// Variants: "swing" (sword, cocked over the right shoulder, slashed across to the left hip) and
// "punch" (no weapon). Add a variant by adding a key here and a branch in variantOf.
const ATK={
  // the blade is raised beside the right shoulder, cut down through the centre and swept out low to the left
  swing:{
    chest:[[0.3,[0,-0.5,0.06],inOutCubic],[0.4,[0.1,0.25,0],inCubic],[0.5,[0.14,0.55,0],outCubic],[0.65,[0.12,0.5,0]]],
    head:[[0.3,[0,-0.2,0],inOutCubic],[0.4,[0,0.1,0],inCubic],[0.5,[0,0.25,0],outCubic],[0.65,[0,0.2,0]]],
    "upperarm.R":[[0.3,[-1.7,0,-1.1],inOutCubic],[0.4,[-1.35,0,0.15],inCubic],[0.5,[-0.75,0,0.6],outCubic],[0.65,[-0.7,0,0.55]]],
    "forearm.R":[[0.3,[-0.7,0,0],inOutCubic],[0.4,[-0.25,0,0],inCubic],[0.5,[-0.2,0,0],outCubic],[0.65,[-0.25,0,0]]],
    "hand.R":[[0.3,[-0.8,0,0],inOutCubic],[0.4,[-0.2,0,0.5],inCubic],[0.5,[0.2,0,0.9],outCubic],[0.65,[0.15,0,0.8]]]},
  punch:{
    chest:[[0.3,[0.02,-0.35,0],inOutCubic],[0.45,[0.08,0.35,0],inCubic],[0.7,[0.04,0.15,0],outCubic]],
    "upperarm.R":[[0.3,[0.4,0,-0.1],inOutCubic],[0.45,[-1.3,0,0.05],inCubic],[0.7,[-1.25,0,0.05],outCubic]],
    "forearm.R":[[0.3,[-1.9,0,0],inOutCubic],[0.45,[-0.05,0,0],inCubic]]}
};
// shield (ctx.kind.off === "shield"): the left forearm held up in front of the body through the attack
// The upper arm rolls inward (ry<0) so the shield on the outside of the forearm turns to face forward.
const GUARD={
  "upperarm.L":[[0.2,[-0.6,-1.2,0.25],outCubic],[0.75,[-0.6,-1.2,0.25]]],
  "forearm.L":[[0.2,[-1.45,0,0],outCubic],[0.75,[-1.45,0,0]]],
  "fingers.L":[[0.2,[0,0,-1.1],outCubic],[0.75,[0,0,-1.1]]]};
const variantOf=k=>/sword/.test(k||"")?"swing":"punch";
const atkCache={};
function atkShot(v,shield){
  const key=v+(shield?"+guard":"");
  return atkCache[key]||(atkCache[key]=shot(0.9,Object.assign({},ATK[v],shield?GUARD:{})));
}

// victory: right arm up in a cheer, crouch, a small hop, land, settle
const VIC_LEGS=[[0,[0,0,0]],[0.22,[-0.35,0.7,0],sine],[0.4,[-0.35,0.7,0],linear],[0.47,[0,0,0],inOutCubic],
  [0.75,[0,0,0],linear],[0.85,[-0.25,0.5,0],sine],[1.0,[0,0,0],sine],[1.6,[0,0,0],sine]];
const VIC=shot(1.6,{
  "upperarm.R":[[0.35,[2.9,0,-0.25],outBack],[1.0,[2.9,0,-0.25]]],
  "forearm.R":[[0.35,[-0.15,0,0],sine],[1.0,[-0.15,0,0]]],
  "fingers.R":[[0.35,[0,0,0],sine],[1.0,[0,0,0]]],
  chest:[[0.35,[-0.06,0,0],sine],[1.0,[-0.06,0,0]]],
  head:[[0.35,[-0.2,0,0],sine],[1.0,[-0.2,0,0]]]});

// defeat: stagger, then drop onto the right knee; the left foot stays planted. Holds the kneel.
const DEF_LEGS_L=[[0,[0,0,0]],[0.3,[-0.2,0.2,0],sine],[0.8,[-0.95,1.932,0],sine]];
const DEF_LEGS_R=[[0,[0,0,0]],[0.3,[0.25,0.1,0],sine],[0.8,[0.25,1.3,2.35],sine]];
const DEF=shot(1.4,{
  chest:[[0.3,[-0.35,0.1,0],outCubic],[0.8,[0.35,-0.1,0],inOutCubic]],
  head:[[0.3,[-0.35,0.2,0],outCubic],[0.8,[0.4,-0.1,0],inOutCubic]],
  "upperarm.L":[[0.3,[-0.6,0,0.45],outCubic],[0.8,[-0.2,0,0.2],inOutCubic]],
  "upperarm.R":[[0.3,[0.5,0,-0.5],outCubic],[0.8,[-0.1,0,-0.2],inOutCubic]],
  "forearm.L":[[0.3,[-0.8,0,0],outCubic],[0.8,[-1.0,0,0],inOutCubic]],
  "forearm.R":[[0.3,[-0.8,0,0],outCubic],[0.8,[-1.0,0,0],inOutCubic]]}, true);

// ---------- walk (loop) ----------
// one leg over phase q in [0,1): heel strike at 0, toe-off at 0.6, mid-swing at 0.8
const gaitLeg=q=>[
  track([[0,-0.42],[0.6,0.32,linear],[1,-0.42,sine]],q),                                         // thigh
  track([[0,0.1],[0.2,0.06,sine],[0.45,0.25,sine],[0.6,0.5,sine],[0.8,0.95,sine],[1,0.1,sine]],q), // shin
  track([[0,-0.05],[0.15,0,sine],[0.45,0.05,sine],[0.6,0.35,sine],[0.75,-0.35,sine],[0.9,-0.2,sine],[1,-0.05,sine]],q)]; // foot pitch
H3.anim.register({id:"walk",name:"Walk",loop:true,duration:1,speed:1.3,view:1.57,sample(t,ctx){
  const c=Math.cos(TAU*t),L=gaitLeg(t),R=gaitLeg((t+0.5)%1),armed=!!(ctx&&ctx.kind&&ctx.kind.main);
  return{t:[0,floorY([L,R],-1),0],r:Object.assign({
    "hand.R":[armed?-0.6:0,0,0],                       // armed: the wrist carries the blade forward, clear of the legs
    "upperarm.L":[0.33*c,0,0.08],"upperarm.R":[-0.33*c,0,-0.08],
    "forearm.L":X(-0.25),"forearm.R":X(-0.25),
    "fingers.L":[0,0,-0.15],"fingers.R":[0,0,0.15],
    spine:X(0.02),chest:[0.04,0.08*c,0],head:[-0.03,-0.05*c,0]},legPose("L",L),legPose("R",R))};
}});

// ---------- run (loop) ----------
const RUN_D=0.66;
// one leg over phase q: stance around 0 (0.9 to 0.1), toe-off at 0.1, knee drive at 0.42
const runLeg=q=>[
  track([[0,0],[0.1,0.5,linear],[0.25,-0.2,sine],[0.42,-0.85,sine],[0.6,-0.5,sine],[0.9,-0.35,sine],[1,0,sine]],q),
  track([[0,0.25],[0.1,0.6,sine],[0.25,1.7,sine],[0.42,1.3,sine],[0.6,0.5,sine],[0.8,0.3,sine],[0.9,0.25,sine],[1,0.25,sine]],q),
  track([[0,0],[0.1,0.35,sine],[0.25,-0.5,sine],[0.42,-0.3,sine],[0.6,-0.2,sine],[0.9,0,sine],[1,0,sine]],q)];
H3.anim.register({id:"run",name:"Run",loop:true,duration:RUN_D,speed:3.2,view:1.57,sample(t){
  const q=t/RUN_D,c=Math.cos(TAU*(q-0.42)),L=runLeg(q),R=runLeg((q+0.5)%1);
  const[w,hop]=airborne(q,[[0.1,0.4],[0.6,0.9]],0.04,0.04);
  return{t:[0,(1-w)*floorY([L,R],-1)+w*hop,0],r:Object.assign({
    "upperarm.L":[0.75*c,0,0.1],"upperarm.R":[0.75*Math.cos(TAU*(q-0.92)),0,-0.1],
    "forearm.L":X(-1.4),"forearm.R":X(-1.4),
    "fingers.L":[0,0,-0.2],"fingers.R":[0,0,0.2],
    spine:X(0.08),chest:[0.2,0.1*c,0],head:[-0.12,-0.06*c,0]},legPose("L",L),legPose("R",R))};
}});

// ---------- one-shot registrations ----------
H3.anim.register({id:"attack",name:"Attack",loop:false,duration:0.9,view:0.9,sample(t,ctx){
  const k=ctx.kind||{};return atkShot(variantOf(k.main),k.off==="shield")(t)}});
H3.anim.register({id:"cast",name:"Cast",loop:false,duration:1.2,view:0.62,sample:t=>CAST(t)});
H3.anim.register({id:"hit",name:"Hit",loop:false,duration:0.5,view:0.62,sample:t=>HIT(t)});
H3.anim.register({id:"block",name:"Block",loop:false,duration:0.8,view:0.62,sample:t=>BLOCK(t)});
// armed: the wrist turns the blade skyward while the arm is up
const VIC_WRIST=[[0,0],[0.35,1.2,outBack],[1.0,1.2,linear],[1.6,0,inOutCubic]];
H3.anim.register({id:"victory",name:"Victory",loop:false,duration:1.6,view:0.62,sample(t,ctx){
  const p=VIC(t),L=track(VIC_LEGS,t),[w,hop]=airborne(t,[[0.47,0.75]],0.05,0.03);
  if(ctx&&ctx.kind&&ctx.kind.main)p.r["hand.R"]=[track(VIC_WRIST,t),0,0];
  p.t=[0,(1-w)*floorY([L,L],-1)+w*hop,0];Object.assign(p.r,legPose("L",L),legPose("R",L));return p}});
H3.anim.register({id:"defeat",name:"Defeat",loop:false,duration:1.4,view:0.9,sample(t){
  const p=DEF(t),L=track(DEF_LEGS_L,t),R=track(DEF_LEGS_R,t);
  p.t=[0,floorY([L,R],1),0];Object.assign(p.r,legPose("L",L),legPose("R",R));return p}});
})();
