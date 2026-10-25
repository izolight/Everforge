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
      slots.forEach(s=>{const on=S.eq[s]===id,lab=lc(tx(SLOTS.find(x=>x[0]===s)[1]));
        btns.push(on?`<button class="btn grow" data-act="unequip" data-slot="${s}" ${locked?"disabled":""}>${tx("Unequip {slot}",{slot:lab})}</button>`
          :`<button class="btn primary grow" data-act="equip" data-slot="${s}" ${locked||(eqCount(id)>=S.inv[id]&&!slots.some(x=>S.eq[x]===id))?"disabled":""}>${slots.length>1?tx("Equip in {slot}",{slot:lab}):tx("Equip")}</button>`)})}
    if(g==="consumable"&&statsOf(it).heal>0&&!locked)btns.push(`<button class="btn primary grow" data-act="eat" ${S.hp>=P.maxHp?"disabled":""}>${S.hp>=P.maxHp?tx("Already at full HP"):tx("Use now (+{n} HP)",{n:Math.min(medHeal(it),P.maxHp-S.hp)})}</button>`);
    btns.push(`<button class="btn grow" data-act="add" ${left<=0||full||locked||!mix.ok?"disabled":""}>${locked?tx("Finish the fight to forge"):full?tx("Crucible full"):left<=0?tx("All in crucible"):!mix.ok?tx("Won't mix with the crucible"):tx("Add to crucible")}</button>`);
    const ys=salvageYield(it);
    if(ys.length)btns.push(`<button class="btn ${salvageArmed?"danger":""} grow" data-act="salvage" ${locked||left<=0?"disabled":""}>${salvageArmed?tx("Tap again to salvage"):tx("Salvage → {list}",{list:ys.map(t=>iname(S.items[gradedItem("ess_"+t,salvGrade(it))])).join(" + ")})+(salvageEmbers(it)&&isUnl("peddler")?tx(" + {n} embers",{n:salvageEmbers(it)}):"")}</button>`);
    const mh=mishapsOf(it);if(mh.length&&isUnl("peddler"))btns.push(`<button class="btn grow" data-act="reforge" ${locked||S.embers<reforgeCost(it)?"disabled":""}>${tx("Reforge — {list} ({n} embers)",{list:mh.map(m=>m==="Weakened"?tx("restore {m}",{m:trn(m)}):tx("remove {m}",{m:trn(m)})).join(tx(" and ")),n:reforgeCost(it)})}</button>`);
  }
  btns.push(`<button class="btn" data-act="close">${tx("Close")}</button>`);
  $("sheetIn").innerHTML=`<div class="grab" aria-hidden="true"></div>
    <div class="rhead">${glyph(it)}<div><div class="rform">${rn} · ${labelOf(it)} · ${tx("Tier {n}",{n:it.tier})}${preview?" · "+tx("on offer"):` · ×${S.inv[id]}`}</div><h2 class="rname">${nameHtml(it)}</h2></div></div>
    <div class="chips">${chips(it.traits,1)}</div>
    ${statGrid(shown(it),cmp?shown(cmp):null,1)}${cmp?cmpBlock(it,cmp,"Versus equipped"):""}
    ${!preview&&!mix.ok?`<p class="warn-text">${mix.reason}</p>`:""}
    ${it.mishap==="Weakened"?`<p class="warn-text">${tx("Weakened: a fizzled mixture cost every trait 30%.")}</p>`:""}
    <ul class="fx">${effects(it).map(f=>`<li>${f}</li>`).join("")}</ul>
    ${it.recipe?`<p class="empty">${tx("Forged from {list}.",{list:recipeNames(it)})}</p>`:""}
    <div class="actions">${btns.join("")}</div>`;
  if(!refresh)showSheet();
}
function openCodex(id,refresh){
  Object.assign(sheet,{mode:"codex",id});
  const E=ENEMIES[id],K=cx(id),k=know(id);
  const weak=[...K.weak.map(f=>famChip(f)),...Array(allFacts(E,"weak").length-K.weak.length).fill(unkChip("???"))].join("")||`<span class="foot">${tx("None")}</span>`;
  const res=[...K.resist.map(f=>famChip(f)),...Array(allFacts(E,"resist").length-K.resist.length).fill(unkChip("???"))].join("")||`<span class="foot">${tx("None")}</span>`;
  const drops=E.drops.length?E.drops.map(([d])=>K.drops.includes(d)?`<span class="chip" style="color:var(--accent)">${iname(S.items[d])}</span>`:unkChip("???")).join(""):`<span class="foot">${tx("Treasure from the region it lurks in")}</span>`;
  const hn=E.zone===S.zone?heatNow():(S.heat[E.zone]?.sel||0),ph=E.phase&&K.ph?E.phase.to:null;
  const spText=sp=>sp.kind==="heal"?tx("heals itself"):sp.kind==="multi"?tx("{n} quick hits",{n:sp.n}):sp.kind==="drain"?tx("steals your HP"):tx("a heavy hit (×{x})",{x:sp.x});
  const spLine=sp=>tx("{name}: {what}, every {n} turns.",{name:tx(sp.name),what:spText(sp),n:spEvery(sp===E.sp?E:{...E,...ph},hn)});
  const mvTxt={chase:"Hunts you once it catches your scent (from 4 steps, 6 with your torch out). Elite ones move every other step and notice you within 2.",wander:"Drifts about the region. Elite ones move every other step.",still:"Holds its ground."};
  $("sheetIn").innerHTML=`<div class="grab" aria-hidden="true"></div>
    <div class="rhead">${portrait(id).replace("<svg",'<svg style="width:96px;height:96px;flex:none"')}<div><div class="rform">${zoneName(E.zone)}${E.boss?" · "+tx("Boss"):""} · ${tx("defeated {n}",{n:S.kills[id]||0})}</div><h2 class="rname">${tx(E.name)}</h2></div></div>
    <p class="lore">${tx(E.lore)}</p>
    <div class="hprow"><span>${tx("Knowledge")}</span>${hpBar(k.have,k.tot,"know")}<span>${k.have}/${k.tot}</span></div>
    ${k.mastered?`<p class="ok-text">${tx("Mastered. You deal 15% more damage to this creature.")}</p>`:""}
    <dl class="kv">
      <dt>${tx("Strength")}</dt><dd>${K.stats?`<span class="chip">${tx("HP")} ${E.hp}</span><span class="chip">${tx("ATK")} ${E.atk}</span><span class="chip">${tx("DEF")} ${E.def}</span>`:unkChip(tx("Win a fight to learn"))}</dd>
      <dt>${tx("Weak to")}</dt><dd>${weak}</dd>
      <dt>${tx("Resists")}</dt><dd>${res}</dd>
      ${E.mv?`<dt>${tx("On the map")}</dt><dd>${tx(mvTxt[E.mv])}</dd>`:""}
      <dt>${tx("Special")}</dt><dd>${K.sp?`<span>${spLine(E.sp)} ${tx("Watch for it {tell}.",{tell:tx(E.sp.tell)})}</span>`:unkChip(tx("Survive it to learn"))}</dd>
      ${E.phase?`<dt>${tx("Second form")}</dt><dd>${ph?`<span>${tx("Below half health it turns {el}.",{el:famL(ph.el)})} ${K.sp2?spLine(ph.sp)+" ":tx("Its new special is still a mystery.")+" "}${tx("Its weak points change too.")}</span>`:unkChip(tx("Wound it badly to learn"))}</dd>`:""}
      ${E.inf||(K.inf||[]).length?`<dt>${tx("Afflicts")}</dt><dd>${[...new Set(K.inf||[])].map(s=>`<span class="chip" style="color:var(--bad)">${STATUS[s].n}</span> <span class="foot">${STATUS[s].tip}</span>`).join("")||unkChip(tx("Survive its special to learn"))}</dd>`:""}
      <dt>${tx("Drops")}</dt><dd>${drops}</dd>
    </dl>
    <div class="actions"><button class="btn" data-act="close">${tx("Close")}</button></div>`;
  if(!refresh)showSheet();
}
function closeSheet(){$("scrim").hidden=true;$("sheet").hidden=true;Object.assign(sheet,{mode:null,id:null,preview:false});salvageArmed=false}
