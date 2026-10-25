#!/usr/bin/env node
// Player objectives, save recovery and build feedback through the real UI.
const {chromium}=require('playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('file://'+path.resolve(__dirname,'../index.html'));
 await page.evaluate(()=>{S=freshState();const fire=essG('Fire',3);addItem(fire);S.bench=['iron_sword',fire];forgeIt(S.bench.map(id=>S.items[id]));go('recipes')});
 await page.locator('[data-pin-recipe]').click();
 assert(await page.locator('#pinnedGoal').innerText().then(t=>t.includes('Fire Essence')&&t.includes('Ember Coal')&&t.includes('Possible drops')));
 const pin=await page.evaluate(()=>S.pinned);await page.reload();assert.deepEqual(await page.evaluate(()=>S.pinned),pin);
 await page.evaluate(()=>{$('pinnedGoal').open=true});await page.locator('[data-source-zone="woods"]').first().click();
 assert.equal(await page.evaluate(()=>S.view),'battle');
 await page.evaluate(()=>{S.hints=[0,0];go('recipes')});await page.locator('[data-pin-rumor="0"]').click();
 assert(await page.locator('#pinnedGoal').innerText().then(t=>t.includes('Light Essence')&&!t.includes('Sweet Essence')&&!t.includes('Iron Helmet')&&t.includes('2 ingredients')));
 await page.evaluate(()=>{S.hints.push(0);render()});assert(await page.locator('#pinnedGoal').innerText().then(t=>t.includes('Sweet Essence')&&!t.includes('Iron Helmet')));
 await page.locator('[data-unpin]').click();assert(await page.locator('#pinnedGoal').isHidden());
 console.log('ok recipes and rumors pin through the UI, persist, reveal only known ingredients and link to sources');
 await page.evaluate(()=>{S=freshState();S.quest=TUTORIAL.length;go('battle')});
 assert.equal(await page.evaluate(()=>S.bounty),null);await page.locator('#chooseBounty').click();
 assert.equal(await page.locator('[data-act="bounty"]').count(),3);
 const choices=await page.evaluate(()=>S.bountyChoices);assert.equal(new Set(choices.map(b=>b.kind==='forge'?'forge':b.enemy)).size,3);
 await page.locator('[data-act="close"]').click();await page.reload();await page.locator('#chooseBounty').click();
 assert.deepEqual(await page.evaluate(()=>S.bountyChoices),choices);
 await page.evaluate(()=>{const b=S.bountyChoices[0];S.kills[b.enemy]=(S.kills[b.enemy]||0)+7});
 await page.locator('[data-act="bounty"][data-index="0"]').click();
 assert(await page.evaluate(()=>!goal().done&&goal().prog==='0/'+S.bounty.need));
 await page.evaluate(()=>{S.kills[S.bounty.enemy]+=S.bounty.need;render()});
 const before=await page.evaluate(()=>S.xp);await page.locator('#claim').click();assert.equal(await page.evaluate(()=>S.xp),before+choices[0].reward.xp);
 assert.equal(await page.locator('#claim').count(),0);await page.locator('#chooseBounty').click();assert.equal(await page.locator('[data-act="bounty"]').count(),3);
 await page.locator('[data-act="close"]').click();
 console.log('ok three stable bounty choices survive reload, start progress on acceptance and pay once');
 await page.evaluate(()=>{S=freshState();S.onboarding=null;S.unl.ability=1;S.seen['i:ability']=true;S.seen['a:blade']=true;go('battle');startBattle('boar',{rar:'normal',afx:[]});S.battle.hp=S.battle.max=200;S.battle.atk=0;S.hp=pstats().maxHp});
 await page.locator('#guard').click();
 assert(await page.locator('.build-opportunity').innerText().then(t=>t.includes('Guard →')));
 assert(await page.locator('[data-ability="blade"]').innerText().then(t=>t.includes('Empowered')));
 await page.locator('[data-ability="blade"]').click();
 assert(await page.locator('.build-moment').innerText().then(t=>t.includes('Guard paid off')));
 assert(!await page.evaluate(()=>S.battle.braced));
 await page.locator('#guard').click();assert.equal(await page.locator('.build-moment').count(),0);
 await page.evaluate(()=>{S.battle.braced=true;S.battle.wd=10000;S.battle.afx=['ward'];S.battle.rar='magic';delete S.battle.buildMoment;attack()});
 assert.equal(await page.locator('.build-moment').count(),0);
 console.log('ok Guard highlights ready abilities, celebrates damage and clears feedback after the next action');
 // An export discards the battle; its opening stage must be resumable.
 await page.evaluate(()=>{S=freshState();go('battle');const [x,y]=adjTiles(curMap())[0];step(x,y);S.battle=null;save()});await page.reload();
 await page.evaluate(()=>{const [x,y]=adjTiles(curMap()).find(([x,y])=>!poiAt(curMap(),x,y));step(x,y)});
 assert.equal(await page.evaluate(()=>S.battle.opening),1);
 await page.evaluate(()=>{S.battle=null;S.onboarding=4;S.eq.main='iron_sword';save()});await page.reload();
 await page.evaluate(()=>{const [x,y]=adjTiles(curMap()).find(([x,y])=>!poiAt(curMap(),x,y));step(x,y)});
 assert(await page.evaluate(()=>S.onboarding===3&&S.battle?.opening!==2));
 const migrated=await page.evaluate(()=>{const old=JSON.parse(JSON.stringify(freshState()));delete old.pinned;delete old.bountyChoices;delete old.onboarding;const a=migrate(old);return{pin:a.pinned,choices:a.bountyChoices,opening:a.onboarding}});
 assert.deepEqual(migrated,{pin:null,choices:[],opening:null});
 assert(await page.evaluate(()=>{const s=freshState();s.pinned={kind:'rumor',id:999};s.bountyChoices=[{kind:'hunt',need:2,reward:{items:['ess:Missing']}}];const m=migrate(s);return m.pinned===null&&m.bountyChoices.length===0}));
 await page.evaluate(()=>{S=freshState();S.quest=TUTORIAL.length;S.bounty={kind:'forge',need:2,base:0,reward:{items:['ess:Fire'],xp:20}};save()});await page.reload();
 assert(await page.evaluate(()=>S.bounty.kind==='forge'&&goal().prog==='0/2'));
 console.log('ok discarded opening fights recover; the follow-up waits for an equipped fire weapon; older saves opt out');
 for(const width of [360,390,1200]){await page.setViewportSize({width,height:844});for(const lang of ['en','de','ko']){
   await page.evaluate(lang=>{S=freshState();S.quest=TUTORIAL.length;S.hints=[0,0,0];window.__miss=new Set();setLang(lang);go('recipes');pinGoal('rumor',0)},lang);
   assert(await page.locator('[data-pin-rumor="0"]').evaluate(el=>el.getBoundingClientRect().width>=44&&el.getBoundingClientRect().height>=44));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`pinned overflow ${width} ${lang}`);
   await page.evaluate(()=>showBounties());assert(await page.evaluate(()=>$('sheet').scrollWidth<=$('sheet').clientWidth),`bounty overflow ${width} ${lang}`);
   assert.deepEqual(await page.evaluate(()=>[...window.__miss].filter(k=>!PROC.has(k))),[]);await page.locator('[data-act="close"]').click();
 }}
 assert.deepEqual(errors,[]);console.log('OBJECTIVES CHECK OK (360px, 390px, desktop; English, German, Korean)');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
