// Real-renderer regression for procedural name composition, language switching,
// and Codex search. Run with: node tools/procedural-name-check.js
const path=require("path"),{chromium}=require("playwright");
const URL="file://"+path.join(__dirname,"..","index.html");
(async()=>{
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:900,height:700}}),fail=[];
  const bad=m=>fail.push(m);
  try{
    await page.goto(URL);await page.waitForFunction(()=>typeof S==="object"&&S);
    const chosen=await page.evaluate(()=>{
      buildRoster();riftMake(9042201,1);
      const wild=Object.values(ENEMIES).find(e=>e.gen&&!e.boss&&!e.alpha),boss=ENEMIES.rift_boss,alpha=Object.values(ENEMIES).find(e=>e.gen&&e.alpha);
      if(!wild||!boss||!alpha)throw Error("generated wild, alpha, and Rift boss are required");
      return {wild:wild.id,boss:boss.id,alpha:alpha.id,canonical:[wild.name,wild.plural,boss.name,boss.plural,boss.short,alpha.name]};
    });
    const results=await page.evaluate(({wild,boss,alpha})=>{
      const w=ENEMIES[wild],b=ENEMIES[boss],a=ENEMIES[alpha],snapshot=[w.name,w.plural,b.name,b.plural,b.short,a.name],out={};
      S.seen[wild]=true;S.codex[wild]={weak:[...w.weak],resist:[...w.resist],sp:false,sp2:false,ph:false,stats:false,inf:[],drops:[]};
      go("codex");
      let prior=JSON.stringify(S);
      for(const lang of ["en","de","ko"]){
        const before=Math.random;let calls=0;Math.random=()=>{calls++;return .5};setLang(lang);
        const name=tx(w.name),plural=tx(w.plural),bossPlural=tx(b.plural),short=tx(b.short),alphaName=tx(a.name);Math.random=before;
        const canonical=[w.name,w.plural,b.name,b.plural,b.short,a.name];
        const search=document.querySelector("#cxsearch");search.value=name;search.dispatchEvent(new Event("input",{bubbles:true}));
        out[lang]={name,plural,bossPlural,short,alphaName,calls,canonical,stateUnchanged:JSON.stringify(S)===prior,searchFound:[...document.querySelectorAll(".cxt")].some(x=>x.dataset.codex===wild&&x.querySelector(".cxname")?.textContent===name)};
      }
      return out;
    },chosen);
    if(JSON.stringify(results.en.canonical)!==JSON.stringify(chosen.canonical))bad("canonical generated English names changed");
    for(const lang of ["de","ko"]){
      const x=results[lang];if(x.canonical.some((v,i)=>v!==chosen.canonical[i]))bad(`${lang}: language switch mutated canonical names`);
      if(x.calls!==0)bad(`${lang}: translating names consumed Math.random`);
      if(!x.stateUnchanged)bad(`${lang}: language switch mutated game state`);
      if(!x.searchFound)bad(`${lang}: Codex search did not find the localized generated name`);
      if(x.name===chosen.canonical[0]||x.plural===chosen.canonical[1]||x.short===chosen.canonical[4])bad(`${lang}: one or more generated display names remained English`);
      if(x.bossPlural===chosen.canonical[3])bad(`${lang}: Rift boss plural remained English`);
      if(!x.alphaName||x.alphaName===chosen.canonical[5])bad(`${lang}: authored alpha name did not retain its direct translation`);
      if(!x.name||!x.plural||!x.short)bad(`${lang}: empty localized output`);
    }
    const langValues=await page.evaluate(({wild,boss})=>{
      setLang("de");const de=[tx(ENEMIES[wild].name),tx(ENEMIES[boss].short)];setLang("ko");return{de,ko:[tx(ENEMIES[wild].name),tx(ENEMIES[boss].short)]};
    },chosen);
    if(langValues.de[0]===langValues.ko[0]||langValues.de[1]===langValues.ko[1])bad("German and Korean compositions are indistinguishable");
    const integration=await page.evaluate(({wild,alpha})=>{
      setLang("de");
      // These translated German nouns have different grammatical genders.
      PROC_SHORT_PARTS.set("__namecheck_wraith",{noun:"Wraith"});PROC_SHORT_PARTS.set("__namecheck_husk",{noun:"Husk"});
      const genders=[tx("__namecheck_wraith"),tx("__namecheck_husk")];PROC_SHORT_PARTS.delete("__namecheck_wraith");PROC_SHORT_PARTS.delete("__namecheck_husk");
      const E=ENEMIES[wild];S.zone=E.zone;S.view="battle";S.heat[S.zone]={max:0,sel:0};startBattle(wild,{row:0,rar:"normal",afx:[]});render();
      const battle=document.querySelector("#enemyHud .fn")?.textContent.trim();S.battle=null;
      S.quest=TUTORIAL.length;S.bounty=null;S.bountyChoices=[{kind:"hunt",enemy:wild,need:2,base:0,reward:{items:[]}}];showBounties();
      const bounty=document.querySelector("#sheetIn .bounty-options h3")?.textContent||"";closeSheet();
      S.zone=ENEMIES[alpha].zone;const m=newMap(S.zone);S.maps[S.zone]=m;m.pois=[{t:"fight",x:m.pos.x,y:m.pos.y,e:alpha,rar:ENEMIES[alpha].rar,afx:ENEMIES[alpha].afx||[],mv:"still",done:false}];m.sn[m.pos.y*m.w+m.pos.x]=true;
      const map=mapHtml();
      return{genders,battle,battleExpected:tx(E.name),bounty,bountyExpected:tx(E.plural),mapHasAlpha:map.includes(tx(ENEMIES[alpha].name))};
    },chosen);
    if(integration.genders[0]!=="das Gespenst"||integration.genders[1]!=="die Hülle")bad(`German boss short-name gender composition is wrong: ${integration.genders.join(" / ")}`);
    if(!integration.battle.includes(integration.battleExpected))bad("battle renderer did not show the localized generated name");
    if(!integration.bounty.includes(integration.bountyExpected))bad("bounty renderer did not use the localized plural name");
    if(!integration.mapHasAlpha)bad("map renderer did not show the localized alpha name");
    const collision=await page.evaluate(()=>{
      const had=PROC_NAME_PARTS.has("Frost Wolf"),prior=PROC_NAME_PARTS.get("Frost Wolf");
      PROC_NAME_PARTS.set("Frost Wolf",{prefix:"Frost",noun:"Wolf"});
      setLang("de");const de={shown:tx("Frost Wolf"),authored:DICT.de["Frost Wolf"]};
      setLang("ko");const ko={shown:tx("Frost Wolf"),authored:DICT.ko["Frost Wolf"]};
      if(had)PROC_NAME_PARTS.set("Frost Wolf",prior);else PROC_NAME_PARTS.delete("Frost Wolf");
      return{de,ko};
    });
    if(collision.de.shown!==collision.de.authored||collision.ko.shown!==collision.ko.authored)bad("generated/authored name collision ignored the canonical authored translation");
    await page.evaluate(({seed})=>{S.rift={seed,depth:1};S.zone=RIFT_ZONE;save()}, {seed:9042201});
    await page.reload();await page.waitForFunction(()=>typeof S==="object"&&S&&ENEMIES.rift_boss&&ENEMIES.rift_boss.seed===9042201);
    const reload=await page.evaluate(expected=>{const e=ENEMIES.rift_boss;setLang("ko");return{same:e.name===expected[2]&&e.plural===expected[3]&&e.short===expected[4],localized:tx(e.name)!==e.name&&tx(e.short)!==e.short,seed:S.rift.seed}},chosen.canonical);
    if(!reload.same||!reload.localized||reload.seed!==9042201)bad("Rift names did not reconstruct and localize consistently after reload");
  }catch(e){bad(e.stack||e.message)}
  await browser.close();
  if(fail.length){console.error(fail.join("\n"));process.exit(1)}
  console.log("procedural-name-check: locale composition, canonical identity, RNG, and Codex search OK");
})();
