// ================= ART 3D GEAR: head =================
// Head slot. One example item, kept as a template for other head pieces:
//   hood: built from the body's inflated head rings, bound by weight transfer from the head, neck and
//         torso (so it follows head turns), and it hides the hair it covers (`hides`).
(function(){
"use strict";
const{G,U}=H3,{sstep}=U;

// Ring point on a loft at angle phi (the same formula as G.loft, so rims sit on the surface).
function ringPoint(r,phi){const s=Math.sin(phi),c=Math.cos(phi),ex=2/r.e;
  return[r.cx+r.rx*Math.sign(s)*Math.abs(s)**ex,r.y+r.ty*c,r.cz+r.rz*Math.sign(c)*Math.abs(c)**ex]}
// Lower the final ring of a loft (N = seg+1 vertices, rings are stored as j*N+i) into scallops:
// arches bulge down, the cusps between them stay high.
function scallopLastRing(m,N,amp,count){
  const s=m.v.length-N;
  for(let i=0;i<N;i++){const t=i/(N-1),d=-amp*Math.abs(Math.sin(Math.PI*count*t))**0.7;
    m.v[s+i][1]+=d;m.pc[s+i][1]+=d}
  return m;
}

// ---------- hood: a leather shell framing the face, a rolled rim, a scalloped shoulder mantle ----------
const HOOD_STEPS=4,HOOD_SEG=48;
// how far the shell is open at the front (half-angle, radians) at height y: the face opening
// narrows to the forehead and the chin, and a V opens the front of the mantle for the tunic's neck
const hoodOpen=y=>{const t=(y-1.5)/0.2,face=Math.abs(t)<1?0.8*(1-t**4)**0.42:0;return Math.max(face,0.6*sstep(1.34,1.24,y))};
function hoodKeys(ctx){
  // the crown, brow and face come from the inflated head rings; the mantle is set by hand
  const crown=ctx.body.inflate(ctx.dims.rings.head,0.065).filter(r=>r.y>=1.4&&r.y<1.74).reverse();
  return[{y:1.795,rx:0.035,rz:0.035,cz:-0.01},{y:1.77,rx:0.092,rz:0.096,cz:-0.012},{y:1.745,rx:0.125,rz:0.13,cz:-0.01},...crown,
    {y:1.3,rx:0.14,rz:0.14,cz:0.0,ty:0.01},
    {y:1.22,rx:0.225,rz:0.2,cz:-0.03,ty:0.02},
    {y:1.16,rx:0.24,rz:0.21,cz:-0.045,ty:0.045}];
}
H3.gear.register({id:"hood",slot:"head",name:"Leather hood",colors:{main:"#4b4236",trim:"#7d6b50",inner:"#2a221b"},
  hides:["hair.back"],kind:"hood",
  build(ctx){
    const keys=hoodKeys(ctx),N=HOOD_SEG+1;
    const shell=G.loft(keys,{seg:HOOD_SEG,steps:HOOD_STEPS,open:hoodOpen,cap:false,twoSided:true,mat:"leather",
      back:ctx.col("inner"),pal:[{c:ctx.col("main")},{c:ctx.col("trim"),line:false}],
      // stitched seam down the back: dashes in the trim colour
      paint:p=>p[2]<-0.03&&Math.abs(p[0])<0.0045&&p[1]>1.2&&p[1]<1.72&&(p[1]*90)%1<0.5?1:0,
      // weight transfer: copy the skin weights of the head, neck and torso, so the hood follows head turns
      bind:{from:["head","neck","torso"]}});
    scallopLastRing(shell,N,0.03,11);
    // the rolled rim: a tube along both edges of the face opening, meeting at the crown
    // rings run top to bottom; the open ones start at `a`, the closed crown just above them is the arch top
    const rings=G.spline(keys,HOOD_STEPS),open=rings.map(r=>hoodOpen(r.y)),a=open.findIndex(o=>o>0.001);
    const path=[];
    for(let j=rings.length-1;j>=a;j--)path.push({p:ringPoint(rings[j],open[j]),r:0.011});      // left edge, up
    path.push({p:ringPoint(rings[a-1],0),r:0.011});                                             // arch top
    for(let j=a;j<rings.length;j++)path.push({p:ringPoint(rings[j],2*Math.PI-open[j]),r:0.011}); // right edge, down
    const rim=G.tube(path,{seg:10,steps:1,mat:"leather",color:ctx.col("trim"),bind:{from:["head","neck","torso"]}});
    return{meshes:[shell,rim]};
  }});
})();
