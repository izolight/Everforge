// ================= MIXING RULES =================
function checkMix(items){
  if(items.length<2)return{ok:true};
  const sorted=sortInputs(items),base=sorted[0];
  if(grp(base)==="material"){
    const free=k=>k==="essence"||k==="relic";const core=sorted.find(x=>!free(kindOf(x)));
    const bad=core&&sorted.find(x=>!free(kindOf(x))&&kindOf(x)!==kindOf(core));
    return bad?{ok:false,bad,reason:`${bad.name} won't blend with ${core.name}. Materials only mix with their own kind, essences and relics.`}:{ok:true};
  }
  for(const x of sorted.slice(1)){
    if(x.form===base.form||isFusion(base.form,x.form))continue;
    const k=kindOf(x),bk=kindOf(base);
    if((ACCEPTS[bk]||[]).includes(k))continue;
    return{ok:false,bad:x,reason:k===bk
      ?`${x.name} and ${base.name} are different ${KIND_LABEL[k]}. Only the same type${hasTech("alloy")?" or a fusion partner":""} can merge. Salvage it into essences instead.`
      :`${x.name} doesn't go into ${base.name}. Salvage it into essences, which mix with anything.`};
  }
  return{ok:true};
}
function acceptsText(it){
  const k=kindOf(it);
  if(grp(it)==="material")return `${KIND_LABEL[k]==="essences"?"anything":`other ${KIND_LABEL[k]}`}, essences and relics`;
  const mass=f=>["gloves","boots","food","body armor","head armor","claws"].includes(f);
  const fus=!hasTech("alloy")?[]:FUSIONS.filter(f=>f.slice(0,2).includes(it.form)).map(f=>formName(f[0]===it.form?f[1]:f[0])).map(f=>mass(f)?f:`a ${f}`);
  const own=ACCEPTS[k].includes(k)?[]:[`${mass(formName(it.form))?"other":"another"} ${formName(it.form)}`];
  return [...ACCEPTS[k].map(a=>KIND_LABEL[a]),...own,...(fus.length?[`${fus.join(" or ")} (fusion)`]:[])].join(", ");
}

// ================= COMBINE =================
// o.roll (0-100) fixes the success roll (100 = clean, used by previews and the balance sim); by default every attempt rolls for real. o.full keeps the failure chance even on the first forge (which never fails).
function combine(raw,o={}){
  const inputs=sortInputs(raw);
  const key=inputs.map(i=>i.id).sort().join("+"),log=[];
  const base=inputs[0],forms=inputs.map(i=>i.form);let form=base.form;
  for(const [a,b,f] of FUSIONS){if(forms.includes(a)&&forms.includes(b)){form=f;log.push({k:"Fusion",t:`${cap(a)} + ${cap(b)} → ${FORMS[f].noun}`});break}}
  const vals={};inputs.forEach(i=>Object.entries(i.traits).forEach(([t,v])=>(vals[t]=vals[t]||[]).push(v)));
  let tr={};Object.entries(vals).forEach(([t,vs])=>{const mx=Math.max(...vs),sum=vs.reduce((a,b)=>a+b,0);const g=.25*(sum-mx),lo=Math.max(0,Math.min(g,SOFT-mx));tr[t]=r1(mx+lo+(g-lo)/2);if(g>lo+.05)log.push({k:"Limit",t:`${t} is near its limit; gains above ${SOFT} are halved.`})}); // merge gains above SOFT count half
  let inst=0;CONFLICTS.forEach(([a,b])=>{if(tr[a]&&tr[b])inst+=Math.min(tr[a],tr[b])*7});
  const used=new Set(),reacted=new Set(),rxKeys=[];
  for(let pass=0;pass<3;pass++){let any=false;
    for(const [a,b,res,cons] of REACTIONS){const k=a+"+"+b;if(used.has(k)||!tr[a]||!tr[b])continue;
      used.add(k);any=true;rxKeys.push(k);const v=r1((tr[a]+tr[b])/2);
      cons.forEach(c=>delete tr[c]);tr[res]=r1(Math.max(tr[res]||0,v));reacted.add(res);
      log.push({k:"Reaction",t:`${a} + ${b} → ${res}`,warn:TRAITS[res].f==="bad"});inst+=3}
    if(!any)break}
  let secret=SECRETS.find(s=>s.ids.slice().sort().join("+")===key),mw=-1;
  if(secret&&!hasTech("master")){mw=SECRETS.indexOf(secret);secret=null} // without Masterwork the right ingredients make an ordinary piece (and an insight, see insights()); it gets its own id so the legendary can still be forged later
  if(!secret&&inputs.some(i=>gradeOf(i.id)!==3)){const sk=inputs.map(i=>baseIdOf(i.id)).sort().join("+");if(SECRETS.some(s=>s.ids.slice().sort().join("+")===sk))log.push({k:"Grade",t:"A graded ingredient throws this secret off. Secrets want Plain ones."})}
  let bon=null; // the secret's bonus always keeps a slot
  if(secret&&secret.bonus){const {trait:bt,v:bv}=secret.bonus;bon=[bt,r1((tr[bt]||0)+bv)];delete tr[bt];log.push({k:"Legendary",t:`The secret lends it +${bv} ${bt}.`})}
  const slots=traitSlots()-(bon?1:0),sorted=topTraits(tr);
  if(sorted.length>slots)log.push({k:"Lost",t:`${sorted.slice(slots).map(x=>x[0]).join(", ")} (only ${traitSlots()} trait slots)`});
  tr=Object.fromEntries(sorted.slice(0,slots));if(bon)tr[bon[0]]=bon[1];
  inst+=(inputs.length-2)*6;
  const tier=Math.min(9,Math.max(...inputs.map(i=>i.tier))+1),sk=skillOf({form}),lv=skLv(sk),ck=mw>=0?key+"|plain":key,cleanId="c_"+hash(ck).toString(36);
  const ups=inputs.filter(i=>i.crafted&&i.form===form),upg=ups.length?CRAFT.up*Math.max(0,Math.max(...ups.map(i=>i.tier))-CRAFT.upFrom):0;
  const diff=r1(CRAFT.base+(tier-1)*CRAFT.tier+inst/CRAFT.inst+upg),gap=diff-lv;
  const prec=PREC.reduce((n,p,i)=>n+(hasTech("prec"+(i+1))?p:0),0),fail=S.journal.length||o.full?Math.round(Math.max(FAIL.min,Math.min(FAIL.max,FAIL.base+FAIL.slope*gap-prec))):0; // the very first forge never fails
  const fiz=Math.round(fail*Math.max(FIZ.min,Math.min(FIZ.max,FIZ.base+FIZ.slope*gap))),mis=fail-fiz;
  const need=SK_CAP.findIndex(c=>c>=tier)+1,blocked=tier>SK_CAP[lv-1]?{skill:sk,lv,need,tier}:null;
  const roll=o.roll??Math.random()*100;let mishap=null,unweak=null,fizzle=false;
  if(roll<fiz){fizzle=true;log.push({k:"Fizzle",t:"The mixture collapsed into ash. The ingredients are gone.",warn:true})}
  else if(roll<fail){mishap=["Cursed","Weakened","Brittle"][Math.floor(Math.random()*3)];
    if(mishap==="Weakened"){unweak={...tr};Object.keys(tr).forEach(t=>tr[t]=r1(tr[t]*.7))}else tr[mishap]=2;
    log.push({k:"Mishap",t:mishap==="Weakened"?"The mixture fizzled. Every trait lost 30%.":`The mixture turned unstable and became ${mishap}.`,warn:true})}
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
function power(it){const s=statsOf(it);return Math.round(s.atk+s.def+s.mag+s.spd*1.5+s.heal*.5)}
// essences that went into a crafted item: stored as `ei` when it was forged (temper and reforge spread the item, so it survives them); older items count through recipeIds, and an older tempered piece with neither counts 1
const essIn=(it,d=0)=>!it||!it.crafted||d>8?0:it.ei!=null?it.ei:it.recipeIds?it.recipeIds.reduce((n,r)=>n+(isEss(r)?1:essIn(S.items[r],d+1)),0):1;
// up to two essences from the item's top traits, but a crafted item never gives back more essences than were put into it (a raw drop is free, a forged-with-essence piece is not a mint)
function salvageYield(it){if(it.id.startsWith("ess_"))return[];const ys=topTraits(it.grade?baseItem(baseIdOf(it.id)).traits:it.traits).filter(([t])=>TRAITS[t].f!=="bad").slice(0,2).filter(([,v],i)=>i===0||v>=2).map(([t])=>t),n=essIn(it);return n?ys.slice(0,n):ys}
// Forge for real: ingredients out, the result in, smith XP and skills, research points and insights. The caller announces it (render, toasts, the animation).
function forgeIt(items){
  const lvBefore=level(),sk0=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,skLv(k)])),r=combine(items),{item,log,inst,mishap,fizzle,cleanId,skill,diff,baseId,rxKeys}=r;
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
    S.inv[item.id]=(S.inv[item.id]||0)+1;S.knownR.push(...newRx);
    settleGear(S.items[item.id]);
    rpGain("form:"+item.form,RP.form,`a new form (${formName(item.form)})`);if(isNew&&rpCount("rec:")<RP.recCap)rpGain("rec:"+cleanId,RP.rec,"a new recipe");
    newRx.forEach(k=>rpGain("rx:"+k,RP.rx,"a new reaction"));if(firstLeg)rpGain("leg:"+item.name,RP.leg,"a legendary");
    log.push(...insights(items,r.key,r.mw));
    gain+=(isNew?25:0)+(firstLeg?100:0)+newRx.length*10}
  S.xp+=gain; // smith XP is not scaled by difficulty: it only gates slots, the skills gate tiers
  const sx={},add=(k,sh)=>{if(!(k in sx))sx[k]=Math.max(1,Math.round(gain*sh*skFactor(diff,skLv(k))*(known?.5:1)))};
  add(skill,SK_XP.self);items.forEach(i=>add(skillOf(i),SK_XP.input)); // the result's skill, then each other input category once
  const scaled=Object.keys(sx).some(k=>skFactor(diff,skLv(k))<1)||known;
  Object.entries(sx).forEach(([k,n])=>S.skills[k]=skXp(k)+n);
  const ups=Object.keys(sx).filter(k=>skLv(k)>sk0[k]);
  S.last={id:fizzle?null:item.id,item,log:fizzle?log.filter(l=>l.k==="Fizzle"):log,inst,mishap,fizzle,refund,isNew,xpGain:gain,sx,scaled,baseId,recipe:items.map(i=>i.name)};
  save();
  return{lvBefore,sk0,ups,newRx,item,fizzle};
}
