// ================= SMALL RENDER HELPERS =================
const chips=(it,full)=>topTraits(it.traits).map(([t,v])=>`<span class="chip tc" style="color:${tColor(t)}" ${traitTip(t,v,it)}>${traitIc(t,"s")}${full?`${trn(t)} `:""}<b>${v}</b></span>`).join("");
function effectBadges(it,part){
  const use=grp(it)==="consumable",fx=effects(it),badge=e=>{
    if(use&&e.key==="cure")return e.statuses.map(s=>`<span class="chip fx-badge" data-effect="cure" data-cure="${s}" style="color:${e.color}" ${tt(tx("Cures {status}",{status:lc(STATUS[s].n)}),tx("Cures {list} when used in battle",{list:lc(STATUS[s].n)}))}>${ic(e.icon)}<span>${tx("Cures {status}",{status:lc(STATUS[s].n)})}</span></span>`).join("");
    const extra=e.key.startsWith("resist_")?ic("resist","s"):e.statuses?e.statuses.map(s=>famIc(STATUS[s].el,"s")).join(""):"";
    const unit=e.unit?`<span class="fx-unit" aria-hidden="true">${e.unit==="cooldown"?"":"/"}${ic(e.unit==="hit"?"hit":e.unit,"s")}</span>`:"";
    const value=use&&e.key==="heal"?tx("{n} HP",{n:medHeal(it)}):use&&e.key==="damage"?tx("{n} dmg",{n:e.value}):e.value;
    return `<span class="chip fx-badge" data-effect="${e.key}" style="color:${e.color}" ${tt(e.name,e.text)}>${ic(e.icon)}${extra}${value==null?"":`<b>${value}</b>`}${unit}${e.key==="mix"?`<span>${tx("Mixing")}</span>`:""}</span>`;
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
  return `<details class="stat-breakdown"><summary>${tx("Stat calculation")}</summary><p class="foot">${tx("Base value × trait strength × priority × item type × tier and legendary bonus. Add contributions, then round each total.")}</p><p class="foot">${tx("Stronger traits contribute first. Positive bonuses use {list}; penalties always apply in full.",{list:DECAY.map(n=>`${Math.round(n*100)}%`).join(", ")})}</p>${rows}<p class="label">${tx("Rounded totals")}</p>${statGrid(s,null,true)}${medicine}${use?`<p class="foot">${tx("Attack and Magic on consumables only determine damage when used in battle. They do not increase your character's stats.")}</p><p class="foot">${tx("Battle damage = (Attack + Magic) × 0.6, rounded; values below 3 deal no damage.")}</p>`:""}</details>`;
}
function itemProperties(it,other,full,label){
  const gear=isGear(it),title=tx(gear?"Traits":"Crafting traits");
  return `<div class="item-properties">${gear?statGrid(shown(it),other?shown(other):null,full):""}${gear&&other&&label?cmpBlock(it,other,label):""}${effectBadges(it,"active")}<div class="item-traits"><div class="effect-heading"><span class="label">${title}</span>${helpBtn(title,tx("Numbers measure trait strength, not direct stat bonuses. Item type and trait priority determine the final result."),tx("Tap a trait to see what it does in this item. Forging can change its effect."))}</div><div class="chips">${chips(it,full)}</div></div>${statBreakdown(it)}${effectBadges(it,"meta")}</div>`;
}
const statLine=st=>Object.entries(STAT_NAMES).filter(([k])=>st[k]).map(([k,l])=>`${l} ${st[k]>0?"+":""}${st[k]}`).join(" · ");
const famChip=(f,pre)=>`<span class="chip fam" style="color:${FAM[f]}">${pre?pre+" ":""}${famN(f)}</span>`;
const unkChip=t=>`<span class="chip unk">${t}</span>`;
const nameHtml=it=>`<span style="color:${rarity(it)[1]}">${iname(it)}</span>`;
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

const shopRow=(id,label,c,off)=>`<div class="shoprow"><button class="chip" data-item="${id}" style="color:${gcol(id)}">${iname(S.items[id])}</button><button class="btn sm" data-choice="${c}" ${off?"disabled":""}>${label}</button></div>`;
const shopHtml=ev=>`<div class="shop"><p class="label">${tx("For sale · you have {n} embers",{n:S.embers})}</p>${ev.stock.map((e,i)=>e.done?"":shopRow(e.id,`${icon("ember")}${e.price}`,`buy:${i}`,S.embers<e.price)).join("")}
  ${ev.sells.some(e=>!e.done)?`<p class="label">${tx("Sell a spare")}</p>${ev.sells.map((e,i)=>e.done?"":shopRow(e.id,tx("Sell +{n}",{n:e.price}),`sell:${i}`)).join("")}`:""}</div>`;
const topT=id=>topTraits(S.items[baseIdOf(id)].traits)[0][0];
function renderUpgrade(){
  $("upgp").hidden=!isUnl("upgrade");if(!isUnl("upgrade"))return;
  const lv=skLv("alchemy"),ids=upgradable().sort((a,b)=>topT(a).localeCompare(topT(b))||S.items[baseIdOf(a)].name.localeCompare(S.items[baseIdOf(b)].name)||gradeOf(a)-gradeOf(b));
  $("upgsum").innerHTML=`${ic("upgrade","s")} ${tx("Upgrade grades")}${ids.length?` <b class="rdy">${ids.length}</b>`:""}${helpBtn(tx("Upgrade grades"),tx("{n} essences or materials of one grade and some embers make 1 of the next grade (Faint, Lesser, Plain, Greater, Pure): stronger traits, in a single crucible slot.",{n:UP.n}),tx("A miss costs the embers and one of them."),tx("Greater needs Alchemy Lv {a}, Pure Lv {b}. You are Lv {lv}.",{a:GRADE_LV[3],b:GRADE_LV[4],lv}))}`;
  $("upgrows").innerHTML=ids.length?ids.map(id=>{const g=gradeOf(id),tg=g+1,it=S.items[id],low=lv<GRADE_LV[tg-1],poor=S.embers<UP.emb[g-1];
    return `<div class="shoprow up">${glyph(it)}<span class="uname"><span style="color:${GRADES[g-1][1]}">${iname(it)}</span> <small>×${avail(id)}</small></span>
      <button class="btn sm" data-upgrade="${id}" ${inBattle()||low||poor?"disabled":""} aria-label="${esc(tx("Upgrade {item} to {grade}",{item:iname(it),grade:gradeN(tg)}))}" ${tt(`${iname(it)} → ${gradeN(tg)}`,low?tx("Needs Alchemy Lv {n}",{n:GRADE_LV[tg-1]}):tx("{n} of them and {e} embers make 1. {p}% to succeed.",{n:UP.n,e:UP.emb[g-1],p:upChance(tg)}))}>${low?`${ic("lock","s")} ${tx("Lv {n}",{n:GRADE_LV[tg-1]})}`:`${icon("ember")}${UP.emb[g-1]} · ${gradeN(tg)} · ${upChance(tg)}%`}</button></div>`}).join(""):`<p class="foot">${tx("Collect {n} of the same grade of an essence, ore, hide or herb to upgrade them.",{n:UP.n})}</p>`;
}
// ================= RENDER =================
let forgeArmed="",freshShown=new Set(),logOpen=false,heatOpen=false,legendOpen=false;
function renderHeader(){
  const l=level(),cur=XP_LV[l-1],nxt=XP_LV[l];clampHp();
  const lt=`${tx("Smith Lv {l}",{l})}\n${nxt?tx("{a}/{b} XP to Lv {n}.",{a:S.xp-cur,b:nxt-cur,n:l+1}):tx("Highest level reached.")}${LV_PERK[l]?` ${tx(LV_PERK[l])}`:""}\n${tx("Smith XP comes from forging and unlocks crucible slots, trait slots and appraisal.")}`;
  $("lvl").innerHTML=`${ic("smith","l")}<b>${l}</b>`;$("lvl").dataset.tip=lt;$("xpbar").parentNode.dataset.tip=lt;
  $("xpbar").style.width=nxt?`${Math.min(100,(S.xp-cur)/(nxt-cur)*100)}%`:"100%";
  $("emb").hidden=!isUnl("peddler");$("emb").innerHTML=`${icon("ember")}${S.embers}`;$("emb").dataset.tip=tx("Embers")+"\n"+tx("The currency of the forge. Fights, salvage and selling earn it; the peddler, grade upgrades and reforging spend it.");
  $("disc").innerHTML=`<span class="mi" ${tt(tx("Renown"),tx("Battles you have won."))}>${ic("renown")}${S.wins}</span><span class="mi" ${tt(tx("Recipes forged"),tx("Different things you have forged. Each is saved in the Recipes tab."))}>${ic("hammer")}${S.journal.length}</span>`;
}
function renderNav(){
  $("nav").innerHTML=VIEWS.map(v=>{
    let badge="";
    if(v==="battle"&&inBattle()&&S.view!=="battle")badge=`<i class="badge-dot pulse" aria-label="${esc(tx("battle in progress"))}"></i>`;
    if(v==="gear"&&S.fresh.length&&S.view!=="gear"&&S.view!=="forge")badge=`<i class="badge-dot" aria-label="${esc(tx("{n} new items",{n:S.fresh.length}))}">${S.fresh.length}</i>`;
    if(!badge&&S.view!==v&&!inBattle()&&pendingIntros().some(c=>c.ctx!=="battle"&&c.tab===v))badge=`<i class="badge-dot pulse" aria-label="${esc(tx("new introduction"))}"></i>`;
    return `<button data-view="${v}" aria-current="${S.view===v?"page":"false"}">${icon(v)}<span>${tx(cap(v))}</span>${badge}</button>`}).join("");
  VIEWS.forEach(v=>$("v-"+v).hidden=S.view!==v);
}
function renderGoal(){
  const g=goal(),el=$("goal"),st=g.short||g.step;
  el.hidden=inBattle();
  el.className="goal"+(g.done?" done":"");
  el.innerHTML=`<div class="gt" ${tt(g.step+(g.prog?` · ${g.prog}`:""),g.text,g.done?tx("Reward: {list}",{list:rewardText(g.reward)}):"")}><small>${st}</small> ${g.text}${g.prog?` <em>${g.prog}</em>`:""}</div>
    ${g.done?`<button class="btn primary sm" id="claim">${tx("Claim")}</button>`:S.view!==g.tab?`<button class="btn sm" id="goGoal">${tx("Go to {tab}",{tab:tx(cap(g.tab))})}</button>`:""}`;
}
const itemLines=it=>[iname(it),`${rarity(it)[0]} · ${labelOf(it)}${isGear(it)?` · ${tx("PWR {n}",{n:power(it)})}`:""}`,grp(it)==="consumable"?useHint(it):isGear(it)?statLine(shown(it)):tx("Crafting ingredient"),topTraits(it.traits).slice(0,4).map(([t,v])=>`${trn(t)} ${v}`).join(", ")];
const itemTip=(it,...x)=>tt(...itemLines(it),...x),itemAria=it=>esc(itemLines(it).slice(1).filter(Boolean).join(". ")); // the tip text also goes in aria-label, for screen readers
const ROMAN=["","I","II","III","IV","V"];
const rcol=it=>`--rc:${rarity(it)[1]}${it.grade?`;--gc:${GRADES[it.grade-1][1]}`:""}`; // rarity stripe + grade frame colours
function renderGear(){
  const P=pstats();P.floor=atFloor(P);
  $("heroLabel").innerHTML=`<p class="label">${tx("Your hero")}</p>${helpBtn(tx("Your hero"),tx("Equipped items shape your appearance. Tap a slot to inspect or change gear."))}`;
  $("heroPortrait").innerHTML=heroArt();
  $("heroPortrait").setAttribute("aria-label",tx("Your hero")+". "+SLOTS.map(([s,l])=>`${tx(l)}: ${gearOf(s)?iname(gearOf(s)):tx("empty")}`).join(". "));
  $("ghp").className="bar"+(S.hp/P.maxHp<.3?" low":"");$("ghp").firstElementChild.style.width=`${S.hp/P.maxHp*100}%`;$("ghptxt").textContent=`${S.hp}/${P.maxHp}`;
  $("gear").innerHTML=SLOTS.map(([s,l0])=>{const it=gearOf(s),l=tx(l0);
    return `<button class="sq gs${it?"":" none"}${it&&it.legendary?" legend":""}${it&&it.grade?" gr":""}"${it?` style="${rcol(it)}"`:""} data-gear="${s}" aria-label="${esc(l)}: ${it?`${esc(iname(it))}. ${itemAria(it)}`:esc(tx("empty"))}" ${it?itemTip(it,l):tt(l,s==="main"?tx("Bare fists. Tap to choose a weapon."):tx("Empty. Tap to choose an item for it."))}>${glyph(it,SLOT_GLYPH[s])}<span class="gear-slot-label">${l}</span></button>`}).join("");
  const sp=Math.min(35,P.spd*3),rd=Math.round(P.red*100);
  $("pstats").innerHTML=[["atk",P.atk,P.offW?`+${P.offPow}`:"",P.offW?tx("Strike power of your main hand. Your off hand adds a weaker second strike of {n}.",{n:P.offPow}):tx("Strike power of your main hand.")],["mag",P.mag,"",tx("Counts {n} times as much as Attack in your strikes.",{n:MAG_W})],
    ["def",P.def,`${rd}%`,tx("Cuts the damage you take by {p}%, with diminishing returns.",{p:rd})],["spd",P.spd,"",tx("{p}% chance each turn of a swift follow-up strike (up to 35%).",{p:sp})]]
    .map(([k,v,x,t])=>`<div class="ps" ${tt(`${STAT_NAMES[k]} ${v}`,t)}>${stIc(k)}<b>${v}</b>${x?`<small>${x}</small>`:""}</div>`).join("");
  const rc=(col,ics,val,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${val}</b></span>`;
  const cf=[...Object.entries(P.rs).map(([k,v])=>rc(FAM[k]||"var(--muted)",famIc(k,"s")+ic("resist","xs"),`${v}%`,tx("Resists {fam} {v}%",{fam:famN(k),v}),tx("Cuts damage from {fam} attacks.",{fam:famL(k)}))),
    P.ward&&rc("var(--verd)",ic("ward","s"),P.ward,tx("Ward {n}",{n:P.ward}),tx("Absorbs this much damage at the start of each battle.")),
    P.thorns&&rc("var(--muted)",ic("thorns","s"),`${P.thorns}%`,tx("Thorns {n}%",{n:P.thorns}),tx("Reflects this share of damage taken back at the attacker.")),
    P.dr&&rc("var(--muted)",ic("dr","s"),`-${P.dr}`,tx("-{n} per hit",{n:P.dr}),tx("Stone takes this much off every hit you take.")),
    P.floor&&rc("var(--down)",ic("floor","s"),`${Math.round(HIT_MIN*100)}%`,tx("Hits at floor ({p}%)",{p:Math.round(HIT_MIN*100)}),tx("Defense, resists and Stone together can't cut a hit below this share of its raw damage. More armor won't help against it.")),
    P.dodge&&rc(FAM.swift,famIc("swift","s"),`${P.dodge}%`,tx("Dodge {n}%",{n:P.dodge}),tx("Chance to dodge a hit.")),
    P.root&&rc(FAM.wood,ic("root","s"),`+${P.root}`,tx("Roots +{n}",{n:P.root}),tx("HP healed each turn while you are below half health.")),
    P.cleanse&&rc(FAM.heal,ic("cleanse","s"),`${Math.round(Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER))}%`,tx("Cleanse {p}%",{p:Math.round(Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER))}),tx("Chance each turn to shake off a status (burn, chill, poison, curse)."))].filter(Boolean);
  $("cfx").innerHTML=cf.join("");
  const iu=isUnl("infuse");$("inf").hidden=$("infbtns").hidden=!iu;
  if(!iu){$("inflabel").innerHTML=lockRow("infuse");return}
  const inf=Object.entries(S.infuse),can=infusable(),R=["I","II","III"];
  $("inflabel").innerHTML=`<p class="label">${ic("infuse","s")} ${tx("Infusions")} · ${inf.length}/${infSlots()}</p>${helpBtn(tx("Infusions"),tx("Essences worth {n} plain ones (a Greater counts as 3, a Pure as 9, a Lesser as ⅓) infuse a trait into you; as many again deepen it, up to III. Infused traits act as if they were on your weapon.",{n:INF_COST}),can.length?"":inf.length>=infSlots()?tx("All slots used. You can still deepen an infusion with more of its essence."):tx("Collect essences of one trait worth {n} plain ones (salvage, elites, bounties) to infuse it.",{n:INF_COST}))}`;
  $("inf").innerHTML=Array.from({length:infSlots()},(_,k)=>{const e=inf[k];if(!e)return `<div class="islot" ${tt(tx("Empty infusion slot"),tx("Collect {n} plain essences of one kind to fill it.",{n:INF_COST}))}>${ic("plus","l")}</div>`;
    const [t,r]=e,st=innateStats(t),bits=Object.entries(st).filter(([,v])=>v);
    return `<div class="islot on" style="border-color:${tColor(t)};color:${tColor(t)}" ${tt(`${trn(t)} ${R[r-1]}`,bits.map(([s,v])=>`${v>0?"+":""}${v} ${STAT_NAMES[s]}`).join(", ")||tx("Effect on hit"),tx("Rank {r} of {m}",{r,m:INF_MAX}))}>${traitIc(t,"l")}<b>${trn(t)} ${R[r-1]}</b><span class="ib">${bits.map(([s,v])=>`<span>${stIc(s,"xs")}${v>0?"+":""}${v}</span>`).join("")||`<span>${tx("on hit")}</span>`}</span></div>`}).join("");
  const cr=S.infCredit?`<p class="foot" style="flex-basis:100%">${tx("Credit: {n} plain, spent first on your next infusion.",{n:creditTxt(S.infCredit)})}</p>`:"";
  $("infbtns").innerHTML=can.map(t=>`<button class="btn sm" data-infuse="${t}" style="border-color:${tColor(t)}">${traitIc(t,"s")} ${S.infuse[t]?tx("Deepen {trait} → {rank}",{trait:trn(t),rank:R[S.infuse[t]]}):tx("Infuse {trait}",{trait:trn(t)})} · ${payText(infPay(t,Math.max(0,INF_NEED-S.infCredit)))||tx("credit")}</button>`).join("")+cr;
}
const lockAct=id=>`<button class="btn act lk" id="${id}" aria-disabled="true" data-tap aria-label="${esc(tx("{name}, locked. {txt}",{name:tx(UNL[id].name),txt:tx(UNL[id].txt)}))}" ${tt(tx("{name} (locked)",{name:tx(UNL[id].name)}),tx(UNL[id].txt))}>${ic("lock")}<span>${tx(UNL[id].name)}</span></button>`; // an action-grid button that is not open yet
const introIn=c=>`<span class="ii" aria-hidden="true">${ic(c.ic,"l")}</span><div class="it"><b>${c.t}</b>${c.l.map(x=>`<p>${x}</p>`).join("")}</div><button class="btn sm" id="introOk" data-intro="${c.id}">${tx("Got it")}</button>`; // a one-time intro card (non-modal; Got it marks it read)
const introHtml=c=>c?`<div class="intro">${introIn(c)}</div>`:"";
function renderIntro(){const el=$("intro"),c=inBattle()?null:curIntro(false),id=c?c.id:"";el.hidden=!c;el.className="intro"+(S.view==="battle"?" fl":"");
  if(el.dataset.cid!==id+LANG){el.dataset.cid=id+LANG;el.innerHTML=c?introIn(c):""} // rewritten only when the card changes, so the live region does not announce it again
  placeIntro()}
function placeIntro(){ // the floating card sits under the goal bar (so Claim stays tappable) and moves to the bottom if it would cover you on the map
  const el=$("intro");el.style.top=el.style.bottom="";if(el.hidden||!el.classList.contains("fl"))return;
  const g=$("goal");el.style.top=Math.max(8,g.hidden?0:g.getBoundingClientRect().bottom+6)+"px";
  const h=document.querySelector(".tl.here");if(h){const a=el.getBoundingClientRect(),b=h.getBoundingClientRect();if(a.bottom>b.top&&a.top<b.bottom&&a.right>b.left&&a.left<b.right){el.style.top="auto";el.style.bottom=$("nav").offsetHeight+8+"px"}}} // the card at the top of a tab; over the map it floats, so the map never shifts (a fight shows its own above the action grid)
const ci=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}${v==null||v===""?"":`<b>${v}</b>`}</span>`; // icon chip: icon + value, words in the tip
const stChip=(s,x)=>ci(FAM[STATUS[s].el]||"var(--bad)",famIc(STATUS[s].el,"s"),`${x.n>1?x.n+"x ":""}${x.t}t`,tx("{status}, {t} turns left",{status:`${STATUS[s].n}${x.n>1?` x${x.n}`:""}`,t:x.t}),cap(STATUS[s].tip)+".");
function youHud(){ // compact: weapon, HP bar, then icon chips (words in tips)
  const P=pstats(),B=S.battle,live=B&&!B.over,bite=live&&B.heat>=5,red=Math.round((bite?redOf(P.def*(1-HEAT_T.bite)):P.red)*100);
  const c=[ci("var(--fg)",stIc("atk","s"),P.atk,`${STAT_NAMES.atk} ${P.atk}`,tx("Strike power of your main hand.")),
    ci("var(--fg)",stIc("def","s"),`${red}%`,`${STAT_NAMES.def} ${P.def}`,tx("Cuts the damage you take by {p}%.",{p:red})+(bite?" "+tx("Heat 5 bites through {p}% of your Defense.",{p:Math.round(HEAT_T.bite*100)}):"")),
    P.regen&&ci("var(--up)",stIc("heal","s"),`+${P.regen}`,tx("Regen +{n}",{n:P.regen}),tx("HP you mend each turn.")),
    ...Object.entries(S.infuse).map(([t,r])=>ci(tColor(t),traitIc(t,"s"),["I","II","III"][r-1],tx("Infused {trait} {rank}",{trait:trn(t),rank:["I","II","III"][r-1]}),tx("Acts as if it were on your weapon."))),
    live&&B.guard&&ci("var(--verd)",ic("guard","s"),"",tx("Guarding"),tx("Cuts every hit in the enemy's action by {p}% and blocks new statuses.",{p:pcn(GUARD_T.cut)})),
    live&&B.braced&&ci("var(--verd)",ic("guard","s"),`+${pcn(GUARD_T.braced)}%`,tx("Braced"),tx("Your next Attack or ability deals {p}% more damage, including follow-up and off-hand strikes. Does not stack.",{p:pcn(GUARD_T.braced)})),
    live&&B.off>0&&ci("var(--down)",ic("warn","s"),"",tx("Off balance"),tx("A mistimed parry cost you your guard.")),
    live&&P.rs[B.el]&&ci(FAM[B.el],famIc(B.el,"s")+ic("resist","xs"),`${P.rs[B.el]}%`,tx("Resists {fam} {v}%",{fam:famN(B.el),v:P.rs[B.el]}),tx("Cuts damage from {fam} attacks.",{fam:famL(B.el)})),
    live&&B.ward>0&&ci("var(--verd)",ic("ward","s"),B.ward,tx("Ward {n}",{n:B.ward}),tx("Absorbs this much damage.")),
    ...(live?Object.entries(B.you||{}).map(([s,x])=>stChip(s,x)):[])].filter(Boolean).join("");
  return `<div class="you" id="youHud"><span class="yg" ${tt(tx("You"),P.main?iname(P.main):tx("Bare fists"))}>${heroMini()}</span><div class="hpline" ${tt(`${tx("HP")} ${S.hp}/${P.maxHp}`)}>${hpBar(S.hp,P.maxHp)}<span class="hpnum">${S.hp}<small>/${P.maxHp}</small></span></div><div class="chips">${c}</div></div>`;
}
function foeStage(B){
  const E=ENEMIES[B.id],K=cx(B.id),kn=know(B.id),live=afxOn(B),RC=RARITIES[rarOf(B)],et=elTr(B),eliteF=et?TRAITS[et].f:null;
  const kw=B.weak.filter(f=>K.weak.includes(f)),kr=B.resist.filter(f=>K.resist.includes(f)||f===eliteF);
  const F=foeOf(B),unknown=F.weak.filter(f=>!K.weak.includes(f)).length+F.resist.filter(f=>!K.resist.includes(f)).length;
  const st=[B.burn&&ci(FAM.fire,famIc("fire","s"),B.burn.d,tx("Burning {n}",{n:B.burn.d}),tx("Takes {n} damage each turn.",{n:B.burn.d})),B.poison&&ci(FAM.poison,famIc("poison","s"),B.poison,tx("Poison {n}",{n:B.poison}),tx("Takes {n} damage each turn.",{n:B.poison})),B.frozen&&ci(FAM.ice,famIc("ice","s"),"",tx("Frozen"),tx("It loses its next turn.")),B.bleed&&ci("var(--bad)",ic("rend","s"),B.bleed.d*B.bleed.n,tx("Bleed {n}",{n:B.bleed.d*B.bleed.n}),tx("Damage each turn that ignores armor."))].filter(Boolean).join("");
  const winding=!B.over&&!B.frozen&&isSpecial(B)&&F.sp.kind!=="heal";
  const cls=`portrait${B.over==="won"?" down":""}${winding?" winding":""}`;
  const bd=[E.boss&&ci("var(--accent)",ic("boss","s"),"",tx("Boss"),tx("Beat it to open the next region.")),B.phased&&ci("var(--bad)",ic("warn","s"),"",tx(E.phase.label),tx("Its second form.")),RC&&ci(RC.col,ic("elite","s"),"",RC.name,txn("{n} affix. Up to {hp}x HP and {atk}x Attack before the affixes' own changes.","{n} affixes. Up to {hp}x HP and {atk}x Attack before the affixes' own changes.",live.length,{hp:RC.hp,atk:RC.atk}),tx("Each affix drops its linked essence, {gs} than usual.",{gs:gsTxt(RC.gs)})),
    B.heat?ci("var(--ember)",ic("heat","s"),B.heat,tx("Heat {n}",{n:B.heat}),HEAT[B.heat-1].name):"",kn.mastered&&ci("var(--verd)",ic("renown","s"),"",tx("Mastered"),tx("You deal 15% more damage to it."))].filter(Boolean).join("");
  return `<div class="stage${RC?" rar":""}" id="enemyHud" style="--el:${FAM[B.el]}${RC?`;--rc:${RC.col}`:""}">
    <button class="${cls}" id="foeArt" data-codex="${B.id}" aria-label="${esc(fullName(B))}${RC?`, ${esc(lc(RC.name))}, ${esc(live.map(a=>tx(AFX[a].n)).join(", "))}`:""}. ${esc(tx("Open codex entry"))}">${portrait(B.id,{el:B.el,aura:RC&&RC.col,rare:rarOf(B)==="rare",frozen:B.frozen,burn:!!B.burn&&!B.over,poison:B.poison>0&&!B.over,phased:B.phased})}</button>
    <div class="foeinfo"><div class="fname"><span class="fn"${RC?` style="color:${RC.col}"`:""}>${bname(B)}</span>${B.title&&!B.split?`<span class="ti" style="color:${RC.col}">${btitle(B)}</span>`:""}<span class="bd">${bd}</span></div>
      <div class="hpline">${hpBar(B.hp,B.max,"foe")}<span class="hpnum">${Math.max(0,B.hp)}<small>/${B.max}</small></span></div>
      ${live.length?`<div class="chips afx">${live.map(a=>afxChip(a,B)).join("")}</div>`:""}
      <div class="chips">${kw.map(f=>ci(FAM[f],ic("weak","s")+famIc(f,"s"),"",tx("Weak to {fam}",{fam:famN(f)}),tx("Takes 50% more from it."))).join("")}${kr.map(f=>ci(FAM[f],ic("resist","s")+famIc(f,"s"),"",tx("Resists {fam}",{fam:famN(f)}),tx("Takes 40% less from it."))).join("")}${unknown>0?`<span class="chip unk" ${tt(tx("{n} unknown",{n:unknown}),tx("Weaknesses and resistances you have not found yet. Hit it, or Study."))}><b>?</b>${unknown}</span>`:""}${st}</div></div></div>`;
}
function logBlock(B){
  const last=B.log.slice(-2).map(l=>`<span class="ll ${l.c}">${l.t}</span>`).join("");
  return `<details class="logd" id="logd"${logOpen?" open":""}><summary>${last}<span class="more">${ic("list","s")}</span></summary><ul class="blog" id="blog">${B.log.map(l=>`<li class="ll ${l.c}">${l.t}</li>`).join("")}</ul></details>`;
}
// Camp rest: one icon button with the charge count (the text is in its tip)
function campBtn(){
  const P=pstats(),m=curMap(),low=S.hp/P.maxHp<.35,no=twistNow()==="nocamp",on=!no&&S.camp>0&&(S.hp<P.maxHp||(!m.cleared&&m.torch<m.tmax)),k=3-S.campProg;
  const tp=no?tt(tx("No campfires"),tx("This expedition has none.")):tt(tx("Rest at campfire, {n} left",{n:S.camp}),tx("Heals 50% and adds {t} torch.",{t:TORCH.rest})+" "+(S.camp>=3?txn("Next charge in {n} win (pouch full).","Next charge in {n} wins (pouch full).",k):txn("Next charge in {n} win.","Next charge in {n} wins.",k)),low?tx("You're badly hurt. Eat something or rest before your next fight."):"");
  return `<button class="ibt${low&&on?" warn":""}" id="rest" ${on?"":`aria-disabled="true" data-tap`} aria-label="${esc(tx("Rest at campfire, {n} left",{n:S.camp})+(on?"":". "+(no?tx("No campfires here"):S.camp?tx("Nothing to heal or relight"):tx("No charges left"))))}" ${tp}>${ic("camp")}<i class="cdb">${no?"-":S.camp}</i></button>`;
}
// Status strip above the map: HP and stats, torch, daily / heat badges, camp, abandon and one "?" with the map rules and every modifier
function mapHead(){
  const m=curMap(),dl=S.run==="daily",d=S.daily,h=m.heat||0,hz=heatOf(S.zone),P=pstats(),zi=zoneIdx(S.zone);
  const tp=Math.round(100*m.torch/m.tmax),out=m.torch<=0&&!m.cleared,tc=out?" out":m.torch<=TORCH.max/6?" low":"";
  const torch=m.cleared?"":`<span class="torchb${tc}" ${tt(tx("Torch {a} of {b}",{a:m.torch,b:m.tmax}),out?tx("Your torch has guttered out. You see only one tile around you, and every step risks an ambush. A camp or shrine will relight it. Hunters notice you from 6 steps away instead of 4."):tx("Every step burns it. Camps, shrine prayers and campfire rests relight it. At 0 you see one tile and risk ambushes."))}>${icon("torch")}<span class="tbar"><i style="width:${tp}%"></i></span><b>${m.torch}</b></span>`;
  const mods=[...dl?[`${DAILY_TWISTS[d.twist].name}: ${DAILY_TWISTS[d.twist].desc}`]:[],...HEAT.slice(0,h).map((x,i)=>tx("Heat {n}, {name}: {desc}",{n:i+1,name:x.name,desc:x.desc}))];
  const lair=tx(isUnl("roam")?"{boss} waits in the lair at the top. Every step burns your torch, and some creatures roam and hunt you.":"{boss} waits in the lair at the top. Every step burns your torch.",{boss:shortName(ZONES[zi][2])});
  const help=helpBtn(zoneName(S.zone),m.cleared?tx("Cleared. Explore a fresh map for more loot."):`${m.steps?tx("Tap a glowing tile next to you to step."):tx("Tap a glowing tile next to you to set out.")} ${lair}`,dl?tx("Daily expedition, {date}{old}, {n} turns so far.",{date:d.date,old:d.date!==today()?tx(" (still going from an earlier day)"):"",n:d.turns}):"",...mods);
  const badges=(dl?`<span class="heat daily" ${tt(tx("Daily expedition"),DAILY_TWISTS[d.twist].name,DAILY_TWISTS[d.twist].desc)}>${ic("daily","s")}</span>`:"")
    +(dl||!hz.max||!isUnl("heat")?(h?`<span class="heat" ${tt(tx("Heat {n}",{n:h}),...HEAT.slice(0,h).map(x=>x.name))}>${ic("heat","s")}${h}</span>`:""):`<button class="heat hb" id="heatBtn" aria-expanded="${heatOpen}" aria-label="${esc(tx("Heat: this map {a}, next expedition {b}",{a:h?h:tx("Normal"),b:hz.sel||tx("Normal")}))}" ${tt(`${tx("Heat")} ${h||tx("Normal")}`,h?HEAT[h-1].name:tx("Normal difficulty."),tx("Tap to choose the Heat of new expeditions."))}>${ic("heat","s")}${h}${hz.sel!==h&&!m.cleared?`<small>›${hz.sel}</small>`:""}</button>`);
  const amb=m.amb?`<span class="heat amb" ${tt(tx("Ambush"),tx("A whistle sounds behind you. If your next stop is a fight, it starts with an ambush."))}>${ic("warn","s")}</span>`:"";
  const ab=dl?`<button class="ibt${dArmed?" warn":""}" id="dailyAbandon" aria-label="${esc(dArmed?tx("Tap again to abandon"):tx("Abandon the daily"))}" ${tt(dArmed?tx("Tap again to abandon"):tx("Abandon the daily"),dArmed?tx("No retry today."):tx("Tap twice. You get no retry today."))}>${ic(dArmed?"warn":"close")}</button>`:"";
  const sel=!dl&&hz.max&&isUnl("heat")&&heatOpen?`<div class="hpanel"><div class="hsel" role="group" aria-label="${esc(tx("Heat for new expeditions"))}">${Array.from({length:hz.max+1},(_,n)=>`<button class="hchip" data-heat="${n}" aria-pressed="${hz.sel===n}" aria-label="${esc(n?tx("Heat {n}",{n}):tx("Normal"))}" ${n?tt(HEAT[n-1].name,HEAT[n-1].desc):tt(tx("Normal"),tx("Normal difficulty."))}>${n?ic("heat","s")+n:"0"}</button>`).join("")}</div>
    <p class="foot">${hz.sel?tx("Heat {n}, {name}: {desc} In all: {tot}.",{n:hz.sel,name:HEAT[hz.sel-1].name,desc:HEAT[hz.sel-1].desc,tot:heatTot(hz.sel)}):tx("New expeditions: normal difficulty.")}${hz.sel!==h&&!m.cleared?" "+tx("This map is Heat {n}; the choice applies to your next expedition here.",{n:h}):""}</p></div>`:"";
  return `<div class="mhead"><div class="mr"><span class="yg" ${tt(tx("You"),P.main?iname(P.main):tx("Bare fists"))}>${heroMini()}</span><div class="hpline" id="youHud" ${tt(`${tx("HP")} ${S.hp}/${P.maxHp}`)}>${hpBar(S.hp,P.maxHp)}<span class="hpnum">${S.hp}<small>/${P.maxHp}</small></span></div>
    ${ci("var(--fg)",stIc("atk","s"),P.atk,`${STAT_NAMES.atk} ${P.atk}`,tx("Strike power of your main hand."))}${ci("var(--fg)",stIc("def","s"),`${Math.round(P.red*100)}%`,`${STAT_NAMES.def} ${P.def}`,tx("Cuts the damage you take by {p}%.",{p:Math.round(P.red*100)}))}</div>
    <div class="mr">${torch}${amb}${badges}${campBtn()}${ab}${help}</div>${sel}<p class="mnow${m.ls===m.steps&&m.steps?" mnew":""}">${(m.log||[]).slice(-1)[0]||tx("Tap a glowing tile next to you to set out.")}</p></div>`;
}
function dailyCard(){
  if(S.run==="daily")return "";
  if(!dailyReady())return isUnl("heat")?`<div class="dcard">${lockRow("daily")}</div>`:""; // a teaser once the first boss is down
  const done=dailyState()==="done",d=done?S.daily:dailyPlan(today()),tw=DAILY_TWISTS[d.twist],r=done&&d.result;
  return `<div class="dcard"><div class="dtop"><b>${ic("daily")} ${tx("Daily")}</b><span class="dline"><span>${zoneName(d.zone)}</span><span class="heat">${ic("heat","s")}${d.heat}</span><span class="heat daily" ${tt(tw.name,tw.desc)}>${tw.name}</span></span>${helpBtn(tx("Daily expedition"),`${tx("{date} UTC. {desc}",{date:d.date,desc:tw.desc})}${!done&&d.zone!==d.want?" "+tx("Today's region ({want}) isn't open to you, so you go to {zone}.",{want:zoneName(d.want),zone:zoneName(d.zone)}):""}`,tx("One attempt a day. Everyone gets the same map, enemies and chests; fight drops and peddler offers can still differ."),tx("Reward for the boss: {n} essences, a rare find, {xp} smith XP.",{n:DAILY_REWARD.ess,xp:DAILY_REWARD.xp}))}</div>
    ${done?`<p class="foot dres ${r.boss?"won":""}">${tx("{result}. Come back tomorrow.",{result:`${r.boss?tx("Done"):tx("Over")}: ${dailyResult(r)}`})}</p>`:`<div class="actions"><button class="btn primary sm grow" id="dailyStart">${tx("Start today's run")}</button></div>`}</div>`;
}
function zoneView(){ // keep the chosen region chip in view and fade the edges that hide more chips
  const z=$("zones"),p=z.querySelector('[aria-pressed="true"]');
  if(p&&z.scrollWidth>z.clientWidth)z.scrollLeft+=p.getBoundingClientRect().left-z.getBoundingClientRect().left-(z.clientWidth-p.offsetWidth)/2;
  zoneFade()}
function zoneFade(){const z=$("zones");z.dataset.l=z.scrollLeft>2?1:0;z.dataset.r=z.scrollLeft+z.clientWidth<z.scrollWidth-2?1:0}
function fitMap(){ // keep 36px touch tiles; wider expeditions pan inside the map, never the page
  const w=document.querySelector(".mapwrap");if(!w||S.view!=="battle")return;const mp=w.firstElementChild,m=curMap(),nav=$("nav").offsetHeight;
  document.documentElement.style.setProperty("--nav",nav+"px");mp.style.setProperty("--mw","");
  const top=w.getBoundingClientRect().top+scrollY,room=Math.max(260,innerHeight-nav-38-top),min=37*m.w+3,max=Math.max(min,Math.min(680,w.clientWidth-4));
  mp.style.setProperty("--mw",Math.max(min,Math.min(max,Math.floor(room*m.w/m.h)))+"px");w.style.maxHeight=room+"px";w.dataset.pan=mp.offsetWidth>w.clientWidth||mp.offsetHeight>w.clientHeight?"1":"0";
}
const heroView=()=>document.querySelector(".tl.here")?.scrollIntoView({block:"nearest",inline:"nearest"});
function renderBattle(){
  $("zones").innerHTML=ZONES.map(([id,name,boss],i)=>{const open=zoneOpen(id),cleared=S.kills[boss]>0;
    return `<button class="zone" data-zone="${id}" aria-pressed="${S.zone===id}" ${open&&!busy()&&S.run!=="daily"?"":"disabled"}>${tx(name)}${cleared?" ✓":""}${open?"":` · ${tx("beat {boss}",{boss:shortName(ZONES[i-1][2])})}`}</button>`}).join("");zoneView();
  const a=$("arena"),B=S.battle,cont=`<div class="actions"><button class="btn primary grow" id="cont">${tx("Back to the map")}</button></div>`;
  if(S.event){const ev=S.event;
    a.innerHTML=`<div class="event">${ev.icon?`<svg class="evart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G[ev.icon]}</svg>`:""}<h2>${ev.title}</h2><p class="empty">${ev.text}</p></div>
      ${ev.loot.length?`<div class="loot" style="justify-content:center">${lootChips(ev.loot)}</div>`:""}${ev.stock?shopHtml(ev):""}
      ${ev.sc?`<p class="scrl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G.scroll}</svg><span>${ev.sc}</span></p>`:""}
      ${ev.choices.length?`<div class="actions">${ev.choices.map(([c,l],i)=>`<button class="btn ${i===0?"primary":""} grow" data-choice="${c}">${l}</button>`).join("")}</div>`:cont}${youHud()}`;return}
  if(!B){
    const m=curMap(),zi=zoneIdx(S.zone),bossId=ZONES[zi][2],next=ZONES[zi+1];
    const head=m.cleared?`<div class="cleared"><b>${ic("ok")} ${tx("{zone} cleared",{zone:tx(ZONES[zi][1])})}</b>${helpBtn(tx("{boss} has fallen",{boss:shortName(bossId)}),next&&zoneOpen(next[0])?tx("Explore a fresh map here for more loot, or move on to {next}.",{next:tx(next[1])}):tx("Explore a fresh map here for more loot."))}
        <div class="actions"><button class="btn sm grow" id="again">${tx("New expedition")}</button>${next&&zoneOpen(next[0])?`<button class="btn primary sm grow" data-zone="${next[0]}">${tx("Travel to {zone}",{zone:tx(next[1])})}</button>`:""}</div></div>`:"";
    a.innerHTML=`${mapHead()}${head}${mapHtml()}${dailyCard()}`;fitMap();heroView();return}
  const K=cx(B.id);
  let body="";
  if(!B.over){
    const P=pstats(),sp=isSpecial(B)?foeOf(B).sp:null,est=foeHit(B,P,sp?sp.x:1,1)*(sp&&sp.kind==="multi"?sp.n:1);
    const dmgTxt=K.stats?B.ward>=est?tx("No damage expected (ward absorbs it)."):B.ward>0?tx("About {n} damage (ward absorbs {w}).",{n:est,w:B.ward}):tx("About {n} damage.",{n:est}):"";
    const pc=Math.round(parryChance(B,P)*100),dm=K.stats&&!(B.ward>=est)?ci("var(--down)",ic("hit","s"),`~${est}`,tx("About {n} damage",{n:est}),B.ward>0?tx("Your ward absorbs {n}.",{n:B.ward}):tx("Before your Guard.")):K.stats?ci("var(--verd)",ic("ward","s"),"0",tx("No damage expected"),tx("Your ward absorbs it.")):"";
    const formBonus=PARRY_T.form[P.main&&P.main.form]||0,parryTip=tx("Base {base}%; training {n}/{max} (+{study}%); Speed +{spd}%; weapon {form}%; cap {cap}%.",{base:pcn(PARRY_T.base),n:parryLevel(B),max:PARRY_T.levels,study:pcn(parryLevel(B)*PARRY_T.study),spd:Math.round(Math.min(PARRY_T.spdCap,P.spd*PARRY_T.spd)*1000)/10,form:(formBonus>=0?"+":"")+pcn(formBonus),cap:pcn(PARRY_T.cap)});
    const bm=hasAfx(B,"boom")&&B.hp<=B.max*AFX_T.boom.warn?ci("var(--down)",ic("a_boom","s"),`~${blastOf(B)}`,tx("Blast ~{n} when it dies",{n:blastOf(B)}),tx("It is about to burst. Guard cuts the blast by {p}%, but only if it dies on its own turn (burn, poison, bleed). Your rune ward soaks it.",{p:pcn(1-AFX_T.boom.guard)}),S.hp<=blastOf(B)?tx("You would not survive it. Heal first."):""):"";
    const dot=(B.burn?B.burn.d:0)+(B.poison||0)+(B.bleed?B.bleed.d*B.bleed.n:0),fzc=hasAfx(B,"frenzy")&&!B.fz&&dot>0&&B.hp-dot<B.max*AFX_T.frenzy.at&&B.hp>=B.max*AFX_T.frenzy.at?ci("var(--down)",ic("a_frenzy","s"),"",tx("It may frenzy"),tx("Its burn, poison or bleed will take it under {at}% HP this turn. It then hits {p}% harder.",{at:pcn(AFX_T.frenzy.at),p:pcn(AFX_T.frenzy.x-1)})):"";
    const known=(B.phased?K.sp2:K.sp);
    const intent=B.frozen?`<div class="intent" ${tt(tx("Next"),tx("Frozen. It will lose its turn."))}><b>${tx("NEXT")}</b>${ci(FAM.ice,famIc("ice","s"),tx("Frozen"),tx("Frozen"),tx("It will lose its turn."))}${bm}${fzc}</div>`
      :sp?`<div class="intent special" ${tt(tx("Next: {name}",{name:known?tx(sp.name):tx("something big")}),tx("It's {tell}.",{tell:tx(sp.tell)}),[dmgTxt,isUnl("parry")?sp.kind==="heal"?tx("Parry ({p}%) to interrupt it.",{p:pc}):tx("Guard, or Parry ({p}%) to turn it back!",{p:pc}):tx("Guard to soften it.")].filter(Boolean).join(" "))}><b>${tx("NEXT")}</b><span class="in">${ic("warn","s")} ${known?tx(sp.name):tx("Something big")}</span>${sp.kind==="heal"?"":dm}${isUnl("parry")?ci("var(--accent)",ic("parry","s"),`${pc}%`,tx("Parry {p}%",{p:pc}),tx("Beat a telegraphed special: negate it and riposte.")):""}${bm}${fzc}</div>`
      :`<div class="intent" ${tt(tx("Next: a normal attack"),dmgTxt,tx("Parrying now would backfire."))}><b>${tx("NEXT")}</b><span class="in">${ic("attack","s")} ${tx("Attack")}</span>${dm}${isUnl("parry")?`<span class="chip no">${ic("parry","s")}<b>${tx("no parry")}</b></span>`:""}${bm}${fzc}</div>`;
    const cons=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable");
    const canStudy=unknownFacts(B.id).length>0||canTrainParry(B)||(hasAfx(B,"elusive")&&(B.sty||0)<AFX_T.dodge.studyMax),abs=abKeys(P).filter(abOn),abBtn=k=>{const A=ABILITIES[k],c=(B.cd||{})[k]||0;return `<button class="btn act ab" data-ability="${k}" ${c>0?`aria-disabled="true" data-tap`:""} aria-label="${esc(A.name+(c>0?", "+txn("ready in {n} turn","ready in {n} turns",c):"")+". "+A.desc)}" ${tt(A.name,c>0?txn("Ready in {n} turn.","Ready in {n} turns.",c):tx("Cooldown {n} turns.",{n:A.cd}),A.desc)}>${icon(A.icon)}<span>${A.name}</span>${c>0?`<i class="cdb">${c}</i>`:""}</button>`};
    body=`${intent}${youHud()}${introHtml(curIntro(true))}
      <div class="acts n${abs.length}"><button class="btn primary act" id="atk" ${tt(tx("Attack"),tx("Strike with your main hand."))}>${icon("attack")}<span>${tx("Attack")}</span></button>${abs.map(abBtn).join("")}<button class="btn act" id="guard" ${tt(tx("Guard"),tx("Cuts every hit in the enemy's action by {p}% and blocks new statuses.",{p:pcn(GUARD_T.cut)}),tx("Gain Braced: your next Attack or ability deals {p}% more damage. Does not stack. Existing statuses still tick.",{p:pcn(GUARD_T.braced)}),B.off>0?tx("A mistimed parry cost you your guard."):"")}>${icon("guard")}<span>${tx("Guard")}</span></button>${isUnl("parry")?`<button class="btn act" id="parry" ${tt(tx("Parry {p}%",{p:pc}),tx("Beat a telegraphed special: negate it and riposte ({p}% to land). Mistimed: +25% damage and a lost guard.",{p:pc}),parryTip,B.off>0?tx("Off balance: you cannot parry this turn."):!sp?tx("Parrying now would backfire."):"")}>${icon("parry")}<span>${tx("Parry")} ${pc}%</span></button>`:lockAct("parry")}
      ${isUnl("study")?`<button class="btn act" id="study" ${canStudy?"":`aria-disabled="true" data-tap`} ${tt(canStudy?tx("Study"):tx("Known"),canStudy?tx("Learn one fact about it, but it costs your turn."):tx("You know everything it can teach."),tx("Parry training {n}/{max}: Study raises your chance against this form's special by {p}% per rank, across battles.",{n:parryLevel(B),max:PARRY_T.levels,p:pcn(PARRY_T.study)}),hasAfx(B,"elusive")?tx("Also lowers the dodge of an Elusive foe by {p}% ({a} of {b} used).",{p:AFX_T.dodge.study,a:B.sty||0,b:AFX_T.dodge.studyMax}):"")}>${icon("study")}<span>${canStudy?tx("Study"):tx("Known")}</span></button>`:lockAct("study")}<button class="btn act" id="flee" ${tt(tx("Flee"),tx("Try to get away. A creature from the map stays alive and dazed."))}>${icon("flee")}<span>${tx("Flee")}</span></button></div>
      ${cons.length?`<div class="sqg cons">${cons.map(id=>{const it=S.items[id],hint=useHint(it);return `<button class="sq" style="${rcol(it)}" data-use="${id}" aria-label="${esc(tx("Use {item}",{item:iname(it)})+(S.inv[id]>1?", "+tx("{n} held",{n:S.inv[id]}):"")+". "+hint)}" ${tt(iname(it),hint,tx("You hold {n}.",{n:S.inv[id]}))}>${glyph(it)}${S.inv[id]>1?`<span class="sq-n">${S.inv[id]}</span>`:""}<span class="sq-p">${esc(hint.split(" · ")[0])}</span></button>`}).join("")}</div>`:""}
      ${logBlock(B)}`;
  }else{
    const loot=B.over==="won"?`<div class="loot"><span class="label" ${tt(tx("Loot"),tx("Tap an item to inspect it."))}>${ic("bag")}</span>${lootChips(B.loot)}${B.emb&&isUnl("peddler")?`<span class="chip emb">${icon("ember")}+${B.emb}</span>`:""}</div>`:"";
    body=`${loot}${youHud()}<div class="actions"><button class="btn primary grow" id="cont">${tx("Back to the map")}</button>${B.over==="won"?`<button class="btn grow" id="toforge">${tx("Go to the forge")}</button>`:""}</div>${logBlock(B)}`;
  }
  a.innerHTML=`${foeStage(B)}${body}`;
  const bl=$("blog");if(bl)bl.scrollTop=bl.scrollHeight;
}
function useHint(it){const st=statsOf(it),p=[];if(st.heal>0)p.push(tx("+{n} HP",{n:medHeal(it)}));const d=Math.round((st.atk+st.mag)*.6);if(d>=3)p.push(tx("{n} dmg",{n:d}));const c=cures(it.traits);if(c.length)p.push(tx("cures {list}",{list:c.map(s=>lc(STATUS[s].n)).join(", ")}));return p.join(" · ")||tx("no effect")}
// Worn items a fizzle would take (the bench holds the equipped copy or the last copy)
const equippedRisk=items=>[...new Set(items.map(i=>i.id))].filter(id=>(S.inv[id]||0)-benchCount(id)<eqCount(id)).map(id=>iname(S.items[id]));
// Forge preview line: the skill that makes this, success / mishap / fizzle odds, and the tier cap
function craftLine(r,items){
  const risk=equippedRisk(items),sk=SKILLS[r.skill],cp=SK_CAP[r.lv-1],b=r.blocked,ch=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${v}</b></span>`;
  return `<div class="cline${b?" blocked":""}"><div class="chips">${isUnl("skills")?ch("var(--accent)",skIcon(r.skill),tx("Lv {n}",{n:r.lv}),tx("{skill} Lv {lv}",{skill:sk.name,lv:r.lv}),tx("The skill that makes this.")):""}${ch("var(--muted)",ic("tier","s"),`${r.item.tier}/${cp}`,tx("Tier {n}, your cap is {c}",{n:r.item.tier,c:cp}),tx("The result's tier against the highest tier your skill can reach."))}
    ${b?"":ch("var(--up)",ic("ok","s"),`${100-r.fail}%`,tx("{n}% clean",{n:100-r.fail}),tx("A clean forge gives exactly the item previewed."))+ch("var(--accent)",ic("warn","s"),`${r.mis}%`,tx("{n}% mishap",{n:r.mis}),tx(isUnl("peddler")?"A mishap gives a flawed copy (Cursed, Brittle, Rust or Weakened) that you can reforge for embers.":"A mishap gives a flawed copy (Cursed, Brittle, Rust or Weakened)."))+ch("var(--down)",ic("smoke","s"),`${r.fiz}%`,tx("{n}% fizzle",{n:r.fiz}),tx(isUnl("peddler")?"A fizzle loses the ingredients but returns some embers.":"A fizzle loses the ingredients."))
      +helpBtn(tx("Forge odds"),S.journal.length?tx("Difficulty {d} against your skill {lv}{reach}. The higher your skill, the fewer mishaps and fizzles.",{d:r.diff,lv:r.lv,reach:r.diff-r.lv>2?tx(", a reach for you"):""}):tx("Your first forge never fails."))}</div>
    ${b?`<p class="warn-text">${blockText(b)}</p>`:""}
    ${risk.length?`<p class="warn-text">${risk.length>1?tx("{list} are equipped. A fizzle would destroy them; tap Forge twice to confirm.",{list:risk.join(tx(" and "))}):tx("{list} is equipped. A fizzle would destroy it; tap Forge twice to confirm.",{list:risk[0]})}</p>`:""}</div>`;
}
const skIcon=k=>`<svg class="ski" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${G[SKILLS[k].g]}</svg>`;
function renderSkills(){
  const su=isUnl("skills");$("skd").hidden=!su;$("sklock").hidden=su;if(!su){$("sklock").innerHTML=lockRow("skills");return}
  $("sksum").innerHTML=`${ic("hammer","s")} ${tx("Crafting skills")}${helpBtn(tx("Crafting skills"),tx("Every kind of thing has its own skill. A craft trains the skill of what you make, and a little of each other kind you put in. A higher skill raises the tier you can reach and lowers the chance a forge goes wrong."))}`;
  $("skills").innerHTML=Object.entries(SKILLS).map(([k,sk])=>{const l=skLv(k),cur=SK_LV[l-1],nxt=SK_LV[l],x=skXp(k);
    const f=Math.round(Math.max(FAIL.min,Math.min(FAIL.max,FAIL.base+FAIL.slope*(CRAFT.base+CRAFT.tier-l)))); // a plain tier-2 craft with no clashes
    return `<div class="sk" ${tt(tx("{skill} Lv {lv}",{skill:sk.name,lv:l}),tx("Makes {cats}.",{cats:sk.cats}),nxt?tx("{a}/{b} XP to Lv {n}.",{a:x-cur,b:nxt-cur,n:l+1}):tx("Highest level reached."),tx("Tier cap {c}; about {f}% base failure on a plain tier-2 craft.",{c:SK_CAP[l-1],f}))}>${skIcon(k)}<div class="skb"><span class="sn"><b>${sk.name}</b> <span class="foot">${tx("Lv {n}",{n:l})}</span></span>
      <div class="bar know"><i style="width:${nxt?Math.min(100,(x-cur)/(nxt-cur)*100):100}%"></i></div></div><span class="skc"><span>${ic("tier","xs")}${SK_CAP[l-1]}</span><span>${ic("warn","xs")}${f}%</span></span></div>`}).join("");
}
function renderBench(){
  const max=maxInputs(),parts=[],items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  for(let i=0;i<(level()>=2?4:3);i++){
    if(i>0)parts.push('<span class="plus" aria-hidden="true">+</span>');
    if(i>=max){parts.push(`<div class="slot locked" ${tt(tx("Slot {n}",{n:i+1}),tx("Unlocks at Smith Lv {n}",{n:INPUT_LV[i-2]}))}>${ic("lock")}<small>${tx("Lv {n}",{n:INPUT_LV[i-2]})}</small></div>`);continue}
    const it=items[i];
    parts.push(it?`<button class="slot full${!chk.ok&&chk.bad?.id===it.id?" bad":""}" style="${rcol(it)}" data-slot="${i}" aria-label="${esc(tx("Remove {item}",{item:iname(it)}))}" ${itemTip(it,tx("Tap to take it out."))}>${glyph(it)}</button>`:`<div class="slot" aria-label="${esc(tx("Empty slot"))}">${ic("plus","l")}</div>`);
  }
  $("slots").className=level()>=2?"slots s4":"slots";$("slots").innerHTML=parts.join("");
  let hint="",crafting=null;
  if(!items.length)hint=`<p class="foot" style="text-align:center">${tx("Tap items below to add them.")}</p>`;
  else if(!chk.ok)hint=`<p class="warn-text">${chk.reason}</p>`;
  else if(items.length===1)hint=`<p class="foot">${tx("{item} takes {list}.",{item:iname(items[0]),list:acceptsText(items[0])})}</p>`;
  else{
    const r=combine(items,{roll:100}),known=S.items[r.item.id],base=S.items[r.baseId];crafting=r;
    if(known){
      const ts=targetSlot(known),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==known.id&&eqIt.id!==base.id;
      hint=`<div class="preview"><div class="rhead sm">${glyph(known)}<div><div class="rform">${ic("ok","s")} ${tx("Known recipe")} · ${rarity(known)[0]} · ${labelOf(known)}</div><b>${nameHtml(known)}</b></div></div>
        ${itemProperties(known,base,false,"Compared to")}${showEq?cmpBlock(known,eqIt,"Versus equipped"):""}</div>`}
    else{
      const knownR=new Set(S.knownR),kr=r.rxKeys.filter(k=>knownR.has(k)),ur=r.rxKeys.filter(k=>!knownR.has(k));
      const hidden=new Set(REACTIONS.filter(([a,b])=>ur.includes(a+"+"+b)).map(x=>x[2]));
      const appraise=level()>=3?`<span class="foot">${tx("Appraisal: {list}",{list:Object.keys(r.item.traits).map(t=>hidden.has(t)?"???":trn(t)).join(", ")})}</span>`:`<span class="foot">${tx("Appraisal unlocks at Smith Lv 3.")}</span>`;
      hint=`<div class="preview"><span class="ok-text">${ic("plus","s")} ${tx("New combination: a {form}.",{form:formName(r.item.form)})}</span>
        ${kr.length?`<span class="foot">${tx("Known reactions: {list}",{list:kr.map(k=>{const x=REACTIONS.find(([a,b])=>a+"+"+b===k);return `${trn(x[0])} + ${trn(x[1])} → ${trn(x[2])}`}).join(", ")})}</span>`:""}
        ${ur.length?`<span class="foot" style="color:var(--accent)" ${tt(tx("Unseen reaction"),tx("Something in this mix will react in a way you haven't seen yet."))}>${ic("warn","xs")} ${tx("An unseen reaction")}</span>`:""}
        ${appraise}</div>`}
    hint+=craftLine(r,items);
  }
  $("mixhint").innerHTML=hint;
  $("combine").textContent=forgeArmed&&forgeArmed===S.bench.join()?tx("Tap again to forge"):tx("Forge");
  $("combine").disabled=items.length<2||!chk.ok||!!crafting?.blocked;
}
function renderResult(fresh){
  const el=$("result"),total=Object.values(S.inv).reduce((s,c)=>s+c,0);
  if(!S.last){el.className="panel result";el.innerHTML=`<p class="empty">${total<2?tx("You need at least two items to forge. Win battles to collect loot."):tx("Your sword takes ores, herbs, potions, essences and relics. Salvage loot in the Gear tab to turn it into essences.")}</p>`;return}
  const r=S.last,ch=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${v}</b></span>`;
  const gains=`<div class="chips">${ch("var(--accent)",ic("xp","s"),`+${r.xpGain}`,tx("Smith XP"),tx("+{n} smith XP. It raises your smith level, which opens crucible slots and trait slots.",{n:r.xpGain}))}${Object.entries(r.sx||{}).map(([k,n])=>ch("var(--fg)",skIcon(k),`+${n}`,`${SKILLS[k].name} +${n}`,r.scaled?tx("Easy or known recipes teach less."):tx("Crafting trains the skill of what you make."))).join("")}`; // the tail (fail chip) is added per branch
  const logLi=l=>`<li class="${l.warn?"warn":""}"><strong>${tx(l.k)}</strong> ${l.t}</li>`;
  if(r.fizzle){el.className="panel result fizzle"+(fresh?" fresh":"");
    el.innerHTML=`<div class="rhead"><div><div class="rform">${tx("Fizzle")}</div><h2 class="rname">${tx("Ashes and smoke")}</h2></div></div>
      <ul class="log"><li><strong>${tx("Recipe")}</strong> ${recipeNames(r)}</li>${r.log.map(logLi).join("")}${r.refund&&isUnl("peddler")?`<li><strong>${tx("Embers")}</strong> ${tx("You sift {n} out of the ash.",{n:r.refund})}</li>`:""}</ul>
      ${gains}<span class="foot">${tx("you learn from failure")}</span></div>`;return}
  const it=S.items[r.id]||r.item,base=S.items[r.baseId],[rn]=rarity(it);
  const ts=targetSlot(it),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==it.id&&eqIt.id!==base?.id;
  el.className="panel result"+(it.legendary?" legend":"")+(fresh?" fresh":"");
  el.innerHTML=`<div class="rhead">${glyph(it)}<div><div class="rform">${rn} · ${labelOf(it)} · ${tx("Tier {n}",{n:it.tier})}</div>
    <h2 class="rname">${nameHtml(it)}${r.isNew?`<span class="badge${it.legendary?" gold":""}">${it.legendary?tx("Legendary"):tx("New")}</span>`:""}</h2></div></div>
    ${itemProperties(it,base,false,"Compared to")}
    ${showEq?cmpBlock(it,eqIt,"Versus equipped"):""}
    <ul class="log"><li><strong>${tx("Recipe")}</strong> ${recipeNames(r.id?it:r)}</li>${r.log.map(logLi).join("")}</ul>
    ${gains}${ch(r.mishap?"var(--accent)":"var(--up)",ic(r.mishap?"warn":"ok","s"),`${r.inst}%`,r.mishap?tx("Flawed"):tx("Held together"),tx("{n}% was the chance to fail.",{n:r.inst}))}</div>
    ${S.inv[it.id]>0?`<div class="actions"><button class="btn${isGear(it)&&!eqCount(it.id)?" primary":""}" data-open="${it.id}">${isGear(it)&&!eqCount(it.id)?tx("Equip or inspect"):tx("Inspect")}</button></div>`:""}`;
}
const TABS=[["all","All"],["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["consumable","Consumables"],["material","Materials"]];
const baseName=it=>(S.items[baseIdOf(it.id)]||it).name; // graded items sort next to their Plain kin, by grade
const TAB_IC={all:()=>ic("bag"),weapon:()=>gIc("blade"),armor:()=>gIc("chest"),charm:()=>ic("amulet"),consumable:()=>gIc("potion"),material:()=>gIc("ore")};
const tabBtn=(attr,k,l,on)=>`<button class="tab ti" data-${attr}="${k}" aria-pressed="${on}" aria-label="${esc(tx(l))}" ${tt(tx(l))}>${TAB_IC[k]()}${on?`<span>${tx(l)}</span>`:""}</button>`; // icon filter chip: the active one shows its name, the rest have a tip
function satchel(mode){
  const tabs=TABS.map(([k,l])=>tabBtn("tab",k,l,S.tab===k)).join("");
  const list=Object.keys(S.inv).filter(id=>S.inv[id]>0).map(id=>S.items[id]).filter(it=>S.tab==="all"||grp(it)===S.tab)
    .sort((a,b)=>FORMS[b.form].p-FORMS[a.form].p||b.tier-a.tier||baseName(a).localeCompare(baseName(b))||gradeOf(a.id)-gradeOf(b.id)||a.name.localeCompare(b.name));
  const benchItems=S.bench.map(id=>S.items[id]),full=S.bench.length>=maxInputs();
  const tiles=list.length?list.map(it=>{const eq=eqCount(it.id)>0,left=avail(it.id),isNew=freshShown.has(it.id)||S.fresh.includes(it.id);
    let note="",no=false;
    if(mode==="forge"){if(left<=0){no=true;note=tx("All in the crucible.")}else if(full){no=true;note=tx("The crucible is full.")}else if(!checkMix([...benchItems,it]).ok){no=true;note=tx("Won't mix with what is in the crucible.")}}
    return `<button class="sq${it.legendary?" legend":""}${it.grade?" gr":""}${eq?" eq":""}${no?" no":""}" style="${rcol(it)}" data-id="${it.id}" data-can="${no?0:1}" aria-label="${esc(iname(it)+(left!==1?`, ${left}`:"")+(eq?", "+tx("worn"):"")+(isNew?", "+tx("new"):"")+(note?`, ${note}`:""))}. ${itemAria(it)}" ${itemTip(it,left>1?tx("You hold {n}.",{n:left}):"",eq?tx("Worn."):"",note)}>
      ${glyph(it)}${left!==1?`<span class="sq-n">${left}</span>`:""}${eq?`<span class="sq-w">${ic("equip","xs")}</span>`:""}${isGear(it)||it.grade?`<span class="sq-p"${it.grade?` style="color:var(--gc)"`:""}>${isGear(it)?power(it):ROMAN[it.grade]}</span>`:""}${isNew?'<i class="sq-d"></i>':""}</button>`}).join("")
    :`<p class="empty">${tx("Nothing here yet.")}</p>`;
  return [tabs,tiles];
}
function renderSatchels(){
  if(S.view==="gear"){const [t,i]=satchel("gear");$("gtabs").innerHTML=t;$("ginv").innerHTML=i}
  if(S.view==="forge"){const [t,i]=satchel("forge");$("ftabs").innerHTML=t;$("finv").innerHTML=i}
}
function haveFor(ids){const need={};ids.forEach(id=>need[id]=(need[id]||0)+1);return ids.map(id=>(S.inv[id]||0)>=need[id])}
const REC_IC={weapon:"blade",armor:"chest",charm:"charm",food:"food",potion:"potion",hide:"hide",ore:"ore",herb:"herb",essence:"essence",relic:"relic"};
const kic=(k,tip)=>`<span class="kic" ${tt(...tip)}>${gIc(REC_IC[k]||k,"")}</span>`;
const kindCap=a=>LANG==="en"?cap(KIND_LABEL[a]):txc("kind",KIND_LABEL[a]);
function renderRecipes(){
  $("rtabs").innerHTML=TABS.map(([k,l])=>tabBtn("rtab",k,l,S.rtab===k)).join("");
  const recs=S.journal.slice().reverse().map(j=>S.items[j.id]).filter(it=>it&&(S.rtab==="all"||grp(it)===S.rtab));
  $("rlabel").innerHTML=`${ic("recipes","s")} ${tx("Your recipes")} · ${S.journal.length}${helpBtn(tx("Recipes"),tx("Every combination you forge is saved here. Tap the anvil to load its ingredients into the crucible."),tx("Ingredients you don't have are crossed out."))}`;
  $("rlist").innerHTML=recs.length?recs.map(it=>{const ids=it.recipeIds||[],have=haveFor(ids),all=have.every(Boolean)&&ids.length<=maxInputs()&&!inBattle(),lv=ids.length>maxInputs();
    const why=all?tx("Load the ingredients into the crucible."):lv?tx("Needs Smith Lv {n} for {k} slots.",{n:INPUT_LV[ids.length-3],k:ids.length}):inBattle()?tx("Finish the fight first."):tx("You are missing ingredients.");
    return `<div class="rr${all?" ok":""}"><span class="rg" style="${rcol(it)}" ${itemTip(it,tx("Recipe"))}>${glyph(it)}</span><div class="rm"><span class="rn">${nameHtml(it)}</span><span class="ris">${ids.map((id,i)=>{const x=S.items[id];return `<span class="ri1 ${have[i]?"have":"miss"}" ${tt(x?iname(x):"?",have[i]?tx("You have it."):tx("You are out of it."))}>${x?glyph(x):ic("mystery")}</span>`}).join('<i>+</i>')}</span></div>
      ${all?`<button class="ibt load" data-load="${it.id}" aria-label="${esc(tx("Load the recipe for {item}",{item:iname(it)}))}" ${tt(tx("Load"),why)}>${icon("forge")}</button>`
        :`<button class="ibt load off" data-tap aria-label="${esc(tx("Cannot load {item}: {why}",{item:iname(it),why}))}" ${tt(lv?tx("Needs Lv {n}",{n:INPUT_LV[ids.length-3]}):tx("Missing"),why)}>${lv?ic("lock"):ic("bag")}</button>`}</div>`}).join("")
    :`<p class="empty">${S.journal.length?tx("No recipes in this category yet."):tx("Every combination you forge is saved here so you can make it again.")}</p>`;
  $("mixsum").innerHTML=`${ic("filter","s")} ${tx("What mixes with what")}${helpBtn(tx("What mixes"),tx("Each row lists what that kind of item takes, besides its own type. Essences mix with everything; salvage any item to get them."))}`;
  $("mixrules").innerHTML=[["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["food","Food"],["potion","Potions"]]
    .map(([k,l0])=>{const l=tx(l0);return `<div class="mx">${kic(k,[l])}<span class="ar">${tx("takes")}</span>${ACCEPTS[k].map(a=>kic(a,[kindCap(a)])).join("")}<span class="kic same" ${tt(tx("The same type"),tx("{kind} also take other {kindl}.",{kind:l,kindl:lc(l)}))}>${ic("plus","s")}</span></div>`}).join("")
    +`<div class="mx">${kic("ore",[tx("Materials"),tx("Hides, ores and herbs.")])}<span class="ar">${tx("takes")}</span>${["hide","ore","herb","essence","relic"].map(a=>kic(a,[kindCap(a),a==="hide"||a==="ore"||a==="herb"?tx("Only their own kind."):""])).join("")}</div>
      <div class="mx">${kic("essence",[tx("Essences")])}<span class="ar">${tx("takes")}</span><span class="kic" ${tt(tx("Everything"),tx("Salvage any item to get essences."))}>${ic("bag")}</span></div>`;
  $("fusions").innerHTML=FUSIONS.map(([a,b,f])=>`<span class="fu" ${tt(tx("{a} + {b} → {c}",{a:cap(formName(a)),b:formName(b),c:txc("noun",FORMS[f].noun)}),tx("A fusion: two kinds that merge into a new one."))}>${gIc(a)}<i>+</i>${gIc(b)}<i>→</i><b>${gIc(f)}</b></span>`).join("");
  const known=new Set(S.knownR),rd=REACTIONS.filter(([a,b])=>known.has(a+"+"+b));
  $("rxlabel").innerHTML=`${ic("infuse","s")} ${tx("Trait reactions")} · ${rd.length}/${REACTIONS.length}${helpBtn(tx("Trait reactions"),tx("Some pairs of traits react when they meet in the crucible and become a new trait. Discover one by forging it."))}`;
  $("reactions").innerHTML=[...rd.map(([a,b,res,cons])=>`<span class="rx1" ${tt(`${trn(a)} + ${trn(b)} → ${trn(res)}`,cons.length?"":tx("Keeps both traits."))}>${ci(tColor(a),traitIc(a,"s"))}<i>+</i>${ci(tColor(b),traitIc(b,"s"))}<i>→</i>${ci(tColor(res),traitIc(res,"s"))}</span>`),
    ...REACTIONS.filter(([a,b])=>!known.has(a+"+"+b)).map(()=>`<span class="rx1 unk" ${tt(tx("Undiscovered reaction"),tx("Forge the right pair of traits to find it."))}>?</span>`)].join("");
  const fd=SECRETS.filter(found).length;
  $("seclabel").innerHTML=`${ic("renown","s")} ${tx("Legendary secrets")} · ${fd}/${SECRETS.length}${helpBtn(tx("Legendary secrets"),tx("Hint scrolls from chests, shrines, riddles, bosses, bounties and the daily reveal a rumor, then its ingredients."))}`;
  $("secrets").innerHTML=SECRETS.map((sc,i)=>{const ok=found(sc),lv=hintLv(i),jr=ok&&S.journal.find(j=>S.items[j.id]?.legendary&&S.items[j.id].name===sc.name);
    const ing=sc.ids.map((id,k)=>k<lv-1?idName(id):"?").join(" + ");
    return ok?`<span class="sq sec ok" style="--rc:var(--accent)" ${tt(tx(sc.name),tx("Discovered."),sc.ids.map(idName).join(" + "))}>${jr?glyph(S.items[jr.id]):ic("renown")}</span>`
      :lv?`<span class="sq sec" ${tt(tx("A rumor"),tx(sc.hint),tx("Ingredients: {list}",{list:ing}))}><b>?</b><span class="sq-p">${Math.max(0,lv-1)}/${sc.ids.length}</span></span>`
      :`<span class="sq sec lock" ${tt(tx("Undiscovered"),tx("A hint scroll would reveal a rumor."))}>${ic("lock")}</span>`}).join("");
}
const sn=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,"")+"M":n>=1e4?(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,"")+"k":String(n);
function renderStats(){
  const st=S.stats,zn=Object.fromEntries(ZONES.map(z=>[z[0],tx(z[1])])),cell=(v,l)=>`<div class="sc"><b>${v}</b><span>${l}</span></div>`,grp=(t,h)=>`<p class="label">${t}</p><div class="sgrid">${h}</div>`;
  const kz=ZONES.map(z=>S.zoneKills[z[0]]|0),bossIds=ZONES.map(z=>z[2]);
  const heat=ZONES.filter(z=>st.heatBest[z[0]]!==undefined).map(z=>`${zn[z[0]].split(" ").pop()} ${st.heatBest[z[0]]}`).join(" · ")||tx("none yet");
  const fast=bossIds.filter(id=>st.fast[id]).map(id=>`<li><span>${tx(ENEMIES[id].name)}</span><b>${txn("{n} turn","{n} turns",st.fast[id])}</b></li>`).join("")||`<li><span>${tx("No boss beaten yet")}</span></li>`;
  const bigW=S.items[st.bigW]?iname(S.items[st.bigW]):st.bigW?tx(st.bigW):"";
  $("stats").innerHTML=grp(tx("Combat"),cell(sn(st.dealt),tx("damage dealt"))+cell(sn(st.taken),tx("damage taken in battle"))+cell(st.big?`${st.big}`:"-",st.big?tx("biggest hit · {w}",{w:bigW}):tx("biggest hit"))+cell(st.crits,tx("critical hits"))
      +cell(st.parries,tx("perfect parries"))+cell(st.abil,tx("abilities used"))+cell(st.sufd,tx("statuses suffered"))+cell(st.cured,tx("statuses cured"))+cell(st.deaths,tx("defeats"))+cell(st.studied,tx("creatures studied")))
    +grp(tx("Exploration"),cell(kz.reduce((a,b)=>a+b,0),tx("creatures slain"))+cell(st.elites,tx("magic & rare slain"))+cell(st.bosses,tx("bosses slain"))+cell(st.exped,tx("expeditions done"))
      +`<div class="sc wide"><b>${kz.join(" / ")}</b><span>${tx("kills by region ({list})",{list:ZONES.map(z=>zn[z[0]].split(" ").pop()).join(" / ")})}</span></div>`
      +`<div class="sc wide"><b>${heat}</b><span>${tx("highest Heat cleared")}</span></div>`)
    +grp(tx("Forge"),cell(st.forged,tx("items forged"))+cell(S.journal.length,tx("recipes found"))+cell(st.legend,tx("legendaries forged"))+cell(st.mishaps,tx("mishaps"))+cell(st.fizzles,tx("fizzles"))+cell(st.salvaged,tx("items salvaged"))+cell(st.refined,tx("grades upgraded")))
    +grp(tx("Economy"),cell(sn(st.earned),tx("embers earned"))+cell(sn(st.spent),tx("embers spent"))+cell(S.embers,tx("embers now")))
    +`<p class="label">${tx("Records")}</p><ul class="rec2">${fast}<li><span>${tx("Dailies played / won")}</span><b>${st.dailies} / ${st.dailyWins}</b></li><li><span>${tx("Best daily")}</span><b>${st.dBest?dailyResult(st.dBest):tx("none yet")}</b></li></ul>`;
}
function renderAfx(){ // the Codex list of affixes: an entry opens when you first meet an enemy that carries it
  const ids=Object.keys(AFX),n=ids.filter(a=>(S.afx[a]||{}).s>0).length;
  $("aflabel").innerHTML=`${ic("elite","s")} ${tx("Affixes")} · ${n}/${ids.length}${helpBtn(tx("Affixes"),tx("Magic enemies carry one affix, rare ones two (three from Heat 4). Each affix changes how the fight plays and drops its own essence when you win, better grades than usual (a rare more reliably than a magic one)."),tx("Meet an enemy that carries an affix to record it here."))}`;
  const row=a=>{const o=S.afx[a],A=AFX[a];return `<li class="af" style="--ac:${afxCol(a)}"><span class="afi">${afxIc(a)}</span><div><b>${tx(A.n)}</b><small>${tx("met {s}, beaten {b}",{s:o.s,b:o.b})}</small><p>${A.d()}</p><p class="drop">${traitIc(A.tr,"s")} ${tx("{trait} Essence",{trait:trn(A.tr)})}</p></div></li>`},
    lock=ids.filter(a=>!(S.afx[a]&&S.afx[a].s>0));
  $("aflist").innerHTML=`${n?`<ul class="afl">${ids.filter(a=>!lock.includes(a)).map(row).join("")}</ul>`:""}${lock.length?`<div class="chips aflock">${lock.map(()=>`<span class="chip unk" ${tt(tx("Unknown affix"),tx("Meet a magic or rare enemy that carries it."))}>${ic("lock","s")}<b>???</b></span>`).join("")}</div>`:""}`}
function renderGuide(){ // every unlocked intro, to read again; what is still locked sits in a collapsed list
  const op=UNLOCKS.filter(u=>u.i&&S.unl[u.id]),shut=UNLOCKS.filter(u=>u.txt&&!S.unl[u.id]),pt=u=>!u.i.ctx&&u.i.sel&&!/^\.tl/.test(u.i.sel); // Show me only where there is something to point at
  $("gdlabel").innerHTML=`${ic("list","s")} ${tx("Guide")} · ${op.length}/${UNLOCKS.filter(u=>u.i).length}${helpBtn(tx("Guide"),tx("Every introduction you have unlocked, to read again."),tx("New systems open as you play. The locked ones say how to open them."))}`;
  $("gdlist").innerHTML=`<div class="gdl">${op.map(u=>`<details class="gd"><summary><span class="gi">${ic(u.ic,"s")}</span>${tx(u.i.t)}${S.seen["i:"+u.id]?"":` <b class="rdy">${tx("new")}</b>`}</summary><div class="gdb">${u.i.l.map(x=>`<p>${tx(x,u.i.v)}</p>`).join("")}${pt(u)?`<button class="btn sm" data-guide="${u.id}">${ic("hero","s")} ${tx("Show me")}</button>`:""}</div></details>`).join("")}</div>${shut.length?`<details class="gd lockd"><summary><span class="gi">${ic("lock","s")}</span>${tx("Still locked · {n}",{n:shut.length})}</summary><div class="gdl">${shut.map(u=>lockRow(u.id)).join("")}</div></details>`:""}`;
}
function renderCodex(){
  document.querySelectorAll("[data-unl]").forEach(e=>e.hidden=!isUnl(e.dataset.unl)); // How to play: only what is open
  renderGuide();$("stp").hidden=!isUnl("stats");$("afp").hidden=!isUnl("afx");
  if(isUnl("stats"))renderStats();if(isUnl("afx"))renderAfx();
  const ids=Object.keys(ENEMIES),seenN=ids.filter(id=>S.seen[id]).length,mast=ids.filter(id=>S.seen[id]&&know(id).mastered).length;
  $("cxlabel").innerHTML=`${ic("codex","s")} ${tx("Creature codex")} · ${seenN}/${ids.length}${mast?` · ${ic("renown","xs")}${mast}`:""}${helpBtn(tx("Creature codex"),tx("{a} of {b} met, {m} mastered.",{a:seenN,b:ids.length,m:mast}),tx("Fight, study and hunt creatures to fill in their pages. A fully known creature takes 15% more damage from you."),tx("Tap one to open its page."))}`;
  const groups=[...ZONES.map(z=>[z[0],tx(z[1])]),["any",tx("Anywhere")]];
  $("cxlist").innerHTML=groups.map(([z,zn])=>`<p class="zonehead">${zn}</p><div class="cxg">`+Object.entries(ENEMIES).filter(([,e])=>e.zone===z).map(([id,E])=>{
    const seen=S.seen[id],k=know(id),pct=Math.round(k.pct*100),tp=tt(seen?tx(E.name):tx("Unknown creature"),seen?(E.boss?tx("Boss.")+" ":"")+tx("Defeated {n}",{n:S.kills[id]||0}):tx("Not yet encountered"),seen?(k.mastered?tx("Mastered: you deal 15% more damage."):tx("Knowledge {a}/{b} ({p}%)",{a:k.have,b:k.tot,p:pct})):"");
    const bd=`${seen&&E.boss?`<span class="sq-w cb" aria-hidden="true">${ic("boss","xs")}</span>`:""}${seen?`<span class="sq-p${k.mastered?" m":""}">${k.mastered?ic("renown","xs"):pct+"%"}</span>`:""}`;
    return seen?`<button class="cxt${k.mastered?" mst":""}" data-codex="${id}" aria-label="${esc(tx(E.name)+(E.boss?", "+lc(tx("Boss")):"")+". "+(k.mastered?tx("Mastered"):tx("Knowledge {p}%",{p:pct}))+". "+tx("Open its page."))}" ${tp}>${portrait(id)}${bd}</button>`
      :`<span class="cxt sil" ${tp}>${portrait(id)}</span>`}).join("")+`</div>`).join("");
}
let lastIntro=null;
function render(fresh){
  const motion=captureMotion();
  if(checkUnl())save();
  renderHeader();renderNav();renderGoal();renderIntro();
  if(S.view==="battle")renderBattle();
  if(S.view==="gear")renderGear();
  if(S.view==="forge"){renderBench();renderUpgrade();renderSkills();renderResult(fresh)}
  renderSatchels();
  if(S.view==="recipes")renderRecipes();
  if(S.view==="codex")renderCodex();
  if(sheet.mode==="item"&&sheet.id)openSheet(sheet.id,true,sheet.preview);else if(sheet.mode==="codex")openCodex(sheet.id,true);
  animateRender(motion);flushFx();syncMusic();
  applyNudge();placeIntro();const cur=curIntro(inBattle());if(cur&&cur.id!==lastIntro)nudge(cur.sel);lastIntro=cur?cur.id:null; // a new card pulses what it points at
}
