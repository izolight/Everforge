// ================= GEAR =================
function equip(id,slot){S.eq[slot]=id;if(eqCount(id)>(S.inv[id]||0))for(const [s] of SLOTS)if(s!==slot&&S.eq[s]===id){S.eq[s]=null;break}clampHp()}
function settleGear(result){
  const freed=[];for(const [s] of SLOTS){const id=S.eq[s];if(id&&eqCount(id)>(S.inv[id]||0)){S.eq[s]=null;freed.push(s)}}
  if(result&&isGear(result)){const fits=FORMS[result.form].slots;
    const slot=freed.find(s=>fits.includes(s))||fits.find(s=>!S.eq[s]&&(s!=="off"||grp(result)!=="weapon"));
    if(slot)S.eq[slot]=result.id}
  clampHp();
}
const targetSlot=it=>{const f=FORMS[it.form].slots;return f?f[0]:null};
function effects(it){
  const g=grp(it),tr=it.traits,v=t=>tr[t]||0,out=[],st=statsOf(it);
  // Keep the icon, displayed value and full explanation together so sheets and forge results agree.
  const add=(key,icon,value,name,text,color="var(--accent)",meta=false)=>out.push({key,icon,value,name,text,color,meta});
  if(!it.crafted&&gradable(baseIdOf(it.id))){const q=gradeOf(it.id),es=isEss(it.id);
    add("grade","tier",`×${GRADE_M[q-1]}`,gradeN(q),tx(!es?"Grade: {grade}, traits ×{m} (Plain is ×1). Upgrade {n} of a grade into 1 of the next in the Forge tab.":q>3?"Grade: {grade}, trait ×{m} (Plain is ×1). Counts as {eq} plain essences for infusion. Upgrade {n} of a grade into 1 of the next in the Forge tab.":"Grade: {grade}, trait ×{m} (Plain is ×1). Counts as {eq} plain essence for infusion. Upgrade {n} of a grade into 1 of the next in the Forge tab.",{grade:gradeN(q),m:GRADE_M[q-1],eq:INF_EQ[q-1],n:UP.n}),GRADES[q-1][1],true)}
  if(g==="weapon"){const f=v("Fire")+v("Sunfire"),i=v("Ice")+v("Frost"),p=v("Poison")+v("Venomous"),h=v("Holy")+v("Radiant"),s=v("Shadow")+v("Twilight");
    const crit=Math.round(Math.min(CRIT_CAP,5+v("Sharp")*3)),aim=Math.min(AFX_T.dodge.sharpCap,v("Sharp")*AFX_T.dodge.sharp);
    add("crit","crit",`${crit}%`,tx("Critical hit"),tx("{p}% critical hit chance",{p:crit}));
    if(v("Sharp"))add("aim","weak",`−${aim}%`,tx("Precision"),tx("Elusive enemies dodge {p}% less against it",{p:aim}));
    if(f){const n=Math.max(1,Math.round(f*.8));add("burn","f_fire",n,tx("Burn"),tx("Sets enemies on fire for {n} damage per turn",{n}),FAM.fire);out.at(-1).unit="turn"}
    if(i){const p=Math.round(Math.min(FREEZE_CAP,6+i*4));add("freeze","f_ice",`${p}%`,tx("Freeze"),tx("{p}% chance to freeze an enemy for a turn",{p}),FAM.ice)}
    if(p){add("poison","f_poison",`+${Math.round(p)}`,tx("Poison"),tx("Adds {n} poison per hit, stacking",{n:Math.round(p)}),FAM.poison);out.at(-1).unit="hit"}
    if(h){add("onheal","heal_hit",`+${Math.round(h)}`,tx("Healing on hit"),tx("Heals you {n} HP per hit",{n:Math.round(h)}),FAM.holy);out.at(-1).unit="hit"}
    if(s){const p=Math.round(Math.min(.4,.07*s)*100);add("drain","a_vamp",`${p}%`,tx("Life steal"),tx("Drains {p}% of damage dealt as HP",{p}),FAM.shadow)}
    if(v("Heavy"))add("pierce","pierce","60%",tx("Armor piercing"),tx("Hits pierce 60% of enemy armor"));
    if(v("Arcane")){const p=Math.round(Math.min(ARC_CAP,v("Arcane")*ARC_PER));add("arcane","arc_pierce",`${p}%`,tx("Resistance bypass"),tx("{p}% chance a hit ignores elemental resistance",{p}),FAM.arcane)}
    if(v("Tempered")){const n=Math.round(Math.min(SHRED_CAP,v("Tempered")*SHRED_PER));add("shred","armor_break",`−${n}`,tx("Armor break"),tx("Each hit cracks enemy armor, up to -{n} DEF",{n}))}}
  const ab=g==="weapon"?ABILITIES[it.form]:it.form==="shield"?ABILITIES.shield:null;
  if(ab){const open=isUnl("ability");add("ability",open?ab.icon:"lock",open?ab.cd:null,open?ab.name:tx("Ability"),open?tx(g==="weapon"?"Ability (main hand), {name}: {desc} Cooldown {cd}.":"Ability, {name}: {desc} Cooldown {cd}.",{name:ab.name,desc:ab.desc,cd:ab.cd}):tx("Carries an ability you will learn to use later."));if(open)out.at(-1).unit="cooldown"}
  if(isGear(it)){
    if(st.heal>0){const n=Math.max(1,Math.round(st.heal*.2+v("Medicine")*MED_REGEN));add("regen","a_regen",`+${n}`,tx("Regeneration"),tx("Mends about {n} HP per battle turn",{n}),FAM.heal);out.at(-1).unit="turn"}
    if(v("Steam")){const p=Math.round(Math.min(40,8*v("Steam")));add("blind","smoke",`${p}%`,tx("Blind"),tx("Enemies miss you {p}% of the time",{p}),FAM.ice)}
    if(v("Lure")){const p=Math.round(v("Lure")*15);add("loot","chest",`+${p}%`,tx("Loot bonus"),tx("+{p}% loot drop chance",{p}),FAM.holy)}
    if(g!=="weapon"){const rr=resRaw(tr);Object.keys(rr).forEach(k=>{const p=resPct(rr[k]);if(p)add("resist_"+k,"f_"+k,`${p}%`,tx("Resists {fam} {v}%",{fam:famN(k),v:p}),tx("Resists {fam} attacks by {p}%",{fam:famL(k),p}),FAM[k])})
      if(v("Iron")){const p=Math.round(Math.min(THORN_CAP,v("Iron")*THORN_PER));add("thorns","thorns",`${p}%`,tx("Thorns"),tx("Reflects {p}% of damage taken back at the attacker",{p}),FAM.metal)}
      if(v("Stone")){const n=r1(Math.min(STONE_CAP,v("Stone")*STONE_DR));add("dr","dr",`−${n}`,tx("Damage reduction"),tx("Reduces each hit you take by {n}",{n}),FAM.stone)}}
    if(v("Runic")){const n=Math.round(Math.min(WARD_CAP,v("Runic")*WARD_PER));add("ward","ward",n,tx("Ward"),tx("Ward absorbs {n} damage at the start of each battle",{n}),FAM.arcane)}
    if(v("Wood")){const n=Math.round(Math.min(ROOT_CAP,v("Wood")*ROOT_PER));add("root","root",`+${n}`,tx("Roots"),tx("Heals {n} HP per turn while below half health",{n}),FAM.wood);out.at(-1).unit="turn"}
    if(v("Swift")){const p=Math.round(Math.min(DODGE_CAP,v("Swift")*DODGE_PER));add("dodge","a_elusive",`${p}%`,tx("Dodge"),tx("{p}% chance to dodge a hit",{p}),FAM.swift)}
    if(v("Medicine")){const p=Math.round(Math.min(CLEANSE_CAP,v("Medicine")*CLEANSE_PER));add("cleanse","cleanse",`${p}%`,tx("Cleanse"),tx("{p}% chance each turn to shake off a status (burn, chill, poison, curse)",{p}),FAM.heal)}
    if(it.form==="shield"){const p=Math.round(15+v("Heavy")*3);add("block","guard",`${p}%`,tx("Block"),tx("{p}% chance to block a hit",{p}),FAM.stone)}}
  if(g==="consumable"){
    if(st.heal>0)add("heal","st_heal",`+${medHeal(it)}`,tx("Healing"),tx(v("Medicine")?"Restores {n} HP (Medicine boosts healing)":"Restores {n} HP",{n:medHeal(it)}),FAM.heal);
    const cu=cures(tr);if(cu.length){add("cure","cleanse",null,tx("Cures"),tx("Cures {list} when used in battle",{list:cu.map(s=>lc(STATUS[s].n)).join(", ")}),FAM.heal);out.at(-1).statuses=cu}
    const d=Math.round((st.atk+st.mag)*.6);if(d>=3)add("damage","hit",d,tx("Damage"),tx("Deals about {n} damage when used in battle",{n:d}),"var(--bad)")}
  add("mix","forge",null,tx("Mixing"),tx("Mixes with {list}",{list:acceptsText(it)}),"var(--muted)",true);
  return out;
}
function traitTip(t,v){
  const tr=TRAITS[t],st=Object.entries(tr.s).map(([k,n])=>`${n>0?"+":""}${n} ${STAT_NAMES[k]}`).join(", ");
  const notes=[];
  if(t==="Sharp")notes.push(tx("On weapons, each point adds 3 percentage points to critical-hit chance (up to {cap}%) and reduces Elusive dodge by {n} points (up to {max}).",{cap:CRIT_CAP,n:AFX_T.dodge.sharp,max:AFX_T.dodge.sharpCap}));
  if(t==="Heavy")notes.push(tx("On weapons, ignores 60% of enemy armor. On shields, each point adds 3 percentage points to the base 15% block chance."));
  if(["Fire","Sunfire"].includes(t))notes.push(tx("On weapons, burns enemies for damage each turn."));
  if(["Ice","Frost"].includes(t))notes.push(tx("On weapons, can freeze an enemy and make it lose a turn."));
  if(["Poison","Venomous"].includes(t))notes.push(tx("On weapons, adds stacking poison with every hit."));
  if(["Holy","Radiant"].includes(t))notes.push(tx("On weapons, restores HP with every hit."));
  if(["Shadow","Twilight"].includes(t))notes.push(tx("On weapons, heals you for a share of damage dealt."));
  if(t==="Arcane")notes.push(tx("On weapons, can bypass elemental resistance."));
  if(t==="Tempered")notes.push(tx("On weapons, each hit breaks down enemy armor."));
  if(t==="Iron")notes.push(tx("On armor and trinkets, reflects some damage back at the attacker."));
  if(t==="Stone")notes.push(tx("On armor and trinkets, takes a flat amount off each incoming hit."));
  if(t==="Runic")notes.push(tx("On equipped gear, grants a damage-absorbing ward at the start of battle."));
  if(t==="Wood")notes.push(tx("On equipped gear, heals you each turn while below half HP."));
  if(t==="Swift")notes.push(tx("On equipped gear, adds dodge chance. Speed also improves follow-up strikes and parries."));
  if(t==="Steam")notes.push(tx("On equipped gear, makes enemies more likely to miss."));
  if(t==="Lure")notes.push(tx("On equipped gear, improves loot drop chance."));
  if(t==="Medicine")notes.push(tx("On equipped gear, boosts regeneration and can clear a status each turn. On consumables, boosts healing."));
  const res=Object.keys(resRaw({[t]:v}));
  if(res.length)notes.push(tx("On armor and trinkets, grants resistance to {list}.",{list:res.map(famL).join(", ")}));
  if(CURES[t])notes.push(tx("On consumables, cures {list}.",{list:CURES[t].map(s=>lc(STATUS[s].n)).join(", ")}));
  return tt(`${trn(t)} ${v}`,tx("Base stats per point: {stats}.",{stats:st}),tx("Form, tier and trait order scale the final stats."),...notes);
}
