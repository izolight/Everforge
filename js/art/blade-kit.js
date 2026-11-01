/* Independent weapon recipes, inventory assemblies and fitted hero placement. */
(()=>{
  const images=new Map();
  const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  function image(url){
    if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(`Missing blade-kit art: ${url}`));i.src=url}));
    return images.get(url);
  }
  function normalize(m,raw={}){
    const r={};for(const key of ['blade','material','guard','grip','pommel'])r[key]=raw[key]??m.defaults[key];
    for(const [key,collection]of [['blade','blades'],['guard','guards'],['grip','grips'],['pommel','pommels']])if(!Object.hasOwn(m[collection],r[key]))r[key]=m.defaults[key];
    if(!Object.hasOwn(m.blades[r.blade].materials,r.material))r.material='steel';
    return r;
  }
  function componentIDs(m,raw){const r=normalize(m,raw);return{blade:m.blades[r.blade].materials[r.material],guard:m.guards[r.guard],grip:m.grips[r.grip],pommel:m.pommels[r.pommel]}}
  async function render(target,m,raw={},baseURL='../assets/weapons/blade-kit/'){
    const recipe=normalize(m,raw),parts=componentIDs(m,recipe);
    target.width=m.canvas.width;target.height=m.canvas.height;const x=target.getContext('2d');
    for(const slot of m.layerOrder)x.drawImage(await image(baseURL+m.components[parts[slot]].src),0,0);
    return recipe;
  }
  async function renderHeld(target,heroManifest,m,appearance={},equipment={},baseURL='../assets/weapons/blade-kit/',heroURL='../assets/hero/kit/'){
    const body=make(heroManifest.canvas.width,heroManifest.canvas.height);
    await HeroKit.render(body,heroManifest,appearance,heroURL);
    target.width=body.width;target.height=body.height;const x=target.getContext('2d'),bx=body.getContext('2d');
    const recipes={};
    for(const side of ['left','right']){
      if(!equipment[side])continue;
      const hand=m.hands[side],weapon=make(1024,1024);recipes[side]=await render(weapon,m,equipment[side],baseURL);
      bx.globalCompositeOperation='destination-out';bx.drawImage(await image(baseURL+hand.replace),0,0);
      x.save();x.translate(...hand.anchor);x.rotate(hand.rotationDegrees*Math.PI/180);x.scale(hand.scale,hand.scale);x.translate(-m.anchors.gripPivot[0],-m.anchors.gripPivot[1]);x.drawImage(weapon,0,0);x.restore();
    }
    x.drawImage(body,0,0);
    const recipe=HeroKit.normalize(heroManifest,appearance),skin=HeroKit.color(heroManifest,'skin',recipe.skin);
    for(const side of Object.keys(recipes)){
      const patch=make(body.width,body.height),px=patch.getContext('2d');px.drawImage(await image(baseURL+m.hands[side].patch),0,0);
      if(skin){const color=skin.match(/\w\w/g).map(c=>parseInt(c,16)),d=px.getImageData(0,0,patch.width,patch.height);for(let i=0;i<d.data.length;i+=4){if(!d.data[i+3])continue;const luma=.2126*d.data[i]+.7152*d.data[i+1]+.0722*d.data[i+2];for(let k=0;k<3;k++)d.data[i+k]=Math.min(255,color[k]*luma/heroManifest.tintReferenceLuma.skin)}px.putImageData(d,0,0)}
      x.drawImage(patch,0,0);
    }
    return{appearance:recipe,equipment:recipes};
  }
  function recipes(m){
    const all=[];for(const blade of Object.keys(m.blades))for(const material of Object.keys(m.blades[blade].materials))for(const guard of Object.keys(m.guards))for(const grip of Object.keys(m.grips))for(const pommel of Object.keys(m.pommels))all.push({blade,material,guard,grip,pommel});return all;
  }
  window.BladeKit={normalize,render,renderHeld,recipes,componentIDs};
})();
