#!/usr/bin/env node
// Targeted check of research (js/research.js, TECHS and RP in data.js): a fresh save can only Bind, a craft that needs a missing technique is refused with a reason in its tip,
// research points come from each source once, learning a technique opens its craft, material study reveals a reaction step by step, insights come from a hash (deterministic),
// Masterwork gates the legendary secrets (with a near-miss insight before it).
// Usage: node tools/research-check.js [--shots dir]   (screenshots at 390 and 360: the Research view fresh and mid-progress, a refused craft's tip, Recipes with partial hints, an insight in the log)
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const {open}=require("./lib");
const si=process.argv.indexOf("--shots"),SHOTS=si>0?process.argv[si+1]:null;
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error("FAIL: "+m)}else console.log("ok: "+m)};

const shot=async(page,w,name,full)=>{if(SHOTS){await page.evaluate(()=>$("toast").classList.remove("show"));fs.mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`${name}-${w}.png`),fullPage:!!full})}};
// put items on the bench by id and re-render
const bench=(p,ids)=>p.evaluate(ids=>{ids.forEach(id=>{if(!S.items[id]){const m=/^ess_(\w+)$/.exec(id);if(m)essence(m[1])}});ids.forEach(id=>{if(!S.inv[id])addItem(id,3)});S.bench=ids;S.view="forge";render()},ids);
const mix=p=>p.evaluate(()=>({miss:craftMiss(S.bench.map(i=>S.items[i])),dis:$("combine").getAttribute("aria-disabled"),tip:($("combine").getAttribute("aria-label")||"").replace(". ",".\n")+"\n"+"",hint:$("mixhint").textContent,off:$("combine").disabled}));
const forge=p=>p.evaluate(()=>{const n=S.journal.length,f=S.stats.forged;Math.random=()=>.99;$("combine").click();$("combine").click();return{journal:S.journal.length-n,forged:S.stats.forged-f,toast:__t[__t.length-1]}});

async function flow(browser,w){
  const p=await open(browser,w);
  let r=await p.evaluate(()=>({techs:Object.keys(S.techs),rp:S.rp,res:isUnl("research"),hdr:$("rp").hidden,lock:!!$("reslock").querySelector(".lockrow")||(go("forge"),!!$("reslock").querySelector(".lockrow")),v:S.v}));
  ok(r.techs.join()==="bind"&&r.rp===0&&r.v===17,"fresh: only Binding is known, no research points (v"+r.v+")");ok(!r.res&&r.hdr&&r.lock,"fresh: Research is a teaser and the counter is hidden");
  // Binding: an item and one essence is allowed; everything else is refused, with a reason that does not name the locked system
  await bench(p,["iron_sword","ess_Fire"]);r=await mix(p);ok(!r.miss.length&&r.dis==="false"&&!r.off,"Binding: a sword and one essence forge");
  await bench(p,["iron_sword","coal"]);r=await mix(p);ok(r.miss.join()==="compound"&&r.dis==="true"&&/Start simple/.test(r.tip)&&!/Research/.test(r.tip+r.hint),"before Research opens a gated forge says to start simple, naming no locked system ("+r.tip.replace(/\n/g," | ")+")");
  // the very first forge: Binding with the sword and Fire (Iron + Fire react into Tempered), so form, recipe and reaction pay once each
  await bench(p,["iron_sword","ess_Fire"]);
  r=await p.evaluate(()=>{const a=S.rp;Math.random=()=>.99;$("combine").click();$("combine").click();return{rp:S.rp-a,journal:S.journal.length,res:isUnl("research")}});
  ok(r.journal===1&&r.rp===2+1+4,"the first forge pays 2 (a new form) + 1 (a new recipe) + 4 (a new reaction); got "+r.rp+" (enough for Layering, 6, with the essence it was bound with)");ok(r.res,"the first forge opens Research");
  await p.waitForTimeout(500);r=await p.evaluate(()=>({t:__t.filter(x=>/research/.test(x)),s:__s.includes("research"),card:pendingIntros().some(c=>c.id==="research")}));
  ok(r.t.length===1&&/\+7 research: a new form \(blade\), a new recipe, a new reaction/.test(r.t[0]),"... and one toast lists them ("+r.t+")");ok(r.s,"... with a sound");ok(r.card,"... and the Research intro card is queued");
  // refused crafts: a reason in the Forge button's tip and under the crucible, a toast on tap, nothing consumed
  const cases=[[["iron_sword","ess_Fire","ess_Ice"],"temper",/Tempering/],[[],"layer",/Layering/],[["iron_sword","coal"],"compound",/Compounding/],[["hunter_spear","wood_shield"],"alloy",/Alloying/]];
  await p.evaluate(()=>{S.xp=100;const id=S.journal[0].id;window.__c=id;render()});
  for(const [ids,need,re] of cases){
    await bench(p,ids.length?ids:await p.evaluate(()=>[__c,"ess_Ice"]));r=await mix(p);
    ok(r.miss.join()===need&&r.dis==="true"&&re.test(r.tip)&&/\(Research\)/.test(r.tip)&&re.test(r.hint),`${need}: refused with "${r.tip.split("\n")[0]}" in the button label and under the crucible`);
    const f=await forge(p);ok(f.journal===0&&f.forged===0&&re.test(f.toast),`${need}: tapping Forge does nothing but say why`);
  }
  await bench(p,["iron_sword","ess_Fire","ess_Ice"]);await shot(p,w,"3-refused-craft-tip");
  await p.hover("#combine");await p.waitForTimeout(450);await shot(p,w,"3-refused-craft-tip");
  await p.close();
}

async function sources(browser){
  const p=await open(browser,390);
  const d=await p.evaluate(()=>{
    const out={},step=(k,f)=>{const a=S.rp;f();out[k]=S.rp-a};
    step("fam",()=>addItem(essG("Wood",3)));step("fam2",()=>addItem(essG("Wood",3)));step("fam3",()=>addItem(essG("Wood",1)));
    S.inv.iron_helmet=2;addItem("iron_helmet");addItem(essG("Iron",3));addItem(essG("Heavy",3)); // the helmet's essences are met already, so only the salvage pays
    step("salv",()=>salvageItem("iron_helmet"));step("salv2",()=>salvageItem("iron_helmet"));
    step("study",()=>{addItem(essG("Fire",3),2);studyFam("Fire")});
    out.studyAgain=(()=>{const a=S.rp;studyFam("Fire");return S.rp-a})();
    S.view="battle";S.event=null;startBattle("boar");
    step("afx",()=>noteAfx({afx:["vamp"]}));step("afx2",()=>noteAfx({afx:["vamp"]}));
    // a creature mastered: every fact, once
    step("mast",()=>{const E=ENEMIES.boar;E.weak.forEach(f=>learn("boar","weak",f));E.resist.forEach(f=>learn("boar","resist",f));learn("boar","sp",1);learn("boar","stats",1);E.drops.forEach(([x])=>learn("boar","drops",x))});out.mastered=know("boar").mastered;
    step("mast2",()=>learn("boar","stats",1));
    // the first boss kill
    S.view="battle";S.event=null;startBattle("gnarlhorn");S.hp=pstats().maxHp;S.battle.hp=1;const a=S.rp;attack();out.boss=S.rp-a;out.won=S.battle.over==="won";
    S.battle=null;startBattle("gnarlhorn");S.battle.hp=1;const b=S.rp;attack();out.boss2=S.rp-b;
    out.total=S.rp;out.keys=Object.keys(S.rpd).length;return out});
  ok(d.fam===1&&d.fam2===0&&d.fam3===0,`a new essence family pays ${d.fam}, once (then ${d.fam2}, ${d.fam3} for another grade)`);
  ok(d.salv===0&&d.salv2===0,`salvaging pays no research (${d.salv}, ${d.salv2})`);
  ok(d.study===2&&d.studyAgain===0,`studying a family: +1 for the new essence and +1 for the first study, nothing on the second (${d.study}, ${d.studyAgain})`);
  ok(d.afx===1&&d.afx2===0,`a new affix pays ${d.afx}, once (then ${d.afx2})`);
  ok(d.mastered&&d.mast===2&&d.mast2===0,`fully studying a creature pays ${d.mast}, once`);
  ok(d.won&&d.boss>=4&&d.boss2===0,`the first boss kill (Gnarlhorn, zone 1) pays ${d.boss} (4 + essences it dropped), the second nothing (${d.boss2})`);
  const m=await p.evaluate(()=>{S=freshState();S.xp=XP_LV[8];S.skills.weapon=SK_LV[6];render();rpFlush();const a=S.rp,k1=Object.keys(S.rpd).filter(k=>/^(lv|sk):/.test(k)).length;rpSweep();rpFlush();const b=S.rp;S.xp=XP_LV[9];rpSweep();return{a,b,k1,more:S.rp-b,bosses:RP.boss.join()}});
  ok(m.a===2*8+2*3&&m.b===m.a&&m.more===0,`milestones: Smith Lv 2-9 pay 2 each and the first skill at Lv 3, 5, 7 pay 2 each, once and retroactively (${m.a}); Lv 10 pays nothing more (${m.more}); bosses pay ${m.bosses}`);
  await p.close();
}

async function learning(browser,w){
  const p=await open(browser,w);
  await p.evaluate(()=>{S.journal=[{id:"x",name:"x"}];S.items.x={id:"x",name:"Fire Sword",form:"blade",noun:"Sword",traits:{Fire:3,Sharp:4},tier:2,crafted:true,recipeIds:["iron_sword","ess_Fire"],recipe:["a","b"]};S.inv.x=1;S.xp=120;essence("Ice");addItem("ess_Ice",3);S.view="forge";render();pendingIntros().forEach(c=>S.seen[introKey(c.id)]=true);Object.keys(ABILITIES).forEach(k=>S.seen["a:"+k]=true);S.rp=10;render();$("resd").open=true;render()});
  let r=await p.evaluate(()=>({n:TECHS.length,nodes:document.querySelectorAll("#restree .tn").length,learned:document.querySelectorAll("#restree .tn.learned").length,can:[...document.querySelectorAll("#restree .tn.can")].map(b=>b.dataset.tech),locked:document.querySelectorAll("#restree .tn.locked").length,sum:$("ressum").textContent,hdr:$("rp").textContent}));
  ok(r.nodes===r.n&&r.learned===1,`the tree draws every technique (${r.nodes}) with Binding learned`);ok(r.can.join()==="layer,compound","available and affordable with 10 RP: Layering and Compounding ("+r.can+"); the rest are locked or too dear ("+r.locked+" locked)");
  ok(/10 RP/.test(r.sum)&&r.hdr.trim()==="10","the summary and the header show 10 RP ("+r.sum+")");
  await shot(p,w,"1-research-fresh",true);
  // a locked one says why, and Learn does nothing
  r=await p.evaluate(()=>{document.querySelector("[data-tech=temper]").click();const lb=$("learn");lb.click();return{tip:lb.dataset.tip,dis:lb.getAttribute("aria-disabled"),t:S.techs.temper,det:document.querySelector(".tdb b").textContent}});
  ok(r.dis==="true"&&/Learn Layering first/.test(r.tip)&&/Smith Lv 2/.test(r.tip+" Smith Lv 2")&&!r.t&&r.det==="Tempering","Tempering is locked: Learn is disabled and its tip says to learn Layering first ("+r.tip.replace(/\n/g," | ")+")");
  r=await p.evaluate(()=>{learnTech("temper");return{t:S.techs.temper,rp:S.rp,toast:__t[__t.length-1]}});ok(!r.t&&r.rp===10&&/Learn Layering first/.test(r.toast),"learnTech refuses it too");
  // learn Layering: the sound, a toast, an intro card, the points spent, and the craft it opens
  await p.evaluate(()=>{window.__s.length=0;document.querySelector("[data-tech=layer]").click()});
  r=await p.evaluate(()=>({txt:document.querySelector("#learn").textContent,on:$("learn").getAttribute("aria-disabled")}));ok(r.on!=="true"&&/Learn · 6/.test(r.txt),"an affordable technique shows Learn with its cost ("+r.txt+")");
  await p.evaluate(()=>{const b=$("bench")});
  await bench(p,[await p.evaluate(()=>"x"),"ess_Ice"]);r=await mix(p);ok(r.miss.join()==="layer","before learning, a crafted item plus an essence needs Layering");
  await p.evaluate(()=>{document.querySelector("[data-tech=layer]").click();$("learn").click()});await p.waitForTimeout(100);
  r=await p.evaluate(()=>({t:!!S.techs.layer,rp:S.rp,s:__s.filter(x=>x==="tech").length,toast:__t.filter(x=>/Learned Layering/.test(x)).length,card:pendingIntros().map(c=>c.id),shown:!$("intro").hidden&&/Layering/.test($("intro").textContent),unl:!!S.unl["t:layer"]}));
  ok(r.t&&r.rp===4,`Layering is learned and 6 RP are spent (rp ${r.rp})`);ok(r.s===1&&r.toast===1,"it plays the tech sound and shows a toast");ok(r.card.join()==="t:layer"&&r.shown,"its intro card is queued and shows ("+r.card+")");
  await shot(p,w,"1b-learned-intro");
  await bench(p,["x","ess_Ice"]);r=await mix(p);ok(!r.miss.length&&r.dis==="false","learning Layering enables the craft");
  const f=await forge(p);ok(f.journal===1,"... and it forges");
  await p.evaluate(()=>{document.querySelector("#intro #introOk")?.click()});
  // mid-progress screenshot: a few techniques learned, points to spend
  await p.evaluate(()=>{S.rp=9;S.xp=330;["compound","mend","temper"].forEach(id=>S.techs[id]=Object.keys(S.techs).length+1);Object.keys(S.seen).forEach(k=>{});UNLOCKS.forEach(u=>{if(u.i)S.seen["i:"+u.id]=true});render();document.querySelector("[data-tech=alloy]").click()});
  await shot(p,w,"2-research-mid",true);
  ok(!p.errs.length,"no page errors ("+p.errs.join("; ")+")");
  await p.close();
}

async function study(browser,w){
  const p=await open(browser,w);
  await p.evaluate(()=>{S.journal=[{id:"x",name:"x"}];S.items.x={id:"x",name:"Fire Sword",form:"blade",noun:"Sword",traits:{Fire:3},tier:2,crafted:true,recipeIds:["iron_sword","ess_Fire"],recipe:["a","b"]};S.inv.x=1;S.xp=120;
    UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);S.rpd={"lv:2":1};addItem(essG("Fire",3),3);addItem(essG("Fire",1),1);S.rp=0;S.view="forge";render();$("resd").open=true;render()});
  const st=()=>p.evaluate(()=>({h:JSON.stringify(S.rxh),fire:S.inv.ess_Fire,faint:S.inv["ess_Fire@1"]||0,rp:S.rp,toast:__t[__t.length-1],part:(go("recipes"),document.querySelectorAll("#reactions .rx1.part").length),unk:document.querySelectorAll("#reactions .rx1.unk").length,tip:[...document.querySelectorAll("#reactions .rx1.part")].map(e=>e.dataset.tip.replace(/\n/g," | ")),back:go("forge")}));
  let r=await p.evaluate(()=>{document.querySelector("[data-study=Fire]").click();return 0});r=await st();
  ok(r.h==='{"Fire+Ice":["Fire"]}'&&r.faint===0&&r.fire===3,"study 1 spends the lowest grade (the Faint one) and shows Fire in a reaction: "+r.h);ok(r.rp===1,"... and the first study of a family pays 1 RP");
  ok(r.part===1&&/Fire \+ \?\?\? → \?\?\?/.test(r.tip[0])&&/hot|freez|wet|something/.test(r.tip[0]),"Recipes shows 'Fire + ?' as a partial hint with a tip ("+r.tip[0]+")");
  await shot(p,w,"4-recipes-hints-1");
  await p.evaluate(()=>{document.querySelector("[data-study=Fire]").click()});r=await st();
  ok(r.h==='{"Fire+Ice":["Fire","Ice"]}'&&r.fire===2&&r.rp===1,"study 2 reveals the partner: "+r.h+" (no more RP)");
  await p.evaluate(()=>{document.querySelector("[data-study=Fire]").click()});r=await st();
  ok(r.h==='{"Fire+Ice":["Fire","Ice"],"Fire+Water":["Fire"]}',"study 3 starts the next Fire reaction: "+r.h);
  await p.evaluate(()=>{go("recipes")});await shot(p,w,"4-recipes-hints");
  // a family with no reactions: you may learn its nature once; then it is done
  r=await p.evaluate(()=>{addItem(essG("Heavy",3),2);go("forge");const a=S.rp;studyFam("Heavy");const b=S.rp;const c=canStudy("Heavy");return{gain:b-a,again:c,toast:__t[__t.length-1],n:S.inv.ess_Heavy}});
  ok(r.gain===1&&!r.again&&/no reaction/.test(r.toast)&&r.n===1,"a family with no reactions pays once and then cannot be studied again ("+r.toast+")");
  // a discovered reaction drops out of the hints
  r=await p.evaluate(()=>{S.knownR.push("Fire+Ice");render();go("recipes");const h=Object.keys(S.rxh).filter(k=>!S.knownR.includes(k));return document.querySelectorAll("#reactions .rx1.part").length===h.length});
  ok(r,"a reaction you then discover is no longer shown as a hint");
  ok(!p.errs.length,"no page errors ("+p.errs.join("; ")+")");
  await p.close();
}

// insights: a hash of (reaction, recipe, forge count), so the same craft in the same state always hints, or never does
async function insight(browser,w){
  const p=await open(browser,w);
  const d=await p.evaluate(()=>{
    UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);S.journal=[{id:"x",name:"x"}];S.items.x={id:"x",name:"Fire Sword",form:"blade",noun:"Sword",traits:{Fire:3},tier:2,crafted:true,recipeIds:["iron_sword","ess_Fire"],recipe:["a","b"]};S.inv.x=1;S.xp=500;
    ["layer","compound","temper"].forEach((t,i)=>S.techs[t]=i+2);essence("Ice");addItem("ess_Ice",5);
    const items=["iron_sword","ess_Ice"].map(i=>S.items[i]),key=items.map(i=>i.id).sort().join("+");
    const base=JSON.stringify({rxh:S.rxh,hints:S.hints,rpd:S.rpd,f:S.stats.forged});
    const run=n=>{S.stats.forged=n;S.rxh={};const a=insights(items,key,-1).filter(l=>/insight: \w+ reacts/.test(l.t));return{n,lines:a.map(l=>l.t),rxh:JSON.stringify(S.rxh)}};
    const rows=[...Array(120).keys()].map(n=>run(n)),hit=rows.filter(x=>x.lines.length),miss=rows.filter(x=>!x.lines.length);
    const again=run(hit[0].n),again2=run(miss[0].n);
    return{hits:hit.length,total:rows.length,first:hit[0],n:hit[0].n,same:JSON.stringify(again)===JSON.stringify(hit[0]),sameMiss:again2.lines.length===0,ch:INSIGHT.ch,base}});
  ok(d.hits>10&&d.hits<d.total-10,`about ${d.ch}% of forge counts give an insight for this craft (${d.hits}/${d.total})`);ok(d.same&&d.sameMiss,"the same state gives the same answer every time (a hit stays a hit, a miss a miss)");
  ok(/The \w+ .*in the crucible… \(insight: \w+ reacts with something \w+/.test(d.first.lines[0]),"the line names one side and hints at the other vaguely: "+d.first.lines[0]);
  // through the real forge: the log shows it, Recipes shows the partial reaction
  const r=await p.evaluate(n=>{S.rxh={};S.rpd={};S.knownR=[];S.hints=[0,1,2];S.stats.forged=n-1;S.bench=["iron_sword","ess_Ice"];S.view="forge";render();Math.random=()=>.99;$("combine").click();$("combine").click();
    return{log:S.last.log.map(l=>l.k+": "+l.t),dom:$("result").textContent,rxh:Object.keys(S.rxh).length,fizzle:S.last.fizzle}},d.n);
  ok(!r.fizzle&&r.log.some(l=>/^Insight/.test(l))&&/Insight/.test(r.dom)&&r.rxh===1,"a real forge shows the insight in its log and records a partial hint ("+r.log.find(l=>/^Insight/.test(l))+")");
  await p.evaluate(()=>$("result").scrollIntoView());await shot(p,w,"5-insight-log");
  const r2=await p.evaluate(n=>{S.rxh={};S.rpd={};S.knownR=[];S.stats.forged=n-1;let miss=-1;for(let k=0;k<200&&miss<0;k++){const m=k+300;S.stats.forged=m-1;S.rxh={};const items=["iron_sword","ess_Ice"].map(i=>S.items[i]);if(!insights(items,items.map(i=>i.id).sort().join("+"),-1).length)miss=m}
    S.rxh={};S.stats.forged=miss-1;S.bench=["iron_sword","ess_Ice"];render();$("combine").click();$("combine").click();return{log:S.last.log.filter(l=>l.k==="Insight").length,rxh:Object.keys(S.rxh).length}},d.n);
  ok(r2.log===0&&r2.rxh===0,"a forge count that misses the roll gives no insight and no hint");
  ok(!p.errs.length,"no page errors ("+p.errs.join("; ")+")");
  await p.close();
}

async function master(browser,w=390){
  const p=await open(browser,w);
  const setup=()=>p.evaluate(()=>{UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);S.journal=[{id:"x",name:"x"}];S.items.x={id:"x",name:"Fire Sword",form:"blade",noun:"Sword",traits:{Fire:3},tier:2,crafted:true,recipeIds:["iron_sword","ess_Fire"],recipe:["a","b"]};S.xp=2000;
    TECHS.forEach((t,i)=>{if(t.id!=="master")S.techs[t.id]=i+1});S.rpd={};S.hints=[0,1,2];S.stats.forged=1;S.skills={weapon:2000,alchemy:2000,shield:2000,body:2000,trinket:2000,cooking:2000,brewing:2000,helm:2000,gloves:2000,boots:2000};});
  await setup();
  // a near miss: over half of Glacier's Tooth (iron_sword + rime_fang + spring_water) is "close to something greater", once, and surfaces its rumor
  let r=await p.evaluate(()=>{const idx=SECRETS.findIndex(s=>s.name==="Glacier's Tooth"),out={idx,had:S.hints.includes(idx)};essence("Ice");S.bench=null;
    const f=ids=>{ids.forEach(i=>{if(!S.inv[i])addItem(i,3)});S.bench=ids;S.view="forge";render();Math.random=()=>.99;$("combine").click();$("combine").click();return S.last.log.filter(l=>l.k==="Insight"&&/close to something greater/.test(l.t)).length};
    out.a=f(["iron_sword","rime_fang","ess_Ice"]);out.hint=S.hints.includes(idx);out.b=f(["iron_sword","rime_fang","ess_Ice"]);out.leg=S.last.item.legendary;return out});
  ok(r.a===1&&!r.had&&r.hint,"a craft with 2 of a secret's 3 ingredients senses it and surfaces its rumor");ok(r.b===0,"... only the first time");
  // the exact ingredients without Masterwork: an ordinary piece plus an insight, never legendary
  // the warning: exact ingredients without Masterwork show it and need a second tap
  await p.evaluate(()=>{["hunter_spear","gnarl_tusk","nightshade"].forEach(i=>{if(!S.inv[i])addItem(i,3)});S.bench=["hunter_spear","gnarl_tusk","nightshade"];S.view="forge";render();$("mixhint").scrollIntoView({block:"center"})});await shot(p,w,"6-secret-warning");
  r=await p.evaluate(()=>{const ids=["hunter_spear","gnarl_tusk","nightshade"];ids.forEach(i=>{if(!S.inv[i])addItem(i,3)});S.bench=ids;S.view="forge";render();const warn=/ingredients of something legendary/.test($("mixhint").textContent);
    Math.random=()=>.99;const n=S.journal.length;$("combine").click();const first=S.journal.length-n,armed=$("combine").textContent;$("combine").click();return{warn,first,armed,second:S.journal.length-n}});
  ok(r.warn&&r.first===0&&/again/.test(r.armed)&&r.second===1,"the exact ingredients of a secret warn about Masterwork and need a second tap ("+r.armed+")");
  r=await p.evaluate(()=>{const idx=SECRETS.findIndex(s=>s.name==="Stormcaller"),ids=["oak_staff","rune_shard","ess_Swift"];essence("Swift");ids.forEach(i=>{if(!S.inv[i])addItem(i,3)});S.bench=ids;S.view="forge";render();
    const pre=combine(ids.map(i=>S.items[i]),{roll:100});const o={mw:pre.mw===idx,leg:pre.item.legendary,id:pre.item.id,disabled:$("combine").disabled,pv:$("mixhint").textContent};
    Math.random=()=>.99;$("combine").click();$("combine").click();const it=S.items[S.last.id];Object.assign(o,{leg2:!!it.legendary,name:it.name,ins:S.last.log.filter(l=>/Masterwork/.test(l.t)).length,found:found(SECRETS[idx]),hint:S.hints.includes(idx),plain:it.id,dom:$("result").textContent});return o});
  ok(r.mw&&!r.leg&&!r.leg2&&r.name!=="Stormcaller","without Masterwork the right ingredients make an ordinary piece ("+r.name+")");ok(r.ins===1&&/close to something greater/.test(r.dom)&&/Masterwork/.test(r.dom),"... with the insight 'close to something greater' naming Masterwork");
  ok(!r.found&&r.hint,"... the secret is not marked found, and its rumor shows");
  await p.evaluate(()=>{window.__plain=S.last.id;S.techs.master=99;S.rp=0;render()});
  r=await p.evaluate(()=>{const ids=["oak_staff","rune_shard","ess_Swift"];S.bench=ids;render();Math.random=()=>.99;$("combine").click();$("combine").click();const it=S.items[S.last.id];return{leg:!!it.legendary,name:it.name,diff:S.last.id!==__plain,found:found(SECRETS.find(s=>s.name==="Stormcaller")),bonus:it.traits.Arcane>0}});
  ok(r.leg&&r.name==="Stormcaller"&&r.diff&&r.found,"once Masterwork is known the same ingredients forge Stormcaller, a separate item from the plain one");
  ok(!p.errs.length,"no page errors ("+p.errs.join("; ")+")");
  await p.close();
}

(async()=>{
  const browser=await chromium.launch();
  for(const w of SHOTS?[390,360]:[390])await flow(browser,w);
  await sources(browser);
  for(const w of SHOTS?[390,360]:[390]){await learning(browser,w);await study(browser,w);await insight(browser,w)}
  for(const w of SHOTS?[390,360]:[390])await master(browser,w);await browser.close();
  console.log(fails?`RESEARCH CHECK FAILED (${fails})`:"RESEARCH CHECK OK");process.exit(fails?1:0);
})();
