// Deterministic asset preparation: registration, separation and authored masks.
// Artwork reconstruction is done with imagegen; this script never invents pixels.
const fs=require('node:fs'), path=require('node:path');
const {chromium}=require('playwright');
const {artServer}=require('./art-server');
const destination=path.resolve(__dirname,'../assets/hero/kit');
(async()=>{
  const {server,url}=await artServer(); let browser;
  try {
    browser=await chromium.launch(); const page=await browser.newPage();
    await page.goto(url+'/tools/hero-kit.html');
    const files=await page.evaluate(async()=>{
      const W=1024,H=1536, result={};
      const canvas=()=>Object.assign(document.createElement('canvas'),{width:W,height:H});
      const load=async file=>{const i=new Image();i.src='/assets/hero/'+file;await i.decode();return i};
      const save=(name,c)=>result[name]=c.toDataURL('image/png').split(',')[1];
      const polygon=(ctx,points)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()};
      const selection=(points,feather=0)=>{const c=canvas(),x=c.getContext('2d');x.fillStyle='white';if(feather)x.filter=`blur(${feather}px)`;polygon(x,points);return c};
      const cut=(source,mask,inverse=false)=>{const c=canvas(),x=c.getContext('2d');x.drawImage(source,0,0);x.globalCompositeOperation=inverse?'destination-out':'destination-in';x.drawImage(mask,0,0);return c};
      const gray=(name,mask)=>{const c=canvas(),x=c.getContext('2d');x.fillStyle='black';x.fillRect(0,0,W,H);x.drawImage(mask,0,0);save(name,c)};
      const base=await load('sources/hero-base-bald-v1.png');
      const torso=selection([[403,278],[419,285],[422,350],[477,366],[490,386],[500,365],[576,352],[589,281],[609,283],[604,328],[628,388],[612,455],[615,522],[635,586],[555,602],[468,606],[385,590],[403,526],[401,467],[377,401],[394,349]]);
      const trousers=selection([[387,579],[471,599],[555,595],[634,580],[649,647],[667,733],[682,824],[616,845],[542,844],[505,760],[474,844],[399,840],[325,822],[348,732],[364,648]]);
      const face=selection([[451,91],[470,83],[536,83],[557,93],[568,120],[567,157],[554,184],[535,204],[505,219],[478,205],[457,183],[443,156],[440,122]],1.5);
      const skin=canvas(),sx=skin.getContext('2d');sx.drawImage(base,0,0);for(const m of [torso,trousers,face]){sx.globalCompositeOperation='destination-out';sx.drawImage(m,0,0)}
      save('body.png',skin);save('underclothes-torso.png',cut(base,torso));save('underclothes-trousers.png',cut(base,trousers));
      const skinSelection=canvas(),sk=skinSelection.getContext('2d');sk.drawImage(skin,0,0);sk.globalCompositeOperation='source-in';sk.fillStyle='white';sk.fillRect(0,0,W,H);gray('mask-skin.png',skinSelection);
      for(const [id,file] of [['neutral','sources/hero-base-bald-v1.png'],['keen','hero-face-alt-01-review-v1.png'],['angular','sources/hero-face-angular-review-v1.png']]){
        const source=await load(file),layer=cut(source,face);save(`face-${id}.png`,layer);
        const eyes=canvas(),ex=eyes.getContext('2d');ex.fillStyle='white';
        // Iris rings only: keep pupil cores, whites, eyelids and upper highlights.
        const irisHeight=id==='angular'?3.6:id==='keen'?4.5:6;
        for(const [x,y,rx,ry] of [[474,138,6.2,irisHeight],[536,138,6.1,irisHeight]]){ex.beginPath();ex.ellipse(x,y,rx,ry,0,0,Math.PI*2);ex.fill();ex.globalCompositeOperation='destination-out';ex.beginPath();ex.ellipse(x,y-2,2.8,3.8,0,0,Math.PI*2);ex.fill();ex.globalCompositeOperation='source-over'}
        gray(`mask-eyes-${id}.png`,eyes);
        const fm=canvas(),fx=fm.getContext('2d');fx.drawImage(face,0,0);
        // Exclude eyes/whites, eyebrows and lips from skin recoloring.
        fx.globalCompositeOperation='destination-out';fx.fillStyle='white';fx.filter='blur(1.3px)';
        for(const points of [
          [[449,113],[462,111],[482,116],[495,125],[479,122],[458,119]],
          [[516,122],[535,113],[551,111],[558,118],[537,120],[517,126]],
          [[450,132],[464,128],[480,130],[494,138],[482,147],[465,146],[454,141]],
          [[515,137],[528,130],[545,128],[558,132],[554,142],[538,148],[522,146]],
          [[483,188],[497,181],[509,182],[524,188],[520,196],[495,198],[484,194]]
        ])polygon(fx,points);
        gray(`mask-face-${id}.png`,fm);
      }
      const hairSpecs=[
        ['cropped','hair-copper-cropped-v1.png',[413,20,185,181]],
        ['tousled','sources/hair-tousled-clean-v2.png',[380,15,245,245]],
        ['bob','sources/hair-bob-clean-v2.png',[403,25,202,225]]
      ];
      const registration={};
      for(const [id,file,target] of hairSpecs){
        const image=await load(file),probe=document.createElement('canvas');probe.width=image.width;probe.height=image.height;
        const px=probe.getContext('2d');px.drawImage(image,0,0);const d=px.getImageData(0,0,probe.width,probe.height).data;
        let left=image.width,top=image.height,right=0,bottom=0;
        for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(d[(y*image.width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
        const crop=[left,top,right-left+1,bottom-top+1];registration[id]={source:file,crop,target};
        const c=canvas(),x=c.getContext('2d');x.drawImage(image,...crop,...target);
        // These short styles stay entirely in front. A horizontal split would
        // create visible fringe seams where the bald base covers the rear layer.
        // Reserve an empty rear layer for future long styles and fitted gear.
        save(`hair-${id}-front.png`,c);save(`hair-${id}-back.png`,canvas());
        const m=canvas(),mx=m.getContext('2d');mx.drawImage(c,0,0);mx.globalCompositeOperation='source-in';mx.fillStyle='white';mx.fillRect(0,0,W,H);gray(`mask-hair-${id}.png`,m);
      }
      result['registration.json']=registration;
      return result;
    });
    fs.mkdirSync(destination,{recursive:true});
    for(const [name,data] of Object.entries(files))fs.writeFileSync(path.join(destination,name),name.endsWith('.json')?JSON.stringify(data,null,2)+'\n':Buffer.from(data,'base64'));
    console.log(`Prepared ${Object.keys(files).length} files in assets/hero/kit`);
  } finally {if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
