#!/usr/bin/env node
// Regression check: generated Rift masters use their stored rare roll in combat,
// forced sim rows reuse that roll consistently, and authored bosses stay unchanged.
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;
const ok=(c,m)=>{if(!c){fails++;console.log("FAIL",m)}else console.log("ok  ",m)};
(async()=>{
  const browser=await chromium.launch(),page=await browser.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(URL);
  const r=await page.evaluate(()=>{
    const seeds=[],seen=new Set();
    for(let s=1;seeds.length<RIFT_BIOMES.length;s++){
      const seed=hash("sim-rift:"+s),R=rng(seed),biome=RIFT_BIOMES[Math.floor(R()*RIFT_BIOMES.length)];
      if(!seen.has(biome)){seen.add(biome);seeds.push({s,seed,biome})}
    }
    const setup=()=>{S.battle=null;S.zone=RIFT_ZONE;S.hp=pstats().maxHp;S.maps[RIFT_ZONE]=genMap({heat:0,zone:RIFT_ZONE})};
    const stats=()=>{const B=S.battle;return{rar:B.rar,afx:[...B.afx],hp:B.max,atk:B.atk,def:B.def}};
    const rows=[];
    for(const {s,seed,biome} of seeds)for(const depth of [1,3]){
      const region=riftMake(seed,depth),E=ENEMIES.rift_boss;
      setup();startBattle("rift_boss");const native=stats();
      const aff=E.afx.map(id=>AFX[id]),mul=k=>aff.reduce((n,a)=>n*(a.m&&a.m[k]||1),1);
      const expected={rar:E.rar,afx:[...E.afx],hp:Math.round(E.hp*RARITIES[E.rar].hp*mul("hp")),atk:Math.round(E.atk*RARITIES[E.rar].atk*mul("atk")),def:E.def+RARITIES[E.rar].def+aff.reduce((n,a)=>n+(a.m&&a.m.def||0),0)};
      // Mirror the simulator's forced-master clone and restore the generated roll.
      ENEMIES.rift_boss={...E,gen:undefined,rar:undefined,afx:[]};
      setup();startBattle("rift_boss",{rar:"rare",afx:E.afx});applyAfx(S.battle,E,"rare",E.afx);
      const forced=stats();ENEMIES.rift_boss=E;
      rows.push({s,seed,biome,depth,tier:region.tier,affixIds:[...E.afx],affixes:E.afx.map(id=>AFX[id]?.n||id),special:E.sp&&E.sp.name,specialKind:E.sp&&E.sp.kind,native,expected,forced});
    }
    setup();startBattle("gnarlhorn");
    const authored={rar:S.battle.rar,afx:[...S.battle.afx],hp:S.battle.max,atk:S.battle.atk};
    return{rows,authored,authoredRaw:{hp:ENEMIES.gnarlhorn.hp,atk:ENEMIES.gnarlhorn.atk}};
  });
  const depth1=r.rows.filter(x=>x.depth===1),bySeed=new Map();r.rows.forEach(x=>{const xs=bySeed.get(x.seed)||[];xs.push(x);bySeed.set(x.seed,xs)});
  ok(depth1.length===8&&new Set(depth1.map(x=>x.biome)).size===8&&r.rows.length===16,"regression sample covers all eight deterministic Rift biomes at depths 1 and 3");
  ok(r.rows.every(x=>x.native.rar==="rare"&&x.native.afx.length===3),"each generated master carries its three-affix rare roll");
  ok(r.rows.every(x=>!x.native.afx.some(id=>["ward","boom","regen"].includes(id))),"Rift masters avoid recurring shield, regeneration, and lethal max-HP burst interactions");
  ok(r.rows.every(x=>!(["multi","heavy"].includes(x.specialKind)&&x.affixIds.includes("frenzy"))),"Frenzied is not paired with multi-hit or heavy specials");
  ok(r.rows.every(x=>JSON.stringify(x.native)===JSON.stringify(x.expected)),"native Rift stats apply rolled rarity and affixes exactly once in every biome");
  ok(r.rows.every(x=>JSON.stringify(x.forced)===JSON.stringify(x.native)),"forced rare combat stats and affixes match native in every biome");
  const hpRatio=(163/120)*(3.2/4.4),atkRatio=(26/21)*.95;
  const bandRatios=[...bySeed.values()].map(xs=>{const a=xs.find(x=>x.depth===1),b=xs.find(x=>x.depth===3);return{biome:a.biome,hp:b.native.hp/a.native.hp,atk:b.native.atk/a.native.atk,def:b.native.def-a.native.def,affixSame:JSON.stringify(a.affixIds)===JSON.stringify(b.affixIds)}});
  ok(bandRatios.every(x=>x.affixSame&&Math.abs(x.hp-hpRatio)<.01&&Math.abs(x.atk-atkRatio)<.05&&x.def===1),`depth scaling tapers the master bonus without compounding the region tier (${bandRatios.map(x=>`${x.biome} ${x.hp.toFixed(3)}/${x.atk.toFixed(3)}/+${x.def}`).join(", ")})`);
  r.rows.forEach(x=>console.log(`  ${x.biome} depth ${x.depth}, seed ${x.s} (${x.seed}): ${x.affixes.join(", ")}; ${x.special}`));
  ok(r.authored.rar==="normal"&&r.authored.afx.length===0&&r.authored.hp===r.authoredRaw.hp&&r.authored.atk===r.authoredRaw.atk,"authored boss retains the no-affix boss behavior");
  ok(!errors.length,`no browser errors (${errors.join("; ")})`);
  await browser.close();
  console.log(fails?`${fails} RIFT BOSS CHECKS FAILED`:"RIFT BOSS CHECK OK");
  process.exitCode=fails?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
