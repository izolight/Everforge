// Registration and masks only: all garment pixels come from retained imagegen PNGs.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {artServer}=require('./art-server');
const root=path.resolve(__dirname,'../assets/hero/clothing-kit');
(async()=>{
  const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),{server,url}=await artServer();let browser;
  try{
    browser=await chromium.launch();const page=await browser.newPage();await page.goto(url+'/tools/hero-kit.html');
    const output=await page.evaluate(async m=>{
      const result={},registration={},prepared=new Map(),make=(w=1024,h=1536)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
      for(const[id,part]of Object.entries(m.layers)){
        let i;
        if(part.fromLayer){i=prepared.get(part.fromLayer);if(!i)throw Error(`Unprepared source ${part.fromLayer}`)}
        else{i=new Image();i.src='/assets/hero/clothing-kit/'+part.source;await i.decode()}
        const source=make(i.width,i.height),sx=source.getContext('2d');sx.drawImage(i,0,0);
        const c=make(),x=c.getContext('2d');
        if(part.rows){
          // Measured vertical landmarks and horizontal fit, interpolated per row.
          for(let n=0;n<part.rows.length-1;n++){
            const[a,b]=[part.rows[n],part.rows[n+1]];
            for(let y=a[1];y<b[1];y++){
              const t=(y-a[1])/(b[1]-a[1]),sy=a[0]+t*(b[0]-a[0]),scale=a[2]+t*(b[2]-a[2]);
              x.drawImage(source,0,sy,i.width,(b[0]-a[0])/(b[1]-a[1]),505-i.width*scale/2,y,i.width*scale,1);
            }
          }
        }else if(part.fromLayer)x.drawImage(source,0,0);
        else x.drawImage(source,...part.crop,...part.target);
        if(part.sourcePatch){
          const p=part.sourcePatch,edit=new Image();edit.src='/assets/hero/clothing-kit/'+p.source;await edit.decode();
          const patch=make(),px=patch.getContext('2d');px.drawImage(edit,...p.crop,...p.target);
          const mask=make(),mx=mask.getContext('2d');mx.fillStyle='white';mx.filter=`blur(${p.feather||0}px)`;mx.beginPath();p.polygon.forEach(([a,b],n)=>n?mx.lineTo(a,b):mx.moveTo(a,b));mx.closePath();mx.fill();
          px.globalCompositeOperation='destination-in';px.drawImage(mask,0,0);px.drawImage(c,0,0);
          x.drawImage(patch,0,0);
        }
        if(part.horizontalFit){
          const fitted=make(),fx=fitted.getContext('2d'),rows=part.horizontalFit;
          for(let n=0;n<rows.length-1;n++)for(let y=rows[n][0];y<rows[n+1][0];y++){
            const t=(y-rows[n][0])/(rows[n+1][0]-rows[n][0]),scale=rows[n][1]+t*(rows[n+1][1]-rows[n][1]);
            fx.drawImage(c,0,y,1024,1,505-505*scale,y,1024*scale,1);
          }
          x.clearRect(0,0,1024,1536);x.drawImage(fitted,0,0);
        }
        if(part.polygon){
          const mask=make(),mx=mask.getContext('2d');mx.fillStyle='white';mx.beginPath();part.polygon.forEach(([a,b],n)=>n?mx.lineTo(a,b):mx.moveTo(a,b));mx.closePath();mx.fill();
          x.globalCompositeOperation='destination-in';x.drawImage(mask,0,0);x.globalCompositeOperation='source-over';
        }
        const polygons=(points)=>{const c=make(),cx=c.getContext('2d');cx.fillStyle='white';for(const poly of points){cx.beginPath();poly.forEach(([a,b],n)=>n?cx.lineTo(a,b):cx.moveTo(a,b));cx.closePath();cx.fill()}return c};
        if(part.polygons){x.globalCompositeOperation='destination-in';x.drawImage(polygons(part.polygons),0,0);x.globalCompositeOperation='source-over'}
        if(part.excludePolygons){x.globalCompositeOperation='destination-out';x.drawImage(polygons(part.excludePolygons),0,0);x.globalCompositeOperation='source-over'}
        const d=x.getImageData(0,0,1024,1536);let selected=0;
        for(let j=0;j<d.data.length;j+=4){
          if(part.selection==='gold-and-gems'){
            const[r,g,b]=d.data.slice(j,j+3),gold=r-g>15&&g-b>14&&r>b*1.5,gem=part.fromLayer==='robe'&&g-r>12&&b-r>8;
            if(!gold&&!gem)d.data[j+3]=0;
          }
          if(part.isolateIndigo && !(d.data[j+2]>d.data[j]+8 && d.data[j+1]<d.data[j]+10))d.data[j+3]=0;
          if(part.excludeGray){const hi=Math.max(...d.data.slice(j,j+3)),lo=Math.min(...d.data.slice(j,j+3));if(hi-lo<15)d.data[j+3]=0}
          if(d.data[j+3]>32)selected++;
        }
        x.putImageData(d,0,0);if(selected<100)throw Error(`Empty component ${id}`);
        prepared.set(id,c);
        result[part.src]=c.toDataURL().split(',')[1];
        // Opaque grayscale surface and gold-trim selections, registered to source alpha.
        for(const trim of [false,true]){
          const mask=make(),mx=mask.getContext('2d'),md=mx.createImageData(1024,1536);
          for(let j=0;j<d.data.length;j+=4){
            // Plain material bases contain no metal. Utility pieces retain their
            // yellow metal hardware while their brown/purple strap surfaces tint.
            const r=d.data[j],g=d.data[j+1],b=d.data[j+2];
            const gold=part.tintGroup?(part.role!=='base'&&r>110&&g>r*.68&&r-g>15&&g-b>14):(r-g>18&&g-b>18);
            const value=(trim?gold:!gold)?d.data[j+3]:0;md.data[j]=md.data[j+1]=md.data[j+2]=value;md.data[j+3]=255}
          mx.putImageData(md,0,0);result[trim?part.trimMask:part.mask]=mask.toDataURL().split(',')[1];
        }
        registration[id]={...part,sourceSize:[i.width,i.height],selectedPixels:selected};
      }
      return{result,registration};
    },m);
    for(const[file,data]of Object.entries(output.result))fs.writeFileSync(path.join(root,file),Buffer.from(data,'base64'));
    fs.writeFileSync(path.join(root,'kit/registration.json'),JSON.stringify(output.registration,null,2)+'\n');
    console.log(`Prepared ${Object.keys(m.layers).length} registered layers and surface/trim masks`);
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
