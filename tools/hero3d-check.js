#!/usr/bin/env node
// Structural checks for the 3D hero (art3d/): modules load, every gear item and preset assembles
// with valid skin weights, every clip samples cleanly with feet above the floor, frames are
// deterministic. Pure Node (no browser). Usage: node tools/hero3d-check.js
const assert=require("node:assert/strict"),{load}=require("./hero3d-lib.js");
const H3=load(),t0=Date.now();
const finite=a=>{for(const x of a)if(!Number.isFinite(x))return false;return true};
const BODY_TAGS=new Set(H3.body.build().meshes.map(m=>m.tag));
const tagKnown=h=>[...BODY_TAGS].some(t=>t===h||t.startsWith(h+"."));
function checkModel(m,label){
  const nb=m.skel.bones.length;
  for(const x of m.meshes){
    assert(x.wi&&x.ww,`${label}: ${x.name||x.tag||x.item} is unbound`);
    for(let i=0;i<x.v.length;i++){let s=0;for(let k=0;k<4;k++){s+=x.ww[i*4+k];assert(x.wi[i*4+k]<nb,`${label}: bad bone index`)}
      assert(Math.abs(s-1)<1e-3,`${label}: weights of ${x.item||x.tag} sum to ${s}`)}
    assert(x.f.every(f=>f.every(i=>i>=0&&i<x.v.length)),`${label}: face index out of range in ${x.item||x.tag}`);
    assert(x.v.every(p=>finite(p)),`${label}: NaN vertex in ${x.item||x.tag}`);
  }
  return m.meshes.reduce((a,x)=>a+x.f.length,0);
}
// ---- body and registries
const base=H3.hero.build({});checkModel(base,"base");
for(const b of ["root","hips","spine","chest","neck","head","hand.R","fingers.L","foot.R","shin.L"])assert(base.skel.idx[b]!=null,"missing bone "+b);
const items=H3.gear.list(),clips=H3.anim.list();
console.log(`ok base body: ${base.meshes.length} parts, ${checkModel(base,"base")} triangles, ${base.skel.bones.length} bones`);
// ---- every item alone
for(const it of items){
  const slot=it.slot,m=H3.hero.build({[slot]:it.id});checkModel(m,it.id);
  const tris=m.meshes.filter(x=>x.item===it.id).reduce((a,x)=>a+x.f.length,0);
  assert(m.meshes.some(x=>x.item===it.id),`${it.id} produced no meshes`);
  for(const h of m.hidden)assert(tagKnown(h),`${it.id} hides unknown body tag "${h}"`);
  assert(tris<15000,`${it.id}: ${tris} triangles is too heavy`);
}
console.log(`ok ${items.length} gear items assemble alone with valid weights (${H3.hero.SLOTS.map(s=>s+":"+H3.gear.list(s).length).join(" ")})`);
// ---- presets
for(const[name,L]of Object.entries(H3.hero.presets)){
  for(const[s,e]of Object.entries(L)){if(!e)continue;const id=typeof e==="string"?e:e.id;assert(H3.gear.get(id),`preset ${name}: unknown item ${id}`);assert(H3.hero.SLOTS.includes(s),`preset ${name}: bad slot ${s}`)}
  checkModel(H3.hero.build(L),"preset "+name);
}
console.log(`ok ${Object.keys(H3.hero.presets).length} presets: ${Object.keys(H3.hero.presets).join(", ")}`);
// ---- clips: finite poses, feet never below the floor
const full=H3.hero.build(H3.hero.presets.wanderer||{}),S0=H3.rig;
const footMin=(m,P)=>{const S=S0.skinMats(m.skel,P.world);let lo=Infinity;for(const x of m.meshes){if(!/^foot|^leg/.test(x.tag)&&x.slot!=="feet")continue;const{P:Q}=S0.skinMesh(x,S);for(let i=1;i<Q.length;i+=3)lo=Math.min(lo,Q[i])}return lo};
for(const c of clips){
  assert(c.duration>0,`${c.id}: duration`);
  for(let k=0;k<=6;k++){const t=c.duration*k/6,P=H3.hero.pose(base,c.id,t);
    for(const r of P.world.pos)assert(finite(r),`${c.id} t=${t}: NaN bone position`);
    const lo=footMin(base,P);assert(lo>-0.03,`${c.id} t=${t.toFixed(2)}: a foot goes ${(-lo*100).toFixed(1)} cm below the floor`)}
}
console.log(`ok ${clips.length} clips sample cleanly with feet above the floor (${clips.map(c=>c.id).join(", ")})`);
// ---- frames: non-empty and deterministic
const cl=H3.anim.get("walk")?"walk":"rest";
const a=H3.hero.render(full,cl,0.37,{W:120,H:160,ss:1}),b=H3.hero.render(full,cl,0.37,{W:120,H:160,ss:1});
assert(Buffer.compare(Buffer.from(a.rgba.buffer),Buffer.from(b.rgba.buffer))===0,"frames are not deterministic");
let figure=0;for(let i=0;i<a.rgba.length;i+=4)if(a.rgba[i]+a.rgba[i+1]+a.rgba[i+2]>140)figure++;
assert(figure>400,"the figure did not render");
console.log(`ok a ${cl} frame renders deterministically (${Date.now()-t0} ms total)`);

// Both profiles must coexist without changing the shared body or each other's rig.
const original=JSON.stringify(H3.body.bones),maleBefore=JSON.stringify(base.meshes.map(m=>m.v));
for(const [name,L] of Object.entries(H3.hero.presets)){
  const female=H3.hero.build(L,{variant:"female"});checkModel(female,"female "+name);
  assert.equal(female.variant,"female");
  for(const clip of clips)for(const t of [0,clip.duration/2,clip.duration]){
    const P=H3.hero.pose(female,clip.id,t);
    assert(P.world.pos.every(finite),"female "+clip.id+": invalid pose");
    assert(footMin(female,P)>-0.03,"female "+clip.id+": foot below floor");
  }
}
assert.equal(JSON.stringify(H3.body.bones),original,"variant changed shared skeleton");
assert.equal(JSON.stringify(base.meshes.map(m=>m.v)),maleBefore,"variant changed existing model");
assert.notDeepEqual(H3.hero.build({},{variant:"female"}).meshes.find(m=>m.tag==="torso").v,base.meshes.find(m=>m.tag==="torso").v);
console.log("ok female profile: every preset and animation, isolated geometry and rig");
