// Shared raster recoloring: every exported part, mask isolation, recipes and workbench controls.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {artServer}=require('./art-server');
(async()=>{
 const {server,url}=await artServer();let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:375,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/tools/clothing-kit.html');await page.evaluate(()=>clothingReady);
  const result=await page.evaluate(async()=>{
   const cm=clothingManifest,bm=clothingBladeManifest,hm=clothingHeroManifest;
   const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   const load=async path=>{const img=new Image();img.src=path;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);return c};
   let parts=0,masks=0;
   for(const [base,collection]of [['../assets/hero/clothing-kit/',cm.layers],['../assets/weapons/blade-kit/',bm.components]])for(const [id,descriptor]of Object.entries(collection)){
    const original=pixels(await load(base+descriptor.src));
    for(const channel of ['all','surface','trim']){
     const maskFile=channel==='surface'?descriptor.mask:channel==='trim'?descriptor.trimMask:null;if(channel==='trim'&&!maskFile)continue;
     const selection=maskFile?pixels(await load(base+maskFile)):null;
     const tinted=pixels(await HeroKit.part(base,descriptor,{[channel]:'#4790c2'}));let changed=0,selected=0;const shades=new Set();
     for(let i=0;i<original.length;i+=4){
      if(original[i+3]!==tinted[i+3])throw Error('Alpha changed: '+id);
      const selectedHere=(!selection||selection[i]>0)&&original[i+3]>0;if(selectedHere)selected++;
      const differs=original[i]!==tinted[i]||original[i+1]!==tinted[i+1]||original[i+2]!==tinted[i+2];
      if(differs){changed++;if(!selectedHere)throw Error('Tint escaped mask: '+id)}
      if(tinted[i+3]>200&&selectedHere)shades.add(tinted[i]+','+tinted[i+1]+','+tinted[i+2]);
     }
     if(selected>20&&(changed<10||shades.size<3))throw Error('Tint ineffective or lost shading: '+id+'/'+channel);
     if(channel==='all')parts++;else masks++;
    }
    const restored=pixels(await HeroKit.part(base,descriptor,{all:'original',surface:'original',trim:'original'}));if(restored.some((v,i)=>v!==original[i]))throw Error('Original changed: '+id);
   }
   // A per-layer original override must defeat a shared fabric dye.
   const untouched=pixels(await ClothingKit.layer(cm,'tunic-base',ClothingKit.normalize(cm,{})));
   const override=pixels(await ClothingKit.layer(cm,'tunic-base',ClothingKit.normalize(cm,{fabric:'#f00',colors:{'tunic-base':{surface:'original'}}})));
   if(override.some((v,i)=>v!==untouched[i]))throw Error('Part override did not bypass group dye');
   const whole=pixels(await ClothingKit.layer(cm,'tunic-base',ClothingKit.normalize(cm,{colors:{'tunic-base':{all:'#369'}}})));
   const wholeWithGroup=pixels(await ClothingKit.layer(cm,'tunic-base',ClothingKit.normalize(cm,{fabric:'#f00',colors:{'tunic-base':{all:'#369'}}})));
   if(whole.some((v,i)=>v!==wholeWithGroup[i]))throw Error('Group dye defeated whole-part override');
   const trimPart=bm.components['guard-straight-v1'],trimBase='../assets/weapons/blade-kit/';
   const protectedTrim=pixels(await HeroKit.part(trimBase,trimPart,{all:'#f00',trim:'original'})),trimSource=pixels(await load(trimBase+trimPart.src)),trimMask=pixels(await load(trimBase+trimPart.trimMask));
   for(let i=0;i<trimSource.length;i+=4)if(trimMask[i]===255&&trimSource[i+3])for(let k=0;k<3;k++)if(protectedTrim[i+k]!==trimSource[i+k])throw Error('Original trim did not restore source');
   // Shared path also works on a standalone asset with no authored masks.
   const wolf=await HeroKit.part('../assets/creatures/',{src:'frost-wolf-v1.png'},{all:'#7a4cba'});if(!wolf.width)throw Error('Standalone asset failed');
   const normalized=ClothingKit.normalize(cm,{fabric:'#AbC',colors:{helmet:{all:'#f00'},missing:{all:'#fff'},shield:{all:'bad'}}});
   if(normalized.fabric!=='#aabbcc'||normalized.colors.helmet.all!=='#ff0000'||normalized.colors.missing||normalized.colors.shield)throw Error('Color normalization failed');
   const make=()=>document.createElement('canvas');
   const weapon=make(),plain=make();await BladeKit.render(weapon,bm,{colors:{blade:{all:'#f00'},grip:{surface:'#369'}}});await BladeKit.render(plain,bm);
   const plainPixels=pixels(plain);if(!pixels(weapon).some((v,i)=>v!==plainPixels[i]))throw Error('Weapon recipe ignored colors');
   const hero=make();const app=await HeroKit.render(hero,hm,{colors:{torso:{all:'#369'},trousers:{all:'#963'}}});if(app.colors.torso.all!=='#336699')throw Error('Underclothes recipe lost');
   const loadout={outfit:'none',boots:'none',gloves:'none',helmet:'none',shield:'none',charm:'none',left:'standard',right:'short'};
   const base=make(),dyed=make();await ClothingKit.render(base,hm,bm,cm,{},loadout);
   const returned=await ClothingKit.render(dyed,hm,bm,cm,{}, {...loadout,weaponColors:{left:{blade:{all:'#f00'}}}});
   const a=pixels(base),b=pixels(dyed);let changed=0;
   for(let y=0;y<1536;y++)for(let x=0;x<1024;x++){const i=(y*1024+x)*4;for(let k=0;k<4;k++)if(a[i+k]!==b[i+k]){changed++;if(x>512)throw Error('Left weapon dye changed the right hand')}}
   if(changed<100||returned.equipment.weaponColors.left.blade.all!=='#ff0000')throw Error('Wardrobe dropped weapon colors');
   return{parts,masks};
  });
  assert.equal(result.parts,45);
  await page.getByText('Wardrobe part colors',{exact:true}).click();
  await page.getByLabel('Wardrobe part colors part',{exact:true}).selectOption('tunic-base');
  await page.getByLabel('Wardrobe part colors all color',{exact:true}).fill('#7c4261');
  await page.locator('#equipment-fabricCustom').fill('#456789');
  await page.waitForFunction(()=>{const s=JSON.parse(localStorage.getItem('clothing-kit-preview'));return s.equipment.colors?.['tunic-base']?.all==='#7c4261'&&s.equipment.fabric==='#456789'});
  await page.reload();await page.evaluate(()=>clothingReady);
  await page.getByText('Wardrobe part colors',{exact:true}).click();await page.getByLabel('Wardrobe part colors part',{exact:true}).selectOption('tunic-base');
  assert.equal(await page.getByLabel('Wardrobe part colors all color',{exact:true}).inputValue(),'#7c4261');assert.equal(await page.locator('#equipment-fabric').inputValue(),'custom');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1240,height:1100});await page.screenshot({path:require('node:path').resolve(__dirname,'../assets/hero/clothing-kit/review/runtime-colors-v1.png')});
  await page.setViewportSize({width:375,height:844});
  await page.goto(url+'/tools/blade-kit.html');await page.evaluate(()=>bladeReady);
  await page.getByText('Weapon part colors',{exact:true}).click();await page.getByLabel('Weapon part colors all color',{exact:true}).fill('#8755bb');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('blade-kit-preview')).recipe.colors?.blade?.all==='#8755bb');
  await page.click('#equip-left');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('blade-kit-preview')).equipment.left.colors?.blade?.all==='#8755bb');
  await page.reload();await page.evaluate(()=>bladeReady);await page.getByText('Weapon part colors',{exact:true}).click();
  assert.equal(await page.getByLabel('Weapon part colors all color',{exact:true}).inputValue(),'#8755bb');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('ok',result,'standalone raster, original restoration, validation, custom group dyes, underclothes, equipped weapon colors, UI persistence and mobile layout');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
