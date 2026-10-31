// Register generated source components and author masks without repainting art.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {artServer}=require('./art-server');
const root=path.resolve(__dirname,'../assets/weapons/blade-kit');
(async()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
  const {server,url}=await artServer();let browser;
  try{
    browser=await chromium.launch();const page=await browser.newPage();await page.goto(url+'/tools/hero-kit.html');
    const exports=await page.evaluate(async m=>{
      const results={},registration={},W=m.canvas.width,H=m.canvas.height;
      const canvas=(w=W,h=H)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
      const image=async file=>{const i=new Image();i.src='/assets/weapons/blade-kit/'+file;await i.decode();return i};
      const save=(file,c)=>results[file]=c.toDataURL('image/png').split(',')[1];
      const grayscale=(source)=>{const c=canvas(source.width,source.height),x=c.getContext('2d');x.fillStyle='black';x.fillRect(0,0,c.width,c.height);const white=canvas(c.width,c.height),wx=white.getContext('2d');wx.drawImage(source,0,0);wx.globalCompositeOperation='source-in';wx.fillStyle='white';wx.fillRect(0,0,c.width,c.height);x.drawImage(white,0,0);return c};
      for(const [id,component]of Object.entries(m.components)){
        const source=await image(component.source),probe=canvas(source.width,source.height),px=probe.getContext('2d');px.drawImage(source,0,0);
        const d=px.getImageData(0,0,probe.width,probe.height).data;let left=probe.width,top=probe.height,right=-1,bottom=-1,clear=0;
        for(let y=0;y<probe.height;y++)for(let x=0;x<probe.width;x++){const a=d[(y*probe.width+x)*4+3];if(!a)clear++;if(a>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}}
        if(clear<probe.width*probe.height*.2||right<left)throw Error(`Source alpha needs cleanup: ${id}`);
        const crop=[left,top,right-left+1,bottom-top+1],c=canvas(),x=c.getContext('2d');x.drawImage(source,...crop,...component.target);
        save(component.src,c);
        if(component.trimMask){
          const primary=canvas(),trim=canvas(),p=primary.getContext('2d'),t=trim.getContext('2d');p.drawImage(c,0,0);t.drawImage(c,0,0);
          const pd=p.getImageData(0,0,W,H),td=t.getImageData(0,0,W,H);
          for(let i=0;i<pd.data.length;i+=4){const gold=pd.data[i]-pd.data[i+1]>15&&pd.data[i+1]-pd.data[i+2]>15;if(gold)pd.data[i+3]=0;else td.data[i+3]=0}
          p.putImageData(pd,0,0);t.putImageData(td,0,0);save(component.mask,grayscale(primary));save(component.trimMask,grayscale(trim));
        }else save(component.mask,grayscale(c));
        registration[id]={source:component.source,sourceSize:[probe.width,probe.height],crop,target:component.target};
      }
      const hands=await image('sources/hero-closed-grip-reference-v1.png');
      if(hands.width!==1024||hands.height!==1536)throw Error('Hand reference must retain hero canvas');
      const source=canvas(1024,1536),sx=source.getContext('2d');sx.drawImage(hands,0,0);
      for(const [side,hand]of Object.entries(m.hands)){
        const c=canvas(1024,1536),x=c.getContext('2d');x.drawImage(source,0,0);
        const pixels=x.getImageData(0,0,c.width,c.height),d=pixels.data,[left,top,width,height]=hand.region;
        for(let y=0;y<c.height;y++)for(let a=0;a<c.width;a++){
          const i=(y*c.width+a)*4;
          // The reference handle is neutral gray. Retain warm skin/outline only.
          if(a<left||a>=left+width||y<top||y>=top+height||d[i]-d[i+1]<8||d[i+1]-d[i+2]<5)d[i+3]=0;
        }
        x.putImageData(pixels,0,0);save(hand.patch,c);
        const replace=canvas(1024,1536),rx=replace.getContext('2d');rx.fillStyle='white';rx.fillRect(...hand.region);save(hand.replace,replace);
      }
      return{results,registration};
    },manifest);
    for(const [file,data]of Object.entries(exports.results)){const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,Buffer.from(data,'base64'))}
    fs.writeFileSync(path.join(root,'kit/registration.json'),JSON.stringify(exports.registration,null,2)+'\n');
    console.log(`Prepared ${Object.keys(exports.results).length} layers/masks and measured registration`);
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
