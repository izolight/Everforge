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
  if(g==="weapon"){const f=v("Fire")+v("Sunfire"),i=v("Ice")+v("Frost"),p=v("Poison")+v("Venomous"),h=v("Holy")+v("Radiant"),s=v("Shadow")+v("Twilight");
    out.push(`${Math.round(Math.min(CRIT_CAP,5+v("Sharp")*3))}% critical hit chance`);
    if(f)out.push(`Sets enemies on fire for ${Math.max(1,Math.round(f*.8))} damage per turn`);
    if(i)out.push(`${Math.round(Math.min(FREEZE_CAP,6+i*4))}% chance to freeze an enemy for a turn`);
    if(p)out.push(`Adds ${Math.round(p)} poison per hit, stacking`);
    if(h)out.push(`Heals you ${Math.round(h)} HP per hit`);
    if(s)out.push(`Drains ${Math.round(Math.min(.4,.07*s)*100)}% of damage dealt as HP`);
    if(v("Heavy"))out.push("Hits pierce 60% of enemy armor")}
  if(isGear(it)){
    if(st.heal>0)out.push(`Mends about ${Math.max(1,Math.round(st.heal*.2))} HP per battle turn`);
    if(v("Steam"))out.push(`Enemies miss you ${Math.round(Math.min(40,8*v("Steam")))}% of the time`);
    if(v("Lure"))out.push(`+${Math.round(v("Lure")*15)}% loot drop chance`);
    if(it.form==="shield")out.push(`${Math.round(15+v("Heavy")*3)}% chance to block a hit`)}
  if(g==="consumable"){if(st.heal>0)out.push(`Restores ${st.heal} HP`);const d=Math.round((st.atk+st.mag)*.6);if(d>=3)out.push(`Deals about ${d} damage when used in battle`)}
  out.push(`Mixes with ${acceptsText(it)}`);
  return out;
}
