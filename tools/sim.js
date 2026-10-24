#!/usr/bin/env node
// Balance simulator: plays battles and whole expeditions in the real game code (startBattle, attack, parry, ability, useItem, visit, pstats...)
// in headless Chromium, with render/save/fx/sfx/toast stubbed. Kits are crafted with the real combine().
// Usage: node tools/sim.js [--n 40] [--zone woods,pass] [--enemy wolf,archon] [--kit melee,spire-end] [--heat 0,3,5] [--policy smart,basic,passive]
//        [--seed 7] [--elite] [--row 3] [--all] [--attrition] [--no-mastered] [--jobs 4] [--out sim.json] [--econ-only | --no-econ] [--exped 30]
const {chromium}=require("playwright"),path=require("path"),fs=require("fs"),os=require("os");
const URL="file://"+path.resolve(__dirname,"..","index.html");

// ---------- kit table ----------
// Smith level/XP per stage. A stage kit is what a player plausibly owns when they finish that zone.
const STAGES={woods:{label:"woods-end",xp:160,sk:80},pass:{label:"pass-end",xp:560,sk:280},hollow:{label:"hollow-end",xp:1400,sk:680},spire:{label:"spire-end",xp:3200,sk:1350}}; // sk = XP in every crafting skill (Lv 3 / 5 / 7 / 9): what a focused player has by then
// Each step crafts with the real combine(): [slot or "", label, "input input input"] (a single input is a raw drop, equipped as is). Inputs: a base item id, "ess:Trait" (plain essence), "ess:Trait:4" (grade 4, Greater; 1-5, 3 = Plain), "golem_core@4" (a graded material),
// or "$label" for an earlier step. The crafted item is equipped in the slot (consumables have no slot). inf = traits to infuse (repeat a trait for rank II/III),
// carry = spare consumables (base id: count; crafted labels work too). Essences and base items are simply granted, so the "ess" count printed is what the kit assumes you salvaged.
const KITS={
  melee:{ // balanced blade + shield; most armor is still the raw drop, the weapon and shield are crafted
    woods:{steps:[["main","sword","iron_sword gnarl_tusk ess:Sharp"],["off","shield","wood_shield boar_hide"],["head","helm","leather_cap"],["body","body","jerkin"],["hands","gloves","hide_gloves"],["feet","boots","trail_boots"],["charm","charm","sprite_lantern"]],inf:["Sharp"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","sword","iron_sword rime_fang ess:Sharp"],["off","shield","wood_shield pelt ess:Iron"],["head","helm","iron_helmet"],["body","body","stone_plate"],["hands","gloves","hide_gloves pelt"],["feet","boots","trail_boots pelt ess:Swift"],["charm","charm","fang_charm"],
      ["","potion","holy_water spring_water"]],inf:["Sharp","Iron"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","sword","iron_sword phoenix ess:Sharp:4"],["off","shield","wood_shield pelt ess:Iron"],["head","helm","iron_helmet pelt ess:Iron"],["body","body","stone_plate pelt ess:Stone"],["hands","gloves","wraith_wraps"],["feet","boots","ember_treads trail_boots ess:Swift"],["charm","charm","witch_eye"],
      ["","potion","holy_water spring_water ess:Nourishing"]],inf:["Sharp","Iron","Swift"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","s1","iron_sword phoenix ess:Sharp:4"],["main","sword","$s1 ess:Sharp ess:Sharp"],["off","shield","sentinel_aegis"],["head","helm","iron_helmet golem_core@4 ess:Iron"],["body","body","stone_plate golem_core@4 ess:Stone"],["hands","gloves","wraith_wraps rune_shard ess:Swift"],
      ["feet","boots","gale_boots"],["charm","charm","witch_eye ess:Sharp ess:Holy"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Sharp","Sharp","Iron","Swift"],carry:{potion:3,storm_draught:1}}},
  defensive:{ // Stone / Iron / Runic heavy, slow and hard to hurt
    woods:{steps:[["main","sword","iron_sword ess:Iron ess:Iron"],["off","shield","wood_shield boar_hide ess:Stone"],["head","helm","leather_cap boar_hide ess:Iron"],["body","body","jerkin boar_hide ess:Stone"],
      ["hands","gloves","hide_gloves boar_hide ess:Iron"],["feet","boots","trail_boots boar_hide ess:Stone"],["charm","charm","sprite_lantern ess:Stone"]],inf:["Stone"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","sword","iron_sword golem_core ess:Iron"],["off","shield","wood_shield golem_core ess:Stone"],["head","helm","iron_helmet golem_core ess:Iron"],["body","body","stone_plate golem_core ess:Stone"],
      ["hands","gloves","hide_gloves golem_core ess:Iron"],["feet","boots","trail_boots golem_core ess:Stone"],["charm","charm","fang_charm ess:Stone ess:Iron"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Stone","Iron"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","sword","iron_sword golem_core ess:Iron"],["off","shield","wood_shield golem_core ess:Stone"],["head","helm","iron_helmet golem_core ess:Iron"],["body","body","stone_plate golem_core@4 ess:Arcane"],
      ["hands","gloves","hide_gloves golem_core ess:Iron"],["feet","boots","ember_treads golem_core ess:Stone"],["charm","charm","fang_charm ess:Stone ess:Arcane"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Stone","Iron","Arcane"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","sword","iron_sword golem_core@4 ess:Iron"],["off","shield","sentinel_aegis golem_core@4 ess:Stone"],["head","helm","iron_helmet golem_core ess:Arcane:4"],["body","body","stone_plate rune_shard ess:Stone"],
      ["hands","gloves","hide_gloves golem_core ess:Iron"],["feet","boots","ember_treads golem_core ess:Stone"],["charm","charm","fang_charm ess:Stone ess:Arcane"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Stone","Arcane","Iron","Stone"],carry:{potion:3,storm_draught:1}}},
  staff:{ // Magic-heavy staff caster in lighter armor
    woods:{steps:[["main","staff","oak_staff oak_staff ess:Arcane"],["head","helm","leather_cap"],["body","body","jerkin"],["feet","boots","trail_boots"],["charm","charm","sprite_lantern"]],inf:["Arcane"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","staff","$s1 ess:Fire"],["head","helm","leather_cap pelt"],["body","body","jerkin pelt"],["hands","gloves","wraith_wraps"],["feet","boots","trail_boots"],
      ["charm","charm","sprite_lantern ess:Arcane"],["","potion","holy_water spring_water"]],inf:["Arcane","Fire"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","staff","$s1 phoenix ess:Arcane"],["head","helm","leather_cap shroud"],["body","body","jerkin shroud ess:Arcane"],["hands","gloves","wraith_wraps"],["feet","boots","ember_treads"],
      ["charm","charm","witch_eye"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Arcane","Fire","Holy"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","s1","oak_staff rune_shard ess:Arcane"],["main","s2","$s1 phoenix ess:Arcane:4"],["main","staff","$s2 star_heart ess:Arcane ess:Holy"],["head","helm","leather_cap void_crystal"],["body","body","void_robe"],
      ["hands","gloves","wraith_wraps rune_shard ess:Arcane"],["feet","boots","gale_boots"],["charm","charm","witch_eye void_crystal ess:Arcane"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Arcane","Arcane","Fire","Holy"],carry:{potion:3,storm_draught:1}}},
  stacked:{ // min-max: one trait hammered into each piece (item + essences, again and again) plus infusions, to see how far stacking runs away
    woods:{steps:[["main","s1","iron_sword gnarl_tusk ess:Sharp"],["main","s2","$s1 ess:Sharp ess:Sharp"],["main","sword","$s2 ess:Sharp ess:Sharp"],["body","b1","jerkin boar_hide ess:Iron"],["body","body","$b1 ess:Iron ess:Iron"],["feet","boots","trail_boots ess:Swift ess:Swift"],["off","shield","wood_shield boar_hide ess:Iron"]],inf:["Sharp"],carry:{bread:3}},
    pass:{steps:[["main","s1","iron_sword rime_fang ess:Sharp"],["main","s2","$s1 ess:Sharp ess:Sharp"],["main","s3","$s2 ess:Sharp ess:Sharp"],["main","sword","$s3 ess:Sharp ess:Sharp"],["body","b1","stone_plate golem_core ess:Iron"],["body","b2","$b1 ess:Iron ess:Iron"],["body","body","$b2 ess:Iron ess:Iron"],
      ["feet","b3","trail_boots ess:Swift ess:Swift"],["feet","boots","$b3 ess:Swift ess:Swift"],["off","shield","wood_shield golem_core ess:Iron"]],inf:["Sharp","Sharp","Swift"],carry:{bread:3}},
    hollow:{steps:[["main","s1","iron_sword rime_fang ess:Sharp"],["main","s2","$s1 ess:Sharp:4 ess:Sharp:4"],["main","s3","$s2 ess:Sharp:4 ess:Sharp:4"],["main","sword","$s3 ess:Sharp:4 ess:Sharp:4"],["body","b1","stone_plate golem_core ess:Iron:4"],["body","b2","$b1 ess:Iron:4 ess:Iron:4"],["body","body","$b2 ess:Iron:4 ess:Iron:4"],
      ["head","h1","iron_helmet golem_core ess:Iron:4"],["head","helm","$h1 ess:Iron:4 ess:Iron:4"],["feet","b3","trail_boots ess:Swift:4 ess:Swift:4"],["feet","boots","$b3 ess:Swift:4 ess:Swift:4"],["off","shield","wood_shield golem_core ess:Iron:4"]],inf:["Sharp","Sharp","Sharp","Swift"],carry:{bread:3}},
    spire:{steps:[["main","s1","iron_sword rime_fang ess:Sharp"],["main","s2","$s1 ess:Sharp:4 ess:Sharp:4"],["main","s3","$s2 ess:Sharp:4 ess:Sharp:4"],["main","s4","$s3 ess:Sharp:4 ess:Sharp:4"],["main","s5","$s4 ess:Sharp:4 ess:Sharp:4"],["main","sword","$s5 ess:Sharp:4 ess:Sharp:4 ess:Sharp:4"],
      ["body","b1","stone_plate golem_core ess:Iron:4"],["body","b2","$b1 ess:Iron:4 ess:Iron:4"],["body","b3","$b2 ess:Iron:4 ess:Iron:4"],["body","body","$b3 ess:Iron:4 ess:Iron:4 ess:Iron:4"],["head","h1","iron_helmet golem_core ess:Iron:4"],["head","helm","$h1 ess:Iron:4 ess:Iron:4 ess:Iron:4"],
      ["feet","f1","trail_boots ess:Swift:4 ess:Swift:4"],["feet","boots","$f1 ess:Swift:4 ess:Swift:4 ess:Swift:4"],["off","shield","sentinel_aegis ess:Iron:4 ess:Iron:4 ess:Iron:4"]],inf:["Sharp","Sharp","Sharp","Swift"],carry:{bread:3}}}
};
// the fresh-save kit: arrival at the woods (a new player: the starting sword, nothing else)
const STARTER={steps:[["main","sword","iron_sword"]],inf:[],carry:{}};
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
  const upCost=g=>g<=3?0:3*upCost(g-1)+UP.emb[g-2]; // embers to make one essence of grade g from Plain ones
  const ref=s=>{if(s.startsWith("ess:")){const [,t,g]=s.split(":");return essG(t,+g||3)}return s.includes("@")?gradedItem(baseIdOf(s),gradeOf(s)):s};
  const SIM=window.SIM={kits:{}};
  // craft a kit with combine(), equip it, infuse. Returns the save snapshot and a summary
  SIM.build=(k,stage,xp,mast,sk)=>{ // mast = highest zone index whose enemies the player has mastered in the codex (-1: none)
    S=freshState();S.xp=xp;Object.keys(SKILLS).forEach(x=>S.skills[x]=sk);let tries=0,fizz=0,nc=0;S.unlocked=ZONES.map(z=>z[0]);S.zone=stage;const out={},warn=[];let ess=0;const refs=[];
    const need=id=>{if(id.startsWith("ess:")){const g=+id.split(":")[2]||3;ess+=plainEq(g);if(g>3)refs.push(g);const r=ref(id);addItem(r);return r}const r=ref(id);if(!S.items[r])warn.push("unknown "+id);return r};
    k.steps.forEach(([slot,as,ins])=>{
      const ids=ins.split(" ").map(i=>i[0]==="$"?out[i.slice(1)]:need(i));
      if(ids.length===1){addItem(ids[0]);out[as]=ids[0];if(slot)equip(ids[0],slot);return} // an uncrafted drop, worn as it fell
      if(ids.length>maxInputs())warn.push(`${as}: ${ids.length} inputs at Smith Lv ${level()} (max ${maxInputs()})`);
      ids.forEach(i=>{if(i[0]!=="$"&&!S.inv[i])addItem(i)});
      const mx=checkMix(ids.map(i=>S.items[i]));if(!mx.ok)warn.push(`${as}: impossible mix (${mx.reason})`);
      const c=combine(ids.map(i=>S.items[i]),{roll:100,full:1}); // the sim builds the clean result; a player needs 1/(1-fail) attempts on average
      if(c.blocked)warn.push(`${as}: ${blockText(c.blocked)}`);nc++;tries+=1/(1-c.fail/100);fizz+=c.fiz/100/(1-c.fail/100);if(c.fail>=25)warn.push(`${as}: ${c.fail}% to fail (${c.fiz}% fizzle)`);if(c.log.some(l=>l.k==="Lost"))warn.push(`${as}: lost ${c.log.find(l=>l.k==="Lost").t}`);
      S.items[c.item.id]=c.item;addItem(c.item.id);out[as]=c.item.id;if(slot)equip(c.item.id,slot)});
    (k.inf||[]).forEach(t=>{addItem(essence(t),3);ess+=3;if(!infusable().includes(t))warn.push("cannot infuse "+t);infuse(t)});
    Object.entries(k.carry||{}).forEach(([id,n])=>{if(out[id])addItem(out[id],n-(S.inv[out[id]]||0)>0?n-(S.inv[out[id]]||0):0);else if(n)addItem(id,n)});
    Object.entries(ENEMIES).forEach(([id,E])=>{if(mast>=0&&(id==="mimic"||zoneIdx(E.zone)<=mast)){const af=k=>[...new Set([...E[k],...E.phase?E.phase.to[k]:[]])];
      S.codex[id]={weak:af("weak"),resist:af("resist"),sp:true,sp2:true,ph:true,stats:true,drops:E.drops.map(d=>d[0]),inf:E.inf?[E.inf.s]:[]}}});
    S.hp=pstats().maxHp;const P=pstats(),st=id=>statsOf(S.items[id]);
    const gear=SLOTS.map(([s])=>{const it=gearOf(s);return it&&`${s}:${it.name}`}).filter(Boolean);
    const sum={lv:level(),atk:P.atk,mag:P.mag,def:P.def,red:Math.round(P.red*100),hp:P.maxHp,spd:P.spd,regen:P.regen,ward:P.ward,thorns:P.thorns,dr:P.dr,dodge:P.dodge,root:P.root,cleanse:P.cleanse,res:P.rs,
      crit:Math.round(Math.min(CRIT_CAP,5+(P.main?withInnate(P.main.traits).Sharp||0:0)*3)),abil:abKeys(P),main:P.main&&P.main.name,form:P.main&&P.main.form,shield:!!P.shield,infuse:{...S.infuse},ess,refine:refs.reduce((n,g)=>n+upCost(g),0),tries:Math.round(tries*10)/10,crafts:nc,fizz:Math.round(fizz*10)/10,warn,gear,heals:Object.keys(S.inv).filter(id=>grp(S.items[id])==="consumable").map(id=>`${S.items[id].name} x${S.inv[id]} (${medHeal(S.items[id])})`)};
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
    const won=B.over==="won";return{w:won?1:0,t:B.turn,hp:won?S.hp/pstats().maxHp:0};
  };
  // run a list of cells [{k,e,h,p}] n times each, deterministic per cell if seeded
  SIM.cells=(cells,n,o)=>cells.map(c=>{
    const kit=SIM.kits[c.k];useSeed(o.seed,[c.k,c.e,c.h,c.p,c.mz,o.elite].join());let w=0,t=0,hp=0;
    for(let i=0;i<n;i++){const r=SIM.fight(kit.snap,c.e,c.h,c.p,{...o,af:i%AFFIXES.length,zone:c.mz||kit.zone});w+=r.w;t+=r.t;hp+=r.hp}
    return{...c,n,win:w/n,turns:t/n,hp:hp/n}});
  // attrition: a typical expedition (4 regulars at rows 1-4, then the boss) on one HP bar; a 35% heal after fights 2 and 4 stands in for shrine/camp
  SIM.attr=(snap,zone,heat,pol,n,o)=>{
    useSeed(o.seed,["attr",zone,heat,pol,o.kit].join());let clear=0,fights=0;
    for(let i=0;i<n;i++){S=JSON.parse(snap);S.zone=zone;S.hp=pstats().maxHp;S.maps[zone]={heat,rows:[],path:[]};let ok=true;
      for(let f=0;f<5&&ok;f++){const id=f<4?pickEnemy(zone):ZONES[zoneIdx(zone)][2];startBattle(id,{row:f<4?f+1:0,up:false,elite:false});
        const B=S.battle;let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600)POL[pol](B);
        if(B.over!=="won"){ok=false;break}fights++;if(f===1||f===3)healYou(Math.round(pstats().maxHp*.35))}
      if(ok)clear++}
    return{clear:clear/n,fights:fights/n}};
  // ---- economy: whole expeditions through visit() ----
  const essCount=()=>Object.keys(S.inv).filter(isEss).reduce((a,id)=>a+S.inv[id]*plainEq(gradeOf(id)),0); // plain-essence equivalents
  const itemCount=()=>Object.values(S.inv).reduce((a,b)=>a+b,0);
  SIM.exped=(snap,zone,heat,pol,seedKey,seed)=>{
    useSeed(seed,seedKey);S=JSON.parse(snap);S.zone=zone;S.embers=0;S.hp=pstats().maxHp;S.camp=2;S.maps[zone]=genMap({heat});S.stats.earned=0;
    const r={won:0,lost:0,fights:0,elites:0,shops:[],visits:{},hp0:S.hp},e0=essCount(),i0=itemCount(),inv0={...S.inv};let steps=0;
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
    // what salvaging the new loot would add: its essences and embers (the sim itself never salvages)
    let sEss=0,sEmb=0;Object.keys(S.inv).forEach(id=>{const d=S.inv[id]-(inv0[id]||0),it=S.items[id];if(d>0&&!isEss(id)){sEss+=d*salvageYield(it).length*plainEq(salvGrade(it));sEmb+=d*salvageEmbers(it)}});
    return{...r,embers:S.stats.earned,ess:essCount()-e0,items:itemCount()-i0,steps,sEss,sEmb};
  };
}

// ---------- node side ----------
const pct=x=>Math.round(x*100),f1=x=>(Math.round(x*10)/10).toFixed(1),median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0};
const ZN=["woods","pass","hollow","spire"],kitName=(t,z)=>`${t}/${z}`;
// Flags use bands, not win% alone. mode "arr" (arrival: the kit of the previous stage meets this zone, or the starter kit meets the woods) is the main pairing; "on" is the kit's own zone.
const TURN_EASY=4,TURN_EASY_BOSS=10,HP_EASY=.85;
function flagsOf(c,mode,E){
  const fl=[];if(mode==="off")return fl;const boss=E.boss;
  if(c.h===0&&c.win===1&&c.hp>HP_EASY&&c.turns<(boss?TURN_EASY_BOSS:TURN_EASY))fl.push("TOO_EASY");
  if(c.h===0&&c.win<.5)fl.push("TOO_HARD");
  if(c.turns>(boss?50:30))fl.push("SLOG");return fl}
async function newPage(browser){const p=await browser.newPage();p.on("pageerror",e=>{console.error("pageerror:",e.message)});await p.goto(URL);await p.waitForFunction(()=>typeof S==="object"&&S);await p.evaluate(setup);return p}
async function main(){
  const t0=Date.now(),browser=await chromium.launch();
  const pages=await Promise.all(Array.from({length:JOBS},()=>newPage(browser))),P0=pages[0];
  const zones=list("zone",ZN),kitSel=list("kit",null),mastered=!has("no-mastered");
  const enemiesAll=await P0.evaluate(()=>Object.entries(ENEMIES).map(([id,e])=>({id,zone:e.zone,boss:!!e.boss,name:e.name})));
  const eSel=list("enemy",null),enemies=enemiesAll.filter(e=>(eSel?eSel.includes(e.id):(e.zone==="any"||zones.includes(e.zone))));
  // kits: each stage kit has an on-stage zone and an arrival zone (the next one); the starter kit only arrives (at the woods). --zone keeps kits whose on-stage or arrival zone is listed
  const defs=[...Object.entries(KITS).flatMap(([type,by])=>Object.entries(by).map(([z,def])=>({name:kitName(type,z),type,zone:z,on:z,arr:ZN[ZN.indexOf(z)+1]||null,xp:STAGES[z].xp,sk:STAGES[z].sk,mast:mastered?ZN.indexOf(z):-1,def}))),
    {name:"starter/start",type:"starter",zone:"woods",on:null,arr:"woods",xp:0,mast:-1,def:STARTER}];
  const kits=defs.filter(k=>(!kitSel||kitSel.some(x=>k.name.includes(x)||(STAGES[k.zone]&&STAGES[k.zone].label===x)))&&(!has("zone")||zones.includes(k.on)||zones.includes(k.arr)));
  const sums={};
  for(const k of kits){const b=await P0.evaluate(([d,z,xp,m,sk])=>SIM.build(d,z,xp,m,sk),[k.def,k.zone,k.xp,k.mast,k.sk]);sums[k.name]=b.sum;
    await Promise.all(pages.map(p=>p.evaluate(([n,z,s])=>{SIM.kits[n]={snap:s,zone:z}},[k.name,k.zone,b.snap])))}
  console.log(`== Kits (${kits.length}); codex mastery ${mastered?"on for the kit's zone and earlier":"off"} ==`);
  let warns=0;
  for(const k of kits){const s=sums[k.name],over=k.type!=="stacked"&&s.ess>(ESS_BUDGET[k.zone]||12);
    console.log(`${k.name.padEnd(17)} Lv${s.lv} HP${String(s.hp).padEnd(3)} ATK${String(s.atk).padEnd(3)} MAG${String(s.mag).padEnd(3)} DEF${String(s.def).padEnd(3)}(${s.red}%) SPD${String(s.spd).padEnd(2)} crit${s.crit}% | ${s.main||"fists"} [${s.abil.join(",")||"-"}] | ward${s.ward} thorn${s.thorns}% dr${s.dr} dodge${s.dodge}% regen${s.regen} root${s.root} cl${s.cleanse} res${JSON.stringify(s.res)} inf${JSON.stringify(s.infuse)} ess${s.ess}${over?"(!)":""} refine${s.refine}emb | ${s.crafts} crafts ~${s.tries} tries (~${s.fizz} fizzles)`);
    if(s.warn.length){warns+=s.warn.length;console.log(`   WARN: ${s.warn.join("; ")}`)}}
  console.log(`kit warnings: ${warns}`);
  const result={args:{n:N,seed:SEED,row:ROW,heats:HEATS,policies:POLS,elite:has("elite"),mastered},kits:sums,cells:[],attr:[],econ:[]};
  const E=Object.fromEntries(enemiesAll.map(e=>[e.id,e])),K=Object.fromEntries(kits.map(k=>[k.name,k]));
  if(!has("econ-only")){
    const todo=[];
    for(const k of kits)for(const e of enemies){
      const variants=e.id==="mimic"?[k.on&&[k.on,"on"],k.arr&&[k.arr,"arr"]].filter(Boolean):[[null,e.zone===k.arr?"arr":e.zone===k.on?"on":"off"]];
      for(const [mz,mode] of variants)for(const h of HEATS)for(const p of POLS)for(const el of has("elite")&&!e.boss&&e.id!=="mimic"?[false,true]:[false])todo.push({c:{k:k.name,e:e.id,h,p,mz,mode},el})}
    const chunks=Array.from({length:JOBS},()=>[]);todo.forEach((x,i)=>chunks[i%JOBS].push(x));let done=0;
    const res=(await Promise.all(chunks.map((ch,i)=>(async()=>{const out=[];
      for(let j=0;j<ch.length;j+=60){const part=ch.slice(j,j+60);
        for(const el of [...new Set(part.map(x=>x.el))]){const sub=part.filter(x=>x.el===el).map(x=>x.c),r=await pages[i].evaluate(([c,n,o])=>SIM.cells(c,n,o),[sub,N,{seed:SEED,row:ROW,elite:el}]);r.forEach(x=>out.push({...x,el}));done+=sub.length}
        if(process.stderr.isTTY)process.stderr.write(`\rmatrix ${done}/${todo.length} cells  ${Math.round((Date.now()-t0)/1000)}s`)}
      return out})()))).flat();if(process.stderr.isTTY)process.stderr.write("\n");
    res.forEach(c=>{c.flags=c.el?[]:flagsOf(c,c.mode,E[c.e]);c.enemy=c.e+(c.el?"*":"")});
    const MO={arr:0,on:1,off:2};
    res.sort((a,b)=>MO[a.mode]-MO[b.mode]||enemies.findIndex(e=>e.id===a.e)-enemies.findIndex(e=>e.id===b.e)||(a.el-b.el)||kits.findIndex(k=>k.name===a.k)-kits.findIndex(k=>k.name===b.k)||POLS.indexOf(a.p)-POLS.indexOf(b.p)||a.h-b.h);
    result.cells=res;
    const heads={arr:"ARRIVAL (previous stage's kit meets this zone; starter kit meets the woods): the main pairing",on:"ON-STAGE (the kit's own zone)",off:"OTHER pairings"};
    for(const mode of ["arr","on","off"]){
      if(mode==="off"&&!has("all"))continue;
      console.log(`\n== Matrix, ${heads[mode]}: ${N} fights per cell, seed ${SEED??"random"}, map row ${ROW}${has("elite")?", * = elite":""}. Per heat: win% / mean turns / mean HP left% (losses count 0) ==`);
      console.log(`${"enemy".padEnd(11)}${"kit".padEnd(17)}${"policy".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(17)).join("")}flags`);
      const groups={};res.filter(c=>c.mode===mode).forEach(c=>{const key=[c.enemy,c.k,c.p].join("|");(groups[key]=groups[key]||[]).push(c)});
      Object.values(groups).forEach(g=>{const c0=g[0];
        console.log(`${c0.enemy.padEnd(11)}${c0.k.padEnd(17)}${c0.p.padEnd(8)}${HEATS.map(h=>{const c=g.find(x=>x.h===h);return c?`${String(pct(c.win)).padStart(3)}% ${f1(c.turns).padStart(5)}t ${String(pct(c.hp)).padStart(3)}%`.padEnd(17):"".padEnd(17)}).join("")}${[...new Set(g.flatMap(x=>x.flags))].join(" ")}`)})}
    // win% grids (every pairing, mimic = its on-stage variant), every policy at the first heat plus the last heat for the first policy
    const grid=(gp,gh)=>{console.log(`\n== Win% grid (policy ${gp}, Heat ${gh}; rows = kits, columns = enemies; mimic on-stage) ==`);
      console.log("".padEnd(17)+enemies.map(e=>e.id.slice(0,4).padStart(5)).join(""));
      kits.forEach(k=>console.log(k.name.padEnd(17)+enemies.map(e=>{const c=res.find(x=>x.k===k.name&&x.e===e.id&&x.p===gp&&x.h===gh&&!x.el&&(e.id!=="mimic"||x.mode==="on"||!k.on));return c?String(pct(c.win)).padStart(5):"    -"}).join("")))};
    POLS.forEach(p=>grid(p,HEATS[0]));if(HEATS.length>1)grid(POLS[0],HEATS[HEATS.length-1]);
    // kit strength: mean over the first policy's cells of that pairing
    const gp=POLS[0],types=[...Object.keys(KITS),"starter"],stages=["start",...ZN];
    for(const mode of ["arr","on"]){console.log(`\n== Kit strength, ${mode==="arr"?"ARRIVAL (row = stage the kit is from; it meets the next zone)":"ON-STAGE"} (policy ${gp}): mean turns / mean HP left% / win% ==`);
      HEATS.forEach(h=>{console.log(`Heat ${h}`.padEnd(10)+types.map(t=>t.padEnd(22)).join(""));
        stages.forEach(z=>{const cells=types.map(t=>{const n=t==="starter"?(z==="start"?"starter/start":null):kitName(t,z),xs=n?res.filter(c=>c.k===n&&c.p===gp&&c.h===h&&!c.el&&c.mode===mode):[];
          return xs.length?`${f1(xs.reduce((a,c)=>a+c.turns,0)/xs.length)}t ${pct(xs.reduce((a,c)=>a+c.hp,0)/xs.length)}% ${pct(xs.reduce((a,c)=>a+c.win,0)/xs.length)}%`:"-"});
          if(cells.some(c=>c!=="-"))console.log(z.padEnd(10)+cells.map(c=>c.padEnd(22)).join(""))})})}
    for(const mode of ["arr","on"]){const fl=res.filter(c=>c.mode===mode&&c.flags.length);
      console.log(`\n== Flagged cells, ${mode==="arr"?"ARRIVAL":"ON-STAGE"}: ${fl.length}. TOO_EASY: win 100%, HP left >${HP_EASY*100}% and turns <${TURN_EASY} (boss <${TURN_EASY_BOSS}) at Heat 0; TOO_HARD: win <50% at Heat 0; SLOG: mean turns >30 (boss >50) ==`);
      ["TOO_EASY","TOO_HARD","SLOG"].forEach(f=>{const xs=fl.filter(c=>c.flags.includes(f));console.log(`${f}: ${xs.length} cells`);
        POLS.forEach(p=>{const ys=xs.filter(c=>c.p===p);if(!ys.length)return;const by={};ys.forEach(c=>{const key=`${c.k}@H${c.h}`;(by[key]=by[key]||[]).push(c.enemy)});
          console.log(`  [${p}] ${ys.length}`);Object.entries(by).forEach(([k,v])=>console.log(`    ${k.padEnd(20)} ${v.join(" ")}`))})})}
    // attrition: whole expedition on one HP bar
    if(has("attrition")){
      console.log(`\n== Attrition: 4 regulars (rows 1-4) then the boss on one HP bar, 35% heal after fights 2 and 4; ${N} expeditions per cell. Per heat: clear% / mean fights won (of 5) ==`);
      console.log(`${"kit".padEnd(17)}${"mode".padEnd(5)}${"zone".padEnd(8)}${"policy".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(14)).join("")}`);
      const jobs=kits.flatMap(k=>[["arr",k.arr],["on",k.on]].filter(x=>x[1]).flatMap(([mode,z])=>POLS.map(p=>({k:k.name,mode,z,p}))));
      const out=(await Promise.all(Array.from({length:JOBS},(_,i)=>(async()=>{const o=[];for(const j of jobs.filter((_,x)=>x%JOBS===i)){const hs=[];for(const h of HEATS)hs.push(await pages[i].evaluate(([k,z,h,p,n,seed])=>SIM.attr(SIM.kits[k].snap,z,h,p,n,{seed,kit:k}),[j.k,j.z,h,j.p,N,SEED]));o.push({...j,heats:hs})}return o})()))).flat();
      const ord=x=>jobs.findIndex(j=>j.k===x.k&&j.mode===x.mode&&j.p===x.p);out.sort((a,b)=>ord(a)-ord(b));result.attr=out;
      out.forEach(o=>console.log(`${o.k.padEnd(17)}${o.mode.padEnd(5)}${o.z.padEnd(8)}${o.p.padEnd(8)}${o.heats.map(x=>`${pct(x.clear)}% ${f1(x.fights)}`.padEnd(14)).join("")}`))}
  }
  // economy
  if(!has("no-econ")){
    const ez=zones,eh=HEATS[0],ep=POLS.includes("smart")?"smart":POLS[0];
    console.log(`\n== Economy: ${EXPED} expeditions per zone, ${ep} policy, melee stage kit (codex mastered for its zone), Heat ${eh} ==`);
    console.log("Columns WITHOUT salvage: embers (fight rewards), ess (essences from chests, shrines, elites, bosses...), items (all drops). Columns WITH salvage (the bot never salvages; this is the value of the new non-equipped loot if you did): sv.ess (essences) and sv.emb (embers); emb+sv and ess+sv are the totals; gear/exp = (embers+sv.emb) / median shop gear price.");
    const cols=[["zone",8],["kit",14],["clear%",7],["lost%",6],["fights",7],["embers",7],["sv.emb",7],["emb+sv",7],["ess",5],["sv.ess",7],["ess+sv",7],["items",6],["shops",6],["gear price min-med-max",23],["ess price",10],["emb@shop",9],["gear/exp",8]];
    console.log(cols.map(([c,w])=>c.padEnd(w)).join(""));
    for(const z of ez){const k=kits.find(k=>k.on===z&&k.type==="melee")||kits.find(k=>k.on===z);if(!k)continue;
      const ids=Array.from({length:EXPED},(_,i)=>i),chunks=Array.from({length:JOBS},(_,j)=>ids.filter(i=>i%JOBS===j));
      const rs=(await Promise.all(chunks.map((ch,j)=>pages[j].evaluate(([n,zz,h,p,ids,seed])=>ids.map(i=>SIM.exped(SIM.kits[n].snap,zz,h,p,"exp"+zz+i,seed)),[k.name,z,eh,ep,ch,SEED])))).flat();
      const avg=f=>rs.reduce((a,r)=>a+f(r),0)/rs.length,shops=rs.flatMap(r=>r.shops),gear=shops.flatMap(s=>s.gear),essP=shops.flatMap(s=>s.ess);
      const row={zone:z,kit:k.name,clear:avg(r=>r.won),lost:avg(r=>r.lost),fights:avg(r=>r.fights),embers:avg(r=>r.embers),salvEmb:avg(r=>r.sEmb),ess:avg(r=>r.ess),salvEss:avg(r=>r.sEss),items:avg(r=>r.items),shops:shops.length/rs.length,
        gear:gear.length?[Math.min(...gear),median(gear),Math.max(...gear)]:null,essPrice:essP.length?[Math.min(...essP),Math.max(...essP)]:null,embAtShop:shops.length?shops.reduce((a,s)=>a+s.emb,0)/shops.length:0,exped:rs.length};
      row.affordable=gear.length?(row.embers+row.salvEmb)/median(gear):0;result.econ.push(row);
      console.log([z,k.name,pct(row.clear),pct(row.lost),f1(row.fights),f1(row.embers),f1(row.salvEmb),f1(row.embers+row.salvEmb),f1(row.ess),f1(row.salvEss),f1(row.ess+row.salvEss),f1(row.items),f1(row.shops),row.gear?row.gear.join("-"):"-",row.essPrice?[...new Set(row.essPrice)].join("-"):"-",f1(row.embAtShop),f1(row.affordable)].map((v,i)=>String(v).padEnd(cols[i][1])).join(""))}
  }
  await browser.close();
  if(OUT){fs.writeFileSync(OUT,JSON.stringify(result));console.log(`\nwrote ${OUT}`)}
  console.log(`done in ${Math.round((Date.now()-t0)/1000)}s`);
}
main().catch(e=>{console.error(e);process.exit(1)});
