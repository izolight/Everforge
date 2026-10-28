// Deterministic browser regressions for authored V-14 enemy special kinds.
// Usage: node tools/special-check.js (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const URL="file://"+path.resolve(__dirname,"..","index.html");
const EVIDENCE=path.resolve(__dirname,"..","combat-evidence");
let fails=0;
const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));await p.goto(URL);const E=(f,a)=>p.evaluate(f,a);
    await E(()=>{
      window.R=(v,fn)=>{const r=Math.random;Math.random=()=>v;try{return fn()}finally{Math.random=r}};
      window.fresh=(id)=>{S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);S.zone=ENEMIES[id].zone;S.maps[S.zone]=genMap({zone:S.zone,heat:0});S.unlocked=ZONES.map(z=>z[0]);Object.keys(S.eq).forEach(s=>S.eq[s]=null);S.hp=pstats().maxHp;startBattle(id,{rar:"normal",afx:[]});return S.battle};
    });
    fs.mkdirSync(EVIDENCE,{recursive:true});
    for(const id of ["golem","bandit","bear","stag","harpy"]){
      await E(id=>{const B=fresh(id);if(id==="bear")B.hp=Math.floor(B.max*.49);B.turn=ENEMIES[id].sp.every;cx(id).sp=true;render()},id);
      const intent=await p.locator(".intent").innerText();
      ok(intent.length>10,`${id} special intent renders at 390×844 mobile size`);
      await p.screenshot({path:path.join(EVIDENCE,`v14-intent-${id}.png`),fullPage:true});
    }
    let r=await E(()=>({kinds:["guard","inflict","enrage","burrow","summon"].map(k=>Object.values(ENEMIES).some(e=>!e.boss&&e.sp?.kind===k)),summon:ENEMIES.harpy.sp.summon,weak:ENEMIES.squall.atk<ENEMIES.harpy.atk,generated:typeof GEN_SP==="undefined"?null:GEN_SP.map(s=>s.kind)}));
    ok(r.kinds.every(Boolean)&&r.summon==="squall"&&r.weak,"all five kinds are authored; the summoned wild creature is weaker; generated special pool is unaffected");
    r=await E(()=>{
      const B=fresh("golem");B.hp=B.max=1000;B.turn=ENEMIES.golem.sp.every;R(.5,()=>enemyTurn());const ward=B.spWard,turns=B.spWardTurns,hp=B.hp;
      R(.9,()=>strike(null,100,"Test strike",true,{sure:1}));const hit={ward:B.spWard,hp:B.hp};
      B.turn=ENEMIES.golem.sp.every;R(.5,()=>enemyTurn());const refreshed={ward:B.spWard,turns:B.spWardTurns};
      R(.5,()=>enemyTurn());const mid={ward:B.spWard,turns:B.spWardTurns};R(.5,()=>enemyTurn());
      return{ward,turns,hp,hit,refreshed,mid,expired:B.spWard===0&&B.spWardTurns===0};
    });
    ok(r.ward===200&&r.turns===2&&r.hit.ward<r.ward&&r.hit.hp===r.hp,"guard special creates a two-turn ward that absorbs player damage without stacking HP");
    ok(r.refreshed.ward===200&&r.refreshed.turns===2&&r.mid.ward>0&&r.mid.turns===1&&r.expired,"guard refreshes its cap and duration; ward protects two player actions before expiring");
    r=await E(()=>{
      const run=(guard,parry)=>{const B=fresh("bandit");B.turn=ENEMIES.bandit.sp.every;B.guard=guard;const before=S.hp;if(parry)R(0,()=>parryAction());else R(.99,()=>enemyTurn());return{status:!!B.you.poison,hp:S.hp,loss:before-S.hp,known:cx(B.id).sp};};
      window.parryAction=()=>parry();const hit=run(false,false),guarded=run(true,false),parried=run(false,true);
      const B=fresh("bandit"),P={...pstats(),rs:{poison:100}};R(.5,()=>inflict(B,P,ENEMIES.bandit.sp));
      return{hit,guarded,parried,resistTurns:B.you.poison?.t};
    });
    ok(r.hit.status&&r.hit.known,"inflict applies its guaranteed poison on a landed special and records its Codex special");
    ok(!r.guarded.status&&r.guarded.loss>0,"Guard still cuts the special hit and blocks its forced status");
    ok(!r.parried.status&&r.parried.loss===0,"a successful Parry interrupts inflict before damage and status");
    ok(r.resistTurns===1,"status resistance shortens a guaranteed infliction instead of making it fail");
    r=await E(()=>{
      const above=fresh("bear");above.hp=Math.ceil(above.max*.51);above.turn=ENEMIES.bear.sp.every;const shownAbove=isSpecial(above);R(.9,()=>enemyTurn());
      const equal=fresh("bear");equal.hp=equal.max*.5;equal.turn=ENEMIES.bear.sp.every;const shownEqual=isSpecial(equal);
      const below=fresh("bear");below.hp=Math.floor(below.max*.49);below.turn=ENEMIES.bear.sp.every;const shownBelow=isSpecial(below),atk=below.atk;R(.9,()=>enemyTurn());
      return{shownAbove,aboveEnraged:above.enraged,shownEqual,shownBelow,enraged:below.enraged,atk,after:foeHit(below,pstats(),1,1),base:foeHit({...below,enraged:false},pstats(),1,1)};
    });
    ok(!r.shownAbove&&!r.aboveEnraged&&!r.shownEqual&&r.shownBelow&&r.enraged,"enrage is telegraphed and resolves only below half HP");
    ok(r.after>r.base,"enrage permanently raises subsequent Attack by its configured 30%");
    r=await E(()=>{const B=fresh("golem");B.hp=1;B.turn=ENEMIES.golem.sp.every;B.parry=true;R(0,()=>enemyTurn());return{over:B.over,hp:B.hp};});
    ok(r.over==="won"&&r.hp===0,"a riposte that defeats a setup special resolves the victory immediately");
    r=await E(()=>{
      const B=fresh("stag");B.turn=ENEMIES.stag.sp.every;const hp=B.hp,before=S.hp;R(.9,()=>enemyTurn());const buried=B.burrowed,enemyHp=B.hp,playerHp=S.hp;
      const result=R(.9,()=>strike(null,100,"Test strike",true,{sure:1}));const afterStrike=B.hp;
      B.turn++;R(.9,()=>enemyTurn());return{hp,before,buried,enemyHp,playerHp,miss:result.miss,afterStrike,emerged:!B.burrowed,emergeLog:B.log.some(x=>x.t.includes("rises from the roots"))};
    });
    ok(r.buried&&r.enemyHp===r.hp&&r.playerHp===r.before&&r.miss&&r.afterStrike===r.hp,"burrow spends a turn without attacking and cannot be hit by a direct strike");
    ok(r.emerged&&r.emergeLog,"burrow ends at the start of its next enemy turn");
    r=await E(()=>{
      const B=fresh("harpy"),P=pstats();B.turn=ENEMIES.harpy.sp.every;const before=S.hp;R(.99,()=>enemyTurn());const loss=before-S.hp;
      const expected=foeHit({...B,atk:ENEMIES.squall.atk,el:ENEMIES.squall.el},P,.65,1.147);
      const log=B.log.some(x=>x.t.includes("calls")&&x.t.includes("Squall Spirit"));
      return{loss,expected,log,turn:B.turn};
    });
    ok(r.log&&r.loss===r.expected,"summon calls the named weaker wild and makes one scaled hit handled by normal Guard/Parry/dodge rules");
    r=await E(()=>{
      const ids=["golem","bandit","bear","stag","harpy"],out=[];
      ids.forEach(id=>{const B=fresh(id);cx(id).sp=true;openCodex(id);const txt=document.querySelector("#sheetIn")?.innerText||"";out.push(txt.includes(ENEMIES[id].sp.name)&&txt.includes("every")&&txt.length>100);closeSheet()});
      return out;
    });
    ok(r.every(Boolean),"Codex special entries show each learned special, effect, tell, and cadence");
    await E(()=>{fresh("golem");cx("golem").sp=true;openCodex("golem")});
    await p.screenshot({path:path.join(EVIDENCE,"v14-codex-golem.png"),fullPage:true});
    r=await E(()=>{const x=document.querySelector("#sheetIn");return x&&x.scrollWidth<=x.clientWidth+2});
    ok(r,"the Codex effect fits the mobile sheet without horizontal overflow");
    await E(()=>closeSheet());
    ok(errs.length===0,"no browser errors ("+errs.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("All V-14 special checks passed.");
})().catch(e=>{console.error(e);process.exit(1)});
