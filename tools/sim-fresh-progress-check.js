// End-to-end regression for the optional real-gated Woods-to-Pass fresh run.
// Run: NODE_PATH=/workspace/Everforge/node_modules node tools/sim-fresh-progress-check.js
const {execFileSync,spawnSync}=require("child_process"),fs=require("fs"),path=require("path"),os=require("os");
const {chromium}=require("playwright"),{setup}=require("./sim");
const root=path.join(__dirname,".."),sim=path.join(__dirname,"sim.js"),base=path.join(os.tmpdir(),"sim06-fresh-default.json"),progress=path.join(os.tmpdir(),"sim06-fresh-progress.json");
const env={...process.env,NODE_PATH:process.env.NODE_PATH||"/workspace/Everforge/node_modules"};
function run(args){return execFileSync(process.execPath,[sim,...args],{cwd:root,env,encoding:"utf8",stdio:["ignore","pipe","pipe"]})}
const fail=[];
try{
  run(["--fresh","--exped","2","--seed","1","--policy","smart","--research-policy","cheapest","--visit-limit","8","--out",base]);
  run(["--fresh","--fresh-progress","--exped","2","--seed","1","--policy","smart","--research-policy","cheapest","--visit-limit","8","--packs","--out",progress]);
  const old=JSON.parse(fs.readFileSync(base,"utf8")),p=JSON.parse(fs.readFileSync(progress,"utf8"));
  if(old.args.mode!=="fresh"||old.args.seed!=="1")fail.push("default fresh mode lost its original mode/seed metadata");
  if(old.args.packs!==undefined||old.rows.some(r=>"zone" in r||"fusing" in r))fail.push("default Woods mode changed its existing output shape");
  if(p.args.mode!=="fresh-progress"||p.args.regionalProgression!=="woods-to-pass"||p.args.seed!=="1"||p.args.fightPolicy!=="smart"||p.args.encounterPolicy!=="pack-smart"||p.args.researchPolicy!=="cheapest"||p.args.heat!==0||p.args.visitLimit!==8||p.args.packs!==true)fail.push("progress JSON omitted policy, seed, threshold, Heat, pack mode, or progression metadata");
  if(p.rows.length!==2||p.rows[0].zone!=="woods"||p.rows[1].zone!=="pass")fail.push("progress run did not route from Woods into an unlocked Pass map");
  if(!p.rows[0].passUnlocked||p.rows[0].res!=="won")fail.push("Pass opened without a real Woods boss clear");
  if(!p.rows[1].pois||!Object.keys(p.rows[1].pois).length||!p.rows[1].fights)fail.push("Pass run did not generate and fight on a real Pass map");
  if(!p.rows.every(r=>r.fusing&&r.fusing.after&&r.fusing.after.requires.includes("improve")&&r.fusing.after.cost===20&&r.fusing.after.smithRequirement===null))fail.push("per-expedition Fusing gate, RP cost, prerequisite, or Smith requirement missing");
  if(!p.progress||p.progress.firstPassExpedition!==2||!Array.isArray(p.progress.barriers))fail.push("regional reach timing or barrier summary missing");
  const noFlag=spawnSync(process.execPath,[sim,"--fresh-progress","--exped","1"],{cwd:root,env,encoding:"utf8"});
  if(noFlag.status===0||!String(noFlag.stderr).includes("--fresh-progress requires --fresh"))fail.push("--fresh-progress was accepted without --fresh");
}catch(e){fail.push(e.stderr?.toString()||e.stack||e.message)}
for(const p of [base,progress])try{fs.unlinkSync(p)}catch{}
if(fail.length){console.error(fail.join("\n"));process.exit(1)}
(async()=>{
  const browser=await chromium.launch(),page=await browser.newPage();
  try{
    await page.goto("file://"+path.join(root,"index.html"));await page.waitForFunction(()=>typeof S==="object"&&S);
    await page.evaluate(setup,{biomeMods:true,depthMods:true,packs:false,visitLimit:8});
    const fusing=await page.evaluate(()=>{
      S=freshState();S.unl.research=1;S.rp=43;
      S.techs=Object.fromEntries(TECHS.filter(t=>!["improve","fuse","armorcraft"].includes(t.id)).map((t,i)=>[t.id,i+1]));
      const audit={firstFusingAvailableExpedition:null,firstFusingAffordableExpedition:null,firstFusingLearnedExpedition:null};
      const prerequisite=SIM.fusingStatus();
      const first=SIM.researchChores("cheapest",()=>SIM.noteFusingProgress(audit,1));
      const afterCompetingPurchase=SIM.fusingStatus();
      S.rp++;
      const second=SIM.researchChores("cheapest",()=>SIM.noteFusingProgress(audit,2));
      const learned=SIM.fusingStatus();
      return{prerequisite,firstIds:first.purchases.map(p=>p.id),afterCompetingPurchase,secondIds:second.purchases.map(p=>p.id),learned,paid:S.tpaid.fuse,audit};
    });
    if(fusing.prerequisite.state!=="locked"||fusing.prerequisite.affordable)throw Error("Fusing was available before Improving");
    if(!fusing.firstIds.includes("improve")||!fusing.firstIds.includes("armorcraft"))throw Error("real research chores did not learn Improving and make a competing Armorcraft purchase");
    if(fusing.afterCompetingPurchase.affordable||fusing.afterCompetingPurchase.rp!==19||fusing.audit.firstFusingAffordableExpedition!==1)throw Error("Fusing affordability was missed before a competing research purchase spent the point");
    if(!fusing.secondIds.includes("fuse"))throw Error("Fusing was not learned after RP reached its real 20 point cost");
    if(fusing.learned.state!=="learned"||fusing.learned.rp!==0||fusing.paid!==20)throw Error("real Fusing purchase did not consume its 20 RP cost");
    if(fusing.audit.firstFusingAvailableExpedition!==1||fusing.audit.firstFusingLearnedExpedition!==2)throw Error("Fusing availability or learned timing audit missed a real purchase transition: "+JSON.stringify(fusing));
  }finally{await browser.close()}
  console.log("sim-fresh-progress-check: default output compatibility, real Pass unlock/map, locked/affordable/learned Fusing path, and JSON metadata OK");
})().catch(e=>{console.error(e.stack||e.message);process.exit(1)});
