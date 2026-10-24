#!/usr/bin/env node
// Headless smoke test: plays the game through the real UI and fails on any page error.
// Usage: node tools/smoke.js [steps]   (needs Playwright; Chromium is preinstalled in cloud sessions)
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const STEPS=+process.argv[2]||400,URL="file://"+path.resolve(__dirname,"..","index.html");
const FIX=path.join(__dirname,"fixtures");

async function run(label,setup){
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const errors=[];
  page.on("pageerror",e=>errors.push(`pageerror: ${e.message}`));
  page.on("console",m=>{if(m.type()==="error"&&!/fonts\.(googleapis|gstatic)|net::ERR/.test(m.text()))errors.push(`console: ${m.text()}`)});
  await page.goto(URL);
  if(setup){await page.evaluate(setup);await page.reload()}
  await page.waitForFunction(()=>typeof S==="object"&&S);
  const stats=await page.evaluate(async steps=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out={steps:0,battles:0,won:0,lost:0,forged:0,zones:new Set(),views:0,wields:0,abil:0,heat:0,daily:0,aband:0,bad:[]};
    const click=el=>{el.click();return true};let wantZone=null,doChores=false,wantWield=false,wantHeat=false,wantDaily=false,wantAband=false;
    const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
    for(let i=0;i<steps;i++){out.steps++;
      // Every so often, unlock everything and top up HP so later content gets exercised too.
      if(i%60===59)wantZone=ZONES[(i/60|0)%ZONES.length][0];
      if(wantZone&&!busy()&&S.run!=="daily"){S.unlocked=[...new Set([...S.unlocked,...ZONES.map(z=>z[0])])];S.zone=wantZone;S.battle=null;S.event=null;wantZone=null;save();render()}
      if(i%25===24&&!busy())doChores=true;
      if(i%10===9)wantWield=true;
      if(wantWield&&!busy()){wantWield=false;wield()}
      if(i%37===5)wantHeat=true;
      if(i%53===17)wantDaily=true;
      if(i%29===3)wantAband=true;
      // the daily run and the normal zone must never mix
      if(S.run==="daily"?!(S.daily&&S.daily.state==="run"&&S.zone===S.daily.zone&&curMap()===S.daily.map):(S.daily&&S.daily.state==="run"))out.bad.push(`daily state broken at step ${i}`);
      if(S.run==="daily"&&i%41===0){const s2=migrate(JSON.parse(JSON.stringify(S)));if(s2&&s2.run==="daily")S=s2;else out.bad.push("daily did not survive a save round trip")}
      if(S.view!=="battle")go("battle");
      out.zones.add(S.zone);
      if(S.battle&&!S.battle.over){
        if(S.hp<pstats().maxHp*.35&&i%3)S.hp=pstats().maxHp;
        if(S.battle.turn>40)S.battle.hp=1; // don't let a stalemate eat the whole run
        const btns=qa("#arena button:not([disabled])").filter(b=>b.id&&!["flee","rest"].includes(b.id)||b.dataset.ability);
        const b=btns.length?btns[Math.floor(Math.random()*btns.length)]:q("#atk");
        if(Math.random()<.75&&q("#atk"))click(q("#atk"));else if(b){if(b.dataset.ability)out.abil++;click(b)}
        if(S.battle&&S.battle.over){out.battles++;out[S.battle.over==="won"?"won":"lost"]++}
        continue}
      if(doChores){doChores=false;await chores();continue}
      if(wantHeat&&S.run!=="daily"){wantHeat=false;S.heat[S.zone]={max:1+Math.floor(Math.random()*HEAT_MAX),sel:0};render();
        const hb=qa("#arena [data-heat]");if(hb.length){click(hb[Math.floor(Math.random()*hb.length)]);out.heat++;continue}}
      if(wantDaily&&S.run!=="daily"){wantDaily=false;S.kills[ZONES[0][2]]=S.kills[ZONES[0][2]]||1;if(Math.random()<.6)S.daily=null;render();const db=q("#dailyStart");if(db){click(db);out.daily++;continue}}
      if(S.run==="daily"&&wantAband&&q("#dailyAbandon")&&Math.random()<.5){wantAband=false;click(q("#dailyAbandon"));click(q("#dailyAbandon"));if(S.run!=="daily")out.aband++;continue}
      const choice=qa("#arena [data-choice]").find(b=>b.dataset.choice!=="inspect"&&b.dataset.choice!=="leave")||q("#arena [data-choice]");
      if(choice){click(choice);continue}
      const nodes=qa("#arena [data-node]:not([disabled])");
      if(nodes.length){click(nodes[Math.floor(Math.random()*nodes.length)]);continue}
      const cont=q("#cont")||q("#again");
      if(cont){click(cont);continue}
      const claim=q("#claim");if(claim){click(claim);continue}
      await chores();
    }
    function wield(){ // each weapon form in turn (and sometimes a shield) so every signature ability gets exercised
      const wf=Object.keys(FORMS).filter(k=>FORMS[k].g==="weapon"),f=wf[out.wields++%wf.length],id="t_"+f,tr=pick([{Fire:2,Sharp:2},{Ice:3,Arcane:1},{Poison:2,Heavy:1},{Holy:2,Tempered:2},{Shadow:2}]);
      S.items[id]={id,name:"Test "+FORMS[f].label,form:f,noun:FORMS[f].label,traits:tr,tier:1,crafted:true};addItem(id);equip(id,"main");
      if(Math.random()<.6){addItem("wood_shield");equip("wood_shield","off")}}
    // Visit the other views, forge something, salvage, infuse.
    async function chores(){
      for(const v of VIEWS){go(v);out.views++}
      go("forge");S.bench=[];
      const can=qa("#finv [data-can='1']");
      for(const c of can.slice(0,1+Math.floor(Math.random()*2)))click(c);
      const can2=qa("#finv [data-can='1']");if(can2.length)click(can2[Math.floor(Math.random()*can2.length)]);
      if(S.bench.length>=2){const before=S.journal.length;q("#combine").click();await sleep(30);out.forged++;}
      S.bench=[];save();
      go("gear");const it=qa("#ginv [data-id]").find(b=>!eqCount(b.dataset.id));if(it){it.click();const sv=q("#sheet [data-act='salvage']");if(sv&&Math.random()<.5){sv.click();q("#sheet [data-act='salvage']")?.click()}closeSheet()}
      const inf=q("#infbtns [data-infuse]");if(inf)inf.click();
      go("battle");if(!qa("#arena [data-node]:not([disabled])").length)q("#again")?.click();
    }
    await sleep(500);
    out.zones=[...out.zones];out.save=localStorage.getItem(KEY);out.key=KEY;out.v=S.v;
    return out;
  },STEPS);
  await browser.close();
  const {save,...rest}=stats;
  console.log(`[${label}]`,JSON.stringify(rest));
  return {errors,stats};
}

(async()=>{
  let failed=false;
  const fresh=await run("fresh");
  if(fresh.errors.length){failed=true;console.error(fresh.errors.join("\n"))}
  if(fresh.stats.wields>=7&&!fresh.stats.abil){failed=true;console.error("No ability buttons were clicked; they may have vanished.")}
  if(fresh.stats.bad.length){failed=true;console.error(fresh.stats.bad.join("\n"))}
  if(!fresh.stats.heat||!fresh.stats.daily){failed=true;console.error("The bot never exercised heat or the daily.")}
  if(fresh.stats.battles<3){failed=true;console.error("Too few battles completed; the loop got stuck.")}
  // Every old save fixture must still load (migrations) and play without errors.
  for(const f of fs.readdirSync(FIX).filter(f=>f.endsWith(".json")).sort()){
    const {key,save}=JSON.parse(fs.readFileSync(path.join(FIX,f),"utf8"));
    const r=await run(f,new Function(`localStorage.clear();localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(save)})`));
    if(r.errors.length){failed=true;console.error(r.errors.join("\n"))}
    if(r.stats.battles<3){failed=true;console.error(`${f}: too few battles; old save may not have migrated.`)}
  }
  if(process.argv.includes("--write-fixture")){
    const n=fresh.stats.v;fs.writeFileSync(path.join(FIX,`save-v${n}.json`),JSON.stringify({key:fresh.stats.key,save:fresh.stats.save}));
    console.log(`wrote fixture save-v${n}.json`)}
  console.log(failed?"SMOKE FAILED":"SMOKE OK");process.exit(failed?1:0);
})();
