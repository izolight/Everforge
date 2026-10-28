// Seeded Rift depth modifiers, modifier-free simulator reference and mobile discovery.
// Usage: node tools/depth-check.js (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const URL="file://"+path.resolve(__dirname,"..","index.html"),EVIDENCE=path.resolve(__dirname,"..","rift-evidence");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));await p.goto(URL);await p.waitForFunction(()=>typeof S==="object"&&S);
    const E=(f,a)=>p.evaluate(f,a);fs.mkdirSync(EVIDENCE,{recursive:true});
    const fixtures=await E(()=>{
      const out={},want=RIFT_DEPTH_MODS.map(m=>m.id);let draws=0;const old=Math.random;Math.random=()=>{draws++;return .5};
      for(let seed=1;seed<10000&&Object.keys(out).length<want.length;seed++)for(let depth=1;depth<10;depth++){
        const m=riftDepthModFor(seed,depth);if(!out[m.id])out[m.id]={seed,depth,id:m.id};
      }
      Math.random=old;window.depthFixture=(f,depthMods)=>{
        S=freshState();toast=()=>{};S.onboarding=0;S.zone=RIFT_ZONE;S.unlocked=ZONES.map(z=>z[0]);S.rift=S.rift||{};S.rift.seed=f.seed;S.rift.depth=f.depth;
        if(ENEMIES.rift_boss)ENEMIES.rift_boss.seed=-1;riftEnsure();S.maps.rift=genMap({seed:hash("v21-map:"+f.seed+":"+f.depth),zone:RIFT_ZONE,heat:0});
        Object.keys(S.eq).forEach(k=>S.eq[k]=null);S.hp=pstats().maxHp;
        startBattle("w_rift_0",{rar:"normal",afx:[],depthMods});return S.battle;
      };
      return{out,draws,ids:want};
    });
    ok(fixtures.ids.every(id=>fixtures.out[id]),"seed/depth fixtures select every V-21 modifier");
    ok(fixtures.draws===0,"modifier selection is deterministic and consumes no combat or generator RNG draws");
    let r=await E(fs=>{
      const a=riftDepthModFor(fs.fast_foes.seed,fs.fast_foes.depth),b=riftDepthModFor(fs.fast_foes.seed,fs.fast_foes.depth),next=riftDepthModFor(fs.fast_foes.seed,fs.fast_foes.depth+1);
      return{a:a.id,b:b.id,next:next.id,depths:RIFT_DEPTH_MODS.map(m=>m.id)};
    },fixtures.out);
    ok(r.a===r.b&&r.depths.includes(r.next),"same saved seed and depth always rebuild the same modifier");

    r=await E(fs=>{
      const FB=depthFixture(fs.fast_foes,true),P=pstats(),fire={...FB,atk:100,el:"fire",guard:false,open:false,parry:false,heat:0,depthMods:true,depthMod:RIFT_DEPTH_MODS.find(m=>m.id==="burning_air")};
      const normal=foeHit({...fire,depthMods:false},P,1,1),boosted=foeHit(fire,P,1,1);
      const thin={...fire,el:"stone",depthMod:RIFT_DEPTH_MODS.find(m=>m.id==="thin_wards")},fast={...FB,depthMods:true,depthMod:RIFT_DEPTH_MODS.find(m=>m.id==="fast_foes"),spEvery:3,turn:2};
      const fastId=fast.id,oldSp=ENEMIES[fastId].sp;ENEMIES[fastId].sp={kind:"multi",every:3,n:1,x:1};
      const fastOn=isSpecial(fast),fastOff=isSpecial({...fast,depthMods:false}),ordinary=isSpecial({...fast,depthMods:false,turn:3});ENEMIES[fastId].sp=oldSp;
      return{normal,boosted,thinCap:riftWardAbsorbCap(thin,100),normalCap:riftWardAbsorbCap({...thin,depthMods:false},100),fastOn,fastOff,ordinary};
    },fixtures.out);
    ok(r.boosted>r.normal,"Burning air increases Fire hit damage while ordinary resistance and Guard calculations still run");
    ok(r.thinCap===50&&r.normalCap===100,"Thin wards limits each hit's ward absorption to half without erasing the remaining ward");
    ok(r.fastOn&& !r.fastOff&&r.ordinary,"Fast foes advances a special by one turn, keeps the normal cadence, and respects the disabled reference");

    r=await E(fs=>{
      const f=fs.thin_wards,B=depthFixture(f,true),biome=B.biome,depth=B.depthMod;
      const ref=depthFixture(f,false);ref.depthMods=false;ref.depthMod=null;
      return{selected:B.depthMod&&B.depthMod.id,disabled:ref.depthMod,flag:ref.depthMods,biome,refBiome:ref.biome,entry:RIFT_DEPTH_MODS.find(m=>m.id===f.id)?.desc};
    },fixtures.out);
    ok(r.selected==="thin_wards"&&r.disabled===null&&r.flag===false,"startBattle captures the selected depth modifier and opts out with depthMods:false");
    ok(r.biome===r.refBiome,"the depth reference switch leaves V-15 biome passives enabled independently");

    await E(f=>{depthFixture(f,true);render()},fixtures.out.fast_foes);
    let text=await p.locator("body").innerText();
    ok(text.toLowerCase().includes("rift depth modifier")&&text.toLowerCase().includes("fast foes"),"active battle HUD explains the current depth modifier");
    await p.screenshot({path:path.join(EVIDENCE,"v21-battle-mobile.png"),fullPage:false});
    await E(()=>{S.battle=null;render()},null);
    text=await p.locator("body").innerText();
    ok(text.toLowerCase().includes("fast foes"),"Rift map card exposes the selected depth modifier");
    const got=p.getByRole("button",{name:"Got it"});if(await got.count())await got.click();
    await p.locator(".dcard.rift").evaluate(el=>el.scrollIntoView({block:"center"}));await p.screenshot({path:path.join(EVIDENCE,"v21-rift-card-mobile.png"),fullPage:false});
    await E(()=>openCodex("w_rift_0"),null);
    text=await p.locator("body").innerText();
    ok(text.toLowerCase().includes("rift depth modifier")&&text.includes("Fast foes")&&text.includes("Enemy specials recur one turn sooner"),"Codex explains the selected depth effect");
    await p.screenshot({path:path.join(EVIDENCE,"v21-codex-mobile.png"),fullPage:false});
    const overflow=await p.evaluate(()=>({w:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
    ok(overflow.w<=overflow.c+1,"battle, map and Codex surfaces fit the 390px mobile viewport");
    ok(!errs.length,"no browser errors ("+errs.join(", ")+")");
    fs.writeFileSync(path.join(EVIDENCE,"v21-check.txt"),`seeded depth fixtures ${JSON.stringify(fixtures.out)}\n`);
  }catch(e){fails++;console.error(e.stack||e)}finally{await browser.close()}
  console.log(fails?`V-21 DEPTH CHECK FAIL (${fails})`:"V-21 DEPTH CHECK OK");process.exitCode=fails?1:0;
})();
