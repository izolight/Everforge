// ================= RESEARCH =================
// Research points (S.rp) are earned by discoveries (RP in data.js; S.rpd keys the sources already paid) and spent on techniques (TECHS; S.techs). The techniques decide what the forge accepts (craftMiss).
const hasTech=id=>!!S.techs[id],allTechs=()=>TECHS.every(t=>S.techs[t.id]);
const rpSpent=()=>TECHS.reduce((n,t)=>n+(S.techs[t.id]?t.cost:0),0),rpEarned=()=>S.rp+rpSpent();
let rpQ=[];
function rpGain(key,n,why){ // a discovery pays once; the toast is batched per action (rpFlush, end of render)
  if(S.rpd[key]||allTechs())return 0;S.rpd[key]=1;S.rp+=n;rpQ.push([n,why,key.split(":")[0]]);return n;
}
// milestones that keep paying as you grow: each Smith level from 2 to RP.lvMax, and the first crafting skill to reach each of RP.skLv. Retroactive and idempotent (each key pays once).
function rpSweep(){
  for(let l=2;l<=RP.lvMax;l++)if(level()>=l)rpGain("lv:"+l,RP.lv,`Smith level ${l}`);
  RP.skLv.forEach(l=>{if(Object.keys(SKILLS).some(k=>skLv(k)>=l))rpGain("sk:"+l,RP.sk,`a skill at level ${l}`)});
}
const RP_MANY={fam:"new essences",rec:"new recipes",rx:"new reactions",mast:"creatures mastered",afx:"new affixes",study:"families studied"};
function rpFlush(){ // quiet until Research is open (the points wait for you)
  rpSweep();if(!rpQ.length)return;const q=rpQ;rpQ=[];if(!isUnl("research"))return;
  const n=q.reduce((a,x)=>a+x[0],0),by={};q.forEach(x=>(by[x[2]]=by[x[2]]||[]).push(x));
  const txt=Object.entries(by).map(([k,l])=>l.length>1&&RP_MANY[k]?`${l.length} ${RP_MANY[k]}`:l.map(x=>x[1]).join(", ")).join(", ");
  sfx("research");setTimeout(()=>toast(`+${n} research: ${txt}.`,1),0);
}
// a trait reaction found (a forge, a lesson): it pays once, whoever teaches it
function learnReaction(k){if(S.knownR.includes(k))return false;S.knownR.push(k);rpGain("rx:"+k,RP.rx,"a new reaction");return true}
const rpCount=p=>Object.keys(S.rpd).filter(k=>k.startsWith(p)).length;
// ---- what a craft needs. Binding (known from the start) is an item and one essence; everything else is a technique
const techNames=ids=>ids.map(i=>TECH[i].name).join(ids.length>2?", ":" and ");
function craftMiss(items){
  const n=items.length;if(n<2)return[];
  const ess=items.filter(x=>kindOf(x)==="essence").length,forms=items.map(x=>x.form),fus=FUSIONS.some(([a,b])=>forms.includes(a)&&forms.includes(b));
  const need=[];
  if(n>=3)need.push("temper");if(fus)need.push("alloy");if(items.some(x=>x.crafted))need.push("layer");
  if(n-ess-(fus?2:1)!==0)need.push("compound"); // anything but one item (or one fusion pair) and essences
  return need.filter(id=>!hasTech(id));
}
const mwWarn="These are the ingredients of something legendary. Without the Masterwork technique (Research) you would forge only an ordinary piece. Tap Forge twice to confirm.";
const techWhy=ids=>isUnl("research")?`Needs the ${techNames(ids)} technique${ids.length>1?"s":""} (Research).`:"Start simple: bind one essence into an item.";
// ---- learning
function techState(t,s=S){return s.techs[t.id]?"learned":t.pre.every(p=>s.techs[p])&&t.ok(s)?"avail":"locked"}
function techLack(t){ // what stands between you and learning it, as text lines
  const l=t.pre.filter(p=>!S.techs[p]).map(p=>`Learn ${TECH[p].name} first.`);if(!t.ok(S))l.push(`Needs ${t.rq}.`);return l;
}
function learnTech(id){
  const t=TECH[id];if(!t||S.techs[id]||inBattle())return;
  const lack=techLack(t);if(lack.length)return toast(lack[0]);if(S.rp<t.cost)return toast(`${t.name} costs ${t.cost} research points. You have ${S.rp}.`);
  S.rp-=t.cost;S.techs[id]=Math.max(0,...Object.values(S.techs))+1;sfx("tech");
  save();render();toast(`Learned ${t.name}. ${t.d}`);
}
// ---- material study: spend one essence of a family to learn about a reaction it takes part in. S.rxh[key] lists the traits of that reaction you know: first the family, then (a second study) its partner
const rxKey=r=>r[0]+"+"+r[1],rxHint=k=>S.rxh[k]||[];
const studyPool=f=>Object.keys(S.inv).filter(id=>isEss(id)&&essTrait(id)===f&&avail(id)>0).sort((a,b)=>gradeOf(a)-gradeOf(b));
function studyStep(f){ // the next thing studying f would reveal: [reaction, trait to show] or null
  const open=REACTIONS.filter(r=>r[0]===f||r[1]===f).filter(r=>!S.knownR.includes(rxKey(r)));
  const half=open.find(r=>rxHint(rxKey(r)).includes(f)&&rxHint(rxKey(r)).length<2);if(half)return[half,half[0]===f?half[1]:half[0]];
  const fresh=open.find(r=>!rxHint(rxKey(r)).includes(f));return fresh?[fresh,f]:null;
}
const canStudy=f=>studyPool(f).length>0&&(!!studyStep(f)||!S.rpd["study:"+f]);
function studyFam(f){
  if(inBattle()||!canStudy(f))return;
  const id=studyPool(f)[0],st=studyStep(f);let msg;
  S.inv[id]--;trimBench();
  if(st){const [r,t]=st,k=rxKey(r);S.rxh[k]=[...rxHint(k),t];
    msg=t===f?`${f} takes part in a reaction: ${r[0]===f?`${f} + ???`:`??? + ${f}`} (see Recipes).`:`${f} reacts with ${t}: ${rxHint(k).sort((a,b)=>r.indexOf(a)-r.indexOf(b)).join(" + ")} → ???.`}
  else msg=`${f} stands alone: it takes part in no reaction.`;
  rpGain("study:"+f,RP.study,`you studied ${f}`);
  sfx("research");save();render();toast(msg);
}
// ---- insights: a craft that holds one side of an unseen reaction may hint at it; the roll comes from a hash of the craft, so it is the same every time for the same state. A craft with over half of a secret's ingredients senses it.
const insightRoll=key=>hash(`ins|${key}|${S.stats.forged}`)%100<INSIGHT.ch; // one roll per craft, so the odds do not grow with how many reactions it could hint at
function insights(items,key,mw){
  const out=[],tr=new Set(items.flatMap(i=>Object.keys(i.traits))),flavor=["stirs","hums","trembles","glows faintly"];
  const cand=REACTIONS.filter(r=>!S.knownR.includes(rxKey(r))).map(r=>[r,tr.has(r[0])&&!tr.has(r[1])?r[0]:tr.has(r[1])&&!tr.has(r[0])?r[1]:null]).filter(([r,side])=>side&&!rxHint(rxKey(r)).includes(side));
  if(cand.length&&insightRoll(key)){const [r,side]=cand[hash(`pick|${key}|${S.stats.forged}`)%cand.length],k=rxKey(r),other=side===r[0]?r[1]:r[0];S.rxh[k]=[...rxHint(k),side];
    out.push({k:"Insight",t:`The ${side} ${flavor[hash(k+key)%flavor.length]} in the crucible… (insight: ${side} reacts with ${VAGUE[other]||"something"}.)`})}
  const ids=items.map(i=>baseIdOf(i.id));
  SECRETS.forEach((sc,i)=>{if(found(sc))return;const n=sc.ids.filter(x=>ids.includes(x)).length,exact=mw===i;
    if(!exact&&(n*2<=sc.ids.length||S.rpd["nm:"+i]))return;
    S.rpd["nm:"+i]=1;if(!hintLv(i))S.hints.push(i); // a first sense of a secret surfaces its rumor in Recipes
    out.push({k:"Insight",t:exact?`This feels close to something greater… (insight: it needs the Masterwork technique.)`:`This feels close to something greater… (insight: a legendary secret hides near these ingredients.)`})});
  return out;
}
// ---- the Research panel (Forge tab)
let techSel=null;
const techTip=t=>tt(`${t.name}${t.cost?` · ${t.cost} RP`:""}`,{learned:"Learned.",avail:"Ready to learn.",locked:"Locked."}[techState(t)],t.d,`Opens: ${t.gate}`,...(S.techs[t.id]?[]:techLack(t)));
function renderResearch(){
  const on=isUnl("research");$("resd").hidden=!on;$("reslock").hidden=on;if(!on){$("reslock").innerHTML=lockRow("research");return}
  const rdy=TECHS.filter(t=>techState(t)==="avail"&&S.rp>=t.cost).length;
  $("ressum").innerHTML=`${ic("research","s")} Research · ${S.rp} RP${rdy?` <b class="rdy">${rdy}</b>`:""}${helpBtn("Research","Discoveries earn research points: a first craft of each kind, a new reaction, a new essence, a studied creature, a boss down, a new affix, and each new smith or skill level.","Techniques decide what the forge accepts. Tap one to read it; Learn spends the points.","Study a material to hint at its reactions.")}`;
  if(!techSel||!TECH[techSel])techSel=(TECHS.find(t=>techState(t)==="avail"&&S.rp>=t.cost)||TECHS.find(t=>techState(t)==="avail")||TECHS[0]).id;
  const W=4,H=4,at=([c,r])=>`left:${(c+.5)/W*100}%;top:${(r+.5)/H*100}%`;
  const lines=TECHS.flatMap(t=>t.pre.map(p=>{const a=TECH[p].pos,b=t.pos,on=S.techs[p]&&S.techs[t.id];return `<line x1="${(a[0]+.5)/W*100}" y1="${(a[1]+.5)/H*100}" x2="${(b[0]+.5)/W*100}" y2="${(b[1]+.5)/H*100}" class="${on?"on":""}"/>`})).join("");
  const nodes=TECHS.map(t=>{const st=techState(t),afford=st==="avail"&&S.rp>=t.cost,bd=st==="learned"?ic("equip","xs"):st==="locked"?ic("lock","xs"):t.cost;
    return `<button class="tn ${st}${afford?" can":""}${t.id===techSel?" sel":""}" style="${at(t.pos)}" data-tech="${t.id}" aria-label="${t.name}, ${st}${st==="avail"?`, ${t.cost} research points`:""}" aria-pressed="${t.id===techSel}" ${techTip(t)}>${ic(t.ic,"l")}<i class="tb">${bd}</i><span>${t.name}</span></button>`}).join("");
  const t=TECH[techSel],st=techState(t),lack=st==="locked"?techLack(t):[],can=st==="avail"&&S.rp>=t.cost&&!inBattle();
  const req=[...t.pre.map(p=>[TECH[p].name,!!S.techs[p]]),...t.rq?[[t.rq,t.ok(S)]]:[]];
  $("restree").innerHTML=`<div class="tree"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}</div>
    <div class="tdet"><span class="ti2">${ic(t.ic,"l")}</span><div class="tdb"><b>${t.name}</b><small>${st==="learned"?"Learned":st==="avail"?"Ready":"Locked"}${t.cost?` · ${t.cost} RP`:""}</small><p>${t.d}</p><p class="foot">Opens: ${t.gate}</p>
      ${req.length&&st!=="learned"?`<div class="treq">${req.map(([n,ok])=>`<span class="${ok?"ok":"no"}">${ic(ok?"equip":"lock","xs")}${n}</span>`).join("")}</div>`:""}</div>
      ${st==="learned"?"":`<button class="btn ${can?"primary":""} sm" id="learn" ${can?"":`aria-disabled="true" data-tap ${tt(t.name,...lack,...S.rp<t.cost&&!lack.length?[`Costs ${t.cost} research points. You have ${S.rp}.`]:[],...inBattle()?["Finish the fight first."]:[])}`}>Learn · ${t.cost}</button>`}</div>
    <p class="label">${ic("study","s")} Study a material${helpBtn("Study a material","Spend one essence of a family to learn about a reaction it takes part in: first the family, then its partner.","A first study of each family also earns a research point.")}</p>
    <div class="chips sty">${(()=>{const fams=[...new Set(Object.keys(S.inv).filter(id=>isEss(id)&&avail(id)>0).map(essTrait))].sort();
      return fams.length?fams.map(f=>{const ok=canStudy(f)&&!inBattle(),stp=studyStep(f),n=studyPool(f).reduce((a,id)=>a+avail(id),0);
        return `<button class="chip sty1${ok?"":" off"}" style="color:${tColor(f)}" data-study="${f}" ${ok?"":'aria-disabled="true" data-tap'} aria-label="Study ${f}" ${tt(`Study ${f}`,ok?"Spend one to learn about its reactions."+(stp?"":" It has none left to find, but you may learn its nature once."):inBattle()?"Finish the fight first.":"There is nothing more to learn from it.",`You hold ${n}.`)}>${famIc(TRAITS[f].f,"s")}${f}<b>${n}</b></button>`}).join(""):`<p class="foot">Salvage gear for essences to study.</p>`})()}</div>`;
}
