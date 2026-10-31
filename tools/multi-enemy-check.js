#!/usr/bin/env node
// V-18 production pack entry, target UI, save normalization, turn order, AoE, and one-payout regression.
const assert=require("assert"),fs=require("fs"),path=require("path");
const {chromium}=require("playwright");
const URL="file://"+path.resolve(__dirname,"..","index.html");
const SHOT=path.resolve(__dirname,"../combat-evidence/v18-pack-mobile.png");
const MAPSHOT=path.resolve(__dirname,"../combat-evidence/v18-pack-map-mobile.png");

(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",e=>errors.push(e.stack||e.message));
    await page.addInitScript(()=>{localStorage.setItem("everforge-lang","en");localStorage.removeItem("everforge-daily")});
    await page.goto(URL);
    const result=await page.evaluate(()=>{
      LANG="en";
      const fail=s=>{throw new Error(s)},zones={};
      const reset=zone=>{S=freshState();S.zone=zone;S.view="battle";S.hp=20000;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>{if(u.i)S.seen["i:"+u.id]=true});Object.keys(ABILITIES).forEach(k=>S.seen["a:"+k]=true);S.battle=null;S.event=null};
      const enterOne=(zone,m)=>{S.zone=zone;S.run=null;S.maps[zone]=m||newMap(zone);const map=S.maps[zone],node=map.pois.find(p=>p.t==="fight"&&!p.done&&!ENEMIES[p.e]?.boss);if(!node)fail(`no regular map encounter in ${zone}`);const spec=ensurePackSpec(node,map),again=ensurePackSpec(node,map);if(JSON.stringify(spec)!==JSON.stringify(again))fail(`${zone} pack spec changed on repeat`);enter(node);if(!S.battle?.foes||S.battle.foes.length<2||S.battle.foes.length>3)fail(`${zone} map entry did not start a 2–3 foe pack`);zones[zone]={size:S.battle.foes.length,ids:S.battle.foes.map(f=>f.id),roles:S.battle.foes.map(f=>f.role),factions:S.battle.foes.map(f=>f.faction)};return JSON.parse(JSON.stringify(S.battle))};

      reset("woods");
      const normal=enterOne("woods");
      const node=S.maps.woods.pois.find(p=>p.t==="fight");node.done=false;S.maps.woods.sn.fill(1);S.maps.woods.tmax=S.maps.woods.torch=999;S.maps.woods.pos={x:node.x,y:node.y};reveal(S.maps.woods);S.battle=null;render();
      if(!document.querySelector(".pack-badge"))fail(`map does not disclose visible pack size (node ${node.e||"?"}, count ${packSizeAt(node,S.maps.woods)}, text ${document.querySelector("#arena")?.textContent.slice(0,100)})`);
      enter(node);render();
      const entries=[...document.querySelectorAll(".pack-target")];if(entries.length!==normal.foes.length)fail("target controls do not include every pack member");
      entries[1].click();if(S.battle.id!==normal.foes[1].id)fail("target click did not change the active foe");
      const target=S.battle.target;storeFoe(S.battle);const savedMapIndex=S.battle.pi,stored=JSON.parse(JSON.stringify(S));S=loadSave(stored);if(!S?.battle?.foes||S.battle.target!==target||S.battle.id!==target||!S.maps.woods.pois[savedMapIndex]?.packState)fail("save/reload lost pack members, active target, or map node state");
      const legacy=JSON.parse(JSON.stringify(stored));delete legacy.battle.foes;delete legacy.battle.target;delete legacy.maps.woods.pois[savedMapIndex].packState;const migrated=loadSave(legacy);if(!migrated?.battle?.foes||migrated.battle.foes.length!==1||migrated.battle.id!==target)fail("legacy single-foe save was not normalized");S=loadSave(stored);
      const resumeNode=S.maps.woods.pois[savedMapIndex],resumeHp=S.battle.foes.map(f=>f.hp);resumeNode.done=false;enter(resumeNode);if(S.battle.target!==target||S.battle.foes.some((f,i)=>f.hp!==resumeHp[i]))fail("re-entering a saved map node did not restore pack wounds and target");render();
      const B=S.battle;B.foes.forEach(f=>{f.spEvery=99;f.atk=1;f.open=true});B.guard=true;B.off=1;B.cd={warstaff:2};B.turn=1;const oldRandom=Math.random;Math.random=()=>.99;enemyTurn();Math.random=oldRandom;
      if(B.over||B.turn!==2||B.foes.some(f=>f.turn!==2||f.open)||B.guard||B.off!==0||B.cd.warstaff!==1)fail("pack actors did not take one ordered shared round or reset per-foe/global turn state: "+JSON.stringify({over:B.over,turn:B.turn,foes:B.foes.map(f=>({turn:f.turn,open:f.open})),guard:B.guard,off:B.off,cd:B.cd}));

      // The Warstaff Sweep uses the live target list and hits each surviving member once.
      S.items.iron_sword={...S.items.iron_sword,form:"warstaff"};S.inv.iron_sword=1;S.eq.main="iron_sword";S.unl.ability=1;
      B.foes.forEach(f=>{f.hp=f.max=100000;f.alive=true});B.over=null;B._resolved=false;B.cd={};B.stun=0;const before=B.foes.map(f=>f.hp);ability("warstaff");
      if(B.foes.some((f,i)=>f.hp>=before[i]))fail("Warstaff pack sweep did not hit every living foe");

      // Deaths resolve per member; only the last one pays out and increments the expedition win.
      const againMembers=[{id:"sprite",slot:0,variantSeed:101},{id:"boar",slot:1,variantSeed:202}];startBattle("sprite",{packMembers:againMembers,rar:"normal",afx:[],rng:()=>.5,biomeMods:false,depthMods:false});
      const pack=S.battle,wins=S.wins||0;PACKS.selectTarget(pack,pack.foes[0].id);pack.hp=0;enemyDown();
      if(pack.over||PACKS.living(pack).length!==1||(S.wins||0)!==wins)fail("first member death prematurely resolved the pack/reward");
      const last=PACKS.living(pack)[0];PACKS.selectTarget(pack,last.id);pack.hp=0;enemyDown();
      if(pack.over!=="won"||(S.wins||0)!==wins+1)fail("final member did not resolve exactly one pack victory");

      // The same shared encounter policy carries elite metadata into production companions.
      reset("woods");S.zone="woods";S.maps.woods=genMap({seed:141,zone:"woods"});{const em=S.maps.woods,en=em.pois.find(p=>p.t==="fight"&&!p.done);en.t="elite";const es=ensurePackSpec(en,em);enter(en);if(!es.elite||S.battle.foes.slice(1).some(f=>!f.afx||!f.afx.length))fail("elite map pack did not pass elite policy to companions");zones.elite={size:S.battle.foes.length,elite:es.elite,affixed:S.battle.foes.slice(1).every(f=>f.afx.length>0)}}

      // Daily entry uses the same production map resolver and deterministic node specification.
      reset("woods");S.zone="woods";S.daily=null;S.run=null;localStorage.removeItem("everforge-daily");startDaily();
      if(S.run!=="daily"||!S.daily?.map)fail("daily fixture did not start");
      {const dm=S.daily.map,dn=dm.pois.find(p=>p.t==="fight"&&!p.done);if(!dn)fail("daily map has no regular fight");const ds=ensurePackSpec(dn,dm);enter(dn);if(!S.battle?.foes||S.battle.foes.length<2||S.battle.foes.length>3)fail("daily map did not start a pack");zones.daily={zone:S.daily.zone,size:S.battle.foes.length,ids:S.battle.foes.map(f=>f.id),roles:S.battle.foes.map(f=>f.role),seed:ds.seed}}

      // Rift entry uses the seeded generated roster, including V-20 Water/Steam-compatible pools.
      reset(RIFT_ZONE);S.rift={seed:37,depth:1,best:1,cleared:0};riftEnsure();S.maps[RIFT_ZONE]=newMap(RIFT_ZONE);
      const rift=enterOne(RIFT_ZONE,S.maps[RIFT_ZONE]);zones.rift={size:rift.foes.length,ids:rift.foes.map(f=>f.id),roles:rift.foes.map(f=>f.role)};
      S.rift.depth=9;S.maps[RIFT_ZONE]=newMap(RIFT_ZONE);const deepNode=S.maps[RIFT_ZONE].pois.find(p=>p.t==="fight"&&!p.done&&!ENEMIES[p.e]?.boss);if(!deepNode||packSizeAt(deepNode,S.maps[RIFT_ZONE])!==2)fail("deep Rift encounter did not use the two-member pressure cap");
      reset("woods");S.onboarding=null;startBattle("sprite",{packMembers:[{id:"sprite",slot:0,variantSeed:11},{id:"boar",slot:1,variantSeed:22},{id:"ghoul",slot:2,variantSeed:33}],rar:"normal",afx:[],rng:()=>.5,biomeMods:false,depthMods:false});render();document.querySelectorAll("#toast,.toast").forEach(el=>el.style.visibility="hidden");
        const packNow=S.battle,retained=packNow.foes[1].id;packNow.target=retained;packNow.foes.forEach(f=>f.stun=1);enemyTurn();if(packNow.target!==retained)fail("the player-selected target changed after the enemy phase");const first=packNow.foes[0],others=packNow.foes.slice(1).map(f=>f.id);packNow.target=first.id;packNow.hp=1;packNow.burn={d:5,t:1};packNow.poison=9;packNow.bleed={d:9,n:1,t:1};enemyTurn();if(first.alive||first.hp>0)fail("lethal burn did not remove its pack member: "+JSON.stringify({id:first.id,hp:first.hp,alive:first.alive,foes:packNow.foes.map(f=>({id:f.id,hp:f.hp,alive:f.alive,burn:f.burn,poison:f.poison,bleed:f.bleed})),over:packNow.over,target:packNow.target}));if(others.some(id=>{const f=packNow.foes.find(x=>x.id===id);return f.poison||f.bleed}))fail("a dead member's poison or bleed tick leaked onto another pack member");
        const p0=packNow.foes[0],p1=packNow.foes[1],sp0=ENEMIES[p0.id].sp,sp1=ENEMIES[p1.id].sp;ENEMIES[p0.id].sp={name:"Test ward",tell:"test ward",kind:"guard",every:1,ward:.3,turns:2};ENEMIES[p1.id].sp={name:"Test ward",tell:"test ward",kind:"guard",every:1,ward:.3,turns:2};p0.alive=p1.alive=true;p0.hp=p0.max;p1.hp=p1.max;p0.spEvery=p1.spEvery=1;p0.frozen=true;p0.stun=0;p1.frozen=false;p1.stun=0;packNow.turn=Math.max(1,packNow.turn);packNow.target=p0.id;packNow.parry=true;const packRandomBefore=Math.random,parries=S.stats.parries||0;Math.random=()=>0;enemyTurn();Math.random=packRandomBefore;if(p0.frozen||packNow._parryTarget!==p1.id||p1.spWard||S.stats.parries!==parries+1)fail("frozen-slot parry forecast failed "+JSON.stringify({p0:{id:p0.id,frozen:p0.frozen,stun:p0.stun},p1:{id:p1.id,ward:p1.spWard,turn:p1.turn,spEvery:p1.spEvery},target:packNow._parryTarget,parries:S.stats.parries,before:parries,queue:packTurnForecast(packNow)}));
        ENEMIES[p0.id].sp=sp0;ENEMIES[p1.id].sp=sp1;
        return{zones,roundTurn:B.turn,roundFoes:B.foes.length,dotDeath:true,targetStable:true,parryForecast:true,rngDraws:"pack resolver uses a node-derived private seed"};
    });
    assert.deepStrictEqual(errors,[]);
    const saveGeneratedPack=async(zone)=>{
      const saved=await page.evaluate(zone=>{
        S=freshState();S.onboarding=null;S.zone=zone;S.wins=23;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
        if(zone===RIFT_ZONE){S.rift={seed:37,depth:3,best:3,cleared:0};riftEnsure()}
        const ids=Object.keys(ENEMIES).filter(id=>id.startsWith(zone===RIFT_ZONE?"w_rift_":"w_")&&ENEMIES[id].zone===zone&&!ENEMIES[id].boss).slice(0,2);if(ids.length!==2)throw Error("missing generated pack roster for "+zone);
        startBattle(ids[0],{rar:"normal",afx:[],packMembers:ids.map((id,slot)=>({id,slot,variantSeed:PACKS.hash32(zone+":"+id)})),rng:()=>.5,biomeMods:false,depthMods:false});
        const B=S.battle,[f0,f1]=B.foes;f0.afx=["frenzy","ward"];f1.afx=["frenzy","ward"];f0.a0=f0.atk=47;f1.a0=f1.atk=29;f0.max=120;f1.max=90;f0.hp=Math.max(1,Math.floor(f0.max*AFX_T.frenzy.at*.5));f1.hp=Math.max(1,Math.floor(f1.max*AFX_T.frenzy.at*.5));f0.fz=f1.fz=0;B.target=f0.id;frenzy(B);B.target=f1.id;frenzy(B);if(!f0.fz||!f1.fz||f0.atk===f1.atk)throw Error("frenzy state was not isolated by target");
        f0.wm=17;f0.wd=1;f0.wb=null;B.target=f0.id;wardCut(B,2);const brokenAt=f0.wb;if(f0.wd!==0||brokenAt==null)throw Error("ward break state was not stored on its foe");f1.wm=29;f1.wd=4;f1.wb=null;
        B.target=f1.id;f1.split=0;f1.afx.push("split");const before={fz:f0.fz,wm:f0.wm,wd:f0.wd,wb:f0.wb,atk:f0.atk,a0:f0.a0};B.target=f1.id;splitFoe(B,ENEMIES[f1.id],true);if(!f1.split||f0.fz!==before.fz||f0.wm!==before.wm||f0.wd!==before.wd||f0.wb!==before.wb||f0.atk!==before.atk||f0.a0!==before.a0)throw Error("split state leaked across pack members");
        B.target=f0.id;save();return{ids,target:B.target,wins:S.wins,fields:{fz:f0.fz,atk:f0.atk,a0:f0.a0,wm:f0.wm,wd:f0.wd,wb:f0.wb,otherFz:f1.fz,otherWm:f1.wm,split:f1.split}};
      },zone);
      await page.reload();
      const loaded=await page.evaluate(()=>({ok:!!S.battle&&PACKS.validateCatalog(S.battle,ENEMIES),ids:S.battle?.foes.map(f=>f.id),target:S.battle?.target,wins:S.wins,fields:S.battle&&{fz:S.battle.foes[0].fz,atk:S.battle.foes[0].atk,a0:S.battle.foes[0].a0,wm:S.battle.foes[0].wm,wd:S.battle.foes[0].wd,wb:S.battle.foes[0].wb,otherFz:S.battle.foes[1].fz,otherWm:S.battle.foes[1].wm,split:S.battle.foes[1].split}}));
      if(!loaded.ok||JSON.stringify(loaded.ids)!==JSON.stringify(saved.ids)||loaded.target!==saved.target||loaded.wins!==saved.wins||JSON.stringify(loaded.fields)!==JSON.stringify(saved.fields))throw Error("active generated "+zone+" pack failed real save/reload: "+JSON.stringify({saved,loaded}));
      const ward=await page.evaluate(()=>{const B=S.battle,f=B.foes[0],other=B.foes[1];B.target=f.id;B.turn=f.wb+AFX_T.ward.every;afxTick(B);return{wd:f.wd,wm:f.wm,wb:f.wb,otherWd:other.wd,otherWm:other.wm}});if(ward.wd!==ward.wm||ward.wb!==null||ward.otherWd===ward.wm)throw Error("ward did not independently regenerate after its saved break: "+JSON.stringify(ward));
      return{...saved,wardRegenerated:ward};
    };
    const regionalReload=await saveGeneratedPack("woods"),riftReload=await saveGeneratedPack("rift");
    const rewardOrder=await page.evaluate(()=>{
      const ids=Object.keys(ENEMIES).filter(id=>id.startsWith("w_woods_")&&!ENEMIES[id].boss).slice(0,2),leader=ids[0];if(ids.length!==2)throw Error("missing reward-order fixture foes");
      const run=order=>{S=freshState();S.zone="woods";S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));S.stats.elites=0;startBattle(leader,{rar:"normal",afx:[],packMembers:ids.map((id,slot)=>({id,slot,variantSeed:slot+41})),rng:()=>.5,biomeMods:false,depthMods:false});const B=S.battle;B.foes[0].rar="normal";B.foes[0].intr=false;B.foes[0].afx=["ward"];B.foes[1].rar="rare";B.foes[1].intr=false;B.foes[1].afx=["frenzy"];const owners=[],oldLearn=learn,oldRandom=Math.random;window.learn=(id,type,val)=>{if(type==="drops")owners.push(id);return oldLearn(id,type,val)};Math.random=()=>0;for(const id of order){B.target=id;B.hp=0;enemyDown()}Math.random=oldRandom;window.learn=oldLearn;return{emb:B.emb,loot:B.loot,wins:S.wins,elites:S.stats.elites,kills:ids.map(id=>S.kills[id]||0),leader:ids[0],owners}};
      const a=run(ids),b=run([ids[1],ids[0]]);if(a.emb!==b.emb||JSON.stringify(a.loot)!==JSON.stringify(b.loot)||a.wins!==1||b.wins!==1||a.elites!==2||b.elites!==2||a.kills.some(x=>x!==1)||b.kills.some(x=>x!==1)||a.owners.some(id=>id!==a.leader)||b.owners.some(id=>id!==b.leader))throw Error("pack payout depended on kill order or double-counted affixes: "+JSON.stringify({a,b}));
      const scaled=scalePackCompanion({max:100,hp:100,atk:40,a0:40},1);if(scaled.atk!==scaled.a0)throw Error("companion frenzy base attack was not scaled with attack");return{embers:a.emb,loot:a.loot,affixElites:a.elites,kills:a.kills,dropOwner:a.leader,scaledAtk:scaled.atk,scaledA0:scaled.a0};
    });
    await page.evaluate(()=>{S=freshState();S.zone="woods";S.wins=79;const ids=Object.keys(ENEMIES).filter(id=>id.startsWith("w_woods_")&&!ENEMIES[id].boss).slice(0,2);startBattle(ids[0],{rar:"normal",afx:[],packMembers:ids.map((id,slot)=>({id,slot,variantSeed:slot+91})),rng:()=>.5,biomeMods:false,depthMods:false});S.wins=79;save()});
    await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem(KEY));raw.wins=79;raw.battle.foes[1].id="removed_enemy";localStorage.setItem(KEY,JSON.stringify(raw))});await page.reload();
    const recovered=await page.evaluate(()=>({battle:S.battle,wins:S.wins}));if(recovered.battle!==null||recovered.wins!==79)throw Error("unknown generated-pack member was not safely recovered with progression: "+JSON.stringify(recovered));assert.deepStrictEqual(errors,[]);
    await page.evaluate(()=>{S=freshState();S.zone="woods";S.view="battle";S.onboarding=null;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>{if(u.i)S.seen["i:"+u.id]=true});Object.keys(ABILITIES).forEach(k=>S.seen["a:"+k]=true);const ids=["sprite","boar"];startBattle(ids[0],{rar:"normal",afx:[],packMembers:ids.map((id,slot)=>({id,slot,variantSeed:slot+31})),rng:()=>.5,biomeMods:false,depthMods:false});const B=S.battle;B.foes.forEach(f=>{f.hp=f.max=100;f.spEvery=1});B.turn=1;B.target=B.foes[1].id;render();const el=document.querySelector("#intro");if(el){el.hidden=true;el.style.display="none"}document.querySelectorAll("#toast,.toast").forEach(x=>x.style.visibility="hidden")});
    await page.screenshot({path:SHOT,fullPage:true});
    await page.evaluate(()=>{S=freshState();S.zone="woods";S.view="battle";S.onboarding=null;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>{if(u.i)S.seen["i:"+u.id]=true});Object.keys(ABILITIES).forEach(k=>S.seen["a:"+k]=true);S.maps.woods=genMap({seed:PACKS.hash32("v18-pack-map-mobile"),zone:"woods"});const m=S.maps.woods,n=m.pois.find(p=>p.t==="fight"&&!p.done),step=DIRS.find(([x,y])=>walk(m,n.x+x,n.y+y));m.pos={x:n.x+step[0],y:n.y+step[1]};m.sn.fill(1);m.torch=m.tmax=99;reveal(m);packSizeAt(n,m);S.battle=null;S.event=null;render();document.querySelectorAll("#toast,.toast").forEach(el=>el.style.visibility="hidden")});
    await page.evaluate(()=>{const el=document.querySelector("#intro");if(el){el.hidden=true;el.style.display="none"}document.querySelectorAll("#toast,.toast").forEach(x=>x.style.visibility="hidden")});
    await page.screenshot({path:MAPSHOT,fullPage:true});
    console.log("Multi-enemy browser check OK:",JSON.stringify({...result,targetStable:true,parryForecast:true,regionalReload,riftReload,rewardOrder,unknownIdRecovery:recovered.wins}));
    console.log("Mobile screenshots:",SHOT,MAPSHOT);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
