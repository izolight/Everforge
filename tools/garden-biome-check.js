#!/usr/bin/env node
// Focused seeded roster, element/pool, attachment and mobile-render check for
// the Radiant Garden Rift biome.
const {chromium}=require("playwright"),path=require("path"),assert=require("assert");
const URL="file://"+path.resolve(__dirname,"..","index.html"),OUT=path.resolve(__dirname,"../rift-evidence");
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.message));await page.goto(URL);
    const result=await page.evaluate(()=>{
      const key="garden",B=BIOMES[key],expected={els:["holy","wood","poison","swift"],
        bodies:["beast","humanoid","elemental","undead"],parts:["antlers","vines","halo","wings","crown","mane"],
        regions:["The Sunken Garden","The Gilded Grove","The Orchard of Bones"]};
      const matches=(xs,ys)=>JSON.stringify(xs)===JSON.stringify(ys);
      const indexCount=RIFT_BIOMES.filter(x=>x===key).length;
      let sample=null;
      for(let i=1;i<=20000;i++){
        const seed=hash("sim-rift:"+i),R=rng(seed),biome=RIFT_BIOMES[Math.floor(R()*RIFT_BIOMES.length)];
        if(biome===key){sample={i,seed};break}
      }
      if(!B||!sample)throw Error("Radiant Garden or a reproducible Garden seed is missing");
      const roster=()=>{
        riftMake(sample.seed,1);
        return [...Array.from({length:RIFT_N},(_,i)=>ENEMIES["w_rift_"+i]),ENEMIES.rift_boss]
          .map(e=>({id:e.id,name:e.name,el:e.el,body:e.art.b,parts:e.art.p,sp:e.sp&&{name:e.sp.name,kind:e.sp.kind,tell:e.sp.tell}}));
      };
      const first=roster(),second=roster(),pool=BIOME_SP[key]||[],ELW=BIOME_ELW[key]||{};
      const trans=pool.length>=2&&pool.length<=3&&pool.every(sp=>GEN_SP.some(base=>base.kind===sp.kind)
        &&DICT.de[sp.name]&&DICT.ko[sp.name]&&DICT.de[sp.tell]&&DICT.ko[sp.tell]);
      const partsValid=first.slice(0,RIFT_N).every(e=>B.bodies.includes(e.body)&&Array.isArray(e.parts)&&e.parts.every(p=>B.parts.includes(p)&&BODY_PARTS[e.body].includes(p))
        &&e.parts.every((p,i)=>e.parts.slice(i+1).every(q=>!(PART_CONFLICTS[p]||[]).includes(q))));
      const attached=first.map(e=>({id:e.id,name:e.name,el:e.el,body:e.body,parts:e.parts,sp:e.sp}));
      const unique=attached.slice(0,RIFT_N).every((e,i)=>attached.slice(0,RIFT_N).findIndex(q=>q.name===e.name)===i);
      return {key,indexCount,seed:sample.seed,seedOrdinal:sample.i,biomePool:B.els,bodies:B.bodies,parts:B.parts,regions:B.regions,
        expected,weights:ELW,specialPool:pool.map(s=>s.name),translations:trans,
        deterministic:JSON.stringify(first)===JSON.stringify(second),partsValid,unique,roster:attached,
        name:first[0].name,boss:first.at(-1).name,rosterCount:first.length};
    });
    assert.strictEqual(result.indexCount,1,"Garden occurs exactly once in RIFT_BIOMES");
    assert.deepStrictEqual(result.biomePool,result.expected.els);
    assert.deepStrictEqual(result.bodies,result.expected.bodies);
    assert.deepStrictEqual(result.parts,result.expected.parts);
    assert(result.expected.regions.every(x=>result.regions.includes(x)),"the requested Garden region names are present");
    assert.deepStrictEqual(result.weights,{holy:3,wood:3,poison:1,swift:1},"Garden keeps the intended weighted element mix");
    assert(result.translations&&result.specialPool.length>=2&&result.specialPool.length<=3,"garden specials use existing kinds and have DE/KO names and tells");
    assert(result.deterministic&&result.rosterCount===11,"same seed reproduces ten wilds and one master");
    assert(result.partsValid,"generated attachments fit existing body anchors");
    assert(result.unique,"the ten regular creature names are unique");
    await page.evaluate(seed=>{
      S=freshState();S.zone=RIFT_ZONE;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
      S.rift={seed,depth:1,best:1,cleared:0};ENEMIES.rift_boss.seed=-1;riftEnsure();
      S.maps[RIFT_ZONE]=genMap({seed:hash("v07-map:"+seed),zone:RIFT_ZONE,heat:0});
      S.daily=null;S.tutorials={};S.tutorial=null;S.hp=pstats().maxHp;S.view="battle";S.battle=null;S.event=null;render();
    },result.seed);
    for(let i=0;i<4;i++){const got=page.locator("button").filter({hasText:"Got it"});if(await got.count())await got.first().click();else break;}
    await page.locator("body").screenshot({path:path.join(OUT,"v07-garden-map-mobile.png"),fullPage:true});
    await page.evaluate(()=>{startBattle("w_rift_0",{rar:"normal",afx:[]});S.view="battle";render()});
    for(let i=0;i<4;i++){const got=page.locator("button").filter({hasText:"Got it"});if(await got.count())await got.first().click();else break;}
    await page.locator("body").screenshot({path:path.join(OUT,"v07-garden-battle-mobile.png"),fullPage:true});
    const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:innerWidth,enemy:ENEMIES[S.battle.id].name,biome:S.battle.biome}));
    assert(mobile.width<=mobile.view&&mobile.biome==="garden","mobile terrain and creature retain Garden identity without horizontal overflow");
    assert.deepStrictEqual(errors,[]);
    console.log("RADIANT GARDEN CHECK OK",JSON.stringify({...result,roster:result.roster.slice(0,2),mobile}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
