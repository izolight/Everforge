// ================= ART 3D: CORE (dependency-free software renderer) =================
// Shared by every art3d module. Plain script (no ES modules, so file:// works); everything
// hangs off the global H3 namespace. Runs unchanged in the browser and in Node (tools/hero3d-lib.js).
//
// Style, from the 2D hero (js/hero.js): solid shapes, one dark ink outline, a warm top light,
// an earthy palette. Here that becomes:
//   - two-tone cel shading with cool, hue-shifted shadows and a warm key light
//   - per-material response (cloth, leather, skin, hair, metal, gem, glow)
//   - painted regions evaluated per pixel in the part's own model space (clean edges)
//   - soft contact shading from the depth buffer where parts tuck under each other
//   - an ink pass: thick on the silhouette and depth jumps, thinner (tinted) where parts
//     touch or painted regions meet
//
// Coordinates: metres, y up, feet at y=0, the figure faces +z. +x is the figure's LEFT side.
// A mesh stores rest-pose vertices; the rig (rig.js) supplies skin weights and a pose.
var H3=globalThis.H3||(globalThis.H3={});
(function(){
"use strict";
// ---------- math ----------
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(a[0],a[1],a[2]),norm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l]};
const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hex=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
const toHex=c=>"#"+c.map(x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,"0")).join("");
// shade("#rrggbb", amt): amt>0 lightens toward white, amt<0 darkens toward black (like the 2D shade()).
const shade=(h,a)=>toHex(hex(h).map(x=>a>=0?x+(255-x)*a:x*(1+a)));
const mixHex=(a,b,t)=>toHex(hex(a).map((x,i)=>x+(hex(b)[i]-x)*t));
const clamp=(x,a,b)=>x<a?a:x>b?b:x,mix=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
// distance from (px,py) to the segment a-b, for painted strokes
const seg2=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=clamp(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy||1),0,1);const dx=px-ax-vx*t,dy=py-ay-vy*t;return Math.sqrt(dx*dx+dy*dy)};
// distance from point p to the 3D segment a-b
const seg3=(p,a,b)=>{const v=sub(b,a),w=sub(p,a),t=clamp(dot(w,v)/(dot(v,v)||1),0,1);return len(sub(w,mul(v,t)))};
// small deterministic hash noise in [0,1) (no Math.random: renders must be reproducible)
const hash=(x,y,z)=>{let h=Math.sin(x*127.1+y*311.7+(z||0)*74.7)*43758.5453;return h-Math.floor(h)};
H3.U={sub,add,mul,dot,cross,len,norm,lerp3,hex,toHex,shade,mixHex,clamp,mix,sstep,seg2,seg3,hash};

// ---------- geometry ----------
// A ring is a horizontal cross-section: {y, rx, rz, cx, cz, e, ty}. e is the superellipse
// exponent (2 = ellipse, 3+ = rounded rectangle), ty tilts the ring (front up, back down).
// Key rings are smoothed with a Catmull-Rom spline, so a few numbers give a soft shape.
const DEF={cx:0,cz:0,ty:0,e:2};
const cr=(a,b,c,d,t)=>0.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function spline(keys,steps){
  keys=keys.map(r=>Object.assign({},DEF,r));if(!steps||steps<2)return keys;
  const out=[],n=keys.length,K=["y","rx","rz","cx","cz","ty","e"];
  for(let j=0;j<n-1;j++)for(let s=0;s<steps;s++){
    const t=s/steps,r={},p0=keys[Math.max(0,j-1)],p1=keys[j],p2=keys[j+1],p3=keys[Math.min(n-1,j+2)];
    for(const k of K)r[k]=cr(p0[k],p1[k],p2[k],p3[k],t);
    r.rx=Math.max(1e-3,r.rx);r.rz=Math.max(1e-3,r.rz);out.push(r)}
  out.push(keys[n-1]);return out;
}
// Stack rings into a surface. o.open(y) leaves a gap of that half-angle at the front
// (a hood's face opening); o.warp(phi,ring) scales the radius (folds). phi=0 faces +z.
function loft(keys,o){
  o=o||{};const seg=o.seg||32,rings=spline(keys,o.steps==null?4:o.steps),N=seg+1,v=[],f=[];
  const opens=rings.map(r=>o.open?o.open(r.y):0);
  rings.forEach((r,j)=>{const op=opens[j],ex=2/r.e;
    for(let i=0;i<=seg;i++){const ph=op+(2*Math.PI-2*op)*i/seg,s=Math.sin(ph),c=Math.cos(ph),w=o.warp?o.warp(ph,r):1;
      v.push([r.cx+r.rx*w*Math.sign(s)*Math.abs(s)**ex,r.y+r.ty*c,r.cz+r.rz*w*Math.sign(c)*Math.abs(c)**ex])}});
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<seg;i++){const a=j*N+i;f.push([a,a+1,a+N+1],[a,a+N+1,a+N])}
  // wind every side face outward (the sum over all faces decides, so folds don't confuse it)
  let s=0;f.forEach((fc,k)=>{const j=Math.floor(k/2/seg),r=rings[j];
    s+=dot(cross(sub(v[fc[1]],v[fc[0]]),sub(v[fc[2]],v[fc[0]])),sub(v[fc[0]],[r.cx,v[fc[0]][1],r.cz]))});
  if(s<0)f.forEach(fc=>fc.reverse());
  if(o.cap!==false)for(const[j,k]of[[0,1],[rings.length-1,rings.length-2]]){
    if(opens[j]>0)continue;const r=rings[j],ci=v.length,ctr=[r.cx,r.y,r.cz],away=sub(ctr,[rings[k].cx,rings[k].y,rings[k].cz]);v.push(ctr);
    for(let i=0;i<seg;i++){const fc=[ci,j*N+i,j*N+i+1];
      if(dot(cross(sub(v[fc[1]],v[fc[0]]),sub(v[fc[2]],v[fc[0]])),away)<0)fc.reverse();f.push(fc)}}
  return mesh(v,f,o);
}
// An ellipsoid as a loft of circles.
function ball(rx,ry,rz,o){
  const keys=[],n=(o&&o.rings)||10;for(let i=0;i<=n;i++){const t=-Math.PI/2+i/n*Math.PI;keys.push({y:ry*Math.sin(t),rx:Math.max(1e-3,rx*Math.cos(t)),rz:Math.max(1e-3,rz*Math.cos(t))})}
  return loft(keys,Object.assign({seg:20,steps:1},o));
}
// A flat-shaded slab, centred on the origin.
function box(w,h,d,o){
  const x=w/2,y=h/2,z=d/2,v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],f=[];
  for(const[a,b,c,e]of[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]])f.push([a,b,c],[a,c,e]);
  return mesh(v,f,Object.assign({flat:true},o));
}
// A tube swept along a smoothed path: pts=[{p:[x,y,z], r} or {p, rx, ry}], frames by parallel
// transport. o.up hints the first frame's x axis direction (default: world +x or +z). o.e superellipse.
// Good for fingers, straps, cords, hair locks, grips and horns.
function tube(pts,o){
  o=o||{};const seg=o.seg||12,steps=o.steps==null?3:o.steps,n=pts.length;
  const P=[],RX=[],RY=[];
  const gx=i=>pts[clamp(i,0,n-1)];
  const rxOf=q=>q.rx!=null?q.rx:q.r,ryOf=q=>q.ry!=null?q.ry:q.r;
  for(let j=0;j<n-1;j++)for(let s=0;s<(steps<2?1:steps);s++){const t=steps<2?0:s/steps,a=gx(j-1),b=gx(j),c=gx(j+1),d=gx(j+2);
    P.push([0,1,2].map(k=>cr(a.p[k],b.p[k],c.p[k],d.p[k],t)));RX.push(Math.max(1e-4,cr(rxOf(a),rxOf(b),rxOf(c),rxOf(d),t)));RY.push(Math.max(1e-4,cr(ryOf(a),ryOf(b),ryOf(c),ryOf(d),t)))}
  P.push(pts[n-1].p.slice());RX.push(Math.max(1e-4,rxOf(pts[n-1])));RY.push(Math.max(1e-4,ryOf(pts[n-1])));
  const m=P.length,T=P.map((p,i)=>norm(sub(P[Math.min(m-1,i+1)],P[Math.max(0,i-1)])));
  let up=o.up||(Math.abs(T[0][0])<0.9?[1,0,0]:[0,0,1]);
  let Nn=norm(sub(up,mul(T[0],dot(up,T[0]))));
  const v=[],f=[],N1=seg+1,ex=2/(o.e||2);
  for(let i=0;i<m;i++){
    if(i>0){Nn=sub(Nn,mul(T[i],dot(Nn,T[i])));Nn=norm(Nn)}
    const B=cross(T[i],Nn);
    for(let k=0;k<=seg;k++){const ph=2*Math.PI*k/seg,c=Math.cos(ph),s=Math.sin(ph),cc=Math.sign(c)*Math.abs(c)**ex,ss=Math.sign(s)*Math.abs(s)**ex;
      v.push(add(P[i],add(mul(Nn,RX[i]*cc),mul(B,RY[i]*ss))))}}
  for(let i=0;i<m-1;i++)for(let k=0;k<seg;k++){const a=i*N1+k;f.push([a,a+1,a+N1+1],[a,a+N1+1,a+N1])}
  let s=0;f.forEach((fc,q)=>{const i=Math.floor(q/2/seg);s+=dot(cross(sub(v[fc[1]],v[fc[0]]),sub(v[fc[2]],v[fc[0]])),sub(v[fc[0]],P[i]))});
  if(s<0)f.forEach(fc=>fc.reverse());
  if(o.cap!==false)for(const[i,dir]of[[0,-1],[m-1,1]]){const ci=v.length;v.push(P[i].slice());const away=mul(T[i],dir);
    for(let k=0;k<seg;k++){const fc=[ci,i*N1+k,i*N1+k+1];if(dot(cross(sub(v[fc[1]],v[fc[0]]),sub(v[fc[2]],v[fc[0]])),away)<0)fc.reverse();f.push(fc)}}
  return mesh(v,f,o);
}
// A parametric sheet: fn(u,v) -> [x,y,z] for u,v in [0,1]. Two-sided unless o.twoSided===false.
// Faces are wound so that (dP/du x dP/dv) is the front; o.flip reverses that.
function sheet(fn,U,V,o){
  o=Object.assign({twoSided:true},o);const v=[],f=[];
  for(let j=0;j<=V;j++)for(let i=0;i<=U;i++)v.push(fn(i/U,j/V));
  for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=j*(U+1)+i;f.push([a,a+1,a+U+2],[a,a+U+2,a+U+1])}
  if(o.flip)f.forEach(fc=>fc.reverse());
  return mesh(v,f,o);
}
// Mesh fields (all optional except v,f):
//   pal:[{c:"#hex", mat, line:false, glow}] painted palette; paint(p)->index evaluated per pixel
//   on p = the vertex position at creation time (model space of the part, see xform)
//   color (single colour if no pal), mat (default material), twoSided, back (inside colour),
//   flat (faceted normals), bias (metres pulled toward the camera for the depth test, for
//   decals/layers lying on another surface), tag (name used by gear `hides`), bind (rig binding).
function mesh(v,f,o){
  o=o||{};
  return{v,f,pc:v.map(p=>p.slice()),color:o.color||"#ffffff",pal:o.pal,paint:o.paint,twoSided:!!o.twoSided,back:o.back,flat:!!o.flat,
    mat:o.mat||"cloth",bias:o.bias||0,tag:o.tag||"",bind:o.bind,name:o.name||o.tag||"",ink:o.ink!==false};
}
// Move a mesh: scale, rotate (radians, applied z, then y, then x), translate. Painted regions
// keep their model-space coordinates (m.pc) unless t.paint is true.
function xform(m,t){
  const rx=t.rx||0,ry=t.ry||0,rz=t.rz||0,s=t.s||[1,1,1],T=t.t||[0,0,0];
  const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
  const f=p=>{
    let x=p[0]*s[0],y=p[1]*s[1],z=p[2]*s[2],q;
    q=x*cz-y*sz;y=x*sz+y*cz;x=q;
    q=x*cy+z*sy;z=-x*sy+z*cy;x=q;
    q=y*cx-z*sx;z=y*sx+z*cx;y=q;
    return[x+T[0],y+T[1],z+T[2]]};
  m.v=m.v.map(f);if(t.paint)m.pc=m.pc.map(f);
  if((s[0]*s[1]*s[2])<0)m.f.forEach(fc=>fc.reverse());
  m._vn=null;return m;
}
// Mirror a mesh across x=0 (for left/right pairs built once). Keeps winding outward.
function mirrorX(m){m.v=m.v.map(p=>[-p[0],p[1],p[2]]);m.pc=m.pc.map(p=>[-p[0],p[1],p[2]]);m.f.forEach(fc=>fc.reverse());m._vn=null;return m}
// Smooth rest normals: faces that share a position share a normal (closes loft seams).
function normals(m){
  if(m._vn)return m._vn;
  const key=p=>Math.round(p[0]*2e4)+","+Math.round(p[1]*2e4)+","+Math.round(p[2]*2e4),acc=new Map();
  const fn=m.f.map(([a,b,c])=>cross(sub(m.v[b],m.v[a]),sub(m.v[c],m.v[a])));
  m.f.forEach((fc,k)=>{for(const i of fc){const K=key(m.v[i]),s=acc.get(K);if(s){s[0]+=fn[k][0];s[1]+=fn[k][1];s[2]+=fn[k][2]}else acc.set(K,fn[k].slice())}});
  m._vn=m.v.map(p=>norm(acc.get(key(p))));
  return m._vn;
}
H3.G={spline,loft,ball,box,tube,sheet,mesh,xform,mirrorX,normals};

// ---------- camera ----------
function camera(yaw,pitch,dist,target,fov){return{yaw,pitch,dist,target:target||[0,0.92,0],fov:fov||0.62}}
function view(cam,W,H){
  const cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
  const eye=[cam.target[0]+cam.dist*cp*sy,cam.target[1]+cam.dist*sp,cam.target[2]+cam.dist*cp*cy];
  const f=norm(sub(cam.target,eye)),r=norm(cross(f,[0,1,0])),u=cross(r,f),foc=(H/2)/Math.tan(cam.fov/2);
  return{eye,f,r,u,foc,W,H,proj:p=>{const d=sub(p,eye),z=dot(d,f);return[W/2+dot(d,r)*foc/z,H/2-dot(d,u)*foc/z,z,1/z]}};
}

// ---------- lights & materials ----------
const LIGHT=norm([-0.45,0.78,0.55]);                    // warm key light, upper left, like the 2D art
const RIM=norm([0.35,0.55,-0.75]),FILL=norm([0.5,0.5,-0.7]);   // the orange backdrop glow, from behind and above
const HALF=(()=>{return v=>norm(add(LIGHT,v))})();
// sh: shadow multiplier (cool, hue-shifted), lt: lit multiplier (warm), spec: highlight band
// strength, gloss: band threshold on N.H, rim: rim strength, env: metal sky/ground reflection.
const MATS={
  cloth:  {sh:[0.56,0.53,0.67],lt:[1.04,1.0,0.94],spec:0,   gloss:0.95,rim:0.5},
  leather:{sh:[0.55,0.51,0.62],lt:[1.05,1.0,0.93],spec:0.16,gloss:0.93,rim:0.55},
  skin:   {sh:[0.76,0.57,0.56],lt:[1.04,1.0,0.95],spec:0.04,gloss:0.97,rim:0.45},
  hair:   {sh:[0.55,0.5,0.62], lt:[1.08,1.02,0.95],spec:0.09,gloss:0.955,rim:0.6},
  wood:   {sh:[0.56,0.52,0.6], lt:[1.05,1.0,0.92],spec:0.06,gloss:0.95,rim:0.5},
  metal:  {sh:[0.42,0.42,0.52],lt:[1.08,1.05,1.0],spec:0.55,gloss:0.86,rim:0.8,env:1},
  gold:   {sh:[0.5,0.42,0.38], lt:[1.08,1.02,0.9],spec:0.5, gloss:0.88,rim:0.8,env:0.7},
  gem:    {sh:[0.6,0.6,0.75],  lt:[1.15,1.15,1.15],spec:0.8,gloss:0.84,rim:0.9,emit:0.25},
  glow:   {unlit:true},
};
H3.MATS=MATS;H3.LIGHT=LIGHT;

// ---------- frame rendering ----------
// renderFigure(parts, cam, W, H, o) rasterises posed meshes and shades them.
//   parts: [{m: mesh, P: Float32Array posed positions (3/vertex), N: Float32Array posed normals}]
//   returns {W,H,col (RGBA), cov (coverage 0/1), dep, view}
function renderFigure(parts,cam,W,H,o){
  o=o||{};const V=view(cam,W,H),n=W*H;
  const B={W,H,V,dep:new Float32Array(n).fill(Infinity),nrm:new Float32Array(n*3),pc:new Float32Array(n*3),pos:new Float32Array(n*3),mid:new Int16Array(n).fill(-1),side:new Uint8Array(n)};
  parts.forEach((pt,mi)=>rasterMesh(pt,mi,V,B));
  const sh=shadePass(parts,B,o);
  const ao=o.ao===false?null:aoPass(B);
  if(ao)for(let i=0;i<n;i++){if(B.mid[i]<0)continue;const a=ao[i];sh.col[i*4]*=a;sh.col[i*4+1]*=a;sh.col[i*4+2]*=a*(0.96+0.04*a)}
  const sc=o.lineScale||H/1000;
  ink(sh.col,B,sh.id,sh.base,Math.max(1,2.4*sc),Math.max(0.6,1.15*sc),hex(o.inkColor||"#17110e"));
  return{W,H,col:sh.col,mid:B.mid,dep:B.dep,view:V,cam};
}
function rasterMesh(pt,mi,V,B){
  const m=pt.m,P=pt.P,N=pt.N,nv=m.v.length,R=m._PC&&m._PC.length===nv*3?m._PC:(m._PC=Float32Array.from(m.pc.flat())),S=new Float32Array(nv*4),eye=V.eye,bias=m.bias||0;
  for(let i=0;i<nv;i++){const x=P[i*3]-eye[0],y=P[i*3+1]-eye[1],z=P[i*3+2]-eye[2];
    const zz=x*V.f[0]+y*V.f[1]+z*V.f[2],iz=1/zz;
    S[i*4]=V.W/2+(x*V.r[0]+y*V.r[1]+z*V.r[2])*V.foc*iz;S[i*4+1]=V.H/2-(x*V.u[0]+y*V.u[1]+z*V.u[2])*V.foc*iz;S[i*4+2]=zz;S[i*4+3]=iz}
  const{W,H,dep,nrm,pc,pos,mid}=B;
  for(const fc of m.f){
    const a=fc[0],b=fc[1],c=fc[2];
    if(S[a*4+2]<0.05||S[b*4+2]<0.05||S[c*4+2]<0.05)continue;
    const ax=S[a*4],ay=S[a*4+1],bx=S[b*4],by=S[b*4+1],cx=S[c*4],cy=S[c*4+1];
    const area=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);
    if(!area)continue;
    // cull back faces of closed meshes: screen winding is negative for outward faces seen from outside
    if(!m.twoSided&&area>0)continue;
    const minX=Math.max(0,Math.floor(Math.min(ax,bx,cx))),maxX=Math.min(W-1,Math.ceil(Math.max(ax,bx,cx)));
    const minY=Math.max(0,Math.floor(Math.min(ay,by,cy))),maxY=Math.min(H-1,Math.ceil(Math.max(ay,by,cy)));
    if(minX>maxX||minY>maxY)continue;
    const inv=1/area,ia=S[a*4+3],ib=S[b*4+3],ic=S[c*4+3];
    for(let y=minY;y<=maxY;y++){const py=y+0.5;
      for(let x=minX;x<=maxX;x++){const px=x+0.5;
        const w0=((bx-px)*(cy-py)-(cx-px)*(by-py))*inv;if(w0<0)continue;
        const w1=((cx-px)*(ay-py)-(ax-px)*(cy-py))*inv;if(w1<0)continue;
        const w2=1-w0-w1;if(w2<0)continue;
        const q0=w0*ia,q1=w1*ib,q2=w2*ic,iz=q0+q1+q2;if(iz<=0)continue;
        const z=1/iz,i=y*W+x,zt=z-bias;
        if(zt>=dep[i])continue;
        dep[i]=zt;mid[i]=mi;
        const A=q0*z,Bw=q1*z,C=q2*z,i3=i*3;
        for(let k=0;k<3;k++){nrm[i3+k]=A*N[a*3+k]+Bw*N[b*3+k]+C*N[c*3+k];pos[i3+k]=A*P[a*3+k]+Bw*P[b*3+k]+C*P[c*3+k];pc[i3+k]=A*R[a*3+k]+Bw*R[b*3+k]+C*R[c*3+k]}
      }}
  }
}
// Colour every pixel: painted region, material response, rim. Returns region ids for ink and
// the unlit base colour (for tinted inner lines).
// One shape for every palette entry, so the hot loop stays monomorphic.
function Ent(e,m){const M=MATS[e.mat||m.mat]||MATS.cloth,c=hex(e.c);
  this.r=c[0];this.g=c[1];this.b=c[2];this.line=e.line!==false;this.unlit=!!M.unlit;
  const sh=M.sh||[1,1,1],lt=M.lt||[1,1,1];this.s0=sh[0];this.s1=sh[1];this.s2=sh[2];this.l0=lt[0];this.l1=lt[1];this.l2=lt[2];
  this.spec=M.spec||0;this.gloss=M.gloss||0.95;this.rim=M.rim||0;this.env=M.env||0;this.emit=M.emit||0;this.glow=e.glow||0}
function shadePass(parts,B,o){
  const{W,H,V,nrm,pos,pc,mid}=B,n=W*H,col=new Uint8ClampedArray(n*4),id=new Int32Array(n).fill(-1),base=new Uint8Array(n*3),eye=V.eye;
  const np=parts.length,pals=[],backs=[],paints=[],two=new Uint8Array(np);
  for(let q=0;q<np;q++){const m=parts[q].m;pals.push((m.pal||[{c:m.color}]).map(e=>new Ent(e,m)));backs.push(m.back?new Ent({c:m.back,mat:m.mat},m):null);paints.push(m.paint||null);two[q]=m.twoSided?1:0}
  const ex=eye[0],ey=eye[1],ez=eye[2],LX=LIGHT[0],LY=LIGHT[1],LZ=LIGHT[2],FX=FILL[0],FY=FILL[1],FZ=FILL[2],RX=RIM[0],RY=RIM[1],RZ=RIM[2];
  const p=[0,0,0];
  for(let i=0;i<n;i++){const mi=mid[i];if(mi<0)continue;
    const i3=i*3;let nx=nrm[i3],ny=nrm[i3+1],nz=nrm[i3+2];const nl=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;nx/=nl;ny/=nl;nz/=nl;
    let vx=ex-pos[i3],vy=ey-pos[i3+1],vz=ez-pos[i3+2];const vl=Math.sqrt(vx*vx+vy*vy+vz*vz)||1;vx/=vl;vy/=vl;vz/=vl;
    let nv=nx*vx+ny*vy+nz*vz,back=false;
    if(nv<0&&two[mi]===1){nx=-nx;ny=-ny;nz=-nz;nv=-nv;back=true}
    let e,k=0;const bk=backs[mi];
    if(back&&bk!==null)e=bk;
    else{const pf=paints[mi];if(pf!==null){p[0]=pc[i3];p[1]=pc[i3+1];p[2]=pc[i3+2];k=pf(p,back)|0}const pl=pals[mi];e=pl[k]||pl[0]}
    base[i3]=e.r;base[i3+1]=e.g;base[i3+2]=e.b;
    id[i]=mi*64+(back?32:0)+(e.line?k:0);
    const o4=i*4;col[o4+3]=255;
    if(e.unlit){col[o4]=e.r;col[o4+1]=e.g;col[o4+2]=e.b;continue}
    const t=nx*LX+ny*LY+nz*LZ;let lit=(t+0.05)/0.17;lit=lit<0?0:lit>1?1:lit;lit=lit*lit*(3-2*lit);
    const fd=nx*FX+ny*FY+nz*FZ,g=0.07*t+0.1*(fd>0?fd:0)+(back?-0.07:0);
    const rd=nx*RX+ny*RY+nz*RZ,ri=1-(nv>0?nv:0);const rim=rd>0?ri*ri*ri*rd*e.rim:0;
    let sp=0;
    if(e.spec>0){const hx=LX+vx,hy=LY+vy,hz=LZ+vz,hl=Math.sqrt(hx*hx+hy*hy+hz*hz),sd=(nx*hx+ny*hy+nz*hz)/hl;let u=(sd-e.gloss)/0.025;u=u<0?0:u>1?1:u;sp=u*u*(3-2*u)*e.spec*lit}
    let env=1;
    if(e.env>0){let u=(ny+0.25*nz+0.08)/0.14;u=u<0?0:u>1?1:u;u=u*u*(3-2*u);env=1+(0.62+0.6*u-1)*e.env}
    const em=e.emit,gl=e.glow;
    let r=e.r*((e.s0+(e.l0-e.s0)*lit+g)*env+em)+255*rim+255*sp,gg=e.g*((e.s1+(e.l1-e.s1)*lit+g)*env+em)+150*rim+236*sp,b=e.b*((e.s2+(e.l2-e.s2)*lit+g)*env+em)+70*rim+200*sp;
    if(gl>0){r+=(e.r*1.1+40-r)*gl;gg+=(e.g*1.1+40-gg)*gl;b+=(e.b*1.1+40-b)*gl}
    col[o4]=r;col[o4+1]=gg;col[o4+2]=b;
  }
  return{col,id,base};
}
// Soft contact shading: darken where nearer surfaces sit close in front within a small radius
// (under the hood, between arm and torso, under a belt). Screen-space, from the depth buffer.
function aoPass(B){
  // evaluated on a coarse grid (AO is low-frequency) and bilinearly upsampled
  const{W,H,V,dep,mid}=B,n=W*H,st=Math.max(1,Math.round(H/420)),gw=Math.ceil(W/st)+1,gh=Math.ceil(H/st)+1,g=new Float32Array(gw*gh).fill(1);
  const zc=Math.sqrt((V.eye[0])**2+(V.eye[1]-0.9)**2+(V.eye[2])**2),Rp=0.05*V.foc/zc,OFF=[];
  for(let s=0;s<2;s++)for(let k=0;k<8;k++){const a=k*Math.PI/4+0.3+s*0.39,r=Rp*(s?1:0.5);OFF.push(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r))}
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const x=Math.min(W-1,gx*st),y=Math.min(H-1,gy*st),i=y*W+x;if(mid[i]<0)continue;const z=dep[i];let occ=0;
    for(let q=0;q<OFF.length;q+=2){const xx=x+OFF[q],yy=y+OFF[q+1];if(xx<0||yy<0||xx>=W||yy>=H)continue;const j=yy*W+xx;if(mid[j]<0)continue;const d=z-dep[j];
      if(d>0.012&&d<0.22){const a=(d-0.012)/0.05;occ+=(a<1?a:1)*(1-d/0.22)}}
    g[gy*gw+gx]=1-0.42*(occ/7<1?occ/7:1)}
  const out=new Float32Array(n).fill(1);
  for(let y=0;y<H;y++){const fy=y/st,y0=fy|0,ty=fy-y0,y1=Math.min(gh-1,y0+1);
    for(let x=0;x<W;x++){const i=y*W+x;if(mid[i]<0)continue;const fx=x/st,x0=fx|0,tx=fx-x0,x1=Math.min(gw-1,x0+1);
      out[i]=(g[y0*gw+x0]*(1-tx)+g[y0*gw+x1]*tx)*(1-ty)+(g[y1*gw+x0]*(1-tx)+g[y1*gw+x1]*tx)*ty}}
  return out;
}
// The 2D art draws a dark stroke around every shape. Here: a thick stroke on the silhouette
// and wherever one part sits in front of another (a depth jump), a thinner one where parts
// touch or painted regions meet (tinted toward the local colour). The stroke goes on the nearer side.
function ink(col,B,id,base,strong,weak,inkCol){
  const{W,H,dep,mid}=B,raw=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x;
    for(const j of[x+1<W?i+1:-1,y+1<H?i+W:-1]){
      if(j<0)continue;const a=mid[i],b=mid[j];if(a<0&&b<0)continue;
      let e=0,k=i;
      if(a<0||b<0){e=2;k=a<0?j:i}
      else{const dz=Math.abs(dep[i]-dep[j]);k=dep[i]<dep[j]?i:j;
        if(dz>(a===b?0.035:0.03))e=2;else if(id[i]!==id[j])e=1}
      if(e>raw[k])raw[k]=e}}
  const disc=r=>{const o=[];const R=Math.ceil(r);for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)if(dx*dx+dy*dy<=r*r)o.push(dx,dy);return o};
  const D=[null,disc(weak),disc(strong)],paint=new Uint8Array(W*H),src=new Int32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=y*W+x,e=raw[s];if(!e)continue;const o=D[e];
    for(let q=0;q<o.length;q+=2){const xx=x+o[q],yy=y+o[q+1];if(xx<0||yy<0||xx>=W||yy>=H)continue;
      const j=yy*W+xx;if(e>paint[j]){paint[j]=e;src[j]=s}}}
  for(let j=0;j<W*H;j++){const e=paint[j];if(!e)continue;const j4=j*4;
    if(e===2||mid[src[j]]<0){col[j4]=inkCol[0];col[j4+1]=inkCol[1];col[j4+2]=inkCol[2]}
    else{const s3=src[j]*3;for(let c=0;c<3;c++)col[j4+c]=inkCol[c]*0.72+base[s3+c]*0.2}
    col[j4+3]=255}
  return col;
}

// ---------- compositing (pure JS, so Node and the browser match) ----------
// compose(fig, W, H, ss, o): the warm backdrop, ground shadow and the supersampled figure,
// box-filtered down to W x H. o.bg=false keeps a transparent background (sprite export).
// o.shadow: [{x,z,r,a}] soft blobs on the ground plane (y=0), metres.
function compose(fig,W,H,ss,o){
  o=o||{};const out=new Uint8ClampedArray(W*H*4),V=view(fig.cam,W,H);
  if(o.bg!==false){
    const cx=W/2,cy=-H*0.12,R=H*1.5,S=[[0,hex("#3b1c0a")],[0.62,hex("#171009")],[1,hex("#0e0c0a")]];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=Math.min(1,Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy))/R);let k=0;while(k<S.length-2&&t>S[k+1][0])k++;
      const u=(t-S[k][0])/(S[k+1][0]-S[k][0]),j=(y*W+x)*4;for(let c=0;c<3;c++)out[j+c]=mix(S[k][1][c],S[k+1][1][c],u)+(hash(x,y)-0.5)*2.2;out[j+3]=255}
  }
  if(o.shadow&&o.shadow.length){ // ray-cast each pixel to the ground plane and sum gaussian blobs
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const dx=(x+0.5-W/2)/V.foc,dy=-(y+0.5-H/2)/V.foc,d=add(V.f,add(mul(V.r,dx),mul(V.u,dy)));
      if(d[1]>=-1e-4)continue;const t=-V.eye[1]/d[1],gx=V.eye[0]+d[0]*t,gz=V.eye[2]+d[2]*t;
      let a=0;for(const b of o.shadow){const q=((gx-b.x)**2+(gz-b.z)**2)/(b.r*b.r);if(q<4)a+=b.a*Math.exp(-q*2.2)}
      a=Math.min(0.78,a);if(a<=0.002)continue;const j=(y*W+x)*4;
      if(o.bg===false){out[j+3]=Math.max(out[j+3],a*255)}else for(let c=0;c<3;c++)out[j+c]*=1-a}
  }
  const fw=fig.W,col=fig.col,mid=fig.mid,k2=ss*ss;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let r=0,g=0,b=0,cv=0;
    for(let sy=0;sy<ss;sy++)for(let sx=0;sx<ss;sx++){const i=(y*ss+sy)*fw+x*ss+sx;if(col[i*4+3]===0)continue;const i4=i*4;r+=col[i4];g+=col[i4+1];b+=col[i4+2];cv++}
    if(!cv)continue;const a=cv/k2,j=(y*W+x)*4;
    if(o.bg===false){ // straight alpha over the (black) shadow
      const sa=out[j+3]/255,oa=a+sa*(1-a);out[j]=r/cv*a/oa;out[j+1]=g/cv*a/oa;out[j+2]=b/cv*a/oa;out[j+3]=oa*255;continue}
    out[j]=mix(out[j],r/cv,a);out[j+1]=mix(out[j+1],g/cv,a);out[j+2]=mix(out[j+2],b/cv,a);out[j+3]=Math.max(out[j+3],a*255)}
  return out;
}
H3.R={camera,view,renderFigure,shadePass,aoPass,ink,compose};
})();
