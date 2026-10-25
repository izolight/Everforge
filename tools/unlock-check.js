#!/usr/bin/env node
// Targeted check of the unlock framework (js/unlocks.js, the UNLOCKS table): a fresh save is minimal, each system opens once with its intro, intros queue one at a time,
// the Codex Guide lists them, genMap only places unlocked POI types, and an old save (v13 fixture) migrates fully unlocked with no intro waiting.
// Usage: node tools/unlock-check.js [--shots dir]   (screenshots at 390 and 360 wide: fresh first screens, a parry intro, a map intro, a locked teaser with its tip, the Guide)
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const URL="file://"+path.resolve(__dirname,"..","index.html"),FIX=path.join(__dirname,"fixtures");
const si=process.argv.indexOf("--shots"),SHOTS=si>0?process.argv[si+1]:null;
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error("FAIL: "+m)}else console.log("ok: "+m)};

async function open(browser,w,setup){
  const page=await browser.newPage({viewport:{width:w,height:844},reducedMotion:"reduce"}),errs=[];
  page.on("pageerror",e=>errs.push(e.message));page.on("console",m=>{if(m.type()==="error"&&!/fonts\.(googleapis|gstatic)|net::ERR/.test(m.text()))errs.push(m.text())});
  await page.goto(URL);if(setup){await page.evaluate(setup);await page.reload()}
  await page.waitForFunction(()=>typeof S==="object"&&S);page.errs=errs;return page;
}
const shot=async(page,w,name)=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`${name}-${w}.png`)})}};

async function flow(browser,w){
  const p=await open(browser,w);
  // spies: every unlock that really fires, and the sounds
  await p.evaluate(()=>{window.__u=[];window.__s=[];const u0=unlock,s0=sfx;window.unlock=(id,q)=>{const r=u0(id,q);if(r)__u.push(id);return r};window.sfx=(n,d)=>{__s.push(n);return s0(n,d)}});
  // --- a fresh save is minimal
  let r=await p.evaluate(()=>({unl:Object.keys(S.unl),pois:[...new Set(curMap().pois.map(q=>q.t))].sort().join(),emb:$("emb").hidden,intro:$("intro").hidden?"":$("intro").querySelector("b").textContent}));
  ok(r.unl.join()==="start","fresh: only the map intro is open ("+r.unl+")");
  ok(r.pois==="boss,camp,chest,fight","fresh map has only fights, chests, camp and boss ("+r.pois+")");
  ok(r.emb,"fresh: the ember counter is hidden");ok(r.intro==="Your first expedition","fresh: the first intro card shows");
  await shot(p,w,"1-fresh-battle");
  await p.evaluate(()=>go("forge"));r=await p.evaluate(()=>({sk:!!$("sklock").querySelector(".lockrow")&&$("skd").hidden,upg:$("upgp").hidden}));
  ok(r.sk,"forge: crafting skills is a teaser");ok(r.upg,"forge: upgrade grades is hidden");await shot(p,w,"2-fresh-forge");
  await p.evaluate(()=>go("gear"));r=await p.evaluate(()=>({inf:!!$("inflabel").querySelector(".lockrow"),btns:$("infbtns").hidden}));
  ok(r.inf&&r.btns,"gear: infusions is a teaser");await shot(p,w,"3-fresh-gear");
  await p.click("#inflabel .lockrow");r=await p.evaluate(()=>({tip:!$("tip").hidden,t:$("tip").textContent}));
  ok(r.tip&&/Defeat Gnarlhorn/.test(r.t),"the locked teaser's tip says how to unlock it ("+r.t+")");await shot(p,w,"4-teaser-tip");
  await p.evaluate(()=>go("codex"));r=await p.evaluate(()=>({st:$("stp").hidden,af:$("afp").hidden,gd:$("gdlist").querySelectorAll("details.gd").length}));
  ok(r.st&&r.af,"codex: stats and affixes are hidden");ok(r.gd===1,"codex: the Guide lists the one intro so far");
  // --- the first fight: Study and Parry are teasers, abilities are hidden, the parry intro comes when a special winds up
  await p.evaluate(()=>{go("battle");S.seen["i:start"]=true;startBattle("boar")});
  r=await p.evaluate(()=>({study:$("study").getAttribute("aria-disabled")==="true"&&!!$("study").querySelector("svg"),parry:$("parry").getAttribute("aria-disabled")==="true",ab:document.querySelectorAll(".acts [data-ability]").length,cards:document.querySelectorAll(".intro:not([hidden])").length}));
  ok(r.study&&r.parry,"battle: Study and Parry are locked teasers");ok(r.ab===0,"battle: no ability button yet, though the sword has one");ok(r.cards===0,"battle: no card before something is introduced");
  await p.evaluate(()=>{S.battle.hp=S.battle.max=999});
  for(let k=0;k<4&&!(await p.evaluate(()=>S.unl.parry));k++){await p.click("#guard");await p.evaluate(()=>{S.hp=pstats().maxHp})}
  r=await p.evaluate(()=>({parry:!!S.unl.parry,title:(document.querySelector("#arena .intro b")||{}).textContent,cards:document.querySelectorAll(".intro:not([hidden])").length,on:$("parry").getAttribute("aria-disabled")!=="true",log:S.battle.log.some(l=>/winding up/.test(l.t))}));
  ok(r.parry&&r.title==="It's winding up"&&r.on&&r.log,"the first telegraphed special opens Parry with its card and a log line");ok(r.cards===1,"exactly one card is on screen");
  await shot(p,w,"5-parry-intro");
  // the fight goes on with the card up (it never blocks input); win it
  await p.evaluate(()=>{S.battle.hp=1});await p.click("#atk");
  r=await p.evaluate(()=>({won:S.battle&&S.battle.over==="won",study:!!S.unl.study,roam:!!S.unl.roam,pend:pendingIntros().map(c=>c.id)}));
  ok(r.won&&r.study&&r.roam,"the first win opens Study and roaming enemies");ok(r.pend.join()==="parry,study","intros queue in the order the systems opened ("+r.pend+")");
  r=await p.evaluate(()=>({top:$("intro").hidden}));ok(r.top,"a battle intro waits out of the fight instead of showing on the map");
  // Got it on the parry card, the next card is Study (queued, not stacked)
  await p.evaluate(()=>{S.battle=null;render();startBattle("boar")});
  r=await p.evaluate(()=>[...document.querySelectorAll(".intro:not([hidden]) b")].map(b=>b.textContent));ok(r.join()==="It's winding up","one card at a time, the oldest first ("+r+")");
  await p.click("#introOk");r=await p.evaluate(()=>[...document.querySelectorAll(".intro:not([hidden]) b")].map(b=>b.textContent));
  ok(r.join()==="Study"&&await p.evaluate(()=>S.seen["i:parry"]),"Got it marks it read and the next one shows ("+r+")");
  await p.click("#introOk");ok(await p.evaluate(()=>document.querySelectorAll(".intro:not([hidden])").length===0&&pendingIntros().length===0),"all read: no card left");
  // --- abilities: need an equipped ability weapon and Smith Lv 2 or 3 wins; the button follows the intro
  await p.evaluate(()=>{S.battle=null;S.wins=2;render()});ok(!await p.evaluate(()=>S.unl.ability),"two wins and Lv 1: no abilities yet");
  await p.evaluate(()=>{S.wins=3;render();startBattle("boar")});
  r=await p.evaluate(()=>({unl:!!S.unl.ability,btn:document.querySelectorAll(".acts [data-ability]").length,title:(document.querySelector("#arena .intro b")||{}).textContent,text:(document.querySelector("#arena .intro")||{}).textContent}));
  ok(r.unl&&r.btn===0&&r.title==="Weapon abilities"&&/Flurry/.test(r.text),"3 wins with the sword equipped: abilities open, the button waits for the card");
  await p.click("#introOk");ok(await p.evaluate(()=>document.querySelectorAll(".acts [data-ability]").length===1),"after Got it the ability button shows");
  r=await p.evaluate(()=>{const c={};__u.forEach(id=>c[id]=(c[id]||0)+1);return{dups:Object.entries(c).filter(([,n])=>n>1).map(([k])=>k),u:__u,snd:__s.filter(x=>x==="unlock").length}});
  ok(!r.dups.length,"every unlock fired once ("+r.u+")");ok(r.snd>=3,"the unlock sound played ("+r.snd+")");
  // --- the map: POI types follow the unlocks; layout rules hold
  const g=await p.evaluate(()=>{
    const types=()=>{checkUnl(true);const m=genMap({heat:0,zone:"woods"});return{t:[...new Set(m.pois.map(q=>q.t))].sort().join(),m}};
    const reach=m=>{const d=bfs(m,m.start.x,m.start.y);return m.pois.every(q=>d[q.y*m.w+q.x]>=0)};
    const out={};S.battle=null;
    S.stats.exped=0;S.stats.deaths=0;S.unl={};checkUnl(true);out.e0=types().t;
    S.stats.exped=1;out.e1=types().t;S.stats.deaths=1;S.stats.exped=0;checkUnl(true);out.d1=S.unl.shrine?1:0; // a defeat counts like a boss kill
    S.stats.exped=1;S.stats.deaths=1;checkUnl(true);out.e2=types().t;
    S.xp=160;checkUnl(true);const x=types();out.lv3=x.t;out.reach=reach(x.m);
    out.nf=[...Array(30)].map(()=>genMap({heat:0,zone:"woods"}).pois.filter(q=>q.t==="fight").length).filter(n=>n<6||n>9).length; // fights stay 5-7 plus the gate guard (and a bit of a spread)
    const a=JSON.stringify(genMap({seed:77,zone:"pass",heat:2})),b=(S.unl={},JSON.stringify(genMap({seed:77,zone:"pass",heat:2})));out.det=a===b; // a seeded (daily) map ignores unlocks
    return out});
  ok(g.e0==="boss,camp,chest,fight","map 1: no shrine, peddler, mystery or elite ("+g.e0+")");
  ok(g.e1.includes("shrine")&&!/peddler|mystery|elite/.test(g.e1),"map 2: shrines, still no peddler or mystery ("+g.e1+")");
  ok(g.d1===1,"a defeat counts as a finished expedition");
  ok(/peddler/.test(g.e2)&&/mystery/.test(g.e2)&&/shrine/.test(g.e2),"map 3: peddler and mystery join ("+g.e2+")");
  ok(/elite/.test(g.lv3)&&g.reach,"elites at Smith Lv 3, and every POI is reachable");ok(g.nf===0,"fight counts stay in range");ok(g.det,"a seeded map is the same whatever you have unlocked");
  // the peddler: the card shows over the map (floating, so the map does not shift) and the counter appears
  await p.evaluate(()=>{S.battle=null;S.stats.exped=2;S.unl.peddler&&0;S.stats.deaths=0;checkUnl(true);S.maps.woods=newMap("woods");go("battle")});
  r=await p.evaluate(()=>({t:(document.querySelector("#intro b")||{}).textContent,emb:!$("emb").hidden,fl:$("intro").classList.contains("fl")}));
  ok(r.emb,"peddler unlocked: the ember counter shows");
  await p.evaluate(()=>{["shrine","mystery","elite","infuse","skills","upgrade","heat","daily","bounty","afx"].forEach(k=>S.seen["i:"+k]=true);render()});
  r=await p.evaluate(()=>({t:(document.querySelector("#intro b")||{}).textContent,fl:$("intro").classList.contains("fl")}));
  ok(r.t==="Peddlers and embers"&&r.fl,"the peddler intro floats over the map ("+r.t+")");await shot(p,w,"6-map-intro");
  // --- Guide
  await p.evaluate(()=>go("codex"));r=await p.evaluate(()=>({n:$("gdlist").querySelectorAll("details.gd").length,want:UNLOCKS.filter(u=>u.i&&S.unl[u.id]).length,lock:$("gdlist").querySelectorAll(".lockrow").length}));
  ok(r.n===r.want&&r.n>=5,"the Guide lists every unlocked intro ("+r.n+") and the locked ones as teasers ("+r.lock+")");
  await p.click("#gdlist details.gd:nth-child(2) summary");await shot(p,w,"7-guide");
  ok(!p.errs.length,"no page errors ("+p.errs.join("; ")+")");
  await p.close();
}

async function veteran(browser){
  const {key,save}=JSON.parse(fs.readFileSync(path.join(FIX,"save-v13.json"),"utf8"));
  const p=await open(browser,390,new Function(`localStorage.clear();localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(save)})`));
  const r=await p.evaluate(()=>({v:S.v,missing:UNLOCKS.filter(u=>!S.unl[u.id]).map(u=>u.id),pend:pendingIntros().length,card:!$("intro").hidden,emb:!$("emb").hidden,ab:S.seen["a:blade"]}));
  ok(r.v===14&&!r.missing.length,"v13 fixture migrates to v14 with everything unlocked ("+r.missing+")");ok(!r.pend&&!r.card,"... and no intro waiting");ok(r.emb,"... embers visible");
  // a partial player: a v13 save with 2 wins keeps what it used and still gets the rest gradually
  const q=await p.evaluate(()=>{const s=JSON.parse(JSON.stringify(S));s.v=13;delete s.unl;s.wins=2;s.journal=[];s.stats.forged=0;s.stats.exped=0;s.stats.deaths=0;s.stats.bosses=0;s.daily=null;s.heat={};s.kills={};s.stats={...s.stats,dailies:0,elites:0,abil:0,studied:1,spent:0,refined:0};s.afx={};s.embers=0;s.infuse={};s.infCredit=0;s.maps={};s.xp=10;s.skills={};s.quest=2;
    const t=migrate(s);return{unl:Object.keys(t.unl),seen:Object.keys(t.seen).filter(k=>k[1]===":")}});
  ok(q.unl.includes("study")&&q.unl.includes("roam")&&!q.unl.includes("peddler")&&!q.unl.includes("daily")&&!q.unl.includes("skills"),"a 2-win save keeps Study and roaming but not the late systems ("+q.unl+")");
  await p.close();
}

(async()=>{
  const browser=await chromium.launch();
  for(const w of SHOTS?[390,360]:[390])await flow(browser,w);
  await veteran(browser);await browser.close();
  console.log(fails?`UNLOCK CHECK FAILED (${fails})`:"UNLOCK CHECK OK");process.exit(fails?1:0);
})();
