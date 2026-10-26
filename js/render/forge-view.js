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
    ${risk.length?`<p class="warn-text">${risk.length>1?tx("{list} are equipped. A fizzle would destroy them; tap the button twice to confirm.",{list:risk.join(tx(" and "))}):tx("{list} is equipped. A fizzle would destroy it; tap the button twice to confirm.",{list:risk[0]})}</p>`:""}</div>`;
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
// ---- the action tabs above the crucible. A locked one shows its lock and the technique that opens it; its tip says what it is for.
const actOpen=id=>{const A=ACTIONS.find(a=>a.id===id);return !A.tech||hasTech(A.tech)};
function renderActs(){
  if(!ACTIONS.some(A=>A.id===S.act))S.act="forge"; // a save without the field starts on Forge
  if(S.act!=="forge"&&!actOpen(S.act))setAct("forge"); // a stale action (a save from before its technique) falls back to Forge
  const open=ACTIONS.filter(A=>actOpen(A.id)),locked=ACTIONS.filter(A=>!actOpen(A.id));
  const button=A=>{const nm=tx(A.name),on=S.act===A.id;return `<button class="tab ti${on?" on":""}" data-cact="${A.id}" aria-pressed="${on}" aria-label="${esc(nm)}" ${tt(nm,A.tech?tx(TECH[A.tech].d):tx("Patterns and blueprints: gear from base materials."))}>${ic(A.ic,"s")}<span>${nm}</span></button>`};
  $("cacts").innerHTML=open.map(button).join("")+(locked.length?`<details class="locked-forge-actions"><summary>${ic("lock","xs")} ${tx("Locked actions · {n}",{n:locked.length})}</summary><div class="tabs">${locked.map(A=>`<span class="tab ti locked" tabindex="0" aria-disabled="true" aria-label="${esc(tx("{action}: locked",{action:tx(A.name)}))}" ${tt(tx(A.name),tx("Locked. Learn {tech} in Research to open it.",{tech:tx(TECH[A.tech].name)}),tx(TECH[A.tech].gate))}>${ic("lock","s")}<span>${tx(A.name)} · ${tx(TECH[A.tech].name)}</span></span>`).join("")}</div></details>`:"");
  $("patp").hidden=S.act!=="forge";$("upgp").hidden=S.act!=="refine";$("crucible").hidden=!CRUCIBLE_ACTS.includes(S.act);
}
// what each crucible action says: the empty crucible, and one item alone
const ACT_EMPTY={infuse:()=>tx("Put in an item you want to strengthen, then an essence. Essences come from salvaging affixed materials."),improve:()=>tx("Put in an item, then the materials to improve it with."),fuse:()=>tx("Put in two gear items that fuse, like a spear and a shield."),cook:()=>tx("Put in food, herbs or essences to cook."),brew:()=>tx("Put in potions, herbs or essences to brew."),alchemy:()=>tx("Put in essences and materials to make a new material.")};
const ACT_ONE={infuse:()=>tx("Add an essence to infuse it."),improve:()=>tx("Add materials to improve it."),cook:()=>tx("Add more food, herbs or essences."),brew:()=>tx("Add more potions, herbs or essences."),alchemy:()=>tx("Add more essences or materials.")};
const ffn=f=>cap(formName(f));
// ---- what each input did. Input n is the nth in combine's order (r.ins), and it has the colour INCOL[n] everywhere: the header's legend, the change chips, the reaction line and the failure bar.
const INCOL=["#e8b04b","#6fb8e8","#d98bd6","#8fd49a","#f08f6a"],incol=n=>INCOL[n]||"var(--muted)"; // the mix itself (no input) is grey
const RISK_FIX={base:"#5f574f",tier:"#b8a88a",prec:"var(--up)"}; // the parts that are not an input's; the rest take their input's colour
const inLegend=r=>r.ins.map((id,n)=>`<span class="chip in" tabindex="0" data-inp="${n}" style="color:${incol(n)}" ${tt(iname(S.items[id]))}><b>${esc(iname(S.items[id]))}</b></span>`).join("");
// the header: the action, the inputs (← for Infuse, + otherwise) and the result, then the legend for their colours
function actLine(act,r,res){
  const A=ACTIONS.find(a=>a.id===act);if(!A)return"";
  const nm=r.ins.map(id=>esc(iname(S.items[id]))),items=act==="infuse"?nm.join(" ← "):nm.join(" + ");
  return `<p class="act-line"><b>${esc(tx(A.tech?TECH[A.tech].name:A.name))}</b> · ${tx("{items} → {result}",{items,result:esc(iname(res))})}</p>`;
}
// one chip per trait or stat that changed from the base item to the result, in the colour of the input behind it
function changeChips(r,res){
  const base=S.items[r.baseId],src=r.src||{},ch=(c,txt,t)=>`<span class="chip" style="color:${incol(c)}" ${tt(t)}><b>${txt}</b></span>`,from=c=>c>=0?tx("From {input}.",{input:iname(S.items[r.ins[c]])}):tx("Changed by the mix itself."),out=[];
  Object.keys({...base.traits,...res.traits}).forEach(t=>{const b=base.traits[t],a=res.traits[t];if(a===b)return;const d=r1((a??0)-(b??0));if(!d)return;
    out.push(ch(src[t]??-1,`${trn(t)} ${d>0?"+":""}${d}`,`${trn(t)}\n${from(src[t]??-1)}`))});
  if(isGear(res)){const sb=statsOf(base),sa=statsOf(res);Object.keys(STAT_NAMES).forEach(k=>{const d=sa[k]-sb[k];if(!d)return;const c=Object.keys(res.traits).filter(t=>TRAITS[t].s[k]!=null).map(t=>src[t]??-1)[0]??-1;out.push(ch(c,`${STAT_NAMES[k]} ${d>0?"+":""}${d}`,`${STAT_NAMES[k]}\n${from(c)}`))})}
  return out.join("");
}
// before → after: the base item next to the result, with the changes as chips underneath
function beforeAfter(r,res){
  const base=S.items[r.baseId],gear=isGear(res),st=it=>gear?`<span class="foot">${statLine(shown(it))||tx("No stats")}</span>`:"",ch=changeChips(r,res);
  return `<div class="ba"><div class="ba-col"><span class="label">${tx("Before")}</span><b>${nameHtml(base)}</b>${st(base)}<div class="chips">${chips(base,true)}</div></div>
    <div class="ba-col"><span class="label">${tx("After")}</span><b>${nameHtml(res)}</b>${st(res)}<div class="chips">${chips(res,true)}</div></div>
    <div class="chips ba-why">${ch||`<span class="foot">${tx("Nothing changes.")}</span>`}</div></div>`;
}
// reactions get their own line: the two inputs (in their colours) → the result, and any trait the reaction used up
function rxLines(r){
  return r.log.filter(l=>l.k==="Reaction").map(l=>{const [a,b,c]=l.rx,sp=(n,x)=>`<span style="color:${incol(n)}">${esc(trn(x))}</span>`,lost=(l.lost||[]).map(([t,v])=>tx("−{n} {trait}",{n:v,trait:trn(t)})).join(", ");
    return `<p class="rx-line${l.warn?" warn":""}">${tx("{a} + {b} → {c}",{a:sp(l.src[0],a),b:sp(l.src[1],b),c:esc(trn(c))})}${lost?`, ${lost}`:""}</p>`}).join("");
}
// whole-number shares of the failure chance that add up to target (the shown percentage): the rounding goes to the parts that were cut closest
function splitPct(parts,target){
  const out=parts.map(p=>Math.floor(p.v)),fr=parts.map((p,i)=>p.v-out[i]),n=parts.length;let left=target-out.reduce((s,x)=>s+x,0);
  const up=parts.map((_,i)=>i).sort((a,b)=>fr[b]-fr[a]),dn=parts.map((_,i)=>i).sort((a,b)=>out[b]-out[a]);
  for(let g=0;left>0&&n;g++){out[up[g%n]]++;left--}
  for(let g=0;left<0&&n;g++){out[dn[g%n]]--;left++}
  return out;
}
// the failure chance as a stacked bar: each part a segment (its share is the number in the list), coloured by the input behind it. Hovering or focusing an input dims the parts that are not its.
function riskBar(r){
  if(!S.journal.length||!r.risk)return""; // the very first forge never fails
  const sh=splitPct(r.risk,r.fail),segs=r.risk.map((p,i)=>({p,s:sh[i]})).filter(x=>x.s),tot=segs.reduce((n,x)=>n+Math.abs(x.s),0)||1;
  const col=p=>RISK_FIX[p.k]||incol(p.who.find(x=>x!=null));
  const sgn=s=>s>0?"+":s<0?"−":"";
  const txt=segs.map(({p,s})=>`${p.t} ${sgn(s)}${Math.abs(s)}%`).join(", ");
  return `<div class="risk-wrap"><p class="label">${tx("Failure chance")} · ${r.fail}%</p>
    <div class="risk" role="img" aria-label="${esc(tx("Failure chance {n}%: {list}",{n:r.fail,list:txt}))}">${segs.map(({p,s})=>`<i class="seg${s<0?" neg":""}" data-o="${p.who.filter(x=>x!=null).join(" ")}" style="width:${Math.abs(s)/tot*100}%;background-color:${col(p)}"></i>`).join("")}</div>
    <ul class="risk-list">${segs.map(({p,s})=>`<li>${esc(p.t)} <b>${sgn(s)}${Math.abs(s)}%</b></li>`).join("")}<li><b>= ${r.fail}%</b></li></ul></div>`;
}
function riskHl(n){document.querySelectorAll(".risk .seg").forEach(s=>s.classList.toggle("dim",n!=null&&!s.dataset.o.split(" ").includes(String(n))))}
function renderForgeRecipes(){
  const recipes=S.journal.slice().reverse().map(j=>S.items[j.id]).filter(it=>{
    const ids=it?.recipeIds||[],counts={};ids.forEach(id=>counts[id]=(counts[id]||0)+1);
    if(ids.length<2||ids.some(id=>!S.items[id]))return false;
    const parts=ids.map(id=>S.items[id]),act=actFor(parts);
    return ids.length>1&&ids.length<=maxInputs()&&Object.entries(counts).every(([id,n])=>(S.inv[id]||0)>=n)&&actOpen(act)&&!actionOk(parts).length;
  });
  $("forgeRecipeAccess").innerHTML=recipes.length?`<details class="forge-recipes"><summary>${tx("Saved recipes you can make · {n}",{n:recipes.length})}</summary><div>${recipes.map(it=>`<button class="btn sm" data-forge-load="${it.id}">${esc(iname(it))}</button>`).join("")}</div></details>`:"";
}
function renderBench(){
  renderForgeRecipes();
  const act=S.act,A=ACTIONS.find(a=>a.id===act),parts=[],items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  if(!CRUCIBLE_ACTS.includes(act))return;
  // the slots: infuse and improve take the item first, then essences or materials; fuse takes two items; the kitchen actions take ingredients in the order they were put in
  const special=act==="infuse"||act==="improve",gi=special?items.findIndex(isGear):-1,shownSlots=special?[gi,...items.map((_,i)=>i).filter(i=>i!==gi)]:items.map((_,i)=>i);
  const role=i=>special?(i?tx(act==="infuse"?"Essence":"Material"):tx("Item")):act==="fuse"?tx("Item"):tx("Ingredient");
  $("cruciblelabel").innerHTML=`<p class="label">${ic(A.ic,"s")} ${tx(A.name)} · ${tx("Crucible")}</p>${helpBtn(tx(A.name),tx(TECH[A.tech].d))}`;
  for(let i=0;i<actCap(act);i++){
    if(i>0)parts.push(`<span class="plus" aria-hidden="true">${act==="infuse"?"←":"+"}</span>`);
    const bi=i<shownSlots.length?shownSlots[i]:-1,it=bi>=0?items[bi]:null;
    parts.push(it?`<button class="slot full${!chk.ok&&chk.bad?.id===it.id?" bad":""}" style="${rcol(it)}" data-slot="${bi}" aria-label="${esc(tx("Remove {item}",{item:iname(it)}))}" ${itemTip(it,tx("Tap to take it out."))}>${glyph(it)}</button>`
      :`<div class="slot pslot" role="img" aria-label="${esc(tx("Empty slot"))}" ${tt(tx("Empty slot"),role(i))}>${ic("plus")}<small>${role(i)}</small></div>`);
  }
  $("slots").className="slots";$("slots").innerHTML=parts.join("");
  let hint="",crafting=null;const miss=chk.ok&&items.length>1?actionOk(items):[]; // techniques this craft needs and you lack
  if(!items.length)hint=`<p class="foot" style="text-align:center">${ACT_EMPTY[act]()}</p>`;
  else if(!chk.ok)hint=`<p class="warn-text">${esc(chk.reason)}</p>`;
  else if(items.length===1&&act==="fuse"){ // one side placed: the forms it fuses with, and what each makes
    const ps=FUSIONS.filter(p=>p.slice(0,2).includes(items[0].form));
    hint=ps.length?`<p class="foot">${tx("Add a second item to fuse it:")} ${ps.map(p=>tx("{a} + {b} → {c}",{a:ffn(p[0]),b:ffn(p[1]),c:ffn(p[2])})).join(", ")}</p>`:`<p class="foot">${tx("{a} doesn't fuse with anything.",{a:cap(formName(items[0].form))})}</p>`}
  else if(items.length===1)hint=`<p class="foot">${ACT_ONE[act]()}</p>`;
  else if(miss.length)hint=`<p class="warn-text">${ic("lock","s")} ${techWhy(miss)}</p>${isUnl("research")?`<div class="actions"><button class="btn sm" data-gores="${miss[0]}">${ic("research","s")} ${tx("Open Research")}</button></div>`:""}`;
  else{
    const r=combine(items,{roll:100}),known=S.items[r.item.id],base=S.items[r.baseId];crafting=r;
    if(known){
      const ts=targetSlot(known),eqIt=ts&&gearOf(ts),showEq=eqIt&&eqIt.id!==known.id&&eqIt.id!==base.id;
      hint=`<div class="preview compact-preview"><div class="rhead sm">${glyph(known)}<div><div class="rform">${ic("ok","s")} ${tx("Known recipe")} · ${rarity(known)[0]} · ${labelOf(known)}</div><b>${nameHtml(known)}</b><span class="foot">${statLine(shown(known))||tx("No stats")}</span></div></div>
        <details><summary class="label">${tx("Result details")}</summary><div class="chips in-legend">${inLegend(r)}</div>${itemProperties(known,base,false,"Compared to")}${showEq?cmpBlock(known,eqIt,"Versus equipped"):""}<div class="craft-explanation">${rxLines(r)}${riskBar(r)}</div></details></div>`}
    else{
      const knownR=new Set(S.knownR),kr=r.rxKeys.filter(k=>knownR.has(k)),ur=r.rxKeys.filter(k=>!knownR.has(k));
      const hidden=new Set(REACTIONS.filter(([a,b])=>ur.includes(a+"+"+b)).map(x=>x[2]));
      const appraise=level()>=3?`<span class="foot">${tx("Appraisal: {list}",{list:Object.keys(r.item.traits).map(t=>hidden.has(t)?"???":trn(t)).join(", ")})}</span>`:`<span class="foot">${tx("Appraisal unlocks at Smith Lv 3.")}</span>`;
      hint=`<div class="preview compact-preview"><div class="rhead sm">${glyph(r.item)}<div><div class="rform">${tx("New combination: a {form}.",{form:formName(r.item.form)})}</div><b>${nameHtml(r.item)}</b><span class="foot">${statLine(shown(r.item))||tx("No stats")}</span></div></div>
        <details><summary class="label">${tx("Result details")}</summary><div class="chips in-legend">${inLegend(r)}</div>${beforeAfter(r,r.item)}
          ${kr.length?`<span class="foot">${tx("Known reactions: {list}",{list:kr.map(k=>{const x=REACTIONS.find(([a,b])=>a+"+"+b===k);return `${trn(x[0])} + ${trn(x[1])} → ${trn(x[2])}`}).join(", ")})}</span>`:""}
          ${ur.length?`<span class="foot" style="color:var(--accent)" ${tt(tx("Unseen reaction"),tx("Something in this mix will react in a way you haven't seen yet."))}>${ic("warn","xs")} ${tx("An unseen reaction")}</span>`:""}${appraise}<div class="craft-explanation">${rxLines(r)}${riskBar(r)}</div></details></div>`}
    hint=`${actLine(act,r,r.item)}${craftLine(r,items)}${hint}`;
    if(r.mw>=0)hint+=`<p class="warn-text">${ic("warn","s")} ${mwWarn()}</p>`;
  }
  $("mixhint").innerHTML=hint;
  $("combine").textContent=isArmed("forge:"+S.bench.join())?tx("Tap again to forge"):tx(A.name);
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
  let pv="";
  if(r){const ts=targetSlot(r.item),eqIt=ts&&gearOf(ts);
    pv=`<div class="preview"><div class="rhead sm">${glyph(r.item)}<div><div class="rform">${r.named?(bp?tx("Blueprint"):tx("Standard recipe")):tx("New piece")} · ${labelOf(r.item)}</div><b>${nameHtml(r.item)}</b></div></div>${itemProperties(r.item,eqIt&&eqIt.id!==r.id?eqIt:null,false,"Versus equipped")}</div>`}
  else if(!fit.length&&!its.every(Boolean))pv=`<p class="foot">${tx("You have no {types} for the empty slots. Deconstruct raw finds in the Gear tab.",{types:[...new Set(slots.filter((_,i)=>!patSel.m[i]).flat())].map(t=>tx(MAT_T[t].label)).join(tx(" or "))})}</p>`;
  else if(!its.every(Boolean))pv=`<p class="foot">${tx("Choose compatible materials from the Forge Satchel below.")}</p>`;
  $("patbody").innerHTML=`<div class="slots pslots">${parts}</div>${pv}
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
    ${actLine(r.act,r,it)}
    <ul class="log"><li><strong>${tx("Recipe")}</strong> ${esc(recipeNames(r.id?it:r))}</li>${r.log.map(logLi).join("")}</ul>
    ${r.src?`<div class="chips res-changes">${changeChips(r,it)}</div>`:""}
    ${gains}${ch(r.mishap?"var(--accent)":"var(--up)",ic(r.mishap?"warn":"ok","s"),`${r.inst}%`,r.mishap?tx("Flawed"):tx("Held together"),tx("{n}% was the chance to fail.",{n:r.inst}))}</div>
    ${r.autoEquipped&&eqCount(it.id)?`<p class="ok-text">${tx("Equipped automatically")}</p>`:""}
    ${S.inv[it.id]>0?`<div class="actions">${isGear(it)&&!eqCount(it.id)?`<button class="btn primary" data-result-equip="${it.id}">${tx("Equip")}</button>`:""}<button class="btn${isGear(it)&&!eqCount(it.id)?" primary":""}" data-open="${it.id}">${isGear(it)&&!eqCount(it.id)?tx("Equip or inspect"):tx("Inspect")}</button></div>`:""}`;
}
