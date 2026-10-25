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
 // Additional review regressions are added here.
 assert.deepEqual(errors,[]);console.log('USABILITY CHECK OK');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
