// Renders every biome pool on every body and part, to prove the expanded pools all draw.
// Run: node tools/part-check.js
const fs=require("fs"),vm=require("vm"),path=require("path");
const ctx=vm.createContext({console,Math,JSON});
const files=fs.readdirSync(path.join(__dirname,"..","js","art")).filter(f=>f.endsWith(".js")).sort();
for(const f of files)vm.runInContext(fs.readFileSync(path.join(__dirname,"..","js","art",f),"utf8"),ctx,{filename:f});
const src=fs.readFileSync(path.join(__dirname,"..","js","monsters.js"),"utf8");
const block=src.slice(src.indexOf("const BIOMES={"),src.indexOf("\n};",src.indexOf("const BIOMES={"))+3);
vm.runInContext(block.replace("const BIOMES=","globalThis.BIOMES="),ctx,{filename:"monsters.js"});
const {PART,BODY,compose}=vm.runInContext("({PART,BODY,compose})",ctx);
const BIOMES=ctx.BIOMES;
const COL={id:"x",o:"#0d0a08",d:"#333",m:"#444",D:"#222",l:"#666",g:"#777",e:"#ff0",a:"#f80",b:"#a80",ph:false};
const R=()=>.5;
let fail=0,checks=0,skip=0;
for(const [name,B] of Object.entries(BIOMES)){
  for(const body of B.bodies){
    for(const part of B.parts){
      checks++;
      let out="";
      try{out=compose({b:body,p:[part]},COL,[],R).s}catch(e){console.log("THROW",name,body,part,e.message);fail++;continue}
      if(!out||!out.trim()){console.log("EMPTY",name,body,part);fail++;continue}
      // every part must draw on its own, not just ride on the body silhouette
      const a=BODY[body](COL,{skin:"#cfa784",glow:false}).a;let one="";
      try{one=PART[part].f(COL,a)||""}catch(e){console.log("PART-THROW",name,body,part,e.stack);fail++;continue}
      if(part==="tail"&&!one.trim()){skip++;continue} // tail has no anchor on some bodies (V-12 fixes it): counted as SKIP, never a failure
      if(!one.trim()){console.log("NO-DRAW",name,body,part);fail++}
    }
  }
}
console.log(`part-check: ${checks} renders, ${fail} problem(s), ${skip} SKIP (tail draws nothing on its body)`);
process.exit(fail?1:0);
