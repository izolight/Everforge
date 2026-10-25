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
  if(!it.crafted&&gradable(baseIdOf(it.id))){const q=gradeOf(it.id),es=isEss(it.id);
    out.push(tx(!es?"Grade: {grade}, traits ×{m} (Plain is ×1). Upgrade {n} of a grade into 1 of the next in the Forge tab.":q>3?"Grade: {grade}, trait ×{m} (Plain is ×1). Counts as {eq} plain essences for infusion. Upgrade {n} of a grade into 1 of the next in the Forge tab.":"Grade: {grade}, trait ×{m} (Plain is ×1). Counts as {eq} plain essence for infusion. Upgrade {n} of a grade into 1 of the next in the Forge tab.",{grade:gradeN(q),m:GRADE_M[q-1],eq:INF_EQ[q-1],n:UP.n}))}
  if(g==="weapon"){const f=v("Fire")+v("Sunfire"),i=v("Ice")+v("Frost"),p=v("Poison")+v("Venomous"),h=v("Holy")+v("Radiant"),s=v("Shadow")+v("Twilight");
    out.push(tx("{p}% critical hit chance",{p:Math.round(Math.min(CRIT_CAP,5+v("Sharp")*3))}));
    if(v("Sharp"))out.push(tx("Elusive enemies dodge {p}% less against it",{p:Math.min(AFX_T.dodge.sharpCap,v("Sharp")*AFX_T.dodge.sharp)}));
    if(f)out.push(tx("Sets enemies on fire for {n} damage per turn",{n:Math.max(1,Math.round(f*.8))}));
    if(i)out.push(tx("{p}% chance to freeze an enemy for a turn",{p:Math.round(Math.min(FREEZE_CAP,6+i*4))}));
    if(p)out.push(tx("Adds {n} poison per hit, stacking",{n:Math.round(p)}));
    if(h)out.push(tx("Heals you {n} HP per hit",{n:Math.round(h)}));
    if(s)out.push(tx("Drains {p}% of damage dealt as HP",{p:Math.round(Math.min(.4,.07*s)*100)}));
    if(v("Heavy"))out.push(tx("Hits pierce 60% of enemy armor"));
    if(v("Arcane"))out.push(tx("{p}% chance a hit ignores elemental resistance",{p:Math.round(Math.min(ARC_CAP,v("Arcane")*ARC_PER))}));
    if(v("Tempered"))out.push(tx("Each hit cracks enemy armor, up to -{n} DEF",{n:Math.round(Math.min(SHRED_CAP,v("Tempered")*SHRED_PER))}))}
  const ab=g==="weapon"?ABILITIES[it.form]:it.form==="shield"?ABILITIES.shield:null;
  if(ab)out.push(isUnl("ability")?tx(g==="weapon"?"Ability (main hand), {name}: {desc} Cooldown {cd}.":"Ability, {name}: {desc} Cooldown {cd}.",{name:ab.name,desc:ab.desc,cd:ab.cd}):tx("Carries an ability you will learn to use later."));
  if(isGear(it)){
    if(st.heal>0)out.push(tx("Mends about {n} HP per battle turn",{n:Math.max(1,Math.round(st.heal*.2+v("Medicine")*MED_REGEN))}));
    if(v("Steam"))out.push(tx("Enemies miss you {p}% of the time",{p:Math.round(Math.min(40,8*v("Steam")))}));
    if(v("Lure"))out.push(tx("+{p}% loot drop chance",{p:Math.round(v("Lure")*15)}));
    if(g!=="weapon"){const rr=resRaw(tr);Object.keys(rr).forEach(k=>{const p=resPct(rr[k]);if(p)out.push(tx("Resists {fam} attacks by {p}%",{fam:famL(k),p}))})
      if(v("Iron"))out.push(tx("Reflects {p}% of damage taken back at the attacker",{p:Math.round(Math.min(THORN_CAP,v("Iron")*THORN_PER))}));
      if(v("Stone"))out.push(tx("Reduces each hit you take by {n}",{n:r1(Math.min(STONE_CAP,v("Stone")*STONE_DR))}))}
    if(v("Runic"))out.push(tx("Ward absorbs {n} damage at the start of each battle",{n:Math.round(Math.min(WARD_CAP,v("Runic")*WARD_PER))}));
    if(v("Wood"))out.push(tx("Heals {n} HP per turn while below half health",{n:Math.round(Math.min(ROOT_CAP,v("Wood")*ROOT_PER))}));
    if(v("Swift"))out.push(tx("{p}% chance to dodge a hit",{p:Math.round(Math.min(DODGE_CAP,v("Swift")*DODGE_PER))}));
    if(v("Medicine"))out.push(tx("{p}% chance each turn to shake off a status (burn, chill, poison, curse)",{p:Math.round(Math.min(CLEANSE_CAP,v("Medicine")*CLEANSE_PER))}));
    if(it.form==="shield")out.push(tx("{p}% chance to block a hit",{p:Math.round(15+v("Heavy")*3)}))}
  if(g==="consumable"){if(st.heal>0)out.push(tx(v("Medicine")?"Restores {n} HP (Medicine boosts healing)":"Restores {n} HP",{n:medHeal(it)}));const cu=cures(tr);if(cu.length)out.push(tx("Cures {list} when used in battle",{list:cu.map(s=>lc(STATUS[s].n)).join(", ")}));const d=Math.round((st.atk+st.mag)*.6);if(d>=3)out.push(tx("Deals about {n} damage when used in battle",{n:d}))}
  out.push(tx("Mixes with {list}",{list:acceptsText(it)}));
  return out;
}
