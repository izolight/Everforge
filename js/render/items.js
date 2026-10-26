// ================= RENDER: ITEMS =================
// How an item reads anywhere: trait and effect chips, stat grids and comparisons, names, tips, loot and shop rows, the upgrade list
const chips=(it,full)=>topTraits(it.traits).map(([t,v])=>`<span class="chip tc" style="color:${tColor(t)}" ${traitTip(t,v,it)}>${traitIc(t,"s")}${full?`${trn(t)} `:""}<b>${v}</b></span>`).join("");
function effectBadges(it,part){
  const use=grp(it)==="consumable",fx=effects(it),badge=e=>{
    if(use&&e.key==="cure")return e.statuses.map(s=>`<span class="chip fx-badge" data-effect="cure" data-cure="${s}" style="color:${e.color}" ${tt(tx("Cures {status}",{status:lc(STATUS[s].n)}),tx("Cures {list} when used in battle",{list:lc(STATUS[s].n)}))}>${ic(e.icon)}<span>${tx("Cures {status}",{status:lc(STATUS[s].n)})}</span></span>`).join("");
    const extra=e.key.startsWith("resist_")?ic("resist","s"):e.statuses?e.statuses.map(s=>famIc(STATUS[s].el,"s")).join(""):"";
    const unit=e.unit?`<span class="fx-unit" aria-hidden="true">${e.unit==="cooldown"?"":"/"}${ic(e.unit==="hit"?"hit":e.unit,"s")}</span>`:"";
    const value=use&&e.key==="heal"?tx("{n} HP",{n:medHeal(it)}):use&&e.key==="damage"?tx("{n} dmg",{n:e.value}):e.value;
    return `<span class="chip fx-badge" data-effect="${e.key}" style="color:${e.color}" ${tt(e.name,e.text)}>${ic(e.icon)}${extra}${value==null?"":`<b>${value}</b>`}${unit}${!e.meta?`<span class="fx-description">${e.text}</span>`:""}${e.key==="mix"?`<span>${tx("Mixing")}</span>`:""}</span>`;
  };
  const active=fx.filter(e=>!e.meta),meta=fx.filter(e=>e.meta);
  const metaHtml=`<div class="chips item-meta">${meta.map(badge).join("")}</div>`;
  if(part==="meta")return metaHtml;
  if(!active.length&&!use)return part==="active"?"":metaHtml;
  return `<div class="item-effects"><div class="effect-heading"><span class="label">${tx(use?"When used":"Effects")}</span>${helpBtn(tx("Reading effects"),tx("Hover, focus or tap an icon for its full effect. Percentages show chances or damage shares; a circular arrow means each turn, a burst means each hit, and a clock means ability cooldown."))}</div>${active.length?`<div class="chips effect-chips">${active.map(badge).join("")}</div>`:`<p class="foot">${tx("No effect when used. You can still forge with its traits.")}</p>`}${part==="active"?"":metaHtml}</div>`;
}
function statBreakdown(it){
  const num=n=>String(Number(n.toFixed(4))),s=statsOf(it),use=grp(it)==="consumable";
  const rows=statParts(it).map(p=>`<div class="trait-calculation"><b style="color:${tColor(p.t)}">${traitIc(p.t,"s")} ${trn(p.t)} ${p.v}</b><div>${p.stats.map(x=>`<div class="calculation"><span>${STAT_NAMES[x.k]}</span><code>${num(x.base)} × ${p.v} × ${num(x.priority)} × ${num(x.form)} × ${num(x.scale)} = ${num(x.value)}</code></div>`).join("")}</div></div>`).join("");
  const medicine=use&&s.heal>0&&medHeal(it)!==s.heal?`<p class="foot">${tx("Medicine increases healing from {base} to {total} HP.",{base:s.heal,total:medHeal(it)})}</p>`:"";
  return `<details class="stat-breakdown"><summary>${tx("Stat calculation")}</summary><p class="foot">${tx("Base value × trait strength × priority × item type × tier and legendary bonus. Add contributions, then round each total.")}</p><p class="foot">${tx("Stronger traits contribute first. Positive bonuses use {list}; penalties always apply in full.",{list:DECAY.map(n=>`${Math.round(n*100)}%`).join(", ")})}</p>${rows}<p class="label">${tx("Rounded totals")}</p>${statGrid(s,null,true)}${medicine}${use?`<p class="foot">${tx("Attack and Magic on consumables only determine damage when used in battle. They do not increase your character's stats.")}</p><p class="foot">${tx("Battle damage = (Attack + Magic) × {x}, rounded; values below 3 deal no damage.",{x:dec(WEAK_X)})}</p>`:""}</details>`;
}
function upgradeSummary(it,other){
  const a=shown(it),b=shown(other),changes=Object.keys(STAT_NAMES).filter(k=>a[k]!==b[k]).map(k=>`${STAT_NAMES[k]} ${a[k]-b[k]>0?"+":""}${a[k]-b[k]}`);
  const old=effects(other),added=effects(it).filter(e=>!e.meta&&e.key!=="ability"&&!old.some(o=>o.key===e.key&&o.value===e.value)).slice(0,2).map(e=>e.text);
  return `<p class="upgrade-summary">${tx("Compared with {item}: {changes}.",{item:esc(iname(other)),changes:changes.length?changes.join(", "):tx("Core stats unchanged")})}${added.length?` ${added.join(". ")}.`:""}</p>`;
}
function itemProperties(it,other,full,label){
  const gear=isGear(it),title=tx(gear?"Traits":"Crafting traits");
  return `<div class="item-properties">${gear&&other?upgradeSummary(it,other):""}${gear?statGrid(shown(it),other?shown(other):null,full):""}${gear&&other&&label?cmpBlock(it,other,label):""}${effectBadges(it,"active")}<div class="item-traits"><div class="effect-heading"><span class="label">${title}</span>${helpBtn(title,tx("Numbers measure trait strength, not direct stat bonuses. Item type and trait priority determine the final result."),tx("Tap a trait to see what it does in this item. Forging can change its effect."))}</div><div class="chips">${chips(it,full)}</div></div>${statBreakdown(it)}${effectBadges(it,"meta")}</div>`;
}
const statLine=st=>Object.entries(STAT_NAMES).filter(([k])=>st[k]).map(([k,l])=>`${l} ${st[k]>0?"+":""}${st[k]}`).join(" · ");
const famChip=(f,pre)=>`<span class="chip fam" style="color:${FAM[f]}">${pre?pre+" ":""}${famN(f)}</span>`;
const unkChip=t=>`<span class="chip unk">${t}</span>`;
const nameHtml=it=>`<span style="color:${rarity(it)[1]}">${esc(iname(it))}</span>`; // the name is shown text: never markup (a save can hold any name)
function delta(a,b){const d=a-b;if(!d)return `<em class="d same">±0</em>`;return `<em class="d ${d>0?"up":"down"}">${d>0?"▲":"▼"}${Math.abs(d)}</em>`}
const shown=it=>{const s=statsOf(it);return grp(it)==="consumable"?{...s,heal:medHeal(it)}:s}; // consumables show the heal they really restore
function statGrid(st,cmp,full){ // icon + number per stat (full adds the word); with cmp, a delta against the other item
  const h=Object.entries(STAT_NAMES).filter(([k])=>st[k]!==0||(cmp&&cmp[k]!==0))
    .map(([k,l])=>{const d=cmp?st[k]-cmp[k]:0;return `<div class="stat" ${tt(`${l} ${st[k]>0?"+":""}${st[k]}`,cmp?(d?tx("{d} against the comparison",{d:`${d>0?"+":""}${d}`}):tx("Same as the comparison")):"")}>${stIc(k,"s")}${full?`<span>${l}</span>`:""}<b class="${st[k]<0?"neg":""}">${st[k]>0?"+":""}${st[k]}</b>${cmp?delta(st[k],cmp[k]):""}</div>`}).join("");
  return h?`<div class="stats">${h}</div>`:"";
}
function cmpBlock(it,other,label){ // one row: vs <name>, % verdict, power before -> after
  const a=power(it),b=power(other),pct=b?Math.round((a-b)/Math.abs(b)*100):0,cls=a>b?"up":a<b?"down":"same";
  const word=a>b?tx("{p}% stronger",{p:pct}):a<b?tx("{p}% weaker",{p:Math.abs(pct)}):tx("About the same");
  return `<div class="cmp" ${tt(`${tx(label)} ${iname(other)}`,word,tx("Power {b} → {a}",{a,b}))}><span class="cn">${label==="Versus equipped"?ic("equip","s"):tx("vs")} ${nameHtml(other)}</span><span class="verdict ${cls}">${a>b?"▲":a<b?"▼":"="}${Math.abs(pct)}%</span><span class="pw">${tx("PWR {b}→{a}",{a,b})}</span></div>`;
}
function hpBar(cur,max,cls){const p=Math.max(0,cur)/max;return `<div class="bar ${cls||(p<.3?"low":"")}"><i style="width:${p*100}%"></i></div>`}
const gcol=id=>S.items[id].grade?GRADES[S.items[id].grade-1][1]:"var(--accent)";
const lootChips=ids=>ids.map(id=>{const it=S.items[id];return `<button class="sq" style="${rcol(it)}" data-item="${id}" aria-label="${esc(iname(it))}. ${itemAria(it)}" ${itemTip(it)}>${glyph(it)}</button>`}).join(""); // loot as small item squares

const shopRow=(id,label,c,off)=>`<div class="shoprow"><button class="chip" data-item="${id}" style="color:${gcol(id)}">${esc(iname(S.items[id]))}</button><button class="btn sm" data-choice="${c}" ${off?"disabled":""}>${label}</button></div>`;
const shopHtml=ev=>`<div class="shop"><p class="label">${tx("For sale · you have {n} embers",{n:S.embers})}</p>${ev.stock.map((e,i)=>e.done?"":shopRow(e.id,`${icon("ember")}${e.price}`,`buy:${i}`,S.embers<e.price)).join("")}
  ${ev.sells.some(e=>!e.done)?`<p class="label">${tx("Sell a spare")}</p>${ev.sells.map((e,i)=>e.done?"":shopRow(e.id,isArmed("sell:"+i)?tx("Tap again to sell"):tx("Sell +{n}",{n:e.price}),`sell:${i}`)).join("")}`:""}</div>`;
const topT=id=>topTraits(S.items[baseIdOf(id)].traits)[0][0];
function renderUpgrade(){
  $("upgp").hidden=!isUnl("upgrade");if(!isUnl("upgrade"))return;
  const lv=skLv("alchemy"),ids=upgradable().sort((a,b)=>topT(a).localeCompare(topT(b))||S.items[baseIdOf(a)].name.localeCompare(S.items[baseIdOf(b)].name)||gradeOf(a)-gradeOf(b));
  $("upgsum").innerHTML=`${ic("upgrade","s")} ${tx("Upgrade grades")}${ids.length?` <b class="rdy">${ids.length}</b>`:""}${helpBtn(tx("Upgrade grades"),tx("{n} essences or materials of one grade and some embers make 1 of the next grade (Faint, Lesser, Plain, Greater, Pure): stronger traits, in a single crucible slot.",{n:UP.n}),tx("A miss costs the embers and one of them."),tx("Greater needs Alchemy Lv {a}, Pure Lv {b}. You are Lv {lv}.",{a:GRADE_LV[3],b:GRADE_LV[4],lv}))}`;
  $("upgrows").innerHTML=ids.length?ids.map(id=>{const g=gradeOf(id),tg=g+1,it=S.items[id],low=lv<GRADE_LV[tg-1],poor=S.embers<UP.emb[g-1],battle=inBattle();
    const why=battle?tx("Finish the fight first."):low?tx("Needs Alchemy Lv {n}",{n:GRADE_LV[tg-1]}):poor?tx("Not enough embers."):""; // a refused upgrade says why
    const cost=`${icon("ember")}${UP.emb[g-1]} · ${gradeN(tg)} · ${upChance(tg)}%`;
    return `<div class="shoprow up">${glyph(it)}<span class="uname"><span style="color:${GRADES[g-1][1]}">${esc(iname(it))}</span> <small>×${avail(id)}</small></span>
      <button class="btn sm" data-upgrade="${id}" ${why?`aria-disabled="true" data-tap`:""} aria-label="${esc(tx("Upgrade {item} to {grade}",{item:iname(it),grade:gradeN(tg)}))}" ${tt(`${iname(it)} → ${gradeN(tg)}`,why,tx("{n} of them and {e} embers make 1. {p}% to succeed.",{n:UP.n,e:UP.emb[g-1],p:upChance(tg)}))}>${battle?why:low?`${ic("lock","s")} ${tx("Lv {n}",{n:GRADE_LV[tg-1]})}`:poor?why:cost}</button></div>`}).join(""):`<p class="foot">${tx("Collect {n} of the same grade of an essence, ore, hide or herb to upgrade them.",{n:UP.n})}</p>`;
}
const itemLines=it=>[iname(it),`${rarity(it)[0]} · ${labelOf(it)}${isGear(it)?` · ${tx("PWR {n}",{n:power(it)})}`:""}`,grp(it)==="consumable"?useHint(it):isGear(it)?statLine(shown(it)):tx("Crafting ingredient"),topTraits(it.traits).slice(0,4).map(([t,v])=>`${trn(t)} ${v}`).join(", ")];
const itemTip=(it,...x)=>tt(...itemLines(it),...x),itemAria=it=>esc(itemLines(it).slice(1).filter(Boolean).join(". ")); // the tip text also goes in aria-label, for screen readers
const ROMAN=["","I","II","III","IV","V"];
const rcol=it=>`--rc:${rarity(it)[1]}${it.grade?`;--gc:${GRADES[it.grade-1][1]}`:""}`; // rarity stripe + grade frame colours
