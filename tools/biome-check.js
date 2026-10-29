// Seeded Rift biome passive regressions and mobile discovery evidence.
// Usage: node tools/biome-check.js (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const URL="file://"+path.resolve(__dirname,"..","index.html"),EVIDENCE=path.resolve(__dirname,"..","rift-evidence");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];p.on("pageerror",e=>errs.push(e.message));await p.goto(URL);
    const E=(f,a)=>p.evaluate(f,a);fs.mkdirSync(EVIDENCE,{recursive:true});
    await E(()=>{
      toast=()=>{}; // keep unlock notices from covering the documented mobile surfaces
      window.R=(v,fn)=>{const old=Math.random;Math.random=()=>v;try{return fn()}finally{Math.random=old}};
      window.biomeState=(biome,seed)=>{
        S=freshState();S.zone=RIFT_ZONE;S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);
        S.rift.seed=seed;S.rift.depth=1;ENEMIES.rift_boss.seed=-1;riftEnsure();if(S.rift.biome!==biome)throw Error(`seed ${seed} is ${S.rift.biome}, expected ${biome}`);
        S.maps.rift=genMap({seed:hash("v15-map:"+seed),zone:RIFT_ZONE,heat:0});Object.keys(S.eq).forEach(k=>S.eq[k]=null);S.hp=pstats().maxHp;startBattle("w_rift_0",{rar:"normal",afx:[],depthMods:false});return S.battle;
      };
      window.findBiomeSeed=biome=>{for(let n=1;n<500;n++)if(riftMake(n,1).biome===biome)return n;throw Error("no seed for "+biome)};
    });
    const meta=await E(()=>({count:RIFT_BIOMES.length,seeds:Object.fromEntries(RIFT_BIOMES.map(b=>[b,findBiomeSeed(b)])),mods:Object.keys(RIFT_BIOME_MODS).sort()})),seeds=meta.seeds;
    ok(Object.keys(seeds).length===meta.count&&meta.mods.join(",")==="ash,astral,bone,deep,ember,fen,tundra"&&seeds.forest!==undefined&&seeds.tidewrack!==undefined,"all seven named passives map to seeded Rift biomes; Forest and Tidewrack remain neutral");
    console.log("biome fixture seeds",JSON.stringify(seeds));
    const deterministic=await E(seeds=>Object.entries(seeds).every(([biome,seed])=>riftMake(seed,1).biome===biome&&riftMake(seed,1).biome===riftMake(seed,1).biome),seeds);
    ok(deterministic,"rebuilding a saved biome seed selects the same passive without adding map-generation draws");
    let r=await E(seeds=>{
      const out={};
      ["fen","tundra","ember"].forEach(biome=>{
        const B=biomeState(biome,seeds[biome]),P={...pstats(),rs:{...pstats().rs}};ENEMIES[B.id].inf=null;B.you={};B.guard=false;inflict(B,P,null);out[biome]=B.you;
        const G=biomeState(biome,seeds[biome]);ENEMIES[G.id].inf=null;G.guard=true;inflict(G,P,null);out[biome+"Guarded"]=G.you;
      });
      const P={...pstats(),rs:{...pstats().rs,poison:40}},Rift=biomeState("fen",seeds.fen);ENEMIES[Rift.id].inf=null;inflict(Rift,P,null);out.resisted=Rift.you.poison.t;
      return out;
    },seeds);
    ok(r.fen.poison?.n===1&&r.fen.poison.t===3&&r.fen.poison.d>0,"Fen fog adds one mild Poison stack on a landed hit");
    ok(r.tundra.chill?.t===2&&r.ember.burn?.t===2&&r.ember.burn.d>0,"Tundra and Ember apply their short Chill and Burn statuses");
    ok(!r.fenGuarded.poison&&!r.tundraGuarded.chill&&!r.emberGuarded.burn,"Guard blocks biome status effects");
    ok(r.resisted===2,"matching resistance shortens guaranteed biome status instead of making it fail");
    r=await E(seeds=>{
      const B=biomeState("fen",seeds.fen),id=B.id;ENEMIES[id].inf=null;ENEMIES[id].sp={kind:"multi",name:"Test surge",tell:"testing",every:1,n:1,x:1};B.turn=1;B.parry=true;S.hp=pstats().maxHp;
      R(0,()=>enemyTurn());return{status:Object.keys(B.you).length,loss:pstats().maxHp-S.hp,parries:S.stats.parries};
    },seeds);
    ok(r.status===0&&r.loss===0&&r.parries===1,"a successful Parry interrupts a telegraphed special before biome statuses apply");
    r=await E(seeds=>{
      const make=(mods,turn)=>{const B=biomeState("ash",seeds.ash);B.biomeMods=mods;B.biome=mods?"ash":null;B.turn=turn;B.hp=B.max=100000;R(.99,()=>strike(null,100,"Check",true,{sure:1}));return 100000-B.hp};
      const normal=make(true,2),sand=make(true,3),reference=make(false,3);return{normal,sand,reference};
    },seeds);
    ok(r.sand<r.normal&&r.reference===r.normal,"Ash sandstorm weakens every third player turn while explicit reference mode disables it");
    r=await E(seeds=>{
      const B=biomeState("bone",seeds.bone);B.guard=false;B.turn=2;riftOnHit(B);const hit=B.off;endTurn(B);const next=B.off;riftOnHit(B);const repeated=B.off;endTurn(B);const recovered=B.off;
      const G=biomeState("bone",seeds.bone);G.guard=true;G.turn=2;riftOnHit(G);return{hit,next,repeated,recovered,guarded:G.off};
    },seeds);
    ok(r.hit===2&&r.next===1&&r.repeated===1&&r.recovered===0&&r.guarded===0,"Bone fear gives one recoverable off-balance action after an unguarded hit");
    r=await E(seeds=>{
      const run=(biomeMods)=>{const B=biomeState("astral",seeds.astral);B.biomeMods=biomeMods;B.biome=biomeMods?"astral":null;B.turn=3;B.atk=25;B.stun=0;B.frozen=false;B.parry=false;B.guard=false;B.spWard=0;B.you={};ENEMIES[B.id].sp={kind:"multi",name:"Test strike",tell:"testing",every:99,n:1,x:1};S.hp=pstats().maxHp;R(.99,()=>enemyTurn());return pstats().maxHp-S.hp};
      const active=run(true),reference=run(false);return{active,reference};
    },seeds);
    ok(r.active>r.reference,"Astral surge adds its Arcane attack multiplier on every third enemy turn");
    r=await E(seeds=>{
      const run=kind=>{const B=biomeState("deep",seeds.deep);B.turn=3;B.atk=1;B.hp=B.max=100000;ENEMIES[B.id].sp={kind:"multi",name:"Test strike",tell:"testing",every:3,n:1,x:1};B.parry=kind==="parry";B.guard=kind==="guard";B.stun=kind==="parry"?0:1;S.hp=pstats().maxHp;const max=pstats().maxHp;R(kind==="parry"?0:.99,()=>enemyTurn());return{loss:max-S.hp,expected:Math.round(max*.04),turn:B.turn,parries:S.stats.parries,log:B.log.some(x=>x.t.includes("Drowning pressure"))};};
      return{parry:run("parry"),guard:run("guard"),stun:run("stun")};
    },seeds);
    ok([r.parry,r.guard,r.stun].every(x=>x.loss===x.expected&&x.turn===4&&x.log)&&r.parry.parries===1,"Deep pressure ignores Guard and Parry and still pulses on a stunned turn");
    r=await E(seeds=>{
      const B=biomeState("deep",seeds.deep);B.turn=3;B.stun=1;S.hp=1;const before=S.stats.deaths;R(.99,()=>enemyTurn());return{died:S.stats.deaths===before+1,hp:S.hp,zone:S.zone,over:B.over};
    },seeds);
    ok(r.died&&r.hp>0&&r.zone==="rift"&&r.over==="lost","lethal deep pressure uses the normal defeat and map-reset path");
    r=await E(seeds=>{
      biomeState("fen",seeds.fen);const saved=JSON.parse(JSON.stringify(S)),loaded=loadSave(saved),newBiome=loaded.battle.biome;S=loaded;delete S.battle.biome;delete S.battle.biomeMods;const oldSaveBiome=riftModifier(S.battle)?.name;
      return{version:S.v,newBiome,oldSaveBiome,seed:S.rift.seed};
    },seeds);
    ok(r.version===18&&r.newBiome==="fen"&&r.oldSaveBiome==="Poison fog","active and pre-feature Rift saves retain the biome without a save-version bump");
    r=await E(seeds=>{
      const B=biomeState("ember",seeds.ember);ENEMIES[B.id].inf=null;S.run="daily";S.daily={zone:"rift",twist:"cinder",map:curMap()};B.you={};R(.99,()=>inflict(B,pstats(),null));return{burn:B.you.burn&&B.you.burn.d,expected:Math.round(B.atk*.3),t:B.you.burn&&B.you.burn.t,applied:S.stats.sufd};
    },seeds);
    ok(r.burn===r.expected&&r.t===2&&r.applied===1,"if a future daily overlaps Ember, cinder strengthens one merged Burn application rather than duplicating it");
    r=await E(seeds=>{
      biomeState("fen",seeds.fen);const seed=S.rift.seed;S.rift.cleared=1;R(.5,()=>riftDescend());return{depth:S.rift.depth,changed:S.rift.seed!==seed,map:!!S.maps.rift,biome:RIFT_BIOMES.includes(S.rift.biome),passive:riftModifier({biomeMods:true,biome:S.rift.biome})?.name||"Neutral"};
    },seeds);
    ok(r.depth===2&&r.changed&&r.map&&r.biome,"descending rebuilds the seeded map and selects the next biome passive");
    r=await E(seeds=>{
      const B=biomeState("fen",seeds.fen),saved=JSON.stringify(curMap()),same=B.biome;startBattle("w_rift_0",{biomeMods:false,rar:"normal",afx:[]});const off=!S.battle.biome;S.maps.rift=JSON.parse(saved);S.battle=null;
      S.zone="woods";S.run="daily";S.daily={zone:"woods",twist:"cinder",map:genMap({seed:9,zone:"woods",twist:"cinder"})};startBattle("boar",{});const daily=!S.battle.biome&&twistNow()==="cinder";return{same,off,daily,twist:twistNow()};
    },seeds);
    ok(r.same==="fen"&&r.off&&r.daily&&r.twist==="cinder","explicit reference mode disables passives; daily maps keep their independent twist rules");
    r=await E(seeds=>{const B=biomeState("astral",seeds.astral),stage=document.querySelector(".stage");return{visible:!!stage&&/Arcane surge/i.test(stage.innerText),fits:document.documentElement.scrollWidth<=innerWidth&&stage.scrollWidth<=stage.clientWidth+2}},seeds);
    ok(r.visible&&r.fits,"the active passive stays visible in the live battle HUD without mobile overflow");await p.screenshot({path:path.join(EVIDENCE,"v15-battle-mobile.png"),fullPage:true});
    r=await E(seeds=>{
      const B=biomeState("fen",seeds.fen),id=B.id;cx(id).stats=true;S.battle=null;S.view="battle";render();const el=document.querySelector(".rift.dcard"),card=el?.innerText||"",rect=el?.getBoundingClientRect();openCodex(id);const codex=document.querySelector("#sheetIn")?.innerText||"";return{card:/poison fog/i.test(card),cardFits:rect&&rect.width<=innerWidth&&rect.left>=0&&rect.right<=innerWidth,codex:/RIFT MODIFIER/i.test(codex)&&/poison fog/i.test(codex),overflow:document.querySelector("#sheetIn")?.scrollWidth<=document.querySelector("#sheetIn")?.clientWidth+2,cardText:card.slice(0,300),codexText:codex.slice(0,350)};
    },seeds);
    ok(r.card&&r.cardFits,"active biome and passive are visible on the Rift card at 390×844");ok(r.codex&&r.overflow,"Codex explains the current Rift modifier without horizontal overflow");
    await E(()=>{closeSheet();S.battle=null;render();document.querySelector(".rift.dcard")?.scrollIntoView({block:"center"})});await p.waitForTimeout(2200);await p.screenshot({path:path.join(EVIDENCE,"v15-rift-card-mobile.png")});
    await E(seeds=>{biomeState("fen",seeds.fen);cx(S.battle.id).stats=true;openCodex(S.battle.id)},seeds);await p.waitForTimeout(2200);await p.screenshot({path:path.join(EVIDENCE,"v15-codex-mobile.png")});
    ok(errs.length===0,"no browser errors ("+errs.join("; ")+")");
  }finally{await browser.close()}
  if(fails)process.exit(1);console.log("All V-15 biome checks passed.");
})().catch(e=>{console.error(e);process.exit(1)});
