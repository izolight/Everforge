#!/usr/bin/env node
// Regression checks for the reviewed crafting, combat and navigation flows.
const {chromium}=require('playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('file://'+path.resolve(__dirname,'../index.html'));
 await page.evaluate(()=>{S=freshState();const water=essG('Water',3);addItem(water);S.bench=['iron_sword',water];forgeIt(S.bench.map(id=>S.items[id]));go('forge');$('resultPanel').open=true;});
 assert(await page.locator('#result').innerText().then(t=>t.includes('Equipped automatically')&&t.includes('Compared with Iron Sword')));
 assert(await page.locator('#result .fx-description').count()>0);
 await page.evaluate(()=>{$('resultPanel').open=true;S.eq.main=null;render()});
 await page.locator('[data-result-equip]').click();assert(await page.evaluate(()=>S.eq.main===S.last.id));
 console.log('ok forge explains effects and automatic equipment; direct Equip updates loadout');
 await page.evaluate(()=>{S=freshState();S.rp=30;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');const id=essG('Fire',3);addItem(id);S.act='infuse';S.bench=['iron_sword',id];go('forge')}); // Infusing, learned the normal way: its group, a slot technique, then Infusing (any slot)
 assert(!await page.locator('#mixhint').innerText().then(t=>t.includes('destroy')));
 await page.locator('#combine').click();assert.equal(await page.evaluate(()=>S.stats.forged),1);
 await page.evaluate(()=>{S.battle=null;go('battle');startBattle('wolf',{row:0});unlock('parry',true);delete S.seen['i:parry'];S.battle.turn=1;render()});
 assert(await page.evaluate(()=>!isSpecial(S.battle)&&curIntro(true)?.id!=='parry'));
 await page.evaluate(()=>{for(let i=1;i<20;i++){S.battle.turn=i;if(isSpecial(S.battle))break}render()});
 assert(await page.evaluate(()=>curIntro(true)?.id==='parry'));
 console.log('ok guaranteed forge needs one click; parry lesson follows current enemy intent');
 await page.evaluate(()=>{S=freshState();addItem('leather_cap',3);addItem('bread');addItem('oak_staff');S.locked=['oak_staff'];go('gear')});
 await page.locator('#gtools [data-invpref="layout"]').selectOption('list');
 assert.equal(await page.locator('#ginv.inventory-list .item-caption').count(),4);
 await page.locator('#gtools [data-invpref="filter"]').selectOption('equipped');assert.equal(await page.locator('#ginv [data-id]').count(),1);
 await page.locator('#gtools [data-invpref="filter"]').selectOption('all');
 await page.evaluate(()=>{S.bench=['leather_cap'];save()});
 await page.locator('[data-bulk="toggle"]').click();
 await page.locator('#ginv [data-id="iron_sword"]').click();await page.locator('#ginv [data-id="oak_staff"]').click();
 assert.equal(await page.evaluate(()=>salvageSelection.size),0);
 await page.locator('#ginv [data-id="leather_cap"]').click();await page.locator('[data-bulk="review"]').click();
 assert((await page.locator('#sheet').innerText()).includes('Leather Cap ×2'));
 await page.locator('[data-act="bulk-confirm"]').click();
 assert(await page.evaluate(()=>S.inv.leather_cap===1&&S.inv.iron_sword===1&&S.inv.oak_staff===1&&S.bench[0]==='leather_cap'));
 await page.reload();assert(await page.evaluate(()=>itemLocked('oak_staff')&&S.inventory.layout==='list'));
 await page.evaluate(()=>go('gear'));await page.locator('#ginv [data-id="oak_staff"]').click();
 await page.locator('[data-act="lock"]').click();assert(!await page.evaluate(()=>itemLocked('oak_staff')));await page.locator('[data-act="close"]').click();
 console.log('ok list/filter preferences, item locking, reserved ingredients and bulk salvage preview survive reload');
 await page.locator('#settingsBtn').click();assert(await page.locator('#v-settings').isVisible());assert(await page.locator('#exportBtn').isVisible());
 await page.locator('#settingsBack').click();assert(await page.locator('#v-gear').isVisible());
 assert.equal(await page.locator('#nav button').count(),5);assert.equal(await page.locator('#nav [data-view="battle"] span').textContent(),'Explore');
 for(const width of [320,390,1200]){await page.setViewportSize({width,height:900});for(const lang of ['en','de','ko']){await page.evaluate(lang=>{setLang(lang);go('forge')},lang);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${lang}`)}}
 await page.evaluate(()=>{setLang('en');go('gear');openSheet('iron_sword')});await page.locator('[data-act="close"]').focus();await page.keyboard.press('Tab');
 assert(await page.evaluate(()=>$('sheet').contains(document.activeElement)));await page.keyboard.press('Escape');if(await page.locator('#sheet').isVisible())await page.keyboard.press('Escape');assert(!await page.locator('#sheet').isVisible());
 console.log('ok Settings navigation, readable layouts in three languages and keyboard dialog focus');
 await page.evaluate(()=>{S=freshState();go('battle');const [x,y]=adjTiles(curMap())[0];step(x,y)});
 assert.equal(await page.evaluate(()=>S.battle.id),'sprite');
 await page.evaluate(()=>{for(let i=0;i<20&&!S.battle.over;i++)attack()});
 assert(await page.evaluate(()=>S.battle.over==='won'&&S.inv.coal===1&&S.onboarding===2));
 await page.evaluate(()=>{deconstruct('coal',()=>1);S.rp+=30;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');const id=essG('Fire',1);S.act='infuse';S.bench=['iron_sword',id];go('forge')});await page.locator('#combine').click(); // the opening forge needs Infusing, learned the same way
 assert(await page.evaluate(()=>S.onboarding===3&&gearOf('main').traits.Fire>0));
 await page.evaluate(()=>{S.battle=null;go('battle');const m=curMap(),[x,y]=adjTiles(m).find(([x,y])=>!poiAt(m,x,y));step(x,y)});
 assert.equal(await page.evaluate(()=>S.battle.id),'boar');await page.locator('#atk').click();
 assert(await page.evaluate(()=>S.battle.log.some(l=>/fire|Flames/.test(l.t))));
 assert(await page.evaluate(()=>{const old=JSON.parse(JSON.stringify(freshState()));delete old.onboarding;return loadSave(old).onboarding===null}));
 console.log('ok fresh opening reliably teaches loot, salvage, a guaranteed fire forge and its effect; a save without the field opts out');
 // a save import cannot inject markup: a hostile item name is shown as text on the forge and recipes views
 const evil='<img src=x onerror="window.__xss=1">';
 const code=await page.evaluate(evil=>{S=freshState();S.items.evil_blade={id:'evil_blade',name:evil,form:'blade',noun:'Blade',traits:{Fire:2},tier:1,crafted:true,recipe:['a','b'],recipeIds:[]};addItem('evil_blade');S.journal=[{id:'evil_blade',name:evil}];S.bench=['evil_blade'];return btoa(unescape(encodeURIComponent(JSON.stringify({...S,battle:null,event:null}))))},evil);
 await page.evaluate(()=>{go('settings');$('saved').open=true});await page.locator('#importBox').fill(code);await page.locator('#importBtn').click();await page.locator('#importBtn').click();
 await page.evaluate(()=>{go('forge');render();go('recipes');render()});
 assert(await page.locator('#rlist').innerText().then(t=>t.includes('<img src=x')));
 assert.equal(await page.evaluate(()=>window.__xss),undefined);
 console.log('ok an imported save with markup in an item name shows it as text');
 // a re-render keeps keyboard focus on the same control; with nothing focused it does not steal focus
 await page.evaluate(()=>{go('battle')});await page.locator('[data-view="forge"]').focus();
 await page.evaluate(()=>render());assert(await page.evaluate(()=>document.activeElement?.dataset.view==='forge'));
 await page.evaluate(()=>document.activeElement.blur());await page.evaluate(()=>render());
 assert(await page.evaluate(()=>document.activeElement===document.body));
 console.log('ok a re-render keeps focus on the control that had it');
 // the crucible actions: the locked ones name their technique; a satchel item the chosen action does not take is dimmed and says where it goes; the item sheet opens Infuse with its item in place
 await page.evaluate(()=>{S=freshState();S.rp=30;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');addItem('iron_sword');addItem('coal');addItem(essG('Fire',3));go('forge')});
 const tabs=await page.evaluate(()=>({open:[...document.querySelectorAll('#cacts [data-cact]')].map(b=>b.dataset.cact),locked:[...document.querySelectorAll('#cacts .locked')].map(b=>b.textContent.trim())}));
 assert.deepEqual(tabs.open,['forge','infuse']);assert.deepEqual(tabs.locked,['Improve · Improving','Fuse · Fusing','Refine · Refining','Cook · Cooking','Brew · Brewing','Alchemy · Alchemy']);
 await page.locator('[data-cact="infuse"]').click();assert.equal(await page.evaluate(()=>S.act),'infuse');assert(await page.locator('#crucible').isVisible()&&await page.locator('#patp').isHidden()&&await page.locator('#upgp').isHidden());
 await page.locator('#ftools [data-invpref="filter"]').selectOption('all'); // expose incompatible items explicitly for their explanation
 await page.locator('#finv [data-id="iron_sword"]').click();assert.deepEqual(await page.evaluate(()=>S.bench),['iron_sword']);
 assert(/go in Improve/.test(await page.locator('#finv [data-id="coal"]').getAttribute('data-tip'))&&await page.locator('#finv [data-id="coal"]').getAttribute('data-can')==='0');
 await page.locator('#finv [data-id="ess_Fire"]').click();assert.deepEqual(await page.evaluate(()=>S.bench),['iron_sword','ess_Fire']);
 assert.equal(await page.locator('#slots .slot.full').count(),2);assert.equal(await page.locator('#combine').textContent(),'Infuse');
 await page.evaluate(()=>{S.bench=[];go('gear');openSheet('iron_sword')});
 assert.equal(await page.locator('#sheet [data-into="infuse"]').count(),1);assert.equal(await page.locator('#sheet [data-into="improve"]').count(),0);
 await page.locator('#sheet [data-into="infuse"]').click();assert.deepEqual(await page.evaluate(()=>[S.act,S.view,S.bench]),['infuse','forge',['iron_sword']]);
 console.log('ok crucible actions: locked tabs name their technique, satchel items are placed or refused with the reason, and Infuse... opens with the item');
 // tap-again helper: the first tap arms, a second tap inside the window carries it out, then it is spent
 assert.deepEqual(await page.evaluate(()=>{armClear('t');return [armTap('t',3000),armTap('t',3000),armTap('t',3000)]}),[false,true,false]);
 console.log('ok armTap needs a second tap inside its window');
 // Additional review regressions are added here.
 // U-02: the selected Forge result and enabled action stay in the page flow; long explanations are collapsed.
 await page.evaluate(()=>{S=freshState();S.rp=40;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');addItem('iron_sword');const id=essG('Fire',3);addItem(id);S.act='infuse';S.bench=['iron_sword',id];go('forge')});
 for(const width of [320,390,1200]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>{const panel=$('crucible'),button=$('combine'),nav=$('nav'),style=getComputedStyle(panel),coveredByNav=innerWidth===390&&button.getBoundingClientRect().bottom>nav.getBoundingClientRect().top;return style.overflowY!=='auto'&&panel.scrollHeight<=panel.clientHeight+1&&button.getBoundingClientRect().bottom<=panel.getBoundingClientRect().bottom+1&&!coveredByNav}),`Forge action clipped or internally scrolling at ${width}px`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Forge overflow at ${width}px`);if(width===320){await page.locator('#combine').evaluate(el=>el.scrollIntoView({block:'center'}));assert(await page.evaluate(()=>$('combine').getBoundingClientRect().bottom<=$('nav').getBoundingClientRect().top))}}
 assert.equal(await page.locator('#combine').isDisabled(),false);assert.equal(await page.locator('#mixhint .compact-preview details[open]').count(),0);
 await page.locator('#combine').click();await page.evaluate(()=>{const ids=S.last.recipeIds;ids.forEach(id=>addItem(id));S.bench=ids.slice();render()});assert(await page.locator('#mixhint .compact-preview').count()>0);const odds=(await page.locator('#mixhint .cline .chip').allTextContents()).join(' ');assert(/\b[1-9]\d?%/.test(odds),`expected visible nonzero failure odds, got ${odds}`);assert(await page.locator('#forgeRecipeAccess [data-forge-load]').count()>0);await page.locator('#forgeRecipeAccess summary').click();await page.locator('#forgeRecipeAccess [data-forge-load]').first().click();assert(await page.evaluate(()=>S.bench.length>1&&S.act==='infuse'));
 console.log('ok compact Forge result and enabled action fit without an internal workbench scroll at 320, 390 and desktop widths');
 // U-05/U-03: Gear and Forge preferences are independent; pattern compatibility uses the shared Forge Satchel and empty filters recover.
 await page.evaluate(()=>{S=freshState();const mats=Object.keys(BASE).filter(id=>isBaseMat(id));addItem(mats[0]);const k=Object.keys(PATTERNS).find(k=>patSlots(k,false).some((slot,i)=>patFits(k,false,i,mats[0])));patSel={k,bp:false,m:Array(patSlots(k,false).length).fill(null)};go('gear')});
 await page.locator('#gtabs [data-tab-gear="material"]').click();await page.locator('#gtools [data-invpref="filter"]').selectOption('equipped');assert(await page.locator('#ginv [data-clear-invfilters="gear"]').isVisible());await page.locator('#ginv [data-clear-invfilters="gear"]').click();
 assert.equal(await page.evaluate(()=>inventoryPrefs('gear').category),'all');assert.equal(await page.evaluate(()=>inventoryPrefs('forge').category),'all');
 await page.evaluate(()=>{S.view='forge';S.act='forge';inventoryPrefs('forge').category='material';inventoryPrefs('forge').filter='craftable';render()});assert(await page.locator('#finv [data-id]').count()>0);assert(await page.locator('#finv [data-id]').first().getAttribute('data-can')==='1');
 assert(await page.evaluate(()=>{const old=freshState();old.tab='weapon';old.inventory={layout:'list',filter:'craftable',sort:'recent'};const s=loadSave(old);return s.inventory.gear.category==='weapon'&&s.inventory.forge.category==='weapon'&&s.inventory.gear.filter==='craftable'&&s.inventory.forge.filter==='craftable'}));
 console.log('ok Forge pattern compatibility, independent saved preferences, legacy migration and empty-filter recovery');
 await page.evaluate(()=>{S=freshState();S.techs=Object.fromEntries(TECHS.map(t=>[t.id,1]));S.view='forge';go('forge')});
 for(const action of ['infuse','improve','fuse','cook','brew','alchemy']){await page.locator(`[data-cact="${action}"]`).click();assert(await page.locator('#finv').isVisible());assert(await page.locator('#patp').isHidden());assert(await page.locator('#crucible').isVisible())}
 await page.locator('[data-cact="refine"]').click();assert(await page.locator('#forgeInventory').isHidden());assert(await page.locator('#upgp').isVisible());
 console.log('ok ingredient surface follows Infuse, Improve, Fuse, Cook, Brew and Alchemy; Refine shows grade controls without the Satchel');
 await page.evaluate(()=>{S=freshState();S.rp=40;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');const id=essG('Fire',3);addItem(id);S.act='infuse';S.bench=['iron_sword',id];S.journal=[{id:'iron_sword'}];go('forge')});assert((await page.locator('#mixhint').innerText()).includes('A fizzle would destroy'));assert((await page.locator('#mixhint .cline').innerText()).includes('15%'));assert(await page.locator('#combine').isEnabled());
 await page.evaluate(()=>{S=freshState();S.rp=40;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');S.unl.research=true;const a=essG('Fire',3),b=essG('Ice',3);addItem(a);addItem(b);S.act='infuse';S.bench=['iron_sword',a,b];go('forge')});assert((await page.locator('#mixhint .warn-text').innerText()).includes('Infusing II'));assert.equal(await page.locator('#combine').getAttribute('aria-disabled'),'true');
 console.log('ok equipped-destruction confirmation warning and research-blocked craft stay visible');
 assert.deepEqual(errors,[]);console.log('USABILITY CHECK OK');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
