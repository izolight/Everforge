// ================= RENDER: GEAR TAB =================
// The hero, the equipped slots, player stats and infusions
function renderGear(){
  const P=pstats();P.floor=atFloor(P);
  $("heroLabel").innerHTML=`<p class="label">${tx("Your hero")}</p>${helpBtn(tx("Your hero"),tx("Equipped items shape your appearance. Tap a slot to inspect or change gear."))}`;
  $("heroPortrait").innerHTML=heroArt();
  $("heroPortrait").setAttribute("aria-label",tx("Your hero")+". "+SLOTS.map(([s,l])=>`${tx(l)}: ${gearOf(s)?iname(gearOf(s)):tx("empty")}`).join(". "));
  $("ghp").className="bar"+(S.hp/P.maxHp<.3?" low":"");$("ghp").firstElementChild.style.width=`${S.hp/P.maxHp*100}%`;$("ghptxt").textContent=`${S.hp}/${P.maxHp}`;
  $("gear").innerHTML=SLOTS.map(([s,l0])=>{const it=gearOf(s),l=tx(l0);
    return `<button class="sq gs${it?"":" none"}${it&&it.legendary?" legend":""}"${it?` style="${rcol(it)}"`:""} data-gear="${s}" aria-label="${esc(l)}: ${it?`${esc(iname(it))}. ${itemAria(it)}`:esc(tx("empty"))}" ${it?itemTip(it,l):tt(l,s==="main"?tx("Bare fists. Tap to choose a weapon."):tx("Empty. Tap to choose an item for it."))}>${glyph(it,SLOT_GLYPH[s])}<span class="gear-slot-label">${l}</span></button>`}).join("");
  const sp=Math.min(FOLLOW_T.cap,P.spd*FOLLOW_T.spd),rd=Math.round(P.red*100);
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
  $("inflabel").innerHTML=`<p class="label">${ic("infuse","s")} ${tx("Infusions")} · ${inf.length}/${infSlots()}</p>${helpBtn(tx("Infusions"),tx("Essences worth {n} plain ones (a Greater counts as 3, a Pure as 9, a Lesser as ⅓) infuse a trait into you; as many again deepen it, up to III. Infused traits act as if they were on your weapon.",{n:INF_COST}),can.length?"":inf.length>=infSlots()?tx("All slots used. You can still deepen an infusion with more of its essence."):tx("Collect essences of one trait worth {n} plain ones (deconstructing, elites, bounties) to infuse it.",{n:INF_COST}))}`;
  $("inf").innerHTML=Array.from({length:infSlots()},(_,k)=>{const e=inf[k];if(!e)return `<div class="islot" ${tt(tx("Empty infusion slot"),tx("Collect {n} plain essences of one kind to fill it.",{n:INF_COST}))}>${ic("plus","l")}</div>`;
    const [t,r]=e,st=innateStats(t),bits=Object.entries(st).filter(([,v])=>v);
    return `<div class="islot on" style="border-color:${tColor(t)};color:${tColor(t)}" ${tt(`${trn(t)} ${R[r-1]}`,bits.map(([s,v])=>`${v>0?"+":""}${v} ${STAT_NAMES[s]}`).join(", ")||tx("Effect on hit"),tx("Rank {r} of {m}",{r,m:INF_MAX}))}>${traitIc(t,"l")}<b>${trn(t)} ${R[r-1]}</b><span class="ib">${bits.map(([s,v])=>`<span>${stIc(s,"xs")}${v>0?"+":""}${v}</span>`).join("")||`<span>${tx("on hit")}</span>`}</span></div>`}).join("");
  const cr=S.infCredit?`<p class="foot" style="flex-basis:100%">${tx("Credit: {n} plain, spent first on your next infusion.",{n:creditTxt(S.infCredit)})}</p>`:"";
  $("infbtns").innerHTML=can.map(t=>`<button class="btn sm" data-infuse="${t}" style="border-color:${tColor(t)}">${traitIc(t,"s")} ${isArmed("infuse:"+t)?tx("Tap again to infuse"):S.infuse[t]?tx("Deepen {trait} → {rank}",{trait:trn(t),rank:R[S.infuse[t]]}):tx("Infuse {trait}",{trait:trn(t)})} · ${payText(infPay(t,Math.max(0,INF_NEED-S.infCredit)))||tx("credit")}</button>`).join("")+cr;
}
