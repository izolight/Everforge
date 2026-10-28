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
    const seed=hash("rift-boss-check"),region=riftMake(seed,1),E=ENEMIES.rift_boss;
    const setup=()=>{S.battle=null;S.zone=RIFT_ZONE;S.hp=pstats().maxHp;S.maps[RIFT_ZONE]=genMap({heat:0,zone:RIFT_ZONE})};
    const fight=()=>{setup();startBattle("rift_boss");const B=S.battle;return{rar:B.rar,afx:[...B.afx],hp:B.max,atk:B.atk,def:B.def}};
    const native=fight();
    const aff=E.afx.map(id=>AFX[id]),mul=k=>aff.reduce((n,a)=>n*(a.m&&a.m[k]||1),1);
    const expected={
      rar:E.rar,afx:[...E.afx],
      hp:Math.round(E.hp*RARITIES[E.rar].hp*mul("hp")),
      atk:Math.round(E.atk*RARITIES[E.rar].atk*mul("atk")),
      def:E.def+RARITIES[E.rar].def+aff.reduce((n,a)=>n+(a.m&&a.m.def||0),0)
    };
    // The sim's forced rare row removes the stored roll, then reapplies that same
    // affix list and rarity. It must produce the same combat stats as native.
    ENEMIES.rift_boss={...E,gen:undefined,rar:undefined,afx:[]};
    setup();startBattle("rift_boss",{rar:"rare",afx:E.afx});applyAfx(S.battle,E,"rare",E.afx);
    const forced={rar:S.battle.rar,afx:[...S.battle.afx],hp:S.battle.max,atk:S.battle.atk,def:S.battle.def};
    ENEMIES.rift_boss=E;
    setup();startBattle("gnarlhorn");
    const authored={rar:S.battle.rar,afx:[...S.battle.afx],hp:S.battle.max,atk:S.battle.atk};
    return{region:region.biome,E:{gen:E.gen,boss:E.boss,rar:E.rar,afx:E.afx.length},native,expected,forced,authored,authoredRaw:{hp:ENEMIES.gnarlhorn.hp,atk:ENEMIES.gnarlhorn.atk}};
  });
  ok(r.E.gen&&r.E.boss&&r.E.rar==="rare"&&r.E.afx>=2,`Rift master is a generated rare boss with its affix roll (${r.region}, ${r.E.afx} affixes)`);
  ok(JSON.stringify(r.native)===JSON.stringify(r.expected),"native Rift battle stats apply the rolled rarity and affixes exactly once");
  ok(JSON.stringify(r.forced)===JSON.stringify(r.native),"forced rare Rift row matches the native rolled master");
  ok(r.authored.rar==="normal"&&r.authored.afx.length===0&&r.authored.hp===r.authoredRaw.hp&&r.authored.atk===r.authoredRaw.atk,"authored boss retains the no-affix boss behavior");
  ok(!errors.length,`no browser errors (${errors.join("; ")})`);
  await browser.close();
  console.log(fails?`${fails} RIFT BOSS CHECKS FAILED`:"RIFT BOSS CHECK OK");
  process.exitCode=fails?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
