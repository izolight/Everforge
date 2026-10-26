// ================= RENDER: FORGE TAB =================
// The craft preview line, skills, the crucible bench, patterns and the forge result
// Worn items a fizzle would take (the bench holds the equipped copy or the last copy)
const equippedRisk=items=>[...new Set(items.map(i=>i.id))].filter(id=>(S.inv[id]||0)-benchCount(id)<eqCount(id)).map(id=>esc(iname(S.items[id])));
// Forge preview line: the skill that makes this, success / mishap / fizzle odds, and the tier cap
function craftLine(r,items){
  const risk=r.fiz>0?equippedRisk(items):[],sk=SKILLS[r.skill],cp=SK_CAP[r.lv-1],b=r.blocked,ch=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${v}</b></span>`;
  return `<div class="cline${b?" blocked":""}"><div class="chips">${isUnl("skills")?ch("var(--accent)",skIcon(r.skill),tx("Lv {n}",{n:r.lv}),tx("{skill} Lv {lv}",{skill:sk.name,lv:r.lv}),tx("The skill that makes this.")):""}${ch("var(--muted)",ic("tier","s"),`${r.item.tier}/${cp}`,tx("Tier {n}, your cap is {c}",{n:r.item.tier,c:cp}),tx("The result's tier against the highest tier your skill can reach."))}
    ${b?"":ch("var(--up)",ic("ok","s"),`${100-r.fail}%`,tx("{n}% clean",{n:100-r.fail}),tx("A clean forge gives exactly the item previewed."))+ch("var(--accent)",ic("warn","s"),`${r.mis}%`,tx("{n}% mishap",{n:r.mis}),tx(isUnl("peddler")?"A mishap gives a flawed copy (Cursed, Brittle, Rust or Weakened) that you can reforge for embers.":"A mishap gives a flawed copy (Cursed, Brittle, Rust or Weakened)."))+ch("var(--down)",ic("smoke","s"),`${r.fiz}%`,tx("{n}% fizzle",{n:r.fiz}),tx(isUnl("peddler")?"A fizzle loses the ingredients but returns some embers.":"A fizzle loses the ingredients."))
      +helpBtn(tx("Forge odds"),S.journal.length?tx("Difficulty {d} against your skill {lv}{reach}. The higher your skill, the fewer mishaps and fizzles.",{d:r.diff,lv:r.lv,reach:r.diff-r.lv>2?tx(", a reach for you"):""})+(r.prec?" "+tx("Precision trims {n} points off the failure chance.",{n:r.prec}):""):tx("Your first forge never fails."))}</div>
    ${b?`<p class="warn-text">${blockText(b)}</p>`:""}
    ${risk.length?`<p class="warn-text">${risk.length>1?tx("{list} are equipped. A fizzle would destroy them; tap Forge twice to confirm.",{list:risk.join(tx(" and "))}):tx("{list} is equipped. A fizzle would destroy it; tap Forge twice to confirm.",{list:risk[0]})}</p>`:""}</div>`;
}
const skIcon=k=>`<svg class="ski" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${G[SKILLS[k].g]}</svg>`;
function renderSkills(){
  const su=isUnl("skills");$("skd").hidden=!su;$("sklock").hidden=su;if(!su){$("sklock").innerHTML=lockRow("skills");return}
  $("sksum").innerHTML=`${ic("hammer","s")} ${tx("Crafting skills")}${helpBtn(tx("Crafting skills"),tx("Every kind of thing has its own skill. A craft trains the skill of what you make, and a little of each other kind you put in. A higher skill raises the tier you can reach and lowers the chance a forge goes wrong."))}`;
  $("skills").innerHTML=Object.entries(SKILLS).map(([k,sk])=>{const l=skLv(k),cur=SK_LV[l-1],nxt=SK_LV[l],x=skXp(k);
    const f=Math.round(Math.max(FAIL.min,Math.min(FAIL.max,FAIL.base+FAIL.slope*(CRAFT.base+CRAFT.tier-l)))),crafts=sk.forms.length>0; // a plain tier-2 craft with no clashes; salvaging (no forms) never fails
    return `<div class="sk" ${tt(tx("{skill} Lv {lv}",{skill:sk.name,lv:l}),tx("Makes {cats}.",{cats:sk.cats}),nxt?tx("{a}/{b} XP to Lv {n}.",{a:x-cur,b:nxt-cur,n:l+1}):tx("Highest level reached."),crafts?tx("Tier cap {c}; about {f}% base failure on a plain tier-2 craft.",{c:SK_CAP[l-1],f}):tx("Tier cap {c}. Salvaging is never blocked: above the cap, materials come one grade lower.",{c:SK_CAP[l-1]}))}>${skIcon(k)}<div class="skb"><span class="sn"><b>${sk.name}</b> <span class="foot">${tx("Lv {n}",{n:l})}</span></span>
      <div class="bar know"><i style="width:${nxt?Math.min(100,(x-cur)/(nxt-cur)*100):100}%"></i></div></div><span class="skc"><span>${ic("tier","xs")}${SK_CAP[l-1]}</span>${crafts?`<span>${ic("warn","xs")}${f}%</span>`:""}</span></div>`}).join("");
}
function renderBench(){
  const max=maxInputs(),parts=[],items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  for(let i=0;i<(level()>=2?4:3);i++){
    if(i>0)parts.push('<span class="plus" aria-hidden="true">+</span>');
    if(i>=max){parts.push(`<div class="slot locked" ${tt(tx("Slot {n}",{n:i+1}),tx("Unlocks at Smith Lv {n}",{n:INPUT_LV[i-2]}))}>${ic("lock")}<small>${tx("Lv {n}",{n:INPUT_LV[i-2]})}</small></div>`);continue}
    const it=items[i];
    parts.push(it?`<button class="slot full${!chk.ok&&chk.bad?.id===it.id?" bad":""}" style="${rcol(it)}" data-slot="${i}" aria-label="${esc(tx("Remove {item}",{item:iname(it)}))}" ${itemTip(it,tx("Tap to take it out."))}>${glyph(it)}</button>`:`<div class="slot" role="img" aria-label="${esc(tx("Empty slot"))}">${ic("plus","l")}</div>`);
  }
  $("slots").className=level()>=2?"slots s4":"slots";$("slots").innerHTML=parts.join("");
  let hint="",crafting=null;const miss=chk.ok&&items.length>1?actionOk(items):[]; // techniques this craft needs and you lack
  if(!items.length)hint=`<p class="foot" style="text-align:center">${tx("Tap items below to add them.")}</p>`;
  else if(!chk.ok)hint=`<p class="warn-text">${esc(chk.reason)}</p>`;
  else if(items.length===1)hint=`<p class="foot">${tx("{item} takes {list}.",{item:esc(iname(items[0])),list:acceptsText(items[0])})}</p>`;
  else if(miss.length)hint=`<p class="warn-text">${ic("lock","s")} ${techWhy(miss)}</p>${isUnl("research")?`<div class="actions"><button class="btn sm" data-gores="${miss[0]}">${ic("research","s")} ${tx("Open Research")}</button></div>`:""}`;
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
    if(r.mw>=0)hint+=`<p class="warn-text">${ic("warn","s")} ${mwWarn()}</p>`;
  }
  $("mixhint").innerHTML=hint;
  $("combine").textContent=isArmed("forge:"+S.bench.join())?tx("Tap again to forge"):tx("Forge");
  $("combine").disabled=items.length<2||!chk.ok||!!crafting?.blocked;
  $("combine").setAttribute("aria-disabled",miss.length?"true":"false");if(miss.length)$("combine").setAttribute("aria-label",techWhy(miss));else $("combine").removeAttribute("aria-label"); // the reason is the warning above the button (and its label); a bubble on top would cover it
}
// Patterns: pick a pattern (or a learned blueprint), fill its slots with base materials, forge. patSel is UI state, not saved; render() drops any material the satchel no longer holds.
let patSel={k:null,bp:false,m:[]};
const patLabel=(k,bp)=>bp?iname(S.items[k]):txc("form",FORMS[PATTERNS[k].form].label);
const slotTxt=types=>types.map(t=>tx(MAT_T[t].label)).join(tx(" or "));
const patUsed=id=>patSel.m.filter(x=>x===id).length,patLeft=id=>avail(id)-patUsed(id);
function patFix(){
  if(!patSel.k)return;const n=patSlots(patSel.k,patSel.bp).length;if(patSel.m.length!==n)patSel.m=Array(n).fill(null);
  const seen={};patSel.m=patSel.m.map(id=>{if(!id)return null;seen[id]=(seen[id]||0)+1;return seen[id]<=avail(id)?id:null});
}
function patFill(){ // empty slots take the standard (or blueprint) materials when you have them, else what fits: lowest grade first, then what you hold most of
  if(!patSel.k)return;const k=patSel.k,bp=patSel.bp,std=bp?BLUEPRINTS[k].m:PATTERNS[k].std[0][0],mats=Object.keys(S.inv).filter(id=>isBaseMat(id)&&avail(id)>0);
  patSel.m.forEach((id,i)=>{if(id)return;const fits=mats.filter(x=>patFits(k,bp,i,x)&&patLeft(x)>0).sort((a,b)=>(b===std[i])-(a===std[i])||gradeOf(a)-gradeOf(b)||patLeft(b)-patLeft(a));patSel.m[i]=fits[0]||null});
}
function renderPatterns(){
  patFix();const bps=knownBp().filter(x=>formOk(BASE[x][1])),pats=Object.keys(PATTERNS).filter(x=>formOk(PATTERNS[x].form)),k=patSel.k,bp=patSel.bp; // a pattern (or blueprint) comes with its slot technique
  $("patlabel").innerHTML=`<p class="label">${ic("pattern","s")} ${tx("Patterns")}</p>${helpBtn(tx("Patterns"),tx("Pick what to forge, then fill its slots with base materials. Deconstruct hides, ores and wood in the Gear tab to get them."),tx("The standard materials make the familiar piece; anything else makes a new one from the materials' traits. Better grades make stronger gear."),tx("Blueprints for named gear come from studying creatures in a fight."))}`;
  const btn=(key,isBp)=>{const on=key===k&&!!isBp===bp,nm=patLabel(key,isBp);
    return `<button class="tab ti${isBp?" bpb":""}" data-pat="${key}" data-bp="${isBp?1:0}" aria-pressed="${on}" aria-label="${esc(nm)}" ${tt(nm,isBp?tx("Blueprint"):tx("Pattern"),patSlots(key,isBp).map(slotTxt).join(" + "))}>${isBp?glyph(S.items[key]):gIc(PATTERNS[key].form)}${on?`<span>${esc(nm)}</span>`:""}</button>`};
  $("pats").innerHTML=pats.map(x=>btn(x,false)).join("")+bps.map(x=>btn(x,true)).join("")
    +`<span class="foot bpn" ${tt(tx("Blueprints"),tx("Study a creature in a fight to learn the blueprint of the named gear it carries. Mastering it teaches them too."))}>${ic("scroll","xs")} ${knownBp().length}/${Object.keys(BLUEPRINTS).length}</span>`;
  if(!k){$("patbody").innerHTML=!pats.length&&!bps.length?`<p class="foot">${tx("Learn a slot technique in Research (the Forge tab) to get its pattern.")}</p>`:`<p class="foot">${Object.keys(S.inv).some(id=>isBaseMat(id)&&S.inv[id]>0)?tx("Pick a pattern to forge."):tx("Pick a pattern to forge. Deconstruct raw finds in the Gear tab to get base materials.")}</p>`;return}
  const slots=patSlots(k,bp),its=patSel.m.map(id=>id&&S.items[id]);
  const parts=slots.map((t,i)=>{const it=its[i];return (i?'<span class="plus" aria-hidden="true">+</span>':"")+(it?`<button class="slot full" style="${rcol(it)}" data-pslot="${i}" aria-label="${esc(tx("Remove {item}",{item:iname(it)}))}" ${itemTip(it,tx("Tap to take it out."))}>${glyph(it)}</button>`
    :`<div class="slot pslot" role="img" aria-label="${esc(tx("Empty slot: {types}",{types:slotTxt(t)}))}" ${tt(tx("Empty slot"),slotTxt(t))}>${ic("plus")}<small>${slotTxt(t)}</small></div>`)}).join("");
  const r=its.every(Boolean)?shapeResult(k,patSel.m,bp):null;
  const fit=Object.keys(S.inv).filter(id=>isBaseMat(id)&&patLeft(id)>0&&slots.some((_,i)=>!patSel.m[i]&&patFits(k,bp,i,id))).sort((a,b)=>baseName(S.items[a]).localeCompare(baseName(S.items[b]))||gradeOf(a)-gradeOf(b));
  const tiles=fit.map(id=>{const it=S.items[id],n=patLeft(id);return `<button class="sq" style="${rcol(it)}" data-pm="${id}" aria-label="${esc(iname(it)+(n!==1?`, ${n}`:""))}" ${itemTip(it,tx("You hold {n}.",{n}))}>${glyph(it)}${n!==1?`<span class="sq-n">${n}</span>`:""}</button>`}).join("");
  let pv="";
  if(r){const ts=targetSlot(r.item),eqIt=ts&&gearOf(ts);
    pv=`<div class="preview"><div class="rhead sm">${glyph(r.item)}<div><div class="rform">${r.named?(bp?tx("Blueprint"):tx("Standard recipe")):tx("New piece")} · ${labelOf(r.item)}</div><b>${nameHtml(r.item)}</b></div></div>${itemProperties(r.item,eqIt&&eqIt.id!==r.id?eqIt:null,false,"Versus equipped")}</div>`}
  else if(!fit.length&&!its.every(Boolean))pv=`<p class="foot">${tx("You have no {types} for the empty slots. Deconstruct raw finds in the Gear tab.",{types:[...new Set(slots.filter((_,i)=>!patSel.m[i]).flat())].map(t=>tx(MAT_T[t].label)).join(tx(" or "))})}</p>`;
  $("patbody").innerHTML=`<div class="slots pslots">${parts}</div>${pv}${tiles?`<div class="sqg">${tiles}</div>`:""}
    <div class="actions"><button class="btn primary grow" id="shape" ${r&&!inBattle()?"":"disabled"}>${inBattle()?tx("Finish the fight to forge"):tx("Forge")}</button><button class="btn" id="pfill" ${its.every(Boolean)?"disabled":""}>${tx("Fill")}</button><button class="btn" id="pclear">${tx("Clear")}</button></div>`;
}
function renderResult(fresh){
  $("resultPanel").hidden=!S.last;if(fresh)$("resultPanel").open=true;
  const el=$("result"),total=Object.values(S.inv).reduce((s,c)=>s+c,0);
  if(!S.last){el.className="panel result";el.innerHTML=`<p class="empty">${total<2?tx("You need at least two items to forge. Win battles to collect loot."):tx("Your sword takes ores, herbs, potions, essences and relics. Deconstruct raw finds in the Gear tab for materials and essences.")}</p>`;return}
  const r=S.last,ch=(col,ics,v,...t)=>`<span class="chip" style="color:${col}" ${tt(...t)}>${ics}<b>${v}</b></span>`;
  const gains=`<div class="chips">${ch("var(--accent)",ic("xp","s"),`+${r.xpGain}`,tx("Smith XP"),tx("+{n} smith XP. It raises your smith level, which opens crucible slots and trait slots.",{n:r.xpGain}))}${Object.entries(r.sx||{}).map(([k,n])=>ch("var(--fg)",skIcon(k),`+${n}`,`${SKILLS[k].name} +${n}`,r.scaled?tx("Easy or known recipes teach less."):tx("Crafting trains the skill of what you make."))).join("")}`; // the tail (fail chip) is added per branch
  const logLi=l=>`<li class="${l.warn?"warn":""}"><strong>${esc(tx(l.k))}</strong> ${esc(l.t)}</li>`;
  if(r.fizzle){el.className="panel result fizzle"+(fresh?" fresh":"");
    el.innerHTML=`<div class="rhead"><div><div class="rform">${tx("Fizzle")}</div><h2 class="rname">${tx("Ashes and smoke")}</h2></div></div>
      <ul class="log"><li><strong>${tx("Recipe")}</strong> ${esc(recipeNames(r))}</li>${r.log.map(logLi).join("")}${r.refund&&isUnl("peddler")?`<li><strong>${tx("Embers")}</strong> ${tx("You sift {n} out of the ash.",{n:r.refund})}</li>`:""}</ul>
      ${gains}<span class="foot">${tx("you learn from failure")}</span></div>`;return}
  const it=S.items[r.id]||r.item,base=S.items[r.baseId],[rn]=rarity(it);
  const ts=targetSlot(it),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==it.id&&eqIt.id!==base?.id;
  el.className="panel result"+(it.legendary?" legend":"")+(fresh?" fresh":"");
  el.innerHTML=`<div class="rhead">${glyph(it)}<div><div class="rform">${rn} · ${labelOf(it)} · ${tx("Tier {n}",{n:it.tier})}</div>
    <h2 class="rname">${nameHtml(it)}${r.isNew?`<span class="badge${it.legendary?" gold":""}">${it.legendary?tx("Legendary"):tx("New")}</span>`:""}</h2></div></div>
    ${itemProperties(it,base,false,"Compared to")}
    ${showEq?cmpBlock(it,eqIt,"Versus equipped"):""}
    <ul class="log"><li><strong>${tx("Recipe")}</strong> ${esc(recipeNames(r.id?it:r))}</li>${r.log.map(logLi).join("")}</ul>
    ${gains}${ch(r.mishap?"var(--accent)":"var(--up)",ic(r.mishap?"warn":"ok","s"),`${r.inst}%`,r.mishap?tx("Flawed"):tx("Held together"),tx("{n}% was the chance to fail.",{n:r.inst}))}</div>
    ${r.autoEquipped&&eqCount(it.id)?`<p class="ok-text">${tx("Equipped automatically")}</p>`:""}
    ${S.inv[it.id]>0?`<div class="actions">${isGear(it)&&!eqCount(it.id)?`<button class="btn primary" data-result-equip="${it.id}">${tx("Equip")}</button>`:""}<button class="btn${isGear(it)&&!eqCount(it.id)?" primary":""}" data-open="${it.id}">${isGear(it)&&!eqCount(it.id)?tx("Equip or inspect"):tx("Inspect")}</button></div>`:""}`;
}
