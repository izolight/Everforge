#!/usr/bin/env node
// Focused regression check for the fresh simulator's post-expedition weapon infusion path.
const {chromium}=require("playwright"),path=require("path"),{setup,STARTER}=require("./sim.js");
const URL="file://"+path.resolve(__dirname,"..","index.html");
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage();await page.goto(URL);await page.waitForFunction(()=>typeof S==="object"&&S);
    await page.evaluate(setup,{biomeMods:true,depthMods:true,packs:false,visitLimit:8});
    const report=await page.evaluate(starter=>{
      const ready=JSON.parse(SIM.build(starter,"woods",0,-1,0).snap),weaponId=ready.eq.main,weapon=ready.items[weaponId],realRandom=Math.random;
      const reset=({traits=[],enabled=false,journal=false,weaponEquipped=true}={})=>{
        S=freshState();S.zone="woods";S.xp=XP_LV[4];S.items[weaponId]=weapon;S.inv.iron_sword=0;S.inv[weaponId]=weaponEquipped?1:0;S.eq.main=weaponEquipped?weaponId:null;
        if(journal)S.journal.push({id:"prior-craft",name:"Prior craft"});
        traits.forEach(t=>addItem(essence(t)));
        if(enabled){S.rp=1000;S.techs.weaponcraft=1;S.tpaid.weaponcraft=14;["blade","infuse","infuse2","infuse3"].forEach(learnTech)}
      };
      try{
        reset({traits:["Sharp"]});const gated=SIM.infuseFreshWeapon();
        if(!gated[0]||gated[0].skipped!=="technique-gate"||!gated[0].missing.includes("infuse")||!gated[0].missing.includes("infuse3")||S.inv[essence("Sharp")]!==1||S.eq.main!==weaponId)throw new Error("fresh infusion ignored its actionOk research gates");
        reset({traits:["Sharp","Iron"],enabled:true});Math.random=()=>.999999;const success=SIM.infuseFreshWeapon();
        if(success.length!==2||success.some(x=>x.fizzle)||success[0].weaponBefore!==weaponId||!success[0].weaponAfter||success[0].weaponAfter===weaponId||success[1].weaponBefore!==success[0].weaponAfter||success[1].weaponAfter===success[1].weaponBefore||!S.eq.main||S.inv[essence("Sharp")]||S.inv[essence("Iron")])throw new Error(`fresh infusion did not track successful replacement IDs: ${JSON.stringify({success,main:S.eq.main,sharp:S.inv[essence("Sharp")],iron:S.inv[essence("Iron")],techs:S.techs})}`);
        reset({traits:["Sharp","Iron"],enabled:true,journal:true});Math.random=()=>0;const fizzle=SIM.infuseFreshWeapon();
        if(fizzle.length!==2||!fizzle[0].fizzle||fizzle[1].skipped!=="no-equipped-weapon"||S.eq.main||S.inv[essence("Iron")]!==1)throw new Error("fizzle did not clear the equipped weapon or reused its stale ID");
        reset({enabled:true});const empty=SIM.infuseFreshWeapon();
        if(empty.length)throw new Error("fresh infusion attempted a craft without essences");
        reset({traits:["Sharp"],enabled:true,weaponEquipped:false});const noWeapon=SIM.infuseFreshWeapon();
        if(noWeapon.length!==1||noWeapon[0].skipped!=="no-equipped-weapon"||S.inv[essence("Sharp")]!==1)throw new Error("fresh infusion mishandled an absent equipped weapon");
        return{gated,success,fizzle,empty,noWeapon,starterWeaponId:weaponId,enabledTechs:["infuse","infuse2","infuse3"],smithLevel:level()}
      }finally{Math.random=realRandom}
    },STARTER);
    console.log(JSON.stringify(report,null,2));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
