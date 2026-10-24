#!/usr/bin/env node
// Balance simulator: plays battles and whole expeditions in the real game code (startBattle, attack, parry, ability, useItem, visit, pstats...)
// in headless Chromium, with render/save/fx/sfx/toast stubbed. Kits are crafted with the real combine().
// Usage: node tools/sim.js [--n 40] [--zone woods,pass] [--enemy wolf,archon] [--kit melee,spire-end] [--heat 0,3,5] [--policy smart,basic,passive]
//        [--seed 7] [--elite] [--row 3] [--all] [--jobs 4] [--out sim.json] [--econ-only | --no-econ] [--exped 30]
const {chromium}=require("playwright"),path=require("path"),fs=require("fs"),os=require("os");
const URL="file://"+path.resolve(__dirname,"..","index.html");

// ---------- kit table ----------
// Smith level/XP per stage. A stage kit is what a player plausibly owns when they finish that zone.
const STAGES={woods:{label:"woods-end",xp:160},pass:{label:"pass-end",xp:560},hollow:{label:"hollow-end",xp:1400},spire:{label:"spire-end",xp:3200}};
// Each step crafts with the real combine(): [slot or "", label, "input input input"] (a single input is a raw drop, equipped as is). Inputs: a base item id, "ess:Trait" (plain essence), "ess:Trait:2" (refined),
// or "$label" for an earlier step. The crafted item is equipped in the slot (consumables have no slot). inf = traits to infuse (repeat a trait for rank II/III),
// carry = spare consumables (base id: count; crafted labels work too). Essences and base items are simply granted, so the "ess" count printed is what the kit assumes you salvaged.
const KITS={
  melee:{ // balanced blade + shield; most armor is still the raw drop, the weapon and shield are crafted
    woods:{steps:[["main","sword","iron_sword gnarl_tusk ess:Sharp"],["off","shield","wood_shield boar_hide"],["head","helm","leather_cap"],["body","body","jerkin"],["hands","gloves","hide_gloves"],["feet","boots","trail_boots"],["charm","charm","sprite_lantern"]],inf:["Sharp"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","sword","iron_sword rime_fang ess:Sharp"],["off","shield","wood_shield pelt ess:Iron"],["head","helm","iron_helmet"],["body","body","stone_plate"],["hands","gloves","hide_gloves pelt"],["feet","boots","trail_boots pelt ess:Swift"],["charm","charm","fang_charm"],
      ["","potion","holy_water spring_water"]],inf:["Sharp","Iron"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","sword","iron_sword phoenix ess:Sharp"],["off","shield","wood_shield pelt ess:Iron"],["head","helm","iron_helmet pelt ess:Iron"],["body","body","stone_plate pelt ess:Stone"],["hands","gloves","wraith_wraps"],["feet","boots","ember_treads trail_boots ess:Swift"],["charm","charm","witch_eye"],
      ["","potion","holy_water spring_water ess:Nourishing"]],inf:["Sharp","Iron","Swift"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","s1","iron_sword phoenix ess:Sharp"],["main","sword","$s1 ess:Sharp ess:Sharp"],["off","shield","sentinel_aegis"],["head","helm","iron_helmet golem_core ess:Iron"],["body","body","stone_plate golem_core ess:Stone"],["hands","gloves","wraith_wraps rune_shard ess:Swift"],
      ["feet","boots","gale_boots"],["charm","charm","witch_eye ess:Sharp ess:Holy"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Sharp","Sharp","Iron","Swift"],carry:{potion:3,storm_draught:1}}},
  defensive:{ // Stone / Iron / Runic heavy, slow and hard to hurt
    woods:{steps:[["main","sword","iron_sword boar_hide ess:Iron"],["off","shield","wood_shield boar_hide ess:Stone"],["head","helm","leather_cap boar_hide ess:Iron"],["body","body","jerkin boar_hide ess:Stone"],
      ["hands","gloves","hide_gloves boar_hide ess:Iron"],["feet","boots","trail_boots boar_hide ess:Stone"],["charm","charm","sprite_lantern ess:Stone"]],inf:["Stone"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","sword","iron_sword golem_core ess:Iron"],["off","shield","wood_shield golem_core ess:Stone"],["head","helm","iron_helmet golem_core ess:Iron"],["body","body","stone_plate golem_core ess:Stone"],
      ["hands","gloves","hide_gloves golem_core ess:Iron"],["feet","boots","trail_boots golem_core ess:Stone"],["charm","charm","fang_charm ess:Stone ess:Iron"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Stone","Iron"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","sword","iron_sword golem_core ess:Iron"],["off","shield","wood_shield golem_core ess:Stone"],["head","helm","iron_helmet golem_core ess:Iron"],["body","body","stone_plate golem_core ess:Arcane"],
      ["hands","gloves","hide_gloves golem_core ess:Iron"],["feet","boots","ember_treads golem_core ess:Stone"],["charm","charm","fang_charm ess:Stone ess:Arcane"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Stone","Iron","Arcane"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","sword","iron_sword golem_core ess:Iron"],["off","shield","sentinel_aegis golem_core ess:Stone"],["head","helm","iron_helmet golem_core ess:Arcane"],["body","body","stone_plate rune_shard ess:Stone"],
      ["hands","gloves","hide_gloves golem_core ess:Iron"],["feet","boots","ember_treads golem_core ess:Stone"],["charm","charm","fang_charm ess:Stone ess:Arcane"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Stone","Arcane","Iron","Stone"],carry:{potion:3,storm_draught:1}}},
  staff:{ // Magic-heavy staff caster in lighter armor
    woods:{steps:[["main","staff","oak_staff oak_staff ess:Arcane"],["head","helm","leather_cap"],["body","body","jerkin"],["feet","boots","trail_boots"],["charm","charm","sprite_lantern"]],inf:["Arcane"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","staff","$s1 pelt ess:Fire"],["head","helm","leather_cap pelt"],["body","body","jerkin pelt"],["hands","gloves","wraith_wraps"],["feet","boots","trail_boots"],
      ["charm","charm","sprite_lantern ess:Arcane"],["","potion","holy_water spring_water"]],inf:["Arcane","Fire"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","staff","$s1 phoenix ess:Arcane"],["head","helm","leather_cap shroud"],["body","body","jerkin shroud ess:Arcane"],["hands","gloves","wraith_wraps"],["feet","boots","ember_treads"],
      ["charm","charm","witch_eye"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Arcane","Fire","Holy"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","s1","oak_staff rune_shard ess:Arcane"],["main","s2","$s1 phoenix ess:Arcane"],["main","staff","$s2 star_heart ess:Arcane ess:Holy"],["head","helm","leather_cap void_crystal"],["body","body","void_robe"],
      ["hands","gloves","wraith_wraps rune_shard ess:Arcane"],["feet","boots","gale_boots"],["charm","charm","witch_eye void_crystal ess:Arcane"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Arcane","Arcane","Fire","Holy"],carry:{potion:3,storm_draught:1}}},
  stacked:{ // min-max: one trait hammered into each piece (item + essences, again and again) plus infusions, to see how far stacking runs away
    woods:{steps:[["main","s1","iron_sword gnarl_tusk ess:Sharp"],["main","s2","$s1 ess:Sharp ess:Sharp"],["main","sword","$s2 ess:Sharp ess:Sharp"],["body","b1","jerkin boar_hide ess:Iron"],["body","body","$b1 ess:Iron ess:Iron"],["feet","boots","trail_boots ess:Swift ess:Swift"],["off","shield","wood_shield boar_hide ess:Iron"]],inf:["Sharp"],carry:{bread:3}},
    pass:{steps:[["main","s1","iron_sword rime_fang ess:Sharp"],["main","s2","$s1 ess:Sharp ess:Sharp"],["main","s3","$s2 ess:Sharp ess:Sharp"],["main","sword","$s3 ess:Sharp ess:Sharp"],["body","b1","stone_plate golem_core ess:Iron"],["body","b2","$b1 ess:Iron ess:Iron"],["body","body","$b2 ess:Iron ess:Iron"],
      ["feet","b3","trail_boots ess:Swift ess:Swift"],["feet","boots","$b3 ess:Swift ess:Swift"],["off","shield","wood_shield golem_core ess:Iron"]],inf:["Sharp","Sharp","Swift"],carry:{bread:3}},
    hollow:{steps:[["main","s1","iron_sword rime_fang ess:Sharp"],["main","s2","$s1 ess:Sharp:2 ess:Sharp:2"],["main","s3","$s2 ess:Sharp:2 ess:Sharp:2"],["main","sword","$s3 ess:Sharp:2 ess:Sharp:2"],["body","b1","stone_plate golem_core ess:Iron:2"],["body","b2","$b1 ess:Iron:2 ess:Iron:2"],["body","body","$b2 ess:Iron:2 ess:Iron:2"],
      ["head","h1","iron_helmet golem_core ess:Iron:2"],["head","helm","$h1 ess:Iron:2 ess:Iron:2"],["feet","b3","trail_boots ess:Swift:2 ess:Swift:2"],["feet","boots","$b3 ess:Swift:2 ess:Swift:2"],["off","shield","wood_shield golem_core ess:Iron:2"]],inf:["Sharp","Sharp","Sharp","Swift"],carry:{bread:3}},
    spire:{steps:[["main","s1","iron_sword rime_fang ess:Sharp"],["main","s2","$s1 ess:Sharp:2 ess:Sharp:2"],["main","s3","$s2 ess:Sharp:2 ess:Sharp:2"],["main","s4","$s3 ess:Sharp:2 ess:Sharp:2"],["main","s5","$s4 ess:Sharp:2 ess:Sharp:2"],["main","sword","$s5 ess:Sharp:2 ess:Sharp:2 ess:Sharp:2"],
      ["body","b1","stone_plate golem_core ess:Iron:2"],["body","b2","$b1 ess:Iron:2 ess:Iron:2"],["body","b3","$b2 ess:Iron:2 ess:Iron:2"],["body","body","$b3 ess:Iron:2 ess:Iron:2 ess:Iron:2"],["head","h1","iron_helmet golem_core ess:Iron:2"],["head","helm","$h1 ess:Iron:2 ess:Iron:2 ess:Iron:2"],
      ["feet","f1","trail_boots ess:Swift:2 ess:Swift:2"],["feet","boots","$f1 ess:Swift:2 ess:Swift:2 ess:Swift:2"],["off","shield","sentinel_aegis ess:Iron:2 ess:Iron:2 ess:Iron:2"]],inf:["Sharp","Sharp","Sharp","Swift","Swift"].slice(0,4),carry:{bread:3}}}
};
const ESS_BUDGET={woods:12,pass:24,hollow:36,spire:50}; // loose upper bound of essences a normal player has by then; stacked is exempt (it is the stress test)
// ---------- CLI ----------
const argv=process.argv.slice(2),has=f=>argv.includes("--"+f),opt=(f,d)=>{const i=argv.indexOf("--"+f);return i>=0&&argv[i+1]&&!argv[i+1].startsWith("--")?argv[i+1]:d};
const list=(f,d)=>{const v=opt(f,null);return v?v.split(","):d};
const N=+opt("n",40),SEED=opt("seed",null),ROW=+opt("row",3),JOBS=Math.max(1,+opt("jobs",Math.min(4,os.cpus().length))),HEATS=list("heat",["0","3","5"]).map(Number),POLS=list("policy",["smart","basic","passive"]),EXPED=+opt("exped",30);
const OUT=opt("out",null);

// ---------- in-page simulator ----------
function setup(){ // runs inside the game page; everything here uses the real game functions
  ["render","save","fx","sfx","toast","closeSheet","flushFx"].forEach(f=>window[f]=()=>{});
  const mulberry=a=>()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const realRandom=Math.random,seedFor=(seed,key)=>seed==null?null:mulberry(hash(seed+"|"+key));
  const useSeed=(seed,key)=>{Math.random=seed==null?realRandom:seedFor(seed,key)};
  const ref=s=>s.startsWith("ess:")?(s.endsWith(":2")?refined(s.split(":")[1]):essence(s.split(":")[1])):s;
  const SIM=window.SIM={kits:{}};
  // craft a kit with combine(), equip it, infuse. Returns the save snapshot and a summary
  SIM.build=(k,stage,xp)=>{
    S=freshState();S.xp=xp;S.unlocked=ZONES.map(z=>z[0]);S.zone=stage;const out={},warn=[];let ess=0;
    const need=id=>{if(id.startsWith("ess:")){ess+=id.endsWith(":2")?3:1;const r=ref(id);addItem(r);return r}if(!S.items[id])warn.push("unknown "+id);return id};
    k.steps.forEach(([slot,as,ins])=>{
      const ids=ins.split(" ").map(i=>i[0]==="$"?out[i.slice(1)]:need(i));
      if(ids.length===1){addItem(ids[0]);out[as]=ids[0];if(slot)equip(ids[0],slot);return} // an uncrafted drop, worn as it fell
      if(ids.length>maxInputs())warn.push(`${as}: ${ids.length} inputs at Smith Lv ${level()} (max ${maxInputs()})`);
      ids.forEach(i=>{if(i[0]!=="$"&&!S.inv[i])addItem(i)});
      const c=combine(ids.map(i=>S.items[i]));if(c.mishap)warn.push(`${as}: ${c.mishap}`);if(c.log.some(l=>l.k==="Lost"))warn.push(`${as}: lost ${c.log.find(l=>l.k==="Lost").t}`);
      S.items[c.item.id]=c.item;addItem(c.item.id);out[as]=c.item.id;if(slot)equip(c.item.id,slot)});
    (k.inf||[]).forEach(t=>{addItem(essence(t),3);ess+=3;if(!infusable().includes(t))warn.push("cannot infuse "+t);infuse(t)});
    Object.entries(k.carry||{}).forEach(([id,n])=>{if(out[id])addItem(out[id],n-(S.inv[out[id]]||0)>0?n-(S.inv[out[id]]||0):0);else if(n)addItem(id,n)});
    S.hp=pstats().maxHp;const P=pstats(),st=id=>statsOf(S.items[id]);
    const gear=SLOTS.map(([s])=>{const it=gearOf(s);return it&&`${s}:${it.name}`}).filter(Boolean);
    const sum={lv:level(),atk:P.atk,mag:P.mag,def:P.def,red:Math.round(P.red*100),hp:P.maxHp,spd:P.spd,regen:P.regen,ward:P.ward,thorns:P.thorns,dr:P.dr,dodge:P.dodge,root:P.root,cleanse:P.cleanse,res:P.rs,
      crit:Math.round(Math.min(CRIT_CAP,5+(P.main?withInnate(P.main.traits).Sharp||0:0)*3)),abil:abKeys(P),main:P.main&&P.main.name,form:P.main&&P.main.form,shield:!!P.shield,infuse:{...S.infuse},ess,warn,gear,heals:Object.keys(S.inv).filter(id=>grp(S.items[id])==="consumable").map(id=>`${S.items[id].name} x${S.inv[id]} (${medHeal(S.items[id])})`)};
    return {snap:JSON.stringify(S),sum};
  };
  const POL={
    passive:()=>attack(),
    basic:B=>{const sp=isSpecial(B)?foeOf(B).sp:null;if(sp&&sp.kind!=="heal"&&!B.frozen&&!B.stun&&!(B.off>0))guard();else attack()},
    smart:B=>{const sp=isSpecial(B)?foeOf(B).sp:null,P=pstats();
      if(sp&&!B.frozen&&!B.stun&&!(B.off>0))return parry(); // the telegraph is reliable, so parrying a special is always a perfect parry (and breaks a heal)
      if(S.hp<P.maxHp*.35){const hs=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable"&&medHeal(S.items[id])>0).sort((a,b)=>medHeal(S.items[b])-medHeal(S.items[a]));if(hs.length)return useItem(hs[0])}
      const ready=abKeys(P).find(a=>!(B.cd&&B.cd[a]>0));if(ready)return ability(ready);
      attack()}
  };
  // one fight on a fresh copy of the kit's save; returns {w,t,hp}
  SIM.fight=(snap,id,heat,pol,o)=>{
    S=JSON.parse(snap);const E=ENEMIES[id];S.zone=id==="mimic"?o.zone:E.zone;S.hp=pstats().maxHp;S.maps[S.zone]={heat,rows:[],path:[]};S.run=null;
    startBattle(id,{row:E.boss||id==="mimic"?0:o.row,up:!!o.elite,elite:!!o.elite,af:o.af});
    const B=S.battle;let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600)POL[pol](B);
    const won=B.over==="won";return{w:won?1:0,t:B.turn,hp:won?S.hp/pstats().maxHp:0,stall:!B.over?1:0};
  };
  // run a list of cells [{k,e,h,p}] n times each, deterministic per cell if seeded
  SIM.cells=(cells,n,o)=>cells.map(c=>{
    const kit=SIM.kits[c.k];useSeed(o.seed,[c.k,c.e,c.h,c.p].join());let w=0,t=0,hp=0,stall=0;
    for(let i=0;i<n;i++){const r=SIM.fight(kit.snap,c.e,c.h,c.p,{...o,af:i%AFFIXES.length,zone:kit.zone});w+=r.w;t+=r.t;hp+=r.hp;stall+=r.stall}
    return{...c,n,win:w/n,turns:t/n,hp:hp/n,stall:stall/n}});
  // ---- economy: whole expeditions through visit() ----
  const essCount=()=>Object.keys(S.inv).filter(id=>isEss(id)||isRefined(id)).reduce((a,id)=>a+S.inv[id]*(isRefined(id)?REFINE_N:1),0);
  const itemCount=()=>Object.values(S.inv).reduce((a,b)=>a+b,0);
  SIM.exped=(snap,zone,heat,pol,seedKey,seed)=>{
    useSeed(seed,seedKey);S=JSON.parse(snap);S.zone=zone;S.embers=0;S.hp=pstats().maxHp;S.camp=2;S.maps[zone]=genMap({heat});S.stats.earned=0;
    const r={won:0,lost:0,fights:0,elites:0,shops:[],visits:{},hp0:S.hp},e0=essCount(),i0=itemCount();let steps=0;
    const fightOut=()=>{const B=S.battle;let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600)POL[pol](B);r.fights++;if(B.elite)r.elites++;return B.over};
    const settle=()=>{
      for(let k=0;k<12;k++){
        if(S.battle&&!S.battle.over){if(fightOut()==="lost")return false;continue}
        const ev=S.event;if(!ev||!ev.choices.length)return true;
        const ids=ev.choices.map(c=>c[0]),has=x=>ids.includes(x);let c="leave";
        if(ev.type==="merchant"){const gear=ev.stock.filter(s=>!isEss(s.id)),es=ev.stock.filter(s=>isEss(s.id));r.shops.push({emb:S.embers,gear:gear.map(s=>s.price),ess:es.map(s=>s.price)});c="leave"}
        else if(ev.type==="chest")c="open";
        else if(ev.type==="camp")c=S.hp<pstats().maxHp*.7?"rest":has("embers")?"embers":"rest";
        else if(ev.type==="shrine")c=S.hp<pstats().maxHp*.75?"pray":has("offer")?"offer":"leave";
        else if(ev.type==="altar")c=has("small")&&S.hp>pstats().maxHp*.7?"small":"leave";
        else if(ev.type==="alchemist")c=has("swap")?"swap":has("lesson")?"lesson":"leave";
        else if(ev.type==="traveller")c=has("tend")?"tend":"leave";
        else if(ev.type==="forge")c=ids.find(x=>x.startsWith("temper:"))||"warm";
        else if(ev.type==="riddle")c=`ans:${Math.floor(Math.random()*3)}`;
        if(!has(c))c=has("leave")?"leave":ids[0];
        eventChoice(c);if(c==="leave")S.event=null}
      return true};
    while(steps++<40){
      const m=curMap(),open=openNodes(m);if(!open.length)break;
      if(S.hp<pstats().maxHp*.5&&S.camp>0)rest();
      const safe=S.hp<pstats().maxHp*.6?open.filter(([a,b])=>m.rows[a][b].t!=="elite"):open,from=safe.length?safe:open,[a,b]=from[Math.floor(Math.random()*from.length)];
      const t=m.rows[a][b].t;r.visits[t]=(r.visits[t]||0)+1;visit(a,b);
      if(!settle()){r.lost=1;break}
      if(S.battle&&S.battle.over==="won"&&ENEMIES[S.battle.id].boss){r.won=1;break}}
    return{...r,embers:S.stats.earned,ess:essCount()-e0,items:itemCount()-i0,steps};
  };
}

// ---------- node side ----------
const pct=x=>Math.round(x*100),f1=x=>(Math.round(x*10)/10).toFixed(1),median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0};
const kitName=(t,z)=>`${t}/${z}`;
function flagsOf(c,kz,E){ // on-stage = the kit's own zone (the mimic scales to the kit's zone)
  const fl=[];if(!(E.zone===kz||c.e==="mimic"))return fl;
  if(c.h===0&&c.win===1&&c.hp>.9)fl.push("TOO_EASY");
  if(c.h===0&&c.win<.5)fl.push("TOO_HARD");
  if(c.turns>(E.boss?50:30))fl.push("SLOG");return fl}
async function newPage(browser){const p=await browser.newPage();p.on("pageerror",e=>{console.error("pageerror:",e.message)});await p.goto(URL);await p.waitForFunction(()=>typeof S==="object"&&S);await p.evaluate(setup);return p}
async function main(){
  const t0=Date.now(),browser=await chromium.launch();
  const pages=await Promise.all(Array.from({length:JOBS},()=>newPage(browser))),P0=pages[0];
  const zones=list("zone",["woods","pass","hollow","spire"]),kitSel=list("kit",null);
  const enemiesAll=await P0.evaluate(()=>Object.entries(ENEMIES).map(([id,e])=>({id,zone:e.zone,boss:!!e.boss,name:e.name})));
  const eSel=list("enemy",null),enemies=enemiesAll.filter(e=>(eSel?eSel.includes(e.id):(e.zone==="any"||zones.includes(e.zone))));
  // build kits (identical on every page: combine is deterministic)
  const kits=[];for(const [type,byStage] of Object.entries(KITS))for(const [z,def] of Object.entries(byStage)){
    const name=kitName(type,z);if(kitSel&&!kitSel.some(s=>name.includes(s)||STAGES[z].label===s))continue;kits.push({name,type,zone:z,def})}
  const sums={};
  for(const k of kits){const b=await P0.evaluate(([d,z,xp])=>{const r=SIM.build(d,z,xp);return r},[k.def,k.zone,STAGES[k.zone].xp]);sums[k.name]=b.sum;
    await Promise.all(pages.map(p=>p.evaluate(([n,z,s])=>{SIM.kits[n]={snap:s,zone:z}},[k.name,k.zone,b.snap])))}
  console.log(`== Kits (${kits.length}) ==`);
  for(const k of kits){const s=sums[k.name],over=k.type!=="stacked"&&s.ess>ESS_BUDGET[k.zone];
    console.log(`${k.name.padEnd(17)} Lv${s.lv} HP${String(s.hp).padEnd(3)} ATK${String(s.atk).padEnd(3)} MAG${String(s.mag).padEnd(3)} DEF${String(s.def).padEnd(3)}(${s.red}%) SPD${String(s.spd).padEnd(2)} crit${s.crit}% | ${s.main||"fists"} [${s.abil.join(",")||"-"}] | ward${s.ward} thorn${s.thorns}% dr${s.dr} dodge${s.dodge}% regen${s.regen} root${s.root} cl${s.cleanse} res${JSON.stringify(s.res)} inf${JSON.stringify(s.infuse)} ess${s.ess}${over?"(!)":""}`);
    if(s.warn.length)console.log(`   warn: ${s.warn.join("; ")}`)}
  // matrix
  const result={args:{n:N,seed:SEED,row:ROW,heats:HEATS,policies:POLS,elite:has("elite")},kits:sums,cells:[],econ:[]};
  if(!has("econ-only")){
    const cells=[];for(const k of kits)for(const e of enemies)for(const h of HEATS)for(const p of POLS){cells.push({k:k.name,e:e.id,h,p});}
    const variants=has("elite")?[false,true]:[false];const todo=[];variants.forEach(el=>cells.forEach(c=>{if(el&&(enemiesAll.find(e=>e.id===c.e).boss||c.e==="mimic"))return;todo.push({c:{...c},el})}));
    const chunks=Array.from({length:JOBS},()=>[]);todo.forEach((x,i)=>chunks[i%JOBS].push(x));let done=0;
    const res=(await Promise.all(chunks.map((ch,i)=>(async()=>{const out=[];
      for(let j=0;j<ch.length;j+=60){const part=ch.slice(j,j+60),els=[...new Set(part.map(x=>x.el))];
        for(const el of els){const sub=part.filter(x=>x.el===el).map(x=>x.c),r=await pages[i].evaluate(([c,n,o])=>SIM.cells(c,n,o),[sub,N,{seed:SEED,row:ROW,elite:el}]);r.forEach(x=>out.push({...x,el}));done+=sub.length}
        if(process.stderr.isTTY)process.stderr.write(`\rmatrix ${done}/${todo.length} cells  ${Math.round((Date.now()-t0)/1000)}s`)}
      return out})()))).flat();if(process.stderr.isTTY)process.stderr.write("\n");
    const E=Object.fromEntries(enemiesAll.map(e=>[e.id,e])),K=Object.fromEntries(kits.map(k=>[k.name,k]));
    res.forEach(c=>{c.flags=c.el?[]:flagsOf(c,K[c.k].zone,E[c.e]);c.enemy=c.e+(c.el?"*":"")});
    res.sort((a,b)=>enemies.findIndex(e=>e.id===a.e)-enemies.findIndex(e=>e.id===b.e)||(a.el-b.el)||kits.findIndex(k=>k.name===a.k)-kits.findIndex(k=>k.name===b.k)||POLS.indexOf(a.p)-POLS.indexOf(b.p)||a.h-b.h);
    result.cells=res;
    // table: one row per enemy/kit/policy, a column per heat: win% turns hp%
    console.log(`\n== Matrix: ${N} fights per cell, seed ${SEED??"random"}, map row ${ROW}${has("elite")?", * = elite":""}. Columns per heat: win% / mean turns / mean HP left% (losses count 0). On-stage rows marked > ==`);
    console.log(`${"enemy".padEnd(11)}${"kit".padEnd(17)}${"policy".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(17)).join("")}flags`);
    const groups={};res.forEach(c=>{const key=[c.enemy,c.k,c.p].join("|");(groups[key]=groups[key]||[]).push(c)});
    Object.values(groups).forEach(g=>{const c0=g[0],on=E[c0.e].zone===K[c0.k].zone||c0.e==="mimic";if(!on&&!has("all"))return;
      console.log(`${(on?">":" ")+c0.enemy.padEnd(10)}${c0.k.padEnd(17)}${c0.p.padEnd(8)}${HEATS.map(h=>{const c=g.find(x=>x.h===h);return c?`${String(pct(c.win)).padStart(3)}% ${f1(c.turns).padStart(5)}t ${String(pct(c.hp)).padStart(3)}%`.padEnd(17):"".padEnd(17)}).join("")}${[...new Set(g.flatMap(x=>x.flags))].join(" ")}`)});
    // compact win% grids: every policy at the first heat, plus the last heat for the first policy
    const grid=(gp,gh)=>{console.log(`\n== Win% grid (policy ${gp}, Heat ${gh}; rows = kits, columns = enemies) ==`);
      console.log("".padEnd(17)+enemies.map(e=>e.id.slice(0,4).padStart(5)).join(""));
      kits.forEach(k=>console.log(k.name.padEnd(17)+enemies.map(e=>{const c=res.find(x=>x.k===k.name&&x.e===e.id&&x.p===gp&&x.h===gh&&!x.el);return c?String(pct(c.win)).padStart(5):"    -"}).join("")))};
    POLS.forEach(p=>grid(p,HEATS[0]));if(HEATS.length>1)grid(POLS[0],HEATS[HEATS.length-1]);
    // kit strength: on-stage enemies only (regulars + boss + mimic), mean over the first policy; stacked/melee shows how far stacking runs away
    const gp=POLS[0];console.log(`\n== Kit strength on-stage (policy ${gp}): mean turns to finish / mean HP left% / win% ==`);
    HEATS.forEach(h=>{console.log(`Heat ${h}`.padEnd(10)+Object.keys(KITS).map(t=>t.padEnd(22)).join(""));
      Object.keys(STAGES).filter(z=>kits.some(k=>k.zone===z)).forEach(z=>console.log(z.padEnd(10)+Object.keys(KITS).map(t=>{const xs=res.filter(c=>c.k===kitName(t,z)&&c.p===gp&&c.h===h&&!c.el&&(E[c.e].zone===z||c.e==="mimic"));
        return(xs.length?`${f1(xs.reduce((a,c)=>a+c.turns,0)/xs.length)}t ${pct(xs.reduce((a,c)=>a+c.hp,0)/xs.length)}% ${pct(xs.reduce((a,c)=>a+c.win,0)/xs.length)}%`:"-").padEnd(22)}).join("")))});
    const fl=res.filter(c=>c.flags.length);
    console.log(`\n== Flagged cells (on-stage kit vs its zone's enemies, mimic included): ${fl.length} ==`);
    ["TOO_EASY","TOO_HARD","SLOG"].forEach(f=>{const xs=fl.filter(c=>c.flags.includes(f));console.log(`${f}: ${xs.length} cells`);
      POLS.forEach(p=>{const ys=xs.filter(c=>c.p===p);if(!ys.length)return;const by={};ys.forEach(c=>{const key=`${c.k}@H${c.h}`;(by[key]=by[key]||[]).push(c.enemy)});
        console.log(`  [${p}] ${ys.length}`);Object.entries(by).forEach(([k,v])=>console.log(`    ${k.padEnd(20)} ${v.join(" ")}`))})});
  }
  // economy
  if(!has("no-econ")){
    const ez=list("zone",["woods","pass","hollow","spire"]),eh=HEATS[0],ep=POLS.includes("smart")?"smart":POLS[0],ek=kits.filter(k=>k.type==="melee"||kitSel);
    console.log(`\n== Economy: ${EXPED} expeditions per zone, ${ep} policy, balanced kit, Heat ${eh} (embers are fight rewards; shops are not bought from) ==`);
    const cols=[["zone",8],["kit",14],["clear%",7],["lost%",6],["fights",7],["embers",7],["ess",5],["items",6],["shops",6],["gear price min-med-max",23],["ess price",10],["embers@shop",12],["gear/exp",8]];
    console.log(cols.map(([c,w])=>c.padEnd(w)).join(""));
    for(const z of ez){const k=kits.find(k=>k.zone===z&&k.type==="melee")||kits.find(k=>k.zone===z);if(!k)continue;
      const ids=Array.from({length:EXPED},(_,i)=>i),chunks=Array.from({length:JOBS},(_,j)=>ids.filter(i=>i%JOBS===j));
      const rs=(await Promise.all(chunks.map((ch,j)=>pages[j].evaluate(([n,zz,h,p,ids,seed])=>ids.map(i=>SIM.exped(SIM.kits[n].snap,zz,h,p,"exp"+zz+i,seed)),[k.name,z,eh,ep,ch,SEED])))).flat();
      const avg=f=>rs.reduce((a,r)=>a+f(r),0)/rs.length,shops=rs.flatMap(r=>r.shops),gear=shops.flatMap(s=>s.gear),essP=shops.flatMap(s=>s.ess);
      const row={zone:z,kit:k.name,clear:avg(r=>r.won),lost:avg(r=>r.lost),fights:avg(r=>r.fights),embers:avg(r=>r.embers),ess:avg(r=>r.ess),items:avg(r=>r.items),shops:shops.length/rs.length,
        gear:gear.length?[Math.min(...gear),median(gear),Math.max(...gear)]:null,essPrice:essP.length?[Math.min(...essP),Math.max(...essP)]:null,embAtShop:shops.length?shops.reduce((a,s)=>a+s.emb,0)/shops.length:0,
        affordable:gear.length?avg(r=>r.embers)/median(gear):0,exped:rs.length};
      result.econ.push(row);
      console.log([z,k.name,pct(row.clear),pct(row.lost),f1(row.fights),f1(row.embers),f1(row.ess),f1(row.items),f1(row.shops),row.gear?row.gear.join("-"):"-",row.essPrice?[...new Set(row.essPrice)].join("-"):"-",f1(row.embAtShop),f1(row.affordable)].map((v,i)=>String(v).padEnd(cols[i][1])).join(""))}
    console.log("embers/ess/items are per expedition (ess = plain-equivalent essences gained; items = all drops). gear/exp = embers per expedition / median shop gear price: about how many gear items one expedition's embers could buy.");
  }
  await browser.close();
  if(OUT){fs.writeFileSync(OUT,JSON.stringify(result));console.log(`\nwrote ${OUT}`)}
  console.log(`done in ${Math.round((Date.now()-t0)/1000)}s`);
}
main().catch(e=>{console.error(e);process.exit(1)});
