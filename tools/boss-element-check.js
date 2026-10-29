#!/usr/bin/env node
// Exercise every added elemental boss form in the real battle flow, then verify
// an active second form survives a real saved-page reload.
const {chromium}=require("playwright"),path=require("path"),assert=require("assert");
const URL="file://"+path.resolve(__dirname,"..","index.html");
const cases=[
  {id:"gnarlhorn",el:"stone",label:"STONEHEART"},
  {id:"rimeclaw",el:"shadow",label:"ECLIPSE HOWL"},
  {id:"phoenix",el:"holy",label:"DAWNSPARK"},
  {id:"archon",el:"arcane",label:"ASTRAL CONVERGENCE"},
  {id:"fen_matriarch",el:"metal",label:"IRON ROOTS"}
];
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(URL);
    const forms=await page.evaluate(cases=>{
      window.makeFresh=id=>{
        S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
        S.unlocked=ZONES.map(z=>z[0]);S.zone=ENEMIES[id].zone;S.hp=9999;
        S.maps[S.zone]=genMap({zone:S.zone,heat:0});
        startBattle(id,{rar:"normal",afx:[]});
        if(!S.battle)throw Error("Battle did not start: "+id);
        S.hp=9999;return S.battle;
      };
      const rows=[];
      for(const c of cases){
        const E=ENEMIES[c.id],B=makeFresh(c.id);
        if(!E.boss||!E.phase)throw Error("Missing authored boss phase: "+c.id);
        B.hp=Math.floor(B.max*E.phase.at);enemyTurn();
        const phaseLog=B.log.map(x=>x.t);B.atk=0;B.turn=B.spEvery;enemyTurn();
        const active=foeOf(B).sp;rows.push({id:c.id,zone:E.zone,first:E.el,phase:B.phased,el:B.el,label:E.phase.label,
          expected:c.el,log:phaseLog,specialUsed:B.log.some(x=>x.t.includes(active.name)),spName:active?.name,spKind:active?.kind,
          learned:cx(c.id).ph,weak:[...B.weak],resist:[...B.resist]});
      }
      const poison=makeFresh("fen_matriarch");
      return {rows,poisonFirst:{zone:ENEMIES.fen_matriarch.zone,el:poison.el},zones:ZONES.map(z=>[z[0],z[2]])};
    },cases);
    assert.deepStrictEqual(forms.rows.map(x=>x.id),cases.map(x=>x.id));
    assert(forms.rows.every((x,i)=>x.zone&&x.first&&x.phase&&x.el===cases[i].el&&x.label===cases[i].label&&x.learned&&x.spName&&x.specialUsed&&x.weak.length&&x.resist.length),"Each playable phase must transition, execute its new special, and record the phase in Codex");
    assert.strictEqual(forms.poisonFirst.el,"poison","Fen Matriarch first form covers Poison");
    assert(cases.every(c=>forms.zones.some(z=>z[1]===c.id)),"Every added phase belongs to an authored, playable region boss");

    const saved=await page.evaluate(()=>{
      makeFresh("rimeclaw");const B=S.battle;B.hp=Math.floor(B.max*ENEMIES.rimeclaw.phase.at);enemyTurn();
      B.opening=0;S.onboarding=null;render();const result={phased:B.phased,el:B.el,codex:cx(B.id).ph};save();return result;
    });
    for(let i=0;i<8;i++){const gotIt=page.getByRole("button",{name:"Got it"});if(!await gotIt.count())break;await gotIt.click()}
    await page.screenshot({path:path.join(__dirname,"..","rift-evidence","m07-boss-phase-mobile.png"),fullPage:true});
    await page.reload();await page.waitForFunction(()=>typeof S==="object"&&S);
    const restored=await page.evaluate(()=>({id:S.battle?.id,phased:S.battle?.phased,el:S.battle?.el,codex:cx("rimeclaw").ph}));
    assert.deepStrictEqual(saved,{phased:true,el:"shadow",codex:true});
    assert.deepStrictEqual(restored,{id:"rimeclaw",phased:true,el:"shadow",codex:true},"Saved boss phase and learned Codex fact survive reload");
    assert.deepStrictEqual(errors,[]);
    console.log("Boss element check OK",JSON.stringify({forms:forms.rows.map(({id,zone,first,el,label,spName,spKind})=>({id,zone,first,phase:el,label,spName,spKind})),poison:forms.poisonFirst.el,saved,restored}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
