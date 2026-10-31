#!/usr/bin/env node
// Regression for the --packs smart-policy dispatch used by fresh and economy expeditions.
// Uses the simulator's exported setup function and instruments the real fight policies.
const assert=require("assert"),path=require("path"),{chromium}=require("playwright"),{setup,STARTER}=require("./sim.js");
const URL="file://"+path.resolve(__dirname,"..","index.html");

(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage();await page.goto(URL);await page.waitForFunction(()=>typeof S==="object"&&S);
    const run=async(packs,mode)=>{
      await page.evaluate(setup,{biomeMods:true,depthMods:true,packs,visitLimit:8});
      return page.evaluate(async({mode,starter})=>{
        const calls={packSmart:0,smartPack:0,smartSingle:0,bossPolicy:null};
        const policy=SIM.fightPolicy;
        SIM.fightPolicy=(B,pol)=>{const selected=policy(B,pol);if(selected==="pack-smart")calls.packSmart++;else if(B.foes&&B.foes.length>1)calls.smartPack++;else calls.smartSingle++;if(ENEMIES[B.id]?.boss)calls.bossPolicy=selected;return selected};
        if(mode==="fresh"){
          SIM.fresh(3,"smart",7,starter,"cheapest");
        }else{
          const kit=SIM.build(starter,"woods",0,-1,0);
          for(let seed=1;seed<=3;seed++)SIM.exped(kit.snap,"woods",0,"smart","sim05-pack-econ-"+seed,seed);
        }
        const bossKit=SIM.build(starter,"woods",0,-1,0);S=JSON.parse(bossKit.snap);S.zone="woods";startBattle(ZONES[0][2],{row:0,afx:[],biomeMods:true,depthMods:true});SIM.fightTurn(S.battle,"smart");
        return calls;
      },{mode,starter:STARTER});
    };
    const fresh=await run(true,"fresh"),economy=await run(true,"economy"),single=await run(false,"fresh");
    assert(fresh.packSmart>0,"fresh packs did not dispatch any real multi-foe fights to pack-smart");
    assert(economy.packSmart>0,"economy packs did not dispatch any real multi-foe fights to pack-smart");
    assert(fresh.smartSingle>0&&economy.smartSingle>0,"real single-foe encounters did not retain the regular smart policy");
    assert.equal(fresh.bossPolicy,"smart","fresh-mode lair boss did not retain regular smart policy");
    assert.equal(economy.bossPolicy,"smart","economy-mode lair boss did not retain regular smart policy");
    assert.equal(single.packSmart,0,"no-packs default unexpectedly dispatched pack-smart");
    assert.equal(single.smartPack,0,"no-packs default created a multi-foe encounter");
    assert.equal(single.bossPolicy,"smart","no-packs lair boss did not retain regular smart policy");
    console.log("SIM pack economy dispatch OK:",JSON.stringify({fresh,economy,noPacks:single}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
