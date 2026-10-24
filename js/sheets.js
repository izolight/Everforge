// ================= SHEETS =================
const sheet={mode:null,id:null,preview:false};let salvageArmed=false;
function showSheet(){$("scrim").hidden=false;$("sheet").hidden=false;$("sheet").querySelector("button:not(:disabled)")?.focus()}
function openSheet(id,refresh,preview){
  if(!preview&&!S.inv[id]){closeSheet();return}
  if(!refresh)salvageArmed=false;
  Object.assign(sheet,{mode:"item",id,preview:!!preview});
  const it=S.items[id],g=grp(it),[rn]=rarity(it),left=avail(id),full=S.bench.length>=maxInputs(),locked=inBattle(),P=pstats();
  const ts=targetSlot(it),eqIt=ts&&gearOf(ts),cmp=eqIt&&eqIt.id!==id?eqIt:null;
  const mix=S.bench.length?checkMix([...S.bench.map(b=>S.items[b]),it]):{ok:true};
  const btns=[];
  if(!preview){
    if(isGear(it)){const slots=FORMS[it.form].slots;
      slots.forEach(s=>{const on=S.eq[s]===id,lab=SLOTS.find(x=>x[0]===s)[1];
        btns.push(on?`<button class="btn grow" data-act="unequip" data-slot="${s}" ${locked?"disabled":""}>Unequip ${lab.toLowerCase()}</button>`
          :`<button class="btn primary grow" data-act="equip" data-slot="${s}" ${locked||(eqCount(id)>=S.inv[id]&&!slots.some(x=>S.eq[x]===id))?"disabled":""}>${slots.length>1?`Equip in ${lab.toLowerCase()}`:"Equip"}</button>`)})}
    if(g==="consumable"&&statsOf(it).heal>0&&!locked)btns.push(`<button class="btn primary grow" data-act="eat" ${S.hp>=P.maxHp?"disabled":""}>${S.hp>=P.maxHp?"Already at full HP":`Use now (+${Math.min(medHeal(it),P.maxHp-S.hp)} HP)`}</button>`);
    btns.push(`<button class="btn grow" data-act="add" ${left<=0||full||locked||!mix.ok?"disabled":""}>${locked?"Finish the fight to forge":full?"Crucible full":left<=0?"All in crucible":!mix.ok?"Won't mix with the crucible":"Add to crucible"}</button>`);
    const ys=salvageYield(it);
    if(ys.length)btns.push(`<button class="btn ${salvageArmed?"danger":""} grow" data-act="salvage" ${locked||left<=0?"disabled":""}>${salvageArmed?"Tap again to salvage":`Salvage → ${ys.join(" + ")} ${salvGrade(it)===3?"":GRADES[salvGrade(it)-1][0]+" "}Essence${salvageEmbers(it)?` + ${salvageEmbers(it)} embers`:""}`}</button>`);
    const mh=mishapsOf(it);if(mh.length)btns.push(`<button class="btn grow" data-act="reforge" ${locked||S.embers<reforgeCost(it)?"disabled":""}>Reforge — ${mh.map(m=>m==="Weakened"?"restore Weakened":"remove "+m).join(" and ")} (${reforgeCost(it)} embers)</button>`);
  }
  btns.push(`<button class="btn" data-act="close">Close</button>`);
  $("sheetIn").innerHTML=`<div class="grab" aria-hidden="true"></div>
    <div class="rhead">${glyph(it)}<div><div class="rform">${rn} · ${labelOf(it)} · Tier ${it.tier}${preview?" · on offer":` · ×${S.inv[id]}`}</div><h2 class="rname">${nameHtml(it)}</h2></div></div>
    <div class="chips">${chips(it.traits)}</div>
    ${cmp?cmpBlock(it,cmp,"Versus equipped"):""}${statGrid(shown(it),cmp?shown(cmp):null)}
    ${!preview&&!mix.ok?`<p class="warn-text">${mix.reason}</p>`:""}
    ${it.mishap==="Weakened"?`<p class="warn-text">Weakened: a fizzled mixture cost every trait 30%.</p>`:""}
    <ul class="fx">${effects(it).map(f=>`<li>${f}</li>`).join("")}</ul>
    ${it.recipe?`<p class="empty">Forged from ${it.recipe.join(" + ")}.</p>`:""}
    <div class="actions">${btns.join("")}</div>`;
  if(!refresh)showSheet();
}
function openCodex(id,refresh){
  Object.assign(sheet,{mode:"codex",id});
  const E=ENEMIES[id],K=cx(id),k=know(id);
  const weak=[...K.weak.map(f=>famChip(f)),...Array(allFacts(E,"weak").length-K.weak.length).fill(unkChip("???"))].join("")||'<span class="foot">None</span>';
  const res=[...K.resist.map(f=>famChip(f)),...Array(allFacts(E,"resist").length-K.resist.length).fill(unkChip("???"))].join("")||'<span class="foot">None</span>';
  const drops=E.drops.length?E.drops.map(([d])=>K.drops.includes(d)?`<span class="chip" style="color:var(--accent)">${S.items[d].name}</span>`:unkChip("???")).join(""):'<span class="foot">Treasure from the region it lurks in</span>';
  const hn=E.zone===S.zone?heatNow():(S.heat[E.zone]?.sel||0),ph=E.phase&&K.ph?E.phase.to:null;
  const spText=sp=>sp.kind==="heal"?"heals itself":sp.kind==="multi"?`${sp.n} quick hits`:sp.kind==="drain"?"steals your HP":`a heavy hit (×${sp.x})`;
  $("sheetIn").innerHTML=`<div class="grab" aria-hidden="true"></div>
    <div class="rhead">${portrait(id).replace("<svg",'<svg style="width:96px;height:96px;flex:none"')}<div><div class="rform">${zoneName(E.zone)}${E.boss?" · Boss":""} · defeated ${S.kills[id]||0}</div><h2 class="rname">${E.name}</h2></div></div>
    <p class="lore">${E.lore}</p>
    <div class="hprow"><span>Knowledge</span>${hpBar(k.have,k.tot,"know")}<span>${k.have}/${k.tot}</span></div>
    ${k.mastered?`<p class="ok-text">Mastered. You deal 15% more damage to this creature.</p>`:""}
    <dl class="kv">
      <dt>Strength</dt><dd>${K.stats?`<span class="chip">HP ${E.hp}</span><span class="chip">ATK ${E.atk}</span><span class="chip">DEF ${E.def}</span>`:unkChip("Win a fight to learn")}</dd>
      <dt>Weak to</dt><dd>${weak}</dd>
      <dt>Resists</dt><dd>${res}</dd>
      <dt>Special</dt><dd>${K.sp?`<span>${E.sp.name}: ${spText(E.sp)}, every ${spEvery(E,hn)} turns. Watch for it ${E.sp.tell}.</span>`:unkChip("Survive it to learn")}</dd>
      ${E.phase?`<dt>Second form</dt><dd>${ph?`<span>Below half health it turns ${ph.el}. ${K.sp2?`${ph.sp.name}: ${spText(ph.sp)}, every ${spEvery({...E,...ph},hn)} turns. `:"Its new special is still a mystery. "}Its weak points change too.</span>`:unkChip("Wound it badly to learn")}</dd>`:""}
      ${E.inf||(K.inf||[]).length?`<dt>Afflicts</dt><dd>${[...new Set(K.inf||[])].map(s=>`<span class="chip" style="color:var(--bad)">${STATUS[s].n}</span> <span class="foot">${STATUS[s].tip}</span>`).join("")||unkChip("Survive its special to learn")}</dd>`:""}
      <dt>Drops</dt><dd>${drops}</dd>
    </dl>
    <div class="actions"><button class="btn" data-act="close">Close</button></div>`;
  if(!refresh)showSheet();
}
function closeSheet(){$("scrim").hidden=true;$("sheet").hidden=true;Object.assign(sheet,{mode:null,id:null,preview:false});salvageArmed=false}
