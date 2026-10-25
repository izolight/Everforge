#!/usr/bin/env node
// Exercise motion through the real controls, including rapid actions and an OS preference change.
// Usage: node tools/motion-check.js [--shots /tmp/everforge-motion] (Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path"),fs=require("fs"),assert=require("node:assert/strict");
const URL="file://"+path.resolve(__dirname,"..","index.html"),shotArg=process.argv.indexOf("--shots"),shots=shotArg<0?null:process.argv[shotArg+1];
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"}),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(URL);
    await page.evaluate(()=>{
      S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
      UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);Object.keys(ABILITIES).forEach(k=>S.seen["a:"+k]=true);render();
      window.fight=(form="blade")=>{
        S.battle=null;S.event=null;S.view="battle";S.zone="woods";
        const id="motion_weapon";S.items[id]={id,name:"Test weapon",noun:"Weapon",form,traits:{Arcane:3,Iron:5},tier:1,crafted:true};
        S.inv[id]=1;S.eq.main=id;S.eq.off=null;S.hp=pstats().maxHp;
        startBattle("boar",{rar:"normal",afx:[]});S.battle.hp=S.battle.max=10000;S.battle.atk=1;render();
      };
    });
    for(const [form,mark] of [["blade","slash"],["spear","thrust"],["staff","arc"],["claws","claws"]]){
      const r=await page.evaluate(form=>{
        fight(form);const turn=S.battle.turn;$("atk").click();
        return{turn:S.battle.turn-turn,marks:[...document.querySelectorAll("#foeArt .combat-fx")].map(e=>e.className),
          passive:[...document.querySelectorAll(".combat-fx")].every(e=>e.getAttribute("aria-hidden")==="true"&&getComputedStyle(e).pointerEvents==="none"),
          bar:[...$("enemyHud").querySelector(".bar i").getAnimations()].some(a=>a.effect.getKeyframes().some(f=>f.width))};
      },form);
      assert.equal(r.turn,1);assert(r.marks.includes("combat-fx fx-"+mark));assert(r.passive&&r.bar);
    }
    await page.evaluate(()=>{fight();document.querySelector('[data-ability="blade"]').click()});
    assert.equal(await page.locator("#foeArt .fx-slash").count(),1,"multi-hit actions keep their impact readable");
    console.log("ok real attacks and abilities: weapon impacts, HP interpolation and passive overlays");
    await page.evaluate(()=>$("guard").click());
    assert.equal(await page.locator("#youHud .fx-guard").count(),1);
    await page.evaluate(()=>{
      S.battle.turn=foeOf(S.battle).sp.every;render();
      const random=Math.random;Math.random=()=>0;try{$("parry").click()}finally{Math.random=random}
    });
    assert.equal(await page.locator("#youHud .fx-parry").count(),1);
    await page.evaluate(()=>{S.hp=Math.max(1,S.hp-10);healYou(5);render()});
    assert.equal(await page.locator("#youHud .fx-heal").count(),1);
    await page.waitForFunction(()=>!document.querySelector(".combat-fx"));
    console.log("ok guarding, successful parries and healing animate and clean up");

    const r=await page.evaluate(()=>{
      S.battle=null;S.event=null;S.maps.woods=genMap({zone:"woods",seed:42,heat:0});render();
      const m=curMap(),start={...m.pos},btn=document.querySelector(".tl.adj[data-tile]");btn.click();
      const hero=document.querySelector(".tl.here .hero"),walking=hero.getAnimations().length>0;
      const tile=[...document.querySelectorAll("[data-tile]")].find(e=>e.dataset.tile===start.x+","+start.y);tile.click();
      return{walking,steps:m.steps,back:m.pos.x===start.x&&m.pos.y===start.y,active:document.querySelector(".tl.here .hero").getAnimations().length>0};
    });
    assert(r.walking&&r.back&&r.active);assert.equal(r.steps,2);
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>document.querySelector(".tl.here .hero").getAnimations().length),0);
    await page.evaluate(()=>go("gear"));
    assert(await page.evaluate(()=>$("v-gear").getAnimations().length>0));
    await page.waitForTimeout(250);
    await page.evaluate(()=>render());
    assert.equal(await page.evaluate(()=>$("v-gear").getAnimations().length),0,"same-view renders do not replay entry motion");
    console.log("ok consecutive map steps remain responsive and tab transitions play once");

    await page.evaluate(()=>{
      fight();S.battle.hp=1;$("atk").click();
    });
    assert.equal(await page.evaluate(()=>S.battle.over),"won");
    assert(await page.evaluate(()=>[...document.querySelectorAll(".loot button")].some(e=>e.getAnimations().length)));
    await page.waitForTimeout(650);
    await page.evaluate(()=>render());
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll(".loot button")].reduce((n,e)=>n+e.getAnimations().length,0)),0);
    console.log("ok victory loot is staggered once and stays available for inspection");

    for(const lang of ["en","de","ko"]){
      for(const width of [320,390,720]){
        await page.setViewportSize({width,height:900});
        await page.evaluate(lang=>{setLang(lang);fight("staff");$("atk").click();$("guard").click()},lang);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+" at "+width+"px");
        assert(await page.evaluate(()=>document.elementFromPoint(...(()=>{const b=$("atk").getBoundingClientRect();return[b.x+b.width/2,b.y+b.height/2]})()).closest("button").id==="atk"));
      }
    }
    if(shots){
      fs.mkdirSync(shots,{recursive:true});
      await page.setViewportSize({width:390,height:844});
      await page.evaluate(()=>{setLang("en");fight("staff");$("atk").click();motionActive.forEach(a=>{a.pause();a.currentTime=100})});
      await page.screenshot({path:path.join(shots,"combat-mobile.png"),fullPage:true});
      await page.setViewportSize({width:900,height:1000});
      await page.evaluate(()=>{fight("claws");$("atk").click();motionActive.forEach(a=>{a.pause();a.currentTime=100})});
      await page.screenshot({path:path.join(shots,"combat-desktop.png"),fullPage:true});
    }
    console.log("ok effects fit mobile/desktop layouts in English, German and Korean");

    await page.evaluate(()=>{fight("staff");$("atk").click()});
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.waitForFunction(()=>motionActive.size===0&&!document.querySelector(".combat-fx"));
    await page.evaluate(()=>{go("gear");go("battle");$("atk").click();$("guard").click();S.hp-=5;healYou(3);render()});
    assert.equal(await page.locator(".combat-fx").count(),0);
    assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
    console.log("ok reduced motion cancels running effects and suppresses subsequent motion");

    const seedState=await page.evaluate(()=>{S=freshState();return JSON.stringify(S)}),results=[];
    for(const reducedMotion of ["no-preference","reduce"]){
      await page.emulateMedia({reducedMotion});
      results.push(await page.evaluate(initial=>{
        S=JSON.parse(initial);let seed=71,calls=0;const random=Math.random;
        Math.random=()=>{calls++;return((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)};
        try{
          startBattle("boar",{rar:"normal",afx:[]});S.battle.hp=S.battle.max=10000;S.battle.atk=1;
          attack();guard();attack();S.hp-=10;healYou(4);render();
          return{state:JSON.stringify(S),calls};
        }finally{Math.random=random}
      },seedState));
    }
    assert.deepEqual(results[0],results[1],"motion must not change combat rolls or the save");
    assert.deepEqual(errors,[]);console.log("ok motion leaves game state and random rolls identical\nMOTION CHECK OK");
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
