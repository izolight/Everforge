// ================= ART 3D GEAR: held =================
// Scaffold for held items, one per hand slot:
//   iron_sword  (main) - a weapon authored in GRIP SPACE: the handle runs along +Y, the origin is the
//               centre of the fist, the blade points toward +Y. held() tilts it about the fist, flags
//               the meshes `held` (assembly moves them into ctx.grip and binds them to the hand) and
//               returns a pose hint that closes the fist. Blades lie in the YZ plane.
//   wood_shield (off)  - an item built in REST SPACE on the outside of the left forearm and bound
//               rigidly to forearm.L, so it follows the forearm.
// New weapons: copy iron_sword, change the shapes, set `kind` (animations switch on it).
(function(){
"use strict";
const {G}=H3,TAU=Math.PI*2;
const fr=x=>x-Math.floor(x);
// piecewise-linear profile over y; keys [[y,value],...] ascending in y
const prof=keys=>y=>{
  if(y<=keys[0][0])return keys[0][1];
  for(let i=0;i<keys.length-1;i++){const a=keys[i],b=keys[i+1];if(y<=b[0])return a[1]+(b[1]-a[1])*(y-a[0])/((b[0]-a[0])||1)}
  return keys[keys.length-1][1];
};
// Finish a held weapon: tilt it about the fist, flag every mesh as held, close the fist on the grip.
function held(ctx,meshes,tilt){
  for(const m of meshes){G.xform(m,{rx:tilt});m.held=true}
  const left=ctx.side==="L";
  return{meshes,pose:{r:{[left?"fingers.L":"fingers.R"]:[0,0,left?-1.3:1.3]}}};
}
// leather-bound grip along the handle (y0..y1) with diagonal wrap stripes
function wrap(ctx,y0,y1,r){
  return G.loft([{y:y0,rx:r*0.84,rz:r*0.84,e:2.2},{y:y0+0.012,rx:r,rz:r},{y:y1-0.012,rx:r,rz:r},{y:y1,rx:r*0.84,rz:r*0.84,e:2.2}],
    {seg:16,steps:2,pal:[{c:ctx.col("wrap"),mat:"leather"},{c:ctx.col("wrapDark"),mat:"leather",line:false}],
     paint:p=>fr(Math.atan2(p[2],p[0])/TAU*2+p[1]*20)<0.45?0:1});
}

// ---------- weapons ----------
H3.gear.register({id:"iron_sword",slot:"main",name:"Iron sword",kind:"sword",
  colors:{blade:"#cdd6db",fuller:"#6f7b81",edge:"#f2f6f8",guard:"#8b969c",pommel:"#a88d5a",wrap:"#5e3f27",wrapDark:"#3a2617"},
  build(ctx){
    const C=n=>ctx.col(n),hw=prof([[0.085,0.0235],[0.25,0.0265],[0.5,0.0235],[0.64,0.0185],[0.72,0.0095],[0.748,0.001]]);
    const bl=G.loft([{y:0.085,rx:0.0085,rz:0.0235,e:2.2},{y:0.25,rx:0.0088,rz:0.0265,e:2.2},{y:0.5,rx:0.0078,rz:0.0235,e:2.2},
      {y:0.64,rx:0.0062,rz:0.0185,e:2.2},{y:0.72,rx:0.0042,rz:0.0095,e:2},{y:0.748,rx:0.001,rz:0.001,e:2}],
      {seg:12,steps:2,pal:[{c:C("blade"),mat:"metal"},{c:C("fuller"),mat:"metal",line:false},{c:C("edge"),mat:"metal"}],
       paint:p=>Math.abs(p[2])>0.8*hw(p[1])?2:(Math.abs(p[0])>0.002&&Math.abs(p[2])<0.0034&&p[1]>0.15&&p[1]<0.6?1:0)});
    const guard=G.tube([{p:[-0.108,0.088,0],r:0.0102},{p:[-0.055,0.082,0],r:0.0132},{p:[0,0.08,0],r:0.0155},{p:[0.055,0.082,0],r:0.0132},{p:[0.108,0.088,0],r:0.0102}],
      {seg:10,steps:3,color:C("guard"),mat:"metal"});
    const grip=wrap(ctx,-0.075,0.078,0.0185);
    const pom=G.ball(0.021,0.021,0.021,{seg:14,rings:6,color:C("pommel"),mat:"gold"});G.xform(pom,{t:[0,-0.1,0]});
    return held(ctx,[bl,guard,grip,pom],0.45);   // relaxed: the point dips forward and down from the hanging fist
  }});

// ---------- shields (off hand) ----------
// Built in rest space, facing outward (+x) and turned 14 degrees forward, then bound rigidly
// to forearm.L (so they swing with the forearm).
const SHIELD_YAW=Math.PI/2-0.25;
function onForearm(meshes,centre,axisY){
  for(const m of meshes){if(axisY)G.xform(m,{rx:Math.PI/2});G.xform(m,{ry:SHIELD_YAW,t:centre});m.bind="forearm.L"}
  return{meshes};
}

H3.gear.register({id:"wood_shield",slot:"off",name:"Plank shield",kind:"shield",
  colors:{plank:"#b98152",plankAlt:"#a46f44",seam:"#4a2f18",iron:"#7d888e",boss:"#a9b4b9"},
  build(ctx){
    const C=n=>ctx.col(n),J=ctx.dims.joints,R=0.176;
    // a round disc of vertical planks (built with its axis along +Y, turned to face outward later)
    const body=G.loft([{y:-0.022,rx:0.16,rz:0.16},{y:0,rx:R,rz:R},{y:0.022,rx:0.16,rz:0.16}],
      {seg:40,steps:3,pal:[{c:C("plank"),mat:"wood"},{c:C("plankAlt"),mat:"wood",line:false},{c:C("seam"),mat:"wood"},{c:C("iron"),mat:"metal"}],
       paint:p=>{if(Math.abs(p[2])<0.011&&Math.abs(p[0])<0.158)return 3;
         const u=p[0]/0.062+0.5,k=Math.floor(u);if(u-k<0.06)return 2;return ((k%2)+2)%2?1:0}});
    const rim=G.sheet((u,v)=>{const a=u*TAU,b=v*TAU,rr=R+0.0085*Math.cos(b);return[rr*Math.cos(a),0.0085*Math.sin(b),rr*Math.sin(a)]},
      40,8,{color:C("iron"),mat:"metal"});
    const boss=G.ball(0.05,0.038,0.05,{seg:16,rings:6,color:C("boss"),mat:"metal"});G.xform(boss,{t:[0,0.022,0]});
    const rivets=[...Array(10)].map((_,i)=>{const a=i*TAU/10+0.2,rv=G.ball(0.0065,0.0065,0.0065,{seg:8,rings:4,color:C("boss"),mat:"metal"});
      return G.xform(rv,{t:[0.14*Math.cos(a),0.022,0.14*Math.sin(a)]})});
    return onForearm([body,rim,boss,...rivets],[J.elbow.L[0]+0.078,0.92,0.024],true);
  }});

})();
