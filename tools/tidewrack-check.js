// V-05 Tidewrack: Rift selection, existing-family compatibility, determinism and mobile review.
// Usage: node tools/tidewrack-check.js
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
const EVIDENCE=path.join(__dirname,"..","rift-evidence");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.stack||e.message));await page.goto(URL);
    await page.waitForFunction(()=>typeof RIFT_BIOMES!=="undefined"&&typeof riftMake==="function");
    const result=await page.evaluate(()=>{
      const key="tidewrack",B=BIOMES[key],allowed={
        els:["water","ice","poison","shadow","swift"],
        bodies:["beast","undead","elemental","humanoid"],
        parts:["shell","frost","tail","vines","hood","crystals"]
      };
      const same=(a,b)=>a.length===b.length&&[...a].sort().every((x,i)=>x===[...b].sort()[i]);
      const inRift=RIFT_BIOMES.filter(b=>b===key).length===1;
      const compatible=!!B&&same(B.els,allowed.els)&&same(B.bodies,allowed.bodies)&&same(B.parts,allowed.parts)
        &&B.parts.every(p=>B.bodies.some(b=>BODY_PARTS[b]?.includes(p)))
        &&Object.keys(B.elW||{}).length===B.els.length&&Object.entries(B.elW||{}).every(([e,w])=>B.els.includes(e)&&Number.isFinite(w)&&w>0);
      let seed=null;
      for(let i=1;i<=2000&&!seed;i++){const s=hash("v05-tidewrack:"+i);if(riftMake(s,1).biome===key)seed=s;}
      if(!seed)return{inRift,compatible,seed:null};
      const summarize=()=>{
        const map=riftMake(seed,1),ids=[...Array.from({length:RIFT_N},(_,i)=>"w_rift_"+i),"rift_boss"];
        const foes=ids.map(id=>ENEMIES[id]);
        return{biome:map.biome,name:map.name,pal:map.pal,tier:map.tier,foes:foes.map(e=>({id:e.id,name:e.name,body:e.art.b,parts:e.art.p,element:e.el,special:e.sp.name})),ids:foes.map(e=>e.id)};
      };
      const a=summarize(),b=summarize(),pool=BIOME_SP[key]||[];
      const translations=pool.length>=2&&pool.length<=3&&pool.every(sp=>GEN_SP.some(base=>base.kind===sp.kind)
        &&DICT.de[sp.name]&&DICT.ko[sp.name]&&DICT.de[sp.tell]&&DICT.ko[sp.tell]);
      const foes=a.foes,unique=foes.every((e,i)=>foes.findIndex(q=>q.name===e.name)===i);
      const validParts=foes.every(e=>e.parts.every(p=>B.parts.includes(p)&&BODY_PARTS[e.body].includes(p)));
      return{inRift,compatible,seed,deterministic:JSON.stringify(a)===JSON.stringify(b),translations,
        specialPool:pool.map(sp=>sp.name),unique,validParts,rosterCount:foes.length-1,rosterSizeValid:foes.length-1===RIFT_N,first:foes[0],boss:foes.at(-1)};
    });
    ok(result.inRift,"Tidewrack is selectable exactly once from RIFT_BIOMES");
    ok(result.compatible,"Tidewrack uses only its specified existing elements, bodies, and attachable parts");
    ok(result.seed!==null&&result.deterministic,"a seeded Tidewrack roster and master reproduce exactly");
    ok(result.translations&&result.specialPool.length>=2&&result.specialPool.length<=3,"its V-11-compatible special pool is translated and uses existing kinds");
    ok(result.unique&&result.validParts&&result.rosterSizeValid,"all generated names and attachments fit the Tidewrack roster");
    if(result.seed){
      await page.evaluate(seed=>{
        S=freshState();S.zone=RIFT_ZONE;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
        UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);toast=()=>{};S.rift.seed=seed;S.rift.depth=1;S.rift.best=1;
        ENEMIES.rift_boss.seed=-1;riftEnsure();S.maps[RIFT_ZONE]=genMap({seed:hash("v05-map:"+seed),zone:RIFT_ZONE,heat:0});
        S.hp=pstats().maxHp;S.view="battle";S.battle=null;S.event=null;render();
      },result.seed);
      const map=page.locator("body");await map.screenshot({path:path.join(EVIDENCE,"v05-tidewrack-map-mobile.png"),fullPage:true});
      await page.evaluate(()=>{startBattle("w_rift_0",{rar:"normal",afx:[]});S.view="battle";render()});
      await page.locator("body").screenshot({path:path.join(EVIDENCE,"v05-tidewrack-battle-mobile.png"),fullPage:true});
      const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:innerWidth,enemy:ENEMIES[S.battle.id].name,biome:S.battle.biome}));
      ok(mobile.width<=mobile.view&&mobile.biome==="tidewrack","mobile terrain/battle layout fits and retains Tidewrack identity");
      console.log("Tidewrack fixture",JSON.stringify({seed:result.seed,roster:result.rosterCount,specials:result.specialPool,first:result.first,boss:result.boss,mobile}));
    }
    ok(errors.length===0,"no browser errors ("+errors.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("TIDEWRACK CHECK OK");
})().catch(e=>{console.error(e);process.exit(1)});
