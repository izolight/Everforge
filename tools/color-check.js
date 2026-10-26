// Checks the colour rules of the enemy art (CIE Lab dE76): element mids stay apart, biome accents stay apart,
// and every generated creature (each region's roster and Rift rolls) and hand-made enemy stands its accent off its body.
// Run: node tools/color-check.js   (exits 1 on any failure)
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,".."),ctx=vm.createContext({console,Math,JSON,parseInt,Set,Map});
// the same files the browser loads, in the same order (colour helpers, the data, then the creature generator)
for(const f of ["js/art/color.js","js/data.js","js/helpers.js","js/affix.js","js/monsters.js"])vm.runInContext(fs.readFileSync(path.join(root,f),"utf8"),ctx,{filename:f});
vm.runInContext("globalThis.X={ELPAL,BIOMES,dE,ENEMIES,ZONE_BIOME,RIFT_BIOMES,genRoster,riftMake};",ctx);
const {ELPAL,BIOMES,dE,ENEMIES,ZONE_BIOME,RIFT_BIOMES,genRoster,riftMake}=ctx.X;
let fail=0;
const bad=msg=>{console.log("FAIL "+msg);fail++};
// 1. the element mids (one hue slot per element) are at least 20 dE apart
const els=Object.keys(ELPAL);let pairs=0;
for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){pairs++;const d=dE(ELPAL[els[i]][1],ELPAL[els[j]][1]);if(d<20)bad(`element mids ${els[i]} ${ELPAL[els[i]][1]} and ${els[j]} ${ELPAL[els[j]][1]} are dE ${d.toFixed(1)} apart (need 20)`)}
// 1b. every shade (light, mid, dark) of one element is at least 15 dE from every shade of a different element, so a body reads as its element
const shades=els.flatMap(e=>ELPAL[e].map((c,k)=>[e,["light","mid","dark"][k],c]));let spairs=0;
for(let i=0;i<shades.length;i++)for(let j=i+1;j<shades.length;j++){const [a,b]=[shades[i],shades[j]];if(a[0]===b[0])continue;spairs++;const d=dE(a[2],b[2]);if(d<15)bad(`${a[0]} ${a[1]} ${a[2]} and ${b[0]} ${b[1]} ${b[2]} are dE ${d.toFixed(1)} apart (need 15)`)}
// 2. every biome accent is at least 10 dE from every other biome's accent (a biome may use its own two)
const bis=Object.keys(BIOMES);let apairs=0;
for(let i=0;i<bis.length;i++)for(let j=i+1;j<bis.length;j++)for(const a of BIOMES[bis[i]].acc)for(const b of BIOMES[bis[j]].acc){apairs++;const d=dE(a,b);if(d<10)bad(`biome accents ${bis[i]} ${a} and ${bis[j]} ${b} are dE ${d.toFixed(1)} apart (need 10)`)}
// 3. every generated creature (each region's ten wild creatures, and Rift rolls of every biome) and every hand-made enemy with art: accent vs body dE 25 or more
const seen=new Set();let made=0;
const stand=(E,where)=>{if(!E.art||!E.art.c||!E.art.a||seen.has(E.id+where))return;seen.add(E.id+where);made++;const d=dE(E.art.c,E.art.a);if(d<25)bad(`${where} ${E.id}: accent ${E.art.a} vs body ${E.art.c} is dE ${d.toFixed(1)} apart (need 25)`)};
for(const z of Object.keys(ZONE_BIOME))for(const E of genRoster(z))stand(E,"wild "+z);
for(let s=1;s<=60;s++){const rf=riftMake("rift-check:"+s,1);for(const id of Object.keys(ENEMIES))if(id.startsWith("w_rift_")||id==="rift_boss")stand(ENEMIES[id],`rift ${rf.biome} seed ${s}`)}
for(const E of Object.values(ENEMIES))if(!E.gen)stand(E,"hand-made");
console.log(`color-check: ${pairs} element pairs, ${apairs} biome accent pairs, ${made} creature accents, ${fail} problem(s)`);
process.exit(fail?1:0);
