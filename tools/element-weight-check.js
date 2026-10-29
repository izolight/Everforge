#!/usr/bin/env node
// V-13 weighted biome element distribution, RNG budget, and seeded roster checks.
// Usage: node tools/element-weight-check.js
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.stack||e.message));await page.goto(URL);await page.waitForFunction(()=>typeof BIOMES==="object"&&typeof biomeElement==="function");
    const r=await page.evaluate(()=>{
      const rows={},identity={fen:"poison",ash:"fire",bone:"shadow",deep:"ice"};let oneDraw=true,weighted=true,stable=true,dailyStable=true;
      for(const [bi,B] of Object.entries(BIOMES)){
        let seed=0x51313,calls=0;const R=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
        const counts={};for(let i=0;i<20000;i++){const el=biomeElement("rift",bi,B,R);counts[el]=(counts[el]||0)+1}
        oneDraw=oneDraw&&calls===20000;
        const favored=identity[bi];if(favored){const p=counts[favored]/20000;weighted=weighted&&p>.375&&p<.425}
        else {const common=Object.entries(B.elW).filter(([,w])=>w===3).map(([el])=>el),rare=Object.entries(B.elW).filter(([,w])=>w===1).map(([el])=>el),commonN=common.reduce((n,el)=>n+(counts[el]||0),0),rareN=rare.reduce((n,el)=>n+(counts[el]||0),0),expected=common.reduce((n,el)=>n+B.elW[el],0)/Object.values(B.elW).reduce((n,w)=>n+w,0);weighted=weighted&&common.length>0&&rare.length>0&&Math.abs(commonN/20000-expected)<.025&&Math.abs(commonN+rareN-20000)<5}
        rows[bi]={n:20000,counts};
      }
      // Missing elW retains the original uniform fallback; a custom map consumes one draw.
      let calls=0,seed=0x912;const R=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296},plain={els:["a","b","c","d"]};
      const fallback={};for(let i=0;i<12000;i++){const el=biomeElement("authored","unknown",plain,R);fallback[el]=(fallback[el]||0)+1}
      const fallbackUniform=Object.values(fallback).every(n=>n>2750&&n<3250)&&calls===12000;
      const custom={};seed=0x912;calls=0;for(let i=0;i<12000;i++){const el=biomeElement("authored","unknown",plain,R,{a:3,b:3,c:3,d:1});custom[el]=(custom[el]||0)+1}
      const customMix=(custom.a+custom.b+custom.c)/12000>.88&&(custom.a+custom.b+custom.c)/12000<.93&&calls===12000;
      let dropCalls=0;const pick={};biomeElement("authored","forest",BIOMES.forest,()=>{dropCalls++;return .73},BIOMES.forest.elW,pick);
      const dropElementStable=dropCalls===1&&pick.uniform===BIOMES.forest.els[Math.floor(.73*BIOMES.forest.els.length)];
      const date="2026-10-28",dailyPlanBefore=dailyPlan(date),dailyMapBefore=JSON.stringify(genMap({seed:dailyPlanBefore.seed,heat:dailyPlanBefore.heat,zone:dailyPlanBefore.zone,twist:dailyPlanBefore.twist}));let ambientCalls=0,old=Math.random;Math.random=()=>{ambientCalls++;throw Error("ambient RNG used")};
      try{for(const z of Object.keys(ZONE_BIOME)) {const a=JSON.stringify(genRoster(z)),b=JSON.stringify(genRoster(z));stable=stable&&a===b} } finally {Math.random=old}
      const dailyPlanAfter=dailyPlan(date),dailyMapAfter=JSON.stringify(genMap({seed:dailyPlanAfter.seed,heat:dailyPlanAfter.heat,zone:dailyPlanAfter.zone,twist:dailyPlanAfter.twist}));
      dailyStable=JSON.stringify(dailyPlanBefore)===JSON.stringify(dailyPlanAfter)&&dailyMapBefore===dailyMapAfter&&ambientCalls===0;
      return{rows,oneDraw,weighted,fallbackUniform,customMix,dropElementStable,fallback,custom,stable,dailyStable,ambientCalls};
    });
    ok(r.oneDraw,"each weighted or fallback element selection consumes exactly one RNG draw");
    ok(r.weighted,"all biome distributions match common/rare and M-05 signature weights");
    ok(r.fallbackUniform&&r.customMix,"missing elW stays uniform; optional custom elW controls the intended mix");
    ok(r.dropElementStable,"the single roll keeps non-signature drop selection on its pre-V-13 uniform result");
    ok(r.stable&&r.dailyStable,"authored rosters are seed stable and the daily pre-roll is unaffected by ambient RNG");
    console.log("V-13 element sample",JSON.stringify(r.rows));
    ok(errors.length===0,"no browser errors ("+errors.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("V-13 ELEMENT WEIGHT CHECK OK");
})().catch(e=>{console.error(e);process.exit(1)});
