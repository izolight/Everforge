// ================= RESEARCH =================
// Research points (S.rp) are earned by discoveries (RP in data.js; S.rpd keys the sources already paid) and spent on techniques (TECHS; S.techs, what each cost in S.tpaid). The techniques decide what the forge accepts (actionOk).
const hasTech=id=>!!S.techs[id],allTechs=()=>TECHS.every(t=>S.techs[t.id]);
const rpSpent=()=>Object.keys(S.techs).reduce((n,id)=>n+((S.tpaid||{})[id]??TECH[id].cost),0),rpEarned=()=>S.rp+rpSpent();
let rpQ=[];
function rpGain(key,n,why){ // a discovery pays once; the toast is batched per action (rpFlush, end of render)
  if(S.rpd[key]||allTechs())return 0;S.rpd[key]=1;S.rp+=n;rpQ.push([n,why,key.split(":")[0]]);return n;
}
// milestones that keep paying as you grow: each Smith level from 2 to RP.lvMax, and the first crafting skill to reach each of RP.skLv. Retroactive and idempotent (each key pays once).
function rpSweep(){
  for(let l=2;l<=RP.lvMax;l++)if(level()>=l)rpGain("lv:"+l,RP.lv,tx("Smith level {l}",{l}));
  RP.skLv.forEach(l=>{if(Object.keys(SKILLS).some(k=>skLv(k)>=l))rpGain("sk:"+l,RP.sk,tx("a skill at level {l}",{l}))});
}
const RP_MANY={fam:n=>txn("{n} new essence","{n} new essences",n),rec:n=>txn("{n} new recipe","{n} new recipes",n),rx:n=>txn("{n} new reaction","{n} new reactions",n),mast:n=>txn("{n} creature mastered","{n} creatures mastered",n),afx:n=>txn("{n} new affix","{n} new affixes",n),study:n=>txn("{n} family studied","{n} families studied",n)};
function rpFlush(){ // quiet until Research is open (the points wait for you)
  rpSweep();if(!rpQ.length)return;const q=rpQ;rpQ=[];if(!isUnl("research"))return;
  const n=q.reduce((a,x)=>a+x[0],0),by={};q.forEach(x=>(by[x[2]]=by[x[2]]||[]).push(x));
  const txt=Object.entries(by).map(([k,l])=>l.length>1&&RP_MANY[k]?RP_MANY[k](l.length):l.map(x=>x[1]).join(", ")).join(", ");
  sfx("research");setTimeout(()=>toast(tx("+{n} research: {list}.",{n,list:txt}),1),0);
}
// a trait reaction found (a forge, a lesson): it pays once, whoever teaches it
function learnReaction(k){if(S.knownR.includes(k))return false;S.knownR.push(k);rpGain("rx:"+k,RP.rx,tx("a new reaction"));return true}
const rpCount=p=>Object.keys(S.rpd).filter(k=>k.startsWith(p)).length;
// Slot techniques: 6, or 3 once their group technique is known. The group grants one free pick: until a slot of the group is learned for nothing, every slot of it costs 0 (tpaid 0 marks the pick).
const freeOpen=(g,s=S)=>!Object.keys(s.techs).some(id=>TECH[id].gr===g&&!TECH[id].group&&(s.tpaid||{})[id]===0);
function techCost(t,s=S){if(!t.gr||t.group||!s.techs[GROUP_TECH[t.gr]])return t.cost;return freeOpen(t.gr,s)?0:3}
const preOk=(t,s=S)=>t.pre.every(p=>s.techs[p])&&(!t.or||t.or.some(p=>s.techs[p]))&&t.ok(s);
// ---- what a craft needs. actionOk(items) returns the techniques the inputs need and you lack (none: the craft may go ahead). A form's techniques: its slot technique (a pattern, a blueprint, a fusion piece) and its kitchen technique (food, potions, materials). Essences need Infusing (II for two, III for an item that is already infused); other materials and a second item need Improving (II for several); a fusion needs Fusing and both forms; essences alone need Alchemy.
const formTechs=f=>[SLOT_TECH[f],KITCHEN_TECH[f]].filter(Boolean),formOk=f=>formTechs(f).every(hasTech),fusionOk=([a,b])=>hasTech("fuse")&&formOk(a)&&formOk(b); // formOk: the form can be forged (its slot and kitchen techniques); a fusion pair needs Fusing and both forms
const techNames=ids=>ids.map(i=>tx(TECH[i].name)).join(ids.length>2?", ":tx(" and ")),rqT=t=>t.rq?tx(t.rq,t.rv):""; // rq is English with {placeholders}; rv its numbers
function actionOk(items){
  const n=items.length;if(n<2)return[];
  const ess=items.filter(x=>kindOf(x)==="essence").length,rest=items.filter(x=>kindOf(x)!=="essence"),need=[];
  if(!rest.length)return["alchemy"].filter(id=>!hasTech(id)); // essences alone are made by Alchemy
  const f=rest.map(x=>x.form),fus=rest.length===2&&FUSIONS.some(p=>f[0]===p[0]&&f[1]===p[1]||f[0]===p[1]&&f[1]===p[0]);
  if(fus)need.push("fuse",...rest.flatMap(x=>formTechs(x.form)));
  else{
    const base=rest.find(x=>grp(x)!=="material")||rest[0],others=rest.length-1;
    if(grp(base)!=="material"&&others>0){need.push("improve");if(others>1)need.push("improve2")}
    need.push(...(KITCHEN_TECH[base.form]?[KITCHEN_TECH[base.form]]:[]));
  }
  if(ess){need.push("infuse");if(ess>1)need.push("infuse2");if(rest.some(x=>x.crafted&&x.ei>0))need.push("infuse3")}
  return[...new Set(need)].filter(id=>!hasTech(id));
}
const mwWarn=()=>tx("These are the ingredients of something legendary. Without the Masterwork technique (Research) you would forge only an ordinary piece. Tap Forge twice to confirm.");
const techWhy=ids=>isUnl("research")?txn("Needs the {names} technique (Research).","Needs the {names} techniques (Research).",ids.length,{names:techNames(ids)}):tx("Learn a technique in Research first.");
// ---- learning
function techState(t,s=S){return s.techs[t.id]?"learned":preOk(t,s)?"avail":"locked"}
function techLack(t){ // what stands between you and learning it, as text lines
  const l=t.pre.filter(p=>!S.techs[p]).map(p=>tx("Learn {name} first.",{name:tx(TECH[p].name)}));if(t.or&&!t.or.some(p=>S.techs[p]))l.push(tx("Learn one of {names} first.",{names:techNames(t.or)}));if(!t.ok(S))l.push(tx("Needs {rq}.",{rq:rqT(t)}));return l;
}
function learnTech(id){
  const t=TECH[id];if(!t||S.techs[id]||inBattle())return;
  const lack=techLack(t);if(lack.length)return toast(lack[0]);const c=techCost(t);if(S.rp<c)return toast(tx("{name} costs {cost} research points. You have {rp}.",{name:tx(t.name),cost:c,rp:S.rp}));
  S.rp-=c;S.tpaid[id]=c;S.techs[id]=Math.max(0,...Object.values(S.techs))+1;sfx("tech");
  save();render();toast(tx("Learned {name}. {d}",{name:tx(t.name),d:tx(t.d,t.v)}));
}
// ---- material study: spend one essence of a family to learn about a reaction it takes part in. S.rxh[key] lists the traits of that reaction you know: first the family, then (a second study) its partner
const rxKey=r=>r[0]+"+"+r[1],rxHint=k=>S.rxh[k]||[];
const studyPool=f=>Object.keys(S.inv).filter(id=>isEss(id)&&!itemLocked(id)&&essTrait(id)===f&&avail(id)>0).sort((a,b)=>gradeOf(a)-gradeOf(b));
function studyStep(f){ // the next thing studying f would reveal: [reaction, trait to show] or null
  const open=REACTIONS.filter(r=>r[0]===f||r[1]===f).filter(r=>!S.knownR.includes(rxKey(r)));
  const half=open.find(r=>rxHint(rxKey(r)).includes(f)&&rxHint(rxKey(r)).length<2);if(half)return[half,half[0]===f?half[1]:half[0]];
  const fresh=open.find(r=>!rxHint(rxKey(r)).includes(f));return fresh?[fresh,f]:null;
}
const canStudy=f=>studyPool(f).length>0&&(!!studyStep(f)||!S.rpd["study:"+f]);
function studyFam(f){
  if(inBattle()||!canStudy(f))return;
  const id=studyPool(f)[0],st=studyStep(f),tf=trn(f);let msg;
  S.inv[id]--;trimBench();
  if(st){const [r,t]=st,k=rxKey(r);S.rxh[k]=[...rxHint(k),t];
    msg=t===f?tx("{f} takes part in a reaction: {pair} (see Recipes).",{f:tf,pair:r[0]===f?`${tf} + ???`:`??? + ${tf}`}):tx("{f} reacts with {t}: {pair} → ???.",{f:tf,t:trn(t),pair:rxHint(k).sort((a,b)=>r.indexOf(a)-r.indexOf(b)).map(trn).join(" + ")})}
  else msg=tx("{f} stands alone: it takes part in no reaction.",{f:tf});
  rpGain("study:"+f,RP.study,tx("you studied {f}",{f:tf}));
  sfx("research");save();render();toast(msg);
}
// ---- insights: a craft that holds one side of an unseen reaction may hint at it; the roll comes from a hash of the craft, so it is the same every time for the same state. A craft with over half of a secret's ingredients senses it.
const insightRoll=key=>hash(`ins|${key}|${S.stats.forged}`)%100<INSIGHT.ch; // one roll per craft, so the odds do not grow with how many reactions it could hint at
function insights(items,key,mw){
  const out=[],tr=new Set(items.flatMap(i=>Object.keys(i.traits))),flavor=[s=>tx("The {side} stirs in the crucible…",{side:s}),s=>tx("The {side} hums in the crucible…",{side:s}),s=>tx("The {side} trembles in the crucible…",{side:s}),s=>tx("The {side} glows faintly in the crucible…",{side:s})];
  const cand=REACTIONS.filter(r=>!S.knownR.includes(rxKey(r))).map(r=>[r,tr.has(r[0])&&!tr.has(r[1])?r[0]:tr.has(r[1])&&!tr.has(r[0])?r[1]:null]).filter(([r,side])=>side&&!rxHint(rxKey(r)).includes(side));
  if(cand.length&&insightRoll(key)){const [r,side]=cand[hash(`pick|${key}|${S.stats.forged}`)%cand.length],k=rxKey(r),other=side===r[0]?r[1]:r[0];S.rxh[k]=[...rxHint(k),side];
    out.push({k:"Insight",t:flavor[hash(k+key)%flavor.length](trn(side))+" "+tx("(insight: {side} reacts with {v}.)",{side:trn(side),v:tx(VAGUE[other]||"something")})})}
  const ids=items.map(i=>baseIdOf(i.id));
  SECRETS.forEach((sc,i)=>{if(found(sc))return;const n=sc.ids.filter(x=>ids.includes(x)).length,exact=mw===i;
    if(!exact&&(n*2<=sc.ids.length||S.rpd["nm:"+i]))return;
    S.rpd["nm:"+i]=1;if(!hintLv(i))S.hints.push(i); // a first sense of a secret surfaces its rumor in Recipes
    out.push({k:"Insight",t:tx("This feels close to something greater…")+" "+(exact?tx("(insight: it needs the Masterwork technique.)"):tx("(insight: a legendary secret hides near these ingredients.)"))})});
  return out;
}
// ---- the Research panel (Forge tab)
let techSel=null;
const TREE_ROW=84,TREE_HEAD=28; // px: one row of the technique tree, and the band above it for the branch names
const techSt=t=>({learned:tx("Learned"),avail:tx("Ready"),locked:tx("Locked")}[techState(t)]);
const techTip=t=>tt(`${tx(t.name)}${techCost(t)?` · ${tx("{n} RP",{n:techCost(t)})}`:""}`,{learned:tx("Learned."),avail:tx("Ready to learn."),locked:tx("Locked.")}[techState(t)],tx(t.d,t.v),tx("Opens: {gate}",{gate:tx(t.gate)}),...(S.techs[t.id]?[]:techLack(t)));
function renderResearch(){
  const on=isUnl("research");$("resd").hidden=!on;$("reslock").hidden=on;if(!on){$("reslock").innerHTML=lockRow("research");return}
  const rdy=TECHS.filter(t=>techState(t)==="avail"&&S.rp>=techCost(t)).length;
  $("ressum").innerHTML=`${ic("research","s")} ${tx("Research")} · ${tx("{n} RP",{n:S.rp})}${rdy?` <b class="rdy">${rdy}</b>`:""}${helpBtn(tx("Research"),tx("Discoveries earn research points: a first craft of each kind, a new reaction, a new essence, a studied creature, a boss down, a new affix, and each new smith or skill level."),tx("Techniques decide what the forge accepts. Tap one to read it; Learn spends the points."),tx("Study a material to hint at its reactions."))}`;
  if(!techSel||!TECH[techSel])techSel=(TECHS.find(t=>techState(t)==="avail"&&S.rp>=techCost(t))||TECHS.find(t=>techState(t)==="avail")||TECHS[0]).id;
  // the grid is as wide and tall as its positions (pos) say: columns are a share of the width, rows are px and the tree scrolls down. Lines join each prerequisite to its technique.
  const W=Math.max(...TECHS.map(t=>t.pos[0]))+1,H=Math.max(...TECHS.map(t=>t.pos[1]))+1,ROW=TREE_ROW,HD=TREE_HEAD,PH=H*ROW+HD,at=([c,r])=>`left:${(c+.5)/W*100}%;top:${HD+(r+.5)*ROW}px`;
  const lines=TECHS.flatMap(t=>t.pre.map(p=>{const a=TECH[p].pos,b=t.pos,on=S.techs[p]&&S.techs[t.id];return `<line x1="${(a[0]+.5)/W*100}" y1="${HD+(a[1]+.5)*ROW}" x2="${(b[0]+.5)/W*100}" y2="${HD+(b[1]+.5)*ROW}" class="${on?"on":""}"/>`})).join("");
  const branches=BRANCHES.map(b=>`<div class="tbr" style="left:${b.c[0]/W*100}%;width:${(b.c[1]-b.c[0]+1)/W*100}%"><b>${tx(b.name)}</b></div>`).join("");
  const nodes=TECHS.map(t=>{const st=techState(t),afford=st==="avail"&&S.rp>=techCost(t),bd=st==="learned"?ic("equip","xs"):st==="locked"?ic("lock","xs"):techCost(t);
    return `<button class="tn ${st}${afford?" can":""}${t.id===techSel?" sel":""}" style="${at(t.pos)}" data-tech="${t.id}" aria-label="${esc(`${tx(t.name)}, ${lc(techSt(t))}${st==="avail"?`, ${txn("{n} research point","{n} research points",techCost(t))}`:""}`)}" aria-pressed="${t.id===techSel}" ${techTip(t)}>${ic(t.ic,"l")}<i class="tb">${bd}</i><span>${tx(t.name)}</span></button>`}).join("");
  const t=TECH[techSel],st=techState(t),lack=st==="locked"?techLack(t):[],can=st==="avail"&&S.rp>=techCost(t)&&!inBattle();
  const req=[...t.pre.map(p=>[tx(TECH[p].name),!!S.techs[p]]),...t.or?[[t.or.map(p=>tx(TECH[p].name)).join(tx(" or ")),t.or.some(p=>S.techs[p])]]:[],...t.rq?[[rqT(t),t.ok(S)]]:[]];
  $("restree").innerHTML=`<div class="tree"><div class="tgrid" style="--cols:${W};height:${PH}px"><svg viewBox="0 0 100 ${PH}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${branches}${nodes}</div></div>
    <div class="tdet"><span class="ti2">${ic(t.ic,"l")}</span><div class="tdb"><b>${tx(t.name)}</b><small>${techSt(t)}${techCost(t)?` · ${tx("{n} RP",{n:techCost(t)})}`:""}</small><p>${tx(t.d,t.v)}</p><p class="foot">${tx("Opens: {gate}",{gate:tx(t.gate)})}</p>
      ${req.length&&st!=="learned"?`<div class="treq">${req.map(([n,ok])=>`<span class="${ok?"ok":"no"}">${ic(ok?"equip":"lock","xs")}${n}</span>`).join("")}</div>`:""}</div>
      ${st==="learned"?"":`<button class="btn ${can?"primary":""} sm" id="learn" ${can?"":`aria-disabled="true" data-tap ${tt(tx(t.name),...lack,...S.rp<techCost(t)&&!lack.length?[tx("Costs {cost} research points. You have {rp}.",{cost:techCost(t),rp:S.rp})]:[],...inBattle()?[tx("Finish the fight first.")]:[])}`}>${tx("Learn · {n}",{n:techCost(t)})}</button>`}</div>
    <p class="label">${ic("study","s")} ${tx("Study a material")}${helpBtn(tx("Study a material"),tx("Spend one essence of a family to learn about a reaction it takes part in: first the family, then its partner."),tx("A first study of each family also earns a research point."))}</p>
    <div class="chips sty">${(()=>{const fams=[...new Set(Object.keys(S.inv).filter(id=>isEss(id)&&avail(id)>0).map(essTrait))].sort();
      return fams.length?fams.map(f=>{const ok=canStudy(f)&&!inBattle(),stp=studyStep(f),n=studyPool(f).reduce((a,id)=>a+avail(id),0);
        return `<button class="chip sty1${ok?"":" off"}" style="color:${tColor(f)}" data-study="${f}" ${ok?"":'aria-disabled="true" data-tap'} aria-label="${esc(tx("Study {f}",{f:trn(f)}))}" ${tt(tx("Study {f}",{f:trn(f)}),ok?tx("Spend one to learn about its reactions.")+(stp?"":" "+tx("It has none left to find, but you may learn its nature once.")):inBattle()?tx("Finish the fight first."):tx("There is nothing more to learn from it."),tx("You hold {n}.",{n}))}>${famIc(TRAITS[f].f,"s")}${trn(f)}<b>${n}</b></button>`}).join(""):`<p class="foot">${tx("Deconstruct raw finds for essences to study.")}</p>`})()}</div>`;
}
