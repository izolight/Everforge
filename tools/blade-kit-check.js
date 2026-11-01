// Validates recipe coverage, assembly joins, masks and both held positions.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {artServer}=require('./art-server');
(async()=>{
 const {server,url}=await artServer();let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1240,height:1000},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/tools/blade-kit.html');await page.evaluate(()=>window.bladeReady);
  assert.equal(await page.locator('#recipes .tile').count(),40);
  const result=await page.evaluate(async()=>{
   const m=bladeManifest,hm=bladeHeroManifest,canvas=()=>document.createElement('canvas'),all=BladeKit.recipes(m),unique=new Set(),counts={};
   const hash=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=2166136261;for(const v of d)h=Math.imul(h^v,16777619);return h>>>0};
   const alpha=(c,x,y)=>c.getContext('2d').getImageData(x,y,1,1).data[3];
   for(const r of all){
    counts[r.material]=(counts[r.material]||0)+1;const c=canvas();await BladeKit.render(c,m,r);const first=hash(c);unique.add(first);
    for(const y of [730,758,890,905])if(alpha(c,512,y)<100)throw Error(`Disconnected assembly at ${y}: ${JSON.stringify(r)}`);
    if(alpha(c,0,0)||alpha(c,1023,1023))throw Error('Nontransparent assembly corner');
    await BladeKit.render(c,m,JSON.parse(JSON.stringify(r)));if(hash(c)!==first)throw Error('Recipe not deterministic');
   }
   if(BladeKit.normalize(m,{blade:'short',material:'crystal'}).material!=='steel')throw Error('Unsupported material fallback');
   for(const key of ['blade','guard','grip','pommel'])if(BladeKit.normalize(m,{[key]:'__proto__'})[key]!==m.defaults[key])throw Error(`Unknown ${key} fallback`);
   // Every component and relevant recolor region is registered and masks are grayscale.
   let masks=0;
   for(const part of Object.values(m.components))for(const key of ['src','mask','trimMask']){
    if(!part[key])continue;const i=new Image();i.src='../assets/weapons/blade-kit/'+part[key];await i.decode();
    if(i.width!==1024||i.height!==1024)throw Error('Unregistered component dimensions');
    if(key!=='src'){const c=canvas();c.width=1024;c.height=1024;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,1024,1024).data;let selected=0;
     for(let j=0;j<d.length;j+=4){if(d[j]!==d[j+1]||d[j]!==d[j+2]||d[j+3]!==255)throw Error('Mask is not opaque grayscale');if(d[j])selected++}if(!selected)throw Error('Empty material mask');masks++;
    }
   }
   const original=canvas();await HeroKit.render(original,hm);const empty=canvas();await BladeKit.renderHeld(empty,hm,m,{},{});if(hash(empty)!==hash(original))throw Error('Empty loadout changes appearance');
   const custom=canvas(),named=canvas(),loadout={left:{blade:'standard'},right:{blade:'short'}};
   await BladeKit.renderHeld(custom,hm,m,{skin:hm.palettes.skin.umber},loadout);await BladeKit.renderHeld(named,hm,m,{skin:'umber'},loadout);
   if(hash(custom)!==hash(named))throw Error('Custom skin did not reach held hand patches');
   const head=original.getContext('2d').getImageData(0,0,1024,280).data;
   let fits=0;
   for(const recipe of [{blade:'short'},{blade:'standard'},{blade:'broad'},{blade:'standard',material:'wood'},{blade:'standard',material:'crystal'}])for(const side of ['left','right']){
    const c=canvas();await BladeKit.renderHeld(c,hm,m,{}, {[side]:recipe});const d=c.getContext('2d').getImageData(0,0,1024,280).data;if(d.some((v,i)=>v!==head[i]))throw Error('Weapon placement changes appearance');
    const [x,y]=m.hands[side].anchor;if(alpha(c,x,y)<180)throw Error(`Empty held pivot: ${side}`);fits++;
   }
   return{count:all.length,distinct:unique.size,counts,masks,fits};
  });
  assert.equal(result.distinct,40);assert.deepEqual(result.counts,{steel:24,wood:8,crystal:8});
  await page.selectOption('#parts-material','wood');await page.click('#equip-left');
  await page.waitForFunction(()=>document.getElementById('loadout').textContent.includes('left: standard wood'));
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('blade-kit-preview')).equipment);
  await page.selectOption('#appearance-face','angular');await page.selectOption('#appearance-hair','bob');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('blade-kit-preview')).appearance.hair==='bob');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('blade-kit-preview')).equipment),before);
  await page.reload();await page.evaluate(()=>window.bladeReady);
  assert.equal(await page.locator('#parts-material').inputValue(),'wood');assert.equal(await page.locator('#appearance-face').inputValue(),'angular');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('blade-kit-preview')).equipment),before);
  await page.selectOption('#parts-blade','short');assert.equal(await page.locator('#parts-material').inputValue(),'steel');
  assert(await page.locator('#parts-material option[value="crystal"]').evaluate(e=>e.disabled));
  await page.click('#reset');await page.evaluate(()=>window.bladeReady);
  const out=path.resolve(__dirname,'../assets/weapons/blade-kit/review');fs.mkdirSync(out,{recursive:true});
  await page.locator('#overview').screenshot({path:path.join(out,'blade-fit-v1.png')});
  await page.locator('#recipes').screenshot({path:path.join(out,'blade-recipes-v1.png')});
  await page.locator('#fit-proof').screenshot({path:path.join(out,'blade-appearances-v1.png')});
  await page.setViewportSize({width:360,height:800});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log(`ok ${result.count} distinct deterministic recipes, contiguous joins, ${result.masks} grayscale masks, ${result.fits} hand fits, independent appearance, reload, fallbacks and mobile layout`);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
