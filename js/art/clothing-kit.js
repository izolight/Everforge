/* Fitted wardrobe proof. Recipes stay separate from hero appearance and game saves. */
(()=>{
  const images=new Map(),make=()=>Object.assign(document.createElement('canvas'),{width:1024,height:1536});
  const tintedLayers=new Map();
  function image(url){if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(`Missing clothing art: ${url}`));i.src=url}));return images.get(url)}
  function normalize(m,raw={}){
    const r={};for(const key of Object.keys(m.defaults))r[key]=m.choices[key].includes(raw[key])?raw[key]:m.defaults[key];
    // A shield occupies the image-left hand; recipes never silently draw both.
    if(r.shield==='kite')r.left='empty';return r;
  }
  function assemblyLayers(m,id,r){
    const a=m.assemblies[id];if(!a)return[id];
    return m.upgradeOrder.flatMap(group=>group==='base'||r[group]!=='none'?a[group]:[]);
  }
  async function layer(m,id,r,base='../assets/hero/clothing-kit/'){
    const part=m.layers[id],color=part.tintGroup&&m.palettes[part.tintGroup][r[part.tintGroup]];
    if(!color)return image(base+part.src);
    const key=JSON.stringify([base+part.src,part.mask,color,part.tintReferenceLuma]);
    if(!tintedLayers.has(key))tintedLayers.set(key,HeroKit.tinted(base+part.src,base+part.mask,color,part.tintReferenceLuma));
    return tintedLayers.get(key);
  }
  async function render(target,hm,bm,m,appearance={},raw={},base='../assets/hero/clothing-kit/'){
    const r=normalize(m,raw),body=make(),bx=body.getContext('2d');
    await HeroKit.render(body,hm,appearance,'../assets/hero/kit/',{hideHair:r.helmet!=='none',hideUnderclothes:r.outfit!=='none'});
    target.width=1024;target.height=1536;const x=target.getContext('2d');
    const draw=async(id,ctx=x)=>ctx.drawImage(await layer(m,id,r,base),0,0);
    const assembly=async id=>{for(const layer of assemblyLayers(m,id,r))await draw(layer)};
    const occupied={};
    for(const side of ['left','right']){
      const closed=r[side]!=='empty'||r.gloves!=='none'||(side==='left'&&r.shield!=='none');
      if(closed){bx.globalCompositeOperation='destination-out';bx.drawImage(await image('../assets/weapons/blade-kit/'+bm.hands[side].replace),0,0);bx.globalCompositeOperation='source-over';occupied[side]=true}
      if(r[side]==='empty')continue;
      const weapon=make(),hand=bm.hands[side];await BladeKit.render(weapon,bm,m.weapons[r[side]]);
      x.save();x.translate(...hand.anchor);x.rotate(hand.rotationDegrees*Math.PI/180);x.scale(hand.scale,hand.scale);x.translate(-bm.anchors.gripPivot[0],-bm.anchors.gripPivot[1]);x.drawImage(weapon,0,0);x.restore();
    }
    if(r.boots!=='none'){
      bx.clearRect(275,1360,160,155);bx.clearRect(580,1360,170,155);
    }
    x.drawImage(body,0,0);
    if(r.outfit==='tunic'||r.outfit==='plate')await draw('trousers-base');
    if(r.boots!=='none'){await assembly('boot-left');await assembly('boot-right')}
    if(r.outfit!=='none')await assembly(r.outfit);
    if(r.charm!=='none')await draw('charm');
    if(r.helmet!=='none')await draw('helmet');
    const app=HeroKit.normalize(hm,appearance),skin=hm.palettes.skin[app.skin];
    for(const side of Object.keys(occupied)){
      if(r.gloves!=='none'){await assembly('glove-'+side);continue}
      const c=make(),cx=c.getContext('2d');cx.drawImage(await image('../assets/weapons/blade-kit/'+bm.hands[side].patch),0,0);
      if(skin){const rgb=skin.match(/\w\w/g).map(v=>parseInt(v,16)),d=cx.getImageData(0,0,1024,1536);for(let i=0;i<d.data.length;i+=4){if(!d.data[i+3])continue;const l=.2126*d.data[i]+.7152*d.data[i+1]+.0722*d.data[i+2];for(let k=0;k<3;k++)d.data[i+k]=Math.min(255,rgb[k]*l/hm.tintReferenceLuma.skin)}cx.putImageData(d,0,0)}x.drawImage(c,0,0);
    }
    if(r.shield!=='none')await draw('shield');
    return{appearance:app,equipment:r};
  }
  window.ClothingKit={normalize,render,assemblyLayers,layer};
})();
