// M-06 Fen promotion: roster, unlock/save migration, deterministic map, palette and score.
const {chromium}=require("playwright"),path=require("path"),fs=require("fs"),assert=require("assert");
const URL="file://"+path.resolve(__dirname,"..","index.html");
const EVIDENCE=path.resolve(__dirname,"..","region-evidence");fs.mkdirSync(EVIDENCE,{recursive:true});
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.message));await page.goto(URL);
    await page.waitForFunction(()=>typeof S==="object"&&typeof genMap==="function");
    const r=await page.evaluate(()=>{
      const ids=["fen_reedstalker","fen_mirewitch","fen_peatbrute","fen_murk_wisp","fen_drowned_guard","fen_antlerwolf"],
        foes=ids.map(id=>ENEMIES[id]),boss=ENEMIES.fen_matriarch,
        mapA=genMap({seed:60106,zone:"fen",heat:0}),mapB=genMap({seed:60106,zone:"fen",heat:0}),
        old=freshState();old.kills.archon=1;const migrated=loadSave(old),
        intro=UNLOCKS.find(x=>x.id==="fen_intro");
      S.zone="fen";S.maps.fen=mapA;render();
      const map=document.querySelector(".map"),color=map&&getComputedStyle(map).getPropertyValue("--tb").trim();
      return{
        zones:ZONES.map(z=>z[0]),idsPresent:foes.every(Boolean),foes:foes.map(e=>({zone:e&&e.zone,gen:e&&e.gen,el:e&&e.el,weak:e&&e.weak,resist:e&&e.resist,drops:e&&e.drops})),
        boss:boss&&{zone:boss.zone,boss:boss.boss,drops:boss.drops},
        dropsSafe:foes.every(e=>e&&e.drops.every(d=>zonePool("fen").includes(d[0])))&&boss&&boss.drops.every(d=>zonePool("fen").includes(d[0])),
        deterministic:JSON.stringify(mapA)===JSON.stringify(mapB),mapBoss:ZONES[zoneIdx("fen")][2],hasBossLair:mapA.pois.some(p=>p.t==="boss"),
        migratedFen:migrated.unlocked.includes("fen"),introVisible:intro&&intro.when({...freshState(),unlocked:["fen"]}),
        introHidden:intro&&!intro.when({...freshState(),unlocked:["woods"]}),music:!!MUSIC_SCENES.fen,
        terrain:terrain("fen",180,60106),mapColor:color,saveKey:KEY
      };
    });
    assert.deepStrictEqual(r.zones,["woods","pass","hollow","spire","fen","rift"]);
    assert(r.idsPresent&&r.foes.length===6&&r.foes.every(e=>e.zone==="fen"&&e.gen===undefined),"six hand-authored Fen regulars stay out of procedural coverage");
    assert(r.foes.every(e=>e.el!=="water"&&![...(e.weak||[]),...(e.resist||[])].includes("water")),"Fen foes use only supported combat elements");
    assert(r.boss&&r.boss.boss&&r.boss.zone==="fen"&&r.mapBoss==="fen_matriarch"&&r.hasBossLair,"Matriarch is the Fen zone boss at its generated boss lair");
    assert(r.dropsSafe,"all Fen foes and boss use existing Fen-region drops");
    assert(r.deterministic,"same Fen map seed produces the same map");
    assert(r.migratedFen&&r.introVisible&&r.introHidden,"Archon save migration and gated Fen intro");
    assert(r.music&&r.terrain.includes("#91a65a")&&r.mapColor==="#81945a","Fen score, reed terrain and distinct map palette");
    assert.equal(r.saveKey,"everforge-v18","promotion preserves save schema version");
    const bossFlow=await page.evaluate(()=>{const old=JSON.stringify(S);S=freshState();S.zone="fen";S.unlocked=["woods","pass","hollow","spire","fen"];S.kills.archon=1;S.hp=9999;startBattle("fen_matriarch",{row:2});if(!S.battle)throw Error("Fen Matriarch battle did not start");S.battle.hp=1;S.hp=9999;render();const atk=document.querySelector("#atk");if(!atk)throw Error("battle attack action missing");atk.click();const result={over:S.battle.over,kills:S.kills.fen_matriarch||0,rift:S.unlocked.includes(RIFT_ZONE)};S=JSON.parse(old);render();return result});
    assert.deepStrictEqual(bossFlow,{over:"won",kills:1,rift:true},"defeating the Matriarch records the boss and opens the Rift");
    const payload=await page.evaluate(()=>{S.zone=RIFT_ZONE;S.rift.seed=61006;riftEnsure();const s=freshState();s.zone=RIFT_ZONE;s.unlocked=["woods","fen",RIFT_ZONE];s.kills.archon=1;s.wins=7;s.journal=[{id:"iron_sword"}];s.codex={fen_drowned_guard:{weak:["poison"],resist:[],drops:[],inf:[]},rift_boss:{weak:["shadow"],resist:[],drops:[],inf:[]}};s.rift={depth:4,best:8,seed:61006,biome:"fen",name:"The Sinking Fen",pal:null,cleared:0};return JSON.stringify(s)});
    const reload=await browser.newPage();await reload.addInitScript(([k,v])=>localStorage.setItem(k,v),["everforge-v18",payload]);await reload.goto(URL);await reload.waitForFunction(()=>typeof S==="object"&&S);
    const roundtrip=await reload.evaluate(()=>({zone:S.zone,wins:S.wins,journal:S.journal.length,depth:S.rift.depth,best:S.rift.best,seed:S.rift.seed,fen:S.unlocked.includes("fen"),rift:S.unlocked.includes("rift"),codex:Object.keys(S.codex).sort()}));await reload.close();
    const expectedCodex=["fen_drowned_guard","rift_boss"].sort();
    assert.deepStrictEqual(roundtrip,{zone:"rift",wins:7,journal:1,depth:4,best:8,seed:61006,fen:true,rift:true,codex:expectedCodex},"Fen/Rift unlocks, Codex references, journal and Rift seed/depth survive an actual saved-page reload");
    await page.screenshot({path:path.join(EVIDENCE,"m06-fen-map-mobile.png"),fullPage:true});
    assert.deepStrictEqual(errors,[]);console.log("Fen region check OK",JSON.stringify({regulars:r.foes.length,boss:r.mapBoss,migrated:r.migratedFen,roundtrip,mapSeed:60106,palette:r.mapColor,saveKey:r.saveKey,screenshot:"region-evidence/m06-fen-map-mobile.png"}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
