// Checks the colour rules of the enemy art (CIE Lab dE76): element mids stay apart, biome accents stay apart.
// Run: node tools/color-check.js   (exits 1 on any failure)
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,".."),ctx=vm.createContext({console,Math,JSON,parseInt,Set,Map});
// the same files the browser loads, in the same order (colour helpers, then the biome table)
for(const f of ["js/art/color.js","js/monsters.js"])vm.runInContext(fs.readFileSync(path.join(root,f),"utf8"),ctx,{filename:f});
vm.runInContext("globalThis.X={ELPAL,BIOMES,dE,lab};",ctx);
const {ELPAL,BIOMES,dE}=ctx.X;
let fail=0;
const bad=msg=>{console.log("FAIL "+msg);fail++};
// 1. the element mids (one hue slot per element) are at least 20 dE apart
const els=Object.keys(ELPAL);let pairs=0;
for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){pairs++;const d=dE(ELPAL[els[i]][1],ELPAL[els[j]][1]);if(d<20)bad(`element mids ${els[i]} ${ELPAL[els[i]][1]} and ${els[j]} ${ELPAL[els[j]][1]} are dE ${d.toFixed(1)} apart (need 20)`)}
// 2. every biome accent is at least 10 dE from every other biome's accent (a biome may use its own two)
const bis=Object.keys(BIOMES);let apairs=0;
for(let i=0;i<bis.length;i++)for(let j=i+1;j<bis.length;j++)for(const a of BIOMES[bis[i]].acc)for(const b of BIOMES[bis[j]].acc){apairs++;const d=dE(a,b);if(d<10)bad(`biome accents ${bis[i]} ${a} and ${bis[j]} ${b} are dE ${d.toFixed(1)} apart (need 10)`)}
console.log(`color-check: ${pairs} element pairs, ${apairs} biome accent pairs, ${fail} problem(s)`);
process.exit(fail?1:0);
