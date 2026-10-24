// ================= SMALL RENDER HELPERS =================
const chips=tr=>topTraits(tr).map(([t,v])=>`<span class="chip" style="color:${tColor(t)}">${t}<b>${v}</b></span>`).join("");
const famChip=(f,pre)=>`<span class="chip fam" style="color:${FAM[f]}">${pre?pre+" ":""}${f}</span>`;
const unkChip=t=>`<span class="chip unk">${t}</span>`;
const nameHtml=it=>`<span style="color:${rarity(it)[1]}">${it.name}</span>`;
function delta(a,b){const d=a-b;if(!d)return `<em class="d same">±0</em>`;return `<em class="d ${d>0?"up":"down"}">${d>0?"▲":"▼"}${Math.abs(d)}</em>`}
const shown=it=>{const s=statsOf(it);return grp(it)==="consumable"?{...s,heal:medHeal(it)}:s}; // consumables show the heal they really restore
function statGrid(st,cmp){
  const h=Object.entries(STAT_NAMES).filter(([k])=>st[k]!==0||(cmp&&cmp[k]!==0))
    .map(([k,l])=>`<div class="stat"><span>${l}</span><b class="${st[k]<0?"neg":""}">${st[k]>0?"+":""}${st[k]}</b>${cmp?delta(st[k],cmp[k]):""}</div>`).join("");
  return h?`<div class="stats">${h}</div>`:"";
}
function cmpBlock(it,other,label){
  const a=power(it),b=power(other),pct=b?Math.round((a-b)/Math.abs(b)*100):0,cls=a>b?"up":a<b?"down":"same";
  const word=a>b?`${pct}% stronger`:a<b?`${Math.abs(pct)}% weaker`:"About the same";
  return `<div class="cmp"><div class="row"><span>${label} ${nameHtml(other)}</span><span class="verdict ${cls}">${word}</span></div>
    <div class="row pw"><span>Power ${b} → ${a}</span>${delta(a,b)}</div></div>`;
}
function hpBar(cur,max,cls){const p=Math.max(0,cur)/max;return `<div class="bar ${cls||(p<.3?"low":"")}"><i style="width:${p*100}%"></i></div>`}
const gcol=id=>S.items[id].grade?GRADES[S.items[id].grade-1][1]:"var(--accent)";
const lootChips=ids=>ids.map(id=>`<button class="chip" data-item="${id}" style="color:${gcol(id)}">${S.items[id].name}</button>`).join("");

const shopRow=(id,label,c,off)=>`<div class="shoprow"><button class="chip" data-item="${id}" style="color:${gcol(id)}">${S.items[id].name}</button><button class="btn sm" data-choice="${c}" ${off?"disabled":""}>${label}</button></div>`;
const shopHtml=ev=>`<div class="shop"><p class="label">For sale · you have ${S.embers} embers</p>${ev.stock.map((e,i)=>e.done?"":shopRow(e.id,`${icon("ember")}${e.price}`,`buy:${i}`,S.embers<e.price)).join("")}
  ${ev.sells.some(e=>!e.done)?`<p class="label">Sell a spare</p>${ev.sells.map((e,i)=>e.done?"":shopRow(e.id,`Sell +${e.price}`,`sell:${i}`)).join("")}`:""}</div>`;
const topT=id=>topTraits(S.items[baseIdOf(id)].traits)[0][0];
function renderUpgrade(){
  const lv=skLv("alchemy"),ids=upgradable().sort((a,b)=>topT(a).localeCompare(topT(b))||S.items[baseIdOf(a)].name.localeCompare(S.items[baseIdOf(b)].name)||gradeOf(a)-gradeOf(b));
  $("upgsum").textContent=`Upgrade grades${ids.length?` · ${ids.length} ready`:""}`;
  $("upginfo").textContent=`${UP.n} essences or materials of one grade and some embers make 1 of the next grade (Faint, Lesser, Plain, Greater, Pure): stronger traits, in a single crucible slot. A miss costs the embers and one of them. Greater needs Alchemy Lv ${GRADE_LV[3]}, Pure Lv ${GRADE_LV[4]}. You are Lv ${lv}.`;
  $("upgrows").innerHTML=ids.length?ids.map(id=>{const g=gradeOf(id),tg=g+1,it=S.items[id],low=lv<GRADE_LV[tg-1],poor=S.embers<UP.emb[g-1];
    return `<div class="shoprow up"><span class="uname"><span style="color:${GRADES[g-1][1]}">${it.name}</span> <small>×${avail(id)}</small></span>
      <button class="btn sm" data-upgrade="${id}" ${inBattle()||low||poor?"disabled":""} aria-label="Upgrade ${it.name} to ${GRADES[tg-1][0]}">${low?`${GRADES[tg-1][0]} needs Lv ${GRADE_LV[tg-1]}`:`${icon("ember")}${UP.emb[g-1]} · ${GRADES[tg-1][0]} · ${upChance(tg)}%`}</button></div>`}).join(""):`<p class="foot">Collect ${UP.n} of the same grade of an essence, ore, hide or herb to upgrade them.</p>`;
}
// ================= RENDER =================
let forgeArmed="",freshShown=new Set(),logOpen=false,heatOpen=false;
function renderHeader(){
  const l=level(),cur=XP_LV[l-1],nxt=XP_LV[l];clampHp();
  $("lvl").textContent=`Smith Lv ${l}`;
  $("xpbar").style.width=nxt?`${Math.min(100,(S.xp-cur)/(nxt-cur)*100)}%`:"100%";
  $("emb").innerHTML=`${icon("ember")}${S.embers}`;
  $("disc").textContent=`${S.wins} renown · ${S.journal.length} forged`;
}
function renderNav(){
  $("nav").innerHTML=VIEWS.map(v=>{
    let badge="";
    if(v==="battle"&&inBattle()&&S.view!=="battle")badge='<i class="badge-dot pulse" aria-label="battle in progress"></i>';
    if(v==="gear"&&S.fresh.length&&S.view!=="gear"&&S.view!=="forge")badge=`<i class="badge-dot" aria-label="${S.fresh.length} new items">${S.fresh.length}</i>`;
    return `<button data-view="${v}" aria-current="${S.view===v?"page":"false"}">${icon(v)}<span>${cap(v)}</span>${badge}</button>`}).join("");
  VIEWS.forEach(v=>$("v-"+v).hidden=S.view!==v);
}
function renderGoal(){
  const g=goal(),el=$("goal");
  el.hidden=inBattle();
  el.className="goal"+(g.done?" done":"");
  el.innerHTML=`<div class="gt"><small>${g.step}${g.prog?` · ${g.prog}`:""}</small><span>${g.text}</span></div>
    ${g.done?`<button class="btn primary sm" id="claim">Claim: ${rewardText(g.reward)}</button>`:S.view!==g.tab?`<button class="btn sm" id="goGoal">Go to ${cap(g.tab)}</button>`:""}`;
}
function renderGear(){
  const P=pstats();
  $("ghp").className="bar"+(S.hp/P.maxHp<.3?" low":"");$("ghp").firstElementChild.style.width=`${S.hp/P.maxHp*100}%`;$("ghptxt").textContent=`${S.hp}/${P.maxHp}`;
  $("gear").innerHTML=SLOTS.map(([s,l])=>{const it=gearOf(s);
    return `<button class="gslot${it?"":" none"}" data-gear="${s}" aria-label="${l}: ${it?it.name:"empty"}">${glyph(it,SLOT_GLYPH[s])}<small>${l}</small><span>${it?nameHtml(it):s==="main"?"Bare fists":"Empty"}</span></button>`}).join("");
  $("pstats").innerHTML=[["ATK",P.atk,P.offW?`+${P.offPow}`:""],["MAG",P.mag,""],["DEF",P.def,`${Math.round(P.red*100)}%`],["SPD",P.spd,""]]
    .map(([l,v,x])=>`<div class="ps"><span>${l}</span><b>${v}</b>${x?` <small>${x}</small>`:""}</div>`).join("");
  const cf=[...Object.entries(P.rs).map(([k,v])=>`Resists ${k} ${v}%`),P.ward&&`Ward ${P.ward}`,P.thorns&&`Thorns ${P.thorns}%`,P.dr&&`-${P.dr}/hit`,P.dodge&&`Dodge ${P.dodge}%`,P.root&&`Roots +${P.root}`,P.cleanse&&`Cleanse ${Math.round(Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER))}%`].filter(Boolean);
  $("cfx").innerHTML=cf.length?cf.map(x=>`<span>${x}</span>`).join(""):"";
  const inf=Object.entries(S.infuse);
  $("inflabel").textContent=`Infusions · ${inf.length}/${infSlots()} slots`;
  $("inf").innerHTML=Array.from({length:infSlots()},(_,k)=>{const e=inf[k];if(!e)return `<div class="islot"><b style="color:var(--dim)">Empty</b><small>3 essences of one kind</small></div>`;
    const [t,r]=e,st=innateStats(t),bits=Object.entries(st).filter(([,v])=>v).map(([s,v])=>`${v>0?"+":""}${v} ${s.toUpperCase()}`).join(" · ");
    return `<div class="islot on" style="border-color:${tColor(t)};color:${tColor(t)}"><b>${t} ${["I","II","III"][r-1]}</b><small>${bits||"effect on hit"}</small></div>`}).join("");
  const can=infusable();
  const cr=S.infCredit?`<p class="foot" style="flex-basis:100%">Credit: ${creditTxt(S.infCredit)} plain, spent first on your next infusion.</p>`:"";
  $("infbtns").innerHTML=(can.length?can.map(t=>`<button class="btn sm" data-infuse="${t}" style="border-color:${tColor(t)}">${S.infuse[t]?`Deepen ${t} → ${["I","II","III"][S.infuse[t]]}`:`Infuse ${t}`} · ${payText(infPay(t,Math.max(0,INF_NEED-S.infCredit)))||"credit"}</button>`).join("")
    :`<p class="foot">${inf.length>=infSlots()?"All slots used. You can still deepen an infusion with more of its essence.":`Collect essences of one trait worth ${INF_COST} plain ones (salvage, elites, bounties) to infuse it.`}</p>`)+cr;
}
function youHud(){
  const P=pstats(),B=S.battle,guarding=B&&!B.over&&B.guard;
  return `<div class="you" id="youHud">${glyph(P.main,"fists")}<div class="fname">You<em>${P.main?P.main.name:"Bare fists"}</em></div>
    <div class="hpline">${hpBar(S.hp,P.maxHp)}<span class="hpnum">${S.hp}<small>/${P.maxHp}</small></span></div>
    <div class="fsub"><span>ATK ${P.atk}</span><span>DEF ${Math.round(P.red*100)}%</span>${P.regen?`<span>+${P.regen}/turn</span>`:""}${Object.keys(S.infuse).length?`<span>${Object.keys(S.infuse).join(" · ")}</span>`:""}${guarding?"<span>Guarding</span>":""}${B&&!B.over&&B.off>0?"<span>Off balance</span>":""}${B&&!B.over&&P.rs[B.el]?`<span>Resists ${B.el} ${P.rs[B.el]}%</span>`:""}${B&&!B.over&&B.ward>0?`<span>Ward ${B.ward}</span>`:""}${B&&!B.over?Object.entries(B.you||{}).map(([s,x])=>`<span class="st ${s}" title="${STATUS[s].tip}">${STATUS[s].n}${x.n>1?" x"+x.n:""} ${x.t}t</span>`).join(""):""}</div></div>`;
}
function campbar(){
  const P=pstats(),low=S.hp/P.maxHp<.35;
  if(twistNow()==="nocamp")return `${low?`<p class="warn-text">You're badly hurt. Eat something before your next fight.</p>`:""}<p class="foot" style="text-align:center">No campfires on this expedition.</p>`;
  return `${low?`<p class="warn-text">You're badly hurt. Eat something or rest before your next fight.</p>`:""}
  <div class="actions"><button class="btn grow" id="rest" ${S.camp>0&&S.hp<P.maxHp?"":"disabled"}>${icon("camp").replace("<svg","<svg style='width:18px;height:18px;vertical-align:-3px;margin-right:6px'")}Rest at campfire · ${S.camp} left</button></div>
  <p class="foot" style="text-align:center">Campfire heals 50%. Next charge in ${3-S.campProg} win${3-S.campProg===1?"":"s"}${S.camp>=3?" (pouch full)":""}.</p>`;
}
function foeStage(B){
  const E=ENEMIES[B.id],K=cx(B.id),kn=know(B.id),eliteF=B.elite?TRAITS[B.elite].f:null;
  const kw=B.weak.filter(f=>K.weak.includes(f)),kr=B.resist.filter(f=>K.resist.includes(f)||f===eliteF);
  const F=foeOf(B),unknown=F.weak.filter(f=>!K.weak.includes(f)).length+F.resist.filter(f=>!K.resist.includes(f)).length;
  const st=[B.burn&&`<span class="chip" style="color:${FAM.fire}">Burning ${B.burn.d}</span>`,B.poison&&`<span class="chip" style="color:${FAM.poison}">Poison ${B.poison}</span>`,B.frozen&&`<span class="chip" style="color:${FAM.ice}">Frozen</span>`,B.bleed&&`<span class="chip" style="color:var(--bad)">Bleed ${B.bleed.d*B.bleed.n}</span>`].filter(Boolean).join("");
  const winding=!B.over&&!B.frozen&&isSpecial(B)&&F.sp.kind!=="heal";
  const cls=`portrait${B.over==="won"?" down":""}${winding?" winding":""}`;
  return `<div class="stage" id="enemyHud" style="--el:${FAM[B.el]}">
    <button class="${cls}" id="foeArt" data-codex="${B.id}" aria-label="${B.name}. Open codex entry">${portrait(B.id,{el:B.el,elite:B.elite,frozen:B.frozen,burn:!!B.burn&&!B.over,poison:B.poison>0&&!B.over,phased:B.phased})}</button>
    <div class="foeinfo"><div class="fname">${B.name}${E.boss?`<small>BOSS</small>${B.phased?`<small>${E.phase.label}</small>`:""}`:B.elite?"<small>ELITE</small>":""}${B.heat?`<small>HEAT ${B.heat}</small>`:""}${kn.mastered?"<small>MASTERED</small>":""}</div>
      <div class="hpline">${hpBar(B.hp,B.max,"foe")}<span class="hpnum">${Math.max(0,B.hp)}<small>/${B.max}</small></span></div>
      <div class="fsub">${kw.map(f=>famChip(f,"weak")).join("")}${kr.map(f=>famChip(f,"resists")).join("")}${unknown>0?unkChip(`${unknown} unknown`):""}${st}</div></div></div>`;
}
function logBlock(B){
  const last=B.log.slice(-2).map(l=>`<span class="ll ${l.c}">${l.t}</span>`).join("");
  return `<details class="logd" id="logd"${logOpen?" open":""}><summary>${last}<span class="more">${logOpen?"Hide":"Show"} full log</span></summary><ul class="blog" id="blog">${B.log.map(l=>`<li class="ll ${l.c}">${l.t}</li>`).join("")}</ul></details>`;
}
// Map header: heat badge, modifier list and heat selector (cleared zones), or the daily run's banner
function mapHead(){
  const m=curMap(),dl=S.run==="daily",d=S.daily,h=m.heat||0,hz=heatOf(S.zone);
  const amb=m.amb?`<p class="foot ambn">A whistle sounds behind you. If your next stop is a fight, it starts with an ambush.</p>`:"";
  if(!dl&&!h&&!hz.max)return amb;
  const mods=[...dl?[`<li><b>${DAILY_TWISTS[d.twist].name}</b> ${DAILY_TWISTS[d.twist].desc}</li>`]:[],...HEAT.slice(0,h).map((x,i)=>`<li><b>Heat ${i+1} · ${x.name}</b> ${x.desc}</li>`)];
  const sel=!dl&&hz.max?`<div class="hsel" role="group" aria-label="Heat for new expeditions"><span class="foot">New expeditions</span>${Array.from({length:hz.max+1},(_,n)=>`<button class="hchip" data-heat="${n}" aria-pressed="${hz.sel===n}" title="${n?HEAT[n-1].name+": "+HEAT[n-1].desc:"Normal difficulty"}">${n?"Heat "+n:"Normal"}</button>`).join("")}</div>
    <p class="foot">${hz.sel?`Heat ${hz.sel} · ${HEAT[hz.sel-1].name}: ${HEAT[hz.sel-1].desc}`:"Normal difficulty."}${hz.sel!==h&&!m.cleared?` This map is Heat ${h}; the choice applies to your next expedition here.`:""}</p>`:"";
  return `<div class="maphead"><div class="mh1"><b>${zoneName(S.zone)}</b>${dl?`<span class="heat daily">Daily</span>`:""}${h?`<span class="heat">Heat ${h}</span>`:""}</div>
    ${dl?`<p class="foot">Daily expedition · ${d.date}${d.date!==today()?" (still going from an earlier day)":""} · ${d.turns} turns so far</p>`:""}
    ${mods.length?`<details class="heatd" id="heatd"${heatOpen?" open":""}><summary>${mods.length} active modifier${mods.length>1?"s":""}</summary><ul class="heatl">${mods.join("")}</ul></details>`:""}${sel}
    ${dl?`<div class="actions"><button class="btn sm" id="dailyAbandon">${dArmed?"Tap again to abandon (no retry today)":"Abandon the daily"}</button></div>`:""}${amb}</div>`;
}
function dailyCard(){
  if(S.run==="daily"||!dailyReady())return "";
  const done=dailyState()==="done",d=done?S.daily:dailyPlan(today()),tw=DAILY_TWISTS[d.twist],r=done&&d.result;
  return `<div class="dcard"><div class="dtop"><b>Daily expedition</b><span class="foot">${d.date} UTC</span></div>
    <p class="dline"><span>${zoneName(d.zone)}</span><span class="heat">Heat ${d.heat}</span><span class="heat daily">${tw.name}</span></p>
    <p class="foot">${tw.desc}${!done&&d.zone!==d.want?` Today's region (${zoneName(d.want)}) isn't open to you, so you go to ${zoneName(d.zone)}.`:""}</p>
    ${done?`<p class="foot dres ${r.boss?"won":""}">${r.boss?"Done":"Over"}: ${dailyResult(r)}. Come back tomorrow.</p>`
      :`<p class="foot">One attempt a day. Everyone gets the same map, enemies and chests; fight drops and peddler offers can still differ. Reward for the boss: ${DAILY_REWARD.ess} essences, a rare find, ${DAILY_REWARD.xp} smith XP.</p><div class="actions"><button class="btn primary grow" id="dailyStart">Start today's run</button></div>`}</div>`;
}
function zoneView(){ // keep the chosen region chip in view and fade the edges that hide more chips
  const z=$("zones"),p=z.querySelector('[aria-pressed="true"]');
  if(p&&z.scrollWidth>z.clientWidth)z.scrollLeft+=p.getBoundingClientRect().left-z.getBoundingClientRect().left-(z.clientWidth-p.offsetWidth)/2;
  zoneFade()}
function zoneFade(){const z=$("zones");z.dataset.l=z.scrollLeft>2?1:0;z.dataset.r=z.scrollLeft+z.clientWidth<z.scrollWidth-2?1:0}
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
    const head=m.cleared?`<div class="cleared"><h2>${ZONES[zi][1]} cleared</h2><p class="empty">${shortName(bossId)} has fallen. Explore a fresh map here for more loot${next&&zoneOpen(next[0])?`, or move on to ${next[1]}`:""}.</p>
        <div class="actions"><button class="btn grow" id="again">New expedition here</button>${next&&zoneOpen(next[0])?`<button class="btn primary grow" data-zone="${next[0]}">Travel to ${next[1]}</button>`:""}</div></div>`
      :`<p class="foot" style="text-align:center">${m.pos?"Pick a glowing node to move on.":"Pick where to start."} ${shortName(bossId)} waits at the end of the map.</p>`;
    a.innerHTML=`${youHud()}${head}${mapHead()}${mapHtml()}${campbar()}${dailyCard()}`;return}
  const K=cx(B.id);
  let body="";
  if(!B.over){
    const P=pstats(),sp=isSpecial(B)?foeOf(B).sp:null,est=foeHit(B,P,sp?sp.x:1,1)*(sp&&sp.kind==="multi"?sp.n:1);
    const dmgTxt=K.stats?B.ward>=est?" No damage expected (ward absorbs it).":` About ${est} damage${B.ward>0?` (ward absorbs ${B.ward})`:""}.`:"";
    const intent=B.frozen?`<div class="intent"><b>NEXT</b><span>Frozen. It will lose its turn.</span></div>`
      :sp?`<div class="intent special"><b>NEXT</b><span>It's ${sp.tell}. ${(B.phased?K.sp2:K.sp)?`${sp.name} is coming.`:"Something big is coming."}${sp.kind==="heal"?" Parry to interrupt it.":`${dmgTxt} Guard, or Parry to turn it back!`}</span></div>`
      :`<div class="intent"><b>NEXT</b><span>A normal attack.${dmgTxt} Parrying now would backfire.</span></div>`;
    const cons=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable");
    const canStudy=unknownFacts(B.id).length>0,abs=abKeys(P),abBtn=k=>{const A=ABILITIES[k],c=(B.cd||{})[k]||0;return `<button class="btn act ab" data-ability="${k}" ${c>0?"disabled":""} title="${A.desc}">${icon(A.icon)}${A.name}${c>0?`<i class="cdb">${c}</i>`:""}</button>`};
    body=`${intent}${youHud()}
      <div class="acts n${abs.length}"><button class="btn primary act" id="atk">${icon("attack")}Attack</button>${abs.map(abBtn).join("")}<button class="btn act" id="guard">${icon("guard")}Guard</button><button class="btn act" id="parry" title="Beat a telegraphed special: negate it and riposte. Mistimed: +25% damage and a lost guard.">${icon("parry")}Parry</button>
      <button class="btn act" id="study" ${canStudy?"":"disabled"}>${icon("study")}${canStudy?"Study":"Known"}</button><button class="btn act" id="flee">${icon("flee")}Flee</button></div>
      ${cons.length?`<div class="strip">${cons.map(id=>{const it=S.items[id];return `<button class="tile" data-use="${id}" aria-label="Use ${it.name}">${glyph(it)}<span class="tname">${nameHtml(it)}</span><span class="ttr">${useHint(it)}</span><span class="cnt">×${S.inv[id]}</span></button>`}).join("")}</div>`:""}
      ${logBlock(B)}`;
  }else{
    const loot=B.over==="won"?`<div class="loot"><span class="label">Loot</span>${lootChips(B.loot)}${B.emb?`<span class="chip emb">${icon("ember")}+${B.emb}</span>`:""}</div>`:"";
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
  const risk=equippedRisk(items);
  const sk=SKILLS[r.skill],cp=SK_CAP[r.lv-1],b=r.blocked;
  return `<div class="cline${b?" blocked":""}"><div class="cl1"><span>${skIcon(r.skill)}${sk.name} Lv ${r.lv}</span><span class="foot">Tier ${r.item.tier} · cap ${cp}</span></div>
    ${b?`<p class="warn-text">${blockText(b)}</p>`:`<div class="odds"><span class="ok-text">${100-r.fail}% clean</span><span class="mis">${r.mis}% mishap</span><span class="warn-text">${r.fiz}% fizzle</span></div>`}
    ${b?"":`<span class="foot">${S.journal.length?`Difficulty ${r.diff} vs your skill ${r.lv}${r.diff-r.lv>2?" · a reach for you":""}. A fizzle loses the ingredients but returns some embers.`:"Your first forge never fails."}</span>`}
    ${risk.length?`<p class="warn-text">${risk.join(" and ")} ${risk.length>1?"are":"is"} equipped. A fizzle would destroy ${risk.length>1?"them":"it"}; tap Forge twice to confirm.</p>`:""}</div>`;
}
const skIcon=k=>`<svg class="ski" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${G[SKILLS[k].g]}</svg>`;
function renderSkills(){
  $("skills").innerHTML=Object.entries(SKILLS).map(([k,sk])=>{const l=skLv(k),cur=SK_LV[l-1],nxt=SK_LV[l],x=skXp(k);
    const f=Math.round(Math.max(FAIL.min,Math.min(FAIL.max,FAIL.base+FAIL.slope*(CRAFT.base+CRAFT.tier-l)))); // a plain tier-2 craft with no clashes
    return `<div class="sk">${skIcon(k)}<div class="skb"><b>${sk.name}</b> <span class="foot">Lv ${l}${nxt?` · ${x-cur}/${nxt-cur} XP`:" · max"}</span>
      <div class="bar know"><i style="width:${nxt?Math.min(100,(x-cur)/(nxt-cur)*100):100}%"></i></div><span class="foot">${sk.cats} · tier cap ${SK_CAP[l-1]} · ${f}% base failure</span></div></div>`}).join("");
}
function renderBench(){
  const max=maxInputs(),parts=[],items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  for(let i=0;i<(level()>=2?4:3);i++){
    if(i>0)parts.push('<span class="plus" aria-hidden="true">+</span>');
    if(i>=max){parts.push(`<div class="slot locked" title="Unlocks at Smith Lv ${INPUT_LV[i-2]}">Lv ${INPUT_LV[i-2]}</div>`);continue}
    const it=items[i];
    parts.push(it?`<button class="slot full${!chk.ok&&chk.bad?.id===it.id?" bad":""}" data-slot="${i}" aria-label="Remove ${it.name}">${glyph(it)}<span>${it.name}</span></button>`:`<div class="slot">Empty</div>`);
  }
  $("slots").className=level()>=2?"slots s4":"slots";$("slots").innerHTML=parts.join("");
  let hint="",crafting=null;
  if(!items.length)hint=`<p class="foot" style="text-align:center">Tap gear or a material below. Dimmed items won't mix with what's already in.</p>`;
  else if(!chk.ok)hint=`<p class="warn-text">${chk.reason}</p>`;
  else if(items.length===1)hint=`<p class="foot">${items[0].name} takes ${acceptsText(items[0])}.</p>`;
  else{
    const r=combine(items,{roll:100}),known=S.items[r.item.id],base=S.items[r.baseId];crafting=r;
    if(known){
      const ts=targetSlot(known),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==known.id&&eqIt.id!==base.id;
      hint=`<div class="preview"><span class="label">Known recipe · you'll get</span>
        <div class="rhead sm">${glyph(known)}<div><div class="rform">${rarity(known)[0]} · ${labelOf(known)}</div><b>${nameHtml(known)}</b></div></div>
        <div class="chips">${chips(known.traits)}</div>${statGrid(shown(known),shown(base))}
        ${cmpBlock(known,base,"Compared to")}${showEq?cmpBlock(known,eqIt,"Versus equipped"):""}</div>`}
    else{
      const knownR=new Set(S.knownR),kr=r.rxKeys.filter(k=>knownR.has(k)),ur=r.rxKeys.filter(k=>!knownR.has(k));
      const hidden=new Set(REACTIONS.filter(([a,b])=>ur.includes(a+"+"+b)).map(x=>x[2]));
      const appraise=level()>=3?`<span class="foot">Appraisal: ${Object.keys(r.item.traits).map(t=>hidden.has(t)?"???":t).join(", ")}</span>`:`<span class="foot">Reach Smith Lv 3 to appraise which traits to expect.</span>`;
      hint=`<div class="preview"><span class="ok-text">New combination. It will become a ${formName(r.item.form)}.</span>
        ${kr.length?`<span class="foot">Known reactions: ${kr.map(k=>{const x=REACTIONS.find(([a,b])=>a+"+"+b===k);return `${x[0]} + ${x[1]} → ${x[2]}`}).join(", ")}</span>`:""}
        ${ur.length?`<span class="foot" style="color:var(--accent)">Something in this mix will react in a way you haven't seen yet.</span>`:""}
        ${appraise}</div>`}
    hint+=craftLine(r,items);
  }
  $("mixhint").innerHTML=hint;
  $("combine").textContent=forgeArmed&&forgeArmed===S.bench.join()?"Tap again to forge":"Forge";
  $("combine").disabled=items.length<2||!chk.ok||!!crafting?.blocked;
}
function renderResult(fresh){
  const el=$("result"),total=Object.values(S.inv).reduce((s,c)=>s+c,0);
  if(!S.last){el.className="panel result";el.innerHTML=`<p class="empty">${total<2?"You need at least two items to forge. Win battles to collect loot.":"Your sword takes ores, herbs, potions, essences and relics. Salvage loot in the Gear tab to turn it into essences."}</p>`;return}
  const r=S.last,sxt=r.sx?`+${r.xpGain} smith XP · ${Object.entries(r.sx).map(([k,n])=>`${SKILLS[k].name} +${n}`).join(", ")}${r.scaled?" (easy or known recipes teach less)":""}`:`+${r.xpGain} smith XP`;
  if(r.fizzle){el.className="panel result fizzle"+(fresh?" fresh":"");
    el.innerHTML=`<div class="rhead"><div><div class="rform">Fizzle</div><h2 class="rname">Ashes and smoke</h2></div></div>
      <ul class="log"><li><strong>Recipe</strong> ${r.recipe.join(" + ")}</li>${r.log.map(l=>`<li class="${l.warn?"warn":""}"><strong>${l.k}</strong> ${l.t}</li>`).join("")}${r.refund?`<li><strong>Embers</strong> You sift ${r.refund} out of the ash.</li>`:""}</ul>
      <p class="foot">${sxt} · you learn from failure</p>`;return}
  const it=S.items[r.id]||r.item,base=S.items[r.baseId],[rn]=rarity(it);
  const ts=targetSlot(it),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==it.id&&eqIt.id!==base?.id;
  el.className="panel result"+(it.legendary?" legend":"")+(fresh?" fresh":"");
  el.innerHTML=`<div class="rhead">${glyph(it)}<div><div class="rform">${rn} · ${labelOf(it)} · Tier ${it.tier}</div>
    <h2 class="rname">${nameHtml(it)}${r.isNew?`<span class="badge${it.legendary?" gold":""}">${it.legendary?"Legendary":"New"}</span>`:""}</h2></div></div>
    <div class="chips">${chips(it.traits)}</div>
    ${base?cmpBlock(it,base,"Compared to"):""}${statGrid(shown(it),base?shown(base):null)}
    ${showEq?cmpBlock(it,eqIt,"Versus equipped"):""}
    <ul class="log"><li><strong>Recipe</strong> ${it.recipe.join(" + ")}</li>${r.log.map(l=>`<li class="${l.warn?"warn":""}"><strong>${l.k}</strong> ${l.t}</li>`).join("")}</ul>
    <p class="foot">${r.mishap?"Flawed":"Held together"} (${r.inst}% to fail) · ${sxt}</p>
    ${S.inv[it.id]>0?`<div class="actions"><button class="btn${isGear(it)&&!eqCount(it.id)?" primary":""}" data-open="${it.id}">${isGear(it)&&!eqCount(it.id)?"Equip or inspect":"Inspect"}</button></div>`:""}`;
}
const TABS=[["all","All"],["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["consumable","Consumables"],["material","Materials"]];
const baseName=it=>(S.items[baseIdOf(it.id)]||it).name; // graded items sort next to their Plain kin, by grade
function satchel(mode){
  const tabs=TABS.map(([k,l])=>`<button class="tab" data-tab="${k}" aria-pressed="${S.tab===k}">${l}</button>`).join("");
  const list=Object.keys(S.inv).filter(id=>S.inv[id]>0).map(id=>S.items[id]).filter(it=>S.tab==="all"||grp(it)===S.tab)
    .sort((a,b)=>FORMS[b.form].p-FORMS[a.form].p||b.tier-a.tier||baseName(a).localeCompare(baseName(b))||gradeOf(a.id)-gradeOf(b.id)||a.name.localeCompare(b.name));
  const benchItems=S.bench.map(id=>S.items[id]),full=S.bench.length>=maxInputs();
  const tiles=list.length?list.map(it=>{const eq=eqCount(it.id)>0,left=avail(it.id),isNew=freshShown.has(it.id)||S.fresh.includes(it.id);
    let note="",no=false;
    if(mode==="forge"){if(left<=0){no=true;note="all in crucible"}else if(full){no=true;note="crucible full"}else if(!checkMix([...benchItems,it]).ok){no=true;note="won't mix"}}
    const sub=note?`<span style="color:var(--down)">${note}</span>`:`${eq?'<span class="tag">WORN · </span>':""}${isGear(it)?`PWR ${power(it)} · `:""}${topTraits(it.traits).slice(0,2).map(x=>x[0]).join(" · ")}`;
    return `<button class="tile${it.legendary?" legend":""}${it.grade?" gr":""}${eq?" eq":""}${no?" no":""}"${it.grade?` style="--gc:${GRADES[it.grade-1][1]}"`:""} data-id="${it.id}" data-can="${no?0:1}" aria-label="${it.name}${note?`, ${note}`:""}">
      ${glyph(it)}<span class="tname">${nameHtml(it)}</span><span class="ttr">${sub}</span><span class="cnt">×${left}</span>${isNew?'<span class="new">NEW</span>':""}</button>`}).join("")
    :`<p class="empty">Nothing here yet.</p>`;
  return [tabs,tiles];
}
function renderSatchels(){
  if(S.view==="gear"){const [t,i]=satchel("gear");$("gtabs").innerHTML=t;$("ginv").innerHTML=i}
  if(S.view==="forge"){const [t,i]=satchel("forge");$("ftabs").innerHTML=t;$("finv").innerHTML=i}
}
function haveFor(ids){const need={};ids.forEach(id=>need[id]=(need[id]||0)+1);return ids.map(id=>(S.inv[id]||0)>=need[id])}
function renderRecipes(){
  $("rtabs").innerHTML=TABS.map(([k,l])=>`<button class="tab" data-rtab="${k}" aria-pressed="${S.rtab===k}">${l}</button>`).join("");
  const recs=S.journal.slice().reverse().map(j=>S.items[j.id]).filter(it=>it&&(S.rtab==="all"||grp(it)===S.rtab));
  $("rlist").innerHTML=recs.length?recs.map(it=>{const ids=it.recipeIds||[],have=haveFor(ids),all=have.every(Boolean)&&ids.length<=maxInputs()&&!inBattle();
    return `<div class="rec">${glyph(it)}<div class="rn">${nameHtml(it)} <span class="foot">· ${labelOf(it)} · PWR ${power(it)}</span></div>
      <button class="btn sm${all?" primary":""}" data-load="${it.id}" ${all?"":"disabled"}>${all?"Load":ids.length>maxInputs()?`Needs Lv ${INPUT_LV[ids.length-3]}`:"Missing"}</button>
      <div class="ri">${ids.map((id,i)=>`<span class="${have[i]?"have":"miss"}">${S.items[id]?.name||"?"}</span>`).join(" + ")}</div></div>`}).join("")
    :`<p class="empty">${S.journal.length?"No recipes in this category yet.":"Every combination you forge is saved here so you can make it again."}</p>`;
  $("mixrules").innerHTML=[["Weapons","weapon"],["Armor","armor"],["Trinkets","charm"],["Food","food"],["Potions","potion"]]
    .map(([l,k])=>`<dt>${l}</dt><dd>${ACCEPTS[k].map(a=>KIND_LABEL[a]).join(", ")}, or the same type</dd>`).join("")
    +`<dt>Materials</dt><dd>their own kind (hides, ores, herbs), essences, relics</dd><dt>Essences</dt><dd>everything. Salvage any item to get them.</dd>`;
  $("fusions").innerHTML=FUSIONS.map(([a,b,f])=>`<li>${cap(formName(a))} + ${formName(b)} → <b style="color:var(--fg)">${FORMS[f].noun}</b></li>`).join("");
  const known=new Set(S.knownR);
  $("rxlabel").textContent=`Trait reactions · ${REACTIONS.filter(([a,b])=>known.has(a+"+"+b)).length}/${REACTIONS.length} discovered`;
  $("reactions").innerHTML=REACTIONS.map(([a,b,res,cons])=>known.has(a+"+"+b)
    ?`<li><span class="chip" style="color:${tColor(a)}">${a}</span>+<span class="chip" style="color:${tColor(b)}">${b}</span>→<span class="chip" style="color:${tColor(res)}">${res}</span>${cons.length?"":`<span class="foot">keeps both</span>`}</li>`
    :`<li class="unk">??? + ??? → ???</li>`).join("");
  const fd=SECRETS.filter(found).length,chip=(n,c)=>`<span class="chip" style="color:${c}">${n}</span>`;
  $("seclabel").textContent=`Legendary secrets · ${fd}/${SECRETS.length} discovered`;
  $("secrets").innerHTML=SECRETS.map((s,i)=>{const ok=found(s),lv=hintLv(i);
    return ok?`<li class="sec ok"><b>${s.name}</b> <span class="foot">discovered</span><div class="si">${s.ids.map(id=>chip(idName(id),"var(--accent)")).join("")}</div></li>`
      :lv?`<li class="sec"><i>${s.hint}</i><div class="si">${s.ids.map((id,k)=>k<lv-1?chip(idName(id),"var(--accent)"):chip("?","var(--dim)")).join("")}</div></li>`
      :`<li class="sec lock">??? <span class="foot">undiscovered</span></li>`}).join("");
}
const sn=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,"")+"M":n>=1e4?(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,"")+"k":String(n);
function renderStats(){
  const st=S.stats,zn=Object.fromEntries(ZONES.map(z=>[z[0],z[1]])),cell=(v,l)=>`<div class="sc"><b>${v}</b><span>${l}</span></div>`,grp=(t,h)=>`<p class="label">${t}</p><div class="sgrid">${h}</div>`;
  const kz=ZONES.map(z=>S.zoneKills[z[0]]|0),bossIds=ZONES.map(z=>z[2]);
  const heat=ZONES.filter(z=>st.heatBest[z[0]]!==undefined).map(z=>`${zn[z[0]].split(" ").pop()} ${st.heatBest[z[0]]}`).join(" · ")||"none yet";
  const fast=bossIds.filter(id=>st.fast[id]).map(id=>`<li><span>${ENEMIES[id].name}</span><b>${st.fast[id]} turn${st.fast[id]>1?"s":""}</b></li>`).join("")||`<li><span>No boss beaten yet</span></li>`;
  $("stats").innerHTML=grp("Combat",cell(sn(st.dealt),"damage dealt")+cell(sn(st.taken),"damage taken in battle")+cell(st.big?`${st.big}`:"-",st.big?`biggest hit · ${st.bigW}`:"biggest hit")+cell(st.crits,"critical hits")
      +cell(st.parries,"perfect parries")+cell(st.abil,"abilities used")+cell(st.sufd,"statuses suffered")+cell(st.cured,"statuses cured")+cell(st.deaths,"defeats")+cell(st.studied,"creatures studied"))
    +grp("Exploration",cell(kz.reduce((a,b)=>a+b,0),"creatures slain")+cell(st.elites,"elites slain")+cell(st.bosses,"bosses slain")+cell(st.exped,"expeditions done")
      +`<div class="sc wide"><b>${kz.join(" / ")}</b><span>kills by region (${ZONES.map(z=>z[1].split(" ").pop()).join(" / ")})</span></div>`
      +`<div class="sc wide"><b>${heat}</b><span>highest Heat cleared</span></div>`)
    +grp("Forge",cell(st.forged,"items forged")+cell(S.journal.length,"recipes found")+cell(st.legend,"legendaries forged")+cell(st.mishaps,"mishaps")+cell(st.fizzles,"fizzles")+cell(st.salvaged,"items salvaged")+cell(st.refined,"grades upgraded"))
    +grp("Economy",cell(sn(st.earned),"embers earned")+cell(sn(st.spent),"embers spent")+cell(S.embers,"embers now"))
    +`<p class="label">Records</p><ul class="rec2">${fast}<li><span>Dailies played / won</span><b>${st.dailies} / ${st.dailyWins}</b></li><li><span>Best daily</span><b>${st.dBest?dailyResult(st.dBest):"none yet"}</b></li></ul>`;
}
function renderCodex(){
  renderStats();
  const ids=Object.keys(ENEMIES),seenN=ids.filter(id=>S.seen[id]).length,mast=ids.filter(id=>S.seen[id]&&know(id).mastered).length;
  $("cxlabel").textContent=`Creature codex · ${seenN}/${ids.length} met · ${mast} mastered`;
  const groups=[...ZONES.map(z=>[z[0],z[1]]),["any","Anywhere"]];
  $("cxlist").innerHTML=groups.map(([z,zn])=>`<p class="zonehead">${zn}</p>`+Object.entries(ENEMIES).filter(([,e])=>e.zone===z).map(([id,E])=>{
    const seen=S.seen[id],k=know(id);
    return `<button class="cx${seen?"":" sil"}" data-codex="${id}" ${seen?"":"disabled"}>${portrait(id)}<span class="cn">${seen?E.name:"Unknown creature"}${E.boss?' <span class="foot">· boss</span>':""}</span>
      <span class="cpct ${k.mastered?"m":""}">${seen?(k.mastered?"Mastered":`${Math.round(k.pct*100)}%`):""}</span>
      <span class="cm">${seen?`Defeated ${S.kills[id]||0} · knowledge ${k.have}/${k.tot}`:"Not yet encountered"}</span></button>`}).join("")).join("");
}
function render(fresh){
  renderHeader();renderNav();renderGoal();
  if(S.view==="battle")renderBattle();
  if(S.view==="gear")renderGear();
  if(S.view==="forge"){renderBench();renderUpgrade();renderSkills();renderResult(fresh)}
  renderSatchels();
  if(S.view==="recipes")renderRecipes();
  if(S.view==="codex")renderCodex();
  if(sheet.mode==="item"&&sheet.id)openSheet(sheet.id,true,sheet.preview);else if(sheet.mode==="codex")openCodex(sheet.id,true);
  flushFx();
}
