// ================= ART 3D: HERO ASSEMBLY =================
// Puts the base body, the equipped gear and an animation together, and renders a frame.
//
// Gear registry (art3d/gear/*.js):
//   H3.gear.register({id, slot, name, colors:{name:"#hex"}, hides:[tags], kind, build(ctx)})
//   build(ctx) -> {meshes:[...], bones?:[boneDefs], colliders?:[...], pose?:{r:{bone:[rx,ry,rz]}}}
//     ctx.dims   body measurements (H3.body.dims), ctx.body the body's ring keys helpers
//     ctx.col(n) the item's colour n (loadout overrides > item defaults)
//     ctx.G/U    geometry/maths helpers, ctx.grip (held items), ctx.has(slot), ctx.item(slot)
//   Mesh binding (mesh.bind): "bone" rigid | {bones:[...],power} auto | {fn:p=>[[bone,w],..]}
//     | {from:[tag prefixes]} copy weights from those body parts | undefined: copy from the whole body.
//   Held items (slot main/off) are authored in grip space (handle along +Y, origin at the grip
//   centre) and set mesh.held=true; assembly moves them into the fist and binds them to the hand.
// Animation registry (art3d/anim.js):
//   H3.anim.register({id, name, loop, duration, speed?, sample(t, ctx) -> pose})
//   ctx: {kind:{main,off}, has(slot), dims, mirror}
(function(){
"use strict";
const R=H3.rig,{G,U}=H3;
const SLOTS=["head","body","back","hands","feet","charm","main","off"];
const SLOT_NAMES={head:"Head",body:"Body",back:"Back",hands:"Hands",feet:"Feet",charm:"Trinket",main:"Main hand",off:"Off hand"};
// ---------- registries ----------
const items={};
H3.gear={
  register(it){if(!SLOTS.includes(it.slot))throw new Error("bad slot "+it.slot+" for "+it.id);if(items[it.id])throw new Error("duplicate gear "+it.id);items[it.id]=it;return it},
  get:id=>items[id],list:slot=>Object.values(items).filter(i=>!slot||i.slot===slot),SLOTS,SLOT_NAMES};
const clips={};
H3.anim={register(c){if(clips[c.id])throw new Error("duplicate anim "+c.id);clips[c.id]=c;return c},get:id=>clips[id],list:()=>Object.values(clips)};
// a rest clip is always available
H3.anim.register({id:"rest",name:"Rest pose",loop:true,duration:1,sample:()=>({r:{}})});

// ---------- presets (loadouts) ----------
H3.hero={SLOTS,presets:{base:{}}};
const norm=e=>e==null||e===""?null:typeof e==="string"?{id:e}:e;

// ---------- assembly ----------
H3.hero.build=function(loadout,o){
  o=o||{};loadout=Object.assign({},loadout||{});
  const skel=R.skeleton(H3.body.bones),body=H3.body.build(o.body||{}),meshes=[],hides=new Set(),hints={r:{}},colliders=body.colliders.slice();
  const equipped={};for(const s of SLOTS){const e=norm(loadout[s]);if(!e)continue;const def=items[e.id];if(!def){console.warn("unknown gear "+e.id);continue}
    if(def.slot!==s&&!(def.slot==="main"&&s==="off")&&!(def.slot==="off"&&s==="main"))console.warn(e.id+" is a "+def.slot+" item, worn in "+s);equipped[s]={def,e}}
  for(const m of body.meshes)bind(m,skel,[]);
  const has=s=>!!equipped[s],kind={};
  for(const[s,{def}]of Object.entries(equipped)){kind[s]=def.kind||def.id;(def.hides||[]).forEach(h=>hides.add(h))}
  const out=[];
  for(const[s,{def,e}]of Object.entries(equipped)){
    const cols=Object.assign({},def.colors,e.colors||{});
    const side=s==="off"?"L":"R";
    const ctx={dims:H3.body.dims,body:H3.body,G,U,slot:s,side,grip:H3.body.dims.grip[side],has,kind,loadout,
      col:n=>cols[n]||(def.colors&&def.colors[n])||"#ff00ff",colors:cols,opts:e};
    const r=def.build(ctx)||{};
    (r.bones||[]).forEach(b=>R.addBone(skel,b));
    (r.colliders||[]).forEach(c=>colliders.push(c));
    if(r.pose&&r.pose.r)for(const[k,v]of Object.entries(r.pose.r)){const a=hints.r[k]||[0,0,0];hints.r[k]=[a[0]+(v[0]||0),a[1]+(v[1]||0),a[2]+(v[2]||0)]}
    (r.hides||[]).forEach(h=>hides.add(h));
    for(const m of r.meshes||[]){m.slot=s;m.item=def.id;
      if(m.held){const g=ctx.grip;G.xform(m,{rx:g.rx,ry:g.ry,rz:g.rz,t:g.at});if(m.bind==null)m.bind=g.bone}
      out.push(m)}
  }
  const hidden=t=>[...hides].some(h=>t===h||t.startsWith(h+"."));
  const sources=body.meshes;
  for(const m of out)bind(m,skel,sources);
  for(const m of body.meshes)if(!hidden(m.tag))meshes.push(m);
  meshes.push(...out);
  return{skel,meshes,colliders,hints,loadout,equipped,kind,has:has,hidden:[...hides]};
};
function bind(m,skel,sources){
  const b=m.bind;
  if(typeof b==="string")return R.bindRigid(m,skel,b);
  if(b&&b.bones)return R.bindAuto(m,skel,b.bones,b);
  if(b&&b.fn)return R.bindFn(m,skel,b.fn);
  const from=b&&b.from?sources.filter(s=>b.from.some(t=>s.tag===t||s.tag.startsWith(t+"."))):sources;
  if(!from.length)throw new Error("mesh "+(m.name||m.tag)+" has no binding and no body to copy from");
  return R.bindTransfer(m,skel,from,b||{});
}

// ---------- posing ----------
const DT=1/60;
function clipCtx(model){return{kind:model.kind,has:model.has,dims:H3.body.dims,mirror:R.mirror}}
function samplePose(model,clip,t,ctx){
  const T=clip.loop?((t%clip.duration)+clip.duration)%clip.duration:U.clamp(t,0,clip.duration);
  const p=clip.sample(T,ctx)||{},r=Object.assign({},p.r||{});
  for(const[k,v]of Object.entries(model.hints.r)){const a=r[k]||[0,0,0];r[k]=[a[0]+v[0],a[1]+v[1],a[2]+v[2]]}
  return{t:p.t,r,p:p.p||{},wind:p.wind};
}
const windOf=(clip,p)=>p.wind||[0,0,-(clip.speed||0)*3];
// pose(model, animId, t) -> {pose, world}: deterministic; spring bones are simulated from
// a warm-up start so a still frame looks the same however it was reached.
H3.hero.pose=function(model,animId,t,o){
  o=o||{};const clip=clips[animId]||clips.rest,ctx=clipCtx(model),hasSpring=model.skel.bones.some(b=>b.spring);
  const p=samplePose(model,clip,t,ctx);
  if(!hasSpring)return{pose:p,world:R.world(model.skel,p),clip};
  const warm=clip.loop?Math.max(1.5,clip.duration*2):1,t0=clip.loop?t-warm:-0.6,steps=Math.round((t-t0)/DT);
  const p0=samplePose(model,clip,clip.loop?t0:0,ctx),st=R.springState(model.skel,p0);
  let W=null;
  for(let k=0;k<=steps;k++){const tt=clip.loop?t0+k*DT:Math.max(0,t0+k*DT),pk=k===steps?p:samplePose(model,clip,tt,ctx);
    W=R.springStep(model.skel,pk,st,DT,{wind:windOf(clip,pk),colliders:model.colliders})}
  return{pose:p,world:W,clip,state:st};
};
// Live playback: keeps the spring state between frames (the viewer).
H3.hero.player=function(model,animId){
  const ctx=clipCtx(model);let clip=clips[animId]||clips.rest,t=0,st=null,acc=0,W=null;
  return{
    get t(){return t},get clip(){return clip},
    set(id,tt){clip=clips[id]||clips.rest;t=tt||0;st=null},
    seek(tt){const r=H3.hero.pose(model,clip.id,tt);t=tt;st=r.state||null;W=r.world;return r},
    step(dt){
      if(!model.skel.bones.some(b=>b.spring)){t+=dt;const p=samplePose(model,clip,t,ctx);W=R.world(model.skel,p);return{pose:p,world:W}}
      if(!st){const r=H3.hero.pose(model,clip.id,t);st=r.state;W=r.world}
      acc+=Math.min(dt,0.1);let p=null;
      while(acc>=DT){acc-=DT;t+=DT;p=samplePose(model,clip,t,ctx);W=R.springStep(model.skel,p,st,DT,{wind:windOf(clip,p),colliders:model.colliders})}
      return{pose:p||samplePose(model,clip,t,ctx),world:W};
    }};
};

// ---------- rendering ----------
// frame(model, posed, o) -> {rgba, W, H}. o: {cam, W, H, ss, bg, ao, shadow}
H3.hero.camera=(yaw,pitch,dist,target)=>H3.R.camera(yaw==null?0.6:yaw,pitch==null?0.08:pitch,dist||3.4,target||[0,0.92,0],0.62);
H3.hero.frame=function(model,posed,o){
  o=o||{};const W=o.W||760,H=o.H||1000,ss=o.ss||2,cam=o.cam||H3.hero.camera();
  const S=R.skinMats(model.skel,posed.world);
  const parts=model.meshes.map(m=>Object.assign({m},R.skinMesh(m,S)));
  const fig=H3.R.renderFigure(parts,cam,W*ss,H*ss,{ao:o.ao,lineScale:H*ss/1000});
  let shadow=[];
  if(o.shadow!==false){const Wd=posed.world,sk=model.skel,hp=Wd.pos[sk.idx.hips];
    shadow.push({x:hp[0],z:hp[2]-0.02,r:0.4,a:0.42});
    for(const s of["L","R"]){const f=R.point(sk,Wd,"foot."+s,H3.body.dims.joints.ankle[s]),toe=R.point(sk,Wd,"foot."+s,H3.body.dims.joints.toe[s]);
      const h=Math.min(f[1],toe[1]+0.05),a=0.4*(1-U.clamp((h-0.1)/0.3,0,1));
      shadow.push({x:(f[0]+toe[0])/2,z:(f[2]+toe[2])/2,r:0.13,a})}}
  return{rgba:H3.R.compose(fig,W,H,ss,{bg:o.bg,shadow}),W,H};
};
// render(model, animId, t, o): pose + frame in one call
H3.hero.render=(model,animId,t,o)=>H3.hero.frame(model,H3.hero.pose(model,animId,t),o);
})();
