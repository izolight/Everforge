#!/usr/bin/env node
// Renders the 3D hero (art3d/) to PNG in Node. Examples:
//   node tools/hero3d-shot.js                                   # base hero, 3/4 view -> /tmp/hero3d.png
//   node tools/hero3d-shot.js --preset wanderer --views         # front, 3/4, side, back in one sheet
//   node tools/hero3d-shot.js --gear head=hood,back=cape --anim walk --frames 8 --yaw 1.57
//   node tools/hero3d-shot.js --anim attack --t 0.35 --size 380x500 --out /tmp/a.png
//   node tools/hero3d-shot.js --evidence                        # writes the art-evidence/hero3d-*.png set
// Options: --preset name  --gear slot=id[,slot=id] (slot=none clears)  --anim id  --t seconds
//   --frames N (sheet over the clip)  --cols N  --views  --yaw r --pitch r --dist m  --size WxH
//   --ss N (supersampling, default 2)  --nobg  --list (registered gear, clips and presets)  --out file
const path=require("node:path"),{load,sheet,write}=require("./hero3d-lib.js");
const args=process.argv.slice(2),opt={};
for(let i=0;i<args.length;i++){const a=args[i];if(!a.startsWith("--"))continue;const k=a.slice(2),v=args[i+1]&&!args[i+1].startsWith("--")?args[++i]:true;opt[k]=v}
const H3=load();
if(opt.list){
  for(const s of H3.hero.SLOTS)console.log(s.padEnd(6),H3.gear.list(s).map(g=>g.id).join(", ")||"-");
  console.log("anims ",H3.anim.list().map(c=>c.id+(c.loop?"":"*")).join(", "));
  console.log("preset",Object.keys(H3.hero.presets).join(", "));process.exit(0);
}
function loadoutOf(o){
  const L=Object.assign({},H3.hero.presets[o.preset||"base"]||{});
  if(o.preset&&!H3.hero.presets[o.preset])throw new Error("unknown preset "+o.preset);
  if(typeof o.gear==="string")for(const kv of o.gear.split(",")){const[s,id]=kv.split("=");L[s]=id==="none"?null:id}
  return L;
}
const[W,H]=(opt.size||"760x1000").split("x").map(Number),ss=+(opt.ss||2);
const cam=(yaw)=>H3.hero.camera(yaw,opt.pitch!=null?+opt.pitch:0.08,opt.dist?+opt.dist:3.4,opt.target?opt.target.split(",").map(Number):undefined);
const model=H3.hero.build(loadoutOf(opt)),anim=opt.anim||"rest",yaw=opt.yaw!=null?+opt.yaw:0.6;
const shot=(a,t,y,o)=>H3.hero.render(model,a,t,Object.assign({cam:cam(y),W,H,ss,bg:opt.nobg?false:undefined},o));
const t0=Date.now();
if(opt.evidence){
  const ART=path.resolve(__dirname,"..","art-evidence"),views=[["front",0],["3q",0.62],["side",1.5708],["back",3.1416]];
  const sets=[["hero3d-base","base"],["hero3d-wanderer","wanderer"]];
  for(const[name,preset]of sets){if(!H3.hero.presets[preset])continue;const m=H3.hero.build(H3.hero.presets[preset]);
    const fr=views.map(([,y])=>H3.hero.render(m,"rest",0,{cam:cam(y),W:380,H:500,ss:3}));write(path.join(ART,name+".png"),sheet(fr,4));console.log("ok",name+".png")}
  const ps=Object.keys(H3.hero.presets).filter(p=>p!=="base");
  if(ps.length){const fr=ps.map(p=>H3.hero.render(H3.hero.build(H3.hero.presets[p]),"rest",0,{cam:cam(0.5),W:300,H:420,ss:3}));write(path.join(ART,"hero3d-loadouts.png"),sheet(fr,Math.min(4,fr.length)));console.log("ok hero3d-loadouts.png")}
  const m=H3.hero.build(H3.hero.presets.adventurer||H3.hero.presets.wanderer||{});
  for(const c of H3.anim.list().filter(c=>c.id!=="rest")){const n=8,fr=[];for(let k=0;k<n;k++)fr.push(H3.hero.render(m,c.id,c.duration*k/(c.loop?n:n-1),{cam:cam(c.view!=null?c.view:0.9),W:240,H:320,ss:2}));
    write(path.join(ART,"hero3d-anim-"+c.id+".png"),sheet(fr,8));console.log("ok hero3d-anim-"+c.id+".png")}
}else if(opt.views){
  const fr=[0,0.62,1.5708,3.1416].map(y=>shot(anim,+(opt.t||0),y,{W:Math.round(W/2),H:Math.round(H/2),ss:ss+1}));
  write(opt.out||"/tmp/hero3d.png",sheet(fr,4));
}else if(opt.frames){
  const clip=H3.anim.get(anim)||{duration:1,loop:true},n=+opt.frames,fr=[];
  for(let k=0;k<n;k++)fr.push(shot(anim,clip.duration*k/(clip.loop?n:Math.max(1,n-1)),yaw,{W:Math.round(W/3),H:Math.round(H/3)}));
  write(opt.out||"/tmp/hero3d.png",sheet(fr,+(opt.cols||Math.min(n,8))));
}else write(opt.out||"/tmp/hero3d.png",shot(anim,+(opt.t||0),yaw));
if(!opt.evidence)console.log("wrote",opt.out||"/tmp/hero3d.png",(Date.now()-t0)+"ms");
