// ================= ART 3D GEAR: limbs (example items: boots, gloves) =================
// Two templates for fitting gear to the limbs. Both are shrink-wrapped onto the base body, not
// built from measurements: the body's own foot, leg, hand and arm meshes are read at build time
// (ctx.body.build), each kept face is pushed out along its smooth rest normal by the item's
// thickness, and the copy is cut to the part of the limb the item covers. So the gear follows any
// change to the base hands and feet and stays tight on them.
//
// Mechanisms shown here (reuse them in other limb items):
//   shell(src,{d,keep,floor,mesh})  offset copy of a body mesh; d may be a function of the rest
//                                   position (flares, toe boxes); keep(faceVerts) picks the faces;
//                                   floor clamps y (flat soles)
//   inY(lo,hi)                      keeps faces inside a height band, which drops the end caps
//   bilateral(ctx,make)             the .L (x>0) half is built, then a second build is mirrored for .R
//   mesh.paint                      per-pixel palette regions (sole welt, cuff, stitching), so edges
//                                   are smooth; the palette can carry its own mat per entry
//   bind:{from:[tags]}              weights copied from the body parts the item sits on
//   hides                           body tags the item covers (boots hide the foot, gloves the hand)
(function(){
"use strict";
const G=H3.G,U=H3.U;

// copy of body mesh `src`: the faces passing keep(faceVerts) (rest positions), pushed out along the
// smooth rest normals by d (a number, or fn(restPos)); y is clamped at `floor` (flat soles).
// o.mesh: options for G.mesh (pal, paint, mat, name, color, ...).
function shell(src,o){
  const N=G.normals(src),map=new Map(),v=[],f=[],floor=o.floor==null?-Infinity:o.floor;
  const at=i=>{let k=map.get(i);
    if(k===undefined){const p=src.v[i],n=N[i],d=typeof o.d==="function"?o.d(p):o.d;
      k=v.length;map.set(i,k);v.push([p[0]+n[0]*d,Math.max(floor,p[1]+n[1]*d),p[2]+n[2]*d])}
    return k};
  for(const fc of src.f){const P=fc.map(i=>src.v[i]);if(o.keep&&!o.keep(P))continue;f.push(fc.map(at))}
  return G.mesh(v,f,o.mesh);
}
// faces whose three corners all sit inside a height band (drops the caps, which span one ring)
const inY=(lo,hi)=>P=>P.every(p=>p[1]>=lo&&p[1]<=hi);
const avg=(P,k)=>P.reduce((s,p)=>s+p[k],0)/P.length;
// the .L half of a left/right item, read from the body at build time
function limbsL(ctx){
  const B=ctx.body.build({}).meshes;return t=>B.find(m=>m.tag===t+".L");
}
// a left/right item: make() builds the .L version, a second build is mirrored for .R
function bilateral(ctx,make){return[...make(ctx),...make(ctx).map(m=>G.mirrorX(m))]}

// ---------- boots ----------
// Mechanism: the foot is shrink-wrapped (footShell, offset 2 cm, cut below the ankle); the shaft is
// the shin's rings in a height band with a function-valued offset that flares into the cuff; the
// strap is a second band, and the buckle is a small box placed on the strap's front-most point.
// Paint gives the lighter sole welt and the cuff tone. Both sides come from bilateral().
const footShell=(foot,d,mesh)=>shell(foot,{d,floor:0,keep:P=>!P.every(p=>p[1]>0.12),mesh});
const shinShell=(leg,y0,y1,d,mesh)=>shell(leg,{d,keep:inY(y0,y1),mesh});
H3.gear.register({id:"boots",slot:"feet",name:"Short leather boots",
  colors:{main:"#30271f",cuff:"#43372b",sole:"#6b5540",stitch:"#8c7454",strap:"#3c2a1d",buckle:"#d5ad68"},
  hides:["foot"],kind:"boots",
  build(ctx){return{meshes:bilateral(ctx,c=>{
    const get=limbsL(c),foot=get("foot"),leg=get("leg"),out=[];
    const main=c.col("main");
    out.push(footShell(foot,0.02,{mat:"leather",name:"boot.foot",pal:[{c:main},{c:c.col("sole")},{c:c.col("stitch"),line:false}],
      paint:p=>p[1]<0.03?1:p[1]<0.036?2:0}));
    const flare=p=>0.02+0.01*U.sstep(0.2,0.235,p[1]);
    out.push(shinShell(leg,0.1225,0.245,flare,{mat:"leather",name:"boot.shaft",pal:[{c:main},{c:c.col("cuff")},{c:c.col("stitch"),line:false}],
      paint:p=>p[1]>0.226?1:p[1]>0.218&&p[1]<0.222?2:0}));
    const strap=shinShell(leg,0.1475,0.185,0.026,{mat:"leather",name:"boot.strap",color:c.col("strap")});
    out.push(strap);
    const sx=avg(strap.v,0),sy=avg(strap.v,1),sz=Math.max(...strap.v.map(p=>p[2]));
    const buckle=G.xform(G.box(0.036,0.03,0.008,{mat:"gold",color:c.col("buckle"),name:"boot.buckle"}),{t:[sx,sy,sz+0.004]});
    buckle.bind={from:["foot","leg"]};buckle.bias=0.004;out.push(buckle);
    for(const m of out)if(!m.bind)m.bind={from:["foot","leg"]};
    return out;
  })}}});

// ---------- gloves ----------
// Mechanism: the three base hand meshes (palm block, finger mitten, thumb) are each shrink-wrapped
// with the hand hidden under them (hides:["hand"]); the mitten's paint adds a knuckle stitch. The
// cuff is a band of the forearm mesh, flaring toward its top, so it meets the wrist with no gap.
const handParts=ctx=>{const B=ctx.body.build({}).meshes;return{hand:B.filter(m=>m.tag==="hand.L"),arm:B.find(m=>m.tag==="arm.L")}};
H3.gear.register({id:"hide_gloves",slot:"hands",name:"Brown leather gloves",
  colors:{main:"#7b5536",cuff:"#5c3d26",stitch:"#d2b48c"},
  hides:["hand"],kind:"gloves",
  build(ctx){return{meshes:bilateral(ctx,c=>{
    const{hand,arm}=handParts(c),out=[],main=c.col("main"),stitch=c.col("stitch");
    const knuckles=p=>Math.abs(p[1]-0.6)<0.003||Math.abs(p[1]-0.635)<0.003?1:0;
    hand.forEach((h,k)=>out.push(shell(h,{d:0.013,mesh:{mat:"leather",name:"glove.hand",pal:[{c:main},{c:stitch,line:false}],
      paint:k===1?knuckles:null}})));
    const flare=p=>0.012+0.014*U.sstep(0.755,0.785,p[1]);
    out.push(shell(arm,{d:flare,keep:P=>P.every(p=>p[1]>=0.7215&&p[1]<=0.8),
      mesh:{mat:"leather",name:"glove.cuff",pal:[{c:main},{c:c.col("cuff")},{c:stitch,line:false}],
        paint:p=>p[1]>0.772?1:Math.abs(p[1]-0.762)<0.0025?2:0}}));
    for(const m of out)m.bind={from:["hand","arm"]};
    return out;
  })}}});
})();
