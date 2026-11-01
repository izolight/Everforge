const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {artServer}=require('./art-server');
(async()=>{
 const {server,url}=await artServer();let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1240,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/tools/clothing-kit.html');await page.evaluate(()=>clothingReady);
  const result=await page.evaluate(async()=>{
   const m=clothingManifest,hm=clothingHeroManifest,bm=clothingBladeManifest,canvas=()=>document.createElement('canvas');
   const hash=(c,region=[0,0,1024,1536])=>{let h=2166136261;for(const v of c.getContext('2d').getImageData(...region).data)h=Math.imul(h^v,16777619);return h>>>0};
   const render=async(e={},a={})=>{const c=canvas();await ClothingKit.render(c,hm,bm,m,a,e);return c};
   const naked={outfit:'none',boots:'none',gloves:'none',helmet:'none',shield:'none',charm:'none',left:'empty',right:'empty'};
   const original=canvas();await HeroKit.render(original,hm);if(hash(original)!==hash(await render(naked)))throw Error('Empty wardrobe changes hero');
   const first=await render(),again=await render(JSON.parse(JSON.stringify(m.defaults)));if(hash(first)!==hash(again))throw Error('Non-deterministic wardrobe');
   for(const key of Object.keys(m.defaults))if(ClothingKit.normalize(m,{[key]:'__proto__'})[key]!==m.defaults[key])throw Error(`Invalid ${key} fallback`);
   if(ClothingKit.normalize(m,{shield:'kite',left:'crystal'}).left!=='empty')throw Error('Shield did not occupy left hand');
   const shieldA=await render({shield:'kite',left:'crystal'}),shieldB=await render({shield:'kite',left:'empty'});if(hash(shieldA)!==hash(shieldB))throw Error('Weapon drawn through shield');
   let fits=0;const outfits=new Set();
   for(const outfit of ['tunic','robe','plate']){
    outfits.add(hash(await render({outfit})));
    let helmetHead;
    for(const hair of Object.keys(hm.hairs)){
     const c=await render({outfit,helmet:'iron'},{hair}),head=hash(c,[0,0,1024,250]);if(helmetHead!==undefined&&head!==helmetHead)throw Error('Hair visible beneath helmet');helmetHead=head;fits++;
    }
    const booted=await render({outfit,boots:'leather'}),bare=await render({outfit,boots:'none'});
    if(outfit==='robe'&&hash(booted,[480,1200,60,170])!==hash(bare,[480,1200,60,170]))throw Error('Boots drawn above robe hem');
   }
   if(outfits.size!==3)throw Error('Outfits indistinguishable');
   for(const side of ['left','right'])for(const weapon of ['standard','short','crystal']){
    const e={left:'empty',right:'empty',[side]:weapon},c=await render(e),[x,y]=bm.hands[side].anchor;
    if(c.getContext('2d').getImageData(x,y,1,1).data[3]<200)throw Error(`Empty glove grip ${side}`);fits++;
   }
   const warm=await render({},{}),umber=await render({},{skin:'umber'});
   for(const region of [[195,705,48,45],[758,705,48,45]])if(hash(warm,region)!==hash(umber,region))throw Error('Skin tint changes gloves');
   // Upgrades must retain the same base and change pixels only under new overlays.
   let transitions=0;
   for(const outfit of ['tunic','robe','plate']){
    let previousRecipe,previousCanvas,previousLayers;
    const ids=[outfit,'boot-left','boot-right','glove-left','glove-right'];
    for(const preset of Object.values(m.presets)){
     const r=ClothingKit.normalize(m,{...m.defaults,outfit,...preset}),layers=ids.flatMap(id=>ClothingKit.assemblyLayers(m,id,r)),c=await render(r);
     for(const id of ids)if(ClothingKit.assemblyLayers(m,id,r)[0]!==m.assemblies[id].base[0])throw Error('Upgrade replaced base');
     if(previousRecipe){
      if(previousLayers.some(id=>!layers.includes(id)))throw Error('Upgrade removed an earlier layer');
      const support=canvas();support.width=1024;support.height=1536;const sx=support.getContext('2d');
      for(const id of layers.filter(id=>!previousLayers.includes(id))){const i=new Image();i.src='../assets/hero/clothing-kit/'+m.layers[id].src;await i.decode();sx.drawImage(i,0,0)}
      const a=previousCanvas.getContext('2d').getImageData(0,0,1024,1536).data,b=c.getContext('2d').getImageData(0,0,1024,1536).data,s=sx.getImageData(0,0,1024,1536).data;let changed=0;
      for(let j=0;j<a.length;j+=4)if(a[j]!==b[j]||a[j+1]!==b[j+1]||a[j+2]!==b[j+2]||a[j+3]!==b[j+3]){changed++;if(!s[j+3])throw Error(`Upgrade repainted base outside new layers: ${outfit}`)}
      if(changed<100)throw Error('Invisible upgrade');transitions++;
     }
     previousRecipe=r;previousCanvas=c;previousLayers=layers;
    }
   }
   // Shared trousers cover the thighs exposed by plain split hems.
   const padded=await render({outfit:'plate',boots:'none'});
   for(const [x,y]of [[380,850],[640,850]]){const d=padded.getContext('2d').getImageData(x,y,1,1).data;if(d[2]<=d[0]||d[3]<200)throw Error('Exposed thigh beneath plain hem')}
   // Dyes reuse assets, preserve alpha/shading, and cannot affect skin or metal.
   let dyes=0;
   const layerCanvas=async(id,r)=>{const c=canvas();c.width=1024;c.height=1536;c.getContext('2d').drawImage(await ClothingKit.layer(m,id,ClothingKit.normalize(m,r)),0,0);return c};
   for(const [id,group]of [['tunic-base','fabric'],['robe-base','fabric'],['plate-base','fabric'],['boot-left-base','leatherColor'],['glove-left-base','leatherColor'],['tunic-belt','leatherColor']]){
    const original=await layerCanvas(id,{}),a=original.getContext('2d').getImageData(0,0,1024,1536).data;
    const mask=new Image();mask.src='../assets/hero/clothing-kit/'+m.layers[id].mask;await mask.decode();const mc=canvas();mc.width=1024;mc.height=1536;mc.getContext('2d').drawImage(mask,0,0);const selection=mc.getContext('2d').getImageData(0,0,1024,1536).data;
    for(const color of Object.keys(m.palettes[group]).filter(v=>v!=='original')){
     const c=await layerCanvas(id,{[group]:color}),b=c.getContext('2d').getImageData(0,0,1024,1536).data,shades=new Set();let changed=0;
     for(let j=0;j<a.length;j+=4){if(a[j+3]!==b[j+3])throw Error('Dye changed alpha');if(!selection[j]&&(a[j]!==b[j]||a[j+1]!==b[j+1]||a[j+2]!==b[j+2]))throw Error('Dye leaked outside mask');if(b[j+3]>200)shades.add((b[j]<<16)|(b[j+1]<<8)|b[j+2]);if(a[j]!==b[j]||a[j+1]!==b[j+1]||a[j+2]!==b[j+2])changed++}
     if(changed<100||shades.size<30)throw Error('Dye lost shading or failed to recolor');dyes++;
    }
   }
   for(const id of ['robe-ornament','plate-cuirass','charm'])if(hash(await layerCanvas(id,{}))!==hash(await layerCanvas(id,{fabric:'rust',leatherColor:'charcoal'})))throw Error('Dye changed metal or gems');
   const dyed=await render({fabric:'rust',leatherColor:'charcoal'});if(hash(dyed,[0,0,1024,250])!==hash(first,[0,0,1024,250]))throw Error('Clothing dye changed appearance');
   if(hash(dyed)!==hash(await render({fabric:'rust',leatherColor:'charcoal'})))throw Error('Non-deterministic dye');
   const fittedRobe=await layerCanvas('robe-base',{}),chest=fittedRobe.getContext('2d').getImageData(0,402,1024,1).data;
   let chestLeft=1024,chestRight=-1;for(let x=0;x<1024;x++)if(chest[x*4+3]>128){chestLeft=Math.min(chestLeft,x);chestRight=Math.max(chestRight,x)}
   const chestCenter=(chestLeft+chestRight)/2;
   if(chestRight-chestLeft>280||Math.abs(chestCenter-505)>25)throw Error('Robe bodice exceeds shared body fit');
   let masks=0;
   for(const[id,part]of Object.entries(m.layers))for(const key of ['src','mask','trimMask']){
    const i=new Image();i.src='../assets/hero/clothing-kit/'+part[key];await i.decode();if(i.width!==1024||i.height!==1536)throw Error(`Unregistered ${id}`);
    const c=canvas();c.width=1024;c.height=1536;const x=c.getContext('2d');x.drawImage(i,0,0);
    if(key==='src'){if(x.getImageData(0,0,1,1).data[3]||x.getImageData(1023,1535,1,1).data[3])throw Error('Opaque canvas corners')}
    else{const d=x.getImageData(0,0,1024,1536).data;let selected=0;for(let j=0;j<d.length;j+=4){if(d[j]!==d[j+1]||d[j]!==d[j+2]||d[j+3]!==255)throw Error('Invalid grayscale mask');selected+=d[j]>0}if(key==='mask'&&!selected)throw Error(`Empty surface mask ${id}`);masks++}
   }
   try{await ClothingKit.render(canvas(),hm,bm,m,{}, {},'../missing-clothing/');throw Error('Missing file did not reject')}catch(e){if(!e.message.startsWith('Missing clothing art:'))throw e}
   return{layers:Object.keys(m.layers).length,masks,fits,outfits:outfits.size,transitions,dyes};
  });
  assert.deepEqual(result,{layers:34,masks:68,fits:15,outfits:3,transitions:6,dyes:21});
  await page.selectOption('#equipment-fabric','rust');await page.selectOption('#equipment-leatherColor','charcoal');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('clothing-kit-preview')).equipment.leatherColor==='charcoal');
  await page.click('#preset-decorated');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('clothing-kit-preview')).equipment.ornament==='gold');
  await page.selectOption('#equipment-shield','kite');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('clothing-kit-preview')).equipment.shield==='kite');assert.equal(await page.locator('#equipment-left').isDisabled(),true);
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('clothing-kit-preview')).equipment);
  await page.selectOption('#appearance-face','angular');await page.selectOption('#appearance-skin','umber');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('clothing-kit-preview')).appearance.skin==='umber');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('clothing-kit-preview')).equipment),before);
  await page.reload();await page.evaluate(()=>clothingReady);assert.equal(await page.locator('#equipment-shield').inputValue(),'kite');assert.equal(await page.locator('#appearance-face').inputValue(),'angular');assert.equal(await page.locator('#equipment-fabric').inputValue(),'rust');assert.equal(await page.locator('#equipment-leatherColor').inputValue(),'charcoal');
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['clothing-kit-preview']);
  await page.click('#reset');await page.waitForFunction(()=>window.clothingReady);await page.evaluate(()=>clothingReady);
  const review=path.resolve(__dirname,'../assets/hero/clothing-kit/review');await page.locator('#proofs').screenshot({path:path.join(review,'outfits-v2.png')});await page.locator('#overview').screenshot({path:path.join(review,'plain-fit-v2.png')});await page.locator('#components').screenshot({path:path.join(review,'components-v2.png')});await page.locator('#progression').screenshot({path:path.join(review,'progression-v2.png')});await page.locator('#dyes').screenshot({path:path.join(review,'dyes-v3.png')});
  await page.setViewportSize({width:375,height:844});await page.screenshot({path:path.join(review,'mobile-v2.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log('Clothing kit OK',result,'plus persistence, appearance independence, missing-file error and mobile layout');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
