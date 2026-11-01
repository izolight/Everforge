// ================= ART 3D: RIG =================
// Skeleton, poses, linear-blend skinning, weight binding and spring bones (cape, hood tip, hair).
//
// Bones: {name, parent, head:[x,y,z], tail:[x,y,z], spring?:{stiff,drag,grav,r}} in REST space.
// Every bone's rest orientation is the world axes, so a local rotation is simply "how far this
// bone turned from rest", measured in its parent's (posed) frame.
//
// Pose: {t:[x,y,z] root translation, r:{bone:[rx,ry,rz]} rotations (radians), p:{bone:[dx,dy,dz]}
// offsets of a bone's head in its parent frame}. Missing bones stay at rest.
//
// Euler convention: R = Ry * Rx * Rz (twist/turn about y is outermost). With y up, the figure
// facing +z and +x being the figure's LEFT:
//   rx > 0  tips +y toward +z: an upright bone (spine, neck, head) bends FORWARD; a hanging bone
//           (arm, leg) swings BACKWARD (its lower end moves to -z). Lift a leg forward with rx < 0.
//   rz > 0  tips +y toward -x: an upright bone leans to the figure's RIGHT; a hanging bone's lower
//           end moves toward +x (outward for a LEFT limb, inward for a RIGHT limb).
//   ry > 0  turns +z toward +x: the chest/head turns to the figure's LEFT.
// mirror(pose) swaps .L/.R and negates ry and rz, so one side can be authored and copied.
(function(){
"use strict";
const R=H3.rig={},{sub,add,mul,dot,cross,len,norm}=H3.U;
// ---------- 3x3 matrices (row-major arrays of 9) ----------
const I3=()=>[1,0,0,0,1,0,0,0,1];
const mm=(a,b)=>[a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
  a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
  a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]];
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
function eul(r){
  if(!r)return I3();const[rx,ry,rz]=r,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry||0),sy=Math.sin(ry||0),cz=Math.cos(rz||0),sz=Math.sin(rz||0);
  return mm([cy,0,sy,0,1,0,-sy,0,cy],mm([1,0,0,0,cx,-sx,0,sx,cx],[cz,-sz,0,sz,cz,0,0,0,1]));
}
// rotation taking unit vector a onto unit vector b
function fromTo(a,b){
  const v=cross(a,b),c=dot(a,b);
  if(c<-0.99999){const p=norm(Math.abs(a[0])<0.9?cross(a,[1,0,0]):cross(a,[0,1,0]));return[2*p[0]*p[0]-1,2*p[0]*p[1],2*p[0]*p[2],2*p[1]*p[0],2*p[1]*p[1]-1,2*p[1]*p[2],2*p[2]*p[0],2*p[2]*p[1],2*p[2]*p[2]-1]}
  const k=1/(1+c),[x,y,z]=v;
  return[1-k*(y*y+z*z),-z+k*x*y,y+k*x*z, z+k*x*y,1-k*(x*x+z*z),-x+k*y*z, -y+k*x*z,x+k*y*z,1-k*(x*x+y*y)];
}
R.M={I3,mm,mv,eul,fromTo};

// ---------- skeleton ----------
R.skeleton=defs=>{const s={bones:[],idx:{}};(defs||[]).forEach(d=>R.addBone(s,d));return s};
R.addBone=(s,d)=>{
  if(s.idx[d.name]!=null)throw new Error("bone exists: "+d.name);
  const parent=d.parent==null?-1:s.idx[d.parent];
  if(d.parent!=null&&parent==null)throw new Error("unknown parent "+d.parent+" for "+d.name);
  const tail=d.tail||[d.head[0],d.head[1]+0.05,d.head[2]];
  s.idx[d.name]=s.bones.length;s.bones.push({name:d.name,parent,head:d.head.slice(),tail:tail.slice(),spring:d.spring||null,len:len(sub(tail,d.head))});
  return s;
};
R.clone=s=>R.skeleton(s.bones.map(b=>({name:b.name,parent:b.parent<0?null:s.bones[b.parent].name,head:b.head,tail:b.tail,spring:b.spring})));
R.mirror=pose=>{
  const sw=n=>n.replace(/\.(L|R)(?=$|\.|\d)/,(m,c)=>c==="L"?".R":".L");
  const out={t:pose.t?[-pose.t[0],pose.t[1],pose.t[2]]:undefined,r:{},p:{}};
  for(const[k,v]of Object.entries(pose.r||{}))out.r[sw(k)]=[v[0],-(v[1]||0),-(v[2]||0)];
  for(const[k,v]of Object.entries(pose.p||{}))out.p[sw(k)]=[-v[0],v[1],v[2]];
  return out;
};

// ---------- posing ----------
// world(skel, pose, spr?) -> {rot:[m3], pos:[v3]} per bone. spr(i, headW, restRot) may return a
// world rotation for spring bones (see springStep).
R.world=(skel,pose,spr)=>{
  pose=pose||{};const rot=[],pos=[],pr=pose.r||{},pp=pose.p||{},t=pose.t||[0,0,0];
  skel.bones.forEach((b,i)=>{
    const L=eul(pr[b.name]),off=pp[b.name];
    if(b.parent<0){rot[i]=L;pos[i]=add(add(b.head,t),off||[0,0,0]);return}
    const P=skel.bones[b.parent],rp=rot[b.parent];
    let d=sub(b.head,P.head);if(off)d=add(d,off);
    pos[i]=add(pos[b.parent],mv(rp,d));
    const rr=mm(rp,L);
    rot[i]=(b.spring&&spr)?spr(i,pos[i],rr):rr;
  });
  return{rot,pos};
};
// skin matrices: x' = rot*(x-head)+pos, packed 12 floats per bone (rot row-major, then translation)
R.skinMats=(skel,W)=>{
  const n=skel.bones.length,S=new Float32Array(n*12);
  skel.bones.forEach((b,i)=>{const r=W.rot[i],h=mv(r,b.head);for(let k=0;k<9;k++)S[i*12+k]=r[k];S[i*12+9]=W.pos[i][0]-h[0];S[i*12+10]=W.pos[i][1]-h[1];S[i*12+11]=W.pos[i][2]-h[2]});
  return S;
};
R.point=(skel,W,bone,p)=>{const i=skel.idx[bone],b=skel.bones[i];return add(W.pos[i],mv(W.rot[i],sub(p,b.head)))};

// Posed positions and normals of a bound mesh, as Float32Arrays.
R.skinMesh=(m,S)=>{
  const nv=m.v.length;
  if(!m._R){m._R=new Float32Array(nv*3);const vn=H3.G.normals(m);m._RN=new Float32Array(nv*3);
    m.v.forEach((p,i)=>{m._R.set(p,i*3);m._RN.set(vn[i],i*3)})}
  if(!m.wi)return{P:m._R,N:m._RN};
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),X=m._R,XN=m._RN,wi=m.wi,ww=m.ww,M=new Float32Array(12);
  for(let i=0;i<nv;i++){
    M.fill(0);
    for(let k=0;k<4;k++){const w=ww[i*4+k];if(!w)continue;const o=wi[i*4+k]*12;for(let q=0;q<12;q++)M[q]+=w*S[o+q]}
    const x=X[i*3],y=X[i*3+1],z=X[i*3+2],nx=XN[i*3],ny=XN[i*3+1],nz=XN[i*3+2];
    P[i*3]=M[0]*x+M[1]*y+M[2]*z+M[9];P[i*3+1]=M[3]*x+M[4]*y+M[5]*z+M[10];P[i*3+2]=M[6]*x+M[7]*y+M[8]*z+M[11];
    N[i*3]=M[0]*nx+M[1]*ny+M[2]*nz;N[i*3+1]=M[3]*nx+M[4]*ny+M[5]*nz;N[i*3+2]=M[6]*nx+M[7]*ny+M[8]*nz;
  }
  return{P,N};
};

// ---------- binding (writes m.wi / m.ww: 4 bone indices + weights per vertex) ----------
function store(m,skel,list){ // list[i] = [[boneIndex,w],...]
  const nv=m.v.length;m.wi=new Uint16Array(nv*4);m.ww=new Float32Array(nv*4);
  list.forEach((ws,i)=>{ws=ws.filter(x=>x[1]>1e-4).sort((a,b)=>b[1]-a[1]).slice(0,4);const s=ws.reduce((a,x)=>a+x[1],0)||1;
    if(!ws.length)ws=[[0,1]];ws.forEach(([b,w],k)=>{m.wi[i*4+k]=b;m.ww[i*4+k]=w/s})});
  return m;
}
const bi=(skel,n)=>{const i=skel.idx[n];if(i==null)throw new Error("unknown bone "+n);return i};
R.bindRigid=(m,skel,bone)=>{const b=bi(skel,bone);return store(m,skel,m.v.map(()=>[[b,1]]))};
// Inverse-distance to bone segments (head->tail). o.power (default 4) sharpens joints;
// o.scale:{bone:k} multiplies a bone's distance (k<1 lets it reach further).
R.bindAuto=(m,skel,bones,o)=>{
  o=o||{};const pw=o.power||4,ids=bones.map(n=>bi(skel,n)),sc=o.scale||{};
  return store(m,skel,m.v.map(p=>{
    const ws=ids.map(b=>{const B=skel.bones[b],d=H3.U.seg3(p,B.head,B.tail)*(sc[B.name]||1);return[b,1/Math.pow(Math.max(d,1e-3),pw)]});
    const s=ws.reduce((a,x)=>a+x[1],0);ws.forEach(x=>x[1]/=s);return ws}));
};
// fn(p) -> [[boneName,w],...] for full control (cape panels, tassels)
R.bindFn=(m,skel,fn)=>store(m,skel,m.v.map(p=>fn(p).map(([n,w])=>[bi(skel,n),w])));
// Copy weights from already-bound meshes (the body): k nearest source vertices, inverse-distance
// blended. Clothing deforms exactly like the skin under it, which keeps poke-through away.
R.bindTransfer=(m,skel,sources,o)=>{
  o=o||{};const K=o.k||5,cell=o.cell||0.04,grid=new Map(),key=(x,y,z)=>x+","+y+","+z,src=[];
  for(const s of sources){if(!s.wi)continue;s.v.forEach((p,i)=>{const id=src.length;src.push([p,s,i]);
    const k=key(Math.floor(p[0]/cell),Math.floor(p[1]/cell),Math.floor(p[2]/cell));(grid.get(k)||grid.set(k,[]).get(k)).push(id)})}
  if(!src.length)throw new Error("bindTransfer: no bound sources");
  return store(m,skel,m.v.map(p=>{
    const cx=Math.floor(p[0]/cell),cy=Math.floor(p[1]/cell),cz=Math.floor(p[2]/cell);let best=[];
    for(let r=1;r<40;r++){best=[];
      for(let x=cx-r;x<=cx+r;x++)for(let y=cy-r;y<=cy+r;y++)for(let z=cz-r;z<=cz+r;z++){const L=grid.get(key(x,y,z));if(L)for(const id of L)best.push([id,len(sub(src[id][0],p))])}
      if(best.length>=K&&best.sort((a,b)=>a[1]-b[1])[K-1][1]<=r*cell)break}
    best=best.sort((a,b)=>a[1]-b[1]).slice(0,K);const acc=new Map();
    for(const[id,d]of best){const[,s,i]=src[id],w=1/((d+0.004)**2);for(let k=0;k<4;k++){const ww=s.ww[i*4+k];if(ww)acc.set(s.wi[i*4+k],(acc.get(s.wi[i*4+k])||0)+ww*w)}}
    return[...acc.entries()]}));
};

// ---------- spring bones ----------
// Verlet tails pulled toward their animated rest direction, with gravity, drag, a wind term
// (locomotion) and capsule colliders. Deterministic: fixed dt, no randomness.
// colliders: [{bone, a:[x,y,z], b?:[x,y,z], r}] in rest space (b omitted = sphere).
R.springState=(skel,pose)=>{
  const W=R.world(skel,pose),st={tail:[],prev:[]};
  skel.bones.forEach((b,i)=>{if(!b.spring)return;const t=add(W.pos[i],mv(W.rot[i],sub(b.tail,b.head)));st.tail[i]=t;st.prev[i]=t.slice()});
  return st;
};
R.springStep=(skel,pose,st,dt,o)=>{
  o=o||{};const wind=o.wind||[0,0,0],cols=o.colliders||[];let Wd=null;
  const colW=()=>cols.map(c=>{const i=skel.idx[c.bone],b=skel.bones[i],f=p=>add(Wd.pos[i],mv(Wd.rot[i],sub(p,b.head)));return{a:f(c.a),b:c.b?f(c.b):null,r:c.r}});
  let CW=null;
  const spr=(i,head,restRot)=>{
    const b=skel.bones[i],s=b.spring,restDir=mv(restRot,sub(b.tail,b.head)),target=add(head,restDir);
    if(!CW){Wd={rot:Wd0.rot,pos:Wd0.pos};CW=colW()}
    let cur=st.tail[i]||target,prev=st.prev[i]||cur;
    const g=s.grav==null?6:s.grav,k=s.stiff==null?60:s.stiff,drag=s.drag==null?0.12:s.drag,wk=s.wind==null?1:s.wind;
    const acc=add(add(mul(sub(target,cur),k),[0,-g,0]),mul(wind,wk));
    let next=add(add(cur,mul(sub(cur,prev),1-drag)),mul(acc,dt*dt));
    const fix=q=>add(head,mul(norm(sub(q,head)),b.len));
    next=fix(next);
    const tr=s.r||0.02;
    for(const c of CW){
      let q;if(c.b){const v=sub(c.b,c.a),t=H3.U.clamp(dot(sub(next,c.a),v)/(dot(v,v)||1),0,1);q=add(c.a,mul(v,t))}else q=c.a;
      const d=sub(next,q),dl=len(d),min=c.r+tr;
      if(dl<min&&dl>1e-6){next=fix(add(q,mul(d,min/dl)))}
    }
    st.prev[i]=cur;st.tail[i]=next;
    return mm(fromTo(norm(restDir),norm(sub(next,head))),restRot);
  };
  // colliders sit on non-spring bones, which are always solved before spring bones (they are
  // added later); a first plain pass provides their transforms
  const Wd0=R.world(skel,pose);
  return R.world(skel,pose,spr);
};
})();
