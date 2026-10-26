// ================= RENDER: EXPLORE / BATTLE =================
// The HUDs, the foe stage and log, the map head, the Rift and daily cards, the region chips, the battle view and its advice
const ci=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${t.length?tt(...t):""}>${ics}${v==null||v===""?"":`<b>${v}</b>`}</span>`; // icon chip: icon + value, words in the tip
const stChip=(s,x)=>ci(FAM[STATUS[s].el]||"var(--bad)",famIc(STATUS[s].el,"s"),`${x.n>1?x.n+"x ":""}${x.t}t`,tx("{status}, {t} turns left",{status:`${STATUS[s].n}${x.n>1?` x${x.n}`:""}`,t:x.t}),cap(STATUS[s].tip)+".");
function youHud(){ // compact: weapon, HP bar, then icon chips (words in tips)
  const P=pstats(),B=S.battle,live=B&&!B.over,bite=live&&B.heat>=5,red=Math.round(heatRed(P,bite?B:null)*100);
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
    B.heat?ci("var(--ember)",ic("heat","s"),B.heat,tx("Heat {n}",{n:B.heat}),HEAT[B.heat-1].name):"",kn.mastered&&ci("var(--verd)",ic("renown","s"),"",tx("Mastered"),tx("You deal {p}% more damage to it.",{p:MASTERY_PCT}))].filter(Boolean).join("");
  return `<div class="stage${RC?" rar":""}" id="enemyHud" style="--el:${FAM[B.el]}${RC?`;--rc:${RC.col}`:""}">
    <button class="${cls}" id="foeArt" data-codex="${B.id}" aria-label="${esc(fullName(B))}${RC?`, ${esc(lc(RC.name))}, ${esc(live.map(a=>tx(AFX[a].n)).join(", "))}`:""}. ${esc(tx("Open codex entry"))}">${portrait(B.id,{el:B.el,afx:live,aura:RC&&RC.col,rare:rarOf(B)==="rare",frozen:B.frozen,burn:!!B.burn&&!B.over,poison:B.poison>0&&!B.over,phased:B.phased,stun:B.stun>0&&!B.over,weak:B.shred>0&&!B.over,bleed:!!B.bleed&&!B.over,shield:B.wd>0&&!B.over})}</button>
    <div class="foeinfo"><div class="fname"><span class="fn"${RC?` style="color:${RC.col}"`:""}>${bname(B)}</span>${B.title&&!B.split?`<span class="ti" style="color:${RC.col}">${btitle(B)}</span>`:""}<span class="bd">${bd}</span></div>
      <div class="hpline">${hpBar(B.hp,B.max,"foe")}<span class="hpnum">${Math.max(0,B.hp)}<small>/${B.max}</small></span></div>
      ${live.length?`<div class="chips afx">${live.map(a=>afxChip(a,B)).join("")}</div>`:""}
      <div class="chips">${kw.map(f=>ci(FAM[f],ic("weak","s")+famIc(f,"s"),"",tx("Weak to {fam}",{fam:famN(f)}),tx("Takes 50% more from it."))).join("")}${kr.map(f=>ci(FAM[f],ic("resist","s")+famIc(f,"s"),"",tx("Resists {fam}",{fam:famN(f)}),tx("Takes 40% less from it."))).join("")}${unknown>0?`<span class="chip unk" ${tt(tx("{n} unknown",{n:unknown}),tx("Weaknesses and resistances you have not found yet. Hit it, or Study."))}><b>?</b>${unknown}</span>`:""}${st}</div></div></div>`;
}
function logBlock(B){
  const entry=(l,tag)=>`<${tag} class="ll log-${l.c||"note"}">${ic(({you:"attack",foe:"hit",good:"guard",big:"crit",lore:"study"})[l.c]||"turn","s")}<span>${esc(l.t)}</span></${tag}>`; // a log line is text, never markup
  const last=B.log.slice(-2).map(l=>entry(l,"span")).join("");
  return `<details class="logd" id="logd"${logOpen?" open":""}><summary>${last}<span class="more">${ic("list","s")}</span></summary><ul class="blog" id="blog">${B.log.map(l=>entry(l,"li")).join("")}</ul></details>`;
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
  const ab=dl?`<button class="ibt${isArmed("daily")?" warn":""}" id="dailyAbandon" aria-label="${esc(isArmed("daily")?tx("Tap again to abandon"):tx("Abandon the daily"))}" ${tt(isArmed("daily")?tx("Tap again to abandon"):tx("Abandon the daily"),isArmed("daily")?tx("No retry today."):tx("Tap twice. You get no retry today."))}>${ic(isArmed("daily")?"warn":"close")}</button>`:"";
  const sel=!dl&&hz.max&&isUnl("heat")&&heatOpen?`<div class="hpanel"><div class="hsel" role="group" aria-label="${esc(tx("Heat for new expeditions"))}">${Array.from({length:hz.max+1},(_,n)=>`<button class="hchip" data-heat="${n}" aria-pressed="${hz.sel===n}" aria-label="${esc(n?tx("Heat {n}",{n}):tx("Normal"))}" ${n?tt(HEAT[n-1].name,HEAT[n-1].desc):tt(tx("Normal"),tx("Normal difficulty."))}>${n?ic("heat","s")+n:"0"}</button>`).join("")}</div>
    <p class="foot">${hz.sel?tx("Heat {n}, {name}: {desc} In all: {tot}.",{n:hz.sel,name:HEAT[hz.sel-1].name,desc:HEAT[hz.sel-1].desc,tot:heatTot(hz.sel)}):tx("New expeditions: normal difficulty.")}${hz.sel!==h&&!m.cleared?" "+tx("This map is Heat {n}; the choice applies to your next expedition here.",{n:h}):""}</p></div>`:"";
  return `<div class="mhead"><div class="mr"><span class="yg" ${tt(tx("You"),P.main?iname(P.main):tx("Bare fists"))}>${heroMini()}</span><div class="hpline" id="youHud" ${tt(`${tx("HP")} ${S.hp}/${P.maxHp}`)}>${hpBar(S.hp,P.maxHp)}<span class="hpnum">${S.hp}<small>/${P.maxHp}</small></span></div>
    ${ci("var(--fg)",stIc("atk","s"),P.atk,`${STAT_NAMES.atk} ${P.atk}`,tx("Strike power of your main hand."))}${ci("var(--fg)",stIc("def","s"),`${Math.round(P.red*100)}%`,`${STAT_NAMES.def} ${P.def}`,tx("Cuts the damage you take by {p}%.",{p:Math.round(P.red*100)}))}</div>
    <div class="mr">${torch}${amb}${badges}${campBtn()}${ab}${help}</div>${sel}<p class="mnow${m.ls===m.steps&&m.steps?" mnew":""}">${S.onboarding===3?tx(openingWeaponReady()?"Step onto an empty tile to try your enchanted weapon.":"Equip your fire weapon in Gear to try its effects."):S.onboarding===2?tx("Deconstruct the Ember Coal. Then research a technique to put the Fire essence into your sword."):esc((m.log||[]).slice(-1)[0]||tx("Tap a glowing tile next to you to set out."))}</p></div>`;
}
function riftCard(){ // the Rift: the region you stand in, its depth and your record
  if(S.zone!==RIFT_ZONE)return "";
  const r=S.rift||{},nm=r.name?tx(r.name):tx("unknown");
  return `<div class="dcard rift"><div class="dtop"><b>${ic("mystery")} ${tx("The Wanderer's Rift")}</b><span class="dline"><span>${tx("Region: {name}",{name:esc(nm)})}</span><span class="heat">${tx("Depth {n}",{n:r.depth||1})}</span><span class="heat">${tx("Best {n}",{n:r.best||0})}</span></span>
    ${helpBtn(tx("The Wanderer's Rift"),tx("Every expedition rolls a new region: a biome, ten wild creatures and a master."),tx("Wild creatures carry affixes of their own, and the master carries three."),tx("Beat the master to go one depth deeper."))}</div>
    <p class="foot">${tx("A new region every time: ten wild creatures and a master. Beat the master, then descend.")}</p>
    ${r.cleared?`<div class="actions"><button class="btn primary sm grow" id="riftNext">${tx("Descend deeper")}</button></div>`:""}</div>`}
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
  const top=w.getBoundingClientRect().top+scrollY,room=Math.max(240,Math.min(380,innerHeight-nav-90-top)),min=45*m.w+3,max=Math.max(min,Math.min(680,w.clientWidth-4));
  mp.style.setProperty("--mw",Math.max(min,Math.min(max,Math.floor(room*m.w/m.h)))+"px");w.style.maxHeight=room+"px";w.dataset.pan=mp.offsetWidth>w.clientWidth||mp.offsetHeight>w.clientHeight?"1":"0";
}
function heroView(){
  const w=document.querySelector(".mapwrap"),h=w?.querySelector(".tl.here");if(!h)return;
  const a=w.getBoundingClientRect(),b=h.getBoundingClientRect();
  w.scrollTo({left:w.scrollLeft+b.left-a.left+(b.width-w.clientWidth)/2,top:w.scrollTop+b.top-a.top+(b.height-w.clientHeight)/2,behavior:"instant"});
}
function renderBattle(){
  $("zones").innerHTML=ZONES.map(([id,name,boss],i)=>{const open=zoneOpen(id),cleared=S.kills[boss]>0;
    const held=busy()||S.run==="daily",why=held?(S.run==="daily"?tx("Finish or abandon the daily first."):tx("Finish the fight first.")):""; // a chip you cannot use says why
    return `<button class="zone" data-zone="${id}" aria-pressed="${S.zone===id}" ${!open?"disabled":held?`aria-disabled="true" data-tap ${tt(tx(name),why)}`:""}>${tx(name)}${cleared?" ✓":""}${open?"":` · ${tx("beat {boss}",{boss:shortName(ZONES[i-1][2])})}`}</button>`}).join("");zoneView();
  const a=$("arena"),B=S.battle,cont=`<div class="actions"><button class="btn primary grow" id="cont">${tx("Back to the map")}</button></div>`;
  if(S.event){const ev=S.event;
    a.innerHTML=`<div class="event">${ev.icon?`<svg class="evart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G[ev.icon]}</svg>`:""}<h2>${esc(ev.title)}</h2><p class="empty">${esc(ev.text)}</p></div>
      ${ev.loot.length?`<div class="loot" style="justify-content:center">${lootChips(ev.loot)}</div>`:""}${ev.stock?shopHtml(ev):""}
      ${ev.sc?`<p class="scrl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G.scroll}</svg><span>${esc(ev.sc)}</span></p>`:""}
      ${ev.choices.length?`<div class="actions">${ev.choices.map(([c,l],i)=>`<button class="btn ${i===0?"primary":""} grow" data-choice="${c}">${esc(l)}</button>`).join("")}</div>`:cont}${youHud()}`;return}
  if(!B){
    const m=curMap(),zi=zoneIdx(S.zone),bossId=ZONES[zi][2],next=ZONES[zi+1];
    const head=m.cleared?`<div class="cleared"><b>${ic("ok")} ${tx("{zone} cleared",{zone:tx(ZONES[zi][1])})}</b>${helpBtn(tx("{boss} has fallen",{boss:shortName(bossId)}),next&&zoneOpen(next[0])?tx("Explore a fresh map here for more loot, or move on to {next}.",{next:tx(next[1])}):tx("Explore a fresh map here for more loot."))}
        <div class="actions"><button class="btn sm grow" id="again">${tx("New expedition")}</button>${next&&zoneOpen(next[0])?`<button class="btn primary sm grow" data-zone="${next[0]}">${tx("Travel to {zone}",{zone:tx(next[1])})}</button>`:""}</div></div>`:"";
    a.innerHTML=`${mapHead()}${head}${mapHtml()}${riftCard()}${dailyCard()}`;fitMap();heroView();return}
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
    const intent=B.frozen?`<div class="intent frozen" ${tt(tx("Next"),tx("Frozen. It will lose its turn."))}><b>${tx("NEXT")}</b>${ci(FAM.ice,famIc("ice","s"),tx("Frozen"),tx("Frozen"),tx("It will lose its turn."))}${bm}${fzc}</div>`
      :sp?`<div class="intent special${sp.kind==="heal"?" healing":""}" ${tt(tx("Next: {name}",{name:known?tx(sp.name):tx("something big")}),tx("It's {tell}.",{tell:tx(sp.tell)}),[dmgTxt,isUnl("parry")?sp.kind==="heal"?tx("Parry ({p}%) to interrupt it.",{p:pc}):tx("Guard, or Parry ({p}%) to turn it back!",{p:pc}):tx("Guard to soften it.")].filter(Boolean).join(" "))}><b>${tx("NEXT")}</b><span class="in">${ic(sp.kind==="heal"?"f_heal":"warn","s")} ${known?tx(sp.name):tx("Something big")}</span>${sp.kind==="heal"?"":dm}${isUnl("parry")?ci("var(--accent)",ic("parry","s"),`${pc}%`,tx("Parry {p}%",{p:pc}),tx("Beat a telegraphed special: negate it and riposte.")):""}${bm}${fzc}</div>`
      :`<div class="intent" ${tt(tx("Next: a normal attack"),dmgTxt,tx("Parrying now would backfire."))}><b>${tx("NEXT")}</b><span class="in">${ic("attack","s")} ${tx("Attack")}</span>${dm}${isUnl("parry")?`<span class="chip no">${ic("parry","s")}<b>${tx("no parry")}</b></span>`:""}${bm}${fzc}</div>`;
    const cons=Object.keys(S.inv).filter(id=>S.inv[id]>0&&grp(S.items[id])==="consumable");
    const canStudy=unknownFacts(B.id).length>0||canTrainParry(B)||(hasAfx(B,"elusive")&&(B.sty||0)<AFX_T.dodge.studyMax),abs=abKeys(P).filter(abOn),abBtn=k=>{const A=ABILITIES[k],c=(B.cd||{})[k]||0;return `<button class="btn act ab" data-ability="${k}" ${c>0?`aria-disabled="true" data-tap`:""} aria-label="${esc(A.name+(c>0?", "+txn("ready in {n} turn","ready in {n} turns",c):"")+". "+A.desc)}" ${tt(A.name,c>0?txn("Ready in {n} turn.","Ready in {n} turns.",c):tx("Cooldown {n} turns.",{n:A.cd}),A.desc)}>${icon(A.icon)}<span>${A.name}</span>${B.braced&&!c?`<small>${tx("Empowered: +{p}% damage",{p:pcn(GUARD_T.braced)})}</small>`:""}${c>0?`<i class="cdb">${ic("cooldown","s")}${c}</i>`:""}</button>`};
    body=`${intent}${buildGuidance(B,P)}${dmgTxt&&!B.frozen&&sp?.kind!=="heal"?`<p class="combat-advice">${dmgTxt} ${tx("Before Guard; ongoing status damage is separate.")}</p>`:""}${youHud()}${introHtml(curIntro(true))}
      <div class="acts n${abs.length}"><button class="btn primary act" id="atk" ${tt(tx("Attack"),tx("Strike with your main hand."))}>${icon("attack")}<span>${tx("Attack")}</span><small>${B.braced?tx("Empowered: +{p}% damage",{p:pcn(GUARD_T.braced)}):tx("Strike with your weapon")}</small></button>${abs.map(abBtn).join("")}<button class="btn act${B.off>0?" impaired":""}" id="guard" ${tt(tx("Guard"),tx("Cuts every hit in the enemy's action by {p}% and blocks new statuses.",{p:pcn(GUARD_T.cut)}),tx("Gain Braced: your next Attack or ability deals {p}% more damage. Does not stack. Existing statuses still tick.",{p:pcn(GUARD_T.braced)}),B.off>0?tx("A mistimed parry cost you your guard."):"")}>${icon("guard")}<span>${tx("Guard")}</span><small>${B.off>0?tx("Off balance"):tx("−{cut}% hit · +{boost}% next",{cut:pcn(GUARD_T.cut),boost:pcn(GUARD_T.braced)})}</small></button>${isUnl("parry")?`<button class="btn act${sp&&!B.off&&!B.frozen?" opportunity":""}${B.off>0?" impaired":""}" id="parry" ${tt(tx("Parry {p}%",{p:pc}),tx("Beat a telegraphed special: negate it and riposte ({p}% to land). Mistimed: +{f}% damage and a lost guard.",{p:pc,f:pcn((PARRY_FAIL-1)*100)}),parryTip,B.off>0?tx("Off balance: you cannot parry this turn."):!sp?tx("Parrying now would backfire."):"")}>${icon("parry")}<span>${tx("Parry")} ${pc}%</span><small>${B.off>0?tx("Off balance"):!sp||B.frozen?tx("Wrong timing"):tx("Fail: +{f}% damage",{f:pcn((PARRY_FAIL-1)*100)})}</small></button>`:lockAct("parry")}
      ${isUnl("study")?`<button class="btn act" id="study" ${canStudy?"":`aria-disabled="true" data-tap`} ${tt(canStudy?tx("Study"):tx("Known"),canStudy?tx("Learn one fact about it, but it costs your turn."):tx("You know everything it can teach."),tx("Parry training {n}/{max}: Study raises your chance against this form's special by {p}% per rank, across battles.",{n:parryLevel(B),max:PARRY_T.levels,p:pcn(PARRY_T.study)}),hasAfx(B,"elusive")?tx("Also lowers the dodge of an Elusive foe by {p}% ({a} of {b} used).",{p:AFX_T.dodge.study,a:B.sty||0,b:AFX_T.dodge.studyMax}):"")}>${icon("study")}<span>${canStudy?tx("Study"):tx("Known")}</span><small>${tx("Learn · uses a turn")}</small></button>`:lockAct("study")}<button class="btn act" id="flee" ${tt(tx("Flee"),tx("Try to get away. A creature from the map stays alive and dazed."))}>${icon("flee")}<span>${tx("Flee")}</span><small>${tx("Escape may fail")}</small></button></div>
      ${cons.length?`<div class="sqg cons">${cons.map(id=>{const it=S.items[id],hint=useHint(it);return `<button class="sq" style="${rcol(it)}" data-use="${id}" aria-label="${esc(tx("Use {item}",{item:iname(it)})+(S.inv[id]>1?", "+tx("{n} held",{n:S.inv[id]}):"")+". "+hint)}" ${tt(iname(it),hint,tx("You hold {n}.",{n:S.inv[id]}))}>${glyph(it)}${S.inv[id]>1?`<span class="sq-n">${S.inv[id]}</span>`:""}<span class="sq-p">${esc(hint.split(" · ")[0])}</span></button>`}).join("")}</div>`:""}
      ${logBlock(B)}`;
  }else{
    const loot=B.over==="won"?`<div class="loot"><span class="label" ${tt(tx("Loot"),tx("Tap an item to inspect it."))}>${ic("bag")}</span>${lootChips(B.loot)}${B.emb&&isUnl("peddler")?`<span class="chip emb">${icon("ember")}+${B.emb}</span>`:""}</div>`:"";
    body=`${loot}${youHud()}<div class="actions"><button class="btn primary grow" id="cont">${tx("Back to the map")}</button>${B.over==="won"?`<button class="btn grow" id="toforge">${tx("Go to the forge")}</button>`:""}</div>${logBlock(B)}`;
  }
  a.innerHTML=`${B.over?buildMomentHtml(B):""}${B.opening===2&&!B.over?`<p class="combat-advice">${tx("Try your new weapon. Watch its effects after each strike.")}</p>`:""}${foeStage(B)}${body}`;
  const bl=$("blog");if(bl)bl.scrollTop=bl.scrollHeight;
}
function useHint(it){const st=statsOf(it),p=[];if(st.heal>0)p.push(tx("+{n} HP",{n:medHeal(it)}));const d=Math.round((st.atk+st.mag)*.6);if(d>=3)p.push(tx("{n} dmg",{n:d}));const c=cures(it.traits);if(c.length)p.push(tx("cures {list}",{list:c.map(s=>lc(STATUS[s].n)).join(", ")}));return p.join(" · ")||tx("no effect")}
function buildMomentHtml(B){
  return B.buildMoment&&B.turn<=B.buildMoment.turn+1?`<p class="build-moment" role="status">${esc(B.buildMoment.text)}</p>`:"";
}
function buildGuidance(B,P){
  const ready=abKeys(P).find(k=>abOn(k)&&!(B.cd||{})[k]);
  const hint=B.braced?tx("Guard → {action}: +{p}% damage on your next strike.",{action:ready?ABILITIES[ready].name:tx("Attack"),p:pcn(GUARD_T.braced)}):"";
  const ef=eff(withInnate(P.main?.traits||{}),B),weak=ef.k==="weak"&&cx(B.id).weak.includes(ef.f)?tx("{trait} → known weakness: +50% strike damage.",{trait:trn(ef.t)}):"";
  return `${buildMomentHtml(B)}${hint||weak?`<p class="combat-advice build-opportunity">${[hint,weak].filter(Boolean).join(" ")}</p>`:""}`;
}
