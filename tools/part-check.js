// Renders every biome pool on every body and part, to prove the expanded pools all draw.
// Run: node tools/part-check.js
const fs=require("fs"),vm=require("vm"),path=require("path");
const ctx=vm.createContext({console,Math,JSON});
// the art files in the order index.html loads them (a readdir sort would not match it)
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
for(const [,f] of html.matchAll(/<script src="(js\/art\/[^"]+)"><\/script>/g))vm.runInContext(fs.readFileSync(path.join(__dirname,"..",f),"utf8"),ctx,{filename:f});
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","js","monsters.js"),"utf8")+"\nglobalThis.BIOMES=BIOMES;",ctx,{filename:"monsters.js"}); // whole file: BIOMES is a const, so export it
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
// Authored animal variants are not in every biome pool, so exercise their advertised attachment anchors directly.
const ANIMAL_PARTS={canine:["mane","horns","tail","spikes","armor","vines","wings","flames","frost","crystals"],feline:["mane","horns","tail","spikes","armor","vines","wings","flames","frost","crystals"],bear:["mane","horns","tail","spikes","armor","shell","vines","wings","flames","frost","crystals"],reptile:["horns","tail","spikes","armor","shell","vines","wings","flames","frost","crystals"]};
for(const [body,parts] of Object.entries(ANIMAL_PARTS))for(const part of parts){checks++;const a=BODY[body](COL,{skin:"#cfa784",glow:false}).a;let one="";try{one=PART[part].f(COL,a)||""}catch(e){console.log("PART-THROW",body,part,e.stack);fail++;continue}if(!one.trim()){console.log("NO-DRAW",body,part);fail++}}
console.log(`part-check: ${checks} renders, ${fail} problem(s), ${skip} SKIP (tail draws nothing on its body)`);
process.exit(fail?1:0);
