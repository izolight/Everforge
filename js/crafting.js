// ================= MIXING RULES =================
function checkMix(items){
  if(items.length<2)return{ok:true};
  const sorted=sortInputs(items),base=sorted[0];
  if(grp(base)==="material"){
    const free=k=>k==="essence"||k==="relic";const core=sorted.find(x=>!free(kindOf(x)));
    const bad=core&&sorted.find(x=>!free(kindOf(x))&&kindOf(x)!==kindOf(core));
    return bad?{ok:false,bad,reason:tx("{bad} won't blend with {core}. Materials only mix with their own kind, essences and relics.",{bad:iname(bad),core:iname(core)})}:{ok:true};
  }
  for(const x of sorted.slice(1)){
    if(x.form===base.form||isFusion(base.form,x.form))continue;
    const k=kindOf(x),bk=kindOf(base);
    if((ACCEPTS[bk]||[]).includes(k))continue;
    return{ok:false,bad:x,reason:k===bk
      ?tx(hasTech("alloy")?"{x} and {base} are different {kind}. Only the same type or a fusion partner can merge. Salvage it into essences instead.":"{x} and {base} are different {kind}. Only the same type can merge. Salvage it into essences instead.",{x:iname(x),base:iname(base),kind:txc("kind",KIND_LABEL[k])})
      :tx("{x} doesn't go into {base}. Salvage it into essences, which mix with anything.",{x:iname(x),base:iname(base)})};
  }
  return{ok:true};
}
function acceptsText(it){
  const k=kindOf(it);
  if(grp(it)==="material")return KIND_LABEL[k]==="essences"?tx("anything, essences and relics"):tx("other {kind}, essences and relics",{kind:txc("kind",KIND_LABEL[k])});
  const mass=f=>["gloves","boots","food","body armor","head armor","claws"].includes(f);
  const fus=!hasTech("alloy")?[]:FUSIONS.filter(f=>f.slice(0,2).includes(it.form)).map(f=>f[0]===it.form?f[1]:f[0]).map(f=>mass(formEn(f))?formName(f):tx("a {form}",{form:formName(f)}));
  const own=ACCEPTS[k].includes(k)?[]:[mass(formEn(it.form))?tx("other {form}",{form:formName(it.form)}):tx("another {form}",{form:formName(it.form)})];
  return [...ACCEPTS[k].map(a=>txc("kind",KIND_LABEL[a])),...own,...(fus.length?[tx("{list} (fusion)",{list:fus.join(tx(" or "))})]:[])].join(", ");
}

// ================= COMBINE =================
// o.roll (0-100) fixes the success roll (100 = clean, used by previews and the balance sim); by default every attempt rolls for real. o.full keeps the failure chance even on the first forge (which never fails).
function combine(raw,o={}){
  const inputs=sortInputs(raw);
  const key=inputs.map(i=>i.id).sort().join("+"),log=[];
  const base=inputs[0],forms=inputs.map(i=>i.form);let form=base.form;
  for(const [a,b,f] of FUSIONS){if(forms.includes(a)&&forms.includes(b)){form=f;log.push({k:"Fusion",t:tx("{a} + {b} → {c}",{a:LANG==="en"?cap(a):txc("form",FORMS[a].label),b:LANG==="en"?cap(b):txc("form",FORMS[b].label),c:txc("noun",FORMS[f].noun)})});break}}
  const vals={};inputs.forEach(i=>Object.entries(i.traits).forEach(([t,v])=>(vals[t]=vals[t]||[]).push(v)));
  let tr={};Object.entries(vals).forEach(([t,vs])=>{const mx=Math.max(...vs),sum=vs.reduce((a,b)=>a+b,0);const g=.25*(sum-mx),lo=Math.max(0,Math.min(g,SOFT-mx));tr[t]=r1(mx+lo+(g-lo)/2);if(g>lo+.05)log.push({k:"Limit",t:tx("{t} is near its limit; gains above {soft} are halved.",{t:trn(t),soft:SOFT})})}); // merge gains above SOFT count half
  let inst=0;CONFLICTS.forEach(([a,b])=>{if(tr[a]&&tr[b])inst+=Math.min(tr[a],tr[b])*7});
  const used=new Set(),reacted=new Set(),rxKeys=[];
  for(let pass=0;pass<3;pass++){let any=false;
    for(const [a,b,res,cons] of REACTIONS){const k=a+"+"+b;if(used.has(k)||!tr[a]||!tr[b])continue;
      used.add(k);any=true;rxKeys.push(k);const v=r1((tr[a]+tr[b])/2);
      cons.forEach(c=>delete tr[c]);tr[res]=r1(Math.max(tr[res]||0,v));reacted.add(res);
      log.push({k:"Reaction",t:tx("{a} + {b} → {c}",{a:trn(a),b:trn(b),c:trn(res)}),warn:TRAITS[res].f==="bad"});inst+=3}
    if(!any)break}
  let secret=SECRETS.find(s=>s.ids.slice().sort().join("+")===key),mw=-1;
  if(secret&&!hasTech("master")){mw=SECRETS.indexOf(secret);secret=null} // without Masterwork the right ingredients make an ordinary piece (and an insight, see insights()); it gets its own id so the legendary can still be forged later
  if(!secret&&inputs.some(i=>gradeOf(i.id)!==3)){const sk=inputs.map(i=>baseIdOf(i.id)).sort().join("+");if(SECRETS.some(s=>s.ids.slice().sort().join("+")===sk))log.push({k:"Grade",t:tx("A graded ingredient throws this secret off. Secrets want Plain ones.")})}
  let bon=null; // the secret's bonus always keeps a slot
  if(secret&&secret.bonus){const {trait:bt,v:bv}=secret.bonus;bon=[bt,r1((tr[bt]||0)+bv)];delete tr[bt];log.push({k:"Legendary",t:tx("The secret lends it +{v} {trait}.",{v:bv,trait:trn(bt)})})}
  const slots=traitSlots()-(bon?1:0),sorted=topTraits(tr);
  if(sorted.length>slots)log.push({k:"Lost",t:tx("{list} (only {n} trait slots)",{list:sorted.slice(slots).map(x=>trn(x[0])).join(", "),n:traitSlots()})});
  tr=Object.fromEntries(sorted.slice(0,slots));if(bon)tr[bon[0]]=bon[1];
  inst+=(inputs.length-2)*6;
  const tier=Math.min(9,Math.max(...inputs.map(i=>i.tier))+1),sk=skillOf({form}),lv=skLv(sk),ck=mw>=0?key+"|plain":key,cleanId="c_"+hash(ck).toString(36);
  const ups=inputs.filter(i=>i.crafted&&i.form===form),upg=ups.length?CRAFT.up*Math.max(0,Math.max(...ups.map(i=>i.tier))-CRAFT.upFrom):0;
  const diff=r1(CRAFT.base+(tier-1)*CRAFT.tier+inst/CRAFT.inst+upg),gap=diff-lv;
  const prec=PREC.reduce((n,p,i)=>n+(hasTech("prec"+(i+1))?p:0),0),fail=S.journal.length||o.full?Math.round(Math.max(FAIL.min,Math.min(FAIL.max,FAIL.base+FAIL.slope*gap-prec))):0; // the very first forge never fails
  const fiz=Math.round(fail*Math.max(FIZ.min,Math.min(FIZ.max,FIZ.base+FIZ.slope*gap))),mis=fail-fiz;
  const need=SK_CAP.findIndex(c=>c>=tier)+1,blocked=tier>SK_CAP[lv-1]?{skill:sk,lv,need,tier}:null;
  const roll=o.roll??Math.random()*100;let mishap=null,unweak=null,fizzle=false;
  if(roll<fiz){fizzle=true;log.push({k:"Fizzle",t:tx("The mixture collapsed into ash. The ingredients are gone."),warn:true})}
  else if(roll<fail){mishap=["Cursed","Weakened","Brittle"][Math.floor(Math.random()*3)];
    if(mishap==="Weakened"){unweak={...tr};Object.keys(tr).forEach(t=>tr[t]=r1(tr[t]*.7))}else tr[mishap]=2;
    log.push({k:"Mishap",t:mishap==="Weakened"?tx("The mixture fizzled. Every trait lost 30%."):tx("The mixture turned unstable and became {mishap}.",{mishap:trn(mishap)}),warn:true})}
  const noun=FORMS[form].noun||base.noun;
  const score=([t,v])=>v+(t in base.traits?0:3)+(reacted.has(t)?1:0);
  const ranked=Object.entries(tr).filter(([t])=>TRAITS[t].adj.toLowerCase()!==noun.toLowerCase()).sort((a,b)=>score(b)-score(a)).map(x=>x[0]);
  const name=secret?secret.name:[...ranked.slice(0,2).map(t=>TRAITS[t].adj),noun].join(" ");
  const sg=Math.min(...inputs.map(i=>i.grade||i.sg||3)); // salvaging it never returns a better grade than the worst thing it was made from
  const item={id:mishap?"c_"+hash(ck+"|"+mishap).toString(36):cleanId,name,form,noun,traits:tr,tier,crafted:true,legendary:!!secret,recipe:inputs.map(i=>i.name),recipeIds:inputs.map(i=>i.id),ei:inputs.reduce((n,i)=>n+(isEss(i.id)?1:essIn(i)),0),...sg!==3?{sg}:{},...mishap?{clean:cleanId}:{},...unweak?{mishap,unweak}:{}}; // a mishap gets its own id, so clean and flawed copies never stack
  if(form==="material"){const core=inputs.map(kindOf).find(k=>k!=="essence"&&k!=="relic");item.kind=core||(inputs.some(i=>kindOf(i)==="relic")?"relic":"essence")}
  return {item,log,inst:fail,fail,fiz,mis,diff,gap,skill:sk,lv,blocked,fizzle,mishap,cleanId,baseId:base.id,rxKeys,mw,key,prec};
}
function statsOf(item){
  const out={atk:0,def:0,mag:0,heal:0,spd:0},m=FORMS[item.form].m;
  topTraits(item.traits).forEach(([t,v],i)=>Object.entries(TRAITS[t].s).forEach(([s,w])=>out[s]+=w*v*(w<0?1:(DECAY[i]??.1))));
  const scale=(1+.03*(item.tier-1))*(item.legendary?1.2:1);
  Object.keys(out).forEach(s=>out[s]=Math.round(out[s]*m[s]*scale));
  return out;
}
// Unrounded contributions for the optional UI breakdown; combat still uses statsOf().
function statParts(item){
  const form=FORMS[item.form].m,scale=(1+.03*(item.tier-1))*(item.legendary?1.2:1);
  return topTraits(item.traits).map(([t,v],rank)=>({t,v,stats:Object.entries(TRAITS[t].s).map(([k,base])=>{
    const priority=base<0?1:(DECAY[rank]??.1);
    return {k,base,priority,form:form[k],scale,value:base*v*priority*form[k]*scale};
  })}));
}
function power(it){const s=statsOf(it);return Math.round(s.atk+s.def+s.mag+s.spd*1.5+s.heal*.5)}
// essences that went into a crafted item: stored as `ei` when it was forged (temper and reforge spread the item, so it survives them); older items count through recipeIds, and an older tempered piece with neither counts 1
const essIn=(it,d=0)=>!it||!it.crafted||d>8?0:it.ei!=null?it.ei:it.recipeIds?it.recipeIds.reduce((n,r)=>n+(isEss(r)?1:essIn(S.items[r],d+1)),0):1;
// Salvaging gear or a crafted piece: up to two essences from its top traits, but never more than were put into it (essIn), so plain gear gives none and forging is never a mint; the materials come back from salvageMats.
function salvageYield(it){if(!it.crafted||isEss(it.id))return[];const ys=topTraits(it.traits).filter(([t])=>TRAITS[t].f!=="bad").slice(0,2).filter(([,v],i)=>i===0||v>=2).map(([t])=>t);return ys.slice(0,essIn(it))}

// ================= MATERIALS: DECONSTRUCT AND PATTERNS =================
// Anything that is not gear, crafted, an essence or a base material deconstructs (economy.js: deconstruct); gear and crafted pieces salvage instead.
const canDecon=it=>!!it&&!isGear(it)&&!it.crafted&&!isEss(it.id)&&!isBaseMat(it.id)&&!!BASE[plainId(it.id)];
const canSalvage=it=>!!it&&(isGear(it)||it.crafted)&&!isEss(it.id);
// What deconstructing gives: mat = [base material id, n] (an affixed raw gives the affixed material), frag = [[trait, n, grade]] fragments it always gives, ch = [[trait, chance, grade]] a full essence each. Counted from the Plain traits, so a grade changes the fragments' grade, not their number.
function deconYield(it){
  const p=plainId(it.id),d=DECON[p],g=gradeOf(it.id),a=afxOfId(it.id),A=a&&AFX[a],fg=Math.max(1,g-FRAG.step),skip=d?MAT_T[MATS[d[0]]].tr:null,frag=[],ch=[];
  Object.entries(BASE[p][2]).forEach(([t,v])=>{if(t===skip||TRAITS[t].f==="bad")return;const n=Math.round(v);if(n>0){frag.push([t,n,fg]);ch.push([t,Math.min(FRAG.cap,Math.round(FRAG.ch*v*100)/100),g])}});
  if(A){const f=frag.find(x=>x[0]===A.tr);if(f)f[1]+=FRAG.afx;else frag.push([A.tr,FRAG.afx,fg]);ch.push([A.tr,FRAG.afxCh,g])}
  return{mat:d?[gradedId(a?d[0]+"~"+a:d[0],g),d[1]]:null,frag,ch};
}
// The materials a piece of gear was shaped from: a pattern piece keeps them (recipeIds), a plain BASE item uses its standard recipe or blueprint (at its own grade), a crucible craft those of its gear and material inputs.
function stdMats(p){for(const k in PATTERNS)for(const [m,r] of PATTERNS[k].std)if(r===p)return m;return BLUEPRINTS[p]?BLUEPRINTS[p].m:null}
function matsOf(it,d=0){
  if(!it||d>8)return[];
  if(!it.crafted){const m=isGear(it)&&stdMats(plainId(it.id));return m?m.map(x=>gradedId(x,gradeOf(it.id))):[]}
  if(it.pat)return(it.recipeIds||[]).slice();
  return(it.recipeIds||[]).flatMap(r=>isBaseMat(r)?[r]:matsOf(S.items[r],d+1));
}
// salvaging gives back half of them (rounded down, at least one), the first slots first
const salvageMats=it=>{if(!it||!(isGear(it)||it.crafted))return[];const m=matsOf(it);return m.slice(0,m.length?Math.max(1,Math.floor(m.length/2)):0)};
// Patterns: mats = material ids in slot order. A blueprint (bp) or a standard recipe makes its named BASE item at the lowest grade among the materials, with the first affix among them; anything else makes a new piece from the weighted material traits.
const patSlots=(key,bp)=>bp?BLUEPRINTS[key].slots:PATTERNS[key].slots.map(s=>s[0]);
const patFits=(key,bp,i,id)=>!!id&&patSlots(key,bp)[i]&&patSlots(key,bp)[i].includes(MATS[plainId(id)]);
function shapeResult(key,mats,bp){
  const slots=patSlots(key,bp);if(mats.length!==slots.length||!mats.every((m,i)=>patFits(key,bp,i,m)))return null;
  const g=Math.min(...mats.map(gradeOf)),a=mats.map(afxOfId).find(Boolean),P=bp?null:PATTERNS[key];
  const named=bp?key:(P.std.find(([m])=>m.join()===mats.map(plainId).join())||[])[1];
  if(named){const b=a?named+"~"+a:named,id=gradedId(b,g);return{id,base:b,g,named:true,item:S.items[id]||mkGraded(b,g)}}
  const its=mats.map(id=>S.items[id]),tr={};
  its.forEach((it,i)=>Object.entries(it.traits).forEach(([t,v])=>{if(TRAITS[t].f!=="bad")tr[t]=(tr[t]||0)+v*P.slots[i][1]}));
  Object.entries(P.tr).forEach(([t,v])=>tr[t]=(tr[t]||0)+v);
  const traits=Object.fromEntries(topTraits(tr).filter(([,v])=>v>=PAT_MIN).slice(0,traitSlots()).map(([t,v])=>[t,r1(v)]));
  const t0=MATS[plainId(mats[0])],noun=typeof P.noun==="string"?P.noun:P.noun[t0]||P.noun._;
  const adj=topTraits(traits).map(([t,v])=>[t,v+(t in P.tr?0:2)]).sort((x,y)=>y[1]-x[1]).map(([t])=>TRAITS[t].adj).filter(x=>x.toLowerCase()!==noun.toLowerCase()).slice(0,2).reverse(); // the materials name it before the pattern does
  const id="c_"+hash("pat:"+key+"|"+mats.join("+")).toString(36);
  return{id,named:false,item:{id,name:[...adj,noun].join(" "),form:P.form,noun,traits,tier:1,crafted:true,pat:key,recipe:its.map(i=>i.name),recipeIds:mats.slice(),ei:0,...g!==3?{sg:g}:{}}};
}
// Forge from a pattern for real: the materials go, the piece comes (equipped into a free slot), with a little smith and skill XP. It never fails.
function shapeIt(key,mats,bp){
  const r=shapeResult(key,mats,bp);if(!r||!mats.every(id=>avail(id)>=mats.filter(x=>x===id).length))return null;
  const lv0=level(),sk=skillOf(r.item),l0=skLv(sk);
  mats.forEach(id=>S.inv[id]--);trimBench();
  const id=r.named?gradedItem(r.base,r.g):r.id;if(!S.items[id])S.items[id]=r.item;
  addItem(id);settleGear(S.items[id]);S.stats.shaped++;
  S.xp+=SHAPE.xp;S.skills[sk]=skXp(sk)+SHAPE.sk;
  save();
  return{id,lv:level()>lv0,sk,up:skLv(sk)>l0?l0:0};
}
// Forge for real: ingredients out, the result in, smith XP and skills, research points and insights. The caller announces it (render, toasts, the animation).
function forgeIt(items){
  const lvBefore=level(),sk0=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,skLv(k)])),r=combine(items),{item,log,inst,mishap,fizzle,cleanId,skill,diff,baseId,rxKeys}=r;
  const eqBefore={...S.eq};
  const worthSum=items.reduce((n,i)=>n+worth(i),0);
  S.bench.forEach(id=>S.inv[id]--);S.bench=[];
  const st=S.stats,known=S.journal.some(j=>j.id===cleanId),isNew=!fizzle&&!mishap&&!known,newRx=fizzle?[]:rxKeys.filter(k=>!S.knownR.includes(k));
  const firstLeg=!fizzle&&item.legendary&&!S.journal.some(j=>j.legendary&&j.name===item.name);
  if(fizzle)st.fizzles++;else{st.forged++;if(firstLeg)st.legend++;if(mishap)st.mishaps++}
  let gain=10,refund=0;
  if(fizzle){gain=Math.round(gain*SK_XP.fizzle);refund=gainEmbers(Math.max(1,Math.round(worthSum*FIZ.refund)));settleGear(null)}
  else{
    if(!S.items[item.id])S.items[item.id]=item;
    const fr=isNew?S.journal.findIndex(j=>S.items[j.id]&&S.items[j.id].clean===cleanId):-1; // a flawed copy was journaled: the clean recipe takes over its row
    if(isNew){if(fr>=0)S.journal[fr]={...S.journal[fr],id:item.id,name:item.name};else S.journal.push({id:item.id,name:item.name,legendary:item.legendary})}
    else if(mishap&&firstLeg)S.journal.push({id:item.id,name:item.name,legendary:true}); // a flawed secret still counts as found
    S.inv[item.id]=(S.inv[item.id]||0)+1;recordPickup(item.id);S.knownR.push(...newRx);
    settleGear(S.items[item.id]);
    if(S.onboarding===2&&grp(item)==="weapon"&&(item.traits.Fire||item.traits.Sunfire))S.onboarding=3;
    rpGain("form:"+item.form,RP.form,tx("a new form ({form})",{form:formName(item.form)}));if(isNew&&rpCount("rec:")<RP.recCap)rpGain("rec:"+cleanId,RP.rec,tx("a new recipe"));
    newRx.forEach(k=>rpGain("rx:"+k,RP.rx,tx("a new reaction")));if(firstLeg)rpGain("leg:"+item.name,RP.leg,tx("a legendary"));
    log.push(...insights(items,r.key,r.mw));
    gain+=(isNew?25:0)+(firstLeg?100:0)+newRx.length*10}
  S.xp+=gain; // smith XP is not scaled by difficulty: it only gates slots, the skills gate tiers
  const sx={},add=(k,sh)=>{if(!(k in sx))sx[k]=Math.max(1,Math.round(gain*sh*skFactor(diff,skLv(k))*(known?.5:1)))};
  add(skill,SK_XP.self);items.forEach(i=>add(skillOf(i),SK_XP.input)); // the result's skill, then each other input category once
  const scaled=Object.keys(sx).some(k=>skFactor(diff,skLv(k))<1)||known;
  Object.entries(sx).forEach(([k,n])=>S.skills[k]=skXp(k)+n);
  const ups=Object.keys(sx).filter(k=>skLv(k)>sk0[k]);
  S.last={autoEquipped:!fizzle&&SLOTS.some(([s])=>S.eq[s]===item.id&&eqBefore[s]!==item.id),id:fizzle?null:item.id,item,log:fizzle?log.filter(l=>l.k==="Fizzle"):log,inst,mishap,fizzle,refund,isNew,xpGain:gain,sx,scaled,baseId,recipe:items.map(i=>i.name),recipeIds:items.map(i=>i.id)};
  save();
  return{lvBefore,sk0,ups,newRx,item,fizzle};
}
