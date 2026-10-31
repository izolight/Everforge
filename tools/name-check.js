// Ensures procedural creature nouns fit their body family, for wild and Rift rosters.
// Run: node tools/name-check.js
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,".."),ctx=vm.createContext({console,Math,JSON,parseInt,Set,Map});
for(const f of ["js/art/color.js","js/data.js","js/helpers.js","js/affix.js","js/roles.js","js/factions.js","js/monsters.js"])vm.runInContext(fs.readFileSync(path.join(root,f),"utf8"),ctx,{filename:f});
const {BIOMES,GEN_T,rng,hash,genCreature,BODY_NOUNS,PROC_NAME_PARTS,PROC_PLURAL_PARTS,PROC_SHORT_PARTS}=vm.runInContext("({BIOMES,GEN_T,rng,hash,genCreature,BODY_NOUNS,PROC_NAME_PARTS,PROC_PLURAL_PARTS,PROC_SHORT_PARTS})",ctx);
let fail=0,count=0;const bad=m=>{console.log("FAIL "+m);fail++};
const valid=(body,name)=>BODY_NOUNS[body].some(n=>name.endsWith(" "+n));
for(const [biome,B] of Object.entries(BIOMES))for(const body of Object.keys(BODY_NOUNS))for(let boss=0;boss<2;boss++){
  const id=`name_${biome}_${body}_${boss}`,R=rng(hash(id)),pool=B.bodies;B.bodies=[body];const E=genCreature({id,zone:"rift",biome,tier:GEN_T.spire,R,used:new Set(),boss,seed:id});B.bodies=pool;count++;
  if(!valid(body,E.name))bad(`${biome}/${body}${boss?" boss":""} generated incompatible name ${E.name}`);
  if(!E.nameParts||E.nameParts.body!==body||!BODY_NOUNS[body].includes(E.nameParts.noun))bad(`${biome}/${body}${boss?" boss":""} has invalid localization metadata`);
  if(E.name!==`${E.nameParts.prefix} ${E.nameParts.noun}`&&!(E.nameParts.tail&&E.name===`${E.nameParts.prefix} ${E.nameParts.noun} the ${E.nameParts.tail}`))bad(`${biome}/${body}${boss?" boss":""} metadata changed canonical name ${E.name}`);
  if(!PROC_NAME_PARTS.has(E.name)||!PROC_PLURAL_PARTS.has(E.plural))bad(`${biome}/${body}${boss?" boss":""} missing canonical name lookup metadata`);
  if(boss&&(!E.short||!PROC_SHORT_PARTS.has(E.short)))bad(`${biome}/${body} boss missing short-name lookup metadata`);
  if(body==="undead"&&/Construct/.test(E.name))bad(`${biome} skeleton named Construct: ${E.name}`);
  if(["humanoid","elemental"].includes(body)&&/\b(Lynx|Hound)\b/.test(E.name))bad(`${biome} ${body} named as an animal: ${E.name}`);
}
console.log(`name-check: ${count} seeded biome/body name samples, ${fail} problem(s)`);process.exit(fail?1:0);
