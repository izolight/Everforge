// Ensures procedural creature nouns fit their body family, for wild and Rift rosters.
// Run: node tools/name-check.js
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,".."),ctx=vm.createContext({console,Math,JSON,parseInt,Set,Map});
for(const f of ["js/art/color.js","js/data.js","js/helpers.js","js/affix.js","js/roles.js","js/monsters.js"])vm.runInContext(fs.readFileSync(path.join(root,f),"utf8"),ctx,{filename:f});
const {BIOMES,GEN_T,rng,hash,genCreature,BODY_NOUNS}=vm.runInContext("({BIOMES,GEN_T,rng,hash,genCreature,BODY_NOUNS})",ctx);
let fail=0,count=0;const bad=m=>{console.log("FAIL "+m);fail++};
const valid=(body,name)=>BODY_NOUNS[body].some(n=>name.endsWith(" "+n));
for(const [biome,B] of Object.entries(BIOMES))for(const body of Object.keys(BODY_NOUNS))for(let boss=0;boss<2;boss++){
  const id=`name_${biome}_${body}_${boss}`,R=rng(hash(id)),pool=B.bodies;B.bodies=[body];const E=genCreature({id,zone:"rift",biome,tier:GEN_T.spire,R,used:new Set(),boss,seed:id});B.bodies=pool;count++;
  if(!valid(body,E.name))bad(`${biome}/${body}${boss?" boss":""} generated incompatible name ${E.name}`);
  if(body==="undead"&&/Construct/.test(E.name))bad(`${biome} skeleton named Construct: ${E.name}`);
  if(["humanoid","elemental"].includes(body)&&/\b(Lynx|Hound)\b/.test(E.name))bad(`${biome} ${body} named as an animal: ${E.name}`);
}
console.log(`name-check: ${count} seeded biome/body name samples, ${fail} problem(s)`);process.exit(fail?1:0);
