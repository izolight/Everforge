// ================= GOALS =================
// Hint scrolls: S.hints holds secret indexes; level = how many times one appears (1 = the rumor, +1 per extra scroll = one more ingredient, up to all but one).
const found=s=>S.journal.some(j=>S.items[j.id]?.legendary&&S.items[j.id].name===s.name),hintLv=i=>Math.min(SECRETS[i].ids.length,S.hints.filter(x=>x===i).length);
const idName=id=>S.items[id]?iname(S.items[id]):isEss(id)?tx("{trait} Essence",{trait:trn(essTrait(id))}):tx(BASE[id][0]);
function giveHint(x){ // reveals something about a secret you haven't forged; x (0-1) picks among the candidates. Returns a log line, or "" if there is nothing left to learn
  const open=SECRETS.map((s,i)=>i).filter(i=>!found(SECRETS[i])&&hintLv(i)<SECRETS[i].ids.length),fresh=open.filter(i=>!hintLv(i)),c=fresh.length?fresh:open;
  if(!c.length)return"";const i=c[Math.floor((x==null?Math.random():x)*c.length)];S.hints.push(i);const s=SECRETS[i],lv=hintLv(i);
  return lv===1?tx('A hint scroll: "{hint}"',{hint:tx(s.hint)}):tx('A hint scroll sharpens a rumor ("{hint}"): one ingredient is {item}.',{hint:tx(s.hint).split(/[.,،，。]/)[0],item:idName(s.ids[lv-2])});
}
function rewardIds(r){return (r.items||[]).map(x=>{if(!x.startsWith("ess:"))return x;const [t,g]=x.slice(4).split("@");return essG(t,+g||3)})} // "ess:Fire" is Plain, "ess:Fire@4" Greater
function rewardText(r){const p=rewardIds(r).map(id=>iname(S.items[id]));if(r.xp)p.push(tx("{n} smith XP",{n:r.xp}));if(r.camp)p.push(tx("a campfire charge"));return p.join(", ")}
function newBounty(kind,exclude=[]){
  const rew=z=>`ess:${pick(ESS_POOL)}@${rollGrade(z)}`,top=S.unlocked.filter(z=>z!==RIFT_ZONE).at(-1); // reward essences roll a grade for the zone the bounty is in
  if(kind==="forge"||(!kind&&Math.random()<.3))return{kind:"forge",need:2,base:S.journal.length,reward:{items:[rew(top),rew(top)],xp:20,hint:Math.random()<.3?1:0}};
  const pool=Object.entries(ENEMIES).filter(([,e])=>!e.boss&&e.zone!=="any"&&e.zone!==RIFT_ZONE&&S.unlocked.includes(e.zone)&&!exclude.includes(e.name));
  const [id]=pick(pool),need=2+Math.floor(Math.random()*3);
  return{kind:"hunt",enemy:id,need,base:S.kills[id]||0,reward:{items:[rew(ENEMIES[id].zone),rew(ENEMIES[id].zone)],xp:15,camp:Math.random()<.35?1:0,hint:Math.random()<.3?1:0}};
}
function goal(){
  if(S.quest<TUTORIAL.length){const q=TUTORIAL[S.quest];
    let prog="";if(S.quest===6&&!S.kills.gnarlhorn){const m=S.maps.woods;prog=tx("map depth {a}/{b}",{a:m&&m.steps?m.dp+1:0,b:MAP_ROWS})}
    const wait=q.need&&!S.unl[q.need]?UNL[q.need].txt:q.ok&&!q.ok(S)?q.wait:""; // a step whose system is not open yet says how to open it
    return{step:tx("Step {n} of {t}",{n:S.quest+1,t:TUTORIAL.length}),short:questChapter(),text:wait?tx("Next: {step}",{step:tx(wait)}):tx(q.text),tab:wait?"battle":q.tab,done:!wait&&q.done(S),reward:q.reward,prog}}
  if(!S.bounty)return{step:tx("Bounty"),text:tx("Choose a bounty to support your build."),tab:"battle",choose:true};
  const b=S.bounty;
  if(b.kind==="hunt"){const n=Math.min(b.need,(S.kills[b.enemy]||0)-b.base),E=ENEMIES[b.enemy];
    return{step:tx("Bounty"),text:tx("Defeat {n} {name} in {zone}.",{n:b.need,name:tx(b.need>1?E.plural:E.name),zone:zoneName(E.zone)}),tab:"battle",done:n>=b.need,reward:b.reward,prog:`${n}/${b.need}`,zone:E.zone}}
  const n=Math.max(0,Math.min(b.need,S.journal.length-b.base)); // a reforge can splice a journal row: never below 0
  return{step:tx("Bounty"),text:tx("Forge {n} new recipes.",{n:b.need}),tab:"forge",done:n>=b.need,reward:b.reward,prog:`${n}/${b.need}`};
}
function claimGoal(){
  const g=goal();if(!g.done)return;
  rewardIds(g.reward).forEach(id=>addItem(id));if(g.reward.xp)S.xp+=g.reward.xp;if(g.reward.camp)S.camp=Math.min(3,S.camp+g.reward.camp);
  const hm=g.reward.hint?giveHint():"";
  if(S.quest<TUTORIAL.length)S.quest++;else{S.bounty=null;S.bountyChoices=[];}
  save();render();toast(tx("Reward: {list}.",{list:[rewardText(g.reward),hm?tx("a hint scroll"):""].filter(Boolean).join(", ")})+(hm?" "+hm:""));
}

function questChapter(){
  if(S.quest<3)return tx("Forge your first enchanted weapon");
  if(S.quest<7)return tx("Prepare for the first boss");
  if(S.quest<10)return tx("Master your combat style");
  return tx("Beyond the Woods");
}

const openingWeaponReady=()=>{const w=gearOf("main");return !!(w&&(w.traits.Fire||w.traits.Sunfire))};
function showBounties(){
  if(S.quest<TUTORIAL.length||S.bounty)return;
  if(S.bountyChoices?.some(b=>b.kind==="hunt"&&!ENEMIES[b.enemy]))S.bountyChoices=[];
  if(!S.bountyChoices?.length){const hunt=newBounty("hunt");S.bountyChoices=[hunt,newBounty("forge"),newBounty("hunt",[ENEMIES[hunt.enemy].name])];save()}
  sheet.mode="bounties";sheet.id=null;
  $("sheetIn").innerHTML=`<h2>${tx("Choose bounty")}</h2><p>${tx("Progress starts when you accept. Rewards stay the same until you complete a bounty.")}</p><div class="bounty-options">${S.bountyChoices.map((b,i)=>`<section><h3>${b.kind==="forge"?tx("Forge {n} new recipes.",{n:b.need}):tx("Defeat {n} {name} in {zone}.",{n:b.need,name:tx(ENEMIES[b.enemy].plural),zone:zoneName(ENEMIES[b.enemy].zone)})}</h3><p>${tx("Reward: {list}",{list:rewardText(b.reward)})}${b.reward.hint?" · "+tx("a hint scroll"):""}</p><button class="btn" data-act="bounty" data-index="${i}">${tx("Accept bounty")}</button></section>`).join("")}</div><button class="btn" data-act="close">${tx("Close")}</button>`;
  showSheet();
}
function chooseBounty(i){
  if(S.quest<TUTORIAL.length||S.bounty||!S.bountyChoices?.[i])return;
  const b=S.bountyChoices[i];S.bounty={...b,base:b.kind==="forge"?S.journal.length:S.kills[b.enemy]||0};
  S.bountyChoices=[];closeSheet();save();render();
}
function pinGoal(kind,id){
  if(kind==="recipe"&&!S.journal.some(j=>j.id===id))return;
  if(kind==="rumor"&&(!SECRETS[id]||!hintLv(id)))return;
  S.pinned={kind,id};save();render();$("pinnedGoal").open=true;$("pinnedGoal").scrollIntoView({block:"start"});
}
function pinnedInfo(){
  const p=S.pinned;if(!p)return null;
  if(p.kind==="recipe"){const it=S.items[p.id];return it?{name:iname(it),ids:it.recipeIds||[],unknown:0,complete:false}:null}
  const sc=SECRETS[p.id];if(!sc)return null;
  const complete=found(sc),n=complete?sc.ids.length:Math.max(0,hintLv(p.id)-1);
  return{name:complete?tx(sc.name):tx(sc.hint),ids:sc.ids.slice(0,n),unknown:sc.ids.length-n,complete};
}
// Source hints use only a pinned recipe or the revealed part of a rumor.
// They name possible drops, never promise a particular loot roll or grade.
function ingredientSources(id){
  const it=S.items[id],base=plainId(id),es=isEss(id),tr=es?essTrait(id):null;
  if(it?.crafted&&!it.pat)return `<button class="btn sm" data-goal-recipe="${id}">${tx("Track its recipe")}</button>`;
  if(it&&((isGear(it)&&!it.crafted)||it.pat)){
    const bp=BLUEPRINTS[base];
    if(bp&&!hasBp(base))return `<p>${tx("Study {name} to learn this blueprint.",{name:tx(ENEMIES[bp.e].name)})}</p><button class="btn sm" data-goal-tab="battle">${tx("Go to {tab}",{tab:viewName("battle")})}</button>`;
    const mats=it.pat?it.recipeIds:stdMats(base)||[];
    return `<p>${tx("Forge from materials: {items}.",{items:esc(mats.map(idName).join(", "))})}</p><button class="btn sm" data-goal-tab="forge">${tx("Go to {tab}",{tab:viewName("forge")})}</button>${[...new Set(mats)].map(m=>`<details><summary>${esc(idName(m))}</summary>${ingredientSources(m)}</details>`).join("")}`;
  }
  const deconTraits=it=>canDecon(it)?deconYield(it).frag.map(f=>f[0]):[];
  const candidates=es?Object.keys(BASE).filter(b=>deconTraits(baseItem(b)).includes(tr)):isBaseMat(id)?Object.keys(DECON).filter(b=>DECON[b][0]===base):[base];
  const sources=ZONES.filter(z=>S.unlocked.includes(z[0])).map(z=>{
    const foes=Object.entries(ENEMIES).filter(([,e])=>e.zone===z[0]&&e.drops.some(([d])=>candidates.includes(d)));
    if(!foes.length)return "";
    const names=foes.slice(0,3).map(([,e])=>tx(e.name)).join(", ");
    return `<li><button class="btn sm" data-source-zone="${z[0]}" ${busy()||S.run==="daily"?"disabled":""}>${tx("Explore {zone}",{zone:zoneName(z[0])})}</button> ${esc(names)}${foes.length>3?"…":""}</li>`;
  }).filter(Boolean);
  const held=es?Object.keys(S.inv).filter(b=>S.inv[b]>0&&!itemLocked(b)&&!eqCount(b)&&((canDecon(S.items[b])&&deconYield(S.items[b]).frag.some(f=>f[0]===tr&&f[2]===gradeOf(id)))||(salvageYield(S.items[b]).includes(tr)&&salvGrade(S.items[b])===gradeOf(id)))):[];
  const salvage=es?`<p>${tx("Deconstruct {items} for {trait} essence fragments; grades and bonus essences vary.",{items:esc(candidates.slice(0,3).map(idName).join(", ")||trn(tr)),trait:trn(tr)})}</p>`:"";
  return `${isBaseMat(id)?`<p>${tx("Deconstruct {items} into this material.",{items:esc(candidates.map(idName).join(", "))})}</p>`:""}${salvage}${held.length?`<p>${tx("In your satchel: {items}.",{items:esc(held.slice(0,3).map(idName).join(", "))})} <button class="btn sm" data-goal-tab="gear">${tx("Go to {tab}",{tab:viewName("gear")})}</button></p>`:""}${sources.length?`<ul class="source-list">${sources.join("")}</ul><p class="foot">${tx("Possible drops; loot and grades vary.")}</p>`:`<p>${tx("Explore further regions or seek essences from chests, shrines and affixed foes.")}</p>`}`;
}
function renderPinnedGoal(){
  const el=$("pinnedGoal"),p=pinnedInfo();el.hidden=!p||inBattle()||S.view==="settings";if(!p)return;
  const need={};p.ids.forEach(id=>need[id]=(need[id]||0)+1);
  const owned=Object.entries(need).reduce((n,[id,k])=>n+Math.min(k,S.inv[id]||0),0);
  el.innerHTML=`<summary>${tx("Pinned goal")}: ${esc(p.name)} <span>${owned}/${p.ids.length+p.unknown}</span></summary><div class="pinned-content">${p.complete?`<p>${tx("Legendary discovered!")}</p>`:""}${Object.entries(need).map(([id,n])=>`<section><h3>${esc(idName(id))} · ${Math.min(n,S.inv[id]||0)}/${n}</h3>${(S.inv[id]||0)>=n?`<p>${tx("You have it.")}${itemLocked(id)?" "+tx("Unlock these items before crafting."):""}</p>`:ingredientSources(id)}</section>`).join("")}${p.unknown?`<p>${tx("{n} ingredients are still unknown. Find hint scrolls in chests, shrines, riddles, boss loot or bounties.",{n:p.unknown})}</p>`:""}<div class="actions"><button class="btn sm" data-goal-tab="recipes">${tx("Go to {tab}",{tab:viewName("recipes")})}</button><button class="btn sm" data-unpin>${tx("Unpin goal")}</button></div></div>`;
}
