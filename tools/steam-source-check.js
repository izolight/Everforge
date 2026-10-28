#!/usr/bin/env node
// The cursed altar can return Steam without an enemy affix or added loot.
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
(async()=>{
  const browser=await chromium.launch(),page=await browser.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));await page.goto(URL);
  const r=await page.evaluate(()=>{
    S=freshState();S.zone="woods";S.hp=pstats().maxHp;
    const before=S.hp,ev={rv:[.9,0,0,0,.2],a:1,b:2};
    ENC.altar.pick("small",ev);
    return{source:ALTAR_ESS.includes("Steam"),hpLost:before-S.hp,loot:S.event.loot.map(essTrait)};
  });
  if(!r.source||r.hpLost!==1||r.loot.length!==1||r.loot[0]!=="Steam"||errors.length){
    console.error("FAIL Steam altar source",JSON.stringify({r,errors}));process.exitCode=1;
  }else console.log("STEAM SOURCE CHECK OK: the existing cursed altar can exchange 1 HP for one Steam essence; no reward quantity was added");
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
