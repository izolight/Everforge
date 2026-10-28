#!/usr/bin/env node
// Focused regression checks for authored enemy special kinds.
// Usage: node tools/v14-special-check.js (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;
const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));
    await p.goto(URL);
    const E=(f,a)=>p.evaluate(f,a);
    await E(()=>{
      window.R=(v,fn)=>{const r=Math.random;Math.random=()=>v;try{return fn()}finally{Math.random=r}};
      window.fresh=(id)=>{
        S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
        UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);S.zone=ENEMIES[id].zone;
        S.maps[S.zone]=genMap({zone:S.zone,heat:0});S.unlocked=ZONES.map(z=>z[0]);
        Object.keys(S.eq).forEach(s=>S.eq[s]=null);S.hp=pstats().maxHp;startBattle(id,{rar:"normal",afx:[]});
        const B=S.battle;B.max=B.hp=10000;B.log=[];return B;
      };
      window.weapon=()=>{const id="v14_test_blade";S.items[id]={id,name:"Test blade",form:"blade",noun:"Weapon",traits:{Iron:1},tier:1,crafed:true};S.inv[id]=1;S.eq.main=id;return pstats().main};
    });
    let r=await E(()=>Object.entries(ENEMIES).filter(([,e])=>e.sp&&["guard","inflict","enrage","burrow","summon"].includes(e.sp.kind)).map(([id,e])=>[id,e.sp.kind,e.boss===true,!!e.gen]));
    const boar=await E(()=>ENEMIES.boar.sp.kind==="heavy"&&ENEMIES.boar.sp.name==="Tusk Charge");
    const originalKinds={golem:"guard",bandit:"inflict",bear:"enrage",stag:"burrow",harpy:"summon"};
    ok(Object.entries(originalKinds).every(([id,kind])=>r.some(x=>x[0]===id&&x[1]===kind))&&r.every(x=>!x[2]&&!x[3])&&boar,"original five special assignments remain on authored non-boss enemies, including new regional users; Boar keeps its Tusk Charge");
    const tells=await E(()=>Object.values(ENEMIES).filter(e=>e.sp&&["guard","inflict","enrage","burrow","summon"].includes(e.sp.kind)).every(e=>e.sp.name&&e.sp.tell));
    ok(tells,"each new special has a name and a visible tell for the battle/Codex entry");

    r=await E(()=>{
      const B=fresh("golem");B.turn=ENEMIES.golem.sp.every;B.parry=false;
      R(.99,()=>enemyTurn());const raised=B.spWard>0,ward=B.spWard;
      const W=weapon();R(.5,()=>strike(W,200,"Test hit",true));
      return{raised,ward,left:B.spWard,absorbed:ward>B.spWard};
    });
    ok(r.raised&&r.absorbed,`guard raises a ward which absorbs player damage (${r.ward} -> ${r.left})`);
    r=await E(()=>{
      const B=fresh("bear");B.hp=49;B.turn=ENEMIES.bear.sp.every;B.atk=10;
      const before=foeHit(B,pstats(),1,1);R(.99,()=>enemyTurn());const after=foeHit(B,pstats(),1,1);
      return{enraged:B.enraged,x:B.enrageX,before,after,known:cx("bear").sp};
    });
    ok(r.enraged&&r.x===1.3&&r.after>r.before&&r.known,`enrage raises Attack below half HP and is learned in the Codex (${r.before} -> ${r.after})`);
    r=await E(()=>{
      const B=fresh("bear");B.hp=5100;B.turn=ENEMIES.bear.sp.every;R(.99,()=>enemyTurn());return{enraged:B.enraged,turn:B.turn};
    });
    ok(!r.enraged,"enrage does not activate above its half-HP threshold");

    r=await E(()=>{
      const out=[];
      const B=fresh("bandit"),sp=ENEMIES.bandit.sp;B.turn=sp.every;B.atk=1;B.you=S.battle.you;
      B.resist=["poison"]; // guaranteed special status must still land through resistance.
      R(.99,()=>enemyTurn());out.push(!!B.you.poison);
      const G=fresh("bandit");G.turn=ENEMIES.bandit.sp.every;G.atk=1;R(.5,()=>guard());out.push(!G.you.poison);
      const P=fresh("bandit");P.turn=ENEMIES.bandit.sp.every;P.atk=1;P.parry=true;R(0,()=>enemyTurn());out.push(!P.you.poison&&S.stats.parries===1);
      return out;
    });
    ok(r.every(Boolean),"inflict applies its guaranteed status on a hit, while Guard and perfect Parry cancel it");

    r=await E(()=>{
      const B=fresh("stag");B.turn=ENEMIES.stag.sp.every;R(.99,()=>enemyTurn());const buried=B.burrowed;
      const W=weapon(),miss=R(.5,()=>strike(W,200,"Test hit",true)).miss;
      B.turn=4;R(.99,()=>enemyTurn());return{buried,miss,cleared:!B.burrowed};
    });
    ok(r.buried&&r.miss&&r.cleared,"burrow avoids one player attack and then surfaces");

    r=await E(()=>{
      const id=Object.keys(ENEMIES).find(k=>ENEMIES[k].sp?.kind==="summon"),B=fresh(id),sp=ENEMIES[id].sp;B.turn=sp.every;B.atk=100;const hp=S.hp;
      R(.99,()=>enemyTurn());return{damage:hp-S.hp,called:B.log.some(x=>/calls/.test(x.t)),summon:ENEMIES[sp.summon].atk,source:B.atk};
    });
    ok(r.called&&r.damage>0&&r.damage<r.source,`summon calls a weaker wild creature for its own reduced strike (${r.damage} damage)`);
    r=await E(()=>{
      const id=Object.keys(ENEMIES).find(k=>ENEMIES[k].sp?.kind==="summon"),G=fresh(id);G.turn=ENEMIES[id].sp.every;G.atk=100;const hp=S.hp;G.guard=true;R(.99,()=>enemyTurn());const guarded=hp-S.hp;
      const P=fresh(id);P.turn=ENEMIES[id].sp.every;P.atk=100;const h=S.hp;P.parry=true;R(0,()=>enemyTurn());return{guarded,parried:h-S.hp,parries:S.stats.parries};
    });
    ok(r.guarded>0&&r.parried===0&&r.parries===1,"Guard reduces and perfect Parry cancels a summon strike");

    r=await E(()=>{
      const out=[];
      for(const id of ["golem","bear","stag","bandit",Object.keys(ENEMIES).find(k=>ENEMIES[k].sp?.kind==="summon")]){
        const B=fresh(id),sp=ENEMIES[id].sp;B.turn=sp.every;B.hp=sp.kind==="enrage"?49:B.hp;B.parry=true;const hp=S.hp;
        R(0,()=>enemyTurn());out.push({id,ward:B.spWard||0,enraged:!!B.enraged,burrowed:!!B.burrowed,status:!!B.you.poison,damage:hp-S.hp,known:cx(id).sp});
      }
      return out;
    });
    ok(r.every(x=>!x.ward&&!x.enraged&&!x.burrowed&&!x.status&&x.damage===0&&x.known),"perfect Parry interrupts each special and its tell appears in the Codex");
    ok(errs.length===0,`no browser errors (${errs.join("; ")})`);
  }finally{await browser.close()}
  process.exitCode=fails?1:0;
})();
