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
      ?`${x.name} and ${base.name} are different ${KIND_LABEL[k]}. Only the same type or a fusion partner can merge. Salvage it into essences instead.`
      :`${x.name} doesn't go into ${base.name}. Salvage it into essences, which mix with anything.`};
  }
  return{ok:true};
}
function acceptsText(it){
  const k=kindOf(it);
  if(grp(it)==="material")return `${KIND_LABEL[k]==="essences"?"anything":`other ${KIND_LABEL[k]}`}, essences and relics`;
  const mass=f=>["gloves","boots","food","body armor","head armor","claws"].includes(f);
  const fus=FUSIONS.filter(f=>f.slice(0,2).includes(it.form)).map(f=>formName(f[0]===it.form?f[1]:f[0])).map(f=>mass(f)?f:`a ${f}`);
  const own=ACCEPTS[k].includes(k)?[]:[`${mass(formName(it.form))?"other":"another"} ${formName(it.form)}`];
  return [...ACCEPTS[k].map(a=>KIND_LABEL[a]),...own,...(fus.length?[`${fus.join(" or ")} (fusion)`]:[])].join(", ");
}

// ================= COMBINE =================
function combine(raw){
  const inputs=sortInputs(raw);
  const key=inputs.map(i=>i.id).sort().join("+"),rand=rng(hash(key)),log=[];
  const base=inputs[0],forms=inputs.map(i=>i.form);let form=base.form;
  for(const [a,b,f] of FUSIONS){if(forms.includes(a)&&forms.includes(b)){form=f;log.push({k:"Fusion",t:`${cap(a)} + ${cap(b)} → ${FORMS[f].noun}`});break}}
  const vals={};inputs.forEach(i=>Object.entries(i.traits).forEach(([t,v])=>(vals[t]=vals[t]||[]).push(v)));
  let tr={};Object.entries(vals).forEach(([t,vs])=>{const mx=Math.max(...vs),sum=vs.reduce((a,b)=>a+b,0);tr[t]=r1(mx+.25*(sum-mx))});
  let inst=0;CONFLICTS.forEach(([a,b])=>{if(tr[a]&&tr[b])inst+=Math.min(tr[a],tr[b])*7});
  const used=new Set(),reacted=new Set(),rxKeys=[];
  for(let pass=0;pass<3;pass++){let any=false;
    for(const [a,b,res,cons] of REACTIONS){const k=a+"+"+b;if(used.has(k)||!tr[a]||!tr[b])continue;
      used.add(k);any=true;rxKeys.push(k);const v=r1((tr[a]+tr[b])/2);
      cons.forEach(c=>delete tr[c]);tr[res]=r1(Math.max(tr[res]||0,v));reacted.add(res);
      log.push({k:"Reaction",t:`${a} + ${b} → ${res}`,warn:TRAITS[res].f==="bad"});inst+=3}
    if(!any)break}
  const slots=traitSlots(),sorted=topTraits(tr);
  if(sorted.length>slots)log.push({k:"Lost",t:`${sorted.slice(slots).map(x=>x[0]).join(", ")} (only ${slots} trait slots)`});
  tr=Object.fromEntries(sorted.slice(0,slots));
  inst+=(inputs.length-2)*6;inst=Math.max(0,Math.min(85,Math.round(inst-level()*4)));
  let mishap=null;
  if(rand()*100<inst){mishap=["Cursed","Weakened","Brittle"][Math.floor(rand()*3)];
    if(mishap==="Weakened")Object.keys(tr).forEach(t=>tr[t]=r1(tr[t]*.7));else tr[mishap]=2;
    log.push({k:"Mishap",t:mishap==="Weakened"?"The mixture fizzled. Every trait lost 30%.":`The mixture turned unstable and became ${mishap}.`,warn:true})}
  const secret=SECRETS.find(s=>s.ids.slice().sort().join("+")===key);
  const noun=FORMS[form].noun||base.noun;
  const score=([t,v])=>v+(t in base.traits?0:3)+(reacted.has(t)?1:0);
  const ranked=Object.entries(tr).filter(([t])=>TRAITS[t].adj.toLowerCase()!==noun.toLowerCase()).sort((a,b)=>score(b)-score(a)).map(x=>x[0]);
  const name=secret?secret.name:[...ranked.slice(0,2).map(t=>TRAITS[t].adj),noun].join(" ");
  const tier=Math.min(9,Math.max(...inputs.map(i=>i.tier))+1);
  const item={id:"c_"+hash(key).toString(36),name,form,noun,traits:tr,tier,crafted:true,legendary:!!secret,recipe:inputs.map(i=>i.name),recipeIds:inputs.map(i=>i.id)};
  if(form==="material"){const core=inputs.map(kindOf).find(k=>k!=="essence"&&k!=="relic");item.kind=core||(inputs.some(i=>kindOf(i)==="relic")?"relic":"essence")}
  return {item,log,inst,mishap,baseId:base.id,rxKeys};
}
function statsOf(item){
  const out={atk:0,def:0,mag:0,heal:0,spd:0},m=FORMS[item.form].m;
  topTraits(item.traits).forEach(([t,v],i)=>Object.entries(TRAITS[t].s).forEach(([s,w])=>out[s]+=w*v*(w<0?1:(DECAY[i]??.1))));
  const scale=(1+.03*(item.tier-1))*(item.legendary?1.2:1);
  Object.keys(out).forEach(s=>out[s]=Math.round(out[s]*m[s]*scale));
  return out;
}
function power(it){const s=statsOf(it);return Math.round(s.atk+s.def+s.mag+s.spd*1.5+s.heal*.5)}
function salvageYield(it){if(it.id.startsWith("ess_"))return[];return topTraits(it.traits).filter(([t])=>TRAITS[t].f!=="bad").slice(0,2).filter(([,v],i)=>i===0||v>=2).map(([t])=>t)}
