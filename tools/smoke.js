#!/usr/bin/env node
// Headless smoke test: plays the game through the real UI and fails on any page error.
// Usage: node tools/smoke.js [steps]   (needs Playwright; Chromium is preinstalled in cloud sessions; I18N_LANG=de or ko plays it in that language)
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const STEPS=+process.argv[2]||400,URL="file://"+path.resolve(__dirname,"..","index.html")+(process.env.I18N_LANG?"?lang="+process.env.I18N_LANG:""); // I18N_LANG=de|ko plays the same run in another language
const FIX=path.join(__dirname,"fixtures");

// nat: play the way a newcomer does (no forced unlocks, zones, Heat, daily, peddler or affix fights), so systems open by their own rules and the intro cards get clicked away
async function run(label,setup,nat){
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const errors=[];
  page.on("pageerror",e=>errors.push(`pageerror: ${e.message}`));
  page.on("console",m=>{if(m.type()==="error"&&!/fonts\.(googleapis|gstatic)|net::ERR/.test(m.text()))errors.push(`console: ${m.text()}`)});
  await page.goto(URL);
  if(setup){await page.evaluate(setup);await page.reload()}
  await page.waitForFunction(()=>typeof S==="object"&&S);
  const stats=await page.evaluate(async ({steps,nat})=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out={steps:0,battles:0,won:0,lost:0,forged:0,zones:new Set(),views:0,wields:0,abil:0,tiles:0,outs:0,byfoe:0,fled:0,script:0,intros:0,heat:0,daily:0,aband:0,bought:0,sold:0,upgraded:0,reforged:0,learned:0,studied:0,gated:0,afx:new Set(),split:0,boom:0,rare:0,decon:0,shaped:0,bad:[]};
    out.vet0=UNLOCKS.every(u=>S.unl[u.id])&&TECHS.every(t=>S.techs[t.id])&&pendingIntros().length===0?1:`missing ${UNLOCKS.filter(u=>!S.unl[u.id]).map(u=>u.id)} pending ${pendingIntros().map(c=>c.id)}`; // as loaded, before the bot plays
    const click=el=>{el.click();return true};let wantZone=null,doChores=false,wantWield=false,wantHeat=false,wantDaily=false,wantAband=false,wantShop=false;
    const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
    const fin=B=>{ // a finished fight: a won one drops an affixed raw for each affix that deconstructs into its essence (a lost one never drops anything); count splits and volatile deaths
      if(B.split)out.split++;if(B.boom)out.boom++;if(B.rar==="rare")out.rare++;
      if(B.over==="won")B.afx.forEach(a=>{const r=B.loot.find(id=>afxOfId(id)===a);if(!r)out.bad.push(`no affixed raw from ${a}`);else if(!deconYield(S.items[r]).frag.some(f=>f[0]===AFX[a].tr))out.bad.push(`${r} does not deconstruct into ${AFX[a].tr}`)});
      if(B.over==="lost"&&B.loot.length)out.bad.push("a lost fight dropped loot")};
    for(let i=0;i<steps;i++){out.steps++;
      // Every so often, unlock everything and top up HP so later content gets exercised too.
      {const ok=q("#introOk");if(ok&&Math.random()<.6){click(ok);out.intros++;continue}} // an intro card: read it (Got it)
      if(!nat&&i%60===59)wantZone=ZONES[(i/60|0)%ZONES.length][0];
      if(wantZone&&!busy()&&S.run!=="daily"){S.unlocked=[...new Set([...S.unlocked,...ZONES.map(z=>z[0])])];S.zone=wantZone;S.battle=null;S.event=null;wantZone=null;save();render()}
      if(i%25===24)doChores=true; // stays set until the bot is idle, so a busy moment never skips it
      if(i%10===9)wantWield=true;
      if(wantWield&&!busy()){wantWield=false;wield()}
      if(!nat&&i%37===5)wantHeat=true;
      if(i%70===33&&!busy()){curMap().torch=0;render()} // the torch dying: dim light, ambushes
      if(!nat&&i%53===17)wantDaily=true;
      if(i%29===3)wantAband=true;
      if(!nat&&i%47===11)wantShop=true;
      // the daily run and the normal zone must never mix
      if(S.run==="daily"?!(S.daily&&S.daily.state==="run"&&S.zone===S.daily.zone&&curMap()===S.daily.map):(S.daily&&S.daily.state==="run"))out.bad.push(`daily state broken at step ${i}`);
      if(S.run==="daily"&&i%41===0){const s2=migrate(JSON.parse(JSON.stringify(S)));if(s2&&s2.run==="daily")S=s2;else out.bad.push("daily did not survive a save round trip")}
      {const m=curMap(),seen=new Set(); // roaming enemies: never on rock, water or the fixed tiles, never two on a tile
        for(const p of m.pois){if(!isFoe(p)||p.done)continue;const k=p.x+","+p.y;if(seen.has(k)||!walk(m,p.x,p.y)||(roamer(p)&&fixed(m,p.x,p.y)))out.bad.push(`enemy on a bad tile ${k} at step ${i}`);seen.add(k)}}
      if(!nat&&i>=60&&!out.afxDone&&!busy()&&S.run!=="daily"&&!(S.battle&&S.battle.over)){afxCheck();continue}
      if(!nat&&i%25===4&&!busy()&&S.run!=="daily"&&!(S.battle&&S.battle.over)){ // now and then a magic or rare fight with each affix in turn, so every hook runs (splitting, a volatile death, wards, dodging...)
        const ids=Object.keys(AFX),a=ids[(i/25|0)%ids.length],rare=(i/25|0)%3===2,b=rare?rollAfx(Math.random,"rare",{mv:"chase",heat:S.heat[S.zone]?S.heat[S.zone].sel:0}).filter(x=>x!==a&&afxOk(a,x)):[];
        S.event=null;startBattle(pickEnemy(S.zone),{row:2,rar:rare?"rare":"magic",afx:[a,...b.slice(0,1)]});S.hp=pstats().maxHp;continue}
      if(!nat&&i>=50&&!out.script&&!busy()&&S.run!=="daily"&&!(S.battle&&S.battle.over)){scripted();continue}
      if(S.view!=="battle")go("battle");
      out.zones.add(S.zone);
      if(S.battle&&!S.battle.over){
        S.battle.afx.forEach(a=>out.afx.add(a));
        if(S.hp<pstats().maxHp*.35&&i%3)S.hp=pstats().maxHp;
        if(S.battle.turn>40)S.battle.hp=1; // don't let a stalemate eat the whole run
        if(S.battle.pi!=null&&i%19===2&&q("#flee")){ // flee a map enemy now and then: it must stay, dazed
          for(let k=0;k<8&&S.battle&&!S.battle.over&&q("#flee");k++)click(q("#flee"));
          if(S.battle&&S.battle.over==="fled"){out.fled++;const nd=curMap().pois[S.battle.pi];if(!nd||nd.done||nd.aw||(nd.mv!=="still"?nd.dz!==ROAM.daze:nd.dz))out.bad.push("a fled-from enemy is not dazed (or a still one is)")}
          if(S.battle&&S.battle.over){fin(S.battle);out.battles++;out[S.battle.over==="won"?"won":"lost"]++;if(S.battle.by==="it")out.byfoe++}
          continue}
        const btns=qa("#arena button:not([disabled]):not([aria-disabled=true])").filter(b=>b.id&&!["flee","rest"].includes(b.id)||b.dataset.ability);
        const b=btns.length?btns[Math.floor(Math.random()*btns.length)]:q("#atk");
        if(Math.random()<.75&&q("#atk"))click(q("#atk"));else if(b){if(b.dataset.ability)out.abil++;click(b)}
        if(S.battle&&S.battle.over){fin(S.battle);out.battles++;out[S.battle.over==="won"?"won":"lost"]++;if(S.battle.by==="it")out.byfoe++}
        continue}
      if(doChores){doChores=false;await chores();continue}
      if(wantHeat&&S.run!=="daily"&&!S.event&&!S.battle){S.heat[S.zone]={max:1+Math.floor(Math.random()*HEAT_MAX),sel:0};render();
        let hb=qa("#arena [data-heat]");if(!hb.length&&q("#heatBtn")){click(q("#heatBtn"));hb=qa("#arena [data-heat]")} // the Heat picker opens from the strip's flame button
        if(hb.length){wantHeat=false;click(hb[Math.floor(Math.random()*hb.length)]);out.heat++;continue}}
      if(wantDaily&&S.run!=="daily"&&!S.event&&!S.battle){S.kills[ZONES[0][2]]=S.kills[ZONES[0][2]]||1;if(Math.random()<.6)S.daily=null;render();const db=q("#dailyStart");if(db){wantDaily=false;click(db);out.daily++;continue}}
      if(S.run==="daily"&&wantAband&&q("#dailyAbandon")&&Math.random()<.5){wantAband=false;click(q("#dailyAbandon"));click(q("#dailyAbandon"));if(S.run!=="daily")out.aband++;continue}
      const cs=qa("#arena [data-choice]:not([disabled])"),shop=S.event?.type==="merchant"; // the peddler's shop: sometimes buy or sell, else the usual picks
      if(shop&&S.embers<40)S.embers+=40;
      const sc=shop&&qa("#arena [data-choice]:not([disabled])").filter(b=>/^(buy|sell):/.test(b.dataset.choice));
      if(sc&&sc.length&&Math.random()<.7){const b=sc[Math.floor(Math.random()*sc.length)];out[b.dataset.choice[0]==="b"?"bought":"sold"]++;click(b);continue}
      const choice=Math.random()<.35?cs[Math.floor(Math.random()*cs.length)]:cs.find(b=>b.dataset.choice!=="inspect"&&b.dataset.choice!=="leave")||cs[0]; // sometimes any choice, so leave and the odd ones run too
      if(choice){click(choice);continue}
      const tiles=qa("#arena [data-tile]");
      if(wantShop&&tiles.length){wantShop=false;const n=tiles[Math.floor(Math.random()*tiles.length)],[x,y]=n.dataset.tile.split(",").map(Number),m=curMap();let p=poiAt(m,x,y);if(!p||p.t!=="boss"){if(!p)m.pois.push(p={x,y,r:0});p.t="peddler";p.done=false;p.sh=null}click(n);out.tiles++;continue} // force a peddler so the shop gets exercised
      if(tiles.length){click(explore(tiles));out.tiles++;if(curMap().torch<=0)out.outs++;continue}
      const cont=q("#cont")||q("#again");
      if(cont){click(cont);continue}
      const claim=q("#claim");if(claim){click(claim);continue}
      await chores();
    }
    // every affix in turn: a magic fight through the real UI (#atk), then three rare combinations; each must finish (splitting once, a volatile burst, wards, dodging), drop its essences and leave the save playable (the real state is put back afterwards)
    function afxCheck(){
      const bk=JSON.stringify(S);out.afxDone=1;
      try{const run=(rar,afx,label)=>{S.battle=null;S.event=null;S.view="battle";S.hp=pstats().maxHp;startBattle(pickEnemy(S.zone),{row:2,rar,afx});afx.forEach(a=>out.afx.add(a));const B=S.battle;
          for(let k=0;k<150&&S.battle===B&&!B.over;k++){render();if(B.turn>40)B.hp=1;S.hp=Math.max(S.hp,Math.round(pstats().maxHp*.6));const b=q("#atk");if(!b)break;click(b)}
          if(!B.over)out.bad.push(`stuck in a fight with ${label}`);else fin(B)};
        Object.keys(AFX).forEach(a=>run("magic",[a],a));
        for(let k=0;k<3;k++){run("rare",rollAfx(Math.random,"rare",{mv:"chase",heat:4}),"a rare")}
      }catch(e){out.bad.push("affix check threw: "+e.message)}
      S=JSON.parse(bk);S.battle=null;save();render()}
    // a chaser two tiles away must walk into you, and fleeing it must leave it alive, dazed and unaware (the real state is put back afterwards)
    function scripted(){
      const bk=JSON.stringify(S),rr=Math.random;let ok=false;
      try{const z=S.zone;S.battle=null;S.event=null;S.hp=pstats().maxHp;const m=genMap({heat:0,zone:z});m.pois=m.pois.filter(p=>p.t==="boss"||p.t==="camp"||(p.x===m.gate.x&&p.y===m.gate.y));S.maps[z]=m;
        let pl,en;for(let y=3;y<m.h&&!en;y++)for(let x=0;x<m.w&&!en;x++){if(!walk(m,x,y)||fixed(m,x,y)||m.d[y*m.w+x]<5)continue;const d=bfs(m,x,y,(mm,a,b)=>!hard(mm,a,b));
          for(let b=0;b<m.h&&!en;b++)for(let a=0;a<m.w;a++)if(d[b*m.w+a]===2&&!hard(m,a,b)){pl=[x,y];en=[a,b];break}}
        const p={t:"fight",x:en[0],y:en[1],r:2,done:false,e:Object.keys(ENEMIES).find(k=>ENEMIES[k].zone===z&&ENEMIES[k].mv==="chase"),mv:"chase",rar:"normal",afx:[],aw:1};m.pois.push(p);
        m.pos={x:pl[0],y:pl[1]};m.prev=null;m.steps=5;reveal(m);
        for(let k=0;k<4&&!S.battle;k++){const d=bfs(m,p.x,p.y),a=adjTiles(m).filter(([x,y])=>!(x===p.x&&y===p.y)&&!m.pois.some(q=>q!==p&&q.x===x&&q.y===y&&!q.done)).sort((u,v)=>d[u[1]*m.w+u[0]]-d[v[1]*m.w+v[0]])[0];step(a[0],a[1])}
        if(S.battle&&S.battle.by==="it"){Math.random=()=>.1;flee();ok=S.battle.over==="fled"&&!p.done&&p.dz===ROAM.daze&&!p.aw}}catch(e){out.bad.push("scripted check threw: "+e.message)}
      Math.random=rr;S=JSON.parse(bk);S.battle=null;save();render();
      if(ok)out.script++;else out.bad.push("scripted chaser check failed")}
    // explore: step towards the nearest unvisited POI (as last seen) or unexplored edge by BFS over seen tiles; the lair once most of the map is done or the bot has walked a while; sometimes a random step
    function explore(tiles){
      const m=curMap(),W=m.w,H=m.h;if(Math.random()<.1)return tiles[Math.floor(Math.random()*tiles.length)];
      const goalLair=m.steps>45||Math.random()<.02,dist=Array(W*H).fill(-1),first=Array(W*H).fill(null),q=[[m.pos.x,m.pos.y]];dist[m.pos.y*W+m.pos.x]=0;
      const want=(x,y)=>{const t=m.mem[x+","+y];if(t)return goalLair?t==="boss":t!=="boss";return !goalLair&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>inb(m,x+a,y+b)&&!m.sn[(y+b)*W+x+a])};
      for(let k=0;k<q.length;k++){const [x,y]=q[k];if(k&&want(x,y)){const f=first[y*W+x];const b=tiles.find(t=>t.dataset.tile===f.join());if(b)return b}
        DIRS.forEach(([a,b])=>{const u=x+a,v=y+b;if(walk(m,u,v)&&m.sn[v*W+u]&&dist[v*W+u]<0){dist[v*W+u]=1;first[v*W+u]=k?first[y*W+x]:[u,v];q.push([u,v])}})}
      return tiles[Math.floor(Math.random()*tiles.length)]}
    function wield(){ // each weapon form in turn (and sometimes a shield) so every signature ability gets exercised
      const wf=Object.keys(FORMS).filter(k=>FORMS[k].g==="weapon"),f=wf[out.wields++%wf.length],id="t_"+f,tr=pick([{Fire:2,Sharp:2},{Ice:3,Arcane:1},{Poison:2,Heavy:1},{Holy:2,Tempered:2},{Shadow:2}]);
      S.items[id]={id,name:"Test "+FORMS[f].label,form:f,noun:FORMS[f].label,traits:tr,tier:1,crafted:true};addItem(id);equip(id,"main");
      if(Math.random()<.6){addItem("wood_shield");equip("wood_shield","off")}}
    // Visit the other views, forge something, salvage, infuse.
    async function chores(){
      for(const v of VIEWS){go(v);out.views++}
      go("gear");{const da=q("#gdecon:not([hidden]) #deconAll");if(da&&Math.random()<.6){const n0=S.stats.salvaged;da.click();q("#gdecon:not([hidden]) #deconAll")?.click();if(S.stats.salvaged>n0)out.decon++;else out.bad.push("Deconstruct all did nothing")}} // twice: the first tap arms it
      go("forge");{const pb=qa("#pats [data-pat]");if(pb.length){click(pb[Math.floor(Math.random()*pb.length)]);const sh=q("#shape:not([disabled])"); // a pattern or blueprint, auto-filled when it is picked
        if(sh){const n0=S.stats.shaped,inv0=JSON.stringify(S.inv);sh.click();await sleep(30);if(S.stats.shaped>n0)out.shaped++;else out.bad.push("a filled pattern did not forge");if(JSON.stringify(S.inv)===inv0)out.bad.push("pattern forging changed nothing in the satchel")}}}
      go("forge");S.bench=[];
      const can=qa("#finv [data-can='1']"),isE=b=>isEss(b.dataset.id),bases=can.filter(b=>!isE(b));
      if(nat&&bases.length&&can.some(isE)&&Math.random()<.8){click(bases[Math.floor(Math.random()*bases.length)]);click(qa("#finv [data-can='1']").find(isE))} // a newcomer binds an essence into an item: the one forge Binding allows
      else{
        for(const c of can.slice(0,1+Math.floor(Math.random()*2)))click(c);
        const can2=qa("#finv [data-can='1']");if(can2.length)click(can2[Math.floor(Math.random()*can2.length)])}
      if(S.bench.length>=2){const j0=S.stats.forged+S.stats.fizzles;q("#combine").click();q("#combine").click();await sleep(30);out.forged++;if(S.stats.forged+S.stats.fizzles===j0&&craftMiss(S.bench.map(id=>S.items[id])).length)out.gated++} // twice: the first tap only arms the equipped-item warning; a craft that needs a technique you lack is refused
      S.bench=[];save();
      if(isUnl("research")){go("forge");{const rd=q("#resd");if(rd)rd.open=true}
        const av=qa("#restree .tn.can");if(av.length){click(av[Math.floor(Math.random()*av.length)]);const lb=q("#learn");if(lb&&lb.getAttribute("aria-disabled")!=="true"){click(lb);out.learned++}}
        const sb=qa("#restree [data-study]:not(.off)");if(sb.length){click(sb[Math.floor(Math.random()*sb.length)]);out.studied++}}
      S.embers+=40;{const t=pick(ESS_POOL);for(let k=0;k<3;k++)addItem(essG(t,1))}go("forge"); // upgrading a grade (3 Faint, Alchemy Lv 1 is enough), then a mishap to reforge
      const rf=q("#upgrows [data-upgrade]:not([disabled])");if(rf){rf.click();out.upgraded++}
      S.items.t_curse={id:"t_curse",name:"Cursed Test Blade",form:"blade",noun:"Blade",traits:{Fire:2,Cursed:2},tier:2,crafted:true,recipe:["a","b"],recipeIds:[]};addItem("t_curse");
      go("gear");{const cb=qa("#ginv [data-id]").find(b=>b.dataset.id==="t_curse");if(cb){cb.click();const rg=q("#sheet [data-act='reforge']:not([disabled])");if(rg){rg.click();out.reforged++}else closeSheet()}}
      go("gear");const it=qa("#ginv [data-id]").find(b=>!eqCount(b.dataset.id));if(it){it.click();const sv=q("#sheet [data-act='salvage']");if(sv&&Math.random()<.5){sv.click();q("#sheet [data-act='salvage']")?.click()}closeSheet()}
      const inf=q("#infbtns [data-infuse]");if(inf)inf.click();
      go("battle");if(!qa("#arena [data-tile]").length)q("#again")?.click();
    }
    await sleep(500);
    out.miss=window.__miss?[...window.__miss]:[];out.unl=Object.keys(S.unl);out.techs=Object.keys(S.techs).length;out.rp=S.rp;out.pending=pendingIntros().length;out.zones=[...out.zones];out.afx=[...out.afx];out.save=localStorage.getItem(KEY);out.key=KEY;out.v=S.v;
    return out;
  },{steps:STEPS,nat});
  await browser.close();
  const miss=stats.miss.filter(k=>!/Test |^[ab]$|noun\|Blade/.test(k)); // the bot's own throwaway items ("Test Blade", recipe "a"+"b") have no translations
  if(process.env.I18N_LANG&&miss.length)errors.push("no translation for: "+miss.slice(0,12).join(" | "));
  const {save,miss:_m,...rest}=stats;
  console.log(`[${label}]`,JSON.stringify(rest));
  return {errors,stats};
}

(async()=>{
  let failed=false;const fail=m=>{failed=true;console.error(m)};
  // 1. a newcomer's save, played naturally: systems open by their own rules, intro cards are read and never pile up
  const fresh=await run("fresh",null,true),fs_=fresh.stats;
  if(fresh.errors.length)fail(fresh.errors.join("\n"));
  if(fs_.bad.length)fail(fs_.bad.join("\n"));
  if(fs_.battles<3)fail("Too few battles completed; the loop got stuck.");
  if(!fs_.intros||fs_.unl.length<4)fail(`The natural run opened too little (${fs_.unl.length} unlocks, ${fs_.intros} intro cards read).`);
  if(fs_.tiles<30)fail("The bot barely explored the map.");
  if(!fs_.unl.includes("patterns")||!fs_.shaped||!fs_.decon)fail(`The natural run did not deconstruct its raw finds and forge from a pattern (patterns open: ${fs_.unl.includes("patterns")}, deconstruct-all ${fs_.decon}, pattern forges ${fs_.shaped}).`);
  if(!fs_.unl.includes("research")||fs_.techs<2||!fs_.learned)fail(`The natural run did not progress into research and learn a technique (research open: ${fs_.unl.includes("research")}, techniques ${fs_.techs}, learned ${fs_.learned}).`);
  // 2. a save with everything unlocked (a fresh state with every UNLOCKS entry open and read): the feature checks that gating would keep out of a 400-step newcomer run (abilities, Heat, daily, buying, selling, upgrading, reforging, flee, affixes, chasers, tiles)
  const all=await run("unlocked",new Function(`S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);Object.keys(ABILITIES).forEach(k=>S.seen["a:"+k]=true);S.quest=TUTORIAL.length;S.techs=Object.fromEntries(TECHS.map((t,i)=>[t.id,i+1]));save()`)),st=all.stats;
  if(all.errors.length)fail(all.errors.join("\n"));
  if(st.wields>=7&&!st.abil)fail("No ability buttons were clicked; they may have vanished.");
  if(st.bad.length)fail(st.bad.join("\n"));
  if(!st.bought||!st.sold||!st.upgraded||!st.reforged)fail(`The bot never exercised the economy (bought ${st.bought}, sold ${st.sold}, upgraded ${st.upgraded}, reforged ${st.reforged}).`);
  if(!st.heat||!st.daily)fail("The bot never exercised heat or the daily.");
  if(st.tiles<30)fail("The bot barely explored the map.");
  if(st.afx.length<17||!st.split||!st.boom||!st.rare)fail(`The bot did not meet every affix (${st.afx.length}/17), a split (${st.split}), a volatile death (${st.boom}) or a rare (${st.rare}).`);
  if(!st.script)fail("The scripted chaser check (contact, flee, daze) did not run.");
  if(!(st.fled+fs_.fled)||!(st.byfoe+fs_.byfoe))fail(`The bot never fled (${st.fled}+${fs_.fled}) or was hunted down (${st.byfoe}+${fs_.byfoe}).`); // random encounters, so count both runs; the scripted chaser check covers flee and daze for sure
  if(st.battles<3)fail("Too few battles completed; the loop got stuck.");
  // 3. every old save fixture must still load (migrations), open as a veteran (everything unlocked, no intro waiting) and play without errors
  for(const f of fs.readdirSync(FIX).filter(f=>f.endsWith(".json")).sort()){
    const {key,save}=JSON.parse(fs.readFileSync(path.join(FIX,f),"utf8"));
    const r=await run(f,new Function(`localStorage.clear();localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(save)})`));
    if(r.errors.length)fail(r.errors.join("\n"));
    if(r.stats.battles<3)fail(`${f}: too few battles; old save may not have migrated.`);
    if(key!==all.stats.key&&r.stats.vet0!==1)fail(`${f}: an older save did not load as a fully unlocked veteran (${r.stats.vet0}).`);
  }
  if(process.argv.includes("--write-fixture")){
    const n=all.stats.v;fs.writeFileSync(path.join(FIX,`save-v${n}.json`),JSON.stringify({key:all.stats.key,save:all.stats.save}));
    console.log(`wrote fixture save-v${n}.json`)}
  console.log(failed?"SMOKE FAILED":"SMOKE OK");process.exit(failed?1:0);
})();
