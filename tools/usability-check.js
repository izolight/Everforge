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
 await page.evaluate(()=>{S=freshState();S.rp=20;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');const id=essG('Fire',3);addItem(id);S.bench=['iron_sword',id];go('forge')}); // Infusing, learned the normal way: its group, a slot technique, then Infusing (any slot)
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
 await page.evaluate(()=>{deconstruct('coal',()=>1);S.rp+=20;learnTech('weaponcraft');learnTech('blade');learnTech('infuse');const id=essG('Fire',1);S.bench=['iron_sword',id];go('forge')});await page.locator('#combine').click(); // the opening forge needs Infusing, learned the same way
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
 // tap-again helper: the first tap arms, a second tap inside the window carries it out, then it is spent
 assert.deepEqual(await page.evaluate(()=>{armClear('t');return [armTap('t',3000),armTap('t',3000),armTap('t',3000)]}),[false,true,false]);
 console.log('ok armTap needs a second tap inside its window');
 // Additional review regressions are added here.
 assert.deepEqual(errors,[]);console.log('USABILITY CHECK OK');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
