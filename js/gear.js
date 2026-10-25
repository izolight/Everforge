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
  if(!it.crafted&&gradable(baseIdOf(it.id))){const q=gradeOf(it.id),es=isEss(it.id);out.push(`Grade: ${GRADES[q-1][0]}, ${es?"trait":"traits"} ×${GRADE_M[q-1]} (Plain is ×1).${es?` Counts as ${INF_EQ[q-1]} plain essence${q>3?"s":""} for infusion.`:""} Upgrade ${UP.n} of a grade into 1 of the next in the Forge tab.`)}
  if(g==="weapon"){const f=v("Fire")+v("Sunfire"),i=v("Ice")+v("Frost"),p=v("Poison")+v("Venomous"),h=v("Holy")+v("Radiant"),s=v("Shadow")+v("Twilight");
    out.push(`${Math.round(Math.min(CRIT_CAP,5+v("Sharp")*3))}% critical hit chance`);
    if(v("Sharp"))out.push(`Elusive enemies dodge ${Math.min(AFX_T.dodge.sharpCap,v("Sharp")*AFX_T.dodge.sharp)}% less against it`);
    if(f)out.push(`Sets enemies on fire for ${Math.max(1,Math.round(f*.8))} damage per turn`);
    if(i)out.push(`${Math.round(Math.min(FREEZE_CAP,6+i*4))}% chance to freeze an enemy for a turn`);
    if(p)out.push(`Adds ${Math.round(p)} poison per hit, stacking`);
    if(h)out.push(`Heals you ${Math.round(h)} HP per hit`);
    if(s)out.push(`Drains ${Math.round(Math.min(.4,.07*s)*100)}% of damage dealt as HP`);
    if(v("Heavy"))out.push("Hits pierce 60% of enemy armor");
    if(v("Arcane"))out.push(`${Math.round(Math.min(ARC_CAP,v("Arcane")*ARC_PER))}% chance a hit ignores elemental resistance`);
    if(v("Tempered"))out.push(`Each hit cracks enemy armor, up to -${Math.round(Math.min(SHRED_CAP,v("Tempered")*SHRED_PER))} DEF`)}
  const ab=g==="weapon"?ABILITIES[it.form]:it.form==="shield"?ABILITIES.shield:null;
  if(ab)out.push(isUnl("ability")?`${g==="weapon"?"Ability (main hand)":"Ability"}, ${ab.name}: ${ab.desc} Cooldown ${ab.cd}.`:"Carries an ability you will learn to use later.");
  if(isGear(it)){
    if(st.heal>0)out.push(`Mends about ${Math.max(1,Math.round(st.heal*.2+v("Medicine")*MED_REGEN))} HP per battle turn`);
    if(v("Steam"))out.push(`Enemies miss you ${Math.round(Math.min(40,8*v("Steam")))}% of the time`);
    if(v("Lure"))out.push(`+${Math.round(v("Lure")*15)}% loot drop chance`);
    if(g!=="weapon"){const rr=resRaw(tr);Object.keys(rr).forEach(k=>{const p=resPct(rr[k]);if(p)out.push(`Resists ${k} attacks by ${p}%`)})
      if(v("Iron"))out.push(`Reflects ${Math.round(Math.min(THORN_CAP,v("Iron")*THORN_PER))}% of damage taken back at the attacker`);
      if(v("Stone"))out.push(`Reduces each hit you take by ${r1(Math.min(STONE_CAP,v("Stone")*STONE_DR))}`)}
    if(v("Runic"))out.push(`Ward absorbs ${Math.round(Math.min(WARD_CAP,v("Runic")*WARD_PER))} damage at the start of each battle`);
    if(v("Wood"))out.push(`Heals ${Math.round(Math.min(ROOT_CAP,v("Wood")*ROOT_PER))} HP per turn while below half health`);
    if(v("Swift"))out.push(`${Math.round(Math.min(DODGE_CAP,v("Swift")*DODGE_PER))}% chance to dodge a hit`);
    if(v("Medicine"))out.push(`${Math.round(Math.min(CLEANSE_CAP,v("Medicine")*CLEANSE_PER))}% chance each turn to shake off a status (burn, chill, poison, curse)`);
    if(it.form==="shield")out.push(`${Math.round(15+v("Heavy")*3)}% chance to block a hit`)}
  if(g==="consumable"){if(st.heal>0)out.push(`Restores ${medHeal(it)} HP${v("Medicine")?" (Medicine boosts healing)":""}`);const cu=cures(tr);if(cu.length)out.push(`Cures ${cu.join(", ")} when used in battle`);const d=Math.round((st.atk+st.mag)*.6);if(d>=3)out.push(`Deals about ${d} damage when used in battle`)}
  out.push(`Mixes with ${acceptsText(it)}`);
  return out;
}
