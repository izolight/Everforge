// Checks the raster appearance proof independently of the existing SVG game hero.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {artServer}=require('./art-server');
(async()=>{
  const {server,url}=await artServer();let browser;
  try{
    browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1240,height:950},deviceScaleFactor:1}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url+'/tools/hero-kit.html');await page.evaluate(()=>window.kitReady);
    assert.equal(await page.locator('#swaps .tile').count(),9);
    const results=await page.evaluate(async()=>{
      const m=window.kitManifest,make=()=>document.createElement('canvas');
      const base=make();await HeroKit.render(base,m);const body=base.getContext('2d').getImageData(0,280,1024,1256).data;
      const renders=new Set();let count=0;
      for(const face of Object.keys(m.faces))for(const hair of Object.keys(m.hairs)){
        const c=make();await HeroKit.render(c,m,{face,hair});const x=c.getContext('2d'),d=x.getImageData(0,280,1024,1256).data;
        if(d.some((v,i)=>v!==body[i]))throw Error(`Body changed for ${face}/${hair}`);
        if(x.getImageData(0,0,1,1).data[3]!==0)throw Error('Nontransparent corner');
        const first=c.toDataURL();await HeroKit.render(c,m,{face,hair});if(c.toDataURL()!==first)throw Error('Nondeterministic render');
        renders.add(first);count++;
      }
      const unknown=HeroKit.normalize(m,{face:'missing',hair:'missing',skin:'missing'});
      if(unknown.face!==m.defaults.face||unknown.hair!==m.defaults.hair||unknown.skin!==m.defaults.skin)throw Error('Fallback failed');
      const original=base.toDataURL(),variants=[];
      for(const recipe of [{eyes:'teal'},{skin:'umber'},{hairColor:'silver'}]){const c=make();await HeroKit.render(c,m,recipe);variants.push(c.toDataURL()!==original)}
      const custom=HeroKit.normalize(m,{skin:'#AbC',hairColor:'#123456',eyes:'#ABCDEF'});
      if(custom.skin!=='#aabbcc'||custom.hairColor!=='#123456'||custom.eyes!=='#abcdef')throw Error('Custom color normalization failed');
      for(const value of ['#12','#gggggg','red','__proto__',null,42])if(HeroKit.normalize(m,{skin:value}).skin!==m.defaults.skin)throw Error('Invalid color fallback failed');
      for(const [key,name]of [['skin','umber'],['hairColor','silver']]){
        const preset=make(),direct=make();await HeroKit.render(preset,m,{[key]:name});await HeroKit.render(direct,m,{[key]:m.palettes[key][name]});
        if(preset.toDataURL()!==direct.toDataURL())throw Error('Custom color differs from palette equivalent');
        const a=base.getContext('2d').getImageData(0,0,1024,1536).data,b=direct.getContext('2d').getImageData(0,0,1024,1536).data;
        for(let i=3;i<a.length;i+=4)if(a[i]!==b[i])throw Error('Custom tint changed alpha');
        if(key==='hairColor'&&b.slice(280*1024*4).some((v,i)=>v!==body[i]))throw Error('Hair tint changed body');
      }
      const files=new Set([m.body,...Object.values(m.clothing),...Object.values(m.masks)]);
      for(const f of Object.values(m.faces))for(const k of ['src','skinMask','eyeMask'])files.add(f[k]);
      for(const h of Object.values(m.hairs))for(const k of ['front','back','mask'])files.add(h[k]);
      for(const file of files){const img=new Image();img.src='../assets/hero/kit/'+file;await img.decode();if(img.width!==1024||img.height!==1536)throw Error(`Unregistered dimensions: ${file}`)}
      return{count,distinct:renders.size,variants,files:files.size};
    });
    assert.equal(results.distinct,9);assert(results.variants.every(Boolean));
    await page.selectOption('#face','angular');await page.selectOption('#hair','bob');
    await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('angular / bob'));
    await page.locator('#skinCustom').fill('#704832');await page.locator('#hairColorCustom').fill('#355577');
    await page.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem('hero-kit-preview'));return r.skin==='#704832'&&r.hairColor==='#355577'});
    await page.reload();await page.evaluate(()=>window.kitReady);
    assert.equal(await page.locator('#skinCustom').inputValue(),'#704832');assert.equal(await page.locator('#hairColorCustom').inputValue(),'#355577');
    assert.equal(await page.locator('#skin').inputValue(),'custom');
    assert.equal(await page.locator('#face').inputValue(),'angular');assert.equal(await page.locator('#hair').inputValue(),'bob');
    await page.click('#reset');await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('neutral / cropped'));
    const out=path.resolve(__dirname,'../assets/hero/review');fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'appearance-proof-v1.png'),fullPage:true});
    await page.evaluate(async()=>{
      const panel=document.createElement('div');panel.id='closeup-proof';panel.style.cssText='display:grid;grid-template-columns:repeat(3,280px);gap:12px;padding:16px;background:#171821;width:max-content';
      document.body.append(panel);
      const recipes=[];for(const face of Object.keys(kitManifest.faces))for(const hair of Object.keys(kitManifest.hairs))recipes.push({face,hair});
      recipes.push({skin:'umber',eyes:'teal',hairColor:'silver'},{skin:'rose',eyes:'amber',hairColor:'ebony'},{face:'angular',hair:'bob',skin:'umber',eyes:'amber',hairColor:'ebony'});
      for(const recipe of recipes){
        const full=document.createElement('canvas');await HeroKit.render(full,kitManifest,recipe);
        const tile=document.createElement('div'),label=document.createElement('p'),c=document.createElement('canvas');
        c.width=280;c.height=280;c.style.background='#e9e4dd';c.getContext('2d').drawImage(full,365,0,280,280,0,0,280,280);
        label.textContent=Object.values(recipe).join(' / ');label.style.fontSize='12px';tile.append(c,label);panel.append(tile);
      }
    });
    await page.locator('#closeup-proof').screenshot({path:path.join(out,'heads-proof-v1.png')});
    await page.locator('#closeup-proof').evaluate(element=>element.remove());
    await page.setViewportSize({width:360,height:800});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
    console.log(`ok ${results.count} deterministic combinations, invariant body, ${results.files} registered assets, recolor masks, fallback, save/reload and mobile layout`);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
