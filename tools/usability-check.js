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
 await page.evaluate(()=>{S=freshState();const id=essG('Fire',3);addItem(id);S.bench=['iron_sword',id];go('forge')});
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
 // Additional review regressions are added here.
 assert.deepEqual(errors,[]);console.log('USABILITY CHECK OK');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
