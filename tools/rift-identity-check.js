// Rift-only biome identity coverage: element weighting, favored drops, signature
// inflictions and deterministic generation across Rift depths.
// Usage: node tools/rift-identity-check.js (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));await p.goto(URL);await p.waitForFunction(()=>typeof S==="object"&&S);
    const r=await p.evaluate(()=>{
      const expected={fen:{el:"poison",drop:"witchwood",status:"poison",trait:"Mire Venom"},ash:{el:"fire",drop:"storm_feather",status:"burn",trait:"Cinder Brand"},bone:{el:"shadow",drop:"void_crystal",status:"curse",trait:"Grave Curse"},deep:{el:"ice",drop:"holy_water",status:"chill",trait:"Undertow Chill"}};
      let pools=true,oneDraw=true,distribution=true,drops=true,deterministic=true,depthCoverage=true,traits=true,masters=true;
      const ratios={},fixtures={};
      for(const [biome,want] of Object.entries(expected)){
        const B=BIOMES[biome],id=RIFT_IDENTITY[biome];
        pools=pools&&id?.el===want.el&&B.els.includes(want.el)&&id.drop===want.drop&&GEN_DROP.rift[id.el]?.includes(id.drop)&&id.inf?.s===want.status&&id.trait===want.trait;
        let calls=0,seed=0x5a17;
        const R=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
        for(let i=0;i<10000;i++)biomeElement(RIFT_ZONE,biome,B,R);
        ratios[biome]=calls/10000;oneDraw=oneDraw&&calls===10000;
        // The signature element receives two of five slots in these four-biome pools.
        let favored=0;seed=0x5a17;for(let i=0;i<10000;i++)if(biomeElement(RIFT_ZONE,biome,B,()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296})===want.el)favored++;
        ratios[biome]=favored/10000;distribution=distribution&&favored/10000>.36&&favored/10000<.44;
        // First choose the favored item, then provide the probability roll; no extra draws are added.
        const list=GEN_DROP.rift[want.el],idx=list.indexOf(want.drop);let dc=0;
        const rolled=genDrops(RIFT_ZONE,want.el,()=>[0,(idx+.01)/list.length,.99][dc++]??.5,biome);
        const favoredDrop=rolled.find(([item])=>item===want.drop);
        drops=drops&&dc===3&&favoredDrop?.[1]===.9;
        const depthRows=[];
        for(const depth of [1,3,9]){
          let found=null;
          for(let seed=1;seed<=256&&!found;seed++){
            const region=riftMake(seed,depth);if(region.biome===biome)found={seed,region};
          }
          if(!found){depthCoverage=false;continue}
          const first=[...Array.from({length:RIFT_N},(_,i)=>ENEMIES["w_rift_"+i]),ENEMIES.rift_boss].map(e=>JSON.stringify(e));
          const repeat=riftMake(found.seed,depth),second=[...Array.from({length:RIFT_N},(_,i)=>ENEMIES["w_rift_"+i]),ENEMIES.rift_boss].map(e=>JSON.stringify(e));
          const foes=[...Array.from({length:RIFT_N},(_,i)=>ENEMIES["w_rift_"+i]),ENEMIES.rift_boss];
          deterministic=deterministic&&repeat.biome===biome&&JSON.stringify(first)===JSON.stringify(second);
          traits=traits&&foes.every(e=>e.biomeTrait===want.trait&&e.inf?.s===want.status&&e.inf?.ch===.25);
          masters=masters&&foes.at(-1).afx?.length===3&&GEN_SP.some(sp=>sp.name===foes.at(-1).sp?.name);
          depthRows.push({depth,seed:found.seed,foes:foes.length,master:foes.at(-1).sp.name});
        }
        fixtures[biome]=depthRows;
      }
      return{pools,oneDraw,distribution,ratios,drops,deterministic,depthCoverage,traits,masters,fixtures};
    });
    ok(r.pools,"each Rift-only biome has a valid element, existing favored drop, status and signature trait");
    ok(r.oneDraw&&r.distribution,"signature element weighting averages 2:1 and consumes one existing RNG draw");
    ok(r.drops,"favored material chance receives the capped +0.12 bias with the original three draws");
    ok(r.depthCoverage&&r.deterministic,"fen, ash, bone and deep rosters reproduce at depths 1, 3 and 9");
    ok(r.traits,"all generated Rift foes and masters carry the biome signature infliction at every sampled depth");
    ok(r.masters,"Rift masters retain the three-affix M-11 profile and shared special pool");
    console.log("Rift identity fixtures",JSON.stringify(r.fixtures));
    ok(errs.length===0,"no browser errors ("+errs.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("RIFT IDENTITY CHECK OK");
})().catch(e=>{console.error(e);process.exit(1)});
