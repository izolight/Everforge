#!/usr/bin/env node
// The live equipment sheet, its SVG layers, the map miniature and the existing item actions.
// Usage: node tools/hero-check.js (Playwright + Chromium, as with smoke.js).
const {chromium}=require("playwright"),path=require("path"),assert=require("node:assert/strict");
const URL="file://"+path.resolve(__dirname,"..","index.html");
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:360,height:800},reducedMotion:"reduce"}),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(URL);
    await page.evaluate(()=>{
      S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
      UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);S.hp=pstats().maxHp;go("gear");
      window.wear=set=>{for(const [slot,id] of Object.entries(set)){S.inv[id]=Math.max(1,S.inv[id]||0);equip(id,slot)}save();render()};
      window.layers=()=>Object.fromEntries([...document.querySelectorAll("#heroPortrait [data-hero-slot]")].map(e=>[e.dataset.heroSlot,e.dataset.item]));
    });
    let r=await page.evaluate(()=>({layers:layers(),slots:document.querySelectorAll("#gear [data-gear]").length,alt:$("heroPortrait").getAttribute("aria-label")}));
    assert.deepEqual(r.layers,{main:"iron_sword"});assert.equal(r.slots,7);assert(r.alt.includes("Iron Sword"));
    console.log("ok starter hero and seven accessible gear slots");
    await page.click('#gear [data-gear="main"]');
    await page.click('#sheet [data-act="unequip"][data-slot="main"]');
    assert.deepEqual(await page.evaluate(()=>layers()),{});
    await page.click('#sheet [data-act="equip"][data-slot="main"]');
    assert.equal(await page.evaluate(()=>layers().main),"iron_sword");
    await page.click('#sheet [data-act="close"]');
    console.log("ok slot inspection, unequip and equip update the figure through real UI actions");
    const armor={main:"iron_sword",off:"wood_shield",head:"iron_helmet",body:"stone_plate",hands:"hide_gloves",feet:"ember_treads",charm:"sprite_lantern"};
    await page.evaluate(set=>wear(set),armor);
    assert.deepEqual(await page.evaluate(()=>layers()),armor);
    const armored=await page.evaluate(()=>$("heroPortrait").innerHTML);
    const mage={main:"oak_staff",off:"dagger",head:"leather_cap",body:"void_robe",hands:"wraith_wraps",feet:"gale_boots",charm:"witch_eye"};
    await page.evaluate(set=>wear(set),mage);
    assert.deepEqual(await page.evaluate(()=>layers()),mage);
    assert.notEqual(await page.evaluate(()=>$("heroPortrait").innerHTML.replace(/hw\d+|a\d+/g,"id")),armored.replace(/hw\d+|a\d+/g,"id"));
    console.log("ok armor, gloves, boots, charm, shield and dual wielding reflect the live loadout");
    r=await page.evaluate(()=>{
      const before=JSON.stringify(S),a=heroArt(),mini=heroMini();
      return{unchanged:JSON.stringify(S)===before,invalid:/undefined|NaN/.test(a+mini)};
    });
    assert(r.unchanged&&!r.invalid);
    const forms=await page.evaluate(()=>Object.keys(FORMS).filter(k=>FORMS[k].g==="weapon"));
    for(const form of forms){
      r=await page.evaluate(form=>{
        const id="hero_test_"+form;S.items[id]={id,name:"Test weapon",noun:"Weapon",form,traits:{Fire:3,Ice:3,Arcane:3,Sharp:4},tier:4,crafted:true,grade:5,legendary:true};S.inv[id]=2;
        equip(id,"main");equip(id,"off");render();
        return{forms:[...document.querySelectorAll("#heroPortrait .hero-held")].map(e=>e.dataset.form),invalid:/undefined|NaN/.test($("heroPortrait").innerHTML)};
      },form);
      assert.deepEqual(r.forms,[form,form]);assert(!r.invalid);
    }
    console.log("ok every weapon form, crafted traits, grades and legendaries in both hands");
    await page.evaluate(set=>wear(set),armor);
    r=await page.evaluate(()=>{
      const ids=[...document.querySelectorAll("[id]")].map(e=>e.id),refs=[...document.querySelectorAll("#heroPortrait [fill],#heroPortrait [stroke]")].flatMap(e=>[e.getAttribute("fill"),e.getAttribute("stroke")]).filter(Boolean).filter(v=>v.startsWith("url(#"));
      return{unique:new Set(ids).size===ids.length,resolved:refs.every(v=>document.getElementById(v.slice(5,-1)))};
    });
    assert(r.unique&&r.resolved);
    for(const lang of ["en","de","ko"]){
      for(const width of [320,360,720]){
        await page.setViewportSize({width,height:900});
        r=await page.evaluate(lang=>{setLang(lang);const sheet=document.querySelector(".character-sheet").getBoundingClientRect();return{
          overflow:document.documentElement.scrollWidth>innerWidth,
          fits:[...document.querySelectorAll("#gear button")].every(e=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44&&b.left>=sheet.left&&b.right<=sheet.right&&b.top>=sheet.top&&b.bottom<=sheet.bottom}),
          labeled:$("heroPortrait").getAttribute("aria-label").includes(iname(gearOf("main")))
        }},lang);
        assert(!r.overflow&&r.fits&&r.labeled,JSON.stringify({lang,width,...r}));
      }
    }
    console.log("ok SVG references, translated labels and touch targets at 320/360/720px");
    await page.evaluate(()=>{setLang("en");go("battle")});
    r=await page.evaluate(()=>({mini:!!document.querySelector(".tl.here .hero-mini"),name:document.querySelector(".tl.here").getAttribute("aria-label"),hud:!!document.querySelector(".mhead .hero-mini")}));
    assert(r.mini&&r.hud&&r.name.includes("You"));
    const before=await page.evaluate(()=>heroMini());
    await page.evaluate(()=>{S.eq.main="oak_staff";S.inv.oak_staff=1;save();render()});
    assert.notEqual(await page.evaluate(()=>heroMini()),before);
    await page.reload();
    assert(await page.evaluate(()=>!!document.querySelector(".tl.here .hero-mini")));
    await page.evaluate(()=>go("gear"));
    assert.equal(await page.evaluate(()=>document.querySelector('#heroPortrait [data-hero-slot="main"]').dataset.item),"oak_staff");
    await page.evaluate(()=>{S.inv.oak_staff=0;render()});
    assert.equal(await page.evaluate(()=>document.querySelector('#heroPortrait [data-hero-slot="main"]')),null);
    console.log("ok map/HUD miniature, equipment changes, reload and missing-item fallback");
    assert.deepEqual(errors,[]);console.log("HERO CHECK OK");
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
