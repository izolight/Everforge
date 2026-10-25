// ================= SMALL RENDER HELPERS =================
const chips=(tr,full)=>topTraits(tr).map(([t,v])=>`<span class="chip tc" style="color:${tColor(t)}" ${tt(`${t} ${v}`,`${cap(TRAITS[t].f)} trait`)}>${famIc(TRAITS[t].f,"s")}${full?`${t} `:""}<b>${v}</b></span>`).join(""); // icon + number; full adds the name (item sheet)
const statLine=st=>Object.entries(STAT_NAMES).filter(([k])=>st[k]).map(([k,l])=>`${l} ${st[k]>0?"+":""}${st[k]}`).join(" · ");
const famChip=(f,pre)=>`<span class="chip fam" style="color:${FAM[f]}">${pre?pre+" ":""}${f}</span>`;
const unkChip=t=>`<span class="chip unk">${t}</span>`;
const nameHtml=it=>`<span style="color:${rarity(it)[1]}">${it.name}</span>`;
function delta(a,b){const d=a-b;if(!d)return `<em class="d same">±0</em>`;return `<em class="d ${d>0?"up":"down"}">${d>0?"▲":"▼"}${Math.abs(d)}</em>`}
const shown=it=>{const s=statsOf(it);return grp(it)==="consumable"?{...s,heal:medHeal(it)}:s}; // consumables show the heal they really restore
function statGrid(st,cmp,full){ // icon + number per stat (full adds the word); with cmp, a delta against the other item
  const h=Object.entries(STAT_NAMES).filter(([k])=>st[k]!==0||(cmp&&cmp[k]!==0))
    .map(([k,l])=>{const d=cmp?st[k]-cmp[k]:0;return `<div class="stat" ${tt(`${l} ${st[k]>0?"+":""}${st[k]}`,cmp?(d?`${d>0?"+":""}${d} against the comparison`:"Same as the comparison"):"")}>${stIc(k,"s")}${full?`<span>${l}</span>`:""}<b class="${st[k]<0?"neg":""}">${st[k]>0?"+":""}${st[k]}</b>${cmp?delta(st[k],cmp[k]):""}</div>`}).join("");
  return h?`<div class="stats">${h}</div>`:"";
}
function cmpBlock(it,other,label){ // one row: vs <name>, % verdict, power before -> after
  const a=power(it),b=power(other),pct=b?Math.round((a-b)/Math.abs(b)*100):0,cls=a>b?"up":a<b?"down":"same";
  const word=a>b?`${pct}% stronger`:a<b?`${Math.abs(pct)}% weaker`:"About the same";
  return `<div class="cmp" ${tt(`${label} ${other.name}`,word,`Power ${b} → ${a}`)}><span class="cn">${label==="Versus equipped"?ic("equip","s"):"vs"} ${nameHtml(other)}</span><span class="verdict ${cls}">${a>b?"▲":a<b?"▼":"="}${Math.abs(pct)}%</span><span class="pw">PWR ${b}→${a}</span></div>`;
}
function hpBar(cur,max,cls){const p=Math.max(0,cur)/max;return `<div class="bar ${cls||(p<.3?"low":"")}"><i style="width:${p*100}%"></i></div>`}
const gcol=id=>S.items[id].grade?GRADES[S.items[id].grade-1][1]:"var(--accent)";
const lootChips=ids=>ids.map(id=>{const it=S.items[id];return `<button class="sq" style="${rcol(it)}" data-item="${id}" aria-label="${it.name}. ${itemAria(it)}" ${itemTip(it)}>${glyph(it)}</button>`}).join(""); // loot as small item squares

const shopRow=(id,label,c,off)=>`<div class="shoprow"><button class="chip" data-item="${id}" style="color:${gcol(id)}">${S.items[id].name}</button><button class="btn sm" data-choice="${c}" ${off?"disabled":""}>${label}</button></div>`;
const shopHtml=ev=>`<div class="shop"><p class="label">For sale · you have ${S.embers} embers</p>${ev.stock.map((e,i)=>e.done?"":shopRow(e.id,`${icon("ember")}${e.price}`,`buy:${i}`,S.embers<e.price)).join("")}
  ${ev.sells.some(e=>!e.done)?`<p class="label">Sell a spare</p>${ev.sells.map((e,i)=>e.done?"":shopRow(e.id,`Sell +${e.price}`,`sell:${i}`)).join("")}`:""}</div>`;
const topT=id=>topTraits(S.items[baseIdOf(id)].traits)[0][0];
function renderUpgrade(){
  $("upgp").hidden=!isUnl("upgrade");if(!isUnl("upgrade"))return;
  const lv=skLv("alchemy"),ids=upgradable().sort((a,b)=>topT(a).localeCompare(topT(b))||S.items[baseIdOf(a)].name.localeCompare(S.items[baseIdOf(b)].name)||gradeOf(a)-gradeOf(b));
  $("upgsum").innerHTML=`${ic("upgrade","s")} Upgrade grades${ids.length?` <b class="rdy">${ids.length}</b>`:""}${helpBtn("Upgrade grades",`${UP.n} essences or materials of one grade and some embers make 1 of the next grade (Faint, Lesser, Plain, Greater, Pure): stronger traits, in a single crucible slot.`,"A miss costs the embers and one of them.",`Greater needs Alchemy Lv ${GRADE_LV[3]}, Pure Lv ${GRADE_LV[4]}. You are Lv ${lv}.`)}`;
  $("upgrows").innerHTML=ids.length?ids.map(id=>{const g=gradeOf(id),tg=g+1,it=S.items[id],low=lv<GRADE_LV[tg-1],poor=S.embers<UP.emb[g-1];
    return `<div class="shoprow up">${glyph(it)}<span class="uname"><span style="color:${GRADES[g-1][1]}">${it.name}</span> <small>×${avail(id)}</small></span>
      <button class="btn sm" data-upgrade="${id}" ${inBattle()||low||poor?"disabled":""} aria-label="Upgrade ${it.name} to ${GRADES[tg-1][0]}" ${tt(`${it.name} → ${GRADES[tg-1][0]}`,low?`Needs Alchemy Lv ${GRADE_LV[tg-1]}`:`${UP.n} of them and ${UP.emb[g-1]} embers make 1. ${upChance(tg)}% to succeed.`)}>${low?`${ic("lock","s")} Lv ${GRADE_LV[tg-1]}`:`${icon("ember")}${UP.emb[g-1]} · ${GRADES[tg-1][0]} · ${upChance(tg)}%`}</button></div>`}).join(""):`<p class="foot">Collect ${UP.n} of the same grade of an essence, ore, hide or herb to upgrade them.</p>`;
}
// ================= RENDER =================
let forgeArmed="",freshShown=new Set(),logOpen=false,heatOpen=false,legendOpen=false;
function renderHeader(){
  const l=level(),cur=XP_LV[l-1],nxt=XP_LV[l];clampHp();
  const lt=`Smith Lv ${l}\n${nxt?`${S.xp-cur}/${nxt-cur} XP to Lv ${l+1}.`:"Highest level reached."}${LV_PERK[l]?` ${LV_PERK[l]}`:""}\nSmith XP comes from forging and unlocks crucible slots, trait slots and appraisal.`;
  $("lvl").innerHTML=`${ic("smith","l")}<b>${l}</b>`;$("lvl").dataset.tip=lt;$("xpbar").parentNode.dataset.tip=lt;
  $("xpbar").style.width=nxt?`${Math.min(100,(S.xp-cur)/(nxt-cur)*100)}%`:"100%";
  $("emb").hidden=!isUnl("peddler");$("emb").innerHTML=`${icon("ember")}${S.embers}`;$("emb").dataset.tip="Embers\nThe currency of the forge. Fights, salvage and selling earn it; the peddler, grade upgrades and reforging spend it.";
  $("rp").hidden=!isUnl("research");$("rp").innerHTML=`${ic("research")}${S.rp}`;$("rp").dataset.tip=`Research points\nEarned by discoveries: a first craft of each kind, a new reaction, a new essence, a studied creature, a boss down. Spend them in the Forge on techniques.\nYou have ${S.rp}.`;
  $("disc").innerHTML=`<span class="mi" ${tt("Renown","Battles you have won.")}>${ic("renown")}${S.wins}</span><span class="mi" ${tt("Recipes forged","Different things you have forged. Each is saved in the Recipes tab.")}>${ic("hammer")}${S.journal.length}</span>`;
}
function renderNav(){
  $("nav").innerHTML=VIEWS.map(v=>{
    let badge="";
    if(v==="battle"&&inBattle()&&S.view!=="battle")badge='<i class="badge-dot pulse" aria-label="battle in progress"></i>';
    if(v==="gear"&&S.fresh.length&&S.view!=="gear"&&S.view!=="forge")badge=`<i class="badge-dot" aria-label="${S.fresh.length} new items">${S.fresh.length}</i>`;
    if(!badge&&S.view!==v&&!inBattle()&&pendingIntros().some(c=>c.ctx!=="battle"&&c.tab===v))badge='<i class="badge-dot pulse" aria-label="new introduction"></i>';
    return `<button data-view="${v}" aria-current="${S.view===v?"page":"false"}">${icon(v)}<span>${cap(v)}</span>${badge}</button>`}).join("");
  VIEWS.forEach(v=>$("v-"+v).hidden=S.view!==v);
}
function renderGoal(){
  const g=goal(),el=$("goal"),st=g.step.replace(/^Step (\d+) of (\d+)/,"$1/$2");
  el.hidden=inBattle();
  el.className="goal"+(g.done?" done":"");
  el.innerHTML=`<div class="gt" ${tt(g.step+(g.prog?` · ${g.prog}`:""),g.text,g.done?`Reward: ${rewardText(g.reward)}`:"")}><small>${st}</small> ${g.text}${g.prog?` <em>${g.prog}</em>`:""}</div>
    ${g.done?`<button class="btn primary sm" id="claim">Claim</button>`:S.view!==g.tab?`<button class="btn sm" id="goGoal">Go to ${cap(g.tab)}</button>`:""}`;
}
const itemLines=it=>[it.name,`${rarity(it)[0]} · ${labelOf(it)}${isGear(it)?` · PWR ${power(it)}`:""}`,statLine(shown(it)),topTraits(it.traits).slice(0,4).map(([t,v])=>`${t} ${v}`).join(", ")];
const itemTip=(it,...x)=>tt(...itemLines(it),...x),itemAria=it=>esc(itemLines(it).slice(1).filter(Boolean).join(". ")); // the tip text also goes in aria-label, for screen readers
const ROMAN=["","I","II","III","IV","V"];
const rcol=it=>`--rc:${rarity(it)[1]}${it.grade?`;--gc:${GRADES[it.grade-1][1]}`:""}`; // rarity stripe + grade frame colours
function renderGear(){
  const P=pstats();P.floor=atFloor(P);
  $("ghp").className="bar"+(S.hp/P.maxHp<.3?" low":"");$("ghp").firstElementChild.style.width=`${S.hp/P.maxHp*100}%`;$("ghptxt").textContent=`${S.hp}/${P.maxHp}`;
  $("gear").innerHTML=SLOTS.map(([s,l])=>{const it=gearOf(s);
    return `<button class="sq gs${it?"":" none"}${it&&it.legendary?" legend":""}${it&&it.grade?" gr":""}"${it?` style="${rcol(it)}"`:""} data-gear="${s}" aria-label="${l}: ${it?`${it.name}. ${itemAria(it)}`:"empty"}" ${it?itemTip(it,l):tt(l,s==="main"?"Bare fists. Tap to choose a weapon.":"Empty. Tap to choose an item for it.")}>${glyph(it,SLOT_GLYPH[s])}</button>`}).join("");
  const sp=Math.min(35,P.spd*3),rd=Math.round(P.red*100);
  $("pstats").innerHTML=[["atk","Attack",P.atk,P.offW?`+${P.offPow}`:"",`Strike power of your main hand${P.offW?`. Your off hand adds a weaker second strike of ${P.offPow}`:""}.`],["mag","Magic",P.mag,"",`Counts ${MAG_W} times as much as Attack in your strikes.`],
    ["def","Defense",P.def,`${rd}%`,`Cuts the damage you take by ${rd}%, with diminishing returns.`],["spd","Speed",P.spd,"",`${sp}% chance each turn of a swift follow-up strike (up to 35%).`]]
    .map(([k,l,v,x,t])=>`<div class="ps" ${tt(`${l} ${v}`,t)}>${stIc(k)}<b>${v}</b>${x?`<small>${x}</small>`:""}</div>`).join("");
  const rc=(col,ics,val,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${val}</b></span>`;
  const cf=[...Object.entries(P.rs).map(([k,v])=>rc(FAM[k]||"var(--muted)",famIc(k,"s")+ic("resist","xs"),`${v}%`,`Resists ${cap(k)} ${v}%`,`Cuts damage from ${k} attacks.`)),
    P.ward&&rc("var(--verd)",ic("ward","s"),P.ward,`Ward ${P.ward}`,"Absorbs this much damage at the start of each battle."),
    P.thorns&&rc("var(--muted)",ic("thorns","s"),`${P.thorns}%`,`Thorns ${P.thorns}%`,"Reflects this share of damage taken back at the attacker."),
    P.dr&&rc("var(--muted)",ic("dr","s"),`-${P.dr}`,`-${P.dr} per hit`,"Stone takes this much off every hit you take."),
    P.floor&&rc("var(--down)",ic("floor","s"),`${Math.round(HIT_MIN*100)}%`,`Hits at floor (${Math.round(HIT_MIN*100)}%)`,"Defense, resists and Stone together can't cut a hit below this share of its raw damage. More armor won't help against it."),
    P.dodge&&rc(FAM.swift,famIc("swift","s"),`${P.dodge}%`,`Dodge ${P.dodge}%`,"Chance to dodge a hit."),
    P.root&&rc(FAM.wood,ic("root","s"),`+${P.root}`,`Roots +${P.root}`,"HP healed each turn while you are below half health."),
    P.cleanse&&rc(FAM.heal,ic("cleanse","s"),`${Math.round(Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER))}%`,`Cleanse ${Math.round(Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER))}%`,"Chance each turn to shake off a status (burn, chill, poison, curse).")].filter(Boolean);
  $("cfx").innerHTML=cf.join("");
  const iu=isUnl("infuse");$("inf").hidden=$("infbtns").hidden=!iu;
  if(!iu){$("inflabel").innerHTML=lockRow("infuse");return}
  const inf=Object.entries(S.infuse),can=infusable(),R=["I","II","III"];
  $("inflabel").innerHTML=`<p class="label">${ic("infuse","s")} Infusions · ${inf.length}/${infSlots()}</p>${helpBtn("Infusions",`Essences worth ${INF_COST} plain ones (a Greater counts as 3, a Pure as 9, a Lesser as ⅓) infuse a trait into you; as many again deepen it, up to III. Infused traits act as if they were on your weapon.`,can.length?"":inf.length>=infSlots()?"All slots used. You can still deepen an infusion with more of its essence.":`Collect essences of one trait worth ${INF_COST} plain ones (salvage, elites, bounties) to infuse it.`)}`;
  $("inf").innerHTML=Array.from({length:infSlots()},(_,k)=>{const e=inf[k];if(!e)return `<div class="islot" ${tt("Empty infusion slot",`Collect ${INF_COST} plain essences of one kind to fill it.`)}>${ic("plus","l")}</div>`;
    const [t,r]=e,st=innateStats(t),bits=Object.entries(st).filter(([,v])=>v);
    return `<div class="islot on" style="border-color:${tColor(t)};color:${tColor(t)}" ${tt(`${t} ${R[r-1]}`,bits.map(([s,v])=>`${v>0?"+":""}${v} ${STAT_NAMES[s]}`).join(", ")||"Effect on hit",`Rank ${r} of ${INF_MAX}`)}>${famIc(TRAITS[t].f,"l")}<b>${t} ${R[r-1]}</b><span class="ib">${bits.map(([s,v])=>`<span>${stIc(s,"xs")}${v>0?"+":""}${v}</span>`).join("")||"<span>on hit</span>"}</span></div>`}).join("");
  const cr=S.infCredit?`<p class="foot" style="flex-basis:100%">Credit: ${creditTxt(S.infCredit)} plain, spent first on your next infusion.</p>`:"";
  $("infbtns").innerHTML=can.map(t=>`<button class="btn sm" data-infuse="${t}" style="border-color:${tColor(t)}">${famIc(TRAITS[t].f,"s")} ${S.infuse[t]?`Deepen ${t} → ${R[S.infuse[t]]}`:`Infuse ${t}`} · ${payText(infPay(t,Math.max(0,INF_NEED-S.infCredit)))||"credit"}</button>`).join("")+cr;
}
const lockAct=id=>`<button class="btn act lk" id="${id}" aria-disabled="true" data-tap aria-label="${UNL[id].name}, locked. ${esc(UNL[id].txt)}" ${tt(`${UNL[id].name} (locked)`,UNL[id].txt)}>${ic("lock")}<span>${UNL[id].name}</span></button>`; // an action-grid button that is not open yet
const introIn=c=>`<span class="ii" aria-hidden="true">${ic(c.ic,"l")}</span><div class="it"><b>${c.t}</b>${c.l.map(x=>`<p>${x}</p>`).join("")}</div><button class="btn sm" id="introOk" data-intro="${c.id}">Got it</button>`; // a one-time intro card (non-modal; Got it marks it read)
const introHtml=c=>c?`<div class="intro">${introIn(c)}</div>`:"";
function renderIntro(){const el=$("intro"),c=inBattle()?null:curIntro(false),id=c?c.id:"";el.hidden=!c;el.className="intro"+(S.view==="battle"?" fl":"");
  if(el.dataset.cid!==id){el.dataset.cid=id;el.innerHTML=c?introIn(c):""} // rewritten only when the card changes, so the live region does not announce it again
  placeIntro()}
function placeIntro(){ // the floating card sits under the goal bar (so Claim stays tappable) and moves to the bottom if it would cover you on the map
  const el=$("intro");el.style.top=el.style.bottom="";if(el.hidden||!el.classList.contains("fl"))return;
  const g=$("goal");el.style.top=Math.max(8,g.hidden?0:g.getBoundingClientRect().bottom+6)+"px";
  const h=document.querySelector(".tl.here");if(h){const a=el.getBoundingClientRect(),b=h.getBoundingClientRect();if(a.bottom>b.top&&a.top<b.bottom&&a.right>b.left&&a.left<b.right){el.style.top="auto";el.style.bottom=$("nav").offsetHeight+8+"px"}}} // the card at the top of a tab; over the map it floats, so the map never shifts (a fight shows its own above the action grid)
const ci=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${t.length?tt(...t):""}>${ics}${v==null||v===""?"":`<b>${v}</b>`}</span>`; // icon chip: icon + value, words in the tip
const stChip=(s,x)=>ci(FAM[STATUS[s].el]||"var(--bad)",famIc(STATUS[s].el,"s"),`${x.n>1?x.n+"x ":""}${x.t}t`,`${STATUS[s].n}${x.n>1?` x${x.n}`:""}, ${x.t} turns left`,cap(STATUS[s].tip)+".");
function youHud(){ // compact: weapon, HP bar, then icon chips (words in tips)
  const P=pstats(),B=S.battle,live=B&&!B.over,bite=live&&B.heat>=5,red=Math.round((bite?redOf(P.def*(1-HEAT_T.bite)):P.red)*100);
  const c=[ci("var(--fg)",stIc("atk","s"),P.atk,`Attack ${P.atk}`,"Strike power of your main hand."),
    ci("var(--fg)",stIc("def","s"),`${red}%`,`Defense ${P.def}`,`Cuts the damage you take by ${red}%.${bite?` Heat 5 bites through ${Math.round(HEAT_T.bite*100)}% of your Defense.`:""}`),
    P.regen&&ci("var(--up)",stIc("heal","s"),`+${P.regen}`,`Regen +${P.regen}`,"HP you mend each turn."),
    ...Object.entries(S.infuse).map(([t,r])=>ci(tColor(t),famIc(TRAITS[t].f,"s"),["I","II","III"][r-1],`Infused ${t} ${["I","II","III"][r-1]}`,"Acts as if it were on your weapon.")),
    live&&B.guard&&ci("var(--verd)",ic("guard","s"),"","Guarding","Your next hit taken is cut by 60%."),
    live&&B.off>0&&ci("var(--down)",ic("warn","s"),"","Off balance","A mistimed parry cost you your guard."),
    live&&P.rs[B.el]&&ci(FAM[B.el],famIc(B.el,"s")+ic("resist","xs"),`${P.rs[B.el]}%`,`Resists ${cap(B.el)} ${P.rs[B.el]}%`,`Cuts damage from ${B.el} attacks.`),
    live&&B.ward>0&&ci("var(--verd)",ic("ward","s"),B.ward,`Ward ${B.ward}`,"Absorbs this much damage."),
    ...(live?Object.entries(B.you||{}).map(([s,x])=>stChip(s,x)):[])].filter(Boolean).join("");
  return `<div class="you" id="youHud"><span class="yg" ${tt("You",P.main?P.main.name:"Bare fists")}>${glyph(P.main,"fists")}</span><div class="hpline" ${tt(`HP ${S.hp}/${P.maxHp}`)}>${hpBar(S.hp,P.maxHp)}<span class="hpnum">${S.hp}<small>/${P.maxHp}</small></span></div><div class="chips">${c}</div></div>`;
}
function foeStage(B){
  const E=ENEMIES[B.id],K=cx(B.id),kn=know(B.id),live=afxOn(B),RC=RARITIES[rarOf(B)],et=elTr(B),eliteF=et?TRAITS[et].f:null;
  const kw=B.weak.filter(f=>K.weak.includes(f)),kr=B.resist.filter(f=>K.resist.includes(f)||f===eliteF);
  const F=foeOf(B),unknown=F.weak.filter(f=>!K.weak.includes(f)).length+F.resist.filter(f=>!K.resist.includes(f)).length;
  const st=[B.burn&&ci(FAM.fire,famIc("fire","s"),B.burn.d,`Burning ${B.burn.d}`,`Takes ${B.burn.d} damage each turn.`),B.poison&&ci(FAM.poison,famIc("poison","s"),B.poison,`Poison ${B.poison}`,`Takes ${B.poison} damage each turn.`),B.frozen&&ci(FAM.ice,famIc("ice","s"),"","Frozen","It loses its next turn."),B.bleed&&ci("var(--bad)",ic("rend","s"),B.bleed.d*B.bleed.n,`Bleed ${B.bleed.d*B.bleed.n}`,"Damage each turn that ignores armor.")].filter(Boolean).join("");
  const winding=!B.over&&!B.frozen&&isSpecial(B)&&F.sp.kind!=="heal";
  const cls=`portrait${B.over==="won"?" down":""}${winding?" winding":""}`;
  const bd=[E.boss&&ci("var(--accent)",ic("boss","s"),"","Boss","Beat it to open the next region."),B.phased&&ci("var(--bad)",ic("warn","s"),"",E.phase.label,"Its second form."),RC&&ci(RC.col,ic("elite","s"),"",RC.name,`${live.length} affix${live.length>1?"es":""}. Up to ${RC.hp}x HP and ${RC.atk}x Attack before the affixes' own changes.`,`Each affix drops its linked essence, ${gsTxt(RC.gs)} than usual.`),
    B.heat?ci("var(--ember)",ic("heat","s"),B.heat,`Heat ${B.heat}`,HEAT[B.heat-1].name):"",kn.mastered&&ci("var(--verd)",ic("renown","s"),"","Mastered","You deal 15% more damage to it.")].filter(Boolean).join("");
  return `<div class="stage${RC?" rar":""}" id="enemyHud" style="--el:${FAM[B.el]}${RC?`;--rc:${RC.col}`:""}">
    <button class="${cls}" id="foeArt" data-codex="${B.id}" aria-label="${fullName(B)}${RC?`, ${RC.name.toLowerCase()}, ${live.map(a=>AFX[a].n).join(", ")}`:""}. Open codex entry">${portrait(B.id,{el:B.el,aura:RC&&RC.col,rare:rarOf(B)==="rare",frozen:B.frozen,burn:!!B.burn&&!B.over,poison:B.poison>0&&!B.over,phased:B.phased})}</button>
    <div class="foeinfo"><div class="fname"><span class="fn"${RC?` style="color:${RC.col}"`:""}>${B.name}</span>${B.title&&!B.split?`<span class="ti" style="color:${RC.col}">the ${B.title}</span>`:""}<span class="bd">${bd}</span></div>
      <div class="hpline">${hpBar(B.hp,B.max,"foe")}<span class="hpnum">${Math.max(0,B.hp)}<small>/${B.max}</small></span></div>
      ${live.length?`<div class="chips afx">${live.map(a=>afxChip(a,B)).join("")}</div>`:""}
      <div class="chips">${kw.map(f=>ci(FAM[f],ic("weak","s")+famIc(f,"s"),"",`Weak to ${cap(f)}`,"Takes 50% more from it.")).join("")}${kr.map(f=>ci(FAM[f],ic("resist","s")+famIc(f,"s"),"",`Resists ${cap(f)}`,"Takes 40% less from it.")).join("")}${unknown>0?`<span class="chip unk" ${tt(`${unknown} unknown`,"Weaknesses and resistances you have not found yet. Hit it, or Study.")}><b>?</b>${unknown}</span>`:""}${st}</div></div></div>`;
}
function logBlock(B){
  const last=B.log.slice(-2).map(l=>`<span class="ll ${l.c}">${l.t}</span>`).join("");
  return `<details class="logd" id="logd"${logOpen?" open":""}><summary>${last}<span class="more">${ic("list","s")}</span></summary><ul class="blog" id="blog">${B.log.map(l=>`<li class="ll ${l.c}">${l.t}</li>`).join("")}</ul></details>`;
}
// Camp rest: one icon button with the charge count (the text is in its tip)
function campBtn(){
  const P=pstats(),m=curMap(),low=S.hp/P.maxHp<.35,no=twistNow()==="nocamp",on=!no&&S.camp>0&&(S.hp<P.maxHp||(!m.cleared&&m.torch<m.tmax));
  const tp=no?tt("No campfires","This expedition has none."):tt(`Rest at campfire, ${S.camp} left`,`Heals 50% and adds ${TORCH.rest} torch. Next charge in ${3-S.campProg} win${3-S.campProg===1?"":"s"}${S.camp>=3?" (pouch full)":""}.`,low?"You're badly hurt. Eat something or rest before your next fight.":"");
  return `<button class="ibt${low&&on?" warn":""}" id="rest" ${on?"":`aria-disabled="true" data-tap`} aria-label="Rest at campfire, ${S.camp} left${on?"":no?". No campfires here":S.camp?". Nothing to heal or relight":". No charges left"}" ${tp}>${ic("camp")}<i class="cdb">${no?"-":S.camp}</i></button>`;
}
// Status strip above the map: HP and stats, torch, daily / heat badges, camp, abandon and one "?" with the map rules and every modifier
function mapHead(){
  const m=curMap(),dl=S.run==="daily",d=S.daily,h=m.heat||0,hz=heatOf(S.zone),P=pstats(),zi=zoneIdx(S.zone);
  const tp=Math.round(100*m.torch/m.tmax),out=m.torch<=0&&!m.cleared,tc=out?" out":m.torch<=TORCH.max/6?" low":"";
  const torch=m.cleared?"":`<span class="torchb${tc}" ${tt(`Torch ${m.torch} of ${m.tmax}`,out?"Your torch has guttered out. You see only one tile around you, and every step risks an ambush. A camp or shrine will relight it. Hunters notice you from 6 steps away instead of 4.":"Every step burns it. Camps, shrine prayers and campfire rests relight it. At 0 you see one tile and risk ambushes.")}>${icon("torch")}<span class="tbar"><i style="width:${tp}%"></i></span><b>${m.torch}</b></span>`;
  const mods=[...dl?[`${DAILY_TWISTS[d.twist].name}: ${DAILY_TWISTS[d.twist].desc}`]:[],...HEAT.slice(0,h).map((x,i)=>`Heat ${i+1}, ${x.name}: ${x.desc}`)];
  const help=helpBtn(zoneName(S.zone),m.cleared?"Cleared. Explore a fresh map for more loot.":`${m.steps?"Tap a glowing tile next to you to step.":"Tap a glowing tile next to you to set out."} ${shortName(ZONES[zi][2])} waits in the lair at the top. Every step burns your torch${isUnl("roam")?", and some creatures roam and hunt you":""}.`,dl?`Daily expedition, ${d.date}${d.date!==today()?" (still going from an earlier day)":""}, ${d.turns} turns so far.`:"",...mods);
  const badges=(dl?`<span class="heat daily" ${tt("Daily expedition",DAILY_TWISTS[d.twist].name,DAILY_TWISTS[d.twist].desc)}>${ic("daily","s")}</span>`:"")
    +(dl||!hz.max||!isUnl("heat")?(h?`<span class="heat" ${tt(`Heat ${h}`,...HEAT.slice(0,h).map(x=>x.name))}>${ic("heat","s")}${h}</span>`:""):`<button class="heat hb" id="heatBtn" aria-expanded="${heatOpen}" aria-label="Heat: this map ${h?h:"Normal"}, next expedition ${hz.sel||"Normal"}" ${tt(`Heat ${h||"Normal"}`,h?HEAT[h-1].name:"Normal difficulty.","Tap to choose the Heat of new expeditions.")}>${ic("heat","s")}${h}${hz.sel!==h&&!m.cleared?`<small>›${hz.sel}</small>`:""}</button>`);
  const amb=m.amb?`<span class="heat amb" ${tt("Ambush","A whistle sounds behind you. If your next stop is a fight, it starts with an ambush.")}>${ic("warn","s")}</span>`:"";
  const ab=dl?`<button class="ibt${dArmed?" warn":""}" id="dailyAbandon" aria-label="${dArmed?"Tap again to abandon":"Abandon the daily"}" ${tt(dArmed?"Tap again to abandon":"Abandon the daily",dArmed?"No retry today.":"Tap twice. You get no retry today.")}>${ic(dArmed?"warn":"close")}</button>`:"";
  const sel=!dl&&hz.max&&isUnl("heat")&&heatOpen?`<div class="hpanel"><div class="hsel" role="group" aria-label="Heat for new expeditions">${Array.from({length:hz.max+1},(_,n)=>`<button class="hchip" data-heat="${n}" aria-pressed="${hz.sel===n}" aria-label="${n?"Heat "+n:"Normal"}" ${n?tt(HEAT[n-1].name,HEAT[n-1].desc):tt("Normal","Normal difficulty.")}>${n?ic("heat","s")+n:"0"}</button>`).join("")}</div>
    <p class="foot">${hz.sel?`Heat ${hz.sel}, ${HEAT[hz.sel-1].name}: ${HEAT[hz.sel-1].desc} In all: ${heatTot(hz.sel)}.`:"New expeditions: normal difficulty."}${hz.sel!==h&&!m.cleared?` This map is Heat ${h}; the choice applies to your next expedition here.`:""}</p></div>`:"";
  return `<div class="mhead"><div class="mr"><span class="yg" ${tt("You",P.main?P.main.name:"Bare fists")}>${glyph(P.main,"fists")}</span><div class="hpline" id="youHud" ${tt(`HP ${S.hp}/${P.maxHp}`)}>${hpBar(S.hp,P.maxHp)}<span class="hpnum">${S.hp}<small>/${P.maxHp}</small></span></div>
    ${ci("var(--fg)",stIc("atk","s"),P.atk,`Attack ${P.atk}`,"Strike power of your main hand.")}${ci("var(--fg)",stIc("def","s"),`${Math.round(P.red*100)}%`,`Defense ${P.def}`,`Cuts the damage you take by ${Math.round(P.red*100)}%.`)}</div>
    <div class="mr">${torch}${amb}${badges}${campBtn()}${ab}${help}</div>${sel}<p class="mnow${m.ls===m.steps&&m.steps?" mnew":""}">${(m.log||[]).slice(-1)[0]||"Tap a glowing tile next to you to set out."}</p></div>`;
}
function dailyCard(){
  if(S.run==="daily")return "";
  if(!dailyReady())return isUnl("heat")?`<div class="dcard">${lockRow("daily")}</div>`:""; // a teaser once the first boss is down
  const done=dailyState()==="done",d=done?S.daily:dailyPlan(today()),tw=DAILY_TWISTS[d.twist],r=done&&d.result;
  return `<div class="dcard"><div class="dtop"><b>${ic("daily")} Daily</b><span class="dline"><span>${zoneName(d.zone)}</span><span class="heat">${ic("heat","s")}${d.heat}</span><span class="heat daily" ${tt(tw.name,tw.desc)}>${tw.name}</span></span>${helpBtn("Daily expedition",`${d.date} UTC. ${tw.desc}${!done&&d.zone!==d.want?` Today's region (${zoneName(d.want)}) isn't open to you, so you go to ${zoneName(d.zone)}.`:""}`,"One attempt a day. Everyone gets the same map, enemies and chests; fight drops and peddler offers can still differ.",`Reward for the boss: ${DAILY_REWARD.ess} essences, a rare find, ${DAILY_REWARD.xp} smith XP.`)}</div>
    ${done?`<p class="foot dres ${r.boss?"won":""}">${r.boss?"Done":"Over"}: ${dailyResult(r)}. Come back tomorrow.</p>`:`<div class="actions"><button class="btn primary sm grow" id="dailyStart">Start today's run</button></div>`}</div>`;
}
function zoneView(){ // keep the chosen region chip in view and fade the edges that hide more chips
  const z=$("zones"),p=z.querySelector('[aria-pressed="true"]');
  if(p&&z.scrollWidth>z.clientWidth)z.scrollLeft+=p.getBoundingClientRect().left-z.getBoundingClientRect().left-(z.clientWidth-p.offsetWidth)/2;
  zoneFade()}
function zoneFade(){const z=$("zones");z.dataset.l=z.scrollLeft>2?1:0;z.dataset.r=z.scrollLeft+z.clientWidth<z.scrollWidth-2?1:0}
function fitMap(){ // the grid gets the room above the tab bar, but never tiles under 36px (then the page scrolls and the hero stays in view)
  const w=document.querySelector(".mapwrap");if(!w||S.view!=="battle")return;const mp=w.firstElementChild,m=curMap(),nav=$("nav").offsetHeight;
  document.documentElement.style.setProperty("--nav",nav+"px");mp.style.setProperty("--mw","");
  const top=w.getBoundingClientRect().top+scrollY,room=innerHeight-nav-12-top;mp.style.setProperty("--mw",Math.max(Math.min(37*m.w+3,w.clientWidth-8),Math.min(440,Math.floor(room*m.w/m.h)))+"px");
}
const heroView=()=>document.querySelector(".tl.here")?.scrollIntoView({block:"nearest"});
function renderBattle(){
  $("zones").innerHTML=ZONES.map(([id,name,boss],i)=>{const open=zoneOpen(id),cleared=S.kills[boss]>0;
    return `<button class="zone" data-zone="${id}" aria-pressed="${S.zone===id}" ${open&&!busy()&&S.run!=="daily"?"":"disabled"}>${name}${cleared?" ✓":""}${open?"":` · beat ${shortName(ZONES[i-1][2])}`}</button>`}).join("");zoneView();
  const a=$("arena"),B=S.battle,cont=`<div class="actions"><button class="btn primary grow" id="cont">Back to the map</button></div>`;
  if(S.event){const ev=S.event;
    a.innerHTML=`<div class="event">${ev.icon?`<svg class="evart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G[ev.icon]}</svg>`:""}<h2>${ev.title}</h2><p class="empty">${ev.text}</p></div>
      ${ev.loot.length?`<div class="loot" style="justify-content:center">${lootChips(ev.loot)}</div>`:""}${ev.stock?shopHtml(ev):""}
      ${ev.sc?`<p class="scrl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G.scroll}</svg><span>${ev.sc}</span></p>`:""}
      ${ev.choices.length?`<div class="actions">${ev.choices.map(([c,l],i)=>`<button class="btn ${i===0?"primary":""} grow" data-choice="${c}">${l}</button>`).join("")}</div>`:cont}${youHud()}`;return}
  if(!B){
    const m=curMap(),zi=zoneIdx(S.zone),bossId=ZONES[zi][2],next=ZONES[zi+1];
    const head=m.cleared?`<div class="cleared"><b>${ic("ok")} ${ZONES[zi][1]} cleared</b>${helpBtn(`${shortName(bossId)} has fallen`,`Explore a fresh map here for more loot${next&&zoneOpen(next[0])?`, or move on to ${next[1]}`:""}.`)}
        <div class="actions"><button class="btn sm grow" id="again">New expedition</button>${next&&zoneOpen(next[0])?`<button class="btn primary sm grow" data-zone="${next[0]}">Travel to ${next[1]}</button>`:""}</div></div>`:"";
    a.innerHTML=`${mapHead()}${head}${mapHtml()}${dailyCard()}`;fitMap();heroView();return}
  const K=cx(B.id);
  let body="";
  if(!B.over){
    const P=pstats(),sp=isSpecial(B)?foeOf(B).sp:null,est=foeHit(B,P,sp?sp.x:1,1)*(sp&&sp.kind==="multi"?sp.n:1);
    const dmgTxt=K.stats?B.ward>=est?" No damage expected (ward absorbs it).":` About ${est} damage${B.ward>0?` (ward absorbs ${B.ward})`:""}.`:"";
    const pc=Math.round(PARRY_CH*100),dm=K.stats&&!(B.ward>=est)?ci("var(--down)",ic("hit","s"),`~${est}`,`About ${est} damage`,B.ward>0?`Your ward absorbs ${B.ward}.`:"Before your Guard."):K.stats?ci("var(--verd)",ic("ward","s"),"0","No damage expected","Your ward absorbs it."):"";
    const bm=hasAfx(B,"boom")&&B.hp<=B.max*AFX_T.boom.warn?ci("var(--down)",ic("a_boom","s"),`~${blastOf(B)}`,`Blast ~${blastOf(B)} when it dies`,`It is about to burst. Guard cuts the blast by ${pcn(1-AFX_T.boom.guard)}%, but only if it dies on its own turn (burn, poison, bleed). Your rune ward soaks it.`,S.hp<=blastOf(B)?"You would not survive it. Heal first.":""):"";
    const dot=(B.burn?B.burn.d:0)+(B.poison||0)+(B.bleed?B.bleed.d*B.bleed.n:0),fzc=hasAfx(B,"frenzy")&&!B.fz&&dot>0&&B.hp-dot<B.max*AFX_T.frenzy.at&&B.hp>=B.max*AFX_T.frenzy.at?ci("var(--down)",ic("a_frenzy","s"),"","It may frenzy",`Its burn, poison or bleed will take it under ${pcn(AFX_T.frenzy.at)}% HP this turn. It then hits ${pcn(AFX_T.frenzy.x-1)}% harder.`):"";
    const intent=B.frozen?`<div class="intent" ${tt("Next","Frozen. It will lose its turn.")}><b>NEXT</b>${ci(FAM.ice,famIc("ice","s"),"Frozen","Frozen","It will lose its turn.")}${bm}${fzc}</div>`
      :sp?`<div class="intent special" ${tt("Next: "+((B.phased?K.sp2:K.sp)?sp.name:"something big"),`It's ${sp.tell}.`,isUnl("parry")?sp.kind==="heal"?`Parry (${pc}%) to interrupt it.`:`${dmgTxt.trim()} Guard, or Parry (${pc}%) to turn it back!`:`${dmgTxt.trim()} Guard to soften it.`)}><b>NEXT</b><span class="in">${ic("warn","s")} ${(B.phased?K.sp2:K.sp)?sp.name:"Something big"}</span>${sp.kind==="heal"?"":dm}${isUnl("parry")?ci("var(--accent)",ic("parry","s"),`${pc}%`,`Parry ${pc}%`,"Beat a telegraphed special: negate it and riposte."):""}${bm}${fzc}</div>`
      :`<div class="intent" ${tt("Next: a normal attack",dmgTxt.trim(),"Parrying now would backfire.")}><b>NEXT</b><span class="in">${ic("attack","s")} Attack</span>${dm}${isUnl("parry")?`<span class="chip no">${ic("parry","s")}<b>no parry</b></span>`:""}${bm}${fzc}</div>`;
    const cons=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable");
    const canStudy=unknownFacts(B.id).length>0||(hasAfx(B,"elusive")&&(B.sty||0)<AFX_T.dodge.studyMax),abs=abKeys(P).filter(abOn),abBtn=k=>{const A=ABILITIES[k],c=(B.cd||{})[k]||0;return `<button class="btn act ab" data-ability="${k}" ${c>0?`aria-disabled="true" data-tap`:""} aria-label="${A.name}${c>0?`, ready in ${c} turn${c>1?"s":""}`:""}. ${esc(A.desc)}" ${tt(A.name,c>0?`Ready in ${c} turn${c>1?"s":""}.`:`Cooldown ${A.cd} turns.`,A.desc)}>${icon(A.icon)}<span>${A.name}</span>${c>0?`<i class="cdb">${c}</i>`:""}</button>`};
    body=`${intent}${youHud()}${introHtml(curIntro(true))}
      <div class="acts n${abs.length}"><button class="btn primary act" id="atk" ${tt("Attack","Strike with your main hand.")}>${icon("attack")}<span>Attack</span></button>${abs.map(abBtn).join("")}<button class="btn act" id="guard" ${tt("Guard","Take 60% less damage from the next hit.")}>${icon("guard")}<span>Guard</span></button>${isUnl("parry")?`<button class="btn act" id="parry" ${tt("Parry","Beat a telegraphed special: negate it and riposte ("+pc+"% to land). Mistimed: +25% damage and a lost guard.")}>${icon("parry")}<span>Parry</span></button>`:lockAct("parry")}
      ${isUnl("study")?`<button class="btn act" id="study" ${canStudy?"":`aria-disabled="true" data-tap`} ${tt(canStudy?"Study":"Known",canStudy?"Learn one fact about it, but it costs your turn.":"You know everything it can teach.",hasAfx(B,"elusive")?`Also lowers the dodge of an Elusive foe by ${AFX_T.dodge.study}% (${B.sty||0} of ${AFX_T.dodge.studyMax} used).`:"")}>${icon("study")}<span>${canStudy?"Study":"Known"}</span></button>`:lockAct("study")}<button class="btn act" id="flee" ${tt("Flee","Try to get away. A creature from the map stays alive and dazed.")}>${icon("flee")}<span>Flee</span></button></div>
      ${cons.length?`<div class="sqg cons">${cons.map(id=>{const it=S.items[id],hint=useHint(it);return `<button class="sq" style="${rcol(it)}" data-use="${id}" aria-label="Use ${it.name}${S.inv[id]>1?`, ${S.inv[id]} held`:""}. ${esc(hint)}" ${tt(it.name,hint,`You hold ${S.inv[id]}.`)}>${glyph(it)}${S.inv[id]>1?`<span class="sq-n">${S.inv[id]}</span>`:""}<span class="sq-p">${esc(hint.split(" · ")[0])}</span></button>`}).join("")}</div>`:""}
      ${logBlock(B)}`;
  }else{
    const loot=B.over==="won"?`<div class="loot"><span class="label" ${tt("Loot","Tap an item to inspect it.")}>${ic("bag")}</span>${lootChips(B.loot)}${B.emb&&isUnl("peddler")?`<span class="chip emb">${icon("ember")}+${B.emb}</span>`:""}</div>`:"";
    body=`${loot}${youHud()}<div class="actions"><button class="btn primary grow" id="cont">Back to the map</button>${B.over==="won"?'<button class="btn grow" id="toforge">Go to the forge</button>':""}</div>${logBlock(B)}`;
  }
  a.innerHTML=`${foeStage(B)}${body}`;
  const bl=$("blog");if(bl)bl.scrollTop=bl.scrollHeight;
}
function useHint(it){const st=statsOf(it),p=[];if(st.heal>0)p.push(`+${medHeal(it)} HP`);const d=Math.round((st.atk+st.mag)*.6);if(d>=3)p.push(`${d} dmg`);const c=cures(it.traits);if(c.length)p.push("cures "+c.join(", "));return p.join(" · ")||"no effect"}
// Worn items a fizzle would take (the bench holds the equipped copy or the last copy)
const equippedRisk=items=>[...new Set(items.map(i=>i.id))].filter(id=>(S.inv[id]||0)-benchCount(id)<eqCount(id)).map(id=>S.items[id].name);
// Forge preview line: the skill that makes this, success / mishap / fizzle odds, and the tier cap
function craftLine(r,items){
  const risk=equippedRisk(items),sk=SKILLS[r.skill],cp=SK_CAP[r.lv-1],b=r.blocked,ch=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${v}</b></span>`;
  return `<div class="cline${b?" blocked":""}"><div class="chips">${isUnl("skills")?ch("var(--accent)",skIcon(r.skill),`Lv ${r.lv}`,`${sk.name} Lv ${r.lv}`,"The skill that makes this."):""}${ch("var(--muted)",ic("tier","s"),`${r.item.tier}/${cp}`,`Tier ${r.item.tier}, your cap is ${cp}`,"The result's tier against the highest tier your skill can reach.")}
    ${b?"":ch("var(--up)",ic("ok","s"),`${100-r.fail}%`,`${100-r.fail}% clean`,"A clean forge gives exactly the item previewed.")+ch("var(--accent)",ic("warn","s"),`${r.mis}%`,`${r.mis}% mishap`,`A mishap gives a flawed copy (Cursed, Brittle, Rust or Weakened)${isUnl("peddler")?" that you can reforge for embers":""}.`)+ch("var(--down)",ic("smoke","s"),`${r.fiz}%`,`${r.fiz}% fizzle`,`A fizzle loses the ingredients${isUnl("peddler")?" but returns some embers":""}.`)
      +helpBtn("Forge odds",S.journal.length?`Difficulty ${r.diff} against your skill ${r.lv}${r.diff-r.lv>2?", a reach for you":""}. The higher your skill, the fewer mishaps and fizzles.${r.prec?` Precision trims ${r.prec} points off the failure chance.`:""}`:"Your first forge never fails.")}</div>
    ${b?`<p class="warn-text">${blockText(b)}</p>`:""}
    ${risk.length?`<p class="warn-text">${risk.join(" and ")} ${risk.length>1?"are":"is"} equipped. A fizzle would destroy ${risk.length>1?"them":"it"}; tap Forge twice to confirm.</p>`:""}</div>`;
}
const skIcon=k=>`<svg class="ski" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${G[SKILLS[k].g]}</svg>`;
function renderSkills(){
  const su=isUnl("skills");$("skd").hidden=!su;$("sklock").hidden=su;if(!su){$("sklock").innerHTML=lockRow("skills");return}
  $("sksum").innerHTML=`${ic("hammer","s")} Crafting skills${helpBtn("Crafting skills","Every kind of thing has its own skill. A craft trains the skill of what you make, and a little of each other kind you put in. A higher skill raises the tier you can reach and lowers the chance a forge goes wrong.")}`;
  $("skills").innerHTML=Object.entries(SKILLS).map(([k,sk])=>{const l=skLv(k),cur=SK_LV[l-1],nxt=SK_LV[l],x=skXp(k);
    const f=Math.round(Math.max(FAIL.min,Math.min(FAIL.max,FAIL.base+FAIL.slope*(CRAFT.base+CRAFT.tier-l)))); // a plain tier-2 craft with no clashes
    return `<div class="sk" ${tt(`${sk.name} Lv ${l}`,`Makes ${sk.cats}.`,nxt?`${x-cur}/${nxt-cur} XP to Lv ${l+1}.`:"Highest level reached.",`Tier cap ${SK_CAP[l-1]}; about ${f}% base failure on a plain tier-2 craft.`)}>${skIcon(k)}<div class="skb"><span class="sn"><b>${sk.name}</b> <span class="foot">Lv ${l}</span></span>
      <div class="bar know"><i style="width:${nxt?Math.min(100,(x-cur)/(nxt-cur)*100):100}%"></i></div></div><span class="skc"><span>${ic("tier","xs")}${SK_CAP[l-1]}</span><span>${ic("warn","xs")}${f}%</span></span></div>`}).join("");
}
function renderBench(){
  const max=maxInputs(),parts=[],items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  for(let i=0;i<(level()>=2?4:3);i++){
    if(i>0)parts.push('<span class="plus" aria-hidden="true">+</span>');
    if(i>=max){parts.push(`<div class="slot locked" ${tt(`Slot ${i+1}`,`Unlocks at Smith Lv ${INPUT_LV[i-2]}`)}>${ic("lock")}<small>Lv ${INPUT_LV[i-2]}</small></div>`);continue}
    const it=items[i];
    parts.push(it?`<button class="slot full${!chk.ok&&chk.bad?.id===it.id?" bad":""}" style="${rcol(it)}" data-slot="${i}" aria-label="Remove ${it.name}" ${itemTip(it,"Tap to take it out.")}>${glyph(it)}</button>`:`<div class="slot" aria-label="Empty slot">${ic("plus","l")}</div>`);
  }
  $("slots").className=level()>=2?"slots s4":"slots";$("slots").innerHTML=parts.join("");
  let hint="",crafting=null;const miss=chk.ok&&items.length>1?craftMiss(items):[]; // techniques this craft needs and you lack
  if(!items.length)hint=`<p class="foot" style="text-align:center">Tap items below to add them.</p>`;
  else if(!chk.ok)hint=`<p class="warn-text">${chk.reason}</p>`;
  else if(items.length===1)hint=`<p class="foot">${items[0].name} takes ${acceptsText(items[0])}.</p>`;
  else if(miss.length)hint=`<p class="warn-text">${ic("lock","s")} ${techWhy(miss)}</p>${isUnl("research")?`<div class="actions"><button class="btn sm" data-gores="${miss[0]}">${ic("research","s")} Open Research</button></div>`:""}`;
  else{
    const r=combine(items,{roll:100}),known=S.items[r.item.id],base=S.items[r.baseId];crafting=r;
    if(known){
      const ts=targetSlot(known),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==known.id&&eqIt.id!==base.id;
      hint=`<div class="preview"><div class="rhead sm">${glyph(known)}<div><div class="rform">${ic("ok","s")} Known recipe · ${rarity(known)[0]} · ${labelOf(known)}</div><b>${nameHtml(known)}</b></div></div>
        <div class="chips">${chips(known.traits)}</div>${statGrid(shown(known),shown(base))}
        ${cmpBlock(known,base,"Compared to")}${showEq?cmpBlock(known,eqIt,"Versus equipped"):""}</div>`}
    else{
      const knownR=new Set(S.knownR),kr=r.rxKeys.filter(k=>knownR.has(k)),ur=r.rxKeys.filter(k=>!knownR.has(k));
      const hidden=new Set(REACTIONS.filter(([a,b])=>ur.includes(a+"+"+b)).map(x=>x[2]));
      const appraise=level()>=3?`<span class="foot">Appraisal: ${Object.keys(r.item.traits).map(t=>hidden.has(t)?"???":t).join(", ")}</span>`:`<span class="foot">Appraisal unlocks at Smith Lv 3.</span>`;
      hint=`<div class="preview"><span class="ok-text">${ic("plus","s")} New combination: a ${formName(r.item.form)}.</span>
        ${kr.length?`<span class="foot">Known reactions: ${kr.map(k=>{const x=REACTIONS.find(([a,b])=>a+"+"+b===k);return `${x[0]} + ${x[1]} → ${x[2]}`}).join(", ")}</span>`:""}
        ${ur.length?`<span class="foot" style="color:var(--accent)" ${tt("Unseen reaction","Something in this mix will react in a way you haven't seen yet.")}>${ic("warn","xs")} An unseen reaction</span>`:""}
        ${appraise}</div>`}
    hint+=craftLine(r,items);
  }
  $("mixhint").innerHTML=hint;
  $("combine").textContent=forgeArmed&&forgeArmed===S.bench.join()?"Tap again to forge":"Forge";
  $("combine").disabled=items.length<2||!chk.ok||!!crafting?.blocked;
  $("combine").setAttribute("aria-disabled",miss.length?"true":"false");if(miss.length)$("combine").dataset.tip=`Can't forge this yet\n${techWhy(miss)}`;else delete $("combine").dataset.tip; // a missing technique refuses the forge with a tip
}
function renderResult(fresh){
  const el=$("result"),total=Object.values(S.inv).reduce((s,c)=>s+c,0);
  if(!S.last){el.className="panel result";el.innerHTML=`<p class="empty">${total<2?"You need at least two items to forge. Win battles to collect loot.":"Your sword takes ores, herbs, potions, essences and relics. Salvage loot in the Gear tab to turn it into essences."}</p>`;return}
  const r=S.last,ch=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${v}</b></span>`;
  const gains=`<div class="chips">${ch("var(--accent)",ic("xp","s"),`+${r.xpGain}`,"Smith XP",`+${r.xpGain} smith XP. It raises your smith level, which opens crucible slots and trait slots.`)}${Object.entries(r.sx||{}).map(([k,n])=>ch("var(--fg)",skIcon(k),`+${n}`,`${SKILLS[k].name} +${n}`,r.scaled?"Easy or known recipes teach less.":"Crafting trains the skill of what you make.")).join("")}`; // the tail (fail chip) is added per branch
  if(r.fizzle){el.className="panel result fizzle"+(fresh?" fresh":"");
    el.innerHTML=`<div class="rhead"><div><div class="rform">Fizzle</div><h2 class="rname">Ashes and smoke</h2></div></div>
      <ul class="log"><li><strong>Recipe</strong> ${r.recipe.join(" + ")}</li>${r.log.map(l=>`<li class="${l.warn?"warn":""}"><strong>${l.k}</strong> ${l.t}</li>`).join("")}${r.refund&&isUnl("peddler")?`<li><strong>Embers</strong> You sift ${r.refund} out of the ash.</li>`:""}</ul>
      ${gains}<span class="foot">you learn from failure</span></div>`;return}
  const it=S.items[r.id]||r.item,base=S.items[r.baseId],[rn]=rarity(it);
  const ts=targetSlot(it),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==it.id&&eqIt.id!==base?.id;
  el.className="panel result"+(it.legendary?" legend":"")+(fresh?" fresh":"");
  el.innerHTML=`<div class="rhead">${glyph(it)}<div><div class="rform">${rn} · ${labelOf(it)} · Tier ${it.tier}</div>
    <h2 class="rname">${nameHtml(it)}${r.isNew?`<span class="badge${it.legendary?" gold":""}">${it.legendary?"Legendary":"New"}</span>`:""}</h2></div></div>
    <div class="chips">${chips(it.traits)}</div>
    ${statGrid(shown(it),base?shown(base):null)}${base?cmpBlock(it,base,"Compared to"):""}
    ${showEq?cmpBlock(it,eqIt,"Versus equipped"):""}
    <ul class="log"><li><strong>Recipe</strong> ${it.recipe.join(" + ")}</li>${r.log.map(l=>`<li class="${l.warn?"warn":""}"><strong>${l.k}</strong> ${l.t}</li>`).join("")}</ul>
    ${gains}${ch(r.mishap?"var(--accent)":"var(--up)",ic(r.mishap?"warn":"ok","s"),`${r.inst}%`,r.mishap?"Flawed":"Held together",`${r.inst}% was the chance to fail.`)}</div>
    ${S.inv[it.id]>0?`<div class="actions"><button class="btn${isGear(it)&&!eqCount(it.id)?" primary":""}" data-open="${it.id}">${isGear(it)&&!eqCount(it.id)?"Equip or inspect":"Inspect"}</button></div>`:""}`;
}
const TABS=[["all","All"],["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["consumable","Consumables"],["material","Materials"]];
const baseName=it=>(S.items[baseIdOf(it.id)]||it).name; // graded items sort next to their Plain kin, by grade
const TAB_IC={all:()=>ic("bag"),weapon:()=>gIc("blade"),armor:()=>gIc("chest"),charm:()=>ic("amulet"),consumable:()=>gIc("potion"),material:()=>gIc("ore")};
const tabBtn=(attr,k,l,on)=>`<button class="tab ti" data-${attr}="${k}" aria-pressed="${on}" aria-label="${l}" ${tt(l)}>${TAB_IC[k]()}${on?`<span>${l}</span>`:""}</button>`; // icon filter chip: the active one shows its name, the rest have a tip
function satchel(mode){
  const tabs=TABS.map(([k,l])=>tabBtn("tab",k,l,S.tab===k)).join("");
  const list=Object.keys(S.inv).filter(id=>S.inv[id]>0).map(id=>S.items[id]).filter(it=>S.tab==="all"||grp(it)===S.tab)
    .sort((a,b)=>FORMS[b.form].p-FORMS[a.form].p||b.tier-a.tier||baseName(a).localeCompare(baseName(b))||gradeOf(a.id)-gradeOf(b.id)||a.name.localeCompare(b.name));
  const benchItems=S.bench.map(id=>S.items[id]),full=S.bench.length>=maxInputs();
  const tiles=list.length?list.map(it=>{const eq=eqCount(it.id)>0,left=avail(it.id),isNew=freshShown.has(it.id)||S.fresh.includes(it.id);
    let note="",no=false;
    if(mode==="forge"){if(left<=0){no=true;note="All in the crucible."}else if(full){no=true;note="The crucible is full."}else if(!checkMix([...benchItems,it]).ok){no=true;note="Won't mix with what is in the crucible."}}
    return `<button class="sq${it.legendary?" legend":""}${it.grade?" gr":""}${eq?" eq":""}${no?" no":""}" style="${rcol(it)}" data-id="${it.id}" data-can="${no?0:1}" aria-label="${it.name}${left!==1?`, ${left}`:""}${eq?", worn":""}${isNew?", new":""}${note?`, ${note}`:""}. ${itemAria(it)}" ${itemTip(it,left>1?`You hold ${left}.`:"",eq?"Worn.":"",note)}>
      ${glyph(it)}${left!==1?`<span class="sq-n">${left}</span>`:""}${eq?`<span class="sq-w">${ic("equip","xs")}</span>`:""}${isGear(it)||it.grade?`<span class="sq-p"${it.grade?` style="color:var(--gc)"`:""}>${isGear(it)?power(it):ROMAN[it.grade]}</span>`:""}${isNew?'<i class="sq-d"></i>':""}</button>`}).join("")
    :`<p class="empty">Nothing here yet.</p>`;
  return [tabs,tiles];
}
function renderSatchels(){
  if(S.view==="gear"){const [t,i]=satchel("gear");$("gtabs").innerHTML=t;$("ginv").innerHTML=i}
  if(S.view==="forge"){const [t,i]=satchel("forge");$("ftabs").innerHTML=t;$("finv").innerHTML=i}
}
function haveFor(ids){const need={};ids.forEach(id=>need[id]=(need[id]||0)+1);return ids.map(id=>(S.inv[id]||0)>=need[id])}
const REC_IC={weapon:"blade",armor:"chest",charm:"charm",food:"food",potion:"potion",hide:"hide",ore:"ore",herb:"herb",essence:"essence",relic:"relic"};
const kic=(k,tip)=>`<span class="kic" ${tt(...tip)}>${gIc(REC_IC[k]||k,"")}</span>`;
function renderRecipes(){
  $("rtabs").innerHTML=TABS.map(([k,l])=>tabBtn("rtab",k,l,S.rtab===k)).join("");
  const recs=S.journal.slice().reverse().map(j=>S.items[j.id]).filter(it=>it&&(S.rtab==="all"||grp(it)===S.rtab));
  $("rlabel").innerHTML=`${ic("recipes","s")} Your recipes · ${S.journal.length}${helpBtn("Recipes","Every combination you forge is saved here. Tap the anvil to load its ingredients into the crucible.","Ingredients you don't have are crossed out.")}`;
  $("rlist").innerHTML=recs.length?recs.map(it=>{const ids=it.recipeIds||[],have=haveFor(ids),all=have.every(Boolean)&&ids.length<=maxInputs()&&!inBattle(),lv=ids.length>maxInputs();
    const why=all?"Load the ingredients into the crucible.":lv?`Needs Smith Lv ${INPUT_LV[ids.length-3]} for ${ids.length} slots.`:inBattle()?"Finish the fight first.":"You are missing ingredients.";
    return `<div class="rr${all?" ok":""}"><span class="rg" style="${rcol(it)}" ${itemTip(it,"Recipe")}>${glyph(it)}</span><div class="rm"><span class="rn">${nameHtml(it)}</span><span class="ris">${ids.map((id,i)=>{const x=S.items[id];return `<span class="ri1 ${have[i]?"have":"miss"}" ${tt(x?x.name:"?",have[i]?"You have it.":"You are out of it.")}>${x?glyph(x):ic("mystery")}</span>`}).join('<i>+</i>')}</span></div>
      ${all?`<button class="ibt load" data-load="${it.id}" aria-label="Load the recipe for ${esc(it.name)}" ${tt("Load",why)}>${icon("forge")}</button>`
        :`<button class="ibt load off" data-tap aria-label="Cannot load ${esc(it.name)}: ${why}" ${tt(lv?`Needs Lv ${INPUT_LV[ids.length-3]}`:"Missing",why)}>${lv?ic("lock"):ic("bag")}</button>`}</div>`}).join("")
    :`<p class="empty">${S.journal.length?"No recipes in this category yet.":"Every combination you forge is saved here so you can make it again."}</p>`;
  $("mixsum").innerHTML=`${ic("filter","s")} What mixes with what${helpBtn("What mixes","Each row lists what that kind of item takes, besides its own type. Essences mix with everything; salvage any item to get them.")}`;
  $("mixrules").innerHTML=[["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["food","Food"],["potion","Potions"]]
    .map(([k,l])=>`<div class="mx">${kic(k,[l])}<span class="ar">takes</span>${ACCEPTS[k].map(a=>kic(a,[cap(KIND_LABEL[a])])).join("")}<span class="kic same" ${tt("The same type",`${l} also take other ${l.toLowerCase()}.`)}>${ic("plus","s")}</span></div>`).join("")
    +`<div class="mx">${kic("ore",["Materials","Hides, ores and herbs."])}<span class="ar">takes</span>${["hide","ore","herb","essence","relic"].map(a=>kic(a,[cap(KIND_LABEL[a]),a==="hide"||a==="ore"||a==="herb"?"Only their own kind.":""])).join("")}</div>
      <div class="mx">${kic("essence",["Essences"])}<span class="ar">takes</span><span class="kic" ${tt("Everything","Salvage any item to get essences.")}>${ic("bag")}</span></div>`;
  $("fusions").innerHTML=!hasTech("alloy")?`<div class="lockrow" ${tt("Alloying (locked)",isUnl("research")?"Learn Alloying in Research (the Forge tab) to merge two kinds of gear.":"Something to learn later.")}>${ic("lock","s")}<b>Alloying</b><small>${isUnl("research")?"Learn it in Research.":"Not yet known."}</small></div>`:FUSIONS.map(([a,b,f])=>`<span class="fu" ${tt(`${cap(formName(a))} + ${formName(b)} → ${FORMS[f].noun}`,"A fusion: two kinds that merge into a new one.")}>${gIc(a)}<i>+</i>${gIc(b)}<i>→</i><b>${gIc(f)}</b></span>`).join("");
  const known=new Set(S.knownR),rd=REACTIONS.filter(([a,b])=>known.has(a+"+"+b));
  $("rxlabel").innerHTML=`${ic("infuse","s")} Trait reactions · ${rd.length}/${REACTIONS.length}${helpBtn("Trait reactions","Some pairs of traits react when they meet in the crucible and become a new trait. Discover one by forging it.",...isUnl("research")?["Studying a material in Research, or an insight while forging, shows part of a reaction first."]:[])}`;
  $("reactions").innerHTML=[...rd.map(([a,b,res,cons])=>`<span class="rx1" ${tt(`${a} + ${b} → ${res}`,cons.length?"":"Keeps both traits.")}>${ci(tColor(a),famIc(TRAITS[a].f,"s"))}<i>+</i>${ci(tColor(b),famIc(TRAITS[b].f,"s"))}<i>→</i>${ci(tColor(res),famIc(TRAITS[res].f,"s"))}</span>`),
    ...REACTIONS.filter(r=>!known.has(rxKey(r))&&rxHint(rxKey(r)).length).map(r=>{const k=rxKey(r),hs=rxHint(k),side=t=>hs.includes(t)?ci(tColor(t),famIc(TRAITS[t].f,"s"),t):`<span class="chip unk"><b>?</b></span>`,one=hs.length<2?hs[0]:null;
      return `<span class="rx1 part" ${tt(`${hs.includes(r[0])?r[0]:"???"} + ${hs.includes(r[1])?r[1]:"???"} → ???`,one?`A hint: ${one} reacts with ${VAGUE[one===r[0]?r[1]:r[0]]||"something"}.`:"You know both sides. Forge them together to see what they make.")}>${side(r[0])}<i>+</i>${side(r[1])}<i>→</i><span class="chip unk"><b>?</b></span></span>`}),
    ...REACTIONS.filter(r=>!known.has(rxKey(r))&&!rxHint(rxKey(r)).length).map(()=>`<span class="rx1 unk" ${tt("Undiscovered reaction",`Forge the right pair of traits to find it${isUnl("research")?", or study a material and keep an eye out for insights":""}.`)}>?</span>`)].join("");
  const fd=SECRETS.filter(found).length;
  $("seclabel").innerHTML=`${ic("renown","s")} Legendary secrets · ${fd}/${SECRETS.length}${helpBtn("Legendary secrets","Hint scrolls from chests, shrines, riddles, bosses, bounties and the daily reveal a rumor, then its ingredients.")}`;
  $("secrets").innerHTML=SECRETS.map((sc,i)=>{const ok=found(sc),lv=hintLv(i),jr=ok&&S.journal.find(j=>S.items[j.id]?.legendary&&S.items[j.id].name===sc.name);
    const ing=sc.ids.map((id,k)=>k<lv-1?idName(id):"?").join(" + ");
    return ok?`<span class="sq sec ok" style="--rc:var(--accent)" ${tt(sc.name,"Discovered.",sc.ids.map(idName).join(" + "))}>${jr?glyph(S.items[jr.id]):ic("renown")}</span>`
      :lv?`<span class="sq sec" ${tt("A rumor",sc.hint,`Ingredients: ${ing}`)}><b>?</b><span class="sq-p">${Math.max(0,lv-1)}/${sc.ids.length}</span></span>`
      :`<span class="sq sec lock" ${tt("Undiscovered","A hint scroll would reveal a rumor.")}>${ic("lock")}</span>`}).join("");
}
const sn=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,"")+"M":n>=1e4?(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,"")+"k":String(n);
function renderStats(){
  const st=S.stats,zn=Object.fromEntries(ZONES.map(z=>[z[0],z[1]])),cell=(v,l)=>`<div class="sc"><b>${v}</b><span>${l}</span></div>`,grp=(t,h)=>`<p class="label">${t}</p><div class="sgrid">${h}</div>`;
  const kz=ZONES.map(z=>S.zoneKills[z[0]]|0),bossIds=ZONES.map(z=>z[2]);
  const heat=ZONES.filter(z=>st.heatBest[z[0]]!==undefined).map(z=>`${zn[z[0]].split(" ").pop()} ${st.heatBest[z[0]]}`).join(" · ")||"none yet";
  const fast=bossIds.filter(id=>st.fast[id]).map(id=>`<li><span>${ENEMIES[id].name}</span><b>${st.fast[id]} turn${st.fast[id]>1?"s":""}</b></li>`).join("")||`<li><span>No boss beaten yet</span></li>`;
  $("stats").innerHTML=grp("Combat",cell(sn(st.dealt),"damage dealt")+cell(sn(st.taken),"damage taken in battle")+cell(st.big?`${st.big}`:"-",st.big?`biggest hit · ${st.bigW}`:"biggest hit")+cell(st.crits,"critical hits")
      +cell(st.parries,"perfect parries")+cell(st.abil,"abilities used")+cell(st.sufd,"statuses suffered")+cell(st.cured,"statuses cured")+cell(st.deaths,"defeats")+cell(st.studied,"creatures studied"))
    +grp("Exploration",cell(kz.reduce((a,b)=>a+b,0),"creatures slain")+cell(st.elites,"magic & rare slain")+cell(st.bosses,"bosses slain")+cell(st.exped,"expeditions done")
      +`<div class="sc wide"><b>${kz.join(" / ")}</b><span>kills by region (${ZONES.map(z=>z[1].split(" ").pop()).join(" / ")})</span></div>`
      +`<div class="sc wide"><b>${heat}</b><span>highest Heat cleared</span></div>`)
    +grp("Forge",cell(st.forged,"items forged")+cell(S.journal.length,"recipes found")+cell(st.legend,"legendaries forged")+cell(st.mishaps,"mishaps")+cell(st.fizzles,"fizzles")+cell(st.salvaged,"items salvaged")+cell(st.refined,"grades upgraded"))
    +grp("Economy",cell(sn(st.earned),"embers earned")+cell(sn(st.spent),"embers spent")+cell(S.embers,"embers now"))
    +`<p class="label">Records</p><ul class="rec2">${fast}<li><span>Dailies played / won</span><b>${st.dailies} / ${st.dailyWins}</b></li><li><span>Best daily</span><b>${st.dBest?dailyResult(st.dBest):"none yet"}</b></li></ul>`;
}
function renderAfx(){ // the Codex list of affixes: an entry opens when you first meet an enemy that carries it
  const ids=Object.keys(AFX),n=ids.filter(a=>(S.afx[a]||{}).s>0).length;
  $("aflabel").innerHTML=`${ic("elite","s")} Affixes · ${n}/${ids.length}${helpBtn("Affixes","Magic enemies carry one affix, rare ones two (three from Heat 4). Each affix changes how the fight plays and drops its own essence when you win, better grades than usual (a rare more reliably than a magic one).","Meet an enemy that carries an affix to record it here.")}`;
  const row=a=>{const o=S.afx[a],A=AFX[a];return `<li class="af" style="--ac:${afxCol(a)}"><span class="afi">${afxIc(a)}</span><div><b>${A.n}</b><small>met ${o.s}, beaten ${o.b}</small><p>${A.d()}</p><p class="drop">${famIc(TRAITS[A.tr].f,"s")} ${A.tr} Essence</p></div></li>`},
    lock=ids.filter(a=>!(S.afx[a]&&S.afx[a].s>0));
  $("aflist").innerHTML=`${n?`<ul class="afl">${ids.filter(a=>!lock.includes(a)).map(row).join("")}</ul>`:""}${lock.length?`<div class="chips aflock">${lock.map(()=>`<span class="chip unk" ${tt("Unknown affix","Meet a magic or rare enemy that carries it.")}>${ic("lock","s")}<b>???</b></span>`).join("")}</div>`:""}`}
function renderGuide(){ // every unlocked intro, to read again; what is still locked sits in a collapsed list
  const op=UNLOCKS.filter(u=>u.i&&S.unl[u.id]),shut=UNLOCKS.filter(u=>u.txt&&!S.unl[u.id]),pt=u=>!u.i.ctx&&u.i.sel&&!/^\.tl/.test(u.i.sel); // Show me only where there is something to point at
  $("gdlabel").innerHTML=`${ic("list","s")} Guide · ${op.length}/${UNLOCKS.filter(u=>u.i&&(u.txt||S.unl[u.id])).length}${helpBtn("Guide","Every introduction you have unlocked, to read again.","New systems open as you play. The locked ones say how to open them.")}`;
  $("gdlist").innerHTML=`<div class="gdl">${op.map(u=>`<details class="gd"><summary><span class="gi">${ic(u.ic,"s")}</span>${u.i.t}${S.seen["i:"+u.id]?"":` <b class="rdy">new</b>`}</summary><div class="gdb">${u.i.l.map(x=>`<p>${x}</p>`).join("")}${pt(u)?`<button class="btn sm" data-guide="${u.id}">${ic("hero","s")} Show me</button>`:""}</div></details>`).join("")}</div>${shut.length?`<details class="gd lockd"><summary><span class="gi">${ic("lock","s")}</span>Still locked · ${shut.length}</summary><div class="gdl">${shut.map(u=>lockRow(u.id)).join("")}</div></details>`:""}`;
}
function renderCodex(){
  document.querySelectorAll("[data-unl]").forEach(e=>e.hidden=!isUnl(e.dataset.unl)); // How to play: only what is open
  renderGuide();$("stp").hidden=!isUnl("stats");$("afp").hidden=!isUnl("afx");
  if(isUnl("stats"))renderStats();if(isUnl("afx"))renderAfx();
  const ids=Object.keys(ENEMIES),seenN=ids.filter(id=>S.seen[id]).length,mast=ids.filter(id=>S.seen[id]&&know(id).mastered).length;
  $("cxlabel").innerHTML=`${ic("codex","s")} Creature codex · ${seenN}/${ids.length}${mast?` · ${ic("renown","xs")}${mast}`:""}${helpBtn("Creature codex",`${seenN} of ${ids.length} met, ${mast} mastered.`,"Fight, study and hunt creatures to fill in their pages. A fully known creature takes 15% more damage from you.","Tap one to open its page.")}`;
  const groups=[...ZONES.map(z=>[z[0],z[1]]),["any","Anywhere"]];
  $("cxlist").innerHTML=groups.map(([z,zn])=>`<p class="zonehead">${zn}</p><div class="cxg">`+Object.entries(ENEMIES).filter(([,e])=>e.zone===z).map(([id,E])=>{
    const seen=S.seen[id],k=know(id),pct=Math.round(k.pct*100),tp=tt(seen?E.name:"Unknown creature",seen?`${E.boss?"Boss. ":""}Defeated ${S.kills[id]||0}`:"Not yet encountered",seen?(k.mastered?"Mastered: you deal 15% more damage.":`Knowledge ${k.have}/${k.tot} (${pct}%)`):"");
    const bd=`${seen&&E.boss?`<span class="sq-w cb" aria-hidden="true">${ic("boss","xs")}</span>`:""}${seen?`<span class="sq-p${k.mastered?" m":""}">${k.mastered?ic("renown","xs"):pct+"%"}</span>`:""}`;
    return seen?`<button class="cxt${k.mastered?" mst":""}" data-codex="${id}" aria-label="${E.name}${E.boss?", boss":""}. ${k.mastered?"Mastered":`Knowledge ${pct}%`}. Open its page." ${tp}>${portrait(id)}${bd}</button>`
      :`<span class="cxt sil" ${tp}>${portrait(id)}</span>`}).join("")+`</div>`).join("");
}
let lastIntro=null;
function render(fresh){
  if(checkUnl())save();
  renderHeader();renderNav();renderGoal();renderIntro();
  if(S.view==="battle")renderBattle();
  if(S.view==="gear")renderGear();
  if(S.view==="forge"){renderBench();renderResearch();renderUpgrade();renderSkills();renderResult(fresh)}
  renderSatchels();
  if(S.view==="recipes")renderRecipes();
  if(S.view==="codex")renderCodex();
  if(sheet.mode==="item"&&sheet.id)openSheet(sheet.id,true,sheet.preview);else if(sheet.mode==="codex")openCodex(sheet.id,true);
  flushFx();
  applyNudge();placeIntro();const cur=curIntro(inBattle());if(cur&&cur.id!==lastIntro)nudge(cur.sel);lastIntro=cur?cur.id:null; // a new card pulses what it points at
  rpFlush();
}
