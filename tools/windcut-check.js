// V-06 Windcut: pool compatibility, weighting, deterministic Rift generation and mobile review.
// Usage: node tools/windcut-check.js (requires Playwright + Chromium).
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
      const key="windcut",B=BIOMES[key],allowed={els:["stone","metal","swift","arcane"],bodies:["beast","humanoid","construct","elemental"],parts:["armor","horns","chains","crystals","wings","tail"]};
      const same=(a,b)=>a.length===b.length&&[...a].sort().every((x,i)=>x===[...b].sort()[i]);
      const inRift=RIFT_BIOMES.filter(b=>b===key).length===1;
      const compatible=!!B&&same(B.els,allowed.els)&&same(B.bodies,allowed.bodies)&&same(B.parts,allowed.parts)
        &&B.parts.every(p=>B.bodies.some(b=>BODY_PARTS[b]?.includes(p)))
        &&Object.keys(B.elW||{}).length===B.els.length&&Object.entries(B.elW||{}).every(([e,w])=>B.els.includes(e)&&Number.isFinite(w)&&w>0);
      const weights={stone:3,metal:3,swift:3,arcane:1},counts=Object.fromEntries(B.els.map(e=>[e,0]));
      const samples=10000;for(let i=0;i<samples;i++)counts[biomeElement("rift",key,B,()=>i/samples)]++;
      const weighted=Object.entries(weights).every(([e,w])=>Math.abs(counts[e]/samples-w/10)<.002);
      let seed=null;for(let i=1;i<=2000&&!seed;i++){const s=hash("v06-windcut:"+i);if(riftMake(s,1).biome===key)seed=s;}
      if(!seed)return{inRift,compatible,seed:null,weighted,counts};
      const summarize=()=>{const map=riftMake(seed,1),ids=[...Array.from({length:RIFT_N},(_,i)=>"w_rift_"+i),"rift_boss"],foes=ids.map(id=>ENEMIES[id]);
        return{biome:map.biome,name:map.name,pal:map.pal,foes:foes.map(e=>({id:e.id,name:e.name,body:e.art.b,parts:e.art.p,element:e.el,special:e.sp.name}))};};
      const a=summarize(),b=summarize(),pool=BIOME_SP[key]||[];
      const translations=pool.length===3&&pool.every(sp=>GEN_SP.some(base=>base.kind===sp.kind)&&DICT.de[sp.name]&&DICT.ko[sp.name]&&DICT.de[sp.tell]&&DICT.ko[sp.tell]);
      const foes=a.foes,wilds=foes.slice(0,-1),unique=wilds.every((e,i)=>wilds.findIndex(q=>q.name===e.name)===i);
      const bossNameCompatible=B.pre.some(pre=>foes.at(-1).name.startsWith(cap(pre)+" "))&&nameWords(B,foes.at(-1).body).some(noun=>foes.at(-1).name.endsWith(cap(noun)));
      const validParts=foes.every(e=>e.parts.every(p=>B.parts.includes(p)&&BODY_PARTS[e.body].includes(p)));
      const elements=foes.slice(0,-1).every(e=>B.els.includes(e.element));
      return{inRift,compatible,seed,weighted,counts,deterministic:JSON.stringify(a)===JSON.stringify(b),translations,
        specialPool:pool.map(sp=>sp.name),unique,bossNameCompatible,validParts,elements,rosterSizeValid:foes.length-1===RIFT_N,first:foes[0],boss:foes.at(-1)};
    });
    console.log("Windcut fixture",JSON.stringify(result));
    ok(result.inRift,"Windcut appears exactly once in RIFT_BIOMES");
    ok(result.compatible,"Windcut uses the specified existing elements, bodies, and attachable parts with complete positive weights");
    ok(result.weighted,"stone/metal/swift/arcane selection matches 3:3:3:1 across 10,000 deterministic uniform samples");
    ok(result.seed!==null&&result.deterministic,"a seeded Windcut Rift roster and master reproduce exactly");
    ok(result.translations,"all three Windcut specials use existing combat kinds with German and Korean names/tells");
    ok(result.unique&&result.bossNameCompatible&&result.validParts&&result.elements&&result.rosterSizeValid,"wild names are unique and boss name stays biome-themed; elements, attachments, and ten-wild roster size are valid");
    if(result.seed){
      await page.evaluate(seed=>{S=freshState();S.zone=RIFT_ZONE;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);toast=()=>{};S.rift.seed=seed;S.rift.depth=1;S.rift.best=1;ENEMIES.rift_boss.seed=-1;riftEnsure();S.maps[RIFT_ZONE]=genMap({seed:hash("v06-map:"+seed),zone:RIFT_ZONE,heat:0});S.hp=pstats().maxHp;S.view="battle";S.battle=null;S.event=null;render();},result.seed);
      await page.locator("body").screenshot({path:path.join(EVIDENCE,"v06-windcut-map-mobile.png"),fullPage:true});
      await page.evaluate(()=>{startBattle("w_rift_0",{rar:"normal",afx:[]});S.view="battle";render()});
      await page.locator("body").screenshot({path:path.join(EVIDENCE,"v06-windcut-battle-mobile.png"),fullPage:true});
      const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:innerWidth,enemy:ENEMIES[S.battle.id].name,biome:S.battle.biome}));
      ok(mobile.width<=mobile.view&&mobile.biome==="windcut","mobile map and battle fit the viewport and keep Windcut identity");
      console.log("Windcut mobile fixture",JSON.stringify({seed:result.seed,roster:10,specials:result.specialPool,counts:result.counts,first:result.first,boss:result.boss,mobile}));
    }
    ok(errors.length===0,"no browser errors ("+errors.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("WINDCUT CHECK OK");
})().catch(e=>{console.error(e);process.exit(1)});
