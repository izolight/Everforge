#!/usr/bin/env node
// V-20 Water and Steam family support: weighted Rift generation, native matchups,
// elemental affixes, readable marks, translation labels, and unchanged essence drops.
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.stack||e.message));await page.goto(URL);
    await page.waitForFunction(()=>typeof BIOMES==="object"&&typeof genCreature==="function"&&typeof TATS==="object");
    const r=await page.evaluate(()=>{
      const counts={},fits={};let calls=0,weighted=true;
      for(const [bi,el] of [["tidewrack","water"],["geyser","steam"]]){
        const B=BIOMES[bi],weights=B.elW,total=Object.values(weights).reduce((n,w)=>n+w,0);let seed=0x20520;
        const R=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
        const row={};for(let i=0;i<30000;i++){const got=biomeElement("rift",bi,B,R);row[got]=(row[got]||0)+1}
        weighted=weighted&&Object.keys(weights).every(k=>Math.abs((row[k]||0)/30000-weights[k]/total)<.012);
        counts[bi]=row;
        const old=B.els;B.els=[el];
        try{
          const enemy=genCreature({id:`v20_${el}`,zone:"rift",biome:bi,tier:GEN_T.spire,R:rng(hash(`v20_${el}`)),used:new Set(),boss:false,seed:`v20_${el}`});
          fits[el]={el:enemy.el,weak:enemy.weak,resist:enemy.resist,inf:enemy.inf,affix:enemy.afx};
        }finally{B.els=old}
      }
      const drops={water:GEN_DROP.rift.water,steam:GEN_DROP.rift.steam};
      const marks={water:TATS.water(),steam:TATS.steam()};
      const artOK=Object.keys(ELPAL).includes("water")&&Object.keys(ELPAL).includes("steam")&&marks.water.includes(ELPAL.water[0])&&marks.steam.includes(ELPAL.steam[0]);
      const infOK=fits.water.el==="water"&&fits.water.weak.includes("poison")&&fits.water.resist.includes("water")&&fits.water.resist.includes("fire")&&fits.water.inf.s==="chill"&&fits.steam.el==="steam"&&fits.steam.weak.includes("ice")&&fits.steam.resist.includes("steam")&&fits.steam.resist.includes("fire")&&fits.steam.inf.s==="burn";
      const validStatus=Object.values(EL_NAT).filter(x=>x.i).every(x=>!!STATUS[x.i]);
      const noNewEssence=!ESS_POOL.includes("Steam")&&drops.water.every(x=>!/^ess[:_]/i.test(x))&&drops.steam.every(x=>!/^ess[:_]/i.test(x));
      const riftSeeds={};for(let seed=1;seed<=2048&&(!riftSeeds.water||!riftSeeds.steam);seed++){const world=riftMake(hash("sim-rift:"+seed)),elements=Array.from({length:RIFT_N},(_,i)=>ENEMIES[`w_rift_${i}`]?.el);if(world.biome==="tidewrack"&&elements.includes("water")&&!riftSeeds.water)riftSeeds.water=seed;if(world.biome==="geyser"&&elements.includes("steam")&&!riftSeeds.steam)riftSeeds.steam=seed}
      const oldPool=afxPool(null,"still"),waterPool=afxPool(null,"still",false,null,"water"),steamPool=afxPool(null,"still",false,null,"steam");
      const oldAfxOrder=["fire","ice","poison","holy","shadow","iron","swift","arcane"];
      const affixOK=AFX.water?.tr==="Water"&&AFX.steam?.tr==="Steam"&&AFX_EL.slice(0,8).join("|")===oldAfxOrder.join("|")&&AFX_EL.slice(-2).join("|")==="water|steam"&&AFX_ART.water?.tat&&AFX_ART.steam?.tat&&!oldPool.includes("water")&&!oldPool.includes("steam")&&waterPool.includes("water")&&!waterPool.includes("steam")&&steamPool.includes("steam")&&!steamPool.includes("water");
      const affixFightOK=["water","steam"].every(id=>{const E={el:"fire",weak:["water","steam"],resist:["fire"],def:1},B={max:100,hp:100,atk:10,def:1,weak:[...E.weak],resist:[...E.resist]};applyAfx(B,E,"magic",[id]);return B.el===TRAITS[AFX[id].tr].f&&B.resist.includes(B.el)&&!B.weak.includes(B.el)});
      return{counts,calls,weighted,fits,infOK,validStatus,noNewEssence,drops,artOK,affixOK,affixFightOK,riftSeeds,waterFamily:FAM.water,steamFamily:FAM.steam,rosterSize:GEN_N};
    });
    ok(r.rosterSize===12,"authored roster size is unchanged");
    ok(r.weighted&&r.calls===60000,"Water/Steam biome pools follow their 3:1 common/rare weights with one RNG draw per roll");
    ok(r.infOK&&r.validStatus,"generated Water/Steam foes carry coherent weakness, resistance, and supported status profiles");
    ok(r.affixOK,"Water/Steam have elemental affixes without shifting the prior elemental affix index order");
    ok(r.affixFightOK,"elemental affixes set the matching combat family, resistance, and remove self-weakness");
    ok(r.artOK,"Water/Steam family palettes and distinct affix marks render");
    ok(r.noNewEssence,"family promotion adds no Steam essence and no generated foe essence drops");
    ok(r.riftSeeds.water&&r.riftSeeds.steam,"seeded Rift fixtures reach both Tidewrack and Geyser");
    console.log("V-20 weighted sample",JSON.stringify(r.counts));
    console.log("V-20 generated fixtures",JSON.stringify(r.fits));
    console.log("V-20 targeted Rift seeds",JSON.stringify(r.riftSeeds));
    ok(errors.length===0,"no browser errors ("+errors.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("V-20 ELEMENT FAMILY CHECK OK");
})().catch(e=>{console.error(e);process.exit(1)});
