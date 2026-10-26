#!/usr/bin/env node
// Balance simulator: plays battles and whole expeditions in the real game code (startBattle, attack, parry, ability, useItem, visit, pstats...)
// in headless Chromium, with render/save/floatFx/sfx/toast stubbed. Kits are crafted with the real combine().
// Usage: node tools/sim.js [--n 40] [--zone woods,pass] [--enemy wolf,archon] [--kit melee,spire-end] [--heat 0,3,5] [--policy smart,basic,passive,guard,parry]
//        [--fresh (the first expeditions with the unlock gates on, --exped 5)] [--seed 7] [--trace (prints one battle log per cell, then exits)] [--elite (adds magic + and rare * variants)] [--rarity (the rarity table only)] [--row 3] [--all] [--attrition] [--no-mastered] [--jobs 4] [--out sim.json] [--econ-only | --no-econ] [--exped 30]
//        [--wild (only the wild and Rift sections, with the forced rarity variants)] [--no-wild (skip them)] [--rift-seeds 1,2,3] [--rift-depth 1,3] [--rift-wild (the Rift's own wild creatures too)] [--force rare (the forced variants to trace)]
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
  staff:{ // Magic-heavy staff caster: Arcane stacked into the staff, a shield, lighter armor
    woods:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","staff","$s1 ess:Arcane ess:Arcane"],["off","shield","wood_shield boar_hide"],["head","helm","leather_cap"],["body","body","jerkin"],["feet","boots","trail_boots"],["charm","charm","sprite_lantern"]],inf:["Arcane"],carry:{bread:3,honey:2}},
    pass:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","s2","$s1 ess:Arcane ess:Arcane"],["main","staff","$s2 ess:Arcane ess:Arcane"],["off","shield","wood_shield pelt"],["head","helm","iron_helmet pelt"],["body","body","stone_plate pelt"],["hands","gloves","wraith_wraps"],["feet","boots","trail_boots"],
      ["charm","charm","sprite_lantern ess:Arcane"],["","potion","holy_water spring_water"]],inf:["Arcane","Arcane"],carry:{bread:3,potion:2}},
    hollow:{steps:[["main","s1","oak_staff oak_staff ess:Arcane"],["main","s2","$s1 phoenix ess:Arcane"],["main","staff","$s2 ess:Arcane ess:Arcane"],["off","shield","wood_shield golem_core"],["head","helm","leather_cap shroud"],["body","body","jerkin shroud ess:Arcane"],["hands","gloves","wraith_wraps"],["feet","boots","ember_treads"],
      ["charm","charm","witch_eye"],["","potion","holy_water spring_water ess:Nourishing"]],inf:["Arcane","Fire","Holy"],carry:{potion:3,bread:2}},
    spire:{steps:[["main","s1","oak_staff rune_shard ess:Arcane"],["main","s2","$s1 phoenix ess:Arcane:4"],["main","s3","$s2 star_heart ess:Arcane ess:Holy"],["main","staff","$s3 ess:Arcane ess:Arcane"],["off","shield","sentinel_aegis"],["head","helm","leather_cap void_crystal"],["body","body","void_robe"],
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
// the wild sections: the wild creatures of the four regions and the Rift masters (they are not part of the regular matrix)
// --wild: only these sections, with the forced rarity variants; --no-wild: none of them; --elite: the forced variants in a default run too
const WILD_ONLY=has("wild"),NO_WILD=has("no-wild"),ELITE=has("elite");
const RIFT_SEEDS=list("rift-seeds",null),RIFT_DEPTH=list("rift-depth",["1","3"]).map(Number),RIFT_WILD=has("rift-wild")||WILD_ONLY;
const FORCED=WILD_ONLY||ELITE; // the forced normal/magic/rare variants of a wild creature
// what runs: the regular matrix (printed), the wild and Rift sections, the rarity table, the economy
const ONLY_ECON=has("econ-only"),RARITY=has("rarity");
const RUN_MATRIX=!ONLY_ECON&&!RARITY&&!WILD_ONLY,RUN_WILD=!ONLY_ECON&&!RARITY&&!NO_WILD,RUN_ECON=!has("no-econ")&&!RARITY&&!WILD_ONLY;

// ---------- in-page simulator ----------
function setup(){ // runs inside the game page; everything here uses the real game functions
  ["render","save","floatFx","sfx","toast","closeSheet","flushFx"].forEach(f=>window[f]=()=>{});
  const mulberry=a=>()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const realRandom=Math.random,seedFor=(seed,key)=>seed==null?null:mulberry(hash(seed+"|"+key));
  const useSeed=(seed,key)=>{Math.random=seed==null?realRandom:seedFor(seed,key)};
  const upCost=g=>g<=3?0:3*upCost(g-1)+UP.emb[g-2]; // embers to make one essence of grade g from Plain ones
  const ref=s=>{if(s.startsWith("ess:")){const [,t,g]=s.split(":");return essG(t,+g||3)}return s.includes("@")?gradedItem(baseIdOf(s),gradeOf(s)):s};
  const SIM=window.SIM={kits:{}};
  // craft a kit with combine(), equip it, infuse. Returns the save snapshot and a summary
  // every system open and every technique known except Precision (it only lowers the failure chance, so the "attempts needed" numbers stay those of main): the kits and the matrix measure combat and the economy, not the unlock order
  const openAll=()=>{S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));S.techs=Object.fromEntries(TECHS.filter(t=>!/^prec/.test(t.id)).map((t,i)=>[t.id,i+1]))};
  SIM.build=(k,stage,xp,mast,sk)=>{ // mast = highest zone index whose enemies the player has mastered in the codex (-1: none)
    S=freshState();openAll();S.xp=xp;Object.keys(SKILLS).forEach(x=>S.skills[x]=sk);let tries=0,fizz=0,nc=0;S.unlocked=ZONES.map(z=>z[0]);S.zone=stage;const out={},warn=[];let ess=0;const refs=[];
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
  // guard/parry use the same healing and abilities as smart, changing only the response to a telegraph.
  const smartTurn=(B,defense="smart")=>{const sp=isSpecial(B)?foeOf(B).sp:null,P=pstats();
      if(sp&&!B.frozen&&!B.stun&&!(B.off>0)&&!(defense==="guard"&&sp.kind==="heal")){
        if(defense==="parry")return parry();
        if(defense==="guard")return guard();
        if(sp.kind==="heal")return parry(); // Guard cannot interrupt a heal.
        const hits=sp.kind==="multi"?sp.n:1,ward=B.ward||0,ch=parryChance(B,P);
        const damage=(guarding,parrying,vf)=>Math.max(0,foeHit({...B,guard:guarding,parry:parrying},P,sp.x,vf)*hits-ward);
        const fail=damage(false,true,1),safe=damage(true,false,1);
        // Prefer certainty if a failed parry could kill us but Guard can survive even a high roll.
        const lethal=damage(false,true,1.15)>=S.hp,guardLives=damage(true,false,1.15)<S.hp;
        if(lethal)return guardLives?guard():parry();
        // Expected HP cost minus counterattack value: Guard's non-stacking Braced versus a successful riposte.
        const pow=(P.atk+P.mag*MAG_W)*.5,hit=pow*pow/(pow+Math.max(0,B.def-(B.shred||0))),braced=B.braced?0:hit*GUARD_T.braced;
        const parryCost=(1-ch)*fail-ch*hit*PARRY_X,guardCost=safe-braced;
        // A guarded hit cannot inflict statuses; price the likely extra DOT/healing penalty into the risk.
        const E=foeOf(B),inf=E.inf,et=elTr(B),statusRisk=inf||et&&ELITE_INF[et]||twistNow()==="cinder";
        const statusCost=statusRisk?(1-ch)*B.atk*.4:0;
        return guardCost<=parryCost+statusCost?guard():parry();
      }
      if(S.hp<P.maxHp*.35){const hs=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable"&&medHeal(S.items[id])>0).sort((a,b)=>medHeal(S.items[b])-medHeal(S.items[a]));if(hs.length)return useItem(hs[0])}
      if(hasAfx(B,"boom")&&B.hp<=B.max*AFX_T.boom.warn&&S.hp<=blastOf(B)*1.6){const hs=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable"&&medHeal(S.items[id])>0).sort((a,b)=>medHeal(S.items[b])-medHeal(S.items[a]));if(hs.length)return useItem(hs[0])} // a Volatile foe is about to burst: heal first, as the NEXT row says
      const ready=abKeys(P).find(a=>!(B.cd&&B.cd[a]>0));if(ready)return ability(ready);
      attack()};
  const POL={
    passive:()=>attack(),
    basic:B=>{const sp=isSpecial(B)?foeOf(B).sp:null;if(sp&&sp.kind!=="heal"&&!B.frozen&&!B.stun&&!(B.off>0))guard();else attack()},
    smart:B=>smartTurn(B),guard:B=>smartTurn(B,"guard"),parry:B=>smartTurn(B,"parry")
  };
  // one fight on a fresh copy of the kit's save; returns {w,t,hp}
  // the affixes a magic/rare variant carries: the first cycles through every affix the species can roll (Swift-footed needs a mover), the rest are rolled
  SIM.afxFor=(id,rar,i,heat)=>{
    if(!rar||rar==="normal")return[];const E=ENEMIES[id],pool=Object.keys(AFX).filter(a=>!AFX[a].roam||(E.mv&&E.mv!=="still")),k=rar==="rare"&&heat>=RAR_CH.k3?3:RARITIES[rar].k,out=[pool[i%pool.length]];
    while(out.length<k){const c=pool.filter(a=>!out.includes(a)&&out.every(b=>afxOk(a,b)));if(!c.length)break;out.push(c[Math.floor(Math.random()*c.length)])}
    return out};
  // ---- the Rift: a region rolled from one seed (its ten wild creatures and its master)
  SIM.rift=(seed,depth)=>{
    seed=seed>>>0;depth=Math.max(1,depth|0);
    S.rift={depth,seed,best:depth,cleared:0,biome:"",name:"",pal:null,tier:null};
    const r=riftMake(seed,depth);
    S.rift.biome=r.biome;S.rift.name=r.name;S.rift.pal=r.pal;S.rift.tier=r.tier;
    const M=ENEMIES.rift_boss;
    return{seed,depth,biome:r.biome,name:r.name,tier:r.tier,
      master:{name:M.name,el:M.el,hp:M.hp,atk:M.atk,def:M.def,afx:M.afx||[],sp:M.sp},
      wild:Object.keys(ENEMIES).filter(id=>/^w_rift_\d+$/.test(id)).sort()};
  };
  // the seeds the sim tests by default: one per Rift biome, the lowest s whose roll lands there (the biome is the first draw of the roll)
  SIM.riftSeeds=(n)=>{
    const out=[],seen={};
    for(let s=1;out.length<n&&s<1000000;s++){const R=rng(hash("sim-rift:"+s)),bi=RIFT_BIOMES[Math.floor(R()*RIFT_BIOMES.length)];if(seen[bi])continue;seen[bi]=1;out.push({s,seed:hash("sim-rift:"+s),biome:bi})}
    return out};
  // a wild creature forced to a rarity: its stored stats (its own rarity divided out) go back onto the region band,
  // and the affix rules of a regular apply. A Rift master keeps its stored stats: the game gives bosses no affixes
  // at all, so its forced rows apply them after the fight has started (sim-only).
  const prep=(id,o)=>{
    if(o.rs!=null)SIM.rift(o.rs,o.rd||1); // the Rift region is rebuilt from its seed before every fight (cheap and deterministic)
    const E0=ENEMIES[id];let E=E0,restore=null;
    if(o.force&&!E0.boss){const rm=RARITIES[E0.rar]||{hp:1,atk:1};const cp={...E0,hp:Math.round(E0.hp*rm.hp),atk:Math.round(E0.atk*rm.atk),afx:[],rar:undefined};restore=E0;ENEMIES[id]=cp;E=cp}
    return{E,restore}};
  const after=(id,o,E)=>{if(o.force&&E.boss){const M=ENEMIES[id],af=(M.afx||[]).slice(0,o.force==="rare"?3:1);if(af.length)applyAfx(S.battle,M,o.force,af)}};
  SIM.fight=(snap,id,heat,pol,o)=>{
    S=JSON.parse(snap);const{E,restore}=prep(id,o);
    try{
      S.zone=id==="mimic"?o.zone:E.zone;S.hp=pstats().maxHp;S.maps[S.zone]=genMap({heat,zone:S.zone==="rift"?"rift":undefined});S.run=null;
      startBattle(id,{row:E.boss||id==="mimic"?0:o.row,rar:o.rar||"normal",afx:SIM.afxFor(id,o.rar,o.i||0,heat)});
      after(id,o,E);
      const B=S.battle;let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600)POL[pol](B);
      const won=B.over==="won";return{w:won?1:0,t:B.turn,hp:won?S.hp/pstats().maxHp:0,a:B.afx[0]};
    }finally{if(restore)ENEMIES[id]=restore}
  };
  // --trace: one fight with its battle log (your HP after each line's turn is not tracked; the final line is the result)
  SIM.trace=(snap,id,heat,pol,o)=>{useSeed(o.seed,"trace"+id+heat+pol+(o.force||"")+(o.rs!=null?o.rs:""));S=JSON.parse(snap);const{E,restore}=prep(id,o);
    try{
      S.zone=id==="mimic"?o.zone:E.zone;S.hp=pstats().maxHp;S.maps[S.zone]=genMap({heat,zone:S.zone==="rift"?"rift":undefined});S.run=null;
      startBattle(id,{row:E.boss||id==="mimic"?0:o.row,rar:o.rar||"normal",afx:SIM.afxFor(id,o.rar,0,heat)});after(id,o,E);
      const B=S.battle,hps=[];let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600){const t=B.turn,n=B.log.length;POL[pol](B);hps.push(`T${t} you ${S.hp}/${pstats().maxHp} foe ${Math.max(0,B.hp)}/${B.max}`)}
      return{log:B.log.map(l=>l.t),hps,over:B.over,turns:B.turn};
    }finally{if(restore)ENEMIES[id]=restore}};
  // run a list of cells [{k,e,h,p}] n times each, deterministic per cell if seeded
  SIM.cells=(cells,n,o)=>cells.map(c=>{
    const kit=SIM.kits[c.k],rar=c.rar||o.rar||"normal";
    const key=[c.k,c.e,c.h,c.p,c.mz,rar]; // the same key as before, so an unchanged run keeps its numbers
    if(c.force||c.rs!=null||c.rd!=null)key.push(c.force||"",c.rs==null?"":c.rs,c.rd==null?"":c.rd);
    useSeed(o.seed,key.join());let w=0,t=0,hp=0;const ba={};
    for(let i=0;i<n;i++){const r=SIM.fight(kit.snap,c.e,c.h,c.p,{...o,i,zone:c.mz||kit.zone,rar,force:c.force,rs:c.rs,rd:c.rd});w+=r.w;t+=r.t;hp+=r.hp;if(r.a){const x=ba[r.a]||(ba[r.a]=[0,0]);x[0]++;x[1]+=r.w}}
    return{...c,n,win:w/n,turns:t/n,hp:hp/n,ba}});
  // attrition: a typical expedition (4 regulars at rows 1-4, then the boss) on one HP bar; a 35% heal after fights 2 and 4 stands in for shrine/camp
  SIM.attr=(snap,zone,heat,pol,n,o)=>{
    useSeed(o.seed,["attr",zone,heat,pol,o.kit].join());let clear=0,fights=0;
    for(let i=0;i<n;i++){S=JSON.parse(snap);S.zone=zone;S.hp=pstats().maxHp;S.maps[zone]=genMap({heat});let ok=true;
      for(let f=0;f<5&&ok;f++){const id=f<4?pickEnemy(zone):ZONES[zoneIdx(zone)][2];startBattle(id,{row:f<4?f+1:0,rar:"normal"});
        const B=S.battle;let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600)POL[pol](B);
        if(B.over!=="won"){ok=false;break}fights++;if(f===1||f===3)healYou(Math.round(pstats().maxHp*.35))}
      if(ok)clear++}
    return{clear:clear/n,fights:fights/n}};
  // ---- economy: whole expeditions on the grid map (step(), BFS to POIs then the lair) ----
  const essCount=()=>Object.keys(S.inv).filter(isEss).reduce((a,id)=>a+S.inv[id]*plainEq(gradeOf(id)),0); // plain-essence equivalents
  const itemCount=()=>Object.values(S.inv).reduce((a,b)=>a+b,0);
  // --fresh: the first expeditions of a new save with the unlock gates on (the starter kit, one policy): what each map holds, what opens between them
  // between expeditions the bot does what a newcomer does: deconstructs its raw finds, infuses each essence it holds into the sword once it knows Infusing, studies up to three families, learns the cheapest technique it can afford. rpEarned() counts what research was worth.
  const chores=()=>{
    const rp0=rpEarned(),learned=[];
    Object.keys(S.inv).filter(id=>S.inv[id]-eqCount(id)>0&&!isEss(id)&&(DECON[plainId(id)]&&canDecon(S.items[id])||salvageYield(S.items[id]).length)).forEach(id=>{while(S.inv[id]-eqCount(id)>0){if(canDecon(S.items[id]))deconstruct(id);else salvageItem(id)}}); // raw finds are deconstructed, gear with essences in it salvaged
    const sw=S.inv.iron_sword>0?"iron_sword":null;
    if(sw)for(const f of [...new Set(Object.keys(S.inv).filter(id=>isEss(id)&&S.inv[id]>0).map(essTrait))].slice(0,2)){const id=studyPool(f)[0];if(!id)continue;S.bench=[sw,id];if(!actionOk(S.bench.map(i=>S.items[i])).length&&checkMix(S.bench.map(i=>S.items[i])).ok)forgeIt(S.bench.map(i=>S.items[i]));S.bench=[]}
    checkUnl(true);rpSweep();
    if(isUnl("research")){[...new Set(Object.keys(S.inv).filter(id=>isEss(id)&&S.inv[id]>0).map(essTrait))].filter(canStudy).slice(0,3).forEach(studyFam);
      for(let k=0;k<10;k++){const t=TECHS.filter(t=>techState(t)==="avail"&&S.rp>=techCost(t)).sort((a,b)=>techCost(a)-techCost(b))[0];if(!t)break;learnTech(t.id);learned.push(t.name)}}
    rpQ=[];return{gain:rpEarned()-rp0,learned}};
  SIM.fresh=(n,pol,seed)=>{
    useSeed(seed,"fresh");S=freshState();S.hp=pstats().maxHp;const rows=[],seenU=new Set();
    for(let e=0;e<n;e++){
      S.zone="woods";S.maps.woods=newMap("woods");S.battle=null;S.event=null;S.hp=pstats().maxHp;S.camp=2;S.stats.earned=0;
      const m=curMap(),types={},w0=S.wins;m.pois.forEach(p=>types[p.t]=(types[p.t]||0)+1);
      const r=walkExped(pol),res=r.won?"won":r.lost?"lost":"walked away";if(!r.won&&!r.lost)S.stats.exped++; // an abandoned run still counts as an expedition
      const rs=chores();checkUnl(true);const opened=Object.keys(S.unl).filter(k=>!seenU.has(k));Object.keys(S.unl).forEach(k=>seenU.add(k));
      rows.push({e:e+1,res,steps:r.steps,fights:r.fights,wins:S.wins-w0,hunted:r.cont,pois:types,visits:r.visits,opened,rp:{gain:rs.gain,earned:rpEarned(),have:S.rp,learned:rs.learned,src:Object.keys(S.rpd).reduce((o,k)=>{const p=k.split(":")[0];o[p]=(o[p]||0)+1;return o},{})},sc:{exps:exps(S),wins:S.wins,lv:level()}})}
    return rows};
  SIM.exped=(snap,zone,heat,pol,seedKey,seed)=>{
    useSeed(seed,seedKey);S=JSON.parse(snap);S.zone=zone;S.embers=0;S.hp=pstats().maxHp;S.camp=2;S.maps[zone]=genMap({heat,zone});S.stats.earned=0;
    return walkExped(pol)};
  const walkExped=pol=>{ // one expedition on the current S (its map), walked to the boss or a defeat
    const r={won:0,lost:0,fights:0,cont:0,mags:0,rares:0,shops:[],visits:{},hp0:S.hp},e0=essCount(),i0=itemCount(),inv0={...S.inv};let steps=0;
    const fightOut=()=>{const B=S.battle;let g=0;while(S.battle===B&&!B.over&&B.turn<150&&g++<600)POL[pol](B);r.fights++;if(B.by==="it")r.cont++;if(B.afx.length)r[B.rar==="rare"?"rares":"mags"]++;return B.over};
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
    let dark=0,vis=0;
    while(steps<220){ // walk the grid: nearest unvisited POI (no elites when hurt), then the lair once ~8 are done or the torch is low
      const m=curMap();if(m.cleared)break;
      if(S.hp<pstats().maxHp*.5&&S.camp>0)rest();
      const d=bfs(m,m.pos.x,m.pos.y),hurt=S.hp<pstats().maxHp*.6,ix=p=>p.y*m.w+p.x;
      const tg=m.pois.filter(p=>!p.done&&p.t!=="boss"&&d[ix(p)]>=0&&!(hurt&&p.t==="elite")).sort((a,b)=>d[ix(a)]-d[ix(b)]);
      const goal=vis>=8||m.torch<=10||!tg.length?m.lair:tg[0],dg=bfs(m,goal.x,goal.y),nx=adjTiles(m).sort((a,b)=>dg[a[1]*m.w+a[0]]-dg[b[1]*m.w+b[0]])[0];
      if(!nx)break;const was=poiAt(m,nx[0],nx[1]);if(was&&!was.done){r.visits[was.t]=(r.visits[was.t]||0)+1;vis++}
      if(m.torch<=0)dark++;steps++;step(...nx);
      if(!settle()){r.lost=1;break}
      if(S.battle&&S.battle.over==="won"&&ENEMIES[S.battle.id].boss){r.won=1;break}}
    const tEnd=curMap().torch;
    // what salvaging the new loot would add: its essences and embers (the sim itself never salvages)
    const decEss=it=>{const y=deconYield(it);return y.frag.reduce((n,[,k,g])=>n+k*plainEq(g),0)+y.ch.reduce((n,[,p,g])=>n+p*plainEq(g),0)}; // expected plain essences from deconstructing it (fragments plus the chances)
    let sEss=0,sEmb=0;Object.keys(S.inv).forEach(id=>{const d=S.inv[id]-(inv0[id]||0),it=S.items[id];if(d>0&&!isEss(id)){if(canDecon(it)){sEss+=d*decEss(it);sEmb+=d*salvageEmbers(it)}else if(canSalvage(it)){sEss+=d*salvageYield(it).length*plainEq(salvGrade(it));sEmb+=d*salvageEmbers(it)}}});
    return{...r,embers:S.stats.earned,ess:essCount()-e0,items:itemCount()-i0,steps,dark,tEnd,sEss,sEmb};
  };
}

// ---------- node side ----------
const pct=x=>Math.round(x*100),f1=x=>(Math.round(x*10)/10).toFixed(1),median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0};
const sg=(v,f)=>(v>0?"+":"")+(f?f(v):v); // a signed number with its sign kept ("+5", "-1.9")
const RK=["","magic","rare"],ZN=["woods","pass","hollow","spire"],kitName=(t,z)=>`${t}/${z}`;
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
  const enemiesAll=await P0.evaluate(()=>Object.entries(ENEMIES).map(([id,e])=>({id,zone:e.zone,boss:!!e.boss,name:e.name,gen:!!e.gen,rar:e.rar||"",afx:e.afx||[],mv:e.mv||"",biome:(typeof ZONE_BIOME!=="undefined"&&ZONE_BIOME[e.zone])||""})));
  // coverage guard: every element of a region's biome pool needs an authored (hand-made, non-boss) enemy of that region
  const EL_EXCEPT={}; // documented exceptions, per region: elements deliberately left uncovered (none at the moment)
  const cov=await P0.evaluate(()=>Object.entries(ZONE_BIOME).map(([z,bi])=>{const pool=BIOMES[bi].els,
    els=new Set(Object.values(ENEMIES).filter(e=>!e.gen&&!e.boss&&e.zone===z).map(e=>e.el));
    return{z,bi,pool,gap:pool.filter(e=>!els.has(e))}}));
  console.log(`== Element coverage (authored, non-boss): ${cov.map(c=>`${c.z} ${c.pool.length-c.gap.length}/${c.pool.length}`).join(", ")} ==`);
  const gaps=cov.flatMap(c=>c.gap.filter(e=>!(EL_EXCEPT[c.z]||[]).includes(e)).map(e=>`${c.z}: ${e}`));
  if(gaps.length){console.error(`FAIL: biome elements with no authored enemy: ${gaps.join(", ")}`);await browser.close();process.exit(1)}
  if(has("fresh")){ // the first expeditions with gating, then done
    const n=+opt("exped",5),rows=await P0.evaluate(([n,p,sd])=>SIM.fresh(n,p,sd),[n,POLS[0],SEED]);
    console.log(`== Fresh save: ${n} expeditions in the Woods with the unlock gates on (starter kit, ${POLS[0]} policy) ==\nColumns: result, steps, fights, wins this run; POIs placed on the map (shown by type); POI types the bot walked into; what opened afterwards (smith Lv / total wins / expeditions finished).`);
    rows.forEach(r=>console.log(`#${r.e} ${r.res.padEnd(11)} ${String(r.steps).padStart(3)} steps ${String(r.fights).padStart(2)} fights ${String(r.wins).padStart(2)} wins | map: ${Object.entries(r.pois).map(([t,c])=>t+" "+c).join(", ")}\n     met: ${Object.entries(r.visits).map(([t,c])=>t+" "+c).join(", ")||"nothing"} | then Lv ${r.sc.lv}, ${r.sc.wins} wins, ${r.sc.exps} expeditions -> opened: ${r.opened.join(", ")||"-"}\n     research: +${r.rp.gain} RP (${r.rp.earned} earned, ${r.rp.have} unspent; sources so far: ${Object.entries(r.rp.src).map(([k,n])=>k+" "+n).join(", ")})${r.rp.learned.length?` | learned: ${r.rp.learned.join(", ")}`:""}`));
    const tc=await P0.evaluate(()=>TECHS.filter(t=>t.cost).map(t=>({n:t.name,c:t.cost,rq:rqT(t)})));
    console.log(`\nResearch: RP earned per expedition: ${rows.map(r=>r.rp.gain).join(", ")} (mean ${f1(rows.reduce((a,r)=>a+r.rp.gain,0)/rows.length)}). The bot deconstructs raw finds, infuses essences into the sword, studies up to three families per expedition and learns the cheapest technique it can afford.\nA technique is affordable on the first expedition whose cumulative RP earned reaches its cost (its Smith level or skill requirement may come later). A slot technique costs 3 once its group is known, and the first one after a group technique is free:\n${tc.map(t=>{const k=rows.find(r=>r.rp.earned>=t.c);return `  ${t.n.padEnd(13)} ${String(t.c).padStart(2)} RP  ${k?"expedition "+k.e:"not yet"}${t.rq?"  (needs "+t.rq+")":""}`}).join("\n")}`);
    await browser.close();return}
  const zones=list("zone",ZN),kitSel=list("kit",null),mastered=!has("no-mastered");
  const eSel=list("enemy",null),pickE=e=>eSel?eSel.includes(e.id):(e.zone==="any"||zones.includes(e.zone));
  const enemies=enemiesAll.filter(e=>!e.gen&&pickE(e)); // the hand-made regulars (the wild creatures have their own section)
  const wild=enemiesAll.filter(e=>e.gen&&pickE(e)); // the ten wild creatures of every region
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
  if(has("trace")){
    const forceSel=list("force",FORCED?["normal","magic","rare"]:[]);
    const show=async(k,e,h,p,o,tag)=>{const r=await P0.evaluate(([n,e,h,p,o])=>SIM.trace(SIM.kits[n].snap,e,h,p,o),[k.name,e.id,h,p,o]);
      console.log(`\n--- ${k.name} vs ${e.id} H${h} ${p}${tag?" "+tag:""}: ${r.over} in ${r.turns} turns ---\n${r.log.join("\n")}\n${r.hps.join("\n")}`)};
    for(const k of kits)for(const e of [...enemies,...wild])for(const h of HEATS)for(const p of POLS){
      await show(k,e,h,p,{seed:SEED,row:ROW,zone:k.arr||k.on});
      if(e.gen)for(const f of forceSel)await show(k,e,h,p,{seed:SEED,row:ROW,zone:k.arr||k.on,rar:f,force:f},`(forced ${f})`)}
    // the Rift masters: --enemy rift_boss
    if(eSel&&eSel.includes("rift_boss")){
      const seeds=RIFT_SEEDS?await P0.evaluate(ss=>ss.map(s=>({s,seed:hash("sim-rift:"+s)})),RIFT_SEEDS):await P0.evaluate(()=>SIM.riftSeeds(RIFT_BIOMES.length));
      const rk=kits.filter(k=>k.zone==="spire");
      for(const sd of seeds)for(const d of RIFT_DEPTH)for(const k of rk)for(const p of POLS){
        const info=await P0.evaluate(([seed,dep])=>SIM.rift(seed,dep),[sd.seed,d]);
        for(const f of ["",...forceSel])await show(k,{id:"rift_boss"},0,p,{seed:SEED,row:ROW,zone:"rift",rs:sd.seed,rd:d,rar:f||"normal",force:f||undefined},`(seed ${sd.seed}, ${info.biome} · ${info.name}, depth ${d}${f?" forced "+f:""})`)}}
    await browser.close();return}
  const result={args:{n:N,seed:SEED,row:ROW,heats:HEATS,policies:POLS,elite:ELITE,mastered,wild:!NO_WILD,riftSeeds:RIFT_SEEDS,riftDepth:RIFT_DEPTH},kits:sums,cells:[],wild:[],wildByRegion:[],rift:[],attr:[],econ:[]};
  const E=Object.fromEntries(enemiesAll.map(e=>[e.id,e])),K=Object.fromEntries(kits.map(k=>[k.name,k]));
  // the shared cell runner: the cells are grouped by rarity, so every chunk holds one rarity at a time
  const runCells=async(todo,label)=>{
    const chunks=Array.from({length:JOBS},()=>[]);todo.forEach((x,i)=>chunks[i%JOBS].push(x));let done=0;
    const out=(await Promise.all(chunks.map((ch,i)=>(async()=>{const o=[];
      for(let j=0;j<ch.length;j+=60){const part=ch.slice(j,j+60);
        for(const vr of [...new Set(part.map(x=>x.vr))]){const sub=part.filter(x=>x.vr===vr).map(x=>x.c),r=await pages[i].evaluate(([c,n,o])=>SIM.cells(c,n,o),[sub,N,{seed:SEED,row:ROW}]);r.forEach(x=>o.push({...x,vr}));done+=sub.length}
        if(process.stderr.isTTY)process.stderr.write(`\r${label} ${done}/${todo.length} cells  ${Math.round((Date.now()-t0)/1000)}s`)}
      return o})()))).flat();
    if(process.stderr.isTTY)process.stderr.write("\n");
    return out};
  // ---- the regular matrix: the hand-made enemies only (the wild creatures have their own section)
  let res=[];
  if(RUN_MATRIX||RUN_WILD){
    const todo=[];
    for(const k of kits)for(const e of enemies){
      const variants=e.id==="mimic"?[k.on&&[k.on,"on"],k.arr&&[k.arr,"arr"]].filter(Boolean):[[null,e.zone===k.arr?"arr":e.zone===k.on?"on":"off"]];
      // FORCED (--wild or --elite) also runs the regulars' magic/rare variants: the wild table needs them as the like-for-like baseline
      for(const [mz,mode] of variants)for(const h of HEATS)for(const p of POLS)for(const el of FORCED&&!e.boss&&e.id!=="mimic"?["","magic","rare"]:[""])todo.push({c:{k:k.name,e:e.id,h,p,mz,mode,rar:el||"normal",nat:!el,el},vr:el||"normal"})}
    res=await runCells(todo,"matrix");
    res.forEach(c=>{c.flags=c.nat?flagsOf(c,c.mode,E[c.e]):[];c.enemy=c.e+({magic:"+",rare:"*"}[c.vr]||"")});
    const MO={arr:0,on:1,off:2};
    res.sort((a,b)=>MO[a.mode]-MO[b.mode]||enemies.findIndex(e=>e.id===a.e)-enemies.findIndex(e=>e.id===b.e)||(RK.indexOf(a.el)-RK.indexOf(b.el))||kits.findIndex(k=>k.name===a.k)-kits.findIndex(k=>k.name===b.k)||POLS.indexOf(a.p)-POLS.indexOf(b.p)||a.h-b.h);
    result.cells=res;
  }
  if(RUN_MATRIX){
    const heads={arr:"ARRIVAL (previous stage's kit meets this zone; starter kit meets the woods): the main pairing",on:"ON-STAGE (the kit's own zone)",off:"OTHER pairings"};
    for(const mode of ["arr","on","off"]){
      if(mode==="off"&&!has("all"))continue;
      console.log(`\n== Matrix, ${heads[mode]}: ${N} fights per cell, seed ${SEED??"random"}, map row ${ROW}${has("elite")?", + magic, * rare":""}. Per heat: win% / mean turns / mean HP left% (losses count 0) ==`);
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
  }
  if(RUN_MATRIX||RUN_WILD){
    // attrition: whole expedition on one HP bar
    if(has("attrition")){
      console.log(`\n== Attrition: 4 regulars (rows 1-4) then the boss on one HP bar, 35% heal after fights 2 and 4; ${N} expeditions per cell. Per heat: clear% / mean fights won (of 5) ==`);
      console.log(`${"kit".padEnd(17)}${"mode".padEnd(5)}${"zone".padEnd(8)}${"policy".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(14)).join("")}`);
      const jobs=kits.flatMap(k=>[["arr",k.arr],["on",k.on]].filter(x=>x[1]).flatMap(([mode,z])=>POLS.map(p=>({k:k.name,mode,z,p}))));
      const out=(await Promise.all(Array.from({length:JOBS},(_,i)=>(async()=>{const o=[];for(const j of jobs.filter((_,x)=>x%JOBS===i)){const hs=[];for(const h of HEATS)hs.push(await pages[i].evaluate(([k,z,h,p,n,seed])=>SIM.attr(SIM.kits[k].snap,z,h,p,n,{seed,kit:k}),[j.k,j.z,h,j.p,N,SEED]));o.push({...j,heats:hs})}return o})()))).flat();
      const ord=x=>jobs.findIndex(j=>j.k===x.k&&j.mode===x.mode&&j.p===x.p);out.sort((a,b)=>ord(a)-ord(b));result.attr=out;
      out.forEach(o=>console.log(`${o.k.padEnd(17)}${o.mode.padEnd(5)}${o.z.padEnd(8)}${o.p.padEnd(8)}${o.heats.map(x=>`${pct(x.clear)}% ${f1(x.fights)}`.padEnd(14)).join("")}`))}
  }
  // ---- the wild creatures of the four regions: their own section (the regular matrix above holds the hand-made enemies only)
  if(RUN_WILD){
    const todo=[];
    for(const k of kits)for(const e of wild){
      const mode=e.zone===k.arr?"arr":e.zone===k.on?"on":"off";
      if(mode==="off"&&!has("all"))continue;
      for(const h of HEATS)for(const p of POLS){
        todo.push({c:{k:k.name,e:e.id,h,p,mz:e.zone,mode,rar:"normal",nat:true},vr:"native"});
        if(FORCED)for(const vr of ["normal","magic","rare"])todo.push({c:{k:k.name,e:e.id,h,p,mz:e.zone,mode,rar:vr,force:vr,nat:false},vr})}
    }
    const wres=await runCells(todo,"wild");
    wres.forEach(c=>{c.flags=flagsOf(c,c.mode,E[c.e]||{})});
    result.wild=wres;
    const wlabel=e=>`${e.id} ${e.name} (${e.rar}: ${e.afx.join(", ")})`;
    const heads={arr:"ARRIVAL (previous stage's kit meets this zone; starter kit meets the woods): the main pairing",on:"ON-STAGE (the kit's own zone)",off:"OTHER pairings"};
    for(const mode of ["arr","on","off"]){
      const rows=wres.filter(c=>c.mode===mode);
      if(!rows.length)continue;
      console.log(`\n== Wild creatures, ${heads[mode]}: ${N} fights per cell, seed ${SEED??"random"}, map row ${ROW}. "native" is the creature as the game rolls it (its own rarity and affixes); the forced rows put its stats back on the region band and roll the affixes like a regular's. Per heat: win% / mean turns / mean HP left% (losses count 0) ==`);
      console.log(`${"creature".padEnd(46)}${"kit".padEnd(17)}${"policy".padEnd(8)}${"rarity".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(17)).join("")}flags`);
      const groups={};rows.forEach(c=>{const key=[c.e,c.k,c.p,c.vr].join("|");(groups[key]=groups[key]||[]).push(c)});
      Object.values(groups).forEach(g=>{const c0=g[0],e=E[c0.e];
        console.log(`${wlabel(e).padEnd(46)}${c0.k.padEnd(17)}${c0.p.padEnd(8)}${c0.vr.padEnd(8)}${HEATS.map(h=>{const c=g.find(x=>x.h===h);return c?`${String(pct(c.win)).padStart(3)}% ${f1(c.turns).padStart(5)}t ${String(pct(c.hp)).padStart(3)}%`.padEnd(17):"".padEnd(17)}).join("")}${c0.nat?[...new Set(g.flatMap(x=>x.flags))].join(" "):""}`)})}
    // ---- wild by region/biome: the mean over a region's creatures, against the hand-made regulars of the same zone
    const regions=await P0.evaluate(()=>ZONES.map(z=>z[0]).filter(z=>z!=="rift"));
    const biome=await P0.evaluate(()=>({...ZONE_BIOME}));
    const wc=(e,k,p,h,vr)=>wres.find(x=>x.e===e.id&&x.k===k&&x.p===p&&x.h===h&&x.vr===vr);
    console.log(`\n== Wild by region/biome: the mean over the region's wild creatures. "Δ vs regulars" is the difference from the same zone's hand-made regulars (same kit, policy, Heat): win in points, turns in turns, HP left in points. A forced magic/rare row is compared with the regulars of that same rarity (the --elite rows); without them the Δ is "-". The flags count the region's creatures flagged at Heat 0. ==`);
    for(const region of regions){
      const cs=wild.filter(e=>e.zone===region);
      if(!cs.length)continue;
      const ks=kits.filter(k=>k.arr===region||k.on===region);
      if(!ks.length){console.log(`\n-- ${region} (${biome[region]||"?"}): no kit pairs with this region --`);continue}
      console.log(`\n-- ${region} (${biome[region]||"?"}), ${cs.length} wild creatures --`);
      console.log(`${"kit".padEnd(17)}${"policy".padEnd(8)}${"rarity".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(19)).join("")}${HEATS.map(h=>("ΔH"+h).padEnd(16)).join("")}flags`);
      for(const k of ks)for(const p of POLS)for(const vr of (FORCED?["native","normal","magic","rare"]:["native"])){
        const base=vr==="magic"?"magic":vr==="rare"?"rare":"normal"; // the regulars of the same rarity: the baseline of a forced row
        const row=HEATS.map(h=>{
          const xs=cs.map(e=>wc(e,k.name,p,h,vr)).filter(Boolean);
          const rs=res.filter(x=>x.k===k.name&&x.p===p&&x.h===h&&x.vr===base&&E[x.e]&&E[x.e].zone===region&&!E[x.e].boss);
          if(!xs.length)return null; // nothing ran here: the cell is empty, not 0%
          const mw=xs.reduce((a,c)=>a+c.win,0)/xs.length,mt=xs.reduce((a,c)=>a+c.turns,0)/xs.length,mhp=xs.reduce((a,c)=>a+c.hp,0)/xs.length;
          if(!rs.length)return{w:mw,t:mt,hp:mhp,d:null};
          const rw=rs.reduce((a,c)=>a+c.win,0)/rs.length,rt=rs.reduce((a,c)=>a+c.turns,0)/rs.length,rhp=rs.reduce((a,c)=>a+c.hp,0)/rs.length;
          return{w:mw,t:mt,hp:mhp,d:{win:Math.round((mw-rw)*100),turns:mt-rt,hp:Math.round((mhp-rhp)*100)}}});
        const f0=cs.map(e=>wc(e,k.name,p,0,vr)).filter(Boolean);
        const fl=[["TOO_HARD",f0.filter(c=>c.flags.includes("TOO_HARD")).length],["TOO_EASY",f0.filter(c=>c.flags.includes("TOO_EASY")).length]].filter(x=>x[1]).map(x=>`${x[0]} ${x[1]}`).join(", ");
        console.log(`${k.name.padEnd(17)}${p.padEnd(8)}${vr.padEnd(8)}${row.map(r=>r?`${String(pct(r.w)).padStart(3)}% ${f1(r.t).padStart(5)}t ${String(pct(r.hp)).padStart(3)}%`.padEnd(19):"-".padEnd(19)).join("")}${row.map(r=>r&&r.d?`${sg(r.d.win)}/${sg(r.d.turns,f1)}/${sg(r.d.hp)}`.padEnd(16):"-".padEnd(16)).join("")}${fl}`);
        result.wildByRegion.push({region,biome:biome[region]||"",creatures:cs.length,kit:k.name,policy:p,rarity:vr,
          heats:HEATS.map((h,i)=>row[i]?{h,win:row[i].w,turns:row[i].t,hp:row[i].hp,delta:row[i].d}:{h,win:null,turns:null,hp:null,delta:null}),flags:fl})}}
    // ---- the Rift: a region rolled from one seed, its master and (with --rift-wild) its own wild creatures
    const seeds=RIFT_SEEDS?await P0.evaluate(ss=>ss.map(s=>({s,seed:hash("sim-rift:"+s)})),RIFT_SEEDS):await P0.evaluate(()=>SIM.riftSeeds(RIFT_BIOMES.length));
    const rk=kits.filter(k=>k.zone==="spire"),rvars=["native","magic","rare"];
    if(!rk.length)console.log(`\n== Rift masters: no spire kit to bring to the Rift (--kit picked something else) ==`);
    else{
      const rids=await P0.evaluate(([sd])=>SIM.rift(sd,1).wild,[seeds[0].seed]);
      const rtodo=[];
      for(const sd of seeds)for(const d of RIFT_DEPTH)for(const k of rk)for(const p of POLS)for(const vr of rvars){
        const f=vr!=="native",ids=RIFT_WILD?["rift_boss",...rids]:["rift_boss"];
        for(const id of ids)rtodo.push({c:{k:k.name,e:id,h:0,p,mz:"rift",rs:sd.seed,rd:d,rar:f?vr:"normal",force:f?vr:undefined,nat:!f},vr})}
      const rres=await runCells(rtodo,"rift");
      rres.forEach(c=>{c.flags=flagsOf(c,"on",{boss:c.e==="rift_boss"})});
      console.log(`\n== Rift masters: ${seeds.length} seeds × ${RIFT_DEPTH.join(",")} depths × ${rk.length} kits × ${POLS.length} policies, ${N} fights per cell. Heat 0 (the Rift has no Heat), the Rift not mastered, map row 0 (as for bosses). "native" is the master as the game fights it today (a boss gets no affixes); "magic" and "rare" apply the master's own affixes to the fight (sim-only). ==`);
      const rinfo={};
      for(const sd of seeds)for(const d of RIFT_DEPTH){
        const info=await P0.evaluate(([seed,dep])=>SIM.rift(seed,dep),[sd.seed,d]);
        rinfo[sd.seed+":"+d]=info;
        console.log(`\n-- seed ${sd.seed} (${info.biome} · ${info.name}) · ${info.master.name} (${info.master.el}) · depth ${d} · tier HP ${info.tier.hp} ATK ${info.tier.atk} DEF ${info.tier.def} --`);
        const line=(k,p,id,label)=>{
          const cs=rvars.map(vr=>rres.find(x=>x.k===k.name&&x.p===p&&x.rs===sd.seed&&x.rd===d&&x.e===id&&x.vr===vr));
          const txt=cs.map((c,i)=>c?`${rvars[i].padEnd(6)} ${String(pct(c.win)).padStart(3)}% ${f1(c.turns).padStart(5)}t ${String(pct(c.hp)).padStart(3)}%${c.flags.length?" "+c.flags.join(" "):""}`:`${rvars[i].padEnd(6)} -`).join(" | ");
          console.log(`${label.padEnd(20)}${k.name.padEnd(17)}${p.padEnd(8)}${txt}`)};
        for(const k of rk)for(const p of POLS)line(k,p,"rift_boss",info.master.name);
        if(RIFT_WILD)for(const id of rids)for(const k of rk)for(const p of POLS)line(k,p,id,"   "+id);
        result.rift.push({seed:sd.seed,depth:d,biome:info.biome,region:info.name,master:info.master,cells:rres.filter(x=>x.rs===sd.seed&&x.rd===d)})}
      // the summary: the master (native row) by biome and by depth
      const nat=rres.filter(x=>x.e==="rift_boss"&&x.vr==="native");
      const mean=xs=>xs.length?pct(xs.reduce((a,c)=>a+c.win,0)/xs.length):null;
      const mb={},db={};nat.forEach(x=>{const b=rinfo[x.rs+":"+x.rd].biome;(mb[b]=mb[b]||[]).push(x);(db[x.rd]=db[x.rd]||[]).push(x)});
      console.log(`\n-- Rift summary (the master, native row) ==`);
      console.log(`by biome: ${Object.entries(mb).map(([b,xs])=>`${b} ${mean(xs)}%`).join("  ")}`);
      console.log(`by depth: ${Object.entries(db).map(([d,xs])=>`depth ${d} ${mean(xs)}%`).join("  ")}`);
      // the Rift's own wild creatures (with --rift-wild): the same summary, with the flags of the cells
      const wnat=rres.filter(x=>x.e!=="rift_boss"&&x.vr==="native");
      if(wnat.length){
        const wmb={},wdb={};wnat.forEach(x=>{const b=rinfo[x.rs+":"+x.rd].biome;(wmb[b]=wmb[b]||[]).push(x);(wdb[x.rd]=wdb[x.rd]||[]).push(x)});
        const flg=xs=>{const h=xs.filter(c=>c.flags.includes("TOO_HARD")).length,e=xs.filter(c=>c.flags.includes("TOO_EASY")).length;return[h?`TOO_HARD ${h}`:"",e?`TOO_EASY ${e}`:""].filter(Boolean).join(", ")};
        const line=(xs)=>`${mean(xs)}%${flg(xs)?` (${flg(xs)})`:""}`;
        console.log(`\n-- Rift summary (the master's wild creatures, native row; the flags count the cells) ==`);
        console.log(`by biome: ${Object.entries(wmb).map(([b,xs])=>`${b} ${line(xs)}`).join("  ")}`);
        console.log(`by depth: ${Object.entries(wdb).map(([d,xs])=>`depth ${d} ${line(xs)}`).join("  ")}`)}
    }
  }
  // rarity table: each kit's arrival pairing (the previous stage's kit against the next zone's regulars, at map row ROW), every regular enemy, every affix in turn
  if(RARITY){
    const cells=[];for(const k of kits){if(!k.arr)continue;for(const e of enemies.filter(e=>!e.boss&&e.id!=="mimic"&&e.zone===k.arr))for(const h of HEATS)for(const p of POLS)for(const rar of ["normal","magic","rare"])cells.push({k:k.name,e:e.id,h,p,rar})}
    const chunks=Array.from({length:JOBS},()=>[]);cells.forEach((x,i)=>chunks[i%JOBS].push(x));
    const out=(await Promise.all(chunks.map((ch,i)=>(async()=>{const o=[];for(let j=0;j<ch.length;j+=40){const part=ch.slice(j,j+40);
      for(const rar of ["normal","magic","rare"]){const sub=part.filter(x=>x.rar===rar);if(!sub.length)continue;(await pages[i].evaluate(([c,n,oo])=>SIM.cells(c,n,oo),[sub,N,{seed:SEED,row:ROW,rar}])).forEach(r=>o.push({...r,rar}))}}return o})()))).flat();
    const agg=(xs)=>{const n=xs.reduce((a,c)=>a+c.n,0),w=a=>xs.reduce((s,c)=>s+c[a]*c.n,0)/n;return{win:w("win"),turns:w("turns"),hp:w("hp")}};
    console.log(`\n== Rarity table, ARRIVAL (previous stage's kit vs this zone's regular enemies, map row ${ROW}, ${N} fights per enemy and cell, every affix in turn). Per heat: win% / mean turns / mean HP left% ==`);
    console.log(`${"kit".padEnd(17)}${"policy".padEnd(8)}${"rarity".padEnd(8)}${HEATS.map(h=>("H"+h).padEnd(17)).join("")}flags`);
    let bad=0;
    for(const k of kits){if(!k.arr)continue;for(const p of POLS)for(const rar of ["normal","magic","rare"]){
      const row=HEATS.map(h=>agg(out.filter(c=>c.k===k.name&&c.p===p&&c.rar===rar&&c.h===h))),fl=[];
      if(rar!=="normal"&&p==="smart"&&HEATS.some((h,i)=>h<=3&&row[i].win<.85))fl.push("RARE_HARD");if(row.some(r=>r.turns>30))fl.push("SLOG");if(fl.length)bad++;
      console.log(`${k.name.padEnd(17)}${p.padEnd(8)}${rar.padEnd(8)}${row.map(r=>`${String(pct(r.win)).padStart(3)}% ${f1(r.turns).padStart(5)}t ${String(pct(r.hp)).padStart(3)}%`.padEnd(17)).join("")}${fl.join(" ")}`)}}
    console.log(`flagged rows: ${bad} (RARE_HARD: smart win under 85% at Heat 0-3, which includes magic; SLOG: mean turns over 30)`);
    for(const rar of ["magic","rare"])for(const h of HEATS){console.log(`\nBy first affix, ${rar}, smart, Heat ${h}, all arrival kits: win% (fights)`);
      const by={};out.filter(c=>c.rar===rar&&c.p==="smart"&&c.h===h).forEach(c=>Object.entries(c.ba).forEach(([a,[n,w]])=>{const x=by[a]||(by[a]=[0,0]);x[0]+=n;x[1]+=w}));
      console.log(Object.entries(by).map(([a,[n,w]])=>`${a} ${pct(w/n)}%`).join("  ")+`  (${Object.values(by)[0][0]} each)`)}
    result.rarity=out;
  } else
  // economy
  if(RUN_ECON){
    const ez=zones,eh=HEATS[0],ep=POLS.includes("smart")?"smart":POLS[0];
    console.log(`\n== Economy: ${EXPED} expeditions per zone, ${ep} policy, melee stage kit (codex mastered for its zone), Heat ${eh} ==`);
    console.log("Columns WITHOUT salvage: embers (fight rewards), ess (essences from chests, shrines, elites, bosses...), items (all drops). Columns WITH salvage (the bot never salvages; this is the value of the new non-equipped loot if you did): sv.ess (essences) and sv.emb (embers); emb+sv and ess+sv are the totals; gear/exp = (embers+sv.emb) / median shop gear price.");
    const cols=[["zone",8],["kit",14],["clear%",7],["lost%",6],["fights",7],["by foe",7],["magic",6],["rare",6],["embers",7],["sv.emb",7],["emb+sv",7],["ess",5],["sv.ess",7],["ess+sv",7],["items",6],["shops",6],["steps",6],["dark",5],["torch",6],["gear price min-med-max",23],["ess price",10],["emb@shop",9],["gear/exp",8]];
    console.log(cols.map(([c,w])=>c.padEnd(w)).join(""));
    for(const z of ez){const k=kits.find(k=>k.on===z&&k.type==="melee")||kits.find(k=>k.on===z);if(!k)continue;
      const ids=Array.from({length:EXPED},(_,i)=>i),chunks=Array.from({length:JOBS},(_,j)=>ids.filter(i=>i%JOBS===j));
      const rs=(await Promise.all(chunks.map((ch,j)=>pages[j].evaluate(([n,zz,h,p,ids,seed])=>ids.map(i=>SIM.exped(SIM.kits[n].snap,zz,h,p,"exp"+zz+i,seed)),[k.name,z,eh,ep,ch,SEED])))).flat();
      const avg=f=>rs.reduce((a,r)=>a+f(r),0)/rs.length,shops=rs.flatMap(r=>r.shops),gear=shops.flatMap(s=>s.gear),essP=shops.flatMap(s=>s.ess);
      const row={zone:z,kit:k.name,clear:avg(r=>r.won),lost:avg(r=>r.lost),fights:avg(r=>r.fights),cont:avg(r=>r.cont),mags:avg(r=>r.mags),rares:avg(r=>r.rares),embers:avg(r=>r.embers),salvEmb:avg(r=>r.sEmb),ess:avg(r=>r.ess),salvEss:avg(r=>r.sEss),items:avg(r=>r.items),shops:shops.length/rs.length,steps:avg(r=>r.steps),dark:avg(r=>r.dark),torch:avg(r=>r.tEnd),
        gear:gear.length?[Math.min(...gear),median(gear),Math.max(...gear)]:null,essPrice:essP.length?[Math.min(...essP),Math.max(...essP)]:null,embAtShop:shops.length?shops.reduce((a,s)=>a+s.emb,0)/shops.length:0,exped:rs.length};
      row.affordable=gear.length?(row.embers+row.salvEmb)/median(gear):0;result.econ.push(row);
      console.log([z,k.name,pct(row.clear),pct(row.lost),f1(row.fights),f1(row.cont),f1(row.mags),f1(row.rares),f1(row.embers),f1(row.salvEmb),f1(row.embers+row.salvEmb),f1(row.ess),f1(row.salvEss),f1(row.ess+row.salvEss),f1(row.items),f1(row.shops),f1(row.steps),f1(row.dark),f1(row.torch),row.gear?row.gear.join("-"):"-",row.essPrice?[...new Set(row.essPrice)].join("-"):"-",f1(row.embAtShop),f1(row.affordable)].map((v,i)=>String(v).padEnd(cols[i][1])).join(""))}
  }
  await browser.close();
  if(OUT){fs.writeFileSync(OUT,JSON.stringify(result));console.log(`\nwrote ${OUT}`)}
  console.log(`done in ${Math.round((Date.now()-t0)/1000)}s`);
}
main().catch(e=>{console.error(e);process.exit(1)});
