// V-11 biome special pools: coverage, deterministic rosters and translated tells.
// Usage: node tools/biome-special-check.js (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));await p.goto(URL);await p.waitForFunction(()=>typeof S==="object"&&S);
    const r=await p.evaluate(()=>{
      const biomes=Object.keys(BIOMES).sort(),poolKeys=Object.keys(BIOME_SP).sort();
      const complete=biomes.length===poolKeys.length&&biomes.every(b=>BIOME_SP[b]?.length>=2&&BIOME_SP[b].length<=3);
      let draws=0;const chosen=biomeSpecialFor(biomes[0],()=>{draws++;return .5}),fallback=biomeSpecialFor("missing-biome",()=>.5);
      const translationKeys=Object.values(BIOME_SP).flat().flatMap(sp=>[sp.name,sp.tell]);
      const translated=translationKeys.every(k=>DICT.de[k]&&DICT.ko[k]&&DICT.de[k]!==k&&DICT.ko[k]!==k);
      const samples={},stacks=[];let deterministic=true,drawSafe=true,specialOnly=true,masterRare=true,masterPoolFallback=true,allPoolsSeen=true,modifierStacking=true,regionCoverage=true,regionDeterministic=true;
      const pureRift=seed=>{const old=Math.random;Math.random=()=>{throw Error("Rift generator used ambient Math.random")};try{return riftMake(seed,3)}finally{Math.random=old}};
      const pureRoster=zone=>{const old=Math.random;Math.random=()=>{throw Error("Region generator used ambient Math.random")};try{return genRoster(zone)}finally{Math.random=old}};
      const zones=Object.keys(GEN_T).sort();regionCoverage=zones.length===4;
      for(const zone of zones){
        const biome=ZONE_BIOME[zone],pool=BIOME_SP[biome];
        BIOME_SP[biome]=null;const oldRoster=pureRoster(zone);BIOME_SP[biome]=pool;
        const roster=pureRoster(zone),repeat=pureRoster(zone),withoutSp=x=>x.filter(e=>!e.alpha).map(({sp,...fields})=>JSON.stringify(fields));
        regionCoverage=regionCoverage&&roster.length===GEN_N&&roster.every(e=>pool.some(sp=>sp.name===e.sp?.name));
        regionDeterministic=regionDeterministic&&JSON.stringify(roster)===JSON.stringify(repeat);
        specialOnly=specialOnly&&JSON.stringify(withoutSp(oldRoster))===JSON.stringify(withoutSp(roster));
      }
      for(const biome of biomes){
          const wanted=new Set(BIOME_SP[biome].map(sp=>sp.name)),seen=new Set();let fixture=null;
          for(let seed=1;seed<=96;seed++){
            const ids=[...Array.from({length:RIFT_N},(_,i)=>"w_rift_"+i),"rift_boss"],pool=BIOME_SP[biome];
            BIOME_SP[biome]=null;pureRift(seed);const baselineFields=ids.map(id=>{const{sp,...fields}=ENEMIES[id];return JSON.stringify(fields)});BIOME_SP[biome]=pool;
            const a=pureRift(seed);if(a.biome!==biome)continue;
            const first=ids.map(id=>JSON.stringify(ENEMIES[id]));
            const currentFields=ids.map(id=>{const{sp,...fields}=ENEMIES[id];return JSON.stringify(fields)});if(JSON.stringify(baselineFields)!==JSON.stringify(currentFields))specialOnly=false;
            const b=pureRift(seed),second=ids.map(id=>JSON.stringify(ENEMIES[id]));if(JSON.stringify(a)!==JSON.stringify(b)||JSON.stringify(first)!==JSON.stringify(second))deterministic=false;
            const generated=ids.map(id=>ENEMIES[id]);
            if(generated.some(e=>!e))throw Error("Rift roster shape changed");
            if(generated.slice(0,-1).some(e=>!wanted.has(e.sp?.name)))throw Error(`${biome} wild picked a non-signature special`);
            generated.slice(0,-1).forEach(e=>seen.add(e.sp.name));
            const boss=generated.at(-1);if(boss.afx?.length!==3)masterRare=false;if(!GEN_SP.some(sp=>sp.name===boss.sp?.name))masterPoolFallback=false;
            if(!fixture){
              fixture={seed,mod:riftDepthModFor(a.seed,3).id};
              S=freshState();S.zone=RIFT_ZONE;S.rift.seed=seed;S.rift.depth=3;S.rift.biome=biome;startBattle("w_rift_0",{rar:"normal",afx:[]});
              const B=S.battle;stacks.push({biome,want:fixture.mod,gotBiome:B.biome,depth:B.depthMod?.id,biomeMods:B.biomeMods,depthMods:B.depthMods});modifierStacking=modifierStacking&&B.biome===biome&&B.biomeMods!==false&&B.depthMods&&B.depthMod?.id===fixture.mod;
            }
          }
          allPoolsSeen=allPoolsSeen&&[...wanted].every(n=>seen.has(n));samples[biome]=fixture;
        }
      return{biomes,poolKeys,complete,draws,chosen:chosen.name,fallback:fallback.name,genFallback:GEN_SP.some(s=>s.name===fallback.name),translated,translationCount:translationKeys.length,deterministic,drawSafe,specialOnly,masterRare,masterPoolFallback,allPoolsSeen,modifierStacking,regionCoverage,regionDeterministic,samples,stacks};
    });
    ok(r.complete,"each authored biome has two or three signature specials");
    ok(r.draws===1,"selecting a biome special consumes exactly one existing RNG draw");
    ok(r.genFallback,"an unknown biome key falls back to the shared GEN_SP pool");
    ok(r.translated&&r.translationCount===48,"all biome special names and tells have German and Korean translations");
    ok(r.deterministic&&r.drawSafe,"seeded depth-3 Rift rosters reproduce without ambient Math.random");
    ok(r.specialOnly,"biome pools change only the special field; roster fields and draw streams stay fixed");
    ok(r.masterRare,"Rift masters retain their three-rare-affix M-11 profile with biome specials");
    ok(r.masterPoolFallback,"generated Rift masters retain the shared GEN_SP profile");
    ok(r.allPoolsSeen,"every biome's two signature specials appear across deterministic fixtures");
    ok(r.regionCoverage&&r.regionDeterministic,"all four authored GEN_N rosters use their biome pool and reproduce without ambient Math.random");
    ok(r.modifierStacking,"V-15 biome and V-21 depth modifiers remain active together in each Rift biome");
    console.log("biome special fixtures",JSON.stringify(r.samples));
    if(!r.modifierStacking)console.log("modifier stacking details",JSON.stringify(r.stacks));
    ok(errs.length===0,"no browser errors ("+errs.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("V-11 BIOME SPECIAL CHECK OK");
})().catch(e=>{console.error(e);process.exit(1)});
